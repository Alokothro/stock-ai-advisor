import { NextRequest, NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/anthropic-service';
import { getQuote } from '@/lib/finnhub-service';

export async function POST(request: NextRequest) {
  try {
    const { symbol } = await request.json();
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // First, get real-time stock data from Finnhub
    const quote = await getQuote(symbol);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Unable to fetch stock data' },
        { status: 500 }
      );
    }

    // Then analyze with Claude
    const analysis = await analyzeStock(
      symbol,
      quote.c || quote.currentPrice || 100,
      quote.d || quote.priceChange24h || 0,
      quote.dp || quote.percentChange24h || 0,
      quote.volume,
      quote.h || quote.highPrice,
      quote.l || quote.lowPrice,
      quote.o || quote.openPrice
    );

    // Combine the data
    return NextResponse.json({
      symbol,
      quote,
      analysis,
    });
  } catch (error) {
    console.error('Error in AI analysis endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock' },
      { status: 500 }
    );
  }
}