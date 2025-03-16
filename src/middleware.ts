import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/api/protected'
];

// Routes that require admin role
const adminRoutes = [
  '/admin',
  '/api/admin'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the route requires admin role
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }
  
  // Get the token from the cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // If no token is found, redirect to login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // For API routes, we'll let the API route handle the authentication
  // since we can't use the crypto module in middleware
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // For protected pages, we'll do a simple check for now
  // and let the page component handle the full authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 