'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Always show fallback logo for now
  return (
    <div className={`${sizeClasses[size]} ${className} bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center`}>
      <span className="text-white font-bold text-lg">MP</span>
    </div>
  );
}
