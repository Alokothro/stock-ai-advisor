import { APIGatewayProxyHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';

interface MarketDataRequest {
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { symbol, assetType } = JSON.parse(event.body || '{}') as MarketDataRequest;
    
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

    // Check cache first
    try {
      const { data: cachedData } = await client.models.MarketData.get({ symbol });
      
      if (cachedData && cachedData.lastUpdated) {
        const lastUpdated = new Date(cachedData.lastUpdated);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        
        if (diffMinutes < 5) {
          return {
            statusCode: 200,
            body: JSON.stringify(cachedData),
            headers: { 'Content-Type': 'application/json' },
          };
        }
      }
    } catch (cacheError) {
      console.log('No cached data found, fetching fresh data');
    }

    let marketData;
    
    if (assetType === 'STOCK') {
      marketData = await fetchStockData(symbol);
    } else {
      marketData = await fetchCryptoData(symbol);
    }

    // Store in cache using Amplify Data Client
    const dataToStore = {
      ...marketData,
      symbol,
      assetType,
      lastUpdated: new Date().toISOString(),
    };

    // Use create or update based on whether record exists
    try {
      const { data: existingData } = await client.models.MarketData.get({ symbol });
      if (existingData) {
        await client.models.MarketData.update(dataToStore);
      } else {
        await client.models.MarketData.create(dataToStore);
      }
    } catch (storeError) {
      console.error('Error storing market data:', storeError);
      // Continue anyway - we have the data to return
    }

    return {
      statusCode: 200,
      body: JSON.stringify(marketData),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch market data' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

async function fetchStockData(symbol: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    // Return mock data if API key not configured
    return getMockStockData(symbol);
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol: symbol,
        assetType: 'STOCK' as const,
        name: symbol,
        currentPrice: parseFloat(quote['05. price']),
        openPrice: parseFloat(quote['02. open']),
        highPrice: parseFloat(quote['03. high']),
        lowPrice: parseFloat(quote['04. low']),
        closePrice: parseFloat(quote['08. previous close']),
        volume: parseFloat(quote['06. volume']),
        priceChange24h: parseFloat(quote['09. change']),
        percentChange24h: parseFloat(quote['10. change percent'].replace('%', '')),
      };
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
  }
  
  return getMockStockData(symbol);
}

async function fetchCryptoData(symbol: string) {
  const apiKey = process.env.COINGECKO_API_KEY;
  
  if (!apiKey) {
    // Return mock data if API key not configured
    return getMockCryptoData(symbol);
  }

  try {
    // Map common crypto symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'SOL': 'solana',
    };
    
    const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&x_cg_demo_api_key=${apiKey}`
    );
    const data = await response.json();
    
    if (data && data[0]) {
      const coin = data[0];
      return {
        symbol: symbol,
        assetType: 'CRYPTO' as const,
        name: coin.name,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        volume: coin.total_volume,
        highPrice: coin.high_24h,
        lowPrice: coin.low_24h,
        priceChange24h: coin.price_change_24h,
        percentChange24h: coin.price_change_percentage_24h,
      };
    }
  } catch (error) {
    console.error('Error fetching crypto data:', error);
  }
  
  return getMockCryptoData(symbol);
}

function getMockStockData(symbol: string) {
  const basePrice = Math.random() * 500 + 50;
  const change = (Math.random() - 0.5) * 10;
  
  return {
    symbol: symbol,
    assetType: 'STOCK' as const,
    name: `${symbol} Inc.`,
    currentPrice: basePrice,
    openPrice: basePrice - change,
    highPrice: basePrice + Math.abs(change),
    lowPrice: basePrice - Math.abs(change),
    closePrice: basePrice - change,
    volume: Math.floor(Math.random() * 10000000),
    marketCap: basePrice * 1000000000,
    priceChange24h: change,
    percentChange24h: (change / basePrice) * 100,
    week52High: basePrice * 1.5,
    week52Low: basePrice * 0.5,
  };
}

function getMockCryptoData(symbol: string) {
  const prices: Record<string, number> = {
    'BTC': 45000,
    'ETH': 2500,
    'ADA': 0.5,
    'DOT': 7,
    'SOL': 100,
  };
  
  const basePrice = prices[symbol] || Math.random() * 100;
  const change = (Math.random() - 0.5) * basePrice * 0.1;
  
  return {
    symbol: symbol,
    assetType: 'CRYPTO' as const,
    name: `${symbol} Coin`,
    currentPrice: basePrice,
    openPrice: basePrice - change,
    highPrice: basePrice + Math.abs(change),
    lowPrice: basePrice - Math.abs(change),
    volume: Math.floor(Math.random() * 1000000000),
    marketCap: basePrice * 1000000000,
    priceChange24h: change,
    percentChange24h: (change / basePrice) * 100,
  };
}