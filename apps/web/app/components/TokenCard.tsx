'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, AlertTriangle, TrendingUp, Shield, Zap, Target, Activity } from 'lucide-react';
import Image from 'next/image';
import ElectricBorder from './ElectricBorder';
import MetallicPaint from './MetallicPaint';

interface TokenCardProps {
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
  };
  index?: number;
}

export default function TokenCard({ token, index = 0 }: TokenCardProps) {
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

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-600';
    if (score >= 50) return 'from-yellow-500 to-amber-600';
    if (score >= 30) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'ai-agents': <Zap className="w-5 h-5" />,
      'frogs': <Activity className="w-5 h-5" />,
      'celeb': <TrendingUp className="w-5 h-5" />,
      'halloween': <Target className="w-5 h-5" />,
      'gaming': <Activity className="w-5 h-5" />,
      'doge-meme': <TrendingUp className="w-5 h-5" />,
      'defi': <Shield className="w-5 h-5" />,
      'meme': <Activity className="w-5 h-5" />,
      'anime': <Target className="w-5 h-5" />,
      'politics': <Shield className="w-5 h-5" />,
      'sports': <Activity className="w-5 h-5" />,
      'music': <Zap className="w-5 h-5" />,
      'art': <Target className="w-5 h-5" />,
      'tech': <Zap className="w-5 h-5" />,
      'unknown': <Activity className="w-5 h-5" />
    };
    return icons[category] || <Activity className="w-5 h-5" />;
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

  const getRiskColor = () => {
    if (!token.riskLevel) return 'border-slate-700/30';
    switch (token.riskLevel) {
      case 'LOW': return 'border-green-500/40';
      case 'MEDIUM': return 'border-yellow-500/40';
      case 'HIGH': return 'border-orange-500/40';
      case 'EXTREME': return 'border-red-500/40';
      default: return 'border-slate-700/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="w-full min-w-[300px] sm:min-w-[340px] flex-shrink-0"
    >
      <ElectricBorder
        color={token.score >= 70 ? "#00ff88" : token.score >= 50 ? "#ffaa00" : "#ff6b6b"}
        speed={0.8}
        chaos={0.3}
        thickness={1.5}
        style={{ borderRadius: 20 }}
      >
        <div className={`relative bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-[20px] border ${getRiskColor()} p-6 hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10`}>
          {/* Score Badge - Top Right */}
          <div className="absolute top-4 right-4">
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getScoreGradient(token.score)} text-white font-bold text-lg shadow-lg`}>
              {token.score}
            </div>
          </div>

          {/* Token Header */}
          <div className="flex items-start space-x-4 mb-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center flex-shrink-0 shadow-xl ring-2 ring-slate-700/30">
              {iconUrl && !imageError ? (
                <Image 
                  src={iconUrl} 
                  alt={token.symbol} 
                  width={64} 
                  height={64}
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
            
            {/* Token Info */}
            <div className="flex-1 min-w-0 pr-20">
              <h3 className="text-white font-bold text-xl mb-1 truncate">
                <MetallicPaint>{token.symbol}</MetallicPaint>
              </h3>
              <p className="text-slate-400 text-sm leading-tight line-clamp-2 mb-3">{token.name}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 ${getCategoryColor(token.category)}`}>
                  {getCategoryIcon(token.category)}
                  <span className="text-xs font-medium capitalize">{token.category}</span>
                </div>
                {timeAgo && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs bg-slate-800/30 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <p className="text-cyan-300 text-sm font-medium">Technical</p>
              </div>
              <p className="text-cyan-400 font-bold text-2xl">{token.techScore || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <p className="text-purple-300 text-sm font-medium">AI Analysis</p>
              </div>
              <p className="text-purple-400 font-bold text-2xl">{token.metaScore || 0}</p>
            </div>
          </div>

          {/* AI Analysis */}
          {token.reason && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/40 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <p className="text-slate-300 text-sm font-medium">AI Analysis</p>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{token.reason}</p>
            </div>
          )}

          {/* Risk Alerts */}
          {token.riskFlags && token.riskFlags.length > 0 && (
            <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
              token.riskLevel === 'EXTREME' || token.riskLevel === 'HIGH' 
                ? 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30' 
                : 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30'
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                token.riskLevel === 'EXTREME' || token.riskLevel === 'HIGH' 
                  ? 'text-red-400' 
                  : 'text-yellow-400'
              }`} />
              <div>
                <p className="text-sm font-medium text-slate-200 mb-1">Risk Alert</p>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{token.riskFlags[0]}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <a
              href={`https://pump.fun/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Trade Now
            </a>
            <a
              href={`https://solscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-600/20 to-slate-700/20 hover:from-slate-600/30 hover:to-slate-700/30 border border-slate-600/40 text-slate-300 hover:text-slate-200 rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              <Shield className="w-4 h-4" />
              View Details
            </a>
          </div>

          {/* Address Footer */}
          <div className="pt-4 border-t border-slate-700/30">
            <p className="text-slate-600 text-xs font-mono text-center truncate">
              {token.address.slice(0, 6)}...{token.address.slice(-6)}
            </p>
          </div>
        </div>
      </ElectricBorder>
    </motion.div>
  );
}
