# Finnhub API Integration Guide

## Overview
Finnhub provides real-time stock market data for S&P 500 stocks. Your API key: `***REMOVED***`

## API Endpoints & Response Format

### 1. Real-Time Quote (`/quote`)
```bash
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY"
```

**Response:**
```json
{
  "c": 231.59,    // Current price
  "d": -1.19,     // Change
  "dp": -0.5112,  // Percent change
  "h": 234.28,    // High of the day
  "l": 229.335,   // Low of the day
  "o": 234,       // Open price
  "pc": 232.78,   // Previous close
  "t": 1755288000 // Timestamp
}
```

### 2. Company Profile (`/stock/profile2`)
```bash
curl "https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=YOUR_API_KEY"
```

**Response:**
```json
{
  "name": "Apple Inc",
  "finnhubIndustry": "Technology",
  "marketCapitalization": 3437479.436241792,
  "logo": "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png"
}
```

## Rate Limits
- **Free Tier:** 60 API calls/minute
- **Hard Limit:** 30 API calls/second
- **Recommendation:** Use 1-second delay between calls

## Integration Architecture

### 1. Backend Lambda Function
- **Location:** `/amplify/functions/batch-update-sp500/handler.ts`
- **Purpose:** Fetches real-time prices for S&P 500 stocks
- **Rate Limiting:** 1.1-second delay between API calls
- **Batch Size:** 10 stocks per batch (respects rate limits)

### 2. Next.js API Routes
- **Location:** `/app/api/finnhub/quote/route.ts`
- **Endpoints:**
  - `GET /api/finnhub/quote?symbol=AAPL` - Single stock quote
  - `POST /api/finnhub/quote` - Batch quotes (up to 10 symbols)
- **Caching:** 1-minute in-memory cache to reduce API calls

### 3. React Hooks
- **Location:** `/app/hooks/useFinnhubData.ts`
- **Hooks:**
  - `useFinnhubQuote(symbol)` - Single stock with auto-refresh (60s)
  - `useFinnhubBatchQuotes(symbols)` - Multiple stocks with auto-refresh (120s)

## Best Practices

### 1. Rate Limiting Strategy
```javascript
// Sequential processing with delay
for (const symbol of symbols) {
  const data = await fetchQuote(symbol);
  await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 second delay
}
```

### 2. Caching Implementation
```javascript
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// Check cache before API call
const cached = cache.get(symbol);
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  return cached.data;
}
```

### 3. Error Handling
```javascript
try {
  const response = await fetch(finnhubUrl);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return await response.json();
} catch (error) {
  // Fallback to mock data or cached value
  return getMockData(symbol);
}
```

## Usage Examples

### Frontend Component
```typescript
import { useFinnhubQuote } from '@/app/hooks/useFinnhubData';

function StockPrice({ symbol }) {
  const { data, loading, error } = useFinnhubQuote(symbol);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h3>{symbol}: ${data?.currentPrice.toFixed(2)}</h3>
      <p>Change: {data?.priceChange24h.toFixed(2)} ({data?.percentChange24h.toFixed(2)}%)</p>
    </div>
  );
}
```

### Direct API Call
```javascript
// Single quote
const response = await fetch('/api/finnhub/quote?symbol=AAPL');
const data = await response.json();

// Batch quotes
const response = await fetch('/api/finnhub/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: ['AAPL', 'MSFT', 'GOOGL'] })
});
const quotes = await response.json();
```

## Environment Variables
Add to `.env.local`:
```
FINNHUB_API_KEY=***REMOVED***
```

## Deployment Considerations

1. **Lambda Timeout:** Set to 5+ minutes for processing all 500 stocks
2. **Schedule:** Run batch update every 30 minutes during market hours
3. **Fallback:** Always implement mock data fallback for development/testing
4. **Monitoring:** Track API usage to avoid exceeding rate limits

## Cost Optimization

1. **Cache aggressively:** Use DynamoDB or Redis for persistent caching
2. **Batch requests:** Group multiple stock requests together
3. **Smart scheduling:** Only update during market hours (9:30 AM - 4:00 PM ET)
4. **Websocket alternative:** Consider upgrading to websocket for real-time updates

## Upgrade Path

For production with high traffic:
1. **Premium Plan:** Unlimited API calls, websocket access
2. **Historical Data:** Access to candle/OHLC data
3. **Extended Hours:** Pre-market and after-hours data
4. **International Markets:** Global stock exchanges

Contact Finnhub for enterprise pricing if needed.