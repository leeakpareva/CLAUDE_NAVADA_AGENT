/**
 * Email to Malcolm with Claude Code prompt to switch Tailscale to Lee's tailnet
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
<title>Tailscale Network Switch</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Header -->
<tr><td style="padding:24px 16px 16px 16px; text-align:center;">
  <div style="font-size:11px; letter-spacing:3px; color:#00c853; text-transform:uppercase; margin-bottom:8px;">NAVADA EDGE</div>
  <div style="font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">Tailscale Network Setup</div>
  <div style="font-size:13px; color:#888888; margin-top:6px;">One quick step to connect our machines</div>
</td></tr>

<!-- Explanation -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">What's happening</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Malcolm, your Tailscale account now has access to my network (tail394c36.ts.net), but your MacBook is still connected to your own personal network. We need to switch it to mine so our machines can see each other.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 16px;">
  <div style="border-top:1px solid #222222;"></div>
</td></tr>

<!-- Claude Code Prompt Section -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d1f0d; border-radius:8px; border:1px solid #1a3a1a;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#00c853; font-weight:600; margin-bottom:4px;">OPTION 1: Claude Code Prompt</div>
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">Copy everything in the box below and paste it to your Claude Code</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333;">
    <tr><td style="padding:14px;">
      <div style="font-size:12px; color:#e0e0e0; font-family:'Courier New', Courier, monospace; line-height:1.7; white-space:pre-wrap;">I need to switch my MacBook's Tailscale connection to Lee Akpareva's tailnet. Here are the details:

Target tailnet: tail394c36.ts.net
My email on that tailnet: send2chopstix@gmail.com
I have already been approved as a member.

Please do the following:

1. Run "tailscale switch tail394c36.ts.net" to switch to Lee's tailnet

2. If the switch command is not available, run "tailscale logout" and then "tailscale login" and I will authenticate via the browser, selecting Lee's network (tail394c36.ts.net) when prompted

3. After switching, run "tailscale status" to confirm I can see these machines:
   - navada (100.121.187.67) - Lee's Windows server
   - iphone-15-pro-max (100.68.251.111) - Lee's iPhone

4. Run "tailscale ping 100.121.187.67" to confirm connectivity to Lee's server

5. Tell me the results so I can confirm with Lee.</div>
    </td></tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- Divider with OR -->
<tr><td style="padding:12px 16px; text-align:center;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-top:1px solid #222222; width:45%;"></td>
    <td style="width:10%; text-align:center; font-size:12px; color:#666666; padding:0 8px;">OR</td>
    <td style="border-top:1px solid #222222; width:45%;"></td>
  </tr>
  </table>
</td></tr>

<!-- Manual Steps -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:4px;">OPTION 2: Manual Steps</div>
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">If you prefer to do it yourself</div>

    <div style="font-size:13px; color:#aaaaaa; line-height:1.8;">
      <span style="color:#00c853; font-weight:600;">Step 1:</span> Click the Tailscale icon in your Mac menu bar<br>
      <span style="color:#00c853; font-weight:600;">Step 2:</span> Click your account name at the top<br>
      <span style="color:#00c853; font-weight:600;">Step 3:</span> You should see two networks listed. Select <span style="color:#ffffff;">tail394c36.ts.net</span> (Lee's network)<br>
      <span style="color:#00c853; font-weight:600;">Step 4:</span> If you only see one network, click "Sign out", then sign back in with <span style="color:#ffffff;">send2chopstix@gmail.com</span> and choose Lee's network when prompted
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- What happens after -->
<tr><td style="padding:16px 16px 8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">What happens next</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Once you switch, your MacBook will appear on my network. I will then set up a shared folder called <span style="color:#ffffff; font-weight:600;">Lee&amp;Malcolm</span> that we can both access. We will be able to share files instantly between our machines over an encrypted connection.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 16px; text-align:center;">
  <div style="font-size:11px; color:#444444;">NAVADA Edge | Encrypted Mesh Networking</div>
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
      subject: 'Quick Setup: Switch Tailscale to Our Shared Network',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
