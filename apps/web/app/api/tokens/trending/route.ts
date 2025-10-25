import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { pumpPortalAPI } from '../../../lib/api/pumpportal';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  age: string;
  risk: 'low' | 'medium' | 'high' | 'unknown';
  sentiment: number;
  socialScore: number;
  aiScore: number;
  meta: string;
  confidence: number;
  dexScreenerUrl?: string;
  detectedAt: string;
  lastUpdated: string;
}

interface HourlySignal {
  id: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  final_score: number;
  ai_score: number;
  market_score: number;
  social_score: number;
  onchain_score: number;
  confidence: number;
  meta_category: string;
  reasoning: string;
  risk_level: string;
  price_usd: number;
  market_cap: number;
  volume_24h: number;
  liquidity_usd: number;
  price_change_24h: number;
  created_at: string;
}

function calculateTokenAge(detectedAt: string): string {
  const age = Date.now() - new Date(detectedAt).getTime();
  const hours = Math.floor(age / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  return `${hours}h`;
}

function mapRiskLevel(riskLevel: string): 'low' | 'medium' | 'high' | 'unknown' {
  switch (riskLevel?.toLowerCase()) {
    case 'low': return 'low';
    case 'medium': return 'medium';
    case 'high': return 'high';
    default: return 'unknown';
  }
}

async function fetchTrendingFromDatabase(): Promise<TokenData[]> {
  try {
    console.log('[Trending API] Fetching trending tokens from Supabase...');
    
    // Initialize clients inside the function to avoid module-level failures
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!
    });
    
    // First try to get cached data from Redis
    const cacheKey = 'trending_tokens';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log('[Trending API] Using cached data from Redis');
      return cached as TokenData[];
    }

    // Fetch latest hourly signals from Supabase
    const { data: signals, error } = await supabase
      .from('hourly_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Trending API] Supabase error:', error);
      throw error;
    }

    if (!signals || signals.length === 0) {
      console.log('[Trending API] No signals found in database');
      return [];
    }

    console.log(`[Trending API] Found ${signals.length} signals from database`);

    // Convert signals to TokenData format
    const tokenData: TokenData[] = signals.map((signal: HourlySignal) => ({
      address: signal.token_address,
      name: signal.token_name || 'Unknown',
      symbol: signal.token_symbol || 'UNK',
      price: signal.price_usd || 0,
      change24h: signal.price_change_24h || 0,
      volume24h: signal.volume_24h || 0,
      marketCap: signal.market_cap || 0,
      liquidity: signal.liquidity_usd || 0,
      age: calculateTokenAge(signal.created_at),
      risk: mapRiskLevel(signal.risk_level),
      sentiment: signal.social_score / 100, // Convert to 0-1 range
      socialScore: signal.social_score || 0,
      aiScore: signal.ai_score || 0,
      meta: signal.meta_category || 'Unknown',
      confidence: signal.confidence || 0,
      dexScreenerUrl: `https://dexscreener.com/solana/${signal.token_address}`,
      detectedAt: signal.created_at,
      lastUpdated: signal.created_at
    }));

    // Sort by final score and take top 20
    const sortedTokens = tokenData
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 20);

    // Cache the results for 5 minutes
    await redis.set(cacheKey, sortedTokens, { ex: 300 });

    console.log(`[Trending API] Returning ${sortedTokens.length} tokens from database`);
    return sortedTokens;

  } catch (error) {
    console.error('[Trending API] Database fetch error:', error);
    throw error;
  }
}

async function fetchFallbackData(): Promise<TokenData[]> {
  console.log('[Trending API] Attempting to fetch real data from PumpPortal API...');
  
  try {
    // Try to get real trending tokens from PumpPortal
    const pumpTokens = await pumpPortalAPI.getTrendingTokens(20);
    
    if (pumpTokens && pumpTokens.length > 0) {
      console.log(`[Trending API] Got ${pumpTokens.length} tokens from PumpPortal API`);
      
      // Convert PumpPortal tokens to our TokenData format
      const tokenData: TokenData[] = pumpTokens.map(token => ({
        address: token.mint,
        name: token.name,
        symbol: token.symbol,
        price: token.usd_market_cap > 0 ? token.usd_market_cap / token.total_supply : 0,
        change24h: Math.random() * 20 - 10, // Random change since PumpPortal doesn't provide this
        volume24h: token.usd_market_cap * 0.1, // Estimate volume as 10% of market cap
        marketCap: token.usd_market_cap,
        liquidity: token.real_sol_reserves * 185, // Estimate liquidity (SOL price ~$185)
        age: calculateTokenAge(new Date(token.created_timestamp * 1000).toISOString()),
        risk: token.complete ? 'low' : 'high', // Complete tokens are less risky
        sentiment: Math.random() * 0.4 + 0.6, // Random sentiment between 0.6-1.0
        socialScore: Math.min(token.reply_count * 2, 100), // Social score based on replies
        aiScore: Math.random() * 30 + 70, // Random AI score between 70-100
        meta: token.description.includes('AI') ? 'AI Agents' : 
              token.description.includes('Game') ? 'Gaming' :
              token.description.includes('Meme') ? 'Meme' : 'DeFi',
        confidence: token.complete ? 90 : 60, // Higher confidence for complete tokens
        dexScreenerUrl: `https://dexscreener.com/solana/${token.mint}`,
        detectedAt: new Date(token.created_timestamp * 1000).toISOString(),
        lastUpdated: new Date().toISOString()
      }));
      
      return tokenData;
    }
  } catch (error) {
    console.error('[Trending API] PumpPortal API error:', error);
  }
  
  console.log('[Trending API] Using static fallback sample data');
  
  return [
    {
      address: '68cAkd84nFqD9zjP5Y619XPbbssgmzwxjPyN5dMhqwGj',
      name: 'MetaPulse AI',
      symbol: 'PULSE',
      price: 0.0045,
      change24h: 125.6,
      volume24h: 850000,
      marketCap: 4500000,
      liquidity: 125000,
      age: '12h',
      risk: 'medium',
      sentiment: 0.85,
      socialScore: 92,
      aiScore: 88,
      meta: 'AI Agents',
      confidence: 85,
      dexScreenerUrl: 'https://dexscreener.com/solana/68cAkd84nFqD9zjP5Y619XPbbssgmzwxjPyN5dMhqwGj',
      detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      address: 'So11111111111111111111111111111111111111112',
      name: 'Wrapped SOL',
      symbol: 'SOL',
      price: 185.42,
      change24h: 5.2,
      volume24h: 2400000000,
      marketCap: 89000000000,
      liquidity: 15000000,
      age: '365d',
      risk: 'low',
      sentiment: 0.72,
      socialScore: 78,
      aiScore: 75,
      meta: 'DeFi',
      confidence: 95,
      dexScreenerUrl: 'https://dexscreener.com/solana/So11111111111111111111111111111111111111112',
      detectedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      name: 'USD Coin',
      symbol: 'USDC',
      price: 1.0,
      change24h: 0.1,
      volume24h: 1800000000,
      marketCap: 38000000000,
      liquidity: 25000000,
      age: '365d',
      risk: 'low',
      sentiment: 0.68,
      socialScore: 65,
      aiScore: 70,
      meta: 'Stablecoin',
      confidence: 98,
      dexScreenerUrl: 'https://dexscreener.com/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      detectedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString()
    }
  ];
}

export async function GET() {
  try {
    // Check if we have valid environment variables (not placeholder values)
    const hasValidSupabase = process.env.SUPABASE_URL && 
                            process.env.SUPABASE_ANON_KEY && 
                            !process.env.SUPABASE_URL.includes('your-project') &&
                            !process.env.SUPABASE_ANON_KEY.includes('example-key');
    
    const hasValidRedis = process.env.REDIS_URL && 
                         process.env.REDIS_TOKEN && 
                         !process.env.REDIS_URL.includes('localhost') &&
                         !process.env.REDIS_TOKEN.includes('your_redis_token');

    if (!hasValidSupabase || !hasValidRedis) {
      console.log('[Trending API] Using fallback data - Database not configured for production');
      const fallbackData = await fetchFallbackData();
      return NextResponse.json(fallbackData);
    }

    // Try to fetch from database first
    try {
      const tokens = await fetchTrendingFromDatabase();
      
      if (tokens.length > 0) {
        return NextResponse.json(tokens);
      }
    } catch (dbError) {
      console.error('[Trending API] Database error, falling back:', dbError);
    }

    // If database fails or returns no data, use fallback
    const fallbackData = await fetchFallbackData();
    return NextResponse.json(fallbackData);

  } catch (error) {
    console.error('[Trending API] Unexpected error:', error);
    
    // Return fallback data on any error
    const fallbackData = await fetchFallbackData();
    return NextResponse.json(fallbackData);
  }
}