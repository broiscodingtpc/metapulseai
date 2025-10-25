'use client';

import { useState, useEffect } from 'react';
import { AsciiFrame, AsciiBadge } from './ascii';
import ClientOnly from './ClientOnly';

interface LiveMeta {
  id: string;
  category: string;
  trending: boolean;
  tokens: {
    symbol: string;
    name: string;
    address: string;
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
    score: number;
  }[];
  performance: {
    avgGain: number;
    topGainer: string;
    totalVolume: number;
    activeTokens: number;
  };
  lastUpdate: string;
}

interface LiveMetasProps {
  maxMetas?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

function LiveMetasContent({ 
  maxMetas = 6, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: LiveMetasProps) {
  const [metas, setMetas] = useState<LiveMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize lastUpdate only after component is mounted
  useEffect(() => {
    if (mounted) {
      setLastUpdate(new Date());
    }
  }, [mounted]);

  // Mock data generator for live metas
  const generateLiveMetas = (): LiveMeta[] => {
    const categories = [
      { name: 'AI Agents', trending: true, baseScore: 85 },
      { name: 'Gaming', trending: true, baseScore: 78 },
      { name: 'Meme Coins', trending: false, baseScore: 72 },
      { name: 'DeFi', trending: false, baseScore: 68 },
      { name: 'Celebrity', trending: true, baseScore: 82 },
      { name: 'Seasonal', trending: false, baseScore: 65 },
      { name: 'Art & NFT', trending: false, baseScore: 70 },
      { name: 'Sports', trending: true, baseScore: 75 }
    ];

    return categories.slice(0, maxMetas).map((cat, index) => {
      const tokenCount = Math.floor(Math.random() * 8) + 3; // 3-10 tokens per meta
      const tokens = Array.from({ length: tokenCount }, (_, i) => {
        const basePrice = Math.random() * 0.01 + 0.0001;
        const change = (Math.random() - 0.3) * 200; // Bias towards positive
        
        return {
          symbol: `${cat.name.slice(0, 3).toUpperCase()}${i + 1}`,
          name: `${cat.name} Token ${i + 1}`,
          address: `${Math.random().toString(36).substring(2, 15)}...`,
          price: basePrice,
          change24h: change,
          volume24h: Math.random() * 500000 + 50000,
          marketCap: Math.random() * 10000000 + 1000000,
          score: cat.baseScore + Math.floor(Math.random() * 20) - 10
        };
      }).sort((a, b) => b.score - a.score);

      const avgGain = tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length;
      const topGainer = tokens.reduce((top, current) => 
        current.change24h > top.change24h ? current : top
      );
      const totalVolume = tokens.reduce((sum, t) => sum + t.volume24h, 0);

      return {
        id: `meta-${index}`,
        category: cat.name,
        trending: cat.trending,
        tokens,
        performance: {
          avgGain: Math.round(avgGain * 100) / 100,
          topGainer: topGainer.symbol,
          totalVolume,
          activeTokens: tokens.length
        },
        lastUpdate: new Date().toISOString()
      };
    });
  };

  const fetchLiveMetas = async () => {
    try {
      setIsLoading(true);
      console.log('[LiveMetas] Fetching live metas from API...');
      
      // Fetch real data from API
      const response = await fetch('/api/live-metas');
      
      console.log('[LiveMetas] API response:', {
        ok: response.ok,
        status: response.status
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[LiveMetas] API data received:', data);
        
        if (data.success && data.data) {
          console.log('[LiveMetas] Using REAL data from API');
          setMetas(data.data.slice(0, maxMetas));
          setLastUpdate(new Date());
          return;
        }
      }
      
      throw new Error(`API call failed - Status: ${response.status}`);
    } catch (error) {
      console.error('[LiveMetas] Error fetching live metas:', error);
      console.error('[LiveMetas] FALLING BACK TO MOCK DATA - This should not happen in production!');
      
      // Fallback to mock data
      const newMetas = generateLiveMetas();
      // Mark as mock data
      const mockMetas = newMetas.map(meta => ({
        ...meta,
        name: `${meta.name} (MOCK)`
      }));
      setMetas(mockMetas);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    fetchLiveMetas();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLiveMetas, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [mounted, autoRefresh, refreshInterval]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'AI Agents': '🤖',
      'Gaming': '🎮',
      'Meme Coins': '😂',
      'DeFi': '💰',
      'Celebrity': '⭐',
      'Seasonal': '🎃',
      'Art & NFT': '🎨',
      'Sports': '⚽'
    };
    return icons[category] || '📊';
  };

  if (isLoading && metas.length === 0) {
    return (
      <AsciiFrame title="Live Metas">
        <div className="text-center py-8 text-console-dim">
          <div className="animate-pulse">Loading live meta data...</div>
        </div>
      </AsciiFrame>
    );
  }

  return (
    <AsciiFrame title="Live Metas">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-console-dim text-sm">
            Last updated: {mounted && lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </div>
          <button
            onClick={fetchLiveMetas}
            disabled={isLoading}
            className="px-3 py-1 bg-console-dark border border-console-dim text-console-cyan hover:bg-console-dim/20 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metas.map((meta) => (
            <div key={meta.id} className="border border-console-dim p-4 rounded bg-console-dark/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(meta.category)}</span>
                  <span className="text-console-cyan font-bold">{meta.category}</span>
                </div>
                {meta.trending && (
                  <AsciiBadge level="high" size="sm">
                    🔥 HOT
                  </AsciiBadge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <div className="text-console-dim">Avg Gain</div>
                  <div className={meta.performance.avgGain >= 0 ? 'text-console-green' : 'text-console-red'}>
                    {meta.performance.avgGain >= 0 ? '+' : ''}{meta.performance.avgGain.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-console-dim">Top Gainer</div>
                  <div className="text-console-yellow">{meta.performance.topGainer}</div>
                </div>
                <div>
                  <div className="text-console-dim">Volume</div>
                  <div className="text-console-green">${formatNumber(meta.performance.totalVolume)}</div>
                </div>
                <div>
                  <div className="text-console-dim">Tokens</div>
                  <div className="text-console-cyan">{meta.performance.activeTokens}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-console-dim text-xs mb-1">Top Tokens:</div>
                {meta.tokens.slice(0, 3).map((token, idx) => (
                  <div key={token.address} className="flex justify-between items-center text-xs">
                    <span className="text-console-cyan">{token.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-console-dim">${token.price.toFixed(6)}</span>
                      <span className={token.change24h >= 0 ? 'text-console-green' : 'text-console-red'}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-console-dim/30">
                <div className="text-xs text-console-dim">
                  Updated: {new Date(meta.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-console-dim text-sm mt-6">
          <div>🔄 Auto-refresh every {refreshInterval / 1000}s</div>
          <div className="mt-1">📈 Real-time meta tracking powered by AI</div>
        </div>
      </div>
    </AsciiFrame>
  );
}

export default function LiveMetas(props: LiveMetasProps) {
  return (
    <ClientOnly fallback={
      <AsciiFrame title="LIVE METAS" className="h-96">
        <div className="flex items-center justify-center h-full text-console-dim">
          Loading live metas...
        </div>
      </AsciiFrame>
    }>
      <LiveMetasContent {...props} />
    </ClientOnly>
  );
}