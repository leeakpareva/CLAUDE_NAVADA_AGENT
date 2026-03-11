/**
 * Suite C: Network Tests — Cross-node reachability
 * Schedule: every 15 minutes
 */

const { tcpCheck, request } = require('../lib/http');
const { assertOk, assertLessThan } = require('../lib/assert');
const config = require('../config');

async function run() {
  const results = [];
  const start = Date.now();

  // 1. HP — SSH port
  const hp = await tcpCheck(config.nodes.hp.host, config.nodes.hp.sshPort);
  results.push({ test: 'HP SSH reachable', ...assertOk(hp.ok, `HP:${config.nodes.hp.sshPort}`), latencyMs: hp.latencyMs });

  // 2. HP — PostgreSQL port
  const hpPg = await tcpCheck(config.nodes.hp.host, config.nodes.hp.pgPort);
  results.push({ test: 'HP PostgreSQL reachable', ...assertOk(hpPg.ok, `HP:${config.nodes.hp.pgPort}`), latencyMs: hpPg.latencyMs });

  // 3. Oracle — SSH port
  const oracle = await tcpCheck(config.nodes.oracle.host, config.nodes.oracle.sshPort);
  results.push({ test: 'Oracle SSH reachable', ...assertOk(oracle.ok, `Oracle:22`), latencyMs: oracle.latencyMs });

  // 4. Oracle — Grafana
  const grafana = await request(`http://${config.nodes.oracle.host}:${config.nodes.oracle.grafana}`, { timeout: 8000 });
  results.push({ test: 'Oracle Grafana responds', ...assertOk(grafana.status > 0 && grafana.status < 500, `Grafana HTTP ${grafana.status}`) });

  // 5. Oracle — Portainer
  const portainer = await request(`http://${config.nodes.oracle.host}:${config.nodes.oracle.portainer}`, { timeout: 8000 });
  results.push({ test: 'Oracle Portainer responds', ...assertOk(portainer.status > 0 && portainer.status < 500, `Portainer HTTP ${portainer.status}`) });

  // 6. EC2 — SSH (localhost or Tailscale)
  const ec2 = await tcpCheck(config.nodes.ec2.host, config.nodes.ec2.sshPort);
  results.push({ test: 'EC2 SSH reachable', ...assertOk(ec2.ok, `EC2:22`), latencyMs: ec2.latencyMs });

  // 7. Cloudflare subdomains
  for (const url of config.subdomains) {
    const resp = await request(url, { timeout: 8000 });
    const name = new URL(url).hostname.split('.')[0];
    results.push({ test: `${name} subdomain responds`, ...assertOk(resp.status > 0 && resp.status < 500, `${name} HTTP ${resp.status}`), latencyMs: resp.latencyMs });
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'network', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
