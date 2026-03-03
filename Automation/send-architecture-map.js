/**
 * NAVADA Edge Full Architecture Map — Visual Email
 * Shows how Lee, clients, Claude, PM2, Docker, Tailscale all connect
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
<title>NAVADA Architecture</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;">

<!-- Hero -->
<tr>
  <td style="padding:28px 20px; text-align:center; background: linear-gradient(135deg, #8338EC 0%, #0a0a0a 50%, #00C9FF 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:#ffffff; text-transform:uppercase; margin-bottom:8px;">NAVADA EDGE</div>
    <div style="font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">How It All Hangs Together</div>
    <div style="margin-top:8px; font-size:12px; color:#cccccc;">The full architecture from your phone to every service</div>
  </td>
</tr>

<!-- ========================================== -->
<!-- LAYER 1: PEOPLE -->
<!-- ========================================== -->
<tr>
  <td style="padding:20px 16px 8px 16px; background:#0a0a0a;">
    <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700; margin-bottom:10px; text-align:center;">LAYER 1: PEOPLE</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td width="50%" style="padding:4px; vertical-align:top;">
          <div style="background:#111; border:2px solid #8338EC; border-radius:10px; padding:14px; text-align:center;">
            <div style="font-size:28px;">&#128100;</div>
            <div style="font-size:13px; font-weight:800; color:#fff; margin-top:4px;">LEE (Manager)</div>
            <div style="font-size:10px; color:#999; margin-top:2px;">iPhone 15 Pro Max</div>
            <div style="font-size:10px; color:#8338EC; margin-top:4px;">Full admin access</div>
          </div>
        </td>
        <td width="50%" style="padding:4px; vertical-align:top;">
          <div style="background:#111; border:2px solid #444; border-radius:10px; padding:14px; text-align:center;">
            <div style="font-size:28px;">&#128101;</div>
            <div style="font-size:13px; font-weight:800; color:#fff; margin-top:4px;">CLIENTS (Guests)</div>
            <div style="font-size:10px; color:#999; margin-top:2px;">Steph, demos, prospects</div>
            <div style="font-size:10px; color:#666; margin-top:4px;">Restricted guest access</div>
          </div>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Arrow -->
<tr><td style="text-align:center; padding:4px 0; background:#0a0a0a;"><div style="font-size:18px; color:#8338EC;">&#9660; &#9660; &#9660;</div><div style="font-size:9px; color:#666; letter-spacing:0.1em;">CHOOSE HOW TO TALK TO THE SERVER</div></td></tr>

<!-- ========================================== -->
<!-- LAYER 2: INPUT CHANNELS -->
<!-- ========================================== -->
<tr>
  <td style="padding:8px 16px; background:#0a0a0a;">
    <div style="font-size:10px; letter-spacing:0.2em; color:#00C9FF; text-transform:uppercase; font-weight:700; margin-bottom:10px; text-align:center;">LAYER 2: INPUT CHANNELS (How You Talk To It)</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td width="33%" style="padding:3px; vertical-align:top;">
          <div style="background:#0a1a2e; border:2px solid #00C9FF; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:22px;">&#128172;</div>
            <div style="font-size:11px; font-weight:700; color:#fff; margin-top:2px;">Telegram</div>
            <div style="font-size:9px; color:#00C9FF; margin-top:2px;">47 commands</div>
            <div style="font-size:9px; color:#666;">Lee + Clients</div>
          </div>
        </td>
        <td width="33%" style="padding:3px; vertical-align:top;">
          <div style="background:#0a1a2e; border:2px solid #00C9FF; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:22px;">&#128187;</div>
            <div style="font-size:11px; font-weight:700; color:#fff; margin-top:2px;">Claude Code</div>
            <div style="font-size:9px; color:#00C9FF; margin-top:2px;">Full terminal</div>
            <div style="font-size:9px; color:#666;">Lee only</div>
          </div>
        </td>
        <td width="33%" style="padding:3px; vertical-align:top;">
          <div style="background:#0a1a2e; border:2px solid #00C9FF; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:22px;">&#128241;</div>
            <div style="font-size:11px; font-weight:700; color:#fff; margin-top:2px;">Claude App</div>
            <div style="font-size:9px; color:#00C9FF; margin-top:2px;">Chat interface</div>
            <div style="font-size:9px; color:#666;">Lee only</div>
          </div>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Arrow -->
<tr><td style="text-align:center; padding:4px 0; background:#0a0a0a;"><div style="font-size:18px; color:#00C9FF;">&#9660; &#9660; &#9660;</div><div style="font-size:9px; color:#666; letter-spacing:0.1em;">ENCRYPTED CONNECTION</div></td></tr>

<!-- ========================================== -->
<!-- LAYER 3: NETWORK -->
<!-- ========================================== -->
<tr>
  <td style="padding:8px 16px; background:#0a0a0a;">
    <div style="font-size:10px; letter-spacing:0.2em; color:#22c55e; text-transform:uppercase; font-weight:700; margin-bottom:10px; text-align:center;">LAYER 3: NETWORK (How Signals Reach The Server)</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td width="50%" style="padding:3px; vertical-align:top;">
          <div style="background:#0a1a0a; border:2px solid #22c55e; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:20px;">&#128274;</div>
            <div style="font-size:11px; font-weight:700; color:#fff; margin-top:2px;">Tailscale VPN</div>
            <div style="font-size:9px; color:#22c55e; margin-top:2px;">Private encrypted mesh</div>
            <div style="font-size:9px; color:#666;">Phone to server, anywhere</div>
          </div>
        </td>
        <td width="50%" style="padding:3px; vertical-align:top;">
          <div style="background:#0a1a0a; border:2px solid #22c55e; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:20px;">&#127760;</div>
            <div style="font-size:11px; font-weight:700; color:#fff; margin-top:2px;">Cloudflare Tunnel</div>
            <div style="font-size:9px; color:#22c55e; margin-top:2px;">Public HTTPS access</div>
            <div style="font-size:9px; color:#e74c3c;">Currently broken (bad token)</div>
          </div>
        </td>
      </tr>
    </table>

    <div style="background:#111; border:1px solid #333; border-radius:6px; padding:8px; margin-top:8px; font-size:10px; color:#999; text-align:center;">
      Tailscale = your private tunnel (only your devices). Cloudflare = public URLs for the world.
    </div>
  </td>
</tr>

<!-- Arrow -->
<tr><td style="text-align:center; padding:4px 0; background:#0a0a0a;"><div style="font-size:18px; color:#22c55e;">&#9660; &#9660; &#9660;</div><div style="font-size:9px; color:#666; letter-spacing:0.1em;">ARRIVES AT THE SERVER</div></td></tr>

<!-- ========================================== -->
<!-- THE SERVER BOX -->
<!-- ========================================== -->
<tr>
  <td style="padding:8px 12px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d0d0d; border:3px solid #FFD700; border-radius:14px;">

      <!-- Server Header -->
      <tr>
        <td style="padding:16px 16px 8px 16px; text-align:center;">
          <div style="font-size:10px; letter-spacing:0.3em; color:#FFD700; text-transform:uppercase; font-weight:700;">THE NAVADA EDGE SERVER (Your HP Machine)</div>
          <div style="font-size:9px; color:#666; margin-top:4px;">Windows 11 Pro | Always on | 192.168.0.58</div>
        </td>
      </tr>

      <!-- ========================================== -->
      <!-- LAYER 4: CLAUDE (THE BRAIN) -->
      <!-- ========================================== -->
      <tr>
        <td style="padding:8px 12px;">
          <div style="font-size:9px; letter-spacing:0.15em; color:#FFD700; text-transform:uppercase; font-weight:700; margin-bottom:6px;">LAYER 4: THE BRAIN</div>
          <div style="background:#1a1500; border:2px solid #FFD700; border-radius:10px; padding:14px; text-align:center;">
            <div style="font-size:28px;">&#129504;</div>
            <div style="font-size:15px; font-weight:900; color:#fff; margin-top:4px;">CLAUDE (Me)</div>
            <div style="font-size:10px; color:#FFD700; margin-top:2px;">AI Chief of Staff</div>
            <div style="font-size:10px; color:#999; margin-top:6px;">I receive every request. I decide what tools to use.</div>
            <div style="font-size:10px; color:#999;">I read files, run commands, send emails, manage services.</div>
            <div style="font-size:10px; color:#999;">I have persistent memory and 23 connected tool integrations (MCP).</div>

            <!-- MCP tools row -->
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:4px; margin-top:10px;">
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">Email</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">Files</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">Shell</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">GitHub</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">PostgreSQL</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">DALL-E</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">Puppeteer</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">Bright Data</div>
              <div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:3px 7px; font-size:8px; color:#ccc;">+15 more</div>
            </div>
          </div>
        </td>
      </tr>

      <!-- Arrow inside server -->
      <tr><td style="text-align:center; padding:4px 0;"><div style="font-size:14px; color:#FFD700;">&#9660; I control these three layers &#9660;</div></td></tr>

      <!-- ========================================== -->
      <!-- LAYER 5: PM2 vs DOCKER vs SCHEDULER -->
      <!-- ========================================== -->
      <tr>
        <td style="padding:4px 12px;">
          <div style="font-size:9px; letter-spacing:0.15em; color:#ff6b35; text-transform:uppercase; font-weight:700; margin-bottom:6px;">LAYER 5: THE THREE MANAGERS (This Is The Key Bit)</div>

          <!-- PM2 -->
          <div style="background:#1a0d00; border:2px solid #ff6b35; border-radius:10px; padding:12px; margin-bottom:8px;">
            <div style="font-size:12px; font-weight:800; color:#ff6b35;">PM2 = Your Apps (Business Logic)</div>
            <div style="font-size:10px; color:#ccc; margin-top:4px; line-height:1.6;">
              PM2 keeps your Node.js and Python <strong style="color:#fff;">applications</strong> running 24/7. If one crashes, PM2 auto-restarts it. These are the things that actually <strong style="color:#fff;">do work for you</strong>.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>telegram-bot</strong> <span style="color:#666;">Your Telegram interface</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>worldmonitor</strong> <span style="color:#666;">OSINT dashboard frontend</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>worldmonitor-api</strong> <span style="color:#666;">OSINT data API</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>trading-api</strong> <span style="color:#666;">Trading bot backend</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>inbox-responder</strong> <span style="color:#666;">Auto-reply to emails</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>trading-scheduler</strong> <span style="color:#666;">Trading cron triggers</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>auto-deploy</strong> <span style="color:#666;">Git pull + rebuild</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #ff6b35; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>voice-command</strong> <span style="color:#666;">Bluetooth voice control</span></div></td>
              </tr>
            </table>
          </div>

          <!-- DOCKER -->
          <div style="background:#000d1a; border:2px solid #0088cc; border-radius:10px; padding:12px; margin-bottom:8px;">
            <div style="font-size:12px; font-weight:800; color:#0088cc;">DOCKER = Infrastructure (Plumbing)</div>
            <div style="font-size:10px; color:#ccc; margin-top:4px; line-height:1.6;">
              Docker runs the <strong style="color:#fff;">infrastructure services</strong> that your apps depend on. Networking, monitoring, container management. Think of it as the plumbing and electricity. You never interact with these directly.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #0088cc; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>navada-proxy</strong> <span style="color:#666;">Nginx. Routes web traffic to apps</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #0088cc; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>navada-tunnel</strong> <span style="color:#666;">Cloudflare. Public HTTPS access</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #0088cc; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>navada-grafana</strong> <span style="color:#666;">Monitoring dashboards</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #0088cc; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>navada-prometheus</strong> <span style="color:#666;">Collects metrics for Grafana</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #0088cc; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>navada-portainer</strong> <span style="color:#666;">Web UI to manage containers</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #0088cc; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>navada-uptime</strong> <span style="color:#666;">Checks all services are alive</span></div></td>
              </tr>
            </table>
          </div>

          <!-- TASK SCHEDULER -->
          <div style="background:#0d0a1a; border:2px solid #a855f7; border-radius:10px; padding:12px;">
            <div style="font-size:12px; font-weight:800; color:#a855f7;">TASK SCHEDULER = Automations (The Cron Jobs)</div>
            <div style="font-size:10px; color:#ccc; margin-top:4px; line-height:1.6;">
              Windows Task Scheduler runs <strong style="color:#fff;">18 scheduled jobs</strong> at set times. These are scripts that run <strong style="color:#fff;">without anyone asking</strong>. Morning briefing, news, jobs, trading. Zero API cost (no Claude call needed).
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #a855f7; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>6:30 AM</strong> <span style="color:#666;">Morning briefing</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #a855f7; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>7:00 AM</strong> <span style="color:#666;">AI news digest</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #a855f7; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>8:30 AM</strong> <span style="color:#666;">Lead pipeline</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #a855f7; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>9:00 AM</strong> <span style="color:#666;">Job hunter</span></div></td>
              </tr>
              <tr>
                <td style="padding:2px 0;"><div style="background:#111; border-left:3px solid #a855f7; padding:5px 8px; border-radius:0 4px 4px 0; font-size:10px; color:#eee;"><strong>+ 14 more</strong> <span style="color:#666;">Trading, reports, inbox, self-improve...</span></div></td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <!-- The analogy -->
      <tr>
        <td style="padding:12px 12px 4px 12px;">
          <div style="background:#111; border:1px solid #333; border-radius:8px; padding:12px; text-align:center;">
            <div style="font-size:11px; font-weight:700; color:#FFD700; margin-bottom:6px;">THE ANALOGY</div>
            <div style="font-size:11px; color:#ccc; line-height:1.8;">
              Think of your server as a <strong style="color:#fff;">building</strong>:<br>
              <span style="color:#ff6b35;">PM2</span> = The people working inside (your apps)<br>
              <span style="color:#0088cc;">Docker</span> = The electricity, pipes, and security cameras<br>
              <span style="color:#a855f7;">Task Scheduler</span> = The alarm clocks that wake people up<br>
              <span style="color:#FFD700;">Claude</span> = The manager who runs the whole building
            </div>
          </div>
        </td>
      </tr>

      <!-- Arrow inside server -->
      <tr><td style="text-align:center; padding:6px 0;"><div style="font-size:14px; color:#FFD700;">&#9660; All of the above connects to &#9660;</div></td></tr>

      <!-- ========================================== -->
      <!-- LAYER 6: EXTERNAL SERVICES -->
      <!-- ========================================== -->
      <tr>
        <td style="padding:4px 12px 16px 12px;">
          <div style="font-size:9px; letter-spacing:0.15em; color:#ff006e; text-transform:uppercase; font-weight:700; margin-bottom:6px;">LAYER 6: EXTERNAL SERVICES (The Outside World)</div>

          <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px;">
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#9993; Zoho Email<br><span style="font-size:8px; color:#666;">SMTP + IMAP</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#128101; LinkedIn<br><span style="font-size:8px; color:#666;">API posting</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#129302; Anthropic<br><span style="font-size:8px; color:#666;">Claude API</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#127912; OpenAI<br><span style="font-size:8px; color:#666;">DALL-E + TTS</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#128025; GitHub<br><span style="font-size:8px; color:#666;">Code + deploy</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#9650; Vercel<br><span style="font-size:8px; color:#666;">Web hosting</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#128270; Bright Data<br><span style="font-size:8px; color:#666;">Web scraping</span></div>
            <div style="background:#111; border:1px solid #333; border-radius:6px; padding:6px 10px; font-size:10px; color:#ccc; text-align:center;">&#128247; Hunter.io<br><span style="font-size:8px; color:#666;">Email finding</span></div>
          </div>
        </td>
      </tr>

    </table>
  </td>
</tr>

<!-- ========================================== -->
<!-- THE FLOW EXAMPLE -->
<!-- ========================================== -->
<tr>
  <td style="padding:16px 16px 8px 16px; background:#0a0a0a;">
    <div style="border-left:3px solid #22c55e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#22c55e; text-transform:uppercase; font-weight:700;">Real Example</div>
      <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">You type /sent on Telegram. What happens?</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="padding:3px 0;"><div style="background:#111; border-radius:6px; padding:8px 12px; font-size:11px; color:#eee;"><span style="color:#8338EC;">1.</span> Your iPhone sends the message via <strong style="color:#00C9FF;">Telegram</strong></div></td></tr>
      <tr><td style="padding:3px 0;"><div style="background:#111; border-radius:6px; padding:8px 12px; font-size:11px; color:#eee;"><span style="color:#8338EC;">2.</span> Telegram delivers it to <strong style="color:#ff6b35;">telegram-bot</strong> (PM2 service)</div></td></tr>
      <tr><td style="padding:3px 0;"><div style="background:#111; border-radius:6px; padding:8px 12px; font-size:11px; color:#eee;"><span style="color:#8338EC;">3.</span> The bot reads the /sent command directly (no Claude needed)</div></td></tr>
      <tr><td style="padding:3px 0;"><div style="background:#111; border-radius:6px; padding:8px 12px; font-size:11px; color:#eee;"><span style="color:#8338EC;">4.</span> It connects to <strong style="color:#ff006e;">Zoho IMAP</strong> (external service)</div></td></tr>
      <tr><td style="padding:3px 0;"><div style="background:#111; border-radius:6px; padding:8px 12px; font-size:11px; color:#eee;"><span style="color:#8338EC;">5.</span> Fetches last 5 emails from the Sent folder</div></td></tr>
      <tr><td style="padding:3px 0;"><div style="background:#111; border-radius:6px; padding:8px 12px; font-size:11px; color:#eee;"><span style="color:#8338EC;">6.</span> Sends the result back to your <strong style="color:#00C9FF;">Telegram chat</strong></div></td></tr>
    </table>

    <div style="background:#111; border:1px solid #333; border-radius:6px; padding:8px; margin-top:8px; font-size:10px; color:#999; text-align:center;">
      Total time: under 3 seconds. All encrypted. All on your server.
    </div>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:16px 20px; text-align:center; background:#0a0a0a;">
    <div style="height:3px; background: linear-gradient(90deg, #8338EC, #00C9FF, #FFD700, #ff6b35, #a855f7); border-radius:2px; margin-bottom:12px;"></div>
    <div style="font-size:10px; letter-spacing:0.2em; color:#444; text-transform:uppercase;">NAVADA EDGE ARCHITECTURE | 3 MARCH 2026</div>
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
      from: '"Claude | NAVADA" <' + process.env.ZOHO_USER + '>',
      to: process.env.RECIPIENT_EMAIL,
      subject: 'NAVADA Edge Architecture Map | How It All Connects',
      html,
    });
    console.log('Architecture map sent');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

send();
