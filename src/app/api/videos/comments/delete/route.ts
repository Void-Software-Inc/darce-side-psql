import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
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
    const commentId = url.searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json(
        { success: false, message: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin or comment owner
    const userCheck = await query(
      `SELECT 
        (SELECT name FROM roles r WHERE r.id = u.role_id) as role
      FROM users u 
      WHERE u.id = $1`,
      [decoded.userId]
    );

    const isAdmin = userCheck.rows[0]?.role === 'admin';

    // If not admin, verify ownership
    if (!isAdmin) {
      const ownershipCheck = await query(
        'SELECT id FROM video_comments WHERE id = $1 AND user_id = $2',
        [commentId, decoded.userId]
      );

      if (ownershipCheck.rowCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to delete this comment' },
          { status: 403 }
        );
      }
    }

    // Delete the comment
    const result = await query(
      'DELETE FROM video_comments WHERE id = $1 RETURNING id',
      [commentId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 