import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check - don't depend on bot for Railway healthcheck
    return NextResponse.json({
      status: 'healthy',
      message: 'MetaPulse AI Web App is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        web: 'active',
        bot: 'starting' // Bot starts separately, don't block healthcheck
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      ready: true
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}