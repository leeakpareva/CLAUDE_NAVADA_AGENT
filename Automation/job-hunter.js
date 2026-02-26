const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─── Config ───────────────────────────────────────────────
const TRACKER_FILE = path.join(__dirname, 'jobs-tracker.json');
const SENT_FILE = path.join(__dirname, 'jobs-sent.json');

const SEARCH_QUERIES = [
  'Principal AI Consultant',
  'Head of AI',
  'AI Solutions Architect',
  'ML Engineering Lead',
  'Senior ML Engineer',
  'Program Director AI',
  'AI Platform Lead',
  'LLM Engineer',
  'Azure AI Architect',
  'AI Strategy Consultant',
  'Machine Learning Manager',
  'GenAI Lead',
];

// Keywords from Lee's CV for relevance scoring
const RELEVANCE_KEYWORDS = [
  'azure', 'langchain', 'pytorch', 'rag', 'llm', 'fine-tuning', 'qlora',
  'multi-agent', 'computer vision', 'yolo', 'transformers', 'hugging face',
  'fastapi', 'docker', 'mlops', 'ml engineer', 'ai consultant', 'ai architect',
  'program director', 'enterprise ai', 'vector database', 'pinecone', 'chromadb',
  'python', 'typescript', 'next.js', 'openai', 'anthropic', 'stable diffusion',
  'raspberry pi', 'robotics', 'edge deployment', 'gpu', 'peft',
  'insurance', 'finance', 'healthcare', 'governance', 'p&l', 'c-suite',
  'blockchain', 'defi', 'aws', 'gcp', 'ci/cd', 'railway', 'vercel',
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Tracker ──────────────────────────────────────────────
function loadTracker() {
  if (!fs.existsSync(TRACKER_FILE)) {
    fs.writeFileSync(TRACKER_FILE, JSON.stringify({ jobs: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
}

function saveTracker(data) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2));
}

function loadSentJobs() {
  if (!fs.existsSync(SENT_FILE)) {
    fs.writeFileSync(SENT_FILE, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
}

function saveSentJobs(data) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(data, null, 2));
}

function generateJobId(job) {
  const str = `${job.title}|${job.company}|${job.source}`.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ─── Relevance Scoring ────────────────────────────────────
function scoreJob(job) {
  const text = `${job.title} ${job.company} ${job.description || ''} ${job.location}`.toLowerCase();
  let score = 0;
  for (const kw of RELEVANCE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score += 1;
  }
  if (/\b(principal|head of|lead|director|chief|vp)\b/i.test(job.title)) score += 3;
  if (/\b(ai|ml|machine learning|artificial intelligence|genai|llm)\b/i.test(job.title)) score += 2;
  return score;
}

// ─── Browser Helper ───────────────────────────────────────
let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      userDataDir: path.join(__dirname, 'chrome-profile2'),
    });
  }
  return browser;
}

async function fetchPage(url, waitSelector, timeout = 20000) {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 10000 }).catch(() => {});
    }
    // Extra wait for JS rendering
    await new Promise(r => setTimeout(r, 3000));
    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}

// ─── Scrapers (Puppeteer-powered) ─────────────────────────

async function scrapeIndeed(query, location) {
  const jobs = [];
  try {
    const url = `https://uk.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date&fromage=3`;
    const html = await fetchPage(url, 'div.job_seen_beacon');
    const $ = cheerio.load(html);

    $('div.job_seen_beacon, div.cardOutline, div[class*="job_seen"]').each((_, el) => {
      const title = $(el).find('h2 a span, h2 span[id^="jobTitle"]').first().text().trim();
      const company = $(el).find('[data-testid="company-name"], span.companyName, span[data-testid="company-name"]').first().text().trim();
      const loc = $(el).find('[data-testid="text-location"], div.companyLocation').first().text().trim();
      const salary = $(el).find('div[class*="salary"], div.metadata div[class*="salary"]').first().text().trim();
      const snippet = $(el).find('div.job-snippet, div[class*="job-snippet"] ul').first().text().trim();
      const linkEl = $(el).find('h2 a, a[data-jk]').first();
      const href = linkEl.attr('href') || '';
      const jk = linkEl.attr('data-jk') || '';

      if (title) {
        const link = jk ? `https://uk.indeed.com/viewjob?jk=${jk}` :
          (href.startsWith('http') ? href : `https://uk.indeed.com${href}`);
        jobs.push({
          title, company: company || 'Unknown', location: loc || location,
          salary: salary || 'Not listed', description: snippet,
          source: 'Indeed', link,
          date: new Date().toISOString().split('T')[0],
          type: /contract/i.test(snippet + ' ' + title + ' ' + salary) ? 'Contract' : 'Permanent',
        });
      }
    });
    console.log(`[Indeed] "${query}" in ${location}: ${jobs.length} jobs`);
  } catch (err) {
    console.log(`[Indeed] Error "${query}" ${location}: ${err.message}`);
  }
  return jobs;
}

async function scrapeReed(query, location) {
  const jobs = [];
  try {
    const slug = query.toLowerCase().replace(/ /g, '-');
    const url = `https://www.reed.co.uk/jobs/${slug}-jobs-in-${location.toLowerCase()}?sortby=DisplayDate&proximity=30`;
    const html = await fetchPage(url, 'article');
    const $ = cheerio.load(html);

    $('article[data-qa]').each((_, el) => {
      const title = $(el).find('h2 a, h3 a').first().text().trim();
      const company = $(el).find('[data-qa="posted-by"] a, a.gtmJobListingPostedBy').first().text().trim();
      const loc = $(el).find('[data-qa="job-card-location"], li.job-metadata__item--location').first().text().trim();
      const salary = $(el).find('[data-qa="job-card-salary"], li.job-metadata__item--salary').first().text().trim();
      const href = $(el).find('h2 a, h3 a').first().attr('href') || '';

      if (title) {
        jobs.push({
          title, company: company || 'Unknown', location: loc || location,
          salary: salary || 'Not listed', description: '',
          source: 'Reed',
          link: href.startsWith('http') ? href : `https://www.reed.co.uk${href}`,
          date: new Date().toISOString().split('T')[0],
          type: /contract/i.test(salary + ' ' + title) ? 'Contract' : 'Permanent',
        });
      }
    });
    console.log(`[Reed] "${query}" in ${location}: ${jobs.length} jobs`);
  } catch (err) {
    console.log(`[Reed] Error "${query}" ${location}: ${err.message}`);
  }
  return jobs;
}

async function scrapeCWJobs(query) {
  const jobs = [];
  try {
    const url = `https://www.cwjobs.co.uk/jobs/${query.toLowerCase().replace(/ /g, '-')}?postedwithin=3&sortby=DisplayDate`;
    const html = await fetchPage(url, 'div[data-at="job-item"]');
    const $ = cheerio.load(html);

    $('div[data-at="job-item"], article[data-at="job-item"]').each((_, el) => {
      const title = $(el).find('a[data-at="job-item-title"], h2 a').first().text().trim();
      const company = $(el).find('[data-at="job-item-company-name"]').first().text().trim();
      const loc = $(el).find('[data-at="job-item-location"]').first().text().trim();
      const salary = $(el).find('[data-at="job-item-salary-info"]').first().text().trim();
      const href = $(el).find('a[data-at="job-item-title"], h2 a').first().attr('href') || '';

      if (title) {
        jobs.push({
          title, company: company || 'Unknown', location: loc || 'UK',
          salary: salary || 'Not listed', description: '',
          source: 'CWJobs',
          link: href.startsWith('http') ? href : `https://www.cwjobs.co.uk${href}`,
          date: new Date().toISOString().split('T')[0],
          type: /contract/i.test(salary + ' ' + title) ? 'Contract' : 'Permanent',
        });
      }
    });
    console.log(`[CWJobs] "${query}": ${jobs.length} jobs`);
  } catch (err) {
    console.log(`[CWJobs] Error "${query}": ${err.message}`);
  }
  return jobs;
}

async function scrapeLinkedInViaGoogle(query) {
  const jobs = [];
  try {
    const searchQuery = `site:linkedin.com/jobs/view "${query}" remote OR london OR UK`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=15`;
    const html = await fetchPage(url, 'div#search');
    const $ = cheerio.load(html);

    $('div.g, div[data-hveid]').each((_, el) => {
      const titleEl = $(el).find('h3').first();
      const linkEl = $(el).find('a').first();
      const snippetEl = $(el).find('div.VwiC3b, span.aCOpRe, div[data-sncf]').first();
      const fullTitle = titleEl.text().trim();
      const link = linkEl.attr('href') || '';

      if (fullTitle && link.includes('linkedin.com')) {
        const parts = fullTitle.split(' - ');
        jobs.push({
          title: parts[0] || fullTitle,
          company: parts[1] || 'See listing',
          location: parts[2] || 'See listing',
          salary: 'Not listed',
          description: snippetEl.text().trim().substring(0, 200),
          source: 'LinkedIn',
          link,
          date: new Date().toISOString().split('T')[0],
          type: 'See listing',
        });
      }
    });
    console.log(`[LinkedIn] "${query}": ${jobs.length} jobs`);
  } catch (err) {
    console.log(`[LinkedIn] Error "${query}": ${err.message}`);
  }
  return jobs;
}

// ─── Main Pipeline ────────────────────────────────────────
async function fetchAllJobs() {
  console.log('Fetching jobs from multiple sources via Puppeteer...\n');
  const allJobs = [];

  // Process queries sequentially to avoid overloading browser
  for (const query of SEARCH_QUERIES) {
    // Indeed UK
    const indeedJobs = await scrapeIndeed(query, 'London');
    allJobs.push(...indeedJobs);

    // Reed
    const reedJobs = await scrapeReed(query, 'london');
    allJobs.push(...reedJobs);
  }

  // CWJobs - top queries only
  for (const query of SEARCH_QUERIES.slice(0, 6)) {
    const cwJobs = await scrapeCWJobs(query);
    allJobs.push(...cwJobs);
  }

  // LinkedIn via Google - top queries
  for (const query of SEARCH_QUERIES.slice(0, 6)) {
    const liJobs = await scrapeLinkedInViaGoogle(query);
    allJobs.push(...liJobs);
    await new Promise(r => setTimeout(r, 2000)); // Avoid Google rate limit
  }

  return allJobs;
}

function deduplicateJobs(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  return Array.from(seen.values());
}

function filterAndRank(jobs) {
  const filtered = jobs.filter(job => {
    const title = job.title.toLowerCase();
    if (/\b(junior|intern|graduate|entry.level|apprentice)\b/i.test(title)) return false;
    const text = `${job.title} ${job.description}`.toLowerCase();
    const hasRelevance = RELEVANCE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    const hasRoleMatch = /\b(ai|ml|machine learning|data|engineer|architect|consultant|director|lead|head|program)\b/i.test(title);
    return hasRelevance || hasRoleMatch;
  });

  return filtered
    .map(job => ({ ...job, score: scoreJob(job) }))
    .sort((a, b) => b.score - a.score);
}

function filterNewJobs(jobs) {
  const sentJobs = loadSentJobs();
  const sentIds = new Set(sentJobs);
  const newJobs = [];
  const newIds = [];

  for (const job of jobs) {
    const id = generateJobId(job);
    if (!sentIds.has(id)) {
      newJobs.push({ ...job, id });
      newIds.push(id);
    }
  }

  const updated = [...sentJobs, ...newIds].slice(-2000);
  saveSentJobs(updated);
  return newJobs;
}

// ─── Email Builder ────────────────────────────────────────
function buildEmailHTML(jobs) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const rows = jobs.slice(0, 50).map((job, i) => `
    <tr style="border-bottom: 1px solid #e0e0e0; ${i % 2 === 0 ? 'background: #f9f9ff;' : ''}">
      <td style="padding: 10px; font-size: 14px;">
        <a href="${job.link}" style="color: #1971c2; font-weight: bold; text-decoration: none;">${job.title}</a>
        ${job.score >= 5 ? '<span style="background: #22c55e; color: white; padding: 1px 6px; border-radius: 8px; font-size: 10px; margin-left: 6px;">TOP MATCH</span>' : ''}
      </td>
      <td style="padding: 10px; font-size: 13px;">${job.company}</td>
      <td style="padding: 10px; font-size: 13px;">${job.salary}</td>
      <td style="padding: 10px; font-size: 13px;">${job.location}</td>
      <td style="padding: 10px; font-size: 13px;">${job.type}</td>
      <td style="padding: 10px; font-size: 12px; color: #888;">${job.source}</td>
    </tr>
  `).join('');

  const topMatches = jobs.filter(j => j.score >= 5).length;
  const sources = [...new Set(jobs.map(j => j.source))].join(', ');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 24px; border-radius: 12px; color: white; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px;">Job Hunter Daily Digest</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">${today}</p>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">${jobs.length} new jobs | ${topMatches} top matches | ${sources}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #1e3a5f; color: white;">
            <th style="padding: 12px 10px; text-align: left; font-size: 13px;">Role</th>
            <th style="padding: 12px 10px; text-align: left; font-size: 13px;">Company</th>
            <th style="padding: 12px 10px; text-align: left; font-size: 13px;">Salary</th>
            <th style="padding: 12px 10px; text-align: left; font-size: 13px;">Location</th>
            <th style="padding: 12px 10px; text-align: left; font-size: 13px;">Type</th>
            <th style="padding: 12px 10px; text-align: left; font-size: 13px;">Source</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top: 20px; padding: 16px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-size: 13px; color: #555;">
          <strong>Interested in a role?</strong> Tell Claude the job title and company, and I'll tailor your CV and cover letter for the application.
        </p>
      </div>

      <div style="text-align: center; color: #999; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">
        Automated by Claude Code | Job Hunter for Lee Akpareva
      </div>
    </div>
  `;
}

// ─── Send ─────────────────────────────────────────────────
async function sendJobEmail(jobs) {
  if (jobs.length === 0) {
    console.log('No new jobs found today. Skipping email.');
    return;
  }

  const html = buildEmailHTML(jobs);

  await transporter.sendMail({
    from: `"Job Hunter Bot" <${process.env.GMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `${jobs.length} New AI/ML Jobs - ${new Date().toLocaleDateString('en-GB')}`,
    html,
  });

  console.log(`Email sent with ${jobs.length} jobs to ${process.env.RECIPIENT_EMAIL}`);
}

// ─── Add to Tracker ───────────────────────────────────────
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
        status: 'New',
        dateFound: new Date().toISOString().split('T')[0],
        dateApplied: null, notes: '',
      });
      added++;
    }
  }

  saveTracker(tracker);
  console.log(`Added ${added} new jobs to tracker (total: ${tracker.jobs.length})`);
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] Job Hunter starting...\n`);

  const rawJobs = await fetchAllJobs();
  console.log(`\nRaw jobs fetched: ${rawJobs.length}`);

  const unique = deduplicateJobs(rawJobs);
  console.log(`After dedup: ${unique.length}`);

  const ranked = filterAndRank(unique);
  console.log(`After filter & rank: ${ranked.length}`);

  const newJobs = filterNewJobs(ranked);
  console.log(`New (unsent) jobs: ${newJobs.length}`);

  addJobsToTracker(newJobs);
  await sendJobEmail(newJobs);

  // Close browser
  if (browser) await browser.close();
  console.log('\nDone.');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err.message);
  if (browser) browser.close().catch(() => {});
  process.exit(1);
});
