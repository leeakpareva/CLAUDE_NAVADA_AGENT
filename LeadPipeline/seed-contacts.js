/**
 * Seed decision-maker contacts from Hunter.io results
 * Run once: node seed-contacts.js
 */

const db = require('./prospect-db');

const CONTACTS = [
  // Mind Foundry (ID: 3) — insurance AI, Oxford
  {
    company_domain: 'mindfoundry.ai',
    full_name: 'Michael Osborne',
    role: 'Co-Founder',
    email: 'michael.osborne@mindfoundry.ai',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/michael-a-osborne',
    is_decision_maker: true,
  },
  {
    company_domain: 'mindfoundry.ai',
    full_name: 'Al Garfoot',
    role: 'Director of Architecture',
    email: 'alistair.garfoot@mindfoundry.ai',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/garfoot',
    is_decision_maker: true,
  },

  // PolyAI (ID: 4) — conversational AI
  {
    company_domain: 'poly.ai',
    full_name: 'Nikola Mrksic',
    role: 'CEO',
    email: 'nikola@poly.ai',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/nikola-mrk%C5%A1i%C4%87-80b64528',
    is_decision_maker: true,
  },
  {
    company_domain: 'poly.ai',
    full_name: 'Nathan Liu',
    role: 'VP Operations',
    email: 'nathan@poly.ai',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/nathan-liu-5441a3b6',
    is_decision_maker: true,
  },

  // Quantexa (ID: 2) — finance/insurance decision intelligence
  {
    company_domain: 'quantexa.com',
    full_name: 'Andrew Betz',
    role: 'Director of Alliances',
    email: 'andrewbetz@quantexa.com',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/andrew-betz',
    is_decision_maker: true,
  },
  {
    company_domain: 'quantexa.com',
    full_name: 'Harry Godfrey',
    role: 'Technology Partner',
    email: 'harrygodfrey@quantexa.com',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/harrygwgodfrey',
    is_decision_maker: true,
  },

  // Causaly (ID: 6) — healthcare AI
  {
    company_domain: 'causaly.com',
    full_name: 'Yiannis Kiachopoulos',
    role: 'CEO',
    email: 'yiannis.kiachopoulos@causaly.com',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/ioanniskiachopoulos',
    is_decision_maker: true,
  },
  {
    company_domain: 'causaly.com',
    full_name: 'Rui Forte',
    role: 'Director of Engineering',
    email: 'rui.forte@causaly.com',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/ruimiguelforte',
    is_decision_maker: true,
  },

  // INSTANDA (ID: 16) — insurance platform
  {
    company_domain: 'instanda.com',
    full_name: 'Ryan Grant',
    role: 'Director of Architecture',
    email: 'ryan.grant@instanda.com',
    email_source: 'hunter',
    linkedin_url: 'https://www.linkedin.com/in/ryan-grant-32499426',
    is_decision_maker: true,
  },

  // Roots Automation (ID: 12) — insurance AI agents
  {
    company_domain: 'roots.ai',
    full_name: 'Chaz Perera',
    role: 'CEO & Co-Founder',
    email: 'chaz.perera@roots.ai',
    email_source: 'hunter',
    linkedin_url: null,
    is_decision_maker: true,
  },
];

(async () => {
  try {
    await db.initSchema();

    let created = 0;
    for (const c of CONTACTS) {
      // Find company by domain
      const company = await db.getCompanyByDomain(c.company_domain);
      if (!company) {
        console.log(`[skip] Company not found for domain: ${c.company_domain}`);
        continue;
      }

      // Check for duplicate by email
      if (c.email) {
        const existing = await db.getContactByEmail(c.email);
        if (existing) {
          console.log(`[skip] ${c.full_name} already exists (${c.email})`);
          continue;
        }
      }

      const contact = await db.createContact({
        company_id: company.id,
        full_name: c.full_name,
        role: c.role,
        email: c.email,
        email_verified: false,
        email_source: c.email_source,
        linkedin_url: c.linkedin_url,
        is_decision_maker: c.is_decision_maker,
        actor: 'claude',
      });
      console.log(`[added] ${contact.full_name} (${contact.role}) @ ${company.company_name} — ${contact.email}`);
      created++;
    }

    console.log(`\nSeeded: ${created} contacts`);
    const stats = await db.getProspectStats();
    console.log('\nPipeline stats:');
    console.log(JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.pool.end();
  }
})();
