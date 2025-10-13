"""
Configuration file for Analysis module
Store API keys and settings here
"""

import os
from datetime import datetime

# API Keys
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY')
GROK_API_KEY = os.getenv('GROK_API_KEY')

# Data paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
RAW_DATA_DIR = os.path.join(DATA_DIR, 'raw')
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, 'processed')
REPORTS_DIR = os.path.join(BASE_DIR, 'reports')

# Date format for folders
DATE_FORMAT = '%Y-%m-%d'
TODAY = datetime.now().strftime(DATE_FORMAT)

# Finnhub settings
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'
FINNHUB_RATE_LIMIT_DELAY = 0.05  # 50ms between calls (conservative for 60 calls/min limit)

# Grok.AI settings
GROK_BASE_URL = 'https://api.x.ai/v1'  # Grok API endpoint
GROK_RATE_LIMIT_DELAY = 0.1

# S&P 500 symbols (top 20 for testing)
TEST_SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
    'META', 'TSLA', 'BRK.B', 'JPM', 'V',
    'JNJ', 'WMT', 'PG', 'MA', 'UNH',
    'HD', 'DIS', 'BAC', 'XOM', 'CVX'
]

# Analysis settings
LOOKBACK_DAYS = 30  # Days of historical data to fetch
RSI_PERIOD = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9