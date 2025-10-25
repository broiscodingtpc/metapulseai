'use client';

import React, { useState, useEffect } from 'react';
import { AsciiFrame } from './ascii';

interface SentimentData {
  token: string;
  symbol: string;
  overallSentiment: number;
  socialVolume: number;
  sources: {
    twitter: { sentiment: number; mentions: number };
    reddit: { sentiment: number; mentions: number };
    telegram: { sentiment: number; mentions: number };
    discord: { sentiment: number; mentions: number };
  };
  keywords: string[];
  trendingScore: number;
  lastUpdated: Date;
}

interface SentimentTrend {
  timestamp: Date;
  sentiment: number;
  volume: number;
}

export default function SentimentAnalyzer() {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'sources'>('overview');

  useEffect(() => {
    fetchSentimentData();
    const interval = setInterval(fetchSentimentData, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchSentimentData = async () => {
    try {
      const response = await fetch('/api/sentiment/analyze');
      if (response.ok) {
        const data = await response.json();
        setSentimentData(data);
        if (data.length > 0 && !selectedToken) {
          setSelectedToken(data[0].token);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      // Generate sample data for demo
      setSentimentData(generateSampleSentimentData());
      setLoading(false);
    }
  };

  const generateSampleSentimentData = (): SentimentData[] => {
    const tokens = ['PulseAI', 'MetaBot', 'CryptoGPT', 'AITrader', 'SmartDEX'];
    return tokens.map(token => ({
      token,
      symbol: token.toUpperCase().slice(0, 4),
      overallSentiment: 0.3 + Math.random() * 0.6, // 0.3 to 0.9
      socialVolume: Math.floor(Math.random() * 10000),
      sources: {
        twitter: {
          sentiment: 0.2 + Math.random() * 0.7,
          mentions: Math.floor(Math.random() * 5000)
        },
        reddit: {
          sentiment: 0.2 + Math.random() * 0.7,
          mentions: Math.floor(Math.random() * 2000)
        },
        telegram: {
          sentiment: 0.2 + Math.random() * 0.7,
          mentions: Math.floor(Math.random() * 3000)
        },
        discord: {
          sentiment: 0.2 + Math.random() * 0.7,
          mentions: Math.floor(Math.random() * 1500)
        }
      },
      keywords: ['bullish', 'moon', 'gem', 'potential', 'buy'].slice(0, Math.floor(Math.random() * 3) + 2),
      trendingScore: Math.random() * 100,
      lastUpdated: new Date()
    }));
  };

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment >= 0.7) return 'text-console-green';
    if (sentiment >= 0.5) return 'text-console-yellow';
    if (sentiment >= 0.3) return 'text-console-cyan';
    return 'text-console-red';
  };

  const getSentimentEmoji = (sentiment: number): string => {
    if (sentiment >= 0.8) return '🚀';
    if (sentiment >= 0.6) return '📈';
    if (sentiment >= 0.4) return '📊';
    if (sentiment >= 0.2) return '📉';
    return '💀';
  };

  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment >= 0.8) return 'Extremely Bullish';
    if (sentiment >= 0.6) return 'Bullish';
    if (sentiment >= 0.4) return 'Neutral';
    if (sentiment >= 0.2) return 'Bearish';
    return 'Extremely Bearish';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const selectedTokenData = sentimentData.find(data => data.token === selectedToken);

  return (
    <div className="space-y-6">
      <AsciiFrame title="🧠 AI Sentiment Analysis" variant="highlight">
        <div className="space-y-4">
          {/* Token Selector */}
          <div className="flex flex-wrap gap-2">
            {sentimentData.map((data) => (
              <button
                key={data.token}
                onClick={() => setSelectedToken(data.token)}
                className={`ascii-button text-sm ${
                  selectedToken === data.token ? 'ascii-button-primary' : ''
                }`}
              >
                {data.token} {getSentimentEmoji(data.overallSentiment)}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-console-border">
            {(['overview', 'trends', 'sources'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm capitalize ${
                  activeTab === tab
                    ? 'text-console-cyan border-b-2 border-console-cyan'
                    : 'text-console-dim hover:text-console-fg'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-console-cyan">[ ANALYZING SOCIAL SENTIMENT... ]</div>
              <div className="text-console-dim text-sm mt-2">Processing social media data...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && selectedTokenData && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="ascii-box p-4 text-center">
                      <div className={`text-3xl font-bold ${getSentimentColor(selectedTokenData.overallSentiment)}`}>
                        {(selectedTokenData.overallSentiment * 100).toFixed(0)}%
                      </div>
                      <div className="text-console-dim text-sm">Overall Sentiment</div>
                      <div className="text-lg mt-1">{getSentimentEmoji(selectedTokenData.overallSentiment)}</div>
                      <div className={`text-xs mt-1 ${getSentimentColor(selectedTokenData.overallSentiment)}`}>
                        {getSentimentLabel(selectedTokenData.overallSentiment)}
                      </div>
                    </div>
                    
                    <div className="ascii-box p-4 text-center">
                      <div className="text-console-yellow text-3xl font-bold">
                        {formatNumber(selectedTokenData.socialVolume)}
                      </div>
                      <div className="text-console-dim text-sm">Social Volume</div>
                      <div className="text-lg mt-1">📢</div>
                      <div className="text-console-dim text-xs mt-1">24h mentions</div>
                    </div>
                    
                    <div className="ascii-box p-4 text-center">
                      <div className="text-console-purple text-3xl font-bold">
                        {selectedTokenData.trendingScore.toFixed(0)}
                      </div>
                      <div className="text-console-dim text-sm">Trending Score</div>
                      <div className="text-lg mt-1">🔥</div>
                      <div className="text-console-dim text-xs mt-1">Viral potential</div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="ascii-box p-4">
                    <div className="text-console-cyan font-bold mb-2">🏷️ Trending Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTokenData.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-console-panel text-console-fg text-xs rounded border border-console-border"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sources Tab */}
              {activeTab === 'sources' && selectedTokenData && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(selectedTokenData.sources).map(([platform, data]) => (
                      <div key={platform} className="ascii-box p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {platform === 'twitter' ? '🐦' : 
                               platform === 'reddit' ? '🤖' : 
                               platform === 'telegram' ? '✈️' : '🎮'}
                            </span>
                            <span className="font-bold capitalize">{platform}</span>
                          </div>
                          <span className={`text-sm ${getSentimentColor(data.sentiment)}`}>
                            {(data.sentiment * 100).toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-console-dim">Mentions:</span>
                            <span className="text-console-fg">{formatNumber(data.mentions)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-console-dim">Sentiment:</span>
                            <span className={getSentimentColor(data.sentiment)}>
                              {getSentimentLabel(data.sentiment)}
                            </span>
                          </div>
                          
                          {/* Sentiment Bar */}
                          <div className="w-full bg-console-panel h-2 rounded">
                            <div
                              className={`h-full rounded ${
                                data.sentiment >= 0.6 ? 'bg-console-green' :
                                data.sentiment >= 0.4 ? 'bg-console-yellow' : 'bg-console-red'
                              }`}
                              style={{ width: `${data.sentiment * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="ascii-box p-4">
                  <div className="text-console-cyan font-bold mb-4">📈 Sentiment Trends (24h)</div>
                  <div className="text-center text-console-dim py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <div>Sentiment trend charts coming soon...</div>
                    <div className="text-sm mt-2">Real-time sentiment tracking and historical analysis</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Last Updated */}
          {selectedTokenData && (
            <div className="text-center text-console-dim text-xs">
              Last updated: {selectedTokenData.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </AsciiFrame>
    </div>
  );
}