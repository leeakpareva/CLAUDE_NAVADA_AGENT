#!/usr/bin/env node
/**
 * NAVADA Failover State Sync
 * Runs on HP laptop, syncs critical state to Oracle VM every 5 minutes.
 * Uses scp (Windows compatible, no rsync needed).
 *
 * PM2 managed: failover-sync
 */

const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  oracleHost: 'oracle-navada', // SSH config alias (Tailscale 100.77.206.9)
  remotePath: '/home/ubuntu/navada-failover',
  syncInterval: 5 * 60 * 1000, // 5 minutes
  automationDir: path.resolve(__dirname),
  tradingDir: path.resolve(__dirname, '..', 'NAVADA-Trading'),
  logFile: path.join(__dirname, 'logs', 'failover-sync.log'),
};

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(CONFIG.logFile, line + '\n');
  } catch (e) { /* ignore */ }
}

function scpFile(src, dest) {
  return new Promise((resolve, reject) => {
    const args = ['-o', 'ConnectTimeout=10', src, `${CONFIG.oracleHost}:${dest}`];
    execFile('scp', args, { timeout: 30000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`scp failed: ${stderr || error.message}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function syncState() {
  const startTime = Date.now();
  log('Starting sync...');

  try {
    // 1. Sync kb/ directory (Telegram memory, inbox state, user registry)
    const kbDir = path.join(CONFIG.automationDir, 'kb');
    const kbFiles = fs.readdirSync(kbDir).filter(f => !f.endsWith('.tmp'));
    for (const file of kbFiles) {
      await scpFile(
        path.join(kbDir, file),
        `${CONFIG.remotePath}/Automation/kb/${file}`
      );
    }
    log(`  Synced kb/ (${kbFiles.length} files)`);

    // 2. Sync .env
    await scpFile(
      path.join(CONFIG.automationDir, '.env'),
      `${CONFIG.remotePath}/Automation/.env`
    );
    log('  Synced .env');

    // 3. Sync critical scripts (in case of updates)
    const criticalScripts = [
      'telegram-bot.js',
      'inbox-auto-responder.js',
      'email-service.js',
      'ses-email.js',
      'semantic-cache.js',
      'cloudflare-flux.js',
      'cloudflare-r2.js',
      'chroma-rag.js',
      'navada-inbox-collector.js',
    ];
    for (const script of criticalScripts) {
      const src = path.join(CONFIG.automationDir, script);
      if (fs.existsSync(src)) {
        await scpFile(src, `${CONFIG.remotePath}/Automation/${script}`);
      }
    }
    log('  Synced critical scripts');

    // 4. Sync trading .env
    const tradingEnv = path.join(CONFIG.tradingDir, '.env');
    if (fs.existsSync(tradingEnv)) {
      await scpFile(tradingEnv, `${CONFIG.remotePath}/NAVADA-Trading/.env`);
      log('  Synced trading .env');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Sync complete in ${elapsed}s`);
  } catch (err) {
    log(`Sync error: ${err.message}`);
  }
}

// Initial sync, then every 5 minutes
log('NAVADA Failover Sync starting...');
log(`Target: ${CONFIG.oracleHost}:${CONFIG.remotePath}`);
log(`Interval: ${CONFIG.syncInterval / 1000}s`);
syncState();
setInterval(syncState, CONFIG.syncInterval);
