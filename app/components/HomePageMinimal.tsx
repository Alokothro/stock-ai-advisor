'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import SP500DashboardMinimal from './SP500DashboardMinimal';
import StockDetailViewAI from './StockDetailViewAI';
import { motion, AnimatePresence } from 'framer-motion';
import { SP500 } from '../constants/sp500';

interface HomePageMinimalProps {
  user: { username?: string; email?: string };
  signOut?: () => void;
}

export default function HomePageMinimal({ user, signOut }: HomePageMinimalProps) {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMatches = isSearchFocused && searchQuery.trim()
    ? SP500.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelectFromSearch = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Clean Header Bar */}
      <header className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-full px-6 py-4 flex justify-between items-center">
          <img src="/logo.png" alt="Logo" className="w-16 h-16" />
          <button
            onClick={() => setSelectedStock(null)}
            className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            Stock AI Advisor
          </button>
          <div className="flex items-center">
            {signOut && (
              <button
                onClick={signOut}
                className="w-16 h-16 flex items-center justify-center text-sm font-semibold bg-white text-black border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Bye
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full px-6">
        {/* Centered Search Bar */}
        <div className="flex justify-center mt-12 mb-8">
          <div className="relative w-full max-w-2xl" ref={searchContainerRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Enter' && searchMatches.length > 0) {
                  handleSelectFromSearch(searchMatches[0].symbol);
                }
              }}
              className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-black border-2 border-gray-300 dark:border-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#cd7f32] focus:border-transparent dark:text-white placeholder-gray-400"
            />

            {searchMatches.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-black border-2 border-gray-300 dark:border-white rounded-xl shadow-lg overflow-hidden z-10">
                {searchMatches.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectFromSearch(stock.symbol)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate ml-3">{stock.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Grid - Full Width */}
        <AnimatePresence mode="wait">
          {selectedStock ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-6xl mx-auto"
            >
              <StockDetailViewAI
                symbol={selectedStock}
                onClose={() => setSelectedStock(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SP500DashboardMinimal
                onStockSelect={setSelectedStock}
                searchQuery={searchQuery}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}