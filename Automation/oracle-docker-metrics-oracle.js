#!/usr/bin/env node
/**
 * Oracle Docker Metrics Collector (runs ON Oracle VM)
 * Collects docker stats locally and pushes to AWS CloudWatch.
 * Runs every 60 seconds via PM2.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const NAMESPACE = 'NAVADA/Docker';
const REGION = 'eu-west-2';
const INTERVAL = 60_000;

let collecting = false;

async function run(cmd, timeoutMs = 15000) {
  return execAsync(cmd, { timeout: timeoutMs, encoding: 'utf8' });
}

async function collectAndPush() {
  if (collecting) return;
  collecting = true;
  const ts = new Date().toISOString();

  try {
    const { stdout } = await run(
      'docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemPerc}}|{{.MemUsage}}"',
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

    pushes.push(pushMetric('TotalContainers', count, ''));
    pushes.push(pushMetric('TotalCPU', totalCpu, ''));
    pushes.push(pushMetric('TotalMemoryPercent', totalMemPct, ''));

    await Promise.allSettled(pushes);

    // --- Host Metrics (NAVADA/Oracle namespace) ---
    let hostCpu = 0, hostMem = 0, hostMemUsed = 0, hostMemTotal = 0;
    let hostDiskPct = 0, hostDiskUsed = 0, hostDiskTotal = 0, hostLoad = 0;
    const hostPushes = [];

    try {
      const [cpuRes, memRes, diskRes, loadRes] = await Promise.allSettled([
        run("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'", 5000),
        run("free -m | awk '/Mem:/{printf \"%.1f %.0f %.0f\", ($3/$2)*100, $3, $2}'", 5000),
        run("df -BG / | awk 'NR==2{gsub(\"G\",\"\"); printf \"%s %s %s\", $3, $2, $5}'", 5000),
        run("cat /proc/loadavg | awk '{print $1}'", 5000),
      ]);

      if (cpuRes.status === 'fulfilled') hostCpu = parseFloat(cpuRes.value.stdout) || 0;
      if (memRes.status === 'fulfilled') {
        const mp = memRes.value.stdout.trim().split(' ');
        hostMem = parseFloat(mp[0]) || 0;
        hostMemUsed = parseFloat(mp[1]) || 0;
        hostMemTotal = parseFloat(mp[2]) || 0;
      }
      if (diskRes.status === 'fulfilled') {
        const dp = diskRes.value.stdout.trim().split(' ');
        hostDiskUsed = parseFloat(dp[0]) || 0;
        hostDiskTotal = parseFloat(dp[1]) || 0;
        hostDiskPct = parseFloat(dp[2]) || 0;
      }
      if (loadRes.status === 'fulfilled') hostLoad = parseFloat(loadRes.value.stdout) || 0;
    } catch { /* host metrics failed */ }

    hostPushes.push(pushMetric('HostCPU', hostCpu, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostMemoryPercent', hostMem, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostMemoryUsedMB', hostMemUsed, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostMemoryTotalMB', hostMemTotal, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostDiskPercent', hostDiskPct, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostDiskUsedGB', hostDiskUsed, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostDiskTotalGB', hostDiskTotal, '', 'NAVADA/Oracle'));
    hostPushes.push(pushMetric('HostLoadAvg1m', hostLoad, '', 'NAVADA/Oracle'));

    await Promise.allSettled(hostPushes);

    console.log(`[${ts}] OK: ${count} containers (CPU: ${totalCpu.toFixed(1)}%, Mem: ${totalMemPct.toFixed(1)}%) | Host: CPU ${hostCpu}%, Mem ${hostMem}%, Disk ${hostDiskPct}%`);
  } catch (err) {
    console.error(`[${ts}] Error: ${err.message?.substring(0, 100)}`);
  } finally {
    collecting = false;
  }
}

async function pushMetric(metricName, value, dimensions, namespace) {
  try {
    const ns = namespace || NAMESPACE;
    const unit = metricName.includes('MB') || metricName.includes('GB') ? 'Megabytes'
      : (metricName.includes('Percent') || metricName.includes('CPU')) ? 'Percent'
      : metricName.includes('Load') ? 'Count' : 'Count';
    let cmd = `aws cloudwatch put-metric-data --namespace "${ns}" --metric-name "${metricName}" --value ${value} --unit ${unit} --region ${REGION}`;
    if (dimensions) cmd += ` --dimensions "${dimensions}"`;
    await run(cmd, 10000);
  } catch {
    // silently skip individual push failures
  }
}

console.log(`[${new Date().toISOString()}] Oracle Docker Metrics collector started (local, every ${INTERVAL / 1000}s)`);
collectAndPush();
setInterval(collectAndPush, INTERVAL);
