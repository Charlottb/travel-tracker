import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import TravelTrackerApp from '../components/TravelTrackerApp';

export const dynamic = 'force-dynamic';

async function getAppUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function getPlaces() {
  const APP_URL = await getAppUrl();
  const url = `${APP_URL.replace(/\/$/, '')}/api/places`;
  const cookieHeader = (await cookies()).toString();
  
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
  const APP_URL = await getAppUrl();
  const url = `${APP_URL.replace(/\/$/, '')}/api/auth/me`;
  const cookieHeader = (await cookies()).toString();

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
    <main data-cy="app-root" className="min-h-screen bg-[#fbfaf7] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
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
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-7 sm:px-8">
        <Link href="/" className="flex items-center gap-4 text-xl font-semibold">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <MapPinIcon className="h-6 w-6" />
          </span>
          Travel Tracker
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="rounded-full px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-white">
            Login
          </Link>
          <Link href="/register" className="rounded-full bg-slate-950 px-6 py-3 text-base font-semibold text-white shadow-md shadow-slate-200 transition hover:bg-slate-800">
            Registrieren
          </Link>
        </div>
      </nav>

      <section className="relative min-h-[calc(100vh-5.25rem)] overflow-hidden pb-16 pt-8 lg:pb-20 lg:pt-12">
        <HeroRouteGraphic />

        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-xl">
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
        </div>

        <a
          href="#features"
          aria-label="Mehr Inhalte anzeigen"
          className="absolute bottom-20 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-600 shadow-xl shadow-emerald-100/80 ring-8 ring-[#fbfaf7] transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50 sm:right-8 lg:right-[max(2rem,calc((100vw-72rem)/2))]"
        >
          <ArrowDownIcon className="h-7 w-7" />
        </a>
      </section>

      <section id="features" className="scroll-mt-8 border-t border-slate-200 bg-white">
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

function HeroRouteGraphic() {
  const routePath =
    'M-260 320 C-122 332 18 370 162 428 C260 468 340 436 424 487 C548 554 672 508 744 414 C801 340 771 250 850 211 C933 170 1015 224 1001 310 C985 406 858 408 861 325 C864 250 955 256 1050 205 C1128 163 1188 100 1248 44';

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 1180 620" className="absolute left-[53%] top-6 h-full w-[126vw] min-w-[980px] -translate-x-1/2 overflow-visible" aria-hidden="true">
        <defs>
          <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#10b981" floodOpacity="0.1" />
          </filter>
          <filter id="pinShadow" x="-35%" y="-25%" width="170%" height="170%">
            <feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>
        </defs>

        <path
          d={routePath}
          fill="none"
          stroke="#d8f8ea"
          strokeWidth="46"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.62"
        />
        <path
          d={routePath}
          fill="none"
          stroke="#34D399"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#routeShadow)"
        />

        <g transform="translate(439 445)" filter="url(#pinShadow)">
          <path d="M32 62s21-17 21-34a21 21 0 0 0-42 0c0 17 21 34 21 34z" fill="#ffffff" />
          <path d="M32 54s15-13 15-26a15 15 0 0 0-30 0c0 13 15 26 15 26z" fill="#34D399" />
          <circle cx="32" cy="28" r="6" fill="#ffffff" />
        </g>

        <g transform="translate(802 155)" filter="url(#pinShadow)">
          <path d="M34 64s22-18 22-36a22 22 0 0 0-44 0c0 18 22 36 22 36z" fill="#34D399" />
          <circle cx="34" cy="28" r="10" fill="#ffffff" />
        </g>

        <g transform="translate(960 282)" filter="url(#pinShadow)">
          <path d="M31 59s20-16 20-33a20 20 0 0 0-40 0c0 17 20 33 20 33z" fill="#E5E7EB" />
          <path d="M31 51s14-12 14-25a14 14 0 0 0-28 0c0 13 14 25 14 25z" fill="#ffffff" />
          <circle cx="31" cy="26" r="5.5" fill="#10B981" />
        </g>
      </svg>
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

function ArrowDownIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
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
