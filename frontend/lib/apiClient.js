/**
 * Robuster API Client mit Error-Handling, Logging und Retry-Logik
 * Verhindelt alle typischen fetch-Fehler in Next.js
 */

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

/**
 * Logger für Development & Production
 */
const logger = {
  log: (label, data) => {
    if (DEBUG) console.log(`[API] ${label}:`, data);
  },
  error: (label, data) => {
    console.error(`[API ERROR] ${label}:`, data);
  },
  warn: (label, data) => {
    if (DEBUG) console.warn(`[API WARN] ${label}:`, data);
  },
};

/**
 * Bestimmt die richtige API Base URL basierend auf Kontext
 */
function getApiUrl() {
  // Client-side nur
  if (typeof window !== 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL_CLIENT || 'http://localhost:3001';
    logger.log('Client-side fetch', baseUrl);
    return baseUrl;
  }

  // Server-side (page.jsx, route handlers)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  logger.log('Server-side fetch', baseUrl);
  return baseUrl;
}

/**
 * Retry-Logik für flüchtige Fehler (z.B. Server-Start)
 */
async function retryFetch(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`Fetch attempt ${attempt}/${maxRetries}`, url);
      
      const response = await fetch(url, {
        timeout: 10000, // 10 Sekunden Timeout
        ...options,
      });

      // Nur bei erfolgreichen HTTP Status weitermachen
      if (response.ok) {
        logger.log('Fetch success', `${response.status}`);
        return response;
      }

      // Bei 5xx oder Timeout: Retry
      if (response.status >= 500 || response.status === 408) {
        throw new Error(`HTTP ${response.status}: Server Error`);
      }

      // 4xx Fehler: Nicht retry
      return response;
    } catch (error) {
      lastError = error;
      logger.warn(`Fetch attempt ${attempt} failed`, error.message);

      // Nicht beim letzten Versuch warten
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Hauptfunktion für API Requests
 * @param {string} endpoint - z.B. "/places"
 * @param {object} options - fetch() options
 * @returns {Promise<object>} - geparste JSON Antwort
 */
export async function apiCall(endpoint, options = {}) {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    logger.log('Starting API call', { endpoint, method: options.method || 'GET' });

    const response = await retryFetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Error-Response parsen
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: response.statusText };
      }

      const errorMsg = errorData?.error || `HTTP ${response.status}`;
      logger.error('API responded with error', { status: response.status, error: errorMsg });

      throw new ApiError(errorMsg, response.status, errorData);
    }

    // Erfolgreiche Response
    const data = await response.json();
    logger.log('API response parsed', { endpoint, dataSize: JSON.stringify(data).length });

    return data;
  } catch (error) {
    // Fehler klassifizieren
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('Network error', error.message);
      throw new ApiError(
        'Netzwerkfehler: Backend nicht erreichbar. Läuft der Server auf http://localhost:3001?',
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }

    if (error.name === 'AbortError') {
      logger.error('Request timeout', url);
      throw new ApiError(
        'Request Timeout: Backend antwortet nicht (>10s)',
        'TIMEOUT',
        { url }
      );
    }

    logger.error('Unexpected error', error.message);
    throw new ApiError(
      `Unerwarteter Fehler: ${error.message}`,
      'UNKNOWN',
      { originalError: error.message }
    );
  }
}

/**
 * Custom API Error Klasse mit besseren Infos
 */
export class ApiError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.context = context;
  }
}

/**
 * Convenience-Methoden
 */
export const api = {
  get: (endpoint, options) => apiCall(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options) =>
    apiCall(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delete: (endpoint, options) => apiCall(endpoint, { ...options, method: 'DELETE' }),

  put: (endpoint, body, options) =>
    apiCall(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
