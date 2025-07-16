'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Avatar, CircularProgress, MenuItem, Select, FormControl, InputLabel, Divider } from '@mui/material';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks';
import Goals from '@/Components/images/goal.png'
import Imapct from '@/Components/images/imapct.png'
import Assist from '@/Components/images/Assist.png'
import Defence from '@/Components/images/defence.png'
import MOTM from '@/Components/images/MOTM.png'
import CleanSheet from '@/Components/images/cleansheet.png'
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import React from 'react';


interface Player {
  id: string;
  name: string;
  position: string;
  profilePicture?: string;
  value: number;
}

interface League {
  id: string;
  name: string;
}

const metrics = [
  { key: 'goals', label: 'Goals', icon: Goals },
  { key: 'assists', label: 'Assists', icon: Assist },
  { key: 'defence', label: 'Defence', icon: Defence },
  { key: 'motm', label: 'MOTM', icon: MOTM },
  { key: 'impact', label: 'Impact', icon: Imapct },
  { key: 'cleanSheet', label: 'Clean Sheet', icon: CleanSheet },
];

export default function LeaderBoardPage() {
  const [selectedMetric, setSelectedMetric] = useState('goals');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const { token } = useAuth();

  // Fetch only the leagues where the current user is a member (like all-matches)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          const userLeagues = [
            ...(data.user.leagues || []),
            ...(data.user.administeredLeagues || [])
          ];
          // Remove duplicates
          const uniqueLeagues = Array.from(new Map(userLeagues.map(league => [league.id, league])).values());
          setLeagues(uniqueLeagues);
          if (uniqueLeagues.length > 0) {
            setSelectedLeague(uniqueLeagues[0].id);
          }
        }
      });
  }, [token]);

  // Fetch leaderboard when metric or league changes
  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard?metric=${selectedMetric}&leagueId=${selectedLeague}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setPlayers(data.players);
        setLoading(false);
      });
  }, [selectedMetric, selectedLeague, token]);

  return (
    <Box sx={{ p: 2 }}>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 3,
          background: '#1f673b',
          borderRadius: 2,
          boxShadow: 1,
          p: 2,
        }}
      >
        {metrics.map(m => (
          <Button
            key={m.key}
            onClick={() => setSelectedMetric(m.key)}
            variant={selectedMetric === m.key ? 'contained' : 'outlined'}
            sx={{
              bgcolor: selectedMetric === m.key ? '#43a047' : 'white',
              color: selectedMetric === m.key ? 'white' : 'black',
              fontWeight: 'bold',
              mt: 1,
              flexDirection: 'column',
              borderRadius: 2,
              boxShadow: selectedMetric === m.key ? 2 : 0,
              minHeight: 80,
              transition: 'all 0.2s',
              '&:hover': {
                background: selectedMetric === m.key
                  ? '#388e3c'
                  : '#f5f5f5',
              },
            }}
            disabled={!selectedLeague}
          >
            <Image src={m.icon} alt={m.label} width={32} height={32} />
            <Typography variant="caption" sx={{ mt: 1 }}>{m.label}</Typography>
          </Button>
        ))}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel
            id="league-select-label"
            sx={{
              color: 'white',
              '&.Mui-focused': { color: 'white' },
              '&.MuiInputLabel-shrink': { color: 'white' },
            }}
          >
            Select League
          </InputLabel>
          <Select
            labelId="league-select-label"
            value={selectedLeague}
            label="Select League"
            onChange={e => setSelectedLeague(e.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#43a047',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#43a047',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#43a047',
              },
            }}
          >
            {leagues.map(league => (
              <MenuItem key={league.id} value={league.id}>{league.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Top Players</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        players.map((player, idx) => {
          let badgeImg = null;
          if (idx === 0) badgeImg = FirstBadge;
          else if (idx === 1) badgeImg = SecondBadge;
          else if (idx === 2) badgeImg = ThirdBadge;
          return (
            <React.Fragment key={player.id}>
              <Paper sx={{ p: 2, display: 'flex', color:'white' , alignItems: 'center', background: '#0a3e1e', borderRadius: 0 }}>
                {/* Ranking badge or number */}
                <Box sx={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                  {badgeImg ? (
                    <img src={badgeImg.src} alt={`${idx + 1}st`} width={32} height={32} />
                  ) : (
                    <Box sx={{
                      width: 28, height: 28, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14
                    }}>{`${idx + 1}th`}</Box>
                  )}
                </Box>
                <Avatar
                  src={
                    player?.profilePicture
                      ? (player.profilePicture || '/assets/group.svg'
                          ? player.profilePicture
                          : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : '/' + player.profilePicture}`)
                      : '/assets/group451.png'
                  }
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' , color:'white' }}>{player.name}</Typography>
                  <Typography variant="body2">Position: {player.position}</Typography>
                  <Typography variant="body2">{metrics.find(m => m.key === selectedMetric)?.label}: <b>{player.value}</b></Typography>
                </Box>
              </Paper>
              <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
            </React.Fragment>
          );
        })
      )}
    </Box>
  );
} 