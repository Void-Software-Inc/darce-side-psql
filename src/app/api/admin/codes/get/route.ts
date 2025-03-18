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
    
    // Check if the user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get all access codes with user information
    const codesResult = await query(
      `SELECT 
        ac.id, 
        ac.code,
        ac.is_used,
        ac.created_at,
        ac.used_at,
        creator.username as created_by,
        COALESCE(user_used.username, '-') as used_by
       FROM access_codes ac
       JOIN users creator ON ac.created_by = creator.id
       LEFT JOIN users user_used ON ac.used_by = user_used.id
       ORDER BY ac.created_at DESC`
    );
    
    // Return the codes
    return NextResponse.json({
      success: true,
      codes: codesResult.rows
    });
  } catch (error) {
    console.error('Error getting access codes:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 