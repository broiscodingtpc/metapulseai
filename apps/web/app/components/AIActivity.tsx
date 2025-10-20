'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Target, TrendingUp, Activity, Eye } from 'lucide-react';
import CyberCard from './CyberCard';

interface AIActivity {
  id: string;
  type: 'scan' | 'analyze' | 'categorize' | 'alert' | 'update';
  message: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info';
}

export default function AIActivity() {
  const [activities, setActivities] = useState<AIActivity[]>([]);
  const [isActive, setIsActive] = useState(true);

  const activityTypes = {
    scan: { icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    analyze: { icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    categorize: { icon: Target, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    alert: { icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    update: { icon: Activity, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' }
  };

  const generateMockActivity = (): AIActivity => {
    const types: AIActivity['type'][] = ['scan', 'analyze', 'categorize', 'alert', 'update'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const messages = {
      scan: [
        'Scanning new tokens on Pump.fun...',
        'Monitoring Raydium for new listings...',
        'Checking social media for trending topics...',
        'Analyzing trading patterns...',
        'Scanning blockchain for new contracts...'
      ],
      analyze: [
        'AI analyzing token metadata...',
        'Processing social sentiment data...',
        'Evaluating market conditions...',
        'Calculating risk scores...',
        'Analyzing trading volume patterns...'
      ],
      categorize: [
        'Categorizing new AI Agent tokens...',
        'Classifying meme coin trends...',
        'Identifying celebrity token patterns...',
        'Sorting gaming-related tokens...',
        'Detecting seasonal meta trends...'
      ],
      alert: [
        'High activity detected in AI category!',
        'New trending meta identified: Frogs',
        'Celebrity token surge detected!',
        'Gaming tokens showing strong momentum',
        'Seasonal meta emerging: Holiday tokens'
      ],
      update: [
        'Updating live feed with new data...',
        'Refreshing token scores...',
        'Syncing with Telegram bot...',
        'Updating market statistics...',
        'Processing new token alerts...'
      ]
    };

    const statuses: AIActivity['status'][] = ['success', 'warning', 'info'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message: messages[type][Math.floor(Math.random() * messages[type].length)],
      timestamp: new Date(),
      status
    };
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newActivity = generateMockActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep last 10 activities
    }, 10000); // New activity every 10 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  const getStatusColor = (status: AIActivity['status']) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: AIActivity['status']) => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <CyberCard className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-white">AI Activity</h3>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isActive 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-slate-500/20 text-slate-400'
          }`}
        >
          {isActive ? 'Live' : 'Paused'}
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto cyber-scrollbar">
        <AnimatePresence>
          {activities.map((activity, index) => {
            const ActivityIcon = activityTypes[activity.type].icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start space-x-3 p-3 bg-dark-800/50 rounded-lg border border-slate-700/50 hover:border-primary-500/50 transition-colors"
              >
                <div className={`w-8 h-8 ${activityTypes[activity.type].bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <ActivityIcon className={`w-4 h-4 ${activityTypes[activity.type].color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs ${getStatusColor(activity.status)}`}>
                      {getStatusIcon(activity.status)}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">AI is warming up...</p>
        </div>
      )}
    </CyberCard>
  );
}
