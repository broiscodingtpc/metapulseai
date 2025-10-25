import { ConsensusResult } from '../ai/schema.js';

export interface TokenSnapshot {
  // Market data from DexScreener
  price?: number;
  marketCap?: number;
  liquidity?: number;
  volume24h?: number;
  txCount1h?: number;
  ageHours?: number;
  dexsUrl?: string;

  // Social data from X (optional)
  xMentions1h?: number;
  xEngagementRate?: number;

  // On-chain data from PumpPortal
  uniqueBuyers?: number;
  buyerSellerRatio?: number;
  whaleShare?: number;

  // Token metadata
  name?: string;
  symbol?: string;
  mint: string;
}

export interface ScoreBreakdown {
  marketScore: number;      // 0-40
  socialScore: number;      // 0-30
  onChainScore: number;     // 0-30
  aiBonus: number;          // 0-15 (from AI consensus)
  finalScore: number;       // 0-115 (but capped at 100)
  confidence: number;       // 0-1
}

export class ScoreAssembler {
  
  /**
   * Calculate market subscore (0-40) from DexScreener metrics
   */
  private calculateMarketScore(snapshot: TokenSnapshot): number {
    let score = 0;
    
    // Liquidity score (0-15)
    const liquidity = snapshot.liquidity || 0;
    if (liquidity >= 100) score += 15;
    else if (liquidity >= 50) score += 12;
    else if (liquidity >= 20) score += 8;
    else if (liquidity >= 5) score += 4;
    else if (liquidity >= 1) score += 2;
    
    // Volume/Market Cap ratio (0-10)
    const marketCap = snapshot.marketCap || 0;
    const volume24h = snapshot.volume24h || 0;
    if (marketCap > 0) {
      const volMcapRatio = volume24h / marketCap;
      if (volMcapRatio >= 0.5) score += 10;
      else if (volMcapRatio >= 0.3) score += 8;
      else if (volMcapRatio >= 0.1) score += 6;
      else if (volMcapRatio >= 0.05) score += 4;
      else if (volMcapRatio >= 0.01) score += 2;
    }
    
    // Transaction activity (0-10)
    const txCount1h = snapshot.txCount1h || 0;
    if (txCount1h >= 100) score += 10;
    else if (txCount1h >= 50) score += 8;
    else if (txCount1h >= 20) score += 6;
    else if (txCount1h >= 10) score += 4;
    else if (txCount1h >= 5) score += 2;
    
    // Age penalty/bonus (0-5)
    const ageHours = snapshot.ageHours || 0;
    if (ageHours >= 24 && ageHours <= 168) score += 5; // 1-7 days sweet spot
    else if (ageHours >= 12 && ageHours <= 24) score += 3; // 12-24 hours
    else if (ageHours >= 6 && ageHours <= 12) score += 2; // 6-12 hours
    else if (ageHours >= 1 && ageHours <= 6) score += 1; // 1-6 hours
    // Very new (< 1h) or very old (> 7 days) get 0 bonus
    
    return Math.min(40, score);
  }

  /**
   * Calculate social subscore (0-30) from X data or on-chain momentum proxies
   */
  private calculateSocialScore(snapshot: TokenSnapshot): number {
    let score = 0;
    
    // If X data is available, use it
    if (snapshot.xMentions1h !== undefined && snapshot.xEngagementRate !== undefined) {
      // X mentions velocity (0-20)
      const mentions = snapshot.xMentions1h;
      if (mentions >= 50) score += 20;
      else if (mentions >= 20) score += 15;
      else if (mentions >= 10) score += 10;
      else if (mentions >= 5) score += 6;
      else if (mentions >= 1) score += 3;
      
      // X engagement rate (0-10)
      const engagement = snapshot.xEngagementRate;
      if (engagement >= 0.1) score += 10;
      else if (engagement >= 0.05) score += 8;
      else if (engagement >= 0.02) score += 6;
      else if (engagement >= 0.01) score += 4;
      else if (engagement >= 0.005) score += 2;
    } else {
      // Fallback to on-chain momentum proxies (0-10 max to avoid mocking)
      const uniqueBuyers = snapshot.uniqueBuyers || 0;
      const txCount1h = snapshot.txCount1h || 0;
      
      // Buyer momentum (0-6)
      if (uniqueBuyers >= 20) score += 6;
      else if (uniqueBuyers >= 10) score += 4;
      else if (uniqueBuyers >= 5) score += 2;
      else if (uniqueBuyers >= 2) score += 1;
      
      // Transaction cadence (0-4)
      if (txCount1h >= 30) score += 4;
      else if (txCount1h >= 15) score += 3;
      else if (txCount1h >= 8) score += 2;
      else if (txCount1h >= 3) score += 1;
    }
    
    return Math.min(30, score);
  }

  /**
   * Calculate on-chain subscore (0-30) from PumpPortal signals
   */
  private calculateOnChainScore(snapshot: TokenSnapshot): number {
    let score = 0;
    
    // Unique buyers distribution (0-12)
    const uniqueBuyers = snapshot.uniqueBuyers || 0;
    if (uniqueBuyers >= 50) score += 12;
    else if (uniqueBuyers >= 25) score += 10;
    else if (uniqueBuyers >= 15) score += 8;
    else if (uniqueBuyers >= 8) score += 6;
    else if (uniqueBuyers >= 4) score += 4;
    else if (uniqueBuyers >= 2) score += 2;
    
    // Buyer/seller ratio (0-10)
    const buyerSellerRatio = snapshot.buyerSellerRatio || 0;
    if (buyerSellerRatio >= 3.0) score += 10;
    else if (buyerSellerRatio >= 2.0) score += 8;
    else if (buyerSellerRatio >= 1.5) score += 6;
    else if (buyerSellerRatio >= 1.2) score += 4;
    else if (buyerSellerRatio >= 1.0) score += 2;
    
    // Whale share stability (0-8) - lower whale share is better
    const whaleShare = snapshot.whaleShare || 0;
    if (whaleShare <= 10) score += 8;
    else if (whaleShare <= 20) score += 6;
    else if (whaleShare <= 35) score += 4;
    else if (whaleShare <= 50) score += 2;
    // > 50% whale share gets 0 points
    
    return Math.min(30, score);
  }

  /**
   * Assemble final score from all components
   */
  assembleScore(snapshot: TokenSnapshot, consensusResult: ConsensusResult): ScoreBreakdown {
    const marketScore = this.calculateMarketScore(snapshot);
    const socialScore = this.calculateSocialScore(snapshot);
    const onChainScore = this.calculateOnChainScore(snapshot);
    
    // AI bonus from consensus probability (0-15)
    const aiBonus = Math.round(consensusResult.consensus.prob_enterable * 15);
    
    // Calculate weighted final score
    const rawFinalScore = Math.round(
      0.4 * marketScore +
      0.3 * socialScore +
      0.3 * onChainScore +
      0.15 * (consensusResult.consensus.prob_enterable * 100)
    );
    
    // Cap at 100
    const finalScore = Math.min(100, rawFinalScore);
    
    // Adjust confidence based on data freshness and sample sizes
    let adjustedConfidence = consensusResult.confidence;
    
    // Penalize confidence for low data quality
    const dataQualityPenalty = this.calculateDataQualityPenalty(snapshot);
    adjustedConfidence *= (1 - dataQualityPenalty);
    
    // Penalize confidence for high AI disagreement
    const disagreementPenalty = consensusResult.delta;
    adjustedConfidence *= (1 - disagreementPenalty);
    
    return {
      marketScore,
      socialScore,
      onChainScore,
      aiBonus,
      finalScore,
      confidence: Math.max(0, Math.min(1, adjustedConfidence))
    };
  }

  private calculateDataQualityPenalty(snapshot: TokenSnapshot): number {
    let penalty = 0;
    
    // Penalize missing key metrics
    if (!snapshot.liquidity || snapshot.liquidity <= 0) penalty += 0.1;
    if (!snapshot.volume24h || snapshot.volume24h <= 0) penalty += 0.1;
    if (!snapshot.uniqueBuyers || snapshot.uniqueBuyers <= 1) penalty += 0.15;
    if (!snapshot.txCount1h || snapshot.txCount1h <= 0) penalty += 0.1;
    if (!snapshot.ageHours || snapshot.ageHours <= 0) penalty += 0.05;
    
    return Math.min(0.4, penalty); // Cap penalty at 40%
  }
}