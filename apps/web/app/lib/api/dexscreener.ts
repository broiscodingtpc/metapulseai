// Dexscreener API wrapper with rate limiting
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }
    }
    
    this.requests.push(now);
  }
}

// Rate limiter: 60 requests per minute
const rateLimiter = new RateLimiter(60, 60 * 1000);

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface TokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon: string;
  header: string;
  description: string;
  links: Array<{
    type: string;
    label: string;
    url: string;
  }>;
}

export interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[];
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
  priceUsd: string;
  txns: Record<string, { buys: number; sells: number }>;
  volume: Record<string, number>;
  priceChange: Record<string, number>;
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ platform: string; handle: string }>;
  };
  boosts?: {
    active: number;
  };
}

class DexscreenerAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com';
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const cacheKey = endpoint;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      console.log(`[Dexscreener] Cache hit for ${endpoint}`);
      return cached;
    }

    await rateLimiter.waitForSlot();
    
    try {
      console.log(`[Dexscreener] Making request to ${endpoint}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`[Dexscreener] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // Get latest boosted tokens
  async getLatestBoosts(): Promise<TokenBoost[]> {
    return this.makeRequest('/token-boosts/latest/v1');
  }

  // Get top boosted tokens
  async getTopBoosts(): Promise<TokenBoost[]> {
    return this.makeRequest('/token-boosts/top/v1');
  }

  // Get token pairs by token address
  async getTokenPairs(chainId: string, tokenAddress: string): Promise<TokenPair[]> {
    return this.makeRequest(`/token-pairs/v1/${chainId}/${tokenAddress}`);
  }

  // Get multiple tokens by addresses (up to 30)
  async getTokens(chainId: string, tokenAddresses: string[]): Promise<TokenPair[]> {
    const addresses = tokenAddresses.slice(0, 30).join(',');
    return this.makeRequest(`/tokens/v1/${chainId}/${addresses}`);
  }

  // Search for pairs
  async searchPairs(query: string): Promise<{ pairs: TokenPair[] }> {
    return this.makeRequest(`/latest/dex/search?q=${encodeURIComponent(query)}`);
  }

  // Get pair by chain and pair address
  async getPair(chainId: string, pairId: string): Promise<{ pairs: TokenPair[] }> {
    return this.makeRequest(`/latest/dex/pairs/${chainId}/${pairId}`);
  }

  // Check orders for token
  async getTokenOrders(chainId: string, tokenAddress: string): Promise<Array<{
    type: string;
    status: string;
    paymentTimestamp: number;
  }>> {
    return this.makeRequest(`/orders/v1/${chainId}/${tokenAddress}`);
  }
}

export const dexscreenerAPI = new DexscreenerAPI();