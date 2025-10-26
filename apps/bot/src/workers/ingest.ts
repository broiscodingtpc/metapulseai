import { EventEmitter } from 'events';
import { RawEvent as CoreRawEvent, MarketSnapshot, TokenScore, getDatabaseClient } from '@metapulse/core';
import { RawEvent as PumpPortalRawEvent } from '@metapulse/pumpportal';
import { DexScreenerClient } from '@metapulse/dexscreener';
import { TokenSnapshot } from '@metapulse/core/src/scoring/assembleScore';
import { ModelRouter, ModelRouterConfig } from '@metapulse/core/src/ai/modelRouter';
import { GroqConfig } from '@metapulse/core/src/ai/providers/groq';
import { GeminiConfig } from '@metapulse/core/src/ai/providers/gemini';
import { ScoreAssembler } from '@metapulse/core/src/scoring/assembleScore';
import { PumpPortalWS } from '@metapulse/pumpportal';
import { RedisClient } from '@metapulse/core/src/redis';

export interface IngestWorkerConfig {
  pumpPortalApiKey?: string;
  enableLogging?: boolean;
  batchSize?: number;
  processingDelay?: number;
  maxRetries?: number;
}

export interface ProcessingStats {
  eventsReceived: number;
  eventsProcessed: number;
  eventsErrored: number;
  scoresGenerated: number;
  uptime: number;
  startTime: Date;
  lastEventAt?: Date;
  lastScoreAt?: Date;
}

export class IngestWorker extends EventEmitter {
  private pumpPortal: PumpPortalWS;
  private dexScreener: DexScreenerClient;
  private modelRouter: ModelRouter;
  private scoreAssembler: ScoreAssembler;
  private redis: RedisClient;
  private config: Required<IngestWorkerConfig>;
  private stats: ProcessingStats;
  private isRunning = false;
  private processingQueue: PumpPortalRawEvent[] = [];
  private processingTimer?: NodeJS.Timeout;

  constructor(
    config: IngestWorkerConfig = {},
    redis: RedisClient,
    groqApiKey: string,
    geminiApiKey: string
  ) {
    super();

    this.config = {
      pumpPortalApiKey: config.pumpPortalApiKey || '',
      enableLogging: config.enableLogging !== false,
      batchSize: config.batchSize || 10,
      processingDelay: config.processingDelay || 5000, // 5 seconds
      maxRetries: config.maxRetries || 3
    };

    this.redis = redis;

    // Initialize clients
    this.pumpPortal = new PumpPortalWS({
      apiKey: this.config.pumpPortalApiKey,
      enableLogging: this.config.enableLogging,
      onRawEvent: this.handleRawEvent.bind(this)
    });

    this.dexScreener = new DexScreenerClient({
      enableLogging: this.config.enableLogging,
      enableCaching: true,
      cacheExpiry: 300 // 5 minutes
    });

    this.modelRouter = new ModelRouter({
      groq: { 
        apiKey: groqApiKey,
        model: 'llama-3.1-8b-instant',
        redisClient: redis,
        rateLimit: 30
      },
      gemini: { 
        apiKey: geminiApiKey,
        model: 'gemini-2.5-flash',
        redisClient: redis,
        rateLimit: 60
      },
      consensusMaxDelta: 0.3
    });
    this.scoreAssembler = new ScoreAssembler();

    // Initialize stats
    this.stats = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsErrored: 0,
      scoresGenerated: 0,
      uptime: 0,
      startTime: new Date()
    };

    // Bind event handlers
    this.setupEventHandlers();
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [IngestWorker]`;
    
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

  private setupEventHandlers() {
    // PumpPortal events
    this.pumpPortal.on('connected', () => {
      this.log('✅ Connected to PumpPortal');
      this.emit('pumpPortalConnected');
    });

    this.pumpPortal.on('disconnected', (info) => {
      this.log(`🔌 Disconnected from PumpPortal: ${info.reason}`, 'warn');
      this.emit('pumpPortalDisconnected', info);
    });

    this.pumpPortal.on('error', (error) => {
      this.log(`PumpPortal error: ${error.message}`, 'error');
      this.emit('pumpPortalError', error);
    });

    this.pumpPortal.on('rawEvent', this.handleRawEvent.bind(this));
  }

  private async handleRawEvent(event: PumpPortalRawEvent) {
    try {
      this.stats.eventsReceived++;
      this.stats.lastEventAt = new Date();

      this.log(`📡 Received ${event.tx_type} event for ${event.mint}`);

      // Store raw event in database
      await this.storeRawEvent(event);

      // Add to processing queue
      this.processingQueue.push(event);

      // Emit event for real-time updates
      this.emit('rawEvent', event);

      // Process queue if it's large enough or if timer isn't running
      if (this.processingQueue.length >= this.config.batchSize || !this.processingTimer) {
        this.scheduleProcessing();
      }

    } catch (error) {
      this.stats.eventsErrored++;
      this.log(`Error handling raw event: ${error.message}`, 'error');
      this.emit('eventError', { event, error });
    }
  }

  private async storeRawEvent(event: PumpPortalRawEvent) {
    try {
      const db = getDatabaseClient();
      
      // Convert PumpPortalRawEvent to CoreRawEvent format
      const coreEvent: CoreRawEvent = {
        mint: event.mint,
        event_type: event.tx_type === 'create' ? 'tokenCreate' : 
                   event.tx_type === 'trade' ? 'tokenTrade' : 'migration',
        data: event.payload,
        received_at: event.received_at.toISOString()
      };
      
      await db.insertRawEvent(coreEvent);

      this.log(`💾 Stored raw event for ${event.mint}`);
    } catch (error) {
      this.log(`Error storing raw event: ${error.message}`, 'error');
      throw error;
    }
  }

  private scheduleProcessing() {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    this.processingTimer = setTimeout(() => {
      this.processQueue();
      this.processingTimer = undefined;
    }, this.config.processingDelay);
  }

  private async processQueue() {
    if (this.processingQueue.length === 0) return;

    const batch = this.processingQueue.splice(0, this.config.batchSize);
    this.log(`🔄 Processing batch of ${batch.length} events`);

    // Group events by mint to avoid duplicate processing
    const eventsByMint = new Map<string, PumpPortalRawEvent[]>();
    
    for (const event of batch) {
      if (!eventsByMint.has(event.mint)) {
        eventsByMint.set(event.mint, []);
      }
      eventsByMint.get(event.mint)!.push(event);
    }

    // Process each unique mint
    for (const [mint, events] of eventsByMint) {
      try {
        await this.processTokenEvents(mint, events);
        this.stats.eventsProcessed += events.length;
      } catch (error) {
        this.stats.eventsErrored += events.length;
        this.log(`Error processing events for ${mint}: ${error.message}`, 'error');
        this.emit('processingError', { mint, events, error });
      }
    }
  }

  private async processTokenEvents(mint: string, events: PumpPortalRawEvent[]) {
    this.log(`🔍 Processing ${events.length} events for token ${mint}`);

    // Get DexScreener data
    const dexData = await this.dexScreener.searchToken(mint);
    
    if (dexData.pairs.length === 0) {
      this.log(`No DexScreener pairs found for ${mint}`, 'warn');
      return;
    }

    // Build TokenSnapshot
    const snapshot = this.buildTokenSnapshot(mint, events, dexData.pairs);
    
    // Store market snapshot
    await this.storeMarketSnapshot(snapshot);

    // Get AI scores
    const aiResult = await this.modelRouter.getDualScores(snapshot);
    
    // Assemble final score
    const scoreResult = this.scoreAssembler.assembleScore(snapshot, aiResult);
    
    // Store scores
    await this.storeScores(mint, aiResult, scoreResult);
    
    this.stats.scoresGenerated++;
    this.stats.lastScoreAt = new Date();
    
    this.log(`✅ Processed token ${mint} with final score: ${scoreResult.finalScore}`);
    
    // Emit for real-time updates
    this.emit('tokenProcessed', {
      mint,
      snapshot,
      aiResult,
      scoreResult
    });
  }

  private buildTokenSnapshot(mint: string, events: PumpPortalRawEvent[], pairs: any[]): TokenSnapshot {
    const latestEvent = events[events.length - 1];
    const topPair = pairs[0]; // Assume first pair is most liquid

    // Calculate aggregated metrics from events
    const totalVolume = events.reduce((sum, e) => sum + (e.sol_amount || 0), 0);
    const uniqueTraders = new Set(events.map(e => e.trader_pubkey).filter(Boolean)).size;
    
    return {
      mint,
      name: latestEvent.name || topPair?.baseToken?.name || 'Unknown',
      symbol: latestEvent.symbol || topPair?.baseToken?.symbol || 'UNK',
      
      // Market data from DexScreener - using correct property names
      price: parseFloat(topPair?.priceUsd || '0'),
      marketCap: topPair?.marketCap || latestEvent.market_cap_sol || 0,
      volume24h: topPair?.volume?.h24 || 0,
      liquidity: topPair?.liquidity?.usd || 0,
      
      // Transaction metrics - using correct property names
      txCount1h: topPair?.txns?.h1 ? 
        (topPair.txns.h1.buys + topPair.txns.h1.sells) : 0,
      buyerSellerRatio: topPair?.txns?.h24 ? 
        (topPair.txns.h24.buys / Math.max(topPair.txns.h24.sells, 1)) : 1,
      
      // On-chain metrics from events - using correct property names
      uniqueBuyers: uniqueTraders,
      
      // Social metrics (placeholder - would integrate with X client)
      xMentions1h: 0,
      xEngagementRate: 0.5,
      
      // Metadata
      ageHours: topPair?.pairCreatedAt ? 
        (Date.now() - topPair.pairCreatedAt * 1000) / (1000 * 60 * 60) : 0,
      dexsUrl: topPair?.url
    };
  }

  private async storeMarketSnapshot(snapshot: TokenSnapshot) {
    try {
      const db = getDatabaseClient();
      
      const marketSnapshot: MarketSnapshot = {
        mint: snapshot.mint,
        price: snapshot.price || 0,
        volume_24h: snapshot.volume24h,
        liquidity: snapshot.liquidity,
        market_cap_sol: snapshot.marketCap,
        dex_url: snapshot.dexsUrl,
        snapshot_data: {
          name: snapshot.name,
          symbol: snapshot.symbol,
          txCount1h: snapshot.txCount1h,
          buyerSellerRatio: snapshot.buyerSellerRatio,
          uniqueBuyers: snapshot.uniqueBuyers,
          xMentions1h: snapshot.xMentions1h,
          xEngagementRate: snapshot.xEngagementRate,
          ageHours: snapshot.ageHours
        }
      };

      await db.upsertMarketSnapshot(marketSnapshot);

      this.log(`💾 Stored market snapshot for ${snapshot.mint}`);
    } catch (error) {
      this.log(`Error storing market snapshot: ${error.message}`, 'error');
      throw error;
    }
  }

  private async storeScores(mint: string, aiResult: any, scoreResult: any) {
    try {
      const db = getDatabaseClient();
      
      // Create TokenScore object
      const tokenScore: TokenScore = {
        mint,
        ai_score: aiResult.consensus?.prob_enterable ? Math.round(aiResult.consensus.prob_enterable * 100) : undefined,
        final_score: scoreResult.finalScore,
        confidence: aiResult.confidence,
        prob_enterable: aiResult.consensus?.prob_enterable,
        expected_roi_p50: aiResult.consensus?.expected_roi_p50,
        expected_roi_p90: aiResult.consensus?.expected_roi_p90,
        risk: aiResult.consensus?.risk,
        reasoning: aiResult.consensus?.reasoning,
        model_response: {
          groq: aiResult.groq,
          gemini: aiResult.gemini,
          consensus: aiResult.consensus,
          delta: aiResult.delta
        },
        heuristic_score: scoreResult.breakdown?.marketScore + scoreResult.breakdown?.socialScore + scoreResult.breakdown?.onChainScore
      };

      await db.upsertTokenScore(tokenScore);

      this.log(`💾 Stored scores for ${mint}`);
    } catch (error) {
      this.log(`Error storing scores: ${error.message}`, 'error');
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Worker already running', 'warn');
      return;
    }

    this.log('🚀 Starting ingest worker...');
    this.isRunning = true;
    this.stats.startTime = new Date();

    try {
      // Connect to PumpPortal
      await this.pumpPortal.connect();
      
      // Subscribe to new tokens and migrations
      this.pumpPortal.subscribeNewTokens();
      this.pumpPortal.subscribeMigrations();
      
      this.log('✅ Ingest worker started successfully');
      this.emit('started');
      
    } catch (error) {
      this.isRunning = false;
      this.log(`Failed to start worker: ${error.message}`, 'error');
      this.emit('startError', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.log('Worker not running', 'warn');
      return;
    }

    this.log('🛑 Stopping ingest worker...');
    this.isRunning = false;

    // Clear processing timer
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = undefined;
    }

    // Process remaining queue
    if (this.processingQueue.length > 0) {
      this.log(`Processing remaining ${this.processingQueue.length} events...`);
      await this.processQueue();
    }

    // Disconnect from PumpPortal
    this.pumpPortal.disconnect();

    this.log('✅ Ingest worker stopped');
    this.emit('stopped');
  }

  getStats(): ProcessingStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  isHealthy(): boolean {
    const now = Date.now();
    const lastEventAge = this.stats.lastEventAt ? 
      now - this.stats.lastEventAt.getTime() : Infinity;
    
    // Consider healthy if we've received an event in the last 5 minutes
    return this.isRunning && 
           this.pumpPortal.isConnected() && 
           lastEventAge < 5 * 60 * 1000;
  }

  // Manual processing trigger for testing
  async processToken(mint: string): Promise<void> {
    this.log(`🔍 Manual processing for token ${mint}`);
    
    try {
      // Create a synthetic event for processing
      const syntheticEvent: PumpPortalRawEvent = {
        mint,
        tx_type: 'manual',
        payload: {},
        received_at: new Date()
      };

      await this.processTokenEvents(mint, [syntheticEvent]);
      this.log(`✅ Manual processing completed for ${mint}`);
      
    } catch (error) {
      this.log(`Error in manual processing: ${error.message}`, 'error');
      throw error;
    }
  }
}