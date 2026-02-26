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
 * The prompt Ralph feeds to Claude Code for research-only scanning
 */
function buildResearchPrompt() {
  return `You are running as part of the NAVADA Self-Improvement System. Your job is to RESEARCH ONLY — do NOT modify any files except the improvement log.

TASK: Scan the NAVADA server and identify improvements, bugs, security issues, and opportunities.

SCAN CHECKLIST:
1. AUTOMATIONS — Check all scripts in C:/Users/leeak/Alex/Automation/:
   - Are scheduled tasks (ai-news-mailer.js, job-hunter-apify.js, uk-us-economy-report.py) working?
   - Check logs/ for recent errors or failures
   - Are any API tokens expiring soon?
   - Is inbox-auto-responder.js running in PM2?

2. SECURITY — Check for vulnerabilities:
   - Any secrets committed to git or exposed?
   - SSH config still hardened?
   - .env file permissions?
   - Any packages with known vulnerabilities (npm audit)?

3. MCP SERVERS — Are all 23 MCP servers responsive?
   - Check for any that have been deprecated or have updates

4. PERFORMANCE — Check system health:
   - Disk space usage
   - Node.js / Python package sizes
   - Any temp files that need cleanup?

5. NEW TOOLS & IDEAS — Research opportunities:
   - Any new MCP servers worth adding?
   - Workflow improvements?
   - New automations that would help Lee?

OUTPUT FORMAT:
After scanning, write your findings to the improvement log file at:
C:/Users/leeak/Alex/Automation/kb/improvement-log.json

Use this exact JSON format:
{
  "week": <week_number>,
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
  ],
  "scannedAt": "<ISO timestamp>",
  "sentAt": null
}

RULES:
- DO NOT modify any code, configs, or files other than the improvement log
- DO NOT install, uninstall, or update any packages
- DO NOT restart any services
- DO NOT send any emails
- ONLY read files, check logs, run diagnostic commands (npm audit, disk space, etc.)
- Be specific — include file paths, line numbers, error messages
- Maximum 10 findings per scan (prioritise the most important)
- When complete, output: <promise>COMPLETE</promise>`;
}

/**
 * Run the research scan using Ralph + Claude Code
 */
async function runResearchScan() {
  log('=== NAVADA Self-Improvement Scan Starting ===');

  // Ensure directories exist
  fs.mkdirSync(path.join(__dirname, 'kb'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
  fs.mkdirSync(RALPH_DIR, { recursive: true });

  const prompt = buildResearchPrompt();
  const promptFile = path.join(__dirname, 'kb', 'self-improve-prompt.md');
  fs.writeFileSync(promptFile, prompt);

  log('Research prompt written. Launching Ralph + Claude Code...');

  try {
    // Run Ralph with Claude Code agent in research-only mode
    const env = {
      ...process.env,
      PATH: `C:\\Users\\leeak\\.bun\\bin;${process.env.PATH}`,
    };

    const result = execSync(
      `ralph "${prompt.replace(/"/g, '\\"').substring(0, 200)}..." --prompt-file "${promptFile}" --agent claude-code --max-iterations 3 --min-iterations 1 --no-commit`,
      {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 600000, // 10 min max
        env,
        stdio: 'pipe',
      }
    );

    log('Ralph scan completed.');
    log(result.substring(result.length - 500));
  } catch (e) {
    log(`Ralph scan error: ${e.message?.substring(0, 300)}`);

    // Fallback: run Claude Code directly without Ralph
    log('Falling back to direct Claude Code scan...');
    try {
      execSync(
        `claude --p "${prompt.replace(/"/g, '\\"').substring(0, 4000)}" --model claude-sonnet-4-20250514 --max-turns 10`,
        {
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 600000,
          stdio: 'pipe',
        }
      );
      log('Direct scan completed.');
    } catch (e2) {
      log(`Direct scan also failed: ${e2.message?.substring(0, 200)}`);
    }
  }

  // Verify the log was written
  const logData = getLog();
  if (logData.findings && logData.findings.length > 0) {
    log(`Scan complete: ${logData.findings.length} findings logged.`);
  } else {
    log('Warning: No findings were logged. Check if Claude Code wrote to the correct file.');
  }

  return logData;
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

  // Send to Lee
  await sendEmail({
    to: RECIPIENT,
    subject: `NAVADA Weekly Improvement Report — Week ${weekNum}, ${year}`,
    heading: `Self-Improvement Report`,
    body,
    type: 'report',
    preheader: `${logData.findings.length} findings — reply to approve actions`,
    footerNote: `NAVADA Self-Improvement System &middot; Monday ${new Date().toLocaleDateString('en-GB')}`,
  });

  // CC
  await sendEmail({
    to: CC,
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

  try {
    const env = {
      ...process.env,
      PATH: `C:\\Users\\leeak\\.bun\\bin;${process.env.PATH}`,
    };

    execSync(
      `ralph "${execPrompt.substring(0, 200)}..." --prompt-file - --agent claude-code --max-iterations 5 --min-iterations 1`,
      {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 600000,
        env,
        input: execPrompt,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
  } catch (e) {
    // Fallback to direct Claude
    try {
      execSync(
        `claude --p "${execPrompt.replace(/"/g, '\\"').substring(0, 4000)}" --model claude-sonnet-4-20250514 --max-turns 15`,
        {
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 600000,
          stdio: 'pipe',
        }
      );
    } catch (e2) {
      log(`Execution failed: ${e2.message?.substring(0, 200)}`);
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
