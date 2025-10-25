'use client';

import { useState, useEffect } from 'react';
import { AsciiFrame, AsciiBadge } from '../components/ascii';

interface AnalyticsData {
  totalTokensAnalyzed: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageScore: number;
  topPerformingTokens: Array<{
    symbol: string;
    score: number;
    category: string;
    analyzedAt: string;
  }>;
  recentActivity: Array<{
    timestamp: string;
    action: string;
    details: string;
    status: 'success' | 'error' | 'warning';
  }>;
  systemMetrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to mock data if API fails
      const mockData: AnalyticsData = {
        totalTokensAnalyzed: 1247,
        successfulAnalyses: 1198,
        failedAnalyses: 49,
        averageScore: 67.3,
        topPerformingTokens: [
          { symbol: 'PULSE', score: 95, category: 'AI/Tech', analyzedAt: '2024-01-15T10:30:00Z' },
          { symbol: 'META', score: 89, category: 'Gaming', analyzedAt: '2024-01-15T09:15:00Z' },
          { symbol: 'DEGEN', score: 84, category: 'Meme', analyzedAt: '2024-01-15T08:45:00Z' },
          { symbol: 'SOLAI', score: 82, category: 'AI/Tech', analyzedAt: '2024-01-15T07:20:00Z' },
          { symbol: 'PUMP', score: 78, category: 'DeFi', analyzedAt: '2024-01-15T06:10:00Z' },
        ],
        recentActivity: [
          { timestamp: '2024-01-15T10:35:00Z', action: 'Token Analysis', details: 'PULSE analyzed - Score: 95', status: 'success' },
          { timestamp: '2024-01-15T10:30:00Z', action: 'Bot Digest', details: 'Telegram digest sent to 1,247 subscribers', status: 'success' },
          { timestamp: '2024-01-15T10:25:00Z', action: 'API Call', details: 'DexScreener API rate limit warning', status: 'warning' },
          { timestamp: '2024-01-15T10:20:00Z', action: 'System Check', details: 'All systems operational', status: 'success' },
          { timestamp: '2024-01-15T10:15:00Z', action: 'Token Analysis', details: 'Failed to analyze token - Invalid mint', status: 'error' },
        ],
        systemMetrics: {
          uptime: 99.7,
          memoryUsage: 68.4,
          cpuUsage: 23.1,
          activeConnections: 156
        }
      };
      setAnalytics(mockData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">MetaPulse Analytics</h1>
        <p className="text-console-dim mb-6">Comprehensive System Analytics & Performance Metrics</p>
        
        {/* Time Range Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {['1h', '6h', '24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`ascii-button ${timeRange === range ? 'ascii-button-primary' : ''}`}
            >
              [ {range} ]
            </button>
          ))}
        </div>
      </section>

      {/* Key Metrics */}
      <section>
        <AsciiFrame title="Key Performance Indicators">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-console-cyan mb-2">
                {analytics?.totalTokensAnalyzed.toLocaleString()}
              </div>
              <div className="text-console-dim text-sm">Total Tokens Analyzed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-console-green mb-2">
                {analytics?.averageScore.toFixed(1)}
              </div>
              <div className="text-console-dim text-sm">Average Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-console-yellow mb-2">
                {analytics ? ((analytics.successfulAnalyses / analytics.totalTokensAnalyzed) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-console-dim text-sm">Success Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-console-purple mb-2">
                {analytics?.systemMetrics.uptime.toFixed(1)}%
              </div>
              <div className="text-console-dim text-sm">System Uptime</div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* System Metrics */}
      <section>
        <AsciiFrame title="System Performance">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                <AsciiBadge level={analytics && analytics.systemMetrics.memoryUsage < 80 ? 'high' : 'medium'}>
                  {analytics?.systemMetrics.memoryUsage.toFixed(1)}%
                </AsciiBadge>
              </div>
              <div className="text-console-dim text-sm">Memory Usage</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                <AsciiBadge level={analytics && analytics.systemMetrics.cpuUsage < 50 ? 'high' : 'medium'}>
                  {analytics?.systemMetrics.cpuUsage.toFixed(1)}%
                </AsciiBadge>
              </div>
              <div className="text-console-dim text-sm">CPU Usage</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-cyan mb-2">
                {analytics?.systemMetrics.activeConnections}
              </div>
              <div className="text-console-dim text-sm">Active Connections</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-green mb-2">
                {analytics?.successfulAnalyses}
              </div>
              <div className="text-console-dim text-sm">Successful Analyses</div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Top Performing Tokens */}
      <section>
        <AsciiFrame title="Top Performing Tokens">
          <div className="space-y-3">
            {analytics?.topPerformingTokens.map((token, index) => (
              <div key={token.symbol} className="flex items-center justify-between p-3 ascii-box">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-console-cyan">#{index + 1}</div>
                  <div>
                    <div className="font-bold">{token.symbol}</div>
                    <div className="text-console-dim text-sm">{token.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    <AsciiBadge level="high">{token.score}</AsciiBadge>
                  </div>
                  <div className="text-console-dim text-xs">
                    {new Date(token.analyzedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AsciiFrame>
      </section>

      {/* Recent Activity */}
      <section>
        <AsciiFrame title="Recent Activity">
          <div className="space-y-2">
            {analytics?.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 ascii-box">
                <div className="flex items-center gap-3">
                  <AsciiBadge 
                    level={activity.status === 'success' ? 'high' : activity.status === 'warning' ? 'medium' : 'low'} 
                    size="sm"
                  >
                    {activity.status.toUpperCase()}
                  </AsciiBadge>
                  <div>
                    <div className="font-bold text-sm">{activity.action}</div>
                    <div className="text-console-dim text-xs">{activity.details}</div>
                  </div>
                </div>
                <div className="text-console-dim text-xs">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </AsciiFrame>
      </section>

      {/* Refresh Button */}
      <section className="text-center">
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className={`ascii-button ascii-button-primary ${loading ? 'opacity-50' : ''}`}
        >
          [ {loading ? 'Refreshing...' : 'Refresh Analytics'} ]
        </button>
      </section>
    </div>
  );
}