'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

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

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'ai-agents': '🤖',
      'frogs': '🐸',
      'celeb': '⭐',
      'halloween': '🎃',
      'gaming': '🎮',
      'doge-meme': '🐕',
      'defi': '💰',
      'meme': '😂',
      'anime': '🎌',
      'politics': '🏛️',
      'sports': '⚽',
      'music': '🎵',
      'art': '🎨',
      'tech': '💻',
      'unknown': '❓'
    };
    return emojis[category] || '📊';
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
      className={`relative bg-dark-900/80 backdrop-blur-sm rounded-2xl border ${getRiskColor()} p-4 sm:p-6 hover:border-primary-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 w-full min-w-[280px] sm:min-w-[320px] flex-shrink-0`}
    >
      {/* Score Badge - Top Right */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${getScoreGradient(token.score)} text-white font-bold text-base sm:text-lg shadow-lg`}>
          {token.score}
        </div>
      </div>

      {/* Token Header */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        {/* Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-dark-800 flex items-center justify-center flex-shrink-0 shadow-xl ring-2 ring-slate-700/30">
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
            <span className="text-3xl sm:text-4xl">{getCategoryEmoji(token.category)}</span>
          )}
        </div>
        
        {/* Token Info */}
        <div className="flex-1 min-w-0 pr-14 sm:pr-16">
          <h3 className="text-white font-bold text-lg sm:text-xl mb-1 truncate">{token.symbol}</h3>
          <p className="text-slate-400 text-xs sm:text-sm leading-tight line-clamp-2">{token.name}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-base sm:text-lg">{getCategoryEmoji(token.category)}</span>
            <span className="text-slate-300 text-xs sm:text-sm font-medium capitalize truncate max-w-[100px]">{token.category}</span>
            {timeAgo && (
              <>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2 sm:p-3 text-center">
          <p className="text-cyan-300 text-xs font-medium mb-1">Tech</p>
          <p className="text-cyan-400 font-bold text-xl sm:text-2xl">{token.techScore || 0}</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-2 sm:p-3 text-center">
          <p className="text-purple-300 text-xs font-medium mb-1">AI</p>
          <p className="text-purple-400 font-bold text-xl sm:text-2xl">{token.metaScore || 0}</p>
        </div>
      </div>

      {/* AI Analysis */}
      {token.reason && (
        <div className="bg-dark-800/60 border border-slate-700/40 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">{token.reason}</p>
        </div>
      )}

      {/* Risk Alerts */}
      {token.riskFlags && token.riskFlags.length > 0 && (
        <div className={`rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 flex items-start gap-2 ${
          token.riskLevel === 'EXTREME' || token.riskLevel === 'HIGH' 
            ? 'bg-red-500/10 border border-red-500/30' 
            : 'bg-yellow-500/10 border border-yellow-500/30'
        }`}>
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            token.riskLevel === 'EXTREME' || token.riskLevel === 'HIGH' 
              ? 'text-red-400' 
              : 'text-yellow-400'
          }`} />
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{token.riskFlags[0]}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <a
          href={`https://pump.fun/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-primary-500/20 to-primary-600/20 hover:from-primary-500/30 hover:to-primary-600/30 border border-primary-500/40 text-primary-300 hover:text-primary-200 rounded-xl transition-all duration-200 font-semibold text-xs sm:text-sm"
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Trade
        </a>
        <a
          href={`https://solscan.io/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-slate-600/20 to-slate-700/20 hover:from-slate-600/30 hover:to-slate-700/30 border border-slate-600/40 text-slate-300 hover:text-slate-200 rounded-xl transition-all duration-200 font-semibold text-xs sm:text-sm"
        >
          View
        </a>
      </div>

      {/* Address Footer */}
      <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-slate-700/30">
        <p className="text-slate-600 text-xs font-mono text-center truncate">
          {token.address.slice(0, 4)}...{token.address.slice(-4)}
        </p>
      </div>
    </motion.div>
  );
}
