"use client";
import React, { useEffect, useState } from 'react';

interface Metric {
  type: string;
  latencyMs: number;
  receivedAt: number;
}

export default function RealtimeLatency() {
  const [metric, setMetric] = useState<Metric | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Metric;
      setMetric(detail);
    };
    window.addEventListener('realtime-latency', handler as any);
    return () => window.removeEventListener('realtime-latency', handler as any);
  }, []);

  if (!metric) return null;
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999, fontSize: 11, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 6px', borderRadius: 4 }}>
      <span>{metric.type}  {metric.latencyMs}ms</span>
    </div>
  );
}
