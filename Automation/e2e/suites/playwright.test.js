/**
 * Suite I: Playwright Headless Tests — Browser-based E2E
 * Tests real browser rendering of NAVADA dashboards and public endpoints.
 * Schedule: every 30 minutes
 *
 * Requires: npm install playwright (Chromium auto-downloaded)
 */

const { assertOk, assertContains, assertLessThan } = require('../lib/assert');

async function run() {
  const results = [];
  const start = Date.now();

  let chromium, browser;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    return { suite: 'playwright', total: 1, passed: 0, failed: 1,
      errors: [{ test: 'Playwright import', error: 'playwright not installed. Run: npm install playwright', latencyMs: 0 }],
      duration: Date.now() - start };
  }

  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    const context = await browser.newContext({
      userAgent: 'NAVADA-E2E-TestRunner/1.0',
      viewport: { width: 1280, height: 720 },
    });
    context.setDefaultTimeout(15000);

    // ── Test 1: EC2 Dashboard renders ──
    try {
      const t1 = Date.now();
      const page = await context.newPage();
      const resp = await page.goto('http://3.11.119.181:9090', { waitUntil: 'domcontentloaded' });
      results.push({ test: 'Dashboard loads (HTTP)', ...assertOk(resp?.ok(), `Dashboard HTTP ${resp?.status()}`), latencyMs: Date.now() - t1 });

      const title = await page.title();
      results.push({ test: 'Dashboard has title', ...assertOk(title.length > 0, 'empty title') });

      const bodyText = await page.textContent('body');
      results.push({ test: 'Dashboard shows NAVADA', ...assertContains(bodyText, 'NAVADA', 'body text') });

      // Check no JS console errors
      const consoleErrors = [];
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      await page.waitForTimeout(2000);
      results.push({ test: 'No JS console errors', ...assertOk(consoleErrors.length === 0, `${consoleErrors.length} errors: ${consoleErrors[0] || ''}`) });

      await page.close();
    } catch (e) {
      results.push({ test: 'Dashboard loads', pass: false, error: e.message });
    }

    // ── Test 2: Worker /status API via browser fetch ──
    try {
      const t2 = Date.now();
      const page = await context.newPage();
      await page.goto('about:blank');
      const apiKey = require('../config').gateway.apiKey;
      const apiResult = await page.evaluate(async (key) => {
        const resp = await fetch(`https://edge-api.navada-edge-server.uk/status?key=${key}`);
        return { status: resp.status, data: await resp.json() };
      }, apiKey);
      results.push({ test: 'Worker /status via browser', ...assertOk(apiResult.status === 200, `HTTP ${apiResult.status}`), latencyMs: Date.now() - t2 });
      results.push({ test: 'Worker reports online', ...assertOk(apiResult.data?.status === 'online' || apiResult.data?.database, 'not online') });
      await page.close();
    } catch (e) {
      results.push({ test: 'Worker /status via browser', pass: false, error: e.message });
    }

    // ── Test 3: Cloudflare dashboard subdomain ──
    try {
      const t3 = Date.now();
      const page = await context.newPage();
      const resp = await page.goto('https://dashboard.navada-edge-server.uk', { waitUntil: 'domcontentloaded', timeout: 20000 });
      results.push({ test: 'CF dashboard subdomain loads', ...assertOk(resp?.status() < 500, `HTTP ${resp?.status()}`), latencyMs: Date.now() - t3 });
      await page.close();
    } catch (e) {
      results.push({ test: 'CF dashboard subdomain loads', pass: false, error: e.message });
    }

    // ── Test 4: Grafana login page ──
    try {
      const t4 = Date.now();
      const page = await context.newPage();
      const resp = await page.goto('https://grafana.navada-edge-server.uk', { waitUntil: 'domcontentloaded', timeout: 20000 });
      results.push({ test: 'Grafana loads', ...assertOk(resp && resp.status() < 500, `HTTP ${resp?.status()}`), latencyMs: Date.now() - t4 });
      await page.close();
    } catch (e) {
      results.push({ test: 'Grafana loads', pass: false, error: e.message });
    }

    // ── Test 5: Screenshot capture for visual regression ──
    try {
      const page = await context.newPage();
      await page.goto('http://3.11.119.181:9090', { waitUntil: 'networkidle', timeout: 20000 });
      const screenshotDir = require('path').join(__dirname, '..', 'screenshots');
      require('fs').mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({
        path: require('path').join(screenshotDir, `dashboard-${new Date().toISOString().slice(0, 10)}.png`),
        fullPage: true,
      });
      results.push({ test: 'Dashboard screenshot captured', pass: true });
      await page.close();
    } catch (e) {
      results.push({ test: 'Dashboard screenshot captured', pass: false, error: e.message });
    }

    // ── Test 6: API response timing via browser ──
    try {
      const page = await context.newPage();
      await page.goto('about:blank');
      const timing = await page.evaluate(async () => {
        const endpoints = [
          'https://edge-api.navada-edge-server.uk/status',
        ];
        const results = [];
        for (const url of endpoints) {
          const t = Date.now();
          const r = await fetch(url);
          results.push({ url, status: r.status, ms: Date.now() - t });
        }
        return results;
      });
      for (const t of timing) {
        const name = new URL(t.url).pathname;
        results.push({ test: `Browser timing ${name}`, ...assertLessThan(t.ms, 3000, `${name} ${t.ms}ms`), latencyMs: t.ms });
      }
      await page.close();
    } catch (e) {
      results.push({ test: 'Browser timing test', pass: false, error: e.message });
    }

    await browser.close();
  } catch (e) {
    results.push({ test: 'Playwright browser launch', pass: false, error: e.message });
    if (browser) try { await browser.close(); } catch {}
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'playwright', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
