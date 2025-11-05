import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // COMPLETE AUTH BYPASS - Let all auth routes pass through
  if (pathname.startsWith('/auth/')) {
    console.log(`[MIDDLEWARE] Bypassing auth route: ${pathname}`);
    return response;
  }
  
  // Add this condition to your middleware
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return response;
  }
  
  const token = request.cookies.get('token')?.value || request.cookies.get('auth_token')?.value;

  // Public routes
  const publicAlwaysPaths = ['/about', '/terms', '/privacy', '/contact']; // always accessible (no redirect even if logged-in)
  const publicRedirectPaths = ['/', '/login', '/register']; // redirect to /home if logged-in
  const publicPaths = [...publicAlwaysPaths, ...publicRedirectPaths];

  // If user has token and tries to access auth landing pages, redirect to home
  if (publicRedirectPaths.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // If user tries to access protected page without token, redirect to login
  if (!publicPaths.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};