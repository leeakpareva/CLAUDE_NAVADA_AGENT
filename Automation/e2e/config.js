/**
 * NAVADA Edge E2E — Test Configuration
 * Single source of truth for endpoints, credentials, thresholds.
 */

module.exports = {
  // Cloudflare Worker (NAVADA-GATEWAY)
  gateway: {
    baseUrl: 'https://edge-api.navada-edge-server.uk',
    apiKey: process.env.WORKER_API_KEY || 'navada-edge-2026',
  },

  // EC2 Dashboard (NAVADA-COMPUTE)
  compute: {
    baseUrl: `http://${process.env.EC2_HOST || '127.0.0.1'}:9090`,
    publicUrl: 'http://3.11.119.181:9090',
    apiKey: process.env.EC2_API_KEY || 'navada-ec2',
  },

  // Node network (Tailscale IPs)
  nodes: {
    hp:     { host: '100.121.187.67', sshPort: 22, pgPort: 5433, name: 'NAVADA-EDGE-SERVER' },
    ec2:    { host: '100.98.118.33',  sshPort: 22, name: 'NAVADA-COMPUTE' },
    oracle: { host: '100.77.206.9', publicHost: '132.145.46.184', sshPort: 22, grafana: 3000, prometheus: 9090, portainer: 9000, name: 'NAVADA-ROUTER' },
    asus:   { host: '100.88.118.128', name: 'NAVADA-CONTROL' },
  },

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    ownerId: process.env.TELEGRAM_OWNER_ID || '6920669447',
    webhookUrl: 'https://edge-api.navada-edge-server.uk/telegram/webhook',
  },

  // Cloudflare subdomains to verify
  subdomains: [
    'https://dashboard.navada-edge-server.uk',
    'https://edge-api.navada-edge-server.uk/status',
  ],

  // Thresholds
  thresholds: {
    apiResponseMs: 5000,
    tcpTimeoutMs: 5000,
    webhookMaxPending: 50,
    webhookMaxErrorAge: 1800, // 30 minutes in seconds
    minCronRunsPerDay: 250,   // expected ~288 for */5
  },

  // Schedules (ms)
  schedules: {
    fast:    15 * 60 * 1000,   // 15 min: gateway, compute, network
    medium:  30 * 60 * 1000,   // 30 min: database, cross-node
    slow:    60 * 60 * 1000,   // 60 min: telegram
    vision:  6 * 60 * 60 * 1000, // 6 hr: vision pipeline
    daily:   24 * 60 * 60 * 1000, // daily: cron verification
  },
};
