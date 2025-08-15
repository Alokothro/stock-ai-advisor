'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

interface AnalysisModalProps {
  asset: any;
  onClose: () => void;
}

export default function AnalysisModal({ asset, onClose }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'ai'>('overview');

  useEffect(() => {
    fetchAnalysis();
  }, [asset]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      // Fetch latest analysis for this asset
      const analysisData = await client.models.Analysis.list({
        filter: { symbol: { eq: asset.symbol } },
        limit: 1,
      });
      
      if (analysisData.data && analysisData.data.length > 0) {
        setAnalysis(analysisData.data[0]);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch(rec) {
      case 'STRONG_BUY': return 'text-green-600';
      case 'BUY': return 'text-green-500';
      case 'HOLD': return 'text-yellow-500';
      case 'SELL': return 'text-red-500';
      case 'STRONG_SELL': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'HIGH': return 'text-orange-500';
      case 'VERY_HIGH': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {asset.symbol} Analysis
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`pb-2 px-1 font-semibold transition-colors ${
                activeTab === 'technical'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Technical Analysis
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-2 px-1 font-semibold transition-colors ${
                activeTab === 'ai'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              AI Recommendation
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${asset.currentPrice?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">24h Change</p>
                      <p className={`text-xl font-bold ${asset.percentChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.percentChange24h?.toFixed(2) || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'technical' && analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Technical Score</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {analysis.technicalScore?.toFixed(0) || 'N/A'}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fundamental Score</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {analysis.fundamentalScore?.toFixed(0) || 'N/A'}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sentiment Score</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {analysis.sentimentScore?.toFixed(0) || 'N/A'}/100
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && analysis && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">AI Recommendation</p>
                        <p className={`text-2xl font-bold ${getRecommendationColor(analysis.recommendation)}`}>
                          {analysis.recommendation?.replace('_', ' ') || 'HOLD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {analysis.confidenceScore?.toFixed(0) || 50}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Price Target</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${analysis.priceTarget?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Stop Loss</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${analysis.stopLoss?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Risk Level</p>
                      <p className={`text-lg font-semibold ${getRiskColor(analysis.riskLevel)}`}>
                        {analysis.riskLevel || 'MEDIUM'}
                      </p>
                    </div>

                    {analysis.reasoning && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Analysis Reasoning</p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {analysis.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}