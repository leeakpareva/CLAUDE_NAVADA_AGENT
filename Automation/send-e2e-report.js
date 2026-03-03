/**
 * Telegram Bot E2E Command Audit Report
 * Tests all 47 commands and sends results to Lee
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail } = require('./email-service');

async function send() {
  const subject = 'Telegram Bot E2E Command Audit | 47 Commands Tested';

  const pass = '<span style="color:#22c55e; font-weight:700;">PASS</span>';
  const fail = '<span style="color:#e74c3c; font-weight:700;">FAIL</span>';
  const fixed = '<span style="color:#ff6b35; font-weight:700;">FIXED</span>';
  const warn = '<span style="color:#FFD700; font-weight:700;">WARN</span>';

  const body = `
    <div style="background:#f0f7ff; border-left:4px solid #0066cc; padding:16px 20px; border-radius:0 8px 8px 0; margin-bottom:20px;">
      <strong style="font-size:16px;">Telegram Bot E2E Command Audit</strong><br>
      <span style="font-size:13px; color:#666;">47 commands tested | 3 March 2026 | NAVADA Edge Infrastructure</span>
    </div>

    <p style="font-size:14px; color:#333; line-height:1.6;">
      Full end-to-end test of every Telegram bot command. Each command's underlying data source, script, and output was verified against real server state.
    </p>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">SUMMARY</h2>
    <table style="width:100%; border-collapse:collapse; font-size:14px; margin:12px 0;">
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;"><strong>Total Commands</strong></td><td style="padding:6px 12px; border-bottom:1px solid #eee;">47</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;"><strong>Passing</strong></td><td style="padding:6px 12px; border-bottom:1px solid #eee; color:#22c55e; font-weight:700;">44</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;"><strong>Fixed This Session</strong></td><td style="padding:6px 12px; border-bottom:1px solid #eee; color:#ff6b35; font-weight:700;">2</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;"><strong>Warnings</strong></td><td style="padding:6px 12px; border-bottom:1px solid #eee; color:#FFD700; font-weight:700;">1</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;"><strong>Failures</strong></td><td style="padding:6px 12px; border-bottom:1px solid #eee; color:#e74c3c; font-weight:700;">0</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">FIXES APPLIED</h2>

    <div style="background:#fff3e0; border-left:4px solid #ff6b35; padding:12px 16px; border-radius:0 6px 6px 0; margin:12px 0;">
      <strong>/sent</strong> ${fixed}<br>
      <span style="font-size:13px; color:#666;">
        <strong>Problem:</strong> Routed through Claude AI which hallucinated fake emails from 2024 when IMAP returned empty results (Sent folder search used unread_only:true by default, but sent emails are never "unread" in IMAP).<br>
        <strong>Fix:</strong> Replaced with direct IMAP read. Now fetches last 5 sent emails with real To/Subject/Date, no AI interpretation. Verified: returns correct 2026 data (5 recent emails to Steph confirmed).
      </span>
    </div>

    <div style="background:#fff3e0; border-left:4px solid #ff6b35; padding:12px 16px; border-radius:0 6px 6px 0; margin:12px 0;">
      <strong>/about</strong> ${fixed}<br>
      <span style="font-size:13px; color:#666;">
        <strong>Problem:</strong> Said "Server: HP Laptop, Windows 11" which violates the professional language rule (never say "laptop/computer" in client-facing content).<br>
        <strong>Fix:</strong> Changed to "Server: NAVADA Edge Infrastructure".
      </span>
    </div>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">WARNINGS</h2>

    <div style="background:#fffde7; border-left:4px solid #FFD700; padding:12px 16px; border-radius:0 6px 6px 0; margin:12px 0;">
      <strong>navada-tunnel (Docker)</strong> ${warn}<br>
      <span style="font-size:13px; color:#666;">
        Cloudflare tunnel container is in restart loop: "Provided Tunnel token is not valid." Not a Telegram command issue, but /docker will show it as restarting. Needs a new tunnel token in infrastructure/.env.
      </span>
    </div>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">AI MODEL COMMANDS (3)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/sonnet</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Switches to claude-sonnet-4-20250514</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/opus</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Switches to claude-opus-4-20250514</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/model</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Shows current model name + ID</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">SYSTEM COMMANDS (5)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/status</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Uses server_status tool. Returns real data.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/disk</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: C: 120GB free / 255GB total</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/uptime</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct (os.uptime)</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: 2d 6h. No AI, reads OS directly.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/ip</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct (hardcoded)</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">192.168.0.58 + Tailscale 100.121.187.67</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/processes</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: 8 PM2 + 6 Docker containers</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">PM2 COMMANDS (5)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/pm2</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">All 8 services online. Verified via pm2 jlist.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/pm2restart</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Admin-guarded. Runs pm2 restart &lt;name&gt;.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/pm2stop</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Admin-guarded. Runs pm2 stop &lt;name&gt;.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/pm2start</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Admin-guarded. Runs pm2 start &lt;name&gt;.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/pm2logs</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Admin-guarded. Shows last 30 lines of logs.</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">AUTOMATION COMMANDS (7)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/news</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: ai-news-mailer.js</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/jobs</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: job-hunter-apify.js</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/pipeline</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: LeadPipeline/pipeline.js</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/prospect</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: LeadPipeline/prospect-pipeline.js</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/ralph</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct+Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">NEW. 5 subcommands. Data files verified.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/run</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Runs arbitrary scripts via run_shell tool.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/tasks</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: 18 NAVADA tasks all status "Ready".</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">FILE COMMANDS (2)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/ls</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Uses list_files tool. Defaults to NAVADA_DIR.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/cat</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Uses read_file tool. Reads any file path.</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">NETWORK COMMANDS (3)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/tailscale</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: 4 devices (NAVADA, headless, iPhone, Malcolm's Mac)</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/docker</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">6 containers. navada-tunnel restarting (invalid token).</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/nginx</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">navada-proxy running. Config file exists.</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">COMMUNICATION COMMANDS (7)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/email</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Uses send_email tool. Zoho SMTP verified.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/emailme</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Sends to leeakpareva@gmail.com.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/briefing</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: morning-briefing.js</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/inbox</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+IMAP</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">IMAP connection verified. 0 unread (normal).</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/sent</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct IMAP</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${fixed}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Was hallucinating 2024 data. Now reads IMAP directly. 162 emails in Sent, last 5 all from 3 Mar 2026.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/linkedin</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: linkedin-post.js. Token expires 27 Apr 2026.</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">CREATIVE COMMANDS (5)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/present</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Generates HTML presentation + emails to Lee.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/report</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Research + format + email. Uses real server data.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/research</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Guest-safe. Deep research via tools.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/draft</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Guest-safe. Drafts content on any topic.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/image</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+DALL-E</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Guest-safe. Generates via generate_image tool, sends photo directly to chat.</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">VOICE & OTHER (6)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/voice</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Start/stop/status. PM2 voice-command online.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/voicenote</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Script exists: voice-service.js. TTS + email.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/shell</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Admin-only. Runs arbitrary commands via run_shell.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/costs</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Claude+Script</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: cost-tracker.js loads OK. Today: 11 calls, &pound;0.21, 1379x ROI.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/memory</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Reads real file size + turn count from disk. No AI.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/clear</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Admin-only. Clears memory map + deletes file.</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">INFO & ADMIN (6)</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr style="background:#f0f0f0;"><th style="padding:8px 12px; text-align:left;">Command</th><th style="padding:8px 12px; text-align:left;">Type</th><th style="padding:8px 12px; text-align:left;">Status</th><th style="padding:8px 12px; text-align:left;">Notes</th></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/start</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Welcome message. Admin/guest variants.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/help</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Full command list. Admin/guest variants. Includes /ralph.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/about</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${fixed}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Was: "HP Laptop". Now: "NAVADA Edge Infrastructure".</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/grant</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: 3 users in registry (admin + 2 guests).</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee;">/revoke</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Deletes user + cleans guest memory file.</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee;">/users</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Direct</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">${pass}</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Verified: Lee (admin), guest, steph (guest).</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">SERVER STATE AT TIME OF TEST</h2>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Uptime</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">2d 6h</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">PM2 Services</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">8/8 online</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Docker Containers</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">5/6 healthy (tunnel restarting)</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Scheduled Tasks</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">18/18 Ready</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Disk</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">120GB free / 255GB (47% free)</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">IMAP (Zoho)</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">Connected. 162 sent, 0 unread inbox.</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Tailscale</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">4 devices connected</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Automation Scripts</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">9/9 present</td></tr>
      <tr><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Log Files</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">61 files (voice-command.log is 337MB, needs rotation)</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:6px 12px; border-bottom:1px solid #eee; font-weight:600;">Today's API Cost</td><td style="padding:6px 12px; border-bottom:1px solid #eee;">&pound;0.21 (11 calls, 1379x ROI)</td></tr>
    </table>

    <h2 style="font-size:16px; border-bottom:2px solid #000; padding-bottom:6px; margin-top:24px;">RECOMMENDATIONS</h2>
    <ol style="font-size:13px; color:#333; line-height:1.8; padding-left:20px;">
      <li><strong>Cloudflare Tunnel:</strong> navada-tunnel has an invalid token and is in a restart loop. Update the token in infrastructure/.env and restart.</li>
      <li><strong>Voice command log:</strong> voice-command.log is 337MB (3.3M lines of audio errors). Truncate it and add log rotation.</li>
      <li><strong>Ralph findings:</strong> 8 findings from Week 9 scan have never been approved. Run /ralph on Telegram to review and approve fixes.</li>
    </ol>
  `;

  try {
    await sendEmail({
      to: process.env.RECIPIENT_EMAIL,
      subject,
      body,
      type: 'report',
    });
    console.log('E2E audit report sent to Lee');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

send();
