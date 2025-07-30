import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const isPublicPath = pathname === '/' || pathname === '/terms' || pathname === '/privacy' || pathname === '/contact' || pathname === '/about';

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (token && (pathname === '/')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // If user is not logged in and tries to access protected pages, redirect to login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 