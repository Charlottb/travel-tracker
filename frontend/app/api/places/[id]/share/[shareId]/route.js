import { NextResponse } from 'next/server';
import {
  buildBackendUrl,
  readError,
  rejectInvalidMutationOrigin,
  validatePositiveIntegerParam,
} from '../../../proxyUtils';

function getBackendShareUrl(id, shareId) {
  return buildBackendUrl(`/places/${id}/share/${shareId}`);
}

export async function DELETE(request, { params }) {
  const invalidOriginResponse = rejectInvalidMutationOrigin(request);
  if (invalidOriginResponse) {
    return invalidOriginResponse;
  }

  const { id: rawId, shareId: rawShareId } = await params;
  const id = validatePositiveIntegerParam(rawId);
  const shareId = validatePositiveIntegerParam(rawShareId);
  if (!id || !shareId) {
    return NextResponse.json({ error: 'Ungueltige ID' }, { status: 400 });
  }

  const url = getBackendShareUrl(id, shareId);

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
  } catch (_error) {
    return NextResponse.json(
      { error: 'Backend nicht erreichbar' },
      { status: 502 },
    );
  }
}
