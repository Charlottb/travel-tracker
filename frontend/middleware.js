import { NextResponse } from 'next/server';

const AUTH_REDIRECT_PATHS = ['/login', '/register'];
const PUBLIC_PATHS = ['/', ...AUTH_REDIRECT_PATHS, '/share'];
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function validateAuthToken(token) {
  try {
    const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/auth/me`, {
      method: 'GET',
      headers: {
        cookie: `authToken=${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[middleware] auth validation failed:', error);
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('authToken')?.value;
  const isPublicPath = PUBLIC_PATHS.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)));
  const isAuthRedirectPath = AUTH_REDIRECT_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const isValidToken = await validateAuthToken(token);

    if (!isValidToken) {
      if (!isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }

    if (isAuthRedirectPath) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
