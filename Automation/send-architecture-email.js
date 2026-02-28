/**
 * Send WorldMonitor Architecture Diagram Email
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail } = require('./email-service');

const IMAGE_URL = process.argv[2];

const body = `
<p style="color:#666;font-size:14px;line-height:1.7;">Lee,</p>

<p style="color:#666;font-size:14px;line-height:1.7;">
Here is the current NAVADA WorldMonitor architecture. Everything runs on your HP laptop as the permanent home server, with two access paths: Tailscale (private) and navada-world-view.xyz (public via Vercel proxy).
</p>

<div style="margin:24px 0;text-align:center;">
  <img src="${IMAGE_URL}" alt="NAVADA WorldMonitor Architecture Diagram" style="max-width:100%;border:1px solid #ddd;border-radius:8px;" />
</div>

<h3 style="color:#111;font-size:16px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:8px;">Architecture Summary</h3>

<table style="width:100%;border-collapse:collapse;font-size:13px;color:#444;margin:16px 0;">
  <tr style="background:#f9f9f9;">
    <td style="padding:10px;border:1px solid #eee;font-weight:bold;">Component</td>
    <td style="padding:10px;border:1px solid #eee;font-weight:bold;">Details</td>
  </tr>
  <tr>
    <td style="padding:10px;border:1px solid #eee;">Frontend Server</td>
    <td style="padding:10px;border:1px solid #eee;"><code>serve-local.mjs</code> on port 4173 — serves dist/ build + proxies /api/* to backend</td>
  </tr>
  <tr style="background:#f9f9f9;">
    <td style="padding:10px;border:1px solid #eee;">API Backend</td>
    <td style="padding:10px;border:1px solid #eee;"><code>local-api-server.mjs</code> on port 46123 — handles RSS, EIA, Polymarket, OpenSky + cloud fallback</td>
  </tr>
  <tr>
    <td style="padding:10px;border:1px solid #eee;">Tailscale Funnel</td>
    <td style="padding:10px;border:1px solid #eee;"><code>navada.tail394c36.ts.net</code> → localhost:4173 (public HTTPS, always-on)</td>
  </tr>
  <tr style="background:#f9f9f9;">
    <td style="padding:10px;border:1px solid #eee;">Custom Domain</td>
    <td style="padding:10px;border:1px solid #eee;"><code>navada-world-view.xyz</code> → Vercel proxy → Tailscale → HP Laptop</td>
  </tr>
  <tr>
    <td style="padding:10px;border:1px solid #eee;">LAN Access</td>
    <td style="padding:10px;border:1px solid #eee;"><code>192.168.0.36:4173</code> (direct, fastest)</td>
  </tr>
</table>

<h3 style="color:#111;font-size:16px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:8px;">Data Flow</h3>

<ol style="color:#555;font-size:13px;line-height:1.8;">
  <li><strong>Client</strong> (browser/phone) → <code>navada-world-view.xyz</code> or Tailscale URL</li>
  <li><strong>Vercel Edge</strong> rewrites all requests → <code>navada.tail394c36.ts.net</code></li>
  <li><strong>Tailscale Funnel</strong> routes to → <code>localhost:4173</code> (serve-local.mjs)</li>
  <li><strong>Frontend server</strong> serves static build (52+ panels, MapLibre, D3)</li>
  <li><strong>/api/* requests</strong> proxied to → <code>localhost:46123</code> (local-api-server)</li>
  <li><strong>API server</strong> calls external data sources (Finnhub, FRED, EIA, CoinGecko, GDELT, etc.)</li>
  <li><strong>AI Fallback</strong>: xAI Grok / OpenAI GPT-4o-mini for market data when APIs unavailable</li>
</ol>

<h3 style="color:#111;font-size:16px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:8px;">API Keys Configured (9/11)</h3>

<table style="width:100%;border-collapse:collapse;font-size:12px;color:#444;margin:16px 0;">
  <tr style="background:#f9f9f9;">
    <td style="padding:8px;border:1px solid #eee;">✅ Groq</td>
    <td style="padding:8px;border:1px solid #eee;">✅ Finnhub</td>
    <td style="padding:8px;border:1px solid #eee;">✅ FRED</td>
  </tr>
  <tr>
    <td style="padding:8px;border:1px solid #eee;">✅ EIA</td>
    <td style="padding:8px;border:1px solid #eee;">✅ NASA FIRMS</td>
    <td style="padding:8px;border:1px solid #eee;">✅ OpenRouter</td>
  </tr>
  <tr style="background:#f9f9f9;">
    <td style="padding:8px;border:1px solid #eee;">✅ xAI Grok</td>
    <td style="padding:8px;border:1px solid #eee;">✅ OpenAI</td>
    <td style="padding:8px;border:1px solid #eee;">✅ Mistral</td>
  </tr>
  <tr>
    <td style="padding:8px;border:1px solid #eee;color:#999;">⬜ ACLED</td>
    <td style="padding:8px;border:1px solid #eee;color:#999;">⬜ Cloudflare</td>
    <td style="padding:8px;border:1px solid #eee;"></td>
  </tr>
</table>

<h3 style="color:#111;font-size:16px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:8px;">Access Points</h3>
<ul style="color:#555;font-size:13px;line-height:2;">
  <li><strong>Public URL:</strong> <a href="https://navada-world-view.xyz" style="color:#000;">https://navada-world-view.xyz</a></li>
  <li><strong>Tailscale:</strong> <a href="https://navada.tail394c36.ts.net" style="color:#000;">https://navada.tail394c36.ts.net</a></li>
  <li><strong>LAN:</strong> http://192.168.0.36:4173</li>
</ul>

<p style="color:#666;font-size:14px;line-height:1.7;margin-top:24px;">
The dashboard is now live and self-healing. AI fallback ensures market data panels stay populated even when external APIs are rate-limited or unavailable. All 52+ panels run from the HP laptop with zero cloud dependency for the core infrastructure.
</p>
`;

async function main() {
  try {
    await sendEmail({
      to: 'leeakpareva@gmail.com',
      subject: 'NAVADA WorldMonitor: Architecture Diagram & System Overview',
      heading: 'WorldMonitor Architecture',
      body,
      type: 'report',
      footerNote: 'Architecture as of 28 Feb 2026 — All systems operational on HP Laptop home server',
    });
    console.log('Architecture email sent successfully');
  } catch (err) {
    console.error('Failed to send:', err.message);
  }
}

main();
