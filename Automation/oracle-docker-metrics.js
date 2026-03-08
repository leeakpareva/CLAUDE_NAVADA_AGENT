#!/usr/bin/env node
/**
 * Oracle Docker Metrics Collector
 * Runs on HP, SSHes to Oracle VM, collects docker stats,
 * pushes custom metrics to AWS CloudWatch under NAVADA/Docker namespace.
 *
 * Runs every 60 seconds via PM2.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const ORACLE_HOST = '100.77.206.9';
const NAMESPACE = 'NAVADA/Docker';
const REGION = 'eu-west-2';
const INTERVAL = 60_000;
const BASH = 'C:/Program Files/Git/bin/bash.exe';

let collecting = false;

async function run(cmd, timeoutMs = 15000) {
  return execAsync(cmd, { timeout: timeoutMs, encoding: 'utf8', shell: BASH, windowsHide: true });
}

async function collectAndPush() {
  if (collecting) return; // prevent overlapping runs
  collecting = true;
  const ts = new Date().toISOString();

  try {
    // Collect docker stats from Oracle
    const { stdout } = await run(
      `ssh -o ConnectTimeout=8 -o StrictHostKeyChecking=no -o BatchMode=yes ubuntu@${ORACLE_HOST} 'docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemPerc}}|{{.MemUsage}}"'`,
      20000
    );

    const raw = stdout.trim();
    if (!raw) {
      console.log(`[${ts}] No docker stats returned`);
      collecting = false;
      return;
    }

    const lines = raw.split('\n').filter(Boolean);
    let totalCpu = 0, totalMemPct = 0, count = 0;
    const pushes = [];

    for (const line of lines) {
      const [name, cpuStr, memPctStr, memUsage] = line.split('|');
      if (!name) continue;

      const cpu = parseFloat(cpuStr) || 0;
      const memPct = parseFloat(memPctStr) || 0;

      const memMatch = memUsage?.match(/([\d.]+)([A-Za-z]+)/);
      let memMB = 0;
      if (memMatch) {
        const val = parseFloat(memMatch[1]);
        const unit = memMatch[2].toLowerCase();
        if (unit.includes('gib') || unit.includes('gb')) memMB = val * 1024;
        else if (unit.includes('mib') || unit.includes('mb')) memMB = val;
        else if (unit.includes('kib') || unit.includes('kb')) memMB = val / 1024;
      }

      totalCpu += cpu;
      totalMemPct += memPct;
      count++;

      pushes.push(pushMetric('ContainerCPU', cpu, `Name=Container,Value=${name}`));
      pushes.push(pushMetric('ContainerMemoryPercent', memPct, `Name=Container,Value=${name}`));
      pushes.push(pushMetric('ContainerMemoryMB', memMB, `Name=Container,Value=${name}`));
    }

    // Aggregates
    pushes.push(pushMetric('TotalContainers', count, ''));
    pushes.push(pushMetric('TotalCPU', totalCpu, ''));
    pushes.push(pushMetric('TotalMemoryPercent', totalMemPct, ''));

    // Wait for all pushes (with individual timeouts)
    await Promise.allSettled(pushes);

    console.log(`[${ts}] OK: ${count} containers (CPU: ${totalCpu.toFixed(1)}%, Mem: ${totalMemPct.toFixed(1)}%)`);
  } catch (err) {
    console.error(`[${ts}] Error: ${err.message?.substring(0, 100)}`);
  } finally {
    collecting = false;
  }
}

async function pushMetric(metricName, value, dimensions) {
  try {
    const unit = metricName.includes('MB') ? 'Megabytes'
      : (metricName.includes('Percent') || metricName.includes('CPU')) ? 'Percent' : 'Count';
    let cmd = `aws cloudwatch put-metric-data --namespace "${NAMESPACE}" --metric-name "${metricName}" --value ${value} --unit ${unit} --region ${REGION}`;
    if (dimensions) cmd += ` --dimensions "${dimensions}"`;
    await run(cmd, 10000);
  } catch {
    // silently skip individual push failures
  }
}

console.log(`[${new Date().toISOString()}] Oracle Docker Metrics collector started (every ${INTERVAL / 1000}s)`);

// Initial run
collectAndPush();

// Schedule every 60s
setInterval(collectAndPush, INTERVAL);
