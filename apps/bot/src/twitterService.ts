import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { rateLimiter } from '@metapulse/core';

// Load environment variables
dotenv.config({ path: '.env.local' });

export interface TwitterSentiment {
  token: string;
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  mentions: number;
  influencerMentions: number;
  recentTweets: TwitterTweet[];
}

export interface TwitterTweet {
  id: string;
  text: string;
  author: string;
  followers: number;
  likes: number;
  retweets: number;
  timestamp: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface TokenCall {
  token: string;
  symbol: string;
  caller: string;
  followers: number;
  confidence: number;
  timestamp: Date;
  tweet: string;
  engagement: number;
}

class TwitterService {
  private client: TwitterApi;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN;
      
      if (!bearerToken) {
        console.error('Twitter Bearer Token not found in environment variables');
        return;
      }

      this.client = new TwitterApi(bearerToken);
      this.isInitialized = true;
      console.log('✅ Twitter API client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Twitter API client:', error);
    }
  }

  async searchTokenMentions(tokenSymbol: string, limit: number = 50): Promise<TwitterTweet[]> {
    if (!this.isInitialized) {
      console.warn('Twitter client not initialized');
      return [];
    }

    try {
      const query = `$${tokenSymbol} OR ${tokenSymbol} -is:retweet lang:en`;
      
      // Use rate limiter for Twitter search
      const tweets = await rateLimiter.execute('twitter:search', async () => {
        return await this.client.v2.search(query, {
          max_results: limit,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
          'user.fields': ['public_metrics', 'username'],
          expansions: ['author_id']
        });
      });

      const twitterTweets: TwitterTweet[] = [];

      for (const tweet of (tweets.data as unknown as any[]) || []) {
        const author = tweets.includes?.users?.find(user => user.id === tweet.author_id);
        
        twitterTweets.push({
          id: tweet.id,
          text: tweet.text,
          author: author?.username || 'unknown',
          followers: author?.public_metrics?.followers_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          timestamp: new Date(tweet.created_at || Date.now()),
          sentiment: this.analyzeSentiment(tweet.text)
        });
      }

      return twitterTweets.sort((a, b) => b.followers - a.followers);
    } catch (error) {
      console.error(`Error searching Twitter for ${tokenSymbol}:`, error);
      return [];
    }
  }

  async getTokenSentiment(tokenSymbol: string): Promise<TwitterSentiment> {
    const tweets = await this.searchTokenMentions(tokenSymbol, 100);
    
    if (tweets.length === 0) {
      return {
        token: tokenSymbol,
        symbol: tokenSymbol,
        sentiment: 'neutral',
        confidence: 0,
        mentions: 0,
        influencerMentions: 0,
        recentTweets: []
      };
    }

    // Calculate sentiment scores
    let bullishScore = 0;
    let bearishScore = 0;
    let influencerMentions = 0;

    tweets.forEach(tweet => {
      const weight = Math.min(tweet.followers / 1000, 10); // Cap influence at 10x
      
      if (tweet.followers > 10000) {
        influencerMentions++;
      }

      switch (tweet.sentiment) {
        case 'bullish':
          bullishScore += 1 + weight;
          break;
        case 'bearish':
          bearishScore += 1 + weight;
          break;
      }
    });

    const totalScore = bullishScore + bearishScore;
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0;

    if (totalScore > 0) {
      const bullishRatio = bullishScore / totalScore;
      confidence = Math.min(totalScore / 50, 1); // Normalize confidence

      if (bullishRatio > 0.6) {
        overallSentiment = 'bullish';
      } else if (bullishRatio < 0.4) {
        overallSentiment = 'bearish';
      }
    }

    return {
      token: tokenSymbol,
      symbol: tokenSymbol,
      sentiment: overallSentiment,
      confidence,
      mentions: tweets.length,
      influencerMentions,
      recentTweets: tweets.slice(0, 10) // Top 10 most influential tweets
    };
  }

  async findTokenCalls(limit: number = 20): Promise<TokenCall[]> {
    if (!this.isInitialized) {
      console.warn('Twitter client not initialized');
      return [];
    }

    try {
      // Search for common crypto call patterns
      const queries = [
        'gem OR moonshot OR "100x" OR "next pump" crypto -is:retweet lang:en',
        '"buy now" OR "entry point" OR "accumulate" token -is:retweet lang:en',
        '"bullish on" OR "loading up" OR "aping into" -is:retweet lang:en'
      ];

      const allCalls: TokenCall[] = [];

      for (const query of queries) {
        try {
          const tweets = await this.client.v2.search(query, {
            max_results: Math.ceil(limit / queries.length),
            'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
            'user.fields': ['public_metrics', 'username'],
            expansions: ['author_id']
          });

          for (const tweet of (tweets.data as unknown as any[]) || []) {
            const author = tweets.includes?.users?.find(user => user.id === tweet.author_id);
            const followers = author?.public_metrics?.followers_count || 0;
            
            // Only consider calls from accounts with decent following
            if (followers < 1000) continue;

            const tokenSymbols = this.extractTokenSymbols(tweet.text);
            
            for (const symbol of tokenSymbols) {
              const engagement = (tweet.public_metrics?.like_count || 0) + 
                               (tweet.public_metrics?.retweet_count || 0) * 2;

              allCalls.push({
                token: symbol,
                symbol: symbol,
                caller: author?.username || 'unknown',
                followers,
                confidence: this.calculateCallConfidence(tweet.text, followers, engagement),
                timestamp: new Date(tweet.created_at || Date.now()),
                tweet: tweet.text,
                engagement
              });
            }
          }
        } catch (error) {
          console.error('Error in token call search:', error);
        }
      }

      // Sort by confidence and return top calls
      return allCalls
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding token calls:', error);
      return [];
    }
  }

  private analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const bullishWords = [
      'moon', 'pump', 'bullish', 'buy', 'gem', 'rocket', '🚀', '📈', 
      'accumulate', 'hodl', 'diamond', '💎', 'ape', 'long', 'calls',
      'breakout', 'rally', 'surge', 'explosive', 'parabolic'
    ];
    
    const bearishWords = [
      'dump', 'crash', 'bearish', 'sell', 'short', 'puts', 'drop',
      'fall', 'decline', 'correction', 'bubble', 'overvalued', 'exit',
      'take profit', 'resistance', 'rejection', 'weak', 'bleeding'
    ];

    const lowerText = text.toLowerCase();
    
    let bullishScore = 0;
    let bearishScore = 0;

    bullishWords.forEach(word => {
      if (lowerText.includes(word)) bullishScore++;
    });

    bearishWords.forEach(word => {
      if (lowerText.includes(word)) bearishScore++;
    });

    if (bullishScore > bearishScore) return 'bullish';
    if (bearishScore > bullishScore) return 'bearish';
    return 'neutral';
  }

  private extractTokenSymbols(text: string): string[] {
    // Extract $SYMBOL patterns and common token mentions
    const symbolRegex = /\$([A-Z]{2,10})\b/g;
    const symbols: string[] = [];
    let match;

    while ((match = symbolRegex.exec(text)) !== null) {
      symbols.push(match[1]);
    }

    return [...new Set(symbols)]; // Remove duplicates
  }

  private calculateCallConfidence(text: string, followers: number, engagement: number): number {
    let confidence = 0;

    // Base confidence from follower count (0-40 points)
    confidence += Math.min(followers / 1000, 40);

    // Engagement boost (0-20 points)
    confidence += Math.min(engagement / 10, 20);

    // Sentiment analysis (0-30 points)
    const sentiment = this.analyzeSentiment(text);
    if (sentiment === 'bullish') confidence += 30;
    else if (sentiment === 'bearish') confidence += 10; // Bearish calls can be valuable too

    // Specific call indicators (0-10 points)
    const callIndicators = ['entry', 'buy now', 'accumulate', 'gem', 'moonshot'];
    const lowerText = text.toLowerCase();
    callIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) confidence += 2;
    });

    return Math.min(confidence, 100); // Cap at 100
  }

  async getInfluencerCalls(minFollowers: number = 50000): Promise<TokenCall[]> {
    const allCalls = await this.findTokenCalls(50);
    return allCalls.filter(call => call.followers >= minFollowers);
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const twitterService = new TwitterService();
export default TwitterService;