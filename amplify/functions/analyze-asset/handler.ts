import { APIGatewayProxyHandler } from 'aws-lambda';

interface AnalyzeAssetRequest {
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { symbol, assetType, timeframe } = JSON.parse(event.body || '{}') as AnalyzeAssetRequest;
    
    if (!symbol || !assetType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Symbol and assetType are required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Generate technical analysis
    const analysis = generateTechnicalAnalysis(symbol, assetType, timeframe || '1D');

    return {
      statusCode: 200,
      body: JSON.stringify(analysis),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error analyzing asset:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to analyze asset' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

function generateTechnicalAnalysis(symbol: string, assetType: string, timeframe: string) {
  // Generate mock technical indicators
  const rsi = Math.random() * 100;
  const macd = (Math.random() - 0.5) * 10;
  const stochastic = Math.random() * 100;
  
  // Determine signals based on indicators
  const signals = {
    rsi: rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL',
    macd: macd > 0 ? 'BULLISH' : 'BEARISH',
    stochastic: stochastic > 80 ? 'OVERBOUGHT' : stochastic < 20 ? 'OVERSOLD' : 'NEUTRAL',
    volume: Math.random() > 0.5 ? 'INCREASING' : 'DECREASING',
    trend: Math.random() > 0.5 ? 'UPTREND' : Math.random() > 0.5 ? 'DOWNTREND' : 'SIDEWAYS',
  };
  
  // Calculate overall signal
  let bullishCount = 0;
  let bearishCount = 0;
  
  if (signals.rsi === 'OVERSOLD') bullishCount++;
  if (signals.rsi === 'OVERBOUGHT') bearishCount++;
  if (signals.macd === 'BULLISH') bullishCount++;
  if (signals.macd === 'BEARISH') bearishCount++;
  if (signals.trend === 'UPTREND') bullishCount++;
  if (signals.trend === 'DOWNTREND') bearishCount++;
  
  const overallSignal = bullishCount > bearishCount ? 'BULLISH' : 
                        bearishCount > bullishCount ? 'BEARISH' : 'NEUTRAL';
  
  return {
    symbol,
    assetType,
    timeframe,
    timestamp: new Date().toISOString(),
    technicalIndicators: {
      rsi: {
        value: rsi,
        signal: signals.rsi,
      },
      macd: {
        value: macd,
        signal: signals.macd,
        histogram: macd * 0.3,
      },
      stochastic: {
        k: stochastic,
        d: stochastic * 0.9,
        signal: signals.stochastic,
      },
      bollingerBands: {
        upper: 105,
        middle: 100,
        lower: 95,
        width: 10,
      },
      movingAverages: {
        sma20: 98 + Math.random() * 4,
        sma50: 97 + Math.random() * 6,
        sma200: 95 + Math.random() * 10,
        ema12: 99 + Math.random() * 2,
        ema26: 98 + Math.random() * 4,
      },
      volume: {
        current: Math.floor(Math.random() * 1000000),
        average: Math.floor(Math.random() * 800000),
        signal: signals.volume,
      },
    },
    patterns: {
      candlestick: ['DOJI', 'HAMMER', 'SHOOTING_STAR'][Math.floor(Math.random() * 3)],
      chartPattern: ['HEAD_AND_SHOULDERS', 'TRIANGLE', 'FLAG', 'WEDGE'][Math.floor(Math.random() * 4)],
    },
    signals,
    overallSignal,
    strength: Math.floor(Math.random() * 100),
    support: [95, 92, 90],
    resistance: [105, 108, 110],
  };
}