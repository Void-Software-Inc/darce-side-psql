import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

function generateCode(): string {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

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
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate a new code
    const code = generateCode();

    // Insert the new code
    const result = await query(
      `INSERT INTO access_codes (code, created_by)
       VALUES ($1, $2)
       RETURNING id, code, created_at`,
      [code, user.id]
    );

    // Get the complete code information with username
    const newCodeResult = await query(
      `SELECT 
        ac.id, 
        ac.code,
        ac.is_used,
        ac.created_at,
        ac.used_at,
        creator.username as created_by,
        null as used_by
       FROM access_codes ac
       JOIN users creator ON ac.created_by = creator.id
       WHERE ac.id = $1`,
      [result.rows[0].id]
    );
    
    return NextResponse.json({
      success: true,
      code: newCodeResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating access code:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 