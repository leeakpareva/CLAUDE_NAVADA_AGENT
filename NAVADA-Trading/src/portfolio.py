"""
NAVADA AI Trading Lab — Portfolio Tracker
Tracks performance metrics: return %, win rate, drawdown, Sharpe.
"""

import json
from datetime import datetime
from typing import Optional

from src.config import STARTING_CAPITAL, DATA_DIR
from src.executor import get_account, get_positions, get_trade_ledger
from src.logger_setup import get_logger

log = get_logger('portfolio')

SNAPSHOT_FILE = DATA_DIR / 'daily_snapshots.json'


def _load_snapshots() -> list[dict]:
    if SNAPSHOT_FILE.exists():
        return json.loads(SNAPSHOT_FILE.read_text(encoding='utf-8'))
    return []


def _save_snapshots(snapshots: list[dict]):
    SNAPSHOT_FILE.write_text(json.dumps(snapshots, indent=2, default=str), encoding='utf-8')


def take_snapshot() -> Optional[dict]:
    """Capture current portfolio state."""
    account = get_account()
    if not account:
        return None

    positions = get_positions()
    equity = float(account.equity)
    cash = float(account.cash)

    position_details = []
    for p in positions:
        position_details.append({
            'symbol': p.symbol,
            'qty': float(p.qty),
            'entry_price': float(p.avg_entry_price),
            'current_price': float(p.current_price),
            'market_value': float(p.market_value),
            'unrealized_pl': float(p.unrealized_pl),
            'unrealized_plpc': float(p.unrealized_plpc),
        })

    snapshot = {
        'timestamp': datetime.now().isoformat(),
        'date': datetime.now().strftime('%Y-%m-%d'),
        'equity': equity,
        'cash': cash,
        'positions': position_details,
        'position_count': len(positions),
        'total_return_pct': ((equity - STARTING_CAPITAL) / STARTING_CAPITAL) * 100,
        'daily_pnl': 0.0,
    }

    # Calculate daily P&L vs previous snapshot
    snapshots = _load_snapshots()
    if snapshots:
        prev_equity = snapshots[-1]['equity']
        snapshot['daily_pnl'] = equity - prev_equity

    snapshots.append(snapshot)
    _save_snapshots(snapshots)

    log.info(
        f'Snapshot: equity=${equity:.2f}, '
        f'return={snapshot["total_return_pct"]:.2f}%, '
        f'daily P&L=${snapshot["daily_pnl"]:.2f}'
    )
    return snapshot


def compute_metrics() -> dict:
    """Compute trading performance metrics."""
    ledger = get_trade_ledger()
    snapshots = _load_snapshots()

    # Win rate from trade pairs
    buys = [t for t in ledger if t['action'] == 'BUY']
    sells = [t for t in ledger if t['action'] == 'SELL']
    total_trades = len(buys) + len(sells)

    # Equity curve for drawdown
    equities = [s['equity'] for s in snapshots] if snapshots else [STARTING_CAPITAL]
    peak = STARTING_CAPITAL
    max_drawdown = 0.0
    for eq in equities:
        if eq > peak:
            peak = eq
        dd = (peak - eq) / peak
        if dd > max_drawdown:
            max_drawdown = dd

    # Daily returns for Sharpe
    daily_returns = []
    for i in range(1, len(equities)):
        daily_returns.append((equities[i] - equities[i-1]) / equities[i-1])

    sharpe = 0.0
    if daily_returns and len(daily_returns) > 1:
        import numpy as np
        mean_ret = np.mean(daily_returns)
        std_ret = np.std(daily_returns)
        if std_ret > 0:
            sharpe = (mean_ret / std_ret) * (252 ** 0.5)  # annualised

    current_equity = equities[-1] if equities else STARTING_CAPITAL

    metrics = {
        'starting_capital': STARTING_CAPITAL,
        'current_equity': current_equity,
        'total_return_pct': ((current_equity - STARTING_CAPITAL) / STARTING_CAPITAL) * 100,
        'total_trades': total_trades,
        'max_drawdown_pct': max_drawdown * 100,
        'sharpe_ratio': round(sharpe, 2),
        'trading_days': len(snapshots),
    }

    log.info(f'Metrics: {metrics}')
    return metrics
