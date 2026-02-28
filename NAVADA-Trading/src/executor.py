"""
NAVADA AI Trading Lab — Order Executor
Executes trades via Alpaca paper trading API.
Every action is logged to the audit trail.
"""

import json
from datetime import datetime
from typing import Optional

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, GetOrdersRequest
from alpaca.trading.enums import OrderSide, TimeInForce, QueryOrderStatus

from src.config import ALPACA_API_KEY, ALPACA_SECRET_KEY, DATA_DIR
from src.logger_setup import get_logger

log = get_logger('executor')

trading_client = TradingClient(ALPACA_API_KEY, ALPACA_SECRET_KEY, paper=True)

# Local trade ledger (JSON file for persistence)
LEDGER_FILE = DATA_DIR / 'trade_ledger.json'


def _load_ledger() -> list[dict]:
    if LEDGER_FILE.exists():
        return json.loads(LEDGER_FILE.read_text(encoding='utf-8'))
    return []


def _save_ledger(ledger: list[dict]):
    LEDGER_FILE.write_text(json.dumps(ledger, indent=2, default=str), encoding='utf-8')


def get_account():
    """Get current account info."""
    try:
        account = trading_client.get_account()
        log.info(
            f'Account: equity=${float(account.equity):.2f}, '
            f'cash=${float(account.cash):.2f}, '
            f'buying_power=${float(account.buying_power):.2f}'
        )
        return account
    except Exception as e:
        log.error(f'Failed to get account: {e}')
        return None


def get_positions() -> list:
    """Get all open positions."""
    try:
        positions = trading_client.get_all_positions()
        for p in positions:
            log.debug(
                f'Position: {p.symbol} qty={p.qty} '
                f'entry=${float(p.avg_entry_price):.2f} '
                f'current=${float(p.current_price):.2f} '
                f'P&L=${float(p.unrealized_pl):.2f}'
            )
        return positions
    except Exception as e:
        log.error(f'Failed to get positions: {e}')
        return []


def place_buy(symbol: str, dollar_amount: float, reasoning: str) -> Optional[dict]:
    """Place a fractional dollar-based market buy order."""
    try:
        order_request = MarketOrderRequest(
            symbol=symbol,
            notional=round(dollar_amount, 2),
            side=OrderSide.BUY,
            time_in_force=TimeInForce.DAY,
        )
        order = trading_client.submit_order(order_request)

        trade_record = {
            'timestamp': datetime.now().isoformat(),
            'action': 'BUY',
            'symbol': symbol,
            'notional': dollar_amount,
            'order_id': str(order.id),
            'status': str(order.status),
            'reasoning': reasoning,
        }

        # Append to ledger
        ledger = _load_ledger()
        ledger.append(trade_record)
        _save_ledger(ledger)

        log.info(f'BUY executed: {symbol} ${dollar_amount:.2f} — Order {order.id}')
        return trade_record

    except Exception as e:
        log.error(f'BUY FAILED for {symbol}: {e}')
        return None


def place_sell(symbol: str, qty: float, reasoning: str) -> Optional[dict]:
    """Place a market sell order for a given quantity."""
    try:
        order_request = MarketOrderRequest(
            symbol=symbol,
            qty=qty,
            side=OrderSide.SELL,
            time_in_force=TimeInForce.DAY,
        )
        order = trading_client.submit_order(order_request)

        trade_record = {
            'timestamp': datetime.now().isoformat(),
            'action': 'SELL',
            'symbol': symbol,
            'qty': qty,
            'order_id': str(order.id),
            'status': str(order.status),
            'reasoning': reasoning,
        }

        ledger = _load_ledger()
        ledger.append(trade_record)
        _save_ledger(ledger)

        log.info(f'SELL executed: {symbol} qty={qty} — Order {order.id}')
        return trade_record

    except Exception as e:
        log.error(f'SELL FAILED for {symbol}: {e}')
        return None


def close_all_positions() -> list[dict]:
    """Close all open positions (end of week / emergency)."""
    results = []
    positions = get_positions()
    for p in positions:
        result = place_sell(
            p.symbol,
            float(p.qty),
            'End-of-period: closing all positions'
        )
        if result:
            results.append(result)
    if not positions:
        log.info('No positions to close')
    return results


def get_today_orders() -> list:
    """Get today's orders for reporting."""
    try:
        request = GetOrdersRequest(
            status=QueryOrderStatus.ALL,
            after=datetime.now().replace(hour=0, minute=0, second=0).isoformat(),
        )
        return trading_client.get_orders(request)
    except Exception as e:
        log.error(f'Failed to get orders: {e}')
        return []


def get_trade_ledger() -> list[dict]:
    """Return the full trade ledger."""
    return _load_ledger()
