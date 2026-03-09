/**
 * NAVADA Email Service
 * Unified email sending with NAVADA-branded template
 * Transport chain: Gmail (primary, best deliverability) → SES (when production approved) → Zoho (fallback)
 * BCC to Zoho on every send for sent-items record keeping
 * Signed by Claude — AI Chief of Staff
 */

require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const SENT_LOG = path.join(__dirname, 'logs', 'sent-emails.jsonl');
const SIGNATURE_IMG = path.join(__dirname, '..', 'assets', 'claude-signature.png');

// Auto-archive sent emails to crow_theme/Emails
let archiveEmail;
try { archiveEmail = require('./email-archiver').archiveEmail; } catch { archiveEmail = null; }

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(SENT_LOG))) {
  fs.mkdirSync(path.dirname(SENT_LOG), { recursive: true });
}

// Copy signature image to assets if not already there
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
const sigSrc = path.join(process.env.USERPROFILE || 'C:\\Users\\leeak', 'Downloads', 'Claude signature.png');
if (!fs.existsSync(SIGNATURE_IMG) && fs.existsSync(sigSrc)) {
  fs.copyFileSync(sigSrc, SIGNATURE_IMG);
}

// Primary: Gmail SMTP (best deliverability, Gmail-to-Gmail trusted)
const gmailTransporter = (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

// Secondary: AWS SES (use when production access approved — sends from claude@navada-edge-server.uk)
const sesTransporter = nodemailer.createTransport({
  host: process.env.AWS_SES_SMTP_HOST || 'email-smtp.eu-west-2.amazonaws.com',
  port: parseInt(process.env.AWS_SES_SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.AWS_SES_SMTP_USER,
    pass: process.env.AWS_SES_SMTP_PASS,
  },
});

// Fallback: Zoho
const zohoTransporter = (process.env.ZOHO_USER && process.env.ZOHO_APP_PASSWORD)
  ? nodemailer.createTransport({
      host: 'smtp.zoho.eu',
      port: 465,
      secure: true,
      auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_APP_PASSWORD },
    })
  : null;

// Default from address
const DEFAULT_FROM_EMAIL = process.env.AWS_SES_FROM || 'claude@navada-edge-server.uk';

// Zoho address for BCC record keeping
const ZOHO_EMAIL = process.env.ZOHO_USER || 'claude.navada@zohomail.eu';

// Check if SES has production access (set to true once approved)
const SES_PRODUCTION = process.env.SES_PRODUCTION_ACCESS === 'true';

/**
 * Build NAVADA-branded HTML email
 */
function buildTemplate({ subject, heading, body, preheader, type = 'general', footerNote }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}

<!-- Header -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000000;">
  <tr>
    <td style="padding: 28px 40px;">
      <div style="font-size:22px; font-weight:800; color:#ffffff; letter-spacing:0.15em; font-family: 'Helvetica Neue', Arial, sans-serif;">
        NAVADA
      </div>
      <div style="font-size:11px; color:#999999; letter-spacing:0.08em; margin-top:4px; text-transform:uppercase;">
        AI Engineering & Consulting
      </div>
    </td>
  </tr>
</table>

<!-- Date Bar -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa; border-bottom: 1px solid #eaeaea;">
  <tr>
    <td style="padding: 10px 40px;">
      <span style="font-size:11px; color:#888888; letter-spacing:0.04em;">
        ${dateStr} &middot; ${timeStr}
      </span>
    </td>
  </tr>
</table>

<!-- Heading -->
${heading || subject ? `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 32px 40px 0 40px;">
      <h1 style="margin:0; font-size:20px; font-weight:700; color:#111111; line-height:1.3;">
        ${heading || subject}
      </h1>
    </td>
  </tr>
</table>
` : ''}

<!-- Body Content -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 20px 40px 32px 40px; font-size:14px; line-height:1.7; color:#333333;">
      ${body}
    </td>
  </tr>
</table>

<!-- Divider -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 0 40px;">
      <hr style="border:none; border-top:1px solid #eaeaea; margin:0;">
    </td>
  </tr>
</table>

<!-- Signature Image -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 24px 40px 0 40px;">
      <img src="cid:claude-signature" alt="Claude | NAVADA" style="width:280px; height:auto; display:block;" />
    </td>
  </tr>
</table>

<!-- Signature Details -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 16px 40px 8px 40px;">
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:16px; font-weight:800; color:#000000; letter-spacing:0.03em; font-family:'Helvetica Neue', Arial, sans-serif;">
              CLAUDE
            </div>
            <div style="font-size:10px; font-weight:600; color:#666666; letter-spacing:0.12em; text-transform:uppercase; margin-top:2px;">
              Chief of Staff
            </div>
            <div style="width:40px; height:2px; background:#000000; margin:8px 0;"></div>
            <div style="font-size:12px; color:#555555; line-height:1.6;">
              NAVADA AI Engineering &amp; Consulting<br>
              On behalf of <strong>Lee Akpareva</strong>, Founder<br>
              <a href="tel:+447446994961" style="color:#555555; text-decoration:none;">+44 7446 994961</a>
              &nbsp;|&nbsp;
              <a href="mailto:claude@navada-edge-server.uk" style="color:#555555; text-decoration:none;">claude@navada-edge-server.uk</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa; border-top:1px solid #eaeaea;">
  <tr>
    <td style="padding: 16px 40px 20px 40px;">
      <div style="font-size:10px; color:#aaaaaa; line-height:1.6;">
        ${footerNote ? `${footerNote}<br><br>` : ''}
        NAVADA AI Engineering &amp; Consulting
        <br>
        <a href="https://www.navada-lab.space" style="color:#888888; text-decoration:none;">navada-lab.space</a>
        &middot;
        <a href="https://www.navadarobotics.com" style="color:#888888; text-decoration:none;">navadarobotics.com</a>
        &middot;
        <a href="https://www.navada-edge-server.uk" style="color:#888888; text-decoration:none;">navada-edge-server.uk</a>
        &middot;
        <a href="https://www.alexnavada.xyz" style="color:#888888; text-decoration:none;">alexnavada.xyz</a>
        &middot;
        <a href="https://www.raventerminal.xyz" style="color:#888888; text-decoration:none;">raventerminal.xyz</a>
        &middot;
        <a href="https://www.navada-world-view.xyz" style="color:#888888; text-decoration:none;">navada-world-view.xyz</a>
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/**
 * Send an email using the NAVADA template via AWS SES
 */
async function sendEmail({
  to,
  cc,
  bcc,
  subject,
  heading,
  body,
  type = 'general',
  preheader,
  footerNote,
  fromName = 'Claude | NAVADA',
  attachments,
  rawHtml,
}) {
  const html = rawHtml || buildTemplate({ subject, heading, body, preheader, type, footerNote });

  // Build attachments array with signature image (skip for rawHtml which has its own footer)
  const allAttachments = [];
  if (!rawHtml && fs.existsSync(SIGNATURE_IMG)) {
    allAttachments.push({
      filename: 'claude-signature.png',
      path: SIGNATURE_IMG,
      cid: 'claude-signature',
      contentDisposition: 'inline',
    });
  }
  if (attachments && attachments.length) {
    allAttachments.push(...attachments);
  }

  const mailOpts = {
    to,
    subject,
    html,
    attachments: allAttachments.length ? allAttachments : undefined,
  };

  if (cc) mailOpts.cc = cc;

  // BCC Zoho on every send for record keeping (Claude's sent items)
  const bccList = [ZOHO_EMAIL];
  if (bcc) bccList.push(...(Array.isArray(bcc) ? bcc : [bcc]));
  mailOpts.bcc = bccList.join(', ');

  // Transport chain: SES (if production) → Gmail → Zoho
  let info;
  let transportUsed = '';

  // 1. Try SES if production access is enabled (sends from claude@navada-edge-server.uk)
  if (SES_PRODUCTION) {
    try {
      mailOpts.from = `"${fromName}" <${DEFAULT_FROM_EMAIL}>`;
      info = await sesTransporter.sendMail(mailOpts);
      transportUsed = 'SES';
    } catch (err) {
      console.log(`SES failed (${err.message}), trying Gmail...`);
    }
  }

  // 2. Try Gmail (best deliverability, especially Gmail-to-Gmail)
  if (!info && gmailTransporter) {
    try {
      mailOpts.from = `"${fromName}" <${process.env.GMAIL_USER}>`;
      mailOpts.replyTo = `"${fromName}" <${DEFAULT_FROM_EMAIL}>`;
      info = await gmailTransporter.sendMail(mailOpts);
      transportUsed = 'Gmail';
    } catch (err) {
      console.log(`Gmail failed (${err.message}), trying Zoho...`);
    }
  }

  // 3. Fallback to Zoho
  if (!info && zohoTransporter) {
    mailOpts.from = `"${fromName}" <${process.env.ZOHO_USER}>`;
    mailOpts.replyTo = `"${fromName}" <${DEFAULT_FROM_EMAIL}>`;
    info = await zohoTransporter.sendMail(mailOpts);
    transportUsed = 'Zoho';
  }

  if (!info) {
    throw new Error('All email transports failed');
  }

  // Log to sent-emails.jsonl
  const logEntry = {
    timestamp: new Date().toISOString(),
    messageId: info.messageId,
    transport: transportUsed,
    from: mailOpts.from,
    to,
    cc: cc || null,
    bcc: bcc || null,
    subject,
    preview: (body || '').replace(/<[^>]*>/g, '').substring(0, 200),
  };
  try {
    fs.appendFileSync(SENT_LOG, JSON.stringify(logEntry) + '\n');
  } catch (e) { /* logging should not break email sending */ }

  // Auto-archive to crow_theme/Emails
  if (archiveEmail) {
    try {
      const archived = archiveEmail({ subject, html, to, from: mailOpts.from, timestamp: new Date().toISOString() });
      if (archived) console.log(`Archived to: ${archived}`);
    } catch (e) { /* archiving should not break email sending */ }
  }

  console.log(`Email sent to ${to} via ${transportUsed} — MessageID: ${info.messageId}`);
  return info;
}

/**
 * Read sent email log
 */
function getSentLog(limit = 20) {
  if (!fs.existsSync(SENT_LOG)) return [];
  const lines = fs.readFileSync(SENT_LOG, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map(l => JSON.parse(l)).reverse();
}

/** Helper: wrap text content in styled paragraphs */
function p(text) {
  return `<p style="margin:0 0 12px 0;">${text}</p>`;
}

/** Helper: create a styled data table */
function table(headers, rows) {
  const thStyle = 'padding:8px 12px; font-size:11px; font-weight:600; color:#666666; text-transform:uppercase; letter-spacing:0.06em; border-bottom:2px solid #111111; text-align:left;';
  const tdStyle = 'padding:8px 12px; font-size:13px; color:#333333; border-bottom:1px solid #eaeaea;';

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:12px 0;">
    <thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td style="${tdStyle}">${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

/** Helper: styled key-value list */
function kvList(items) {
  return items.map(([k, v]) =>
    `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0;">
      <span style="font-size:12px; color:#888888;">${k}</span>
      <span style="font-size:13px; font-weight:600; color:#111111;">${v}</span>
    </div>`
  ).join('');
}

/** Helper: callout/highlight box */
function callout(text, style = 'info') {
  const bg = style === 'warning' ? '#fffbe6' : style === 'error' ? '#fff1f0' : '#fafafa';
  const border = style === 'warning' ? '#ffe58f' : style === 'error' ? '#ffa39e' : '#e0e0e0';
  return `<div style="background:${bg}; border-left:3px solid ${border}; padding:12px 16px; margin:12px 0; font-size:13px; border-radius:0 2px 2px 0;">${text}</div>`;
}

module.exports = { sendEmail, buildTemplate, getSentLog, p, table, kvList, callout, SENT_LOG };

// --- CLI Usage ---
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node email-service.js <to> <subject> <body> [type]');
    console.log('Types: report, digest, alert, update, general');
    console.log('Example: node email-service.js user@example.com "Test Report" "Hello, this is a test."');
    process.exit(0);
  }

  const [to, subject, bodyText, type] = args;
  sendEmail({
    to,
    subject,
    body: `<p style="margin:0 0 12px 0;">${bodyText}</p>`,
    type: type || 'general',
  })
    .then(() => { console.log('Done.'); process.exit(0); })
    .catch(err => { console.error('Failed:', err.message); process.exit(1); });
}
