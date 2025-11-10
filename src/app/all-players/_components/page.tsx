'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  OutlinedInput,
  List,
  ListItem,
  ListItemAvatar,
  // Avatar,
  ListItemText,
  Paper,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchLeaguePlayers } from '@/lib/features/userSlice';
import { initializeFromStorage } from '@/lib/features/authSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ShirtImg from '@/Components/images/shirtimg.png';

// Lazy load CloseButton
const CloseButton = dynamic(() => import('@/Components/CloseButton'), {
  loading: () => <></>,
  ssr: false
});

interface Player {
  id: string;
  name: string;
  profilePicture: string | null;
  rating: number;
  xpPoints?: number; // Added for XP points
  statsSum?: number; // Added for stats sum
  shirtNumber?: string; // Optional shirt number
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
  matches?: Match[];
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
  const dispatch = useDispatch<AppDispatch>();
  const { playedWithPlayers, leaguePlayers, loading, error } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState<boolean>(false);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const router = useRouter();
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // Helper: determine if a league is completed
  const leagueIsCompleted = useCallback((l: LeagueOption): boolean => {
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

        // Enrich with computed status
        const enrichedLeagues = await Promise.all(
          Array.from(uniqueLeaguesMap.values()).map(async (league) => {
            try {
              const leagueId = String((league as { id?: string | number }).id);
              const isAdmin = adminIds.has(leagueId);
              const [statusRes, detailsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/status`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
              ]);

              let matchesFromDetails: Match[] | undefined = undefined;
              let maxGamesFromDetails: number | undefined = undefined;

              if (detailsRes.ok) {
                const leagueData = await detailsRes.json();
                const rawMatches = leagueData?.league?.matches as unknown;
                if (Array.isArray(rawMatches)) {
                  matchesFromDetails = rawMatches as Match[];
                }
                if (typeof leagueData?.league?.maxGames === 'number') {
                  maxGamesFromDetails = leagueData.league.maxGames as number;
                }
              }

              if (statusRes.ok) {
                const statusData = await statusRes.json();
                const raw = (statusData?.status || {}) as Record<string, unknown>;
                const toNum = (v: unknown): number | undefined => {
                  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
                  return Number.isFinite(n) ? n : undefined;
                };
                const matchesPlayed = toNum(raw?.matchesPlayed ?? raw?.gamesPlayed);
                const maxGames = toNum(raw?.maxGames);
                const locked = raw?.locked === true;
                const isComplete = raw?.isComplete === true;
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
                return {
                  ...league,
                  id: String(leagueId),
                  name: (league as { name?: string }).name || '',
                  computedStatus: computed,
                  isLocked: computed?.locked === true,
                  maxGames: maxGames ?? maxGamesFromDetails,
                  matches: matchesFromDetails,
                  isAdmin,
                } as LeagueOption;
              }

              return {
                id: String(leagueId),
                name: (league as { name?: string }).name || '',
                isAdmin,
              } as LeagueOption;
            } catch (error) {
              console.error(`Error fetching details for league`, error);
              const leagueId = String((league as { id?: string | number }).id);
              return {
                id: String(leagueId),
                name: (league as { name?: string }).name || '',
                isAdmin: adminIds.has(leagueId),
              } as LeagueOption;
            }
          })
        );

        // Filter out completed leagues
        const activeLeagues = enrichedLeagues.filter(l => !leagueIsCompleted(l));

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

  const fetchAllLeaguesPlayers = useCallback(async () => {
    if (!token || leagues.length === 0) return;
    
    try {
      const allPlayersMap = new Map<string, Player>();
      
      // Fetch players from ALL leagues in parallel (faster)
      const playerResponses = await Promise.all(
        leagues.map(league =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/players/by-league?leagueId=${league.id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        )
      );
      
      // Process all responses
      const allPlayerData = await Promise.all(
        playerResponses.map(response => response.json())
      );
      
      // Add all players to map (avoiding duplicates)
      allPlayerData.forEach(data => {
        if (data?.success && data?.players) {
          data.players.forEach((player: Player) => {
            if (!allPlayersMap.has(player.id)) {
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
  }, [token, leagues, dispatch]);

  useEffect(() => {
    if (!token) return;
    if (selectedLeague === 'all') {
      // Fetch all players from all leagues the user is part of
      fetchAllLeaguesPlayers();
    } else {
      dispatch(fetchLeaguePlayers(selectedLeague));
    }
  }, [dispatch, token, selectedLeague, fetchAllLeaguesPlayers]);

  useEffect(() => {
    if (error) {
      console.error('Error from user slice:', error);
    }
  }, [error]);

  const sourcePlayers = selectedLeague === 'all' ? playedWithPlayers : leaguePlayers;
  const filteredPlayers = sourcePlayers.filter((player: Player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log('Filtered Players:', filteredPlayers);

  // Helper to get XP points and stats sum for sorting
  function getXpPoints(player: Player) {
    // If XP points are a separate field, use it. Otherwise, use rating as XP points.
    return typeof player.xpPoints === 'number' ? player.xpPoints : player.rating;
  }
  function getStatsSum(player: Player) {
    // If player has a stats object/array, sum it. Otherwise, use rating.
    if (typeof player.statsSum === 'number') return player.statsSum;
    return player.rating;
  }

  // Sort players: first by XP points desc, then by stats sum desc
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const xpA = getXpPoints(a);
    const xpB = getXpPoints(b);
    if (xpB !== xpA) return xpB - xpA;
    // If XP points are equal, compare stats sum
    const statsA = getStatsSum(a);
    const statsB = getStatsSum(b);
    return statsB - statsA;
  });

  console.log('Sorted Players:', sortedPlayers);

  const noLeagues = !leaguesLoading && leagues.length === 0;

  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      py: 4
    }}>
      {/* Close Button - Top Left (design choice) */}
      <Box sx={{ position: 'absolute', top: 16, left: 26, zIndex: 10 }}>
        <CloseButton fallbackRoute="/dashboard" />
      </Box>
      <Container maxWidth="md" sx={{
        py: { xs: 2, sm: 4 },
        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
        minHeight: '100vh',
        color: 'white',
        borderRadius: { xs: 2, sm: 5 },
        overflow: 'hidden',
        mt: { xs: 1, sm: 3 },
        px: { xs: 0.5, sm: 2 },
        mb: { xs: 1, sm: 3 },
      }}>
        <Paper elevation={0} sx={{
        p: { xs: 1, sm: 3 },
        borderRadius: { xs: 2, sm: 3 },
        backgroundColor: 'transparent',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#fff', fontSize: { xs: 20, sm: 32 } }}>
          All Players
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            {/* InputLabel removed intentionally; provide OutlinedInput with notched={false} to avoid notch gap */}
            <Select
              id="league-select"
              value={selectedLeague}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedLeague(newValue);
                // Persist selection
                try {
                  if (typeof window !== 'undefined' && newValue !== 'all') {
                    localStorage.setItem(PREFERRED_LEAGUE_KEY, newValue);
                  }
                } catch {}
              }}
              renderValue={(value) => {
                if (noLeagues) return 'No leagues found';
                const v = String(value ?? '');
                if (v === 'all') return 'All Leagues';
                const found = leagues.find(l => l.id === v);
                return found?.name || '';
              }}
              MenuProps={{
                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                transformOrigin: { vertical: 'top', horizontal: 'left' },
                PaperProps: {
                  sx: {
                    p: 0.5,
                    mt: 1,
                    minWidth: 240,
                    bgcolor: 'rgba(15,15,15,0.92)',
                    color: '#E5E7EB',
                    borderRadius: 2.5,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                    // Cap height and enable vertical scrolling when items overflow
                    maxHeight: 320,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    overscrollBehavior: 'contain',
                    // Improve scrollbar visibility (Firefox + WebKit)
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#374151 #111827',
                    '&::-webkit-scrollbar': { width: 8 },
                    '&::-webkit-scrollbar-track': { background: '#111827' },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#374151',
                      borderRadius: 20,
                      border: '2px solid #111827'
                    },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#4b5563' },
                  },
                },
              }}
              input={<OutlinedInput notched={false} />}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#e56a16' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#e56a16' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e56a16' },
                // Improve disabled look when no leagues
                '& .MuiOutlinedInput-root.Mui-disabled': {
                  opacity: 1,
                  cursor: 'default',
                  backgroundColor: 'rgba(229,106,22,0.18)',
                  boxShadow: '0 0 0 1px rgba(229,106,22,0.5) inset',
                  borderRadius: 6
                },
                '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e56a16'
                },
                '& .MuiOutlinedInput-input.Mui-disabled': {
                  WebkitTextFillColor: '#E5E7EB',
                  color: '#E5E7EB'
                },
                '& .MuiSelect-select': {
                  whiteSpace: 'nowrap'
                },
                // Apply always-on hover highlight when there are no leagues
                ...(noLeagues ? {
                  // backgroundColor: 'rgba(229,106,22,0.15)',
                  boxShadow: '0 0 0 1px rgba(229,106,22,0.6) inset',
                  borderRadius: 1.5,
                } : {})
              }}
              disabled={noLeagues}
            >
              <MenuItem value="all">All Leagues</MenuItem>
              {leagues.map((l) => (
                <MenuItem key={l.id} value={l.id}
                  sx={{
                    borderRadius: 1.5,
                    mx: 0.5,
                    my: 0.25,
                    py: 1,
                    px: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#E5E7EB',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    },
                  }}
                >
                  <Box component="span" sx={{ flex: 1 }}>{l.name}</Box>
                  <Box
                    sx={{
                      ml: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: l.isAdmin ? '#fff' : 'rgba(255,255,255,0.08)',
                        color: l.isAdmin ? '#111827' : '#E5E7EB',
                        borderRadius: '9999px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        textTransform: 'uppercase',
                        border: l.isAdmin ? '1px solid rgba(255,255,255,0.0)' : '1px solid rgba(255,255,255,0.12)'
                      }}
                    >
                      {l.isAdmin ? 'Admin' : 'Member'}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for a player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                // borderRadius: '25px',
                // background: 'rgba(255,255,255,0.1)',
                height: 40,
                color: 'white',
                '& fieldset': { borderColor: '#e56a16' },
                '&:hover fieldset': { borderColor: '#e56a16' },
                '&.Mui-focused fieldset': { borderColor: '#e56a16' },
                '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                  WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.1) inset !important',
                  boxShadow: '0 0 0 1000px rgba(255,255,255,0.1) inset !important',
                  WebkitTextFillColor: 'white',
                  caretColor: 'white',
                  backgroundClip: 'content-box !important',
                  transition: 'background-color 9999s ease-out 0s',
                },
              },
              '& .MuiInputBase-input': { color: 'white', fontSize: { xs: 14, sm: 16 } },
              '& .MuiInputLabel-root': { color: 'white' },
            }}
          />
        </Box>
        {!noLeagues && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 }, mb: 1 }}>
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, flex: 1, ml: 3 }}>Name</Typography>
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 } }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Stats</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>XP Points</Typography>
          </Box>
        </Box>
        )}
        {searchQuery && filteredPlayers.length === 0 && (
          <Typography sx={{ color: 'white', borderRadius: 2, px: 2, py: 1, mt: 1, textAlign: 'center', fontWeight: 500 }}>
            User not found
          </Typography>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : noLeagues ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: '30vh', sm: '40vh' } }}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 3, color: '#fff' }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>No leagues found</Typography>
              <Typography variant="body2">Create a new league or join an existing one to see players here.</Typography>
            </Paper>
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            borderRadius: { xs: 2, sm: 3 },
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            px: { xs: 0, sm: 1 },
          }}>
            <List>
              {sortedPlayers.map((player: Player, idx: number) => {
                const isSelected = selectedPlayerId === player.id;
                // Gold, silver, bronze backgrounds
                // let rowBg = 'rgba(255,255,255,0.1)';
                let textColor = '#fff';
                let fontWeight = 500;
                // let badgeImg = null;
                // let rowGradient = null;
                if (idx === 0) {
                  // rowGradient = 'rgba(255,255,255,0.1)'; // gold/orange
                  textColor = '#fff';
                  fontWeight = 700;
                  // badgeImg = FirstBadge;
                } else if (idx === 1) {
                  // rowBg = '#0a4822'; // silver
                  // badgeImg = SecondBadge;
                } else if (idx === 2) {
                  // rowBg = '#094420'; // bronze
                  // badgeImg = ThirdBadge;
                } else {
                  // rowBg = '#0a4822';
                }
                return (
                  <React.Fragment key={player.id}>
                    <ListItem
                      onClick={() => {
                        setSelectedPlayerId(player.id);
                        router.push(`/player/${player.id}`);
                      }}
                      sx={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        // background: rowGradient ? rowGradient : rowBg,
                        background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',

                        color: textColor,
                        fontWeight,
                        cursor: 'pointer',
                        py: { xs: 1, sm: 2 },
                        px: { xs: 1, sm: 2 },
                        alignItems: 'center',
                      }}
                    >
                      {/* Ranking badge or number */}
                      {/* <Box sx={{ width: { xs: 28, sm: 36 }, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: { xs: 1, sm: 2 } }}>
                        {badgeImg ? (
                          <img src={badgeImg.src} alt={`${idx + 1}st`} width={24} height={24} style={{ borderRadius: '50%' }} />
                        ) : (
                          <Box sx={{
                            width: 20, height: 20, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 10,
                            borderRadius: '50%', background: 'rgba(255,255,255,0.15)'
                          }}>{`${idx + 1}th`}</Box>
                        )}
                      </Box> */}
                      <ListItemAvatar>
                        {/* Replaced Avatar with jersey + number */}
                        <Box sx={{ position: 'relative', width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }}>
                          <Image src={ShirtImg} alt="Shirt" fill style={{ objectFit: 'contain' }} />
                          {/* <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                              fontWeight: 800,
                              fontSize: { xs: 12, sm: 14 },
                              lineHeight: 1,
                            }}
                          >
                            {player.shirtNumber || '0'}
                          </Box> */}
                        </Box>
                      </ListItemAvatar>
                      <ListItemText primary={player.name} primaryTypographyProps={{ fontWeight: 'medium', fontSize: { xs: 13, sm: 16 } }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 8 }, ml: 'auto' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: { xs: 24, sm: 40 } }}>
                          <SignalCellularAltIcon sx={{ color: isSelected ? 'white' : 'green', fontSize: { xs: 16, sm: 24 } }} />
                        </Box>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', minWidth: { xs: 36, sm: 60 }, textAlign: 'center', fontSize: { xs: 13, sm: 20 } }}>
                          {player.rating}
                        </Typography>
                      </Box>
                    </ListItem>
                    <Divider sx={{ backgroundColor: '#fff', height: 2, mb: 0, mt: 0 }} />
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AllPlayersPage;