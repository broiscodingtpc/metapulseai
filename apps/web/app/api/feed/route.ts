import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple response for healthcheck
    return NextResponse.json({
      tokens: [],
      metas: {},
      generatedAt: new Date().toISOString(),
      stats: {
        totalTokens: 0,
        totalMetas: 0,
        totalMarketCap: 0,
        totalVolume: 0,
      },
      isLive: true,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feed data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch feed data' 
    }, { status: 500 });
  }
}