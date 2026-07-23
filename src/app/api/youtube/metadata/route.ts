import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const MAX_IDS = 200;
const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

interface VideoMetadata {
  id: string;
  title: string | null;
  author: string | null;
}

/**
 * Resolves a video's title through YouTube's public oEmbed endpoint, so the
 * playlist panel can show real titles without needing a Data API key.
 */
async function fetchMetadata(id: string): Promise<VideoMetadata> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { next: { revalidate: 60 * 60 * 24 } }
    );

    if (!res.ok) return { id, title: null, author: null };

    const data = await res.json();
    return {
      id,
      title: typeof data.title === 'string' ? data.title : null,
      author: typeof data.author_name === 'string' ? data.author_name : null,
    };
  } catch {
    return { id, title: null, author: null };
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const ids = (request.nextUrl.searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => ID_PATTERN.test(id))
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ success: true, items: [] });
  }

  const items = await Promise.all(ids.map(fetchMetadata));

  return NextResponse.json({ success: true, items });
}
