interface CallRecord {
  id: string;
  token: string;
  symbol: string;
  callTime: Date;
  initialPrice: number;
  currentPrice?: number;
  maxPrice?: number;
  gain?: number;
  maxGain?: number;
  timeframe: string;
  source: 'ai_analysis' | 'social_trend' | 'market_signal';
  confidence: number;
  status: 'active' | 'completed' | 'expired';
}

interface DailyStats {
  date: string;
  totalCalls: number;
  successfulCalls: number;
  successRate: number;
  avgGain: number;
  bestCall: CallRecord | null;
  totalVolume: number;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalCalls: number;
  successRate: number;
  avgGain: number;
  topPerformers: CallRecord[];
  marketTrend: 'bullish' | 'bearish' | 'sideways';
}

class PerformanceTracker {
  private callHistory: CallRecord[] = [];
  private dailyStats: Map<string, DailyStats> = new Map();
  private readonly MAX_HISTORY_DAYS = 30;
  private readonly SUCCESS_THRESHOLD = 10; // 10% gain considered successful

  constructor() {
    this.loadPerformanceData();
  }

  private loadPerformanceData(): void {
    try {
      // In a real implementation, this would load from a database
      // For now, we'll start with empty data
      console.log('📊 Performance tracker initialized');
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  }

  private savePerformanceData(): void {
    try {
      // In a real implementation, this would save to a database
      // For now, we'll just log
      console.log('💾 Performance data saved');
    } catch (error) {
      console.error('Error saving performance data:', error);
    }
  }

  recordCall(tokenData: {
    token: string;
    symbol: string;
    price: number;
    source: 'ai_analysis' | 'social_trend' | 'market_signal';
    confidence: number;
  }): string {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const callRecord: CallRecord = {
      id: callId,
      token: tokenData.token,
      symbol: tokenData.symbol,
      callTime: new Date(),
      initialPrice: tokenData.price,
      timeframe: '24h',
      source: tokenData.source,
      confidence: tokenData.confidence,
      status: 'active'
    };

    this.callHistory.push(callRecord);
    this.updateDailyStats();
    this.savePerformanceData();

    console.log(`📈 Recorded new call: ${tokenData.symbol} at $${tokenData.price}`);
    return callId;
  }

  updateCallPerformance(callId: string, currentPrice: number): void {
    const call = this.callHistory.find(c => c.id === callId);
    if (!call) return;

    call.currentPrice = currentPrice;
    call.gain = ((currentPrice - call.initialPrice) / call.initialPrice) * 100;
    
    if (!call.maxPrice || currentPrice > call.maxPrice) {
      call.maxPrice = currentPrice;
      call.maxGain = ((currentPrice - call.initialPrice) / call.initialPrice) * 100;
    }

    // Update status based on performance and time
    const hoursElapsed = (Date.now() - call.callTime.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed >= 24) {
      call.status = 'completed';
    }

    this.updateDailyStats();
    this.savePerformanceData();
  }

  private updateDailyStats(): void {
    const today = new Date().toISOString().split('T')[0];
    const todayCalls = this.callHistory.filter(call => 
      call.callTime.toISOString().split('T')[0] === today
    );

    const successfulCalls = todayCalls.filter(call => 
      call.gain && call.gain >= this.SUCCESS_THRESHOLD
    );

    const avgGain = todayCalls.length > 0 
      ? todayCalls.reduce((sum, call) => sum + (call.gain || 0), 0) / todayCalls.length
      : 0;

    const bestCall = todayCalls.reduce((best, call) => {
      if (!call.gain) return best;
      if (!best || (call.gain > (best.gain || 0))) return call;
      return best;
    }, null as CallRecord | null);

    const stats: DailyStats = {
      date: today,
      totalCalls: todayCalls.length,
      successfulCalls: successfulCalls.length,
      successRate: todayCalls.length > 0 ? (successfulCalls.length / todayCalls.length) * 100 : 0,
      avgGain,
      bestCall,
      totalVolume: todayCalls.length * 1000 // Estimated volume
    };

    this.dailyStats.set(today, stats);
  }

  getTodayStats(): DailyStats {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyStats.get(today) || {
      date: today,
      totalCalls: 0,
      successfulCalls: 0,
      successRate: 0,
      avgGain: 0,
      bestCall: null,
      totalVolume: 0
    };
  }

  getWeeklyReport(): WeeklyReport {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekCalls = this.callHistory.filter(call => 
      call.callTime >= weekStart && call.callTime <= now
    );

    const successfulCalls = weekCalls.filter(call => 
      call.gain && call.gain >= this.SUCCESS_THRESHOLD
    );

    const avgGain = weekCalls.length > 0 
      ? weekCalls.reduce((sum, call) => sum + (call.gain || 0), 0) / weekCalls.length
      : 0;

    const topPerformers = weekCalls
      .filter(call => call.gain && call.gain > 0)
      .sort((a, b) => (b.gain || 0) - (a.gain || 0))
      .slice(0, 5);

    // Determine market trend based on success rate and average gain
    let marketTrend: 'bullish' | 'bearish' | 'sideways' = 'sideways';
    if (avgGain > 15 && successfulCalls.length / weekCalls.length > 0.6) {
      marketTrend = 'bullish';
    } else if (avgGain < 0 || successfulCalls.length / weekCalls.length < 0.3) {
      marketTrend = 'bearish';
    }

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: now.toISOString().split('T')[0],
      totalCalls: weekCalls.length,
      successRate: weekCalls.length > 0 ? (successfulCalls.length / weekCalls.length) * 100 : 0,
      avgGain,
      topPerformers,
      marketTrend
    };
  }

  getBestCalls(limit: number = 10): CallRecord[] {
    return this.callHistory
      .filter(call => call.gain && call.gain > 0)
      .sort((a, b) => (b.maxGain || b.gain || 0) - (a.maxGain || a.gain || 0))
      .slice(0, limit);
  }

  getRecentCalls(hours: number = 24): CallRecord[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.callHistory
      .filter(call => call.callTime >= cutoff)
      .sort((a, b) => b.callTime.getTime() - a.callTime.getTime());
  }

  getSuccessRate(days: number = 7): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentCalls = this.callHistory.filter(call => call.callTime >= cutoff);
    
    if (recentCalls.length === 0) return 0;
    
    const successfulCalls = recentCalls.filter(call => 
      call.gain && call.gain >= this.SUCCESS_THRESHOLD
    );
    
    return (successfulCalls.length / recentCalls.length) * 100;
  }

  formatBestCallsForTwitter(): string {
    const bestCalls = this.getBestCalls(3);
    
    if (bestCalls.length === 0) {
      return "🔍 Scanning for new opportunities...";
    }

    return bestCalls.map((call, index) => {
      const gain = call.maxGain || call.gain || 0;
      const timeAgo = this.getTimeAgo(call.callTime);
      return `${index + 1}. ${call.symbol} +${gain.toFixed(1)}% (${timeAgo})`;
    }).join('\n');
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Recent';
    }
  }

  // Simulate some performance data for demonstration
  simulatePerformanceData(): void {
    const tokens = ['PEPE', 'SHIB', 'DOGE', 'FLOKI', 'BONK', 'WIF', 'POPCAT'];
    const sources: ('ai_analysis' | 'social_trend' | 'market_signal')[] = ['ai_analysis', 'social_trend', 'market_signal'];
    
    // Generate some historical calls
    for (let i = 0; i < 20; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const price = Math.random() * 0.001 + 0.0001;
      const confidence = Math.random() * 40 + 60; // 60-100%
      
      const callId = this.recordCall({
        token: token.toLowerCase(),
        symbol: token,
        price,
        source,
        confidence
      });

      // Simulate price updates
      const gain = (Math.random() - 0.3) * 50; // -15% to +35% range
      const newPrice = price * (1 + gain / 100);
      this.updateCallPerformance(callId, newPrice);
    }

    console.log('📊 Simulated performance data generated');
  }
}

export const performanceTracker = new PerformanceTracker();