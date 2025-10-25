import { NextResponse } from 'next/server';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
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
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
}

interface TokenData {
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
  dexscreenerUrl?: string;
}

function calculateRisk(pair: DexScreenerPair): 'low' | 'medium' | 'high' | 'unknown' {
  const liquidity = pair.liquidity?.usd || 0;
  const marketCap = pair.marketCap || 0;
  const age = Date.now() - (pair.pairCreatedAt || 0);
  const ageHours = age / (1000 * 60 * 60);
  
  // Risk assessment based on liquidity, market cap, and age
  if (liquidity < 10000 || marketCap < 100000 || ageHours < 1) return 'high';
  if (liquidity < 50000 || marketCap < 1000000 || ageHours < 24) return 'medium';
  return 'low';
}

function calculateSentiment(pair: DexScreenerPair): number {
  const priceChange24h = pair.priceChange?.h24 || 0;
  const volume24h = pair.volume?.h24 || 0;
  const txns24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
  
  // Simple sentiment calculation based on price action, volume, and activity
  let sentiment = 0.5; // neutral base
  
  // Price performance influence
  if (priceChange24h > 50) sentiment += 0.3;
  else if (priceChange24h > 10) sentiment += 0.2;
  else if (priceChange24h > 0) sentiment += 0.1;
  else if (priceChange24h < -50) sentiment -= 0.3;
  else if (priceChange24h < -10) sentiment -= 0.2;
  else if (priceChange24h < 0) sentiment -= 0.1;
  
  // Volume influence
  if (volume24h > 1000000) sentiment += 0.1;
  else if (volume24h > 100000) sentiment += 0.05;
  
  // Activity influence
  if (txns24h > 1000) sentiment += 0.1;
  else if (txns24h > 100) sentiment += 0.05;
  
  return Math.max(0, Math.min(1, sentiment));
}

function calculateAge(pairCreatedAt: number): string {
  const age = Date.now() - pairCreatedAt;
  const hours = Math.floor(age / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  return `${hours}h`;
}

export async function GET() {
  try {
    // Fetch trending Solana tokens from DexScreener
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/search?q=solana&rankBy=trendingScoreH24&order=desc',
      {
        headers: {
          'User-Agent': 'MetaPulse-Bot/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json([]);
    }

    // Process and enhance the data
    const tokens: TokenData[] = data.pairs
      .filter((pair: DexScreenerPair) => {
        // Filter for quality tokens
        const liquidity = pair.liquidity?.usd || 0;
        const marketCap = pair.marketCap || 0;
        const volume24h = pair.volume?.h24 || 0;
        
        return liquidity > 5000 && marketCap > 50000 && volume24h > 1000;
      })
      .slice(0, 20) // Top 20 tokens
      .map((pair: DexScreenerPair) => ({
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || 'UNK',
        price: parseFloat(pair.priceUsd || '0'),
        change24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        marketCap: pair.marketCap || 0,
        liquidity: pair.liquidity?.usd || 0,
        age: calculateAge(pair.pairCreatedAt || Date.now()),
        risk: calculateRisk(pair),
        sentiment: calculateSentiment(pair),
        socialScore: Math.random() * 100, // Placeholder for future social media integration
        dexscreenerUrl: pair.url
      }));

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    
    // Return sample data as fallback
    const sampleTokens: TokenData[] = [
      {
        name: 'PulseAI',
        symbol: 'PULSE',
        price: 0.0045,
        change24h: 125.6,
        volume24h: 850000,
        marketCap: 4500000,
        liquidity: 125000,
        age: '12h',
        risk: 'medium',
        sentiment: 0.85,
        socialScore: 92
      },
      {
        name: 'MetaBot',
        symbol: 'MBOT',
        price: 0.0032,
        change24h: 67.3,
        volume24h: 420000,
        marketCap: 2100000,
        liquidity: 85000,
        age: '8h',
        risk: 'high',
        sentiment: 0.72,
        socialScore: 78
      },
      {
        name: 'CryptoGPT',
        symbol: 'CGPT',
        price: 0.0078,
        change24h: 45.2,
        volume24h: 1200000,
        marketCap: 8900000,
        liquidity: 250000,
        age: '2d',
        risk: 'low',
        sentiment: 0.68,
        socialScore: 85
      }
    ];
    
    return NextResponse.json(sampleTokens);
  }
}