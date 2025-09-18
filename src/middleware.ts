import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOGIN_PATH = '/';

const PUBLIC_PATHS = [
  '/',
  '/auth/callback',
  '/auth/login',
  '/auth/register',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/_next',
  '/api',
  '/assets',
  '/public',
];

const PROTECTED_PREFIXES = [
  '/home',
  '/dashboard',
  '/profile',
  '/league',
  '/match',
  '/trophy-room',
  '/world-ranking',
  '/leader-board',
  '/dream-team',
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Read token from either cookie name
  const token =
    req.cookies.get('token')?.value ||
    req.cookies.get('token')?.value;

  // If already authenticated and at root, send to /home
  if (pathname === '/' && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    url.search = ''; // clean query
    return NextResponse.redirect(url);
  }

  // Public paths always allowed
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Protect only known private prefixes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    // Only attach next when not already at login/root
    if (pathname !== LOGIN_PATH && pathname !== '/') {
      url.searchParams.set('next', pathname + search);
    } else {
      url.searchParams.delete('next');
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|public).*)'],
};