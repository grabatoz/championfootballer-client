'use client';

import { useEffect } from 'react';
import { clearAllCache, clearCacheByResource } from '@/lib/utils/cacheManager';
import { invalidateCache as invalidateOptimizedFetchCache } from '@/lib/utils/optimizedFetch';
import { cacheManager } from '@/lib/cacheManager';
import { clearCache as clearFastCache } from '@/lib/api-fast';
import { clearInstantCache } from '@/lib/api-ultra-fast';
import { invalidateCache as invalidateChunkedCache } from '@/lib/api-chunked';

type MutationDetail = {
  method?: string;
  url?: string;
  resourceType?: 'league' | 'match' | 'team' | 'user' | 'stats' | null;
  resourceId?: string | null;
  timestamp?: number;
};

const NO_CACHE_MODE = !['0', 'false', 'no', 'off'].includes(
  (process.env.NEXT_PUBLIC_NO_CACHE || 'true').toLowerCase()
);

function clearLocalStorageFamilies(resourceId?: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('cf_instant_cache');
    localStorage.removeItem('cf_instant_cache_chunked');
    localStorage.removeItem('leagues_cache');
    localStorage.removeItem('matches_cache');
    localStorage.removeItem('leaderboard_cache');

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (
        key.startsWith('chunk_') ||
        lower.includes('league') ||
        lower.includes('match') ||
        lower.includes('leaderboard') ||
        lower.includes('world_ranking')
      ) {
        localStorage.removeItem(key);
      }
      if (resourceId && lower.includes(String(resourceId).toLowerCase())) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // no-op
  }
}

async function clearBrowserCaches(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    // no-op
  }

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // no-op
  }
}

function invalidateEverywhere(resourceType?: MutationDetail['resourceType'], resourceId?: string | null): void {
  const patterns = ['league', 'match', 'leaderboard', 'stats', 'world-ranking'];
  clearAllCache(patterns);

  try {
    if (resourceType === 'league' || resourceType === 'match') {
      clearCacheByResource(resourceType, resourceId || undefined);
    } else {
      clearCacheByResource('league');
      clearCacheByResource('match');
    }
  } catch {
    // no-op
  }

  try { clearFastCache('league'); } catch {}
  try { clearFastCache('match'); } catch {}
  try { clearFastCache('leaderboard'); } catch {}

  try { clearInstantCache('league'); } catch {}
  try { clearInstantCache('match'); } catch {}
  try { clearInstantCache('leaderboard'); } catch {}

  try { invalidateChunkedCache('leagues'); } catch {}
  try { invalidateChunkedCache('matches'); } catch {}
  try { invalidateChunkedCache('matches_league'); } catch {}
  try { invalidateChunkedCache('players'); } catch {}

  try { invalidateOptimizedFetchCache(/\/leagues/i); } catch {}
  try { invalidateOptimizedFetchCache(/\/matches/i); } catch {}
  try { invalidateOptimizedFetchCache(/\/leaderboard/i); } catch {}
  try { invalidateOptimizedFetchCache(/\/world-ranking/i); } catch {}
  try { invalidateOptimizedFetchCache(/\/players\/.*\/stats/i); } catch {}

  try { cacheManager.clearCache('leagues_cache'); } catch {}
  try { cacheManager.clearCache('matches_cache'); } catch {}
  try { cacheManager.clearCache('leaderboard_cache'); } catch {}

  clearLocalStorageFamilies(resourceId);
}

export default function GlobalCacheSync() {
  useEffect(() => {
    if (NO_CACHE_MODE) {
      invalidateEverywhere(undefined, null);
      clearBrowserCaches().catch(() => undefined);
    }

    const onMutation = (event: Event) => {
      const detail = (event as CustomEvent<MutationDetail>).detail || {};
      invalidateEverywhere(detail.resourceType, detail.resourceId || null);
      window.dispatchEvent(new CustomEvent('cache-synced', { detail: { ...detail, syncedAt: Date.now() } }));
    };

    const onEntityEvent = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
      const leagueId = (detail.leagueId || detail.id) as string | undefined;
      const matchId = (detail.matchId || detail.id) as string | undefined;
      const type = event.type;

      if (type.startsWith('league-')) {
        invalidateEverywhere('league', leagueId || null);
      } else if (type.startsWith('match-') || type === 'match-stats-updated' || type === 'vote-updated') {
        invalidateEverywhere('match', matchId || null);
      } else {
        invalidateEverywhere(undefined, null);
      }
    };

    window.addEventListener('data-mutated', onMutation as EventListener);
    window.addEventListener('match-created', onEntityEvent as EventListener);
    window.addEventListener('match-updated', onEntityEvent as EventListener);
    window.addEventListener('match-deleted', onEntityEvent as EventListener);
    window.addEventListener('league-created', onEntityEvent as EventListener);
    window.addEventListener('league-updated', onEntityEvent as EventListener);
    window.addEventListener('league-deleted', onEntityEvent as EventListener);
    window.addEventListener('match-stats-updated', onEntityEvent as EventListener);
    window.addEventListener('vote-updated', onEntityEvent as EventListener);

    return () => {
      window.removeEventListener('data-mutated', onMutation as EventListener);
      window.removeEventListener('match-created', onEntityEvent as EventListener);
      window.removeEventListener('match-updated', onEntityEvent as EventListener);
      window.removeEventListener('match-deleted', onEntityEvent as EventListener);
      window.removeEventListener('league-created', onEntityEvent as EventListener);
      window.removeEventListener('league-updated', onEntityEvent as EventListener);
      window.removeEventListener('league-deleted', onEntityEvent as EventListener);
      window.removeEventListener('match-stats-updated', onEntityEvent as EventListener);
      window.removeEventListener('vote-updated', onEntityEvent as EventListener);
    };
  }, []);

  return null;
}
