'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Activity,
  Search, Bell, Menu, Moon, Sun,
  BarChart3, PieChart, Zap, Shield, X
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import SP500Dashboard from './SP500Dashboard';
import StockDetailView from './StockDetailView';
import Portfolio from './Portfolio';
import NewsFeed from './NewsFeed';
import PriceAlerts from './PriceAlerts';

const client = generateClient<Schema>();

export default function HomePage({ user }: { user: { userId?: string; email?: string; signInDetails?: { loginId?: string } } }) {
  const [activeView, setActiveView] = useState<'market' | 'portfolio' | 'watchlist' | 'alerts'>('market');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [marketStats] = useState({
    sp500: { value: 4500, change: 0.5 },
    dow: { value: 35000, change: 0.3 },
    nasdaq: { value: 14000, change: 0.8 },
    bitcoin: { value: 45000, change: 2.5 },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
  };

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      await client.models.Portfolio.create({
        userId: user?.userId || 'guest',
        symbol,
        assetType: 'STOCK',
        quantity: 0,
        purchasePrice: 0,
        purchaseDate: new Date().toISOString(),
      });
      // Show success toast
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    }
  };

  const handleAddToWatchlist = async (symbol: string) => {
    try {
      await client.models.Watchlist.create({
        userId: user?.userId || 'guest',
        symbol,
        assetType: 'STOCK',
        name: symbol,
      });
      // Show success toast
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  StockAI Pro
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stocks, crypto, news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {}}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <div className="flex items-center space-x-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Market Overview Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            <div className="flex space-x-6 text-sm">
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="opacity-75">S&P 500</span>
                <span className="font-semibold">{marketStats.sp500.value.toLocaleString()}</span>
                <span className={`flex items-center ${marketStats.sp500.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {marketStats.sp500.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(marketStats.sp500.change)}%
                </span>
              </div>
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="opacity-75">DOW</span>
                <span className="font-semibold">{marketStats.dow.value.toLocaleString()}</span>
                <span className={`flex items-center ${marketStats.dow.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {marketStats.dow.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(marketStats.dow.change)}%
                </span>
              </div>
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="opacity-75">NASDAQ</span>
                <span className="font-semibold">{marketStats.nasdaq.value.toLocaleString()}</span>
                <span className={`flex items-center ${marketStats.nasdaq.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {marketStats.nasdaq.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(marketStats.nasdaq.change)}%
                </span>
              </div>
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="opacity-75">Bitcoin</span>
                <span className="font-semibold">${marketStats.bitcoin.value.toLocaleString()}</span>
                <span className={`flex items-center ${marketStats.bitcoin.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {marketStats.bitcoin.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(marketStats.bitcoin.change)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'market', label: 'Market', icon: BarChart3 },
              { id: 'portfolio', label: 'Portfolio', icon: PieChart },
              { id: 'watchlist', label: 'Watchlist', icon: Activity },
              { id: 'alerts', label: 'Alerts', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'market' | 'portfolio' | 'watchlist' | 'alerts')}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {selectedStock ? (
            <motion.div
              key="stock-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StockDetailView
                symbol={selectedStock}
                onClose={() => setSelectedStock(null)}
                onAddToPortfolio={handleAddToPortfolio}
                onAddToWatchlist={handleAddToWatchlist}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {activeView === 'market' && (
                <>
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 cursor-pointer"
                    >
                      <Zap className="w-8 h-8 mb-2" />
                      <h3 className="font-semibold">AI Recommendations</h3>
                      <p className="text-sm opacity-90 mt-1">Get personalized picks</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 cursor-pointer"
                    >
                      <TrendingUp className="w-8 h-8 mb-2" />
                      <h3 className="font-semibold">Top Gainers</h3>
                      <p className="text-sm opacity-90 mt-1">Today&apos;s best performers</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 cursor-pointer"
                    >
                      <Shield className="w-8 h-8 mb-2" />
                      <h3 className="font-semibold">Safe Picks</h3>
                      <p className="text-sm opacity-90 mt-1">Low-risk opportunities</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 cursor-pointer"
                    >
                      <Activity className="w-8 h-8 mb-2" />
                      <h3 className="font-semibold">Most Active</h3>
                      <p className="text-sm opacity-90 mt-1">High volume trades</p>
                    </motion.div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* S&P 500 Dashboard - Takes 2 columns */}
                    <div className="lg:col-span-2">
                      <SP500Dashboard onStockSelect={handleStockSelect} />
                    </div>
                    
                    {/* News Feed - Takes 1 column */}
                    <div className="lg:col-span-1">
                      <NewsFeed limit={5} />
                    </div>
                  </div>
                </>
              )}
              
              {activeView === 'portfolio' && (
                <Portfolio onStockSelect={handleStockSelect} />
              )}
              
              {activeView === 'watchlist' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Watchlist
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track your favorite stocks and get alerts
                  </p>
                </div>
              )}
              
              {activeView === 'alerts' && (
                <PriceAlerts />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Menu
                </span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Mobile menu items */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}