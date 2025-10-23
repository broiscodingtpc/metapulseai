'use client';

import useSWR from 'swr';
import dynamicImport from 'next/dynamic';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, BarChart3, RefreshCw, Database, Zap, Target } from 'lucide-react';
import AnimatedText from '../components/AnimatedText';
import CyberButton from '../components/CyberButton';
import PageNav from '../components/PageNav';
import TokenCard from '../components/TokenCard';
import ElectricBorder from '../components/ElectricBorder';
import MetallicPaint from '../components/MetallicPaint';
import { fetcher } from '../lib/swr-config';

// Dynamic imports
const OrbBackground = dynamicImport(() => import('../components/OrbBackground'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-gradient-to-b from-[#05060a] to-[#0a0b0f]" />
});

const AIActivity = dynamicImport(() => import('../components/AIActivity'), {
  loading: () => (
    <ElectricBorder color="#00e5ff" speed={0.6} chaos={0.3} thickness={1.5}>
      <div className="h-64 animate-pulse bg-slate-900/50 rounded-lg" />
    </ElectricBorder>
  )
});

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
          <CyberButton onClick={handleRefresh} variant="primary">
            Retry Connection
          </CyberButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] relative overflow-hidden">
      <OrbBackground colors={['#00e5ff', '#3fa9ff', '#7a5cff']} count={3} />
      <PageNav />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <AnimatedText>
            <h1 className="text-center mb-4">
              <MetallicPaint gradientColors={['#00e5ff', '#3fa9ff', '#7a5cff', '#00e5ff']}>
                Live Market Intelligence
              </MetallicPaint>
            </h1>
          </AnimatedText>
          
          <AnimatedText delay={0.2}>
            <p className="text-center text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
              Real-time AI-powered analysis of token markets and emerging trends
            </p>
          </AnimatedText>

          <AnimatedText delay={0.3}>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">AI ACTIVE</span>
              </div>
              <div className="w-px h-4 bg-slate-700"></div>
              <CyberButton onClick={handleRefresh} variant="primary" size="sm" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </CyberButton>
              <div className="w-px h-4 bg-slate-700"></div>
              <span className="text-slate-500 text-sm">
                Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
              </span>
            </div>
          </AnimatedText>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {[
            { icon: Database, label: "Total Tokens", value: data?.totalTokens || 0, color: "#00e5ff" },
            { icon: Target, label: "Active Metas", value: data?.activeMetas || 0, color: "#7a5cff" },
            { icon: DollarSign, label: "Market Cap", value: `$${formatNumber(data?.totalMarketCap || 0)}`, color: "#3fa9ff" },
            { icon: BarChart3, label: "Volume 24h", value: `$${formatNumber(data?.totalVolume || 0)}`, color: "#00e5ff" }
          ].map((stat, index) => (
            <AnimatedText key={index} delay={0.1 * index}>
              <ElectricBorder
                color={stat.color}
                speed={0.5}
                chaos={0.2}
                thickness={1}
                style={{ borderRadius: 12 }}
              >
                <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">{stat.value}</p>
                </div>
              </ElectricBorder>
            </AnimatedText>
          ))}
        </div>

        {/* New Tokens */}
        <AnimatedText delay={0.4}>
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">
                <MetallicPaint>Recent Detections</MetallicPaint>
              </h2>
              <span className="text-slate-500 text-sm">
                <Zap className="w-4 h-4 inline mr-1" />
                {data?.newTokens?.length || 0} tokens
              </span>
            </div>
            
            <ElectricBorder
              color="#00e5ff"
              speed={0.8}
              chaos={0.4}
              thickness={1.5}
              style={{ borderRadius: 16 }}
            >
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-6 rounded-2xl">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory horizontal-scroll -mx-2 px-2">
                    {data?.newTokens?.map((token, index) => (
                      <div key={token.address} className="snap-start">
                        <TokenCard token={token} index={index} />
                      </div>
                    ))}
                    {(!data?.newTokens || data.newTokens.length === 0) && (
                      <div className="w-full text-center py-12">
                        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-lg">Scanning for new tokens</p>
                        <p className="text-slate-600 text-sm mt-2">AI analysis in progress</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ElectricBorder>
          </div>
        </AnimatedText>

        {/* AI Activity & Top Metas */}
        <div className="grid lg:grid-cols-2 gap-8">
          <AnimatedText delay={0.5}>
            <AIActivity />
          </AnimatedText>

          <AnimatedText delay={0.6}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">
                  <MetallicPaint gradientColors={['#7a5cff', '#3fa9ff', '#00e5ff', '#7a5cff']}>
                    Meta Trends
                  </MetallicPaint>
                </h2>
                <span className="text-slate-500 text-sm">
                  {data?.topMetas?.length || 0} categories
                </span>
              </div>
              
              <ElectricBorder
                color="#7a5cff"
                speed={0.6}
                chaos={0.3}
                thickness={1.5}
                style={{ borderRadius: 16 }}
              >
                <div className="bg-gradient-to-br from-purple-950/80 to-slate-950/80 backdrop-blur-xl p-6 rounded-2xl">
                  <div className="space-y-3">
                    {data?.topMetas?.map((meta, index) => (
                      <motion.div
                        key={meta.category}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold uppercase tracking-wide text-sm">
                            {meta.category}
                          </h3>
                          <span className="text-slate-500 text-xs">
                            {meta.tokenCount} tokens
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                            <span className="text-slate-400 text-sm">
                              Score: {meta.averageScore.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-purple-400 text-xs font-mono">
                            {meta.topTokens.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {(!data?.topMetas || data.topMetas.length === 0) && (
                      <div className="text-center py-8">
                        <Target className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500">Analyzing meta trends</p>
                      </div>
                    )}
                  </div>
                </div>
              </ElectricBorder>
            </div>
          </AnimatedText>
        </div>
      </main>
    </div>
  );
}
