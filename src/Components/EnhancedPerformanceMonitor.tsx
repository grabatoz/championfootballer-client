'use client';

import { useEffect } from 'react';

// Memory Info interface for Chrome's performance.memory API
interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Extend Performance interface to include memory property
interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

// Enhanced Performance Monitor with caching and resource hints
export default function EnhancedPerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Preconnect to important origins
    const preconnectOrigins = [
      process.env.NEXT_PUBLIC_API_URL,
      'https://res.cloudinary.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ].filter(Boolean);

    preconnectOrigins.forEach((origin) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin!;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as PerformanceWithMemory).memory;
        if (memory) {
          const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          if (usedPercent > 90) {
            console.warn('⚠️ High memory usage detected:', {
              used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
              total: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
              percent: `${usedPercent.toFixed(2)}%`,
            });
          }
        }
      };

      // Check memory every 30 seconds
      const interval = setInterval(checkMemory, 30000);
      return () => clearInterval(interval);
    }

    // Log navigation timing
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            console.log('🚀 Navigation Timing:', {
              'DNS Lookup': `${perfData.domainLookupEnd - perfData.domainLookupStart}ms`,
              'TCP Connection': `${perfData.connectEnd - perfData.connectStart}ms`,
              'Request Time': `${perfData.responseStart - perfData.requestStart}ms`,
              'Response Time': `${perfData.responseEnd - perfData.responseStart}ms`,
              'DOM Processing': `${perfData.domComplete - perfData.domInteractive}ms`,
              'Load Complete': `${perfData.loadEventEnd - perfData.loadEventStart}ms`,
              'Total Time': `${perfData.loadEventEnd - perfData.fetchStart}ms`,
            });
          }
        }, 0);
      });
    }
  }, []);

  return null;
}
