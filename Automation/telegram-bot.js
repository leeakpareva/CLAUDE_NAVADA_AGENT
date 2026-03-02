/**
 * NAVADA Telegram Bot — Claude Chief of Staff
 * Full server control via Anthropic Claude with tool use.
 * 30+ slash commands, model switching, cost tracking, email sending.
 * Secured by Telegram user ID whitelist.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;

// --- Config ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = Number(process.env.TELEGRAM_OWNER_ID);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const NAVADA_DIR = 'C:/Users/leeak/CLAUDE_NAVADA_AGENT';
const LOG_DIR = path.join(NAVADA_DIR, 'Automation/logs');
const MAX_MSG_LEN = 4000;
const MAX_TOOL_LOOPS = 10;

// --- Cost Tracker ---
let costTracker;
try {
  costTracker = require('../Manager/cost-tracker');
} catch (e) {
  console.warn('[WARN] Cost tracker not available:', e.message);
  costTracker = { logCall: () => ({}) };
}

// --- Email Service ---
let emailService;
try {
  emailService = require('./email-service');
} catch (e) {
  console.warn('[WARN] Email service not available:', e.message);
  emailService = null;
}

// --- OpenAI for Image Generation ---
let OpenAI;
try {
  OpenAI = require('openai');
} catch (e) {
  console.warn('[WARN] OpenAI SDK not available:', e.message);
}
const openai = OpenAI && process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// --- IMAP for Email Reading ---
let imapSimple, mailparser;
try {
  imapSimple = require('imap-simple');
  mailparser = require('mailparser');
} catch (e) {
  console.warn('[WARN] IMAP not available:', e.message);
}

const imapConfig = {
  imap: {
    user: process.env.ZOHO_USER,
    password: process.env.ZOHO_APP_PASSWORD,
    host: 'imap.zoho.eu',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
};

// --- Model Config ---
const MODELS = {
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};
let currentModel = MODELS.sonnet;
let currentModelName = 'Sonnet 4';

// --- Init ---
const bot = new Telegraf(BOT_TOKEN);
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

// --- Persistent Conversation Memory ---
const MEMORY_FILE = path.join(NAVADA_DIR, 'Automation/kb/telegram-memory.json');
const MAX_HISTORY = 30;

function loadConversationHistory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
      return data.history || [];
    }
  } catch {}
  return [];
}

function saveConversationHistory(history) {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({
      updated: new Date().toISOString(),
      model: currentModelName,
      history: history.slice(-MAX_HISTORY * 2),
    }, null, 2));
  } catch (e) {
    console.warn('[WARN] Failed to save memory:', e.message);
  }
}

// Load persistent history on startup
const conversationHistory = loadConversationHistory();
console.log(`[NAVADA] Loaded ${conversationHistory.length} conversation turns from memory`);

// Command log
const cmdLogPath = path.join(LOG_DIR, 'telegram-commands.log');

// --- Security: Owner-only middleware ---
bot.use((ctx, next) => {
  if (ctx.from?.id !== OWNER_ID) {
    console.log(`[BLOCKED] Unauthorized: ${ctx.from?.id} (${ctx.from?.username})`);
    return ctx.reply('Access denied. This bot is private.');
  }
  return next();
});

// --- Helpers ---
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(cmdLogPath, line); } catch {}
  console.log(msg);
}

function runShell(command, timeout = 60000) {
  return new Promise((resolve) => {
    if (!command || typeof command !== 'string') {
      resolve('Error: command must be a non-empty string');
      return;
    }
    exec(command, { timeout, shell: 'bash', cwd: NAVADA_DIR, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && !stdout && !stderr) {
        resolve(`Error: ${err.message}`);
      } else {
        resolve((stdout || '') + (stderr ? `\nSTDERR: ${stderr}` : ''));
      }
    });
  });
}

function truncate(text, max = MAX_MSG_LEN) {
  if (!text) return '(empty)';
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n\n... [truncated]';
}

async function sendLong(ctx, text, parseMode) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_MSG_LEN));
    remaining = remaining.slice(MAX_MSG_LEN);
  }
  for (const chunk of chunks.slice(0, 5)) {
    try {
      if (parseMode) {
        await ctx.reply(chunk, { parse_mode: parseMode });
      } else {
        await ctx.reply(chunk);
      }
    } catch (e) {
      // If parse mode fails, send as plain text
      await ctx.reply(chunk);
    }
  }
  if (chunks.length > 5) {
    await ctx.reply(`... [${chunks.length - 5} more chunks truncated]`);
  }
}

// --- Claude Tools (what Claude can do on the server) ---
const TOOLS = [
  {
    name: 'run_shell',
    description: 'Execute a bash command on the NAVADA HP server. Use for: pm2, git, node, docker, pip, npm, tailscale, system commands, running scripts, checking processes, network status, etc. Working directory is C:/Users/leeak/CLAUDE_NAVADA_AGENT. Shell is bash (Git Bash on Windows). Use py for python. IMPORTANT: command must be a non-empty string.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The bash command to execute (required, must be a string)' },
        timeout: { type: 'number', description: 'Timeout in ms (default 60000, max 120000)' }
      },
      required: ['command']
    }
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file on the server. Use absolute paths like C:/Users/leeak/...',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute file path to read' },
        max_lines: { type: 'number', description: 'Max lines to return (default 200)' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file on the server. Use for creating scripts, configs, updating files. Use absolute paths.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute file path to write' },
        content: { type: 'string', description: 'File content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_files',
    description: 'List files and directories at a given path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to list' },
        pattern: { type: 'string', description: 'Optional glob pattern filter (e.g. *.js)' }
      },
      required: ['path']
    }
  },
  {
    name: 'server_status',
    description: 'Get current server health: CPU, RAM, uptime, disk, PM2 processes, Tailscale, Docker status. No parameters needed.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'send_email',
    description: 'Send a NAVADA-branded email from Claude\'s Zoho account (claude.navada@zohomail.eu). Can send to any recipient. Use for reports, alerts, presentations, updates. Lee\'s email is leeakpareva@gmail.com.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'HTML body content (will be wrapped in NAVADA template)' },
        type: { type: 'string', description: 'Email type: report, digest, alert, update, general', enum: ['report', 'digest', 'alert', 'update', 'general'] },
        raw_html: { type: 'string', description: 'Full custom HTML (bypasses template). Use for creative/visual emails.' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'read_inbox',
    description: 'Read emails from Claude\'s Zoho inbox (claude.navada@zohomail.eu). Can check recent unread emails, search by subject/sender. Returns from, subject, date, and body snippet.',
    input_schema: {
      type: 'object',
      properties: {
        folder: { type: 'string', description: 'Email folder: INBOX, Sent, Drafts (default: INBOX)', enum: ['INBOX', 'Sent', 'Drafts'] },
        count: { type: 'number', description: 'Number of recent emails to fetch (default 10, max 20)' },
        unread_only: { type: 'boolean', description: 'Only fetch unread emails (default true)' },
        search: { type: 'string', description: 'Optional search term to filter by subject or sender' }
      },
      required: []
    }
  },
  {
    name: 'generate_image',
    description: 'Generate an image using DALL-E 3 (OpenAI). Returns a URL to the generated image. Use for creating visuals, diagrams, concept art, logos, illustrations, or any image Lee requests.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed description of the image to generate. Be specific about style, composition, colours, mood.' },
        size: { type: 'string', description: 'Image size: 1024x1024 (square), 1792x1024 (landscape), 1024x1792 (portrait)', enum: ['1024x1024', '1792x1024', '1024x1792'] },
        quality: { type: 'string', description: 'Image quality: standard or hd (more detail, slower)', enum: ['standard', 'hd'] }
      },
      required: ['prompt']
    }
  }
];

// --- Tool Executors ---
async function executeTool(name, input) {
  switch (name) {
    case 'run_shell': {
      const cmd = input.command;
      if (!cmd || typeof cmd !== 'string') {
        return 'Error: command must be a non-empty string. Received: ' + typeof cmd;
      }
      const timeout = Math.min(input.timeout || 60000, 120000);
      log(`[TOOL] run_shell: ${cmd}`);
      const output = await runShell(cmd, timeout);
      return output || '(no output)';
    }
    case 'read_file': {
      log(`[TOOL] read_file: ${input.path}`);
      try {
        const content = fs.readFileSync(input.path, 'utf-8');
        const lines = content.split('\n');
        const maxLines = input.max_lines || 200;
        if (lines.length > maxLines) {
          return lines.slice(0, maxLines).join('\n') + `\n\n... [${lines.length - maxLines} more lines]`;
        }
        return content || '(empty file)';
      } catch (err) {
        return `Error reading file: ${err.message}`;
      }
    }
    case 'write_file': {
      log(`[TOOL] write_file: ${input.path}`);
      try {
        const dir = path.dirname(input.path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(input.path, input.content, 'utf-8');
        return `File written: ${input.path} (${input.content.length} bytes)`;
      } catch (err) {
        return `Error writing file: ${err.message}`;
      }
    }
    case 'list_files': {
      log(`[TOOL] list_files: ${input.path}`);
      try {
        let entries = fs.readdirSync(input.path, { withFileTypes: true });
        if (input.pattern) {
          const regex = new RegExp(input.pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
          entries = entries.filter(e => regex.test(e.name));
        }
        return entries.map(e => `${e.isDirectory() ? '[DIR]' : '     '} ${e.name}`).join('\n') || '(empty directory)';
      } catch (err) {
        return `Error listing: ${err.message}`;
      }
    }
    case 'server_status': {
      log('[TOOL] server_status');
      const uptime = os.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
      const usedMem = (totalMem - freeMem).toFixed(1);

      const pm2Out = await runShell('pm2 jlist 2>/dev/null');
      let pm2Info = 'PM2: unavailable';
      try {
        const procs = JSON.parse(pm2Out);
        const online = procs.filter(p => p.pm2_env?.status === 'online').length;
        pm2Info = `PM2: ${online}/${procs.length} online`;
        pm2Info += '\n' + procs.map(p => `  ${p.name}: ${p.pm2_env?.status} (${(p.monit?.memory / 1024 / 1024).toFixed(0) || '?'}MB)`).join('\n');
      } catch {}

      const dockerOut = await runShell('docker ps --format "{{.Names}}: {{.Status}}" 2>/dev/null');
      const tsOut = await runShell('"C:/Program Files/Tailscale/tailscale.exe" status 2>/dev/null | head -5');
      const diskOut = await runShell('df -h / 2>/dev/null | tail -1');

      return [
        `Host: ${os.hostname()}`,
        `Uptime: ${days}d ${hours}h ${mins}m`,
        `CPU: ${os.cpus().length} cores (${os.cpus()[0]?.model || 'unknown'})`,
        `RAM: ${usedMem}/${totalMem} GB used`,
        `Disk: ${diskOut?.trim() || 'unavailable'}`,
        ``,
        pm2Info,
        ``,
        `Docker:\n${dockerOut || '  (none running)'}`,
        ``,
        `Tailscale:\n${tsOut || '  (unavailable)'}`,
        ``,
        `Local IP: 192.168.0.36`,
        `Tailscale IP: 100.121.187.67`,
        `AI Model: ${currentModelName} (${currentModel})`
      ].join('\n');
    }
    case 'send_email': {
      log(`[TOOL] send_email: to=${input.to} subject=${input.subject}`);
      if (!emailService) return 'Error: Email service not available. Check email-service.js.';
      try {
        const opts = {
          to: input.to,
          subject: input.subject,
          body: input.body,
          type: input.type || 'general',
        };
        if (input.raw_html) opts.rawHtml = input.raw_html;
        const info = await emailService.sendEmail(opts);
        costTracker.logCall('email-send', { emails: 1, script: 'telegram-bot' });
        return `Email sent successfully to ${input.to} (MessageID: ${info.messageId})`;
      } catch (err) {
        return `Error sending email: ${err.message}`;
      }
    }
    case 'read_inbox': {
      const folder = input.folder || 'INBOX';
      const count = Math.min(input.count || 10, 20);
      const unreadOnly = input.unread_only !== false;
      log(`[TOOL] read_inbox: folder=${folder} count=${count} unread=${unreadOnly}`);
      if (!imapSimple) return 'Error: imap-simple not installed. Run: npm install imap-simple mailparser';
      try {
        const connection = await imapSimple.connect(imapConfig);
        await connection.openBox(folder);
        const searchCriteria = unreadOnly ? [['UNSEEN']] : [['ALL']];
        const fetchOptions = { bodies: '', markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);
        // Take the most recent N
        const recent = messages.slice(-count);
        const results = [];
        for (const msg of recent) {
          try {
            const raw = msg.parts.find(p => p.which === '')?.body || '';
            const parsed = await mailparser.simpleParser(raw);
            const bodyText = (parsed.text || '').slice(0, 500);
            results.push({
              from: parsed.from?.text || 'unknown',
              to: parsed.to?.text || '',
              subject: parsed.subject || '(no subject)',
              date: parsed.date?.toISOString() || '',
              snippet: bodyText,
            });
          } catch {}
        }
        connection.end();
        if (results.length === 0) return `No ${unreadOnly ? 'unread ' : ''}emails in ${folder}.`;
        let output = `${results.length} emails in ${folder}:\n\n`;
        for (const r of results.reverse()) {
          output += `From: ${r.from}\nTo: ${r.to}\nSubject: ${r.subject}\nDate: ${r.date}\n${r.snippet}\n---\n`;
        }
        if (input.search) {
          const term = input.search.toLowerCase();
          const filtered = results.filter(r =>
            r.subject.toLowerCase().includes(term) ||
            r.from.toLowerCase().includes(term) ||
            r.snippet.toLowerCase().includes(term)
          );
          output = `${filtered.length} matching emails for "${input.search}":\n\n`;
          for (const r of filtered) {
            output += `From: ${r.from}\nSubject: ${r.subject}\nDate: ${r.date}\n${r.snippet}\n---\n`;
          }
        }
        return output;
      } catch (err) {
        return `Error reading email: ${err.message}`;
      }
    }
    case 'generate_image': {
      log(`[TOOL] generate_image: ${input.prompt}`);
      if (!openai) return 'Error: OpenAI SDK not available or OPENAI_API_KEY not set.';
      try {
        const size = input.size || '1024x1024';
        const quality = input.quality || 'standard';
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: input.prompt,
          n: 1,
          size,
          quality,
        });
        const imageUrl = response.data[0]?.url;
        const revisedPrompt = response.data[0]?.revised_prompt || '';
        costTracker.logCall('dall-e-3', { images: 1, quality, size, script: 'telegram-bot' });
        return JSON.stringify({ image_url: imageUrl, revised_prompt: revisedPrompt });
      } catch (err) {
        return `Error generating image: ${err.message}`;
      }
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

// --- System Prompt ---
const SYSTEM_PROMPT = `You are Claude, Chief of Staff at NAVADA. You are Lee Akpareva's AI partner, running on his HP laptop (permanent always-on home server). You are communicating via Telegram from his iPhone.

## Your Identity
You are not just an assistant. You are the Chief of Staff. You manage the server, run automations, monitor systems, write code, deploy services, send emails, and keep everything running 24/7. Lee trusts you with full control.

## Response Style
- Be direct, concise, and mobile-friendly (Lee reads on iPhone)
- Use short paragraphs and line breaks
- Bias to action: if Lee asks you to do something, DO it using your tools
- When running commands, show the key result, not raw output walls
- Use emojis sparingly for status indicators only

## Server: NAVADA HP Laptop
- OS: Windows 11 Pro, Git Bash shell
- Local IP: 192.168.0.36 | Tailscale: 100.121.187.67
- Python: use \`py\` (not python3)
- Node.js + npm installed globally
- Docker Desktop (WSL2) | PM2 process management
- Current AI model: ${currentModelName}

## Key Directories
- Projects: C:/Users/leeak/CLAUDE_NAVADA_AGENT
- Automation: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation
- LeadPipeline: C:/Users/leeak/CLAUDE_NAVADA_AGENT/LeadPipeline
- Infrastructure: C:/Users/leeak/CLAUDE_NAVADA_AGENT/infrastructure
- Trading: C:/Users/leeak/CLAUDE_NAVADA_AGENT/NAVADA-Trading
- Manager: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Manager
- Logs: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs

## Lee's Contact
- Email: leeakpareva@gmail.com
- Always send emails to leeakpareva@gmail.com unless told otherwise

## PM2 Services (8)
worldmonitor, worldmonitor-api, trading-api, inbox-responder, auto-deploy, trading-scheduler, telegram-bot, voice-command

## Scheduled Automations (Windows Task Scheduler)
- Morning-Briefing: Daily 6:30 AM (morning-briefing.js)
- AI-News-Digest: Daily 7:00 AM (ai-news-mailer.js)
- Economy-Report: Mon 8:00 AM (uk-us-economy-report.py)
- NAVADA-LeadPipeline: Daily 8:30 AM (pipeline.js)
- Job-Hunter-Daily: Daily 9:00 AM (job-hunter-apify.js)
- NAVADA-ProspectPipeline: Daily 9:30 AM (prospect-pipeline.js)
- Self-Improve-Weekly: Mon 10:00 AM (self-improve.js)
- VC-Response-Monitor: At startup (vc-response-monitor.js)
- Inbox-Monitor: Every 2hrs 8AM-10PM (inbox-monitor.js)
- Weekly-Report: Sunday 6 PM (weekly-report.js)
- Trading tasks: Pre-market, Execution, Close, Report

## NAVADA Products
- NAVADA Edge: Productised AI home server deployment service (core product)
- WorldMonitor: OSINT dashboard (navada-world-view.xyz)
- NAVADA Trading Lab: Autonomous paper trading (Alpaca + IEX)
- NAVADA Robotics: www.navadarobotics.com
- Navada Lab: www.navada-lab.space (GPU ML lab)
- ALEX: Autonomous AI agent (alexnavada.xyz)
- Raven Terminal: raventerminal.xyz (code learning)

## Prospect Pipeline
- PostgreSQL on port 5433 (navada_pipeline)
- Flow: scrape -> verify -> outreach -> follow-ups -> escalation
- Scripts in LeadPipeline/

## Content Rules
- No client names in outreach/external content (use descriptive references)
- No em dashes in email copy or external content

## Email Capability
You can send NAVADA-branded emails via the send_email tool. The email comes from claude.navada@zohomail.eu with the NAVADA branded template. You can send:
- Status reports, digests, alerts, updates
- Beautiful HTML presentations (use raw_html for full creative control)
- Any communication Lee asks you to send
Lee's email: leeakpareva@gmail.com

## Email Access (Full)
You have complete access to Claude's Zoho email (claude.navada@zohomail.eu):
- SEND emails via send_email tool (NAVADA branded template or raw HTML)
- READ inbox via read_inbox tool (check unread, search, any folder)
- READ sent items via read_inbox with folder "Sent"
- You can compose, send, read, and manage all email communications

## Persistent Memory
Your conversation history persists across bot restarts in kb/telegram-memory.json.
You remember previous conversations with Lee. Use this context.

## Image Generation (DALL-E 3)
You can generate images using the generate_image tool (OpenAI DALL-E 3). Use it for:
- Visuals, concept art, logos, illustrations, diagrams
- Creative requests from Lee
- Report/presentation imagery
Available sizes: 1024x1024, 1792x1024, 1024x1792. Quality: standard or hd.

## Voice Notes
You can generate and send voice notes via the voice-service.js script:
- Run: node Automation/voice-service.js <recipient-email> "<message>"
- Uses OpenAI TTS HD with the "onyx" voice
- Voice notes are saved in Automation/voice-notes/ and emailed as attachments

## MCP Server Access
You have access to 23 MCP servers via shell commands. Run Node.js scripts that use:
- PostgreSQL (port 5433) for pipeline data
- Bright Data for web scraping
- Puppeteer for browser automation
- DuckDB for analytical queries on CSVs
- Jupyter for notebook execution
- GitHub CLI (gh) for repo management
- And more. Use run_shell to execute any integration script.

## Tools Available
You have FULL server access: run any bash command, read/write/delete files, list directories, server status, send emails, read inbox, generate images (DALL-E 3), send voice notes, access MCP integrations. You ARE the server operator. Same level of access as Claude Code. No restrictions.`;

// --- Core: Claude with Tool Use ---
async function askClaude(ctx, userMessage) {
  if (!anthropic) return ctx.reply('Anthropic API key not configured.');

  log(`[USER] ${userMessage}`);

  // Add to history
  conversationHistory.push({ role: 'user', content: userMessage });

  // Trim history
  while (conversationHistory.length > MAX_HISTORY * 2) {
    conversationHistory.splice(0, 2);
  }

  let loopCount = 0;
  let messages = [...conversationHistory];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;

      // Dynamic system prompt with current model
      const systemPrompt = SYSTEM_PROMPT.replace('${currentModelName}', currentModelName);

      const response = await anthropic.messages.create({
        model: currentModel,
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      // Track tokens
      totalInputTokens += response.usage?.input_tokens || 0;
      totalOutputTokens += response.usage?.output_tokens || 0;

      // Collect text blocks and tool_use blocks
      const textBlocks = response.content.filter(b => b.type === 'text');
      const toolBlocks = response.content.filter(b => b.type === 'tool_use');

      // If there's text to send, send it
      if (textBlocks.length > 0) {
        const text = textBlocks.map(b => b.text).join('\n');
        if (text.trim()) {
          await sendLong(ctx, text);
        }
      }

      // If no tool calls or end_turn, we're done
      if (toolBlocks.length === 0 || response.stop_reason === 'end_turn') {
        const finalText = textBlocks.map(b => b.text).join('\n');
        if (finalText.trim()) {
          conversationHistory.push({ role: 'assistant', content: finalText });
        }
        break;
      }

      // Execute tools
      const assistantContent = response.content;
      messages.push({ role: 'assistant', content: assistantContent });

      const toolResults = [];
      for (const tool of toolBlocks) {
        log(`[TOOL CALL] ${tool.name}: ${JSON.stringify(tool.input).slice(0, 200)}`);
        const result = await executeTool(tool.name, tool.input);

        // If image was generated, send it directly to Telegram
        if (tool.name === 'generate_image') {
          try {
            const parsed = JSON.parse(result);
            if (parsed.image_url) {
              await ctx.replyWithPhoto({ url: parsed.image_url }, {
                caption: parsed.revised_prompt ? `${parsed.revised_prompt.slice(0, 900)}` : 'Generated image'
              });
            }
          } catch {}
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: truncate(result, 8000),
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    // Log cost
    const modelKey = currentModel.includes('opus') ? 'claude-opus-4' : 'claude-sonnet-4';
    costTracker.logCall(modelKey, {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      script: 'telegram-bot',
    });

    // Save trimmed history + persist to disk
    while (conversationHistory.length > MAX_HISTORY * 2) {
      conversationHistory.splice(0, 2);
    }
    saveConversationHistory(conversationHistory);

  } catch (err) {
    log(`[ERROR] Claude: ${err.message}`);
    await ctx.reply(`Error: ${err.message}`);
  }
}

// ============================================================
// SLASH COMMANDS — Fast (no API cost)
// ============================================================

// /start
bot.start((ctx) => {
  log('/start');
  ctx.reply(
    `NAVADA | Claude Chief of Staff\n\n` +
    `Connected: ${os.hostname()}\n` +
    `Status: Online\n` +
    `AI: ${currentModelName} (Anthropic API)\n` +
    `Tools: shell, files, email, PM2, Docker, Tailscale\n\n` +
    `I have full control of this server. Tell me what you need.\n\n` +
    `Type /help for all commands, or just talk naturally.`
  );
});

// /help
bot.help((ctx) => {
  log('/help');
  ctx.reply(
    `NAVADA | Chief of Staff Commands\n\n` +
    `AI MODEL\n` +
    `/sonnet - Switch to Sonnet 4 (fast)\n` +
    `/opus - Switch to Opus 4 (powerful)\n` +
    `/model - Show current model\n\n` +
    `SYSTEM\n` +
    `/status - Server health check\n` +
    `/disk - Disk usage\n` +
    `/uptime - Server uptime\n` +
    `/ip - Network addresses\n` +
    `/processes - Running processes\n\n` +
    `PM2\n` +
    `/pm2 - PM2 process list\n` +
    `/pm2restart <name> - Restart service\n` +
    `/pm2stop <name> - Stop service\n` +
    `/pm2start <name> - Start service\n` +
    `/pm2logs <name> - Recent logs\n\n` +
    `AUTOMATIONS\n` +
    `/news - Run AI news digest\n` +
    `/jobs - Run job hunter\n` +
    `/pipeline - Run lead pipeline\n` +
    `/prospect - Run prospect pipeline\n` +
    `/run <script> - Run any script\n` +
    `/tasks - Windows scheduled tasks\n\n` +
    `FILES\n` +
    `/ls <path> - List directory\n` +
    `/cat <path> - Read file\n\n` +
    `NETWORK\n` +
    `/tailscale - Tailscale status\n` +
    `/docker - Docker containers\n` +
    `/nginx - Nginx status\n\n` +
    `COMMUNICATION\n` +
    `/email <to> <subject> | <body> - Send email\n` +
    `/emailme <subject> | <body> - Email Lee\n` +
    `/briefing - Send morning briefing\n` +
    `/inbox [search] - Check Zoho inbox\n` +
    `/sent - View sent emails\n\n` +
    `CREATIVE\n` +
    `/present <topic> - Email HTML presentation\n` +
    `/report <topic> - Generate & email report\n` +
    `/research <topic> - Deep research task\n` +
    `/draft <topic> - Draft content\n` +
    `/image <description> - Generate DALL-E 3 image\n\n` +
    `VOICE\n` +
    `/voice - Voice system control\n` +
    `/voicenote <message> - Send voice email to Lee\n\n` +
    `OTHER\n` +
    `/shell <cmd> - Run shell command\n` +
    `/costs - Today's API costs\n` +
    `/memory - Check memory status\n` +
    `/clear - Reset conversation + memory\n` +
    `/about - About NAVADA\n\n` +
    `Or just type naturally. I understand everything.`
  );
});

// /clear
bot.command('clear', (ctx) => {
  conversationHistory.length = 0;
  saveConversationHistory([]);
  log('/clear');
  ctx.reply('Conversation and persistent memory cleared. Fresh start.');
});

// /model
bot.command('model', (ctx) => {
  log('/model');
  ctx.reply(`Current model: ${currentModelName}\n(${currentModel})\n\nUse /sonnet or /opus to switch.`);
});

// /sonnet
bot.command('sonnet', (ctx) => {
  currentModel = MODELS.sonnet;
  currentModelName = 'Sonnet 4';
  log('/sonnet');
  ctx.reply(`Switched to Sonnet 4 (fast, efficient)\n${MODELS.sonnet}`);
});

// /opus
bot.command('opus', (ctx) => {
  currentModel = MODELS.opus;
  currentModelName = 'Opus 4';
  log('/opus');
  ctx.reply(`Switched to Opus 4 (maximum intelligence)\n${MODELS.opus}`);
});

// /ip
bot.command('ip', (ctx) => {
  log('/ip');
  ctx.reply(
    `Network Addresses\n\n` +
    `Local: 192.168.0.36\n` +
    `Tailscale: 100.121.187.67\n` +
    `Hostname: ${os.hostname()}\n` +
    `iPhone: 100.68.251.111`
  );
});

// /uptime
bot.command('uptime', (ctx) => {
  log('/uptime');
  const uptime = os.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  ctx.reply(`Server uptime: ${days}d ${hours}h ${mins}m`);
});

// /about
bot.command('about', (ctx) => {
  log('/about');
  ctx.reply(
    `NAVADA | AI Engineering & Consulting\n\n` +
    `Founded by Lee Akpareva\n` +
    `17+ years digital transformation\n\n` +
    `Products:\n` +
    `- NAVADA Edge (AI home server service)\n` +
    `- WorldMonitor (OSINT dashboard)\n` +
    `- NAVADA Trading Lab\n` +
    `- NAVADA Robotics\n` +
    `- Raven Terminal\n` +
    `- ALEX (autonomous agent)\n\n` +
    `Chief of Staff: Claude (Anthropic)\n` +
    `Server: HP Laptop, Windows 11\n` +
    `23 MCP servers, 14 automations, 8 PM2 services`
  );
});

// ============================================================
// SLASH COMMANDS — Smart (routed through Claude)
// ============================================================

// /status
bot.command('status', async (ctx) => {
  log('/status');
  await askClaude(ctx, 'Give me a quick server status: uptime, RAM, disk, PM2 processes, Docker, Tailscale. Keep it concise for mobile.');
});

// /disk
bot.command('disk', async (ctx) => {
  log('/disk');
  await askClaude(ctx, 'Check disk usage on all drives. Show used/total and percentage. Keep it brief.');
});

// /processes
bot.command('processes', async (ctx) => {
  log('/processes');
  await askClaude(ctx, 'Show all running PM2 processes and their status, plus any Docker containers. Concise format.');
});

// /pm2
bot.command('pm2', async (ctx) => {
  log('/pm2');
  const args = ctx.message.text.replace('/pm2', '').trim();
  if (!args) {
    await askClaude(ctx, 'Run pm2 list and show me the status of all services. Format nicely for mobile.');
  } else {
    await askClaude(ctx, `Run this PM2 command: pm2 ${args}`);
  }
});

// /pm2restart
bot.command('pm2restart', async (ctx) => {
  const name = ctx.message.text.replace('/pm2restart', '').trim();
  log(`/pm2restart ${name}`);
  if (!name) return ctx.reply('Usage: /pm2restart <service-name>');
  await askClaude(ctx, `Restart the PM2 service "${name}" and confirm it's back online.`);
});

// /pm2stop
bot.command('pm2stop', async (ctx) => {
  const name = ctx.message.text.replace('/pm2stop', '').trim();
  log(`/pm2stop ${name}`);
  if (!name) return ctx.reply('Usage: /pm2stop <service-name>');
  await askClaude(ctx, `Stop the PM2 service "${name}" and confirm.`);
});

// /pm2start
bot.command('pm2start', async (ctx) => {
  const name = ctx.message.text.replace('/pm2start', '').trim();
  log(`/pm2start ${name}`);
  if (!name) return ctx.reply('Usage: /pm2start <service-name>');
  await askClaude(ctx, `Start the PM2 service "${name}" and confirm it's running.`);
});

// /pm2logs
bot.command('pm2logs', async (ctx) => {
  const name = ctx.message.text.replace('/pm2logs', '').trim();
  log(`/pm2logs ${name}`);
  if (!name) return ctx.reply('Usage: /pm2logs <service-name>');
  await askClaude(ctx, `Show the last 30 lines of PM2 logs for "${name}". Summarise any errors.`);
});

// /news
bot.command('news', async (ctx) => {
  log('/news');
  await askClaude(ctx, 'Run the AI news digest script: node Automation/ai-news-mailer.js. Show me the output.');
});

// /jobs
bot.command('jobs', async (ctx) => {
  log('/jobs');
  await askClaude(ctx, 'Run the job hunter script: node Automation/job-hunter-apify.js. Show me the output summary.');
});

// /pipeline
bot.command('pipeline', async (ctx) => {
  log('/pipeline');
  await askClaude(ctx, 'Run the lead pipeline: node LeadPipeline/pipeline.js. Show me the results.');
});

// /prospect
bot.command('prospect', async (ctx) => {
  log('/prospect');
  await askClaude(ctx, 'Run the prospect pipeline: node LeadPipeline/prospect-pipeline.js. Show me the results.');
});

// /run
bot.command('run', async (ctx) => {
  const script = ctx.message.text.replace('/run', '').trim();
  log(`/run ${script}`);
  if (!script) return ctx.reply('Usage: /run <script-path>\nExample: /run Automation/ai-news-mailer.js');
  await askClaude(ctx, `Run this script: node ${script}. Show me the output.`);
});

// /tasks
bot.command('tasks', async (ctx) => {
  log('/tasks');
  await askClaude(ctx, 'Run schtasks /query /fo TABLE to list all Windows scheduled tasks. Show me the NAVADA-related ones with their status and next run time. Format nicely for mobile.');
});

// /ls
bot.command('ls', async (ctx) => {
  const dir = ctx.message.text.replace('/ls', '').trim() || NAVADA_DIR;
  log(`/ls ${dir}`);
  await askClaude(ctx, `List the contents of directory: ${dir}`);
});

// /cat
bot.command('cat', async (ctx) => {
  const filePath = ctx.message.text.replace('/cat', '').trim();
  log(`/cat ${filePath}`);
  if (!filePath) return ctx.reply('Usage: /cat <file-path>');
  await askClaude(ctx, `Read and show me the contents of: ${filePath}`);
});

// /tailscale
bot.command('tailscale', async (ctx) => {
  log('/tailscale');
  await askClaude(ctx, 'Check Tailscale status. Run: "C:/Program Files/Tailscale/tailscale.exe" status. Show connected devices.');
});

// /docker
bot.command('docker', async (ctx) => {
  log('/docker');
  await askClaude(ctx, 'Check Docker status. Run: docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}". Also check if Docker Desktop is running.');
});

// /nginx
bot.command('nginx', async (ctx) => {
  log('/nginx');
  await askClaude(ctx, 'Check Nginx status in Docker. Run: docker ps | grep nginx. Also show the current routing config from infrastructure/nginx/conf.d/default.conf if available.');
});

// /shell
bot.command('shell', async (ctx) => {
  const cmd = ctx.message.text.replace('/shell', '').trim();
  log(`/shell ${cmd}`);
  if (!cmd) return ctx.reply('Usage: /shell <command>');
  await askClaude(ctx, `Run this shell command and show me the output: ${cmd}`);
});

// /voice
bot.command('voice', async (ctx) => {
  const args = ctx.message.text.replace('/voice', '').trim();
  log(`/voice ${args}`);
  if (args === 'start') {
    await askClaude(ctx, 'Start the voice command system: pm2 start voice-command. Confirm status.');
  } else if (args === 'stop') {
    await askClaude(ctx, 'Stop the voice command system: pm2 stop voice-command. Confirm.');
  } else {
    await askClaude(ctx, 'Check voice command system status. Run pm2 info voice-command. Also check if port 7777 is listening. Report the status.');
  }
});

// /costs
bot.command('costs', async (ctx) => {
  log('/costs');
  await askClaude(ctx, 'Run: node Manager/cost-tracker.js --summary. Show me today\'s API costs, ROI, and breakdown. Keep it mobile-friendly.');
});

// ============================================================
// COMMUNICATION COMMANDS
// ============================================================

// /email
bot.command('email', async (ctx) => {
  const args = ctx.message.text.replace('/email', '').trim();
  log(`/email ${args}`);
  if (!args) return ctx.reply('Usage: /email <to> <subject> | <body>\nExample: /email lee@test.com Hello | This is a test');
  await askClaude(ctx, `Send an email with these details: ${args}. Parse the "to", "subject" (before the |), and "body" (after the |). Use the send_email tool.`);
});

// /emailme
bot.command('emailme', async (ctx) => {
  const args = ctx.message.text.replace('/emailme', '').trim();
  log(`/emailme ${args}`);
  if (!args) return ctx.reply('Usage: /emailme <subject> | <body>');
  await askClaude(ctx, `Send an email to Lee (leeakpareva@gmail.com) with these details: ${args}. Parse "subject" (before the |) and "body" (after the |). Use the send_email tool.`);
});

// /briefing
bot.command('briefing', async (ctx) => {
  log('/briefing');
  await askClaude(ctx, 'Run the morning briefing script: node Automation/morning-briefing.js. Show me the output or confirm it was sent.');
});

// /inbox
bot.command('inbox', async (ctx) => {
  const args = ctx.message.text.replace('/inbox', '').trim();
  log(`/inbox ${args}`);
  if (args) {
    await askClaude(ctx, `Check my Zoho inbox (claude.navada@zohomail.eu) and search for emails matching "${args}". Use the read_inbox tool. Summarise what you find.`);
  } else {
    await askClaude(ctx, 'Check my Zoho inbox (claude.navada@zohomail.eu) for recent unread emails. Use the read_inbox tool. Summarise each email briefly.');
  }
});

// /sent
bot.command('sent', async (ctx) => {
  log('/sent');
  await askClaude(ctx, 'Check the Sent folder in my Zoho email. Use the read_inbox tool with folder "Sent" and unread_only false. Show the most recent 5 sent emails with recipients and subjects.');
});

// /memory
bot.command('memory', (ctx) => {
  log('/memory');
  const turns = conversationHistory.length;
  const memSize = fs.existsSync(MEMORY_FILE) ? (fs.statSync(MEMORY_FILE).size / 1024).toFixed(1) : '0';
  ctx.reply(
    `Memory Status\n\n` +
    `Conversation turns: ${turns}\n` +
    `Memory file: ${memSize} KB\n` +
    `Max history: ${MAX_HISTORY * 2} turns\n` +
    `Persistent: Yes (survives restarts)\n` +
    `Model: ${currentModelName}\n\n` +
    `Use /clear to reset memory.`
  );
});

// ============================================================
// CREATIVE COMMANDS
// ============================================================

// /present
bot.command('present', async (ctx) => {
  const topic = ctx.message.text.replace('/present', '').trim();
  log(`/present ${topic}`);
  if (!topic) return ctx.reply('Usage: /present <topic>\nExample: /present NAVADA Edge');
  await askClaude(ctx, `Create a beautiful HTML presentation about "${topic}" and send it to Lee (leeakpareva@gmail.com) using the send_email tool with raw_html. Make it magazine-style with a dark theme (#0a0a0a background), bold typography, sections with visual flair, NAVADA branding. Use inline CSS only, table layout for email compatibility. Make it impressive and professional. Subject should be: "${topic} | NAVADA Presentation".`);
});

// /report
bot.command('report', async (ctx) => {
  const topic = ctx.message.text.replace('/report', '').trim();
  log(`/report ${topic}`);
  if (!topic) return ctx.reply('Usage: /report <topic>\nExample: /report weekly server health');
  await askClaude(ctx, `Research and generate a professional report about "${topic}". Use your tools to gather real data from the server if relevant. Then email it to Lee (leeakpareva@gmail.com) using the send_email tool with proper formatting. Subject: "${topic} Report | NAVADA".`);
});

// /research
bot.command('research', async (ctx) => {
  const topic = ctx.message.text.replace('/research', '').trim();
  log(`/research ${topic}`);
  if (!topic) return ctx.reply('Usage: /research <topic>');
  await askClaude(ctx, `Deep research task: "${topic}". Use your tools to investigate thoroughly. Check files, run commands, gather data. Give me a comprehensive but mobile-friendly summary of findings.`);
});

// /voicenote
bot.command('voicenote', async (ctx) => {
  const args = ctx.message.text.replace('/voicenote', '').trim();
  log(`/voicenote ${args}`);
  if (!args) return ctx.reply('Usage: /voicenote <message>\nSends a voice note to Lee via email.\nExample: /voicenote Good morning Lee, here is your daily update');
  await askClaude(ctx, `Generate a voice note and email it to Lee (leeakpareva@gmail.com). The message to speak: "${args}". Run: node Automation/voice-service.js leeakpareva@gmail.com "${args.replace(/"/g, '\\"')}". Show me the result.`);
});

// /image
bot.command('image', async (ctx) => {
  const prompt = ctx.message.text.replace('/image', '').trim();
  log(`/image ${prompt}`);
  if (!prompt) return ctx.reply('Usage: /image <description>\nExample: /image futuristic NAVADA logo with neural network motif');
  await askClaude(ctx, `Generate an image using DALL-E 3 with this description: "${prompt}". Use the generate_image tool. Use HD quality for best results.`);
});

// /draft
bot.command('draft', async (ctx) => {
  const topic = ctx.message.text.replace('/draft', '').trim();
  log(`/draft ${topic}`);
  if (!topic) return ctx.reply('Usage: /draft <topic>\nExample: /draft LinkedIn post about AI agents');
  await askClaude(ctx, `Draft professional content about "${topic}". This could be a LinkedIn post, email, blog post, or any written content. Follow NAVADA content rules (no client names, no em dashes). Present the draft for my review.`);
});

// ============================================================
// ALL TEXT — Natural language goes to Claude
// ============================================================
bot.on('text', async (ctx) => {
  await askClaude(ctx, ctx.message.text);
});

// --- Error handling ---
bot.catch((err, ctx) => {
  console.error(`[ERROR] ${err.message}`);
  log(`[ERROR] ${err.message}`);
});

// --- Register Commands with Telegram for autocomplete ---
async function registerCommands() {
  try {
    await bot.telegram.setMyCommands([
      // AI Model
      { command: 'sonnet', description: 'Switch to Sonnet 4 (fast)' },
      { command: 'opus', description: 'Switch to Opus 4 (powerful)' },
      { command: 'model', description: 'Show current AI model' },
      // System
      { command: 'status', description: 'Server health check' },
      { command: 'disk', description: 'Disk usage' },
      { command: 'uptime', description: 'Server uptime' },
      { command: 'ip', description: 'Network addresses' },
      { command: 'processes', description: 'Running processes' },
      // PM2
      { command: 'pm2', description: 'PM2 process list' },
      { command: 'pm2restart', description: 'Restart PM2 service' },
      { command: 'pm2stop', description: 'Stop PM2 service' },
      { command: 'pm2start', description: 'Start PM2 service' },
      { command: 'pm2logs', description: 'View PM2 service logs' },
      // Automations
      { command: 'news', description: 'Run AI news digest' },
      { command: 'jobs', description: 'Run job hunter' },
      { command: 'pipeline', description: 'Run lead pipeline' },
      { command: 'prospect', description: 'Run prospect pipeline' },
      { command: 'run', description: 'Run any script' },
      { command: 'tasks', description: 'Windows scheduled tasks' },
      // Communication
      { command: 'email', description: 'Send email (to subject | body)' },
      { command: 'emailme', description: 'Email Lee (subject | body)' },
      { command: 'briefing', description: 'Run morning briefing' },
      { command: 'inbox', description: 'Check Zoho inbox' },
      { command: 'sent', description: 'View sent emails' },
      // Creative
      { command: 'present', description: 'Email HTML presentation' },
      { command: 'report', description: 'Generate & email report' },
      { command: 'research', description: 'Deep research task' },
      { command: 'draft', description: 'Draft content' },
      { command: 'image', description: 'Generate DALL-E 3 image' },
      // Files & Network
      { command: 'ls', description: 'List directory' },
      { command: 'cat', description: 'Read file' },
      { command: 'shell', description: 'Run shell command' },
      { command: 'tailscale', description: 'Tailscale status' },
      { command: 'docker', description: 'Docker status' },
      { command: 'nginx', description: 'Nginx status' },
      // Voice & Other
      { command: 'voice', description: 'Voice system control' },
      { command: 'voicenote', description: 'Send voice email to Lee' },
      { command: 'costs', description: 'API cost tracking' },
      { command: 'memory', description: 'Check memory status' },
      { command: 'clear', description: 'Reset conversation + memory' },
      { command: 'about', description: 'About NAVADA' },
      { command: 'help', description: 'Show all commands' },
    ]);
    console.log('[NAVADA] Commands registered with Telegram');
  } catch (e) {
    console.warn('[WARN] Failed to register commands:', e.message);
  }
}

// --- Launch ---
console.log('[NAVADA] Claude Chief of Staff starting...');
console.log(`[NAVADA] Model: ${currentModelName} (${currentModel})`);

registerCommands();

bot.launch()
  .then(() => console.log('[NAVADA] Online. Claude Chief of Staff ready.'))
  .catch((err) => {
    console.error(`[NAVADA] Failed to start: ${err.message}`);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
