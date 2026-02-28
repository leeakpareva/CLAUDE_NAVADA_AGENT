"""
Emergency / end-of-week script.
Closes all open positions and sends final report.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.executor import close_all_positions
from src.reporter import send_daily_report
from src.logger_setup import get_logger

log = get_logger('close-all')

if __name__ == '__main__':
    log.info('Closing all positions...')
    results = close_all_positions()
    log.info(f'Closed {len(results)} positions')
    log.info('Sending final report...')
    send_daily_report()
    log.info('Done.')
