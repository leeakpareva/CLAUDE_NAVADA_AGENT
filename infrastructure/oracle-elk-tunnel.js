#!/usr/bin/env node
/**
 * NAVADA: Persistent SSH tunnels to Oracle VM
 * Forwards monitoring & data services from Oracle to localhost.
 * Auto-reconnects on failure. Managed by PM2.
 *
 * Services tunneled:
 *   - Elasticsearch :9200
 *   - Kibana        :5601
 *   - Prometheus    :9090 (mapped to local :9091)
 *   - Grafana       :3000 (mapped to local :9090)
 *   - Uptime Kuma   :3001 (mapped to local :3002)
 */
const { spawn } = require('child_process');

const ORACLE_HOST = 'oracle-navada';
const TUNNELS = [
  { local: 9200, remote: 9200, name: 'Elasticsearch' },
  { local: 5601, remote: 5601, name: 'Kibana' },
  { local: 9091, remote: 9090, name: 'Prometheus' },
  { local: 9090, remote: 3000, name: 'Grafana' },
  { local: 3002, remote: 3001, name: 'Uptime Kuma' },
  { local: 8978, remote: 8978, name: 'CloudBeaver' },
];

function startTunnel(t) {
  const args = ['-N', '-L', `127.0.0.1:${t.local}:localhost:${t.remote}`, ORACLE_HOST,
    '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=3',
    '-o', 'ExitOnForwardFailure=yes'];

  console.log(`[TUNNEL] Starting ${t.name}: localhost:${t.local} -> Oracle:${t.remote}`);
  const proc = spawn('ssh', args, { stdio: 'pipe', windowsHide: true, detached: false });

  proc.on('close', (code) => {
    console.log(`[TUNNEL] ${t.name} exited (code ${code}), reconnecting in 5s...`);
    setTimeout(() => startTunnel(t), 5000);
  });

  proc.on('error', (err) => {
    console.error(`[TUNNEL] ${t.name} error: ${err.message}, reconnecting in 10s...`);
    setTimeout(() => startTunnel(t), 10000);
  });
}

console.log('=== NAVADA Oracle Data & Monitoring Tunnels ===');
for (const t of TUNNELS) startTunnel(t);

// Keep process alive
setInterval(() => {}, 60000);
