import { headers } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getAppUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
}

async function getSharedPlace(token) {
  const appUrl = (await getAppUrl()).replace(/\/$/, '');

  try {
    const response = await fetch(`${appUrl}/api/places/public-shares/${token}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (_error) {
    return null;
  }
}

export default async function PublicSharePage({ params }) {
  const { token } = await params;
  const place = await getSharedPlace(token);

  if (!place) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center">
          <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Travel Tracker</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">Geteilter Ort nicht verfügbar</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Der Link ist ungültig, wurde deaktiviert oder der Ort ist nicht mehr freigegeben.
            </p>
            <Link href="/" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Travel Tracker öffnen
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-base font-semibold text-slate-950">
            Travel Tracker
          </Link>
          <Link href="/register" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Eigene Orte speichern
          </Link>
        </header>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Geteilter Ort</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{place.title}</h1>
              {place.owner?.name && (
                <p className="mt-2 text-sm text-slate-500">Geteilt von {place.owner.name}</p>
              )}
            </div>
            {place.category && (
              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {place.category}
              </span>
            )}
          </div>

          {place.description && (
            <p className="mt-6 text-base leading-8 text-slate-600">{place.description}</p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Breitengrad</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{Number(place.lat).toFixed(5)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Längengrad</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{Number(place.lng).toFixed(5)}</p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <Link href="/" className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400">
              Travel Tracker öffnen
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
