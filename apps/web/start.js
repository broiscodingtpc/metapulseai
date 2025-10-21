#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot...");

const port = process.env.PORT || 3000;
console.log(`📡 Starting on port ${port}`);

// Start Next.js directly
import { spawn } from 'child_process';

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
