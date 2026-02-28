"""
NAVADA AI Trading Lab — FastAPI Server
Exposes live portfolio data as JSON for WorldMonitor dashboard integration.
Runs on port 5678, proxied through WorldMonitor's serve-local.mjs.
"""

import time
from datetime import datetime
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import (
    SYMBOLS, MAX_POSITIONS, STOP_LOSS_PCT, TAKE_PROFIT_PCT,
    FAST_MA_PERIOD, SLOW_MA_PERIOD, STARTING_CAPITAL, DATA_DIR,
)
from src.executor import get_account, get_positions, get_trade_ledger
from src.market_data import get_daily_bars
from src.strategy import analyse
from src.portfolio import compute_metrics, _load_snapshots
from src.logger_setup import get_logger

log = get_logger('api')

app = FastAPI(title='NAVADA Trading API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# Signal cache (avoid hammering Alpaca on every poll)
_signal_cache: dict[str, Any] = {'data': None, 'ts': 0}
SIGNAL_CACHE_TTL = 120  # 2 minutes


@app.get('/api/trading/account')
def trading_account():
    """Equity, cash, buying power."""
    account = get_account()
    if not account:
        return {'error': 'Unable to fetch account'}

    equity = float(account.equity)
    cash = float(account.cash)
    buying_power = float(account.buying_power)

    snapshots = _load_snapshots()
    daily_pnl = 0.0
    if len(snapshots) >= 2:
        daily_pnl = snapshots[-1]['equity'] - snapshots[-2]['equity']
    elif snapshots:
        daily_pnl = snapshots[-1].get('daily_pnl', 0.0)

    return {
        'equity': equity,
        'cash': cash,
        'buying_power': buying_power,
        'starting_capital': STARTING_CAPITAL,
        'total_return_pct': round(((equity - STARTING_CAPITAL) / STARTING_CAPITAL) * 100, 2),
        'daily_pnl': round(daily_pnl, 2),
        'updated_at': datetime.utcnow().isoformat() + 'Z',
    }


@app.get('/api/trading/positions')
def trading_positions():
    """Open positions with P&L."""
    positions = get_positions()
    items = []
    for p in positions:
        items.append({
            'symbol': p.symbol,
            'qty': float(p.qty),
            'entry_price': float(p.avg_entry_price),
            'current_price': float(p.current_price),
            'market_value': float(p.market_value),
            'unrealized_pl': round(float(p.unrealized_pl), 2),
            'unrealized_plpc': round(float(p.unrealized_plpc) * 100, 2),
            'side': p.side.value if hasattr(p.side, 'value') else str(p.side),
        })
    return {
        'positions': items,
        'count': len(items),
        'max_positions': MAX_POSITIONS,
    }


@app.get('/api/trading/signals')
def trading_signals():
    """Latest strategy signals for all tracked symbols."""
    now = time.time()
    if _signal_cache['data'] and (now - _signal_cache['ts']) < SIGNAL_CACHE_TTL:
        return _signal_cache['data']

    signals = []
    for symbol in SYMBOLS:
        df = get_daily_bars(symbol)
        if df is None:
            continue
        sig = analyse(symbol, df)
        if sig:
            signals.append({
                'symbol': sig.symbol,
                'action': sig.action,
                'confidence': round(sig.confidence, 2),
                'reasoning': sig.reasoning,
                'current_price': round(sig.current_price, 2),
                'fast_ma': round(sig.fast_ma, 2),
                'slow_ma': round(sig.slow_ma, 2),
                'rsi': round(sig.rsi, 1),
            })

    result = {
        'signals': signals,
        'generated_at': datetime.utcnow().isoformat() + 'Z',
    }
    _signal_cache['data'] = result
    _signal_cache['ts'] = now
    return result


@app.get('/api/trading/portfolio')
def trading_portfolio():
    """Portfolio metrics + equity history."""
    metrics = compute_metrics()
    snapshots = _load_snapshots()

    equity_history = []
    for s in snapshots:
        equity_history.append({
            'date': s.get('date', s.get('timestamp', '')[:10]),
            'equity': s['equity'],
        })

    return {
        'metrics': metrics,
        'equity_history': equity_history,
    }


@app.get('/api/trading/trades')
def trading_trades():
    """Recent trade ledger."""
    ledger = get_trade_ledger()
    trades = []
    for t in ledger[-20:]:  # last 20 trades
        trades.append({
            'timestamp': t.get('timestamp', ''),
            'action': t.get('action', ''),
            'symbol': t.get('symbol', ''),
            'amount': t.get('notional', t.get('qty', 0)),
            'reasoning': t.get('reasoning', ''),
        })
    trades.reverse()  # newest first
    return {'trades': trades}


@app.get('/api/trading/status')
def trading_status():
    """Risk controls, schedule, system health."""
    account = get_account()
    system_status = 'active' if account else 'error'

    return {
        'system_status': system_status,
        'risk_controls': {
            'max_positions': MAX_POSITIONS,
            'stop_loss_pct': STOP_LOSS_PCT * 100,
            'take_profit_pct': TAKE_PROFIT_PCT * 100,
            'daily_loss_limit_pct': 5,
            'volatility_threshold_pct': 4,
        },
        'schedule': {
            'next_premarket': _next_weekday_time('14:15'),
            'next_execution': _next_weekday_time('15:45'),
            'next_report': _next_weekday_time('21:15'),
        },
        'symbols': SYMBOLS,
        'strategy': f'MA Crossover ({FAST_MA_PERIOD}/{SLOW_MA_PERIOD}) + RSI-14',
    }


def _next_weekday_time(time_str: str) -> str:
    """Get the next weekday occurrence of a given time (HH:MM)."""
    from datetime import timedelta
    now = datetime.now()
    h, m = map(int, time_str.split(':'))
    target = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    while target.weekday() >= 5:  # skip weekends
        target += timedelta(days=1)
    return target.strftime('%Y-%m-%d %H:%M')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5678)
