import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import OpenAI from 'openai';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface StockData {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector?: string;
}

interface PortfolioAnalysisRequest {
  stocks: string[];
  analysisType: 'overview' | 'detailed' | 'comparison' | 'sector' | 'risk';
}

// Enhanced AI toolbox for portfolio analysis
class PortfolioAnalyzer {
  private stocks: StockData[];

  constructor(stocks: StockData[]) {
    this.stocks = stocks;
  }

  compareStocks(): any {
    const sorted = [...this.stocks].sort((a, b) => b.changePercent - a.changePercent);
    return {
      topPerformers: sorted.slice(0, 3),
      bottomPerformers: sorted.slice(-3),
      averageChange: this.stocks.reduce((sum, s) => sum + s.changePercent, 0) / this.stocks.length,
    };
  }

  calculatePortfolioCorrelation(): number {
    // Simplified correlation calculation
    const volatilities = this.stocks.map(s => Math.abs(s.changePercent));
    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
    const diversity = 1 - (Math.min(...volatilities) / Math.max(...volatilities));
    return diversity;
  }

  analyzeSectorExposure(): any {
    const sectors: Record<string, number> = {};
    this.stocks.forEach(stock => {
      const sector = stock.sector || 'Unknown';
      sectors[sector] = (sectors[sector] || 0) + 1;
    });
    
    return {
      sectorCount: Object.keys(sectors).length,
      distribution: sectors,
      diversified: Object.keys(sectors).length > 3,
    };
  }

  identifyTopMovers(): any {
    const gainers = this.stocks.filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    const losers = this.stocks.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    
    return {
      biggestGainers: gainers.slice(0, 3),
      biggestLosers: losers.slice(0, 3),
      gainingStocks: gainers.length,
      losingStocks: losers.length,
    };
  }

  calculateRiskMetrics(): any {
    const changes = this.stocks.map(s => Math.abs(s.changePercent));
    const avgVolatility = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    const maxDrawdown = Math.min(...this.stocks.map(s => s.changePercent));
    
    return {
      portfolioVolatility: avgVolatility,
      maxDrawdown: maxDrawdown,
      riskLevel: avgVolatility > 5 ? 'HIGH' : avgVolatility > 2 ? 'MEDIUM' : 'LOW',
      volatileStocks: this.stocks.filter(s => Math.abs(s.changePercent) > 5).map(s => s.symbol),
    };
  }

  generateActionableInsights(): string[] {
    const insights: string[] = [];
    const comparison = this.compareStocks();
    const risk = this.calculateRiskMetrics();
    const movers = this.identifyTopMovers();
    
    // Performance insights
    if (comparison.averageChange > 2) {
      insights.push(`Strong portfolio performance with ${comparison.averageChange.toFixed(2)}% average gain`);
    } else if (comparison.averageChange < -2) {
      insights.push(`Portfolio under pressure with ${Math.abs(comparison.averageChange).toFixed(2)}% average decline`);
    }
    
    // Risk insights
    if (risk.riskLevel === 'HIGH') {
      insights.push(`High volatility detected in ${risk.volatileStocks.join(', ')} - consider position sizing`);
    }
    
    // Opportunity insights
    if (movers.biggestLosers.length > 0 && movers.biggestLosers[0].changePercent < -5) {
      insights.push(`${movers.biggestLosers[0].symbol} down ${Math.abs(movers.biggestLosers[0].changePercent).toFixed(2)}% - potential buying opportunity if fundamentals remain strong`);
    }
    
    // Sector insights
    const sectors = this.analyzeSectorExposure();
    if (!sectors.diversified) {
      insights.push('Consider diversifying across more sectors to reduce concentration risk');
    }
    
    return insights;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: PortfolioAnalysisRequest = JSON.parse(event.body || '{}');
    const { stocks, analysisType = 'overview' } = body;
    
    if (!stocks || stocks.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No stocks provided' }),
      };
    }
    
    // Fetch stock data from DynamoDB
    const stockData = await fetchStockData(stocks);
    const analyzer = new PortfolioAnalyzer(stockData);
    
    // Generate analysis based on type
    let analysis: any = {};
    let aiPrompt = '';
    
    switch (analysisType) {
      case 'detailed':
        analysis = {
          comparison: analyzer.compareStocks(),
          risk: analyzer.calculateRiskMetrics(),
          sectors: analyzer.analyzeSectorExposure(),
          movers: analyzer.identifyTopMovers(),
          insights: analyzer.generateActionableInsights(),
        };
        aiPrompt = generateDetailedPrompt(analysis, stockData);
        break;
        
      case 'comparison':
        analysis = {
          stocks: analyzer.compareStocks(),
          correlation: analyzer.calculatePortfolioCorrelation(),
        };
        aiPrompt = generateComparisonPrompt(analysis, stockData);
        break;
        
      case 'sector':
        analysis = analyzer.analyzeSectorExposure();
        aiPrompt = generateSectorPrompt(analysis, stockData);
        break;
        
      case 'risk':
        analysis = analyzer.calculateRiskMetrics();
        aiPrompt = generateRiskPrompt(analysis, stockData);
        break;
        
      default:
        analysis = {
          movers: analyzer.identifyTopMovers(),
          insights: analyzer.generateActionableInsights(),
        };
        aiPrompt = generateOverviewPrompt(analysis, stockData);
    }
    
    // Get AI analysis
    const aiResponse = await generateAIAnalysis(aiPrompt);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        analysisType,
        metrics: analysis,
        aiAnalysis: aiResponse,
        timestamp: new Date().toISOString(),
      }),
    };
    
  } catch (error) {
    console.error('Error in portfolio analysis:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate portfolio analysis' }),
    };
  }
};

async function fetchStockData(symbols: string[]): Promise<StockData[]> {
  const keys = symbols.map(symbol => ({ symbol }));
  
  const command = new BatchGetCommand({
    RequestItems: {
      'MarketData': {
        Keys: keys,
      },
    },
  });
  
  const response = await docClient.send(command);
  const items = response.Responses?.['MarketData'] || [];
  
  return items.map(item => ({
    symbol: item.symbol,
    currentPrice: item.currentPrice || 0,
    changePercent: item.percentChange24h || 0,
    volume: item.volume || 0,
    marketCap: item.marketCap || 0,
    sector: item.sector,
  }));
}

function generateOverviewPrompt(analysis: any, stocks: StockData[]): string {
  return `
    Analyze this portfolio of ${stocks.length} stocks:
    
    Top Movers:
    - Gainers: ${analysis.movers.gainingStocks} stocks
    - Losers: ${analysis.movers.losingStocks} stocks
    
    Key Insights:
    ${analysis.insights.join('\\n')}
    
    Provide a concise portfolio overview with:
    1. Overall market sentiment
    2. Key opportunities
    3. Risk assessment
    4. 2-3 actionable recommendations
  `;
}

function generateDetailedPrompt(analysis: any, stocks: StockData[]): string {
  return `
    Comprehensive portfolio analysis for ${stocks.length} stocks:
    
    Performance Metrics:
    - Average Change: ${analysis.comparison.averageChange.toFixed(2)}%
    - Top Performer: ${analysis.comparison.topPerformers[0]?.symbol}
    - Risk Level: ${analysis.risk.riskLevel}
    - Portfolio Volatility: ${analysis.risk.portfolioVolatility.toFixed(2)}%
    
    Sector Exposure:
    - Sectors: ${analysis.sectors.sectorCount}
    - Diversified: ${analysis.sectors.diversified ? 'Yes' : 'No'}
    
    Provide detailed analysis covering:
    1. Portfolio health assessment
    2. Risk-adjusted performance evaluation
    3. Sector allocation recommendations
    4. Specific stock actions (buy/sell/hold)
    5. Portfolio optimization strategies
  `;
}

function generateComparisonPrompt(analysis: any, stocks: StockData[]): string {
  return `
    Compare these ${stocks.length} stocks:
    
    Performance Ranking:
    ${analysis.stocks.topPerformers.map((s: StockData, i: number) => 
      `${i + 1}. ${s.symbol}: ${s.changePercent.toFixed(2)}%`
    ).join('\\n')}
    
    Portfolio Correlation: ${(analysis.correlation * 100).toFixed(2)}%
    
    Provide:
    1. Relative performance analysis
    2. Correlation insights
    3. Which stocks to overweight/underweight
    4. Pair trading opportunities
  `;
}

function generateSectorPrompt(analysis: any, stocks: StockData[]): string {
  return `
    Sector analysis for portfolio:
    
    Distribution: ${JSON.stringify(analysis.distribution)}
    Diversified: ${analysis.diversified}
    
    Provide:
    1. Sector rotation insights
    2. Over/underweight recommendations
    3. Sector-specific risks
    4. Rebalancing suggestions
  `;
}

function generateRiskPrompt(analysis: any, stocks: StockData[]): string {
  return `
    Risk analysis for portfolio:
    
    Risk Level: ${analysis.riskLevel}
    Portfolio Volatility: ${analysis.portfolioVolatility.toFixed(2)}%
    Max Drawdown: ${analysis.maxDrawdown.toFixed(2)}%
    Volatile Stocks: ${analysis.volatileStocks.join(', ')}
    
    Provide:
    1. Risk assessment
    2. Volatility management strategies
    3. Hedging recommendations
    4. Position sizing suggestions
  `;
}

async function generateAIAnalysis(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a professional portfolio analyst providing actionable investment insights. Be concise, specific, and focus on practical recommendations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content || 'Unable to generate analysis';
}