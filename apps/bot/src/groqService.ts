import Groq from 'groq-sdk';
import { rateLimiter } from '@metapulse/core';

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
  modelResponse?: any;
}

export interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  age?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  metaScore?: number;
  price?: number;
  liquidity?: number;
  pairAge?: number;
}

class GroqService {
  private groq: Groq;

  constructor() {
    // Initialize Groq
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    if (!process.env.GROQ_API_KEY) {
      console.warn('[Groq] API key not found. Set GROQ_API_KEY environment variable');
    }
  }

  async analyzeToken(tokenData: TokenData): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(tokenData);

    // Try Groq first with rate limiting
    try {
      console.log(`[Groq] Analyzing token ${tokenData.symbol}...`);
      const response = await rateLimiter.execute('groq:chat', async () => {
        return await this.groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are MetaPulse AI, an elite crypto market intelligence system. Analyze tokens and provide JSON responses only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.3,
          max_tokens: 1000,
        });
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Groq response');
      }

      const analysis = this.parseAnalysisResponse(content);
      console.log(`[Groq] ✅ Analysis complete for ${tokenData.symbol}: Score ${analysis.score}/100`);
      return analysis;

    } catch (groqError) {
      console.warn(`[Groq] Failed for ${tokenData.symbol}:`, groqError.message);
      
      // Return heuristic fallback when Groq fails
      console.log(`[Fallback] Using heuristic analysis for ${tokenData.symbol}...`);
      return this.getHeuristicAnalysis(tokenData);
    }
  }

  private buildAnalysisPrompt(tokenData: TokenData): string {
    return `Analyze this cryptocurrency token and provide a JSON response with the following structure:

{
  "score": 75,
  "confidence": 0.85,
  "probEnterable": 0.7,
  "expectedRoiP50": 0.15,
  "expectedRoiP90": 0.45,
  "risk": "MEDIUM",
  "reasoning": "Detailed analysis explanation",
  "metaCategory": "AI|Gaming|Meme|DeFi|NFT|Celebrity|Seasonal|Other",
  "metaScore": 80
}

Token Data:
- Name: ${tokenData.name}
- Symbol: ${tokenData.symbol}
- Description: ${tokenData.description || 'N/A'}
- Market Cap: $${tokenData.marketCap?.toLocaleString() || 'N/A'}
- 24h Volume: $${tokenData.volume24h?.toLocaleString() || 'N/A'}
- 24h Price Change: ${tokenData.priceChange24h || 'N/A'}%
- Age: ${tokenData.age || 'N/A'} hours
- Website: ${tokenData.website || 'N/A'}
- Twitter: ${tokenData.twitter || 'N/A'}
- Telegram: ${tokenData.telegram || 'N/A'}

Scoring Criteria:
- 90-100: Exceptional potential, viral trends, strong fundamentals
- 70-89: Good potential, solid metrics, growing momentum
- 50-69: Average potential, mixed signals
- 30-49: Below average, concerning factors
- 0-29: High risk, poor fundamentals

Risk Assessment:
- LOW: Established project, good liquidity, strong community
- MEDIUM: Moderate risk, some red flags, average metrics
- HIGH: New/unproven, low liquidity, potential rug pull

Meta Categories (prioritize trending):
- AI: AI agents, GPT, neural networks, chatbots
- Gaming: Games, esports, gaming platforms
- Meme: Viral memes, internet culture, dog coins
- DeFi: Decentralized finance, yield farming, swaps
- NFT: Digital art, collectibles, creators
- Celebrity: Famous people, influencers
- Seasonal: Holiday themes, events
- Other: Everything else

Return only valid JSON, no additional text.`;
  }

  private parseAnalysisResponse(content: string): AIAnalysis {
    try {
      // Clean the response and extract JSON
      const cleanContent = content.trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        score: Math.max(0, Math.min(100, parsed.score || 0)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        probEnterable: Math.max(0, Math.min(1, parsed.probEnterable || 0)),
        expectedRoiP50: parsed.expectedRoiP50 || 0,
        expectedRoiP90: parsed.expectedRoiP90 || 0,
        risk: ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.risk) ? parsed.risk : 'HIGH',
        reasoning: parsed.reasoning || 'No reasoning provided',
        metaCategory: parsed.metaCategory,
        metaScore: parsed.metaScore || parsed.score || 0,
        modelResponse: parsed
      };

    } catch (error) {
      console.error('[AI] Failed to parse analysis response:', error);
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  }

  private getHeuristicAnalysis(tokenData: TokenData): AIAnalysis {
    // Simple heuristic scoring based on available data
    let score = 30; // Base score
    
    // Market cap scoring
    if (tokenData.marketCap) {
      if (tokenData.marketCap > 10000000) score += 20; // > 10M
      else if (tokenData.marketCap > 1000000) score += 15; // > 1M
      else if (tokenData.marketCap > 100000) score += 10; // > 100K
    }

    // Volume scoring
    if (tokenData.volume24h) {
      if (tokenData.volume24h > 1000000) score += 15; // > 1M volume
      else if (tokenData.volume24h > 100000) score += 10; // > 100K volume
      else if (tokenData.volume24h > 10000) score += 5; // > 10K volume
    }

    // Age scoring (newer tokens get higher scores for potential)
    if (tokenData.age !== undefined) {
      if (tokenData.age < 24) score += 10; // Less than 1 day
      else if (tokenData.age < 168) score += 5; // Less than 1 week
    }

    // Social presence
    if (tokenData.website) score += 5;
    if (tokenData.twitter) score += 5;
    if (tokenData.telegram) score += 5;

    // Price change scoring
    if (tokenData.priceChange24h) {
      if (tokenData.priceChange24h > 50) score += 15;
      else if (tokenData.priceChange24h > 20) score += 10;
      else if (tokenData.priceChange24h > 0) score += 5;
      else if (tokenData.priceChange24h < -50) score -= 20;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      confidence: 0.3, // Low confidence for heuristic
      probEnterable: score > 60 ? 0.6 : 0.3,
      expectedRoiP50: score * 0.01,
      expectedRoiP90: score * 0.02,
      risk: score > 70 ? 'LOW' : score > 40 ? 'MEDIUM' : 'HIGH',
      reasoning: `Heuristic analysis based on market metrics. Score: ${score}/100`,
      metaCategory: 'Other',
      metaScore: score,
      modelResponse: { source: 'heuristic', score }
    };
  }

  async generateMarketInsight(marketData: any): Promise<string> {
    const prompt = `Generate a concise market insight based on this data:

Market Overview:
- Active tokens: ${marketData.activeTokens || 'N/A'}
- Top performers: ${marketData.topPerformers || 'N/A'}
- Market sentiment: ${marketData.sentiment || 'N/A'}
- Volume trends: ${marketData.volumeTrends || 'N/A'}

Provide a 2-3 sentence market insight focusing on:
1. Current market conditions
2. Key opportunities or risks
3. Actionable advice for traders

Keep it concise and professional.`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional crypto market analyst. Provide concise, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || 'Market analysis unavailable';

    } catch (error) {
      console.warn('[Groq] Market insight failed, using fallback');
      return 'Market conditions are dynamic. Focus on tokens with strong fundamentals and growing volume. Always manage risk appropriately.';
    }
  }
}

export const groqService = new GroqService();