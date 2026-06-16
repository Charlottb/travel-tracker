import { authFetch } from '../lib/authFetch';
import TravelTrackerApp from '../components/TravelTrackerApp';

/**
 * ✅ RICHTIG: Server Component mit robusten Fetch
 *
 * Best Practices:
 * 1. Hier ist es SICHER zu fetchen - läuft auf dem Server
 * 2. Absolute URLs sind ZWINGEND erforderlich (getApiUrl())
 * 3. Error Boundary sollte Parent bereitstellen
 * 4. cache: 'no-store' verhindert veraltete Daten
 * 5. Timeouts sind wichtig (10s default)
 */

function getServerApiUrl() {
  // Server-side fetch muss absolute URL sein
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Debugging
  if (process.env.NEXT_PUBLIC_DEBUG_API === 'true') {
    console.log('[Server Component] API URL:', baseUrl);
  }
  
  return baseUrl;
}

async function getPlaces() {
  const apiUrl = getServerApiUrl();
  const fetchUrl = `${apiUrl}/places`;

  try {
    console.log('[page.jsx] Fetching places from:', fetchUrl);

    const response = await authFetch(fetchUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // ⚠️ WICHTIG: Keine Cache-Probleme
      next: { revalidate: 60 }, // Optional: ISR nach 60s
    });

    // ❌ Häufiger Fehler: Nur ok prüfen, nicht Status
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[page.jsx] API Error ${response.status}:`, errorText);
      throw new Error(`API ${response.status}: ${errorText.slice(0, 100)}`);
    }

    const places = await response.json();
    console.log('[page.jsx] Places loaded successfully:', places.length);
    
    return places;
  } catch (error) {
    // ⚠️ Server-seitige Fehler sollten geloggt werden
    console.error('[page.jsx] Failed to fetch places:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Fehler an Client weitergeben oder Fallback nutzen
    throw error;
  }
}

export default async function HomePage() {
  try {
    const places = await getPlaces();

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <TravelTrackerApp initialPlaces={places} />
        </div>
      </main>
    );
  } catch (error) {
    // Error Boundary wird vom Parent gehandelt
    // Aber wir können hier einen Fallback zeigen
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-900">❌ Fehler beim Laden</h1>
            <p className="mt-2 text-red-800">
              Backend nicht erreichbar. Läuft der Server auf http://localhost:3001?
            </p>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer">Fehlerdetails</summary>
              <pre className="mt-2 overflow-auto rounded bg-red-100 p-2">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </details>
          </div>
        </div>
      </main>
    );
  }
}
