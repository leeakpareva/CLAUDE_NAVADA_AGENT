#!/usr/bin/env node
/**
 * CloudWatch Dashboard Updater
 * Runs on EC2 (24/7) via PM2. Every 5 minutes:
 *   1. Collects live state from HP, Oracle, EC2, Tailscale, Cloudflare
 *   2. Regenerates all 11 CloudWatch dashboards with live data
 *
 * Deploys to: /home/ubuntu/cloudwatch-dashboard-updater.js
 * PM2 name: cloudwatch-dashboard-updater
 */

try { require('dotenv').config({ path: __dirname + '/.env' }); } catch {}

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const { CloudWatchClient, PutDashboardCommand, GetMetricDataCommand, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const net = require('net');

const REGION = 'eu-west-2';
const CW = new CloudWatchClient({ region: REGION });
const INTERVAL = 5 * 60_000;
const EC2_INSTANCE_ID = 'i-0055e7ace24db38b0';
const SSH_KEY = '/home/ubuntu/.ssh/id_ed25519';

const NODES = {
  HP:     { tailscale: '100.121.187.67', role: 'NAVADA-EDGE-SERVER | Dev Box / Node Server (SSH-only)', os: 'Windows 11 Pro' },
  Oracle: { tailscale: '100.77.206.9',   role: 'NAVADA-ROUTER | Routing / Observability / Security',   os: 'Ubuntu (OCI)' },
  EC2:    { tailscale: '100.98.118.33',   role: 'NAVADA-COMPUTE | 24/7 Compute / Monitoring',           os: 'Ubuntu (AWS)' },
  ASUS:   { tailscale: '100.88.118.128',  role: 'NAVADA-CONTROL | Command Centre / Dev',                os: 'Windows 11 Home' },
  iPhone: { tailscale: '100.68.251.111',  role: 'NAVADA-MOBILE | Client',                               os: 'iOS' },
};

const SUBDOMAINS = [
  'api', 'edge-api', 'flix', 'trading', 'network', 'kibana',
  'grafana', 'monitor', 'cloudbeaver', 'nodes', 'dashboard', 'logo'
];

const DOMAIN = 'navada-edge-server.uk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

const SSH_USERS = { '100.121.187.67': 'leeak', '100.77.206.9': 'ubuntu', '100.98.118.33': 'ubuntu' };

function ssh(host, cmd, timeout = 8000) {
  try {
    const user = SSH_USERS[host] || 'ubuntu';
    const result = execSync(
      `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i ${SSH_KEY} ${user}@${host} "${cmd.replace(/"/g, '\\"')}"`,
      { timeout, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim();
  } catch {
    return null;
  }
}

function localExec(cmd, timeout = 10000) {
  try {
    return execSync(cmd, { timeout, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function httpCheck(url, timeout = 8000) {
  return new Promise(resolve => {
    const start = Date.now();
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout, rejectUnauthorized: false }, res => {
      res.resume();
      res.on('end', () => resolve({ up: res.statusCode < 500, status: res.statusCode, latency: Date.now() - start }));
    });
    req.on('error', () => resolve({ up: false, status: 0, latency: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ up: false, status: 0, latency: timeout }); });
  });
}

function ping(host, timeout = 5) {
  try {
    execSync(`ping -c 1 -W ${timeout} ${host}`, { timeout: (timeout + 2) * 1000, stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

function tcpPortCheck(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

function parsePM2(raw) {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return list.map(p => ({
      name: p.name,
      status: p.pm2_env?.status || 'unknown',
      cpu: p.monit?.cpu || 0,
      memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
      restarts: p.pm2_env?.restart_time || 0,
      uptime: p.pm2_env?.pm_uptime ? formatUptime(Date.now() - p.pm2_env.pm_uptime) : '-',
    }));
  } catch {
    return [];
  }
}

function formatUptime(ms) {
  if (ms < 0) return '-';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function parseDockerStats(raw) {
  if (!raw) return [];
  try {
    return raw.split('\n').filter(Boolean).map(line => {
      const d = JSON.parse(line);
      return {
        name: d.Name || d.Container || '',
        cpu: d.CPUPerc ? parseFloat(d.CPUPerc) : 0,
        memory: d.MemUsage || '0MiB',
        memPercent: d.MemPerc ? parseFloat(d.MemPerc) : 0,
        status: 'running',
      };
    });
  } catch {
    return [];
  }
}

function parseDockerPS(raw) {
  if (!raw) return [];
  try {
    return raw.split('\n').filter(Boolean).map(line => {
      const d = JSON.parse(line);
      return {
        name: d.Names || '',
        image: d.Image || '',
        status: d.Status || '',
        ports: d.Ports || '',
        state: d.State || '',
      };
    });
  } catch {
    return [];
  }
}

// Escape for CloudWatch markdown text widgets
function esc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// Data Collectors
// ---------------------------------------------------------------------------
async function collectHP() {
  log('Collecting HP data...');
  const online = ping(NODES.HP.tailscale);
  const sshUp = await tcpPortCheck(NODES.HP.tailscale, 22);
  const pgUp = await tcpPortCheck(NODES.HP.tailscale, 5433);

  if (!online && !sshUp) {
    log('HP: OFFLINE (ping + SSH both failed)');
    return { online: false, pm2: [], system: { sshUp: false, pgUp: false } };
  }

  // HP is Windows SSH-only node — collect system metrics via SSH
  const system = { sshUp, pgUp, cpu: null, memPercent: null, diskUsedPercent: null, diskFreeGB: null };

  // CPU usage (Windows wmic)
  const cpuRaw = ssh(NODES.HP.tailscale, 'wmic cpu get loadpercentage /value', 10000);
  if (cpuRaw) {
    const match = cpuRaw.match(/LoadPercentage=(\d+)/);
    if (match) system.cpu = parseFloat(match[1]);
  }

  // Memory (Windows wmic)
  const memRaw = ssh(NODES.HP.tailscale, 'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value', 10000);
  if (memRaw) {
    const free = memRaw.match(/FreePhysicalMemory=(\d+)/);
    const total = memRaw.match(/TotalVisibleMemorySize=(\d+)/);
    if (free && total) {
      const freeKB = parseFloat(free[1]);
      const totalKB = parseFloat(total[1]);
      system.memPercent = Math.round(((totalKB - freeKB) / totalKB) * 100 * 10) / 10;
      system.memUsedGB = Math.round((totalKB - freeKB) / 1024 / 1024 * 100) / 100;
      system.memTotalGB = Math.round(totalKB / 1024 / 1024 * 100) / 100;
    }
  }

  // Disk (Windows wmic — C: drive)
  const diskRaw = ssh(NODES.HP.tailscale, 'wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace,Size /value', 10000);
  if (diskRaw) {
    const freeBytes = diskRaw.match(/FreeSpace=(\d+)/);
    const sizeBytes = diskRaw.match(/Size=(\d+)/);
    if (freeBytes && sizeBytes) {
      const free = parseFloat(freeBytes[1]);
      const size = parseFloat(sizeBytes[1]);
      system.diskFreeGB = Math.round(free / 1024 / 1024 / 1024 * 10) / 10;
      system.diskUsedPercent = Math.round(((size - free) / size) * 100 * 10) / 10;
    }
  }

  log(`HP: online=${online} ssh=${sshUp} pg=${pgUp} cpu=${system.cpu}% mem=${system.memPercent}% disk=${system.diskUsedPercent}%`);
  return { online: online || sshUp, pm2: [], system };
}

async function collectOracle() {
  log('Collecting Oracle data...');
  const online = ping(NODES.Oracle.tailscale);
  if (!online) {
    log('Oracle: OFFLINE');
    return { online: false, docker: [], dockerContainers: [], pm2: [], system: {} };
  }

  const statsRaw = ssh(NODES.Oracle.tailscale, 'docker stats --no-stream --format json', 15000);
  const psRaw = ssh(NODES.Oracle.tailscale, 'docker ps --format json', 10000);
  const pm2Raw = ssh(NODES.Oracle.tailscale, 'pm2 jlist', 10000);

  const docker = parseDockerStats(statsRaw);
  const dockerContainers = parseDockerPS(psRaw);
  const pm2 = parsePM2(pm2Raw);

  log(`Oracle: ${docker.length} containers, ${pm2.length} PM2 processes`);
  return { online: true, docker, dockerContainers, pm2, system: {} };
}

async function collectEC2() {
  log('Collecting EC2 data...');
  const raw = localExec('pm2 jlist');
  const pm2 = parsePM2(raw);
  log(`EC2: ${pm2.length} PM2 processes`);
  return { online: true, pm2 };
}

async function collectTailscale() {
  log('Collecting Tailscale status...');
  const pings = Object.entries(NODES).map(([name, info]) => ({
    name,
    ip: info.tailscale,
    role: info.role,
    os: info.os,
    online: ping(info.tailscale),
  }));
  return { nodes: pings, connectedCount: pings.filter(n => n.online).length };
}

async function collectCloudflare() {
  log('Collecting Cloudflare subdomain status...');
  const checks = await Promise.all(
    SUBDOMAINS.map(async sub => {
      const url = `https://${sub}.${DOMAIN}`;
      const result = await httpCheck(url);
      return { subdomain: sub, url, ...result };
    })
  );
  const upCount = checks.filter(c => c.up).length;

  // Check Claude Chief of Staff (Edge API Telegram webhook health)
  const edgeApiCheck = checks.find(c => c.subdomain === 'edge-api');
  const cosUp = edgeApiCheck ? edgeApiCheck.up : false;
  const cosLatency = edgeApiCheck ? edgeApiCheck.latency : 0;

  log(`Cloudflare: ${upCount}/${checks.length} subdomains UP | Claude CoS: ${cosUp ? 'UP' : 'DOWN'}`);
  return { subdomains: checks, upCount, cosUp, cosLatency };
}

async function collectAll() {
  const [hp, oracle, ec2, tailscale, cloudflare] = await Promise.all([
    collectHP().catch(e => { log(`HP collect error: ${e.message}`); return { online: false, pm2: [] }; }),
    collectOracle().catch(e => { log(`Oracle collect error: ${e.message}`); return { online: false, docker: [], dockerContainers: [], pm2: [] }; }),
    collectEC2().catch(e => { log(`EC2 collect error: ${e.message}`); return { online: true, pm2: [] }; }),
    collectTailscale().catch(e => { log(`Tailscale collect error: ${e.message}`); return { nodes: [], connectedCount: 0 }; }),
    collectCloudflare().catch(e => { log(`Cloudflare collect error: ${e.message}`); return { subdomains: [], upCount: 0 }; }),
  ]);
  return { hp, oracle, ec2, tailscale, cloudflare, timestamp: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Metric Push — fills NAVADA/HP, NAVADA/Tailscale, NAVADA/Cloudflare namespaces
// ---------------------------------------------------------------------------
async function pushMetrics(data) {
  const now = new Date();
  const batches = [];

  // --- NAVADA/HP metrics ---
  const hp = data.hp.system || {};
  const hpMetrics = [];
  if (hp.cpu !== null && hp.cpu !== undefined) hpMetrics.push({ MetricName: 'SystemCPU', Value: hp.cpu, Unit: 'Percent' });
  if (hp.memPercent !== null && hp.memPercent !== undefined) hpMetrics.push({ MetricName: 'SystemMemoryPercent', Value: hp.memPercent, Unit: 'Percent' });
  if (hp.diskUsedPercent !== null && hp.diskUsedPercent !== undefined) hpMetrics.push({ MetricName: 'DiskUsedPercent', Value: hp.diskUsedPercent, Unit: 'Percent' });
  if (hp.diskFreeGB !== null && hp.diskFreeGB !== undefined) hpMetrics.push({ MetricName: 'DiskFreeGB', Value: hp.diskFreeGB, Unit: 'Gigabytes' });
  hpMetrics.push({ MetricName: 'SSHUp', Value: hp.sshUp ? 1 : 0, Unit: 'None' });
  hpMetrics.push({ MetricName: 'PostgreSQLUp', Value: hp.pgUp ? 1 : 0, Unit: 'None' });
  hpMetrics.push({ MetricName: 'NodeOnline', Value: data.hp.online ? 1 : 0, Unit: 'None' });

  if (hpMetrics.length > 0) {
    batches.push(CW.send(new PutMetricDataCommand({
      Namespace: 'NAVADA/HP',
      MetricData: hpMetrics.map(m => ({ ...m, Timestamp: now })),
    })).then(() => log('  Pushed NAVADA/HP metrics')).catch(e => log(`  FAIL NAVADA/HP: ${e.message}`)));
  }

  // --- NAVADA/Tailscale metrics ---
  const tsNodes = data.tailscale.nodes || [];
  const tsMetrics = [
    { MetricName: 'ConnectedNodes', Value: data.tailscale.connectedCount || 0, Unit: 'Count', Timestamp: now },
  ];
  for (const n of tsNodes) {
    tsMetrics.push({
      MetricName: 'NodeOnline', Value: n.online ? 1 : 0, Unit: 'None', Timestamp: now,
      Dimensions: [{ Name: 'Node', Value: n.name }],
    });
  }
  batches.push(CW.send(new PutMetricDataCommand({
    Namespace: 'NAVADA/Tailscale',
    MetricData: tsMetrics,
  })).then(() => log('  Pushed NAVADA/Tailscale metrics')).catch(e => log(`  FAIL NAVADA/Tailscale: ${e.message}`)));

  // --- NAVADA/Cloudflare metrics ---
  const cfSubs = data.cloudflare.subdomains || [];
  const cfMetrics = [
    { MetricName: 'SubdomainsUp', Value: data.cloudflare.upCount || 0, Unit: 'Count', Timestamp: now },
    { MetricName: 'TunnelStatus', Value: data.cloudflare.upCount > 0 ? 1 : 0, Unit: 'None', Timestamp: now },
  ];
  // Claude Chief of Staff uptime
  cfMetrics.push({ MetricName: 'ClaudeCoSUp', Value: data.cloudflare.cosUp ? 1 : 0, Unit: 'None', Timestamp: now });
  cfMetrics.push({ MetricName: 'ClaudeCoSLatencyMs', Value: data.cloudflare.cosLatency || 0, Unit: 'Milliseconds', Timestamp: now });

  // Per-subdomain metrics (batch max 1000, we have ~12)
  for (const s of cfSubs) {
    cfMetrics.push({
      MetricName: 'SubdomainStatus', Value: s.up ? 1 : 0, Unit: 'None', Timestamp: now,
      Dimensions: [{ Name: 'Subdomain', Value: s.subdomain }],
    });
    cfMetrics.push({
      MetricName: 'SubdomainLatencyMs', Value: s.latency || 0, Unit: 'Milliseconds', Timestamp: now,
      Dimensions: [{ Name: 'Subdomain', Value: s.subdomain }],
    });
  }
  batches.push(CW.send(new PutMetricDataCommand({
    Namespace: 'NAVADA/Cloudflare',
    MetricData: cfMetrics,
  })).then(() => log('  Pushed NAVADA/Cloudflare metrics')).catch(e => log(`  FAIL NAVADA/Cloudflare: ${e.message}`)));

  // --- NAVADA/NodeJS metrics (EC2 runtime) ---
  const nodeMetrics = [];
  try {
    const mem = process.memoryUsage();
    nodeMetrics.push({ MetricName: 'HeapUsedMB', Value: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10, Unit: 'Megabytes', Timestamp: now, Dimensions: [{ Name: 'Node', Value: 'EC2' }] });
    nodeMetrics.push({ MetricName: 'HeapTotalMB', Value: Math.round(mem.heapTotal / 1024 / 1024 * 10) / 10, Unit: 'Megabytes', Timestamp: now, Dimensions: [{ Name: 'Node', Value: 'EC2' }] });
    nodeMetrics.push({ MetricName: 'RssMB', Value: Math.round(mem.rss / 1024 / 1024 * 10) / 10, Unit: 'Megabytes', Timestamp: now, Dimensions: [{ Name: 'Node', Value: 'EC2' }] });
    nodeMetrics.push({ MetricName: 'ExternalMB', Value: Math.round(mem.external / 1024 / 1024 * 10) / 10, Unit: 'Megabytes', Timestamp: now, Dimensions: [{ Name: 'Node', Value: 'EC2' }] });
    nodeMetrics.push({ MetricName: 'PM2ProcessCount', Value: (data.ec2.pm2 || []).length, Unit: 'Count', Timestamp: now, Dimensions: [{ Name: 'Node', Value: 'EC2' }] });
  } catch {}
  if (nodeMetrics.length > 0) {
    batches.push(CW.send(new PutMetricDataCommand({
      Namespace: 'NAVADA/NodeJS',
      MetricData: nodeMetrics,
    })).then(() => log('  Pushed NAVADA/NodeJS metrics')).catch(e => log(`  FAIL NAVADA/NodeJS: ${e.message}`)));
  }

  await Promise.allSettled(batches);
  log('Metric push complete');
}

// ---------------------------------------------------------------------------
// Widget Helpers
// ---------------------------------------------------------------------------

function pm2Table(processes, nodeName) {
  if (!processes || processes.length === 0) return `| No PM2 processes found on ${nodeName} |\n`;
  let t = `| Process | Status | CPU | Memory | Restarts | Uptime |\n`;
  t += `|---------|--------|-----|--------|----------|--------|\n`;
  for (const p of processes) {
    const icon = p.status === 'online' ? '\\u2705' : '\\u274c';
    t += `| ${icon} ${esc(p.name)} | ${p.status} | ${p.cpu}% | ${p.memory}MB | ${p.restarts} | ${p.uptime} |\n`;
  }
  return t;
}

function dockerTable(containers) {
  if (!containers || containers.length === 0) return `| No Docker containers found |\n`;
  let t = `| Container | CPU | Memory | Mem% |\n`;
  t += `|-----------|-----|--------|------|\n`;
  for (const c of containers) {
    t += `| \\u2705 ${esc(c.name)} | ${c.cpu}% | ${esc(c.memory)} | ${c.memPercent}% |\n`;
  }
  return t;
}

function nodeTable(nodes) {
  let t = `| Node | Tailscale IP | Role | Status |\n`;
  t += `|------|-------------|------|--------|\n`;
  for (const n of nodes) {
    const icon = n.online ? '\\u2705 ONLINE' : '\\u274c OFFLINE';
    t += `| ${esc(n.name)} | ${n.ip} | ${esc(n.role)} | ${icon} |\n`;
  }
  return t;
}

function cfTable(subdomains) {
  let t = `| Subdomain | URL | Status | Latency |\n`;
  t += `|-----------|-----|--------|---------|\n`;
  for (const s of subdomains) {
    const icon = s.up ? '\\u2705 UP' : '\\u274c DOWN';
    t += `| ${esc(s.subdomain)} | ${esc(s.url)} | ${icon} | ${s.latency}ms |\n`;
  }
  return t;
}

function header(title, ts) {
  return `# ${title}\n**Last updated:** ${ts}\n\n`;
}

function textWidget(x, y, w, h, markdown) {
  return { type: 'text', x, y, width: w, height: h, properties: { markdown, background: 'transparent' } };
}

function metricWidget(x, y, w, h, title, metrics, opts = {}) {
  const period = opts.period || 300;
  const stat = opts.stat || 'Average';
  const view = opts.view || 'timeSeries';
  const stacked = opts.stacked || false;

  const metricsArr = metrics.map(m => {
    const base = [m.namespace, m.name];
    if (m.dimensions) {
      for (const d of m.dimensions) {
        base.push(d.Name, d.Value);
      }
    }
    const metricOpts = {};
    if (m.label) metricOpts.label = m.label;
    if (m.stat) metricOpts.stat = m.stat;
    base.push(metricOpts);
    return base;
  });

  return {
    type: 'metric', x, y, width: w, height: h,
    properties: {
      title, view, stacked, region: REGION, period, stat,
      metrics: metricsArr,
    },
  };
}

// ---------------------------------------------------------------------------
// Dashboard Builders — Compact, structured, beautiful
// ---------------------------------------------------------------------------

// 1. Master Console
function buildEdgeNetwork(data) {
  const ts = data.timestamp;
  const hp = data.hp, orc = data.oracle, ec2 = data.ec2, ts_ = data.tailscale, cf = data.cloudflare;
  const hpN = hp.pm2?.length || 0, orcD = orc.docker?.length || 0, orcP = orc.pm2?.length || 0, ec2N = ec2.pm2?.length || 0;
  const total = hpN + orcD + orcP + ec2N;
  const nodesUp = ts_.connectedCount || 0;

  let md = `# NAVADA Edge v4 Network\n`;
  md += `**Master Console** | Lee Akpareva, Founder | Claude Chief of Staff on Cloudflare Edge\n`;
  md += `**Updated:** ${ts} | **Nodes:** ${nodesUp}/5 online | **Services:** ${total} running | **Telegram Bot**: Cloudflare Worker (24/7)\n\n`;
  md += `| Node | Role | Status | Services |\n|------|------|--------|----------|\n`;
  md += `| NAVADA-GATEWAY | Cloudflare Edge | ON | Worker + D1 + R2 + 5 crons |\n`;
  for (const n of ts_.nodes) {
    const icon = n.online ? 'ON' : 'OFF';
    const svcCount = n.name === 'HP' ? 'SSH-only' : n.name === 'Oracle' ? (orcP + orcD) : n.name === 'EC2' ? ec2N : '-';
    md += `| ${esc(n.name)} | ${esc(n.role.split(' | ')[0])} | ${icon} | ${svcCount} |\n`;
  }

  const widgets = [
    textWidget(0, 0, 24, 5, md),
    metricWidget(0, 5, 8, 6, 'HP CPU + Memory', [
      { namespace: 'NAVADA/HP', name: 'SystemCPU', label: 'CPU %' },
      { namespace: 'NAVADA/HP', name: 'SystemMemoryPercent', label: 'Memory %' },
    ]),
    metricWidget(8, 5, 8, 6, 'Oracle Host', [
      { namespace: 'NAVADA/Oracle', name: 'HostCPU', label: 'CPU %' },
      { namespace: 'NAVADA/Oracle', name: 'HostMemoryPercent', label: 'Memory %' },
    ]),
    metricWidget(16, 5, 8, 6, 'EC2 CPU', [
      { namespace: 'AWS/EC2', name: 'CPUUtilization', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], label: 'CPU %' },
    ]),
    metricWidget(0, 11, 8, 6, 'HP Services', [
      { namespace: 'NAVADA/HP', name: 'SSHUp', label: 'SSH' },
      { namespace: 'NAVADA/HP', name: 'PostgreSQLUp', label: 'PostgreSQL' },
      { namespace: 'NAVADA/HP', name: 'NodeOnline', label: 'Online' },
    ], { view: 'singleValue' }),
    metricWidget(8, 11, 8, 6, 'Docker (Oracle)', [
      { namespace: 'NAVADA/Docker', name: 'TotalContainers', label: 'Containers', stat: 'Maximum' },
      { namespace: 'NAVADA/Docker', name: 'TotalCPU', label: 'Docker CPU %' },
      { namespace: 'NAVADA/Docker', name: 'TotalMemoryPercent', label: 'Docker Mem %' },
    ], { view: 'singleValue' }),
    metricWidget(16, 11, 8, 6, 'Tailscale Mesh', [
      { namespace: 'NAVADA/Tailscale', name: 'ConnectedNodes', label: 'Nodes Connected' },
    ], { view: 'singleValue' }),
    metricWidget(0, 17, 8, 6, 'Lambda Invocations', [
      { namespace: 'AWS/Lambda', name: 'Invocations', dimensions: [{ Name: 'FunctionName', Value: 'navada-vision-router' }], stat: 'Sum', label: 'Invocations' },
      { namespace: 'AWS/Lambda', name: 'Errors', dimensions: [{ Name: 'FunctionName', Value: 'navada-vision-router' }], stat: 'Sum', label: 'Errors' },
    ]),
    metricWidget(8, 17, 8, 6, 'Claude Chief of Staff', [
      { namespace: 'NAVADA/Cloudflare', name: 'ClaudeCoSUp', label: 'CoS UP (1=Yes)' },
      { namespace: 'NAVADA/Cloudflare', name: 'ClaudeCoSLatencyMs', label: 'Latency (ms)' },
    ]),
    metricWidget(16, 17, 8, 6, 'EC2 Network I/O', [
      { namespace: 'AWS/EC2', name: 'NetworkIn', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], stat: 'Sum', label: 'In' },
      { namespace: 'AWS/EC2', name: 'NetworkOut', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], stat: 'Sum', label: 'Out' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 2. HP Dashboard — SSH-only node (PostgreSQL + SSH, no PM2)
function buildHP(data) {
  const ts = data.timestamp;
  const on = data.hp.online;
  const sys = data.hp.system || {};

  let md = `# NAVADA-EDGE-SERVER (HP Laptop)\n`;
  md += `**Role**: SSH-only node server | PostgreSQL :5433 | No PM2, no scheduled tasks\n`;
  md += `**IP**: 192.168.0.58 (Ethernet) | 100.121.187.67 (Tailscale) | **OS**: Windows 11 Pro\n`;
  md += `**Status**: ${on ? 'ONLINE' : 'OFFLINE'} | **SSH**: ${sys.sshUp ? 'UP' : 'DOWN'} | **PostgreSQL**: ${sys.pgUp ? 'UP' : 'DOWN'}`;
  if (sys.cpu != null) md += ` | **CPU**: ${sys.cpu}% | **Mem**: ${sys.memPercent}% | **Disk**: ${sys.diskFreeGB}GB free`;
  md += `\n**Metrics via SSH from EC2 every 5 min** | Telegram bot on Cloudflare Worker\n`;

  const widgets = [
    textWidget(0, 0, 24, 4, md),
    metricWidget(0, 4, 6, 5, 'Online', [
      { namespace: 'NAVADA/HP', name: 'NodeOnline', label: 'Online (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(6, 4, 6, 5, 'SSH', [
      { namespace: 'NAVADA/HP', name: 'SSHUp', label: 'SSH (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(12, 4, 6, 5, 'PostgreSQL', [
      { namespace: 'NAVADA/HP', name: 'PostgreSQLUp', label: 'PG (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(18, 4, 6, 5, 'Disk Free', [
      { namespace: 'NAVADA/HP', name: 'DiskFreeGB', label: 'GB Free' },
    ], { view: 'singleValue' }),
    metricWidget(0, 9, 12, 6, 'CPU + Memory', [
      { namespace: 'NAVADA/HP', name: 'SystemCPU', label: 'CPU %' },
      { namespace: 'NAVADA/HP', name: 'SystemMemoryPercent', label: 'Memory %' },
    ]),
    metricWidget(12, 9, 12, 6, 'Disk Usage', [
      { namespace: 'NAVADA/HP', name: 'DiskUsedPercent', label: 'Used %' },
      { namespace: 'NAVADA/HP', name: 'DiskFreeGB', label: 'Free GB' },
    ]),
    metricWidget(0, 15, 12, 6, 'Service Health History', [
      { namespace: 'NAVADA/HP', name: 'SSHUp', label: 'SSH' },
      { namespace: 'NAVADA/HP', name: 'PostgreSQLUp', label: 'PostgreSQL' },
      { namespace: 'NAVADA/HP', name: 'NodeOnline', label: 'Node Online' },
    ]),
    metricWidget(12, 15, 12, 6, 'Tailscale Connectivity', [
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'HP' }], label: 'HP Tailscale' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 3. Oracle Dashboard
function buildOracle(data) {
  const ts = data.timestamp;
  const on = data.oracle.online;
  const containers = data.oracle.docker || [];
  const pm2 = data.oracle.pm2 || [];

  let md = `# NAVADA Oracle VM\n`;
  md += `**Role**: Docker Host (Nginx reverse proxy, Cloudflare tunnel, Grafana, Prometheus, Portainer, CloudBeaver)\n`;
  md += `**IP**: 132.145.46.184 (Public) | 100.77.206.9 (Tailscale) | **OS**: Ubuntu | **Spec**: E5.Flex, 1 OCPU, 6GB RAM\n`;
  md += `**Status**: ${on ? 'ONLINE' : 'OFFLINE'} | **Tier**: Always Free (resized from 12GB to 6GB) | **Updated**: ${ts}\n\n`;
  if (containers.length > 0) {
    md += `**Docker (${containers.length})**\n`;
    md += `| Container | CPU | Memory | Mem% |\n|-----------|-----|--------|------|\n`;
    for (const c of containers) md += `| ${esc(c.name)} | ${c.cpu}% | ${esc(c.memory)} | ${c.memPercent}% |\n`;
  }
  if (pm2.length > 0) {
    md += `\n**PM2 (${pm2.length})**\n`;
    md += `| Service | Status | CPU | Mem |\n|---------|--------|-----|-----|\n`;
    for (const p of pm2) md += `| ${esc(p.name)} | ${p.status === 'online' ? 'ON' : 'OFF'} | ${p.cpu}% | ${p.memory}MB |\n`;
  }

  const containerCPU = containers.slice(0, 10).map(c => ({
    namespace: 'NAVADA/Docker', name: 'ContainerCPU', dimensions: [{ Name: 'Container', Value: c.name }], label: c.name,
  }));
  const containerMem = containers.slice(0, 10).map(c => ({
    namespace: 'NAVADA/Docker', name: 'ContainerMemoryMB', dimensions: [{ Name: 'Container', Value: c.name }], label: c.name,
  }));

  const textH = 4 + Math.min(containers.length + pm2.length, 10);
  const widgets = [
    textWidget(0, 0, 24, textH, md),
    metricWidget(0, textH, 8, 6, 'Host CPU + Memory', [
      { namespace: 'NAVADA/Oracle', name: 'HostCPU', label: 'CPU %' },
      { namespace: 'NAVADA/Oracle', name: 'HostMemoryPercent', label: 'Memory %' },
    ]),
    metricWidget(8, textH, 8, 6, 'Host Disk + Load', [
      { namespace: 'NAVADA/Oracle', name: 'HostDiskPercent', label: 'Disk %' },
      { namespace: 'NAVADA/Oracle', name: 'HostLoadAvg1m', label: 'Load 1m' },
    ]),
    metricWidget(16, textH, 8, 6, 'Memory Detail', [
      { namespace: 'NAVADA/Oracle', name: 'HostMemoryUsedMB', label: 'Used MB' },
      { namespace: 'NAVADA/Oracle', name: 'HostMemoryTotalMB', label: 'Total MB' },
    ], { view: 'singleValue' }),
    metricWidget(0, textH + 6, 8, 6, 'Docker Totals', [
      { namespace: 'NAVADA/Docker', name: 'TotalContainers', label: 'Containers', stat: 'Maximum' },
      { namespace: 'NAVADA/Docker', name: 'TotalCPU', label: 'CPU %' },
      { namespace: 'NAVADA/Docker', name: 'TotalMemoryPercent', label: 'Mem %' },
    ], { view: 'singleValue' }),
    metricWidget(8, textH + 6, 8, 6, 'Container CPU', containerCPU.length > 0 ? containerCPU : [
      { namespace: 'NAVADA/Docker', name: 'ContainerCPU', label: 'CPU' },
    ]),
    metricWidget(16, textH + 6, 8, 6, 'Container Memory', containerMem.length > 0 ? containerMem : [
      { namespace: 'NAVADA/Docker', name: 'ContainerMemoryMB', label: 'Memory' },
    ]),

    // OCI Cost Monitoring
    metricWidget(0, textH + 12, 8, 6, 'OCI Monthly Cost (GBP)', [
      { namespace: 'NAVADA/OCI', name: 'MonthlyCostGBP', label: 'Cost GBP', stat: 'Maximum' },
    ]),
    metricWidget(8, textH + 12, 8, 6, 'Budget Used %', [
      { namespace: 'NAVADA/OCI', name: 'BudgetUsedPercent', label: 'Budget %', stat: 'Maximum' },
    ]),
    metricWidget(16, textH + 12, 8, 6, 'Instance Config', [
      { namespace: 'NAVADA/OCI', name: 'InstanceMemoryGB', label: 'RAM GB', stat: 'Maximum' },
      { namespace: 'NAVADA/OCI', name: 'InstanceOCPUs', label: 'OCPUs', stat: 'Maximum' },
      { namespace: 'NAVADA/OCI', name: 'InstanceRunning', label: 'Running', stat: 'Maximum' },
    ], { view: 'singleValue' }),
    metricWidget(0, textH + 18, 12, 6, 'Compute Cost Trend', [
      { namespace: 'NAVADA/OCI', name: 'Cost_Compute', label: 'Compute GBP', stat: 'Maximum' },
    ]),
    metricWidget(12, textH + 18, 12, 6, 'Budget Trend', [
      { namespace: 'NAVADA/OCI', name: 'BudgetUsedPercent', label: 'Budget Used %', stat: 'Maximum' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 4. EC2 Operations
function buildEC2(data) {
  const ts = data.timestamp;
  const procs = data.ec2.pm2 || [];
  const onlineCount = procs.filter(p => p.status === 'online').length;

  let md = `# NAVADA EC2 Operations\n`;
  md += `**Role**: 24/7 Health Monitoring, WorldMonitor OSINT, CloudWatch Dashboard Auto-Updater\n`;
  md += `**Instance**: ${EC2_INSTANCE_ID} | **Elastic IP**: 3.11.119.181 | **Tailscale**: 100.98.118.33\n`;
  md += `**Spec**: t3.medium (2 vCPU, 4GB RAM) | **OS**: Ubuntu | **Always On**: Yes\n\n`;
  md += `**PM2 Services (${onlineCount}/${procs.length})**\n`;
  md += `| Service | Status | CPU | Memory | Uptime |\n|---------|--------|-----|--------|--------|\n`;
  for (const p of procs) {
    md += `| ${esc(p.name)} | ${p.status === 'online' ? 'ON' : 'OFF'} | ${p.cpu}% | ${p.memory}MB | ${esc(p.uptime || '-')} |\n`;
  }

  const widgets = [
    textWidget(0, 0, 24, 4 + Math.min(procs.length + 1, 8), md),
    metricWidget(0, 12, 8, 6, 'EC2 CPU Utilization', [
      { namespace: 'AWS/EC2', name: 'CPUUtilization', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], label: 'CPU %' },
    ]),
    metricWidget(8, 12, 8, 6, 'EC2 Network I/O', [
      { namespace: 'AWS/EC2', name: 'NetworkIn', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], stat: 'Sum', label: 'Bytes In' },
      { namespace: 'AWS/EC2', name: 'NetworkOut', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], stat: 'Sum', label: 'Bytes Out' },
    ]),
    metricWidget(16, 12, 8, 6, 'Status Checks', [
      { namespace: 'AWS/EC2', name: 'StatusCheckFailed', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], stat: 'Maximum', label: 'Failed Checks' },
    ], { view: 'singleValue' }),
    metricWidget(0, 18, 12, 6, 'WorldView Health', [
      { namespace: 'NAVADA/WorldView', name: 'SiteUp', label: 'Site Up' },
      { namespace: 'NAVADA/WorldView', name: 'AlertsApiUp', label: 'Alerts API' },
      { namespace: 'NAVADA/WorldView', name: 'ResponseTimeMs', label: 'Response (ms)' },
    ]),
    metricWidget(12, 18, 12, 6, 'Cloudflare Subdomains', [
      { namespace: 'NAVADA/Cloudflare', name: 'SubdomainsUp', label: 'Up Count' },
      { namespace: 'NAVADA/Cloudflare', name: 'TunnelStatus', label: 'Tunnel' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 5. PM2 Processes (Combined)
function buildPM2(data) {
  const ts = data.timestamp;
  const hpProcs = data.hp.pm2 || [];
  const orcProcs = data.oracle.pm2 || [];
  const ec2Procs = data.ec2.pm2 || [];
  const all = [...hpProcs, ...orcProcs, ...ec2Procs];
  const onlineCount = all.filter(p => p.status === 'online').length;

  let md = `# NAVADA PM2 Services\n`;
  md += `**Process Manager**: PM2 on EC2 (24/7) + Oracle | HP is SSH-only (no PM2)\n`;
  md += `**Total**: ${all.length} services | **Online**: ${onlineCount} | **Updated**: ${ts}\n\n`;

  const sections = [
    { label: 'HP', procs: hpProcs },
    { label: 'Oracle', procs: orcProcs },
    { label: 'EC2', procs: ec2Procs },
  ];
  for (const s of sections) {
    if (s.procs.length === 0) continue;
    const on = s.procs.filter(p => p.status === 'online').length;
    md += `**${s.label} (${on}/${s.procs.length})**\n`;
    md += `| Service | Status | CPU | Mem | Restarts |\n|---------|--------|-----|-----|----------|\n`;
    for (const p of s.procs) {
      md += `| ${esc(p.name)} | ${p.status === 'online' ? 'ON' : 'OFF'} | ${p.cpu}% | ${p.memory}MB | ${p.restarts} |\n`;
    }
    md += `\n`;
  }

  const textH = Math.min(4 + all.length + sections.filter(s => s.procs.length > 0).length * 2, 18);
  const hpMem = hpProcs.slice(0, 8).map(p => ({
    namespace: 'NAVADA/HP', name: 'ProcessMemoryMB', dimensions: [{ Name: 'Process', Value: p.name }], label: `HP:${p.name}`,
  }));
  const hpCPU = hpProcs.slice(0, 8).map(p => ({
    namespace: 'NAVADA/HP', name: 'ProcessCPU', dimensions: [{ Name: 'Process', Value: p.name }], label: `HP:${p.name}`,
  }));

  const widgets = [
    textWidget(0, 0, 24, textH, md),
    metricWidget(0, textH, 12, 6, 'HP Process Memory (MB)', hpMem.length > 0 ? hpMem : [
      { namespace: 'NAVADA/HP', name: 'TotalProcesses', label: 'Total' },
    ]),
    metricWidget(12, textH, 12, 6, 'HP Process CPU (%)', hpCPU.length > 0 ? hpCPU : [
      { namespace: 'NAVADA/HP', name: 'SystemCPU', label: 'System CPU' },
    ]),
    metricWidget(0, textH + 6, 8, 6, 'HP Services', [
      { namespace: 'NAVADA/HP', name: 'SSHUp', label: 'SSH' },
      { namespace: 'NAVADA/HP', name: 'PostgreSQLUp', label: 'PostgreSQL' },
    ], { view: 'singleValue' }),
    metricWidget(8, textH + 6, 8, 6, 'Oracle Docker', [
      { namespace: 'NAVADA/Docker', name: 'TotalContainers', label: 'Containers', stat: 'Maximum' },
    ], { view: 'singleValue' }),
    metricWidget(16, textH + 6, 8, 6, 'Tailscale Nodes', [
      { namespace: 'NAVADA/Tailscale', name: 'ConnectedNodes', label: 'Connected' },
    ], { view: 'singleValue' }),
  ];

  return JSON.stringify({ widgets });
}

// 6. Cloudflare
function buildCloudflare(data) {
  const ts = data.timestamp;
  const subs = data.cloudflare.subdomains || [];
  const upCount = data.cloudflare.upCount || 0;

  let md = `# NAVADA Cloudflare\n`;
  md += `**CDN, DNS & Tunnel** | Routes all public HTTPS traffic to NAVADA Edge infrastructure\n`;
  md += `**Domain**: ${DOMAIN} | **Subdomains**: ${upCount}/${subs.length} UP | **Updated**: ${ts}\n\n`;
  md += `| Subdomain | URL | Status | Latency |\n|-----------|-----|--------|---------|\n`;
  for (const s of subs) {
    md += `| ${esc(s.subdomain)} | https://${esc(s.subdomain)}.${DOMAIN} | ${s.up ? 'UP' : 'DOWN'} | ${s.latency}ms |\n`;
  }

  const subStatus = SUBDOMAINS.map(s => ({
    namespace: 'NAVADA/Cloudflare', name: 'SubdomainStatus',
    dimensions: [{ Name: 'Subdomain', Value: s }], label: s,
  }));
  const subLatency = SUBDOMAINS.map(s => ({
    namespace: 'NAVADA/Cloudflare', name: 'SubdomainLatencyMs',
    dimensions: [{ Name: 'Subdomain', Value: s }], label: s,
  }));

  const widgets = [
    textWidget(0, 0, 24, 4 + Math.min(subs.length, 12), md),
    metricWidget(0, 16, 8, 6, 'Tunnel + Subdomains', [
      { namespace: 'NAVADA/Cloudflare', name: 'TunnelStatus', label: 'Tunnel UP' },
      { namespace: 'NAVADA/Cloudflare', name: 'SubdomainsUp', label: 'Subdomains UP' },
    ], { view: 'singleValue' }),
    metricWidget(8, 16, 8, 6, 'Tunnel Latency', [
      { namespace: 'NAVADA/Cloudflare', name: 'TunnelLatencyMs', label: 'ms' },
    ]),
    metricWidget(16, 16, 8, 6, 'Zone Traffic', [
      { namespace: 'NAVADA/Cloudflare', name: 'RequestCount', label: 'Requests', stat: 'Sum' },
      { namespace: 'NAVADA/Cloudflare', name: 'BandwidthBytes', label: 'Bandwidth', stat: 'Sum' },
    ]),
    metricWidget(0, 22, 12, 6, 'Subdomain Status (1=UP)', subStatus),
    metricWidget(12, 22, 12, 6, 'Subdomain Latency (ms)', subLatency),
    metricWidget(0, 28, 12, 6, 'Cache + Security', [
      { namespace: 'NAVADA/Cloudflare', name: 'CacheHitRate', label: 'Cache Hit %' },
      { namespace: 'NAVADA/Cloudflare', name: 'ThreatsBlocked', label: 'Threats', stat: 'Sum' },
    ]),
    metricWidget(12, 28, 12, 6, 'R2 Storage', [
      { namespace: 'NAVADA/Cloudflare', name: 'R2ObjectCount', label: 'Objects', stat: 'Maximum' },
      { namespace: 'NAVADA/Cloudflare', name: 'DNSRecordCount', label: 'DNS Records', stat: 'Maximum' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 7. Tailscale
function buildTailscale(data) {
  const ts = data.timestamp;
  const nodes = data.tailscale.nodes || [];
  const connected = data.tailscale.connectedCount || 0;

  let md = `# NAVADA Tailscale Mesh VPN\n`;
  md += `**5 Nodes** | Private encrypted mesh network connecting all NAVADA infrastructure\n`;
  md += `**Connected**: ${connected}/${nodes.length} nodes | **Checked from**: EC2 via ping | **Updated**: ${ts}\n\n`;
  md += `| Node | Tailscale IP | Role | Status |\n|------|-------------|------|--------|\n`;
  for (const n of nodes) {
    md += `| ${esc(n.name)} | ${n.ip} | ${esc(n.role)} | ${n.online ? 'ON' : 'OFF'} |\n`;
  }

  const nodeStatus = ['HP', 'Oracle', 'EC2', 'ASUS'].map(n => ({
    namespace: 'NAVADA/Tailscale', name: 'NodeOnline',
    dimensions: [{ Name: 'Node', Value: n }], label: n,
  }));

  const widgets = [
    textWidget(0, 0, 24, 4 + Math.min(nodes.length, 6), md),
    metricWidget(0, 10, 8, 6, 'Connected Nodes', [
      { namespace: 'NAVADA/Tailscale', name: 'ConnectedNodes', label: 'Connected' },
    ], { view: 'singleValue' }),
    metricWidget(8, 10, 16, 6, 'Node Status Over Time (1=ON)', nodeStatus),
    metricWidget(0, 16, 6, 6, 'HP', [
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'HP' }], label: 'HP' },
    ], { view: 'singleValue' }),
    metricWidget(6, 16, 6, 6, 'Oracle', [
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'Oracle' }], label: 'Oracle' },
    ], { view: 'singleValue' }),
    metricWidget(12, 16, 6, 6, 'EC2', [
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'EC2' },
    ], { view: 'singleValue' }),
    metricWidget(18, 16, 6, 6, 'ASUS', [
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'ASUS' }], label: 'ASUS' },
    ], { view: 'singleValue' }),
  ];

  return JSON.stringify({ widgets });
}

// 8. Node.js Runtime — EC2 is primary runtime now (HP has no PM2)
function buildNodeJS(data) {
  const ts = data.timestamp;
  const orcProcs = data.oracle.pm2 || [];
  const ec2Procs = data.ec2.pm2 || [];

  let md = `# NAVADA Node.js Runtime\n`;
  md += `**V8 Engine Metrics** | EC2 dashboard-updater runtime + PM2 process metrics\n`;
  md += `**Updated**: ${ts} | HP is SSH-only (no Node.js runtime metrics)\n\n`;
  md += `| Node | Processes | Online |\n|------|-----------|--------|\n`;
  md += `| EC2 | ${ec2Procs.length} | ${ec2Procs.filter(p => p.status === 'online').length} |\n`;
  md += `| Oracle | ${orcProcs.length} | ${orcProcs.filter(p => p.status === 'online').length} |\n`;

  const widgets = [
    textWidget(0, 0, 24, 4, md),
    metricWidget(0, 4, 8, 6, 'EC2 Heap Used (MB)', [
      { namespace: 'NAVADA/NodeJS', name: 'HeapUsedMB', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'Heap Used' },
    ]),
    metricWidget(8, 4, 8, 6, 'EC2 Heap Total (MB)', [
      { namespace: 'NAVADA/NodeJS', name: 'HeapTotalMB', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'Heap Total' },
    ]),
    metricWidget(16, 4, 8, 6, 'EC2 RSS + External (MB)', [
      { namespace: 'NAVADA/NodeJS', name: 'RssMB', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'RSS' },
      { namespace: 'NAVADA/NodeJS', name: 'ExternalMB', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'External' },
    ]),
    metricWidget(0, 10, 8, 6, 'EC2 PM2 Process Count', [
      { namespace: 'NAVADA/NodeJS', name: 'PM2ProcessCount', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'Count' },
    ], { view: 'singleValue' }),
    metricWidget(8, 10, 8, 6, 'EC2 CPU', [
      { namespace: 'AWS/EC2', name: 'CPUUtilization', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], label: 'EC2 CPU %' },
    ]),
    metricWidget(16, 10, 8, 6, 'Tailscale Nodes', [
      { namespace: 'NAVADA/Tailscale', name: 'ConnectedNodes', label: 'Connected' },
    ], { view: 'singleValue' }),
  ];

  return JSON.stringify({ widgets });
}

// 9. ASUS
function buildASUS(data) {
  const ts = data.timestamp;
  const asusNode = data.tailscale.nodes.find(n => n.name === 'ASUS');
  const on = asusNode ? asusNode.online : false;

  let md = `# NAVADA ASUS (Dev Workstation)\n`;
  md += `**Role**: Lee's primary development platform | Claude Code, VS Code, LM Studio, Ollama, PostgreSQL 17\n`;
  md += `**IP**: 192.168.0.18 (WiFi) | 100.88.118.128 (Tailscale) | **OS**: Windows 11 Home\n`;
  md += `**Status**: ${on ? 'ONLINE' : 'OFFLINE'} | **Hostname**: navada-asus-control | **Updated**: ${ts}\n`;

  const A = 'NAVADA/ASUS';
  const TS = 'NAVADA/Tailscale';

  const widgets = [
    // Row 0: Header
    textWidget(0, 0, 24, 3, md),

    // Row 3: Status indicators
    metricWidget(0, 3, 6, 4, 'Online', [
      { namespace: TS, name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'ASUS' }], label: 'ASUS' },
    ], { view: 'singleValue' }),
    metricWidget(6, 3, 6, 4, 'Uptime (Hours)', [
      { namespace: A, name: 'UptimeHours', label: 'Hours' },
    ], { view: 'singleValue' }),
    metricWidget(12, 3, 6, 4, 'Battery', [
      { namespace: A, name: 'BatteryPercent', label: 'Battery %' },
    ], { view: 'singleValue' }),
    metricWidget(18, 3, 6, 4, 'Mesh Nodes', [
      { namespace: TS, name: 'ConnectedNodes', label: 'Connected' },
    ], { view: 'singleValue' }),

    // Row 7: CPU + Memory gauges
    metricWidget(0, 7, 12, 6, 'CPU + Memory', [
      { namespace: A, name: 'SystemCPU', label: 'CPU %' },
      { namespace: A, name: 'SystemMemoryPercent', label: 'Memory %' },
    ]),
    metricWidget(12, 7, 12, 6, 'Memory Usage (GB)', [
      { namespace: A, name: 'MemoryUsedGB', label: 'Used GB' },
    ]),

    // Row 13: Disk + Battery
    metricWidget(0, 13, 8, 6, 'Disk Usage', [
      { namespace: A, name: 'DiskUsedPercent', label: 'Disk Used %' },
    ]),
    metricWidget(8, 13, 8, 6, 'Disk Free (GB)', [
      { namespace: A, name: 'DiskFreeGB', label: 'Free GB' },
    ]),
    metricWidget(16, 13, 8, 6, 'Battery Over Time', [
      { namespace: A, name: 'BatteryPercent', label: 'Battery %' },
      { namespace: A, name: 'BatteryCharging', label: 'Charging (1=Yes)' },
    ]),

    // Row 19: Local services health
    metricWidget(0, 19, 6, 5, 'PostgreSQL', [
      { namespace: A, name: 'PostgreSQLUp', label: 'PG Up (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(6, 19, 6, 5, 'Ollama', [
      { namespace: A, name: 'OllamaUp', label: 'Ollama (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(12, 19, 6, 5, 'Docker', [
      { namespace: A, name: 'DockerUp', label: 'Docker (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(18, 19, 6, 5, 'Processes', [
      { namespace: A, name: 'ProcessCount', label: 'Total' },
    ], { view: 'singleValue' }),

    // Row 24: Network + PM2
    metricWidget(0, 24, 12, 6, 'Network Traffic (KB/s)', [
      { namespace: A, name: 'NetworkTxKBs', label: 'TX (Upload)' },
      { namespace: A, name: 'NetworkRxKBs', label: 'RX (Download)' },
    ]),
    metricWidget(12, 24, 12, 6, 'PM2 Processes', [
      { namespace: A, name: 'PM2Total', label: 'Total' },
      { namespace: A, name: 'PM2Online', label: 'Online' },
    ]),

    // Row 30: Connectivity timeline
    metricWidget(0, 30, 12, 6, 'ASUS Online History', [
      { namespace: TS, name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'ASUS' }], label: 'ASUS' },
    ]),
    metricWidget(12, 30, 12, 6, 'Tailscale Peers', [
      { namespace: A, name: 'TailscalePeers', label: 'Connected Peers' },
    ]),

    // Row 36: Heartbeat
    metricWidget(0, 36, 24, 5, 'Heartbeat Signal', [
      { namespace: A, name: 'Heartbeat', label: 'Heartbeat' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 10. World View
function buildWorldView(data) {
  const ts = data.timestamp;
  const wm = data.ec2.pm2.find(p => p.name === 'worldmonitor');
  const wmHealth = data.ec2.pm2.find(p => p.name === 'worldview-monitor');

  let md = `# NAVADA World View\n`;
  md += `**Open Source Intelligence (OSINT) Dashboard** | Real-time global monitoring of news, threats, and events\n`;
  md += `**Host**: EC2 (port 4000, Next.js 16) | **API**: /api/alerts, /api/insights, /api/analytics\n`;
  md += `**Vercel**: Frontend proxies /api/* to EC2 via Tailscale | **Updated**: ${ts}\n\n`;
  if (wm) {
    md += `| Service | Status | CPU | Memory | Uptime |\n|---------|--------|-----|--------|--------|\n`;
    md += `| worldmonitor | ${wm.status === 'online' ? 'RUNNING' : 'STOPPED'} | ${wm.cpu}% | ${wm.memory}MB | ${esc(wm.uptime || '-')} |\n`;
  }
  if (wmHealth) {
    md += `| worldview-monitor | ${wmHealth.status === 'online' ? 'RUNNING' : 'STOPPED'} | ${wmHealth.cpu}% | ${wmHealth.memory}MB | ${esc(wmHealth.uptime || '-')} |\n`;
  }

  const widgets = [
    textWidget(0, 0, 24, 3, md),
    metricWidget(0, 3, 6, 6, 'Site Up', [
      { namespace: 'NAVADA/WorldView', name: 'SiteUp', label: 'Up (1=Yes)' },
    ], { view: 'singleValue' }),
    metricWidget(6, 3, 6, 6, 'Alerts API', [
      { namespace: 'NAVADA/WorldView', name: 'AlertsApiUp', label: 'Up' },
    ], { view: 'singleValue' }),
    metricWidget(12, 3, 6, 6, 'Insights API', [
      { namespace: 'NAVADA/WorldView', name: 'InsightsApiUp', label: 'Up' },
    ], { view: 'singleValue' }),
    metricWidget(18, 3, 6, 6, 'Analytics API', [
      { namespace: 'NAVADA/WorldView', name: 'AnalyticsApiUp', label: 'Up' },
    ], { view: 'singleValue' }),
    metricWidget(0, 9, 12, 6, 'Response Times (ms)', [
      { namespace: 'NAVADA/WorldView', name: 'ResponseTimeMs', label: 'Site' },
      { namespace: 'NAVADA/WorldView', name: 'AlertsResponseMs', label: 'Alerts' },
      { namespace: 'NAVADA/WorldView', name: 'InsightsResponseMs', label: 'Insights' },
    ]),
    metricWidget(12, 9, 12, 6, 'Data', [
      { namespace: 'NAVADA/WorldView', name: 'AlertCount', label: 'Active Alerts', stat: 'Maximum' },
      { namespace: 'NAVADA/WorldView', name: 'FeedSourceCount', label: 'Feed Sources', stat: 'Maximum' },
    ]),
    metricWidget(0, 15, 12, 6, 'API Health Over Time', [
      { namespace: 'NAVADA/WorldView', name: 'SiteUp', label: 'Site' },
      { namespace: 'NAVADA/WorldView', name: 'AlertsApiUp', label: 'Alerts' },
      { namespace: 'NAVADA/WorldView', name: 'InsightsApiUp', label: 'Insights' },
      { namespace: 'NAVADA/WorldView', name: 'AnalyticsApiUp', label: 'Analytics' },
    ]),
    metricWidget(12, 15, 12, 6, 'EC2 Host (WorldMonitor)', [
      { namespace: 'AWS/EC2', name: 'CPUUtilization', dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }], label: 'EC2 CPU %' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// 11. BK-UP-ULTRA
function buildBKUP(data) {
  const ts = data.timestamp;

  let md = `# NAVADA Backup, Storage & Failover\n`;
  md += `**Data persistence layer** | All NAVADA data storage, backup strategies, and disaster recovery\n`;
  md += `**Updated**: ${ts}\n\n`;
  md += `| Storage | Type | Contents |\n|---------|------|----------|\n`;
  md += `| Cloudflare R2 | Object Storage | navada-assets bucket (zero egress). Media, uploads, NotebookLM, edge versions |\n`;
  md += `| DynamoDB | NoSQL DB | navada-faces, navada-vision-log, navada-edge-logs (PAY_PER_REQUEST, 30-day TTL) |\n`;
  md += `| S3 | Object Storage | navada-vision-eu-west-2 (Vision API images) |\n`;
  md += `| PostgreSQL | Relational DB | navada_pipeline on HP:5433 (leads, prospects, heartbeats) |\n\n`;
  md += `**Telegram Bot**: Cloudflare Worker (navada-edge-api) on global edge, 24/7, zero cost\n`;
  md += `**Failover**: Cloudflare Edge API down 15 min -> EC2 activates standby bot\n`;

  const widgets = [
    textWidget(0, 0, 24, 3, md),
    metricWidget(0, 3, 8, 6, 'R2 Objects', [
      { namespace: 'NAVADA/Cloudflare', name: 'R2ObjectCount', label: 'Objects', stat: 'Maximum' },
    ], { view: 'singleValue' }),
    metricWidget(8, 3, 8, 6, 'DNS Records', [
      { namespace: 'NAVADA/Cloudflare', name: 'DNSRecordCount', label: 'Records', stat: 'Maximum' },
    ], { view: 'singleValue' }),
    metricWidget(16, 3, 8, 6, 'Tailscale Mesh', [
      { namespace: 'NAVADA/Tailscale', name: 'ConnectedNodes', label: 'Connected Nodes' },
    ], { view: 'singleValue' }),
    metricWidget(0, 9, 8, 6, 'DynamoDB Reads', [
      { namespace: 'AWS/DynamoDB', name: 'ConsumedReadCapacityUnits', dimensions: [{ Name: 'TableName', Value: 'navada-faces' }], stat: 'Sum', label: 'faces' },
      { namespace: 'AWS/DynamoDB', name: 'ConsumedReadCapacityUnits', dimensions: [{ Name: 'TableName', Value: 'navada-vision-log' }], stat: 'Sum', label: 'vision-log' },
      { namespace: 'AWS/DynamoDB', name: 'ConsumedReadCapacityUnits', dimensions: [{ Name: 'TableName', Value: 'navada-edge-logs' }], stat: 'Sum', label: 'edge-logs' },
    ], { period: 300 }),
    metricWidget(8, 9, 8, 6, 'DynamoDB Writes', [
      { namespace: 'AWS/DynamoDB', name: 'ConsumedWriteCapacityUnits', dimensions: [{ Name: 'TableName', Value: 'navada-faces' }], stat: 'Sum', label: 'faces' },
      { namespace: 'AWS/DynamoDB', name: 'ConsumedWriteCapacityUnits', dimensions: [{ Name: 'TableName', Value: 'navada-vision-log' }], stat: 'Sum', label: 'vision-log' },
      { namespace: 'AWS/DynamoDB', name: 'ConsumedWriteCapacityUnits', dimensions: [{ Name: 'TableName', Value: 'navada-edge-logs' }], stat: 'Sum', label: 'edge-logs' },
    ], { period: 300 }),
    metricWidget(16, 9, 8, 6, 'S3 Storage', [
      { namespace: 'AWS/S3', name: 'NumberOfObjects', dimensions: [{ Name: 'BucketName', Value: 'navada-vision-eu-west-2' }, { Name: 'StorageType', Value: 'AllStorageTypes' }], stat: 'Maximum', label: 'Objects' },
      { namespace: 'AWS/S3', name: 'BucketSizeBytes', dimensions: [{ Name: 'BucketName', Value: 'navada-vision-eu-west-2' }, { Name: 'StorageType', Value: 'StandardStorage' }], stat: 'Maximum', label: 'Size (bytes)' },
    ], { view: 'singleValue', period: 86400 }),
    metricWidget(0, 15, 12, 6, 'Edge Network Health', [
      { namespace: 'NAVADA/Cloudflare', name: 'SubdomainsUp', label: 'CF Subdomains Up' },
      { namespace: 'NAVADA/Cloudflare', name: 'TunnelStatus', label: 'CF Tunnel' },
      { namespace: 'NAVADA/Tailscale', name: 'ConnectedNodes', label: 'Mesh Nodes' },
    ]),
    metricWidget(12, 15, 12, 6, 'Node Connectivity', [
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'HP' }], label: 'HP' },
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'Oracle' }], label: 'Oracle' },
      { namespace: 'NAVADA/Tailscale', name: 'NodeOnline', dimensions: [{ Name: 'Node', Value: 'EC2' }], label: 'EC2' },
    ]),
  ];

  return JSON.stringify({ widgets });
}

// ---------------------------------------------------------------------------
// Dashboard Pusher
// ---------------------------------------------------------------------------
const DASHBOARD_BUILDERS = {
  'NAVADA-Edge-Network': buildEdgeNetwork,
  'NAVADA-HP': buildHP,
  'NAVADA-Oracle': buildOracle,
  'NAVADA-EC2-Operations': buildEC2,
  'NAVADA-PM2-Processes': buildPM2,
  'NAVADA-Cloudflare': buildCloudflare,
  'NAVADA-Tailscale': buildTailscale,
  'NAVADA-NodeJS': buildNodeJS,
  'NAVADA-ASUS': buildASUS,
  'NAVADA-World-View': buildWorldView,
  'NAVADA-BK-UP-ULTRA': buildBKUP,
};

async function pushDashboard(name, body) {
  try {
    await CW.send(new PutDashboardCommand({
      DashboardName: name,
      DashboardBody: body,
    }));
    log(`  OK ${name}`);
    return true;
  } catch (e) {
    log(`  FAIL ${name}: ${e.message}`);
    return false;
  }
}

async function pushAllDashboards(data) {
  log('Pushing 11 dashboards to CloudWatch...');
  let success = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    Object.entries(DASHBOARD_BUILDERS).map(async ([name, builder]) => {
      try {
        const body = builder(data);
        return await pushDashboard(name, body);
      } catch (e) {
        log(`  FAIL ${name} (build): ${e.message}`);
        return false;
      }
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) success++;
    else failed++;
  }

  log(`Dashboard update complete: ${success} success, ${failed} failed`);
  return { success, failed };
}

// ---------------------------------------------------------------------------
// Main Loop
// ---------------------------------------------------------------------------
let running = false;

async function update() {
  if (running) {
    log('Previous update still running, skipping');
    return;
  }
  running = true;
  const start = Date.now();

  try {
    log('=== Starting dashboard update cycle ===');
    const data = await collectAll();
    log(`Data collection took ${((Date.now() - start) / 1000).toFixed(1)}s`);

    // Push metric data to CloudWatch (NAVADA/HP, NAVADA/Tailscale, NAVADA/Cloudflare, NAVADA/NodeJS)
    await pushMetrics(data);

    const { success, failed } = await pushAllDashboards(data);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log(`=== Cycle complete in ${elapsed}s (${success}/${success + failed} dashboards) ===`);
  } catch (e) {
    log(`FATAL ERROR in update cycle: ${e.message}`);
    console.error(e);
  } finally {
    running = false;
  }
}

// Start
log('CloudWatch Dashboard Updater starting...');
log(`Region: ${REGION} | Interval: ${INTERVAL / 1000}s | Dashboards: ${Object.keys(DASHBOARD_BUILDERS).length}`);

// Run immediately, then every 5 minutes
update();
setInterval(update, INTERVAL);

// Keep alive
process.on('uncaughtException', e => { log(`Uncaught exception: ${e.message}`); console.error(e); });
process.on('unhandledRejection', e => { log(`Unhandled rejection: ${e}`); });
