'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Brain, Zap, Target, Shield, TrendingUp, Users, Globe, DollarSign } from 'lucide-react';
import Logo from './components/Logo';
import CyberButton from './components/CyberButton';
import CyberCard from './components/CyberCard';
import AnimatedText from './components/AnimatedText';
import ParticleBackground from './components/ParticleBackground';
import PageNav from './components/PageNav';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      <ParticleBackground />
      
      {/* Navigation */}
      <PageNav />

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 text-center">
        <AnimatedText delay={0.2}>
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="gradient-text">MetaPulse AI Bot</span>
          </motion.h1>
        </AnimatedText>
        
        <AnimatedText delay={0.4}>
          <motion.div 
            className="text-2xl md:text-3xl font-semibold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="neon-text">$PULSEAI</span>
          </motion.div>
        </AnimatedText>

        <AnimatedText delay={0.6}>
          <motion.p 
            className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            "Feel the pulse before the market does."
          </motion.p>
        </AnimatedText>

        <AnimatedText delay={0.8}>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/presale">
              <CyberButton variant="primary" size="lg" className="group">
                Join Presale <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </CyberButton>
            </Link>
            <Link href="/feed">
              <CyberButton variant="secondary" size="lg" className="group">
                Live Feed <TrendingUp className="ml-2 group-hover:scale-110 transition-transform" />
              </CyberButton>
            </Link>
          </motion.div>
        </AnimatedText>
      </section>


      {/* Project Overview */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text">
              Project Overview
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <AnimatedText delay={0.2}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Brain className="w-8 h-8 text-primary-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">AI-Powered Intelligence</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  MetaPulse AI Bot is an AI-powered market intelligence system built on Solana. 
                  It scans the blockchain and social activity in real time to detect emerging metas, 
                  narratives, and token trends before they reach mainstream visibility.
                </p>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.4}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-secondary-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">Meta Sniffer</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The first release monitors every new token on Pump.fun and Raydium, using AI to classify 
                  them into trend categories such as AI Agents, Frogs, Celebrities, Gaming, or Seasonal Metas.
                </p>
              </CyberCard>
            </AnimatedText>
          </div>

          <AnimatedText delay={0.6}>
            <CyberCard className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-accent-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">Predictive Edge</h3>
              </div>
              <p className="text-slate-300 leading-relaxed max-w-4xl mx-auto">
                Users receive hourly Telegram alerts showing the most active metas and top-performing tokens, 
                giving traders a predictive edge over the market.
              </p>
            </CyberCard>
          </AnimatedText>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text">
              Core Features
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedText delay={0.2}>
              <CyberCard>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Early Detection</h3>
                  <p className="text-slate-300">Detect hot narratives before they go mainstream</p>
                </div>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.4}>
              <CyberCard>
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-secondary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">High-Speed Reaction</h3>
                  <p className="text-slate-300">React to market changes at lightning speed</p>
                </div>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.6}>
              <CyberCard>
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-accent-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Long-term Value</h3>
                  <p className="text-slate-300">Sustainable ecosystem with revenue sharing</p>
                </div>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Rate Limit Notice */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatedText>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-400 text-lg">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white">AI Rate Limits & Future Upgrades</h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Currently operating within free tier limits (500K tokens/day). As we raise funds and develop, 
                we will upgrade to higher rate limits for unlimited AI analysis and faster processing.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="text-yellow-400">Free Tier (Limited)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Future Upgrade:</span>
                  <span className="text-green-400">Developer Tier (Unlimited)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Analysis:</span>
                  <span className="text-blue-400">Smart Fallback Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upgrade Timeline:</span>
                  <span className="text-purple-400">Post-Fundraising</span>
                </div>
              </div>
            </div>
          </AnimatedText>
        </div>
      </section>

      {/* Monetization Model */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text">
              Monetization & Value Creation
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <AnimatedText delay={0.2}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <DollarSign className="w-8 h-8 text-primary-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">Paid Services Model</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  All MetaPulse services will be paid exclusively with PULSEAI tokens. 
                  This creates constant demand and utility for the token.
                </p>
                <ul className="text-slate-300 space-y-2">
                  <li>• Premium AI analysis features</li>
                  <li>• Advanced trading signals</li>
                  <li>• Priority token alerts</li>
                  <li>• Custom AI strategies</li>
                </ul>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.4}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-8 h-8 text-secondary-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">Revenue Distribution</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  All revenue from services, trading fees, and platform usage 
                  goes directly into the PULSEAI chart, benefiting all holders.
                </p>
                <ul className="text-slate-300 space-y-2">
                  <li>• 70% to token buybacks</li>
                  <li>• 20% to development</li>
                  <li>• 10% to marketing</li>
                </ul>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Future Vision */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text">
              Future Vision
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedText delay={0.2}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-primary-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">AI Sniper Module</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Automated trading system that executes buys based on AI predictions, 
                  giving you the fastest possible reaction to market opportunities.
                </p>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.4}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Globe className="w-8 h-8 text-secondary-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">AI Launchpad</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Create and deploy tokens directly through MetaPulse's AI assistant, 
                  making token creation accessible to everyone.
                </p>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 gradient-text">
              Ready to Feel the Pulse?
            </h2>
          </AnimatedText>
          
          <AnimatedText delay={0.2}>
            <p className="text-xl text-slate-300 mb-8">
              Join the future of AI-powered trading and market intelligence.
            </p>
          </AnimatedText>
          
          <AnimatedText delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/presale">
                <CyberButton variant="primary" size="lg" className="group">
                  Join Presale <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </CyberButton>
              </Link>
              <Link href="/feed">
                <CyberButton variant="secondary" size="lg" className="group">
                  View Live Feed <TrendingUp className="ml-2 group-hover:scale-110 transition-transform" />
                </CyberButton>
              </Link>
            </div>
          </AnimatedText>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-slate-400 mb-4">
            MetaPulse AI Bot — $PULSEAI
          </p>
          <p className="text-slate-500 text-sm">
            "Feel the pulse before the market does."
          </p>
        </div>
      </footer>
    </div>
  );
}