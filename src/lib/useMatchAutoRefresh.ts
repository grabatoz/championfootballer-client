import { useEffect } from 'react';
import { ensureRealtime } from './realtime';

/**
 * Hook to auto-refresh matches periodically
 * Checks every minute if any matches have completed
 * @param refreshCallback - Function to call to refresh data
 * @param intervalMs - Interval in milliseconds (default: 60000 = 1 minute)
 */
export function useMatchAutoRefresh(
  refreshCallback: () => void, 
  intervalMs: number = 60000
) {
  useEffect(() => {
    // Set up interval to check for completed matches
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-checking for completed matches...');
      refreshCallback();
    }, intervalMs);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshCallback, intervalMs]);
}

/**
 * Hook that combines manual event-driven refresh with periodic auto-refresh
 * @param refreshCallback - Function to call to refresh data
 * @param intervalMs - Interval in milliseconds for auto-refresh (default: 60000 = 1 minute)
 */
export function useCombinedMatchRefresh(
  refreshCallback: () => void,
  intervalMs: number = 60000
) {
  // Event-driven refresh (immediate when match operations occur)
  useEffect(() => {
    // Start realtime SSE and listen for server-driven updates
    ensureRealtime();

    const handleMatchEvent = () => {
      console.log('🔄 Match event detected, refreshing...');
      setTimeout(refreshCallback, 200);
    };

    window.addEventListener('match-created', handleMatchEvent);
    window.addEventListener('match-updated', handleMatchEvent);
    window.addEventListener('match-deleted', handleMatchEvent);

    return () => {
      window.removeEventListener('match-created', handleMatchEvent);
      window.removeEventListener('match-updated', handleMatchEvent);
      window.removeEventListener('match-deleted', handleMatchEvent);
    };
  }, [refreshCallback]);

  // Periodic auto-refresh (checks for completed matches) as a fallback
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-checking for completed matches...');
      refreshCallback();
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshCallback, intervalMs]);
}
