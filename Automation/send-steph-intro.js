/**
 * Intro email for Steph (Stephanie Hasham) — NAVADA Edge replication
 * Mobile-first, single-column, dark theme
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
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<!-- Wrapper -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Hero -->
<tr>
  <td style="padding:32px 20px; text-align:center; background: linear-gradient(135deg, #8338EC 0%, #0a0a0a 50%, #00C9FF 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:10px;">NAVADA EDGE</div>
    <div style="font-size:24px; font-weight:900; color:#ffffff; line-height:1.2;">Your Own AI Chief of Staff</div>
    <div style="margin-top:10px; font-size:13px; color:rgba(255,255,255,0.7);">Running 24/7 from your own machine, controlled from your phone.</div>
  </td>
</tr>

<!-- Intro -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #8338EC; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Welcome</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Hey Steph</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      Good to connect. I wanted to show you what I have been building and how we are going to replicate it for you.
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      <strong style="color:#ffffff;">The short version:</strong> I have an AI that runs my entire business operations 24/7. It sends emails, writes reports, monitors my inbox, finds leads, posts to LinkedIn, manages servers, and does research. All from my phone via Telegram. <strong style="color:#8338EC;">We are going to build the same thing for you.</strong>
    </div>
  </td>
</tr>

<!-- What Is It -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #00C9FF; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#00C9FF; text-transform:uppercase; font-weight:700;">The Concept</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What Is NAVADA Edge?</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      Most people use AI like a search engine. Ask a question, get an answer, copy-paste it somewhere. That is using a supercomputer as a calculator.
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      <strong style="color:#ffffff;">NAVADA Edge is different.</strong> Claude (the AI) gets installed on a <strong style="color:#00C9FF;">dedicated machine</strong> that stays on permanently. It has full access to your files, email, databases, and tools. You control it from your phone. It does not just answer questions. It <strong style="color:#FFD700;">runs things for you</strong>.
    </div>
  </td>
</tr>

<!-- How It Works -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #22c55e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#22c55e; text-transform:uppercase; font-weight:700;">Architecture</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">How It All Connects</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:12px 16px 20px 16px; background:#0a0a0a;">
    <!-- Connection diagram -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:10px; border:1px solid #222;">
      <tr><td style="padding:20px; text-align:center;">

        <!-- Phone -->
        <div style="display:inline-block; background:#1a1a2e; border:2px solid #8338EC; border-radius:10px; padding:12px 20px; margin-bottom:4px;">
          <div style="font-size:22px;">&#128241;</div>
          <div style="font-size:12px; font-weight:700; color:#ffffff;">Your Phone</div>
          <div style="font-size:10px; color:#999;">Telegram app</div>
        </div>

        <div style="font-size:18px; color:#8338EC; margin:6px 0;">&#8595;</div>
        <div style="font-size:10px; color:#666; letter-spacing:0.1em;">ENCRYPTED TUNNEL</div>
        <div style="font-size:18px; color:#8338EC; margin:6px 0;">&#8595;</div>

        <!-- Server -->
        <div style="display:inline-block; background:#1a1a2e; border:2px solid #00C9FF; border-radius:10px; padding:12px 20px; margin-bottom:4px;">
          <div style="font-size:22px;">&#128187;</div>
          <div style="font-size:12px; font-weight:700; color:#ffffff;">Your Edge Server</div>
          <div style="font-size:10px; color:#999;">Always on, at home</div>
        </div>

        <div style="font-size:18px; color:#00C9FF; margin:6px 0;">&#8595;</div>

        <!-- Claude Brain -->
        <div style="display:inline-block; background:#1a1a2e; border:2px solid #FFD700; border-radius:10px; padding:12px 20px; margin-bottom:8px;">
          <div style="font-size:22px;">&#129504;</div>
          <div style="font-size:12px; font-weight:700; color:#ffffff;">Claude (AI Brain)</div>
          <div style="font-size:10px; color:#999;">Full system access + memory</div>
        </div>

        <div style="font-size:18px; color:#FFD700; margin:6px 0;">&#8595;</div>
        <div style="font-size:10px; color:#666; letter-spacing:0.1em; margin-bottom:8px;">CONNECTED TOOLS</div>

        <!-- Tools grid -->
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px;">
          <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc;">&#9993; Email</div>
          <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc;">&#128196; Files</div>
          <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc;">&#128202; Data</div>
          <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc;">&#127760; Web</div>
          <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc;">&#128247; Images</div>
          <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc;">&#128640; Deploy</div>
        </div>

      </td></tr>
    </table>
  </td>
</tr>

<!-- What Mine Does -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Live Example</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What My AI Does Every Day</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      This is not a concept. This is running right now on my server. Claude handles all of this autonomously:
    </div>

    <!-- Schedule cards -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">
      <tr><td style="padding:8px 0;">
        <div style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0; padding:10px 14px;">
          <div style="font-size:11px; color:#FFD700; font-weight:700;">6:30 AM</div>
          <div style="font-size:13px; color:#eee;">Morning briefing: priorities, weather, calendar</div>
        </div>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <div style="background:#111; border-left:3px solid #00C9FF; border-radius:0 6px 6px 0; padding:10px 14px;">
          <div style="font-size:11px; color:#00C9FF; font-weight:700;">7:00 AM</div>
          <div style="font-size:13px; color:#eee;">Scans AI news, writes a digest, emails it to me</div>
        </div>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <div style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0; padding:10px 14px;">
          <div style="font-size:11px; color:#8338EC; font-weight:700;">8:30 AM</div>
          <div style="font-size:13px; color:#eee;">Lead pipeline: finds prospects, verifies emails, sends outreach</div>
        </div>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <div style="background:#111; border-left:3px solid #22c55e; border-radius:0 6px 6px 0; padding:10px 14px;">
          <div style="font-size:11px; color:#22c55e; font-weight:700;">9:00 AM</div>
          <div style="font-size:13px; color:#eee;">Hunts for job opportunities matching my profile</div>
        </div>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <div style="background:#111; border-left:3px solid #ff6b35; border-radius:0 6px 6px 0; padding:10px 14px;">
          <div style="font-size:11px; color:#ff6b35; font-weight:700;">ALL DAY</div>
          <div style="font-size:13px; color:#eee;">Monitors inbox every 2 hours, auto-replies to emails</div>
        </div>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <div style="background:#111; border-left:3px solid #ff006e; border-radius:0 6px 6px 0; padding:10px 14px;">
          <div style="font-size:11px; color:#ff006e; font-weight:700;">ON DEMAND</div>
          <div style="font-size:13px; color:#eee;">Anything I ask via Telegram: research, images, emails, reports</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Stats -->
<tr>
  <td style="padding:12px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #111 0%, #1a1a2e 100%); border-radius:10px; border:1px solid #222;">
      <tr><td style="padding:20px; text-align:center;">
        <div style="font-size:10px; letter-spacing:0.2em; color:#666; text-transform:uppercase; margin-bottom:14px;">What is running on my server right now</div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="text-align:center; padding:8px;">
              <div style="font-size:28px; font-weight:900; color:#8338EC;">23</div>
              <div style="font-size:10px; color:#999;">Tool Integrations</div>
            </td>
            <td style="text-align:center; padding:8px;">
              <div style="font-size:28px; font-weight:900; color:#00C9FF;">18</div>
              <div style="font-size:10px; color:#999;">Scheduled Tasks</div>
            </td>
            <td style="text-align:center; padding:8px;">
              <div style="font-size:28px; font-weight:900; color:#FFD700;">8</div>
              <div style="font-size:10px; color:#999;">Always-On Services</div>
            </td>
          </tr>
          <tr>
            <td style="text-align:center; padding:8px;">
              <div style="font-size:28px; font-weight:900; color:#22c55e;">42+</div>
              <div style="font-size:10px; color:#999;">Telegram Commands</div>
            </td>
            <td style="text-align:center; padding:8px;">
              <div style="font-size:28px; font-weight:900; color:#ff6b35;">24/7</div>
              <div style="font-size:10px; color:#999;">Availability</div>
            </td>
            <td style="text-align:center; padding:8px;">
              <div style="font-size:28px; font-weight:900; color:#ff006e;">0</div>
              <div style="font-size:10px; color:#999;">Cloud Dependency</div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- How We Replicate -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ff006e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ff006e; text-transform:uppercase; font-weight:700;">Your Build</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">How We Replicate This For You</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      The process is straightforward. I handle everything technical. You tell me what your AI needs to do, and I build it.
    </div>

    <!-- Steps -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
      <tr><td style="padding:6px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:32px; vertical-align:top; padding-top:2px;">
              <div style="width:28px; height:28px; background:#8338EC; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:800; color:#fff;">1</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:14px; font-weight:700; color:#ffffff;">Discovery Call</div>
              <div style="font-size:13px; color:#999; margin-top:2px;">We map out your daily tasks, tools, and workflows. What do you want automated?</div>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:32px; vertical-align:top; padding-top:2px;">
              <div style="width:28px; height:28px; background:#00C9FF; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:800; color:#fff;">2</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:14px; font-weight:700; color:#ffffff;">Hardware Setup</div>
              <div style="font-size:13px; color:#999; margin-top:2px;">Any laptop or mini PC works. I configure it as your dedicated Edge server with encrypted remote access.</div>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:32px; vertical-align:top; padding-top:2px;">
              <div style="width:28px; height:28px; background:#22c55e; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:800; color:#fff;">3</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:14px; font-weight:700; color:#ffffff;">Agent Build</div>
              <div style="font-size:13px; color:#999; margin-top:2px;">I install Claude, connect your email, tools, and APIs. Build your custom automations and Telegram interface.</div>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:32px; vertical-align:top; padding-top:2px;">
              <div style="width:28px; height:28px; background:#FFD700; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:800; color:#000;">4</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:14px; font-weight:700; color:#ffffff;">Go Live</div>
              <div style="font-size:13px; color:#999; margin-top:2px;">Your AI is running 24/7. You control everything from Telegram on your phone. I train you on how to use it.</div>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:32px; vertical-align:top; padding-top:2px;">
              <div style="width:28px; height:28px; background:#ff006e; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:800; color:#fff;">5</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:14px; font-weight:700; color:#ffffff;">Iterate</div>
              <div style="font-size:13px; color:#999; margin-top:2px;">As you use it, we add more automations. Your AI gets smarter and more useful over time.</div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- What Your AI Could Do -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #00C9FF; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#00C9FF; text-transform:uppercase; font-weight:700;">Possibilities</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What Your AI Could Do</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      Every setup is different because every business is different. Here are some examples of what we can build:
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#8338EC;">&#9632;</span> Draft and send emails on your behalf
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#00C9FF;">&#9632;</span> Monitor your inbox and flag important messages
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#22c55e;">&#9632;</span> Write daily/weekly reports and send them to you
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#FFD700;">&#9632;</span> Research anything and deliver structured summaries
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#ff6b35;">&#9632;</span> Post to social media (LinkedIn, etc.) on schedule
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#ff006e;">&#9632;</span> Find leads, verify contacts, run outreach campaigns
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#8338EC;">&#9632;</span> Generate images, presentations, and creative content
        </div>
      </td></tr>
      <tr><td style="padding:5px 0;">
        <div style="background:#111; border-radius:6px; padding:10px 14px; font-size:13px; color:#eee;">
          <span style="color:#00C9FF;">&#9632;</span> Track expenses, manage data, run analytics
        </div>
      </td></tr>
    </table>

    <div style="font-size:13px; color:#999; margin-top:12px; line-height:1.6;">
      Basically, anything you currently do on a computer that is repetitive, time-consuming, or tedious: Claude can learn to do it for you.
    </div>
  </td>
</tr>

<!-- The Deal -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #22c55e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#22c55e; text-transform:uppercase; font-weight:700;">Options</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Three Ways To Get Started</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:12px 16px 20px 16px; background:#0a0a0a;">

    <!-- Tier 1 -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:10px;">
      <tr><td style="background:#111; border:1px solid #8338EC; border-radius:10px; padding:16px;">
        <div style="font-size:10px; letter-spacing:0.15em; color:#8338EC; text-transform:uppercase; font-weight:700;">Tier 1: Managed</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-top:4px;">I Run It For You</div>
        <div style="font-size:13px; color:#999; margin-top:8px; line-height:1.6;">
          Your AI agent lives on NAVADA infrastructure. I build it, maintain it, and keep it running. You just use it via Telegram. Zero tech knowledge needed.
        </div>
        <div style="margin-top:10px; font-size:12px; color:#ccc;">
          <span style="color:#22c55e;">&#10003;</span> Setup + onboarding included<br>
          <span style="color:#22c55e;">&#10003;</span> Hosting + maintenance included<br>
          <span style="color:#22c55e;">&#10003;</span> Support included<br>
          <span style="color:#22c55e;">&#10003;</span> No hardware needed from you
        </div>
      </td></tr>
    </table>

    <!-- Tier 2 -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:10px;">
      <tr><td style="background:#111; border:1px solid #00C9FF; border-radius:10px; padding:16px;">
        <div style="font-size:10px; letter-spacing:0.15em; color:#00C9FF; text-transform:uppercase; font-weight:700;">Tier 2: Self-Hosted</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-top:4px;">Your Machine, I Build It</div>
        <div style="font-size:13px; color:#999; margin-top:8px; line-height:1.6;">
          You provide a laptop or mini PC. I deploy the full NAVADA Edge setup on your hardware. Your data stays on your machine. You own everything.
        </div>
        <div style="margin-top:10px; font-size:12px; color:#ccc;">
          <span style="color:#22c55e;">&#10003;</span> Full deployment + consulting<br>
          <span style="color:#22c55e;">&#10003;</span> Complete data sovereignty<br>
          <span style="color:#22c55e;">&#10003;</span> Your own Claude subscription<br>
          <span style="color:#22c55e;">&#10003;</span> One-off fee, no monthly to NAVADA
        </div>
      </td></tr>
    </table>

    <!-- Tier 3 -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background:#111; border:1px solid #FFD700; border-radius:10px; padding:16px;">
        <div style="font-size:10px; letter-spacing:0.15em; color:#FFD700; text-transform:uppercase; font-weight:700;">Tier 3: Franchise</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-top:4px;">Learn To Build It Yourself</div>
        <div style="font-size:13px; color:#999; margin-top:8px; line-height:1.6;">
          Full knowledge transfer. I train you on the entire architecture, deployment process, and business model. You can deploy NAVADA Edge for your own clients.
        </div>
        <div style="margin-top:10px; font-size:12px; color:#ccc;">
          <span style="color:#22c55e;">&#10003;</span> Complete playbook + assets<br>
          <span style="color:#22c55e;">&#10003;</span> 5-day face-to-face training<br>
          <span style="color:#22c55e;">&#10003;</span> Deploy for your own clients<br>
          <span style="color:#22c55e;">&#10003;</span> 30-day post-training support
        </div>
      </td></tr>
    </table>

  </td>
</tr>

<!-- CTA -->
<tr>
  <td style="padding:12px 16px 24px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #8338EC 0%, #00C9FF 100%); border-radius:10px;">
      <tr><td style="padding:24px 20px; text-align:center;">
        <div style="font-size:18px; font-weight:800; color:#ffffff;">Next Step</div>
        <div style="font-size:14px; color:rgba(255,255,255,0.9); margin-top:8px; line-height:1.6;">
          Let me know which option sounds right for you, or if you want to jump on a quick call to map out what your AI should do. I can have a working prototype within 48 hours of your brief.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Signature -->
<tr>
  <td style="padding:24px 20px; background:#0a0a0a; border-top:1px solid #222;">
    <div style="font-size:14px; font-weight:700; color:#ffffff;">Lee Akpareva</div>
    <div style="font-size:12px; color:#999; margin-top:4px;">Founder, NAVADA | Principal AI Consultant</div>
    <div style="font-size:12px; color:#666; margin-top:4px;">leeakpareva@gmail.com</div>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:16px 20px; text-align:center;">
    <div style="height:3px; background: linear-gradient(90deg, #8338EC, #00C9FF, #FFD700); border-radius:2px; margin-bottom:12px;"></div>
    <div style="font-size:10px; letter-spacing:0.2em; color:#444; text-transform:uppercase;">NAVADA</div>
  </td>
</tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  try {
    await transporter.sendMail({
      from: '"Lee Akpareva | NAVADA" <' + process.env.ZOHO_USER + '>',
      to: 'stephaniehasham@gmail.com',
      cc: process.env.RECIPIENT_EMAIL,
      subject: 'Your Own AI Chief of Staff | NAVADA Edge',
      html,
    });
    console.log('Sent: NAVADA Edge intro to Steph');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

send();
