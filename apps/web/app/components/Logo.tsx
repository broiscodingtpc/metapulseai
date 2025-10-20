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

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-lg">MP</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src="https://crimson-traditional-mastodon-846.mypinata.cloud/ipfs/bafybeiebtjeaklp5bvn3bwvsc6dlellhhhpr4oxcjpsvsx5v7icnvpswqm"
        alt="MetaPulse AI Bot Logo"
        width={96}
        height={96}
        className="w-full h-full object-contain rounded-lg"
        priority
        unoptimized
        onError={() => setImageError(true)}
      />
    </div>
  );
}
