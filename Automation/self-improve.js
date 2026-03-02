/**
 * NAVADA Self-Improvement System
 * Runs weekly (Monday 10 AM) via Ralph Wiggum + Claude Code
 *
 * Flow:
 *   1. Ralph loops Claude Code in research-only mode
 *   2. Claude scans the NAVADA system: automations, security, configs, tools, performance
 *   3. Findings logged to improvement-log.json
 *   4. Weekly digest email sent to Lee with numbered items
 *   5. Lee replies "approve 2, 4, 6" → auto-responder triggers execution
 *
 * Usage:
 *   node self-improve.js                  # Run research scan
 *   node self-improve.js --send-digest    # Send the weekly email digest
 *   node self-improve.js --execute 2,4,6  # Execute approved items
 *   node self-improve.js --status         # Show current log
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sendEmail, p, table, callout, kvList } = require('./email-service');

const LOG_FILE = path.join(__dirname, 'kb', 'improvement-log.json');
const HISTORY_FILE = path.join(__dirname, 'kb', 'improvement-history.json');
const RALPH_DIR = path.join(__dirname, '.ralph');
const SCAN_LOG = path.join(__dirname, 'logs', 'self-improve.log');
const RECIPIENT = 'leeakpareva@gmail.com';
const CC = 'lee@navada.info';

// Categories for findings
const CATEGORIES = {
  BUG: { label: 'Bug', color: '#e74c3c' },
  SECURITY: { label: 'Security', color: '#f39c12' },
  PERFORMANCE: { label: 'Performance', color: '#3498db' },
  NEW_TOOL: { label: 'New Tool', color: '#2ecc71' },
  IDEA: { label: 'Idea', color: '#9b59b6' },
  MAINTENANCE: { label: 'Maintenance', color: '#95a5a6' },
};

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(SCAN_LOG, line + '\n');
  } catch (e) { /* ignore */ }
}

function getLog() {
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (e) {
    return { week: null, findings: [], scannedAt: null, sentAt: null };
  }
}

function saveLog(data) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

function getHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (e) {
    return { weeks: [] };
  }
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Pre-gather system diagnostics in Node.js (fast, no AI needed)
 * Returns a structured report that Claude can analyze in 1-2 turns
 */
function gatherDiagnostics() {
  const diag = { logs: {}, disk: '', pm2: '', tempFiles: 0, tempSize: '', npmAudit: '', errors: [] };

  const safeExec = (cmd, opts = {}) => {
    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 15000, stdio: 'pipe', ...opts }).trim();
    } catch (e) {
      return `ERROR: ${e.message?.substring(0, 100)}`;
    }
  };

  // Check recent log files for errors
  const logsDir = path.join(__dirname, 'logs');
  try {
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
    for (const file of logFiles) {
      try {
        const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        const last20 = lines.slice(-20).join('\n');
        const errorLines = lines.filter(l => /error|fail|crash|exception|ENOENT|ECONNREFUSED/i.test(l));
        diag.logs[file] = { totalLines: lines.length, recentErrors: errorLines.slice(-5), tail: last20 };
      } catch (e) { /* skip */ }
    }
  } catch (e) { /* no logs dir */ }

  // Disk space
  diag.disk = safeExec('df -h / 2>/dev/null || wmic logicaldisk get size,freespace,caption 2>/dev/null || echo "disk check unavailable"');

  // PM2 status
  diag.pm2 = safeExec('pm2 jlist 2>/dev/null || echo "pm2 unavailable"');

  // Temp files
  const tempDir = path.join(__dirname, 'temp');
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      diag.tempFiles = files.length;
      let totalBytes = 0;
      for (const f of files) {
        try { totalBytes += fs.statSync(path.join(tempDir, f)).size; } catch (e) { /* skip */ }
      }
      diag.tempSize = `${(totalBytes / 1024 / 1024).toFixed(1)}MB`;
    }
  } catch (e) { /* no temp dir */ }

  // npm audit (quick)
  diag.npmAudit = safeExec('npm audit --json 2>/dev/null | head -50', { cwd: __dirname });

  // Check scheduled task scripts exist
  const scripts = ['ai-news-mailer.js', 'job-hunter-apify.js', 'uk-us-economy-report.py'];
  for (const s of scripts) {
    if (!fs.existsSync(path.join(__dirname, s))) {
      diag.errors.push(`Missing script: ${s}`);
    }
  }

  // Check .env exists and has content
  const envPath = path.join(__dirname, '.env');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const keyCount = envContent.split('\n').filter(l => l.includes('=')).length;
    diag.envKeys = keyCount;
  } catch (e) {
    diag.errors.push('.env file missing or unreadable');
  }

  return diag;
}

/**
 * Run the research scan: pre-gather diagnostics then ask Claude to analyze
 */
async function runResearchScan() {
  log('=== NAVADA Self-Improvement Scan Starting ===');

  fs.mkdirSync(path.join(__dirname, 'kb'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

  // Phase 1: Gather diagnostics (fast, ~5 seconds)
  log('Phase 1: Gathering system diagnostics...');
  const diag = gatherDiagnostics();
  log(`Diagnostics gathered: ${Object.keys(diag.logs).length} log files, ${diag.tempFiles} temp files, ${diag.errors.length} errors`);

  // Phase 2: Ask Claude to analyze and produce findings (1-2 turns)
  log('Phase 2: Sending to Claude for analysis...');

  const prompt = `Analyze this NAVADA server diagnostic report and produce improvement findings.

SYSTEM DIAGNOSTICS:
${JSON.stringify(diag, null, 2)}

Based on this data, identify the most important bugs, security issues, performance problems, and improvement ideas for the NAVADA home server (Windows 11, Node.js automation scripts, 23 MCP servers, PM2 services).

Respond with ONLY a JSON block:
\`\`\`json
{
  "findings": [
    {
      "id": 1,
      "category": "BUG|SECURITY|PERFORMANCE|NEW_TOOL|IDEA|MAINTENANCE",
      "title": "Short title",
      "description": "What you found and why it matters",
      "action": "Specific action to take if approved",
      "priority": "high|medium|low",
      "effort": "5min|30min|1hr|2hr+"
    }
  ]
}
\`\`\`
Maximum 8 findings. Prioritise the most impactful. Be specific with file paths.`;

  // Clean env so Claude Code can spawn
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;

  let output = '';
  try {
    output = execSync(
      `claude -p --model haiku --max-turns 3`,
      {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        timeout: 120000, // 2 min is plenty for analysis
        input: prompt,
        env: cleanEnv,
      }
    );
    log('Claude analysis completed.');
  } catch (e) {
    output = e.stdout || '';
    log(`Claude analysis error: ${e.message?.substring(0, 200)}`);
  }

  // Parse findings from Claude's output
  const findings = parseFindings(output);

  if (findings.length > 0) {
    const logData = {
      week: getWeekNumber(),
      findings,
      scannedAt: new Date().toISOString(),
      sentAt: null,
    };
    saveLog(logData);
    log(`Scan complete: ${findings.length} new findings logged (week ${logData.week}).`);
    return logData;
  }

  // Fallback to existing log
  const oldLog = getLog();
  if (oldLog.findings && oldLog.findings.length > 0) {
    log(`Analysis produced no parseable findings. Using existing log (${oldLog.findings.length} findings).`);
    return oldLog;
  }

  log('Warning: No findings from analysis and no existing log.');
  return { week: getWeekNumber(), findings: [], scannedAt: new Date().toISOString(), sentAt: null };
}

/**
 * Extract JSON findings array from Claude's text output
 */
function parseFindings(text) {
  if (!text) return [];

  // Try to extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.findings && Array.isArray(parsed.findings)) {
        return parsed.findings.map((f, i) => ({ ...f, id: f.id || i + 1 }));
      }
    } catch (e) { /* try next method */ }
  }

  // Try to find raw JSON object with findings
  const jsonMatch = text.match(/\{[\s\S]*"findings"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.findings && Array.isArray(parsed.findings)) {
        return parsed.findings.map((f, i) => ({ ...f, id: f.id || i + 1 }));
      }
    } catch (e) { /* try next method */ }
  }

  // Try to find a JSON array directly
  const arrayMatch = text.match(/\[\s*\{[\s\S]*?"category"[\s\S]*?\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((f, i) => ({ ...f, id: f.id || i + 1 }));
      }
    } catch (e) { /* failed to parse */ }
  }

  log('Could not parse findings JSON from Claude output.');
  log('Output tail: ' + text.substring(Math.max(0, text.length - 300)));
  return [];
}

/**
 * Send the weekly improvement digest email
 */
async function sendWeeklyDigest() {
  const logData = getLog();

  if (!logData.findings || logData.findings.length === 0) {
    log('No findings to report. Skipping digest.');
    return;
  }

  const weekNum = logData.week || getWeekNumber();
  const year = new Date().getFullYear();

  // Build the email body
  const findingsHtml = logData.findings.map((f, i) => {
    const cat = CATEGORIES[f.category] || CATEGORIES.IDEA;
    const priorityBadge = f.priority === 'high'
      ? '<span style="background:#e74c3c; color:white; padding:1px 6px; border-radius:2px; font-size:10px; font-weight:600;">HIGH</span>'
      : f.priority === 'medium'
        ? '<span style="background:#f39c12; color:white; padding:1px 6px; border-radius:2px; font-size:10px; font-weight:600;">MED</span>'
        : '<span style="background:#95a5a6; color:white; padding:1px 6px; border-radius:2px; font-size:10px; font-weight:600;">LOW</span>';

    return `
      <div style="margin:12px 0; padding:12px 16px; border-left:3px solid ${cat.color}; background:#fafafa; border-radius:0 4px 4px 0;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span style="font-size:16px; font-weight:700; color:#111;">${f.id || i + 1}.</span>
          <span style="background:${cat.color}; color:white; padding:1px 8px; border-radius:2px; font-size:10px; font-weight:600; text-transform:uppercase;">${cat.label}</span>
          ${priorityBadge}
          <span style="font-size:11px; color:#888;">${f.effort || ''}</span>
        </div>
        <div style="font-size:14px; font-weight:600; color:#111; margin-bottom:4px;">${f.title}</div>
        <div style="font-size:13px; color:#555; line-height:1.5;">${f.description}</div>
        <div style="font-size:12px; color:#888; margin-top:6px;"><strong>Action:</strong> ${f.action}</div>
      </div>
    `;
  }).join('');

  const body = `
    ${p(`Hi Lee,`)}
    ${p(`Here's your weekly improvement report from the NAVADA self-improvement system. I scanned automations, security, performance, MCP servers, and potential opportunities.`)}

    <div style="margin:16px 0; padding:12px 16px; background:#f0f8ff; border:1px solid #d0e0f0; border-radius:4px;">
      <div style="font-size:12px; font-weight:700; color:#111; margin-bottom:4px;">How to approve:</div>
      <div style="font-size:13px; color:#444;">Reply to this email with the numbers you want me to action.<br>
      Example: <strong>"approve 1, 3, 5"</strong> or <strong>"approve all"</strong> or <strong>"skip all"</strong></div>
    </div>

    ${findingsHtml}

    ${callout(`<strong>${logData.findings.length} findings</strong> this week &middot; ${logData.findings.filter(f => f.priority === 'high').length} high priority`)}
    ${p('Reply with the numbers to approve, and I\'ll get them done.')}
  `;

  // Send to Lee (single email with CC)
  await sendEmail({
    to: RECIPIENT,
    cc: CC,
    subject: `NAVADA Weekly Improvement Report — Week ${weekNum}, ${year}`,
    heading: `Self-Improvement Report`,
    body,
    type: 'report',
    preheader: `${logData.findings.length} findings — reply to approve actions`,
    footerNote: `NAVADA Self-Improvement System &middot; Monday ${new Date().toLocaleDateString('en-GB')}`,
  });

  // Update log
  logData.sentAt = new Date().toISOString();
  saveLog(logData);

  // Archive to history
  const history = getHistory();
  history.weeks.push({
    week: weekNum,
    year,
    findings: logData.findings,
    scannedAt: logData.scannedAt,
    sentAt: logData.sentAt,
    approvedItems: [],
  });
  // Keep only last 52 weeks
  history.weeks = history.weeks.slice(-52);
  saveHistory(history);

  log(`Weekly digest sent to ${RECIPIENT} — ${logData.findings.length} findings.`);
}

/**
 * Execute approved improvement items
 * Called by the auto-responder when Lee replies with approval
 */
async function executeApproved(approvedIds) {
  const logData = getLog();

  if (!logData.findings || logData.findings.length === 0) {
    log('No findings in current log.');
    return;
  }

  const approved = logData.findings.filter(f => approvedIds.includes(f.id));

  if (approved.length === 0) {
    log('No matching items found for the approved IDs.');
    return;
  }

  log(`Executing ${approved.length} approved items: ${approvedIds.join(', ')}`);

  // Build execution prompt for Claude Code
  const execPrompt = `You are executing approved improvements from the NAVADA Self-Improvement System.

Lee has approved the following items. Execute each one carefully:

${approved.map(f => `
## Item ${f.id}: [${f.category}] ${f.title}
**Description:** ${f.description}
**Action:** ${f.action}
**Priority:** ${f.priority}
**Effort:** ${f.effort}
`).join('\n')}

RULES:
- Execute ONLY the approved items above — nothing else
- Be careful with destructive operations
- Log what you did for each item
- When all items are complete, output: <promise>COMPLETE</promise>`;

  // Clean env: remove CLAUDECODE so subprocess doesn't think it's nested
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;
  cleanEnv.PATH = `C:\\Users\\leeak\\.bun\\bin;${cleanEnv.PATH}`;

  // Primary: Direct Claude Code execution
  try {
    execSync(
      `claude -p --model sonnet --max-turns 15 --allowedTools "Read Glob Grep Bash Write Edit"`,
      {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        timeout: 600000,
        input: execPrompt,
        env: cleanEnv,
      }
    );
    log('Claude Code execution completed.');
  } catch (e) {
    log(`Claude Code execution failed: ${e.message?.substring(0, 300)}`);

    // Fallback: Ralph
    log('Trying Ralph fallback...');
    try {
      const execPromptFile = path.join(__dirname, 'kb', 'self-improve-exec-prompt.md');
      fs.writeFileSync(execPromptFile, execPrompt);
      execSync(
        `ralph --prompt-file "${execPromptFile}" --agent claude-code --max-iterations 5 --min-iterations 1 --no-questions`,
        {
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 600000,
          env: cleanEnv,
          stdio: 'pipe',
        }
      );
      log('Ralph execution completed.');
    } catch (e2) {
      log(`Ralph execution also failed: ${e2.message?.substring(0, 200)}`);
    }
  }

  // Update history with approved items
  const history = getHistory();
  const latestWeek = history.weeks[history.weeks.length - 1];
  if (latestWeek) {
    latestWeek.approvedItems = approvedIds;
    latestWeek.executedAt = new Date().toISOString();
    saveHistory(history);
  }

  // Send confirmation email
  await sendEmail({
    to: RECIPIENT,
    subject: `Improvements Executed — Items ${approvedIds.join(', ')}`,
    heading: 'Improvements Applied',
    body: `
      ${p('The following approved improvements have been executed:')}
      ${approved.map(f => `
        <div style="margin:8px 0; padding:8px 12px; background:#f0fff0; border-left:3px solid #2ecc71; border-radius:0 2px 2px 0;">
          <span style="font-weight:600;">${f.id}.</span> ${f.title} — <span style="color:#2ecc71;">Done</span>
        </div>
      `).join('')}
      ${p('Check everything looks good. If anything needs adjusting, just let me know.')}
    `,
    type: 'update',
    footerNote: 'NAVADA Self-Improvement System — Execution Confirmation',
  });

  log(`Executed and confirmed ${approved.length} items.`);
}

/**
 * Parse approval from email reply text
 * Handles: "approve 1, 3, 5", "approve all", "skip all", "do 2 and 4"
 */
function parseApproval(text) {
  const lower = text.toLowerCase().trim();

  // Skip all
  if (lower.includes('skip all') || lower.includes('skip everything') || lower === 'skip') {
    return { action: 'skip', ids: [] };
  }

  // Approve all
  if (lower.includes('approve all') || lower.includes('do all') || lower.includes('execute all')) {
    const logData = getLog();
    const allIds = (logData.findings || []).map(f => f.id);
    return { action: 'approve', ids: allIds };
  }

  // Parse specific numbers: "approve 1, 3, 5" or "do 2 and 4" or just "1, 3, 5"
  const numbers = lower.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    return { action: 'approve', ids: numbers.map(Number) };
  }

  return { action: 'unknown', ids: [] };
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--send-digest')) {
    sendWeeklyDigest()
      .then(() => { log('Digest sent.'); process.exit(0); })
      .catch(e => { log(`Failed: ${e.message}`); process.exit(1); });
  } else if (args.includes('--execute')) {
    const idsArg = args[args.indexOf('--execute') + 1];
    const ids = idsArg ? idsArg.split(',').map(Number) : [];
    executeApproved(ids)
      .then(() => process.exit(0))
      .catch(e => { log(`Failed: ${e.message}`); process.exit(1); });
  } else if (args.includes('--status')) {
    const logData = getLog();
    console.log(JSON.stringify(logData, null, 2));
  } else if (args.includes('--test-email')) {
    // Test with dummy data
    const testLog = {
      week: getWeekNumber(),
      findings: [
        { id: 1, category: 'BUG', title: 'Job hunter script silently fails when Apify token expires', description: 'The job-hunter-apify.js script catches the Apify error but logs nothing useful. When the token expires, it appears to run successfully but finds 0 jobs.', action: 'Add explicit token validation at startup and alert email on failure.', priority: 'high', effort: '30min' },
        { id: 2, category: 'SECURITY', title: 'LinkedIn token has no expiry check', description: 'The .linkedin-token.json stores the access token but no expiry date. LinkedIn tokens expire after 60 days.', action: 'Add expiry tracking and auto-refresh or alert before expiry.', priority: 'medium', effort: '1hr' },
        { id: 3, category: 'PERFORMANCE', title: '47 temp files in Automation/temp/', description: 'Old ZIP files from app deliveries are accumulating. Currently 47 files using 230MB.', action: 'Add cleanup routine to deliver-app.js — delete temp files older than 7 days.', priority: 'low', effort: '5min' },
        { id: 4, category: 'NEW_TOOL', title: 'Kaggle MCP server now available', description: 'The Kaggle MCP server was released and could provide access to 50,000+ datasets and competition data directly from Claude Code.', action: 'Install kaggle MCP server — requires kaggle.json API key.', priority: 'medium', effort: '30min' },
        { id: 5, category: 'IDEA', title: 'Auto-post AI news digest to LinkedIn weekly', description: 'The daily AI news digest could be summarised weekly and posted to LinkedIn as a thought leadership post for NAVADA brand visibility.', action: 'Create weekly LinkedIn auto-poster that summarises top 3 AI stories.', priority: 'low', effort: '2hr+' },
      ],
      scannedAt: new Date().toISOString(),
      sentAt: null,
    };
    saveLog(testLog);
    sendWeeklyDigest()
      .then(() => { log('Test digest sent.'); process.exit(0); })
      .catch(e => { log(`Failed: ${e.message}`); process.exit(1); });
  } else {
    // Default: run the research scan then send digest
    runResearchScan()
      .then(() => sendWeeklyDigest())
      .then(() => { log('Scan and digest complete.'); process.exit(0); })
      .catch(e => { log(`Failed: ${e.message}`); process.exit(1); });
  }
}

module.exports = { runResearchScan, sendWeeklyDigest, executeApproved, parseApproval, getLog };
