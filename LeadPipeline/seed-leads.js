/**
 * Seed the 5 initial leads into the pipeline database
 */

const leads = require('./leads');
const logger = require('./logger');

const INITIAL_LEADS = [
  {
    company: 'The Collecting Group',
    contact_name: 'Edward Lovett',
    contact_role: 'Founder & CEO',
    contact_email: null,
    contact_linkedin: 'https://www.linkedin.com/in/chrisbrooke/',
    sector: 'Luxury Marketplace / E-Commerce',
    location: 'London, UK',
    stage: 'Scale-up (high-growth)',
    funding: 'High-growth — UK fastest-growing founder-led company',
    company_desc: 'Online auction platform for collectible cars (Collecting Cars) and luxury watches (Watch Collecting). Edward Lovett founded it in 2019 after 20 years in high-end car retail (Porsche, BMW, Ferrari franchises). Now global.',
    navada_fit: 'Agentic AI, Computer Vision, Recommendation Engines',
    service_match: 'Fractional AI Officer — agentic AI design, RAG for catalogue intelligence, computer vision for item authentication, recommendation engines. Lee\'s Farfetch (£2.3B GMV) e-commerce background is directly relevant.',
    priority: 5,
    score: 92,
    status: 'new',
    source: 'FractionalJobs.io, ZipRecruiter — actively hiring Fractional AI Agentic Engineer (10-20 hrs/week)',
    notes: 'HIGHEST PRIORITY — actively posting for exactly what we offer. Posted on FractionalJobs.io and ZipRecruiter. London on-site preferred.',
  },
  {
    company: 'Jove Insurance',
    contact_name: 'Lizhen (Amanda) Cai',
    contact_role: 'Founder & CEO',
    contact_email: null,
    contact_linkedin: 'https://www.linkedin.com/in/lizhen-cai-7b504026/',
    sector: 'InsurTech',
    location: 'London, UK',
    stage: 'Seed (£3.6M raised)',
    funding: '£3.6M — Explorer Investments, Seed X, Love Ventures, Portfolio Ventures, New Alpha Asset Management',
    company_desc: 'AI-powered insurance platform for contractors and SMEs. Borderless coverage across jurisdictions with flexible subscription options. AI-driven insurance validation tool integrating with HR/ATS systems (Bullhorn). Second-time founder, ex-Deutsche Bank.',
    navada_fit: 'RAG Pipelines, Insurance AI, NLP, Compliance Automation',
    service_match: 'AI Architecture & RAG Pipelines — insurance document processing, automated underwriting models, multi-jurisdiction compliance rules engine, NLP for policy validation. Lee\'s Generali + insurance AI experience is a direct match.',
    priority: 4,
    score: 88,
    status: 'new',
    source: 'Sifted, Fintech Global, Love Ventures, Crunchbase',
    notes: 'Strong domain overlap — Lee currently works in insurance AI at Generali UK. Amanda is ex-Deutsche Bank, understands value of specialist consultants. Small team needs external AI expertise to scale.',
  },
  {
    company: 'autone',
    contact_name: 'Adil Bouhdadi',
    contact_role: 'Co-Founder & CEO',
    contact_email: null,
    contact_linkedin: 'https://uk.linkedin.com/company/hello-autone',
    sector: 'Retail AI / Supply Chain',
    location: 'London, UK',
    stage: 'Series A ($17M)',
    funding: '$17M Series A — General Catalyst, Y Combinator',
    company_desc: 'AI demand forecasting and inventory optimisation for retail. Founded by ex-Alexander McQueen team (Adil Bouhdadi CEO, Harry Glucksmann-Cheslaw CTO). Their data platform helped triple McQueen revenue to $800M. YC-backed.',
    navada_fit: 'ML Engineering, Demand Forecasting, Time-Series Models',
    service_match: 'ML Engineering & Data Science — demand forecasting models, recommendation engines, supply chain optimisation. Lee\'s Farfetch luxury e-commerce background is highly relevant. Fractional ML engineering or model fine-tuning.',
    priority: 3,
    score: 80,
    status: 'new',
    source: 'TechCrunch, Y Combinator, General Catalyst, autone.io careers',
    notes: 'Actively hiring ML Engineers (live on careers page). CTO Harry Glucksmann-Cheslaw also a key contact. Luxury fashion origin — overlaps with Lee\'s Farfetch experience.',
  },
  {
    company: 'FYLD',
    contact_name: 'Shelley Copsey',
    contact_role: 'Co-Founder & CEO',
    contact_email: null,
    contact_linkedin: 'https://londontechweek.com/speakers/shelley-copsey',
    sector: 'Infrastructure AI / Utilities',
    location: 'London, UK',
    stage: 'Series B ($41M — Feb 2026)',
    funding: '$41M Series B (Energy Impact Partners, Partech) — total $79.5M raised',
    company_desc: 'AI-powered fieldwork platform for infrastructure and utilities. Real-time video assessment, AI risk assessment, predictive analytics for field operations. Co-founded with Karl Simons OBE. 82% YoY growth, expanding into US.',
    navada_fit: 'Computer Vision, Edge AI, YOLOv8, IoT Deployment',
    service_match: 'Computer Vision & Edge AI — YOLOv8 object detection for field safety, real-time video analysis, predictive maintenance, edge deployment. Lee\'s IoT/Raspberry Pi and CV portfolio is a direct match.',
    priority: 4,
    score: 85,
    status: 'new',
    source: 'SiliconANGLE, TechFundingNews, London Tech Week, Crunchbase',
    notes: 'Just raised $41M in Feb 2026 — fresh capital, actively scaling AI capabilities. Computer vision for field operations is exactly Lee\'s YOLOv8 + edge deployment skillset. Karl Simons OBE is co-founder.',
  },
  {
    company: 'Xelix',
    contact_name: 'Paul Roiter',
    contact_role: 'Co-Founder & CEO',
    contact_email: null,
    contact_linkedin: 'https://xelix.com/resources/author/paul-roiter',
    sector: 'FinTech / Accounts Payable',
    location: 'London, UK',
    stage: 'Series B ($160M)',
    funding: '$160M Series B — Insight Partners',
    company_desc: 'Agentic AI for accounts payable automation and fraud detection. ML-based payment audit, supplier statement reconciliation, autonomous invoice agents. Founded 2018, using latest LLMs and AI technologies.',
    navada_fit: 'Agentic AI, Multi-Agent Systems, LLM Fine-Tuning, RAG',
    service_match: 'Agentic AI & LLM Engineering — multi-agent orchestration, LLM fine-tuning for financial document processing, RAG pipelines for invoice/PO matching, fraud detection models. Lee\'s enterprise AI and finance sector experience is a perfect fit.',
    priority: 3,
    score: 82,
    status: 'new',
    source: 'FinTech Magazine, AWS Startups, Insight Partners, Xelix Careers',
    notes: 'Actively hiring Junior + Mid-Level AI Engineers. Phil Watts (Co-Founder & CPO) is also a key contact. Building agentic AI — directly aligns with CrewAI/LangChain expertise. Finance/AP domain overlaps with Lee\'s British Gas and insurance background.',
  },
];

function seed() {
  console.log('Seeding 5 initial leads into pipeline...\n');

  for (const data of INITIAL_LEADS) {
    const leadId = leads.createLead(data);
    console.log(`  ✓ Lead #${leadId}: ${data.company} (${data.contact_name}) — Score: ${data.score}/100`);

    // Log initial research as complete
    logger.logResearch(leadId, {
      company: data.company,
      contact: data.contact_name,
      role: data.contact_role,
      sector: data.sector,
      funding: data.funding,
      source: data.source,
    });

    // Create initial tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const oneWeek = new Date();
    oneWeek.setDate(oneWeek.getDate() + 7);

    leads.createTask(leadId, `Find contact email for ${data.contact_name}`, `Search LinkedIn, company website, RocketReach for ${data.contact_name}'s email at ${data.company}`, tomorrow.toISOString(), 5, 'claude');
    leads.createTask(leadId, `Draft intro email for ${data.company}`, `Personalised outreach email referencing their specific needs and NAVADA's relevant capabilities`, threeDays.toISOString(), 4, 'claude');
    leads.createTask(leadId, `Deep research: ${data.company}`, `Recent news, blog posts, LinkedIn activity, tech stack, team growth, competitors`, oneWeek.toISOString(), 3, 'claude');
  }

  // Create general pipeline tasks
  leads.createTask(null, 'Weekly pipeline review with Lee', 'Review all 5 leads, discuss strategy, approve outreach emails', new Date(Date.now() + 7 * 86400000).toISOString(), 5, 'lee');
  leads.createTask(null, 'Set up LinkedIn outreach templates', 'Create 3 outreach templates: fractional AI officer, ML engineering, computer vision specialist', new Date(Date.now() + 3 * 86400000).toISOString(), 4, 'claude');

  console.log('\n✓ All leads seeded');
  console.log('✓ Initial tasks created');

  // Print stats
  const stats = leads.getPipelineStats();
  console.log(`\nPipeline: ${stats.total_leads} leads | ${stats.total_events} events | ${stats.pending_tasks} tasks pending`);
}

seed();
