import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, getUserById } from '@/lib/auth';

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
    
    // Check if the user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only admins can create videos' },
        { status: 403 }
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

    // Insert the video into the database
    const result = await query(
      `INSERT INTO videos (title, description, image_url, playlist_url, type, author, number_of_videos, labels, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [title, description, imageUrl, playlistUrl, type, author, numberOfVideos || null, labels, user.id]
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Video created successfully',
      videoId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while creating the video',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 