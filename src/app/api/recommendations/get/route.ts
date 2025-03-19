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

    const { rows: recommendations } = await query(
      `SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.upvotes_count,
        r.admin_response,
        r.created_at,
        r.updated_at,
        u.username as created_by
      FROM recommendations r
      JOIN users u ON r.created_by = u.id
      ORDER BY 
        CASE 
          WHEN r.status = 'pending' THEN r.created_at
          ELSE r.updated_at
        END DESC,
        r.upvotes_count DESC`
    );

    return NextResponse.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 