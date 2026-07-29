import { NextResponse } from 'next/server';
import {
  buildBackendUrl,
  getBackendHeaders,
  readError,
  rejectInvalidMutationOrigin,
} from './proxyUtils';

function getBackendPlacesUrl() {
  return buildBackendUrl('/places');
}

export async function GET(request) {
  const url = getBackendPlacesUrl();

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: getBackendHeaders(request, { Accept: 'application/json' }),
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Orte', details: error },
        { status: response.status },
      );
    }

    const places = await response.json();

    return NextResponse.json(places);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
}

export async function POST(request) {
  const invalidOriginResponse = rejectInvalidMutationOrigin(request);
  if (invalidOriginResponse) {
    return invalidOriginResponse;
  }

  const url = getBackendPlacesUrl();

  try {
    const body = await request.json();

    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: getBackendHeaders(request, {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Fehler beim Speichern des Ortes', details: error },
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
