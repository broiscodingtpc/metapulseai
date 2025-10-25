'use client';

import { AsciiFrame, AsciiBadge } from './ascii';

interface BuySignal {
  token: {
    symbol: string;
    name: string;
    address: string;
    score: number;
    category: string;
    riskLevel: string;
  };
  signal: {
    strength: 'strong' | 'moderate' | 'weak';
    confidence: number;
    reasons: string[];
    timestamp: string;
  };
  market: {
    price: number;
    marketCap: number;
    volume24h: number;
    change24h: number;
  };
}

interface BuySignalsProps {
  signals: BuySignal[];
  maxSignals?: number;
}

export default function BuySignals({ signals, maxSignals = 5 }: BuySignalsProps) {
  const sortedSignals = signals
    .sort((a, b) => b.signal.confidence - a.signal.confidence)
    .slice(0, maxSignals);

  const getSignalColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-console-green';
      case 'moderate': return 'text-console-yellow';
      case 'weak': return 'text-console-orange';
      default: return 'text-console-dim';
    }
  };

  const getSignalIcon = (strength: string) => {
    switch (strength) {
      case 'strong': return '🚀';
      case 'moderate': return '📈';
      case 'weak': return '📊';
      default: return '📉';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  if (!signals || signals.length === 0) {
    return (
      <AsciiFrame title="Buy Signals">
        <div className="text-center py-8 text-console-dim">
          No buy signals detected yet. AI is analyzing market conditions...
        </div>
      </AsciiFrame>
    );
  }

  return (
    <AsciiFrame title="AI Buy Signals">
      <div className="space-y-4">
        {sortedSignals.map((signal, index) => (
          <div key={signal.token.address} className="border border-console-dim p-4 rounded">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-console-cyan font-bold">{signal.token.symbol}</span>
                  <AsciiBadge 
                    level={signal.token.riskLevel === 'low' ? 'low' : signal.token.riskLevel === 'high' ? 'high' : 'medium'} 
                    size="sm"
                  >
                    {signal.token.riskLevel}
                  </AsciiBadge>
                </div>
                <div className="text-sm text-console-dim">{signal.token.name}</div>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 ${getSignalColor(signal.signal.strength)}`}>
                  {getSignalIcon(signal.signal.strength)}
                  <span className="font-bold uppercase">{signal.signal.strength}</span>
                </div>
                <div className="text-sm text-console-dim">
                  {signal.signal.confidence}% confidence
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
              <div>
                <div className="text-console-dim">Price</div>
                <div className="text-console-cyan">${signal.market.price.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-console-dim">Market Cap</div>
                <div className="text-console-yellow">${formatNumber(signal.market.marketCap)}</div>
              </div>
              <div>
                <div className="text-console-dim">Volume 24h</div>
                <div className="text-console-green">${formatNumber(signal.market.volume24h)}</div>
              </div>
              <div>
                <div className="text-console-dim">Change 24h</div>
                <div className={signal.market.change24h >= 0 ? 'text-console-green' : 'text-console-red'}>
                  {signal.market.change24h >= 0 ? '+' : ''}{signal.market.change24h.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-console-dim text-sm mb-1">AI Analysis:</div>
              <div className="space-y-1">
                {signal.signal.reasons.map((reason, idx) => (
                  <div key={idx} className="text-sm text-console-cyan">
                    • {reason}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-console-dim">
              <span>Score: {signal.token.score}/100</span>
              <span>Detected: {new Date(signal.signal.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </AsciiFrame>
  );
}