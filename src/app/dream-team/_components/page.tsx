'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { useAuth } from '@/lib/useAuth';
import fieldImg from '@/Components/images/ground.webp'; // Place your field image in public/assets/field.png
import dreamteam from '@/Components/images/dream.png'
import { Trophy, ChevronDown } from 'lucide-react';
import ShirtImg from '@/Components/images/shirtimg.png';
import Image from 'next/image';
import Link from 'next/link';


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
  const [dreamTeam, setDreamTeam] = useState<DreamTeam>({
    goalkeeper: [],
    defenders: [],
    midfielders: [],
    forwards: []
  });
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);
  const leaguesDropdownOpen = Boolean(leaguesDropdownAnchor);

  const handleLeaguesDropdownOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLeaguesDropdownAnchor(e.currentTarget);
  };
  const handleLeaguesDropdownClose = () => setLeaguesDropdownAnchor(null);
  const handleLeagueSelect = (id: string) => {
    setSelectedLeague(id);
    handleLeaguesDropdownClose();
  };

  const formatLeagueName = (name: string) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    const caps = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return caps;
  };

  const sortedLeagues = React.useMemo(() => {
    if (!leagues?.length) return [];
    const arr = [...leagues];
    const idx = selectedLeague ? arr.findIndex(l => l.id === selectedLeague) : -1;
    if (idx > 0) {
      const [curr] = arr.splice(idx, 1);
      arr.unshift(curr);
    }
    return arr;
  }, [leagues, selectedLeague]);

  // Flatten Dream Team players for lists
  const dreamTeamPlayers = React.useMemo(() => {
    const list: Player[] = [];
    if (dreamTeam?.goalkeeper?.length) list.push(...dreamTeam.goalkeeper);
    if (dreamTeam?.defenders?.length) list.push(...dreamTeam.defenders);
    if (dreamTeam?.midfielders?.length) list.push(...dreamTeam.midfielders);
    if (dreamTeam?.forwards?.length) list.push(...dreamTeam.forwards);
    return list;
  }, [dreamTeam]);

  // Position abbreviation for UI (GK, DF, MD, ST)
  const posAbbr = (pos: string) => {
    const p = (pos || '').toLowerCase();
    if (p.startsWith('goal')) return 'GK';
    if (p.startsWith('def')) return 'DF';
    if (p.startsWith('mid')) return 'MD';
    if (p.startsWith('for') || p.startsWith('str')) return 'ST';
    return (pos || '').toUpperCase().slice(0, 3);
  };

  type JerseyValue = number | string;
  type WithJerseyFields = {
    jerseyNumber?: JerseyValue;
    shirtNumber?: JerseyValue;
    number?: JerseyValue;
  };

  // Jersey number helper (uses player.jerseyNumber/shirtNumber/number if present; otherwise sensible defaults)
  const getJerseyNumber = (p: (Player & WithJerseyFields) | undefined, type: string): string => {
    const num: JerseyValue | undefined = p?.jerseyNumber ?? p?.shirtNumber ?? p?.number;
    if (typeof num === 'number' || typeof num === 'string') return String(num);
    const defaults: Record<string, string> = { goalkeeper: '1', defenders: '4', midfielders: '8', forwards: '9' };
    return defaults[type] || '?';
  };

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

  const fieldPositions = [
    // Nudged inside a bit to avoid clipping with larger shirts
    { type: 'goalkeeper', left: '47%', top: '75%' },
    { type: 'defenders', left: '30%', top: '62%' },
    { type: 'defenders', left: '65%', top: '62%' },
    { type: 'midfielders', left: '47%', top: '44%' },
    { type: 'forwards', left: '47%', top: '18%' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Stack vertically on xs/sm, row on md+
          alignItems: { xs: "stretch", md: "center" }, // Stretch on mobile, center on desktop
          justifyContent: "space-between",
          mb: 4,
          gap: { xs: 3, md: 2 }, // Larger gap on mobile for better separation
          width: "100%",
        }}
      >
        {/* Mobile: League selector button */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Right: Form Control */}
          <Button
            onClick={handleLeaguesDropdownOpen}
            endIcon={<ChevronDown size={18} />}
            sx={{
              textTransform: 'uppercase',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold',
              lineHeight: 1.2,
              minWidth: 0,
              textAlign: 'left',
              color: 'white',
              backgroundColor: '#2B2B2B',
              borderRadius: 2,
              px: 2,
              py: 1,
              '&:hover': { backgroundColor: '#2B2B2B' },
            }}
          >
            {formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')}
          </Button>
        </Box>

        {/* Center: Dream Team Logo + Text */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: { xs: "100%", md: "auto" },
            mt: { xs: 2, md: 0 }, // Top margin on mobile
            mb: { xs: 2, md: 0 }, // Bottom margin on mobile
          }}
        >
          <Image
            src={dreamteam.src}
            alt="Dream Team Logo"
            height={80}
            width={80}
            style={{
              display: "block",
              objectFit: "contain"
            }}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'semibold',
              fontSize: { xs: '32px', sm: '42px', md: '56px' },
              color: "black",
              textAlign: "center",
              whiteSpace: "nowrap",
              letterSpacing: '2px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              fontFamily: '"Anton", sans-serif',

            }}
          >
            Dream Team
          </Typography>
        </Box>

        {/* Desktop: League selector button */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={handleLeaguesDropdownOpen}
            endIcon={<ChevronDown size={20} />}
            sx={{
              textTransform: 'uppercase',
              fontSize: { xs: '1rem', sm: '1.5rem', md: '1.4rem' },
              fontWeight: 'bold',
              lineHeight: 1.2,
              wordBreak: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'wrap',
              flexShrink: 1,
              minWidth: 0,
              textAlign: { xs: 'left', md: 'left' },
              color: 'white',
              backgroundColor: '#2B2B2B',
              borderRadius: 2,
              px: 2,
              py: 1,
              '&:hover': { backgroundColor: '#2B2B2B' },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')}
          </Button>
        </Box>
      </Box>

      {/* Shared dropdown menu */}
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
              {isActive ? (
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      bgcolor: '#0388E3',
                      color: 'white',
                      borderRadius: '9999px',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    }}
                  >
                    Current
                  </Box>
                </Box>
              ) : null}
            </MenuItem>
          );
        })}
      </Menu>

      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading Dream Team...</Typography>
        </Box>
      ) : (
        <>
          {/* Field (image) */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '2.1',
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03)',
              mb: 2,
            }}
          >
            <Image fill src={fieldImg} alt="Football Field" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  {/* Shirt with centered jersey number */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: 64, sm: 80, md: 94 },
                      height: { xs: 64, sm: 80, md: 94 },
                      mx: 'auto',
                    }}
                  >
                    <Link href={`/player/${player.id}`} prefetch={false} >
                    <Image
                      src={ShirtImg.src}
                      alt="Player Shirt"
                      width={94}
                      height={94}
                      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    </Link>

                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: { xs: 14, sm: 16, md: 18 },
                          lineHeight: 1,
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        {getJerseyNumber(player, pos.type)}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          mt: 0.25,
                          px: 0.5,
                          maxWidth: { xs: 48, sm: 52, md: 56 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: { xs: 9, sm: 10, md: 10 },
                          lineHeight: 1.1,
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        {player.firstName} {player.lastName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Player stats panel (always below the image) */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              color: '#E5E7EB',
              bgcolor: 'rgba(15,15,15,0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              mb: 4,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#E5E7EB' }}>
              Player stats
            </Typography>
            {dreamTeamPlayers.length ? (
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  p: 0,
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(2, 1fr)',
                  },
                  gap: 1.25,
                }}
              >
                {dreamTeamPlayers.map((p) => (
                  <Box
                    key={p.id}
                    component="li"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      position: 'relative',
                      pl: 2.25,
                      pr: 1.25,
                      py: 0.75,
                      borderRadius: 1.5,
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                      },
                    }}
                  >
                    {/* bullet dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 6,
                        height: 6,
                        bgcolor: '#22C55E',
                        borderRadius: '50%',
                      }}
                    />
                    {/* Link to player details (keeps same design) */}
                    <Link
                      href={`/player/${p.id}`}
                      prefetch={false}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Image
                          src={ShirtImg.src}
                          alt="Shirt"
                          width={18}
                          height={18}
                          style={{
                            filter:
                              'brightness(0) saturate(100%) invert(41%) sepia(86%) saturate(520%) hue-rotate(86deg) brightness(95%) contrast(95%)',
                          }}
                        />
                        <Typography component="span" sx={{ fontWeight: 700, color: '#E5E7EB' }}>
                          {p.firstName} {p.lastName}
                        </Typography>
                        <Typography component="span" sx={{ ml: 0.5, color: '#22C55E', fontWeight: 700 }}>
                          ({posAbbr(p.position)})
                        </Typography>
                      </Box>
                    </Link>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                No players in this Dream Team yet.
              </Typography>
            )}
          </Box>
        </>
      )}

    </Box>
  );
};

export default DreamTeamPage;