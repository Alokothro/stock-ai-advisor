import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import Anthropic from '@anthropic-ai/sdk';
import type { Handler } from 'aws-lambda';

let anthropicClient: Anthropic | null = null;

async function getAnthropicClient(): Promise<Anthropic> {
  if (anthropicClient) return anthropicClient;
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('No ANTHROPIC_API_KEY environment variable found');
    
    anthropicClient = new Anthropic({
      apiKey: apiKey
    });
    
    return anthropicClient;
  } catch (error) {
    console.error('Error getting Anthropic client:', error);
    throw error;
  }
}

async function getStockData(client: ReturnType<typeof generateClient<Schema>>, symbol: string) {
  try {
    const { data } = await client.models.MarketData.get({ symbol });
    return data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

async function getHistoricalData(symbol: string, days: number = 30) {
  // In production, this would query historical price data
  // For now, generate mock historical data
  const historicalData = [];
  const basePrice = 100 + Math.random() * 400;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dayChange = (Math.random() - 0.5) * 10;
    historicalData.push({
      date: date.toISOString().split('T')[0],
      close: basePrice + dayChange,
      volume: Math.floor(Math.random() * 10000000),
      change: dayChange
    });
  }
  
  return historicalData;
}

async function getNews(symbol: string) {
  // In production, this would fetch real news
  // For now, return mock news items
  return [
    {
      headline: `${symbol} Reports Strong Q3 Earnings`,
      sentiment: 'positive',
      date: new Date().toISOString(),
      source: 'Financial Times'
    },
    {
      headline: `Analysts Upgrade ${symbol} Price Target`,
      sentiment: 'positive',
      date: new Date(Date.now() - 86400000).toISOString(),
      source: 'Bloomberg'
    },
    {
      headline: `${symbol} Announces New Product Launch`,
      sentiment: 'neutral',
      date: new Date(Date.now() - 172800000).toISOString(),
      source: 'Reuters'
    }
  ];
}

async function generateAIAnalysis(
  anthropic: Anthropic,
  symbol: string,
  stockData: any,
  historicalData: any[],
  news: any[]
) {
  try {
    const prompt = `
You are a professional stock analyst. Analyze the following data for ${symbol} and provide a comprehensive investment analysis.

Current Stock Data:
- Price: $${stockData?.currentPrice || 'N/A'}
- 24h Change: ${stockData?.percentChange24h || 0}%
- Volume: ${stockData?.volume || 'N/A'}
- Market Cap: $${stockData?.marketCap || 'N/A'}

Historical Performance (Last 30 days):
${historicalData.slice(-5).map(d => `- ${d.date}: $${d.close.toFixed(2)}`).join('\n')}

Recent News:
${news.map(n => `- ${n.headline} (${n.sentiment})`).join('\n')}

Please provide:
1. A recommendation (BUY, HOLD, or SELL)
2. A confidence score (0-100)
3. Technical analysis score (0-100)
4. Fundamental analysis score (0-100)
5. Sentiment score based on news (0-100)
6. A price target for the next 30 days
7. A stop-loss recommendation
8. Key reasoning points (3-5 bullet points)
9. Risk level assessment (LOW, MEDIUM, HIGH, or VERY_HIGH)

Format your response as JSON.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.3,
      system: "You are a professional financial analyst providing investment advice based on data analysis. Always provide balanced, data-driven recommendations.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse the AI response
    const content = response.content[0];
    if (content.type === 'text') {
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
    }

    // Fallback response if parsing fails
    return {
      recommendation: 'HOLD',
      confidenceScore: 50,
      technicalScore: 50,
      fundamentalScore: 50,
      sentimentScore: 50,
      priceTarget: stockData?.currentPrice * 1.05,
      stopLoss: stockData?.currentPrice * 0.95,
      reasoning: ['Unable to generate detailed analysis at this time'],
      riskLevel: 'MEDIUM'
    };
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Initialize Amplify Data Client
    const env = process.env as any;
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    
    const client = generateClient<Schema>({ authMode: 'iam' });
    
    // Parse request
    const { symbol, assetType = 'STOCK' } = typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event;
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Symbol is required' })
      };
    }
    
    // Check for recent analysis in cache - DISABLED to always generate fresh analysis
    // This ensures each stock gets a unique, real-time AI recommendation
    console.log('Generating fresh AI analysis for', symbol);
    
    // Fetch current stock data
    const stockData = await getStockData(client, symbol);
    
    if (!stockData) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Stock data not found' })
      };
    }
    
    // Fetch historical data and news
    const [historicalData, news] = await Promise.all([
      getHistoricalData(symbol),
      getNews(symbol)
    ]);
    
    // Generate AI analysis
    const anthropic = await getAnthropicClient();
    const aiAnalysis = await generateAIAnalysis(
      anthropic,
      symbol,
      stockData,
      historicalData,
      news
    );
    
    // Prepare analysis record
    const analysisRecord = {
      symbol,
      assetType: assetType as 'STOCK' | 'CRYPTO',
      timestamp: new Date().toISOString(),
      recommendation: aiAnalysis.recommendation as 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL',
      confidenceScore: aiAnalysis.confidenceScore,
      technicalScore: aiAnalysis.technicalScore,
      fundamentalScore: aiAnalysis.fundamentalScore,
      sentimentScore: aiAnalysis.sentimentScore,
      priceTarget: aiAnalysis.priceTarget,
      stopLoss: aiAnalysis.stopLoss,
      reasoning: aiAnalysis.reasoning.join('. '),
      indicators: JSON.stringify({
        historical: historicalData.slice(-5),
        news: news
      }),
      riskLevel: aiAnalysis.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    };
    
    // Store analysis in database
    try {
      await client.models.Analysis.create(analysisRecord);
      console.log('Analysis stored successfully');
    } catch (storeError) {
      console.error('Error storing analysis:', storeError);
      // Continue anyway - we have the analysis to return
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisRecord)
    };
    
  } catch (error: any) {
    console.error('Error in AI analysis handler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate AI analysis',
        message: error.message 
      })
    };
  }
};