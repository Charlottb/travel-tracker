import { NextResponse } from 'next/server';
import {
  buildBackendUrl,
  readError,
  rejectInvalidMutationOrigin,
  validatePositiveIntegerParam,
} from '../../proxyUtils';

function getBackendShareUrl(id) {
  return buildBackendUrl(`/places/${id}/share`);
}

export async function POST(request, { params }) {
  const invalidOriginResponse = rejectInvalidMutationOrigin(request);
  if (invalidOriginResponse) {
    return invalidOriginResponse;
  }

  const { id: rawId } = await params;
  const id = validatePositiveIntegerParam(rawId);
  if (!id) {
    return NextResponse.json({ error: 'Ungueltige ID' }, { status: 400 });
  }

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
