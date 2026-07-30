import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { STREAKS_CTE } from '@/lib/activity';

const USERS_PER_PAGE = 12;

// Whitelisted sorts — the value lands in the query text, so it can never come
// straight from the URL.
const SORT_CLAUSES: Record<string, string> = {
  recent: 'u.last_login DESC NULLS LAST, u.username ASC',
  streak: 'streak DESC, u.last_login DESC NULLS LAST',
  joined: 'u.created_at DESC',
  name: 'u.username ASC'
};

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

    // Get search query and page from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * USERS_PER_PAGE;
    const sort = searchParams.get('sort') || 'recent';
    const orderBy = SORT_CLAUSES[sort] ?? SORT_CLAUSES.recent;

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) 
       FROM users 
       WHERE username ILIKE $1`,
      [`%${search}%`]
    );

    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

    // Get users with basic information
    const usersResult = await query(
      `WITH ${STREAKS_CTE}
       SELECT
        u.username,
        u.created_at,
        u.team,
        u.avatar_hue,
        u.last_login,
        u.last_seen,
        COALESCE(st.streak, 0) as streak,
        (SELECT COUNT(*) FROM video_likes WHERE user_id = u.id) as likes_given,
        (SELECT COUNT(*) FROM video_comments WHERE user_id = u.id) as comments_count,
        (SELECT COUNT(*) FROM recommendations WHERE created_by = u.id) as created_requests_count,
        (SELECT name FROM roles WHERE id = u.role_id) as role
       FROM users u
       LEFT JOIN streaks st ON st.user_id = u.id
       WHERE u.username ILIKE $1
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, USERS_PER_PAGE, offset]
    );

    return NextResponse.json({
      success: true,
      users: usersResult.rows,
      sort: SORT_CLAUSES[sort] ? sort : 'recent',
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        usersPerPage: USERS_PER_PAGE
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 