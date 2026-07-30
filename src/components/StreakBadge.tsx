'use client';

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  /** Consecutive days connected. 0 means the streak has lapsed. */
  days: number;
  size?: 'sm' | 'md';
  /** Render the badge even at 0 days (greyed out) instead of nothing. */
  showZero?: boolean;
  className?: string;
}

/**
 * The consecutive-days-connected badge. Same shape everywhere a streak shows
 * up — home page, user cards, admin table — so the number reads the same.
 */
export function StreakBadge({
  days,
  size = 'md',
  showZero = false,
  className = '',
}: StreakBadgeProps) {
  if (!days && !showZero) return null;

  const active = days > 0;
  const compact = size === 'sm';

  return (
    <span
      title={
        active
          ? `${days} day${days === 1 ? '' : 's'} in a row`
          : 'No streak yet — connect today to start one'
      }
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      } ${
        active
          ? 'border-orange-900/40 bg-orange-500/10 text-orange-400'
          : 'border-gray-800 bg-[#111] text-gray-500'
      } ${className}`}
    >
      <Flame className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      {days}
      {!compact && <span className="text-gray-400">day{days === 1 ? '' : 's'}</span>}
    </span>
  );
}
