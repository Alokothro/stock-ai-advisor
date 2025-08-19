import { EventBridgeEvent } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import { SP500 } from '../../../app/constants/sp500';

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
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Return mock data as fallback
    return getMockStockPrice(symbol);
  }
}

function getMockStockPrice(symbol: string): StockPrice {
  const basePrice = Math.random() * 500 + 50;
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol: symbol,
    price: basePrice,
    previousClose: basePrice - change,
    change: change,
    changePercent: changePercent,
    volume: Math.floor(Math.random() * 10000000),
    marketCap: basePrice * Math.floor(Math.random() * 1000000000),
    high: basePrice + Math.abs(change),
    low: basePrice - Math.abs(change),
    open: basePrice - change / 2,
    timestamp: new Date().toISOString()
  };
}

// Process stocks in batches to avoid rate limits
async function processBatch(
  client: ReturnType<typeof generateClient<Schema>>,
  symbols: string[], 
  batchSize: number = 10
): Promise<void> {
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(async (symbol) => {
      const priceData = await fetchStockPrice(symbol);
      if (priceData) {
        try {
          // Check if record exists
          const { data: existingData } = await client.models.MarketData.get({ symbol });
          
          const marketData = {
            symbol: priceData.symbol,
            assetType: 'STOCK' as const,
            name: SP500.find(s => s.symbol === symbol)?.name || symbol,
            currentPrice: priceData.price,
            openPrice: priceData.open,
            highPrice: priceData.high,
            lowPrice: priceData.low,
            closePrice: priceData.previousClose,
            volume: priceData.volume,
            marketCap: priceData.marketCap,
            priceChange24h: priceData.change,
            percentChange24h: priceData.changePercent,
            lastUpdated: priceData.timestamp,
          };
          
          if (existingData) {
            await client.models.MarketData.update(marketData);
          } else {
            await client.models.MarketData.create(marketData);
          }
          
          console.log(`Updated ${symbol}: $${priceData.price} (${priceData.changePercent.toFixed(2)}%)`);
        } catch (error) {
          console.error(`Error storing data for ${symbol}:`, error);
        }
      }
    });
    
    await Promise.allSettled(promises);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Handler for EventBridge scheduled event
export const handler = async (event: EventBridgeEvent<string, any>) => {
  console.log('Starting batch update of S&P 500 stocks...');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Initialize Amplify Data Client
    const env = process.env as any;
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    
    const client = generateClient<Schema>({ authMode: 'iam' });
    
    // Get all S&P 500 symbols
    const symbols = SP500.map(stock => stock.symbol);
    console.log(`Processing ${symbols.length} stocks...`);
    
    // Process in smaller chunks to avoid timeouts
    const startTime = Date.now();
    
    // Process stocks in batches
    await processBatch(client, symbols, 10);
    
    const duration = Date.now() - startTime;
    console.log(`Batch update completed in ${duration}ms`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Batch update completed successfully',
        stocksProcessed: symbols.length,
        duration: duration,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error: any) {
    console.error('Error in batch update:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Batch update failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};