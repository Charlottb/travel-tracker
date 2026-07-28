import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendShareUrl(id) {
  return `${BACKEND_URL.replace(/\/$/, '')}/places/${id}/share`;
}

async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

export async function POST(request, { params }) {
  const { id } = await params;
  const url = getBackendShareUrl(id);

  try {
    const cookie = request.headers.get('cookie');
    const body = await request.json();
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Fehler beim Teilen des Ortes', details: error },
        { status: response.status },
      );
    }

    const place = await response.json();
    return NextResponse.json(place, { status: response.status });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
}
