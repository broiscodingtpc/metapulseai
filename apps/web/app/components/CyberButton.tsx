'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CyberButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function CyberButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false
}: CyberButtonProps) {
  const variants = {
    primary: 'from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400',
    secondary: 'from-secondary-600 to-secondary-500 hover:from-secondary-500 hover:to-secondary-400',
    accent: 'from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        cta-button button-glow
        ${sizes[size]} ${className}
      `}
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
