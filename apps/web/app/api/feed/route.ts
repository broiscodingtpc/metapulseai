import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for now - will be replaced with real bot data later
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