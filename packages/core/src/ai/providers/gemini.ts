import { AiScore, AiScoreSchema } from '../schema.js';
import { RedisClient } from '../../redis.js';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  redisClient: RedisClient;
  rateLimit: number; // requests per minute
}

export class GeminiProvider {
  private config: GeminiConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  private async checkRateLimit(): Promise<boolean> {
    const key = 'gemini:rate_limit';
    const windowMs = 60 * 1000; // 1 minute
    const now = Date.now();
    
    // Get current count
    const countStr = await this.config.redisClient.get(key);
    const count = countStr ? parseInt(countStr) : 0;
    
    if (count >= this.config.rateLimit) {
      return false;
    }
    
    // Increment count
    await this.config.redisClient.incr(key);
    
    // Set expiry if this is the first request in the window
    if (count === 0) {
      await this.config.redisClient.set(key, '1', Math.ceil(windowMs / 1000));
    }
    
    return true;
  }

  private buildPrompt(tokenData: any): string {
    return `You are an expert crypto analyst. Analyze the provided token data and return ONLY a valid JSON response matching this exact schema:

{
  "prob_enterable": number (0-1),
  "risk": "LOW" | "MEDIUM" | "HIGH", 
  "expected_roi_p50": number (≥0),
  "expected_roi_p90": number (≥0),
  "reasoning": string (6-800 chars)
}

Token Data:
Name: ${tokenData.name || 'Unknown'}
Symbol: ${tokenData.symbol || 'Unknown'}
Market Cap: ${tokenData.marketCap || 0} SOL
Liquidity: ${tokenData.liquidity || 0} SOL
Volume 24h: ${tokenData.volume24h || 0} SOL
Age: ${tokenData.ageHours || 0} hours
Unique Buyers: ${tokenData.uniqueBuyers || 0}
Buyer/Seller Ratio: ${tokenData.buyerSellerRatio || 0}
Whale Share: ${tokenData.whaleShare || 0}%
TX Count 1h: ${tokenData.txCount1h || 0}

Return ONLY the JSON object, no other text.`;
  }

  async getScore(tokenData: any): Promise<{ response: AiScore; tokensUsed?: number; latencyMs: number }> {
    const startTime = Date.now();
    
    // Check rate limit
    if (!(await this.checkRateLimit())) {
      throw new Error('Gemini rate limit exceeded');
    }

    const prompt = this.buildPrompt(tokenData);
    const url = `${this.baseUrl}/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content in Gemini response');
      }

      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        // Retry once with clarification
        const retryPayload = {
          contents: [{
            parts: [{
              text: `${prompt}\n\nPrevious response was invalid JSON: ${content}\n\nReturn valid JSON only matching the schema. No additional text.`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            responseMimeType: "application/json"
          }
        };

        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(retryPayload)
        });

        if (!retryResponse.ok) {
          throw new Error(`Gemini retry failed: ${retryResponse.status}`);
        }

        const retryData = await retryResponse.json();
        const retryContent = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
        parsedContent = JSON.parse(retryContent);
      }

      // Validate against schema
      const validatedResponse = AiScoreSchema.parse(parsedContent);
      
      const latencyMs = Date.now() - startTime;
      const tokensUsed = data.usageMetadata?.totalTokenCount;

      return {
        response: validatedResponse,
        tokensUsed,
        latencyMs
      };

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      throw new Error(`Gemini provider error: ${error instanceof Error ? error.message : String(error)} (${latencyMs}ms)`);
    }
  }
}