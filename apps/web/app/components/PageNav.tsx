'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import CyberButton from './CyberButton';

export default function PageNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="relative z-50 flex items-center justify-between p-6 mb-8">
        <div className="text-2xl font-bold gradient-text">MetaPulse AI</div>
        
        {/* Desktop Menu */}
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
        
        {/* Desktop Telegram Button */}
        <div className="hidden md:block">
          <a href="https://t.me/metapulseai" target="_blank" rel="noopener noreferrer">
            <CyberButton variant="accent" size="sm">
              Join Telegram
            </CyberButton>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-white hover:text-primary-400 transition-colors p-2"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
        >
          <div 
            className="absolute top-20 right-4 left-4 bg-[#0f1116] border border-[#1a1e27] rounded-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-white hover:text-primary-400 transition-colors text-lg py-2 border-b border-[#1a1e27]"
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link 
                href="/presale" 
                className="text-white hover:text-primary-400 transition-colors text-lg py-2 border-b border-[#1a1e27]"
                onClick={closeMenu}
              >
                Presale
              </Link>
              <Link 
                href="/feed" 
                className="text-white hover:text-primary-400 transition-colors text-lg py-2 border-b border-[#1a1e27]"
                onClick={closeMenu}
              >
                Live Feed
              </Link>
              <Link 
                href="/tokens" 
                className="text-white hover:text-primary-400 transition-colors text-lg py-2 border-b border-[#1a1e27]"
                onClick={closeMenu}
              >
                Scanner
              </Link>
              <Link 
                href="/metas" 
                className="text-white hover:text-primary-400 transition-colors text-lg py-2 border-b border-[#1a1e27]"
                onClick={closeMenu}
              >
                Metas
              </Link>
              <a 
                href="https://x.com/METAPULSaibot" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-primary-400 transition-colors text-lg py-2 border-b border-[#1a1e27]"
                onClick={closeMenu}
              >
                𝕏 Twitter
              </a>
              <div className="pt-4">
                <a href="https://t.me/metapulseai" target="_blank" rel="noopener noreferrer" className="block">
                  <CyberButton variant="accent" size="sm" className="w-full">
                    Join Telegram Group
                  </CyberButton>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

