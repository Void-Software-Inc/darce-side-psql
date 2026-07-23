'use client';

import { DitherAvatar } from '@/components/dither-kit/avatar';

interface UserAvatarProps {
  username: string;
  /** Stored hue (0-360). null / undefined → derived from the username. */
  hue?: number | null;
  /** Square size in px. */
  size?: number;
  /** Play the materialize entrance. Off by default so lists don't shimmer. */
  animate?: boolean;
  className?: string;
}

/**
 * The app-wide avatar: a generative dithered glyph seeded by the username, with
 * an optional stored hue. Rendered anywhere a username is shown so a person
 * reads the same everywhere.
 */
export function UserAvatar({
  username,
  hue,
  size = 28,
  animate = false,
  className,
}: UserAvatarProps) {
  return (
    <DitherAvatar
      name={username || '?'}
      hue={hue ?? undefined}
      size={size}
      animate={animate}
      className={`shrink-0 rounded-md ring-1 ring-gray-800 ${className ?? ''}`}
    />
  );
}
