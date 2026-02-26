/**
 * NAVADA Email Service
 * Unified email sending with NAVADA-branded B&W template
 * Signed by Claude — AI Chief of Staff
 */

require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

// Primary: Claude's own Zoho email
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

// Fallback: Gmail (for legacy scripts)
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Build NAVADA-branded HTML email
 * @param {Object} opts
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.heading - Main heading inside email (optional, defaults to subject)
 * @param {string} opts.body - HTML body content (main section)
 * @param {string} opts.preheader - Preview text in inbox (optional)
 * @param {string} opts.type - Email type tag: 'report' | 'digest' | 'alert' | 'update' | 'general'
 * @param {string} opts.footerNote - Extra footer line (optional)
 */
function buildTemplate({ subject, heading, body, preheader, type = 'general', footerNote }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

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

<!-- Signature -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 20px 40px 8px 40px;">
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-right:14px; vertical-align:top; width:36px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" style="width:36px;height:36px;" arcsize="11%" fillcolor="#000000" stroke="f">
              <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0"><center style="color:#ffffff;font-size:16px;font-weight:800;">C</center></v:textbox>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
              <td style="width:36px; height:36px; background:#000000; border-radius:4px; text-align:center; vertical-align:middle; color:#ffffff; font-size:16px; font-weight:800; font-family:'Helvetica Neue', Arial, sans-serif;">
                C
              </td>
            </tr></table>
            <!--<![endif]-->
          </td>
          <td style="vertical-align:top;">
            <div style="font-size:13px; font-weight:700; color:#111111;">Claude</div>
            <div style="font-size:11px; color:#888888; line-height:1.4;">
              AI Chief of Staff &middot; NAVADA<br>
              On behalf of Lee Akpareva
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 16px 40px 32px 40px;">
      <div style="font-size:10px; color:#aaaaaa; line-height:1.5;">
        ${footerNote ? `${footerNote}<br>` : ''}
        Automated by Claude Code &middot; NAVADA Server (NAVADA\\leeak)
        <br>
        <a href="https://www.navadarobotics.com" style="color:#888888; text-decoration:none;">navadarobotics.com</a>
        &middot;
        <a href="https://www.navada-lab.space" style="color:#888888; text-decoration:none;">navada-lab.space</a>
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/**
 * Send an email using the NAVADA template
 * @param {Object} opts
 * @param {string} opts.to - Recipient email (or comma-separated)
 * @param {string} opts.subject - Subject line
 * @param {string} opts.heading - Optional heading override
 * @param {string} opts.body - HTML body content
 * @param {string} opts.type - 'report' | 'digest' | 'alert' | 'update' | 'general'
 * @param {string} opts.preheader - Inbox preview text
 * @param {string} opts.footerNote - Extra footer text
 * @param {string} opts.fromName - Sender display name (default: "Claude | NAVADA")
 * @param {Array}  opts.attachments - Nodemailer attachments array (optional)
 * @param {string} opts.cc - CC recipient(s) (optional)
 * @param {string} opts.bcc - BCC recipient(s) (optional)
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
}) {
  const html = buildTemplate({ subject, heading, body, preheader, type, footerNote });

  const mailOpts = {
    from: `"${fromName}" <${process.env.ZOHO_USER}>`,
    to,
    subject,
    html,
  };

  if (cc) mailOpts.cc = cc;
  if (bcc) mailOpts.bcc = bcc;

  if (attachments && attachments.length) {
    mailOpts.attachments = attachments;
  }

  const info = await transporter.sendMail(mailOpts);
  console.log(`Email sent to ${to} — MessageID: ${info.messageId}`);
  return info;
}

/**
 * Helper: wrap text content in styled paragraphs
 */
function p(text) {
  return `<p style="margin:0 0 12px 0;">${text}</p>`;
}

/**
 * Helper: create a styled data table
 * @param {string[]} headers - Column headers
 * @param {string[][]} rows - Row data
 */
function table(headers, rows) {
  const thStyle = 'padding:8px 12px; font-size:11px; font-weight:600; color:#666666; text-transform:uppercase; letter-spacing:0.06em; border-bottom:2px solid #111111; text-align:left;';
  const tdStyle = 'padding:8px 12px; font-size:13px; color:#333333; border-bottom:1px solid #eaeaea;';

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:12px 0;">
    <thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td style="${tdStyle}">${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

/**
 * Helper: styled key-value list
 */
function kvList(items) {
  return items.map(([k, v]) =>
    `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0;">
      <span style="font-size:12px; color:#888888;">${k}</span>
      <span style="font-size:13px; font-weight:600; color:#111111;">${v}</span>
    </div>`
  ).join('');
}

/**
 * Helper: callout/highlight box
 */
function callout(text, style = 'info') {
  const bg = style === 'warning' ? '#fffbe6' : style === 'error' ? '#fff1f0' : '#fafafa';
  const border = style === 'warning' ? '#ffe58f' : style === 'error' ? '#ffa39e' : '#e0e0e0';
  return `<div style="background:${bg}; border-left:3px solid ${border}; padding:12px 16px; margin:12px 0; font-size:13px; border-radius:0 2px 2px 0;">${text}</div>`;
}

module.exports = { sendEmail, buildTemplate, p, table, kvList, callout };

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
