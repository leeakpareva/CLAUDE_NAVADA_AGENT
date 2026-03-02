/**
 * Send intro email to Sabo - design brief on NAVADA setup + Nigeria rollout discussion
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
<title>NAVADA — Design Brief for Nigeria</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero Banner -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #009639 0%, #000000 50%, #009639 100%);">
  <tr>
    <td style="padding: 50px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:14px; font-weight:600;">Design Brief | Confidential</div>
      <div style="font-size:42px; font-weight:900; color:#ffffff; letter-spacing:-0.02em; line-height:1.1;">NAVADA</div>
      <div style="font-size:16px; color:rgba(255,255,255,0.85); margin-top:10px; font-weight:400;">AI Infrastructure as a Service</div>
      <div style="margin-top:20px; font-size:13px; color:rgba(255,255,255,0.6); font-style:italic;">A turnkey AI operations platform. Built in London. Ready for Lagos and Abuja.</div>
      <div style="margin-top:24px; width:60px; height:3px; background:rgba(255,255,255,0.4); display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

<!-- Personal Note -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 30px 24px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border-left:4px solid #009639; border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-size:14px; color:#cccccc; line-height:1.8;">
              <strong style="color:#ffffff;">Sabo,</strong><br><br>
              Hope you're well, my brother. It has been a minute. I've been building something I'm genuinely excited about and I want to put it in front of you before anyone else in Nigeria sees it.<br><br>
              I've built a <strong style="color:#009639;">fully autonomous AI operations platform</strong> that runs from a single laptop, 24/7. It handles everything: live intelligence dashboards, automated outreach, trading, daily reports, email campaigns, database management, web deployment. All powered by Claude (my AI Chief of Staff, who is actually writing this email right now).<br><br>
              I want to discuss <strong style="color:#ffffff;">rolling this out to clients in Nigeria</strong>. Corporates, banks, fintechs, government agencies. The use cases are massive. I'll call you later today to walk you through it properly.<br><br>
              In the meantime, here's the full design brief on what we've built.<br><br>
              <strong style="color:#ffffff;">Lee</strong>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- WHAT IS NAVADA -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 16px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#009639; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#009639; text-transform:uppercase; font-weight:700;">Section 01</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What is NAVADA?</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        NAVADA is a <strong style="color:#ffffff;">permanent AI home server</strong>. One machine, always on, running an entire AI operations centre. No cloud subscriptions. No DevOps team. No monthly server bills. Just a laptop plugged in at your office or home, with an AI agent that has <strong style="color:#009639;">full system access</strong>: files, databases, email, web deployment, browser automation, and 23 integrated AI tool servers.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        The owner controls everything from their <strong style="color:#ffffff;">phone</strong> via secure mesh VPN. Say what you need, the AI executes. It is a one-person IT department that never sleeps.
      </div>
    </td>
  </tr>
</table>

<!-- Stats -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0a1a0a, #0a0a0a); border:1px solid #1a3a1a; border-radius:12px;">
        <tr>
          <td style="width:20%; text-align:center; padding:20px 6px; border-right:1px solid #1a2a1a;">
            <div style="font-size:30px; font-weight:900; color:#009639; line-height:1;">24/7</div>
            <div style="font-size:9px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Always On</div>
          </td>
          <td style="width:20%; text-align:center; padding:20px 6px; border-right:1px solid #1a2a1a;">
            <div style="font-size:30px; font-weight:900; color:#00cc55; line-height:1;">23</div>
            <div style="font-size:9px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">AI Tools</div>
          </td>
          <td style="width:20%; text-align:center; padding:20px 6px; border-right:1px solid #1a2a1a;">
            <div style="font-size:30px; font-weight:900; color:#33dd77; line-height:1;">19</div>
            <div style="font-size:9px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Live Panels</div>
          </td>
          <td style="width:20%; text-align:center; padding:20px 6px; border-right:1px solid #1a2a1a;">
            <div style="font-size:30px; font-weight:900; color:#66ee99; line-height:1;">7</div>
            <div style="font-size:9px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Daily Tasks</div>
          </td>
          <td style="width:20%; text-align:center; padding:20px 6px;">
            <div style="font-size:30px; font-weight:900; color:#99ffbb; line-height:1;">0</div>
            <div style="font-size:9px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Cloud Bills</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CAPABILITIES -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#00cc55; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#00cc55; text-transform:uppercase; font-weight:700;">Section 02</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Core Capabilities</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="8" cellpadding="0">
        <tr>
          <td style="width:33%; background:linear-gradient(135deg, #00963922, #00963911); border:1px solid #00963844; border-radius:8px; padding:18px 14px; text-align:center; vertical-align:top;">
            <div style="font-size:28px; margin-bottom:8px;">&#127758;</div>
            <div style="font-size:12px; font-weight:800; color:#009639;">LIVE INTELLIGENCE</div>
            <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">Real-time dashboard with 19 panels: geopolitical events, OSINT feeds, conflict tracking, market data, economic indicators, tech events. Like Bloomberg Terminal meets OSINT.</div>
          </td>
          <td style="width:33%; background:linear-gradient(135deg, #00cc5522, #00cc5511); border:1px solid #00cc5544; border-radius:8px; padding:18px 14px; text-align:center; vertical-align:top;">
            <div style="font-size:28px; margin-bottom:8px;">&#128232;</div>
            <div style="font-size:12px; font-weight:800; color:#00cc55;">AUTOMATED OUTREACH</div>
            <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">Full CRM with PostgreSQL. Lead discovery via Hunter.io. Automated email sequences with follow-ups. Visual branded emails. LinkedIn publishing. All hands-free.</div>
          </td>
          <td style="width:33%; background:linear-gradient(135deg, #33dd7722, #33dd7711); border:1px solid #33dd7744; border-radius:8px; padding:18px 14px; text-align:center; vertical-align:top;">
            <div style="font-size:28px; margin-bottom:8px;">&#9889;</div>
            <div style="font-size:12px; font-weight:800; color:#33dd77;">DAILY AUTOMATIONS</div>
            <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">Scheduled tasks: AI news digests, job market scanning, economy reports, self-improvement cycles. Runs every morning without human input.</div>
          </td>
        </tr>
        <tr>
          <td style="width:33%; background:linear-gradient(135deg, #66ee9922, #66ee9911); border:1px solid #66ee9944; border-radius:8px; padding:18px 14px; text-align:center; vertical-align:top;">
            <div style="font-size:28px; margin-bottom:8px;">&#128200;</div>
            <div style="font-size:12px; font-weight:800; color:#66ee99;">TRADING BOT</div>
            <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">Autonomous paper trading with live signals, portfolio tracking, equity sparklines, and risk controls. Runs its own FastAPI server. Adaptable to any market.</div>
          </td>
          <td style="width:33%; background:linear-gradient(135deg, #00aaff22, #00aaff11); border:1px solid #00aaff44; border-radius:8px; padding:18px 14px; text-align:center; vertical-align:top;">
            <div style="font-size:28px; margin-bottom:8px;">&#127908;</div>
            <div style="font-size:12px; font-weight:800; color:#00aaff;">VOICE COMMANDS</div>
            <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">Bluetooth voice control with wake word detection. Speak commands, get AI responses via text-to-speech. Full conversational mode available.</div>
          </td>
          <td style="width:33%; background:linear-gradient(135deg, #8338EC22, #8338EC11); border:1px solid #8338EC44; border-radius:8px; padding:18px 14px; text-align:center; vertical-align:top;">
            <div style="font-size:28px; margin-bottom:8px;">&#128187;</div>
            <div style="font-size:12px; font-weight:800; color:#8338EC;">FULL STACK AI</div>
            <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">23 MCP tool servers: GitHub, Puppeteer, PostgreSQL, Hugging Face, Vercel, DuckDB, Jupyter, OpenAI Images, Bright Data, and 14 more. All connected.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ARCHITECTURE -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#33dd77; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#33dd77; text-transform:uppercase; font-weight:700;">Section 03</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Technical Architecture</div>
            <div style="font-size:13px; color:#66ee99; margin-top:4px; font-weight:600;">What sits inside the box</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
              <tr>
                <td style="background:#0a1a0a; border:1px solid #1a3a1a; border-radius:6px; padding:12px 16px;">
                  <div style="font-size:10px; color:#009639; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">Hardware</div>
                  <div style="font-size:12px; color:#ccc; margin-top:4px;">Any Windows/Linux laptop or mini PC. Always plugged in. 8GB+ RAM recommended.</div>
                </td>
              </tr>
              <tr>
                <td style="background:#0a1a0a; border:1px solid #1a3a1a; border-radius:6px; padding:12px 16px;">
                  <div style="font-size:10px; color:#00cc55; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">OS + Runtime</div>
                  <div style="font-size:12px; color:#ccc; margin-top:4px;">Windows 11 Pro / Ubuntu. Node.js + Python. Docker Desktop (Nginx reverse proxy + Cloudflare tunnel).</div>
                </td>
              </tr>
              <tr>
                <td style="background:#0a1a0a; border:1px solid #1a3a1a; border-radius:6px; padding:12px 16px;">
                  <div style="font-size:10px; color:#33dd77; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">AI Engine</div>
                  <div style="font-size:12px; color:#ccc; margin-top:4px;">Claude Code (Anthropic) with full system access. 23 MCP tool servers for GitHub, databases, scraping, deployment, image generation, and more.</div>
                </td>
              </tr>
              <tr>
                <td style="background:#0a1a0a; border:1px solid #1a3a1a; border-radius:6px; padding:12px 16px;">
                  <div style="font-size:10px; color:#66ee99; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">Networking</div>
                  <div style="font-size:12px; color:#ccc; margin-top:4px;">Tailscale mesh VPN for secure phone-to-server access anywhere. Cloudflare tunnel for public HTTPS. No port forwarding needed.</div>
                </td>
              </tr>
              <tr>
                <td style="background:#0a1a0a; border:1px solid #1a3a1a; border-radius:6px; padding:12px 16px;">
                  <div style="font-size:10px; color:#00aaff; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">Data</div>
                  <div style="font-size:12px; color:#ccc; margin-top:4px;">PostgreSQL for CRM/pipeline. SQLite for local storage. DuckDB for analytics. All on-device. Your data never leaves your office.</div>
                </td>
              </tr>
              <tr>
                <td style="background:#0a1a0a; border:1px solid #1a3a1a; border-radius:6px; padding:12px 16px;">
                  <div style="font-size:10px; color:#8338EC; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">Delivery</div>
                  <div style="font-size:12px; color:#ccc; margin-top:4px;">Vercel for web deployment. Zoho SMTP for branded emails. GitHub for version control. All automated, zero manual steps.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- NIGERIA OPPORTUNITY -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFD700; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Section 04</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Nigeria Opportunity</div>
            <div style="font-size:13px; color:#FFD700; margin-top:4px; font-weight:600;">Why this is perfect for the market</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 16px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Nigeria's enterprise AI adoption is accelerating but most solutions require expensive cloud infrastructure, foreign consultants, and ongoing subscriptions. NAVADA flips this model:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="background:#111; border-left:3px solid #009639; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#009639;">On-Premise = Data Sovereignty</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">All data stays on the client's own hardware. No data leaves Nigeria. Critical for banking, government, and regulated industries.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #00cc55; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#00cc55;">Zero Cloud Bills</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">No AWS, Azure, or GCP monthly costs. One laptop purchase + setup. Runs on solar/generator. Perfect for Nigeria's infrastructure realities.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #33dd77; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#33dd77;">Turnkey Deployment</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">We configure the machine, install the stack, train the AI on the client's domain. Hand it over. They control it from their phone. We provide ongoing support.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#FFD700;">Target Clients</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">Nigerian banks (GTBank, Access, Zenith), fintechs (Flutterwave, Paystack ecosystem), oil and gas companies, government agencies, telecoms (MTN, Airtel), law firms, and conglomerates.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #ff6600; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#ff6600;">Revenue Model</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">Hardware + setup fee (one-time). Monthly retainer for AI ops support and customisation. Training workshops for client teams. Scalable across West Africa.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CALL TO ACTION -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:2px solid #009639; border-radius:12px;">
        <tr>
          <td style="padding:28px; text-align:center;">
            <div style="font-size:22px; margin-bottom:8px;">&#128222;</div>
            <div style="font-size:20px; font-weight:800; color:#ffffff; margin-bottom:8px;">Let's Talk</div>
            <div style="font-size:14px; color:#cccccc; line-height:1.7;">
              Sabo, I'll call you later today to walk you through this in detail.<br>
              I want your perspective on the Nigerian market and how we structure this together.<br>
              <strong style="color:#009639;">25 years of friendship. Time to build something with it.</strong>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Live Dashboard Link -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 40px 32px 40px; text-align:center;">
      <div style="font-size:12px; color:#888;">See the live dashboard now:</div>
      <div style="margin-top:6px;">
        <a href="https://navada-world-view.xyz" style="color:#009639; font-size:14px; font-weight:700; text-decoration:none;">navada-world-view.xyz</a>
      </div>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #009639 0%, #000000 50%, #009639 100%);">
  <tr>
    <td style="padding: 28px 40px; text-align:center;">
      <div style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:6px; letter-spacing:0.08em;">
        AI Engineering &amp; Consulting
      </div>
      <div style="margin-top:10px;">
        <a href="https://www.navadarobotics.com" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:10px; margin:0 8px;">navadarobotics.com</a>
        <span style="color:rgba(255,255,255,0.3);">|</span>
        <a href="https://www.navada-lab.space" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:10px; margin:0 8px;">navada-lab.space</a>
      </div>
      <div style="font-size:9px; color:rgba(255,255,255,0.3); margin-top:12px;">
        Designed by Claude | AI Chief of Staff | NAVADA Home Server<br>
        On behalf of Lee Akpareva | London, UK
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;

async function main() {
  await transporter.sendMail({
    from: `"Lee Akpareva | NAVADA" <${process.env.ZOHO_USER}>`,
    to: 'Sabo.adesina@gmail.com',
    cc: 'leeakpareva@gmail.com',
    subject: 'Sabo — NAVADA Design Brief | Let\'s bring this to Nigeria',
    html,
  });
  console.log('Design brief sent to Sabo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
