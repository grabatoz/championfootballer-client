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
      py: 4, 
      backgroundColor: '#1f673b', 
      height: '100vh', 
      color: 'white',
      borderRadius: 5,
      overflow: 'hidden',
      mt:3
    }}>
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: 3, 
        backgroundColor: 'transparent',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#fff' }}>
          All Players
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for a player..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              backgroundColor: '#0a3e1e',
              color: 'white',
              '& fieldset': {
                borderColor: '#43a047',
              },
              '&:hover fieldset': {
                borderColor: '#43a047',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#43a047',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'white',
            },
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, mb: 1 }}>
          {/* <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>Pos</Typography> */}
          <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>Name</Typography>
          <Box sx={{ display: 'flex', gap: 5 }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>Stats</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>XP Points</Typography>
          </Box>
        </Box>

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
            borderRadius: 3,
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <List>
              {sortedPlayers.map((player: Player, idx: number) => {
                const isSelected = selectedPlayerId === player.id;
                // Gold, silver, bronze backgrounds
                let rowBg = '#0a4822';
                let textColor = '#fff';
                let fontWeight = 500;
                let badgeImg = null;
                let rowGradient = null;
                if (idx === 0) {
                  rowGradient = '#0a3e1e'; // gold/orange
                  textColor = '#fff';
                  fontWeight = 700;
                  badgeImg = FirstBadge;
                } else if (idx === 1) {
                  rowBg = '#0a4822'; // silver
                  badgeImg = SecondBadge;
                } else if (idx === 2) {
                  rowBg = '#094420'; // bronze
                  badgeImg = ThirdBadge;
                } else {
                  rowBg = '#0a4822';
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
                        background: rowGradient ? rowGradient : rowBg,
                        color: textColor,
                        fontWeight,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Ranking badge or number */}
                      <Box sx={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                        {badgeImg ? (
                          <img src={badgeImg.src} alt={`${idx + 1}st`} width={32} height={32} />
                        ) : (
                          <Box sx={{
                            width: 28, height: 28, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14,
                            borderRadius: '50%', background: 'rgba(255,255,255,0.15)'
                          }}>{`${idx + 1}th`}</Box>
                        )}
                      </Box>
                      <ListItemAvatar>
                        <Avatar src={player?.profilePicture || '/assets/group.svg'} />
                      </ListItemAvatar>
                      <ListItemText primary={player.name} primaryTypographyProps={{ fontWeight: 'medium' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 8, ml: 'auto' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                          <SignalCellularAltIcon sx={{ color: isSelected ? 'white' : '#00C853' }} />
                        </Box>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', minWidth: 60, textAlign: 'center' }}>
                          {player.rating}
                        </Typography>
                      </Box>
                    </ListItem>
                    {/* {idx !== sortedPlayers.length - 1 && ( */}
                      <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
                    {/* )} */}
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