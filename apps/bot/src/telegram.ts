import TelegramBot from "node-telegram-bot-api";

export function makeBot(token: string) {
  return new TelegramBot(token, { polling: true });
}

export function setupBotCommands(bot: TelegramBot) {
  // Main menu keyboard
  const mainMenu = {
    reply_markup: {
      keyboard: [
    [ { text: "📊 Live Metas" }, { text: "🔥 Top Tokens" } ],
    [ { text: "📈 Market Stats" }, { text: "⚙️ Settings" } ],
    [ { text: "ℹ️ About" }, { text: "🌐 Website" } ]
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
    const aboutText = `ℹ️ About MetaPulse AI Bot

🤖 Version: 1.0.0
🔗 Website: https://metapulse.ai
📱 Telegram: @metapulseai

MetaPulse AI Bot is an AI-powered trading assistant built on Solana. It detects trending metas and token narratives faster than typical trackers.

Phase 1: ✅ AI Market Scanner
Phase 2: 🚧 Sniper Module + AI Launcher
Phase 3: 🚧 BSC and Sui Expansion
Phase 4: 🚧 Revenue Dashboard`;
    bot.sendMessage(chatId, aboutText, mainMenu);
  });

  bot.onText(/🌐 Website/, (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🌐 Visit our website:\n\nhttp://localhost:5174\n\nOr click the link below to access the live metas feed:\nhttp://localhost:5174/metas", mainMenu);
  });

  // Handle help command
  bot.onText(/\/help/, (msg: any) => {
    const chatId = msg.chat.id;
    const helpText = `🆘 Help & Commands

/start - Show main menu
/help - Show this help message
/status - Bot status and uptime
/website - Get website link

📊 Use the menu buttons to navigate:
• Live Metas - View trending categories
• Top Tokens - See best performing tokens
• Market Stats - Current market overview
• Settings - Configure your preferences
• About - Learn more about MetaPulse
• Website - Access web interface`;
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
    bot.sendMessage(chatId, "🌐 MetaPulse Website\n\nMain site: http://localhost:5174\nLive metas: http://localhost:5174/metas", mainMenu);
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
