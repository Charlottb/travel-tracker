import { NextResponse } from 'next/server';
import {
  buildBackendUrl,
  readError,
  validatePublicShareTokenParam,
} from '../../proxyUtils';

function getBackendPublicShareUrl(token) {
  return buildBackendUrl(`/places/public-shares/${token}`);
}

export async function GET(_request, { params }) {
  const { token: rawToken } = await params;
  const token = validatePublicShareTokenParam(rawToken);
  if (!token) {
    return NextResponse.json({ error: 'Ungueltiger Share-Link.' }, { status: 400 });
  }

  const url = getBackendPublicShareUrl(token);

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
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
}
