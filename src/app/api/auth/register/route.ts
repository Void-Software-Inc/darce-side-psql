import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, accessCode } = body;

    // Validate required fields
    if (!username || !email || !password || !accessCode) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify access code
    const codeResult = await query(
      'SELECT id FROM access_codes WHERE code = $1 AND is_used = false',
      [accessCode]
    );

    if (codeResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or used access code' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Get the user role ID (always 'user' role for code-based registration)
    const roleResult = await query(
      'SELECT id FROM roles WHERE name = $1',
      ['user']
    );

    if (roleResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User role not found' },
        { status: 500 }
      );
    }

    const roleId = roleResult.rows[0].id;

    // Start a transaction
    await query('BEGIN');

    try {
      // Create the user
      const userResult = await query(
        `INSERT INTO users (username, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [username, email, hashedPassword, roleId]
      );

      // Mark the access code as used
      await query(
        `UPDATE access_codes 
         SET is_used = true, 
             used_by = $1,
             used_at = CURRENT_TIMESTAMP
         WHERE code = $2`,
        [userResult.rows[0].id, accessCode]
      );

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'User registered successfully'
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle unique constraint violations
    if (error.code === '23505') { // PostgreSQL unique violation code
      const field = error.detail.includes('username') ? 'username' : 'email';
      return NextResponse.json(
        { success: false, message: `This ${field} is already taken` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
} 