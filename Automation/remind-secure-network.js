/**
 * One-shot reminder: Secure Network Architecture task at 4pm
 * Sends email to Lee then self-deletes from Task Scheduler
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_APP_PASSWORD },
});

async function send() {
  await transporter.sendMail({
    from: `"Claude, Chief of Staff" <${process.env.ZOHO_USER}>`,
    to: 'leeakpareva@gmail.com',
    subject: 'REMINDER: Secure Network Architecture — Pick up at 4pm',
    html: `
      <div style="font-family:Inter,sans-serif;background:#080C22;color:#fff;padding:32px;border-radius:12px;">
        <h1 style="color:#C9A84C;margin:0 0 16px;">Reminder: Secure Network Setup</h1>
        <p style="color:#ccc;font-size:15px;">Lee, this is your 4pm reminder to implement the NAVADA Edge secure network architecture.</p>
        <h3 style="color:#E8D5A0;margin:20px 0 8px;">Current Gaps:</h3>
        <ul style="color:#aaa;font-size:14px;">
          <li>Telegram bot polls directly (bypasses Cloudflare/Nginx)</li>
          <li>Flix, Trading API, Scanner, Twilio all bind 0.0.0.0 (exposed)</li>
          <li>Only Twilio inbound goes through full security chain</li>
        </ul>
        <h3 style="color:#E8D5A0;margin:20px 0 8px;">Tasks:</h3>
        <ol style="color:#aaa;font-size:14px;">
          <li>Bind all services to 127.0.0.1</li>
          <li>Switch Telegram to webhook via Cloudflare Tunnel</li>
          <li>Add Flix + Trading routes to Nginx</li>
          <li>Set up Cloudflare Access for admin UIs</li>
          <li>Windows Firewall: block all except Tailscale</li>
          <li>Test all data flows end-to-end</li>
        </ol>
        <p style="color:#666;font-size:12px;margin-top:24px;">
          Plan saved at: Manager/architecture/navada-secure-network.md<br>
          Tell Claude: "implement the secure network plan"
        </p>
        <hr style="border-color:#1A2550;margin:20px 0;">
        <p style="color:#555;font-size:11px;">Claude, Chief of Staff | NAVADA AI Engineering</p>
      </div>
    `,
  });
  console.log('[REMINDER] Secure network email sent to Lee');
}

send().catch(err => {
  console.error('[REMINDER] Failed:', err.message);
  process.exit(1);
});
