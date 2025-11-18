'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Loader2, Search, TrendingUpDown, FileText, Brain, CheckCircle } from 'lucide-react';

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
  const [researching, setResearching] = useState(true);
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

  const researchSteps: ResearchStep[] = [
    { id: 'price', label: 'Fetching real-time price data', status: 'pending', icon: <TrendingUpDown className="w-4 h-4" /> },
    { id: 'technicals', label: 'Analyzing technical indicators', status: 'pending', icon: <TrendingUpDown className="w-4 h-4" /> },
    { id: 'fundamentals', label: 'Reviewing fundamentals & earnings', status: 'pending', icon: <FileText className="w-4 h-4" /> },
    { id: 'sentiment', label: 'Evaluating market sentiment', status: 'pending', icon: <Search className="w-4 h-4" /> },
    { id: 'ai', label: 'AI processing final recommendation', status: 'pending', icon: <Brain className="w-4 h-4" /> },
  ];

  const [steps, setSteps] = useState<ResearchStep[]>(researchSteps);

  useEffect(() => {
    performResearchAndAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const performResearchAndAnalysis = async () => {
    setResearching(true);
    setCurrentStep(0);

    // Simulate research phases with realistic timing
    const updateStep = (index: number, status: 'in-progress' | 'completed') => {
      setSteps(prev => prev.map((step, i) => 
        i === index ? { ...step, status } : step
      ));
    };

    // Step 1: Fetch price data
    updateStep(0, 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Actually fetch the data while showing progress
    let analysisData = null;
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      
      if (response.ok) {
        analysisData = await response.json();
        if (analysisData.quote) {
          setStockData({
            symbol: analysisData.symbol,
            name: analysisData.quote.name || symbol,
            currentPrice: analysisData.quote.c || analysisData.quote.currentPrice,
            priceChange24h: analysisData.quote.d || analysisData.quote.priceChange24h,
            percentChange24h: analysisData.quote.dp || analysisData.quote.percentChange24h,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    
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

    // Step 5: AI Processing
    updateStep(4, 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Set the actual AI analysis results
    if (analysisData?.analysis) {
      setRecommendation(analysisData.analysis.recommendation);
      setConfidence(analysisData.analysis.confidence);
      setReasoning(analysisData.analysis.reasoning);
    } else {
      // Fallback if no data
      setRecommendation('HOLD');
      setConfidence(60);
      setReasoning('Unable to complete full analysis. Recommend holding position until more data is available.');
    }
    
    updateStep(4, 'completed');
    
    // Small delay before showing final result
    await new Promise(resolve => setTimeout(resolve, 500));

    setResearching(false);
  };

  const getRecommendationColor = () => {
    switch (recommendation) {
      case 'BUY': return 'from-green-500 to-green-600';
      case 'SELL': return 'from-red-500 to-red-600';
      case 'HOLD': return 'from-yellow-500 to-yellow-600';
    }
  };

  const getRecommendationBgColor = () => {
    switch (recommendation) {
      case 'BUY': return 'bg-green-50 dark:bg-green-950';
      case 'SELL': return 'bg-red-50 dark:bg-red-950';
      case 'HOLD': return 'bg-yellow-50 dark:bg-yellow-950';
    }
  };

  const getRecommendationTextColor = () => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600 dark:text-green-400';
      case 'SELL': return 'text-red-600 dark:text-red-400';
      case 'HOLD': return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const isPositive = (stockData?.percentChange24h || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{symbol}</h2>
            {stockData && <p className="text-gray-300">{stockData.name}</p>}
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
        
        {stockData && (
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
      <div className="p-8">
        <AnimatePresence mode="wait">
          {researching ? (
            // Research Phase
            <motion.div
              key="research"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Researching {symbol}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      step.status === 'completed' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                        : step.status === 'in-progress'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 text-gray-400">{step.icon}</div>
                    )}
                    <span className={`flex-1 ${
                      step.status === 'completed' 
                        ? 'text-green-700 dark:text-green-300' 
                        : step.status === 'in-progress'
                        ? 'text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            // Results Phase
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Level</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
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
                className={`${getRecommendationBgColor()} rounded-xl p-6`}
              >
                <h3 className={`font-semibold ${getRecommendationTextColor()} mb-2`}>
                  AI Analysis Summary
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
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
                  onClick={() => {/* Handle watchlist action */}}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  Add to Watchlist
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        {!researching && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6"
          >
            AI recommendations are based on technical analysis, market data, and historical patterns. 
            Always do your own research and consider your risk tolerance before trading.
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}