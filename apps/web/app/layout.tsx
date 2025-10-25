import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NotificationSystem from './components/NotificationSystem';
import ErrorBoundary from './components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MetaPulse AI Bot - Feel the Pulse Before the Market Does',
  description: 'AI-powered cryptocurrency market intelligence with real-time analytics, buy signals, and meta trend detection.',
  keywords: 'cryptocurrency, AI, trading bot, market analysis, Solana, DeFi, buy signals',
  authors: [{ name: 'MetaPulse Team' }],
  openGraph: {
    title: 'MetaPulse AI Bot',
    description: 'AI-powered cryptocurrency market intelligence with real-time analytics',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-console-bg text-console-fg min-h-screen`}>
        <ErrorBoundary>
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </div>
          <NotificationSystem />
        </ErrorBoundary>
      </body>
    </html>
  );
}