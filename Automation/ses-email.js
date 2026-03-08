/**
 * AWS SES Email Helper with Local Sent Log
 * Replaces Zoho SMTP with AWS SES for all outgoing email
 * Logs every sent email to logs/sent-emails.jsonl
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const SENT_LOG = path.join(__dirname, 'logs', 'sent-emails.jsonl');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(SENT_LOG))) {
  fs.mkdirSync(path.dirname(SENT_LOG), { recursive: true });
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.AWS_SES_SMTP_HOST || 'email-smtp.eu-west-2.amazonaws.com',
    port: parseInt(process.env.AWS_SES_SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.AWS_SES_SMTP_USER,
      pass: process.env.AWS_SES_SMTP_PASS
    }
  });
  return transporter;
}

/**
 * Send email via AWS SES and log to sent-emails.jsonl
 * @param {object} opts - { to, subject, text, html, cc, bcc, from }
 * @returns {Promise<object>} nodemailer send result
 */
async function sendEmail(opts) {
  const from = opts.from || `Claude NAVADA <${process.env.AWS_SES_FROM || 'claude.navada@navada-edge-server.uk'}>`;
  const mailOpts = { from, ...opts };
  if (!mailOpts.from) mailOpts.from = from;

  const result = await getTransporter().sendMail(mailOpts);

  // Log to sent-emails.jsonl
  const logEntry = {
    timestamp: new Date().toISOString(),
    messageId: result.messageId,
    from,
    to: opts.to,
    cc: opts.cc || null,
    bcc: opts.bcc || null,
    subject: opts.subject,
    preview: (opts.text || '').substring(0, 200)
  };
  fs.appendFileSync(SENT_LOG, JSON.stringify(logEntry) + '\n');

  return result;
}

/**
 * Read sent email log
 * @param {number} limit - number of recent entries (default 20)
 * @returns {Array} recent sent emails
 */
function getSentLog(limit = 20) {
  if (!fs.existsSync(SENT_LOG)) return [];
  const lines = fs.readFileSync(SENT_LOG, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map(l => JSON.parse(l)).reverse();
}

module.exports = { sendEmail, getSentLog, SENT_LOG };
