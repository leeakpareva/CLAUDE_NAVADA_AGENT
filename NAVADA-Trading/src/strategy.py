"""
NAVADA AI Trading Lab — Strategy Engine
Moving Average Crossover with RSI confirmation.
"""

from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd

from src.config import FAST_MA_PERIOD, SLOW_MA_PERIOD
from src.logger_setup import get_logger

log = get_logger('strategy')


@dataclass
class Signal:
    symbol: str
    action: str           # 'BUY', 'SELL', 'HOLD'
    confidence: float     # 0.0 to 1.0
    reasoning: str        # Human-readable explanation
    fast_ma: float
    slow_ma: float
    rsi: float
    current_price: float


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Compute Relative Strength Index."""
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi


def analyse(symbol: str, df: pd.DataFrame) -> Optional[Signal]:
    """
    Analyse a symbol's daily bars and return a trading signal.

    Strategy: Moving Average Crossover + RSI Confirmation
    - BUY:  Fast MA crosses above Slow MA AND RSI < 70 (not overbought)
    - SELL: Fast MA crosses below Slow MA AND RSI > 30 (not oversold)
    - HOLD: No crossover or conflicting signals
    """
    if df is None or len(df) < SLOW_MA_PERIOD + 2:
        log.warning(f'{symbol}: insufficient data for analysis ({len(df) if df is not None else 0} bars)')
        return None

    close = df['close'].astype(float)

    # Compute indicators
    fast_ma = close.rolling(window=FAST_MA_PERIOD).mean()
    slow_ma = close.rolling(window=SLOW_MA_PERIOD).mean()
    rsi = compute_rsi(close)

    # Current values
    curr_fast = fast_ma.iloc[-1]
    prev_fast = fast_ma.iloc[-2]
    curr_slow = slow_ma.iloc[-1]
    prev_slow = slow_ma.iloc[-2]
    curr_rsi = rsi.iloc[-1]
    curr_price = close.iloc[-1]

    if pd.isna(curr_fast) or pd.isna(curr_slow) or pd.isna(curr_rsi):
        log.warning(f'{symbol}: NaN in indicators — skipping')
        return None

    # Detect crossover
    crossed_above = prev_fast <= prev_slow and curr_fast > curr_slow
    crossed_below = prev_fast >= prev_slow and curr_fast < curr_slow

    # Trend strength (distance between MAs as % of price)
    ma_spread = abs(curr_fast - curr_slow) / curr_price
    confidence = min(ma_spread * 20, 1.0)  # scale to 0-1

    if crossed_above and curr_rsi < 70:
        reasoning = (
            f'BUY signal: {FAST_MA_PERIOD}-day MA (${curr_fast:.2f}) crossed above '
            f'{SLOW_MA_PERIOD}-day MA (${curr_slow:.2f}). '
            f'RSI at {curr_rsi:.1f} confirms not overbought. '
            f'Current price: ${curr_price:.2f}.'
        )
        log.info(f'{symbol}: {reasoning}')
        return Signal(symbol, 'BUY', confidence, reasoning, curr_fast, curr_slow, curr_rsi, curr_price)

    elif crossed_below and curr_rsi > 30:
        reasoning = (
            f'SELL signal: {FAST_MA_PERIOD}-day MA (${curr_fast:.2f}) crossed below '
            f'{SLOW_MA_PERIOD}-day MA (${curr_slow:.2f}). '
            f'RSI at {curr_rsi:.1f} confirms not oversold. '
            f'Current price: ${curr_price:.2f}.'
        )
        log.info(f'{symbol}: {reasoning}')
        return Signal(symbol, 'SELL', confidence, reasoning, curr_fast, curr_slow, curr_rsi, curr_price)

    else:
        trend = 'bullish' if curr_fast > curr_slow else 'bearish'
        reasoning = (
            f'HOLD: No crossover detected. Trend is {trend}. '
            f'{FAST_MA_PERIOD}MA=${curr_fast:.2f}, {SLOW_MA_PERIOD}MA=${curr_slow:.2f}, '
            f'RSI={curr_rsi:.1f}, Price=${curr_price:.2f}.'
        )
        log.debug(f'{symbol}: {reasoning}')
        return Signal(symbol, 'HOLD', 0.0, reasoning, curr_fast, curr_slow, curr_rsi, curr_price)
