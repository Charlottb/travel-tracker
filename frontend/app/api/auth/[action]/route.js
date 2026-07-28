const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ALLOWED_POST_ACTIONS = new Set(['register', 'login', 'logout']);
const ALLOWED_PATCH_ACTIONS = new Set(['profile']);

async function proxyAuthRequest(request, { action, method }) {
  try {
    const headers = { Accept: 'application/json' };
    const cookie = request.headers.get('cookie');
    const contentType = request.headers.get('content-type');

    if (cookie) {
      headers.cookie = cookie;
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const body = action === 'logout' ? undefined : await request.text();
    const backendResponse = await fetch(
      `${BACKEND_URL.replace(/\/$/, '')}/api/auth/${action}`,
      {
        method,
        credentials: 'include',
        headers,
        body,
        cache: 'no-store',
      },
    );

    const responseHeaders = new Headers();
    const responseContentType = backendResponse.headers.get('content-type');
    const rawSetCookie = backendResponse.headers.raw?.()['set-cookie'] || [];
    const singleSetCookie = backendResponse.headers.get('set-cookie');
    const responseText = await backendResponse.text();
    let backendJson = null;

    try {
      backendJson = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      backendJson = null;
    }

    if (responseContentType) {
      responseHeaders.set('content-type', responseContentType);
    }

    if (rawSetCookie.length > 0) {
      rawSetCookie.forEach((cookie) => responseHeaders.append('set-cookie', cookie));
    } else if (singleSetCookie) {
      responseHeaders.append('set-cookie', singleSetCookie);
    } else if ((action === 'login' || action === 'profile') && backendJson?.token) {
      responseHeaders.append(
        'set-cookie',
        `authToken=${encodeURIComponent(backendJson.token)}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; SameSite=Lax`,
      );
    }

    return new Response(responseText, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (_error) {
    return Response.json(
      { error: 'Backend nicht erreichbar.' },
      { status: 502 },
    );
  }
}

export async function POST(request, { params }) {
  const { action } = await params;

  if (!ALLOWED_POST_ACTIONS.has(action)) {
    return Response.json({ error: 'Unbekannte Auth-Aktion.' }, { status: 404 });
  }

  return proxyAuthRequest(request, { action, method: 'POST' });
}

export async function PATCH(request, { params }) {
  const { action } = await params;

  if (!ALLOWED_PATCH_ACTIONS.has(action)) {
    return Response.json({ error: 'Unbekannte Auth-Aktion.' }, { status: 404 });
  }

  return proxyAuthRequest(request, { action, method: 'PATCH' });
}
