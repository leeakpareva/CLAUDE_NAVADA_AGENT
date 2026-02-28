/**
 * NAVADA Prospect Pipeline — Email Discovery & Verification
 * Uses Hunter.io API for domain search, email finder, and verification
 * Free tier: 25 searches + 50 verifications/month
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });
const db = require('./prospect-db');

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_BASE = 'https://api.hunter.io/v2';

// ─── RATE LIMIT TRACKING ─────────────────────────────────────

const usage = {
  searches: 0,
  verifications: 0,
  month: new Date().getMonth(),
  reset() {
    const now = new Date().getMonth();
    if (now !== this.month) {
      this.searches = 0;
      this.verifications = 0;
      this.month = now;
    }
  },
};

const LIMITS = {
  searches: 25,       // Free tier monthly limit
  verifications: 50,  // Free tier monthly limit
};

function checkLimit(type) {
  usage.reset();
  if (usage[type] >= LIMITS[type]) {
    console.warn(`[hunter] Monthly ${type} limit reached (${LIMITS[type]}). Skipping.`);
    return false;
  }
  return true;
}

// ─── HUNTER.IO API ───────────────────────────────────────────

async function hunterRequest(endpoint, params) {
  if (!HUNTER_API_KEY) {
    throw new Error('HUNTER_API_KEY not set in .env — sign up at https://hunter.io');
  }

  const url = new URL(`${HUNTER_BASE}${endpoint}`);
  url.searchParams.set('api_key', HUNTER_API_KEY);
  for (const [key, val] of Object.entries(params)) {
    if (val) url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Hunter API ${endpoint} failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Search for all emails at a domain
 * @param {string} domain - e.g. "generali.co.uk"
 * @returns {Object} - { emails: [...], organization, pattern }
 */
async function domainSearch(domain) {
  if (!checkLimit('searches')) return null;

  console.log(`  [hunter] Domain search: ${domain}`);
  usage.searches++;

  const data = await hunterRequest('/domain-search', { domain });
  return {
    domain,
    organization: data.organization || null,
    pattern: data.pattern || null,
    emails: (data.emails || []).map(e => ({
      email: e.value,
      type: e.type,
      confidence: e.confidence,
      first_name: e.first_name,
      last_name: e.last_name,
      position: e.position,
      department: e.department,
      linkedin: e.linkedin,
      sources: (e.sources || []).length,
    })),
  };
}

/**
 * Find a specific person's email at a domain
 * @param {string} domain
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Object|null} - { email, score, position }
 */
async function emailFinder(domain, firstName, lastName) {
  if (!checkLimit('searches')) return null;

  console.log(`  [hunter] Email finder: ${firstName} ${lastName} @ ${domain}`);
  usage.searches++;

  const data = await hunterRequest('/email-finder', {
    domain,
    first_name: firstName,
    last_name: lastName,
  });

  if (!data.email) return null;

  return {
    email: data.email,
    score: data.score,
    position: data.position || null,
    department: data.department || null,
    linkedin: data.linkedin || null,
    sources: (data.sources || []).length,
  };
}

/**
 * Verify if an email address is deliverable
 * @param {string} email
 * @returns {Object} - { email, result, score, status }
 */
async function emailVerifier(email) {
  if (!checkLimit('verifications')) return null;

  console.log(`  [hunter] Verifying: ${email}`);
  usage.verifications++;

  const data = await hunterRequest('/email-verifier', { email });

  return {
    email: data.email,
    result: data.result,       // 'deliverable', 'undeliverable', 'risky', 'unknown'
    score: data.score,
    status: data.status,       // 'valid', 'invalid', 'accept_all', 'webmail', 'disposable', 'unknown'
    regexp: data.regexp,
    mx_records: data.mx_records,
    smtp_server: data.smtp_server,
    smtp_check: data.smtp_check,
  };
}

// ─── PROCESS CONTACTS ────────────────────────────────────────

/**
 * Find emails for contacts without email addresses
 * Uses domain search first, then individual email finder
 */
async function findEmails() {
  const contacts = await db.getUnverifiedContacts();
  console.log(`\n[email-finder] Processing ${contacts.length} unverified contacts...\n`);

  const stats = { found: 0, verified: 0, failed: 0, skipped: 0 };
  const processedDomains = new Map(); // Cache domain search results

  for (const contact of contacts) {
    const domain = contact.domain;
    if (!domain) {
      console.log(`  [skip] No domain for ${contact.full_name} (company: ${contact.company_name})`);
      stats.skipped++;
      continue;
    }

    try {
      // Step 1: Find email
      if (!contact.email) {
        // Try domain search (cached per domain)
        if (!processedDomains.has(domain)) {
          const domainResult = await domainSearch(domain);
          processedDomains.set(domain, domainResult);
        }

        const domainData = processedDomains.get(domain);

        // Look for this contact in domain search results
        let foundEmail = null;
        if (domainData && domainData.emails) {
          const nameParts = contact.full_name.toLowerCase().split(' ');
          const match = domainData.emails.find(e =>
            nameParts.some(p => (e.first_name || '').toLowerCase() === p || (e.last_name || '').toLowerCase() === p)
          );
          if (match) foundEmail = match.email;
        }

        // If not found in domain search, try email finder
        if (!foundEmail) {
          const names = contact.full_name.split(' ');
          const firstName = names[0];
          const lastName = names.slice(1).join(' ');
          if (firstName && lastName) {
            const result = await emailFinder(domain, firstName, lastName);
            if (result && result.email) foundEmail = result.email;
          }
        }

        if (foundEmail) {
          await db.updateContact(contact.id, {
            email: foundEmail,
            email_source: 'hunter',
            actor: 'system',
          });
          console.log(`  [found] ${contact.full_name}: ${foundEmail}`);
          stats.found++;
          contact.email = foundEmail; // Update for verification step
        } else {
          console.log(`  [miss] No email found for ${contact.full_name} @ ${domain}`);
          stats.failed++;
          continue;
        }
      }

      // Step 2: Verify email
      if (contact.email && !contact.email_verified) {
        const verification = await emailVerifier(contact.email);
        if (verification) {
          const isVerified = verification.result === 'deliverable' && verification.score >= 70;
          await db.updateContact(contact.id, {
            email_verified: isVerified,
            actor: 'system',
          });
          await db.logAudit('contact', contact.id, 'email_verified',
            `Email ${contact.email}: ${verification.result} (score: ${verification.score})`,
            { newValue: verification, actor: 'system' }
          );

          if (isVerified) {
            console.log(`  [verified] ${contact.email} (score: ${verification.score})`);
            stats.verified++;
          } else {
            console.log(`  [unverified] ${contact.email}: ${verification.result} (score: ${verification.score})`);
          }
        }
      }
    } catch (err) {
      console.error(`  [error] ${contact.full_name}: ${err.message}`);
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Verify all contacts that have emails but haven't been verified yet
 */
async function verifyExisting() {
  const { rows } = await db.pool.query(
    `SELECT * FROM prospect_contacts WHERE email IS NOT NULL AND email_verified = FALSE ORDER BY created_at ASC`
  );
  console.log(`\n[email-finder] Verifying ${rows.length} existing emails...\n`);

  const stats = { verified: 0, failed: 0, skipped: 0 };

  for (const contact of rows) {
    try {
      const verification = await emailVerifier(contact.email);
      if (!verification) { stats.skipped++; continue; }

      const isVerified = verification.result === 'deliverable' && verification.score >= 70;
      await db.updateContact(contact.id, { email_verified: isVerified, actor: 'system' });
      await db.logAudit('contact', contact.id, 'email_verified',
        `Email ${contact.email}: ${verification.result} (score: ${verification.score})`,
        { newValue: verification, actor: 'system' }
      );

      if (isVerified) {
        console.log(`  [verified] ${contact.email} (score: ${verification.score})`);
        stats.verified++;
      } else {
        console.log(`  [unverified] ${contact.email}: ${verification.result}`);
        stats.failed++;
      }
    } catch (err) {
      console.error(`  [error] ${contact.email}: ${err.message}`);
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Full run: find emails + verify
 */
async function run() {
  console.log('\n========================================');
  console.log('  NAVADA Email Finder — Starting');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  if (!HUNTER_API_KEY) {
    console.error('[email-finder] ERROR: HUNTER_API_KEY not set in Automation/.env');
    console.error('  Sign up at https://hunter.io and add HUNTER_API_KEY=your_key to .env');
    return { found: 0, verified: 0, failed: 0, skipped: 0 };
  }

  await db.initSchema();

  const findStats = await findEmails();
  const verifyStats = await verifyExisting();

  const combined = {
    found: findStats.found,
    verified: findStats.verified + verifyStats.verified,
    failed: findStats.failed + verifyStats.failed,
    skipped: findStats.skipped + verifyStats.skipped,
    usage: { searches: usage.searches, verifications: usage.verifications },
  };

  console.log('\n========================================');
  console.log('  Email Finder Complete');
  console.log('========================================');
  console.log(`  Emails found:     ${combined.found}`);
  console.log(`  Emails verified:  ${combined.verified}`);
  console.log(`  Failed:           ${combined.failed}`);
  console.log(`  Skipped:          ${combined.skipped}`);
  console.log(`  API searches:     ${combined.usage.searches}/${LIMITS.searches}`);
  console.log(`  API verifications: ${combined.usage.verifications}/${LIMITS.verifications}`);
  console.log('========================================\n');

  return combined;
}

// ─── EXPORTS ─────────────────────────────────────────────────

module.exports = {
  domainSearch,
  emailFinder,
  emailVerifier,
  findEmails,
  verifyExisting,
  run,
};

// ─── CLI ─────────────────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2];
  (async () => {
    try {
      if (cmd === 'run') {
        await run();
      } else if (cmd === 'domain' && process.argv[3]) {
        const result = await domainSearch(process.argv[3]);
        console.log(JSON.stringify(result, null, 2));
      } else if (cmd === 'find' && process.argv[3] && process.argv[4] && process.argv[5]) {
        const result = await emailFinder(process.argv[3], process.argv[4], process.argv[5]);
        console.log(JSON.stringify(result, null, 2));
      } else if (cmd === 'verify' && process.argv[3]) {
        const result = await emailVerifier(process.argv[3]);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('Usage:');
        console.log('  node email-finder.js run                           # Full run (find + verify)');
        console.log('  node email-finder.js domain <domain>               # Domain search');
        console.log('  node email-finder.js find <domain> <first> <last>  # Find person email');
        console.log('  node email-finder.js verify <email>                # Verify email');
      }
    } catch (err) {
      console.error('[email-finder] Error:', err.message);
    } finally {
      await db.pool.end();
    }
  })();
}
