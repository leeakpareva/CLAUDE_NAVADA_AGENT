/**
 * NAVADA Prospect Pipeline: Daily Orchestrator
 * Runs: scrape → verify emails → check inbox → follow-ups → escalation → report
 * Schedule: integrate with existing pipeline.js or run standalone
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });
const path = require('path');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const db = require('./prospect-db');
const scraper = require('./lead-scraper');
const emailFinder = require('./email-finder');
const outreach = require('./outreach');
const { sendEmail, p, table, kvList, callout } = require(path.join(__dirname, '..', 'Automation', 'email-service'));

// ─── INBOX CHECKER (IMAP) ────────────────────────────────────

function connectImap() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.ZOHO_USER,
      password: process.env.ZOHO_APP_PASSWORD,
      host: 'imap.zoho.eu',
      port: 993,
      tls: true,
    });
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
    imap.connect();
  });
}

async function checkInbox() {
  console.log('\n[inbox] Checking for prospect replies...');

  let imap;
  try {
    imap = await connectImap();
  } catch (err) {
    console.error('[inbox] IMAP connection failed:', err.message);
    return { replies: 0 };
  }

  return new Promise((resolve) => {
    imap.openBox('INBOX', true, (err) => {
      if (err) {
        console.error('[inbox] Failed to open inbox:', err.message);
        imap.end();
        resolve({ replies: 0 });
        return;
      }

      // Search last 3 days
      const since = new Date();
      since.setDate(since.getDate() - 3);

      imap.search([['SINCE', since]], async (err, uids) => {
        if (err || !uids || uids.length === 0) {
          console.log('[inbox] No recent emails found');
          imap.end();
          resolve({ replies: 0 });
          return;
        }

        let replies = 0;
        const fetch = imap.fetch(uids, { bodies: '', struct: true });
        const messages = [];

        fetch.on('message', (msg) => {
          let buffer = '';
          msg.on('body', (stream) => {
            stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
            stream.once('end', () => { messages.push(buffer); });
          });
        });

        fetch.once('end', async () => {
          for (const raw of messages) {
            try {
              const parsed = await simpleParser(raw);
              const fromAddr = parsed.from?.value?.[0]?.address?.toLowerCase();
              if (!fromAddr) continue;

              // Check if sender matches any prospect contact
              const contact = await db.getContactByEmail(fromAddr);
              if (!contact) continue;

              // Check if already tracked
              const existingEmails = await db.getEmailsByContact(contact.id);
              const alreadyTracked = existingEmails.some(
                e => e.direction === 'inbound' && e.subject === parsed.subject
              );
              if (alreadyTracked) continue;

              // Track the reply
              const company = await db.getCompanyById(contact.company_id);
              await db.createEmail({
                contact_id: contact.id,
                company_id: contact.company_id,
                direction: 'inbound',
                email_type: 'reply',
                subject: parsed.subject,
                body_preview: (parsed.text || '').substring(0, 500),
                message_id: parsed.messageId,
                status: 'received',
                sent_at: parsed.date?.toISOString() || new Date().toISOString(),
                actor: 'system',
              });

              // Mark outbound emails as replied
              await db.markEmailReplied(contact.id);

              // Update company status
              if (company && company.status !== 'replied') {
                await db.updateCompany(company.id, { status: 'replied', actor: 'system' });
              }

              // Alert Lee
              await sendEmail({
                to: 'leeakpareva@gmail.com',
                subject: `Prospect Reply: ${company?.company_name || 'Unknown'} | ${contact.full_name}`,
                heading: 'Prospect Response Received',
                body: `
                  ${p(`<strong>${contact.full_name}</strong> (${contact.role || 'Unknown role'}) at <strong>${company?.company_name || 'Unknown'}</strong> replied.`)}
                  ${callout(`<strong>Subject:</strong> ${parsed.subject}<br><br>${(parsed.text || '').substring(0, 500)}`, 'info')}
                  ${p('Check your inbox and respond directly.')}
                `,
                type: 'alert',
                preheader: `Reply from ${contact.full_name} at ${company?.company_name}`,
              });

              console.log(`  [reply] ${contact.full_name} (${company?.company_name}) replied: ${parsed.subject}`);
              replies++;
            } catch (err) {
              // Skip unparseable emails
            }
          }

          imap.end();
          console.log(`[inbox] Found ${replies} prospect replies`);
          resolve({ replies });
        });
      });
    });
  });
}

// ─── ESCALATION ──────────────────────────────────────────────

async function escalateCold() {
  console.log('\n[escalation] Checking for cold prospects...');

  // Contacts with follow-up 2 sent 4+ days ago, still no reply → mark as cold
  const { rows: coldProspects } = await db.pool.query(`
    SELECT DISTINCT pe.company_id, pc.full_name, pco.company_name, pco.id as coid
    FROM prospect_emails pe
    JOIN prospect_contacts pc ON pe.contact_id = pc.id
    JOIN prospect_companies pco ON pe.company_id = pco.id
    WHERE pe.direction = 'outbound'
      AND pe.email_type = 'followup_2'
      AND pe.replied_at IS NULL
      AND pe.sent_at < NOW() - INTERVAL '4 days'
      AND pco.status NOT IN ('replied', 'not_fit', 'cold')
      AND NOT EXISTS (
        SELECT 1 FROM prospect_emails pe2
        WHERE pe2.contact_id = pe.contact_id AND pe2.direction = 'inbound'
      )
  `);

  let escalated = 0;
  for (const prospect of coldProspects) {
    await db.updateCompany(prospect.coid, { status: 'cold', priority: 5, actor: 'system' });
    await db.logAudit('company', prospect.coid, 'status_changed',
      `Escalated to cold: no response after follow-up 2`, { actor: 'system' });
    console.log(`  [cold] ${prospect.company_name} | no response after all follow-ups`);
    escalated++;
  }

  console.log(`[escalation] ${escalated} companies marked as cold`);
  return { escalated };
}

// ─── DAILY REPORT ────────────────────────────────────────────

async function generateReport(runResults) {
  console.log('\n[report] Generating daily summary...');

  const stats = await db.getProspectStats();
  const recentAudit = await db.getRecentAudit(20);

  // Build stats section
  const statsHtml = kvList([
    ['Total Companies', stats.total_companies],
    ['Total Contacts', stats.total_contacts],
    ['Verified Emails', stats.verified_emails],
    ['Emails Sent', stats.emails_sent],
    ['Replies Received', stats.replies_received],
    ['Response Rate', stats.response_rate],
  ]);

  // Build status breakdown
  const statusRows = stats.companies_by_status.map(s => [
    s.status,
    s.count.toString(),
  ]);

  // Build today's activity
  const activityRows = [];
  if (runResults.scraper) {
    activityRows.push(['Lead Scraper', `${runResults.scraper.totalContacts} contacts enriched`]);
  }
  if (runResults.emailFinder) {
    activityRows.push(['Email Finder', `${runResults.emailFinder.found} found, ${runResults.emailFinder.verified} verified`]);
  }
  if (runResults.inbox) {
    activityRows.push(['Inbox Check', `${runResults.inbox.replies} replies detected`]);
  }
  if (runResults.drafts) {
    activityRows.push(['Drafts', `${runResults.drafts.intros} intros + ${runResults.drafts.followups} follow-ups drafted`]);
  }
  if (runResults.sent) {
    activityRows.push(['Sent', `${runResults.sent.sent} approved emails sent`]);
  }
  if (runResults.escalation) {
    activityRows.push(['Escalation', `${runResults.escalation.escalated} marked cold`]);
  }

  // Recent audit entries
  const auditRows = recentAudit.slice(0, 10).map(a => [
    a.entity_type,
    a.action,
    (a.detail || '').substring(0, 80),
    new Date(a.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  ]);

  const body = `
    ${p('Daily prospect pipeline report for NAVADA.')}

    <h3 style="margin:20px 0 10px 0; font-size:15px; color:#111;">Pipeline Stats</h3>
    ${statsHtml}

    <h3 style="margin:20px 0 10px 0; font-size:15px; color:#111;">Status Breakdown</h3>
    ${table(['Status', 'Count'], statusRows)}

    <h3 style="margin:20px 0 10px 0; font-size:15px; color:#111;">Today's Activity</h3>
    ${activityRows.length > 0
      ? table(['Step', 'Result'], activityRows)
      : callout('No activity today', 'info')}

    <h3 style="margin:20px 0 10px 0; font-size:15px; color:#111;">Recent Audit Trail</h3>
    ${auditRows.length > 0
      ? table(['Entity', 'Action', 'Detail', 'Time'], auditRows)
      : callout('No recent audit entries', 'info')}
  `;

  await sendEmail({
    to: 'leeakpareva@gmail.com',
    subject: `Prospect Pipeline: Daily Report (${new Date().toLocaleDateString('en-GB')})`,
    heading: 'Prospect Pipeline Report',
    body,
    type: 'report',
    preheader: `${stats.total_companies} companies, ${stats.verified_emails} verified, ${stats.response_rate} response rate`,
  });

  console.log('[report] Daily summary sent to Lee');
}

// ─── MAIN ORCHESTRATOR ───────────────────────────────────────

async function run() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  NAVADA Prospect Pipeline: Daily Run   ║');
  console.log('║  ' + new Date().toISOString().padEnd(37) + '║');
  console.log('╚════════════════════════════════════════╝\n');

  await db.initSchema();

  const results = {};

  // Step 1: Run lead scraper (enrich new companies)
  console.log('── Step 1: Lead Scraper ──────────────────');
  try {
    results.scraper = await scraper.run();
  } catch (err) {
    console.error('[pipeline] Scraper error:', err.message);
    results.scraper = { totalEmails: 0, totalContacts: 0 };
  }

  // Step 2: Run email finder (Hunter.io)
  console.log('\n── Step 2: Email Finder ──────────────────');
  try {
    results.emailFinder = await emailFinder.run();
  } catch (err) {
    console.error('[pipeline] Email finder error:', err.message);
    results.emailFinder = { found: 0, verified: 0 };
  }

  // Step 3: Check inbox for replies
  console.log('\n── Step 3: Inbox Check ──────────────────');
  try {
    results.inbox = await checkInbox();
  } catch (err) {
    console.error('[pipeline] Inbox check error:', err.message);
    results.inbox = { replies: 0 };
  }

  // Step 4: Draft new intros + follow-ups (await Lee's approval)
  console.log('\n── Step 4: Draft Outreach ──────────────');
  try {
    const introResults = await outreach.draftBatchIntros('job');
    const followUpResults = await outreach.draftBatchFollowUps();
    results.drafts = {
      intros: introResults.drafted,
      followups: followUpResults.drafted,
    };
  } catch (err) {
    console.error('[pipeline] Drafting error:', err.message);
    results.drafts = { intros: 0, followups: 0 };
  }

  // Step 4b: Send any previously approved drafts
  console.log('\n── Step 4b: Send Approved ──────────────');
  try {
    results.sent = await outreach.sendApproved();
  } catch (err) {
    console.error('[pipeline] Send error:', err.message);
    results.sent = { sent: 0, failed: 0 };
  }

  // Step 5: Escalate cold prospects
  console.log('\n── Step 5: Escalation ──────────────────');
  try {
    results.escalation = await escalateCold();
  } catch (err) {
    console.error('[pipeline] Escalation error:', err.message);
    results.escalation = { escalated: 0 };
  }

  // Step 6: Send approval digest (if drafts pending)
  console.log('\n── Step 6: Approval Digest ─────────────');
  try {
    await outreach.sendApprovalDigest();
  } catch (err) {
    console.error('[pipeline] Approval digest error:', err.message);
  }

  // Step 7: Generate daily report
  console.log('\n── Step 7: Daily Report ────────────────');
  try {
    await generateReport(results);
  } catch (err) {
    console.error('[pipeline] Report error:', err.message);
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Pipeline Complete                     ║');
  console.log('╚════════════════════════════════════════╝\n');

  return results;
}

// ─── EXPORTS ─────────────────────────────────────────────────

module.exports = {
  checkInbox,
  escalateCold,
  generateReport,
  run,
};

// ─── CLI ─────────────────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2];
  (async () => {
    try {
      if (cmd === 'run' || !cmd) {
        await run();
      } else if (cmd === 'inbox') {
        await db.initSchema();
        await checkInbox();
      } else if (cmd === 'escalate') {
        await db.initSchema();
        await escalateCold();
      } else if (cmd === 'report') {
        await db.initSchema();
        await generateReport({});
      } else {
        console.log('Usage:');
        console.log('  node prospect-pipeline.js [run]     # Full daily pipeline');
        console.log('  node prospect-pipeline.js inbox      # Check inbox only');
        console.log('  node prospect-pipeline.js escalate   # Run escalation only');
        console.log('  node prospect-pipeline.js report     # Generate report only');
      }
    } catch (err) {
      console.error('[prospect-pipeline] Error:', err.message);
    } finally {
      await db.pool.end();
    }
  })();
}
