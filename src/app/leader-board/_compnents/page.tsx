'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, MenuItem, Divider, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { ChevronDown, Trophy } from 'lucide-react';
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
import Link from 'next/link';
import ShirtImg from '@/Components/images/shirtimg.png';


interface Player {
  id: string;
  name: string;
  positionType: string;
  profilePicture?: string;
  value: number;
  shirtNumber?: string; // added
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
  const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
  const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);
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
  console.log('Players:', players);

  const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLeaguesDropdownAnchor(event.currentTarget);
    setLeaguesDropdownOpen(true);
  };

  const handleLeaguesDropdownClose = () => {
    setLeaguesDropdownOpen(false);
    setLeaguesDropdownAnchor(null);
  };

  const handleLeagueSelect = (leagueId: string) => {
    if (leagueId !== selectedLeague) setSelectedLeague(leagueId);
    handleLeaguesDropdownClose();
  };

  const sortedLeagues = React.useMemo(() => {
    if (!leagues?.length) return [];
    const arr = [...leagues];
    const idx = arr.findIndex(l => l.id === selectedLeague);
    if (idx > 0) {
      const [sel] = arr.splice(idx, 1);
      arr.unshift(sel);
    }
    return arr;
  }, [leagues, selectedLeague]);

  const formatLeagueName = (name: string): string => {
    if (!name) return '';
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    const initials = name.split(' ').map(w => w.charAt(0).toUpperCase()).join('');
    return `${capitalizedName} (${initials})`;
  };

  return (
    <Box sx={{ p: 2 }}>

      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 3,
          // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
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
              background: selectedMetric === m.key ? 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);' : 'rgba(255,255,255,0.1)',
              color: selectedMetric === m.key ? 'white' : 'white',
              fontWeight: 'bold',
              mt: 1,
              flexDirection: 'column',
              borderRadius: 2,
              boxShadow: selectedMetric === m.key ? 2 : 0,
              minHeight: 80,
              border:'1px solid #e56a16',
              transition: 'all 0.2s',
              '&:hover': {
                background: selectedMetric === m.key
                  ? 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);'
                  : 'rgba(255,255,255,0.1)',
              border:'1px solid #e56a16',

              },
            }}
            disabled={!selectedLeague}
          >
            <Image src={m.icon} alt={m.label} width={32} height={32} />
            <Typography variant="caption" sx={{ mt: 1 }}>{m.label}</Typography>
          </Button>
        ))}
            
      {/* League dropdown (same style as All Leagues) */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
        <Button
          onClick={handleLeaguesDropdownOpen}
          disabled={!leagues.length}
          endIcon={<ChevronDown size={18} />}
          sx={{
            textTransform: 'uppercase',
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#2B2B2B',
            borderRadius: 2,
            px: 2,
            py: 1,
            '&:hover': { backgroundColor: '#2B2B2B' },
          }}
        >
          {selectedLeague
            ? formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')
            : 'Select League'}
        </Button>
        <Menu
          anchorEl={leaguesDropdownAnchor}
          open={leaguesDropdownOpen}
          onClose={handleLeaguesDropdownClose}
          PaperProps={{
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
              overflow: 'hidden',
            }
          }}
        >
          {sortedLeagues.map((leagueItem) => {
            const isActive = leagueItem.id === selectedLeague;
            return (
              <MenuItem
                key={leagueItem.id}
                onClick={() => handleLeagueSelect(leagueItem.id)}
                sx={{
                  borderRadius: 1.5,
                  mx: 0.5,
                  my: 0.25,
                  py: 1.25,
                  px: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#E5E7EB',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  },
                  ...(isActive && {
                    background: 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)',
                    border: '1px solid rgba(3,136,227,0.35)',
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Trophy size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
                </ListItemIcon>
                <ListItemText
                  primary={leagueItem.name}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: 0.2,
                      color: isActive ? '#FFFFFF' : '#E5E7EB',
                    }
                  }}
                />
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
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
              <Link href={`/player/${player.id}`} passHref> 
              <Paper sx={{ p: 2, display: 'flex', color:'white' , alignItems: 'center', background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);', borderRadius: 0 }}>
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
                <Box sx={{ position: 'relative', width: 64, height: 64, mr: 2 }}>
                  <Image src={ShirtImg} alt="Shirt" fill style={{ objectFit: 'contain' }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    {player.shirtNumber || '0'}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' , color:'white' }}>{player.name}</Typography>
                  <Typography variant="body2">Position: {player.positionType}</Typography>
                  <Typography variant="body2">{metrics.find(m => m.key === selectedMetric)?.label}: <b>{player.value}</b></Typography>
                </Box>
              </Paper>
              <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
              </Link>
            </React.Fragment>
          );
        })
      )}
    </Box>
  );
}