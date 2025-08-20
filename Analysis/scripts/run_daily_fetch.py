#!/usr/bin/env python3
"""
Daily Data Fetch Script
Runs all data fetchers and saves results
Can be scheduled with cron for automated daily runs
"""

import os
import sys
import argparse
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_fetchers.finnhub_fetcher import FinnhubFetcher
from data_fetchers.grok_fetcher import GrokFetcher
from config import TEST_SYMBOLS, TODAY

def main():
    parser = argparse.ArgumentParser(description='Fetch daily stock data from multiple sources')
    parser.add_argument('--symbols', nargs='+', help='Stock symbols to fetch (default: TEST_SYMBOLS from config)')
    parser.add_argument('--finnhub', action='store_true', help='Only fetch Finnhub data')
    parser.add_argument('--grok', action='store_true', help='Only fetch Grok data')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Use provided symbols or defaults
    symbols = args.symbols or TEST_SYMBOLS
    
    print("="*60)
    print(f"📊 STOCK DATA FETCHER")
    print(f"📅 Date: {TODAY}")
    print(f"🎯 Symbols: {', '.join(symbols[:5])}{'...' if len(symbols) > 5 else ''}")
    print("="*60)
    
    # Determine what to fetch
    fetch_finnhub = True
    fetch_grok = True
    
    if args.finnhub and not args.grok:
        fetch_grok = False
    elif args.grok and not args.finnhub:
        fetch_finnhub = False
    
    results = {}
    
    # Fetch Finnhub data
    if fetch_finnhub:
        print("\n" + "="*40)
        print("📈 FINNHUB DATA FETCH")
        print("="*40)
        
        finnhub = FinnhubFetcher()
        finnhub_data = finnhub.fetch_all(symbols)
        results['finnhub'] = finnhub_data
    
    # Fetch Grok data
    if fetch_grok:
        print("\n" + "="*40)
        print("🤖 GROK.AI DATA FETCH")
        print("="*40)
        
        grok = GrokFetcher()
        grok_data = grok.fetch_all(symbols)
        results['grok'] = grok_data
    
    # Summary
    print("\n" + "="*60)
    print("✅ DATA FETCH COMPLETE")
    print("="*60)
    
    if fetch_finnhub and results.get('finnhub'):
        fh_data = results['finnhub']
        print(f"📊 Finnhub: {len(fh_data.get('quotes', []))} quotes, "
              f"{len(fh_data.get('profiles', []))} profiles")
    
    if fetch_grok and results.get('grok'):
        gk_data = results['grok']
        print(f"🤖 Grok: {len(gk_data.get('sentiments', []))} sentiments, "
              f"{len(gk_data.get('momentums', []))} momentum signals")
    
    print(f"\n📂 Data saved to: Analysis/data/raw/")
    print(f"🔗 Latest data: Analysis/data/raw/*/latest/")
    print("\n" + "="*60)
    
    return results

if __name__ == "__main__":
    results = main()