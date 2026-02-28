/**
 * NAVADA Unified PM2 Ecosystem Config
 * Manages all non-Docker services from a single file.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *
 * Services managed here:
 *   1. worldmonitor     — Frontend + proxy (serve-local.mjs :4173)
 *   2. worldmonitor-api — Local API server (local-api-server.mjs :46123)
 *   3. trading-api      — NAVADA Trading FastAPI/Uvicorn (:5678)
 *   4. inbox-responder  — Email auto-reply + improvement approval gate
 *   5. auto-deploy      — Git poll every 2 min + rebuild on change
 *   6. trading-scheduler — Triggers pre-market, execution, report at scheduled times
 */

module.exports = {
  apps: [
    // --- WorldMonitor Frontend + Proxy ---
    {
      name: 'worldmonitor',
      script: 'serve-local.mjs',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/navada-osint/worldmonitor-repo',
      interpreter: 'node',
      env: {
        WM_PORT: '4173',
        LOCAL_API_PORT: '46123',
        TRADING_API_PORT: '5678',
      },
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      watch: false,
    },

    // --- WorldMonitor Local API Server ---
    {
      name: 'worldmonitor-api',
      script: 'start-api.mjs',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/navada-osint/worldmonitor-repo',
      interpreter: 'node',
      interpreter_args: '--env-file=.env.local',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
    },

    // --- NAVADA Trading API (FastAPI / Uvicorn) ---
    {
      name: 'trading-api',
      script: 'C:/Users/leeak/AppData/Local/Programs/Python/Python312/python.exe',
      args: '-m uvicorn src.api:app --host 0.0.0.0 --port 5678',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/NAVADA-Trading',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },

    // --- Inbox Auto-Responder ---
    {
      name: 'inbox-responder',
      script: 'inbox-auto-responder.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },

    // --- WorldMonitor Auto-Deploy (Git Poller) ---
    {
      name: 'auto-deploy',
      script: 'scripts/auto-deploy.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/navada-osint/worldmonitor-repo',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 10000,
    },

    // --- Trading Scheduler (cron-style, triggers Python scripts at set times) ---
    {
      name: 'trading-scheduler',
      script: 'scripts/scheduler.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/NAVADA-Trading',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
