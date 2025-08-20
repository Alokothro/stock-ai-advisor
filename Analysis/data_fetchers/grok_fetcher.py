"""
Grok.AI Data Fetcher
Fetches Twitter sentiment and social media insights
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
    GROK_API_KEY, GROK_BASE_URL, GROK_RATE_LIMIT_DELAY,
    RAW_DATA_DIR, TODAY, TEST_SYMBOLS
)

class GrokFetcher:
    def __init__(self, api_key: str = GROK_API_KEY):
        self.api_key = api_key
        self.base_url = GROK_BASE_URL
        self.session = requests.Session()
        self.data_dir = os.path.join(RAW_DATA_DIR, 'grok', TODAY)
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Set up headers for Grok API
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def analyze_sentiment(self, symbol: str) -> Optional[Dict]:
        """
        Analyze Twitter sentiment for a stock symbol
        Uses Grok's access to Twitter/X data
        """
        if not self.api_key:
            print(f"⚠ Grok API key not configured. Skipping {symbol}")
            return None
        
        url = f"{self.base_url}/chat/completions"
        
        # Craft prompt for sentiment analysis
        prompt = f"""Analyze the current Twitter/X sentiment for stock ticker {symbol}.
        Based on recent tweets (last 24 hours), provide:
        1. Overall sentiment score (-1 to 1, where -1 is very bearish, 0 is neutral, 1 is very bullish)
        2. Number of bullish tweets
        3. Number of bearish tweets  
        4. Number of neutral tweets
        5. Key topics being discussed
        6. Influence score (based on reach of tweets)
        7. Any notable influencer opinions
        
        Return as JSON format:
        {{
            "symbol": "{symbol}",
            "sentiment_score": float,
            "bullish_count": int,
            "bearish_count": int,
            "neutral_count": int,
            "key_topics": [list of strings],
            "influence_score": int,
            "notable_opinions": [list of dicts with "author" and "opinion"],
            "timestamp": "ISO timestamp"
        }}"""
        
        payload = {
            "model": "grok-3-mini-fast",  # Using fast model for quick responses
            "messages": [
                {"role": "system", "content": "You are a financial sentiment analyzer with access to real-time Twitter data."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }
        
        try:
            response = self.session.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Try to extract JSON from the response (might be wrapped in markdown)
            try:
                # Remove potential markdown code blocks
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                    
                sentiment_data = json.loads(content)
            except json.JSONDecodeError:
                # If parsing fails, create a basic structure
                print(f"⚠ JSON parsing failed for {symbol}, using fallback")
                sentiment_data = {
                    "symbol": symbol,
                    "sentiment_score": 0,
                    "bullish_count": 0,
                    "bearish_count": 0,
                    "neutral_count": 0,
                    "key_topics": [],
                    "influence_score": 0,
                    "notable_opinions": []
                }
            sentiment_data['fetched_at'] = datetime.now().isoformat()
            
            print(f"✓ Analyzed sentiment for {symbol}: Score {sentiment_data.get('sentiment_score', 0):.2f}")
            return sentiment_data
            
        except Exception as e:
            print(f"✗ Error analyzing sentiment for {symbol}: {e}")
            return None
    
    def get_trending_topics(self, symbol: str) -> Optional[List[Dict]]:
        """
        Get trending topics and discussions about a stock
        """
        if not self.api_key:
            return None
            
        url = f"{self.base_url}/chat/completions"
        
        prompt = f"""Find the top trending topics and discussions about {symbol} stock on Twitter/X.
        Include:
        1. Topic/theme
        2. Number of mentions
        3. Sentiment of discussion
        4. Key points being made
        
        Return as JSON list of topics."""
        
        payload = {
            "model": "grok-3-mini-fast",
            "messages": [
                {"role": "system", "content": "You are a social media trend analyzer."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 800
        }
        
        try:
            response = self.session.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            content = data['choices'][0]['message']['content']
            topics = json.loads(content)
            
            print(f"✓ Found {len(topics)} trending topics for {symbol}")
            return topics
            
        except Exception as e:
            print(f"✗ Error getting trending topics for {symbol}: {e}")
            return None
    
    def get_momentum_signals(self, symbol: str) -> Optional[Dict]:
        """
        Get social momentum signals - rapid changes in sentiment or volume
        """
        if not self.api_key:
            return None
            
        url = f"{self.base_url}/chat/completions"
        
        prompt = f"""Analyze the social media momentum for {symbol} stock.
        Identify:
        1. Is there unusual volume of discussion? (high/normal/low)
        2. Is sentiment rapidly changing? (accelerating/stable/decelerating)
        3. Are there any viral posts or breaking news?
        4. What's the momentum direction? (bullish/bearish/neutral)
        5. Confidence level in the momentum (0-100)
        
        Return as JSON with these fields."""
        
        payload = {
            "model": "grok-3-mini-fast",
            "messages": [
                {"role": "system", "content": "You are a social media momentum analyzer."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 500
        }
        
        try:
            response = self.session.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Try to extract JSON from the response
            try:
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                    
                momentum = json.loads(content)
            except json.JSONDecodeError:
                print(f"⚠ JSON parsing failed for {symbol} momentum, using fallback")
                momentum = {
                    "volume_level": "normal",
                    "sentiment_change": "stable",
                    "momentum_direction": "neutral",
                    "confidence": 50,
                    "viral_posts": False
                }
            momentum['symbol'] = symbol
            momentum['timestamp'] = datetime.now().isoformat()
            
            print(f"✓ Analyzed momentum for {symbol}: {momentum.get('momentum_direction', 'unknown')}")
            return momentum
            
        except Exception as e:
            print(f"✗ Error analyzing momentum for {symbol}: {e}")
            return None
    
    def save_sentiment_csv(self, sentiments: List[Dict]):
        """Save sentiment data to CSV"""
        if not sentiments:
            return
            
        filepath = os.path.join(self.data_dir, 'sentiment.csv')
        
        fieldnames = ['symbol', 'timestamp', 'sentiment_score', 'bullish_count', 
                     'bearish_count', 'neutral_count', 'influence_score', 
                     'key_topics', 'fetched_at']
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for sentiment in sentiments:
                writer.writerow({
                    'symbol': sentiment.get('symbol', ''),
                    'timestamp': sentiment.get('timestamp', ''),
                    'sentiment_score': sentiment.get('sentiment_score', 0),
                    'bullish_count': sentiment.get('bullish_count', 0),
                    'bearish_count': sentiment.get('bearish_count', 0),
                    'neutral_count': sentiment.get('neutral_count', 0),
                    'influence_score': sentiment.get('influence_score', 0),
                    'key_topics': json.dumps(sentiment.get('key_topics', [])),
                    'fetched_at': sentiment.get('fetched_at', '')
                })
        
        print(f"📁 Saved {len(sentiments)} sentiment records to {filepath}")
    
    def save_momentum_csv(self, momentums: List[Dict]):
        """Save momentum signals to CSV"""
        if not momentums:
            return
            
        filepath = os.path.join(self.data_dir, 'momentum.csv')
        
        fieldnames = ['symbol', 'timestamp', 'volume_level', 'sentiment_change',
                     'momentum_direction', 'confidence', 'viral_posts']
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for momentum in momentums:
                writer.writerow({
                    'symbol': momentum.get('symbol', ''),
                    'timestamp': momentum.get('timestamp', ''),
                    'volume_level': momentum.get('volume_level', ''),
                    'sentiment_change': momentum.get('sentiment_change', ''),
                    'momentum_direction': momentum.get('momentum_direction', ''),
                    'confidence': momentum.get('confidence', 0),
                    'viral_posts': momentum.get('viral_posts', False)
                })
        
        print(f"📁 Saved {len(momentums)} momentum records to {filepath}")
    
    def fetch_all(self, symbols: List[str] = None):
        """Fetch all Grok data for given symbols"""
        symbols = symbols or TEST_SYMBOLS
        
        if not self.api_key:
            print("\n⚠️  Grok API key not configured!")
            print("Please set GROK_API_KEY in config.py or environment variables")
            print("Skipping Grok data fetch...\n")
            return None
        
        print(f"\n🤖 Starting Grok.AI data fetch for {len(symbols)} symbols")
        print(f"📅 Date: {TODAY}")
        print(f"📂 Output directory: {self.data_dir}\n")
        
        sentiments = []
        momentums = []
        
        for i, symbol in enumerate(symbols, 1):
            print(f"[{i}/{len(symbols)}] Processing {symbol}...")
            
            # Fetch sentiment
            sentiment = self.analyze_sentiment(symbol)
            if sentiment:
                sentiments.append(sentiment)
            
            # Rate limiting
            time.sleep(GROK_RATE_LIMIT_DELAY)
            
            # Fetch momentum signals
            momentum = self.get_momentum_signals(symbol)
            if momentum:
                momentums.append(momentum)
            
            # Rate limiting
            time.sleep(GROK_RATE_LIMIT_DELAY)
        
        # Save all data to CSV files
        print("\n💾 Saving Grok data to CSV files...")
        self.save_sentiment_csv(sentiments)
        self.save_momentum_csv(momentums)
        
        # Create/update latest symlink
        latest_link = os.path.join(RAW_DATA_DIR, 'grok', 'latest')
        if os.path.exists(latest_link):
            os.remove(latest_link)
        os.symlink(self.data_dir, latest_link)
        
        print(f"\n✅ Grok data fetch complete!")
        print(f"📊 Fetched: {len(sentiments)} sentiment analyses, {len(momentums)} momentum signals")
        
        return {
            'sentiments': sentiments,
            'momentums': momentums
        }


if __name__ == "__main__":
    # Run the fetcher
    fetcher = GrokFetcher()
    
    if not GROK_API_KEY:
        print("\n" + "="*60)
        print("⚠️  GROK API KEY NOT FOUND")
        print("="*60)
        print("\nTo use the Grok fetcher, please:")
        print("1. Get your API key from https://console.x.ai/")
        print("2. Add it to config.py: GROK_API_KEY = 'your-key-here'")
        print("3. Or set environment variable: export GROK_API_KEY='your-key-here'")
        print("\nOnce configured, run this script again.")
        print("="*60 + "\n")
    else:
        # You can specify custom symbols or use defaults
        # fetcher.fetch_all(['AAPL', 'TSLA', 'NVDA'])
        fetcher.fetch_all()  # Uses TEST_SYMBOLS from config