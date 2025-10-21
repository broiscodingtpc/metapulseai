#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - Both Services...");

// Set environment variables
process.env.NODE_ENV = 'production';
const webPort = process.env.PORT || 3000;
const botPort = process.env.BOT_PORT || 3001;

console.log(`📡 Web app will start on port ${webPort}`);
console.log(`🤖 Bot will start on port ${botPort}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

import { spawn } from 'child_process';

// Start web app first for Railway healthcheck
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

// Start bot after a short delay
let botProcess;
setTimeout(() => {
  console.log("🤖 Starting bot...");
  botProcess = spawn('node', ['dist/index.js'], {
    cwd: process.cwd() + '/apps/bot',
    stdio: 'inherit',
    env: { 
      ...process.env,
      NODE_ENV: 'production',
      BOT_PORT: botPort
    }
  });
}, 2000);

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

// Handle bot process events after it's created
setTimeout(() => {
  if (botProcess) {
    botProcess.on('error', (error) => {
      console.error('❌ Failed to start bot:', error);
      // Don't exit on bot error, just log it
      console.log('Bot failed but web app continues running');
    });

    botProcess.on('exit', (code) => {
      console.log(`Bot exited with code ${code}`);
      // Don't exit on bot exit, just log it
      console.log('Bot stopped but web app continues running');
    });
  }
}, 3000);

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (botProcess) botProcess.kill();
  webProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (botProcess) botProcess.kill();
  webProcess.kill();
  process.exit(0);
});
