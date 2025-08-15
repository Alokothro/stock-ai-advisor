export interface Asset {
  symbol: string;
  name?: string;
  assetType?: 'STOCK' | 'CRYPTO';
  currentPrice?: number;
  priceChange24h?: number;
  percentChange24h?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
  [key: string]: unknown;
}

export interface Analysis {
  symbol: string;
  recommendation?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidenceScore?: number;
  technicalScore?: number;
  fundamentalScore?: number;
  sentimentScore?: number;
  priceTarget?: number;
  stopLoss?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  reasoning?: string;
  [key: string]: unknown;
}