'use client';

import { useState } from 'react';

interface SearchBarProps {
  onAddToWatchlist: (symbol: string, assetType: 'STOCK' | 'CRYPTO') => void;
}

export default function SearchBar({ onAddToWatchlist }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [assetType, setAssetType] = useState<'STOCK' | 'CRYPTO'>('STOCK');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onAddToWatchlist(searchTerm.toUpperCase(), assetType);
      setSearchTerm('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter stock ticker (e.g., AAPL) or crypto symbol (e.g., BTC)"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>
      
      <div className="flex gap-2">
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value as 'STOCK' | 'CRYPTO')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="STOCK">Stock</option>
          <option value="CRYPTO">Crypto</option>
        </select>
        
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          Add to Watchlist
        </button>
      </div>
    </form>
  );
}