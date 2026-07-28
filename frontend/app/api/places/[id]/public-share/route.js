import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendPublicShareUrl(id) {
  return `${BACKEND_URL.replace(/\/$/, '')}/places/${id}/public-share`;
}

async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

function getCookieHeaders(request, headers = {}) {
  const cookie = request.headers.get('cookie');

  return {
    ...headers,
    ...(cookie ? { cookie } : {}),
  };
}

export async function POST(request, { params }) {
  const url = getBackendPublicShareUrl(params.id);

  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: getCookieHeaders(request, { Accept: 'application/json' }),
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Share-Links', details: error },
        { status: response.status },
      );
    }

    const place = await response.json();
    return NextResponse.json(place, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar', details: error.message },
      { status: 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const url = getBackendPublicShareUrl(params.id);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      cache: 'no-store',
      headers: getCookieHeaders(request, { Accept: 'application/json' }),
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Fehler beim Deaktivieren des Share-Links', details: error },
        { status: response.status },
      );
    }

    const place = await response.json();
    return NextResponse.json(place, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar', details: error.message },
      { status: 502 },
    );
  }
}
