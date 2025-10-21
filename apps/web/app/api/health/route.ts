import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to check bot status
    let botStatus = 'unknown';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const botResponse = await fetch(`http://localhost:${process.env.BOT_PORT || 3001}/api/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (botResponse.ok) {
        botStatus = 'active';
      }
    } catch (error) {
      console.log('Bot healthcheck failed:', error instanceof Error ? error.message : 'Unknown error');
      botStatus = 'inactive';
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'MetaPulse AI Bot and Web App are running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        web: 'active',
        bot: botStatus
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}