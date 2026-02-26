const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { sendEmail, p, table, callout } = require('./email-service');

const MAX_JOBS_PER_EMAIL = 10;

// ─── Config ───────────────────────────────────────────────
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'misceres~indeed-scraper';
const BASE_URL = 'https://api.apify.com/v2';
const TRACKER_FILE = path.join(__dirname, 'jobs-tracker.json');
const SENT_FILE = path.join(__dirname, 'jobs-sent.json');

// Searches tailored to Lee's profile
const SEARCHES = [
  { position: 'AI Engineer', country: 'GB', location: 'London', maxItems: 20 },
  { position: 'Head of AI', country: 'GB', location: 'Remote', maxItems: 15 },
  { position: 'ML Engineering Lead', country: 'GB', location: 'London', maxItems: 15 },
  { position: 'AI Solutions Architect', country: 'GB', location: 'Remote', maxItems: 15 },
  { position: 'Principal AI Consultant', country: 'GB', location: '', maxItems: 15 },
  { position: 'GenAI Engineer', country: 'GB', location: 'Remote', maxItems: 10 },
  { position: 'LLM Engineer', country: 'US', location: 'Remote', maxItems: 10 },
  { position: 'AI Program Director', country: 'GB', location: '', maxItems: 10 },
];

const RELEVANCE_KEYWORDS = [
  'azure', 'langchain', 'pytorch', 'rag', 'llm', 'fine-tuning', 'qlora',
  'multi-agent', 'computer vision', 'yolo', 'transformers', 'hugging face',
  'fastapi', 'docker', 'mlops', 'python', 'typescript', 'openai', 'anthropic',
  'enterprise ai', 'vector database', 'pinecone', 'chromadb', 'aws', 'gcp',
  'insurance', 'finance', 'healthcare', 'governance', 'p&l', 'c-suite',
];

// --- Cover Letter Generation ---
const LEE_PROFILE = `Lee Akpareva — Principal AI Consultant | Head of AI candidate
15+ years across AI/ML, data engineering, full stack development, and business strategy.
Currently at Generali UK (insurance) leading AI transformation.
MBA, MSc AI, certified AWS/Azure/GCP. Expert in LLMs, RAG, multi-agent systems, MLOps.
Built and scaled AI teams. Delivered enterprise AI solutions with measurable business impact.
Domains: Insurance, Finance, Healthcare, Government, E-Commerce.`;

async function generateCoverLetter(job) {
  try {
    const { data } = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write concise, compelling cover letter opening paragraphs (3-4 sentences max). No fluff. Focus on why this candidate is a perfect match for this specific role. Do not include addresses or dates.' },
        { role: 'user', content: `Write a brief cover letter opening for this job:\n\nRole: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\n\nCandidate profile:\n${LEE_PROFILE}` },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY_VOICE}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return data.choices[0].message.content.trim();
  } catch (e) {
    return null;
  }
}

// ─── Tracker helpers ──────────────────────────────────────
function loadTracker() {
  if (!fs.existsSync(TRACKER_FILE)) fs.writeFileSync(TRACKER_FILE, JSON.stringify({ jobs: [] }, null, 2));
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
}
function saveTracker(data) { fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2)); }
function loadSentJobs() {
  if (!fs.existsSync(SENT_FILE)) fs.writeFileSync(SENT_FILE, JSON.stringify([], null, 2));
  return JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
}
function saveSentJobs(data) { fs.writeFileSync(SENT_FILE, JSON.stringify(data, null, 2)); }

function generateJobId(job) {
  const str = `${job.title}|${job.company}`.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36);
}

function scoreJob(job) {
  const text = `${job.title} ${job.company} ${job.description || ''} ${job.location}`.toLowerCase();
  let score = 0;
  for (const kw of RELEVANCE_KEYWORDS) { if (text.includes(kw)) score += 1; }
  if (/\b(principal|head of|lead|director|chief|vp|senior)\b/i.test(job.title)) score += 3;
  if (/\b(ai|ml|machine learning|artificial intelligence|genai|llm)\b/i.test(job.title)) score += 2;
  return score;
}

// ─── Apify API ────────────────────────────────────────────
async function startActorRun(searchParams) {
  const url = `${BASE_URL}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`;
  const body = {
    position: searchParams.position,
    country: searchParams.country,
    location: searchParams.location,
    maxItems: searchParams.maxItems,
    saveOnlyUniqueItems: true,
    scrapeCompanyDetails: true,
  };

  console.log(`  Starting: "${searchParams.position}" in ${searchParams.location || searchParams.country}...`);
  const { data } = await axios.post(url, body, { timeout: 30000 });
  return data.data.id;
}

async function waitForRun(runId) {
  const url = `${BASE_URL}/actor-runs/${runId}?token=${APIFY_TOKEN}`;
  let status = 'RUNNING';
  let attempts = 0;

  while (status === 'RUNNING' || status === 'READY') {
    await new Promise(r => setTimeout(r, 5000));
    const { data } = await axios.get(url, { timeout: 15000 });
    status = data.data.status;
    attempts++;
    if (attempts % 6 === 0) console.log(`    Still running... (${attempts * 5}s)`);
    if (attempts > 120) throw new Error('Run timed out after 10 minutes');
  }

  if (status !== 'SUCCEEDED') throw new Error(`Run failed with status: ${status}`);
  return status;
}

async function fetchResults(runId) {
  const url = `${BASE_URL}/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`;
  const { data } = await axios.get(url, { timeout: 30000 });
  return data;
}

// ─── Main Pipeline ────────────────────────────────────────
async function fetchAllJobs() {
  console.log('\n--- Apify Indeed Scraper ---\n');
  const allJobs = [];

  for (const search of SEARCHES) {
    try {
      const runId = await startActorRun(search);
      console.log(`  Run ID: ${runId} — waiting for completion...`);

      await waitForRun(runId);
      const results = await fetchResults(runId);
      console.log(`  ✓ "${search.position}": ${results.length} jobs found\n`);

      for (const item of results) {
        allJobs.push({
          title: item.positionName || item.title || 'Unknown',
          company: item.company || 'Unknown',
          location: item.location || search.location || search.country,
          salary: item.salary || 'Not listed',
          description: (item.description || '').substring(0, 300),
          source: 'Indeed (Apify)',
          link: item.url || item.externalApplyLink || '',
          date: item.postedAt || new Date().toISOString().split('T')[0],
          type: /contract/i.test((item.jobType || '') + ' ' + (item.title || '')) ? 'Contract' : (item.jobType || 'Permanent'),
          companyRating: item.companyRating || null,
          companyReviewCount: item.companyReviewCount || null,
        });
      }
    } catch (err) {
      console.log(`  ✗ "${search.position}": ${err.message}\n`);
    }
  }

  return allJobs;
}

function deduplicateJobs(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
    if (!seen.has(key)) seen.set(key, job);
  }
  return Array.from(seen.values());
}

function filterAndRank(jobs) {
  const filtered = jobs.filter(job => {
    if (/\b(junior|intern|graduate|entry.level|apprentice)\b/i.test(job.title)) return false;
    return true;
  });
  return filtered.map(job => ({ ...job, score: scoreJob(job) })).sort((a, b) => b.score - a.score);
}

function filterNewJobs(jobs) {
  const sentJobs = loadSentJobs();
  const sentIds = new Set(sentJobs);
  const newJobs = [];
  const newIds = [];
  for (const job of jobs) {
    const id = generateJobId(job);
    if (!sentIds.has(id)) { newJobs.push({ ...job, id }); newIds.push(id); }
  }
  saveSentJobs([...sentJobs, ...newIds].slice(-2000));
  return newJobs;
}

function addJobsToTracker(jobs) {
  const tracker = loadTracker();
  const existingIds = new Set(tracker.jobs.map(j => j.id));
  let added = 0;
  for (const job of jobs) {
    if (!existingIds.has(job.id)) {
      tracker.jobs.push({
        id: job.id, title: job.title, company: job.company,
        salary: job.salary, location: job.location, source: job.source,
        link: job.link, type: job.type, score: job.score,
        status: 'New', dateFound: new Date().toISOString().split('T')[0],
        dateApplied: null, notes: '',
      });
      added++;
    }
  }
  saveTracker(tracker);
  return added;
}

// ─── Email (NAVADA Template, max 10 jobs) ─────────────────
async function buildJobEmailBody(jobs) {
  const top = jobs.slice(0, MAX_JOBS_PER_EMAIL);
  const topMatches = top.filter(j => j.score >= 5).length;

  // Generate cover letters for top 3
  const coverLetters = {};
  for (const job of top.slice(0, 3)) {
    console.log(`  Generating cover letter for: ${job.title} @ ${job.company}`);
    const cl = await generateCoverLetter(job);
    if (cl) coverLetters[job.id] = cl;
  }

  const jobCards = top.map((job, i) => {
    const matchTag = job.score >= 5 ? '<span style="background:#111; color:#fff; font-size:9px; padding:2px 6px; border-radius:2px; margin-left:6px; letter-spacing:0.04em;">TOP MATCH</span>' : '';
    const ratingTag = job.companyRating ? ` <span style="color:#888; font-size:11px;">(★ ${job.companyRating})</span>` : '';
    const coverLetter = coverLetters[job.id] ? `<div style="background:#fafafa; border-left:2px solid #ccc; padding:8px 12px; margin:8px 0 0 0; font-size:12px; color:#555; line-height:1.5; font-style:italic;">${coverLetters[job.id]}</div>` : '';

    return `
    <div style="padding:12px 0; ${i < top.length - 1 ? 'border-bottom:1px solid #eaeaea;' : ''}">
      <div style="font-size:14px; font-weight:700; color:#111;">
        <a href="${job.link}" style="color:#111; text-decoration:none;">${i + 1}. ${job.title}</a>${matchTag}
      </div>
      <div style="font-size:12px; color:#555; margin-top:3px;">
        ${job.company}${ratingTag} &middot; ${job.location} &middot; ${job.salary} &middot; ${job.type}
      </div>
      ${coverLetter}
    </div>`;
  }).join('');

  return [
    p(`Found <strong>${jobs.length}</strong> new jobs today. Showing top <strong>${top.length}</strong> ranked by relevance to your profile.`),
    top.length > 0 && topMatches > 0 ? callout(`${topMatches} top matches identified — cover letters generated for the top 3.`) : '',
    jobCards,
    jobs.length > MAX_JOBS_PER_EMAIL ? `<div style="font-size:12px; color:#888; margin-top:12px;">${jobs.length - MAX_JOBS_PER_EMAIL} more jobs tracked — ask Claude to see the full list.</div>` : '',
    `<div style="margin-top:16px; padding:12px; background:#fafafa; border:1px solid #eaeaea; border-radius:4px;">
      <div style="font-size:12px; color:#555;"><strong>Next step:</strong> Reply with the job number to apply, or say "shortlist 1, 3, 5" to move them to your shortlist.</div>
    </div>`,
  ].join('');
}

// ─── Terminal Display ─────────────────────────────────────
function printJobsToTerminal(jobs) {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    TOP JOB MATCHES FOR LEE AKPAREVA                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const top = jobs.slice(0, 25);
  for (let i = 0; i < top.length; i++) {
    const j = top[i];
    const match = j.score >= 5 ? ' ★ TOP MATCH' : '';
    console.log(`  ${(i + 1).toString().padStart(2)}. ${j.title}${match}`);
    console.log(`      ${j.company} | ${j.location} | ${j.salary}`);
    console.log(`      ${j.type} | Score: ${j.score} | ${j.link}`);
    console.log('');
  }

  console.log(`  Showing ${top.length} of ${jobs.length} total jobs\n`);
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toLocaleString()}] Job Hunter (Apify) starting...\n`);

  if (!APIFY_TOKEN) { console.error('Missing APIFY_TOKEN in .env'); process.exit(1); }

  const rawJobs = await fetchAllJobs();
  console.log(`\nRaw jobs: ${rawJobs.length}`);

  const unique = deduplicateJobs(rawJobs);
  console.log(`After dedup: ${unique.length}`);

  const ranked = filterAndRank(unique);
  console.log(`After filter & rank: ${ranked.length}`);

  const newJobs = filterNewJobs(ranked);
  console.log(`New (unsent): ${newJobs.length}`);

  const added = addJobsToTracker(newJobs);
  console.log(`Added to tracker: ${added}`);

  // Print to terminal
  printJobsToTerminal(newJobs.length > 0 ? newJobs : ranked);

  // Send email via NAVADA template (max 10 jobs)
  if (newJobs.length > 0) {
    const topCount = Math.min(newJobs.length, MAX_JOBS_PER_EMAIL);
    const body = await buildJobEmailBody(newJobs);
    await sendEmail({
      to: process.env.RECIPIENT_EMAIL,
      subject: `${topCount} Top Jobs — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      heading: 'Daily Job Digest',
      type: 'digest',
      preheader: `${topCount} curated AI/ML roles matching your profile`,
      body,
      footerNote: 'Source: Indeed via Apify &middot; Max 10 per day &middot; Full list in tracker',
    });
    console.log(`\n✓ Email sent with top ${topCount} of ${newJobs.length} jobs to ${process.env.RECIPIENT_EMAIL}`);
  } else {
    console.log('\nNo new jobs to email (all previously sent).');
  }

  console.log('\nDone.');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
