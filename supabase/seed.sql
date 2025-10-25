-- MetaPulse Database Seed Data
-- Sample data for testing and development

-- Insert sample raw events
INSERT INTO raw_events (mint, event_type, data) VALUES
('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', 'tokenCreate', '{
  "mint": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  "name": "PulseAI",
  "symbol": "PULSE",
  "description": "AI-powered trading assistant for Solana",
  "image_uri": "https://example.com/pulse.png",
  "created_timestamp": 1703980800
}'),
('8HCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW3hr', 'tokenCreate', '{
  "mint": "8HCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW3hr",
  "name": "MetaBot",
  "symbol": "META",
  "description": "Automated meta detection for crypto trends",
  "image_uri": "https://example.com/meta.png",
  "created_timestamp": 1703984400
}'),
('9ICihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW4hr', 'tokenCreate', '{
  "mint": "9ICihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW4hr",
  "name": "CryptoGPT",
  "symbol": "CGPT",
  "description": "GPT-powered crypto analysis and predictions",
  "image_uri": "https://example.com/cgpt.png",
  "created_timestamp": 1703988000
}');

-- Insert sample market snapshots
INSERT INTO market_snapshots (mint, price, volume_24h, liquidity, holders, lp_size, market_cap_sol, dex_url, snapshot_data) VALUES
('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', 0.0045, 125000.50, 85000.25, 1250, 42000.75, 2500000.00, 'https://dexscreener.com/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', '{
  "priceUsd": "0.0045",
  "volume": {"h24": 125000.50},
  "liquidity": {"usd": 85000.25},
  "fdv": 2500000.00,
  "marketCap": 2500000.00
}'),
('8HCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW3hr', 0.0032, 89000.25, 65000.50, 980, 35000.25, 1800000.00, 'https://dexscreener.com/solana/8HCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW3hr', '{
  "priceUsd": "0.0032",
  "volume": {"h24": 89000.25},
  "liquidity": {"usd": 65000.50},
  "fdv": 1800000.00,
  "marketCap": 1800000.00
}'),
('9ICihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW4hr', 0.0078, 245000.75, 125000.00, 2100, 68000.50, 4200000.00, 'https://dexscreener.com/solana/9ICihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW4hr', '{
  "priceUsd": "0.0078",
  "volume": {"h24": 245000.75},
  "liquidity": {"usd": 125000.00},
  "fdv": 4200000.00,
  "marketCap": 4200000.00
}');

-- Insert sample scores
INSERT INTO scores (mint, heuristic_score, ai_score, final_score, confidence, prob_enterable, expected_roi_p50, expected_roi_p90, risk, reasoning, model_response, meta_category, meta_score) VALUES
('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', 75, 0.82, 85, 0.88, 0.75, 2.5, 8.2, 'MEDIUM', 'Strong AI narrative with good liquidity and community engagement', '{
  "prob_enterable": 0.75,
  "expected_roi_p50": 2.5,
  "expected_roi_p90": 8.2,
  "risk": "MEDIUM",
  "reasoning": "AI-powered trading tools are trending. Good liquidity and active community."
}', 'AI Agents', 82),
('8HCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW3hr', 65, 0.71, 72, 0.75, 0.68, 1.8, 5.5, 'MEDIUM', 'Meta detection narrative with moderate metrics', '{
  "prob_enterable": 0.68,
  "expected_roi_p50": 1.8,
  "expected_roi_p90": 5.5,
  "risk": "MEDIUM",
  "reasoning": "Meta detection is useful but niche. Moderate community interest."
}', 'AI Agents', 71),
('9ICihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW4hr', 88, 0.91, 92, 0.94, 0.85, 3.2, 12.5, 'LOW', 'Excellent GPT integration with strong fundamentals', '{
  "prob_enterable": 0.85,
  "expected_roi_p50": 3.2,
  "expected_roi_p90": 12.5,
  "risk": "LOW",
  "reasoning": "GPT integration is highly valuable. Strong metrics across all categories."
}', 'AI Agents', 91);

-- Insert sample hourly signal
INSERT INTO hourly_signals (signal_time, top_tokens, top_metas, market_summary, published_telegram, published_web) VALUES
(NOW() - INTERVAL '1 hour', '[
  {
    "mint": "9ICihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW4hr",
    "name": "CryptoGPT",
    "symbol": "CGPT",
    "score": 92,
    "category": "AI Agents",
    "price": 0.0078,
    "volume_24h": 245000.75,
    "market_cap": 4200000.00
  },
  {
    "mint": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    "name": "PulseAI",
    "symbol": "PULSE",
    "score": 85,
    "category": "AI Agents",
    "price": 0.0045,
    "volume_24h": 125000.50,
    "market_cap": 2500000.00
  }
]', '[
  {
    "category": "AI Agents",
    "count": 3,
    "avg_score": 82.7,
    "total_volume": 459001.50
  }
]', '{
  "total_tokens_analyzed": 3,
  "avg_score": 83.0,
  "top_category": "AI Agents",
  "market_sentiment": "Bullish",
  "total_volume": 459001.50
}', true, true);

-- Insert sample users (for testing wallet linking)
INSERT INTO users (id, wallet_pubkey, telegram_user_id, preferences) VALUES
('550e8400-e29b-41d4-a716-446655440001', '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', 123456789, '{
  "hourly_signals": true,
  "token_alerts": true,
  "risk_tolerance": "MEDIUM",
  "min_score_threshold": 70
}'),
('550e8400-e29b-41d4-a716-446655440002', '8HCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW3hr', 987654321, '{
  "hourly_signals": false,
  "token_alerts": true,
  "risk_tolerance": "LOW",
  "min_score_threshold": 80
}');

-- Insert sample user alerts
INSERT INTO user_alerts (user_id, alert_type, conditions, telegram_enabled, email_enabled) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'token_alert', '{
  "min_score": 80,
  "categories": ["AI Agents", "Gaming"],
  "max_risk": "MEDIUM"
}', true, false),
('550e8400-e29b-41d4-a716-446655440001', 'hourly_signal', '{
  "enabled": true
}', true, false),
('550e8400-e29b-41d4-a716-446655440002', 'token_alert', '{
  "min_score": 85,
  "categories": ["AI Agents"],
  "max_risk": "LOW"
}', true, false);

-- Insert sample logs
INSERT INTO logs (level, type, message, metadata) VALUES
('info', 'websocket', 'Connected to PumpPortal WebSocket', '{"endpoint": "wss://pumpportal.fun/api/data", "timestamp": "2024-01-01T12:00:00Z"}'),
('info', 'scoring', 'Token scored successfully', '{"mint": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", "score": 85, "category": "AI Agents"}'),
('warn', 'api_call', 'Gemini API rate limit approaching', '{"requests_remaining": 5, "reset_time": "2024-01-01T13:00:00Z"}'),
('info', 'notification', 'Hourly signal sent to Telegram', '{"chat_id": "-1002920631699", "tokens_count": 2, "top_category": "AI Agents"}'),
('error', 'api_call', 'DexScreener API timeout', '{"endpoint": "/latest/dex/tokens/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", "timeout": 5000}');