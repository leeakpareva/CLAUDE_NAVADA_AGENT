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
const semanticCache = require('./semantic-cache');
const responseCache = require('./oracle-response-cache');

// --- Config ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = Number(process.env.TELEGRAM_OWNER_ID);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const NAVADA_DIR = 'C:/Users/leeak/CLAUDE_NAVADA_AGENT';
const LOG_DIR = path.join(NAVADA_DIR, 'Automation/logs');
const UPLOADS_DIR = path.join(NAVADA_DIR, 'Automation/uploads');
const MAX_MSG_LEN = 4000;
const MAX_TOOL_LOOPS = 20;

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

// --- Guest Budget Cap (£2/day per guest) ---
const GUEST_DAILY_BUDGET_GBP = 2.0;
const guestBudgets = new Map(); // userId -> { day: 'YYYY-MM-DD', spent: number }

function getGuestBudget(userId) {
  const today = new Date().toISOString().slice(0, 10);
  let entry = guestBudgets.get(String(userId));
  if (!entry || entry.day !== today) {
    entry = { day: today, spent: 0 };
    guestBudgets.set(String(userId), entry);
  }
  return entry;
}

function addGuestSpend(userId, costGbp) {
  const entry = getGuestBudget(userId);
  entry.spent += costGbp;
  return entry;
}

function checkGuestBudget(userId) {
  const entry = getGuestBudget(userId);
  const remaining = GUEST_DAILY_BUDGET_GBP - entry.spent;
  if (remaining <= 0) {
    return { allowed: false, spent: entry.spent, remaining: 0, reason: `\u26d4 *Daily limit reached*\n\nYou've used your full £${GUEST_DAILY_BUDGET_GBP.toFixed(2)} daily allowance (spent: £${entry.spent.toFixed(4)}).\n\nYour usage resets at midnight UTC. Come back tomorrow!\n\nInterested in unlimited access? Contact Lee Akpareva: leeakpareva@gmail.com` };
  }
  return { allowed: true, spent: entry.spent, remaining };
}

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
    authTimeout: 10000,
  },
};

// --- Model Config ---
const MODELS = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-6',
};
let currentModel = MODELS.sonnet;
let currentModelName = 'Sonnet 4.6';
let manualModelOverride = false; // true when user explicitly picks /sonnet or /opus

// --- Init ---
const bot = new Telegraf(BOT_TOKEN);
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

// Dedup: prevent processing the same Telegram update_id twice
// (webhook retries + restart replay protection)
const _processedUpdateIds = new Set();

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
  'news', 'jobs', 'pipeline', 'prospect', 'ralph', 'yolo',
  'stream', 'trace', 'flux', 'gemini', 'r2', 'media', 'logs', 'elk',
]);

// Guest-safe commands
const GUEST_COMMANDS = new Set([
  'start', 'help', 'about', 'status', 'uptime', 'ip', 'model', 'sonnet',
  'pm2', 'tasks', 'costs', 'memory', 'image', 'research', 'draft', 'docker',
  'tailscale', 'nginx', 'disk', 'processes',
]);

// Guest-safe tools (for natural language chat)
const GUEST_TOOLS = new Set(['guest_status', 'generate_image']);

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
const MAX_HISTORY = 15;

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
// DEDUP: Reject duplicate update_ids (webhook retries, restart replays)
// ============================================================
bot.use((ctx, next) => {
  const updateId = ctx.update?.update_id;
  if (updateId) {
    if (_processedUpdateIds.has(updateId)) {
      return; // silently skip duplicate
    }
    _processedUpdateIds.add(updateId);
    if (_processedUpdateIds.size > 500) {
      const first = _processedUpdateIds.values().next().value;
      _processedUpdateIds.delete(first);
    }
  }
  return next();
});

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

    // Budget cap for guests (£2/day)
    const budgetCheck = checkGuestBudget(userId);
    if (!budgetCheck.allowed) {
      logInteraction({ direction: 'system', userId, username, event: 'budget_exceeded', spent_gbp: budgetCheck.spent, limit_gbp: GUEST_DAILY_BUDGET_GBP });
      return ctx.reply(budgetCheck.reason);
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
    exec(command, { timeout, shell: 'bash', cwd: NAVADA_DIR, maxBuffer: 2 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
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
    name: 'guest_status',
    description: 'Get NAVADA Edge online status. Safe for guest users. No parameters needed.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'send_email',
    description: 'Send a NAVADA-branded email from claude.navada@navada-edge-server.uk (via AWS SES). Can send to any recipient. Use for reports, alerts, presentations, updates. Lee\'s email is leeakpareva@gmail.com.',
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
  },
  {
    name: 'stream_video',
    description: 'Manage Cloudflare Stream videos. Upload, list, get playback URLs, delete.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['upload', 'upload_url', 'list', 'info', 'delete', 'url', 'embed'], description: 'Action to perform' },
        file_path: { type: 'string', description: 'Local file path (for upload action)' },
        video_url: { type: 'string', description: 'URL to upload from (for upload_url action)' },
        video_id: { type: 'string', description: 'Video ID (for info/delete/url/embed)' },
        name: { type: 'string', description: 'Video name/title' }
      },
      required: ['action']
    }
  },
  {
    name: 'cloudflare_trace',
    description: 'Trace an HTTP request through Cloudflare to debug routing, WAF, caching rules.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to trace (must be on your Cloudflare account)' },
        method: { type: 'string', description: 'HTTP method (default GET)' },
        skip_challenge: { type: 'boolean', description: 'Skip security challenges (default true)' }
      },
      required: ['url']
    }
  },
  {
    name: 'r2_storage',
    description: 'Manage Cloudflare R2 object storage. Upload, list, delete files. Bucket: navada-assets. Zero egress cost.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['upload', 'list', 'delete', 'buckets', 'url'], description: 'Action: upload file, list objects, delete object, list buckets, get public URL' },
        file_path: { type: 'string', description: 'Local file path (for upload)' },
        key: { type: 'string', description: 'R2 object key/path (e.g. docs/file.pdf)' },
        bucket: { type: 'string', description: 'Bucket name (default: navada-assets)' },
        prefix: { type: 'string', description: 'Prefix filter for list action (e.g. docs/)' }
      },
      required: ['action']
    }
  },
  {
    name: 'chroma_search',
    description: 'Search NAVADA knowledge base (ChromaDB RAG). Semantic search across all indexed docs, code, logs, and comms. Use to recall past decisions, find code patterns, or answer questions about the NAVADA system.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        n_results: { type: 'number', description: 'Number of results (default 5, max 10)' },
        category: { type: 'string', enum: ['docs', 'code', 'logs', 'comms'], description: 'Filter by category (optional)' }
      },
      required: ['query']
    }
  },
  {
    name: 'flux_image',
    description: 'Generate image using Cloudflare Workers AI Flux model. FREE, no per-image cost. Good for quick visuals. For premium quality use generate_image (DALL-E 3) instead.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description prompt' },
        width: { type: 'number', description: 'Width in pixels (default 1024)' },
        height: { type: 'number', description: 'Height in pixels (default 1024)' },
        save_to_r2: { type: 'boolean', description: 'Upload generated image to R2 storage (default false)' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'gemini_image',
    description: 'Generate image using Google Gemini 2.0 Flash. ~£0.03/image. Good for photorealistic and artistic images. Third option alongside DALL-E 3 (premium) and Flux (free).',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description prompt' },
        aspect_ratio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:3', '3:4'], description: 'Aspect ratio (default 1:1)' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'play_media',
    description: 'Access NAVADA media library hosted on Cloudflare R2. Actions: "list" (list all media), "play" (get playback URL for a media file), "send_email" (email a media file to someone as a link). Zero egress cost.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'play', 'send_email'], description: 'Action to perform' },
        filename: { type: 'string', description: 'Media filename (e.g. claude-chief-of-staff.mp4). Required for play and send_email.' },
        to_email: { type: 'string', description: 'Recipient email address (required for send_email action)' },
        subject: { type: 'string', description: 'Email subject (optional, for send_email)' },
        message: { type: 'string', description: 'Email body message (optional, for send_email)' }
      },
      required: ['action']
    }
  },
  {
    name: 'render_video',
    description: 'Render a video using NAVADA Remotion project and optionally upload to R2 + email. Handles the full pipeline: render → upload → email/Telegram. Use this for any video generation request.',
    input_schema: {
      type: 'object',
      properties: {
        composition: { type: 'string', description: 'Remotion composition ID to render. Available: NavadaIntro, NavadaIntroSquare, TextReveal. Or "custom" to create a new one.' },
        filename: { type: 'string', description: 'Output filename (e.g. navada-intro.mp4)' },
        custom_component: { type: 'string', description: 'If composition="custom", provide the full React TSX component code. It will be written to ~/navada-video/src/Custom.tsx' },
        custom_name: { type: 'string', description: 'If composition="custom", the composition name to register (e.g. "MyVideo")' },
        duration_frames: { type: 'number', description: 'Duration in frames (30fps). Default: 150 (5 seconds)' },
        width: { type: 'number', description: 'Width in pixels. Default: 1920' },
        height: { type: 'number', description: 'Height in pixels. Default: 1080' },
        upload_r2: { type: 'boolean', description: 'Upload to R2 media library after rendering. Default: true' },
        email_to: { type: 'string', description: 'Email the video link to this address after upload' },
        email_subject: { type: 'string', description: 'Email subject line' }
      },
      required: ['composition', 'filename']
    }
  },
  {
    name: 'find_file',
    description: 'Recursively search for files by name pattern across the NAVADA directory. Use this to quickly locate documents, scripts, configs, PDFs, proposals, or any file by name.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Filename pattern to search for (e.g. "navada edge", "*.pdf", "v2"). Case-insensitive partial match.' },
        search_path: { type: 'string', description: 'Root path to search from (default: C:/Users/leeak/CLAUDE_NAVADA_AGENT)' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'elk_query',
    description: 'Search and query NAVADA logs via Elasticsearch (ELK stack). Full-text search across all server logs, Telegram interactions, PM2 logs, and automation outputs.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['search', 'tail', 'count', 'indices', 'stats'], description: 'Action: search (full-text), tail (latest N entries), count (matching entries), indices (list available), stats (cluster health)' },
        query: { type: 'string', description: 'Search text (for search/count actions)' },
        index: { type: 'string', description: 'Index pattern (e.g. navada-telegram-*, navada-automation-*, navada-pm2-*). Default: all indices.' },
        size: { type: 'number', description: 'Number of results to return (default 10)' },
        time_range: { type: 'string', description: 'Time range filter: 1h, 6h, 24h, 7d, 30d (default: 24h)' }
      },
      required: ['action']
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
      // Prevent the bot from stopping itself
      if (/pm2\s+(stop|delete|kill).*telegram-bot/i.test(cmd) || /pm2\s+(stop|kill)\s+all/i.test(cmd)) {
        log(`[TOOL] run_shell: BLOCKED self-destruct command: ${cmd}`);
        return 'Error: Cannot stop the telegram-bot process from within itself. Use Claude Code or SSH to manage the bot process.';
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
    case 'find_file': {
      log(`[TOOL] find_file: ${input.pattern}`);
      try {
        const searchRoot = input.search_path || NAVADA_DIR;
        const escaped = input.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
        const regex = new RegExp(escaped, 'i');
        const results = [];
        function walkDir(dir, depth) {
          if (depth > 6 || results.length > 50) return;
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const e of entries) {
              if (e.name === 'node_modules' || e.name === '.git' || e.name === '.next') continue;
              const full = path.join(dir, e.name);
              if (e.isDirectory()) {
                walkDir(full, depth + 1);
              } else if (regex.test(e.name)) {
                try {
                  const stat = fs.statSync(full);
                  results.push(`${full} (${(stat.size / 1024).toFixed(1)} KB)`);
                } catch { results.push(full); }
              }
            }
          } catch {}
        }
        walkDir(searchRoot, 0);
        if (results.length === 0) return `No files matching "${input.pattern}" found under ${searchRoot}`;
        return `Found ${results.length} file(s):\n${results.join('\n')}`;
      } catch (err) {
        return `Error searching: ${err.message}`;
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
    case 'guest_status': {
      log('[TOOL] guest_status');
      const guestUptime = os.uptime();
      const gDays = Math.floor(guestUptime / 86400);
      const gHours = Math.floor((guestUptime % 86400) / 3600);
      return `NAVADA Edge is online.\nUptime: ${gDays}d ${gHours}h\nAI Model: ${currentModelName}`;
    }
    case 'send_email': {
      log(`[TOOL] send_email: to=${input.to} subject=${input.subject}`);
      if (!emailService) return 'Error: Email service not available. Check email-service.js.';
      const emailOpts = {
        to: input.to,
        subject: input.subject,
        body: input.body,
        type: input.type || 'general',
      };
      if (input.raw_html) emailOpts.rawHtml = input.raw_html;
      // 2-attempt retry with 2s delay
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const info = await emailService.sendEmail(emailOpts);
          costTracker.logCall('email-send', { emails: 1, script: 'telegram-bot' });
          return `Email sent successfully to ${input.to} (MessageID: ${info.messageId})`;
        } catch (err) {
          if (attempt < 2) {
            log(`[EMAIL RETRY] Attempt ${attempt} failed: ${err.message}, retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            return `Error sending email (after 2 attempts): ${err.message}`;
          }
        }
      }
      break;
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
    case 'stream_video': {
      log(`[TOOL] stream_video: ${input.action}`);
      try {
        const stream = require('./cloudflare-stream');
        switch (input.action) {
          case 'list': {
            const videos = await stream.listVideos();
            if (videos.length === 0) return 'No videos found in Cloudflare Stream.';
            return videos.map(v => {
              const duration = v.duration ? `${Math.round(v.duration)}s` : 'processing';
              return `${v.uid} | ${v.meta?.name || 'Untitled'} | ${duration} | ${v.status?.state || 'unknown'}`;
            }).join('\n');
          }
          case 'upload': {
            if (!input.file_path) return 'Error: file_path required for upload';
            const result = await stream.uploadVideo(input.file_path, { name: input.name });
            return `Uploaded: ${result.uid} (${result.name})`;
          }
          case 'upload_url': {
            if (!input.video_url) return 'Error: video_url required for upload_url';
            const result = await stream.uploadFromUrl(input.video_url, { name: input.name });
            return `Upload started: ${result.uid} | Status: ${result.status?.state || 'queued'}`;
          }
          case 'info': {
            if (!input.video_id) return 'Error: video_id required';
            const v = await stream.getVideo(input.video_id);
            return `Video: ${v.uid}\nName: ${v.meta?.name || 'Untitled'}\nStatus: ${v.status?.state}\nDuration: ${v.duration ? Math.round(v.duration) + 's' : 'N/A'}\nPlayback: ${stream.getPlaybackUrl(v.uid)}`;
          }
          case 'delete': {
            if (!input.video_id) return 'Error: video_id required';
            await stream.deleteVideo(input.video_id);
            return `Deleted video: ${input.video_id}`;
          }
          case 'url': {
            if (!input.video_id) return 'Error: video_id required';
            return stream.getPlaybackUrl(input.video_id);
          }
          case 'embed': {
            if (!input.video_id) return 'Error: video_id required';
            const embed = stream.getEmbedUrl(input.video_id);
            return `Embed URL: ${embed.src}\n\nHTML:\n${embed.html}`;
          }
          default:
            return `Unknown stream action: ${input.action}`;
        }
      } catch (err) {
        return `Error (stream_video): ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`;
      }
    }
    case 'cloudflare_trace': {
      log(`[TOOL] cloudflare_trace: ${input.url}`);
      try {
        const { traceRequest } = require('./cloudflare-trace');
        const trace = await traceRequest(input.url, {
          method: input.method,
          skip_challenge: input.skip_challenge,
        });
        if (Array.isArray(trace)) {
          const summary = trace.map(s => {
            const status = s.matched ? 'MATCHED' : 'no match';
            const name = s.name || s.expression_name || s.rule_name || s.type || 'rule';
            return `[${status}] ${name}: ${s.action || '-'}`;
          }).join('\n');
          return `Trace: ${input.method || 'GET'} ${input.url}\n${summary}\n\nTotal rules: ${trace.length}`;
        }
        return JSON.stringify(trace, null, 2);
      } catch (err) {
        return `Error (cloudflare_trace): ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`;
      }
    }
    case 'chroma_search': {
      log(`[TOOL] chroma_search: ${input.query}`);
      try {
        const rag = require('./chroma-rag');
        const nResults = Math.min(input.n_results || 5, 10);
        const results = await rag.search(input.query, {
          nResults,
          category: input.category || null,
        });
        if (results.length === 0) return 'No relevant results found in the knowledge base.';
        return results.map((r, i) => {
          const src = r.metadata?.file_name || r.metadata?.source || 'unknown';
          const cat = r.metadata?.category || '?';
          return `[${i + 1}] (${cat}) ${src} (dist: ${r.distance.toFixed(3)})\n${r.document.slice(0, 400)}`;
        }).join('\n---\n');
      } catch (err) {
        return `Error (chroma_search): ${err.message}`;
      }
    }
    case 'r2_storage': {
      log(`[TOOL] r2_storage: ${input.action}`);
      try {
        const r2 = require('./cloudflare-r2');
        const bucket = input.bucket || 'navada-assets';
        switch (input.action) {
          case 'buckets': {
            const buckets = await r2.listBuckets();
            if (buckets.length === 0) return 'No R2 buckets found.';
            return buckets.map(b => `${b.name} | Created: ${b.creation_date || 'N/A'}`).join('\n');
          }
          case 'upload': {
            if (!input.file_path) return 'Error: file_path required for upload';
            const key = input.key || require('path').basename(input.file_path);
            const result = await r2.uploadFile(input.file_path, key, bucket);
            return `Uploaded: ${result.key} (${(result.size / 1024 / 1024).toFixed(2)} MB) to ${bucket}`;
          }
          case 'list': {
            const objects = await r2.listObjects(input.prefix || '', bucket);
            if (objects.length === 0) return `No objects in ${bucket}/${input.prefix || ''}`;
            return objects.map(o => {
              const size = (o.Size / 1024 / 1024).toFixed(2);
              return `${o.Key} | ${size} MB | ${o.LastModified?.toISOString()?.slice(0, 10) || 'N/A'}`;
            }).join('\n');
          }
          case 'delete': {
            if (!input.key) return 'Error: key required for delete';
            await r2.deleteObject(input.key, bucket);
            return `Deleted: ${input.key} from ${bucket}`;
          }
          case 'url': {
            if (!input.key) return 'Error: key required for url';
            return r2.getPublicUrl(input.key, bucket);
          }
          default:
            return `Unknown R2 action: ${input.action}`;
        }
      } catch (err) {
        return `Error (r2_storage): ${err.message}`;
      }
    }
    case 'flux_image': {
      log(`[TOOL] flux_image: ${input.prompt}`);
      try {
        const flux = require('./cloudflare-flux');
        const opts = {};
        if (input.width) opts.width = input.width;
        if (input.height) opts.height = input.height;

        if (input.save_to_r2) {
          const result = await flux.generateAndStore(input.prompt, opts);
          return JSON.stringify({
            file_path: result.filePath,
            r2_key: result.r2Key,
            r2_url: result.r2Url,
          });
        } else {
          const result = await flux.generateImage(input.prompt, opts);
          return JSON.stringify({
            file_path: result.filePath,
            size_kb: (result.buffer.length / 1024).toFixed(1),
          });
        }
      } catch (err) {
        return `Error (flux_image): ${err.message}`;
      }
    }
    case 'gemini_image': {
      log(`[TOOL] gemini_image: ${input.prompt}`);
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return 'Error: GEMINI_API_KEY not set in .env';

        const aspectRatio = input.aspect_ratio || '1:1';
        const requestBody = JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio }
          }
        });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;

        const imageData = await new Promise((resolve, reject) => {
          const urlObj = new URL(geminiUrl);
          const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode !== 200) {
                reject(new Error(`Gemini API ${res.statusCode}: ${data.slice(0, 500)}`));
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const parts = parsed.candidates?.[0]?.content?.parts || [];
                const imgPart = parts.find(p => p.inline_data);
                const textPart = parts.find(p => p.text);
                if (!imgPart) {
                  reject(new Error('No image in Gemini response. Text: ' + (textPart?.text || 'none')));
                  return;
                }
                resolve({
                  base64: imgPart.inline_data.data,
                  mimeType: imgPart.inline_data.mime_type,
                  description: textPart?.text || ''
                });
              } catch (e) {
                reject(new Error('Failed to parse Gemini response: ' + e.message));
              }
            });
          });
          req.on('error', reject);
          req.write(requestBody);
          req.end();
        });

        const ext = imageData.mimeType.includes('png') ? 'png' : 'jpg';
        const filename = `gemini-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        const buffer = Buffer.from(imageData.base64, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Log cost
        const costTracker = require('../Manager/cost-tracking/cost-tracker');
        costTracker.logCall('gemini-flash-image', { images: 1, script: 'telegram-bot' });

        return JSON.stringify({
          file_path: filePath,
          size_kb: (buffer.length / 1024).toFixed(1),
          description: imageData.description,
          aspect_ratio: aspectRatio
        });
      } catch (err) {
        return `Error (gemini_image): ${err.message}`;
      }
    }
    case 'play_media': {
      log(`[TOOL] play_media: ${input.action} ${input.filename || ''}`);
      const R2_PUBLIC = 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev';
      const MEDIA_PREFIX = 'media/';
      try {
        switch (input.action) {
          case 'list': {
            const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
            const CF_ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
            const listUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCT}/r2/buckets/navada-assets/objects?prefix=${MEDIA_PREFIX}`;
            const listRes = await new Promise((resolve, reject) => {
              const urlObj = new URL(listUrl);
              https.get({
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
              }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                  try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                });
              }).on('error', reject);
            });
            if (listRes.success && listRes.result) {
              const files = listRes.result.map(obj => ({
                name: obj.key.replace(MEDIA_PREFIX, ''),
                size_mb: (obj.size / 1024 / 1024).toFixed(1),
                url: `${R2_PUBLIC}/${obj.key}`,
                uploaded: obj.uploaded
              }));
              return JSON.stringify({ media_count: files.length, files });
            }
            return JSON.stringify({ media_count: 0, files: [] });
          }
          case 'play': {
            if (!input.filename) return 'Error: filename required for play action';
            const url = `${R2_PUBLIC}/${MEDIA_PREFIX}${input.filename}`;
            return JSON.stringify({ filename: input.filename, playback_url: url, type: 'video/mp4' });
          }
          case 'send_email': {
            if (!input.filename) return 'Error: filename required for send_email';
            if (!input.to_email) return 'Error: to_email required for send_email';
            const mediaUrl = `${R2_PUBLIC}/${MEDIA_PREFIX}${input.filename}`;
            const subject = input.subject || `NAVADA Media: ${input.filename}`;
            const body = input.message
              ? `${input.message}\n\nWatch here: ${mediaUrl}`
              : `Here is the media file from NAVADA:\n\nWatch here: ${mediaUrl}`;
            // Use the send_email tool internally
            const emailResult = await executeTool('send_email', {
              to: input.to_email,
              subject: subject,
              body: `<p>${body.replace(/\n/g, '<br>')}</p>`
            }, 'admin');
            return JSON.stringify({ sent: true, to: input.to_email, subject, media_url: mediaUrl, email_result: emailResult });
          }
          default:
            return `Unknown play_media action: ${input.action}`;
        }
      } catch (err) {
        return `Error (play_media): ${err.message}`;
      }
    }
    case 'render_video': {
      log(`[TOOL] render_video: ${input.composition} -> ${input.filename}`);
      try {
        const videoDir = 'C:/Users/leeak/navada-video';
        const outputDir = 'C:/Users/leeak/navada-outputs/videos';
        const outputPath = `${outputDir}/${input.filename}`;
        const R2_PUBLIC = 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev';

        // If custom component, write it to Custom.tsx with the correct export name
        if (input.composition === 'custom' && input.custom_component) {
          // Rewrite the component to always export as CustomVideo
          let code = input.custom_component;
          // Replace any export name with CustomVideo so Root.tsx can find it
          code = code.replace(/export\s+const\s+\w+/g, 'export const CustomVideo');
          // If no export found, wrap it
          if (!code.includes('export const CustomVideo')) {
            code = code + '\nexport const CustomVideo = ' + (input.custom_name || 'CustomVideo') + ';\n';
          }
          fs.writeFileSync(`${videoDir}/src/Custom.tsx`, code);
          // Root.tsx always has <Composition id="CustomVideo"> pointing to Custom.tsx
          input.composition = 'CustomVideo';
        }

        // Render
        const { execSync } = require('child_process');
        let renderOutput;
        try {
          renderOutput = execSync(
            `npx remotion render src/index.ts ${input.composition} --output "${outputPath}"`,
            { cwd: videoDir, timeout: 300000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, shell: 'bash', windowsHide: true }
          );
          // Keep only last 5 lines
          renderOutput = renderOutput.split('\n').slice(-5).join('\n');
        } catch (renderErr) {
          renderOutput = renderErr.stdout || renderErr.stderr || renderErr.message;
          renderOutput = renderOutput.split('\n').slice(-10).join('\n');
        }
        log(`[RENDER] ${renderOutput}`);

        if (!fs.existsSync(outputPath)) {
          return `Render failed. Output: ${renderOutput}`;
        }

        const stat = fs.statSync(outputPath);
        const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
        let result = `Video rendered: ${input.filename} (${sizeMB} MB)`;

        // Upload to R2
        if (input.upload_r2 !== false) {
          const r2Key = `media/${input.filename}`;
          const uploadR2 = require('./notebooklm-r2-watcher.js').uploadToR2 || null;
          // Use the Cloudflare API directly
          const fileBuffer = fs.readFileSync(outputPath);
          const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/navada-assets/objects/${r2Key}`;
          await new Promise((resolve, reject) => {
            const url = new URL(cfUrl);
            const reqOpts = {
              hostname: url.hostname,
              path: url.pathname,
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'video/mp4',
                'Content-Length': fileBuffer.length,
              },
            };
            const req = https.request(reqOpts, (res) => {
              let data = '';
              res.on('data', c => data += c);
              res.on('end', () => {
                try {
                  const json = JSON.parse(data);
                  if (json.success) resolve(json);
                  else reject(new Error(json.errors?.[0]?.message || 'R2 upload failed'));
                } catch (e) { reject(e); }
              });
            });
            req.on('error', reject);
            req.write(fileBuffer);
            req.end();
          });
          const publicUrl = `${R2_PUBLIC}/media/${input.filename}`;
          result += `\nUploaded to R2: ${publicUrl}`;

          // Email if requested
          if (input.email_to) {
            const emailResult = await executeTool('send_email', {
              to: input.email_to,
              subject: input.email_subject || `NAVADA Video: ${input.filename}`,
              body: `<p>Your NAVADA video has been rendered and is ready:</p><p><a href="${publicUrl}">${input.filename}</a> (${sizeMB} MB)</p><p>Watch: ${publicUrl}</p>`
            }, 'admin');
            result += `\nEmail sent to: ${input.email_to}`;
          }
        }

        return result;
      } catch (err) {
        return `Error (render_video): ${err.message}`;
      }
    }
    case 'elk_query': {
      log(`[TOOL] elk_query: ${input.action} ${input.query || ''}`);
      const esHttp = require('http');
      const ES_BASE = 'http://localhost:9200';

      function esRequest(method, path, body) {
        return new Promise((resolve, reject) => {
          const url = new URL(path, ES_BASE);
          const opts = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json' },
          };
          const req = esHttp.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
            });
          });
          req.on('error', reject);
          req.setTimeout(15000, () => { req.destroy(); reject(new Error('ES request timeout')); });
          if (body) req.write(JSON.stringify(body));
          req.end();
        });
      }

      function parseTimeRange(tr) {
        const now = Date.now();
        const match = (tr || '24h').match(/^(\d+)(h|d|m|w)$/);
        if (!match) return { gte: 'now-24h' };
        return { gte: `now-${match[1]}${match[2]}` };
      }

      try {
        const index = input.index || 'navada-*';
        const size = Math.min(input.size || 10, 50);
        const timeFilter = parseTimeRange(input.time_range);

        switch (input.action) {
          case 'search': {
            if (!input.query) return 'Error: query required for search action';
            const body = {
              size,
              sort: [{ '@timestamp': 'desc' }],
              query: {
                bool: {
                  must: [{ query_string: { query: input.query } }],
                  filter: [{ range: { '@timestamp': timeFilter } }]
                }
              }
            };
            const res = await esRequest('POST', `/${index}/_search`, body);
            if (res.error) return `ES Error: ${JSON.stringify(res.error)}`;
            const hits = res.hits?.hits || [];
            if (hits.length === 0) return `No results for "${input.query}" in ${index} (${input.time_range || '24h'})`;
            const lines = hits.map((h, i) => {
              const s = h._source;
              const ts = s['@timestamp'] || '';
              const msg = s.message || s.log || JSON.stringify(s).slice(0, 300);
              return `[${i + 1}] ${ts} [${h._index}]\n${msg}`;
            });
            return `Found ${res.hits.total?.value || hits.length} results for "${input.query}":\n\n${lines.join('\n\n')}`;
          }
          case 'tail': {
            const body = {
              size,
              sort: [{ '@timestamp': 'desc' }],
              query: { bool: { filter: [{ range: { '@timestamp': timeFilter } }] } }
            };
            const res = await esRequest('POST', `/${index}/_search`, body);
            if (res.error) return `ES Error: ${JSON.stringify(res.error)}`;
            const hits = res.hits?.hits || [];
            if (hits.length === 0) return `No entries in ${index} (${input.time_range || '24h'})`;
            const lines = hits.map((h, i) => {
              const s = h._source;
              const ts = s['@timestamp'] || '';
              const msg = s.message || s.log || JSON.stringify(s).slice(0, 300);
              return `[${i + 1}] ${ts} [${h._index}]\n${msg}`;
            });
            return `Latest ${hits.length} entries from ${index}:\n\n${lines.join('\n\n')}`;
          }
          case 'count': {
            const body = {
              query: input.query
                ? { bool: { must: [{ query_string: { query: input.query } }], filter: [{ range: { '@timestamp': timeFilter } }] } }
                : { bool: { filter: [{ range: { '@timestamp': timeFilter } }] } }
            };
            const res = await esRequest('POST', `/${index}/_count`, body);
            if (res.error) return `ES Error: ${JSON.stringify(res.error)}`;
            return `Count: ${res.count} entries${input.query ? ` matching "${input.query}"` : ''} in ${index} (${input.time_range || '24h'})`;
          }
          case 'indices': {
            const res = await esRequest('GET', '/_cat/indices?format=json&s=index');
            if (!Array.isArray(res)) return `ES Error: ${JSON.stringify(res)}`;
            if (res.length === 0) return 'No indices found in Elasticsearch.';
            const lines = res.map(idx => `${idx.index} | ${idx['docs.count']} docs | ${idx['store.size']} | ${idx.health}`);
            return `Elasticsearch Indices (${res.length}):\n\n${lines.join('\n')}`;
          }
          case 'stats': {
            const [health, indices] = await Promise.all([
              esRequest('GET', '/_cluster/health'),
              esRequest('GET', '/_cat/indices?format=json&s=index'),
            ]);
            const indexList = Array.isArray(indices) ? indices : [];
            const totalDocs = indexList.reduce((sum, idx) => sum + parseInt(idx['docs.count'] || 0), 0);
            const totalSize = indexList.reduce((sum, idx) => {
              const s = idx['store.size'] || '0b';
              const match = s.match(/([\d.]+)(kb|mb|gb|b)/i);
              if (!match) return sum;
              const val = parseFloat(match[1]);
              const unit = match[2].toLowerCase();
              if (unit === 'gb') return sum + val * 1024;
              if (unit === 'mb') return sum + val;
              if (unit === 'kb') return sum + val / 1024;
              return sum + val / (1024 * 1024);
            }, 0);
            return `ELK Cluster Health: ${health.status?.toUpperCase() || 'unknown'}\n` +
              `Nodes: ${health.number_of_nodes || 0}\n` +
              `Indices: ${indexList.length}\n` +
              `Total Documents: ${totalDocs.toLocaleString()}\n` +
              `Total Size: ${totalSize.toFixed(1)} MB\n` +
              `Active Shards: ${health.active_shards || 0}`;
          }
          default:
            return `Unknown elk_query action: ${input.action}`;
        }
      } catch (err) {
        return `Error (elk_query): ${err.message}`;
      }
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

// ============================================================
// SYSTEM PROMPTS
// ============================================================
function getAdminSystemPrompt(modelName) {
  return `You are Claude, Chief of Staff at NAVADA. Lee Akpareva is the Founder. You run on his HP laptop (always-on server). You are OMNI-CHANNEL: Telegram, SMS (+447446994961), WhatsApp. Conversation history is SHARED across channels. NEVER include channel tags or brackets in responses.

You are the operational lead with FULL SYSTEM CONTROL: shell (run_shell), files (read_file, write_file, delete_file, find_file), email (send_email, read_inbox, reply_email), images (generate_image, flux_image, gemini_image), video (render_video), SMS/calls (send_sms, make_call), R2 storage, ELK logs, ChromaDB RAG, and 23 MCP servers via run_shell.

RULES:
- If Lee asks you to do something, DO IT with tools. Never say "I can't".
- ALWAYS verify system state with run_shell/read_file before answering infrastructure questions.
- Confirm before destructive operations (deleting data, stopping production).
- No markdown (no #, **, \`\`\`, ---). Plain conversational text only.
- Be direct, concise, mobile-friendly. Show personality.
- No client names in outreach. No em dashes in external content.

Server: Windows 11 Pro, 192.168.0.58 / 100.121.187.67 (Tailscale). Python: \`py\`. Projects: C:/Users/leeak/CLAUDE_NAVADA_AGENT
Lee's email: leeakpareva@gmail.com. Lee's phone: +447935237704. NAVADA phone: ${TWILIO_FROM}
Email from: claude.navada@navada-edge-server.uk (AWS SES). Inbox: Zoho IMAP.
Images: DALL-E 3 (premium), Flux (FREE), Gemini (~£0.03). Video: Remotion + R2.
Model: ${modelName}. Reference data: read_file kb/system-reference.md if needed.
Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`;
}

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
- Write like a human. No markdown formatting (no #, ##, **, \`\`\`, ---, bullet dashes). Use plain conversational text with proper punctuation and spacing.
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

  // For admin (Lee): tag with channel for omni-channel continuity
  if (userRole === 'admin') {
    history.push({ role: 'user', content: `[Telegram] ${userMessage}` });
  } else {
    history.push({ role: 'user', content: userMessage });
  }

  // Trim history
  while (history.length > MAX_HISTORY * 2) {
    history.splice(0, 2);
  }

  let loopCount = 0;
  let messages = [...history];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // --- 3-Tier Cache Lookup (Memory LRU -> Exact-match DB -> ChromaDB semantic) ---
  try {
    // Tier 1 + 3: In-memory LRU + ChromaDB semantic (handled by semanticCache)
    const cached = await semanticCache.lookup(userMessage);
    if (cached) {
      log(`[CACHE HIT] source=${cached.source} dist=${cached.distance?.toFixed(4) || 'n/a'} for: "${userMessage.slice(0, 80)}"`);
      await sendLong(ctx, cached.response);
      history.push({ role: 'assistant', content: cached.response });
      conversationHistories.set(userId, history);
      saveConversationHistory(userId, history);
      logInteraction({ direction: 'out', userId, username, model: 'cache', input_tokens: 0, output_tokens: 0, cost_gbp: 0, cache_hit: cached.source });
      return;
    }
    // Tier 2: Exact-match DB cache
    const exactCached = responseCache.lookup(userMessage);
    if (exactCached) {
      log(`[CACHE HIT] source=exact-db hits=${exactCached.hit_count} for: "${userMessage.slice(0, 80)}"`);
      await sendLong(ctx, exactCached.response);
      history.push({ role: 'assistant', content: exactCached.response });
      conversationHistories.set(userId, history);
      saveConversationHistory(userId, history);
      logInteraction({ direction: 'out', userId, username, model: 'cache', input_tokens: 0, output_tokens: 0, cost_gbp: 0, cache_hit: 'exact-db' });
      return;
    }
  } catch (cacheErr) {
    log(`[CACHE] Lookup error (non-blocking): ${cacheErr.message}`);
  }

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

  // Smart model selection (auto-escalate to Opus for complex tasks)
  const selectedModel = (userRole === 'admin') ? selectModel(userMessage) : { model: MODELS.sonnet, name: 'Sonnet 4.6', reason: 'guest' };

  // Select system prompt and tools based on role
  const systemPrompt = userRole === 'admin' ? getAdminSystemPrompt(selectedModel.name) : buildGuestSystemPrompt(resolvedDisplayName);
  const toolSet = userRole === 'admin' ? TOOLS : GUEST_TOOL_LIST;

  let usedTools = false;

  // Send typing indicator so user sees "Claude is typing..."
  try { await ctx.telegram.sendChatAction(ctx.chat.id, 'typing'); } catch {}

  // Keep typing indicator alive during long operations (Telegram typing expires after 5s)
  const typingInterval = setInterval(async () => {
    try { await ctx.telegram.sendChatAction(ctx.chat.id, 'typing'); } catch {}
  }, 4000);
  if (selectedModel.reason !== 'default' && selectedModel.reason !== 'manual' && selectedModel.reason !== 'guest') {
    log(`[MODEL] Auto-escalated to ${selectedModel.name} (trigger: ${selectedModel.reason})`);
  }

  try {
    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;

      const response = await callAnthropicWithRetry({
        model: selectedModel.model,
        max_tokens: 8192,
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

      // If no tool calls, send the final text and we're done
      if (toolBlocks.length === 0) {
        let finalText = textBlocks.map(b => b.text).join('\n');
        // Handle max_tokens truncation gracefully
        if (response.stop_reason === 'max_tokens' && finalText.trim()) {
          finalText += '\n\n(Response was truncated due to length)';
        }
        // Add model indicator for auto-escalated responses
        if (selectedModel.reason !== 'default' && selectedModel.reason !== 'manual') {
          finalText = `(${selectedModel.name})\n${finalText}`;
        }
        if (finalText.trim()) {
          await sendLong(ctx, finalText);
          history.push({ role: 'assistant', content: finalText });
        }
        break;
      }
      // Warn on last iteration before tool loop limit
      if (loopCount === MAX_TOOL_LOOPS - 1) {
        log(`[WARN] Approaching tool loop limit (${loopCount}/${MAX_TOOL_LOOPS})`);
      }
      // Tool calls present — suppress text to avoid duplicate "Let me check..." messages on every loop iteration

      // Execute tools
      usedTools = true;
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
        if (tool.name === 'gemini_image') {
          try {
            const parsed = JSON.parse(result);
            if (parsed.file_path && fs.existsSync(parsed.file_path)) {
              await ctx.replyWithPhoto({ source: parsed.file_path }, {
                caption: parsed.description ? parsed.description.slice(0, 900) : 'Gemini image'
              });
              toolResultContent = 'Image generated and already sent to the user in Telegram. Do not send the file path or image again. Just confirm it was delivered.';
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

    // Log cost (use the model that was actually used, not the global currentModel)
    const modelKey = selectedModel.model.includes('opus') ? 'claude-opus-4' : 'claude-sonnet-4';
    costTracker.logCall(modelKey, {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      script: 'telegram-bot',
    });

    // Log outbound interaction with cost data
    const callCostGbp = estimateCost(selectedModel.model, totalInputTokens, totalOutputTokens);
    logInteraction({
      direction: 'out',
      userId,
      username,
      model: selectedModel.name,
      model_reason: selectedModel.reason,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cost_gbp: callCostGbp,
    });

    // Track guest budget spend + warn at thresholds
    if (userRole === 'guest' && callCostGbp > 0) {
      const prevSpent = getGuestBudget(userId).spent;
      const budget = addGuestSpend(userId, callCostGbp);
      const remaining = Math.max(0, GUEST_DAILY_BUDGET_GBP - budget.spent);
      const pctUsed = (budget.spent / GUEST_DAILY_BUDGET_GBP) * 100;
      const prevPct = (prevSpent / GUEST_DAILY_BUDGET_GBP) * 100;
      logInteraction({
        direction: 'system',
        userId,
        username,
        event: 'budget_spend',
        cost_gbp: callCostGbp,
        daily_spent_gbp: budget.spent,
        daily_remaining_gbp: remaining,
        budget_limit_gbp: GUEST_DAILY_BUDGET_GBP,
      });

      // Send warning messages at budget thresholds
      if (pctUsed >= 90 && prevPct < 90) {
        await ctx.reply(`\u26a0\ufe0f *Budget Warning*: You've used 90% of your daily £${GUEST_DAILY_BUDGET_GBP.toFixed(2)} allowance (£${remaining.toFixed(4)} remaining). After this, usage resets at midnight.`, { parse_mode: 'Markdown' });
      } else if (pctUsed >= 75 && prevPct < 75) {
        await ctx.reply(`\ud83d\udca1 *Heads up*: You've used 75% of your daily £${GUEST_DAILY_BUDGET_GBP.toFixed(2)} allowance. £${remaining.toFixed(4)} remaining.`, { parse_mode: 'Markdown' });
      } else if (pctUsed >= 50 && prevPct < 50) {
        await ctx.reply(`\u2139\ufe0f You've used half your daily £${GUEST_DAILY_BUDGET_GBP.toFixed(2)} allowance. £${remaining.toFixed(4)} remaining.`);
      }
    }

    // --- Cache Store (after successful response, no tools used) ---
    try {
      const lastAssistant = history[history.length - 1];
      const lastText = typeof lastAssistant?.content === 'string' ? lastAssistant.content : '';
      if (lastText && !usedTools) {
        // Semantic cache (ChromaDB + in-memory LRU)
        await semanticCache.store(userMessage, lastText, {
          userId,
          model: selectedModel.name,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          usedTools: false,
        });
        // Exact-match DB cache
        responseCache.store(userMessage, lastText, {
          model: selectedModel.name,
          tokens: totalInputTokens + totalOutputTokens,
          cost: callCostGbp,
        });
      }
    } catch (cacheStoreErr) {
      log(`[CACHE] Store error (non-blocking): ${cacheStoreErr.message}`);
    }

    // Save trimmed history + persist to disk
    while (history.length > MAX_HISTORY * 2) {
      history.splice(0, 2);
    }
    conversationHistories.set(userId, history);
    saveConversationHistory(userId, history);

  } catch (err) {
    log(`[ERROR] Claude: ${err.message}`);
    await ctx.reply(`Error: ${err.message}`);
  } finally {
    clearInterval(typingInterval);
  }
}

// Cost estimation helper
function estimateCost(model, inputTokens, outputTokens) {
  // Prices per million tokens in USD, converted to GBP (approx 0.79)
  const rates = {
    'claude-sonnet-4-20250514': { input: 3, output: 15 },
    'claude-opus-4-20250514': { input: 15, output: 75 },
    'claude-sonnet-4-6': { input: 3, output: 15 },
    'claude-opus-4-6': { input: 15, output: 75 },
  };
  const r = rates[model] || rates['claude-sonnet-4-6'];
  const usd = (inputTokens * r.input + outputTokens * r.output) / 1_000_000;
  return Math.round(usd * 0.79 * 10000) / 10000; // GBP with 4 decimal places
}

// ============================================================
// SMART MODEL AUTO-ESCALATION
// ============================================================
const OPUS_TRIGGERS = [
  /\/(email|present|report|draft|linkedin|research)/i,
  /\b(email|send\s*email|compose|write\s*to|forward\s*to)\b/i,
  /\b(pdf|document|proposal|contract|report|slides|presentation)\b/i,
  /\b(deep\s*research|thorough|comprehensive|analyse|analyze|in[- ]depth)\b/i,
  /\b(design|creative|brand|visual|infographic)\b/i,
  /\b(linkedin\s*post|publish\s*to\s*linkedin)\b/i,
];

function selectModel(userMessage, command) {
  // If user manually set /opus or /sonnet, respect that (sticky override)
  if (manualModelOverride) return { model: currentModel, name: currentModelName, reason: 'manual' };

  const text = `${command || ''} ${userMessage}`;
  for (const trigger of OPUS_TRIGGERS) {
    if (trigger.test(text)) {
      return { model: MODELS.opus, name: 'Opus 4.6', reason: trigger.source.slice(0, 40) };
    }
  }
  return { model: MODELS.sonnet, name: 'Sonnet 4.6', reason: 'default' };
}

// ============================================================
// API RETRY WRAPPER (3 attempts, exponential backoff)
// ============================================================
async function callAnthropicWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (err) {
      const isRetryable = err.status === 429 || err.status === 500 || err.status === 502 || err.status === 503 || err.status === 529 || err.message?.includes('ECONNRESET') || err.message?.includes('ETIMEDOUT');
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      log(`[API RETRY] Attempt ${attempt}/${maxRetries} failed (${err.status || err.message}), retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
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
      `/image <description> - Generate DALL-E 3 image\n` +
      `/flux <description> - Generate FREE AI image (Flux)\n` +
      `/gemini <description> - Generate AI image (Gemini)\n\n` +
      `CLOUDFLARE\n` +
      `/stream - Cloudflare Stream videos\n` +
      `/trace <url> - Trace request through Cloudflare\n` +
      `/r2 - R2 object storage\n` +
      `/r2 upload <path> - Upload file to R2\n` +
      `/r2 buckets - List R2 buckets\n` +
      `/media - Play/list NAVADA media library\n\n` +
      `VOICE\n` +
      `/voice - Voice system control\n` +
      `/voicenote <message> - Send voice email to Lee\n\n` +
      `ADMIN\n` +
      `/grant <user_id> [days] - Grant bot access\n` +
      `/revoke <user_id> - Remove bot access\n` +
      `/users - List authorized users\n\n` +
      `LOGS (ELK)\n` +
      `/logs - Latest log entries\n` +
      `/logs search <query> - Search all logs\n` +
      `/logs telegram - Telegram interactions\n` +
      `/logs errors - Find errors across logs\n` +
      `/logs stats - Cluster health & sizes\n` +
      `/logs indices - List all indices\n\n` +
      `OTHER\n` +
      `/shell <cmd> - Run shell command\n` +
      `/costs - Today's API costs\n` +
      `/usage - Token usage & spend\n` +
      `/cache - Semantic cache stats\n` +
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
      `/costs - API usage today\n` +
      `/usage - Token usage & spend\n\n` +
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
  const modeLabel = manualModelOverride ? 'Manual (fixed)' : 'Smart routing (auto-escalation)';
  ctx.reply(`Current model: ${currentModelName}\n(${currentModel})\nMode: ${modeLabel}\n\nUse /sonnet or /opus to lock a model.\nUse /auto to enable smart routing.`);
});

// /sonnet
bot.command('sonnet', (ctx) => {
  currentModel = MODELS.sonnet;
  currentModelName = 'Sonnet 4.6';
  manualModelOverride = true;
  log('/sonnet (manual override ON)');
  ctx.reply(`Switched to Sonnet 4.6 (fast, efficient). Auto-escalation disabled.\nUse /auto to re-enable smart model routing.\n${MODELS.sonnet}`);
});

// /opus (admin only)
bot.command('opus', (ctx) => {
  if (ctx.state.userRole !== 'admin') {
    log(`/opus BLOCKED for guest ${ctx.state.userId}`);
    logInteraction({ direction: 'in', userId: ctx.state.userId, username: ctx.state.username, command: '/opus', blocked: true, reason: 'guest_not_allowed' });
    return ctx.reply('Opus is only available for admin users. You are using Sonnet 4.6 (fast & efficient).');
  }
  currentModel = MODELS.opus;
  currentModelName = 'Opus 4.6';
  manualModelOverride = true;
  log('/opus (manual override ON)');
  ctx.reply(`Switched to Opus 4.6 (maximum intelligence). Auto-escalation disabled.\nUse /auto to re-enable smart model routing.\n${MODELS.opus}`);
});

// /auto — re-enable smart model routing
bot.command('auto', (ctx) => {
  if (ctx.state.userRole !== 'admin') return;
  manualModelOverride = false;
  currentModel = MODELS.sonnet;
  currentModelName = 'Sonnet 4.6';
  log('/auto (smart model routing ON)');
  ctx.reply('Smart model routing enabled.\nSonnet 4.6 (default) with auto-escalation to Opus 4.6 for complex tasks (email, research, reports, creative).');
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

// /failover — Manually trigger failover to Oracle
guardCommand('failover', async (ctx) => {
  log('/failover');
  const arg = ctx.message.text.replace('/failover', '').trim();
  if (arg === 'status' || arg === '-status') {
    // Redirect to /failover-status
    return handleFailoverStatus(ctx);
  }
  await ctx.reply('Triggering failover to Oracle VM...');
  try {
    const { exec } = require('child_process');
    exec('ssh -o ConnectTimeout=15 oracle-navada "bash /home/ubuntu/navada-failover/failover-activate.sh"', { timeout: 120000, windowsHide: true }, async (err, stdout, stderr) => {
      if (err) {
        await ctx.reply(`Failover activation failed:\n${stderr || err.message}`);
      } else {
        await ctx.reply('Failover activated. Oracle VM is now handling critical services.\n\nUse /failover-status to check.\nUse /failback when HP is back.');
      }
    });
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`);
  }
});

// /failback — Manually trigger failback to HP
guardCommand('failback', async (ctx) => {
  log('/failback');
  await ctx.reply('Triggering failback to HP laptop...');
  try {
    const { exec } = require('child_process');
    exec('ssh -o ConnectTimeout=15 oracle-navada "bash /home/ubuntu/navada-failover/failover-deactivate.sh"', { timeout: 120000, windowsHide: true }, async (err, stdout, stderr) => {
      if (err) {
        await ctx.reply(`Failback failed:\n${stderr || err.message}`);
      } else {
        await ctx.reply('Failback complete. All services restored to HP.\n\nState synced back from Oracle.');
      }
    });
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`);
  }
});

// /failover-status — Check failover state
async function handleFailoverStatus(ctx) {
  try {
    const { exec } = require('child_process');
    exec('ssh -o ConnectTimeout=10 oracle-navada "cat /home/ubuntu/navada-failover/.failover-active 2>/dev/null || echo INACTIVE; pm2 jlist 2>/dev/null | head -1; docker ps --filter name=navada-failover --format \\"{{.Names}}: {{.Status}}\\" 2>/dev/null"', { timeout: 30000, windowsHide: true }, async (err, stdout) => {
      if (err) {
        await ctx.reply('Could not reach Oracle VM to check failover status.');
        return;
      }
      const lines = stdout.trim().split('\n');
      const stateRaw = lines[0];
      const isActive = stateRaw !== 'INACTIVE';
      let msg = `<b>Failover Status</b>\n\n`;
      msg += `State: ${isActive ? 'ACTIVE' : 'INACTIVE'}\n`;
      if (isActive) {
        try {
          const state = JSON.parse(stateRaw);
          msg += `Activated: ${state.activated}\n`;
          msg += `Reason: ${state.reason}\n`;
        } catch (e) {
          msg += `Details: ${stateRaw}\n`;
        }
        msg += `\nOracle PM2/Docker:\n${lines.slice(1).join('\n') || 'No services detected'}`;
      } else {
        msg += 'HP laptop is primary. Oracle on standby.';
      }
      await ctx.reply(msg, { parse_mode: 'HTML' });
    });
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`);
  }
}

guardCommand('failover-status', async (ctx) => {
  log('/failover-status');
  await handleFailoverStatus(ctx);
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

// /costs (legacy alias)
bot.command('costs', async (ctx) => {
  log('/costs -> /cost');
  return handleCostCommand(ctx, '');
});

// /cost — comprehensive cost & usage tracking
bot.command('cost', async (ctx) => {
  const args = ctx.message.text.replace(/^\/cost\s*/, '').trim().toLowerCase();
  log(`/cost ${args}`);
  return handleCostCommand(ctx, args);
});

async function handleCostCommand(ctx, args) {
  const GBP_RATE = 0.79;

  // Determine period
  const period = ['week', 'weekly'].includes(args) ? 'weekly'
    : ['month', 'monthly'].includes(args) ? 'monthly'
    : ['session'].includes(args) ? 'session'
    : 'daily'; // default

  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : period === 'monthly' ? 'This Month' : 'Session';

  try {
    await ctx.reply(`Fetching ${periodLabel.toLowerCase()} usage...`);

    // Run ccusage + cost-tracker in parallel
    const { execSync } = require('child_process');
    let ccData = null;
    let costTrackerData = null;

    // 1) ccusage (Claude Code subscription usage)
    try {
      const raw = execSync(`ccusage ${period} --json --no-color`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: { ...process.env, NO_COLOR: '1' },
        windowsHide: true,
      });
      ccData = JSON.parse(raw);
    } catch (e) {
      console.warn('[cost] ccusage failed:', e.message);
    }

    // 2) Cost tracker (Telegram API gateway costs)
    try {
      const tracker = require(path.join(NAVADA_DIR, 'Manager/cost-tracking/cost-tracker'));
      if (period === 'weekly') {
        costTrackerData = tracker.getWeeklySummary();
      } else {
        costTrackerData = tracker.getDailySummary();
      }
    } catch (e) {
      console.warn('[cost] cost-tracker failed:', e.message);
    }

    // Build report
    let msg = `**NAVADA Cost Report | ${periodLabel}**\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // --- Claude Code (Subscription) ---
    if (ccData) {
      const entries = ccData[period] || ccData.daily || [];
      const totals = ccData.totals || {};
      const totalUSD = period === 'daily' || period === 'session'
        ? entries.reduce((s, e) => s + (e.totalCost || 0), 0)
        : totals.totalCost || entries.reduce((s, e) => s + (e.totalCost || 0), 0);
      const totalGBP = (totalUSD * GBP_RATE).toFixed(2);
      const totalTokens = period === 'daily' || period === 'session'
        ? entries.reduce((s, e) => s + (e.totalTokens || 0), 0)
        : totals.totalTokens || entries.reduce((s, e) => s + (e.totalTokens || 0), 0);

      msg += `**Claude Code (Subscription)**\n`;
      msg += `Cost: £${totalGBP} ($${totalUSD.toFixed(2)})\n`;
      msg += `Tokens: ${formatNum(totalTokens)}\n`;

      // Model breakdown for daily
      if (entries.length > 0) {
        const latest = entries[entries.length - 1];
        if (latest.modelBreakdowns) {
          for (const mb of latest.modelBreakdowns) {
            const name = mb.modelName.replace('claude-', '').replace(/-\d+$/, '');
            const gbp = (mb.cost * GBP_RATE).toFixed(2);
            msg += `  ${name}: £${gbp}\n`;
          }
        }
      }

      // Show per-day for weekly/monthly
      if ((period === 'weekly' || period === 'monthly') && entries.length > 1) {
        msg += `\nDaily breakdown:\n`;
        for (const e of entries.slice(-7)) {
          const dayGBP = (e.totalCost * GBP_RATE).toFixed(2);
          msg += `  ${e.date}: £${dayGBP}\n`;
        }
      }
      msg += `\n`;
    }

    // --- API Gateway (Telegram/SMS/WhatsApp channel costs) ---
    if (costTrackerData && costTrackerData.total_calls > 0) {
      msg += `**API Gateway (Channels)**\n`;
      msg += `Calls: ${costTrackerData.total_calls}\n`;
      msg += `Cost: £${costTrackerData.total_cost_gbp.toFixed(4)}\n`;
      msg += `Human equiv: ${costTrackerData.total_human_hours}h (£${costTrackerData.total_human_cost_gbp})\n`;
      msg += `ROI: ${costTrackerData.roi_multiplier}x cheaper\n`;

      if (costTrackerData.by_model) {
        for (const [model, data] of Object.entries(costTrackerData.by_model)) {
          msg += `  ${model}: ${data.calls} calls, £${data.cost_gbp.toFixed(4)}\n`;
        }
      }
      msg += `\n`;
    } else {
      msg += `**API Gateway (Channels)**\n`;
      msg += `No API gateway calls today\n\n`;
    }

    // --- Combined total ---
    const ccTotal = ccData
      ? (ccData.totals?.totalCost || (ccData[period] || ccData.daily || []).reduce((s, e) => s + (e.totalCost || 0), 0)) * GBP_RATE
      : 0;
    const apiTotal = costTrackerData?.total_cost_gbp || 0;
    const grandTotal = ccTotal + apiTotal;

    msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `**Total: £${grandTotal.toFixed(2)}**\n`;
    msg += `Claude Code: £${ccTotal.toFixed(2)} | API: £${apiTotal.toFixed(4)}\n\n`;
    msg += `_/cost day | week | month | session_`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[cost] Error:', err.message);
    await ctx.reply(`Cost report error: ${err.message}`);
  }
}

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// /usage — quick token usage summary (ccusage)
bot.command('usage', async (ctx) => {
  const args = ctx.message.text.replace(/^\/usage\s*/, '').trim().toLowerCase();
  log(`/usage ${args}`);

  const period = ['week', 'weekly'].includes(args) ? 'weekly'
    : ['month', 'monthly'].includes(args) ? 'monthly'
    : ['session'].includes(args) ? 'session'
    : 'daily';
  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : period === 'monthly' ? 'This Month' : 'Session';

  try {
    const { execSync } = require('child_process');
    const raw = execSync(`ccusage ${period} --json --no-color`, {
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, NO_COLOR: '1' },
      windowsHide: true,
    });
    const data = JSON.parse(raw);
    const entries = data[period] || data.daily || [];
    const totals = data.totals || {};
    const GBP_RATE = 0.79;

    const totalTokens = totals.totalTokens || entries.reduce((s, e) => s + (e.totalTokens || 0), 0);
    const inputTokens = totals.inputTokens || entries.reduce((s, e) => s + (e.inputTokens || 0), 0);
    const outputTokens = totals.outputTokens || entries.reduce((s, e) => s + (e.outputTokens || 0), 0);
    const cacheRead = totals.cacheReadTokens || entries.reduce((s, e) => s + (e.cacheReadTokens || 0), 0);
    const cacheWrite = totals.cacheWriteTokens || entries.reduce((s, e) => s + (e.cacheWriteTokens || 0), 0);
    const totalCost = totals.totalCost || entries.reduce((s, e) => s + (e.totalCost || 0), 0);
    const costGBP = (totalCost * GBP_RATE).toFixed(2);

    let msg = `**NAVADA Token Usage | ${periodLabel}**\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `**Total Tokens**: ${formatNum(totalTokens)}\n`;
    msg += `  Input:  ${formatNum(inputTokens)}\n`;
    msg += `  Output: ${formatNum(outputTokens)}\n`;
    if (cacheRead > 0) msg += `  Cache Read:  ${formatNum(cacheRead)}\n`;
    if (cacheWrite > 0) msg += `  Cache Write: ${formatNum(cacheWrite)}\n`;
    msg += `\n**Cost**: £${costGBP} ($${totalCost.toFixed(2)})\n`;

    // Model breakdown
    const latest = entries[entries.length - 1];
    if (latest?.modelBreakdowns?.length > 0) {
      msg += `\n**By Model**:\n`;
      for (const mb of latest.modelBreakdowns) {
        const name = mb.modelName.replace('claude-', '').replace(/-\d+$/, '');
        msg += `  ${name}: ${formatNum(mb.tokens || mb.totalTokens || 0)} tokens, £${(mb.cost * GBP_RATE).toFixed(2)}\n`;
      }
    }

    // Daily breakdown for week/month
    if ((period === 'weekly' || period === 'monthly') && entries.length > 1) {
      msg += `\n**Daily**:\n`;
      for (const e of entries.slice(-7)) {
        msg += `  ${e.date}: ${formatNum(e.totalTokens || 0)} tokens, £${((e.totalCost || 0) * GBP_RATE).toFixed(2)}\n`;
      }
    }

    // Guest budget summary
    if (guestBudgets.size > 0) {
      msg += `\n**Guest Budgets (today)**:\n`;
      for (const [uid, budget] of guestBudgets) {
        const remaining = Math.max(0, GUEST_DAILY_BUDGET_GBP - budget.spent);
        msg += `  User ${uid}: £${budget.spent.toFixed(4)} spent, £${remaining.toFixed(4)} remaining\n`;
      }
    }

    msg += `\n_/usage day | week | month | session_`;
    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[usage] Error:', err.message);
    await ctx.reply(`Usage report error: ${err.message}\n\nMake sure ccusage is installed: npm i -g ccusage`);
  }
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

// /cache — 3-tier cache stats & management (admin only)
guardCommand('cache', async (ctx) => {
  const args = ctx.message.text.replace('/cache', '').trim();
  log(`/cache ${args}`);

  if (args === 'cleanup') {
    const semanticResult = await semanticCache.cleanup();
    const dbEvicted = responseCache.evict();
    return ctx.reply(`Cache Cleanup\n\nSemantic: removed ${semanticResult.removed} expired entries.${semanticResult.error ? `\nError: ${semanticResult.error}` : ''}\nExact-match DB: evicted ${dbEvicted} expired entries.`);
  }

  if (args === 'clear') {
    const semanticResult = await semanticCache.cleanup();
    const dbEvicted = responseCache.evict();
    return ctx.reply(`Cache cleared.\nSemantic: ${semanticResult.removed} removed. Memory cache resets on next restart.\nExact-match DB: ${dbEvicted} evicted.`);
  }

  // Default: show stats
  const s = await semanticCache.stats();
  const dbStats = responseCache.stats();
  ctx.reply(
    `3-Tier Cache Status\n\n` +
    `Tier 1 - Memory LRU: ${s.memoryEntries} entries (30min TTL)\n` +
    `Tier 2 - Exact-match DB: ${dbStats.entries || 0} entries (${dbStats.total_hits || 0} total hits)\n` +
    `Tier 3 - ChromaDB semantic: ${s.chromaEntries} entries (24hr TTL)\n\n` +
    `DB tokens saved: ${dbStats.tokens_saved || 0}\n` +
    `DB cost saved: £${dbStats.cost_saved_gbp || 0}\n\n` +
    `Commands:\n` +
    `/cache cleanup - Remove expired entries\n` +
    `/cache clear - Full cache reset`
  );
});

// ============================================================
// INSPIRE DISTRIBUTION LIST
// ============================================================

const INSPIRE_LIST_PATH = path.join(NAVADA_DIR, 'Automation/kb/inspire-distribution.json');

function loadInspireList() {
  try {
    return JSON.parse(fs.readFileSync(INSPIRE_LIST_PATH, 'utf8'));
  } catch { return { members: [] }; }
}

function findInspireMember(query) {
  const list = loadInspireList();
  const q = query.toLowerCase().trim();
  // Exact name match first, then partial/fuzzy
  return list.members.find(m => m.name.toLowerCase() === q)
    || list.members.find(m => m.name.toLowerCase().includes(q))
    || list.members.find(m => m.name.toLowerCase().split(' ').some(w => w.startsWith(q)));
}

// /inspire — send to one member or all
guardCommand('inspire', async (ctx) => {
  const args = ctx.message.text.replace('/inspire', '').trim();
  log(`/inspire ${args}`);
  if (!args) {
    const list = loadInspireList();
    const memberList = list.members.map(m => `  ${m.name} — ${m.email}`).join('\n');
    return ctx.reply(`Inspire Powered by NAVADA (${list.members.length} members):\n\n${memberList}\n\nUsage:\n/inspire all <subject> | <body>\n/inspire <name> <subject> | <body>\n/inspire list`);
  }

  // /inspire list — show members
  if (args.toLowerCase() === 'list') {
    const list = loadInspireList();
    const memberList = list.members.map(m => `  ${m.name} — ${m.email}`).join('\n');
    return ctx.reply(`Inspire Powered by NAVADA (${list.members.length} members):\n\n${memberList}`);
  }

  // /inspire all <subject> | <body> — email everyone
  if (args.toLowerCase().startsWith('all ')) {
    const content = args.slice(4).trim();
    const list = loadInspireList();
    await askClaude(ctx, `Send an email to ALL members of the "Inspire Powered by NAVADA" distribution list. The members are: ${JSON.stringify(list.members)}. Address each person by their name in a personal greeting. The email content: ${content}. Parse "subject" (before the |) and "body" (after the |). Use the send_email tool for EACH member individually so you can personalise the greeting. Sign off as "Inspire Powered by NAVADA".`);
    return;
  }

  // /inspire <name> <subject> | <body> — email specific member
  // Try to extract name (everything before the subject which contains |)
  const pipeIdx = args.indexOf('|');
  if (pipeIdx === -1) {
    // Maybe just a name lookup
    const member = findInspireMember(args);
    if (member) return ctx.reply(`Found: ${member.name} — ${member.email}`);
    return ctx.reply('Member not found. Use /inspire list to see all members.\nTo send: /inspire <name> <subject> | <body>');
  }

  // Split into name + subject | body
  const beforePipe = args.slice(0, pipeIdx).trim();
  const body = args.slice(pipeIdx + 1).trim();
  // Try different splits of beforePipe to find the name
  const words = beforePipe.split(' ');
  let member = null;
  let subject = '';
  for (let i = 1; i <= Math.min(words.length - 1, 3); i++) {
    const candidateName = words.slice(0, i).join(' ');
    const found = findInspireMember(candidateName);
    if (found) {
      member = found;
      subject = words.slice(i).join(' ');
      break;
    }
  }

  if (!member) {
    return ctx.reply(`Could not identify member from "${beforePipe}". Use /inspire list to see names.`);
  }

  await askClaude(ctx, `Send an email to ${member.name} (${member.email}) from the Inspire Powered by NAVADA distribution list. Address them as "${member.name}" in the greeting. Subject: "${subject}". Body: "${body}". Use the send_email tool. Sign off as "Inspire Powered by NAVADA".`);
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

// /stream (admin only)
guardCommand('stream', async (ctx) => {
  const args = ctx.message.text.replace('/stream', '').trim();
  log(`/stream ${args}`);
  if (!args) {
    await askClaude(ctx, 'List all videos in Cloudflare Stream using the stream_video tool with action "list". Show a nicely formatted list.');
  } else if (args.startsWith('upload ')) {
    const target = args.replace('upload ', '').trim();
    if (target.startsWith('http://') || target.startsWith('https://')) {
      await askClaude(ctx, `Upload this video URL to Cloudflare Stream using the stream_video tool with action "upload_url" and video_url "${target}".`);
    } else {
      await askClaude(ctx, `Upload this local file to Cloudflare Stream using the stream_video tool with action "upload" and file_path "${target}".`);
    }
  } else {
    // Treat as video ID
    await askClaude(ctx, `Get info for Cloudflare Stream video "${args}" using the stream_video tool with action "info" and video_id "${args}". Show the details and playback URL.`);
  }
});

// /trace (admin only)
guardCommand('trace', async (ctx) => {
  const url = ctx.message.text.replace('/trace', '').trim();
  log(`/trace ${url}`);
  if (!url) return ctx.reply('Usage: /trace <url>\nExample: /trace https://navada-edge-server.uk');
  await askClaude(ctx, `Trace this URL through Cloudflare using the cloudflare_trace tool: "${url}". Show the matched rules, actions, and a summary of how the request flows.`);
});

// /flux (admin only) - Free AI image generation via Cloudflare Workers AI
guardCommand('flux', async (ctx) => {
  const prompt = ctx.message.text.replace('/flux', '').trim();
  log(`/flux ${prompt}`);
  if (!prompt) return ctx.reply('Usage: /flux <description>\nGenerates a FREE image via Cloudflare Workers AI (Flux).\nExample: /flux futuristic server room with blue neon lighting');
  await askClaude(ctx, `Generate an image using the flux_image tool (FREE Cloudflare Workers AI) with this prompt: "${prompt}". After generating, read the file_path from the result and send the image to me by reading and sharing the file.`);
});

// /crow (admin only) - Crow Theme design system
guardCommand('crow', async (ctx) => {
  const args = ctx.message.text.replace('/crow', '').trim();
  log(`/crow ${args}`);
  if (!args) {
    return ctx.reply(
      '◈ CROW THEME — NAVADA Lab Design System\n\n' +
      'Usage:\n' +
      '/crow image <subject> — Generate monochrome DALL-E image\n' +
      '/crow image <subject> --use-case <type> — Types: product, abstract, portrait, architecture, tech, vehicle, ui\n' +
      '/crow css — Get CSS variables for a project\n' +
      '/crow components — List available component snippets\n' +
      '/crow palette — Show the colour palette\n' +
      '/crow rules — Quick reference card\n\n' +
      'The Crow Theme is NAVADA\'s signature aesthetic: darkness, precision, restraint. ' +
      '100% achromatic. Zero border-radius. Newsreader + IBM Plex Mono.'
    );
  }

  if (args.startsWith('image ')) {
    const imageArgs = args.replace('image ', '').trim();
    // Parse --use-case flag
    const useCaseMatch = imageArgs.match(/--use-case\s+(product|abstract|portrait|architecture|tech|vehicle|ui)/);
    const useCase = useCaseMatch ? useCaseMatch[1] : 'product';
    const subject = imageArgs.replace(/--use-case\s+\w+/, '').trim();
    if (!subject) return ctx.reply('Usage: /crow image <subject>\nExample: /crow image a gaming laptop --use-case product');
    await askClaude(ctx, `Generate a Crow Theme image using DALL-E 3. Read the Crow Theme SKILL.md at CLAUDE_NAVADA_AGENT/crow_theme/SKILL.md section "9. DALL-E IMAGE GENERATION INTEGRATION" for the exact prompt formula. Subject: "${subject}", use case: "${useCase}". Use the generate_image tool with HD quality. The prompt MUST follow the Crow Theme monochrome formula: pure black and white, near-black background #050505, dramatic studio lighting, no color, brutalist editorial aesthetic.`);
  } else if (args === 'css') {
    await askClaude(ctx, `Read the file CLAUDE_NAVADA_AGENT/crow_theme/references/css-variables.md and send its contents formatted nicely. This contains the Crow Theme CSS variables, Tailwind config, global styles, and animations.`);
  } else if (args === 'components') {
    await askClaude(ctx, `Read the file CLAUDE_NAVADA_AGENT/crow_theme/references/component-snippets.md and list the 14 available component patterns with brief descriptions. Don't send the full code, just the names and what they're for.`);
  } else if (args === 'palette') {
    await ctx.reply(
      '◈ CROW THEME PALETTE\n\n' +
      '--bg-void        #050505  Primary background\n' +
      '--bg-elevated    #0a0a0a  Cards, code blocks\n' +
      '--border-subtle  #1a1a1a  Section dividers\n' +
      '--border-medium  #222222  Card/table borders\n' +
      '--border-strong  #444444  Logo, hover, active\n' +
      '--text-ghost     #444444  Decorative glyphs\n' +
      '--text-muted     #555555  Labels, captions\n' +
      '--text-secondary #888888  Body text\n' +
      '--text-primary   #e0e0e0  Data, names, values\n' +
      '--text-bright    #ffffff  Headlines, emphasis\n\n' +
      'Fonts: Newsreader (serif, 300) + IBM Plex Mono (mono, 400)\n' +
      'Radius: 0 everywhere. Glyphs: ◈ ⬡ ◉ ▸ ★'
    );
  } else if (args === 'rules') {
    await ctx.reply(
      '◈ CROW THEME QUICK REFERENCE\n\n' +
      'NEVER:\n' +
      '• Any colour with hue/saturation\n' +
      '• Rounded corners (border-radius > 0)\n' +
      '• Bold serif text (always weight 300)\n' +
      '• Icon libraries (use Unicode glyphs)\n' +
      '• Drop shadows or box shadows\n' +
      '• Gradients (except subtle #0a→#050505)\n' +
      '• More than 2 font families\n' +
      '• Emojis in UI\n\n' +
      'ALWAYS:\n' +
      '• Mono labels = uppercase + wide spacing\n' +
      '• Section headers start with glyph (◈ ⬡ ◉ ▸ ★)\n' +
      '• 1px #1a1a1a dividers between sections\n' +
      '• Hierarchy: #fff > #e0e0e0 > #888 > #555 > #444'
    );
  } else {
    // Freeform crow theme request — pass to Claude with full context
    await askClaude(ctx, `Crow Theme design request: "${args}". Read the Crow Theme spec at CLAUDE_NAVADA_AGENT/crow_theme/SKILL.md and the component snippets at crow_theme/references/component-snippets.md. Apply the Crow Theme rules strictly: 100% achromatic, zero border-radius, Newsreader + IBM Plex Mono, brutalist editorial aesthetic. Generate whatever the user is asking for.`);
  }
});

// /gemini (admin only) - Gemini image generation
guardCommand('gemini', async (ctx) => {
  const prompt = ctx.message.text.replace('/gemini', '').trim();
  log(`/gemini ${prompt}`);
  if (!prompt) return ctx.reply('Usage: /gemini <description>\nGenerates an image via Google Gemini 2.0 Flash (~£0.03/image).\nSupports aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4\nExample: /gemini futuristic NAVADA server room with holographic displays');
  await askClaude(ctx, `Generate an image using the gemini_image tool with this prompt: "${prompt}". Use the default 1:1 aspect ratio unless the user specifies otherwise.`);
});

// /media (admin only) - NAVADA media library (R2-hosted videos/audio)
guardCommand('media', async (ctx) => {
  const args = ctx.message.text.replace('/media', '').trim();
  log(`/media ${args}`);
  if (!args) {
    // List media directly with play buttons instead of routing through Claude
    try {
      const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
      const CF_ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
      const R2_PUBLIC = 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev';
      const listUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCT}/r2/buckets/navada-assets/objects?prefix=media/`;
      const listRes = await new Promise((resolve, reject) => {
        const urlObj = new URL(listUrl);
        https.get({
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        }).on('error', reject);
      });
      if (listRes.success && listRes.result && listRes.result.length > 0) {
        const files = listRes.result.filter(o => o.key !== 'media/');
        let msg = `NAVADA Media Library (${files.length} files)\n\n`;
        const buttons = [];
        for (const f of files) {
          const name = f.key.replace('media/', '');
          const sizeMB = (f.size / 1024 / 1024).toFixed(1);
          msg += `${name} (${sizeMB} MB)\n`;
          buttons.push([{ text: `Play: ${name}`, callback_data: `media_play:${name}` }]);
        }
        buttons.push([{ text: 'Watch All in Browser', url: `${R2_PUBLIC}/media/` }]);
        await ctx.reply(msg.trim(), { reply_markup: { inline_keyboard: buttons } });
      } else {
        await ctx.reply('No media files found in R2.');
      }
    } catch (err) {
      log(`/media list error: ${err.message}`);
      await askClaude(ctx, 'List all media files in the NAVADA media library using the play_media tool with action "list". Show a nicely formatted list with names, sizes, and playback URLs.');
    }
  } else if (args.startsWith('email ')) {
    const rest = args.replace('email ', '').trim();
    const parts = rest.split(' ');
    const email = parts[0];
    const filename = parts[1] || 'claude-chief-of-staff.mp4';
    await askClaude(ctx, `Email the media file "${filename}" to ${email} using the play_media tool with action "send_email". Include a professional message about it being a NAVADA media resource.`);
  } else {
    // Send video natively via Telegram for inline playback
    const filename = args === 'play' ? 'claude-chief-of-staff.mp4' : args;
    const R2_PUBLIC = 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev';
    const videoUrl = `${R2_PUBLIC}/media/${filename}`;
    try {
      // First try sending via URL (works for files <50MB)
      await ctx.replyWithVideo({ url: videoUrl }, {
        caption: `Now playing: ${filename}`,
        supports_streaming: true,
      });
    } catch (err) {
      log(`Video URL send failed (${err.message}), trying local download...`);
      // Download to temp file and send locally (supports up to 2GB)
      const tmpPath = path.join(os.tmpdir(), filename);
      try {
        const fileStream = fs.createWriteStream(tmpPath);
        await new Promise((resolve, reject) => {
          https.get(videoUrl, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            res.pipe(fileStream);
            fileStream.on('finish', () => { fileStream.close(); resolve(); });
          }).on('error', reject);
        });
        await ctx.replyWithVideo({ source: tmpPath }, {
          caption: `Now playing: ${filename}`,
          supports_streaming: true,
        });
        fs.unlinkSync(tmpPath);
      } catch (dlErr) {
        log(`Video local send also failed (${dlErr.message}), sending link`);
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        await ctx.reply(`${filename}\n\nWatch here: ${videoUrl}`);
      }
    }
  }
});

// Callback handler for media play buttons
bot.action(/^media_play:(.+)$/, async (ctx) => {
  const filename = ctx.match[1];
  const R2_PUBLIC = 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev';
  const videoUrl = `${R2_PUBLIC}/media/${filename}`;
  log(`[MEDIA PLAY] ${filename}`);
  await ctx.answerCbQuery(`Loading ${filename}...`);
  try {
    await ctx.replyWithVideo({ url: videoUrl }, {
      caption: `Now playing: ${filename}`,
      supports_streaming: true,
    });
  } catch (err) {
    log(`Media callback URL send failed (${err.message}), downloading...`);
    const tmpPath = path.join(os.tmpdir(), filename);
    try {
      const fileStream = fs.createWriteStream(tmpPath);
      await new Promise((resolve, reject) => {
        https.get(videoUrl, (res) => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          res.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(); });
        }).on('error', reject);
      });
      await ctx.replyWithVideo({ source: tmpPath }, {
        caption: `Now playing: ${filename}`,
        supports_streaming: true,
      });
      fs.unlinkSync(tmpPath);
    } catch (dlErr) {
      log(`Media callback local send failed (${dlErr.message})`);
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      await ctx.reply(`${filename}\n\nWatch here: ${videoUrl}`);
    }
  }
});

// /video (admin only) - Generate videos and media assets for any topic
guardCommand('video', async (ctx) => {
  const args = ctx.message.text.replace('/video', '').trim();
  log(`/video ${args}`);
  if (!args) {
    return ctx.reply(
      'Usage: /video <description>\n\n' +
      'Generate videos and media assets for any topic.\n\n' +
      'Examples:\n' +
      '/video 60s explainer about AI agents\n' +
      '/video 15s NAVADA brand intro\n' +
      '/video thumbnail "Why Enterprise AI Fails"\n' +
      '/video image hero for UK-Africa investment fund\n' +
      '/video clip abstract neural network animation 5s\n' +
      '/video all "NAVADA Edge launch" (full asset pack)\n\n' +
      'Asset types: video, image, thumbnail, clip, logo, infographic, audio, slides, all'
    );
  }
  // Route through Claude with render_video tool
  await askClaude(ctx, `TASK: Generate media content for the user. You MUST call a tool to do this. Do NOT respond with text only.

MANDATORY: You MUST call one of these tools in your response. Do NOT skip the tool call. Do NOT pretend the content is ready. Do NOT fabricate URLs or results. Actually call the tool and wait for the real result.

FOR VIDEO REQUESTS - Call the render_video tool:
- Pre-built compositions: NavadaIntro (5s brand intro), NavadaIntroSquare (1080x1080), TextReveal (word-by-word text)
- Custom videos: Set composition="custom" and provide custom_component with React TSX code
- The tool handles rendering, R2 upload, and email automatically
- Set email_to="leeakpareva@gmail.com" to email the result
- Brand: navy #0A0F2C, gold #C9A84C, bg #080C22

FOR IMAGE REQUESTS: Call generate_image (DALL-E), gemini_image, or flux_image.

User request: "${args}"

RULES:
1. You MUST call a tool. This is not optional.
2. Do NOT say "I'll render that for you" and then not call the tool.
3. Do NOT generate fake R2 URLs or pretend rendering happened.
4. Call the tool FIRST, then respond based on the REAL tool result.
5. If the tool fails, tell the user the actual error.`);
});

// /r2 (admin only) - Cloudflare R2 object storage
guardCommand('r2', async (ctx) => {
  const args = ctx.message.text.replace('/r2', '').trim();
  log(`/r2 ${args}`);
  if (!args) {
    await askClaude(ctx, 'List all objects in R2 storage using the r2_storage tool with action "list". Show a nicely formatted list with sizes.');
  } else if (args === 'buckets') {
    await askClaude(ctx, 'List all R2 buckets using the r2_storage tool with action "buckets".');
  } else if (args.startsWith('upload ')) {
    const filePath = args.replace('upload ', '').trim();
    await askClaude(ctx, `Upload this file to R2 using the r2_storage tool: file_path="${filePath}". Use a sensible key based on the filename.`);
  } else {
    await askClaude(ctx, `R2 storage request: "${args}". Use the r2_storage tool to handle this. Available actions: list, upload, delete, buckets, url.`);
  }
});

// /logs (admin only) - ELK log search
guardCommand('logs', async (ctx) => {
  const args = ctx.message.text.replace('/logs', '').trim();
  log(`/logs ${args}`);
  if (!args) {
    await askClaude(ctx, 'Show the latest 10 log entries across all NAVADA logs using the elk_query tool with action "tail". Show timestamps, source index, and message content.');
  } else if (args === 'stats') {
    await askClaude(ctx, 'Show ELK cluster health and index stats using the elk_query tool with action "stats".');
  } else if (args === 'telegram') {
    await askClaude(ctx, 'Show the latest 10 Telegram interactions using the elk_query tool with action "tail", index "navada-telegram-*".');
  } else if (args === 'errors') {
    await askClaude(ctx, 'Search for errors across all NAVADA logs using the elk_query tool with action "search", query "error OR Error OR ERROR OR failed OR exception", time_range "24h".');
  } else if (args === 'indices') {
    await askClaude(ctx, 'List all Elasticsearch indices using the elk_query tool with action "indices".');
  } else if (args.startsWith('search ')) {
    const query = args.replace('search ', '').trim();
    await askClaude(ctx, `Search all NAVADA logs for "${query}" using the elk_query tool with action "search". Show results with timestamps and source index.`);
  } else {
    await askClaude(ctx, `ELK log query: "${args}". Use the elk_query tool to handle this request. Available actions: search, tail, count, indices, stats. Available indices: navada-telegram-*, navada-automation-*, navada-pm2-*.`);
  }
});

// /flix (admin only) - NAVADA Flix video streaming
guardCommand('flix', async (ctx) => {
  const args = ctx.message.text.replace('/flix', '').trim();
  log(`/flix ${args}`);
  if (!args) {
    await askClaude(ctx, `List all videos in NAVADA Flix. Use run_shell to run: curl -s http://localhost:4000/api/videos | node -e "const v=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); if(!v.length){console.log('No videos yet. Use /video to generate one, then /flix import to add it.')} else {v.forEach((x,i)=>console.log((i+1)+'. '+x.title+' ['+x.status+'] '+Math.round(x.duration||0)+'s ('+x.source+')'))}"
Also mention the streaming URL: http://192.168.0.58:4000`);
  } else if (args.startsWith('import ')) {
    const filePath = args.replace('import ', '').trim();
    await askClaude(ctx, `Import a video into NAVADA Flix for HLS streaming. Use run_shell to run:
curl -s -X POST http://localhost:4000/api/videos/import -H "Content-Type: application/json" -d '{"path":"${filePath}","title":"${require('path').basename(filePath, '.mp4')}","description":"Imported video"}'
Report the result.`);
  } else if (args === 'live') {
    await askClaude(ctx, 'Check NAVADA Flix live stream status. Use run_shell: curl -s http://localhost:4000/api/stream/live');
  } else {
    await askClaude(ctx, `NAVADA Flix request: "${args}". The Flix API runs at http://localhost:4000. Available endpoints: GET /api/videos (list), POST /api/videos/import (import local file), POST /api/videos/upload (upload), DELETE /api/videos/:id, GET /api/playlists, POST /api/playlists. Streaming URL: http://192.168.0.58:4000. Use run_shell with curl to handle this.`);
  }
});

// /aws (admin only) - AWS EC2 management
guardCommand('aws', async (ctx) => {
  const args = ctx.message.text.replace('/aws', '').trim();
  log(`/aws ${args}`);
  if (!args || args === 'status') {
    await askClaude(ctx, `Check AWS EC2 status. Use run_shell to run:
export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH" && aws ec2 describe-instances --region eu-west-2 --query "Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,Tags[?Key==\\\`Name\\\`].Value|[0],PublicIpAddress]" --output table
Report instance status, IP, and type.`);
  } else if (args === 'start') {
    await askClaude(ctx, `Start the NAVADA Edge AWS EC2 instance. Use run_shell:
export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH" && aws ec2 start-instances --region eu-west-2 --instance-ids i-083ce551563faa6db && echo "Starting instance..." && sleep 5 && aws ec2 describe-instances --region eu-west-2 --instance-ids i-083ce551563faa6db --query "Reservations[0].Instances[0].[State.Name,PublicIpAddress]" --output text`);
  } else if (args === 'stop') {
    await askClaude(ctx, `Stop the NAVADA Edge AWS EC2 instance to save costs. Use run_shell:
export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH" && aws ec2 stop-instances --region eu-west-2 --instance-ids i-083ce551563faa6db
Confirm it's stopping.`);
  } else if (args === 'costs') {
    await askClaude(ctx, `Check estimated AWS costs. The NAVADA Edge AWS setup:
- EC2 t3.large: ~$0.0832/hr (~$60/month) ONLY when running
- EBS 200GB gp3: ~$16/month (always charged)
- Data transfer: varies
Use run_shell with: export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH" && aws ec2 describe-instances --region eu-west-2 --instance-ids i-083ce551563faa6db --query "Reservations[0].Instances[0].State.Name" --output text
Report if running (being charged compute) or stopped (storage only).`);
  } else {
    await askClaude(ctx, `AWS management request: "${args}". Use run_shell with AWS CLI (set PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH" first). Region is eu-west-2. Instance ID: i-083ce551563faa6db.`);
  }
});

// ============================================================
// YOLO OBJECT DETECTION
// ============================================================

// Colour palette for bounding boxes (high contrast, colour-blind friendly)
const YOLO_COLOURS = [
  { r: 255, g: 0, b: 0 },     // Red
  { r: 0, g: 180, b: 0 },     // Green
  { r: 0, g: 100, b: 255 },   // Blue
  { r: 255, g: 165, b: 0 },   // Orange
  { r: 180, g: 0, b: 255 },   // Purple
  { r: 0, g: 200, b: 200 },   // Cyan
  { r: 255, g: 255, b: 0 },   // Yellow
  { r: 255, g: 0, b: 150 },   // Pink
];

async function drawBoundingBoxes(imagePath, detections, imageSize) {
  const sharp = require('sharp');
  const img = sharp(imagePath);
  const meta = await img.metadata();
  const imgW = meta.width;
  const imgH = meta.height;

  // Scale factors if API returns coords for different resolution
  const scaleX = imageSize ? imgW / imageSize.width : 1;
  const scaleY = imageSize ? imgH / imageSize.height : 1;

  // Build class-to-colour map
  const classColours = {};
  let colourIdx = 0;
  for (const d of detections) {
    const cls = d.label || d.class || d.name || 'unknown';
    if (!classColours[cls]) {
      classColours[cls] = YOLO_COLOURS[colourIdx % YOLO_COLOURS.length];
      colourIdx++;
    }
  }

  // Build SVG overlay with boxes and labels
  const boxThickness = Math.max(2, Math.round(Math.min(imgW, imgH) / 200));
  const fontSize = Math.max(14, Math.round(Math.min(imgW, imgH) / 40));

  let svgParts = [];
  svgParts.push(`<svg width="${imgW}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">`);

  detections.forEach((d, i) => {
    const cls = d.label || d.class || d.name || 'unknown';
    const conf = d.confidence || d.score || 0;
    const c = classColours[cls];
    const colour = `rgb(${c.r},${c.g},${c.b})`;

    const bbox = d.bbox || {};
    const x1 = Math.round((bbox.x1 || 0) * scaleX);
    const y1 = Math.round((bbox.y1 || 0) * scaleY);
    const x2 = Math.round((bbox.x2 || 0) * scaleX);
    const y2 = Math.round((bbox.y2 || 0) * scaleY);
    const w = x2 - x1;
    const h = y2 - y1;

    if (w <= 0 || h <= 0) return;

    // Bounding box rectangle
    svgParts.push(`<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="none" stroke="${colour}" stroke-width="${boxThickness}" rx="3"/>`);

    // Label background
    const labelText = `${cls} ${(conf * 100).toFixed(0)}%`;
    const labelW = labelText.length * fontSize * 0.6 + 10;
    const labelH = fontSize + 8;
    const labelY = Math.max(0, y1 - labelH);
    svgParts.push(`<rect x="${x1}" y="${labelY}" width="${labelW}" height="${labelH}" fill="${colour}" rx="3"/>`);
    svgParts.push(`<text x="${x1 + 5}" y="${labelY + fontSize}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">${labelText}</text>`);
  });

  svgParts.push('</svg>');
  const svgOverlay = Buffer.from(svgParts.join('\n'));

  // Composite overlay onto image
  const annotatedPath = imagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_annotated.jpg');
  await img
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(annotatedPath);

  return annotatedPath;
}

async function processYolo(ctx, fileId) {
  try {
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const ext = path.extname(file.file_path) || '.jpg';
    const filename = `yolo_${Date.now()}${ext}`;
    const destPath = path.join(UPLOADS_DIR, filename);
    await downloadFile(fileUrl, destPath);

    await ctx.reply('Analysing image with YOLO...');

    // Try ASUS local YOLO first (faster, free)
    let detections = null;
    let imageSize = null;
    let source = '';
    try {
      const asusResult = await new Promise((resolve, reject) => {
        const reqData = JSON.stringify({ image_path: destPath });
        const req = http.request({
          hostname: '100.88.118.128',
          port: 8765,
          path: '/detect',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }, (res) => {
          let body = '';
          res.on('data', (d) => body += d);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid response')); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(reqData);
        req.end();
      });
      if (asusResult && asusResult.detections) {
        detections = asusResult.detections;
        imageSize = asusResult.imageSize || null;
        source = 'ASUS (local)';
        log('[YOLO] ASUS local detection succeeded');
      }
    } catch (asusErr) {
      log(`[YOLO] ASUS unavailable (${asusErr.message}), falling back to AWS`);
    }

    // Fallback to AWS API Gateway
    if (!detections) {
      try {
        const imageData = fs.readFileSync(destPath).toString('base64');
        const awsResult = await new Promise((resolve, reject) => {
          const reqData = JSON.stringify({ imageBase64: imageData, action: 'yolo' });
          const req = https.request({
            hostname: 'xxqtcilmzi.execute-api.eu-west-2.amazonaws.com',
            path: '/vision/yolo',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          }, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
              try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid AWS response')); }
            });
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
          req.write(reqData);
          req.end();
        });
        detections = awsResult.detections || awsResult.results || [];
        imageSize = awsResult.imageSize || null;
        source = 'AWS SageMaker';
        log('[YOLO] AWS API detection succeeded');
      } catch (awsErr) {
        log(`[YOLO] AWS fallback failed: ${awsErr.message}`);
        return ctx.reply(`YOLO detection failed. Both ASUS and AWS endpoints unavailable.\nASUS: offline\nAWS: ${awsErr.message}`);
      }
    }

    // No detections
    if (!detections || detections.length === 0) {
      try { fs.unlinkSync(destPath); } catch {}
      return ctx.reply('No objects detected in this image.');
    }

    // Draw bounding boxes on image
    let annotatedPath = null;
    try {
      annotatedPath = await drawBoundingBoxes(destPath, detections, imageSize);
    } catch (drawErr) {
      log(`[YOLO] Bounding box draw failed: ${drawErr.message}`);
    }

    // Build detailed summary
    const counts = {};
    let totalConf = 0;
    detections.forEach((d) => {
      const label = d.label || d.class || d.name || 'unknown';
      const conf = d.confidence || d.score || 0;
      counts[label] = (counts[label] || 0) + 1;
      totalConf += conf;
    });
    const avgConf = totalConf / detections.length;
    const uniqueClasses = Object.keys(counts).length;

    let msg = `NAVADA Vision - YOLO Detection\n`;
    msg += `${'='.repeat(32)}\n\n`;

    // Per-object details
    detections.forEach((d, i) => {
      const label = d.label || d.class || d.name || 'unknown';
      const conf = d.confidence || d.score || 0;
      const bbox = d.bbox || {};
      const bboxW = Math.round((bbox.x2 || 0) - (bbox.x1 || 0));
      const bboxH = Math.round((bbox.y2 || 0) - (bbox.y1 || 0));
      msg += `${i + 1}. ${label} - ${(conf * 100).toFixed(1)}% confidence`;
      if (bboxW > 0 && bboxH > 0) msg += ` [${bboxW}x${bboxH}px]`;
      msg += '\n';
    });

    msg += `\n--- Summary ---\n`;
    msg += `Objects: ${detections.length} detected\n`;
    msg += `Classes: ${uniqueClasses} unique (${Object.entries(counts).map(([k, v]) => v > 1 ? `${k} x${v}` : k).join(', ')})\n`;
    msg += `Avg confidence: ${(avgConf * 100).toFixed(1)}%\n`;
    if (imageSize) msg += `Image: ${imageSize.width}x${imageSize.height}px\n`;
    msg += `Model: YOLOv8n\n`;
    msg += `Source: ${source}`;

    // Send annotated image with caption, or just text if drawing failed
    if (annotatedPath && fs.existsSync(annotatedPath)) {
      await ctx.replyWithPhoto({ source: annotatedPath }, { caption: msg });
      try { fs.unlinkSync(annotatedPath); } catch {}
    } else {
      await ctx.reply(msg);
    }

    // Cleanup
    try { fs.unlinkSync(destPath); } catch {}
  } catch (err) {
    log(`[ERROR] YOLO: ${err.message}`);
    await ctx.reply(`YOLO error: ${err.message}`);
  }
}

// /yolo - Object detection on a photo
guardCommand('yolo', async (ctx) => {
  log('/yolo');
  const reply = ctx.message.reply_to_message;
  if (!reply || !reply.photo) {
    return ctx.reply('Reply to a photo with /yolo to run object detection.\nOr send a photo with caption "yolo".');
  }
  const photos = reply.photo;
  const largest = photos[photos.length - 1];
  await processYolo(ctx, largest.file_id);
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

    // Check for YOLO caption
    if (caption.toLowerCase().trim() === 'yolo' || caption.toLowerCase().trim() === '/yolo') {
      return processYolo(ctx, largest.file_id);
    }

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
      { command: 'inspire', description: 'Inspire group email (name/all)' },
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
      // Cloudflare
      { command: 'stream', description: 'Cloudflare Stream videos' },
      { command: 'trace', description: 'Trace request through Cloudflare' },
      { command: 'flux', description: 'Generate FREE AI image (Flux)' },
      { command: 'crow', description: 'Crow Theme design system' },
      { command: 'gemini', description: 'Generate AI image (Gemini)' },
      { command: 'r2', description: 'R2 object storage' },
      { command: 'media', description: 'NAVADA media library' },
      { command: 'video', description: 'Generate videos and media assets' },
      // Voice & Other
      { command: 'voice', description: 'Voice system control' },
      { command: 'voicenote', description: 'Send voice email to Lee' },
      { command: 'cost', description: 'Usage & costs in £ (day/week/month)' },
      { command: 'logs', description: 'Search server logs (ELK)' },
      { command: 'flix', description: 'NAVADA Flix video streaming' },
      { command: 'aws', description: 'AWS EC2 management' },
      { command: 'yolo', description: 'Object detection on a photo' },
      { command: 'failover', description: 'Trigger failover to Oracle VM' },
      { command: 'failback', description: 'Restore services to HP laptop' },
      { command: 'cache', description: 'Semantic cache stats' },
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

/**
 * Process inbound message from any channel (SMS, WhatsApp) with:
 * - SHARED conversation history across Telegram, SMS, WhatsApp (omni-channel)
 * - Full tool access (all TOOLS + executeTool)
 * - Semantic cache (lookup before API, store after)
 * - RAG context injection from ChromaDB knowledge base
 * - Channel-aware system prompt
 * - 2-day auto-purge of old conversation turns
 * @param {string} message - The inbound message text
 * @param {string} channel - 'sms' or 'whatsapp'
 * @returns {string} Claude's text reply
 */
async function processInboundMessage(message, channel) {
  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
  const maxChars = channel === 'sms' ? 1500 : 3000;

  // --- Semantic Cache Lookup ---
  try {
    const cached = await semanticCache.lookup(message);
    if (cached) {
      log(`[${channelLabel} CACHE HIT] source=${cached.source} dist=${cached.distance.toFixed(4)} for: "${message.slice(0, 80)}"`);
      logInteraction({ direction: 'in', userId: OWNER_ID, username: 'Lee', model: 'cache', message: `[${channelLabel}] ${message.slice(0, 500)}` });
      logInteraction({ direction: 'out', userId: OWNER_ID, username: 'Lee', model: 'cache', message: `[${channelLabel}] ${cached.response.slice(0, 500)}`, cost_gbp: 0 });
      return cached.response.slice(0, maxChars);
    }
  } catch (cacheErr) {
    log(`[${channelLabel} CACHE] Lookup error (non-blocking): ${cacheErr.message}`);
  }

  // --- RAG Context Retrieval ---
  let ragContext = '';
  try {
    const rag = require('./chroma-rag');
    const ragResults = await rag.search(message, 3);
    if (ragResults && ragResults.length > 0) {
      const snippets = ragResults.map(r => r.document).filter(Boolean).join('\n---\n');
      if (snippets.length > 50) {
        ragContext = `\n\n## Relevant Knowledge (from NAVADA RAG)\n${snippets.slice(0, 2000)}`;
      }
    }
  } catch (ragErr) {
    log(`[${channelLabel} RAG] Error (non-blocking): ${ragErr.message}`);
  }

  // Use shared owner conversation history (same across Telegram, SMS, WhatsApp)
  const history = getUserHistory(OWNER_ID);

  // --- Auto-purge: keep last 40 turns max (roughly 2 days of normal usage) ---
  while (history.length > 40) {
    history.splice(0, 2); // Remove oldest user+assistant pair
  }

  history.push({ role: 'user', content: `[${channelLabel}] ${message}` });

  // Trim history (hard cap)
  while (history.length > MAX_HISTORY * 2) {
    history.splice(0, 2);
  }

  // Smart model selection for omni-channel
  const omniModel = selectModel(message);

  // Omni-channel system prompt
  const systemPrompt = getAdminSystemPrompt(omniModel.name) + `\n\n${channelLabel} Channel: Keep responses under ${maxChars} chars. ${channel === 'sms' ? 'SMS is expensive, be brief.' : 'WhatsApp allows more detail.'} No markdown. Plain text only.${ragContext}`;

  let loopCount = 0;
  let messages = [...history];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let usedTools = false;

  try {
    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;

      const response = await callAnthropicWithRetry({
        model: omniModel.model,
        max_tokens: 8192,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      totalInputTokens += response.usage?.input_tokens || 0;
      totalOutputTokens += response.usage?.output_tokens || 0;

      const toolBlocks = response.content.filter(c => c.type === 'tool_use');
      if (toolBlocks.length > 0) {
        usedTools = true;
        const toolResults = [];
        for (const toolUse of toolBlocks) {
          log(`[${channel.toUpperCase()} TOOL] ${toolUse.name}: ${JSON.stringify(toolUse.input).slice(0, 200)}`);
          const result = await executeTool(toolUse.name, toolUse.input, 'admin');
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: String(result).slice(0, 4000) });
        }
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });
      } else {
        // Final text response
        let reply = response.content.find(c => c.type === 'text')?.text || '';

        // Hard-strip markdown for SMS/WhatsApp (models sometimes ignore the prompt)
        reply = reply
          .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** -> bold
          .replace(/\*(.+?)\*/g, '$1')        // *italic* -> italic
          .replace(/__(.+?)__/g, '$1')        // __underline__
          .replace(/~~(.+?)~~/g, '$1')        // ~~strikethrough~~
          .replace(/```[\s\S]*?```/g, '')     // code blocks
          .replace(/`(.+?)`/g, '$1')          // inline code
          .replace(/^#{1,6}\s+/gm, '')        // # headings
          .replace(/^[-*]\s+/gm, '- ')        // normalize bullet points
          .replace(/\n{3,}/g, '\n\n')         // collapse excessive newlines
          .trim();

        reply = reply.slice(0, maxChars);

        // Save to shared history (no channel tag on assistant responses)
        history.push({ role: 'assistant', content: reply });
        conversationHistories.set(OWNER_ID, history);
        saveConversationHistory(OWNER_ID, history);

        // Log interaction
        logInteraction({
          direction: 'in', userId: OWNER_ID, username: 'Lee', model: omniModel.name,
          message: `[${channelLabel}] ${message.slice(0, 500)}`,
        });
        logInteraction({
          direction: 'out', userId: OWNER_ID, username: 'Lee', model: omniModel.name,
          model_reason: omniModel.reason,
          message: `[${channelLabel}] ${reply.slice(0, 500)}`,
          input_tokens: totalInputTokens, output_tokens: totalOutputTokens,
          cost_gbp: estimateCost(omniModel.model, totalInputTokens, totalOutputTokens),
        });

        // Log cost
        const modelKey = omniModel.model.includes('opus') ? 'claude-opus-4' : 'claude-sonnet-4';
        costTracker.logCall(modelKey, {
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          script: 'telegram-bot',
        });

        // --- Semantic Cache Store (only for non-tool responses) ---
        if (!usedTools) {
          try {
            await semanticCache.store(message, reply, {
              userId: OWNER_ID,
              model: currentModelName,
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              usedTools: false,
            });
          } catch (cacheStoreErr) {
            log(`[${channelLabel} CACHE] Store error (non-blocking): ${cacheStoreErr.message}`);
          }
        }

        return reply;
      }
    }
    return 'Tool loop limit reached. Please try again.';
  } catch (err) {
    log(`[${channel.toUpperCase()} ERROR] processInboundMessage: ${err.message}`);
    return `Error: ${err.message}`;
  }
}

// --- Loop Prevention ---
const OWN_NUMBERS = new Set(['+447446994961', 'whatsapp:+447446994961', 'whatsapp:+14155238886', '+14155238886']);
const recentMessageIds = new Map(); // SID -> timestamp, prevents duplicate processing
const DEDUP_WINDOW = 60000; // 60 seconds

function isDuplicate(sid) {
  if (!sid) return false;
  const now = Date.now();
  // Clean old entries
  for (const [k, v] of recentMessageIds) {
    if (now - v > DEDUP_WINDOW) recentMessageIds.delete(k);
  }
  if (recentMessageIds.has(sid)) return true;
  recentMessageIds.set(sid, now);
  return false;
}

function isOwnMessage(from, body) {
  // Ignore messages from our own numbers (outbound echo)
  if (OWN_NUMBERS.has(from)) return true;
  // Ignore messages containing our signature (loop from our own replies)
  if (body && body.includes('Chief of Staff') && body.includes('NAVADA')) return true;
  return false;
}

// Twilio webhook signature validation
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WEBHOOK_URL = 'https://api.navada-edge-server.uk';

function validateTwilioSignature(req, body, url) {
  if (!TWILIO_AUTH_TOKEN) { log('[SECURITY] TWILIO_AUTH_TOKEN not set — rejecting webhook'); return false; }
  const signature = req.headers['x-twilio-signature'];
  if (!signature) {
    log('[WEBHOOK] Missing X-Twilio-Signature header — request rejected');
    return false;
  }
  try {
    const params = Object.fromEntries(new URLSearchParams(body));
    const valid = twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params);
    if (!valid) {
      log(`[WEBHOOK] Invalid Twilio signature — request rejected`);
    }
    return valid;
  } catch (err) {
    log(`[WEBHOOK] Signature validation error: ${err.message}`);
    return false;
  }
}

const webhookServer = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/twilio/sms') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        // Validate Twilio webhook signature
        if (!validateTwilioSignature(req, body, `${TWILIO_WEBHOOK_URL}/twilio/sms`)) {
          logInteraction({ direction: 'system', event: 'webhook_rejected', endpoint: '/twilio/sms', reason: 'invalid_signature' });
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          return res.end('Forbidden');
        }

        const params = new URLSearchParams(body);
        const from = params.get('From') || 'unknown';
        const smsBody = params.get('Body') || '';
        const to = params.get('To') || '';
        const msgSid = params.get('MessageSid') || '';
        log(`[SMS IN] From: ${from} | Body: ${smsBody}`);

        // Loop prevention: ignore our own outbound messages and duplicates
        if (isOwnMessage(from, smsBody) || isDuplicate(msgSid)) {
          log(`[SMS SKIP] Loop/duplicate detected from ${from}`);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          return res.end('<Response></Response>');
        }

        // If it's from Lee's number, process with Claude and reply on SMS (same channel)
        if (from === '+447935237704' && smsBody.trim()) {
          const reply = await processInboundMessage(smsBody, 'sms');
          if (reply && twilioClient) {
            await twilioClient.messages.create({
              body: reply + SMS_SIGNATURE,
              from: TWILIO_FROM,
              to: from,
            });
            log(`[SMS OUT] Reply to ${from}: ${reply}`);
          }
        } else if (from !== '+447935237704') {
          // Only forward to Telegram if it's from an unknown number
          await bot.telegram.sendMessage(OWNER_ID,
            `SMS from ${from}:\n\n${smsBody}`
          );
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
        // Validate Twilio webhook signature
        if (!validateTwilioSignature(req, body, `${TWILIO_WEBHOOK_URL}/twilio/whatsapp`)) {
          logInteraction({ direction: 'system', event: 'webhook_rejected', endpoint: '/twilio/whatsapp', reason: 'invalid_signature' });
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          return res.end('Forbidden');
        }

        const params = new URLSearchParams(body);
        const rawFrom = params.get('From') || '';
        const from = rawFrom.replace('whatsapp:', '');
        const waBody = params.get('Body') || '';
        const to = params.get('To') || '';
        const msgSid = params.get('MessageSid') || '';
        log(`[WHATSAPP IN] From: ${from} | Body: ${waBody}`);

        // Loop prevention: ignore our own outbound messages and duplicates
        if (isOwnMessage(rawFrom, waBody) || isOwnMessage(from, waBody) || isDuplicate(msgSid)) {
          log(`[WHATSAPP SKIP] Loop/duplicate detected from ${from}`);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          return res.end('<Response></Response>');
        }

        // If it's from Lee's number, process with Claude and reply on WhatsApp (same channel)
        if (from === '+447935237704' && waBody.trim()) {
          const reply = await processInboundMessage(waBody, 'whatsapp');
          if (reply && twilioClient) {
            await twilioClient.messages.create({
              body: reply,
              from: 'whatsapp:+14155238886',
              to: `whatsapp:${from}`,
              statusCallback: 'https://api.navada-edge-server.uk/twilio/status',
            });
            log(`[WHATSAPP OUT] Reply to ${from}: ${reply}`);
          }
        } else if (from !== '+447935237704') {
          // Only forward to Telegram if it's from an unknown number
          await bot.telegram.sendMessage(OWNER_ID,
            `WhatsApp from ${from}:\n\n${waBody}`
          );
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
  } else if (req.method === 'GET' && (req.url === '/health' || req.url === '/telegram/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'navada-telegram-bot', mode: process.env.TELEGRAM_WEBHOOK_MODE === '1' ? 'webhook' : 'polling', uptime: process.uptime() }));
  } else if (req.method === 'POST' && req.url === `/telegram/webhook/${BOT_TOKEN}`) {
    // Telegram webhook endpoint — receives updates from Telegram via Cloudflare Tunnel
    // CRITICAL: respond 200 IMMEDIATELY, then process async.
    // Telegram retries if no 200 within ~60s, causing duplicate messages.
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200);
      res.end('ok');
      try {
        const update = JSON.parse(body);
        // Dedup handled by Telegraf middleware (bot.use at line ~377)
        // Do NOT dedup here — it would add the ID before bot.handleUpdate,
        // causing the middleware to see it as a duplicate and drop every message.
        bot.handleUpdate(update).catch(e => {
          console.error(`[NAVADA] Telegram webhook processing error: ${e.message}`);
        });
      } catch (e) {
        console.error(`[NAVADA] Telegram webhook parse error: ${e.message}`);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Listen with retry for port conflicts during PM2 restarts
let webhookBound = false;
webhookServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && !webhookBound) {
    console.log(`[NAVADA] Port ${WEBHOOK_PORT} busy, will retry in 5s...`);
    setTimeout(() => { if (!webhookBound) webhookServer.listen(WEBHOOK_PORT, '0.0.0.0'); }, 5000);
  } else if (!webhookBound) {
    console.error(`[NAVADA] Webhook server error: ${err.message}`);
  }
});
webhookServer.listen(WEBHOOK_PORT, '0.0.0.0', () => {
  webhookBound = true;
  console.log(`[NAVADA] Twilio webhook listening on port ${WEBHOOK_PORT}`);
});

// --- Launch ---
console.log('[NAVADA] Claude Chief of Staff starting...');
console.log(`[NAVADA] Model: ${currentModelName} (${currentModel})`);
console.log(`[NAVADA] Multi-user: enabled | Owner: ${OWNER_ID}`);

registerCommands();

// Launch Telegram bot — webhook mode (via Cloudflare Tunnel) or polling fallback
async function launchBot() {
  const useWebhook = process.env.TELEGRAM_WEBHOOK_MODE === '1';
  const webhookDomain = process.env.TELEGRAM_WEBHOOK_DOMAIN || 'api.navada-edge-server.uk';

  if (useWebhook) {
    // Webhook mode: Telegram sends updates to our HTTP server via Cloudflare Tunnel
    const webhookUrl = `https://${webhookDomain}/telegram/webhook/${BOT_TOKEN}`;
    try {
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`[NAVADA] Webhook set: ${webhookDomain}/telegram/webhook/***`);
      console.log('[NAVADA] Online. Claude Chief of Staff ready (webhook mode).');
    } catch (err) {
      console.error(`[NAVADA] Webhook setup failed: ${err.message}, falling back to polling`);
      await launchPolling();
    }
  } else {
    await launchPolling();
  }
}

async function launchPolling() {
  try {
    // Clear any stale polling sessions from zombie processes
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('[NAVADA] Cleared stale Telegram sessions');
    await new Promise(r => setTimeout(r, 2000));
    await bot.launch({ dropPendingUpdates: true });
    console.log('[NAVADA] Online. Claude Chief of Staff ready (polling mode).');
  } catch (err) {
    console.error(`[NAVADA] Telegram launch error: ${err.message}`);
    if (err.message.includes('409')) {
      console.log('[NAVADA] Waiting 30s for stale polling to clear...');
      await new Promise(r => setTimeout(r, 30000));
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await bot.launch({ dropPendingUpdates: true });
        console.log('[NAVADA] Online. Claude Chief of Staff ready (polling retry).');
      } catch (err2) {
        console.error(`[NAVADA] Telegram retry failed: ${err2.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}
launchBot();

// --- Hourly cache eviction ---
setInterval(() => {
  try {
    const evicted = responseCache.evict();
    if (evicted > 0) console.log(`[CACHE] Evicted ${evicted} expired entries`);
  } catch {}
}, 60 * 60 * 1000);

// --- Graceful shutdown ---
process.once('SIGINT', () => { webhookServer.close(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { webhookServer.close(); bot.stop('SIGTERM'); });

// --- Bug 5: Uncaught exception handlers (prevent silent crashes) ---
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message, err.stack);
  try {
    const logLine = JSON.stringify({ ts: new Date().toISOString(), event: 'uncaughtException', error: err.message, stack: err.stack?.slice(0, 500) });
    fs.appendFileSync(path.join(LOG_DIR, 'telegram-crashes.log'), logLine + '\n');
  } catch {}
  // Let PM2 restart us
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[WARN] Unhandled rejection:', msg);
  try {
    const logLine = JSON.stringify({ ts: new Date().toISOString(), event: 'unhandledRejection', error: msg });
    fs.appendFileSync(path.join(LOG_DIR, 'telegram-crashes.log'), logLine + '\n');
  } catch {}
});
