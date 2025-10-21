'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Target, Zap, ExternalLink } from 'lucide-react';
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
    analyzedAt?: string;
    metadataUri?: string;
    riskLevel?: string;
    riskScore?: number;
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
      // Direct image link
      if (token.metadataUri.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        url = token.metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      } 
      // IPFS link
      else if (token.metadataUri.includes('ipfs')) {
        url = token.metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      // Other metadata services
      else if (token.metadataUri.startsWith('http')) {
        url = token.metadataUri;
      }
    }
    
    // Fallback
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
      const diff = Math.floor((now - detected) / 1000); // seconds
      
      if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [token.detectedAt]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-500';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'ai-agents': '🤖',
      'frogs': '🐸',
      'celeb': '⭐',
      'halloween': '🎃',
      'gaming': '🎮',
      'doge-meme': '🐕',
      'defi': '💰',
      'meme': '😂'
    };
    return icons[category] || '❓';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'ai-agents': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
      'frogs': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      'celeb': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      'halloween': 'from-orange-500/20 to-red-500/20 border-orange-500/30',
      'gaming': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      'doge-meme': 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
      'defi': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      'meme': 'from-pink-500/20 to-rose-500/20 border-pink-500/30'
    };
    return colors[category] || 'from-slate-500/20 to-gray-500/20 border-slate-500/30';
  };

  const getRiskColor = () => {
    if (!token.riskLevel) return 'border-slate-700/50';
    switch (token.riskLevel) {
      case 'LOW': return 'border-green-500/30';
      case 'MEDIUM': return 'border-yellow-500/30';
      case 'HIGH': return 'border-orange-500/30';
      case 'EXTREME': return 'border-red-500/30';
      default: return 'border-slate-700/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`glass-panel rounded-xl p-5 border-2 ${getRiskColor()} bg-gradient-to-br ${getCategoryColor(token.category)} hover:shadow-neon-lg transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Token Icon */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-800 flex items-center justify-center flex-shrink-0 shadow-lg">
            {iconUrl && !imageError ? (
              <Image 
                src={iconUrl} 
                alt={token.symbol} 
                width={56} 
                height={56}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-3xl">{getCategoryIcon(token.category)}</span>
            )}
          </div>
          
          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-xl truncate">{token.symbol}</h3>
              <div className="flex items-center space-x-1 text-slate-400 text-xs flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm truncate">{token.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs">{getCategoryIcon(token.category)}</span>
              <span className="text-slate-300 text-xs font-medium capitalize">{token.category}</span>
            </div>
          </div>
        </div>
        
        {/* Score Badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getScoreColor(token.score)} text-white font-bold text-lg shadow-lg`}>
            {token.score}
          </div>
          {token.riskLevel && (
            <span className="text-xs font-bold">
              {token.riskLevel === 'LOW' ? '🟢' :
               token.riskLevel === 'MEDIUM' ? '🟡' :
               token.riskLevel === 'HIGH' ? '🟠' : '🔴'}
            </span>
          )}
        </div>
      </div>

      {/* Scores Detail */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-dark-800/70 rounded-lg p-3 border border-cyan-500/20">
          <p className="text-slate-400 text-xs mb-1">Tech Score</p>
          <p className="text-cyan-400 font-bold text-lg">{token.techScore || 0}</p>
        </div>
        <div className="bg-dark-800/70 rounded-lg p-3 border border-purple-500/20">
          <p className="text-slate-400 text-xs mb-1">AI Score</p>
          <p className="text-purple-400 font-bold text-lg">{token.metaScore || 0}</p>
        </div>
      </div>

      {/* AI Reason */}
      {token.reason && (
        <div className="bg-dark-800/50 rounded-lg p-3 mb-4 border border-slate-700/30">
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{token.reason}</p>
        </div>
      )}

      {/* Risk Flags */}
      {token.riskFlags && token.riskFlags.length > 0 && (
        <div className={`rounded-lg p-3 mb-4 ${
          token.riskLevel === 'LOW' ? 'bg-green-500/10 border border-green-500/20' :
          token.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 border border-yellow-500/20' :
          token.riskLevel === 'HIGH' ? 'bg-orange-500/10 border border-orange-500/20' :
          'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-300">⚠️ Risk Alert</span>
          </div>
          <p className="text-xs text-slate-300">{token.riskFlags.join(' • ')}</p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://pump.fun/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500/20 to-primary-600/20 hover:from-primary-500/30 hover:to-primary-600/30 border border-primary-500/30 text-primary-300 rounded-lg transition-all duration-200 text-sm font-semibold"
        >
          <ExternalLink className="w-4 h-4" />
          Trade
        </a>
        <a
          href={`https://solscan.io/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary-500/20 to-secondary-600/20 hover:from-secondary-500/30 hover:to-secondary-600/30 border border-secondary-500/30 text-secondary-300 rounded-lg transition-all duration-200 text-sm font-semibold"
        >
          <Target className="w-4 h-4" />
          Scan
        </a>
      </div>

      {/* Address (shortened) */}
      <div className="mt-4 pt-3 border-t border-slate-700/30">
        <p className="text-slate-500 text-xs font-mono text-center truncate">
          {token.address.slice(0, 6)}...{token.address.slice(-6)}
        </p>
      </div>
    </motion.div>
  );
}

