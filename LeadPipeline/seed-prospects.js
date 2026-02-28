/**
 * Seed prospect pipeline with initial companies
 * Run once: node seed-prospects.js
 */

const db = require('./prospect-db');

const COMPANIES = [
  {
    company_name: 'Quantexa',
    domain: 'quantexa.com',
    sector: 'finance',
    size: 'enterprise',
    location: 'London, UK',
    website: 'https://quantexa.com',
    ai_signal: 'Decision intelligence platform for banking & insurance — Series F $175M',
    source: 'bright_data',
    description: 'Connects vast datasets for actionable insights across banking, insurance, government. Uses AI knowledge graphs and entity resolution.',
    priority: 1,
  },
  {
    company_name: 'Mind Foundry',
    domain: 'mindfoundry.ai',
    sector: 'insurance',
    size: 'sme',
    location: 'Oxford, UK',
    website: 'https://mindfoundry.ai',
    ai_signal: 'Responsible AI for insurance and infrastructure — Series B $22M',
    source: 'bright_data',
    description: 'AI solutions emphasizing transparency for insurance and infrastructure sectors. Oxford University spin-out.',
    priority: 1,
  },
  {
    company_name: 'PolyAI',
    domain: 'poly.ai',
    sector: 'tech',
    size: 'sme',
    location: 'London, UK',
    website: 'https://poly.ai',
    ai_signal: 'Enterprise conversational AI — Series C $50M',
    source: 'bright_data',
    description: 'Voice assistants automating enterprise customer service calls. LLM-powered conversational AI.',
    priority: 2,
  },
  {
    company_name: 'Gradient Labs',
    domain: 'gradientlabs.ai',
    sector: 'fintech',
    size: 'startup',
    location: 'London, UK',
    website: 'https://gradientlabs.ai',
    ai_signal: 'Autonomous compliance agents using Claude/Gemini — Series A $13M',
    source: 'bright_data',
    description: 'Autonomous agents for compliance operations in fintech using Claude and Gemini models.',
    priority: 1,
  },
  {
    company_name: 'Causaly',
    domain: 'causaly.com',
    sector: 'healthcare',
    size: 'sme',
    location: 'London, UK',
    website: 'https://causaly.com',
    ai_signal: 'AI knowledge graph for drug discovery — Series B $60M',
    source: 'bright_data',
    description: 'AI knowledge graph for drug discovery and life sciences R&D. Biomedical research AI.',
    priority: 2,
  },
  {
    company_name: 'Raft AI',
    domain: 'raft.ai',
    sector: 'logistics',
    size: 'sme',
    location: 'London, UK',
    website: 'https://raft.ai',
    ai_signal: 'AI workflow automation for freight and customs — Series B $30M',
    source: 'bright_data',
    description: 'AI workflow automation for freight and customs processing. Logistics and defense.',
    priority: 2,
  },
  {
    company_name: 'AeroCloud',
    domain: 'aerocloud.io',
    sector: 'tech',
    size: 'sme',
    location: 'Stockport, UK',
    website: 'https://aerocloud.io',
    ai_signal: 'Cloud-native AI for airport operations — Series A $12.6M',
    source: 'bright_data',
    description: 'Cloud-native AI software for airport management systems. Aviation operations.',
    priority: 2,
  },
  {
    company_name: 'Rossum',
    domain: 'rossum.ai',
    sector: 'tech',
    size: 'sme',
    location: 'London, UK',
    website: 'https://rossum.ai',
    ai_signal: 'AI document processing — Series A $100M',
    source: 'bright_data',
    description: 'AI-powered data extraction from transactional documents. Enterprise automation.',
    priority: 2,
  },
  {
    company_name: 'Xapien',
    domain: 'xapien.com',
    sector: 'finance',
    size: 'startup',
    location: 'London, UK',
    website: 'https://xapien.com',
    ai_signal: 'Automated due diligence and KYC — Series A $10M',
    source: 'bright_data',
    description: 'Automates enhanced due diligence and KYC reporting using AI.',
    priority: 2,
  },
  {
    company_name: 'Recycleye',
    domain: 'recycleye.com',
    sector: 'tech',
    size: 'startup',
    location: 'London, UK',
    website: 'https://recycleye.com',
    ai_signal: 'Computer vision for waste sorting — Series A $17M',
    source: 'bright_data',
    description: 'AI-powered robotic sorting for material recycling. Computer vision.',
    priority: 3,
  },
  {
    company_name: 'Roots Automation',
    domain: 'roots.ai',
    sector: 'insurance',
    size: 'sme',
    location: 'London, UK',
    website: 'https://roots.ai',
    ai_signal: 'AI digital workers for insurance operations — enterprise focus',
    source: 'bright_data',
    description: 'Digital workers (AI agents) automating insurance back-office processes. Claims, underwriting, policy admin.',
    priority: 1,
  },
  {
    company_name: 'Neurons Lab',
    domain: 'neurons-lab.com',
    sector: 'fintech',
    size: 'sme',
    location: 'London, UK',
    website: 'https://neurons-lab.com',
    ai_signal: 'Agentic AI consultancy for financial services — enterprise clients',
    source: 'bright_data',
    description: 'Agentic AI solutions for mid-to-large BFSIs in regulated environments. Compliance, risk, operations.',
    priority: 2,
  },
  {
    company_name: 'Malted AI',
    domain: 'malted.ai',
    sector: 'tech',
    size: 'startup',
    location: 'Edinburgh, UK',
    website: 'https://malted.ai',
    ai_signal: 'Small language models for enterprise — Seed GBP6M',
    source: 'bright_data',
    description: 'Distills LLMs into domain-specific enterprise models. Model optimization and fine-tuning.',
    priority: 2,
  },
  {
    company_name: 'Mindgard',
    domain: 'mindgard.ai',
    sector: 'tech',
    size: 'startup',
    location: 'London, UK',
    website: 'https://mindgard.ai',
    ai_signal: 'AI security testing and red teaming — Series A $8M',
    source: 'bright_data',
    description: 'Dynamic security testing and red teaming for AI systems. AI safety.',
    priority: 3,
  },
  {
    company_name: 'INSTANDA',
    domain: 'instanda.com',
    sector: 'insurance',
    size: 'sme',
    location: 'London, UK',
    website: 'https://instanda.com',
    ai_signal: 'No-code insurance product platform — insurtech leader',
    source: 'bright_data',
    description: 'SaaS no-code insurance product design platform for carriers, MGAs, and brokers.',
    priority: 2,
  },
];

(async () => {
  try {
    await db.initSchema();

    let created = 0;
    for (const c of COMPANIES) {
      const existing = await db.getCompanyByDomain(c.domain);
      if (existing) {
        console.log(`[skip] ${c.company_name} already exists (ID: ${existing.id})`);
        continue;
      }
      const company = await db.createCompany({ ...c, actor: 'claude' });
      console.log(`[added] ${company.company_name} (ID: ${company.id}, priority: ${company.priority}, sector: ${company.sector})`);
      created++;
    }

    console.log(`\nSeeded: ${created} companies`);
    const stats = await db.getProspectStats();
    console.log('\nPipeline stats:');
    console.log(JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.pool.end();
  }
})();
