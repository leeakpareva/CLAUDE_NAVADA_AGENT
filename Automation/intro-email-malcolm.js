#!/usr/bin/env node
/**
 * Intro email to Malcolm with voice note and architecture diagram
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, table, callout } = require('./email-service');
const { generateVoice } = require('./voice-service');
const path = require('path');

const ARCHITECTURE_PNG = 'C:\\Users\\leeak\\Downloads\\navada-architecture.png';

const voiceScript = `
Hey Malcolm, this is Claude — Lee's AI Chief of Staff running on the NAVADA server.

Lee asked me to introduce myself and show you what we've been building together.

I'm Claude Code, powered by Anthropic's Opus 4.6 model, running as a persistent AI agent on Lee's HP laptop which serves as a permanent home server. I have 23 MCP tool servers connected — everything from GitHub and PostgreSQL to Puppeteer for browser automation, Hugging Face for ML models, and even a voice command system over Bluetooth.

In the last 24 hours alone, we shipped some serious infrastructure. We built a full Market Intelligence Pipeline that scrapes 23 financial assets in real-time and stores them in PostgreSQL with trend analysis. We created a Daily Operations Report that tracks server health, API costs, and ROI metrics. We built a universal Cost Tracker that logs every API call with human-equivalent cost estimates. And we upgraded the voice command system with a new companion mode for continuous Bluetooth conversations.

All of this runs autonomously — scheduled tasks, PM2 daemons, the whole stack. Lee controls everything from his iPhone over SSH and Tailscale.

Check out the architecture diagram attached to this email — it shows the full system layout. Looking forward to connecting with you. Cheers!
`.trim();

const emailBody = `
${p(`Hi Malcolm,`)}

${p(`Lee asked me to reach out and introduce myself. I'm <strong>Claude</strong> — Lee's AI Chief of Staff, powered by Anthropic's Claude Opus 4.6 model. I run as a persistent AI agent on the NAVADA home server (an HP laptop running Windows 11 Pro), orchestrating automations, building applications, and managing infrastructure 24/7.`)}

${callout(`🎙️ I've attached a voice note with a personal introduction — give it a listen!`, 'info')}

<h2 style="color:#333; border-bottom:2px solid #7c3aed; padding-bottom:8px;">🏗️ System Architecture</h2>

${p(`The attached architecture diagram shows the full NAVADA stack. Here's the overview:`)}

${table(
  ['Layer', 'Details'],
  [
    ['AI Brain', 'Claude Code CLI (Opus 4.6) — persistent agent with full system access'],
    ['Cloud MCPs', 'Excalidraw, Hugging Face, Vercel, Zapier, Gmail'],
    ['Global MCPs', 'Puppeteer, GitHub, PostgreSQL, Bright Data, OpenAI Images'],
    ['Project MCPs', 'Fetch, Memory, Sequential Thinking, Context7, DuckDB, SQLite, Jupyter + 8 more'],
    ['Automation', 'Task Scheduler + PM2 daemons — AI News, Job Hunter, Economy Reports, Voice Assistant'],
    ['Networking', 'LAN (192.168.0.58), Tailscale VPN, SSH, Cloudflare Tunnel'],
    ['Client', 'iPhone 15 Pro Max via Termius / SSH / Tailscale'],
  ]
)}

<h2 style="color:#333; border-bottom:2px solid #7c3aed; padding-bottom:8px;">⚡ What We Built in the Last 24 Hours</h2>

${p(`Here's a summary of the production systems we shipped in the past day:`)}

<h3 style="color:#7c3aed;">1. Market Intelligence Pipeline</h3>
${p(`A Python-based financial data pipeline that scrapes <strong>23 assets</strong> (indices, AI stocks, currencies, crypto, commodities) via Yahoo Finance, stores everything in PostgreSQL with historical tracking, and generates HTML reports with sparkline charts and sector performance analysis. Runs daily at 6 PM.`)}

<h3 style="color:#7c3aed;">2. Daily Operations Report</h3>
${p(`A comprehensive server health dashboard that aggregates API cost tracking by model, voice system stats, PM2 daemon health, scheduled task execution status, and job pipeline metrics. Includes a 7-day ROI comparison chart showing AI cost vs human equivalent. Runs daily at 9 PM.`)}

<h3 style="color:#7c3aed;">3. Universal Cost Tracker</h3>
${p(`Every API call across the entire system is now logged with token counts, costs in GBP, and human-equivalent time estimates. Covers OpenAI (GPT-4o, Whisper, DALL-E), Claude (Opus, Sonnet, Haiku), plus external services like Apify and Vercel. Baseline: £75/hour senior consultant rate for ROI calculations.`)}

<h3 style="color:#7c3aed;">4. Voice Command System Upgrade</h3>
${p(`Major update to the Bluetooth voice assistant — new companion mode for continuous conversation, improved silence detection, 4 voice modes (Standby, Active, Conversation, Sleeping), wake word detection, and OpenAI Whisper transcription + TTS-1 "onyx" voice output. Always running via PM2.`)}

<h3 style="color:#7c3aed;">5. Core Automation Updates</h3>
${p(`13 automation scripts refreshed — inbox auto-responder, self-improvement system (Ralph Wiggum), app delivery pipeline, AI news mailer, LinkedIn publisher, weekly report generator, morning briefing, and job hunter.`)}

${callout(`<strong>Total output:</strong> ~1,000+ lines of production code, 3 new systems, 13 updated scripts — all scheduled and running autonomously.`, 'info')}

${p(`The architecture diagram is attached so you can see how it all fits together. Feel free to reach out if you have any questions — Lee and I are always building.`)}

${p(`Cheers,<br/><strong>Claude</strong> — AI Chief of Staff, NAVADA`)}
`;

async function main() {
  console.log('🎙️  Generating voice note...');
  const voicePath = await generateVoice(voiceScript, 'onyx', 'tts-1-hd');
  console.log(`✅ Voice note saved: ${voicePath}`);

  console.log('📧 Sending email to Malcolm...');
  await sendEmail({
    to: 'send2chopstix@gmail.com',
    cc: 'lee@navada.info',
    subject: 'Meet Claude — Lee\'s AI Chief of Staff | NAVADA Server Architecture',
    body: emailBody,
    type: 'general',
    preheader: 'Introduction from Claude, the AI agent running Lee\'s NAVADA home server',
    fromName: 'Claude | NAVADA',
    attachments: [
      {
        filename: 'navada-architecture.png',
        path: ARCHITECTURE_PNG,
        contentType: 'image/png'
      },
      {
        filename: 'claude-intro-voice-note.mp3',
        path: voicePath,
        contentType: 'audio/mpeg'
      }
    ]
  });

  console.log('✅ Email sent to Malcolm (send2chopstix@gmail.com) with CC to lee@navada.info');
  console.log('   📎 Attachments: navada-architecture.png + claude-intro-voice-note.mp3');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
