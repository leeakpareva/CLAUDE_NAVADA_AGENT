/**
 * Email to Malcolm with shared folder access instructions
 * Mobile-first single-column layout
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shared Folder Access</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Header -->
<tr><td style="padding:24px 16px 16px 16px; text-align:center;">
  <div style="font-size:11px; letter-spacing:3px; color:#00c853; text-transform:uppercase; margin-bottom:8px;">CONNECTION LIVE</div>
  <div style="font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">Shared Folder Ready</div>
  <div style="font-size:13px; color:#888888; margin-top:6px;">NAVADA Edge x INSPIRE EDGE</div>
</td></tr>

<!-- Status -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d1f0d; border-radius:8px; border:1px solid #1a3a1a;">
  <tr><td style="padding:16px; text-align:center;">
    <div style="font-size:28px; margin-bottom:4px;">&#9989;</div>
    <div style="font-size:14px; color:#00c853; font-weight:600;">Encrypted link established</div>
    <div style="font-size:12px; color:#888888; margin-top:4px;">navada (Lee) &#8596; maclcolms-macbook-pro (Malcolm)</div>
  </td></tr>
  </table>
</td></tr>

<!-- Test file -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">Test file waiting for you</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      I have placed a file called <span style="color:#ffffff; font-weight:600;">WELCOME.md</span> in our shared folder. If you can see it, the connection is working perfectly.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 16px;">
  <div style="border-top:1px solid #222222;"></div>
</td></tr>

<!-- Access via Finder -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#00c853; font-weight:600; margin-bottom:10px;">OPTION 1: Open in Finder</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.8;">
      <span style="color:#00c853;">Step 1:</span> Open <span style="color:#ffffff;">Finder</span> on your MacBook<br>
      <span style="color:#00c853;">Step 2:</span> Press <span style="color:#ffffff;">Cmd + K</span> (Connect to Server)<br>
      <span style="color:#00c853;">Step 3:</span> Type this address and press Connect:<br>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333; margin-top:8px;">
    <tr><td style="padding:10px 14px;">
      <div style="font-size:13px; color:#ffffff; font-family:'Courier New', Courier, monospace;">http://100.121.187.67:8080/leemalcolm</div>
    </td></tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- Access via Terminal -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#00c853; font-weight:600; margin-bottom:10px;">OPTION 2: Open in Terminal</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6; margin-bottom:8px;">
      Copy and paste this into your Terminal:
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333;">
    <tr><td style="padding:10px 14px;">
      <div style="font-size:12px; color:#e0e0e0; font-family:'Courier New', Courier, monospace; line-height:1.7; white-space:pre-wrap;">ls /Volumes/Tailscale/navada/leemalcolm/</div>
    </td></tr>
    </table>
    <div style="font-size:12px; color:#666666; margin-top:8px;">You should see WELCOME.md listed</div>
  </td></tr>
  </table>
</td></tr>

<!-- Claude Code prompt -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#00c853; font-weight:600; margin-bottom:10px;">OPTION 3: Claude Code Prompt</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6; margin-bottom:8px;">
      Paste this into your Claude Code:
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333;">
    <tr><td style="padding:10px 14px;">
      <div style="font-size:12px; color:#e0e0e0; font-family:'Courier New', Courier, monospace; line-height:1.7; white-space:pre-wrap;">Lee has shared a folder with us via Tailscale Drive. Check if you can access it:

1. Run: ls /Volumes/Tailscale/navada/leemalcolm/
2. If that path doesn't exist, try: open /Volumes/Tailscale/
3. Read the file: cat /Volumes/Tailscale/navada/leemalcolm/WELCOME.md
4. Show me the contents to confirm the connection works.

If you get "No such file", make sure Tailscale is connected and running (check: tailscale status). The share is called "leemalcolm" on the machine "navada".</div>
    </td></tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- How it works -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">How this works</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.8;">
      <span style="color:#00c853;">&#8226;</span> This folder lives on Lee's NAVADA server<br>
      <span style="color:#00c853;">&#8226;</span> Your MacBook can read and write to it over Tailscale<br>
      <span style="color:#00c853;">&#8226;</span> End-to-end WireGuard encryption (no one else can see it)<br>
      <span style="color:#00c853;">&#8226;</span> No cloud, no Dropbox, no Google Drive. Direct machine-to-machine.<br>
      <span style="color:#00c853;">&#8226;</span> Works from anywhere in the world as long as Tailscale is on
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:16px 16px 8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d1f0d; border-radius:8px; border:1px solid #1a3a1a;">
  <tr><td style="padding:16px; text-align:center;">
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Once you confirm you can see the WELCOME.md file, reply to this email or message Lee. We are ready to start building.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 16px; text-align:center;">
  <div style="font-size:11px; color:#444444;">NAVADA Edge x INSPIRE EDGE | Encrypted File Sharing</div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  try {
    const info = await transporter.sendMail({
      from: '"NAVADA Edge" <claude.navada@zohomail.eu>',
      to: 'send2chopstix@gmail.com',
      cc: 'leeakpareva@gmail.com',
      subject: 'Shared Folder Live — Test File Waiting For You',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
