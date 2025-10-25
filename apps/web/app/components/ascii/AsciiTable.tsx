import React from 'react';

interface Column {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface AsciiTableProps {
  columns: Column[];
  data: Record<string, any>[];
  className?: string;
  maxRows?: number;
  onRowClick?: (row: Record<string, any>, index: number) => void;
}

const AsciiTable: React.FC<AsciiTableProps> = ({ 
  columns, 
  data, 
  className = '', 
  maxRows,
  onRowClick 
}) => {
  const displayData = maxRows ? data.slice(0, maxRows) : data;

  const truncateText = (text: string, maxLength: number = 20): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div className={`font-mono bg-console-panel border border-console-grid ${className}`}>
      {/* Top border */}
      <div className="text-console-dim text-xs px-2 py-1 border-b border-console-grid">
        +{Array(columns.length * 20 - 1).fill('-').join('')}+
      </div>

      {/* Header */}
      <div className="bg-console-bg border-b border-console-grid">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={column.key}
              className={`
                px-3 py-2 text-console-cyan font-bold text-sm uppercase tracking-wider
                ${getAlignmentClass(column.align)}
                ${index < columns.length - 1 ? 'border-r border-console-grid' : ''}
              `}
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              | {column.header}
            </div>
          ))}
          <div className="text-console-dim">|</div>
        </div>
      </div>

      {/* Data rows */}
      <div className="max-h-96 overflow-y-auto">
        {displayData.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`
              flex border-b border-console-grid/50 hover:bg-console-cyan/5 transition-colors
              ${onRowClick ? 'cursor-pointer' : ''}
              ${rowIndex % 2 === 0 ? 'bg-console-bg/30' : 'bg-transparent'}
            `}
            onClick={() => onRowClick?.(row, rowIndex)}
          >
            {columns.map((column, colIndex) => (
              <div
                key={column.key}
                className={`
                  px-3 py-2 text-console-fg text-sm
                  ${getAlignmentClass(column.align)}
                  ${colIndex < columns.length - 1 ? 'border-r border-console-grid/50' : ''}
                `}
                style={{ width: column.width || `${100 / columns.length}%` }}
                title={String(row[column.key] || '')}
              >
                | {truncateText(String(row[column.key] || ''), 18)}
              </div>
            ))}
            <div className="text-console-dim text-sm py-2">|</div>
          </div>
        ))}
      </div>

      {/* Bottom border */}
      <div className="text-console-dim text-xs px-2 py-1 border-t border-console-grid">
        +{Array(columns.length * 20 - 1).fill('-').join('')}+
      </div>

      {/* Row count info */}
      {data.length > 0 && (
        <div className="px-3 py-1 text-console-dim text-xs bg-console-bg">
          Showing {displayData.length} of {data.length} entries
          {maxRows && data.length > maxRows && (
            <span className="text-console-yellow"> (truncated)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AsciiTable;