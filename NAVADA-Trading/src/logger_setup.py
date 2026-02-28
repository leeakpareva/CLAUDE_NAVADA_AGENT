"""
NAVADA AI Trading Lab — Logging
Structured logging to file and console. Immutable audit trail.
"""

import logging
from datetime import datetime
from src.config import LOGS_DIR


def get_logger(name: str = 'navada-trading') -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # File handler — one log per day
    today = datetime.now().strftime('%Y-%m-%d')
    fh = logging.FileHandler(LOGS_DIR / f'trading_{today}.log', encoding='utf-8')
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    # Audit log — append-only, never rotated
    ah = logging.FileHandler(LOGS_DIR / 'audit_trail.log', encoding='utf-8')
    ah.setLevel(logging.INFO)
    ah.setFormatter(formatter)
    logger.addHandler(ah)

    return logger
