/**
 * NAVADA Telegram Bot — Claude Chief of Staff
 * Full server control via Anthropic Claude with tool use.
 * 40+ slash commands, model switching, cost tracking, email sending.
 * Multi-user support with guest demo mode for NAVADA Edge.
 * All 2-way interactions logged to telegram-interactions.jsonl.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Anthropic = require('@anthropic-ai/sdk').default;
const twilio = require('twilio');

// --- Config ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = Number(process.env.TELEGRAM_OWNER_ID);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const NAVADA_DIR = 'C:/Users/leeak/CLAUDE_NAVADA_AGENT';
const LOG_DIR = path.join(NAVADA_DIR, 'Automation/logs');
const UPLOADS_DIR = path.join(NAVADA_DIR, 'Automation/uploads');
const MAX_MSG_LEN = 4000;
const MAX_TOOL_LOOPS = 10;

// --- Twilio (SMS + Voice) ---
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || '';
const SMS_SIGNATURE = '\n\n— Claude, Chief of Staff\nNAVADA AI Engineering & Consulting\n+447446994961\nnavada-lab.space | navadarobotics.com | navada-edge-server.uk | alexnavada.xyz | raventerminal.xyz | navada-world-view.xyz';

// --- Multi-Channel Push Notifications ---
const LEE_MOBILE = process.env.LEE_MOBILE || '+447935237704';
const WHATSAPP_SANDBOX_TO = process.env.WHATSAPP_SANDBOX_TO || 'whatsapp:+447935237704';
const WHATSAPP_SANDBOX_FROM = process.env.WHATSAPP_SANDBOX_FROM || 'whatsapp:+14155238886';

/**
 * Send push notification to Lee via all available channels
 * @param {string} message - Notification text
 * @param {Object} opts - { telegram: true, sms: true, whatsapp: true }
 */
async function notifyAllChannels(message, opts = {}) {
  const { telegram = true, sms = true, whatsapp = true } = opts;
  const results = { telegram: null, sms: null, whatsapp: null };

  // Telegram
  if (telegram) {
    try {
      await bot.telegram.sendMessage(OWNER_ID, message, { parse_mode: 'HTML' });
      results.telegram = 'sent';
    } catch (e) { results.telegram = `failed: ${e.message}`; }
  }

  // SMS
  if (sms && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: message.replace(/<[^>]+>/g, '') + SMS_SIGNATURE,
        from: TWILIO_FROM,
        to: LEE_MOBILE,
      });
      results.sms = 'sent';
    } catch (e) { results.sms = `failed: ${e.message}`; }
  }

  // WhatsApp (sandbox)
  if (whatsapp && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: message.replace(/<[^>]+>/g, ''),
        from: WHATSAPP_SANDBOX_FROM,
        to: WHATSAPP_SANDBOX_TO,
        statusCallback: 'https://api.navada-edge-server.uk/twilio/status',
      });
      results.whatsapp = 'sent';
    } catch (e) { results.whatsapp = `failed: ${e.message}`; }
  }

  console.log('[notify]', JSON.stringify(results));
  return results;
}

// --- Rate Limiting (per-user) ---
const RATE_LIMITS = {
  guest: { maxPerDay: 50, maxPerHour: 20 },  // generous for a good UX
  admin: { maxPerDay: Infinity, maxPerHour: Infinity },
};
const rateCounts = new Map(); // userId -> { day: 'YYYY-MM-DD', dayCount: N, hourTs: epochMs, hourCount: N }

function checkRateLimit(userId, role) {
  const limits = RATE_LIMITS[role] || RATE_LIMITS.guest;
  if (limits.maxPerDay === Infinity) return { allowed: true };

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hourAgo = now.getTime() - 3600000;

  let entry = rateCounts.get(String(userId));
  if (!entry || entry.day !== today) {
    entry = { day: today, dayCount: 0, hours: [] };
    rateCounts.set(String(userId), entry);
  }

  // Clean old hour entries
  entry.hours = entry.hours.filter(ts => ts > hourAgo);

  if (entry.dayCount >= limits.maxPerDay) {
    return { allowed: false, reason: `You've reached the daily message limit (${limits.maxPerDay}). Resets at midnight. Enjoy the rest of your day!` };
  }
  if (entry.hours.length >= limits.maxPerHour) {
    return { allowed: false, reason: `You're chatting fast! Limit is ${limits.maxPerHour} messages per hour. Take a short break and come back.` };
  }

  entry.dayCount++;
  entry.hours.push(now.getTime());
  return { allowed: true, remaining: limits.maxPerDay - entry.dayCount };
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Cost Tracker ---
let costTracker;
try {
  costTracker = require('../Manager/cost-tracking/cost-tracker');
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

// ============================================================
// MULTI-USER SYSTEM
// ============================================================
const USERS_FILE = path.join(NAVADA_DIR, 'Automation/kb/telegram-users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch {}
  // Default: owner only
  return {
    owner: OWNER_ID,
    users: {
      [OWNER_ID]: { username: 'owner', role: 'admin', grantedAt: new Date().toISOString(), expiresAt: null, grantedBy: 'system' }
    }
  };
}

function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[WARN] Failed to save users:', e.message);
  }
}

function isUserAuthorized(userId) {
  const data = loadUsers();
  const user = data.users[String(userId)];
  if (!user) return { authorized: false, role: null };
  if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
    return { authorized: false, role: null, expired: true };
  }
  return { authorized: true, role: user.role };
}

function isAdmin(userId) {
  return Number(userId) === OWNER_ID || isUserAuthorized(userId).role === 'admin';
}

function getUserDisplayName(userId) {
  const data = loadUsers();
  const user = data.users[String(userId)];
  return user?.displayName || null;
}

function setUserDisplayName(userId, name) {
  const data = loadUsers();
  if (data.users[String(userId)]) {
    data.users[String(userId)].displayName = name;
    saveUsers(data);
  }
}

// Track users we've already asked for their name this session
const pendingNameRequests = new Set();

// Guest-blocked commands (require admin)
const ADMIN_ONLY_COMMANDS = new Set([
  'shell', 'run', 'ls', 'cat', 'email', 'emailme', 'inbox', 'sent',
  'pm2restart', 'pm2stop', 'pm2start', 'pm2logs',
  'present', 'report', 'briefing', 'voicenote', 'linkedin',
  'clear', 'grant', 'revoke', 'users',
  'news', 'jobs', 'pipeline', 'prospect', 'ralph',
]);

// Guest-safe commands
const GUEST_COMMANDS = new Set([
  'start', 'help', 'about', 'status', 'uptime', 'ip', 'model', 'sonnet', 'opus',
  'pm2', 'tasks', 'costs', 'memory', 'image', 'research', 'draft', 'docker',
  'tailscale', 'nginx', 'disk', 'processes',
]);

// Guest-safe tools (for natural language chat)
const GUEST_TOOLS = new Set(['server_status', 'generate_image']);

// ============================================================
// INTERACTION LOGGING
// ============================================================
const INTERACTION_LOG = path.join(LOG_DIR, 'telegram-interactions.jsonl');

function logInteraction(entry) {
  try {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    }) + '\n';
    fs.appendFileSync(INTERACTION_LOG, line);
  } catch (e) {
    console.warn('[WARN] Failed to log interaction:', e.message);
  }
}

// ============================================================
// PERSISTENT CONVERSATION MEMORY (per-user)
// ============================================================
const MEMORY_DIR = path.join(NAVADA_DIR, 'Automation/kb');
const MAX_HISTORY = 30;

function getMemoryFile(userId) {
  if (Number(userId) === OWNER_ID) {
    return path.join(MEMORY_DIR, 'telegram-memory.json');
  }
  return path.join(MEMORY_DIR, `telegram-memory-${userId}.json`);
}

function loadConversationHistory(userId) {
  try {
    const file = getMemoryFile(userId);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return data.history || [];
    }
  } catch {}
  return [];
}

function saveConversationHistory(userId, history) {
  try {
    const file = getMemoryFile(userId);
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({
      updated: new Date().toISOString(),
      model: currentModelName,
      history: history.slice(-MAX_HISTORY * 2),
    }, null, 2));
  } catch (e) {
    console.warn('[WARN] Failed to save memory:', e.message);
  }
}

// Per-user conversation histories (in-memory cache)
const conversationHistories = new Map();

function getUserHistory(userId) {
  if (!conversationHistories.has(userId)) {
    conversationHistories.set(userId, loadConversationHistory(userId));
  }
  return conversationHistories.get(userId);
}

// Load owner's history on startup
const ownerHistory = loadConversationHistory(OWNER_ID);
conversationHistories.set(OWNER_ID, ownerHistory);
console.log(`[NAVADA] Loaded ${ownerHistory.length} conversation turns from memory`);

// Command log
const cmdLogPath = path.join(LOG_DIR, 'telegram-commands.log');

// ============================================================
// SECURITY: Multi-user auth middleware
// ============================================================
bot.use((ctx, next) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || 'unknown';
  const { authorized, expired } = isUserAuthorized(userId);

  if (!authorized) {
    console.log(`[BLOCKED] Unauthorized: ${userId} (${username})${expired ? ' [EXPIRED]' : ''}`);
    logInteraction({ direction: 'in', userId, username, message: ctx.message?.text || '(media)', blocked: true });
    return ctx.reply(
      'Access denied. Contact Lee Akpareva to request access to NAVADA Edge.\n\n' +
      'Learn more: www.navada-lab.space'
    );
  }

  // Attach user info to context
  const role = isAdmin(userId) ? 'admin' : 'guest';
  ctx.state.userId = userId;
  ctx.state.username = username;
  ctx.state.userRole = role;
  ctx.state.displayName = getUserDisplayName(userId);

  // Rate limiting for non-admin users
  if (role !== 'admin' && ctx.message?.text) {
    const rateCheck = checkRateLimit(userId, role);
    if (!rateCheck.allowed) {
      return ctx.reply(rateCheck.reason);
    }
  }

  return next();
});

// ============================================================
// HELPERS
// ============================================================
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
      await ctx.reply(chunk);
    }
  }
  if (chunks.length > 5) {
    await ctx.reply(`... [${chunks.length - 5} more chunks truncated]`);
  }
}

function downloadFile(fileUrl, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(fileUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Helper: check if command is allowed for user role
function isCommandAllowed(command, role) {
  if (role === 'admin') return true;
  if (ADMIN_ONLY_COMMANDS.has(command)) return false;
  return true;
}

// ============================================================
// CLAUDE TOOLS
// ============================================================
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
    name: 'delete_file',
    description: 'Delete a file or empty directory on the server. Use absolute paths. Will not delete non-empty directories for safety.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute file path to delete' },
        recursive: { type: 'boolean', description: 'If true, recursively delete directory and contents (use with caution)' }
      },
      required: ['path']
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
    name: 'reply_email',
    description: 'Reply to an email in the Zoho inbox. Fetches the original message by subject/sender, then sends a reply with proper In-Reply-To and References headers for threading.',
    input_schema: {
      type: 'object',
      properties: {
        original_subject: { type: 'string', description: 'Subject line of the email to reply to (used to find the original)' },
        original_sender: { type: 'string', description: 'Sender email of the original message (optional, helps identify the right email)' },
        reply_body: { type: 'string', description: 'HTML body of the reply' },
        reply_all: { type: 'boolean', description: 'Reply to all recipients (default false)' }
      },
      required: ['original_subject', 'reply_body']
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
  },
  {
    name: 'send_sms',
    description: 'Send an SMS text message to a phone number via Twilio. Use UK format +44... for UK numbers.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number to send to (e.g. +447935237704)' },
        message: { type: 'string', description: 'The text message to send' }
      },
      required: ['to', 'message']
    }
  },
  {
    name: 'make_call',
    description: 'Make a voice phone call and speak a message using text-to-speech via Twilio.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number to call (e.g. +447935237704)' },
        message: { type: 'string', description: 'Message to speak on the call' }
      },
      required: ['to', 'message']
    }
  },
  {
    name: 'push_notification',
    description: 'Send a push notification to Lee across all channels (Telegram, SMS, WhatsApp). Use for alerts, task completions, important updates.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The notification message to send' },
        telegram: { type: 'boolean', description: 'Send via Telegram (default true)' },
        sms: { type: 'boolean', description: 'Send via SMS (default true)' },
        whatsapp: { type: 'boolean', description: 'Send via WhatsApp (default true)' }
      },
      required: ['message']
    }
  }
];

// Restricted tools for guest users
const GUEST_TOOL_LIST = TOOLS.filter(t => GUEST_TOOLS.has(t.name));

// ============================================================
// TOOL EXECUTORS
// ============================================================
async function executeTool(name, input, userRole) {
  // Guest restriction: only allow safe tools
  if (userRole === 'guest' && !GUEST_TOOLS.has(name)) {
    return `Error: Tool "${name}" is not available in demo mode.`;
  }

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
    case 'delete_file': {
      log(`[TOOL] delete_file: ${input.path}`);
      try {
        const stat = fs.statSync(input.path);
        if (stat.isDirectory()) {
          if (input.recursive) {
            fs.rmSync(input.path, { recursive: true, force: true });
            return `Directory deleted recursively: ${input.path}`;
          } else {
            fs.rmdirSync(input.path);
            return `Empty directory deleted: ${input.path}`;
          }
        } else {
          fs.unlinkSync(input.path);
          return `File deleted: ${input.path}`;
        }
      } catch (err) {
        return `Error deleting: ${err.message}`;
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
        `Local IP: 192.168.0.58`,
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
              messageId: parsed.messageId || '',
              snippet: bodyText,
            });
          } catch {}
        }
        connection.end();
        if (results.length === 0) return `No ${unreadOnly ? 'unread ' : ''}emails in ${folder}.`;
        let output = `${results.length} emails in ${folder}:\n\n`;
        for (const r of results.reverse()) {
          output += `From: ${r.from}\nTo: ${r.to}\nSubject: ${r.subject}\nDate: ${r.date}\nMessageID: ${r.messageId}\n${r.snippet}\n---\n`;
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
    case 'reply_email': {
      log(`[TOOL] reply_email: subject="${input.original_subject}"`);
      if (!imapSimple || !emailService) return 'Error: IMAP or email service not available.';
      try {
        // Find the original email
        const connection = await imapSimple.connect(imapConfig);
        await connection.openBox('INBOX');
        const searchCriteria = [['SUBJECT', input.original_subject]];
        const fetchOptions = { bodies: '', markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);
        if (messages.length === 0) {
          connection.end();
          return `Error: Could not find email with subject "${input.original_subject}"`;
        }
        // Get the most recent matching email
        const msg = messages[messages.length - 1];
        const raw = msg.parts.find(p => p.which === '')?.body || '';
        const parsed = await mailparser.simpleParser(raw);
        connection.end();

        const replyTo = input.original_sender || parsed.from?.value?.[0]?.address || parsed.from?.text;
        const originalMessageId = parsed.messageId || '';
        const references = parsed.references ? [].concat(parsed.references, originalMessageId).join(' ') : originalMessageId;

        const replySubject = parsed.subject?.startsWith('Re:') ? parsed.subject : `Re: ${parsed.subject}`;

        const opts = {
          to: input.reply_all ? [replyTo, ...(parsed.to?.value || []).map(v => v.address)].filter(Boolean).join(', ') : replyTo,
          subject: replySubject,
          body: input.reply_body,
          type: 'general',
          headers: {
            'In-Reply-To': originalMessageId,
            'References': references,
          },
        };

        const info = await emailService.sendEmail(opts);
        costTracker.logCall('email-send', { emails: 1, script: 'telegram-bot' });
        return `Reply sent to ${opts.to} (Subject: ${replySubject}, MessageID: ${info.messageId})`;
      } catch (err) {
        return `Error replying to email: ${err.message}`;
      }
    }
    case 'send_sms': {
      log(`[TOOL] send_sms: ${input.to} — ${input.message}`);
      if (!twilioClient) return 'Error: Twilio not configured.';
      try {
        const msg = await twilioClient.messages.create({
          body: input.message + SMS_SIGNATURE,
          from: TWILIO_FROM,
          to: input.to,
        });
        return JSON.stringify({ status: msg.status, sid: msg.sid, to: input.to });
      } catch (err) {
        return `Error sending SMS: ${err.message}`;
      }
    }
    case 'make_call': {
      log(`[TOOL] make_call: ${input.to} — ${input.message}`);
      if (!twilioClient) return 'Error: Twilio not configured.';
      try {
        const safeMsg = input.message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const call = await twilioClient.calls.create({
          twiml: `<Response><Say voice="Google.en-GB-Standard-B">${safeMsg}</Say></Response>`,
          from: TWILIO_FROM,
          to: input.to,
        });
        return JSON.stringify({ status: call.status, sid: call.sid, to: input.to });
      } catch (err) {
        return `Error making call: ${err.message}`;
      }
    }
    case 'push_notification': {
      log(`[TOOL] push_notification: ${input.message}`);
      try {
        const results = await notifyAllChannels(input.message, {
          telegram: input.telegram !== false,
          sms: input.sms !== false,
          whatsapp: input.whatsapp !== false,
        });
        return `Notification sent: ${JSON.stringify(results)}`;
      } catch (err) {
        return `Error sending notification: ${err.message}`;
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

// ============================================================
// SYSTEM PROMPTS
// ============================================================
const ADMIN_SYSTEM_PROMPT = `You are Claude, Chief of Staff at NAVADA. You are Lee Akpareva's AI partner, running on his HP laptop (permanent always-on home server). You are communicating via Telegram from his iPhone.

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
- Local IP: 192.168.0.58 | Tailscale: 100.121.187.67
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
- REPLY to emails via reply_email tool (proper threading with In-Reply-To headers)
- READ sent items via read_inbox with folder "Sent"
- You can compose, send, read, reply, and manage all email communications

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

## MCP Server Access (23 Servers)
You have access to all MCP servers via shell commands:
- **PostgreSQL**: \`psql -h localhost -p 5433 -U navada -d navada_pipeline -c "SELECT ..."\` or use Node pg module
- **LinkedIn**: \`node Automation/linkedin-post.js "Post text"\` to publish to LinkedIn
- **Twilio SMS/Call**: Use the send_sms and make_call tools to text or call any phone number. Lee's number: +447935237704. NAVADA Twilio number: ${TWILIO_FROM}
- **Puppeteer**: Browser automation via Node scripts
- **DuckDB**: \`node -e "const duckdb = require('duckdb'); ..."\` for analytical queries
- **Jupyter**: Start/manage notebooks via scripts
- **GitHub CLI**: \`gh repo list\`, \`gh pr create\`, etc.
- **Bright Data**: Web scraping via API
- **SQLite**: Direct file access for pipeline.db
- **Docker**: Container management via docker CLI
- All 23 MCP servers accessible via run_shell

## File Management
You can read, write, list, AND delete files. Use delete_file tool for cleanup.

## Tools Available
You have FULL server access: run any bash command, read/write/delete files, list directories, server status, send emails, read inbox, reply to emails, generate images (DALL-E 3), send voice notes, post to LinkedIn, access all MCP integrations. You ARE the server operator. Same level of access as Claude Code. No restrictions.`;

function buildGuestSystemPrompt(displayName) {
  const nameGreeting = displayName ? `You are speaking with ${displayName}.` : '';
  return `You are Claude, the AI Chief of Staff powering NAVADA Edge. You report to Lee Akpareva (Founder of NAVADA). You manage this entire server ecosystem 24/7.

${nameGreeting}${displayName ? ' Address them by name naturally (not every message, but warmly).' : ''}

## What is NAVADA Edge?
NAVADA Edge is an autonomous AI home server managed by Claude as Chief of Staff. It runs 8 always-on services, 18 scheduled automations, and provides AI-powered management of email, monitoring, content generation, and more, all controlled via Telegram.

## Your Role
You are the AI Chief of Staff. This user has been granted access to NAVADA Edge by Lee. Be helpful, professional, knowledgeable, and genuinely useful. Show the power of having an AI Chief of Staff.

## What You Can Do
- Check server status, uptime, processes, Docker containers, network
- Generate images with DALL-E 3
- Research any topic in depth
- Draft content, emails, reports
- Answer questions about AI, technology, business, and anything else
- Discuss what NAVADA Edge can do and how it works

## Access Level
This user has standard access. Some administrative functions (file management, email, service control, deployments) are reserved for the server owner. If asked about restricted features, explain they're available on a full NAVADA Edge deployment.

## GUARDRAILS (CRITICAL)
You MUST follow these rules strictly:
- NEVER reveal other users' names, IDs, messages, or any personal data
- NEVER share Lee's personal information (phone, personal email, home address, financial details)
- NEVER expose server credentials, API keys, tokens, passwords, or .env contents
- NEVER reveal internal client lists, prospect data, CRM records, or business financials
- NEVER disclose exact file paths, database contents, or internal configuration details
- NEVER share cost/billing data beyond what /costs shows publicly
- If asked about other users, say "I can't share information about other users"
- If asked about internal systems beyond what's visible, say "That's part of the server administration layer"
- You CAN freely discuss: NAVADA Edge capabilities, general architecture, how AI agents work, technology topics, and anything the user wants help with

## Response Style
- Warm, professional, and genuinely helpful
- Concise and mobile-friendly (users are on phones)
- Be conversational, not robotic
- When relevant, mention what NAVADA Edge can do, but don't oversell

## About NAVADA
Founded by Lee Akpareva. 17+ years in digital transformation across insurance, finance, healthcare, aviation, logistics, e-commerce.
Products: NAVADA Edge, WorldMonitor, Trading Lab, Robotics, ALEX.
Website: www.navada-lab.space

Current AI model: ${currentModelName}`;
}

// ============================================================
// CORE: Claude with Tool Use
// ============================================================
async function askClaude(ctx, userMessage) {
  if (!anthropic) return ctx.reply('Anthropic API key not configured.');

  const userId = ctx.state.userId;
  const userRole = ctx.state.userRole;
  const username = ctx.state.username;

  log(`[USER:${userId}] ${userMessage}`);

  // Log inbound interaction
  logInteraction({
    direction: 'in',
    userId,
    username,
    model: currentModelName,
    message: userMessage.slice(0, 500),
  });

  // Get per-user conversation history
  const history = getUserHistory(userId);
  history.push({ role: 'user', content: userMessage });

  // Trim history
  while (history.length > MAX_HISTORY * 2) {
    history.splice(0, 2);
  }

  let loopCount = 0;
  let messages = [...history];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Name collection: if guest has no displayName, check if this message is a name response
  let resolvedDisplayName = ctx.state.displayName;
  if (userRole !== 'admin' && !resolvedDisplayName && pendingNameRequests.has(String(userId))) {
    const text = userMessage.trim();
    // If it looks like a name (1-3 words, no commands), store it
    if (!text.startsWith('/') && text.split(/\s+/).length <= 3 && text.length <= 50 && text.length >= 2) {
      const name = text.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      setUserDisplayName(userId, name);
      resolvedDisplayName = name;
      pendingNameRequests.delete(String(userId));
      userMessage = `My name is ${name}. Please greet me warmly by name and let me know you're ready to help.`;
    }
  }

  // Select system prompt and tools based on role
  const systemPrompt = userRole === 'admin' ? ADMIN_SYSTEM_PROMPT : buildGuestSystemPrompt(resolvedDisplayName);
  const toolSet = userRole === 'admin' ? TOOLS : GUEST_TOOL_LIST;

  try {
    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;

      const response = await anthropic.messages.create({
        model: currentModel,
        max_tokens: 4096,
        system: systemPrompt,
        tools: toolSet,
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
          history.push({ role: 'assistant', content: finalText });
        }
        break;
      }

      // Execute tools
      const assistantContent = response.content;
      messages.push({ role: 'assistant', content: assistantContent });

      const toolResults = [];
      for (const tool of toolBlocks) {
        log(`[TOOL CALL] ${tool.name}: ${JSON.stringify(tool.input).slice(0, 200)}`);

        // Log tool call interaction
        logInteraction({
          direction: 'tool',
          userId,
          username,
          toolName: tool.name,
          toolInput: JSON.stringify(tool.input).slice(0, 300),
        });

        const result = await executeTool(tool.name, tool.input, userRole);

        // If image was generated, send it directly to Telegram and tell Claude it's done
        let toolResultContent = truncate(result, 8000);
        if (tool.name === 'generate_image') {
          try {
            const parsed = JSON.parse(result);
            if (parsed.image_url) {
              await ctx.replyWithPhoto({ url: parsed.image_url }, {
                caption: parsed.revised_prompt ? `${parsed.revised_prompt.slice(0, 900)}` : 'Generated image'
              });
              // Tell Claude the image was already sent — do NOT include the URL
              toolResultContent = 'Image generated and already sent to the user in Telegram. Do not send the URL or image again. Just confirm it was delivered.';
            }
          } catch {}
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: toolResultContent,
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

    // Log outbound interaction with cost data
    logInteraction({
      direction: 'out',
      userId,
      username,
      model: currentModelName,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cost_gbp: estimateCost(currentModel, totalInputTokens, totalOutputTokens),
    });

    // Save trimmed history + persist to disk
    while (history.length > MAX_HISTORY * 2) {
      history.splice(0, 2);
    }
    conversationHistories.set(userId, history);
    saveConversationHistory(userId, history);

  } catch (err) {
    log(`[ERROR] Claude: ${err.message}`);
    await ctx.reply(`Error: ${err.message}`);
  }
}

// Cost estimation helper
function estimateCost(model, inputTokens, outputTokens) {
  // Prices per million tokens in USD, converted to GBP (approx 0.79)
  const rates = {
    'claude-sonnet-4-20250514': { input: 3, output: 15 },
    'claude-opus-4-20250514': { input: 15, output: 75 },
  };
  const r = rates[model] || rates['claude-sonnet-4-20250514'];
  const usd = (inputTokens * r.input + outputTokens * r.output) / 1_000_000;
  return Math.round(usd * 0.79 * 10000) / 10000; // GBP with 4 decimal places
}

// ============================================================
// SLASH COMMANDS -- Fast (no API cost)
// ============================================================

// /start
bot.start((ctx) => {
  log('/start');
  if (ctx.state.userRole === 'admin') {
    ctx.reply(
      `NAVADA | Claude Chief of Staff\n\n` +
      `Connected: ${os.hostname()}\n` +
      `Status: Online\n` +
      `AI: ${currentModelName} (Anthropic API)\n` +
      `Tools: shell, files, email, PM2, Docker, Tailscale, LinkedIn\n\n` +
      `I have full control of this server. Tell me what you need.\n\n` +
      `Type /help for all commands, or just talk naturally.`
    );
  } else {
    // Guest welcome
    const displayName = ctx.state.displayName;
    if (displayName) {
      ctx.reply(
        `Welcome back, ${displayName}!\n\n` +
        `NAVADA Edge | Powered by Claude\n\n` +
        `You're connected to a live autonomous AI server managed by Claude, your AI Chief of Staff.\n\n` +
        `What I Can Help With:\n` +
        `- Server status and monitoring\n` +
        `- AI image generation (DALL-E 3)\n` +
        `- Research any topic in depth\n` +
        `- Draft content and ideas\n` +
        `- Answer any question\n\n` +
        `Type /help for commands, or just chat naturally.`
      );
    } else {
      // First time: ask for name
      pendingNameRequests.add(String(ctx.state.userId));
      ctx.reply(
        `Welcome to NAVADA Edge\n\n` +
        `You're now connected to a live autonomous AI server, powered by Claude.\n\n` +
        `I'm Claude, the AI Chief of Staff here. I manage this entire server ecosystem 24/7 and I'm here to help you.\n\n` +
        `Before we get started, what's your name?`
      );
    }
  }
});

// /help
bot.help((ctx) => {
  log('/help');
  if (ctx.state.userRole === 'admin') {
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
      `/ralph - Self-improvement (Ralph Wiggum)\n` +
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
      `/sent - View sent emails\n` +
      `/linkedin <text> - Post to LinkedIn\n` +
      `/sms <number> <message> - Send SMS\n` +
      `/call <number> <message> - Voice call with message\n\n` +
      `CREATIVE\n` +
      `/present <topic> - Email HTML presentation\n` +
      `/report <topic> - Generate & email report\n` +
      `/research <topic> - Deep research task\n` +
      `/draft <topic> - Draft content\n` +
      `/image <description> - Generate DALL-E 3 image\n\n` +
      `VOICE\n` +
      `/voice - Voice system control\n` +
      `/voicenote <message> - Send voice email to Lee\n\n` +
      `ADMIN\n` +
      `/grant <user_id> [days] - Grant bot access\n` +
      `/revoke <user_id> - Remove bot access\n` +
      `/users - List authorized users\n\n` +
      `OTHER\n` +
      `/shell <cmd> - Run shell command\n` +
      `/costs - Today's API costs\n` +
      `/memory - Check memory status\n` +
      `/clear - Reset conversation + memory\n` +
      `/about - About NAVADA\n\n` +
      `Or just type naturally. I understand everything.`
    );
  } else {
    const name = ctx.state.displayName;
    ctx.reply(
      `NAVADA Edge | Your Commands${name ? ` (${name})` : ''}\n\n` +
      `SERVER\n` +
      `/status - Server health check\n` +
      `/uptime - Server uptime\n` +
      `/ip - Network addresses\n` +
      `/pm2 - Running services\n` +
      `/docker - Docker containers\n` +
      `/disk - Disk usage\n` +
      `/processes - All processes\n` +
      `/tasks - Scheduled automations\n` +
      `/costs - API usage today\n\n` +
      `AI & CREATIVE\n` +
      `/image <description> - Generate AI image\n` +
      `/research <topic> - Deep research\n` +
      `/draft <topic> - Draft content\n` +
      `/sonnet - Switch to Sonnet 4 (fast)\n` +
      `/opus - Switch to Opus 4 (powerful)\n` +
      `/model - Show current AI model\n\n` +
      `INFO\n` +
      `/about - About NAVADA\n` +
      `/memory - Session info\n` +
      `/help - This menu\n\n` +
      `Or just type naturally. I'm Claude, your AI Chief of Staff.`
    );
  }
});

// /clear (admin only)
bot.command('clear', (ctx) => {
  if (ctx.state.userRole !== 'admin') return ctx.reply('Admin only.');
  const userId = ctx.state.userId;
  conversationHistories.set(userId, []);
  saveConversationHistory(userId, []);
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
    `Local: 192.168.0.58\n` +
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
    `Server: NAVADA Edge Infrastructure\n` +
    `23 MCP servers, 18 automations, 8 PM2 services`
  );
});

// ============================================================
// ADMIN COMMANDS (user management)
// ============================================================

// /grant <user_id> [days]
bot.command('grant', (ctx) => {
  if (ctx.state.userRole !== 'admin') return ctx.reply('Admin only.');
  const args = ctx.message.text.replace('/grant', '').trim().split(/\s+/);
  const targetId = args[0];
  const days = parseInt(args[1]) || 7;

  if (!targetId) return ctx.reply('Usage: /grant <user_id> [days]\nDefault: 7 days access');

  const data = loadUsers();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  data.users[targetId] = {
    username: 'guest',
    displayName: null,
    role: 'guest',
    grantedAt: new Date().toISOString(),
    expiresAt,
    grantedBy: String(ctx.state.userId),
  };
  saveUsers(data);

  log(`/grant ${targetId} ${days}d`);
  ctx.reply(`Access granted to user ${targetId}\nRole: guest\nExpires: ${expiresAt}\nDuration: ${days} days`);
});

// /revoke <user_id>
bot.command('revoke', (ctx) => {
  if (ctx.state.userRole !== 'admin') return ctx.reply('Admin only.');
  const targetId = ctx.message.text.replace('/revoke', '').trim();
  if (!targetId) return ctx.reply('Usage: /revoke <user_id>');
  if (targetId === String(OWNER_ID)) return ctx.reply('Cannot revoke owner access.');

  const data = loadUsers();
  if (data.users[targetId]) {
    delete data.users[targetId];
    saveUsers(data);
    // Clean up guest memory
    const guestMemory = path.join(MEMORY_DIR, `telegram-memory-${targetId}.json`);
    try { if (fs.existsSync(guestMemory)) fs.unlinkSync(guestMemory); } catch {}
    log(`/revoke ${targetId}`);
    ctx.reply(`Access revoked for user ${targetId}`);
  } else {
    ctx.reply(`User ${targetId} not found in registry.`);
  }
});

// /users
bot.command('users', (ctx) => {
  if (ctx.state.userRole !== 'admin') return ctx.reply('Admin only.');
  const data = loadUsers();
  const entries = Object.entries(data.users);
  if (entries.length === 0) return ctx.reply('No registered users.');

  let msg = `Authorized Users (${entries.length})\n\n`;
  for (const [id, user] of entries) {
    const isExpired = user.expiresAt && new Date(user.expiresAt) < new Date();
    const expiry = user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('en-GB') : 'never';
    msg += `${user.role === 'admin' ? '[ADMIN]' : '[GUEST]'} ${id}\n`;
    msg += `  @${user.username || 'unknown'}\n`;
    msg += `  Expires: ${expiry}${isExpired ? ' [EXPIRED]' : ''}\n`;
    msg += `  Granted: ${new Date(user.grantedAt).toLocaleDateString('en-GB')}\n\n`;
  }
  ctx.reply(msg);
  log('/users');
});

// ============================================================
// SLASH COMMANDS -- Smart (routed through Claude)
// ============================================================

// Command guard middleware helper
function guardCommand(command, handler) {
  bot.command(command, (ctx) => {
    if (!isCommandAllowed(command, ctx.state.userRole)) {
      return ctx.reply(`This command requires admin access.\nType /help to see your available commands.`);
    }
    return handler(ctx);
  });
}

// /status
bot.command('status', async (ctx) => {
  log('/status');
  await askClaude(ctx, 'Give me a quick server status: uptime, RAM, disk, PM2 processes, Docker, Tailscale. Keep it concise for mobile.');
});

// /disk
guardCommand('disk', async (ctx) => {
  log('/disk');
  await askClaude(ctx, 'Check disk usage on all drives. Show used/total and percentage. Keep it brief.');
});

// /processes
guardCommand('processes', async (ctx) => {
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
    if (ctx.state.userRole !== 'admin') return ctx.reply('PM2 management is admin only.');
    await askClaude(ctx, `Run this PM2 command: pm2 ${args}`);
  }
});

// /pm2restart
guardCommand('pm2restart', async (ctx) => {
  const name = ctx.message.text.replace('/pm2restart', '').trim();
  log(`/pm2restart ${name}`);
  if (!name) return ctx.reply('Usage: /pm2restart <service-name>');
  await askClaude(ctx, `Restart the PM2 service "${name}" and confirm it's back online.`);
});

// /pm2stop
guardCommand('pm2stop', async (ctx) => {
  const name = ctx.message.text.replace('/pm2stop', '').trim();
  log(`/pm2stop ${name}`);
  if (!name) return ctx.reply('Usage: /pm2stop <service-name>');
  await askClaude(ctx, `Stop the PM2 service "${name}" and confirm.`);
});

// /pm2start
guardCommand('pm2start', async (ctx) => {
  const name = ctx.message.text.replace('/pm2start', '').trim();
  log(`/pm2start ${name}`);
  if (!name) return ctx.reply('Usage: /pm2start <service-name>');
  await askClaude(ctx, `Start the PM2 service "${name}" and confirm it's running.`);
});

// /pm2logs
guardCommand('pm2logs', async (ctx) => {
  const name = ctx.message.text.replace('/pm2logs', '').trim();
  log(`/pm2logs ${name}`);
  if (!name) return ctx.reply('Usage: /pm2logs <service-name>');
  await askClaude(ctx, `Show the last 30 lines of PM2 logs for "${name}". Summarise any errors.`);
});

// /news
guardCommand('news', async (ctx) => {
  log('/news');
  await askClaude(ctx, 'Run the AI news digest script: node Automation/ai-news-mailer.js. Show me the output.');
});

// /jobs
guardCommand('jobs', async (ctx) => {
  log('/jobs');
  await askClaude(ctx, 'Run the job hunter script: node Automation/job-hunter-apify.js. Show me the output summary.');
});

// /pipeline
guardCommand('pipeline', async (ctx) => {
  log('/pipeline');
  await askClaude(ctx, 'Run the lead pipeline: node LeadPipeline/pipeline.js. Show me the results.');
});

// /prospect
guardCommand('prospect', async (ctx) => {
  log('/prospect');
  await askClaude(ctx, 'Run the prospect pipeline: node LeadPipeline/prospect-pipeline.js. Show me the results.');
});

// /ralph — Self-improvement system (Ralph Wiggum)
guardCommand('ralph', async (ctx) => {
  const args = ctx.message.text.replace('/ralph', '').trim();
  log(`/ralph ${args}`);

  // No args = show status + current findings
  if (!args) {
    try {
      const logPath = path.join(NAVADA_DIR, 'Automation', 'kb', 'improvement-log.json');
      const histPath = path.join(NAVADA_DIR, 'Automation', 'kb', 'improvement-history.json');
      const runLog = path.join(NAVADA_DIR, 'Automation', 'logs', 'self-improve.log');

      let msg = `RALPH WIGGUM | Self-Improvement System\n\n`;

      // Current findings
      if (fs.existsSync(logPath)) {
        const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        const scanned = data.scannedAt ? new Date(data.scannedAt).toLocaleString('en-GB', { timeZone: 'Europe/London' }) : 'unknown';
        msg += `Week ${data.week || '?'} | Last scan: ${scanned}\n`;
        msg += `Findings: ${(data.findings || []).length}\n\n`;

        const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
        const catEmoji = { BUG: '🐛', SECURITY: '🔒', PERFORMANCE: '⚡', NEW_TOOL: '🔧', IDEA: '💡', MAINTENANCE: '🧹' };

        (data.findings || []).forEach(f => {
          const pEmoji = priorityEmoji[f.priority] || '⚪';
          const cEmoji = catEmoji[f.category] || '📌';
          msg += `${pEmoji} #${f.id} ${cEmoji} ${f.title}\n`;
          msg += `   ${f.category} | ${f.priority} | ${f.effort}\n\n`;
        });
      } else {
        msg += `No current findings. Run /ralph scan to start.\n\n`;
      }

      // History summary
      if (fs.existsSync(histPath)) {
        const hist = JSON.parse(fs.readFileSync(histPath, 'utf8'));
        const totalFindings = (hist.weeks || []).reduce((sum, w) => sum + (w.findings || []).length, 0);
        const totalApproved = (hist.weeks || []).reduce((sum, w) => sum + (w.approvedItems || []).length, 0);
        msg += `History: ${(hist.weeks || []).length} scans | ${totalFindings} findings | ${totalApproved} approved\n\n`;
      }

      msg += `COMMANDS\n`;
      msg += `/ralph - Show status + findings\n`;
      msg += `/ralph scan - Run new scan now\n`;
      msg += `/ralph approve 1,3,5 - Approve findings by ID\n`;
      msg += `/ralph approve all - Approve all findings\n`;
      msg += `/ralph history - Full scan history\n`;
      msg += `/ralph detail <id> - Full details on a finding`;

      return ctx.reply(msg);
    } catch (e) {
      return ctx.reply(`Ralph error: ${e.message}`);
    }
  }

  // /ralph scan
  if (args === 'scan') {
    ctx.reply('Ralph is scanning... This takes about 30-60 seconds.');
    await askClaude(ctx, `Run the self-improvement scan: node Automation/self-improve.js. Show me the output and tell me how many findings were generated.`);
    return;
  }

  // /ralph approve <ids>
  if (args.startsWith('approve')) {
    const ids = args.replace('approve', '').trim();
    if (!ids) return ctx.reply('Usage: /ralph approve 1,3,5 or /ralph approve all');

    if (ids === 'all') {
      try {
        const logPath = path.join(NAVADA_DIR, 'Automation', 'kb', 'improvement-log.json');
        const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        const allIds = (data.findings || []).map(f => f.id).join(',');
        ctx.reply(`Approving all ${(data.findings || []).length} findings. Executing...`);
        await askClaude(ctx, `Run: node Automation/self-improve.js --execute ${allIds}. Show me what was fixed.`);
      } catch (e) {
        return ctx.reply(`Error: ${e.message}`);
      }
    } else {
      ctx.reply(`Approving findings: ${ids}. Executing...`);
      await askClaude(ctx, `Run: node Automation/self-improve.js --execute ${ids}. Show me what was fixed.`);
    }
    return;
  }

  // /ralph history
  if (args === 'history') {
    try {
      const histPath = path.join(NAVADA_DIR, 'Automation', 'kb', 'improvement-history.json');
      if (!fs.existsSync(histPath)) return ctx.reply('No history yet. Run /ralph scan first.');

      const hist = JSON.parse(fs.readFileSync(histPath, 'utf8'));
      let msg = `RALPH | Scan History\n\n`;

      (hist.weeks || []).slice(-8).reverse().forEach(w => {
        const date = w.scannedAt ? new Date(w.scannedAt).toLocaleDateString('en-GB') : 'unknown';
        const approved = (w.approvedItems || []).length;
        const total = (w.findings || []).length;
        const cats = {};
        (w.findings || []).forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1; });
        const catStr = Object.entries(cats).map(([k, v]) => `${k}:${v}`).join(' ');
        msg += `Week ${w.week || '?'} (${date}) | ${total} findings | ${approved} approved\n`;
        msg += `   ${catStr}\n\n`;
      });

      return ctx.reply(msg);
    } catch (e) {
      return ctx.reply(`Error: ${e.message}`);
    }
  }

  // /ralph detail <id>
  if (args.startsWith('detail')) {
    const id = parseInt(args.replace('detail', '').trim());
    if (isNaN(id)) return ctx.reply('Usage: /ralph detail <id>\nExample: /ralph detail 3');

    try {
      const logPath = path.join(NAVADA_DIR, 'Automation', 'kb', 'improvement-log.json');
      const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      const finding = (data.findings || []).find(f => f.id === id);
      if (!finding) return ctx.reply(`Finding #${id} not found. Run /ralph to see current findings.`);

      const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
      const pEmoji = priorityEmoji[finding.priority] || '⚪';

      let msg = `RALPH | Finding #${finding.id}\n\n`;
      msg += `${pEmoji} ${finding.title}\n\n`;
      msg += `Category: ${finding.category}\n`;
      msg += `Priority: ${finding.priority}\n`;
      msg += `Effort: ${finding.effort}\n\n`;
      msg += `PROBLEM\n${finding.description}\n\n`;
      msg += `ACTION\n${finding.action}\n\n`;
      msg += `Approve: /ralph approve ${finding.id}`;

      return ctx.reply(msg);
    } catch (e) {
      return ctx.reply(`Error: ${e.message}`);
    }
  }

  // Unknown subcommand
  ctx.reply(
    `Unknown: /ralph ${args}\n\n` +
    `Usage:\n` +
    `/ralph - Status + findings\n` +
    `/ralph scan - Run new scan\n` +
    `/ralph approve 1,3 - Approve & execute\n` +
    `/ralph history - Scan history\n` +
    `/ralph detail <id> - Finding details`
  );
});

// /run
guardCommand('run', async (ctx) => {
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
guardCommand('ls', async (ctx) => {
  const dir = ctx.message.text.replace('/ls', '').trim() || NAVADA_DIR;
  log(`/ls ${dir}`);
  await askClaude(ctx, `List the contents of directory: ${dir}`);
});

// /cat
guardCommand('cat', async (ctx) => {
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
guardCommand('shell', async (ctx) => {
  const cmd = ctx.message.text.replace('/shell', '').trim();
  log(`/shell ${cmd}`);
  if (!cmd) return ctx.reply('Usage: /shell <command>');
  await askClaude(ctx, `Run this shell command and show me the output: ${cmd}`);
});

// /voice
guardCommand('voice', async (ctx) => {
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
guardCommand('email', async (ctx) => {
  const args = ctx.message.text.replace('/email', '').trim();
  log(`/email ${args}`);
  if (!args) return ctx.reply('Usage: /email <to> <subject> | <body>\nExample: /email lee@test.com Hello | This is a test');
  await askClaude(ctx, `Send an email with these details: ${args}. Parse the "to", "subject" (before the |), and "body" (after the |). Use the send_email tool.`);
});

// /emailme
guardCommand('emailme', async (ctx) => {
  const args = ctx.message.text.replace('/emailme', '').trim();
  log(`/emailme ${args}`);
  if (!args) return ctx.reply('Usage: /emailme <subject> | <body>');
  await askClaude(ctx, `Send an email to Lee (leeakpareva@gmail.com) with these details: ${args}. Parse "subject" (before the |) and "body" (after the |). Use the send_email tool.`);
});

// /briefing
guardCommand('briefing', async (ctx) => {
  log('/briefing');
  await askClaude(ctx, 'Run the morning briefing script: node Automation/morning-briefing.js. Show me the output or confirm it was sent.');
});

// /inbox
guardCommand('inbox', async (ctx) => {
  const args = ctx.message.text.replace('/inbox', '').trim();
  log(`/inbox ${args}`);
  if (args) {
    await askClaude(ctx, `Check my Zoho inbox (claude.navada@zohomail.eu) and search for emails matching "${args}". Use the read_inbox tool. Summarise what you find.`);
  } else {
    await askClaude(ctx, 'Check my Zoho inbox (claude.navada@zohomail.eu) for recent unread emails. Use the read_inbox tool. Summarise each email briefly.');
  }
});

// /sent — read Sent folder directly (no Claude, no hallucination)
guardCommand('sent', async (ctx) => {
  log('/sent');
  if (!imapSimple) return ctx.reply('IMAP not available.');
  try {
    await ctx.reply('Checking Sent folder...');
    const connection = await imapSimple.connect(imapConfig);
    await connection.openBox('Sent');
    const messages = await connection.search([['ALL']], { bodies: '', markSeen: false });
    const recent = messages.slice(-5);
    const results = [];
    for (const msg of recent) {
      try {
        const raw = msg.parts.find(p => p.which === '')?.body || '';
        const parsed = await mailparser.simpleParser(raw);
        results.push({
          to: parsed.to?.text || '',
          subject: parsed.subject || '(no subject)',
          date: parsed.date ? parsed.date.toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'unknown',
        });
      } catch {}
    }
    connection.end();
    if (results.length === 0) return ctx.reply('No emails found in Sent folder.');
    let msg = 'SENT EMAILS (last 5)\n\n';
    for (const r of results.reverse()) {
      msg += `To: ${r.to}\nSubject: ${r.subject}\nDate: ${r.date}\n\n`;
    }
    return ctx.reply(msg);
  } catch (err) {
    return ctx.reply(`Error reading Sent folder: ${err.message}`);
  }
});

// /linkedin
guardCommand('linkedin', async (ctx) => {
  const text = ctx.message.text.replace('/linkedin', '').trim();
  log(`/linkedin ${text}`);
  if (!text) return ctx.reply('Usage: /linkedin <post text>\nExample: /linkedin Excited to announce...');
  await askClaude(ctx, `Post to LinkedIn using: node Automation/linkedin-post.js "${text.replace(/"/g, '\\"')}". This publishes directly to Lee's LinkedIn profile. Run the command and confirm the result.`);
});

// /sms <number> <message>
guardCommand('sms', async (ctx) => {
  const args = ctx.message.text.replace('/sms', '').trim();
  log(`/sms ${args}`);
  const match = args.match(/^(\+?\d[\d\s-]{7,})\s+(.+)$/s);
  if (!match) return ctx.reply('Usage: /sms <number> <message>\nExample: /sms +447935237704 Hey, checking in!');
  const to = match[1].replace(/[\s-]/g, '');
  const body = match[2].trim();
  if (!twilioClient) return ctx.reply('Twilio not configured.');
  try {
    const msg = await twilioClient.messages.create({
      body: body + SMS_SIGNATURE,
      from: TWILIO_FROM,
      to,
    });
    ctx.reply(`SMS sent to ${to}\nSID: ${msg.sid}\nStatus: ${msg.status}`);
    log(`SMS sent to ${to} — SID: ${msg.sid}`);
  } catch (err) {
    ctx.reply(`SMS failed: ${err.message}`);
    log(`SMS error: ${err.message}`);
  }
});

// /call <number> <message>
guardCommand('call', async (ctx) => {
  const args = ctx.message.text.replace('/call', '').trim();
  log(`/call ${args}`);
  const match = args.match(/^(\+?\d[\d\s-]{7,})\s+(.+)$/s);
  if (!match) return ctx.reply('Usage: /call <number> <message>\nExample: /call +447935237704 Your NAVADA report is ready');
  const to = match[1].replace(/[\s-]/g, '');
  const message = match[2].trim();
  if (!twilioClient) return ctx.reply('Twilio not configured.');
  try {
    const call = await twilioClient.calls.create({
      twiml: `<Response><Say voice="Google.en-GB-Standard-B">${message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Say></Response>`,
      from: TWILIO_FROM,
      to,
    });
    ctx.reply(`Calling ${to}...\nSID: ${call.sid}\nStatus: ${call.status}`);
    log(`Call to ${to} — SID: ${call.sid}`);
  } catch (err) {
    ctx.reply(`Call failed: ${err.message}`);
    log(`Call error: ${err.message}`);
  }
});

// /notify <message> — push notification to all channels
guardCommand('notify', async (ctx) => {
  const message = ctx.message.text.replace('/notify', '').trim();
  if (!message) return ctx.reply('Usage: /notify <message>\nSends push notification via Telegram + SMS + WhatsApp');
  log(`/notify: ${message}`);
  const results = await notifyAllChannels(message, { telegram: false, sms: true, whatsapp: true });
  ctx.reply(`Push notification sent:\nSMS: ${results.sms}\nWhatsApp: ${results.whatsapp}\n(Telegram: you're already here)`);
});

// /memory
bot.command('memory', (ctx) => {
  log('/memory');
  const userId = ctx.state.userId;
  const history = getUserHistory(userId);
  const memFile = getMemoryFile(userId);
  const memSize = fs.existsSync(memFile) ? (fs.statSync(memFile).size / 1024).toFixed(1) : '0';
  ctx.reply(
    `Memory Status\n\n` +
    `Conversation turns: ${history.length}\n` +
    `Memory file: ${memSize} KB\n` +
    `Max history: ${MAX_HISTORY * 2} turns\n` +
    `Persistent: Yes (survives restarts)\n` +
    `Model: ${currentModelName}\n` +
    `Role: ${ctx.state.userRole}\n\n` +
    `Use /clear to reset memory.`
  );
});

// ============================================================
// CREATIVE COMMANDS
// ============================================================

// /present
guardCommand('present', async (ctx) => {
  const topic = ctx.message.text.replace('/present', '').trim();
  log(`/present ${topic}`);
  if (!topic) return ctx.reply('Usage: /present <topic>\nExample: /present NAVADA Edge');
  await askClaude(ctx, `Create a beautiful HTML presentation about "${topic}" and send it to Lee (leeakpareva@gmail.com) using the send_email tool with raw_html. Make it magazine-style with a dark theme (#0a0a0a background), bold typography, sections with visual flair, NAVADA branding. Use inline CSS only, table layout for email compatibility. Make it impressive and professional. Subject should be: "${topic} | NAVADA Presentation".`);
});

// /report
guardCommand('report', async (ctx) => {
  const topic = ctx.message.text.replace('/report', '').trim();
  log(`/report ${topic}`);
  if (!topic) return ctx.reply('Usage: /report <topic>\nExample: /report weekly server health');
  await askClaude(ctx, `Research and generate a professional report about "${topic}". Use your tools to gather real data from the server if relevant. Then email it to Lee (leeakpareva@gmail.com) using the send_email tool with proper formatting. Subject: "${topic} Report | NAVADA".`);
});

// /research (available to guests)
bot.command('research', async (ctx) => {
  const topic = ctx.message.text.replace('/research', '').trim();
  log(`/research ${topic}`);
  if (!topic) return ctx.reply('Usage: /research <topic>');
  await askClaude(ctx, `Deep research task: "${topic}". Use your tools to investigate thoroughly. Check files, run commands, gather data. Give me a comprehensive but mobile-friendly summary of findings.`);
});

// /voicenote
guardCommand('voicenote', async (ctx) => {
  const args = ctx.message.text.replace('/voicenote', '').trim();
  log(`/voicenote ${args}`);
  if (!args) return ctx.reply('Usage: /voicenote <message>\nSends a voice note to Lee via email.\nExample: /voicenote Good morning Lee, here is your daily update');
  await askClaude(ctx, `Generate a voice note and email it to Lee (leeakpareva@gmail.com). The message to speak: "${args}". Run: node Automation/voice-service.js leeakpareva@gmail.com "${args.replace(/"/g, '\\"')}". Show me the result.`);
});

// /image (available to guests)
bot.command('image', async (ctx) => {
  const prompt = ctx.message.text.replace('/image', '').trim();
  log(`/image ${prompt}`);
  if (!prompt) return ctx.reply('Usage: /image <description>\nExample: /image futuristic NAVADA logo with neural network motif');
  await askClaude(ctx, `Generate an image using DALL-E 3 with this description: "${prompt}". Use the generate_image tool. Use HD quality for best results.`);
});

// /draft (available to guests)
bot.command('draft', async (ctx) => {
  const topic = ctx.message.text.replace('/draft', '').trim();
  log(`/draft ${topic}`);
  if (!topic) return ctx.reply('Usage: /draft <topic>\nExample: /draft LinkedIn post about AI agents');
  await askClaude(ctx, `Draft professional content about "${topic}". This could be a LinkedIn post, email, blog post, or any written content. Follow NAVADA content rules (no client names, no em dashes). Present the draft for my review.`);
});

// ============================================================
// PHOTO & DOCUMENT HANDLERS
// ============================================================
bot.on('photo', async (ctx) => {
  if (ctx.state.userRole !== 'admin') {
    return ctx.reply('Photo uploads require admin access. Try /image to generate AI images instead!');
  }
  try {
    const photos = ctx.message.photo;
    const largest = photos[photos.length - 1]; // highest resolution
    const file = await ctx.telegram.getFile(largest.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const ext = path.extname(file.file_path) || '.jpg';
    const filename = `photo_${Date.now()}${ext}`;
    const destPath = path.join(UPLOADS_DIR, filename);

    await downloadFile(fileUrl, destPath);
    log(`[PHOTO] Saved: ${destPath}`);

    const caption = ctx.message.caption || '';
    const msg = `Photo received and saved to ${destPath}. ${caption ? `Caption: "${caption}". ` : ''}What would you like me to do with this image?`;
    await askClaude(ctx, msg);
  } catch (err) {
    log(`[ERROR] Photo handler: ${err.message}`);
    await ctx.reply(`Error saving photo: ${err.message}`);
  }
});

bot.on('document', async (ctx) => {
  if (ctx.state.userRole !== 'admin') {
    return ctx.reply('File uploads require admin access.');
  }
  try {
    const doc = ctx.message.document;
    const file = await ctx.telegram.getFile(doc.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const filename = doc.file_name || `document_${Date.now()}`;
    const destPath = path.join(UPLOADS_DIR, filename);

    await downloadFile(fileUrl, destPath);
    log(`[DOCUMENT] Saved: ${destPath} (${doc.mime_type}, ${doc.file_size} bytes)`);

    const caption = ctx.message.caption || '';
    const msg = `Document received: "${filename}" (${doc.mime_type}, ${Math.round(doc.file_size / 1024)}KB). Saved to ${destPath}. ${caption ? `Caption: "${caption}". ` : ''}What would you like me to do with this file?`;
    await askClaude(ctx, msg);
  } catch (err) {
    log(`[ERROR] Document handler: ${err.message}`);
    await ctx.reply(`Error saving document: ${err.message}`);
  }
});

// ============================================================
// ALL TEXT -- Natural language goes to Claude
// ============================================================
bot.on('text', async (ctx) => {
  // If guest has no name and we haven't asked yet, ask now
  if (ctx.state.userRole !== 'admin' && !ctx.state.displayName && !pendingNameRequests.has(String(ctx.state.userId))) {
    pendingNameRequests.add(String(ctx.state.userId));
    // Process their message but also ask for name
    await askClaude(ctx, ctx.message.text);
    await ctx.reply(`By the way, I'd love to know your name! Just type it and I'll remember you.`);
    return;
  }
  await askClaude(ctx, ctx.message.text);
});

// --- Error handling ---
bot.catch((err, ctx) => {
  console.error(`[ERROR] ${err.message}`);
  log(`[ERROR] ${err.message}`);
});

// ============================================================
// REGISTER COMMANDS WITH TELEGRAM
// ============================================================
async function registerCommands() {
  try {
    // Admin commands (visible to owner)
    const adminCommands = [
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
      { command: 'ralph', description: 'Self-improvement system' },
      { command: 'run', description: 'Run any script' },
      { command: 'tasks', description: 'Windows scheduled tasks' },
      // Communication
      { command: 'email', description: 'Send email (to subject | body)' },
      { command: 'emailme', description: 'Email Lee (subject | body)' },
      { command: 'briefing', description: 'Run morning briefing' },
      { command: 'inbox', description: 'Check Zoho inbox' },
      { command: 'sent', description: 'View sent emails' },
      { command: 'linkedin', description: 'Post to LinkedIn' },
      { command: 'sms', description: 'Send SMS to a number' },
      { command: 'call', description: 'Voice call with message' },
      { command: 'notify', description: 'Push notify all channels' },
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
      // Admin
      { command: 'grant', description: 'Grant bot access (admin)' },
      { command: 'revoke', description: 'Remove bot access (admin)' },
      { command: 'users', description: 'List authorized users (admin)' },
      { command: 'help', description: 'Show all commands' },
    ];

    // Set default commands (guests see these in autocomplete)
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Welcome to NAVADA Edge' },
      { command: 'help', description: 'Your available commands' },
      { command: 'status', description: 'Server health check' },
      { command: 'image', description: 'Generate AI image (DALL-E 3)' },
      { command: 'research', description: 'Deep research on any topic' },
      { command: 'draft', description: 'Draft content' },
      { command: 'about', description: 'About NAVADA' },
      { command: 'pm2', description: 'Running services' },
      { command: 'sonnet', description: 'Switch to Sonnet 4 (fast)' },
      { command: 'opus', description: 'Switch to Opus 4 (powerful)' },
    ]);

    // Set admin commands (owner sees the full list)
    await bot.telegram.setMyCommands(adminCommands, {
      scope: { type: 'chat', chat_id: OWNER_ID },
    });

    console.log('[NAVADA] Commands registered with Telegram');
  } catch (e) {
    console.warn('[WARN] Failed to register commands:', e.message);
  }
}

// --- Twilio Inbound SMS Webhook Server ---
const http = require('http');
const { URL } = require('url');
const WEBHOOK_PORT = 3456;

const webhookServer = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/twilio/sms') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = new URLSearchParams(body);
        const from = params.get('From') || 'unknown';
        const smsBody = params.get('Body') || '';
        const to = params.get('To') || '';
        log(`[SMS IN] From: ${from} | Body: ${smsBody}`);

        // Forward to Lee on Telegram
        await bot.telegram.sendMessage(OWNER_ID,
          `SMS received from ${from}:\n\n${smsBody}`
        );

        // If it's from Lee's number, process with Claude and reply
        if (from === '+447935237704' && smsBody.trim()) {
          // Use Claude to generate a response with tool access
          const claude = new Anthropic({ apiKey: ANTHROPIC_KEY });
          const smsTools = [
            {
              name: 'send_sms',
              description: 'Send an SMS to any phone number. Use for forwarding messages, contacting people on Lee\'s behalf.',
              input_schema: {
                type: 'object',
                properties: {
                  to: { type: 'string', description: 'Phone number (e.g. +447935237704, +2349099991025)' },
                  message: { type: 'string', description: 'Message to send' }
                },
                required: ['to', 'message']
              }
            },
            {
              name: 'run_shell',
              description: 'Run a shell command on the NAVADA server.',
              input_schema: {
                type: 'object',
                properties: { command: { type: 'string' } },
                required: ['command']
              }
            }
          ];

          let smsMessages = [{ role: 'user', content: smsBody }];
          let maxLoops = 5;

          const response = await claude.messages.create({
            model: currentModel,
            max_tokens: 1000,
            tools: smsTools,
            system: `You are Claude, Chief of Staff at NAVADA AI Engineering & Consulting. Lee Akpareva (Founder) texted you on your Twilio number (+447446994961). You have FULL access to the NAVADA server and can:
- Send SMS to ANY number worldwide using the send_sms tool
- Run shell commands on the server using run_shell
- Lee's number: +447935237704

When Lee asks you to text someone, USE the send_sms tool to do it. Do not say you can't. You have the tool.
Reply concisely (max 320 chars for text replies). Current time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}.`,
            messages: smsMessages,
          });

          // Handle tool calls
          let currentResponse = response;
          while (currentResponse.stop_reason === 'tool_use' && maxLoops-- > 0) {
            const toolUses = currentResponse.content.filter(c => c.type === 'tool_use');
            const toolResults = [];
            for (const tool of toolUses) {
              let result = '';
              if (tool.name === 'send_sms' && twilioClient) {
                try {
                  const smsMsg = await twilioClient.messages.create({
                    body: tool.input.message + SMS_SIGNATURE,
                    from: TWILIO_FROM,
                    to: tool.input.to,
                  });
                  result = JSON.stringify({ status: smsMsg.status, sid: smsMsg.sid, to: tool.input.to });
                  log(`[SMS OUT] To ${tool.input.to}: ${tool.input.message}`);
                  await bot.telegram.sendMessage(OWNER_ID, `SMS sent to ${tool.input.to}:\n\n${tool.input.message}`);
                } catch (err) {
                  result = `Error: ${err.message}`;
                }
              } else if (tool.name === 'run_shell') {
                try {
                  const { execSync } = require('child_process');
                  result = execSync(tool.input.command, { timeout: 30000, cwd: NAVADA_DIR }).toString().slice(0, 2000);
                } catch (err) {
                  result = `Error: ${err.message}`;
                }
              }
              toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
            }
            smsMessages.push({ role: 'assistant', content: currentResponse.content });
            smsMessages.push({ role: 'user', content: toolResults });
            currentResponse = await claude.messages.create({
              model: currentModel,
              max_tokens: 1000,
              tools: smsTools,
              system: `You are Claude, Chief of Staff at NAVADA. Reply concisely (max 320 chars). Current time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}.`,
              messages: smsMessages,
            });
          }

          const reply = currentResponse.content.find(c => c.type === 'text')?.text || '';

          if (reply && twilioClient) {
            await twilioClient.messages.create({
              body: reply + SMS_SIGNATURE,
              from: TWILIO_FROM,
              to: from,
            });
            log(`[SMS OUT] Reply to ${from}: ${reply}`);
            await bot.telegram.sendMessage(OWNER_ID,
              `SMS reply sent to ${from}:\n\n${reply}`
            );
          }
        }

        // Respond with empty TwiML (don't send Twilio's default reply)
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<Response></Response>');
      } catch (err) {
        log(`[SMS ERROR] ${err.message}`);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<Response></Response>');
      }
    });
  } else if (req.method === 'POST' && req.url === '/twilio/whatsapp') {
    // Inbound WhatsApp messages (same pattern as SMS)
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = new URLSearchParams(body);
        const from = (params.get('From') || '').replace('whatsapp:', '');
        const waBody = params.get('Body') || '';
        const to = params.get('To') || '';
        log(`[WHATSAPP IN] From: ${from} | Body: ${waBody}`);

        // Forward to Lee on Telegram
        await bot.telegram.sendMessage(OWNER_ID,
          `WhatsApp message from ${from}:\n\n${waBody}`
        );

        // If it's from Lee's number, process with Claude and reply
        if (from === '+447935237704' && waBody.trim()) {
          const claude = new Anthropic({ apiKey: ANTHROPIC_KEY });
          const waTools = [
            {
              name: 'send_sms',
              description: 'Send an SMS to any phone number.',
              input_schema: {
                type: 'object',
                properties: {
                  to: { type: 'string', description: 'Phone number (e.g. +447935237704)' },
                  message: { type: 'string', description: 'Message to send' }
                },
                required: ['to', 'message']
              }
            },
            {
              name: 'run_shell',
              description: 'Run a shell command on the NAVADA server.',
              input_schema: {
                type: 'object',
                properties: { command: { type: 'string' } },
                required: ['command']
              }
            }
          ];

          let waMessages = [{ role: 'user', content: waBody }];
          let maxLoops = 5;

          const response = await claude.messages.create({
            model: currentModel,
            max_tokens: 1000,
            tools: waTools,
            system: `You are Claude, Chief of Staff at NAVADA AI Engineering & Consulting. Lee Akpareva (Founder) messaged you on WhatsApp. You have FULL access to the NAVADA server. Reply concisely. Current time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}.`,
            messages: waMessages,
          });

          let currentResponse = response;
          while (currentResponse.stop_reason === 'tool_use' && maxLoops-- > 0) {
            const toolUses = currentResponse.content.filter(c => c.type === 'tool_use');
            const toolResults = [];
            for (const tool of toolUses) {
              let result = '';
              if (tool.name === 'send_sms' && twilioClient) {
                try {
                  const msg = await twilioClient.messages.create({ body: tool.input.message + SMS_SIGNATURE, from: TWILIO_FROM, to: tool.input.to });
                  result = JSON.stringify({ status: msg.status, sid: msg.sid, to: tool.input.to });
                  log(`[SMS OUT via WA] To ${tool.input.to}: ${tool.input.message}`);
                  await bot.telegram.sendMessage(OWNER_ID, `SMS sent (via WhatsApp cmd) to ${tool.input.to}:\n\n${tool.input.message}`);
                } catch (err) { result = `Error: ${err.message}`; }
              } else if (tool.name === 'run_shell') {
                try {
                  const { execSync } = require('child_process');
                  result = execSync(tool.input.command, { timeout: 30000, cwd: NAVADA_DIR }).toString().slice(0, 2000);
                } catch (err) { result = `Error: ${err.message}`; }
              }
              toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
            }
            waMessages.push({ role: 'assistant', content: currentResponse.content });
            waMessages.push({ role: 'user', content: toolResults });
            currentResponse = await claude.messages.create({
              model: currentModel, max_tokens: 1000, tools: waTools,
              system: `You are Claude, Chief of Staff at NAVADA. Reply concisely. Current time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}.`,
              messages: waMessages,
            });
          }

          const reply = currentResponse.content.find(c => c.type === 'text')?.text || '';
          if (reply && twilioClient) {
            await twilioClient.messages.create({
              body: reply,
              from: 'whatsapp:+14155238886',
              to: `whatsapp:${from}`,
              statusCallback: 'https://api.navada-edge-server.uk/twilio/status',
            });
            log(`[WHATSAPP OUT] Reply to ${from}: ${reply}`);
            await bot.telegram.sendMessage(OWNER_ID, `WhatsApp reply sent to ${from}:\n\n${reply}`);
          }
        }

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<Response></Response>');
      } catch (err) {
        log(`[WHATSAPP ERROR] ${err.message}`);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<Response></Response>');
      }
    });
  } else if (req.method === 'POST' && req.url === '/twilio/status') {
    // Twilio status callback (just acknowledge)
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end('<Response></Response>');
    });
  } else if (req.method === 'GET' && req.url === '/twilio/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'twilio-webhook' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

webhookServer.listen(WEBHOOK_PORT, '0.0.0.0', () => {
  console.log(`[NAVADA] Twilio webhook listening on port ${WEBHOOK_PORT}`);
});

// --- Launch ---
console.log('[NAVADA] Claude Chief of Staff starting...');
console.log(`[NAVADA] Model: ${currentModelName} (${currentModel})`);
console.log(`[NAVADA] Multi-user: enabled | Owner: ${OWNER_ID}`);

registerCommands();

bot.launch()
  .then(() => console.log('[NAVADA] Online. Claude Chief of Staff ready.'))
  .catch((err) => {
    console.error(`[NAVADA] Failed to start: ${err.message}`);
    process.exit(1);
  });

process.once('SIGINT', () => { webhookServer.close(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { webhookServer.close(); bot.stop('SIGTERM'); });
