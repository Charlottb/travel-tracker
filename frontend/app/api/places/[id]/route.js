import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendPlaceUrl(id) {
  return `${BACKEND_URL.replace(/\/$/, '')}/places/${id}`;
}

async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

export async function DELETE(request, { params }) {
  const url = getBackendPlaceUrl(params.id);
  console.log('[api/places/[id]] DELETE ->', url);

  try {
    const cookie = request.headers.get('cookie');
    const response = await fetch(url, {
      method: 'DELETE',
      cache: 'no-store',
      headers: cookie ? { cookie } : {},
    });

    console.log('[api/places/[id]] Backend response:', response.status, response.statusText);

    if (!response.ok) {
      const error = await readError(response);
      console.error('[api/places/[id]] DELETE failed:', { status: response.status, error });
      return NextResponse.json(
        { error: 'Fehler beim Loeschen des Ortes', details: error },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log('[api/places/[id]] DELETE success:', params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/places/[id]] DELETE crashed:', {
      message: error.message,
      name: error.name,
      url,
    });

    return NextResponse.json(
      { error: 'Backend nicht erreichbar', details: error.message },
      { status: 502 },
    );
  }
}

export async function PUT(request, { params }) {
  const url = getBackendPlaceUrl(params.id);
  console.log('[api/places/[id]] PUT ->', url);

  try {
    const cookie = request.headers.get('cookie');
    const body = await request.json();
    const response = await fetch(url, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    });

    console.log('[api/places/[id]] Backend response:', response.status, response.statusText);

    if (!response.ok) {
      const error = await readError(response);
      console.error('[api/places/[id]] PUT failed:', { status: response.status, error });
      return NextResponse.json(
        { error: 'Fehler beim Speichern des Ortes', details: error },
        { status: response.status },
      );
    }

    const place = await response.json();
    console.log('[api/places/[id]] PUT success:', params.id);

    return NextResponse.json(place, { status: response.status });
  } catch (error) {
    console.error('[api/places/[id]] PUT crashed:', {
      message: error.message,
      name: error.name,
      url,
    });

    return NextResponse.json(
      { error: 'Backend nicht erreichbar', details: error.message },
      { status: 502 },
    );
  }
}
