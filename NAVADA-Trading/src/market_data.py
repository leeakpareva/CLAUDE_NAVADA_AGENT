"""
NAVADA AI Trading Lab — Market Data
Fetches historical bars and current prices from Alpaca.
"""

from datetime import datetime, timedelta
from typing import Optional

import pandas as pd
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest, StockLatestQuoteRequest
from alpaca.data.timeframe import TimeFrame
from alpaca.data.enums import DataFeed

from src.config import ALPACA_API_KEY, ALPACA_SECRET_KEY, SLOW_MA_PERIOD
from src.logger_setup import get_logger

log = get_logger('market-data')

client = StockHistoricalDataClient(ALPACA_API_KEY, ALPACA_SECRET_KEY)


def get_daily_bars(symbol: str, days: int = SLOW_MA_PERIOD + 10) -> Optional[pd.DataFrame]:
    """Fetch daily OHLCV bars for a symbol."""
    try:
        end = datetime.now()
        start = end - timedelta(days=days * 2)  # extra buffer for weekends/holidays

        request = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=TimeFrame.Day,
            start=start,
            end=end,
            limit=days,
            feed=DataFeed.IEX,
        )
        bars = client.get_stock_bars(request)
        df = bars.df

        if df.empty:
            log.warning(f'No bar data returned for {symbol}')
            return None

        # If multi-index, select symbol level
        if isinstance(df.index, pd.MultiIndex):
            df = df.xs(symbol, level='symbol')

        df = df.reset_index()
        df = df.sort_values('timestamp').tail(days)
        log.info(f'{symbol}: fetched {len(df)} daily bars')
        return df

    except Exception as e:
        log.error(f'Failed to fetch bars for {symbol}: {e}')
        return None


def get_latest_price(symbol: str) -> Optional[float]:
    """Get the latest quote midpoint price for a symbol."""
    try:
        request = StockLatestQuoteRequest(symbol_or_symbols=symbol, feed=DataFeed.IEX)
        quotes = client.get_stock_latest_quote(request)
        quote = quotes[symbol]
        mid = (quote.ask_price + quote.bid_price) / 2
        log.debug(f'{symbol}: latest price ${mid:.2f}')
        return mid
    except Exception as e:
        log.error(f'Failed to get latest price for {symbol}: {e}')
        return None
