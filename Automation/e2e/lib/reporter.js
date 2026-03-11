/**
 * NAVADA Edge E2E — Reporter
 * Collects results, posts to D1, sends Telegram alerts, pushes CloudWatch metrics.
 */

const { request } = require('./http');

const WORKER_URL = 'https://edge-api.navada-edge-server.uk';
const API_KEY = process.env.WORKER_API_KEY || 'navada-edge-2026';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_OWNER = process.env.TELEGRAM_OWNER_ID || '6920669447';

// Track last state per suite for transition alerts
const lastState = {};

async function reportResults(suiteResult) {
  const { suite, total, passed, failed, errors, duration } = suiteResult;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const status = failed === 0 ? 'PASS' : 'FAIL';

  // 1. Log to D1 via Worker API
  try {
    await request(`${WORKER_URL}/logs`, {
      method: 'POST',
      apiKey: API_KEY,
      body: {
        node: 'EC2-TestRunner',
        event_type: `test.${suite}`,
        message: `${passed}/${total} passed (${passRate}%)${failed > 0 ? ' | FAILURES: ' + errors.map(e => e.test).join(', ') : ''}`,
        data: JSON.stringify({ total, passed, failed, duration, errors: errors.slice(0, 10) }),
      },
    });
  } catch {}

  // 2. CloudWatch custom metric
  try {
    const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
    const cw = new CloudWatchClient({ region: 'eu-west-2' });
    await cw.send(new PutMetricDataCommand({
      Namespace: 'NAVADA/Tests',
      MetricData: [
        {
          MetricName: 'TestPassRate',
          Value: passRate,
          Unit: 'Percent',
          Dimensions: [{ Name: 'Suite', Value: suite }],
        },
        {
          MetricName: 'TestFailCount',
          Value: failed,
          Unit: 'Count',
          Dimensions: [{ Name: 'Suite', Value: suite }],
        },
      ],
    }));
  } catch {}

  // 3. Telegram alert on state transitions only
  const prevState = lastState[suite];
  lastState[suite] = status;

  if (status === 'FAIL' && prevState !== 'FAIL') {
    await sendTelegramAlert(
      `E2E ALERT: ${suite}\n\n${failed}/${total} tests failed\n\n${errors.map(e => `${e.test}: ${e.error}`).join('\n')}\n\nLatency: ${duration}ms`
    );
  } else if (status === 'PASS' && prevState === 'FAIL') {
    await sendTelegramAlert(
      `E2E RECOVERED: ${suite}\n\nAll ${total} tests passing. Duration: ${duration}ms`
    );
  }

  // Console log
  const icon = status === 'PASS' ? 'OK' : 'FAIL';
  console.log(`[${new Date().toISOString()}] [${icon}] ${suite}: ${passed}/${total} (${duration}ms)`);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`  FAIL: ${e.test} — ${e.error} (${e.latencyMs}ms)`));
  }

  return suiteResult;
}

async function sendTelegramAlert(text) {
  if (!TELEGRAM_TOKEN) return;
  try {
    await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      body: { chat_id: Number(TELEGRAM_OWNER), text: `NAVADA E2E\n\n${text}`, disable_web_page_preview: true },
      timeout: 8000,
    });
  } catch {}
}

module.exports = { reportResults, sendTelegramAlert };
