#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - Railway Final...");

// Set environment variables
process.env.NODE_ENV = 'production';
const port = process.env.PORT || 3000;

console.log(`📡 Starting on port ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`📁 Working directory: ${process.cwd()}`);

// Start Next.js directly
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextProcess = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', port], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { 
    ...process.env,
    NODE_ENV: 'production',
    PORT: port
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
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
