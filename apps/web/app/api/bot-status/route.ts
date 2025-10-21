import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if bot is running by looking for global variables
    const global = globalThis as any;
    const botStatus = {
      isRunning: typeof global.TOK_INFO !== 'undefined',
      lastUpdate: global.LAST_UPDATE || null,
      totalTokens: global.TOK_INFO?.length || 0,
      activeMetas: global.SCORES ? Object.keys(global.SCORES).length : 0,
      lastActivity: global.LAST_ACTIVITY || null
    };

    return NextResponse.json(botStatus);
  } catch (error) {
    return NextResponse.json({ 
      isRunning: false, 
      error: 'Bot not connected' 
    });
  }
}
