"""
NAVADA AI Trading Lab — Main Trader
The orchestrator. Analyses markets, makes decisions, executes trades.
Runs as a scheduled task at 3:45pm UK time (during US market hours).
"""

import sys
from datetime import datetime

from src.config import SYMBOLS
from src.logger_setup import get_logger
from src.market_data import get_daily_bars, get_latest_price
from src.strategy import analyse
from src.risk_manager import evaluate_buy, evaluate_sell, check_volatility_pause
from src.executor import get_account, get_positions, place_buy, place_sell

log = get_logger('trader')


def run_trading_session():
    """Execute one complete trading session."""
    log.info('=' * 60)
    log.info('NAVADA AI Trading Lab — Session Started')
    log.info(f'Time: {datetime.now().isoformat()}')
    log.info('=' * 60)

    # Step 1: Check account
    account = get_account()
    if not account:
        log.error('ABORT: Cannot connect to Alpaca API')
        return False

    equity = float(account.equity)
    cash = float(account.cash)
    log.info(f'Equity: ${equity:.2f} | Cash: ${cash:.2f}')

    # Step 2: Check existing positions for stop-loss / take-profit
    positions = get_positions()
    daily_loss = 0.0

    for pos in positions:
        current_price = float(pos.current_price)
        entry_price = float(pos.avg_entry_price)
        unrealized_pl = float(pos.unrealized_pl)

        if unrealized_pl < 0:
            daily_loss += abs(unrealized_pl)

        sell_check = evaluate_sell(pos.symbol, current_price, entry_price)
        if sell_check.approved:
            log.info(f'Closing {pos.symbol}: {sell_check.reason}')
            place_sell(pos.symbol, float(pos.qty), sell_check.reason)

    # Refresh positions after any sells
    positions = get_positions()
    current_position_count = len(positions)

    # Step 3: Scan symbols for new signals
    log.info(f'Scanning {len(SYMBOLS)} symbols: {", ".join(SYMBOLS)}')

    for symbol in SYMBOLS:
        # Fetch data
        df = get_daily_bars(symbol)
        if df is None:
            continue

        # Check volatility
        if len(df) >= 5:
            recent_changes = []
            closes = df['close'].astype(float).tolist()
            for i in range(1, min(6, len(closes))):
                recent_changes.append((closes[i] - closes[i-1]) / closes[i-1])

            if check_volatility_pause(recent_changes):
                log.info(f'{symbol}: Skipping — volatility pause active')
                continue

        # Analyse
        signal = analyse(symbol, df)
        if signal is None:
            continue

        # Act on BUY signals
        if signal.action == 'BUY':
            risk_check = evaluate_buy(
                symbol=symbol,
                current_price=signal.current_price,
                portfolio_value=equity,
                current_positions=current_position_count,
                daily_loss=daily_loss,
            )

            if risk_check.approved:
                result = place_buy(
                    symbol=symbol,
                    dollar_amount=risk_check.position_size,
                    reasoning=signal.reasoning,
                )
                if result:
                    current_position_count += 1
                    log.info(f'{symbol}: Trade executed — {risk_check.reason}')
            else:
                log.info(f'{symbol}: BUY blocked — {risk_check.reason}')

        elif signal.action == 'SELL':
            # Check if we hold this symbol
            held = [p for p in positions if p.symbol == symbol]
            if held:
                place_sell(symbol, float(held[0].qty), signal.reasoning)
                current_position_count -= 1
            else:
                log.debug(f'{symbol}: SELL signal but no position held')

    log.info('=' * 60)
    log.info('Trading session complete')
    log.info('=' * 60)
    return True


if __name__ == '__main__':
    try:
        success = run_trading_session()
        sys.exit(0 if success else 1)
    except Exception as e:
        log.error(f'CRITICAL: Unhandled exception — {e}', exc_info=True)
        sys.exit(1)
