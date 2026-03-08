/**
 * NAVADA Network Connectivity Test
 * Tests all services, latency, and stability on current connection
 */
require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

const results = [];
const startTime = Date.now();

function log(test, status, latency, details) {
  results.push({ test, status, latency, details });
  const icon = status === 'OK' ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${test} — ${latency}ms — ${details}`);
}

function httpGet(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, latency: Date.now() - start, data }));
    });
    req.on('error', e => reject({ error: e.message, latency: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); reject({ error: 'timeout', latency: timeout }); });
  });
}

function ping(host) {
  return new Promise((resolve) => {
    exec(`ping -n 5 ${host}`, (err, stdout) => {
      const avgMatch = stdout?.match(/Average = (\d+)ms/);
      const lossMatch = stdout?.match(/Lost = \d+ \((\d+)%/);
      resolve({
        avg: avgMatch ? parseInt(avgMatch[1]) : null,
        loss: lossMatch ? parseInt(lossMatch[1]) : null,
        raw: stdout
      });
    });
  });
}

async function run() {
  const ifaces = os.networkInterfaces();
  const eth = ifaces['Ethernet'];
  const wifi = ifaces['WiFi'];
  const ethIp = eth ? eth.find(i => i.family === 'IPv4')?.address : null;
  const wifiIp = wifi ? wifi.find(i => i.family === 'IPv4')?.address : null;
  const activeIp = ethIp || wifiIp || 'unknown';
  const connType = ethIp ? 'ETHERNET' : 'WIFI';

  console.log('');
  console.log('========================================');
  console.log(`NAVADA Network Test — ${new Date().toISOString()}`);
  console.log(`Connection: ${connType} | IP: ${activeIp}`);
  console.log('========================================');

  // 1. Ping tests
  console.log('\n--- PING TESTS (5 packets each) ---');
  const google = await ping('8.8.8.8');
  log('Google DNS (8.8.8.8)', google.loss === 0 ? 'OK' : 'FAIL', google.avg, `Avg: ${google.avg}ms, Loss: ${google.loss}%`);

  const cf = await ping('1.1.1.1');
  log('Cloudflare DNS (1.1.1.1)', cf.loss === 0 ? 'OK' : 'FAIL', cf.avg, `Avg: ${cf.avg}ms, Loss: ${cf.loss}%`);

  const router = await ping('192.168.0.1');
  log('Router (192.168.0.1)', router.loss === 0 ? 'OK' : 'FAIL', router.avg, `Avg: ${router.avg}ms, Loss: ${router.loss}%`);

  // 2. Cloudflare Tunnel
  console.log('\n--- CLOUDFLARE TUNNEL ---');
  try {
    const tunnel = await httpGet('https://api.navada-edge-server.uk/twilio/health');
    log('Cloudflare Tunnel (health)', tunnel.status === 200 ? 'OK' : 'FAIL', tunnel.latency, `HTTP ${tunnel.status}`);
  } catch (e) { log('Cloudflare Tunnel', 'FAIL', e.latency, e.error); }

  // 3. Local services
  console.log('\n--- LOCAL SERVICES ---');
  try {
    const wm = await httpGet('http://localhost:4173');
    log('WorldMonitor (:4173)', wm.status < 400 ? 'OK' : 'FAIL', wm.latency, `HTTP ${wm.status}`);
  } catch (e) { log('WorldMonitor (:4173)', 'FAIL', e.latency, e.error); }

  try {
    const api = await httpGet('http://localhost:46123/api/rss-proxy?url=https://feeds.bbci.co.uk/news/world/rss.xml');
    log('WorldMonitor API RSS (:46123)', api.status === 200 ? 'OK' : 'FAIL', api.latency, `HTTP ${api.status}, ${(api.data || '').length} bytes`);
  } catch (e) { log('WorldMonitor API RSS (:46123)', 'FAIL', e.latency, e.error); }

  try {
    const trade = await httpGet('http://localhost:5678/health');
    log('Trading API (:5678)', trade.status === 200 ? 'OK' : 'FAIL', trade.latency, `HTTP ${trade.status}`);
  } catch (e) { log('Trading API (:5678)', 'FAIL', e.latency, e.error); }

  try {
    const webhook = await httpGet('http://localhost:3456/twilio/health');
    log('Twilio Webhook (:3456)', webhook.status === 200 ? 'OK' : 'FAIL', webhook.latency, `HTTP ${webhook.status}`);
  } catch (e) { log('Twilio Webhook (:3456)', 'FAIL', e.latency, e.error); }

  // 4. External APIs
  console.log('\n--- EXTERNAL APIS ---');
  try {
    const tg = await httpGet('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/getMe');
    log('Telegram API', tg.status === 200 ? 'OK' : 'FAIL', tg.latency, `HTTP ${tg.status}`);
  } catch (e) { log('Telegram API', 'FAIL', e.latency, e.error); }

  try {
    const tw = await httpGet('https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '.json');
    log('Twilio API', tw.status < 500 ? 'OK' : 'FAIL', tw.latency, `HTTP ${tw.status}`);
  } catch (e) { log('Twilio API', 'FAIL', e.latency, e.error); }

  try {
    const anth = await httpGet('https://api.anthropic.com/v1/models');
    log('Anthropic API', anth.status < 500 ? 'OK' : 'FAIL', anth.latency, `HTTP ${anth.status}`);
  } catch (e) { log('Anthropic API', 'FAIL', e.latency, e.error); }

  try {
    const oai = await httpGet('https://api.openai.com/v1/models');
    log('OpenAI API', oai.status < 500 ? 'OK' : 'FAIL', oai.latency, `HTTP ${oai.status}`);
  } catch (e) { log('OpenAI API', 'FAIL', e.latency, e.error); }

  // 5. Tailscale
  console.log('\n--- TAILSCALE ---');
  const ts = await ping('100.121.187.67');
  log('Tailscale self-ping', ts.loss === 0 ? 'OK' : 'FAIL', ts.avg, `Avg: ${ts.avg}ms, Loss: ${ts.loss}%`);

  // 6. DNS resolution speed
  console.log('\n--- DNS RESOLUTION ---');
  const dnsStart = Date.now();
  try {
    await httpGet('https://www.google.com', 5000);
    const dnsTime = Date.now() - dnsStart;
    log('DNS + HTTPS (google.com)', 'OK', dnsTime, `${dnsTime}ms total`);
  } catch (e) {
    log('DNS + HTTPS (google.com)', 'FAIL', Date.now() - dnsStart, e.error);
  }

  // 7. Sustained throughput test (10 rapid requests)
  console.log('\n--- SUSTAINED LOAD (10 rapid requests) ---');
  const rapidStart = Date.now();
  let rapidOk = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await httpGet('https://api.navada-edge-server.uk/twilio/health', 5000);
      rapidOk++;
    } catch (e) { /* count failure */ }
  }
  const rapidTime = Date.now() - rapidStart;
  const rapidAvg = Math.round(rapidTime / 10);
  log('Sustained load (10x tunnel)', rapidOk === 10 ? 'OK' : 'FAIL', rapidAvg, `${rapidOk}/10 success, avg ${rapidAvg}ms, total ${rapidTime}ms`);

  // Summary
  const passed = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const avgLatency = Math.round(results.filter(r => r.latency > 0).reduce((a, r) => a + r.latency, 0) / results.length);

  console.log('');
  console.log('========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`Average latency: ${avgLatency}ms`);
  console.log(`Connection: ${connType} | IP: ${activeIp}`);
  console.log(`Total test time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('========================================');
  console.log('');

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    connection: connType,
    ip: activeIp,
    passed, failed, avgLatency,
    totalTimeMs: Date.now() - startTime,
    tests: results
  };
  const logPath = __dirname + '/logs/network-test-' + connType.toLowerCase() + '.json';
  fs.writeFileSync(logPath, JSON.stringify(report, null, 2));
  console.log(`Saved to ${logPath}`);
}

run().catch(console.error);
