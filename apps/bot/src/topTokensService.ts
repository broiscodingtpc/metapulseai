import { twitterService, TokenCall } from './twitterService.js';
import { AdaptiveAnalyzer } from './adaptiveAnalyzer.js';

export interface TopToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
  socialScore: number;
  twitterMentions: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  influencerCalls: number;
  overallScore: number;
}

class TopTokensService {
  private adaptiveAnalyzer: AdaptiveAnalyzer;

  constructor() {
    this.adaptiveAnalyzer = new AdaptiveAnalyzer();
  }

  async getTopTokens(limit: number = 10): Promise<TopToken[]> {
    try {
      // Get tokens from multiple sources
      const [marketTokens, socialTokens, influencerCalls] = await Promise.all([
        this.getMarketTopTokens(),
        this.getSociallyTrendingTokens(),
        this.getInfluencerCalls()
      ]);

      // Combine and score all tokens
      const allTokens = new Map<string, TopToken>();

      // Add market-based tokens
      marketTokens.forEach(token => {
        allTokens.set(token.symbol!, {
          ...token as TopToken,
          socialScore: 0,
          twitterMentions: 0,
          sentiment: 'neutral' as const,
          influencerCalls: 0,
          overallScore: this.calculateMarketScore(token)
        });
      });

      // Enhance with social data
      for (const token of socialTokens) {
        const existing = allTokens.get(token.symbol);
        if (existing) {
          existing.socialScore = token.socialScore;
          existing.twitterMentions = token.twitterMentions;
          existing.sentiment = token.sentiment;
          existing.overallScore += token.socialScore * 0.3; // 30% weight for social
        } else {
          // Add new token discovered through social media
          allTokens.set(token.symbol, {
            address: token.address || 'unknown',
            name: token.name || 'Unknown',
            symbol: token.symbol,
            price: token.price || 0,
            marketCap: token.marketCap || 0,
            volume24h: token.volume24h || 0,
            priceChange24h: token.priceChange24h || 0,
            liquidity: token.liquidity || 0,
            socialScore: token.socialScore,
            twitterMentions: token.twitterMentions,
            sentiment: token.sentiment,
            influencerCalls: 0,
            overallScore: token.socialScore * 0.5 // Lower weight for social-only tokens
          });
        }
      }

      // Add influencer call bonuses
      influencerCalls.forEach(call => {
        const existing = allTokens.get(call.symbol);
        if (existing) {
          existing.influencerCalls++;
          existing.overallScore += call.confidence * 0.2; // 20% weight for influencer calls
        }
      });

      // Sort by overall score and return top tokens
      return Array.from(allTokens.values())
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top tokens:', error);
      return [];
    }
  }

  private async getMarketTopTokens(): Promise<Partial<TopToken>[]> {
    try {
      // This would typically fetch from DexScreener or similar API
      // For now, we'll return mock data that represents real market leaders
      const mockTokens: Partial<TopToken>[] = [
        {
          address: '11111111111111111111111111111112',
          name: 'Solana',
          symbol: 'SOL',
          price: 180.50,
          marketCap: 85000000000,
          volume24h: 2500000000,
          priceChange24h: 5.2,
          liquidity: 500000000
        },
        {
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          name: 'USD Coin',
          symbol: 'USDC',
          price: 1.00,
          marketCap: 32000000000,
          volume24h: 8500000000,
          priceChange24h: 0.1,
          liquidity: 1000000000
        }
      ];

      return mockTokens;
    } catch (error) {
      console.error('Error fetching market tokens:', error);
      return [];
    }
  }

  private async getSociallyTrendingTokens(): Promise<Partial<TopToken>[]> {
    if (!twitterService.isReady()) {
      return [];
    }

    try {
      // Get trending tokens from Twitter
      const trendingSymbols = ['SOL', 'BONK', 'WIF', 'POPCAT', 'GOAT'];
      const socialTokens: Partial<TopToken>[] = [];

      for (const symbol of trendingSymbols) {
        try {
          const sentiment = await twitterService.getTokenSentiment(symbol);
          
          if (sentiment.mentions > 5) { // Only include tokens with decent mention count
            socialTokens.push({
              symbol,
              name: symbol, // Would be fetched from token metadata in real implementation
              socialScore: this.calculateSocialScore(sentiment),
              twitterMentions: sentiment.mentions,
              sentiment: sentiment.sentiment,
              address: `mock_${symbol}_address`, // Would be real address
              price: 0, // Would be fetched from price API
              marketCap: 0,
              volume24h: 0,
              priceChange24h: 0,
              liquidity: 0,
              influencerCalls: 0,
              overallScore: 0
            });
          }
        } catch (error) {
          console.error(`Error getting sentiment for ${symbol}:`, error);
        }
      }

      return socialTokens;
    } catch (error) {
      console.error('Error getting socially trending tokens:', error);
      return [];
    }
  }

  private async getInfluencerCalls(): Promise<TokenCall[]> {
    if (!twitterService.isReady()) {
      return [];
    }

    try {
      return await twitterService.getInfluencerCalls(50000); // Min 50k followers
    } catch (error) {
      console.error('Error getting influencer calls:', error);
      return [];
    }
  }

  private calculateMarketScore(token: Partial<TopToken>): number {
    let score = 0;

    // Volume score (0-30 points)
    if (token.volume24h) {
      score += Math.min(token.volume24h / 100000000, 30); // Normalize by 100M
    }

    // Market cap score (0-25 points)
    if (token.marketCap) {
      score += Math.min(token.marketCap / 1000000000, 25); // Normalize by 1B
    }

    // Price change score (0-25 points)
    if (token.priceChange24h !== undefined) {
      if (token.priceChange24h > 0) {
        score += Math.min(token.priceChange24h, 25);
      } else {
        score += Math.max(token.priceChange24h / 2, -10); // Penalty for negative, but not too harsh
      }
    }

    // Liquidity score (0-20 points)
    if (token.liquidity) {
      score += Math.min(token.liquidity / 50000000, 20); // Normalize by 50M
    }

    return Math.max(score, 0);
  }

  private calculateSocialScore(sentiment: any): number {
    let score = 0;

    // Base sentiment score
    switch (sentiment.sentiment) {
      case 'bullish':
        score += 40;
        break;
      case 'bearish':
        score += 15;
        break;
      case 'neutral':
        score += 25;
        break;
    }

    // Mentions bonus
    score += Math.min(sentiment.mentions / 2, 30);

    // Influencer mentions bonus
    score += Math.min(sentiment.influencerMentions * 10, 30);

    return Math.min(score, 100);
  }

  async getTokenAnalysis(symbol: string): Promise<string> {
    try {
      const [sentiment, calls] = await Promise.all([
        twitterService.isReady() ? twitterService.getTokenSentiment(symbol) : null,
        twitterService.isReady() ? twitterService.findTokenCalls(10) : []
      ]);

      let analysis = `📊 **${symbol} Analysis**\n\n`;

      if (sentiment) {
        analysis += `🐦 **Twitter Sentiment**: ${sentiment.sentiment.toUpperCase()}\n`;
        analysis += `📈 **Mentions**: ${sentiment.mentions}\n`;
        analysis += `👑 **Influencer Mentions**: ${sentiment.influencerMentions}\n`;
        analysis += `🎯 **Confidence**: ${(sentiment.confidence * 100).toFixed(1)}%\n\n`;
      }

      const tokenCalls = calls.filter(call => call.symbol === symbol);
      if (tokenCalls.length > 0) {
        analysis += `📢 **Recent Calls**: ${tokenCalls.length}\n`;
        analysis += `🔥 **Top Call**: @${tokenCalls[0].caller} (${tokenCalls[0].followers.toLocaleString()} followers)\n\n`;
      }

      return analysis;
    } catch (error) {
      return `❌ Unable to analyze ${symbol} at this time.`;
    }
  }
}

export const topTokensService = new TopTokensService();
export default TopTokensService;