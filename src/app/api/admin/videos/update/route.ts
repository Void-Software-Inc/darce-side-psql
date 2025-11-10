import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, getUserById } from '@/lib/auth';

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
        { success: false, message: 'Forbidden: Only admins can update videos' },
        { status: 403 }
      );
    }

    // Get video ID from query parameters
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json(
        { success: false, message: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const { title, description, imageUrl, playlistUrl, type, author, numberOfVideos, labels = [] } = await request.json();

    // Validate required fields
    if (!title || !imageUrl || !playlistUrl || !type || !author) {
      return NextResponse.json(
        { success: false, message: 'Title, image URL, playlist URL, type, and author are required' },
        { status: 400 }
      );
    }

    // Validate labels is an array of strings
    if (!Array.isArray(labels) || !labels.every(label => typeof label === 'string')) {
      return NextResponse.json(
        { success: false, message: 'Labels must be an array of strings' },
        { status: 400 }
      );
    }

    // Check if video exists
    const existingVideo = await query(
      'SELECT id FROM videos WHERE id = $1 AND is_active = true',
      [videoId]
    );

    if (existingVideo.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Update the video in the database
    await query(
      `UPDATE videos 
       SET title = $1, description = $2, image_url = $3, playlist_url = $4, 
           type = $5, author = $6, number_of_videos = $7, labels = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [title, description, imageUrl, playlistUrl, type, author, numberOfVideos || null, labels, videoId]
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Video updated successfully'
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while updating the video',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
