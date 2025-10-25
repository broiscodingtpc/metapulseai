interface TokenScore {
  tech: number;
  meta: number;
  total: number;
  label: string;
  metaScore?: number;
  reason?: string;
  riskLevel?: string;
  riskScore?: number;
  riskFlags?: string[];
  risk?: string[];
  analyzedAt?: string;
}

export interface BuyDecision {
  shouldBuy: boolean;
  confidence: number;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestedAmount: number; // in SOL
  maxPrice: number; // maximum price to pay
  stopLoss: number; // stop loss percentage
  takeProfit: number; // take profit percentage
}

export interface BuyDecisionCriteria {
  minAIScore: number;
  minMetaScore: number;
  minLiquidity: number;
  maxMarketCap: number;
  minVolume24h: number;
  maxPairAge: number; // in hours
  minTransactions: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxInvestmentPerToken: number; // in SOL
}

export class BuyDecisionEngine {
  private criteria: BuyDecisionCriteria;

  constructor(criteria?: Partial<BuyDecisionCriteria>) {
    this.criteria = {
      minAIScore: 45,           // Lowered from 70 to 45 to match actual token scores
      minMetaScore: 35,         // Lowered from 60 to 35 for more realistic filtering
      minLiquidity: 8000,       // Lowered from 10K to 8K for more opportunities
      maxMarketCap: 2000000,    // Increased from 1M to 2M for more flexibility
      minVolume24h: 3000,       // Lowered from 5K to 3K for more opportunities
      maxPairAge: 48,           // Increased from 24h to 48h for more tokens
      minTransactions: 30,      // Lowered from 50 to 30 for more opportunities
      riskTolerance: 'moderate',
      maxInvestmentPerToken: 1, // 1 SOL max per token
      ...criteria
    };
  }

  /**
   * Main buy decision function that combines all analysis
   */
  async makeBuyDecision(
    tokenScore: TokenScore,
    dexData: any,
    marketConditions: any
  ): Promise<BuyDecision> {
    const reasons: string[] = [];
    let confidence = 0;
    let shouldBuy = false;

    // 1. AI Score Analysis (40% weight)
    const aiScoreWeight = this.analyzeAIScore(tokenScore, reasons);
    confidence += aiScoreWeight * 0.4;

    // 2. Market Data Analysis (30% weight)
    const marketWeight = this.analyzeMarketData(dexData, reasons);
    confidence += marketWeight * 0.3;

    // 3. Risk Analysis (20% weight)
    const riskWeight = this.analyzeRisk(tokenScore, dexData, reasons);
    confidence += riskWeight * 0.2;

    // 4. Meta Trend Analysis (10% weight)
    const metaWeight = this.analyzeMetaTrend(tokenScore, reasons);
    confidence += metaWeight * 0.1;

    // Final decision logic
    shouldBuy = confidence >= 55 && this.passesBasicFilters(tokenScore, dexData);

    if (shouldBuy) {
      reasons.unshift(`✅ Strong buy signal with ${confidence.toFixed(1)}% confidence`);
    } else {
      reasons.unshift(`❌ No buy signal - confidence only ${confidence.toFixed(1)}%`);
    }

    return {
      shouldBuy,
      confidence: Math.round(confidence),
      reasons,
      riskLevel: this.calculateRiskLevel(tokenScore, dexData),
      suggestedAmount: this.calculateInvestmentAmount(confidence, dexData),
      maxPrice: this.calculateMaxPrice(dexData),
      stopLoss: this.calculateStopLoss(confidence),
      takeProfit: this.calculateTakeProfit(confidence, tokenScore.metaScore || 0)
    };
  }

  private analyzeAIScore(tokenScore: TokenScore, reasons: string[]): number {
    const totalScore = tokenScore.total || 0;
    const metaScore = tokenScore.metaScore || 0;

    if (totalScore >= 85) {
      reasons.push(`🚀 Exceptional AI score: ${totalScore}/100`);
      return 95;
    } else if (totalScore >= 75) {
      reasons.push(`🔥 High AI score: ${totalScore}/100`);
      return 80;
    } else if (totalScore >= 65) {
      reasons.push(`📈 Good AI score: ${totalScore}/100`);
      return 65;
    } else if (totalScore >= 50) {
      reasons.push(`📊 Decent AI score: ${totalScore}/100`);
      return 55;
    } else if (totalScore >= 40) {
      reasons.push(`⚡ Fair AI score: ${totalScore}/100`);
      return 45;
    } else {
      reasons.push(`⚠️ Low AI score: ${totalScore}/100`);
      return 25;
    }
  }

  private analyzeMarketData(dexData: any, reasons: string[]): number {
    let score = 0;
    const liquidity = parseFloat(dexData?.liquidity?.usd || 0);
    const volume24h = parseFloat(dexData?.volume?.h24 || 0);
    const marketCap = parseFloat(dexData?.fdv || dexData?.marketCap || 0);
    const priceChange = parseFloat(dexData?.priceChange?.h24 || 0);

    // Liquidity check
    if (liquidity >= 50000) {
      reasons.push(`💧 Strong liquidity: $${(liquidity/1000).toFixed(1)}K`);
      score += 30;
    } else if (liquidity >= 20000) {
      reasons.push(`💧 Good liquidity: $${(liquidity/1000).toFixed(1)}K`);
      score += 20;
    } else if (liquidity >= 10000) {
      reasons.push(`💧 Adequate liquidity: $${(liquidity/1000).toFixed(1)}K`);
      score += 10;
    } else {
      reasons.push(`⚠️ Low liquidity: $${(liquidity/1000).toFixed(1)}K`);
      return 20;
    }

    // Volume check
    if (volume24h >= 50000) {
      reasons.push(`📊 High volume: $${(volume24h/1000).toFixed(1)}K`);
      score += 25;
    } else if (volume24h >= 20000) {
      reasons.push(`📊 Good volume: $${(volume24h/1000).toFixed(1)}K`);
      score += 15;
    } else if (volume24h >= 5000) {
      reasons.push(`📊 Moderate volume: $${(volume24h/1000).toFixed(1)}K`);
      score += 10;
    }

    // Price momentum
    if (priceChange > 20) {
      reasons.push(`🚀 Strong momentum: +${priceChange.toFixed(1)}%`);
      score += 20;
    } else if (priceChange > 10) {
      reasons.push(`📈 Good momentum: +${priceChange.toFixed(1)}%`);
      score += 15;
    } else if (priceChange > 0) {
      reasons.push(`📈 Positive trend: +${priceChange.toFixed(1)}%`);
      score += 10;
    }

    // Market cap check (prefer smaller caps for higher upside)
    if (marketCap < 100000) {
      reasons.push(`💎 Micro cap potential: $${(marketCap/1000).toFixed(1)}K`);
      score += 15;
    } else if (marketCap < 500000) {
      reasons.push(`💰 Small cap: $${(marketCap/1000).toFixed(1)}K`);
      score += 10;
    }

    return Math.min(100, score);
  }

  private analyzeRisk(tokenScore: TokenScore, dexData: any, reasons: string[]): number {
    let score = 100; // Start with perfect score, deduct for risks
    
    const riskFlags = tokenScore.risk || [];
    const liquidity = parseFloat(dexData?.liquidity?.usd || 0);
    const transactions = (dexData?.txns?.h24?.buys || 0) + (dexData?.txns?.h24?.sells || 0);

    // Analyze risk flags
    riskFlags.forEach(flag => {
      if (flag.includes('Very low initial buy')) {
        reasons.push(`⚠️ Risk: ${flag}`);
        score -= 20;
      } else if (flag.includes('Single buyer')) {
        reasons.push(`⚠️ Risk: ${flag}`);
        score -= 25;
      } else if (flag.includes('Low liquidity')) {
        reasons.push(`⚠️ Risk: ${flag}`);
        score -= 15;
      }
    });

    // Low transaction count risk
    if (transactions < 20) {
      reasons.push(`⚠️ Low activity: ${transactions} transactions`);
      score -= 20;
    } else if (transactions >= 100) {
      reasons.push(`✅ Good activity: ${transactions} transactions`);
      score += 10;
    }

    // Liquidity risk
    if (liquidity < 5000) {
      reasons.push(`⚠️ Liquidity risk: $${(liquidity/1000).toFixed(1)}K`);
      score -= 30;
    }

    return Math.max(0, score);
  }

  private analyzeMetaTrend(tokenScore: TokenScore, reasons: string[]): number {
    const category = tokenScore.label || 'unknown';
    const metaScore = tokenScore.metaScore || 0;

    // Trending categories get bonus points
    const trendingCategories = ['ai-agents', 'frogs', 'gaming', 'meme', 'defi'];
    
    if (trendingCategories.includes(category) && metaScore >= 70) {
      reasons.push(`🔥 Trending ${category} meta with ${metaScore} score`);
      return 90;
    } else if (trendingCategories.includes(category)) {
      reasons.push(`📈 ${category} meta trend`);
      return 70;
    } else if (metaScore >= 80) {
      reasons.push(`⭐ High meta score: ${metaScore}`);
      return 60;
    } else {
      reasons.push(`📊 Meta: ${category} (${metaScore})`);
      return 40;
    }
  }

  private passesBasicFilters(tokenScore: TokenScore, dexData: any): boolean {
    const totalScore = tokenScore.total || 0;
    const liquidity = parseFloat(dexData?.liquidity?.usd || 0);
    const marketCap = parseFloat(dexData?.fdv || dexData?.marketCap || 0);
    const volume24h = parseFloat(dexData?.volume?.h24 || 0);

    return (
      totalScore >= this.criteria.minAIScore &&
      liquidity >= this.criteria.minLiquidity &&
      marketCap <= this.criteria.maxMarketCap &&
      volume24h >= this.criteria.minVolume24h
    );
  }

  private calculateRiskLevel(tokenScore: TokenScore, dexData: any): 'low' | 'medium' | 'high' {
    const riskFlags = tokenScore.risk || [];
    const liquidity = parseFloat(dexData?.liquidity?.usd || 0);
    const transactions = (dexData?.txns?.h24?.buys || 0) + (dexData?.txns?.h24?.sells || 0);

    if (riskFlags.length >= 3 || liquidity < 10000 || transactions < 20) {
      return 'high';
    } else if (riskFlags.length >= 1 || liquidity < 25000 || transactions < 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private calculateInvestmentAmount(confidence: number, dexData: any): number {
    const baseAmount = this.criteria.maxInvestmentPerToken;
    const confidenceMultiplier = confidence / 100;
    
    // Reduce amount for high-risk scenarios
    const liquidity = parseFloat(dexData?.liquidity?.usd || 0);
    const liquidityMultiplier = Math.min(1, liquidity / 25000);
    
    return Math.round((baseAmount * confidenceMultiplier * liquidityMultiplier) * 100) / 100;
  }

  private calculateMaxPrice(dexData: any): number {
    const currentPrice = parseFloat(dexData?.priceUsd || 0);
    return currentPrice * 1.05; // 5% slippage tolerance
  }

  private calculateStopLoss(confidence: number): number {
    // Higher confidence = tighter stop loss
    if (confidence >= 85) return 15; // 15% stop loss
    if (confidence >= 75) return 20; // 20% stop loss
    return 25; // 25% stop loss
  }

  private calculateTakeProfit(confidence: number, metaScore: number): number {
    // Base take profit on confidence and meta trend strength
    let takeProfit = 50; // Base 50%
    
    if (confidence >= 85) takeProfit += 50; // Up to 100%
    if (metaScore >= 80) takeProfit += 25; // Trending meta bonus
    
    return Math.min(200, takeProfit); // Cap at 200%
  }

  /**
   * Update criteria based on market conditions
   */
  updateCriteria(newCriteria: Partial<BuyDecisionCriteria>) {
    this.criteria = { ...this.criteria, ...newCriteria };
  }

  /**
   * Get current criteria
   */
  getCriteria(): BuyDecisionCriteria {
    return { ...this.criteria };
  }
}