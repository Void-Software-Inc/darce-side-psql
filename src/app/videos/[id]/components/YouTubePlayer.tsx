'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import {
  numericPlaylistOrder,
  parseYouTubeUrl,
  youtubeWatchUrl,
} from '@/lib/youtube';
import type { YouTubePlayerInstance } from '@/types/youtube-iframe';
import { PlaylistPanel, type PlaylistItem } from './PlaylistPanel';

interface YouTubePlayerProps {
  playlistUrl: string;
  /** Used to scope the "resume where you left off" memory. */
  storageKey?: string;
  /** Our video row id — enables per-user "seen" tracking when set. */
  dbVideoId?: number;
}

interface MetadataItem {
  id: string;
  title: string | null;
  author: string | null;
}

interface PlayerError {
  code: number;
  message: string;
  videoId: string | null;
  title: string | null;
}

const METADATA_CHUNK_SIZE = 50;

/** Consecutive unplayable videos to skip past before giving up. */
const MAX_AUTO_SKIPS = 3;

const ERROR_MESSAGES: Record<number, string> = {
  2: 'YouTube rejected this video id.',
  5: 'The video cannot be played in the HTML5 player.',
  100: 'The video was removed or set to private.',
  101: 'The owner does not allow this video to play on other sites.',
  150: 'The owner does not allow this video to play on other sites.',
};

let apiPromise: Promise<NonNullable<Window['YT']>> | null = null;

function loadYouTubeApi(): Promise<NonNullable<Window['YT']>> {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve(window.YT!);
      };

      if (!document.getElementById('youtube-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    });
  }

  return apiPromise;
}

/** The playlist isn't always available the instant the player reports ready. */
function waitForPlaylist(
  player: YouTubePlayerInstance,
  attempts = 20
): Promise<string[]> {
  return new Promise((resolve) => {
    let remaining = attempts;

    const poll = () => {
      const playlist = player.getPlaylist?.();

      if (playlist && playlist.length > 0) return resolve(playlist);
      if (--remaining <= 0) return resolve([]);

      window.setTimeout(poll, 250);
    };

    poll();
  });
}

export function YouTubePlayer({
  playlistUrl,
  storageKey,
  dbVideoId,
}: YouTubePlayerProps) {
  const { videoId, playlistId, index: urlIndex, startSeconds } =
    parseYouTubeUrl(playlistUrl);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);

  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(videoId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadingList, setLoadingList] = useState(Boolean(playlistId));
  const [error, setError] = useState<PlayerError | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const [sortOverride, setSortOverride] = useState<boolean | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  // --- ordering -------------------------------------------------------------
  const numericOrder = useMemo(
    () => numericPlaylistOrder(items.map((item) => item.title)),
    [items]
  );

  const canSort = numericOrder !== null;
  // Numbered playlists are sorted by default; YouTube often hands them back
  // reversed or shuffled.
  const sorted = sortOverride ?? canSort;

  const order = useMemo(
    () =>
      sorted && numericOrder
        ? numericOrder
        : items.map((_, index) => index),
    [sorted, numericOrder, items]
  );

  const displayItems = useMemo(
    () => order.map((index) => items[index]).filter(Boolean),
    [order, items]
  );

  const position = order.indexOf(currentIndex);
  const atFirst = position <= 0;
  const atLast = position === order.length - 1;

  // Shuffle hands navigation back to YouTube; our ordering would fight it.
  const orderedNav = !shuffle && order.length > 1;

  // Event handlers are created once when the player is built, so anything they
  // need at fire time lives in refs.
  const navRef = useRef({ order, loop, orderedNav });
  const currentIndexRef = useRef(currentIndex);
  const currentVideoIdRef = useRef(currentVideoId);
  const itemsRef = useRef(items);
  const skipsRef = useRef(0);
  const seenRef = useRef(seen);
  // Last video we auto-marked, so re-entering PLAYING doesn't re-mark it.
  const autoMarkedRef = useRef<string | null>(null);

  useEffect(() => {
    seenRef.current = seen;
  }, [seen]);

  // Persist a "seen" change for one YouTube video and mirror it locally.
  // `next` omitted → flip; provided → set outright (used to auto-mark on play).
  const setSeenFor = useCallback(
    (ytVideoId: string, next?: boolean) => {
      if (!dbVideoId || !ytVideoId) return;

      const target = next ?? !seenRef.current.has(ytVideoId);

      setSeen((current) => {
        const updated = new Set(current);
        if (target) updated.add(ytVideoId);
        else updated.delete(ytVideoId);
        return updated;
      });

      fetch('/api/videos/views/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: dbVideoId, ytVideoId, seen: target }),
      }).catch(() => {
        // Roll back the optimistic change if the write fails.
        setSeen((current) => {
          const reverted = new Set(current);
          if (target) reverted.delete(ytVideoId);
          else reverted.add(ytVideoId);
          return reverted;
        });
      });
    },
    [dbVideoId]
  );

  useEffect(() => {
    navRef.current = { order, loop, orderedNav };
  }, [order, loop, orderedNav]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    currentVideoIdRef.current = currentVideoId;
  }, [currentVideoId]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /** Playlist index `delta` steps away in display order, or null at the edge. */
  const neighbour = useCallback((delta: number): number | null => {
    const { order: currentOrder, loop: looping } = navRef.current;
    if (currentOrder.length === 0) return null;

    const current = currentOrder.indexOf(currentIndexRef.current);
    if (current < 0) return currentOrder[0] ?? null;

    const next = current + delta;

    if (next < 0 || next >= currentOrder.length) {
      // Wrapping is opt-in — walking off the end used to jump back to the
      // start of the playlist, which reads as a reshuffle.
      if (!looping) return null;
      return currentOrder[(next + currentOrder.length) % currentOrder.length];
    }

    return currentOrder[next];
  }, []);

  const progressKey = playlistId
    ? `darce-side:yt-progress:${storageKey ?? playlistId}`
    : null;

  // --- player bootstrap -----------------------------------------------------
  useEffect(() => {
    if (!videoId && !playlistId) return;

    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      const target = document.createElement('div');
      containerRef.current.replaceChildren(target);

      const savedIndex = (() => {
        if (!progressKey) return null;
        const stored = window.localStorage.getItem(progressKey);
        const parsed = stored ? parseInt(stored, 10) : NaN;
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
      })();

      const startIndex = urlIndex ?? savedIndex ?? 0;

      // The IFrame API validates every key it is handed and serialises
      // playerVars straight into the embed url, so `undefined` values are not
      // allowed — a `videoId: undefined` key alone throws "Invalid video id".
      const playerVars: Record<string, string | number> = {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      };

      if (playlistId) {
        playerVars.listType = 'playlist';
        playerVars.list = playlistId;
      }

      if (startSeconds) playerVars.start = startSeconds;

      const options: Record<string, unknown> = {
        width: '100%',
        height: '100%',
        playerVars,
      };

      // Only ever set when there is no playlist: mixing the two makes the
      // player load the single video and drop the list.
      if (!playlistId && videoId) options.videoId = videoId;

      const player = new YT.Player(target, {
        ...options,
        events: {
          onReady: async (event: { target: YouTubePlayerInstance }) => {
            if (cancelled) return;

            playerRef.current = event.target;
            setReady(true);
            setCurrentVideoId(event.target.getVideoData?.()?.video_id ?? videoId);

            if (!playlistId) {
              setLoadingList(false);
              return;
            }

            const playlist = await waitForPlaylist(event.target);
            if (cancelled) return;

            if (playlist.length === 0) {
              setLoadingList(false);
              return;
            }

            setItems(
              playlist.map((id, index) => ({
                id,
                title: null,
                author: null,
                playlistIndex: index,
              }))
            );

            // Starting item is applied here rather than through playerVars,
            // which the player ignores for cued playlists.
            if (startIndex > 0 && startIndex < playlist.length) {
              if (event.target.getPlaylistIndex() !== startIndex) {
                event.target.cuePlaylist({
                  listType: 'playlist',
                  list: playlistId,
                  index: startIndex,
                });
              }
              setCurrentIndex(startIndex);
            } else {
              setCurrentIndex(Math.max(0, event.target.getPlaylistIndex()));
            }
          },
          onStateChange: (event: { data: number; target: YouTubePlayerInstance }) => {
            if (cancelled) return;

            const state = event.data;
            setIsPlaying(state === YT.PlayerState.PLAYING);

            if (state === YT.PlayerState.PLAYING) {
              skipsRef.current = 0;
              setError(null);

              // Auto-mark seen once per video, on the transition to it — so
              // pausing/resuming (or manually un-checking) the current video
              // doesn't keep re-marking it.
              const playingId = event.target.getVideoData?.()?.video_id;
              if (playingId && autoMarkedRef.current !== playingId) {
                autoMarkedRef.current = playingId;
                if (!seenRef.current.has(playingId)) setSeenFor(playingId, true);
              }
            }

            if (state === YT.PlayerState.ENDED) {
              const { orderedNav: ordered, order: currentOrder } = navRef.current;
              if (!ordered || currentOrder.length === 0) return;

              const next = neighbour(1);

              if (next === null) {
                // End of the playlist: stop rather than roll back to the top.
                event.target.pauseVideo();
                return;
              }

              event.target.playVideoAt(next);
              setCurrentIndex(next);
              return;
            }

            if (
              state === YT.PlayerState.PLAYING ||
              state === YT.PlayerState.CUED ||
              state === YT.PlayerState.BUFFERING
            ) {
              const index = event.target.getPlaylistIndex?.();
              if (typeof index === 'number' && index >= 0) setCurrentIndex(index);
              setCurrentVideoId(event.target.getVideoData?.()?.video_id ?? null);
            }
          },
          onError: (event: { data: number; target: YouTubePlayerInstance }) => {
            if (cancelled) return;

            const code = event.data;
            const failedIndex = currentIndexRef.current;
            const failedItem = itemsRef.current[failedIndex];

            setError({
              code,
              message: ERROR_MESSAGES[code] ?? `The player reported error ${code}.`,
              videoId:
                failedItem?.id ??
                currentVideoIdRef.current ??
                event.target.getVideoData?.()?.video_id ??
                null,
              title: failedItem?.title ?? null,
            });

            // A single blocked video shouldn't stall the whole playlist.
            if (navRef.current.order.length > 1 && skipsRef.current < MAX_AUTO_SKIPS) {
              const next = neighbour(1);
              if (next !== null) {
                skipsRef.current += 1;
                event.target.playVideoAt(next);
                setCurrentIndex(next);
              }
            }
          },
        },
      });

      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playlistId]);

  // --- playlist titles ------------------------------------------------------
  useEffect(() => {
    const ids = items.map((item) => item.id);
    if (ids.length === 0) return;

    let cancelled = false;
    setLoadingList(true);

    async function loadMetadata() {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += METADATA_CHUNK_SIZE) {
        chunks.push(ids.slice(i, i + METADATA_CHUNK_SIZE));
      }

      for (const chunk of chunks) {
        try {
          const res = await fetch(
            `/api/youtube/metadata?ids=${encodeURIComponent(chunk.join(','))}`
          );
          if (!res.ok) continue;

          const data = await res.json();
          if (cancelled) return;

          const byId = new Map<string, MetadataItem>(
            (data.items as MetadataItem[]).map((item) => [item.id, item])
          );

          setItems((current) =>
            current.map((item) => {
              const match = byId.get(item.id);
              return match?.title
                ? { ...item, title: match.title, author: match.author }
                : item;
            })
          );
        } catch {
          // Titles are a nicety — the panel still works with numbered entries.
        }
      }

      if (!cancelled) setLoadingList(false);
    }

    loadMetadata();

    return () => {
      cancelled = true;
    };
    // Only re-run when the set of ids actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((item) => item.id).join(',')]);

  // --- remember position ----------------------------------------------------
  useEffect(() => {
    if (!progressKey || items.length === 0) return;
    window.localStorage.setItem(progressKey, String(currentIndex));
  }, [progressKey, currentIndex, items.length]);

  // --- load "seen" flags ----------------------------------------------------
  useEffect(() => {
    if (!dbVideoId) return;

    let cancelled = false;

    fetch(`/api/videos/views/get?videoId=${dbVideoId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.seen) setSeen(new Set<string>(data.seen));
      })
      .catch(() => {
        // Non-fatal — the panel just starts with nothing marked.
      });

    return () => {
      cancelled = true;
    };
  }, [dbVideoId]);

  // --- controls -------------------------------------------------------------
  const selectIndex = useCallback((index: number) => {
    skipsRef.current = 0;
    playerRef.current?.playVideoAt(index);
    setCurrentIndex(index);
  }, []);

  const step = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;

      if (!navRef.current.orderedNav) {
        if (delta > 0) player.nextVideo();
        else player.previousVideo();
        return;
      }

      const target = neighbour(delta);
      if (target === null) return;

      skipsRef.current = 0;
      player.playVideoAt(target);
      setCurrentIndex(target);
    },
    [neighbour]
  );

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }, [isPlaying]);

  const toggleShuffle = useCallback(() => {
    setShuffle((value) => {
      playerRef.current?.setShuffle(!value);
      return !value;
    });
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop((value) => {
      playerRef.current?.setLoop(!value);
      return !value;
    });
  }, []);

  if (!videoId && !playlistId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-gray-800 bg-[#111]">
        <p className="text-sm text-gray-500">Invalid YouTube link.</p>
      </div>
    );
  }

  const hasPlaylist = items.length > 1;
  const watchUrl = currentVideoId
    ? youtubeWatchUrl(currentVideoId, playlistId)
    : playlistUrl;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <div ref={containerRef} className="h-full w-full" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-gray-400" />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error.title ? `“${error.title}” — ` : ''}
          {error.message}{' '}
          <a
            href={
              error.videoId
                ? youtubeWatchUrl(error.videoId, playlistId)
                : watchUrl
            }
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-red-200"
          >
            Watch on YouTube
          </a>
          {hasPlaylist && (
            <span className="text-red-400/70">
              {' '}
              (error {error.code}
              {skipsRef.current > 0 ? ', skipped to the next video' : ''})
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {hasPlaylist && (
          <>
            <button
              onClick={() => step(-1)}
              disabled={!ready || (orderedNav && atFirst && !loop)}
              title="Previous video"
              className="rounded-md border border-gray-800 bg-[#111] p-2 text-gray-300 transition-colors hover:text-white disabled:opacity-30"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!ready}
              title={isPlaying ? 'Pause' : 'Play'}
              className="rounded-md border border-gray-800 bg-[#111] p-2 text-gray-300 transition-colors hover:text-white disabled:opacity-30"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => step(1)}
              disabled={!ready || (orderedNav && atLast && !loop)}
              title="Next video"
              className="rounded-md border border-gray-800 bg-[#111] p-2 text-gray-300 transition-colors hover:text-white disabled:opacity-30"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              onClick={toggleShuffle}
              disabled={!ready}
              title="Shuffle"
              className={`rounded-md border border-gray-800 bg-[#111] p-2 transition-colors disabled:opacity-30 ${
                shuffle ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Shuffle className="h-4 w-4" />
            </button>

            <button
              onClick={toggleLoop}
              disabled={!ready}
              title="Loop playlist"
              className={`rounded-md border border-gray-800 bg-[#111] p-2 transition-colors disabled:opacity-30 ${
                loop ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Repeat className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Single-video pages have no list to check off, so offer a direct
            watched toggle here. */}
        {!hasPlaylist && dbVideoId && currentVideoId && (
          <button
            onClick={() => setSeenFor(currentVideoId)}
            disabled={!ready}
            title={seen.has(currentVideoId) ? 'Marked as watched' : 'Mark as watched'}
            className={`flex items-center gap-1.5 rounded-md border border-gray-800 bg-[#111] px-2.5 py-2 text-sm transition-colors disabled:opacity-30 ${
              seen.has(currentVideoId)
                ? 'text-green-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {seen.has(currentVideoId) ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            {seen.has(currentVideoId) ? 'Watched' : 'Mark watched'}
          </button>
        )}

        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Watch on YouTube
        </a>
      </div>

      {hasPlaylist && (
        <PlaylistPanel
          items={displayItems}
          currentPlaylistIndex={currentIndex}
          isPlaying={isPlaying}
          loading={loadingList}
          sorted={sorted}
          canSort={canSort}
          seen={dbVideoId ? seen : null}
          onToggleSort={() => setSortOverride(!sorted)}
          onSelect={selectIndex}
          onToggleSeen={(ytVideoId) => setSeenFor(ytVideoId)}
        />
      )}
    </div>
  );
}
