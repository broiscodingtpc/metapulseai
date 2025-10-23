'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Clock, Zap, Activity, Target, Shield } from 'lucide-react';
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
    marketCapSol?: number;
    solAmount?: number;
    supply?: number;
    isNew?: boolean;
    isTrending?: boolean;
    isWatchlist?: boolean;
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
    <div className="p-3 bg-slate-900/30 border-b border-slate-800/30 hover:bg-slate-900/50 transition-colors">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="text-slate-500 text-xs">#{index + 1}</div>
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
              {iconUrl && !imageError ? (
                <Image 
                  src={iconUrl} 
                  alt={token.symbol} 
                  width={24} 
                  height={24}
                  className="w-full h-full object-cover rounded"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-slate-400 text-xs font-bold">{token.symbol[0]}</div>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{token.symbol}</h3>
              <div className="text-xs text-slate-500">{token.category}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-semibold text-sm">{token.score}</div>
            <div className="text-xs text-slate-500">Score</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <div className="text-slate-500">
              <span className="text-cyan-400">{token.techScore || 0}</span> Tech
            </div>
            <div className="text-slate-500">
              <span className="text-purple-400">{token.metaScore || 0}</span> AI
            </div>
            {timeAgo && (
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <a
              href={`https://pump.fun/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs"
            >
              Trade
            </a>
            <a
              href={`https://solscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-slate-600/20 text-slate-300 rounded text-xs"
            >
              View
            </a>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        {/* Left - Token Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="text-slate-500 text-sm w-6">#{index + 1}</div>
          
          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
            {iconUrl && !imageError ? (
              <Image 
                src={iconUrl} 
                alt={token.symbol} 
                width={32} 
                height={32}
                className="w-full h-full object-cover rounded"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-slate-400 text-xs font-bold">{token.symbol[0]}</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm truncate">{token.symbol}</h3>
              <span className="text-xs text-slate-500 capitalize">{token.category}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {timeAgo && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo}</span>
                </div>
              )}
              <span className="font-mono">{token.address.slice(0, 4)}...{token.address.slice(-4)}</span>
            </div>
          </div>
        </div>

        {/* Center - Scores */}
        <div className="flex items-center space-x-4 text-center">
          <div>
            <div className="text-xs text-slate-500">Tech</div>
            <div className={`font-bold text-sm ${getScoreColor(token.techScore || 0)}`}>
              {token.techScore || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">AI</div>
            <div className={`font-bold text-sm ${getScoreColor(token.metaScore || 0)}`}>
              {token.metaScore || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Score</div>
            <div className={`font-bold text-sm ${getScoreColor(token.score)}`}>
              {token.score}
            </div>
          </div>
        </div>

        {/* Right - Market & Actions */}
        <div className="flex items-center space-x-4">
          {token.price && (
            <div className="text-right">
              <div className="text-white font-semibold text-sm">{formatPrice(token.price)}</div>
              {token.change24h !== undefined && (
                <div className={`text-xs flex items-center gap-1 ${getChangeColor(token.change24h)}`}>
                  {token.change24h > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(token.change24h).toFixed(1)}%
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-1">
            <a
              href={`https://pump.fun/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs hover:bg-cyan-500/30 transition-colors"
            >
              Trade
            </a>
            <a
              href={`https://solscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-slate-600/20 text-slate-300 rounded text-xs hover:bg-slate-600/30 transition-colors"
            >
              View
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
