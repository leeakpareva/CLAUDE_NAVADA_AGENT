#!/usr/bin/env node
/**
 * NAVADA Architecture Monitor
 * - Collects live status from all nodes every 5 minutes
 * - Regenerates the architecture diagram HTML with live data
 * - Opens browser popup when infrastructure state changes
 *
 * Usage:
 *   node architecture-monitor.js           Run once (check + update + popup if changed)
 *   node architecture-monitor.js --watch   Run continuously every 5 minutes
 *   node architecture-monitor.js --force   Force open diagram regardless of changes
 */

const net = require('net');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const STATE_FILE = path.join(__dirname, 'temp', 'architecture-state.json');
const HTML_FILE = path.join(__dirname, 'temp', 'navada-edge-v4-visual.html');
const INTERVAL = 5 * 60_000;

// ---------------------------------------------------------------------------
// Data Collection
// ---------------------------------------------------------------------------
function ping(host, timeout = 3) {
  try {
    execSync(`ping -n 1 -w ${timeout * 1000} ${host}`, {
      timeout: (timeout + 2) * 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    return true;
  } catch { return false; }
}

function tcpCheck(host, port, timeout = 3000) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

function httpCheck(url, timeout = 5000) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout, rejectUnauthorized: false }, res => {
      res.resume();
      res.on('end', () => resolve({ up: res.statusCode < 500, status: res.statusCode }));
    });
    req.on('error', () => resolve({ up: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ up: false, status: 0 }); });
  });
}

async function collectStatus() {
  console.log(`[${new Date().toISOString()}] Collecting infrastructure status...`);

  const [hpPing, hpSSH, hpPG, oraclePing, ec2Ping, asusPing, mobilePing] = await Promise.all([
    ping('100.121.187.67'),
    tcpCheck('100.121.187.67', 22),
    tcpCheck('100.121.187.67', 5433),
    ping('100.77.206.9'),
    ping('100.98.118.33'),
    ping('100.88.118.128'),
    ping('100.68.251.111'),
  ]);

  // Cloudflare + Oracle services (HTTP)
  const [cfEdge, cfDash, nginx, grafana, prometheus, cloudbeaver, portainer] = await Promise.all([
    httpCheck('https://edge-api.navada-edge-server.uk/status'),
    httpCheck('https://dashboard.navada-edge-server.uk'),
    httpCheck('http://100.77.206.9:80'),
    httpCheck('http://100.77.206.9:3000'),
    httpCheck('http://100.77.206.9:9090'),
    httpCheck('http://100.77.206.9:8978'),
    httpCheck('http://100.77.206.9:9000'),
  ]);

  // Count Cloudflare subdomains up
  const subdomains = ['api', 'edge-api', 'flix', 'trading', 'network', 'kibana',
    'grafana', 'monitor', 'cloudbeaver', 'nodes', 'dashboard', 'logo'];
  const subChecks = await Promise.all(
    subdomains.map(s => httpCheck(`https://${s}.navada-edge-server.uk`))
  );
  const subdomainsUp = subChecks.filter(s => s.up).length;

  const state = {
    timestamp: new Date().toISOString(),
    nodes: {
      gateway:  { online: cfEdge.up, label: 'NAVADA-GATEWAY', provider: 'Cloudflare' },
      control:  { online: asusPing, label: 'NAVADA-CONTROL', provider: 'Local' },
      compute:  { online: ec2Ping, label: 'NAVADA-COMPUTE', provider: 'AWS' },
      edge:     { online: hpPing || hpSSH, label: 'NAVADA-EDGE-SERVER', provider: 'Local' },
      router:   { online: oraclePing, label: 'NAVADA-ROUTER', provider: 'Oracle' },
      mobile:   { online: mobilePing, label: 'NAVADA-MOBILE', provider: 'Apple' },
    },
    services: {
      hp: { ssh: hpSSH, postgresql: hpPG },
      oracle: {
        nginx: nginx.up, grafana: grafana.up, prometheus: prometheus.up,
        cloudbeaver: cloudbeaver.up, portainer: portainer.up,
      },
      cloudflare: { edgeApi: cfEdge.up, dashboard: cfDash.up, subdomainsUp, totalSubdomains: subdomains.length },
    },
    nodesOnline: [hpPing || hpSSH, oraclePing, ec2Ping, asusPing, mobilePing, cfEdge.up].filter(Boolean).length,
  };

  console.log(`  Nodes: ${state.nodesOnline}/6 online | CF: ${subdomainsUp}/${subdomains.length} subs | HP SSH:${hpSSH} PG:${hpPG}`);
  return state;
}

// ---------------------------------------------------------------------------
// HTML Generator
// ---------------------------------------------------------------------------
function generateHTML(state) {
  const ts = state.timestamp;
  const n = state.nodes;
  const s = state.services;

  function dot(online) {
    return online
      ? '<span class="status on"></span>'
      : '<span class="status off"></span>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="300">
<title>NAVADA Edge v4 — Live Architecture</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #050505; color: #e0e0e0; font-family: 'IBM Plex Mono', 'Consolas', monospace; }

  .header { text-align: center; padding: 40px 20px 10px; }
  .header h1 { font-size: 28px; color: #fff; letter-spacing: 0.2em; font-weight: 800; }
  .header .sub { font-size: 12px; color: #555; letter-spacing: 0.1em; margin-top: 8px; }
  .header .live { font-size: 10px; color: #4caf50; margin-top: 6px; letter-spacing: 0.05em; }
  .header .live::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #4caf50; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .canvas { position: relative; max-width: 1200px; margin: 20px auto; min-height: 900px; padding: 20px; }

  .node { position: absolute; border: 1px solid #333; border-radius: 4px; padding: 16px; min-width: 200px; background: #0a0a0a; transition: border-color 0.3s; }
  .node:hover { background: #0f0f0f; }
  .node .title { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px; }
  .node .role { font-size: 10px; color: #777; margin-bottom: 6px; }
  .node .services { font-size: 10px; color: #555; line-height: 1.6; }
  .node .services span { display: inline-block; background: #111; border: 1px solid #222; padding: 2px 6px; border-radius: 2px; margin: 2px 2px; font-size: 9px; }
  .node .services span.up { border-color: #4caf5066; color: #4caf50; }
  .node .services span.down { border-color: #f4433666; color: #f44336; }
  .node .ip { font-size: 9px; color: #444; margin-top: 8px; font-family: monospace; }
  .node .status { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .node .status.on { background: #4caf50; box-shadow: 0 0 6px #4caf5088; }
  .node .status.off { background: #f44336; box-shadow: 0 0 6px #f4433688; }

  .node.gateway { border-color: #4285F4; }
  .node.gateway .title { color: #4285F4; }
  .node.control { border-color: #FF9800; }
  .node.control .title { color: #FF9800; }
  .node.edge { border-color: #66BB6A; }
  .node.edge .title { color: #66BB6A; }
  .node.compute { border-color: #E53935; }
  .node.compute .title { color: #E53935; }
  .node.router { border-color: #7E57C2; }
  .node.router .title { color: #7E57C2; }
  .node.mobile { border-color: #555; }
  .node.mobile .title { color: #aaa; }

  .actor { position: absolute; text-align: center; }
  .actor .icon { font-size: 28px; margin-bottom: 4px; }
  .actor .label { font-size: 9px; color: #777; letter-spacing: 0.05em; }

  svg.connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
  svg.connections line { stroke-width: 1.5; }
  svg.connections .tailscale { stroke: #4caf50; stroke-dasharray: 6 4; opacity: 0.5; }
  svg.connections .cloudflare { stroke: #4285F4; opacity: 0.4; }
  svg.connections .ssh { stroke: #66BB6A; stroke-dasharray: 3 3; opacity: 0.4; }
  svg.connections .telegram { stroke: #0088cc; opacity: 0.3; }
  svg.connections .https { stroke: #FF9800; opacity: 0.3; }
  svg.connections text { font-size: 8px; font-family: 'IBM Plex Mono', monospace; fill: #444; }

  .mesh-label { position: absolute; font-size: 10px; color: #4caf50; letter-spacing: 0.1em; opacity: 0.6; }

  .legend { max-width: 1200px; margin: 20px auto; padding: 20px; display: flex; gap: 30px; flex-wrap: wrap; justify-content: center; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 10px; color: #555; }
  .legend-line { width: 30px; height: 0; border-top: 2px dashed; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid; }

  .stats { max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; justify-content: center; gap: 40px; }
  .stat { text-align: center; }
  .stat .num { font-size: 24px; font-weight: 800; color: #fff; }
  .stat .num.warn { color: #FF9800; }
  .stat .num.bad { color: #f44336; }
  .stat .lbl { font-size: 9px; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }

  .footer { text-align: center; padding: 30px; font-size: 9px; color: #333; letter-spacing: 0.1em; }
</style>
</head>
<body>

<div class="header">
  <h1>NAVADA EDGE v4</h1>
  <div class="sub">LIVE SYSTEM ARCHITECTURE &mdash; CLAUDE CHIEF OF STAFF ON CLOUDFLARE EDGE</div>
  <div class="live">LIVE &mdash; Last updated: ${new Date(ts).toLocaleString('en-GB')} &mdash; Auto-refresh 5 min</div>
</div>

<div class="stats">
  <div class="stat"><div class="num ${state.nodesOnline < 4 ? 'bad' : state.nodesOnline < 6 ? 'warn' : ''}">${state.nodesOnline}/6</div><div class="lbl">Nodes Online</div></div>
  <div class="stat"><div class="num">5</div><div class="lbl">PM2 Services</div></div>
  <div class="stat"><div class="num">${[s.oracle.nginx, s.oracle.grafana, s.oracle.prometheus, s.oracle.cloudbeaver, s.oracle.portainer].filter(Boolean).length + (s.oracle.nginx ? 1 : 0)}</div><div class="lbl">Docker Containers</div></div>
  <div class="stat"><div class="num ${s.cloudflare.subdomainsUp < 10 ? 'warn' : ''}">${s.cloudflare.subdomainsUp}/${s.cloudflare.totalSubdomains}</div><div class="lbl">Subdomains UP</div></div>
  <div class="stat"><div class="num">11</div><div class="lbl">CW Dashboards</div></div>
</div>

<div class="canvas" id="canvas">

  <svg class="connections" viewBox="0 0 1200 900">
    <line class="tailscale" x1="600" y1="80" x2="170" y2="350"/>
    <line class="tailscale" x1="600" y1="80" x2="600" y2="350"/>
    <line class="tailscale" x1="600" y1="80" x2="1030" y2="350"/>
    <line class="tailscale" x1="600" y1="80" x2="170" y2="620"/>
    <line class="tailscale" x1="600" y1="80" x2="1030" y2="620"/>
    <line class="tailscale" x1="170" y1="350" x2="600" y2="350"/>
    <line class="tailscale" x1="600" y1="350" x2="1030" y2="350"/>
    <line class="tailscale" x1="170" y1="620" x2="1030" y2="620"/>
    <line class="cloudflare" x1="600" y1="230" x2="1030" y2="620"/>
    <text x="830" y="430">CF Tunnel</text>
    <line class="ssh" x1="600" y1="430" x2="170" y2="430"/>
    <text x="350" y="420">SSH (metrics)</text>
    <line class="ssh" x1="700" y1="430" x2="1030" y2="620"/>
    <text x="870" y="540">SSH</text>
    <line class="cloudflare" x1="700" y1="200" x2="700" y2="350"/>
    <text x="710" y="280">Bedrock API</text>
    <line class="https" x1="80" y1="150" x2="170" y2="330"/>
    <line class="telegram" x1="80" y1="180" x2="170" y2="700"/>
    <line class="telegram" x1="270" y1="700" x2="600" y2="230"/>
    <text x="400" y="470" fill="#0088cc">Telegram</text>
    <line class="cloudflare" x1="1100" y1="150" x2="750" y2="200"/>
    <text x="900" y="170">HTTPS</text>
  </svg>

  <div class="mesh-label" style="top: 50px; left: 520px;">TAILSCALE MESH VPN</div>
  <div style="position:absolute; top: 65px; left: 520px; width: 160px; height: 1px; border-top: 1px solid #4caf5044;"></div>

  <div class="actor" style="top: 120px; left: 40px;">
    <div class="icon">&#128100;</div>
    <div class="label">Lee Akpareva<br>Founder</div>
  </div>
  <div class="actor" style="top: 120px; left: 1080px;">
    <div class="icon">&#127760;</div>
    <div class="label">Internet<br>Public HTTPS</div>
  </div>

  <!-- NAVADA-GATEWAY -->
  <div class="node gateway" style="top: 160px; left: 460px; width: 280px;">
    <div class="title">${dot(n.gateway.online)}NAVADA-GATEWAY</div>
    <div class="role">Cloudflare Global Edge</div>
    <div class="services">
      <span class="${s.cloudflare.edgeApi ? 'up' : 'down'}">Edge API Worker</span>
      <span class="up">Claude CoS</span>
      <span class="up">D1 (7 tables)</span>
      <span class="up">R2 Storage</span>
      <span class="up">5 Cron Triggers</span>
      <span class="up">WAF + DDoS</span>
      <span class="up">DNS (13 subs)</span>
      <span class="up">SSL/TLS</span>
      <span class="up">Tunnel</span>
    </div>
    <div class="ip">navada-edge-server.uk | ${s.cloudflare.subdomainsUp}/${s.cloudflare.totalSubdomains} subdomains UP</div>
  </div>

  <!-- NAVADA-CONTROL -->
  <div class="node control" style="top: 320px; left: 30px; width: 240px;">
    <div class="title">${dot(n.control.online)}NAVADA-CONTROL</div>
    <div class="role">ASUS Zenbook Duo | Dev Workstation</div>
    <div class="services">
      <span>Claude Code</span>
      <span>VS Code</span>
      <span>LM Studio</span>
      <span>Ollama</span>
      <span>PostgreSQL 17</span>
      <span>Docker Desktop</span>
    </div>
    <div class="ip">100.88.118.128 | 192.168.0.18 (WiFi)</div>
  </div>

  <!-- NAVADA-COMPUTE -->
  <div class="node compute" style="top: 350px; left: 460px; width: 280px;">
    <div class="title">${dot(n.compute.online)}NAVADA-COMPUTE</div>
    <div class="role">AWS EC2 t3.medium | 24/7 Compute</div>
    <div class="services">
      <span class="up">ec2-health-monitor</span>
      <span class="up">cw-dashboard-updater</span>
      <span class="up">navada-dashboard</span>
      <span class="up">worldmonitor</span>
      <span class="up">worldview-monitor</span>
      <span>CloudWatch (11)</span>
      <span>Lambda</span>
      <span>DynamoDB (3)</span>
      <span>S3</span>
      <span>Bedrock</span>
      <span>SageMaker</span>
    </div>
    <div class="ip">100.98.118.33 | 3.11.119.181 (Elastic IP)</div>
  </div>

  <!-- NAVADA-EDGE-SERVER -->
  <div class="node edge" style="top: 570px; left: 30px; width: 240px;">
    <div class="title">${dot(n.edge.online)}NAVADA-EDGE-SERVER</div>
    <div class="role">HP Laptop | SSH-Only Node</div>
    <div class="services">
      <span class="${s.hp.ssh ? 'up' : 'down'}">SSH :22</span>
      <span class="${s.hp.postgresql ? 'up' : 'down'}">PostgreSQL :5433</span>
    </div>
    <div class="ip">100.121.187.67 | 192.168.0.58 (Ethernet)</div>
  </div>

  <!-- NAVADA-ROUTER -->
  <div class="node router" style="top: 570px; left: 900px; width: 260px;">
    <div class="title">${dot(n.router.online)}NAVADA-ROUTER</div>
    <div class="role">Oracle Cloud VM | Routing + Observability</div>
    <div class="services">
      <span class="${s.oracle.nginx ? 'up' : 'down'}">Nginx</span>
      <span class="${s.oracle.nginx ? 'up' : 'down'}">CF Tunnel</span>
      <span class="${s.oracle.grafana ? 'up' : 'down'}">Grafana</span>
      <span class="${s.oracle.prometheus ? 'up' : 'down'}">Prometheus</span>
      <span class="${s.oracle.cloudbeaver ? 'up' : 'down'}">CloudBeaver</span>
      <span class="${s.oracle.portainer ? 'up' : 'down'}">Portainer</span>
    </div>
    <div class="ip">100.77.206.9 | 132.145.46.184</div>
  </div>

  <!-- NAVADA-MOBILE -->
  <div class="node mobile" style="top: 730px; left: 100px; width: 200px;">
    <div class="title">${dot(n.mobile.online)}NAVADA-MOBILE</div>
    <div class="role">iPhone 15 Pro Max</div>
    <div class="services">
      <span>Telegram</span>
      <span>Tailscale</span>
    </div>
    <div class="ip">100.68.251.111</div>
  </div>

  <div style="position:absolute; top: 155px; right: 170px; font-size: 8px; color: #4285F4; letter-spacing: 0.1em; opacity: 0.5;">CLOUDFLARE</div>
  <div style="position:absolute; top: 345px; right: 170px; font-size: 8px; color: #E53935; letter-spacing: 0.1em; opacity: 0.5;">AWS</div>
  <div style="position:absolute; top: 565px; right: 40px; font-size: 8px; color: #7E57C2; letter-spacing: 0.1em; opacity: 0.5;">ORACLE CLOUD</div>
  <div style="position:absolute; top: 315px; left: 30px; font-size: 8px; color: #FF9800; letter-spacing: 0.1em; opacity: 0.5;">LOCAL</div>
  <div style="position:absolute; top: 565px; left: 30px; font-size: 8px; color: #66BB6A; letter-spacing: 0.1em; opacity: 0.5;">LOCAL (ETHERNET)</div>
</div>

<div class="legend">
  <div class="legend-item"><div class="legend-line" style="border-color: #4caf50;"></div>Tailscale Mesh (WireGuard)</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #4285F4; border-style: solid;"></div>Cloudflare (HTTPS / Tunnel)</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #66BB6A;"></div>SSH (Metrics Collection)</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #0088cc; border-style: solid;"></div>Telegram (Commands)</div>
  <div class="legend-item"><div class="legend-dot" style="background: #4caf50; border-color: #4caf50;"></div>Online</div>
  <div class="legend-item"><div class="legend-dot" style="background: #f44336; border-color: #f44336;"></div>Offline</div>
</div>

<div class="footer">
  NAVADA AI ENGINEERING &amp; CONSULTING | LEE AKPAREVA, FOUNDER | CLAUDE, CHIEF OF STAFF | MARCH 2026
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Change Detection + Popup
// ---------------------------------------------------------------------------
function loadPreviousState() {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {}
  return null;
}

function hasChanged(prev, curr) {
  if (!prev) return true;
  // Compare node online status
  for (const key of Object.keys(curr.nodes)) {
    if (prev.nodes?.[key]?.online !== curr.nodes[key].online) return true;
  }
  // Compare key services
  if (prev.services?.hp?.ssh !== curr.services.hp.ssh) return true;
  if (prev.services?.hp?.postgresql !== curr.services.hp.postgresql) return true;
  if (prev.services?.cloudflare?.subdomainsUp !== curr.services.cloudflare.subdomainsUp) return true;
  for (const svc of ['nginx', 'grafana', 'prometheus', 'cloudbeaver', 'portainer']) {
    if (prev.services?.oracle?.[svc] !== curr.services.oracle[svc]) return true;
  }
  return false;
}

function describeChanges(prev, curr) {
  if (!prev) return 'Initial scan';
  const changes = [];
  for (const key of Object.keys(curr.nodes)) {
    const was = prev.nodes?.[key]?.online;
    const now = curr.nodes[key].online;
    if (was !== now) changes.push(`${curr.nodes[key].label}: ${was ? 'ONLINE' : 'OFFLINE'} -> ${now ? 'ONLINE' : 'OFFLINE'}`);
  }
  if (prev.services?.hp?.ssh !== curr.services.hp.ssh) changes.push(`HP SSH: ${curr.services.hp.ssh ? 'UP' : 'DOWN'}`);
  if (prev.services?.hp?.postgresql !== curr.services.hp.postgresql) changes.push(`HP PostgreSQL: ${curr.services.hp.postgresql ? 'UP' : 'DOWN'}`);
  if (prev.services?.cloudflare?.subdomainsUp !== curr.services.cloudflare.subdomainsUp) {
    changes.push(`Cloudflare: ${prev.services?.cloudflare?.subdomainsUp || '?'} -> ${curr.services.cloudflare.subdomainsUp} subdomains`);
  }
  for (const svc of ['nginx', 'grafana', 'prometheus', 'cloudbeaver', 'portainer']) {
    if (prev.services?.oracle?.[svc] !== curr.services.oracle[svc]) changes.push(`Oracle ${svc}: ${curr.services.oracle[svc] ? 'UP' : 'DOWN'}`);
  }
  return changes.join(', ') || 'No changes';
}

function openBrowser() {
  try {
    execSync(`start "" "${HTML_FILE}"`, { stdio: 'ignore', windowsHide: true });
    console.log('  Browser popup opened');
  } catch (e) {
    console.log(`  Failed to open browser: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run(forceOpen = false) {
  const curr = await collectStatus();

  // Generate live HTML
  const html = generateHTML(curr);
  fs.writeFileSync(HTML_FILE, html);
  console.log(`  HTML updated: ${HTML_FILE}`);

  // Check for changes
  const prev = loadPreviousState();
  const changed = hasChanged(prev, curr);
  const desc = describeChanges(prev, curr);

  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify(curr, null, 2));

  if (changed || forceOpen) {
    console.log(`  CHANGE DETECTED: ${desc}`);
    openBrowser();
  } else {
    console.log(`  No changes detected`);
  }

  return { changed, description: desc };
}

// CLI
const args = process.argv.slice(2);
const forceOpen = args.includes('--force');
const watchMode = args.includes('--watch');

if (watchMode) {
  console.log(`NAVADA Architecture Monitor — watching every ${INTERVAL / 1000}s`);
  run(true); // First run always opens
  setInterval(() => run(), INTERVAL);
} else {
  run(forceOpen).then(({ changed, description }) => {
    console.log(`Done. Changed: ${changed}. ${description}`);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
