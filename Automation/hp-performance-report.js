/**
 * NAVADA HP Performance Report — Daily Email (Crow Theme)
 * Collects HP server metrics + NAVADA Edge network status
 * Sends one email per day to Lee with Crow-themed dark HTML
 * Also sends summary to Telegram
 *
 * Metrics: CPU, RAM, disk, uptime, PM2 processes, Docker, network nodes
 * Schedule: Daily via Windows Task Scheduler
 */

require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SENT_LOG = path.join(__dirname, 'logs', 'sent-emails.jsonl');
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

// --- Helpers ---
function exec(cmd, timeout = 10000) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout, shell: 'C:\\Program Files\\Git\\bin\\bash.exe' }).trim();
  } catch { return ''; }
}

function execPS(cmd, timeout = 10000) {
  try {
    return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: 'utf8', timeout }).trim();
  } catch { return ''; }
}

function pingNode(ip, timeout = 3000) {
  return new Promise(resolve => {
    const req = http.get(`http://${ip}:8765/health`, { timeout }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ online: true, data }));
    });
    req.on('error', () => resolve({ online: false }));
    req.on('timeout', () => { req.destroy(); resolve({ online: false }); });
  });
}

function checkPort(ip, port, timeout = 3000) {
  return new Promise(resolve => {
    const req = http.get(`http://${ip}:${port}`, { timeout }, res => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// --- Collect HP Metrics ---
async function collectMetrics() {
  const m = {};

  // CPU usage (Windows)
  const cpuRaw = execPS("(Get-CimInstance Win32_Processor).LoadPercentage");
  m.cpu = cpuRaw ? `${cpuRaw}%` : 'N/A';

  // RAM
  const ramRaw = execPS(`
    $os = Get-CimInstance Win32_OperatingSystem;
    $total = [math]::Round($os.TotalVisibleMemorySize/1MB,1);
    $free = [math]::Round($os.FreePhysicalMemory/1MB,1);
    $used = [math]::Round($total - $free,1);
    $pct = [math]::Round(($used/$total)*100,1);
    Write-Output "$used|$total|$pct"
  `);
  if (ramRaw && ramRaw.includes('|')) {
    const [used, total, pct] = ramRaw.split('|');
    m.ram = { used: `${used}GB`, total: `${total}GB`, percent: `${pct}%` };
  } else {
    m.ram = { used: 'N/A', total: 'N/A', percent: 'N/A' };
  }

  // Disk
  const diskRaw = execPS(`
    $d = Get-PSDrive C;
    $free = [math]::Round($d.Free/1GB,1);
    $used = [math]::Round($d.Used/1GB,1);
    $total = [math]::Round(($d.Free+$d.Used)/1GB,1);
    $pct = [math]::Round(($used/$total)*100,1);
    Write-Output "$used|$total|$free|$pct"
  `);
  if (diskRaw && diskRaw.includes('|')) {
    const [used, total, free, pct] = diskRaw.split('|');
    m.disk = { used: `${used}GB`, total: `${total}GB`, free: `${free}GB`, percent: `${pct}%` };
  } else {
    m.disk = { used: 'N/A', total: 'N/A', free: 'N/A', percent: 'N/A' };
  }

  // Uptime
  const uptimeRaw = execPS(`
    $boot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime;
    $span = (Get-Date) - $boot;
    Write-Output "$($span.Days)d $($span.Hours)h $($span.Minutes)m"
  `);
  m.uptime = uptimeRaw || 'N/A';

  // PM2 processes
  const pm2Raw = exec('pm2 jlist 2>/dev/null') || '[]';
  try {
    const pm2 = JSON.parse(pm2Raw);
    m.pm2 = {
      total: pm2.length,
      online: pm2.filter(p => p.pm2_env?.status === 'online').length,
      errored: pm2.filter(p => p.pm2_env?.status === 'errored').length,
      stopped: pm2.filter(p => p.pm2_env?.status === 'stopped').length,
      processes: pm2.map(p => ({
        name: p.name,
        status: p.pm2_env?.status || 'unknown',
        cpu: p.monit?.cpu || 0,
        memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
        restarts: p.pm2_env?.restart_time || 0,
        uptime: p.pm2_env?.pm_uptime ? Math.round((Date.now() - p.pm2_env.pm_uptime) / 3600000) + 'h' : 'N/A'
      }))
    };
  } catch {
    m.pm2 = { total: 0, online: 0, errored: 0, stopped: 0, processes: [] };
  }

  // Docker containers
  const dockerRaw = exec('docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>/dev/null');
  m.docker = dockerRaw ? dockerRaw.split('\n').map(line => {
    const [name, status, ports] = line.split('|');
    return { name, status, ports: ports?.substring(0, 50) || '' };
  }) : [];

  // Network nodes check
  const nodes = [
    { name: 'HP (NAVADA)', ip: '192.168.0.58', port: 8080 },
    { name: 'ASUS (NAVADA2025)', ip: '100.88.118.128', port: 8765 },
    { name: 'Oracle VM', ip: '100.77.206.9', port: 8978 },
    { name: 'EC2 (AWS)', ip: '100.98.118.33', port: 22 },
  ];

  m.nodes = [];
  for (const node of nodes) {
    const online = await checkPort(node.ip, node.port);
    m.nodes.push({ ...node, online });
  }

  // Scheduled tasks (last run status)
  const taskNames = ['Morning-Briefing', 'AI-News-Digest', 'NAVADA-LeadPipeline', 'Job-Hunter-Daily'];
  m.tasks = taskNames.map(name => {
    const raw = execPS(`(Get-ScheduledTaskInfo -TaskName '${name}' -ErrorAction SilentlyContinue).LastRunTime`);
    return { name, lastRun: raw || 'Never' };
  });

  m.timestamp = new Date().toISOString();
  m.hostname = exec('hostname') || 'NAVADA';

  return m;
}

// --- Crow Theme Email HTML ---
function buildCrowEmail(m) {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Status bar colour
  const cpuVal = parseFloat(m.cpu) || 0;
  const ramVal = parseFloat(m.ram?.percent) || 0;
  const diskVal = parseFloat(m.disk?.percent) || 0;
  const statusColour = (cpuVal > 80 || ramVal > 85 || diskVal > 90) ? '#ff4444' : '#888888';

  // PM2 rows
  const pm2Rows = (m.pm2?.processes || []).map(p => {
    const statusDot = p.status === 'online' ? '#888' : (p.status === 'errored' ? '#ff4444' : '#555');
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;font-family:'IBM Plex Mono',monospace;font-size:13px;">
        <span style="display:inline-block;width:8px;height:8px;background:${statusDot};margin-right:8px;"></span>${p.name}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-family:'IBM Plex Mono',monospace;font-size:13px;">${p.status}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-family:'IBM Plex Mono',monospace;font-size:13px;">${p.cpu}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-family:'IBM Plex Mono',monospace;font-size:13px;">${p.memory}MB</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#555;font-family:'IBM Plex Mono',monospace;font-size:13px;">${p.restarts}</td>
    </tr>`;
  }).join('');

  // Docker rows
  const dockerRows = (m.docker || []).map(c => {
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;font-family:'IBM Plex Mono',monospace;font-size:13px;">${c.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-family:'IBM Plex Mono',monospace;font-size:13px;">${c.status}</td>
    </tr>`;
  }).join('');

  // Node status rows
  const nodeRows = (m.nodes || []).map(n => {
    const dot = n.online ? '#888' : '#ff4444';
    const label = n.online ? 'ONLINE' : 'OFFLINE';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;font-family:'IBM Plex Mono',monospace;font-size:13px;">
        <span style="display:inline-block;width:8px;height:8px;background:${dot};margin-right:8px;"></span>${n.name}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-family:'IBM Plex Mono',monospace;font-size:13px;">${n.ip}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-family:'IBM Plex Mono',monospace;font-size:13px;">${label}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,-webkit-text-size-adjust:100%,-ms-text-size-adjust:100%"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Newsreader',Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0a0a0a;">

  <!-- Header -->
  <tr><td style="padding:32px 24px 16px;border-bottom:1px solid #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.3em;color:#555;text-transform:uppercase;margin-bottom:8px;">NAVADA EDGE INFRASTRUCTURE</div>
          <div style="font-family:'Newsreader',Georgia,serif;font-size:24px;font-weight:300;color:#ffffff;margin-bottom:4px;">HP Performance Report</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#555;">${date}</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="display:inline-block;width:12px;height:12px;background:${statusColour};"></div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- System Vitals -->
  <tr><td style="padding:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;margin-bottom:16px;">SYSTEM VITALS</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="33%" style="padding:12px;background:#0a0a0a;border:1px solid #1a1a1a;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">CPU</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:28px;font-weight:400;color:#ffffff;margin-top:4px;">${m.cpu}</div>
        </td>
        <td width="33%" style="padding:12px;background:#0a0a0a;border:1px solid #1a1a1a;border-left:none;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">RAM</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:28px;font-weight:400;color:#ffffff;margin-top:4px;">${m.ram.percent}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#444;margin-top:2px;">${m.ram.used} / ${m.ram.total}</div>
        </td>
        <td width="33%" style="padding:12px;background:#0a0a0a;border:1px solid #1a1a1a;border-left:none;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">DISK</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:28px;font-weight:400;color:#ffffff;margin-top:4px;">${m.disk.percent}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#444;margin-top:2px;">${m.disk.free} free</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
      <tr>
        <td width="50%" style="padding:12px;background:#0a0a0a;border:1px solid #1a1a1a;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">UPTIME</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;color:#e0e0e0;margin-top:4px;">${m.uptime}</div>
        </td>
        <td width="50%" style="padding:12px;background:#0a0a0a;border:1px solid #1a1a1a;border-left:none;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">HOSTNAME</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;color:#e0e0e0;margin-top:4px;">${m.hostname}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px;"><div style="height:1px;background:#1a1a1a;"></div></td></tr>

  <!-- PM2 Services -->
  <tr><td style="padding:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;margin-bottom:4px;">PM2 SERVICES</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#888;margin-bottom:16px;">${m.pm2.online} online | ${m.pm2.errored} errored | ${m.pm2.stopped} stopped | ${m.pm2.total} total</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1a1a1a;">
      <tr style="background:#111;">
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Process</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Status</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">CPU</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Mem</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Restarts</td>
      </tr>
      ${pm2Rows}
    </table>
  </td></tr>

  <!-- Docker -->
  ${m.docker.length > 0 ? `
  <tr><td style="padding:0 24px;"><div style="height:1px;background:#1a1a1a;"></div></td></tr>
  <tr><td style="padding:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;margin-bottom:16px;">DOCKER CONTAINERS</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1a1a1a;">
      <tr style="background:#111;">
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Container</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Status</td>
      </tr>
      ${dockerRows}
    </table>
  </td></tr>` : ''}

  <!-- Network Mesh -->
  <tr><td style="padding:0 24px;"><div style="height:1px;background:#1a1a1a;"></div></td></tr>
  <tr><td style="padding:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;margin-bottom:16px;">NAVADA EDGE NETWORK</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1a1a1a;">
      <tr style="background:#111;">
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Node</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">IP</td>
        <td style="padding:8px 12px;color:#555;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;">Status</td>
      </tr>
      ${nodeRows}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px;border-top:1px solid #1a1a1a;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#444;letter-spacing:0.1em;">
      NAVADA Edge Infrastructure | Generated by Claude, Chief of Staff<br>
      ${m.timestamp}
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// --- Send Email ---
async function sendReport(metrics) {
  const html = buildCrowEmail(metrics);

  // Gmail transport (primary)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"NAVADA Edge" <${process.env.GMAIL_USER}>`,
    to: 'leeakpareva@gmail.com',
    bcc: process.env.ZOHO_USER || undefined,
    subject: `HP Performance | ${new Date().toLocaleDateString('en-GB')} | CPU ${metrics.cpu} | RAM ${metrics.ram.percent}`,
    html,
  });

  console.log(`Email sent: ${info.messageId}`);

  // Log
  const logEntry = {
    timestamp: new Date().toISOString(),
    to: 'leeakpareva@gmail.com',
    subject: `HP Performance Report`,
    messageId: info.messageId,
    type: 'hp-performance-report'
  };
  fs.appendFileSync(SENT_LOG, JSON.stringify(logEntry) + '\n');

  return info;
}

// --- Send Telegram Summary ---
async function sendTelegram(metrics) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;

  const nodesStatus = (metrics.nodes || [])
    .map(n => `${n.online ? '>' : 'x'} ${n.name} (${n.ip})`)
    .join('\n');

  const pm2Summary = `${metrics.pm2.online}/${metrics.pm2.total} online` +
    (metrics.pm2.errored > 0 ? `, ${metrics.pm2.errored} errored` : '');

  const text = `NAVADA HP Performance Report

CPU: ${metrics.cpu}
RAM: ${metrics.ram.percent} (${metrics.ram.used}/${metrics.ram.total})
Disk: ${metrics.disk.percent} (${metrics.disk.free} free)
Uptime: ${metrics.uptime}
PM2: ${pm2Summary}
Docker: ${metrics.docker.length} containers

Network Nodes:
${nodesStatus}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML'
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// --- Main ---
async function main() {
  console.log('Collecting HP metrics...');
  const metrics = await collectMetrics();
  console.log(`CPU: ${metrics.cpu}, RAM: ${metrics.ram.percent}, Disk: ${metrics.disk.percent}`);
  console.log(`PM2: ${metrics.pm2.online}/${metrics.pm2.total} online`);
  console.log(`Docker: ${metrics.docker.length} containers`);
  console.log(`Nodes: ${metrics.nodes.filter(n => n.online).length}/${metrics.nodes.length} online`);

  await sendReport(metrics);
  console.log('Email sent to Lee.');

  await sendTelegram(metrics);
  console.log('Telegram notification sent.');
}

main().catch(err => {
  console.error('HP Performance Report failed:', err);
  process.exit(1);
});
