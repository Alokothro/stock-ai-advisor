'use client';

import { useState, useEffect } from 'react';
// import { generateClient } from 'aws-amplify/data';
// import type { Schema } from '@/amplify/data/resource';
import { SP500 } from '../constants/sp500';

// Define SECTORS locally since it's not exported
const SECTORS = [
  'Technology',
  'Healthcare', 
  'Financials',
  'Consumer Discretionary',
  'Communication Services',
  'Industrials',
  'Consumer Staples',
  'Energy',
  'Utilities',
  'Real Estate',
  'Materials'
];

import StockCard from './StockCard';
import { DashboardSkeleton } from './LoadingSkeletons';

// const client = generateClient<Schema>();

interface MarketSummary {
  marketStatus: string;
  gainers: number;
  losers: number;
  unchanged: number;
  lastUpdated: string;
}

interface SP500DashboardProps {
  onStockSelect?: (symbol: string) => void;
}

export default function SP500Dashboard({ onStockSelect }: SP500DashboardProps) {
  const [stocks, setStocks] = useState<Array<{ symbol: string; name?: string; sector?: string; currentPrice?: number; priceChange24h?: number; percentChange24h?: number; volume?: number; marketCap?: number; [key: string]: unknown }>>([]);
  const [filteredStocks, setFilteredStocks] = useState<Array<{ symbol: string; name?: string; sector?: string; currentPrice?: number; priceChange24h?: number; percentChange24h?: number; volume?: number; marketCap?: number; [key: string]: unknown }>>([]);
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'change' | 'volume'>('change');
  const [loading, setLoading] = useState(true);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchSP500Data();
    // Set up real-time subscription
    // const subscription = subscribeToUpdates();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSP500Data, 30000);
    
    return () => {
      // subscription?.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    filterAndSortStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, selectedSector, searchTerm, sortBy]);

  const fetchSP500Data = async () => {
    try {
      setLoading(true);
      
      // Skip database, use S&P 500 list directly
      let enrichedStocks: Array<{
        symbol: string;
        name?: string;
        sector?: string;
        currentPrice?: number;
        priceChange24h?: number;
        percentChange24h?: number;
        volume?: number;
        marketCap?: number;
        [key: string]: unknown;
      }> = [];
      
      // For demo, let's fetch real prices for top 10 stocks from Finnhub
      const topSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'JNJ'];
      const realPrices = new Map();
      
      try {
        const response = await fetch('/api/finnhub/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: topSymbols }),
        });
        
        if (response.ok) {
          const quotes = await response.json();
          quotes.forEach((quote: { symbol: string; price: number; change: number; changePercent: number }) => {
            realPrices.set(quote.symbol, quote);
          });
        }
      } catch {
        console.log('Could not fetch real prices, using mock data');
      }
      
      // Create stock list from S&P 500 constants
      enrichedStocks = SP500.map(stock => {
        const realData = realPrices.get(stock.symbol);
        
        if (realData) {
          return {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            currentPrice: realData.currentPrice,
            priceChange24h: realData.priceChange24h,
            percentChange24h: realData.percentChange24h,
            volume: 0,
            marketCap: 0,
            openPrice: realData.openPrice,
            highPrice: realData.highPrice,
            lowPrice: realData.lowPrice,
          };
        } else {
          // Mock data for stocks we don't have real prices for
          const basePrice = 100 + Math.random() * 400;
          const change = (Math.random() - 0.5) * 20;
          return {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            currentPrice: basePrice,
            priceChange24h: change,
            percentChange24h: (change / basePrice) * 100,
            volume: Math.floor(Math.random() * 10000000),
            marketCap: Math.floor(Math.random() * 1000000000000),
          };
        }
      });
      
      console.log('Setting stocks:', enrichedStocks.length);
      setStocks(enrichedStocks);
      
      // Calculate market summary from actual stock data
      const gainers = enrichedStocks.filter(s => (s.percentChange24h ?? 0) > 0).length;
      const losers = enrichedStocks.filter(s => (s.percentChange24h ?? 0) < 0).length;
      const unchanged = enrichedStocks.filter(s => (s.percentChange24h ?? 0) === 0).length;
      
      setMarketSummary({
        marketStatus: 'OPEN', // You can determine this based on current time
        gainers,
        losers,
        unchanged,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      // Load mock data if API fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockStocks = SP500.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      currentPrice: 100 + Math.random() * 400,
      priceChange24h: (Math.random() - 0.5) * 20,
      percentChange24h: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
    }));
    setStocks(mockStocks);
  };

  // const subscribeToUpdates = () => {
  //   try {
  //     return client.models.MarketData.onUpdate().subscribe({
  //       next: (data) => {
  //         setStocks(prevStocks => {
  //           const updated = [...prevStocks];
  //           const index = updated.findIndex(s => s.symbol === data.symbol);
  //           if (index >= 0) {
  //             const sp500Stock = SP500.find(s => s.symbol === data.symbol);
  //             updated[index] = {
  //               ...updated[index],
  //               symbol: data.symbol,
  //               name: sp500Stock?.name || data.name || data.symbol,
  //               sector: sp500Stock?.sector || 'Unknown',
  //               currentPrice: data.currentPrice ?? undefined,
  //               priceChange24h: data.priceChange24h ?? undefined,
  //               percentChange24h: data.percentChange24h ?? undefined,
  //               volume: data.volume ?? undefined,
  //               marketCap: data.marketCap ?? undefined,
  //             };
  //           }
  //           return updated;
  //         });
  //       },
  //       error: (error) => console.error('Subscription error:', error),
  //     });
  //   } catch (error) {
  //     console.error('Failed to subscribe:', error);
  //     return null;
  //   }
  // };

  const filterAndSortStocks = () => {
    let filtered = [...stocks];
    
    // Filter by sector
    if (selectedSector !== 'All') {
      filtered = filtered.filter(stock => stock.sector === selectedSector);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'change':
          return (b.percentChange24h || 0) - (a.percentChange24h || 0);
        case 'volume':
          return (b.volume || 0) - (a.volume || 0);
        default:
          return 0;
      }
    });
    
    console.log('Filtered stocks:', filtered.length, 'from', stocks.length);
    setFilteredStocks(filtered);
  };

  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500';
      case 'CLOSED':
        return 'bg-red-500';
      case 'PRE_MARKET':
      case 'AFTER_HOURS':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const topGainers = [...filteredStocks]
    .sort((a, b) => (b.percentChange24h || 0) - (a.percentChange24h || 0))
    .slice(0, 5);
    
  const topLosers = [...filteredStocks]
    .sort((a, b) => (a.percentChange24h || 0) - (b.percentChange24h || 0))
    .slice(0, 5);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            S&P 500 Live Tracker
          </h1>
          {marketSummary && (
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getMarketStatusColor(marketSummary.marketStatus)}`}>
                Market {marketSummary.marketStatus}
              </span>
              <span className="text-sm text-gray-500">
                Updated: {new Date(marketSummary.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        
        {/* Market Summary */}
        {marketSummary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Gainers</p>
              <p className="text-2xl font-bold text-green-600">{marketSummary.gainers}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Losers</p>
              <p className="text-2xl font-bold text-red-600">{marketSummary.losers}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Unchanged</p>
              <p className="text-2xl font-bold text-gray-600">{marketSummary.unchanged}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          
          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All Sectors</option>
            {SECTORS.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'symbol' | 'change' | 'volume')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="change">Sort by Change %</option>
            <option value="symbol">Sort by Symbol</option>
            <option value="volume">Sort by Volume</option>
          </select>
          
          {/* View Mode */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              List
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredStocks.length} of {SP500.length} stocks
        </div>
      </div>

      {/* Top Movers Section */}
      <div className="mb-8 grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-3">Top Gainers</h3>
          <div className="space-y-2">
            {topGainers.map(stock => (
              <div key={stock.symbol} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div>
                  <span className="font-semibold">{stock.symbol}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${stock.currentPrice?.toFixed(2)}</div>
                  <div className="text-sm text-green-600">+{stock.percentChange24h?.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-3">Top Losers</h3>
          <div className="space-y-2">
            {topLosers.map(stock => (
              <div key={stock.symbol} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <div>
                  <span className="font-semibold">{stock.symbol}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${stock.currentPrice?.toFixed(2)}</div>
                  <div className="text-sm text-red-600">{stock.percentChange24h?.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map(stock => (
            <StockCard
              key={stock.symbol}
              symbol={stock.symbol}
              name={stock.name || stock.symbol}
              price={stock.currentPrice || 0}
              change={stock.priceChange24h || 0}
              changePercent={stock.percentChange24h || 0}
              onClick={() => onStockSelect?.(stock.symbol)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Change</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStocks.map(stock => (
                <tr key={stock.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-semibold">{stock.symbol}</td>
                  <td className="px-4 py-3 text-sm">{stock.name}</td>
                  <td className="px-4 py-3 text-sm">{stock.sector}</td>
                  <td className="px-4 py-3 text-right font-semibold">${stock.currentPrice?.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${(stock.percentChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.percentChange24h?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{stock.volume?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}