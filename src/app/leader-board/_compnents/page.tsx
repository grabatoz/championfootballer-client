'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, MenuItem, Divider, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { ChevronDown, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks';
import Goals from '@/Components/images/goal.png'
import Imapct from '@/Components/images/imapct.png'
import Assist from '@/Components/images/Assist.png'
import MOTM from '@/Components/images/MOTM.png'
import CleanSheet from '@/Components/images/cleansheet.png'
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import React from 'react';
import Link from 'next/link';
import ShirtImg from '@/Components/images/shirtimg.png';
import CloseButton from '@/Components/CloseButton';


interface Player {
  id: string;
  name: string;
  positionType: string;
  profilePicture?: string;
  value: number;
  // shirtNumber?: string; // added
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

interface League {
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
  // Derived on client: whether the user is an admin of this league
  isAdmin?: boolean;
}

const metrics = [
  { key: 'goals', label: 'Goals', icon: Goals },
  { key: 'assists', label: 'Assists', icon: Assist },
  { key: 'motm', label: 'MOTM', icon: MOTM },
  { key: 'impact', label: 'Impact', icon: Imapct },
  { key: 'cleanSheet', label: 'Clean Sheet', icon: CleanSheet },
];

export default function LeaderBoardPage() {
  const [selectedMetric, setSelectedMetric] = useState('goals');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [registeredMemberIds, setRegisteredMemberIds] = useState<Set<string> | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
  const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);
  const { token } = useAuth();
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  // Helper: determine if a league is completed (season-aware)
  const leagueIsCompleted = React.useCallback((l: League): boolean => {
    // Prefer backend-computed season-based completion status
    if ((l as any)?.computedStatus?.isCompleted === true) return true;
    if ((l as { archived?: boolean })?.archived === true) return true;

    // Check explicit completion flags
    if (l?.isComplete === true) return true;
    if (l?.isCompleted === true) return true;
    if (l?.isLocked === true) return true;
    
    // Check status field
    const status = (l?.status ?? '').toString().trim().toUpperCase();
    if (status === 'COMPLETED' || status === 'FINISHED' || status === 'ENDED') return true;
    
    // Check active flag
    if (l?.active === false) return true;
    
    return false;
  }, []);

  // Fetch only the leagues where the current user is a member - OPTIMIZED
  useEffect(() => {
    if (!token) return;
    
    (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.user) {
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

          // Create simple league list without enrichment
          const simpleLeagues = Array.from(uniqueLeaguesMap.values()).map((league) => {
            const leagueId = String((league as { id?: string | number }).id);
            const isAdmin = adminIds.has(leagueId);
            return { 
              ...(league as League), 
              isAdmin 
            } as League;
          });

          // Show only active, non-completed, non-archived leagues
          const activeLeagues = simpleLeagues.filter(l => !leagueIsCompleted(l) && l.archived !== true);

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
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    })();
  }, [token, leagueIsCompleted]);

  // Fetch registered league members to ensure guests are excluded from leaderboard
  useEffect(() => {
    if (!selectedLeague || !token) {
      setRegisteredMemberIds(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague}?_=${Date.now()}`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        const members = Array.isArray(data?.league?.members) ? data.league.members : [];
        const ids = new Set<string>(
          members
            .map((m: { id?: string | number }) => String(m?.id ?? '').trim())
            .filter((id: string) => id.length > 0)
        );
        if (!cancelled) setRegisteredMemberIds(ids);
      } catch {
        if (!cancelled) setRegisteredMemberIds(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLeague, token]);

  // Fetch leaderboard when metric or league changes
  useEffect(() => {
    if (!selectedLeague || !token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard?metric=${selectedMetric}&leagueId=${selectedLeague}&limit=5`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const rawPlayers = Array.isArray(data?.players) ? data.players : [];
        const filteredPlayers: Player[] = rawPlayers.filter((p: Partial<Player>) => {
          const pid = String(p?.id ?? '').trim();
          if (!pid) return false;

          // Always exclude guest-like ids
          const lower = pid.toLowerCase();
          const isGuestLike = lower.startsWith('guest-') || lower.includes('guest_') || lower.includes('guest-');
          if (isGuestLike) return false;

          // If we know registered members for this league, keep only those users
          if (registeredMemberIds && registeredMemberIds.size > 0) {
            return registeredMemberIds.has(pid);
          }

          return true;
        }).map((p: Partial<Player>) => ({
          id: String(p.id ?? ''),
          name: String(p.name ?? 'Unknown Player'),
          positionType: String(p.positionType ?? '-'),
          profilePicture: p.profilePicture,
          value: Number(p.value ?? 0),
        }));

        setPlayers(filteredPlayers);
      })
      .catch(() => {
        setPlayers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedMetric, selectedLeague, token, registeredMemberIds]);

  const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLeaguesDropdownAnchor(event.currentTarget);
    setLeaguesDropdownOpen(true);
  };

  const handleLeaguesDropdownClose = () => {
    setLeaguesDropdownOpen(false);
    setLeaguesDropdownAnchor(null);
  };

  const handleLeagueSelect = (leagueId: string) => {
    if (leagueId !== selectedLeague) {
      setSelectedLeague(leagueId);
      try {
        localStorage.setItem(PREFERRED_LEAGUE_KEY, leagueId);
      } catch {}
    }
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

  const topPlayers = React.useMemo(() => players.slice(0, 5), [players]);

  const formatLeagueName = (name: string): string => {
    if (!name) return '';
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    const initials = name.split(' ').map(w => w.charAt(0).toUpperCase()).join('');
    return `${capitalizedName} (${initials})`;
  };

  return (
    <Box sx={{ p: 2 }}>

      {/* Close Button */}
      <CloseButton fallbackRoute="/dashboard" />

      {/* Metrics Grid + League dropdown inside */}
      <Box
        sx={{
          display: 'grid',
          // Remove empty space left by removed Defence metric
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' },
          gap: 1.5,
          mb: 3,
          background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
          borderRadius: 2,
          boxShadow: 1,
          p: { xs: 1.5, sm: 2 },
          alignItems: 'stretch'
        }}
      >
        {metrics.map(m => (
          <Button
            key={m.key}
            onClick={() => setSelectedMetric(m.key)}
            variant={selectedMetric === m.key ? 'contained' : 'outlined'}
            sx={{
              background: selectedMetric === m.key ? 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);' : 'rgba(255,255,255,0.08)',
              color: 'white',
              fontWeight: 'bold',
              flexDirection: 'column',
              borderRadius: 2,
              boxShadow: selectedMetric === m.key ? 2 : 0,
              minHeight: { xs: 68, sm: 80 },
              border: '1px solid #e56a16',
              p: { xs: 0.75, sm: 1 },
              transition: 'all 0.2s',
              '&:hover': {
                background: selectedMetric === m.key
                  ? 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);'
                  : 'rgba(255,255,255,0.12)',
                border: '1px solid #e56a16',
              },
            }}
            disabled={!selectedLeague}
          >
            <Image src={m.icon} alt={m.label} width={28} height={28} />
            <Typography variant="caption" sx={{ mt: 0.6, fontSize: { xs: 10, sm: 11 } }}>{m.label}</Typography>
          </Button>
        ))}

        {/* League dropdown left aligned */}
        <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-start', mt: { xs: 0.5, sm: 1 } }}>
          <Button
            onClick={handleLeaguesDropdownOpen}
            disabled={!leagues.length}
            endIcon={<ChevronDown size={18} />}
            sx={{
              textTransform: 'uppercase',
              fontSize: { xs: '0.9rem', sm: '1.05rem' },
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#2B2B2B',
              borderRadius: 2,
              px: { xs: 2, sm: 2.5 },
              py: { xs: 0.75, sm: 1 },
              minWidth: { xs: 190, sm: 240 },
              '&.Mui-disabled': {
                color: '#FFFFFF',
                opacity: 1,
                backgroundColor: '#2B2B2B',
                WebkitTextFillColor: '#FFFFFF',
              },
              '&:hover': { backgroundColor: '#2B2B2B' },
            }}
          >
            {leagues.length === 0
              ? 'No leagues found'
              : (selectedLeague
                ? formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')
                : 'Select League')}
          </Button>
          <Menu
            anchorEl={leaguesDropdownAnchor}
            open={leaguesDropdownOpen}
            onClose={handleLeaguesDropdownClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            MenuListProps={{ dense: false, sx: { p: 0 } }}
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
                maxHeight: 320,
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehavior: 'contain',
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
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: leagueItem.isAdmin ? '#fff' : 'rgba(255,255,255,0.08)',
                        color: leagueItem.isAdmin ? '#111827' : '#E5E7EB',
                        borderRadius: '9999px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        textTransform: 'uppercase',
                        border: leagueItem.isAdmin ? '1px solid rgba(255,255,255,0.0)' : '1px solid rgba(255,255,255,0.12)'
                      }}
                    >
                      {leagueItem.isAdmin ? 'Admin' : 'Member'}
                    </Box>
                  </Box>
                </MenuItem>
              );
            })}
          </Menu>
        </Box>
      </Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Top 5 Players</Typography>
      {loading ? (
        <CircularProgress />
      ) : !selectedLeague ? (
        <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.06)', color: 'white' }}>
          <Typography variant="body1">No active leagues available for leaderboard.</Typography>
        </Paper>
      ) : topPlayers.length === 0 ? (
        <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.06)', color: 'white' }}>
          <Typography variant="body1">No stats have been recorded for this league yet.</Typography>
        </Paper>
      ) : (
        topPlayers.map((player, idx) => {
          let badgeImg = null;
          if (idx === 0) badgeImg = FirstBadge;
          else if (idx === 1) badgeImg = SecondBadge;
          else if (idx === 2) badgeImg = ThirdBadge;
          return (
            <React.Fragment key={player.id}>
              <Link href={`/player/${player.id}`} passHref>
                <Paper sx={{ p: 2, display: 'flex', color: 'white', alignItems: 'center', background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);', borderRadius: 0 }}>
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
                      {/* {player.shirtNumber || '0'} */}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>{player.name}</Typography>
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
