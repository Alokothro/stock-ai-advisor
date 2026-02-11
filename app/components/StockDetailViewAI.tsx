'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Loader2, Search, TrendingUpDown, FileText, Brain, CheckCircle, Sparkles } from 'lucide-react';

interface StockDetailViewAIProps {
  symbol: string;
  onClose?: () => void;
}

interface ResearchStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed';
  icon: React.ReactNode;
}

export default function StockDetailViewAI({ symbol, onClose }: StockDetailViewAIProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stockData, setStockData] = useState<{
    symbol: string;
    name: string;
    currentPrice: number;
    priceChange24h: number;
    percentChange24h: number;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<'BUY' | 'SELL' | 'HOLD'>('HOLD');
  const [confidence, setConfidence] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(true);

  const researchSteps: ResearchStep[] = [
    { id: 'price', label: 'Fetching real-time price data', status: 'pending', icon: <TrendingUpDown className="w-4 h-4" /> },
    { id: 'technicals', label: 'Analyzing technical indicators', status: 'pending', icon: <TrendingUpDown className="w-4 h-4" /> },
    { id: 'fundamentals', label: 'Reviewing fundamentals & earnings', status: 'pending', icon: <FileText className="w-4 h-4" /> },
    { id: 'sentiment', label: 'Evaluating market sentiment', status: 'pending', icon: <Search className="w-4 h-4" /> },
    { id: 'ai', label: 'AI processing final recommendation', status: 'pending', icon: <Brain className="w-4 h-4" /> },
  ];

  const [steps, setSteps] = useState<ResearchStep[]>(researchSteps);

  useEffect(() => {
    fetchStockPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const fetchStockPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/finnhub/quote?symbol=${symbol}`);

      if (response.ok) {
        const data = await response.json();
        setStockData({
          symbol: data.symbol || symbol,
          name: symbol,
          currentPrice: data.currentPrice,
          priceChange24h: data.priceChange24h,
          percentChange24h: data.percentChange24h,
        });
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAIAnalysis = async () => {
    setAnalyzing(true);
    setCurrentStep(0);

    // Simulate research phases with realistic timing
    const updateStep = (index: number, status: 'in-progress' | 'completed') => {
      setSteps(prev => prev.map((step, i) =>
        i === index ? { ...step, status } : step
      ));
    };

    // Step 1: Already have price data
    updateStep(0, 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 800));
    updateStep(0, 'completed');
    setCurrentStep(1);

    // Step 2: Technical analysis
    updateStep(1, 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 1200));
    updateStep(1, 'completed');
    setCurrentStep(2);

    // Step 3: Fundamentals
    updateStep(2, 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStep(2, 'completed');
    setCurrentStep(3);

    // Step 4: Sentiment
    updateStep(3, 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 900));
    updateStep(3, 'completed');
    setCurrentStep(4);

    // Step 5: AI Processing - Actually call the API
    updateStep(4, 'in-progress');

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      if (response.ok) {
        const analysisData = await response.json();
        if (analysisData.analysis) {
          setRecommendation(analysisData.analysis.recommendation);
          setConfidence(analysisData.analysis.confidence);
          setReasoning(analysisData.analysis.reasoning);
        }
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    }

    updateStep(4, 'completed');

    // Small delay before showing final result
    await new Promise(resolve => setTimeout(resolve, 500));

    setAnalyzing(false);
    setHasAnalyzed(true);
  };

  const getRecommendationColor = () => {
    switch (recommendation) {
      case 'BUY': return 'from-green-500 to-green-600';
      case 'SELL': return 'from-red-500 to-red-600';
      case 'HOLD': return 'from-[#cd7f32] to-[#b87333]';
    }
  };

  const getRecommendationBgColor = () => {
    switch (recommendation) {
      case 'BUY': return 'bg-green-950 border-green-700';
      case 'SELL': return 'bg-red-950 border-red-700';
      case 'HOLD': return 'bg-[#2a1f15] border-[#cd7f32]';
    }
  };

  const getRecommendationTextColor = () => {
    switch (recommendation) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      case 'HOLD': return 'text-[#cd7f32]';
    }
  };

  const isPositive = (stockData?.percentChange24h || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-black border-2 border-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="bg-black border-b-2 border-[#cd7f32] p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{symbol}</h2>
            {stockData && <p className="text-gray-400">{stockData.name}</p>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="mt-4 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-[#cd7f32] animate-spin" />
            <span className="text-gray-400">Loading price data...</span>
          </div>
        ) : stockData && (
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-3xl font-bold text-white">
              ${stockData.currentPrice.toFixed(2)}
            </span>
            <span className={`flex items-center text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
              {isPositive ? '+' : ''}{stockData.priceChange24h.toFixed(2)} ({stockData.percentChange24h.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-8 bg-black">
        {!hasAnalyzed && !analyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <Sparkles className="w-16 h-16 text-[#cd7f32] mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Ready to Analyze {symbol}
              </h3>
              <p className="text-gray-400">
                Get AI-powered insights and recommendations for this stock
              </p>
            </div>
            <button
              onClick={performAIAnalysis}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-[#cd7f32] to-[#b87333] text-white text-lg font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Stock
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {analyzing && (
            // Research Phase
            <motion.div
              key="research"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <Brain className="w-16 h-16 text-[#cd7f32] mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  AI Researching {symbol}
                </h3>
                <p className="text-gray-400">
                  Analyzing market data to provide the best recommendation
                </p>
              </div>

              {/* Research Steps */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                      step.status === 'completed'
                        ? 'border-green-500 bg-green-950'
                        : step.status === 'in-progress'
                        ? 'border-[#cd7f32] bg-[#2a1f15]'
                        : 'border-gray-700 bg-gray-900'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <Loader2 className="w-5 h-5 text-[#cd7f32] animate-spin" />
                    ) : (
                      <div className="w-5 h-5 text-gray-600">{step.icon}</div>
                    )}
                    <span className={`flex-1 ${
                      step.status === 'completed'
                        ? 'text-green-400'
                        : step.status === 'in-progress'
                        ? 'text-[#cd7f32] font-semibold'
                        : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-[#cd7f32] to-[#b87333]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {hasAnalyzed && !analyzing && (
            // Results Phase
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                  AI Recommendation
                </p>

                {/* Large Recommendation Display */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="relative inline-block"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${getRecommendationColor()} blur-xl opacity-30`}></div>
                  <div className={`relative bg-gradient-to-r ${getRecommendationColor()} text-white text-6xl font-black px-12 py-6 rounded-2xl shadow-2xl`}>
                    {recommendation}
                  </div>
                </motion.div>

                {/* Confidence Score */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm text-gray-400">Confidence Level</span>
                    <span className="text-2xl font-bold text-white">{confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${getRecommendationColor()}`}
                    />
                  </div>
                </motion.div>
              </div>

              {/* AI Reasoning */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`${getRecommendationBgColor()} border-2 rounded-xl p-6`}
              >
                <h3 className={`font-semibold ${getRecommendationTextColor()} mb-2`}>
                  AI Analysis Summary
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {reasoning}
                </p>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={() => {
                    setHasAnalyzed(false);
                    setSteps(researchSteps);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#cd7f32] to-[#b87333] text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  Analyze Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        {hasAnalyzed && !analyzing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-gray-500 text-center mt-6"
          >
            AI recommendations are based on technical analysis, market data, and historical patterns.
            Always do your own research and consider your risk tolerance before trading.
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
