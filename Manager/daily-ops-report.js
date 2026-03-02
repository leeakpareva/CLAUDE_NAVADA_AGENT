/**
 * NAVADA Daily Operations Report
 * Aggregates all server activity, costs, and ROI into a clean dark email.
 * Scheduled: Daily 9 PM via Task Scheduler
 *
 * Usage:
 *   node daily-ops-report.js           # Send today's report
 *   node daily-ops-report.js --test    # Preview in console
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });
const fs = require('fs');
const path = require('path');
const { getDailySummary, getWeeklySummary } = require('./cost-tracker');
const { sendEmail } = require('../Automation/email-service');

const LOGS_DIR = path.join(__dirname, '..', 'Automation', 'logs');
const VOICE_LOG = path.join(__dirname, '..', 'Automation', 'logs', 'voice-command.log');
const PM2_VOICE_LOG = path.join(process.env.USERPROFILE || 'C:\\Users\\leeak', '.pm2', 'logs', 'voice-command-out.log');
const JOBS_TRACKER = path.join(__dirname, '..', 'Automation', 'jobs-tracker.json');
const TELEGRAM_LOG = path.join(__dirname, '..', 'Automation', 'logs', 'telegram-interactions.jsonl');
const COST_LOG = path.join(__dirname, 'cost-log.json');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================
// Scan logs for today's activities
// ============================================================
function scanTaskLogs(date) {
  const tasks = [];
  try {
    const files = fs.readdirSync(LOGS_DIR).filter(f => f.includes(date.replace(/-/g, '')));
    for (const file of files) {
      const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf8');
      const taskName = file.split('_')[0].replace(/-/g, ' ');
      const success = !content.toLowerCase().includes('error') && !content.toLowerCase().includes('failed');
      tasks.push({ name: taskName, file, success, lines: content.split('\n').length });
    }
  } catch (e) { /* no logs */ }
  return tasks;
}

function scanVoiceActivity(date) {
  const stats = { commands: 0, convos: 0, companionNuggets: 0, ignored: 0, errors: 0 };
  try {
    const log = fs.existsSync(PM2_VOICE_LOG) ? fs.readFileSync(PM2_VOICE_LOG, 'utf8') : '';
    const todayLines = log.split('\n').filter(l => l.includes(date));
    for (const line of todayLines) {
      if (line.includes('Processing:')) stats.commands++;
      if (line.includes('Entered CONVO')) stats.convos++;
      if (line.includes('Companion:')) stats.companionNuggets++;
      if (line.includes('Ignoring (no wake word)')) stats.ignored++;
      // Only count actual error events, skip stack traces and incidental mentions
      if (/\[ERROR\]|Error:|error:/i.test(line) &&
          !line.includes('at ') && !line.includes('node_modules')) {
        stats.errors++;
      }
    }
  } catch (e) { /* */ }
  return stats;
}

function scanJobActivity(date) {
  try {
    if (!fs.existsSync(JOBS_TRACKER)) return { found: 0, applied: 0 };
    const jobs = JSON.parse(fs.readFileSync(JOBS_TRACKER, 'utf8'));
    const todayJobs = jobs.filter(j => j.foundDate && j.foundDate.startsWith(date));
    const applied = jobs.filter(j => j.status === 'Applied' && j.appliedDate && j.appliedDate.startsWith(date));
    return { found: todayJobs.length, applied: applied.length, total: jobs.length };
  } catch (e) { return { found: 0, applied: 0, total: 0 }; }
}

function scanTelegramActivity(date) {
  const stats = { messagesIn: 0, messagesOut: 0, toolCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCostGbp: 0, byModel: {} };
  try {
    // Parse telegram-interactions.jsonl for message counts
    if (fs.existsSync(TELEGRAM_LOG)) {
      const lines = fs.readFileSync(TELEGRAM_LOG, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (!entry.timestamp || !entry.timestamp.startsWith(date)) continue;
          if (entry.direction === 'in') stats.messagesIn++;
          else if (entry.direction === 'out') {
            stats.messagesOut++;
            stats.totalInputTokens += entry.input_tokens || 0;
            stats.totalOutputTokens += entry.output_tokens || 0;
            stats.totalCostGbp += entry.cost_gbp || 0;
            const model = entry.model || 'unknown';
            if (!stats.byModel[model]) stats.byModel[model] = { calls: 0, cost_gbp: 0, input_tokens: 0, output_tokens: 0 };
            stats.byModel[model].calls++;
            stats.byModel[model].cost_gbp += entry.cost_gbp || 0;
            stats.byModel[model].input_tokens += entry.input_tokens || 0;
            stats.byModel[model].output_tokens += entry.output_tokens || 0;
          } else if (entry.direction === 'tool') {
            stats.toolCalls++;
          }
        } catch {}
      }
    }
    // Also check cost-log.json for telegram-bot script costs (more accurate billing data)
    if (fs.existsSync(COST_LOG)) {
      try {
        const costData = JSON.parse(fs.readFileSync(COST_LOG, 'utf8'));
        const todayEntries = (costData.entries || []).filter(e =>
          e.timestamp && e.timestamp.startsWith(date) && e.script === 'telegram-bot'
        );
        if (todayEntries.length > 0 && stats.totalCostGbp === 0) {
          // Fallback: use cost-log if interaction log didn't have cost data
          for (const e of todayEntries) {
            stats.totalCostGbp += e.cost_gbp || 0;
          }
        }
      } catch {}
    }
  } catch (e) { /* */ }
  return stats;
}

function getPM2Status() {
  try {
    const { execSync } = require('child_process');
    const raw = execSync('pm2 jlist', { encoding: 'utf8', timeout: 5000, windowsHide: true });
    const procs = JSON.parse(raw);
    return procs.map(p => ({
      name: p.name,
      status: p.pm2_env.status,
      uptime: Math.round(p.pm2_env.pm_uptime ? (Date.now() - p.pm2_env.pm_uptime) / 60000 : 0),
      restarts: p.pm2_env.restart_time,
      memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
    }));
  } catch (e) { return []; }
}

// ============================================================
// Build HTML Report — Clean dark full-width email
// Single-table structure for Gmail dark background support
// ============================================================
function buildReport(date) {
  const costs = getDailySummary(date);
  const weekly = getWeeklySummary();
  const tasks = scanTaskLogs(date);
  const voice = scanVoiceActivity(date);
  const jobs = scanJobActivity(date);
  const telegram = scanTelegramActivity(date);
  const pm2 = getPM2Status();

  const dateObj = new Date(date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  function fmtCost(gbp) {
    if (!gbp || gbp === 0) return '0p';
    if (gbp < 0.01) return '<1p';
    if (gbp < 1) return `${Math.round(gbp * 100)}p`;
    if (gbp >= 1000) return `£${Math.round(gbp).toLocaleString('en-GB')}`;
    return `£${Math.round(gbp)}`;
  }

  function fmtUptime(mins) {
    if (mins >= 1440) {
      const d = Math.floor(mins / 1440);
      const h = Math.floor((mins % 1440) / 60);
      return h > 0 ? `${d}d ${h}h` : `${d}d`;
    }
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  }

  const taskMap = new Map();
  for (const t of tasks) {
    const existing = taskMap.get(t.name);
    if (!existing || !t.success) taskMap.set(t.name, t);
  }
  const uniqueTasks = [...taskMap.values()];
  const tasksOk = uniqueTasks.filter(t => t.success).length;
  const servicesOnline = pm2.filter(p => p.status === 'online').length;

  // Colours
  const BG = '#0d0d0d';
  const HD = '#000000';
  const CD = '#111111';
  const W = '#ffffff';
  const GR = '#999999';
  const DM = '#555555';
  const LN = '#222222';
  const P = '32px';
  const FN = "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";
  const MN = "'Courier New',Courier,monospace";

  // Section header
  const sh = (t) => `<div style="font-size:11px;font-weight:700;color:${DM};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px;">${t}</div>`;

  // Divider row in master table
  const divRow = `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:0 ${P};"><div style="border-top:1px solid ${LN};"></div></td></tr>`;

  // ── Build rows for the single master table ──
  const rows = [];

  // ROW: Header
  rows.push(`<tr><td bgcolor="${HD}" style="background-color:${HD};padding:28px ${P} 24px ${P};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td bgcolor="${HD}" style="background-color:${HD};vertical-align:bottom;">
        <div style="font-size:22px;font-weight:800;color:${W};letter-spacing:0.15em;">NAVADA</div>
        <div style="font-size:11px;color:${DM};letter-spacing:0.08em;margin-top:4px;">DAILY OPERATIONS REPORT</div>
      </td>
      <td bgcolor="${HD}" style="background-color:${HD};text-align:right;vertical-align:bottom;">
        <div style="font-size:12px;color:${GR};">${dateStr}</div>
        <div style="font-size:12px;color:${DM};margin-top:2px;">${timeStr}</div>
      </td>
    </tr></table>
  </td></tr>`);

  // ROW: Summary stats (5 columns)
  const telegramTotal = telegram.messagesIn + telegram.messagesOut;
  rows.push(`<tr><td bgcolor="${CD}" style="background-color:${CD};padding:28px ${P};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="20%" bgcolor="${CD}" style="background-color:${CD};text-align:center;padding:8px 4px;">
        <div style="font-size:28px;font-weight:700;color:${W};font-family:${MN};">${fmtCost(costs.total_cost_gbp)}</div>
        <div style="font-size:10px;color:${DM};text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;">AI Spend</div>
      </td>
      <td width="20%" bgcolor="${CD}" style="background-color:${CD};text-align:center;padding:8px 4px;">
        <div style="font-size:28px;font-weight:700;color:${W};font-family:${MN};">${costs.total_calls}</div>
        <div style="font-size:10px;color:${DM};text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;">API Calls</div>
      </td>
      <td width="20%" bgcolor="${CD}" style="background-color:${CD};text-align:center;padding:8px 4px;">
        <div style="font-size:28px;font-weight:700;color:${W};font-family:${MN};">${tasksOk}/${uniqueTasks.length}</div>
        <div style="font-size:10px;color:${DM};text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;">Tasks OK</div>
      </td>
      <td width="20%" bgcolor="${CD}" style="background-color:${CD};text-align:center;padding:8px 4px;">
        <div style="font-size:28px;font-weight:700;color:${W};font-family:${MN};">${servicesOnline}</div>
        <div style="font-size:10px;color:${DM};text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;">Services Up</div>
      </td>
      <td width="20%" bgcolor="${CD}" style="background-color:${CD};text-align:center;padding:8px 4px;">
        <div style="font-size:28px;font-weight:700;color:${W};font-family:${MN};">${telegramTotal}</div>
        <div style="font-size:10px;color:${DM};text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;">Telegram</div>
      </td>
    </tr></table>
  </td></tr>`);

  // DIVIDER
  rows.push(divRow);

  // ROW: Activities
  let taskInner = '';
  if (uniqueTasks.length > 0) {
    taskInner = uniqueTasks.map(t =>
      `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-transform:capitalize;">${t.name}</td>` +
      `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-weight:700;">${t.success ? 'OK' : 'FAIL'}</td></tr>`
    ).join('');
  } else {
    taskInner = `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${DM};">No scheduled tasks ran today</td></tr>`;
  }
  rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
    ${sh('Activities Completed')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${taskInner}</table>
  </td></tr>`);

  // DIVIDER
  rows.push(divRow);

  // ROW: API Costs
  const modelEntries = Object.entries(costs.by_model);
  const scriptEntries = Object.entries(costs.by_script);
  let costInner = '';
  if (modelEntries.length > 0) {
    const mRows = modelEntries.map(([m, d]) =>
      `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};">${m}</td>` +
      `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${d.calls}</td>` +
      `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${fmtCost(d.cost_gbp)}</td></tr>`
    ).join('');
    costInner = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;letter-spacing:0.05em;">Model</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Calls</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Cost</td></tr>
      ${mRows}</table>`;
    if (scriptEntries.length > 0) {
      const sRows = scriptEntries.map(([s, d]) =>
        `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};">${s}</td>` +
        `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${d.calls}</td>` +
        `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${fmtCost(d.cost_gbp)}</td></tr>`
      ).join('');
      costInner += `<div style="margin-top:20px;margin-bottom:12px;font-size:11px;font-weight:700;color:${DM};letter-spacing:0.12em;text-transform:uppercase;">By Script</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${sRows}</table>`;
    }
  } else {
    costInner = `<div style="font-size:14px;color:${DM};">No API usage today</div>`;
  }
  rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
    ${sh('API Costs')}${costInner}
  </td></tr>`);

  // VOICE SYSTEM (conditional)
  const hasVoice = voice.commands > 0 || voice.convos > 0 || voice.errors > 0;
  if (hasVoice) {
    rows.push(divRow);
    let voiceInner = `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Commands</td>
      <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${voice.commands}</td></tr>
    <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Conversations</td>
      <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${voice.convos}</td></tr>`;
    if (voice.companionNuggets > 0) {
      voiceInner += `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Companion nuggets</td>
        <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${voice.companionNuggets}</td></tr>`;
    }
    voiceInner += `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Errors</td>
      <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${voice.errors}</td></tr>`;
    rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
      ${sh('Voice System')}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${voiceInner}</table>
    </td></tr>`);
  }

  // TELEGRAM GATEWAY (conditional — only shows when Telegram was used, as this is the cost channel)
  const hasTelegram = telegram.messagesIn > 0 || telegram.messagesOut > 0;
  if (hasTelegram) {
    rows.push(divRow);
    const fmtTokens = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
    let tgInner = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Messages received</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${telegram.messagesIn}</td></tr>
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Responses sent</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${telegram.messagesOut}</td></tr>
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Tool calls</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${telegram.toolCalls}</td></tr>
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Input tokens</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${fmtTokens(telegram.totalInputTokens)}</td></tr>
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Output tokens</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${fmtTokens(telegram.totalOutputTokens)}</td></tr>
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};font-weight:700;">Telegram cost</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};font-weight:700;">${fmtCost(telegram.totalCostGbp)}</td></tr>
    </table>`;
    // Model breakdown if multiple models used
    const tgModels = Object.entries(telegram.byModel);
    if (tgModels.length > 0) {
      const mRows = tgModels.map(([m, d]) =>
        `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:6px 0;font-size:13px;color:${GR};">${m}</td>` +
        `<td bgcolor="${BG}" style="background-color:${BG};padding:6px 0;font-size:13px;color:${W};text-align:center;font-family:${MN};">${d.calls}</td>` +
        `<td bgcolor="${BG}" style="background-color:${BG};padding:6px 0;font-size:13px;color:${W};text-align:right;font-family:${MN};">${fmtCost(d.cost_gbp)}</td></tr>`
      ).join('');
      tgInner += `<div style="margin-top:16px;margin-bottom:12px;font-size:11px;font-weight:700;color:${DM};letter-spacing:0.12em;text-transform:uppercase;">By Model</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;">Model</td>
              <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-align:center;text-transform:uppercase;">Calls</td>
              <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-align:right;text-transform:uppercase;">Cost</td></tr>
          ${mRows}</table>`;
    }
    rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
      ${sh('Telegram Gateway')}${tgInner}
    </td></tr>`);
  }

  // DIVIDER
  rows.push(divRow);

  // ROW: Services
  let svcInner = '';
  if (pm2.length > 0) {
    const svcR = pm2.map(p =>
      `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};">${p.name}</td>` +
      `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-transform:uppercase;">${p.status}</td>` +
      `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${fmtUptime(p.uptime)}</td>` +
      `<td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${p.memory}MB</td></tr>`
    ).join('');
    svcInner = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;letter-spacing:0.05em;">Process</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;letter-spacing:0.05em;">Status</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Uptime</td>
          <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Memory</td></tr>
      ${svcR}</table>`;
  } else {
    svcInner = `<div style="font-size:14px;color:${DM};">No PM2 processes found</div>`;
  }
  rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
    ${sh('Services')}${svcInner}
  </td></tr>`);

  // JOB PIPELINE (conditional)
  const hasJobs = jobs.found > 0 || jobs.applied > 0 || (jobs.total && jobs.total > 0);
  if (hasJobs) {
    rows.push(divRow);
    rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
      ${sh('Job Pipeline')}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Found today</td>
            <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${jobs.found}</td></tr>
        <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Applied today</td>
            <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${jobs.applied}</td></tr>
        <tr><td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${GR};">Total in pipeline</td>
            <td bgcolor="${BG}" style="background-color:${BG};padding:8px 0;font-size:14px;color:${W};text-align:right;font-family:${MN};">${jobs.total || 0}</td></tr>
      </table>
    </td></tr>`);
  }

  // 7-DAY SPEND (conditional)
  const days = Object.entries(weekly.days).sort();
  if (days.length > 1) {
    rows.push(divRow);
    const wRows = days.map(([day, data]) => {
      const dayDate = new Date(day + 'T00:00:00');
      const label = dayDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      return `<tr><td bgcolor="${BG}" style="background-color:${BG};padding:6px 0;font-size:13px;color:${GR};">${label}</td>` +
        `<td bgcolor="${BG}" style="background-color:${BG};padding:6px 0;font-size:13px;color:${W};text-align:center;font-family:${MN};">${data.calls}</td>` +
        `<td bgcolor="${BG}" style="background-color:${BG};padding:6px 0;font-size:13px;color:${W};text-align:right;font-family:${MN};">${fmtCost(data.cost_gbp)}</td></tr>`;
    }).join('');
    rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 20px ${P};">
      ${sh('7-Day Spend')}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-transform:uppercase;letter-spacing:0.05em;">Day</td>
            <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Calls</td>
            <td bgcolor="${BG}" style="background-color:${BG};padding:4px 0;font-size:11px;color:${DM};text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Cost</td></tr>
        ${wRows}
      </table>
    </td></tr>`);
  }

  // DIVIDER
  rows.push(divRow);

  // ROW: Footer
  rows.push(`<tr><td bgcolor="${BG}" style="background-color:${BG};padding:24px ${P} 32px ${P};">
    <div style="font-size:11px;color:${DM};">Claude &middot; AI Chief of Staff &middot; NAVADA<br>On behalf of Lee Akpareva</div>
    <div style="font-size:10px;color:#333;margin-top:12px;">Auto-generated by NAVADA Server &middot;
      <a href="https://www.navadarobotics.com" style="color:#444;text-decoration:none;">navadarobotics.com</a> &middot;
      <a href="https://www.navada-lab.space" style="color:#444;text-decoration:none;">navada-lab.space</a></div>
  </td></tr>`);

  const preheaderText = `${fmtCost(costs.total_cost_gbp)} spent | ${costs.total_calls} calls | ${tasksOk}/${uniqueTasks.length} tasks OK | ${servicesOnline} services | ${telegramTotal} telegram`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>NAVADA Ops Report - ${date}</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;background-color:${BG};color:${W};font-family:${FN};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;">${preheaderText}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BG}" style="background-color:${BG};border-collapse:collapse;">
${rows.join('\n')}
</table>
</body>
</html>`;
}

// ============================================================
// Send report
// ============================================================
async function sendDailyReport(date) {
  const reportDate = date || getToday();
  const rawHtml = buildReport(reportDate);

  await sendEmail({
    to: 'leeakpareva@gmail.com',
    subject: `NAVADA Ops Report — ${reportDate}`,
    rawHtml,
  });

  console.log(`Report sent for ${reportDate}`);
}

// ============================================================
// CLI
// ============================================================
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--test')) {
    const html = buildReport(getToday());
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const outPath = path.join(reportsDir, `ops-${getToday()}.html`);
    fs.writeFileSync(outPath, html);
    console.log(`Preview saved: ${outPath}`);
  } else {
    sendDailyReport(args[0]).catch(e => { console.error(e.message); process.exit(1); });
  }
}

module.exports = { sendDailyReport, buildReport };
