#!/usr/bin/env node
/**
 * Cloudflare Metrics Collector for CloudWatch
 * Queries Cloudflare Analytics API every 5 min, pushes to NAVADA/Cloudflare namespace.
 * Also checks tunnel health and subdomain reachability.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { execSync } = require('child_process');
const https = require('https');

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = '38050dc00f45f0c23f8142b4d74525df';
const TUNNEL_ID = '7c9e3c36-162a-4bb3-9f4e-8aab3f552636';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ''; // Will extract from API
const NAMESPACE = 'NAVADA/Cloudflare';
const REGION = 'eu-west-2';
const INTERVAL = 5 * 60_000; // 5 minutes
const BASH = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/bash';

const SUBDOMAINS = [
  'api', 'flix', 'trading', 'network', 'kibana',
  'grafana', 'monitor', 'cloudbeaver', 'nodes', 'dashboard', 'logo'
];

let logger;
try { logger = require('./edge-logger'); } catch { logger = { log: async () => {} }; }

function cfApi(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.cloudflare.com/client/v4${path}`);
    const opts = {
      hostname: url.hostname, path: url.pathname + url.search,
      method, headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ success: false, errors: [{ message: data }] }); } });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function pushMetric(name, value, unit = 'Count', dims = '') {
  try {
    let cmd = `aws cloudwatch put-metric-data --namespace "${NAMESPACE}" --metric-name "${name}" --value ${value} --unit ${unit} --region ${REGION}`;
    if (dims) cmd += ` --dimensions "${dims}"`;
    execSync(cmd, { timeout: 10000, stdio: 'ignore', shell: BASH, windowsHide: true });
  } catch {}
}

function checkUrl(url, timeoutMs = 10000) {
  return new Promise(resolve => {
    const start = Date.now();
    const req = https.get(url, { timeout: timeoutMs }, res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - start }));
    });
    req.on('error', () => resolve({ status: 0, ms: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ms: timeoutMs }); });
  });
}

async function collect() {
  const ts = new Date().toISOString();
  console.log(`[${ts}] Collecting Cloudflare metrics...`);

  // --- Zone Analytics (GraphQL) ---
  try {
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const until = new Date().toISOString();
    const query = `{
      viewer {
        zones(filter: {zoneTag: "${ZONE_ID}"}) {
          httpRequests1mGroups(limit: 10, filter: {datetime_gt: "${since}", datetime_lt: "${until}"}) {
            sum { requests bytes cachedRequests cachedBytes threats }
            dimensions { datetime }
          }
        }
      }
    }`;
    const resp = await cfApi('/graphql', 'POST', { query });
    if (resp.data?.viewer?.zones?.[0]?.httpRequests1mGroups) {
      const groups = resp.data.viewer.zones[0].httpRequests1mGroups;
      let totalReqs = 0, totalBytes = 0, totalCached = 0, totalCachedBytes = 0, totalThreats = 0;
      for (const g of groups) {
        totalReqs += g.sum.requests || 0;
        totalBytes += g.sum.bytes || 0;
        totalCached += g.sum.cachedRequests || 0;
        totalCachedBytes += g.sum.cachedBytes || 0;
        totalThreats += g.sum.threats || 0;
      }
      const cacheRate = totalReqs > 0 ? Math.round(totalCached / totalReqs * 100) : 0;

      pushMetric('RequestCount', totalReqs);
      pushMetric('BandwidthBytes', totalBytes, 'Bytes');
      pushMetric('CachedRequests', totalCached);
      pushMetric('CachedBytes', totalCachedBytes, 'Bytes');
      pushMetric('CacheHitRate', cacheRate, 'Percent');
      pushMetric('Threats', totalThreats);

      console.log(`[${ts}] Zone: ${totalReqs} reqs, ${Math.round(totalBytes/1024)}KB, cache ${cacheRate}%, ${totalThreats} threats`);
    }
  } catch (e) {
    console.error(`[${ts}] Analytics error: ${e.message?.substring(0, 80)}`);
  }

  // --- Tunnel Status ---
  try {
    // Check tunnel by hitting a proxied subdomain
    const { status, ms } = await checkUrl('https://api.navada-edge-server.uk/health', 10000);
    const tunnelUp = (status >= 200 && status < 500) ? 1 : 0;
    pushMetric('TunnelStatus', tunnelUp);
    pushMetric('TunnelLatencyMs', ms, 'Milliseconds');
    console.log(`[${ts}] Tunnel: ${tunnelUp ? 'UP' : 'DOWN'} (${ms}ms, HTTP ${status})`);
  } catch (e) {
    pushMetric('TunnelStatus', 0);
    console.error(`[${ts}] Tunnel check error: ${e.message?.substring(0, 80)}`);
  }

  // --- Subdomain Health ---
  let upCount = 0;
  for (const sub of SUBDOMAINS) {
    try {
      const { status, ms } = await checkUrl(`https://${sub}.navada-edge-server.uk`, 10000);
      const up = (status >= 200 && status < 500) ? 1 : 0;
      if (up) upCount++;
      pushMetric('SubdomainStatus', up, 'Count', `Name=Subdomain,Value=${sub}`);
      pushMetric('SubdomainLatencyMs', ms, 'Milliseconds', `Name=Subdomain,Value=${sub}`);
    } catch {
      pushMetric('SubdomainStatus', 0, 'Count', `Name=Subdomain,Value=${sub}`);
    }
  }
  pushMetric('SubdomainsUp', upCount);
  console.log(`[${ts}] Subdomains: ${upCount}/${SUBDOMAINS.length} up`);

  // --- R2 Bucket ---
  try {
    const r2 = require('./cloudflare-r2');
    const objects = await r2.listObjects('');
    pushMetric('R2ObjectCount', objects?.length || 0);
    console.log(`[${ts}] R2: ${objects?.length || 0} objects`);
  } catch (e) {
    console.error(`[${ts}] R2 error: ${e.message?.substring(0, 60)}`);
  }

  // --- DNS Record Count ---
  try {
    const dns = await cfApi(`/zones/${ZONE_ID}/dns_records?per_page=50`);
    if (dns.success) {
      pushMetric('DNSRecordCount', dns.result?.length || 0);
    }
  } catch {}

  logger.log({
    node: 'HP', eventType: 'metric', service: 'cloudflare-metrics', level: 'info',
    message: `CF: ${upCount}/${SUBDOMAINS.length} subdomains up`
  }).catch(() => {});

  console.log(`[${ts}] Done.`);
}

if (!CF_TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN not set in .env');
  process.exit(1);
}

console.log(`[${new Date().toISOString()}] Cloudflare metrics collector started (every ${INTERVAL / 1000}s)`);
collect();
setInterval(collect, INTERVAL);
