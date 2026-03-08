/**
 * NAVADA HP PM2 Ecosystem Config (Post-Migration v3)
 * HP only runs: telegram-bot + network-scanner
 * All other services migrated to Oracle VM.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
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
      windowsHide: true,
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
      windowsHide: true,
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
      windowsHide: true,
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
      windowsHide: true,
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
      windowsHide: true,
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
      windowsHide: true,
    },

    // --- NAVADA Edge Telegram Bot (Claude Chief of Staff) ---
    {
      name: 'telegram-bot',
      script: 'telegram-bot.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      restart_delay: 5000,
      watch: false,
      windowsHide: true,
    },

    // --- Network Scanner & Router Dashboard ---
    {
      name: 'network-scanner',
      script: 'network-scanner.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      windowsHide: true,
    },

    // --- Voice Command System (S8 Bluetooth) ---
    {
      name: 'voice-command',
      script: 'voice-command.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      windowsHide: true,
    },

    // --- CloudWatch ASUS Reporter (pushes system metrics to AWS) ---
    {
      name: 'cloudwatch-asus',
      script: 'cloudwatch-asus-reporter.js',
      cwd: 'C:/Users/leeak/CLAUDE_NAVADA_AGENT',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      watch: false,
      windowsHide: true,
    },
  ],
};
