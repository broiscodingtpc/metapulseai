'use client';

import { ReactNode, CSSProperties } from 'react';

interface GradualBlurProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  duration?: number;
}

export default function GradualBlur({ 
  children, 
  className = '',
  style = {},
  duration = 4
}: GradualBlurProps) {
  return (
    <span 
      className={`gradual-blur ${className}`} 
      style={{ 
        animationDuration: `${duration}s`,
        ...style 
      }}
    >
      {children}
    </span>
  );
}

