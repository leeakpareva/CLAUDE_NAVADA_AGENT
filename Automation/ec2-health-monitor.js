#!/usr/bin/env node
// NAVADA Edge — EC2 Network-Wide Health Monitor & Alerting System
// Monitors all NAVADA infrastructure nodes: HP, Oracle, Cloudflare endpoints
// Alerts via Telegram (direct API) and SMS (Twilio) for critical failures
// Manages bot standby failover and pushes CloudWatch custom metrics
// Runs on EC2 via PM2

try { require('dotenv').config({ path: __dirname + '/.env' }); } catch {}
const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CONFIG = {
  checkInterval: 5 * 60 * 1000,        // 5 minutes
  failThreshold: 3,                     // consecutive failures before escalation
  alertCooldownFirst: 5 * 60 * 1000,    // 5 min for first alert on a new failure
  alertCooldownRepeat: 30 * 60 * 1000,  // 30 min for repeat alerts of same failure
  httpTimeout: 10000,                   // 10s per HTTP check
  pingTimeout: 5,                       // 5s ping timeout

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    ownerId: process.env.TELEGRAM_OWNER_ID,
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER,
    toNumber: process.env.LEE_MOBILE || '+447935237704',
  },

  aws: {
    region: process.env.AWS_REGION || 'eu-west-2',
    namespace: 'NAVADA/Alerts',
  },

  botStandby: {
    botDir: '/home/ubuntu/navada-bot',
    checksBeforeStart: 3, // 3 x 5 min = 15 min
  },
};

// ---------------------------------------------------------------------------
// Endpoint definitions
// ---------------------------------------------------------------------------
const ENDPOINTS = [
  // --- HP (100.121.187.67) ---
  { name: 'HP Tailscale Ping',  group: 'HP',         type: 'ping', host: '100.121.187.67', critical: true },
  { name: 'Telegram Bot',       group: 'HP',         type: 'http', url: 'http://100.121.187.67:3456/health' },
  { name: 'WorldMonitor',       group: 'HP',         type: 'http', url: 'http://100.121.187.67:4173' },
  { name: 'WorldMonitor API',   group: 'HP',         type: 'http', url: 'http://100.121.187.67:46123' },
  { name: 'NAVADA Flix',        group: 'HP',         type: 'http', url: 'http://100.121.187.67:4000' },
  { name: 'Trading API',        group: 'HP',         type: 'http', url: 'http://100.121.187.67:5678' },
  { name: 'Network Scanner',    group: 'HP',         type: 'http', url: 'http://100.121.187.67:7777' },

  // --- Oracle (100.77.206.9) ---
  { name: 'Oracle Tailscale Ping', group: 'Oracle',  type: 'ping', host: '100.77.206.9', critical: true },
  { name: 'Nginx (Oracle)',        group: 'Oracle',  type: 'http', url: 'http://100.77.206.9:80' },
  { name: 'Elasticsearch',        group: 'Oracle',   type: 'http', url: 'http://100.77.206.9:9200' },
  { name: 'Kibana',               group: 'Oracle',   type: 'http', url: 'http://100.77.206.9:5601' },
  { name: 'Grafana',              group: 'Oracle',   type: 'http', url: 'http://100.77.206.9:3000' },
  { name: 'CloudBeaver',          group: 'Oracle',   type: 'http', url: 'http://100.77.206.9:8978' },

  // --- Cloudflare (public HTTPS) ---
  { name: 'CF API Health',  group: 'Cloudflare', type: 'http', url: 'https://api.navada-edge-server.uk/health' },
  { name: 'CF Flix',         group: 'Cloudflare', type: 'http', url: 'https://flix.navada-edge-server.uk' },
  { name: 'CF Dashboard',   group: 'Cloudflare', type: 'http', url: 'https://dashboard.navada-edge-server.uk' },
];

// ---------------------------------------------------------------------------
// State tracking (per-endpoint)
// ---------------------------------------------------------------------------
const state = {
  endpoints: {},
  groupAllDown: { HP: 0, Oracle: 0 },
  ec2BotRunning: false,
  botDownChecks: 0,
  failoverActive: false,
  failoverTriggered: false,
};

for (const ep of ENDPOINTS) {
  state.endpoints[ep.name] = {
    consecutiveFails: 0,
    lastAlertTime: 0,
    alertCount: 0,
    lastError: null,
    lastStatus: 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// ---------------------------------------------------------------------------
// HTTP request helper (returns promise)
// ---------------------------------------------------------------------------
function httpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const mod = parsed.protocol === 'https:' ? https : http;
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: CONFIG.httpTimeout,
      rejectUnauthorized: false,
    };

    const req = mod.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', (err) => reject(err));

    if (options.body) req.write(options.body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Ping host
// ---------------------------------------------------------------------------
function pingHost(host) {
  return new Promise((resolve) => {
    exec(
      `ping -c 1 -W ${CONFIG.pingTimeout} ${host}`,
      { timeout: (CONFIG.pingTimeout + 3) * 1000 },
      (err) => resolve(!err)
    );
  });
}

// ---------------------------------------------------------------------------
// Check a single endpoint
// ---------------------------------------------------------------------------
async function checkEndpoint(ep) {
  try {
    if (ep.type === 'ping') {
      const ok = await pingHost(ep.host);
      if (!ok) throw new Error('Ping failed');
      return { ok: true };
    }
    if (ep.type === 'http') {
      const res = await httpRequest(ep.url);
      if (res.statusCode >= 200 && res.statusCode < 500) {
        return { ok: true, statusCode: res.statusCode };
      }
      throw new Error(`HTTP ${res.statusCode}`);
    }
    throw new Error(`Unknown type: ${ep.type}`);
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Telegram: Send message directly via Bot API (bypasses HP bot)
// ---------------------------------------------------------------------------
async function sendTelegram(text) {
  const { botToken, ownerId } = CONFIG.telegram;
  if (!botToken || !ownerId) {
    log('[TELEGRAM] Missing BOT_TOKEN or OWNER_ID, skipping');
    return false;
  }
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = JSON.stringify({
      chat_id: ownerId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    const res = await httpRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = JSON.parse(res.body);
    if (!data.ok) {
      log(`[TELEGRAM] API error: ${data.description}`);
      return false;
    }
    log('[TELEGRAM] Alert sent');
    return true;
  } catch (err) {
    log(`[TELEGRAM] Send failed: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Twilio: Send SMS for critical node-level failures
// ---------------------------------------------------------------------------
async function sendSMS(message) {
  const { accountSid, authToken, fromNumber, toNumber } = CONFIG.twilio;
  if (!accountSid || !authToken || !fromNumber) {
    log('[SMS] Missing Twilio credentials, skipping');
    return false;
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = `To=${encodeURIComponent(toNumber)}&From=${encodeURIComponent(fromNumber)}&Body=${encodeURIComponent(message)}`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body,
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      log(`[SMS] Alert sent to ${toNumber}`);
      return true;
    }
    log(`[SMS] Failed: HTTP ${res.statusCode} ${res.body}`);
    return false;
  } catch (err) {
    log(`[SMS] Error: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// CloudWatch: Push custom metric
// ---------------------------------------------------------------------------
function pushCloudWatchMetric(metricName, value, dimensions = []) {
  // Use single dimension string to avoid shell parsing issues
  const dimStr = dimensions
    .map((d) => `Name=${d.Name},Value=${d.Value.replace(/\s+/g, '_')}`)
    .join(',');
  const args = [
    'cloudwatch', 'put-metric-data',
    '--namespace', 'NAVADA',
    '--metric-name', metricName,
    '--value', String(value),
    '--unit', 'Count',
    '--region', CONFIG.aws.region,
  ];
  if (dimStr) args.push('--dimensions', dimStr);
  const cmd = 'aws ' + args.map(a => `"${a}"`).join(' ');

  exec(cmd, { timeout: 15000 }, (err) => {
    if (err) log(`[CLOUDWATCH] Metric push failed: ${err.message}`);
  });
}

// ---------------------------------------------------------------------------
// Bot standby management (only ONE bot polls Telegram at a time)
// ---------------------------------------------------------------------------
function startEC2Bot() {
  if (state.ec2BotRunning) return;
  const { botDir } = CONFIG.botStandby;

  exec(
    `test -d ${botDir} && cd ${botDir} && pm2 start telegram-bot.js --name ec2-telegram-bot 2>&1`,
    { timeout: 20000 },
    (err, stdout) => {
      if (err) {
        log(`[BOT-STANDBY] Failed to start EC2 bot: ${err.message}`);
        return;
      }
      state.ec2BotRunning = true;
      log('[BOT-STANDBY] EC2 Telegram bot STARTED (HP bot down 15+ min)');
      sendTelegram(
        '<b>BOT FAILOVER</b>\n\n' +
          'EC2 standby bot activated.\n' +
          'HP Telegram bot has been down for 15+ minutes.'
      );
    }
  );
}

function stopEC2Bot() {
  if (!state.ec2BotRunning) return;
  exec(
    'pm2 stop ec2-telegram-bot 2>/dev/null && pm2 delete ec2-telegram-bot 2>/dev/null',
    { timeout: 15000 },
    () => {
      state.ec2BotRunning = false;
      log('[BOT-STANDBY] EC2 Telegram bot STOPPED (HP bot recovered)');
      sendTelegram(
        '<b>BOT RECOVERY</b>\n\n' +
          'HP Telegram bot is back online.\n' +
          'EC2 standby bot deactivated.'
      );
    }
  );
}

// ---------------------------------------------------------------------------
// Failover: HP -> Oracle
// ---------------------------------------------------------------------------
function sshOracle(command) {
  return new Promise((resolve, reject) => {
    const cmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 ubuntu@100.77.206.9 "${command}"`;
    log(`[SSH-ORACLE] ${command}`);
    exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) reject(new Error(`SSH failed: ${stderr || error.message}`));
      else resolve(stdout.trim());
    });
  });
}

async function triggerFailover() {
  if (state.failoverTriggered) {
    log('[FAILOVER] Already triggered, skipping');
    return;
  }
  state.failoverTriggered = true;
  log('=== TRIGGERING HP -> ORACLE FAILOVER ===');

  try {
    await sshOracle('test -f /home/ubuntu/failover.sh && bash /home/ubuntu/failover.sh');
    state.failoverActive = true;
    log('=== FAILOVER ACTIVATED ===');
  } catch (err) {
    log(`[FAILOVER] Activation failed: ${err.message}`);
    state.failoverTriggered = false; // allow retry
  }

  await sendTelegram(
    '<b>FAILOVER ACTIVATED</b>\n\n' +
      'HP has been completely unreachable for 15+ minutes.\n' +
      'Traffic redirected to Oracle VM.'
  );
  await sendSMS(
    'NAVADA ALERT: HP server down 15+ min. Failover to Oracle activated. Check infrastructure.'
  );
}

async function triggerFailback() {
  if (!state.failoverActive) return;
  log('=== TRIGGERING ORACLE -> HP FAILBACK ===');

  try {
    await sshOracle('test -f /home/ubuntu/failback.sh && bash /home/ubuntu/failback.sh');
    state.failoverActive = false;
    state.failoverTriggered = false;
    log('=== FAILBACK COMPLETE ===');
  } catch (err) {
    log(`[FAILBACK] Failed: ${err.message}`);
  }

  await sendTelegram(
    '<b>FAILBACK COMPLETE</b>\n\n' +
      'HP server is back online.\n' +
      'Traffic restored to HP. Oracle failover deactivated.'
  );
}

// ---------------------------------------------------------------------------
// Alert formatting
// ---------------------------------------------------------------------------
function formatAlert(failedList, passedList, timestamp) {
  const lines = ['<b>NAVADA ALERT</b>', ''];

  for (const f of failedList) {
    lines.push(`FAILED: ${f.name} (${f.group}) - ${f.error}`);
  }
  lines.push('');

  if (passedList.length > 0) {
    lines.push(`OK: ${passedList.map((p) => p.name).join(', ')}`);
    lines.push('');
  }

  lines.push(`Time: ${timestamp}`);
  lines.push('Source: EC2 Health Monitor');
  lines.push('Next check: 5 min');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Alert cooldown logic (per-endpoint)
// ---------------------------------------------------------------------------
function shouldAlert(epName) {
  const s = state.endpoints[epName];
  if (s.consecutiveFails < 1) return false;

  const now = Date.now();
  const elapsed = now - s.lastAlertTime;

  // First alert on a new failure: 5 min cooldown (but immediate on first ever)
  if (s.alertCount === 0) {
    return elapsed >= CONFIG.alertCooldownFirst || s.lastAlertTime === 0;
  }
  // Repeat alerts: 30 min cooldown
  return elapsed >= CONFIG.alertCooldownRepeat;
}

// ---------------------------------------------------------------------------
// Main check cycle
// ---------------------------------------------------------------------------
async function runChecks() {
  const timestamp = new Date()
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z/, ' UTC');
  log('--- Health Check ---');

  // Run all checks in parallel
  const results = await Promise.all(
    ENDPOINTS.map(async (ep) => {
      const result = await checkEndpoint(ep);
      return { ...ep, ...result };
    })
  );

  // Categorise results and update per-endpoint state
  const failed = [];
  const passed = [];
  const alertable = [];

  for (const r of results) {
    const s = state.endpoints[r.name];

    if (r.ok) {
      // Service is healthy
      if (s.consecutiveFails > 0) {
        log(`  [RECOVERED] ${r.name} (was down for ${s.consecutiveFails} checks)`);
      }
      s.consecutiveFails = 0;
      s.lastError = null;
      s.alertCount = 0;
      s.lastStatus = 'ok';
      passed.push(r);
      log(`  [OK] ${r.name}`);
    } else {
      // Service is failing
      s.consecutiveFails++;
      s.lastError = r.error;
      s.lastStatus = 'fail';
      failed.push({
        name: r.name,
        group: r.group,
        error: r.error,
        critical: r.critical,
      });
      log(`  [FAIL ${s.consecutiveFails}] ${r.name}: ${r.error}`);

      // Push per-service CloudWatch metric
      pushCloudWatchMetric('ServiceFailure', 1, [
        { Name: 'Service', Value: r.name },
        { Name: 'Group', Value: r.group },
      ]);

      // Check if this endpoint should trigger an alert
      if (shouldAlert(r.name)) {
        alertable.push({ name: r.name, group: r.group, error: r.error });
        s.lastAlertTime = Date.now();
        s.alertCount++;
      }
    }
  }

  // --- Group-level analysis ---
  const hpResults = results.filter((r) => r.group === 'HP');
  const oracleResults = results.filter((r) => r.group === 'Oracle');
  const hpAllDown = hpResults.length > 0 && hpResults.every((r) => !r.ok);
  const oracleAllDown =
    oracleResults.length > 0 && oracleResults.every((r) => !r.ok);

  // HP all-down tracking
  if (hpAllDown) {
    state.groupAllDown.HP++;
    log(
      `  [HP ALL DOWN] Consecutive: ${state.groupAllDown.HP}/${CONFIG.failThreshold}`
    );
  } else {
    if (state.groupAllDown.HP >= CONFIG.failThreshold && state.failoverActive) {
      log('  [HP RECOVERED] Triggering failback...');
      await triggerFailback();
    }
    state.groupAllDown.HP = 0;
  }

  // Oracle all-down tracking
  if (oracleAllDown) {
    state.groupAllDown.Oracle++;
    log(
      `  [ORACLE ALL DOWN] Consecutive: ${state.groupAllDown.Oracle}/${CONFIG.failThreshold}`
    );
  } else {
    state.groupAllDown.Oracle = 0;
  }

  // --- Bot standby management ---
  const botState = state.endpoints['Telegram Bot'];
  if (botState && botState.lastStatus === 'fail') {
    state.botDownChecks++;
    log(
      `  [BOT] Down for ${state.botDownChecks}/${CONFIG.botStandby.checksBeforeStart} checks`
    );
    if (state.botDownChecks >= CONFIG.botStandby.checksBeforeStart) {
      startEC2Bot();
    }
  } else {
    if (state.botDownChecks >= CONFIG.botStandby.checksBeforeStart) {
      stopEC2Bot();
    }
    state.botDownChecks = 0;
  }

  // --- Failover trigger (HP completely down for 3 checks) ---
  if (
    state.groupAllDown.HP >= CONFIG.failThreshold &&
    !state.failoverTriggered
  ) {
    await triggerFailover();
  }

  // --- Send alerts ---
  if (alertable.length > 0) {
    const alertMsg = formatAlert(alertable, passed, timestamp);
    await sendTelegram(alertMsg);

    // SMS for critical: entire node down
    if (hpAllDown || oracleAllDown) {
      const downNode = hpAllDown && oracleAllDown ? 'HP + Oracle' : hpAllDown ? 'HP' : 'Oracle';
      await sendSMS(
        `NAVADA ALERT: ${downNode} COMPLETELY DOWN. ${alertable.length} service(s) failing. Check immediately.`
      );
    }

    // Aggregate CloudWatch metric
    pushCloudWatchMetric('TotalFailures', alertable.length);
  }

  // Summary
  log(`  Summary: ${passed.length} OK, ${failed.length} FAILED`);
  if (failed.length === 0) log('  All services healthy.');
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
function start() {
  const divider = '='.repeat(60);
  const groups = [...new Set(ENDPOINTS.map((e) => e.group))];

  log(divider);
  log('NAVADA Edge -- EC2 Network-Wide Health Monitor');
  log(divider);
  log(`Monitoring ${ENDPOINTS.length} endpoints across: ${groups.join(', ')}`);
  log(`Check interval: ${CONFIG.checkInterval / 1000}s`);
  log(`Fail threshold: ${CONFIG.failThreshold} consecutive`);
  log(
    `Alert cooldown: ${CONFIG.alertCooldownFirst / 1000}s first, ${CONFIG.alertCooldownRepeat / 1000}s repeat`
  );
  log(`Telegram: ${CONFIG.telegram.botToken ? 'configured' : 'NOT configured'}`);
  log(`Twilio SMS: ${CONFIG.twilio.accountSid ? 'configured' : 'NOT configured'}`);
  log(`Bot standby dir: ${CONFIG.botStandby.botDir}`);
  log(divider);

  // Run immediately, then on interval
  runChecks().catch((err) => log(`[FATAL] ${err.stack || err.message}`));
  setInterval(() => {
    runChecks().catch((err) => log(`[FATAL] ${err.stack || err.message}`));
  }, CONFIG.checkInterval);
}

start();
