import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the path is /chat
  if (request.nextUrl.pathname.startsWith('/chat')) {
    // Check for user session cookie or header
    // Since we're using localStorage, we can't check it server-side
    // But we can add a cookie when user logs in for better security
    
    // For now, we'll let the client-side handle the redirect
    // This is just a placeholder for future cookie-based auth
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/chat/:path*',
};