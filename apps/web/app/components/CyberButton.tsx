'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CyberButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function CyberButton({ 
  children, 
  onClick, 
  href,
  icon,
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  ariaLabel,
  type = 'button'
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

  const ButtonComponent = href ? 'a' : 'button';
  const buttonProps = href 
    ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: href.startsWith('http') ? 'noopener noreferrer' : undefined } 
    : { onClick, disabled, type };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ButtonComponent
        {...buttonProps}
        className={`
          cta-button button-glow
          ${sizes[size]} ${className}
          inline-flex items-center gap-2
          focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={ariaLabel}
        aria-disabled={disabled}
      >
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        <span className="relative z-10 flex items-center gap-2">
          {icon}
          {children}
        </span>
      </ButtonComponent>
    </motion.div>
  );
}
