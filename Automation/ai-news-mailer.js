/**
 * AI News Daily Digest
 * Fetches top AI/ML articles from RSS feeds, sends via NAVADA branded template
 * Scheduled: Daily 7:00 AM via Windows Task Scheduler
 */

const RSSParser = require('rss-parser');
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, table, callout } = require('./email-service');

const parser = new RSSParser();

const RSS_FEEDS = [
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'Ars Technica AI', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
];

async function fetchNews() {
  const allArticles = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const recent = parsed.items
        .filter(item => new Date(item.pubDate) > oneDayAgo)
        .slice(0, 5)
        .map(item => ({
          source: feed.name,
          title: item.title,
          link: item.link,
          date: new Date(item.pubDate).toLocaleDateString('en-GB'),
          snippet: (item.contentSnippet || '').substring(0, 150),
        }));
      allArticles.push(...recent);
    } catch (err) {
      console.log(`[WARN] Failed to fetch ${feed.name}: ${err.message}`);
    }
  }

  allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allArticles;
}

function buildDigestBody(articles) {
  const grouped = {};
  articles.forEach(a => {
    if (!grouped[a.source]) grouped[a.source] = [];
    grouped[a.source].push(a);
  });

  const sourceCount = Object.keys(grouped).length;

  let sections = '';
  for (const [source, items] of Object.entries(grouped)) {
    const articleRows = items.map((item, i) => `
      <div style="padding:10px 0; ${i < items.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}">
        <div style="font-size:14px; font-weight:600;">
          <a href="${item.link}" style="color:#111111; text-decoration:none;">${item.title}</a>
        </div>
        <div style="font-size:12px; color:#666666; margin-top:4px; line-height:1.5;">
          ${item.snippet}...
        </div>
      </div>
    `).join('');

    sections += `
      <div style="margin-bottom:20px;">
        <div style="font-size:13px; font-weight:700; color:#111111; text-transform:uppercase; letter-spacing:0.06em; padding-bottom:6px; border-bottom:2px solid #111111; margin-bottom:4px;">
          ${source}
        </div>
        ${articleRows}
      </div>
    `;
  }

  return [
    callout(`<strong>${articles.length}</strong> articles from <strong>${sourceCount}</strong> sources in the last 24 hours.`),
    sections,
  ].join('');
}

async function sendDigest() {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] Fetching AI news...`);

  const articles = await fetchNews();

  if (articles.length === 0) {
    console.log('No articles found in the last 24 hours. Skipping email.');
    return;
  }

  console.log(`Found ${articles.length} articles. Sending email...`);

  const body = buildDigestBody(articles);

  await sendEmail({
    to: process.env.RECIPIENT_EMAIL,
    subject: `AI News Digest — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    heading: 'AI News Daily Digest',
    body,
    type: 'digest',
    preheader: `${articles.length} top AI/ML stories today`,
    footerNote: `Sources: ${RSS_FEEDS.map(f => f.name).join(', ')}`,
  });

  console.log(`Email sent to ${process.env.RECIPIENT_EMAIL}`);
}

sendDigest()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
