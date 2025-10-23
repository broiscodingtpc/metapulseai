'use client';

import { motion } from 'framer-motion';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Brain, Zap, Target, Shield, TrendingUp, Globe, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { SiSolana, SiOpenai, SiTelegram, SiX } from 'react-icons/si';
import CyberButton from './components/CyberButton';
import ElectricBorder from './components/ElectricBorder';
import MetallicPaint from './components/MetallicPaint';
import LogoLoop from './components/LogoLoop';
import AnimatedText from './components/AnimatedText';
import PageNav from './components/PageNav';
import LiquidEther from './components/LiquidEther';
import Noise from './components/Noise';

// Dynamic imports for heavy components
const OrbBackground = dynamicImport(() => import('./components/OrbBackground'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-gradient-to-b from-dark-950 to-dark-900" />
});

const ParticleBackground = dynamicImport(() => import('./components/ParticleBackground'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-gradient-to-b from-dark-950 to-dark-900" />
});

// Tech partners logos
const techLogos = [
  { node: <SiSolana className="text-purple-400 text-5xl" />, title: "Solana", href: "https://solana.com" },
  { node: <SiOpenai className="text-green-400 text-5xl" />, title: "OpenAI", href: "https://openai.com" },
  { node: <SiTelegram className="text-blue-400 text-5xl" />, title: "Telegram", href: "https://telegram.org" },
  { node: <Brain className="text-cyan-400 text-5xl" />, title: "AI Intelligence" },
  { node: <Activity className="text-pink-400 text-5xl" />, title: "Real-time Data" },
  { node: <BarChart3 className="text-yellow-400 text-5xl" />, title: "Analytics" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#05060a] dark:bg-[#05060a] relative overflow-hidden">
      {/* Interactive Background */}
      <div className="absolute inset-0 w-full h-full">
        <LiquidEther 
          colors={['#5227FF', '#FF9FFC', '#B19EEF']} 
          mouseForce={20} 
          cursorSize={100} 
          isViscous={false} 
          viscous={30} 
          iterationsViscous={32} 
          iterationsPoisson={32} 
          resolution={0.5} 
          isBounce={false} 
          autoDemo={true} 
          autoSpeed={0.5} 
          autoIntensity={2.2} 
          takeoverDuration={0.25} 
          autoResumeDelay={3000} 
          autoRampDuration={0.6} 
        />
        <Noise 
          patternSize={250} 
          patternScaleX={1} 
          patternScaleY={1} 
          patternRefreshInterval={2} 
          patternAlpha={15} 
        />
      </div>
      
      <PageNav />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-6 py-32 text-center" aria-label="Hero">
          <AnimatedText delay={0.1}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-7xl md:text-9xl font-bold mb-6">
                <MetallicPaint>
                  MetaPulse AI
                </MetallicPaint>
              </h1>
              <div className="text-3xl md:text-4xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                $PULSEAI
              </div>
            </motion.div>
          </AnimatedText>
          
          <AnimatedText delay={0.3}>
            <motion.p 
              className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Advanced AI-Powered Market Intelligence System
              <br />
              <span className="text-cyan-400 font-semibold">Feel the pulse before the market does</span>
            </motion.p>
          </AnimatedText>

          <AnimatedText delay={0.5}>
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link href="/presale">
                <CyberButton variant="primary" size="lg" className="group min-w-[200px]">
                  Join Presale <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </CyberButton>
              </Link>
              <Link href="/feed">
                <CyberButton variant="secondary" size="lg" className="group min-w-[200px]">
                  Live Feed <TrendingUp className="ml-2 group-hover:scale-110 transition-transform" />
                </CyberButton>
              </Link>
            </motion.div>
          </AnimatedText>

          {/* Partners Logo Loop */}
          <AnimatedText delay={0.7}>
            <div className="mt-20">
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-6">Powered By</p>
              <LogoLoop
                logos={techLogos}
                speed={30}
                direction="left"
                logoHeight={48}
                gap={60}
                pauseOnHover
                scaleOnHover
                fadeOut
                fadeOutColor="#05060a"
                ariaLabel="Technology partners"
              />
            </div>
          </AnimatedText>
        </section>

        {/* Core Features Section */}
        <section className="px-6 py-24" aria-label="Core Features">
          <div className="max-w-7xl mx-auto">
            <AnimatedText>
              <h2 className="text-5xl md:text-6xl font-bold text-center mb-16">
                <MetallicPaint gradientColors={['#00e5ff', '#3fa9ff', '#7a5cff', '#00e5ff']}>
                  Intelligence System
                </MetallicPaint>
              </h2>
            </AnimatedText>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Brain className="w-12 h-12" />,
                  title: "AI-Powered Analysis",
                  description: "Advanced machine learning algorithms scan blockchain and social activity in real-time to detect emerging metas before they peak."
                },
                {
                  icon: <Zap className="w-12 h-12" />,
                  title: "Real-Time Detection",
                  description: "Lightning-fast token scanning on Pump.fun and Raydium with instant AI categorization and risk analysis."
                },
                {
                  icon: <Target className="w-12 h-12" />,
                  title: "Predictive Edge",
                  description: "Receive hourly alerts with top-performing metas and tokens, giving traders a significant market advantage."
                },
                {
                  icon: <Shield className="w-12 h-12" />,
                  title: "Risk Analysis",
                  description: "Comprehensive security scoring system evaluates token safety and identifies potential red flags automatically."
                },
                {
                  icon: <TrendingUp className="w-12 h-12" />,
                  title: "Meta Tracking",
                  description: "Track emerging narratives across AI Agents, Gaming, DeFi, and seasonal trends with precision analytics."
                },
                {
                  icon: <Globe className="w-12 h-12" />,
                  title: "Multi-Chain Ready",
                  description: "Built on Solana with architecture designed for expansion to Ethereum, BSC, and other major blockchains."
                }
              ].map((feature, index) => (
                <AnimatedText key={index} delay={0.1 * index}>
                  <ElectricBorder
                    color="#00e5ff"
                    speed={0.8}
                    chaos={0.3}
                    thickness={1.5}
                    style={{ borderRadius: 20 }}
                  >
                    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-8 rounded-[20px] h-full transition-all duration-300 hover:scale-[1.02]">
                      <div className="text-cyan-400 mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </ElectricBorder>
                </AnimatedText>
              ))}
            </div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section className="px-6 py-24 bg-gradient-to-b from-transparent to-slate-950/50" aria-label="Tokenomics">
          <div className="max-w-6xl mx-auto">
            <AnimatedText>
              <h2 className="text-5xl md:text-6xl font-bold text-center mb-4">
                <MetallicPaint gradientColors={['#7a5cff', '#3fa9ff', '#00e5ff', '#7a5cff']}>
                  $PULSEAI Token
                </MetallicPaint>
              </h2>
              <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                Sustainable tokenomics with revenue sharing and utility-driven value
              </p>
            </AnimatedText>

            <div className="grid md:grid-cols-2 gap-8">
              <AnimatedText delay={0.2}>
                <ElectricBorder
                  color="#7a5cff"
                  speed={0.6}
                  chaos={0.4}
                  thickness={2}
                  style={{ borderRadius: 24 }}
                >
                  <div className="bg-gradient-to-br from-purple-950/80 to-slate-950/80 backdrop-blur-xl p-10 rounded-[24px]">
                    <div className="flex items-center mb-6">
                      <DollarSign className="w-10 h-10 text-purple-400 mr-4" />
                      <h3 className="text-3xl font-bold text-white">Distribution</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Presale", value: "30%", amount: "300M tokens" },
                        { label: "Future Development", value: "30%", amount: "300M tokens", locked: true },
                        { label: "Liquidity Pool", value: "10%", amount: "100M tokens" },
                        { label: "Volume Booster", value: "20%", amount: "200M tokens" },
                        { label: "Treasury", value: "10%", amount: "100M tokens" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                          <div>
                            <span className="text-white font-semibold">{item.label}</span>
                            {item.locked && <span className="ml-2 text-xs text-yellow-400">LOCKED</span>}
                          </div>
                          <div className="text-right">
                            <span className="text-cyan-400 font-bold text-xl">{item.value}</span>
                            <div className="text-slate-500 text-sm">{item.amount}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ElectricBorder>
              </AnimatedText>

              <AnimatedText delay={0.4}>
                <ElectricBorder
                  color="#00e5ff"
                  speed={0.6}
                  chaos={0.4}
                  thickness={2}
                  style={{ borderRadius: 24 }}
                >
                  <div className="bg-gradient-to-br from-cyan-950/80 to-slate-950/80 backdrop-blur-xl p-10 rounded-[24px]">
                    <div className="flex items-center mb-6">
                      <TrendingUp className="w-10 h-10 text-cyan-400 mr-4" />
                      <h3 className="text-3xl font-bold text-white">Revenue Model</h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Service Payment</h4>
                        <p className="text-slate-400 text-sm">All MetaPulse services paid exclusively with PULSEAI tokens, creating constant demand</p>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-2">Revenue Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-slate-300">Token Buybacks</span>
                            <span className="text-green-400 font-bold">70%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-slate-300">Development</span>
                            <span className="text-blue-400 font-bold">20%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-slate-300">Marketing</span>
                            <span className="text-purple-400 font-bold">10%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ElectricBorder>
              </AnimatedText>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="px-6 py-24" aria-label="Roadmap">
          <div className="max-w-6xl mx-auto">
            <AnimatedText>
              <h2 className="text-5xl md:text-6xl font-bold text-center mb-16">
                <MetallicPaint>
                  Development Roadmap
                </MetallicPaint>
              </h2>
            </AnimatedText>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-transparent hidden md:block"></div>

              <div className="space-y-8">
                {[
                  {
                    phase: "Phase 1",
                    title: "Meta Sniffer Launch",
                    status: "LIVE",
                    statusColor: "bg-green-500",
                    items: ["Real-time token scanning", "AI categorization", "Telegram bot", "Live web dashboard"]
                  },
                  {
                    phase: "Phase 2",
                    title: "AI Sniper Module",
                    status: "Q1 2025",
                    statusColor: "bg-yellow-500",
                    items: ["Automated trading", "AI predictions", "Risk management", "Portfolio tracking"]
                  },
                  {
                    phase: "Phase 3",
                    title: "AI Launchpad",
                    status: "Q2 2025",
                    statusColor: "bg-blue-500",
                    items: ["Token creation platform", "AI-assisted deployment", "Liquidity management", "Marketing tools"]
                  },
                  {
                    phase: "Phase 4",
                    title: "Multi-Chain Expansion",
                    status: "Q3 2025",
                    statusColor: "bg-purple-500",
                    items: ["Ethereum support", "BSC integration", "Cross-chain analytics", "Unified dashboard"]
                  }
                ].map((roadmap, index) => (
                  <AnimatedText key={index} delay={0.1 * index}>
                    <div className="relative md:ml-24">
                      {/* Timeline dot */}
                      <div className="absolute -left-16 top-8 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-500 hidden md:flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${roadmap.statusColor}`}></div>
                      </div>

                      <ElectricBorder
                        color={index === 0 ? "#00ff88" : index === 1 ? "#ffaa00" : "#00e5ff"}
                        speed={0.5}
                        chaos={0.2}
                        thickness={1.5}
                        style={{ borderRadius: 16 }}
                      >
                        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-8 rounded-[16px]">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-sm text-slate-500 font-semibold mb-1">{roadmap.phase}</div>
                              <h3 className="text-2xl font-bold text-white">{roadmap.title}</h3>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${roadmap.statusColor} text-white`}>
                              {roadmap.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {roadmap.items.map((item, i) => (
                              <div key={i} className="flex items-center text-slate-300 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </ElectricBorder>
                    </div>
                  </AnimatedText>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Presale Section */}
        <section className="px-6 py-24" aria-label="Presale">
          <div className="max-w-6xl mx-auto">
            <AnimatedText>
              <h2 className="text-5xl md:text-6xl font-bold text-center mb-4">
                <MetallicPaint gradientColors={['#ff6b6b', '#ffa500', '#ffff00', '#ff6b6b']}>
                  Token Presale
                </MetallicPaint>
              </h2>
              <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                Secure your allocation of $PULSEAI tokens at presale rates
              </p>
            </AnimatedText>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Presale Widget */}
              <AnimatedText delay={0.2}>
                <ElectricBorder
                  color="#ffa500"
                  speed={0.8}
                  chaos={0.4}
                  thickness={2}
                  style={{ borderRadius: 24 }}
                >
                  <div className="bg-gradient-to-br from-orange-950/80 to-slate-950/80 backdrop-blur-xl p-8 rounded-[24px]">
                    <h3 className="text-2xl font-bold text-white mb-6 text-center uppercase tracking-wide">
                      Join Presale
                    </h3>
                    <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
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
                      <p className="text-slate-500 text-sm mb-4 uppercase tracking-wide">
                        Connect Wallet to Participate
                      </p>
                    </div>
                  </div>
                </ElectricBorder>
              </AnimatedText>

              {/* Benefits */}
              <div className="space-y-6">
                <AnimatedText delay={0.3}>
                  <ElectricBorder color="#00e5ff" speed={0.6} chaos={0.3} thickness={1.5} style={{ borderRadius: 16 }}>
                    <div className="bg-gradient-to-br from-cyan-950/80 to-slate-950/80 backdrop-blur-xl p-6 rounded-2xl">
                      <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">Why Invest</h3>
                      <div className="space-y-4">
                        {[
                          { title: "AI-Powered Intelligence", desc: "Advanced system detecting market trends before mainstream" },
                          { title: "Revenue Sharing", desc: "70% of all service revenue goes to token buybacks" },
                          { title: "Utility Token", desc: "Required for all MetaPulse premium features" }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Zap className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
                              <p className="text-slate-500 text-xs">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ElectricBorder>
                </AnimatedText>

                <AnimatedText delay={0.4}>
                  <ElectricBorder color="#7a5cff" speed={0.6} chaos={0.3} thickness={1.5} style={{ borderRadius: 16 }}>
                    <div className="bg-gradient-to-br from-purple-950/80 to-slate-950/80 backdrop-blur-xl p-6 rounded-2xl">
                      <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">Token Supply</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                          <span className="text-slate-400 text-sm">Total Supply</span>
                          <span className="text-white font-mono font-semibold">1,000,000,000</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                          <span className="text-slate-400 text-sm">Presale</span>
                          <span className="text-cyan-400 font-mono font-bold">30%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                          <span className="text-slate-400 text-sm">Development</span>
                          <span className="text-purple-400 font-mono font-bold">30%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                          <span className="text-slate-400 text-sm">Liquidity</span>
                          <span className="text-green-400 font-mono font-bold">10%</span>
                        </div>
                      </div>
                    </div>
                  </ElectricBorder>
                </AnimatedText>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-32" aria-label="Call to Action">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedText>
              <ElectricBorder
                color="#7a5cff"
                speed={1}
                chaos={0.5}
                thickness={2}
                style={{ borderRadius: 32 }}
              >
                <div className="bg-gradient-to-br from-purple-950/90 via-slate-950/90 to-cyan-950/90 backdrop-blur-xl p-16 rounded-[32px]">
                  <h2 className="text-5xl md:text-6xl font-bold mb-6">
                    <MetallicPaint>
                      Ready to Dominate?
                    </MetallicPaint>
                  </h2>
                  
                  <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                    Join the future of AI-powered trading intelligence. 
                    <br />
                    Be among the first to experience market-leading insights.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link href="/presale">
                      <CyberButton variant="primary" size="lg" className="group min-w-[220px]">
                        Join Presale Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </CyberButton>
                    </Link>
                    <a href="https://t.me/metapulseai" target="_blank" rel="noopener noreferrer">
                      <CyberButton variant="accent" size="lg" className="min-w-[220px]">
                        Join Community
                      </CyberButton>
                    </a>
                  </div>

                  {/* Social Links */}
                  <div className="flex justify-center gap-6 mt-12">
                    <a href="https://t.me/metapulseai" target="_blank" rel="noopener noreferrer" 
                       className="text-slate-400 hover:text-cyan-400 transition-colors"
                       aria-label="Telegram">
                      <SiTelegram className="w-8 h-8" />
                    </a>
                    <a href="https://x.com/METAPULSaibot" target="_blank" rel="noopener noreferrer"
                       className="text-slate-400 hover:text-cyan-400 transition-colors"
                       aria-label="X (Twitter)">
                      <SiX className="w-8 h-8" />
                    </a>
                  </div>
                </div>
              </ElectricBorder>
            </AnimatedText>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-slate-800/50" role="contentinfo">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4">
            <MetallicPaint>MetaPulse AI</MetallicPaint>
          </div>
          <p className="text-slate-500 text-sm mb-2">
            Advanced AI-Powered Market Intelligence System
          </p>
          <p className="text-slate-600 text-xs">
            $PULSEAI | Solana Blockchain
          </p>
        </div>
      </footer>
    </div>
  );
}
