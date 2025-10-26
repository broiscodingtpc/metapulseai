import { AiScore, ConsensusResult, ModelResponse } from './schema.js';
import { GroqProvider, GroqConfig } from './providers/groq.js';
import { GeminiProvider, GeminiConfig } from './providers/gemini.js';
import { RedisClient } from '../redis.js';

export interface ModelRouterConfig {
  groq: GroqConfig;
  gemini: GeminiConfig;
  consensusMaxDelta: number;
}

export class ModelRouter {
  private groqProvider: GroqProvider;
  private geminiProvider: GeminiProvider;
  private config: ModelRouterConfig;

  constructor(config: ModelRouterConfig) {
    this.config = config;
    this.groqProvider = new GroqProvider(config.groq);
    this.geminiProvider = new GeminiProvider(config.gemini);
  }

  private calculateConsensus(groqScore: AiScore, geminiScore: AiScore): { consensus: AiScore; delta: number } {
    // Calculate delta between probability estimates
    const probDelta = Math.abs(groqScore.prob_enterable - geminiScore.prob_enterable);
    
    // Consensus probability with bias toward lower value if delta exceeds threshold
    let consensusProb: number;
    if (probDelta > this.config.consensusMaxDelta) {
      const lowerProb = Math.min(groqScore.prob_enterable, geminiScore.prob_enterable);
      const higherProb = Math.max(groqScore.prob_enterable, geminiScore.prob_enterable);
      // Bias toward lower value by the delta fraction
      consensusProb = lowerProb + (higherProb - lowerProb) * (1 - probDelta);
    } else {
      // Simple average if within threshold
      consensusProb = (groqScore.prob_enterable + geminiScore.prob_enterable) / 2;
    }

    // Risk: take the maximum (more conservative)
    const riskLevels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    const groqRiskLevel = riskLevels[groqScore.risk];
    const geminiRiskLevel = riskLevels[geminiScore.risk];
    const maxRiskLevel = Math.max(groqRiskLevel, geminiRiskLevel);
    const consensusRisk = Object.keys(riskLevels)[maxRiskLevel - 1] as 'LOW' | 'MEDIUM' | 'HIGH';

    // ROI: geometric mean (more conservative than arithmetic mean)
    const consensusRoiP50 = Math.sqrt(groqScore.expected_roi_p50 * geminiScore.expected_roi_p50);
    const consensusRoiP90 = Math.sqrt(groqScore.expected_roi_p90 * geminiScore.expected_roi_p90);

    // Reasoning: compressed bullet summary
    const reasoning = this.compressReasoning(groqScore.reasoning, geminiScore.reasoning);

    const consensus: AiScore = {
      prob_enterable: Math.max(0, Math.min(1, consensusProb)),
      risk: consensusRisk,
      expected_roi_p50: consensusRoiP50,
      expected_roi_p90: consensusRoiP90,
      reasoning
    };

    return { consensus, delta: probDelta };
  }

  private compressReasoning(groqReasoning: string, geminiReasoning: string): string {
    // Extract key points and create compressed summary
    const groqPoints = this.extractKeyPoints(groqReasoning);
    const geminiPoints = this.extractKeyPoints(geminiReasoning);
    
    // Combine and deduplicate key themes
    const allPoints = [...groqPoints, ...geminiPoints];
    const uniqueThemes = [...new Set(allPoints.map(p => p.toLowerCase()))];
    
    // Create bullet summary (max 800 chars)
    let summary = '• ' + uniqueThemes.slice(0, 5).join(' • ');
    
    if (summary.length > 800) {
      summary = summary.substring(0, 797) + '...';
    }
    
    return summary;
  }

  private extractKeyPoints(reasoning: string): string[] {
    // Simple extraction of key phrases
    const sentences = reasoning.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  async getDualScores(tokenData: any): Promise<ConsensusResult> {
    const timestamp = Date.now();

    try {
      // Call both providers in parallel
      const [groqResult, geminiResult] = await Promise.allSettled([
        this.groqProvider.getScore(tokenData),
        this.geminiProvider.getScore(tokenData)
      ]);

      // Handle results
      if (groqResult.status === 'rejected' && geminiResult.status === 'rejected') {
        throw new Error(`Both AI providers failed: Groq: ${groqResult.reason}, Gemini: ${geminiResult.reason}`);
      }

      let groqResponse: ModelResponse;
      let geminiResponse: ModelResponse;

      // Handle Groq result
      if (groqResult.status === 'fulfilled') {
        groqResponse = {
          model: 'groq',
          response: groqResult.value.response,
          timestamp,
          tokens_used: groqResult.value.tokensUsed,
          latency_ms: groqResult.value.latencyMs
        };
      } else {
        // Fallback if Groq failed
        groqResponse = {
          model: 'groq',
          response: {
            prob_enterable: 0.1,
            risk: 'HIGH',
            expected_roi_p50: 0,
            expected_roi_p90: 0,
            reasoning: `Groq provider failed: ${groqResult.reason}`
          },
          timestamp,
          latency_ms: 0
        };
      }

      // Handle Gemini result
      if (geminiResult.status === 'fulfilled') {
        geminiResponse = {
          model: 'gemini',
          response: geminiResult.value.response,
          timestamp,
          tokens_used: geminiResult.value.tokensUsed,
          latency_ms: geminiResult.value.latencyMs
        };
      } else {
        // Fallback if Gemini failed
        geminiResponse = {
          model: 'gemini',
          response: {
            prob_enterable: 0.1,
            risk: 'HIGH',
            expected_roi_p50: 0,
            expected_roi_p90: 0,
            reasoning: `Gemini provider failed: ${geminiResult.reason}`
          },
          timestamp,
          latency_ms: 0
        };
      }

      // Calculate consensus
      const { consensus, delta } = this.calculateConsensus(
        groqResponse.response,
        geminiResponse.response
      );

      // Calculate confidence based on agreement and data quality
      const baseConfidence = 0.6; // Base confidence
      const agreementBonus = (1 - delta) * 0.3; // Up to 30% bonus for agreement
      const dataQualityBonus = this.assessDataQuality(tokenData) * 0.1; // Up to 10% for data quality
      
      const confidence = Math.max(0, Math.min(1, baseConfidence + agreementBonus + dataQualityBonus));

      return {
        groq: groqResponse,
        gemini: geminiResponse,
        consensus,
        delta,
        confidence
      };

    } catch (error) {
      throw new Error(`Model router error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private assessDataQuality(tokenData: any): number {
    let quality = 0;
    
    // Check for presence of key metrics
    if (tokenData.marketCap > 0) quality += 0.2;
    if (tokenData.liquidity > 0) quality += 0.2;
    if (tokenData.volume24h > 0) quality += 0.2;
    if (tokenData.uniqueBuyers > 0) quality += 0.2;
    if (tokenData.ageHours > 0) quality += 0.2;
    
    return quality;
  }
}