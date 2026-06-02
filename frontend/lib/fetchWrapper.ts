/**
 * TypeScript Version des API Client mit zusätzlicher Typsicherheit
 * Optional: Nutze diesen statt apiClient.js wenn du TypeScript bevorzugst
 */

interface ApiErrorContext {
  originalError?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public context: ApiErrorContext = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

const logger = {
  log: (label: string, data: any) => {
    if (DEBUG) console.log(`[API] ${label}:`, data);
  },
  error: (label: string, data: any) => {
    console.error(`[API ERROR] ${label}:`, data);
  },
  warn: (label: string, data: any) => {
    if (DEBUG) console.warn(`[API WARN] ${label}:`, data);
  },
};

function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL_CLIENT || 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

async function retryFetch(
  url: string,
  options: FetchOptions = {},
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`Fetch attempt ${attempt}/${maxRetries}`, url);

      const controller = new AbortController();
      const timeout = options.timeout || 10000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.log('Fetch success', `${response.status}`);
        return response;
      }

      if (response.status >= 500 || response.status === 408) {
        throw new Error(`HTTP ${response.status}: Server Error`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Fetch attempt ${attempt} failed`, lastError.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Unknown fetch error');
}

export async function apiCall<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
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

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }

      const errorMsg = errorData?.error || `HTTP ${response.status}`;
      logger.error('API responded with error', { status: response.status, error: errorMsg });

      throw new ApiError(errorMsg, `HTTP_${response.status}`, errorData);
    }

    const data = (await response.json()) as T;
    logger.log('API response parsed', { endpoint });

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Netzwerkfehler: Backend nicht erreichbar. Läuft der Server auf http://localhost:3001?',
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'Request Timeout: Backend antwortet nicht (>10s)',
        'TIMEOUT',
        { url }
      );
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new ApiError(`Unerwarteter Fehler: ${errorMsg}`, 'UNKNOWN', {
      originalError: errorMsg,
    });
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body: any, options?: FetchOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),

  put: <T = any>(endpoint: string, body: any, options?: FetchOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
