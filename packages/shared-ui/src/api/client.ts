/**
 * Shared API Client Utilities
 * Common HTTP client configuration for all MFEs
 */

export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  retryStatusCodes?: number[];
  cache?: boolean;
  cacheTTL?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>();

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(attempt: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000);
}

/**
 * Check if response should be retried
 */
function shouldRetry(status: number, retryStatusCodes: number[]): boolean {
  return retryStatusCodes.includes(status) || status === 0; // 0 = network error
}

/**
 * Get cached response if valid
 */
function getCachedResponse<T>(cacheKey: string): T | null {
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(cacheKey);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cache entry
 */
function setCacheEntry<T>(cacheKey: string, data: T, ttl: number): void {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Create a configured fetch-based API client
 * Each MFE should create its own instance
 */
export function createAPIClient(config: APIClientConfig) {
  const {
    baseURL,
    timeout = 30000,
    headers = {},
    retries = 3,
    retryDelay = 1000,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    cache: enableCache = false,
    cacheTTL = 60000, // 1 minute default
  } = config;

  async function request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 0
  ): Promise<APIResponse<T>> {
    const url = `${baseURL}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${url}`;
    
    // Check cache for GET requests
    if (enableCache && options.method === 'GET') {
      const cached = getCachedResponse<APIResponse<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const apiError: APIError = {
          message: data.message || 'Request failed',
          status: response.status,
          code: data.code,
          errors: data.errors,
        };
        
        // Retry logic for specific status codes
        if (attempt < retries && shouldRetry(response.status, retryStatusCodes)) {
          const backoffDelay = calculateBackoff(attempt, retryDelay);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return request<T>(endpoint, options, attempt + 1);
        }
        
        throw apiError;
      }

      const result: APIResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
      
      // Cache successful GET requests
      if (enableCache && options.method === 'GET') {
        setCacheEntry(cacheKey, result, cacheTTL);
      }
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: APIError = {
          message: 'Request timeout',
          code: 'TIMEOUT',
          status: 408,
        };
        
        // Retry on timeout
        if (attempt < retries) {
          const backoffDelay = calculateBackoff(attempt, retryDelay);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return request<T>(endpoint, options, attempt + 1);
        }
        
        throw timeoutError;
      }
      
      // Retry on network errors
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        if (attempt < retries) {
          const backoffDelay = calculateBackoff(attempt, retryDelay);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return request<T>(endpoint, options, attempt + 1);
        }
      }
      
      throw error;
    }
  }

  return {
    get: <T = any>(endpoint: string, options?: RequestInit) =>
      request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      }),

    put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    delete: <T = any>(endpoint: string, options?: RequestInit) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
  };
}

/**
 * Token storage utilities
 */
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mfe_access_token');
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mfe_access_token', token);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mfe_refresh_token');
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mfe_refresh_token', token);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mfe_access_token');
    localStorage.removeItem('mfe_refresh_token');
  },
};

/**
 * Add auth token to requests
 */
export function withAuth(headers: Record<string, string> = {}): Record<string, string> {
  const token = tokenStorage.getAccessToken();
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers;
}
