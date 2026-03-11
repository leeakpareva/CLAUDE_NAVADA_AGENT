/**
 * Suite A: Gateway Tests — Cloudflare Worker API endpoints
 * Schedule: every 15 minutes
 */

const { request } = require('../lib/http');
const { assertEqual, assertOk, assertStatusCode, assertLessThan, assertContains } = require('../lib/assert');
const config = require('../config');

const BASE = config.gateway.baseUrl;
const KEY = config.gateway.apiKey;
const MAX_MS = config.thresholds.apiResponseMs;

async function run() {
  const results = [];
  const start = Date.now();

  // 1. GET /status — requires auth
  const status = await request(`${BASE}/status`, { apiKey: KEY });
  results.push({ test: 'GET /status returns 200', ...assertStatusCode(status.status, 200, '/status') });
  if (status.data) {
    results.push({ test: '/status has online status', ...assertOk(status.data.status === 'online' || status.data.database, '/status body') });
  }
  results.push({ test: '/status latency', ...assertLessThan(status.latencyMs, MAX_MS, '/status'), latencyMs: status.latencyMs });

  // 2. GET /metrics — requires auth
  const metrics = await request(`${BASE}/metrics?last=5`, { apiKey: KEY });
  results.push({ test: 'GET /metrics returns 200', ...assertStatusCode(metrics.status, 200, '/metrics') });
  if (metrics.data) {
    results.push({ test: '/metrics has array', ...assertOk(Array.isArray(metrics.data.metrics), '/metrics.metrics') });
  }

  // 3. GET /logs — requires auth
  const logs = await request(`${BASE}/logs?last=5`, { apiKey: KEY });
  results.push({ test: 'GET /logs returns 200', ...assertStatusCode(logs.status, 200, '/logs') });

  // 4. GET /health — requires auth
  const health = await request(`${BASE}/health?last=5`, { apiKey: KEY });
  results.push({ test: 'GET /health returns 200', ...assertStatusCode(health.status, 200, '/health') });

  // 5. GET /health/telegram — requires auth
  const tgHealth = await request(`${BASE}/health/telegram?key=${KEY}`);
  results.push({ test: 'GET /health/telegram returns 200', ...assertStatusCode(tgHealth.status, 200, '/health/telegram') });
  if (tgHealth.data) {
    results.push({ test: 'Telegram bot healthy', ...assertOk(tgHealth.data.healthy, 'telegram.healthy') });
    results.push({ test: 'Webhook URL correct', ...assertOk(tgHealth.data.webhook_ok, 'telegram.webhook_ok') });
  }

  // 6. POST /logs — write test
  const writeTest = await request(`${BASE}/logs`, {
    method: 'POST',
    apiKey: KEY,
    body: { node: 'EC2-TestRunner', event_type: 'test.heartbeat', message: 'E2E write test', data: null },
  });
  results.push({ test: 'POST /logs write succeeds', ...assertStatusCode(writeTest.status, 200, '/logs POST') });

  // 7. Auth — request without key returns 401
  const noAuth = await request(`${BASE}/metrics`);
  results.push({ test: 'No auth returns 401', ...assertStatusCode(noAuth.status, 401, '/metrics no-auth') });

  // 8. 404 — unknown route
  const notFound = await request(`${BASE}/nonexistent`, { apiKey: KEY });
  results.push({ test: 'Unknown route returns 404', ...assertStatusCode(notFound.status, 404, '/nonexistent') });

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'gateway', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
