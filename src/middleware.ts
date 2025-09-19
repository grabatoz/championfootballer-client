import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // COMPLETE AUTH BYPASS - Let all auth routes pass through
  if (pathname.startsWith('/auth/')) {
    console.log(`[MIDDLEWARE] Bypassing auth route: ${pathname}`);
    return NextResponse.next();
  }
  
  const token = request.cookies.get('token')?.value || request.cookies.get('auth_token')?.value;
  
  // Public routes
  const publicPaths = ['/', '/login', '/register', '/about'];
  
  // If user has token and tries to access public page, redirect to home
  if (publicPaths.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  // If user tries to access protected page without token, redirect to login
  if (!publicPaths.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};