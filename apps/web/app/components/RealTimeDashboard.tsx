'use client';

import React, { useState, useEffect } from 'react';
import { AsciiFrame, AsciiTable, AsciiBadge } from './ascii';

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  age: string;
  risk: 'low' | 'medium' | 'high' | 'unknown';
  sentiment: number;
  socialScore: number;
  dexscreenerUrl?: string;
}

interface MarketStats {
  totalTokens: number;
  totalVolume: number;
  avgSentiment: number;
  topMeta: string;
  activeSignals: number;
}

export default function RealTimeDashboard() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalTokens: 0,
    totalVolume: 0,
    avgSentiment: 0,
    topMeta: 'Loading...',
    activeSignals: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      // Fetch from our API endpoints
      const [tokensResponse, statsResponse] = await Promise.all([
        fetch('/api/tokens/trending'),
        fetch('/api/market/stats')
      ]);

      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        setTokens(tokensData.slice(0, 10)); // Top 10 tokens
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMarketStats(statsData);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      // Fallback to sample data for demo
      setTokens(generateSampleTokens());
      setMarketStats({
        totalTokens: 1247,
        totalVolume: 2450000,
        avgSentiment: 0.65,
        topMeta: 'AI Agents',
        activeSignals: 8
      });
      setLastUpdate(new Date());
      setLoading(false);
    }
  };

  const generateSampleTokens = (): TokenData[] => {
    const sampleNames = ['PulseAI', 'MetaBot', 'CryptoGPT', 'AITrader', 'SmartDEX', 'NeuralNet', 'BlockAI', 'TokenGPT'];
    return sampleNames.map((name, index) => ({
      name,
      symbol: name.toUpperCase().slice(0, 4),
      price: Math.random() * 10,
      change24h: (Math.random() - 0.5) * 200,
      volume24h: Math.random() * 1000000,
      marketCap: Math.random() * 50000000,
      liquidity: Math.random() * 500000,
      age: `${Math.floor(Math.random() * 72)}h`,
      risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      sentiment: Math.random(),
      socialScore: Math.random() * 100
    }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'text-console-green';
      case 'medium': return 'text-console-yellow';
      case 'high': return 'text-console-red';
      default: return 'text-console-dim';
    }
  };

  const getSentimentEmoji = (sentiment: number): string => {
    if (sentiment >= 0.7) return '🚀';
    if (sentiment >= 0.5) return '📈';
    if (sentiment >= 0.3) return '📊';
    return '📉';
  };

  return (
    <div className="space-y-6">
      {!mounted ? (
        <div className="text-center py-8">
          <div className="text-console-dim">Loading real-time data...</div>
        </div>
      ) : (
        <>
          {/* Market Overview */}
          <AsciiFrame title="🔥 Live Market Pulse" variant="highlight">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-console-cyan text-2xl font-bold">{marketStats.totalTokens}</div>
                <div className="text-console-dim text-xs">Active Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-console-green text-2xl font-bold">{formatNumber(marketStats.totalVolume)}</div>
                <div className="text-console-dim text-xs">24h Volume</div>
              </div>
              <div className="text-center">
                <div className="text-console-yellow text-2xl font-bold">{(marketStats.avgSentiment * 100).toFixed(0)}%</div>
                <div className="text-console-dim text-xs">Avg Sentiment</div>
              </div>
          <div className="text-center">
            <div className="text-console-purple text-2xl font-bold">{marketStats.topMeta}</div>
            <div className="text-console-dim text-xs">Top Meta</div>
          </div>
          <div className="text-center">
            <div className="text-console-red text-2xl font-bold">{marketStats.activeSignals}</div>
            <div className="text-console-dim text-xs">AI Signals</div>
          </div>
        </div>
        <div className="text-center text-console-dim text-xs">
          Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
        </div>
      </AsciiFrame>

      {/* Top Tokens Table */}
      <AsciiFrame title="🧠 AI-Powered Top Tokens">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-console-cyan">[ SCANNING BLOCKCHAIN... ]</div>
            <div className="text-console-dim text-sm mt-2">AI analyzing market conditions...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-console-border">
                  <th className="text-left py-2 text-console-cyan">Token</th>
                  <th className="text-right py-2 text-console-cyan">Price</th>
                  <th className="text-right py-2 text-console-cyan">24h %</th>
                  <th className="text-right py-2 text-console-cyan">Volume</th>
                  <th className="text-right py-2 text-console-cyan">MCap</th>
                  <th className="text-center py-2 text-console-cyan">Risk</th>
                  <th className="text-center py-2 text-console-cyan">AI Score</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr key={index} className="border-b border-console-border hover:bg-console-panel">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-console-fg font-bold">{token.name}</span>
                        <span className="text-console-dim text-xs">({token.symbol})</span>
                        <span className="text-console-dim text-xs">{token.age}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-console-fg">{formatNumber(token.price)}</td>
                    <td className={`text-right py-2 ${token.change24h >= 0 ? 'text-console-green' : 'text-console-red'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 text-console-fg">{formatNumber(token.volume24h)}</td>
                    <td className="text-right py-2 text-console-fg">{formatNumber(token.marketCap)}</td>
                    <td className={`text-center py-2 ${getRiskColor(token.risk)}`}>
                      {token.risk.toUpperCase()}
                    </td>
                    <td className="text-center py-2">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-console-fg">{(token.sentiment * 100).toFixed(0)}</span>
                        <span>{getSentimentEmoji(token.sentiment)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsciiFrame>

      {/* AI Insights */}
      <AsciiFrame title="🤖 AI Market Insights">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="ascii-box p-4">
            <div className="text-console-green font-bold mb-2">🎯 Trending Meta</div>
            <div className="text-console-fg text-sm mb-1">{marketStats.topMeta}</div>
            <div className="text-console-dim text-xs">High social activity detected</div>
          </div>
          <div className="ascii-box p-4">
            <div className="text-console-yellow font-bold mb-2">⚡ Market Mood</div>
            <div className="text-console-fg text-sm mb-1">
              {marketStats.avgSentiment >= 0.7 ? 'Extremely Bullish' : 
               marketStats.avgSentiment >= 0.5 ? 'Bullish' : 
               marketStats.avgSentiment >= 0.3 ? 'Neutral' : 'Bearish'}
            </div>
            <div className="text-console-dim text-xs">Based on social sentiment</div>
          </div>
          <div className="ascii-box p-4">
            <div className="text-console-cyan font-bold mb-2">🔔 Active Alerts</div>
            <div className="text-console-fg text-sm mb-1">{marketStats.activeSignals} Buy Signals</div>
            <div className="text-console-dim text-xs">AI-filtered opportunities</div>
          </div>
        </div>
        <div className="text-center mt-4 text-console-dim text-xs">
          Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
        </div>
      </AsciiFrame>
        </>
      )}
    </div>
  );
}