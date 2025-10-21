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
        {children}
      </body>
    </html>
  );
}