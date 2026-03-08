#!/usr/bin/env node
/**
 * HP Server CloudWatch Metrics Collector
 * Runs on HP, collects PM2 + system metrics every 60s,
 * pushes to AWS CloudWatch under NAVADA/HP namespace.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
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

function checkPort(port) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(3000);
    sock.on('connect', () => { sock.destroy(); resolve(1); });
    sock.on('error', () => { sock.destroy(); resolve(0); });
    sock.on('timeout', () => { sock.destroy(); resolve(0); });
    sock.connect(port, '127.0.0.1');
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

    // --- System Metrics ---
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

    pushes.push(pushMetric('SystemCPU', sysCpu, ''));
    pushes.push(pushMetric('SystemMemoryPercent', sysMem, ''));
    pushes.push(pushMetric('DiskUsedPercent', diskPct, ''));
    pushes.push(pushMetric('DiskFreeGB', diskFreeGB, ''));

    // --- Port Health Checks ---
    const [botUp, tradingUp, wmUp] = await Promise.all([
      checkPort(3456), checkPort(5678), checkPort(4173)
    ]);
    pushes.push(pushMetric('TelegramBotUp', botUp, ''));
    pushes.push(pushMetric('TradingAPIUp', tradingUp, ''));
    pushes.push(pushMetric('WorldMonitorUp', wmUp, ''));

    await Promise.allSettled(pushes);

    // --- Log to DynamoDB ---
    logger.log({
      node: 'HP', eventType: 'metric', service: 'hp-cloudwatch-metrics', level: 'info',
      message: `HP: ${onlineProcs}/${totalProcs} procs, CPU ${sysCpu}%, Mem ${sysMem}%, Disk ${diskPct}%`,
      metadata: { onlineProcs, totalProcs, sysCpu, sysMem, diskPct, diskFreeGB, botUp, tradingUp, wmUp }
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
