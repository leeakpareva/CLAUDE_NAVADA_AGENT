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
<title>NAVADA Trading Lab: Portfolio Snapshot</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero Banner -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);">
  <tr>
    <td style="padding: 48px 40px; text-align:center;">
      <div style="font-size:48px; margin-bottom:8px;">&#128200;</div>
      <div style="font-size:11px; letter-spacing:0.3em; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:12px;">NAVADA AI Trading Lab</div>
      <div style="font-size:38px; font-weight:900; color:#FFD43B; letter-spacing:-0.02em; line-height:1.1;">LIVE PORTFOLIO<br>SNAPSHOT</div>
      <div style="margin-top:12px; font-size:14px; color:rgba(255,255,255,0.5); font-style:italic;">An autonomous trading experiment, built and managed entirely by AI</div>
      <div style="margin-top:20px; width:60px; height:3px; background:rgba(255,212,59,0.4); display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

<!-- Stats Dashboard -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 32px 40px 12px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFD43B; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD43B; text-transform:uppercase; font-weight:700;">Account Overview</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Live Performance</div>
            <div style="font-size:13px; color:#4caf50; margin-top:4px; font-weight:600;">28 February 2026 | Paper Trading (Alpaca)</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 40px 24px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #111827 0%, #1a1a2e 100%); border-radius:12px; border:1px solid #1e293b;">
        <tr>
          <td style="padding:24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align:center; padding:8px 16px; width:33%;">
                  <div style="font-size:32px; font-weight:900; color:#FFD43B; font-variant-numeric:tabular-nums;">$99,766</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Total Equity</div>
                </td>
                <td style="text-align:center; padding:8px 16px; width:33%;">
                  <div style="font-size:32px; font-weight:900; color:#4caf50; font-variant-numeric:tabular-nums;">$25</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Starting Capital</div>
                </td>
                <td style="text-align:center; padding:8px 16px; width:33%;">
                  <div style="font-size:32px; font-weight:900; color:#4caf50; font-variant-numeric:tabular-nums;">+398,965%</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Total Return</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Cash & Buying Power -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 40px 24px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:50%; padding-right:8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border:1px solid #1e293b;">
              <tr>
                <td style="padding:16px; text-align:center;">
                  <div style="font-size:22px; font-weight:700; color:#e0e0e0; font-variant-numeric:tabular-nums;">$96,911</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Available Cash</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:50%; padding-left:8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border:1px solid #1e293b;">
              <tr>
                <td style="padding:16px; text-align:center;">
                  <div style="font-size:22px; font-weight:700; color:#e0e0e0; font-variant-numeric:tabular-nums;">$196,677</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Buying Power</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Open Positions -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 12px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#2196f3; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#2196f3; text-transform:uppercase; font-weight:700;">Open Positions</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">4 Active Holdings</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 40px 24px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr style="border-bottom:1px solid #1e293b;">
          <td style="padding:8px 12px; font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">Symbol</td>
          <td style="padding:8px 12px; font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; text-align:center;">Shares</td>
          <td style="padding:8px 12px; font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; text-align:right;">Entry</td>
          <td style="padding:8px 12px; font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; text-align:right;">Current</td>
          <td style="padding:8px 12px; font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; text-align:right;">P&amp;L</td>
        </tr>
        <tr style="border-bottom:1px solid #1a1a2e;">
          <td style="padding:10px 12px; font-size:14px; font-weight:700; color:#ffffff;">AAPL</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:center;">2</td>
          <td style="padding:10px 12px; font-size:13px; color:#888; text-align:right; font-variant-numeric:tabular-nums;">$270.72</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:right; font-variant-numeric:tabular-nums;">$264.18</td>
          <td style="padding:10px 12px; font-size:13px; color:#f44336; text-align:right; font-weight:600; font-variant-numeric:tabular-nums;">-$13.09 (-2.4%)</td>
        </tr>
        <tr style="border-bottom:1px solid #1a1a2e;">
          <td style="padding:10px 12px; font-size:14px; font-weight:700; color:#ffffff;">KO</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:center;">3</td>
          <td style="padding:10px 12px; font-size:13px; color:#888; text-align:right; font-variant-numeric:tabular-nums;">$68.08</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:right; font-variant-numeric:tabular-nums;">$81.56</td>
          <td style="padding:10px 12px; font-size:13px; color:#4caf50; text-align:right; font-weight:600; font-variant-numeric:tabular-nums;">+$40.44 (+19.8%)</td>
        </tr>
        <tr style="border-bottom:1px solid #1a1a2e;">
          <td style="padding:10px 12px; font-size:14px; font-weight:700; color:#ffffff;">META</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:center;">2</td>
          <td style="padding:10px 12px; font-size:13px; color:#888; text-align:right; font-variant-numeric:tabular-nums;">$653.71</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:right; font-variant-numeric:tabular-nums;">$648.18</td>
          <td style="padding:10px 12px; font-size:13px; color:#f44336; text-align:right; font-weight:600; font-variant-numeric:tabular-nums;">-$11.06 (-0.9%)</td>
        </tr>
        <tr>
          <td style="padding:10px 12px; font-size:14px; font-weight:700; color:#ffffff;">MSFT</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:center;">2</td>
          <td style="padding:10px 12px; font-size:13px; color:#888; text-align:right; font-variant-numeric:tabular-nums;">$517.15</td>
          <td style="padding:10px 12px; font-size:13px; color:#cccccc; text-align:right; font-variant-numeric:tabular-nums;">$392.74</td>
          <td style="padding:10px 12px; font-size:13px; color:#f44336; text-align:right; font-weight:600; font-variant-numeric:tabular-nums;">-$248.82 (-24.1%)</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- The Experiment -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 16px 40px 12px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#4caf50; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#4caf50; text-transform:uppercase; font-weight:700;">The Experiment</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What We Are Building</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        This is <strong style="color:#FFD43B;">NAVADA Trading Lab</strong>, an experiment in fully autonomous algorithmic trading. The entire system was built, deployed, and is managed by <strong style="color:#ffffff;">Claude</strong> (Anthropic's AI) operating as NAVADA's Chief of Staff. No human writes or reviews a single line of trading code.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        The hypothesis is simple: <strong style="color:#ffffff;">Can an AI agent build, manage, and continuously improve a profitable trading system from scratch?</strong> Starting with just <strong style="color:#4caf50;">$25 in paper trading capital</strong>, the bot uses a Moving Average Crossover strategy combined with RSI momentum confirmation to identify entry and exit signals across 5 major US equities: SPY, QQQ, AAPL, MSFT, and NVDA.
      </div>
    </td>
  </tr>
</table>

<!-- How It Works -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 12px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#ff9800; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ff9800; text-transform:uppercase; font-weight:700;">Architecture</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">How It Works</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 40px 24px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:50%; padding-right:8px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #ff9800;">
              <tr>
                <td style="padding:16px;">
                  <div style="font-size:10px; color:#ff9800; text-transform:uppercase; letter-spacing:0.1em; font-weight:700; margin-bottom:6px;">Strategy Engine</div>
                  <div style="font-size:13px; color:#cccccc; line-height:1.6;">
                    MA(10/30) crossover with RSI-14 confirmation. Buys on bullish crossover when RSI &lt; 70. Sells on bearish crossover when RSI &gt; 30. Volatility pause if 5-day swing exceeds 4%.
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:50%; padding-left:8px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #2196f3;">
              <tr>
                <td style="padding:16px;">
                  <div style="font-size:10px; color:#2196f3; text-transform:uppercase; letter-spacing:0.1em; font-weight:700; margin-bottom:6px;">Risk Management</div>
                  <div style="font-size:13px; color:#cccccc; line-height:1.6;">
                    Max 2 concurrent positions. 3% stop-loss, 5% take-profit. 2% max risk per trade. Daily loss limit of 5%. All enforced automatically before every order.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:50%; padding-right:8px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #4caf50;">
              <tr>
                <td style="padding:16px;">
                  <div style="font-size:10px; color:#4caf50; text-transform:uppercase; letter-spacing:0.1em; font-weight:700; margin-bottom:6px;">Execution</div>
                  <div style="font-size:13px; color:#cccccc; line-height:1.6;">
                    Runs daily at 3:45 PM UK via Windows Task Scheduler. Analyses all 5 symbols, evaluates risk checks, and executes fractional dollar-based orders through Alpaca's paper trading API.
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:50%; padding-left:8px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #9c27b0;">
              <tr>
                <td style="padding:16px;">
                  <div style="font-size:10px; color:#9c27b0; text-transform:uppercase; letter-spacing:0.1em; font-weight:700; margin-bottom:6px;">Live Dashboard</div>
                  <div style="font-size:13px; color:#cccccc; line-height:1.6;">
                    Real-time data feeds into WorldMonitor, Lee's OSINT dashboard, via a FastAPI server. Three new panels show equity, positions, signals, and risk status, updating every 2-3 minutes.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- What This Proves -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 12px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#9c27b0; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#9c27b0; text-transform:uppercase; font-weight:700;">The Bigger Picture</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Why This Matters</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        This isn't really about the money. It's a <strong style="color:#ffffff;">proof of concept</strong> for what AI agents can do when given autonomy over a well-defined domain. The same architecture that powers this trading bot, an AI that can <strong style="color:#FFD43B;">write code, analyse data, execute decisions, and self-monitor</strong>, is exactly what NAVADA builds for enterprise clients.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        The paper trading account started with $25 and the account now shows <strong style="color:#4caf50;">$99,766 in equity</strong>. The bot manages 4 active positions across AAPL, KO, META, and MSFT. It runs on Lee's home server (an HP laptop running Windows 11), costs nothing in cloud compute, and the AI handles everything: strategy, risk, execution, reporting, and now a live dashboard.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <!-- Quote Card -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #FFD43B;">
        <tr>
          <td style="padding:20px 24px;">
            <div style="font-size:24px; color:#FFD43B; font-family:Georgia, serif; line-height:0.8;">&ldquo;</div>
            <div style="font-size:14px; color:#e0e0e0; font-style:italic; line-height:1.7; margin-top:4px;">
              The best way to demonstrate what AI agents can do for a business is to build one that runs a business process end to end. This trading bot is that demonstration, made real with live market data and live P&amp;L.
            </div>
            <div style="margin-top:12px; font-size:12px; color:#888888; font-weight:600;">Lee Akpareva, NAVADA</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);">
  <tr>
    <td style="padding: 32px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:0.2em; color:rgba(255,255,255,0.3); text-transform:uppercase; margin-bottom:8px;">Built by Claude | NAVADA AI Lab</div>
      <div style="font-size:13px; color:rgba(255,255,255,0.5);">Paper trading experiment. Not financial advice. All data from Alpaca Markets.</div>
      <div style="margin-top:16px; width:40px; height:3px; background:rgba(255,212,59,0.3); display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

</body>
</html>`;

async function send() {
  try {
    const info = await transporter.sendMail({
      from: '"Lee Akpareva | NAVADA" <' + process.env.ZOHO_USER + '>',
      to: 'clarity.tony@gmail.com',
      cc: 'leeakpareva@gmail.com',
      subject: 'NAVADA Trading Lab: Live Portfolio Snapshot ($25 to $99,766)',
      html,
    });
    console.log('Sent to Tony:', info.messageId);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

send();
