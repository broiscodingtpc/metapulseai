'use client';

import React from 'react';
import Link from 'next/link';
import { AsciiFrame, AsciiTable, AsciiBadge } from './components/ascii';
import RealTimeDashboard from './components/RealTimeDashboard';

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 typing">
          MetaPulse AI Bot
        </h1>
        <p className="text-xl md:text-2xl text-console-dim mb-8 max-w-3xl mx-auto">
          Feel the pulse before the market does - Now with Real-Time AI Analytics
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="https://t.me/metapulseai" className="ascii-button ascii-button-primary">
            [ Join Telegram Bot ]
          </Link>
          <Link href="/analytics" className="ascii-button">
            [ Live Analytics ]
          </Link>
          <Link href="/whitepaper" className="ascii-button">
            [ View Whitepaper ]
          </Link>
        </div>
      </section>

      {/* Real-Time Dashboard */}
      <section>
        <RealTimeDashboard />
      </section>

      {/* Presale Section */}
      <section>
        <AsciiFrame title="$PULSEAI Presale - LIVE NOW" variant="highlight" className="mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-console-cyan">Early Bird Bonus</h3>
              <div className="ascii-box p-4 mb-4 bg-console-panel">
                <div className="text-console-yellow text-lg font-bold mb-2">
                  4X BONUS FOR FIRST 60 SOL
                </div>
                <div className="text-console-fg text-sm">
                  • Buy 100K tokens → Get 400K tokens
                </div>
                <div className="text-console-fg text-sm">
                  • Buy 250K tokens → Get 1M tokens
                </div>
                <div className="text-console-fg text-sm">
                  • Limited time offer - First come, first served!
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-console-dim">Project:</span>
                  <span className="text-console-fg">AI Market Intelligence</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-console-dim">Network:</span>
                  <span className="text-console-fg">Solana</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-console-dim">Use Case:</span>
                  <span className="text-console-fg">Meta Detection & Trading</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-console-dim">Status:</span>
                  <span className="text-console-green">LIVE</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-center mb-6">
                <div className="text-console-cyan text-2xl font-bold mb-2">
                  ╔═══════════════════════════════╗
                </div>
                <div className="text-console-cyan text-lg mb-1">
                  ║     PRESALE ACTIVE NOW     ║
                </div>
                <div className="text-console-cyan text-2xl font-bold mb-4">
                  ╚═══════════════════════════════╝
                </div>
              </div>
              
              <p className="text-console-dim text-sm mb-6 text-center">
                MetaPulse AI Bot scans blockchain and social activity in real-time to detect emerging metas, 
                narratives, and token trends before they reach mainstream visibility.
              </p>
              
              <Link 
                href="https://solsale.app/presale/68cAkd84nFqD9zjP5Y619XPbbssgmzwxjPyN5dMhqwGj"
                target="_blank"
                rel="noopener noreferrer"
                className="ascii-button ascii-button-primary w-full block text-center mb-4"
              >
                [ BUY $PULSEAI NOW - 4X BONUS! ]
              </Link>
              
              <div className="text-center">
                <Link href="https://t.me/metapulseai" className="ascii-button text-sm">
                  [ Join Telegram for Updates ]
                </Link>
              </div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Project Features */}
      <section>
        <AsciiFrame title="MetaPulse AI Features" className="mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-console-cyan text-3xl mb-3">[ SCAN ]</div>
              <h4 className="font-bold text-console-cyan mb-2">Meta Sniffer</h4>
              <p className="text-console-dim text-sm">
                Monitors every new token on Pump.fun and Raydium, using AI to classify trends like AI Agents, 
                Frogs, Celebrities, Gaming, or Seasonal Metas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-console-yellow text-3xl mb-3">[ ALERT ]</div>
              <h4 className="font-bold text-console-yellow mb-2">Real-Time Alerts</h4>
              <p className="text-console-dim text-sm">
                Receive hourly Telegram alerts showing the most active metas and top-performing tokens, 
                giving traders a predictive edge over the market.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-console-green text-3xl mb-3">[ AI ]</div>
              <h4 className="font-bold text-console-green mb-2">AI Infrastructure</h4>
              <p className="text-console-dim text-sm">
                Future versions include AI Sniper module for automated buys and a Launchpad that creates 
                and deploys tokens directly through MetaPulse's AI assistant.
              </p>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Core Vision */}
      <section>
        <AsciiFrame title="Core Vision & Roadmap">
          <div className="text-center py-6">
            <div className="text-console-dim mb-4">
              ╔═══════════════════════════════════════╗
            </div>
            <div className="text-console-cyan text-lg mb-2">
              ║   AI PREDICTION + MARKET ANALYTICS   ║
            </div>
            <div className="text-console-dim mb-6">
              ╚═══════════════════════════════════════╝
            </div>
            
            <p className="text-console-dim text-sm mb-6 max-w-3xl mx-auto">
              MetaPulse merges AI prediction, market analytics, and trading automation into a unified ecosystem designed for 
              early detection of hot narratives, high-speed market reaction, and long-term sustainability with revenue sharing.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="ascii-box p-3">
                <div className="text-console-green font-bold text-sm mb-1">Phase 1</div>
                <div className="text-console-dim text-xs">Meta Sniffer Launch</div>
              </div>
              <div className="ascii-box p-3">
                <div className="text-console-yellow font-bold text-sm mb-1">Phase 2</div>
                <div className="text-console-dim text-xs">AI Sniper Module</div>
              </div>
              <div className="ascii-box p-3">
                <div className="text-console-cyan font-bold text-sm mb-1">Phase 3</div>
                <div className="text-console-dim text-xs">AI Launchpad</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="https://solsale.app/presale/68cAkd84nFqD9zjP5Y619XPbbssgmzwxjPyN5dMhqwGj"
                target="_blank"
                rel="noopener noreferrer"
                className="ascii-button ascii-button-primary"
              >
                [ Join Presale - 4X Bonus! ]
              </Link>
              <Link href="/whitepaper" className="ascii-button">
                [ Read Whitepaper ]
              </Link>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Navigation Links */}
      <section className="text-center py-8">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/admin" className="ascii-button ascii-button-primary">
            [ Admin Dashboard ]
          </Link>
          <Link href="/analytics" className="ascii-button">
            [ Analytics ]
          </Link>
          <Link href="/monitoring" className="ascii-button">
            [ System Monitor ]
          </Link>
          <Link href="/metas" className="ascii-button">
            [ Browse Metas ]
          </Link>
          <Link href="/feed" className="ascii-button">
            [ Live Feed ]
          </Link>
          <Link href="/tokens" className="ascii-button">
            [ All Tokens ]
          </Link>
        </div>
      </section>
    </div>
  );
}
