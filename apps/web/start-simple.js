#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - Full System...");

// Initialize bot first
import "dotenv/config";
import { connectPumpPortal } from "../bot/src/ws.js";
import { cfg } from "../bot/src/config.js";
import { Rollups } from "../bot/src/rollups.js";
import { techScore, totalScore } from "@metapulse/core";
import { labelMeta } from "../bot/src/metas.js";
import { makeBot, setupBotCommands } from "../bot/src/telegram.js";
import { schedule } from "../bot/src/scheduler.js";
import { spawn } from 'child_process';

// Initialize bot data structures
const rollups = new Rollups();
const TOK_INFO = new Map();
const SCORES = new Map();

// Make variables globally accessible
globalThis.ROLLUPS = rollups;
globalThis.TOK_INFO = TOK_INFO;
globalThis.SCORES = SCORES;

console.log("🤖 Initializing MetaPulse AI Bot...");

// Connect to PumpPortal
connectPumpPortal(cfg.apiKey, async (msg) => {
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
    globalThis.LAST_UPDATE = new Date().toISOString();
    globalThis.LAST_ACTIVITY = new Date().toISOString();
    
    console.log(`🆕 New token: ${name} (${symbol}) - Score: ${total.toFixed(2)}`);
  }
});

// Setup Telegram bot
const bot = makeBot();
setupBotCommands(bot);

// Schedule periodic tasks
schedule();

console.log("✅ Bot initialized successfully");

// Start Next.js web app
const port = process.env.PORT || 5174;
console.log(`📡 Starting web app on port ${port}`);

const nextProcess = spawn('next', ['start', '-p', port], {
  stdio: 'inherit',
  env: { ...process.env }
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
  process.exit(code);
});
