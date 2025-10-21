import type { Metadata } from 'next';
import './globals.css';
import Logo from './components/Logo';
import CyberButton from './components/CyberButton';

export const metadata: Metadata = {
  title: 'MetaPulse AI Bot — $PULSEAI',
  description: 'Feel the pulse before the market does. AI-powered market intelligence system built on Solana.',
  keywords: 'AI, cryptocurrency, Solana, trading, market intelligence, blockchain',
  authors: [{ name: 'MetaPulse AI Bot' }],
  openGraph: {
    title: 'MetaPulse AI Bot — $PULSEAI',
    description: 'Feel the pulse before the market does.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-950 text-white antialiased">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="/" className="text-white hover:text-primary-400 transition-colors font-medium">
                  Home
                </a>
                <a href="/presale" className="text-white hover:text-primary-400 transition-colors font-medium">
                  Presale
                </a>
                <a href="/feed" className="text-white hover:text-primary-400 transition-colors font-medium">
                  Live Feed
                </a>
                <a href="/tokens" className="text-white hover:text-primary-400 transition-colors font-medium">
                  Scanner
                </a>
                <a href="/metas" className="text-white hover:text-primary-400 transition-colors font-medium">
                  Metas
                </a>
              </div>
              
              <div className="flex items-center space-x-4">
                <a 
                  href="https://t.me/metapulseaibot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hidden sm:block"
                >
                  <CyberButton variant="accent" size="sm">
                    Join Telegram
                  </CyberButton>
                </a>
                
                {/* Mobile menu button */}
                <button className="md:hidden text-white hover:text-primary-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="pt-20">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-dark-900 border-t border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <Logo size="lg" className="mb-4" />
                <p className="text-slate-400 mb-4 max-w-md">
                  MetaPulse AI Bot — $PULSEAI. Feel the pulse before the market does.
                </p>
                <div className="flex space-x-4">
                  <a href="https://t.me/metapulseaibot" target="_blank" rel="noopener noreferrer" 
                     className="text-slate-400 hover:text-primary-400 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-.896 6.728-.896 6.728-.896 6.728-1.268 7.072-1.268 7.072-.896.448-1.268-.168-1.268-.168L12 18.4l-3.04 3.392s-.372.616-1.268.168c0 0-.372-.168-1.268-7.072 0 0-.727-4.87-.896-6.728-.168-1.68.672-2.352 1.44-2.352.672 0 .896.168.896.168l3.04 2.24s.168.112.336.112.336-.112.336-.112l3.04-2.24s.168-.168.896-.168c.768 0 1.608.672 1.44 2.352z"/>
                    </svg>
                  </a>
                  <a href="https://twitter.com/metapulseai" target="_blank" rel="noopener noreferrer" 
                     className="text-slate-400 hover:text-primary-400 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="/feed" className="text-slate-400 hover:text-primary-400 transition-colors">Live Feed</a></li>
                  <li><a href="/tokens" className="text-slate-400 hover:text-primary-400 transition-colors">Token Scanner</a></li>
                  <li><a href="/metas" className="text-slate-400 hover:text-primary-400 transition-colors">Meta Analysis</a></li>
                  <li><a href="/presale" className="text-slate-400 hover:text-primary-400 transition-colors">Presale</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Community</h3>
                <ul className="space-y-2">
                  <li><a href="https://t.me/metapulseaibot" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary-400 transition-colors">Telegram</a></li>
                  <li><a href="https://twitter.com/metapulseai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary-400 transition-colors">Twitter</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">Discord</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">Documentation</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-800/50 mt-8 pt-8 text-center">
              <p className="text-slate-500 text-sm">
                © 2024 MetaPulse AI Bot. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}