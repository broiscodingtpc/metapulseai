'use client';

import { useState, useEffect } from 'react';
import { AsciiFrame, AsciiBadge } from './ascii';

interface TradingSignal {
  id: string;
  token: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  price: number;
  confidence: number;
  reason: string;
  timestamp: string;
  indicators: {
    technical: number; // -1 to 1
    social: number; // -1 to 1
    volume: number; // 0 to 1
    momentum: number; // -1 to 1
  };
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
}

export default function BuySignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTradingSignals();
    const interval = setInterval(fetchTradingSignals, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchTradingSignals = async () => {
    try {
      setError(null);
      
      // Get trending tokens data
      const tokensResponse = await fetch('/api/tokens/trending');
      if (!tokensResponse.ok) throw new Error('Failed to fetch tokens');
      
      const tokensData = await tokensResponse.json();
      const tokens = tokensData.tokens?.slice(0, 10) || [];
      
      if (tokens.length === 0) {
        throw new Error('No tokens available for signal generation');
      }
      
      // Get social sentiment data
      const socialResponse = await fetch('/api/social/twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokens: tokens.map((t: any) => t.symbol) 
        })
      });
      
      const socialData = socialResponse.ok ? await socialResponse.json() : { results: [] };
      const sentiments = socialData.results || [];
      
      // Generate trading signals based on real data
      const generatedSignals: TradingSignal[] = [];
      
      tokens.forEach((token: any, index: number) => {
        const sentiment = sentiments.find((s: any) => s.token === token.symbol) || { sentiment: 0, engagement: 0, trending: false };
        
        // Technical analysis based on price action and volume
        const priceChange24h = token.change24h || 0;
        const volume24h = token.volume || 0;
        const liquidity = token.liquidity || 0;
        const marketCap = token.marketCap || 0;
        
        // Calculate technical score
        let technicalScore = 0;
        if (priceChange24h > 10) technicalScore += 0.3;
        else if (priceChange24h > 5) technicalScore += 0.1;
        else if (priceChange24h < -10) technicalScore -= 0.3;
        else if (priceChange24h < -5) technicalScore -= 0.1;
        
        // Volume analysis
        const volumeScore = Math.min(1, volume24h / 100000); // Normalize volume
        if (volumeScore > 0.7) technicalScore += 0.2;
        else if (volumeScore < 0.3) technicalScore -= 0.1;
        
        // Liquidity check
        if (liquidity > 50000) technicalScore += 0.1;
        else if (liquidity < 10000) technicalScore -= 0.2;
        
        // Social sentiment score
        const socialScore = sentiment.sentiment || 0;
        const engagementBonus = sentiment.engagement > 0.5 ? 0.1 : 0;
        const trendingBonus = sentiment.trending ? 0.2 : 0;
        
        // Momentum calculation
        const momentumScore = (priceChange24h / 100) + (socialScore * 0.5);
        
        // Overall signal strength
        const overallScore = technicalScore + socialScore + engagementBonus + trendingBonus;
        
        // Determine signal type and strength
        let signalType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK';
        let confidence = Math.max(0.3, Math.min(0.95, Math.abs(overallScore) * 0.8 + 0.2));
        
        if (overallScore > 0.4) {
          signalType = 'BUY';
          strength = overallScore > 0.7 ? 'STRONG' : 'MODERATE';
        } else if (overallScore < -0.4) {
          signalType = 'SELL';
          strength = overallScore < -0.7 ? 'STRONG' : 'MODERATE';
        }
        
        // Generate reason
        let reason = '';
        const reasons = [];
        
        if (priceChange24h > 10) reasons.push('Strong price momentum');
        else if (priceChange24h > 5) reasons.push('Positive price action');
        else if (priceChange24h < -10) reasons.push('Sharp price decline');
        
        if (volumeScore > 0.7) reasons.push('High trading volume');
        if (socialScore > 0.3) reasons.push('Positive social sentiment');
        else if (socialScore < -0.3) reasons.push('Negative social sentiment');
        
        if (sentiment.trending) reasons.push('Trending on social media');
        if (liquidity > 100000) reasons.push('High liquidity');
        else if (liquidity < 10000) reasons.push('Low liquidity risk');
        
        reason = reasons.length > 0 ? reasons.slice(0, 2).join(', ') : 'Market analysis';
        
        // Calculate target price and stop loss
        const currentPrice = token.price || 0;
        let targetPrice, stopLoss;
        
        if (signalType === 'BUY') {
          targetPrice = currentPrice * (1 + (strength === 'STRONG' ? 0.25 : strength === 'MODERATE' ? 0.15 : 0.08));
          stopLoss = currentPrice * 0.9; // 10% stop loss
        } else if (signalType === 'SELL') {
          targetPrice = currentPrice * (1 - (strength === 'STRONG' ? 0.15 : strength === 'MODERATE' ? 0.1 : 0.05));
          stopLoss = currentPrice * 1.1; // 10% stop loss for short
        }
        
        // Only include signals with reasonable confidence
        if (confidence > 0.4 && (signalType !== 'HOLD' || index < 3)) {
          generatedSignals.push({
            id: `signal_${token.address}_${Date.now()}`,
            token: token.symbol,
            type: signalType,
            strength,
            price: currentPrice,
            confidence,
            reason,
            timestamp: new Date().toISOString(),
            indicators: {
              technical: technicalScore,
              social: socialScore,
              volume: volumeScore,
              momentum: momentumScore
            },
            targetPrice,
            stopLoss,
            timeframe: strength === 'STRONG' ? '1-3 days' : strength === 'MODERATE' ? '3-7 days' : '1-2 weeks'
          });
        }
      });
      
      // Sort by confidence and limit to top 8 signals
      const sortedSignals = generatedSignals
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8);
      
      setSignals(sortedSignals);
      
    } catch (err) {
      console.error('Error fetching trading signals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trading signals');
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (type: string): string => {
    switch (type) {
      case 'BUY': return 'text-console-green';
      case 'SELL': return 'text-console-red';
      default: return 'text-console-yellow';
    }
  };

  const getSignalIcon = (type: string): string => {
    switch (type) {
      case 'BUY': return '↗';
      case 'SELL': return '↘';
      default: return '→';
    }
  };

  const getStrengthLevel = (strength: string): 'high' | 'medium' | 'low' => {
    switch (strength) {
      case 'STRONG': return 'high';
      case 'MODERATE': return 'medium';
      default: return 'low';
    }
  };

  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AsciiFrame title="Trading Signals">
        <div className="text-center py-8">
          <div className="text-console-cyan mb-2">Analyzing market data...</div>
          <div className="text-console-dim text-sm">Generating trading signals</div>
        </div>
      </AsciiFrame>
    );
  }

  if (error) {
    return (
      <AsciiFrame title="Trading Signals" variant="highlight">
        <div className="text-center py-8">
          <div className="text-console-red mb-4">{error}</div>
          <button 
            onClick={fetchTradingSignals}
            className="ascii-button ascii-button-primary"
          >
            [ Retry ]
          </button>
        </div>
      </AsciiFrame>
    );
  }

  if (signals.length === 0) {
    return (
      <AsciiFrame title="Trading Signals">
        <div className="text-center py-8">
          <div className="text-console-dim mb-4">No strong signals detected</div>
          <div className="text-console-dim text-sm">Market conditions are neutral</div>
        </div>
      </AsciiFrame>
    );
  }

  return (
    <AsciiFrame title="Trading Signals">
      <div className="space-y-4">
        {signals.map((signal) => (
          <div key={signal.id} className="border border-console-dim p-4 rounded">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${getSignalColor(signal.type)}`}>
                  {getSignalIcon(signal.type)}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold font-mono">${signal.token}</span>
                    <AsciiBadge level={getStrengthLevel(signal.strength)}>
                      {signal.type}
                    </AsciiBadge>
                    <AsciiBadge level="medium" size="sm">
                      {signal.strength}
                    </AsciiBadge>
                  </div>
                  <div className="text-console-dim text-sm">
                    {formatTime(signal.timestamp)} • {signal.timeframe}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${formatPrice(signal.price)}</div>
                <div className="text-console-dim text-sm">
                  {Math.round(signal.confidence * 100)}% confidence
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm text-console-dim mb-1">Analysis:</div>
              <div className="text-sm">{signal.reason}</div>
            </div>
            
            {(signal.targetPrice || signal.stopLoss) && (
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                {signal.targetPrice && (
                  <div>
                    <span className="text-console-dim">Target: </span>
                    <span className="text-console-green font-bold">
                      ${formatPrice(signal.targetPrice)}
                    </span>
                  </div>
                )}
                {signal.stopLoss && (
                  <div>
                    <span className="text-console-dim">Stop Loss: </span>
                    <span className="text-console-red font-bold">
                      ${formatPrice(signal.stopLoss)}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="text-console-dim">Technical</div>
                <div className={signal.indicators.technical > 0 ? 'text-console-green' : signal.indicators.technical < 0 ? 'text-console-red' : 'text-console-yellow'}>
                  {(signal.indicators.technical * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-console-dim">Social</div>
                <div className={signal.indicators.social > 0 ? 'text-console-green' : signal.indicators.social < 0 ? 'text-console-red' : 'text-console-yellow'}>
                  {(signal.indicators.social * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-console-dim">Volume</div>
                <div className="text-console-cyan">
                  {(signal.indicators.volume * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-console-dim">Momentum</div>
                <div className={signal.indicators.momentum > 0 ? 'text-console-green' : signal.indicators.momentum < 0 ? 'text-console-red' : 'text-console-yellow'}>
                  {(signal.indicators.momentum * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="text-center pt-4">
          <button 
            onClick={fetchTradingSignals}
            className="ascii-button ascii-button-primary"
            disabled={loading}
          >
            [ Refresh Signals ]
          </button>
        </div>
      </div>
    </AsciiFrame>
  );
}