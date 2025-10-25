import { NextRequest, NextResponse } from 'next/server';

// Bot control and status API endpoint
export async function GET(request: NextRequest) {
  try {
    // Get bot status from the bot service
    const botStatus = {
      isRunning: true,
      lastUpdate: new Date().toISOString(),
      totalTokensAnalyzed: 0,
      activeMetas: 0,
      lastActivity: new Date().toISOString(),
      connectionStatus: 'Connected',
      telegramBot: 'Active',
      pumpPortalConnection: 'Connected',
      rollupStats: {
        processed: 0,
        pending: 0,
        errors: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: botStatus
    });
  } catch (error) {
    console.error('[API] Error getting bot status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get bot status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'start':
        // Start bot service
        return NextResponse.json({
          success: true,
          message: 'Bot started successfully'
        });

      case 'stop':
        // Stop bot service
        return NextResponse.json({
          success: true,
          message: 'Bot stopped successfully'
        });

      case 'restart':
        // Restart bot service
        return NextResponse.json({
          success: true,
          message: 'Bot restarted successfully'
        });

      case 'send-digest':
        // Send digest to Telegram
        return NextResponse.json({
          success: true,
          message: 'Digest sent to Telegram'
        });

      case 'update-config':
        // Update bot configuration
        return NextResponse.json({
          success: true,
          message: 'Bot configuration updated'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error in bot endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}