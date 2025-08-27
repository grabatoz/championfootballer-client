'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayedWithPlayers } from '@/lib/features/userSlice';
import { initializeFromStorage } from '@/lib/features/authSlice';
import { useRouter } from 'next/navigation';
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
// import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  profilePicture: string | null;
  rating: number;
  xpPoints?: number; // Added for XP points
  statsSum?: number; // Added for stats sum
}

const AllPlayersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { playedWithPlayers, loading, error } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      dispatch(fetchPlayedWithPlayers());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (error) {
      console.error('Error from user slice:', error);
    }
  }, [error]);

  const filteredPlayers = playedWithPlayers.filter((player: Player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
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
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for a player..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              '& fieldset': {
                borderColor: '#e56a16',
              },
              '&:hover fieldset': {
                borderColor: '#e56a16',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#e56a16',
              },
              // Autofill fix for Chrome, Safari, Edge
              '& input:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                WebkitTextFillColor: 'white',
                caretColor: 'white',
                transition: 'background-color 5000s ease-in-out 0s',
              },
              '& input:-webkit-autofill:focus': {
                WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                WebkitTextFillColor: 'white',
                caretColor: 'white',
              },
              '& input:-webkit-autofill:hover': {
                WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                WebkitTextFillColor: 'white',
                caretColor: 'white',
              },
              '& input:-webkit-autofill:active': {
                WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                WebkitTextFillColor: 'white',
                caretColor: 'white',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
              fontSize: { xs: 14, sm: 16 },
            },
            '& .MuiInputLabel-root': {
              color: 'white',
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 }, mb: 1 }}>
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, minWidth: 40, textAlign: 'center' }}>Pos</Typography>
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
                let badgeImg = null;
                // let rowGradient = null;
                if (idx === 0) {
                  // rowGradient = 'rgba(255,255,255,0.1)'; // gold/orange
                  textColor = '#fff';
                  fontWeight = 700;
                  badgeImg = FirstBadge;
                } else if (idx === 1) {
                  // rowBg = '#0a4822'; // silver
                  badgeImg = SecondBadge;
                } else if (idx === 2) {
                  // rowBg = '#094420'; // bronze
                  badgeImg = ThirdBadge;
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
                      <Box sx={{ width: { xs: 28, sm: 36 }, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: { xs: 1, sm: 2 } }}>
                        {badgeImg ? (
                          <img src={badgeImg.src} alt={`${idx + 1}st`} width={24} height={24} style={{ borderRadius: '50%' }} />
                        ) : (
                          <Box sx={{
                            width: 20, height: 20, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 10,
                            borderRadius: '50%', background: 'rgba(255,255,255,0.15)'
                          }}>{`${idx + 1}th`}</Box>
                        )}
                      </Box>
                      <ListItemAvatar>
                        <Avatar src={player?.profilePicture || '/assets/group.svg'} sx={{ width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }} />
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
  );
};

export default AllPlayersPage; 