import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const { videoId, content } = await request.json();

    if (!videoId || !content) {
      return NextResponse.json(
        { success: false, message: 'Video ID and content are required' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    // Add the comment
    const result = await query(
      `INSERT INTO video_comments (video_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [videoId, decoded.userId, content.trim()]
    );

    // Get the complete comment data with user information
    const commentResult = await query(
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
      WHERE c.id = $1`,
      [result.rows[0].id]
    );

    return NextResponse.json({
      success: true,
      comment: commentResult.rows[0]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 