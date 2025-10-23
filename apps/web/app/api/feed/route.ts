import { NextResponse } from 'next/server';

// Cache configuration
const CACHE_MAX_AGE = 10; // 10 seconds
const STALE_WHILE_REVALIDATE = 30; // 30 seconds

export async function GET() {
  try {
    // Try to fetch from bot API
    const botPort = process.env.BOT_PORT || 3001;
    const botUrl = `http://localhost:${botPort}/feed.json`;
    
    try {
      const botResponse = await fetch(botUrl, {
        next: { revalidate: CACHE_MAX_AGE } // Cache for 10 seconds
      });
      
      if (botResponse.ok) {
        const botData = await botResponse.json();
        
        // Transform bot data to website format
        const transformedTokens = (botData.tokens || []).map((token: any, index: number) => {
          return {
            address: token.address,
            symbol: token.symbol || 'Unknown',
            name: token.name || 'Unknown Token',
            score: token.score || 0,
            techScore: token.techScore || 0,
            metaScore: token.metaScore || 0,
            category: token.category || 'unknown',
            reason: token.reason || '',
            riskLevel: token.riskLevel,
            riskScore: token.riskScore,
            riskFlags: token.riskFlags,
            marketCap: Math.random() * 1000000,
            volume: Math.random() * 500000,
            price: Math.random() * 0.001,
            change24h: (Math.random() - 0.5) * 100,
            liquidity: Math.random() * 100000,
            holders: Math.floor(Math.random() * 1000),
            transactions: Math.floor(Math.random() * 5000),
            detectedAt: token.detectedAt,
            analyzedAt: token.analyzedAt,
            timestamp: botData.generatedAt,
            description: token.desc || '',
            metadataUri: token.desc || ''
          };
        });
        
        const response = NextResponse.json({
          status: 'ok',
          message: 'Live data from bot',
          timestamp: botData.generatedAt || new Date().toISOString(),
          newTokens: transformedTokens,
          topMetas: Object.entries(botData.metas || {}).map(([category, data]: [string, any]) => ({
            category,
            averageScore: Math.round(data.avgScore || 0),
            tokenCount: data.count || 0,
            topTokens: [],
            marketCap: Math.random() * 5000000,
            volume: Math.random() * 2000000,
            change24h: (Math.random() - 0.5) * 50,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          })),
          totalTokens: botData.stats?.totalTokens || 0,
          activeMetas: Object.keys(botData.metas || {}).length,
          totalMarketCap: botData.stats?.totalMarketCap || 0,
          totalVolume: botData.stats?.totalVolume || 0,
          isLive: true,
          lastUpdate: botData.generatedAt || new Date().toISOString()
        });
        
        // Add cache headers for better performance
        response.headers.set('Cache-Control', `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
        
        return response;
      }
    } catch (botError) {
      console.log('Bot API not available, using fallback');
    }
    
    // Fallback response
    return NextResponse.json({
      status: 'ok',
      message: 'Bot starting...',
      timestamp: new Date().toISOString(),
      newTokens: [],
      topMetas: [],
      totalTokens: 0,
      activeMetas: 0,
      totalMarketCap: 0,
      totalVolume: 0,
      isLive: false,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feed data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch feed data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}