/**
 * Email to Uncle Patrick — AI Stock Analysis capabilities
 * Modern, colorful template (matching previous email)
 * CC: Tim + Lee
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
<title>AI Stock Analysis — NAVADA Edge</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Hero Banner -->
<tr><td style="background: linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0f3460 100%); padding:32px 20px; text-align:center;">
  <div style="font-size:11px; letter-spacing:4px; color:#00c853; text-transform:uppercase; margin-bottom:10px; font-weight:600;">NAVADA EDGE</div>
  <div style="font-size:24px; font-weight:700; color:#ffffff; line-height:1.3;">AI-Powered Stock Analysis</div>
  <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:8px;">Yes, it is possible. Here is exactly what AI can do.</div>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 20px 12px 20px;">
  <div style="font-size:15px; color:#1a1a2e; line-height:1.7;">
    Uncle Patrick,
  </div>
  <div style="font-size:14px; color:#444444; line-height:1.7; margin-top:10px;">
    Great question. The short answer is <strong style="color:#0f3460;">yes</strong>. I already have an AI trading system running on my home server right now. Here is what we can build for you.
  </div>
</td></tr>

<!-- What AI Can Do -->
<tr><td style="padding:12px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">What AI Can Do With Stocks</div>
</td></tr>

<!-- Card 1: Technical Analysis -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #00c853 0%, #009624 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128200;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Technical Analysis</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.9); line-height:1.6;">
      AI calculates every major indicator in real-time: Moving Averages, RSI, MACD, Bollinger Bands, support and resistance levels. It scans thousands of stocks simultaneously and spots patterns a human would miss.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Card 2: Buy/Sell Signals -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #e94560 0%, #c23152 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128276;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Buy &amp; Sell Signals</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.9); line-height:1.6;">
      AI generates alerts when conditions align. For example: "Stock X is oversold (RSI below 30) + positive earnings news + price at strong support level = BUY signal." It emails or messages you the alert instantly. Same for sell signals when a stock hits your target or shows weakness.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Card 3: Growth Projections -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #0f3460 0%, #16213e 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128201;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Growth Projections</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.9); line-height:1.6;">
      AI analyses revenue trends, earnings growth, sector performance, and historical patterns to project where a stock could be in 3, 6, or 12 months. It compares against peers and industry benchmarks to give context.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Card 4: Sentiment Analysis -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #533483 0%, #0b2447 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128240;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">News &amp; Sentiment Analysis</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.9); line-height:1.6;">
      AI reads and analyses financial news, earnings call transcripts, analyst reports, and social media in real-time. It scores sentiment (bullish/bearish) and factors it into buy/sell recommendations. You get the signal, not the noise.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Card 5: Backtesting -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #e94560 0%, #533483 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#9881;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Strategy Backtesting</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.9); line-height:1.6;">
      Before you risk real money, AI tests your strategy against 10+ years of historical data. "If I bought every time RSI dropped below 30 and sold at 70, what would my returns be?" You get the answer in seconds with real numbers.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Card 6: Paper Trading -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #00c853 0%, #0f3460 100%); border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:20px; margin-bottom:4px;">&#128176;</div>
    <div style="font-size:14px; color:#ffffff; font-weight:700; margin-bottom:4px;">Paper Trading (Practice Mode)</div>
    <div style="font-size:12px; color:rgba(255,255,255,0.9); line-height:1.6;">
      AI runs your strategy with simulated money against live market data. You see exactly how your portfolio would perform, in real-time, without risking a penny. Once you are confident, you switch to live trading.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- What AI Can't Do -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">The Honest Part</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff8f0; border-radius:12px; border-left:4px solid #e94560;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#555555; line-height:1.8;">
      No AI system can <strong>guarantee</strong> profits. Nobody can predict black swan events (wars, pandemics, flash crashes). What AI gives you is an <strong style="color:#0f3460;">edge</strong>:<br><br>
      <span style="color:#00c853; font-weight:600;">&#10003;</span> It processes more data than any human, 24/7<br>
      <span style="color:#00c853; font-weight:600;">&#10003;</span> It has no emotion: no panic selling, no FOMO buying<br>
      <span style="color:#00c853; font-weight:600;">&#10003;</span> It follows the strategy with absolute discipline<br>
      <span style="color:#00c853; font-weight:600;">&#10003;</span> It spots opportunities and risks faster<br><br>
      The edge is consistency and speed. That is the advantage.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- How it fits into NAVADA Edge -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">How This Fits Your Setup</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f9ff; border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#555555; line-height:2.0;">
      All of this runs on your NAVADA Edge home server:<br><br>
      <span style="display:inline-block; width:24px; height:24px; background:#00c853; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">1</span> <strong style="color:#1a1a2e;">World Dashboard</strong> shows your watchlist and markets live<br>
      <span style="display:inline-block; width:24px; height:24px; background:#0f3460; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">2</span> <strong style="color:#1a1a2e;">AI analyses stocks overnight</strong> while you sleep<br>
      <span style="display:inline-block; width:24px; height:24px; background:#e94560; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">3</span> <strong style="color:#1a1a2e;">Morning briefing</strong> sent to your phone: buy signals, sell signals, portfolio performance<br>
      <span style="display:inline-block; width:24px; height:24px; background:#533483; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">4</span> <strong style="color:#1a1a2e;">Real-time alerts</strong> throughout the day when targets are hit<br>
      <span style="display:inline-block; width:24px; height:24px; background:#00c853; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px;">5</span> <strong style="color:#1a1a2e;">Paper trading bot</strong> tests strategies before you commit real capital
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Data sources -->
<tr><td style="padding:16px 20px 4px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">Market Data (Free)</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f9ff; border-radius:12px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#555555; line-height:1.8;">
      <span style="color:#0f3460; font-weight:600;">Yahoo Finance</span> &#8212; Real-time quotes, historical data, fundamentals<br>
      <span style="color:#0f3460; font-weight:600;">Alpha Vantage</span> &#8212; Technical indicators, forex, crypto<br>
      <span style="color:#0f3460; font-weight:600;">IEX Cloud</span> &#8212; Real-time US market data feed<br>
      <span style="color:#0f3460; font-weight:600;">Alpaca</span> &#8212; Commission-free trading API + paper trading<br>
      <span style="color:#0f3460; font-weight:600;">Financial news APIs</span> &#8212; Live sentiment scoring<br><br>
      All free tiers or low-cost. No Bloomberg terminal needed.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Meeting reminder -->
<tr><td style="padding:16px 20px 6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg, #0a1628 0%, #0f3460 100%); border-radius:12px;">
  <tr><td style="padding:20px; text-align:center;">
    <div style="font-size:11px; letter-spacing:3px; color:#00c853; text-transform:uppercase; margin-bottom:8px;">LET'S DISCUSS</div>
    <div style="font-size:18px; font-weight:700; color:#ffffff;">14th March 2026</div>
    <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:6px;">I will demo my live trading system when we meet so you can see exactly how it works in practice.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Closing -->
<tr><td style="padding:20px 20px 12px 20px;">
  <div style="font-size:14px; color:#444444; line-height:1.7;">
    The technology is ready. The data is available. We just need to design the strategy that fits your investment goals and build it on your server. Looking forward to discussing on the 14th.
  </div>
  <div style="font-size:14px; color:#1a1a2e; font-weight:600; margin-top:16px;">
    Lee
  </div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 20px 24px 20px; text-align:center; border-top:1px solid #eeeef2;">
  <div style="font-size:11px; color:#999999; margin-bottom:4px;">NAVADA Edge | AI-Powered Investment Intelligence</div>
  <div style="font-size:10px; color:#bbbbbb;">Lee Akpareva | leeakpareva@gmail.com</div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  try {
    const info = await transporter.sendMail({
      from: '"Lee Akpareva | NAVADA" <claude.navada@zohomail.eu>',
      to: 'patakpareva@gmail.com',
      cc: 'tim_akpareva@yahoo.com, leeakpareva@gmail.com',
      subject: 'Yes — AI Stock Analysis, Buy/Sell Signals & Growth Projections',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
