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

    // Get recommendation ID from request body
    const { recommendationId } = await request.json();

    if (!recommendationId) {
      return NextResponse.json(
        { success: false, message: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    // Check if recommendation exists and is pending
    const recommendationResult = await query(
      'SELECT id, status FROM recommendations WHERE id = $1',
      [recommendationId]
    );

    if (!recommendationResult?.rowCount) {
      return NextResponse.json(
        { success: false, message: 'Recommendation not found' },
        { status: 404 }
      );
    }

    const recommendation = recommendationResult.rows[0];
    if (recommendation.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Can only upvote pending recommendations' },
        { status: 400 }
      );
    }

    // Check if user has already upvoted
    const upvoteResult = await query(
      'SELECT id FROM recommendation_upvotes WHERE recommendation_id = $1 AND user_id = $2',
      [recommendationId, decoded.userId]
    );

    let action: 'added' | 'removed';

    if (upvoteResult?.rowCount) {
      // Remove upvote
      await query(
        'DELETE FROM recommendation_upvotes WHERE recommendation_id = $1 AND user_id = $2',
        [recommendationId, decoded.userId]
      );
      action = 'removed';
    } else {
      // Add upvote
      await query(
        'INSERT INTO recommendation_upvotes (recommendation_id, user_id) VALUES ($1, $2)',
        [recommendationId, decoded.userId]
      );
      action = 'added';
    }

    // Get updated upvotes count
    const countResult = await query(
      'SELECT upvotes_count FROM recommendations WHERE id = $1',
      [recommendationId]
    );

    return NextResponse.json({
      success: true,
      action,
      upvotesCount: countResult?.rows[0]?.upvotes_count ?? 0
    });
  } catch (error) {
    console.error('Error toggling recommendation upvote:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 