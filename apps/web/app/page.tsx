'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Brain, Zap, Target, Shield, TrendingUp, Users, Globe, DollarSign } from 'lucide-react';
import CyberButton from './components/CyberButton';
import CyberCard from './components/CyberCard';
import AnimatedText from './components/AnimatedText';
import ParticleBackground from './components/ParticleBackground';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-deep-bg relative overflow-hidden">
      <ParticleBackground />
      

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Plasma Light Sweep Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-electric-blue/5 to-accent-violet/10 plasma-sweep"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          
          <AnimatedText delay={0.2}>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 tech-heading gradient-text">
              MetaPulse AI Bot
            </h1>
          </AnimatedText>
          
          <AnimatedText delay={0.4}>
            <h2 className="text-2xl md:text-3xl font-semibold text-text-mid mb-8">
              Feel the pulse before the market does.
            </h2>
          </AnimatedText>
          
          <AnimatedText delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tokens">
                <CyberButton className="text-lg px-8 py-4 cta-button">
                  Live DEX
                </CyberButton>
              </Link>
              <Link href="/feed">
                <CyberButton variant="secondary" className="text-lg px-8 py-4 cta-button">
                  AI Feed
                </CyberButton>
              </Link>
              <Link href="/presale">
                <CyberButton variant="accent" className="text-lg px-8 py-4 cta-button">
                  Join Presale
                </CyberButton>
              </Link>
            </div>
          </AnimatedText>
        </div>
      </section>

      {/* Project Overview */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 tech-heading gradient-text">
              Project Overview
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <AnimatedText delay={0.2}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Brain className="w-8 h-8 text-neon-cyan mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">AI-Powered Analysis</h3>
                </div>
                <p className="text-text-mid leading-relaxed mb-4">
                  Advanced AI algorithms analyze token metadata, market sentiment, and trading patterns 
                  to identify emerging narratives and potential opportunities.
                </p>
                <ul className="text-text-mid space-y-2">
                  <li>• Real-time token categorization</li>
                  <li>• Sentiment analysis and scoring</li>
                  <li>• Pattern recognition and prediction</li>
                  <li>• Automated risk assessment</li>
                </ul>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.4}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-electric-blue mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">Live Market Intelligence</h3>
                </div>
                <p className="text-text-mid leading-relaxed mb-4">
                  Continuous monitoring of Solana token creation and trading activity with 
                  instant alerts and comprehensive market insights.
                </p>
                <ul className="text-text-mid space-y-2">
                  <li>• Real-time token creation alerts</li>
                  <li>• Live trading volume analysis</li>
                  <li>• Market cap and liquidity tracking</li>
                  <li>• Telegram integration for instant updates</li>
                </ul>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Core Vision */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 tech-heading gradient-text">
              Core Vision
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedText delay={0.2}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-neon-cyan mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">Precision Detection</h3>
                </div>
                <p className="text-text-mid leading-relaxed">
                  Identify high-potential tokens before they gain mainstream attention, 
                  giving you the edge in the fast-paced crypto market.
                </p>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.4}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <Shield className="w-8 h-8 text-electric-blue mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">Risk Mitigation</h3>
                </div>
                <p className="text-text-mid leading-relaxed">
                  Advanced filtering and analysis help avoid rug pulls and low-quality projects, 
                  protecting your investments with intelligent risk assessment.
                </p>
              </CyberCard>
            </AnimatedText>

            <AnimatedText delay={0.6}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-8 h-8 text-accent-violet mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">Market Advantage</h3>
                </div>
                <p className="text-text-mid leading-relaxed">
                  Stay ahead of market trends with AI-powered insights and real-time analysis 
                  that adapts to changing market conditions.
                </p>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Monetization Model */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 tech-heading gradient-text">
              Monetization & Value Creation
            </h2>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <AnimatedText delay={0.2}>
              <CyberCard glow>
                <div className="flex items-center mb-4">
                  <DollarSign className="w-8 h-8 text-neon-cyan mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">Paid Services Model</h3>
                </div>
                <p className="text-text-mid leading-relaxed mb-4">
                  All MetaPulse services will be paid exclusively with PULSEAI tokens. 
                  This creates constant demand and utility for the token.
                </p>
                <ul className="text-text-mid space-y-2">
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
                  <TrendingUp className="w-8 h-8 text-electric-blue mr-3" />
                  <h3 className="text-2xl font-bold text-text-high">Revenue Distribution</h3>
                </div>
                <p className="text-text-mid leading-relaxed mb-4">
                  All revenue from services, trading fees, and platform usage 
                  goes directly into the PULSEAI chart, benefiting all holders.
                </p>
                <ul className="text-text-mid space-y-2">
                  <li>• 70% to token buybacks</li>
                  <li>• 20% to development</li>
                  <li>• 10% to marketing</li>
                </ul>
              </CyberCard>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Rate Limit Notice */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatedText>
            <div className="glass-panel rounded-xl p-6 neon-border">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <span className="text-neon-cyan text-lg">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-text-high">AI Rate Limits & Future Upgrades</h3>
              </div>
              <p className="text-text-mid leading-relaxed mb-4">
                Currently operating within free tier limits (500K tokens/day). As we raise funds and develop, 
                we will upgrade to higher rate limits for unlimited AI analysis and faster processing.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-mid">Current Status:</span>
                  <span className="text-neon-cyan">Free Tier (Limited)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-mid">Future Upgrade:</span>
                  <span className="text-electric-blue">Developer Tier (Unlimited)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-mid">AI Analysis:</span>
                  <span className="text-accent-violet">Smart Fallback Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-mid">Upgrade Timeline:</span>
                  <span className="text-neon-cyan">Post-Fundraising</span>
                </div>
              </div>
            </div>
          </AnimatedText>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 tech-heading gradient-text">
              Ready to Feel the Pulse?
            </h2>
          </AnimatedText>
          
          <AnimatedText delay={0.2}>
            <p className="text-xl text-text-mid mb-12 max-w-2xl mx-auto">
              Join the future of AI-powered crypto analysis. Get early access to the most advanced 
              token intelligence platform on Solana.
            </p>
          </AnimatedText>
          
          <AnimatedText delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/presale">
                <CyberButton className="text-lg px-8 py-4 cta-button">
                  Join Presale
                </CyberButton>
              </Link>
              <Link href="/feed">
                <CyberButton variant="secondary" className="text-lg px-8 py-4 cta-button">
                  View Live Feed
                </CyberButton>
              </Link>
            </div>
          </AnimatedText>
        </div>
      </section>
    </div>
  );
}