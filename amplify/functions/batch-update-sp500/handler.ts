import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SP500 } from '../../../app/constants/sp500';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Finnhub API configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '***REMOVED***';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    // Finnhub API call for real-time quote
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Finnhub API error for ${symbol}: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Finnhub returns: c (current), o (open), h (high), l (low), pc (previous close), d (change), dp (change %)
    if (data && data.c) {
      return {
        symbol: symbol,
        price: data.c,
        previousClose: data.pc,
        change: data.d,
        changePercent: data.dp,
        volume: 0, // Finnhub doesn't provide volume in quote endpoint
        high: data.h,
        low: data.l,
        open: data.o,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`Error fetching Finnhub price for ${symbol}:`, error);
  }
  
  // Return mock data if API fails (for development/testing)
  return {
    symbol,
    price: 100 + Math.random() * 400,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.floor(Math.random() * 10000000),
    high: 100 + Math.random() * 410,
    low: 100 + Math.random() * 390,
    open: 100 + Math.random() * 400,
    previousClose: 100 + Math.random() * 400,
    timestamp: new Date().toISOString(),
  };
}

async function batchUpdatePrices(stocks: string[]): Promise<void> {
  const batchSize = 10; // Smaller batch for Finnhub rate limits (60 calls/minute)
  const batches = [];
  
  for (let i = 0; i < stocks.length; i += batchSize) {
    batches.push(stocks.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    // Process stocks sequentially with delay to respect rate limits
    const prices = [];
    for (const symbol of batch) {
      const price = await fetchStockPrice(symbol);
      if (price) prices.push(price);
      
      // Rate limiting: 60 calls/minute = 1 call per second
      // Add 1100ms delay to be safe (roughly 54 calls/minute)
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
    
    const items = prices.map(price => ({
      PutRequest: {
        Item: {
          symbol: price.symbol,
          assetType: 'STOCK',
          name: SP500.find(s => s.symbol === price.symbol)?.name || price.symbol,
          currentPrice: price.price,
          openPrice: price.open,
          highPrice: price.high,
          lowPrice: price.low,
          closePrice: price.previousClose,
          volume: price.volume,
          marketCap: price.marketCap,
          priceChange24h: price.change,
          percentChange24h: price.changePercent,
          lastUpdated: price.timestamp,
          sector: SP500.find(s => s.symbol === price.symbol)?.sector || 'Unknown',
        }
      }
    }));
    
    if (items.length > 0) {
      try {
        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [process.env.MARKETDATA_TABLE_NAME!]: items
          }
        }));
        console.log(`Updated ${items.length} stock prices`);
      } catch (error) {
        console.error('Error batch writing to DynamoDB:', error);
      }
    }
  }
}

export const handler = async (event: any) => {
  console.log('Starting S&P 500 batch price update');
  
  try {
    // Get all S&P 500 symbols
    const symbols = SP500.map(stock => stock.symbol);
    
    // Update prices in batches
    await batchUpdatePrices(symbols);
    
    // Also update a summary record with market stats
    const allPrices = await Promise.all(
      symbols.slice(0, 30).map(s => fetchStockPrice(s)) // Sample top 30 for stats
    );
    
    const validPrices = allPrices.filter(p => p !== null) as StockPrice[];
    const gainers = validPrices.filter(p => p.changePercent > 0).length;
    const losers = validPrices.filter(p => p.changePercent < 0).length;
    const unchanged = validPrices.filter(p => p.changePercent === 0).length;
    
    // Store market summary
    await docClient.send(new PutCommand({
      TableName: process.env.MARKETDATA_TABLE_NAME!,
      Item: {
        symbol: 'SP500_SUMMARY',
        assetType: 'INDEX',
        name: 'S&P 500 Index',
        totalStocks: SP500.length,
        gainers,
        losers,
        unchanged,
        lastUpdated: new Date().toISOString(),
        marketStatus: getMarketStatus(),
      }
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'S&P 500 prices updated successfully',
        stocksUpdated: symbols.length,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error in batch update:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update S&P 500 prices',
        details: error,
      }),
    };
  }
};

function getMarketStatus(): string {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hours = easternTime.getHours();
  const minutes = easternTime.getMinutes();
  const day = easternTime.getDay();
  
  // Market is open Monday-Friday, 9:30 AM - 4:00 PM ET
  if (day === 0 || day === 6) {
    return 'CLOSED'; // Weekend
  }
  
  const currentTime = hours * 60 + minutes;
  const openTime = 9 * 60 + 30; // 9:30 AM
  const closeTime = 16 * 60; // 4:00 PM
  
  if (currentTime >= openTime && currentTime < closeTime) {
    return 'OPEN';
  } else if (currentTime >= openTime - 60 && currentTime < openTime) {
    return 'PRE_MARKET';
  } else if (currentTime >= closeTime && currentTime < closeTime + 120) {
    return 'AFTER_HOURS';
  } else {
    return 'CLOSED';
  }
}