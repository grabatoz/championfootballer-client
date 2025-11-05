'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// Google Analytics gtag types
type GtagCommand = 'config' | 'set' | 'event' | 'consent';
type GtagConfigParams = {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  [key: string]: unknown;
};
type GtagEventParams = {
  event_category?: string;
  event_label?: string;
  value?: number;
  non_interaction?: boolean;
  [key: string]: unknown;
};

// Extend Window interface
declare global {
  interface Window {
    gtag?: (
      command: GtagCommand,
      targetId: string,
      params?: GtagConfigParams | GtagEventParams
    ) => void;
  }
}

// Web Vitals monitoring component
export default function WebVitalsMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_VITALS) return;

    // Use dynamic import to avoid bundling in development
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      // Core Web Vitals
      onCLS((metric: Metric) => {
        console.log('CLS:', metric);
        sendToAnalytics(metric);
      });

      onINP((metric: Metric) => {
        console.log('INP:', metric);
        sendToAnalytics(metric);
      });

      onLCP((metric: Metric) => {
        console.log('LCP:', metric);
        sendToAnalytics(metric);
      });

      // Additional metrics
      onFCP((metric: Metric) => {
        console.log('FCP:', metric);
        sendToAnalytics(metric);
      });

      onTTFB((metric: Metric) => {
        console.log('TTFB:', metric);
        sendToAnalytics(metric);
      });
    }).catch(() => {
      // Silently fail if web-vitals is not available
    });

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry);
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        return () => observer.disconnect();
      } catch {
        // Ignore if not supported
      }
    }
  }, []);

  return null;
}

// Helper function to send metrics to analytics
function sendToAnalytics(metric: Metric) {
  // You can replace this with your analytics service
  
  if (process.env.NEXT_PUBLIC_GA_ID && window.gtag) {
    const { name, value, id } = metric;
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
}
