/**
 * Performance Monitoring Utility
 * Real-time performance tracking for debugging
 */

'use client';

import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  // Navigation Timing
  dns: number;
  tcp: number;
  ttfb: number; // Time to First Byte
  download: number;
  domComplete: number;
  
  // Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Resource Timing
  resourceCount: number;
  totalResourceSize: number;
  
  // Memory (if available)
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }
    
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!navigation) return;
      
      const metrics: PerformanceMetrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domComplete: navigation.domComplete - navigation.domContentLoadedEventStart,
        resourceCount: performance.getEntriesByType('resource').length,
        totalResourceSize: performance.getEntriesByType('resource').reduce((acc, resource) => {
          return acc + ((resource as PerformanceResourceTiming).transferSize || 0);
        }, 0),
      };
      
      // Web Vitals (if available)
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
      
      // Memory info (Chrome only)
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        metrics.memory = {
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
          limit: mem.jsHeapSizeLimit,
        };
      }
      
      setMetrics(metrics);
    };
    
    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);
  
  return metrics;
}

/**
 * Performance Monitor Component
 * Shows real-time performance metrics in development
 */
export function PerformanceMonitor(): React.ReactElement | null {
  const metrics = usePerformanceMonitor();
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  if (!metrics) {
    return null;
  }
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const formatMs = (ms: number) => Math.round(ms) + 'ms';
  
  const getColor = (value: number, good: number, poor: number) => {
    if (value <= good) return '#10b981'; // green
    if (value <= poor) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };
  
  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#1f2937',
          color: 'white',
          border: '2px solid #374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
        title="Toggle Performance Monitor"
      >
        📊
      </button>
      
      {/* Metrics Panel */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '320px',
            maxHeight: '500px',
            overflow: 'auto',
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            border: '1px solid #374151',
            zIndex: 9998,
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>⚡ Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ×
            </button>
          </div>
          
          {/* Navigation Timing */}
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9ca3af' }}>Navigation</h4>
            <MetricRow label="DNS" value={formatMs(metrics.dns)} color={getColor(metrics.dns, 20, 100)} />
            <MetricRow label="TCP" value={formatMs(metrics.tcp)} color={getColor(metrics.tcp, 30, 150)} />
            <MetricRow label="TTFB" value={formatMs(metrics.ttfb)} color={getColor(metrics.ttfb, 200, 600)} />
            <MetricRow label="Download" value={formatMs(metrics.download)} color={getColor(metrics.download, 200, 500)} />
            <MetricRow label="DOM Complete" value={formatMs(metrics.domComplete)} color={getColor(metrics.domComplete, 500, 1500)} />
          </div>
          
          {/* Web Vitals */}
          {metrics.fcp && (
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9ca3af' }}>Web Vitals</h4>
              <MetricRow label="FCP" value={formatMs(metrics.fcp)} color={getColor(metrics.fcp, 1500, 2500)} />
              {metrics.lcp && <MetricRow label="LCP" value={formatMs(metrics.lcp)} color={getColor(metrics.lcp, 2500, 4000)} />}
              {metrics.fid && <MetricRow label="FID" value={formatMs(metrics.fid)} color={getColor(metrics.fid, 100, 300)} />}
              {metrics.cls !== undefined && <MetricRow label="CLS" value={metrics.cls.toFixed(3)} color={getColor(metrics.cls, 0.1, 0.25)} />}
            </div>
          )}
          
          {/* Resources */}
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9ca3af' }}>Resources</h4>
            <MetricRow label="Count" value={metrics.resourceCount.toString()} />
            <MetricRow label="Total Size" value={formatBytes(metrics.totalResourceSize)} />
          </div>
          
          {/* Memory */}
          {metrics.memory && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9ca3af' }}>Memory</h4>
              <MetricRow label="Used" value={formatBytes(metrics.memory.used)} />
              <MetricRow label="Total" value={formatBytes(metrics.memory.total)} />
              <MetricRow label="Limit" value={formatBytes(metrics.memory.limit)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ color: '#9ca3af' }}>{label}:</span>
      <span style={{ fontWeight: 'bold', color: color || '#e5e7eb' }}>{value}</span>
    </div>
  );
}

/**
 * API Performance Tracker
 * Track API call performance
 */
export class APIPerformanceTracker {
  private static requests = new Map<string, number[]>();
  
  static startTracking(url: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.requests.has(url)) {
        this.requests.set(url, []);
      }
      
      this.requests.get(url)!.push(duration);
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`[SLOW API] ${duration.toFixed(0)}ms: ${url}`);
      }
    };
  }
  
  static getStats(url?: string) {
    if (url) {
      const times = this.requests.get(url) || [];
      return this.calculateStats(times);
    }
    
    // Get stats for all requests
    const allStats = new Map<string, any>();
    for (const [url, times] of this.requests.entries()) {
      allStats.set(url, this.calculateStats(times));
    }
    return Object.fromEntries(allStats);
  }
  
  private static calculateStats(times: number[]) {
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    
    return {
      count: times.length,
      avg: Math.round(avg),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      p50: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
      p99: Math.round(sorted[Math.floor(sorted.length * 0.99)]),
    };
  }
  
  static clear() {
    this.requests.clear();
  }
}

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).perfTracker = APIPerformanceTracker;
}
