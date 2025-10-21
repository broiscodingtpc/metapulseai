import { NextResponse } from 'next/server';

// Import bot functionality
import { connectPumpPortal } from '../../../../bot/src/ws';
import { cfg } from '../../../../bot/src/config';
import { Rollups } from '../../../../bot/src/rollups';
import { techScore, totalScore } from '@metapulse/core';
import { labelMeta } from '../../../../bot/src/metas';
import { makeBot, sendDigest, setupBotCommands } from '../../../../bot/src/telegram';
import { schedule } from '../../../../bot/src/scheduler';

// Initialize bot data structures
const rollups = new Rollups();
const TOK_INFO = new Map<string, { name?: string; symbol?: string; desc?: string }>();
const SCORES = new Map<string, { tech: number; meta: number; total: number; label: string }>();

// Make variables globally accessible
(globalThis as any).ROLLUPS = rollups;
(globalThis as any).TOK_INFO = TOK_INFO;
(globalThis as any).SCORES = SCORES;

// Initialize bot connection
let botInitialized = false;

async function initializeBot() {
  if (botInitialized) return;
  
  try {
    // Connect to PumpPortal
    await connectPumpPortal(cfg.apiKey, async (msg: any) => {
      if (msg.message) {
        console.log("📢 PumpPortal:", msg.message);
        return;
      }
      
      if (msg.errors) {
        console.log("⚠️ PumpPortal:", msg.errors);
        return;
      }

      // Handle new token data
      if (msg.type === "newToken") {
        const { mint, name, symbol, description } = msg;
        
        // Store token info
        TOK_INFO.set(mint, { name, symbol, desc: description });
        
        // Calculate technical score
        const tech = techScore(msg);
        const meta = labelMeta(name, symbol, description);
        const total = totalScore(tech, meta);
        
        // Store score
        SCORES.set(mint, { tech, meta, total, label: meta });
        
        // Update global variables
        (globalThis as any).LAST_UPDATE = new Date().toISOString();
        (globalThis as any).LAST_ACTIVITY = new Date().toISOString();
        
        console.log(`🆕 New token: ${name} (${symbol}) - Score: ${total.toFixed(2)}`);
      }
    });

    // Setup Telegram bot
    const bot = makeBot();
    setupBotCommands(bot);
    
    // Schedule periodic tasks
    schedule();
    
    botInitialized = true;
    console.log("🤖 Bot initialized successfully");
  } catch (error) {
    console.error("❌ Bot initialization failed:", error);
  }
}

export async function GET() {
  try {
    // Initialize bot if not already done
    await initializeBot();
    
    // Return bot status
    return NextResponse.json({
      status: 'running',
      initialized: botInitialized,
      totalTokens: TOK_INFO.size,
      activeMetas: SCORES.size,
      lastUpdate: (globalThis as any).LAST_UPDATE || null
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
