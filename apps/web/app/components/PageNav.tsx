'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import CyberButton from './CyberButton';
import ThemeToggle from './ThemeToggle';
import CircularText from './CircularText';

export default function PageNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header>
        <nav className="relative z-50 flex items-center justify-between p-6 mb-8" role="navigation" aria-label="Main navigation">
          <Link href="/" className="block">
            <CircularText 
              text="METAPULSE*AI*BOT*$PULSEAI*"
              spinDuration={20}
              onHover="speedUp"
              size={80}
            />
          </Link>
        
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-slate-700 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Home</Link>
            <Link href="/feed" className="text-slate-700 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Live Feed</Link>
            <Link href="/tokens" className="text-slate-700 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Scanner</Link>
            <Link href="/metas" className="text-slate-700 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Metas</Link>
            <a href="https://x.com/METAPULSaibot" target="_blank" rel="noopener noreferrer" className="text-slate-700 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
              Twitter
            </a>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <a href="https://t.me/metapulseai" target="_blank" rel="noopener noreferrer">
              <CyberButton variant="accent" size="sm">
                Join Telegram
              </CyberButton>
            </a>
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden text-slate-700 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors p-2"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </header>

      {isMenuOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            id="mobile-menu"
            className="absolute top-20 right-4 left-4 bg-light-panel dark:bg-[#0f1116] border border-light-edge dark:border-[#1a1e27] rounded-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 500 }}
          >
            <nav className="flex flex-col space-y-4" aria-label="Mobile menu">
              <Link 
                href="/" 
                className="text-slate-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-lg py-2 border-b border-light-edge dark:border-[#1a1e27]"
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link 
                href="/presale" 
                className="text-slate-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-lg py-2 border-b border-light-edge dark:border-[#1a1e27]"
                onClick={closeMenu}
              >
                Presale
              </Link>
              <Link 
                href="/feed" 
                className="text-slate-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-lg py-2 border-b border-light-edge dark:border-[#1a1e27]"
                onClick={closeMenu}
              >
                Live Feed
              </Link>
              <Link 
                href="/tokens" 
                className="text-slate-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-lg py-2 border-b border-light-edge dark:border-[#1a1e27]"
                onClick={closeMenu}
              >
                Scanner
              </Link>
              <Link 
                href="/metas" 
                className="text-slate-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-lg py-2 border-b border-light-edge dark:border-[#1a1e27]"
                onClick={closeMenu}
              >
                Metas
              </Link>
              <a 
                href="https://x.com/METAPULSaibot" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-lg py-2 border-b border-light-edge dark:border-[#1a1e27]"
                onClick={closeMenu}
              >
                𝕏 Twitter
              </a>
              
              <div className="flex items-center justify-between py-2 border-b border-light-edge dark:border-[#1a1e27]">
                <span className="text-slate-800 dark:text-white text-lg">Theme</span>
                <ThemeToggle />
              </div>
              
              <div className="pt-4">
                <a href="https://t.me/metapulseai" target="_blank" rel="noopener noreferrer" className="block">
                  <CyberButton variant="accent" size="sm" className="w-full">
                    Join Telegram Group
                  </CyberButton>
                </a>
              </div>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
