#!/usr/bin/env node
/**
 * Welcome email for Steph — NAVADA Edge Demo Access
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail } = require('./email-service');

const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px 30px; text-align: center;">
    <div style="font-size: 12px; letter-spacing: 6px; color: #6c63ff; text-transform: uppercase; margin-bottom: 8px;">NAVADA</div>
    <h1 style="font-size: 28px; font-weight: 700; color: white; margin: 0;">Welcome to NAVADA Edge</h1>
    <p style="color: #8888aa; font-size: 14px; margin-top: 8px;">Your AI assistant is ready</p>
  </div>

  <!-- Body -->
  <div style="padding: 30px;">

    <p style="font-size: 15px; line-height: 1.6; color: #d0d0d0;">Hi Steph,</p>

    <p style="font-size: 15px; line-height: 1.6; color: #d0d0d0;">
      Thank you for participating in the <strong style="color: white;">NAVADA Edge demo</strong>. You now have access to a live AI agent powered by Anthropic Claude, available 24/7 on Telegram.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #d0d0d0;">
      This is an early demo of what NAVADA Edge delivers to clients: a bespoke, autonomous AI assistant that runs around the clock, accessible from your phone.
    </p>

    <!-- How to Use -->
    <div style="background: #141425; border-radius: 10px; padding: 24px; margin: 24px 0; border-left: 4px solid #6c63ff;">
      <h2 style="font-size: 16px; color: #6c63ff; margin: 0 0 12px 0;">How to Get Started</h2>
      <ol style="font-size: 14px; line-height: 2; color: #c0c0c0; padding-left: 20px; margin: 0;">
        <li>Open <strong style="color: white;">Telegram</strong> on your phone or desktop</li>
        <li>Search for the bot: <strong style="color: white;">@NavadaEdgeBot</strong></li>
        <li>Tap <strong style="color: white;">Start</strong> or send <code style="background: #222; padding: 2px 6px; border-radius: 4px; color: #6c63ff;">/start</code></li>
        <li>Start chatting. Ask it anything.</li>
      </ol>
    </div>

    <!-- Commands -->
    <div style="background: #141425; border-radius: 10px; padding: 24px; margin: 24px 0; border-left: 4px solid #27ae60;">
      <h2 style="font-size: 16px; color: #27ae60; margin: 0 0 12px 0;">Available Commands</h2>
      <table style="width: 100%; font-size: 13px; color: #c0c0c0;">
        <tr><td style="padding: 4px 0;"><code style="color: #6c63ff;">/help</code></td><td>See all available commands</td></tr>
        <tr><td style="padding: 4px 0;"><code style="color: #6c63ff;">/status</code></td><td>Server status and system info</td></tr>
        <tr><td style="padding: 4px 0;"><code style="color: #6c63ff;">/image &lt;prompt&gt;</code></td><td>Generate AI images (DALL-E 3)</td></tr>
        <tr><td style="padding: 4px 0;"><code style="color: #6c63ff;">/research &lt;topic&gt;</code></td><td>Deep research on any topic</td></tr>
        <tr><td style="padding: 4px 0;"><code style="color: #6c63ff;">/draft &lt;topic&gt;</code></td><td>Draft content, emails, documents</td></tr>
        <tr><td style="padding: 4px 0;"><code style="color: #6c63ff;">/about</code></td><td>Learn about NAVADA Edge</td></tr>
      </table>
      <p style="font-size: 12px; color: #888; margin: 12px 0 0 0;">Or just type naturally. The AI understands plain English.</p>
    </div>

    <!-- What to Try -->
    <div style="background: #141425; border-radius: 10px; padding: 24px; margin: 24px 0; border-left: 4px solid #e67e22;">
      <h2 style="font-size: 16px; color: #e67e22; margin: 0 0 12px 0;">Things to Try</h2>
      <ul style="font-size: 14px; line-height: 2; color: #c0c0c0; padding-left: 20px; margin: 0;">
        <li>"Summarise the latest AI news this week"</li>
        <li>"Draft me a professional LinkedIn post about AI in business"</li>
        <li><code style="color: #6c63ff;">/image</code> a futuristic city skyline at sunset</li>
        <li>"What are the top 5 trends in AI for 2026?"</li>
        <li><code style="color: #6c63ff;">/research</code> the current state of AI regulation in the UK</li>
      </ul>
    </div>

    <!-- Demo Notice -->
    <div style="background: #1a1a0a; border-radius: 10px; padding: 20px; margin: 24px 0; border-left: 4px solid #f1c40f;">
      <p style="font-size: 14px; color: #f1c40f; margin: 0 0 8px 0; font-weight: 600;">Demo Stage</p>
      <p style="font-size: 13px; color: #c0c0a0; margin: 0; line-height: 1.6;">
        This is a live demo of the NAVADA Edge platform. Your access is active for 7 days. Some features are restricted during the demo period. If you experience any issues, please let Lee know directly.
      </p>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #d0d0d0;">
      Thank you for being an early tester, Steph. Your feedback is genuinely valuable as we refine the platform.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #d0d0d0; margin-top: 24px;">
      Best regards,<br>
      <strong style="color: white;">Lee Akpareva</strong><br>
      <span style="color: #888; font-size: 13px;">Founder, NAVADA Edge</span>
    </p>

  </div>

  <!-- Footer -->
  <div style="background: #050510; padding: 20px 30px; text-align: center; border-top: 1px solid #222;">
    <p style="font-size: 11px; color: #555; margin: 0;">NAVADA Edge | Autonomous AI Agents | Powered by Anthropic Claude</p>
  </div>

</div>
`;

(async () => {
  try {
    await sendEmail({
      to: 'Stephanieagunu@gmail.com',
      subject: 'Welcome to NAVADA Edge — Your AI Agent is Ready',
      html,
    });
    console.log('Welcome email sent to Steph');
  } catch (err) {
    console.error('Failed:', err.message);
  }
})();
