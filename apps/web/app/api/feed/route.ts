import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get data from global bot variables
    const global = globalThis as any;
    const TOK_INFO = global.TOK_INFO || new Map();
    const SCORES = global.SCORES || new Map();
    const ROLLUPS = global.ROLLUPS;
    
    // Convert Map data to arrays
    const tokens = Array.from(TOK_INFO.entries()).map(([mint, info]) => ({
      mint,
      name: info.name,
      symbol: info.symbol,
      description: info.desc
    }));
    
    const scores = Array.from(SCORES.entries()).map(([mint, score]) => ({
      mint,
      ...score
    }));
    
    // Filter out mainstream tokens
    const mainstreamTokens = ['USDC', 'SOL', 'BONK', 'JUP', 'mSOL', 'USD Coin', 'Solana', 'Bonk', 'Jupiter', 'Marinade Staked SOL'];
    
    const filteredTokens = tokens.filter((token: any) => {
      const symbol = token.symbol?.toUpperCase();
      const name = token.name?.toUpperCase();
      return !mainstreamTokens.includes(symbol) && !mainstreamTokens.includes(name);
    });

    // Group metas
    const metas: any = {};
    scores.forEach((score: any) => {
      if (!metas[score.label]) {
        metas[score.label] = [];
      }
      metas[score.label].push(score);
    });

    return NextResponse.json({
      tokens: filteredTokens,
      metas,
      generatedAt: new Date().toISOString(),
      stats: {
        totalTokens: filteredTokens.length,
        totalMetas: Object.keys(metas).length,
        totalMarketCap: ROLLUPS?.totalMarketCap || 0,
        totalVolume: ROLLUPS?.totalVolume || 0,
      },
      isLive: true,
      lastUpdate: global.LAST_UPDATE || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feed data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch feed data' 
    }, { status: 500 });
  }
}