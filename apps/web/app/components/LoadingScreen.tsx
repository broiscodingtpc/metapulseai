'use client';

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    "Initializing MetaPulse AI...",
    "Connecting to Solana network...",
    "Loading market intelligence...",
    "Preparing console interface...",
    "System ready!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-console-bg flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* ASCII Logo */}
        <div className="text-console-cyan font-mono text-sm mb-8">
          <pre className="whitespace-pre">
{`
╔══════════════════════════════════════╗
║                                      ║
║           MetaPulse AI               ║
║                                      ║
║    ████████████████████████████      ║
║    ██                        ██      ║
║    ██  Feel the pulse before ██      ║
║    ██    the market does     ██      ║
║    ██                        ██      ║
║    ████████████████████████████      ║
║                                      ║
╚══════════════════════════════════════╝
`}
          </pre>
        </div>

        {/* Loading Message */}
        <div className="mb-6">
          <div className="text-console-fg text-lg font-bold mb-2 typing">
            {messages[currentMessage]}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="ascii-box p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-console-dim text-sm">LOADING:</span>
              <span className="text-console-cyan text-sm">{progress}%</span>
            </div>
            
            <div className="relative">
              <div className="text-console-grid">
                {'█'.repeat(30)}
              </div>
              <div 
                className="absolute top-0 left-0 text-console-cyan overflow-hidden transition-all duration-100"
                style={{ width: `${(progress / 100) * 100}%` }}
              >
                {'█'.repeat(30)}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-console-dim text-sm">
          <div className="mb-2">Welcome to the future of token analysis</div>
          <div className="text-xs">Powered by advanced AI algorithms</div>
        </div>

        {/* Blinking Cursor */}
        <div className="mt-4 text-console-cyan">
          <span className="animate-pulse">▋</span>
        </div>
      </div>
    </div>
  );
}