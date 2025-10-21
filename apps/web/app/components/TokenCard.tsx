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
    icon?: string;
    riskLevel?: string;
    riskScore?: number;
    riskFlags?: string[];
  };
  index?: number;
}

export default function TokenCard({ token, index = 0 }: TokenCardProps) {
  const [timeAgo, setTimeAgo] = useState('');

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`glass-panel rounded-xl p-4 border bg-gradient-to-br ${getCategoryColor(token.category)} hover:shadow-neon-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Token Icon */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-800 flex items-center justify-center">
            {token.icon ? (
              <Image 
                src={token.icon} 
                alt={token.symbol} 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl">{getCategoryIcon(token.category)}</span>
            )}
          </div>
          
          {/* Token Info */}
          <div>
            <h3 className="text-white font-bold text-lg">{token.symbol}</h3>
            <p className="text-slate-400 text-sm truncate max-w-[150px]">{token.name}</p>
          </div>
        </div>
        
        {/* Score Badge */}
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(token.score)} text-white font-bold text-sm`}>
          {token.score}
        </div>
      </div>

      {/* Category & Time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getCategoryIcon(token.category)}</span>
          <span className="text-slate-300 text-sm font-medium capitalize">{token.category}</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Scores Detail */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-dark-800/50 rounded-lg p-2">
          <p className="text-slate-400 text-xs">Tech Score</p>
          <p className="text-cyan-400 font-bold">{token.techScore || 0}</p>
        </div>
        <div className="bg-dark-800/50 rounded-lg p-2">
          <p className="text-slate-400 text-xs">AI Score</p>
          <p className="text-purple-400 font-bold">{token.metaScore || 0}</p>
        </div>
      </div>

      {/* Risk Level */}
      {token.riskLevel && (
        <div className={`rounded-lg p-2 mb-3 ${
          token.riskLevel === 'LOW' ? 'bg-green-500/10 border border-green-500/30' :
          token.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 border border-yellow-500/30' :
          token.riskLevel === 'HIGH' ? 'bg-orange-500/10 border border-orange-500/30' :
          'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Risk Assessment</span>
            <span className={`text-xs font-bold ${
              token.riskLevel === 'LOW' ? 'text-green-400' :
              token.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
              token.riskLevel === 'HIGH' ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {token.riskLevel === 'LOW' ? '🟢' :
               token.riskLevel === 'MEDIUM' ? '🟡' :
               token.riskLevel === 'HIGH' ? '🟠' : '🔴'} {token.riskLevel}
            </span>
          </div>
          {token.riskFlags && token.riskFlags.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">{token.riskFlags[0]}</p>
          )}
        </div>
      )}

      {/* AI Reason */}
      {token.reason && (
        <div className="bg-dark-800/30 rounded-lg p-2 mb-3">
          <p className="text-slate-300 text-xs italic line-clamp-2">{token.reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={`https://pump.fun/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <ExternalLink className="w-3 h-3" />
          Pump.fun
        </a>
        <a
          href={`https://solscan.io/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-secondary-500/20 hover:bg-secondary-500/30 text-secondary-400 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <Target className="w-3 h-3" />
          Solscan
        </a>
      </div>

      {/* Address (shortened) */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs font-mono text-center">
          {token.address.slice(0, 4)}...{token.address.slice(-4)}
        </p>
      </div>
    </motion.div>
  );
}

