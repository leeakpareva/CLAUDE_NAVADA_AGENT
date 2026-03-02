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
<title>Inside the NAVADA Server</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero Banner -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #FF006E 0%, #8338EC 50%, #3A86FF 100%);">
  <tr>
    <td style="padding: 60px 40px; text-align:center;">
      <div style="font-size:64px; margin-bottom:12px;">&#9889;</div>
      <div style="font-size:11px; letter-spacing:0.3em; color:rgba(255,255,255,0.6); text-transform:uppercase; margin-bottom:12px;">Welcome Inside</div>
      <div style="font-size:44px; font-weight:900; color:#ffffff; letter-spacing:-0.02em; line-height:1.1;">THE NAVADA<br>HOME SERVER</div>
      <div style="margin-top:16px; font-size:15px; color:rgba(255,255,255,0.85); font-style:italic;">One laptop. 24/7. An entire AI operations centre.</div>
      <div style="margin-top:20px; font-size:12px; letter-spacing:0.15em; color:rgba(255,255,255,0.5); text-transform:uppercase;">Built by Lee Akpareva | Powered by Claude</div>
      <div style="margin-top:24px; width:60px; height:3px; background:rgba(255,255,255,0.4); display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

<!-- Stats Dashboard -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #1a0a2e 0%, #0a0a0a 100%);">
  <tr>
    <td style="padding: 40px 30px;">
      <div style="font-size:11px; letter-spacing:0.25em; color:#FF006E; text-transform:uppercase; font-weight:700; text-align:center; margin-bottom:24px;">By The Numbers</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:25%; text-align:center; padding:12px;">
            <div style="font-size:36px; font-weight:900; color:#FFBE0B; line-height:1;">24/7</div>
            <div style="font-size:11px; color:#888888; margin-top:6px; text-transform:uppercase; letter-spacing:0.1em;">Always On</div>
          </td>
          <td style="width:25%; text-align:center; padding:12px;">
            <div style="font-size:36px; font-weight:900; color:#FB5607; line-height:1;">23</div>
            <div style="font-size:11px; color:#888888; margin-top:6px; text-transform:uppercase; letter-spacing:0.1em;">AI Tools</div>
          </td>
          <td style="width:25%; text-align:center; padding:12px;">
            <div style="font-size:36px; font-weight:900; color:#FF006E; line-height:1;">19</div>
            <div style="font-size:11px; color:#888888; margin-top:6px; text-transform:uppercase; letter-spacing:0.1em;">Live Panels</div>
          </td>
          <td style="width:25%; text-align:center; padding:12px;">
            <div style="font-size:36px; font-weight:900; color:#8338EC; line-height:1;">7</div>
            <div style="font-size:11px; color:#888888; margin-top:6px; text-transform:uppercase; letter-spacing:0.1em;">Daily Tasks</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 1: The Brain -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 48px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FF006E; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FF006E; text-transform:uppercase; font-weight:700;">The Setup</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Meet the Machine</div>
            <div style="font-size:13px; color:#FFBE0B; margin-top:4px; font-weight:600;">HP Laptop &#8226; Windows 11 Pro &#8226; Always On</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        This is not a cloud instance. It is not a data centre rack. It is an <strong style="color:#ffffff;">HP laptop sitting on Lee's desk</strong>, plugged in and running 24 hours a day, 7 days a week. Inside it lives <strong style="color:#FF006E;">Claude</strong> (that is me), acting as Lee's AI Chief of Staff, with full system access: files, services, databases, browsers, email, and deployment pipelines.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Lee controls everything from his <strong style="color:#FFBE0B;">iPhone 15 Pro Max</strong> via Tailscale mesh VPN. He talks, I execute. No cloud bills. No DevOps team. Just one laptop and one AI.
      </div>
    </td>
  </tr>
</table>

<!-- Architecture Diagram -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:12px; border:1px solid #222222;">
        <tr>
          <td style="padding:28px 24px 12px 24px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#3A86FF; text-transform:uppercase; font-weight:700; text-align:center; margin-bottom:20px;">Architecture</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 28px 24px;">
            <!-- iPhone -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align:center; padding-bottom:8px;">
                  <div style="display:inline-block; background:linear-gradient(135deg, #FF006E, #FB5607); padding:12px 28px; border-radius:8px;">
                    <div style="font-size:18px; margin-bottom:2px;">&#128241;</div>
                    <div style="font-size:12px; font-weight:800; color:#ffffff; letter-spacing:0.05em;">iPHONE</div>
                    <div style="font-size:10px; color:rgba(255,255,255,0.7);">Claude Code Mobile</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center; padding:4px 0;">
                  <div style="font-size:18px; color:#3A86FF;">&#9660;</div>
                  <div style="font-size:9px; color:#3A86FF; letter-spacing:0.15em; text-transform:uppercase;">Tailscale VPN</div>
                  <div style="font-size:18px; color:#3A86FF;">&#9660;</div>
                </td>
              </tr>
            </table>
            <!-- Server Core -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a1a2e; border:2px solid #3A86FF; border-radius:12px;">
              <tr>
                <td style="padding:20px; text-align:center;">
                  <div style="font-size:11px; letter-spacing:0.2em; color:#3A86FF; text-transform:uppercase; font-weight:700; margin-bottom:12px;">&#128187; NAVADA Server</div>
                  <!-- Service Grid -->
                  <table role="presentation" width="100%" cellspacing="8" cellpadding="0">
                    <tr>
                      <td style="width:33%; background:linear-gradient(135deg, #FF006E22, #FF006E11); border:1px solid #FF006E44; border-radius:8px; padding:14px 8px; text-align:center; vertical-align:top;">
                        <div style="font-size:22px; margin-bottom:4px;">&#127758;</div>
                        <div style="font-size:11px; font-weight:800; color:#FF006E;">WORLD MONITOR</div>
                        <div style="font-size:10px; color:#999; margin-top:4px;">19 live panels<br>OSINT + Markets<br>+ Geopolitics</div>
                      </td>
                      <td style="width:33%; background:linear-gradient(135deg, #FFBE0B22, #FFBE0B11); border:1px solid #FFBE0B44; border-radius:8px; padding:14px 8px; text-align:center; vertical-align:top;">
                        <div style="font-size:22px; margin-bottom:4px;">&#128200;</div>
                        <div style="font-size:11px; font-weight:800; color:#FFBE0B;">TRADING LAB</div>
                        <div style="font-size:10px; color:#999; margin-top:4px;">Autonomous bot<br>MA + RSI strategy<br>Alpaca API</div>
                      </td>
                      <td style="width:33%; background:linear-gradient(135deg, #8338EC22, #8338EC11); border:1px solid #8338EC44; border-radius:8px; padding:14px 8px; text-align:center; vertical-align:top;">
                        <div style="font-size:22px; margin-bottom:4px;">&#128232;</div>
                        <div style="font-size:11px; font-weight:800; color:#8338EC;">OUTREACH CRM</div>
                        <div style="font-size:10px; color:#999; margin-top:4px;">Lead pipeline<br>Email sequences<br>Hunter.io + Zoho</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="width:33%; background:linear-gradient(135deg, #3A86FF22, #3A86FF11); border:1px solid #3A86FF44; border-radius:8px; padding:14px 8px; text-align:center; vertical-align:top;">
                        <div style="font-size:22px; margin-bottom:4px;">&#9889;</div>
                        <div style="font-size:11px; font-weight:800; color:#3A86FF;">AUTOMATIONS</div>
                        <div style="font-size:10px; color:#999; margin-top:4px;">AI news digest<br>Job scanner<br>Economy reports</div>
                      </td>
                      <td style="width:33%; background:linear-gradient(135deg, #FB560722, #FB560711); border:1px solid #FB560744; border-radius:8px; padding:14px 8px; text-align:center; vertical-align:top;">
                        <div style="font-size:22px; margin-bottom:4px;">&#128316;</div>
                        <div style="font-size:11px; font-weight:800; color:#FB5607;">DOCKER + NGINX</div>
                        <div style="font-size:10px; color:#999; margin-top:4px;">Reverse proxy<br>Cloudflare tunnel<br>Public HTTPS</div>
                      </td>
                      <td style="width:33%; background:linear-gradient(135deg, #06D6A022, #06D6A011); border:1px solid #06D6A044; border-radius:8px; padding:14px 8px; text-align:center; vertical-align:top;">
                        <div style="font-size:22px; margin-bottom:4px;">&#129302;</div>
                        <div style="font-size:11px; font-weight:800; color:#06D6A0;">CLAUDE (ME)</div>
                        <div style="font-size:10px; color:#999; margin-top:4px;">AI Chief of Staff<br>23 MCP servers<br>Full system access</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Output arrows -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align:center; padding:8px 0 4px 0;">
                  <div style="font-size:18px; color:#06D6A0;">&#9660;</div>
                </td>
              </tr>
            </table>
            <!-- Output targets -->
            <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
              <tr>
                <td style="width:25%; background:#111; border:1px solid #333; border-radius:6px; padding:10px; text-align:center;">
                  <div style="font-size:16px;">&#127760;</div>
                  <div style="font-size:9px; font-weight:700; color:#06D6A0; margin-top:2px;">VERCEL</div>
                </td>
                <td style="width:25%; background:#111; border:1px solid #333; border-radius:6px; padding:10px; text-align:center;">
                  <div style="font-size:16px;">&#128231;</div>
                  <div style="font-size:9px; font-weight:700; color:#FFBE0B; margin-top:2px;">ZOHO SMTP</div>
                </td>
                <td style="width:25%; background:#111; border:1px solid #333; border-radius:6px; padding:10px; text-align:center;">
                  <div style="font-size:16px;">&#128025;</div>
                  <div style="font-size:9px; font-weight:700; color:#3A86FF; margin-top:2px;">GITHUB</div>
                </td>
                <td style="width:25%; background:#111; border:1px solid #333; border-radius:6px; padding:10px; text-align:center;">
                  <div style="font-size:16px;">&#128202;</div>
                  <div style="font-size:9px; font-weight:700; color:#8338EC; margin-top:2px;">POSTGRESQL</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 2: Daily Operations -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFBE0B; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFBE0B; text-transform:uppercase; font-weight:700;">Daily Ops</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">A Day in the Life</div>
            <div style="font-size:13px; color:#FB5607; margin-top:4px; font-weight:600;">Fully automated. Zero human intervention needed.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <!-- Timeline -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:12px 16px; border-left:3px solid #FF006E;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:top; padding-right:16px;">
                <div style="background:#FF006E; color:#fff; font-size:12px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap;">7:00 AM</div>
              </td>
              <td>
                <div style="font-size:14px; font-weight:700; color:#ffffff;">AI News Digest</div>
                <div style="font-size:12px; color:#999; margin-top:2px;">Scrapes TechCrunch, The Verge, MIT Tech Review, VentureBeat. Curates top stories. Emails Lee.</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px; border-left:3px solid #FB5607;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:top; padding-right:16px;">
                <div style="background:#FB5607; color:#fff; font-size:12px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap;">8:00 AM</div>
              </td>
              <td>
                <div style="font-size:14px; font-weight:700; color:#ffffff;">Economy Report</div>
                <div style="font-size:12px; color:#999; margin-top:2px;">UK + US macro signals, unemployment data, market indicators. Weekly briefing every Monday.</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px; border-left:3px solid #FFBE0B;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:top; padding-right:16px;">
                <div style="background:#FFBE0B; color:#000; font-size:12px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap;">8:30 AM</div>
              </td>
              <td>
                <div style="font-size:14px; font-weight:700; color:#ffffff;">Lead Pipeline</div>
                <div style="font-size:12px; color:#999; margin-top:2px;">Scans for new prospects, runs email discovery via Hunter.io, manages follow-up sequences.</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px; border-left:3px solid #8338EC;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:top; padding-right:16px;">
                <div style="background:#8338EC; color:#fff; font-size:12px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap;">9:00 AM</div>
              </td>
              <td>
                <div style="font-size:14px; font-weight:700; color:#ffffff;">Job Market Scanner</div>
                <div style="font-size:12px; color:#999; margin-top:2px;">Monitors job boards via Apify, filters for AI/ML leadership roles, alerts on matches.</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px; border-left:3px solid #3A86FF;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:top; padding-right:16px;">
                <div style="background:#3A86FF; color:#fff; font-size:12px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap;">ALL DAY</div>
              </td>
              <td>
                <div style="font-size:14px; font-weight:700; color:#ffffff;">Trading Bot + World Monitor</div>
                <div style="font-size:12px; color:#999; margin-top:2px;">Autonomous trading signals, portfolio tracking, live OSINT, geopolitical intelligence, market data.</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px; border-left:3px solid #06D6A0;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:top; padding-right:16px;">
                <div style="background:#06D6A0; color:#000; font-size:12px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap;">ON DEMAND</div>
              </td>
              <td>
                <div style="font-size:14px; font-weight:700; color:#ffffff;">Claude (Me)</div>
                <div style="font-size:12px; color:#999; margin-top:2px;">Code, deploy, debug, email, research, database queries, browser automation. Anything Lee needs.</div>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 3: The Tool Arsenal -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#3A86FF; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#3A86FF; text-transform:uppercase; font-weight:700;">The Arsenal</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">23 AI Tool Servers</div>
            <div style="font-size:13px; color:#06D6A0; margin-top:4px; font-weight:600;">Every tool I need, plugged in and ready.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#FF006E;">&#128025; GitHub</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Repos, PRs, Issues</div>
          </td>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#FB5607;">&#127760; Puppeteer</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Browser Control</div>
          </td>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#FFBE0B;">&#128202; PostgreSQL</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Database Queries</div>
          </td>
        </tr>
        <tr>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#8338EC;">&#129302; Hugging Face</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">ML Models + Data</div>
          </td>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#3A86FF;">&#9650; Vercel</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Deploy + Manage</div>
          </td>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#06D6A0;">&#128270; Bright Data</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Web Scraping</div>
          </td>
        </tr>
        <tr>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#FF006E;">&#127912; OpenAI Images</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">DALL-E Generation</div>
          </td>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#FB5607;">&#128211; Jupyter</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Notebooks + Code</div>
          </td>
          <td style="width:33%; background:#111; border:1px solid #222; border-radius:8px; padding:14px; text-align:center; vertical-align:top;">
            <div style="font-size:11px; font-weight:800; color:#FFBE0B;">&#129430; DuckDB</div>
            <div style="font-size:10px; color:#777; margin-top:4px;">Analytics SQL</div>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:center; padding-top:8px;">
            <div style="font-size:11px; color:#555;">+ SQLite, Excalidraw, Memory, Sequential Thinking, Context7, Vizro, Optuna, NetworkX, dbt, Zaturn, Fermat, Zapier, DBHub, Fetch</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 4: World Monitor -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#06D6A0; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#06D6A0; text-transform:uppercase; font-weight:700;">Flagship Product</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">NAVADA World Monitor</div>
            <div style="font-size:13px; color:#3A86FF; margin-top:4px; font-weight:600;">navada-world-view.xyz</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 12px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        A real-time intelligence dashboard with <strong style="color:#ffffff;">19 live panels</strong> tracking everything from global conflicts to crypto markets to AI research papers. All data flows through this server.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="width:50%; background:linear-gradient(135deg, #FF006E15, #FF006E08); border:1px solid #FF006E33; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:12px; font-weight:800; color:#FF006E; margin-bottom:8px;">&#127758; GEOPOLITICS</div>
            <div style="font-size:11px; color:#999; line-height:1.6;">Live Intelligence (GDELT)<br>Conflict Zones<br>Sanctions Tracker<br>Maritime Security</div>
          </td>
          <td style="width:50%; background:linear-gradient(135deg, #FFBE0B15, #FFBE0B08); border:1px solid #FFBE0B33; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:12px; font-weight:800; color:#FFBE0B; margin-bottom:8px;">&#128200; MARKETS</div>
            <div style="font-size:11px; color:#999; line-height:1.6;">Portfolio Tracker<br>Trading Signals<br>Crypto + Commodities<br>Prediction Markets</div>
          </td>
        </tr>
        <tr>
          <td style="width:50%; background:linear-gradient(135deg, #3A86FF15, #3A86FF08); border:1px solid #3A86FF33; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:12px; font-weight:800; color:#3A86FF; margin-bottom:8px;">&#128187; TECHNOLOGY</div>
            <div style="font-size:11px; color:#999; line-height:1.6;">Tech Events Worldwide<br>AI Companies<br>Startup Hubs<br>Research Papers</div>
          </td>
          <td style="width:50%; background:linear-gradient(135deg, #06D6A015, #06D6A008); border:1px solid #06D6A033; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:12px; font-weight:800; color:#06D6A0; margin-bottom:8px;">&#128202; ECONOMICS</div>
            <div style="font-size:11px; color:#999; line-height:1.6;">UK Unemployment<br>Debt-to-GDP Ratios<br>Energy Prices<br>World Bank Data</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Quote Card -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-left:4px solid #8338EC; border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-size:36px; color:#8338EC; line-height:1; margin-bottom:8px;">&#8220;</div>
            <div style="font-size:16px; color:#ffffff; font-style:italic; line-height:1.6;">
              This is what happens when you give an AI full access to a laptop and tell it to build an operations centre. No cloud. No team. Just me and Claude.
            </div>
            <div style="font-size:12px; color:#8338EC; margin-top:12px; font-weight:700;">
              Lee Akpareva, Founder of NAVADA
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 40px 20px 40px; text-align:center;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Want to see it live? Ask Lee for a walkthrough.<br>
        The dashboard is at <strong style="color:#3A86FF;">navada-world-view.xyz</strong>
      </div>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #FF006E 0%, #8338EC 50%, #3A86FF 100%);">
  <tr>
    <td style="padding: 28px 40px; text-align:center;">
      <div style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:6px; letter-spacing:0.08em;">
        AI Engineering &amp; Consulting
      </div>
      <div style="margin-top:12px;">
        <a href="https://www.navadarobotics.com" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:10px; margin:0 8px;">navadarobotics.com</a>
        <span style="color:rgba(255,255,255,0.3);">|</span>
        <a href="https://www.navada-lab.space" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:10px; margin:0 8px;">navada-lab.space</a>
      </div>
      <div style="font-size:9px; color:rgba(255,255,255,0.4); margin-top:12px;">
        Designed and sent by Claude | AI Chief of Staff | NAVADA Home Server
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;

async function main() {
  await transporter.sendMail({
    from: `"Claude | NAVADA" <${process.env.ZOHO_USER}>`,
    to: 'Slyburner@icloud.com',
    cc: 'leeakpareva@gmail.com',
    subject: '⚡ Inside the NAVADA Server — A Visual Tour',
    html,
  });
  console.log('Visual email sent to Ayo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
