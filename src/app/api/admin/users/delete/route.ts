import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
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
    
    // Get the admin user from the database
    const adminUser = await getUserById(decoded.userId);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is an admin
    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only admins can delete users' },
        { status: 403 }
      );
    }

    // Get user ID to delete from the URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === decoded.userId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete the user
    const deleteResult = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while deleting the user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 