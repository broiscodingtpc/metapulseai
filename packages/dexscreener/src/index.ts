import axios, { AxiosInstance, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { getRedisClient, createTokenBucket, TokenBucketConfig } from '@metapulse/core';

// DexScreener API types
export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ label: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

export interface DexTokenProfile {
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{ type: string; label: string; url: string }>;
}

export interface DexSearchResult {
  schemaVersion: string;
  pairs: DexPair[];
}

export interface DexTokenData {
  pairs: DexPair[];
  profile?: DexTokenProfile;
}

export interface DexScreenerConfig {
  baseUrl?: string;
  rateLimitConfig?: TokenBucketConfig;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class DexScreenerClient {
  private client: AxiosInstance;
  private rateLimiter: ReturnType<typeof createTokenBucket>;
  private baseUrl: string;

  constructor(config: DexScreenerConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.dexscreener.com';
    
    // Default rate limiting: 300 requests per minute (5 per second)
    const rateLimitConfig: TokenBucketConfig = config.rateLimitConfig || {
      capacity: 300,
      refillRate: 5, // 5 tokens per second
      keyPrefix: 'dexscreener_api'
    };

    this.rateLimiter = createTokenBucket(rateLimitConfig);

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MetaPulse/1.0'
      }
    });

    // Configure retries
    axiosRetry(this.client, {
      retries: config.retries || 3,
      retryDelay: (retryCount) => {
        return Math.min(1000 * Math.pow(2, retryCount), config.retryDelay || 5000);
      },
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status === 429); // Rate limit
      }
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      const rateLimitResult = await this.rateLimiter('global');
      
      if (!rateLimitResult.allowed) {
        const error = new Error('Rate limit exceeded');
        (error as any).retryAfter = rateLimitResult.retryAfter;
        throw error;
      }

      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limited by server
          const retryAfter = error.response.headers['retry-after'] || 60;
          await this.delay(parseInt(retryAfter) * 1000);
          return this.client.request(error.config);
        }
        throw error;
      }
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(endpoint);
      return response.data;
    } catch (error: any) {
      if (error.retryAfter) {
        throw new Error(`Rate limited. Retry after ${error.retryAfter} seconds`);
      }
      throw new Error(`DexScreener API error: ${error.message}`);
    }
  }

  // Get token pairs by address
  async getTokenPairs(tokenAddress: string): Promise<DexPair[]> {
    const data = await this.makeRequest<DexSearchResult>(`/latest/dex/tokens/${tokenAddress}`);
    return data.pairs || [];
  }

  // Get specific pair by address
  async getPair(pairAddress: string): Promise<DexPair | null> {
    try {
      const data = await this.makeRequest<DexSearchResult>(`/latest/dex/pairs/${pairAddress}`);
      return data.pairs?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  // Get multiple pairs by addresses
  async getPairs(pairAddresses: string[]): Promise<DexPair[]> {
    if (pairAddresses.length === 0) return [];
    
    const addressList = pairAddresses.join(',');
    const data = await this.makeRequest<DexSearchResult>(`/latest/dex/pairs/${addressList}`);
    return data.pairs || [];
  }

  // Search tokens by query
  async searchTokens(query: string): Promise<DexPair[]> {
    const data = await this.makeRequest<DexSearchResult>(`/latest/dex/search?q=${encodeURIComponent(query)}`);
    return data.pairs || [];
  }

  // Get token profile
  async getTokenProfile(tokenAddress: string): Promise<DexTokenProfile | null> {
    try {
      const data = await this.makeRequest<DexTokenProfile>(`/latest/dex/tokens/${tokenAddress}/info`);
      return data;
    } catch (error) {
      return null;
    }
  }

  // Get comprehensive token data (pairs + profile)
  async getTokenData(tokenAddress: string): Promise<DexTokenData> {
    const [pairs, profile] = await Promise.allSettled([
      this.getTokenPairs(tokenAddress),
      this.getTokenProfile(tokenAddress)
    ]);

    return {
      pairs: pairs.status === 'fulfilled' ? pairs.value : [],
      profile: profile.status === 'fulfilled' ? profile.value : undefined
    };
  }

  // Get trending tokens (using search with popular terms)
  async getTrendingTokens(limit = 50): Promise<DexPair[]> {
    // DexScreener doesn't have a direct trending endpoint, so we'll search for popular terms
    const trendingQueries = ['meme', 'pepe', 'doge', 'shib', 'bonk'];
    const allPairs: DexPair[] = [];

    for (const query of trendingQueries) {
      try {
        const pairs = await this.searchTokens(query);
        allPairs.push(...pairs.slice(0, 10)); // Take top 10 from each query
      } catch (error) {
        console.warn(`Failed to search for trending tokens with query "${query}":`, error);
      }
    }

    // Sort by volume and remove duplicates
    const uniquePairs = allPairs.filter((pair, index, self) => 
      index === self.findIndex(p => p.pairAddress === pair.pairAddress)
    );

    return uniquePairs
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, limit);
  }

  // Get pairs by chain
  async getPairsByChain(chainId: string, limit = 100): Promise<DexPair[]> {
    // This would require a different approach as DexScreener doesn't have a direct chain endpoint
    // We'll search for popular tokens and filter by chain
    const pairs = await this.getTrendingTokens(limit * 2);
    return pairs.filter(pair => pair.chainId === chainId).slice(0, limit);
  }

  // Analyze token metrics
  analyzeTokenMetrics(pairs: DexPair[]): {
    totalVolume24h: number;
    totalLiquidity: number;
    avgPriceChange24h: number;
    totalTransactions24h: number;
    topPair: DexPair | null;
  } {
    if (pairs.length === 0) {
      return {
        totalVolume24h: 0,
        totalLiquidity: 0,
        avgPriceChange24h: 0,
        totalTransactions24h: 0,
        topPair: null
      };
    }

    const totalVolume24h = pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0);
    const totalLiquidity = pairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0);
    const avgPriceChange24h = pairs.reduce((sum, pair) => sum + (pair.priceChange?.h24 || 0), 0) / pairs.length;
    const totalTransactions24h = pairs.reduce((sum, pair) => 
      sum + (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0), 0);
    
    const topPair = pairs.reduce((top, pair) => 
      (pair.volume?.h24 || 0) > (top?.volume?.h24 || 0) ? pair : top, pairs[0]);

    return {
      totalVolume24h,
      totalLiquidity,
      avgPriceChange24h,
      totalTransactions24h,
      topPair
    };
  }

  // Calculate token score based on DexScreener metrics
  calculateTokenScore(pairs: DexPair[]): number {
    if (pairs.length === 0) return 0;

    const metrics = this.analyzeTokenMetrics(pairs);
    let score = 0;

    // Volume score (0-30 points)
    const volumeScore = Math.min(30, Math.log10(metrics.totalVolume24h + 1) * 3);
    score += volumeScore;

    // Liquidity score (0-25 points)
    const liquidityScore = Math.min(25, Math.log10(metrics.totalLiquidity + 1) * 2.5);
    score += liquidityScore;

    // Price change score (0-20 points, positive changes get more points)
    const priceChangeScore = Math.max(0, Math.min(20, metrics.avgPriceChange24h / 5 + 10));
    score += priceChangeScore;

    // Transaction activity score (0-15 points)
    const txScore = Math.min(15, Math.log10(metrics.totalTransactions24h + 1) * 1.5);
    score += txScore;

    // Pair count bonus (0-10 points)
    const pairCountScore = Math.min(10, pairs.length * 2);
    score += pairCountScore;

    return Math.round(score);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<any>('/latest/dex/tokens/So11111111111111111111111111111111111111112'); // SOL token
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get rate limit status
  async getRateLimitStatus(): Promise<{ allowed: boolean; retryAfter?: number }> {
    return await this.rateLimiter('status_check', 0); // 0 tokens requested for status check
  }
}

// Singleton instance
let dexScreenerClient: DexScreenerClient | null = null;

export function createDexScreenerClient(config?: DexScreenerConfig): DexScreenerClient {
  if (!dexScreenerClient) {
    dexScreenerClient = new DexScreenerClient(config);
  }
  return dexScreenerClient;
}

export function getDexScreenerClient(): DexScreenerClient {
  if (!dexScreenerClient) {
    throw new Error('DexScreener client not initialized. Call createDexScreenerClient first.');
  }
  return dexScreenerClient;
}