'use client';

import { useState, useEffect } from 'react';

interface StockQuote {
  symbol: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  priceChange24h: number;
  percentChange24h: number;
  timestamp: number;
}

export function useFinnhubQuote(symbol: string | null) {
  const [data, setData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!symbol) return;
    
    const fetchQuote = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/finnhub/quote?symbol=${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch quote');
        
        const quote = await response.json();
        setData(quote);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchQuote, 60000);
    return () => clearInterval(interval);
  }, [symbol]);
  
  return { data, loading, error, refetch: () => symbol && useFinnhubQuote(symbol) };
}

export function useFinnhubBatchQuotes(symbols: string[]) {
  const [data, setData] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (symbols.length === 0) return;
    
    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/finnhub/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch quotes');
        
        const quotes = await response.json();
        setData(quotes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching batch quotes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuotes();
    
    // Auto-refresh every 2 minutes for batch (less frequent due to rate limits)
    const interval = setInterval(fetchQuotes, 120000);
    return () => clearInterval(interval);
  }, [symbols.join(',')]);
  
  return { data, loading, error };
}