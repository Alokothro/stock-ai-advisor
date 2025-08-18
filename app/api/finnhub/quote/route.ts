import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '***REMOVED***';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Simple in-memory cache to reduce API calls
interface StockData {
  symbol: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  priceChange24h: number;
  percentChange24h: number;
  timestamp: number;
}

const cache = new Map<string, { data: StockData; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }
  
  // Check cache
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }
  
  try {
    // Fetch from Finnhub
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Finnhub data to our format
    const stockData = {
      symbol,
      currentPrice: data.c,
      openPrice: data.o,
      highPrice: data.h,
      lowPrice: data.l,
      previousClose: data.pc,
      priceChange24h: data.d,
      percentChange24h: data.dp,
      timestamp: data.t,
    };
    
    // Cache the result
    cache.set(symbol, { data: stockData, timestamp: Date.now() });
    
    return NextResponse.json(stockData);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

// Batch endpoint for multiple symbols
export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array is required' }, { status: 400 });
    }
    
    const results = [];
    
    // Process with rate limiting
    for (const symbol of symbols.slice(0, 10)) { // Limit to 10 symbols per request
      const cached = cache.get(symbol);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results.push(cached.data);
      } else {
        const response = await fetch(
          `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const stockData = {
            symbol,
            currentPrice: data.c,
            openPrice: data.o,
            highPrice: data.h,
            lowPrice: data.l,
            previousClose: data.pc,
            priceChange24h: data.d,
            percentChange24h: data.dp,
            timestamp: data.t,
          };
          
          cache.set(symbol, { data: stockData, timestamp: Date.now() });
          results.push(stockData);
        }
        
        // Rate limiting: wait 100ms between API calls
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching batch quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}