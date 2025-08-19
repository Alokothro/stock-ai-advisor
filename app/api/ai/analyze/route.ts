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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteData = quote as any; // Type assertion for flexibility with Finnhub response
    const analysis = await analyzeStock(
      symbol,
      quoteData.c || 100,
      quoteData.d || 0,
      quoteData.dp || 0,
      quoteData.volume || 0,
      quoteData.h || 0,
      quoteData.l || 0,
      quoteData.o || quoteData.openPrice || 0
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