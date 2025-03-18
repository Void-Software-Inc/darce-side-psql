import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get video ID from URL
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { success: false, message: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Get users who liked the video
    const likesResult = await query(
      `SELECT u.username, vl.created_at
       FROM video_likes vl
       JOIN users u ON vl.user_id = u.id
       WHERE vl.video_id = $1
       ORDER BY vl.created_at DESC`,
      [videoId]
    );

    return NextResponse.json({
      success: true,
      users: likesResult.rows
    });
  } catch (error) {
    console.error('Error fetching video likes:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 