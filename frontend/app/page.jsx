import { cookies, headers } from 'next/headers';
import TravelTrackerApp from '../components/TravelTrackerApp';

export const dynamic = 'force-dynamic';

function getAppUrl() {
  const requestHeaders = headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function getPlaces() {
  const APP_URL = getAppUrl();
  const url = `${APP_URL.replace(/\/$/, '')}/api/places`;
  const cookieHeader = cookies().toString();
  
  console.log('[page.jsx] Fetching places from:', url);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`[page.jsx] Response received: ${response.status} ${response.statusText} (${elapsed}ms)`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`[page.jsx] HTTP Error ${response.status}:`, error);
      return [];
    }

    const places = await response.json();
    console.log(`[page.jsx] Places loaded: ${places.length} items`);
    return places;
  } catch (error) {
    console.error('[page.jsx] FETCH FAILED:', {
      message: error.message,
      url,
      errorType: error.name,
      stack: error.stack,
    });

    return [];
  }
}

async function getCurrentUser() {
  const APP_URL = getAppUrl();
  const url = `${APP_URL.replace(/\/$/, '')}/api/auth/me`;
  const cookieHeader = cookies().toString();

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.user ?? null;
  } catch (error) {
    console.error('[page.jsx] getCurrentUser failed:', error);
    return null;
  }
}

export default async function HomePage() {
  const [places, currentUser] = await Promise.all([getPlaces(), getCurrentUser()]);

  return (
    <main data-cy="app-root" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <TravelTrackerApp initialPlaces={places} currentUser={currentUser} />
      </div>
    </main>
  );
}
