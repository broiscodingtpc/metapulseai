'use client';

import { useState, useEffect } from 'react';
import { AsciiFrame, AsciiBadge } from './ascii';

interface TwitterSentiment {
  token: string;
  mentions: number;
  sentiment: number;
  engagement: number;
  trending: boolean;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface SentimentData {
  overall: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: string[];
  topTokens: TwitterSentiment[];
  marketMood: string;
  socialVolume: number;
}

export default function MarketSentiment() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentimentData();
    const interval = setInterval(fetchSentimentData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSentimentData = async () => {
    try {
      setError(null);
      
      // First get trending tokens
      const tokensResponse = await fetch('/api/tokens/trending');
      if (!tokensResponse.ok) throw new Error('Failed to fetch tokens');
      
      const tokensData = await tokensResponse.json();
      const topTokens = tokensData.tokens?.slice(0, 8) || [];
      
      if (topTokens.length === 0) {
        throw new Error('No tokens available for sentiment analysis');
      }
      
      // Get Twitter sentiment for these tokens
      const twitterResponse = await fetch('/api/social/twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokens: topTokens.map((t: any) => t.symbol) 
        })
      });
      
      if (!twitterResponse.ok) throw new Error('Failed to fetch Twitter sentiment');
      
      const twitterData = await twitterResponse.json();
      const sentiments = twitterData.results || [];
      
      // Calculate overall market sentiment
      const overallSentiment = sentiments.reduce((sum: number, s: TwitterSentiment) => sum + s.sentiment, 0) / sentiments.length;
      const totalMentions = sentiments.reduce((sum: number, s: TwitterSentiment) => sum + s.mentions, 0);
      const avgEngagement = sentiments.reduce((sum: number, s: TwitterSentiment) => sum + s.engagement, 0) / sentiments.length;
      
      // Determine trend
      let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (overallSentiment > 0.15) trend = 'bullish';
      else if (overallSentiment < -0.15) trend = 'bearish';
      
      // Calculate confidence based on volume and consistency
      const sentimentVariance = sentiments.reduce((sum: number, s: TwitterSentiment) => 
        sum + Math.pow(s.sentiment - overallSentiment, 2), 0) / sentiments.length;
      const confidence = Math.max(0.3, Math.min(0.95, (totalMentions / 100) * (1 - sentimentVariance) * avgEngagement));
      
      // Generate signals
      const signals: string[] = [];
      const trendingTokens = sentiments.filter((s: TwitterSentiment) => s.trending);
      
      if (trendingTokens.length > 0) {
        signals.push(`${trendingTokens.length} tokens trending on social media`);
      }
      
      if (overallSentiment > 0.3) {
        signals.push('Strong bullish sentiment detected');
      } else if (overallSentiment < -0.3) {
        signals.push('Strong bearish sentiment detected');
      }
      
      if (totalMentions > 80) {
        signals.push('High social media activity');
      } else if (totalMentions < 30) {
        signals.push('Low social media activity');
      }
      
      if (avgEngagement > 0.6) {
        signals.push('High engagement rates');
      }
      
      // Determine market mood
      let marketMood = 'Neutral';
      if (trend === 'bullish' && confidence > 0.7) marketMood = 'Very Bullish';
      else if (trend === 'bullish') marketMood = 'Bullish';
      else if (trend === 'bearish' && confidence > 0.7) marketMood = 'Very Bearish';
      else if (trend === 'bearish') marketMood = 'Bearish';
      
      setSentimentData({
        overall: overallSentiment,
        trend,
        confidence,
        signals: signals.length > 0 ? signals : ['Market sentiment is neutral'],
        topTokens: sentiments.slice(0, 5),
        marketMood,
        socialVolume: totalMentions
      });
      
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sentiment data');
    } finally {
      setLoading(false);
    }
  };
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.2) return 'text-console-green';
    if (sentiment < -0.2) return 'text-console-red';
    return 'text-console-yellow';
  };

  const getSentimentIcon = (sentiment: number): string => {
    if (sentiment > 0.2) return '↗';
    if (sentiment < -0.2) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <AsciiFrame title="Market Sentiment Analysis">
        <div className="text-center py-8">
          <div className="text-console-cyan mb-2">Analyzing social sentiment...</div>
          <div className="text-console-dim text-sm">Processing Twitter data</div>
        </div>
      </AsciiFrame>
    );
  }

  if (error || !sentimentData) {
    return (
      <AsciiFrame title="Market Sentiment Analysis" variant="highlight">
        <div className="text-center py-8">
          <div className="text-console-red mb-4">{error || 'No sentiment data available'}</div>
          <button 
            onClick={fetchSentimentData}
            className="ascii-button ascii-button-primary"
          >
            [ Retry ]
          </button>
        </div>
      </AsciiFrame>
    );
  }

  return (
    <AsciiFrame title="Market Sentiment Analysis">
      <div className="space-y-6">
        {/* Overall Sentiment */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            <span className={getSentimentColor(sentimentData.overall)}>
              {getSentimentIcon(sentimentData.overall)} {sentimentData.marketMood}
            </span>
          </div>
          <div className="text-console-dim text-sm mb-4">
            Confidence: {Math.round(sentimentData.confidence * 100)}% | 
            Social Volume: {sentimentData.socialVolume} mentions
          </div>
          <AsciiBadge 
            level={sentimentData.trend === 'bullish' ? 'high' : sentimentData.trend === 'bearish' ? 'low' : 'medium'}
          >
            {sentimentData.trend.toUpperCase()}
          </AsciiBadge>
        </div>

        {/* Sentiment Signals */}
        <div>
          <h3 className="text-lg font-bold mb-3">Market Signals</h3>
          <div className="space-y-2">
            {sentimentData.signals.map((signal, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-console-cyan">•</span>
                <span className="text-sm">{signal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tokens by Social Sentiment */}
        <div>
          <h3 className="text-lg font-bold mb-3">Social Sentiment Leaders</h3>
          <div className="space-y-3">
            {sentimentData.topTokens.map((token, index) => (
              <div key={token.token} className="flex items-center justify-between p-3 border border-console-dim rounded">
                <div className="flex items-center gap-3">
                  <span className="font-bold">{index + 1}.</span>
                  <span className="font-mono">${token.token}</span>
                  {token.trending && (
                    <AsciiBadge level="high">TRENDING</AsciiBadge>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getSentimentColor(token.sentiment)}`}>
                    {getSentimentIcon(token.sentiment)} {(token.sentiment * 100).toFixed(0)}%
                  </div>
                  <div className="text-console-dim text-xs">
                    {token.mentions} mentions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center pt-4">
          <button 
            onClick={fetchSentimentData}
            className="ascii-button ascii-button-primary"
            disabled={loading}
          >
            [ Refresh Analysis ]
          </button>
        </div>
      </div>
    </AsciiFrame>
  );
}