'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Search, Check, X, TrendingUp, TrendingDown } from 'lucide-react';

const client = generateClient<Schema>();

// S&P 500 stocks (top 100 for demo - expand as needed)
const SP500_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Communication Services' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', sector: 'Financials' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Staples' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
  // Add more stocks as needed
];

interface StockSelectorProps {
  userId: string;
  onSelectionChange?: (stocks: string[]) => void;
}

export default function StockSelector({ userId, onSelectionChange }: StockSelectorProps) {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<{
    selectedStocks?: string[];
    dailyInsightsOptIn?: boolean;
  } | null>(null);

  // Filter stocks based on search
  const filteredStocks = useMemo(() => {
    if (!searchTerm) return SP500_STOCKS;
    const term = searchTerm.toLowerCase();
    return SP500_STOCKS.filter(
      stock =>
        stock.symbol.toLowerCase().includes(term) ||
        stock.name.toLowerCase().includes(term) ||
        stock.sector.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Group stocks by sector
  const stocksBySector = useMemo(() => {
    const grouped: Record<string, typeof SP500_STOCKS> = {};
    filteredStocks.forEach(stock => {
      if (!grouped[stock.sector]) {
        grouped[stock.sector] = [];
      }
      grouped[stock.sector].push(stock);
    });
    return grouped;
  }, [filteredStocks]);

  // Load user preferences
  useEffect(() => {
    loadUserPreferences();
  }, [userId]);

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.UserStockPreferences.get({ id: userId });
      if (data) {
        setPreferences({
          selectedStocks: data.selectedStocks?.filter((s): s is string => s !== null) || [],
          dailyInsightsOptIn: data.dailyInsightsOptIn || false,
        });
        setSelectedStocks(data.selectedStocks?.filter((s): s is string => s !== null) || []);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = (symbol: string) => {
    setSelectedStocks(prev => {
      const newSelection = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
      return newSelection;
    });
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      if (preferences) {
        // Update existing preferences
        await client.models.UserStockPreferences.update({
          id: userId,
          selectedStocks,
        });
      } else {
        // Create new preferences
        await client.models.UserStockPreferences.create({
          userId,
          email: '', // Get from auth context
          selectedStocks,
          dailyInsightsOptIn: false,
        });
      }
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const clearSelection = () => {
    setSelectedStocks([]);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Your S&P 500 Portfolio
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose stocks to track and receive daily AI-powered insights
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by symbol, name, or sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearSelection}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={savePreferences}
            disabled={saving || selectedStocks.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : `Save Selection (${selectedStocks.length})`}
          </button>
        </div>
      </div>

      {/* Selected Stocks Summary */}
      {selectedStocks.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Selected Stocks ({selectedStocks.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedStocks.map(symbol => (
              <span
                key={symbol}
                className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {symbol}
                <button
                  onClick={() => toggleStock(symbol)}
                  className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stocks Grid by Sector */}
      <div className="max-h-96 overflow-y-auto space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading preferences...</p>
          </div>
        ) : (
          Object.entries(stocksBySector).map(([sector, stocks]) => (
            <div key={sector}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {sector}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stocks.map(stock => {
                  const isSelected = selectedStocks.includes(stock.symbol);
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => toggleStock(stock.symbol)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {stock.symbol}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {stock.name}
                          </div>
                        </div>
                        <div className={`ml-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isSelected ? <Check className="w-5 h-5" /> : <div className="w-5 h-5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Daily Insights Opt-in */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences?.dailyInsightsOptIn || false}
            onChange={(e) => setPreferences({ ...preferences, dailyInsightsOptIn: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Enable Daily Portfolio Insights
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive AI-powered analysis of your selected stocks every morning at 9 AM ET
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}