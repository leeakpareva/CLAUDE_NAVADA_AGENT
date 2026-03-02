/**
 * Email to Malcolm with Claude Code prompt to set up Zoho email for INSPIRE EDGE
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
<title>INSPIRE EDGE Email Setup</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Header -->
<tr><td style="padding:24px 16px 16px 16px; text-align:center;">
  <div style="font-size:11px; letter-spacing:3px; color:#f5a623; text-transform:uppercase; margin-bottom:8px;">INSPIRE EDGE</div>
  <div style="font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">Email System Setup</div>
  <div style="font-size:13px; color:#888888; margin-top:6px;">Give your AI agent its own mailbox</div>
</td></tr>

<!-- Intro -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">What we are setting up</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Your INSPIRE EDGE server needs its own email address so Claude can send emails on your behalf: client outreach, reports, briefings, marketing. You will be CC'd on every email so nothing goes out without your visibility.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Manual steps first -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1200; border-radius:8px; border:1px solid #3a2a00;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#f5a623; font-weight:600; margin-bottom:4px;">DO THIS FIRST (5 minutes)</div>
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">These steps need a browser. Do them before running the Claude Code prompt.</div>

    <div style="font-size:13px; color:#aaaaaa; line-height:2.0;">
      <span style="color:#f5a623; font-weight:700;">Step 1:</span> Go to <span style="color:#ffffff;">https://www.zoho.com/mail/zohomail-pricing.html</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 2:</span> Click <span style="color:#ffffff;">Forever Free Plan</span> (up to 5 users, 25MB per user)<br>
      <span style="color:#f5a623; font-weight:700;">Step 3:</span> Sign up with your email (<span style="color:#ffffff;">send2chopstix@gmail.com</span>)<br>
      <span style="color:#f5a623; font-weight:700;">Step 4:</span> Choose a Zoho email address for your AI agent, for example:<br>
      <span style="padding-left:20px; color:#ffffff;">inspire.edge@zohomail.eu</span> or <span style="color:#ffffff;">malcolm.inspire@zohomail.eu</span><br>
      <span style="padding-left:20px; color:#888888;">(pick whatever is available, this is your AI agent's email)</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 5:</span> Once your account is created, go to: <span style="color:#ffffff;">https://accounts.zoho.com/home#security/security_pwd</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 6:</span> Scroll to <span style="color:#ffffff;">App Passwords</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 7:</span> Click <span style="color:#ffffff;">Generate New Password</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 8:</span> Name it <span style="color:#ffffff;">INSPIRE EDGE</span> and click Generate<br>
      <span style="color:#f5a623; font-weight:700;">Step 9:</span> <span style="color:#ffffff; font-weight:700;">Copy the app password</span> (you will only see it once)
    </div>

    <div style="font-size:12px; color:#f5a623; margin-top:12px; font-weight:600;">Write down these two things before continuing:</div>
    <div style="font-size:13px; color:#aaaaaa; margin-top:4px; line-height:1.8;">
      1. Your Zoho email address (e.g. inspire.edge@zohomail.eu)<br>
      2. The app password you just generated
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 16px;">
  <div style="border-top:1px solid #222222;"></div>
</td></tr>

<!-- Claude Code Prompt -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d1f0d; border-radius:8px; border:1px solid #1a3a1a;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#f5a623; font-weight:600; margin-bottom:4px;">COPY EVERYTHING BELOW THIS LINE</div>
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">Open Claude Code in Terminal. Paste this entire prompt. Press Enter. Claude will ask you for your Zoho credentials.</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333;">
    <tr><td style="padding:14px;">
      <div style="font-size:12px; color:#e0e0e0; font-family:'Courier New', Courier, monospace; line-height:1.7; white-space:pre-wrap;">Set up the INSPIRE EDGE email system so I can send emails from my AI server. Follow every step carefully.

## OWNER DETAILS
- Name: Malcolm Olagundoye
- Personal email: send2chopstix@gmail.com
- Server name: INSPIRE EDGE

## STEP 1: GET MY ZOHO CREDENTIALS
Ask me for the following two values. Do NOT proceed until I provide them:
1. My Zoho email address (e.g. inspire.edge@zohomail.eu)
2. My Zoho app password

## STEP 2: UPDATE .env FILE
Add these to ~/INSPIRE_EDGE/Automation/.env (create the file if it doesn't exist, preserve any existing entries):

ZOHO_USER=<the zoho email I provide>
ZOHO_APP_PASSWORD=<the app password I provide>
OWNER_NAME=Malcolm Olagundoye
OWNER_EMAIL=send2chopstix@gmail.com
SERVER_NAME=INSPIRE EDGE

## STEP 3: INSTALL DEPENDENCIES
Run in ~/INSPIRE_EDGE/Automation:
npm install nodemailer dotenv

## STEP 4: CREATE EMAIL UTILITY MODULE
Create ~/INSPIRE_EDGE/Automation/mailer.js with a reusable email module:

Requirements:
- Load dotenv from the Automation/.env file
- Create a nodemailer transporter using Zoho SMTP:
  - host: smtp.zoho.eu
  - port: 465
  - secure: true
  - auth: user and pass from ZOHO_USER and ZOHO_APP_PASSWORD env vars
- Export a function called sendEmail that accepts an object with:
  - to (required): recipient email
  - subject (required): email subject line
  - html (required): HTML body content
  - cc (optional): CC recipients (defaults to OWNER_EMAIL so Malcolm is always CC'd)
  - from (optional): sender name and email (defaults to "INSPIRE EDGE <ZOHO_USER>")
- The function should:
  - Always CC send2chopstix@gmail.com on every email unless explicitly overridden
  - Log success with the message ID
  - Log errors clearly
  - Return the nodemailer info object on success
- Also export the transporter for direct use if needed

## STEP 5: CREATE TEST EMAIL SCRIPT
Create ~/INSPIRE_EDGE/Automation/test-email.js that:
- Uses the mailer.js module
- Sends a test email TO send2chopstix@gmail.com
- Subject: "INSPIRE EDGE Email System Live"
- HTML body: a clean, dark-themed email confirming the email system is operational. Include:
  - INSPIRE EDGE header
  - Confirmation message: "Your AI server can now send emails"
  - The Zoho email address being used as the sender
  - The date and time of the test
  - A note that Malcolm will be CC'd on all future emails
- Style it with inline CSS: dark background (#0a0a0a), white text, orange (#f5a623) accents for INSPIRE EDGE branding

## STEP 6: CREATE EMAIL TEMPLATES
Create ~/INSPIRE_EDGE/Automation/email-templates.js that exports reusable HTML email template functions:

a) wrapEmail({ title, subtitle, body }) - base wrapper:
   - Mobile-first, max-width:480px, single column
   - Dark theme: background #0a0a0a, cards #111111, borders #222222
   - INSPIRE EDGE branding in orange (#f5a623) at top
   - Footer: "INSPIRE EDGE | Malcolm Olagundoye"
   - All tables with border="0" cellspacing="0" cellpadding="0"
   - -webkit-text-size-adjust:100%

b) clientEmail({ clientName, body }) - for client outreach:
   - Uses wrapEmail as base
   - Greeting: "Hi [clientName],"
   - Body content
   - Sign-off: "Best regards, Malcolm"

c) reportEmail({ title, sections }) - for reports and briefings:
   - Uses wrapEmail as base
   - sections is an array of { heading, content } objects
   - Each section rendered as a card

## STEP 7: CREATE OUTREACH EMAIL SCRIPT
Create ~/INSPIRE_EDGE/Automation/send-client-email.js that:
- Accepts command line arguments: node send-client-email.js <to> <clientName> <subject> "<message>"
- Uses mailer.js to send
- Uses email-templates.js clientEmail template
- Always CC's send2chopstix@gmail.com
- Example usage: node send-client-email.js "client@email.com" "John" "Meeting Follow Up" "Thank you for the meeting today."

## STEP 8: RUN THE TEST
Run: node ~/INSPIRE_EDGE/Automation/test-email.js
Show me the output. If it succeeds, the email system is live.
If it fails, show me the error and troubleshoot.

## STEP 9: VERIFICATION
After the test email sends, confirm:
1. Show contents of ~/INSPIRE_EDGE/Automation/.env (mask the password with ****)
2. Show file listing: ls -la ~/INSPIRE_EDGE/Automation/
3. Confirm test email was sent successfully

## IMPORTANT RULES FOR ALL FUTURE EMAILS
- Malcolm (send2chopstix@gmail.com) MUST be CC'd on every single email sent by this system. No exceptions.
- All emails must be mobile-first: single column, max-width 480px, 16-20px padding
- Dark theme: #0a0a0a background, #111111 cards, #222222 borders, #f5a623 orange accents
- Never hardcode credentials. Always use .env
- Log all sent emails to ~/INSPIRE_EDGE/Automation/logs/email-log.json (append each send with: date, to, subject, messageId, status)</div>
    </td></tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- What this gives you -->
<tr><td style="padding:16px 16px 8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:10px;">What you get after setup</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.8;">
      <span style="color:#f5a623; font-weight:600;">Your AI's own mailbox</span> &#8212; Claude sends from its own email, not yours<br><br>
      <span style="color:#f5a623; font-weight:600;">CC on everything</span> &#8212; You see every email your AI sends<br><br>
      <span style="color:#f5a623; font-weight:600;">Client outreach</span> &#8212; Send professional emails to clients from Terminal<br><br>
      <span style="color:#f5a623; font-weight:600;">Branded templates</span> &#8212; INSPIRE EDGE dark theme, mobile-first, ready to go<br><br>
      <span style="color:#f5a623; font-weight:600;">Email logging</span> &#8212; Every email logged with date, recipient, subject, and status<br><br>
      <span style="color:#f5a623; font-weight:600;">Reusable system</span> &#8212; mailer.js module works for any future automation
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 16px; text-align:center;">
  <div style="font-size:11px; color:#f5a623;">INSPIRE EDGE</div>
  <div style="font-size:10px; color:#444444; margin-top:4px;">Deployed by NAVADA Edge | Lee Akpareva</div>
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
      subject: 'INSPIRE EDGE: Set Up Your AI Email System (Zoho + Claude Code)',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
