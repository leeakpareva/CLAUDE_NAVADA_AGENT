#!/usr/bin/env node
/**
 * OCI Cost Monitor
 * Runs daily (via Task Scheduler or cron). Queries Oracle Cloud billing,
 * pushes cost metrics to AWS CloudWatch, alerts via Telegram if spend exceeds thresholds.
 *
 * Schedule: Daily at 7:30 AM via Windows Task Scheduler
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const execAsync = promisify(exec);

const BASH = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/bash';
const REGION = 'eu-west-2';
const OCI_TENANCY = 'ocid1.tenancy.oc1..aaaaaaaaepw4v5qq5dcl5omunesemuld5istzg2noda5sug5ynntvi5cpkja';

// Monthly budget threshold (GBP)
const MONTHLY_BUDGET = 5.00;
const ALERT_THRESHOLDS = [0.50, 0.80, 1.00]; // 50%, 80%, 100%

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_OWNER_ID = process.env.TELEGRAM_OWNER_ID;

try { require('dotenv').config({ path: __dirname + '/.env' }); } catch {}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function run(cmd, timeoutMs = 30000) {
  return execAsync(cmd, { timeout: timeoutMs, encoding: 'utf8', shell: BASH, windowsHide: true,
    env: { ...process.env, OCI_CLI_SUPPRESS_FILE_PERMISSIONS_WARNING: 'True' } });
}

async function sendTelegram(text) {
  const token = TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = TELEGRAM_OWNER_ID || process.env.TELEGRAM_OWNER_ID;
  if (!token || !chatId) { log('Telegram not configured'); return; }

  return new Promise((resolve) => {
    const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
    const req = https.request({
      hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

async function pushCloudWatch(metricName, value, unit = 'None') {
  try {
    await run(`aws cloudwatch put-metric-data --namespace "NAVADA/OCI" --metric-name "${metricName}" --value ${value} --unit ${unit} --region ${REGION}`);
  } catch (e) { log(`CloudWatch push failed: ${e.message?.substring(0, 80)}`); }
}

async function getOCICosts() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] + 'T00:00:00.000Z';
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0] + 'T00:00:00.000Z';

  // Cost by service
  const cmd = `oci usage-api usage-summary request-summarized-usages ` +
    `--tenant-id "${OCI_TENANCY}" ` +
    `--time-usage-started "${monthStart}" ` +
    `--time-usage-ended "${monthEnd}" ` +
    `--granularity MONTHLY ` +
    `--query-type COST ` +
    `--group-by '["service"]' ` +
    `--output json`;

  const { stdout } = await run(cmd);
  const data = JSON.parse(stdout);

  let totalCost = 0;
  const services = [];

  for (const item of data.data.items) {
    const cost = parseFloat(item['computed-amount']) || 0;
    const usage = parseFloat(item['computed-quantity']) || 0;
    totalCost += cost;
    if (cost > 0 || usage > 0) {
      services.push({
        service: item.service,
        cost: cost,
        usage: Math.round(usage * 100) / 100,
        currency: item.currency || 'GBP',
      });
    }
  }

  return { totalCost: Math.round(totalCost * 100) / 100, services, monthStart, monthEnd };
}

async function checkInstance() {
  const cmd = `oci compute instance get ` +
    `--instance-id "ocid1.instance.oc1.uk-london-1.anwgiljswjjqxuqcbg7gznqel6d3p76sd5bvpl2pycoq35kwvi3x35ko33za" ` +
    `--query 'data.{"state":"lifecycle-state","shape":"shape","ocpus":"shape-config".ocpus,"memory":"shape-config"."memory-in-gbs","name":"display-name"}' ` +
    `--output json`;

  const { stdout } = await run(cmd);
  return JSON.parse(stdout);
}

async function main() {
  log('=== OCI Cost Monitor ===');

  // Get costs
  let costs;
  try {
    costs = await getOCICosts();
    log(`Total cost this month: £${costs.totalCost.toFixed(2)}`);
    for (const s of costs.services) {
      log(`  ${s.service}: £${s.cost.toFixed(2)} (usage: ${s.usage})`);
    }
  } catch (e) {
    log(`Failed to get costs: ${e.message}`);
    return;
  }

  // Get instance info
  let instance;
  try {
    instance = await checkInstance();
    log(`Instance: ${instance.name} | ${instance.state} | ${instance.ocpus} OCPU | ${instance.memory}GB RAM`);
  } catch (e) {
    log(`Failed to get instance: ${e.message}`);
  }

  // Push to CloudWatch
  await pushCloudWatch('MonthlyCostGBP', costs.totalCost, 'None');
  await pushCloudWatch('BudgetUsedPercent', Math.round(costs.totalCost / MONTHLY_BUDGET * 100), 'Percent');

  for (const s of costs.services) {
    if (s.cost > 0) {
      await pushCloudWatch(`Cost_${s.service.replace(/\s+/g, '_')}`, s.cost, 'None');
    }
  }

  if (instance) {
    await pushCloudWatch('InstanceMemoryGB', instance.memory, 'Gigabytes');
    await pushCloudWatch('InstanceOCPUs', instance.ocpus, 'Count');
    await pushCloudWatch('InstanceRunning', instance.state === 'RUNNING' ? 1 : 0, 'Count');
  }

  // Check thresholds and alert
  const pct = costs.totalCost / MONTHLY_BUDGET;
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projected = (costs.totalCost / dayOfMonth) * daysInMonth;

  for (const threshold of ALERT_THRESHOLDS) {
    if (pct >= threshold) {
      const msg = [
        `<b>OCI COST ALERT</b>`,
        ``,
        `Spend: <b>£${costs.totalCost.toFixed(2)}</b> / £${MONTHLY_BUDGET.toFixed(2)} budget (${Math.round(pct * 100)}%)`,
        `Projected end of month: <b>£${projected.toFixed(2)}</b>`,
        ``,
        `<b>Breakdown:</b>`,
        ...costs.services.filter(s => s.cost > 0).map(s => `  ${s.service}: £${s.cost.toFixed(2)}`),
        ``,
        instance ? `Instance: ${instance.name} | ${instance.ocpus} OCPU | ${instance.memory}GB RAM` : '',
        ``,
        `Day ${dayOfMonth}/${daysInMonth} of billing cycle`,
      ].filter(Boolean).join('\n');

      await sendTelegram(msg);
      log(`Alert sent (${Math.round(threshold * 100)}% threshold)`);
      break; // Only send highest threshold alert
    }
  }

  // Daily summary to Telegram (always)
  const summary = [
    `<b>OCI Daily Cost Report</b>`,
    ``,
    `Month to date: £${costs.totalCost.toFixed(2)} / £${MONTHLY_BUDGET.toFixed(2)} (${Math.round(pct * 100)}%)`,
    `Projected: £${projected.toFixed(2)}`,
    ...costs.services.filter(s => s.cost > 0 || s.usage > 1).map(s =>
      `${s.service}: £${s.cost.toFixed(2)} (${s.usage} units)`
    ),
    instance ? `\nVM: ${instance.memory}GB RAM, ${instance.ocpus} OCPU, ${instance.state}` : '',
  ].filter(Boolean).join('\n');

  await sendTelegram(summary);
  log('Daily report sent to Telegram');
  log('=== Done ===');
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
