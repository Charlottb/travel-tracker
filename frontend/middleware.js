import { jwtVerify } from 'jose/jwt/verify';
import { NextResponse } from 'next/server';

const PUBLIC_EXACT_PATHS = new Set(['/', '/login', '/register']);
const PUBLIC_SEGMENT_PATHS = ['/share'];
const AUTH_COOKIE_NAME = 'authToken';
const JWT_SECRET = process.env.JWT_SECRET;
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdnjs.cloudflare.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
  "connect-src 'self' http://localhost:3000 http://localhost:3001 https://nominatim.openstreetmap.org",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ');

function matchesPathSegment(pathname, segmentPath) {
  return pathname === segmentPath || pathname.startsWith(`${segmentPath}/`);
}

function isPublicPath(pathname) {
  return (
    PUBLIC_EXACT_PATHS.has(pathname) ||
    PUBLIC_SEGMENT_PATHS.some((path) => matchesPathSegment(pathname, path))
  );
}

async function verifyJwtToken(token) {
  if (!JWT_SECRET) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return typeof payload?.userId === 'number' && typeof payload?.email === 'string';
  } catch (_error) {
    return false;
  }
}

async function validateTokenWithBackend(request) {
  const cookie = request.headers.get('cookie');

  if (!cookie) {
    return false;
  }

  try {
    const response = await fetch(new URL('/api/auth/me', request.url), {
      method: 'GET',
      cache: 'no-store',
      headers: { cookie },
    });

    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function isValidAuthToken(request, token) {
  if (await verifyJwtToken(token)) {
    return true;
  }

  return validateTokenWithBackend(request);
}

function redirectToLoginAndClearCookie(request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(AUTH_COOKIE_NAME);
  return applySecurityHeaders(response);
}

function applySecurityHeaders(response) {
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const publicPath = isPublicPath(pathname);

  if (!token && !publicPath) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  if (token && !(await isValidAuthToken(request, token))) {
    if (!publicPath) {
      return redirectToLoginAndClearCookie(request);
    }

    const response = NextResponse.next();
    response.cookies.delete(AUTH_COOKIE_NAME);
    return applySecurityHeaders(response);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
