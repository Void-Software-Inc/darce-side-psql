import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

const YT_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { videoId, ytVideoId, seen } = await request.json();

    if (!videoId || !ytVideoId) {
      return NextResponse.json(
        { success: false, message: 'videoId and ytVideoId are required' },
        { status: 400 }
      );
    }

    if (!YT_ID_PATTERN.test(ytVideoId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid YouTube video id' },
        { status: 400 }
      );
    }

    // Explicit `seen` sets the state directly (used for auto-marking on play);
    // omitting it flips the current state (used by the manual checkbox).
    let target: boolean;
    if (typeof seen === 'boolean') {
      target = seen;
    } else {
      const existing = await query(
        'SELECT 1 FROM video_views WHERE user_id = $1 AND video_id = $2 AND yt_video_id = $3',
        [decoded.userId, videoId, ytVideoId]
      );
      target = existing.rowCount === 0;
    }

    if (target) {
      await query(
        `INSERT INTO video_views (user_id, video_id, yt_video_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, video_id, yt_video_id) DO NOTHING`,
        [decoded.userId, videoId, ytVideoId]
      );
    } else {
      await query(
        'DELETE FROM video_views WHERE user_id = $1 AND video_id = $2 AND yt_video_id = $3',
        [decoded.userId, videoId, ytVideoId]
      );
    }

    return NextResponse.json({ success: true, seen: target });
  } catch (error) {
    console.error('Error toggling video view:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
