/**
 * Finnhub API Service
 * Provides real-time stock data for S&P 500 stocks
 * 
 * API Key: ***REMOVED***
 * 
 * Available Endpoints:
 * - /quote - Real-time price data (c: current, o: open, h: high, l: low, pc: previous close, d: change, dp: change %)
 * - /stock/profile2 - Company information (name, sector, market cap, etc.)
 * - /stock/candle - Historical data (requires paid plan)
 * 
 * Rate Limits:
 * - 60 API calls/minute for free tier
 * - 30 API calls/second hard limit
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  priceChange: number;
  percentChange: number;
  volume?: number;
  marketCap?: number;
  sector?: string;
  logo?: string;
  timestamp: number;
}

/**
 * Fetch real-time quote for a single stock
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch quote for ${symbol}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch company profile
 */
export async function getCompanyProfile(symbol: string): Promise<FinnhubProfile | null> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch profile for ${symbol}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Batch fetch quotes for multiple symbols with rate limiting
 */
export async function getBatchQuotes(symbols: string[], delayMs = 50): Promise<Map<string, StockData>> {
  const results = new Map<string, StockData>();
  
  // Process in chunks to respect rate limits (60 calls/minute = 1 call/second)
  // We'll be conservative and do 50ms between calls
  for (const symbol of symbols) {
    const quote = await getQuote(symbol);
    
    if (quote) {
      results.set(symbol, {
        symbol,
        name: symbol, // Will be enriched with profile data if needed
        currentPrice: quote.c,
        openPrice: quote.o,
        highPrice: quote.h,
        lowPrice: quote.l,
        previousClose: quote.pc,
        priceChange: quote.d,
        percentChange: quote.dp,
        timestamp: quote.t,
      });
    }
    
    // Rate limiting delay
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Get enriched stock data with both quote and profile
 */
export async function getEnrichedStockData(symbol: string): Promise<StockData | null> {
  const [quote, profile] = await Promise.all([
    getQuote(symbol),
    getCompanyProfile(symbol)
  ]);
  
  if (!quote) return null;
  
  return {
    symbol,
    name: profile?.name || symbol,
    currentPrice: quote.c,
    openPrice: quote.o,
    highPrice: quote.h,
    lowPrice: quote.l,
    previousClose: quote.pc,
    priceChange: quote.d,
    percentChange: quote.dp,
    marketCap: profile?.marketCapitalization,
    sector: profile?.finnhubIndustry,
    logo: profile?.logo,
    timestamp: quote.t,
  };
}

/**
 * Format price change for display
 */
export function formatPriceChange(change: number, percentChange: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)`;
}