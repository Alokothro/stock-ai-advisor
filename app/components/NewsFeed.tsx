'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper, ExternalLink, Clock, TrendingUp,
  AlertCircle, ArrowRight, Bookmark
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedSymbols: string[];
  imageUrl?: string;
  category: string;
}

interface NewsFeedProps {
  symbol?: string;
  limit?: number;
  onArticleClick?: (article: NewsItem) => void;
}

export default function NewsFeed({ symbol, limit = 10, onArticleClick }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  useEffect(() => {
    fetchNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // In production, this would call your Lambda function or news API
      // For now, using mock data
      const mockNews = generateMockNews(symbol);
      setNews(mockNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockNews = (stockSymbol?: string): NewsItem[] => {
    const categories = ['Markets', 'Technology', 'Finance', 'Analysis', 'Breaking'];
    
    const newsTemplates = [
      {
        title: `${stockSymbol || 'S&P 500'} Reaches New Heights Amid Strong Earnings`,
        summary: 'Markets rally as corporate earnings exceed expectations, driving investor optimism and pushing indices to record levels.',
        sentiment: 'positive' as const,
      },
      {
        title: 'Federal Reserve Signals Potential Rate Changes',
        summary: 'Central bank officials discuss monetary policy adjustments in response to inflation data and economic indicators.',
        sentiment: 'neutral' as const,
      },
      {
        title: 'Tech Sector Faces Regulatory Scrutiny',
        summary: 'Government agencies announce new investigations into major technology companies, raising concerns about potential regulations.',
        sentiment: 'negative' as const,
      },
      {
        title: `AI Revolution Drives ${stockSymbol || 'Tech'} Stock Surge`,
        summary: 'Artificial intelligence breakthroughs fuel investor enthusiasm, leading to significant gains in technology sector.',
        sentiment: 'positive' as const,
      },
      {
        title: 'Global Supply Chain Disruptions Continue',
        summary: 'Manufacturing delays and shipping bottlenecks persist, affecting production schedules and inventory levels.',
        sentiment: 'negative' as const,
      },
      {
        title: 'Cryptocurrency Market Shows Signs of Recovery',
        summary: 'Digital assets rebound from recent lows as institutional interest grows and regulatory clarity improves.',
        sentiment: 'positive' as const,
      },
      {
        title: 'Energy Sector Volatility Amid Geopolitical Tensions',
        summary: 'Oil prices fluctuate as international conflicts and supply concerns create uncertainty in energy markets.',
        sentiment: 'neutral' as const,
      },
      {
        title: `Analysts Upgrade ${stockSymbol || 'Multiple'} Stocks to Buy`,
        summary: 'Investment firms raise price targets and ratings following strong quarterly results and improved guidance.',
        sentiment: 'positive' as const,
      },
      {
        title: 'Inflation Data Exceeds Expectations',
        summary: 'Consumer price index rises more than anticipated, sparking concerns about persistent inflationary pressures.',
        sentiment: 'negative' as const,
      },
      {
        title: 'Merger & Acquisition Activity Accelerates',
        summary: 'Corporate deal-making picks up pace as companies seek strategic partnerships and growth opportunities.',
        sentiment: 'neutral' as const,
      },
    ];

    const sources = ['Bloomberg', 'Reuters', 'CNBC', 'WSJ', 'Financial Times', 'MarketWatch'];
    
    return newsTemplates.map((template, index) => ({
      id: `news-${index}`,
      title: template.title,
      summary: template.summary,
      source: sources[index % sources.length],
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      url: '#',
      sentiment: template.sentiment,
      relatedSymbols: stockSymbol ? [stockSymbol] : ['SPY', 'QQQ', 'DIA'],
      category: categories[index % categories.length],
      imageUrl: index % 3 === 0 ? 'https://via.placeholder.com/400x200' : undefined,
    }));
  };

  const filteredNews = news.filter(item => {
    if (filter !== 'all' && item.sentiment !== filter) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'negative':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Newspaper className="w-5 h-5 mr-2" />
            {symbol ? `${symbol} News` : 'Market News'}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredNews.length} articles
          </span>
        </div>

        {/* Sentiment Filter */}
        <div className="flex space-x-2 mb-4">
          {(['all', 'positive', 'neutral', 'negative'] as const).map(sentimentFilter => (
            <button
              key={sentimentFilter}
              onClick={() => setFilter(sentimentFilter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === sentimentFilter
                  ? sentimentFilter === 'all' 
                    ? 'bg-blue-500 text-white'
                    : getSentimentColor(sentimentFilter)
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* News Items */}
      <div className="space-y-3">
        {filteredNews.slice(0, limit).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onArticleClick?.(item)}
          >
            <div className="flex items-start space-x-3">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                    {item.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add bookmark functionality
                    }}
                    className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Bookmark className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.source}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(item.publishedAt)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full flex items-center space-x-1 ${getSentimentColor(item.sentiment)}`}>
                      {getSentimentIcon(item.sentiment)}
                      <span className="text-xs">{item.sentiment}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.relatedSymbols.slice(0, 2).map(sym => (
                      <span key={sym} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                        {sym}
                      </span>
                    ))}
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {filteredNews.length > limit && (
        <button className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
          Load More News
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      )}
    </div>
  );
}