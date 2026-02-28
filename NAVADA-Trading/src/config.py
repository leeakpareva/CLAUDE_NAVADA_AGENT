"""
NAVADA AI Trading Lab — Configuration
Loads environment variables and defines trading parameters.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / '.env')

# Alpaca API
ALPACA_API_KEY = os.getenv('ALPACA_API_KEY', '')
ALPACA_SECRET_KEY = os.getenv('ALPACA_SECRET_KEY', '')
ALPACA_BASE_URL = os.getenv('ALPACA_BASE_URL', 'https://paper-api.alpaca.markets')

# Email
ZOHO_USER = os.getenv('ZOHO_USER', '')
ZOHO_APP_PASSWORD = os.getenv('ZOHO_APP_PASSWORD', '')
REPORT_TO = os.getenv('REPORT_TO', 'leeakpareva@gmail.com')

# Risk Controls
MAX_RISK_PER_TRADE = float(os.getenv('MAX_RISK_PER_TRADE', '0.02'))
MAX_POSITIONS = int(os.getenv('MAX_POSITIONS', '2'))
STOP_LOSS_PCT = float(os.getenv('STOP_LOSS_PCT', '0.03'))
TAKE_PROFIT_PCT = float(os.getenv('TAKE_PROFIT_PCT', '0.05'))
STARTING_CAPITAL = float(os.getenv('STARTING_CAPITAL', '25.00'))

# Strategy
FAST_MA_PERIOD = int(os.getenv('FAST_MA_PERIOD', '10'))
SLOW_MA_PERIOD = int(os.getenv('SLOW_MA_PERIOD', '30'))
SYMBOLS = os.getenv('SYMBOLS', 'SPY,QQQ,AAPL,MSFT,NVDA').split(',')

# Paths
LOGS_DIR = PROJECT_ROOT / 'logs'
REPORTS_DIR = PROJECT_ROOT / 'reports'
DATA_DIR = PROJECT_ROOT / 'data'

LOGS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
