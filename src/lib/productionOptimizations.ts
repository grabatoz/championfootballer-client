// Production-specific optimizations for live deployment
// This runs only in production to reduce latency

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Service Worker for network requests (optional but recommended)
export function registerServiceWorker() {
  if (!IS_PRODUCTION || typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Service worker for caching and offline support
      navigator.serviceWorker.register('/sw.js').then(
        registration => {
          console.log('✅ ServiceWorker registered:', registration.scope);
        },
        err => {
          console.log('❌ ServiceWorker registration failed:', err);
        }
      );
    });
  }
}

// Prefetch critical API endpoints on app load
export function prefetchCriticalEndpoints() {
  if (!IS_PRODUCTION || typeof window === 'undefined') return;

  // Wait for page to be idle before prefetching
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // NOTE:
      // Do not prefetch protected API routes via <link rel="prefetch">.
      // Link prefetch cannot attach Authorization headers, which causes noisy 401s
      // for endpoints like /auth/data and /matches in production.
      const criticalEndpoints: string[] = [];

      criticalEndpoints.forEach(endpoint => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `${API_BASE_URL}${endpoint}`;
        link.as = 'fetch';
        link.crossOrigin = 'use-credentials';
        document.head.appendChild(link);
      });

      if (criticalEndpoints.length > 0) {
      console.log('🚀 Prefetched critical endpoints');
      }
    });
  }
}

// Optimize fetch for production with retry logic
export async function productionFetch(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        // Production optimizations
        credentials: 'include',
        mode: 'cors',
        keepalive: true,
      });

      // If successful, return
      if (response.ok || i === retries) {
        return response;
      }

      // If server error, retry
      if (response.status >= 500 && i < retries) {
        console.warn(`⚠️ Retry ${i + 1}/${retries} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i < retries) {
        console.warn(`⚠️ Network error, retry ${i + 1}/${retries} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('All retries failed');
}

// Measure and report real user metrics
export function setupPerformanceMonitoring() {
  if (!IS_PRODUCTION || typeof window === 'undefined') return;

  // Monitor Core Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        
        if (lcp > 2500) {
          console.warn(`⚠️ Slow LCP detected: ${lcp.toFixed(0)}ms (target: <2500ms)`);
        } else {
          console.log(`✅ Good LCP: ${lcp.toFixed(0)}ms`);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry & { processingStart?: number; startTime?: number }) => {
          const fid = entry.processingStart ? entry.processingStart - entry.startTime : 0;
          if (fid > 100) {
            console.warn(`⚠️ Slow FID detected: ${fid.toFixed(0)}ms (target: <100ms)`);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry & { value?: number }) => {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            clsScore += entry.value || 0;
          }
        });
        
        if (clsScore > 0.1) {
          console.warn(`⚠️ High CLS detected: ${clsScore.toFixed(3)} (target: <0.1)`);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (e) {
      console.warn('Performance monitoring setup failed:', e);
    }
  }

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(0)}ms`);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask not supported in all browsers
      console.debug('Long task monitoring not supported');
    }
  }
}

// Initialize all production optimizations
export function initProductionOptimizations() {
  if (!IS_PRODUCTION) return;

  console.log('🚀 Initializing production optimizations...');
  
  // 1. Setup performance monitoring
  setupPerformanceMonitoring();
  
  // 2. Prefetch critical endpoints
  prefetchCriticalEndpoints();
  
  // 3. Register service worker (optional)
  // registerServiceWorker(); // Uncomment when sw.js is ready
  
  console.log('✅ Production optimizations initialized');
}
