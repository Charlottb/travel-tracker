/**
 * 🔧 DEBUGGING SETUP für Travel-Tracker
 * 
 * Systematisches Debugging mit Console-Output
 * um "fetch failed" zu finden
 */

// ============================================================
// 🟢 STEP 1: Environment Check
// ============================================================

console.log('═'.repeat(60));
console.log('🔍 DEBUGGING SESSION START');
console.log('═'.repeat(60));

// Check: Wo läuft der Code?
const isServer = typeof window === 'undefined';
console.log(`📍 Environment: ${isServer ? 'SERVER (page.jsx)' : 'CLIENT (Browser)'}`);

// Check: Environment Variablen
console.log('\n📋 Environment Variables:');
console.log(`   NEXT_PUBLIC_API_URL = ${process.env.NEXT_PUBLIC_API_URL || '❌ UNDEFINED'}`);
console.log(`   NEXT_PUBLIC_DEBUG_API = ${process.env.NEXT_PUBLIC_DEBUG_API || '❌ UNDEFINED'}`);

// ============================================================
// 🟢 STEP 2: Helper für die richtige URL
// ============================================================

function getApiUrl() {
  // Wichtig: Server vs Client unterscheiden!
  if (typeof window === 'undefined') {
    // SERVER-SIDE (page.jsx): Braucht absolute URL inkl. Hostname
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`   [SERVER] Using API URL: ${url}`);
    return url;
  } else {
    // CLIENT-SIDE (Browser): Braucht auch absolute URL (CORS!)
    const url = process.env.NEXT_PUBLIC_API_URL_CLIENT || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`   [CLIENT] Using API URL: ${url}`);
    return url;
  }
}

// ============================================================
// 🟢 STEP 3: Robuste Fetch Funktion mit Debugging
// ============================================================

/**
 * DEBUG FETCH - Logged alles was passiert
 * @param {string} endpoint - z.B. "/places"
 * @param {object} options - fetch options
 * @returns {Promise<any>} - geparste JSON Antwort
 */
export async function debugFetch(endpoint, options = {}) {
  const startTime = Date.now();
  const baseUrl = getApiUrl();
  const fullUrl = `${baseUrl}${endpoint}`;

  console.log('\n' + '─'.repeat(60));
  console.log(`🚀 FETCH REQUEST: ${options.method || 'GET'} ${endpoint}`);
  console.log(`   Full URL: ${fullUrl}`);
  console.log(`   Options:`, options);
  console.log('─'.repeat(60));

  try {
    // ✅ TRY 1: Fetch durchführen
    console.log('   ⏳ Sending request...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('   ⚠️  REQUEST TIMEOUT! (10s)');
      controller.abort();
    }, 10000);

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.log(`   ✅ Response received in ${elapsed}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    });

    // ✅ TRY 2: Status prüfen
    if (!response.ok) {
      console.log('   ❌ Response NOT OK (Status >= 400)');
      const text = await response.text();
      console.log(`   Response Body: ${text.slice(0, 200)}`);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    // ✅ TRY 3: JSON parsen
    console.log('   ⏳ Parsing JSON...');
    const data = await response.json();
    console.log(`   ✅ JSON parsed successfully`);
    console.log(`   Data size: ${JSON.stringify(data).length} bytes`);
    console.log(`   Data preview:`, JSON.stringify(data).slice(0, 200));

    console.log('✅ FETCH SUCCESS');
    console.log('─'.repeat(60) + '\n');

    return data;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log('\n❌ FETCH FAILED');
    console.log(`   Error Type: ${error.name}`);
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Duration: ${elapsed}ms`);
    console.log(`   Stack: ${error.stack}`);

    // ============================================================
    // 🔴 DIAGNOSTIK: Was ist die wahrscheinliche Ursache?
    // ============================================================

    console.log('\n🔍 DIAGNOSTIC:');

    if (error.message.includes('fetch')) {
      console.log('   ⚠️  Network Error! Possible causes:');
      console.log('      1. Backend läuft nicht → npm start im backend');
      console.log('      2. Falsche URL → .env.local prüfen');
      console.log('      3. Firewall blockiert → netstat -an | grep 3001');
    }

    if (error.name === 'AbortError') {
      console.log('   ⚠️  Request Timeout! Backend antwortet nicht.');
      console.log('      Mögliche Ursachen:');
      console.log('      1. Lange Datenbankquery');
      console.log('      2. Backend hängt fest');
      console.log('      3. Netzwerk zu langsam');
    }

    if (error.message.includes('JSON')) {
      console.log('   ⚠️  JSON Parse Error! Response ist kein gültiges JSON.');
      console.log('      Backend sendet möglicherweise HTML Error-Seite.');
    }

    console.log('─'.repeat(60) + '\n');
    throw error;
  }
}

// ============================================================
// 🟢 STEP 4: Export der Debug-Version
// ============================================================

export const debugApi = {
  get: (endpoint, opts) => debugFetch(endpoint, { method: 'GET', ...opts }),
  post: (endpoint, body, opts) =>
    debugFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...opts,
    }),
  delete: (endpoint, opts) => debugFetch(endpoint, { method: 'DELETE', ...opts }),
};

export default debugFetch;
