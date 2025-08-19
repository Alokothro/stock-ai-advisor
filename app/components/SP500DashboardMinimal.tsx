'use client';

import { useState, useEffect } from 'react';
import { SP500 } from '../constants/sp500';
import { motion } from 'framer-motion';

interface SP500DashboardMinimalProps {
  onStockSelect?: (symbol: string) => void;
  searchQuery: string;
}

export default function SP500DashboardMinimal({ onStockSelect, searchQuery }: SP500DashboardMinimalProps) {
  const [stocks, setStocks] = useState<Array<{
    symbol: string;
    name: string;
    sector: string;
    currentPrice: number;
    priceChange24h: number;
    percentChange24h: number;
  }>>([]);
  const [filteredStocks, setFilteredStocks] = useState<typeof stocks>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter stocks based on search query
    if (searchQuery) {
      const filtered = stocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStocks(filtered);
    } else {
      setFilteredStocks(stocks);
    }
  }, [stocks, searchQuery]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      
      // Just create stock list without fetching prices
      // Prices will be fetched only when user clicks on a stock
      const stockData = SP500.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        currentPrice: 0, // No price on homepage
        priceChange24h: 0,
        percentChange24h: 0,
      }));
      
      setStocks(stockData);
    } catch (error) {
      console.error('Error setting up stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Loading S&P 500 stocks...
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 h-20 animate-pulse border border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stock Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
        {filteredStocks.map((stock, index) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.005 }}
            onClick={() => onStockSelect?.(stock.symbol)}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border border-gray-200 dark:border-gray-700"
          >
            {/* Stock Symbol */}
            <h3 className="font-bold text-base text-gray-900 dark:text-white text-center">
              {stock.symbol}
            </h3>
            {/* Stock Name */}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate text-center mt-1">
              {stock.name}
            </p>
          </motion.div>
        ))}
      </div>

      {/* No results message */}
      {filteredStocks.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No stocks found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  );
}