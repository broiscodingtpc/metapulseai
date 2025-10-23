'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink, Shield, Zap, Target, Activity, Clock } from 'lucide-react';
import Image from 'next/image';

interface TokenListProps {
  token: {
    address: string;
    name: string;
    symbol: string;
    score: number;
    techScore?: number;
    metaScore?: number;
    category: string;
    reason?: string;
    detectedAt?: string;
    metadataUri?: string;
    riskLevel?: string;
    riskFlags?: string[];
    marketCap?: number;
    volume?: number;
    price?: number;
    change24h?: number;
  };
  index?: number;
}

export default function TokenList({ token, index = 0 }: TokenListProps) {
  const [timeAgo, setTimeAgo] = useState('');
  const [imageError, setImageError] = useState(false);
  const [iconUrl, setIconUrl] = useState<string>('');

  // Generate icon URL from metadata
  useEffect(() => {
    let url = '';
    
    if (token.metadataUri) {
      if (token.metadataUri.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        url = token.metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      } else if (token.metadataUri.includes('ipfs')) {
        url = token.metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      } else if (token.metadataUri.startsWith('http')) {
        url = token.metadataUri;
      }
    }
    
    if (!url) {
      url = `https://api.dicebear.com/7.x/shapes/svg?seed=${token.address}&backgroundColor=1a1e27`;
    }
    
    setIconUrl(url);
  }, [token.metadataUri, token.address]);

  useEffect(() => {
    const updateTime = () => {
      if (!token.detectedAt) return;
      
      const now = new Date().getTime();
      const detected = new Date(token.detectedAt).getTime();
      const diff = Math.floor((now - detected) / 1000);
      
      if (diff < 60) setTimeAgo(`${diff}s`);
      else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m`);
      else setTimeAgo(`${Math.floor(diff / 3600)}h`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [token.detectedAt]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'ai-agents': <Zap className="w-4 h-4" />,
      'frogs': <Activity className="w-4 h-4" />,
      'celeb': <TrendingUp className="w-4 h-4" />,
      'halloween': <Target className="w-4 h-4" />,
      'gaming': <Activity className="w-4 h-4" />,
      'doge-meme': <TrendingUp className="w-4 h-4" />,
      'defi': <Shield className="w-4 h-4" />,
      'meme': <Activity className="w-4 h-4" />,
      'anime': <Target className="w-4 h-4" />,
      'politics': <Shield className="w-4 h-4" />,
      'sports': <Activity className="w-4 h-4" />,
      'music': <Zap className="w-4 h-4" />,
      'art': <Target className="w-4 h-4" />,
      'tech': <Zap className="w-4 h-4" />,
      'unknown': <Activity className="w-4 h-4" />
    };
    return icons[category] || <Activity className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'ai-agents': 'text-cyan-400',
      'frogs': 'text-green-400',
      'celeb': 'text-yellow-400',
      'halloween': 'text-orange-400',
      'gaming': 'text-purple-400',
      'doge-meme': 'text-blue-400',
      'defi': 'text-emerald-400',
      'meme': 'text-pink-400',
      'anime': 'text-rose-400',
      'politics': 'text-slate-400',
      'sports': 'text-lime-400',
      'music': 'text-indigo-400',
      'art': 'text-violet-400',
      'tech': 'text-cyan-400',
      'unknown': 'text-slate-500'
    };
    return colors[category] || 'text-slate-500';
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toExponential(2)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-gradient-to-r from-slate-900/50 to-slate-950/50 backdrop-blur-sm border border-slate-800/50 hover:border-slate-700/50 rounded-lg p-4 hover:bg-slate-900/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Token Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Rank */}
          <div className="text-slate-500 text-sm font-mono w-8 text-center">
            #{index + 1}
          </div>

          {/* Icon */}
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0">
            {iconUrl && !imageError ? (
              <Image 
                src={iconUrl} 
                alt={token.symbol} 
                width={40} 
                height={40}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={`${getCategoryColor(token.category)}`}>
                {getCategoryIcon(token.category)}
              </div>
            )}
          </div>

          {/* Token Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-lg truncate">{token.symbol}</h3>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/50 ${getCategoryColor(token.category)}`}>
                {getCategoryIcon(token.category)}
                <span className="text-xs font-medium capitalize">{token.category}</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm truncate">{token.name}</p>
            <div className="flex items-center gap-3 mt-1">
              {timeAgo && (
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo}</span>
                </div>
              )}
              <div className="text-xs text-slate-600 font-mono">
                {token.address.slice(0, 6)}...{token.address.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Scores */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Tech</div>
            <div className={`font-bold ${getScoreColor(token.techScore || 0)}`}>
              {token.techScore || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">AI</div>
            <div className={`font-bold ${getScoreColor(token.metaScore || 0)}`}>
              {token.metaScore || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Score</div>
            <div className={`font-bold text-lg ${getScoreColor(token.score)}`}>
              {token.score}
            </div>
          </div>
        </div>

        {/* Right Section - Market Data & Actions */}
        <div className="flex items-center space-x-6">
          {/* Market Data */}
          <div className="text-right">
            {token.price && (
              <div className="text-white font-semibold">
                {formatPrice(token.price)}
              </div>
            )}
            {token.change24h !== undefined && (
              <div className={`text-sm flex items-center gap-1 ${getChangeColor(token.change24h)}`}>
                {token.change24h > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(token.change24h).toFixed(2)}%
              </div>
            )}
            {token.marketCap && (
              <div className="text-slate-400 text-xs">
                ${formatNumber(token.marketCap)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <a
              href={`https://pump.fun/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Trade
            </a>
            <a
              href={`https://solscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/40 text-slate-300 hover:text-slate-200 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <Shield className="w-3 h-3" />
              View
            </a>
          </div>
        </div>
      </div>

      {/* Risk Alert */}
      {token.riskFlags && token.riskFlags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/50">
          <div className={`flex items-center gap-2 text-xs ${
            token.riskLevel === 'EXTREME' || token.riskLevel === 'HIGH' 
              ? 'text-red-400' 
              : 'text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              token.riskLevel === 'EXTREME' || token.riskLevel === 'HIGH' 
                ? 'bg-red-400' 
                : 'bg-yellow-400'
            }`}></div>
            <span className="font-medium">Risk Alert:</span>
            <span>{token.riskFlags[0]}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
