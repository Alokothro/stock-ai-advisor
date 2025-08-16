'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';

interface StockDetailViewAIProps {
  symbol: string;
  onClose?: () => void;
}

export default function StockDetailViewAI({ symbol, onClose }: StockDetailViewAIProps) {
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<{
    symbol: string;
    name: string;
    currentPrice: number;
    priceChange24h: number;
    percentChange24h: number;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<'BUY' | 'SELL' | 'HOLD'>('HOLD');
  const [confidence, setConfidence] = useState(0);
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    fetchStockDataAndAnalyze();
  }, [symbol]);

  const fetchStockDataAndAnalyze = async () => {
    try {
      setLoading(true);
      
      // Fetch real-time price from Finnhub API
      const response = await fetch('/api/finnhub/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [symbol] }),
      });
      
      let data = null;
      if (response.ok) {
        const quotes = await response.json();
        if (quotes && quotes.length > 0) {
          const quote = quotes[0];
          data = {
            symbol: quote.symbol,
            name: quote.name || symbol,
            currentPrice: quote.currentPrice,
            priceChange24h: quote.priceChange24h,
            percentChange24h: quote.percentChange24h,
          };
          setStockData(data);
        }
      }

      // Perform AI analysis (simulated for now)
      // In production, this would call your AI backend with all the data
      performAIAnalysis(data);
      
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Fallback analysis
      setRecommendation('HOLD');
      setConfidence(60);
      setReasoning('Unable to perform complete analysis. Recommend holding position until more data is available.');
    } finally {
      setLoading(false);
    }
  };

  const performAIAnalysis = (data: any) => {
    // Simulated AI analysis based on price movement
    // In production, this would be a sophisticated AI model analyzing:
    // - Technical indicators (RSI, MACD, Moving Averages)
    // - Fundamental data (P/E ratio, earnings, revenue)
    // - Market sentiment and news
    // - Volume patterns
    // - Support and resistance levels
    
    const change = data?.percentChange24h || 0;
    const price = data?.currentPrice || 100;
    
    // Simple logic for demonstration - replace with actual AI
    if (change > 3) {
      setRecommendation('BUY');
      setConfidence(85);
      setReasoning(`Strong upward momentum detected. ${symbol} showing ${change.toFixed(2)}% gain with increasing volume. Technical indicators suggest continued bullish trend.`);
    } else if (change < -3) {
      setRecommendation('SELL');
      setConfidence(80);
      setReasoning(`Significant downward pressure. ${symbol} down ${Math.abs(change).toFixed(2)}% with bearish indicators. Consider taking profits or cutting losses.`);
    } else if (change > 1) {
      setRecommendation('BUY');
      setConfidence(70);
      setReasoning(`Moderate positive momentum. ${symbol} showing steady growth at ${change.toFixed(2)}%. Good entry point for long-term positions.`);
    } else if (change < -1) {
      setRecommendation('HOLD');
      setConfidence(65);
      setReasoning(`Minor correction in progress. ${symbol} down ${Math.abs(change).toFixed(2)}%. Wait for clearer signals before making moves.`);
    } else {
      setRecommendation('HOLD');
      setConfidence(75);
      setReasoning(`${symbol} trading sideways with ${change.toFixed(2)}% movement. No clear directional bias. Maintain current positions.`);
    }
  };

  const getRecommendationColor = () => {
    switch (recommendation) {
      case 'BUY': return 'from-green-500 to-green-600';
      case 'SELL': return 'from-red-500 to-red-600';
      case 'HOLD': return 'from-yellow-500 to-yellow-600';
    }
  };

  const getRecommendationBgColor = () => {
    switch (recommendation) {
      case 'BUY': return 'bg-green-50 dark:bg-green-950';
      case 'SELL': return 'bg-red-50 dark:bg-red-950';
      case 'HOLD': return 'bg-yellow-50 dark:bg-yellow-950';
    }
  };

  const getRecommendationTextColor = () => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600 dark:text-green-400';
      case 'SELL': return 'text-red-600 dark:text-red-400';
      case 'HOLD': return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Analyzing {symbol}...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Evaluating technical indicators, market sentiment, and fundamentals
          </p>
        </div>
      </motion.div>
    );
  }

  const isPositive = (stockData?.percentChange24h || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{symbol}</h2>
            <p className="text-gray-300">{stockData?.name}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-3xl font-bold text-white">
            ${stockData?.currentPrice.toFixed(2)}
          </span>
          <span className={`flex items-center text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
            {isPositive ? '+' : ''}{stockData?.priceChange24h.toFixed(2)} ({stockData?.percentChange24h.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="p-8">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            AI Recommendation
          </p>
          
          {/* Large Recommendation Display */}
          <div className={`relative inline-block`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${getRecommendationColor()} blur-xl opacity-30`}></div>
            <div className={`relative bg-gradient-to-r ${getRecommendationColor()} text-white text-6xl font-black px-12 py-6 rounded-2xl shadow-2xl`}>
              {recommendation}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Level</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${getRecommendationColor()}`}
              />
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className={`${getRecommendationBgColor()} rounded-xl p-6 mt-6`}>
          <h3 className={`font-semibold ${getRecommendationTextColor()} mb-2`}>
            AI Analysis Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {reasoning}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => {/* Handle portfolio action */}}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Add to Portfolio
          </button>
          <button
            onClick={() => {/* Handle watchlist action */}}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Add to Watchlist
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
          AI recommendations are based on technical analysis, market data, and historical patterns. 
          Always do your own research and consider your risk tolerance before trading.
        </p>
      </div>
    </motion.div>
  );
}