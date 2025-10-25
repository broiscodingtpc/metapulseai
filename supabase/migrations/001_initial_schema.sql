-- MetaPulse Database Schema
-- Initial migration with all required tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Raw events table for PumpPortal data
CREATE TABLE raw_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'tokenCreate', 'tokenTrade', 'migration'
    data JSONB NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market snapshots from DexScreener
CREATE TABLE market_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint TEXT NOT NULL,
    price DECIMAL,
    volume_24h DECIMAL,
    liquidity DECIMAL,
    holders INTEGER,
    lp_size DECIMAL,
    market_cap_sol DECIMAL,
    dex_url TEXT,
    snapshot_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token scores from AI and heuristic analysis
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint TEXT NOT NULL,
    heuristic_score INTEGER DEFAULT 0,
    ai_score DECIMAL,
    final_score INTEGER DEFAULT 0,
    confidence DECIMAL,
    prob_enterable DECIMAL,
    expected_roi_p50 DECIMAL,
    expected_roi_p90 DECIMAL,
    risk TEXT CHECK (risk IN ('LOW', 'MEDIUM', 'HIGH')),
    reasoning TEXT,
    model_response JSONB,
    meta_category TEXT,
    meta_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hourly signals for top tokens
CREATE TABLE hourly_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_time TIMESTAMP WITH TIME ZONE NOT NULL,
    top_tokens JSONB NOT NULL,
    top_metas JSONB NOT NULL,
    market_summary JSONB,
    published_telegram BOOLEAN DEFAULT FALSE,
    published_web BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table for wallet linking and preferences
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    wallet_pubkey TEXT UNIQUE,
    telegram_user_id BIGINT UNIQUE,
    signed_nonce TEXT,
    nonce_expires_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User alerts and notifications
CREATE TABLE user_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'hourly_signal', 'token_alert', 'meta_alert'
    conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    telegram_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs for monitoring and debugging
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL, -- 'info', 'warn', 'error', 'debug'
    type TEXT NOT NULL, -- 'api_call', 'websocket', 'scoring', 'notification'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_raw_events_mint ON raw_events(mint);
CREATE INDEX idx_raw_events_received_at ON raw_events(received_at);
CREATE INDEX idx_raw_events_processed ON raw_events(processed);

CREATE INDEX idx_market_snapshots_mint ON market_snapshots(mint);
CREATE INDEX idx_market_snapshots_created_at ON market_snapshots(created_at);

CREATE INDEX idx_scores_mint ON scores(mint);
CREATE INDEX idx_scores_final_score ON scores(final_score);
CREATE INDEX idx_scores_created_at ON scores(created_at);
CREATE INDEX idx_scores_meta_category ON scores(meta_category);

CREATE INDEX idx_hourly_signals_signal_time ON hourly_signals(signal_time);

CREATE INDEX idx_users_wallet_pubkey ON users(wallet_pubkey);
CREATE INDEX idx_users_telegram_user_id ON users(telegram_user_id);

CREATE INDEX idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX idx_user_alerts_is_active ON user_alerts(is_active);

CREATE INDEX idx_logs_type ON logs(type);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_market_snapshots_updated_at BEFORE UPDATE ON market_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON user_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own alerts
CREATE POLICY "Users can view own alerts" ON user_alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own alerts" ON user_alerts FOR ALL USING (user_id = auth.uid());

-- Public read access for market data (no auth required)
ALTER TABLE raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to raw_events" ON raw_events FOR SELECT USING (true);
CREATE POLICY "Public read access to market_snapshots" ON market_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read access to scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public read access to hourly_signals" ON hourly_signals FOR SELECT USING (true);

-- Service role can do everything (for bot operations)
CREATE POLICY "Service role full access to raw_events" ON raw_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to market_snapshots" ON market_snapshots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to scores" ON scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to hourly_signals" ON hourly_signals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to logs" ON logs FOR ALL USING (auth.role() = 'service_role');