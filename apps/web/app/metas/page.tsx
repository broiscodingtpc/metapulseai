'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, BarChart3, Target, Zap } from 'lucide-react';
import CyberCard from '../components/CyberCard';
import AnimatedText from '../components/AnimatedText';
import CyberButton from '../components/CyberButton';
import PageNav from '../components/PageNav';
import ParticleBackground from '../components/ParticleBackground';

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
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'tokens' | 'marketCap' | 'volume'>('score');
  const [selectedMeta, setSelectedMeta] = useState<MetaData | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/feed');
      const feedData = await response.json();
      setData(feedData);
    } catch (error) {
      console.error('Error fetching meta data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-slate-400';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading meta analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      <ParticleBackground />
      <PageNav />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <AnimatedText>
            <h1 className="text-5xl font-bold mb-4 gradient-text">
              Meta Analysis
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="text-xl text-slate-300 mb-6">
              AI-powered trend analysis and market intelligence
            </p>
          </AnimatedText>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <AnimatedText delay={0.2}>
            <CyberCard>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-primary-400" />
                </div>
                <p className="text-slate-400 text-sm">Active Metas</p>
                <p className="text-3xl font-bold text-white">{data?.activeMetas || 0}</p>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.3}>
            <CyberCard>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-slate-400 text-sm">Total Tokens</p>
                <p className="text-3xl font-bold text-white">{data?.totalTokens || 0}</p>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.4}>
            <CyberCard>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-accent-400" />
                </div>
                <p className="text-slate-400 text-sm">Market Cap</p>
                <p className="text-3xl font-bold text-white">${formatNumber(data?.totalMarketCap || 0)}</p>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.5}>
            <CyberCard>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-primary-400" />
                </div>
                <p className="text-slate-400 text-sm">Volume 24h</p>
                <p className="text-3xl font-bold text-white">${formatNumber(data?.totalVolume || 0)}</p>
              </div>
            </CyberCard>
          </AnimatedText>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <CyberCard>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-dark-800 border border-slate-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="score">Average Score</option>
                  <option value="tokens">Token Count</option>
                  <option value="marketCap">Market Cap</option>
                  <option value="volume">Volume</option>
                </select>
              </div>
              
              <CyberButton onClick={fetchData} variant="primary" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Refresh Analysis
              </CyberButton>
            </div>
          </CyberCard>
        </div>

        {/* Meta Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMetas.map((meta, index) => (
            <AnimatedText key={meta.category} delay={index * 0.1}>
              <CyberCard 
                hover 
                glow
                className="cursor-pointer"
                onClick={() => setSelectedMeta(meta)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {meta.category.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold capitalize">{meta.category}</h3>
                      <p className="text-slate-400 text-sm">{meta.tokenCount} tokens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getScoreColor(meta.averageScore)}`}>
                      {meta.averageScore.toFixed(1)}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {getScoreLabel(meta.averageScore)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Cap:</span>
                    <span className="text-white">${formatNumber(meta.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume 24h:</span>
                    <span className="text-white">${formatNumber(meta.volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Change:</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(meta.trend)}
                      <span className={`font-semibold ${getTrendColor(meta.trend)}`}>
                        {meta.change24h >= 0 ? '+' : ''}{meta.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Top Tokens:</span>
                    <div className="flex space-x-1">
                      {meta.topTokens.slice(0, 3).map((token, idx) => (
                        <span key={idx} className="text-primary-400 text-xs bg-primary-500/20 px-2 py-1 rounded">
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CyberCard>
            </AnimatedText>
          ))}
        </div>

        {/* AI Insights */}
        <div className="mt-12">
          <AnimatedText>
            <CyberCard glow className="text-center">
              <h2 className="text-3xl font-bold mb-4 gradient-text">
                AI-Powered Insights
              </h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Our AI continuously analyzes market patterns, social sentiment, and trading activity 
                to identify emerging trends before they become mainstream.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="p-4 bg-dark-800/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Target className="w-5 h-5 text-primary-400 mr-2" />
                    <h3 className="text-white font-semibold">Trend Detection</h3>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Identify emerging narratives and meta trends before they peak
                  </p>
                </div>
                <div className="p-4 bg-dark-800/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="w-5 h-5 text-secondary-400 mr-2" />
                    <h3 className="text-white font-semibold">Real-time Analysis</h3>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Continuous monitoring of blockchain and social activity
                  </p>
                </div>
                <div className="p-4 bg-dark-800/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-accent-400 mr-2" />
                    <h3 className="text-white font-semibold">Community Intelligence</h3>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Leverage collective wisdom and sentiment analysis
                  </p>
                </div>
              </div>
            </CyberCard>
          </AnimatedText>
        </div>
      </div>

      {/* Meta Detail Modal */}
      {selectedMeta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white capitalize">
                {selectedMeta.category} Meta Analysis
              </h2>
              <button
                onClick={() => setSelectedMeta(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedMeta.category.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white capitalize">{selectedMeta.category}</h3>
                  <p className="text-slate-400">{selectedMeta.tokenCount} tokens in this meta</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Score:</span>
                    <span className={`font-bold ${getScoreColor(selectedMeta.averageScore)}`}>
                      {selectedMeta.averageScore.toFixed(1)} ({getScoreLabel(selectedMeta.averageScore)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Cap:</span>
                    <span className="text-white">${formatNumber(selectedMeta.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume 24h:</span>
                    <span className="text-white">${formatNumber(selectedMeta.volume)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Change:</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(selectedMeta.trend)}
                      <span className={`font-semibold ${getTrendColor(selectedMeta.trend)}`}>
                        {selectedMeta.change24h >= 0 ? '+' : ''}{selectedMeta.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token Count:</span>
                    <span className="text-white">{selectedMeta.tokenCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trend:</span>
                    <span className={`capitalize ${getTrendColor(selectedMeta.trend)}`}>
                      {selectedMeta.trend}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-white font-semibold mb-3">Top Tokens in this Meta:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMeta.topTokens.map((token, index) => (
                    <span key={index} className="text-primary-400 bg-primary-500/20 px-3 py-1 rounded-full text-sm">
                      {token}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <CyberButton variant="primary" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Tokens
                </CyberButton>
                <CyberButton variant="secondary" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Track Meta
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}