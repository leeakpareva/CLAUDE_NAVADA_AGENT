#!/usr/bin/env node
/**
 * NAVADA Trading Scheduler
 * Runs as a PM2 process. Triggers trading scripts at the right times.
 *
 * Schedule (UK time, weekdays only):
 *   14:15 — Pre-market plan (signal analysis + email)
 *   15:45 — Trading execution (buy/sell orders)
 *   21:15 — Daily report (P&L summary email)
 */

const { execSync } = require('child_process');
const path = require('path');

const TRADING_DIR = path.resolve(__dirname, '..');
const PY = 'py';

const SCHEDULE = [
  { hour: 14, minute: 15, script: 'scripts/run_premarket.py', label: 'Pre-Market Plan' },
  { hour: 15, minute: 45, script: 'scripts/run_trading.py',   label: 'Trading Execution' },
  { hour: 21, minute: 15, script: 'scripts/run_report.py',    label: 'Daily Report' },
];

// Track which tasks we already ran today (prevent double-fire)
const ranToday = new Set();

function log(msg) {
  console.log(`[Scheduler ${new Date().toLocaleTimeString('en-GB')}] ${msg}`);
}

function isWeekday() {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

function todayKey(task) {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${task.label}`;
}

function checkAndRun() {
  if (!isWeekday()) return;

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  for (const task of SCHEDULE) {
    if (hour === task.hour && minute === task.minute) {
      const key = todayKey(task);
      if (ranToday.has(key)) continue;
      ranToday.add(key);

      log(`Running: ${task.label} (${task.script})`);
      try {
        execSync(`${PY} ${task.script}`, {
          cwd: TRADING_DIR,
          encoding: 'utf-8',
          timeout: 900000, // 15 min timeout
          stdio: 'inherit',
        });
        log(`Completed: ${task.label}`);
      } catch (err) {
        log(`ERROR in ${task.label}: ${err.message}`);
      }
    }
  }
}

// Clear the ran-today set at midnight
function resetDaily() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    ranToday.clear();
    log('Daily reset: cleared execution history');
  }
}

// Start
log('NAVADA Trading Scheduler started');
log('Schedule (UK time, weekdays):');
for (const t of SCHEDULE) {
  log(`  ${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')} — ${t.label}`);
}

// Check every 30 seconds
setInterval(() => {
  checkAndRun();
  resetDaily();
}, 30000);

// Also check immediately
checkAndRun();
