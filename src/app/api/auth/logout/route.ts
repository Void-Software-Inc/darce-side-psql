import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create a response with redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Delete the auth token cookie
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

// Also handle GET requests for direct navigation
export async function GET(request: NextRequest) {
  try {
    // Create a response with redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Delete the auth token cookie
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 