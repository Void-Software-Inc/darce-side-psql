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

    // Check if user has created a recommendation in the last hour
    const { rows: recentRecommendations } = await query(
      `SELECT id FROM recommendations 
       WHERE created_by = $1 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [decoded.userId]
    );

    if (recentRecommendations.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Please wait at least 1 hour between creating requests' },
        { status: 429 }
      );
    }

    const { title, description } = await request.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Title and description are required' },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `INSERT INTO recommendations (title, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [title, description, decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Recommendation created successfully',
      recommendationId: rows[0].id
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 