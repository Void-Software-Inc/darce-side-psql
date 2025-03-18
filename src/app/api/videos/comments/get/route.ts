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

    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json(
        { success: false, message: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Get comments with user information
    const commentsResult = await query(
      `SELECT 
        c.id,
        c.content,
        c.is_edited,
        c.created_at,
        c.updated_at,
        u.username,
        u.id as user_id,
        (SELECT name FROM roles r WHERE r.id = u.role_id) as user_role
      FROM video_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.video_id = $1
      ORDER BY c.created_at DESC`,
      [videoId]
    );

    return NextResponse.json({
      success: true,
      comments: commentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 