/**
 * NAVADA Morning Briefing
 * Daily executive summary — 6:30 AM
 * Combines: AI news, job pipeline, market snapshot, weather, priorities
 */

require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');
const RSSParser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const { sendEmail, p, table, callout, kvList } = require('./email-service');

const parser = new RSSParser();
const TRACKER_PATH = path.join(__dirname, 'jobs-tracker.json');
const KB_PATH = path.join(__dirname, 'kb');

// --- AI News (top 3) ---
async function getTopNews() {
  const feeds = [
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch' },
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica' },
    { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge' },
    { url: 'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml', name: 'MIT News' },
  ];

  const articles = [];
  for (const feed of feeds) {
    try {
      const data = await parser.parseURL(feed.url);
      const recent = data.items.slice(0, 3);
      recent.forEach(item => {
        articles.push({
          title: item.title,
          link: item.link,
          source: feed.name,
          date: new Date(item.pubDate || Date.now()),
        });
      });
    } catch (e) { /* skip failed feeds */ }
  }

  // Sort by date, take top 3
  articles.sort((a, b) => b.date - a.date);
  return articles.slice(0, 3);
}

// --- Job Pipeline Status ---
function getJobPipelineStatus() {
  try {
    const data = JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf8'));
    const jobs = data.jobs || [];
    const statuses = {};
    jobs.forEach(j => { statuses[j.status] = (statuses[j.status] || 0) + 1; });

    const today = new Date().toISOString().slice(0, 10);
    const newToday = jobs.filter(j => j.dateFound === today).length;

    return {
      total: jobs.length,
      new: statuses['New'] || 0,
      shortlisted: statuses['Shortlisted'] || 0,
      applied: statuses['Applied'] || 0,
      interview: statuses['Interview'] || 0,
      offer: statuses['Offer'] || 0,
      rejected: statuses['Rejected'] || 0,
      newToday,
    };
  } catch (e) {
    return { total: 0, new: 0, shortlisted: 0, applied: 0, interview: 0, offer: 0, rejected: 0, newToday: 0 };
  }
}

// --- Weather (London) ---
async function getWeather() {
  try {
    const res = await axios.get('https://wttr.in/London?format=j1', { timeout: 5000 });
    const current = res.data.current_condition[0];
    return {
      temp: current.temp_C + '°C',
      desc: current.weatherDesc[0].value,
      feelsLike: current.FeelsLikeC + '°C',
      humidity: current.humidity + '%',
    };
  } catch (e) {
    return null;
  }
}

// --- Priorities / Calendar ---
function getPriorities() {
  try {
    const calPath = path.join(KB_PATH, 'calendar.json');
    if (!fs.existsSync(calPath)) return [];
    const cal = JSON.parse(fs.readFileSync(calPath, 'utf8'));
    const today = new Date().toISOString().slice(0, 10);
    return (cal.events || []).filter(e => e.date === today);
  } catch (e) {
    return [];
  }
}

// --- Build & Send ---
async function sendBriefing() {
  console.log('Generating morning briefing...');

  const [news, weather] = await Promise.all([getTopNews(), getWeather()]);
  const pipeline = getJobPipelineStatus();
  const priorities = getPriorities();

  const now = new Date();
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });

  // Weather section
  let weatherHtml = '';
  if (weather) {
    weatherHtml = `
      <div style="background:#fafafa; border:1px solid #eaeaea; border-radius:4px; padding:12px 16px; margin:12px 0;">
        <span style="font-size:13px; color:#333;">London: <strong>${weather.temp}</strong> ${weather.desc}</span>
        <span style="font-size:11px; color:#888; margin-left:12px;">Feels ${weather.feelsLike} &middot; Humidity ${weather.humidity}</span>
      </div>`;
  }

  // News section
  let newsHtml = '';
  if (news.length) {
    newsHtml = news.map((a, i) => `
      <div style="padding:8px 0; ${i < news.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}">
        <div style="font-size:13px; font-weight:600; color:#111;">
          <a href="${a.link}" style="color:#111; text-decoration:none;">${a.title}</a>
        </div>
        <div style="font-size:11px; color:#888; margin-top:2px;">${a.source}</div>
      </div>`
    ).join('');
  } else {
    newsHtml = '<div style="font-size:13px; color:#888;">No new stories this morning.</div>';
  }

  // Pipeline section
  const pipelineHtml = `
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin:8px 0;">
      ${[
        ['New', pipeline.new, '#666'],
        ['Shortlisted', pipeline.shortlisted, '#2563eb'],
        ['Applied', pipeline.applied, '#059669'],
        ['Interview', pipeline.interview, '#d97706'],
        ['Offer', pipeline.offer, '#16a34a'],
        ['Rejected', pipeline.rejected, '#dc2626'],
      ].map(([label, count, color]) => `
        <div style="background:#fafafa; border:1px solid #eaeaea; border-radius:4px; padding:6px 12px; text-align:center; min-width:70px;">
          <div style="font-size:18px; font-weight:700; color:${color};">${count}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.04em;">${label}</div>
        </div>
      `).join('')}
    </div>
    ${pipeline.newToday > 0 ? `<div style="font-size:12px; color:#059669; margin-top:4px;">+${pipeline.newToday} new jobs found today</div>` : ''}
  `;

  // Priorities section
  let prioritiesHtml = '';
  if (priorities.length) {
    prioritiesHtml = `
      <div style="margin:8px 0;">
        ${priorities.map(e => `
          <div style="padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:13px;">
            <strong>${e.time || ''}</strong> ${e.title}
            ${e.notes ? `<span style="color:#888;"> — ${e.notes}</span>` : ''}
          </div>`
        ).join('')}
      </div>`;
  } else {
    prioritiesHtml = '<div style="font-size:13px; color:#888;">No scheduled events today.</div>';
  }

  // Assemble
  const body = [
    p(`Good morning, Lee. Here's your ${dayName} briefing.`),
    weatherHtml,
    `<h3 style="font-size:14px; font-weight:700; color:#111; margin:20px 0 8px 0; text-transform:uppercase; letter-spacing:0.06em; border-bottom:1px solid #eaeaea; padding-bottom:6px;">AI News</h3>`,
    newsHtml,
    `<h3 style="font-size:14px; font-weight:700; color:#111; margin:20px 0 8px 0; text-transform:uppercase; letter-spacing:0.06em; border-bottom:1px solid #eaeaea; padding-bottom:6px;">Job Pipeline</h3>`,
    pipelineHtml,
    `<h3 style="font-size:14px; font-weight:700; color:#111; margin:20px 0 8px 0; text-transform:uppercase; letter-spacing:0.06em; border-bottom:1px solid #eaeaea; padding-bottom:6px;">Today's Priorities</h3>`,
    prioritiesHtml,
    `<div style="margin-top:20px;">` + p('Reply to this email or message me in Claude for anything you need today.') + `</div>`,
  ].join('');

  await sendEmail({
    to: process.env.RECIPIENT_EMAIL,
    subject: `Morning Brief — ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    heading: `${dayName} Briefing`,
    type: 'digest',
    preheader: `Your ${dayName} morning summary from Claude`,
    body,
    footerNote: 'Delivered at 6:30 AM by Claude &middot; NAVADA Server',
  });

  console.log('Morning briefing sent.');
}

if (require.main === module) {
  sendBriefing()
    .then(() => process.exit(0))
    .catch(e => { console.error('Failed:', e.message); process.exit(1); });
}

module.exports = { sendBriefing };
