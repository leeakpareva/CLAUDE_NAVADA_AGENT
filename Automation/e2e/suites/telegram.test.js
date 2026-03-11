/**
 * Suite D: Telegram Tests — Bot readiness (non-destructive)
 * Schedule: every 60 minutes
 */

const { request } = require('../lib/http');
const { assertOk, assertLessThan, assertEqual } = require('../lib/assert');
const config = require('../config');

async function run() {
  const results = [];
  const start = Date.now();
  const token = config.telegram.botToken;

  if (!token) {
    return { suite: 'telegram', total: 1, passed: 0, failed: 1, errors: [{ test: 'Bot token', error: 'TELEGRAM_BOT_TOKEN not set', latencyMs: 0 }], duration: 0 };
  }

  // 1. getMe — bot identity
  const me = await request(`https://api.telegram.org/bot${token}/getMe`);
  results.push({ test: 'getMe succeeds', ...assertOk(me.data?.ok, 'getMe.ok') });
  if (me.data?.result) {
    results.push({ test: 'Bot username valid', ...assertOk(me.data.result.username, 'bot.username') });
  }

  // 2. getWebhookInfo — webhook health
  const wh = await request(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  results.push({ test: 'getWebhookInfo succeeds', ...assertOk(wh.data?.ok, 'getWebhookInfo.ok') });
  if (wh.data?.result) {
    const info = wh.data.result;
    results.push({ test: 'Webhook URL correct', ...assertEqual(info.url, config.telegram.webhookUrl, 'webhook.url') });
    results.push({ test: 'Pending updates low', ...assertLessThan(info.pending_update_count || 0, config.thresholds.webhookMaxPending, 'pending_updates') });

    // Check last error age
    if (info.last_error_date) {
      const errorAge = Math.floor(Date.now() / 1000) - info.last_error_date;
      results.push({ test: 'No recent webhook errors', ...assertOk(errorAge > config.thresholds.webhookMaxErrorAge, `Last error ${errorAge}s ago: ${info.last_error_message}`) });
    } else {
      results.push({ test: 'No webhook errors', pass: true });
    }
  }

  // 3. Health endpoint cross-check
  const health = await request(`${config.gateway.baseUrl}/health/telegram?key=${config.gateway.apiKey}`);
  results.push({ test: '/health/telegram healthy', ...assertOk(health.data?.healthy, 'health.healthy') });
  results.push({ test: 'Owner ID numeric', ...assertOk(health.data?.owner_id_numeric, 'health.owner_id_numeric') });

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'telegram', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
