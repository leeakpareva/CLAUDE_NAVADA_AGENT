#!/usr/bin/env node
/**
 * NAVADA HP Health Monitor — Primary Alerter
 * HP is the single source of truth for ALL push notifications.
 * Monitors: HP services, EC2 services, Oracle services, Cloudflare, Lambda.
 * EC2 health monitor is standby-only (activates if HP is unreachable).
 *
 * Runs on HP via PM2 every 5 minutes.
 */

try { require('dotenv').config({ path: __dirname + '/.env' }); } catch {}

const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const execAsync = promisify(exec);

const BASH = 'C:/Program Files/Git/bin/bash.exe';

// Audit log
const AUDIT_LOG = path.join(__dirname, 'logs', 'hp-health-monitor-audit.jsonl');
try { fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true }); } catch {}
function auditLog(entry) {
  try { fs.appendFileSync(AUDIT_LOG, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n'); } catch {}
}

const CONFIG = {
  checkInterval: 5 * 60 * 1000,
  alertCooldownFirst: 5 * 60 * 1000,
  alertCooldownRepeat: 30 * 60 * 1000,
  httpTimeout: 10000,
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    ownerId: process.env.TELEGRAM_OWNER_ID,
  },
};

// ============================================================
// ALL monitored endpoints — HP is primary for EVERYTHING
// ============================================================
const ENDPOINTS = [
  // --- HP (localhost) ---
  { name: 'Telegram Bot',       group: 'HP',    type: 'http', url: 'http://127.0.0.1:3456/health' },
  { name: 'Telegram API',       group: 'HP',    type: 'telegram_api' },
  { name: 'NAVADA Flix',        group: 'HP',    type: 'port', port: 4000, host: '127.0.0.1' },
  { name: 'PostgreSQL',         group: 'HP',    type: 'port', port: 5433, host: '127.0.0.1' },

  // --- EC2 (via Tailscale) ---
  { name: 'EC2 Ping',           group: 'EC2',   type: 'port', port: 22, host: '100.98.118.33', critical: true },
  { name: 'EC2 Health Monitor', group: 'EC2',   type: 'http', url: 'http://100.98.118.33:9090' },
  { name: 'WorldMonitor',       group: 'EC2',   type: 'http', url: 'http://100.98.118.33:4000' },

  // --- Oracle (via Tailscale) ---
  { name: 'Oracle Ping',        group: 'Oracle', type: 'port', port: 22, host: '100.77.206.9', critical: true },
  { name: 'Nginx (Oracle)',     group: 'Oracle', type: 'http', url: 'http://100.77.206.9:80' },
  { name: 'Grafana',            group: 'Oracle', type: 'http', url: 'http://100.77.206.9:3000' },
  { name: 'Prometheus',         group: 'Oracle', type: 'http', url: 'http://100.77.206.9:9090' },
  { name: 'CloudBeaver',        group: 'Oracle', type: 'http', url: 'http://100.77.206.9:8978' },
  { name: 'Portainer',          group: 'Oracle', type: 'http', url: 'http://100.77.206.9:9000' },

  // --- Cloudflare (public HTTPS) ---
  { name: 'CF API',             group: 'Cloudflare', type: 'http', url: 'https://api.navada-edge-server.uk/health' },
  { name: 'CF Flix',            group: 'Cloudflare', type: 'http', url: 'https://flix.navada-edge-server.uk' },
  { name: 'CF Dashboard',      group: 'Cloudflare', type: 'http', url: 'https://dashboard.navada-edge-server.uk' },
  { name: 'CF Trading',        group: 'Cloudflare', type: 'http', url: 'https://trading.navada-edge-server.uk' },

  // --- AWS Lambda ---
  { name: 'Vision API',        group: 'Lambda', type: 'http', url: 'https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/status' },
];

// ============================================================
// State
// ============================================================
const state = {};
for (const ep of ENDPOINTS) {
  state[ep.name] = { consecutiveFails: 0, lastAlertTime: 0, alertCount: 0, lastStatus: 'unknown' };
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

// ============================================================
// Checks
// ============================================================
function checkPort(port, host) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(5000);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

function httpCheck(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request({
        hostname: parsed.hostname, port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search, method: 'GET',
        timeout: CONFIG.httpTimeout, rejectUnauthorized: false,
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode < 500));
      });
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.on('error', () => resolve(false));
      req.end();
    } catch { resolve(false); }
  });
}

function pingCheck(host) {
  return new Promise((resolve) => {
    exec(`ping -n 1 -w 5000 ${host}`, { timeout: 8000, shell: BASH }, (err) => resolve(!err));
  });
}

function telegramApiCheck() {
  return new Promise((resolve) => {
    const token = CONFIG.telegram.botToken;
    if (!token) return resolve(false);
    const req = https.request({
      hostname: 'api.telegram.org', path: `/bot${token}/getMe`, method: 'GET', timeout: 8000,
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body).ok === true); } catch { resolve(false); } });
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function checkEndpoint(ep) {
  try {
    if (ep.type === 'port') return { ok: await checkPort(ep.port, ep.host || '127.0.0.1') };
    if (ep.type === 'http') return { ok: await httpCheck(ep.url) };
    if (ep.type === 'ping') return { ok: await pingCheck(ep.host) };
    if (ep.type === 'telegram_api') return { ok: await telegramApiCheck() };
    return { ok: false, error: 'Unknown type' };
  } catch (e) {
    return { ok: false, error: e.message?.substring(0, 50) };
  }
}

// ============================================================
// Telegram
// ============================================================
async function sendTelegram(text) {
  const { botToken, ownerId } = CONFIG.telegram;
  if (!botToken || !ownerId) return;
  try {
    const data = JSON.stringify({ chat_id: ownerId, text, parse_mode: 'HTML', disable_web_page_preview: true });
    await new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.telegram.org', path: `/bot${botToken}/sendMessage`,
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
      req.on('error', resolve);
      req.write(data);
      req.end();
    });
    auditLog({ event: 'telegram_alert', status: 'sent' });
  } catch {}
}

// ============================================================
// Alert logic
// ============================================================
function shouldAlert(name) {
  const s = state[name];
  if (s.consecutiveFails < 1) return false;
  const elapsed = Date.now() - s.lastAlertTime;
  if (s.alertCount === 0) return elapsed >= CONFIG.alertCooldownFirst || s.lastAlertTime === 0;
  return elapsed >= CONFIG.alertCooldownRepeat;
}

// ============================================================
// Main check cycle
// ============================================================
async function runChecks() {
  const ts = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z/, ' UTC');
  log('--- Health Check (HP Primary) ---');

  const results = await Promise.all(ENDPOINTS.map(async ep => {
    const result = await checkEndpoint(ep);
    return { ...ep, ...result };
  }));

  const failed = [];
  const passed = [];
  const alertable = [];

  for (const r of results) {
    const s = state[r.name];
    if (r.ok) {
      if (s.consecutiveFails > 0) log(`  [RECOVERED] ${r.name}`);
      s.consecutiveFails = 0; s.alertCount = 0; s.lastStatus = 'ok';
      passed.push(r);
      log(`  [OK] ${r.name}`);
    } else {
      s.consecutiveFails++;
      s.lastStatus = 'fail';
      failed.push({ name: r.name, group: r.group, error: r.error || 'Unreachable', critical: r.critical });
      log(`  [FAIL ${s.consecutiveFails}] ${r.name}: ${r.error || 'Unreachable'}`);
      if (shouldAlert(r.name)) {
        alertable.push({ name: r.name, group: r.group, error: r.error || 'Unreachable' });
        s.lastAlertTime = Date.now();
        s.alertCount++;
      }
    }
  }

  // Group analysis
  const groups = {};
  for (const r of results) {
    if (!groups[r.group]) groups[r.group] = { ok: 0, fail: 0 };
    if (r.ok) groups[r.group].ok++; else groups[r.group].fail++;
  }

  // Failover chain: if Telegram Bot OR API down, notify EC2 to wake Ralph
  const botDown = state['Telegram Bot']?.lastStatus === 'fail' || state['Telegram API']?.lastStatus === 'fail';
  if (botDown) {
    const botFails = Math.max(state['Telegram Bot']?.consecutiveFails || 0, state['Telegram API']?.consecutiveFails || 0);
    log(`  [BOT WATCH] Telegram down for ${botFails}/3 checks`);
    if (botFails >= 3) {
      log('  [FAILOVER] Telegram down 15+ min — signalling EC2 to start Ralph');
      auditLog({ event: 'failover_signal', action: 'wake_ralph', reason: 'Telegram down 15+ min' });
      // SSH to EC2 to start standby bot
      try {
        await execAsync(
          `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i ~/.ssh/aws-navada.pem ubuntu@3.11.119.181 "cd /home/ubuntu/navada-bot && pm2 start ralph-bot.js --name ec2-telegram-bot 2>/dev/null || echo already_running"`,
          { timeout: 30000, shell: BASH, windowsHide: true }
        );
        log('  [FAILOVER] Ralph activated on EC2');
      } catch (e) {
        log(`  [FAILOVER] Failed to wake Ralph: ${e.message?.substring(0, 60)}`);
      }
    }
  } else {
    // Bot recovered — stop Ralph if running and restore webhook
    try {
      const { stdout } = await execAsync(
        `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i ~/.ssh/aws-navada.pem ubuntu@3.11.119.181 "pm2 pid ec2-telegram-bot 2>/dev/null || echo ''"`,
        { timeout: 15000, shell: BASH, windowsHide: true }
      );
      if (stdout.trim() && stdout.trim() !== '0') {
        log('  [FAILBACK] HP bot recovered — stopping Ralph and restoring webhook');
        await execAsync(
          `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i ~/.ssh/aws-navada.pem ubuntu@3.11.119.181 "pm2 delete ec2-telegram-bot 2>/dev/null || true"`,
          { timeout: 15000, shell: BASH, windowsHide: true }
        );
        // Restore webhook (Ralph removes it for polling mode)
        const webhookUrl = 'https://api.navada-edge-server.uk/telegram/webhook';
        const token = CONFIG.telegram.botToken;
        if (token) {
          const setWh = JSON.stringify({ url: webhookUrl });
          await new Promise((resolve) => {
            const req = https.request({
              hostname: 'api.telegram.org', path: `/bot${token}/setWebhook`,
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(setWh) },
            }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
            req.on('error', resolve);
            req.write(setWh);
            req.end();
          });
          log('  [FAILBACK] Webhook restored');
        }
        auditLog({ event: 'failback', action: 'ralph_stopped_webhook_restored' });
      }
    } catch {}
  }

  // Send alerts
  if (alertable.length > 0) {
    let msg = `<b>NAVADA ALERT</b>\n\n`;
    for (const f of alertable) msg += `FAIL: ${f.name} (${f.group}) - ${f.error}\n`;
    msg += `\nOK: ${passed.map(p => p.name).join(', ')}\n`;
    msg += `\nTime: ${ts}\nSource: HP Health Monitor\nNext check: 5 min`;
    await sendTelegram(msg);
  }

  // Audit
  auditLog({
    event: 'health_check',
    passed: passed.map(p => ({ name: p.name, group: p.group })),
    failed: failed.map(f => ({ name: f.name, group: f.group, error: f.error })),
    alerts_sent: alertable.length,
    groups,
    summary: { ok: passed.length, fail: failed.length, total: ENDPOINTS.length },
  });

  log(`  Summary: ${passed.length} OK, ${failed.length} FAILED`);
  if (failed.length === 0) log('  All services healthy.');
}

// ============================================================
// Start
// ============================================================
log('='.repeat(60));
log('NAVADA HP Health Monitor — PRIMARY ALERTER');
log(`Monitoring ${ENDPOINTS.length} endpoints: HP, EC2, Oracle, Cloudflare, Lambda`);
log(`Interval: ${CONFIG.checkInterval / 1000}s | Cooldown: ${CONFIG.alertCooldownFirst / 1000}s first, ${CONFIG.alertCooldownRepeat / 1000}s repeat`);
log('='.repeat(60));

runChecks().catch(e => log(`[FATAL] ${e.message}`));
setInterval(() => runChecks().catch(e => log(`[FATAL] ${e.message}`)), CONFIG.checkInterval);
