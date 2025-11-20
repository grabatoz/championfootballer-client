// Lightweight SSE client that dispatches window events used across the app
// Events: match-created, match-updated, match-deleted, league-*, notification-created

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import { clearCache } from '@/lib/api-fast';
import { invalidateCache } from '@/lib/utils/optimizedFetch';

export type RealtimeEvent = {
  type: string;
  payload: any;
  ts: number;
};

let source: EventSource | null = null;
let isConnected = false;
let reconnectTimer: number | null = null;

export function startRealtime() {
  if (typeof window === 'undefined') return;
  if (source) return; // already started

  const url = `${API_BASE_URL}/events`;
  source = new EventSource(url, { withCredentials: true });

  const dispatch = (type: string, payload: any) => {
    const ev = new CustomEvent(type, { detail: payload });
    window.dispatchEvent(ev);
  };

  const onOpen = () => {
    isConnected = true;
    // console.log('[SSE] connected');
  };
  const onError = () => {
    // console.log('[SSE] error, will retry');
    isConnected = false;
  };

  source.addEventListener('open', onOpen);
  source.addEventListener('error', onError);

  const recordLatency = (type: string, raw: any) => {
    const now = Date.now();
    const serverTs = raw?.ts || raw?.timestamp || (raw?.payload?.ts) || (raw?.payload?.updatedAt ? Date.parse(raw.payload.updatedAt) : (raw?.payload?.createdAt ? Date.parse(raw.payload.createdAt) : undefined));
    const latency = serverTs ? Math.max(0, now - serverTs) : 0;
    (window as any).__realtimeMetrics = { lastType: type, latencyMs: latency, receivedAt: now };
    const ev = new CustomEvent('realtime-latency', { detail: { type, latencyMs: latency, receivedAt: now } });
    window.dispatchEvent(ev);
  };

  const handle = (eventName: string, invalidate: (data: any) => void) => {
    source!.addEventListener(eventName, (e: MessageEvent) => {
      try {
        const raw = JSON.parse((e as any).data);
        const data = raw.payload;
        invalidate(data);
        dispatch(eventName, data);
        recordLatency(eventName, raw);
      } catch {}
    });
  };

  handle('match-created', (data) => {
    clearCache('match');
    if (data?.leagueId) clearCache(`league_${data.leagueId}`);
    invalidateCache(/\/matches/);
    invalidateCache(/\/leagues/);
  });
  handle('match-updated', (data) => {
    clearCache('match');
    if (data?.id) clearCache(`match_${data.id}`);
    if (data?.leagueId) clearCache(`league_${data.leagueId}`);
    invalidateCache(/\/matches/);
  });
  handle('match-deleted', () => {
    clearCache('match');
    invalidateCache(/\/matches/);
  });
  handle('league-created', () => {
    clearCache('league');
    invalidateCache(/\/leagues/);
  });
  handle('league-updated', (data) => {
    clearCache('league');
    if (data?.id) clearCache(`league_${data.id}`);
    invalidateCache(/\/leagues/);
  });
  handle('league-deleted', () => {
    clearCache('league');
    invalidateCache(/\/leagues/);
  });
  handle('notification-created', () => {});
  handle('vote-updated', (data) => {
    invalidateCache(/\/leaderboard/);
    if (data?.matchId) clearCache(`match_votes_${data.matchId}`);
  });
  handle('match-stats-updated', (data) => {
    if (data?.matchId) clearCache(`match_${data.matchId}`);
    if (data?.playerId && data?.matchId) clearCache(`match_stats_${data.matchId}_${data.playerId}`);
    // Correct regex for player stats endpoint pattern
    invalidateCache(/\/players\/.*\/stats/);
    invalidateCache(/\/world-ranking/);
  });

  // Cleanup on page hide/unload
  const cleanup = () => {
    if (source) {
      source.close();
      source = null;
      isConnected = false;
    }
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
  window.addEventListener('beforeunload', cleanup);
}

export function ensureRealtime() {
  if (!isConnected && !source) startRealtime();
}
