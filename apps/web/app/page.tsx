'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, BarChart3, RefreshCw, Eye, Zap, Brain, Target } from 'lucide-react';
import CyberCard from './components/CyberCard';
import AnimatedText from './components/AnimatedText';
import CyberButton from './components/CyberButton';
import AIActivity from './components/AIActivity';
import ParticleBackground from './components/ParticleBackground';
import Logo from './components/Logo';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <AnimatedText className="text-4xl font-bold text-green-400 mt-4">
            MetaPulse AI
          </AnimatedText>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <ParticleBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center max-w-4xl mx-auto"
        >
          <Logo />
          <AnimatedText 
            className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 mb-6"
          >
            MetaPulse AI
          </AnimatedText>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl md:text-2xl text-gray-300 mb-8"
          >
            Feel the pulse before the market does
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap gap-4 justify-center mb-12"
          >
            <CyberButton href="/feed" icon={<TrendingUp className="w-5 h-5" />}>
              Live Feed
            </CyberButton>
            <CyberButton href="/metas" icon={<Target className="w-5 h-5" />}>
              Meta Analysis
            </CyberButton>
            <CyberButton href="/tokens" icon={<BarChart3 className="w-5 h-5" />}>
              Token Scores
            </CyberButton>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-16"
        >
          <CyberCard
            icon={<Brain className="w-8 h-8 text-green-400" />}
            title="AI-Powered Analysis"
            description="Advanced machine learning algorithms analyze market sentiment and token performance in real-time."
            gradient="from-green-500/20 to-emerald-500/20"
          />
          
          <CyberCard
            icon={<Zap className="w-8 h-8 text-blue-400" />}
            title="Real-Time Intelligence"
            description="Get instant notifications about emerging trends and high-potential tokens before they pump."
            gradient="from-blue-500/20 to-cyan-500/20"
          />
          
          <CyberCard
            icon={<Activity className="w-8 h-8 text-purple-400" />}
            title="Market Pulse"
            description="Track the heartbeat of the Solana ecosystem with comprehensive market intelligence."
            gradient="from-purple-500/20 to-pink-500/20"
          />
        </motion.div>

        {/* AI Activity Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-16"
        >
          <AIActivity />
        </motion.div>
      </div>
    </div>
  );
}