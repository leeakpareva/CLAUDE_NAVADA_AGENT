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
        <!-- Equity Hero -->
        <tr>
          <td style="padding: 28px; background: linear-gradient(135deg, #1a1a2e, #0f3460); border-radius:12px; text-align:center; border: 1px solid rgba(255,212,59,0.15);">
            <div style="font-size:11px; letter-spacing:0.2em; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:8px;">Total Equity</div>
            <div style="font-size:52px; font-weight:900; color:#FFD43B; letter-spacing:-0.03em;">$99,766.18</div>
            <div style="margin-top:8px; font-size:14px; color:rgba(255,255,255,0.5);">From $25.00 starting capital</div>
            <div style="margin-top:12px; display:inline-block; padding:6px 18px; background:rgba(76,175,80,0.15); border:1px solid rgba(76,175,80,0.3); border-radius:20px;">
              <span style="font-size:22px; font-weight:700; color:#4caf50;">+398,964.72%</span>
              <span style="font-size:12px; color:rgba(76,175,80,0.7); margin-left:4px;">all-time return</span>
            </div>
          </td>
        </tr>

        <!-- KPI Cards Row -->
        <tr>
          <td style="padding-top:16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="33%" style="padding-right:8px;">
                  <div style="background:#111; border:1px solid #222; border-radius:10px; padding:18px; text-align:center;">
                    <div style="font-size:10px; letter-spacing:0.15em; color:rgba(255,255,255,0.35); text-transform:uppercase;">Cash Available</div>
                    <div style="font-size:24px; font-weight:700; color:#e0e0e0; margin-top:4px;">$96,911</div>
                  </div>
                </td>
                <td width="33%" style="padding:0 4px;">
                  <div style="background:#111; border:1px solid #222; border-radius:10px; padding:18px; text-align:center;">
                    <div style="font-size:10px; letter-spacing:0.15em; color:rgba(255,255,255,0.35); text-transform:uppercase;">Buying Power</div>
                    <div style="font-size:24px; font-weight:700; color:#e0e0e0; margin-top:4px;">$196,677</div>
                  </div>
                </td>
                <td width="33%" style="padding-left:8px;">
                  <div style="background:#111; border:1px solid #222; border-radius:10px; padding:18px; text-align:center;">
                    <div style="font-size:10px; letter-spacing:0.15em; color:rgba(255,255,255,0.35); text-transform:uppercase;">Active Positions</div>
                    <div style="font-size:24px; font-weight:700; color:#e0e0e0; margin-top:4px;">4</div>
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

<!-- Active Positions -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 8px 40px;">
      <div style="font-size:11px; letter-spacing:0.2em; color:rgba(255,255,255,0.35); text-transform:uppercase; margin-bottom:16px; border-bottom:1px solid #1a1a1a; padding-bottom:8px;">Active Positions</div>

      <!-- AAPL -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
        <tr>
          <td style="background:#111; border:1px solid #222; border-radius:8px; padding:14px 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%">
                  <div style="font-size:18px; font-weight:700; color:#e0e0e0;">AAPL</div>
                  <div style="font-size:11px; color:rgba(255,255,255,0.35);">2 shares @ $270.72</div>
                </td>
                <td width="50%" style="text-align:right;">
                  <div style="font-size:18px; font-weight:700; color:#f44336;">-$13.09</div>
                  <div style="font-size:11px; color:#f44336;">-2.42%</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- KO -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
        <tr>
          <td style="background:#111; border:1px solid #222; border-radius:8px; padding:14px 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%">
                  <div style="font-size:18px; font-weight:700; color:#e0e0e0;">KO</div>
                  <div style="font-size:11px; color:rgba(255,255,255,0.35);">3 shares @ $68.08</div>
                </td>
                <td width="50%" style="text-align:right;">
                  <div style="font-size:18px; font-weight:700; color:#4caf50;">+$40.44</div>
                  <div style="font-size:11px; color:#4caf50;">+19.80%</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- META -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
        <tr>
          <td style="background:#111; border:1px solid #222; border-radius:8px; padding:14px 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%">
                  <div style="font-size:18px; font-weight:700; color:#e0e0e0;">META</div>
                  <div style="font-size:11px; color:rgba(255,255,255,0.35);">2 shares @ $653.71</div>
                </td>
                <td width="50%" style="text-align:right;">
                  <div style="font-size:18px; font-weight:700; color:#f44336;">-$11.06</div>
                  <div style="font-size:11px; color:#f44336;">-0.85%</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- MSFT -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
        <tr>
          <td style="background:#111; border:1px solid #222; border-radius:8px; padding:14px 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%">
                  <div style="font-size:18px; font-weight:700; color:#e0e0e0;">MSFT</div>
                  <div style="font-size:11px; color:rgba(255,255,255,0.35);">2 shares @ $517.15</div>
                </td>
                <td width="50%" style="text-align:right;">
                  <div style="font-size:18px; font-weight:700; color:#f44336;">-$248.82</div>
                  <div style="font-size:11px; color:#f44336;">-24.06%</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- The Experiment Section -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 24px 40px;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border:1px solid rgba(255,212,59,0.1); border-radius:12px; padding:28px;">
        <div style="font-size:11px; letter-spacing:0.2em; color:rgba(255,212,59,0.6); text-transform:uppercase; margin-bottom:12px;">What We Are Building</div>
        <div style="font-size:16px; color:rgba(255,255,255,0.85); line-height:1.7;">
          This is the <strong style="color:#FFD43B;">NAVADA AI Trading Lab</strong>, an experiment in fully autonomous AI-managed investing. Here is what makes it unique:
        </div>
        <div style="margin-top:16px; padding-left:16px; border-left:3px solid rgba(255,212,59,0.3);">
          <div style="font-size:14px; color:rgba(255,255,255,0.75); line-height:1.8; margin-bottom:8px;">
            <strong style="color:#e0e0e0;">&#9679; Built entirely by AI:</strong> Claude (Anthropic's AI agent) wrote every line of code, from the trading strategy to the API server to the dashboard panels.
          </div>
          <div style="font-size:14px; color:rgba(255,255,255,0.75); line-height:1.8; margin-bottom:8px;">
            <strong style="color:#e0e0e0;">&#9679; Autonomous execution:</strong> The bot analyses market data (MA Crossover + RSI-14), generates buy/sell signals, and executes trades on Alpaca's paper trading platform with zero human intervention.
          </div>
          <div style="font-size:14px; color:rgba(255,255,255,0.75); line-height:1.8; margin-bottom:8px;">
            <strong style="color:#e0e0e0;">&#9679; Real-time monitoring:</strong> Live portfolio data feeds into the WorldMonitor dashboard, giving a real-time view of positions, P&amp;L, and trading signals.
          </div>
          <div style="font-size:14px; color:rgba(255,255,255,0.75); line-height:1.8;">
            <strong style="color:#e0e0e0;">&#9679; The goal:</strong> Prove that AI can manage an end-to-end trading pipeline, from data ingestion to execution to reporting, while maintaining risk controls and transparency.
          </div>
        </div>
        <div style="margin-top:20px; font-size:13px; color:rgba(255,255,255,0.4); font-style:italic;">
          Started with $25.00 in paper money. Currently tracking SPY, QQQ, AAPL, MSFT, NVDA, KO, META. Strategy: MA Crossover (10/30) + RSI-14 with 3% stop-loss and 5% take-profit.
        </div>
      </div>
    </td>
  </tr>
</table>

<!-- Strategy Info -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 32px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <div style="background:#111; border:1px solid #222; border-radius:10px; padding:18px;">
              <div style="font-size:10px; letter-spacing:0.15em; color:rgba(255,255,255,0.35); text-transform:uppercase; margin-bottom:6px;">Strategy</div>
              <div style="font-size:13px; color:#e0e0e0;">MA Crossover (10/30) + RSI-14</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.35); margin-top:4px;">Stop-Loss: 3% | Take-Profit: 5%</div>
            </div>
          </td>
          <td width="50%" style="padding-left:8px;">
            <div style="background:#111; border:1px solid #222; border-radius:10px; padding:18px;">
              <div style="font-size:10px; letter-spacing:0.15em; color:rgba(255,255,255,0.35); text-transform:uppercase; margin-bottom:6px;">Next Execution</div>
              <div style="font-size:13px; color:#e0e0e0;">Mon 2 Mar, 15:45 UTC</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.35); margin-top:4px;">Pre-market scan: 14:15 UTC</div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505; border-top:1px solid #1a1a1a;">
  <tr>
    <td style="padding: 28px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:0.2em; color:rgba(255,255,255,0.25); text-transform:uppercase; margin-bottom:8px;">NAVADA AI Trading Lab</div>
      <div style="font-size:12px; color:rgba(255,255,255,0.3);">Paper trading via Alpaca Markets. No real capital at risk.</div>
      <div style="font-size:12px; color:rgba(255,255,255,0.3); margin-top:4px;">Built and managed by Claude (Anthropic) on the NAVADA home server.</div>
      <div style="margin-top:12px; font-size:11px; color:rgba(255,255,255,0.2);">28 February 2026</div>
    </td>
  </tr>
</table>

</body>
</html>`;

(async () => {
  try {
    await transporter.sendMail({
      from: '"NAVADA AI Trading Lab" <claude.navada@zohomail.eu>',
      to: 'clarity.tony@gmail.com',
      cc: 'leeakpareva@gmail.com',
      replyTo: 'lee@navada.info',
      subject: 'NAVADA Trading Lab: Live Portfolio Snapshot ($99,766 from $25)',
      html,
    });
    console.log('Portfolio snapshot sent to Tony (clarity.tony@gmail.com)');
  } catch (err) {
    console.error('Failed to send:', err.message);
  }
})();
