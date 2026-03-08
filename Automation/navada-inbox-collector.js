#!/usr/bin/env node
/**
 * NAVADA Inbox Collector
 * Runs on Oracle VM — polls Gmail IMAP for replies to NAVADA emails,
 * stores them on Oracle filesystem + Oracle XE database, notifies via Telegram.
 *
 * PM2 managed on Oracle: navada-inbox-collector
 */

require('dotenv').config({ path: __dirname + '/.env' });
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const https = require('https');
let dbLoader;
try { dbLoader = require('./oracle-db-loader'); } catch (e) { dbLoader = null; }

const CONFIG = {
  // Gmail IMAP
  imap: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  },
  // Storage
  inboxDir: process.env.INBOX_DIR || path.join(__dirname, 'inbox-replies'),
  indexFile: process.env.INBOX_INDEX || path.join(__dirname, 'inbox-replies', 'index.jsonl'),
  processedFile: process.env.INBOX_PROCESSED || path.join(__dirname, 'inbox-replies', 'processed-uids.json'),
  // Telegram notifications
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramOwnerId: process.env.TELEGRAM_OWNER_ID,
  // Poll interval
  pollInterval: 5 * 60 * 1000, // 5 minutes
  // Search criteria — look for replies to NAVADA/Claude emails
  searchSubjects: ['NAVADA', 'Claude', 'Inspire', 'navada-edge', 'Three-Node', 'Business Case'],
};

// Ensure directories exist
if (!fs.existsSync(CONFIG.inboxDir)) fs.mkdirSync(CONFIG.inboxDir, { recursive: true });

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function getProcessedUids() {
  if (!fs.existsSync(CONFIG.processedFile)) return [];
  try { return JSON.parse(fs.readFileSync(CONFIG.processedFile, 'utf8')); } catch { return []; }
}

function saveProcessedUids(uids) {
  fs.writeFileSync(CONFIG.processedFile, JSON.stringify(uids));
}

function sendTelegram(text) {
  if (!CONFIG.telegramToken || !CONFIG.telegramOwnerId) return;
  const data = JSON.stringify({ chat_id: CONFIG.telegramOwnerId, text, parse_mode: 'HTML' });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${CONFIG.telegramToken}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  });
  req.on('error', (e) => log(`Telegram error: ${e.message}`));
  req.write(data);
  req.end();
}

function checkInbox() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(CONFIG.imap);
    const processedUids = getProcessedUids();
    const newEmails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { imap.end(); return reject(err); }

        // Search for emails from last 7 days that match NAVADA subjects
        const since = new Date();
        since.setDate(since.getDate() - 7);

        // Search for replies (Re: or Fwd: in subject) or emails mentioning NAVADA/Claude
        imap.search([
          ['SINCE', since],
          ['OR',
            ['OR',
              ['SUBJECT', 'NAVADA'],
              ['SUBJECT', 'Claude']
            ],
            ['OR',
              ['SUBJECT', 'Inspire'],
              ['SUBJECT', 'Three-Node']
            ]
          ]
        ], (err, uids) => {
          if (err) { imap.end(); return reject(err); }
          if (!uids || uids.length === 0) {
            log('No matching emails found');
            imap.end();
            return resolve([]);
          }

          // Filter out already processed
          const newUids = uids.filter(uid => !processedUids.includes(uid));
          if (newUids.length === 0) {
            log('No new emails to process');
            imap.end();
            return resolve([]);
          }

          log(`Found ${newUids.length} new email(s) to process`);

          const fetch = imap.fetch(newUids, { bodies: '', struct: true });
          let pending = newUids.length;

          fetch.on('message', (msg, seqno) => {
            let uid;
            msg.on('attributes', (attrs) => { uid = attrs.uid; });
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) { log(`Parse error: ${err.message}`); pending--; return; }

                // Skip emails FROM us (sent items)
                const fromAddr = (parsed.from && parsed.from.text) || '';
                if (fromAddr.includes('leeakpareva@gmail.com') ||
                    fromAddr.includes('claude.navada@zohomail.eu') ||
                    fromAddr.includes('claude@navada-edge-server.uk') ||
                    fromAddr.includes('claude.navada@navada-edge-server.uk') ||
                    fromAddr.includes('navada-ec2@navada-edge-server.uk') ||
                    fromAddr.includes('no-reply@') ||
                    fromAddr.includes('noreply@')) {
                  pending--;
                  if (pending === 0) { imap.end(); resolve(newEmails); }
                  return;
                }

                const emailData = {
                  uid,
                  messageId: parsed.messageId,
                  date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                  from: fromAddr,
                  fromName: (parsed.from && parsed.from.value && parsed.from.value[0] && parsed.from.value[0].name) || '',
                  to: (parsed.to && parsed.to.text) || '',
                  subject: parsed.subject || '(no subject)',
                  textBody: (parsed.text || '').substring(0, 2000),
                  htmlBody: parsed.html || null,
                  hasAttachments: (parsed.attachments && parsed.attachments.length > 0) || false,
                };

                // Save individual email
                const safeDate = emailData.date.replace(/[:.]/g, '-').substring(0, 19);
                const safeName = (emailData.fromName || 'unknown').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
                const filename = `${safeDate}_${safeName}.json`;
                fs.writeFileSync(path.join(CONFIG.inboxDir, filename), JSON.stringify(emailData, null, 2));

                // Append to index
                try {
                  fs.appendFileSync(CONFIG.indexFile, JSON.stringify({
                    uid: emailData.uid,
                    date: emailData.date,
                    from: emailData.from,
                    fromName: emailData.fromName,
                    subject: emailData.subject,
                    preview: emailData.textBody.substring(0, 200),
                    file: filename,
                  }) + '\n');
                } catch (e) { /* ignore */ }

                // Insert into Oracle XE database
                if (dbLoader) {
                  try {
                    const conn = await dbLoader.getConnection();
                    emailData.sourceFile = filename;
                    await dbLoader.insertReply(conn, emailData);
                    await conn.commit();
                    await conn.close();
                  } catch (dbErr) { log(`  DB insert error: ${dbErr.message}`); }
                }

                newEmails.push(emailData);
                processedUids.push(uid);
                log(`  Saved: ${emailData.from} — ${emailData.subject}`);

                pending--;
                if (pending === 0) {
                  saveProcessedUids(processedUids);
                  imap.end();
                  resolve(newEmails);
                }
              });
            });
          });

          fetch.once('error', (err) => { log(`Fetch error: ${err.message}`); imap.end(); reject(err); });
          fetch.once('end', () => {
            if (pending === 0) { saveProcessedUids(processedUids); imap.end(); resolve(newEmails); }
          });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

async function poll() {
  log('Checking inbox...');
  try {
    const newEmails = await checkInbox();
    if (newEmails.length > 0) {
      log(`Collected ${newEmails.length} new reply(ies)`);

      // Send Telegram notification
      let msg = `<b>📬 ${newEmails.length} new NAVADA reply(ies)</b>\n\n`;
      for (const email of newEmails) {
        msg += `<b>From:</b> ${email.fromName || email.from}\n`;
        msg += `<b>Subject:</b> ${email.subject}\n`;
        msg += `<b>Preview:</b> ${email.textBody.substring(0, 100)}...\n\n`;
      }
      msg += `Stored on Oracle: inbox-replies/`;
      sendTelegram(msg);
    }
  } catch (err) {
    log(`Error: ${err.message}`);
  }
}

// Start polling
log('NAVADA Inbox Collector starting...');
log(`Storage: ${CONFIG.inboxDir}`);
log(`Poll interval: ${CONFIG.pollInterval / 1000}s`);
poll();
setInterval(poll, CONFIG.pollInterval);
