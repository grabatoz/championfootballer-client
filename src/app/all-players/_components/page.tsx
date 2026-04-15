'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/Components/PageHeader';
import dynamic from 'next/dynamic';
import {
  Container,
  Typography,
  TextField,
  Select,
  Menu,
  MenuItem,
  FormControl,
  OutlinedInput,
  List,
  ListItem,
  ListItemAvatar,
  // Avatar,
  ListItemText,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchLeaguePlayers } from '@/lib/features/userSlice';
import { initializeFromStorage } from '@/lib/features/authSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ShirtImg from '@/Components/images/shirtimg.png';
import SearchIcon from '@/Components/images/searchicon.png';
import TableGraphIcon from '@/Components/images/tablegrapicon.png';

// Lazy load CloseButton
const CloseButton = dynamic(() => import('@/Components/CloseButton'), {
  loading: () => <></>,
  ssr: false
});

interface Player {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePicture: string | null;
  rating: number;
  cpPoints?: number; // Preferred CP points field
  xpPoints?: number; // Added for XP points
  statsSum?: number; // Added for stats sum
  shirtNumber?: string; // Optional shirt number
  style?: string | null;
  playingStyle?: string | null;
  position?: string | null;
  positionType?: string | null;
}

type LeagueComputedStatus = {
  isComplete?: boolean;
  locked?: boolean;
  matchesPlayed?: number;
  gamesPlayed?: number;
  maxGames?: number;
  totalMatches?: number;
  missing?: Array<unknown>;
  [key: string]: unknown;
};

interface Match {
  status?: string;
  active?: boolean;
  end?: string;
}

// League option used by the UI select
interface LeagueOption { 
  id: string; 
  name: string;
  computedStatus?: LeagueComputedStatus;
  isLocked?: boolean;
  isComplete?: boolean;
  isCompleted?: boolean;
  updatedAt?: string;
  createdAt?: string;
  status?: string;
  maxGames?: number;
  active?: boolean;
  archived?: boolean;
  matches?: Match[];
  seasons?: Array<{id: string, name: string, seasonNumber?: number, isActive?: boolean}>;
  // Derived on client: whether the user is an admin of this league
  isAdmin?: boolean;
}

// Minimal shape we expect from API for user leagues
// type ApiUser = {
//   leagues?: unknown;
//   administeredLeagues?: unknown;
// }

// const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';

// Convert an unknown array into a list of {id, name} with string ids; filters invalid entries
// function parseLeagueOptions(value: unknown): LeagueOption[] {
//   if (!Array.isArray(value)) return [];
//   const out: LeagueOption[] = [];
//   for (const item of value) {
//     if (isRecord(item)) {
//       const id = item.id as string | number | undefined;
//       const name = item.name as string | undefined;
//       if ((typeof id === 'string' || typeof id === 'number') && typeof name === 'string' && name.length > 0) {
//         out.push({ id: String(id), name });
//       }
//     }
//   }
//   return out;
// }

const AllPlayersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch<AppDispatch>();
  const { playedWithPlayers, leaguePlayers, loading, error } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Actual search term after hitting Enter
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState<boolean>(false);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [allPositionsMenuAnchor, setAllPositionsMenuAnchor] = useState<null | HTMLElement>(null);
  const [seasons, setSeasons] = useState<Array<{id: string, name: string}>>([]);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const router = useRouter();
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  const normalizePlayer = useCallback((raw: unknown): Player | null => {
    if (!raw || typeof raw !== 'object') return null;
    const rec = raw as Record<string, unknown>;
    const nested = (rec.player && typeof rec.player === 'object') ? (rec.player as Record<string, unknown>) : null;
    const from = (key: string) => (rec[key] ?? (nested ? nested[key] : undefined));
    const pickString = (keys: string[]) => {
      for (const k of keys) {
        const v = from(k);
        if (v != null && String(v).trim() !== '') return String(v);
      }
      return '';
    };
    const id = (from('id') != null ? String(from('id')) : '') || '';
    if (!id) return null;
    const firstName = pickString(['firstName', 'first_name']);
    const lastName = pickString(['lastName', 'last_name']);
    const fullName = pickString(['name']) || `${firstName} ${lastName}`.trim();
    const normalized: Player = {
      id,
      name: fullName || 'Unknown Player',
      firstName,
      lastName,
      profilePicture: from('profilePicture') == null ? null : String(from('profilePicture')),
      rating: Number(from('rating') ?? 0),
      cpPoints: typeof from('cpPoints') === 'number' ? (from('cpPoints') as number) : undefined,
      xpPoints: typeof from('xpPoints') === 'number' ? (from('xpPoints') as number) : undefined,
      statsSum: typeof from('statsSum') === 'number' ? (from('statsSum') as number) : undefined,
      shirtNumber: from('shirtNumber') != null ? String(from('shirtNumber')) : undefined,
      style: pickString(['style', 'playing_style', 'playerStyle', 'playStyle']),
      playingStyle: pickString(['playingStyle', 'playing_style', 'playerStyle', 'playStyle']),
      position: pickString(['position']),
      positionType: pickString(['positionType', 'position_type', 'role']),
    };
    // Debug: confirm backend fields arrive
    console.log('[All Players] Raw vs Normalized', {
      id: normalized.id,
      raw: {
        style: from('style'),
        playingStyle: from('playingStyle'),
        playing_style: from('playing_style'),
        playerStyle: from('playerStyle'),
        playStyle: from('playStyle'),
        position: from('position'),
        positionType: from('positionType'),
        position_type: from('position_type'),
        role: from('role'),
      },
      normalized: {
        style: normalized.style,
        playingStyle: normalized.playingStyle,
        position: normalized.position,
        positionType: normalized.positionType,
      },
    });
    return normalized;
  }, []);

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // Helper: determine if a league is completed (season-aware)
  const leagueIsCompleted = useCallback((l: LeagueOption): boolean => {
    // Prefer backend-computed season-based completion status
    if ((l as any)?.computedStatus?.isCompleted === true) return true;
    if (l?.archived === true) return true;

    const missingArr = Array.isArray(l?.computedStatus?.missing) ? l.computedStatus!.missing! : [];
    if (missingArr.length > 0) return false;

    const toNum = (v: unknown): number | undefined => {
      const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      return Number.isFinite(n) ? n : undefined;
    };
    const playedFromComputed = toNum(l?.computedStatus?.matchesPlayed) ?? toNum(l?.computedStatus?.gamesPlayed);
    const played = playedFromComputed;
    const maxG = toNum(l?.computedStatus?.maxGames) ?? toNum(l?.maxGames);

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
        if (completedCount < maxG) return false;
        return true;
      }
    }

    if (typeof maxG === 'number' && maxG > 0 && typeof played === 'number') {
      if (played < maxG) return false;
      return true;
    }

    if (l?.computedStatus?.isComplete === true) return true;
    if (l?.computedStatus?.locked === true) return true;
    if (l?.isComplete === true) return true;
    if (l?.isCompleted === true) return true;
    if (l?.isLocked === true) return true;

    const sRaw = (l?.status ?? '').toString();
    const s = sRaw.trim().toUpperCase();
    const completionStatuses = new Set(['RESULT_PUBLISHED', 'RESULT_UPLOADED', 'RESULT_COMPLETE', 'RESULT_FINISHED', 'RESULT_ENDED', 'RESULT_DONE', 'COMPLETED']);
    if (completionStatuses.has(s)) return true;
    if (typeof l?.active === 'boolean' && l.active === false) return true;
    return false;
  }, []);

  const fetchLeagues = useCallback(async () => {
    if (!token) return;
    setLeaguesLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data?.success && data?.user) {
        const adminLeaguesArr = (data.user.adminLeagues || data.user.administeredLeagues || []) as Array<{ id?: string | number }>;
        const adminIds = new Set<string>(
          adminLeaguesArr
            .map(l => (l && (l as { id?: string | number }).id != null ? String((l as { id?: string | number }).id) : undefined))
            .filter((v): v is string => typeof v === 'string')
        );
        const userLeagues = [
          ...(data.user.leagues || []),
          ...adminLeaguesArr
        ];

        const uniqueLeaguesMap = new Map();
        userLeagues.forEach(league => {
          const id = String((league as { id?: string | number }).id);
          if (!uniqueLeaguesMap.has(id)) {
        uniqueLeaguesMap.set(id, league);
      }
    });

        // Fetch computed status for all leagues in one request (avoids GET /leagues/:id/status 405)
        const statusMap = new Map<string, LeagueComputedStatus>();
        try {
          const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/user-leagues`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData?.success && Array.isArray(statusData.leagues)) {
              statusData.leagues.forEach((l: any) => {
                const id = String(l?.id ?? '');
                if (!id) return;
                if (l?.computedStatus) {
                  statusMap.set(id, l.computedStatus as LeagueComputedStatus);
                }
              });
            }
          }
        } catch { }

        // Enrich with computed status
        const enrichedLeagues = await Promise.all(
          Array.from(uniqueLeaguesMap.values()).map(async (league) => {
            try {
              const leagueId = String((league as { id?: string | number }).id);
              const isAdmin = adminIds.has(leagueId);
              const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              let matchesFromDetails: Match[] | undefined = undefined;
              let maxGamesFromDetails: number | undefined = undefined;
              let createdAt: string | undefined = undefined;

              if (detailsRes.ok) {
                const leagueData = await detailsRes.json();
                const rawMatches = leagueData?.league?.matches as unknown;
                if (Array.isArray(rawMatches)) {
                  matchesFromDetails = rawMatches as Match[];
                }
                if (typeof leagueData?.league?.maxGames === 'number') {
                  maxGamesFromDetails = leagueData.league.maxGames as number;
                }
                createdAt = leagueData?.league?.createdAt;
              }

              const statusFromUserLeagues = statusMap.get(leagueId);
              if (statusFromUserLeagues) {
                const raw = statusFromUserLeagues as Record<string, unknown>;
                const toNum = (v: unknown): number | undefined => {
                  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
                  return Number.isFinite(n) ? n : undefined;
                };
                const matchesPlayed = toNum(raw?.matchesPlayed ?? raw?.gamesPlayed ?? raw?.played ?? raw?.completedMatches ?? raw?.totalPlayed);
                const maxGames = toNum(raw?.maxGames ?? raw?.allowedGames ?? raw?.totalGames ?? raw?.totalMaxGames);
                const locked = raw?.locked === true;
                const isComplete = raw?.isComplete === true || raw?.isCompleted === true;
                const missingRaw = raw?.missing as unknown;
                const missing = Array.isArray(missingRaw) ? missingRaw : [];
                const computed: LeagueComputedStatus = {
                  ...(raw as LeagueComputedStatus),
                  matchesPlayed,
                  gamesPlayed: matchesPlayed,
                  maxGames,
                  locked,
                  isComplete,
                  missing,
                };
                // Extract seasons from league data
                const seasonsFromLeague = Array.isArray((league as any).seasons) 
                  ? (league as any).seasons.map((s: any) => ({
                      id: String(s.id),
                      name: s.name || `Season ${s.seasonNumber || s.id}`,
                      seasonNumber: s.seasonNumber,
                      isActive: s.isActive
                    }))
                  : [];
                
                return {
                  ...league,
                  id: String(leagueId),
                  name: (league as { name?: string }).name || '',
                  computedStatus: computed,
                  isLocked: computed?.locked === true,
                  maxGames: maxGames ?? maxGamesFromDetails,
                  matches: matchesFromDetails,
                  createdAt,
                  isAdmin,
                  seasons: seasonsFromLeague,
                } as LeagueOption;
              }

              // Extract seasons from league data
              const seasonsFromLeague = Array.isArray((league as any).seasons) 
                ? (league as any).seasons.map((s: any) => ({
                    id: String(s.id),
                    name: s.name || `Season ${s.seasonNumber || s.id}`,
                    seasonNumber: s.seasonNumber,
                    isActive: s.isActive
                  }))
                : [];
              
              return {
                id: String(leagueId),
                name: (league as { name?: string }).name || '',
                createdAt,
                isAdmin,
                seasons: seasonsFromLeague,
              } as LeagueOption;
            } catch (error) {
              console.error(`Error fetching details for league`, error);
              const leagueId = String((league as { id?: string | number }).id);
              
              // Extract seasons from league data even in error case
              const seasonsFromLeague = Array.isArray((league as any).seasons) 
                ? (league as any).seasons.map((s: any) => ({
                    id: String(s.id),
                    name: s.name || `Season ${s.seasonNumber || s.id}`,
                    seasonNumber: s.seasonNumber,
                    isActive: s.isActive
                  }))
                : [];
              
              return {
                id: String(leagueId),
                name: (league as { name?: string }).name || '',
                isAdmin: adminIds.has(leagueId),
                seasons: seasonsFromLeague,
              } as LeagueOption;
            }
          })
        );

        // Show only visible leagues (active + non-archived + not completed)
        const activeLeagues = enrichedLeagues.filter(
          (l) => l.active !== false && l.archived !== true && !leagueIsCompleted(l)
        );

        // Sort alphabetically
        activeLeagues.sort((a, b) => {
          const an = (a?.name ?? '').toString().trim().toLowerCase();
          const bn = (b?.name ?? '').toString().trim().toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          return String(a.id).localeCompare(String(b.id));
        });

        setLeagues(activeLeagues);

        // Auto-select preferred league from localStorage or first league
        if (activeLeagues.length > 0) {
          const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
          const preferred = storedId ? activeLeagues.find(l => l.id === storedId) : null;
          setSelectedLeague(preferred ? preferred.id : activeLeagues[0].id);
        }

        console.log('[All Players] Total:', enrichedLeagues.length, 'Active:', activeLeagues.length);
      }
    } catch (e) {
      console.error('Failed to load leagues', e);
    } finally {
      setLeaguesLoading(false);
    }
  }, [token, leagueIsCompleted]);

  useEffect(() => {
    if (token) {
      fetchLeagues();
    }
  }, [token, fetchLeagues]);

  // Extract years dynamically from existing leagues
  const yearOptions = React.useMemo(() => {
    const yearsSet = new Set<string>();
    leagues.forEach((l) => {
      if (l.createdAt) {
        const t = Date.parse(l.createdAt);
        if (Number.isFinite(t)) {
          const year = new Date(t).getFullYear();
          yearsSet.add(String(year));
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [leagues]);

  // Filter leagues by year
  const filteredLeagues = React.useMemo(() => {
    if (selectedYear === 'all') return leagues;
    return leagues.filter(l => {
      const t = Date.parse(l.createdAt || '');
      if (!Number.isFinite(t)) return false;
      const year = String(new Date(t).getFullYear());
      return year === selectedYear;
    });
  }, [leagues, selectedYear]);

  // Auto-adjust selectedLeague when year changes
  useEffect(() => {
    if (filteredLeagues.length === 0) {
      // No leagues for this year - reset to 'all'
      setSelectedLeague('all');
      setSelectedSeason('all'); // Also reset season
    } else {
      // When we have leagues, only auto-select if current league is invalid.
      // Keep explicit "all" selection intact so users can view players across all leagues.
      const currentLeagueExists = filteredLeagues.some(l => l.id === selectedLeague);
      
      // Auto-select only if current selected league no longer exists in filtered list
      if (selectedLeague !== 'all' && !currentLeagueExists) {
        // Try to get preferred league from localStorage
        let leagueToSelect = filteredLeagues[0].id;
        try {
          if (typeof window !== 'undefined') {
            const preferredLeagueId = localStorage.getItem(PREFERRED_LEAGUE_KEY);
            // Check if preferred league exists in filtered leagues
            if (preferredLeagueId && filteredLeagues.some(l => l.id === preferredLeagueId)) {
              leagueToSelect = preferredLeagueId;
            }
          }
        } catch {}
        
        setSelectedLeague(leagueToSelect);
      }
    }
  }, [filteredLeagues, selectedLeague]);

  // Populate seasons from selected league data (no API call needed)
  const populateSeasons = useCallback((leagueId: string) => {
    if (leagueId === 'all') {
      setSeasons([]);
      setSelectedSeason('all');
      return;
    }
    
    console.log('[All Players] Populating seasons for league:', leagueId);
    const selectedLeagueData = filteredLeagues.find(l => l.id === leagueId);
    
    if (selectedLeagueData && selectedLeagueData.seasons && selectedLeagueData.seasons.length > 0) {
      console.log('[All Players] Found seasons:', selectedLeagueData.seasons);
      setSeasons(selectedLeagueData.seasons);
      // Auto-select first season if available
      setSelectedSeason(selectedLeagueData.seasons[0].id);
    } else {
      console.log('[All Players] No seasons found for league');
      setSeasons([]);
      setSelectedSeason('all');
    }
  }, [filteredLeagues]);

  const fetchAllLeaguesPlayers = useCallback(async () => {
    if (!token) return;
    
    // If no leagues for selected year, clear players
    if (filteredLeagues.length === 0) {
      dispatch({ type: 'user/fetchPlayedWithPlayers/fulfilled', payload: [] });
      return;
    }
    
    try {
      const allPlayersMap = new Map<string, Player>();
      
      // Fetch players from ALL leagues in parallel (faster)
      const playerResponses = await Promise.all(
        filteredLeagues.map(league => {
          let url = `${process.env.NEXT_PUBLIC_API_URL}/players/by-league?leagueId=${league.id}`;
          // Add season filter if a specific season is selected
          if (selectedSeason !== 'all') {
            url += `&seasonId=${selectedSeason}`;
          }
          return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        })
      );
      
      // Process all responses
      const allPlayerData = await Promise.all(
        playerResponses.map(response => response.json())
      );
      
      // Add all players to map (avoiding duplicates)
      allPlayerData.forEach(data => {
        if (data?.success && data?.players) {
          data.players.forEach((rawPlayer: unknown) => {
            const player = normalizePlayer(rawPlayer);
            if (player && !allPlayersMap.has(player.id)) {
              allPlayersMap.set(player.id, player);
            }
          });
        }
      });
      
      // Dispatch to update the state with all unique players
      const allPlayers = Array.from(allPlayersMap.values());
      dispatch({ type: 'user/fetchPlayedWithPlayers/fulfilled', payload: allPlayers });
    } catch (error) {
      console.error('Error fetching all leagues players:', error);
    }
  }, [token, filteredLeagues, selectedSeason, dispatch, normalizePlayer]);

  // Populate seasons when league changes
  useEffect(() => {
    if (selectedLeague !== 'all') {
      populateSeasons(selectedLeague);
    } else {
      setSeasons([]);
      setSelectedSeason('all');
    }
  }, [selectedLeague, populateSeasons]);

  useEffect(() => {
    if (!token) return;
    if (selectedLeague === 'all') {
      // Fetch all players from all leagues the user is part of
      fetchAllLeaguesPlayers();
    } else {
      // Fetch players for specific league and season
      let url = `${process.env.NEXT_PUBLIC_API_URL}/players/by-league?leagueId=${selectedLeague}`;
      if (selectedSeason !== 'all') {
        url += `&seasonId=${selectedSeason}`;
      }
      
      fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data?.success && data?.players) {
            const normalizedPlayers = Array.isArray(data.players)
              ? data.players
                  .map((rawPlayer: unknown) => normalizePlayer(rawPlayer))
                  .filter((p: Player | null): p is Player => Boolean(p))
              : [];
            dispatch({ type: 'user/fetchLeaguePlayers/fulfilled', payload: normalizedPlayers });
          }
        })
        .catch(err => console.error('Error fetching league players:', err));
    }
  }, [dispatch, token, selectedLeague, selectedSeason, fetchAllLeaguesPlayers, normalizePlayer]);

  useEffect(() => {
    if (error) {
      console.error('Error from user slice:', error);
    }
  }, [error]);

  const sourcePlayers = selectedLeague === 'all' ? playedWithPlayers : leaguePlayers;

  function getPlayerName(player: Player): string {
    const full = (player.name || '').trim();
    if (full) return full;
    return `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player';
  }

  function getPlayingStyle(player: Player): string {
    const fromStyle = (player.style || '').toString().trim();
    if (fromStyle) return fromStyle;
    const fromPlayingStyle = (player.playingStyle || '').toString().trim();
    if (fromPlayingStyle) return fromPlayingStyle;
    return '-';
  }

  function getPositionLabel(player: Player): string {
    const fromType = (player.positionType || '').toString().trim();
    if (fromType) return fromType;
    const fromPosition = (player.position || '').toString().trim();
    if (fromPosition) return fromPosition;
    return '-';
  }

  const positionOptions = React.useMemo(() => {
    const positionsMap = new Map<string, string>();
    sourcePlayers.forEach((player: Player) => {
      const position = getPositionLabel(player);
      if (position && position !== '-') {
        const key = position.toLowerCase();
        if (!positionsMap.has(key)) {
          positionsMap.set(key, position);
        }
      }
    });
    return Array.from(positionsMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [sourcePlayers]);

  const filteredPlayers = sourcePlayers.filter((player: Player) => {
    const matchesSearch = getPlayerName(player).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition =
      selectedPosition === 'all' ||
      getPositionLabel(player).toLowerCase() === selectedPosition.toLowerCase();
    return matchesSearch && matchesPosition;
  });
  console.log('Filtered Players:', filteredPlayers);

  useEffect(() => {
    if (selectedPosition === 'all') return;
    const hasSelectedPosition = positionOptions.some(
      (position) => position.toLowerCase() === selectedPosition.toLowerCase()
    );
    if (!hasSelectedPosition) {
      setSelectedPosition('all');
    }
  }, [positionOptions, selectedPosition]);

  // Helper to get CP/XP points and stats sum for sorting
  function getCpPoints(player: Player) {
    // Prefer CP points, fallback to XP points, then rating.
    if (typeof player.cpPoints === 'number') return player.cpPoints;
    if (typeof player.xpPoints === 'number') return player.xpPoints;
    return player.rating;
  }
  function getStatsSum(player: Player) {
    // If player has a stats object/array, sum it. Otherwise, use rating.
    if (typeof player.statsSum === 'number') return player.statsSum;
    return player.rating;
  }

  // Sort players: CP/XP desc, then stats desc
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const cpA = getCpPoints(a);
    const cpB = getCpPoints(b);

    if (cpB !== cpA) return cpB - cpA;
    // If CP/XP points are equal, compare stats sum
    const statsA = getStatsSum(a);
    const statsB = getStatsSum(b);
    if (statsB !== statsA) return statsB - statsA;
    return getPlayerName(a).localeCompare(getPlayerName(b), undefined, { sensitivity: 'base' });
  });

  const allPositionsMenuOpen = Boolean(allPositionsMenuAnchor);

  const handleAllPositionsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAllPositionsMenuAnchor(event.currentTarget);
  };

  const handleAllPositionsMenuClose = () => {
    setAllPositionsMenuAnchor(null);
  };

  const handlePositionChange = (position: string) => {
    setSelectedPosition(position);
    setAllPositionsMenuAnchor(null);
  };

  console.log('Sorted Players:', sortedPlayers);

  const noLeagues = !leaguesLoading && leagues.length === 0;

  return (
    <>
      <style jsx global>{`
        .filter-select-wrapper {
          position: relative;
          display: inline-block;
        }
        .filter-select-wrapper::after {
          content: '';
          position: absolute;
          right: 14px;
          top: 50%;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #fff;
          transform: translateY(-50%);
          pointer-events: none;
          transition: transform 0.3s ease;
        }
        .filter-select-wrapper.open::after {
          transform: translateY(-50%) rotate(180deg);
        }
        .filter-select {
          transition: all 0.2s ease;
        }
      `}</style>
      <Box sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflowX: 'hidden',
        // background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
      }}>
      {/* Full-width Header Section */}
      <PageHeader title="Players" fullBleed={false} sx={{ mb: 4 }}>
        {/* Search and Filters Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, md: 3 },
          // Offset PageHeader internal padding so controls align with table edges.
          mx: { xs: -2, md: -3 },
          px: { xs: 1, sm: 3, md: 7.5 },
          py: { xs: 1.5, md: 1.3 },
          width: 'auto',
       }}>
            {/* Search Input */}
            <TextField
              variant="outlined"
              placeholder="Search player name and hit enter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(searchQuery);
                }
              }}
              sx={{
                width: { xs: '100%', md: '440px' },
                ml: { xs: 0, md: 0.8 },
                '& .MuiOutlinedInput-root': {
                  height: { xs: 38, sm: 42 },
                  color: 'white',
                  backgroundColor: 'transparent',
                  borderRadius: '3px',
                  '& fieldset': { borderColor: '#e56a16', borderWidth: 1.5 },
                  '&:hover fieldset': { borderColor: '#e56a16' },
                  '&.Mui-focused fieldset': { borderColor: '#e56a16' }
                },
                '& .MuiInputBase-input': { 
                  color: 'white', 
                  fontSize: { xs: 14, sm: 16.5 },
                  py: 0.5,
                  fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                  '&::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 }
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 3, ml:0.5, display: 'flex', alignItems: 'center' }}>
                    <Image src={SearchIcon} alt="Search" width={25} height={25} />
                  </Box>
                ),
              }}
            />

            {/* Filter Buttons */}
            <Box sx={{
              display: 'flex',
              gap: { xs: 0.8, md: 0.5 },
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              justifyContent: { xs: 'center', md: 'flex-end' },
              width: { xs: '100%', md: 'auto' },
            }}>
              {/* Year Filter */}
              <div className={`filter-select-wrapper${yearDropdownOpen ? ' open' : ''}`}>
              <select
                className="filter-select"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setYearDropdownOpen(false);
                }}
                onMouseDown={() => setYearDropdownOpen(true)}
                onBlur={() => setTimeout(() => setYearDropdownOpen(false), 100)}
                style={{
                  height: isMobile ? '34px' : '39px',
                  padding: isMobile ? '0 30px 0 10px' : '0 36px 0 12px',
                  marginLeft: isMobile ? '0px' : '4px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1.5px solid #e56a16',
                  borderRadius: '24px',
                  fontSize: isMobile ? '13px' : '17px',
                  cursor: 'pointer',
                  outline: 'none',
                  width: isMobile ? '112px' : 'auto',
                  minWidth: isMobile ? '112px' : '100px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  fontWeight: 600,
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                }}
              >
                <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Years</option>
                {Array.from(new Set([
                  '2020', '2021', '2022', '2023', '2024', '2025', '2026',
                  ...yearOptions
                ])).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
                  <option key={year} value={year} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{year}</option>
                ))}
              </select>
              </div>

              {/* League Filter */}
              <div className={`filter-select-wrapper${leagueDropdownOpen ? ' open' : ''}`}>
              <select
                className="filter-select"
                value={selectedLeague}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedLeague(newValue);
                  setLeagueDropdownOpen(false);
                  try { if (typeof window !== 'undefined' && newValue !== 'all') localStorage.setItem(PREFERRED_LEAGUE_KEY, newValue); } catch {}
                }}
                onMouseDown={() => setLeagueDropdownOpen(true)}
                onBlur={() => setTimeout(() => setLeagueDropdownOpen(false), 100)}
                disabled={noLeagues || filteredLeagues.length === 0}
                style={{
                  height: isMobile ? '34px' : '39px',
                  padding: isMobile ? '0 30px 0 10px' : '0 36px 0 12px',
                  marginLeft: isMobile ? '0px' : '4px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1.5px solid #e56a16',
                  borderRadius: '24px',
                  fontSize: isMobile ? '13px' : '17px',
                  cursor: noLeagues || filteredLeagues.length === 0 ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  width: isMobile ? '112px' : 'auto',
                  minWidth: isMobile ? '112px' : '110px',
                  opacity: noLeagues || filteredLeagues.length === 0 ? 0.6 : 1,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  fontWeight: 600,
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                }}
              >
                <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Leagues</option>
                {filteredLeagues.map((l) => (
                  <option key={l.id} value={l.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{l.name}</option>
                ))}
              </select>
              </div>

              {/* Season Filter */}
              <div className={`filter-select-wrapper${seasonDropdownOpen ? ' open' : ''}`}>
              <select
                className="filter-select"
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setSeasonDropdownOpen(false);
                }}
                onMouseDown={() => {
                  if (selectedLeague !== 'all') {
                    setSeasonDropdownOpen(true);
                  }
                }}
                onBlur={() => setTimeout(() => setSeasonDropdownOpen(false), 100)}
                disabled={selectedLeague === 'all'}
                style={{
                  height: isMobile ? '34px' : '39px',
                  padding: isMobile ? '0 30px 0 10px' : '0 36px 0 12px',
                  marginLeft: isMobile ? '0px' : '4px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1.5px solid #e56a16',
                  borderRadius: '24px',
                  fontSize: isMobile ? '13px' : '17px',
                  cursor: selectedLeague === 'all' ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  width: isMobile ? '112px' : 'auto',
                  minWidth: isMobile ? '112px' : '110px',
                  opacity: selectedLeague === 'all' ? 0.6 : 1,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  fontWeight: 600,
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                }}
              >
                <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Seasons</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                    {season.name}
                  </option>
                ))}
              </select>
              </div>

              {/* Clear Button */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchTerm('');
                  setSelectedYear('all');
                  setSelectedLeague('all');
                  setSelectedSeason('all');
                  setSelectedPosition('all');
                  setSeasons([]);
                }}
                style={{
                  height: isMobile ? '34px' : '39px',
                  padding: isMobile ? '0 10px' : '0 17px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.5)',
                  borderRadius: '24px',
                  fontSize: isMobile ? '13px' : '17px',
                  width: isMobile ? '112px' : 'auto',
                  minWidth: isMobile ? '112px' : 'auto',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: '"Woodford Bourne Pro", sans-serif',
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </Box>
        </Box>
      </PageHeader>

      {/* Table Section */}
      <Container
        maxWidth={false}
        sx={{
          width: '100%',
          px: { xs: 1, sm: 3, md: 7.5 },
          pb: 4
        }}
      >
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.25)', borderRadius: 3 },
          }}
        >
        <Box
          sx={{
            width: 'max-content',
            minWidth: '100%',
          }}
        >
        {/* Table Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          py: 2, 
          px: { xs: 2, sm: 3 },
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          // borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* All Positions */}
          <Box
            onClick={handleAllPositionsMenuOpen}
            aria-haspopup="menu"
            aria-expanded={allPositionsMenuOpen ? 'true' : undefined}
            sx={{
            width: { xs: 196, sm: 280, md: 320 },
            minWidth: { xs: 196, sm: 280, md: 320 },
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            pr: { xs: 1.2, sm: 2 },
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 11, sm: 19 }, textTransform: 'uppercase', fontFamily: '"Woodford Bourne Pro", sans-serif' }}>
              {selectedPosition === 'all' ? 'ALL POSITIONS' : selectedPosition.toUpperCase()}
            </Typography>
            <Box
              sx={{
                ml: 1,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #fff',
                transform: allPositionsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transformOrigin: 'center',
                transition: 'transform 0.3s ease',
              }}
            />
          </Box>
          <Menu
            anchorEl={allPositionsMenuAnchor}
            open={allPositionsMenuOpen}
            onClose={handleAllPositionsMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  minWidth: { xs: 180, sm: 220 },
                  backgroundColor: '#1f1f1f',
                  border: '1px solid #e56a16',
                  borderRadius: '8px',
                  color: '#fff',
                },
              },
            }}
          >
            <MenuItem
              selected={selectedPosition === 'all'}
              onClick={() => handlePositionChange('all')}
              sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontSize: { xs: 13, sm: 15 } }}
            >
              All Positions
            </MenuItem>
            {positionOptions.map((position) => (
              <MenuItem
                key={position}
                selected={selectedPosition === position}
                onClick={() => handlePositionChange(position)}
                sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontSize: { xs: 13, sm: 15 } }}
              >
                {position}
              </MenuItem>
            ))}
          </Menu>
          
          {/* Playing Style */}
          <Box sx={{
            width: { xs: 108, sm: 150, md: 180 },
            minWidth: { xs: 108, sm: 150, md: 180 },
            flexShrink: 0,
            pr: { xs: 0.5, sm: 2 },
            display: 'block',
            textAlign: 'center'
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 11, sm: 19 }, textTransform: 'uppercase', fontFamily: '"Woodford Bourne Pro", sans-serif' }}>
              PLAYING STYLE
            </Typography>
          </Box>
          
          {/* Spacer */}
          <Box sx={{ flex: 1 }} />
          
          {/* View Stats */}
          <Box sx={{ minWidth: { xs: 90, sm: 120 }, textAlign: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 11, sm: 19 }, textTransform: 'uppercase', fontFamily: '"Woodford Bourne Pro", sans-serif' }}>
              VIEW STATS
            </Typography>
          </Box>
          
          {/* XP Points */}
          <Box sx={{ minWidth: { xs: 90, sm: 120 }, ml: { xs: 1, sm: 1.5 , md : 7.5 }, textAlign: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 11, sm: 19 }, fontFamily: '"Woodford Bourne Pro", sans-serif' }}>
              <span style={{ textTransform: 'lowercase' }}>xp</span> POINTS
            </Typography>
          </Box>
        </Box>

        {/* Player List Content */}
        {searchTerm && filteredPlayers.length === 0 && (
          <Box sx={{ backgroundColor: 'rgba(40, 40, 40, 0.9)', py: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'white', fontWeight: 500 }}>
              User not found
            </Typography>
          </Box>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, backgroundColor: 'rgba(40, 40, 40, 0.9)' }}>
            <CircularProgress sx={{ color: '#e56a16' }} />
          </Box>
        ) : noLeagues ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, backgroundColor: 'rgba(40, 40, 40, 0.9)' }}>
            <Box sx={{ p: 3, textAlign: 'center', color: '#fff' }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>No leagues found</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Create a new league or join an existing one to see players here.</Typography>
            </Box>
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ py: 4, backgroundColor: 'rgba(40, 40, 40, 0.9)' }}>{error}</Typography>
        ) : (
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'visible',
            backgroundColor: '#383838',
            borderRadius: '0 0 8px 8px',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
             px: { xs: 0, sm: 1.5 },
             pb: { xs: 0, sm: 1.5 },
             pt: 0.5,
          
          }}>
            <List sx={{ p: 0 }}>
              {sortedPlayers.map((player: Player, idx: number) => {
                const isSelected = selectedPlayerId === player.id;
                let textColor = '#fff';
                let fontWeight = 500;
                if (idx === 0) {
                  textColor = '#fff';
                  fontWeight = 700;
                }
                // Alternating row colors
                const rowBgColor = idx % 2 === 0 ? '#383838' : '#2b2b2b';
                const rowBgColorHover = idx % 2 === 0 ? '#464646' : '#3a3a3a';
                
                return (
                  <React.Fragment key={player.id}>
                    <ListItem
                      onClick={() => {
                        setSelectedPlayerId(player.id);
                        router.push(`/player/${player.id}`);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        py: { xs: 0.7, sm: 0.7 },
                        px: { xs: 2, sm: 3 },
                        backgroundColor: rowBgColor,
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        color: textColor,
                        fontWeight,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        // '&:hover': {
                        //   backgroundColor: rowBgColorHover,
                        // }
                      }}
                    >
                      {/* Avatar + Name column (fixed width for stable alignment) */}
                      <Box sx={{
                        width: { xs: 196, sm: 280, md: 320 },
                        minWidth: { xs: 196, sm: 280, md: 320 },
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        pr: { xs: 1.2, sm: 2 }
                      }}>
                        <ListItemAvatar sx={{ minWidth: { xs: 52, sm: 60 } }}>
                          <Box sx={{ 
                            position: 'relative', 
                            width: { xs: 38, sm: 42 }, 
                            height: { xs: 38, sm: 42 },
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                          }}>
                            {player.profilePicture ? (
                              <Image 
                                src={player.profilePicture} 
                                alt={player.name} 
                                fill 
                                style={{ objectFit: 'cover' }} 
                              />
                            ) : (
                              <Image src={ShirtImg} alt="Default" fill style={{ objectFit: 'contain' }} />
                            )}
                          </Box>
                        </ListItemAvatar>
                        
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            noWrap
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: { xs: 12, sm: 15 },
                              color: '#fff',
                              lineHeight: 1.4,
                              fontFamily: '"Woodford Bourne Pro", sans-serif',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {getPlayerName(player)}
                          </Typography>
                          <Typography sx={{ 
                            fontSize: { xs: 10, sm: 12 },
                            color: 'rgba(255,255,255,0.6)',
                            mt: 0.25,
                            fontFamily: '"Woodford Bourne Pro", sans-serif'
                          }}>
                            {getPositionLabel(player)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Playing Style Column */}
                      <Box sx={{ 
                        width: { xs: 108, sm: 150, md: 180 },
                        minWidth: { xs: 108, sm: 150, md: 180 },
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pr: { xs: 0.5, sm: 2 }
                      }}>
                        <Typography sx={{ 
                          fontSize: { xs: 11, sm: 13 },
                          color: 'rgba(255,255,255,0.9)',
                          fontFamily: '"Woodford Bourne Pro", sans-serif'
                        }}>
                          {getPlayingStyle(player)}
                        </Typography>
                      </Box>
                      
                      {/* Spacer */}
                      <Box sx={{ flex: 1 }} />
                      
                      {/* View Stats Icon */}
                      <Box sx={{ 
                        minWidth: { xs: 90, sm: 120 }, 
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Image 
                          src={TableGraphIcon} 
                          alt="View Stats" 
                          width={isMobile ? 23 : 30} 
                          height={isMobile ? 23 : 30} 
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                      
                      {/* XP Points */}
                      <Box sx={{ 
                        minWidth: { xs: 90, sm: 120 }, 
                        ml: { xs: 1, sm: 1.5 ,md : 5.5 },
                        textAlign: 'center'
                      }}>
                        <Typography sx={{ 
                          fontWeight: 'bold', 
                          fontSize: { xs: 13, sm: 16 },
                          color: '#fff',
                          fontFamily: '"Woodford Bourne Pro", sans-serif'
                        }}>
                          {getCpPoints(player)}
                        </Typography>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        )}
        </Box>
        </Box>
      </Container>
      </Box>
    </>
  );
};

export default AllPlayersPage;
