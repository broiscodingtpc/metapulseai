'use client';

import { useEffect, useRef } from 'react';

interface OrbBackgroundProps {
  colors?: string[];
  count?: number;
  className?: string;
}

export default function OrbBackground({ 
  colors = ['#00e5ff', '#3fa9ff', '#7a5cff'],
  count = 3,
  className = ''
}: OrbBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const orbs = container.querySelectorAll('.orb');
    
    orbs.forEach((orb, index) => {
      const htmlOrb = orb as HTMLElement;
      const animationDuration = 20 + index * 5;
      const delay = index * -3;
      
      htmlOrb.style.animationDuration = `${animationDuration}s`;
      htmlOrb.style.animationDelay = `${delay}s`;
    });
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`orb-background fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="orb"
          style={{
            background: `radial-gradient(circle, ${colors[index % colors.length]}40 0%, transparent 70%)`,
            left: `${(index * 30) % 100}%`,
            top: `${(index * 40) % 100}%`,
            width: `${400 + index * 100}px`,
            height: `${400 + index * 100}px`,
          }}
        />
      ))}
    </div>
  );
}

