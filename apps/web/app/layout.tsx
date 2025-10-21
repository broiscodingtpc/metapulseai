import './globals.css';
import Navigation from './components/Navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>MetaPulse AI Bot — $PULSEAI</title>
        <meta name="description" content="Feel the pulse before the market does. AI-powered market intelligence system built on Solana." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-black text-white antialiased">
        <Navigation />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}