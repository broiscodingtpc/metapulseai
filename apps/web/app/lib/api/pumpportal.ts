// PumpPortal API wrapper - Updated with correct endpoints
export interface PumpToken {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  show_name: boolean;
  created_timestamp: number;
  raydium_pool?: string;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  real_sol_reserves: number;
  real_token_reserves: number;
  last_trade_timestamp: number;
  king_of_the_hill_timestamp?: number;
  market_cap: number;
  reply_count: number;
  last_reply: number;
  nsfw: boolean;
  market_id?: string;
  inverted?: boolean;
  is_currently_live: boolean;
  username?: string;
  profile_image?: string;
  usd_market_cap: number;
}

export interface PumpTradeEvent {
  signature: string;
  mint: string;
  sol_amount: number;
  token_amount: number;
  is_buy: boolean;
  user: string;
  timestamp: number;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  real_sol_reserves: number;
  real_token_reserves: number;
}

class PumpPortalAPI {
  private apiKey: string;
  private baseUrl = 'https://pumpportal.fun/api';
  private wsUrl = 'wss://pumpportal.fun/api/data';

  constructor() {
    this.apiKey = process.env.PUMPPORTAL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[PumpPortal] API key not found');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      console.log(`[PumpPortal] Making request to ${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[PumpPortal] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // WebSocket connection for real-time data
  createWebSocketConnection(): WebSocket {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      console.log('[PumpPortal] WebSocket connected');
      
      // Subscribe to new token events
      ws.send(JSON.stringify({
        method: "subscribeNewToken"
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[PumpPortal] WebSocket message:', data);
      } catch (error) {
        console.error('[PumpPortal] WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[PumpPortal] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[PumpPortal] WebSocket disconnected');
    };

    return ws;
  }

  // Get recent tokens using WebSocket (fallback method)
  async getRecentTokens(hours = 1, limit = 50): Promise<PumpToken[]> {
    return new Promise((resolve, reject) => {
      const tokens: PumpToken[] = [];
      const ws = this.createWebSocketConnection();
      const timeout = setTimeout(() => {
        ws.close();
        resolve(tokens.slice(0, limit));
      }, 10000); // 10 second timeout

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.txType === 'create') {
            const token: PumpToken = {
              mint: data.mint,
              name: data.name || 'Unknown',
              symbol: data.symbol || 'UNK',
              description: data.description || '',
              image_uri: data.image_uri || '',
              metadata_uri: data.metadata_uri || '',
              twitter: data.twitter,
              telegram: data.telegram,
              website: data.website,
              show_name: data.show_name || true,
              created_timestamp: Math.floor(Date.now() / 1000),
              complete: false,
              virtual_sol_reserves: data.virtual_sol_reserves || 0,
              virtual_token_reserves: data.virtual_token_reserves || 0,
              total_supply: data.total_supply || 0,
              real_sol_reserves: data.real_sol_reserves || 0,
              real_token_reserves: data.real_token_reserves || 0,
              last_trade_timestamp: Math.floor(Date.now() / 1000),
              market_cap: data.market_cap || 0,
              reply_count: 0,
              last_reply: 0,
              nsfw: false,
              is_currently_live: true,
              usd_market_cap: data.usd_market_cap || 0,
              raydium_pool: data.raydium_pool
            };

            tokens.push(token);
            
            if (tokens.length >= limit) {
              clearTimeout(timeout);
              ws.close();
              resolve(tokens);
            }
          }
        } catch (error) {
          console.error('[PumpPortal] WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  // Mock data for testing when API is not available
  async getMockTokens(limit = 20): Promise<PumpToken[]> {
    console.log('[PumpPortal] Using mock data for testing');
    
    const mockTokens: PumpToken[] = [];
    const categories = ['AI', 'Gaming', 'Meme', 'DeFi', 'NFT'];
    
    for (let i = 0; i < limit; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const timestamp = Math.floor(Date.now() / 1000) - (i * 300); // 5 minutes apart
      
      mockTokens.push({
        mint: `Mock${i}${Math.random().toString(36).substring(7)}`,
        name: `${category} Token ${i + 1}`,
        symbol: `${category.substring(0, 3).toUpperCase()}${i + 1}`,
        description: `A mock ${category.toLowerCase()} token for testing purposes`,
        image_uri: '',
        metadata_uri: '',
        show_name: true,
        created_timestamp: timestamp,
        complete: false,
        virtual_sol_reserves: Math.random() * 1000,
        virtual_token_reserves: Math.random() * 1000000,
        total_supply: 1000000000,
        real_sol_reserves: Math.random() * 500,
        real_token_reserves: Math.random() * 500000,
        last_trade_timestamp: timestamp,
        market_cap: Math.random() * 100000,
        reply_count: Math.floor(Math.random() * 50),
        last_reply: timestamp,
        nsfw: false,
        is_currently_live: true,
        usd_market_cap: Math.random() * 100000
      });
    }
    
    return mockTokens;
  }

  // Get token by mint address (mock implementation)
  async getToken(mint: string): Promise<PumpToken> {
    console.log(`[PumpPortal] Getting token ${mint} (mock)`);
    
    return {
      mint,
      name: 'Mock Token',
      symbol: 'MOCK',
      description: 'A mock token for testing',
      image_uri: '',
      metadata_uri: '',
      show_name: true,
      created_timestamp: Math.floor(Date.now() / 1000) - 3600,
      complete: false,
      virtual_sol_reserves: 500,
      virtual_token_reserves: 500000,
      total_supply: 1000000000,
      real_sol_reserves: 250,
      real_token_reserves: 250000,
      last_trade_timestamp: Math.floor(Date.now() / 1000),
      market_cap: 50000,
      reply_count: 10,
      last_reply: Math.floor(Date.now() / 1000),
      nsfw: false,
      is_currently_live: true,
      usd_market_cap: 50000
    };
  }

  // Get recent trades (mock implementation)
  async getTokenTrades(mint: string, limit = 100): Promise<PumpTradeEvent[]> {
    console.log(`[PumpPortal] Getting trades for ${mint} (mock)`);
    
    const trades: PumpTradeEvent[] = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      trades.push({
        signature: `mock_signature_${i}`,
        mint,
        sol_amount: Math.random() * 10,
        token_amount: Math.random() * 10000,
        is_buy: Math.random() > 0.5,
        user: `mock_user_${i}`,
        timestamp: Math.floor(Date.now() / 1000) - (i * 60),
        virtual_sol_reserves: 500,
        virtual_token_reserves: 500000,
        real_sol_reserves: 250,
        real_token_reserves: 250000
      });
    }
    
    return trades;
  }

  // Get trending tokens - try real API first, fallback to mock
  async getTrendingTokens(limit = 20): Promise<PumpToken[]> {
    try {
      console.log('[PumpPortal] Attempting to get trending tokens from real API');
      
      // Try to get real tokens via WebSocket
      const realTokens = await this.getRecentTokens(24, limit);
      
      if (realTokens.length > 0) {
        console.log(`[PumpPortal] Got ${realTokens.length} real tokens`);
        return realTokens;
      }
      
      throw new Error('No real tokens available');
    } catch (error) {
      console.log('[PumpPortal] Falling back to mock data:', error);
      return this.getMockTokens(limit);
    }
  }
}

export const pumpPortalAPI = new PumpPortalAPI();