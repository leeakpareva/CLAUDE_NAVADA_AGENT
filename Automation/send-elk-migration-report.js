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
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#0A0E1A">
<div style="max-width:700px;margin:0 auto;padding:40px 30px">

  <!-- Header -->
  <div style="text-align:center;padding:40px 20px;background:linear-gradient(135deg,#06D6A0,#3A86FF,#8338EC);border-radius:24px 24px 0 0">
    <h1 style="margin:0;font-size:38px;color:#fff;letter-spacing:6px;text-shadow:0 4px 20px rgba(0,0,0,0.3)">NAVADA</h1>
    <p style="margin:8px 0 0;color:#D4F5E9;font-size:15px;letter-spacing:5px">ELK MIGRATION REPORT</p>
    <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,0.15);padding:8px 24px;border-radius:50px;color:#fff;font-size:13px">HP Laptop &#10140; Oracle Cloud VM | £0/month</div>
  </div>

  <!-- Migration Summary -->
  <div style="background:#111827;padding:30px;border-left:4px solid #06D6A0;border-right:4px solid #3A86FF">
    <h2 style="margin:0 0 20px;color:#06D6A0;font-size:22px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#06D6A0,#10B981);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#9989;</span>
      Migration Complete
    </h2>

    <table style="width:100%;border-collapse:separate;border-spacing:0 8px">
      <tr>
        <td style="background:#1F2937;padding:14px 16px;border-radius:10px 0 0 10px;color:#9CA3AF;width:35%">Component</td>
        <td style="background:#1F2937;padding:14px 16px;color:#EF4444;width:30%;text-align:center"><s>HP Laptop</s></td>
        <td style="background:#1F2937;padding:14px 16px;border-radius:0 10px 10px 0;color:#06D6A0;text-align:center;font-weight:bold">Oracle VM</td>
      </tr>
      <tr>
        <td style="background:#1a2332;padding:14px 16px;border-radius:10px 0 0 10px;color:#fff;font-weight:bold">Elasticsearch</td>
        <td style="background:#1a2332;padding:14px 16px;color:#EF444488;text-align:center">Docker (1.5GB)</td>
        <td style="background:#1a2332;padding:14px 16px;border-radius:0 10px 10px 0;color:#06D6A0;text-align:center;font-weight:bold">100.77.206.9:9200</td>
      </tr>
      <tr>
        <td style="background:#1a2332;padding:14px 16px;border-radius:10px 0 0 10px;color:#fff;font-weight:bold">Kibana</td>
        <td style="background:#1a2332;padding:14px 16px;color:#EF444488;text-align:center">Docker (583MB)</td>
        <td style="background:#1a2332;padding:14px 16px;border-radius:0 10px 10px 0;color:#06D6A0;text-align:center;font-weight:bold">100.77.206.9:5601</td>
      </tr>
      <tr>
        <td style="background:#1a2332;padding:14px 16px;border-radius:10px 0 0 10px;color:#fff;font-weight:bold">Filebeat</td>
        <td style="background:#1a2332;padding:14px 16px;color:#9CA3AF;text-align:center">localhost:9200</td>
        <td style="background:#1a2332;padding:14px 16px;border-radius:0 10px 10px 0;color:#3A86FF;text-align:center">Same (SSH tunnel)</td>
      </tr>
      <tr>
        <td style="background:#1a2332;padding:14px 16px;border-radius:10px 0 0 10px;color:#fff;font-weight:bold">Nginx Proxy</td>
        <td style="background:#1a2332;padding:14px 16px;color:#9CA3AF;text-align:center">Local Docker</td>
        <td style="background:#1a2332;padding:14px 16px;border-radius:0 10px 10px 0;color:#3A86FF;text-align:center">localhost:5601 (tunnel)</td>
      </tr>
      <tr>
        <td style="background:#1a2332;padding:14px 16px;border-radius:10px 0 0 10px;color:#fff;font-weight:bold">SSH Tunnels</td>
        <td style="background:#1a2332;padding:14px 16px;color:#9CA3AF;text-align:center">N/A</td>
        <td style="background:#1a2332;padding:14px 16px;border-radius:0 10px 10px 0;color:#8338EC;text-align:center;font-weight:bold">PM2 managed</td>
      </tr>
    </table>
  </div>

  <!-- Oracle VM Usage -->
  <div style="background:#0F172A;padding:30px;border-left:4px solid #3A86FF;border-right:4px solid #8338EC">
    <h2 style="margin:0 0 20px;color:#3A86FF;font-size:22px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#3A86FF,#2563EB);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#9729;</span>
      Oracle VM (12GB RAM)
    </h2>

    <!-- RAM bars -->
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#fff;font-size:14px">Oracle XE Database</span><span style="color:#FB5607;font-size:14px;font-weight:bold">2.0 GB</span></div>
      <div style="background:#1F2937;border-radius:8px;height:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#FB5607,#FF7B3A);width:17%;height:100%;border-radius:8px"></div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#fff;font-size:14px">Elasticsearch</span><span style="color:#3A86FF;font-size:14px;font-weight:bold">1.5 GB</span></div>
      <div style="background:#1F2937;border-radius:8px;height:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#3A86FF,#60A5FA);width:13%;height:100%;border-radius:8px"></div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#fff;font-size:14px">Kibana</span><span style="color:#8338EC;font-size:14px;font-weight:bold">583 MB</span></div>
      <div style="background:#1F2937;border-radius:8px;height:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#8338EC,#A855F7);width:5%;height:100%;border-radius:8px"></div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#fff;font-size:14px">CloudBeaver</span><span style="color:#FFBE0B;font-size:14px;font-weight:bold">260 MB</span></div>
      <div style="background:#1F2937;border-radius:8px;height:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#FFBE0B,#FCD34D);width:2%;height:100%;border-radius:8px"></div></div>
    </div>
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#fff;font-size:14px;font-weight:bold">Available</span><span style="color:#06D6A0;font-size:14px;font-weight:bold">6.7 GB</span></div>
      <div style="background:#1F2937;border-radius:8px;height:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#06D6A0,#34D399);width:57%;height:100%;border-radius:8px"></div></div>
    </div>
  </div>

  <!-- Traffic Flow -->
  <div style="background:#111827;padding:30px;border-left:4px solid #8338EC;border-right:4px solid #FF006E">
    <h2 style="margin:0 0 20px;color:#8338EC;font-size:22px">
      <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#8338EC,#A855F7);border-radius:10px;text-align:center;line-height:36px;margin-right:12px;font-size:18px">&#128268;</span>
      Traffic Flow
    </h2>

    <!-- Kibana flow -->
    <div style="background:#1a2332;border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid #8338EC33">
      <p style="margin:0;color:#9CA3AF;font-size:12px;margin-bottom:8px">KIBANA ACCESS</p>
      <p style="margin:0;color:#fff;font-size:14px;line-height:2">
        <span style="background:#3A86FF33;color:#3A86FF;padding:4px 10px;border-radius:6px">Browser</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#FB560733;color:#FB5607;padding:4px 10px;border-radius:6px">Cloudflare</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#8338EC33;color:#8338EC;padding:4px 10px;border-radius:6px">Tunnel</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#06D6A033;color:#06D6A0;padding:4px 10px;border-radius:6px">HP Nginx</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#FF006E33;color:#FF006E;padding:4px 10px;border-radius:6px">SSH Tunnel</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#FFBE0B33;color:#FFBE0B;padding:4px 10px;border-radius:6px">Oracle :5601</span>
      </p>
    </div>

    <!-- Filebeat flow -->
    <div style="background:#1a2332;border-radius:12px;padding:16px;border:1px solid #06D6A033">
      <p style="margin:0;color:#9CA3AF;font-size:12px;margin-bottom:8px">LOG SHIPPING</p>
      <p style="margin:0;color:#fff;font-size:14px;line-height:2">
        <span style="background:#3A86FF33;color:#3A86FF;padding:4px 10px;border-radius:6px">Filebeat (HP)</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#06D6A033;color:#06D6A0;padding:4px 10px;border-radius:6px">localhost:9200</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#FF006E33;color:#FF006E;padding:4px 10px;border-radius:6px">SSH Tunnel</span>
        <span style="color:#555"> &#10140; </span>
        <span style="background:#FFBE0B33;color:#FFBE0B;padding:4px 10px;border-radius:6px">Oracle :9200</span>
      </p>
    </div>
  </div>

  <!-- Cost -->
  <div style="background:#0F172A;padding:30px;border-left:4px solid #06D6A0;border-right:4px solid #06D6A0;border-radius:0 0 24px 24px">
    <div style="text-align:center">
      <div style="display:inline-block;background:linear-gradient(135deg,#06D6A022,#06D6A011);border:2px solid #06D6A0;border-radius:16px;padding:24px 40px">
        <p style="margin:0;color:#9CA3AF;font-size:13px;letter-spacing:2px">MONTHLY COST</p>
        <p style="margin:8px 0 0;color:#06D6A0;font-size:48px;font-weight:bold;letter-spacing:2px">&#163;0</p>
        <p style="margin:8px 0 0;color:#6EE7B7;font-size:14px">Oracle Cloud Always Free Tier</p>
      </div>
    </div>

    <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <div style="background:#1F2937;border-radius:10px;padding:12px 20px;text-align:center">
        <p style="margin:0;color:#06D6A0;font-size:20px;font-weight:bold">12 GB</p>
        <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px">Oracle RAM</p>
      </div>
      <div style="background:#1F2937;border-radius:10px;padding:12px 20px;text-align:center">
        <p style="margin:0;color:#3A86FF;font-size:20px;font-weight:bold">45 GB</p>
        <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px">Oracle Disk</p>
      </div>
      <div style="background:#1F2937;border-radius:10px;padding:12px 20px;text-align:center">
        <p style="margin:0;color:#8338EC;font-size:20px;font-weight:bold">4</p>
        <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px">Services Running</p>
      </div>
      <div style="background:#1F2937;border-radius:10px;padding:12px 20px;text-align:center">
        <p style="margin:0;color:#FFBE0B;font-size:20px;font-weight:bold">~3 GB</p>
        <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px">Freed on HP</p>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:24px;color:#555;font-size:12px">
    <p style="margin:0">NAVADA Edge Infrastructure | ELK Migration Report</p>
    <p style="margin:4px 0 0;color:#444">Generated by Claude, Chief of Staff | ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

</div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.ZOHO_USER,
    to: 'leeakpareva@gmail.com',
    subject: 'NAVADA ELK Migration Complete | HP Laptop → Oracle Cloud VM (£0/mo)',
    html
  });
  console.log('Email sent to leeakpareva@gmail.com');
}
run().catch(e => console.error('Error:', e.message));
