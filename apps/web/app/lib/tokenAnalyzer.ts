// Main token analyzer that integrates all APIs
import { pumpPortalAPI, PumpToken } from './api/pumpportal';
import { dexscreenerAPI, TokenPair } from './api/dexscreener';
import { geminiAPI, TokenAnalysis } from './api/gemini';
import { telegramAPI } from './api/telegram';

export interface EnrichedToken {
  // PumpPortal data
  mint: string;
  name: string;
  symbol: string;
  description: string;
  marketCap: number;
  age: number; // hours since creation
  website?: string;
  twitter?: string;
  telegram?: string;
  
  // Dexscreener data
  dexscreenerUrl?: string;
  priceUsd?: number;
  volume24h?: number;
  priceChange24h?: number;
  liquidity?: number;
  
  // AI Analysis
  analysis?: TokenAnalysis;
  
  // Metadata
  processedAt: number;
  source: 'pumpportal' | 'dexscreener' | 'manual';
}

class TokenAnalyzer {
  private processedTokens = new Set<string>();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[TokenAnalyzer] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[TokenAnalyzer] Starting token analysis system...');

    // Send startup message
    await telegramAPI.sendSystemMessage('🚀 MetaPulse AI System Started\n\nMonitoring pump.fun for new tokens...');

    // Run initial scan
    await this.scanForNewTokens();

    // Set up periodic scanning (every 2 minutes to respect rate limits)
    this.intervalId = setInterval(async () => {
      try {
        await this.scanForNewTokens();
      } catch (error) {
        console.error('[TokenAnalyzer] Error in periodic scan:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    console.log('[TokenAnalyzer] System started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    await telegramAPI.sendSystemMessage('⏹️ MetaPulse AI System Stopped');
    console.log('[TokenAnalyzer] System stopped');
  }

  private async scanForNewTokens(): Promise<void> {
    try {
      console.log('[TokenAnalyzer] Scanning for new tokens...');

      // Try to get recent tokens, fallback to mock data if API fails
      let recentTokens: any[] = [];
      
      try {
        recentTokens = await pumpPortalAPI.getRecentTokens(2, 20);
      } catch (error) {
        console.warn('[TokenAnalyzer] PumpPortal API failed, using mock data:', error);
        recentTokens = await pumpPortalAPI.getMockTokens(5);
      }
      
      if (recentTokens.length === 0) {
        console.log('[TokenAnalyzer] No new tokens found');
        return;
      }

      console.log(`[TokenAnalyzer] Found ${recentTokens.length} recent tokens`);

      // Process each new token
      for (const token of recentTokens) {
        if (this.processedTokens.has(token.mint)) {
          continue; // Skip already processed tokens
        }

        try {
          const enrichedToken = await this.processToken(token);
          
          // Only send alerts for tokens with decent scores
          if (enrichedToken.analysis && enrichedToken.analysis.score >= 40) {
            await telegramAPI.sendTokenAlert(enrichedToken, enrichedToken.analysis);
            console.log(`[TokenAnalyzer] Alert sent for ${token.symbol} (Score: ${enrichedToken.analysis.score})`);
          } else {
            console.log(`[TokenAnalyzer] Token ${token.symbol} scored too low (${enrichedToken.analysis?.score || 0}), skipping alert`);
          }

          this.processedTokens.add(token.mint);
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`[TokenAnalyzer] Error processing token ${token.symbol}:`, error);
        }
      }

    } catch (error) {
      console.error('[TokenAnalyzer] Error in scanForNewTokens:', error);
    }
  }

  private async processToken(pumpToken: PumpToken): Promise<EnrichedToken> {
    console.log(`[TokenAnalyzer] Processing token: ${pumpToken.symbol}`);

    // Start with PumpPortal data
    const enrichedToken: EnrichedToken = {
      mint: pumpToken.mint,
      name: pumpToken.name,
      symbol: pumpToken.symbol,
      description: pumpToken.description,
      marketCap: pumpToken.usd_market_cap,
      age: Math.floor((Date.now() - pumpToken.created_timestamp * 1000) / (1000 * 60 * 60)), // hours
      website: pumpToken.website,
      twitter: pumpToken.twitter,
      telegram: pumpToken.telegram,
      processedAt: Date.now(),
      source: 'pumpportal'
    };

    try {
      // Enrich with Dexscreener data
      const dexData = await this.enrichWithDexscreener(pumpToken.mint);
      if (dexData) {
        enrichedToken.dexscreenerUrl = dexData.url;
        enrichedToken.priceUsd = parseFloat(dexData.priceUsd);
        enrichedToken.volume24h = dexData.volume?.h24 || 0;
        enrichedToken.priceChange24h = dexData.priceChange?.h24 || 0;
        enrichedToken.liquidity = dexData.liquidity?.usd || 0;
      }
    } catch (error) {
      console.warn(`[TokenAnalyzer] Could not enrich ${pumpToken.symbol} with Dexscreener data:`, error);
    }

    try {
      // Analyze with Gemini AI
      enrichedToken.analysis = await geminiAPI.analyzeToken({
        name: enrichedToken.name,
        symbol: enrichedToken.symbol,
        description: enrichedToken.description,
        marketCap: enrichedToken.marketCap,
        volume24h: enrichedToken.volume24h,
        priceChange24h: enrichedToken.priceChange24h,
        age: enrichedToken.age,
        website: enrichedToken.website,
        twitter: enrichedToken.twitter,
        telegram: enrichedToken.telegram,
      });

      console.log(`[TokenAnalyzer] AI analysis complete for ${pumpToken.symbol}: Score ${enrichedToken.analysis.score}/100`);
    } catch (error) {
      console.error(`[TokenAnalyzer] AI analysis failed for ${pumpToken.symbol}:`, error);
    }

    return enrichedToken;
  }

  private async enrichWithDexscreener(mint: string): Promise<TokenPair | null> {
    try {
      const pairs = await dexscreenerAPI.getTokenPairs('solana', mint);
      
      if (pairs && pairs.length > 0) {
        // Return the pair with highest liquidity
        return pairs.reduce((best, current) => 
          (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
        );
      }
    } catch (error) {
      console.warn(`[TokenAnalyzer] Dexscreener lookup failed for ${mint}:`, error);
    }
    
    return null;
  }

  // Manual token analysis (for testing)
  async analyzeToken(mint: string): Promise<EnrichedToken | null> {
    try {
      console.log(`[TokenAnalyzer] Manual analysis requested for: ${mint}`);
      
      const pumpToken = await pumpPortalAPI.getToken(mint);
      const enrichedToken = await this.processToken(pumpToken);
      
      console.log(`[TokenAnalyzer] Manual analysis complete:`, enrichedToken);
      return enrichedToken;
      
    } catch (error) {
      console.error(`[TokenAnalyzer] Manual analysis failed for ${mint}:`, error);
      return null;
    }
  }

  // Get system stats
  getStats() {
    return {
      isRunning: this.isRunning,
      processedTokensCount: this.processedTokens.size,
      uptime: this.isRunning ? Date.now() : 0
    };
  }

  // Clear processed tokens cache (for testing)
  clearCache(): void {
    this.processedTokens.clear();
    console.log('[TokenAnalyzer] Cache cleared');
  }
}

export const tokenAnalyzer = new TokenAnalyzer();