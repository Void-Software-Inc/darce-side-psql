import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
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

    // Get user information
    const userResult = await query(
      `SELECT id, username, created_at
       FROM users
       WHERE username = $1`,
      [params.username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Get videos liked by the user
    const likedVideosResult = await query(
      `SELECT v.id, v.title, v.description, v.image_url, v.type, 
              v.author, v.created_at, u.username as created_by,
              vl.created_at as liked_at, v.likes_count
       FROM video_likes vl
       JOIN videos v ON vl.video_id = v.id
       JOIN users u ON v.created_by = u.id
       WHERE vl.user_id = $1 AND v.is_active = true
       ORDER BY vl.created_at DESC`,
      [user.id]
    );

    // Get total likes given and received
    const likesGivenCount = await query(
      'SELECT COUNT(*) FROM video_likes WHERE user_id = $1',
      [user.id]
    );

    // Check if this is the current user's profile
    const currentUserResult = await query(
      'SELECT username FROM users WHERE id = $1',
      [decoded.userId]
    );

    const isCurrentUser = currentUserResult.rows[0].username === params.username;

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        created_at: user.created_at,
        likes_given: parseInt(likesGivenCount.rows[0].count),
        liked_videos: likedVideosResult.rows,
        is_current_user: isCurrentUser
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 