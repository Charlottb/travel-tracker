import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendShareUrl(id, shareId) {
  return `${BACKEND_URL.replace(/\/$/, '')}/places/${id}/share/${shareId}`;
}

async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

export async function DELETE(request, { params }) {
  const url = getBackendShareUrl(params.id, params.shareId);

  try {
    const cookie = request.headers.get('cookie');
    const response = await fetch(url, {
      method: 'DELETE',
      cache: 'no-store',
      headers: cookie ? { cookie } : {},
    });

    if (!response.ok) {
      const error = await readError(response);
      return NextResponse.json(
        { error: 'Fehler beim Entfernen der Freigabe', details: error },
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
