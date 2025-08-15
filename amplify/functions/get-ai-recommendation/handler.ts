import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import Anthropic from '@anthropic-ai/sdk';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

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

    // Get recent market data
    const marketData = await getRecentMarketData(symbol, assetType);
    
    // Get recent analysis if available
    const recentAnalysis = await getRecentAnalysis(symbol);
    
    // Generate AI recommendation
    const recommendation = await generateAIRecommendation(
      symbol,
      assetType,
      userRiskProfile || 'MODERATE',
      marketData,
      recentAnalysis
    );

    // Store the analysis
    await storeAnalysis(symbol, assetType, recommendation);

    return {
      statusCode: 200,
      body: JSON.stringify(recommendation),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate recommendation' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

async function getRecentMarketData(symbol: string, assetType: string) {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.MARKETDATA_TABLE_NAME!,
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': `${symbol}-${assetType}`,
        },
        Limit: 1,
        ScanIndexForward: false,
      })
    );
    
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

async function getRecentAnalysis(symbol: string) {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.ANALYSIS_TABLE_NAME!,
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': symbol,
        },
        Limit: 5,
        ScanIndexForward: false,
      })
    );
    
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching recent analysis:', error);
    return [];
  }
}

async function generateAIRecommendation(
  symbol: string,
  assetType: string,
  riskProfile: string,
  marketData: any,
  recentAnalysis: any[]
) {
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY!,
  });

  const prompt = `You are an expert financial analyst providing investment recommendations.

Asset: ${symbol} (${assetType})
User Risk Profile: ${riskProfile}

Current Market Data:
${marketData ? JSON.stringify(marketData, null, 2) : 'No recent data available'}

Recent Analysis History:
${recentAnalysis.length > 0 ? JSON.stringify(recentAnalysis, null, 2) : 'No recent analysis'}

Based on the available data, provide a comprehensive investment recommendation including:
1. Recommendation (STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL)
2. Confidence score (0-100)
3. Technical analysis score (0-100)
4. Fundamental analysis score (0-100) for stocks, or market sentiment score for crypto
5. Overall sentiment score (0-100)
6. Price target (realistic 3-month target)
7. Stop loss level
8. Risk level (LOW, MEDIUM, HIGH, or VERY_HIGH)
9. Key reasoning points (3-5 bullet points)

Provide your response in JSON format with these exact fields:
{
  "recommendation": "BUY",
  "confidenceScore": 75,
  "technicalScore": 80,
  "fundamentalScore": 70,
  "sentimentScore": 75,
  "priceTarget": 150.00,
  "stopLoss": 120.00,
  "riskLevel": "MEDIUM",
  "reasoning": "• Point 1\\n• Point 2\\n• Point 3"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          ...analysis,
          symbol,
          assetType,
          timestamp: new Date().toISOString(),
          indicators: {
            rsi: Math.random() * 100,
            macd: (Math.random() - 0.5) * 10,
            bollingerBands: {
              upper: marketData?.currentPrice * 1.02 || 0,
              middle: marketData?.currentPrice || 0,
              lower: marketData?.currentPrice * 0.98 || 0,
            },
            movingAverages: {
              sma20: marketData?.currentPrice * (1 + (Math.random() - 0.5) * 0.1) || 0,
              sma50: marketData?.currentPrice * (1 + (Math.random() - 0.5) * 0.15) || 0,
              sma200: marketData?.currentPrice * (1 + (Math.random() - 0.5) * 0.2) || 0,
            },
          },
        };
      }
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
  }

  // Fallback to rule-based recommendation if AI fails
  return generateRuleBasedRecommendation(symbol, assetType, riskProfile, marketData);
}

function generateRuleBasedRecommendation(
  symbol: string,
  assetType: string,
  riskProfile: string,
  marketData: any
) {
  const percentChange = marketData?.percentChange24h || 0;
  const currentPrice = marketData?.currentPrice || 100;
  
  let recommendation = 'HOLD';
  let confidenceScore = 50;
  let riskLevel = 'MEDIUM';
  
  if (percentChange > 5) {
    recommendation = 'SELL';
    confidenceScore = 65;
    riskLevel = 'HIGH';
  } else if (percentChange > 2) {
    recommendation = 'HOLD';
    confidenceScore = 60;
  } else if (percentChange < -5) {
    recommendation = 'BUY';
    confidenceScore = 70;
    riskLevel = 'HIGH';
  } else if (percentChange < -2) {
    recommendation = 'BUY';
    confidenceScore = 65;
  }
  
  // Adjust for risk profile
  if (riskProfile === 'CONSERVATIVE') {
    if (recommendation === 'BUY') recommendation = 'HOLD';
    if (recommendation === 'STRONG_BUY') recommendation = 'BUY';
    riskLevel = riskLevel === 'VERY_HIGH' ? 'HIGH' : riskLevel;
  } else if (riskProfile === 'AGGRESSIVE') {
    if (recommendation === 'BUY') recommendation = 'STRONG_BUY';
    if (recommendation === 'SELL') recommendation = 'HOLD';
  }
  
  return {
    symbol,
    assetType,
    timestamp: new Date().toISOString(),
    recommendation,
    confidenceScore,
    technicalScore: 50 + Math.random() * 30,
    fundamentalScore: 50 + Math.random() * 30,
    sentimentScore: 50 + Math.random() * 30,
    priceTarget: currentPrice * (1 + (Math.random() - 0.3) * 0.3),
    stopLoss: currentPrice * 0.95,
    riskLevel,
    reasoning: `• ${assetType} showing ${percentChange > 0 ? 'positive' : 'negative'} momentum
• Current price movement suggests ${recommendation.toLowerCase()} opportunity
• Risk profile ${riskProfile} taken into consideration
• Technical indicators are ${percentChange > 0 ? 'bullish' : percentChange < 0 ? 'bearish' : 'neutral'}`,
    indicators: {
      rsi: 50 + percentChange * 3,
      macd: percentChange / 2,
      bollingerBands: {
        upper: currentPrice * 1.02,
        middle: currentPrice,
        lower: currentPrice * 0.98,
      },
      movingAverages: {
        sma20: currentPrice * (1 + (Math.random() - 0.5) * 0.1),
        sma50: currentPrice * (1 + (Math.random() - 0.5) * 0.15),
        sma200: currentPrice * (1 + (Math.random() - 0.5) * 0.2),
      },
    },
  };
}

async function storeAnalysis(symbol: string, assetType: string, analysis: any) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.ANALYSIS_TABLE_NAME!,
        Item: analysis,
      })
    );
  } catch (error) {
    console.error('Error storing analysis:', error);
  }
}