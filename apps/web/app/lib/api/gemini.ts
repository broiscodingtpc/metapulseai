// Google AI Studio (Gemini) API wrapper
export interface TokenAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  metaCategory: string;
  riskLevel: 'low' | 'medium' | 'high';
  keyPoints: string[];
  score: number; // 0-100
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

class GeminiAPI {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-2.5-flash'; // Free tier model with high limits

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Gemini] API key not found. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable');
    }
  }

  private async makeRequest(prompt: string): Promise<string> {
    try {
      console.log('[Gemini] Making AI analysis request');
      
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            topP: 0.8,
            topK: 40
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini] API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response candidates received from Gemini API');
      }
      
      const content = data.candidates[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('No text content in Gemini response');
      }
      
      return content;
    } catch (error) {
      console.error('[Gemini] Error making request:', error);
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
      const response = await this.makeRequest(prompt);

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

      console.log(`[Gemini] Analysis complete for ${tokenData.symbol}: ${analysis.sentiment} (${analysis.score}/100)`);
      return analysis;

    } catch (error) {
      console.error(`[Gemini] Error analyzing token ${tokenData.symbol}:`, error);
      
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
      const response = await this.makeRequest(prompt);

      const category = response.trim();
      const validCategories = ['AI', 'Gaming', 'Meme', 'DeFi', 'NFT', 'Celebrity', 'Seasonal', 'Other'];
      
      return validCategories.includes(category) ? category : 'Other';
    } catch (error) {
      console.error('[Gemini] Error classifying meta:', error);
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
      const response = await this.makeRequest(prompt);

      return response.trim();
    } catch (error) {
      console.error('[Gemini] Error generating alert:', error);
      return `🔍 NEW TOKEN DETECTED\n${tokenData.symbol} | Score: ${analysis.score}/100\nCategory: ${analysis.metaCategory} | Risk: ${analysis.riskLevel}\nMarket Cap: $${tokenData.marketCap?.toLocaleString() || 'N/A'}`;
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('Hello, respond with "OK" if you can hear me.');
      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('[Gemini] Health check failed:', error);
      return false;
    }
  }
}

export const geminiAPI = new GeminiAPI();