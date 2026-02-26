import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

GMAIL_USER = "leeakpareva@gmail.com"
GMAIL_APP_PASSWORD = "wkoklwaifbbjnmov"
RECIPIENT = "leeakpareva@gmail.com"

def bar(label, uk_val, us_val, max_val, uk_color="#3b82f6", us_color="#ef4444"):
    uk_pct = int((uk_val / max_val) * 100)
    us_pct = int((us_val / max_val) * 100)
    return f"""
    <div style="margin-bottom:20px;">
      <p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 8px;">{label}</p>
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <span style="color:#93c5fd;font-size:12px;width:30px;min-width:30px;">UK</span>
        <div style="flex:1;background:#1e293b;border-radius:6px;height:28px;overflow:hidden;">
          <div style="width:{uk_pct}%;background:{uk_color};height:28px;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;">
            <span style="color:white;font-size:13px;font-weight:700;">{uk_val}%</span>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;">
        <span style="color:#fca5a5;font-size:12px;width:30px;min-width:30px;">US</span>
        <div style="flex:1;background:#1e293b;border-radius:6px;height:28px;overflow:hidden;">
          <div style="width:{us_pct}%;background:{us_color};height:28px;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;">
            <span style="color:white;font-size:13px;font-weight:700;">{us_val}%</span>
          </div>
        </div>
      </div>
    </div>
    """

def gauge(label, value, subtitle, color):
    return f"""
    <div style="background:#1e293b;border-radius:12px;padding:20px;text-align:center;flex:1;min-width:140px;">
      <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">{label}</p>
      <p style="color:{color};font-size:38px;font-weight:800;margin:0;line-height:1;">{value}</p>
      <p style="color:#64748b;font-size:11px;margin:6px 0 0;">{subtitle}</p>
    </div>
    """

def build_report():
    date = datetime.now().strftime("%A %d %B %Y")
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:700px;margin:0 auto;padding:20px;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);padding:36px;border-radius:16px;margin-bottom:24px;border:1px solid #1e3a5f;">
    <h1 style="margin:0;font-size:28px;color:#f1f5f9;letter-spacing:-0.5px;">UK vs US Economy</h1>
    <p style="margin:6px 0 0;color:#60a5fa;font-size:14px;font-weight:500;">Employment & Growth Trajectory Report</p>
    <p style="margin:4px 0 0;color:#475569;font-size:12px;">{date}</p>
  </div>

  <!-- HEADLINE GAUGES -->
  <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
    {gauge("UK GDP Growth", "1.2%", "Avg forecast 2026", "#60a5fa")}
    {gauge("US GDP Growth", "2.2%", "Avg forecast 2026", "#f87171")}
    {gauge("UK Unemployment", "5.2%", "Up from 4.4%", "#fbbf24")}
    {gauge("US Unemployment", "4.6%", "Up from 4.1%", "#fbbf24")}
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #1e293b;">
    <h2 style="color:#f1f5f9;font-size:17px;margin:0 0 12px;border-bottom:1px solid #1e293b;padding-bottom:10px;">Executive Summary</h2>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.8;margin:0;">
      Both economies face a <span style="color:#fbbf24;font-weight:700;">challenging 2026</span> with slowing growth and softening labour markets.
      The UK grows at roughly <span style="color:#60a5fa;font-weight:700;">half the pace of the US</span>.
      Unemployment is rising in both — UK hit <span style="color:#fbbf24;font-weight:700;">5.2%</span> vs US at <span style="color:#fbbf24;font-weight:700;">4.6%</span>.
      Government strategies diverge sharply: UK bets on <span style="color:#60a5fa;font-weight:700;">green jobs &amp; skills</span>,
      US pursues <span style="color:#f87171;font-weight:700;">workforce consolidation &amp; federal restructuring</span>.
    </p>
  </div>

  <!-- BAR CHARTS: GDP -->
  <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #1e293b;">
    <h2 style="color:#f1f5f9;font-size:17px;margin:0 0 20px;border-bottom:1px solid #1e293b;padding-bottom:10px;">GDP Growth Forecasts — 2026</h2>
    {bar("IMF Forecast", 1.3, 2.1, 3.0)}
    {bar("Goldman Sachs", 1.4, 2.5, 3.0)}
    {bar("OECD", 1.2, 2.2, 3.0)}
    {bar("EY / Deloitte", 0.9, 1.8, 3.0)}
    <div style="display:flex;gap:16px;margin-top:16px;">
      <div style="flex:1;background:#0f172a;border-radius:8px;padding:12px;text-align:center;border:1px solid #1e40af;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">UK AVERAGE</p>
        <p style="color:#60a5fa;font-size:24px;font-weight:800;margin:4px 0 0;">1.2%</p>
      </div>
      <div style="flex:1;background:#0f172a;border-radius:8px;padding:12px;text-align:center;border:1px solid #991b1b;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">US AVERAGE</p>
        <p style="color:#f87171;font-size:24px;font-weight:800;margin:4px 0 0;">2.2%</p>
      </div>
    </div>
  </div>

  <!-- BAR CHARTS: EMPLOYMENT -->
  <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #1e293b;">
    <h2 style="color:#f1f5f9;font-size:17px;margin:0 0 20px;border-bottom:1px solid #1e293b;padding-bottom:10px;">Employment Metrics</h2>
    {bar("Unemployment Rate", 5.2, 4.6, 8.0, "#fbbf24", "#fb923c")}
    {bar("Inflation (CPI)", 2.8, 2.7, 5.0, "#a78bfa", "#c084fc")}
    {bar("Employment Rate", 75.1, 60.4, 100.0, "#34d399", "#2dd4bf")}

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-top:16px;border:1px solid #1e293b;">
      <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Monthly Job Creation</p>
      <div style="display:flex;gap:16px;">
        <div style="flex:1;text-align:center;">
          <p style="color:#60a5fa;font-size:11px;margin:0;">UK Net Outlook</p>
          <p style="color:#60a5fa;font-size:22px;font-weight:800;margin:4px 0 0;">+13%</p>
          <p style="color:#34d399;font-size:10px;margin:2px 0 0;">&#9650; improving</p>
        </div>
        <div style="flex:1;text-align:center;">
          <p style="color:#f87171;font-size:11px;margin:0;">US Jobs/Month</p>
          <p style="color:#f87171;font-size:22px;font-weight:800;margin:4px 0 0;">55.2k</p>
          <p style="color:#fbbf24;font-size:10px;margin:2px 0 0;">&#9660; weakest since 2019</p>
        </div>
      </div>
    </div>
  </div>

  <!-- UK STRATEGY -->
  <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #1e3a5f;border-left:4px solid #3b82f6;">
    <h2 style="color:#60a5fa;font-size:17px;margin:0 0 16px;">&#127468;&#127463; UK Government Strategy</h2>

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="color:#93c5fd;font-size:14px;margin:0 0 6px;">"Get Britain Working"</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Flagship programme targeting <span style="color:#fbbf24;font-weight:600;">9.4M economically inactive</span> people.
        Reforming welfare, NHS investment to return long-term sick to work, local jobs partnerships.
      </p>
    </div>

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="color:#93c5fd;font-size:14px;margin:0 0 6px;">Clean Energy Jobs Plan</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Target: <span style="color:#34d399;font-weight:600;">400,000+ new jobs by 2030</span>.
        Doubling clean energy employment to 860k. Wind, solar, nuclear, green hydrogen.
      </p>
    </div>

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="color:#93c5fd;font-size:14px;margin:0 0 6px;">AI & Skills Investment</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Prioritising AI adoption training. Cybersecurity sector growing <span style="color:#34d399;font-weight:600;">35% by 2031</span>.
        Youth employment programmes expanding.
      </p>
    </div>

    <div style="background:#0f172a;border-radius:8px;padding:16px;">
      <h3 style="color:#93c5fd;font-size:14px;margin:0 0 6px;">Regulatory Reform</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Stripping complexity across tax, regulation &amp; employment policy.
        Lower business costs to drive innovation and hiring.
      </p>
    </div>
  </div>

  <!-- US STRATEGY -->
  <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #3b1c1c;border-left:4px solid #ef4444;">
    <h2 style="color:#f87171;font-size:17px;margin:0 0 16px;">&#127482;&#127480; US Government Strategy</h2>

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="color:#fca5a5;font-size:14px;margin:0 0 6px;">"Make America Skilled Again" (MASA)</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Consolidating <span style="color:#fbbf24;font-weight:600;">11 federal programmes into 1 flexible grant</span>.
        Unified system under Dept of Labor. Streamlined eligibility &amp; service delivery.
      </p>
    </div>

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="color:#fca5a5;font-size:14px;margin:0 0 6px;">Federal Workforce Overhaul</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        <span style="color:#fbbf24;font-weight:600;">~50,000 employees reclassified</span> — losing job protections &amp; appeal rights.
        Agencies limiting hiring. Merit-based recruitment prioritised.
      </p>
    </div>

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="color:#fca5a5;font-size:14px;margin:0 0 6px;">Tariff & Trade Impact</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        2025 tariff hikes partially offset GDP growth. Reconciliation act boosts 2026 output,
        but immigration enforcement &amp; trade uncertainty create <span style="color:#fbbf24;font-weight:600;">labour supply headwinds</span>.
      </p>
    </div>

    <div style="background:#0f172a;border-radius:8px;padding:16px;">
      <h3 style="color:#fca5a5;font-size:14px;margin:0 0 6px;">Growth Sectors</h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Healthcare, AI/tech, clean energy, cybersecurity — fastest-growing.
        Federal investment shifting to <span style="color:#34d399;font-weight:600;">skills-based over degree-based</span> hiring.
      </p>
    </div>
  </div>

  <!-- HEAD TO HEAD -->
  <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #1e293b;">
    <h2 style="color:#f1f5f9;font-size:17px;margin:0 0 16px;border-bottom:1px solid #1e293b;padding-bottom:10px;">Head-to-Head Comparison</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr>
        <th style="padding:10px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:1px solid #1e293b;">Metric</th>
        <th style="padding:10px;text-align:center;color:#60a5fa;font-size:11px;border-bottom:1px solid #1e293b;">UK &#127468;&#127463;</th>
        <th style="padding:10px;text-align:center;color:#f87171;font-size:11px;border-bottom:1px solid #1e293b;">US &#127482;&#127480;</th>
      </tr>
      <tr><td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #0f172a;">Unemployment</td><td style="padding:10px;text-align:center;color:#60a5fa;font-weight:700;border-bottom:1px solid #0f172a;">5.2%</td><td style="padding:10px;text-align:center;color:#f87171;font-weight:700;border-bottom:1px solid #0f172a;">4.6%</td></tr>
      <tr><td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #0f172a;">GDP Growth</td><td style="padding:10px;text-align:center;color:#60a5fa;font-weight:700;border-bottom:1px solid #0f172a;">1.2%</td><td style="padding:10px;text-align:center;color:#f87171;font-weight:700;border-bottom:1px solid #0f172a;">2.2%</td></tr>
      <tr><td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #0f172a;">Inflation</td><td style="padding:10px;text-align:center;color:#60a5fa;font-weight:700;border-bottom:1px solid #0f172a;">~2.8%</td><td style="padding:10px;text-align:center;color:#f87171;font-weight:700;border-bottom:1px solid #0f172a;">2.7%</td></tr>
      <tr><td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #0f172a;">Jobs Strategy</td><td style="padding:10px;text-align:center;color:#60a5fa;font-weight:700;border-bottom:1px solid #0f172a;">Get Britain Working</td><td style="padding:10px;text-align:center;color:#f87171;font-weight:700;border-bottom:1px solid #0f172a;">MASA</td></tr>
      <tr><td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #0f172a;">Big Bet</td><td style="padding:10px;text-align:center;color:#60a5fa;font-weight:700;border-bottom:1px solid #0f172a;">Clean Energy 400k</td><td style="padding:10px;text-align:center;color:#f87171;font-weight:700;border-bottom:1px solid #0f172a;">Skills Reform</td></tr>
      <tr><td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #0f172a;">Key Risk</td><td style="padding:10px;text-align:center;color:#fbbf24;font-weight:700;border-bottom:1px solid #0f172a;">NI hike + weak demand</td><td style="padding:10px;text-align:center;color:#fbbf24;font-weight:700;border-bottom:1px solid #0f172a;">Tariffs + fed cuts</td></tr>
      <tr><td style="padding:10px;color:#cbd5e1;">Outlook</td><td style="padding:10px;text-align:center;color:#fbbf24;font-weight:700;">&#9679; Cautious</td><td style="padding:10px;text-align:center;color:#fb923c;font-weight:700;">&#9679; Mixed</td></tr>
    </table>
  </div>

  <!-- KEY TAKEAWAYS -->
  <div style="background:linear-gradient(135deg,#0f172a,#1a1a2e);border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #2563eb;">
    <h2 style="color:#60a5fa;font-size:17px;margin:0 0 14px;">Key Takeaways</h2>
    <div style="font-size:13px;color:#cbd5e1;line-height:1.9;">
      <p style="margin:0 0 10px;padding-left:20px;position:relative;">
        <span style="color:#3b82f6;font-weight:800;position:absolute;left:0;">01</span>
        US growing <span style="color:#fbbf24;font-weight:600;">nearly 2x faster</span> than UK but both underperform historical averages.
      </p>
      <p style="margin:0 0 10px;padding-left:20px;position:relative;">
        <span style="color:#3b82f6;font-weight:800;position:absolute;left:0;">02</span>
        UK's biggest drag: <span style="color:#fbbf24;font-weight:600;">National Insurance hike</span> increasing cost of hiring. US equivalent: <span style="color:#fbbf24;font-weight:600;">tariff uncertainty</span>.
      </p>
      <p style="margin:0 0 10px;padding-left:20px;position:relative;">
        <span style="color:#3b82f6;font-weight:800;position:absolute;left:0;">03</span>
        UK bets on <span style="color:#34d399;font-weight:600;">green energy jobs</span> (long-term). US consolidates programmes but <span style="color:#f87171;font-weight:600;">cuts federal headcount</span>.
      </p>
      <p style="margin:0 0 10px;padding-left:20px;position:relative;">
        <span style="color:#3b82f6;font-weight:800;position:absolute;left:0;">04</span>
        Both see <span style="color:#34d399;font-weight:600;">AI, cybersecurity &amp; healthcare</span> as strongest employment growth through 2030.
      </p>
      <p style="margin:0;padding-left:20px;position:relative;">
        <span style="color:#3b82f6;font-weight:800;position:absolute;left:0;">05</span>
        Employment likely <span style="color:#fbbf24;font-weight:600;">stabilises H2 2026</span> in both — recovery depends on policy certainty &amp; business confidence.
      </p>
    </div>
  </div>

  <!-- SOURCES -->
  <div style="background:#111827;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #1e293b;">
    <h2 style="color:#64748b;font-size:14px;margin:0 0 10px;">Sources</h2>
    <p style="color:#475569;font-size:11px;line-height:2;margin:0;">
      Goldman Sachs UK &amp; US GDP Forecasts (Feb 2026) &bull;
      EY ITEM Club Winter Forecast &bull;
      CBI 2026 Policy Priorities &bull;
      House of Commons Library - Labour Market Statistics &bull;
      GOV.UK - Get Britain Working Jan 2026 &bull;
      Congressional Budget Office - Outlook 2026-2036 &bull;
      Stanford SIEPR - US Economy 2026 &bull;
      Federal Reserve - Gov. Waller Speech Feb 2026 &bull;
      OPM Merit Hiring Plan &bull;
      Deloitte US Economic Forecast
    </p>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center;color:#334155;font-size:11px;padding:16px;">
    Generated by Claude Code &bull; Alex's Automation Suite &bull; {date}
  </div>

</div>
</body>
</html>
"""

def send_report():
    print("Building UK vs US Economy Report (Dark Dashboard)...")
    html = build_report()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"UK vs US Economy | Employment & Growth Dashboard | {datetime.now().strftime('%d %b %Y')}"
    msg["From"] = f'"Economy Report Bot" <{GMAIL_USER}>'
    msg["To"] = RECIPIENT
    msg.attach(MIMEText(html, "html"))

    print("Sending email...")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, RECIPIENT, msg.as_string())

    print(f"Report sent to {RECIPIENT}")

if __name__ == "__main__":
    send_report()
