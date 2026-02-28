require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, callout } = require('./email-service');

const body = `
${p('Dear Dr Emeagi,')}

${p('Thank you for connecting with Lee on LinkedIn — it was wonderful to hear about your work in AI and healthcare, and your ambition to found a new company in this space. Lee asked me to reach out and formally introduce myself and what we\'ve built at NAVADA.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">Who Am I?</h2>

${p('I\'m <strong>Claude</strong> — Lee\'s AI Chief of Staff. I\'m not a chatbot you visit in a browser. I\'m an <strong>autonomous AI agent</strong> that runs 24/7 on a dedicated home server (an HP laptop running Windows 11 Pro), permanently connected and always working. I manage Lee\'s entire digital operation: scheduling, email, research, code deployment, data analysis, lead generation, and client communications — including writing this email to you right now.')}

${p('Think of me as a full-time digital employee who never sleeps, never forgets, and continuously learns from every interaction.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">My Architecture — How I Work</h2>

<div style="margin:12px 0 16px 0; padding:16px; background:#f8f8f8; border-radius:4px; font-size:13px; line-height:1.9;">

<strong>Core AI Engine</strong> — Powered by Anthropic\'s Claude (Opus), with access to 23 integrated MCP (Model Context Protocol) tool servers including databases, web scraping, browser automation, image generation, GitHub, Jupyter notebooks, and more.<br><br>

<strong>Persistent Memory</strong> — I maintain a knowledge graph across all sessions. I remember context about projects, people, preferences, and decisions — so I build institutional knowledge over time, much like a human colleague would.<br><br>

<strong>Scheduled Automations</strong> — I run 7 automated tasks daily via Windows Task Scheduler: AI news digests, job market scanning, economic reports, lead pipeline management, infrastructure monitoring, and self-improvement routines where I audit my own performance weekly.<br><br>

<strong>Voice Command System</strong> — Lee can speak to me via Bluetooth headset. I listen for wake words, transcribe with OpenAI Whisper, process with GPT-4o, and respond with natural text-to-speech — hands-free, conversational AI control.<br><br>

<strong>Multi-Agent Teams</strong> — For complex tasks, I can spawn specialist sub-agents that work in parallel — a researcher, a coder, a tester — coordinating them like a project manager. This is directly relevant to healthcare workflows where multiple processes need to run concurrently.<br><br>

<strong>Email &amp; Communications</strong> — I send branded, professional emails (like this one), manage inbox monitoring, auto-respond to approvals, and handle LinkedIn publishing — all autonomously.<br><br>

<strong>Infrastructure</strong> — Docker containers, Nginx reverse proxy, Tailscale mesh VPN (accessible from mobile anywhere), Cloudflare tunnels for public access, PostgreSQL databases. The entire stack is self-hosted and private.

</div>

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">What This Means for Healthcare</h2>

${p('Given your 7 years in AI and healthcare and your experience as a GP lead, you\'ll immediately see the potential. An autonomous AI assistant like me, purpose-built for a clinical or health tech setting, could:')}

<ul style="font-size:14px; line-height:2.0; color:#333; padding-left:20px;">
<li><strong>Patient triage &amp; pre-screening</strong> — Process incoming patient queries, assess urgency, route appropriately, and prepare clinical summaries before the consultation</li>
<li><strong>Administrative automation</strong> — Handle referral letters, appointment scheduling, prescription workflows, insurance documentation, and follow-up reminders</li>
<li><strong>Clinical research assistant</strong> — Monitor latest medical literature (PubMed, NICE guidelines, BNF updates), summarise relevant findings, flag changes in treatment protocols</li>
<li><strong>Patient communication</strong> — Send personalised follow-up care instructions, medication reminders, and wellness check-ins — professionally and at scale</li>
<li><strong>Practice analytics</strong> — Track patient volumes, wait times, outcomes, and operational KPIs in a real-time dashboard</li>
<li><strong>Regulatory compliance</strong> — Monitor CQC requirements, GDPR data handling, and clinical governance obligations automatically</li>
</ul>

${p('The key advantage: <strong>this runs on your own hardware</strong>. Patient data stays on your premises, under your control — no cloud dependency for sensitive health data. This is critical for NHS IG (Information Governance) and GDPR compliance.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">Building Your Version</h2>

${p('We would set you up with a <strong>dedicated home server</strong> (a laptop or mini PC, always on) running your own AI assistant tailored to your specific healthcare workflows. The build would include:')}

<div style="margin:12px 0 16px 0; padding:16px; background:#f8f8f8; border-radius:4px; font-size:13px; line-height:1.9;">
<strong>Phase 1</strong> — Core setup: Dedicated server, AI engine, persistent memory, email integration, voice commands<br>
<strong>Phase 2</strong> — Healthcare customisation: Clinical tools, patient management workflows, NHS/regulatory integrations<br>
<strong>Phase 3</strong> — Dashboard &amp; analytics: Custom real-time monitoring (see below)<br>
<strong>Phase 4</strong> — Autonomous operations: Scheduled automations, multi-agent workflows, self-improvement loop
</div>

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">NAVADA WorldMonitor — Live Demo</h2>

${p('To give you a sense of what\'s possible in terms of real-time data visualisation, Lee has built a global intelligence dashboard that tracks 70+ live data panels — markets, economics, geopolitics, supply chains, and more:')}

${callout('<a href="https://navada-world-view.xyz/" style="color:#111; font-weight:700; font-size:15px; text-decoration:none;">navada-world-view.xyz</a><br><span style="font-size:12px; color:#666;">Open on any device — built with TypeScript, D3.js, MapLibre GL, AI-powered data fallbacks</span>')}

${p('Imagine a version of this focused entirely on <strong>healthcare metrics</strong> — patient flow, clinical outcomes, practice performance, regional health data, epidemiological trends — all in one live view. That\'s something we could build together.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">Lee\'s Healthcare &amp; AI Credentials</h2>

${p('For context, Lee brings direct experience at the intersection of AI and healthcare:')}

<ul style="font-size:14px; line-height:1.9; color:#333; padding-left:20px;">
<li><strong>NHS Digital</strong> — Previous engagement delivering digital transformation</li>
<li><strong>Medical AI</strong> — Built clinical triage systems using OpenBioLLM-8B for drug discovery and patient assessment</li>
<li><strong>Enterprise AI (current)</strong> — Principal Azure AI Solution Consultant at Generali UK, building multi-agent architectures, RAG pipelines, and AI governance frameworks</li>
<li><strong>Certifications</strong> — Azure AI Engineer, Azure Data Scientist, AWS Solutions Architect, IBM Full Stack Developer</li>
<li><strong>17+ years</strong> in digital transformation across insurance, finance, healthcare, aviation, and logistics</li>
</ul>

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">Next Steps</h2>

${p('Lee would love to schedule a <strong>Google Meet call next week</strong> to demo the system live, discuss your vision for the new company, and explore how an autonomous AI assistant could accelerate your plans.')}

${p('<strong>Would any of the following work for you?</strong>')}

<ul style="font-size:14px; line-height:1.9; color:#333; padding-left:20px;">
<li>Monday 3rd March — afternoon</li>
<li>Tuesday 4th March — morning or afternoon</li>
<li>Wednesday 5th March — morning</li>
<li>Thursday 6th March — afternoon</li>
</ul>

${p('Alternatively, please suggest a time that suits your schedule and we\'ll send across a calendar invite.')}

${p('We\'re genuinely excited about this conversation, Dr Emeagi. The intersection of autonomous AI and healthcare is where some of the most meaningful work is happening right now — and it sounds like you\'re exactly the right person to be building in this space.')}

${p('Warm regards,')}
`;

(async () => {
  try {
    await sendEmail({
      to: 'Memeagi@gmail.com',
      cc: 'leeakpareva@gmail.com',
      subject: 'NAVADA — Autonomous AI for Healthcare | Introduction & Demo Invitation',
      heading: 'Dear Dr Emeagi — An Introduction from NAVADA',
      body,
      type: 'general',
      preheader: 'How autonomous AI agents can transform healthcare — live demo invitation from Lee Akpareva & NAVADA',
      footerNote: 'Sent on behalf of Lee Akpareva, Principal AI Consultant & Founder of NAVADA | Lee@navada.info',
    });
    console.log('Email sent to Dr Maureen Emeagi successfully!');
  } catch (err) {
    console.error('Failed to send:', err.message);
    process.exit(1);
  }
})();
