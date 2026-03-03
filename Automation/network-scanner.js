#!/usr/bin/env node
// NAVADA Network Scanner & Router Dashboard
// Real-time WebSocket updates + Cloudflare Tunnel access
// Port 7777 - http://192.168.0.58:7777 / network.navada-edge-server.uk

const http = require('http');
const { exec } = require('child_process');
const WebSocket = require('ws');

const PORT = 7777;
const ROUTER_IP = '192.168.0.1';
const SCAN_INTERVAL = 30000; // 30s auto-scan

let lastScan = null;
let scanInProgress = false;
let clients = new Set();

// ── Helpers ─────────────────────────────────────────────────

function cmd(command, timeout = 15000) {
  return new Promise(resolve => {
    exec(command, { timeout, shell: 'cmd.exe' }, (err, stdout) => resolve(stdout || ''));
  });
}

const VENDORS = {
  '40:0D:10': 'TP-Link/Virgin Hub', '04:17:B6': 'Hitron', '80:0C:F9': 'Amazon',
  'B0:0C:D1': 'HP/Intel', '54:DF:1B': 'Samsung', 'AC:67:B2': 'Apple',
  '3C:22:FB': 'Apple', 'F0:18:98': 'Apple', 'DC:A6:32': 'Raspberry Pi',
  '48:B0:2D': 'Apple', 'A4:83:E7': 'Apple', '00:1A:79': 'Apple',
  'B8:27:EB': 'Raspberry Pi', 'E4:5F:01': 'Raspberry Pi',
  '50:EB:F6': 'ASUSTek', '38:F9:D3': 'Apple', '7C:D1:C3': 'Apple',
  '00:11:32': 'Synology', 'EC:FA:BC': 'Apple', 'F8:FF:C2': 'Apple',
};

function lookupVendor(mac) {
  if (!mac) return 'Unknown';
  const prefix = mac.substring(0, 8).toUpperCase().replace(/-/g, ':');
  for (const [p, v] of Object.entries(VENDORS)) { if (prefix === p) return v; }
  const secondChar = parseInt(mac.replace(/[-:]/g, '')[1], 16);
  if (secondChar % 2 !== 0) return 'Private/Random MAC';
  return 'Unknown';
}

function guessType(vendor, mac, ip) {
  if (ip === ROUTER_IP) return { type: 'Router/Gateway', icon: '\u{1F4E1}' };
  if (ip === '192.168.0.58') return { type: 'NAVADA Server', icon: '\u{1F5A5}\u{FE0F}' };
  if (vendor.includes('Apple')) return { type: 'Apple Device', icon: '\u{1F34E}' };
  if (vendor.includes('Samsung')) return { type: 'Mobile/TV', icon: '\u{1F4F1}' };
  if (vendor.includes('Amazon')) return { type: 'Echo/Fire', icon: '\u{1F50A}' };
  if (vendor.includes('Raspberry')) return { type: 'Raspberry Pi', icon: '\u{1F353}' };
  if (vendor.includes('Random')) return { type: 'WiFi Device', icon: '\u{1F4F6}' };
  return { type: 'Device', icon: '\u{1F4BB}' };
}

// ── Broadcast to all WebSocket clients ──────────────────────

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(msg); } catch {}
    }
  }
}

// ── ARP Network Scan ────────────────────────────────────────

async function arpScan() {
  broadcast('status', { message: 'Ping sweep in progress...' });

  const pings = [];
  for (let i = 1; i <= 254; i++) {
    pings.push(cmd(`ping -n 1 -w 150 192.168.0.${i}`, 3000));
  }
  await Promise.all(pings);

  broadcast('status', { message: 'Reading ARP table...' });

  const arp = await cmd('arp -a');
  const devices = [];
  for (const line of arp.split('\n')) {
    const m = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([\w-]+)\s+dynamic/i);
    if (m && m[1].startsWith('192.168.0.') && !m[1].endsWith('.255')) {
      const ip = m[1];
      const mac = m[2].toUpperCase().replace(/-/g, ':');
      const vendor = lookupVendor(mac);
      const { type, icon } = guessType(vendor, mac, ip);
      const pingR = await cmd(`ping -n 1 -w 500 ${ip}`);
      const latMatch = pingR.match(/time[=<](\d+)ms/);
      const latency = latMatch ? parseInt(latMatch[1]) : null;
      devices.push({ ip, mac, vendor, type, icon, latency });
    }
  }

  devices.push({
    ip: '192.168.0.58', mac: 'B0:0C:D1:CD:13:3E', vendor: 'HP/Intel',
    type: 'NAVADA Server', icon: '\u{1F5A5}\u{FE0F}', latency: 0, isSelf: true,
  });

  devices.sort((a, b) => parseInt(a.ip.split('.')[3]) - parseInt(b.ip.split('.')[3]));
  return devices;
}

// ── Full Scan ───────────────────────────────────────────────

async function fullScan() {
  if (scanInProgress) return lastScan;
  scanInProgress = true;
  try {
    const devices = await arpScan();

    let publicIP = '';
    try {
      const dns = await cmd('nslookup myip.opendns.com resolver1.opendns.com');
      const m = dns.match(/Address:\s+(\d+\.\d+\.\d+\.\d+)\s*$/m);
      if (m) publicIP = m[1];
    } catch {}

    let linkSpeed = '1 Gbps';
    try {
      const w = await cmd('wmic nic where "NetConnectionID=\'Ethernet\'" get Speed /value');
      const m = w.match(/Speed=(\d+)/);
      if (m) { const bps = parseInt(m[1]); linkSpeed = bps >= 1e9 ? `${bps/1e9} Gbps` : `${bps/1e6} Mbps`; }
    } catch {}

    let internetLatency = null;
    try {
      const p = await cmd('ping -n 3 8.8.8.8');
      const m = p.match(/Average\s*=\s*(\d+)ms/);
      if (m) internetLatency = parseInt(m[1]);
    } catch {}

    lastScan = {
      timestamp: new Date().toISOString(),
      devices,
      publicIP,
      linkSpeed,
      internetLatency,
      wifiInfo: { ssid: 'VM3484650', model: 'Virgin Media Hub 3.0', firmware: 'TG2492LG-VM / 9.1.2208' },
      localIP: '192.168.0.58',
      gateway: ROUTER_IP,
      dns: ['1.1.1.1', '8.8.8.8'],
      totalDevices: devices.length,
      wsClients: clients.size,
    };

    broadcast('scan', lastScan);
  } catch (err) { console.error('Scan error:', err.message); }
  scanInProgress = false;
  return lastScan;
}

// ── Speed Test ──────────────────────────────────────────────

async function speedTest() {
  broadcast('status', { message: 'Running speed test...' });
  const pingR = await cmd('ping -n 5 8.8.8.8', 20000);
  const avgMatch = pingR.match(/Average\s*=\s*(\d+)ms/);
  const ping = avgMatch ? `${avgMatch[1]}ms` : 'N/A';

  let dlSpeed = 'N/A';
  try {
    const start = Date.now();
    await cmd('curl -s -o nul http://speedtest.tele2.net/1MB.zip', 30000);
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed > 0) dlSpeed = `${((1 * 8) / elapsed).toFixed(1)} Mbps`;
  } catch {}

  const result = { download: dlSpeed, upload: 'N/A', ping, server: 'Tele2 Speedtest' };
  broadcast('speed', result);
  return result;
}

// ── Router Proxy ────────────────────────────────────────────

async function proxyRouter(req, res) {
  const path = req.url.replace(/^\/router\/?/, '/') || '/';
  const targetUrl = `http://${ROUTER_IP}${path}`;
  return new Promise(resolve => {
    const proxyReq = http.request(targetUrl, { method: req.method, headers: { ...req.headers, host: ROUTER_IP } }, proxyRes => {
      const headers = { ...proxyRes.headers };
      delete headers['x-frame-options'];
      headers['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
      proxyRes.on('end', resolve);
    });
    proxyReq.on('error', () => { res.writeHead(502); res.end('Router unreachable'); resolve(); });
    req.pipe(proxyReq);
  });
}

// ── Dashboard HTML ──────────────────────────────────────────

function renderDashboard(data) {
  const d = data || { devices: [], totalDevices: 0, publicIP: '', linkSpeed: '?', internetLatency: null,
    wifiInfo: { ssid: 'VM3484650', model: 'Virgin Media Hub 3.0', firmware: '?' },
    localIP: '192.168.0.58', gateway: '192.168.0.1', dns: ['1.1.1.1','8.8.8.8'], timestamp: new Date().toISOString() };

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NAVADA Network</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e0e0e0;min-height:100vh}
.hdr{background:linear-gradient(135deg,#0d1117 0%,#161b22 100%);padding:20px;border-bottom:1px solid #1e1e3a;display:flex;justify-content:space-between;align-items:center}
.hdr h1{font-size:18px;font-weight:700;color:#fff}
.hdr .sub{color:#666;font-size:11px;margin-top:2px}
.live{display:flex;align-items:center;gap:6px;font-size:11px;color:#00c853}
.live .dot{width:8px;height:8px;background:#00c853;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;padding:12px}
.card{background:#12121a;border:1px solid #1e1e2e;border-radius:10px;padding:12px}
.card .lbl{color:#555;font-size:9px;text-transform:uppercase;letter-spacing:1px}
.card .val{font-size:20px;font-weight:700;margin-top:2px}
.green{color:#00c853}.blue{color:#448aff}.orange{color:#ffab00}.red{color:#ff5252}.purple{color:#b388ff}
.actions{padding:0 12px 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn{background:#161b22;border:1px solid #2a2a4e;color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px;transition:background 0.2s}
.btn:hover{background:#2a2a4e}
.btn.pri{background:#1565c0;border-color:#1976d2}
.btn.pri:hover{background:#1976d2}
.status-bar{padding:4px 12px;font-size:11px;color:#555;transition:color 0.3s}
.status-bar.active{color:#ffab00}
.tab-bar{display:flex;gap:0;padding:0 12px;margin-bottom:10px}
.tab{padding:8px 16px;background:#12121a;border:1px solid #1e1e2e;color:#888;cursor:pointer;font-size:12px;transition:all 0.2s;user-select:none}
.tab:first-child{border-radius:8px 0 0 8px}
.tab:last-child{border-radius:0 8px 8px 0}
.tab.active{background:#1e1e3a;color:#fff;border-color:#448aff}
.panel{display:none}.panel.active{display:block}
.sec{padding:0 12px 12px}
.sec h2{font-size:13px;font-weight:600;color:#888;margin-bottom:8px}
.tw{background:#12121a;border:1px solid #1e1e2e;border-radius:10px;overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:8px 12px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#555;border-bottom:1px solid #1e1e2e;background:#0d0d14}
.td{padding:8px 12px;border-bottom:1px solid #141420;font-size:12px}
.mono{font-family:'SF Mono',Consolas,monospace;font-size:10px;color:#888}
.foot{color:#333;font-size:10px;padding:12px;text-align:center}
.speed-panel{background:#12121a;border:1px solid #1e1e2e;border-radius:10px;padding:14px;margin:0 12px 10px;display:none}
.speed-panel.show{display:block}
.speed-row{display:flex;justify-content:space-around;text-align:center}
.speed-row .lbl{color:#555;font-size:9px;text-transform:uppercase}
.speed-row .val{font-size:22px;font-weight:700;margin-top:4px}
.router-frame{border:none;width:100%;height:70vh;border-radius:10px;background:#111}
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;padding:0 12px 12px}
.info-card{background:#12121a;border:1px solid #1e1e2e;border-radius:10px;padding:12px}
.info-card h3{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.info-card p{font-size:12px;color:#ccc;line-height:1.6}
.info-card a{color:#448aff}
.new-device{animation:fadeIn 0.5s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:600px){.cards{grid-template-columns:repeat(2,1fr)}.info-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="hdr">
  <div>
    <h1>\u{1F310} NAVADA Network</h1>
    <div class="sub">${d.wifiInfo.model} | ${d.wifiInfo.ssid}</div>
  </div>
  <div class="live"><span class="dot"></span><span id="wsStatus">Connecting...</span></div>
</div>

<div class="cards">
  <div class="card"><div class="lbl">Devices</div><div class="val green" id="deviceCount">${d.totalDevices}</div></div>
  <div class="card"><div class="lbl">Link Speed</div><div class="val blue">${d.linkSpeed}</div></div>
  <div class="card"><div class="lbl">Public IP</div><div class="val" style="font-size:12px" id="publicIP">${d.publicIP || '...'}</div></div>
  <div class="card"><div class="lbl">Internet</div><div class="val" id="internetPing">${d.internetLatency ? d.internetLatency + 'ms' : '...'}</div></div>
  <div class="card"><div class="lbl">Live Clients</div><div class="val purple" id="wsClients">0</div></div>
</div>

<div class="actions">
  <button class="btn pri" onclick="requestScan()">Rescan</button>
  <button class="btn" onclick="requestSpeed()">Speed Test</button>
  <div class="status-bar" id="statusBar">Ready</div>
</div>

<div class="speed-panel" id="speedPanel">
  <div class="speed-row">
    <div><div class="lbl">Download</div><div class="val green" id="dl">--</div></div>
    <div><div class="lbl">Upload</div><div class="val blue" id="ul">--</div></div>
    <div><div class="lbl">Ping</div><div class="val orange" id="pg">--</div></div>
  </div>
</div>

<div class="tab-bar">
  <div class="tab active" onclick="showTab('devices',this)">Devices</div>
  <div class="tab" onclick="showTab('router',this)">Router Admin</div>
  <div class="tab" onclick="showTab('info',this)">Info</div>
</div>

<div class="panel active" id="panel-devices">
  <div class="sec">
    <h2 id="devicesHeader">Connected Devices (${d.totalDevices})</h2>
    <div class="tw">
      <table><thead><tr><th></th><th>IP / Type</th><th>MAC</th><th>Vendor</th><th>Ping</th></tr></thead>
      <tbody id="deviceTable"></tbody></table>
    </div>
  </div>
</div>

<div class="panel" id="panel-router">
  <div class="sec">
    <h2>Virgin Media Hub 3.0 Admin</h2>
    <p style="color:#666;font-size:11px;margin-bottom:8px">Full router control. Password on sticker: 44566791</p>
    <iframe class="router-frame" id="routerFrame" src="about:blank"></iframe>
  </div>
</div>

<div class="panel" id="panel-info">
  <div class="info-grid">
    <div class="info-card"><h3>Router</h3><p>Model: ${d.wifiInfo.model}<br>Firmware: ${d.wifiInfo.firmware}<br>Gateway: ${d.gateway}<br>Admin: <a href="/router/" target="_blank">Open</a></p></div>
    <div class="info-card"><h3>WiFi</h3><p>SSID: ${d.wifiInfo.ssid}<br>Security: WPA2<br>Band: 2.4 + 5GHz</p></div>
    <div class="info-card"><h3>NAVADA Server</h3><p>IP: ${d.localIP}<br>Link: ${d.linkSpeed}<br>DNS: ${d.dns.join(', ')}</p></div>
    <div class="info-card"><h3>Internet</h3><p>Public: <span id="pubIP2">${d.publicIP || '...'}</span><br>ISP: Virgin Media<br>Type: Cable DOCSIS</p></div>
  </div>
</div>

<div class="foot" id="lastUpdate">Last scan: ${new Date(d.timestamp).toLocaleString('en-GB')}</div>

<script>
let ws, reconnectTimer;
const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = proto + '//' + location.host + '/ws';

function connect() {
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    document.getElementById('wsStatus').textContent = 'Live';
    document.querySelector('.dot').style.background = '#00c853';
    clearTimeout(reconnectTimer);
  };
  ws.onclose = () => {
    document.getElementById('wsStatus').textContent = 'Reconnecting...';
    document.querySelector('.dot').style.background = '#ff5252';
    reconnectTimer = setTimeout(connect, 3000);
  };
  ws.onerror = () => ws.close();
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      handleMessage(msg);
    } catch {}
  };
}

function handleMessage(msg) {
  if (msg.type === 'scan') updateDashboard(msg.data);
  if (msg.type === 'speed') updateSpeed(msg.data);
  if (msg.type === 'status') setStatus(msg.data.message);
  if (msg.type === 'clients') document.getElementById('wsClients').textContent = msg.data.count;
}

function updateDashboard(d) {
  document.getElementById('deviceCount').textContent = d.totalDevices;
  document.getElementById('publicIP').textContent = d.publicIP || 'N/A';
  document.getElementById('pubIP2').textContent = d.publicIP || 'N/A';
  document.getElementById('wsClients').textContent = d.wsClients || 0;

  const ping = d.internetLatency;
  const pingEl = document.getElementById('internetPing');
  pingEl.textContent = ping ? ping + 'ms' : 'N/A';
  pingEl.className = 'val ' + (ping < 20 ? 'green' : ping < 50 ? 'orange' : 'red');

  document.getElementById('devicesHeader').textContent = 'Connected Devices (' + d.totalDevices + ')';
  document.getElementById('lastUpdate').textContent = 'Last scan: ' + new Date(d.timestamp).toLocaleString('en-GB');

  const tbody = document.getElementById('deviceTable');
  tbody.innerHTML = d.devices.map(dev => {
    const lc = dev.latency === null ? '#666' : dev.latency < 10 ? '#00c853' : dev.latency < 50 ? '#ffab00' : '#ff5252';
    const lt = dev.isSelf ? '<span style="color:#00c853">local</span>' : dev.latency !== null ? '<span style="color:'+lc+'">'+dev.latency+'ms</span>' : '<span style="color:#666">--</span>';
    const hl = dev.isSelf ? 'background:rgba(0,200,83,0.06);border-left:3px solid #00c853;' : dev.ip === '${ROUTER_IP}' ? 'background:rgba(255,171,0,0.06);border-left:3px solid #ffab00;' : '';
    return '<tr class="new-device" style="'+hl+'"><td class="td">'+dev.icon+'</td><td class="td"><div style="font-weight:600">'+dev.ip+'</div><div style="font-size:10px;color:#555">'+dev.type+'</div></td><td class="td mono">'+dev.mac+'</td><td class="td" style="font-size:11px">'+dev.vendor+'</td><td class="td" style="text-align:center">'+lt+'</td></tr>';
  }).join('');

  setStatus('Scan complete');
}

function updateSpeed(d) {
  document.getElementById('speedPanel').classList.add('show');
  document.getElementById('dl').textContent = d.download || '--';
  document.getElementById('ul').textContent = d.upload || '--';
  document.getElementById('pg').textContent = d.ping || '--';
  setStatus('Speed test complete');
}

function setStatus(msg) {
  const bar = document.getElementById('statusBar');
  bar.textContent = msg;
  bar.classList.add('active');
  setTimeout(() => bar.classList.remove('active'), 3000);
}

function requestScan() {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({action:'scan'}));
  else fetch('/api/scan').then(r=>r.json()).then(updateDashboard);
  setStatus('Scanning...');
}

function requestSpeed() {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({action:'speed'}));
  else fetch('/api/speed').then(r=>r.json()).then(updateSpeed);
  setStatus('Testing speed...');
}

function showTab(name, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'router') {
    const f = document.getElementById('routerFrame');
    if (f.src === 'about:blank') f.src = '/router/';
  }
}

connect();
</script>
</body></html>`;
}

// ── HTTP Server ─────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/scan') {
      const data = await fullScan();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(data));
    }
    if (req.url === '/api/speed') {
      const data = await speedTest();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(data));
    }
    if (req.url === '/api/devices') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(lastScan?.devices || []));
    }
    if (req.url.startsWith('/router')) {
      return await proxyRouter(req, res);
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderDashboard(lastScan));
  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(500); res.end('Error');
  }
});

// ── WebSocket Server ────────────────────────────────────────

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

wss.on('connection', ws => {
  clients.add(ws);
  console.log(`WS client connected (${clients.size} total)`);
  broadcast('clients', { count: clients.size });

  // Send current data immediately
  if (lastScan) {
    ws.send(JSON.stringify({ type: 'scan', data: { ...lastScan, wsClients: clients.size }, timestamp: new Date().toISOString() }));
  }

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.action === 'scan') await fullScan();
      if (msg.action === 'speed') await speedTest();
    } catch {}
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`WS client disconnected (${clients.size} total)`);
    broadcast('clients', { count: clients.size });
  });
});

// ── Auto-scan loop ──────────────────────────────────────────

setInterval(async () => {
  if (clients.size > 0) {
    await fullScan();
  }
}, SCAN_INTERVAL);

// ── Start ───────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n\u{1F310} NAVADA Network Scanner`);
  console.log(`   Dashboard:  http://192.168.0.58:${PORT}`);
  console.log(`   Router:     http://192.168.0.58:${PORT}/router/`);
  console.log(`   WebSocket:  ws://192.168.0.58:${PORT}/ws`);
  console.log(`   Cloudflare: https://network.navada-edge-server.uk`);
  console.log(`\n   Auto-scan every ${SCAN_INTERVAL/1000}s when clients connected`);
  console.log(`   Running initial scan...\n`);
  await fullScan();
  console.log(`   Found ${lastScan?.devices?.length || 0} devices\n`);
});
