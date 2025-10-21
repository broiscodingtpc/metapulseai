'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CyberCardProps {
  children?: ReactNode;
  icon?: ReactNode;
  title?: string;
  description?: string;
  gradient?: string;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function CyberCard({ 
  children,
  icon,
  title,
  description,
  gradient,
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
        ${gradient ? `bg-gradient-to-br ${gradient}` : ''}
        ${className}
      `}
    >
      {children || (
        <div className="text-center">
          {icon && (
            <div className="mb-4 flex justify-center">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-xl font-bold text-white mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-300 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
