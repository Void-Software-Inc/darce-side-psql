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

    // Get username from params and await it
    const { username } = await params;

    // Get user information
    const userResult = await query(
      `SELECT id, username, created_at, team
       FROM users
       WHERE username = $1`,
      [username]
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
              vl.created_at as liked_at, v.likes_count, v.comments_count
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

    // Get total comments made by the user
    const commentsCount = await query(
      'SELECT COUNT(*) FROM video_comments WHERE user_id = $1',
      [user.id]
    );

    // Get recommendations count and list
    const recommendationsCountResult = await query(
      'SELECT COUNT(*) FROM recommendations WHERE created_by = $1',
      [user.id]
    );

    const recommendationsResult = await query(
      `SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.upvotes_count,
        r.admin_response,
        r.created_at,
        r.updated_at
      FROM recommendations r
      WHERE r.created_by = $1
      ORDER BY r.created_at DESC`,
      [user.id]
    );

    // Get user's comments
    const commentsResult = await query(
      `SELECT 
        c.id,
        c.content,
        c.created_at,
        c.updated_at,
        c.is_edited,
        v.id as video_id,
        v.title as video_title
      FROM video_comments c
      JOIN videos v ON c.video_id = v.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [user.id]
    );

    // Check if this is the current user's profile
    const currentUserResult = await query(
      'SELECT username FROM users WHERE id = $1',
      [decoded.userId]
    );

    const isCurrentUser = currentUserResult.rows[0].username === username;

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        created_at: user.created_at,
        team: user.team,
        likes_given: parseInt(likesGivenCount.rows[0].count),
        comments_count: parseInt(commentsCount.rows[0].count),
        recommendations_count: parseInt(recommendationsCountResult.rows[0].count),
        recommendations: recommendationsResult.rows,
        comments: commentsResult.rows,
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