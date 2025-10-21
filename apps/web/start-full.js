#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - FULL SYSTEM...");

// Initialize bot data structures
const rollups = { totalMarketCap: 0, totalVolume: 0 };
const TOK_INFO = new Map();
const SCORES = new Map();

// Make variables globally accessible
globalThis.ROLLUPS = rollups;
globalThis.TOK_INFO = TOK_INFO;
globalThis.SCORES = SCORES;

console.log("🤖 Bot data structures initialized");

// Start Next.js web app
import { spawn } from 'child_process';

const port = process.env.PORT || 3000;
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
