import cron from 'node-cron';
import { getDatabaseClient } from '@metapulse/core';
import { RedisClient } from '@metapulse/core/src/redis';
import { EventEmitter } from 'events';

export interface HourlySchedulerConfig {
  enableLogging?: boolean;
  minScore?: number;
  maxTokens?: number;
  minVolume?: number;
  minLiquidity?: number;
  cronExpression?: string;
}

export interface TokenCandidate {
  mint: string;
  name: string;
  symbol: string;
  final_score: number;
  confidence: number;
  market_cap: number;
  volume_24h: number;
  liquidity_usd: number;
  price_change_24h: number;
  tx_count_24h: number;
  unique_traders_24h: number;
  created_at: string;
  reasoning?: string;
}

export interface HourlySignal {
  id?: string;
  mint: string;
  name: string;
  symbol: string;
  score: number;
  confidence: number;
  rank: number;
  market_cap: number;
  volume_24h: number;
  liquidity_usd: number;
  price_change_24h: number;
  reasoning: string;
  created_at: Date;
}

export interface SchedulerStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
  tokensProcessed: number;
  signalsGenerated: number;
  uptime: number;
  startTime: Date;
}

export class HourlyScheduler extends EventEmitter {
  private config: Required<HourlySchedulerConfig>;
  private redis: RedisClient;
  private cronJob?: cron.ScheduledTask;
  private stats: SchedulerStats;
  private isRunning = false;

  constructor(config: HourlySchedulerConfig = {}, redis: RedisClient) {
    super();

    this.config = {
      enableLogging: config.enableLogging !== false,
      minScore: config.minScore || 60,
      maxTokens: config.maxTokens || 10,
      minVolume: config.minVolume || 1000, // $1k minimum volume
      minLiquidity: config.minLiquidity || 5000, // $5k minimum liquidity
      cronExpression: config.cronExpression || '0 * * * *' // Every hour at minute 0
    };

    this.redis = redis;

    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      tokensProcessed: 0,
      signalsGenerated: 0,
      uptime: 0,
      startTime: new Date()
    };
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [HourlyScheduler]`;
    
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

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Scheduler already running', 'warn');
      return;
    }

    this.log(`🕐 Starting hourly scheduler with cron: ${this.config.cronExpression}`);
    this.isRunning = true;
    this.stats.startTime = new Date();

    // Create cron job
    this.cronJob = cron.schedule(this.config.cronExpression, async () => {
      await this.runHourlyAnalysis();
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC'
    });

    // Start the cron job
    this.cronJob.start();

    // Run initial analysis
    setTimeout(() => {
      this.runHourlyAnalysis();
    }, 5000); // Wait 5 seconds after start

    this.log('✅ Hourly scheduler started');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.log('Scheduler not running', 'warn');
      return;
    }

    this.log('🛑 Stopping hourly scheduler...');
    this.isRunning = false;

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
    }

    this.log('✅ Hourly scheduler stopped');
    this.emit('stopped');
  }

  private async runHourlyAnalysis(): Promise<void> {
    if (!this.isRunning) return;

    this.stats.totalRuns++;
    this.stats.lastRunAt = new Date();

    this.log('🔍 Starting hourly token analysis...');
    this.emit('analysisStarted');

    try {
      // Get token candidates from the last hour
      const candidates = await this.getTokenCandidates();
      this.stats.tokensProcessed += candidates.length;

      this.log(`Found ${candidates.length} token candidates`);

      if (candidates.length === 0) {
        this.log('No candidates found, skipping signal generation');
        this.stats.successfulRuns++;
        this.emit('analysisCompleted', { signals: [] });
        return;
      }

      // Filter and rank candidates
      const filteredCandidates = this.filterCandidates(candidates);
      this.log(`${filteredCandidates.length} candidates passed filters`);

      const rankedCandidates = this.rankCandidates(filteredCandidates);
      this.log(`Top ${rankedCandidates.length} candidates ranked`);

      // Generate hourly signals
      const signals = await this.generateHourlySignals(rankedCandidates);
      this.stats.signalsGenerated += signals.length;

      // Store signals in database
      await this.storeHourlySignals(signals);

      // Cache best signals in Redis for quick access
      await this.cacheBestSignals(signals);

      this.stats.successfulRuns++;
      this.stats.lastSuccessAt = new Date();

      this.log(`✅ Generated ${signals.length} hourly signals`);
      this.emit('analysisCompleted', { signals });

    } catch (error) {
      this.stats.failedRuns++;
      this.stats.lastErrorAt = new Date();
      this.stats.lastError = error.message;

      this.log(`Error in hourly analysis: ${error.message}`, 'error');
      this.emit('analysisError', error);
    }
  }

  private async getTokenCandidates(): Promise<TokenCandidate[]> {
    const supabase = getDatabaseClient().getSupabaseClient();
    
    // Get tokens with scores from the last 2 hours (to ensure we have recent data)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('scores')
      .select(`
        mint,
        final_score,
        confidence,
        created_at,
        consensus_score,
        market_snapshots!inner (
          name,
          symbol,
          market_cap,
          volume_24h,
          liquidity_usd,
          price_change_24h,
          tx_count_24h,
          unique_traders_24h,
          created_at
        )
      `)
      .gte('created_at', twoHoursAgo)
      .order('final_score', { ascending: false })
      .limit(500); // Get top 500 to filter from

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform data into TokenCandidate format
    return data.map(item => {
      const snapshot = Array.isArray(item.market_snapshots) ? item.market_snapshots[0] : item.market_snapshots;
      return {
        mint: item.mint,
        name: snapshot?.name || 'Unknown',
        symbol: snapshot?.symbol || 'UNK',
        final_score: item.final_score,
        confidence: item.confidence,
        market_cap: snapshot?.market_cap || 0,
        volume_24h: snapshot?.volume_24h || 0,
        liquidity_usd: snapshot?.liquidity_usd || 0,
        price_change_24h: snapshot?.price_change_24h || 0,
        tx_count_24h: snapshot?.tx_count_24h || 0,
        unique_traders_24h: snapshot?.unique_traders_24h || 0,
        created_at: item.created_at,
        reasoning: item.consensus_score?.reasoning || 'AI analysis completed'
      };
    });
  }

  private filterCandidates(candidates: TokenCandidate[]): TokenCandidate[] {
    return candidates.filter(candidate => {
      // Score filter
      if (candidate.final_score < this.config.minScore) {
        return false;
      }

      // Volume filter
      if (candidate.volume_24h < this.config.minVolume) {
        return false;
      }

      // Liquidity filter
      if (candidate.liquidity_usd < this.config.minLiquidity) {
        return false;
      }

      // Confidence filter (at least 0.6)
      if (candidate.confidence < 0.6) {
        return false;
      }

      // Activity filter (at least 10 transactions)
      if (candidate.tx_count_24h < 10) {
        return false;
      }

      // Market cap filter (not too small, not too large)
      if (candidate.market_cap < 10000 || candidate.market_cap > 100000000) {
        return false;
      }

      return true;
    });
  }

  private rankCandidates(candidates: TokenCandidate[]): TokenCandidate[] {
    // Sort by a composite score that considers multiple factors
    return candidates
      .sort((a, b) => {
        // Primary: Final score
        const scoreDiff = b.final_score - a.final_score;
        if (Math.abs(scoreDiff) > 5) return scoreDiff;

        // Secondary: Confidence
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;

        // Tertiary: Volume
        return b.volume_24h - a.volume_24h;
      })
      .slice(0, this.config.maxTokens);
  }

  private async generateHourlySignals(candidates: TokenCandidate[]): Promise<HourlySignal[]> {
    const now = new Date();

    return candidates.map((candidate, index) => ({
      mint: candidate.mint,
      name: candidate.name,
      symbol: candidate.symbol,
      score: candidate.final_score,
      confidence: candidate.confidence,
      rank: index + 1,
      market_cap: candidate.market_cap,
      volume_24h: candidate.volume_24h,
      liquidity_usd: candidate.liquidity_usd,
      price_change_24h: candidate.price_change_24h,
      reasoning: this.generateSignalReasoning(candidate, index + 1),
      created_at: now
    }));
  }

  private generateSignalReasoning(candidate: TokenCandidate, rank: number): string {
    const reasons = [];

    // Score-based reasoning
    if (candidate.final_score >= 80) {
      reasons.push('🔥 Exceptional AI score');
    } else if (candidate.final_score >= 70) {
      reasons.push('⭐ Strong AI score');
    } else {
      reasons.push('✅ Good AI score');
    }

    // Volume reasoning
    if (candidate.volume_24h >= 100000) {
      reasons.push('📈 High volume');
    } else if (candidate.volume_24h >= 10000) {
      reasons.push('📊 Good volume');
    }

    // Price change reasoning
    if (candidate.price_change_24h > 50) {
      reasons.push('🚀 Strong momentum');
    } else if (candidate.price_change_24h > 10) {
      reasons.push('📈 Positive momentum');
    } else if (candidate.price_change_24h < -20) {
      reasons.push('⚠️ Recent dip - potential entry');
    }

    // Activity reasoning
    if (candidate.unique_traders_24h >= 100) {
      reasons.push('👥 High trader activity');
    } else if (candidate.unique_traders_24h >= 50) {
      reasons.push('👤 Good trader activity');
    }

    // Liquidity reasoning
    if (candidate.liquidity_usd >= 50000) {
      reasons.push('💧 Strong liquidity');
    }

    // Rank-based reasoning
    if (rank === 1) {
      reasons.unshift('🥇 Top pick');
    } else if (rank <= 3) {
      reasons.unshift(`🏆 #${rank} ranked`);
    }

    return reasons.join(' • ');
  }

  private async storeHourlySignals(signals: HourlySignal[]): Promise<void> {
    if (signals.length === 0) return;

    const supabase = getDatabaseClient().getSupabaseClient();

    const { error } = await supabase
      .from('hourly_signals')
      .insert(
        signals.map(signal => ({
          mint: signal.mint,
          name: signal.name,
          symbol: signal.symbol,
          score: signal.score,
          confidence: signal.confidence,
          rank: signal.rank,
          market_cap: signal.market_cap,
          volume_24h: signal.volume_24h,
          liquidity_usd: signal.liquidity_usd,
          price_change_24h: signal.price_change_24h,
          reasoning: signal.reasoning,
          created_at: signal.created_at.toISOString()
        }))
      );

    if (error) {
      throw new Error(`Failed to store hourly signals: ${error.message}`);
    }

    this.log(`💾 Stored ${signals.length} hourly signals`);
  }

  private async cacheBestSignals(signals: HourlySignal[]): Promise<void> {
    if (signals.length === 0) return;

    try {
      // Cache top 5 signals for quick API access
      const topSignals = signals.slice(0, 5);
      
      await this.redis.set(
        'hourly:best_signals',
        JSON.stringify(topSignals),
        3600 // 1 hour expiry
      );

      // Cache individual signals
      for (const signal of topSignals) {
        await this.redis.set(
          `hourly:signal:${signal.mint}`,
          JSON.stringify(signal),
          3600
        );
      }

      this.log(`💾 Cached ${topSignals.length} best signals`);
    } catch (error) {
      this.log(`Error caching signals: ${error.message}`, 'warn');
    }
  }

  async getBestSignals(limit: number = 10): Promise<HourlySignal[]> {
    try {
      // Try cache first
      const cached = await this.redis.get('hourly:best_signals');
      if (cached) {
        const signals = JSON.parse(cached);
        return signals.slice(0, limit);
      }
    } catch (error) {
      this.log(`Cache read error: ${error.message}`, 'warn');
    }

    // Fallback to database
    const supabase = getDatabaseClient().getSupabaseClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('hourly_signals')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get best signals: ${error.message}`);
    }

    return data || [];
  }

  async getSignalHistory(hours: number = 24): Promise<HourlySignal[]> {
    const supabase = getDatabaseClient().getSupabaseClient();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('hourly_signals')
      .select('*')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .order('rank', { ascending: true });

    if (error) {
      throw new Error(`Failed to get signal history: ${error.message}`);
    }

    return data || [];
  }

  getStats(): SchedulerStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  isHealthy(): boolean {
    const now = Date.now();
    const lastRunAge = this.stats.lastRunAt ? 
      now - this.stats.lastRunAt.getTime() : Infinity;
    
    // Consider healthy if we've run in the last 2 hours
    return this.isRunning && lastRunAge < 2 * 60 * 60 * 1000;
  }

  // Manual trigger for testing
  async runManualAnalysis(): Promise<HourlySignal[]> {
    this.log('🔍 Running manual analysis...');
    
    try {
      const candidates = await this.getTokenCandidates();
      const filtered = this.filterCandidates(candidates);
      const ranked = this.rankCandidates(filtered);
      const signals = await this.generateHourlySignals(ranked);
      
      this.log(`✅ Manual analysis completed: ${signals.length} signals`);
      return signals;
      
    } catch (error) {
      this.log(`Error in manual analysis: ${error.message}`, 'error');
      throw error;
    }
  }
}