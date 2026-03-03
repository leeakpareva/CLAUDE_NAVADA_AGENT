/**
 * NAVADA Edge LinkedIn Post Preview Email
 * Retro synthwave template — for Lee's approval before posting to LinkedIn
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

const SHOTS = path.join(__dirname, 'screenshots');

// The actual LinkedIn post text (will be posted verbatim after approval)
const linkedinText = `In 2025, I gave Claude its own laptop and told it to run my business.

Not a chatbot. Not a browser tab. A full home server with terminal access, email, databases, 23 tool integrations, and 18 scheduled automations. Controlled entirely from my iPhone.

It sends me a briefing before I wake up. It monitors my inbox every 2 hours. It runs my CRM pipeline, tracks markets, scrapes leads, generates reports, and sends client emails. All autonomously. All on a machine I own.

I call it NAVADA Edge.

Here is what makes it different from every AI tool you have used:

1. AI lives on YOUR machine. Full file system, terminal, and database access. Not a sandbox. Not an API wrapper. A real system operator.

2. You control it from your phone. Tailscale encrypted mesh networking. Send a message from anywhere in the world, Claude executes it on your server.

3. It works while you sleep. Windows Task Scheduler runs 18 daily automations: news digests, market analysis, lead generation, email marketing, operations reports. Zero manual input.

4. Your data never leaves. No cloud dependency. No third-party storage. Everything lives on your physical hardware. Full data sovereignty.

5. It costs almost nothing to run. A laptop draws 35-65W. Claude subscription is $20/month. No AWS bills. No infrastructure team. No DevOps overhead.

This is not a product you buy. It is a deployment service. I architect the system. Claude builds it. You own it.

We have deployed this for entrepreneurs, consultants, restaurants, and we are expanding into enterprise and international markets.

If you are an individual who wants an AI employee that actually runs things, or a business that needs AI automation without cloud dependency, this is the model.

The era of AI-as-a-browser-tab is ending.
The era of AI-as-infrastructure is here.

#AI #Automation #EdgeComputing #DataSovereignty #AIConsulting #NAVADA #ClaudeAI #FutureOfWork #AIStrategy #DigitalTransformation`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>NAVADA Edge — LinkedIn Post Preview</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;">NAVADA Edge: Your AI employee that runs your business 24/7 from a home server you own.</div>

<!-- Outer Wrapper -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;margin:0 auto;">

<!-- APPROVAL BANNER -->
<tr><td style="padding:14px 20px;background:#1a0033;border-bottom:2px solid #a855f7;text-align:center;">
  <div style="font-size:11px;letter-spacing:0.2em;color:#a855f7;text-transform:uppercase;font-weight:700;">LINKEDIN POST PREVIEW</div>
  <div style="font-size:12px;color:#cccccc;margin-top:4px;">Reply to approve or request changes before posting</div>
</td></tr>

<!-- Hero Image -->
<tr><td style="padding:0;">
  <img src="cid:hero" alt="NAVADA Edge AI home server" style="width:100%;display:block;" />
</td></tr>

<!-- Hero Text -->
<tr><td style="padding:24px 20px 8px 20px;text-align:center;background:#0a0a0a;">
  <div style="font-size:10px;letter-spacing:0.4em;color:#ff006e;text-transform:uppercase;font-weight:700;">NAVADA EDGE | 2026</div>
  <div style="font-size:24px;font-weight:900;color:#ffffff;line-height:1.2;margin-top:8px;">YOUR AI EMPLOYEE</div>
  <div style="font-size:14px;color:#cccccc;margin-top:6px;letter-spacing:0.08em;">That Runs Your Business 24/7</div>
  <div style="margin-top:14px;height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;"></div>
</td></tr>

<!-- Intro -->
<tr><td style="padding:20px 20px 16px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    Most people use AI like a search engine: ask a question, get an answer, copy-paste it somewhere. That is using a supercomputer as a calculator. <strong style="color:#ffffff;">NAVADA Edge is different.</strong> We give Claude a permanent home: a machine that is always on, with full access to your files, email, databases, and tools. You control it from your phone. It does not just answer questions. <strong style="color:#00fff7;">It runs things.</strong>
  </div>
</td></tr>

<!-- ========== CHAPTER 01: THE CONCEPT ========== -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#ff006e;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#ff006e;text-transform:uppercase;font-weight:700;">Chapter 01</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">What Is NAVADA Edge?</div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="padding:10px 20px 16px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    NAVADA Edge is an AI deployment service. We install Claude as a permanent AI Chief of Staff on your own hardware. A laptop or mini PC that is always on, always connected, and always working for you. No cloud. No subscriptions beyond Claude itself ($20/month). Total control.
  </div>
</td></tr>

<!-- Architecture card -->
<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;border:1px solid #222222;">
    <tr><td style="padding:18px;">
      <div style="font-size:12px;color:#ff006e;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">THE ARCHITECTURE</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td style="padding:8px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#00fff7;font-weight:800;">YOUR PHONE</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">Telegram or any messaging app. Send commands in natural language from anywhere in the world.</div>
        </td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#ff006e;font-weight:800;">ENCRYPTED TUNNEL</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">Tailscale mesh VPN. Military-grade encryption. Zero configuration. Phone to server from anywhere.</div>
        </td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#ff6b35;font-weight:800;">YOUR SERVER</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">A laptop or mini PC in your home/office. Claude has full system access: files, terminal, databases, email, APIs.</div>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <div style="font-size:13px;color:#a855f7;font-weight:800;">AUTONOMOUS OPERATIONS</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">Scheduled tasks run 24/7. Briefings, reports, email marketing, lead generation, monitoring. All before you wake up.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- Phone Control Image -->
<tr><td style="padding:16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:8px;overflow:hidden;">
    <tr><td style="padding:0;">
      <img src="cid:phone" alt="Phone controlling AI server remotely" style="width:100%;display:block;border-radius:8px 8px 0 0;" />
    </td></tr>
    <tr><td style="padding:10px 14px;background:#111111;border-radius:0 0 8px 8px;">
      <div style="font-size:10px;color:#00fff7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fig.01</div>
      <div style="font-size:12px;color:#cccccc;margin-top:2px;">Phone to server: encrypted control from anywhere on Earth</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 02: WHY IT MATTERS ========== -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#00fff7;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#00fff7;text-transform:uppercase;font-weight:700;">Chapter 02</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">Five Reasons This Changes Everything</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Reason cards -->
<tr><td style="padding:10px 20px 6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #ff006e;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:15px;font-weight:800;color:#ff006e;">01. AI Lives on YOUR Machine</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">Full file system, terminal, and database access. Not a sandbox. Not an API wrapper. A real system operator that can read, write, deploy, and manage your entire digital infrastructure.</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #00fff7;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:15px;font-weight:800;color:#00fff7;">02. Control It from Your Phone</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">Tailscale encrypted mesh networking. Send a message from a beach in Bali or a boardroom in London. Claude executes it on your server instantly.</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #ff6b35;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:15px;font-weight:800;color:#ff6b35;">03. It Works While You Sleep</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">Scheduled automations run 24/7: morning briefings, email marketing, lead generation, market analysis, operations reports. Your AI employee never clocks off.</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #a855f7;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:15px;font-weight:800;color:#a855f7;">04. Your Data Never Leaves</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">No cloud dependency. No third-party storage. Everything lives on your physical hardware. Full data sovereignty for individuals and businesses operating in regulated industries.</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #22c55e;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:15px;font-weight:800;color:#22c55e;">05. It Costs Almost Nothing</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">A laptop draws 35-65W. Claude subscription is $20/month. No AWS bills. No infrastructure team. No DevOps overhead. Enterprise AI capability at consumer pricing.</div>
    </td></tr>
  </table>
</td></tr>

<!-- Automations Image -->
<tr><td style="padding:16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:8px;overflow:hidden;">
    <tr><td style="padding:0;">
      <img src="cid:automations" alt="AI autonomous operations diagram" style="width:100%;display:block;border-radius:8px 8px 0 0;" />
    </td></tr>
    <tr><td style="padding:10px 14px;background:#111111;border-radius:0 0 8px 8px;">
      <div style="font-size:10px;color:#ff6b35;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fig.02</div>
      <div style="font-size:12px;color:#cccccc;margin-top:2px;">18 autonomous tasks: email, CRM, trading, news, reports, lead gen</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 03: WHO IS IT FOR ========== -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#ff6b35;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#ff6b35;text-transform:uppercase;font-weight:700;">Chapter 03</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">Who Is This For?</div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="padding:10px 20px 6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;border:1px solid #222222;">
    <tr><td style="padding:18px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td style="padding:8px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#ff006e;font-weight:800;">INDIVIDUALS</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">Entrepreneurs, executives, consultants, content creators, investors. Your own AI Chief of Staff managing email, research, scheduling, outreach, and reporting.</div>
        </td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#00fff7;font-weight:800;">SMALL BUSINESSES</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">Restaurants, law firms, agencies, startups. Automate CRM, email marketing, social media, bookings, inventory, and daily operations without hiring a tech team.</div>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <div style="font-size:13px;color:#a855f7;font-weight:800;">ENTERPRISE</div>
          <div style="font-size:13px;color:#cccccc;margin-top:4px;line-height:1.6;">Banks, fintechs, healthcare, government. On-premise AI with full data sovereignty. No data leaving the building. Regulatory compliance built in.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- Sovereignty Image -->
<tr><td style="padding:16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:8px;overflow:hidden;">
    <tr><td style="padding:0;">
      <img src="cid:sovereignty" alt="Data sovereignty shield concept" style="width:100%;display:block;border-radius:8px 8px 0 0;" />
    </td></tr>
    <tr><td style="padding:10px 14px;background:#111111;border-radius:0 0 8px 8px;">
      <div style="font-size:10px;color:#a855f7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fig.03</div>
      <div style="font-size:12px;color:#cccccc;margin-top:2px;">Data sovereignty: your data stays on your hardware, always</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 04: STATS ========== -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#a855f7;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#a855f7;text-transform:uppercase;font-weight:700;">Chapter 04</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">The NAVADA Reference Server</div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="padding:10px 20px 12px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    My own NAVADA Edge deployment is the living proof of concept. Here is what it runs daily on a single HP laptop:
  </div>
</td></tr>

<!-- Stats stacked -->
<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;">
      <div style="font-size:32px;font-weight:900;color:#ff006e;">18</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Scheduled automations running daily</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;">
      <div style="font-size:32px;font-weight:900;color:#00fff7;">23</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">MCP tool integrations (databases, web, APIs)</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;">
      <div style="font-size:32px;font-weight:900;color:#ff6b35;">42+</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Telegram slash commands for mobile control</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;">
      <div style="font-size:32px;font-weight:900;color:#a855f7;">$20/mo</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Total running cost (Claude subscription only)</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 05: THE BOTTOM LINE ========== -->
<tr><td style="padding:24px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#22c55e;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#22c55e;text-transform:uppercase;font-weight:700;">Chapter 05</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">The Bottom Line</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Quote -->
<tr><td style="padding:12px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #ff006e;border-radius:0 8px 8px 0;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:28px;color:#ff006e;font-weight:300;line-height:1;">&ldquo;</div>
      <div style="font-size:14px;color:#ffffff;font-style:italic;line-height:1.8;margin-top:4px;">
        The era of AI-as-a-browser-tab is ending. The era of AI-as-infrastructure is here.
      </div>
      <div style="font-size:12px;color:#cccccc;margin-top:10px;font-weight:600;">Lee Akpareva, Founder of NAVADA</div>
    </td></tr>
  </table>
</td></tr>

<!-- Key Takeaways -->
<tr><td style="padding:16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;border:1px solid #222222;">
    <tr><td style="padding:20px;">
      <div style="font-size:12px;color:#ff006e;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:14px;">KEY TAKEAWAYS</div>
      <div style="font-size:13px;color:#eeeeee;line-height:2.2;">
        <span style="color:#00fff7;font-weight:700;">01</span>&nbsp;&nbsp;AI should live on your machine, not in a browser tab.<br>
        <span style="color:#ff006e;font-weight:700;">02</span>&nbsp;&nbsp;Mobile-first control: run your server from your phone, anywhere.<br>
        <span style="color:#ff6b35;font-weight:700;">03</span>&nbsp;&nbsp;Autonomous operations: 18+ scheduled tasks, zero manual input.<br>
        <span style="color:#a855f7;font-weight:700;">04</span>&nbsp;&nbsp;Full data sovereignty: your data never touches the cloud.<br>
        <span style="color:#22c55e;font-weight:700;">05</span>&nbsp;&nbsp;Enterprise AI capability at $20/month. No DevOps required.
      </div>
    </td></tr>
  </table>
</td></tr>

<!-- LINKEDIN POST TEXT PREVIEW -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <div style="height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;margin-bottom:16px;"></div>
  <div style="font-size:11px;letter-spacing:0.2em;color:#ff006e;text-transform:uppercase;font-weight:700;margin-bottom:10px;">LINKEDIN POST TEXT (WILL BE POSTED VERBATIM)</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;border:1px solid #222222;">
    <tr><td style="padding:18px;">
      <div style="font-size:13px;color:#cccccc;line-height:1.8;white-space:pre-wrap;">${linkedinText}</div>
    </td></tr>
  </table>
</td></tr>

<!-- Gradient Divider -->
<tr><td style="padding:24px 20px 8px 20px;background:#0a0a0a;">
  <div style="height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;"></div>
</td></tr>

<!-- Signature -->
<tr><td style="padding:16px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding-right:12px;vertical-align:top;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="width:36px;height:36px;background:#000000;border:1px solid #333333;border-radius:4px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;font-weight:800;">C</td>
        </tr></table>
      </td>
      <td style="vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:#ffffff;">Claude</div>
        <div style="font-size:11px;color:#999999;line-height:1.5;">
          AI Chief of Staff | NAVADA<br>
          On behalf of Lee Akpareva
        </div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 20px 32px 20px;background:#0a0a0a;">
  <div style="height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;margin-bottom:14px;"></div>
  <div style="font-size:10px;color:#666666;text-align:center;line-height:1.6;">
    NAVADA Edge | LinkedIn Post Preview | Awaiting Approval<br>
    <a href="https://www.navadarobotics.com" style="color:#888888;text-decoration:none;">navadarobotics.com</a> |
    <a href="https://www.navada-lab.space" style="color:#888888;text-decoration:none;">navada-lab.space</a>
  </div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

(async () => {
  try {
    const info = await transporter.sendMail({
      from: `"Claude | NAVADA" <${process.env.ZOHO_USER}>`,
      to: 'leeakpareva@gmail.com',
      subject: 'FOR APPROVAL: NAVADA Edge LinkedIn Post (Retro Visual)',
      html,
      attachments: [
        { filename: 'edge-hero.png', path: path.join(SHOTS, 'edge-hero.png'), cid: 'hero' },
        { filename: 'edge-phone.png', path: path.join(SHOTS, 'edge-phone-control.png'), cid: 'phone' },
        { filename: 'edge-automations.png', path: path.join(SHOTS, 'edge-automations.png'), cid: 'automations' },
        { filename: 'edge-sovereignty.png', path: path.join(SHOTS, 'edge-sovereignty.png'), cid: 'sovereignty' },
      ],
    });
    console.log('Preview email sent:', info.messageId);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
