'use client';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  recommendation?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  onClick?: () => void;
}

export default function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  recommendation,
  onClick
}: StockCardProps) {
  const isPositive = change >= 0;
  
  const getRecommendationColor = (rec: string) => {
    switch(rec) {
      case 'STRONG_BUY': return 'bg-green-600';
      case 'BUY': return 'bg-green-500';
      case 'HOLD': return 'bg-yellow-500';
      case 'SELL': return 'bg-red-500';
      case 'STRONG_SELL': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{symbol}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{name}</p>
        </div>
        {recommendation && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getRecommendationColor(recommendation)}`}>
            {recommendation.replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          ${price.toFixed(2)}
        </div>
        <div className={`flex items-center space-x-2 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>${Math.abs(change).toFixed(2)}</span>
          <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
}