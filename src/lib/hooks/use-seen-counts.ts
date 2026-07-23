import { useEffect, useState } from 'react';

export interface SeenCount {
  seen: number;
  total: number | null;
}

/**
 * Fetches per-video "seen" progress for the current user in one batch request.
 * Returns a map keyed by video id; ids not yet loaded are simply absent.
 */
export function useSeenCounts(videoIds: number[]): Record<number, SeenCount> {
  const [counts, setCounts] = useState<Record<number, SeenCount>>({});

  // Stable dependency: sorted, de-duplicated id list.
  const key = Array.from(new Set(videoIds)).sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!key) return;

    let cancelled = false;

    fetch(`/api/videos/views/counts?videoIds=${key}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.items) setCounts(data.items);
      })
      .catch(() => {
        // Progress is a nicety — a failure just leaves the bars empty.
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return counts;
}
