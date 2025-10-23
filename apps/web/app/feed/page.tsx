'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Activity, DollarSign, BarChart3, RefreshCw, Database, Target } from 'lucide-react';
import PageNav from '../components/PageNav';
import TokenList from '../components/TokenList';
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
  const [activeFilter, setActiveFilter] = useState('all');
  
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

  // Simplified token processing with pagination
  const processTokens = (tokens: TokenData[] = []) => {
    if (!tokens.length) return { filtered: [], counts: { latest: 0, topScoring: 0, watchlist: 0, all: 0 } };

    // Limit to maximum 20 tokens for performance
    const limitedTokens = tokens.slice(0, 20);

    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);

    const processedTokens = limitedTokens.map((token, index) => {
      const detectedTime = token.detectedAt ? new Date(token.detectedAt).getTime() : now;
      const isNew = detectedTime > oneHourAgo;
      const isTopScoring = (token.score > 50) && (token.riskLevel !== 'HIGH');
      const isWatchlist = (token.score >= 35 && token.score <= 50);

      return {
        ...token,
        isNew,
        isTrending: isTopScoring,
        isWatchlist
      };
    });

    // Simple sort by score descending
    const sortedTokens = processedTokens.sort((a, b) => b.score - a.score);

    const counts = {
      latest: processedTokens.filter(t => t.isNew).length,
      topScoring: processedTokens.filter(t => t.isTrending).length,
      watchlist: processedTokens.filter(t => t.isWatchlist).length,
      all: processedTokens.length
    };

    let filtered = sortedTokens;
    switch (activeFilter) {
      case 'latest':
        filtered = sortedTokens.filter(t => t.isNew);
        break;
      case 'topScoring':
        filtered = sortedTokens.filter(t => t.isTrending);
        break;
      case 'watchlist':
        filtered = sortedTokens.filter(t => t.isWatchlist);
        break;
      default:
        filtered = sortedTokens;
    }

    return { filtered, counts };
  };

  const { filtered: filteredTokens, counts } = processTokens(data?.newTokens);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load market data</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PageNav />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-center text-3xl font-bold text-white mb-4">
            Live Market Intelligence
          </h1>
          
          <p className="text-center text-slate-400 mb-6">
            Real-time AI-powered analysis of token markets
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 font-semibold text-sm">AI ACTIVE</span>
            </div>
            <button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <span className="text-slate-500 text-sm">
              Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
            </span>
          </div>
        </div>

        {/* Simple Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Database, label: "Total Tokens", value: data?.totalTokens || 0 },
            { icon: Target, label: "Active Metas", value: data?.activeMetas || 0 },
            { icon: DollarSign, label: "Market Cap", value: `$${formatNumber(data?.totalMarketCap || 0)}` },
            { icon: BarChart3, label: "Volume 24h", value: `$${formatNumber(data?.totalVolume || 0)}` }
          ].map((stat, index) => (
            <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Simple Token Filters */}
        <div className="mb-6">
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
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800/70'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Simple Token List */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {activeFilter === 'latest' && 'Just Created'}
              {activeFilter === 'topScoring' && 'Top Scoring Tokens'}
              {activeFilter === 'watchlist' && 'Watchlist Candidates'}
              {activeFilter === 'all' && 'Recent Detections'}
            </h2>
            <span className="text-slate-500 text-sm">
              {filteredTokens.length} tokens
            </span>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-hidden">
            {/* Simple Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-slate-800/50 border-b border-slate-700/50 text-xs text-slate-400 font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Token</div>
              <div className="col-span-3 text-center">Scores</div>
              <div className="col-span-2 text-center">Market</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            
            {/* Token List */}
            <div>
              {filteredTokens.map((token, index) => (
                <TokenList key={token.address} token={token} index={index} />
              ))}
              {filteredTokens.length === 0 && (
                <div className="w-full text-center py-12">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">
                    {activeFilter === 'latest' && 'No new tokens in the last hour'}
                    {activeFilter === 'topScoring' && 'No top scoring tokens found'}
                    {activeFilter === 'watchlist' && 'No watchlist candidates'}
                    {activeFilter === 'all' && 'Scanning for new tokens'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
