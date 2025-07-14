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
} from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayedWithPlayers } from '@/lib/features/userSlice';
import { initializeFromStorage } from '@/lib/features/authSlice';
import { useRouter } from 'next/navigation';
// import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  profilePicture: string | null;
  rating: number;
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
      if(error) {
          console.error('Error from user slice:', error);
      }
  }, [error]);

  const filteredPlayers = playedWithPlayers.filter((player: Player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md" sx={{ py: 4, backgroundColor: '#0a3e1e', minHeight: '100vh' , color:'white' }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, backgroundColor: 'transparent' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#fff' }}>
          All Players
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for a player..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              backgroundColor: 'white',
            }
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, mb: 1 }}>
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
          <List>
            {filteredPlayers.map((player: Player) => {
              const isSelected = selectedPlayerId === player.id;
              return (
                <ListItem 
                  key={player.id}
                  onClick={() => {
                    setSelectedPlayerId(player.id);
                    router.push(`/player/${player.id}`);
                  }}
                  sx={{ 
                    mb: 1.5, 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    backgroundColor: isSelected ? '#000' : 'white',
                    color: isSelected ? 'white' : 'inherit',
                    cursor: 'pointer',
                  }}
                >
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
              );
            })}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default AllPlayersPage; 