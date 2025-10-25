import React from 'react';

interface AsciiProgressProps {
  current: number;
  total: number;
  label?: string;
  unit?: string;
  className?: string;
  showPercentage?: boolean;
  showNumbers?: boolean;
  barWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const AsciiProgress: React.FC<AsciiProgressProps> = ({ 
  current, 
  total, 
  label = 'Progress',
  unit = '',
  className = '', 
  showPercentage = true,
  showNumbers = true,
  barWidth = 40,
  variant = 'default'
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filledChars = Math.floor((percentage / 100) * barWidth);
  const emptyChars = barWidth - filledChars;

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          filled: 'text-console-green',
          empty: 'text-console-dim',
          text: 'text-console-green'
        };
      case 'warning':
        return {
          filled: 'text-console-yellow',
          empty: 'text-console-dim',
          text: 'text-console-yellow'
        };
      case 'danger':
        return {
          filled: 'text-console-red',
          empty: 'text-console-dim',
          text: 'text-console-red'
        };
      default:
        return {
          filled: 'text-console-cyan',
          empty: 'text-console-dim',
          text: 'text-console-cyan'
        };
    }
  };

  const colors = getVariantColors();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  return (
    <div className={`font-mono ${className}`}>
      {/* Label */}
      {label && (
        <div className="text-console-fg text-sm font-bold mb-2 uppercase tracking-wider">
          {label}
        </div>
      )}

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-console-dim">[</span>
        <span className={colors.filled}>
          {'#'.repeat(filledChars)}
        </span>
        <span className={colors.empty}>
          {'-'.repeat(emptyChars)}
        </span>
        <span className="text-console-dim">]</span>
        
        {showPercentage && (
          <span className={`${colors.text} font-bold text-sm ml-2`}>
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Numeric Information */}
      {showNumbers && (
        <div className="flex justify-between items-center text-sm">
          <div className="text-console-fg">
            <span className={colors.text} title={`${current} ${unit}`}>
              {formatNumber(current)}
            </span>
            <span className="text-console-dim mx-1">/</span>
            <span className="text-console-dim" title={`${total} ${unit}`}>
              {formatNumber(total)}
            </span>
            {unit && (
              <span className="text-console-dim ml-1">{unit}</span>
            )}
          </div>
          
          <div className="text-console-dim text-xs">
            Remaining: {formatNumber(total - current)} {unit}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="mt-2 text-xs">
        {percentage >= 100 ? (
          <span className="text-console-green">● COMPLETE</span>
        ) : percentage >= 75 ? (
          <span className="text-console-yellow">● NEARLY COMPLETE</span>
        ) : percentage >= 25 ? (
          <span className="text-console-cyan">● IN PROGRESS</span>
        ) : (
          <span className="text-console-dim">● STARTING</span>
        )}
      </div>
    </div>
  );
};

export default AsciiProgress;