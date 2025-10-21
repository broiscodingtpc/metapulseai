import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      isRunning: true,
      lastUpdate: new Date().toISOString(),
      totalTokens: 2,
      activeMetas: 1,
      lastActivity: new Date().toISOString(),
      connectionStatus: 'Ready for deployment',
      telegramBot: 'Ready'
    });
  } catch (error) {
    return NextResponse.json({ 
      isRunning: false, 
      error: 'Bot not connected' 
    });
  }
}
