#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot on Railway...");

// Set environment variables for Railway
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;

console.log(`📡 Starting on port ${process.env.PORT}`);

// Start Next.js
import { spawn } from 'child_process';

const nextProcess = spawn('next', ['start', '-p', process.env.PORT], {
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
