import type { Metadata } from 'next';
import { Inter, Sora, Orbitron, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './context/ThemeContext';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import ToastProvider from './components/ToastProvider';
import Logo from './components/Logo';
import CyberButton from './components/CyberButton';

// Optimize fonts with next/font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
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
    <html lang="en" className={`${inter.variable} ${sora.variable} ${orbitron.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
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
      <body className={`bg-light-bg dark:bg-dark-950 text-light-text-high dark:text-white antialiased transition-colors duration-300 ${inter.className}`}>
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}