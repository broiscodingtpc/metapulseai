// Groq AI API wrapper
export interface TokenAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  metaCategory: string;
  riskLevel: 'low' | 'medium' | 'high';
  keyPoints: string[];
  score: number; // 0-100
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class GroqAPI {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Groq] API key not found');
    }
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      console.log('[Groq] Making AI analysis request');
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // Fast and free model
          messages,
          temperature: 0.3,
          max_tokens: 500, // Reduced from 1000
          stream: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Groq] API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices received from Groq API');
      }
      
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[Groq] Error making request:', error);
      throw error;
    }
  }

  async analyzeToken(tokenData: {
    name: string;
    symbol: string;
    description?: string;
    marketCap?: number;
    volume24h?: number;
    priceChange24h?: number;
    age?: number; // hours since creation
    website?: string;
    twitter?: string;
    telegram?: string;
  }): Promise<TokenAnalysis> {
    const prompt = `Analyze this cryptocurrency token and provide a JSON response with the following structure:

{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.85,
  "metaCategory": "AI|Gaming|Meme|DeFi|NFT|Celebrity|Seasonal|Other",
  "riskLevel": "low|medium|high",
  "keyPoints": ["point1", "point2", "point3"],
  "score": 75
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

Consider:
1. Token name and symbol for meta classification
2. Description content for sentiment and category
3. Market metrics for risk assessment
4. Social presence for legitimacy
5. Age for early-stage evaluation

Provide a score from 0-100 where:
- 90-100: Exceptional potential, strong fundamentals
- 70-89: Good potential, solid metrics
- 50-69: Average, mixed signals
- 30-49: Below average, concerning factors
- 0-29: High risk, poor fundamentals

Return only valid JSON, no additional text.`;

    try {
      const response = await this.makeRequest([
        { role: 'user', content: prompt }
      ]);

      // Try to parse JSON response
      const cleanResponse = response.trim();
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis: TokenAnalysis = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!analysis.sentiment || !analysis.metaCategory || !analysis.riskLevel) {
        throw new Error('Invalid analysis structure');
      }

      console.log(`[Groq] Analysis complete for ${tokenData.symbol}: ${analysis.sentiment} (${analysis.score}/100)`);
      return analysis;

    } catch (error) {
      console.error(`[Groq] Error analyzing token ${tokenData.symbol}:`, error);
      
      // Return fallback analysis
      return {
        sentiment: 'neutral',
        confidence: 0.1,
        metaCategory: 'Other',
        riskLevel: 'high',
        keyPoints: ['Analysis failed', 'Manual review needed'],
        score: 25
      };
    }
  }

  async classifyMeta(description: string): Promise<string> {
    const prompt = `Classify this token description into one of these categories: AI, Gaming, Meme, DeFi, NFT, Celebrity, Seasonal, Other.

Description: "${description}"

Return only the category name, nothing else.`;

    try {
      const response = await this.makeRequest([
        { role: 'user', content: prompt }
      ]);

      const category = response.trim();
      const validCategories = ['AI', 'Gaming', 'Meme', 'DeFi', 'NFT', 'Celebrity', 'Seasonal', 'Other'];
      
      return validCategories.includes(category) ? category : 'Other';
    } catch (error) {
      console.error('[Groq] Error classifying meta:', error);
      return 'Other';
    }
  }

  async generateAlert(tokenData: any, analysis: TokenAnalysis): Promise<string> {
    const prompt = `Generate a concise Telegram alert message for this token discovery:

Token: ${tokenData.name} (${tokenData.symbol})
Score: ${analysis.score}/100
Sentiment: ${analysis.sentiment}
Category: ${analysis.metaCategory}
Risk: ${analysis.riskLevel}
Market Cap: $${tokenData.marketCap?.toLocaleString() || 'N/A'}

Create a message that:
1. Uses ASCII/console style formatting
2. Highlights key metrics
3. Is under 200 characters
4. Includes relevant emojis sparingly
5. Has a clear call-to-action

Return only the message text.`;

    try {
      const response = await this.makeRequest([
        { role: 'user', content: prompt }
      ]);

      return response.trim();
    } catch (error) {
      console.error('[Groq] Error generating alert:', error);
      return `🔍 NEW TOKEN DETECTED\n${tokenData.symbol} | Score: ${analysis.score}/100\nCategory: ${analysis.metaCategory} | Risk: ${analysis.riskLevel}\nMarket Cap: $${tokenData.marketCap?.toLocaleString() || 'N/A'}`;
    }
  }
}

export const groqAPI = new GroqAPI();