'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, TrendingDown, Eye, ExternalLink, Star } from 'lucide-react';
import CyberCard from '../components/CyberCard';
import AnimatedText from '../components/AnimatedText';
import CyberButton from '../components/CyberButton';
import PageNav from '../components/PageNav';
import ParticleBackground from '../components/ParticleBackground';

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

export default function TokensPage() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'marketCap' | 'volume' | 'change24h'>('score');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/feed');
      const feedData = await response.json();
      setData(feedData);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Update every 2 seconds for live DEX feel
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

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const filteredTokens = data?.newTokens
    ?.filter(token => 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.filter(token => 
      filterCategory === 'all' || token.category === filterCategory
    )
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.score - a.score;
        case 'marketCap': return b.marketCap - a.marketCap;
        case 'volume': return b.volume - a.volume;
        case 'change24h': return b.change24h - a.change24h;
        default: return 0;
      }
    }) || [];

  const categories = ['all', ...new Set(data?.newTokens?.map(token => token.category) || [])];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading token data...</p>
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
              PulseDEX
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="text-xl text-slate-300 mb-6">
              Live DEX with AI-powered token analysis and real-time updates
            </p>
          </AnimatedText>
          <AnimatedText delay={0.4}>
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">LIVE</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Auto-updating every 2 seconds</span>
            </div>
          </AnimatedText>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <CyberCard>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-dark-800 border border-slate-700 rounded-lg text-white focus:border-primary-500 focus:outline-none [&>option]:bg-dark-900 [&>option]:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-dark-900 text-white">
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-dark-800 border border-slate-700 rounded-lg text-white focus:border-primary-500 focus:outline-none [&>option]:bg-dark-900 [&>option]:text-white"
              >
                <option value="score" className="bg-dark-900 text-white">Sort by Score</option>
                <option value="marketCap" className="bg-dark-900 text-white">Sort by Market Cap</option>
                <option value="volume" className="bg-dark-900 text-white">Sort by Volume</option>
                <option value="change24h" className="bg-dark-900 text-white">Sort by 24h Change</option>
              </select>
              
              <CyberButton onClick={fetchData} variant="primary" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Refresh
              </CyberButton>
            </div>
          </CyberCard>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <AnimatedText delay={0.2}>
            <CyberCard>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Tokens</p>
                <p className="text-3xl font-bold text-white">{data?.totalTokens || 0}</p>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.3}>
            <CyberCard>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Active Metas</p>
                <p className="text-3xl font-bold text-white">{data?.activeMetas || 0}</p>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.4}>
            <CyberCard>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Market Cap</p>
                <p className="text-3xl font-bold text-white">${formatNumber(data?.totalMarketCap || 0)}</p>
              </div>
            </CyberCard>
          </AnimatedText>

          <AnimatedText delay={0.5}>
            <CyberCard>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Volume 24h</p>
                <p className="text-3xl font-bold text-white">${formatNumber(data?.totalVolume || 0)}</p>
              </div>
            </CyberCard>
          </AnimatedText>
        </div>

        {/* Token Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map((token, index) => (
            <AnimatedText key={token.address} delay={index * 0.1}>
              <CyberCard 
                hover 
                glow
                className="cursor-pointer"
                onClick={() => setSelectedToken(token)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {token.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{token.symbol}</h3>
                      <p className="text-slate-400 text-sm">{token.name}</p>
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
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price:</span>
                    <span className="text-white">${formatPrice(token.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Cap:</span>
                    <span className="text-white">${formatNumber(token.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume:</span>
                    <span className="text-white">${formatNumber(token.volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Change:</span>
                    <span className={`font-semibold ${getChangeColor(token.change24h)}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="text-primary-400 capitalize">{token.category}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Liquidity</span>
                    <span className="text-white text-sm">${formatNumber(token.liquidity)}</span>
                  </div>
                </div>
              </CyberCard>
            </AnimatedText>
          ))}
        </div>

        {/* Promote Your Project */}
        <div className="mt-12">
          <AnimatedText>
            <CyberCard glow className="text-center">
              <h2 className="text-3xl font-bold mb-4 gradient-text">
                Promote Your Project
              </h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Get your token featured in our AI analysis and reach thousands of traders 
                looking for the next big opportunity.
              </p>
              <CyberButton variant="accent" size="lg">
                <Star className="w-5 h-5 mr-2" />
                Submit Your Token
              </CyberButton>
            </CyberCard>
          </AnimatedText>
        </div>
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Token Details</h2>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedToken.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedToken.symbol}</h3>
                  <p className="text-slate-400">{selectedToken.name}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Score:</span>
                    <span className={`font-bold ${getScoreColor(selectedToken.score)}`}>
                      {selectedToken.score.toFixed(1)} ({getScoreLabel(selectedToken.score)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price:</span>
                    <span className="text-white">${formatPrice(selectedToken.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Cap:</span>
                    <span className="text-white">${formatNumber(selectedToken.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume 24h:</span>
                    <span className="text-white">${formatNumber(selectedToken.volume)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Change:</span>
                    <span className={`font-semibold ${getChangeColor(selectedToken.change24h)}`}>
                      {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Liquidity:</span>
                    <span className="text-white">${formatNumber(selectedToken.liquidity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Holders:</span>
                    <span className="text-white">{formatNumber(selectedToken.holders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transactions:</span>
                    <span className="text-white">{formatNumber(selectedToken.transactions)}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-primary-400 capitalize">{selectedToken.category}</span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <CyberButton variant="primary" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View on Explorer
                </CyberButton>
                <CyberButton variant="secondary" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Trade Now
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}