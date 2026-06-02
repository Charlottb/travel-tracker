import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendPlacesUrl() {
  return `${BACKEND_URL.replace(/\/$/, '')}/places`;
}

async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

export async function GET() {
  const url = getBackendPlacesUrl();
  console.log('[api/places] GET ->', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    console.log('[api/places] Backend response:', response.status, response.statusText);

    if (!response.ok) {
      const error = await readError(response);
      console.error('[api/places] GET failed:', { status: response.status, error });
      return NextResponse.json(
        { error: 'Fehler beim Laden der Orte', details: error },
        { status: response.status },
      );
    }

    const places = await response.json();
    console.log('[api/places] GET success:', Array.isArray(places) ? places.length : 'non-array');

    return NextResponse.json(places);
  } catch (error) {
    console.error('[api/places] GET crashed:', {
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

export async function POST(request) {
  const url = getBackendPlacesUrl();
  console.log('[api/places] POST ->', url);

  try {
    const body = await request.json();
    console.log('[api/places] POST body:', body);

    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[api/places] Backend response:', response.status, response.statusText);

    if (!response.ok) {
      const error = await readError(response);
      console.error('[api/places] POST failed:', { status: response.status, error });
      return NextResponse.json(
        { error: 'Fehler beim Speichern des Ortes', details: error },
        { status: response.status },
      );
    }

    const place = await response.json();
    console.log('[api/places] POST success:', place?.id);

    return NextResponse.json(place, { status: response.status });
  } catch (error) {
    console.error('[api/places] POST crashed:', {
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
