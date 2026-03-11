/**
 * Suite F: Database Tests — D1 integrity + PostgreSQL connectivity
 * Schedule: every 30 minutes
 */

const { request, tcpCheck } = require('../lib/http');
const { assertOk, assertStatusCode } = require('../lib/assert');
const config = require('../config');

const BASE = config.gateway.baseUrl;
const KEY = config.gateway.apiKey;

async function run() {
  const results = [];
  const start = Date.now();

  // 1. D1 read — /status returns table counts
  const status = await request(`${BASE}/status`, { apiKey: KEY });
  results.push({ test: 'D1 status readable', ...assertStatusCode(status.status, 200, '/status') });
  if (status.data) {
    results.push({ test: 'D1 has metrics count', ...assertOk(status.data.metrics !== undefined || status.data.database, 'status.metrics') });
  }

  // 2. D1 write + read roundtrip
  const testId = `e2e-${Date.now()}`;
  const write = await request(`${BASE}/logs`, {
    method: 'POST',
    apiKey: KEY,
    body: { node: 'EC2-TestRunner', event_type: 'test.db_roundtrip', message: testId, data: null },
  });
  results.push({ test: 'D1 write succeeds', ...assertStatusCode(write.status, 200, 'D1 write') });

  // Read back
  const read = await request(`${BASE}/logs?type=test.db_roundtrip&last=5`, { apiKey: KEY });
  results.push({ test: 'D1 read succeeds', ...assertStatusCode(read.status, 200, 'D1 read') });
  if (read.data?.logs) {
    const found = read.data.logs.some(l => l.message === testId);
    results.push({ test: 'D1 roundtrip verified', ...assertOk(found, 'D1 write-read roundtrip') });
  }

  // 3. D1 metrics table — recent data exists
  const metrics = await request(`${BASE}/metrics?last=60`, { apiKey: KEY });
  results.push({ test: 'D1 metrics readable', ...assertStatusCode(metrics.status, 200, 'metrics read') });

  // 4. D1 health table — recent entries
  const health = await request(`${BASE}/health?last=60`, { apiKey: KEY });
  results.push({ test: 'D1 health readable', ...assertStatusCode(health.status, 200, 'health read') });

  // 5. PostgreSQL on HP — TCP reachability
  const pgCheck = await tcpCheck(config.nodes.hp.host, config.nodes.hp.pgPort);
  results.push({ test: 'HP PostgreSQL TCP reachable', ...assertOk(pgCheck.ok, `PG:${config.nodes.hp.pgPort}`), latencyMs: pgCheck.latencyMs });

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'database', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
