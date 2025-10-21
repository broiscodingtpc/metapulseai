#!/usr/bin/env node

console.log("🚀 Starting MetaPulse AI Bot - Both Services...");

// ES Module imports
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables
process.env.NODE_ENV = 'production';

// Railway provides PORT env var for main service
// We'll run web app on Railway's PORT and bot internally
const webPort = process.env.PORT || process.env.WEB_PORT || 3000;
const botPort = process.env.BOT_PORT || 3001;

console.log(`📁 Base directory: ${__dirname}`);
console.log(`📡 Web app will start on port ${webPort} (Railway healthcheck)`);
console.log(`🤖 Bot will run internally on port ${botPort}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

// Start web app first for Railway healthcheck
console.log("🌐 Starting web app...");
const webProcess = spawn('node', ['start-railway-final.js'], {
  cwd: join(__dirname, 'apps/web'),
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
    cwd: join(__dirname, 'apps/bot'),
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
