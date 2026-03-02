/**
 * Reddit Iran Intelligence Digest — Last 24 Hours
 * Scraped via Puppeteer from Reddit JSON API
 * High-contrast modern template
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

const posts = [
  { title: 'SNL\'s Colin Jost on Iran: "This attack might be a bad idea, I don\'t know. I\'m not really an expert on Iran. So let\'s hear from someone who can explain why we might have done it."', author: 'GiveMeSomeSunshine3', subreddit: 'r/Fauxmoi', score: '40.3K', comments: 275, time: '13h ago', url: 'https://reddit.com/r/Fauxmoi/comments/1rhpgvr/', category: 'culture' },
  { title: 'Greatest threat to the world', author: 'KiA92935', subreddit: 'r/TrendoraX', score: '31.4K', comments: 1282, time: '1d ago', url: 'https://reddit.com/r/TrendoraX/comments/1rha7ol/', category: 'opinion' },
  { title: 'President Trump monitors U.S. military operations in Iran', author: 'nbcnews', subreddit: 'r/pics', score: '26.1K', comments: 5604, time: '21h ago', url: 'https://reddit.com/r/pics/comments/1rhehy0/', category: 'breaking' },
  { title: 'Iran reels as more than 100 children reportedly killed in school bombing', author: 'Andromeda-G', subreddit: 'r/news', score: '19.9K', comments: 2426, time: '16h ago', url: 'https://reddit.com/r/news/comments/1rhlqes/', category: 'breaking' },
  { title: 'Scenes from a protest in Los Angeles today, against the US & Israel\'s War on Iran [OC]', author: 'infernoenigma', subreddit: 'r/pics', score: '19.1K', comments: 593, time: '17h ago', url: 'https://reddit.com/r/pics/comments/1rhkh8q/', category: 'protest' },
  { title: 'Iran officially declares the closure of the Strait of Hormuz.', author: 'CarryIcy250', subreddit: 'r/UnderReportedNews', score: '17.9K', comments: 1026, time: '1d ago', url: 'https://reddit.com/r/UnderReportedNews/comments/1rh9atd/', category: 'breaking' },
  { title: 'Only 21% of Americans Support the United States Initiating an Attack on Iran', author: 'Antique_Calendar_887', subreddit: 'r/politics', score: '17.1K', comments: 1313, time: '22h ago', url: 'https://reddit.com/r/politics/comments/1rhd1m7/', category: 'politics' },
  { title: 'A now deleted video of Donald Trump in 2011 talking about how President Obama will start a war with Iran because he has no ability to negotiate and is weak and ineffective', author: 'Yujin-Ha', subreddit: 'r/videos', score: '16.8K', comments: 302, time: '3h ago', url: 'https://reddit.com/r/videos/comments/1ri065d/', category: 'politics' },
  { title: 'BREAKING: Trump has just unclassified videos from his strikes on Iran', author: 'ResPublicaMgz', subreddit: 'r/circled', score: '15.6K', comments: 2121, time: '23h ago', url: 'https://reddit.com/r/circled/comments/1rhbn73/', category: 'breaking' },
  { title: 'Iranian Foreign Minister reacts to US and Israeli strikes inside Iran NBC: "Are you committing your missiles won\'t have the capability to reach America?" Iranian FM: "Yes." NBC: "Then why are you bombing our bases?" Iranian FM: "Because they\'re attacking us"', author: 'ExactlySorta', subreddit: 'r/UnderReportedNews', score: '13.9K', comments: 588, time: '16h ago', url: 'https://reddit.com/r/UnderReportedNews/comments/1rhlokb/', category: 'diplomacy' },
  { title: 'At least 3 US soldiers dead, related to war on Iran', author: 'Riley_', subreddit: 'r/news', score: '13.7K', comments: 1344, time: '3h ago', url: 'https://reddit.com/r/news/comments/1rhzhdj/', category: 'breaking' },
  { title: 'Who benefits from Trump\'s war in Iran? The answer is disturbingly clear', author: 'MyRedditUsername224', subreddit: 'r/politics', score: '12.9K', comments: 1146, time: '14h ago', url: 'https://reddit.com/r/politics/comments/1rhnjw7/', category: 'politics' },
  { title: 'US-Iran strikes: Iran Supreme Leader Ayatollah Ali Khamenei killed', author: 'Capable_Salt_SD', subreddit: 'r/politics', score: '11.8K', comments: 1782, time: '22h ago', url: 'https://reddit.com/r/politics/comments/1rhcgd2/', category: 'breaking' },
  { title: 'Crowd in Iran\'s Urmia chants "Death to America!"', author: 'EsperaDeus', subreddit: 'r/PublicFreakout', score: '11.9K', comments: 1086, time: '13h ago', url: 'https://reddit.com/r/PublicFreakout/comments/1rhopyx/', category: 'ontheground' },
  { title: 'Iran\'s Supreme Leader Ali Khamenei killed, senior Israeli official says', author: 'drpayneaba', subreddit: 'r/news', score: '11.5K', comments: 1671, time: '21h ago', url: 'https://reddit.com/r/news/comments/1rhe70d/', category: 'breaking' },
  { title: 'Where did "America First" go? Where is the "zero war"? Lie after lie.', author: 'judgementMaster', subreddit: 'r/WhitePeopleTwitter', score: '11.6K', comments: 209, time: '4h ago', url: 'https://reddit.com/r/WhitePeopleTwitter/comments/1rhywq1/', category: 'politics' },
  { title: 'Putin says "Iran has fulfilled its commitments, but it is the United States that tore up the agreement. Trump withdrew from it, yet Europe demanded that Iran remain faithful to the deal! Why on earth should Iran abide by an agreement abandoned by the West?"', author: 'GuiltyBathroom9385', subreddit: 'r/UnderReportedNews', score: '11.2K', comments: 818, time: '6h ago', url: 'https://reddit.com/r/UnderReportedNews/comments/1rhvkya/', category: 'diplomacy' },
  { title: 'To not share sensitive information', author: 'seeebiscuit', subreddit: 'r/therewasanattempt', score: '12.9K', comments: 699, time: '19h ago', url: 'https://reddit.com/r/therewasanattempt/comments/1rhhj90/', category: 'culture' },
];

function getCategoryColor(cat) {
  const colors = {
    breaking: '#e53935',
    politics: '#1565c0',
    diplomacy: '#6a1b9a',
    protest: '#e65100',
    ontheground: '#2e7d32',
    opinion: '#455a64',
    culture: '#00838f'
  };
  return colors[cat] || '#455a64';
}

function getCategoryLabel(cat) {
  const labels = {
    breaking: 'BREAKING NEWS',
    politics: 'POLITICS',
    diplomacy: 'DIPLOMACY',
    protest: 'PROTEST',
    ontheground: 'ON THE GROUND',
    opinion: 'OPINION',
    culture: 'CULTURE'
  };
  return labels[cat] || 'NEWS';
}

function buildPostCard(post) {
  const catColor = getCategoryColor(post.category);
  const catLabel = getCategoryLabel(post.category);
  return `
  <tr><td style="padding:6px 20px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid ${catColor}; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    <tr><td style="padding:14px 16px;">
      <div style="font-size:10px; color:${catColor}; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">${catLabel}</div>
      <div style="font-size:14px; color:#1a1a2e; font-weight:700; line-height:1.4; margin-bottom:8px;">${post.title}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="font-size:12px; color:#1565c0; font-weight:600;">u/${post.author}</td>
        <td align="right" style="font-size:11px; color:#888888;">${post.time}</td>
      </tr>
      </table>
      <div style="margin-top:6px; font-size:11px; color:#666666;">
        <span style="color:${catColor}; font-weight:600;">${post.subreddit}</span>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span style="font-weight:600;">${post.score}</span> upvotes
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span style="font-weight:600;">${post.comments.toLocaleString()}</span> comments
      </div>
    </td></tr>
    </table>
  </td></tr>`;
}

const breakingPosts = posts.filter(p => p.category === 'breaking');
const politicsPosts = posts.filter(p => p.category === 'politics');
const diplomacyPosts = posts.filter(p => p.category === 'diplomacy');
const otherPosts = posts.filter(p => !['breaking','politics','diplomacy'].includes(p.category));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Iran Reddit Intelligence</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Hero -->
<tr><td style="background:#1a1a2e; padding:28px 20px; text-align:center;">
  <div style="font-size:11px; letter-spacing:4px; color:#e53935; text-transform:uppercase; margin-bottom:8px; font-weight:600;">REDDIT INTELLIGENCE</div>
  <div style="font-size:24px; font-weight:700; color:#ffffff; line-height:1.3;">Iran: Last 24 Hours</div>
  <div style="font-size:13px; color:#cccccc; margin-top:8px;">1 March 2026 | 25 top posts | 18 featured below</div>
</td></tr>

<!-- Summary Stats -->
<tr><td style="padding:16px 20px 8px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e8f5e9; border-radius:10px;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:13px; color:#1b5e20; font-weight:700; margin-bottom:6px;">Key Developments</div>
    <div style="font-size:13px; color:#333333; line-height:1.7;">
      &#8226; US military operations in Iran ongoing, Trump monitoring from situation room<br>
      &#8226; Iran Supreme Leader Ayatollah Khamenei reported killed (Israeli official)<br>
      &#8226; 100+ children reportedly killed in school bombing<br>
      &#8226; Iran declares closure of the Strait of Hormuz<br>
      &#8226; At least 3 US soldiers killed<br>
      &#8226; LA protests against the war<br>
      &#8226; Only 21% of Americans support the attack<br>
      &#8226; Putin comments on Iran nuclear deal
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- BREAKING NEWS -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:13px; letter-spacing:2px; color:#e53935; text-transform:uppercase; font-weight:700;">Breaking News</div>
</td></tr>
${breakingPosts.map(buildPostCard).join('\n')}

<!-- POLITICS -->
<tr><td style="padding:20px 20px 4px 20px;">
  <div style="font-size:13px; letter-spacing:2px; color:#1565c0; text-transform:uppercase; font-weight:700;">Politics</div>
</td></tr>
${politicsPosts.map(buildPostCard).join('\n')}

<!-- DIPLOMACY -->
<tr><td style="padding:20px 20px 4px 20px;">
  <div style="font-size:13px; letter-spacing:2px; color:#6a1b9a; text-transform:uppercase; font-weight:700;">Diplomacy</div>
</td></tr>
${diplomacyPosts.map(buildPostCard).join('\n')}

<!-- OTHER -->
<tr><td style="padding:20px 20px 4px 20px;">
  <div style="font-size:13px; letter-spacing:2px; color:#455a64; text-transform:uppercase; font-weight:700;">Culture, Protests &amp; Commentary</div>
</td></tr>
${otherPosts.map(buildPostCard).join('\n')}

<!-- Sentiment -->
<tr><td style="padding:20px 20px 8px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a2e; border-radius:12px;">
  <tr><td style="padding:20px; text-align:center;">
    <div style="font-size:11px; letter-spacing:3px; color:#e53935; text-transform:uppercase; margin-bottom:10px;">REDDIT SENTIMENT</div>
    <div style="font-size:14px; color:#ffffff; line-height:1.7;">
      Overwhelmingly <strong style="color:#e53935;">anti-war</strong> sentiment across all major subreddits. High engagement (5,600+ comments on a single post). Strong criticism of the military action from both left and right (MAGA voices like MTG, Tucker Carlson quoted pushing back). Significant concern about civilian casualties and escalation.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Data source -->
<tr><td style="padding:12px 20px 6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e3f2fd; border-radius:10px;">
  <tr><td style="padding:12px 16px; text-align:center;">
    <div style="font-size:12px; color:#0d47a1; font-weight:600;">Data Source: Reddit JSON API via Puppeteer MCP</div>
    <div style="font-size:11px; color:#555555; margin-top:2px;">Scraped 1 March 2026 | Top posts sorted by score | Last 24 hours</div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 20px 24px 20px; text-align:center; border-top:1px solid #eeeef2;">
  <div style="font-size:11px; color:#999999; margin-bottom:4px;">NAVADA Edge | Reddit Intelligence Digest</div>
  <div style="font-size:10px; color:#bbbbbb;">Automated by Claude | Lee Akpareva</div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  try {
    const info = await transporter.sendMail({
      from: '"NAVADA Intelligence" <claude.navada@zohomail.eu>',
      to: 'leeakpareva@gmail.com',
      subject: 'Reddit Iran Digest: 18 Top Posts, Last 24 Hours (1 March 2026)',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
