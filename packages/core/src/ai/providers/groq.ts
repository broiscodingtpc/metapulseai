import { AiScore, AiScoreSchema } from '../schema.js';
import { RedisClient } from '../../redis.js';

export interface GroqConfig {
  apiKey: string;
  model: string;
  redisClient: RedisClient;
  rateLimit: number; // requests per minute
}

export class GroqProvider {
  private config: GroqConfig;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(config: GroqConfig) {
    this.config = config;
  }

  private async checkRateLimit(): Promise<boolean> {
    const key = 'groq:rate_limit';
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

  private buildPrompt(tokenData: any): { system: string; user: string } {
    const system = `You are an expert crypto analyst. Analyze the provided token data and return ONLY a valid JSON response matching this exact schema:

{
  "prob_enterable": number (0-1),
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "expected_roi_p50": number (≥0),
  "expected_roi_p90": number (≥0),
  "reasoning": string (6-800 chars)
}

Return ONLY the JSON object, no other text.`;

    const user = `Analyze this token data:
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

Provide investment analysis as JSON only.`;

    return { system, user };
  }

  async getScore(tokenData: any): Promise<{ response: AiScore; tokensUsed?: number; latencyMs: number }> {
    const startTime = Date.now();
    
    // Check rate limit
    if (!(await this.checkRateLimit())) {
      throw new Error('Groq rate limit exceeded');
    }

    const { system, user } = this.buildPrompt(tokenData);

    const payload = {
      model: this.config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in Groq response');
      }

      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        // Retry once with clarification
        const retryPayload = {
          ...payload,
          messages: [
            ...payload.messages,
            { role: 'assistant', content },
            { role: 'user', content: 'Return valid JSON only matching the schema. No additional text.' }
          ]
        };

        const retryResponse = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(retryPayload)
        });

        if (!retryResponse.ok) {
          throw new Error(`Groq retry failed: ${retryResponse.status}`);
        }

        const retryData = await retryResponse.json();
        const retryContent = retryData.choices?.[0]?.message?.content;
        parsedContent = JSON.parse(retryContent);
      }

      // Validate against schema
      const validatedResponse = AiScoreSchema.parse(parsedContent);
      
      const latencyMs = Date.now() - startTime;
      const tokensUsed = data.usage?.total_tokens;

      return {
        response: validatedResponse,
        tokensUsed,
        latencyMs
      };

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      throw new Error(`Groq provider error: ${error.message} (${latencyMs}ms)`);
    }
  }
}