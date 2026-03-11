/**
 * Suite G: Cron Verification — Did scheduled jobs run?
 * Schedule: daily at 10:00 AM
 */

const { request } = require('../lib/http');
const { assertOk, assertLessThan } = require('../lib/assert');
const config = require('../config');

const BASE = config.gateway.baseUrl;
const KEY = config.gateway.apiKey;

async function run() {
  const results = [];
  const start = Date.now();

  // Query D1 for cron.run events in last 24 hours
  const logs = await request(`${BASE}/logs?type=cron.run&last=1440`, { apiKey: KEY });
  results.push({ test: 'Cron logs readable', ...assertOk(logs.status === 200, `HTTP ${logs.status}`) });

  if (logs.data?.logs) {
    const cronRuns = logs.data.logs;
    const total = cronRuns.length;

    // Health check cron (*/5) should run ~288 times/day, expect at least 250
    const healthRuns = cronRuns.filter(l => l.message?.includes('*/5'));
    results.push({ test: `Health cron ran ${healthRuns.length}x (expect 250+)`, ...assertOk(healthRuns.length >= config.thresholds.minCronRunsPerDay * 0.5, `Only ${healthRuns.length} health cron runs`) });

    // Time-aware checks: only verify crons that should have run by now (UTC)
    const nowHourUTC = new Date().getUTCHours();

    // Morning briefing (6:30 AM UTC) — only check after 7 AM
    if (nowHourUTC >= 7) {
      const morningRuns = cronRuns.filter(l => l.message?.includes('30 6'));
      results.push({ test: 'Morning briefing cron ran', ...assertOk(morningRuns.length > 0, 'No morning briefing cron.run found') });
    }

    // News digest (7:00 AM UTC) — only check after 8 AM
    if (nowHourUTC >= 8) {
      const newsRuns = cronRuns.filter(l => l.message?.includes('0 7'));
      results.push({ test: 'News digest cron ran', ...assertOk(newsRuns.length > 0, 'No news digest cron.run found') });
    }

    // Pipeline (8:30 AM UTC) — only check after 9 AM
    if (nowHourUTC >= 9) {
      const pipelineRuns = cronRuns.filter(l => l.message?.includes('30 8'));
      results.push({ test: 'Pipeline cron ran', ...assertOk(pipelineRuns.length > 0, 'No pipeline cron.run found') });
    }

    // Jobs (9:00 AM UTC) — only check after 10 AM
    if (nowHourUTC >= 10) {
      const jobRuns = cronRuns.filter(l => l.message?.includes('0 9'));
      results.push({ test: 'Jobs cron ran', ...assertOk(jobRuns.length > 0, 'No jobs cron.run found') });
    }

    results.push({ test: `Total cron runs: ${total}`, pass: true });
  } else {
    results.push({ test: 'Cron logs exist', pass: false, error: 'No cron.run logs found in last 24h' });
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'cron', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
