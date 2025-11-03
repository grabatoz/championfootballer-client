'use client';

import React, { useState, useEffect } from 'react';
import { getPerformanceMetrics } from '@/lib/httpClient';

interface PerformanceStats {
  totalRequests: number;
  avgDuration: number;
  slowRequests: number;
  failedRequests: number;
  cachedRequests: number;
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    totalRequests: 0,
    avgDuration: 0,
    slowRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      const metrics = getPerformanceMetrics();
      
      if (metrics.length === 0) return;

      const totalRequests = metrics.length;
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
      const slowRequests = metrics.filter(m => m.duration > 1000).length;
      const failedRequests = metrics.filter(m => m.status >= 400).length;
      const cachedRequests = metrics.filter(m => m.cached).length;

      setStats({
        totalRequests,
        avgDuration,
        slowRequests,
        failedRequests,
        cachedRequests,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          padding: '8px 12px',
          backgroundColor: stats.avgDuration > 500 ? '#f44336' : '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        ⚡ {Math.round(stats.avgDuration)}ms
      </button>

      {/* Stats panel */}
      {isVisible && (
        <div
          style={{
            marginTop: '10px',
            padding: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '12px',
            minWidth: '250px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
            🔥 Performance Monitor
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>Total Requests: <strong>{stats.totalRequests}</strong></div>
            <div>Avg Duration: <strong style={{ color: stats.avgDuration > 500 ? '#f44336' : '#4caf50' }}>
              {Math.round(stats.avgDuration)}ms
            </strong></div>
            <div>Slow Requests (&gt;1s): <strong style={{ color: stats.slowRequests > 0 ? '#ff9800' : '#4caf50' }}>
              {stats.slowRequests}
            </strong></div>
            <div>Failed Requests: <strong style={{ color: stats.failedRequests > 0 ? '#f44336' : '#4caf50' }}>
              {stats.failedRequests}
            </strong></div>
            <div>Cached: <strong>{stats.cachedRequests}</strong></div>
          </div>
          
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #444' }}>
            <div style={{ fontSize: '10px', color: '#999' }}>
              💡 Connection pooling enabled<br/>
              🔄 Request deduplication active<br/>
              📦 Response compression enabled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
