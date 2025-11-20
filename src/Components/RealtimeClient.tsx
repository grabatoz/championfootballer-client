"use client";
import { useEffect } from 'react';
import { ensureRealtime } from '@/lib/realtime';

export default function RealtimeClient() {
  useEffect(() => {
    ensureRealtime();
  }, []);
  return null;
}
