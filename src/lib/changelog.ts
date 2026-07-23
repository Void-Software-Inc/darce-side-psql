// User-facing changelog. Written in plain language for non-technical members —
// keep each line short and about what people can *do*, not how it was built.
// Newest version first; APP_VERSION is what shows next to the logo.

export const APP_VERSION = '1.0';

export interface ChangelogEntry {
  version: string;
  date: string; // human-friendly, e.g. "July 2026"
  title?: string;
  latest?: boolean;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0',
    date: 'July 2026',
    title: 'Big update',
    latest: true,
    changes: [
      'Brand-new video player — see every video in a playlist and jump to any one.',
      'Series now play in the right order, from the first video to the last.',
      'Mark videos as watched, with a progress bar on each card so you know where you left off.',
      'Personal profile pictures next to your name — pick your own colour.',
    ],
  },
  {
    version: '0.4',
    date: 'Late 2025',
    changes: [
      'Added a new category of videos.',
      'Admins can now edit a video’s details after posting it.',
      'Smoother browsing on phones.',
      'Behind-the-scenes security and reliability improvements.',
    ],
  },
  {
    version: '0.3',
    date: 'March 2025',
    changes: [
      'Requests — suggest videos you’d like added, and upvote other people’s ideas.',
      'Add your team to your profile.',
      'Search and filter the video library.',
      'Featured videos on the home page.',
    ],
  },
  {
    version: '0.2',
    date: 'March 2025',
    changes: [
      'Like videos and see who else liked them.',
      'Leave comments on videos.',
      'Every member gets a public profile.',
    ],
  },
  {
    version: '0.1',
    date: 'March 2025',
    title: 'First release',
    changes: [
      'Browse the BJJ video library.',
      'Sign up with an access code.',
      'Watch any video on its own page.',
    ],
  },
];
