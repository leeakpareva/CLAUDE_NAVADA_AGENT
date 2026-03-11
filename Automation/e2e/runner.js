/**
 * NAVADA Edge E2E Test Runner
 * Runs on EC2 via PM2. Executes test suites on tiered schedules.
 * Results -> D1 + CloudWatch + Telegram alerts on state transitions.
 *
 * PM2: pm2 start e2e/runner.js --name e2e-tests --cwd /home/ubuntu
 */

try { require('dotenv').config({ path: require('path').join(__dirname, '.env') }); } catch {}
const { reportResults } = require('./lib/reporter');
const config = require('./config');

// Import all suites
const gateway = require('./suites/gateway.test');
const compute = require('./suites/compute.test');
const network = require('./suites/network.test');
const telegram = require('./suites/telegram.test');
const database = require('./suites/database.test');
const crossNode = require('./suites/cross-node.test');
const vision = require('./suites/vision.test');
const cron = require('./suites/cron.test');
const playwright = require('./suites/playwright.test');

async function runSuite(suite) {
  try {
    const result = await suite.run();
    await reportResults(result);
    return result;
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Suite crashed: ${e.message}`);
    return null;
  }
}

async function runFast() {
  console.log(`\n[${new Date().toISOString()}] === Fast tier (15min) ===`);
  await runSuite(gateway);
  await runSuite(compute);
  await runSuite(network);
}

async function runMedium() {
  console.log(`\n[${new Date().toISOString()}] === Medium tier (30min) ===`);
  await runSuite(database);
  await runSuite(crossNode);
  await runSuite(playwright);
}

async function runSlow() {
  console.log(`\n[${new Date().toISOString()}] === Slow tier (60min) ===`);
  await runSuite(telegram);
}

async function runVision() {
  console.log(`\n[${new Date().toISOString()}] === Vision tier (6hr) ===`);
  await runSuite(vision);
}

async function runDaily() {
  console.log(`\n[${new Date().toISOString()}] === Daily tier ===`);
  await runSuite(cron);
}

async function runAll() {
  console.log(`\n[${new Date().toISOString()}] === FULL E2E RUN (all 9 suites) ===`);
  const suites = [gateway, compute, network, telegram, database, crossNode, vision, cron, playwright];
  const results = [];
  for (const suite of suites) {
    const r = await runSuite(suite);
    if (r) results.push(r);
  }
  const totalTests = results.reduce((s, r) => s + r.total, 0);
  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const totalFailed = results.reduce((s, r) => s + r.failed, 0);
  console.log(`\n[${new Date().toISOString()}] === SUMMARY: ${totalPassed}/${totalTests} passed, ${totalFailed} failed ===`);
  return results;
}

// ─── Entry point ───
const mode = process.argv[2] || 'daemon';

if (mode === 'once') {
  // Single run of all suites then exit
  runAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

} else if (mode === 'suite') {
  // Run a specific suite: node runner.js suite gateway
  const suiteName = process.argv[3];
  const suiteMap = { gateway, compute, network, telegram, database, 'cross-node': crossNode, vision, cron, playwright };
  const suite = suiteMap[suiteName];
  if (!suite) {
    console.error(`Unknown suite: ${suiteName}. Available: ${Object.keys(suiteMap).join(', ')}`);
    process.exit(1);
  }
  runSuite(suite).then(() => process.exit(0));

} else {
  // Daemon mode — run on schedule via setInterval
  console.log(`[${new Date().toISOString()}] NAVADA E2E Test Runner starting (daemon mode)`);
  console.log(`  Fast (15min): gateway, compute, network`);
  console.log(`  Medium (30min): database, cross-node, playwright`);
  console.log(`  Slow (60min): telegram`);
  console.log(`  Vision (6hr): vision pipeline`);
  console.log(`  Daily: cron verification`);
  console.log('');

  // Run all immediately on startup
  runAll().then(() => {
    // Then schedule tiers
    setInterval(runFast, config.schedules.fast);
    setInterval(runMedium, config.schedules.medium);
    setInterval(runSlow, config.schedules.slow);
    setInterval(runVision, config.schedules.vision);

    // Daily at 10:00 AM UTC
    const scheduleDaily = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(10, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const delay = next - now;
      setTimeout(() => { runDaily(); scheduleDaily(); }, delay);
    };
    scheduleDaily();
  });

  // Graceful shutdown
  process.on('SIGINT', () => { console.log('E2E runner stopping...'); process.exit(0); });
  process.on('SIGTERM', () => { console.log('E2E runner stopping...'); process.exit(0); });
}
