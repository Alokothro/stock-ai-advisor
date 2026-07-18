import Anthropic from '@anthropic-ai/sdk';
import { QuantSignal } from './decision-engine';
import { CompanyNewsItem, RecommendationTrend, PriceTarget, BasicFinancials } from './finnhub-service';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface StockAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasoning: string;
  priceTarget?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  timeHorizon?: string;
  isFallback?: boolean;
  quantSignal?: QuantSignal;
}

export interface AnalysisContext {
  symbol: string;
  companyName?: string;
  sector?: string;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  volume?: number;
  highPrice?: number;
  lowPrice?: number;
  openPrice?: number;
  marketCap?: number;
  quantSignal: QuantSignal;
  recommendations: RecommendationTrend[];
  priceTarget: PriceTarget | null;
  financials: BasicFinancials | null;
  news: CompanyNewsItem[];
}

export async function analyzeStock(ctx: AnalysisContext): Promise<StockAnalysis> {
  const {
    symbol,
    companyName,
    sector,
    currentPrice,
    priceChange,
    percentChange,
    volume,
    highPrice,
    lowPrice,
    openPrice,
    marketCap,
    quantSignal,
    recommendations,
    priceTarget,
    financials,
    news,
  } = ctx;

  try {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const newsBlock = news.length
      ? news
          .map((n) => `- [${new Date(n.datetime * 1000).toLocaleDateString()}] ${n.headline} (${n.source})`)
          .join('\n')
      : 'No recent company-specific news available from Finnhub — rely on web search for the latest developments.';

    const latestRec = recommendations[0];
    const analystBlock = latestRec
      ? `Strong Buy: ${latestRec.strongBuy}, Buy: ${latestRec.buy}, Hold: ${latestRec.hold}, Sell: ${latestRec.sell}, Strong Sell: ${latestRec.strongSell} (period: ${latestRec.period})`
      : 'No analyst recommendation data available.';

    const prompt = `You are a senior equity research analyst producing an institutional-grade recommendation on ${currentDate}.

You have TWO sources of ground truth you MUST incorporate — do not ignore or contradict them without explicit justification:

1. AN INTERNAL QUANTITATIVE DECISION ENGINE has already scored ${symbol}'s technical/market trend on a scale of -100 (strong sell) to +100 (strong buy), based on intraday momentum, position within the 52-week range, analyst consensus, and price-target upside:
   QUANT SIGNAL: ${quantSignal.label} (score: ${quantSignal.score}/100)
   Contributing factors:
${quantSignal.factors.map((f) => `   - ${f}`).join('\n')}

2. LIVE WEB SEARCH — use it now to pull the latest news, earnings results, analyst rating changes, and sector developments for ${symbol} (${companyName || symbol}) that may not be reflected in the data below. Prioritize anything from the last 1-2 weeks.

RAW MARKET DATA (as of ${currentDate}):
Stock: ${symbol}${companyName ? ` (${companyName})` : ''}${sector ? ` — ${sector}` : ''}
Current Price: $${currentPrice.toFixed(2)}
Price Change: ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)
${volume ? `Volume: ${volume.toLocaleString()}` : ''}
${highPrice ? `Day High: $${highPrice.toFixed(2)}` : ''}
${lowPrice ? `Day Low: $${lowPrice.toFixed(2)}` : ''}
${openPrice ? `Open: $${openPrice.toFixed(2)}` : ''}
${marketCap ? `Market Cap: $${marketCap.toLocaleString()}M` : ''}
${financials?.fiftyTwoWeekHigh ? `52-Week High: $${financials.fiftyTwoWeekHigh.toFixed(2)}` : ''}
${financials?.fiftyTwoWeekLow ? `52-Week Low: $${financials.fiftyTwoWeekLow.toFixed(2)}` : ''}
${financials?.peBasicExclExtraTTM ? `P/E (TTM): ${financials.peBasicExclExtraTTM.toFixed(1)}` : ''}
${financials?.beta ? `Beta: ${financials.beta.toFixed(2)}` : ''}

ANALYST CONSENSUS:
${analystBlock}
${priceTarget ? `Mean Price Target: $${priceTarget.targetMean.toFixed(2)} (range $${priceTarget.targetLow.toFixed(2)}-$${priceTarget.targetHigh.toFixed(2)})` : ''}

RECENT NEWS (Finnhub):
${newsBlock}

INSTRUCTIONS:
1. Use web search to verify and supplement the above with the latest ${symbol} news, earnings, and analyst actions.
2. Weigh the quant signal (${quantSignal.label}, ${quantSignal.score}/100) as a real input — you may override it, but only if your research gives a clear, specific reason to.
3. Produce a UNIQUE, specific analysis for ${symbol} — reference actual events, numbers, and reasoning. No generic filler.
4. Your confidence score should reflect how well the quant signal, analyst consensus, and news all agree with each other — high agreement = high confidence, conflicting signals = lower confidence.

Respond with ONLY a JSON object in this exact format as your final message (no markdown fences, no commentary before or after):
{
  "recommendation": "BUY" or "SELL" or "HOLD",
  "confidence": <number from 0-100>,
  "reasoning": "<4-6 sentences, specific to ${symbol}, citing concrete factors from your research and the quant signal>",
  "priceTarget": <your own target price as a number>,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "VERY_HIGH",
  "timeHorizon": "short-term (1-3 months)" or "medium-term (3-6 months)" or "long-term (6+ months)"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      ],
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Concatenate all text blocks (Claude may interleave search calls with text)
    // and take the JSON from the last one, since that's the final synthesized answer.
    const textBlocks = response.content.filter((block) => block.type === 'text');
    const combinedText = textBlocks.map((b) => (b as { text: string }).text).join('\n');

    if (combinedText) {
      try {
        const jsonMatches = combinedText.match(/\{[\s\S]*\}/g);
        const lastJson = jsonMatches?.[jsonMatches.length - 1];
        if (lastJson) {
          const analysis = JSON.parse(lastJson) as StockAnalysis;
          return { ...analysis, quantSignal };
        }
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError, combinedText);
      }
    }

    // Fallback if parsing fails — lean on the quant engine instead of a generic message
    return quantFallback(quantSignal, percentChange, true);
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return quantFallback(quantSignal, percentChange, true);
  }
}

/**
 * Fallback that leans entirely on the internal quant engine rather than a generic message,
 * used when Claude's API call fails or its response can't be parsed.
 */
function quantFallback(quantSignal: QuantSignal, percentChange: number, isFallback: boolean): StockAnalysis {
  const recommendation: 'BUY' | 'SELL' | 'HOLD' =
    quantSignal.label === 'STRONG_BUY' || quantSignal.label === 'BUY'
      ? 'BUY'
      : quantSignal.label === 'STRONG_SELL' || quantSignal.label === 'SELL'
      ? 'SELL'
      : 'HOLD';

  const confidence = Math.min(75, 40 + Math.abs(quantSignal.score) * 0.4);
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' =
    Math.abs(percentChange) > 5 ? 'HIGH' : Math.abs(percentChange) > 2 ? 'MEDIUM' : 'LOW';

  return {
    recommendation,
    confidence: Math.round(confidence),
    reasoning: `AI research was unavailable, so this recommendation is based on our internal quant engine: ${quantSignal.label.replace('_', ' ')} (score ${quantSignal.score}/100). ${
      quantSignal.factors.length ? quantSignal.factors.join('. ') + '.' : ''
    }`,
    riskLevel,
    isFallback,
    quantSignal,
  };
}
