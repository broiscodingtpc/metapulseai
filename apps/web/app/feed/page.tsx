'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { AsciiFrame, AsciiLog, AsciiBadge, AsciiTable } from '../components/ascii';
import BuySignals from '../components/BuySignals';
import MarketSentiment from '../components/MarketSentiment';
import { fetcher } from '../lib/swr-config';

export const dynamic = 'force-dynamic';

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  score: number;
  category: string;
  marketCap: number;
  volume: number;
  price: number;
  change24h: number;
  detectedAt?: string;
  riskLevel?: string;
  marketCapSol?: number;
  solAmount?: number;
  supply?: number;
}

interface MetaData {
  category: string;
  averageScore: number;
  tokenCount: number;
  topTokens: string[];
}

interface FeedData {
  totalTokens: number;
  activeMetas: number;
  totalMarketCap: number;
  totalVolume: number;
  newTokens: TokenData[];
  topMetas: MetaData[];
  timestamp?: string;
  lastUpdate?: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, error, isLoading, mutate } = useSWR<FeedData>(
    '/api/feed',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  const processTokens = (tokens: TokenData[] = []) => {
    if (!tokens.length) return { filtered: [], counts: { latest: 0, topScoring: 0, watchlist: 0, all: 0 } };

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const limitedTokens = tokens.slice(0, 100);
    
    const processedTokens = limitedTokens.map((token, index) => {
      const detectedTime = token.detectedAt ? new Date(token.detectedAt) : new Date();
      const isRecent = detectedTime > oneHourAgo;
      const isTopScoring = token.score >= 75;
      const isWatchlist = token.score >= 60 && token.score < 75;
      
      return {
        ...token,
        isRecent,
        isTopScoring,
        isWatchlist
      };
    });

    const counts = {
      latest: processedTokens.filter(t => t.isRecent).length,
      topScoring: processedTokens.filter(t => t.isTopScoring).length,
      watchlist: processedTokens.filter(t => t.isWatchlist).length,
      all: processedTokens.length
    };

    let filtered = processedTokens;
    switch (activeFilter) {
      case 'latest':
        filtered = processedTokens.filter(t => t.isRecent);
        break;
      case 'topScoring':
        filtered = processedTokens.filter(t => t.isTopScoring);
        break;
      case 'watchlist':
        filtered = processedTokens.filter(t => t.isWatchlist);
        break;
      default:
        filtered = processedTokens;
    }

    return { filtered, counts };
  };

  // Generate mock buy signals from high-scoring tokens
  const generateBuySignals = (tokens: TokenData[]) => {
    return tokens
      .filter(token => token.score >= 65) // Only high-scoring tokens
      .slice(0, 5) // Top 5
      .map(token => ({
        token: {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          score: token.score,
          category: token.category,
          riskLevel: token.riskLevel || 'medium'
        },
        signal: {
          strength: (token.score >= 80 ? 'strong' : token.score >= 70 ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak',
          confidence: Math.min(95, token.score + Math.floor(Math.random() * 10)),
          reasons: [
            `High AI score of ${token.score}/100`,
            `Strong ${token.category} category performance`,
            token.riskLevel === 'low' ? 'Low risk profile detected' : 'Acceptable risk level',
            'Positive market momentum indicators'
          ],
          timestamp: token.detectedAt || new Date().toISOString()
        },
        market: {
          price: token.price,
          marketCap: token.marketCap,
          volume24h: token.volume,
          change24h: token.change24h
        }
      }));
  };

  // Generate market sentiment data
  const generateMarketSentiment = (tokens: TokenData[], metas: MetaData[]) => {
    const avgScore = tokens.length > 0 ? tokens.reduce((sum, t) => sum + t.score, 0) / tokens.length : 50;
    const bullishTokens = tokens.filter(t => t.score >= 70).length;
    const totalTokens = tokens.length || 1;
    
    return {
      overall: {
        score: Math.round(avgScore),
        label: avgScore >= 70 ? 'BULLISH' : avgScore >= 50 ? 'NEUTRAL' : 'BEARISH',
        trend: (avgScore >= 60 ? 'bullish' : avgScore >= 40 ? 'neutral' : 'bearish') as 'bullish' | 'bearish' | 'neutral',
        confidence: Math.round(85 + Math.random() * 10)
      },
      categories: metas.reduce((acc, meta) => {
        acc[meta.category] = {
          score: meta.averageScore,
          trend: 'stable' as 'up' | 'down' | 'stable', // Default to stable since change24h is not available
          volume: 0, // Default volume since not available in MetaData
          tokenCount: meta.tokenCount
        };
        return acc;
      }, {} as any),
      signals: {
        buyPressure: Math.round((bullishTokens / totalTokens) * 100),
        sellPressure: Math.round(30 + Math.random() * 40),
        momentum: Math.round(avgScore * 0.8 + Math.random() * 20),
        volatility: Math.round(40 + Math.random() * 30)
      },
      timestamp: data?.timestamp || new Date().toISOString()
    };
  };

  const buySignals = data?.newTokens ? generateBuySignals(data.newTokens) : [];
  const marketSentiment = data ? generateMarketSentiment(data.newTokens || [], data.topMetas || []) : null;

  const { filtered: filteredTokens, counts } = processTokens(data?.newTokens);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  // Convert tokens to log entries for AsciiLog
  const tokenLogEntries = filteredTokens.map((token, index) => ({
    id: token.address,
    timestamp: token.detectedAt ? new Date(token.detectedAt) : new Date(),
    type: (token.score >= 75 ? 'success' : token.score >= 60 ? 'info' : 'warn') as 'info' | 'warn' | 'error' | 'success',
    message: `${token.symbol} detected - Score: ${token.score} | ${token.category}`,
    details: `Market Cap: $${formatNumber(token.marketCap)} | Risk: ${token.riskLevel || 'Unknown'}`
  }));

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <AsciiFrame title="Loading">
          <div className="text-center py-8">
            <div className="text-console-cyan mb-4">Loading market intelligence...</div>
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
            <div className="text-console-red mb-4">Failed to load market data</div>
            <button 
              onClick={handleRefresh}
              className="ascii-button ascii-button-danger"
            >
              [ Retry Connection ]
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
        <h1 className="text-4xl font-bold mb-4">Live Market Intelligence</h1>
        <p className="text-console-dim mb-6">Real-time AI-powered analysis of token markets</p>
        
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`ascii-button ${isLoading ? 'opacity-50' : ''}`}
          >
            [ {isLoading ? 'Refreshing...' : 'Refresh'} ]
          </button>
          <span className="text-console-dim text-sm">
            Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
          </span>
        </div>
      </section>

      {/* Stats */}
      <section>
        <AsciiFrame title="Market Overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-console-cyan mb-1">
                {data?.totalTokens || 0}
              </div>
              <div className="text-sm text-console-dim">Total Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-console-green mb-1">
                {data?.activeMetas || 0}
              </div>
              <div className="text-sm text-console-dim">Active Metas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-console-yellow mb-1">
                ${formatNumber(data?.totalMarketCap || 0)}
              </div>
              <div className="text-sm text-console-dim">Market Cap</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-console-cyan mb-1">
                ${formatNumber(data?.totalVolume || 0)}
              </div>
              <div className="text-sm text-console-dim">Volume 24h</div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Filters */}
      <section>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'latest', label: 'Latest', count: counts.latest },
            { id: 'topScoring', label: 'Top Scoring', count: counts.topScoring },
            { id: 'watchlist', label: 'Watchlist', count: counts.watchlist }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`ascii-button ${
                activeFilter === filter.id ? 'ascii-button-primary' : ''
              }`}
            >
              [ {filter.label} ({filter.count}) ]
            </button>
          ))}
        </div>
      </section>

      {/* Market Sentiment */}
      {marketSentiment && (
        <section>
          <MarketSentiment />
        </section>
      )}

      {/* Buy Signals */}
      <section>
        <BuySignals />
      </section>

      {/* Meta Categories */}
      <section>
        <AsciiFrame title="Top Meta Categories">
          {data?.topMetas && data.topMetas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.topMetas.map((meta, index) => (
                <div key={meta.category} className="border border-console-dim p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-console-cyan font-bold">{meta.category}</h3>
                    <AsciiBadge level={meta.averageScore >= 70 ? 'high' : meta.averageScore >= 50 ? 'medium' : 'low'} size="sm">
                      {meta.averageScore}
                    </AsciiBadge>
                  </div>
                  <div className="text-sm text-console-dim space-y-1">
                    <div>Tokens: {meta.tokenCount}</div>
                    <div>Avg Score: {meta.averageScore}</div>
                    <div className="text-console-dim">
                      → Stable
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link href={`/metas?category=${encodeURIComponent(meta.category)}`} className="ascii-button ascii-button-sm">
                      [ View Details ]
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-console-dim">
              No meta categories available yet. Bot is analyzing tokens...
            </div>
          )}
        </AsciiFrame>
      </section>

      {/* Token Feed */}
      <section>
        <AsciiFrame title="Token Detection Feed">
          <AsciiLog
            entries={tokenLogEntries}
            maxHeight="500px"
            autoScroll={true}
            liveUpdate={true}
            className="mb-4"
          />
          
          <div className="text-console-dim text-xs text-center">
            Showing {filteredTokens.length} of {data?.newTokens?.length || 0} detected tokens
          </div>
        </AsciiFrame>
      </section>

      {/* Token Table */}
      <section>
        <AsciiFrame title="Token Analysis Table">
          <AsciiTable
            columns={[
              { key: 'symbol', header: 'Symbol', width: '20%' },
              { key: 'name', header: 'Name', width: '25%' },
              { key: 'score', header: 'Score', width: '10%', align: 'center' },
              { key: 'category', header: 'Category', width: '15%' },
              { key: 'marketCap', header: 'Market Cap', width: '15%', align: 'right' },
              { key: 'riskLevel', header: 'Risk', width: '15%', align: 'center' }
            ]}
            data={filteredTokens.map(token => ({
              ...token,
              marketCap: `$${formatNumber(token.marketCap)}`,
              score: (
                <div className="flex items-center gap-2">
                  <span className={token.score >= 70 ? 'text-console-green' : token.score >= 50 ? 'text-console-yellow' : 'text-console-red'}>
                    {token.score}
                  </span>
                  {token.score >= 70 && <span className="text-console-green">🚀</span>}
                  {token.score >= 80 && <span className="text-console-cyan">⭐</span>}
                </div>
              ),
              category: (
                <AsciiBadge 
                  level={token.category === 'meme' ? 'medium' : token.category === 'defi' ? 'high' : 'low'} 
                  size="sm"
                >
                  {token.category}
                </AsciiBadge>
              ),
              riskLevel: token.riskLevel ? (
                <AsciiBadge 
                  level={token.riskLevel === 'low' ? 'low' : token.riskLevel === 'high' ? 'high' : 'medium'} 
                  size="sm"
                >
                  {token.riskLevel}
                </AsciiBadge>
              ) : 'Unknown'
            }))}
            maxRows={20}
            onRowClick={(token) => {
                console.log('Token selected:', token.symbol);
                // Navigate to token detail page
                router.push(`/token/${token.address}`);
              }}
          />
        </AsciiFrame>
      </section>

      {/* Navigation */}
      <section className="text-center">
        <div className="flex justify-center gap-4">
          <Link href="/" className="ascii-button">
            [ Back to Home ]
          </Link>
          <Link href="/tokens" className="ascii-button">
            [ All Tokens ]
          </Link>
          <Link href="/metas" className="ascii-button">
            [ Browse Metas ]
          </Link>
        </div>
      </section>
    </div>
  );
}
