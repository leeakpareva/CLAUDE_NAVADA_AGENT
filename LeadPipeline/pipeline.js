/**
 * NAVADA Lead Pipeline — Main Engine
 * Runs on schedule: monitors responses, sends reminders, generates reports
 *
 * Task Scheduler: Daily at 8:30 AM
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });
const leads = require('./leads');
const logger = require('./logger');
const db = require('./db');
const path = require('path');
const fs = require('fs');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const LOG_FILE = path.join(__dirname, 'logs', 'pipeline.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] [PIPELINE] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { /* ignore */ }
}

// ─── RESPONSE MONITOR ─────────────────────────────────────────

async function checkForResponses() {
  log('Checking inbox for lead responses...');

  const allLeads = leads.getAllLeads();
  const watchedEmails = allLeads
    .filter(l => l.contact_email && l.status !== 'lost')
    .map(l => ({ id: l.id, email: l.contact_email.toLowerCase(), company: l.company }));

  if (watchedEmails.length === 0) {
    log('No leads with emails to watch');
    return;
  }

  return new Promise((resolve) => {
    const imap = new Imap({
      user: process.env.ZOHO_USER,
      password: process.env.ZOHO_APP_PASSWORD,
      host: 'imap.zoho.eu',
      port: 993,
      tls: true,
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { log(`IMAP error: ${err.message}`); imap.end(); resolve(); return; }

        const since = new Date();
        since.setDate(since.getDate() - 3);

        imap.search(['ALL', ['SINCE', since]], (err, results) => {
          if (err || !results || results.length === 0) {
            log('No recent emails to check');
            imap.end();
            resolve();
            return;
          }

          const fetch = imap.fetch(results, { bodies: '', struct: true });
          const emails = [];

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              let buffer = '';
              stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
              stream.on('end', () => emails.push(buffer));
            });
          });

          fetch.once('end', async () => {
            imap.end();

            for (const raw of emails) {
              try {
                const parsed = await simpleParser(raw);
                const fromAddr = parsed.from?.value?.[0]?.address?.toLowerCase() || '';

                for (const watched of watchedEmails) {
                  if (fromAddr === watched.email) {
                    // Check if already tracked
                    const existing = db.prepare(
                      "SELECT id FROM emails WHERE lead_id = ? AND direction = 'inbound' AND from_addr = ?"
                    ).get(watched.id, fromAddr);

                    if (!existing) {
                      log(`NEW RESPONSE: ${watched.company} (${fromAddr})`);
                      leads.trackEmailReceived(watched.id, fromAddr, parsed.subject, (parsed.text || '').substring(0, 500));

                      // Alert Lee
                      await sendAlert(watched, parsed);
                    }
                  }
                }
              } catch (e) { log(`Parse error: ${e.message}`); }
            }
            resolve();
          });
        });
      });
    });

    imap.once('error', (err) => { log(`IMAP error: ${err.message}`); resolve(); });
    imap.connect();
  });
}

// ─── ALERT EMAIL ──────────────────────────────────────────────

async function sendAlert(watched, parsed) {
  try {
    const { sendEmail, p, callout } = require(path.join(__dirname, '..', 'Automation', 'email-service'));
    await sendEmail({
      to: 'leeakpareva@gmail.com',
      subject: `Lead Response: ${watched.company} has replied`,
      heading: 'Lead Pipeline — Response Alert',
      body: `
        ${p(`<strong>${watched.company}</strong> (${watched.email}) has responded.`)}
        ${callout(`<strong>Subject:</strong> ${parsed.subject}<br><br><strong>Preview:</strong><br>${(parsed.text || '').substring(0, 500).replace(/\n/g, '<br>')}`, 'info')}
        ${p('The lead status has been automatically updated to <strong>responded</strong> in the pipeline.')}
      `,
      type: 'alert',
      fromName: 'Claude | NAVADA',
      preheader: `${watched.company} responded to your outreach`,
    });
    log(`Alert sent to Lee for ${watched.company}`);
  } catch (e) {
    log(`Alert email failed: ${e.message}`);
  }
}

// ─── STALE LEAD CHECK ─────────────────────────────────────────

function checkStaleness() {
  log('Checking for stale leads...');

  const staleLeads = db.prepare(`
    SELECT l.*, MAX(e.timestamp) as last_event
    FROM leads l LEFT JOIN events e ON l.id = e.lead_id
    WHERE l.status NOT IN ('won', 'lost', 'archived')
    GROUP BY l.id
    HAVING last_event < datetime('now', '-7 days') OR last_event IS NULL
  `).all();

  for (const lead of staleLeads) {
    logger.logEvent(lead.id, 'stale_warning', `No activity for 7+ days`, { last_event: lead.last_event });
    log(`STALE: ${lead.company} — last activity: ${lead.last_event || 'never'}`);
  }

  return staleLeads;
}

// ─── OVERDUE TASKS ────────────────────────────────────────────

function checkOverdueTasks() {
  log('Checking for overdue tasks...');
  const overdue = leads.getOverdueTasks();
  for (const task of overdue) {
    log(`OVERDUE: "${task.title}" for ${task.company || 'general'} — due ${task.due_date}`);
  }
  return overdue;
}

// ─── PIPELINE SNAPSHOT ────────────────────────────────────────

function takeSnapshot() {
  const stats = leads.getPipelineStats();
  const pipeline = leads.getActivePipeline();

  const snapshot = {
    timestamp: new Date().toISOString(),
    stats,
    pipeline: pipeline.map(l => ({
      id: l.id,
      company: l.company,
      contact: l.contact_name,
      status: l.status,
      score: l.score,
      events: l.event_count,
      last_activity: l.last_activity,
      emails_sent: l.emails_sent,
      emails_replied: l.emails_replied,
    })),
  };

  leads.saveAnalysis('daily_snapshot', snapshot, `Pipeline: ${stats.total_leads} leads, ${stats.pending_tasks} tasks pending`);
  logger.logEvent(0, logger.EVENT_TYPES.PIPELINE_SCAN, `Daily scan: ${stats.total_leads} leads`, stats);

  log(`Snapshot saved: ${stats.total_leads} leads, ${stats.total_events} events, ${stats.pending_tasks} tasks`);
  return snapshot;
}

// ─── WEEKLY REPORT ────────────────────────────────────────────

async function sendWeeklyReport() {
  log('Generating weekly pipeline report...');

  const stats = leads.getPipelineStats();
  const pipeline = leads.getActivePipeline();
  const recentEvents = logger.getRecentEvents(20);
  const overdue = leads.getOverdueTasks();
  const staleness = checkStaleness();
  const emailStats = leads.getEmailStats();

  try {
    const { sendEmail, p, callout, table, kvList } = require(path.join(__dirname, '..', 'Automation', 'email-service'));

    const pipelineRows = pipeline.map(l => [
      l.company,
      l.contact_name,
      `<span style="background:${statusColor(l.status)};color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">${l.status}</span>`,
      `${l.score}/100`,
      `${l.event_count}`,
      l.last_activity ? timeSince(l.last_activity) : 'never',
    ]);

    const eventRows = recentEvents.slice(0, 10).map(e => [
      e.company || '—',
      e.event_type.replace(/_/g, ' '),
      e.event_detail?.substring(0, 60) || '',
      timeSince(e.timestamp),
    ]);

    await sendEmail({
      to: 'leeakpareva@gmail.com',
      subject: `Lead Pipeline Weekly — ${stats.total_leads} leads, ${stats.response_rate}% response rate`,
      heading: 'Weekly Pipeline Report',
      body: `
        ${kvList([
          ['Total Leads', stats.total_leads.toString()],
          ['Total Events Logged', stats.total_events.toString()],
          ['Intro Emails Sent', emailStats.intros_sent.toString()],
          ['Follow-ups Sent', emailStats.followups_sent.toString()],
          ['Replies Received', emailStats.replies_received.toString()],
          ['Response Rate', emailStats.response_rate],
          ['Follow-ups Pending', emailStats.followups_pending.toString()],
          ['Avg Lead Score', stats.avg_lead_score + '/100'],
          ['Pending Tasks', stats.pending_tasks.toString()],
          ['Overdue Tasks', overdue.length.toString()],
          ['Stale Leads (7+ days)', staleness.length.toString()],
        ])}

        <h3 style="color:#111; margin:24px 0 10px;">Active Pipeline</h3>
        ${table(['Company', 'Contact', 'Status', 'Score', 'Events', 'Last Activity'], pipelineRows)}

        <h3 style="color:#111; margin:24px 0 10px;">Recent Events</h3>
        ${table(['Company', 'Event', 'Detail', 'When'], eventRows)}

        ${overdue.length > 0 ? callout(`<strong>Overdue Tasks (${overdue.length})</strong><br>${overdue.map(t => `• ${t.title} (${t.company || 'general'})`).join('<br>')}`, 'warning') : ''}
        ${staleness.length > 0 ? callout(`<strong>Stale Leads (${staleness.length})</strong><br>${staleness.map(s => `• ${s.company} — ${timeSince(s.last_event) || 'no activity'}`).join('<br>')}`, 'warning') : ''}
      `,
      type: 'report',
      fromName: 'Claude | NAVADA',
      preheader: `${stats.total_leads} leads tracked, ${stats.response_rate}% response rate this week`,
      footerNote: 'NAVADA Lead Pipeline — Automated Weekly Report',
    });

    log('Weekly report sent to Lee');
  } catch (e) {
    log(`Weekly report failed: ${e.message}`);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────

function statusColor(status) {
  const colors = {
    new: '#3498DB', researching: '#9B59B6', outreach_drafted: '#F39C12',
    outreach_sent: '#E67E22', responded: '#2ECC71', meeting_scheduled: '#27AE60',
    proposal_sent: '#1ABC9C', negotiating: '#16A085', won: '#2ECC71',
    lost: '#E74C3C', nurturing: '#95A5A6', archived: '#7F8C8D',
  };
  return colors[status] || '#888';
}

function timeSince(dateStr) {
  if (!dateStr) return 'never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── 4-DAY FOLLOW-UP ENGINE ──────────────────────────────────

async function checkAndSendFollowUps() {
  log('Checking for leads needing follow-up...');

  const needFollowUp = leads.getLeadsNeedingFollowUp();

  if (needFollowUp.length === 0) {
    log('No follow-ups due today');
    return;
  }

  log(`Found ${needFollowUp.length} lead(s) needing follow-up`);

  for (const lead of needFollowUp) {
    const daysSince = Math.floor(lead.days_since_intro);
    log(`FOLLOW-UP DUE: ${lead.company} (${lead.contact_name}) — ${daysSince} days since intro`);

    const result = await leads.sendFollowUpEmail(lead.id, 1);
    if (result.success) {
      log(`Follow-up sent to ${lead.company} (${lead.contact_email})`);

      // Alert Lee about the automatic follow-up
      try {
        const { sendEmail, p, callout } = require(path.join(__dirname, '..', 'Automation', 'email-service'));
        await sendEmail({
          to: 'leeakpareva@gmail.com',
          subject: `Follow-Up Sent: ${lead.company} (${daysSince} days, no reply)`,
          heading: 'Automatic Follow-Up Sent',
          body: `
            ${p(`A 4-day follow-up email was automatically sent to <strong>${lead.contact_name}</strong> at <strong>${lead.company}</strong>.`)}
            ${callout(`
              <strong>Original intro:</strong> ${lead.intro_subject}<br>
              <strong>Sent on:</strong> ${new Date(lead.intro_sent_at).toLocaleDateString('en-GB')}<br>
              <strong>Days since intro:</strong> ${daysSince}<br>
              <strong>Contact:</strong> ${lead.contact_email}<br>
              <strong>Status:</strong> No reply received
            `, 'info')}
            ${p('If they respond, the pipeline will automatically detect it and update their status.')}
          `,
          type: 'alert',
          fromName: 'Claude | NAVADA',
          preheader: `Auto follow-up sent to ${lead.contact_name} at ${lead.company}`,
        });
      } catch (e) {
        log(`Follow-up alert to Lee failed: ${e.message}`);
      }
    } else {
      log(`Follow-up FAILED for ${lead.company}: ${result.error}`);
    }
  }
}

// ─── FOLLOW-UP LIFECYCLE: ESCALATE TO LOST ───────────────────
// Day 0: Intro sent → Day 4: Follow-up sent → Day 8: Mark lost → Day 15: Archive

async function checkFollowUpEscalation() {
  log('Checking follow-up escalation (leads to mark as lost)...');

  // Find leads where followup_1 was sent but no reply after 4+ days
  const leadsToMarkLost = db.prepare(`
    SELECT l.*,
      fu.sent_at as followup_sent_at,
      julianday('now') - julianday(fu.sent_at) as days_since_followup
    FROM leads l
    INNER JOIN emails fu ON fu.lead_id = l.id
      AND fu.direction = 'outbound'
      AND fu.email_type = 'followup_1'
      AND fu.replied = 0
    WHERE l.status = 'outreach_sent'
      AND julianday('now') - julianday(fu.sent_at) >= 4
      AND NOT EXISTS (
        SELECT 1 FROM emails inb
        WHERE inb.lead_id = l.id AND inb.direction = 'inbound'
      )
  `).all();

  if (leadsToMarkLost.length === 0) {
    log('No leads to escalate to lost');
    return [];
  }

  log(`Found ${leadsToMarkLost.length} lead(s) to mark as lost`);

  for (const lead of leadsToMarkLost) {
    const daysSince = Math.floor(lead.days_since_followup);
    const reason = `No response ${daysSince} days after follow-up (auto-escalated)`;
    log(`MARKING LOST: ${lead.company} (${lead.contact_name}) — ${daysSince}d since follow-up`);

    leads.changeStatus(lead.id, 'lost', reason);
    logger.logEvent(lead.id, logger.EVENT_TYPES.DEAL_LOST, reason, {
      days_since_followup: daysSince,
      followup_sent_at: lead.followup_sent_at,
      auto_escalated: true,
    });

    leads.createTask(lead.id, `Review lost lead: ${lead.company}`, reason, null, 0, 'lee');

    try {
      const { sendEmail, p, callout } = require(path.join(__dirname, '..', 'Automation', 'email-service'));
      await sendEmail({
        to: 'leeakpareva@gmail.com',
        subject: `Lead Lost: ${lead.company} — No Response`,
        heading: 'Lead Marked as Lost',
        body: `
          ${p(`<strong>${lead.contact_name}</strong> at <strong>${lead.company}</strong> did not respond after intro and follow-up emails.`)}
          ${callout(`
            <strong>Follow-up sent:</strong> ${new Date(lead.followup_sent_at).toLocaleDateString('en-GB')}<br>
            <strong>Days since follow-up:</strong> ${daysSince}<br>
            <strong>Action:</strong> Status → <strong>lost</strong>
          `, 'warning')}
          ${p('Will be auto-archived in 7 days. Reactivate manually if needed.')}
        `,
        type: 'alert',
        fromName: 'Claude | NAVADA',
        preheader: `${lead.company} marked as lost — no engagement`,
      });
    } catch (e) { log(`Lost-lead alert failed: ${e.message}`); }
  }

  return leadsToMarkLost;
}

// ─── ARCHIVE UNRESPONSIVE LEADS ──────────────────────────────

function archiveUnresponsiveLeads() {
  log('Checking for leads to archive...');

  const leadsToArchive = db.prepare(`
    SELECT l.*,
      julianday('now') - julianday(l.updated_at) as days_since_lost
    FROM leads l
    WHERE l.status = 'lost'
      AND julianday('now') - julianday(l.updated_at) >= 7
  `).all();

  if (leadsToArchive.length === 0) {
    log('No lost leads ready for archival');
    return [];
  }

  log(`Archiving ${leadsToArchive.length} lead(s)`);

  for (const lead of leadsToArchive) {
    const days = Math.floor(lead.days_since_lost);
    log(`ARCHIVING: ${lead.company} — lost for ${days} days`);
    leads.changeStatus(lead.id, 'archived', `Auto-archived after ${days} days with lost status`);
  }

  return leadsToArchive;
}

// ─── MAIN RUN ─────────────────────────────────────────────────

async function run() {
  log('═══════════════════════════════════════════════');
  log('NAVADA Lead Pipeline — Daily Run');
  log('═══════════════════════════════════════════════');

  await checkForResponses();
  await checkAndSendFollowUps();
  await checkFollowUpEscalation();
  archiveUnresponsiveLeads();
  checkStaleness();
  checkOverdueTasks();
  takeSnapshot();

  // Weekly report on Mondays
  if (new Date().getDay() === 1) {
    await sendWeeklyReport();
  }

  log('Pipeline run complete.');
}

// Export for external use + run if called directly
module.exports = { run, checkForResponses, checkAndSendFollowUps, checkFollowUpEscalation, archiveUnresponsiveLeads, checkStaleness, sendWeeklyReport, takeSnapshot };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { log(`Fatal: ${err.message}`); process.exit(1); });
}
