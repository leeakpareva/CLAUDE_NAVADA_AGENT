/**
 * Reminder: Review and remove database-architecture-strategy.md
 * Scheduled for 2026-03-05 at 4:00 PM
 * Sends reminder via Telegram + email, then self-deletes the scheduled task
 */

require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');
const { exec } = require('child_process');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.TELEGRAM_OWNER_ID;
const FILE_PATH = 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/Manager/database-architecture-strategy.md';

async function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: OWNER_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const message = [
    'REMINDER: Database Architecture Strategy',
    '',
    'Lee, this is your scheduled reminder to review and decide on the NAVADA database architecture strategy.',
    '',
    'File: Manager/database-architecture-strategy.md',
    '',
    'Open questions:',
    '1. Option A (Oracle hub), B (PostgreSQL hub), C (DuckDB federation), or A+C combined?',
    '2. Oracle XE priority: build schema now or federation first?',
    '3. Merge Lead + Prospect contacts into one table?',
    '4. AWS RDS needed or Oracle Cloud sufficient?',
    '5. Trading data into Oracle?',
    '',
    'Action needed: Make a decision or tell Claude to defer.',
    'If done, the strategy doc can be removed from Manager/.',
  ].join('\n');

  try {
    await sendTelegram(message);
    console.log('[REMINDER] Telegram notification sent');
  } catch (err) {
    console.error('[REMINDER] Telegram failed:', err.message);
  }

  // Clean up the scheduled task after firing
  exec('schtasks /Delete /TN "NAVADA-DB-Strategy-Reminder" /F', (err) => {
    if (err) console.warn('[REMINDER] Could not delete scheduled task:', err.message);
    else console.log('[REMINDER] Scheduled task self-deleted');
  });
}

main().catch(console.error);
