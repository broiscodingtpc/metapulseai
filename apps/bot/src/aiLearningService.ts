import { twitterService, TokenCall, TwitterSentiment } from './twitterService.js';
import { AdaptiveAnalyzer } from './adaptiveAnalyzer.js';
import fs from 'fs/promises';
import path from 'path';

interface CallPerformance {
  callId: string;
  symbol: string;
  caller: string;
  callTime: Date;
  initialPrice: number;
  currentPrice?: number;
  priceChange?: number;
  sentiment: TwitterSentiment;
  confidence: number;
  followers: number;
  performance?: 'excellent' | 'good' | 'poor' | 'terrible';
  actualOutcome?: number; // Percentage change after 24h
}

interface CallerStats {
  username: string;
  totalCalls: number;
  successfulCalls: number;
  averageReturn: number;
  followers: number;
  reliability: number; // 0-1 score
  specialties: string[]; // Token types they're good at
  lastUpdated: Date;
}

interface LearningMetrics {
  totalCallsTracked: number;
  successRate: number;
  averageReturn: number;
  topCallers: CallerStats[];
  sentimentAccuracy: number;
  lastLearningUpdate: Date;
}

class AILearningService {
  private callsHistory: CallPerformance[] = [];
  private callerStats: Map<string, CallerStats> = new Map();
  private learningMetrics: LearningMetrics;
  private dataPath: string;
  private adaptiveAnalyzer: AdaptiveAnalyzer;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'learning');
    this.adaptiveAnalyzer = new AdaptiveAnalyzer();
    this.learningMetrics = {
      totalCallsTracked: 0,
      successRate: 0,
      averageReturn: 0,
      topCallers: [],
      sentimentAccuracy: 0,
      lastLearningUpdate: new Date()
    };
    this.initializeService();
  }

  private async initializeService() {
    try {
      await this.ensureDataDirectory();
      await this.loadLearningData();
      console.log('AI Learning Service initialized');
    } catch (error) {
      console.error('Error initializing AI Learning Service:', error);
    }
  }

  private async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  private async loadLearningData() {
    try {
      const callsPath = path.join(this.dataPath, 'calls_history.json');
      const statsPath = path.join(this.dataPath, 'caller_stats.json');
      const metricsPath = path.join(this.dataPath, 'learning_metrics.json');

      // Load calls history
      try {
        const callsData = await fs.readFile(callsPath, 'utf-8');
        this.callsHistory = JSON.parse(callsData).map((call: any) => ({
          ...call,
          callTime: new Date(call.callTime)
        }));
      } catch (error) {
        console.log('No existing calls history found, starting fresh');
      }

      // Load caller stats
      try {
        const statsData = await fs.readFile(statsPath, 'utf-8');
        const statsArray = JSON.parse(statsData);
        this.callerStats = new Map(statsArray.map((stat: any) => [
          stat.username,
          { ...stat, lastUpdated: new Date(stat.lastUpdated) }
        ]));
      } catch (error) {
        console.log('No existing caller stats found, starting fresh');
      }

      // Load learning metrics
      try {
        const metricsData = await fs.readFile(metricsPath, 'utf-8');
        this.learningMetrics = {
          ...JSON.parse(metricsData),
          lastLearningUpdate: new Date(JSON.parse(metricsData).lastLearningUpdate)
        };
      } catch (error) {
        console.log('No existing learning metrics found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  }

  private async saveLearningData() {
    try {
      const callsPath = path.join(this.dataPath, 'calls_history.json');
      const statsPath = path.join(this.dataPath, 'caller_stats.json');
      const metricsPath = path.join(this.dataPath, 'learning_metrics.json');

      // Save calls history
      await fs.writeFile(callsPath, JSON.stringify(this.callsHistory, null, 2));

      // Save caller stats
      const statsArray = Array.from(this.callerStats.values());
      await fs.writeFile(statsPath, JSON.stringify(statsArray, null, 2));

      // Save learning metrics
      await fs.writeFile(metricsPath, JSON.stringify(this.learningMetrics, null, 2));
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  }

  async trackNewCalls() {
    if (!twitterService.isReady()) {
      console.log('Twitter service not ready, skipping call tracking');
      return;
    }

    try {
      console.log('Tracking new token calls...');
      const newCalls = await twitterService.findTokenCalls(20);
      
      for (const call of newCalls) {
        // Check if we already have this call
        const existingCall = this.callsHistory.find(
          c => c.symbol === call.symbol && 
               c.caller === call.caller && 
               Math.abs(new Date(c.callTime).getTime() - new Date(call.timestamp).getTime()) < 3600000 // 1 hour
        );

        if (!existingCall) {
          const sentiment = await twitterService.getTokenSentiment(call.symbol);
          
          const callPerformance: CallPerformance = {
            callId: `${call.caller}_${call.symbol}_${Date.now()}`,
            symbol: call.symbol,
            caller: call.caller,
            callTime: new Date(call.timestamp),
            initialPrice: 0, // Would be fetched from price API
            sentiment,
            confidence: call.confidence,
            followers: call.followers
          };

          this.callsHistory.push(callPerformance);
          await this.updateCallerStats(call.caller, call.followers);
        }
      }

      await this.saveLearningData();
      console.log(`Tracked ${newCalls.length} new calls`);
    } catch (error) {
      console.error('Error tracking new calls:', error);
    }
  }

  async updateCallPerformances() {
    try {
      console.log('Updating call performances...');
      const now = new Date();
      let updatedCount = 0;

      for (const call of this.callsHistory) {
        // Only update calls that are 24+ hours old and don't have performance data
        const hoursSinceCall = (now.getTime() - call.callTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCall >= 24 && !call.actualOutcome) {
          // In a real implementation, you would fetch the actual price change
          // For now, we'll simulate based on sentiment and confidence
          const simulatedOutcome = this.simulateCallOutcome(call);
          
          call.actualOutcome = simulatedOutcome;
          call.performance = this.categorizePerformance(simulatedOutcome);
          
          // Update caller stats
          await this.updateCallerPerformance(call.caller, simulatedOutcome);
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        await this.updateLearningMetrics();
        await this.saveLearningData();
        console.log(`Updated performance for ${updatedCount} calls`);
      }
    } catch (error) {
      console.error('Error updating call performances:', error);
    }
  }

  private simulateCallOutcome(call: CallPerformance): number {
    // Simulate outcome based on sentiment, confidence, and caller reliability
    let baseReturn = 0;

    // Sentiment influence
    switch (call.sentiment.sentiment) {
      case 'bullish':
        baseReturn += 15;
        break;
      case 'bearish':
        baseReturn -= 10;
        break;
      case 'neutral':
        baseReturn += 2;
        break;
    }

    // Confidence influence
    baseReturn += (call.confidence - 0.5) * 20;

    // Caller reliability influence
    const callerStat = this.callerStats.get(call.caller);
    if (callerStat) {
      baseReturn += (callerStat.reliability - 0.5) * 10;
    }

    // Add some randomness
    const randomFactor = (Math.random() - 0.5) * 30;
    
    return Math.round((baseReturn + randomFactor) * 100) / 100;
  }

  private categorizePerformance(outcome: number): 'excellent' | 'good' | 'poor' | 'terrible' {
    if (outcome >= 20) return 'excellent';
    if (outcome >= 5) return 'good';
    if (outcome >= -5) return 'poor';
    return 'terrible';
  }

  private async updateCallerStats(username: string, followers: number) {
    let stats = this.callerStats.get(username);
    
    if (!stats) {
      stats = {
        username,
        totalCalls: 0,
        successfulCalls: 0,
        averageReturn: 0,
        followers,
        reliability: 0.5, // Start neutral
        specialties: [],
        lastUpdated: new Date()
      };
    }

    stats.totalCalls++;
    stats.followers = Math.max(stats.followers, followers); // Keep highest follower count
    stats.lastUpdated = new Date();
    
    this.callerStats.set(username, stats);
  }

  private async updateCallerPerformance(username: string, outcome: number) {
    const stats = this.callerStats.get(username);
    if (!stats) return;

    // Update success rate
    if (outcome > 0) {
      stats.successfulCalls++;
    }

    // Update average return
    const totalReturn = stats.averageReturn * (stats.totalCalls - 1) + outcome;
    stats.averageReturn = totalReturn / stats.totalCalls;

    // Update reliability score
    const successRate = stats.successfulCalls / stats.totalCalls;
    const returnFactor = Math.max(0, Math.min(1, (stats.averageReturn + 20) / 40)); // Normalize -20% to +20%
    stats.reliability = (successRate * 0.6) + (returnFactor * 0.4);

    stats.lastUpdated = new Date();
    this.callerStats.set(username, stats);
  }

  private async updateLearningMetrics() {
    const completedCalls = this.callsHistory.filter(call => call.actualOutcome !== undefined);
    
    if (completedCalls.length === 0) return;

    this.learningMetrics.totalCallsTracked = completedCalls.length;
    
    const successfulCalls = completedCalls.filter(call => call.actualOutcome! > 0);
    this.learningMetrics.successRate = successfulCalls.length / completedCalls.length;
    
    const totalReturn = completedCalls.reduce((sum, call) => sum + call.actualOutcome!, 0);
    this.learningMetrics.averageReturn = totalReturn / completedCalls.length;
    
    // Update top callers
    this.learningMetrics.topCallers = Array.from(this.callerStats.values())
      .filter(stat => stat.totalCalls >= 3) // Minimum calls for ranking
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, 10);

    this.learningMetrics.lastLearningUpdate = new Date();
  }

  async getTopCallers(limit: number = 5): Promise<CallerStats[]> {
    return Array.from(this.callerStats.values())
      .filter(stat => stat.totalCalls >= 3)
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, limit);
  }

  async getCallAnalysis(symbol: string): Promise<string> {
    const symbolCalls = this.callsHistory.filter(call => 
      call.symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (symbolCalls.length === 0) {
      return `No historical call data found for ${symbol}`;
    }

    const completedCalls = symbolCalls.filter(call => call.actualOutcome !== undefined);
    
    if (completedCalls.length === 0) {
      return `${symbolCalls.length} recent calls found for ${symbol}, waiting for performance data`;
    }

    const avgReturn = completedCalls.reduce((sum, call) => sum + call.actualOutcome!, 0) / completedCalls.length;
    const successRate = completedCalls.filter(call => call.actualOutcome! > 0).length / completedCalls.length;
    
    return `📊 ${symbol} Call History:\n` +
           `📈 ${completedCalls.length} completed calls\n` +
           `✅ ${(successRate * 100).toFixed(1)}% success rate\n` +
           `💰 ${avgReturn > 0 ? '+' : ''}${avgReturn.toFixed(2)}% avg return`;
  }

  getLearningMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }

  async startLearningLoop() {
    console.log('Starting AI learning loop...');
    
    // Track new calls every 30 minutes
    setInterval(async () => {
      await this.trackNewCalls();
    }, 30 * 60 * 1000);

    // Update performances every 2 hours
    setInterval(async () => {
      await this.updateCallPerformances();
    }, 2 * 60 * 60 * 1000);

    // Initial run
    await this.trackNewCalls();
    await this.updateCallPerformances();
  }

  async updateLearning() {
    // Method called by scheduler for regular updates
    await this.trackNewCalls();
    await this.updateCallPerformances();
  }
}

export const aiLearningService = new AILearningService();
export default AILearningService;