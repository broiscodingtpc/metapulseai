import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDexScreenerClient, DexPair } from '@metapulse/dexscreener';
import { getDatabaseClient, TokenScore, MarketSnapshot } from './database';

// Legacy types for backward compatibility
export type Snapshot = {
  mint: string;
  name?: string;
  symbol?: string;
  desc?: string;
  buyers1m: number;
  sellers1m: number;
  uniqBuyers1m: number;
  priceImpact01?: number;
  initialBuy?: number;
  solAmount?: number;
  marketCap?: number;
};

// New comprehensive scoring interfaces
export interface HeuristicMetrics {
  volumeScore: number;
  liquidityScore: number;
  priceActionScore: number;
  socialScore: number;
  riskScore: number;
  momentumScore: number;
  totalScore: number;
}

export interface TokenAnalysis {
  mint: string;
  heuristicMetrics: HeuristicMetrics;
  dexData: DexPair[];
  marketSnapshot: MarketSnapshot | null;
  aiAnalysis?: AIAnalysis;
  finalScore: number;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
}

export interface AIAnalysis {
  score: number;
  confidence: number;
  probEnterable: number;
  expectedRoiP50: number;
  expectedRoiP90: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  metaCategory?: string;
  metaScore?: number;
  modelResponse: any;
}

export interface ScoringConfig {
  geminiApiKey: string;
  geminiModel?: string;
  heuristicWeights?: {
    volume: number;
    liquidity: number;
    priceAction: number;
    social: number;
    risk: number;
    momentum: number;
  };
  aiWeight?: number; // 0-1, how much to weight AI vs heuristics
  minLiquidity?: number;
  minVolume?: number;
  maxRiskTolerance?: number;
}

// Legacy function for backward compatibility
export function techScore(s: Snapshot, cfg: {
  minUniqueBuyers: number;
  maxImpactPct: number;
  minBuyerSeller: number;
}) {
  const reasons: string[] = [];
  let score = 0;

  // 1. Unique Buyers (Strong organic interest)
  if (s.uniqBuyers1m >= cfg.minUniqueBuyers * 2) { 
    score += 30; 
    reasons.push("🔥 Strong community"); 
  } else if (s.uniqBuyers1m >= cfg.minUniqueBuyers) { 
    score += 20; 
    reasons.push("✅ Good buyers"); 
  }

  // 2. Buy Pressure (Buying momentum)
  if (s.buyers1m > 0) {
    const ratio = s.buyers1m / Math.max(1, s.sellers1m);
    if (ratio >= cfg.minBuyerSeller * 2) { 
      score += 30; 
      reasons.push("🚀 High buy pressure"); 
    } else if (ratio >= cfg.minBuyerSeller) { 
      score += 20; 
      reasons.push("📈 Positive momentum"); 
    }
  }

  // 3. Price Impact (Low impact = healthy liquidity)
  if (typeof s.priceImpact01 === "number") {
    if (s.priceImpact01 <= cfg.maxImpactPct / 2) { 
      score += 20; 
      reasons.push("💎 Excellent liquidity"); 
    } else if (s.priceImpact01 <= cfg.maxImpactPct) { 
      score += 15; 
      reasons.push("💧 Good liquidity"); 
    }
  } else {
    score += 5; 
    reasons.push("⚠️ Liquidity unknown");
  }

  // 4. Initial Buy Quality (Whale or retail?)
  if (s.initialBuy && s.solAmount) {
    const buySize = s.solAmount;
    if (buySize >= 5) {
      score += 15;
      reasons.push("🐋 Whale entry");
    } else if (buySize >= 1) {
      score += 10;
      reasons.push("💰 Strong entry");
    } else if (buySize >= 0.1) {
      score += 5;
      reasons.push("✓ Retail entry");
    }
  }

  // 5. Token Quality (Professional naming)
  if (s.name && s.symbol) {
    const hasCleanSymbol = s.symbol.length >= 2 && s.symbol.length <= 6;
    const hasCleanName = s.name.length >= 3 && s.name.length <= 30;
    const noSpam = !s.name.toLowerCase().includes('test') && 
                   !s.symbol.toLowerCase().includes('test');
    
    if (hasCleanSymbol && hasCleanName && noSpam) { 
      score += 10; 
      reasons.push("✨ Professional"); 
    } else if (hasCleanSymbol && hasCleanName) {
      score += 5;
      reasons.push("⚡ Clean naming");
    }
  }

  return { score: Math.min(100, score), reasons };
}

export function totalScore(tech: number, meta: number) {
  // Weight: 50% tech, 50% meta for balanced analysis
  return Math.round(0.5 * tech + 0.5 * meta);
}

// New comprehensive scoring engine
export class ScoringEngine {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: Required<ScoringConfig>;

  constructor(config: ScoringConfig) {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.geminiModel || 'gemini-1.5-flash' 
    });

    // Set default configuration
    this.config = {
      geminiApiKey: config.geminiApiKey,
      geminiModel: config.geminiModel || 'gemini-1.5-flash',
      heuristicWeights: {
        volume: 0.25,
        liquidity: 0.20,
        priceAction: 0.20,
        social: 0.15,
        risk: 0.10,
        momentum: 0.10,
        ...config.heuristicWeights
      },
      aiWeight: config.aiWeight || 0.4, // 40% AI, 60% heuristics
      minLiquidity: config.minLiquidity || 1000,
      minVolume: config.minVolume || 5000,
      maxRiskTolerance: config.maxRiskTolerance || 0.7
    };
  }

  // Calculate heuristic-based score
  calculateHeuristicScore(dexData: DexPair[], marketSnapshot: MarketSnapshot | null): HeuristicMetrics {
    if (dexData.length === 0) {
      return {
        volumeScore: 0,
        liquidityScore: 0,
        priceActionScore: 0,
        socialScore: 0,
        riskScore: 0,
        momentumScore: 0,
        totalScore: 0
      };
    }

    // Aggregate data from all pairs
    const totalVolume24h = dexData.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0);
    const totalLiquidity = dexData.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0);
    const avgPriceChange24h = dexData.reduce((sum, pair) => sum + (pair.priceChange?.h24 || 0), 0) / dexData.length;
    const totalTxns24h = dexData.reduce((sum, pair) => 
      sum + (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0), 0);

    // Volume Score (0-100)
    const volumeScore = Math.min(100, Math.max(0, 
      Math.log10(totalVolume24h + 1) * 10 - 30
    ));

    // Liquidity Score (0-100)
    const liquidityScore = Math.min(100, Math.max(0,
      Math.log10(totalLiquidity + 1) * 12 - 36
    ));

    // Price Action Score (0-100) - considers both positive movement and volatility
    const priceActionScore = Math.min(100, Math.max(0,
      50 + (avgPriceChange24h * 2) // Centered at 50, +/- based on price change
    ));

    // Social Score (0-100) - based on transaction activity and pair count
    const socialScore = Math.min(100, Math.max(0,
      (Math.log10(totalTxns24h + 1) * 8) + (dexData.length * 5)
    ));

    // Risk Score (0-100, lower is better) - based on liquidity depth and volatility
    const liquidityRisk = totalLiquidity < this.config.minLiquidity ? 50 : 0;
    const volatilityRisk = Math.abs(avgPriceChange24h) > 50 ? 30 : 0;
    const pairCountRisk = dexData.length < 2 ? 20 : 0;
    const riskScore = Math.max(0, 100 - liquidityRisk - volatilityRisk - pairCountRisk);

    // Momentum Score (0-100) - based on short-term vs long-term performance
    const momentum1h = dexData.reduce((sum, pair) => sum + (pair.priceChange?.h1 || 0), 0) / dexData.length;
    const momentum6h = dexData.reduce((sum, pair) => sum + (pair.priceChange?.h6 || 0), 0) / dexData.length;
    const momentumScore = Math.min(100, Math.max(0,
      50 + (momentum1h * 2) + (momentum6h * 1)
    ));

    // Calculate weighted total score
    const weights = this.config.heuristicWeights;
    const totalScore = 
      (volumeScore * weights.volume) +
      (liquidityScore * weights.liquidity) +
      (priceActionScore * weights.priceAction) +
      (socialScore * weights.social) +
      (riskScore * weights.risk) +
      (momentumScore * weights.momentum);

    return {
      volumeScore: Math.round(volumeScore),
      liquidityScore: Math.round(liquidityScore),
      priceActionScore: Math.round(priceActionScore),
      socialScore: Math.round(socialScore),
      riskScore: Math.round(riskScore),
      momentumScore: Math.round(momentumScore),
      totalScore: Math.round(totalScore)
    };
  }

  // Generate AI analysis using Gemini
  async generateAIAnalysis(mint: string, dexData: DexPair[], heuristicMetrics: HeuristicMetrics): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(mint, dexData, heuristicMetrics);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const aiResponse = JSON.parse(text);

      return {
        score: aiResponse.score || 0,
        confidence: aiResponse.confidence || 0,
        probEnterable: aiResponse.prob_enterable || 0,
        expectedRoiP50: aiResponse.expected_roi_p50 || 0,
        expectedRoiP90: aiResponse.expected_roi_p90 || 0,
        risk: aiResponse.risk || 'HIGH',
        reasoning: aiResponse.reasoning || 'No reasoning provided',
        metaCategory: aiResponse.meta_category,
        metaScore: aiResponse.meta_score,
        modelResponse: aiResponse
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Fallback to heuristic-based AI analysis
      return {
        score: heuristicMetrics.totalScore,
        confidence: 0.3, // Low confidence due to AI failure
        probEnterable: heuristicMetrics.totalScore > 60 ? 0.7 : 0.3,
        expectedRoiP50: heuristicMetrics.totalScore * 0.01,
        expectedRoiP90: heuristicMetrics.totalScore * 0.02,
        risk: heuristicMetrics.riskScore > 70 ? 'LOW' : heuristicMetrics.riskScore > 40 ? 'MEDIUM' : 'HIGH',
        reasoning: `AI analysis failed. Fallback to heuristic score: ${heuristicMetrics.totalScore}`,
        modelResponse: { error: error.message }
      };
    }
  }

  // Build the analysis prompt for Gemini
  private buildAnalysisPrompt(mint: string, dexData: DexPair[], heuristicMetrics: HeuristicMetrics): string {
    const topPair = dexData.reduce((top, pair) => 
      (pair.volume?.h24 || 0) > (top?.volume?.h24 || 0) ? pair : top, dexData[0]);

    return `You are an expert crypto analyst. Analyze this Solana token and provide a comprehensive assessment.

TOKEN: ${mint}

MARKET DATA:
- Pairs: ${dexData.length}
- Total 24h Volume: $${dexData.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0).toLocaleString()}
- Total Liquidity: $${dexData.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0).toLocaleString()}
- Avg Price Change 24h: ${(dexData.reduce((sum, pair) => sum + (pair.priceChange?.h24 || 0), 0) / dexData.length).toFixed(2)}%
- Total Transactions 24h: ${dexData.reduce((sum, pair) => sum + (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0), 0)}

TOP PAIR DATA:
${topPair ? `
- DEX: ${topPair.dexId}
- Price: $${topPair.priceUsd || 'N/A'}
- Volume 24h: $${topPair.volume?.h24?.toLocaleString() || 'N/A'}
- Liquidity: $${topPair.liquidity?.usd?.toLocaleString() || 'N/A'}
- Buys/Sells 24h: ${topPair.txns?.h24?.buys || 0}/${topPair.txns?.h24?.sells || 0}
- Price Changes: 1h: ${topPair.priceChange?.h1 || 0}%, 6h: ${topPair.priceChange?.h6 || 0}%, 24h: ${topPair.priceChange?.h24 || 0}%
- Token: ${topPair.baseToken?.name || 'Unknown'} (${topPair.baseToken?.symbol || 'N/A'})
` : 'No pair data available'}

HEURISTIC SCORES:
- Volume Score: ${heuristicMetrics.volumeScore}/100
- Liquidity Score: ${heuristicMetrics.liquidityScore}/100
- Price Action Score: ${heuristicMetrics.priceActionScore}/100
- Social Score: ${heuristicMetrics.socialScore}/100
- Risk Score: ${heuristicMetrics.riskScore}/100
- Momentum Score: ${heuristicMetrics.momentumScore}/100
- Total Heuristic Score: ${heuristicMetrics.totalScore}/100

ANALYSIS REQUIREMENTS:
1. Assess the token's investment potential (0-100 score)
2. Determine confidence level (0-1)
3. Calculate probability of being enterable (0-1)
4. Estimate expected ROI at 50th percentile (can be negative)
5. Estimate expected ROI at 90th percentile (can be negative)
6. Assign risk level (LOW/MEDIUM/HIGH)
7. Categorize the token's meta theme if identifiable
8. Provide detailed reasoning

Consider factors like:
- Market cap and liquidity depth
- Trading volume and activity
- Price momentum and volatility
- Token distribution and holder count
- Social signals and community activity
- Technical indicators and market structure
- Risk factors (rug pull potential, low liquidity, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "score": <0-100>,
  "confidence": <0-1>,
  "prob_enterable": <0-1>,
  "expected_roi_p50": <number, can be negative>,
  "expected_roi_p90": <number, can be negative>,
  "risk": "<LOW|MEDIUM|HIGH>",
  "reasoning": "<detailed analysis>",
  "meta_category": "<category or null>",
  "meta_score": <0-100 or null>
}`;
  }

  // Comprehensive token analysis
  async analyzeToken(mint: string): Promise<TokenAnalysis> {
    try {
      // Fetch data from multiple sources
      const dexScreener = getDexScreenerClient();
      const db = getDatabaseClient();

      const [dexData, marketSnapshot] = await Promise.allSettled([
        dexScreener.getTokenPairs(mint),
        db.getMarketSnapshot(mint)
      ]);

      const pairs = dexData.status === 'fulfilled' ? dexData.value : [];
      const snapshot = marketSnapshot.status === 'fulfilled' ? marketSnapshot.value : null;

      // Calculate heuristic metrics
      const heuristicMetrics = this.calculateHeuristicScore(pairs, snapshot);

      // Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(mint, pairs, heuristicMetrics);

      // Combine scores
      const finalScore = Math.round(
        (heuristicMetrics.totalScore * (1 - this.config.aiWeight)) +
        (aiAnalysis.score * this.config.aiWeight)
      );

      // Determine overall confidence
      const confidence = Math.min(1, Math.max(0.1,
        aiAnalysis.confidence * (pairs.length > 0 ? 1 : 0.5)
      ));

      // Determine overall risk
      const risk = this.determineOverallRisk(heuristicMetrics, aiAnalysis, pairs);

      // Generate reasoning
      const reasoning = this.generateReasoning(heuristicMetrics, aiAnalysis, pairs);

      return {
        mint,
        heuristicMetrics,
        dexData: pairs,
        marketSnapshot: snapshot,
        aiAnalysis,
        finalScore,
        confidence,
        risk,
        reasoning
      };
    } catch (error) {
      console.error(`Failed to analyze token ${mint}:`, error);
      
      // Return minimal analysis on error
      return {
        mint,
        heuristicMetrics: {
          volumeScore: 0,
          liquidityScore: 0,
          priceActionScore: 0,
          socialScore: 0,
          riskScore: 0,
          momentumScore: 0,
          totalScore: 0
        },
        dexData: [],
        marketSnapshot: null,
        finalScore: 0,
        confidence: 0.1,
        risk: 'HIGH',
        reasoning: `Analysis failed: ${error.message}`
      };
    }
  }

  // Determine overall risk level
  private determineOverallRisk(heuristics: HeuristicMetrics, ai: AIAnalysis, pairs: DexPair[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const riskFactors = [];

    // Heuristic risk factors
    if (heuristics.liquidityScore < 30) riskFactors.push('low_liquidity');
    if (heuristics.riskScore < 40) riskFactors.push('high_heuristic_risk');
    if (pairs.length < 2) riskFactors.push('limited_pairs');

    // AI risk assessment
    if (ai.risk === 'HIGH') riskFactors.push('ai_high_risk');
    if (ai.confidence < 0.5) riskFactors.push('low_ai_confidence');

    // Market risk factors
    const totalLiquidity = pairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0);
    if (totalLiquidity < this.config.minLiquidity) riskFactors.push('insufficient_liquidity');

    // Determine overall risk
    if (riskFactors.length >= 4) return 'HIGH';
    if (riskFactors.length >= 2) return 'MEDIUM';
    return 'LOW';
  }

  // Generate comprehensive reasoning
  private generateReasoning(heuristics: HeuristicMetrics, ai: AIAnalysis, pairs: DexPair[]): string {
    const reasons = [];

    // Heuristic insights
    if (heuristics.volumeScore > 70) reasons.push('Strong trading volume');
    if (heuristics.liquidityScore > 70) reasons.push('Good liquidity depth');
    if (heuristics.priceActionScore > 70) reasons.push('Positive price momentum');
    if (heuristics.socialScore > 70) reasons.push('High social activity');

    // Risk factors
    if (heuristics.riskScore < 40) reasons.push('High risk indicators detected');
    if (pairs.length < 2) reasons.push('Limited trading pairs available');

    // AI insights
    if (ai.reasoning) reasons.push(`AI Analysis: ${ai.reasoning}`);

    // Market data insights
    const totalVolume = pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0);
    const totalLiquidity = pairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0);

    if (totalVolume > 100000) reasons.push('High 24h trading volume');
    if (totalLiquidity > 50000) reasons.push('Adequate liquidity for trading');

    return reasons.join('. ') + '.';
  }

  // Save analysis to database
  async saveAnalysis(analysis: TokenAnalysis): Promise<void> {
    const db = getDatabaseClient();

    const tokenScore: TokenScore = {
      mint: analysis.mint,
      heuristic_score: analysis.heuristicMetrics.totalScore,
      ai_score: analysis.aiAnalysis?.score,
      final_score: analysis.finalScore,
      confidence: analysis.confidence,
      prob_enterable: analysis.aiAnalysis?.probEnterable,
      expected_roi_p50: analysis.aiAnalysis?.expectedRoiP50,
      expected_roi_p90: analysis.aiAnalysis?.expectedRoiP90,
      risk: analysis.risk,
      reasoning: analysis.reasoning,
      model_response: analysis.aiAnalysis?.modelResponse,
      meta_category: analysis.aiAnalysis?.metaCategory,
      meta_score: analysis.aiAnalysis?.metaScore
    };

    await db.upsertTokenScore(tokenScore);

    // Also update market snapshot if we have DexScreener data
    if (analysis.dexData.length > 0) {
      const topPair = analysis.dexData.reduce((top, pair) => 
        (pair.volume?.h24 || 0) > (top?.volume?.h24 || 0) ? pair : top, analysis.dexData[0]);

      const marketSnapshot: MarketSnapshot = {
        mint: analysis.mint,
        price: parseFloat(topPair.priceUsd || '0'),
        volume_24h: topPair.volume?.h24,
        liquidity: topPair.liquidity?.usd,
        market_cap_sol: topPair.marketCap,
        dex_url: topPair.url,
        snapshot_data: {
          pairs: analysis.dexData.length,
          topPair: topPair,
          totalVolume: analysis.dexData.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0),
          totalLiquidity: analysis.dexData.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0)
        }
      };

      await db.upsertMarketSnapshot(marketSnapshot);
    }
  }

  // Batch analyze multiple tokens
  async analyzeTokens(mints: string[]): Promise<TokenAnalysis[]> {
    const results: TokenAnalysis[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const batchPromises = batch.map(mint => this.analyzeToken(mint));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            await this.saveAnalysis(result.value);
          }
        }
      } catch (error) {
        console.error(`Batch analysis failed for batch starting at ${i}:`, error);
      }

      // Add delay between batches
      if (i + batchSize < mints.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

// Singleton instance
let scoringEngine: ScoringEngine | null = null;

export function createScoringEngine(config: ScoringConfig): ScoringEngine {
  if (!scoringEngine) {
    scoringEngine = new ScoringEngine(config);
  }
  return scoringEngine;
}

export function getScoringEngine(): ScoringEngine {
  if (!scoringEngine) {
    throw new Error('Scoring engine not initialized. Call createScoringEngine first.');
  }
  return scoringEngine;
}
