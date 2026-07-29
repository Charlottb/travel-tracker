import { jwtVerify } from 'jose/jwt/verify';
import { NextResponse } from 'next/server';

const PUBLIC_EXACT_PATHS = new Set(['/', '/login', '/register']);
const PUBLIC_SEGMENT_PATHS = ['/share'];
const AUTH_COOKIE_NAME = 'authToken';
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

function getOrigin(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch (_error) {
    return null;
  }
}

const connectSources = ["'self'", 'https://nominatim.openstreetmap.org'];
const backendOrigin = getOrigin(configuredBackendUrl);

if (backendOrigin) {
  connectSources.push(backendOrigin);
}

if (!isProduction) {
  connectSources.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'ws://localhost:3000',
    'ws://localhost:3001',
    'ws://localhost:3002',
    'ws://localhost:3003',
    'ws://localhost:3004',
  );
}

const scriptSources = ["'self'", "'unsafe-inline'"];

if (!isProduction) {
  scriptSources.push("'unsafe-eval'");
}

const CSP_HEADER = [
  "default-src 'self'",
  `script-src ${scriptSources.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdnjs.cloudflare.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
  `connect-src ${connectSources.join(' ')}`,
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
