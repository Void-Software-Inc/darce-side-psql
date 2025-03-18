import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
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

    // Get video ID from request body
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { success: false, message: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if user has already liked the video
    const existingLike = await query(
      'SELECT id FROM video_likes WHERE video_id = $1 AND user_id = $2',
      [videoId, decoded.userId]
    );

    let action: 'added' | 'removed';

    if (existingLike.rowCount === 0) {
      // Add like
      await query(
        'INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2)',
        [videoId, decoded.userId]
      );
      action = 'added';
    } else {
      // Remove like
      await query(
        'DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2',
        [videoId, decoded.userId]
      );
      action = 'removed';
    }

    // Get updated likes count
    const likesCount = await query(
      'SELECT likes_count FROM videos WHERE id = $1',
      [videoId]
    );

    return NextResponse.json({
      success: true,
      action,
      likesCount: likesCount.rows[0]?.likes_count || 0
    });
  } catch (error) {
    console.error('Error toggling video like:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 