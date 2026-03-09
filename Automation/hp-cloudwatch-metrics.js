#!/usr/bin/env node
/**
 * HP Server CloudWatch Metrics Collector
 * Runs on HP, collects PM2 + system metrics every 60s,
 * pushes to AWS CloudWatch under NAVADA/HP namespace.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const net = require('net');
const execAsync = promisify(exec);
const logger = require('./edge-logger');

const NAMESPACE = 'NAVADA/HP';
const REGION = 'eu-west-2';
const INTERVAL = 60_000;
const BASH = 'C:/Program Files/Git/bin/bash.exe';

let collecting = false;

async function run(cmd, timeoutMs = 15000, shell = BASH) {
  return execAsync(cmd, { timeout: timeoutMs, encoding: 'utf8', shell, windowsHide: true });
}

const path = require('path');
const PS_SCRIPT = path.join(__dirname, 'get-system-metrics.ps1');

async function pushMetric(name, value, dimensions) {
  try {
    const unit = name.includes('MB') || name.includes('GB') ? 'Megabytes'
      : name.includes('Percent') || name.includes('CPU') ? 'Percent'
      : name.includes('Seconds') || name.includes('Uptime') ? 'Seconds' : 'Count';
    let cmd = `aws cloudwatch put-metric-data --namespace "${NAMESPACE}" --metric-name "${name}" --value ${value} --unit ${unit} --region ${REGION}`;
    if (dimensions) cmd += ` --dimensions "${dimensions}"`;
    await run(cmd, 10000);
  } catch { /* skip */ }
}

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(3000);
    sock.on('connect', () => { sock.destroy(); resolve(1); });
    sock.on('error', () => { sock.destroy(); resolve(0); });
    sock.on('timeout', () => { sock.destroy(); resolve(0); });
    sock.connect(port, host);
  });
}

async function collectAndPush() {
  if (collecting) return;
  collecting = true;
  const ts = new Date().toISOString();
  const pushes = [];

  try {
    // --- PM2 Metrics ---
    let pm2Data = [];
    try {
      const { stdout } = await run('pm2 jlist', 10000);
      pm2Data = JSON.parse(stdout);
    } catch { /* pm2 not responding */ }

    let totalProcs = 0, onlineProcs = 0, totalMemMB = 0;
    for (const p of pm2Data) {
      const name = p.name;
      const status = p.pm2_env?.status === 'online' ? 1 : 0;
      const memMB = Math.round((p.monit?.memory || 0) / 1024 / 1024 * 10) / 10;
      const cpu = p.monit?.cpu || 0;
      const restarts = p.pm2_env?.restart_time || 0;
      const uptime = p.pm2_env?.pm_uptime ? Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000) : 0;

      const dim = `Name=Process,Value=${name}`;
      pushes.push(pushMetric('ProcessStatus', status, dim));
      pushes.push(pushMetric('ProcessMemoryMB', memMB, dim));
      pushes.push(pushMetric('ProcessCPU', cpu, dim));
      pushes.push(pushMetric('ProcessRestarts', restarts, dim));
      pushes.push(pushMetric('ProcessUptime', uptime, dim));

      totalProcs++;
      if (status) onlineProcs++;
      totalMemMB += memMB;
    }

    pushes.push(pushMetric('TotalProcesses', totalProcs, ''));
    pushes.push(pushMetric('OnlineProcesses', onlineProcs, ''));
    pushes.push(pushMetric('TotalMemoryMB', Math.round(totalMemMB * 10) / 10, ''));

    // --- System Metrics (native Node.js, no PowerShell) ---
    let sysCpu = 0, sysMem = 0, diskPct = 0, diskFreeGB = 0;

    try {
      // CPU usage: sample over 1 second
      const cpus1 = os.cpus();
      await new Promise(r => setTimeout(r, 1000));
      const cpus2 = os.cpus();
      let idleDelta = 0, totalDelta = 0;
      for (let i = 0; i < cpus2.length; i++) {
        const t1 = cpus1[i].times, t2 = cpus2[i].times;
        idleDelta += (t2.idle - t1.idle);
        totalDelta += (t2.user - t1.user) + (t2.nice - t1.nice) + (t2.sys - t1.sys) + (t2.irq - t1.irq) + (t2.idle - t1.idle);
      }
      sysCpu = Math.round((1 - idleDelta / totalDelta) * 1000) / 10;

      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      sysMem = Math.round((totalMem - freeMem) / totalMem * 1000) / 10;

      // Disk usage via wmic (windowsHide)
      try {
        const { stdout: diskOut } = await run('wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace,Size /format:csv', 10000);
        const lines = diskOut.trim().split('\n').filter(l => l.includes(','));
        if (lines.length > 0) {
          const parts = lines[lines.length - 1].split(',');
          const freeSpace = parseInt(parts[1]) || 0;
          const size = parseInt(parts[2]) || 0;
          if (size > 0) {
            diskPct = Math.round((size - freeSpace) / size * 1000) / 10;
            diskFreeGB = Math.round(freeSpace / 1073741824 * 10) / 10;
          }
        }
      } catch {}
    } catch (e) {
      console.error(`[${ts}] System metrics error: ${e.message?.substring(0, 80)}`);
    }

    pushes.push(pushMetric('SystemCPU', sysCpu, ''));
    pushes.push(pushMetric('SystemMemoryPercent', sysMem, ''));
    pushes.push(pushMetric('DiskUsedPercent', diskPct, ''));
    pushes.push(pushMetric('DiskFreeGB', diskFreeGB, ''));

    // --- Node.js Runtime Metrics (push to NAVADA/NodeJS namespace) ---
    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10;
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024 * 10) / 10;
    const rssMB = Math.round(mem.rss / 1024 / 1024 * 10) / 10;
    const externalMB = Math.round(mem.external / 1024 / 1024 * 10) / 10;

    // Event loop lag measurement
    const lagStart = Date.now();
    await new Promise(r => setImmediate(r));
    const eventLoopLag = Date.now() - lagStart;

    const njsDim = 'Name=Node,Value=HP';
    const njsNs = 'NAVADA/NodeJS';
    for (const [mName, mVal, mUnit] of [
      ['HeapUsedMB', heapUsedMB, 'Megabytes'],
      ['HeapTotalMB', heapTotalMB, 'Megabytes'],
      ['RssMB', rssMB, 'Megabytes'],
      ['ExternalMB', externalMB, 'Megabytes'],
      ['EventLoopLag', eventLoopLag, 'Milliseconds'],
      ['PM2TotalHeapMB', totalMemMB, 'Megabytes'],
      ['PM2ProcessCount', totalProcs, 'Count'],
    ]) {
      pushes.push((async () => {
        try {
          await run(`aws cloudwatch put-metric-data --namespace "${njsNs}" --metric-name "${mName}" --value ${mVal} --unit ${mUnit} --dimensions "${njsDim}" --region ${REGION}`, 10000);
        } catch {}
      })());
    }

    // --- Port Health Checks ---
    const [botUp, flixUp] = await Promise.all([
      checkPort(3456), checkPort(4000)
    ]);
    pushes.push(pushMetric('TelegramBotUp', botUp, ''));
    pushes.push(pushMetric('NavadaFlixUp', flixUp, ''));

    // --- Tailscale Node Checks (push to NAVADA/Tailscale) ---
    const tsNodes = [
      { name: 'HP', ip: '100.121.187.67' },
      { name: 'Oracle', ip: '100.77.206.9' },
      { name: 'EC2', ip: '100.98.118.33' },
      { name: 'ASUS', ip: '100.88.118.128' },
    ];
    let connectedNodes = 0;
    for (const node of tsNodes) {
      const up = await checkPort(22, node.ip).catch(() => 0);
      // Fallback: try ping if port 22 fails
      let online = up;
      if (!online) {
        try {
          await run(`ping -n 1 -w 3000 ${node.ip}`, 5000, undefined);
          online = 1;
        } catch { online = 0; }
      }
      if (online) connectedNodes++;
      pushes.push((async () => {
        try {
          await run(`aws cloudwatch put-metric-data --namespace "NAVADA/Tailscale" --metric-name "NodeOnline" --value ${online} --unit Count --dimensions "Name=Node,Value=${node.name}" --region ${REGION}`, 10000);
        } catch {}
      })());
    }
    pushes.push((async () => {
      try {
        await run(`aws cloudwatch put-metric-data --namespace "NAVADA/Tailscale" --metric-name "ConnectedNodes" --value ${connectedNodes} --unit Count --region ${REGION}`, 10000);
      } catch {}
    })());

    await Promise.allSettled(pushes);

    // --- Log to DynamoDB ---
    logger.log({
      node: 'HP', eventType: 'metric', service: 'hp-cloudwatch-metrics', level: 'info',
      message: `HP: ${onlineProcs}/${totalProcs} procs, CPU ${sysCpu}%, Mem ${sysMem}%, Disk ${diskPct}%`,
      metadata: { onlineProcs, totalProcs, sysCpu, sysMem, diskPct, diskFreeGB, botUp, flixUp }
    }).catch(() => {});

    console.log(`[${ts}] HP: ${onlineProcs}/${totalProcs} procs, CPU ${sysCpu}%, Mem ${sysMem}%, Disk ${diskPct}% (${diskFreeGB}GB free)`);
  } catch (err) {
    logger.log({ node: 'HP', eventType: 'error', service: 'hp-cloudwatch-metrics', level: 'error', message: err.message?.substring(0, 200) }).catch(() => {});
    console.error(`[${ts}] Error: ${err.message?.substring(0, 100)}`);
  } finally {
    collecting = false;
  }
}

console.log(`[${new Date().toISOString()}] HP CloudWatch Metrics collector started (every ${INTERVAL / 1000}s)`);
collectAndPush();
setInterval(collectAndPush, INTERVAL);
