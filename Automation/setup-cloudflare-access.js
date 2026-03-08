#!/usr/bin/env node
/**
 * NAVADA Edge - Cloudflare Access (Zero Trust) Setup
 * Protects admin UIs with email OTP authentication
 * Admin UIs: Kibana, Grafana, CloudBeaver, Portainer (monitor left open for uptime checks)
 */
require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ADMIN_EMAIL = 'leeakpareva@gmail.com';

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
  console.log('=== NAVADA Cloudflare Access (Zero Trust) Setup ===\n');

  // 1. Check existing Access applications
  console.log('--- Checking existing Access apps ---');
  const existingApps = await cfRequest('GET',
    `/accounts/${ACCOUNT_ID}/access/apps`
  );
  if (!existingApps.success) {
    console.log(`[ERROR] Cannot list Access apps: ${existingApps.errors?.[0]?.message}`);
    console.log('Your API token may need "Access: Apps and Policies" permission.');
    console.log('Go to: https://dash.cloudflare.com/profile/api-tokens');
    console.log('Edit your token and add: Account > Access: Apps and Policies > Edit');
    return;
  }
  const existingNames = new Set((existingApps.result || []).map(a => a.name));
  console.log(`Existing Access apps: ${existingApps.result?.length || 0}`);
  for (const app of (existingApps.result || [])) {
    console.log(`  - ${app.name} (${app.domain || app.self_hosted_domains?.[0] || 'n/a'})`);
  }

  // 2. Check existing Access identity providers (for email OTP)
  console.log('\n--- Checking identity providers ---');
  const idps = await cfRequest('GET',
    `/accounts/${ACCOUNT_ID}/access/identity_providers`
  );
  if (idps.success) {
    const hasOTP = (idps.result || []).some(p => p.type === 'onetimepin');
    if (hasOTP) {
      console.log('[OK] One-time PIN (email OTP) provider already enabled');
    } else {
      console.log('[INFO] Enabling One-time PIN provider...');
      const createIdp = await cfRequest('POST',
        `/accounts/${ACCOUNT_ID}/access/identity_providers`,
        { name: 'One-time PIN', type: 'onetimepin', config: {} }
      );
      if (createIdp.success) {
        console.log('[OK] One-time PIN provider enabled');
      } else {
        console.log(`[ERROR] ${createIdp.errors?.[0]?.message}`);
      }
    }
  }

  // 3. Create Access applications for each admin UI
  const adminApps = [
    {
      name: 'NAVADA Kibana',
      domain: 'kibana.navada-edge-server.uk',
      purpose: 'ELK log search and analysis',
    },
    {
      name: 'NAVADA Grafana',
      domain: 'grafana.navada-edge-server.uk',
      purpose: 'Monitoring dashboards',
    },
    {
      name: 'NAVADA CloudBeaver',
      domain: 'cloudbeaver.navada-edge-server.uk',
      purpose: 'Database management UI',
    },
  ];

  console.log('\n--- Creating Access Applications ---');
  const appIds = {};

  for (const app of adminApps) {
    if (existingNames.has(app.name)) {
      console.log(`[SKIP] ${app.name} already exists`);
      const existing = existingApps.result.find(a => a.name === app.name);
      if (existing) appIds[app.name] = existing.id;
      continue;
    }

    const result = await cfRequest('POST',
      `/accounts/${ACCOUNT_ID}/access/apps`,
      {
        name: app.name,
        domain: app.domain,
        type: 'self_hosted',
        session_duration: '24h',
        auto_redirect_to_identity: true,
        app_launcher_visible: true,
        logo_url: 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev/media/navada-logo.png',
        allowed_idps: [],  // empty = all enabled IdPs (includes OTP)
      }
    );

    if (result.success) {
      appIds[app.name] = result.result.id;
      console.log(`[CREATED] ${app.name} -> ${app.domain} (ID: ${result.result.id})`);
    } else {
      console.log(`[ERROR] ${app.name}: ${result.errors?.[0]?.message}`);
    }
  }

  // 4. Create Access policies (allow Lee's email via OTP)
  console.log('\n--- Creating Access Policies ---');

  for (const app of adminApps) {
    const appId = appIds[app.name];
    if (!appId) {
      console.log(`[SKIP] No app ID for ${app.name}`);
      continue;
    }

    // Check existing policies
    const existingPolicies = await cfRequest('GET',
      `/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`
    );
    const policyNames = new Set((existingPolicies.result || []).map(p => p.name));

    if (policyNames.has('NAVADA Admin')) {
      console.log(`[SKIP] ${app.name} already has NAVADA Admin policy`);
      continue;
    }

    const policy = await cfRequest('POST',
      `/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`,
      {
        name: 'NAVADA Admin',
        decision: 'allow',
        precedence: 1,
        include: [
          {
            email: { email: ADMIN_EMAIL },
          },
        ],
      }
    );

    if (policy.success) {
      console.log(`[OK] ${app.name}: Allow policy for ${ADMIN_EMAIL}`);
    } else {
      console.log(`[ERROR] ${app.name} policy: ${policy.errors?.[0]?.message}`);
    }
  }

  // 5. Summary
  console.log('\n--- Summary ---');
  console.log('Protected admin UIs:');
  for (const app of adminApps) {
    console.log(`  https://${app.domain} - ${app.purpose}`);
  }
  console.log(`\nAuthentication: Email OTP to ${ADMIN_EMAIL}`);
  console.log('Session duration: 24 hours');
  console.log('\nUnprotected (intentionally):');
  console.log('  monitor.navada-edge-server.uk - Uptime Kuma (public status page)');
  console.log('  trading.navada-edge-server.uk - Trading API (has own auth)');
  console.log('  network.navada-edge-server.uk - Network scanner');
  console.log('\nFlow: User visits admin UI -> Cloudflare Access login -> Email OTP -> Access granted (24h)');
}

run().catch(e => console.error('Fatal:', e.message));
