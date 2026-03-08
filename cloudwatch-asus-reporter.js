#!/usr/bin/env node

/**
 * NAVADA ASUS CloudWatch Reporter
 * Pushes live system metrics from this ASUS laptop to AWS CloudWatch
 * namespace: NAVADA/ASUS — feeds the NAVADA-ASUS dashboard
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const NAMESPACE = 'NAVADA/ASUS';
const REGION = 'eu-west-2';
const INTERVAL_MS = 60_000; // 60 seconds

// Common execSync options — windowsHide prevents terminal flicker
const EXEC_OPTS = { encoding: 'utf-8', timeout: 10000, stdio: 'pipe', windowsHide: true };
const EXEC_OPTS_LONG = { ...EXEC_OPTS, timeout: 30000 };

// ── CPU tracking (need two samples to compute delta) ──
let prevCpuTimes = null;

function getCpuPercent() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) total += cpu.times[type];
    idle += cpu.times.idle;
  }
  if (!prevCpuTimes) {
    prevCpuTimes = { idle, total };
    return null;
  }
  const dIdle = idle - prevCpuTimes.idle;
  const dTotal = total - prevCpuTimes.total;
  prevCpuTimes = { idle, total };
  if (dTotal === 0) return 0;
  return Math.round((1 - dIdle / dTotal) * 100);
}

// ── Memory ──
function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    percent: Math.round((used / total) * 100),
    usedGB: Math.round((used / 1073741824) * 10) / 10,
    totalGB: Math.round((total / 1073741824) * 10) / 10,
  };
}

// ── Disk (C: drive) ──
function getDiskInfo() {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "(Get-PSDrive C).Free, (Get-PSDrive C).Used"',
      EXEC_OPTS
    ).trim().split(/\r?\n/);
    const freeBytes = parseInt(raw[0], 10);
    const usedBytes = parseInt(raw[1], 10);
    const totalBytes = freeBytes + usedBytes;
    return {
      freeGB: Math.round((freeBytes / 1073741824) * 10) / 10,
      totalGB: Math.round((totalBytes / 1073741824) * 10) / 10,
      usedPercent: Math.round((usedBytes / totalBytes) * 100),
    };
  } catch {
    return { freeGB: 0, totalGB: 0, usedPercent: 0 };
  }
}

// ── Battery ──
function getBatteryInfo() {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "$b = Get-CimInstance Win32_Battery; \\"$($b.EstimatedChargeRemaining),$($b.BatteryStatus)\\""',
      EXEC_OPTS
    ).trim();
    const [pct, status] = raw.split(',');
    // BatteryStatus: 1=discharging, 2=AC/charging, 3+=charging
    return {
      percent: parseInt(pct, 10) || 0,
      charging: parseInt(status, 10) >= 2 ? 1 : 0,
    };
  } catch {
    return { percent: 0, charging: 0 };
  }
}

// ── Network throughput (bytes delta over interval) ──
let prevNetBytes = null;

function getNetworkThroughput() {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "$n = Get-NetAdapterStatistics | Where-Object { $_.ReceivedBytes -gt 0 } | Measure-Object -Property ReceivedBytes,SentBytes -Sum; \\"$($n[0].Sum),$($n[1].Sum)\\""',
      EXEC_OPTS
    ).trim();
    const [rx, tx] = raw.split(',').map(Number);
    if (!prevNetBytes) {
      prevNetBytes = { rx, tx };
      return null;
    }
    const dRx = Math.max(0, rx - prevNetBytes.rx);
    const dTx = Math.max(0, tx - prevNetBytes.tx);
    prevNetBytes = { rx, tx };
    // Convert to KB/s (delta over INTERVAL_MS)
    const secs = INTERVAL_MS / 1000;
    return {
      rxKBs: Math.round((dRx / 1024 / secs) * 10) / 10,
      txKBs: Math.round((dTx / 1024 / secs) * 10) / 10,
    };
  } catch {
    return null;
  }
}

// ── Process count ──
function getProcessCount() {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "(Get-Process).Count"',
      EXEC_OPTS
    ).trim();
    return parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

// ── Uptime ──
function getUptimeHours() {
  return Math.round((os.uptime() / 3600) * 10) / 10;
}

// ── PM2 process count ──
function getPm2Count() {
  try {
    const raw = execSync('pm2 jlist', { ...EXEC_OPTS, timeout: 8000 });
    const list = JSON.parse(raw);
    const online = list.filter(p => p.pm2_env && p.pm2_env.status === 'online').length;
    return { total: list.length, online };
  } catch {
    return { total: 0, online: 0 };
  }
}

// ── Service checks ──
function isOllamaUp() {
  try {
    execSync('powershell -NoProfile -Command "(Invoke-WebRequest -Uri http://localhost:11434 -TimeoutSec 2 -UseBasicParsing).StatusCode"', EXEC_OPTS);
    return 1;
  } catch {
    return 0;
  }
}

function isPostgresUp() {
  try {
    execSync('powershell -NoProfile -Command "Get-Process postgres -ErrorAction Stop | Out-Null"', EXEC_OPTS);
    return 1;
  } catch {
    return 0;
  }
}

function isDockerUp() {
  try {
    execSync('docker info', { ...EXEC_OPTS, timeout: 10000 });
    return 1;
  } catch {
    return 0;
  }
}

// ── Tailscale peer count ──
function getTailscalePeers() {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "& \'C:\\Program Files\\Tailscale\\tailscale.exe\' status --json"',
      EXEC_OPTS
    );
    const data = JSON.parse(raw);
    const peers = Object.values(data.Peer || {});
    const online = peers.filter(p => p.Online).length;
    return online;
  } catch {
    return 0;
  }
}

// ── Push to CloudWatch ──
const METRIC_TMP = path.join(os.tmpdir(), 'navada-asus-metrics.json');

function putMetrics(metricData) {
  try {
    fs.writeFileSync(METRIC_TMP, JSON.stringify(metricData));
    execSync(
      `aws cloudwatch put-metric-data --namespace "${NAMESPACE}" --region ${REGION} --metric-data file://${METRIC_TMP.replace(/\\/g, '/')}`,
      EXEC_OPTS_LONG
    );
    return true;
  } catch (e) {
    console.error(`[${ts()}] CloudWatch push failed:`, e.stderr || e.message);
    return false;
  }
}

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ── Main collection loop ──
function collect() {
  const cpu = getCpuPercent();
  const mem = getMemoryInfo();
  const disk = getDiskInfo();
  const battery = getBatteryInfo();
  const net = getNetworkThroughput();
  const procCount = getProcessCount();
  const uptimeH = getUptimeHours();
  const pm2 = getPm2Count();
  const ollama = isOllamaUp();
  const postgres = isPostgresUp();
  const docker = isDockerUp();
  const tailscalePeers = getTailscalePeers();

  const now = new Date().toISOString();

  const metricData = [
    { MetricName: 'Heartbeat', Value: 1, Unit: 'None', Timestamp: now },
    { MetricName: 'SystemMemoryPercent', Value: mem.percent, Unit: 'Percent', Timestamp: now },
    { MetricName: 'MemoryUsedGB', Value: mem.usedGB, Unit: 'Gigabytes', Timestamp: now },
    { MetricName: 'DiskUsedPercent', Value: disk.usedPercent, Unit: 'Percent', Timestamp: now },
    { MetricName: 'DiskFreeGB', Value: disk.freeGB, Unit: 'Gigabytes', Timestamp: now },
    { MetricName: 'BatteryPercent', Value: battery.percent, Unit: 'Percent', Timestamp: now },
    { MetricName: 'BatteryCharging', Value: battery.charging, Unit: 'None', Timestamp: now },
    { MetricName: 'ProcessCount', Value: procCount, Unit: 'Count', Timestamp: now },
    { MetricName: 'UptimeHours', Value: uptimeH, Unit: 'None', Timestamp: now },
    { MetricName: 'PM2Online', Value: pm2.online, Unit: 'Count', Timestamp: now },
    { MetricName: 'PM2Total', Value: pm2.total, Unit: 'Count', Timestamp: now },
    { MetricName: 'OllamaUp', Value: ollama, Unit: 'None', Timestamp: now },
    { MetricName: 'PostgreSQLUp', Value: postgres, Unit: 'None', Timestamp: now },
    { MetricName: 'DockerUp', Value: docker, Unit: 'None', Timestamp: now },
    { MetricName: 'TailscalePeers', Value: tailscalePeers, Unit: 'Count', Timestamp: now },
  ];

  if (cpu !== null) {
    metricData.push({ MetricName: 'SystemCPU', Value: cpu, Unit: 'Percent', Timestamp: now });
  }
  if (net) {
    metricData.push({ MetricName: 'NetworkRxKBs', Value: net.rxKBs, Unit: 'Kilobytes/Second', Timestamp: now });
    metricData.push({ MetricName: 'NetworkTxKBs', Value: net.txKBs, Unit: 'Kilobytes/Second', Timestamp: now });
  }

  // CloudWatch allows max 25 metrics per put call — we're under that
  const ok = putMetrics(metricData);
  const cpuStr = cpu !== null ? `${cpu}%` : 'sampling...';
  const netStr = net ? `Rx=${net.rxKBs}KB/s Tx=${net.txKBs}KB/s` : 'sampling...';
  console.log(
    `[${ts()}] ${ok ? '✓' : '✗'} CPU=${cpuStr} Mem=${mem.percent}% Disk=${disk.freeGB}GB free ` +
    `Bat=${battery.percent}% Net=${netStr} Procs=${procCount} PM2=${pm2.online}/${pm2.total} ` +
    `TS-peers=${tailscalePeers} Uptime=${uptimeH}h`
  );
}

// ── Start ──
console.log(`[${ts()}] NAVADA ASUS CloudWatch Reporter starting`);
console.log(`[${ts()}] Namespace: ${NAMESPACE} | Region: ${REGION} | Interval: ${INTERVAL_MS / 1000}s`);

collect();
setInterval(collect, INTERVAL_MS);

process.on('SIGINT', () => {
  console.log(`\n[${ts()}] Shutting down.`);
  process.exit(0);
});
