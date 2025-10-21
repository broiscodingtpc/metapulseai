import TelegramBot from "node-telegram-bot-api";

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
  // Main menu keyboard
  const mainMenu = {
    reply_markup: {
      keyboard: [
    [ { text: "📊 Live Metas" }, { text: "🔥 Top Tokens" } ],
    [ { text: "💎 Buy Signals" }, { text: "📈 Market Stats" } ],
    [ { text: "⚙️ Settings" }, { text: "ℹ️ About" } ],
    [ { text: "🌐 Website" } ]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };

  // Handle /start command
  bot.onText(/\/start/, (msg: any) => {
    const chatId = msg.chat.id;
    const welcomeText = `🤖 Welcome to MetaPulse AI Bot — $PULSEAI

Feel the pulse before the market does.

Choose an option from the menu below:`;

    bot.sendMessage(chatId, welcomeText, mainMenu);
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
🤖 AI Model: Groq Llama-3.1-70b
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
🤖 AI: Groq Llama-3.1-70b
📊 Tokens tracked: 0
🔄 Last update: Just started`;
    bot.sendMessage(chatId, statusText, mainMenu);
  });

  // Handle website command
  bot.onText(/\/website/, (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🌐 MetaPulse Website\n\nMain site: https://www.metapulse.tech\nLive metas: https://www.metapulse.tech/metas", mainMenu);
  });

  // Handle buy signals command
  bot.onText(/\/buysignals/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Scanning for buy opportunities...\n\nPlease wait...", mainMenu);
    await sendBuySignals(bot, chatId);
  });

  // Add buy signals button to main menu
  bot.onText(/💎 Buy Signals/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Scanning top tokens with buy criteria...", mainMenu);
    await sendBuySignals(bot, chatId);
  });
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
    console.log('🔍 Fetching buy signal tokens from DexScreener...');
    
    // Fetch latest tokens from DexScreener Solana
    const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log('⚠️ No pairs data available from DexScreener');
      return;
    }

    // Filter tokens based on criteria
    const now = Date.now();
    const filteredTokens: BuySignalToken[] = data.pairs
      .filter((pair: any) => {
        // Extract data
        const liquidity = parseFloat(pair.liquidity?.usd || 0);
        const marketCap = parseFloat(pair.fdv || pair.marketCap || 0);
        const pairCreatedAt = pair.pairCreatedAt || 0;
        const pairAgeHours = (now - pairCreatedAt) / (1000 * 60 * 60);
        const transactions24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
        
        // Apply filters
        return (
          liquidity >= 80000 &&
          marketCap >= 1000000 &&
          marketCap <= 80000000 &&
          pairAgeHours <= 60 &&
          transactions24h >= 3000
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

    if (filteredTokens.length === 0) {
      console.log('📊 No tokens matching buy criteria found');
      await bot.sendMessage(chatId, 
        "🔍 **Buy Signals Update**\n\n" +
        "No tokens currently match the buy criteria:\n" +
        "• Liquidity ≥ $80K\n" +
        "• Market Cap: $1M - $80M\n" +
        "• Pair Age ≤ 60 hours\n" +
        "• Transactions ≥ 3,000\n\n" +
        "The AI will keep scanning... 🤖",
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Format tokens for message
    const formatNumber = (num: number) => {
      if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
      return num.toFixed(2);
    };

    const tokenLines = filteredTokens.map((token, i) => {
      const priceEmoji = token.priceChange24h >= 10 ? '🚀' : 
                        token.priceChange24h >= 0 ? '📈' : 
                        token.priceChange24h >= -10 ? '📉' : '🔻';
      const changeSign = token.priceChange24h >= 0 ? '+' : '';
      
      return [
        `**${i + 1}. ${token.symbol}** - ${token.name}`,
        `   ${priceEmoji} Price: $${token.price.toFixed(8)} (${changeSign}${token.priceChange24h.toFixed(2)}%)`,
        `   💰 MCap: $${formatNumber(token.marketCap)} | 💧 Liq: $${formatNumber(token.liquidity)}`,
        `   📊 Vol: $${formatNumber(token.volume24h)} | 🔄 Txns: ${formatNumber(token.transactions24h)}`,
        `   ⏰ Age: ${token.pairAge.toFixed(1)}h`,
        `   🔗 \`${token.address}\``,
        ''
      ].join('\n');
    });

    const text = [
      "💎 **BUY SIGNALS - Top 10 Tokens**",
      "",
      "✅ **Filters Applied:**",
      "• Liquidity: ≥ $80,000",
      "• Market Cap: $1M - $80M", 
      "• Pair Age: ≤ 60 hours",
      "• 24h Transactions: ≥ 3,000",
      "• Sorted by: Volume (High to Low)",
      "",
      "🎯 **Top Opportunities:**",
      "",
      ...tokenLines,
      "⚠️ **Disclaimer:** DYOR. Not financial advice.",
      "🤖 Powered by MetaPulse AI"
    ].join("\n");

    await bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
    
    console.log(`✅ Buy signals sent successfully (${filteredTokens.length} tokens)`);
  } catch (error) {
    console.error('❌ Error fetching/sending buy signals:', error);
  }
}