/**
 * Email to Uncle Patrick — AI Stock Analysis Research & Evidence
 * Modern, colorful template — HIGH CONTRAST: white text on dark, dark text on light
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
<title>AI Stock Analysis — The Research</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Hero Banner -->
<tr><td style="background:#1a1a2e; padding:32px 20px; text-align:center;">
  <div style="font-size:11px; letter-spacing:4px; color:#00e676; text-transform:uppercase; margin-bottom:10px; font-weight:600;">RESEARCH BRIEF</div>
  <div style="font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">AI in Stock Analysis</div>
  <div style="font-size:13px; color:#cccccc; margin-top:8px;">What the research says. The evidence. The limitations.</div>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 20px 12px 20px;">
  <div style="font-size:15px; color:#1a1a2e; line-height:1.7;">Uncle Patrick,</div>
  <div style="font-size:14px; color:#333333; line-height:1.7; margin-top:10px;">
    Following your question, I wanted to share the actual research behind AI stock analysis. This is not hype. These are findings from Stanford, the IMF, and published academic studies from 2024/2025.
  </div>
</td></tr>

<!-- ===================== SECTION 1 ===================== -->
<tr><td style="padding:16px 20px 6px 20px;">
  <div style="font-size:11px; letter-spacing:2px; color:#00c853; text-transform:uppercase; font-weight:600;">QUESTION 1</div>
  <div style="font-size:17px; color:#1a1a2e; font-weight:700; margin-top:4px;">Can AI Analyse Stocks &amp; Project Growth?</div>
</td></tr>

<!-- Answer badge -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e8f5e9; border-radius:8px;">
  <tr><td style="padding:12px 16px;">
    <div style="font-size:15px; color:#1b5e20; font-weight:700;">Yes. Here is the evidence.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Finding 1: Stanford -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid #00c853; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#00c853; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Stanford University, 2025</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">AI Analyst Outperformed 93% of Human Fund Managers</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      Analysed 170 variables from public filings to project company performance. The AI identified patterns across financial statements that most human analysts missed entirely.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Finding 2: Chicago Booth -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid #2196f3; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#2196f3; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Chicago Booth Review</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">Asset Embeddings: How AI Reads the Market</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      AI can now understand how professional investors group stocks (growth, value, momentum) even when those labels are not explicitly mentioned in reports. It reads between the lines.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Finding 3: MDPI -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid #9c27b0; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#9c27b0; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">MDPI Research</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">Hybrid Models: High Historical Accuracy</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      Combining technical data (price patterns) with fundamental data (company health) produced growth projections with high historical accuracy over 3, 6, and 12 month periods.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- ===================== SECTION 2 ===================== -->
<tr><td style="padding:24px 20px 6px 20px;">
  <div style="font-size:11px; letter-spacing:2px; color:#e94560; text-transform:uppercase; font-weight:600;">QUESTION 2</div>
  <div style="font-size:17px; color:#1a1a2e; font-weight:700; margin-top:4px;">Can AI Tell Us When to Buy &amp; Sell?</div>
</td></tr>

<!-- Answer badge -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff3e0; border-radius:8px;">
  <tr><td style="padding:12px 16px;">
    <div style="font-size:15px; color:#e65100; font-weight:700;">Yes, but with important risks.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Signal 1: Predictive -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid #e94560; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#e94560; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">ResearchGate Study</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">Predictive Buy/Sell Signals</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      Multi-Layer Perceptron models predict a stock's future price. If predicted price is higher than current: <strong style="color:#00c853;">BUY</strong>. If lower: <strong style="color:#e94560;">SELL</strong>. Trained on historical data and continuously refined.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Signal 2: Sentiment -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid #ff6f00; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#ff6f00; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Damco Solutions</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">Real-Time Sentiment Detection</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      AI monitors social media (X, Reddit) and financial news in real-time. It detects hype or panic before humans do, allowing faster trade execution. It reads thousands of sources simultaneously.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Signal 3: HFT -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:10px; border-left:5px solid #0d47a1; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#0d47a1; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Institutional Trading</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">High-Frequency Trading (HFT)</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      Major institutions use AI to buy and sell in milliseconds, capturing profits from tiny price movements that humans would never see. This technology is now accessible at smaller scales.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- ===================== SECTION 3 ===================== -->
<tr><td style="padding:24px 20px 6px 20px;">
  <div style="font-size:11px; letter-spacing:2px; color:#ff6f00; text-transform:uppercase; font-weight:600;">THE HONEST PART</div>
  <div style="font-size:17px; color:#1a1a2e; font-weight:700; margin-top:4px;">The Limitations</div>
</td></tr>

<!-- Limitation 1 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff8e1; border-radius:10px; border-left:5px solid #ff6f00;">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#e65100; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Munich Personal RePEc Archive</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">Overfitting</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      AI can become a "genius" at predicting the past but fail when the market behaves in an unexpected way, like a sudden pandemic or geopolitical conflict. This is why backtesting alone is not enough.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Limitation 2 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff8e1; border-radius:10px; border-left:5px solid #ff6f00;">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#e65100; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Industry-Wide Concern</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">The Black Box Problem</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      AI often gives a signal without explaining why. This lack of explainability makes it hard to know if the AI is seeing a real trend or a random statistical glitch. Transparency matters.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Limitation 3 -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff8e1; border-radius:10px; border-left:5px solid #ff6f00;">
  <tr><td style="padding:16px;">
    <div style="font-size:11px; color:#e65100; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">International Monetary Fund (IMF)</div>
    <div style="font-size:14px; color:#1a1a2e; font-weight:700; margin-bottom:6px;">Herd Behaviour &amp; Flash Crashes</div>
    <div style="font-size:13px; color:#555555; line-height:1.6;">
      As more people use AI for trading, it can cause herd-like behaviour where everyone's AI decides to sell at the exact same second. This creates flash crashes and amplified volatility.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- ===================== RECOMMENDED READING ===================== -->
<tr><td style="padding:24px 20px 6px 20px;">
  <div style="font-size:15px; color:#1a1a2e; font-weight:700;">Recommended Reading</div>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e8f5e9; border-radius:10px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#1b5e20; font-weight:700; margin-bottom:6px;">&#9733; Stanford Report: The AI Analyst</div>
    <div style="font-size:13px; color:#333333; line-height:1.6;">How AI beats 93% of professional investors. Excellent starting point for understanding the technology.</div>
  </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff3e0; border-radius:10px;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#e65100; font-weight:700; margin-bottom:6px;">&#9733; Morningstar Analysis</div>
    <div style="font-size:13px; color:#333333; line-height:1.6;">A healthy skeptical perspective on why AI still struggles with complex market shifts. Important balance.</div>
  </td></tr>
  </table>
</td></tr>

<!-- ===================== BOTTOM LINE ===================== -->
<tr><td style="padding:20px 20px 6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a2e; border-radius:12px;">
  <tr><td style="padding:24px 20px; text-align:center;">
    <div style="font-size:11px; letter-spacing:3px; color:#00e676; text-transform:uppercase; margin-bottom:10px;">BOTTOM LINE</div>
    <div style="font-size:15px; font-weight:700; color:#ffffff; line-height:1.6;">AI is a powerful tool, not a crystal ball. It gives you a significant edge through speed, discipline, and data processing. Combined with human judgement, it is the best approach available today.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Meeting -->
<tr><td style="padding:12px 20px 6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e3f2fd; border-radius:10px; text-align:center;">
  <tr><td style="padding:16px;">
    <div style="font-size:13px; color:#0d47a1; font-weight:700;">14th March 2026</div>
    <div style="font-size:13px; color:#333333; margin-top:4px;">I will walk you through a live demo of my trading system. You will see all of this in action.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Closing -->
<tr><td style="padding:20px 20px 12px 20px;">
  <div style="font-size:14px; color:#1a1a2e; font-weight:600;">Lee</div>
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
      subject: 'AI Stock Analysis — The Research, The Evidence, The Limitations',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
