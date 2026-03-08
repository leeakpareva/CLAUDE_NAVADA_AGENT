#!/usr/bin/env node
/**
 * NAVADA World View Health Monitor
 * Runs on EC2 — checks all WorldMonitor endpoints every 60s
 * Pushes metrics to CloudWatch (NAVADA/WorldView namespace)
 * Sends Telegram alert if any endpoint is down for >2 consecutive checks
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const NAMESPACE = 'NAVADA/WorldView';
const REGION = 'eu-west-2';
const INTERVAL_MS = 60_000;
const BASE_URL = 'http://localhost:4000';
const TELEGRAM_TOKEN = '8594117952:AAF-VciUPKcUF6DUDVrB8vAK35tluMIZ6i8';
const TELEGRAM_CHAT = '6920669447';
const METRIC_TMP = '/tmp/navada-worldview-metrics.json';

// Track consecutive failures for alerting
const failCounts = {};
const ALERT_THRESHOLD = 2; // Alert after 2 consecutive fails
let lastAlertTime = 0;
const ALERT_COOLDOWN = 300_000; // 5 min cooldown between alerts

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`${BASE_URL}${path}`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          up: res.statusCode === 200 ? 1 : 0,
          status: res.statusCode,
          ms: Date.now() - start,
          body: data,
        });
      });
    });
    req.on('error', () => resolve({ up: 0, status: 0, ms: Date.now() - start, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ up: 0, status: 0, ms: 10000, body: '' }); });
  });
}

function sendTelegram(message) {
  const now = Date.now();
  if (now - lastAlertTime < ALERT_COOLDOWN) return;
  lastAlertTime = now;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = JSON.stringify({ chat_id: TELEGRAM_CHAT, text: message, parse_mode: 'Markdown' });

  const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length } });
  req.on('error', () => {});
  req.write(payload);
  req.end();
}

function putMetrics(metricData) {
  try {
    fs.writeFileSync(METRIC_TMP, JSON.stringify(metricData));
    execSync(
      `aws cloudwatch put-metric-data --namespace "${NAMESPACE}" --region ${REGION} --metric-data file://${METRIC_TMP}`,
      { encoding: 'utf-8', timeout: 30000, stdio: 'pipe' }
    );
    return true;
  } catch (e) {
    console.error(`[${ts()}] CloudWatch push failed:`, e.message);
    return false;
  }
}

async function collect() {
  const [site, alerts, insights, analytics] = await Promise.all([
    checkEndpoint('/'),
    checkEndpoint('/api/alerts'),
    checkEndpoint('/api/insights'),
    checkEndpoint('/api/analytics'),
  ]);

  // Parse alert count from response
  let alertCount = 0;
  let feedSourceCount = 0;
  try {
    const alertData = JSON.parse(alerts.body);
    if (Array.isArray(alertData)) {
      alertCount = alertData.length;
      const sources = new Set(alertData.map(a => a.source));
      feedSourceCount = sources.size;
    }
  } catch {}

  const now = new Date().toISOString();
  const metricData = [
    { MetricName: 'SiteUp', Value: site.up, Unit: 'None', Timestamp: now },
    { MetricName: 'AlertsApiUp', Value: alerts.up, Unit: 'None', Timestamp: now },
    { MetricName: 'InsightsApiUp', Value: insights.up, Unit: 'None', Timestamp: now },
    { MetricName: 'AnalyticsApiUp', Value: analytics.up, Unit: 'None', Timestamp: now },
    { MetricName: 'ResponseTimeMs', Value: site.ms, Unit: 'Milliseconds', Timestamp: now },
    { MetricName: 'AlertsResponseMs', Value: alerts.ms, Unit: 'Milliseconds', Timestamp: now },
    { MetricName: 'InsightsResponseMs', Value: insights.ms, Unit: 'Milliseconds', Timestamp: now },
    { MetricName: 'AlertCount', Value: alertCount, Unit: 'Count', Timestamp: now },
    { MetricName: 'FeedSourceCount', Value: feedSourceCount, Unit: 'Count', Timestamp: now },
  ];

  const ok = putMetrics(metricData);

  // Check for failures and alert
  const endpoints = { 'Site': site, '/api/alerts': alerts, '/api/insights': insights, '/api/analytics': analytics };
  const failures = [];

  for (const [name, result] of Object.entries(endpoints)) {
    if (result.up === 0) {
      failCounts[name] = (failCounts[name] || 0) + 1;
      if (failCounts[name] >= ALERT_THRESHOLD) {
        failures.push(`${name} (${failCounts[name]} consecutive fails, status=${result.status})`);
      }
    } else {
      if (failCounts[name] >= ALERT_THRESHOLD) {
        // Recovered — send recovery message
        sendTelegram(`✅ *NAVADA World View RECOVERED*\n${name} is back online after ${failCounts[name]} failures`);
      }
      failCounts[name] = 0;
    }
  }

  if (failures.length > 0) {
    sendTelegram(
      `🚨 *NAVADA World View DOWN*\n\n${failures.join('\n')}\n\nHost: EC2 (100.98.118.33)\nURL: world.navada-edge-server.uk`
    );
  }

  console.log(
    `[${ts()}] ${ok ? '✓' : '✗'} Site=${site.up}(${site.ms}ms) Alerts=${alerts.up}(${alerts.ms}ms,${alertCount}) ` +
    `Insights=${insights.up}(${insights.ms}ms) Analytics=${analytics.up}(${analytics.ms}ms) Sources=${feedSourceCount}`
  );
}

console.log(`[${ts()}] NAVADA World View Health Monitor starting`);
console.log(`[${ts()}] Namespace: ${NAMESPACE} | Checking: ${BASE_URL} | Interval: ${INTERVAL_MS / 1000}s`);

collect();
setInterval(collect, INTERVAL_MS);

process.on('SIGINT', () => { console.log(`\n[${ts()}] Shutting down.`); process.exit(0); });
