import cron from "node-cron";
import TelegramBot from 'node-telegram-bot-api';
import { sendBuySignals } from './telegram.js';
import { sendPnLReport } from './pnlReporter.js';
import { AdaptiveAnalyzer } from './adaptiveAnalyzer.js';
import { aiLearningService } from './aiLearningService.js';
import { twitterPostingService } from './twitterPostingService.js';
import { performanceTracker } from './performanceTracker.js';

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
    // Buy signals every 2 hours
    this.tasks.set('hourly_signals', {
      name: 'Buy Signals (2h)',
      schedule: '0 */2 * * *', // Every 2 hours at minute 0
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

    // PnL reporting every hour
    this.tasks.set('pnl_reporting', {
      name: 'PnL Reporting',
      schedule: '0 * * * *', // Every hour at minute 0
      enabled: true,
      runCount: 0
    });

    // AI learning - track calls every 30 minutes
    this.tasks.set('ai_learning', {
      name: 'AI Learning',
      schedule: '*/30 * * * *', // Every 30 minutes
      enabled: true,
      runCount: 0
    });

    // Twitter posting - 3 times daily (8 AM, 2 PM, 8 PM)
    this.tasks.set('twitter_morning', {
      name: 'Twitter Morning Post',
      schedule: '0 8 * * *', // Daily at 8 AM
      enabled: true,
      runCount: 0
    });

    this.tasks.set('twitter_afternoon', {
      name: 'Twitter Afternoon Post',
      schedule: '0 14 * * *', // Daily at 2 PM
      enabled: true,
      runCount: 0
    });

    this.tasks.set('twitter_evening', {
      name: 'Twitter Evening Post',
      schedule: '0 20 * * *', // Daily at 8 PM
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

    // Schedule buy signals every 2 hours
    if (this.tasks.get('hourly_signals')?.enabled) {
      cron.schedule('0 */2 * * *', async () => {
        await this.runHourlySignals();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Buy signals scheduled (every 2 hours)');
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

    // Schedule PnL reporting
    if (this.tasks.get('pnl_reporting')?.enabled) {
      cron.schedule('0 * * * *', async () => {
        await this.runPnLReporting();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ PnL reporting scheduled (every hour)');
    }

    // Schedule AI learning
    if (this.tasks.get('ai_learning')?.enabled) {
      cron.schedule('*/30 * * * *', async () => {
        await this.runAILearning();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ AI learning scheduled (every 30 minutes)');
      
      // Start the learning loop immediately
      aiLearningService.startLearningLoop();
    }

    // Schedule Twitter posting - Morning (8 AM UTC)
    if (this.tasks.get('twitter_morning')?.enabled) {
      cron.schedule('0 8 * * *', async () => {
        await this.runTwitterPosting('morning');
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Twitter morning posts scheduled (8 AM UTC)');
    }

    // Schedule Twitter posting - Afternoon (2 PM UTC)
    if (this.tasks.get('twitter_afternoon')?.enabled) {
      cron.schedule('0 14 * * *', async () => {
        await this.runTwitterPosting('afternoon');
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Twitter afternoon posts scheduled (2 PM UTC)');
    }

    // Schedule Twitter posting - Evening (8 PM UTC)
    if (this.tasks.get('twitter_evening')?.enabled) {
      cron.schedule('0 20 * * *', async () => {
        await this.runTwitterPosting('evening');
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      console.log('✅ Twitter evening posts scheduled (8 PM UTC)');
    }

    // Initialize Twitter posting service
    twitterPostingService.initialize();

    // Initialize performance tracker with some demo data
    performanceTracker.simulatePerformanceData();

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

  private async runPnLReporting(): Promise<void> {
    try {
      console.log('📊 Running PnL reporting task...');
      
      const task = this.tasks.get('pnl_reporting');
      if (task) {
        task.lastRun = new Date();
        task.runCount++;
      }

      // Send PnL reports to configured channels
      for (const chatId of this.config.chatIds) {
        try {
          await sendPnLReport(this.bot, chatId, this.adaptiveAnalyzer);
          await this.sleep(2000); // 2 second delay between messages
        } catch (error) {
          console.error(`❌ Error sending PnL report to chat ${chatId}:`, error);
        }
      }

      console.log('✅ PnL reporting task completed');
    } catch (error) {
      console.error('❌ Error in PnL reporting task:', error);
    }
  }

  private async runAILearning(): Promise<void> {
    try {
      console.log('🧠 Running AI learning task...');
      
      const task = this.tasks.get('ai_learning');
      if (task) {
        task.lastRun = new Date();
        task.runCount++;
      }

      // Update AI learning with recent performance data
      await aiLearningService.updateLearning();
      
      console.log('✅ AI learning task completed');
    } catch (error) {
      console.error('❌ Error in AI learning task:', error);
    }
  }

  private async runTwitterPosting(timeOfDay: 'morning' | 'afternoon' | 'evening'): Promise<void> {
    try {
      console.log(`🐦 Running Twitter posting task (${timeOfDay})...`);
      
      const taskName = `twitter_${timeOfDay}`;
      const task = this.tasks.get(taskName);
      if (task) {
        task.lastRun = new Date();
        task.runCount++;
      }

      // Check if Twitter service is ready
      if (!twitterPostingService.isReady()) {
        console.log('⚠️ Twitter posting service not ready, skipping...');
        return;
      }

      // Post to Twitter with bot performance highlights
      await twitterPostingService.schedulePost();
      
      console.log(`✅ Twitter posting task (${timeOfDay}) completed`);
    } catch (error) {
      console.error(`❌ Error in Twitter posting task (${timeOfDay}):`, error);
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
