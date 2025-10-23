'use client';

import { ReactNode, CSSProperties } from 'react';

interface MetallicPaintProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  gradientColors?: string[];
}

export default function MetallicPaint({ 
  children, 
  className = '',
  style = {},
  gradientColors = ['#00e5ff', '#3fa9ff', '#00e5ff']
}: MetallicPaintProps) {
  const gradientStyle: CSSProperties = {
    background: `linear-gradient(90deg, ${gradientColors.join(', ')})`,
    backgroundSize: '200% auto',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'metallicShimmer 3s linear infinite',
    fontWeight: 700,
    ...style
  };

  return (
    <span className={`metallic-paint ${className}`} style={gradientStyle}>
      {children}
    </span>
  );
}

