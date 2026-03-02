/**
 * NAVADA Edge — Architecture & Business Overview Document
 * Clean white UI, correct branding, sent as HTML email
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

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAVADA Edge</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Hero -->
<tr><td style="background:#0a0a0a; padding:36px 20px; text-align:center;">
  <div style="font-size:11px; letter-spacing:5px; color:#888888; text-transform:uppercase; margin-bottom:12px;">Architecture &amp; Business Overview</div>
  <div style="font-size:28px; font-weight:800; color:#ffffff; line-height:1.2; letter-spacing:-0.5px;">NAVADA Edge</div>
  <div style="font-size:13px; color:#666666; margin-top:10px;">Personal AI Operations Centre</div>
</td></tr>

<!-- Tagline -->
<tr><td style="padding:28px 20px 16px 20px; text-align:center;">
  <div style="font-size:20px; font-weight:800; color:#0a0a0a; line-height:1.3;">One laptop. 24/7.<br>An entire AI operations centre.</div>
</td></tr>

<!-- Stats Bar -->
<tr><td style="padding:8px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td width="25%" style="text-align:center; padding:12px 4px;">
      <div style="font-size:24px; font-weight:900; color:#0a0a0a;">24/7</div>
      <div style="font-size:10px; color:#888888; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">Always On</div>
    </td>
    <td width="25%" style="text-align:center; padding:12px 4px; border-left:1px solid #eeeeee;">
      <div style="font-size:24px; font-weight:900; color:#0a0a0a;">23</div>
      <div style="font-size:10px; color:#888888; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">AI Tools</div>
    </td>
    <td width="25%" style="text-align:center; padding:12px 4px; border-left:1px solid #eeeeee;">
      <div style="font-size:24px; font-weight:900; color:#0a0a0a;">19</div>
      <div style="font-size:10px; color:#888888; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">Live Panels</div>
    </td>
    <td width="25%" style="text-align:center; padding:12px 4px; border-left:1px solid #eeeeee;">
      <div style="font-size:24px; font-weight:900; color:#0a0a0a;">7</div>
      <div style="font-size:10px; color:#888888; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">Daily Tasks</div>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:8px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- Section: What is NAVADA Edge -->
<tr><td style="padding:20px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Overview</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">What is NAVADA Edge?</div>
  <div style="font-size:13px; color:#444444; line-height:1.8;">
    NAVADA Edge is a personal AI operations centre deployed on a single always-on laptop. It runs 24/7 with zero cloud infrastructure, controlled remotely from a mobile device over an encrypted Tailscale mesh VPN. No cloud bills. No DevOps team. One founder, one AI, one laptop.
  </div>
</td></tr>

<!-- Section: The Machine + The Control -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Hardware</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">The Setup</div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; font-weight:700; color:#0a0a0a; margin-bottom:6px;">The Machine</div>
    <div style="font-size:12px; color:#666666; line-height:1.7;">
      HP Laptop | Windows 11 Pro | Always On<br>
      This is not a cloud instance. It is not a data centre rack. It is a laptop sitting on a desk, running a production-grade AI stack.
    </div>
  </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; font-weight:700; color:#0a0a0a; margin-bottom:6px;">The Control</div>
    <div style="font-size:12px; color:#666666; line-height:1.7;">
      Controlled from an iPhone 15 Pro Max via Tailscale mesh VPN. Lee talks, Claude executes. Fully remote, fully encrypted, accessible from anywhere.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- Section: Architecture -->
<tr><td style="padding:12px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Architecture</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">Infrastructure Stack</div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">Access &amp; Routing</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Cloudflare Tunnel &amp; Tailscale mesh VPN</div>
  </td></tr>
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">Hosting Foundation</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Docker Desktop &amp; Nginx reverse proxy</div>
  </td></tr>
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">Backend &amp; Database</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Node.js, Python (FastAPI/Uvicorn), PostgreSQL</div>
  </td></tr>
  <tr><td style="padding:14px 16px;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">External Integrations</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Vercel (deployments) | Zoho SMTP (email) | GitHub (repositories)</div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- Section: AI Chief of Staff -->
<tr><td style="padding:12px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">AI Engine</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">Claude Code: AI Chief of Staff</div>
  <div style="font-size:13px; color:#444444; line-height:1.8;">
    Inside NAVADA Edge lives Claude, acting as the AI Chief of Staff with full system access. Autonomous capability to create files, run services, deploy to Vercel, send emails, query databases, and browse the web.
  </div>
</td></tr>

<!-- 23 Tools Grid -->
<tr><td style="padding:12px 20px 4px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Tooling</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">23 Integrated AI Tools</div>
</td></tr>

<!-- Core -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Core</div>
    <div style="font-size:12px; color:#444444; line-height:2.0;">GitHub | Puppeteer | PostgreSQL | Vercel</div>
  </td></tr>
  </table>
</td></tr>

<!-- Data & ML -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Data &amp; ML</div>
    <div style="font-size:12px; color:#444444; line-height:2.0;">Hugging Face | DuckDB | SQLite | dbt</div>
  </td></tr>
  </table>
</td></tr>

<!-- Web & Media -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Web &amp; Media</div>
    <div style="font-size:12px; color:#444444; line-height:2.0;">Bright Data | OpenAI Images</div>
  </td></tr>
  </table>
</td></tr>

<!-- Engineering -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Engineering</div>
    <div style="font-size:12px; color:#444444; line-height:2.0;">Jupyter | Excalidraw | Vizro | Optuna | NetworkX | DBHub</div>
  </td></tr>
  </table>
</td></tr>

<!-- Cognitive -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Cognitive &amp; Utility</div>
    <div style="font-size:12px; color:#444444; line-height:2.0;">Memory | Sequential Thinking | Context7 | Zaturn | Fermat | Zapier | Fetch</div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- Section: Daily Operations -->
<tr><td style="padding:12px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Autonomous Operations</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">Daily Schedule</div>
  <div style="font-size:12px; color:#888888; margin-bottom:12px;">Zero human intervention. Operations begin at 7:00 AM.</div>
</td></tr>

<!-- Timeline -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr><td style="padding:10px 0; border-left:3px solid #0a0a0a; padding-left:16px;">
    <div style="font-size:13px; font-weight:800; color:#0a0a0a;">7:00 AM</div>
    <div style="font-size:12px; font-weight:600; color:#333333; margin-top:2px;">AI News Digest</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Scrapes TechCrunch, The Verge, MIT Tech Review, VentureBeat. Curates top stories and emails a digest.</div>
  </td></tr>
  <tr><td style="padding:10px 0; border-left:3px solid #0a0a0a; padding-left:16px;">
    <div style="font-size:13px; font-weight:800; color:#0a0a0a;">8:00 AM</div>
    <div style="font-size:12px; font-weight:600; color:#333333; margin-top:2px;">Economy Report</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Compiles UK and US macro signals, unemployment data, and market indicators. Weekly briefing every Monday.</div>
  </td></tr>
  <tr><td style="padding:10px 0; border-left:3px solid #0a0a0a; padding-left:16px;">
    <div style="font-size:13px; font-weight:800; color:#0a0a0a;">8:30 AM</div>
    <div style="font-size:12px; font-weight:600; color:#333333; margin-top:2px;">Lead Pipeline</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Scans for new prospects. Runs email discovery via Hunter.io. Manages automated follow-up sequences via Zoho SMTP.</div>
  </td></tr>
  <tr><td style="padding:10px 0; border-left:3px solid #0a0a0a; padding-left:16px;">
    <div style="font-size:13px; font-weight:800; color:#0a0a0a;">9:00 AM</div>
    <div style="font-size:12px; font-weight:600; color:#333333; margin-top:2px;">Job Market Scanner</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Monitors job boards via Apify. Filters for AI/ML leadership roles and alerts on exact matches.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- Execution Model -->
<tr><td style="padding:12px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Execution</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">Continuous + On Demand</div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:10px;">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; letter-spacing:2px; color:#888888; text-transform:uppercase; margin-bottom:4px;">All Day</div>
    <div style="font-size:14px; font-weight:700; color:#ffffff; margin-bottom:4px;">Trading Bot &amp; World Monitor</div>
    <div style="font-size:12px; color:#aaaaaa; line-height:1.6;">Autonomous paper trading via Alpaca API with MA + RSI strategy. Live OSINT, geopolitical intelligence, and market data via World Monitor dashboard.</div>
  </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:10px;">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; letter-spacing:2px; color:#888888; text-transform:uppercase; margin-bottom:4px;">On Demand</div>
    <div style="font-size:14px; font-weight:700; color:#ffffff; margin-bottom:4px;">Claude Code</div>
    <div style="font-size:12px; color:#aaaaaa; line-height:1.6;">Triggered via mobile. Writes code, debugs, runs database queries, and manages deployments whenever Lee needs it.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- World Monitor -->
<tr><td style="padding:12px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Intelligence Hub</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">NAVADA World Monitor</div>
  <div style="font-size:13px; color:#444444; line-height:1.8;">
    A real-time intelligence dashboard tracking global conflicts, crypto markets, and AI research papers. Hosted locally, accessible from anywhere.
  </div>
</td></tr>

<!-- Geopolitics -->
<tr><td style="padding:8px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Geopolitics</div>
    <div style="font-size:12px; color:#444444; line-height:2.2;">
      Live Intelligence (GDELT)<br>
      Conflict Zones<br>
      Sanctions Tracker<br>
      Maritime Security
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Markets -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Markets</div>
    <div style="font-size:12px; color:#444444; line-height:2.2;">
      Portfolio Tracker<br>
      Trading Signals<br>
      Crypto &amp; Commodities<br>
      Prediction Markets
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Technology -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Technology</div>
    <div style="font-size:12px; color:#444444; line-height:2.2;">
      Tech Events Worldwide<br>
      AI Companies<br>
      Startup Hubs<br>
      Research Papers
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Economics -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:11px; font-weight:700; color:#0a0a0a; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Economics</div>
    <div style="font-size:12px; color:#444444; line-height:2.2;">
      UK Unemployment<br>
      Debt-to-GDP Ratios<br>
      Energy Prices<br>
      World Bank Data
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 20px;"><div style="border-top:1px solid #eeeeee;"></div></td></tr>

<!-- The Model -->
<tr><td style="padding:16px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:12px;">
  <tr><td style="padding:24px 20px; text-align:center;">
    <div style="font-size:11px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:12px;">The Model</div>
    <div style="font-size:15px; color:#ffffff; line-height:1.8; font-style:italic;">
      "This is what happens when you give an AI full access to a laptop and tell it to build an operations centre. No cloud. No team. Just me and Claude."
    </div>
    <div style="font-size:13px; color:#888888; margin-top:12px; font-weight:600;">Lee Akpareva, Founder of NAVADA</div>
  </td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:8px 20px 16px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:12px; border:1px solid #eeeeee;">
  <tr><td style="padding:20px; text-align:center;">
    <div style="font-size:16px; font-weight:800; color:#0a0a0a; margin-bottom:8px;">Examine the architecture live.</div>
    <div style="font-size:12px; color:#666666; line-height:1.6;">Want to see NAVADA Edge in action? Ask Lee for a live walkthrough.</div>
    <div style="margin-top:12px; font-size:13px; font-weight:700; color:#0a0a0a;">navada-world-view.xyz</div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 20px 24px 20px; text-align:center; border-top:1px solid #eeeeee;">
  <div style="font-size:12px; font-weight:700; color:#0a0a0a; margin-bottom:4px;">NAVADA Edge</div>
  <div style="font-size:11px; color:#888888;">NAVADA AI Engineering &amp; Consulting</div>
  <div style="font-size:10px; color:#bbbbbb; margin-top:4px;">navadarobotics.com | navada-lab.space</div>
  <div style="font-size:10px; color:#cccccc; margin-top:8px;">Designed and sent by Claude | AI Chief of Staff | NAVADA Edge</div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  try {
    const info = await transporter.sendMail({
      from: '"NAVADA Edge" <claude.navada@zohomail.eu>',
      to: 'leeakpareva@gmail.com',
      subject: 'NAVADA Edge — Architecture & Business Overview',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
