import { NextRequest, NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/anthropic-service';
import { getQuote, getCompanyProfile } from '@/lib/finnhub-service';

// Disable caching to ensure fresh data for each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { symbol } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching fresh data for ${symbol} at ${new Date().toISOString()}`);

    // Fetch both quote and company profile for enriched analysis
    const [quote, profile] = await Promise.all([
      getQuote(symbol),
      getCompanyProfile(symbol)
    ]);

    if (!quote) {
      return NextResponse.json(
        { error: 'Unable to fetch stock data' },
        { status: 500 }
      );
    }

    // Log the actual quote data to verify it's different for each stock
    console.log(`${symbol} Quote:`, {
      price: quote.c,
      change: quote.d,
      percentChange: quote.dp
    });

    // Then analyze with Claude using fresh data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteData = quote as any;
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

    console.log(`${symbol} Analysis:`, {
      recommendation: analysis.recommendation,
      confidence: analysis.confidence
    });

    // Combine the data with enriched company info
    return NextResponse.json({
      symbol,
      quote: {
        ...quote,
        name: profile?.name || symbol,
        sector: profile?.finnhubIndustry,
        marketCap: profile?.marketCapitalization
      },
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