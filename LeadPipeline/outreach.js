/**
 * NAVADA Prospect Pipeline: Outreach Email System
 * All emails are DRAFTED first → Lee reviews → approved emails get sent
 * Two tracks: Job hunting (contract roles) + NAVADA demos (product showcase)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });
const path = require('path');
const db = require('./prospect-db');
const { sendEmail, p, table, kvList, callout } = require(path.join(__dirname, '..', 'Automation', 'email-service'));

// ─── EMAIL TEMPLATES ─────────────────────────────────────────

/**
 * Track A: Job hunting intro
 */
function buildIntroEmail(contact, company) {
  const firstName = contact.full_name.split(' ')[0];

  const sectorProof = {
    insurance: 'most recently as Principal AI Consultant at a leading UK insurer, where I established the AI Centre of Excellence and built multi-agent architectures for underwriting automation',
    finance: 'with deep experience in financial services, building enterprise RAG pipelines and LLM-powered automation for major institutions',
    fintech: 'with hands-on fintech experience across payments, risk, and compliance, most recently leading AI transformation at a top UK insurer',
    healthcare: 'across enterprise healthcare and public sector, building clinical triage AI and drug discovery pipelines',
    logistics: 'across global logistics and supply chain, including blockchain-powered tracking for a major international carrier',
    tech: 'across enterprise and scale-up environments, building production AI systems from RAG pipelines to computer vision',
  };

  const proof = sectorProof[company.sector] || sectorProof.tech;

  const aiSignalClean = (company.ai_signal || '').toLowerCase().replace('job posting: ', 'investing in ').replace(/—/g, ',');
  const aiContext = company.ai_signal
    ? `I noticed ${company.company_name} is ${aiSignalClean}, which is exactly the space I operate in.`
    : `I've been following ${company.company_name}'s growth and see real potential for AI to accelerate your roadmap.`;

  return `
    <p style="margin:0 0 14px 0;">Hi ${firstName},</p>

    <p style="margin:0 0 14px 0;">${aiContext}</p>

    <p style="margin:0 0 14px 0;">I'm Lee Akpareva, a Principal AI Consultant with 17 years in digital transformation, ${proof}.</p>

    <p style="margin:0 0 14px 0;">What I bring to the table:</p>
    <ul style="margin:0 0 14px 0; padding-left:20px; color:#333;">
      <li style="margin-bottom:6px;"><strong>Enterprise AI Architecture</strong>: RAG pipelines, multi-agent systems (LangChain, Azure OpenAI), vector search</li>
      <li style="margin-bottom:6px;"><strong>ML Engineering</strong>: Fine-tuning LLMs (QLoRA), computer vision (YOLOv8), MLOps deployment</li>
      <li style="margin-bottom:6px;"><strong>AI Strategy & Enablement</strong>: Governance frameworks, team upskilling, Centre of Excellence setup</li>
    </ul>

    <p style="margin:0 0 14px 0;">I've delivered AI programmes for FTSE 100 insurers, global logistics firms, major airlines, healthcare providers, and e-commerce platforms.</p>

    <p style="margin:0 0 14px 0;">Would you be open to a quick 15-minute chat about your AI roadmap? Happy to work around your schedule.</p>

    <p style="margin:0 0 4px 0;">Best regards,</p>
    <p style="margin:0 0 4px 0;"><strong>Lee Akpareva</strong></p>
    <p style="margin:0; font-size:12px; color:#888;">
      Principal AI Consultant | NAVADA<br>
      <a href="https://www.navada-lab.space" style="color:#666;">navada-lab.space</a> &middot;
      <a href="https://www.linkedin.com/in/leeakpareva" style="color:#666;">LinkedIn</a>
    </p>
  `;
}

/**
 * Track B: NAVADA demo (product showcase)
 */
function buildDemoEmail(contact, company) {
  const firstName = contact.full_name.split(' ')[0];

  const sectorHook = {
    insurance: `Given ${company.company_name}'s position in insurance, I think you'd find the real-time risk intelligence and market analysis particularly relevant.`,
    finance: `For a company like ${company.company_name} operating in financial services, the real-time market data, economic indicators, and geopolitical risk feeds could be valuable.`,
    fintech: `For fintech, the compliance monitoring, market intelligence, and real-time data feeds could plug directly into your existing workflows.`,
    healthcare: `The platform includes health surveillance, clinical data feeds, and research intelligence that could complement ${company.company_name}'s work.`,
    logistics: `The supply chain monitoring, trade flow tracking, and geopolitical risk panels could add real value to ${company.company_name}'s operations.`,
    tech: `I think you'd appreciate the engineering behind it, and the platform's real-time data architecture could be relevant to what you're building.`,
  };

  const hook = sectorHook[company.sector] || sectorHook.tech;

  return `
    <p style="margin:0 0 14px 0;">Hi ${firstName},</p>

    <p style="margin:0 0 14px 0;">I'm Lee Akpareva, founder of NAVADA, an AI engineering consultancy. I wanted to share something I've built that might interest you.</p>

    <p style="margin:0 0 14px 0;"><strong>WorldMonitor</strong> is a real-time global intelligence dashboard with 72 interactive panels covering markets, geopolitics, AI trends, supply chains, and more. Built with D3.js, MapLibre, and AI-powered analysis.</p>

    <p style="margin:0 0 14px 0;">${hook}</p>

    <p style="margin:0 0 14px 0;">A few things from my portfolio:</p>
    <ul style="margin:0 0 14px 0; padding-left:20px; color:#333;">
      <li style="margin-bottom:6px;"><strong>WorldMonitor</strong>: Live global intelligence <a href="https://navada.tail394c36.ts.net" style="color:#0066cc;">demo</a></li>
      <li style="margin-bottom:6px;"><strong>NAVADA Lab</strong>: ML engineering portfolio <a href="https://www.navada-lab.space" style="color:#0066cc;">navada-lab.space</a></li>
      <li style="margin-bottom:6px;"><strong>Computer Vision</strong>: Real-time YOLOv8 inference <a href="https://computervisionbylee.streamlit.app" style="color:#0066cc;">live demo</a></li>
    </ul>

    <p style="margin:0 0 14px 0;">If any of this resonates, I'd love a 15-minute chat to explore how NAVADA could support ${company.company_name}'s AI ambitions.</p>

    <p style="margin:0 0 4px 0;">Best regards,</p>
    <p style="margin:0 0 4px 0;"><strong>Lee Akpareva</strong></p>
    <p style="margin:0; font-size:12px; color:#888;">
      Founder & Principal AI Consultant | NAVADA<br>
      <a href="https://www.navada-lab.space" style="color:#666;">navada-lab.space</a> &middot;
      <a href="https://www.navadarobotics.com" style="color:#666;">navadarobotics.com</a> &middot;
      <a href="https://www.linkedin.com/in/leeakpareva" style="color:#666;">LinkedIn</a>
    </p>
  `;
}

/**
 * Follow-up 1 (day 4)
 */
function buildFollowUp1(contact, company) {
  const firstName = contact.full_name.split(' ')[0];
  const serviceMatch = company.ai_signal
    ? `Specifically, I see real opportunity for AI to drive value in ${company.sector || 'your'} operations, particularly around the areas you're investing in.`
    : '';

  return `
    <p style="margin:0 0 14px 0;">Hi ${firstName},</p>

    <p style="margin:0 0 14px 0;">Just circling back on my previous note. I know how busy things get, so I'll keep this brief.</p>

    ${serviceMatch ? `<p style="margin:0 0 14px 0;">${serviceMatch}</p>` : ''}

    <p style="margin:0 0 14px 0;">Would a quick 15-minute call be useful? Happy to work around your schedule.</p>

    <p style="margin:0 0 4px 0;">Best,</p>
    <p style="margin:0 0 4px 0;"><strong>Lee Akpareva</strong></p>
    <p style="margin:0; font-size:12px; color:#888;">
      Principal AI Consultant | NAVADA<br>
      <a href="https://www.navada-lab.space" style="color:#666;">navada-lab.space</a>
    </p>
  `;
}

/**
 * Follow-up 2 (day 8)
 */
function buildFollowUp2(contact, company) {
  const firstName = contact.full_name.split(' ')[0];

  return `
    <p style="margin:0 0 14px 0;">Hi ${firstName},</p>

    <p style="margin:0 0 14px 0;">Wanted to resurface this one more time. Happy to share some specific ideas on how AI could accelerate ${company.company_name}'s roadmap if that's helpful.</p>

    <p style="margin:0 0 14px 0;">If now isn't the right time, completely understand. Otherwise, just let me know and I'll send over a brief overview.</p>

    <p style="margin:0 0 4px 0;">All the best,</p>
    <p style="margin:0;">Lee</p>
  `;
}

// ─── DRAFT FUNCTIONS (approval gate) ─────────────────────────

/**
 * Draft an intro email (does NOT send, waits for Lee's approval)
 * @param {number} contactId
 * @param {string} track - 'job' or 'demo'
 */
async function draftIntro(contactId, track = 'job') {
  const contact = await db.getContactById(contactId);
  if (!contact) throw new Error(`Contact ${contactId} not found`);
  if (!contact.email) throw new Error(`Contact ${contactId} (${contact.full_name}) has no email`);
  if (!contact.email_verified) throw new Error(`Email not verified for ${contact.full_name}: ${contact.email}`);

  const company = await db.getCompanyById(contact.company_id);
  if (!company) throw new Error(`Company ${contact.company_id} not found`);

  // Check if intro already sent or drafted
  const existing = await db.getEmailsByContact(contactId);
  const hasIntro = existing.some(e => e.direction === 'outbound' && e.email_type === 'intro');
  if (hasIntro) throw new Error(`Intro already sent to ${contact.full_name} at ${company.company_name}`);

  const { rows: existingDrafts } = await db.pool.query(
    `SELECT id FROM prospect_drafts WHERE contact_id = $1 AND email_type = 'intro' AND status = 'pending'`,
    [contactId]
  );
  if (existingDrafts.length > 0) throw new Error(`Intro already drafted for ${contact.full_name} (draft #${existingDrafts[0].id})`);

  const bodyHtml = track === 'demo'
    ? buildDemoEmail(contact, company)
    : buildIntroEmail(contact, company);

  const subject = track === 'demo'
    ? `NAVADA: AI Engineering & WorldMonitor Demo`
    : `AI & ML: ${company.company_name}`;

  const draft = await db.createDraft({
    contact_id: contactId,
    company_id: company.id,
    email_type: 'intro',
    to_email: contact.email,
    subject,
    body_html: bodyHtml,
  });

  console.log(`[draft] Created draft #${draft.id}: ${subject} → ${contact.email} (${company.company_name})`);
  return draft;
}

/**
 * Draft a follow-up email
 */
async function draftFollowUp(contactId, followUpNumber = 1) {
  const contact = await db.getContactById(contactId);
  if (!contact) throw new Error(`Contact ${contactId} not found`);

  const company = await db.getCompanyById(contact.company_id);
  if (!company) throw new Error(`Company ${contact.company_id} not found`);

  const emails = await db.getEmailsByContact(contactId);
  const intro = emails.find(e => e.direction === 'outbound' && e.email_type === 'intro');
  if (!intro) throw new Error(`No intro sent yet to ${contact.full_name}`);

  const emailType = `followup_${followUpNumber}`;
  const alreadySent = emails.some(e => e.direction === 'outbound' && e.email_type === emailType);
  if (alreadySent) throw new Error(`Follow-up ${followUpNumber} already sent to ${contact.full_name}`);

  const hasReply = emails.some(e => e.direction === 'inbound');
  if (hasReply) return null; // Already replied, skip

  const { rows: existingDrafts } = await db.pool.query(
    `SELECT id FROM prospect_drafts WHERE contact_id = $1 AND email_type = $2 AND status = 'pending'`,
    [contactId, emailType]
  );
  if (existingDrafts.length > 0) return null; // Already drafted

  const bodyHtml = followUpNumber === 1
    ? buildFollowUp1(contact, company)
    : buildFollowUp2(contact, company);

  const subject = `Re: ${intro.subject}`;

  const draft = await db.createDraft({
    contact_id: contactId,
    company_id: company.id,
    email_type: emailType,
    to_email: contact.email,
    subject,
    body_html: bodyHtml,
  });

  console.log(`[draft] Created draft #${draft.id}: Follow-up ${followUpNumber} → ${contact.email}`);
  return draft;
}

// ─── BATCH DRAFT ─────────────────────────────────────────────

/**
 * Draft intros for all contacts ready for outreach
 */
async function draftBatchIntros(track = 'job', limit = 20) {
  const ready = await db.getContactsReadyForOutreach();
  const batch = ready.slice(0, limit);
  console.log(`\n[draft] Drafting ${track} intros for ${batch.length} of ${ready.length} ready contacts...\n`);

  const results = { drafted: 0, skipped: 0 };

  for (const contact of batch) {
    try {
      await draftIntro(contact.id, track);
      results.drafted++;
    } catch (err) {
      console.log(`  [skip] ${contact.full_name}: ${err.message}`);
      results.skipped++;
    }
  }

  return results;
}

/**
 * Draft follow-ups for unanswered intros
 */
async function draftBatchFollowUps() {
  const unanswered = await db.getUnansweredIntros(4);
  const unansweredFu1 = await db.getUnansweredFollowups(4);
  console.log(`\n[draft] Drafting follow-ups: ${unanswered.length} need FU1, ${unansweredFu1.length} need FU2...\n`);

  const results = { drafted: 0, skipped: 0 };

  for (const email of unanswered) {
    try {
      const draft = await draftFollowUp(email.contact_id, 1);
      if (draft) results.drafted++;
      else results.skipped++;
    } catch (err) {
      results.skipped++;
    }
  }

  for (const email of unansweredFu1) {
    try {
      const draft = await draftFollowUp(email.contact_id, 2);
      if (draft) results.drafted++;
      else results.skipped++;
    } catch (err) {
      results.skipped++;
    }
  }

  return results;
}

// ─── SEND APPROVED DRAFTS ────────────────────────────────────

/**
 * Send a single approved draft
 */
async function sendDraft(draftId) {
  const draft = await db.getDraftById(draftId);
  if (!draft) throw new Error(`Draft ${draftId} not found`);
  if (draft.status !== 'approved') throw new Error(`Draft ${draftId} is ${draft.status}, not approved`);

  const contact = await db.getContactById(draft.contact_id);
  const company = await db.getCompanyById(draft.company_id);

  try {
    const info = await sendEmail({
      to: draft.to_email,
      cc: 'leeakpareva@gmail.com',
      subject: draft.subject,
      heading: null,
      body: draft.body_html,
      type: 'general',
      fromName: 'Lee Akpareva | NAVADA',
      preheader: draft.email_type === 'intro'
        ? `Quick note about AI strategy at ${company?.company_name || ''}`
        : `Following up: ${company?.company_name || ''}`,
    });

    // Track in prospect_emails
    await db.createEmail({
      contact_id: draft.contact_id,
      company_id: draft.company_id,
      direction: 'outbound',
      email_type: draft.email_type,
      subject: draft.subject,
      body_preview: draft.body_preview,
      message_id: info.messageId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      actor: 'system',
    });

    // Update draft status
    await db.pool.query(`UPDATE prospect_drafts SET status = 'sent' WHERE id = $1`, [draftId]);

    // Update company status for intros
    if (draft.email_type === 'intro' && company) {
      await db.updateCompany(company.id, { status: 'contacted', actor: 'system' });
    }

    console.log(`[sent] Draft #${draftId} → ${draft.to_email} (${company?.company_name})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[error] Failed to send draft #${draftId}: ${err.message}`);
    await db.logAudit('draft', draftId, 'send_failed', err.message, { actor: 'system' });
    return { success: false, error: err.message };
  }
}

/**
 * Send ALL approved drafts
 */
async function sendApproved() {
  const { rows: approved } = await db.pool.query(
    `SELECT * FROM prospect_drafts WHERE status = 'approved' ORDER BY created_at ASC`
  );

  if (approved.length === 0) {
    console.log('[send] No approved drafts to send');
    return { sent: 0, failed: 0 };
  }

  console.log(`\n[send] Sending ${approved.length} approved drafts...\n`);
  const results = { sent: 0, failed: 0 };

  for (const draft of approved) {
    const result = await sendDraft(draft.id);
    if (result.success) results.sent++;
    else results.failed++;
    await new Promise(r => setTimeout(r, 2000)); // Anti-spam delay
  }

  return results;
}

// ─── APPROVAL EMAIL TO LEE ───────────────────────────────────

/**
 * Send Lee an email with all pending drafts for review
 */
async function sendApprovalDigest() {
  const drafts = await db.getPendingDrafts();
  if (drafts.length === 0) {
    console.log('[approval] No pending drafts');
    return;
  }

  const rows = drafts.map((d, i) => [
    `<strong>#${d.id}</strong>`,
    d.full_name,
    d.company_name,
    d.email_type,
    d.to_email,
    d.subject,
  ]);

  // Build preview of each draft
  const previews = drafts.map(d => `
    ${callout(`
      <strong>Draft #${d.id}</strong> | ${d.email_type.toUpperCase()} to <strong>${d.full_name}</strong> (${d.company_name})<br>
      <strong>To:</strong> ${d.to_email}<br>
      <strong>Subject:</strong> ${d.subject}<br><br>
      <div style="border-left:2px solid #ddd; padding-left:12px; margin-top:8px; font-size:13px; color:#555;">
        ${d.body_html}
      </div>
    `, 'info')}
  `).join('');

  const body = `
    ${p(`<strong>${drafts.length} email${drafts.length > 1 ? 's' : ''}</strong> ready for your review.`)}
    ${p('Reply with draft numbers to approve, e.g. <strong>"approve 1, 3, 5"</strong> or <strong>"approve all"</strong>.')}
    ${p('To reject: <strong>"reject 2: reason here"</strong>')}

    <h3 style="margin:20px 0 10px 0; font-size:15px;">Summary</h3>
    ${table(['#', 'Contact', 'Company', 'Type', 'To', 'Subject'], rows)}

    <h3 style="margin:20px 0 10px 0; font-size:15px;">Full Previews</h3>
    ${previews}
  `;

  await sendEmail({
    to: 'leeakpareva@gmail.com',
    subject: `Outreach Approval: ${drafts.length} draft${drafts.length > 1 ? 's' : ''} pending (${new Date().toLocaleDateString('en-GB')})`,
    heading: 'Outreach Drafts Awaiting Approval',
    body,
    type: 'alert',
    preheader: `${drafts.length} emails need your approval before sending`,
  });

  console.log(`[approval] Digest sent to Lee with ${drafts.length} drafts`);
}

// ─── EXPORTS ─────────────────────────────────────────────────

module.exports = {
  buildIntroEmail,
  buildDemoEmail,
  buildFollowUp1,
  buildFollowUp2,
  draftIntro,
  draftFollowUp,
  draftBatchIntros,
  draftBatchFollowUps,
  sendDraft,
  sendApproved,
  sendApprovalDigest,
};

// ─── CLI ─────────────────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2];
  (async () => {
    try {
      await db.initSchema();

      if (cmd === 'draft' && process.argv[3]) {
        const track = process.argv[4] || 'job';
        await draftIntro(parseInt(process.argv[3]), track);
      } else if (cmd === 'draft-all') {
        const track = process.argv[3] || 'job';
        const limit = parseInt(process.argv[4] || '20');
        await draftBatchIntros(track, limit);
      } else if (cmd === 'draft-followups') {
        await draftBatchFollowUps();
      } else if (cmd === 'pending') {
        const drafts = await db.getPendingDrafts();
        if (drafts.length === 0) {
          console.log('\nNo pending drafts.');
        } else {
          console.log(`\n${drafts.length} pending draft(s):\n`);
          drafts.forEach(d => console.log(`  #${d.id} [${d.email_type}] ${d.full_name} @ ${d.company_name} → ${d.to_email}`));
        }
      } else if (cmd === 'preview' && process.argv[3]) {
        const draft = await db.getDraftById(parseInt(process.argv[3]));
        if (!draft) { console.log('Draft not found'); return; }
        console.log(`\n── Draft #${draft.id} ──────────────────`);
        console.log(`Type:    ${draft.email_type}`);
        console.log(`To:      ${draft.to_email}`);
        console.log(`Subject: ${draft.subject}`);
        console.log(`Status:  ${draft.status}`);
        console.log(`\n${draft.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      } else if (cmd === 'approve' && process.argv[3]) {
        if (process.argv[3] === 'all') {
          const approved = await db.approveAll();
          console.log(`[approved] ${approved.length} drafts approved`);
        } else {
          const ids = process.argv[3].split(',').map(s => parseInt(s.trim()));
          for (const id of ids) {
            const draft = await db.approveDraft(id);
            if (draft) console.log(`[approved] Draft #${id}: ${draft.subject}`);
            else console.log(`[skip] Draft #${id} not found or not pending`);
          }
        }
      } else if (cmd === 'reject' && process.argv[3]) {
        const reason = process.argv[4] || '';
        const draft = await db.rejectDraft(parseInt(process.argv[3]), reason);
        if (draft) console.log(`[rejected] Draft #${draft.id}`);
        else console.log('Draft not found or not pending');
      } else if (cmd === 'send') {
        await sendApproved();
      } else if (cmd === 'digest') {
        await sendApprovalDigest();
      } else if (cmd === 'ready') {
        const ready = await db.getContactsReadyForOutreach();
        console.log(`\n${ready.length} contacts ready for outreach:\n`);
        ready.forEach(c => console.log(`  [${c.id}] ${c.full_name} | ${c.email} (${c.company_name})`));
      } else {
        console.log('Usage:');
        console.log('');
        console.log('  DRAFTING:');
        console.log('  node outreach.js draft <contact_id> [job|demo]   # Draft intro for one contact');
        console.log('  node outreach.js draft-all [job|demo] [limit]    # Draft intros for all ready');
        console.log('  node outreach.js draft-followups                 # Draft pending follow-ups');
        console.log('');
        console.log('  REVIEW:');
        console.log('  node outreach.js pending                         # List pending drafts');
        console.log('  node outreach.js preview <draft_id>              # Preview a draft');
        console.log('  node outreach.js digest                          # Email all drafts to Lee');
        console.log('');
        console.log('  APPROVE/REJECT:');
        console.log('  node outreach.js approve <id,id,id>              # Approve specific drafts');
        console.log('  node outreach.js approve all                     # Approve all pending');
        console.log('  node outreach.js reject <id> [reason]            # Reject a draft');
        console.log('');
        console.log('  SEND:');
        console.log('  node outreach.js send                            # Send all approved drafts');
        console.log('  node outreach.js ready                           # List contacts ready');
      }
    } catch (err) {
      console.error('[outreach] Error:', err.message);
    } finally {
      await db.pool.end();
    }
  })();
}
