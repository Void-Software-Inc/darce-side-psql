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
    
    // Get the user from the database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { id, status, admin_response } = await request.json();

    if (!id || !status || !admin_response) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['resolved', 'denied'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { rows: userRoles } = await query(
      `SELECT r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (!userRoles.length || userRoles[0].role_name !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can update recommendations' },
        { status: 403 }
      );
    }

    const { rows } = await query(
      `UPDATE recommendations
       SET status = $1::recommendation_status,
           admin_response = $2,
           resolved_by = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id`,
      [status, admin_response, decoded.userId, id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Recommendation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendation updated successfully'
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 