#!/usr/bin/env node
/**
 * NAVADA - Uptime Kuma Monitor Setup
 * Adds all services as monitors via WebSocket API
 */
const { io } = require('socket.io-client');

const KUMA_URL = 'http://192.168.0.58:3002';
const USERNAME = 'admin';
const PASSWORD = 'navada2026';

const monitors = [
  // Cloudflare subdomains (external HTTPS)
  { name: 'API Gateway', type: 'http', url: 'https://api.navada-edge-server.uk/health', interval: 60, group: 'Cloudflare Subdomains' },
  { name: 'NAVADA Flix', type: 'http', url: 'https://flix.navada-edge-server.uk', interval: 120, group: 'Cloudflare Subdomains' },
  { name: 'NAVADA Logo', type: 'http', url: 'https://logo.navada-edge-server.uk', interval: 300, group: 'Cloudflare Subdomains' },
  { name: 'Network Scanner', type: 'http', url: 'https://network.navada-edge-server.uk', interval: 120, group: 'Cloudflare Subdomains' },
  { name: 'Trading API', type: 'http', url: 'https://trading.navada-edge-server.uk/docs', interval: 60, group: 'Cloudflare Subdomains' },
  { name: 'CloudBeaver', type: 'http', url: 'https://cloudbeaver.navada-edge-server.uk', interval: 300, group: 'Cloudflare Subdomains' },
  { name: 'Grafana', type: 'http', url: 'https://grafana.navada-edge-server.uk', interval: 120, group: 'Cloudflare Subdomains' },
  { name: 'Kibana', type: 'http', url: 'https://kibana.navada-edge-server.uk/kibana/', interval: 120, group: 'Cloudflare Subdomains' },
  { name: 'Uptime Monitor', type: 'http', url: 'https://monitor.navada-edge-server.uk', interval: 300, group: 'Cloudflare Subdomains' },

  // Local services (internal health checks)
  { name: 'Nginx Proxy', type: 'http', url: 'http://192.168.0.58:80/health', interval: 30, group: 'Local Services' },
  { name: 'Prometheus', type: 'http', url: 'http://192.168.0.58:9091/-/healthy', interval: 60, group: 'Local Services' },
  { name: 'Elasticsearch', type: 'http', url: 'http://192.168.0.58:9200/_cluster/health', interval: 60, group: 'Local Services' },
  { name: 'Portainer', type: 'http', url: 'http://192.168.0.58:9000', interval: 120, group: 'Local Services' },
  { name: 'Telegram Bot', type: 'http', url: 'http://192.168.0.58:3456/health', interval: 30, group: 'Local Services' },
  { name: 'WorldMonitor', type: 'http', url: 'http://192.168.0.58:4173', interval: 120, group: 'Local Services' },
  { name: 'WorldMonitor API', type: 'http', url: 'http://192.168.0.58:46123', interval: 120, group: 'Local Services' },
  { name: 'Jupyter Lab', type: 'http', url: 'http://192.168.0.58:8888', interval: 300, group: 'Local Services' },

  // Tailscale mesh nodes
  { name: 'AWS EC2 (Tailscale)', type: 'ping', hostname: '100.98.118.33', interval: 60, group: 'Tailscale Mesh' },
  { name: 'Oracle VM (Tailscale)', type: 'ping', hostname: '100.77.206.9', interval: 60, group: 'Tailscale Mesh' },

  // External dependencies
  { name: 'Cloudflare Tunnel', type: 'http', url: 'https://api.navada-edge-server.uk/health', interval: 60, maxretries: 3, group: 'External' },
  { name: 'Cloudflare R2', type: 'http', url: 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev/media/navada-logo.png', interval: 300, group: 'External' },
  { name: 'Zoho Mail (SMTP)', type: 'port', hostname: 'smtp.zoho.eu', port: 465, interval: 300, group: 'External' },
];

function socketCall(socket, event, data) {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (res) => {
      if (res.ok) resolve(res);
      else reject(new Error(res.msg || JSON.stringify(res)));
    });
    setTimeout(() => reject(new Error('Timeout')), 10000);
  });
}

async function run() {
  console.log('=== NAVADA Uptime Kuma Setup ===\n');
  console.log('Connecting to', KUMA_URL);

  const socket = io(KUMA_URL, { transports: ['websocket'] });

  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', (e) => reject(new Error(`Connection failed: ${e.message}`)));
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });
  console.log('[OK] Connected\n');

  // Login
  try {
    await socketCall(socket, 'login', { username: USERNAME, password: PASSWORD, token: '' });
    console.log('[OK] Logged in\n');
  } catch (e) {
    console.error('[ERROR] Login failed:', e.message);
    socket.close();
    return;
  }

  // Get existing monitors
  const existingMonitors = await new Promise((resolve) => {
    socket.emit('getMonitorList', (res) => resolve(res));
    setTimeout(() => resolve({}), 5000);
  });
  const existingNames = new Set(Object.values(existingMonitors).map(m => m.name));
  console.log(`Existing monitors: ${existingNames.size}\n`);

  // Create monitor groups first
  const groups = [...new Set(monitors.map(m => m.group))];
  const groupIds = {};

  for (const groupName of groups) {
    if (existingNames.has(groupName)) {
      const existing = Object.values(existingMonitors).find(m => m.name === groupName);
      if (existing) groupIds[groupName] = existing.id;
      console.log(`[SKIP] Group: ${groupName} (exists)`);
      continue;
    }
    try {
      const res = await socketCall(socket, 'add', {
        type: 'group',
        name: groupName,
        interval: 60,
      });
      groupIds[groupName] = res.monitorID;
      console.log(`[CREATED] Group: ${groupName} (ID: ${res.monitorID})`);
    } catch (e) {
      console.log(`[ERROR] Group ${groupName}: ${e.message}`);
    }
  }

  // Create monitors
  console.log('\n--- Adding Monitors ---');
  let created = 0, skipped = 0;

  for (const mon of monitors) {
    if (existingNames.has(mon.name)) {
      console.log(`[SKIP] ${mon.name}`);
      skipped++;
      continue;
    }

    const monitorData = {
      type: mon.type || 'http',
      name: mon.name,
      url: mon.url || '',
      hostname: mon.hostname || '',
      port: mon.port || null,
      interval: mon.interval || 60,
      retryInterval: 30,
      maxretries: mon.maxretries || 1,
      accepted_statuscodes: ['200-299', '301', '302'],
      parent: groupIds[mon.group] || null,
    };

    try {
      const res = await socketCall(socket, 'add', monitorData);
      console.log(`[OK] ${mon.name} (ID: ${res.monitorID})`);
      created++;
    } catch (e) {
      console.log(`[ERROR] ${mon.name}: ${e.message}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Created: ${created} | Skipped: ${skipped} | Total: ${monitors.length}`);
  console.log(`Groups: ${groups.join(', ')}`);
  console.log(`\nDashboard: http://192.168.0.58:3002`);
  console.log(`Public: https://monitor.navada-edge-server.uk`);

  socket.close();
}

run().catch(e => console.error('Fatal:', e.message));
