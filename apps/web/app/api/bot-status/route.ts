import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if bot is running by looking for global variables
    const botStatus = {
      isRunning: typeof globalThis.TOK_INFO !== 'undefined',
      lastUpdate: globalThis.LAST_UPDATE || null,
      totalTokens: globalThis.TOK_INFO?.length || 0,
      activeMetas: globalThis.SCORES ? Object.keys(globalThis.SCORES).length : 0,
      lastActivity: globalThis.LAST_ACTIVITY || null
    };

    return NextResponse.json(botStatus);
  } catch (error) {
    return NextResponse.json({ 
      isRunning: false, 
      error: 'Bot not connected' 
    });
  }
}
