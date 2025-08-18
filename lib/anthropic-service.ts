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
    const prompt = `You are an expert stock analyst. Analyze the following stock and provide a clear investment recommendation.

Stock: ${symbol}
Current Price: $${currentPrice.toFixed(2)}
Price Change: ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)
${volume ? `Volume: ${volume.toLocaleString()}` : ''}
${highPrice ? `Day High: $${highPrice.toFixed(2)}` : ''}
${lowPrice ? `Day Low: $${lowPrice.toFixed(2)}` : ''}
${openPrice ? `Open: $${openPrice.toFixed(2)}` : ''}

Provide your analysis in the following JSON format:
{
  "recommendation": "BUY" or "SELL" or "HOLD",
  "confidence": <number from 0-100>,
  "reasoning": "<brief explanation of your recommendation in 2-3 sentences>",
  "priceTarget": <optional target price>,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "VERY_HIGH",
  "timeHorizon": "<optional time frame like 'short-term' or 'long-term'>"
}

Consider:
1. Recent price movement and momentum
2. Volatility (difference between high and low)
3. Volume patterns if available
4. Overall market conditions
5. Risk/reward ratio

Be decisive but realistic. Base your confidence on the strength of the signals.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.3,
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