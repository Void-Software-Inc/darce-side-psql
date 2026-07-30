import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import { STREAKS_CTE } from '@/lib/activity';

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
    
    // Get the user from the database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get all users, most recently connected first
    const usersResult = await query(
      `WITH ${STREAKS_CTE}
       SELECT u.id, u.username, u.email, r.name as role, u.created_at,
              u.last_login, u.last_seen, u.team, u.avatar_hue,
              COALESCE(st.streak, 0) as streak
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN streaks st ON st.user_id = u.id
       ORDER BY u.last_login DESC NULLS LAST`
    );
    
    // Return the users
    return NextResponse.json({
      success: true,
      users: usersResult.rows
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 