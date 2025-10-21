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
      </head>
      <body>{children}</body>
    </html>
  );
}