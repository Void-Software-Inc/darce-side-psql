import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const videoId = new URL(request.url).searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json(
        { success: false, message: 'Video ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT yt_video_id
       FROM video_views
       WHERE user_id = $1 AND video_id = $2`,
      [decoded.userId, videoId]
    );

    return NextResponse.json({
      success: true,
      seen: result.rows.map((row) => row.yt_video_id),
    });
  } catch (error) {
    console.error('Error fetching video views:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
