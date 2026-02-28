"""
NAVADA AI Trading Lab — Pre-Market Plan Email
Runs at 2:15 PM UK (before US market open at 2:30 PM).
Analyses all symbols, generates trading plan, emails to Lee.
"""

import sys
import smtplib
from pathlib import Path
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import SYMBOLS, ZOHO_USER, ZOHO_APP_PASSWORD, REPORT_TO, STARTING_CAPITAL
from src.logger_setup import get_logger
from src.market_data import get_daily_bars, get_latest_price
from src.strategy import analyse
from src.executor import get_account, get_positions
from src.risk_manager import evaluate_buy

log = get_logger('premarket')


def generate_plan():
    """Analyse all symbols and build a trading plan."""
    log.info('Generating pre-market trading plan...')

    account = get_account()
    if not account:
        log.error('Cannot connect to Alpaca')
        return None

    equity = float(account.equity)
    cash = float(account.cash)
    positions = get_positions()

    # Analyse each symbol
    analyses = []
    for symbol in SYMBOLS:
        df = get_daily_bars(symbol)
        if df is None:
            analyses.append({'symbol': symbol, 'signal': None, 'error': 'No data'})
            continue

        signal = analyse(symbol, df)
        price = get_latest_price(symbol)

        analyses.append({
            'symbol': symbol,
            'signal': signal,
            'price': price,
        })

    # Build plan
    buys = [a for a in analyses if a.get('signal') and a['signal'].action == 'BUY']
    sells = [a for a in analyses if a.get('signal') and a['signal'].action == 'SELL']
    holds = [a for a in analyses if a.get('signal') and a['signal'].action == 'HOLD']

    return {
        'equity': equity,
        'cash': cash,
        'positions': positions,
        'analyses': analyses,
        'buys': buys,
        'sells': sells,
        'holds': holds,
    }


def build_plan_email(plan):
    """Build the visual pre-market plan email."""
    today = datetime.now().strftime('%A %d %B %Y')
    date_short = datetime.now().strftime('%Y-%m-%d')

    # Position rows
    pos_rows = ''
    for p in plan['positions']:
        pl = float(p.unrealized_pl)
        pl_color = '#4caf50' if pl >= 0 else '#f44336'
        plpc = float(p.unrealized_plpc) * 100
        pos_rows += f'''
        <tr>
            <td style="padding:8px 12px; font-size:13px; color:#fff; border-bottom:1px solid #222;">{p.symbol}</td>
            <td style="padding:8px 12px; font-size:13px; color:#888; border-bottom:1px solid #222;">{float(p.qty):.2f}</td>
            <td style="padding:8px 12px; font-size:13px; color:#888; border-bottom:1px solid #222;">${float(p.avg_entry_price):.2f}</td>
            <td style="padding:8px 12px; font-size:13px; color:#888; border-bottom:1px solid #222;">${float(p.current_price):.2f}</td>
            <td style="padding:8px 12px; font-size:13px; color:{pl_color}; border-bottom:1px solid #222; font-weight:700;">${pl:+.2f} ({plpc:+.1f}%)</td>
        </tr>'''
    if not pos_rows:
        pos_rows = '<tr><td colspan="5" style="padding:12px; color:#666; text-align:center;">No open positions</td></tr>'

    # Signal cards
    signal_cards = ''
    for a in plan['analyses']:
        sig = a.get('signal')
        if not sig:
            signal_cards += f'''
            <div style="background:#111; border:1px solid #222; border-radius:8px; padding:14px; margin-bottom:8px;">
                <span style="font-size:14px; font-weight:700; color:#666;">{a['symbol']}</span>
                <span style="font-size:12px; color:#555; margin-left:12px;">No data available</span>
            </div>'''
            continue

        if sig.action == 'BUY':
            badge_bg = '#0f1a0f'; badge_border = '#1a3a1a'; badge_color = '#4caf50'
        elif sig.action == 'SELL':
            badge_bg = '#1a0f0f'; badge_border = '#3a1a1a'; badge_color = '#f44336'
        else:
            badge_bg = '#111'; badge_border = '#222'; badge_color = '#888'

        signal_cards += f'''
        <div style="background:{badge_bg}; border:1px solid {badge_border}; border-radius:8px; padding:14px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; margin-bottom:6px;">
                <span style="font-size:14px; font-weight:700; color:#fff;">{sig.symbol}</span>
                <span style="font-size:11px; font-weight:700; color:{badge_color}; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px; margin-left:10px;">{sig.action}</span>
                <span style="font-size:12px; color:#888; margin-left:auto;">${sig.current_price:.2f}</span>
            </div>
            <div style="font-size:12px; color:#999; line-height:1.6;">{sig.reasoning}</div>
            <div style="font-size:11px; color:#555; margin-top:6px;">RSI: {sig.rsi:.1f} | {10}MA: ${sig.fast_ma:.2f} | {30}MA: ${sig.slow_ma:.2f}</div>
        </div>'''

    # Action plan summary
    plan_summary = ''
    if plan['buys']:
        buy_names = ', '.join(a['signal'].symbol for a in plan['buys'])
        plan_summary += f'<div style="color:#4caf50; font-size:14px; margin-bottom:8px;">BUY: {buy_names}</div>'
    if plan['sells']:
        sell_names = ', '.join(a['signal'].symbol for a in plan['sells'])
        plan_summary += f'<div style="color:#f44336; font-size:14px; margin-bottom:8px;">SELL: {sell_names}</div>'
    if not plan['buys'] and not plan['sells']:
        plan_summary = '<div style="color:#FFD43B; font-size:14px;">HOLD — No crossover signals detected. Monitoring positions.</div>'

    subject = f'NAVADA Trading Plan — {date_short}'

    html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellspacing="0" cellpadding="0" style="background:#000;">
  <tr><td style="padding:24px 32px;">
    <span style="font-size:20px; font-weight:800; color:#fff; letter-spacing:0.15em;">NAVADA</span>
    <span style="font-size:11px; color:#666; letter-spacing:0.1em; margin-left:12px;">AI TRADING LAB</span>
  </td></tr>
</table>

<table width="100%" cellspacing="0" cellpadding="0" style="background:#111; border-bottom:1px solid #222;">
  <tr><td style="padding:10px 32px;">
    <span style="font-size:11px; color:#888;">{today} &middot; Pre-Market Trading Plan</span>
  </td></tr>
</table>

<!-- Account Status -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:24px 32px 16px 32px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width:33%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Equity</div>
            <div style="font-size:24px; font-weight:900; color:#FFD43B; margin-top:4px;">${plan['equity']:,.2f}</div>
          </div>
        </td>
        <td style="width:33%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Cash Available</div>
            <div style="font-size:24px; font-weight:900; color:#306998; margin-top:4px;">${plan['cash']:,.2f}</div>
          </div>
        </td>
        <td style="width:33%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Open Positions</div>
            <div style="font-size:24px; font-weight:900; color:#e07030; margin-top:4px;">{len(plan['positions'])}</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- Today's Plan -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 16px 32px;">
    <div style="background:#111; border:1px solid #FFD43B; border-radius:8px; padding:18px 20px;">
      <div style="font-size:11px; color:#FFD43B; letter-spacing:0.15em; text-transform:uppercase; font-weight:700; margin-bottom:10px;">Today's Action Plan</div>
      {plan_summary}
    </div>
  </td></tr>
</table>

<!-- Current Positions -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 16px 32px;">
    <div style="font-size:11px; color:#FFD43B; letter-spacing:0.1em; text-transform:uppercase; font-weight:700; margin-bottom:8px;">Current Positions</div>
    <table width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <thead><tr>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Symbol</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Qty</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Entry</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Current</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">P&L</th>
      </tr></thead>
      <tbody>{pos_rows}</tbody>
    </table>
  </td></tr>
</table>

<!-- Signal Analysis -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 20px 32px;">
    <div style="font-size:11px; color:#FFD43B; letter-spacing:0.1em; text-transform:uppercase; font-weight:700; margin-bottom:8px;">Signal Analysis</div>
    {signal_cards}
  </td></tr>
</table>

<!-- Risk -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 24px 32px;">
    <div style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px; padding:14px 20px;">
      <span style="font-size:11px; color:#6aaa4f; letter-spacing:0.1em; text-transform:uppercase; font-weight:700;">Risk Controls Active</span>
      <span style="font-size:11px; color:#888; margin-left:16px;">Stop-loss: 3% | Take-profit: 5% | Max 2 positions | No leverage | Volatility circuit breaker</span>
    </div>
  </td></tr>
</table>

<table width="100%" cellspacing="0" cellpadding="0" style="background:#000; border-top:1px solid #222;">
  <tr><td style="padding:16px 32px;">
    <div style="font-size:10px; color:#555;">
      NAVADA AI Trading Lab &middot; Paper Trading Only &middot; Not Investment Advice<br>
      Pre-market plan generated autonomously by Claude &middot; Execution at 3:45 PM UK
    </div>
  </td></tr>
</table>

</body></html>'''

    return subject, html


def send_premarket_plan():
    """Generate and email the pre-market trading plan."""
    try:
        plan = generate_plan()
        if not plan:
            log.error('Failed to generate plan')
            return False

        subject, html = build_plan_email(plan)

        msg = MIMEMultipart('alternative')
        msg['From'] = f'Claude | NAVADA Trading <{ZOHO_USER}>'
        msg['To'] = REPORT_TO
        msg['Subject'] = subject
        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP_SSL('smtp.zoho.eu', 465) as server:
            server.login(ZOHO_USER, ZOHO_APP_PASSWORD)
            server.send_message(msg)

        log.info(f'Pre-market plan sent to {REPORT_TO}')
        return True

    except Exception as e:
        log.error(f'Failed to send pre-market plan: {e}')
        return False


if __name__ == '__main__':
    send_premarket_plan()
