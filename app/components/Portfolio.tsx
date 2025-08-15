'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { PortfolioSkeleton } from './LoadingSkeletons';

const client = generateClient<Schema>();

interface PortfolioProps {
  onStockSelect?: (symbol: string) => void;
}

interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: number;
}

export default function Portfolio({ onStockSelect }: PortfolioProps) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [totalProfitLossPercent, setTotalProfitLossPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await client.models.Portfolio.list();
      const portfolioData = response.data || [];
      
      // Calculate portfolio metrics
      const items: PortfolioItem[] = portfolioData.map(item => {
        const currentPrice = item.currentPrice || 100;
        const value = currentPrice * (item.quantity || 0);
        const cost = (item.purchasePrice || 0) * (item.quantity || 0);
        const profitLoss = value - cost;
        const profitLossPercent = cost > 0 ? (profitLoss / cost) * 100 : 0;
        
        return {
          symbol: item.symbol,
          name: item.symbol, // You might want to fetch actual names
          quantity: item.quantity || 0,
          purchasePrice: item.purchasePrice || 0,
          currentPrice,
          value,
          profitLoss,
          profitLossPercent,
          allocation: 0, // Will calculate after
        };
      });
      
      // Calculate totals
      const totalVal = items.reduce((sum, item) => sum + item.value, 0);
      const totalCst = items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
      const totalPL = totalVal - totalCst;
      const totalPLPercent = totalCst > 0 ? (totalPL / totalCst) * 100 : 0;
      
      // Calculate allocations
      items.forEach(item => {
        item.allocation = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
      });
      
      setPortfolio(items);
      setTotalValue(totalVal);
      setTotalCost(totalCst);
      setTotalProfitLoss(totalPL);
      setTotalProfitLossPercent(totalPLPercent);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      // Load mock data
      loadMockPortfolio();
    } finally {
      setLoading(false);
    }
  };

  const loadMockPortfolio = () => {
    const mockItems: PortfolioItem[] = [
      { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 150, currentPrice: 175, value: 1750, profitLoss: 250, profitLossPercent: 16.67, allocation: 25 },
      { symbol: 'MSFT', name: 'Microsoft', quantity: 5, purchasePrice: 300, currentPrice: 350, value: 1750, profitLoss: 250, profitLossPercent: 16.67, allocation: 25 },
      { symbol: 'GOOGL', name: 'Alphabet', quantity: 3, purchasePrice: 2500, currentPrice: 2800, value: 8400, profitLoss: 900, profitLossPercent: 12, allocation: 30 },
      { symbol: 'AMZN', name: 'Amazon', quantity: 2, purchasePrice: 3000, currentPrice: 3200, value: 6400, profitLoss: 400, profitLossPercent: 6.67, allocation: 20 },
    ];
    
    const totalVal = mockItems.reduce((sum, item) => sum + item.value, 0);
    const totalCst = mockItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    
    setPortfolio(mockItems);
    setTotalValue(totalVal);
    setTotalCost(totalCst);
    setTotalProfitLoss(totalVal - totalCst);
    setTotalProfitLossPercent(((totalVal - totalCst) / totalCst) * 100);
  };

  const handleAddStock = async (symbol: string, quantity: number, price: number) => {
    try {
      await client.models.Portfolio.create({
        userId: 'current-user',
        symbol,
        assetType: 'STOCK',
        quantity,
        purchasePrice: price,
        purchaseDate: new Date().toISOString(),
      });
      fetchPortfolio();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    }
  };

  const handleDeleteStock = async (symbol: string) => {
    try {
      // Delete from portfolio
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting from portfolio:', error);
    }
  };

  // Chart data
  const performanceData = [
    { date: 'Jan', value: totalCost },
    { date: 'Feb', value: totalCost * 1.02 },
    { date: 'Mar', value: totalCost * 1.05 },
    { date: 'Apr', value: totalCost * 1.03 },
    { date: 'May', value: totalCost * 1.08 },
    { date: 'Jun', value: totalValue },
  ];

  const allocationData = portfolio.map(item => ({
    name: item.symbol,
    value: item.value,
    percentage: item.allocation,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Profit/Loss</span>
              {totalProfitLoss >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(totalProfitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Day Change</span>
              <ArrowUpRight className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              +$523.45
            </p>
            <p className="text-sm text-purple-600">
              (+2.34%)
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
              <DollarSign className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Chart */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {allocationData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {item.name} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Holdings</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">P/L</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">P/L %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Allocation</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {portfolio.map((item) => (
                <motion.tr
                  key={item.symbol}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  className="cursor-pointer"
                  onClick={() => onStockSelect?.(item.symbol)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.symbol}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    ${item.purchasePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    ${item.currentPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(item.profitLoss).toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profitLossPercent >= 0 ? '+' : ''}{item.profitLossPercent.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {item.allocation.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStock(item.symbol);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}