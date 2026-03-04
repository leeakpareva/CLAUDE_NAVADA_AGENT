#!/usr/bin/env node
/**
 * Send session summary report email — 3 March 2026
 */
require('dotenv').config({ path: __dirname + '/.env' });
const emailService = require('./email-service');

const html = `
<div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 680px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0;">
  <div style="background: linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%); padding: 32px 24px; text-align: center;">
    <h1 style="margin: 0; color: white; font-size: 28px; letter-spacing: -0.5px;">NAVADA Session Report</h1>
    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">3 March 2026 | Claude Chief of Staff</p>
  </div>
  <div style="padding: 24px;">
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #00d4ff; margin-top: 0; font-size: 18px;">Session Summary</h2>
      <p style="color: #ccc; line-height: 1.6;">Resumed interrupted ChromaDB session and completed full omni-channel upgrade. All 3 communication channels (Telegram, SMS, WhatsApp) now share conversation memory, semantic cache, and RAG context. Claude responds intelligently across all channels as Chief of Staff.</p>
    </div>
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #00d4ff; margin-top: 0; font-size: 18px;">Tasks Completed</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">1.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>Semantic Cache Integration</strong><br><span style="color: #999;">Wired semantic-cache.js into telegram-bot.js. Two-tier: in-memory LRU (50 entries, 30min TTL) + ChromaDB persistent (24hr TTL). Saves API costs on repeated/similar questions. Added /cache command.</span></td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">2.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>SMS Webhook Fix</strong><br><span style="color: #999;">Twilio webhook URL was pointing to /twilio/whatsapp instead of /twilio/sms. Fixed via Twilio API. SMS now routes correctly to Claude.</span></td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">3.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>Omni-Channel Upgrade</strong><br><span style="color: #999;">Full rewrite of processInboundMessage: semantic cache, RAG context injection, shared history tagged [Telegram]/[SMS]/[WhatsApp] with timestamps, 2-day auto-purge, channel-aware formatting (SMS 1500 chars, WhatsApp 3000 chars, plain text).</span></td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">4.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>Voice Call Verified</strong><br><span style="color: #999;">Tested and confirmed Twilio voice calls working. Lee received test call from +447446994961 with TTS message.</span></td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">5.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>PM2 Fix (Node v24)</strong><br><span style="color: #999;">Fixed PM2 pipe name collision causing EPERM errors. Changed from long path-based names to MD5 hash-based pipe names. All 9 PM2 services restored.</span></td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">6.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>GitHub Deploy</strong><br><span style="color: #999;">Created private repo leeakpareva/CLAUDE_NAVADA_AGENT and pushed all code. 16 files changed, 4,843 insertions.</span></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #00d4ff; vertical-align: top;">7.</td>
          <td style="padding: 10px 8px; color: #e0e0e0;"><strong>ccusage Installed</strong><br><span style="color: #999;">Installed ccusage globally for Claude Code token tracking. Created ccusage-report.js for automated daily/weekly/monthly reports with email delivery.</span></td>
        </tr>
      </table>
    </div>
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #00d4ff; margin-top: 0; font-size: 18px;">Omni-Channel Architecture</h2>
      <pre style="background: #0d0d0d; padding: 16px; border-radius: 6px; font-size: 12px; color: #aaa; overflow-x: auto; line-height: 1.4;">
  iPhone
    |
    +-- Telegram Bot ------> Claude API (Sonnet/Opus)
    |                            |
    +-- SMS (+447446994961) -> Twilio Webhook -> Claude API
    |                            |
    +-- WhatsApp (sandbox) --> Twilio Webhook -> Claude API
    |                            |
    +-- Voice Call -----------> Twilio TTS

  Shared Layer:
    [Conversation History] -- tagged [Telegram]/[SMS]/[WhatsApp]
    [Semantic Cache] -- in-memory LRU + ChromaDB (24hr TTL)
    [RAG Context] -- ChromaDB 462+ chunks, injected per-request
    [Cost Tracking] -- per-call logging + ccusage daily
    [2-Day Auto-Purge] -- old turns cleaned automatically</pre>
    </div>
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #00d4ff; margin-top: 0; font-size: 18px;">New Files Added</h2>
      <ul style="color: #ccc; line-height: 1.8; font-size: 13px;">
        <li><code style="color: #00d4ff;">semantic-cache.js</code> -- Two-tier response caching (memory + ChromaDB)</li>
        <li><code style="color: #00d4ff;">chroma-rag.js</code> -- ChromaDB Cloud RAG with Cloudflare Workers AI embeddings</li>
        <li><code style="color: #00d4ff;">cloudflare-flux.js</code> -- FREE AI image generation via Workers AI</li>
        <li><code style="color: #00d4ff;">cloudflare-r2.js</code> -- R2 object storage (zero egress)</li>
        <li><code style="color: #00d4ff;">cloudflare-stream.js</code> -- Video CDN management</li>
        <li><code style="color: #00d4ff;">cloudflare-trace.js</code> -- Request routing diagnostics</li>
        <li><code style="color: #00d4ff;">network-scanner.js</code> -- Infrastructure monitoring</li>
        <li><code style="color: #00d4ff;">ccusage-report.js</code> -- Token usage reporting with email</li>
      </ul>
    </div>
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #00d4ff; margin-top: 0; font-size: 18px;">GitHub Repository</h2>
      <p style="color: #ccc;"><a href="https://github.com/leeakpareva/CLAUDE_NAVADA_AGENT" style="color: #00d4ff;">github.com/leeakpareva/CLAUDE_NAVADA_AGENT</a> (private)</p>
      <p style="color: #999; font-size: 13px;">Commit: feat: omni-channel Claude (SMS + WhatsApp + Telegram) with shared memory, semantic cache, and RAG</p>
    </div>
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px;">
      <h2 style="color: #00d4ff; margin-top: 0; font-size: 18px;">Token Usage (ccusage)</h2>
      <p style="color: #ccc; font-size: 13px;">ccusage installed globally. Commands:</p>
      <ul style="color: #999; font-size: 13px; line-height: 1.8;">
        <li><code style="color: #00d4ff;">ccusage daily</code> -- Today's usage</li>
        <li><code style="color: #00d4ff;">ccusage weekly</code> / <code style="color: #00d4ff;">ccusage monthly</code></li>
        <li><code style="color: #00d4ff;">node Automation/ccusage-report.js --email</code> -- Report to inbox</li>
      </ul>
    </div>
  </div>
  <div style="background: #050505; padding: 16px 24px; text-align: center; border-top: 1px solid #222;">
    <p style="color: #666; font-size: 12px; margin: 0;">Claude, Chief of Staff | NAVADA AI Engineering &amp; Consulting</p>
  </div>
</div>`;

emailService.sendEmail({
  to: 'leeakpareva@gmail.com',
  subject: 'NAVADA Session Report | 3 March 2026 | Omni-Channel Upgrade Complete',
  rawHtml: html,
}).then(info => {
  console.log('Email sent:', info.messageId);
}).catch(err => {
  console.error('Email error:', err.message);
});
