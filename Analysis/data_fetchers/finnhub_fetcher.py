"""
Finnhub API Data Fetcher
Fetches stock quotes, candles, and company profiles
Saves data as CSV files organized by date
"""

import os
import sys
import csv
import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    FINNHUB_API_KEY, FINNHUB_BASE_URL, FINNHUB_RATE_LIMIT_DELAY,
    RAW_DATA_DIR, TODAY, TEST_SYMBOLS
)

class FinnhubFetcher:
    def __init__(self, api_key: str = FINNHUB_API_KEY):
        self.api_key = api_key
        self.base_url = FINNHUB_BASE_URL
        self.session = requests.Session()
        self.data_dir = os.path.join(RAW_DATA_DIR, 'finnhub', TODAY)
        os.makedirs(self.data_dir, exist_ok=True)
        
    def fetch_quote(self, symbol: str) -> Optional[Dict]:
        """Fetch real-time quote for a symbol"""
        url = f"{self.base_url}/quote"
        params = {'symbol': symbol, 'token': self.api_key}
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Add symbol to the data
            data['symbol'] = symbol
            data['timestamp'] = datetime.now().isoformat()
            
            print(f"✓ Fetched quote for {symbol}: ${data.get('c', 0):.2f}")
            return data
            
        except Exception as e:
            print(f"✗ Error fetching quote for {symbol}: {e}")
            return None
    
    def fetch_candles(self, symbol: str, days_back: int = 30) -> Optional[List]:
        """Fetch historical candle data"""
        url = f"{self.base_url}/stock/candle"
        
        # Calculate time range
        end_time = int(datetime.now().timestamp())
        start_time = int((datetime.now() - timedelta(days=days_back)).timestamp())
        
        params = {
            'symbol': symbol,
            'resolution': 'D',  # Daily candles
            'from': start_time,
            'to': end_time,
            'token': self.api_key
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('s') != 'ok':
                print(f"⚠ No candle data for {symbol}")
                return None
                
            # Convert to list of dictionaries
            candles = []
            for i in range(len(data['t'])):
                candles.append({
                    'symbol': symbol,
                    'timestamp': datetime.fromtimestamp(data['t'][i]).isoformat(),
                    'open': data['o'][i],
                    'high': data['h'][i],
                    'low': data['l'][i],
                    'close': data['c'][i],
                    'volume': data['v'][i]
                })
            
            print(f"✓ Fetched {len(candles)} candles for {symbol}")
            return candles
            
        except Exception as e:
            print(f"✗ Error fetching candles for {symbol}: {e}")
            return None
    
    def fetch_profile(self, symbol: str) -> Optional[Dict]:
        """Fetch company profile"""
        url = f"{self.base_url}/stock/profile2"
        params = {'symbol': symbol, 'token': self.api_key}
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data:
                data['symbol'] = symbol
                data['fetched_at'] = datetime.now().isoformat()
                print(f"✓ Fetched profile for {symbol}: {data.get('name', 'Unknown')}")
            
            return data if data else None
            
        except Exception as e:
            print(f"✗ Error fetching profile for {symbol}: {e}")
            return None
    
    def save_quotes_csv(self, quotes: List[Dict]):
        """Save quotes to CSV"""
        if not quotes:
            return
            
        filepath = os.path.join(self.data_dir, 'quotes.csv')
        
        fieldnames = ['symbol', 'timestamp', 'current', 'open', 'high', 'low', 
                     'prev_close', 'change', 'change_pct', 'volume']
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for quote in quotes:
                writer.writerow({
                    'symbol': quote['symbol'],
                    'timestamp': quote['timestamp'],
                    'current': quote.get('c', 0),
                    'open': quote.get('o', 0),
                    'high': quote.get('h', 0),
                    'low': quote.get('l', 0),
                    'prev_close': quote.get('pc', 0),
                    'change': quote.get('d', 0),
                    'change_pct': quote.get('dp', 0),
                    'volume': quote.get('v', 0) if 'v' in quote else None
                })
        
        print(f"📁 Saved {len(quotes)} quotes to {filepath}")
    
    def save_candles_csv(self, all_candles: List[Dict]):
        """Save candle data to CSV"""
        if not all_candles:
            return
            
        filepath = os.path.join(self.data_dir, 'candles.csv')
        
        fieldnames = ['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume']
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_candles)
        
        print(f"📁 Saved {len(all_candles)} candles to {filepath}")
    
    def save_profiles_csv(self, profiles: List[Dict]):
        """Save company profiles to CSV"""
        if not profiles:
            return
            
        filepath = os.path.join(self.data_dir, 'profiles.csv')
        
        fieldnames = ['symbol', 'name', 'country', 'currency', 'exchange', 
                     'industry', 'market_cap', 'share_outstanding', 'ipo', 
                     'logo', 'weburl', 'fetched_at']
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for profile in profiles:
                writer.writerow({
                    'symbol': profile.get('symbol', ''),
                    'name': profile.get('name', ''),
                    'country': profile.get('country', ''),
                    'currency': profile.get('currency', ''),
                    'exchange': profile.get('exchange', ''),
                    'industry': profile.get('finnhubIndustry', ''),
                    'market_cap': profile.get('marketCapitalization', 0),
                    'share_outstanding': profile.get('shareOutstanding', 0),
                    'ipo': profile.get('ipo', ''),
                    'logo': profile.get('logo', ''),
                    'weburl': profile.get('weburl', ''),
                    'fetched_at': profile.get('fetched_at', '')
                })
        
        print(f"📁 Saved {len(profiles)} profiles to {filepath}")
    
    def fetch_all(self, symbols: List[str] = None):
        """Fetch all data for given symbols"""
        symbols = symbols or TEST_SYMBOLS
        
        print(f"\n🚀 Starting Finnhub data fetch for {len(symbols)} symbols")
        print(f"📅 Date: {TODAY}")
        print(f"📂 Output directory: {self.data_dir}\n")
        
        quotes = []
        all_candles = []
        profiles = []
        
        for i, symbol in enumerate(symbols, 1):
            print(f"[{i}/{len(symbols)}] Processing {symbol}...")
            
            # Fetch quote
            quote = self.fetch_quote(symbol)
            if quote:
                quotes.append(quote)
            
            # Rate limiting
            time.sleep(FINNHUB_RATE_LIMIT_DELAY)
            
            # Fetch candles
            candles = self.fetch_candles(symbol)
            if candles:
                all_candles.extend(candles)
            
            # Rate limiting
            time.sleep(FINNHUB_RATE_LIMIT_DELAY)
            
            # Fetch profile
            profile = self.fetch_profile(symbol)
            if profile:
                profiles.append(profile)
            
            # Rate limiting
            time.sleep(FINNHUB_RATE_LIMIT_DELAY)
        
        # Save all data to CSV files
        print("\n💾 Saving data to CSV files...")
        self.save_quotes_csv(quotes)
        self.save_candles_csv(all_candles)
        self.save_profiles_csv(profiles)
        
        # Create/update latest symlink
        latest_link = os.path.join(RAW_DATA_DIR, 'finnhub', 'latest')
        if os.path.exists(latest_link):
            os.remove(latest_link)
        os.symlink(self.data_dir, latest_link)
        
        print(f"\n✅ Finnhub data fetch complete!")
        print(f"📊 Fetched: {len(quotes)} quotes, {len(all_candles)} candles, {len(profiles)} profiles")
        
        return {
            'quotes': quotes,
            'candles': all_candles,
            'profiles': profiles
        }


if __name__ == "__main__":
    # Run the fetcher
    fetcher = FinnhubFetcher()
    
    # You can specify custom symbols or use defaults
    # fetcher.fetch_all(['AAPL', 'GOOGL', 'MSFT'])
    fetcher.fetch_all()  # Uses TEST_SYMBOLS from config