'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog, DialogTitle, DialogContent,
  TextField, List, ListItemButton,
  CircularProgress,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlagIcon from '@mui/icons-material/Flag';
import Pitch from '@/Components/images/pitch.jpg';
import Shirt from '@/Components/images/viewteamhome.png';
import Shirtaway from '@/Components/images/viewteamaway.png';
import FootballIcon from '@/Components/images/football.png';
import TableViewImg from '@/Components/images/table.png';
import PitchViewImg from '@/Components/images/footblgrond.png';
import BulbImg from '@/Components/images/bulb.png';
import UndoImg from '@/Components/images/undo.png';
import { useAuth } from '@/lib/hooks';

// Define the expected shape from useAuth
type AuthUser = {
  id?: string | number;
  userId?: string | number;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  role?: string | null;
};
type UseAuthResult = {
  token?: string | null;
  user?: AuthUser | null;
};

function debounce<A extends unknown[], R>(fn: (...args: A) => R, wait: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t !== null) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Add this helper so references to normalizeTeam compile
function normalizeTeam(v: unknown): 'home' | 'away' {
  const s = String(v ?? '').trim().toLowerCase();
  if (s.includes('away')) return 'away';
  if (s.includes('home')) return 'home';
  return 'home';
}

function isPublishedResultStatus(v: unknown): boolean {
  const s = String(v ?? '').trim().toUpperCase();
  const set = new Set([
    'RESULT_PUBLISHED',
    'RESULT_UPLOADED',
    'RESULT_CONFIRMED',
    'RESULT_APPROVED',
    'RESULT_FINAL',
    'RESULT_COMPLETED',
    'COMPLETED',
    'FINISHED',
    'ENDED'
  ]);
  if (set.has(s)) return true;
  return s.includes('RESULT') || s.includes('CONFIRM') || s.includes('COMPLETE') || s.includes('FINISH');
}

type Player = {
  id?: string;
  name: string;
  number: string;
  position: 'GK' | 'DF' | 'MD' | 'FW';
  isCaptain?: boolean;
  xp?: number;
};

// API types (minimal)
type ApiPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  shirtNumber?: string | null;
  positionType?: string | null;
  role?: 'GK' | 'DF' | 'MD' | 'FW';
  xp?: number | null; // per-match XP from team-view
};

type Guest = {
  id: string;
  team: 'home' | 'away';
  firstName: string;
  lastName: string;
  shirtNumber?: string | null;
};
type TeamPositions = Record<string, { x: number; y: number }>;

type TeamViewPayload = {
  success: boolean;
  match?: {
    homeTeamName: string;
    awayTeamName: string;
    status?: string; // RESULT_PUBLISHED | ...
    homeCaptainId?: string;
    awayCaptainId?: string;
    homeTeamGoals?: number | null;
    awayTeamGoals?: number | null;
    homeTeam: ApiPlayer[];
    awayTeam: ApiPlayer[];
    guests?: Guest[];
    positions?: { home?: TeamPositions; away?: TeamPositions }; // server-saved positions
    removed?: { home?: string[]; away?: string[] }; // NEW
    duration?: number | string | null;
    durationMinutes?: number | string | null;
    duration_minutes?: number | string | null;
    matchDuration?: number | string | null;
    lengthMinutes?: number | string | null;
    length?: number | string | null;
    startedAt?: string | null;
    startTime?: string | null;
    matchStartTime?: string | null;
    kickoffTime?: string | null;
    endedAt?: string | null;
    endTime?: string | null;
    matchEndTime?: string | null;
    finishTime?: string | null;
    completedAt?: string | null;
  };
};

function clonePositions(input: TeamPositions): TeamPositions {
  const next: TeamPositions = {};
  Object.entries(input || {}).forEach(([k, v]) => {
    next[String(k)] = { x: Number(v?.x ?? 0), y: Number(v?.y ?? 0) };
  });
  return next;
}

function normalizeGuestsForMatch(
  rawGuests?: Guest[],
  positions?: { home?: TeamPositions; away?: TeamPositions }
): Guest[] {
  const homePosIds = new Set(Object.keys(positions?.home || {}).map(String));
  const awayPosIds = new Set(Object.keys(positions?.away || {}).map(String));
  const dedup = new Map<string, Guest>();

  (rawGuests || []).forEach((g) => {
    const gid = String(g?.id ?? '').trim();
    if (!gid) return;

    let team = normalizeTeam(g?.team);
    if (homePosIds.has(gid)) team = 'home';
    if (awayPosIds.has(gid)) team = 'away';

    dedup.set(gid, {
      id: gid,
      team,
      firstName: String(g?.firstName ?? '').trim() || 'Guest',
      lastName: String(g?.lastName ?? '').trim(),
      shirtNumber: g?.shirtNumber ?? null
    });
  });

  return Array.from(dedup.values());
}

type BasicUser = { id: string; firstName: string; lastName?: string; shirtNumber?: string | null }; // added

const primaryColor = 'rgb(229,106,22)';
const primaryColor2 = 'rgb(207,35,38)';
const awayTeamColor = 'rgb(3,136,227)'; // Blue color for away team
// const awayTeamColor2 = 'rgb(13, 71, 161)'; // Darker blue
const textColor = '#111';

// Default fallback demo players (keep if you want preview only)
// const demoHome: Player[] = [
//   { name: 'Xavi', number: '01', position: 'GK' },
//   { name: 'John', number: '03', position: 'DF' },
//   { name: 'Didi', number: '02', position: 'DF' },
//   { name: 'Vava', number: '05', position: 'MD' },
//   { name: 'Pele', number: '04', position: 'MD', isCaptain: true },
//   { name: 'Kaka', number: '06', position: 'MD' },
//   { name: 'Gerd', number: '09', position: 'FW' },
//   { name: 'Eric', number: '07', position: 'FW' },
//   { name: 'Dean', number: '08', position: 'FW' },
//   { name: 'Sad', number: '10', position: 'FW' },
//   { name: 'Viv', number: '12', position: 'FW' },
//   { name: 'Mia', number: '11', position: 'FW' }
// ];

// const demoAway: Player[] = [
//   { name: 'Casillas', number: '01', position: 'GK' },
//   { name: 'Ramos', number: '03', position: 'DF' },
//   { name: 'Puyol', number: '02', position: 'DF' },
//   { name: 'Modric', number: '05', position: 'MD' },
//   { name: 'Zidane', number: '04', position: 'MD', isCaptain: true },
//   { name: 'Ronaldinho', number: '06', position: 'MD' },
//   { name: 'Henry', number: '09', position: 'FW' },
//   { name: 'Rooney', number: '07', position: 'FW' },
//   { name: 'Ronaldo', number: '08', position: 'FW' },
//   { name: 'Beckham', number: '10', position: 'FW' },
//   { name: 'Messi', number: '12', position: 'FW' },
//   { name: 'Neymar', number: '11', position: 'FW' }
// ];

function normalizeRole(input?: string | null): 'GK' | 'DF' | 'MD' | 'FW' {
  const v = (input || '').toLowerCase();
  if (v === 'gk' || v.includes('goal')) return 'GK';
  if (v === 'df' || v.includes('def')) return 'DF';
  if (v === 'md' || v === 'mf' || v.includes('mid')) return 'MD';
  if (v === 'fw' || v === 'st' || v.includes('forw') || v.includes('strik')) return 'FW';
  return 'MD';
}

// Auto-formation roles by team size (matches API logic)
// Return [] when there are no players
function targetRolesBySize(n: number): Array<'GK'|'DF'|'MD'|'FW'> {
  if (n <= 0) return [];
  if (n < 5) { const r: Array<'GK'|'DF'|'MD'|'FW'> = ['GK']; for (let i = 1; i < n; i++) r.push('DF'); return r; }
  if (n === 5) return ['GK','DF','DF','FW','FW'];
  if (n === 6) return ['GK','DF','DF','DF','FW','FW'];
  if (n === 7) return ['GK','DF','DF','DF','FW','FW','FW'];
  const arr: Array<'GK'|'DF'|'MD'|'FW'> = ['GK','DF','DF','DF'];
  for (let i = arr.length; i < n; i++) arr.push('FW');
  return arr;
}

// Reorder incoming API players to match target roles
function arrangePlayers(list: ApiPlayer[], captainId?: string): Player[] {
  if (!Array.isArray(list) || list.length === 0) return [];
  const buckets: Record<'GK'|'DF'|'MD'|'FW', ApiPlayer[]> = { GK: [], DF: [], MD: [], FW: [] };
  list.forEach(p => buckets[normalizeRole(p.role || p.positionType)].push(p));

  const take = (role: 'GK'|'DF'|'MD'|'FW') => (buckets[role].length ? buckets[role].shift()! : undefined);
  const takeAny = () => {
    for (const r of ['DF','MD','FW','GK'] as const) if (buckets[r].length) return buckets[r].shift()!;
    return undefined;
  };

  const targets = targetRolesBySize(list.length);
  const ordered: ApiPlayer[] = [];
  for (const role of targets) {
    const picked = take(role) || takeAny();
    if (picked) ordered.push(picked);
  }
  (['GK','DF','MD','FW'] as const).forEach(r => { while (buckets[r].length) ordered.push(buckets[r].shift()!); });

  return ordered.map(p => mapApiToPlayer(p, captainId));
}

function mapApiToPlayer(u: ApiPlayer, captainId?: string): Player {
  const cid = (captainId || '').trim();
  const isCaptain = cid !== '' && String(u.id) === cid;
  return {
    id: String(u.id),
    name: `${u.firstName} ${u.lastName}`.trim(),
    number: (u.shirtNumber || '00').toString().padStart(2, '0'),
    position: normalizeRole(u.role || u.positionType),
    isCaptain,
    xp: typeof u.xp === 'number' ? u.xp : undefined
  };
}

function toMinuteValue(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.floor(v);
  if (typeof v === 'string') {
    const n = Number(v.trim());
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return null;
}

function pickFirstMinute(record: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = toMinuteValue(record[k]);
    if (n !== null) return n;
  }
  return null;
}

function pickFirstIso(record: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === 'string' && v.trim()) {
      const ms = Date.parse(v);
      if (!Number.isNaN(ms)) return v;
    }
  }
  return null;
}

export default function TeamPreviewScreen({ leagueId, matchId }: { leagueId?: string; matchId?: string }) {
  const { token, user }: UseAuthResult = useAuth();

  const [matchNumber, setMatchNumber] = React.useState<number | null>(null);
  const [insightsLoading, setInsightsLoading] = React.useState(false);
  const [teamInsights, setTeamInsights] = React.useState<{
    homeStrength: number;
    awayStrength: number;
    matchupPct: number;              // home team %
    predicted: 'home' | 'away' | 'draw';
    predictedScore: string;
  } | null>(null);
  const [predictionReason, setPredictionReason] = React.useState<string | null>(null);

  // Start with empty lists; fill with API data when loaded
  const [homeTeamName, setHomeTeamName] = React.useState<string>('Home');
  const [awayTeamName, setAwayTeamName] = React.useState<string>('Away');
  const [viewMode, setViewMode] = React.useState<'pitch' | 'table'>('pitch');
  const [homePlayers, setHomePlayers] = React.useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = React.useState<Player[]>([]);
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [matchStatus, setMatchStatus] = React.useState<string | undefined>(undefined);
  const [homeTeamGoals, setHomeTeamGoals] = React.useState<number | null>(null);
  const [awayTeamGoals, setAwayTeamGoals] = React.useState<number | null>(null);
  const [matchTiming, setMatchTiming] = React.useState<{
    durationMinutes: number | null;
    startIso: string | null;
    endIso: string | null;
  }>({ durationMinutes: null, startIso: null, endIso: null });
  const [dataLoaded, setDataLoaded] = React.useState(false);

  // Removed tracking from server
  const [removed, setRemoved] = React.useState<{ home: string[]; away: string[] }>({ home: [], away: [] });

  // current user / league admin
  const meId: string = String(user?.id || user?.userId || '');
  // REMOVE any role-based "admin" usage and use league admin instead
  // const isAdmin: boolean = Boolean(user?.isAdmin || user?.role === 'admin');
  const [isLeagueAdmin, setIsLeagueAdmin] = React.useState<boolean>(false);
  const [nowMs, setNowMs] = React.useState<number>(Date.now());

  // Remove the toggle - we'll show both teams
  // const [isHomeTeam, setIsHomeTeam] = React.useState(true);
  // const teamTitle = isHomeTeam ? homeTeamName : awayTeamName;

  // Captains and saved positions
  const [homeCaptainId, setHomeCaptainId] = React.useState<string | undefined>(undefined);
  const [awayCaptainId, setAwayCaptainId] = React.useState<string | undefined>(undefined);
  const [homePos, setHomePos] = React.useState<TeamPositions>({});
  const [awayPos, setAwayPos] = React.useState<TeamPositions>({});
  const [undoStack, setUndoStack] = React.useState<Array<{ home: TeamPositions; away: TeamPositions }>>([]);
  // live refs
  const homePosRef = React.useRef<TeamPositions>({});
  const awayPosRef = React.useRef<TeamPositions>({});
  const isDraggingRef = React.useRef(false);
  React.useEffect(() => { homePosRef.current = homePos; }, [homePos]);
  React.useEffect(() => { awayPosRef.current = awayPos; }, [awayPos]);

  const pitchRef = React.useRef<HTMLDivElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [pitchW, setPitchW] = React.useState(850);
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPitchW(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setPitchW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [viewMode]);
  // Track natural size of the pitch image to compute drawn bounds when using background-size: contain
  const pitchImgSizeRef = React.useRef<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    const img: HTMLImageElement = new Image();
    img.src = Pitch.src;
    const onload = () => {
      const w = img.naturalWidth || img.width || 1;
      const h = img.naturalHeight || img.height || 1;
      pitchImgSizeRef.current = { w, h };
    };
    if (img.complete) onload(); else img.onload = onload;
    return () => { img.onload = null; };
  }, []);

  // Given the container rect, return normalized [0..1] bounds of the drawn pitch image inside it
  const getPitchBoundsNorm = React.useCallback((rect: DOMRect) => {
    const nat = pitchImgSizeRef.current;
    if (!nat || rect.width === 0 || rect.height === 0) return { left: 0, top: 0, right: 1, bottom: 1 };
    const containerAspect = rect.width / rect.height;
    const imageAspect = nat.w / nat.h;
    let drawW = rect.width, drawH = rect.height, offX = 0, offY = 0;
    if (containerAspect > imageAspect) {
      // limited by height
      drawH = rect.height;
      drawW = drawH * imageAspect;
      offX = (rect.width - drawW) / 2;
    } else {
      // limited by width
      drawW = rect.width;
      drawH = drawW / imageAspect;
      offY = (rect.height - drawH) / 2;
    }
    return {
      left: offX / rect.width,
      right: (offX + drawW) / rect.width,
      top: offY / rect.height,
      bottom: (offY + drawH) / rect.height
    };
  }, []);

  // const isCaptain = React.useMemo(() => {
  //   return isHomeTeam ? (meId && meId === homeCaptainId) : (meId && meId === awayCaptainId);
  // }, [meId, isHomeTeam, homeCaptainId, awayCaptainId]);

  // team-side specific drag permission (league admin or captain)
  const canDragTeam = React.useCallback((t: 'home'|'away') => {
    if (isLeagueAdmin) return true;
    if (!meId) return false;
    const homeCap = String(homeCaptainId || '');
    const awayCap = String(awayCaptainId || '');
    return t === 'home' ? meId === homeCap : meId === awayCap;
  }, [isLeagueAdmin, meId, homeCaptainId, awayCaptainId]);

  const canEditAnyFormation = React.useMemo(() => {
    if (isLeagueAdmin) return true;
    if (!meId) return false;
    return String(homeCaptainId || '') === meId || String(awayCaptainId || '') === meId;
  }, [isLeagueAdmin, homeCaptainId, awayCaptainId, meId]);

  const syncMatchTimingFromMatch = React.useCallback((m?: TeamViewPayload['match']) => {
    if (!m) return;
    const rec = m as unknown as Record<string, unknown>;
    const durationMinutes = pickFirstMinute(rec, ['duration', 'durationMinutes', 'duration_minutes', 'matchDuration', 'lengthMinutes', 'length']);
    const startIso = pickFirstIso(rec, ['startedAt', 'startTime', 'matchStartTime', 'kickoffTime']);
    const endIso = pickFirstIso(rec, ['endedAt', 'endTime', 'matchEndTime', 'finishTime', 'completedAt']);
    setMatchTiming({ durationMinutes, startIso, endIso });
  }, []);

  const isLiveMatch = React.useMemo(() => {
    const s = String(matchStatus || '').toUpperCase();
    return s === 'LIVE' || s === 'IN_PROGRESS' || s === 'STARTED';
  }, [matchStatus]);
  const hasPublishedResult = React.useMemo(() => isPublishedResultStatus(matchStatus), [matchStatus]);

  const pushUndoSnapshot = React.useCallback(() => {
    setUndoStack((prev) => {
      const next = [
        ...prev,
        {
          home: clonePositions(homePosRef.current),
          away: clonePositions(awayPosRef.current),
        }
      ];
      return next.slice(-30);
    });
  }, []);

  React.useEffect(() => {
    if (!isLiveMatch || !matchTiming.startIso || !!matchTiming.endIso || matchTiming.durationMinutes !== null) return;
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, [isLiveMatch, matchTiming.startIso, matchTiming.endIso, matchTiming.durationMinutes]);

  const playedMinutes = React.useMemo(() => {
    if (matchTiming.durationMinutes !== null) return matchTiming.durationMinutes;
    if (!matchTiming.startIso) return null;
    const startMs = Date.parse(matchTiming.startIso);
    if (Number.isNaN(startMs)) return null;
    const endMs = matchTiming.endIso ? Date.parse(matchTiming.endIso) : (isLiveMatch ? nowMs : NaN);
    if (Number.isNaN(endMs) || endMs < startMs) return null;
    return Math.floor((endMs - startMs) / 60000);
  }, [matchTiming.durationMinutes, matchTiming.startIso, matchTiming.endIso, isLiveMatch, nowMs]);

  const matchDurationLabel = playedMinutes !== null ? `${playedMinutes} minutes match` : '-- minutes match';

  // Auto layout by roles and team size
  // VERTICAL layout: Home = top half (y: 0-0.5), Away = bottom half (y: 0.5-1.0)
  // X axis = horizontal position on pitch (0=left, 1=right)
  // On small screens, CSS rotation makes this appear horizontal (Home=left, Away=right)
  const autoLayout = React.useCallback((players: Player[], teamSide: 'home'|'away'): TeamPositions => {
    const isHome = teamSide === 'home';
    const keyOf = (p: Player) => String(p.id || p.name);

    const by = (role: Player['position']) => players.filter(p => p.position === role);
    const gk = by('GK'), df = by('DF'), md = by('MD'), fw = by('FW');

    // Place a row of players at a given y, spread evenly along x
    const placeRow = (list: Player[], y: number) => {
      const m: TeamPositions = {};
      const count = Math.max(1, list.length);
      list.forEach((p, i) => {
        const x = (i + 1) / (count + 1);
        m[keyOf(p)] = { x, y };
      });
      return m;
    };

    // Home team: top half (y: 0 to 0.5) — GK near top, FW near center
    // Away team: bottom half (y: 0.5 to 1.0) — GK near bottom, FW near center
    const yGK = isHome ? 0.05 : 0.95;
    const yDF = isHome ? 0.16 : 0.84;
    const yMD = isHome ? 0.28 : 0.72;
    const yFW = isHome ? 0.40 : 0.60;

    return { ...placeRow(gk, yGK), ...placeRow(df, yDF), ...placeRow(md, yMD), ...placeRow(fw, yFW) };
  }, []);

  // Debounced save to API
  const savePositions = React.useMemo(
    () => debounce(async (teamSide: 'home'|'away', positions: TeamPositions) => {
      if (!leagueId || !matchId || !token) return;
      console.log(`[Debounced Save] Saving ${teamSide} positions:`, JSON.stringify(positions));
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/layout`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ team: teamSide, positions })
        });
        const responseData = await res.json();
        if (!res.ok) {
          console.warn(`[Debounced Save] âœ— Failed (${res.status}):`, responseData);
        } else {
          console.log(`[Debounced Save] âœ“ Success for ${teamSide}:`, responseData);
        }
      } catch (e) { console.warn('[Debounced Save] âœ— Error:', e); }
    }, 600),
    [leagueId, matchId, token]
  );

  // Immediate save (called on drag end) — read from STATE via functional set to guarantee latest positions
  const savePositionsNow = React.useCallback(async (teamSide: 'home'|'away') => {
    if (!leagueId || !matchId || !token) return;
    // Read latest positions directly from the ref (synced via useEffect)
    const positions = teamSide === 'home' ? { ...homePosRef.current } : { ...awayPosRef.current };
    console.log(`[Immediate Save] Saving ${teamSide} positions:`, JSON.stringify(positions));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/layout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team: teamSide, positions })
      });
      const responseData = await res.json();
      if (!res.ok) {
        console.warn(`[Immediate Save] âœ— Failed (${res.status}):`, responseData);
      } else {
        console.log(`[Immediate Save] âœ“ Success for ${teamSide}:`, responseData);
      }
    } catch (e) { console.warn('[Immediate Save] âœ— Error:', e); }
  }, [leagueId, matchId, token]);

  // Load data + saved positions (+ removed)
  React.useEffect(() => {
    let active = true;
    const fetchTeams = async () => {
      if (!leagueId || !matchId || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/team-view`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const payload: TeamViewPayload = await res.json();
        if (!active || !payload?.success || !payload.match) return;

        const m = payload.match;
        const home = arrangePlayers(m.homeTeam || [], m.homeCaptainId);
        const away = arrangePlayers(m.awayTeam || [], m.awayCaptainId);

        setHomePlayers(home);
        setAwayPlayers(away);
        setHomeTeamName(m.homeTeamName || 'Home');
        setAwayTeamName(m.awayTeamName || 'Away');
        setGuests(normalizeGuestsForMatch(m.guests, m.positions));
        setMatchStatus(m.status);
        setHomeTeamGoals(m.homeTeamGoals ?? null);
        setAwayTeamGoals(m.awayTeamGoals ?? null);
        setHomeCaptainId(m.homeCaptainId ? String(m.homeCaptainId) : undefined);
        setAwayCaptainId(m.awayCaptainId ? String(m.awayCaptainId) : undefined);
        syncMatchTimingFromMatch(m);

        setRemoved({
          home: (m.removed?.home || []).map(String),
          away: (m.removed?.away || []).map(String),
        });

        // Load saved positions from server
        const serverHome = m.positions?.home || {};
        const serverAway = m.positions?.away || {};
        
        console.log('[Team View Load] Server home positions:', JSON.stringify(serverHome));
        console.log('[Team View Load] Server away positions:', JSON.stringify(serverAway));
        console.log('[Team View Load] Home players count:', home.length);
        console.log('[Team View Load] Away players count:', away.length);
        
        // ALWAYS use server positions if they exist (even if empty object)
        // Only generate auto layout if server explicitly returns no positions data
        const hasHomePositions = Object.keys(serverHome).length > 0;
        const hasAwayPositions = Object.keys(serverAway).length > 0;
        
        if (hasHomePositions) {
          console.log('[Team View Load] âœ“ Using saved home positions');
          setHomePos(serverHome);
        } else {
          console.log('[Team View Load] âœ— Using auto layout for home (no saved positions)');
          setHomePos(autoLayout(home, 'home'));
        }
        
        if (hasAwayPositions) {
          console.log('[Team View Load] âœ“ Using saved away positions');
          setAwayPos(serverAway);
        } else {
          console.log('[Team View Load] âœ— Using auto layout for away (no saved positions)');
          setAwayPos(autoLayout(away, 'away'));
        }
      } catch (e) {
        console.warn('team-view load failed', e);
        // keep players empty instead of showing demo
        // const isHorizontal = window.innerWidth >= 900;
        setHomePos(prev => (Object.keys(prev).length ? prev : autoLayout(homePlayers, 'home')));
        setAwayPos(prev => (Object.keys(prev).length ? prev : autoLayout(awayPlayers, 'away')));
      } finally {
        if (active) setDataLoaded(true);
      }
    };
    fetchTeams();
    return () => { active = false; };
  }, [leagueId, matchId, token, autoLayout, syncMatchTimingFromMatch]);

  // Read-only clients poll latest formation so all league players can see live updates.
  React.useEffect(() => {
    if (!leagueId || !matchId || !token || !dataLoaded || canEditAnyFormation) return;
    let active = true;

    const pullLatestLayout = async () => {
      if (!active || isDraggingRef.current) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/team-view`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const payload: TeamViewPayload = await res.json();
        if (!active || !payload?.success || !payload.match) return;

        const m = payload.match;
        const nextHome = m.positions?.home || {};
        const nextAway = m.positions?.away || {};

        if (Object.keys(nextHome).length > 0) {
          homePosRef.current = nextHome;
          setHomePos(nextHome);
        }
        if (Object.keys(nextAway).length > 0) {
          awayPosRef.current = nextAway;
          setAwayPos(nextAway);
        }

        setGuests(normalizeGuestsForMatch(m.guests, m.positions));
        setMatchStatus(m.status);
        setHomeTeamGoals(m.homeTeamGoals ?? null);
        setAwayTeamGoals(m.awayTeamGoals ?? null);
      } catch {
        // ignore polling errors
      }
    };

    const id = setInterval(pullLatestLayout, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [leagueId, matchId, token, dataLoaded, canEditAnyFormation]);

  // Fetch league data once â€” admin check + match index
  React.useEffect(() => {
    if (!leagueId || !token || !meId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        // Admin check â€” server returns isAdmin boolean directly
        if (!cancelled) setIsLeagueAdmin(data?.league?.isAdmin === true);

        // Match index
        const matches: Array<{ id?: string | number }> =
          data?.league?.matches ?? data?.matches ?? [];
        if (!cancelled) {
          if (Array.isArray(matches) && matches.length && matchId) {
            const idx = matches.findIndex(m => String(m?.id ?? '') === String(matchId));
            setMatchNumber(idx >= 0 ? idx + 1 : null);
          } else {
            setMatchNumber(null);
          }
        }
      } catch {
        if (!cancelled) setMatchNumber(null);
      }
    })();
    return () => { cancelled = true; };
  }, [leagueId, matchId, token, meId]);

  // NEW: compute team matchup from players' past stats (quick-view per player)
  React.useEffect(() => {
    if (!matchId || !token) return;
    let cancelled = false;
    (async () => {
      // Clear previous match insight so stale percentage doesn't appear on next match.
      setTeamInsights(null);
      setPredictionReason(null);
      setInsightsLoading(true);
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/prediction`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const j = await r.json();
        if (process.env.NODE_ENV !== 'production') {
          console.log('[TeamBalance] prediction response', {
            matchId,
            ok: r.ok,
            success: j?.success,
            available: j?.available,
            matchupPct: j?.matchupPct,
            reason: j?.reason,
          });
        }
        if (cancelled) return;
        if (r.ok && j?.success) {
          if (typeof j.matchNumber === 'number') setMatchNumber(j.matchNumber);
          if (j.available) {
            const rawPct = Number(j?.matchupPct);
            const safePct = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, rawPct)) : 0;
            setTeamInsights({
              homeStrength: Number(j?.home?.average ?? 0),
              awayStrength: Number(j?.away?.average ?? 0),
              matchupPct: safePct,
              predicted: (j?.predicted as 'home'|'away'|'draw') || 'draw',
              predictedScore: String(j?.predictedScore ?? 'â€”'),
            });
            setPredictionReason(null);
          } else {
            setTeamInsights(null);
            setPredictionReason(String(j?.reason || 'UNAVAILABLE'));
          }
        } else {
          setTeamInsights(null);
          setPredictionReason('ERROR');
        }
      } catch {
        if (!cancelled) {
          setTeamInsights(null);
          setPredictionReason('ERROR');
        }
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, token, leagueId]);

  // Build removed sets from server state
  const removedHomeSet = useMemo(
    () => new Set((removed.home || []).map(String)),
    [removed.home]
  );
  const removedAwaySet = useMemo(
    () => new Set((removed.away || []).map(String)),
    [removed.away]
  );

  const isCaptainOf = (t: 'home'|'away') => {
    const cap = t === 'home' ? String(homeCaptainId || '') : String(awayCaptainId || '');
    return cap !== '' && cap === meId;
  };

  // clamp helpers (0..1 pitch coordinates)
  const clamp01 = (n: number) => Math.max(0, Math.min(1, Number(n) || 0));
  // const normalizeX = (x: number) => clamp01(x);
  // const normalizeY = (y: number) => clamp01(y);

  // Event shape for pointer coords
  type HasClientXY = { clientX: number; clientY: number };

  // Track screen size — on big screens, pitch is rotated 90deg to show horizontally
  const [isRotated, setIsRotated] = React.useState(() => window.innerWidth >= 900);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsRotated(window.innerWidth >= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer drag within pitch bounds and team half
  const onDrag = (e: HasClientXY, pid: string, teamSide: 'home'|'away') => {
    if (!canDragTeam(teamSide) || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();

    // Coordinates stored in VERTICAL orientation (Home=top, Away=bottom)
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    let x: number, y: number;

    if (isRotated) {
      // Desktop: pitch is rotated 90deg counter-clockwise via CSS
      // Convert screen coords back to original vertical coords
      x = clamp01(1 - mouseY);
      y = clamp01(mouseX);
    } else {
      // Mobile: pitch in vertical orientation, no rotation
      x = clamp01(mouseX);
      y = clamp01(mouseY);
    }

    // Keep the icon inside pitch bounds.
    // Image uses objectFit:fill so it covers 100% of the CSS box.
    // Margins are in normalized portrait space (portrait CSS: ~340px wide, ~900px tall).
    const margin = 0.04;

    x = Math.max(margin, Math.min(1 - margin, x));
    y = Math.max(margin, Math.min(1 - margin, y));

    // Enforce formation to each team's own half only.
    const centerGap = 0.02;
    if (teamSide === 'home') {
      y = Math.min(0.5 - centerGap, y);
    } else {
      y = Math.max(0.5 + centerGap, y);
    }

    if (teamSide === 'home') {
      setHomePos(prev => {
        const next = { ...prev, [pid]: { x, y } };
        homePosRef.current = next; // sync ref immediately so savePositionsNow reads latest
        savePositions('home', next);
        return next;
      });
    } else {
      setAwayPos(prev => {
        const next = { ...prev, [pid]: { x, y } };
        awayPosRef.current = next; // sync ref immediately so savePositionsNow reads latest
        savePositions('away', next);
        return next;
      });
    }
  };
  const startDrag = (pid: string, teamSide: 'home'|'away') => (ev: React.PointerEvent<HTMLDivElement>) => {
    // block dragging if removed
    const removedHere = teamSide === 'home' ? removedHomeSet.has(pid) : removedAwaySet.has(pid);
    if (removedHere) return;
    if (!canDragTeam(teamSide)) return;

    ev.preventDefault();
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    isDraggingRef.current = true;
    pushUndoSnapshot();
    document.body.style.userSelect = 'none';

    let rafId: number | null = null;
    let lastEv: PointerEvent | null = null;
    const flush = () => {
      rafId = null;
      if (lastEv) onDrag(lastEv, pid, teamSide);
    };
    const move = (nextEv: PointerEvent) => {
      lastEv = nextEv;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };
    const up = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        if (lastEv) onDrag(lastEv, pid, teamSide);
      }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
      savePositionsNow(teamSide);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };

  const shareTeam = async () => {
    const text = `Check out the team lineup for today's match! ${homeTeamName} vs ${awayTeamName}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Team Lineup', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        alert('Share text copied to clipboard.');
      }
    } catch { /* ignore */ }
  };

  // Re-apply positions when players change
  React.useEffect(() => {
    if (!dataLoaded) return; // Don't run until initial data is loaded
    
    // If we have positions but some players don't have positions, fill them in
    if (homePlayers.length > 0 && Object.keys(homePos).length > 0) {
      const missingHome = homePlayers.filter(p => !homePos[String(p.id || p.name)]);
      if (missingHome.length > 0) {
        console.log('[Orientation/Players Change] Adding auto-layout for', missingHome.length, 'home players');
        const auto = autoLayout(homePlayers, 'home');
        setHomePos(prev => {
          const merged = { ...prev };
          missingHome.forEach(p => {
            const key = String(p.id || p.name);
            if (auto[key]) merged[key] = auto[key];
          });
          return merged;
        });
      }
    }
    
    if (awayPlayers.length > 0 && Object.keys(awayPos).length > 0) {
      const missingAway = awayPlayers.filter(p => !awayPos[String(p.id || p.name)]);
      if (missingAway.length > 0) {
        console.log('[Orientation/Players Change] Adding auto-layout for', missingAway.length, 'away players');
        const auto = autoLayout(awayPlayers, 'away');
        setAwayPos(prev => {
          const merged = { ...prev };
          missingAway.forEach(p => {
            const key = String(p.id || p.name);
            if (auto[key]) merged[key] = auto[key];
          });
          return merged;
        });
      }
    }
  }, [homePlayers, awayPlayers, dataLoaded, autoLayout]);

  // Positions for both teams
  const homePositions = React.useMemo(() => {
    const base = homePos || {};
    const players = homePlayers || [];
    const merged: TeamPositions = { ...base };
    if (players.length) {
      const auto = autoLayout(players, 'home');
      players.forEach(p => {
        const k = String(p.id || p.name);
        if (!merged[k] && auto[k]) merged[k] = auto[k];
      });
    }
    return merged;
  }, [homePos, homePlayers, autoLayout]);

  const awayPositions = React.useMemo(() => {
    const base = awayPos || {};
    const players = awayPlayers || [];
    const merged: TeamPositions = { ...base };
    if (players.length) {
      const auto = autoLayout(players, 'away');
      players.forEach(p => {
        const k = String(p.id || p.name);
        if (!merged[k] && auto[k]) merged[k] = auto[k];
      });
    }
    return merged;
  }, [awayPos, awayPlayers, autoLayout]);

  // Guests for home team
  const homeGuests = React.useMemo(() => {
    const m = new Map<string, Guest>();
    guests.forEach((g: Guest) => {
      if (g.team !== 'home') return;
      const id = String(g.id);
      if (!m.has(id)) m.set(id, g);
    });
    return Array.from(m.values());
  }, [guests]);

  // Guests for away team
  const awayGuests = React.useMemo(() => {
    const m = new Map<string, Guest>();
    guests.forEach((g: Guest) => {
      if (g.team !== 'away') return;
      const id = String(g.id);
      if (!m.has(id)) m.set(id, g);
    });
    return Array.from(m.values());
  }, [guests]);

  // Simple count-based lineup matchup percent
  // If both teams have equal players (including guests) => 100%
  // Otherwise: min(count)/max(count) * 100 (rounded)
  const homeBalancePct = React.useMemo(() => {
    // Keep team-balance aligned with server prediction algorithm.
    // If prediction is unavailable, show neutral 50/50 rather than a different local formula.
    if (teamInsights && Number.isFinite(teamInsights.matchupPct) && teamInsights.matchupPct > 0) {
      return Math.round(Math.max(1, Math.min(99, teamInsights.matchupPct)));
    }
    return 50;
  }, [teamInsights]);

  // Simple row layout for guests within same half
  // SWAPPED: home at y=0.99 (right when rotated), away at y=0.01 (left when rotated)
  const homeGuestRowPositions = React.useMemo(() => {
    const list = homeGuests;
    const count = Math.max(1, list.length);
    const y = 0.05;  // Home team's guest row (top)
    const map: Record<string, {x:number;y:number}> = {};
    list.forEach((g, i) => {
      const x = (i + 1) / (count + 1);
      map[String(g.id)] = { x, y };
    });
    return map;
  }, [homeGuests]);

  const awayGuestRowPositions = React.useMemo(() => {
    const list = awayGuests;
    const count = Math.max(1, list.length);
    const y = 0.95;  // Away team's guest row (bottom)
    const map: Record<string, {x:number;y:number}> = {};
    list.forEach((g, i) => {
      const x = (i + 1) / (count + 1);
      map[String(g.id)] = { x, y };
    });
    return map;
  }, [awayGuests]);

  const persistBothPositions = React.useCallback(async () => {
    await Promise.all([savePositionsNow('home'), savePositionsNow('away')]);
  }, [savePositionsNow]);

  const handleUndoFormation = React.useCallback(() => {
    if (!canEditAnyFormation) return;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      const nextHome = clonePositions(snapshot.home);
      const nextAway = clonePositions(snapshot.away);
      homePosRef.current = nextHome;
      awayPosRef.current = nextAway;
      setHomePos(nextHome);
      setAwayPos(nextAway);
      void persistBothPositions();
      return prev.slice(0, -1);
    });
  }, [canEditAnyFormation, persistBothPositions]);

  // Context Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<null | { id: string; name: string; team: 'home'|'away'; isRemoved: boolean }>(null);
  const [switchMode, setSwitchMode] = useState<null | { team: 'home'|'away'; aId: string }>(null);

  const openMenu = (e: React.MouseEvent, t: 'home'|'away', id: string, name: string) => {
    e.preventDefault();
    const pid = String(id); // ensure string
    const isRemoved = t === 'home' ? removedHomeSet.has(pid) : removedAwaySet.has(pid);
    setMenuTarget({ id: pid, name, team: t, isRemoved });
    setMenuAnchor(e.currentTarget as HTMLElement);
  };
  const closeMenu = () => { setMenuAnchor(null); setMenuTarget(null); };

  // Actions
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // Replace dialog state (added)
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceSearch, setReplaceSearch] = useState('');
  const [replaceCandidates, setReplaceCandidates] = useState<BasicUser[]>([]);
  const [replaceCtx, setReplaceCtx] = useState<null | { team: 'home'|'away'; removedId: string }>(null);

  // Users already in this match (exclude from list) (added)
  const matchUserIdSet = React.useMemo(() => {
    const ids = new Set<string>();
    homePlayers.forEach(p => p.id && ids.add(String(p.id)));
    awayPlayers.forEach(p => p.id && ids.add(String(p.id)));
    (guests || []).forEach(g => g.id && ids.add(String(g.id)));
    return ids;
  }, [homePlayers, awayPlayers, guests]);

  // Load league members (tries common endpoints/shapes) (added)
  const loadReplacementCandidates = React.useCallback(async (excludeId?: string) => {
    if (!leagueId || !token) return;
    setReplaceLoading(true);

    type UserLike = Partial<{
      id: string | number;
      userId: string | number;
      playerId: string | number;
      firstName: string;
      givenName: string;
      name: string;
      lastName: string;
      shirtNumber: string | number | null;
      number: string | number | null;
    }>;

    const mapUsers = (arr: unknown[]): BasicUser[] =>
      (Array.isArray(arr) ? arr : [])
        .map((u): BasicUser | null => {
          if (!u || typeof u !== 'object') return null;
          const o = u as UserLike;
          const idRaw = o.id ?? o.userId ?? o.playerId;
          if (idRaw == null) return null;
          const id = String(idRaw);
          const baseName = String(o.firstName ?? o.givenName ?? o.name ?? '').trim();
          const firstName = baseName.split(' ')[0] || '';
          const lastName = o.lastName ?? baseName.split(' ').slice(1).join(' ');
          let shirtNumber: string | null | undefined = undefined;
          if (o.shirtNumber != null) {
            shirtNumber = o.shirtNumber === null ? null : String(o.shirtNumber);
          } else if (o.number != null) {
            shirtNumber = o.number === null ? null : String(o.number);
          }
          return { id, firstName, lastName: lastName || '', shirtNumber };
        })
        .filter((u): u is BasicUser => !!u);

    const tryFetch = async (path: string) => {
      try {
        const r = await fetch(`${apiBase}/leagues/${leagueId}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return [] as BasicUser[];
        const data = await r.json();
        if (Array.isArray(data)) return mapUsers(data);
        if (Array.isArray(data?.members)) return mapUsers(data.members);
        if (Array.isArray(data?.players)) return mapUsers(data.players);
        if (Array.isArray(data?.users)) return mapUsers(data.users);
        if (Array.isArray(data?.data)) return mapUsers(data.data);
        return [] as BasicUser[];
      } catch { return [] as BasicUser[]; }
    };

    let list: BasicUser[] = [];
    for (const endpoint of ['members', 'players', 'users']) {
      const got = await tryFetch(endpoint);
      if (got.length) { list = got; break; }
    }
    if (!list.length) {
      try {
        const r = await fetch(`${apiBase}/leagues/${leagueId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const d = await r.json();
          const guesses =
            d?.league?.members ??
            d?.league?.players ??
            d?.members ??
            d?.players ??
            d?.league?.users ??
            d?.users ?? [];
          list = mapUsers(guesses);
        }
      } catch { /* ignore */ }
    }

    const removedId = excludeId || replaceCtx?.removedId || '';
    const filtered = list.filter(u => !matchUserIdSet.has(String(u.id)) && String(u.id) !== removedId);

    setReplaceCandidates(filtered);
    setReplaceLoading(false);
  }, [leagueId, token, apiBase, matchUserIdSet, replaceCtx?.removedId]);

  const handleRemove = async () => {
    if (!leagueId || !matchId || !token || !menuTarget) return;
    const { id, team } = menuTarget;
    try {
      const res = await fetch(`${apiBase}/leagues/${leagueId}/matches/${matchId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team, playerId: id }) // include team
      });
      if (res.ok) {
        setRemoved(prev => {
          const updated = Array.from(new Set([...(prev[team] || []), String(id)]));
          return { ...prev, [team]: updated };
        });
      } else {
        console.warn('Remove failed', await res.text());
      }
    } catch (e) { console.warn('Remove error', e); }
    closeMenu();
  };

  // REPLACED: open dialog and load candidates instead of window.prompt (minimal change)
  const handleReplace = async () => {
    if (!leagueId || !matchId || !token || !menuTarget) return;
    setReplaceCtx({ team: menuTarget.team, removedId: String(menuTarget.id) });
    setReplaceSearch('');
    setReplaceOpen(true);
    closeMenu();
    await loadReplacementCandidates(String(menuTarget.id));
  };

  const handleStartSwitch = () => {
    if (!menuTarget) return;
    setSwitchMode({ team: menuTarget.team, aId: menuTarget.id });
    closeMenu();
    alert('Switch mode: click another player on the same team to swap positions.');
  };

  const tryCompleteSwitch = async (team: 'home'|'away', bId: string) => {
    if (!switchMode || switchMode.team !== team || switchMode.aId === bId) return;
    try {
      const res = await fetch(`${apiBase}/leagues/${leagueId}/matches/${matchId}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team, aId: switchMode.aId, bId })
      });
      if (!res.ok) {
        console.warn('Switch failed', await res.text());
      } else {
        // Swap locally for snappy UX
        const src = team === 'home' ? homePosRef.current : awayPosRef.current;
        const pA = src[switchMode.aId];
        const pB = src[bId];
        if (pA || pB) {
          const next = { ...src };
          next[switchMode.aId] = pB || pA;
          next[bId] = pA || pB;
          if (team === 'home') setHomePos(next); else setAwayPos(next);
        }
      }
    } catch (e) { console.warn('Switch error', e); }
    setSwitchMode(null);
  };

  const handleMakeCaptain = async () => {
    if (!menuTarget) return;
    try {
      const res = await fetch(`${apiBase}/leagues/${leagueId}/matches/${matchId}/make-captain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team: menuTarget.team, userId: menuTarget.id })
      });
      if (res.ok) {
        if (menuTarget.team === 'home') setHomeCaptainId(menuTarget.id);
        else setAwayCaptainId(menuTarget.id);
      } else {
        console.warn('Make captain failed', await res.text());
      }
    } catch (e) { console.warn('Make captain error', e); }
    closeMenu();
  };
   const doReplace = async (replacementId: string) => {
    if (!leagueId || !matchId || !token || !replaceCtx) return;
    try {
      setReplaceLoading(true);
      const res = await fetch(`${apiBase}/leagues/${leagueId}/matches/${matchId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team: replaceCtx.team, removedId: replaceCtx.removedId, replacementId })
      });
      if (res.ok) {
        const r = await fetch(`${apiBase}/leagues/${leagueId}/matches/${matchId}/team-view`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const p: TeamViewPayload = await r.json();
        if (p?.success && p.match) {
          const m = p.match;
          setHomePlayers(arrangePlayers(m.homeTeam || [], m.homeCaptainId));
          setAwayPlayers(arrangePlayers(m.awayTeam || [], m.awayCaptainId));
          setGuests(normalizeGuestsForMatch(m.guests, m.positions));
          setHomeCaptainId(m.homeCaptainId ? String(m.homeCaptainId) : undefined);
          setAwayCaptainId(m.awayCaptainId ? String(m.awayCaptainId) : undefined);
          syncMatchTimingFromMatch(m);
          setRemoved({
            home: (m.removed?.home || []).map(String),
            away: (m.removed?.away || []).map(String),
          });
          // const isHoriz = window.innerWidth >= 900;
          const hPos = m.positions?.home || {};
          const aPos = m.positions?.away || {};
          setHomePos(Object.keys(hPos).length > 0 ? hPos : autoLayout(arrangePlayers(m.homeTeam || [], m.homeCaptainId), 'home'));
          setAwayPos(Object.keys(aPos).length > 0 ? aPos : autoLayout(arrangePlayers(m.awayTeam || [], m.awayCaptainId), 'away'));
        }
        setReplaceOpen(false);
      } else {
        console.warn('Replace failed', await res.text());
      }
    } catch (e) {
      console.warn('Replace error', e);
    } finally {
      setReplaceLoading(false);
    }
  };

  // Filter candidates by search (added)
  const filteredCandidates = React.useMemo(() => {
    const q = replaceSearch.trim().toLowerCase();
    if (!q) return replaceCandidates;
    return replaceCandidates.filter(u => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
      return name.includes(q) || String(u.shirtNumber || '').toLowerCase().includes(q);
    });
  }, [replaceCandidates, replaceSearch]);

  const ShirtDot = ({ player, teamSide }: { player: Player; teamSide: 'home' | 'away' }) => {
    const pid = String(player.id || player.name);
    const positions = teamSide === 'home' ? homePositions : awayPositions;
    const pos = positions[pid];
    if (!pos) return null;
    const isRemovedHere = teamSide === 'home' ? removedHomeSet.has(pid) : removedAwaySet.has(pid);
    const onClick = (e: React.MouseEvent) => {
      if (switchMode) {
        tryCompleteSwitch(teamSide, pid);
      } else if (canDragTeam(teamSide)) {
        openMenu(e, teamSide, pid, player.name);
      }
    };
    const isCaptainNow = String(teamSide === 'home' ? (homeCaptainId || '') : (awayCaptainId || '')) === pid;
    const teamColor = teamSide === 'home' ? primaryColor : awayTeamColor;
    const shirtImage = teamSide === 'away' ? Shirtaway : Shirt;
    
    return (
      <Box
        onPointerDown={startDrag(pid, teamSide)}
        onClick={onClick}
        onContextMenu={onClick}
        sx={{
          position: 'absolute',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: { xs: 'translate(-50%, -50%)', md: 'translate(-50%, -50%) rotate(90deg)' },
          cursor: canDragTeam(teamSide) && !isRemovedHere ? 'grab' : 'pointer',
          touchAction: 'none',
          opacity: isRemovedHere ? 0.75 : 1,
          filter: isRemovedHere ? 'grayscale(0.85)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ position: 'relative', width: 60, height: 60 }}>
          <img 
            src={shirtImage.src} 
            alt="shirt" 
            draggable={false}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain', 
              opacity: 0.85,
              userSelect: 'none'
            }} 
          />
          {hasPublishedResult && typeof player.xp === 'number' && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                lineHeight: 1,
                pointerEvents: 'none',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)'
              }}
            >
              <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.3 }}>
                {Math.round(player.xp)}
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.2 }}>
                xp
              </Typography>
            </Box>
          )}
          {isCaptainNow && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: '25px',
                right: '-3px',
                backgroundColor: teamSide === 'home' ? 'green' : 'blue',
                color: 'white',
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 4px',
                // borderRadius: '50%',
                width: '10px',
                height: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // border: '1px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              C
            </Box>
          )}
        </Box>
        <Box sx={{ height: 4 }} />
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#fff', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '60px' }}>
          {player.name}
        </Typography>
      </Box>
    );
  };

  const GuestDot = ({ guestId, name, teamSide }: { guestId: string; name: string; teamSide: 'home' | 'away'; number?: string }) => {
    const pid = String(guestId);
    const positions = teamSide === 'home' ? homePositions : awayPositions;
    const guestRowPositions = teamSide === 'home' ? homeGuestRowPositions : awayGuestRowPositions;
    const pos = positions[pid] || guestRowPositions[pid];
    if (!pos) return null;
    const onClick = () => { /* no-op for guests */ };
    const teamColor = teamSide === 'home' ? primaryColor : awayTeamColor;
    const shirtImage = teamSide === 'away' ? Shirtaway : Shirt;
    
    return (
      <Box
        onPointerDown={startDrag(pid, teamSide)}
        onClick={onClick}
        sx={{
          position: 'absolute',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: { xs: 'translate(-50%, -50%)', md: 'translate(-50%, -50%) rotate(90deg)' },
          cursor: canDragTeam(teamSide) ? 'grab' : 'pointer',
          touchAction: 'none',
        }}
      >
        <Box sx={{ position: 'relative', width: 60, height: 60 }}>
          <img 
            src={shirtImage.src} 
            alt="guest-shirt" 
            draggable={false}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain', 
              opacity: 0.85,
              userSelect: 'none'
            }} 
          />
        </Box>
        <Box sx={{ height: 6 }} />
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#fff', textAlign: 'center' }}>
          {name}
        </Typography>
      </Box>
    );
  };

  // Teams not created: only show pitch + message (no shirts)
  const awaitingTeams = dataLoaded && homePlayers.length === 0 && awayPlayers.length === 0;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#2b2b2b' }}>
      {/* AppBar substitute */}
      {/* <Box
        sx={{
          px: 2,
          py: 1.25,
          color: '#fff',
          background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor2} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: 1, textTransform: 'uppercase' }}>TEAMS</Typography>
          <img src={FootballIcon.src} alt="football" width={22} height={22} style={{ objectFit: 'contain' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: 1, textTransform: 'uppercase' }}>MATCH {matchNumber ?? '-'}</Typography>
        </Box>
      </Box> */}

      <Box component="main" sx={{ p: 2 }}>
        {/* View toggle row: Home count | Table/Pitch buttons | Away count */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.6rem', color: '#00a77f' }}>
            Home ({homePlayers.length + homeGuests.length})
          </Typography>
          <Box sx={{ bgcolor: '#fff', borderRadius: 0.5, p: 0.75, display: 'flex', gap: 1 }}>
            <Box
              onClick={() => setViewMode('table')}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1.5, py: 0.5,
                border: `0.5px solid #212121`,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: viewMode === 'table' ? '#00a77f' : 'transparent',
              }}
            >
              <img src={TableViewImg.src} alt="table" width={23} height={23} style={{ objectFit: 'contain', filter: viewMode === 'table' ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
              <Typography sx={{ fontSize: '1.20rem', fontWeight: 600, color: viewMode === 'table' ? '#fff' : '#555' }}>Table View</Typography>
            </Box>
            <Box
              onClick={() => setViewMode('pitch')}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1.5, py: 0.5,
                border: '0.5px solid #212121',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: viewMode === 'pitch' ? '#00a77f' : 'transparent',
              }}
            >
              <img src={PitchViewImg.src} alt="pitch" width={26} height={26} style={{ objectFit: 'contain', filter: viewMode === 'pitch' ? 'none' : 'brightness(0)' }} />
              <Typography sx={{ fontSize: '1.20rem', fontWeight: 600, color: viewMode === 'pitch' ? '#fff' : '#555' }}>Pitch View</Typography>
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.6rem', color: '#c95c1a' }}>
            ({awayPlayers.length + awayGuests.length}) Away
          </Typography>
        </Box>
        {/* Formation card */}
        {viewMode === 'pitch' && (
        <>
        <Paper
          ref={wrapperRef}
          elevation={0}
          sx={{
            p: 0,
            border: 'none',
            borderRadius: 1,
            bgcolor: '#2b2b2b',
            overflow: 'hidden',
            mx: 1,
            /* Wrapper defines the visible landscape area */
            height: { xs: 220, sm: 250, md: 410 },
            position: 'relative',
          }}
        >
          {/* pitchRef is portrait-sized, rotated 90deg CCW so goals end up on left/right.
              CSS width = visible height; CSS height = large enough to fill visible width */}
          <Box
            ref={pitchRef}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: { xs: 220, sm: 250, md: 405 },
              height: `${pitchW}px`,
              transform: 'translate(-50%, -50%) rotate(-90deg)',
              transformOrigin: 'center center',
              bgcolor: '#2b2b2b',
            }}
          >
            {/* Pitch image: grayscale→invert→brightness turns white-bg→black and teal-lines→white;
                mix-blend-mode:screen makes black transparent so #2b2b2b container shows through */}
            <img
              src={Pitch.src}
              alt=""
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                filter: 'grayscale(1) invert(1) brightness(10) contrast(5)',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
              }}
            />
            {awaitingTeams ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.20)'
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 800, transform: { xs: 'none', md: 'rotate(90deg)' } }}>
                  Awaiting admin to generate teams
                </Typography>
              </Box>
            ) : (
              <>
                {/* Home Team (Orange) - Left half */}
                {homePlayers.map((p) => <ShirtDot key={`home-${p.id || p.name}-${p.number}`} player={p} teamSide="home" />)}
                {homeGuests.map(g => (
                  <GuestDot
                    key={`home-guest-${g.id}`}
                    guestId={String(g.id)}
                    name={`${g.firstName} ${g.lastName}`.trim()}
                    teamSide="home"
                  />
                ))}
                
                {/* Away Team (Blue) - Right half */}
                {awayPlayers.map((p) => <ShirtDot key={`away-${p.id || p.name}-${p.number}`} player={p} teamSide="away" />)}
                {awayGuests.map(g => (
                  <GuestDot
                    key={`away-guest-${g.id}`}
                    guestId={String(g.id)}
                    name={`${g.firstName} ${g.lastName}`.trim()}
                    teamSide="away"
                  />
                ))}
              </>
            )}
          </Box>
        </Paper>

        </>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

            {/* Team Balance Bar */}
            <Box sx={{ bgcolor: '#2b2b2b', borderRadius: 1.5, px: 2, py: 1.5, border: '1px solid #2b2b2b', maxWidth: 600, mx: 'auto', width: '100%' }}>
              <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1', color: '#fff', textTransform: 'uppercase', letterSpacing: 1, mb: 0 }}>Team Balance</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                {/* Home shirt */}
                <img src={Shirt.src} alt="Home" width={94} height={94} style={{ objectFit: 'contain', flexShrink: 0, marginTop: '-50px' }} />
                {/* Center: % + bar + VS */}
                <Box sx={{ flex: 1, mx: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {/* % labels at corners of bar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: '#00a77f', fontWeight: 800, fontSize: '1.9rem', lineHeight: 1 }}>
                      {`${homeBalancePct}%`}
                    </Typography>
                    <Typography sx={{ color: '#e56a16', fontWeight: 800, fontSize: '1.9rem', lineHeight: 1 }}>
                      {`${100 - homeBalancePct}%`}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 4,
                      borderRadius: 6,
                      bgcolor: '#e56a16',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${homeBalancePct}%`,
                        height: '100%',
                        bgcolor: '#00a77f',
                        borderRadius: '6px 0 0 6px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${homeBalancePct}%`,
                        width: 2,
                        transform: 'translateX(-1px)',
                        bgcolor: '#fff',
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.7rem', color: '#fff', letterSpacing: '1px', fontFamily: '"Oswald", sans-serif !important', textTransform: 'uppercase', textAlign: 'center', mt: 0 }}>V/S</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '0.82rem', textAlign: 'center', fontWeight: 600, mt: -1 }}>{matchDurationLabel}</Typography>
                </Box>
                {/* Away shirt */}
                <img src={Shirtaway.src} alt="Away" width={94} height={94} style={{ objectFit: 'contain', flexShrink: 0, marginTop: '-50px' }} />
              </Box>
            </Box>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center',mt: -2 }}>
            {/* Home Team */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 275 }}>
              {[...homePlayers, ...homeGuests.map(g => ({ id: g.id, name: `${g.firstName} ${g.lastName}`.trim(), number: '', position: 'MD' as const, xp: undefined }))].map((p, i) => {
                const pid = String(p.id || p.name);
                const isCap = homeCaptainId === pid;
                return (
                  <Box key={i} sx={{ bgcolor: '#2b2b2b', border: '1.5px solid #166956', borderRadius: 1, px: 1.5, py: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{p.name}</Typography>
                        {isCap && <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#00a77f' }}>Captain</Typography>}
                      </Box>
                      {hasPublishedResult && typeof (p as Player).xp === 'number' && (
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>{(p as Player).xp} xp</Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#aaa', mt: 0.2 }}>Position: {p.position}</Typography>
                  </Box>
                );
              })}
            </Box>
            {/* Divider */}
            <Box sx={{ width: '1.5px', bgcolor: '#959595', borderRadius: 1, flexShrink: 0 }} />
            {/* Away Team */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 275 }}>
              {[...awayPlayers, ...awayGuests.map(g => ({ id: g.id, name: `${g.firstName} ${g.lastName}`.trim(), number: '', position: 'MD' as const, xp: undefined }))].map((p, i) => {
                const pid = String(p.id || p.name);
                const isCap = awayCaptainId === pid;
                return (
                  <Box key={i} sx={{ bgcolor: '#2b2b2b', border: '1.5px solid #884a20', borderRadius: 1, px: 1.5, py: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{p.name}</Typography>
                        {isCap && <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#00a77f' }}>Captain</Typography>}
                      </Box>
                      {hasPublishedResult && typeof (p as Player).xp === 'number' && (
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>{(p as Player).xp} xp</Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#aaa', mt: 0.2 }}>Position: {p.position}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
          </Box>
        )}

        {/* Context Menu */}
        <Menu open={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={closeMenu}>
          <MenuItem
            onClick={handleRemove}
            disabled={
              !menuTarget ||
              !(isLeagueAdmin || isCaptainOf(menuTarget.team) || String(menuTarget.id) === String(meId))
            }
          >
            <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Remove</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={handleReplace}
            disabled={
              !menuTarget ||
              !menuTarget.isRemoved ||                          // keep existing rule
              !(isLeagueAdmin || isCaptainOf(menuTarget.team))
            }
          >
            <ListItemIcon><PublishedWithChangesIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Replace</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={handleStartSwitch}
            disabled={!menuTarget || !(isLeagueAdmin || isCaptainOf(menuTarget.team))}
          >
            <ListItemIcon><SwapHorizIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Switch</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={handleMakeCaptain}
            disabled={!menuTarget || !(isLeagueAdmin || isCaptainOf(menuTarget.team))} // <= allow captain
          >
            <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Make Captain</ListItemText>
          </MenuItem>
        </Menu>

        {/* Replace Dialog (fixed JSX) */}
        <Dialog open={replaceOpen} onClose={() => setReplaceOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Select replacement</DialogTitle>
          <DialogContent>
            {replaceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name or number..."
                  value={replaceSearch}
                  onChange={e => setReplaceSearch(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <List dense>
                  {filteredCandidates.length === 0 ? (
                    <Typography sx={{ px: 1, py: 1.5, color: 'text.secondary' }}>
                      No eligible members found.
                    </Typography>
                  ) : (
                    filteredCandidates.map(u => (
                      <ListItemButton key={u.id} onClick={() => doReplace(u.id)}>
                        <ListItemText
                          primary={`${u.firstName || ''} ${u.lastName || ''}`.trim() || `User ${u.id}`}
                          secondary={u.shirtNumber ? `#${u.shirtNumber}` : undefined}
                        />
                      </ListItemButton>
                    ))
                  )}
                </List>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Box sx={{ height: 12 }} />

        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
          {/* Left: Undo / back placeholder */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, flexShrink: 0 }}>
            <Box sx={{ width: 44, height: 44, mr: -10, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canEditAnyFormation && undoStack.length > 0 ? 'pointer' : 'not-allowed', opacity: canEditAnyFormation && undoStack.length > 0 ? 1 : 0.45, visibility: viewMode === 'pitch' ? 'visible' : 'hidden' }}
              onClick={handleUndoFormation}
            >
              <img src={UndoImg.src} alt="undo" width={24} height={24} style={{ objectFit: 'contain' }} />
            </Box>
          </Box>

          {/* Center: Match Predictions */}
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 1.5,
              border: '1.5px solid #fff',
              borderRadius: 1,
              bgcolor: '#2b2b2b',
              textAlign: 'center',
              flex: 1,
              mx: 10,
            }}
          >
            <Typography sx={{ fontSize: 19, fontWeight: 600, color: '#00a77f', lineHeight: 1.1, mb: 0 }}>
              Match Predictions
            </Typography>

            {hasPublishedResult && homeTeamGoals != null && awayTeamGoals != null ? (
              <>
                <Typography sx={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1, mb: 0 }}>
                  <span style={{ color: primaryColor }}>
                    {homeTeamGoals > awayTeamGoals
                      ? homeTeamName
                      : awayTeamGoals > homeTeamGoals
                      ? awayTeamName
                      : 'Match'}
                  </span>{' '}
                  <span style={{ color: '#fff' }}>
                    {homeTeamGoals === awayTeamGoals
                      ? 'ended in a draw.'
                      : 'is predicted to win !'}
                  </span>
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>
                  Predicted scores{' '}
                  <span style={{ color: primaryColor }}>
                    {homeTeamGoals} - {awayTeamGoals}
                  </span>
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: 19, fontWeight: 600, lineHeight: 1.1, mb: 0 }}>
                  <span style={{ color: primaryColor }}>
                    {teamInsights
                      ? teamInsights.predicted === 'home'
                        ? homeTeamName
                        : teamInsights.predicted === 'away'
                        ? awayTeamName
                        : 'Draw'
                      : homeTeamName}
                  </span>{' '}
                  <span style={{ color: '#fff' }}>
                    {teamInsights
                      ? teamInsights.predicted === 'draw'
                        ? 'is predicted (draw).'
                        : 'is predicted to win.'
                      : ''}
                  </span>
                </Typography>
                <Typography sx={{ fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                  Predicted score is{' '}
                  <span style={{ color: primaryColor }}>
                    {teamInsights ? teamInsights.predictedScore : '\u2014'}
                  </span>
                </Typography>
                {!!predictionReason && !teamInsights && !insightsLoading && (
                  <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
                    {predictionReason === 'FIRST_MATCH_NO_STATS'
                      ? 'Predictions are unavailable for the first match without prior stats.'
                      : predictionReason === 'NO_SELECTED_PLAYERS'
                      ? 'Select players to see predictions.'
                      : predictionReason === 'NO_SIGNAL'
                      ? 'Not enough data to estimate.'
                      : 'Prediction unavailable.'}
                  </Typography>
                )}
              </>
            )}
          </Paper>

          {/* Right: Share button */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, flexShrink: 0 }}>
            <Box sx={{ width: 44, height: 44, ml: -13, borderRadius: '3px', bgcolor: '#00a77f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={shareTeam}
            >
              <ShareIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
          </Box>
        </Box>

        <Typography sx={{ fontSize: 17, color: '#fff', mt: 1.5, lineHeight: 1.2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
          <img src={BulbImg.src} alt="tip" width={20} height={20} style={{ objectFit: 'contain' }} />
          {canEditAnyFormation
            ? 'Admins/Captains can drag players and save formation.'
            : 'Read-only view: formation can only be changed by Admin/Captains.'}
        </Typography>
        <Box sx={{ height: 40 }} />
        
      </Box>
    </Box>
  );
}
