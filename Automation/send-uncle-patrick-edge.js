/**
 * Email to Uncle Patrick — NAVADA Edge + World Dashboard pitch
 * Modern, colorful template
 * Usage: node send-uncle-patrick-edge.js [tim-email]
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const timEmail = process.argv[2] || null;

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
<title>NAVADA Edge — Your AI Home Server</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Hero Banner -->
<tr><td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding:32px 20px; text-align:center;">
  <div style="font-size:11px; letter-spacing:4px; color:#e94560; text-transform:uppercase; margin-bottom:10px; font-weight:600;">NAVADA EDGE</div>
  <div style="font-size:24px; font-weight:700; color:#ffffff; line-height:1.3;">Your Own AI Home Server</div>
  <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:8px;">Personal AI infrastructure. Controlled from your phone.</div>
  <div style="margin-top:16px; padding:8px 16px; background:rgba(233,69,96,0.15); border-radius:20px; display:inline-block;">
    <span style="font-size:12px; color:#e94560; font-weight:600;">Built by Lee Akpareva | NAVADA</span>
  </div>
</td></tr>

<!-- Personal greeting -->
<tr><td style="padding:24px 20px 12px 20px;">
  <div style="font-size:15px; color:#1a1a2e; line-height:1.7;">
    Uncle Patrick,
  </div>
  <div style="font-size:14px; color:#444444; line-height:1.7; margin-top:10px;">
    Great to hear you are excited and looking forward to meeting on the <strong style="color:#1a1a2e;">14th March</strong>. I wanted to share what we have been building so you can see the full picture before we sit down.
  </div>
</td></tr>

<!-- What is NAVADA Edge -->
<tr><td style="padding:8px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f9ff; border-radius:12px; border-left:4px solid #0f3460;">
  <tr><td style="padding:16px;">
    <div style="font-size:15px; color:#1a1a2e; font-weight:700; margin-bottom:8px;">What is NAVADA Edge?</div>
    <div style="font-size:13px; color:#555555; line-height:1.7;">
      A personal AI system that runs on a laptop or mini PC at your home. It is not a chatbot. It is not an app. It is a full AI employee that operates 24/7 on your own machine, managed from your phone, and it handles real work for you every single day.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- The 4 Pillars -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">What It Does For You</div>
</td></tr>

<!-- Pillar 1 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #e94560 0%, #c23152 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#127760;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Live World Dashboard</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.85); line-height:1.6;">
      Real-time intelligence on your screen and phone. Markets, currencies, geopolitics, news, commodities, economic indicators. Updated automatically. Your own command centre.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Pillar 2 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #0f3460 0%, #16213e 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128202;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Daily Intelligence Briefing</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.85); line-height:1.6;">
      Every morning, your AI sends you a briefing to your phone: what happened overnight, what to watch today, market movements, key news, and action items. Like having your own analyst.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Pillar 3 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #533483 0%, #0b2447 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#9889;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Automated Tasks</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.85); line-height:1.6;">
      Your AI runs scheduled tasks while you sleep: research, reports, email drafts, data collection, market scanning, portfolio monitoring. You wake up and the work is done.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Pillar 4 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #e94560 0%, #533483 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128274;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Private &amp; Secure</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.85); line-height:1.6;">
      Everything runs on YOUR machine. No cloud servers. No third-party access. Encrypted connection between your phone and your server via Tailscale. Your data never leaves your home.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- World Dashboard Feature -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">The World Dashboard</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a2e; border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:rgba(255,255,255,0.9); line-height:1.8;">
      I built my own World Dashboard and it runs live on my home server right now. Here is what it tracks in real-time:<br><br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">Global markets</span> &#8212; S&amp;P 500, FTSE, Nikkei, DAX, crypto<br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">Currencies</span> &#8212; GBP/USD, EUR/USD, NGN, live forex<br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">Commodities</span> &#8212; Oil (Brent/WTI), Gold, Silver, Natural Gas<br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">Geopolitics</span> &#8212; Global conflict tracking, GDELT events<br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">Economic data</span> &#8212; Inflation, GDP, employment, central bank rates<br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">Technology</span> &#8212; AI breakthroughs, patent filings, tech trends<br>
      <span style="color:#e94560;">&#9632;</span> <span style="color:#ffffff;">News intelligence</span> &#8212; Filtered and categorised global news<br><br>
      We can build your own version, customised to your interests and investment focus. Accessible from your phone, your tablet, or any screen in your home.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- How it works -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">How It Works</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f9ff; border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#555555; line-height:2.0;">
      <span style="display:inline-block; width:24px; height:24px; background:#e94560; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">1</span> We set up a laptop or mini PC at your home<br>
      <span style="display:inline-block; width:24px; height:24px; background:#0f3460; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">2</span> Install Claude AI with full system access<br>
      <span style="display:inline-block; width:24px; height:24px; background:#533483; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">3</span> Connect your phone via encrypted Tailscale<br>
      <span style="display:inline-block; width:24px; height:24px; background:#e94560; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">4</span> Build your World Dashboard + automations<br>
      <span style="display:inline-block; width:24px; height:24px; background:#0f3460; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">5</span> You control everything from your phone
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- What you need -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">What You Need</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f9ff; border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#555555; line-height:1.8;">
      <span style="color:#e94560; font-weight:600;">Hardware:</span> A laptop or mini PC (from &#163;300)<br>
      <span style="color:#e94560; font-weight:600;">AI subscription:</span> Claude Pro (&#163;16/month)<br>
      <span style="color:#e94560; font-weight:600;">Networking:</span> Tailscale (free)<br>
      <span style="color:#e94560; font-weight:600;">Internet:</span> Your existing home broadband<br><br>
      <strong style="color:#1a1a2e;">Total ongoing cost: &#163;16/month.</strong> That is it.<br>
      Everything else is free or one-time.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Meeting -->
<tr><td style="padding:16px 20px 6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%); border-radius:12px;">
  <tr><td style="padding:20px; text-align:center;">
    <div style="font-size:11px; letter-spacing:3px; color:#e94560; text-transform:uppercase; margin-bottom:8px;">MEETING CONFIRMED</div>
    <div style="font-size:20px; font-weight:700; color:#ffffff;">14th March 2026</div>
    <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:6px;">Looking forward to sitting down and walking you through the full demo. I will bring my setup so you can see it live.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Closing -->
<tr><td style="padding:20px 20px 12px 20px;">
  <div style="font-size:14px; color:#444444; line-height:1.7;">
    This is the future of personal computing, Uncle Patrick. Your own AI, on your own machine, working for you around the clock. I am excited to show you what is possible.
  </div>
  <div style="font-size:14px; color:#1a1a2e; font-weight:600; margin-top:16px;">
    Lee
  </div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 20px 24px 20px; text-align:center; border-top:1px solid #eeeef2;">
  <div style="font-size:11px; color:#999999; margin-bottom:4px;">NAVADA Edge | Personal AI Infrastructure</div>
  <div style="font-size:10px; color:#bbbbbb;">Lee Akpareva | leeakpareva@gmail.com</div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  const cc = ['leeakpareva@gmail.com'];
  if (timEmail) cc.push(timEmail);

  try {
    const info = await transporter.sendMail({
      from: '"Lee Akpareva | NAVADA" <claude.navada@zohomail.eu>',
      to: 'patakpareva@gmail.com',
      cc: cc.join(', '),
      subject: 'NAVADA Edge — Your Own AI Home Server + World Dashboard',
      html,
    });
    console.log('Sent:', info.messageId);
    if (!timEmail) console.log('Note: Tim was not CC\'d. Run again with Tim\'s email: node send-uncle-patrick-edge.js tim@email.com');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
