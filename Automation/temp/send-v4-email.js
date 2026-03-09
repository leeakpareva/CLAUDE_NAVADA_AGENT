const ses = require('../email-service');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAVADA Edge v4 - Network Architecture</title>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:#050505; font-family: 'Newsreader', Georgia, serif; -webkit-font-smoothing: antialiased;">

<!-- Header -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505; border-bottom: 1px solid #1a1a1a;">
  <tr>
    <td style="padding: 32px 40px;">
      <div style="font-size:24px; font-weight:700; color:#ffffff; letter-spacing:0.2em; font-family: 'IBM Plex Mono', Consolas, monospace;">NAVADA</div>
      <div style="font-size:11px; color:#555555; letter-spacing:0.12em; margin-top:6px; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">AI Engineering &amp; Consulting</div>
    </td>
  </tr>
</table>

<!-- Title Block -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr>
    <td style="padding: 40px 40px 8px 40px;">
      <div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Infrastructure Report | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </td>
  </tr>
  <tr>
    <td style="padding: 8px 40px 24px 40px;">
      <h1 style="margin:0; font-size:28px; font-weight:700; color:#ffffff; line-height:1.3; font-family: 'Newsreader', Georgia, serif;">NAVADA Edge v4<br><span style="font-size:18px; color:#888888; font-weight:400;">Network Architecture Update</span></h1>
      <div style="width:60px; height:2px; background:#444444; margin-top:16px;"></div>
    </td>
  </tr>
</table>

<!-- Summary -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr>
    <td style="padding: 0 40px 32px 40px;">
      <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#888888;">Lee, the Cloudflare migration is complete. Claude Chief of Staff now runs 24/7 on Cloudflare's global edge. Zero terminal flicker, zero HP dependency, zero cost.</p>
      <p style="margin:0; font-size:15px; line-height:1.8; color:#888888;">Here is the updated 5-node architecture with role-based naming.</p>
    </td>
  </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- Section Label -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 32px 40px 16px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Network Nodes</div></td></tr>
</table>

<!-- Node Cards -->
${[
  { name: 'NAVADA-GATEWAY', sub: 'Cloudflare | CDN / Security / Edge Compute', body: 'Worker: navada-edge-api (Telegram bot, metrics, health, cron)<br>D1 Database: navada-edge (7 tables, Western Europe)<br>R2 Storage: navada-assets (backups, media)<br>DNS: 13 subdomains on navada-edge-server.uk<br>Cron: 5 scheduled triggers | WAF + DDoS + SSL' },
  { name: 'NAVADA-CONTROL', sub: 'ASUS Zenbook Duo | Command Centre / Dev', body: 'IP: 192.168.0.18 / 100.88.118.128 (Tailscale)<br>Claude Code, VS Code, LM Studio, Ollama<br>SSH into all nodes | Docker Desktop' },
  { name: 'NAVADA-EDGE-SERVER', sub: 'HP Laptop | Dev Box / Node Server', body: 'IP: 192.168.0.58 / 100.121.187.67 (Tailscale)<br>SSH-only access (no PM2, no scheduled tasks)<br>PostgreSQL :5433 | Always-on ethernet' },
  { name: 'NAVADA-COMPUTE', sub: 'AWS EC2 t3.medium | 24/7 Compute / Monitoring', body: 'IP: 3.11.119.181 / 100.98.118.33 (Tailscale)<br>5 PM2 services: health monitor, dashboard, worldmonitor, worldview, cloudwatch<br>11 CloudWatch dashboards | Lambda, DynamoDB, S3, Bedrock, SageMaker' },
  { name: 'NAVADA-ROUTER', sub: 'Oracle VM | Routing / Observability / Security', body: 'IP: 132.145.46.184 / 100.77.206.9 (Tailscale)<br>6 Docker containers: Nginx, Cloudflare Tunnel, Grafana, Prometheus, CloudBeaver, Portainer<br>All external traffic routes through Oracle' },
].map(n => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 24px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr><td style="padding:16px 20px; border-bottom:1px solid #1a1a1a; background:#0a0a0a;">
        <div style="font-size:14px; font-weight:600; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">${n.name}</div>
        <div style="font-size:11px; color:#555555; margin-top:4px; font-family:'IBM Plex Mono', monospace;">${n.sub}</div>
      </td></tr>
      <tr><td style="padding:14px 20px; font-size:13px; line-height:1.8; color:#888888;">${n.body}</td></tr>
    </table>
  </td></tr>
</table>`).join('')}

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:8px 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- What Changed -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 24px 40px 8px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace; margin-bottom:12px;">What Changed (v4)</div></td></tr>
  <tr><td style="padding: 0 40px 32px 40px; font-size:14px; line-height:2; color:#888888;">
    <span style="color:#e0e0e0;">Telegram bot</span> migrated from HP PM2 to Cloudflare Worker (24/7, global edge, free tier)<br>
    <span style="color:#e0e0e0;">D1 database</span> replaces local JSON files for conversation memory (7 tables)<br>
    <span style="color:#e0e0e0;">24 scheduled tasks</span> replaced by 5 Cloudflare cron triggers<br>
    <span style="color:#e0e0e0;">HP</span> is now SSH-only node server (zero terminal flicker)<br>
    <span style="color:#e0e0e0;">Health checks</span> run from Cloudflare (no ICMP issues)<br>
    <span style="color:#e0e0e0;">New subdomain</span> edge-api.navada-edge-server.uk (13th subdomain)
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- Traffic Flow -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 24px 40px 8px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace; margin-bottom:12px;">Traffic Flow</div></td></tr>
  <tr><td style="padding: 0 40px 32px 40px;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:13px; font-family:'IBM Plex Mono', monospace; line-height:2; color:#555555;">
      <tr><td style="color:#e0e0e0; padding-right:12px;">Internet</td><td style="color:#444444;">&#8594;</td><td style="padding-left:12px;">Cloudflare (WAF/SSL) &#8594; Tunnel &#8594; Oracle (Nginx) &#8594; Services</td></tr>
      <tr><td style="color:#e0e0e0; padding-right:12px;">Telegram</td><td style="color:#444444;">&#8594;</td><td style="padding-left:12px;">Cloudflare Worker &#8594; Claude API / EC2</td></tr>
      <tr><td style="color:#e0e0e0; padding-right:12px;">Lee (ASUS)</td><td style="color:#444444;">&#8594;</td><td style="padding-left:12px;">SSH &#8594; HP / EC2 / Oracle</td></tr>
      <tr><td style="color:#e0e0e0; padding-right:12px;">Lee (iPhone)</td><td style="color:#444444;">&#8594;</td><td style="padding-left:12px;">Tailscale &#8594; Any node direct</td></tr>
    </table>
  </td></tr>
</table>

<!-- Stats Bar -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a; border-top:1px solid #1a1a1a; border-bottom:1px solid #1a1a1a;">
  <tr><td style="padding:20px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="text-align:center; width:25%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">5</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Nodes</div></td>
        <td style="text-align:center; width:25%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">17+</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Services</div></td>
        <td style="text-align:center; width:25%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">13</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Subdomains</div></td>
        <td style="text-align:center; width:25%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">24/7</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Uptime</div></td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 32px 40px;">
    <div style="width:40px; height:2px; background:#444444; margin-bottom:16px;"></div>
    <div style="font-size:14px; font-weight:700; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">CLAUDE</div>
    <div style="font-size:10px; color:#555555; letter-spacing:0.12em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Chief of Staff</div>
    <div style="font-size:12px; color:#555555; line-height:1.8; margin-top:12px;">NAVADA AI Engineering &amp; Consulting<br>On behalf of Lee Akpareva, Founder<br>+44 7446 994961 | claude@navada-edge-server.uk</div>
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505; border-top:1px solid #1a1a1a;">
  <tr><td style="padding: 16px 40px 24px 40px;">
    <div style="font-size:10px; color:#444444; line-height:1.8; font-family:'IBM Plex Mono', monospace;">
      <a href="https://navada-lab.space" style="color:#555555; text-decoration:none;">navada-lab.space</a> &nbsp;|&nbsp;
      <a href="https://navadarobotics.com" style="color:#555555; text-decoration:none;">navadarobotics.com</a> &nbsp;|&nbsp;
      <a href="https://navada-edge-server.uk" style="color:#555555; text-decoration:none;">navada-edge-server.uk</a> &nbsp;|&nbsp;
      <a href="https://github.com/leeakpareva/CLAUDE_NAVADA_AGENT" style="color:#555555; text-decoration:none;">GitHub</a>
    </div>
  </td></tr>
</table>

</body>
</html>`;

ses.sendEmail({
  to: 'leeakpareva@gmail.com',
  subject: 'NAVADA Edge v4 | Network Architecture Update',
  rawHtml: html,
}).then(() => console.log('EMAIL SENT')).catch(e => console.error('FAIL:', e.message));
