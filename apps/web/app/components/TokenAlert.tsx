'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, DollarSign, Lock, Clock, Star } from 'lucide-react';

interface TokenAlertProps {
  type: 'new' | 'warning' | 'potential' | 'locked' | 'trending' | 'watchlist';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TokenAlert({ type, message, size = 'md' }: TokenAlertProps) {
  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'new':
        return {
          icon: Clock,
          symbol: '🆕',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          label: 'Just Created'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          symbol: '⚠️',
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          label: 'High Risk'
        };
      case 'potential':
        return {
          icon: DollarSign,
          symbol: '💰',
          color: 'text-green-400',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          label: 'High Potential'
        };
      case 'locked':
        return {
          icon: Lock,
          symbol: '🔒',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          label: 'LP Locked'
        };
      case 'trending':
        return {
          icon: TrendingUp,
          symbol: '🔥',
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          label: 'Trending'
        };
      case 'watchlist':
        return {
          icon: Star,
          symbol: '⭐',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          label: 'Watchlist'
        };
      default:
        return {
          icon: Clock,
          symbol: '📊',
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          label: 'Unknown'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-sm',
          icon: 'w-5 h-5',
          text: 'text-sm'
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
    }
  };

  const config = getAlertConfig(type);
  const sizeClasses = getSizeClasses(size);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 rounded-full border ${config.bg} ${config.border} ${sizeClasses.container}`}
    >
      <Icon className={`${config.color} ${sizeClasses.icon}`} />
      <span className={`${config.color} ${sizeClasses.text} font-medium`}>
        {config.symbol} {config.label}
      </span>
      {message && (
        <span className={`${config.color} ${sizeClasses.text} opacity-80`}>
          {message}
        </span>
      )}
    </motion.div>
  );
}
