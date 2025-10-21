'use client';

import Link from 'next/link';
import CyberButton from './CyberButton';

export default function PageNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between p-6 mb-8">
      <div className="text-2xl font-bold gradient-text">MetaPulse AI</div>
      <div className="hidden md:flex space-x-8 items-center">
        <Link href="/" className="text-white hover:text-primary-400 transition-colors">Home</Link>
        <Link href="/presale" className="text-white hover:text-primary-400 transition-colors">Presale</Link>
        <Link href="/feed" className="text-white hover:text-primary-400 transition-colors">Live Feed</Link>
        <Link href="/tokens" className="text-white hover:text-primary-400 transition-colors">Scanner</Link>
        <Link href="/metas" className="text-white hover:text-primary-400 transition-colors">Metas</Link>
        <a href="https://x.com/METAPULSaibot" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-400 transition-colors">
          𝕏 Twitter
        </a>
      </div>
      <a href="https://t.me/MetaPulseAIBot" target="_blank" rel="noopener noreferrer">
        <CyberButton variant="accent" size="sm">
          Join Telegram
        </CyberButton>
      </a>
    </nav>
  );
}

