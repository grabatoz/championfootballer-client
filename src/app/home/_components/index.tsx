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
  // styled
} from '@mui/material';

// Lazy load heavy component
const PlayerCard = dynamic(() => import('@/Components/playercard/playercard'), {
  loading: () => <CircularProgress size={40} />,
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

const LeagueSelectionComponent = ({ refreshKey, createdLeague, currentUserId }: { refreshKey?: number; createdLeague?: League | null; currentUserId?: string | number }) => {  
  const [userLeagues, setUserLeagues] = useState<LeagueWithComputed[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<LeagueWithComputed | null>(null);
  const [, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [networkDone, setNetworkDone] = useState(false);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const isFetching = !networkDone;

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${selectedLeague.id}/seasons`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ copyPlayers: true })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${data.message || 'New season created successfully!'}`);
        
        // Note: Backend already sends notifications to all league members in createNewSeason

        // Clear all caches before reload
        try {
          leagueAPI.invalidateCache();
          localStorage.removeItem('leaguesCache');
          localStorage.removeItem('lastLeaguesFetch');
        } catch {}

        // Refresh the league data by triggering a complete page reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(data.message || 'Failed to create new season');
      }
    } catch (error) {
      console.error('Error creating new season:', error);
      toast.error('An error occurred while creating new season');
    } finally {
      setIsCreatingSeason(false);
    }
  };

  // Format league name function
  const formatLeagueName = (name: string | undefined | null) => {
    if (!name) return '';
    const words = name.split(' ');
    const capitalizedWords = words.map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return capitalizedWords.join(' ');
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

        // Extract and merge XP from primary /auth/status call
        const xp = data?.user?.xp;
        if (typeof xp === 'number') {
          dispatch(mergeUser({ xp }));
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
          ((data.user.leagues || []) as Array<{ id?: string | number }> )
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
            updatedAt: l.updatedAt,
            createdAt: l.createdAt,
            image: l.image,
            isComplete: l.isComplete,
            isCompleted: l.isCompleted,
            userRole: role,
            maxGames: l.maxGames,
          } as LeagueWithComputed;
        });
        setUserLeagues(minimalList);

        // Choose a sensible default quickly (based purely on recency for instant UX)
        if (uniqueLeagues.length > 0) {
          const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
          const preferred = storedId ? minimalList.find(l => String(l.id) === String(storedId)) || null : null;
          if (preferred) {
            setSelectedLeague(preferred);
          } else {
            const latest = [...minimalList].sort((a, b) => timeOf(b) - timeOf(a))[0];
            setSelectedLeague(latest || null);
          }
        }

        // 2) Enrich in the background per-league and update state incrementally
        // Avoid blocking UI by not awaiting all; update each league as soon as its data arrives
        uniqueLeagues.forEach(async (l) => {
          try {
            // Add timestamp to bypass any caching
            const timestamp = Date.now();
            const [statusRes, detailsRes] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${l.id}/status?_t=${timestamp}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store', signal: aborter.signal } as RequestInit),
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${l.id}?_t=${timestamp}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store', signal: aborter.signal } as RequestInit)
            ]);

            let matchesFromDetails: Match[] | undefined = undefined;
            let maxGamesFromDetails: number | undefined = undefined;
            let seasonNumberFromDetails: number | undefined = undefined;
            if (detailsRes.ok) {
              const leagueData = await detailsRes.json();
              const rawMatches = leagueData?.league?.matches as unknown;
              if (Array.isArray(rawMatches)) matchesFromDetails = rawMatches as Match[];
              if (typeof leagueData?.league?.maxGames === 'number') maxGamesFromDetails = leagueData.league.maxGames as number;
              
              // Get active season number (where isActive === true)
              const seasons = leagueData?.league?.seasons as unknown;
              const currentSeason = leagueData?.league?.currentSeason as any;
              console.log(`[League ${l.id}] All seasons from backend:`, seasons);
              console.log(`[League ${l.id}] Current season from backend:`, currentSeason);
              
              // Use currentSeason from backend (which is the user's actual season)
              if (currentSeason && typeof currentSeason.seasonNumber === 'number') {
                seasonNumberFromDetails = currentSeason.seasonNumber;
                console.log(`[League ${l.id}] Setting season number to user's season:`, seasonNumberFromDetails);
              } else if (Array.isArray(seasons) && seasons.length > 0) {
                console.log(`[League ${l.id}] Total seasons found:`, seasons.length);
                seasons.forEach((s: any) => {
                  console.log(`[League ${l.id}] Season ${s?.seasonNumber}: isActive=${s?.isActive}`);
                });
                
                // Use the first season from filtered list (user's most recent season)
                const userSeason = seasons[0];
                console.log(`[League ${l.id}] User's season found:`, userSeason);
                
                if (userSeason && typeof userSeason.seasonNumber === 'number') {
                  seasonNumberFromDetails = userSeason.seasonNumber;
                  console.log(`[League ${l.id}] Setting season number to:`, seasonNumberFromDetails);
                } else {
                  console.log(`[League ${l.id}] No user season found!`);
                }
              } else {
                console.log(`[League ${l.id}] No seasons array or empty`);
              }
            }

            let computed: LeagueComputedStatus | undefined = undefined;
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              const raw = (statusData?.status || {}) as Record<string, unknown>;
              const toNum = (v: unknown): number | undefined => {
                const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
                return Number.isFinite(n) ? n : undefined;
              };
              const matchesPlayed = toNum(raw?.matchesPlayed ?? raw?.gamesPlayed ?? raw?.played ?? raw?.completedMatches ?? raw?.totalPlayed);
              const maxGames = toNum(raw?.maxGames ?? raw?.allowedGames ?? raw?.totalGames ?? l?.maxGames);
              const locked = raw?.locked === true;
              const isComplete = raw?.isComplete === true;
              const missingRaw = (raw as Record<string, unknown>)?.missing as unknown;
              const missing = Array.isArray(missingRaw) ? missingRaw : [];
              computed = {
                ...(raw as LeagueComputedStatus),
                matchesPlayed,
                gamesPlayed: matchesPlayed,
                maxGames,
                locked,
                isComplete,
                missing,
              };
            }

            // Update this league entry in-place
            setUserLeagues((prev) => {
              const arr = prev.map((item) => {
                if (String(item.id) !== String(l.id)) return item;
                const enriched: LeagueWithComputed = {
                  ...item,
                  computedStatus: computed ?? item.computedStatus,
                  isLocked: (computed?.locked === true) || item.isLocked,
                  maxGames: (computed?.maxGames ?? maxGamesFromDetails ?? item.maxGames),
                  matches: matchesFromDetails ?? item.matches,
                  seasonNumber: seasonNumberFromDetails ?? item.seasonNumber,
                };
                // Normalize defaults
                return {
                  ...enriched,
                  status: typeof enriched?.status === 'string' && enriched.status!.trim() !== '' ? enriched.status : 'active',
                  active: typeof enriched?.active === 'boolean' ? enriched.active : true,
                };
              });
              return arr;
            });
            
            // CRITICAL: Update selectedLeague if this is the currently selected league
            setSelectedLeague((prev) => {
              if (prev && String(prev.id) === String(l.id)) {
                const updated: LeagueWithComputed = {
                  ...prev,
                  computedStatus: computed ?? prev.computedStatus,
                  isLocked: (computed?.locked === true) || prev.isLocked,
                  maxGames: (computed?.maxGames ?? maxGamesFromDetails ?? prev.maxGames),
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
  }, [token, refreshKey, dispatch]);

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
    } catch {}
    setUserLeagues(prev => {
      const map = new Map(prev.map(l => [String(l.id), l]));
      const entry: LeagueWithComputed = {
        id: String(createdLeague.id),
        name: createdLeague .name,
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
      const visible = userLeagues.filter(l => !leagueIsCompleted(l));
      console.log('[Home] leagues total:', userLeagues.length, 'visible (not completed):', visible.length);
    } catch {}
  }, [userLeagues]);

  // Keep selected league at top
  const sortedUserLeagues = React.useMemo(() => {
    if (!userLeagues?.length) return [];
    // Only show INCOMPLETE leagues in the dropdown
    const visible = userLeagues.filter(l => !leagueIsCompleted(l));
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
          fontSize: { xs: '1rem', sm: '1.1rem', md: '15px' },
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, minWidth: 0 }}>
            {isFetching ? (
              <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
            ) : (
              <Image src={selectedLeague?.image || trophy} alt='' height={24} width={24} style={{ height: 24, width: 24 }} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start', minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '19px',
                  fontWeight: 600,
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  textTransform: 'capitalize',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                }}
              >
                {isFetching
                  ? 'Loading…'
                  : (selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Select a league')}
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
              width: 40,
              height: 40,
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
            top: 'calc(100% - 2px)',
            left: 0,
            width: '100%',
            maxWidth: '100%',
            maxHeight: 300,
            overflowY: 'auto',
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
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
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
                    } catch {}
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

      {/* Add New Season Button */}
      {selectedLeague && selectedLeague.userRole === 'ADMIN' && (
        <Button
        disabled={isCreatingSeason || isFetching}
        onClick={handleCreateNewSeason}
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
                    fontFamily: '"Woodford Bourne Pro", sans-serif',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textTransform: 'capitalize',
                  }}
        >
            {isCreatingSeason ? 'Creating Season...' : 'Add New Season'}
        </Button>
      )}
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
  const [inviteCode, setInviteCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueImage, setLeagueImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [leagueNameError, setLeagueNameError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const [, setLeagues] = useState<League[]>([]);
  const [, setLoading] = useState(true);
  // Trigger to force LeagueSelectionComponent to refetch
  const [leaguesRefreshKey, setLeaguesRefreshKey] = useState(0);
  // Pass the newly created league down so it appears instantly
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);
  // File input ref to allow re-selecting the same image
  const createLeagueFileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!inviteCode.trim()) return;

    try {
      // Dispatch join and get the joined league payload
      const payload: unknown = await dispatch(joinLeague(inviteCode.trim())).unwrap();

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
      } else {
        // If API didn't include league payload, still trigger a background refresh to get latest
        setLeaguesRefreshKey((k) => k + 1);
      }

      setInviteCode('');
      toast.success('Successfully joined league!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join league';
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
    setIsCreating(true);
    try {
      console.log('Creating league:', leagueName.trim());
      const formData = new FormData();
      formData.append('name', leagueName.trim());
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
    } catch {}
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
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          borderRadius: 0,
          overflow: 'visible',
          p: { xs: 0, md: 3 },
          pt: { xs: 2, md: 4 },
          mb: 0,
          minHeight: '143vh',
          width: '100%',
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
          textAlign: 'center',
          color: 'white',
          zIndex: 10,
          width: '100%',
          maxWidth: '650px',
          height: 'auto',
          opacity: 1,
        }}>
          <Box component="div" sx={{ 
            fontFamily: '"Oswald", sans-serif', 
            fontSize: '28px', 
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
              flexWrap: 'nowrap', 
              justifyContent: 'center', 
              columnGap: { xs: 2, md: 3 },
              rowGap: 0,
              fontFamily: '"Oswald", sans-serif',
              fontSize: '28px',
              fontWeight: 300,
              textTransform: 'uppercase',
              lineHeight: '100%',
              letterSpacing: '0%',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
              <Box component="span" sx={{ color: '#ffff99' }}>100 MATCH PLAYED</Box>
              <Box component="span" sx={{ color: '#ff9933' }}>50 MOTM VOTES</Box>
              <Box component="span" sx={{ color: '#ffff99' }}>30 GOALS</Box>
            </Box>
            
            {/* Row 2 */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'nowrap', 
              justifyContent: 'center', 
              columnGap: { xs: 2, md: 3 },
              rowGap: 0,
              fontFamily: '"Oswald", sans-serif',
              fontSize: '28px',
              fontWeight: 300,
              textTransform: 'uppercase',
              lineHeight: '100%',
              letterSpacing: '0%',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
              <Box component="span" sx={{ color: '#ff9933' }}>20 ASSISTS</Box>
              <Box component="span" sx={{ color: '#ffff99' }}>2 CLEAN SHEETS</Box>
              <Box component="span" sx={{ color: '#ff9933' }}>5 DEFENSIVE IMPACT</Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'stretch' },
          // gap: { xs: 2, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          // backgroundColor: 'black',
          width: { xs: '100%', md: '620px' },
          height: { xs: 'auto', md: '416px' },
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Left Div - Player Card */}
          <Box sx={{
            flex: { xs: 'none', md: '0 0 300px' },
            width: { xs: '100%', md: '300px' },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'center' },
            mb: { xs: 2, md: 0 },
             mt: { xs: 1 },
            alignSelf: { md: 'stretch' },
            // backgroundColor: 'red',
          }}>
            <PlayerCard 
              name={user?.firstName || ''}
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
            />
          </Box>

          {/* Right Div - White Card */}
          <Box
            sx={{
              flex: { xs: 1, md: '0 0 310px' },
              maxWidth: { xs: '100%', md: '310px' },
              width: { xs: '96%', sm: '100%', md: '310px' },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mt: { xs: 0, md: 0 },
              ml: { md: 0 },
          
              position: 'relative',
              // backgroundColor: 'green',
              zIndex: 2,
            }}
          >
            {/* White Box */}
            <Box
              sx={{
                backgroundColor: '#fff',
                p: { xs: 3, sm: 2, md: 1.6 },
                mt: { xs: 0, md: 3 },
                borderRadius: { xs: '20px', md: '12px' },
                width: '100%',
                minHeight: 'auto'
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 1 }}>
                <Typography variant="h5" gutterBottom sx={{
                  fontWeight: '550',
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' },
                  color: 'black',
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                }}>Welcome,</Typography>
                <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' }, fontWeight: 550, fontFamily: '"Woodford Bourne Pro", sans-serif' }}>
                  {user?.firstName}
                </Typography>
              </Box>

              <Divider sx={{ mb: 1, width: '100%', height: 2, bgcolor: '#00A77F' }} />

              <Box sx={{ textAlign: 'start' }}>
                <Typography variant="body2" sx={{
                  color: 'black',
                  mb: 0.5,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                }}>
                  Your Current League In Which You Stand
                </Typography>

                {/* League Selection Component */}
                <LeagueSelectionComponent
                  refreshKey={leaguesRefreshKey}
                  createdLeague={createdLeague}
                  currentUserId={user?.id}
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
                    fontFamily: '"Woodford Bourne Pro", sans-serif',
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
                    mt: 0,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#0388E3', boxShadow: '0 2px 8px rgba(25,118,210,0.2)' },
                    width: '100%',
                    maxWidth: 290,
                    mx: 'auto',
                    display: { xs: 'none', sm: 'none', md: 'flex' },
                    justifyContent: 'space-center',
                    px: 3,
                    fontSize: '19px',
                    minHeight: 48,
                    position: 'relative',
                    fontFamily: '"Woodford Bourne Pro", sans-serif',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textTransform: 'capitalize',
                  }}
                >
                  <span style={{ position: 'absolute', left: '22px', fontSize: '24px' }}>+</span>
                  Create New League
                </Button>

                {/* Invite Code Join Section */}
                <Box sx={{
                  mx: 'auto',
                  display: { xs: 'none', sm: 'none', md: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: 290,
                  overflow: 'hidden'
                }}>
                  <TextField
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: '#DEDCDC',
                      borderRadius: '12px 0 0 12px',
                      flex: 1,
                      minWidth: 0,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' }
                      },
                      '& .MuiInputBase-input': {
                        height: '42px',
                        padding: '0 12px',
                        fontSize: '14px'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{ 
                      background: '#00A77F', 
                      borderRadius: '0 12px 12px 0', 
                      '&:hover': { background: '#00A77F' }, 
                      py: 0, 
                      minWidth: 120, 
                      height: 42, 
                      fontSize: '14px', 
                      flexShrink: 0,
                      fontFamily: '"Woodford Bourne Pro", sans-serif',
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
                fontSize: '19px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center',
                boxShadow: '0 8px 24px -6px rgba(0,78,95,0.55)',
                overflow: 'hidden',
                maxWidth: 310,
                height: 45,
                mx: 'auto',
                fontFamily: '"Woodford Bourne Pro", sans-serif',
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
              name={user?.firstName || ''}
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
                onChange={(e) => setInviteCode(e.target.value)}
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
                onChange={(e) => setInviteCode(e.target.value)}
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
          display: {
            xs: 'flex',
            sm: 'flex',
            md: 'none',
          },
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
            onChange={(e) => setInviteCode(e.target.value)}
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
              fontFamily: '"Woodford Bourne Pro", sans-serif',
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
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: '#2B2B2B',
              border: '1px solid #3A3A3A',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              p: 2,
              color: '#fff',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
            <DialogTitle sx={{ p: 0, fontWeight: 'bold', color: '#fff', fontSize: 22, letterSpacing: 0.5 }}>
              Create a League
            </DialogTitle>
            <IconButton onClick={() => setIsDialogOpen(false)} sx={{ color: '#fff' }}>
              <X />
            </IconButton>
          </Box>
          <DialogContent>
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
                const sanitized = raw.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 20);
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
                  background: '#2B2B2B',
                  color: '#fff',
                  borderRadius: 2,
                  border: '1.5px solid #3A3A3A',
                  '& fieldset': {
                    borderColor: '#E56A16',
                  },
                  '&:hover fieldset': {
                    borderColor: '#CF2326',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#E56A16',
                  },
                  '& input': {
                    color: '#fff',
                  },
                },
                '& label': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
              }}
              inputProps={{ maxLength: 20, 'aria-invalid': Boolean(leagueNameError) }}
              InputLabelProps={{ sx: { color: '#fff' } }}
              FormHelperTextProps={{ sx: { color: '#fff', '&.Mui-error': { color: '#f44336' } } }}
              error={Boolean(leagueNameError)}
              helperText={leagueNameError || 'Use letters, numbers, and spaces only (max 20).'}
            />

            {/* League Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
                League Image (Optional)
              </Typography>

              {/* Image Preview */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                border: '2px dashed #E56A16',
                borderRadius: 2,
                background: 'rgba(229,106,22,0.08)',
                minHeight: 80
              }}>
                <Avatar
                  src={imagePreview || '/assets/league.png'}
                  alt="League Image"
                  sx={{
                    width: 60,
                    height: 60,
                    border: '2px solid #E56A16',
                    background: '#2B2B2B'
                  }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 0.5 }}>
                    {imagePreview ? 'Selected Image' : 'Default Flag Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#C7C7C7' }}>
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
                    onClick={(e) => { try { (e.target as HTMLInputElement).value = ''; } catch {} }}
                  />
                </Button>

                {imagePreview && (
                  <Button
                    variant="outlined"
                    onClick={handleRemoveImage}
                    sx={{
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
          <DialogActions sx={{ px: 3, pb: 2 }}>
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
                color: '#fff',
                border: '1.5px solid #444',
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}