/**
 * NAVADA Daily Operations Report
 * Aggregates all server activity, costs, and ROI into a branded email.
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
const { sendEmail, p } = require('../Automation/email-service');

const LOGS_DIR = path.join(__dirname, '..', 'Automation', 'logs');
const VOICE_LOG = path.join(__dirname, '..', 'Automation', 'logs', 'voice-command.log');
const PM2_VOICE_LOG = path.join(process.env.USERPROFILE || 'C:\\Users\\leeak', '.pm2', 'logs', 'voice-command-out.log');
const JOBS_TRACKER = path.join(__dirname, '..', 'Automation', 'jobs-tracker.json');

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
      if (line.includes('error') || line.includes('Error')) stats.errors++;
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
// Build HTML Report
// ============================================================
function buildReport(date) {
  const costs = getDailySummary(date);
  const weekly = getWeeklySummary();
  const tasks = scanTaskLogs(date);
  const voice = scanVoiceActivity(date);
  const jobs = scanJobActivity(date);
  const pm2 = getPM2Status();

  const roiColor = costs.roi_multiplier >= 100 ? '#22c55e' : costs.roi_multiplier >= 10 ? '#eab308' : '#ef4444';

  // ROI bar chart (last 7 days)
  let roiChart = '';
  const days = Object.entries(weekly.days).sort();
  if (days.length > 0) {
    const maxHuman = Math.max(...days.map(([, d]) => d.human_cost_gbp), 1);
    roiChart = days.map(([day, data]) => {
      const aiWidth = Math.max(2, Math.round(data.cost_gbp / maxHuman * 300));
      const humanWidth = Math.max(2, Math.round(data.human_cost_gbp / maxHuman * 300));
      const dayLabel = day.slice(5); // MM-DD
      return `
        <tr>
          <td style="color:#888;font-size:12px;padding:2px 8px 2px 0;white-space:nowrap">${dayLabel}</td>
          <td style="padding:2px 0">
            <div style="background:#22c55e;height:14px;width:${aiWidth}px;border-radius:3px;display:inline-block" title="AI: £${data.cost_gbp.toFixed(3)}"></div>
            <span style="color:#22c55e;font-size:11px;margin-left:4px">£${data.cost_gbp.toFixed(3)}</span>
          </td>
        </tr>
        <tr>
          <td></td>
          <td style="padding:0 0 6px 0">
            <div style="background:#ef4444;height:14px;width:${humanWidth}px;border-radius:3px;display:inline-block" title="Human: £${data.human_cost_gbp.toFixed(0)}"></div>
            <span style="color:#ef4444;font-size:11px;margin-left:4px">£${data.human_cost_gbp.toFixed(0)}</span>
          </td>
        </tr>`;
    }).join('');
  }

  // Model breakdown table
  const modelRows = Object.entries(costs.by_model).map(([model, data]) => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#ccc">${model}</td>
      <td style="padding:4px 12px;color:#fff;text-align:right">${data.calls}</td>
      <td style="padding:4px 12px;color:#22c55e;text-align:right">£${data.cost_gbp.toFixed(4)}</td>
      <td style="padding:4px 12px;color:#888;text-align:right">${data.human_mins}m</td>
    </tr>`).join('');

  // Script breakdown
  const scriptRows = Object.entries(costs.by_script).map(([script, data]) => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#ccc">${script}</td>
      <td style="padding:4px 12px;color:#fff;text-align:right">${data.calls}</td>
      <td style="padding:4px 12px;color:#22c55e;text-align:right">£${data.cost_gbp.toFixed(4)}</td>
    </tr>`).join('');

  // Task status
  const taskRows = tasks.map(t => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#ccc">${t.name}</td>
      <td style="padding:4px 12px;color:${t.success ? '#22c55e' : '#ef4444'}">${t.success ? 'OK' : 'FAILED'}</td>
    </tr>`).join('') || '<tr><td style="color:#666;padding:4px">No scheduled tasks ran today</td></tr>';

  // PM2 status
  const pm2Rows = pm2.map(p => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#ccc">${p.name}</td>
      <td style="padding:4px 12px;color:${p.status === 'online' ? '#22c55e' : '#ef4444'}">${p.status}</td>
      <td style="padding:4px 12px;color:#888">${p.uptime}m</td>
      <td style="padding:4px 12px;color:#888">${p.memory}MB</td>
    </tr>`).join('');

  const html = `
    <div style="font-family:'Courier New',monospace;max-width:640px;margin:0 auto;background:#0a0a0a;padding:32px;border:1px solid #222;border-radius:8px">

      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#fff;font-size:20px;margin:0">NAVADA OPS REPORT</h1>
        <p style="color:#666;font-size:13px;margin:4px 0">${date} | Generated ${new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <!-- ROI HERO -->
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:20px;margin-bottom:20px;text-align:center">
        <div style="font-size:48px;font-weight:bold;color:${roiColor}">${costs.roi_multiplier}x</div>
        <div style="color:#888;font-size:13px;margin-top:4px">ROI — AI vs Human Cost</div>
        <div style="display:flex;justify-content:center;gap:40px;margin-top:16px">
          <div>
            <div style="color:#22c55e;font-size:24px;font-weight:bold">£${costs.total_cost_gbp.toFixed(3)}</div>
            <div style="color:#888;font-size:11px">AI COST</div>
          </div>
          <div>
            <div style="color:#ef4444;font-size:24px;font-weight:bold">£${costs.total_human_cost_gbp}</div>
            <div style="color:#888;font-size:11px">HUMAN COST</div>
          </div>
          <div>
            <div style="color:#fff;font-size:24px;font-weight:bold">${costs.total_calls}</div>
            <div style="color:#888;font-size:11px">API CALLS</div>
          </div>
        </div>
      </div>

      <!-- 7-DAY COST CHART -->
      ${roiChart ? `
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 12px 0">7-Day Cost Comparison
          <span style="color:#22c55e;font-size:11px">■ AI</span>
          <span style="color:#ef4444;font-size:11px;margin-left:8px">■ Human</span>
        </h3>
        <table style="width:100%">${roiChart}</table>
      </div>` : ''}

      <!-- MODEL BREAKDOWN -->
      ${modelRows ? `
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">API Usage by Model</h3>
        <table style="width:100%;font-size:13px">
          <tr style="color:#666;font-size:11px"><td>Model</td><td style="text-align:right">Calls</td><td style="text-align:right">Cost</td><td style="text-align:right">Human Equiv</td></tr>
          ${modelRows}
        </table>
      </div>` : ''}

      <!-- SCRIPT BREAKDOWN -->
      ${scriptRows ? `
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">Usage by Script</h3>
        <table style="width:100%;font-size:13px">
          ${scriptRows}
        </table>
      </div>` : ''}

      <!-- VOICE SYSTEM -->
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">Voice System (S8 Bluetooth)</h3>
        <table style="font-size:13px">
          <tr><td style="color:#888;padding:2px 16px 2px 0">Commands processed</td><td style="color:#fff">${voice.commands}</td></tr>
          <tr><td style="color:#888;padding:2px 16px 2px 0">Conversations</td><td style="color:#fff">${voice.convos}</td></tr>
          <tr><td style="color:#888;padding:2px 16px 2px 0">Companion nuggets</td><td style="color:#fff">${voice.companionNuggets}</td></tr>
          <tr><td style="color:#888;padding:2px 16px 2px 0">Ignored (no wake word)</td><td style="color:#666">${voice.ignored}</td></tr>
          <tr><td style="color:#888;padding:2px 16px 2px 0">Errors</td><td style="color:${voice.errors > 0 ? '#ef4444' : '#22c55e'}">${voice.errors}</td></tr>
        </table>
      </div>

      <!-- SCHEDULED TASKS -->
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">Scheduled Tasks</h3>
        <table style="font-size:13px">${taskRows}</table>
      </div>

      <!-- JOB HUNT -->
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">Job Pipeline</h3>
        <table style="font-size:13px">
          <tr><td style="color:#888;padding:2px 16px 2px 0">New jobs found today</td><td style="color:#fff">${jobs.found}</td></tr>
          <tr><td style="color:#888;padding:2px 16px 2px 0">Applied today</td><td style="color:#fff">${jobs.applied}</td></tr>
          <tr><td style="color:#888;padding:2px 16px 2px 0">Total in pipeline</td><td style="color:#fff">${jobs.total || 0}</td></tr>
        </table>
      </div>

      <!-- PM2 DAEMONS -->
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:20px">
        <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">PM2 Daemons</h3>
        <table style="width:100%;font-size:13px">
          <tr style="color:#666;font-size:11px"><td>Process</td><td>Status</td><td>Uptime</td><td>Memory</td></tr>
          ${pm2Rows}
        </table>
      </div>

      <div style="text-align:center;color:#333;font-size:11px;margin-top:24px">
        NAVADA Server • ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>`;

  return html;
}

// ============================================================
// Send report
// ============================================================
async function sendDailyReport(date) {
  const reportDate = date || getToday();
  const html = buildReport(reportDate);

  await sendEmail({
    to: 'leeakpareva@gmail.com',
    subject: `NAVADA Ops Report — ${reportDate}`,
    heading: 'Daily Operations Report',
    body: html,
    type: 'update',
    footerNote: 'Auto-generated by NAVADA Manager',
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
    const outPath = path.join(__dirname, 'reports', `ops-${getToday()}.html`);
    fs.writeFileSync(outPath, `<html><body style="background:#000;padding:20px">${html}</body></html>`);
    console.log(`Preview saved: ${outPath}`);
  } else {
    sendDailyReport(args[0]).catch(e => { console.error(e.message); process.exit(1); });
  }
}

module.exports = { sendDailyReport, buildReport };
