-- MetaPulse Database Schema Update
-- Align with prompt requirements for production-ready system

-- Update raw_events table to match prompt specification
ALTER TABLE raw_events 
  DROP COLUMN IF EXISTS event_type,
  ADD COLUMN IF NOT EXISTS signature TEXT,
  ADD COLUMN IF NOT EXISTS trader_pubkey TEXT,
  ADD COLUMN IF NOT EXISTS tx_type TEXT,
  ADD COLUMN IF NOT EXISTS initial_buy NUMERIC,
  ADD COLUMN IF NOT EXISTS sol_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS v_tokens_in_curve NUMERIC,
  ADD COLUMN IF NOT EXISTS v_sol_in_curve NUMERIC,
  ADD COLUMN IF NOT EXISTS market_cap_sol NUMERIC,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS symbol TEXT,
  ADD COLUMN IF NOT EXISTS uri TEXT,
  ADD COLUMN IF NOT EXISTS pool TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}';

-- Rename data column to payload if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'raw_events' AND column_name = 'data') THEN
    ALTER TABLE raw_events RENAME COLUMN data TO payload;
  END IF;
END $$;

-- Update market_snapshots table to match prompt specification
ALTER TABLE market_snapshots
  ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS tx_count_1h INT,
  ADD COLUMN IF NOT EXISTS age_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS unique_buyers INT,
  ADD COLUMN IF NOT EXISTS buyer_seller_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS whale_share NUMERIC,
  ADD COLUMN IF NOT EXISTS dexs_url TEXT,
  ADD COLUMN IF NOT EXISTS x_mentions_1h INT,
  ADD COLUMN IF NOT EXISTS x_engagement_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS raw JSONB;

-- Rename columns to match prompt specification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_snapshots' AND column_name = 'liquidity') THEN
    ALTER TABLE market_snapshots RENAME COLUMN liquidity TO liquidity_sol;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_snapshots' AND column_name = 'volume_24h') THEN
    ALTER TABLE market_snapshots RENAME COLUMN volume_24h TO volume_24h_sol;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_snapshots' AND column_name = 'snapshot_data') THEN
    ALTER TABLE market_snapshots RENAME COLUMN snapshot_data TO raw;
  END IF;
END $$;

-- Update scores table to match prompt specification
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS rule_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_prob_enterable NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_risk TEXT CHECK (ai_risk IN ('LOW','MEDIUM','HIGH')),
  ADD COLUMN IF NOT EXISTS ai_roi_p50 NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_roi_p90 NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS model_groq JSONB,
  ADD COLUMN IF NOT EXISTS model_gemini JSONB,
  ADD COLUMN IF NOT EXISTS model_consensus JSONB;

-- Rename columns to match prompt specification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scores' AND column_name = 'prob_enterable') THEN
    ALTER TABLE scores RENAME COLUMN prob_enterable TO ai_prob_enterable;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scores' AND column_name = 'expected_roi_p50') THEN
    ALTER TABLE scores RENAME COLUMN expected_roi_p50 TO ai_roi_p50;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scores' AND column_name = 'expected_roi_p90') THEN
    ALTER TABLE scores RENAME COLUMN expected_roi_p90 TO ai_roi_p90;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scores' AND column_name = 'confidence') THEN
    ALTER TABLE scores RENAME COLUMN confidence TO ai_confidence;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scores' AND column_name = 'risk') THEN
    ALTER TABLE scores RENAME COLUMN risk TO ai_risk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scores' AND column_name = 'model_response') THEN
    ALTER TABLE scores RENAME COLUMN model_response TO model_consensus;
  END IF;
END $$;

-- Update hourly_signals table to match prompt specification
ALTER TABLE hourly_signals
  ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS mint TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS score_id BIGINT REFERENCES scores(id),
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS summary TEXT;

-- Drop old columns that don't match prompt specification
ALTER TABLE hourly_signals
  DROP COLUMN IF EXISTS top_tokens,
  DROP COLUMN IF EXISTS top_metas,
  DROP COLUMN IF EXISTS market_summary,
  DROP COLUMN IF EXISTS published_telegram,
  DROP COLUMN IF EXISTS published_web;

-- Rename signal_time to window_end if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hourly_signals' AND column_name = 'signal_time') THEN
    ALTER TABLE hourly_signals RENAME COLUMN signal_time TO window_end;
  END IF;
END $$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_raw_events_mint_received_at ON raw_events(mint, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_mint_taken_at ON market_snapshots(mint, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_mint_scored_at ON scores(mint, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_final_score_desc ON scores(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_signals_window_end_desc ON hourly_signals(window_end DESC);

-- Update RLS policies for new structure
DROP POLICY IF EXISTS "Public read access to raw_events" ON raw_events;
DROP POLICY IF EXISTS "Public read access to market_snapshots" ON market_snapshots;
DROP POLICY IF EXISTS "Public read access to scores" ON scores;
DROP POLICY IF EXISTS "Public read access to hourly_signals" ON hourly_signals;

CREATE POLICY "Public read access to raw_events" ON raw_events FOR SELECT USING (true);
CREATE POLICY "Public read access to market_snapshots" ON market_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read access to scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public read access to hourly_signals" ON hourly_signals FOR SELECT USING (true);