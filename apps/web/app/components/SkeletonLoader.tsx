'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  count?: number;
}

export default function SkeletonLoader({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl h-48'
  };

  const Skeleton = () => (
    <motion.div
      className={`
        bg-slate-200 dark:bg-slate-800 
        ${variants[variant]} 
        ${className}
        animate-pulse
      `}
      style={{ width, height }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );

  if (count === 1) {
    return <Skeleton />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </>
  );
}

// Specialized skeleton components for common use cases

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-light-panel dark:bg-dark-900 rounded-xl border border-light-edge dark:border-slate-800 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <SkeletonLoader variant="circular" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="60%" />
          <SkeletonLoader variant="text" width="40%" />
        </div>
      </div>
      <div className="space-y-3">
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTokenCard({ className = '' }: { className?: string }) {
  return (
    <div className={`min-w-[300px] p-6 bg-light-panel dark:bg-dark-900/50 rounded-xl border border-light-edge dark:border-slate-700/50 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <SkeletonLoader variant="circular" width="40px" height="40px" />
          <div className="space-y-2">
            <SkeletonLoader variant="text" width="80px" />
            <SkeletonLoader variant="text" width="60px" />
          </div>
        </div>
        <SkeletonLoader variant="rectangular" width="60px" height="24px" />
      </div>
      <div className="space-y-3">
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" width="70%" />
      </div>
    </div>
  );
}

export function SkeletonStats({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-light-panel dark:bg-dark-900 rounded-xl border border-light-edge dark:border-slate-800 ${className}`}>
      <div className="flex items-center mb-4">
        <SkeletonLoader variant="rectangular" width="48px" height="48px" className="mr-4" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="50%" />
          <SkeletonLoader variant="text" width="70%" height="32px" />
        </div>
      </div>
    </div>
  );
}

