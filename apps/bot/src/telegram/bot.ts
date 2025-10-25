import TelegramBot from 'node-telegram-bot-api';
import { HourlyScheduler, HourlySignal } from '../schedulers/hourly.js';
import { database, RedisClient } from '@metapulse/core';
import { DexScreenerClient } from '@metapulse/dexscreener';
import { EventEmitter } from 'events';

export interface TelegramBotConfig {
  token: string;
  groupChatId?: string;
  enableLogging?: boolean;
  maxSignalsPerBroadcast?: number;
  broadcastEnabled?: boolean;
}

export interface UserSubscription {
  user_id: number;
  username?: string;
  subscribed_at: Date;
  min_score?: number;
  max_signals?: number;
  notifications_enabled: boolean;
}

export interface BotStats {
  totalUsers: number;
  activeSubscriptions: number;
  messagesSent: number;
  commandsProcessed: number;
  broadcastsSent: number;
  uptime: number;
  startTime: Date;
  lastBroadcastAt?: Date;
}

export class MetaPulseTelegramBot extends EventEmitter {
  private bot: TelegramBot;
  private config: Required<TelegramBotConfig>;
  private hourlyScheduler: HourlyScheduler;
  private dexScreener: DexScreenerClient;
  private redis: RedisClient;
  private stats: BotStats;
  private isRunning = false;

  constructor(
    config: TelegramBotConfig,
    hourlyScheduler: HourlyScheduler,
    dexScreener: DexScreenerClient,
    redis: RedisClient
  ) {
    super();

    this.config = {
      token: config.token,
      groupChatId: config.groupChatId || '',
      enableLogging: config.enableLogging !== false,
      maxSignalsPerBroadcast: config.maxSignalsPerBroadcast || 5,
      broadcastEnabled: config.broadcastEnabled !== false
    };

    this.hourlyScheduler = hourlyScheduler;
    this.dexScreener = dexScreener;
    this.redis = redis;

    this.bot = new TelegramBot(this.config.token, { polling: false });

    this.stats = {
      totalUsers: 0,
      activeSubscriptions: 0,
      messagesSent: 0,
      commandsProcessed: 0,
      broadcastsSent: 0,
      uptime: 0,
      startTime: new Date()
    };

    this.setupCommands();
    this.setupEventHandlers();
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [TelegramBot]`;
    
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

  private setupCommands() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(msg);
    });

    // Scan command
    this.bot.onText(/\/scan(?:\s+(.+))?/, async (msg, match) => {
      await this.handleScanCommand(msg, match?.[1]);
    });

    // Trending command
    this.bot.onText(/\/trending(?:\s+(\d+))?/, async (msg, match) => {
      await this.handleTrendingCommand(msg, parseInt(match?.[1] || '5'));
    });

    // Meta command
    this.bot.onText(/\/meta(?:\s+(.+))?/, async (msg, match) => {
      await this.handleMetaCommand(msg, match?.[1]);
    });

    // Subscribe command
    this.bot.onText(/\/subscribe/, async (msg) => {
      await this.handleSubscribeCommand(msg);
    });

    // Unsubscribe command
    this.bot.onText(/\/unsubscribe/, async (msg) => {
      await this.handleUnsubscribeCommand(msg);
    });

    // Link wallet command
    this.bot.onText(/\/linkwallet(?:\s+(.+))?/, async (msg, match) => {
      await this.handleLinkWalletCommand(msg, match?.[1]);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelpCommand(msg);
    });

    // Settings command
    this.bot.onText(/\/settings/, async (msg) => {
      await this.handleSettingsCommand(msg);
    });

    // Status command (admin)
    this.bot.onText(/\/status/, async (msg) => {
      await this.handleStatusCommand(msg);
    });
  }

  private setupEventHandlers() {
    // Listen for hourly signals
    this.hourlyScheduler.on('analysisCompleted', async (data) => {
      if (data.signals && data.signals.length > 0) {
        await this.broadcastHourlySignals(data.signals);
      }
    });

    // Bot error handling
    this.bot.on('error', (error) => {
      this.log(`Bot error: ${error.message}`, 'error');
      this.emit('error', error);
    });

    this.bot.on('polling_error', (error) => {
      this.log(`Polling error: ${error.message}`, 'error');
      this.emit('pollingError', error);
    });
  }

  private async handleStartCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const username = msg.from?.username;

    this.stats.commandsProcessed++;

    const welcomeMessage = `
🚀 *Welcome to MetaPulse!*

Your AI-powered Solana token discovery bot.

*Available Commands:*
/scan [token] - Analyze a specific token
/trending [count] - Get trending tokens (default: 5)
/meta [token] - Get detailed token metadata
/subscribe - Subscribe to hourly signals
/unsubscribe - Unsubscribe from signals
/linkwallet [address] - Link your Solana wallet
/settings - Manage your preferences
/help - Show this help message

*Features:*
• 🤖 Dual AI scoring (Groq + Gemini)
• 📊 Real-time market data
• ⏰ Hourly curated signals
• 🔗 Wallet integration
• 📈 Advanced analytics

Get started with /trending to see the hottest tokens right now!
    `;

    try {
      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
      this.stats.messagesSent++;

      // Track new user
      if (userId) {
        await this.trackUser(userId, username);
      }

      this.log(`New user started: ${username || userId}`);
    } catch (error) {
      this.log(`Error sending start message: ${error.message}`, 'error');
    }
  }

  private async handleScanCommand(msg: TelegramBot.Message, tokenInput?: string) {
    const chatId = msg.chat.id;
    this.stats.commandsProcessed++;

    if (!tokenInput) {
      await this.bot.sendMessage(chatId, 
        '❌ Please provide a token address or symbol.\n\nExample: `/scan EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const processingMsg = await this.bot.sendMessage(chatId, '🔍 Analyzing token...');

    try {
      // Search for token
      const searchResult = await this.dexScreener.searchToken(tokenInput);
      
      if (searchResult.pairs.length === 0) {
        await this.bot.editMessageText(
          '❌ Token not found. Please check the address or symbol.',
          { chat_id: chatId, message_id: processingMsg.message_id }
        );
        return;
      }

      const pair = searchResult.pairs[0];
      const tokenCard = this.formatTokenCard(pair, 'scan');

      await this.bot.editMessageText(tokenCard, {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
      });

      this.stats.messagesSent++;
      this.log(`Scanned token: ${pair.baseToken.symbol}`);

    } catch (error) {
      await this.bot.editMessageText(
        '❌ Error analyzing token. Please try again later.',
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
      this.log(`Error in scan command: ${error.message}`, 'error');
    }
  }

  private async handleTrendingCommand(msg: TelegramBot.Message, count: number = 5) {
    const chatId = msg.chat.id;
    this.stats.commandsProcessed++;

    const processingMsg = await this.bot.sendMessage(chatId, '📈 Fetching trending tokens...');

    try {
      const signals = await this.hourlyScheduler.getBestSignals(Math.min(count, 10));

      if (signals.length === 0) {
        await this.bot.editMessageText(
          '📊 No trending signals available right now. Check back in a few minutes!',
          { chat_id: chatId, message_id: processingMsg.message_id }
        );
        return;
      }

      const trendingMessage = this.formatTrendingMessage(signals);

      await this.bot.editMessageText(trendingMessage, {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
      });

      this.stats.messagesSent++;
      this.log(`Sent trending tokens: ${signals.length} signals`);

    } catch (error) {
      await this.bot.editMessageText(
        '❌ Error fetching trending tokens. Please try again later.',
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
      this.log(`Error in trending command: ${error.message}`, 'error');
    }
  }

  private async handleMetaCommand(msg: TelegramBot.Message, tokenInput?: string) {
    const chatId = msg.chat.id;
    this.stats.commandsProcessed++;

    if (!tokenInput) {
      await this.bot.sendMessage(chatId, 
        '❌ Please provide a token address.\n\nExample: `/meta EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const processingMsg = await this.bot.sendMessage(chatId, '🔍 Fetching token metadata...');

    try {
      const searchResult = await this.dexScreener.searchToken(tokenInput);
      
      if (searchResult.pairs.length === 0) {
        await this.bot.editMessageText(
          '❌ Token not found. Please check the address.',
          { chat_id: chatId, message_id: processingMsg.message_id }
        );
        return;
      }

      const pair = searchResult.pairs[0];
      const metaMessage = this.formatTokenMetadata(pair);

      await this.bot.editMessageText(metaMessage, {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
      });

      this.stats.messagesSent++;
      this.log(`Sent metadata for: ${pair.baseToken.symbol}`);

    } catch (error) {
      await this.bot.editMessageText(
        '❌ Error fetching token metadata. Please try again later.',
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
      this.log(`Error in meta command: ${error.message}`, 'error');
    }
  }

  private async handleSubscribeCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const username = msg.from?.username;

    this.stats.commandsProcessed++;

    if (!userId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user.');
      return;
    }

    try {
      // Check if already subscribed
      const existing = await this.getUserSubscription(userId);
      
      if (existing) {
        await this.bot.sendMessage(chatId, 
          '✅ You are already subscribed to hourly signals!\n\nUse /settings to manage your preferences.'
        );
        return;
      }

      // Create subscription
      await this.createUserSubscription(userId, username);

      const subscribeMessage = `
🔔 *Subscription Activated!*

You will now receive hourly signals with the best token opportunities.

*What you'll get:*
• 🏆 Top-ranked tokens every hour
• 🤖 AI-powered analysis
• 📊 Key metrics and reasoning
• ⚡ Real-time alerts

*Manage your subscription:*
/settings - Customize preferences
/unsubscribe - Stop notifications

Welcome to the MetaPulse community! 🚀
      `;

      await this.bot.sendMessage(chatId, subscribeMessage, { parse_mode: 'Markdown' });
      this.stats.messagesSent++;
      this.log(`New subscription: ${username || userId}`);

    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error creating subscription. Please try again later.');
      this.log(`Error in subscribe command: ${error.message}`, 'error');
    }
  }

  private async handleUnsubscribeCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    this.stats.commandsProcessed++;

    if (!userId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user.');
      return;
    }

    try {
      const result = await this.removeUserSubscription(userId);
      
      if (result) {
        await this.bot.sendMessage(chatId, 
          '✅ Successfully unsubscribed from hourly signals.\n\nYou can resubscribe anytime with /subscribe'
        );
        this.log(`Unsubscribed user: ${userId}`);
      } else {
        await this.bot.sendMessage(chatId, '❌ You are not currently subscribed.');
      }

      this.stats.messagesSent++;

    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error processing unsubscribe. Please try again later.');
      this.log(`Error in unsubscribe command: ${error.message}`, 'error');
    }
  }

  private async handleLinkWalletCommand(msg: TelegramBot.Message, walletAddress?: string) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    this.stats.commandsProcessed++;

    if (!userId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user.');
      return;
    }

    if (!walletAddress) {
      const linkMessage = `
🔗 *Link Your Solana Wallet*

To link your wallet, send your Solana address:
\`/linkwallet YOUR_WALLET_ADDRESS\`

*Example:*
\`/linkwallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\`

*Benefits of linking:*
• 📊 Portfolio tracking
• 🎯 Personalized signals
• 💰 Performance analytics
• 🔔 Wallet-specific alerts

*Privacy:* We only store your public wallet address for analytics. No private keys required.
      `;

      await this.bot.sendMessage(chatId, linkMessage, { parse_mode: 'Markdown' });
      return;
    }

    // Validate Solana address (basic check)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      await this.bot.sendMessage(chatId, '❌ Invalid Solana wallet address format.');
      return;
    }

    try {
      await this.linkUserWallet(userId, walletAddress);

      const successMessage = `
✅ *Wallet Linked Successfully!*

Address: \`${walletAddress}\`

*New features unlocked:*
• 📊 Portfolio insights
• 🎯 Personalized recommendations
• 📈 Performance tracking

Use /settings to manage your linked wallet.
      `;

      await this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
      this.stats.messagesSent++;
      this.log(`Linked wallet for user: ${userId}`);

    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error linking wallet. Please try again later.');
      this.log(`Error in linkwallet command: ${error.message}`, 'error');
    }
  }

  private async handleHelpCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    this.stats.commandsProcessed++;

    const helpMessage = `
🤖 *MetaPulse Bot Commands*

*Token Analysis:*
/scan [token] - Analyze any token
/trending [count] - Get trending tokens
/meta [token] - Detailed token info

*Subscriptions:*
/subscribe - Get hourly signals
/unsubscribe - Stop notifications
/settings - Manage preferences

*Wallet:*
/linkwallet [address] - Link Solana wallet

*General:*
/help - Show this help
/start - Welcome message

*Examples:*
\`/scan BONK\`
\`/trending 10\`
\`/meta EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\`

Need support? Contact @metapulse_support
    `;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    this.stats.messagesSent++;
  }

  private async handleSettingsCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    this.stats.commandsProcessed++;

    if (!userId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user.');
      return;
    }

    try {
      const subscription = await this.getUserSubscription(userId);
      const wallet = await this.getUserWallet(userId);

      const settingsMessage = `
⚙️ *Your Settings*

*Subscription Status:*
${subscription ? '✅ Active' : '❌ Not subscribed'}

*Linked Wallet:*
${wallet ? `✅ \`${wallet}\`` : '❌ No wallet linked'}

*Notification Preferences:*
${subscription?.notifications_enabled ? '🔔 Enabled' : '🔕 Disabled'}

*Commands to update:*
${!subscription ? '/subscribe - Enable signals' : '/unsubscribe - Disable signals'}
${!wallet ? '/linkwallet [address] - Link wallet' : ''}

*Signal Filters:*
Min Score: ${subscription?.min_score || 60}
Max Signals: ${subscription?.max_signals || 5}
      `;

      await this.bot.sendMessage(chatId, settingsMessage, { parse_mode: 'Markdown' });
      this.stats.messagesSent++;

    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error fetching settings. Please try again later.');
      this.log(`Error in settings command: ${error.message}`, 'error');
    }
  }

  private async handleStatusCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    this.stats.commandsProcessed++;

    // Simple admin check (you might want to implement proper admin verification)
    const isAdmin = msg.from?.username === 'your_admin_username'; // Replace with actual admin check

    if (!isAdmin) {
      await this.bot.sendMessage(chatId, '❌ Admin access required.');
      return;
    }

    const stats = this.getStats();
    const schedulerStats = this.hourlyScheduler.getStats();

    const statusMessage = `
📊 *MetaPulse Bot Status*

*Bot Stats:*
👥 Total Users: ${stats.totalUsers}
🔔 Active Subscriptions: ${stats.activeSubscriptions}
📨 Messages Sent: ${stats.messagesSent}
⚡ Commands Processed: ${stats.commandsProcessed}
📡 Broadcasts Sent: ${stats.broadcastsSent}
⏱️ Uptime: ${Math.round(stats.uptime / 1000 / 60)} minutes

*Scheduler Stats:*
🔄 Total Runs: ${schedulerStats.totalRuns}
✅ Successful: ${schedulerStats.successfulRuns}
❌ Failed: ${schedulerStats.failedRuns}
🎯 Signals Generated: ${schedulerStats.signalsGenerated}
📈 Tokens Processed: ${schedulerStats.tokensProcessed}

*Health:*
Bot: ${this.isRunning ? '✅ Running' : '❌ Stopped'}
Scheduler: ${this.hourlyScheduler.isHealthy() ? '✅ Healthy' : '⚠️ Issues'}
    `;

    await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    this.stats.messagesSent++;
  }

  private formatTokenCard(pair: any, context: 'scan' | 'signal' = 'scan'): string {
    const symbol = pair.baseToken?.symbol || 'Unknown';
    const name = pair.baseToken?.name || 'Unknown Token';
    const price = parseFloat(pair.priceUsd || '0');
    const marketCap = pair.marketCap || 0;
    const volume24h = pair.volume?.h24 || 0;
    const priceChange24h = pair.priceChange?.h24 || 0;
    const liquidity = pair.liquidity?.usd || 0;

    const priceChangeEmoji = priceChange24h > 0 ? '📈' : priceChange24h < 0 ? '📉' : '➡️';
    const priceChangeText = priceChange24h > 0 ? `+${priceChange24h.toFixed(2)}%` : `${priceChange24h.toFixed(2)}%`;

    return `
🎯 *${symbol}* (${name})

💰 *Price:* $${price.toFixed(6)}
📊 *Market Cap:* $${this.formatNumber(marketCap)}
📈 *24h Volume:* $${this.formatNumber(volume24h)}
💧 *Liquidity:* $${this.formatNumber(liquidity)}
${priceChangeEmoji} *24h Change:* ${priceChangeText}

🔗 *Address:* \`${pair.baseToken?.address || 'N/A'}\`
🏪 *DEX:* ${pair.dexId || 'Unknown'}

${context === 'scan' ? '💡 Use /meta for detailed information' : ''}
    `.trim();
  }

  private formatTrendingMessage(signals: HourlySignal[]): string {
    let message = '🔥 *Trending Tokens*\n\n';

    signals.forEach((signal, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯';
      const priceChangeEmoji = signal.price_change_24h > 0 ? '📈' : signal.price_change_24h < 0 ? '📉' : '➡️';
      
      message += `${emoji} *${signal.symbol}* - Score: ${signal.score}\n`;
      message += `💰 MC: $${this.formatNumber(signal.market_cap)} | `;
      message += `📊 Vol: $${this.formatNumber(signal.volume_24h)}\n`;
      message += `${priceChangeEmoji} ${signal.price_change_24h > 0 ? '+' : ''}${signal.price_change_24h.toFixed(1)}% | `;
      message += `🎯 Conf: ${(signal.confidence * 100).toFixed(0)}%\n`;
      message += `💡 ${signal.reasoning}\n\n`;
    });

    message += '📱 Use `/scan [token]` for detailed analysis';
    return message;
  }

  private formatTokenMetadata(pair: any): string {
    const symbol = pair.baseToken?.symbol || 'Unknown';
    const name = pair.baseToken?.name || 'Unknown Token';
    const address = pair.baseToken?.address || 'N/A';
    
    return `
📋 *Token Metadata*

🏷️ *Name:* ${name}
🎯 *Symbol:* ${symbol}
🔗 *Address:* \`${address}\`

📊 *Trading Info:*
🏪 DEX: ${pair.dexId || 'Unknown'}
💱 Pair: ${pair.pairAddress || 'N/A'}
🌐 Chain: ${pair.chainId || 'Unknown'}

📈 *24h Transactions:*
🟢 Buys: ${pair.txns?.h24?.buys || 0}
🔴 Sells: ${pair.txns?.h24?.sells || 0}
📊 Total: ${(pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0)}

🔗 *Links:*
[DexScreener](${pair.url || '#'})
[Solscan](https://solscan.io/token/${address})

⚠️ *Disclaimer:* Always DYOR before investing
    `.trim();
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  private async broadcastHourlySignals(signals: HourlySignal[]) {
    if (!this.config.broadcastEnabled || !this.config.groupChatId) {
      this.log('Broadcasting disabled or no group chat configured');
      return;
    }

    try {
      const topSignals = signals.slice(0, this.config.maxSignalsPerBroadcast);
      const broadcastMessage = this.formatHourlyBroadcast(topSignals);

      await this.bot.sendMessage(this.config.groupChatId, broadcastMessage, { 
        parse_mode: 'Markdown' 
      });

      this.stats.broadcastsSent++;
      this.stats.lastBroadcastAt = new Date();
      this.log(`Broadcasted ${topSignals.length} signals to group`);

      // Send to individual subscribers
      await this.sendToSubscribers(topSignals);

    } catch (error) {
      this.log(`Error broadcasting signals: ${error.message}`, 'error');
    }
  }

  private formatHourlyBroadcast(signals: HourlySignal[]): string {
    const hour = new Date().getHours();
    const timeEmoji = hour < 6 ? '🌙' : hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌆';
    
    let message = `${timeEmoji} *MetaPulse Hourly Signals*\n\n`;
    message += `🕐 ${new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'
    })} UTC\n\n`;

    signals.forEach((signal, index) => {
      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}️⃣`;
      
      message += `${rankEmoji} *${signal.symbol}* - ${signal.score}/100\n`;
      message += `💰 $${this.formatNumber(signal.market_cap)} MC | `;
      message += `📊 $${this.formatNumber(signal.volume_24h)} Vol\n`;
      message += `🎯 ${(signal.confidence * 100).toFixed(0)}% confidence\n`;
      message += `💡 ${signal.reasoning}\n\n`;
    });

    message += '🤖 Powered by dual AI analysis\n';
    message += '📱 DM @MetaPulseBot for more commands';
    
    return message;
  }

  private async sendToSubscribers(signals: HourlySignal[]) {
    try {
      const subscribers = await this.getActiveSubscribers();
      this.log(`Sending signals to ${subscribers.length} subscribers`);

      for (const subscriber of subscribers) {
        try {
          // Filter signals based on user preferences
          const filteredSignals = signals.filter(signal => 
            signal.score >= (subscriber.min_score || 60)
          ).slice(0, subscriber.max_signals || 5);

          if (filteredSignals.length === 0) continue;

          const personalMessage = this.formatPersonalSignals(filteredSignals);
          
          await this.bot.sendMessage(subscriber.user_id, personalMessage, { 
            parse_mode: 'Markdown' 
          });

          this.stats.messagesSent++;
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          this.log(`Error sending to subscriber ${subscriber.user_id}: ${error.message}`, 'warn');
        }
      }

    } catch (error) {
      this.log(`Error sending to subscribers: ${error.message}`, 'error');
    }
  }

  private formatPersonalSignals(signals: HourlySignal[]): string {
    let message = '🎯 *Your Hourly Signals*\n\n';
    
    signals.forEach((signal, index) => {
      message += `${index + 1}. *${signal.symbol}* - ${signal.score}/100\n`;
      message += `💰 MC: $${this.formatNumber(signal.market_cap)} | `;
      message += `📊 Vol: $${this.formatNumber(signal.volume_24h)}\n`;
      message += `💡 ${signal.reasoning}\n\n`;
    });

    message += '📱 Use /scan [token] for detailed analysis\n';
    message += '⚙️ Use /settings to customize your signals';
    
    return message;
  }

  // Database operations
  private async trackUser(userId: number, username?: string) {
    try {
      const supabase = database();
      
      await supabase
        .from('users')
        .upsert({
          telegram_id: userId,
          username,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'telegram_id'
        });

      await this.updateUserStats();
    } catch (error) {
      this.log(`Error tracking user: ${error.message}`, 'error');
    }
  }

  private async createUserSubscription(userId: number, username?: string) {
    const supabase = database();
    
    await supabase
      .from('user_alerts')
      .insert({
        user_id: userId,
        alert_type: 'hourly_signals',
        is_active: true,
        min_score: 60,
        max_signals: 5,
        created_at: new Date().toISOString()
      });

    await this.trackUser(userId, username);
    await this.updateUserStats();
  }

  private async removeUserSubscription(userId: number): Promise<boolean> {
    const supabase = database();
    
    const { error } = await supabase
      .from('user_alerts')
      .delete()
      .eq('user_id', userId)
      .eq('alert_type', 'hourly_signals');

    if (!error) {
      await this.updateUserStats();
      return true;
    }
    
    return false;
  }

  private async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    const supabase = database();
    
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('alert_type', 'hourly_signals')
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      user_id: data.user_id,
      subscribed_at: new Date(data.created_at),
      min_score: data.min_score,
      max_signals: data.max_signals,
      notifications_enabled: data.is_active
    };
  }

  private async linkUserWallet(userId: number, walletAddress: string) {
    const supabase = database();
    
    await supabase
      .from('users')
      .upsert({
        telegram_id: userId,
        wallet_address: walletAddress,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
      });
  }

  private async getUserWallet(userId: number): Promise<string | null> {
    const supabase = database();
    
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('telegram_id', userId)
      .single();

    return data?.wallet_address || null;
  }

  private async getActiveSubscribers(): Promise<UserSubscription[]> {
    const supabase = database();
    
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('alert_type', 'hourly_signals')
      .eq('is_active', true);

    if (error || !data) return [];

    return data.map(item => ({
      user_id: item.user_id,
      subscribed_at: new Date(item.created_at),
      min_score: item.min_score,
      max_signals: item.max_signals,
      notifications_enabled: item.is_active
    }));
  }

  private async updateUserStats() {
    try {
      const supabase = database();
      
      const [usersResult, subscriptionsResult] = await Promise.all([
        supabase.from('users').select('telegram_id', { count: 'exact' }),
        supabase.from('user_alerts')
          .select('user_id', { count: 'exact' })
          .eq('alert_type', 'hourly_signals')
          .eq('is_active', true)
      ]);

      this.stats.totalUsers = usersResult.count || 0;
      this.stats.activeSubscriptions = subscriptionsResult.count || 0;

    } catch (error) {
      this.log(`Error updating user stats: ${error.message}`, 'error');
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Bot already running', 'warn');
      return;
    }

    this.log('🤖 Starting Telegram bot...');
    this.isRunning = true;
    this.stats.startTime = new Date();

    try {
      await this.bot.startPolling();
      await this.updateUserStats();
      
      this.log('✅ Telegram bot started successfully');
      this.emit('started');
      
    } catch (error) {
      this.isRunning = false;
      this.log(`Failed to start bot: ${error.message}`, 'error');
      this.emit('startError', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.log('Bot not running', 'warn');
      return;
    }

    this.log('🛑 Stopping Telegram bot...');
    this.isRunning = false;

    try {
      await this.bot.stopPolling();
      this.log('✅ Telegram bot stopped');
      this.emit('stopped');
      
    } catch (error) {
      this.log(`Error stopping bot: ${error.message}`, 'error');
    }
  }

  getStats(): BotStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}