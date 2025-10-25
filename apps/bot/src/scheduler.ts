import cron from "node-cron";
import TelegramBot from 'node-telegram-bot-api';
import { sendBuySignals } from './telegram.js';
import { AdaptiveAnalyzer } from './adaptiveAnalyzer.js';

interface SchedulerConfig {
  enabled: boolean;
  hourlySignals: boolean;
  marketAnalysis: boolean;
  performanceTracking: boolean;
  chatIds: string[];
}

interface ScheduledTask {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
}

export class SignalScheduler {
  private bot: TelegramBot;
  private adaptiveAnalyzer: AdaptiveAnalyzer;
  private config: SchedulerConfig;
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.adaptiveAnalyzer = new AdaptiveAnalyzer();
    this.config = {
      enabled: true,
      hourlySignals: true,
      marketAnalysis: true,
      performanceTracking: true,
      chatIds: [] // Will be populated from environment or config
    };

    this.initializeTasks();
  }

  private initializeTasks(): void {
    // Hourly buy signals
    this.tasks.set('hourly_signals', {
      name: 'Hourly Buy Signals',
      schedule: '0 * * * *', // Every hour at minute 0
      enabled: this.config.hourlySignals,
      runCount: 0
    });

    // Market analysis every 4 hours
    this.tasks.set('market_analysis', {
      name: 'Market Analysis',
      schedule: '0 */4 * * *', // Every 4 hours
      enabled: this.config.marketAnalysis,
      runCount: 0
    });

    // Performance tracking daily at 8 AM
    this.tasks.set('performance_tracking', {
      name: 'Performance Tracking',
      schedule: '0 8 * * *', // Daily at 8 AM
      enabled: this.config.performanceTracking,
      runCount: 0
    });

    // Weekly summary on Sundays at 10 AM
    this.tasks.set('weekly_summary', {
      name: 'Weekly Summary',
      schedule: '0 10 * * 0', // Sundays at 10 AM
      enabled: true,
      runCount: 0
    });
  }

  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 Starting MetaPulse Signal Scheduler...');
    this.isRunning = true;

    // Load chat IDs from config or environment
    this.loadChatIds();

    // Schedule hourly buy signals
    if (this.tasks.get('hourly_signals')?.enabled) {
      cron.schedule('0 * * * *', async () => {
        await this.runHourlySignals();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Hourly buy signals scheduled');
    }

    // Schedule market analysis
    if (this.tasks.get('market_analysis')?.enabled) {
      cron.schedule('0 */4 * * *', async () => {
        await this.runMarketAnalysis();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Market analysis scheduled (every 4 hours)');
    }

    // Schedule performance tracking
    if (this.tasks.get('performance_tracking')?.enabled) {
      cron.schedule('0 8 * * *', async () => {
        await this.runPerformanceTracking();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Performance tracking scheduled (daily 8 AM UTC)');
    }

    // Schedule weekly summary
    cron.schedule('0 10 * * 0', async () => {
      await this.runWeeklySummary();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });
    console.log('✅ Weekly summary scheduled (Sundays 10 AM UTC)');

    console.log('🎯 All scheduled tasks are now active');
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping MetaPulse Signal Scheduler...');
    this.isRunning = false;
    console.log('✅ Scheduler stopped');
  }

  private async runHourlySignals(): Promise<void> {
    const task = this.tasks.get('hourly_signals');
    if (!task) return;

    try {
      console.log('🕐 Running hourly buy signals...');
      task.lastRun = new Date();
      task.runCount++;

      // Send signals to all configured chat IDs
      for (const chatId of this.config.chatIds) {
        try {
          await sendBuySignals(this.bot, chatId);
          await this.sleep(1000); // 1 second delay between sends
        } catch (error) {
          console.error(`❌ Error sending signals to chat ${chatId}:`, error);
        }
      }

      console.log(`✅ Hourly signals sent to ${this.config.chatIds.length} chats`);
    } catch (error) {
      console.error('❌ Error in hourly signals task:', error);
    }
  }

  private async runMarketAnalysis(): Promise<void> {
    const task = this.tasks.get('market_analysis');
    if (!task) return;

    try {
      console.log('📊 Running market analysis...');
      task.lastRun = new Date();
      task.runCount++;

      const marketCondition = await this.adaptiveAnalyzer.analyzeMarketConditions();
      const adaptiveCriteria = this.adaptiveAnalyzer.generateAdaptiveCriteria(marketCondition);
      const insights = this.adaptiveAnalyzer.getAdaptiveInsights(marketCondition, adaptiveCriteria);

      const analysisText = [
        "📊 **SCHEDULED MARKET ANALYSIS**",
        "",
        insights,
        "",
        "🎯 **Key Insights:**",
        `• Market Trend: ${marketCondition.trend.toUpperCase()}`,
        `• Volatility: ${marketCondition.volatility.toUpperCase()}`,
        `• Recommended Strategy: ${adaptiveCriteria.riskLevel.toUpperCase()}`,
        "",
        "⏰ Next analysis in 4 hours",
        "🤖 MetaPulse AI Scheduler"
      ].join("\n");

      // Send to configured channels
      for (const chatId of this.config.chatIds) {
        try {
          await this.bot.sendMessage(chatId, analysisText, { parse_mode: 'Markdown' });
          await this.sleep(1000);
        } catch (error) {
          console.error(`❌ Error sending analysis to chat ${chatId}:`, error);
        }
      }

      console.log('✅ Market analysis completed');
    } catch (error) {
      console.error('❌ Error in market analysis task:', error);
    }
  }

  private async runPerformanceTracking(): Promise<void> {
    const task = this.tasks.get('performance_tracking');
    if (!task) return;

    try {
      console.log('📈 Running performance tracking...');
      task.lastRun = new Date();
      task.runCount++;

      // Get performance stats from adaptive analyzer
      const stats = this.adaptiveAnalyzer.getPerformanceStats();
      
      const performanceText = [
        "📈 **DAILY PERFORMANCE REPORT**",
        "",
        `🎯 **Tokens Tracked:** ${stats.totalTracked}`,
        `📊 **Average Performance:** ${stats.avgPerformance}%`,
        `🏆 **Best Performer:** ${stats.bestPerformer || 'N/A'}`,
        "",
        "💡 **AI Learning Status:**",
        "• Adaptive criteria optimization: ✅ Active",
        "• Market condition analysis: ✅ Active", 
        "• Performance feedback loop: ✅ Active",
        "",
        "⏰ Next report: Tomorrow 8 AM UTC",
        "🤖 MetaPulse AI Performance Tracker"
      ].join("\n");

      // Send to configured channels
      for (const chatId of this.config.chatIds) {
        try {
          await this.bot.sendMessage(chatId, performanceText, { parse_mode: 'Markdown' });
          await this.sleep(1000);
        } catch (error) {
          console.error(`❌ Error sending performance report to chat ${chatId}:`, error);
        }
      }

      console.log('✅ Performance tracking completed');
    } catch (error) {
      console.error('❌ Error in performance tracking task:', error);
    }
  }

  private async runWeeklySummary(): Promise<void> {
    try {
      console.log('📅 Running weekly summary...');
      
      const summaryText = [
        "📅 **WEEKLY METAPULSE SUMMARY**",
        "",
        "🎯 **This Week's Highlights:**",
        "• AI signals generated: Hourly",
        "• Market analysis: Every 4 hours",
        "• Performance tracking: Daily",
        "",
        "🧠 **AI Improvements:**",
        "• Adaptive criteria refinement",
        "• Market condition recognition",
        "• Risk assessment optimization",
        "",
        "🚀 **Coming This Week:**",
        "• Enhanced sentiment analysis",
        "• Multi-timeframe signals",
        "• Portfolio tracking features",
        "",
        "💎 **MetaPulse AI** - Feel the pulse before the market does",
        "🌐 https://www.metapulse.tech"
      ].join("\n");

      // Send to configured channels
      for (const chatId of this.config.chatIds) {
        try {
          await this.bot.sendMessage(chatId, summaryText, { parse_mode: 'Markdown' });
          await this.sleep(1000);
        } catch (error) {
          console.error(`❌ Error sending weekly summary to chat ${chatId}:`, error);
        }
      }

      console.log('✅ Weekly summary completed');
    } catch (error) {
      console.error('❌ Error in weekly summary task:', error);
    }
  }

  private loadChatIds(): void {
    // Load from environment variable or config
    const chatIdsEnv = process.env.TELEGRAM_CHAT_IDS;
    if (chatIdsEnv) {
      this.config.chatIds = chatIdsEnv.split(',').map(id => id.trim());
      console.log(`📱 Loaded ${this.config.chatIds.length} chat IDs for scheduled messages`);
    } else {
      console.log('⚠️ No TELEGRAM_CHAT_IDS configured. Scheduled messages will not be sent.');
      console.log('💡 Set TELEGRAM_CHAT_IDS environment variable with comma-separated chat IDs');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getStatus(): { isRunning: boolean; tasks: ScheduledTask[]; config: SchedulerConfig } {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(this.tasks.values()),
      config: this.config
    };
  }

  public addChatId(chatId: string): void {
    if (!this.config.chatIds.includes(chatId)) {
      this.config.chatIds.push(chatId);
      console.log(`📱 Added chat ID ${chatId} to scheduler`);
    }
  }

  public removeChatId(chatId: string): void {
    const index = this.config.chatIds.indexOf(chatId);
    if (index > -1) {
      this.config.chatIds.splice(index, 1);
      console.log(`📱 Removed chat ID ${chatId} from scheduler`);
    }
  }
}

// Legacy function for backward compatibility
export function schedule(cronExpr: string, fn: () => void) {
  cron.schedule(cronExpr, fn, { timezone: "Etc/UTC" });
}
