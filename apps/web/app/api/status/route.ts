import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'MetaPulse AI Bot is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
