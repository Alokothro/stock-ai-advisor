export interface StockData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MomentumIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  momentum: number;
  rateOfChange: number;
}

export interface PatternResult {
  patternType: 'head-and-shoulders' | 'double-top' | 'double-bottom' | 'triangle' | 'flag' | 'wedge' | 'channel';
  confidence: number;
  startDate: Date;
  endDate: Date;
  predictedDirection: 'bullish' | 'bearish' | 'neutral';
  targetPrice?: number;
}

export interface CorrelationResult {
  symbol1: string;
  symbol2: string;
  correlation: number;
  period: string;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
}

export interface TimeSeriesForecast {
  symbol: string;
  predictions: Array<{
    date: Date;
    predictedPrice: number;
    upperBound: number;
    lowerBound: number;
    confidence: number;
  }>;
  model: 'arima' | 'lstm' | 'prophet' | 'exponential-smoothing';
  accuracy: number;
}

export interface AnalysisResult {
  symbol: string;
  timestamp: Date;
  momentum: MomentumIndicators;
  patterns: PatternResult[];
  forecast?: TimeSeriesForecast;
  recommendation: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
  confidence: number;
}