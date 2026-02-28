"""
NAVADA AI Trading Lab — Risk Manager
Enforces strict position sizing, stop-losses, and safety controls.
Risk discipline > profit.
"""

from dataclasses import dataclass
from typing import Optional

from src.config import (
    MAX_RISK_PER_TRADE,
    MAX_POSITIONS,
    STOP_LOSS_PCT,
    TAKE_PROFIT_PCT,
)
from src.logger_setup import get_logger

log = get_logger('risk-manager')


@dataclass
class RiskCheck:
    approved: bool
    reason: str
    position_size: float    # dollar amount to trade
    stop_price: float       # stop-loss trigger price
    take_profit_price: float  # take-profit trigger price


def evaluate_buy(
    symbol: str,
    current_price: float,
    portfolio_value: float,
    current_positions: int,
    daily_loss: float,
) -> RiskCheck:
    """
    Evaluate whether a BUY trade passes risk controls.
    Returns approval + position sizing + stop/take-profit levels.
    """
    # Rule 1: Max positions
    if current_positions >= MAX_POSITIONS:
        reason = f'BLOCKED: Already at max positions ({current_positions}/{MAX_POSITIONS})'
        log.warning(f'{symbol}: {reason}')
        return RiskCheck(False, reason, 0, 0, 0)

    # Rule 2: Daily loss circuit breaker (5% max daily drawdown)
    max_daily_loss = portfolio_value * 0.05
    if daily_loss >= max_daily_loss:
        reason = f'BLOCKED: Daily loss limit reached (${daily_loss:.2f} >= ${max_daily_loss:.2f})'
        log.warning(f'{symbol}: {reason}')
        return RiskCheck(False, reason, 0, 0, 0)

    # Rule 3: Position sizing (max risk per trade)
    risk_amount = portfolio_value * MAX_RISK_PER_TRADE
    position_size = min(risk_amount / STOP_LOSS_PCT, portfolio_value * 0.5)  # never risk more than 50% of portfolio

    # Rule 4: Minimum trade size check
    if position_size < 1.0:
        reason = f'BLOCKED: Position size too small (${position_size:.2f})'
        log.warning(f'{symbol}: {reason}')
        return RiskCheck(False, reason, 0, 0, 0)

    # Calculate levels
    stop_price = round(current_price * (1 - STOP_LOSS_PCT), 2)
    take_profit_price = round(current_price * (1 + TAKE_PROFIT_PCT), 2)

    reason = (
        f'APPROVED: Size=${position_size:.2f}, '
        f'Stop=${stop_price:.2f} (-{STOP_LOSS_PCT*100:.0f}%), '
        f'TP=${take_profit_price:.2f} (+{TAKE_PROFIT_PCT*100:.0f}%)'
    )
    log.info(f'{symbol}: {reason}')

    return RiskCheck(True, reason, position_size, stop_price, take_profit_price)


def evaluate_sell(
    symbol: str,
    current_price: float,
    entry_price: float,
) -> RiskCheck:
    """Check if we should sell based on stop-loss or take-profit."""
    pnl_pct = (current_price - entry_price) / entry_price

    if pnl_pct <= -STOP_LOSS_PCT:
        reason = f'STOP-LOSS triggered: {pnl_pct*100:.2f}% loss (threshold: -{STOP_LOSS_PCT*100:.0f}%)'
        log.warning(f'{symbol}: {reason}')
        return RiskCheck(True, reason, 0, 0, 0)

    if pnl_pct >= TAKE_PROFIT_PCT:
        reason = f'TAKE-PROFIT triggered: {pnl_pct*100:.2f}% gain (threshold: +{TAKE_PROFIT_PCT*100:.0f}%)'
        log.info(f'{symbol}: {reason}')
        return RiskCheck(True, reason, 0, 0, 0)

    reason = f'HOLD: P&L at {pnl_pct*100:.2f}%, within thresholds'
    return RiskCheck(False, reason, 0, 0, 0)


def check_volatility_pause(recent_changes: list[float], threshold: float = 0.04) -> bool:
    """Pause trading if recent price swings exceed threshold (4% default)."""
    if not recent_changes:
        return False
    max_swing = max(abs(c) for c in recent_changes[-5:])
    if max_swing > threshold:
        log.warning(f'VOLATILITY PAUSE: Max swing {max_swing*100:.1f}% exceeds {threshold*100:.0f}% threshold')
        return True
    return False
