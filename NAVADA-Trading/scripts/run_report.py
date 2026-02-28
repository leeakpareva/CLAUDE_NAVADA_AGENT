"""
Entry point for the reporting scheduled task.
Runs at 4:30pm UK time via Windows Task Scheduler.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.reporter import send_daily_report

if __name__ == '__main__':
    send_daily_report()
