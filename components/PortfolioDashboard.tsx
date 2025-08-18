'use client';

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart2, PieChart } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const client = generateClient<Schema>();

interface PortfolioStock {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  priceHistory: number[];
}

interface PortfolioDashboardProps {
  userId: string;
}

export default function PortfolioDashboard({ userId }: PortfolioDashboardProps) {
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M'>('1D');
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    topGainer: null as PortfolioStock | null,
    topLoser: null as PortfolioStock | null,
  });

  useEffect(() => {
    loadPortfolioData();
  }, [userId]);

  const loadPortfolioData = async () => {
    setLoading(true);
    try {
      // Load user preferences
      const { data: preferences } = await client.models.UserStockPreferences.get({ userId });
      
      if (preferences?.selectedStocks && preferences.selectedStocks.length > 0) {
        // Load market data for selected stocks
        const stockPromises = preferences.selectedStocks.map(async (symbol) => {
          const { data: marketData } = await client.models.MarketData.get({ symbol });
          return {
            symbol,
            name: marketData?.name || symbol,
            currentPrice: marketData?.currentPrice || 0,
            changePercent: marketData?.percentChange24h || 0,
            volume: marketData?.volume || 0,
            marketCap: marketData?.marketCap || 0,
            dayHigh: marketData?.highPrice || 0,
            dayLow: marketData?.lowPrice || 0,
            priceHistory: generateMockPriceHistory(marketData?.currentPrice || 100),
          };
        });

        const stocks = await Promise.all(stockPromises);
        setPortfolioStocks(stocks);
        calculatePortfolioMetrics(stocks);
        
        if (stocks.length > 0 && !selectedStock) {
          setSelectedStock(stocks[0].symbol);
        }
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPriceHistory = (currentPrice: number): number[] => {
    // Generate mock price history for chart
    const history = [];
    let price = currentPrice * 0.95;
    for (let i = 0; i < 30; i++) {
      price = price * (1 + (Math.random() - 0.5) * 0.02);
      history.push(price);
    }
    history.push(currentPrice);
    return history;
  };

  const calculatePortfolioMetrics = (stocks: PortfolioStock[]) => {
    const totalValue = stocks.reduce((sum, stock) => sum + stock.currentPrice, 0);
    const dailyChange = stocks.reduce((sum, stock) => sum + (stock.currentPrice * stock.changePercent / 100), 0);
    const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;
    
    const topGainer = stocks.reduce((max, stock) => 
      !max || stock.changePercent > max.changePercent ? stock : max, null as PortfolioStock | null
    );
    
    const topLoser = stocks.reduce((min, stock) => 
      !min || stock.changePercent < min.changePercent ? stock : min, null as PortfolioStock | null
    );

    setPortfolioMetrics({
      totalValue,
      dailyChange,
      dailyChangePercent,
      topGainer,
      topLoser,
    });
  };

  const getChartData = (stock: PortfolioStock) => ({
    labels: Array.from({ length: stock.priceHistory.length }, (_, i) => i.toString()),
    datasets: [{
      label: stock.symbol,
      data: stock.priceHistory,
      borderColor: stock.changePercent >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
      backgroundColor: stock.changePercent >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (portfolioStocks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Stocks Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select stocks from your watchlist to build your portfolio
        </p>
      </div>
    );
  }

  const selectedStockData = portfolioStocks.find(s => s.symbol === selectedStock);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Portfolio Value</span>
            <BarChart2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${portfolioMetrics.totalValue.toFixed(2)}
          </div>
          <div className={`flex items-center mt-2 text-sm ${portfolioMetrics.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioMetrics.dailyChangePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {portfolioMetrics.dailyChangePercent >= 0 ? '+' : ''}{portfolioMetrics.dailyChangePercent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Daily Change</span>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${portfolioMetrics.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioMetrics.dailyChange >= 0 ? '+' : ''}${Math.abs(portfolioMetrics.dailyChange).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {portfolioStocks.length} stocks tracked
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Top Gainer</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          {portfolioMetrics.topGainer && (
            <>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics.topGainer.symbol}
              </div>
              <div className="text-sm text-green-600 mt-2">
                +{portfolioMetrics.topGainer.changePercent.toFixed(2)}%
              </div>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Top Loser</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          {portfolioMetrics.topLoser && (
            <>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics.topLoser.symbol}
              </div>
              <div className="text-sm text-red-600 mt-2">
                {portfolioMetrics.topLoser.changePercent.toFixed(2)}%
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chart and Stock List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Stocks
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {portfolioStocks.map(stock => (
              <button
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol)}
                className={`w-full p-3 rounded-lg border transition-all ${
                  selectedStock === stock.symbol
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ${stock.currentPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedStockData?.symbol} - {selectedStockData?.name}
            </h3>
            <div className="flex gap-2">
              {(['1D', '1W', '1M', '3M'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {selectedStockData && (
            <>
              <div className="h-64 mb-4">
                <Line data={getChartData(selectedStockData)} options={chartOptions} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${selectedStockData.currentPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Range</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${selectedStockData.dayLow.toFixed(2)} - ${selectedStockData.dayHigh.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Volume</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(selectedStockData.volume / 1000000).toFixed(2)}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Market Cap</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(selectedStockData.marketCap / 1000000000).toFixed(2)}B
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}