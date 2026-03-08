#!/usr/bin/env node
/**
 * NAVADA Node Check-In Script
 *
 * Runs on any NAVADA node at startup (or on-demand).
 * 1. Collects system info (CPU, RAM, disk, IPs, uptime)
 * 2. Writes heartbeat to PostgreSQL (navada_pipeline.node_heartbeats) on HP
 * 3. Sends Telegram notification to Lee via Chief of Staff bot
 *
 * Usage:
 *   node node-checkin.js                    # Auto-detect node name from hostname
 *   node node-checkin.js --name NAVADA2025  # Explicit node name
 *   node node-checkin.js --claude           # Flag that Claude Code is active
 *
 * Environment (set in .env or pass directly):
 *   NAVADA_HP_PG_HOST    - HP PostgreSQL host (default: 100.121.187.67 via Tailscale)
 *   NAVADA_HP_PG_PORT    - HP PostgreSQL port (default: 5433)
 *   NAVADA_HP_PG_PASS    - HP PostgreSQL password
 *   TELEGRAM_BOT_TOKEN   - Telegram bot token (for direct notification)
 *   TELEGRAM_OWNER_ID    - Lee's Telegram chat ID
 */

const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

// --- Config ---
// Use localhost if running on HP, Tailscale IP if remote
const isHP = os.hostname().toLowerCase() === 'navada';
const PG_HOST = process.env.NAVADA_HP_PG_HOST || (isHP ? '127.0.0.1' : '100.121.187.67');
const PG_PORT = process.env.NAVADA_HP_PG_PORT || '5433';
const PG_DB = 'navada_pipeline';
const PG_USER = 'postgres';
const PG_PASS = process.env.NAVADA_HP_PG_PASS || 'Navadaonline2026!';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8594117952:AAF-VciUPKcUF6DUDVrB8vAK35tluMIZ6i8';
const OWNER_ID = process.env.TELEGRAM_OWNER_ID || '6920669447';

// --- Parse args ---
const args = process.argv.slice(2);
const nameFlag = args.indexOf('--name');
const nodeName = nameFlag !== -1 ? args[nameFlag + 1] : os.hostname().toUpperCase();
const claudeActive = args.includes('--claude');

// --- System info ---
function getSystemInfo() {
  const cpus = os.cpus();
  const totalMem = os.totalmem() / (1024 ** 3);
  const freeMem = os.freemem() / (1024 ** 3);
  const usedMem = totalMem - freeMem;
  const uptimeHours = os.uptime() / 3600;

  // CPU usage (1-second sample)
  let cpuPercent = 0;
  try {
    const cpuInfo = cpus.map(c => {
      const total = Object.values(c.times).reduce((a, b) => a + b, 0);
      return { idle: c.times.idle, total };
    });
    cpuPercent = Math.round((1 - cpuInfo.reduce((a, c) => a + c.idle / c.total, 0) / cpuInfo.length) * 100);
  } catch { cpuPercent = 0; }

  // Disk free
  let diskFreeGb = 0;
  try {
    if (process.platform === 'win32') {
      const out = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace /value', { encoding: 'utf-8' });
      const match = out.match(/FreeSpace=(\d+)/);
      if (match) diskFreeGb = parseFloat(match[1]) / (1024 ** 3);
    } else {
      const out = execSync("df -BG / | tail -1 | awk '{print $4}'", { encoding: 'utf-8' });
      diskFreeGb = parseFloat(out);
    }
  } catch { /* skip */ }

  // IPs
  let tailscaleIp = '';
  let lanIp = '';
  try {
    const tsOut = execSync('tailscale ip -4', { encoding: 'utf-8' }).trim();
    tailscaleIp = tsOut.split('\n')[0].trim();
  } catch { /* skip */ }

  const nets = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(nets)) {
    for (const a of addrs) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('100.') && !a.address.startsWith('169.254')) {
        lanIp = a.address;
        break;
      }
    }
    if (lanIp) break;
  }

  return {
    hostname: os.hostname(),
    osInfo: `${os.type()} ${os.release()} ${os.arch()}`,
    cpuPercent,
    ramTotalGb: Math.round(totalMem * 10) / 10,
    ramUsedGb: Math.round(usedMem * 10) / 10,
    ramPercent: Math.round((usedMem / totalMem) * 100),
    diskFreeGb: Math.round(diskFreeGb),
    uptimeHours: Math.round(uptimeHours * 10) / 10,
    tailscaleIp,
    lanIp,
    cpuModel: cpus[0]?.model || 'unknown',
    cores: cpus.length,
  };
}

// --- PostgreSQL insert (raw TCP/pg protocol via pg module) ---
async function writeHeartbeat(info) {
  let pg;
  try {
    pg = require('pg');
  } catch {
    console.log('[heartbeat] pg module not installed, skipping DB write. Run: npm install pg');
    return false;
  }

  const client = new pg.Client({
    host: PG_HOST, port: PG_PORT, database: PG_DB, user: PG_USER, password: PG_PASS,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    await client.query(`
      INSERT INTO node_heartbeats (node_name, tailscale_ip, lan_ip, hostname, os_info, cpu_percent, ram_total_gb, ram_used_gb, ram_percent, disk_free_gb, uptime_hours, claude_code_active, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'online', $13)
    `, [
      nodeName, info.tailscaleIp, info.lanIp, info.hostname, info.osInfo,
      info.cpuPercent, info.ramTotalGb, info.ramUsedGb, info.ramPercent,
      info.diskFreeGb, info.uptimeHours, claudeActive,
      JSON.stringify({ cpuModel: info.cpuModel, cores: info.cores }),
    ]);
    console.log('[heartbeat] Written to PostgreSQL');
    return true;
  } catch (err) {
    console.error('[heartbeat] DB error:', err.message);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

// --- Telegram notification ---
function sendTelegram(info) {
  const lines = [
    `<b>Node Online: ${nodeName}</b>`,
    ``,
    `Hostname: <code>${info.hostname}</code>`,
    `Tailscale: <code>${info.tailscaleIp}</code>`,
    `LAN: <code>${info.lanIp}</code>`,
    `OS: ${info.osInfo}`,
    `CPU: ${info.cpuPercent}% (${info.cores}x ${info.cpuModel.split(' ').slice(0, 4).join(' ')})`,
    `RAM: ${info.ramUsedGb}/${info.ramTotalGb} GB (${info.ramPercent}%)`,
    `Disk Free: ${info.diskFreeGb} GB`,
    `Uptime: ${info.uptimeHours}h`,
    claudeActive ? `Claude Code: ACTIVE` : '',
  ].filter(Boolean).join('\n');

  const payload = JSON.stringify({
    chat_id: OWNER_ID,
    text: lines,
    parse_mode: 'HTML',
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('[heartbeat] Telegram notification sent');
        } else {
          console.error('[heartbeat] Telegram error:', res.statusCode, body);
        }
        resolve();
      });
    });
    req.on('error', (err) => { console.error('[heartbeat] Telegram error:', err.message); resolve(); });
    req.write(payload);
    req.end();
  });
}

// --- Main ---
async function main() {
  console.log(`[heartbeat] Node check-in: ${nodeName}`);
  const info = getSystemInfo();
  console.log(`[heartbeat] CPU: ${info.cpuPercent}% | RAM: ${info.ramPercent}% | Disk: ${info.diskFreeGb}GB free | Tailscale: ${info.tailscaleIp}`);

  // DB write locally on HP, or via Tailscale if PG is open. Skip gracefully if unreachable.
  const [dbOk] = await Promise.all([
    writeHeartbeat(info),
    sendTelegram(info),
  ]);
  if (!dbOk && !isHP) {
    console.log('[heartbeat] Remote node — DB write skipped (PG not reachable). Telegram notification is the primary record.');
  }

  console.log('[heartbeat] Done');
}

main().catch(err => {
  console.error('[heartbeat] Fatal:', err.message);
  process.exit(1);
});
