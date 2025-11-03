'use client';

import { useEffect } from 'react';
import { initProductionOptimizations } from '@/lib/productionOptimizations';

/**
 * Production Optimizer Component
 * Initializes all production-specific optimizations
 * Only runs in production environment
 */
export default function ProductionOptimizer() {
  useEffect(() => {
    // Initialize production optimizations
    if (process.env.NODE_ENV === 'production') {
      initProductionOptimizations();
    }
  }, []);

  // This component renders nothing
  return null;
}
