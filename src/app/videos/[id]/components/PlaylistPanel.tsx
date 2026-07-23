'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  Circle,
  ListVideo,
  Play,
  Search,
} from 'lucide-react';
import { youtubeThumbnail } from '@/lib/youtube';

export interface PlaylistItem {
  id: string;
  title: string | null;
  author: string | null;
  /** Position in the playlist as YouTube returns it — what playVideoAt() takes. */
  playlistIndex: number;
}

interface PlaylistPanelProps {
  /** Already in display order. */
  items: PlaylistItem[];
  currentPlaylistIndex: number;
  isPlaying: boolean;
  loading: boolean;
  sorted: boolean;
  canSort: boolean;
  /** Set of seen YouTube ids, or null when seen-tracking is unavailable. */
  seen: Set<string> | null;
  onToggleSort: () => void;
  onSelect: (playlistIndex: number) => void;
  onToggleSeen: (ytVideoId: string) => void;
}

export function PlaylistPanel({
  items,
  currentPlaylistIndex,
  isPlaying,
  loading,
  sorted,
  canSort,
  seen,
  onToggleSort,
  onSelect,
  onToggleSeen,
}: PlaylistPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState('');

  const seenCount = seen
    ? items.filter((item) => seen.has(item.id)).length
    : 0;

  const position = items.findIndex(
    (item) => item.playlistIndex === currentPlaylistIndex
  );

  const visibleItems = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => (item.title ?? '').toLowerCase().includes(term));
  }, [items, filter]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-800 bg-[#111]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
        <button
          onClick={() => setCollapsed((value) => !value)}
          className="flex items-center gap-2 text-left text-white"
          aria-expanded={!collapsed}
        >
          <ListVideo className="h-4 w-4 text-gray-400" />
          <span className="font-medium">Playlist</span>
          <span className="text-sm text-gray-400">
            {position >= 0 ? position + 1 : 1} / {items.length}
          </span>
          {seen && seenCount > 0 && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {seenCount} seen
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              collapsed ? '-rotate-90' : ''
            }`}
          />
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2">
            {items.length > 5 && (
              <div className="relative w-32 sm:w-48">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter videos"
                  className="w-full rounded-md border border-gray-800 bg-black py-1.5 pl-7 pr-2 text-sm text-white placeholder:text-gray-600 focus:border-gray-600 focus:outline-none"
                />
              </div>
            )}

            {canSort && (
              <button
                onClick={onToggleSort}
                title={
                  sorted
                    ? 'Sorted by episode number — switch to YouTube order'
                    : 'YouTube order — sort by episode number'
                }
                className={`flex shrink-0 items-center gap-1.5 rounded-md border border-gray-800 px-2 py-1.5 text-xs transition-colors ${
                  sorted ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowDownUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {sorted ? '1 → N' : 'YouTube'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="max-h-[420px] overflow-y-auto">
          {visibleItems.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              No video matches “{filter}”.
            </p>
          )}

          {visibleItems.map((item, displayIndex) => {
            const isCurrent = item.playlistIndex === currentPlaylistIndex;
            const isSeen = seen?.has(item.id) ?? false;

            return (
              <div
                key={`${item.id}-${item.playlistIndex}`}
                className={`flex items-center gap-2 pr-2 transition-colors ${
                  isCurrent ? 'bg-[#1d1d1d]' : 'hover:bg-[#181818]'
                }`}
              >
                <button
                  onClick={() => onSelect(item.playlistIndex)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
                >
                  <span className="w-6 shrink-0 text-center text-xs text-gray-500">
                    {isCurrent ? (
                      <Play
                        className={`mx-auto h-3 w-3 text-white ${
                          isPlaying ? 'fill-white' : ''
                        }`}
                      />
                    ) : (
                      (filter ? item.playlistIndex : displayIndex) + 1
                    )}
                  </span>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={youtubeThumbnail(item.id)}
                    alt=""
                    loading="lazy"
                    className={`h-11 w-20 shrink-0 rounded object-cover transition-opacity ${
                      isSeen && !isCurrent ? 'opacity-40' : ''
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span
                      className={`line-clamp-2 text-sm ${
                        isCurrent
                          ? 'text-white'
                          : isSeen
                            ? 'text-gray-500'
                            : 'text-gray-300'
                      }`}
                    >
                      {item.title ??
                        (loading ? 'Loading…' : `Video ${item.playlistIndex + 1}`)}
                    </span>
                    {item.author && (
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {item.author}
                      </span>
                    )}
                  </span>
                </button>

                {seen && (
                  <button
                    onClick={() => onToggleSeen(item.id)}
                    title={isSeen ? 'Mark as not seen' : 'Mark as seen'}
                    className={`shrink-0 rounded-md p-1.5 transition-colors ${
                      isSeen
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-gray-600 hover:text-gray-300'
                    }`}
                  >
                    {isSeen ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
