/**
 * NAVADA Lead Pipeline — Event Logger
 * Captures EVERY action for training and analysis
 */

const db = require('./db');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs', 'pipeline.log');

// ─── EVENT TYPES ──────────────────────────────────────────────
const EVENT_TYPES = {
  // Lead lifecycle
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_SCORED: 'lead_scored',
  LEAD_STAGE_CHANGED: 'lead_stage_changed',
  LEAD_PRIORITY_CHANGED: 'lead_priority_changed',
  LEAD_ARCHIVED: 'lead_archived',

  // Research
  RESEARCH_STARTED: 'research_started',
  RESEARCH_COMPLETED: 'research_completed',
  INTEL_ADDED: 'intel_added',

  // Outreach
  EMAIL_DRAFTED: 'email_drafted',
  EMAIL_APPROVED: 'email_approved',
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_REPLIED: 'email_replied',
  EMAIL_BOUNCED: 'email_bounced',
  FOLLOWUP_SCHEDULED: 'followup_scheduled',
  FOLLOWUP_SENT: 'followup_sent',

  // Engagement
  RESPONSE_RECEIVED: 'response_received',
  MEETING_SCHEDULED: 'meeting_scheduled',
  MEETING_COMPLETED: 'meeting_completed',
  PROPOSAL_SENT: 'proposal_sent',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PROPOSAL_REJECTED: 'proposal_rejected',

  // Decisions
  DECISION_MADE: 'decision_made',
  DEAL_WON: 'deal_won',
  DEAL_LOST: 'deal_lost',

  // System
  PIPELINE_SCAN: 'pipeline_scan',
  ANALYSIS_RUN: 'analysis_run',
  REMINDER_SENT: 'reminder_sent',
  ERROR: 'error',
};

// ─── CORE LOGGER ──────────────────────────────────────────────

const stmtInsertEvent = db.prepare(`
  INSERT INTO events (lead_id, event_type, event_detail, event_data, actor, channel)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function logEvent(leadId, eventType, detail, data = null, actor = 'claude', channel = 'system') {
  const dataStr = data ? JSON.stringify(data) : null;

  // Skip DB insert if no valid lead_id (general events go to file log only)
  if (!leadId) {
    const line = `[${new Date().toISOString()}] [${actor}] [${eventType}] lead=0 | ${detail}`;
    console.log(line);
    try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { /* ignore */ }
    return 0;
  }

  // DB insert
  const result = stmtInsertEvent.run(leadId, eventType, detail, dataStr, actor, channel);

  // File log
  const line = `[${new Date().toISOString()}] [${actor}] [${eventType}] lead=${leadId} | ${detail}${dataStr ? ` | data=${dataStr.substring(0, 200)}` : ''}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) { /* ignore */ }

  return result.lastInsertRowid;
}

// ─── CONVENIENCE METHODS ──────────────────────────────────────

function logLeadCreated(leadId, company, contact) {
  return logEvent(leadId, EVENT_TYPES.LEAD_CREATED, `Lead created: ${company} — ${contact}`, { company, contact });
}

function logStageChange(leadId, fromStage, toStage, reason) {
  return logEvent(leadId, EVENT_TYPES.LEAD_STAGE_CHANGED, `Stage: ${fromStage} → ${toStage}`, { from: fromStage, to: toStage, reason });
}

function logEmailSent(leadId, to, subject, messageId) {
  return logEvent(leadId, EVENT_TYPES.EMAIL_SENT, `Email sent to ${to}: "${subject}"`, { to, subject, messageId }, 'claude', 'email');
}

function logEmailReplied(leadId, from, subject) {
  return logEvent(leadId, EVENT_TYPES.EMAIL_REPLIED, `Reply received from ${from}`, { from, subject }, from, 'email');
}

function logResearch(leadId, findings) {
  return logEvent(leadId, EVENT_TYPES.RESEARCH_COMPLETED, `Research completed`, { findings });
}

function logDecision(leadId, decision, reason, actor = 'lee') {
  return logEvent(leadId, EVENT_TYPES.DECISION_MADE, `Decision: ${decision}`, { decision, reason }, actor);
}

function logError(leadId, error) {
  return logEvent(leadId || 0, EVENT_TYPES.ERROR, `Error: ${error}`, null, 'system');
}

// ─── QUERY HELPERS ────────────────────────────────────────────

function getLeadTimeline(leadId) {
  return db.prepare('SELECT * FROM events WHERE lead_id = ? ORDER BY timestamp ASC').all(leadId);
}

function getRecentEvents(limit = 50) {
  return db.prepare('SELECT e.*, l.company FROM events e LEFT JOIN leads l ON e.lead_id = l.id ORDER BY e.timestamp DESC LIMIT ?').all(limit);
}

function getEventsByType(eventType, limit = 100) {
  return db.prepare('SELECT e.*, l.company FROM events e LEFT JOIN leads l ON e.lead_id = l.id WHERE e.event_type = ? ORDER BY e.timestamp DESC LIMIT ?').all(eventType, limit);
}

function getEventCount(leadId) {
  return db.prepare('SELECT COUNT(*) as count FROM events WHERE lead_id = ?').get(leadId).count;
}

module.exports = {
  EVENT_TYPES,
  logEvent,
  logLeadCreated,
  logStageChange,
  logEmailSent,
  logEmailReplied,
  logResearch,
  logDecision,
  logError,
  getLeadTimeline,
  getRecentEvents,
  getEventsByType,
  getEventCount,
};
