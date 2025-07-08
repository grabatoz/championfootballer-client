'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Avatar, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { useAuth } from '@/lib/useAuth';
import fieldImg from '@/Components/images/ground.png'; // Place your field image in public/assets/field.png
import PersonIcon from '@mui/icons-material/Person';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dreamteam from '@/Components/images/dream.png'


interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  profilePicture?: string;
  xp: number;
  achievements: string[];
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    motm: number;
    winPercentage: number;
    points: number;
  };
}

interface DreamTeam {
  goalkeeper: Player[];
  defenders: Player[];
  midfielders: Player[];
  forwards: Player[];
}

interface League {
  id: string;
  name: string;
}

const DreamTeamPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [dreamTeam, setDreamTeam] = useState<DreamTeam>({
    goalkeeper: [],
    defenders: [],
    midfielders: [],
    forwards: []
  });
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchLeagues = useCallback(async () => {
    console.log('🔍 Fetching leagues...');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setLeagues(data.leagues || []);
        if (data.leagues && data.leagues.length > 0) {
          setSelectedLeague(data.leagues[0].id);
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  }, [token]);

  const fetchDreamTeam = useCallback(async (leagueId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dream-team?leagueId=${leagueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDreamTeam(data.dreamTeam);
      }
    } catch (error) {
      console.error('Error fetching dream team:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - token:', token ? 'Present' : 'Missing');
    if (token) {
      console.log('✅ Token found, calling fetchLeagues');
      fetchLeagues();
    } else {
      console.log('❌ No token found, skipping fetchLeagues');
    }
  }, [token, fetchLeagues]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - selectedLeague:', selectedLeague);
    if (token && selectedLeague) {
      console.log('✅ Token and selectedLeague found, calling fetchDreamTeam');
      fetchDreamTeam(selectedLeague);
    } else {
      console.log('❌ Missing token or selectedLeague, skipping fetchDreamTeam');
    }
  }, [token, selectedLeague, fetchDreamTeam]);

  useEffect(() => {
    console.log('Leagues:', leagues);
    console.log('Selected League:', selectedLeague);
    console.log('Dream Team:', dreamTeam);
    console.log('Loading:', loading);
  }, [leagues, selectedLeague, dreamTeam, loading]);

  // const getPositionType = (position: string) => {
  //   if (position.includes('Goalkeeper')) return 'goalkeeper';
  //   if (position.includes('Back') || position.includes('Wing-back')) return 'defenders';
  //   if (position.includes('Midfielder')) return 'midfielders';
  //   if (position.includes('Forward') || position.includes('Striker') || position.includes('Winger')) return 'forwards';
  //   return 'midfielders'; // default fallback
  // };

  // const getPositionColor = (positionType: string) => {
  //   switch (positionType) {
  //     case 'goalkeeper': return 'error';
  //     case 'defenders': return 'primary';
  //     case 'midfielders': return 'success';
  //     case 'forwards': return 'warning';
  //     default: return 'default';
  //   }
  // };

  // const getPositionIcon = (positionType: string) => {
  //   switch (positionType) {
  //     case 'goalkeeper': return '🥅';
  //     case 'defenders': return '🛡️';
  //     case 'midfielders': return '⚽';
  //     case 'forwards': return '🎯';
  //     default: return '👤';
  //   }
  // };

  // Field positions for 1 GK, 2 DEF, 1 MID, 1 FWD
  const fieldPositions = [
    { type: 'goalkeeper', left: '47%', top: '80%' },
    { type: 'defenders', left: '30%', top: '60%' },
    { type: 'defenders', left: '65%', top: '60%' },
    { type: 'midfielders', left: '47%', top: '40%' },
    { type: 'forwards', left: '47%', top: '15%' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
         <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/dashboard`)} sx={{ mb: 2, color: 'black' }}>Back to Dashboard</Button>
      <Typography
  variant="h3"
  component="h1"
  gutterBottom
  align="center"
  sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
>
  <Image src={dreamteam} alt="img" height={80} width={80} style={{ marginRight: 8 }} />
  Dream Team
</Typography>
      <FormControl sx={{ minWidth: 240, mb: 3 }}>
        <InputLabel id="league-select-label">Select League</InputLabel>
        <Select
          labelId="league-select-label"
          value={selectedLeague}
          label="Select League"
          onChange={e => setSelectedLeague(e.target.value as string)}
        >
          {leagues.map(league => (
            <MenuItem key={league.id} value={league.id}>{league.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading Dream Team...</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 900, mx: 'auto', aspectRatio: '2.1', mb: 4 }}>
            <Image fill src={fieldImg} alt="Football Field" style={{ width: '100%', borderRadius: 16 }} />
            {/* Overlay players */}
            {fieldPositions.map((pos, idx) => {
              let player: Player | undefined;
              if (pos.type === 'goalkeeper') player = dreamTeam.goalkeeper[0];
              if (pos.type === 'defenders') player = dreamTeam.defenders[idx - 1];
              if (pos.type === 'midfielders') player = dreamTeam.midfielders[0];
              if (pos.type === 'forwards') player = dreamTeam.forwards[0];
              if (!player) return null;
              return (
                <Box
                  key={pos.type + idx}
                  sx={{
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 2,
                  }}
                >
                  <Avatar
                    src={player.profilePicture}
                    sx={{ width: 64, height: 64, bgcolor: '#1976d2', border: '3px solid #fff', mx: 'auto', mb: 1 }}
                  >
                    <PersonIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Avatar>
                  <Box
                    sx={{
                      position: 'relative',
                      top: '-36px',
                      width: 64,
                      mx: 'auto',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: 14,
                      py: 0.5,
                      px: 1,
                      textShadow: '0 1px 2px #000',
                    }}
                  >
                    {player.firstName}
                  </Box>
                </Box>
              );
            })}
          </Box>
          {/* <Paper elevation={3} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Typography variant="h5" align="center" sx={{ color: 'white', mb: 2 }}>
              Best Players by Position
            </Typography>
            <Typography variant="body1" align="center" sx={{ color: 'white', opacity: 0.9 }}>
              Based on performance statistics, XP points, and achievements
            </Typography>
          </Paper> */}

          {/* <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }}>
                <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                  <Typography variant="h6" gutterBottom>
                    🥅 Goalkeeper
                  </Typography>
                  {dreamTeam.goalkeeper.length > 0 ? (
                    <Box>
                      <Avatar
                        src={dreamTeam.goalkeeper[0].profilePicture}
                        sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid white' }}
                      >
                        {dreamTeam.goalkeeper[0].firstName[0]}
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        {dreamTeam.goalkeeper[0].firstName} {dreamTeam.goalkeeper[0].lastName}
                      </Typography>
                      <Chip 
                        label={dreamTeam.goalkeeper[0].position} 
                        size="small" 
                        sx={{ mb: 1, background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        <Typography variant="body2">XP: {dreamTeam.goalkeeper[0].xp}</Typography>
                        <Typography variant="body2">Clean Sheets: {dreamTeam.goalkeeper[0].stats.cleanSheets}</Typography>
                        <Typography variant="body2">MOTM: {dreamTeam.goalkeeper[0].stats.motm}</Typography>
                      </Stack>
                    </Box>
                  ) : (
                    <Typography variant="body2">No goalkeeper data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' }}>
                <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                  <Typography variant="h6" gutterBottom>
                    🛡️ Defenders
                  </Typography>
                  {dreamTeam.defenders.slice(0, 2).map((player, index) => (
                    <Box key={player.id} sx={{ mb: index < 1 ? 2 : 0 }}>
                      <Avatar
                        src={player.profilePicture}
                        sx={{ width: 60, height: 60, mx: 'auto', mb: 1, border: '2px solid white' }}
                      >
                        {player.firstName[0]}
                      </Avatar>
                      <Typography variant="body1" gutterBottom>
                        {player.firstName} {player.lastName}
                      </Typography>
                      <Chip 
                        label={player.position} 
                        size="small" 
                        sx={{ mb: 1, background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                      <Stack spacing={0.5}>
                        <Typography variant="caption">XP: {player.xp}</Typography>
                        <Typography variant="caption">Goals: {player.stats.goals}</Typography>
                        <Typography variant="caption">Assists: {player.stats.assists}</Typography>
                      </Stack>
                    </Box>
                  ))}
                  {dreamTeam.defenders.length === 0 && (
                    <Typography variant="body2">No defender data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    ⚽ Midfielders
                  </Typography>
                  {dreamTeam.midfielders.slice(0, 2).map((player, index) => (
                    <Box key={player.id} sx={{ mb: index < 1 ? 2 : 0 }}>
                      <Avatar
                        src={player.profilePicture}
                        sx={{ width: 60, height: 60, mx: 'auto', mb: 1, border: '2px solid #333' }}
                      >
                        {player.firstName[0]}
                      </Avatar>
                      <Typography variant="body1" gutterBottom>
                        {player.firstName} {player.lastName}
                      </Typography>
                      <Chip 
                        label={player.position} 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                      <Stack spacing={0.5}>
                        <Typography variant="caption">XP: {player.xp}</Typography>
                        <Typography variant="caption">Goals: {player.stats.goals}</Typography>
                        <Typography variant="caption">Assists: {player.stats.assists}</Typography>
                      </Stack>
                    </Box>
                  ))}
                  {dreamTeam.midfielders.length === 0 && (
                    <Typography variant="body2">No midfielder data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    🎯 Forwards
                  </Typography>
                  {dreamTeam.forwards.slice(0, 1).map((player) => (
                    <Box key={player.id}>
                      <Avatar
                        src={player.profilePicture}
                        sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid #333' }}
                      >
                        {player.firstName[0]}
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        {player.firstName} {player.lastName}
                      </Typography>
                      <Chip 
                        label={player.position} 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        <Typography variant="body2">XP: {player.xp}</Typography>
                        <Typography variant="body2">Goals: {player.stats.goals}</Typography>
                        <Typography variant="body2">Assists: {player.stats.assists}</Typography>
                        <Typography variant="body2">MOTM: {player.stats.motm}</Typography>
                      </Stack>
                    </Box>
                  ))}
                  {dreamTeam.forwards.length === 0 && (
                    <Typography variant="body2">No forward data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ p: 3, mt: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Formation: 4-4-2
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              p: 3,
              color: 'white'
            }}>
              <Typography variant="h6">🥅</Typography>
              <Typography variant="h6">🛡️ 🛡️ 🛡️ 🛡️</Typography>
              <Typography variant="h6">⚽ ⚽ ⚽ ⚽</Typography>
              <Typography variant="h6">🎯 🎯</Typography>
            </Box>
          </Paper> */}
        </>
      )}
    </Box>
  );
};

export default DreamTeamPage; 