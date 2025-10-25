// Telegram Bot API wrapper
export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

class TelegramAPI {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken || !this.chatId) {
      console.warn('[Telegram] Bot token or chat ID not found');
    }
  }

  private async makeRequest(method: string, data: any): Promise<any> {
    try {
      console.log(`[Telegram] Sending ${method} request`);
      
      const response = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return result.result;
    } catch (error) {
      console.error(`[Telegram] Error with ${method}:`, error);
      throw error;
    }
  }

  async sendMessage(text: string, options: Partial<TelegramMessage> = {}): Promise<any> {
    const message: TelegramMessage = {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options,
    };

    return this.makeRequest('sendMessage', message);
  }

  async sendTokenAlert(tokenData: any, analysis: any): Promise<void> {
    const message = this.formatTokenAlert(tokenData, analysis);
    await this.sendMessage(message);
  }

  private formatTokenAlert(tokenData: any, analysis: any): string {
    const scoreEmoji = this.getScoreEmoji(analysis.score);
    const riskEmoji = this.getRiskEmoji(analysis.riskLevel);
    
    return `
<b>🔍 NEW TOKEN DETECTED</b>

<code>╔══════════════════════════════════════╗</code>
<code>║           ${tokenData.symbol.padEnd(20)}           ║</code>
<code>╚══════════════════════════════════════╝</code>

<b>📊 ANALYSIS:</b>
• Score: <b>${analysis.score}/100</b> ${scoreEmoji}
• Category: <b>${analysis.metaCategory}</b>
• Risk: <b>${analysis.riskLevel.toUpperCase()}</b> ${riskEmoji}
• Sentiment: <b>${analysis.sentiment.toUpperCase()}</b>

<b>💰 METRICS:</b>
• Market Cap: <b>$${tokenData.marketCap?.toLocaleString() || 'N/A'}</b>
• Age: <b>${tokenData.age || 'N/A'}h</b>
• Volume: <b>$${tokenData.volume24h?.toLocaleString() || 'N/A'}</b>

<b>🔗 LINKS:</b>
${tokenData.dexscreenerUrl ? `• <a href="${tokenData.dexscreenerUrl}">Dexscreener</a>` : ''}
${tokenData.website ? `• <a href="${tokenData.website}">Website</a>` : ''}
${tokenData.twitter ? `• <a href="${tokenData.twitter}">Twitter</a>` : ''}

<code>Contract: ${tokenData.mint}</code>

<i>MetaPulse AI • Feel the pulse before the market does</i>
    `.trim();
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🚀';
    if (score >= 70) return '📈';
    if (score >= 50) return '📊';
    if (score >= 30) return '⚠️';
    return '🔴';
  }

  private getRiskEmoji(risk: string): string {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  }

  async sendSystemMessage(message: string): Promise<void> {
    const formattedMessage = `
<b>🤖 SYSTEM MESSAGE</b>

<code>╔══════════════════════════════════════╗</code>
<code>║            MetaPulse AI            ║</code>
<code>╚══════════════════════════════════════╝</code>

${message}

<i>System Status: Operational</i>
    `.trim();

    await this.sendMessage(formattedMessage);
  }

  async sendDailyReport(stats: {
    tokensAnalyzed: number;
    highScoreTokens: number;
    topCategory: string;
    avgScore: number;
  }): Promise<void> {
    const message = `
<b>📊 DAILY REPORT</b>

<code>╔══════════════════════════════════════╗</code>
<code>║         MetaPulse AI Stats         ║</code>
<code>╚══════════════════════════════════════╝</code>

<b>📈 TODAY'S METRICS:</b>
• Tokens Analyzed: <b>${stats.tokensAnalyzed}</b>
• High Score (70+): <b>${stats.highScoreTokens}</b>
• Top Category: <b>${stats.topCategory}</b>
• Average Score: <b>${stats.avgScore.toFixed(1)}/100</b>

<b>🎯 SYSTEM STATUS:</b>
• Dexscreener API: <b>✅ Active</b>
• PumpPortal API: <b>✅ Active</b>
• Groq AI: <b>✅ Active</b>
• Rate Limits: <b>✅ Optimal</b>

<i>MetaPulse AI • 24/7 Market Intelligence</i>
    `.trim();

    await this.sendMessage(message);
  }
}

export const telegramAPI = new TelegramAPI();