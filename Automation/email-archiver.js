#!/usr/bin/env node
/**
 * NAVADA Email Archiver
 * 1. Auto-saves all future sent emails to crow_theme/Emails/
 * 2. Pulls all historical sent emails from the JSONL log
 *
 * Usage:
 *   node email-archiver.js --pull       Pull all historical sent emails
 *   node email-archiver.js --watch      Watch for new emails and auto-save
 *
 * Integrated into email-service.js via the save-on-send hook.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
let ImapFlow;
try { ImapFlow = require('imapflow').ImapFlow; } catch { ImapFlow = null; }

const EMAILS_DIR = path.resolve(__dirname, '..', 'crow_theme', 'Emails');
const SENT_LOG = path.join(__dirname, 'logs', 'sent-emails.jsonl');
const PULL_STATE = path.join(EMAILS_DIR, '.pull-state.json');

// Ensure dir exists
if (!fs.existsSync(EMAILS_DIR)) fs.mkdirSync(EMAILS_DIR, { recursive: true });

// Gmail IMAP config
const IMAP_CONFIG = {
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  logger: false,
};

function sanitizeFilename(str) {
  return str.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').substring(0, 120);
}

/**
 * Pull ALL sent emails from Gmail Sent folder
 */
async function pullSentEmails() {
  if (!ImapFlow) {
    console.log('imapflow not installed, falling back to local log...');
    pullFromLog();
    return;
  }
  console.log('Connecting to Gmail IMAP...');
  const client = new ImapFlow(IMAP_CONFIG);

  try {
    await client.connect();
    console.log('Connected. Opening [Gmail]/Sent Mail...');

    const lock = await client.getMailboxLock('[Gmail]/Sent Mail');

    try {
      const status = await client.status('[Gmail]/Sent Mail', { messages: true });
      console.log(`Found ${status.messages} messages in Sent Mail`);

      // Load pull state to skip already-pulled emails
      let pullState = {};
      if (fs.existsSync(PULL_STATE)) {
        pullState = JSON.parse(fs.readFileSync(PULL_STATE, 'utf8'));
      }

      let saved = 0;
      let skipped = 0;

      // Fetch all messages — search for emails FROM our addresses
      const searchCriteria = {
        or: [
          { from: process.env.GMAIL_USER || 'leeakpareva@gmail.com' },
          { from: 'claude@navada-edge-server.uk' },
          { from: 'claude.navada@zohomail.eu' },
        ]
      };

      // Just fetch all sent mail
      for await (const message of client.fetch('1:*', {
        envelope: true,
        source: true,
        bodyStructure: true,
      })) {
        const uid = String(message.uid);

        // Skip already pulled
        if (pullState[uid]) {
          skipped++;
          continue;
        }

        const env = message.envelope;
        const date = env.date ? new Date(env.date) : new Date();
        const subject = env.subject || 'No Subject';
        const to = (env.to || []).map(a => a.address).join(', ');
        const from = (env.from || []).map(a => a.address).join(', ');
        const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);

        // Extract HTML body from source
        const source = message.source ? message.source.toString() : '';
        let htmlBody = '';

        // Try to extract HTML part
        const htmlMatch = source.match(/Content-Type:\s*text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i);
        if (htmlMatch) {
          htmlBody = htmlMatch[1];
          // Decode base64 if needed
          if (source.match(/Content-Transfer-Encoding:\s*base64/i)) {
            try {
              htmlBody = Buffer.from(htmlBody.replace(/\s/g, ''), 'base64').toString('utf8');
            } catch {}
          }
          // Decode quoted-printable if needed
          if (source.match(/Content-Transfer-Encoding:\s*quoted-printable/i)) {
            htmlBody = htmlBody.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
          }
        }

        // If no HTML extracted, save the full source
        if (!htmlBody || htmlBody.length < 50) {
          htmlBody = source;
        }

        const filename = `${dateStr}_${sanitizeFilename(subject)}.html`;
        const filepath = path.join(EMAILS_DIR, filename);

        // Add metadata header
        const meta = `<!-- Email Archive
  From: ${from}
  To: ${to}
  Subject: ${subject}
  Date: ${date.toISOString()}
  UID: ${uid}
-->\n`;

        fs.writeFileSync(filepath, meta + htmlBody);
        pullState[uid] = { date: date.toISOString(), subject, to, from };
        saved++;

        if (saved % 10 === 0) {
          console.log(`  Saved ${saved} emails...`);
          // Checkpoint state
          fs.writeFileSync(PULL_STATE, JSON.stringify(pullState, null, 2));
        }
      }

      // Final state save
      fs.writeFileSync(PULL_STATE, JSON.stringify(pullState, null, 2));
      console.log(`Done: ${saved} saved, ${skipped} already archived`);

    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error('IMAP error:', err.message);
    // Fallback: pull from local JSONL log
    console.log('\nFalling back to local sent-emails.jsonl...');
    pullFromLog();
  }
}

/**
 * Pull from local JSONL sent log (fallback / supplementary)
 */
function pullFromLog() {
  if (!fs.existsSync(SENT_LOG)) {
    console.log('No sent-emails.jsonl found');
    return;
  }

  const lines = fs.readFileSync(SENT_LOG, 'utf8').trim().split('\n').filter(Boolean);
  console.log(`Found ${lines.length} entries in sent-emails.jsonl`);

  let saved = 0;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const date = new Date(entry.timestamp);
      const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const subject = entry.subject || 'No Subject';
      const filename = `${dateStr}_${sanitizeFilename(subject)}.html`;
      const filepath = path.join(EMAILS_DIR, filename);

      if (fs.existsSync(filepath)) continue; // skip existing

      // Create a metadata-only file (we don't have the full HTML in the log)
      const content = `<!-- Email Archive (from sent log)
  From: ${entry.from || 'unknown'}
  To: ${entry.to || 'unknown'}
  Subject: ${subject}
  Date: ${entry.timestamp}
  Transport: ${entry.transport || 'unknown'}
  MessageID: ${entry.messageId || 'unknown'}
-->
<!DOCTYPE html>
<html><head><title>${subject}</title></head>
<body style="background:#050505; color:#888; font-family:monospace; padding:40px;">
<h2 style="color:#fff;">${subject}</h2>
<p><strong>To:</strong> ${entry.to}</p>
<p><strong>Date:</strong> ${entry.timestamp}</p>
<p><strong>Via:</strong> ${entry.transport}</p>
<hr style="border-color:#222;">
<p>${entry.preview || 'No preview available'}</p>
</body></html>`;

      fs.writeFileSync(filepath, content);
      saved++;
    } catch {}
  }

  console.log(`Saved ${saved} emails from log to ${EMAILS_DIR}`);
}

/**
 * Save a single email HTML to the archive (called from email-service.js)
 */
function archiveEmail({ subject, html, to, from, timestamp }) {
  try {
    if (!fs.existsSync(EMAILS_DIR)) fs.mkdirSync(EMAILS_DIR, { recursive: true });
    const date = new Date(timestamp || Date.now());
    const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${dateStr}_${sanitizeFilename(subject || 'No_Subject')}.html`;
    const filepath = path.join(EMAILS_DIR, filename);

    const meta = `<!-- Email Archive
  From: ${from || 'Claude | NAVADA'}
  To: ${to || 'unknown'}
  Subject: ${subject || 'No Subject'}
  Date: ${date.toISOString()}
-->\n`;

    fs.writeFileSync(filepath, meta + (html || ''));
    return filepath;
  } catch (err) {
    console.error('Archive failed:', err.message);
    return null;
  }
}

// Export for use in email-service.js
module.exports = { archiveEmail, pullFromLog, EMAILS_DIR };

// CLI
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--pull') {
    pullSentEmails().catch(err => {
      console.error('Pull failed:', err.message);
      console.log('Falling back to local log...');
      pullFromLog();
    });
  } else if (arg === '--log') {
    pullFromLog();
  } else {
    console.log('NAVADA Email Archiver');
    console.log('  --pull   Pull all sent emails from Gmail IMAP');
    console.log('  --log    Pull from local sent-emails.jsonl only');
  }
}
