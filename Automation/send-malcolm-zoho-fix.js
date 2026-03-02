/**
 * Email to Malcolm with Claude Code prompt to fix Zoho 535 auth error
 * Mobile-first single-column layout
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const MALCOLM_EMAIL = 'send2chopstix@gmail.com';

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
<title>Fix Zoho Email Auth</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Header -->
<tr><td style="padding:24px 16px 16px 16px; text-align:center;">
  <div style="font-size:11px; letter-spacing:3px; color:#e94560; text-transform:uppercase; margin-bottom:8px;">FIX REQUIRED</div>
  <div style="font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">Zoho Email Auth Error</div>
  <div style="font-size:13px; color:#888888; margin-top:6px;">535 Authentication Failed — here is how to fix it</div>
</td></tr>

<!-- What's wrong -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a0a0a; border-radius:8px; border:1px solid #3a1a1a;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#e94560; font-weight:600; margin-bottom:8px;">The Problem</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Zoho is rejecting the login because <span style="color:#ffffff; font-weight:600;">App Passwords only work when Two-Factor Authentication (2FA) is turned ON</span>. Without 2FA enabled, Zoho ignores app passwords entirely.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 16px;">
  <div style="border-top:1px solid #222222;"></div>
</td></tr>

<!-- Manual fix steps -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1200; border-radius:8px; border:1px solid #3a2a00;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#f5a623; font-weight:600; margin-bottom:4px;">DO THIS IN YOUR BROWSER (3 minutes)</div>
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">Follow these steps exactly, then run the Claude Code prompt below.</div>

    <div style="font-size:13px; color:#aaaaaa; line-height:2.2;">
      <span style="color:#f5a623; font-weight:700;">Step 1:</span> Go to <span style="color:#ffffff;">https://accounts.zoho.com/home#security/security_pwd</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 2:</span> Sign in with your Zoho email (<span style="color:#ffffff;">inspire.edge@zohomail.eu</span>)<br>
      <span style="color:#f5a623; font-weight:700;">Step 3:</span> Look for <span style="color:#ffffff;">Multi-Factor Authentication</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 4:</span> Click <span style="color:#ffffff;">Enable</span> (use the OTP Authenticator or SMS option)<br>
      <span style="color:#f5a623; font-weight:700;">Step 5:</span> Complete the 2FA setup (scan QR code with Google Authenticator or get SMS)<br>
      <span style="color:#f5a623; font-weight:700;">Step 6:</span> Once 2FA is ON, go to <span style="color:#ffffff;">App Passwords</span> (same security page)<br>
      <span style="color:#f5a623; font-weight:700;">Step 7:</span> <span style="color:#e94560;">Delete the old app password</span> you created earlier<br>
      <span style="color:#f5a623; font-weight:700;">Step 8:</span> Click <span style="color:#ffffff;">Generate New Password</span><br>
      <span style="color:#f5a623; font-weight:700;">Step 9:</span> Name it <span style="color:#ffffff;">INSPIRE EDGE</span> and click Generate<br>
      <span style="color:#f5a623; font-weight:700;">Step 10:</span> <span style="color:#ffffff; font-weight:700;">Copy the new app password</span> (you will only see it once)
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Important note -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">Important: Check your Zoho region</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      If your Zoho email ends in <span style="color:#ffffff;">@zohomail.eu</span>, you need the EU server settings. If it ends in <span style="color:#ffffff;">@zohomail.com</span>, you need the US settings. The Claude Code prompt below handles both. Also check which URL works for your login:<br><br>
      <span style="color:#f5a623;">EU:</span> <span style="color:#ffffff;">accounts.zoho.eu</span> / <span style="color:#ffffff;">mail.zoho.eu</span><br>
      <span style="color:#f5a623;">US:</span> <span style="color:#ffffff;">accounts.zoho.com</span> / <span style="color:#ffffff;">mail.zoho.com</span>
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
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">After completing the browser steps above, paste this into Claude Code.</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333;">
    <tr><td style="padding:14px;">
      <div style="font-size:12px; color:#e0e0e0; font-family:'Courier New', Courier, monospace; line-height:1.7; white-space:pre-wrap;">Fix the Zoho 535 Authentication Failed error. The issue was that 2FA was not enabled. I have now enabled 2FA and generated a new app password.

## STEP 1: GET MY NEW CREDENTIALS
Ask me for my new Zoho app password. Do NOT proceed until I provide it.

Also ask me to confirm:
- My exact Zoho email address (e.g. inspire.edge@zohomail.eu)
- Whether my Zoho account is EU or US (check if I log in at zoho.eu or zoho.com)

## STEP 2: UPDATE .env
Update ~/INSPIRE_EDGE/Automation/.env with the new app password. Replace the old ZOHO_APP_PASSWORD value with the new one I provide. Keep all other entries.

## STEP 3: CHECK SMTP HOST
Read the mailer.js file. Verify the SMTP settings match my Zoho region:

If my email ends in @zohomail.eu (EU account):
- host: smtp.zoho.eu
- port: 465
- secure: true

If my email ends in @zohomail.com (US account):
- host: smtp.zoho.com
- port: 465
- secure: true

Update mailer.js if the host is wrong.

## STEP 4: VERIFY .env IS LOADING CORRECTLY
Add a debug check to test-email.js temporarily. Before sending, log:
- ZOHO_USER value (show it)
- ZOHO_APP_PASSWORD length (show length only, NOT the actual password)
- Confirm both are defined and not empty

If either is undefined or empty, the .env file is not loading correctly. Check:
- The path to .env in dotenv config
- That dotenv is requiring the correct path: require('dotenv').config({ path: __dirname + '/.env' })
- That .env has no extra spaces around the = sign
- That the password has no trailing whitespace or newline

## STEP 5: RUN TEST
Run: node ~/INSPIRE_EDGE/Automation/test-email.js

If it works, show me the success output.

If it still fails with 535, try these additional fixes:
1. Check if Zoho requires "less secure app access" to be enabled at https://accounts.zoho.eu/home#security/security_pwd
2. Try using the account password directly (not app password) as a test
3. Check if the Zoho account email verification is complete
4. Try port 587 with secure:false and requireTLS:true as an alternative

## STEP 6: CLEAN UP
Once the test email sends successfully:
1. Remove the debug logging from test-email.js
2. Run the test one final time to confirm clean output
3. Show me the results</div>
    </td></tr>
    </table>
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
      to: MALCOLM_EMAIL,
      cc: 'leeakpareva@gmail.com',
      subject: 'Fix: Zoho Email Auth Error — Enable 2FA First (Steps Inside)',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
