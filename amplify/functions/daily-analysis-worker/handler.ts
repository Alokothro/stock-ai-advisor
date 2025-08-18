import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutItemCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import OpenAI from 'openai';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MARKET_DATA_TABLE = process.env.MARKET_DATA_TABLE;
const ANALYSIS_HISTORY_TABLE = process.env.ANALYSIS_HISTORY_TABLE;

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

interface StockData {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  marketCap: number;
}

export const handler = async (event: SQSEvent) => {
  const results = [];
  
  // Process each message (user) individually
  for (const record of event.Records) {
    try {
      const result = await processUserAnalysis(record);
      results.push({ messageId: record.messageId, status: 'success', result });
    } catch (error) {
      console.error(`Error processing message ${record.messageId}:`, error);
      results.push({ 
        messageId: record.messageId, 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      // Don't throw - let other messages process
    }
  }
  
  // Return batch item failures for retry
  const failedMessageIds = results
    .filter(r => r.status === 'failed')
    .map(r => ({ itemIdentifier: r.messageId }));
  
  return {
    batchItemFailures: failedMessageIds,
  };
};

async function processUserAnalysis(record: SQSRecord) {
  const message: UserAnalysisMessage = JSON.parse(record.body);
  console.log(`Processing analysis for user ${message.userId} with ${message.selectedStocks.length} stocks`);
  
  // 1. Fetch current market data for user's selected stocks
  const stockData = await fetchStockData(message.selectedStocks);
  
  // 2. Generate AI analysis
  const analysis = await generatePortfolioAnalysis(stockData, message.alertPreferences);
  
  // 3. Save analysis to history
  await saveAnalysisHistory(message.userId, analysis, stockData);
  
  // 4. Send email
  await sendAnalysisEmail(message.email, analysis, stockData);
  
  return {
    userId: message.userId,
    stocksAnalyzed: message.selectedStocks.length,
    emailSent: true,
  };
}

async function fetchStockData(symbols: string[]): Promise<StockData[]> {
  // Batch get items from DynamoDB
  const keys = symbols.map(symbol => ({ symbol }));
  
  const command = new BatchGetCommand({
    RequestItems: {
      [MARKET_DATA_TABLE!]: {
        Keys: keys,
      },
    },
  });
  
  const response = await docClient.send(command);
  const items = response.Responses?.[MARKET_DATA_TABLE!] || [];
  
  return items.map(item => ({
    symbol: item.symbol,
    currentPrice: item.currentPrice,
    previousClose: item.previousClose,
    changePercent: ((item.currentPrice - item.previousClose) / item.previousClose) * 100,
    volume: item.volume,
    high: item.dayHigh,
    low: item.dayLow,
    marketCap: item.marketCap,
  }));
}

async function generatePortfolioAnalysis(stockData: StockData[], alertPreferences?: any) {
  const topGainer = stockData.reduce((prev, current) => 
    prev.changePercent > current.changePercent ? prev : current
  );
  
  const topLoser = stockData.reduce((prev, current) => 
    prev.changePercent < current.changePercent ? prev : current
  );
  
  const prompt = `
    Analyze this portfolio of ${stockData.length} S&P 500 stocks:
    
    Top Performer: ${topGainer.symbol} (+${topGainer.changePercent.toFixed(2)}%)
    Biggest Decline: ${topLoser.symbol} (${topLoser.changePercent.toFixed(2)}%)
    
    Stock Details:
    ${stockData.map(s => `${s.symbol}: $${s.currentPrice} (${s.changePercent.toFixed(2)}%)`).join('\\n')}
    
    Provide:
    1. Portfolio health assessment
    2. Key opportunities and risks
    3. Sector diversification insights
    4. 2-3 actionable recommendations
    
    Keep it concise and focused on actionable insights.
  `;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}

async function saveAnalysisHistory(userId: string, analysis: string | null, stockData: StockData[]) {
  const command = new PutItemCommand({
    TableName: ANALYSIS_HISTORY_TABLE,
    Item: {
      userId,
      timestamp: new Date().toISOString(),
      analysis,
      stocksAnalyzed: stockData.length,
      topGainer: stockData.reduce((prev, current) => 
        prev.changePercent > current.changePercent ? prev : current
      ).symbol,
      topLoser: stockData.reduce((prev, current) => 
        prev.changePercent < current.changePercent ? prev : current
      ).symbol,
    },
  });
  
  await docClient.send(command);
}

async function sendAnalysisEmail(email: string, analysis: string | null, stockData: StockData[]) {
  const topGainer = stockData.reduce((prev, current) => 
    prev.changePercent > current.changePercent ? prev : current
  );
  
  const topLoser = stockData.reduce((prev, current) => 
    prev.changePercent < current.changePercent ? prev : current
  );
  
  const emailBody = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your S&P 500 Portfolio Daily Insights - ${new Date().toLocaleDateString()}</h2>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Portfolio Overview</h3>
          <p>Total stocks tracked: <strong>${stockData.length}</strong></p>
          <p style="color: green;">Top performer: ${topGainer.symbol} +${topGainer.changePercent.toFixed(2)}%</p>
          <p style="color: red;">Biggest decline: ${topLoser.symbol} ${topLoser.changePercent.toFixed(2)}%</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3>AI Analysis</h3>
          <div style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            ${analysis?.replace(/\\n/g, '<br>')}
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h3>Your Stocks Performance</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; text-align: left;">Symbol</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Change</th>
            </tr>
            ${stockData.map(stock => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${stock.symbol}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${stock.currentPrice.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: ${stock.changePercent >= 0 ? 'green' : 'red'};">
                  ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>This is an automated daily analysis from Stock AI Advisor.</p>
          <p>To manage your preferences, visit your account settings.</p>
        </div>
      </body>
    </html>
  `;
  
  const command = new SendEmailCommand({
    Source: 'noreply@stockaiadvisor.com',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Your Portfolio Daily Insights - ${new Date().toLocaleDateString()}`,
      },
      Body: {
        Html: {
          Data: emailBody,
        },
      },
    },
  });
  
  await sesClient.send(command);
}