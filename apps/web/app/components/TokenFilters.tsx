'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Eye, Filter, X } from 'lucide-react';

interface TokenFiltersProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  tokenCounts: {
    latest: number;
    topScoring: number;
    watchlist: number;
    all: number;
  };
}

export default function TokenFilters({ onFilterChange, activeFilter, tokenCounts }: TokenFiltersProps) {
  const filters = [
    {
      id: 'all',
      label: 'All Tokens',
      icon: Filter,
      count: tokenCounts.all,
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/50',
      borderColor: 'border-slate-700/50'
    },
    {
      id: 'latest',
      label: 'Latest Token',
      icon: Sparkles,
      count: tokenCounts.latest,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      description: 'Most recently created'
    },
    {
      id: 'topScoring',
      label: 'Top Scoring',
      icon: TrendingUp,
      count: tokenCounts.topScoring,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      description: 'AI Score > 50, Risk ≤ MEDIUM'
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: Eye,
      count: tokenCounts.watchlist,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      description: 'Score 35-50, High potential'
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filter Tokens</h3>
        <div className="text-sm text-slate-500">
          {tokenCounts.all} total tokens
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border transition-all duration-200 ${
                isActive 
                  ? `${filter.bgColor} ${filter.borderColor} border-2` 
                  : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isActive ? filter.color : 'text-slate-500'}`} />
                {isActive && (
                  <X className="w-4 h-4 text-slate-400" />
                )}
              </div>
              
              <div className="text-left">
                <div className={`font-semibold text-sm mb-1 ${
                  isActive ? filter.color : 'text-slate-300'
                }`}>
                  {filter.label}
                </div>
                <div className="text-xs text-slate-500 mb-1">
                  {filter.count} tokens
                </div>
                {filter.description && (
                  <div className="text-xs text-slate-600">
                    {filter.description}
                  </div>
                )}
              </div>
              
              {isActive && (
                <div className={`absolute inset-0 rounded-xl border-2 ${filter.borderColor} pointer-events-none`} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
