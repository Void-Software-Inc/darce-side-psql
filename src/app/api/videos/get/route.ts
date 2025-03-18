import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

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

    // Get type from search params if provided
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Build the query based on whether type is provided
    const whereClause = type 
      ? 'WHERE v.is_active = true AND v.type = $1'
      : 'WHERE v.is_active = true';
    
    // Get all active videos with creator information
    const videosResult = await query(
      `SELECT v.id, v.title, v.description, v.image_url, v.playlist_url, 
              v.type, v.author, v.number_of_videos, v.labels,
              v.created_at, u.username as created_by, v.likes_count,
              v.comments_count
       FROM videos v
       JOIN users u ON v.created_by = u.id
       ${whereClause}
       ORDER BY v.created_at DESC`,
      type ? [type] : []
    );
    
    // Return the videos
    return NextResponse.json({
      success: true,
      videos: videosResult.rows
    });
  } catch (error) {
    console.error('Error getting videos:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 