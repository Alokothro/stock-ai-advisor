'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import SP500DashboardMinimal from './SP500DashboardMinimal';
import StockDetailViewAI from './StockDetailViewAI';
import { motion, AnimatePresence } from 'framer-motion';

interface HomePageMinimalProps {
  user: { username?: string; email?: string };
  signOut?: () => void;
}

export default function HomePageMinimal({ user, signOut }: HomePageMinimalProps) {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-black border-2 border-gray-300 dark:border-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#cd7f32] focus:border-transparent dark:text-white placeholder-gray-400"
            />
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