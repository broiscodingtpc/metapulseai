'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Clock, Users, DollarSign, TrendingUp, Shield, Zap } from 'lucide-react';
import CyberCard from '../components/CyberCard';
import AnimatedText from '../components/AnimatedText';
import CyberButton from '../components/CyberButton';
import PageNav from '../components/PageNav';
import ParticleBackground from '../components/ParticleBackground';

export default function PresalePage() {
  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      <ParticleBackground />
      <PageNav />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <AnimatedText delay={0.2}>
            <h1 className="text-5xl font-bold mb-4 gradient-text">
              MetaPulse AI Bot Presale
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.4}>
            <p className="text-xl text-slate-300 mb-6">
              Join the future of AI-powered trading and market intelligence
            </p>
          </AnimatedText>
        </div>

        {/* Presale Info */}
        <div className="mb-12">
          <AnimatedText delay={0.2}>
            <CyberCard>
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold gradient-text mb-4">Presale Coming Soon</h2>
                <p className="text-slate-300 text-lg mb-6">Join our community to get early access</p>
                <div className="flex justify-center gap-4">
                  <a href="https://t.me/MetaPulseAIBot" target="_blank" rel="noopener noreferrer">
                    <CyberButton variant="primary" size="lg">
                      Join Telegram
                    </CyberButton>
                  </a>
                  <a href="https://x.com/METAPULSaibot" target="_blank" rel="noopener noreferrer">
                    <CyberButton variant="secondary" size="lg">
                      Follow on 𝕏
                    </CyberButton>
                  </a>
                </div>
              </div>
            </CyberCard>
          </AnimatedText>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Presale Widget */}
          <AnimatedText delay={0.6}>
            <CyberCard glow>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Join the Presale
              </h2>
              <div className="bg-dark-800 rounded-lg p-4 mb-6">
                <iframe 
                  width="100%" 
                  height="500" 
                  frameBorder="0" 
                  scrolling="no" 
                  src="https://solsale.app/embed/?address=68cAkd84nFqD9zjP5Y619XPbbssgmzwxjPyN5dMhqwGj&bgColor=%2312181F&fgColor=%23161D27&hasAnimation=true&hasBanner=true&hasSocialLinks=true&network=999999&padding=30&refer=2FHA2AdY8f1Yr2b92ok9YD725jx7ZNiL1t7cGaxV31ZF&responsive=false&saleType=presale&theme=dark&txtColor=%23FFFFFF"
                  className="rounded-lg"
                />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-4">
                  Connect your wallet to participate in the presale
                </p>
                <CyberButton variant="primary" size="lg" className="group">
                  Connect Wallet <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </CyberButton>
              </div>
            </CyberCard>
          </AnimatedText>

          {/* Project Information */}
          <div className="space-y-8">
            <AnimatedText delay={0.7}>
              <CyberCard>
                <h3 className="text-2xl font-bold text-white mb-4">Why Invest in $PULSEAI?</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">AI-Powered Intelligence</h4>
                      <p className="text-slate-400 text-sm">
                        Advanced AI system that detects market trends before they become mainstream
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-secondary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <TrendingUp className="w-4 h-4 text-secondary-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Early Market Detection</h4>
                      <p className="text-slate-400 text-sm">
                        Get alerts on emerging metas and token trends before they peak
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="w-4 h-4 text-accent-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Revenue Sharing & Utility</h4>
                      <p className="text-slate-400 text-sm">
                        All MetaPulse services will be paid with PULSEAI tokens. Revenue from bot usage, 
                        premium features, and trading fees goes directly into the chart, 
                        creating sustainable value for all token holders
                      </p>
                    </div>
                  </div>
                </div>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.8}>
              <CyberCard>
                <h3 className="text-2xl font-bold text-white mb-4">Tokenomics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Supply:</span>
                    <span className="text-white">1,000,000,000 PULSEAI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Presale Allocation:</span>
                    <span className="text-white">30% (300M tokens)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Future Development:</span>
                    <span className="text-white">30% (300M tokens) - Locked</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Liquidity Pool:</span>
                    <span className="text-white">10% (100M tokens)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume Booster & Marketing:</span>
                    <span className="text-white">20% (200M tokens)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Treasury:</span>
                    <span className="text-white">10% (100M tokens)</span>
                  </div>
                </div>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.9}>
              <CyberCard>
                <h3 className="text-2xl font-bold text-white mb-4">Token Utility</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Premium AI Analysis:</span>
                    <span className="text-white">Paid with PULSEAI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Advanced Trading Signals:</span>
                    <span className="text-white">Paid with PULSEAI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority Alerts:</span>
                    <span className="text-white">Paid with PULSEAI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custom AI Strategies:</span>
                    <span className="text-white">Paid with PULSEAI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue Sharing:</span>
                    <span className="text-green-400">70% to buybacks</span>
                  </div>
                </div>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={1.0}>
              <CyberCard>
                <h3 className="text-2xl font-bold text-white mb-4">Roadmap</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Q4 2024 - Meta Sniffer Launch</h4>
                      <p className="text-slate-400 text-sm">AI-powered token analysis and trend detection</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">●</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Q1 2025 - AI Sniper Module</h4>
                      <p className="text-slate-400 text-sm">Automated trading system with AI predictions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">○</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Q2 2025 - AI Launchpad</h4>
                      <p className="text-slate-400 text-sm">Token creation and deployment platform</p>
                    </div>
                  </div>
                </div>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16">
          <AnimatedText>
            <CyberCard glow className="text-center">
              <h2 className="text-4xl font-bold mb-6 gradient-text">
                Ready to Join the Future?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
                Be part of the next generation of AI-powered trading. Get early access to 
                market intelligence that gives you the edge over traditional traders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CyberButton variant="primary" size="lg" className="group">
                  Join Presale Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </CyberButton>
                <CyberButton variant="secondary" size="lg" className="group">
                  Learn More <TrendingUp className="ml-2 group-hover:scale-110 transition-transform" />
                </CyberButton>
              </div>
            </CyberCard>
          </AnimatedText>
        </div>
      </div>
    </div>
  );
}