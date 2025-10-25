import React from 'react';

interface AsciiFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'panel' | 'highlight';
}

const AsciiFrame: React.FC<AsciiFrameProps> = ({ 
  children, 
  title, 
  className = '', 
  variant = 'default' 
}) => {
  const baseClasses = 'relative font-mono';
  
  const variantClasses = {
    default: 'bg-console-panel text-console-fg border border-console-grid',
    panel: 'bg-console-bg text-console-fg border border-console-grid',
    highlight: 'bg-console-panel text-console-fg border border-console-cyan'
  };

  const borderChar = variant === 'highlight' ? '=' : '-';
  const cornerChar = variant === 'highlight' ? '#' : '+';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 text-console-dim text-xs font-mono leading-none pointer-events-none">
        <div className="px-2 py-1">
          {title ? (
            <span>
              {cornerChar}{Array(Math.max(0, Math.floor((60 - title.length) / 2))).fill(borderChar).join('')}
              [ {title.toUpperCase()} ]
              {Array(Math.max(0, Math.ceil((60 - title.length) / 2))).fill(borderChar).join('')}{cornerChar}
            </span>
          ) : (
            <span>
              {cornerChar}{Array(58).fill(borderChar).join('')}{cornerChar}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${title ? 'pt-8' : 'pt-6'} pb-6 px-5`}>
        {children}
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 text-console-dim text-xs font-mono leading-none pointer-events-none">
        <div className="px-2 py-1">
          <span>
            {cornerChar}{Array(58).fill(borderChar).join('')}{cornerChar}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AsciiFrame;