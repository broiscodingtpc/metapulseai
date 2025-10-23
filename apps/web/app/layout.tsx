import type { Metadata } from 'next';
import { Space_Grotesk, Outfit, Rajdhani } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './context/ThemeContext';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import ToastProvider from './components/ToastProvider';
import Logo from './components/Logo';
import CyberButton from './components/CyberButton';

// Professional DApp fonts with next/font
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

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
    <html lang="en" className={`${spaceGrotesk.variable} ${outfit.variable} ${rajdhani.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0b0f" />
        {/* Prevent FOUC (Flash of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className={`bg-light-bg dark:bg-dark-950 text-light-text-high dark:text-white antialiased transition-colors duration-300 ${outfit.className}`}>
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}