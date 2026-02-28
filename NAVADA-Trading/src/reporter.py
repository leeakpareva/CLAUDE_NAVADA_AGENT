"""
NAVADA AI Trading Lab — Reporting Engine
Sends institutional-style daily trading reports via email.
"""

import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from src.config import ZOHO_USER, ZOHO_APP_PASSWORD, REPORT_TO
from src.executor import get_trade_ledger, get_positions, get_account
from src.portfolio import take_snapshot, compute_metrics
from src.logger_setup import get_logger

log = get_logger('reporter')


def _build_report_html() -> tuple[str, str]:
    """Build the daily report HTML. Returns (subject, html)."""
    snapshot = take_snapshot()
    metrics = compute_metrics()
    positions = get_positions()
    ledger = get_trade_ledger()
    account = get_account()

    today = datetime.now().strftime('%A %d %B %Y')
    date_short = datetime.now().strftime('%Y-%m-%d')

    # Today's trades
    today_trades = [t for t in ledger if t['timestamp'].startswith(date_short)]

    equity = metrics['current_equity']
    total_return = metrics['total_return_pct']
    return_color = '#4caf50' if total_return >= 0 else '#f44336'
    daily_pnl = snapshot['daily_pnl'] if snapshot else 0
    daily_color = '#4caf50' if daily_pnl >= 0 else '#f44336'

    # Position rows
    pos_rows = ''
    for p in positions:
        pl = float(p.unrealized_pl)
        pl_color = '#4caf50' if pl >= 0 else '#f44336'
        pos_rows += f'''
        <tr>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">{p.symbol}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">{float(p.qty):.4f}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">${float(p.avg_entry_price):.2f}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">${float(p.current_price):.2f}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222; color:{pl_color};">${pl:.2f}</td>
        </tr>'''

    if not pos_rows:
        pos_rows = '<tr><td colspan="5" style="padding:12px; color:#666; text-align:center;">No open positions</td></tr>'

    # Trade rows
    trade_rows = ''
    for t in today_trades:
        action_color = '#4caf50' if t['action'] == 'BUY' else '#f44336'
        amount = t.get('notional', t.get('qty', '—'))
        trade_rows += f'''
        <tr>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">{t['timestamp'][11:19]}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222; color:{action_color}; font-weight:700;">{t['action']}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">{t['symbol']}</td>
            <td style="padding:8px 12px; font-size:13px; border-bottom:1px solid #222;">{amount}</td>
            <td style="padding:8px 12px; font-size:12px; border-bottom:1px solid #222; color:#999;">{t.get('reasoning', '—')[:80]}</td>
        </tr>'''

    if not trade_rows:
        trade_rows = '<tr><td colspan="5" style="padding:12px; color:#666; text-align:center;">No trades executed today</td></tr>'

    subject = f'NAVADA AI Trading Report — {date_short}'

    html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family:'Segoe UI',Arial,sans-serif;">

<!-- Header -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#000;">
  <tr><td style="padding:24px 32px;">
    <span style="font-size:20px; font-weight:800; color:#fff; letter-spacing:0.15em;">NAVADA</span>
    <span style="font-size:11px; color:#666; letter-spacing:0.1em; margin-left:12px;">AI TRADING LAB</span>
  </td></tr>
</table>

<!-- Date -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#111; border-bottom:1px solid #222;">
  <tr><td style="padding:10px 32px;">
    <span style="font-size:11px; color:#888;">{today} &middot; Daily Report</span>
  </td></tr>
</table>

<!-- KPI Cards -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:24px 32px 16px 32px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width:25%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Equity</div>
            <div style="font-size:24px; font-weight:900; color:#FFD43B; margin-top:4px;">${equity:.2f}</div>
          </div>
        </td>
        <td style="width:25%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Total Return</div>
            <div style="font-size:24px; font-weight:900; color:{return_color}; margin-top:4px;">{total_return:+.2f}%</div>
          </div>
        </td>
        <td style="width:25%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Daily P&L</div>
            <div style="font-size:24px; font-weight:900; color:{daily_color}; margin-top:4px;">${daily_pnl:+.2f}</div>
          </div>
        </td>
        <td style="width:25%; padding:4px;">
          <div style="background:#111; border:1px solid #222; border-radius:8px; padding:16px; text-align:center;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">Max Drawdown</div>
            <div style="font-size:24px; font-weight:900; color:#e07030; margin-top:4px;">{metrics['max_drawdown_pct']:.2f}%</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- Metrics Row -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 20px 32px;">
    <div style="background:#111; border:1px solid #222; border-radius:8px; padding:14px 20px; display:flex;">
      <span style="font-size:12px; color:#888; margin-right:24px;">Trades: <strong style="color:#fff;">{metrics['total_trades']}</strong></span>
      <span style="font-size:12px; color:#888; margin-right:24px;">Sharpe: <strong style="color:#fff;">{metrics['sharpe_ratio']}</strong></span>
      <span style="font-size:12px; color:#888; margin-right:24px;">Days: <strong style="color:#fff;">{metrics['trading_days']}</strong></span>
      <span style="font-size:12px; color:#888;">Starting: <strong style="color:#fff;">${metrics['starting_capital']:.2f}</strong></span>
    </div>
  </td></tr>
</table>

<!-- Positions Table -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 20px 32px;">
    <div style="font-size:11px; color:#FFD43B; letter-spacing:0.1em; text-transform:uppercase; font-weight:700; margin-bottom:8px;">Open Positions</div>
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

<!-- Trades Table -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 20px 32px;">
    <div style="font-size:11px; color:#FFD43B; letter-spacing:0.1em; text-transform:uppercase; font-weight:700; margin-bottom:8px;">Today's Trades</div>
    <table width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <thead><tr>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Time</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Action</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Symbol</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Amount</th>
        <th style="padding:10px 12px; font-size:10px; color:#666; text-transform:uppercase; text-align:left; border-bottom:1px solid #333;">Reasoning</th>
      </tr></thead>
      <tbody>{trade_rows}</tbody>
    </table>
  </td></tr>
</table>

<!-- Risk Status -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr><td style="padding:0 32px 24px 32px;">
    <div style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px; padding:14px 20px;">
      <span style="font-size:11px; color:#6aaa4f; letter-spacing:0.1em; text-transform:uppercase; font-weight:700;">Risk Status: NORMAL</span>
      <span style="font-size:11px; color:#888; margin-left:16px;">Stop-loss: 3% | Take-profit: 5% | Max positions: 2 | No leverage</span>
    </div>
  </td></tr>
</table>

<!-- Footer -->
<table width="100%" cellspacing="0" cellpadding="0" style="background:#000; border-top:1px solid #222;">
  <tr><td style="padding:16px 32px;">
    <div style="font-size:10px; color:#555;">
      NAVADA AI Trading Lab &middot; Paper Trading Only &middot; Not Investment Advice<br>
      Generated autonomously by Claude &middot; NAVADA Server (HP Laptop)
    </div>
  </td></tr>
</table>

</body></html>'''

    return subject, html


def send_daily_report():
    """Generate and email the daily trading report."""
    try:
        subject, html = _build_report_html()

        msg = MIMEMultipart('alternative')
        msg['From'] = f'Claude | NAVADA Trading <{ZOHO_USER}>'
        msg['To'] = REPORT_TO
        msg['Subject'] = subject
        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP_SSL('smtp.zoho.eu', 465) as server:
            server.login(ZOHO_USER, ZOHO_APP_PASSWORD)
            server.send_message(msg)

        log.info(f'Daily report sent to {REPORT_TO}')
        return True

    except Exception as e:
        log.error(f'Failed to send daily report: {e}')
        return False


if __name__ == '__main__':
    send_daily_report()
