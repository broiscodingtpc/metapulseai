'use client';

import { motion } from 'framer-motion';

interface ScoreBadgeProps {
  score: number;
  riskLevel?: string;
  size?: 'sm' | 'md' | 'lg';
  showRisk?: boolean;
}

export default function ScoreBadge({ score, riskLevel, size = 'md', showRisk = true }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 60) return {
      bg: 'bg-green-500/20',
      border: 'border-green-500/40',
      text: 'text-green-400',
      risk: '🟢 LOW'
    };
    if (score >= 40) return {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/40',
      text: 'text-yellow-400',
      risk: '🟡 MEDIUM'
    };
    return {
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      text: 'text-red-400',
      risk: '🔴 HIGH'
    };
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          score: 'text-sm font-bold',
          risk: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-sm',
          score: 'text-lg font-bold',
          risk: 'text-sm'
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          score: 'text-base font-bold',
          risk: 'text-xs'
        };
    }
  };

  const colors = getScoreColor(score);
  const sizeClasses = getSizeClasses(size);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 rounded-full border ${colors.bg} ${colors.border} ${sizeClasses.container}`}
    >
      <div className={`${colors.text} ${sizeClasses.score}`}>
        {score}
      </div>
      {showRisk && (
        <div className={`${colors.text} ${sizeClasses.risk} font-medium`}>
          {colors.risk}
        </div>
      )}
    </motion.div>
  );
}
