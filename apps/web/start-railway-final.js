#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - Railway Final...");

// Set environment variables
process.env.NODE_ENV = 'production';
const port = process.env.PORT || 3000;

console.log(`📡 Starting on port ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`📁 Working directory: ${process.cwd()}`);

// Check if .next directory exists
import { existsSync } from 'fs';
if (!existsSync('.next')) {
  console.error('❌ .next directory not found! Make sure to run "npm run build" first.');
  process.exit(1);
}

// Start Next.js
import { spawn } from 'child_process';

const nextProcess = spawn('node_modules/.bin/next.cmd', ['start', '-p', port], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { 
    ...process.env,
    NODE_ENV: 'production'
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
  process.exit(code);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  nextProcess.kill();
  process.exit(0);
});
