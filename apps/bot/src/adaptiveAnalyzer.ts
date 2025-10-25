import { cfg } from './config.js';

interface MarketCondition {
  volatility: 'low' | 'medium' | 'high';
  trend: 'bearish' | 'neutral' | 'bullish';
  volume: 'low' | 'medium' | 'high';
  sentiment: 'negative' | 'neutral' | 'positive';
}

interface AdaptiveCriteria {
  minLiquidity: number;
  maxLiquidity: number;
  minMarketCap: number;
  maxMarketCap: number;
  maxPairAge: number;
  minTransactions: number;
  minVolumeChange: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

interface TokenPerformance {
  address: string;
  symbol: string;
  signalTime: number;
  initialPrice: number;
  currentPrice: number;
  performance: number;
  success: boolean;
}

class AdaptiveAnalyzer {
  private performanceHistory: TokenPerformance[] = [];
  private marketHistory: MarketCondition[] = [];
  private successRate: number = 0;
  private lastAnalysis: number = 0;

  constructor() {
    this.loadHistoricalData();
  }

  /**
   * Analyze current market conditions using multiple data sources
   */
  async analyzeMarketConditions(): Promise<MarketCondition> {
    try {
      // Fetch market data from multiple sources
      const [dexData, coinGeckoData] = await Promise.all([
        this.fetchDexScreenerMarketData(),
        this.fetchCoinGeckoMarketData()
      ]);

      // Calculate volatility based on price movements
      const volatility = this.calculateVolatility(dexData);
      
      // Determine trend based on price changes and volume
      const trend = this.determineTrend(dexData, coinGeckoData);
      
      // Analyze volume patterns
      const volume = this.analyzeVolume(dexData);
      
      // Get sentiment from social metrics (simplified for now)
      const sentiment = this.analyzeSentiment(coinGeckoData);

      const condition: MarketCondition = {
        volatility,
        trend,
        volume,
        sentiment
      };

      // Store for historical analysis
      this.marketHistory.push(condition);
      if (this.marketHistory.length > 100) {
        this.marketHistory.shift();
      }

      return condition;
    } catch (error) {
      console.error('❌ Error analyzing market conditions:', error);
      // Return neutral conditions as fallback
      return {
        volatility: 'medium',
        trend: 'neutral',
        volume: 'medium',
        sentiment: 'neutral'
      };
    }
  }

  /**
   * Generate adaptive criteria based on market conditions and performance history
   */
  generateAdaptiveCriteria(marketCondition: MarketCondition): AdaptiveCriteria {
    // Base criteria (more realistic values based on actual market data)
    let criteria: AdaptiveCriteria = {
      minLiquidity: 5000,       // Lowered from 10k to 5k for more opportunities
      maxLiquidity: 10000000,
      minMarketCap: 10000,      // Lowered from 20k to 10k
      maxMarketCap: 300000000,  // Increased from 144M to 300M for more flexibility
      maxPairAge: 96,           // Increased from 72h to 96h (4 days)
      minTransactions: 50,      // Lowered from 100 to 50
      minVolumeChange: -75,     // Allow more negative changes
      riskLevel: 'moderate'
    };

    // Adjust based on market volatility
    if (marketCondition.volatility === 'high') {
      criteria.minLiquidity *= 1.2; // Less strict multiplier
      criteria.minTransactions *= 1.1; // Less strict multiplier
      criteria.maxPairAge *= 0.8; // Less strict multiplier
      criteria.riskLevel = 'conservative';
    } else if (marketCondition.volatility === 'low') {
      criteria.minLiquidity *= 0.7; // More aggressive reduction
      criteria.maxMarketCap *= 1.3; // Allow even larger caps
      criteria.riskLevel = 'aggressive';
    }

    // Adjust based on market trend
    if (marketCondition.trend === 'bullish') {
      criteria.maxMarketCap *= 1.8; // Much more flexible in bull market
      criteria.minVolumeChange = 5; // Require some positive volume change
      criteria.maxPairAge *= 1.3; // Can accept older pairs
    } else if (marketCondition.trend === 'bearish') {
      criteria.minLiquidity *= 1.1; // Less conservative than before
      criteria.maxMarketCap *= 0.8; // Focus on smaller caps
      criteria.minTransactions *= 1.2; // Moderate increase
      criteria.riskLevel = 'conservative';
    }

    // Adjust based on volume conditions
    if (marketCondition.volume === 'low') {
      criteria.minTransactions *= 0.7; // Much lower transaction requirement
      criteria.minLiquidity *= 1.1; // Slight increase in liquidity needed
    } else if (marketCondition.volume === 'high') {
      criteria.minTransactions *= 1.1; // Moderate increase
      criteria.minVolumeChange = 5; // Require some volume growth
    }

    // Adjust based on sentiment
    if (marketCondition.sentiment === 'positive') {
      criteria.maxPairAge *= 1.4; // More flexible with age
      criteria.minVolumeChange = 10; // Require volume growth
    } else if (marketCondition.sentiment === 'negative') {
      criteria.minLiquidity *= 1.2; // More conservative but not extreme
      criteria.maxPairAge *= 0.7; // Prefer newer pairs
      criteria.riskLevel = 'conservative';
    }

    // Adjust based on historical performance
    if (this.successRate < 0.3) {
      // Poor performance - be more conservative but not too strict
      criteria.minLiquidity *= 1.2;
      criteria.minTransactions *= 1.2;
      criteria.maxMarketCap *= 0.9;
      criteria.riskLevel = 'conservative';
    } else if (this.successRate > 0.7) {
      // Good performance - can be more aggressive
      criteria.minLiquidity *= 0.8;
      criteria.maxMarketCap *= 1.4;
      criteria.riskLevel = 'aggressive';
    }

    return criteria;
  }

  /**
   * Track token performance for learning
   */
  async trackTokenPerformance(tokens: any[]) {
    const now = Date.now();
    
    // Add new tokens to tracking
    for (const token of tokens) {
      this.performanceHistory.push({
        address: token.address,
        symbol: token.symbol,
        signalTime: now,
        initialPrice: token.price,
        currentPrice: token.price,
        performance: 0,
        success: false
      });
    }

    // Update existing tokens (check performance after 24h)
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const tokensToUpdate = this.performanceHistory.filter(
      t => t.signalTime < oneDayAgo && t.signalTime > oneDayAgo - (60 * 60 * 1000)
    );

    for (const token of tokensToUpdate) {
      try {
        const currentPrice = await this.getCurrentTokenPrice(token.address);
        if (currentPrice > 0) {
          token.currentPrice = currentPrice;
          token.performance = ((currentPrice - token.initialPrice) / token.initialPrice) * 100;
          token.success = token.performance > 10; // 10% gain threshold
        }
      } catch (error) {
        console.error(`Error updating price for ${token.symbol}:`, error);
      }
    }

    // Calculate success rate
    const completedTokens = this.performanceHistory.filter(t => t.performance !== 0);
    if (completedTokens.length > 0) {
      this.successRate = completedTokens.filter(t => t.success).length / completedTokens.length;
    }

    // Clean old data (keep last 1000 entries)
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
  }

  /**
   * Get adaptive insights for display
   */
  getAdaptiveInsights(marketCondition: MarketCondition, criteria: AdaptiveCriteria): string {
    const insights = [];
    
    insights.push(`🧠 **AI Market Analysis:**`);
    insights.push(`📊 Volatility: ${marketCondition.volatility.toUpperCase()}`);
    insights.push(`📈 Trend: ${marketCondition.trend.toUpperCase()}`);
    insights.push(`📦 Volume: ${marketCondition.volume.toUpperCase()}`);
    insights.push(`😊 Sentiment: ${marketCondition.sentiment.toUpperCase()}`);
    insights.push(``);
    
    insights.push(`🎯 **Adaptive Strategy: ${criteria.riskLevel.toUpperCase()}**`);
    insights.push(`💧 Min Liquidity: $${(criteria.minLiquidity / 1000).toFixed(0)}K`);
    insights.push(`💰 Market Cap Range: $${(criteria.minMarketCap / 1000000).toFixed(1)}M - $${(criteria.maxMarketCap / 1000000).toFixed(0)}M`);
    insights.push(`⏰ Max Age: ${criteria.maxPairAge}h`);
    insights.push(`🔄 Min Transactions: ${criteria.minTransactions.toLocaleString()}`);
    
    if (this.performanceHistory.length > 10) {
      insights.push(``);
      insights.push(`📈 **AI Performance:**`);
      insights.push(`✅ Success Rate: ${(this.successRate * 100).toFixed(1)}%`);
      insights.push(`📊 Signals Tracked: ${this.performanceHistory.length}`);
    }

    return insights.join('\n');
  }

  // Private helper methods
  private async fetchDexScreenerMarketData() {
    const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana&rankBy=trendingScoreH24&order=desc');
    return await response.json();
  }

  private async fetchCoinGeckoMarketData() {
    try {
      // Free tier CoinGecko API
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  private calculateVolatility(data: any): 'low' | 'medium' | 'high' {
    if (!data.pairs || data.pairs.length === 0) return 'medium';
    
    const priceChanges = data.pairs
      .slice(0, 20)
      .map((p: any) => Math.abs(parseFloat(p.priceChange?.h24 || 0)))
      .filter((change: number) => !isNaN(change));
    
    if (priceChanges.length === 0) return 'medium';
    
    const avgVolatility = priceChanges.reduce((a: number, b: number) => a + b, 0) / priceChanges.length;
    
    if (avgVolatility > 50) return 'high';
    if (avgVolatility < 15) return 'low';
    return 'medium';
  }

  private determineTrend(dexData: any, coinGeckoData: any): 'bearish' | 'neutral' | 'bullish' {
    if (!dexData.pairs || dexData.pairs.length === 0) return 'neutral';
    
    const positiveChanges = dexData.pairs
      .slice(0, 20)
      .filter((p: any) => parseFloat(p.priceChange?.h24 || 0) > 0).length;
    
    const ratio = positiveChanges / Math.min(20, dexData.pairs.length);
    
    if (ratio > 0.6) return 'bullish';
    if (ratio < 0.4) return 'bearish';
    return 'neutral';
  }

  private analyzeVolume(data: any): 'low' | 'medium' | 'high' {
    if (!data.pairs || data.pairs.length === 0) return 'medium';
    
    const volumes = data.pairs
      .slice(0, 20)
      .map((p: any) => parseFloat(p.volume?.h24 || 0))
      .filter((vol: number) => !isNaN(vol) && vol > 0);
    
    if (volumes.length === 0) return 'medium';
    
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    if (avgVolume > 1000000) return 'high';
    if (avgVolume < 100000) return 'low';
    return 'medium';
  }

  private analyzeSentiment(coinGeckoData: any): 'negative' | 'neutral' | 'positive' {
    // Simplified sentiment analysis based on market cap changes
    // In a real implementation, this would use social media APIs
    if (!coinGeckoData?.data?.market_cap_change_percentage_24h_usd) return 'neutral';
    
    const change = coinGeckoData.data.market_cap_change_percentage_24h_usd;
    
    if (change > 3) return 'positive';
    if (change < -3) return 'negative';
    return 'neutral';
  }

  private async getCurrentTokenPrice(address: string): Promise<number> {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        return parseFloat(data.pairs[0].priceUsd || 0);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private loadHistoricalData() {
    // In a real implementation, this would load from a database
    // For now, we'll start fresh each time
    this.performanceHistory = [];
    this.marketHistory = [];
    this.successRate = 0.5; // Start with neutral assumption
  }

  /**
   * Get performance statistics for reporting
   */
  getPerformanceStats(): {
    totalTracked: number;
    avgPerformance: number;
    bestPerformer: string | null;
    successRate: number;
  } {
    const completedTokens = this.performanceHistory.filter(t => t.performance !== 0);
    
    const avgPerformance = completedTokens.length > 0 
      ? completedTokens.reduce((sum, token) => sum + token.performance, 0) / completedTokens.length
      : 0;

    const bestPerformer = completedTokens.length > 0
      ? completedTokens.reduce((best, current) => 
          current.performance > best.performance ? current : best
        ).symbol
      : null;

    return {
      totalTracked: this.performanceHistory.length,
      avgPerformance: Math.round(avgPerformance * 100) / 100,
      bestPerformer,
      successRate: Math.round(this.successRate * 100) / 100
    };
  }
}

export { AdaptiveAnalyzer, MarketCondition, AdaptiveCriteria, TokenPerformance };