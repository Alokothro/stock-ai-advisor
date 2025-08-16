import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import Anthropic from '@anthropic-ai/sdk';
import type { Handler } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

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

async function getStockData(symbol: string) {
  const tableName = process.env.MARKET_DATA_TABLE_NAME;
  if (!tableName) throw new Error('MARKET_DATA_TABLE_NAME not set');
  
  try {
    const response = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { symbol }
    }));
    
    return response.Item;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

async function getHistoricalData(symbol: string, days: number = 30) {
  // In production, this would query historical price data
  // For now, we'll generate sample data
  const prices = [];
  const basePrice = 100 + Math.random() * 400;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const trend = Math.sin(i / 10) * 0.01;
    const random = (Math.random() - 0.5) * volatility;
    
    prices.push({
      date: date.toISOString().split('T')[0],
      price: basePrice * (1 + trend + random),
      volume: Math.floor(Math.random() * 10000000)
    });
  }
  
  return prices;
}

async function generateAIAnalysis(symbol: string, stockData: any, historicalData: any[]) {
  const client = await getAnthropicClient();
  
  // Calculate basic metrics
  const currentPrice = stockData?.currentPrice || 100;
  const priceChange = stockData?.priceChange24h || 0;
  const percentChange = stockData?.percentChange24h || 0;
  
  // Calculate technical indicators
  const prices = historicalData.map(h => h.price);
  const sma7 = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const sma30 = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  const momentum = currentPrice > sma7 ? 'BULLISH' : 'BEARISH';
  const trend = sma7 > sma30 ? 'UPTREND' : 'DOWNTREND';
  
  // Generate AI analysis
  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    temperature: 0.7,
    system: `You are a professional stock analyst providing insights for the S&P 500. 
    Analyze the given stock data and provide actionable insights. 
    Be concise, data-driven, and include both opportunities and risks.
    NEVER provide specific financial advice, just analysis and observations.
    Always include a disclaimer that this is for informational purposes only.`,
    messages: [
      {
        role: 'user',
        content: `Analyze ${symbol} stock with the following data:
        
        Current Price: $${currentPrice.toFixed(2)}
        24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${percentChange.toFixed(2)}%)
        7-day SMA: $${sma7.toFixed(2)}
        30-day SMA: $${sma30.toFixed(2)}
        Momentum: ${momentum}
        Trend: ${trend}
        
        Provide:
        1. A recommendation (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
        2. Confidence score (0-100)
        3. Price target for next 30 days
        4. Key factors supporting your analysis
        5. Main risks to consider
        
        Format your response as JSON with these fields:
        {
          "recommendation": "...",
          "confidenceScore": ...,
          "priceTarget": ...,
          "reasoning": "...",
          "riskLevel": "LOW|MEDIUM|HIGH|VERY_HIGH",
          "keyFactors": ["factor1", "factor2", "factor3"],
          "risks": ["risk1", "risk2"]
        }`
      }
    ]
  });
  
  try {
    const content = message.content[0];
    const analysisText = content.type === 'text' ? content.text : '';
    const analysis = JSON.parse(analysisText);
    
    // Save to DynamoDB
    const tableName = process.env.ANALYSIS_TABLE_NAME;
    if (tableName) {
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: {
          symbol,
          timestamp: new Date().toISOString(),
          assetType: 'STOCK',
          ...analysis,
          technicalScore: momentum === 'BULLISH' ? 70 : 30,
          fundamentalScore: 50, // Would need real fundamental data
          sentimentScore: 50, // Would need sentiment analysis
          indicators: {
            sma7,
            sma30,
            momentum,
            trend
          }
        }
      }));
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Fallback analysis
    return {
      recommendation: percentChange > 2 ? 'BUY' : percentChange < -2 ? 'SELL' : 'HOLD',
      confidenceScore: 60,
      priceTarget: currentPrice * (1 + percentChange / 100 * 2),
      reasoning: `Based on technical indicators, ${symbol} is showing ${momentum.toLowerCase()} momentum with a ${trend.toLowerCase()}.`,
      riskLevel: Math.abs(percentChange) > 5 ? 'HIGH' : 'MEDIUM',
      keyFactors: [
        `Current ${trend.toLowerCase()} pattern`,
        `${momentum} momentum indicators`,
        `Trading ${currentPrice > sma7 ? 'above' : 'below'} 7-day average`
      ],
      risks: [
        'Market volatility',
        'Sector rotation risk'
      ]
    };
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    const { symbol } = JSON.parse(event.body || '{}');
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol is required' })
      };
    }
    
    // Get current stock data
    const stockData = await getStockData(symbol);
    
    // Get historical data
    const historicalData = await getHistoricalData(symbol, 30);
    
    // Generate AI analysis
    const analysis = await generateAIAnalysis(symbol, stockData, historicalData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        symbol,
        analysis,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in AI analysis handler:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};