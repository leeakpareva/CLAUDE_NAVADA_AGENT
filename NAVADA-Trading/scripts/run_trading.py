"""
Entry point for the trading scheduled task.
Runs at 3:45pm UK time via Windows Task Scheduler.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.trader import run_trading_session

if __name__ == '__main__':
    run_trading_session()
