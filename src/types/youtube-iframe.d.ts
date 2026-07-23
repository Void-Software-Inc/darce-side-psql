// Minimal typings for the YouTube IFrame Player API (loaded at runtime from
// https://www.youtube.com/iframe_api).

export interface YouTubePlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  nextVideo(): void;
  previousVideo(): void;
  playVideoAt(index: number): void;
  cuePlaylist(options: {
    listType?: string;
    list?: string;
    index?: number;
    startSeconds?: number;
  }): void;
  loadPlaylist(options: {
    listType?: string;
    list?: string;
    index?: number;
    startSeconds?: number;
  }): void;
  setLoop(loop: boolean): void;
  setShuffle(shuffle: boolean): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getPlaylist(): string[] | null;
  getPlaylistIndex(): number;
  getPlayerState(): number;
  getVideoData(): { video_id?: string; title?: string; author?: string };
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: Record<string, unknown>
      ) => YouTubePlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};
