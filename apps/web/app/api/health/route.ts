import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'MetaPulse AI Bot',
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
