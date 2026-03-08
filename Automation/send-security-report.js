#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

async function run() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu', port: 465, secure: true,
    auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_APP_PASSWORD }
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#0D0221">
<div style="max-width:700px;margin:0 auto;padding:40px 30px">

  <!-- Header -->
  <div style="text-align:center;padding:40px 20px;background:linear-gradient(135deg,#FF006E,#8338EC,#3A86FF);border-radius:24px 24px 0 0">
    <h1 style="margin:0;font-size:42px;color:#fff;letter-spacing:8px;text-shadow:0 4px 20px rgba(0,0,0,0.3)">NAVADA</h1>
    <p style="margin:8px 0 0;color:#FFD6FF;font-size:16px;letter-spacing:6px">CLOUDFLARE SECURITY REPORT</p>
    <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,0.15);padding:8px 24px;border-radius:50px;color:#fff;font-size:13px">navada-edge-server.uk | 9 Subdomains Protected</div>
  </div>

  <!-- WAF Rules -->
  <div style="background:#1A0533;padding:30px;border-left:4px solid #FF006E;border-right:4px solid #3A86FF">
    <h2 style="margin:0 0 20px;color:#FF006E;font-size:24px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#FF006E,#FB5607);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#128737;</span>
      WAF Firewall Rules
    </h2>

    <!-- Rule 1 -->
    <div style="background:linear-gradient(135deg,#2D0A4E,#1A0533);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #FF006E44">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FF006E;font-weight:bold;font-size:15px">Block Sensitive Paths</span>
        <span style="background:#FF006E;color:#fff;padding:4px 14px;border-radius:50px;font-size:11px;font-weight:bold">BLOCK</span>
      </div>
      <p style="color:#ccc;margin:10px 0 0;font-size:13px;line-height:1.7">Stops bots scanning for exposed config files, WordPress logins, and database panels. Blocks <code style="background:#FF006E33;color:#FF99C8;padding:2px 6px;border-radius:4px">.env</code> <code style="background:#FF006E33;color:#FF99C8;padding:2px 6px;border-radius:4px">.git</code> <code style="background:#FF006E33;color:#FF99C8;padding:2px 6px;border-radius:4px">wp-admin</code> <code style="background:#FF006E33;color:#FF99C8;padding:2px 6px;border-radius:4px">wp-login</code> <code style="background:#FF006E33;color:#FF99C8;padding:2px 6px;border-radius:4px">phpmyadmin</code></p>
      <div style="margin-top:8px;color:#4CAF50;font-size:12px">&#10004; ACTIVE</div>
    </div>

    <!-- Rule 2 -->
    <div style="background:linear-gradient(135deg,#2D0A4E,#1A0533);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #FB560744">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FB5607;font-weight:bold;font-size:15px">High Threat Score (>30)</span>
        <span style="background:#FB5607;color:#fff;padding:4px 14px;border-radius:50px;font-size:11px;font-weight:bold">BLOCK</span>
      </div>
      <p style="color:#ccc;margin:10px 0 0;font-size:13px;line-height:1.7">Cloudflare scores every visitor 0-100 for threat level. Score above 30 = almost certainly malicious. Blocked immediately.</p>
      <div style="margin-top:8px;color:#FF9800;font-size:12px">&#9888; PENDING</div>
    </div>

    <!-- Rule 3 -->
    <div style="background:linear-gradient(135deg,#2D0A4E,#1A0533);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #FFBE0B44">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FFBE0B;font-weight:bold;font-size:15px">Suspicious Traffic (>10)</span>
        <span style="background:#FFBE0B;color:#1A0533;padding:4px 14px;border-radius:50px;font-size:11px;font-weight:bold">CHALLENGE</span>
      </div>
      <p style="color:#ccc;margin:10px 0 0;font-size:13px;line-height:1.7">Visitors with threat score 10-30 who aren't verified bots (like Google) get a CAPTCHA challenge before access.</p>
      <div style="margin-top:8px;color:#FF9800;font-size:12px">&#9888; PENDING</div>
    </div>

    <!-- Rule 4 -->
    <div style="background:linear-gradient(135deg,#2D0A4E,#1A0533);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #8338EC44">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:#8338EC;font-weight:bold;font-size:15px">Telegram Webhook Lock</span>
        <span style="background:#8338EC;color:#fff;padding:4px 14px;border-radius:50px;font-size:11px;font-weight:bold">BLOCK</span>
      </div>
      <p style="color:#ccc;margin:10px 0 0;font-size:13px;line-height:1.7">Telegram webhook endpoint only accepts requests from Cloudflare's own IP ranges. Blocks fake webhook payloads from attackers.</p>
      <div style="margin-top:8px;color:#FF9800;font-size:12px">&#9888; PENDING</div>
    </div>
  </div>

  <!-- SSL/TLS -->
  <div style="background:#120A2E;padding:30px;border-left:4px solid #3A86FF;border-right:4px solid #8338EC">
    <h2 style="margin:0 0 20px;color:#3A86FF;font-size:24px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#3A86FF,#8338EC);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#128274;</span>
      SSL/TLS Encryption
    </h2>
    <table style="width:100%;border-collapse:separate;border-spacing:0 10px">
      <tr>
        <td style="background:linear-gradient(135deg,#3A86FF,#2563EB);padding:16px 20px;border-radius:12px 0 0 12px;color:#fff;font-weight:bold;width:40%">SSL Mode</td>
        <td style="background:#1E1145;padding:16px 20px;border-radius:0 12px 12px 0;color:#7DD3FC;font-size:15px"><strong>Full</strong> &mdash; End-to-end encryption. No plaintext anywhere.</td>
      </tr>
      <tr>
        <td style="background:linear-gradient(135deg,#8338EC,#6D28D9);padding:16px 20px;border-radius:12px 0 0 12px;color:#fff;font-weight:bold">Always HTTPS</td>
        <td style="background:#1E1145;padding:16px 20px;border-radius:0 12px 12px 0;color:#C4B5FD;font-size:15px"><strong>ON</strong> &mdash; All http:// auto-redirects to https://</td>
      </tr>
      <tr>
        <td style="background:linear-gradient(135deg,#FF006E,#E11D48);padding:16px 20px;border-radius:12px 0 0 12px;color:#fff;font-weight:bold">Min TLS Version</td>
        <td style="background:#1E1145;padding:16px 20px;border-radius:0 12px 12px 0;color:#FDA4AF;font-size:15px"><strong>1.2</strong> &mdash; Blocks insecure TLS 1.0/1.1. All modern browsers supported.</td>
      </tr>
    </table>
  </div>

  <!-- Security Settings -->
  <div style="background:#1A0533;padding:30px;border-left:4px solid #FB5607;border-right:4px solid #FFBE0B">
    <h2 style="margin:0 0 20px;color:#FB5607;font-size:24px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#FB5607,#FFBE0B);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#128170;</span>
      Security Settings
    </h2>
    <table style="width:100%;border-collapse:separate;border-spacing:0 10px">
      <tr>
        <td style="background:linear-gradient(135deg,#FB5607,#E64A19);padding:16px 20px;border-radius:12px 0 0 12px;color:#fff;font-weight:bold;width:40%">Security Level</td>
        <td style="background:#1E1145;padding:16px 20px;border-radius:0 12px 12px 0;color:#FFCC80;font-size:15px"><strong>High</strong> &mdash; Aggressive bot and threat detection. More challenges for suspicious visitors.</td>
      </tr>
      <tr>
        <td style="background:linear-gradient(135deg,#FFBE0B,#F59E0B);padding:16px 20px;border-radius:12px 0 0 12px;color:#1A0533;font-weight:bold">Browser Integrity</td>
        <td style="background:#1E1145;padding:16px 20px;border-radius:0 12px 12px 0;color:#FDE68A;font-size:15px"><strong>ON</strong> &mdash; Checks HTTP headers for bot patterns. Blocks fake browser signatures.</td>
      </tr>
      <tr>
        <td style="background:linear-gradient(135deg,#06D6A0,#10B981);padding:16px 20px;border-radius:12px 0 0 12px;color:#fff;font-weight:bold">Cache Level</td>
        <td style="background:#1E1145;padding:16px 20px;border-radius:0 12px 12px 0;color:#6EE7B7;font-size:15px"><strong>Aggressive</strong> &mdash; Caches static assets automatically. Faster loads, less server strain.</td>
      </tr>
    </table>
  </div>

  <!-- Protected Subdomains -->
  <div style="background:#120A2E;padding:30px;border-left:4px solid #06D6A0;border-right:4px solid #FF006E;border-radius:0 0 24px 24px">
    <h2 style="margin:0 0 20px;color:#06D6A0;font-size:24px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#06D6A0,#3A86FF);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#127760;</span>
      9 Protected Subdomains
    </h2>
    <div style="display:grid;gap:8px">
      <div style="background:linear-gradient(135deg,#FF006E22,#FF006E11);border:1px solid #FF006E44;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FF006E;font-weight:bold">api</span><span style="color:#888;font-size:13px">Telegram Bot + Twilio</span>
      </div>
      <div style="background:linear-gradient(135deg,#FB560722,#FB560711);border:1px solid #FB560744;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FB5607;font-weight:bold">flix</span><span style="color:#888;font-size:13px">Video Streaming</span>
      </div>
      <div style="background:linear-gradient(135deg,#FFBE0B22,#FFBE0B11);border:1px solid #FFBE0B44;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FFBE0B;font-weight:bold">logo</span><span style="color:#888;font-size:13px">NAVADA Online Logo</span>
      </div>
      <div style="background:linear-gradient(135deg,#06D6A022,#06D6A011);border:1px solid #06D6A044;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#06D6A0;font-weight:bold">network</span><span style="color:#888;font-size:13px">Network Scanner</span>
      </div>
      <div style="background:linear-gradient(135deg,#3A86FF22,#3A86FF11);border:1px solid #3A86FF44;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#3A86FF;font-weight:bold">trading</span><span style="color:#888;font-size:13px">Trading API</span>
      </div>
      <div style="background:linear-gradient(135deg,#8338EC22,#8338EC11);border:1px solid #8338EC44;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#8338EC;font-weight:bold">cloudbeaver</span><span style="color:#888;font-size:13px">Database UI</span>
      </div>
      <div style="background:linear-gradient(135deg,#FF006E22,#FF006E11);border:1px solid #FF006E44;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FF006E;font-weight:bold">monitor</span><span style="color:#888;font-size:13px">Uptime Kuma</span>
      </div>
      <div style="background:linear-gradient(135deg,#FB560722,#FB560711);border:1px solid #FB560744;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FB5607;font-weight:bold">grafana</span><span style="color:#888;font-size:13px">Monitoring Dashboards</span>
      </div>
      <div style="background:linear-gradient(135deg,#FFBE0B22,#FFBE0B11);border:1px solid #FFBE0B44;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#FFBE0B;font-weight:bold">kibana</span><span style="color:#888;font-size:13px">ELK Log Search</span>
      </div>
    </div>

    <div style="margin-top:24px;text-align:center;padding:20px;background:linear-gradient(135deg,#FF006E11,#8338EC11,#3A86FF11);border-radius:16px;border:1px solid #ffffff11">
      <p style="margin:0;color:#888;font-size:13px">Traffic Flow</p>
      <p style="margin:10px 0 0;color:#fff;font-size:16px;letter-spacing:1px">
        <span style="color:#3A86FF">Internet</span>
        <span style="color:#555"> &#10140; </span>
        <span style="color:#FB5607">Cloudflare WAF</span>
        <span style="color:#555"> &#10140; </span>
        <span style="color:#8338EC">Tunnel</span>
        <span style="color:#555"> &#10140; </span>
        <span style="color:#06D6A0">Nginx</span>
        <span style="color:#555"> &#10140; </span>
        <span style="color:#FF006E">Service</span>
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:24px;color:#555;font-size:12px">
    <p style="margin:0">NAVADA Edge Infrastructure | Cloudflare Security Report</p>
    <p style="margin:4px 0 0;color:#444">Generated by Claude, Chief of Staff | ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

</div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.ZOHO_USER,
    to: 'leeakpareva@gmail.com',
    subject: 'NAVADA Cloudflare Security Report | WAF + SSL + 9 Subdomains',
    html
  });
  console.log('Email sent to leeakpareva@gmail.com');
}
run().catch(e => console.error('Error:', e.message));
