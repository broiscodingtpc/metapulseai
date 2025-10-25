import React from 'react';

interface AsciiBadgeProps {
  level: 'low' | 'medium' | 'high' | 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AsciiBadge: React.FC<AsciiBadgeProps> = ({ 
  level, 
  children, 
  className = '', 
  size = 'md' 
}) => {
  const baseClasses = 'inline-block font-mono font-bold uppercase tracking-wider border';

  const levelClasses = {
    low: 'text-console-green border-console-green bg-console-green/10',
    medium: 'text-console-yellow border-console-yellow bg-console-yellow/10',
    high: 'text-console-red border-console-red bg-console-red/10',
    info: 'text-console-cyan border-console-cyan bg-console-cyan/10',
    success: 'text-console-green border-console-green bg-console-green/10',
    warning: 'text-console-yellow border-console-yellow bg-console-yellow/10',
    error: 'text-console-red border-console-red bg-console-red/10',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`${baseClasses} ${levelClasses[level]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

export default AsciiBadge;