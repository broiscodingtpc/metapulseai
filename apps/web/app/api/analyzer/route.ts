// API endpoint for token analyzer control
import { NextRequest, NextResponse } from 'next/server';
import { tokenAnalyzer } from '../../lib/tokenAnalyzer';

export async function GET(request: NextRequest) {
  try {
    const stats = tokenAnalyzer.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[API] Error getting analyzer stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, mint } = await request.json();

    switch (action) {
      case 'start':
        await tokenAnalyzer.start();
        return NextResponse.json({
          success: true,
          message: 'Token analyzer started'
        });

      case 'stop':
        await tokenAnalyzer.stop();
        return NextResponse.json({
          success: true,
          message: 'Token analyzer stopped'
        });

      case 'analyze':
        if (!mint) {
          return NextResponse.json(
            { success: false, error: 'Mint address required' },
            { status: 400 }
          );
        }
        
        const result = await tokenAnalyzer.analyzeToken(mint);
        return NextResponse.json({
          success: true,
          data: result
        });

      case 'clear-cache':
        tokenAnalyzer.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error in analyzer endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}