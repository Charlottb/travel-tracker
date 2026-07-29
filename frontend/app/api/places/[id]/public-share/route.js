import { NextResponse } from 'next/server';
import {
  buildBackendUrl,
  getBackendHeaders,
  readError,
  rejectInvalidMutationOrigin,
  validatePositiveIntegerParam,
} from '../../proxyUtils';

function getBackendPublicShareUrl(id) {
  return buildBackendUrl(`/places/${id}/public-share`);
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

  const url = getBackendPublicShareUrl(id);

  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: getBackendHeaders(request, { Accept: 'application/json' }),
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
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
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

  const url = getBackendPublicShareUrl(id);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      cache: 'no-store',
      headers: getBackendHeaders(request, { Accept: 'application/json' }),
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
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
}
