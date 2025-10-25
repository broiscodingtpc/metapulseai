'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { AsciiFrame, AsciiTable, AsciiBadge } from '../components/ascii';
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
  liquidity: number;
  holders: number;
  transactions: number;
}

interface FeedData {
  totalTokens: number;
  activeMetas: number;
  totalMarketCap: number;
  totalVolume: number;
  newTokens: TokenData[];
  topMetas: any[];
}

function TokensPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'marketCap' | 'volume' | 'change24h'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<string[]>([]);

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

  useEffect(() => {
    const meta = searchParams.get('meta');
    if (meta) {
      setSelectedCategory(meta);
    }
  }, [searchParams]);

  useEffect(() => {
    const stored = localStorage.getItem('tokenWatchlist');
    if (stored) {
      setWatchlist(JSON.parse(stored));
    }
  }, []);

  const handleRefresh = () => {
    mutate();
  };

  const toggleWatchlist = (tokenAddress: string) => {
    setWatchlist(prev => {
      const isWatched = prev.includes(tokenAddress);
      const updated = isWatched
        ? prev.filter(addr => addr !== tokenAddress)
        : [...prev, tokenAddress];
      
      localStorage.setItem('tokenWatchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isWatched = (tokenAddress: string) => {
    return watchlist.includes(tokenAddress);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const getScoreLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const filteredAndSortedTokens = data?.newTokens
    ?.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || token.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    ?.sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'score': return (a.score - b.score) * multiplier;
        case 'marketCap': return (a.marketCap - b.marketCap) * multiplier;
        case 'volume': return (a.volume - b.volume) * multiplier;
        case 'change24h': return (a.change24h - b.change24h) * multiplier;
        default: return 0;
      }
    }) || [];

  const categories = ['all', ...new Set(data?.newTokens?.map(token => token.category) || [])];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <AsciiFrame title="Loading">
          <div className="text-center py-8">
            <div className="text-console-cyan mb-4">Loading tokens...</div>
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
            <div className="text-console-red mb-4">Failed to load tokens</div>
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
        <h1 className="text-4xl font-bold mb-4">MetaPulse Token Explorer</h1>
        <p className="text-console-dim mb-6">Discover and analyze tokens with AI-powered insights</p>
      </section>

      {/* Filters */}
      <section>
        <AsciiFrame title="Filters & Search">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-console-fg font-bold mb-2">SEARCH:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or symbol..."
                className="ascii-input w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-console-fg font-bold mb-2">CATEGORY:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="ascii-input w-full"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-console-fg font-bold mb-2">SORT BY:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="ascii-input w-full"
                >
                  <option value="score">Score</option>
                  <option value="marketCap">Market Cap</option>
                  <option value="volume">Volume</option>
                  <option value="change24h">24h Change</option>
                </select>
              </div>

              <div>
                <label className="block text-console-fg font-bold mb-2">ORDER:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="ascii-input w-full"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-console-grid">
              <div className="text-console-dim text-sm">
                Found {filteredAndSortedTokens.length} tokens
              </div>
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className={`ascii-button ascii-button-primary ${isLoading ? 'opacity-50' : ''}`}
              >
                [ {isLoading ? 'Refreshing...' : 'Refresh'} ]
              </button>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Tokens Table */}
      <section>
        <AsciiFrame title="Token List">
          <AsciiTable
            columns={[
              { key: 'symbol', header: 'Symbol', width: '15%' },
              { key: 'name', header: 'Name', width: '20%' },
              { key: 'score', header: 'Score', width: '10%', align: 'center' },
              { key: 'category', header: 'Category', width: '15%' },
              { key: 'marketCap', header: 'Market Cap', width: '15%', align: 'right' },
              { key: 'change24h', header: '24h %', width: '10%', align: 'right' },
              { key: 'actions', header: 'Actions', width: '15%', align: 'center' }
            ]}
            data={filteredAndSortedTokens.map(token => ({
              ...token,
              marketCap: `$${formatNumber(token.marketCap)}`,
              change24h: `${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(2)}%`,
              score: (
                <AsciiBadge level={getScoreLevel(token.score)} size="sm">
                  {token.score}
                </AsciiBadge>
              ),
              actions: (
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => toggleWatchlist(token.address)}
                    className={`ascii-button text-xs ${
                      isWatched(token.address) ? 'ascii-button-primary' : ''
                    }`}
                    title={isWatched(token.address) ? 'Remove from watchlist' : 'Add to watchlist'}
                  >
                    [ {isWatched(token.address) ? '★' : '☆'} ]
                  </button>
                </div>
              )
            }))}
            maxRows={50}
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
          <Link href="/feed" className="ascii-button">
            [ Live Feed ]
          </Link>
          <Link href="/metas" className="ascii-button">
            [ Browse Metas ]
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-96">
        <AsciiFrame title="Loading">
          <div className="text-center py-8">
            <div className="text-console-cyan">Loading tokens...</div>
          </div>
        </AsciiFrame>
      </div>
    }>
      <TokensPageContent />
    </Suspense>
  );
}