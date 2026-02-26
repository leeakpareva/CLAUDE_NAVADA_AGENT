"""
NAVADA Market Intelligence Pipeline
Scrapes global market data → PostgreSQL → Analysis → Email Report

Schedule: Daily 6 PM via Task Scheduler
Usage:
    py market-pipeline.py              # Full pipeline: scrape + analyze + email
    py market-pipeline.py --scrape     # Scrape only (store in DB)
    py market-pipeline.py --report     # Generate and send report from latest data
    py market-pipeline.py --test       # Save HTML report to file (no email)
"""

import sys, os, json, datetime, smtplib, io, base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# Add Automation to path for .env
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "Automation" / ".env")

import yfinance as yf
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import execute_values
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import requests

# ============================================================
# CONFIG
# ============================================================
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5433,
    "dbname": "navada",
    "user": "postgres",
    "password": os.getenv("POSTGRES_PASSWORD", "Navadaonline2026!"),
}

ASSETS = {
    # Major Indices
    "^FTSE":  {"name": "FTSE 100",     "category": "Index",     "flag": "🇬🇧"},
    "^GSPC":  {"name": "S&P 500",      "category": "Index",     "flag": "🇺🇸"},
    "^IXIC":  {"name": "NASDAQ",       "category": "Index",     "flag": "🇺🇸"},
    "^DJI":   {"name": "Dow Jones",    "category": "Index",     "flag": "🇺🇸"},
    "^N225":  {"name": "Nikkei 225",   "category": "Index",     "flag": "🇯🇵"},

    # AI / Tech Stocks
    "NVDA":   {"name": "NVIDIA",       "category": "AI Stock",  "flag": "🤖"},
    "MSFT":   {"name": "Microsoft",    "category": "AI Stock",  "flag": "🤖"},
    "GOOGL":  {"name": "Google",       "category": "AI Stock",  "flag": "🤖"},
    "META":   {"name": "Meta",         "category": "AI Stock",  "flag": "🤖"},
    "AMZN":   {"name": "Amazon",       "category": "AI Stock",  "flag": "🤖"},
    "TSM":    {"name": "TSMC",         "category": "AI Stock",  "flag": "🤖"},
    "ARM":    {"name": "ARM Holdings", "category": "AI Stock",  "flag": "🤖"},
    "PLTR":   {"name": "Palantir",     "category": "AI Stock",  "flag": "🤖"},

    # Currencies
    "GBPUSD=X": {"name": "GBP/USD",   "category": "Currency",  "flag": "💱"},
    "GBPEUR=X": {"name": "GBP/EUR",   "category": "Currency",  "flag": "💱"},
    "GBPNGN=X": {"name": "GBP/NGN",   "category": "Currency",  "flag": "🇳🇬"},

    # Crypto
    "BTC-USD": {"name": "Bitcoin",     "category": "Crypto",    "flag": "₿"},
    "ETH-USD": {"name": "Ethereum",    "category": "Crypto",    "flag": "⟠"},
    "SOL-USD": {"name": "Solana",      "category": "Crypto",    "flag": "◎"},

    # Commodities
    "GC=F":   {"name": "Gold",         "category": "Commodity", "flag": "🥇"},
    "CL=F":   {"name": "Crude Oil",    "category": "Commodity", "flag": "🛢️"},
    "NG=F":   {"name": "Natural Gas",  "category": "Commodity", "flag": "🔥"},
}

REPORT_DIR = Path(__file__).parent / "reports"
REPORT_DIR.mkdir(exist_ok=True)

# ============================================================
# DATABASE
# ============================================================
def get_db():
    return psycopg2.connect(**DB_CONFIG)

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS market_data (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(20) NOT NULL,
            name VARCHAR(100),
            category VARCHAR(30),
            date DATE NOT NULL,
            open NUMERIC(18,6),
            high NUMERIC(18,6),
            low NUMERIC(18,6),
            close NUMERIC(18,6),
            volume BIGINT,
            change_pct NUMERIC(10,4),
            scraped_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(ticker, date)
        );

        CREATE TABLE IF NOT EXISTS economic_indicators (
            id SERIAL PRIMARY KEY,
            indicator VARCHAR(100) NOT NULL,
            country VARCHAR(10),
            value NUMERIC(18,4),
            period VARCHAR(30),
            date DATE NOT NULL,
            source VARCHAR(50),
            scraped_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(indicator, country, date)
        );

        CREATE INDEX IF NOT EXISTS idx_market_date ON market_data(date);
        CREATE INDEX IF NOT EXISTS idx_market_ticker ON market_data(ticker);
        CREATE INDEX IF NOT EXISTS idx_econ_date ON economic_indicators(date);
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("Database tables initialized")

# ============================================================
# SCRAPE
# ============================================================
def scrape_markets():
    """Fetch market data from Yahoo Finance and store in PostgreSQL"""
    print("Scraping market data...")
    tickers = list(ASSETS.keys())
    data = yf.download(tickers, period="5d", group_by="ticker", progress=False, threads=True)

    rows = []
    today = datetime.date.today()

    for ticker, info in ASSETS.items():
        try:
            if len(tickers) > 1:
                df = data[ticker] if ticker in data.columns.get_level_values(0) else None
            else:
                df = data

            if df is None or df.empty:
                print(f"  No data for {ticker}")
                continue

            df = df.dropna()
            for date_idx, row in df.iterrows():
                dt = date_idx.date() if hasattr(date_idx, 'date') else date_idx
                prev_close = df['Close'].shift(1).loc[date_idx]
                change_pct = ((row['Close'] - prev_close) / prev_close * 100) if pd.notna(prev_close) and prev_close != 0 else 0

                rows.append((
                    ticker, info["name"], info["category"], dt,
                    float(row.get('Open', 0)), float(row.get('High', 0)),
                    float(row.get('Low', 0)), float(row['Close']),
                    int(row.get('Volume', 0)) if pd.notna(row.get('Volume', 0)) else 0,
                    round(float(change_pct), 4),
                ))
        except Exception as e:
            print(f"  Error processing {ticker}: {e}")

    if not rows:
        print("No data scraped")
        return 0

    conn = get_db()
    cur = conn.cursor()
    execute_values(cur, """
        INSERT INTO market_data (ticker, name, category, date, open, high, low, close, volume, change_pct)
        VALUES %s
        ON CONFLICT (ticker, date) DO UPDATE SET
            close = EXCLUDED.close, high = EXCLUDED.high, low = EXCLUDED.low,
            volume = EXCLUDED.volume, change_pct = EXCLUDED.change_pct, scraped_at = NOW()
    """, rows)
    conn.commit()
    cur.close()
    conn.close()
    print(f"  Stored {len(rows)} market data points")
    return len(rows)

def scrape_economic_indicators():
    """Fetch key economic indicators"""
    print("Scraping economic indicators...")
    indicators = []
    today = datetime.date.today()

    # UK/US 10-year bond yields as proxy for economic health
    for ticker, country, name in [("^TNX", "US", "10Y Treasury Yield"), ("^FVX", "US", "5Y Treasury Yield")]:
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="5d")
            if not hist.empty:
                latest = hist.iloc[-1]
                indicators.append((name, country, float(latest['Close']), "latest", today, "Yahoo Finance"))
        except Exception as e:
            print(f"  Error fetching {name}: {e}")

    if indicators:
        conn = get_db()
        cur = conn.cursor()
        execute_values(cur, """
            INSERT INTO economic_indicators (indicator, country, value, period, date, source)
            VALUES %s
            ON CONFLICT (indicator, country, date) DO UPDATE SET value = EXCLUDED.value, scraped_at = NOW()
        """, indicators)
        conn.commit()
        cur.close()
        conn.close()
        print(f"  Stored {len(indicators)} economic indicators")

    return len(indicators)

# ============================================================
# ANALYSIS
# ============================================================
def analyze():
    """Pull latest data from DB and generate analysis"""
    conn = get_db()

    # Latest prices
    df = pd.read_sql("""
        SELECT DISTINCT ON (ticker) ticker, name, category, date, close, change_pct
        FROM market_data
        ORDER BY ticker, date DESC
    """, conn)

    # 5-day history for sparklines
    hist = pd.read_sql("""
        SELECT ticker, date, close FROM market_data
        WHERE date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY ticker, date
    """, conn)

    # Economic indicators
    econ = pd.read_sql("""
        SELECT DISTINCT ON (indicator, country) indicator, country, value, date
        FROM economic_indicators
        ORDER BY indicator, country, date DESC
    """, conn)

    conn.close()

    return {
        "latest": df,
        "history": hist,
        "economic": econ,
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
    }

# ============================================================
# CHARTS
# ============================================================
def make_sparkline(values, color="#22c55e", width=120, height=30):
    """Generate a tiny inline sparkline chart as base64 PNG"""
    if len(values) < 2:
        return ""

    fig, ax = plt.subplots(figsize=(width/80, height/80), dpi=80)
    ax.plot(range(len(values)), values, color=color, linewidth=1.5)
    ax.fill_between(range(len(values)), values, alpha=0.1, color=color)
    ax.axis('off')
    ax.margins(0.05)
    fig.patch.set_alpha(0)
    ax.patch.set_alpha(0)

    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close(fig)
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.read()).decode()}"

def make_sector_chart(df):
    """Sector performance bar chart"""
    categories = df.groupby('category')['change_pct'].mean().sort_values()
    if categories.empty:
        return ""

    fig, ax = plt.subplots(figsize=(5, 2.5), dpi=100)
    colors = ['#ef4444' if v < 0 else '#22c55e' for v in categories.values]
    bars = ax.barh(categories.index, categories.values, color=colors, height=0.6)
    ax.set_xlabel('Avg Change %', fontsize=9, color='#888')
    ax.tick_params(colors='#888', labelsize=8)
    ax.set_facecolor('#111')
    fig.patch.set_facecolor('#111')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_color('#333')
    ax.spines['left'].set_color('#333')
    ax.axvline(x=0, color='#333', linewidth=0.5)

    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.read()).decode()}"

# ============================================================
# HTML REPORT
# ============================================================
def build_html(analysis):
    latest = analysis["latest"]
    history = analysis["history"]
    generated = analysis["generated_at"]

    # Group by category
    categories = latest.groupby("category")

    sections = []
    for cat, group in categories:
        rows_html = ""
        for _, row in group.iterrows():
            ticker = row["ticker"]
            pct = row["change_pct"]
            color = "#22c55e" if pct >= 0 else "#ef4444"
            arrow = "▲" if pct >= 0 else "▼"
            flag = ASSETS.get(ticker, {}).get("flag", "")

            # Sparkline
            ticker_hist = history[history["ticker"] == ticker]["close"].values
            spark = make_sparkline(ticker_hist, color)
            spark_img = f'<img src="{spark}" style="vertical-align:middle;height:20px;margin-left:8px">' if spark else ""

            rows_html += f"""
                <tr>
                    <td style="padding:6px 12px 6px 0;color:#ccc;font-size:13px">{flag} {row['name']}</td>
                    <td style="padding:6px 12px;color:#fff;text-align:right;font-size:13px;font-weight:bold">{row['close']:,.2f}</td>
                    <td style="padding:6px 12px;color:{color};text-align:right;font-size:13px">{arrow} {abs(pct):.2f}%</td>
                    <td style="padding:6px 0">{spark_img}</td>
                </tr>"""

        sections.append(f"""
            <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:16px">
                <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">{cat}</h3>
                <table style="width:100%">{rows_html}</table>
            </div>""")

    # Sector chart
    sector_img = make_sector_chart(latest)
    sector_section = ""
    if sector_img:
        sector_section = f"""
            <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:16px">
                <h3 style="color:#fff;font-size:14px;margin:0 0 8px 0">Sector Performance</h3>
                <img src="{sector_img}" style="width:100%;max-width:500px">
            </div>"""

    # Top movers
    top_gainers = latest.nlargest(3, "change_pct")
    top_losers = latest.nsmallest(3, "change_pct")

    movers_html = '<div style="display:flex;gap:16px;margin-bottom:16px">'
    movers_html += '<div style="flex:1;background:#111;border:1px solid #333;border-radius:8px;padding:16px">'
    movers_html += '<h3 style="color:#22c55e;font-size:13px;margin:0 0 8px 0">TOP GAINERS</h3>'
    for _, r in top_gainers.iterrows():
        movers_html += f'<div style="color:#ccc;font-size:12px;padding:2px 0">{r["name"]} <span style="color:#22c55e;float:right">+{r["change_pct"]:.2f}%</span></div>'
    movers_html += '</div>'
    movers_html += '<div style="flex:1;background:#111;border:1px solid #333;border-radius:8px;padding:16px">'
    movers_html += '<h3 style="color:#ef4444;font-size:13px;margin:0 0 8px 0">TOP LOSERS</h3>'
    for _, r in top_losers.iterrows():
        movers_html += f'<div style="color:#ccc;font-size:12px;padding:2px 0">{r["name"]} <span style="color:#ef4444;float:right">{r["change_pct"]:.2f}%</span></div>'
    movers_html += '</div></div>'

    html = f"""
    <div style="font-family:'Courier New',monospace;max-width:640px;margin:0 auto;background:#0a0a0a;padding:32px;border:1px solid #222;border-radius:8px">
        <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">NAVADA MARKET INTELLIGENCE</h1>
            <p style="color:#666;font-size:12px;margin:4px 0">{generated} | {len(latest)} assets tracked</p>
        </div>

        {movers_html}
        {sector_section}
        {''.join(sections)}

        <div style="text-align:center;color:#333;font-size:11px;margin-top:24px">
            NAVADA Market Pipeline • Data from Yahoo Finance
        </div>
    </div>"""

    return html

# ============================================================
# EMAIL
# ============================================================
def send_report(html):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"NAVADA Market Intelligence — {datetime.date.today()}"
    msg["From"] = os.getenv("ZOHO_USER", "claude.navada@zohomail.eu")
    msg["To"] = "leeakpareva@gmail.com"
    msg["Cc"] = os.getenv("ZOHO_USER", "")
    msg.attach(MIMEText(f'<html><body style="background:#000;padding:20px">{html}</body></html>', "html"))

    try:
        with smtplib.SMTP_SSL("smtp.zoho.eu", 465) as server:
            server.login(os.getenv("ZOHO_USER"), os.getenv("ZOHO_APP_PASSWORD"))
            server.send_message(msg)
        print("Market report sent to leeakpareva@gmail.com")
    except Exception as e:
        # Fallback to Gmail
        try:
            msg.replace_header("From", os.getenv("GMAIL_USER"))
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(os.getenv("GMAIL_USER"), os.getenv("GMAIL_APP_PASSWORD"))
                server.send_message(msg)
            print("Market report sent via Gmail fallback")
        except Exception as e2:
            print(f"Email failed: {e2}")

# ============================================================
# MAIN
# ============================================================
def run_pipeline():
    print(f"\n{'='*50}")
    print(f"NAVADA Market Pipeline — {datetime.datetime.now()}")
    print(f"{'='*50}\n")

    init_db()
    scrape_markets()
    scrape_economic_indicators()
    analysis = analyze()
    html = build_html(analysis)

    # Save local copy
    report_path = REPORT_DIR / f"market-{datetime.date.today()}.html"
    report_path.write_text(f'<html><body style="background:#000;padding:20px">{html}</body></html>', encoding='utf-8')
    print(f"Report saved: {report_path}")

    send_report(html)

if __name__ == "__main__":
    args = sys.argv[1:]

    if "--scrape" in args:
        init_db()
        scrape_markets()
        scrape_economic_indicators()
    elif "--report" in args:
        analysis = analyze()
        html = build_html(analysis)
        send_report(html)
    elif "--test" in args:
        init_db()
        scrape_markets()
        scrape_economic_indicators()
        analysis = analyze()
        html = build_html(analysis)
        report_path = REPORT_DIR / f"market-{datetime.date.today()}.html"
        report_path.write_text(f'<html><body style="background:#000;padding:20px">{html}</body></html>', encoding='utf-8')
        print(f"Test report saved: {report_path}")
    else:
        run_pipeline()
