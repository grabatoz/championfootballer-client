'use client';

import { useEffect } from 'react';

/**
 * Hook to listen for match-created events and trigger a refresh
 * Use this in components that display match lists
 */
export function useMatchRefresh(onRefresh: () => void) {
  useEffect(() => {
    const handleMatchCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Match created event received:', customEvent.detail);
      
      // Trigger refresh after a small delay to ensure server cache is updated
      setTimeout(() => {
        console.log('🔄 Refreshing match list...');
        onRefresh();
      }, 500);
    };

    // Listen for match-created event
    window.addEventListener('match-created', handleMatchCreated);

    // Cleanup
    return () => {
      window.removeEventListener('match-created', handleMatchCreated);
    };
  }, [onRefresh]);
}

/**
 * Hook to listen for match updates/deletes and trigger a refresh
 */
export function useMatchUpdateRefresh(onRefresh: () => void) {
  useEffect(() => {
    const handleMatchUpdated = () => {
      console.log('🔄 Match updated event received');
      setTimeout(() => {
        console.log('🔄 Refreshing match list...');
        onRefresh();
      }, 500);
    };

    const handleMatchDeleted = () => {
      console.log('🔄 Match deleted event received');
      setTimeout(() => {
        console.log('🔄 Refreshing match list...');
        onRefresh();
      }, 500);
    };

    window.addEventListener('match-updated', handleMatchUpdated);
    window.addEventListener('match-deleted', handleMatchDeleted);

    return () => {
      window.removeEventListener('match-updated', handleMatchUpdated);
      window.removeEventListener('match-deleted', handleMatchDeleted);
    };
  }, [onRefresh]);
}
