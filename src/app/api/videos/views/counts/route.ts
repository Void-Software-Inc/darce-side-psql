import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_IDS = 200;

/**
 * For the current user, returns { [videoId]: { seen, total } } across a set of
 * video rows — `seen` is how many of the row's YouTube videos they've marked
 * watched, `total` is the row's number_of_videos. Powers the card progress bar.
 */
export async function GET(request: NextRequest) {
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

    const ids = (request.nextUrl.searchParams.get('videoIds') ?? '')
      .split(',')
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value))
      .slice(0, MAX_IDS);

    if (ids.length === 0) {
      return NextResponse.json({ success: true, items: {} });
    }

    const result = await query(
      `SELECT v.id,
              v.number_of_videos AS total,
              COUNT(vv.id)::int AS seen
       FROM videos v
       LEFT JOIN video_views vv
         ON vv.video_id = v.id AND vv.user_id = $1
       WHERE v.id = ANY($2::int[])
       GROUP BY v.id, v.number_of_videos`,
      [decoded.userId, ids]
    );

    const items: Record<number, { seen: number; total: number | null }> = {};
    for (const row of result.rows) {
      items[row.id] = { seen: row.seen, total: row.total ?? null };
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching view counts:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
