import { NextResponse } from 'next/server';

const PUBLIC_EXACT_PATHS = new Set(['/', '/login', '/register']);
const PUBLIC_SEGMENT_PATHS = ['/share'];

function matchesPathSegment(pathname, segmentPath) {
  return pathname === segmentPath || pathname.startsWith(`${segmentPath}/`);
}

function isPublicPath(pathname) {
  return (
    PUBLIC_EXACT_PATHS.has(pathname) ||
    PUBLIC_SEGMENT_PATHS.some((path) => matchesPathSegment(pathname, path))
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('authToken')?.value;

  if (!token && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
