'use client';

import Image from 'next/image';
import { useState } from 'react';

interface BannerProps {
  className?: string;
}

export default function Banner({ className = '' }: BannerProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className={`relative w-full h-64 overflow-hidden rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <h2 className="text-4xl font-bold gradient-text mb-4">MetaPulse AI Bot</h2>
          <p className="text-xl text-slate-300">Advanced AI-Powered Market Intelligence</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-64 overflow-hidden rounded-lg ${className}`}>
      <Image
        src="/banner.gif"
        alt="MetaPulse AI Bot Banner"
        fill
        className="object-cover"
        priority
        unoptimized
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20" />
    </div>
  );
}
