import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateUserHash } from '@/lib/password-utils';

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
    
    // Get all users
    const usersResult = await query(
      `SELECT u.id, u.username, u.email, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.id ASC`
    );
    
    // Return the users
    return NextResponse.json({
      success: true,
      users: usersResult.rows
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
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
        { success: false, message: 'Forbidden: Only admins can create users' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { username, email, password, role, useDemoSalt = true, customSalt } = body;
    
    // Validate input
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Username, email, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists
    const existingUserResult = await query(
      `SELECT id FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );
    
    if (existingUserResult.rowCount && existingUserResult.rowCount > 0) {
      return NextResponse.json(
        { success: false, message: 'Username or email already exists' },
        { status: 409 }
      );
    }
    
    // Generate password hash
    const passwordHash = await generateUserHash(password, useDemoSalt, customSalt);
    
    // Insert new user
    const insertResult = await query(
      `INSERT INTO users (username, email, password_hash, role_id)
       VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = $4))
       RETURNING id`,
      [username, email, passwordHash, role]
    );
    
    if (insertResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: insertResult.rows[0].id
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while creating the user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 