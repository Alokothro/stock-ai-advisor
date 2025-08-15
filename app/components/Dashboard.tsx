'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import StockCard from './StockCard';
import SearchBar from './SearchBar';
import AnalysisModal from './AnalysisModal';

const client = generateClient<Schema>();

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist'>('portfolio');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch user's portfolio
      const portfolioData = await client.models.Portfolio.list();
      setPortfolio(portfolioData.data || []);
      
      // Fetch user's watchlist
      const watchlistData = await client.models.Watchlist.list();
      setWatchlist(watchlistData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, assetType: 'STOCK' | 'CRYPTO') => {
    try {
      await client.models.Watchlist.create({
        userId: 'current-user', // This will be replaced with actual user ID
        symbol,
        assetType,
        name: symbol,
      });
      fetchData();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Stock & Crypto Advisor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get AI-powered trading recommendations for stocks and cryptocurrencies
        </p>
      </div>

      <SearchBar onAddToWatchlist={addToWatchlist} />

      <div className="mt-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'portfolio'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'watchlist'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Watchlist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeTab === 'portfolio' ? (
            portfolio.length > 0 ? (
              portfolio.map((item) => (
                <StockCard
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.symbol}
                  price={item.currentPrice || 0}
                  change={item.profitLoss || 0}
                  changePercent={item.profitLossPercentage || 0}
                  onClick={() => handleAssetClick(item)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Your portfolio is empty. Search for stocks or crypto to add.
                </p>
              </div>
            )
          ) : (
            watchlist.length > 0 ? (
              watchlist.map((item) => (
                <StockCard
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.name || item.symbol}
                  price={item.currentPrice || 0}
                  change={item.priceChange24h || 0}
                  changePercent={item.percentChange24h || 0}
                  onClick={() => handleAssetClick(item)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Your watchlist is empty. Search for stocks or crypto to add.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {selectedAsset && (
        <AnalysisModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}