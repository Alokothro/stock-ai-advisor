import {
  FinnhubQuote,
  RecommendationTrend,
  PriceTarget,
  BasicFinancials,
} from './finnhub-service';

export interface QuantSignal {
  score: number; // -100 (strong sell) to +100 (strong buy)
  label: 'STRONG_SELL' | 'SELL' | 'NEUTRAL' | 'BUY' | 'STRONG_BUY';
  factors: string[];
}

/**
 * Internal technical/quant decision engine.
 * Produces a deterministic trend signal from market data, independent of the LLM,
 * so the AI's qualitative reasoning is grounded in an actual quantitative read
 * of momentum, analyst consensus, and valuation vs. 52-week range.
 */
export function computeQuantSignal(
  quote: FinnhubQuote,
  recommendations: RecommendationTrend[],
  priceTarget: PriceTarget | null,
  financials: BasicFinancials | null
): QuantSignal {
  const factors: string[] = [];
  let score = 0;

  // 1. Intraday momentum (weight: up to +-20)
  const momentumPoints = Math.max(-20, Math.min(20, quote.dp * 4));
  score += momentumPoints;
  if (Math.abs(quote.dp) >= 1) {
    factors.push(
      `Momentum: ${quote.dp >= 0 ? 'up' : 'down'} ${Math.abs(quote.dp).toFixed(2)}% today`
    );
  }

  // 2. Position within the day's range (weight: up to +-10)
  const dayRange = quote.h - quote.l;
  if (dayRange > 0) {
    const positionInRange = (quote.c - quote.l) / dayRange; // 0 = at low, 1 = at high
    const rangePoints = (positionInRange - 0.5) * 20;
    score += rangePoints;
    if (positionInRange > 0.85) factors.push('Trading near today\'s high');
    if (positionInRange < 0.15) factors.push('Trading near today\'s low');
  }

  // 3. Position within 52-week range (weight: up to +-25)
  if (financials?.fiftyTwoWeekHigh && financials?.fiftyTwoWeekLow) {
    const { fiftyTwoWeekHigh: high, fiftyTwoWeekLow: low } = financials;
    if (high > low) {
      const posIn52w = (quote.c - low) / (high - low);
      // Near 52-week high = momentum/strength signal (slightly bullish lean)
      // Near 52-week low = could be value OR a downtrend — treat neutrally-to-cautious
      const points52w = (posIn52w - 0.5) * 30;
      score += points52w;
      if (posIn52w > 0.95) factors.push('Near 52-week high');
      else if (posIn52w < 0.1) factors.push('Near 52-week low');
      else factors.push(`${Math.round(posIn52w * 100)}% of the way through its 52-week range`);
    }
  }

  // 4. Analyst consensus (weight: up to +-30) — most recent period
  const latestRec = recommendations[0];
  if (latestRec) {
    const total = latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell;
    if (total > 0) {
      const bullish = latestRec.strongBuy * 2 + latestRec.buy;
      const bearish = latestRec.strongSell * 2 + latestRec.sell;
      const netAnalyst = ((bullish - bearish) / (total * 2)) * 30;
      score += netAnalyst;
      factors.push(
        `Analyst consensus: ${latestRec.strongBuy + latestRec.buy} buy / ${latestRec.hold} hold / ${latestRec.sell + latestRec.strongSell} sell (${total} analysts)`
      );
    }
  }

  // 5. Price target vs current price (weight: up to +-15)
  if (priceTarget?.targetMean) {
    const upside = ((priceTarget.targetMean - quote.c) / quote.c) * 100;
    const targetPoints = Math.max(-15, Math.min(15, upside));
    score += targetPoints;
    factors.push(
      `Analyst mean price target $${priceTarget.targetMean.toFixed(2)} implies ${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% ${upside >= 0 ? 'upside' : 'downside'}`
    );
  }

  score = Math.max(-100, Math.min(100, Math.round(score)));

  let label: QuantSignal['label'];
  if (score <= -50) label = 'STRONG_SELL';
  else if (score <= -15) label = 'SELL';
  else if (score < 15) label = 'NEUTRAL';
  else if (score < 50) label = 'BUY';
  else label = 'STRONG_BUY';

  return { score, label, factors };
}
