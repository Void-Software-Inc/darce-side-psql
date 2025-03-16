import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Execute a simple query to test the connection
    const result = await query('SELECT NOW() as current_time');
    
    // Return the result
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API route error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 