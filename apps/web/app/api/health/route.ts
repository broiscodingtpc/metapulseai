import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'MetaPulse AI Bot and Web App are running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      web: 'active',
      bot: 'active'
    }
  });
}