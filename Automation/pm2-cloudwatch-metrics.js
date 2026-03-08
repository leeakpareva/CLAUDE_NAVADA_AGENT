#!/usr/bin/env node
/**
 * PM2 CloudWatch Metrics Collector (AWS SDK)
 *
 * Collects PM2 process metrics every 60s and pushes to CloudWatch
 * using a single batched putMetricData call via @aws-sdk/client-cloudwatch.
 *
 * NO CLI spawning. NO individual put-metric-data calls.
 * All metrics batched into one API call (max 1000 per call).
 *
 * Metrics per process:
 *   - PM2/CPU         (Percent)
 *   - PM2/MemoryMB    (Megabytes)
 *   - PM2/Status      (1=online, 0=stopped, -1=errored)
 *   - PM2/Restarts    (Count)
 *   - PM2/UptimeHours (Count)
 *
 * Aggregate metrics:
 *   - PM2/TotalCPU       (Percent)
 *   - PM2/TotalMemoryMB  (Megabytes)
 *   - PM2/OnlineCount    (Count)
 *   - PM2/TotalProcesses (Count)
 *
 * Run: node pm2-cloudwatch-metrics.js
 * PM2: pm2 start pm2-cloudwatch-metrics.js --name pm2-cw-metrics
 */

const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// --- Config ---
const NAMESPACE = 'NAVADA/PM2';
const REGION = 'eu-west-2';
const INTERVAL_MS = 60_000;
const BASH = 'C:/Program Files/Git/bin/bash.exe';

const cw = new CloudWatchClient({ region: REGION });

let collecting = false;

// Status mapping
function statusValue(status) {
  if (status === 'online') return 1;
  if (status === 'errored') return -1;
  return 0; // stopped, launching, etc.
}

async function getPM2Processes() {
  try {
    const { stdout } = await execAsync('pm2 jlist', {
      timeout: 15_000,
      encoding: 'utf8',
      shell: BASH,
      windowsHide: true,
    });
    return JSON.parse(stdout);
  } catch (err) {
    console.error(`[${ts()}] PM2 jlist failed: ${err.message?.substring(0, 100)}`);
    return [];
  }
}

function ts() {
  return new Date().toISOString();
}

function makeMetric(name, value, unit, dimensions = []) {
  return {
    MetricName: name,
    Value: value,
    Unit: unit,
    Timestamp: new Date(),
    Dimensions: dimensions,
  };
}

async function collectAndPush() {
  if (collecting) return;
  collecting = true;

  try {
    const processes = await getPM2Processes();
    if (processes.length === 0) {
      console.log(`[${ts()}] No PM2 processes found, skipping`);
      return;
    }

    const metrics = [];
    let totalCPU = 0;
    let totalMemMB = 0;
    let onlineCount = 0;

    for (const p of processes) {
      const name = p.name;
      const dims = [{ Name: 'Process', Value: name }];

      const cpu = p.monit?.cpu || 0;
      const memBytes = p.monit?.memory || 0;
      const memMB = Math.round(memBytes / (1024 * 1024) * 10) / 10;
      const status = statusValue(p.pm2_env?.status);
      const restarts = p.pm2_env?.restart_time || 0;
      const uptimeMs = p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0;
      const uptimeHours = Math.round(uptimeMs / 3_600_000 * 100) / 100;

      metrics.push(makeMetric('CPU', cpu, 'Percent', dims));
      metrics.push(makeMetric('MemoryMB', memMB, 'Megabytes', dims));
      metrics.push(makeMetric('Status', status, 'None', dims));
      metrics.push(makeMetric('Restarts', restarts, 'Count', dims));
      metrics.push(makeMetric('UptimeHours', uptimeHours, 'None', dims));

      totalCPU += cpu;
      totalMemMB += memMB;
      if (status === 1) onlineCount++;
    }

    // Aggregate metrics (no dimensions)
    metrics.push(makeMetric('TotalCPU', Math.round(totalCPU * 10) / 10, 'Percent'));
    metrics.push(makeMetric('TotalMemoryMB', Math.round(totalMemMB * 10) / 10, 'Megabytes'));
    metrics.push(makeMetric('OnlineCount', onlineCount, 'Count'));
    metrics.push(makeMetric('TotalProcesses', processes.length, 'Count'));

    // CloudWatch allows max 1000 MetricData per call.
    // 13 processes x 5 metrics + 4 aggregates = 69 metrics. Well under limit.
    // But chunk just in case future expansion.
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < metrics.length; i += CHUNK_SIZE) {
      const chunk = metrics.slice(i, i + CHUNK_SIZE);
      const cmd = new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: chunk,
      });
      await cw.send(cmd);
    }

    const procNames = processes.map(p => {
      const s = p.pm2_env?.status;
      const icon = s === 'online' ? '+' : s === 'errored' ? '!' : '-';
      return `${icon}${p.name}`;
    }).join(' ');

    console.log(`[${ts()}] Pushed ${metrics.length} metrics | ${onlineCount}/${processes.length} online | CPU ${Math.round(totalCPU)}% | Mem ${Math.round(totalMemMB)}MB | ${procNames}`);

  } catch (err) {
    console.error(`[${ts()}] CloudWatch push error: ${err.message?.substring(0, 200)}`);
  } finally {
    collecting = false;
  }
}

// --- Start ---
console.log(`[${ts()}] PM2 CloudWatch Metrics started (namespace: ${NAMESPACE}, interval: ${INTERVAL_MS / 1000}s)`);
collectAndPush();
setInterval(collectAndPush, INTERVAL_MS);
