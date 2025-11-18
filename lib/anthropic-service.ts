import Anthropic from '@anthropic-ai/sdk';

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
}

export async function analyzeStock(
  symbol: string,
  currentPrice: number,
  priceChange: number,
  percentChange: number,
  volume?: number,
  highPrice?: number,
  lowPrice?: number,
  openPrice?: number
): Promise<StockAnalysis> {
  try {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `You are an expert stock analyst providing analysis on ${currentDate}.

Research and analyze ${symbol} stock using real-time data and recent news:

CURRENT MARKET DATA (${currentDate}):
Stock: ${symbol}
Current Price: $${currentPrice.toFixed(2)}
Price Change: ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)
${volume ? `Volume: ${volume.toLocaleString()}` : ''}
${highPrice ? `Day High: $${highPrice.toFixed(2)}` : ''}
${lowPrice ? `Day Low: $${lowPrice.toFixed(2)}` : ''}
${openPrice ? `Open: $${openPrice.toFixed(2)}` : ''}

INSTRUCTIONS:
1. Search for and consider recent news, earnings reports, and market sentiment for ${symbol}
2. Analyze the current price action and technical indicators
3. Consider the company's fundamentals and sector trends
4. Provide a UNIQUE analysis specific to ${symbol}'s current situation
5. Use today's date (${currentDate}) as context for your analysis

Provide your analysis in the following JSON format:
{
  "recommendation": "BUY" or "SELL" or "HOLD",
  "confidence": <number from 0-100>,
  "reasoning": "<detailed explanation mentioning specific factors about ${symbol}, recent events, or market conditions. Make this unique to ${symbol}. 3-4 sentences.>",
  "priceTarget": <target price if applicable>,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "VERY_HIGH",
  "timeHorizon": "short-term (1-3 months)" or "medium-term (3-6 months)" or "long-term (6+ months)"
}

IMPORTANT: Your reasoning MUST be specific to ${symbol}. Mention the company by name, reference recent news/events if known, and explain why THIS PARTICULAR STOCK has this recommendation at THIS PARTICULAR TIME. Do not give generic advice.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0.9,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type === 'text') {
      try {
        // Extract JSON from the response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]) as StockAnalysis;
          return analysis;
        }
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
      }
    }

    // Fallback if parsing fails
    return {
      recommendation: 'HOLD',
      confidence: 60,
      reasoning: 'Unable to perform complete analysis. Recommend holding position until more data is available.',
      riskLevel: 'MEDIUM',
    };
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    
    // Fallback analysis based on price movement
    let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM';
    
    if (percentChange > 5) {
      recommendation = 'SELL'; // Take profits
      confidence = 70;
      riskLevel = 'HIGH';
    } else if (percentChange > 2) {
      recommendation = 'HOLD';
      confidence = 65;
      riskLevel = 'MEDIUM';
    } else if (percentChange < -5) {
      recommendation = 'BUY'; // Buy the dip
      confidence = 70;
      riskLevel = 'HIGH';
    } else if (percentChange < -2) {
      recommendation = 'HOLD';
      confidence = 60;
      riskLevel = 'MEDIUM';
    }
    
    return {
      recommendation,
      confidence,
      reasoning: `Based on ${percentChange.toFixed(2)}% price movement. ${
        recommendation === 'BUY' 
          ? 'Potential buying opportunity at current levels.' 
          : recommendation === 'SELL'
          ? 'Consider taking profits after recent gains.'
          : 'Wait for clearer market signals before taking action.'
      }`,
      riskLevel,
    };
  }
}