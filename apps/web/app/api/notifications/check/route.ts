import { NextResponse } from 'next/server';

interface Notification {
  id: string;
  type: 'buy_signal' | 'price_alert' | 'meta_trend' | 'risk_warning' | 'market_update';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  actionUrl?: string;
}

async function checkBuySignals(): Promise<Notification[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tokens/trending`);
    if (!response.ok) return [];

    const tokens = await response.json();
    const notifications: Notification[] = [];

    // Check for high-potential tokens
    const highPotentialTokens = tokens.filter((token: any) => 
      token.sentiment > 0.8 && 
      token.change24h > 50 && 
      token.risk === 'low'
    );

    if (highPotentialTokens.length > 0) {
      notifications.push({
        id: `buy_signal_${Date.now()}`,
        type: 'buy_signal',
        title: '🎯 High-Potential Buy Signal',
        message: `${highPotentialTokens.length} tokens detected with high sentiment (>80%) and strong performance (+${highPotentialTokens[0].change24h.toFixed(1)}%)`,
        timestamp: new Date(),
        priority: 'high',
        read: false,
        actionUrl: '/tokens'
      });
    }

    // Check for new trending metas
    const aiTokens = tokens.filter((token: any) => 
      token.name.toLowerCase().includes('ai') || 
      token.symbol.toLowerCase().includes('ai') ||
      token.name.toLowerCase().includes('gpt') ||
      token.name.toLowerCase().includes('bot')
    );

    if (aiTokens.length >= 3) {
      notifications.push({
        id: `meta_trend_${Date.now()}`,
        type: 'meta_trend',
        title: '🔥 AI Meta Trending',
        message: `${aiTokens.length} AI-related tokens showing strong activity. Average gain: +${(aiTokens.reduce((sum: number, t: any) => sum + t.change24h, 0) / aiTokens.length).toFixed(1)}%`,
        timestamp: new Date(),
        priority: 'medium',
        read: false,
        actionUrl: '/metas'
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error checking buy signals:', error);
    return [];
  }
}

async function checkMarketConditions(): Promise<Notification[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/market/stats`);
    if (!response.ok) return [];

    const stats = await response.json();
    const notifications: Notification[] = [];

    // Check for extreme market conditions
    if (stats.volatilityIndex > 80) {
      notifications.push({
        id: `risk_warning_${Date.now()}`,
        type: 'risk_warning',
        title: '⚠️ High Market Volatility',
        message: `Volatility index at ${stats.volatilityIndex.toFixed(1)}%. Exercise caution with new positions.`,
        timestamp: new Date(),
        priority: 'critical',
        read: false
      });
    }

    // Check for bullish market conditions
    if (stats.marketTrend === 'bullish' && stats.avgSentiment > 0.7) {
      notifications.push({
        id: `market_update_${Date.now()}`,
        type: 'market_update',
        title: '📈 Strong Bullish Sentiment',
        message: `Market showing strong bullish trend with ${(stats.avgSentiment * 100).toFixed(0)}% positive sentiment. ${stats.activeSignals} active buy signals.`,
        timestamp: new Date(),
        priority: 'medium',
        read: false,
        actionUrl: '/analytics'
      });
    }

    // Check for low liquidity warning
    if (stats.liquidityIndex < 30) {
      notifications.push({
        id: `risk_warning_liquidity_${Date.now()}`,
        type: 'risk_warning',
        title: '⚠️ Low Market Liquidity',
        message: `Liquidity index at ${stats.liquidityIndex.toFixed(1)}%. Higher slippage expected on trades.`,
        timestamp: new Date(),
        priority: 'high',
        read: false
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error checking market conditions:', error);
    return [];
  }
}

async function checkPriceAlerts(): Promise<Notification[]> {
  // This would typically check user-set price alerts
  // For now, we'll generate sample alerts based on significant price movements
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tokens/trending`);
    if (!response.ok) return [];

    const tokens = await response.json();
    const notifications: Notification[] = [];

    // Check for extreme price movements
    const extremeMovers = tokens.filter((token: any) => Math.abs(token.change24h) > 100);
    
    if (extremeMovers.length > 0) {
      const biggestMover = extremeMovers.reduce((prev: any, current: any) => 
        Math.abs(current.change24h) > Math.abs(prev.change24h) ? current : prev
      );

      notifications.push({
        id: `price_alert_${Date.now()}`,
        type: 'price_alert',
        title: '📈 Extreme Price Movement',
        message: `${biggestMover.name} (${biggestMover.symbol}) ${biggestMover.change24h > 0 ? 'surged' : 'dropped'} ${Math.abs(biggestMover.change24h).toFixed(1)}% in 24h`,
        timestamp: new Date(),
        priority: 'high',
        read: false,
        actionUrl: biggestMover.dexscreenerUrl
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error checking price alerts:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Check various notification sources
    const [buySignalNotifications, marketNotifications, priceAlertNotifications] = await Promise.all([
      checkBuySignals(),
      checkMarketConditions(),
      checkPriceAlerts()
    ]);

    // Combine all notifications
    const allNotifications = [
      ...buySignalNotifications,
      ...marketNotifications,
      ...priceAlertNotifications
    ];

    // Sort by priority and timestamp
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    allNotifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Return only the most recent notifications (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentNotifications = allNotifications.filter(n => n.timestamp > tenMinutesAgo);

    return NextResponse.json(recentNotifications);
  } catch (error) {
    console.error('Error generating notifications:', error);
    
    // Return sample notification as fallback
    const sampleNotifications: Notification[] = [
      {
        id: `sample_${Date.now()}`,
        type: 'market_update',
        title: '🤖 AI System Active',
        message: 'MetaPulse AI is actively monitoring market conditions and will alert you of opportunities.',
        timestamp: new Date(),
        priority: 'low',
        read: false
      }
    ];
    
    return NextResponse.json(sampleNotifications);
  }
}