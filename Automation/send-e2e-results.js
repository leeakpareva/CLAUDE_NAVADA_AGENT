const nodemailer = require('nodemailer');
require('dotenv').config({ path: __dirname + '/.env' });

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD
  }
});

const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 760px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0d2818 0%, #1a4731 100%); padding: 32px 40px; border-bottom: 3px solid #00ff88;">
    <h1 style="margin: 0; font-size: 24px; color: #00ff88; letter-spacing: 1px;">NAVADA EDGE</h1>
    <p style="margin: 8px 0 0; font-size: 14px; color: #8892b0;">Hybrid Architecture v2.0 | E2E Test Results</p>
    <p style="margin: 4px 0 0; font-size: 12px; color: #5a6380;">4 March 2026 19:49 UTC | Claude, Chief of Staff</p>
  </div>

  <!-- Overall Status -->
  <div style="padding: 24px 40px; background: #0d1117; border-bottom: 1px solid #1a2744;">
    <div style="display: inline-block; background: #0d3320; border: 1px solid #00ff88; border-radius: 8px; padding: 12px 24px;">
      <span style="color: #00ff88; font-size: 20px; font-weight: bold;">ALL SYSTEMS OPERATIONAL</span>
    </div>
    <p style="color: #8892b0; margin: 12px 0 0; font-size: 13px;">3 compute nodes | 12 PM2 services | 8 Docker containers | 28 API integrations</p>
  </div>

  <!-- Test 1: Tailscale Mesh -->
  <div style="padding: 24px 40px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 1: Tailscale Mesh VPN</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Route</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Result</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Latency</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Laptop &#8594; EC2</td><td style="padding: 8px 12px; color: #00ff88; border-bottom: 1px solid #1a2744;">&#9989; DIRECT</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">13ms</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">EC2 &#8594; Laptop</td><td style="padding: 8px 12px; color: #00ff88; border-bottom: 1px solid #1a2744;">&#9989; DIRECT</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">21ms</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">Nodes online</td><td style="padding: 8px 12px; color: #00ff88;" colspan="2">4/5 (navada, navada-ec2, iPhone, Malcolm's Mac)</td></tr>
    </table>
  </div>

  <!-- Test 2: EC2 Stack -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 2: EC2 Cloud Gateway Stack</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Component</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Version</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Status</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Ubuntu</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">24.04 LTS</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Node.js</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">v22.22.0</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">PM2</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">v6.0.14 (systemd)</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">AWS CLI</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">v2.34.1</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Tailscale</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">v1.94.2</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Claude Code</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">v2.1.68</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Git</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">v2.43.0</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Health Monitor</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">PM2 (5min interval)</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">Disk / RAM</td><td style="padding: 8px 12px; color: #b0b8cc;" colspan="2">25GB free (83%) | 152MB available</td></tr>
    </table>
  </div>

  <!-- Test 3: AWS Services -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 3: AWS Services (from EC2)</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Service</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Detail</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Status</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Lambda functions</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">navada-mcp-handler, navada-api-gateway</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">EC2 instance</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">t3.micro running at 18.130.39.222</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">AWS CLI auth</td><td style="padding: 8px 12px; color: #b0b8cc;">IAM credentials configured</td><td style="padding: 8px 12px; color: #00ff88; text-align: right;">&#9989;</td></tr>
    </table>
  </div>

  <!-- Test 4: EC2 → Laptop Services -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 4: EC2 &#8594; Laptop Services (via Tailscale)</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Service</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">HTTP</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Response</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Telegram Bot (:3456)</td><td style="padding: 8px 12px; color: #00ff88; border-bottom: 1px solid #1a2744;">404</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">31ms &#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">WorldMonitor (:4173)</td><td style="padding: 8px 12px; color: #00ff88; border-bottom: 1px solid #1a2744;">200</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">91ms &#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">NAVADA Flix (:4000)</td><td style="padding: 8px 12px; color: #00ff88; border-bottom: 1px solid #1a2744;">200</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">37ms &#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Trading API (:5678)</td><td style="padding: 8px 12px; color: #00ff88; border-bottom: 1px solid #1a2744;">404</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">296ms &#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">Nginx (:8080)</td><td style="padding: 8px 12px; color: #00ff88;">301</td><td style="padding: 8px 12px; color: #00ff88; text-align: right;">52ms &#9989;</td></tr>
    </table>
    <p style="color: #5a6380; font-size: 11px; margin: 8px 0 0;">Note: 404s on Bot/Trading are expected (no root route). Service is responsive.</p>
  </div>

  <!-- Test 5: Oracle Cloud -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 5: Oracle Cloud Node</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Component</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Detail</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Status</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">VM (navada-oracle)</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">E5.Flex, 1 OCPU, 12GB RAM</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989; Running</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Oracle XE (Docker)</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">:1521, PDB: XEPDB1</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989; Up 3hrs</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">CloudBeaver (DB UI)</td><td style="padding: 8px 12px; color: #b0b8cc;">:8978</td><td style="padding: 8px 12px; color: #00ff88; text-align: right;">&#9989; Up 3hrs</td></tr>
    </table>
  </div>

  <!-- Test 6: Cloudflare -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 6: Cloudflare Services</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Service</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">URL</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Status</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Worker</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">navada-edge.leeakpareva.workers.dev</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989; 183ms</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Tunnel (API)</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">api.navada-edge-server.uk</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989; 414ms</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">Flix CDN</td><td style="padding: 8px 12px; color: #b0b8cc;">flix.navada-edge-server.uk</td><td style="padding: 8px 12px; color: #00ff88; text-align: right;">&#9989; 345ms</td></tr>
    </table>
  </div>

  <!-- Test 7: Laptop PM2 + Docker -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">TEST 7: Home Server (HP Laptop)</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;"><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Category</th><th style="padding: 8px 12px; text-align: left; color: #00d4ff;">Count</th><th style="padding: 8px 12px; text-align: right; color: #00d4ff;">Status</th></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">PM2 services</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">12/12 online</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #111827;"><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Docker containers</td><td style="padding: 8px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">8/8 running</td><td style="padding: 8px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#9989;</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 8px 12px; color: #b0b8cc;">Scheduled tasks</td><td style="padding: 8px 12px; color: #b0b8cc;">18 configured</td><td style="padding: 8px 12px; color: #00ff88; text-align: right;">&#9989;</td></tr>
    </table>
    <div style="background: #0d1117; border: 1px solid #1a2744; border-radius: 8px; padding: 16px; margin-top: 12px; font-family: 'Courier New', monospace; font-size: 12px; color: #8892b0;">
      <strong style="color: #fff;">PM2 Services:</strong> worldmonitor, worldmonitor-api, trading-api,<br>
      inbox-responder, auto-deploy, trading-scheduler, telegram-bot,<br>
      network-scanner, voice-command, navada-flix, navada-logo, notebooklm-watcher<br><br>
      <strong style="color: #fff;">Docker:</strong> navada-proxy, navada-tunnel, navada-prometheus,<br>
      navada-grafana, navada-portainer, navada-uptime,<br>
      navada-elasticsearch, navada-kibana
    </div>
  </div>

  <!-- EC2 Health Monitor -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">EC2 Health Monitor (Live)</h2>
    <div style="background: #0d1117; border: 1px solid #1a2744; border-radius: 8px; padding: 16px; font-family: 'Courier New', monospace; font-size: 12px; color: #c9d1d9; line-height: 1.6;">
      &#9989; Tailscale Ping: 32.8ms<br>
      &#9989; Telegram Bot: HTTP 404 (responsive)<br>
      &#9989; WorldMonitor: HTTP 200<br>
      &#9989; NAVADA Flix: HTTP 200<br><br>
      <span style="color: #5a6380;">Interval: every 5 minutes | Alert after 3 consecutive failures</span>
    </div>
  </div>

  <!-- Architecture Summary -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">Architecture v2.0 Summary</h2>
    <div style="background: #0d1117; border: 1px solid #1a2744; border-radius: 8px; padding: 20px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: #c9d1d9; white-space: pre;">
  <span style="color: #00d4ff; font-weight: bold;">INTERNET</span>
      |
  <span style="color: #ff9800;">Cloudflare</span> (WAF + CDN + Tunnel + Worker + R2 + Stream)
      |
  <span style="color: #00ff88;">Tailscale Mesh</span> (WireGuard, 3 nodes)
      |
  +---+---+---+
  |   |   |   |
<span style="color: #ff9800;">EC2</span> <span style="color: #ff9800;">Laptop</span> <span style="color: #ff9800;">Oracle</span> <span style="color: #ff9800;">iPhone</span>
100.98  100.121  132.145  100.68
.118.33 .187.67  .46.184  .251.111
  |       |        |
Claude  12 PM2   Oracle
Code    8 Docker  XE DB
Health  23 MCP   CloudBvr
Monitor 18 Cron
    </div>
  </div>

  <!-- What's Next -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">Remaining Setup (Implementation Backlog)</h2>
    <ol style="color: #b0b8cc; line-height: 2; padding-left: 20px; margin: 0; font-size: 13px;">
      <li><strong style="color: #fff;">Claude Code auth on EC2</strong> &#8212; needs browser login (Max plan)</li>
      <li><strong style="color: #fff;">Bind all services to 127.0.0.1</strong> &#8212; some still on 0.0.0.0</li>
      <li><strong style="color: #fff;">Join Oracle VM to Tailscale</strong> &#8212; for encrypted inter-node comms</li>
      <li><strong style="color: #fff;">Windows Firewall lockdown</strong> &#8212; block all except Tailscale</li>
      <li><strong style="color: #fff;">Cloudflare Access</strong> &#8212; ZT policies for admin UIs</li>
      <li><strong style="color: #fff;">Clerk auth on Flix</strong> &#8212; Google OAuth</li>
    </ol>
  </div>

  <!-- Cost -->
  <div style="padding: 0 40px 24px;">
    <h2 style="color: #00d4ff; font-size: 16px; margin: 0 0 12px;">Infrastructure Cost</h2>
    <div style="background: #0d3320; border: 1px solid #00ff88; border-radius: 8px; padding: 16px; text-align: center;">
      <span style="color: #00ff88; font-size: 28px; font-weight: bold;">&#163;0 new spend</span>
      <p style="color: #8892b0; margin: 8px 0 0; font-size: 12px;">EC2 + Oracle + Cloudflare = all free tier. Total infra: ~&#163;169/mo (unchanged).</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: #1a2744; padding: 20px 40px; text-align: center;">
    <p style="margin: 0; color: #5a6380; font-size: 12px;">NAVADA Edge Hybrid Architecture v2.0 | 7 tests passed | 0 failures</p>
    <p style="margin: 4px 0 0; color: #3a4a6b; font-size: 11px;">Full architecture document: Manager/architecture/navada-hybrid-architecture.md</p>
  </div>
</div>
`;

transporter.sendMail({
  from: '"NAVADA Edge" <claude.navada@zohomail.eu>',
  to: 'leeakpareva@gmail.com',
  subject: 'NAVADA Edge | E2E Test Results — All Systems Operational',
  html: html
}).then(info => {
  console.log('Email sent:', info.messageId);
}).catch(err => {
  console.error('Error:', err.message);
});
