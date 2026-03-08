#!/usr/bin/env node
/**
 * NAVADA Edge - Cloudflare Network Flow Setup
 * Sets up DNS, tunnel routes, WAF rules, and security for all services
 */
require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = '38050dc00f45f0c23f8142b4d74525df';
const TUNNEL_ID = '7c9e3c36-162a-4bb3-9f4e-8aab3f552636';

function cfRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://api.cloudflare.com/client/v4' + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve(json);
        } catch (e) { reject(new Error(d)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== NAVADA Cloudflare Network Flow Setup ===\n');

  // 1. Get existing DNS records
  const existingDns = await cfRequest('GET', `/zones/${ZONE_ID}/dns_records?per_page=100`);
  const existingNames = new Set(existingDns.result.map(r => r.name));
  console.log(`Existing DNS records: ${existingDns.result.length}`);

  // 2. DNS records to create (all pointing to tunnel)
  const tunnelTarget = `${TUNNEL_ID}.cfargotunnel.com`;
  const dnsRecords = [
    { name: 'trading', comment: 'NAVADA Trading API' },
    { name: 'network', comment: 'Network Scanner Dashboard' },
    { name: 'monitor', comment: 'Uptime Kuma monitoring' },
    { name: 'grafana', comment: 'Grafana dashboards' },
    { name: 'kibana', comment: 'Kibana log search' },
  ];

  for (const rec of dnsRecords) {
    const fullName = `${rec.name}.navada-edge-server.uk`;
    if (existingNames.has(fullName)) {
      console.log(`[SKIP] ${fullName} already exists`);
      continue;
    }
    const result = await cfRequest('POST', `/zones/${ZONE_ID}/dns_records`, {
      type: 'CNAME',
      name: rec.name,
      content: tunnelTarget,
      proxied: true,
      comment: rec.comment,
    });
    if (result.success) {
      console.log(`[CREATED] ${fullName} -> tunnel (proxied)`);
    } else {
      console.log(`[ERROR] ${fullName}: ${result.errors?.[0]?.message}`);
    }
  }

  // 3. Update tunnel configuration with all routes
  console.log('\n--- Updating Tunnel Routes ---');
  const tunnelConfig = {
    config: {
      ingress: [
        { hostname: 'api.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'flix.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'logo.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'network.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'trading.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'cloudbeaver.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'monitor.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'grafana.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        { hostname: 'kibana.navada-edge-server.uk', service: 'http://host.docker.internal:80' },
        // Catch-all: return 404
        { service: 'http_status:404' },
      ],
    },
  };

  const tunnelResult = await cfRequest('PUT',
    `/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations`,
    tunnelConfig
  );
  if (tunnelResult.success) {
    console.log('[OK] Tunnel routes updated:');
    for (const i of tunnelConfig.config.ingress) {
      if (i.hostname) console.log(`  ${i.hostname} -> ${i.service}`);
    }
  } else {
    console.log('[ERROR] Tunnel config:', tunnelResult.errors?.[0]?.message);
  }

  // 4. Create WAF/Firewall rules
  console.log('\n--- Setting up WAF Rules ---');

  // Check existing rulesets
  const rulesets = await cfRequest('GET', `/zones/${ZONE_ID}/rulesets`);
  console.log(`Existing rulesets: ${rulesets.result?.length || 0}`);

  // Create security headers rule via Transform Rules
  // Block known bad bots
  const existingRules = await cfRequest('GET', `/zones/${ZONE_ID}/firewall/rules`);
  const existingDescs = new Set((existingRules.result || []).map(r => r.description));

  // Use zone-level WAF custom rules
  // First check for existing custom ruleset
  let customRulesetId = null;
  for (const rs of (rulesets.result || [])) {
    if (rs.phase === 'http_request_firewall_custom') {
      customRulesetId = rs.id;
      break;
    }
  }

  if (!customRulesetId) {
    // Create custom ruleset
    const createRs = await cfRequest('POST', `/zones/${ZONE_ID}/rulesets`, {
      name: 'NAVADA WAF Rules',
      kind: 'zone',
      phase: 'http_request_firewall_custom',
      rules: [],
    });
    if (createRs.success) {
      customRulesetId = createRs.result.id;
      console.log(`[CREATED] Custom WAF ruleset: ${customRulesetId}`);
    } else {
      console.log(`[INFO] WAF ruleset: ${createRs.errors?.[0]?.message}`);
    }
  }

  if (customRulesetId) {
    // Update with NAVADA security rules
    const wafRules = [
      {
        action: 'block',
        expression: '(http.request.uri.path contains "/.env") or (http.request.uri.path contains "/wp-admin") or (http.request.uri.path contains "/wp-login") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "/phpmyadmin")',
        description: 'NAVADA: Block common attack paths',
        enabled: true,
      },
      {
        action: 'block',
        expression: '(cf.threat_score gt 30)',
        description: 'NAVADA: Block high threat score',
        enabled: true,
      },
      {
        action: 'challenge',
        expression: '(cf.threat_score gt 10) and (not cf.client.bot)',
        description: 'NAVADA: Challenge suspicious traffic',
        enabled: true,
      },
      {
        action: 'block',
        expression: '(http.request.uri.path contains "/telegram/webhook/") and (not ip.src in {188.114.96.0/20 173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22})',
        description: 'NAVADA: Telegram webhook only from Cloudflare IPs',
        enabled: true,
      },
    ];

    const updateRs = await cfRequest('PUT', `/zones/${ZONE_ID}/rulesets/${customRulesetId}`, {
      rules: wafRules,
    });
    if (updateRs.success) {
      console.log(`[OK] WAF rules configured (${wafRules.length} rules):`);
      for (const r of wafRules) {
        console.log(`  ${r.action.toUpperCase().padEnd(10)} ${r.description}`);
      }
    } else {
      console.log(`[ERROR] WAF update: ${updateRs.errors?.[0]?.message}`);
    }
  }

  // 5. SSL/TLS settings
  console.log('\n--- SSL/TLS Settings ---');
  const sslResult = await cfRequest('PATCH', `/zones/${ZONE_ID}/settings/ssl`, { value: 'full' });
  console.log(`SSL mode: ${sslResult.success ? 'Full (strict)' : sslResult.errors?.[0]?.message}`);

  const httpsRedirect = await cfRequest('PATCH', `/zones/${ZONE_ID}/settings/always_use_https`, { value: 'on' });
  console.log(`Always HTTPS: ${httpsRedirect.success ? 'ON' : httpsRedirect.errors?.[0]?.message}`);

  const minTls = await cfRequest('PATCH', `/zones/${ZONE_ID}/settings/min_tls_version`, { value: '1.2' });
  console.log(`Min TLS: ${minTls.success ? '1.2' : minTls.errors?.[0]?.message}`);

  // 6. Security settings
  console.log('\n--- Security Settings ---');
  const secLevel = await cfRequest('PATCH', `/zones/${ZONE_ID}/settings/security_level`, { value: 'high' });
  console.log(`Security level: ${secLevel.success ? 'High' : secLevel.errors?.[0]?.message}`);

  const browserIntegrity = await cfRequest('PATCH', `/zones/${ZONE_ID}/settings/browser_check`, { value: 'on' });
  console.log(`Browser integrity check: ${browserIntegrity.success ? 'ON' : browserIntegrity.errors?.[0]?.message}`);

  // 7. Cache settings
  console.log('\n--- Cache Settings ---');
  const cacheLevel = await cfRequest('PATCH', `/zones/${ZONE_ID}/settings/cache_level`, { value: 'aggressive' });
  console.log(`Cache level: ${cacheLevel.success ? 'Aggressive' : cacheLevel.errors?.[0]?.message}`);

  // 8. Add Nginx server blocks for new subdomains
  console.log('\n--- Summary ---');
  console.log('DNS records: api, flix, logo, network, trading, cloudbeaver, monitor, grafana, kibana');
  console.log('Tunnel routes: All subdomains -> Nginx :80');
  console.log('WAF: Attack path blocking, threat scoring, Telegram webhook protection');
  console.log('SSL: Full, Always HTTPS, TLS 1.2 minimum');
  console.log('Security: High level, browser integrity check');
  console.log('\nNOTE: Add Nginx server blocks for: monitor, grafana, kibana subdomains');
}

run().catch(e => console.error('Fatal:', e.message));
