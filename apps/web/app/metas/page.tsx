'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { AsciiFrame, AsciiTable, AsciiBadge } from '../components/ascii';
import { fetcher } from '../lib/swr-config';

export const dynamic = 'force-dynamic';

interface MetaData {
  category: string;
  averageScore: number;
  tokenCount: number;
  topTokens: string[];
  marketCap: number;
  volume: number;
  change24h: number;
  trend: 'up' | 'down' | 'stable';
}

interface FeedData {
  totalTokens: number;
  activeMetas: number;
  totalMarketCap: number;
  totalVolume: number;
  newTokens: any[];
  topMetas: MetaData[];
}

export default function MetasPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'score' | 'tokens' | 'marketCap' | 'volume'>('score');
  const [selectedMeta, setSelectedMeta] = useState<MetaData | null>(null);
  const [trackedMetas, setTrackedMetas] = useState<string[]>([]);
  
  const { data, error, isLoading, mutate } = useSWR<FeedData>(
    '/api/feed',
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  const handleViewTokens = (category: string) => {
    router.push(`/tokens?meta=${encodeURIComponent(category)}`);
  };

  const handleTrackMeta = (category: string) => {
    if (trackedMetas.includes(category)) {
      setTrackedMetas(prev => prev.filter(m => m !== category));
    } else {
      setTrackedMetas(prev => [...prev, category]);
    }
  };

  const isMetaTracked = (category: string) => {
    return trackedMetas.includes(category);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-console-green';
    if (score >= 60) return 'text-console-yellow';
    if (score >= 40) return 'text-console-orange';
    return 'text-console-red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'BULLISH';
    if (score >= 60) return 'POSITIVE';
    if (score >= 40) return 'NEUTRAL';
    return 'BEARISH';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-console-green';
      case 'down': return 'text-console-red';
      default: return 'text-console-dim';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const sortedMetas = data?.topMetas?.sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.averageScore - a.averageScore;
      case 'tokens':
        return b.tokenCount - a.tokenCount;
      case 'marketCap':
        return b.marketCap - a.marketCap;
      case 'volume':
        return b.volume - a.volume;
      default:
        return 0;
    }
  }) || [];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <AsciiFrame title="Loading">
          <div className="text-center py-8">
            <div className="text-console-cyan mb-4">Analyzing meta trends...</div>
            <div className="text-console-dim">Please wait...</div>
          </div>
        </AsciiFrame>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <AsciiFrame title="Error" variant="highlight">
          <div className="text-center py-8">
            <div className="text-console-red mb-4">Failed to load meta data</div>
            <div className="text-console-dim mb-4">Please try again later</div>
            <button 
              onClick={handleRefresh}
              className="ascii-button ascii-button-primary"
            >
              [ Retry ]
            </button>
          </div>
        </AsciiFrame>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Meta Trend Analysis</h1>
        <p className="text-console-dim mb-6">AI-powered categorization and trend detection across market narratives</p>
      </section>

      {/* Stats */}
      <section>
        <AsciiFrame title="Market Overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-console-cyan mb-1">
                {data?.activeMetas || 0}
              </div>
              <div className="text-sm text-console-dim">Active Metas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-console-green mb-1">
                {data?.totalTokens || 0}
              </div>
              <div className="text-sm text-console-dim">Total Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-console-yellow mb-1">
                ${formatNumber(data?.totalMarketCap || 0)}
              </div>
              <div className="text-sm text-console-dim">Market Cap</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-console-orange mb-1">
                ${formatNumber(data?.totalVolume || 0)}
              </div>
              <div className="text-sm text-console-dim">24h Volume</div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Controls */}
      <section>
        <AsciiFrame title="Controls">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-console-dim">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="ascii-select"
              >
                <option value="score">Average Score</option>
                <option value="tokens">Token Count</option>
                <option value="marketCap">Market Cap</option>
                <option value="volume">Volume</option>
              </select>
            </div>
            <button 
              onClick={handleRefresh}
              className="ascii-button ascii-button-primary"
              disabled={isLoading}
            >
              [ {isLoading ? 'Refreshing...' : 'Refresh'} ]
            </button>
          </div>
        </AsciiFrame>
      </section>

      {/* Meta Categories */}
      <section>
        <AsciiFrame title="Meta Categories">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMetas.map((meta, index) => (
              <div 
                key={meta.category}
                className="ascii-card cursor-pointer hover:bg-console-bg-light transition-colors"
                onClick={() => setSelectedMeta(meta)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-console-cyan font-bold mb-1">{meta.category}</h3>
                    <div className="text-console-dim text-sm">{meta.tokenCount} tokens</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-xl ${getScoreColor(meta.averageScore)}`}>
                      {meta.averageScore.toFixed(1)}
                    </div>
                    <div className="text-console-dim text-xs">
                      {getScoreLabel(meta.averageScore)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-console-dim">Market Cap</span>
                    <span className="text-console-white">${formatNumber(meta.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-console-dim">Volume 24h</span>
                    <span className="text-console-white">${formatNumber(meta.volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-console-dim">24h Change</span>
                    <span className={getTrendColor(meta.trend)}>
                      {getTrendIcon(meta.trend)} {meta.change24h >= 0 ? '+' : ''}{meta.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-console-border">
                  <div className="text-console-dim text-xs mb-2">Top Tokens</div>
                  <div className="flex flex-wrap gap-1">
                    {meta.topTokens.slice(0, 3).map((token, i) => (
                      <AsciiBadge key={i} level="info" size="sm">
                        {token}
                      </AsciiBadge>
                    ))}
                    {meta.topTokens.length > 3 && (
                      <AsciiBadge level="info" size="sm">
                        +{meta.topTokens.length - 3}
                      </AsciiBadge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AsciiFrame>
      </section>

      {/* Meta Detail Modal */}
      {selectedMeta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <AsciiFrame title={`Meta: ${selectedMeta.category}`} variant="highlight">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-console-dim text-sm mb-1">Average Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedMeta.averageScore)}`}>
                      {selectedMeta.averageScore.toFixed(1)}
                    </div>
                    <div className="text-console-dim text-xs">
                      {getScoreLabel(selectedMeta.averageScore)}
                    </div>
                  </div>
                  <div>
                    <div className="text-console-dim text-sm mb-1">Token Count</div>
                    <div className="text-2xl font-bold text-console-cyan">
                      {selectedMeta.tokenCount}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-console-dim text-sm mb-1">Market Cap</div>
                    <div className="text-xl font-bold text-console-yellow">
                      ${formatNumber(selectedMeta.marketCap)}
                    </div>
                  </div>
                  <div>
                    <div className="text-console-dim text-sm mb-1">24h Volume</div>
                    <div className="text-xl font-bold text-console-orange">
                      ${formatNumber(selectedMeta.volume)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-console-dim text-sm mb-2">All Tokens</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeta.topTokens.map((token, i) => (
                      <AsciiBadge key={i} level="info">
                        {token}
                      </AsciiBadge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setSelectedMeta(null)}
                    className="ascii-button flex-1"
                  >
                    [ Close ]
                  </button>
                  <button 
                    onClick={() => handleViewTokens(selectedMeta.category)}
                    className="ascii-button ascii-button-primary flex-1"
                  >
                    [ View Tokens ]
                  </button>
                  <button 
                    onClick={() => handleTrackMeta(selectedMeta.category)}
                    className={`ascii-button flex-1 ${
                      isMetaTracked(selectedMeta.category) ? 'ascii-button-primary' : ''
                    }`}
                  >
                    [ {isMetaTracked(selectedMeta.category) ? 'Untrack' : 'Track'} Meta ]
                  </button>
                </div>
              </div>
            </AsciiFrame>
          </div>
        </div>
      )}
    </div>
  );
}