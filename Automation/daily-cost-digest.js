#!/usr/bin/env node
/**
 * NAVADA Daily Cost Digest
 * Sends a unified cost report to Telegram covering:
 *   1. Oracle Cloud (OCI) — compute, storage, network
 *   2. AWS — EC2, Lambda, Bedrock, SageMaker, Rekognition, S3, etc.
 *   3. API Usage — Claude (text), DALL-E/Flux (images), YOLO (inference), TTS
 *
 * Schedule: Daily at 9:00 PM via Windows Task Scheduler (after trading reports)
 * Can also be triggered manually: node daily-cost-digest.js
 */

try { require('dotenv').config({ path: __dirname + '/.env' }); } catch {}

const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const path = require('path');
const execAsync = promisify(exec);

const BASH = 'C:/Program Files/Git/bin/bash.exe';
const AWS_REGION = 'eu-west-2';
const OCI_TENANCY = 'ocid1.tenancy.oc1..aaaaaaaaepw4v5qq5dcl5omunesemuld5istzg2noda5sug5ynntvi5cpkja';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_OWNER_ID = process.env.TELEGRAM_OWNER_ID;

// Budgets
const OCI_MONTHLY_BUDGET = 5.00;  // GBP
const AWS_MONTHLY_BUDGET = 25.00; // USD
const API_DAILY_BUDGET = 5.00;    // GBP

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function run(cmd, timeoutMs = 30000) {
  return execAsync(cmd, { timeout: timeoutMs, encoding: 'utf8', shell: BASH, windowsHide: true,
    env: { ...process.env, OCI_CLI_SUPPRESS_FILE_PERMISSIONS_WARNING: 'True' } });
}

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_OWNER_ID) { log('Telegram not configured'); return; }
  return new Promise((resolve) => {
    const data = JSON.stringify({ chat_id: TELEGRAM_OWNER_ID, text, parse_mode: 'HTML', disable_web_page_preview: true });
    const req = https.request({
      hostname: 'api.telegram.org', path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => { resolve(b); }); });
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

// ============================================================
// 1. Oracle Cloud Costs
// ============================================================
async function getOCICosts() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] + 'T00:00:00.000Z';
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0] + 'T00:00:00.000Z';

    const { stdout } = await run(
      `oci usage-api usage-summary request-summarized-usages ` +
      `--tenant-id "${OCI_TENANCY}" ` +
      `--time-usage-started "${monthStart}" ` +
      `--time-usage-ended "${monthEnd}" ` +
      `--granularity MONTHLY --query-type COST ` +
      `--group-by '["service"]' --output json`
    );

    const data = JSON.parse(stdout);
    let total = 0;
    const services = [];
    for (const item of data.data.items) {
      const cost = parseFloat(item['computed-amount']) || 0;
      total += cost;
      if (cost > 0.001) services.push({ name: item.service, cost });
    }
    return { total: Math.round(total * 100) / 100, services, currency: 'GBP' };
  } catch (e) {
    log(`OCI cost error: ${e.message?.substring(0, 80)}`);
    return { total: 0, services: [], currency: 'GBP', error: e.message?.substring(0, 50) };
  }
}

// ============================================================
// 2. AWS Costs
// ============================================================
async function getAWSCosts() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Monthly total by service
    const { stdout: monthlyOut } = await run(
      `aws ce get-cost-and-usage --time-period Start=${monthStart},End=${today} ` +
      `--granularity MONTHLY --metrics BlendedCost ` +
      `--group-by Type=DIMENSION,Key=SERVICE --region ${AWS_REGION} --output json`
    );
    const monthly = JSON.parse(monthlyOut);
    let monthTotal = 0;
    const services = [];
    if (monthly.ResultsByTime[0]) {
      for (const g of monthly.ResultsByTime[0].Groups) {
        const cost = parseFloat(g.Metrics.BlendedCost.Amount) || 0;
        monthTotal += cost;
        if (cost > 0.001) services.push({ name: g.Keys[0], cost });
      }
    }

    // Yesterday's daily cost
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    let dailyTotal = 0;
    const dailyServices = [];
    try {
      const { stdout: dailyOut } = await run(
        `aws ce get-cost-and-usage --time-period Start=${yesterday},End=${today} ` +
        `--granularity DAILY --metrics BlendedCost ` +
        `--group-by Type=DIMENSION,Key=SERVICE --region ${AWS_REGION} --output json`
      );
      const daily = JSON.parse(dailyOut);
      if (daily.ResultsByTime[0]) {
        for (const g of daily.ResultsByTime[0].Groups) {
          const cost = parseFloat(g.Metrics.BlendedCost.Amount) || 0;
          dailyTotal += cost;
          if (cost > 0.001) dailyServices.push({ name: g.Keys[0], cost });
        }
      }
    } catch {}

    return {
      monthTotal: Math.round(monthTotal * 100) / 100,
      dailyTotal: Math.round(dailyTotal * 100) / 100,
      services: services.sort((a, b) => b.cost - a.cost),
      dailyServices: dailyServices.sort((a, b) => b.cost - a.cost),
      currency: 'USD',
    };
  } catch (e) {
    log(`AWS cost error: ${e.message?.substring(0, 80)}`);
    return { monthTotal: 0, dailyTotal: 0, services: [], dailyServices: [], currency: 'USD', error: e.message?.substring(0, 50) };
  }
}

// ============================================================
// 3. API Usage Costs (from cost-tracker.js)
// ============================================================
function getAPICosts() {
  try {
    const tracker = require(path.join(__dirname, '..', 'Manager', 'cost-tracking', 'cost-tracker'));
    const today = tracker.getDailySummary();
    const yesterday = tracker.getDailySummary(
      new Date(Date.now() - 86400000).toISOString().split('T')[0]
    );
    const weekly = tracker.getWeeklySummary();

    // Split by category
    const textModels = ['claude-sonnet-4', 'claude-opus-4', 'claude-haiku', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    const imageModels = ['dall-e-3', 'dall-e-3-hd', 'gemini-flash-image', 'flux'];
    const audioModels = ['whisper', 'tts-1', 'tts-1-hd'];

    function categorize(summary) {
      let text = 0, textCalls = 0;
      let image = 0, imageCalls = 0;
      let audio = 0, audioCalls = 0;
      let other = 0, otherCalls = 0;

      for (const [model, data] of Object.entries(summary.by_model)) {
        if (textModels.some(m => model.includes(m))) { text += data.cost_gbp; textCalls += data.calls; }
        else if (imageModels.some(m => model.includes(m))) { image += data.cost_gbp; imageCalls += data.calls; }
        else if (audioModels.some(m => model.includes(m))) { audio += data.cost_gbp; audioCalls += data.calls; }
        else { other += data.cost_gbp; otherCalls += data.calls; }
      }
      return {
        text: { cost: Math.round(text * 10000) / 10000, calls: textCalls },
        image: { cost: Math.round(image * 10000) / 10000, calls: imageCalls },
        audio: { cost: Math.round(audio * 10000) / 10000, calls: audioCalls },
        other: { cost: Math.round(other * 10000) / 10000, calls: otherCalls },
      };
    }

    return {
      today: { ...categorize(today), total: today.total_cost_gbp, calls: today.total_calls, humanHours: today.total_human_hours, humanCost: today.total_human_cost_gbp, roi: today.roi_multiplier },
      yesterday: { ...categorize(yesterday), total: yesterday.total_cost_gbp, calls: yesterday.total_calls, humanHours: yesterday.total_human_hours, humanCost: yesterday.total_human_cost_gbp, roi: yesterday.roi_multiplier },
      weekly: weekly,
    };
  } catch (e) {
    log(`API cost error: ${e.message?.substring(0, 80)}`);
    return { today: { total: 0, calls: 0, text: { cost: 0, calls: 0 }, image: { cost: 0, calls: 0 }, audio: { cost: 0, calls: 0 }, other: { cost: 0, calls: 0 } }, yesterday: { total: 0, calls: 0 }, error: e.message?.substring(0, 50) };
  }
}

// ============================================================
// Format and Send
// ============================================================
async function main() {
  log('=== NAVADA Daily Cost Digest ===');

  const [oci, aws, api] = await Promise.all([getOCICosts(), getAWSCosts(), getAPICosts()]);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // --- Oracle Cloud ---
  const ociPct = Math.round(oci.total / OCI_MONTHLY_BUDGET * 100);
  const ociProjected = Math.round((oci.total / dayOfMonth) * daysInMonth * 100) / 100;

  let msg = `<b>NAVADA DAILY COST DIGEST</b>\n`;
  msg += `${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;

  // Section 1: Oracle
  msg += `<b>1. ORACLE CLOUD</b>\n`;
  msg += `Month to date: <b>£${oci.total.toFixed(2)}</b> / £${OCI_MONTHLY_BUDGET} (${ociPct}%)\n`;
  msg += `Projected: £${ociProjected.toFixed(2)}\n`;
  if (oci.services.length > 0) {
    for (const s of oci.services) msg += `  ${s.name}: £${s.cost.toFixed(2)}\n`;
  }
  if (oci.error) msg += `  Error: ${oci.error}\n`;
  msg += `\n`;

  // Section 2: AWS
  const awsPct = Math.round(aws.monthTotal / AWS_MONTHLY_BUDGET * 100);
  msg += `<b>2. AWS</b>\n`;
  msg += `Month to date: <b>$${aws.monthTotal.toFixed(2)}</b> / $${AWS_MONTHLY_BUDGET} (${awsPct}%)\n`;
  msg += `Yesterday: $${aws.dailyTotal.toFixed(2)}\n`;
  if (aws.dailyServices.length > 0) {
    for (const s of aws.dailyServices.slice(0, 5)) msg += `  ${s.name}: $${s.cost.toFixed(4)}\n`;
  }
  if (aws.services.length > 0 && aws.dailyServices.length === 0) {
    for (const s of aws.services.slice(0, 5)) msg += `  ${s.name}: $${s.cost.toFixed(4)}\n`;
  }
  if (aws.error) msg += `  Error: ${aws.error}\n`;
  msg += `\n`;

  // Section 3: API Usage
  const apiData = api.yesterday.calls > 0 ? api.yesterday : api.today;
  const apiLabel = api.yesterday.calls > 0 ? 'Yesterday' : 'Today';
  msg += `<b>3. API USAGE (${apiLabel})</b>\n`;
  msg += `Total: <b>£${apiData.total.toFixed(4)}</b> (${apiData.calls} calls)\n`;
  if (apiData.text?.calls > 0) msg += `  Text (Claude/GPT): £${apiData.text.cost.toFixed(4)} (${apiData.text.calls} calls)\n`;
  if (apiData.image?.calls > 0) msg += `  Images (DALL-E/Flux): £${apiData.image.cost.toFixed(4)} (${apiData.image.calls} calls)\n`;
  if (apiData.audio?.calls > 0) msg += `  Audio (TTS/Whisper): £${apiData.audio.cost.toFixed(4)} (${apiData.audio.calls} calls)\n`;
  if (apiData.other?.calls > 0) msg += `  Other: £${apiData.other.cost.toFixed(4)} (${apiData.other.calls} calls)\n`;
  if (apiData.humanHours > 0) msg += `Human equivalent: ${apiData.humanHours}h (£${apiData.humanCost})\n`;
  if (apiData.roi > 0) msg += `ROI: <b>${apiData.roi}x</b> cheaper with AI\n`;
  msg += `\n`;

  // Totals
  const totalGBP = oci.total + (aws.monthTotal * 0.79) + (apiData.total || 0);
  msg += `<b>TOTAL INFRA (MTD)</b>: £${totalGBP.toFixed(2)}\n`;
  msg += `Day ${dayOfMonth}/${daysInMonth} of billing cycle`;

  // Alerts
  const alerts = [];
  if (ociPct >= 80) alerts.push(`OCI at ${ociPct}% of budget`);
  if (awsPct >= 80) alerts.push(`AWS at ${awsPct}% of budget`);
  if (apiData.total > API_DAILY_BUDGET) alerts.push(`API spend £${apiData.total.toFixed(2)} exceeds daily £${API_DAILY_BUDGET} budget`);

  if (alerts.length > 0) {
    msg += `\n\n<b>ALERTS:</b>\n`;
    for (const a of alerts) msg += `${a}\n`;
  }

  log(msg.replace(/<[^>]+>/g, ''));
  await sendTelegram(msg);
  log('Digest sent to Telegram');

  // Push summary to CloudWatch
  try {
    await run(`aws cloudwatch put-metric-data --namespace "NAVADA/Costs" --metric-name "OCI_MTD_GBP" --value ${oci.total} --unit None --region ${AWS_REGION}`);
    await run(`aws cloudwatch put-metric-data --namespace "NAVADA/Costs" --metric-name "AWS_MTD_USD" --value ${aws.monthTotal} --unit None --region ${AWS_REGION}`);
    await run(`aws cloudwatch put-metric-data --namespace "NAVADA/Costs" --metric-name "API_Daily_GBP" --value ${apiData.total || 0} --unit None --region ${AWS_REGION}`);
    await run(`aws cloudwatch put-metric-data --namespace "NAVADA/Costs" --metric-name "Total_MTD_GBP" --value ${totalGBP} --unit None --region ${AWS_REGION}`);
    log('CloudWatch metrics pushed');
  } catch (e) {
    log(`CloudWatch push error: ${e.message?.substring(0, 80)}`);
  }

  log('=== Done ===');
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
