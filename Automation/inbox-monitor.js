/**
 * NAVADA Inbox Monitor
 * Reads claude.navada@zohomail.eu via IMAP
 * Summarises new emails and flags actionable items
 */

require('dotenv').config({ path: __dirname + '/.env' });
const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const { sendEmail, p, callout } = require('./email-service');

const LAST_CHECK_FILE = path.join(__dirname, 'kb', 'inbox-last-check.json');

const imapConfig = {
  imap: {
    user: process.env.ZOHO_USER,
    password: process.env.ZOHO_APP_PASSWORD,
    host: 'imap.zoho.eu',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
};

function getLastCheck() {
  try {
    const data = JSON.parse(fs.readFileSync(LAST_CHECK_FILE, 'utf8'));
    return new Date(data.lastCheck);
  } catch (e) {
    // Default: last 24 hours
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
}

function saveLastCheck() {
  fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify({ lastCheck: new Date().toISOString() }, null, 2));
}

async function checkInbox() {
  console.log('Connecting to claude.navada@zohomail.eu...');
  const connection = await imapSimple.connect(imapConfig);
  await connection.openBox('INBOX');

  const since = getLastCheck();
  const sinceStr = since.toISOString().slice(0, 10);
  console.log(`Checking emails since: ${sinceStr}`);

  const searchCriteria = [['SINCE', sinceStr], ['UNSEEN']];
  const fetchOptions = { bodies: '', markSeen: false };

  const messages = await connection.search(searchCriteria, fetchOptions);
  console.log(`Found ${messages.length} unread messages.`);

  const emails = [];
  for (const msg of messages) {
    try {
      const raw = msg.parts.find(p => p.which === '');
      if (!raw) continue;
      const parsed = await simpleParser(raw.body);
      emails.push({
        from: parsed.from?.text || 'Unknown',
        subject: parsed.subject || '(no subject)',
        date: parsed.date || new Date(),
        text: (parsed.text || '').substring(0, 500),
        hasAttachments: (parsed.attachments || []).length > 0,
      });
    } catch (e) { /* skip unparseable */ }
  }

  connection.end();
  saveLastCheck();

  return emails;
}

async function checkAndNotify() {
  const emails = await checkInbox();

  if (emails.length === 0) {
    console.log('No new emails.');
    return;
  }

  console.log(`${emails.length} new emails — sending summary to Lee...`);

  const summaryRows = emails.map((e, i) => `
    <div style="padding:10px 0; ${i < emails.length - 1 ? 'border-bottom:1px solid #eaeaea;' : ''}">
      <div style="font-size:13px; font-weight:600; color:#111;">${e.subject}</div>
      <div style="font-size:11px; color:#888; margin-top:2px;">
        From: ${e.from} &middot; ${new Date(e.date).toLocaleString('en-GB')}
        ${e.hasAttachments ? ' &middot; <strong>Has attachments</strong>' : ''}
      </div>
      <div style="font-size:12px; color:#555; margin-top:4px; line-height:1.4;">
        ${e.text.substring(0, 200)}${e.text.length > 200 ? '...' : ''}
      </div>
    </div>`
  ).join('');

  await sendEmail({
    to: 'leeakpareva@gmail.com',
    subject: `Inbox: ${emails.length} new email${emails.length > 1 ? 's' : ''} for Claude`,
    heading: 'Inbox Summary',
    type: 'alert',
    body: [
      p(`${emails.length} unread email${emails.length > 1 ? 's' : ''} received at <strong>claude.navada@zohomail.eu</strong>`),
      summaryRows,
      callout('Reply to this email or tell Claude in chat to action any of these.'),
    ].join(''),
    footerNote: 'Inbox monitor &middot; claude.navada@zohomail.eu',
  });

  console.log('Inbox summary sent to Lee.');
}

if (require.main === module) {
  checkAndNotify()
    .then(() => process.exit(0))
    .catch(e => { console.error('Failed:', e.message); process.exit(1); });
}

module.exports = { checkInbox, checkAndNotify };
