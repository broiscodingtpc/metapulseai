import dotenv from 'dotenv';
import { IngestWorker } from './workers/ingest.js';
import { HourlyScheduler } from './schedulers/hourly.js';
import { MetaPulseTelegramBot } from './telegram/bot.js';
import { RedisClient } from '@metapulse/core';
import { DexScreenerClient } from '@metapulse/dexscreener';

// Load environment variables
dotenv.config();

interface BotConfig {
  // Redis
  redisUrl: string;
  
  // Supabase
  supabaseUrl: string;
  supabaseKey: string;
  
  // AI APIs
  groqApiKey: string;
  geminiApiKey: string;
  
  // Telegram
  telegramBotToken: string;
  telegramGroupChatId?: string;
  
  // PumpPortal
  pumpPortalWsUrl: string;
  
  // DexScreener
  dexScreenerApiUrl: string;
  
  // Features
  enableIngestWorker: boolean;
  enableHourlyScheduler: boolean;
  enableTelegramBot: boolean;
  enableLogging: boolean;
}

class MetaPulseBot {
  private config: BotConfig;
  private redis: RedisClient;
  private dexScreener: DexScreenerClient;
  private ingestWorker?: IngestWorker;
  private hourlyScheduler?: HourlyScheduler;
  private telegramBot?: MetaPulseTelegramBot;
  private isRunning = false;

  constructor() {
    this.config = this.loadConfig();
    this.redis = new RedisClient({ url: this.config.redisUrl });
    this.dexScreener = new DexScreenerClient({
      baseUrl: this.config.dexScreenerApiUrl,
      redis: this.redis
    });
  }

  private loadConfig(): BotConfig {
    const requiredEnvVars = [
      'REDIS_URL',
      'SUPABASE_URL', 
      'SUPABASE_ANON_KEY',
      'GROQ_API_KEY',
      'GEMINI_API_KEY',
      'TELEGRAM_BOT_TOKEN',
      'PUMPPORTAL_WS_URL'
    ];

    // Check required environment variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    return {
      redisUrl: process.env.REDIS_URL!,
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_ANON_KEY!,
      groqApiKey: process.env.GROQ_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY!,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
      telegramGroupChatId: process.env.TELEGRAM_GROUP_CHAT_ID,
      pumpPortalWsUrl: process.env.PUMPPORTAL_WS_URL!,
      dexScreenerApiUrl: process.env.DEXSCREENER_API_URL || 'https://api.dexscreener.com',
      enableIngestWorker: process.env.ENABLE_INGEST_WORKER !== 'false',
      enableHourlyScheduler: process.env.ENABLE_HOURLY_SCHEDULER !== 'false',
      enableTelegramBot: process.env.ENABLE_TELEGRAM_BOT !== 'false',
      enableLogging: process.env.ENABLE_LOGGING !== 'false'
    };
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [MetaPulseBot]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }

  private async initializeComponents() {
    this.log('🔧 Initializing components...');

    // Initialize Ingest Worker
    if (this.config.enableIngestWorker) {
      this.ingestWorker = new IngestWorker({
        pumpPortalWsUrl: this.config.pumpPortalWsUrl,
        groqApiKey: this.config.groqApiKey,
        geminiApiKey: this.config.geminiApiKey,
        enableLogging: this.config.enableLogging,
        batchSize: 10,
        batchTimeoutMs: 30000,
        maxRetries: 3,
        retryDelayMs: 5000
      }, this.dexScreener, this.redis);

      this.log('✅ Ingest Worker initialized');
    }

    // Initialize Hourly Scheduler
    if (this.config.enableHourlyScheduler) {
      this.hourlyScheduler = new HourlyScheduler({
        cronExpression: '0 * * * *', // Every hour
        enableLogging: this.config.enableLogging,
        maxTokensToProcess: 1000,
        minScoreThreshold: 50,
        maxSignalsToGenerate: 20
      }, this.redis);

      this.log('✅ Hourly Scheduler initialized');
    }

    // Initialize Telegram Bot
    if (this.config.enableTelegramBot && this.hourlyScheduler) {
      this.telegramBot = new MetaPulseTelegramBot({
        token: this.config.telegramBotToken,
        groupChatId: this.config.telegramGroupChatId,
        enableLogging: this.config.enableLogging,
        maxSignalsPerBroadcast: 5,
        broadcastEnabled: !!this.config.telegramGroupChatId
      }, this.hourlyScheduler, this.dexScreener, this.redis);

      this.log('✅ Telegram Bot initialized');
    }
  }

  private setupEventHandlers() {
    // Ingest Worker events
    if (this.ingestWorker) {
      this.ingestWorker.on('eventProcessed', (data) => {
        this.log(`Processed event: ${data.type} for ${data.tokenSymbol}`);
      });

      this.ingestWorker.on('batchProcessed', (data) => {
        this.log(`Batch processed: ${data.eventsProcessed} events, ${data.scoresGenerated} scores`);
      });

      this.ingestWorker.on('error', (error) => {
        this.log(`Ingest Worker error: ${error.message}`, 'error');
      });
    }

    // Hourly Scheduler events
    if (this.hourlyScheduler) {
      this.hourlyScheduler.on('analysisStarted', () => {
        this.log('🔍 Hourly analysis started');
      });

      this.hourlyScheduler.on('analysisCompleted', (data) => {
        this.log(`✅ Hourly analysis completed: ${data.signals?.length || 0} signals generated`);
      });

      this.hourlyScheduler.on('error', (error) => {
        this.log(`Hourly Scheduler error: ${error.message}`, 'error');
      });
    }

    // Telegram Bot events
    if (this.telegramBot) {
      this.telegramBot.on('started', () => {
        this.log('🤖 Telegram Bot started');
      });

      this.telegramBot.on('error', (error) => {
        this.log(`Telegram Bot error: ${error.message}`, 'error');
      });

      this.telegramBot.on('pollingError', (error) => {
        this.log(`Telegram polling error: ${error.message}`, 'warn');
      });
    }

    // Global error handlers
    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception: ${error.message}`, 'error');
      console.error(error.stack);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
    });

    // Graceful shutdown handlers
    process.on('SIGINT', () => {
      this.log('Received SIGINT, shutting down gracefully...');
      this.gracefulShutdown();
    });

    process.on('SIGTERM', () => {
      this.log('Received SIGTERM, shutting down gracefully...');
      this.gracefulShutdown();
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Bot already running', 'warn');
      return;
    }

    try {
      this.log('🚀 Starting MetaPulse Bot...');
      this.isRunning = true;

      // Initialize all components
      await this.initializeComponents();
      this.setupEventHandlers();

      // Start components in order
      if (this.ingestWorker) {
        await this.ingestWorker.start();
        this.log('✅ Ingest Worker started');
      }

      if (this.hourlyScheduler) {
        await this.hourlyScheduler.start();
        this.log('✅ Hourly Scheduler started');
      }

      if (this.telegramBot) {
        await this.telegramBot.start();
        this.log('✅ Telegram Bot started');
      }

      this.log('🎉 MetaPulse Bot started successfully!');
      this.printStatus();

    } catch (error) {
      this.log(`Failed to start bot: ${error.message}`, 'error');
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.log('Bot not running', 'warn');
      return;
    }

    this.log('🛑 Stopping MetaPulse Bot...');
    this.isRunning = false;

    try {
      // Stop components in reverse order
      if (this.telegramBot) {
        await this.telegramBot.stop();
        this.log('✅ Telegram Bot stopped');
      }

      if (this.hourlyScheduler) {
        await this.hourlyScheduler.stop();
        this.log('✅ Hourly Scheduler stopped');
      }

      if (this.ingestWorker) {
        await this.ingestWorker.stop();
        this.log('✅ Ingest Worker stopped');
      }

      // Close Redis connection
      await this.redis.disconnect();
      this.log('✅ Redis disconnected');

      this.log('🏁 MetaPulse Bot stopped successfully');

    } catch (error) {
      this.log(`Error during shutdown: ${error.message}`, 'error');
    }
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this.log(`Error during graceful shutdown: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  private printStatus() {
    const status = {
      'Ingest Worker': this.ingestWorker?.isHealthy() ? '✅ Running' : '❌ Stopped',
      'Hourly Scheduler': this.hourlyScheduler?.isHealthy() ? '✅ Running' : '❌ Stopped',
      'Telegram Bot': this.telegramBot?.isHealthy() ? '✅ Running' : '❌ Stopped',
      'Redis': '✅ Connected'
    };

    this.log('\n📊 Component Status:');
    Object.entries(status).forEach(([component, status]) => {
      this.log(`  ${component}: ${status}`);
    });
    this.log('');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      components: {
        ingestWorker: this.ingestWorker?.isHealthy() || false,
        hourlyScheduler: this.hourlyScheduler?.isHealthy() || false,
        telegramBot: this.telegramBot?.isHealthy() || false
      },
      stats: {
        ingestWorker: this.ingestWorker?.getStats(),
        hourlyScheduler: this.hourlyScheduler?.getStats(),
        telegramBot: this.telegramBot?.getStats()
      }
    };
  }
}

// Main execution
async function main() {
  const bot = new MetaPulseBot();

  try {
    await bot.start();
    
    // Keep the process running
    process.stdin.resume();
    
  } catch (error) {
    console.error('Failed to start MetaPulse Bot:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MetaPulseBot };
export default MetaPulseBot;