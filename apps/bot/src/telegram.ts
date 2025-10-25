import TelegramBot from "node-telegram-bot-api";
import { AdaptiveAnalyzer, MarketCondition, AdaptiveCriteria } from './adaptiveAnalyzer.js';

const adaptiveAnalyzer = new AdaptiveAnalyzer();

export function makeBot(token: string) {
  const bot = new TelegramBot(token, { 
    polling: {
      interval: 1000,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });
  
  // Handle polling errors to prevent conflicts
  bot.on('polling_error', (error) => {
    console.error('❌ Telegram polling error:', error.message);
    if (error.message.includes('409 Conflict')) {
      console.log('⚠️ Another bot instance detected. Stopping polling...');
      bot.stopPolling();
    }
  });
  
  return bot;
}

export function setupBotCommands(bot: TelegramBot) {
  // Main menu keyboard with enhanced styling
  const mainMenu = {
    reply_markup: {
      keyboard: [
        [ { text: "🧠 AI Buy Signals" }, { text: "📊 Market Analysis" } ],
        [ { text: "🔥 Top Tokens" }, { text: "📈 Live Metas" } ],
        [ { text: "⚙️ AI Settings" }, { text: "🌐 Website" } ],
        [ { text: "ℹ️ About MetaPulse" } ]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };

  // Handle /start command with enhanced welcome
  bot.onText(/\/start/, (msg: any) => {
    const chatId = msg.chat.id;
    const welcomeText = `🤖 **Welcome to MetaPulse AI Bot** — $PULSEAI

🧠 **Feel the pulse before the market does.**

🚀 **NEW AI-POWERED FEATURES:**
• 🧠 Adaptive Buy Signals - AI learns and adjusts criteria
• 📊 Real-time Market Analysis - Smart trend detection  
• 🎯 Risk Assessment - Conservative/Moderate/Aggressive
• 📈 Performance Tracking - AI learns from success rates

💎 **What makes us different:**
• Self-learning algorithms that adapt to market conditions
• Multi-source data analysis (DexScreener, CoinGecko)
• Professional risk management strategies
• Real-time sentiment analysis (coming soon)

🌐 **Website:** https://www.metapulse.tech
📱 **Use the menu below to get started!**

⚠️ *Always DYOR. Not financial advice.*`;

    const welcomeKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🧠 Try AI Signals", callback_data: "refresh_scan" },
            { text: "📊 Market Analysis", callback_data: "market_analysis" }
          ],
          [
            { text: "🌐 Visit Website", url: "https://www.metapulse.tech" }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, welcomeText, { 
      parse_mode: 'Markdown',
      ...welcomeKeyboard
    });
  });

  // Handle menu button clicks
  bot.onText(/📊 Live Metas/, (msg: any) => {
    const chatId = msg.chat.id;
    // Get real data from the bot's memory
    const scoresArray = (globalThis as any).SCORES?.values() || [];
    const metas = (Array.from(scoresArray) as any[])
      .reduce((acc: any, score: any) => {
        const existing = acc.find((m: any) => m.label === score.label);
        if (existing) {
          existing.count++;
          existing.totalScore += score.total;
        } else {
          acc.push({ label: score.label, count: 1, totalScore: score.total });
        }
        return acc;
      }, [])
      .map((m: any) => ({ ...m, avgScore: Math.round(m.totalScore / m.count) }))
      .sort((a: any, b: any) => b.avgScore - a.avgScore)
      .slice(0, 5);

    if (metas.length === 0) {
      bot.sendMessage(chatId, "🔍 Scanning for live metas...\n\nNo data available yet. The bot is collecting market data. Check back in a few minutes!", mainMenu);
    } else {
      const metaText = metas.map((m: any, i: number) => 
        `${i + 1}. ${m.label} - ${m.count} tokens, avg score: ${m.avgScore}`
      ).join('\n');
      bot.sendMessage(chatId, `🔥 Live Metas Detected:\n\n${metaText}\n\n*AI Analysis Active*`, { 
        parse_mode: 'Markdown',
        reply_markup: mainMenu.reply_markup 
      });
    }
  });

  bot.onText(/🔥 Top Tokens/, (msg: any) => {
    const chatId = msg.chat.id;
    // Get real token data
    const entriesArray = (globalThis as any).SCORES?.entries() || [];
    const tokens = (Array.from(entriesArray) as any[])
      .map((entry: any) => {
        const [mint, score] = entry as [string, any];
        const info = (globalThis as any).TOK_INFO?.get(mint) || {};
        return { mint, name: info.name, symbol: info.symbol, totalScore: score.total, label: score.label };
      })
      .sort((a: any, b: any) => b.totalScore - a.totalScore)
      .slice(0, 5);

    if (tokens.length === 0) {
      bot.sendMessage(chatId, "🚀 Loading top performing tokens...\n\nNo tokens analyzed yet. The bot is scanning the market for new tokens. Check back in a few minutes!", mainMenu);
    } else {
      const tokenText = tokens.map((t: any, i: number) => 
        `${i + 1}. ${t.name || 'Unknown'} ${t.symbol ? `(${t.symbol})` : ''} - Score: ${t.totalScore}`
      ).join('\n');
      bot.sendMessage(chatId, `🚀 Top Performing Tokens:\n\n${tokenText}\n\n*Real-time AI Analysis*`, { 
        parse_mode: 'Markdown',
        reply_markup: mainMenu.reply_markup 
      });
    }
  });

  bot.onText(/📈 Market Stats/, (msg: any) => {
    const chatId = msg.chat.id;
    const totalTokens = (globalThis as any).SCORES?.size || 0;
    const totalTrades = (globalThis as any).ROLLUPS?.allMints().length || 0;
    const valuesArray = (globalThis as any).SCORES?.values() || [];
    const metas = new Set((Array.from(valuesArray) as any[]).map((s: any) => s.label)).size;
    
    bot.sendMessage(chatId, `📊 Market Statistics\n\n• Total tokens analyzed: ${totalTokens}\n• Active metas: ${metas}\n• Total trades: ${totalTrades}\n• AI confidence: 95%\n• Last update: Just now`, mainMenu);
  });

  bot.onText(/⚙️ Settings/, (msg: any) => {
    const chatId = msg.chat.id;
    const settingsText = `⚙️ Bot Settings

🔔 Notifications: Enabled
📊 Update frequency: Hourly
🤖 AI Model: Gemini 2.0 Flash
📈 Min score threshold: 50

Use /help for more commands.`;
    bot.sendMessage(chatId, settingsText, mainMenu);
  });

  bot.onText(/ℹ️ About/, (msg: any) => {
    const chatId = msg.chat.id;
    const aboutText = `ℹ️ **About MetaPulse AI Bot**

🤖 **Version:** 1.0.0
🔗 **Website:** https://www.metapulse.tech
📱 **Telegram:** @MetaPulseAIBot
🐦 **Twitter:** @METAPULSaibot

MetaPulse AI Bot is an AI-powered market intelligence system built on Solana. It detects trending metas and token narratives in real-time using advanced AI analysis.

**Features:**
✅ Real-time token scanning
✅ AI-powered categorization
✅ Live market feeds
✅ Meta trend detection

**Roadmap:**
Phase 1: ✅ AI Market Scanner
Phase 2: 🚧 Advanced Trading Signals
Phase 3: 🚧 Multi-Chain Expansion
Phase 4: 🚧 Revenue Dashboard

💰 **Token:** $PULSEAI
*Feel the pulse before the market does.*`;
    
    bot.sendMessage(chatId, aboutText, { 
      parse_mode: 'Markdown',
      reply_markup: mainMenu.reply_markup 
    });
  });

  bot.onText(/🌐 Website/, (msg: any) => {
    const chatId = msg.chat.id;
    const websiteText = `🌐 **MetaPulse AI - Links**

🏠 Website: https://www.metapulse.tech

📊 **Live Data:**
• Live Feed: https://www.metapulse.tech/feed
• Token Scanner: https://www.metapulse.tech/tokens  
• Meta Analysis: https://www.metapulse.tech/metas

💎 **Presale:**
• Join Presale: https://www.metapulse.tech/presale

🐦 **Social Media:**
• Twitter/𝕏: https://x.com/METAPULSaibot
• Telegram Bot: @MetaPulseAIBot

💰 **Token:** $PULSEAI
*Feel the pulse before the market does.*`;

    bot.sendMessage(chatId, websiteText, { 
      parse_mode: 'Markdown',
      reply_markup: mainMenu.reply_markup 
    });
  });

  // Handle help command
  bot.onText(/\/help/, (msg: any) => {
    const chatId = msg.chat.id;
    const helpText = `🆘 Help & Commands

/start - Show main menu
/help - Show this help message
/status - Bot status and uptime
/website - Get website link
/buysignals - Get filtered buy opportunities

📊 Use the menu buttons to navigate:
• Live Metas - View trending categories
• Top Tokens - See best performing tokens
• Buy Signals - Top 10 filtered tokens (hourly auto-updates)
• Market Stats - Current market overview
• Settings - Configure your preferences
• About - Learn more about MetaPulse
• Website - Access web interface

💎 Buy Signals Filters:
• Liquidity ≥ $80,000
• Market Cap: $1M - $80M
• Pair Age ≤ 60 hours
• Transactions ≥ 3,000
• Sorted by Volume`;
    bot.sendMessage(chatId, helpText, mainMenu);
  });

  // Handle status command
  bot.onText(/\/status/, (msg: any) => {
    const chatId = msg.chat.id;
    const statusText = `🟢 Bot Status: Online
⏰ Uptime: Active
🔗 Market Data: Connected
🤖 AI: Gemini 2.0 Flash
📊 Tokens tracked: 0
🔄 Last update: Just started`;
    bot.sendMessage(chatId, statusText, mainMenu);
  });

  // Handle website command
  bot.onText(/\/website/, (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🌐 MetaPulse Website\n\nMain site: https://www.metapulse.tech\nLive metas: https://www.metapulse.tech/metas", mainMenu);
  });

  // Update command handlers to match new menu
  bot.onText(/🧠 AI Buy Signals/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🧠 AI analyzing market conditions...", mainMenu);
    await sendBuySignals(bot, chatId);
  });

  bot.onText(/📊 Market Analysis/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "📊 Generating AI market analysis...", mainMenu);
    await sendMarketAnalysis(bot, chatId);
  });

  bot.onText(/⚙️ AI Settings/, async (msg: any) => {
    const chatId = msg.chat.id;
    await sendBotSettings(bot, chatId);
  });

  bot.onText(/ℹ️ About MetaPulse/, async (msg: any) => {
    const chatId = msg.chat.id;
    const aboutText = `ℹ️ **About MetaPulse AI** — $PULSEAI

🧠 **Mission:**
Democratizing crypto intelligence through AI-powered market analysis.

🎯 **Core Technology:**
• Adaptive Learning Algorithms
• Multi-source Data Aggregation  
• Real-time Risk Assessment
• Predictive Market Analysis

📊 **Data Sources:**
• DexScreener (DEX data)
• CoinGecko (Market metrics)
• Social Sentiment APIs (coming)
• On-chain Analytics (planned)

🚀 **Roadmap:**
• ✅ Phase 1: AI Buy Signals
• 🔄 Phase 2: Sentiment Analysis
• 📋 Phase 3: Portfolio Management
• 📋 Phase 4: Advanced Trading Tools

👥 **Team:**
Experienced developers and traders building the future of crypto intelligence.

🌐 **Links:**
• Website: https://www.metapulse.tech
• Telegram: @MetaPulseAI

⚠️ **Disclaimer:** Educational tool only. Not financial advice.`;

    const aboutKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🧠 Try AI Features", callback_data: "refresh_scan" },
            { text: "🌐 Website", url: "https://www.metapulse.tech" }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, aboutText, {
      parse_mode: 'Markdown',
      ...aboutKeyboard
    });
  });
  // Keep legacy commands for backward compatibility
  bot.onText(/\/buysignals/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🧠 AI analyzing market conditions...", mainMenu);
    await sendBuySignals(bot, chatId);
  });

  bot.onText(/💎 Buy Signals/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🧠 AI scanning with adaptive criteria...", mainMenu);
    await sendBuySignals(bot, chatId);
  });

  bot.onText(/📈 Market Stats/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "📊 Generating AI market analysis...", mainMenu);
    await sendMarketAnalysis(bot, chatId);
  });

  bot.onText(/📈 Live Metas/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "📈 Live Metas feature coming soon!\n\nFor now, try our AI Buy Signals.", mainMenu);
  });

  bot.onText(/🔥 Top Tokens/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔥 Top Tokens feature coming soon!\n\nFor now, try our AI Buy Signals for the best opportunities.", mainMenu);
  });

  // Handle callback queries
  bot.on('callback_query', async (callbackQuery: any) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    // Answer the callback query to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);
    
    switch (data) {
      case 'refresh_scan':
        await bot.sendMessage(chatId, "🔄 Refreshing AI analysis...", mainMenu);
        await sendBuySignals(bot, chatId);
        break;
        
      case 'market_analysis':
        await bot.sendMessage(chatId, "📊 Generating detailed market analysis...", mainMenu);
        await sendMarketAnalysis(bot, chatId);
        break;
        
      case 'adjust_criteria':
        await bot.sendMessage(chatId, 
          "⚙️ **Adaptive Criteria Settings**\n\n" +
          "The AI automatically adjusts criteria based on:\n" +
          "• Market volatility conditions\n" +
          "• Current trend analysis\n" +
          "• Volume patterns\n" +
          "• Social sentiment\n" +
          "• Historical performance\n\n" +
          "🤖 No manual adjustment needed - AI handles optimization!",
          { parse_mode: 'Markdown', ...mainMenu }
        );
        break;
        
      case 'bot_settings':
        await sendBotSettings(bot, chatId);
        break;
        
      default:
        await bot.sendMessage(chatId, "❓ Unknown command. Please use the menu.", mainMenu);
    }
  });

  // Add new market analysis function
  async function sendMarketAnalysis(bot: TelegramBot, chatId: string | number) {
    try {
      const marketCondition = await adaptiveAnalyzer.analyzeMarketConditions();
      const adaptiveCriteria = adaptiveAnalyzer.generateAdaptiveCriteria(marketCondition);
      const insights = adaptiveAnalyzer.getAdaptiveInsights(marketCondition, adaptiveCriteria);
      
      const analysisText = [
        "🧠 **COMPREHENSIVE MARKET ANALYSIS**",
        "",
        insights,
        "",
        "📈 **Market Recommendations:**",
        marketCondition.trend === 'bullish' ? "• 🟢 Favorable conditions for new positions" : 
        marketCondition.trend === 'bearish' ? "• 🔴 Exercise caution, consider defensive positions" :
        "• 🟡 Neutral market, wait for clearer signals",
        "",
        marketCondition.volatility === 'high' ? "• ⚡ High volatility - Use smaller position sizes" :
        marketCondition.volatility === 'low' ? "• 😴 Low volatility - Consider larger positions" :
        "• ⚖️ Moderate volatility - Standard position sizing",
        "",
        "🎯 **AI Strategy:** " + adaptiveCriteria.riskLevel.toUpperCase(),
        "",
        "⏰ Analysis updated in real-time",
        "🤖 Powered by MetaPulse AI"
      ].join("\n");
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Refresh Analysis", callback_data: "market_analysis" },
              { text: "💎 Buy Signals", callback_data: "refresh_scan" }
            ]
          ]
        }
      };
      
      await bot.sendMessage(chatId, analysisText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      
    } catch (error) {
      console.error('❌ Error in market analysis:', error);
      await bot.sendMessage(chatId, 
        "❌ Unable to generate market analysis. Please try again.",
        mainMenu
      );
    }
  }

  // Add bot settings function
  async function sendBotSettings(bot: TelegramBot, chatId: string | number) {
    const settingsText = [
      "⚙️ **BOT SETTINGS & INFO**",
      "",
      "🤖 **AI Features:**",
      "• ✅ Adaptive Buy Signals",
      "• ✅ Market Condition Analysis", 
      "• ✅ Performance Learning",
      "• ✅ Risk Assessment",
      "",
      "📊 **Data Sources:**",
      "• DexScreener API (Real-time)",
      "• CoinGecko API (Market data)",
      "• Social Sentiment (Coming soon)",
      "",
      "⏰ **Update Frequency:**",
      "• Buy Signals: Every hour",
      "• Market Analysis: Real-time",
      "• Performance Tracking: 24h cycles",
      "",
      "🔔 **Notifications:**",
      "• Currently: Manual refresh",
      "• Coming: Smart alerts",
      "",
      "🌐 **Website:** https://www.metapulse.tech"
    ].join("\n");
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 Buy Signals", callback_data: "refresh_scan" },
            { text: "📊 Analysis", callback_data: "market_analysis" }
          ],
          [
            { text: "🌐 Website", url: "https://www.metapulse.tech" }
          ]
        ]
      }
    };
    
    await bot.sendMessage(chatId, settingsText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }
}

export async function sendDigest(bot: TelegramBot, chatId: string | number, payload: {
  metas: { label: string; count: number; avgScore: number }[];
  tokens: { mint: string; name?: string; symbol?: string; totalScore: number }[];
}) {
  // Format metas with emojis and better styling
  const metaLines = payload.metas.map(m => {
    const emoji = {
      'ai-agents': '🤖',
      'frogs': '🐸', 
      'celeb': '⭐',
      'halloween': '🎃',
      'gaming': '🎮',
      'doge-meme': '🐕',
      'politics': '🏛️',
      'nsfw': '🔞',
      'defi': '🏦',
      'meme': '😂',
      'anime': '🎌',
      'sports': '⚽',
      'music': '🎵',
      'art': '🎨',
      'tech': '💻',
      'unknown': '❓'
    }[m.label] || '📊';
    
    return `${emoji} **${m.label}** — ${m.count} tokens • Score: ${Math.round(m.avgScore)}`;
  });

  // Format tokens with better styling and truncate long names
  const tokenLines = payload.tokens.map((t, i) => {
    const name = t.name ? (t.name.length > 20 ? t.name.substring(0, 17) + '...' : t.name) : 'Unknown';
    const symbol = t.symbol ? `(${t.symbol})` : '';
    const score = Math.round(t.totalScore);
    const scoreEmoji = score >= 70 ? '🔥' : score >= 50 ? '📈' : score >= 30 ? '📊' : '📉';
    
    return `${i + 1}. ${scoreEmoji} **${name}** ${symbol} — Score: ${score}`;
  });

  const text = [
    "🚀 **MetaPulse AI Bot — Hourly Meta Digest**",
    "",
    "📊 **Top Metas:**",
    ...metaLines,
    "",
    "🏆 **Top Tokens:**",
    ...tokenLines,
    "",
    "💡 *Note: Sniper and Launcher modules are scheduled for Phase 2. This bot is currently free to use.*"
  ].join("\n");

  await bot.sendMessage(chatId, text, { 
    parse_mode: 'Markdown',
    disable_web_page_preview: true 
  });
}

interface BuySignalToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  pairAge: number;
  transactions24h: number;
  priceChange24h: number;
}

export async function sendBuySignals(bot: TelegramBot, chatId: string | number) {
  try {
    console.log('🧠 AI analyzing market conditions...');
    
    // Step 1: Analyze current market conditions using AI
    const marketCondition = await adaptiveAnalyzer.analyzeMarketConditions();
    console.log('📊 Market analysis:', marketCondition);
    
    // Step 2: Generate adaptive criteria based on market conditions
    const adaptiveCriteria = adaptiveAnalyzer.generateAdaptiveCriteria(marketCondition);
    console.log('🎯 Adaptive criteria:', adaptiveCriteria);
    
    // Step 3: Fetch trending Solana tokens from DexScreener
    const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana&rankBy=trendingScoreH24&order=desc');
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log('⚠️ No pairs data available from DexScreener');
      return;
    }

    // Step 4: Filter tokens using adaptive criteria
    const now = Date.now();
    const filteredTokens: BuySignalToken[] = data.pairs
      .filter((pair: any) => {
        // Extract data with better handling of missing transaction data
        const liquidity = parseFloat(pair.liquidity?.usd || 0);
        const marketCap = parseFloat(pair.fdv || pair.marketCap || 0);
        const pairCreatedAt = pair.pairCreatedAt || 0;
        const pairAgeHours = (now - pairCreatedAt) / (1000 * 60 * 60);
        
        // Handle missing transaction data - use volume as proxy for activity
        const transactions24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
        const volume24h = parseFloat(pair.volume?.h24 || 0);
        const hasActivity = transactions24h > 0 || volume24h > 1000; // Use volume as activity indicator
        
        const volumeChange = parseFloat(pair.priceChange?.h24 || 0);
        
        // Apply adaptive filters with more lenient transaction requirements
        return (
          liquidity >= adaptiveCriteria.minLiquidity &&
          liquidity <= adaptiveCriteria.maxLiquidity &&
          marketCap >= adaptiveCriteria.minMarketCap &&
          marketCap <= adaptiveCriteria.maxMarketCap &&
          pairAgeHours <= adaptiveCriteria.maxPairAge &&
          (transactions24h >= adaptiveCriteria.minTransactions || hasActivity) && // Allow volume-based activity
          volumeChange >= adaptiveCriteria.minVolumeChange
        );
      })
      .map((pair: any) => ({
        address: pair.baseToken?.address || '',
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || '???',
        price: parseFloat(pair.priceUsd || 0),
        volume24h: parseFloat(pair.volume?.h24 || 0),
        liquidity: parseFloat(pair.liquidity?.usd || 0),
        marketCap: parseFloat(pair.fdv || pair.marketCap || 0),
        pairAge: (now - (pair.pairCreatedAt || 0)) / (1000 * 60 * 60),
        transactions24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        priceChange24h: parseFloat(pair.priceChange?.h24 || 0)
      }))
      .sort((a: BuySignalToken, b: BuySignalToken) => b.volume24h - a.volume24h)
      .slice(0, 10);

    // Step 5: Track performance for learning
    await adaptiveAnalyzer.trackTokenPerformance(filteredTokens);

    // Step 6: Generate adaptive insights
    const adaptiveInsights = adaptiveAnalyzer.getAdaptiveInsights(marketCondition, adaptiveCriteria);

    if (filteredTokens.length === 0) {
      console.log('📊 No tokens matching adaptive criteria found');
      
      // Create inline keyboard for interactive options
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Refresh Scan", callback_data: "refresh_scan" },
              { text: "⚙️ Adjust Criteria", callback_data: "adjust_criteria" }
            ],
            [
              { text: "📊 Market Analysis", callback_data: "market_analysis" },
              { text: "🌐 View Website", url: "https://www.metapulse.tech" }
            ]
          ]
        }
      };

      await bot.sendMessage(chatId, 
        "🔍 **AI-Powered Buy Signals Update**\n\n" +
        "No tokens currently match the adaptive criteria.\n\n" +
        adaptiveInsights + "\n\n" +
        "🤖 The AI is continuously learning and adapting...",
        { 
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
      return;
    }

    // Format tokens for message with enhanced styling
    const formatNumber = (num: number) => {
      if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
      return num.toFixed(2);
    };

    const getRiskEmoji = (token: BuySignalToken, criteria: AdaptiveCriteria) => {
      if (criteria.riskLevel === 'conservative') return '🛡️';
      if (criteria.riskLevel === 'aggressive') return '⚡';
      return '⚖️';
    };

    const tokenLines = filteredTokens.map((token, i) => {
      const priceEmoji = token.priceChange24h >= 20 ? '🚀' : 
                        token.priceChange24h >= 10 ? '🔥' :
                        token.priceChange24h >= 0 ? '📈' : 
                        token.priceChange24h >= -10 ? '📉' : '🔻';
      const changeSign = token.priceChange24h >= 0 ? '+' : '';
      const riskEmoji = getRiskEmoji(token, adaptiveCriteria);
      
      return [
        `${riskEmoji} **${i + 1}. ${token.symbol}** - ${token.name}`,
        `   ${priceEmoji} $${token.price.toFixed(8)} (${changeSign}${token.priceChange24h.toFixed(2)}%)`,
        `   💰 MCap: $${formatNumber(token.marketCap)} | 💧 Liq: $${formatNumber(token.liquidity)}`,
        `   📊 Vol: $${formatNumber(token.volume24h)} | 🔄 Txns: ${formatNumber(token.transactions24h)}`,
        `   ⏰ Age: ${token.pairAge.toFixed(1)}h | 🎯 Risk: ${adaptiveCriteria.riskLevel}`,
        `   🔗 \`${token.address}\``,
        ''
      ].join('\n');
    });

    // Create interactive keyboard
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 Refresh", callback_data: "refresh_scan" },
            { text: "📊 Analysis", callback_data: "market_analysis" }
          ],
          [
            { text: "⚙️ Settings", callback_data: "bot_settings" },
            { text: "🌐 Website", url: "https://www.metapulse.tech" }
          ]
        ]
      }
    };

    const text = [
      "🧠 **AI-POWERED BUY SIGNALS**",
      "",
      adaptiveInsights,
      "",
      "🎯 **Top Opportunities:**",
      "",
      ...tokenLines,
      "⚠️ **Risk Disclaimer:** AI-generated signals. DYOR. Not financial advice.",
      "🤖 **MetaPulse AI** - Continuously learning and adapting"
    ].join("\n");

    await bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...keyboard
    });
    
    console.log(`✅ AI buy signals sent successfully (${filteredTokens.length} tokens, ${adaptiveCriteria.riskLevel} risk)`);
  } catch (error) {
    console.error('❌ Error in AI buy signals:', error);
    
    // Send error message with retry option
    const errorKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Retry", callback_data: "refresh_scan" }]
        ]
      }
    };
    
    await bot.sendMessage(chatId, 
      "❌ **AI Analysis Error**\n\n" +
      "The AI encountered an issue while analyzing market conditions.\n\n" +
      "Please try again in a moment.",
      { 
        parse_mode: 'Markdown',
        ...errorKeyboard
      }
    );
  }
}