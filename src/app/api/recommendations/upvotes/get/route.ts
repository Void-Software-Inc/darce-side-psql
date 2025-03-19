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

    // Get recommendation ID from URL
    const url = new URL(request.url);
    const recommendationId = url.searchParams.get('recommendationId');

    if (!recommendationId) {
      return NextResponse.json(
        { success: false, message: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    // Check if user has upvoted the recommendation
    const upvoteResult = await query(
      'SELECT id FROM recommendation_upvotes WHERE recommendation_id = $1 AND user_id = $2',
      [recommendationId, decoded.userId]
    );

    return NextResponse.json({
      success: true,
      hasUpvoted: upvoteResult?.rowCount ?? 0 > 0
    });
  } catch (error) {
    console.error('Error checking recommendation upvote:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 