#!/usr/bin/env node
/**
 * NAVADA Edge v4 — Infrastructure Status Report (Crow Theme)
 * Sends HTML email + saves to crow_theme/Emails archive
 */
const ses = require('../email-service');
const fs = require('fs');
const path = require('path');

const EMAILS_DIR = path.join(__dirname, '..', '..', '..', 'crow_theme', 'Emails');
if (!fs.existsSync(EMAILS_DIR)) fs.mkdirSync(EMAILS_DIR, { recursive: true });

const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAVADA Edge v4 — Infrastructure Status Report</title>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,700;1,300&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
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
      <div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Infrastructure Report | ${dateLabel}</div>
    </td>
  </tr>
  <tr>
    <td style="padding: 8px 40px 24px 40px;">
      <h1 style="margin:0; font-size:28px; font-weight:700; color:#ffffff; line-height:1.3; font-family: 'Newsreader', Georgia, serif;">NAVADA Edge v4<br><span style="font-size:18px; color:#888888; font-weight:300; font-style:italic;">Live Infrastructure Status Report</span></h1>
      <div style="width:60px; height:2px; background:#444444; margin-top:16px;"></div>
    </td>
  </tr>
</table>

<!-- Executive Summary -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr>
    <td style="padding: 0 40px 32px 40px;">
      <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#888888;">Lee, all systems are operational. Claude Chief of Staff is running 24/7 on Cloudflare's global edge. The full v4 migration is complete: Telegram bot on Cloudflare Worker, D1 database live, all HP services decommissioned, health monitors updated, zero false alerts.</p>
      <p style="margin:0; font-size:15px; line-height:1.8; color:#888888;">Below is the live status of all 5 nodes, every running service, and the full network architecture diagram.</p>
    </td>
  </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- Stats Bar -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a; border-top:1px solid #1a1a1a; border-bottom:1px solid #1a1a1a;">
  <tr><td style="padding:20px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="text-align:center; width:16%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">5</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Nodes</div></td>
        <td style="text-align:center; width:16%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">17+</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Services</div></td>
        <td style="text-align:center; width:16%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">14/14</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Health OK</div></td>
        <td style="text-align:center; width:16%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">11</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Dashboards</div></td>
        <td style="text-align:center; width:16%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">13</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Subdomains</div></td>
        <td style="text-align:center; width:16%;"><div style="font-size:24px; font-weight:700; color:#ffffff; font-family:'Newsreader', Georgia, serif;">24/7</div><div style="font-size:10px; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; margin-top:4px;">Uptime</div></td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- Section: Network Health -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 32px 40px 16px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Network Health</div></td></tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 24px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr style="background:#0a0a0a;">
        <td style="padding:10px 16px; font-size:11px; font-weight:600; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; border-bottom:1px solid #222222;">Check</td>
        <td style="padding:10px 16px; font-size:11px; font-weight:600; color:#555555; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; border-bottom:1px solid #222222;">Result</td>
      </tr>
      <tr><td style="padding:10px 16px; font-size:13px; color:#888888; border-bottom:1px solid #1a1a1a;">Health Monitor (14 endpoints)</td><td style="padding:10px 16px; font-size:13px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">14/14 OK</td></tr>
      <tr><td style="padding:10px 16px; font-size:13px; color:#888888; border-bottom:1px solid #1a1a1a;">CloudWatch Dashboards</td><td style="padding:10px 16px; font-size:13px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">11/11 pushing</td></tr>
      <tr><td style="padding:10px 16px; font-size:13px; color:#888888; border-bottom:1px solid #1a1a1a;">Tailscale Mesh</td><td style="padding:10px 16px; font-size:13px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">4/4 nodes online</td></tr>
      <tr><td style="padding:10px 16px; font-size:13px; color:#888888; border-bottom:1px solid #1a1a1a;">Cloudflare Worker</td><td style="padding:10px 16px; font-size:13px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">ONLINE (D1: WEUR)</td></tr>
      <tr><td style="padding:10px 16px; font-size:13px; color:#888888;">Cloudflare Subdomains</td><td style="padding:10px 16px; font-size:13px; color:#e0e0e0;">12/13 UP</td></tr>
    </table>
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- Section: Node Status -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 32px 40px 16px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Node Status (5 Nodes)</div></td></tr>
</table>

<!-- NAVADA-GATEWAY -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 16px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr><td style="padding:16px 20px; border-bottom:1px solid #1a1a1a; background:#0a0a0a;">
        <div style="font-size:14px; font-weight:600; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">NAVADA-GATEWAY</div>
        <div style="font-size:11px; color:#555555; margin-top:4px; font-family:'IBM Plex Mono', monospace;">Cloudflare | CDN / Security / Edge Compute | ONLINE</div>
      </td></tr>
      <tr><td style="padding:14px 20px; font-size:13px; line-height:2; color:#888888;">
        <span style="color:#e0e0e0;">Worker:</span> navada-edge-api (Telegram bot, metrics, health, cron)<br>
        <span style="color:#e0e0e0;">D1 Database:</span> navada-edge (7 tables, Western Europe)<br>
        <span style="color:#e0e0e0;">R2 Storage:</span> navada-assets (backups, media)<br>
        <span style="color:#e0e0e0;">DNS:</span> 13 subdomains on navada-edge-server.uk<br>
        <span style="color:#e0e0e0;">Cron:</span> 5 scheduled triggers | <span style="color:#e0e0e0;">WAF + DDoS + SSL</span>
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- NAVADA-CONTROL -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 16px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr><td style="padding:16px 20px; border-bottom:1px solid #1a1a1a; background:#0a0a0a;">
        <div style="font-size:14px; font-weight:600; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">NAVADA-CONTROL</div>
        <div style="font-size:11px; color:#555555; margin-top:4px; font-family:'IBM Plex Mono', monospace;">ASUS Zenbook Duo | Command Centre / Dev | ONLINE</div>
      </td></tr>
      <tr><td style="padding:14px 20px; font-size:13px; line-height:2; color:#888888;">
        <span style="color:#e0e0e0;">IP:</span> 192.168.0.18 / 100.88.118.128 (Tailscale)<br>
        <span style="color:#e0e0e0;">Services:</span> Claude Code, VS Code, LM Studio, Ollama<br>
        <span style="color:#e0e0e0;">Database:</span> PostgreSQL 17 (dev/staging)<br>
        <span style="color:#e0e0e0;">SSH:</span> into all nodes | Docker Desktop
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- NAVADA-EDGE-SERVER -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 16px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr><td style="padding:16px 20px; border-bottom:1px solid #1a1a1a; background:#0a0a0a;">
        <div style="font-size:14px; font-weight:600; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">NAVADA-EDGE-SERVER</div>
        <div style="font-size:11px; color:#555555; margin-top:4px; font-family:'IBM Plex Mono', monospace;">HP Laptop | Dev Box / Node Server (SSH-only) | ONLINE</div>
      </td></tr>
      <tr><td style="padding:14px 20px; font-size:13px; line-height:2; color:#888888;">
        <span style="color:#e0e0e0;">IP:</span> 192.168.0.58 / 100.121.187.67 (Tailscale)<br>
        <span style="color:#e0e0e0;">Services:</span> SSH server, PostgreSQL :5433<br>
        <span style="color:#e0e0e0;">PM2:</span> None (SSH-only access)<br>
        <span style="color:#e0e0e0;">Connection:</span> Always-on ethernet
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- NAVADA-COMPUTE -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 16px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr><td style="padding:16px 20px; border-bottom:1px solid #1a1a1a; background:#0a0a0a;">
        <div style="font-size:14px; font-weight:600; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">NAVADA-COMPUTE</div>
        <div style="font-size:11px; color:#555555; margin-top:4px; font-family:'IBM Plex Mono', monospace;">AWS EC2 t3.medium | 24/7 Compute / Monitoring | ONLINE</div>
      </td></tr>
      <tr><td style="padding:14px 20px; font-size:13px; line-height:2; color:#888888;">
        <span style="color:#e0e0e0;">IP:</span> 3.11.119.181 / 100.98.118.33 (Tailscale)<br>
        <span style="color:#e0e0e0;">PM2 (5/5 online):</span><br>
        &nbsp;&nbsp;ec2-health-monitor (14 endpoints, 5min) | 66MB<br>
        &nbsp;&nbsp;cloudwatch-dashboard-updater (11 dashboards, 5min) | 75MB<br>
        &nbsp;&nbsp;navada-dashboard (command centre) | 134MB<br>
        &nbsp;&nbsp;worldmonitor (OSINT :4000) | 72MB<br>
        &nbsp;&nbsp;worldview-monitor (CW metrics) | 74MB<br>
        <span style="color:#e0e0e0;">AWS:</span> CloudWatch, Lambda, DynamoDB, S3, Bedrock, SageMaker
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- NAVADA-ROUTER -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 24px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222;">
      <tr><td style="padding:16px 20px; border-bottom:1px solid #1a1a1a; background:#0a0a0a;">
        <div style="font-size:14px; font-weight:600; color:#ffffff; font-family:'IBM Plex Mono', monospace; letter-spacing:0.05em;">NAVADA-ROUTER</div>
        <div style="font-size:11px; color:#555555; margin-top:4px; font-family:'IBM Plex Mono', monospace;">Oracle VM | Routing / Observability / Security | ONLINE</div>
      </td></tr>
      <tr><td style="padding:14px 20px; font-size:13px; line-height:2; color:#888888;">
        <span style="color:#e0e0e0;">IP:</span> 132.145.46.184 / 100.77.206.9 (Tailscale)<br>
        <span style="color:#e0e0e0;">Docker (6/6 running, 13h uptime):</span><br>
        &nbsp;&nbsp;navada-proxy (Nginx :80/:443/:8080)<br>
        &nbsp;&nbsp;navada-tunnel (Cloudflare Tunnel)<br>
        &nbsp;&nbsp;navada-grafana (Metrics :3000)<br>
        &nbsp;&nbsp;navada-prometheus (Collection :9090)<br>
        &nbsp;&nbsp;cloudbeaver (DB admin :8978)<br>
        &nbsp;&nbsp;navada-portainer (Docker mgmt :9000)
      </td></tr>
    </table>
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- Section: Architecture Diagram -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 32px 40px 16px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Network Architecture Diagram</div></td></tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 24px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222; background:#0a0a0a;">
      <tr><td style="padding:24px; overflow-x:auto;">
<pre style="font-family:'IBM Plex Mono', Consolas, monospace; font-size:11px; line-height:1.6; color:#888888; margin:0; white-space:pre; overflow-x:auto;">
<span style="color:#e0e0e0;">                    INTERNET / TELEGRAM USERS</span>
                               |
                           <span style="color:#555555;">HTTPS</span>
                               |
<span style="color:#e0e0e0;">  +------------------------------------------------------------+</span>
<span style="color:#e0e0e0;">  |              NAVADA-GATEWAY (Cloudflare)                   |</span>
<span style="color:#e0e0e0;">  |                                                            |</span>
  |  <span style="color:#e0e0e0;">WAF/DDoS/SSL</span>    <span style="color:#e0e0e0;">DNS (13)</span>    <span style="color:#e0e0e0;">Tunnel</span>    <span style="color:#e0e0e0;">5 Crons</span>       |
  |       |             |          |          |              |
  |       v             v          |          v              |
  |  <span style="color:#ffffff;">+--------------------------------------------------+</span>    |
  |  <span style="color:#ffffff;">|        navada-edge-api (Worker)                  |</span>    |
  |  <span style="color:#ffffff;">|  Telegram bot | Metrics | Health | AI Chat       |</span>    |
  |  <span style="color:#ffffff;">+--------------------------------------------------+</span>    |
  |       |                    |                             |
  |  <span style="color:#e0e0e0;">+--------+</span>          <span style="color:#e0e0e0;">+----------+</span>                       |
  |  <span style="color:#e0e0e0;">| D1 (7T)|</span>          <span style="color:#e0e0e0;">| R2 Store |</span>                       |
  |  <span style="color:#e0e0e0;">+--------+</span>          <span style="color:#e0e0e0;">+----------+</span>                       |
<span style="color:#e0e0e0;">  +------------------------------------------------------------+</span>
                               |
                    <span style="color:#555555;">Cloudflare Tunnel (encrypted)</span>
                               |
<span style="color:#e0e0e0;">  +------------------------------------------------------------+</span>
<span style="color:#e0e0e0;">  |       TAILSCALE MESH VPN (WireGuard, 100.x.x.x)           |</span>
<span style="color:#e0e0e0;">  +----+----------+----------+----------+---------+-----------+</span>
       |          |          |          |         |
<span style="color:#e0e0e0;">  +----+----+ +----+------+ +--+-------+ +--+--------+ +--+-----+</span>
<span style="color:#e0e0e0;">  | NAVADA- | | NAVADA-   | | NAVADA-  | | NAVADA-    | | NAVADA-|</span>
<span style="color:#e0e0e0;">  | CONTROL | | EDGE-     | | COMPUTE  | | ROUTER     | | MOBILE |</span>
<span style="color:#e0e0e0;">  | (ASUS)  | | SERVER    | | (EC2)    | | (Oracle)   | |(iPhone)|</span>
  |         | | (HP)      | |          | |            | |        |
  | Claude  | | SSH-only  | | 5 PM2:   | | 6 Docker:  | |Telegram|
  | Code    | | PG :5433  | | -health  | | -nginx     | |Tailscl.|
  | VS Code | | Node.js   | | -cw-dash | | -tunnel    | |        |
  | Ollama  | |           | | -dashbrd | | -grafana   | |        |
  | Docker  | | Zero PM2  | | -worldmn | | -promeths  | |        |
  | PG 17   | | Zero tasks| | -worldvw | | -cloudbvr  | |        |
  |         | |           | |          | | -portainer | |        |
  | <span style="color:#555555;">.18</span>     | | <span style="color:#555555;">.67</span>       | | <span style="color:#555555;">.33</span>      | | <span style="color:#555555;">.9</span>        | | <span style="color:#555555;">.111</span>   |
<span style="color:#e0e0e0;">  +---------+ +-----------+ +----------+ +------------+ +--------+</span>

<span style="color:#e0e0e0;">TRAFFIC FLOWS</span>
  Internet  --> Cloudflare (WAF/SSL) --> Tunnel --> Oracle (Nginx) --> Services
  Telegram  --> Cloudflare Worker --> Claude API / EC2
  Lee (ASUS)--> SSH --> HP / EC2 / Oracle
  Lee (iPhone)> Tailscale --> Any node direct

<span style="color:#e0e0e0;">MONITORING</span>
  EC2 health monitor --> 14 endpoints / 5 min --> Telegram + SMS alerts
  EC2 CW updater --> 11 dashboards / 5 min --> AWS CloudWatch
  CF cron --> 5 triggers --> health / briefing / news / pipeline / jobs
</pre>
      </td></tr>
    </table>
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- Health Check Endpoints -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 32px 40px 16px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace;">Health Check Endpoints (14)</div></td></tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 0 40px 24px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #222222; font-size:12px; font-family:'IBM Plex Mono', monospace;">
      <tr style="background:#0a0a0a;">
        <td style="padding:8px 12px; color:#555555; border-bottom:1px solid #222222; font-weight:600;">Endpoint</td>
        <td style="padding:8px 12px; color:#555555; border-bottom:1px solid #222222; font-weight:600;">Group</td>
        <td style="padding:8px 12px; color:#555555; border-bottom:1px solid #222222; font-weight:600;">Type</td>
        <td style="padding:8px 12px; color:#555555; border-bottom:1px solid #222222; font-weight:600;">Status</td>
      </tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HP Tailscale Ping</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HP</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">ping</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HP SSH</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HP</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">port 22</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">WorldMonitor</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">EC2</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :4000</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">NAVADA Dashboard</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">EC2</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :9090</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle Tailscale Ping</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">ping</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Nginx (Oracle)</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :80</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Grafana</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :3000</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Prometheus</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :9090</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">CloudBeaver</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :8978</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Portainer</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Oracle</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTP :9000</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">CF Edge API</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Cloudflare</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTPS</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">CF Dashboard</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Cloudflare</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTPS</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">CF Grafana</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">Cloudflare</td><td style="padding:6px 12px; color:#888888; border-bottom:1px solid #1a1a1a;">HTTPS</td><td style="padding:6px 12px; color:#e0e0e0; border-bottom:1px solid #1a1a1a;">OK</td></tr>
      <tr><td style="padding:6px 12px; color:#888888;">CF Flix</td><td style="padding:6px 12px; color:#888888;">Cloudflare</td><td style="padding:6px 12px; color:#888888;">HTTPS</td><td style="padding:6px 12px; color:#e0e0e0;">OK</td></tr>
    </table>
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- CloudWatch Dashboards -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 24px 40px 8px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace; margin-bottom:12px;">CloudWatch Dashboards (11)</div></td></tr>
  <tr><td style="padding: 0 40px 32px 40px; font-size:13px; line-height:2; color:#888888; font-family:'IBM Plex Mono', monospace;">
    <span style="color:#e0e0e0;">NAVADA-Edge-Network</span> (master console)<br>
    <span style="color:#e0e0e0;">NAVADA-HP</span> (SSH-only node)<br>
    <span style="color:#e0e0e0;">NAVADA-Oracle</span> (Docker + OCI cost)<br>
    <span style="color:#e0e0e0;">NAVADA-EC2-Operations</span> (PM2 + health)<br>
    <span style="color:#e0e0e0;">NAVADA-PM2-Processes</span> (combined view)<br>
    <span style="color:#e0e0e0;">NAVADA-Cloudflare</span> (subdomains + tunnel)<br>
    <span style="color:#e0e0e0;">NAVADA-Tailscale</span> (mesh VPN)<br>
    <span style="color:#e0e0e0;">NAVADA-NodeJS</span> (V8 runtime)<br>
    <span style="color:#e0e0e0;">NAVADA-ASUS</span> (dev workstation)<br>
    <span style="color:#e0e0e0;">NAVADA-World-View</span> (OSINT)<br>
    <span style="color:#e0e0e0;">NAVADA-BK-UP-ULTRA</span> (backup + storage)
  </td></tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 40px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr></table>

<!-- What Changed -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
  <tr><td style="padding: 24px 40px 8px 40px;"><div style="font-size:11px; color:#444444; letter-spacing:0.15em; text-transform:uppercase; font-family: 'IBM Plex Mono', Consolas, monospace; margin-bottom:12px;">Changes Today</div></td></tr>
  <tr><td style="padding: 0 40px 32px 40px; font-size:14px; line-height:2; color:#888888;">
    <span style="color:#e0e0e0;">Health monitor</span> updated: removed HP Telegram/Flix/Scanner checks, added CF Edge API + SSH port checks<br>
    <span style="color:#e0e0e0;">False alerts eliminated</span>: 14/14 endpoints now passing, zero noise<br>
    <span style="color:#e0e0e0;">Dashboard updater</span> updated: role-based node names, edge-api subdomain added, HP description corrected<br>
    <span style="color:#e0e0e0;">Bot standby</span> now monitors Cloudflare Worker instead of HP Telegram Bot<br>
    <span style="color:#e0e0e0;">All 11 dashboards</span> regenerated with accurate v4 architecture data
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
      <a href="https://github.com/Navada25" style="color:#555555; text-decoration:none;">GitHub</a>
    </div>
  </td></tr>
</table>

</body>
</html>`;

const subject = 'NAVADA Edge v4 | Infrastructure Status Report';
const filename = timestamp + '_' + subject.replace(/[^a-zA-Z0-9]/g, '_') + '.html';
const filepath = path.join(EMAILS_DIR, filename);

// Save HTML to Emails archive
fs.writeFileSync(filepath, html);
console.log('Saved to:', filepath);

// Send email
ses.sendEmail({
  to: 'leeakpareva@gmail.com',
  subject,
  rawHtml: html,
}).then(() => {
  console.log('EMAIL SENT + SAVED');
}).catch(e => console.error('FAIL:', e.message));
