/**
 * NAVADA Cost Tracker
 * Logs all API calls with token counts, costs in £, and human-equivalent estimates.
 * Used by all automation scripts for ROI tracking.
 *
 * Usage:
 *   const tracker = require('../Manager/cost-tracker');
 *   tracker.log('whisper', { audio_seconds: 5.2, script: 'voice-command' });
 *   tracker.log('gpt-4o-mini', { input_tokens: 150, output_tokens: 80, script: 'voice-command' });
 *   tracker.log('tts-1-hd', { characters: 200, script: 'voice-command' });
 *
 * Daily summary:
 *   node cost-tracker.js --summary
 *   node cost-tracker.js --summary 2026-02-26
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'cost-log.json');
const GBP_PER_USD = 0.79; // Approximate, updated periodically

// ============================================================
// API PRICING (USD) — updated Feb 2026
// ============================================================
const PRICING = {
  // OpenAI Chat Models
  'gpt-4o':        { input: 2.50 / 1e6, output: 10.00 / 1e6, human_mins_per_call: 15 },
  'gpt-4o-mini':   { input: 0.15 / 1e6, output: 0.60 / 1e6,  human_mins_per_call: 10 },
  'gpt-4-turbo':   { input: 10.00 / 1e6, output: 30.00 / 1e6, human_mins_per_call: 20 },
  'gpt-3.5-turbo': { input: 0.50 / 1e6, output: 1.50 / 1e6,  human_mins_per_call: 5 },

  // Claude Models
  'claude-opus-4':   { input: 15.00 / 1e6, output: 75.00 / 1e6, human_mins_per_call: 30 },
  'claude-sonnet-4': { input: 3.00 / 1e6,  output: 15.00 / 1e6, human_mins_per_call: 20 },
  'claude-haiku':    { input: 0.25 / 1e6,  output: 1.25 / 1e6,  human_mins_per_call: 5 },

  // OpenAI Audio
  'whisper':    { per_second: 0.006 / 60, human_mins_per_call: 5 },  // $0.006/min
  'tts-1':      { per_char: 0.015 / 1000, human_mins_per_call: 3 },  // $15/1M chars
  'tts-1-hd':   { per_char: 0.030 / 1000, human_mins_per_call: 3 },  // $30/1M chars

  // OpenAI Images
  'dall-e-3':      { per_image: 0.040, human_mins_per_call: 30 },     // 1024x1024
  'dall-e-3-hd':   { per_image: 0.080, human_mins_per_call: 30 },

  // External APIs
  'apify':         { per_run: 0.01, human_mins_per_call: 60 },
  'vercel-deploy': { per_deploy: 0, human_mins_per_call: 30 },
  'email-send':    { per_email: 0, human_mins_per_call: 10 },
  'linkedin-post': { per_post: 0, human_mins_per_call: 20 },

  // Bright Data
  'bright-data':   { per_request: 0.001, human_mins_per_call: 15 },
};

const HUMAN_HOURLY_RATE_GBP = 75; // Senior AI consultant rate

// ============================================================
// Cost calculation
// ============================================================
function calculateCost(model, params = {}) {
  const pricing = PRICING[model];
  if (!pricing) return { usd: 0, gbp: 0, human_mins: 0 };

  let usd = 0;

  if (params.input_tokens && pricing.input) {
    usd += params.input_tokens * pricing.input;
  }
  if (params.output_tokens && pricing.output) {
    usd += params.output_tokens * pricing.output;
  }
  if (params.audio_seconds && pricing.per_second) {
    usd += params.audio_seconds * pricing.per_second;
  }
  if (params.characters && pricing.per_char) {
    usd += params.characters * pricing.per_char;
  }
  if (pricing.per_image && params.images) {
    usd += params.images * pricing.per_image;
  }
  if (pricing.per_run) {
    usd += pricing.per_run * (params.runs || 1);
  }
  if (pricing.per_request) {
    usd += pricing.per_request * (params.requests || 1);
  }
  if (pricing.per_deploy !== undefined) {
    usd += pricing.per_deploy;
  }
  if (pricing.per_email !== undefined && params.emails) {
    usd += pricing.per_email * params.emails;
  }
  if (pricing.per_post !== undefined) {
    usd += pricing.per_post;
  }

  return {
    usd: Math.round(usd * 1e6) / 1e6,
    gbp: Math.round(usd * GBP_PER_USD * 1e6) / 1e6,
    human_mins: pricing.human_mins_per_call || 0,
    human_cost_gbp: Math.round((pricing.human_mins_per_call || 0) / 60 * HUMAN_HOURLY_RATE_GBP * 100) / 100,
  };
}

// ============================================================
// Logging
// ============================================================
function loadLog() {
  try {
    if (fs.existsSync(LOG_FILE)) return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (e) { /* corrupt file, start fresh */ }
  return [];
}

function saveLog(entries) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2));
}

function logCall(model, params = {}) {
  const entries = loadLog();
  const cost = calculateCost(model, params);
  const entry = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    model,
    ...params,
    cost_usd: cost.usd,
    cost_gbp: cost.gbp,
    human_mins: cost.human_mins,
    human_cost_gbp: cost.human_cost_gbp,
  };
  entries.push(entry);

  // Keep last 30 days only
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const filtered = entries.filter(e => new Date(e.timestamp) > cutoff);
  saveLog(filtered);

  return entry;
}

// ============================================================
// Summary / Reporting
// ============================================================
function getDailySummary(dateStr) {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const entries = loadLog().filter(e => e.date === date);

  const byModel = {};
  let totalGBP = 0;
  let totalHumanMins = 0;
  let totalHumanCost = 0;
  let totalCalls = 0;

  for (const e of entries) {
    if (!byModel[e.model]) byModel[e.model] = { calls: 0, cost_gbp: 0, human_mins: 0 };
    byModel[e.model].calls++;
    byModel[e.model].cost_gbp += e.cost_gbp;
    byModel[e.model].human_mins += e.human_mins;
    totalGBP += e.cost_gbp;
    totalHumanMins += e.human_mins;
    totalHumanCost += e.human_cost_gbp;
    totalCalls++;
  }

  const byScript = {};
  for (const e of entries) {
    const s = e.script || 'unknown';
    if (!byScript[s]) byScript[s] = { calls: 0, cost_gbp: 0, human_mins: 0 };
    byScript[s].calls++;
    byScript[s].cost_gbp += e.cost_gbp;
    byScript[s].human_mins += e.human_mins;
  }

  return {
    date,
    total_calls: totalCalls,
    total_cost_gbp: Math.round(totalGBP * 10000) / 10000,
    total_human_mins: totalHumanMins,
    total_human_hours: Math.round(totalHumanMins / 60 * 10) / 10,
    total_human_cost_gbp: Math.round(totalHumanCost * 100) / 100,
    roi_multiplier: totalGBP > 0 ? Math.round(totalHumanCost / totalGBP) : 0,
    by_model: byModel,
    by_script: byScript,
    entries,
  };
}

function getWeeklySummary() {
  const entries = loadLog();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekEntries = entries.filter(e => new Date(e.timestamp) > weekAgo);

  const byDay = {};
  for (const e of weekEntries) {
    if (!byDay[e.date]) byDay[e.date] = { calls: 0, cost_gbp: 0, human_mins: 0, human_cost_gbp: 0 };
    byDay[e.date].calls++;
    byDay[e.date].cost_gbp += e.cost_gbp;
    byDay[e.date].human_mins += e.human_mins;
    byDay[e.date].human_cost_gbp += e.human_cost_gbp;
  }

  return { days: byDay, total_entries: weekEntries.length };
}

// ============================================================
// CLI
// ============================================================
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--summary')) {
    const date = args[args.indexOf('--summary') + 1];
    const summary = getDailySummary(date);
    console.log(`\n📊 NAVADA Cost Report — ${summary.date}`);
    console.log('─'.repeat(50));
    console.log(`Total API Calls:    ${summary.total_calls}`);
    console.log(`AI Cost:            £${summary.total_cost_gbp.toFixed(4)}`);
    console.log(`Human Equivalent:   ${summary.total_human_hours}h (£${summary.total_human_cost_gbp})`);
    console.log(`ROI Multiplier:     ${summary.roi_multiplier}x cheaper with AI`);
    console.log('\nBy Model:');
    for (const [model, data] of Object.entries(summary.by_model)) {
      console.log(`  ${model.padEnd(18)} ${String(data.calls).padStart(4)} calls  £${data.cost_gbp.toFixed(4).padStart(8)}`);
    }
    console.log('\nBy Script:');
    for (const [script, data] of Object.entries(summary.by_script)) {
      console.log(`  ${script.padEnd(25)} ${String(data.calls).padStart(4)} calls  £${data.cost_gbp.toFixed(4).padStart(8)}`);
    }
  } else if (args.includes('--weekly')) {
    const weekly = getWeeklySummary();
    console.log('\n📊 NAVADA Weekly Cost Summary');
    console.log('─'.repeat(50));
    for (const [day, data] of Object.entries(weekly.days).sort()) {
      const roi = data.cost_gbp > 0 ? Math.round(data.human_cost_gbp / data.cost_gbp) : 0;
      console.log(`  ${day}  ${String(data.calls).padStart(4)} calls  AI: £${data.cost_gbp.toFixed(3).padStart(7)}  Human: £${data.human_cost_gbp.toFixed(0).padStart(5)}  ROI: ${roi}x`);
    }
  } else {
    console.log('Usage:');
    console.log('  node cost-tracker.js --summary [date]');
    console.log('  node cost-tracker.js --weekly');
  }
}

module.exports = { logCall, calculateCost, getDailySummary, getWeeklySummary, PRICING, HUMAN_HOURLY_RATE_GBP };
