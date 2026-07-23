import { CheckCircle2, Eye } from 'lucide-react';
import type { SeenCount } from '@/lib/hooks/use-seen-counts';

interface SeenProgressProps {
  progress?: SeenCount;
  className?: string;
}

/**
 * Card-level "watched" indicator: a filled progress bar with an "N/total seen"
 * label (a check + "Completed" when done). Playlists use their video count;
 * a single video has no count, so it reads as 0/1 or 1/1. Renders nothing until
 * the progress has loaded.
 */
export function SeenProgress({ progress, className }: SeenProgressProps) {
  if (!progress) return null;

  // Single videos carry no number_of_videos → treat them as a 1-video "list".
  const total = progress.total && progress.total > 0 ? progress.total : 1;
  const done = Math.min(progress.seen, total);
  const pct = Math.round((done / total) * 100);
  const complete = done >= total;

  return (
    <div className={`mt-2 ${className ?? ''}`}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span
          className={`flex items-center gap-1 ${
            complete ? 'text-green-400' : 'text-gray-400'
          }`}
        >
          {complete ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {complete ? 'Completed' : `${done}/${total} seen`}
        </span>
        <span className={complete ? 'text-green-400' : 'text-gray-500'}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} seen`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            complete ? 'bg-green-400' : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
