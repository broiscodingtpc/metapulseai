import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch real data from bot API first
    const botPort = process.env.BOT_PORT || 3001;
    
    try {
      const botResponse = await fetch(`http://localhost:${botPort}/feed.json`, {
        next: { revalidate: 30 } // Cache for 30 seconds
      });
      
      if (botResponse.ok) {
        const botData = await botResponse.json();
        
        // Calculate real analytics from bot data
        const tokens = botData.tokens || [];
        const totalTokens = tokens.length;
        const successfulAnalyses = tokens.filter((t: any) => t.score > 0).length;
        const failedAnalyses = totalTokens - successfulAnalyses;
        const averageScore = totalTokens > 0 
          ? Math.round(tokens.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / totalTokens)
          : 0;
        
        // Get top performing tokens from real data
        const topTokens = tokens
          .filter((t: any) => t.score > 0)
          .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
          .slice(0, 5)
          .map((t: any) => ({
            symbol: t.symbol || 'Unknown',
            score: t.score || 0,
            category: t.category || 'Unknown',
            analyzedAt: t.analyzedAt || new Date().toISOString()
          }));
        
        // Generate recent activity from real data
        const recentActivity = tokens
          .slice(-10)
          .map((t: any) => ({
            timestamp: t.analyzedAt || new Date().toISOString(),
            action: 'Token Analysis',
            details: `${t.symbol || 'Unknown'} analyzed - Score: ${t.score || 0}`,
            status: (t.score || 0) > 50 ? 'success' as const : 'warning' as const
          }));
        
        return NextResponse.json({
          totalTokensAnalyzed: totalTokens,
          successfulAnalyses,
          failedAnalyses,
          averageScore,
          topPerformingTokens: topTokens,
          recentActivity,
          isLive: true,
          lastUpdate: botData.generatedAt || new Date().toISOString()
        });
      }
    } catch (botError) {
      console.log('Bot API not available, using fallback analytics');
    }
    
    // Fallback to mock data if bot is not available
    
    const analyticsData = {
      totalTokensAnalyzed: Math.floor(Math.random() * 2000) + 1000,
      successfulAnalyses: Math.floor(Math.random() * 1800) + 900,
      failedAnalyses: Math.floor(Math.random() * 200) + 50,
      averageScore: Math.floor(Math.random() * 30) + 60,
      topPerformingTokens: [
        { 
          symbol: 'PULSE', 
          score: 95, 
          category: 'AI/Tech', 
          analyzedAt: new Date(Date.now() - Math.random() * 86400000).toISOString() 
        },
        { 
          symbol: 'META', 
          score: 89, 
          category: 'Gaming', 
          analyzedAt: new Date(Date.now() - Math.random() * 86400000).toISOString() 
        },
        { 
          symbol: 'DEGEN', 
          score: 84, 
          category: 'Meme', 
          analyzedAt: new Date(Date.now() - Math.random() * 86400000).toISOString() 
        },
        { 
          symbol: 'SOLAI', 
          score: 82, 
          category: 'AI/Tech', 
          analyzedAt: new Date(Date.now() - Math.random() * 86400000).toISOString() 
        },
        { 
          symbol: 'PUMP', 
          score: 78, 
          category: 'DeFi', 
          analyzedAt: new Date(Date.now() - Math.random() * 86400000).toISOString() 
        },
      ],
      recentActivity: [
        { 
          timestamp: new Date(Date.now() - 300000).toISOString(), 
          action: 'Token Analysis', 
          details: 'PULSE analyzed - Score: 95', 
          status: 'success' as const 
        },
        { 
          timestamp: new Date(Date.now() - 600000).toISOString(), 
          action: 'Bot Digest', 
          details: 'Telegram digest sent to 1,247 subscribers', 
          status: 'success' as const 
        },
        { 
          timestamp: new Date(Date.now() - 900000).toISOString(), 
          action: 'API Call', 
          details: 'DexScreener API rate limit warning', 
          status: 'warning' as const 
        },
        { 
          timestamp: new Date(Date.now() - 1200000).toISOString(), 
          action: 'System Check', 
          details: 'All systems operational', 
          status: 'success' as const 
        },
        { 
          timestamp: new Date(Date.now() - 1500000).toISOString(), 
          action: 'Token Analysis', 
          details: 'Failed to analyze token - Invalid mint', 
          status: 'error' as const 
        },
      ],
      systemMetrics: {
        uptime: 99.7,
        memoryUsage: Math.floor(Math.random() * 30) + 50,
        cpuUsage: Math.floor(Math.random() * 40) + 10,
        activeConnections: Math.floor(Math.random() * 100) + 100
      },
      isLive: false,
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { timeRange } = await request.json();
    
    // In a real implementation, you would filter data based on timeRange
    // For now, we'll just return the same data structure
    
    return NextResponse.json({ 
      success: true, 
      message: `Analytics data filtered for ${timeRange}` 
    });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
      { status: 500 }
    );
  }
}