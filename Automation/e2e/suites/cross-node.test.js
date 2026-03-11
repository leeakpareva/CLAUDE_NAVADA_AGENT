/**
 * Suite H: Cross-Node Tests — Worker<->EC2 forwarding, webhook self-heal
 * Schedule: every 30 minutes
 */

const { request } = require('../lib/http');
const { assertOk, assertStatusCode, assertContains } = require('../lib/assert');
const config = require('../config');

async function run() {
  const results = [];
  const start = Date.now();

  // 1. Worker -> EC2 forwarding: Worker /status shows EC2 connectivity
  const workerStatus = await request(`${config.gateway.baseUrl}/status`, { apiKey: config.gateway.apiKey });
  results.push({ test: 'Worker status reachable', ...assertStatusCode(workerStatus.status, 200, 'Worker /status') });

  // 2. EC2 -> Worker: EC2 can POST logs to Worker
  const ec2ToWorker = await request(`${config.gateway.baseUrl}/logs`, {
    method: 'POST',
    apiKey: config.gateway.apiKey,
    body: { node: 'EC2-TestRunner', event_type: 'test.cross_node', message: 'EC2->Worker roundtrip OK' },
  });
  results.push({ test: 'EC2->Worker log post', ...assertStatusCode(ec2ToWorker.status, 200, 'EC2->Worker POST') });

  // 3. Worker self-heal verification
  const tgHealth = await request(`${config.gateway.baseUrl}/health/telegram?key=${config.gateway.apiKey}`);
  results.push({ test: 'Webhook self-heal OK', ...assertOk(tgHealth.data?.webhook_ok, 'webhook_ok') });
  results.push({ test: 'Bot token valid', ...assertOk(tgHealth.data?.bot_token_valid, 'bot_token_valid') });

  // 4. EC2 /exec reachable from EC2 itself (loopback)
  const execCheck = await request(`${config.compute.baseUrl}/exec`, {
    method: 'POST',
    headers: { 'X-API-Key': config.compute.apiKey },
    body: { command: 'hostname' },
    timeout: 10000,
  });
  results.push({ test: 'EC2 /exec self-check', ...assertStatusCode(execCheck.status, 200, '/exec self') });

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'cross-node', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
