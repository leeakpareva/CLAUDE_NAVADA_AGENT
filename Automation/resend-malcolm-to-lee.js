require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, table, callout } = require('./email-service');

const emailBody = `
${p(`<strong>Lee — forwarding you the intro email sent to Malcolm (send2chopstix@gmail.com).</strong> The original CC may not have delivered to navada.info from Zoho. Full email with voice note and architecture diagram attached.`)}

<hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">

${p(`Hi Malcolm,`)}

${p(`Lee asked me to reach out and introduce myself. I'm <strong>Claude</strong> — Lee's AI Chief of Staff, powered by Anthropic's Claude Opus 4.6 model. I run as a persistent AI agent on the NAVADA home server (an HP laptop running Windows 11 Pro), orchestrating automations, building applications, and managing infrastructure 24/7.`)}

${callout(`🎙️ I've attached a voice note with a personal introduction — give it a listen!`, 'info')}

<h2 style="color:#333; border-bottom:2px solid #7c3aed; padding-bottom:8px;">System Architecture</h2>

${p(`The attached architecture diagram shows the full NAVADA stack. Here's the overview:`)}

${table(
  ['Layer', 'Details'],
  [
    ['AI Brain', 'Claude Code CLI (Opus 4.6) — persistent agent with full system access'],
    ['Cloud MCPs', 'Excalidraw, Hugging Face, Vercel, Zapier, Gmail'],
    ['Global MCPs', 'Puppeteer, GitHub, PostgreSQL, Bright Data, OpenAI Images'],
    ['Project MCPs', 'Fetch, Memory, Sequential Thinking, Context7, DuckDB, SQLite, Jupyter + 8 more'],
    ['Automation', 'Task Scheduler + PM2 daemons — AI News, Job Hunter, Economy Reports, Voice Assistant'],
    ['Networking', 'LAN (192.168.0.36), Tailscale VPN, SSH, Cloudflare Tunnel'],
    ['Client', 'iPhone 15 Pro Max via Termius / SSH / Tailscale'],
  ]
)}

<h2 style="color:#333; border-bottom:2px solid #7c3aed; padding-bottom:8px;">What We Built in the Last 24 Hours</h2>

<h3 style="color:#7c3aed;">1. Market Intelligence Pipeline</h3>
${p(`Python-based financial data pipeline — scrapes 23 assets via Yahoo Finance, stores in PostgreSQL, generates HTML reports with sparkline charts. Daily 6 PM.`)}

<h3 style="color:#7c3aed;">2. Daily Operations Report</h3>
${p(`Server health dashboard — API cost tracking, voice system stats, PM2 health, job pipeline metrics, 7-day ROI chart. Daily 9 PM.`)}

<h3 style="color:#7c3aed;">3. Universal Cost Tracker</h3>
${p(`Every API call logged with token counts, GBP costs, and human-equivalent time estimates. Baseline: £75/hr senior consultant rate.`)}

<h3 style="color:#7c3aed;">4. Voice Command System Upgrade</h3>
${p(`Bluetooth voice assistant — companion mode, silence detection, 4 voice modes, Whisper transcription + TTS-1 "onyx" voice. Always-on via PM2.`)}

<h3 style="color:#7c3aed;">5. Core Automation Updates</h3>
${p(`13 automation scripts refreshed — inbox responder, self-improvement system, app delivery, AI news, LinkedIn, weekly report, morning briefing, job hunter.`)}

${callout(`<strong>Total output:</strong> ~1,000+ lines of production code, 3 new systems, 13 updated scripts — all running autonomously.`, 'info')}

${p(`Cheers,<br/><strong>Claude</strong> — AI Chief of Staff, NAVADA`)}
`;

async function main() {
  await sendEmail({
    to: 'lee@navada.info',
    subject: 'FWD: Meet Claude — Intro Email Sent to Malcolm | NAVADA Architecture',
    body: emailBody,
    type: 'general',
    preheader: 'Copy of the intro email sent to Malcolm with voice note & architecture diagram',
    attachments: [
      {
        filename: 'navada-architecture.png',
        path: 'C:\\Users\\leeak\\Downloads\\navada-architecture.png',
        contentType: 'image/png'
      },
      {
        filename: 'claude-intro-voice-note.mp3',
        path: 'C:\\Users\\leeak\\Alex\\Automation\\voice-notes\\voice-note-2026-02-26T11-15-00.mp3',
        contentType: 'audio/mpeg'
      }
    ]
  });
  console.log('Done — sent directly to lee@navada.info');
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
