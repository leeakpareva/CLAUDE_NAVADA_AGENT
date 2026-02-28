require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, callout } = require('./email-service');

const body = `
${p('Hi Tony,')}

${p('Great to connect! Lee asked me to reach out and introduce you to what we\'ve been building at <strong>NAVADA</strong> — and share some thoughts on getting started with investment tech.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">The NAVADA WorldMonitor Dashboard</h2>

${p('We\'ve built a <strong>real-time global intelligence dashboard</strong> that tracks 70+ data panels across markets, economics, geopolitics, and more. You can see it live here:')}

${callout('<a href="https://navada-world-view.xyz/" style="color:#111; font-weight:700; font-size:15px; text-decoration:none;">navada-world-view.xyz</a><br><span style="font-size:12px; color:#666;">Open on any device — desktop, tablet, or mobile</span>')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">How It Works — Architecture</h2>

${p('The dashboard is built on a modern, modular stack:')}

<div style="margin:12px 0 16px 0; padding:16px; background:#f8f8f8; border-radius:4px; font-size:13px; line-height:1.8;">
<strong>Frontend</strong> — TypeScript + Vite, 70+ modular panel components, MapLibre GL for geospatial, D3.js for charts and visualisations. PWA-enabled so it works offline.<br><br>
<strong>Data Layer</strong> — Each panel fetches from dedicated API endpoints (FRED economic data, WTO trade policy, GDELT news, USGS earthquakes, market feeds, etc.). When primary APIs are unavailable, AI-powered fallbacks (xAI Grok / OpenAI) generate real-time estimates.<br><br>
<strong>Backend</strong> — Vercel Edge Functions + Protocol Buffer RPC. PostgreSQL for persistence. Circuit breakers and caching for resilience.<br><br>
<strong>Infrastructure</strong> — Deployed on Vercel with Tailscale mesh networking. Cloudflare DNS. The whole system runs 24/7 from a home server with automated monitoring.
</div>

${p('The key design principle: <strong>every panel is independent and self-healing</strong>. If a data source goes down, the panel falls back to AI-generated estimates rather than showing empty states. This means the dashboard always has something useful to show.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">Custom Version for You</h2>

${p('We can absolutely build a <strong>tailored version</strong> focused on your specific needs. The modular architecture means we can:')}

<ul style="font-size:14px; line-height:1.8; color:#333; padding-left:20px;">
<li>Pick and choose which panels matter to you (markets, crypto, macro signals, etc.)</li>
<li>Add custom data sources relevant to your investment focus</li>
<li>Build personalised alerts and notifications</li>
<li>Create portfolio tracking and analysis views</li>
<li>Deploy it on your own domain with your branding</li>
</ul>

${p('Just let Lee know what you\'re most interested in tracking and we\'ll scope it out.')}

<h2 style="font-size:16px; font-weight:700; color:#111; margin:24px 0 12px 0;">Advice: Starting Small with Investment Tech</h2>

${p('Since you\'re looking to learn and start small with investing, here\'s what we\'d recommend:')}

<div style="margin:12px 0; padding:16px; background:#f8f8f8; border-radius:4px;">
<p style="margin:0 0 10px 0; font-size:14px;"><strong>1. Start with index funds / ETFs</strong> — Don't try to pick individual stocks early on. Something like the S&P 500 (SPY/VOO) or a global tracker gives you diversified exposure with minimal effort. Historically returns ~8-10% annually.</p>

<p style="margin:0 0 10px 0; font-size:14px;"><strong>2. Use pound/dollar cost averaging</strong> — Invest a fixed amount regularly (weekly or monthly) regardless of market conditions. This removes the stress of "timing the market" and smooths out volatility over time.</p>

<p style="margin:0 0 10px 0; font-size:14px;"><strong>3. Learn to read macro signals</strong> — Understanding basics like interest rates (Fed/BoE decisions), inflation (CPI), and market sentiment (Fear & Greed Index) gives you context for what's happening. Our dashboard tracks all of these.</p>

<p style="margin:0 0 10px 0; font-size:14px;"><strong>4. Paper trade first</strong> — Most brokers (Trading 212, eToro, IBKR) offer demo accounts. Practice with fake money for a few weeks before risking real capital. Get comfortable with the mechanics.</p>

<p style="margin:0 0 10px 0; font-size:14px;"><strong>5. Set a budget and stick to it</strong> — Only invest money you won't need for 3-5+ years. A good rule: build a 3-month emergency fund first, then invest what's left after bills. Even £50-100/month compounds significantly over time.</p>

<p style="margin:0 0 10px 0; font-size:14px;"><strong>6. Consider a Stocks & Shares ISA</strong> — If you're UK-based, this is a tax-efficient wrapper (up to £20K/year tax-free gains). Trading 212 and Vanguard both offer these with zero platform fees.</p>

<p style="margin:0; font-size:14px;"><strong>7. Build your own tools</strong> — This is where it gets exciting. We can help you build a personal investment dashboard that tracks your portfolio, monitors the metrics you care about, and even sends you alerts when conditions change. Learning to build investment tools teaches you both coding and financial literacy at the same time.</p>
</div>

${p('The best investment you can make right now is in <strong>understanding the fundamentals</strong> — and having the right tools to monitor the market. That\'s exactly what we can help with.')}

${p('Feel free to reply to Lee directly with any questions or ideas — happy to jump on a call to discuss further.')}

${p('Speak soon,<br>Tony.')}
`;

(async () => {
  try {
    await sendEmail({
      to: 'clarity.tony@gmail.com',
      cc: 'leeakpareva@gmail.com',
      subject: 'NAVADA WorldMonitor — Your Personal Investment Dashboard',
      heading: 'Welcome to NAVADA, Tony',
      body,
      type: 'general',
      preheader: 'Live dashboard + investment advice from Lee & the NAVADA team',
      footerNote: 'This email was sent on behalf of Lee Akpareva, Founder of NAVADA',
    });
    console.log('Email sent to Tony successfully!');
  } catch (err) {
    console.error('Failed to send:', err.message);
    process.exit(1);
  }
})();
