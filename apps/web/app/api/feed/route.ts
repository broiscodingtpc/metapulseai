import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch real data from bot HTTP server
    try {
      const botResponse = await fetch('http://localhost:3000/feed.json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (botResponse.ok) {
        const botData = await botResponse.json();
        
        // Filter out mainstream tokens
        const mainstreamTokens = ['USDC', 'SOL', 'BONK', 'JUP', 'mSOL', 'USD Coin', 'Solana', 'Bonk', 'Jupiter', 'Marinade Staked SOL'];
        
        const filteredTokens = botData.tokens?.filter((token: any) => {
          const symbol = token.symbol?.toUpperCase();
          const name = token.name?.toUpperCase();
          return !mainstreamTokens.includes(symbol) && !mainstreamTokens.includes(name);
        }) || [];

        return NextResponse.json({
          tokens: filteredTokens,
          metas: botData.metas || {},
          generatedAt: new Date().toISOString(),
          stats: {
            totalTokens: filteredTokens.length,
            totalMetas: Object.keys(botData.metas || {}).length,
            totalMarketCap: botData.stats?.totalMarketCap || 0,
            totalVolume: botData.stats?.totalVolume || 0,
          },
          isLive: true,
          lastUpdate: new Date().toISOString()
        });
      }
    } catch (botError) {
      console.log('Bot HTTP server not available, using fallback data');
    }

    // Fallback to mock data if bot is not available
    const mockTokens = [
      {
        address: '2zh1C864kyq7rAeFZg5pqsfovMnUPRbBiexw1JxGpump',
        symbol: 'DOGWIF',
        name: 'Dogwifhat AI',
        score: 85.2,
        category: 'AI Agents',
        marketCap: 125000,
        volume: 45000,
        price: 0.000125,
        change24h: 45.7,
        liquidity: 25000,
        holders: 1250,
        transactions: 450
      },
      {
        address: 'FHFH5aEx2XomRNPtrarTEnjeQ2hJLTXqdWVJdxezpump',
        symbol: 'PLLM',
        name: 'Private LLM',
        score: 78.9,
        category: 'AI Agents',
        marketCap: 89000,
        volume: 32000,
        price: 0.000089,
        change24h: 32.1,
        liquidity: 18000,
        holders: 890,
        transactions: 320
      },
      {
        address: '2vnc3GcgMkqDKPMuwZJgivUGhTWXuq1iFt1kHWfwpump',
        symbol: 'FROG',
        name: 'Frog King',
        score: 72.3,
        category: 'Frog',
        marketCap: 156000,
        volume: 67000,
        price: 0.000156,
        change24h: 28.9,
        liquidity: 35000,
        holders: 1560,
        transactions: 670
      },
      {
        address: '3xK7GcgMkqDKPMuwZJgivUGhTWXuq1iFt1kHWfwpump',
        symbol: 'GAME',
        name: 'GameFi Token',
        score: 68.7,
        category: 'Gaming',
        marketCap: 98000,
        volume: 41000,
        price: 0.000098,
        change24h: 19.4,
        liquidity: 22000,
        holders: 980,
        transactions: 410
      },
      {
        address: '4yL8HcgMkqDKPMuwZJgivUGhTWXuq1iFt1kHWfwpump',
        symbol: 'MEME',
        name: 'Meme Coin 2024',
        score: 61.2,
        category: 'Meme',
        marketCap: 67000,
        volume: 28000,
        price: 0.000067,
        change24h: 15.6,
        liquidity: 15000,
        holders: 670,
        transactions: 280
      }
    ];

    // Generate more mock tokens with realistic data
    for (let i = 0; i < 25; i++) {
      const categories = ['AI Agents', 'Meme', 'Gaming', 'DeFi', 'NFT', 'Celebrity', 'Frog', 'Seasonal'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      mockTokens.push({
        address: `mockToken${i + 6}pump`,
        symbol: `MOCK${i + 6}`,
        name: `Mock Token ${i + 6}`,
        score: Math.floor(Math.random() * (85 - 60 + 1)) + 60, // Scores between 60-85
        category: category,
        marketCap: Math.floor(Math.random() * (200000 - 50000 + 1)) + 50000, // Market cap between 50K-200K
        volume: Math.floor(Math.random() * (80000 - 20000 + 1)) + 20000,
        price: parseFloat((Math.random() * 0.0002).toFixed(6)),
        change24h: parseFloat((Math.random() * 50).toFixed(1)),
        liquidity: Math.floor(Math.random() * (40000 - 10000 + 1)) + 10000,
        holders: Math.floor(Math.random() * (2000 - 500 + 1)) + 500,
        transactions: Math.floor(Math.random() * (1000 - 100 + 1)) + 100
      });
    }

    const mockMetas = mockTokens.reduce((acc, token) => {
      if (!acc[token.category]) {
        acc[token.category] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      acc[token.category].count++;
      acc[token.category].totalScore += token.score;
      acc[token.category].avgScore = acc[token.category].totalScore / acc[token.category].count;
      return acc;
    }, {} as Record<string, { count: number; avgScore: number; totalScore: number }>);

    const mockStats = {
      totalTokens: mockTokens.length,
      totalMetas: Object.keys(mockMetas).length,
      totalMarketCap: mockTokens.reduce((sum, t) => sum + t.marketCap, 0),
      totalVolume: mockTokens.reduce((sum, t) => sum + t.volume, 0)
    };

    return NextResponse.json({
      tokens: mockTokens,
      metas: mockMetas,
      generatedAt: new Date().toISOString(),
      stats: mockStats,
      isLive: false, // Indicate mock data
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feed data:', error);
    return NextResponse.json({ error: 'Failed to fetch feed data' }, { status: 500 });
  }
}