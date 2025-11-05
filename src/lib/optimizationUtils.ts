// API request optimization utilities

// Debounce function to limit API calls
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function to limit API call frequency
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request deduplication - prevent duplicate simultaneous requests
const pendingRequests = new Map<string, Promise<unknown>>();

export async function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // If request is already pending, return that promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  // Create new request
  const promise = fetcher().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

// Batch multiple requests into one
export class RequestBatcher<T> {
  private batch: Array<{
    resolve: (value: T) => void;
    reject: (reason?: Error) => void;
    key: string;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;
  
  constructor(
    private batchFn: (keys: string[]) => Promise<Map<string, T>>,
    private wait: number = 50
  ) {}
  
  async request(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ resolve, reject, key });
      
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.wait);
    });
  }
  
  private async flush() {
    const batch = this.batch.splice(0);
    if (batch.length === 0) return;
    
    try {
      const keys = batch.map((item) => item.key);
      const results = await this.batchFn(keys);
      
      batch.forEach((item) => {
        const result = results.get(item.key);
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for key: ${item.key}`));
        }
      });
    } catch (error) {
      batch.forEach((item) => item.reject(error instanceof Error ? error : new Error(String(error))));
    }
  }
}

// Retry failed requests with exponential backoff
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
}

// Memoize function results
export function memoize<T extends (...args: never[]) => unknown>(
  fn: T,
  maxAge: number = 60000 // 1 minute default
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  
  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.value;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, { value: result, timestamp: Date.now() });
    
    return result;
  } as T;
}
