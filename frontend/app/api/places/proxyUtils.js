import { NextResponse } from 'next/server';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const PUBLIC_SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function buildBackendUrl(path) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  return `${backendUrl.replace(/\/$/, '')}${path}`;
}

export async function readError(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown API error';
}

export function getBackendHeaders(request, headers = {}) {
  const cookie = request.headers.get('cookie');

  return {
    ...headers,
    ...(cookie ? { cookie } : {}),
  };
}

export function validatePositiveIntegerParam(value) {
  const param = String(value ?? '');
  return POSITIVE_INTEGER_PATTERN.test(param) ? param : null;
}

export function validatePublicShareTokenParam(value) {
  const token = String(value ?? '');
  return PUBLIC_SHARE_TOKEN_PATTERN.test(token) ? token : null;
}

function getRequestHost(request) {
  return request.headers.get('host');
}

export function rejectInvalidMutationOrigin(request) {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  try {
    const originHost = new URL(origin).host;
    const requestHost = getRequestHost(request);

    if (requestHost && originHost === requestHost) {
      return null;
    }
  } catch (_error) {
    // Fall through to the generic forbidden response.
  }

  return NextResponse.json({ error: 'Ungueltige Anfrage.' }, { status: 403 });
}
