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

export interface RecommendationTrend {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface CompanyNewsItem {
  headline: string;
  summary: string;
  source: string;
  datetime: number;
  url: string;
}

export interface BasicFinancials {
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  tenDayAverageVolume?: number;
  threeMonthAverageVolume?: number;
  peBasicExclExtraTTM?: number;
  epsTTM?: number;
  beta?: number;
  priceRelativeToSP500_52Week?: number;
}

/**
 * Analyst recommendation trends (buy/hold/sell counts) — free tier
 */
export async function getRecommendationTrends(symbol: string): Promise<RecommendationTrend[]> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data)
      ? data.map((d) => ({
          buy: d.buy,
          hold: d.hold,
          sell: d.sell,
          strongBuy: d.strongBuy,
          strongSell: d.strongSell,
          period: d.period,
        }))
      : [];
  } catch (error) {
    console.error(`Error fetching recommendation trends for ${symbol}:`, error);
    return [];
  }
}

/**
 * Analyst price targets — free tier
 */
export async function getPriceTarget(symbol: string): Promise<PriceTarget | null> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/price-target?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data.targetMean !== 'number') return null;
    return {
      targetHigh: data.targetHigh,
      targetLow: data.targetLow,
      targetMean: data.targetMean,
      targetMedian: data.targetMedian,
    };
  } catch (error) {
    console.error(`Error fetching price target for ${symbol}:`, error);
    return null;
  }
}

/**
 * Recent company news (last 7 days) — free tier
 */
export async function getCompanyNews(symbol: string, days = 7): Promise<CompanyNewsItem[]> {
  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const response = await fetch(
      `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 8).map((item) => ({
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      datetime: item.datetime,
      url: item.url,
    }));
  } catch (error) {
    console.error(`Error fetching company news for ${symbol}:`, error);
    return [];
  }
}

/**
 * Basic financial metrics incl. 52-week range, volume averages, valuation — free tier
 */
export async function getBasicFinancials(symbol: string): Promise<BasicFinancials | null> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const m = data?.metric;
    if (!m) return null;
    return {
      fiftyTwoWeekHigh: m['52WeekHigh'],
      fiftyTwoWeekLow: m['52WeekLow'],
      tenDayAverageVolume: m['10DayAverageTradingVolume'],
      threeMonthAverageVolume: m['3MonthAverageTradingVolume'],
      peBasicExclExtraTTM: m['peBasicExclExtraTTM'],
      epsTTM: m['epsTTM'],
      beta: m['beta'],
      priceRelativeToSP500_52Week: m['priceRelativeToS&P50052Week'],
    };
  } catch (error) {
    console.error(`Error fetching basic financials for ${symbol}:`, error);
    return null;
  }
}

/**
 * Format price change for display
 */
export function formatPriceChange(change: number, percentChange: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)`;
}