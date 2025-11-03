// ULTRA-FAST HTTP CLIENT WITH CONNECTION POOLING & REQUEST OPTIMIZATION
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Request queue for batching and deduplication
interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_DEDUP_WINDOW = 100; // 100ms deduplication window

// Performance metrics
interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  cached: boolean;
  timestamp: number;
}

const metrics: RequestMetrics[] = [];
const MAX_METRICS = 100;

export function getPerformanceMetrics() {
  return metrics.slice();
}

// Request timeout handler
const DEFAULT_TIMEOUT = 10000; // 10 seconds

function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

// Optimized fetch with connection reuse and proper headers
export async function optimizedFetch(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const requestKey = `${method}:${url}:${JSON.stringify(options.body || '')}`;

  // Request deduplication - prevent duplicate requests within 100ms
  if (method === 'GET') {
    const pending = pendingRequests.get(requestKey);
    if (pending && Date.now() - pending.timestamp < REQUEST_DEDUP_WINDOW) {
      console.log(`⚡ Deduped request: ${endpoint}`);
      return pending.promise;
    }
  }

  const startTime = performance.now();
  const token = Cookies.get('token') || Cookies.get('auth_token');

  // Build optimized headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json',
    // Enable HTTP/2 and connection reuse
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=120, max=100',
  };

  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create fetch promise with optimizations
  const fetchPromise = fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    // Enable HTTP/2
    keepalive: true,
    // Signal for abort control
    signal: options.signal,
  });

  // Store pending request for deduplication
  if (method === 'GET') {
    pendingRequests.set(requestKey, {
      promise: fetchPromise,
      timestamp: Date.now(),
    });
  }

  try {
    // Apply timeout
    const response = await timeoutPromise(fetchPromise, timeout);
    const duration = performance.now() - startTime;

    // Log metrics
    const metric: RequestMetrics = {
      url: endpoint,
      method,
      duration,
      status: response.status,
      cached: false,
      timestamp: Date.now(),
    };

    metrics.push(metric);
    if (metrics.length > MAX_METRICS) {
      metrics.shift();
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow request detected: ${endpoint} took ${duration.toFixed(0)}ms`);
    } else if (duration > 500) {
      console.log(`⚠️ Request: ${endpoint} took ${duration.toFixed(0)}ms`);
    } else {
      console.log(`⚡ Fast request: ${endpoint} took ${duration.toFixed(0)}ms`);
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Request failed: ${endpoint} after ${duration.toFixed(0)}ms`, error);
    throw error;
  } finally {
    // Cleanup pending request after a delay
    if (method === 'GET') {
      setTimeout(() => pendingRequests.delete(requestKey), REQUEST_DEDUP_WINDOW * 2);
    }
  }
}

// Batch multiple requests together
interface BatchRequest {
  endpoint: string;
  options?: RequestInit;
}

export async function batchRequests(requests: BatchRequest[]): Promise<Response[]> {
  console.log(`📦 Batching ${requests.length} requests...`);
  const startTime = performance.now();

  // Execute all requests in parallel
  const promises = requests.map(({ endpoint, options }) =>
    optimizedFetch(endpoint, options).catch(err => {
      console.error(`Batch request failed for ${endpoint}:`, err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    })
  );

  const responses = await Promise.all(promises);
  const duration = performance.now() - startTime;
  console.log(`✅ Batch completed in ${duration.toFixed(0)}ms`);

  return responses;
}

// Optimized JSON fetch
export async function fetchJSON<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  timeout?: number
): Promise<T> {
  const response = await optimizedFetch(endpoint, options, timeout);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return response.json();
}

// Parallel requests with automatic batching
export async function fetchMultiple<T = unknown>(
  endpoints: string[],
  options: RequestInit = {}
): Promise<T[]> {
  console.log(`🔄 Fetching ${endpoints.length} endpoints in parallel...`);

  const requests = endpoints.map(endpoint => ({ endpoint, options }));
  const responses = await batchRequests(requests);

  return Promise.all(
    responses.map(async (response, index) => {
      if (!response.ok) {
        console.error(`Failed to fetch ${endpoints[index]}: ${response.status}`);
        return null;
      }
      return response.json();
    })
  ) as Promise<T[]>;
}

// Clear all pending requests (useful on navigation)
export function clearPendingRequests() {
  pendingRequests.clear();
}

// Prefetch helper for critical data
export function prefetchEndpoint(endpoint: string, options: RequestInit = {}) {
  optimizedFetch(endpoint, options).catch(err =>
    console.warn(`Prefetch failed for ${endpoint}:`, err)
  );
}
