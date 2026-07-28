import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request) {
  const cookie = request.headers.get('cookie');

  try {
    const backendResponse = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/auth/me`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(cookie ? { cookie } : {}),
      },
    });

    const responseText = await backendResponse.text();
    const responseHeaders = new Headers();

    const contentType = backendResponse.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }

    return new Response(responseText, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar.' },
      { status: 502 },
    );
  }
}
