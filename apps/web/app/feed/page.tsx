'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, BarChart3, RefreshCw, Eye } from 'lucide-react';
import CyberCard from '../components/CyberCard';
import AnimatedText from '../components/AnimatedText';
import CyberButton from '../components/CyberButton';
import AIActivity from '../components/AIActivity';

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
}

export default function FeedPage() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const response = await fetch('/api/feed');
      const feedData = await response.json();
      setData(feedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); // Update every 1 second for live AI activity
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(2);
    return price.toFixed(6);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading live feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <AnimatedText>
            <h1 className="text-5xl font-bold mb-4 gradient-text">
              Live Market Feed
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="text-xl text-slate-300 mb-6">
              Real-time market intelligence powered by AI
            </p>
          </AnimatedText>
          <AnimatedText delay={0.4}>
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">AI LIVE</span>
              </div>
              <span className="text-slate-400">•</span>
              <CyberButton onClick={fetchData} variant="primary" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </CyberButton>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400 text-sm">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </AnimatedText>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <AnimatedText delay={0.2}>
            <CyberCard>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Activity className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Tokens</p>
                  <p className="text-2xl font-bold text-white">{data?.totalTokens || 0}</p>
                </div>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.3}>
            <CyberCard>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-secondary-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Active Metas</p>
                  <p className="text-2xl font-bold text-white">{data?.activeMetas || 0}</p>
                </div>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.4}>
            <CyberCard>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center mr-4">
                  <DollarSign className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Market Cap</p>
                  <p className="text-2xl font-bold text-white">${formatNumber(data?.totalMarketCap || 0)}</p>
                </div>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.5}>
            <CyberCard>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Volume 24h</p>
                  <p className="text-2xl font-bold text-white">${formatNumber(data?.totalVolume || 0)}</p>
                </div>
              </div>
            </CyberCard>
          </AnimatedText>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* AI Activity */}
          <AnimatedText delay={0.6}>
            <AIActivity />
          </AnimatedText>

          {/* New Tokens */}
          <AnimatedText delay={0.7}>
            <CyberCard glow>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">New Tokens</h2>
                <span className="text-slate-400 text-sm">
                  {data?.newTokens?.length || 0} tokens
                </span>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto cyber-scrollbar">
                {data?.newTokens?.map((token, index) => (
                  <motion.div
                    key={token.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg border border-slate-700/50 hover:border-primary-500/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{token.symbol}</h3>
                          <p className="text-slate-400 text-sm">{token.name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${getScoreColor(token.score)}`}>
                        {token.score.toFixed(1)}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {getScoreLabel(token.score)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CyberCard>
          </AnimatedText>

          {/* Top Metas */}
          <AnimatedText delay={0.8}>
            <CyberCard glow>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Top Metas</h2>
                <span className="text-slate-400 text-sm">
                  {data?.topMetas?.length || 0} categories
                </span>
              </div>
              
              <div className="space-y-4">
                {data?.topMetas?.map((meta, index) => (
                  <motion.div
                    key={meta.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-dark-800/50 rounded-lg border border-slate-700/50 hover:border-secondary-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold capitalize">
                        {meta.category}
                      </h3>
                      <span className="text-slate-400 text-sm">
                        {meta.tokenCount} tokens
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                        <span className="text-slate-300">
                          Avg Score: {meta.averageScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {meta.topTokens.slice(0, 3).join(', ')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CyberCard>
          </AnimatedText>
        </div>
      </div>
    </div>
  );
}