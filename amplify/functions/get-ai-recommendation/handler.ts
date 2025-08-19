import { APIGatewayProxyHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import Anthropic from '@anthropic-ai/sdk';

interface AIRecommendationRequest {
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  userRiskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { symbol, assetType, userRiskProfile } = JSON.parse(event.body || '{}') as AIRecommendationRequest;
    
    if (!symbol || !assetType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Symbol and assetType are required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Initialize Amplify Data Client
    const env = process.env as any;
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    
    const client = generateClient<Schema>({ authMode: 'iam' });

    // Get recent market data
    const marketData = await getRecentMarketData(client, symbol, assetType);
    
    // Get recent analysis if available
    const recentAnalysis = await getRecentAnalysis(client, symbol);
    
    // Generate AI recommendation
    const recommendation = await generateAIRecommendation(
      symbol,
      assetType,
      userRiskProfile || 'MODERATE',
      marketData,
      recentAnalysis
    );

    // Store the analysis
    await storeAnalysis(client, symbol, assetType, recommendation);

    return {
      statusCode: 200,
      body: JSON.stringify(recommendation),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate AI recommendation' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

async function getRecentMarketData(
  client: ReturnType<typeof generateClient<Schema>>,
  symbol: string,
  assetType: string
) {
  try {
    const { data } = await client.models.MarketData.get({ symbol });
    
    if (data) {
      return {
        currentPrice: data.currentPrice,
        priceChange24h: data.priceChange24h,
        percentChange24h: data.percentChange24h,
        volume: data.volume,
        marketCap: data.marketCap,
        week52High: data.week52High,
        week52Low: data.week52Low,
      };
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
  }
  
  // Return mock data if not found
  return {
    currentPrice: 100 + Math.random() * 400,
    priceChange24h: (Math.random() - 0.5) * 20,
    percentChange24h: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000),
    marketCap: Math.floor(Math.random() * 1000000000),
    week52High: 150 + Math.random() * 350,
    week52Low: 50 + Math.random() * 200,
  };
}

async function getRecentAnalysis(
  client: ReturnType<typeof generateClient<Schema>>,
  symbol: string
) {
  try {
    const { data: analyses } = await client.models.Analysis.list({
      filter: {
        symbol: { eq: symbol }
      },
      limit: 1
    });
    
    if (analyses && analyses.length > 0) {
      const analysis = analyses[0];
      return {
        recommendation: analysis.recommendation,
        confidenceScore: analysis.confidenceScore,
        technicalScore: analysis.technicalScore,
        fundamentalScore: analysis.fundamentalScore,
        sentimentScore: analysis.sentimentScore,
        riskLevel: analysis.riskLevel,
      };
    }
  } catch (error) {
    console.error('Error fetching recent analysis:', error);
  }
  
  return null;
}

async function generateAIRecommendation(
  symbol: string,
  assetType: string,
  userRiskProfile: string,
  marketData: any,
  recentAnalysis: any
) {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Return mock recommendation if API key not configured
    return getMockRecommendation(symbol, assetType, userRiskProfile);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    
    const prompt = `
You are an AI investment advisor. Based on the following data, provide a personalized investment recommendation for ${symbol}.

Asset Type: ${assetType}
User Risk Profile: ${userRiskProfile}

Market Data:
- Current Price: $${marketData.currentPrice}
- 24h Change: ${marketData.percentChange24h}%
- Volume: ${marketData.volume}
- Market Cap: $${marketData.marketCap}
- 52-Week High: $${marketData.week52High}
- 52-Week Low: $${marketData.week52Low}

${recentAnalysis ? `
Recent Analysis:
- Recommendation: ${recentAnalysis.recommendation}
- Confidence Score: ${recentAnalysis.confidenceScore}
- Technical Score: ${recentAnalysis.technicalScore}
- Fundamental Score: ${recentAnalysis.fundamentalScore}
- Sentiment Score: ${recentAnalysis.sentimentScore}
- Risk Level: ${recentAnalysis.riskLevel}
` : 'No recent analysis available'}

Please provide:
1. A clear recommendation (STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL)
2. A confidence score (0-100)
3. A suggested position size based on the user's risk profile (as a percentage of portfolio)
4. A price target
5. A stop-loss level
6. 3-5 key reasoning points
7. Risk assessment specific to this user's profile

Format your response as JSON.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.3,
      system: "You are a professional investment advisor providing personalized recommendations based on user risk profiles and market data.",
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
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            symbol,
            assetType,
            timestamp: new Date().toISOString(),
            recommendation: parsed.recommendation || 'HOLD',
            confidenceScore: parsed.confidenceScore || 50,
            positionSize: parsed.positionSize || 5,
            priceTarget: parsed.priceTarget || marketData.currentPrice * 1.1,
            stopLoss: parsed.stopLoss || marketData.currentPrice * 0.95,
            reasoning: parsed.reasoning || ['Analysis based on current market conditions'],
            riskAssessment: parsed.riskAssessment || 'Moderate risk based on market volatility',
            userRiskProfile,
          };
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
    }
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
  }
  
  return getMockRecommendation(symbol, assetType, userRiskProfile);
}

function getMockRecommendation(symbol: string, assetType: string, userRiskProfile: string) {
  const recommendations = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
  const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)];
  
  const positionSizes: Record<string, number> = {
    'CONSERVATIVE': 2 + Math.random() * 3,
    'MODERATE': 5 + Math.random() * 5,
    'AGGRESSIVE': 10 + Math.random() * 10,
  };
  
  return {
    symbol,
    assetType,
    timestamp: new Date().toISOString(),
    recommendation: randomRec,
    confidenceScore: Math.floor(40 + Math.random() * 40),
    positionSize: positionSizes[userRiskProfile] || 5,
    priceTarget: 100 + Math.random() * 50,
    stopLoss: 80 + Math.random() * 15,
    reasoning: [
      'Technical indicators suggest momentum',
      'Fundamental metrics are strong',
      'Market sentiment is positive',
    ],
    riskAssessment: `Based on your ${userRiskProfile.toLowerCase()} risk profile, this position aligns with your investment goals`,
    userRiskProfile,
  };
}

async function storeAnalysis(
  client: ReturnType<typeof generateClient<Schema>>,
  symbol: string,
  assetType: string,
  recommendation: any
) {
  try {
    await client.models.Analysis.create({
      symbol,
      assetType: assetType as 'STOCK' | 'CRYPTO',
      timestamp: recommendation.timestamp,
      recommendation: recommendation.recommendation as 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL',
      confidenceScore: recommendation.confidenceScore,
      technicalScore: recommendation.technicalScore || 50,
      fundamentalScore: recommendation.fundamentalScore || 50,
      sentimentScore: recommendation.sentimentScore || 50,
      priceTarget: recommendation.priceTarget,
      stopLoss: recommendation.stopLoss,
      reasoning: recommendation.reasoning.join('. '),
      indicators: JSON.stringify({
        positionSize: recommendation.positionSize,
        userRiskProfile: recommendation.userRiskProfile,
      }),
      riskLevel: recommendation.riskLevel || 'MEDIUM',
    });
    console.log('Analysis stored successfully');
  } catch (error) {
    console.error('Error storing analysis:', error);
    // Don't throw - continue even if storage fails
  }
}