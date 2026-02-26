/**
 * NAVADA Lead Pipeline — SQLite Database Layer
 * Full schema for leads, events, tasks, analysis
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'pipeline.db');
const db = new Database(DB_PATH);

// Enable WAL for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ───────────────────────────────────────────────────

db.exec(`
  -- Leads table: core prospect data
  CREATE TABLE IF NOT EXISTS leads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company         TEXT NOT NULL,
    contact_name    TEXT NOT NULL,
    contact_role    TEXT,
    contact_email   TEXT,
    contact_linkedin TEXT,
    sector          TEXT,
    location        TEXT,
    stage           TEXT,
    funding         TEXT,
    company_desc    TEXT,
    navada_fit      TEXT,
    service_match   TEXT,
    priority        INTEGER DEFAULT 0,
    score           REAL DEFAULT 0.0,
    status          TEXT DEFAULT 'new',
    source          TEXT,
    notes           TEXT,
    created_at      DATETIME DEFAULT (datetime('now')),
    updated_at      DATETIME DEFAULT (datetime('now'))
  );

  -- Events table: every single interaction/change logged
  CREATE TABLE IF NOT EXISTS events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id         INTEGER NOT NULL,
    event_type      TEXT NOT NULL,
    event_detail    TEXT,
    event_data      TEXT,
    actor           TEXT DEFAULT 'claude',
    channel         TEXT,
    timestamp       DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  -- Tasks table: actions to take on leads
  CREATE TABLE IF NOT EXISTS tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id         INTEGER,
    title           TEXT NOT NULL,
    description     TEXT,
    due_date        DATETIME,
    status          TEXT DEFAULT 'pending',
    priority        INTEGER DEFAULT 0,
    assigned_to     TEXT DEFAULT 'claude',
    created_at      DATETIME DEFAULT (datetime('now')),
    completed_at    DATETIME,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  -- Emails table: track all outbound/inbound emails
  CREATE TABLE IF NOT EXISTS emails (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id         INTEGER NOT NULL,
    direction       TEXT NOT NULL,
    from_addr       TEXT,
    to_addr         TEXT,
    subject         TEXT,
    body_preview    TEXT,
    message_id      TEXT,
    status          TEXT DEFAULT 'sent',
    opened          INTEGER DEFAULT 0,
    replied         INTEGER DEFAULT 0,
    sent_at         DATETIME DEFAULT (datetime('now')),
    replied_at      DATETIME,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  -- Analysis table: periodic snapshots for training
  CREATE TABLE IF NOT EXISTS analysis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_type   TEXT NOT NULL,
    data            TEXT NOT NULL,
    insights        TEXT,
    created_at      DATETIME DEFAULT (datetime('now'))
  );

  -- Pipeline stages enum reference
  CREATE TABLE IF NOT EXISTS pipeline_stages (
    stage_name      TEXT PRIMARY KEY,
    stage_order     INTEGER,
    description     TEXT
  );

  -- Seed pipeline stages if empty
  INSERT OR IGNORE INTO pipeline_stages VALUES ('new', 1, 'Lead identified, not yet contacted');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('researching', 2, 'Gathering intel on the lead');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('outreach_drafted', 3, 'Intro email drafted, pending approval');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('outreach_sent', 4, 'Intro email sent, awaiting response');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('responded', 5, 'Lead has responded');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('meeting_scheduled', 6, 'Call/meeting booked');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('proposal_sent', 7, 'Proposal or SOW sent');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('negotiating', 8, 'Terms being discussed');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('won', 9, 'Deal closed, engagement started');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('lost', 10, 'Lead declined or went cold');
  INSERT OR IGNORE INTO pipeline_stages VALUES ('nurturing', 11, 'Not ready now, keep warm');

  -- Create indexes for fast queries
  CREATE INDEX IF NOT EXISTS idx_events_lead_id ON events(lead_id);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails(lead_id);
`);

// ─── SCHEMA MIGRATIONS ──────────────────────────────────────
// Add email_type column if not present (intro, followup_1, followup_2, etc.)
try {
  db.exec(`ALTER TABLE emails ADD COLUMN email_type TEXT DEFAULT 'intro'`);
} catch (e) {
  // Column already exists — ignore
}

// Add followup_due column to track when the next follow-up should be sent
try {
  db.exec(`ALTER TABLE emails ADD COLUMN followup_due DATETIME`);
} catch (e) {
  // Column already exists — ignore
}

module.exports = db;
