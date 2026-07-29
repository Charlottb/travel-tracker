import { NextResponse } from 'next/server';
import {
  buildBackendUrl,
  readError,
  rejectInvalidMutationOrigin,
  validatePositiveIntegerParam,
} from '../proxyUtils';

function getBackendPlaceUrl(id) {
  return buildBackendUrl(`/places/${id}`);
}

export async function DELETE(request, { params }) {
  const invalidOriginResponse = rejectInvalidMutationOrigin(request);
  if (invalidOriginResponse) {
    return invalidOriginResponse;
  }

  const { id: rawId } = await params;
  const id = validatePositiveIntegerParam(rawId);
  if (!id) {
    return NextResponse.json({ error: 'Ungueltige ID' }, { status: 400 });
  }

  const url = getBackendPlaceUrl(id);

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
        { error: 'Fehler beim Loeschen des Ortes', details: error },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
}

export async function PUT(request, { params }) {
  const invalidOriginResponse = rejectInvalidMutationOrigin(request);
  if (invalidOriginResponse) {
    return invalidOriginResponse;
  }

  const { id: rawId } = await params;
  const id = validatePositiveIntegerParam(rawId);
  if (!id) {
    return NextResponse.json({ error: 'Ungueltige ID' }, { status: 400 });
  }

  const url = getBackendPlaceUrl(id);

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
