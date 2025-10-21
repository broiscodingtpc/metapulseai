#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - Both Services...");

// Set environment variables
process.env.NODE_ENV = 'production';
const webPort = process.env.PORT || 3000;
const botPort = process.env.BOT_PORT || 3001;

console.log(`📡 Web app will start on port ${webPort}`);
console.log(`🤖 Bot will start on port ${botPort}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

// Start bot first
import { spawn } from 'child_process';

console.log("🤖 Starting bot...");
const botProcess = spawn('node', ['dist/index.js'], {
  cwd: process.cwd() + '/apps/bot',
  stdio: 'inherit',
  env: { 
    ...process.env,
    NODE_ENV: 'production',
    BOT_PORT: botPort
  }
});

// Start web app immediately (don't wait for bot)
console.log("🌐 Starting web app...");
const webProcess = spawn('node', ['start-railway-final.js'], {
  cwd: process.cwd() + '/apps/web',
  stdio: 'inherit',
  env: { 
    ...process.env,
    NODE_ENV: 'production',
    PORT: webPort
  }
});

webProcess.on('error', (error) => {
  console.error('❌ Failed to start web app:', error);
  process.exit(1);
});

webProcess.on('exit', (code) => {
  console.log(`Web app exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

botProcess.on('error', (error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});

botProcess.on('exit', (code) => {
  console.log(`Bot exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  botProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  botProcess.kill();
  process.exit(0);
});
