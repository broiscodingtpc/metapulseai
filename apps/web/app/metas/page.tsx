'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import dynamicImport from 'next/dynamic';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, BarChart3, Target, Zap, Filter } from 'lucide-react';
import AnimatedText from '../components/AnimatedText';
import CyberButton from '../components/CyberButton';
import PageNav from '../components/PageNav';
import ElectricBorder from '../components/ElectricBorder';
import MetallicPaint from '../components/MetallicPaint';
import LiquidEther from '../components/LiquidEther';
import Noise from '../components/Noise';
import { fetcher } from '../lib/swr-config';

const OrbBackground = dynamicImport(() => import('../components/OrbBackground'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-gradient-to-b from-[#05060a] to-[#0a0b0f]" />
});

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

  useEffect(() => {
    const stored = localStorage.getItem('trackedMetas');
    if (stored) {
      setTrackedMetas(JSON.parse(stored));
    }
  }, []);

  const handleViewTokens = (category: string) => {
    router.push(`/tokens?meta=${encodeURIComponent(category)}`);
  };

  const handleTrackMeta = (category: string) => {
    setTrackedMetas((prev) => {
      const isTracked = prev.includes(category);
      const updated = isTracked
        ? prev.filter((m) => m !== category)
        : [...prev, category];
      
      localStorage.setItem('trackedMetas', JSON.stringify(updated));
      return updated;
    });
  };

  const isMetaTracked = (category: string) => {
    return trackedMetas.includes(category);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'MODERATE';
    return 'WEAK';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-slate-500';
    }
  };

  const sortedMetas = data?.topMetas
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.averageScore - a.averageScore;
        case 'tokens': return b.tokenCount - a.tokenCount;
        case 'marketCap': return b.marketCap - a.marketCap;
        case 'volume': return b.volume - a.volume;
        default: return 0;
      }
    }) || [];

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Analyzing meta trends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load meta data</p>
          <CyberButton onClick={handleRefresh} variant="primary">
            Retry Connection
          </CyberButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] relative overflow-hidden">
      {/* Interactive Background */}
      <div className="absolute inset-0 w-full h-full">
        <LiquidEther 
          colors={['#5227FF', '#FF9FFC', '#B19EEF']} 
          mouseForce={20} 
          cursorSize={100} 
          isViscous={false} 
          viscous={30} 
          iterationsViscous={32} 
          iterationsPoisson={32} 
          resolution={0.5} 
          isBounce={false} 
          autoDemo={true} 
          autoSpeed={0.5} 
          autoIntensity={2.2} 
          takeoverDuration={0.25} 
          autoResumeDelay={3000} 
          autoRampDuration={0.6} 
        />
        <Noise 
          patternSize={250} 
          patternScaleX={1} 
          patternScaleY={1} 
          patternRefreshInterval={2} 
          patternAlpha={15} 
        />
      </div>
      <PageNav />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-16">
          <AnimatedText>
            <h1 className="text-center mb-4">
              <MetallicPaint gradientColors={['#7a5cff', '#3fa9ff', '#00e5ff', '#7a5cff']}>
                Meta Trend Analysis
              </MetallicPaint>
            </h1>
          </AnimatedText>
          
          <AnimatedText delay={0.2}>
            <p className="text-center text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
              AI-powered categorization and trend detection across market narratives
            </p>
          </AnimatedText>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {[
            { icon: Target, label: "Active Metas", value: data?.activeMetas || 0, color: "#7a5cff" },
            { icon: Activity, label: "Total Tokens", value: data?.totalTokens || 0, color: "#00e5ff" },
            { icon: BarChart3, label: "Market Cap", value: `$${formatNumber(data?.totalMarketCap || 0)}`, color: "#3fa9ff" },
            { icon: TrendingUp, label: "Volume 24h", value: `$${formatNumber(data?.totalVolume || 0)}`, color: "#00e5ff" }
          ].map((stat, index) => (
            <AnimatedText key={index} delay={0.1 * index}>
              <ElectricBorder color={stat.color} speed={0.5} chaos={0.2} thickness={1} style={{ borderRadius: 12 }}>
                <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-5 rounded-xl text-center">
                  <stat.icon className="w-6 h-6 mx-auto mb-2" style={{ color: stat.color }} />
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-space-grotesk">{stat.value}</p>
                </div>
              </ElectricBorder>
            </AnimatedText>
          ))}
        </div>

        {/* Controls */}
        <div className="mb-8">
          <ElectricBorder color="#00e5ff" speed={0.4} chaos={0.2} thickness={1} style={{ borderRadius: 12 }}>
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-4 rounded-xl">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Filter className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300 font-medium uppercase tracking-wide text-sm">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="score">Average Score</option>
                    <option value="tokens">Token Count</option>
                    <option value="marketCap">Market Cap</option>
                    <option value="volume">Volume</option>
                  </select>
                </div>
                
                <CyberButton onClick={handleRefresh} variant="primary" size="sm" disabled={isLoading}>
                  <Zap className={`w-4 h-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
                  {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
                </CyberButton>
              </div>
            </div>
          </ElectricBorder>
        </div>

        {/* Meta Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMetas.map((meta, index) => (
            <AnimatedText key={meta.category} delay={0.05 * index}>
              <ElectricBorder
                color={index % 3 === 0 ? "#7a5cff" : index % 3 === 1 ? "#00e5ff" : "#3fa9ff"}
                speed={0.5}
                chaos={0.2}
                thickness={1.5}
                style={{ borderRadius: 16 }}
              >
                <div 
                  className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                  onClick={() => setSelectedMeta(meta)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg uppercase">
                          {meta.category.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold uppercase tracking-wide text-sm">{meta.category}</h3>
                        <p className="text-slate-500 text-xs">{meta.tokenCount} tokens</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-xl ${getScoreColor(meta.averageScore)}`}>
                        {meta.averageScore.toFixed(1)}
                      </div>
                      <div className="text-slate-500 text-xs uppercase tracking-wider">
                        {getScoreLabel(meta.averageScore)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Market Cap</span>
                      <span className="text-white font-mono">${formatNumber(meta.marketCap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Volume 24h</span>
                      <span className="text-white font-mono">${formatNumber(meta.volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">24h Change</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(meta.trend)}
                        <span className={`font-semibold font-mono ${getTrendColor(meta.trend)}`}>
                          {meta.change24h >= 0 ? '+' : ''}{meta.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs uppercase tracking-wider">Top Tokens</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {meta.topTokens.slice(0, 3).map((token, idx) => (
                          <span key={idx} className="text-cyan-400 text-xs bg-cyan-500/10 px-2 py-1 rounded font-mono">
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ElectricBorder>
            </AnimatedText>
          ))}
        </div>

        {/* AI Insights */}
        <div className="mt-16">
          <AnimatedText>
            <ElectricBorder
              color="#3fa9ff"
              speed={0.7}
              chaos={0.4}
              thickness={2}
              style={{ borderRadius: 24 }}
            >
              <div className="bg-gradient-to-br from-blue-950/80 via-slate-950/80 to-purple-950/80 backdrop-blur-xl p-12 rounded-3xl text-center">
                <h2 className="text-4xl font-bold mb-4">
                  <MetallicPaint>AI Intelligence Engine</MetallicPaint>
                </h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                  Advanced algorithms continuously analyze blockchain patterns, social sentiment, 
                  and trading activity to identify emerging trends before mainstream adoption.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { icon: Target, title: "Trend Detection", desc: "Identify emerging narratives early" },
                    { icon: Zap, title: "Real-time Analysis", desc: "Continuous blockchain monitoring" },
                    { icon: Activity, title: "Pattern Recognition", desc: "Advanced behavioral analysis" }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                      <item.icon className="w-6 h-6 text-cyan-400 mb-2" />
                      <h3 className="text-white font-semibold mb-1 text-sm uppercase tracking-wide">{item.title}</h3>
                      <p className="text-slate-500 text-xs">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ElectricBorder>
          </AnimatedText>
        </div>
      </main>

      {/* Meta Detail Modal */}
      {selectedMeta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            <ElectricBorder color="#7a5cff" speed={1} chaos={0.5} thickness={2} style={{ borderRadius: 20 }}>
              <div className="bg-gradient-to-br from-purple-950/95 to-slate-950/95 backdrop-blur-2xl p-8 rounded-[20px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                    {selectedMeta.category}
                  </h2>
                  <button
                    onClick={() => setSelectedMeta(null)}
                    className="text-slate-400 hover:text-white transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Average Score</span>
                      <span className={`font-bold ${getScoreColor(selectedMeta.averageScore)}`}>
                        {selectedMeta.averageScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Market Cap</span>
                      <span className="text-white font-mono">${formatNumber(selectedMeta.marketCap)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Volume 24h</span>
                      <span className="text-white font-mono">${formatNumber(selectedMeta.volume)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">24h Change</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(selectedMeta.trend)}
                        <span className={`font-semibold font-mono ${getTrendColor(selectedMeta.trend)}`}>
                          {selectedMeta.change24h >= 0 ? '+' : ''}{selectedMeta.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Token Count</span>
                      <span className="text-white font-mono">{selectedMeta.tokenCount}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Trend</span>
                      <span className={`capitalize font-semibold ${getTrendColor(selectedMeta.trend)}`}>
                        {selectedMeta.trend}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800 mb-6">
                  <h4 className="text-white font-semibold mb-3 uppercase tracking-wide text-sm">Top Tokens</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeta.topTokens.map((token, index) => (
                      <span key={index} className="text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full text-sm font-mono border border-cyan-500/20">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CyberButton 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleViewTokens(selectedMeta.category)}
                    className="flex-1"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Tokens
                  </CyberButton>
                  <CyberButton 
                    variant={isMetaTracked(selectedMeta.category) ? "primary" : "secondary"} 
                    size="sm"
                    onClick={() => handleTrackMeta(selectedMeta.category)}
                    className="flex-1"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {isMetaTracked(selectedMeta.category) ? 'Untrack' : 'Track Meta'}
                  </CyberButton>
                </div>
              </div>
            </ElectricBorder>
          </motion.div>
        </div>
      )}
    </div>
  );
}
