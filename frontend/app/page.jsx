import { cookies, headers } from 'next/headers';
import Link from 'next/link';
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
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return <LandingPage />;
  }

  const places = await getPlaces();

  return (
    <main data-cy="app-root" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <TravelTrackerApp initialPlaces={places} currentUser={currentUser} />
      </div>
    </main>
  );
}

function LandingPage() {
  const features = [
    {
      title: 'Orte speichern',
      text: 'Sammle Lieblingsorte, Geheimtipps und Reiseideen an einem Ort.',
      icon: 'pin',
    },
    {
      title: 'Reisen planen',
      text: 'Ordne Spots nach Kategorien und finde sie später auf der Karte wieder.',
      icon: 'route',
    },
    {
      title: 'Orte teilen',
      text: 'Teile einzelne Orte mit anderen Nutzer:innen und plant gemeinsam.',
      icon: 'share',
    },
  ];

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <MapPinIcon className="h-5 w-5" />
          </span>
          Travel Tracker
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            Login
          </Link>
          <Link href="/register" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Registrieren
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-5.25rem)] max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1fr_0.92fr] lg:pb-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Lieblingsorte einfach merken
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl">
            Deine Reiseorte auf einer Karte.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Speichere schöne Orte, plane deine nächste Reise und teile besondere Spots mit Freund:innen.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-200 transition hover:bg-emerald-400">
              Kostenlos starten
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:border-slate-400">
              Ich habe ein Konto
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Keine Listen-Chaos</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Schnell per Karte</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Mit Freunden teilbar</span>
          </div>
        </div>

        <TravelIllustration />
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-12 sm:px-8 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                {feature.icon === 'pin' && <MapPinIcon className="h-5 w-5" />}
                {feature.icon === 'route' && <RouteIcon className="h-5 w-5" />}
                {feature.icon === 'share' && <ShareIcon className="h-5 w-5" />}
              </span>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{feature.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function TravelIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -left-4 top-12 h-24 w-24 rounded-full bg-yellow-200/70 blur-2xl" />
      <div className="absolute -right-3 bottom-14 h-32 w-32 rounded-full bg-emerald-200/70 blur-2xl" />
      <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#f7f0e6] p-5">
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/70" />
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
          <div className="absolute right-1/4 top-0 h-full w-px bg-white/60" />

          <svg viewBox="0 0 520 330" className="relative h-auto w-full" aria-hidden="true">
            <path d="M53 212 C116 140 181 143 239 190 C302 242 371 225 455 116" fill="none" stroke="#f2b633" strokeWidth="9" strokeLinecap="round" />
            <path d="M53 212 C119 159 184 152 243 194 C305 238 372 218 455 116" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 14" opacity="0.85" />
            <g transform="translate(95 130)">
              <path d="M36 0C16 0 0 16 0 36c0 26 36 66 36 66s36-40 36-66C72 16 56 0 36 0z" fill="#10b981" />
              <circle cx="36" cy="36" r="14" fill="#ffffff" />
            </g>
            <g transform="translate(238 182)">
              <path d="M28 0C13 0 0 13 0 28c0 20 28 51 28 51s28-31 28-51C56 13 44 0 28 0z" fill="#0f172a" />
              <circle cx="28" cy="28" r="10" fill="#ffffff" />
            </g>
            <g transform="translate(404 73)">
              <path d="M34 0C15 0 0 15 0 34c0 25 34 62 34 62s34-37 34-62C68 15 53 0 34 0z" fill="#fbbf24" />
              <circle cx="34" cy="34" r="13" fill="#ffffff" />
            </g>
          </svg>

          <div className="absolute left-7 top-7 rounded-2xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Trip</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Sommerroute</p>
          </div>

          <div className="absolute bottom-7 right-7 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
            <span className="flex -space-x-2">
              <span className="h-7 w-7 rounded-full border-2 border-white bg-emerald-400" />
              <span className="h-7 w-7 rounded-full border-2 border-white bg-yellow-300" />
            </span>
            <span className="text-sm font-semibold text-slate-700">geteilt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPinIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M12 21s7-5.5 7-12a7 7 0 0 0-14 0c0 6.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function RouteIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M5 7h5a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h11" />
      <circle cx="5" cy="7" r="2" />
      <circle cx="19" cy="21" r="2" />
    </svg>
  );
}

function ShareIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" />
    </svg>
  );
}
