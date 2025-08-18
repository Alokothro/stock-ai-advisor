import { SQSEvent, SQSRecord } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';

interface UserAnalysisMessage {
  userId: string;
  email: string;
  selectedStocks: string[];
  alertPreferences?: {
    priceThreshold?: number;
    volatilityAlert?: boolean;
  };
  timestamp: string;
}

export const handler = async (event: SQSEvent) => {
  console.log(`Processing ${event.Records.length} analysis tasks`);
  
  // Initialize Amplify Data client with IAM authentication
  const env = process.env as any;
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  
  const client = generateClient<Schema>({ authMode: 'iam' });
  
  const results = await Promise.allSettled(
    event.Records.map(record => processUserAnalysis(record, client))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Completed processing: ${successful} successful, ${failed} failed`);
  
  // Return batch item failures for retry
  const batchItemFailures = results
    .map((result, index) => {
      if (result.status === 'rejected') {
        return { itemIdentifier: event.Records[index].messageId };
      }
      return null;
    })
    .filter(item => item !== null);
  
  return {
    batchItemFailures,
  };
};

async function processUserAnalysis(
  record: SQSRecord,
  client: ReturnType<typeof generateClient<Schema>>
): Promise<void> {
  const message: UserAnalysisMessage = JSON.parse(record.body);
  
  console.log(`Processing analysis for user ${message.userId}`);
  
  try {
    // 1. Fetch current market data for selected stocks
    const stockDataPromises = message.selectedStocks.map(async (symbol) => {
      const { data } = await client.models.MarketData.list({
        filter: {
          symbol: { eq: symbol }
        },
        limit: 1
      });
      return data[0];
    });
    
    const stockData = await Promise.all(stockDataPromises);
    const validStockData = stockData.filter(data => data !== undefined);
    
    if (validStockData.length === 0) {
      console.log(`No market data found for user ${message.userId}'s stocks`);
      return;
    }
    
    // 2. Generate AI analysis using OpenAI
    const analysis = await generateAIAnalysis(validStockData, message);
    
    // 3. Store analysis results
    const analysisResult = await client.models.AnalysisHistory.create({
      userId: message.userId,
      timestamp: new Date().toISOString(),
      stocksAnalyzed: message.selectedStocks.length,
      topGainer: validStockData[0]?.symbol || null,
      topLoser: validStockData[validStockData.length - 1]?.symbol || null,
      analysis: analysis.insights,
      emailSent: false,
    });
    
    console.log(`Analysis completed for user ${message.userId}`);
    
    // 4. Update user's last analysis timestamp
    // First, get the user's preferences to find the id
    const { data: userPrefs } = await client.models.UserStockPreferences.list({
      filter: {
        userId: { eq: message.userId }
      },
      limit: 1
    });
    
    if (userPrefs && userPrefs.length > 0 && userPrefs[0].id) {
      await client.models.UserStockPreferences.update({
        id: userPrefs[0].id,
        lastAnalysisDate: new Date().toISOString(),
      });
    }
    
    // 5. Send email notification (if needed)
    if (message.email) {
      // In a real implementation, you might use SES or another email service
      // For now, we'll just log it
      console.log(`Would send email to ${message.email} with analysis results`);
    }
    
  } catch (error: any) {
    console.error(`Error processing analysis for user ${message.userId}:`, error);
    throw error; // Re-throw to mark as failed for retry
  }
}

async function generateAIAnalysis(
  stockData: any[],
  message: UserAnalysisMessage
): Promise<{
  insights: string;
  recommendations: string;
  riskScore: number;
}> {
  // Simplified AI analysis - in production, you'd use OpenAI API
  const openAIKey = process.env.OPENAI_API_KEY;
  
  if (!openAIKey) {
    console.warn('OpenAI API key not configured, using mock analysis');
    return {
      insights: `Analysis for ${stockData.length} stocks in portfolio`,
      recommendations: 'Based on current market conditions, maintain current positions',
      riskScore: Math.random() * 100,
    };
  }
  
  try {
    // Here you would make an actual call to OpenAI
    // For now, returning mock data
    const portfolioSummary = stockData.map(s => ({
      symbol: s.symbol,
      price: s.currentPrice,
      change: s.priceChange24h,
    }));
    
    return {
      insights: `Portfolio analysis: ${JSON.stringify(portfolioSummary)}`,
      recommendations: 'Diversify portfolio to reduce risk',
      riskScore: 65.5,
    };
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return {
      insights: 'Analysis temporarily unavailable',
      recommendations: 'Please check back later',
      riskScore: 0,
    };
  }
}