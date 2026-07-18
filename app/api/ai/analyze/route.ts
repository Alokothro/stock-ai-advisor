import { NextRequest, NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/anthropic-service';
import { computeQuantSignal } from '@/lib/decision-engine';
import {
  getQuote,
  getCompanyProfile,
  getRecommendationTrends,
  getPriceTarget,
  getCompanyNews,
  getBasicFinancials,
} from '@/lib/finnhub-service';

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

    // Gather quote plus all research inputs for the quant engine and Claude in parallel
    const [quote, profile, recommendations, priceTarget, news, financials] = await Promise.all([
      getQuote(symbol),
      getCompanyProfile(symbol),
      getRecommendationTrends(symbol),
      getPriceTarget(symbol),
      getCompanyNews(symbol),
      getBasicFinancials(symbol),
    ]);

    if (!quote || !quote.c) {
      return NextResponse.json(
        { error: `Unable to fetch stock data for ${symbol}` },
        { status: 502 }
      );
    }

    console.log(`${symbol} Quote:`, {
      price: quote.c,
      change: quote.d,
      percentChange: quote.dp,
    });

    const quantSignal = computeQuantSignal(quote, recommendations, priceTarget, financials);
    console.log(`${symbol} Quant Signal:`, quantSignal);

    const analysis = await analyzeStock({
      symbol,
      companyName: profile?.name,
      sector: profile?.finnhubIndustry,
      currentPrice: quote.c,
      priceChange: quote.d || 0,
      percentChange: quote.dp || 0,
      volume: financials?.tenDayAverageVolume,
      highPrice: quote.h || 0,
      lowPrice: quote.l || 0,
      openPrice: quote.o || 0,
      marketCap: profile?.marketCapitalization,
      quantSignal,
      recommendations,
      priceTarget,
      financials,
      news,
    });

    console.log(`${symbol} Analysis:`, {
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      isFallback: analysis.isFallback,
    });

    return NextResponse.json({
      symbol,
      quote: {
        ...quote,
        name: profile?.name || symbol,
        sector: profile?.finnhubIndustry,
        marketCap: profile?.marketCapitalization,
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
