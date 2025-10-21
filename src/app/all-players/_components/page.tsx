'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
// import FirstBadge from '@/Components/images/1st.png';
// import SecondBadge from '@/Components/images/2nd.png';
// import ThirdBadge from '@/Components/images/3rd.png';
import Image from 'next/image';
import ShirtImg from '@/Components/images/shirtimg.png';
import CloseButton from '@/Components/CloseButton';

interface Player {
  id: string;
  name: string;
  profilePicture: string | null;
  rating: number;
  xpPoints?: number; // Added for XP points
  statsSum?: number; // Added for stats sum
  shirtNumber?: string; // Optional shirt number
}

// League option used by the UI select
interface LeagueOption { id: string; name: string }

// Minimal shape we expect from API for user leagues
type ApiUser = {
  leagues?: unknown;
  administeredLeagues?: unknown;
}

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';

// Convert an unknown array into a list of {id, name} with string ids; filters invalid entries
function parseLeagueOptions(value: unknown): LeagueOption[] {
  if (!Array.isArray(value)) return [];
  const out: LeagueOption[] = [];
  for (const item of value) {
    if (isRecord(item)) {
      const id = item.id as string | number | undefined;
      const name = item.name as string | undefined;
      if ((typeof id === 'string' || typeof id === 'number') && typeof name === 'string' && name.length > 0) {
        out.push({ id: String(id), name });
      }
    }
  }
  return out;
}

const AllPlayersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { playedWithPlayers, leaguePlayers, loading, error } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  const fetchLeagues = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data?.success && data?.user) {
        const userData: ApiUser = data.user as ApiUser;
        const userLeagues: LeagueOption[] = [
          ...parseLeagueOptions(userData.leagues),
          ...parseLeagueOptions(userData.administeredLeagues),
        ];
        const uniqueLeagues = Array.from(new Map(userLeagues.map((l) => [l.id, l])).values());
        setLeagues(uniqueLeagues);
      }
    } catch (e) {
      console.error('Failed to load leagues', e);
    }
  }, [token, selectedLeague]);

  useEffect(() => {
    if (token) {
      fetchLeagues();
    }
  }, [token, fetchLeagues]);

  const fetchAllLeaguesPlayers = useCallback(async () => {
    if (!token || leagues.length === 0) return;
    
    try {
      const allPlayersMap = new Map<string, Player>();
      
      // Fetch players from each league
      for (const league of leagues) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/players/by-league?leagueId=${league.id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const data = await response.json();
        
        if (data?.success && data?.players) {
          // Add players to map to avoid duplicates
          data.players.forEach((player: Player) => {
            if (!allPlayersMap.has(player.id)) {
              allPlayersMap.set(player.id, player);
            }
          });
        }
      }
      
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

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' , maxWidth:'lg' , py:4 }}>
      {/* Close Button - Top Right */}
      <CloseButton fallbackRoute="/dashboard" />
      
      <Container maxWidth="md" sx={{
        py: { xs: 2, sm: 4 },
        // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
        // background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            {/* InputLabel removed intentionally; provide OutlinedInput with notched={false} to avoid notch gap */}
            <Select
              id="league-select"
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              input={<OutlinedInput notched={false} />}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#e56a16' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#e56a16' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e56a16' },
              }}
            >
              <MenuItem value="all">All Leagues</MenuItem>
              {leagues.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 }, mb: 1 }}>
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, flex: 1, ml: 3 }}>Name</Typography>
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 } }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Stats</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>XP Points</Typography>
          </Box>
        </Box>
        {searchQuery && filteredPlayers.length === 0 && (
          <Typography sx={{ color: 'white', borderRadius: 2, px: 2, py: 1, mt: 1, textAlign: 'center', fontWeight: 500 }}>
            User not found
          </Typography>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
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