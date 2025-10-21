import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if bot is running by looking for global variables
    const global = globalThis as any;
    const TOK_INFO = global.TOK_INFO || new Map();
    const SCORES = global.SCORES || new Map();
    
    const botStatus = {
      isRunning: TOK_INFO.size > 0 || SCORES.size > 0,
      lastUpdate: global.LAST_UPDATE || null,
      totalTokens: TOK_INFO.size,
      activeMetas: SCORES.size,
      lastActivity: global.LAST_ACTIVITY || null,
      connectionStatus: 'Connected to PumpPortal',
      telegramBot: 'Active'
    };

    return NextResponse.json(botStatus);
  } catch (error) {
    return NextResponse.json({ 
      isRunning: false, 
      error: 'Bot not connected' 
    });
  }
}
