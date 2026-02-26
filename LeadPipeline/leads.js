/**
 * NAVADA Lead Pipeline — Lead Manager (CRUD + Pipeline Logic)
 */

const db = require('./db');
const logger = require('./logger');

// ─── PREPARED STATEMENTS ──────────────────────────────────────

const stmtInsert = db.prepare(`
  INSERT INTO leads (company, contact_name, contact_role, contact_email, contact_linkedin,
    sector, location, stage, funding, company_desc, navada_fit, service_match,
    priority, score, status, source, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtUpdate = db.prepare(`
  UPDATE leads SET company=?, contact_name=?, contact_role=?, contact_email=?, contact_linkedin=?,
    sector=?, location=?, stage=?, funding=?, company_desc=?, navada_fit=?, service_match=?,
    priority=?, score=?, status=?, source=?, notes=?, updated_at=datetime('now')
  WHERE id=?
`);

const stmtUpdateStatus = db.prepare(`
  UPDATE leads SET status=?, updated_at=datetime('now') WHERE id=?
`);

const stmtUpdateScore = db.prepare(`
  UPDATE leads SET score=?, updated_at=datetime('now') WHERE id=?
`);

// ─── LEAD CRUD ────────────────────────────────────────────────

function createLead(data) {
  const result = stmtInsert.run(
    data.company, data.contact_name, data.contact_role || null,
    data.contact_email || null, data.contact_linkedin || null,
    data.sector || null, data.location || null, data.stage || null,
    data.funding || null, data.company_desc || null, data.navada_fit || null,
    data.service_match || null, data.priority || 0, data.score || 0.0,
    data.status || 'new', data.source || null, data.notes || null
  );
  const leadId = result.lastInsertRowid;
  logger.logLeadCreated(leadId, data.company, data.contact_name);
  return leadId;
}

function updateLead(id, data) {
  const existing = getLeadById(id);
  if (!existing) throw new Error(`Lead ${id} not found`);

  stmtUpdate.run(
    data.company || existing.company,
    data.contact_name || existing.contact_name,
    data.contact_role || existing.contact_role,
    data.contact_email || existing.contact_email,
    data.contact_linkedin || existing.contact_linkedin,
    data.sector || existing.sector,
    data.location || existing.location,
    data.stage || existing.stage,
    data.funding || existing.funding,
    data.company_desc || existing.company_desc,
    data.navada_fit || existing.navada_fit,
    data.service_match || existing.service_match,
    data.priority !== undefined ? data.priority : existing.priority,
    data.score !== undefined ? data.score : existing.score,
    data.status || existing.status,
    data.source || existing.source,
    data.notes || existing.notes,
    id
  );

  logger.logEvent(id, logger.EVENT_TYPES.LEAD_UPDATED, `Lead updated`, { changes: data });
  return getLeadById(id);
}

function changeStatus(id, newStatus, reason = '') {
  const existing = getLeadById(id);
  if (!existing) throw new Error(`Lead ${id} not found`);

  const oldStatus = existing.status;
  stmtUpdateStatus.run(newStatus, id);
  logger.logStageChange(id, oldStatus, newStatus, reason);
  return getLeadById(id);
}

function scoreLead(id, score, factors = {}) {
  stmtUpdateScore.run(score, id);
  logger.logEvent(id, logger.EVENT_TYPES.LEAD_SCORED, `Score: ${score}/100`, { score, factors });
  return getLeadById(id);
}

// ─── QUERIES ──────────────────────────────────────────────────

function getLeadById(id) {
  return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
}

function getAllLeads() {
  return db.prepare('SELECT * FROM leads ORDER BY priority DESC, score DESC').all();
}

function getLeadsByStatus(status) {
  return db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY priority DESC, score DESC').all(status);
}

function getActivePipeline() {
  return db.prepare(`
    SELECT l.*,
      (SELECT COUNT(*) FROM events WHERE lead_id = l.id) as event_count,
      (SELECT MAX(timestamp) FROM events WHERE lead_id = l.id) as last_activity,
      (SELECT COUNT(*) FROM emails WHERE lead_id = l.id AND direction = 'outbound') as emails_sent,
      (SELECT COUNT(*) FROM emails WHERE lead_id = l.id AND replied = 1) as emails_replied
    FROM leads l
    WHERE l.status NOT IN ('lost', 'archived')
    ORDER BY l.priority DESC, l.score DESC
  `).all();
}

function searchLeads(query) {
  return db.prepare(`
    SELECT * FROM leads
    WHERE company LIKE ? OR contact_name LIKE ? OR sector LIKE ? OR notes LIKE ?
    ORDER BY priority DESC
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
}

// ─── EMAIL TRACKING ───────────────────────────────────────────

const stmtInsertEmail = db.prepare(`
  INSERT INTO emails (lead_id, direction, from_addr, to_addr, subject, body_preview, message_id, status, email_type, followup_due)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function trackEmailSent(leadId, to, subject, preview, messageId, emailType = 'intro') {
  // Calculate follow-up due date (4 days from now) only for intro emails
  const followupDue = emailType === 'intro'
    ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
    : null;

  stmtInsertEmail.run(
    leadId, 'outbound', 'claude.navada@zohomail.eu', to, subject, preview, messageId, 'sent',
    emailType, followupDue
  );
  logger.logEmailSent(leadId, to, subject, messageId);
}

function trackEmailReceived(leadId, from, subject, preview) {
  stmtInsertEmail.run(leadId, 'inbound', from, 'claude.navada@zohomail.eu', subject, preview, null, 'received', 'reply', null);
  logger.logEmailReplied(leadId, from, subject);

  // Mark all outbound emails to this lead as replied
  db.prepare(`
    UPDATE emails SET replied = 1, replied_at = datetime('now')
    WHERE lead_id = ? AND direction = 'outbound' AND replied = 0
  `).run(leadId);

  // Auto-update lead status if currently in outreach
  const lead = getLeadById(leadId);
  if (lead && ['outreach_sent', 'new', 'researching'].includes(lead.status)) {
    changeStatus(leadId, 'responded', `Reply received from ${from}`);
  }
}

/**
 * Send outreach intro email to a lead and track it
 * @param {number} leadId
 * @param {string} subject
 * @param {string} bodyHtml - HTML body content
 * @returns {Promise<Object>} - { success, messageId, error }
 */
async function sendOutreachEmail(leadId, subject, bodyHtml) {
  const lead = getLeadById(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (!lead.contact_email) throw new Error(`Lead ${leadId} (${lead.company}) has no email address`);

  // Check if intro already sent
  const existingIntro = db.prepare(
    `SELECT id FROM emails WHERE lead_id = ? AND direction = 'outbound' AND email_type = 'intro'`
  ).get(leadId);
  if (existingIntro) throw new Error(`Intro email already sent to ${lead.company} (email ID: ${existingIntro.id})`);

  try {
    const { sendEmail } = require(require('path').join(__dirname, '..', 'Automation', 'email-service'));
    const info = await sendEmail({
      to: lead.contact_email,
      cc: 'leeakpareva@gmail.com',
      subject,
      heading: null, // No heading for outreach — feels more personal
      body: bodyHtml,
      type: 'general',
      fromName: 'Lee Akpareva | NAVADA',
      preheader: `Reaching out from NAVADA regarding ${lead.company}`,
    });

    trackEmailSent(leadId, lead.contact_email, subject, bodyHtml.substring(0, 500), info.messageId, 'intro');
    changeStatus(leadId, 'outreach_sent', 'Intro email sent');

    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.logError(leadId, `Failed to send intro email: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Send a follow-up email to a lead (4 days after intro, no reply)
 * @param {number} leadId
 * @param {number} followUpNumber - Which follow-up (1, 2, etc.)
 * @returns {Promise<Object>} - { success, messageId, error }
 */
async function sendFollowUpEmail(leadId, followUpNumber = 1) {
  const lead = getLeadById(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (!lead.contact_email) throw new Error(`Lead ${leadId} (${lead.company}) has no email address`);

  // Get the original intro email for reference
  const introEmail = db.prepare(
    `SELECT * FROM emails WHERE lead_id = ? AND direction = 'outbound' AND email_type = 'intro' ORDER BY sent_at ASC LIMIT 1`
  ).get(leadId);
  if (!introEmail) throw new Error(`No intro email found for lead ${leadId} — cannot follow up`);

  const emailType = `followup_${followUpNumber}`;

  // Check if this follow-up was already sent
  const existing = db.prepare(
    `SELECT id FROM emails WHERE lead_id = ? AND direction = 'outbound' AND email_type = ?`
  ).get(leadId, emailType);
  if (existing) throw new Error(`Follow-up ${followUpNumber} already sent to ${lead.company}`);

  // Build personalized follow-up body
  const firstName = lead.contact_name.split(' ')[0];
  const bodyHtml = buildFollowUpBody(lead, firstName, followUpNumber, introEmail.subject);

  try {
    const { sendEmail } = require(require('path').join(__dirname, '..', 'Automation', 'email-service'));
    const subject = `Re: ${introEmail.subject}`;
    const info = await sendEmail({
      to: lead.contact_email,
      cc: 'leeakpareva@gmail.com',
      subject,
      heading: null,
      body: bodyHtml,
      type: 'general',
      fromName: 'Lee Akpareva | NAVADA',
      preheader: `Following up — ${lead.company}`,
    });

    trackEmailSent(leadId, lead.contact_email, subject, bodyHtml.substring(0, 500), info.messageId, emailType);
    logger.logEvent(leadId, logger.EVENT_TYPES.FOLLOWUP_SENT, `Follow-up ${followUpNumber} sent to ${lead.contact_email}`, {
      followup_number: followUpNumber,
      messageId: info.messageId,
      days_since_intro: Math.floor((Date.now() - new Date(introEmail.sent_at).getTime()) / (1000 * 60 * 60 * 24)),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.logError(leadId, `Failed to send follow-up ${followUpNumber}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Build personalised follow-up email body
 */
function buildFollowUpBody(lead, firstName, followUpNumber, originalSubject) {
  const serviceSnippet = lead.service_match
    ? `<p style="margin:0 0 12px 0;">Specifically, I believe our <strong>${lead.service_match}</strong> capabilities could add real value to what you're building at ${lead.company}.</p>`
    : '';

  if (followUpNumber === 1) {
    return `
      <p style="margin:0 0 12px 0;">Hi ${firstName},</p>
      <p style="margin:0 0 12px 0;">Just circling back on my previous note. I know how busy things get, so I'll keep this brief.</p>
      ${serviceSnippet}
      <p style="margin:0 0 12px 0;">Would a quick 15-minute call be useful? Happy to work around your schedule.</p>
      <p style="margin:0 0 12px 0;">Best,<br>Lee Akpareva<br>
      <span style="font-size:12px; color:#888;">Principal AI Consultant | NAVADA<br>
      <a href="https://www.navada-lab.space" style="color:#888;">navada-lab.space</a></span></p>
    `;
  }

  // Follow-up 2+ (more concise)
  return `
    <p style="margin:0 0 12px 0;">Hi ${firstName},</p>
    <p style="margin:0 0 12px 0;">Wanted to resurface this one more time — happy to share some specific ideas on how AI could accelerate ${lead.company}'s roadmap if that's helpful.</p>
    <p style="margin:0 0 12px 0;">If now isn't the right time, completely understand. Otherwise, just let me know and I'll send over a brief overview.</p>
    <p style="margin:0 0 12px 0;">All the best,<br>Lee</p>
  `;
}

/**
 * Get leads that need a follow-up email (4+ days since intro, no reply, no follow-up sent yet)
 * @returns {Array} leads needing follow-up with email details
 */
function getLeadsNeedingFollowUp() {
  return db.prepare(`
    SELECT
      l.*,
      e.id as intro_email_id,
      e.sent_at as intro_sent_at,
      e.subject as intro_subject,
      e.followup_due,
      julianday('now') - julianday(e.sent_at) as days_since_intro
    FROM leads l
    INNER JOIN emails e ON e.lead_id = l.id
      AND e.direction = 'outbound'
      AND e.email_type = 'intro'
      AND e.replied = 0
    WHERE l.status IN ('outreach_sent')
      AND l.contact_email IS NOT NULL
      AND datetime('now') >= e.followup_due
      AND NOT EXISTS (
        SELECT 1 FROM emails e2
        WHERE e2.lead_id = l.id
          AND e2.direction = 'outbound'
          AND e2.email_type LIKE 'followup_%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM emails e3
        WHERE e3.lead_id = l.id
          AND e3.direction = 'inbound'
      )
    ORDER BY e.sent_at ASC
  `).all();
}

/**
 * Get complete email history for a lead
 * @param {number} leadId
 * @returns {Array}
 */
function getEmailHistory(leadId) {
  return db.prepare(`
    SELECT * FROM emails WHERE lead_id = ? ORDER BY sent_at ASC
  `).all(leadId);
}

/**
 * Get email stats summary across all leads
 * @returns {Object}
 */
function getEmailStats() {
  const total = db.prepare(`SELECT COUNT(*) as c FROM emails WHERE direction = 'outbound'`).get().c;
  const intros = db.prepare(`SELECT COUNT(*) as c FROM emails WHERE email_type = 'intro'`).get().c;
  const followups = db.prepare(`SELECT COUNT(*) as c FROM emails WHERE email_type LIKE 'followup_%'`).get().c;
  const replies = db.prepare(`SELECT COUNT(*) as c FROM emails WHERE direction = 'inbound'`).get().c;
  const pending = getLeadsNeedingFollowUp().length;

  return {
    total_outbound: total,
    intros_sent: intros,
    followups_sent: followups,
    replies_received: replies,
    response_rate: intros > 0 ? ((replies / intros) * 100).toFixed(1) + '%' : '0%',
    followups_pending: pending,
  };
}

// ─── TASK MANAGEMENT ──────────────────────────────────────────

const stmtInsertTask = db.prepare(`
  INSERT INTO tasks (lead_id, title, description, due_date, status, priority, assigned_to)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function createTask(leadId, title, description, dueDate = null, priority = 0, assignedTo = 'claude') {
  const result = stmtInsertTask.run(leadId, title, description, dueDate, 'pending', priority, assignedTo);
  logger.logEvent(leadId || 0, 'task_created', `Task: ${title}`, { taskId: result.lastInsertRowid, dueDate, assignedTo });
  return result.lastInsertRowid;
}

function completeTask(taskId) {
  db.prepare(`UPDATE tasks SET status='completed', completed_at=datetime('now') WHERE id=?`).run(taskId);
  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(taskId);
  if (task) logger.logEvent(task.lead_id || 0, 'task_completed', `Task completed: ${task.title}`);
}

function getPendingTasks() {
  return db.prepare(`
    SELECT t.*, l.company, l.contact_name
    FROM tasks t LEFT JOIN leads l ON t.lead_id = l.id
    WHERE t.status = 'pending'
    ORDER BY t.priority DESC, t.due_date ASC
  `).all();
}

function getOverdueTasks() {
  return db.prepare(`
    SELECT t.*, l.company, l.contact_name
    FROM tasks t LEFT JOIN leads l ON t.lead_id = l.id
    WHERE t.status = 'pending' AND t.due_date < datetime('now')
    ORDER BY t.due_date ASC
  `).all();
}

// ─── ANALYSIS ─────────────────────────────────────────────────

function getPipelineStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const totalEmails = db.prepare('SELECT COUNT(*) as count FROM emails').get().count;
  const repliedEmails = db.prepare('SELECT COUNT(*) as count FROM emails WHERE replied = 1').get().count;
  const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count;
  const avgScore = db.prepare("SELECT AVG(score) as avg FROM leads WHERE status != 'lost'").get().avg || 0;

  return {
    total_leads: total,
    by_status: byStatus,
    total_events: totalEvents,
    total_emails_sent: totalEmails,
    emails_replied: repliedEmails,
    response_rate: totalEmails > 0 ? ((repliedEmails / totalEmails) * 100).toFixed(1) : '0.0',
    pending_tasks: pendingTasks,
    avg_lead_score: avgScore.toFixed(1),
  };
}

function saveAnalysis(type, data, insights) {
  db.prepare('INSERT INTO analysis (analysis_type, data, insights) VALUES (?, ?, ?)').run(
    type, JSON.stringify(data), insights
  );
}

module.exports = {
  createLead,
  updateLead,
  changeStatus,
  scoreLead,
  getLeadById,
  getAllLeads,
  getLeadsByStatus,
  getActivePipeline,
  searchLeads,
  trackEmailSent,
  trackEmailReceived,
  sendOutreachEmail,
  sendFollowUpEmail,
  getLeadsNeedingFollowUp,
  getEmailHistory,
  getEmailStats,
  createTask,
  completeTask,
  getPendingTasks,
  getOverdueTasks,
  getPipelineStats,
  saveAnalysis,
};
