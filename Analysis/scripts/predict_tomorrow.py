#!/usr/bin/env python3
"""
ML-Style Price Prediction for Tomorrow
Combines Finnhub price data with Grok sentiment analysis
Acts as a simulated ML model for price prediction
"""

import os
import sys
import csv
import json
from datetime import datetime, timedelta
from typing import Dict, List

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RAW_DATA_DIR, TODAY

class StockPredictor:
    def __init__(self):
        self.quotes_file = os.path.join(RAW_DATA_DIR, 'finnhub', TODAY, 'quotes.csv')
        self.sentiment_file = os.path.join(RAW_DATA_DIR, 'grok', TODAY, 'sentiment.csv')
        self.momentum_file = os.path.join(RAW_DATA_DIR, 'grok', TODAY, 'momentum.csv')
        
    def load_data(self):
        """Load all data from CSV files"""
        # Load quotes
        quotes = {}
        with open(self.quotes_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                quotes[row['symbol']] = {
                    'current': float(row['current']),
                    'open': float(row['open']),
                    'high': float(row['high']),
                    'low': float(row['low']),
                    'prev_close': float(row['prev_close']),
                    'change': float(row['change']),
                    'change_pct': float(row['change_pct'])
                }
        
        # Load sentiment
        sentiment = {}
        with open(self.sentiment_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sentiment[row['symbol']] = {
                    'score': float(row['sentiment_score']),
                    'bullish': int(row['bullish_count']) if row['bullish_count'] else 0,
                    'bearish': int(row['bearish_count']) if row['bearish_count'] else 0,
                    'topics': json.loads(row['key_topics']) if row['key_topics'] else []
                }
        
        # Load momentum
        momentum = {}
        with open(self.momentum_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                momentum[row['symbol']] = {
                    'volume_level': row['volume_level'],
                    'direction': row['momentum_direction'],
                    'confidence': int(row['confidence'])
                }
        
        return quotes, sentiment, momentum
    
    def calculate_features(self, symbol, quote, sent, mom):
        """Calculate predictive features for a stock"""
        features = {}
        
        # Price momentum features
        features['price_momentum'] = quote['change_pct']
        features['daily_range'] = ((quote['high'] - quote['low']) / quote['current']) * 100
        features['gap_open'] = ((quote['open'] - quote['prev_close']) / quote['prev_close']) * 100
        features['close_to_high'] = ((quote['high'] - quote['current']) / quote['high']) * 100
        
        # Sentiment features
        features['sentiment_score'] = sent.get('score', 0)
        features['sentiment_ratio'] = (sent.get('bullish', 0) - sent.get('bearish', 0)) / max(sent.get('bullish', 0) + sent.get('bearish', 0), 1)
        
        # Technical indicators (simplified)
        features['rsi_proxy'] = 50 + (quote['change_pct'] * 10)  # Simplified RSI
        features['support_distance'] = ((quote['current'] - quote['low']) / quote['current']) * 100
        features['resistance_distance'] = ((quote['high'] - quote['current']) / quote['current']) * 100
        
        return features
    
    def predict_price(self, symbol, quote, features):
        """
        Simulated ML Model Prediction Logic
        This combines multiple factors to predict tomorrow's price
        """
        current_price = quote['current']
        
        # Base prediction factors
        momentum_factor = features['price_momentum'] * 0.3  # 30% weight on current momentum
        sentiment_factor = features['sentiment_score'] * 2.0  # Sentiment can move 2% max
        gap_recovery = features['gap_open'] * -0.2  # Gaps tend to fill
        range_mean_reversion = features['close_to_high'] * -0.1  # Mean reversion
        
        # Support/Resistance factors
        if features['support_distance'] < 1:  # Close to support
            support_bounce = 0.5
        else:
            support_bounce = 0
        
        if features['resistance_distance'] < 1:  # Close to resistance
            resistance_pressure = -0.3
        else:
            resistance_pressure = 0
        
        # Calculate total predicted change
        total_change_pct = (
            momentum_factor +
            sentiment_factor +
            gap_recovery +
            range_mean_reversion +
            support_bounce +
            resistance_pressure
        )
        
        # Apply volatility dampening (prevent extreme predictions)
        total_change_pct = max(-5, min(5, total_change_pct))  # Cap at ±5%
        
        # Calculate predicted price
        predicted_price = current_price * (1 + total_change_pct / 100)
        
        # Confidence calculation
        confidence = min(100, max(0,
            50 +  # Base confidence
            abs(features['sentiment_score']) * 20 +  # Higher sentiment = more confidence
            (100 - features['daily_range']) * 0.2 -  # High volatility = less confidence
            abs(features['gap_open']) * 5  # Large gaps = less confidence
        ))
        
        return {
            'current_price': current_price,
            'predicted_price': predicted_price,
            'predicted_change': predicted_price - current_price,
            'predicted_change_pct': total_change_pct,
            'confidence': confidence,
            'factors': {
                'momentum': momentum_factor,
                'sentiment': sentiment_factor,
                'gap_recovery': gap_recovery,
                'mean_reversion': range_mean_reversion,
                'support_bounce': support_bounce,
                'resistance_pressure': resistance_pressure
            }
        }
    
    def generate_predictions(self):
        """Generate predictions for all stocks"""
        quotes, sentiment, momentum = self.load_data()
        predictions = {}
        
        for symbol in quotes:
            sent = sentiment.get(symbol, {})
            mom = momentum.get(symbol, {})
            
            features = self.calculate_features(symbol, quotes[symbol], sent, mom)
            prediction = self.predict_price(symbol, quotes[symbol], features)
            
            predictions[symbol] = {
                **prediction,
                'features': features,
                'sentiment': sent,
                'momentum': mom
            }
        
        return predictions
    
    def print_report(self, predictions):
        """Print a formatted prediction report"""
        print("\n" + "="*80)
        print("🤖 ML MODEL PRICE PREDICTIONS FOR TOMORROW")
        print(f"📅 Prediction Date: {(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}")
        print("="*80)
        
        # Sort by predicted change percentage
        sorted_stocks = sorted(predictions.items(), 
                              key=lambda x: x[1]['predicted_change_pct'], 
                              reverse=True)
        
        for symbol, pred in sorted_stocks:
            direction = "📈" if pred['predicted_change'] > 0 else "📉"
            sentiment_emoji = "😊" if pred['sentiment'].get('score', 0) > 0.3 else "😐" if pred['sentiment'].get('score', 0) > -0.3 else "😟"
            
            print(f"\n{direction} {symbol}")
            print(f"├─ Current Price: ${pred['current_price']:.2f}")
            print(f"├─ Predicted Price: ${pred['predicted_price']:.2f}")
            print(f"├─ Expected Change: ${pred['predicted_change']:.2f} ({pred['predicted_change_pct']:+.2f}%)")
            print(f"├─ Confidence: {pred['confidence']:.0f}%")
            print(f"├─ Sentiment: {sentiment_emoji} {pred['sentiment'].get('score', 0):.2f}")
            
            # Key factors
            factors = pred['factors']
            print(f"└─ Key Drivers:")
            if abs(factors['momentum']) > 0.5:
                print(f"   • Momentum: {factors['momentum']:+.2f}%")
            if abs(factors['sentiment']) > 0.3:
                print(f"   • Social Sentiment: {factors['sentiment']:+.2f}%")
            if abs(factors['gap_recovery']) > 0.2:
                print(f"   • Gap Fill: {factors['gap_recovery']:+.2f}%")
            if factors['support_bounce'] > 0:
                print(f"   • Support Bounce: {factors['support_bounce']:+.2f}%")
            if factors['resistance_pressure'] < 0:
                print(f"   • Resistance: {factors['resistance_pressure']:+.2f}%")
        
        # Summary statistics
        print("\n" + "="*80)
        print("📊 MARKET OUTLOOK SUMMARY")
        print("="*80)
        
        bullish = sum(1 for _, p in predictions.items() if p['predicted_change_pct'] > 0.5)
        bearish = sum(1 for _, p in predictions.items() if p['predicted_change_pct'] < -0.5)
        neutral = len(predictions) - bullish - bearish
        avg_change = sum(p['predicted_change_pct'] for _, p in predictions.items()) / len(predictions)
        
        print(f"🔮 Overall Market Direction: ", end="")
        if avg_change > 0.5:
            print("BULLISH 🚀")
        elif avg_change < -0.5:
            print("BEARISH 🐻")
        else:
            print("NEUTRAL ➡️")
        
        print(f"📈 Bullish Stocks: {bullish}")
        print(f"📉 Bearish Stocks: {bearish}")
        print(f"➡️  Neutral Stocks: {neutral}")
        print(f"📊 Average Expected Move: {avg_change:+.2f}%")
        
        # Top picks
        print("\n🎯 TOP PICKS:")
        top_bull = sorted_stocks[0] if sorted_stocks[0][1]['predicted_change_pct'] > 0 else None
        top_bear = sorted_stocks[-1] if sorted_stocks[-1][1]['predicted_change_pct'] < 0 else None
        
        if top_bull:
            print(f"  Best Long: {top_bull[0]} (Target: ${top_bull[1]['predicted_price']:.2f}, {top_bull[1]['predicted_change_pct']:+.2f}%)")
        if top_bear:
            print(f"  Best Short: {top_bear[0]} (Target: ${top_bear[1]['predicted_price']:.2f}, {top_bear[1]['predicted_change_pct']:+.2f}%)")
        
        print("\n" + "="*80)
        print("⚠️  DISCLAIMER: This is a simulated ML prediction for demonstration purposes.")
        print("    Real trading involves risk. Always do your own research.")
        print("="*80 + "\n")

if __name__ == "__main__":
    predictor = StockPredictor()
    predictions = predictor.generate_predictions()
    predictor.print_report(predictions)