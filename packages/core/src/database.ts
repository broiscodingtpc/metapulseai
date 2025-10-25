import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface RawEvent {
  id?: string;
  mint: string;
  event_type: 'tokenCreate' | 'tokenTrade' | 'migration';
  data: any;
  received_at?: string;
  processed?: boolean;
  created_at?: string;
}

export interface MarketSnapshot {
  id?: string;
  mint: string;
  price?: number;
  volume_24h?: number;
  liquidity?: number;
  holders?: number;
  lp_size?: number;
  market_cap_sol?: number;
  dex_url?: string;
  snapshot_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface TokenScore {
  id?: string;
  mint: string;
  heuristic_score?: number;
  ai_score?: number;
  final_score?: number;
  confidence?: number;
  prob_enterable?: number;
  expected_roi_p50?: number;
  expected_roi_p90?: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning?: string;
  model_response?: any;
  meta_category?: string;
  meta_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HourlySignal {
  id?: string;
  signal_time: string;
  top_tokens: any[];
  top_metas: any[];
  market_summary?: any;
  published_telegram?: boolean;
  published_web?: boolean;
  created_at?: string;
}

export interface User {
  id?: string;
  email?: string;
  wallet_pubkey?: string;
  telegram_user_id?: number;
  signed_nonce?: string;
  nonce_expires_at?: string;
  preferences?: any;
  created_at?: string;
  updated_at?: string;
}

export interface UserAlert {
  id?: string;
  user_id: string;
  alert_type: 'hourly_signal' | 'token_alert' | 'meta_alert';
  conditions: any;
  is_active?: boolean;
  telegram_enabled?: boolean;
  email_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemLog {
  id?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  type: 'api_call' | 'websocket' | 'scoring' | 'notification';
  message: string;
  metadata?: any;
  created_at?: string;
}

export class DatabaseClient {
  private supabase: SupabaseClient;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  // Raw Events
  async insertRawEvent(event: RawEvent) {
    const { data, error } = await this.supabase
      .from('raw_events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getRawEvents(limit = 100, processed?: boolean) {
    let query = this.supabase
      .from('raw_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(limit);

    if (processed !== undefined) {
      query = query.eq('processed', processed);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async markEventProcessed(id: string) {
    const { error } = await this.supabase
      .from('raw_events')
      .update({ processed: true })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Market Snapshots
  async upsertMarketSnapshot(snapshot: MarketSnapshot) {
    const { data, error } = await this.supabase
      .from('market_snapshots')
      .upsert(snapshot, { onConflict: 'mint' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMarketSnapshot(mint: string) {
    const { data, error } = await this.supabase
      .from('market_snapshots')
      .select('*')
      .eq('mint', mint)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  async getLatestMarketSnapshots(limit = 50) {
    const { data, error } = await this.supabase
      .from('market_snapshots')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Token Scores
  async upsertTokenScore(score: TokenScore) {
    const { data, error } = await this.supabase
      .from('scores')
      .upsert(score, { onConflict: 'mint' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getTokenScore(mint: string) {
    const { data, error } = await this.supabase
      .from('scores')
      .select('*')
      .eq('mint', mint)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getTopTokens(limit = 10, minScore = 0, category?: string) {
    let query = this.supabase
      .from('scores')
      .select('*')
      .gte('final_score', minScore)
      .order('final_score', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('meta_category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getTokensByCategory() {
    const { data, error } = await this.supabase
      .from('scores')
      .select('meta_category, count(*), avg(final_score)')
      .not('meta_category', 'is', null)
      .group('meta_category')
      .order('avg', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Hourly Signals
  async insertHourlySignal(signal: HourlySignal) {
    const { data, error } = await this.supabase
      .from('hourly_signals')
      .insert(signal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getLatestHourlySignal() {
    const { data, error } = await this.supabase
      .from('hourly_signals')
      .select('*')
      .order('signal_time', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getHourlySignals(limit = 24) {
    const { data, error } = await this.supabase
      .from('hourly_signals')
      .select('*')
      .order('signal_time', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Users
  async createUser(user: User) {
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserByWallet(walletPubkey: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('wallet_pubkey', walletPubkey)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserByTelegram(telegramUserId: number) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // User Alerts
  async createUserAlert(alert: UserAlert) {
    const { data, error } = await this.supabase
      .from('user_alerts')
      .insert(alert)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserAlerts(userId: string, isActive = true) {
    const { data, error } = await this.supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', isActive);
    
    if (error) throw error;
    return data;
  }

  async updateUserAlert(id: string, updates: Partial<UserAlert>) {
    const { data, error } = await this.supabase
      .from('user_alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // System Logs
  async insertLog(log: SystemLog) {
    const { data, error } = await this.supabase
      .from('logs')
      .insert(log)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getLogs(limit = 100, level?: string, type?: string) {
    let query = this.supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (level) query = query.eq('level', level);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Utility methods
  async getStats() {
    const [tokensCount, scoresCount, signalsCount, usersCount] = await Promise.all([
      this.supabase.from('raw_events').select('count', { count: 'exact' }),
      this.supabase.from('scores').select('count', { count: 'exact' }),
      this.supabase.from('hourly_signals').select('count', { count: 'exact' }),
      this.supabase.from('users').select('count', { count: 'exact' })
    ]);

    return {
      total_events: tokensCount.count || 0,
      total_scores: scoresCount.count || 0,
      total_signals: signalsCount.count || 0,
      total_users: usersCount.count || 0
    };
  }

  async cleanup(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Clean old logs
    await this.supabase
      .from('logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    // Clean old processed events
    await this.supabase
      .from('raw_events')
      .delete()
      .eq('processed', true)
      .lt('created_at', cutoffDate.toISOString());
  }
}

// Singleton instance
let dbClient: DatabaseClient | null = null;

export function createDatabaseClient(url: string, key: string): DatabaseClient {
  if (!dbClient) {
    dbClient = new DatabaseClient(url, key);
  }
  return dbClient;
}

export function getDatabaseClient(): DatabaseClient {
  if (!dbClient) {
    throw new Error('Database client not initialized. Call createDatabaseClient first.');
  }
  return dbClient;
}