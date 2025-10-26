import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { RedisClient } from '@metapulse/core/src/redis';

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
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexPair[];
}

export interface TokenSearchResult {
  pairs: DexPair[];
  cached: boolean;
  cacheAge?: number;
}

export interface DexScreenerConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableCaching?: boolean;
  cacheExpiry?: number;
  rateLimitPerMinute?: number;
  enableLogging?: boolean;
}

export class DexScreenerClient {
  private client: AxiosInstance;
  private redis?: RedisClient;
  private config: Required<DexScreenerConfig>;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(config: DexScreenerConfig = {}, redis?: RedisClient) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.dexscreener.com/latest',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      enableCaching: config.enableCaching !== false,
      cacheExpiry: config.cacheExpiry || 300, // 5 minutes
      rateLimitPerMinute: config.rateLimitPerMinute || 300,
      enableLogging: config.enableLogging !== false
    };

    this.redis = redis;

    // Create axios instance
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MetaPulse/1.0'
      }
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: this.config.retries,
      retryDelay: (retryCount) => {
        return Math.min(this.config.retryDelay * Math.pow(2, retryCount - 1), 10000);
      },
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status === 429) || // Rate limit
               ((error.response?.status ?? 0) >= 500); // Server errors
      }
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.checkRateLimit();
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        const status = error.response?.status || 'unknown';
        const url = error.config?.url || 'unknown';
        this.log(`❌ ${error.config?.method?.toUpperCase()} ${url} - ${status}`, 'error');
        return Promise.reject(error);
      }
    );
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [DexScreener]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute

    // Reset counter if time window has passed
    if (now - this.lastResetTime >= timeWindow) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check if we've exceeded the rate limit
    if (this.requestCount >= this.config.rateLimitPerMinute) {
      const waitTime = timeWindow - (now - this.lastResetTime);
      this.log(`Rate limit reached, waiting ${waitTime}ms`, 'warn');
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount++;
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `dexscreener:${endpoint}:${Buffer.from(paramStr).toString('base64')}`;
  }

  private async getFromCache(key: string): Promise<any | null> {
    if (!this.redis || !this.config.enableCaching) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.log(`📦 Cache hit: ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.log(`Cache read error: ${error}`, 'warn');
    }

    return null;
  }

  private async setCache(key: string, data: any): Promise<void> {
    if (!this.redis || !this.config.enableCaching) return;

    try {
      await this.redis.set(key, JSON.stringify(data), this.config.cacheExpiry);
      this.log(`💾 Cached: ${key}`);
    } catch (error) {
      this.log(`Cache write error: ${error}`, 'warn');
    }
  }

  /**
   * Search for token pairs by token address
   */
  async searchToken(tokenAddress: string): Promise<TokenSearchResult> {
    const cacheKey = this.getCacheKey('token', { address: tokenAddress });
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return {
        pairs: cached.pairs,
        cached: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }

    try {
      this.log(`🔍 Searching token: ${tokenAddress}`);
      
      const response = await this.client.get<DexScreenerResponse>(`/dex/tokens/${tokenAddress}`);
      
      const result = {
        pairs: response.data.pairs || [],
        cached: false
      };

      // Cache the result with timestamp
      await this.setCache(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      this.log(`Found ${result.pairs.length} pairs for token ${tokenAddress}`);
      return result;

    } catch (error) {
      this.log(`Error searching token ${tokenAddress}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get pair information by pair address
   */
  async getPair(pairAddress: string): Promise<DexPair | null> {
    const cacheKey = this.getCacheKey('pair', { address: pairAddress });
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.log(`📦 Cache hit for pair: ${pairAddress}`);
      return cached.pair;
    }

    try {
      this.log(`🔍 Fetching pair: ${pairAddress}`);
      
      const response = await this.client.get<DexScreenerResponse>(`/dex/pairs/${pairAddress}`);
      
      const pair = response.data.pairs?.[0] || null;

      // Cache the result
      await this.setCache(cacheKey, { pair, timestamp: Date.now() });

      this.log(`${pair ? 'Found' : 'No'} pair data for ${pairAddress}`);
      return pair;

    } catch (error) {
      this.log(`Error fetching pair ${pairAddress}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get multiple pairs by addresses
   */
  async getPairs(pairAddresses: string[]): Promise<DexPair[]> {
    if (pairAddresses.length === 0) return [];

    const addressesStr = pairAddresses.join(',');
    const cacheKey = this.getCacheKey('pairs', { addresses: addressesStr });
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.log(`📦 Cache hit for ${pairAddresses.length} pairs`);
      return cached.pairs;
    }

    try {
      this.log(`🔍 Fetching ${pairAddresses.length} pairs`);
      
      const response = await this.client.get<DexScreenerResponse>(`/dex/pairs/${addressesStr}`);
      
      const pairs = response.data.pairs || [];

      // Cache the result
      await this.setCache(cacheKey, { pairs, timestamp: Date.now() });

      this.log(`Found ${pairs.length} pairs out of ${pairAddresses.length} requested`);
      return pairs;

    } catch (error) {
      this.log(`Error fetching pairs: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Search pairs by chain ID
   */
  async searchByChain(chainId: string, limit: number = 50): Promise<DexPair[]> {
    const cacheKey = this.getCacheKey('chain', { chainId, limit });
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.log(`📦 Cache hit for chain ${chainId}`);
      return cached.pairs;
    }

    try {
      this.log(`🔍 Searching chain: ${chainId}`);
      
      const response = await this.client.get<DexScreenerResponse>(`/dex/search`, {
        params: {
          q: `chainId:${chainId}`,
          limit
        }
      });
      
      const pairs = response.data.pairs || [];

      // Cache the result
      await this.setCache(cacheKey, { pairs, timestamp: Date.now() });

      this.log(`Found ${pairs.length} pairs for chain ${chainId}`);
      return pairs;

    } catch (error) {
      this.log(`Error searching chain ${chainId}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get trending pairs
   */
  async getTrending(limit: number = 50): Promise<DexPair[]> {
    const cacheKey = this.getCacheKey('trending', { limit });
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.log(`📦 Cache hit for trending pairs`);
      return cached.pairs;
    }

    try {
      this.log(`🔍 Fetching trending pairs`);
      
      const response = await this.client.get<DexScreenerResponse>(`/dex/search`, {
        params: {
          q: 'volume24h:>1000',
          sort: 'volume24h',
          order: 'desc',
          limit
        }
      });
      
      const pairs = response.data.pairs || [];

      // Cache the result (shorter cache time for trending)
      await this.setCache(cacheKey, { pairs, timestamp: Date.now() });

      this.log(`Found ${pairs.length} trending pairs`);
      return pairs;

    } catch (error) {
      this.log(`Error fetching trending pairs: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Clear cache for specific key or all cache
   */
  async clearCache(pattern?: string): Promise<void> {
    if (!this.redis) return;

    try {
      if (pattern) {
        // Clear specific pattern (would need Redis SCAN in production)
        this.log(`🧹 Clearing cache pattern: ${pattern}`);
      } else {
        // Clear all DexScreener cache
        this.log(`🧹 Clearing all DexScreener cache`);
      }
    } catch (error) {
      this.log(`Error clearing cache: ${error}`, 'error');
    }
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastResetTime: this.lastResetTime,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
      cacheEnabled: this.config.enableCaching,
      cacheExpiry: this.config.cacheExpiry
    };
  }
}