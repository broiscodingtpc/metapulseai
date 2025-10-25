'use client';

import { AsciiFrame, AsciiBadge } from './ascii';

interface SentimentData {
  overall: {
    score: number;
    label: string;
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  categories: {
    [key: string]: {
      score: number;
      trend: 'up' | 'down' | 'stable';
      volume: number;
      tokenCount: number;
    };
  };
  signals: {
    buyPressure: number;
    sellPressure: number;
    momentum: number;
    volatility: number;
  };
  timestamp: string;
}

interface MarketSentimentProps {
  data: SentimentData;
}

export default function MarketSentiment({ data }: MarketSentimentProps) {
  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-console-green';
    if (score >= 50) return 'text-console-yellow';
    if (score >= 30) return 'text-console-orange';
    return 'text-console-red';
  };

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return '🐂';
      case 'bearish': return '🐻';
      case 'neutral': return '⚖️';
      default: return '📊';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '📊';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const getProgressBarColor = (value: number) => {
    if (value >= 70) return 'bg-console-green';
    if (value >= 50) return 'bg-console-yellow';
    if (value >= 30) return 'bg-console-orange';
    return 'bg-console-red';
  };

  return (
    <AsciiFrame title="Market Sentiment Analysis">
      <div className="space-y-6">
        {/* Overall Sentiment */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl">{getSentimentIcon(data.overall.trend)}</span>
            <div>
              <div className={`text-2xl font-bold ${getSentimentColor(data.overall.score)}`}>
                {data.overall.score}/100
              </div>
              <div className="text-sm text-console-dim">{data.overall.label}</div>
            </div>
          </div>
          <div className="text-console-dim text-sm">
            Confidence: {data.overall.confidence}% | Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Market Signals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-console-dim text-sm mb-1">Buy Pressure</div>
            <div className="relative bg-console-bg border border-console-dim rounded h-4 mb-1">
              <div 
                className={`h-full rounded ${getProgressBarColor(data.signals.buyPressure)}`}
                style={{ width: `${data.signals.buyPressure}%` }}
              />
            </div>
            <div className={getSentimentColor(data.signals.buyPressure)}>
              {data.signals.buyPressure}%
            </div>
          </div>

          <div className="text-center">
            <div className="text-console-dim text-sm mb-1">Sell Pressure</div>
            <div className="relative bg-console-bg border border-console-dim rounded h-4 mb-1">
              <div 
                className={`h-full rounded ${getProgressBarColor(100 - data.signals.sellPressure)}`}
                style={{ width: `${data.signals.sellPressure}%` }}
              />
            </div>
            <div className={getSentimentColor(100 - data.signals.sellPressure)}>
              {data.signals.sellPressure}%
            </div>
          </div>

          <div className="text-center">
            <div className="text-console-dim text-sm mb-1">Momentum</div>
            <div className="relative bg-console-bg border border-console-dim rounded h-4 mb-1">
              <div 
                className={`h-full rounded ${getProgressBarColor(data.signals.momentum)}`}
                style={{ width: `${data.signals.momentum}%` }}
              />
            </div>
            <div className={getSentimentColor(data.signals.momentum)}>
              {data.signals.momentum}%
            </div>
          </div>

          <div className="text-center">
            <div className="text-console-dim text-sm mb-1">Volatility</div>
            <div className="relative bg-console-bg border border-console-dim rounded h-4 mb-1">
              <div 
                className={`h-full rounded ${data.signals.volatility > 50 ? 'bg-console-red' : 'bg-console-green'}`}
                style={{ width: `${data.signals.volatility}%` }}
              />
            </div>
            <div className={data.signals.volatility > 50 ? 'text-console-red' : 'text-console-green'}>
              {data.signals.volatility}%
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-console-cyan font-bold mb-3">Category Sentiment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.categories).map(([category, categoryData]) => (
              <div key={category} className="border border-console-dim p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-console-cyan font-medium">{category}</span>
                  <div className="flex items-center gap-1">
                    <span className={getTrendIcon(categoryData.trend) === '↗️' ? 'text-console-green' : getTrendIcon(categoryData.trend) === '↘️' ? 'text-console-red' : 'text-console-dim'}>
                      {getTrendIcon(categoryData.trend)}
                    </span>
                    <AsciiBadge 
                      level={categoryData.score >= 70 ? 'high' : categoryData.score >= 50 ? 'medium' : 'low'} 
                      size="sm"
                    >
                      {categoryData.score}
                    </AsciiBadge>
                  </div>
                </div>
                <div className="text-sm text-console-dim space-y-1">
                  <div>Tokens: {categoryData.tokenCount}</div>
                  <div>Volume: ${formatNumber(categoryData.volume)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Health Indicators */}
        <div className="border-t border-console-dim pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-console-dim text-sm">Market Health</div>
              <div className={`text-lg font-bold ${getSentimentColor((data.signals.buyPressure + data.signals.momentum) / 2)}`}>
                {data.overall.score >= 70 ? 'HEALTHY' : data.overall.score >= 50 ? 'STABLE' : 'VOLATILE'}
              </div>
            </div>
            <div>
              <div className="text-console-dim text-sm">Risk Level</div>
              <div className={`text-lg font-bold ${data.signals.volatility > 70 ? 'text-console-red' : data.signals.volatility > 40 ? 'text-console-yellow' : 'text-console-green'}`}>
                {data.signals.volatility > 70 ? 'HIGH' : data.signals.volatility > 40 ? 'MEDIUM' : 'LOW'}
              </div>
            </div>
            <div>
              <div className="text-console-dim text-sm">Opportunity</div>
              <div className={`text-lg font-bold ${getSentimentColor(data.overall.score)}`}>
                {data.overall.score >= 70 ? 'STRONG' : data.overall.score >= 50 ? 'MODERATE' : 'WEAK'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AsciiFrame>
  );
}