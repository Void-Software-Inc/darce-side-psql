import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
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
    const currentUser = await getUserById(decoded.userId);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get the username from the URL
    const username = request.url.split('/users/')[1].split('/update')[0];

    // Verify that the current user is updating their own profile
    if (currentUser.username !== decodeURIComponent(username)) {
      return NextResponse.json(
        { success: false, message: 'You can only update your own profile' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { team } = body;

    if (!team) {
      return NextResponse.json(
        { success: false, message: 'Team is required' },
        { status: 400 }
      );
    }

    // Update the user's team
    const updateResult = await query(
      `UPDATE users 
       SET team = $1
       WHERE id = $2
       RETURNING id`,
      [team, currentUser.id]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update team' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while updating the user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 