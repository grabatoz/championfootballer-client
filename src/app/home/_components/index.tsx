'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  // Button,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  IconButton,
  DialogActions,
  DialogContent,
  Divider,
  MenuItem,
  GlobalStyles,
  useTheme,
  useMediaQuery,
  // styled
} from '@mui/material';

const PlayerCardLoadingFallback = () => (
  <div className="home-player-card-inline-skeleton" aria-hidden="true">
    <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__avatar" />
    <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__name" />
    <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__number" />
    <div className="home-dashboard-loading-player-core">
      <div className="home-dashboard-loading-bone home-dashboard-loading-player-core-line" />
      <div className="home-dashboard-loading-player-core-body">
        <div className="home-dashboard-loading-bone home-dashboard-loading-player-core-figure" />
      </div>
      <div className="home-dashboard-loading-bone home-dashboard-loading-player-core-line home-dashboard-loading-player-core-line--short" />
    </div>
    <div className="home-player-card-inline-skeleton__stats">
      <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__stat" />
      <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__stat" />
      <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__stat" />
      <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__stat" />
      <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__stat" />
      <div className="home-dashboard-loading-bone home-player-card-inline-skeleton__stat" />
    </div>
  </div>
);

// Lazy load heavy component
const PlayerCard = dynamic(() => import('@/Components/playercard/playercard'), {
  loading: PlayerCardLoadingFallback,
  ssr: false
});

// import Link from 'next/link';
// import dash from '@/Components/images/dash.webp'
import dash from '@/Components/images/bgpage.png'
import wordImg from '@/Components/images/word.png'
import toast, { Toaster } from 'react-hot-toast';
// import league from '@/Components/images/league.png'
// import matches from '@/Components/images/matches.png'
// import leaderboard from '@/Components/images/leaderboard.png'
// import dreamteam from '@/Components/images/dream.png'
// import players from '@/Components/images/players.png'
// import trophy from '@/Components/images/trophy.png'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { initializeFromStorage, mergeUser } from '@/lib/features/authSlice';
import { League, User, Match } from '@/types/user';
import { joinLeague } from '@/lib/features/leagueSlice';
import { ChevronRight, CloudUpload, X, Plus } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { leagueAPI } from '@/lib/api-ultra-fast';
import { Trophy } from 'lucide-react';
// import { Block } from '@mui/icons-material';
// import { joinLeague } from '@/lib/features/leagueSlice';
import Dashbg from '@/Components/images/dashbg.webp'
import trophy from '@/Components/images/cup.png'
import Image from 'next/image';
import Link from 'next/link';

// const GreenDialogTextField = styled(TextField)(() => ({
//   '& .MuiOutlinedInput-root': {
//     background: 'rgba(43,43,43,0.85)',
//     backdropFilter: 'blur(6px)',
//     color: '#fff',
//     borderRadius: 10,
//     border: '1.5px solid rgba(229,106,22,0.55)',
//     transition: 'border-color .25s, box-shadow .25s',
//     '& fieldset': { borderColor: 'transparent' },
//     '&:hover fieldset': { borderColor: 'rgba(229,106,22,0.70)' },
//     '&.Mui-focused fieldset': { borderColor: '#E56A16', boxShadow: '0 0 0 3px rgba(229,106,22,0.25)' },
//     '& input': { color: '#fff', fontWeight: 500, letterSpacing: .4 }
//   },
//   '& .MuiInputLabel-root': {
//     color: '#ffe6d5',
//     fontWeight: 600,
//     letterSpacing: .5,
//     '&.Mui-focused': { color: '#ffffff' }
//   },
//   '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
//     WebkitBoxShadow: '0 0 0 1000px rgba(43,43,43,0.85) inset',
//     WebkitTextFillColor: '#fff',
//     transition: 'background-color 9999s ease-out 0s'
//   }
// }));

type LeagueComputedStatus = {
  isComplete?: boolean;
  locked?: boolean;
  // Normalized counters (best-effort from API response)
  matchesPlayed?: number;
  gamesPlayed?: number;
  maxGames?: number;
  totalMatches?: number;
  // Any remaining requirements to complete the league (must be empty to complete)
  missing?: Array<unknown>;
  [key: string]: unknown;
};
// Minimal shape used by this component only
type BasicLeague = {
  id: string | number;
  name?: string;
  status?: string;
  active?: boolean;
  archived?: boolean;
  updatedAt?: string;
  createdAt?: string;
  image?: string;
  isComplete?: boolean;
  isCompleted?: boolean;
  maxGames?: number;
  matches?: Match[];
};
type LeagueWithComputed = BasicLeague & {
  computedStatus?: LeagueComputedStatus;
  isLocked?: boolean;
  userRole?: 'ADMIN' | 'MEMBER';
  seasonNumber?: number;
};

type ApiLeague = {
  id: string | number;
  name?: string;
  status?: string;
  active?: boolean;
  archived?: boolean;
  updatedAt?: string;
  createdAt?: string;
  image?: string;
  isComplete?: boolean;
  isCompleted?: boolean;
  maxGames?: number;
};

// Runtime type guard for ApiLeague
const isApiLeague = (val: unknown): val is ApiLeague => {
  if (!val || typeof val !== 'object') return false;
  const maybe = val as Record<string, unknown>;
  const id = maybe.id;
  const idOk = typeof id === 'string' || typeof id === 'number';
  return idOk;
};

const LeagueSelectionComponent = ({ refreshKey, createdLeague, currentUserId, onAdminStatusChange }: { refreshKey?: number; createdLeague?: League | null; currentUserId?: string | number; onAdminStatusChange?: (isAdmin: boolean) => void }) => {
  const [userLeagues, setUserLeagues] = useState<LeagueWithComputed[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<LeagueWithComputed | null>(null);
  const [, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [networkDone, setNetworkDone] = useState(false);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [seasonConfirmOpen, setSeasonConfirmOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const isFetching = !networkDone;

  // Notify parent about admin status changes
  useEffect(() => {
    onAdminStatusChange?.(selectedLeague?.userRole === 'ADMIN');
  }, [selectedLeague?.userRole, onAdminStatusChange]);

  // Helper: compute user's role for a newly created/joined league without using any-casts
  const computeUserRoleForCreatedLeague = (l: League, uid?: string | number): 'ADMIN' | 'MEMBER' | undefined => {
    if (uid == null) return undefined;
    const currentId = String(uid);
    // Prefer adminId if provided by API
    const withAdmin: League & { adminId?: string | number } = l as League & { adminId?: string | number };
    const maybeAdminId = withAdmin.adminId;
    if (typeof maybeAdminId === 'string' || typeof maybeAdminId === 'number') {
      return String(maybeAdminId) === currentId ? 'ADMIN' : 'MEMBER';
    }
    // Fallback: check administrators array
    if (Array.isArray(l.administrators)) {
      const isAdmin = l.administrators.some((u) => u && String(u.id) === currentId);
      return isAdmin ? 'ADMIN' : 'MEMBER';
    }
    return undefined;
  };

  // Persist selection across navigation
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  const dispatchLeagueMutationEvent = useCallback(
    (eventName: 'league-created' | 'league-updated' | 'league-deleted', detail: Record<string, unknown>) => {
      if (typeof window === 'undefined') return;
      try {
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() },
          })
        );
      } catch {
        // ignore event dispatch errors
      }
    },
    []
  );

  // Auto-save any selected league as the preferred league
  useEffect(() => {
    try {
      if (selectedLeague?.id) {
        localStorage.setItem(PREFERRED_LEAGUE_KEY, String(selectedLeague.id));
      }
    } catch {
      // ignore storage errors (quota/SSG)
    }
  }, [selectedLeague?.id]);

  // Helper: determine if a league is completed (exclude from dropdown)
  const leagueIsCompleted = (l: LeagueWithComputed): boolean => {
    // Prefer backend-computed season-based completion status
    if (l?.computedStatus?.isCompleted === true) return true;

    // If there are any missing items (e.g., pending stats), do NOT treat as completed
    const missingArr = Array.isArray(l?.computedStatus?.missing) ? l.computedStatus!.missing! : [];
    if (missingArr.length > 0) return false;

    // If we have counters, prefer them to decide completion:
    // require matchesPlayed >= maxGames when maxGames is provided (> 0)
    const toNum = (v: unknown): number | undefined => {
      const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      return Number.isFinite(n) ? n : undefined;
    };
    const playedFromComputed = toNum(l?.computedStatus?.matchesPlayed) ?? toNum(l?.computedStatus?.gamesPlayed);
    const playedFromList = undefined; // not available reliably here
    const played = playedFromComputed ?? playedFromList;
    const maxG = toNum(l?.computedStatus?.maxGames) ?? toNum(l?.maxGames);

    // Ported logic from All Leagues: derive completion from matches list when available
    if (Array.isArray(l.matches)) {
      const matches = l.matches ?? [];
      const completedCount = matches.reduce((acc, m) => {
        const status = typeof m.status === 'string' ? m.status.toLowerCase() : '';
        const endedByStatus = status === 'completed' || status === 'finished' || status === 'ended';
        const endedByFlag = m.active === false;
        const endedByEnd = Boolean(m.end);
        return acc + (endedByStatus || endedByFlag || endedByEnd ? 1 : 0);
      }, 0);
      if (typeof maxG === 'number' && maxG > 0) {
        if (completedCount < maxG) return false; // not complete yet
        // completed by matches threshold -> consider complete (missing already checked above)
        return true;
      }
    }

    if (typeof maxG === 'number' && maxG > 0 && typeof played === 'number') {
      if (played < maxG) {
        // Even if backend flags it completed/locked, do NOT treat as completed until maxGames reached
        return false;
      }
      // Counters meet threshold and missing is empty -> complete
      return true;
    }

    // Primary: explicit completion flags coming from backend
    if (l?.computedStatus?.isComplete === true) return true;
    if (l?.computedStatus?.locked === true) return true;
    if (l?.isComplete === true) return true;
    if (l?.isCompleted === true) return true;
    if (l?.isLocked === true) return true;

    // Backward-compat: infer completion from status/active when flags are absent
    const sRaw = (l?.status ?? '').toString();
    const s = sRaw.trim().toUpperCase();
    const completionStatuses = new Set([
      'RESULT_PUBLISHED',
      'RESULT_UPLOADED',
      'RESULT_COMPLETE',
      'RESULT_FINISHED',
      'RESULT_ENDED',
      'RESULT_DONE',
      'COMPLETED'
    ]);
    if (completionStatuses.has(s)) return true;
    if (typeof l?.active === 'boolean' && l.active === false) return true;
    return false;
  };

  // Helper to compare leagues by most recent change
  const timeOf = (l?: LeagueWithComputed | null) => {
    if (!l) return 0;
    const ts = Date.parse(l.updatedAt || l.createdAt || '');
    return Number.isNaN(ts) ? 0 : ts;
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handler to create new season
  const handleCreateNewSeason = async () => {
    if (!selectedLeague || !token || isCreatingSeason) return;

    try {
      setIsCreatingSeason(true);
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${selectedLeague.id}/seasons`,
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/seasons`,
      ];

      let responsePayload: Record<string, unknown> | null = null;
      let successMessage = 'New season created successfully!';
      let errorMessage = 'Failed to create new season';
      let seasonCreated = false;

      for (let i = 0; i < endpoints.length; i += 1) {
        const response = await fetch(endpoints[i], {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ copyPlayers: true })
        });

        const payloadUnknown: unknown = await response.json().catch(() => ({}));
        const payload = (typeof payloadUnknown === 'object' && payloadUnknown !== null)
          ? (payloadUnknown as Record<string, unknown>)
          : {};

        if (response.ok && payload.success !== false) {
          responsePayload = payload;
          const msg = payload.message;
          if (typeof msg === 'string' && msg.trim()) {
            successMessage = msg.trim();
          }
          seasonCreated = true;
          break;
        }

        const msg = payload.message;
        if (typeof msg === 'string' && msg.trim()) {
          errorMessage = msg.trim();
        }

        const shouldTryFallback = i === 0 && (response.status === 404 || response.status === 405);
        if (!shouldTryFallback) break;
      }

      if (!seasonCreated) {
        toast.error(errorMessage);
        return;
      }

      const extractSeasonIdFromPayload = (payload: Record<string, unknown> | null): string | null => {
        if (!payload) return null;

        const asRecord = (v: unknown): Record<string, unknown> | null =>
          typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;

        const getId = (v: unknown): string | null => {
          if (typeof v === 'string' && v.trim()) return v.trim();
          if (typeof v === 'number') return String(v);
          return null;
        };

        const directSeasonId = getId(payload.seasonId);
        if (directSeasonId) return directSeasonId;

        const seasonLikeKeys = ['season', 'newSeason', 'createdSeason', 'currentSeason'] as const;
        for (const key of seasonLikeKeys) {
          const obj = asRecord(payload[key]);
          const id = getId(obj?.id) || getId(obj?.seasonId);
          if (id) return id;
        }

        const nestedKeys = ['data', 'result', 'payload', 'league'] as const;
        for (const key of nestedKeys) {
          const obj = asRecord(payload[key]);
          if (!obj) continue;
          const id =
            getId(obj.seasonId) ||
            getId(asRecord(obj.season)?.id) ||
            getId(asRecord(obj.newSeason)?.id) ||
            getId(asRecord(obj.currentSeason)?.id);
          if (id) return id;
        }

        return null;
      };

      const resolveLatestSeasonIdFromLeague = (leaguePayload: unknown): string | null => {
        if (!leaguePayload || typeof leaguePayload !== 'object') return null;
        const leagueObj = leaguePayload as Record<string, unknown>;

        const getId = (v: unknown): string | null => {
          if (typeof v === 'string' && v.trim()) return v.trim();
          if (typeof v === 'number') return String(v);
          return null;
        };

        const currentSeason = leagueObj.currentSeason as Record<string, unknown> | undefined;
        const fromCurrent = currentSeason ? getId(currentSeason.id) : null;
        if (fromCurrent) return fromCurrent;

        const seasonsUnknown = leagueObj.seasons;
        if (!Array.isArray(seasonsUnknown) || seasonsUnknown.length === 0) return null;

        const seasons = seasonsUnknown
          .map((s) => (typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : null))
          .filter((s): s is Record<string, unknown> => Boolean(s));

        const activeSeason = seasons.find((s) => s.isActive === true);
        const activeId = activeSeason ? getId(activeSeason.id) : null;
        if (activeId) return activeId;

        const sorted = [...seasons].sort((a, b) => {
          const aNum = typeof a.seasonNumber === 'number' ? a.seasonNumber : Number(a.seasonNumber || 0);
          const bNum = typeof b.seasonNumber === 'number' ? b.seasonNumber : Number(b.seasonNumber || 0);
          return bNum - aNum;
        });
        return getId(sorted[0]?.id);
      };

      let createdSeasonId = extractSeasonIdFromPayload(responsePayload);
      if (!createdSeasonId) {
        const detailsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}?_t=${Date.now()}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        if (detailsRes.ok) {
          const detailsData: unknown = await detailsRes.json().catch(() => null);
          const leagueObj = (detailsData && typeof detailsData === 'object')
            ? (detailsData as { league?: unknown }).league
            : null;
          createdSeasonId = resolveLatestSeasonIdFromLeague(leagueObj);
        }
      }

      toast.success(successMessage);

      // Clear caches before redirecting to the newly-created season table
      try {
        leagueAPI.invalidateCache();
        localStorage.removeItem('leaguesCache');
        localStorage.removeItem('lastLeaguesFetch');
      } catch { }

      const params = new URLSearchParams();
      params.set('tab', 'table');
      params.set('seasonCreated', '1');
      params.set('seasonCreatedMsg', successMessage);
      if (createdSeasonId) {
        params.set('seasonId', createdSeasonId);
      }

      setTimeout(() => {
        window.location.assign(`/league/${selectedLeague.id}?${params.toString()}`);
      }, 250);
    } catch (error) {
      console.error('Error creating new season:', error);
      toast.error('An error occurred while creating new season');
    } finally {
      setIsCreatingSeason(false);
    }
  };

  const openCreateSeasonConfirm = () => {
    if (!selectedLeague || isCreatingSeason || isFetching) return;
    setSeasonConfirmOpen(true);
  };

  const closeCreateSeasonConfirm = () => {
    setSeasonConfirmOpen(false);
  };

  const confirmCreateSeason = async () => {
    await handleCreateNewSeason();
    setSeasonConfirmOpen(false);
  };

  // Format league name function
  const formatLeagueName = (name: string | undefined | null) => {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) return '';
    const words = trimmed.split(/\s+/);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };
  const formatLeagueNameShort = (name: string | undefined | null) => {
    return formatLeagueName(name);
  };
  const getLeagueLabelFontSize = (name?: string) => {
    const len = String(name ?? '').trim().length;
    if (len > 28) return { xs: '14px', sm: '16px', md: '17px' };
    if (len > 22) return { xs: '15px', sm: '17px', md: '18px' };
    return { xs: '16px', sm: '18px', md: '19px' };
  };

  // Fetch user's leagues (now optimized for instant initial render, enrichment runs in background)
  useEffect(() => {
    const aborter = new AbortController();
    const fetchUserLeagues = async () => {
      if (!token) return;

      try {
        setNetworkDone(false);
        // Hit auth/status and immediately populate UI from joined/admin leagues
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
          // Hint browsers not to cache; also avoids any proxy layer caching quirks
          cache: 'no-store',
          signal: aborter.signal,
        } as RequestInit);

        if (!response.ok) return;
        const data = await response.json();
        if (!(data?.success && data?.user)) return;

        // Extract and merge XP + skills from primary /auth/status call
        const xp = data?.user?.xp;
        const skills = data?.user?.skills;
        const mergePayload: Record<string, unknown> = {};
        if (typeof xp === 'number') mergePayload.xp = xp;
        if (skills && typeof skills === 'object') mergePayload.skills = skills;
        if (Object.keys(mergePayload).length > 0) {
          dispatch(mergeUser(mergePayload));
        }

        // Prefer modern key adminLeagues; fall back to administeredLeagues for backward compatibility
        const adminLeaguesArr = ((data.user.adminLeagues || data.user.administeredLeagues || []) as Array<{ id?: string | number }>);
        const leaguesUnknown = ([
          ...(data.user.leagues || []),
          ...adminLeaguesArr
        ]) as unknown[];

        // Build quick lookup sets for roles
        const adminSet = new Set<string>(
          adminLeaguesArr
            .map((l) => String(l?.id))
            .filter((id) => id !== 'undefined')
        );
        const memberSet = new Set<string>(
          ((data.user.leagues || []) as Array<{ id?: string | number }>)
            .map((l) => String(l?.id))
            .filter((id) => id !== 'undefined')
        );

        const leagues: ApiLeague[] = leaguesUnknown.filter(isApiLeague);
        const uniqueLeagues: ApiLeague[] = Array.from(new Map<string, ApiLeague>(leagues.map(league => [String(league.id), league])).values());

        // 1) Show minimal list immediately (no extra awaits)
        const minimalList: LeagueWithComputed[] = uniqueLeagues.map((l) => {
          const idStr = String(l.id);
          const role: 'ADMIN' | 'MEMBER' | undefined = adminSet.has(idStr) ? 'ADMIN' : (memberSet.has(idStr) ? 'MEMBER' : undefined);
          return {
            id: l.id,
            name: l.name,
            status: typeof l?.status === 'string' && l.status.trim() !== '' ? l.status : 'active',
            active: typeof l?.active === 'boolean' ? l.active : true,
            archived: typeof l?.archived === 'boolean' ? l.archived : false,
            updatedAt: l.updatedAt,
            createdAt: l.createdAt,
            image: l.image,
            isComplete: l.isComplete,
            isCompleted: l.isCompleted,
            userRole: role,
            maxGames: l.maxGames,
          } as LeagueWithComputed;
        });
        const optimisticCreatedLeague: LeagueWithComputed | null = createdLeague?.id
          ? {
            id: String(createdLeague.id),
            name: createdLeague.name,
            image: createdLeague.image,
            updatedAt: createdLeague.updatedAt,
            createdAt: createdLeague.createdAt,
            status: createdLeague.status,
            active: createdLeague.active,
            archived: (createdLeague as unknown as { archived?: boolean }).archived,
            userRole: computeUserRoleForCreatedLeague(createdLeague, currentUserId),
            maxGames: createdLeague.maxGames,
          }
          : null;

        // Keep a freshly created league visible even if backend list is momentarily stale.
        setUserLeagues(() => {
          const map = new Map<string, LeagueWithComputed>(
            minimalList.map((leagueItem) => [String(leagueItem.id), leagueItem])
          );
          if (optimisticCreatedLeague && !map.has(String(optimisticCreatedLeague.id))) {
            map.set(String(optimisticCreatedLeague.id), optimisticCreatedLeague);
          }
          return Array.from(map.values());
        });

        // Choose a sensible default quickly (based purely on recency for instant UX).
        if (minimalList.length > 0 || optimisticCreatedLeague) {
          const combinedList = optimisticCreatedLeague
            ? [...minimalList, optimisticCreatedLeague]
            : minimalList;

          setSelectedLeague((prev) => {
            if (prev) {
              const existing = combinedList.find((leagueItem) => String(leagueItem.id) === String(prev.id));
              if (existing) return existing;
            }

            const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
            const preferred = storedId ? combinedList.find(l => String(l.id) === String(storedId)) || null : null;
            if (preferred) return preferred;

            const latest = [...combinedList].sort((a, b) => timeOf(b) - timeOf(a))[0];
            return latest || null;
          });
        }

        // 2) Enrich in the background per-league and update state incrementally
        // Avoid blocking UI by not awaiting all; update each league as soon as its data arrives
        uniqueLeagues.forEach(async (l) => {
          try {
            // Add timestamp to bypass any caching
            const timestamp = Date.now();
            const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${l.id}?_t=${timestamp}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-store',
              signal: aborter.signal
            } as RequestInit);

            let matchesFromDetails: Match[] | undefined = undefined;
            let maxGamesFromDetails: number | undefined = undefined;
            let seasonNumberFromDetails: number | undefined = undefined;
            let seasonNumberFromSeasonsApi: number | undefined = undefined;

            try {
              const seasonEndpoints = [
                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${l.id}/seasons?_t=${timestamp}`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${l.id}/seasons?_t=${timestamp}`,
              ];

              const extractRawSeasons = (seasonsPayload: unknown): unknown[] => {
                const payloadRecord = (seasonsPayload && typeof seasonsPayload === 'object')
                  ? (seasonsPayload as Record<string, unknown>)
                  : {};
                const nestedData = (payloadRecord.data && typeof payloadRecord.data === 'object')
                  ? (payloadRecord.data as Record<string, unknown>)
                  : {};

                return Array.isArray(seasonsPayload)
                  ? seasonsPayload
                  : (
                    Array.isArray(payloadRecord.seasons)
                      ? payloadRecord.seasons
                      : (
                        Array.isArray(payloadRecord.data)
                          ? payloadRecord.data
                          : (Array.isArray(nestedData.seasons) ? nestedData.seasons : [])
                      )
                  );
              };

              const parseSeasonNumber = (seasonLike: Record<string, unknown>): number => {
                const rawNum = seasonLike.seasonNumber;
                const direct = typeof rawNum === 'number'
                  ? rawNum
                  : (typeof rawNum === 'string' ? Number(rawNum) : NaN);
                if (Number.isFinite(direct) && direct > 0) return direct;

                const label = String(seasonLike.name || '');
                const hits = label.match(/\d+/g);
                if (hits && hits.length > 0) {
                  const parsed = Number(hits[hits.length - 1]);
                  if (Number.isFinite(parsed) && parsed > 0) return parsed;
                }
                return 0;
              };

              const allRawSeasons: unknown[] = [];
              for (const endpoint of seasonEndpoints) {
                try {
                  const seasonsRes = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store',
                    signal: aborter.signal,
                  } as RequestInit);
                  if (!seasonsRes.ok) continue;

                  const seasonsPayload: unknown = await seasonsRes.json().catch(() => ({}));
                  allRawSeasons.push(...extractRawSeasons(seasonsPayload));
                } catch {
                  // try next endpoint
                }
              }

              const seasonsParsed = allRawSeasons
                .map((s) => (typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : null))
                .filter((s): s is Record<string, unknown> => Boolean(s))
                .map((s) => ({
                  seasonNumber: parseSeasonNumber(s),
                  isActive: s.isActive === true || s.active === true || String(s.status || '').toLowerCase() === 'active',
                }))
                .filter((s) => s.seasonNumber > 0);

              const activeSeason = seasonsParsed.find((s) => s.isActive);
              if (activeSeason) {
                seasonNumberFromSeasonsApi = activeSeason.seasonNumber;
              } else if (seasonsParsed.length > 0) {
                seasonNumberFromSeasonsApi = [...seasonsParsed]
                  .sort((a, b) => b.seasonNumber - a.seasonNumber)[0].seasonNumber;
              }
            } catch {
              // ignore seasons API failure; detail payload fallback still applies
            }

            if (detailsRes.ok) {
              const leagueData = await detailsRes.json();
              const rawMatches = leagueData?.league?.matches as unknown;
              if (Array.isArray(rawMatches)) {
                const memberIds = new Set<string>(
                  ((leagueData?.league?.members || []) as Array<{ id?: string | number }>)
                    .map((m) => String(m?.id))
                    .filter((id) => id !== 'undefined')
                );

                // Keep only active league members inside team lists to avoid showing users who left the league
                matchesFromDetails = (rawMatches as Match[]).map((match) => {
                  const home = Array.isArray(match.homeTeamUsers)
                    ? match.homeTeamUsers.filter((u) => memberIds.has(String(u.id)))
                    : [];
                  const away = Array.isArray(match.awayTeamUsers)
                    ? match.awayTeamUsers.filter((u) => memberIds.has(String(u.id)))
                    : [];
                  const available = Array.isArray(match.availableUsers)
                    ? match.availableUsers.filter((u) => memberIds.has(String(u.id)))
                    : [];
                  return { ...match, homeTeamUsers: home, awayTeamUsers: away, availableUsers: available };
                });
              }
              if (typeof leagueData?.league?.maxGames === 'number') maxGamesFromDetails = leagueData.league.maxGames as number;

              // Get active season number (where isActive === true)
              const seasons = leagueData?.league?.seasons as unknown;
              const currentSeason = leagueData?.league?.currentSeason as
                | { seasonNumber?: number }
                | undefined;
              console.log(`[League ${l.id}] All seasons from backend:`, seasons);
              console.log(`[League ${l.id}] Current season from backend:`, currentSeason);

              // Use currentSeason from backend (which is the user's actual season)
              if (currentSeason && typeof currentSeason.seasonNumber === 'number') {
                seasonNumberFromDetails = currentSeason.seasonNumber;
                console.log(`[League ${l.id}] Setting season number to user's season:`, seasonNumberFromDetails);
              } else if (typeof seasonNumberFromSeasonsApi === 'number' && seasonNumberFromSeasonsApi > 0) {
                seasonNumberFromDetails = seasonNumberFromSeasonsApi;
                console.log(`[League ${l.id}] Setting season number from seasons API:`, seasonNumberFromDetails);
              } else if (Array.isArray(seasons) && seasons.length > 0) {
                console.log(`[League ${l.id}] Total seasons found:`, seasons.length);
                seasons.forEach((seasonItem) => {
                  const season = seasonItem as { seasonNumber?: number; isActive?: boolean } | null;
                  console.log(`[League ${l.id}] Season ${season?.seasonNumber}: isActive=${season?.isActive}`);
                });

                const seasonRecords = seasons
                  .map((seasonItem) =>
                    (seasonItem && typeof seasonItem === 'object')
                      ? (seasonItem as Record<string, unknown>)
                      : null
                  )
                  .filter((seasonItem): seasonItem is Record<string, unknown> => Boolean(seasonItem));

                const parseSeasonNumberFromDetails = (seasonLike: Record<string, unknown>): number => {
                  const rawNum = seasonLike.seasonNumber;
                  const direct = typeof rawNum === 'number'
                    ? rawNum
                    : (typeof rawNum === 'string' ? Number(rawNum) : NaN);
                  if (Number.isFinite(direct) && direct > 0) return direct;

                  const label = String(seasonLike.name || '');
                  const hits = label.match(/\d+/g);
                  if (hits && hits.length > 0) {
                    const parsed = Number(hits[hits.length - 1]);
                    if (Number.isFinite(parsed) && parsed > 0) return parsed;
                  }

                  return 0;
                };

                const activeSeasonFromDetails = seasonRecords.find((seasonRecord) => {
                  const status = String(seasonRecord.status || '').trim().toLowerCase();
                  return (
                    seasonRecord.isActive === true ||
                    seasonRecord.active === true ||
                    status === 'active' ||
                    status === 'current' ||
                    status === 'ongoing'
                  );
                });

                const seasonToUse = activeSeasonFromDetails || [...seasonRecords].sort((a, b) => {
                  const aNum = parseSeasonNumberFromDetails(a);
                  const bNum = parseSeasonNumberFromDetails(b);
                  return bNum - aNum;
                })[0];

                const chosenSeasonNumber = seasonToUse ? parseSeasonNumberFromDetails(seasonToUse) : 0;
                if (chosenSeasonNumber > 0) {
                  seasonNumberFromDetails = chosenSeasonNumber;
                  console.log(`[League ${l.id}] Setting season number to latest/active season:`, seasonNumberFromDetails);
                } else {
                  console.log(`[League ${l.id}] No valid season number found in details payload`);
                }
              } else {
                console.log(`[League ${l.id}] No seasons array or empty`);
              }
            }

            // Update this league entry in-place
            setUserLeagues((prev) => {
              const arr = prev.map((item) => {
                if (String(item.id) !== String(l.id)) return item;
                const enriched: LeagueWithComputed = {
                  ...item,
                  maxGames: maxGamesFromDetails ?? item.maxGames,
                  matches: matchesFromDetails ?? item.matches,
                  seasonNumber: seasonNumberFromDetails ?? item.seasonNumber,
                };
                // Normalize defaults
                return {
                  ...enriched,
                  status: typeof enriched?.status === 'string' && enriched.status!.trim() !== '' ? enriched.status : 'active',
                  active: typeof enriched?.active === 'boolean' ? enriched.active : true,
                  archived: typeof enriched?.archived === 'boolean' ? enriched.archived : false,
                };
              });
              return arr;
            });

            // CRITICAL: Update selectedLeague if this is the currently selected league
            setSelectedLeague((prev) => {
              if (prev && String(prev.id) === String(l.id)) {
                const updated: LeagueWithComputed = {
                  ...prev,
                  maxGames: maxGamesFromDetails ?? prev.maxGames,
                  matches: matchesFromDetails ?? prev.matches,
                  seasonNumber: seasonNumberFromDetails ?? prev.seasonNumber,
                  status: typeof prev?.status === 'string' && prev.status!.trim() !== '' ? prev.status : 'active',
                  active: typeof prev?.active === 'boolean' ? prev.active : true,
                };
                console.log(`[League ${l.id}] Updated selectedLeague seasonNumber to:`, updated.seasonNumber);
                return updated;
              }
              return prev;
            });
          } catch (enrichError) {
            // Ignore abort errors - they're expected when component unmounts
            if (enrichError instanceof Error && enrichError.name === 'AbortError') {
              return;
            }
            // Silently ignore other enrichment failures
          }
        });
      } catch (error) {
        // Ignore abort errors - they're expected when component unmounts
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching leagues:', error);
      } finally {
        setLoading(false);
        setNetworkDone(true);
      }
    };

    fetchUserLeagues();
    return () => aborter.abort();
  }, [token, refreshKey, dispatch, createdLeague, currentUserId]);

  // Hydrate instantly from local cache to avoid delay on tab/page return
  useEffect(() => {
    try {
      // Use ultra-fast instant cache - 0ms retrieval!
      const leagues = leagueAPI.getAllInstant();

      if (!Array.isArray(leagues) || leagues.length === 0) return;

      const minimal: LeagueWithComputed[] = leagues.map((l) => ({
        id: (l as unknown as { id: string | number }).id,
        name: (l as unknown as { name?: string }).name,
        status: (l as unknown as { status?: string }).status || 'active',
        active: typeof (l as unknown as { active?: boolean }).active === 'boolean' ? (l as unknown as { active?: boolean }).active! : true,
        archived: typeof (l as unknown as { archived?: boolean }).archived === 'boolean' ? (l as unknown as { archived?: boolean }).archived! : false,
        updatedAt: (l as unknown as { updatedAt?: string }).updatedAt,
        createdAt: (l as unknown as { createdAt?: string }).createdAt,
        image: (l as unknown as { image?: string }).image,
        userRole: computeUserRoleForCreatedLeague(l as unknown as League, currentUserId),
        maxGames: (l as unknown as { maxGames?: number }).maxGames,
      }));

      if (minimal.length) {
        setUserLeagues((prev) => prev.length ? prev : minimal);
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
        const preferred = storedId ? minimal.find(l => String(l.id) === String(storedId)) || null : null;
        if (preferred) {
          setSelectedLeague((prev) => prev ?? preferred);
        } else {
          const latest = [...minimal].sort((a, b) => timeOf(b) - timeOf(a))[0];
          if (latest) setSelectedLeague((prev) => prev ?? latest);
        }
      }
    } catch { /* ignore cache issues */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a new league is created in the parent, immediately add/select it without waiting for a refetch
  useEffect(() => {
    if (!createdLeague || !createdLeague.id) return;
    // Save as preferred league immediately so it's remembered across navigations
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERRED_LEAGUE_KEY, String(createdLeague.id));
      }
    } catch { }
    setUserLeagues(prev => {
      const map = new Map(prev.map(l => [String(l.id), l]));
      const entry: LeagueWithComputed = {
        id: String(createdLeague.id),
        name: createdLeague.name,
        image: createdLeague.image,
        updatedAt: createdLeague.updatedAt,
        createdAt: createdLeague.createdAt,
        status: createdLeague.status,
        active: createdLeague.active,
        userRole: computeUserRoleForCreatedLeague(createdLeague, currentUserId),
      };
      map.set(String(entry.id), entry);
      return Array.from(map.values());
    });
    setSelectedLeague({
      id: String(createdLeague.id),
      name: createdLeague.name,
      image: createdLeague.image,
      updatedAt: createdLeague.updatedAt,
      createdAt: createdLeague.createdAt,
      status: createdLeague.status,
      active: createdLeague.active,
      userRole: computeUserRoleForCreatedLeague(createdLeague, currentUserId),
    });
  }, [createdLeague]);

  // Debug: whenever leagues change, log visible (not-completed) counts
  useEffect(() => {
    try {
      if (!userLeagues?.length) return;
      const visible = userLeagues.filter(
        (l) => l.active !== false && l.archived !== true && !leagueIsCompleted(l)
      );
      console.log('[Home] leagues total:', userLeagues.length, 'visible (not completed):', visible.length);
    } catch { }
  }, [userLeagues]);

  // Keep selected league at top
  const sortedUserLeagues = React.useMemo(() => {
    if (!userLeagues?.length) return [];
    // Only show ACTIVE & INCOMPLETE leagues in the dropdown
    // Inactive leagues (completed / archived / admin-deactivated) go to Leagues page
    const visible = userLeagues.filter(
      (l) => l.active !== false && l.archived !== true && !leagueIsCompleted(l)
    );
    // Sort alphabetically by name (A -> Z)
    const arr = [...visible].sort((a, b) => {
      const an = (a?.name ?? '').toString().trim().toLowerCase();
      const bn = (b?.name ?? '').toString().trim().toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      // Tiebreaker by id for stability
      return String(a.id).localeCompare(String(b.id));
    });
    return arr;
  }, [userLeagues, selectedLeague]);

  // Keep the button visible even while fetching; show inline loader in the button instead of a separate skeleton

  if (networkDone && userLeagues.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography
          variant="body1"
          sx={{
            color: '#666',
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            textAlign: 'center'
          }}
        >
          {`You haven't joined any league yet.`}
        </Typography>
        {/* <Link href="/all-leagues" passHref>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#43a047',
              color: 'white',
              '&:hover': { bgcolor: '#388e3c' },
              minHeight: { xs: '60px', sm: '70px', md: '50px' },
              minWidth: { xs: '280px', sm: '320px' },
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
              fontWeight: 'bold',
              mb: -1.5
            }}
          >
            Join a League
          </Button>
        </Link> */}
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      maxWidth: { xs: '100%', sm: '100%', md: 290 },
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1000,
    }} ref={dropdownRef}>
      <Box sx={{ width: '100%', position: 'relative' }}>
        <Button
          variant="contained"
          sx={{
            bgcolor: '#00a77f',
            color: 'white',
            '&:hover': { bgcolor: '#00A77F' },
            minHeight: { xs: '60px', sm: '70px', md: '50px' },
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
            fontSize: { xs: '0.95rem', sm: '1.05rem', md: '15px' },
            fontWeight: 'normal',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(67,160,71,0.3)',
            border: '2px solid #fff',
            ...(showDropdown && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            })
          }}
          // Clicking the main button opens the list
          onClick={(e) => {
            e.stopPropagation();
            if (isFetching) return; // Disable open while loading
            setShowDropdown(true);
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, width: '100%', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexGrow: 1, minWidth: 0 }}>
              {isFetching ? (
                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
              ) : (
                <Image src={selectedLeague?.image || trophy} alt='' height={24} width={24} style={{ height: 24, width: 24 }} />
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start', minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: getLeagueLabelFontSize(selectedLeague?.name),
                    fontWeight: 600,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textTransform: 'capitalize',
                    maxWidth: '100%',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                  }}
                >
                  {isFetching
                    ? 'Loading…'
                    : (selectedLeague?.name ? formatLeagueNameShort(selectedLeague.name) : 'Select a league')}
                </Typography>
                {!isFetching && selectedLeague?.name && (
                  <Typography
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.75rem' },
                      fontWeight: 'normal',
                      opacity: 0.9,
                      lineHeight: 1,
                      marginLeft: 0
                    }}
                  >
                    (Season {selectedLeague?.seasonNumber || 1})
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Role pill for the currently selected league */}
            {/* {selectedLeague?.userRole && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: '9999px',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  bgcolor: selectedLeague.userRole === 'ADMIN' ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
                  color: selectedLeague.userRole === 'ADMIN' ? '#00A77F' : '#FFFFFF',
                  border: selectedLeague.userRole === 'ADMIN' ? '1px solid rgba(0,167,127,0.65)' : '1px solid rgba(255,255,255,0.35)'
                }}
              >
                {selectedLeague.userRole === 'ADMIN' ? 'Admin' : 'Member'}
              </Box>
            </Box>
          )} */}

            <Box
              sx={{
                color: 'white',
                cursor: 'pointer',
                borderRadius: '50%',
                width: { xs: 34, md: 40 },
                height: { xs: 34, md: 40 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                },
                transition: 'background-color 0.2s'
              }}
              role="button"
              tabIndex={0}
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
              aria-controls="league-dropdown-list"
              onClick={(e) => {
                e.stopPropagation();
                if (isFetching) return; // Disable toggle while loading
                setShowDropdown(prev => !prev);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isFetching) return;
                  setShowDropdown(prev => !prev);
                }
              }}
            >
              <ChevronRight size={24} style={{ transform: showDropdown ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </Box>
          </Box>
        </Button>

        {/* Dropdown menu */}
        {showDropdown && !isFetching && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              transform: 'none',
              height: 'auto',
              maxHeight: { xs: 220, sm: 250, md: 280 },
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 0.5,
              zIndex: 99999,
              bgcolor: '#00A77F',
              color: '#FFFFFF',
              borderRadius: 2,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              border: '2px solid #FFFFFF',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.14)',
                borderRadius: 10,
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.55)',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.1)',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(255,255,255,0.75)',
              },
              msOverflowStyle: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.65) rgba(255,255,255,0.14)',
            }}
            id="league-dropdown-list"
            role="listbox"
          >
            {sortedUserLeagues.map((league) => {
              const isActive = league.id === selectedLeague?.id;
              return (
                <Link href={`/league/${league.id}`} key={league.id} passHref>
                  <MenuItem
                    key={league.id}
                    onClick={() => {
                      try {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem(PREFERRED_LEAGUE_KEY, String(league.id));
                        }
                      } catch { }
                      setSelectedLeague(league);
                      setShowDropdown(false);
                    }}
                    role="option"
                    aria-selected={isActive}
                    sx={{
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#FFFFFF',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                      },
                      ...(isActive && {
                        backgroundColor: 'rgba(255,255,255,0.20)',
                        border: '1px solid rgba(255,255,255,0.65)',
                      }),
                    }}
                  >

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Trophy size={18} color={isActive ? '#FFFFFF' : '#E7F6EF'} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start' }}>
                        <Typography
                          sx={{
                            fontSize: '0.95rem',
                            fontWeight: isActive ? 700 : 500,
                            letterSpacing: 0.2,
                            color: '#FFFFFF',
                            lineHeight: 1.2
                          }}
                        >
                          {formatLeagueName(league.name)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 400,
                            letterSpacing: 0.1,
                            color: '#FFFFFF',
                            opacity: 0.85,
                            lineHeight: 1,
                            marginLeft: 0
                          }}
                        >
                          (Season {league.seasonNumber || 1})
                        </Typography>
                      </Box>
                    </Box>
                    {/* Role pill on the right */}
                    {league.userRole && (
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: '9999px',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: 0.4,
                            textTransform: 'uppercase',
                            bgcolor: league.userRole === 'ADMIN' ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
                            color: league.userRole === 'ADMIN' ? '#00A77F' : '#FFFFFF',
                            border: league.userRole === 'ADMIN' ? '1px solid rgba(0,167,127,0.65)' : '1px solid rgba(255,255,255,0.35)'
                          }}
                        >
                          {league.userRole === 'ADMIN' ? 'Admin' : 'Member'}
                        </Box>
                      </Box>
                    )}
                  </MenuItem>
                </Link>

              );
            })}
          </Box>
        )}
      </Box>

      {/* Add New Season Button */}
      {selectedLeague && selectedLeague.userRole === 'ADMIN' && (
        <Button
          disabled={isCreatingSeason || isFetching}
          onClick={openCreateSeasonConfirm}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#7f7f7f',
            color: 'white',
            fontWeight: 600,
            mb: 1,
            mt: 1,

            borderRadius: 2,
            '&:hover': { bgcolor: '#686868' },
            width: '100%',
            maxWidth: { xs: '100%', md: 290 },
            mx: 'auto',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            px: { xs: 2, md: 3 },
            fontSize: { xs: '15px', sm: '16px', md: '19px' },
            minHeight: { xs: 42, md: 48 },
            fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
            lineHeight: '100%',
            letterSpacing: '0%',
            textTransform: 'capitalize',
          }}
        >
          <Box
            component="span"
            sx={{
              position: 'absolute',
              left: { xs: 12, md: 22.5 },
              fontSize: { xs: '20px', md: '24px' },
              lineHeight: 1,
            }}
          >
            +
          </Box>
          {isCreatingSeason ? 'Creating Season...' : 'Add New Season'}
        </Button>
      )}

      <Dialog
        open={seasonConfirmOpen}
        onClose={closeCreateSeasonConfirm}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15,15,15,0.96)',
            color: '#E5E7EB',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#E5E7EB', fontWeight: 700 }}>
          Create New Season
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#9CA3AF' }}>
            Do you want to create a new season?
          </Typography>
          <Typography sx={{ color: '#D1D5DB', mt: 1.5, fontSize: '0.9rem' }}>
            Note: Players from the previous season will be moved to the new season, and after creation you will be taken to the new season league table.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={closeCreateSeasonConfirm} sx={{ color: '#E5E7EB' }}>
            No
          </Button>
          <Button
            variant="contained"
            onClick={confirmCreateSeason}
            disabled={isCreatingSeason}
            sx={{
              bgcolor: '#27ab83',
              '&:hover': { bgcolor: '#1e8463' },
            }}
          >
            {isCreatingSeason ? 'Creating...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};















// // League Selection Component
// const LeagueSelectionComponent = ({}: { user: User }) => {
//   const [userLeagues, setUserLeagues] = useState<League[]>([]);
//   const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
//   const [loading, setLoading] = useState(true);
//   const { token } = useAuth();

//   // Function to format league name
//   const formatLeagueName = (name: string) => {
//     if (!name) return '';

//     // Split the name into words
//     const words = name.split(' ');

//     // Capitalize first letter of each word
//     const capitalizedWords = words.map(word =>
//       word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//     );

//     // Get first character of each word
//     const firstChars = words.map(word => word.charAt(0).toUpperCase());

//     // Create the formatted name
//     const formattedName = capitalizedWords.join(' ');
//     const abbreviation = `(${firstChars.join('')})`;

//     return `${formattedName} ${abbreviation}`;
//   };

//   // Fetch user's leagues
//   useEffect(() => {
//     const fetchUserLeagues = async () => {
//       if (!token) return;

//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           if (data.success && data.user) {
//             // Combine joined and managed leagues
//             const leagues = [
//               ...(data.user.leagues || []),
//               ...(data.user.administeredLeagues || [])
//             ];

//             // Remove duplicates
//             const uniqueLeagues = Array.from(new Map(leagues.map(league => [league.id, league])).values());
//             setUserLeagues(uniqueLeagues);

//             // Set the most recent league as default
//             if (uniqueLeagues.length > 0) {
//               setSelectedLeague(uniqueLeagues[0]);
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching leagues:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserLeagues();
//   }, [token]);

//   // If user has no leagues
//   if (!loading && userLeagues.length === 0) {
//     return (
//       <Box sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         // py: 2
//       }}>
//         <Typography
//           variant="body1"
//           sx={{
//             color: '#666',
//             mb: 1,
//             fontSize: { xs: '0.9rem', sm: '1rem' },
//             textAlign: 'center'
//           }}
//         >
//          {` You haven't joined any league yet.`}
//         </Typography>
//         <Link href="/all-leagues" passHref>
//           <Button
//             variant="contained"
//             sx={{
//               bgcolor: '#43a047',
//               color: 'white',
//               '&:hover': { bgcolor: '#388e3c' },
//               minHeight: { xs: '60px', sm: '70px', md: '50px' },
//           minWidth: { xs: '280px', sm: '320px' },
//           fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
//               fontWeight: 'bold',
//               mb:-1.5
//             }}
//           >
//             Join a League
//           </Button>
//         </Link>
//       </Box>
//     );
//   }

//   // If user has leagues
//   return (
//     <Box sx={{
//       width: '100%',
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center'
//     }}>
//       <Button
//         variant="contained"
//         sx={{
//           bgcolor: '#43a047',
//           color: 'white',
//           '&:hover': { bgcolor: '#388e3c' },
//           minHeight: { xs: '60px', sm: '70px', md: '50px' },
//           minWidth: { xs: '280px', sm: '320px' },
//           fontSize: { xs: '1rem', sm: '1.1rem', md: '0.5rem' },
//           fontWeight: 'bold',
//           textTransform: 'none',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           // px: { xs: 2, sm: 3 },
//           // py: { xs: 1.5, sm: 2 },
//           borderRadius: 2,
//           boxShadow: '0 4px 12px rgba(67,160,71,0.3)',
//           border: '2px solid #fff',
//         }}
//         onClick={() => {
//           // Navigate to the selected league
//           if (selectedLeague) {
//             window.location.href = `/league/${selectedLeague.id}`;
//           }
//         }}
//       >
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//   {/* Trophy and league name */}
//   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//     <Trophy size={24} color="white" />
//     <Typography
//       sx={{
//         fontSize: { xs: '1rem', sm: '1.1rem', md: '1rem' },
//         fontWeight: 'semibold'
//       }}
//     >
//       {selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Loading...'}
//     </Typography>
//   </Box>

//   {/* Right arrow to show all leagues */}
//   <IconButton 
//     onClick={() => setSelectedLeague(null)} // Reset selected league to show all
//     sx={{ 
//       color: 'white',
//       ml: 2, // Add some margin
//       '&:hover': {
//         backgroundColor: 'rgba(255,255,255,0.1)'
//       }
//     }}
//   >
//     <ChevronRight size={24} /> {/* Right arrow icon */}
//   </IconButton>
// </Box>
//       </Button>
//     </Box>
//         // {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 6 }}>
//         //   <Trophy size={24} color="white" />
//         //   <Typography
//         //     sx={{
//         //       fontSize: { xs: '1rem', sm: '1.1rem', md: '1rem' },
//         //       fontWeight: 'semibold'
//         //     }}
//         //   >
//         //     {selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Loading...'}
//         //   </Typography>
//         // </Box> */}
//         // {/* <RiArrowRightLine size={20} color="white" /> */}
//   );
// };

export default function PlayerDashboard() {
  const theme = useTheme();
  const isMobileCreateDialog = useMediaQuery(theme.breakpoints.down('sm'));
  const [inviteCode, setInviteCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueImage, setLeagueImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [leagueNameError, setLeagueNameError] = useState<string>('');
  const [maxGames, setMaxGames] = useState<string>('20');
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const [, setLeagues] = useState<League[]>([]);
  const [, setLoading] = useState(true);
  // Trigger to force LeagueSelectionComponent to refetch
  const [leaguesRefreshKey, setLeaguesRefreshKey] = useState(0);
  // Pass the newly created league down so it appears instantly
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);
  // Track whether the selected league has admin role (for conditional spacing)
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);
  // File input ref to allow re-selecting the same image
  const createLeagueFileInputRef = useRef<HTMLInputElement | null>(null);

  // User global stats state
  const [userStats, setUserStats] = useState({
    matchesPlayed: 0,
    motmVotes: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    defensiveImpact: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const [, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    // Only run on client
    const handleResize = () => setWindowWidth(window.innerWidth);
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  const dispatchLeagueMutationEvent = useCallback(
    (eventName: 'league-created' | 'league-updated' | 'league-deleted', detail: Record<string, unknown>) => {
      if (typeof window === 'undefined') return;
      try {
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() },
          })
        );
      } catch {
        // ignore event dispatch errors
      }
    },
    []
  );

  // Fetch user global stats
  useEffect(() => {
    const fetchUserStats = async () => {
      console.log('🔍 [Stats Fetch] Starting...');
      console.log('🔍 [Stats Fetch] Token:', token ? 'Present' : 'Missing');
      console.log('🔍 [Stats Fetch] User ID:', user?.id);

      if (!token || !user?.id) {
        console.log('❌ [Stats Fetch] Skipped - Missing token or user ID');
        return;
      }

      setStatsLoading(true);
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/users/me/global-stats`;
        console.log('🔍 [Stats Fetch] URL:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('🔍 [Stats Fetch] Response status:', response.status);

        if (!response.ok) {
          console.error('❌ [Stats Fetch] Response not OK:', response.status);
          return;
        }

        const data = await response.json().catch(() => null);
        console.log('🔍 [Stats Fetch] Response data:', data);

        if (data) {
          if (data.success && data.stats) {
            console.log('✅ [Stats Fetch] Stats loaded:', data.stats);
            setUserStats(data.stats);
          } else {
            console.warn('⚠️ [Stats Fetch] Response OK but no stats:', data);
          }
        } else {
          console.error('❌ [Stats Fetch] Response not OK:', response.status, data);
        }
      } catch (error) {
        console.error('❌ [Stats Fetch] Error:', error);
      } finally {
        setStatsLoading(false);
        console.log('🔍 [Stats Fetch] Complete');
      }
    };

    fetchUserStats();
  }, [token, user?.id]);

  // Debug: log user details when it becomes available/changes
  useEffect(() => {
    console.log('[PlayerDashboard] User from store:', user);
    if (user) {
      try {
        console.log('[PlayerDashboard] User details:', {
          id: user?.id,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email,
          position: user?.position,
          xp: user?.xp,
          shirtNumber: user?.shirtNumber,
          profilePicture: user?.profilePicture
        });
      } catch (e) {
        console.warn('[PlayerDashboard] Failed to log user details:', e);
      }
    }
  }, [user]);

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      // Dispatch join and get the joined league payload
      const payload: unknown = await dispatch(joinLeague(inviteCode.trim().toUpperCase())).unwrap();

      // Accept either a direct League object or a wrapped { league: League }
      let joined: League | undefined;
      if (typeof payload === 'object' && payload !== null && 'league' in payload) {
        const maybeLeague = (payload as { league?: unknown }).league;
        if (typeof maybeLeague === 'object' && maybeLeague !== null && 'id' in maybeLeague) {
          joined = maybeLeague as League;
        }
      } else if (typeof payload === 'object' && payload !== null && 'id' in payload) {
        joined = payload as League;
      }

      if (joined && joined.id) {
        const nowISO = new Date().toISOString();
        const normalized: League = {
          id: String(joined.id),
          name: joined.name ?? 'My League',
          inviteCode: joined.inviteCode ?? '',
          image: joined.image ?? '',
          createdAt: joined.createdAt ?? nowISO,
          updatedAt: joined.updatedAt ?? joined.createdAt ?? nowISO,
          members: joined.members ?? [],
          administrators: joined.administrators ?? [],
          matches: joined.matches ?? [],
          active: joined.active ?? true,
          maxGames: joined.maxGames ?? 0,
          showPoints: joined.showPoints ?? true,
          adminId: joined.adminId,
          description: joined.description,
          location: joined.location,
          maxTeams: joined.maxTeams,
          currentTeams: joined.currentTeams,
          status: (joined.status === 'active' || joined.status === 'inactive' || joined.status === 'completed') ? joined.status : 'active',
        };

        // Update local caches and UI immediately
        updateLeaguesCacheWithNewLeague();
        setCreatedLeague(normalized); // instantly visible in selector
        setLeaguesRefreshKey((k) => k + 1); // background refetch to stay in sync
        dispatchLeagueMutationEvent('league-created', { leagueId: String(normalized.id), reason: 'joined-league' });
        dispatchLeagueMutationEvent('league-updated', { leagueId: String(normalized.id), reason: 'joined-league' });
      } else {
        // If API didn't include league payload, still trigger a background refresh to get latest
        setLeaguesRefreshKey((k) => k + 1);
        dispatchLeagueMutationEvent('league-updated', { reason: 'joined-league-no-payload' });
      }

      setInviteCode('');
      toast.success('Successfully joined league!');
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to join league';
      toast.error(errorMessage);
    }
  };

  const updateLeaguesCacheWithNewLeague = useCallback(() => {
    // Update ultra-fast cache instantly
    leagueAPI.invalidateCache();
  }, []);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error('Please enter a league name');
      return;
    }
    const gamesNum = Number(maxGames);
    if (!maxGames || isNaN(gamesNum) || gamesNum < 1 || gamesNum > 100) {
      toast.error('Number of games must be between 1 and 100');
      return;
    }
    setIsCreating(true);
    try {
      console.log('Creating league:', leagueName.trim());
      const formData = new FormData();
      formData.append('name', leagueName.trim());
      formData.append('maxGames', String(gamesNum));
      if (leagueImage) formData.append('image', leagueImage);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // 'Content-Type' mat lagayen, FormData khud set karega
        },
        body: formData
      });

      const data = await response.json();
      console.log('Create league response:', data);

      if (data.success) {
        console.log('League created successfully, refreshing list...');
        toast.success('League created successfully!');
        setIsDialogOpen(false);
        setLeagueName('');
        setLeagueImage(null);
        setImagePreview(null);
        setMaxGames('20');

        // Update the leagues cache with the new league
        if (data.league) {
          const nowISO = new Date().toISOString();
          const status: 'active' | 'inactive' | 'completed' =
            (data.league.status === 'active' || data.league.status === 'inactive' || data.league.status === 'completed')
              ? data.league.status
              : 'active';

          const newLeague: League = {
            id: String(data.league.id),
            name: data.league.name ?? 'My League',
            inviteCode: data.league.inviteCode ?? '',
            image: data.league?.image ?? '',
            createdAt: typeof data.league.createdAt === 'string' ? data.league.createdAt : nowISO,
            updatedAt: typeof data.league.updatedAt === 'string'
              ? data.league.updatedAt
              : (typeof data.league.createdAt === 'string' ? data.league.createdAt : nowISO),
            members: [],
            administrators: user ? [user] : [],
            matches: [],
            active: typeof data.league.active === 'boolean' ? data.league.active : true,
            maxGames: typeof data.league.maxGames === 'number' ? data.league.maxGames : 0,
            showPoints: typeof data.league.showPoints === 'boolean' ? data.league.showPoints : true,
            adminId: data.league.adminId,
            description: data.league.description,
            location: data.league.location,
            maxTeams: data.league.maxTeams,
            currentTeams: data.league.currentTeams,
            status,
          };

          // Update cache with new league
          updateLeaguesCacheWithNewLeague();
          dispatchLeagueMutationEvent('league-created', { leagueId: String(newLeague.id), reason: 'created-league' });
          dispatchLeagueMutationEvent('league-updated', { leagueId: String(newLeague.id), reason: 'created-league' });

          // Update local state
          setLeagues(prevLeagues => [newLeague, ...prevLeagues]);
          console.log('Updated cache and local state with new league:', newLeague);

          // Make it show up immediately and trigger a refetch to stay in sync
          setCreatedLeague(newLeague);
          setLeaguesRefreshKey(k => k + 1);
        }
      } else {
        console.error('Failed to create league:', data.message);
        toast.error(data.message || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      toast.error('An error occurred while creating the league');
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setLeagueImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLeagueImage(null);
    setImagePreview(null);
    // Also clear the file input so the same file can be selected again
    try {
      if (createLeagueFileInputRef.current) {
        createLeagueFileInputRef.current.value = '';
      }
    } catch { }
  };

  // const items = [
  //   { label: 'League', icon: league, url: 'all-leagues' },
  //   { label: 'Matches', icon: matches, url: 'all-matches' },
  //   { label: 'Dream Team', icon: dreamteam, url: 'dream-team' },
  //   { label: 'Players', icon: players, url: 'all-players' },
  //   { label: 'Trophy Room', icon: trophy, url: 'trophy-room' },
  //   { label: 'Leader Board', icon: leaderboard, url: 'leader-board' },
  // ];

  return (
    <Box sx={{ px: 0, py: 0, minHeight: '100vh', width: '100%' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Paper
        elevation={0}
        sx={{
          backgroundImage: `url(${dash.src})`,
          backgroundSize: { xs: 'cover', md: '100% 100%' },
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          borderRadius: 0,
          overflow: 'visible',
          p: { xs: 0, md: 3 },
          pt: { xs: 2, md: 4 },
          mb: 0,
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          mx: 'auto',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* User Live Stats Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: { xs: 2.5, md: 3 },
          px: { xs: 1.5, sm: 2, md: 0 },
          boxSizing: 'border-box',
          textAlign: 'center',
          color: 'white',
          zIndex: 10,
          width: '100%',
          maxWidth: '650px',
          height: 'auto',
          opacity: 1,
        }}>
          <Box component="div" sx={{
            fontFamily: 'var(--font-oswald), "Oswald", sans-serif',
            fontSize: { xs: '20px', sm: '24px', md: '28px' },
            fontWeight: 300,
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center',
            textTransform: 'uppercase',
            mb: { xs: 0.5, md: 0.3 },
          }}>
            your LIVE stats
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 0.2, md: 0.4 },
            alignItems: 'center'
          }}>
            {/* Row 1 */}
            <Box sx={{
              display: 'flex',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              justifyContent: 'center',
              columnGap: { xs: 1.25, sm: 2, md: 3 },
              rowGap: { xs: 0.4, md: 0 },
              fontFamily: 'var(--font-oswald), "Oswald", sans-serif',
              fontSize: { xs: '12px', sm: '16px', md: '28px' },
              fontWeight: 300,
              textTransform: 'uppercase',
              lineHeight: { xs: 1.15, md: '100%' },
              letterSpacing: '0%',
              textAlign: 'center',
              whiteSpace: { xs: 'normal', md: 'nowrap' },
            }}>
              <Box component="span" sx={{ color: '#ffff99' }}>
                {statsLoading ? '...' : userStats.matchesPlayed} MATCH{userStats.matchesPlayed !== 1 ? 'ES' : ''} PLAYED
              </Box>
              <Box component="span" sx={{ color: '#ff9933' }}>
                {statsLoading ? '...' : userStats.motmVotes} MOTM VOTE{userStats.motmVotes !== 1 ? 'S' : ''}
              </Box>
              <Box component="span" sx={{ color: '#ffff99' }}>
                {statsLoading ? '...' : userStats.goals} GOAL{userStats.goals !== 1 ? 'S' : ''}
              </Box>
            </Box>

            {/* Row 2 */}
            <Box sx={{
              display: 'flex',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              justifyContent: 'center',
              columnGap: { xs: 1.25, sm: 2, md: 3 },
              rowGap: { xs: 0.4, md: 0 },
              fontFamily: 'var(--font-oswald), "Oswald", sans-serif',
              fontSize: { xs: '12px', sm: '16px', md: '28px' },
              fontWeight: 300,
              textTransform: 'uppercase',
              lineHeight: { xs: 1.15, md: '100%' },
              letterSpacing: '0%',
              textAlign: 'center',
              whiteSpace: { xs: 'normal', md: 'nowrap' },
            }}>
              <Box component="span" sx={{ color: '#ff9933' }}>
                {statsLoading ? '...' : userStats.assists} ASSIST{userStats.assists !== 1 ? 'S' : ''}
              </Box>
              <Box component="span" sx={{ color: '#ffff99' }}>
                {statsLoading ? '...' : userStats.cleanSheets} CLEAN SHEET{userStats.cleanSheets !== 1 ? 'S' : ''}
              </Box>
              <Box component="span" sx={{ color: '#ff9933' }}>
                {statsLoading ? '...' : userStats.defensiveImpact} DEFENSIVE IMPACT
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'stretch' },
          gap: { xs: 1.25, sm: 1.5, md: 0 },
          // gap: { xs: 2, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          // backgroundColor: 'black',
          width: '100%',
          maxWidth: { xs: '100%', sm: '620px' },
          px: { xs: 1.25, sm: 2, md: 0 },
          boxSizing: 'border-box',
          height: { xs: 'auto', md: '416px' },
          pb: { xs: 0.75, sm: 0.5, md: 0 },
          overflow: 'visible',
          position: 'relative',
        }}>
          {/* Left Div - Player Card */}
          <Box sx={{
            flex: { xs: 'none', md: '0 0 300px' },
            width: { xs: '100%', md: '300px' },
            maxWidth: { xs: 300, sm: 340, md: 300 },
            height: { xs: '420px', sm: '430px', md: 'auto' },
            minHeight: { xs: '420px', sm: '430px', md: 0 },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'center' },
            mb: { xs: 2, md: 0 },
            mt: { xs: 1, md: 0 },
            order: { xs: 1, md: 1 },
            alignSelf: { xs: 'center', md: 'stretch' },
            // backgroundColor: 'red',
          }}>
            <PlayerCard
              name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Player Name'}
              number={user?.shirtNumber || '00'}
              points={user?.xp || 0}
              height="100%"
              stats={{
                DRI: user?.skills?.dribbling?.toString() || '',
                SHO: user?.skills?.shooting?.toString() || '',
                PAS: user?.skills?.passing?.toString() || '',
                PAC: user?.skills?.pace?.toString() || '',
                DEF: user?.skills?.defending?.toString() || '',
                PHY: user?.skills?.physical?.toString() || ''
              }}
              foot={user?.preferredFoot === "right" ? "R" : "L"}
              profileImage={user?.profilePicture || undefined}
              shirtIcon=""
              position={user?.position || 'XXX'}
              hideShareIcon={true}
            />
          </Box>

          {/* Right Div - White Card */}
          <Box
            sx={{
              flex: { xs: 'none', md: '0 0 310px' },
              maxWidth: { xs: '100%', md: '310px' },
              width: { xs: '100%', sm: '100%', md: '310px' },
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mt: { xs: 0.25, md: 0 },
              ml: { md: 0 },
              order: { xs: 2, md: 2 },
              alignSelf: { xs: 'center', md: 'auto' },

              position: 'relative',
              // backgroundColor: 'green',
              zIndex: 2,
            }}
          >
            {/* White Box */}
            <Box
              sx={{
                backgroundColor: '#fff',
                p: { xs: 2, sm: 2, md: 1.6 },
                mt: { xs: 0, md: 3 },
                borderRadius: { xs: '20px', md: '12px' },
                width: '100%',
                minHeight: 'auto'
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 1, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <Typography variant="h5" gutterBottom sx={{
                  fontWeight: '550',
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' },
                  color: 'black',
                  fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                }}>Welcome,</Typography>
                <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' }, fontWeight: 550, fontFamily: 'var(--font-woodford-bourne-pro), sans-serif' }}>
                  {user?.firstName}
                </Typography>
              </Box>

              <Divider sx={{ mb: 1, width: '100%', height: 2, bgcolor: '#00A77F' }} />

              <Box sx={{ textAlign: 'start' }}>
                <Typography variant="body2" sx={{
                  color: 'black',
                  mb: 0.5,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                  fontWeight: 400,
                  whiteSpace: { xs: 'normal', md: 'nowrap' },
                }}>
                  Your Current League In Which You Stand
                </Typography>

                {/* League Selection Component */}
                <LeagueSelectionComponent
                  refreshKey={leaguesRefreshKey}
                  createdLeague={createdLeague}
                  currentUserId={user?.id}
                  onAdminStatusChange={setIsLeagueAdmin}
                />

                {/* Add New Season Button */}
                {/* <Button
                  variant="contained"
                  fullWidth
                  startIcon={<span style={{ fontSize: '22px'}}>+</span>}
                  sx={{
                    bgcolor: '#7f7f7f',
                    color: 'white',
                    fontWeight: 600,
                    mb: 1,
                    mt: 1,
                    
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#686868' },
                    width: '100%',
                    maxWidth: 290,
                    mx: 'auto',
                    display: { xs: 'none', sm: 'none', md: 'flex' },
                    justifyContent: 'space-between',
                    px: 3,
                    pr: 10,
                    fontSize: '19px',
                    minHeight: 48,
                    fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textTransform: 'capitalize',
                  }}
                >
                  Add New Season
                </Button> */}

                {/* Add New League Button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setIsDialogOpen(true)}
                  sx={{
                    bgcolor: '#0388E3',
                    color: 'white',
                    fontWeight: 600,
                    mb: 1,
                    mt: isLeagueAdmin ? 0 : 1,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#0388E3', boxShadow: '0 2px 8px rgba(25,118,210,0.2)' },
                    width: '100%',
                    maxWidth: { xs: '100%', md: 290 },
                    mx: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    px: { xs: 2.5, md: 3 },
                    fontSize: { xs: '15px', md: '19px' },
                    minHeight: { xs: 42, md: 48 },
                    position: 'relative',
                    fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textTransform: 'capitalize',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      left: { xs: 12, md: 22.5 },
                      fontSize: { xs: '20px', md: '24px' },
                      lineHeight: 1,
                    }}
                  >
                    +
                  </Box>
                  Create New League
                </Button>

                {/* Invite Code Join Section */}
                <Box sx={{
                  mx: 'auto',
                  display: 'flex',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 },
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: { xs: '100%', md: 290 },
                  overflow: 'hidden'
                }}>
                  <TextField
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: '#DEDCDC',
                      borderRadius: { xs: '12px', sm: '12px 0 0 12px' },
                      flex: 1,
                      width: '100%',
                      minWidth: { xs: '100%', sm: 0 },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' }
                      },
                      '& .MuiInputBase-input': {
                        height: { xs: 38, md: 42 },
                        padding: { xs: '0 10px', md: '0 12px' },
                        fontSize: { xs: '12px', md: '14px' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{
                      background: '#00A77F',
                      borderRadius: { xs: '12px', sm: '0 12px 12px 0' },
                      '&:hover': { background: '#00A77F' },
                      py: 0,
                      width: { xs: '100%', sm: 'auto' },
                      minWidth: { xs: 0, sm: 120 },
                      height: { xs: 40, md: 42 },
                      fontSize: { xs: '16px', sm: '16px', md: '19px' },
                      flexShrink: 0,
                      fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                      fontWeight: 600,
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      textTransform: 'capitalize',
                    }}
                    onClick={handleJoinLeague}
                    startIcon={
                      <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                        <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                          <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                        </svg>
                      </Box>
                    }
                  >
                    Join League
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* World Ranking Button directly below */}
            <Button
              href="/world-ranking"
              component="a"
              fullWidth
              sx={{
                position: 'relative',
                textTransform: 'capitalize',
                background: 'linear-gradient(135deg,#004e5f,#007a95)',
                color: '#fff',
                py: 0,
                borderRadius: '12px',
                fontWeight: 600,
                letterSpacing: '0%',
                lineHeight: '100%',
                fontSize: { xs: '14px', sm: '16px', md: '19px' },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center',
                px: { xs: 1.5, md: 2 },
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                boxShadow: '0 8px 24px -6px rgba(0,78,95,0.55)',
                overflow: 'hidden',
                maxWidth: { xs: '100%', md: 310 },
                height: { xs: 42, md: 45 },
                mx: 'auto',
                fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 2,
                  padding: '2px',
                  background: 'linear-gradient(120deg,#30e8ff,#72ffa8,#30e8ff)',
                  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  opacity: 0.55
                },
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-40%',
                  width: '40%',
                  height: '100%',
                  background: 'linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0) 100%)',
                  transform: 'skewX(-18deg)',
                  animation: 'wr-shine 3.4s linear infinite'
                },
                '@keyframes wr-shine': {
                  '0%': { left: '-40%' },
                  '70%': { left: '140%' },
                  '100%': { left: '140%' }
                },
                '&:hover': {
                  background: 'linear-gradient(135deg,#005d72,#0092b1)',
                  boxShadow: '0 10px 28px -6px rgba(0,120,150,0.6)'
                }
              }}
            >
              <img src={wordImg.src} alt="World Ranking" width="18" height="18" />
              World Ranking
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* <Box sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 4 },
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <Box sx={{
            flex: { xs: 'none', md: '0 0 300px' },
            width: { xs: '100%', md: '90%' },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'center', md: 'center' },
            mb: { xs: 2, md: 0 }, // Add margin bottom on mobile
            mt: { xs: 1 }
          }}>
            <PlayerCard
              name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Player Name'}
              number={user?.shirtNumber || '00'}
              points={user?.xp || 0}
              stats={{
                DRI: user?.skills?.dribbling?.toString() || '',
                SHO: user?.skills?.shooting?.toString() || '',
                PAS: user?.skills?.passing?.toString() || '',
                PAC: user?.skills?.pace?.toString() || '',
                DEF: user?.skills?.defending?.toString() || '',
                PHY: user?.skills?.physical?.toString() || ''
              }}
              foot={user?.preferredFoot === "right" ? "R" : "L"}
              profileImage={user?.profilePicture || undefined}
              shirtIcon={''}
              position={user?.position || 'XXX'}
              hideShareIcon={true}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              backgroundColor: '#fff',
              p: { xs: 3, sm: 2, md: 1.5 },
              borderRadius: { xs: '20px 20px 20px 20px', md: 2 },
              maxWidth: { xs: '100%', md: '41%', lg: '33%' },
              width: { xs: '96%', sm: '70%', md: 'auto', lg: '33%' },
              textAlign: 'flex',
              mt: { xs: 'auto', md: -3 },
              minHeight: { xs: 'auto', md: 'auto' },
              mb: { xs: 2, md: 0 },
              alignSelf: { xs: 'center' },
              ml: { md: -2 },
            }}
          >
            <Box sx={{ display: 'inline-flex', gap: 1 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' },
                  color: 'black',
                }}
              >
                Welcome,
              </Typography>
              <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' }, fontWeight: 'semibold' }}>
                {user?.firstName}
              </Typography>
            </Box>

            <Divider sx={{ mb: 1.5, width: '100%', height: 2, bgcolor: 'green' }} />

            <Box sx={{ justifyContent: 'center', textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'black',
                  mb: 1.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Your Current League In Which You Stand
              </Typography>

              <LeagueSelectionComponent user={user} />

            <Button
              variant="contained"
              fullWidth
              onClick={() => setIsDialogOpen(true)}
              sx={{
                bgcolor: '#0388e3',
                color: 'white',
                fontWeight: 'bold',
                mb: 2,
                mt: 3,
                borderRadius: 2,
                '&:hover': { bgcolor: '#0388e3', boxShadow: '0 2px 8px rgba(25,118,210,0.2)', },
                width: '320px',
                mx: 'auto',
                display: {
                  xs: 'none',  // Show on extra small screens
                  sm: 'none',  // Show on small screens
                  md: 'block',   // Hide on medium screens and up
                }
              }}
            >
              + Create New League
            </Button>
            <Box sx={{
               mx: 'auto',
              alignItems: 'center', justifyContent: 'center', display: {
                xs: 'none',  // Show on extra small screens
                sm: 'none',  // Show on small screens
                md: 'block',   // Hide on medium screens and up
                maxWidth:'320px'
              }
            }}>
              <TextField
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: '#DEDCDC',
                  borderRadius: 3,
                  flex: 1,
                  maxWidth: 190,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                // color="success"
                sx={{ background: '#00a77f', borderRadius: 2, '&:hover': { background: '#00a77f' }, ml: -3, py: 1 }}
                onClick={handleJoinLeague}
                startIcon={
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                  </svg>
                }
              >
                Join League
              </Button>
            </Box>
            </Box>

          </Box>

        </Box> */}
      {/* <Paper
        elevation={3}
        sx={{
          // backgroundImage: `url(${Dashbg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          p: { xs: 0.5, sm: 3 }, // Less padding on mobile
          width: '100%', // Always full width
          boxShadow: { xs: 0, sm: 3 }, // Remove shadow on mobile for flush look
          mt: { xs: 2, md: 0 },
          display: { 
            xs: 'block',  // Show on extra small screens
            sm: 'block',  // Show on small screens
            md: 'none',   // Hide on medium screens and up
          },
        }}
      >
        <Button
          variant="contained"
          fullWidth
          onClick={() => setIsDialogOpen(true)}
          sx={{
            bgcolor: '#0388e3',
            color: 'white',
            fontWeight: 'bold',
            mb: 2,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
            '&:hover': { bgcolor: '#0388e3' },
            width: '300px',
          }}
        >
          + Create New League
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TextField
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: '#DEDCDC',
                  borderRadius: 3,
                  flex: 1,
                  maxWidth: 190,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                // color="success"
                sx={{ background: '#00a77f', borderRadius: 2, '&:hover': { background: '#00a77f' } , ml:-3 , py:1 }}
                onClick={handleJoinLeague}
                startIcon={
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                  </svg>
                }
              >
                Join League
              </Button>
        </Box>

      </Paper> */}
      <Paper
        elevation={0}
        sx={{
          backgroundImage: `url(${Dashbg.src})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          borderRadius: 0,
          overflow: 'hidden',
          p: 0,
          width: '100%',
          boxShadow: 'none',
          mt: 0,
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Create New League Button - Now matching Join League section width */}
        <Box sx={{
          width: { xs: '100%', sm: '380px' },
          display: 'flex',
          justifyContent: 'center',
          mb: 2
        }}>
          <Button
            variant="contained"
            onClick={() => setIsDialogOpen(true)}
            sx={{
              bgcolor: '#0388E3',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
              '&:hover': { bgcolor: '#0388E3' },
              width: { xs: '100%', sm: '315px' },
              height: '40px', // Fixed height to match Join button
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            + Create New League
          </Button>
        </Box>

        {/* Join League Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            mb: 3,
            width: { xs: '100%', sm: '380px' },
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <TextField
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: '#fff',
              borderRadius: '12px 0 0 12px',
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': {
                height: '40px', // Match button height
                padding: '0 14px',
                fontSize: '0.875rem'
              }
            }}
          />
          <Button
            variant="contained"
            sx={{
              background: '#00a77f',
              borderRadius: '0 12px 12px 0',
              '&:hover': { background: '#00a77f' },
              py: 1,
              height: '40px',
              minWidth: '120px',
              fontSize: '0.875rem',
              flexShrink: 0,
              fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
              fontWeight: 600,
              lineHeight: '100%',
              letterSpacing: '0%',
              textTransform: 'capitalize',
            }}
            onClick={handleJoinLeague}
            startIcon={
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
              </svg>
            }
          >
            Join League
          </Button>
        </Box>
      </Paper>

      <GlobalStyles styles={{
        '::-webkit-scrollbar': { width: 10 },
        '::-webkit-scrollbar-track': { background: '#0d2f1e' },
        '::-webkit-scrollbar-thumb': { background: '#1c5c37', borderRadius: 20, border: '2px solid #0d2f1e' },
        '::-webkit-scrollbar-thumb:hover': { background: '#257647' }
      }} />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobileCreateDialog}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: isMobileCreateDialog ? 0 : { xs: 2, sm: 3 },
            background: 'rgba(15,15,15,0.96)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            p: { xs: 1.2, sm: 1.6 },
            color: '#E5E7EB',
            width: { xs: '100%', sm: '100%' },
            m: { xs: 0, sm: 2 },
            maxWidth: 620,
            maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 64px)' },
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={1}
          sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -2,
              height: '2px',
              background: 'linear-gradient(90deg, rgba(229,106,22,0.75), rgba(207,35,38,0.75))',
            }
          }}
        >
          <DialogTitle sx={{ p: 0, fontWeight: 700, color: '#E5E7EB', fontSize: { xs: 19, sm: 22 }, letterSpacing: 0.5 }}>
            Create a League
          </DialogTitle>
          <IconButton
            onClick={() => setIsDialogOpen(false)}
            sx={{
              color: '#E5E7EB',
              bgcolor: 'rgba(255,255,255,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
            }}
          >
            <X />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.2, px: { xs: 1.2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
          <TextField
            autoFocus
            margin="dense"
            label="League Name"
            type="text"
            fullWidth
            variant="outlined"
            value={leagueName}
            onChange={(e) => {
              const raw = e.target.value;
              const hasInvalid = /[^A-Za-z0-9 ]/.test(raw);
              const sanitized = raw.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 30);
              setLeagueName(sanitized);
              setLeagueNameError(hasInvalid ? 'Only letters, numbers, and spaces are allowed.' : '');
            }}
            onKeyPress={(e) => {
              // Block special characters and allow Enter to submit
              const ch = e.key;
              if (ch.length === 1 && /[^A-Za-z0-9 ]/.test(ch)) {
                e.preventDefault();
                setLeagueNameError('Only letters, numbers, and spaces are allowed.');
                return;
              }
              if (e.key === 'Enter') {
                if (!leagueNameError && leagueName.trim().length > 0) {
                  handleCreateLeague();
                }
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData?.getData('text') ?? '';
              if (/[^A-Za-z0-9 ]/.test(text)) {
                e.preventDefault();
                setLeagueNameError('Only letters, numbers, and spaces are allowed.');
              }
            }}
            sx={{
              mt: 1,
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255,255,255,0.04)',
                color: '#E5E7EB',
                borderRadius: 2,
                border: '1.5px solid rgba(255,255,255,0.16)',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.18)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(229,106,22,0.9)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#E56A16',
                },
                '& input': {
                  color: '#E5E7EB',
                },
              },
              '& label': { color: '#9CA3AF' },
              '& .MuiInputLabel-root': { color: '#9CA3AF' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
            }}
            inputProps={{ maxLength: 30, 'aria-invalid': Boolean(leagueNameError) }}
            InputLabelProps={{ sx: { color: '#9CA3AF' } }}
            FormHelperTextProps={{ sx: { color: '#9CA3AF', '&.Mui-error': { color: '#f87171' } } }}
            error={Boolean(leagueNameError)}
            helperText={leagueNameError || 'Use letters, numbers, and spaces only (max 30).'}
          />

          {/* Number of Games in Season */}
          <TextField
            margin="dense"
            label="Number of Games"
            type="number"
            fullWidth
            variant="outlined"
            value={maxGames}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
              setMaxGames(v);
            }}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key) && e.key !== 'Enter') {
                e.preventDefault();
              }
              if (e.key === 'Enter' && !leagueNameError && leagueName.trim().length > 0) {
                handleCreateLeague();
              }
            }}
            sx={{
              mt: 1,
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255,255,255,0.04)',
                color: '#E5E7EB',
                borderRadius: 2,
                border: '1.5px solid rgba(255,255,255,0.16)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                '&:hover fieldset': { borderColor: 'rgba(229,106,22,0.9)' },
                '&.Mui-focused fieldset': { borderColor: '#E56A16' },
                '& input': { color: '#E5E7EB' },
              },
              '& label': { color: '#9CA3AF' },
              '& .MuiInputLabel-root': { color: '#9CA3AF' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
            }}
            inputProps={{ min: 1, max: 100 }}
            InputLabelProps={{ sx: { color: '#9CA3AF' } }}
            FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
            helperText="Number of games to be played in the current season (1–100)."
          />

          {/* League Image Upload Section */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ color: '#E5E7EB', mb: 1, fontWeight: 700 }}>
              League Image (Optional)
            </Typography>

            {/* Image Preview */}
            <Box sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 2,
              p: 2,
              border: '1.5px dashed rgba(229,106,22,0.8)',
              borderRadius: 2,
              background: 'rgba(255,255,255,0.03)',
              minHeight: 80
            }}>
              <Avatar
                src={imagePreview || '/assets/league.png'}
                alt="League Image"
                sx={{
                  width: 60,
                  height: 60,
                  border: '2px solid rgba(229,106,22,0.85)',
                  background: '#1f1f1f'
                }}
                variant="rounded"
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#E5E7EB', mb: 0.5 }}>
                  {imagePreview ? 'Selected Image' : 'Default Flag Image'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                  {imagePreview ? 'Click to change or remove' : 'Upload a custom image for your league'}
                </Typography>
              </Box>
            </Box>

            {/* Upload Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  color: '#E56A16',
                  borderColor: '#E56A16',
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 'bold',
                  '&:hover': {
                    borderColor: '#CF2326',
                    backgroundColor: 'rgba(229,106,22,0.08)'
                  },
                }}
              >
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={createLeagueFileInputRef}
                  onClick={(e) => { try { (e.target as HTMLInputElement).value = ''; } catch { } }}
                />
              </Button>

              {imagePreview && (
                <Button
                  variant="outlined"
                  onClick={handleRemoveImage}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    color: '#ff6b6b',
                    borderColor: '#ff6b6b',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 'bold',
                    '&:hover': {
                      borderColor: '#ff5252',
                      backgroundColor: 'rgba(255,107,107,0.1)'
                    },
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 2,
            pt: 0.5,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1,
            '& > *': { m: '0 !important', width: { xs: '100%', sm: 'auto' } },
          }}
        >
          <Button
            onClick={handleCreateLeague}
            variant="contained"
            disabled={isCreating || !leagueName.trim()}
            sx={{
              background: 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(229,106,22,0.25)',
              '&:hover': { background: 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)' },
            }}
          >
            {isCreating ? 'Creating...' : 'Create League'}
          </Button>
          <Button
            onClick={() => setIsDialogOpen(false)}
            variant="outlined"
            sx={{
              color: '#E5E7EB',
              border: '1.5px solid rgba(229,106,22,0.7)',
              borderRadius: 2,
              px: 3,
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'rgba(229,106,22,0.1)', borderColor: '#E56A16' },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
