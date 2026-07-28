import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendPublicShareUrl(token) {
  return `${BACKEND_URL.replace(/\/$/, '')}/places/public-shares/${token}`;
}

async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

export async function GET(_request, { params }) {
  const url = getBackendPublicShareUrl(params.token);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Geteilter Ort nicht gefunden', details: error },
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
