'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function CyberCard({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  onClick
}: CyberCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      onClick={onClick}
      className={`
        glass-panel rounded-xl p-6 transition-all duration-300
        ${glow ? 'glow-pulse' : 'hover:shadow-neon-lg'}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
