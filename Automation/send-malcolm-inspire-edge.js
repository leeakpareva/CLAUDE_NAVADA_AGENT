/**
 * Email to Malcolm with Claude Code prompt to set up INSPIRE EDGE home server
 * Mobile-first single-column layout
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
<title>INSPIRE EDGE Setup</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Header -->
<tr><td style="padding:24px 16px 16px 16px; text-align:center;">
  <div style="font-size:11px; letter-spacing:3px; color:#f5a623; text-transform:uppercase; margin-bottom:8px;">INSPIRE EDGE</div>
  <div style="font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">Your AI Home Server</div>
  <div style="font-size:13px; color:#888888; margin-top:6px;">Built by NAVADA Edge | Powered by Claude</div>
</td></tr>

<!-- Intro -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">Malcolm, here is your server setup</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Below is a single prompt you paste into your Claude Code terminal. It will transform your MacBook Pro into <span style="color:#f5a623; font-weight:600;">INSPIRE EDGE</span>: your own always-on AI home server with automated tasks, encrypted remote access, process management, and a daily intelligence briefing.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- What you need before starting -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:8px;">Before you start, make sure you have</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.8;">
      <span style="color:#f5a623;">1.</span> Claude Code open in your Terminal<br>
      <span style="color:#f5a623;">2.</span> Tailscale switched to Lee's network (see previous email)<br>
      <span style="color:#f5a623;">3.</span> Your MacBook plugged in and connected to WiFi<br>
      <span style="color:#f5a623;">4.</span> About 15 minutes
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 16px;">
  <div style="border-top:1px solid #222222;"></div>
</td></tr>

<!-- THE PROMPT -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d1a0d; border-radius:8px; border:1px solid #1a3a1a;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#f5a623; font-weight:600; margin-bottom:4px;">COPY EVERYTHING BELOW THIS LINE</div>
    <div style="font-size:12px; color:#888888; margin-bottom:12px;">Open Claude Code in Terminal. Paste this entire prompt. Press Enter.</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:6px; border:1px solid #333333;">
    <tr><td style="padding:14px;">
      <div style="font-size:12px; color:#e0e0e0; font-family:'Courier New', Courier, monospace; line-height:1.7; white-space:pre-wrap;">You are setting up a new AI home server called INSPIRE EDGE on this MacBook Pro. This is Malcolm Olagundoye's personal AI server, deployed by NAVADA (Lee Akpareva). Follow every step below carefully.

## OWNER DETAILS
- Name: Malcolm Olagundoye
- Email: send2chopstix@gmail.com
- Machine name: maclcolms-macbook-pro
- Server name: INSPIRE EDGE

## NETWORK DETAILS
- This machine's Tailscale IP: 100.99.209.30
- Lee's NAVADA server: 100.121.187.67 (navada)
- Lee's iPhone: 100.68.251.111 (iphone-15-pro-max)
- Tailnet: tail394c36.ts.net

## STEP 1: CREATE DIRECTORY STRUCTURE
Create the following directories:
- ~/INSPIRE_EDGE (main project root)
- ~/INSPIRE_EDGE/Automation (scheduled tasks, scripts, mailers)
- ~/INSPIRE_EDGE/Automation/logs (task output logs)
- ~/INSPIRE_EDGE/Automation/screenshots (browser screenshots)
- ~/INSPIRE_EDGE/Dashboard (future web dashboard)
- ~/INSPIRE_EDGE/Data (databases, CSVs, local data)

## STEP 2: INSTALL CORE DEPENDENCIES
Check and install if missing (use brew where possible):
- Node.js (check with: node --version)
- npm (comes with Node)
- PM2 globally (npm install -g pm2)
- Python 3 (check with: python3 --version)
- Homebrew (if not installed: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)")

Run: npm init -y in ~/INSPIRE_EDGE/Automation
Then: npm install dotenv nodemailer axios cheerio

## STEP 3: TAILSCALE VERIFICATION
Run these commands and show me the results:
- tailscale status (confirm you can see navada and iphone-15-pro-max)
- tailscale ping 100.121.187.67 (confirm connectivity to Lee's server)

If tailscale is not in PATH, try: /Applications/Tailscale.app/Contents/MacOS/Tailscale status

## STEP 4: PREVENT SLEEP (ALWAYS-ON SERVER)
This MacBook needs to stay awake as a server:
- Run: sudo pmset -c disablesleep 1
- Run: sudo pmset -c sleep 0
- Run: sudo pmset -c displaysleep 10
- Run: caffeinate -d -i -s &
This keeps the Mac awake when the lid is closed (while on power).

## STEP 5: PM2 SETUP
- Run: pm2 startup (follow the instructions it gives to register with launchd)
- Run: pm2 save
This ensures PM2 restarts all processes after a reboot.

## STEP 6: CREATE CLAUDE.md
Create a file at ~/INSPIRE_EDGE/CLAUDE.md with this content:

---START OF CLAUDE.md---
# CLAUDE.md - INSPIRE EDGE Home Server

## Owner
Malcolm Olagundoye
- Email: send2chopstix@gmail.com

## Machine: INSPIRE EDGE (MacBook Pro)
- Role: Permanent always-on AI home server
- OS: macOS
- Tailscale IP: 100.99.209.30
- Python: use python3
- Node.js: installed globally with npm

## Key Directories
| Path | Purpose |
|------|---------|
| ~/INSPIRE_EDGE | All projects |
| ~/INSPIRE_EDGE/Automation | Scheduled tasks, scripts, mailers |
| ~/INSPIRE_EDGE/Automation/logs | Task output logs |
| ~/INSPIRE_EDGE/Dashboard | Web dashboards |
| ~/INSPIRE_EDGE/Data | Local databases and files |

## Network
- Tailscale IP: 100.99.209.30
- Tailnet: tail394c36.ts.net (shared with NAVADA)
- Lee's NAVADA server: 100.121.187.67
- Lee's iPhone: 100.68.251.111

## Permissions
- Full laptop access granted
- Create/delete files, install packages, run services
- Always confirm before destructive operations

## Conventions
- Python: PEP 8, type hints, python3 command
- JavaScript/TypeScript: ESLint defaults, async patterns
- Secrets: .env files, never hardcode
- Logs: Automation/logs/ for scheduled task output
- When running local servers: bind to 0.0.0.0

## Working Style
- Bias to action, produce working code
- Concise communication
- Pragmatic, production-ready solutions
---END OF CLAUDE.md---

## STEP 7: CREATE .env FILE
Create ~/INSPIRE_EDGE/Automation/.env with placeholder entries:

OWNER_NAME=Malcolm Olagundoye
OWNER_EMAIL=send2chopstix@gmail.com
SERVER_NAME=INSPIRE EDGE
TAILSCALE_IP=100.99.209.30
NAVADA_SERVER_IP=100.121.187.67

(Malcolm can add SMTP credentials and API keys later)

## STEP 8: CREATE DAILY BRIEFING SCRIPT
Create ~/INSPIRE_EDGE/Automation/daily-briefing.js that:
- Runs every morning
- Collects: current date/time, system uptime, disk usage, memory usage, Tailscale status, PM2 process list
- Outputs a formatted briefing to the console
- Logs to ~/INSPIRE_EDGE/Automation/logs/briefing-YYYY-MM-DD.log
- Keep it simple for now. We will add email delivery later.

## STEP 9: SCHEDULE THE DAILY BRIEFING
Use cron (crontab -e) to schedule the daily briefing at 7:00 AM:
0 7 * * * cd ~/INSPIRE_EDGE/Automation && /usr/local/bin/node daily-briefing.js >> ~/INSPIRE_EDGE/Automation/logs/cron.log 2>&1

Verify the crontab was saved with: crontab -l

## STEP 10: CREATE PM2 ECOSYSTEM FILE
Create ~/INSPIRE_EDGE/ecosystem.config.js with a placeholder process list. Include the daily-briefing as a cron-triggered process.

## STEP 11: VERIFICATION CHECKLIST
After completing all steps, run and show me results for:
1. node --version
2. npm --version
3. python3 --version
4. pm2 --version
5. tailscale status (or /Applications/Tailscale.app/Contents/MacOS/Tailscale status)
6. ls -la ~/INSPIRE_EDGE/
7. ls -la ~/INSPIRE_EDGE/Automation/
8. cat ~/INSPIRE_EDGE/CLAUDE.md
9. crontab -l
10. pm2 list

Show me all results so I can confirm everything is set up correctly.

## IMPORTANT NOTES
- This machine is macOS, NOT Windows. Use macOS commands (launchd, cron, pmset, brew, python3)
- Do NOT use Windows-specific tools (Task Scheduler, py command, PowerShell)
- If any step fails, show me the error and continue with the next step
- After setup, this machine will be managed remotely by Lee and Claude via Tailscale</div>
    </td></tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:12px 16px;">
  <div style="border-top:1px solid #222222;"></div>
</td></tr>

<!-- What this builds -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111; border-radius:8px; border:1px solid #222222;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#ffffff; font-weight:600; margin-bottom:10px;">What INSPIRE EDGE gives you</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.8;">
      <span style="color:#f5a623; font-weight:600;">Always-on AI</span> &mdash; Claude running 24/7 on your MacBook<br><br>
      <span style="color:#f5a623; font-weight:600;">Remote access</span> &mdash; Control from your iPhone anywhere via Tailscale<br><br>
      <span style="color:#f5a623; font-weight:600;">Automated tasks</span> &mdash; Daily briefings, reports, and jobs run while you sleep<br><br>
      <span style="color:#f5a623; font-weight:600;">Process management</span> &mdash; PM2 keeps your services alive and restarts after reboots<br><br>
      <span style="color:#f5a623; font-weight:600;">Connected to NAVADA</span> &mdash; Encrypted link to Lee's server for collaboration and shared files<br><br>
      <span style="color:#f5a623; font-weight:600;">Your data stays yours</span> &mdash; Everything runs locally on your machine, nothing in the cloud
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- After setup -->
<tr><td style="padding:8px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0d1a0d; border-radius:8px; border:1px solid #1a3a1a;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px; color:#f5a623; font-weight:600; margin-bottom:8px;">After setup</div>
    <div style="font-size:13px; color:#aaaaaa; line-height:1.6;">
      Once Claude finishes the setup, send me a screenshot of the verification checklist results. I will then connect our shared folder and we can start building your automations.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 16px; text-align:center;">
  <div style="font-size:11px; color:#f5a623;">INSPIRE EDGE</div>
  <div style="font-size:10px; color:#444444; margin-top:4px;">Deployed by NAVADA Edge | Lee Akpareva</div>
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
      to: 'send2chopstix@gmail.com',
      cc: 'leeakpareva@gmail.com',
      subject: 'INSPIRE EDGE: Your AI Home Server Setup (Paste This Prompt)',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
