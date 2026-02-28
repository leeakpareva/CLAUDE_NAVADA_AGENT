/**
 * NAVADA Prospect Pipeline — Lead Scraper
 * Sources: Google SERP, LinkedIn, company websites
 * Uses Bright Data SERP API for search, direct fetch for website scraping
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });
const db = require('./prospect-db');

// ─── CONFIG ──────────────────────────────────────────────────

const SEARCH_QUERIES = [
  '"Head of AI" OR "AI Engineer" contract UK site:linkedin.com/jobs',
  '"looking for" "AI consultant" OR "ML engineer" UK',
  '"hiring" "artificial intelligence" contract London',
  'CTO OR "VP Engineering" "AI transformation" UK insurance OR finance OR healthcare',
  '"machine learning" "contract" "senior" UK 2026',
  '"AI strategy" consultant OR contractor UK fintech OR insurtech',
  '"data science" "head of" hiring UK enterprise',
];

const TARGET_ROLES = [
  'CTO', 'VP Engineering', 'VP Technology', 'Head of AI',
  'Head of Data', 'Head of Engineering', 'Chief Data Officer',
  'Chief Technology Officer', 'Director of Engineering',
  'Head of Machine Learning', 'AI Lead', 'Head of Digital',
];

const TARGET_SECTORS = ['insurance', 'finance', 'fintech', 'healthcare', 'logistics', 'tech', 'enterprise'];

// ─── URL / DOMAIN UTILS ─────────────────────────────────────

function extractDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch { return null; }
}

function normalizeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.href;
  } catch { return url; }
}

// ─── EMAIL EXTRACTION ────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IGNORE_EMAILS = ['example.com', 'test.com', 'sentry.io', 'w3.org', 'schema.org', 'gmail.com', 'yahoo.com', 'hotmail.com'];

function extractEmails(text) {
  if (!text) return [];
  const matches = text.match(EMAIL_REGEX) || [];
  return [...new Set(matches)]
    .filter(e => !IGNORE_EMAILS.some(d => e.endsWith(`@${d}`)))
    .map(e => e.toLowerCase());
}

// ─── NAME/ROLE EXTRACTION ────────────────────────────────────

function extractContactsFromText(text) {
  const contacts = [];
  if (!text) return contacts;

  // Look for patterns like "Name - Role" or "Name, Role"
  for (const role of TARGET_ROLES) {
    const patterns = [
      new RegExp(`([A-Z][a-z]+ [A-Z][a-z]+)\\s*[-–|,]\\s*${role}`, 'gi'),
      new RegExp(`${role}\\s*[-–|,:]\\s*([A-Z][a-z]+ [A-Z][a-z]+)`, 'gi'),
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        contacts.push({ full_name: match[1].trim(), role });
      }
    }
  }
  return contacts;
}

// ─── WEBSITE SCRAPER ─────────────────────────────────────────

async function scrapeWebsite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    return html;
  } catch (err) {
    console.log(`  [scrape] Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

async function scrapeCompanyInfo(website) {
  const results = { emails: [], contacts: [], pages: {} };
  const domain = extractDomain(website);
  if (!domain) return results;

  const base = `https://${domain}`;
  const paths = ['/', '/about', '/about-us', '/team', '/our-team', '/leadership', '/contact', '/careers', '/jobs'];

  for (const path of paths) {
    const url = `${base}${path}`;
    const html = await scrapeWebsite(url);
    if (!html) continue;

    // Strip HTML tags for text analysis
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ');

    results.emails.push(...extractEmails(text));
    results.contacts.push(...extractContactsFromText(text));
    results.pages[path] = { found: true, emailCount: extractEmails(text).length };
  }

  results.emails = [...new Set(results.emails)];
  // Deduplicate contacts by name
  const seen = new Set();
  results.contacts = results.contacts.filter(c => {
    const key = c.full_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return results;
}

// ─── SEARCH RESULT PARSING ───────────────────────────────────

function parseSearchResult(result) {
  // Parse a search result into a company + contacts
  const { title, url, description } = result;
  const domain = extractDomain(url);

  // Try to extract company name from title
  let companyName = title;
  // Clean common LinkedIn patterns
  companyName = companyName.replace(/\s*\|\s*LinkedIn.*$/i, '');
  companyName = companyName.replace(/\s*-\s*LinkedIn.*$/i, '');
  companyName = companyName.replace(/hiring.*$/i, '');
  companyName = companyName.replace(/\s*jobs?\s*$/i, '');
  companyName = companyName.trim();

  // Detect sector from description
  let sector = null;
  for (const s of TARGET_SECTORS) {
    if ((description || '').toLowerCase().includes(s) || (title || '').toLowerCase().includes(s)) {
      sector = s;
      break;
    }
  }

  // Detect AI signal
  let aiSignal = null;
  const signals = ['hiring AI', 'machine learning', 'artificial intelligence', 'AI engineer', 'AI consultant', 'ML engineer', 'data scientist', 'AI transformation'];
  for (const sig of signals) {
    if ((description || '').toLowerCase().includes(sig.toLowerCase())) {
      aiSignal = `Job posting: ${sig}`;
      break;
    }
  }

  return {
    company_name: companyName,
    domain,
    website: url,
    source_url: url,
    sector,
    ai_signal: aiSignal || 'Found in AI/ML job search',
    description: (description || '').substring(0, 500),
  };
}

// ─── IMPORT + DEDUP ──────────────────────────────────────────

async function importCompany(data, source = 'google') {
  // Check for duplicates by domain
  if (data.domain) {
    const existing = await db.getCompanyByDomain(data.domain);
    if (existing) {
      console.log(`  [skip] Company already exists: ${existing.company_name} (${data.domain})`);
      return { skipped: true, existing };
    }
  }

  const company = await db.createCompany({ ...data, source });
  console.log(`  [new] Company added: ${company.company_name} (ID: ${company.id})`);
  return { skipped: false, company };
}

async function importContact(data) {
  // Check for duplicate by email
  if (data.email) {
    const existing = await db.getContactByEmail(data.email);
    if (existing) {
      console.log(`  [skip] Contact already exists: ${existing.full_name} (${data.email})`);
      return { skipped: true, existing };
    }
  }

  const contact = await db.createContact(data);
  console.log(`  [new] Contact added: ${contact.full_name} (ID: ${contact.id})`);
  return { skipped: false, contact };
}

// ─── BULK IMPORT (for Claude MCP or external data) ───────────

/**
 * Import pre-scraped search results (from Bright Data MCP or other sources)
 * @param {Array<Object>} results - Array of { title, url, description } or { company_name, domain, ... }
 * @param {string} source - 'google', 'linkedin', 'bright_data', 'manual'
 * @returns {Object} - { imported, skipped, errors }
 */
async function importSearchResults(results, source = 'bright_data') {
  const stats = { imported: 0, skipped: 0, errors: 0 };

  for (const result of results) {
    try {
      // Normalize input format
      const data = result.company_name ? result : parseSearchResult(result);
      const { skipped } = await importCompany(data, source);
      if (skipped) stats.skipped++;
      else stats.imported++;
    } catch (err) {
      console.error(`  [error] Failed to import: ${err.message}`);
      stats.errors++;
    }
  }

  console.log(`\n[import] Results: ${stats.imported} imported, ${stats.skipped} skipped, ${stats.errors} errors`);
  return stats;
}

/**
 * Import contacts for a specific company
 * @param {number} companyId
 * @param {Array<Object>} contacts - Array of { full_name, role, email, linkedin_url }
 */
async function importContacts(companyId, contacts) {
  const stats = { imported: 0, skipped: 0 };

  for (const contact of contacts) {
    const { skipped } = await importContact({ ...contact, company_id: companyId });
    if (skipped) stats.skipped++;
    else stats.imported++;
  }

  return stats;
}

// ─── ENRICH COMPANY (scrape website for emails/contacts) ─────

async function enrichCompany(companyId) {
  const company = await db.getCompanyById(companyId);
  if (!company) throw new Error(`Company ${companyId} not found`);
  if (!company.website && !company.domain) {
    console.log(`  [skip] No website/domain for ${company.company_name}`);
    return { emails: 0, contacts: 0 };
  }

  const website = company.website || `https://${company.domain}`;
  console.log(`  [enrich] Scraping ${website}...`);

  const info = await scrapeCompanyInfo(website);

  // Import discovered contacts
  let contactsAdded = 0;
  for (const contact of info.contacts) {
    // Find matching email if available
    const nameParts = contact.full_name.toLowerCase().split(' ');
    const matchingEmail = info.emails.find(e => nameParts.some(p => e.includes(p)));

    const { skipped } = await importContact({
      company_id: companyId,
      full_name: contact.full_name,
      role: contact.role,
      email: matchingEmail || null,
      email_source: matchingEmail ? 'website' : null,
      email_verified: false,
    });
    if (!skipped) contactsAdded++;
  }

  // Store remaining emails as notes
  const unmatchedEmails = info.emails.filter(e => {
    const domain = company.domain || extractDomain(company.website);
    return domain && e.endsWith(`@${domain}`);
  });
  if (unmatchedEmails.length > 0) {
    await db.createNote({
      company_id: companyId,
      note_type: 'research',
      content: `Emails found on website: ${unmatchedEmails.join(', ')}`,
      author: 'system',
    });
  }

  // Update company status
  if (contactsAdded > 0) {
    await db.updateCompany(companyId, { status: 'researching', actor: 'system' });
  }

  return { emails: info.emails.length, contacts: contactsAdded };
}

// ─── FULL SCRAPE RUN ─────────────────────────────────────────

async function run() {
  console.log('\n========================================');
  console.log('  NAVADA Lead Scraper — Starting');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  await db.initSchema();

  // Step 1: Enrich existing companies without contacts
  const companies = await db.getAllCompanies();
  const needsEnrichment = companies.filter(c => c.status === 'new');
  console.log(`[Step 1] Enriching ${needsEnrichment.length} new companies...\n`);

  let totalEmails = 0;
  let totalContacts = 0;

  for (const company of needsEnrichment) {
    try {
      const result = await enrichCompany(company.id);
      totalEmails += result.emails;
      totalContacts += result.contacts;
    } catch (err) {
      console.error(`  [error] Enrichment failed for ${company.company_name}: ${err.message}`);
    }
  }

  // Step 2: Summary
  const stats = await db.getProspectStats();
  console.log('\n========================================');
  console.log('  Scraper Complete');
  console.log('========================================');
  console.log(`  Companies in DB:    ${stats.total_companies}`);
  console.log(`  Contacts in DB:     ${stats.total_contacts}`);
  console.log(`  Verified emails:    ${stats.verified_emails}`);
  console.log(`  Emails found today: ${totalEmails}`);
  console.log(`  Contacts added:     ${totalContacts}`);
  console.log('========================================\n');

  return { totalEmails, totalContacts, stats };
}

// ─── EXPORTS ─────────────────────────────────────────────────

module.exports = {
  SEARCH_QUERIES,
  TARGET_ROLES,
  TARGET_SECTORS,
  extractDomain,
  extractEmails,
  extractContactsFromText,
  scrapeWebsite,
  scrapeCompanyInfo,
  parseSearchResult,
  importCompany,
  importContact,
  importSearchResults,
  importContacts,
  enrichCompany,
  run,
};

// ─── CLI ─────────────────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2];
  (async () => {
    try {
      if (cmd === 'run') {
        await run();
      } else if (cmd === 'enrich' && process.argv[3]) {
        await db.initSchema();
        await enrichCompany(parseInt(process.argv[3]));
      } else if (cmd === 'queries') {
        console.log('\nSearch queries for Bright Data MCP:\n');
        SEARCH_QUERIES.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
        console.log('\nUse these with: mcp__brightdata__search_engine');
      } else {
        console.log('Usage:');
        console.log('  node lead-scraper.js run              # Full scrape + enrich');
        console.log('  node lead-scraper.js enrich <id>      # Enrich specific company');
        console.log('  node lead-scraper.js queries           # Show search queries for MCP');
      }
    } catch (err) {
      console.error('[lead-scraper] Error:', err.message);
    } finally {
      await db.pool.end();
    }
  })();
}
