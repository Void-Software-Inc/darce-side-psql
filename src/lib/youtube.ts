export interface ParsedYouTubeUrl {
  videoId: string | null;
  playlistId: string | null;
  /** Index of the video inside the playlist, when the url carries one (0-based). */
  index: number | null;
  /** Start offset in seconds, from `t` / `start` params. */
  startSeconds: number | null;
}

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function parseTimeParam(value: string | null): number | null {
  if (!value) return null;

  // Plain seconds, e.g. "90"
  if (/^\d+$/.test(value)) return parseInt(value, 10);

  // Human form, e.g. "1h2m10s"
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || !match[0]) return null;

  const [, h, m, s] = match;
  const seconds =
    (parseInt(h ?? '0', 10) || 0) * 3600 +
    (parseInt(m ?? '0', 10) || 0) * 60 +
    (parseInt(s ?? '0', 10) || 0);

  return seconds > 0 ? seconds : null;
}

/**
 * Pulls the video / playlist ids out of any of the shapes YouTube links come in:
 * watch, youtu.be, playlist, embed, live and shorts urls.
 */
export function parseYouTubeUrl(rawUrl: string): ParsedYouTubeUrl {
  const empty: ParsedYouTubeUrl = {
    videoId: null,
    playlistId: null,
    index: null,
    startSeconds: null,
  };

  if (!rawUrl) return empty;

  const trimmed = rawUrl.trim();

  // A bare video id pasted on its own
  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return { ...empty, videoId: trimmed };
  }

  // A bare playlist id pasted on its own
  if (/^(PL|UU|LL|FL|OL|RD)[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return { ...empty, playlistId: trimmed };
  }

  let url: URL;
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return empty;
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const path = url.pathname.replace(/\/+$/, '');
  const params = url.searchParams;

  let videoId: string | null = null;

  if (host === 'youtu.be') {
    videoId = path.slice(1) || null;
  } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const [, section, slug] = path.split('/');

    if (section === 'watch') {
      videoId = params.get('v');
    } else if (section === 'embed' || section === 'live' || section === 'shorts' || section === 'v') {
      videoId = slug && slug !== 'videoseries' ? slug : null;
    }
  }

  if (videoId && !VIDEO_ID_PATTERN.test(videoId)) videoId = null;

  const playlistId = params.get('list');
  const rawIndex = params.get('index');
  const parsedIndex = rawIndex && /^\d+$/.test(rawIndex) ? parseInt(rawIndex, 10) : null;

  return {
    videoId,
    playlistId: playlistId || null,
    // YouTube's `index` param is 1-based, the IFrame API is 0-based.
    index: parsedIndex && parsedIndex > 0 ? parsedIndex - 1 : null,
    startSeconds: parseTimeParam(params.get('t') ?? params.get('start')),
  };
}

/**
 * Digs the episode number out of a title. Handles the shapes that show up in
 * practice: "8 - Wrestle Ups", "Wrestle Ups Part 8", "Ep. 8", "Wrestle Ups 8".
 * Returns null when the title carries no usable number.
 */
export function episodeNumber(title: string | null): number | null {
  if (!title) return null;

  const normalized = title.replace(/\s+/g, ' ').trim();

  // A number opening the title, e.g. "8   Wrestle Ups" or "08. Wrestle Ups"
  const leading = normalized.match(/^[[(#]?\s*(\d{1,3})\s*(?:[.)\]\-:_|]|\s|$)/);
  if (leading) return parseInt(leading[1], 10);

  // An explicit marker anywhere in the title — the last one wins, so
  // "Guard Part 2" beats a stray number earlier on.
  const markers = [
    ...normalized.matchAll(/\b(?:part|pt\.?|ep(?:isode)?\.?|vol(?:ume)?\.?|no\.?|#)\s*(\d{1,3})\b/gi),
  ];
  if (markers.length > 0) {
    return parseInt(markers[markers.length - 1][1], 10);
  }

  // A number closing the title, e.g. "Wrestle Ups 8" or "Wrestle Ups (8)"
  const trailing = normalized.match(/(\d{1,3})\s*[)\]]?\s*$/);
  if (trailing) return parseInt(trailing[1], 10);

  return null;
}

/**
 * Orders playlist positions by the episode number in their titles, ascending.
 * Returns null when too few titles are numbered for the result to be
 * meaningful, so the caller can fall back to YouTube's own order.
 */
export function numericPlaylistOrder(titles: (string | null)[]): number[] | null {
  const numbers = titles.map(episodeNumber);
  const numbered = numbers.filter((value) => value !== null).length;

  if (numbered < 2 || numbered / titles.length < 0.6) return null;

  const order = titles.map((_, index) => index);

  order.sort((a, b) => {
    const left = numbers[a];
    const right = numbers[b];

    if (left === null && right === null) return a - b;
    if (left === null) return 1;
    if (right === null) return -1;
    if (left !== right) return left - right;

    return a - b;
  });

  return order;
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string, playlistId?: string | null): string {
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoId);
  if (playlistId) url.searchParams.set('list', playlistId);
  return url.toString();
}
