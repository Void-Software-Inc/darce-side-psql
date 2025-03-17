import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Get the user from the database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get the video by ID
    const videoResult = await query(
      `SELECT v.id, v.title, v.description, v.image_url, v.playlist_url, 
              v.type, v.author, v.number_of_videos, v.labels,
              v.created_at, u.username as created_by
       FROM videos v
       JOIN users u ON v.created_by = u.id
       WHERE v.is_active = true AND v.id = $1`,
      [params.id]
    );

    if (videoResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }
    
    // Return the video
    return NextResponse.json({
      success: true,
      video: videoResult.rows[0]
    });
  } catch (error) {
    console.error('Error getting video:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 