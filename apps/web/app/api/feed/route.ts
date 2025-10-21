import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to get real data from global bot variables
    const global = globalThis as any;
    const TOK_INFO = global.TOK_INFO || new Map();
    const SCORES = global.SCORES || new Map();
    const ROLLUPS = global.ROLLUPS;
    
    // If we have real data, use it
    if (TOK_INFO.size > 0 || SCORES.size > 0) {
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
    }
    
    // Fallback to mock data
    const mockTokens = [
      {
        mint: '2zh1C864kyq7rAeFZg5pqsfovMnUPRbBiexw1JxGpump',
        name: 'Dogwifhat AI',
        symbol: 'DOGWIF',
        description: 'AI-powered dog token',
        score: 85.2,
        category: 'AI Agents'
      },
      {
        mint: 'FHFH5aEx2XomRNPtrarTEnjeQ2hJLTXqdWVJdxezpump',
        name: 'Private LLM',
        symbol: 'PLLM',
        description: 'Private language model token',
        score: 78.9,
        category: 'AI Agents'
      }
    ];

    const mockMetas = {
      'AI Agents': [
        { mint: '2zh1C864kyq7rAeFZg5pqsfovMnUPRbBiexw1JxGpump', score: 85.2, count: 1 },
        { mint: 'FHFH5aEx2XomRNPtrarTEnjeQ2hJLTXqdWVJdxezpump', score: 78.9, count: 1 }
      ]
    };

    return NextResponse.json({
      tokens: mockTokens,
      metas: mockMetas,
      generatedAt: new Date().toISOString(),
      stats: {
        totalTokens: mockTokens.length,
        totalMetas: Object.keys(mockMetas).length,
        totalMarketCap: 468000,
        totalVolume: 185000,
      },
      isLive: false,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feed data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch feed data' 
    }, { status: 500 });
  }
}