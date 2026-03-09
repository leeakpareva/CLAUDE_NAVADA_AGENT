#!/usr/bin/env node
/**
 * Ralph — NAVADA Standby Telegram Bot (EC2)
 * Lightweight polling-mode bot that activates when HP's primary bot is down.
 * Started automatically by HP health monitor after 15 min of Telegram outage.
 * Stops itself when HP bot recovers (HP health monitor kills this process).
 *
 * Features:
 * - Polling mode (no webhook needed, no Nginx/Cloudflare dependency)
 * - Notifies Lee that failover is active
 * - Responds to basic commands: /status, /help
 * - Forwards all other messages with "HP is down" notice
 * - Auto-exits after 2 hours if not stopped (safety)
 */

const https = require('https');
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch {}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.TELEGRAM_OWNER_ID;

if (!BOT_TOKEN || !OWNER_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_ID');
  process.exit(1);
}

const MAX_RUNTIME_MS = 2 * 60 * 60 * 1000; // 2 hours auto-shutdown
const POLL_INTERVAL = 3000; // 3 seconds
let offset = 0;
let running = true;
const startTime = Date.now();

function log(msg) { console.log(`[${new Date().toISOString()}] [Ralph] ${msg}`); }

function apiCall(method, body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 10000,
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch { resolve({ ok: false }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function sendMessage(chatId, text) {
  try {
    await apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  } catch (e) {
    log(`Send failed: ${e.message}`);
  }
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const userId = String(msg.from?.id || chatId);

  // Only respond to owner
  if (userId !== OWNER_ID && String(chatId) !== OWNER_ID) {
    return;
  }

  const uptime = Math.round((Date.now() - startTime) / 60000);

  if (text === '/status' || text === '/start') {
    await sendMessage(chatId,
      `<b>Ralph (Standby Bot) Active</b>\n\n` +
      `HP primary bot is <b>DOWN</b>. Ralph is handling messages.\n\n` +
      `Uptime: ${uptime} min\n` +
      `Node: EC2 (3.11.119.181)\n` +
      `Mode: Polling (no webhook)\n\n` +
      `Available: /status, /help\n` +
      `HP health monitor will auto-recover when HP bot comes back online.`
    );
  } else if (text === '/help') {
    await sendMessage(chatId,
      `<b>Ralph — Emergency Standby Bot</b>\n\n` +
      `I'm a lightweight failover bot running on EC2.\n` +
      `HP's primary Claude bot is currently unreachable.\n\n` +
      `Commands:\n` +
      `/status — Show failover status\n` +
      `/help — This message\n\n` +
      `I'll be automatically stopped when HP recovers.`
    );
  } else {
    await sendMessage(chatId,
      `HP primary bot is currently <b>DOWN</b>. Ralph (standby) is active.\n\n` +
      `I can't process complex requests — only /status and /help.\n` +
      `HP health monitor is working to restore the primary bot.\n\n` +
      `Failover active for: ${uptime} min`
    );
  }
}

async function poll() {
  while (running) {
    // Auto-shutdown safety
    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      log('Max runtime reached (2h). Shutting down.');
      await sendMessage(OWNER_ID, 'Ralph auto-shutdown after 2 hours. HP may still be down — check manually.');
      process.exit(0);
    }

    try {
      const result = await apiCall('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message'],
      });

      if (result.ok && result.result?.length > 0) {
        for (const update of result.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (e) {
      log(`Poll error: ${e.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

// Delete any webhook first (polling won't work with active webhook)
async function start() {
  log('Starting Ralph (standby bot)...');

  // Remove webhook so polling works
  try {
    const wh = await apiCall('deleteWebhook', { drop_pending_updates: false });
    log(`Webhook removed: ${wh.ok}`);
  } catch (e) {
    log(`Webhook removal failed: ${e.message}`);
  }

  // Notify owner
  await sendMessage(OWNER_ID,
    `<b>FAILOVER ACTIVE</b>\n\n` +
    `HP primary bot is DOWN. Ralph (EC2 standby) has taken over.\n\n` +
    `I'm a lightweight emergency bot. Limited commands available.\n` +
    `HP health monitor will restore the primary bot automatically.`
  );

  log('Ralph is online. Polling for messages...');
  await poll();
}

process.on('SIGINT', () => { running = false; });
process.on('SIGTERM', () => { running = false; });

start().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
