/** Shared time formatting for presence: "last seen 32 mins ago" and friends. */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const plural = (value: number, unit: string) =>
  `${value} ${unit}${value === 1 ? '' : 's'} ago`;

/**
 * Compact relative time — "just now", "32 mins ago", "3 hours ago".
 * Returns null when there is no timestamp, so callers can pick their own
 * wording for "never".
 */
export function timeAgo(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 45) return 'just now';
  if (seconds < HOUR) return plural(Math.round(seconds / MINUTE), 'min');
  if (seconds < DAY) return plural(Math.floor(seconds / HOUR), 'hour');
  if (seconds < WEEK) return plural(Math.floor(seconds / DAY), 'day');
  if (seconds < 30 * DAY) return plural(Math.floor(seconds / WEEK), 'week');
  if (seconds < 365 * DAY) return plural(Math.floor(seconds / (30 * DAY)), 'month');
  return plural(Math.floor(seconds / (365 * DAY)), 'year');
}

/** Full stamp down to the second, e.g. "30/07/2026, 21:06:44". */
export function formatDateTime(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/** True when the user was active in the last few minutes. */
export function isOnline(value: string | Date | null | undefined): boolean {
  if (!value) return false;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return Date.now() - date.getTime() < 5 * MINUTE * 1000;
}
