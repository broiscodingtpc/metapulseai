import TelegramBot from "node-telegram-bot-api";
import { AdaptiveAnalyzer } from './adaptiveAnalyzer.js';

export async function sendPnLReport(bot: TelegramBot, chatId: string | number, adaptiveAnalyzer: AdaptiveAnalyzer) {
  try {
    console.log('📊 Generating PnL report...');
    
    const pnlData = adaptiveAnalyzer.getOneHourPnLReport();
    
    if (pnlData.length === 0) {
      console.log('📊 No PnL data available for 1-hour tracking');
      return;
    }

    // Create PnL report message
    const pnlLines = pnlData.map((token, index) => {
      const performanceIcon = token.performance >= 0 ? '🚀' : '🔻';
      const performanceColor = token.performance >= 0 ? '+' : '';
      const riskIcon = token.performance >= 20 ? '🟢' : token.performance >= 0 ? '🟡' : '🔴';
      
      return [
        `${riskIcon} **${index + 1}. ${token.symbol}**`,
        `   ${performanceIcon} **${performanceColor}${token.performance.toFixed(2)}%** (1h)`,
        `   💰 Entry: $${token.initialPrice.toFixed(8)}`,
        `   💰 Current: $${token.currentPrice.toFixed(8)}`,
        `   🔗 \`${token.address.slice(0, 8)}...${token.address.slice(-8)}\``,
        ''
      ].join('\n');
    });

    const text = [
      "📊 **1-HOUR PnL REPORT**",
      "",
      "🎯 **Top 3 Signal Performance:**",
      "",
      ...pnlLines,
      "⚠️ **Disclaimer:** Past performance doesn't guarantee future results.",
      "🤖 **MetaPulse AI** - Track your signals"
    ].join("\n");

    // Create inline keyboard for actions
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 Refresh PnL", callback_data: "refresh_pnl" },
            { text: "📈 New Signals", callback_data: "refresh_scan" }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...keyboard
    });
    
    console.log(`✅ PnL report sent successfully (${pnlData.length} tokens tracked)`);
  } catch (error) {
    console.error('❌ Error in PnL report:', error);
    
    // Send error message
    await bot.sendMessage(chatId, 
      "❌ **PnL Report Error**\n\n" +
      "Unable to generate PnL report at this time.\n\n" +
      "Please try again later.",
      { parse_mode: 'Markdown' }
    );
  }
}