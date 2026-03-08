#!/usr/bin/env node
/**
 * NAVADA Cloudflare Access Zero Trust Manager
 * Gates internal dashboards behind Cloudflare Access (email OTP).
 *
 * Usage:
 *   node cloudflare-access.js setup    — Create Access apps for all protected subdomains
 *   node cloudflare-access.js list     — List existing Access applications
 *   node cloudflare-access.js add <subdomain>  — Add a single subdomain
 *   node cloudflare-access.js remove <subdomain> — Remove Access for a subdomain
 */

require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_DOMAIN = 'navada-edge-server.uk';
const ALLOWED_EMAIL = 'leeakpareva@gmail.com';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('[ERROR] CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN required in .env');
  process.exit(1);
}

// Subdomains to protect with Cloudflare Access
const PROTECTED_SUBDOMAINS = [
  { name: 'CloudBeaver', subdomain: 'cloudbeaver' },
  { name: 'Kibana', subdomain: 'kibana' },
  { name: 'Trading API', subdomain: 'trading' },
  { name: 'Network Scanner', subdomain: 'network' },
  { name: 'Grafana', subdomain: 'grafana' },
  { name: 'Uptime Kuma', subdomain: 'monitor' },
  { name: 'NAVADA Flix', subdomain: 'flix' },
];

function cfRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.success) {
            reject(new Error(`CF API error: ${JSON.stringify(json.errors)}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse CF response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function listAccessApps() {
  const result = await cfRequest('GET', `/accounts/${ACCOUNT_ID}/access/apps`);
  return result.result || [];
}

async function createAccessApp(name, subdomain) {
  const domain = `${subdomain}.${ZONE_DOMAIN}`;
  console.log(`[+] Creating Access application: ${name} (${domain})`);

  // Create the application
  const app = await cfRequest('POST', `/accounts/${ACCOUNT_ID}/access/apps`, {
    name: `NAVADA ${name}`,
    domain,
    type: 'self_hosted',
    session_duration: '24h',
    auto_redirect_to_identity: false,
    allowed_idps: [],
  });

  const appId = app.result.id;
  console.log(`    App created: ${appId}`);

  // Create the policy: allow only Lee's email
  const policy = await cfRequest('POST', `/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`, {
    name: 'Allow Lee',
    decision: 'allow',
    include: [
      { email: { email: ALLOWED_EMAIL } }
    ],
    precedence: 1,
  });

  console.log(`    Policy created: ${policy.result.id} (allow ${ALLOWED_EMAIL})`);
  return { appId, policyId: policy.result.id, domain };
}

async function removeAccessApp(subdomain) {
  const domain = `${subdomain}.${ZONE_DOMAIN}`;
  const apps = await listAccessApps();
  const app = apps.find(a => a.domain === domain);

  if (!app) {
    console.log(`[-] No Access app found for ${domain}`);
    return;
  }

  console.log(`[-] Removing Access application: ${app.name} (${domain})`);
  await cfRequest('DELETE', `/accounts/${ACCOUNT_ID}/access/apps/${app.id}`);
  console.log(`    Removed: ${app.id}`);
}

async function setup() {
  console.log('=== NAVADA Cloudflare Access Zero Trust Setup ===\n');
  console.log(`Account: ${ACCOUNT_ID}`);
  console.log(`Allowed email: ${ALLOWED_EMAIL}\n`);

  // Check existing apps to avoid duplicates
  const existing = await listAccessApps();
  const existingDomains = new Set(existing.map(a => a.domain));

  let created = 0;
  let skipped = 0;

  for (const { name, subdomain } of PROTECTED_SUBDOMAINS) {
    const domain = `${subdomain}.${ZONE_DOMAIN}`;
    if (existingDomains.has(domain)) {
      console.log(`[=] ${name} (${domain}) — already protected, skipping`);
      skipped++;
      continue;
    }
    try {
      await createAccessApp(name, subdomain);
      created++;
    } catch (err) {
      console.error(`[!] Failed to create ${name}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed`);
}

async function list() {
  console.log('=== Cloudflare Access Applications ===\n');
  const apps = await listAccessApps();
  if (apps.length === 0) {
    console.log('No Access applications found.');
    return;
  }
  for (const app of apps) {
    console.log(`  ${app.name}`);
    console.log(`    Domain: ${app.domain}`);
    console.log(`    ID: ${app.id}`);
    console.log(`    Session: ${app.session_duration || 'default'}`);
    console.log('');
  }
  console.log(`Total: ${apps.length} applications`);
}

// CLI
const [,, command, arg] = process.argv;

(async () => {
  try {
    switch (command) {
      case 'setup':
        await setup();
        break;
      case 'list':
        await list();
        break;
      case 'add':
        if (!arg) { console.error('Usage: node cloudflare-access.js add <subdomain>'); process.exit(1); }
        await createAccessApp(arg, arg);
        break;
      case 'remove':
        if (!arg) { console.error('Usage: node cloudflare-access.js remove <subdomain>'); process.exit(1); }
        await removeAccessApp(arg);
        break;
      default:
        console.log('Usage: node cloudflare-access.js <setup|list|add|remove> [subdomain]');
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
