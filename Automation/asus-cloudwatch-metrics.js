#!/usr/bin/env node
/**
 * ASUS Dev Workstation CloudWatch Metrics Collector
 * Runs on ASUS (NAVADA2025), collects system + service metrics every 60s,
 * pushes to AWS CloudWatch under NAVADA/ASUS namespace.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const net = require('net');
const os = require('os');
const execAsync = promisify(exec);

const NAMESPACE = 'NAVADA/ASUS';
const REGION = 'eu-west-2';
const INTERVAL = 60_000;
const BASH = 'C:/Program Files/Git/bin/bash.exe';

let collecting = false;

async function run(cmd, timeoutMs = 15000, shell = BASH) {
  return execAsync(cmd, { timeout: timeoutMs, encoding: 'utf8', shell, windowsHide: true });
}

const path = require('path');
const PS_SCRIPT = path.join(__dirname, 'get-system-metrics.ps1');

async function pushMetric(name, value) {
  try {
    const unit = name.includes('MB') || name.includes('GB') ? 'Megabytes'
      : name.includes('Percent') || name.includes('CPU') ? 'Percent'
      : name.includes('Hours') ? 'Seconds'
      : name.includes('KBs') ? 'Kilobytes/Second' : 'Count';
    const cmd = `aws cloudwatch put-metric-data --namespace "${NAMESPACE}" --metric-name "${name}" --value ${value} --unit ${unit} --region ${REGION}`;
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
    // --- System Metrics (PowerShell) ---
    let sysCpu = 0, sysMem = 0, diskPct = 0, diskFreeGB = 0;
    try {
      const { stdout } = await execAsync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${PS_SCRIPT}"`,
        { timeout: 20000, encoding: 'utf8', windowsHide: true }
      );
      const parts = stdout.trim().split('|');
      sysCpu = parseFloat(parts[0]) || 0;
      sysMem = parseFloat(parts[1]) || 0;
      diskPct = parseFloat(parts[2]) || 0;
      diskFreeGB = parseFloat(parts[3]) || 0;
    } catch (e) {
      console.error(`[${ts}] System metrics error: ${e.message?.substring(0, 80)}`);
    }

    pushes.push(pushMetric('SystemCPU', sysCpu));
    pushes.push(pushMetric('SystemMemoryPercent', sysMem));
    pushes.push(pushMetric('DiskUsedPercent', diskPct));
    pushes.push(pushMetric('DiskFreeGB', diskFreeGB));

    // --- Memory in GB ---
    const totalMemGB = os.totalmem() / 1024 / 1024 / 1024;
    const usedMemGB = Math.round((totalMemGB * sysMem / 100) * 10) / 10;
    pushes.push(pushMetric('MemoryUsedGB', usedMemGB));

    // --- Uptime ---
    const uptimeHours = Math.round(os.uptime() / 3600 * 10) / 10;
    pushes.push(pushMetric('UptimeHours', uptimeHours));

    // --- Process count ---
    try {
      const { stdout } = await execAsync(
        'powershell.exe -NoProfile -Command "(Get-Process).Count"',
        { timeout: 10000, encoding: 'utf8', windowsHide: true }
      );
      pushes.push(pushMetric('ProcessCount', parseInt(stdout.trim()) || 0));
    } catch {}

    // --- Battery ---
    try {
      const { stdout } = await execAsync(
        'powershell.exe -NoProfile -Command "$b = Get-CimInstance Win32_Battery; Write-Output \\"$($b.EstimatedChargeRemaining)|$($b.BatteryStatus)\\""',
        { timeout: 10000, encoding: 'utf8', windowsHide: true }
      );
      const [pct, status] = stdout.trim().split('|');
      pushes.push(pushMetric('BatteryPercent', parseInt(pct) || 0));
      // BatteryStatus: 2 = AC/charging, 1 = discharging
      pushes.push(pushMetric('BatteryCharging', status === '2' ? 1 : 0));
    } catch {}

    // --- Network traffic (KB/s snapshot) ---
    try {
      const { stdout } = await execAsync(
        'powershell.exe -NoProfile -Command "$a = Get-NetAdapterStatistics -Name Wi-Fi -ErrorAction SilentlyContinue; if($a){Write-Output \\"$($a.SentBytes)|$($a.ReceivedBytes)\\"}"',
        { timeout: 10000, encoding: 'utf8', windowsHide: true }
      );
      if (stdout.trim()) {
        const [tx, rx] = stdout.trim().split('|').map(Number);
        // Store raw bytes, CloudWatch will show rate via period math
        if (!isNaN(tx)) pushes.push(pushMetric('NetworkTxKBs', Math.round(tx / 1024)));
        if (!isNaN(rx)) pushes.push(pushMetric('NetworkRxKBs', Math.round(rx / 1024)));
      }
    } catch {}

    // --- Service Health: PostgreSQL (5432 or 5433), Ollama (11434), Docker ---
    const [pgUp, ollamaUp] = await Promise.all([
      checkPort(5432).then(async r => r || await checkPort(5433)),
      checkPort(11434),
    ]);
    pushes.push(pushMetric('PostgreSQLUp', pgUp));
    pushes.push(pushMetric('OllamaUp', ollamaUp));

    // Docker check
    let dockerUp = 0;
    try {
      await execAsync('docker info', { timeout: 5000, windowsHide: true });
      dockerUp = 1;
    } catch {}
    pushes.push(pushMetric('DockerUp', dockerUp));

    // --- PM2 ---
    let pm2Total = 0, pm2Online = 0;
    try {
      const { stdout } = await run('pm2 jlist', 10000);
      const procs = JSON.parse(stdout);
      pm2Total = procs.length;
      pm2Online = procs.filter(p => p.pm2_env?.status === 'online').length;
    } catch {}
    pushes.push(pushMetric('PM2Total', pm2Total));
    pushes.push(pushMetric('PM2Online', pm2Online));

    // --- Tailscale peers ---
    try {
      const { stdout } = await run('tailscale status --json', 10000);
      const tsData = JSON.parse(stdout);
      const peers = Object.values(tsData.Peer || {}).filter(p => p.Online).length;
      pushes.push(pushMetric('TailscalePeers', peers));
    } catch {}

    // --- Heartbeat ---
    pushes.push(pushMetric('Heartbeat', 1));

    await Promise.allSettled(pushes);

    console.log(`[${ts}] ASUS: CPU ${sysCpu}%, Mem ${sysMem}%, Disk ${diskPct}% (${diskFreeGB}GB free), Uptime ${uptimeHours}h`);
  } catch (err) {
    console.error(`[${ts}] Error: ${err.message?.substring(0, 100)}`);
  } finally {
    collecting = false;
  }
}

console.log(`[${new Date().toISOString()}] ASUS CloudWatch Metrics collector started (every ${INTERVAL / 1000}s)`);
collectAndPush();
setInterval(collectAndPush, INTERVAL);
