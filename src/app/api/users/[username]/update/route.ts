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
    const hasTeam = Object.prototype.hasOwnProperty.call(body, 'team');
    const hasAvatarHue = Object.prototype.hasOwnProperty.call(body, 'avatarHue');

    if (!hasTeam && !hasAvatarHue) {
      return NextResponse.json(
        { success: false, message: 'Nothing to update' },
        { status: 400 }
      );
    }

    // Build the update dynamically so team and avatar hue can be changed
    // independently.
    const sets: string[] = [];
    const values: unknown[] = [];

    if (hasTeam) {
      values.push(body.team);
      sets.push(`team = $${values.length}`);
    }

    if (hasAvatarHue) {
      const { avatarHue } = body;
      // null clears the override → the avatar falls back to the username hue.
      let hue: number | null = null;
      if (avatarHue !== null && avatarHue !== undefined) {
        hue = Number(avatarHue);
        if (!Number.isInteger(hue) || hue < 0 || hue > 360) {
          return NextResponse.json(
            { success: false, message: 'avatarHue must be an integer between 0 and 360' },
            { status: 400 }
          );
        }
      }
      values.push(hue);
      sets.push(`avatar_hue = $${values.length}`);
    }

    values.push(currentUser.id);

    const updateResult = await query(
      `UPDATE users
       SET ${sets.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, avatar_hue`,
      values
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      avatar_hue: updateResult.rows[0].avatar_hue ?? null,
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