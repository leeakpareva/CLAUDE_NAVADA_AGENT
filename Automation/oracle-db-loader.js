#!/usr/bin/env node
/**
 * NAVADA Oracle DB Loader
 * Loads collected inbox replies from JSON files into Oracle XE database.
 * Also used by inbox-collector to insert new emails in real-time.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

if (!process.env.ORACLE_DB_PASSWORD) {
  console.error('[SECURITY] ORACLE_DB_PASSWORD environment variable is required');
  process.exit(1);
}

const DB_CONFIG = {
  user: 'navada',
  password: process.env.ORACLE_DB_PASSWORD,
  connectString: 'localhost:1521/XEPDB1',
};

const INBOX_DIR = path.join(__dirname, 'inbox-replies');

async function getConnection() {
  return await oracledb.getConnection(DB_CONFIG);
}

async function insertReply(conn, email) {
  const sql = `INSERT INTO inbox_replies
    (mail_uid, message_id, received_at, from_email, from_name, to_email, subject, body_text, has_attachments, source_file)
    VALUES (:mail_uid, :message_id, :received_at, :from_email, :from_name, :to_email, :subject, :body_text, :has_attachments, :source_file)`;

  await conn.execute(sql, {
    mail_uid: email.uid || null,
    message_id: email.messageId || null,
    received_at: email.date ? new Date(email.date) : new Date(),
    from_email: (email.from || '').substring(0, 500),
    from_name: (email.fromName || '').substring(0, 500),
    to_email: (email.to || '').substring(0, 500),
    subject: (email.subject || '').substring(0, 1000),
    body_text: (email.textBody || '').substring(0, 4000),
    has_attachments: email.hasAttachments ? 1 : 0,
    source_file: email.sourceFile || null,
  }, { autoCommit: false });
}

async function loadAllFromFiles() {
  if (!fs.existsSync(INBOX_DIR)) {
    console.log('No inbox-replies directory found');
    return;
  }

  const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json') && f !== 'processed-uids.json');
  console.log(`Found ${files.length} email files to load`);

  let conn;
  try {
    conn = await getConnection();
    console.log('Connected to Oracle XE');

    // Check existing count
    const existing = await conn.execute('SELECT COUNT(*) AS cnt FROM inbox_replies');
    console.log(`Existing rows: ${existing.rows[0][0]}`);

    let loaded = 0;
    let skipped = 0;

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(INBOX_DIR, file), 'utf8'));
        data.sourceFile = file;

        // Skip if already loaded (check by message_id)
        if (data.messageId) {
          const check = await conn.execute(
            'SELECT COUNT(*) FROM inbox_replies WHERE message_id = :mid',
            { mid: data.messageId }
          );
          if (check.rows[0][0] > 0) { skipped++; continue; }
        }

        await insertReply(conn, data);
        loaded++;
      } catch (e) {
        console.error(`  Error loading ${file}: ${e.message}`);
      }
    }

    await conn.commit();
    console.log(`Loaded: ${loaded}, Skipped (duplicates): ${skipped}`);

    // Show summary
    const summary = await conn.execute(
      'SELECT COUNT(*) AS total, COUNT(DISTINCT from_email) AS unique_senders FROM inbox_replies'
    );
    console.log(`Total replies in DB: ${summary.rows[0][0]}, Unique senders: ${summary.rows[0][1]}`);

  } finally {
    if (conn) await conn.close();
  }
}

// Export for use by inbox-collector
module.exports = { getConnection, insertReply, DB_CONFIG };

if (require.main === module) {
  loadAllFromFiles()
    .then(() => { console.log('Done.'); process.exit(0); })
    .catch(err => { console.error('Error:', err.message); process.exit(1); });
}
