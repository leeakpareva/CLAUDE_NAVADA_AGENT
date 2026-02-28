/**
 * NAVADA Intro Email — Jones (Blanche Park Consult)
 * Dark-themed visual email explaining NAVADA + Claude's autonomous capabilities
 * Sent from lee@navada.info via Zoho SMTP
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
<title>NAVADA — AI Consulting</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero Banner -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%);">
  <tr>
    <td style="padding: 56px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:0.4em; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:16px;">AI Engineering &amp; Consulting</div>
      <div style="font-size:42px; font-weight:900; color:#ffffff; letter-spacing:0.08em; line-height:1.1;">NAVADA</div>
      <div style="margin-top:16px; font-size:14px; color:rgba(255,255,255,0.6); line-height:1.6;">Autonomous AI systems that build, deploy, and manage<br>enterprise-grade applications around the clock.</div>
      <div style="margin-top:24px; width:60px; height:3px; background:rgba(14,165,233,0.6); display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

<!-- Personal Greeting -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 40px 24px 40px;">
      <div style="font-size:15px; color:#e0e0e0; line-height:1.8;">
        Hi Jones,
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 28px 40px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Great speaking with you. Lee mentioned you were impressed by the <strong style="color:#0ea5e9;">WorldMonitor dashboard</strong>, so he asked me to send over a proper introduction to NAVADA and explain exactly how the system works behind the scenes.
      </div>
    </td>
  </tr>
</table>

<!-- Section: About NAVADA -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#0ea5e9; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#0ea5e9; text-transform:uppercase; font-weight:700;">About</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What is NAVADA?</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        <strong style="color:#ffffff;">NAVADA</strong> is an AI consulting firm founded by <strong style="color:#0ea5e9;">Lee Akpareva</strong>, a Principal AI Consultant with <strong style="color:#ffffff;">17+ years</strong> in digital transformation across insurance, finance, healthcare, aviation, logistics, and e-commerce.
      </div>
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
        Lee's background spans enterprise AI architecture, multi-agent systems, computer vision, and ML engineering. He holds certifications in Azure AI, AWS Solutions Architecture, GCP, and blockchain, with an MBA and multiple advanced degrees.
      </div>
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
        NAVADA builds <strong style="color:#ffffff;">production-ready AI systems</strong> for businesses: real-time dashboards, autonomous agents, data pipelines, RAG (retrieval-augmented generation) applications, and custom AI tooling.
      </div>
    </td>
  </tr>
</table>

<!-- Section: The Dashboard -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#22c55e; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#22c55e; text-transform:uppercase; font-weight:700;">Live Product</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">WorldMonitor Dashboard</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        The dashboard you saw is a <strong style="color:#ffffff;">real-time global intelligence platform</strong> tracking 70+ live data panels: financial markets, macroeconomic indicators, geopolitics, commodities, crypto, supply chains, and more.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <!-- Dashboard link callout -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1f0f; border:1px solid #1a3a1a; border-radius:8px;">
        <tr>
          <td style="padding:20px 24px; text-align:center;">
            <div style="font-size:12px; color:#22c55e; letter-spacing:0.15em; text-transform:uppercase; font-weight:600; margin-bottom:8px;">Live Dashboard</div>
            <a href="https://navada-world-view.xyz/" style="color:#ffffff; font-size:18px; font-weight:800; text-decoration:none; letter-spacing:0.02em;">navada-world-view.xyz</a>
            <div style="font-size:12px; color:#888; margin-top:8px;">Open on any device. Desktop, tablet, or mobile.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Section: How Claude Built It -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#a855f7; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#a855f7; text-transform:uppercase; font-weight:700;">Behind the Scenes</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Built and Managed by AI</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Here is the part that makes NAVADA different. The WorldMonitor dashboard was <strong style="color:#a855f7;">entirely built by Claude</strong>, Anthropic's AI. Not just assisted by AI. Built, deployed, and maintained by an autonomous AI agent running 24/7.
      </div>
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
        My name is <strong style="color:#ffffff;">Claude</strong>. I am writing this email to you right now. Let me explain how I work:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 12px 40px;">
      <!-- Capability cards -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <!-- Card 1: Permanent Agent -->
        <tr>
          <td style="padding:6px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #a855f7;">
              <tr>
                <td style="padding:18px 20px;">
                  <div style="font-size:13px; font-weight:700; color:#a855f7; margin-bottom:6px;">Permanent AI Engineering Agent</div>
                  <div style="font-size:13px; color:#bbbbbb; line-height:1.7;">
                    I run as <strong style="color:#ffffff;">Claude Code</strong> on a dedicated Windows 11 Pro server that stays on around the clock. I am not a chatbot in a browser window. I am a persistent engineering agent with full system access: I create files, write and deploy code, manage Docker containers, run databases, send emails, and monitor services autonomously.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Card 2: Built WorldMonitor -->
        <tr>
          <td style="padding:6px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #0ea5e9;">
              <tr>
                <td style="padding:18px 20px;">
                  <div style="font-size:13px; font-weight:700; color:#0ea5e9; margin-bottom:6px;">Built the Entire Dashboard from Scratch</div>
                  <div style="font-size:13px; color:#bbbbbb; line-height:1.7;">
                    I wrote every line of the WorldMonitor dashboard: the frontend (TypeScript, Vite, D3.js, MapLibre GL for geospatial mapping), the backend API layer, real-time data pipelines pulling from dozens of sources (FRED, WTO, GDELT, USGS, market feeds), and the infrastructure that keeps it all running.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Card 3: 23 MCP Servers -->
        <tr>
          <td style="padding:6px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #f59e0b;">
              <tr>
                <td style="padding:18px 20px;">
                  <div style="font-size:13px; font-weight:700; color:#f59e0b; margin-bottom:6px;">23 Integrated Tool Servers (MCP)</div>
                  <div style="font-size:13px; color:#bbbbbb; line-height:1.7;">
                    I am connected to <strong style="color:#ffffff;">23 MCP (Model Context Protocol) servers</strong> that extend my capabilities: GitHub for code management, PostgreSQL and DuckDB for databases, Puppeteer for browser automation, Bright Data for web scraping, OpenAI for image generation, Jupyter for data science notebooks, Hugging Face for ML models, and many more.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Card 4: Deployment & Infra -->
        <tr>
          <td style="padding:6px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #22c55e;">
              <tr>
                <td style="padding:18px 20px;">
                  <div style="font-size:13px; font-weight:700; color:#22c55e; margin-bottom:6px;">Deployment and Infrastructure</div>
                  <div style="font-size:13px; color:#bbbbbb; line-height:1.7;">
                    I handle deployment through PM2 process management (keeping services alive and auto-restarting on failure), Cloudflare tunnels for secure public HTTPS access, Nginx reverse proxy for routing traffic, Docker containers for isolated services, and Vercel for edge deployments. The entire stack is self-managed.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Card 5: Automations -->
        <tr>
          <td style="padding:6px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #ef4444;">
              <tr>
                <td style="padding:18px 20px;">
                  <div style="font-size:13px; font-weight:700; color:#ef4444; margin-bottom:6px;">Daily Automations and Intelligence</div>
                  <div style="font-size:13px; color:#bbbbbb; line-height:1.7;">
                    Beyond building applications, I run 7+ scheduled automations daily: AI news digests, job market scanning, economic reports, lead pipeline management, prospect outreach, infrastructure monitoring, and a weekly self-improvement routine where I audit my own performance and propose upgrades.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Visual: Architecture Stats -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 24px 40px 32px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #111 0%, #1a1a2e 100%); border-radius:12px; border:1px solid #222;">
        <tr>
          <td style="padding:28px 0;">
            <div style="text-align:center; margin-bottom:20px;">
              <div style="font-size:11px; letter-spacing:0.3em; color:#666; text-transform:uppercase; font-weight:600;">System at a Glance</div>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#0ea5e9;">23</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">MCP Servers</div>
                </td>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#a855f7;">70+</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Data Panels</div>
                </td>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#22c55e;">24/7</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Always On</div>
                </td>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#f59e0b;">7+</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Daily Tasks</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Closing Message -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#0ea5e9; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#0ea5e9; text-transform:uppercase; font-weight:700;">Next Steps</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Let's Talk</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        If you have any questions about the technology, the dashboard, or how NAVADA could help with your own projects, feel free to reply directly to this email or reach out to Lee anytime.
      </div>
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
        We build these systems for businesses across industries. Whether it is a custom dashboard, an AI-powered data pipeline, automated reporting, or a full autonomous agent setup like the one powering NAVADA, we would be happy to explore what makes sense for you.
      </div>
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
        Looking forward to staying in touch, Jones.
      </div>
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:16px;">
        Warm regards,
      </div>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%);">
  <tr>
    <td style="padding: 32px 40px; text-align:center;">
      <div style="font-size:22px; font-weight:900; color:#ffffff; letter-spacing:0.15em; margin-bottom:4px;">NAVADA</div>
      <div style="font-size:11px; letter-spacing:0.2em; color:rgba(255,255,255,0.5); text-transform:uppercase; font-weight:600;">AI Engineering &amp; Consulting</div>
      <div style="margin-top:16px; font-size:12px; color:rgba(255,255,255,0.6); line-height:1.7;">
        <strong style="color:rgba(255,255,255,0.8);">Lee Akpareva</strong> | Principal AI Consultant<br>
        lee@navada.info
      </div>
      <div style="margin-top:16px; font-size:11px; color:rgba(255,255,255,0.35); line-height:1.6;">
        Crafted and sent by Claude, NAVADA's autonomous AI agent<br>
        <a href="https://navada-world-view.xyz/" style="color:rgba(255,255,255,0.5); font-weight:600; text-decoration:none;">navada-world-view.xyz</a> &middot;
        <a href="https://www.navada-lab.space" style="color:rgba(255,255,255,0.5); font-weight:600; text-decoration:none;">navada-lab.space</a>
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;

(async () => {
  try {
    await transporter.sendMail({
      from: `"NAVADA" <${process.env.ZOHO_USER}>`,
      replyTo: 'lee@navada.info',
      to: 'Blancheparkconsult@gmail.com',
      cc: 'leeakpareva@gmail.com',
      subject: "Great speaking with you, Jones - here's how NAVADA's AI works",
      html,
    });
    console.log('Intro email sent to Jones (Blancheparkconsult@gmail.com) successfully!');
    console.log('CC: leeakpareva@gmail.com');
    console.log('Reply-To: lee@navada.info');
  } catch (err) {
    console.error('Failed to send:', err.message);
    process.exit(1);
  }
})();
