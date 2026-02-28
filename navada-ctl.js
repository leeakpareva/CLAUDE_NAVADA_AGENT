#!/usr/bin/env node
/**
 * navada-ctl — NAVADA Service Management CLI
 *
 * Unified control tool for all NAVADA server services.
 * Wraps PM2 with project-specific commands.
 *
 * Usage:
 *   node navada-ctl.js <command> [service]
 *
 * Commands:
 *   start [name]   — Start all services (or one by name)
 *   stop [name]    — Stop all services (or one by name)
 *   restart [name] — Restart all services (or one by name)
 *   status         — Show all service statuses + port checks
 *   health         — HTTP health check all endpoints
 *   logs [name]    — Tail logs for a service (default: all)
 *   rebuild        — Build WorldMonitor (tsc + vite) then restart
 *   deploy         — Full deploy: git pull, npm install, rebuild, restart
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname);
const ECOSYSTEM = path.join(ROOT, 'ecosystem.config.js');
const WM_REPO = path.join(ROOT, 'navada-osint', 'worldmonitor-repo');

const ENDPOINTS = [
  { name: 'worldmonitor',     url: 'http://localhost:4173/',                  expect: [200] },
  { name: 'worldmonitor-api', url: 'http://localhost:46123/',                 expect: [200, 404] },
  { name: 'trading-api',      url: 'http://localhost:5678/api/trading/status', expect: [200] },
];

// --- Helpers ---

function run(cmd, opts = {}) {
  console.log(`  > ${cmd}`);
  return execSync(cmd, { encoding: 'utf-8', stdio: 'inherit', timeout: 120000, ...opts });
}

function runQuiet(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', timeout: 30000, ...opts }).trim();
}

function httpCheck(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
  });
}

// --- Commands ---

const commands = {
  start(service) {
    if (service) {
      run(`pm2 start "${ECOSYSTEM}" --only ${service}`);
    } else {
      run(`pm2 start "${ECOSYSTEM}"`);
    }
    run('pm2 save');
    console.log('\nAll services started and saved.');
  },

  stop(service) {
    if (service) {
      run(`pm2 stop ${service}`);
    } else {
      run('pm2 stop all');
    }
    console.log('\nServices stopped.');
  },

  restart(service) {
    if (service) {
      run(`pm2 restart ${service}`);
    } else {
      run('pm2 restart all');
    }
    run('pm2 save');
    console.log('\nServices restarted and saved.');
  },

  status() {
    run('pm2 list');
  },

  async health() {
    console.log('Running HTTP health checks...\n');
    let allOk = true;
    for (const ep of ENDPOINTS) {
      const code = await httpCheck(ep.url);
      const ok = ep.expect.includes(code);
      const icon = ok ? 'OK' : 'FAIL';
      console.log(`  [${icon}] ${ep.name.padEnd(20)} ${ep.url} -> HTTP ${code || 'timeout'}`);
      if (!ok) allOk = false;
    }
    console.log(allOk ? '\nAll endpoints healthy.' : '\nSome endpoints failed.');
    process.exit(allOk ? 0 : 1);
  },

  logs(service) {
    const name = service || 'all';
    const child = spawn('pm2', ['logs', name, '--lines', '50'], { stdio: 'inherit', shell: true });
    child.on('exit', (code) => process.exit(code || 0));
  },

  rebuild() {
    console.log('Building WorldMonitor...\n');
    run('npx tsc --noEmit', { cwd: WM_REPO });
    run('npx vite build', { cwd: WM_REPO });
    run('pm2 restart worldmonitor');
    run('pm2 save');
    console.log('\nRebuild complete. WorldMonitor restarted.');
  },

  deploy() {
    console.log('Full deployment starting...\n');

    // 1. Git pull WorldMonitor
    console.log('--- Step 1: Git Pull ---');
    run('git pull navada main', { cwd: WM_REPO });

    // 2. Install deps if package.json changed
    console.log('\n--- Step 2: npm install ---');
    run('npm install', { cwd: WM_REPO });

    // 3. Rebuild
    console.log('\n--- Step 3: Build ---');
    run('npx tsc --noEmit', { cwd: WM_REPO });
    run('npx vite build', { cwd: WM_REPO });

    // 4. Restart
    console.log('\n--- Step 4: Restart ---');
    run('pm2 restart worldmonitor worldmonitor-api');
    run('pm2 save');

    console.log('\nDeploy complete.');
  },
};

// --- Main ---

const [,, cmd, service] = process.argv;

if (!cmd || !commands[cmd]) {
  console.log(`
navada-ctl — NAVADA Service Management

Usage: node navada-ctl.js <command> [service]

Commands:
  start [name]   Start all services (or one by name)
  stop [name]    Stop all services (or one by name)
  restart [name] Restart one or all services
  status         Show PM2 process list
  health         HTTP health check all endpoints
  logs [name]    Tail logs (default: all)
  rebuild        Build WorldMonitor + restart
  deploy         Git pull + npm install + rebuild + restart

Services: worldmonitor, worldmonitor-api, trading-api, inbox-responder, auto-deploy
`);
  process.exit(cmd ? 1 : 0);
}

const result = commands[cmd](service);
if (result instanceof Promise) result.catch(console.error);
