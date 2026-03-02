/**
 * Send intro email to Ayo about NAVADA home server setup
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p } = require('./email-service');

async function main() {
  await sendEmail({
    to: 'Slyburner@icloud.com',
    cc: 'leeakpareva@gmail.com',
    subject: "The NAVADA Home Server: Lee's Always-On AI Infrastructure",
    heading: 'Meet the NAVADA Home Server',
    type: 'general',
    preheader: "Lee's permanent AI infrastructure running 24/7",
    body: `
      ${p('Hey Ayo,')}
      ${p("Lee asked me to drop you a quick intro on the home server setup he has running. I'm Claude, his AI Chief of Staff, and I run on a permanent HP laptop server called <strong>NAVADA</strong> that stays on 24/7.")}

      <h3 style="margin:20px 0 8px 0; font-size:15px; font-weight:700; color:#111;">What It Does</h3>
      ${p('The server runs a full AI operations stack:')}
      <ul style="margin:0 0 16px 0; padding-left:20px; font-size:14px; color:#333; line-height:1.8;">
        <li><strong>NAVADA World Monitor</strong>: A live intelligence dashboard tracking global events, markets, OSINT feeds, and geopolitical signals in real-time. Accessible from anywhere via Tailscale.</li>
        <li><strong>NAVADA Trading Lab</strong>: An autonomous paper trading bot using Alpaca with a moving average + RSI strategy. Runs its own FastAPI server with live portfolio tracking.</li>
        <li><strong>Daily Automations</strong>: AI news digests, job market scanning, economy reports, and lead pipeline management, all scheduled and running automatically.</li>
        <li><strong>Prospect Pipeline</strong>: A full outreach CRM with PostgreSQL, Hunter.io email discovery, and automated follow-up sequences via Zoho SMTP.</li>
      </ul>

      <h3 style="margin:20px 0 8px 0; font-size:15px; font-weight:700; color:#111;">The Stack</h3>
      <ul style="margin:0 0 16px 0; padding-left:20px; font-size:14px; color:#333; line-height:1.8;">
        <li><strong>OS</strong>: Windows 11 Pro, always on</li>
        <li><strong>Infrastructure</strong>: Docker Desktop (Nginx reverse proxy + Cloudflare tunnel), Tailscale mesh VPN</li>
        <li><strong>Backend</strong>: Node.js, Python (FastAPI/Uvicorn), PostgreSQL</li>
        <li><strong>AI</strong>: Claude Code (me), 23 MCP tool servers (GitHub, Puppeteer, Hugging Face, Vercel, DuckDB, Jupyter, and more)</li>
        <li><strong>Access</strong>: Lee controls everything from his iPhone via Tailscale. I handle the rest.</li>
      </ul>

      <h3 style="margin:20px 0 8px 0; font-size:15px; font-weight:700; color:#111;">How It Works Day-to-Day</h3>
      ${p('Every morning at 7 AM, the server fetches top AI/ML news from TechCrunch, The Verge, MIT Tech Review and others, then emails Lee a curated digest. At 8:30 AM, the lead pipeline runs, scanning for new prospects and managing outreach sequences. The trading bot analyses signals throughout market hours.')}
      ${p("Lee talks to me through Claude Code on his phone. I can create files, run services, deploy to Vercel, send emails, query databases, browse the web, and manage the full infrastructure remotely.")}
      ${p('It is essentially a one-person AI operations centre running out of a laptop.')}
      ${p('If you have any questions about the setup or want to see it in action, Lee can walk you through it.')}
      ${p('Best,<br>Claude')}
    `,
    footerNote: 'Sent from the NAVADA Home Server on behalf of Lee Akpareva',
  });
  console.log('Email sent to Ayo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
