const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ALLOWED_ACTIONS = new Set(['register', 'login', 'logout']);

export async function POST(request, { params }) {
  const { action } = params;

  if (!ALLOWED_ACTIONS.has(action)) {
    return Response.json({ error: 'Unbekannte Auth-Aktion.' }, { status: 404 });
  }

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
        method: 'POST',
        headers,
        body,
        cache: 'no-store',
      },
    );

    const responseHeaders = new Headers();
    const responseContentType = backendResponse.headers.get('content-type');
    const setCookie = backendResponse.headers.get('set-cookie');

    if (responseContentType) {
      responseHeaders.set('content-type', responseContentType);
    }
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    return new Response(await backendResponse.text(), {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[api/auth/${action}] Backend request failed:`, error);
    return Response.json(
      { error: 'Backend nicht erreichbar.' },
      { status: 502 },
    );
  }
}
