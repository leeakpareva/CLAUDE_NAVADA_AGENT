/**
 * Suite B: Compute Tests — EC2 Dashboard Server (port 9090)
 * Schedule: every 15 minutes
 */

const { request } = require('../lib/http');
const { assertStatusCode, assertOk, assertContains, assertLessThan } = require('../lib/assert');
const config = require('../config');

const BASE = config.compute.baseUrl;
const KEY = config.compute.apiKey;
const MAX_MS = config.thresholds.apiResponseMs;

async function run() {
  const results = [];
  const start = Date.now();

  // 1. GET / — dashboard page
  const dashboard = await request(BASE, { timeout: 8000 });
  results.push({ test: 'Dashboard returns 200', ...assertStatusCode(dashboard.status, 200, 'GET /') });
  if (typeof dashboard.data === 'string') {
    results.push({ test: 'Dashboard contains NAVADA', ...assertContains(dashboard.data, 'NAVADA', 'dashboard HTML') });
  }
  results.push({ test: 'Dashboard latency', ...assertLessThan(dashboard.latencyMs, MAX_MS, 'GET /'), latencyMs: dashboard.latencyMs });

  // 2. POST /exec — echo test (auth required)
  const exec = await request(`${BASE}/exec`, {
    method: 'POST',
    body: { command: 'echo navada-e2e-ok' },
    headers: { 'X-API-Key': KEY },
    timeout: 10000,
  });
  results.push({ test: 'POST /exec returns 200', ...assertStatusCode(exec.status, 200, '/exec') });
  if (exec.data) {
    const output = typeof exec.data === 'string' ? exec.data : (exec.data.stdout || exec.data.output || JSON.stringify(exec.data));
    results.push({ test: '/exec output correct', ...assertContains(output, 'navada-e2e-ok', '/exec output') });
  }

  // 3. POST /exec without auth — should reject
  const execNoAuth = await request(`${BASE}/exec`, {
    method: 'POST',
    body: { command: 'echo test' },
    timeout: 5000,
  });
  results.push({ test: '/exec no auth rejected', ...assertOk(execNoAuth.status === 401 || execNoAuth.status === 403, '/exec auth gate') });

  // 4. POST /annotate — minimal test (expects image data, should return error without it)
  const annotate = await request(`${BASE}/annotate`, {
    method: 'POST',
    body: {},
    headers: { 'X-API-Key': KEY },
    timeout: 5000,
  });
  results.push({ test: '/annotate reachable', ...assertOk(annotate.status > 0, '/annotate reachable') });

  // 5. PM2 process check via /exec
  const pm2Check = await request(`${BASE}/exec`, {
    method: 'POST',
    body: { command: 'pm2 jlist 2>/dev/null | node -e "let d=\'\';process.stdin.on(\'data\',c=>d+=c);process.stdin.on(\'end\',()=>{const p=JSON.parse(d);const online=p.filter(x=>x.pm2_env.status===\'online\').length;console.log(online+\'/\'+p.length+\' online\')})"' },
    headers: { 'X-API-Key': KEY },
    timeout: 10000,
  });
  results.push({ test: 'PM2 status check', ...assertStatusCode(pm2Check.status, 200, 'pm2 check') });
  if (pm2Check.data) {
    const out = typeof pm2Check.data === 'string' ? pm2Check.data : (pm2Check.data.stdout || '');
    results.push({ test: 'PM2 processes running', ...assertContains(out, 'online', 'pm2 output') });
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'compute', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
