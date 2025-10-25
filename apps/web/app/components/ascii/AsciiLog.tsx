import React, { useEffect, useRef } from 'react';

interface LogEntry {
  id?: string | number;
  timestamp: Date | string;
  type: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

interface AsciiLogProps {
  entries: LogEntry[];
  className?: string;
  maxHeight?: string;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  liveUpdate?: boolean;
}

const AsciiLog: React.FC<AsciiLogProps> = ({ 
  entries, 
  className = '', 
  maxHeight = '400px',
  autoScroll = true,
  showTimestamp = true,
  liveUpdate = false
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-console-cyan';
      case 'warn': return 'text-console-yellow';
      case 'error': return 'text-console-red';
      case 'success': return 'text-console-green';
      default: return 'text-console-fg';
    }
  };

  const getTypePrefix = (type: string) => {
    switch (type) {
      case 'info': return 'INFO';
      case 'warn': return 'WARN';
      case 'error': return 'ERROR';
      case 'success': return 'OK';
      default: return 'LOG';
    }
  };

  return (
    <div className={`font-mono bg-console-bg border border-console-grid ${className}`}>
      {/* Header */}
      <div className="bg-console-panel border-b border-console-grid px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-console-cyan font-bold text-sm uppercase tracking-wider">
            System Log
          </span>
          {liveUpdate && (
            <span className="text-console-green text-xs animate-pulse">
              ● LIVE
            </span>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div 
        ref={logRef}
        className="overflow-y-auto p-3 space-y-1"
        style={{ maxHeight }}
        aria-live={liveUpdate ? 'polite' : 'off'}
      >
        {entries.length === 0 ? (
          <div className="text-console-dim text-sm italic">
            No log entries available
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.id || index} className="text-sm leading-relaxed">
              <div className="flex items-start gap-2">
                {showTimestamp && (
                  <span className="text-console-dim shrink-0">
                    [{formatTimestamp(entry.timestamp)}]
                  </span>
                )}
                <span className={`${getTypeColor(entry.type)} font-bold shrink-0`}>
                  {getTypePrefix(entry.type)}:
                </span>
                <span className="text-console-fg flex-1">
                  {entry.message}
                </span>
              </div>
              {entry.details && (
                <div className="ml-20 text-console-dim text-xs mt-1">
                  {entry.details}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-console-grid px-3 py-1 bg-console-panel">
        <div className="text-console-dim text-xs">
          {entries.length} entries
          {autoScroll && (
            <span className="ml-2">| Auto-scroll: ON</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsciiLog;