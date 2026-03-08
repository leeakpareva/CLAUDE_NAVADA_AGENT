/**
 * NAVADA Failover PM2 Ecosystem Config (Oracle VM)
 * Only critical services that need to run during failover.
 */

module.exports = {
  apps: [
    // Tier 1: Critical
    {
      name: 'telegram-bot',
      script: 'telegram-bot.js',
      cwd: '/home/ubuntu/navada-failover/Automation',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        FAILOVER_MODE: 'true',
        NODE_ENV: 'production',
      },
    },
    {
      name: 'inbox-responder',
      script: 'inbox-auto-responder.js',
      cwd: '/home/ubuntu/navada-failover/Automation',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        FAILOVER_MODE: 'true',
      },
    },

    // Tier 2: Important
    {
      name: 'trading-scheduler',
      script: 'scripts/scheduler.js',
      cwd: '/home/ubuntu/navada-failover/NAVADA-Trading',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'trading-api',
      script: 'python3',
      args: '-m uvicorn src.api:app --host 0.0.0.0 --port 5678',
      cwd: '/home/ubuntu/navada-failover/NAVADA-Trading',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
