'use client';
  
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { useAuth } from '@/lib/useAuth';
import fieldImg from '@/Components/images/ground.webp'; // Place your field image in public/assets/field.png
// import dreamteam from '@/Components/images/dream.png'
import { Trophy, ChevronDown } from 'lucide-react';
import ShirtImg from '@/Components/images/shirtimg.png';
import Image from 'next/image';
import Link from 'next/link';
import CloseButton from '@/Components/CloseButton';


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
  matches?: Match[];
  // Derived on client: whether the user is an admin of this league
  isAdmin?: boolean;
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
  const noLeagues = leagues.length === 0;

  const handleLeaguesDropdownOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (noLeagues) return; // don't open when there are no leagues
    setLeaguesDropdownAnchor(e.currentTarget);
  };
  const handleLeaguesDropdownClose = () => setLeaguesDropdownAnchor(null);
  const handleLeagueSelect = (id: string) => {
    setSelectedLeague(id);
    // Persist selection
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERRED_LEAGUE_KEY, id);
      }
    } catch {}
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getJerseyNumber = (p: (Player & WithJerseyFields) | undefined, type: string): string => {
    const num: JerseyValue | undefined = p?.jerseyNumber ?? p?.shirtNumber ?? p?.number;
    if (typeof num === 'number' || typeof num === 'string') return String(num);
    const defaults: Record<string, string> = { goalkeeper: '1', defenders: '4', midfielders: '8', forwards: '9' };
    return defaults[type] || '?';
  };

  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  const fetchLeagues = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Get admin leagues IDs
      const adminLeaguesArr = (data.user.adminLeagues || data.user.administeredLeagues || []) as Array<{ id?: string | number }>;
      const adminIds = new Set<string>(
        adminLeaguesArr
          .map(l => (l && (l as { id?: string | number }).id != null ? String((l as { id?: string | number }).id) : undefined))
          .filter((v): v is string => typeof v === 'string')
      );
      
      // Combine all leagues
      const userLeagues = [
        ...(data.user.leagues || []),
        ...adminLeaguesArr
      ];

      // Remove duplicates & add isAdmin flag
      const uniqueLeaguesMap = new Map();
      userLeagues.forEach(league => {
        const id = String((league as { id?: string | number }).id);
        if (!uniqueLeaguesMap.has(id)) {
          uniqueLeaguesMap.set(id, { ...league, isAdmin: adminIds.has(id) });
        }
      });

      const allLeagues = Array.from(uniqueLeaguesMap.values()) as League[];

      // Sort alphabetically
      allLeagues.sort((a, b) => {
        const an = (a?.name ?? '').toString().trim().toLowerCase();
        const bn = (b?.name ?? '').toString().trim().toLowerCase();
        return an.localeCompare(bn) || String(a.id).localeCompare(String(b.id));
      });

      setLeagues(allLeagues);

      // Auto-select preferred league
      if (allLeagues.length > 0) {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
        const preferred = storedId ? allLeagues.find(l => l.id === storedId) : null;
        setSelectedLeague(preferred ? preferred.id : allLeagues[0].id);
      } else {
        setSelectedLeague('');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setLoading(false);
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
    if (token) {
      fetchLeagues();
    }
  }, [token, fetchLeagues]);

  useEffect(() => {
    if (token && selectedLeague) {
      fetchDreamTeam(selectedLeague);
    }
  }, [token, selectedLeague, fetchDreamTeam]);

  // Responsive field positions for different breakpoints (xs/sm/md)
  type ResponsivePos = string | { xs?: string; sm?: string; md?: string; lg?: string };
  interface FieldPosition {
    type: 'goalkeeper' | 'defenders' | 'midfielders' | 'forwards';
    left: ResponsivePos;
    top: ResponsivePos;
  }

  const fieldPositions: FieldPosition[] = [
    // Slightly different placement on mobile to avoid overlap
    {
      type: 'goalkeeper',
      left: { xs: '50%', sm: '48%', md: '47%' },
      top: { xs: '82%', sm: '78%', md: '75%' },
    },
    {
      type: 'defenders',
      left: { xs: '28%', sm: '30%', md: '30%' },
      top: { xs: '64%', sm: '63%', md: '62%' },
    },
    {
      type: 'defenders',
      left: { xs: '72%', sm: '66%', md: '65%' },
      top: { xs: '64%', sm: '63%', md: '62%' },
    },
    {
      type: 'midfielders',
      left: { xs: '50%', sm: '48%', md: '47%' },
      top: { xs: '46%', sm: '45%', md: '44%' },
    },
    {
      type: 'forwards',
      left: { xs: '50%', sm: '48%', md: '47%' },
      top: { xs: '20%', sm: '19%', md: '18%' },
    },
  ];

  return (
    <Box sx={{ py: 4, p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Close Button */}
      <CloseButton fallbackRoute="/dashboard" />
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
            {loading
              ? 'Loading...'
              : noLeagues
              ? 'No leagues found'
              : formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')}
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
          {/* <Image
            src={dreamteam.src}
            alt="Dream Team Logo"
            height={80}
            width={80}
            style={{
              display: "block",
              objectFit: "contain"
            }}
          /> */}
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
            {loading
              ? 'Loading...'
              : noLeagues
              ? 'No leagues found'
              : formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')}
          </Button>
        </Box>
      </Box>

      {/* Shared dropdown menu */}
      <Menu
        anchorEl={leaguesDropdownAnchor}
        open={leaguesDropdownOpen}
        onClose={handleLeaguesDropdownClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
          }
        }}
      >
        {noLeagues ? (
          <MenuItem disabled sx={{ opacity: 0.7 }}>
            No leagues found
          </MenuItem>
        ) : sortedLeagues.map((leagueItem) => {
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
                {/* Role chip: Admin or Member */}
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

                {/* {isActive ? (
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
                ) : null} */}
              </Box>
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
              // Taller pitch on mobile, wider on desktop
              aspectRatio: { xs: '3 / 4', sm: '16 / 10', md: '21 / 10' },
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
                  {/* Shirt image; player name shown below (no jersey number) */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: 56, sm: 72, md: 94 },
                      height: { xs: 56, sm: 72, md: 94 },
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
                  </Box>

                  {/* Player name below the shirt */}
                  <Typography
                    component="div"
                    sx={{
                      mt: 0.5,
                      px: 0.5,
                      maxWidth: { xs: 88, sm: 110, md: 140 },
                      overflow: 'hidden',
                      textOverflow: { xs: 'ellipsis', sm: 'ellipsis', md: 'ellipsis' },
                      whiteSpace: { xs: 'nowrap', sm: 'nowrap', md: 'nowrap' },
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: { xs: 10, sm: 12, md: 12 },
                      lineHeight: 1.2,
                      textAlign: 'center',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}
                  >
                    {player.firstName} {player.lastName}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Player stats panel (below the image) */}
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
              {noLeagues ? 'No leagues found' : 'Player stats'}
            </Typography>
            {noLeagues ? (
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                You are not a member of any league yet. Join or create a league to view your Dream Team.
              </Typography>
            ) : dreamTeamPlayers.length ? (
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  p: 0,
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
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








// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText, Button } from '@mui/material';
// import { useAuth } from '@/lib/useAuth';
// import fieldImg from '@/Components/images/ground.webp'; // Place your field image in public/assets/field.png
// // import dreamteam from '@/Components/images/dream.png'
// import { Trophy, ChevronDown } from 'lucide-react';
// import ShirtImg from '@/Components/images/shirtimg.png';
// import Image from 'next/image';
// import Link from 'next/link';


// interface Player {
//   id: string;
//   firstName: string;
//   lastName: string;
//   position: string;
//   profilePicture?: string;
//   xp: number;
//   achievements: string[];
//   stats: {
//     matchesPlayed: number;
//     goals: number;
//     assists: number;
//     cleanSheets: number;
//     motm: number;
//     winPercentage: number;
//     points: number;
//   };
// }

// interface DreamTeam {
//   goalkeeper: Player[];
//   defenders: Player[];
//   midfielders: Player[];
//   forwards: Player[];
// }

// interface League {
//   id: string;
//   name: string;
// }

// const DreamTeamPage = () => {
//   const { token } = useAuth();
//   const [dreamTeam, setDreamTeam] = useState<DreamTeam>({
//     goalkeeper: [],
//     defenders: [],
//     midfielders: [],
//     forwards: []
//   });
//   const [leagues, setLeagues] = useState<League[]>([]);
//   const [selectedLeague, setSelectedLeague] = useState<string>('');
//   const [loading, setLoading] = useState(true);
//   const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);
//   const leaguesDropdownOpen = Boolean(leaguesDropdownAnchor);
//   const noLeagues = leagues.length === 0;

//   const handleLeaguesDropdownOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//     if (noLeagues) return; // don't open when there are no leagues
//     setLeaguesDropdownAnchor(e.currentTarget);
//   };
//   const handleLeaguesDropdownClose = () => setLeaguesDropdownAnchor(null);
//   const handleLeagueSelect = (id: string) => {
//     setSelectedLeague(id);
//     handleLeaguesDropdownClose();
//   };

//   const formatLeagueName = (name: string) => {
//     if (!name) return '';
//     const words = name.trim().split(/\s+/);
//     const caps = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
//     return caps;
//   };

//   const sortedLeagues = React.useMemo(() => {
//     if (!leagues?.length) return [];
//     const arr = [...leagues];
//     const idx = selectedLeague ? arr.findIndex(l => l.id === selectedLeague) : -1;
//     if (idx > 0) {
//       const [curr] = arr.splice(idx, 1);
//       arr.unshift(curr);
//     }
//     return arr;
//   }, [leagues, selectedLeague]);

//   // Flatten Dream Team players for lists
//   const dreamTeamPlayers = React.useMemo(() => {
//     const list: Player[] = [];
//     if (dreamTeam?.goalkeeper?.length) list.push(...dreamTeam.goalkeeper);
//     if (dreamTeam?.defenders?.length) list.push(...dreamTeam.defenders);
//     if (dreamTeam?.midfielders?.length) list.push(...dreamTeam.midfielders);
//     if (dreamTeam?.forwards?.length) list.push(...dreamTeam.forwards);
//     return list;
//   }, [dreamTeam]);

//   // Position abbreviation for UI (GK, DF, MD, ST)
//   const posAbbr = (pos: string) => {
//     const p = (pos || '').toLowerCase();
//     if (p.startsWith('goal')) return 'GK';
//     if (p.startsWith('def')) return 'DF';
//     if (p.startsWith('mid')) return 'MD';
//     if (p.startsWith('for') || p.startsWith('str')) return 'ST';
//     return (pos || '').toUpperCase().slice(0, 3);
//   };

//   type JerseyValue = number | string;
//   type WithJerseyFields = {
//     jerseyNumber?: JerseyValue;
//     shirtNumber?: JerseyValue;
//     number?: JerseyValue;
//   };

//   // Jersey number helper (uses player.jerseyNumber/shirtNumber/number if present; otherwise sensible defaults)
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const getJerseyNumber = (p: (Player & WithJerseyFields) | undefined, type: string): string => {
//     const num: JerseyValue | undefined = p?.jerseyNumber ?? p?.shirtNumber ?? p?.number;
//     if (typeof num === 'number' || typeof num === 'string') return String(num);
//     const defaults: Record<string, string> = { goalkeeper: '1', defenders: '4', midfielders: '8', forwards: '9' };
//     return defaults[type] || '?';
//   };

//   const fetchLeagues = useCallback(async () => {
//     console.log('🔍 Fetching leagues...');
//     console.log('Token:', token ? 'Present' : 'Missing');
//     console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/user`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       console.log('Response status:', response.status);
//       console.log('Response ok:', response.ok);

//       if (response.ok) {
//         const data = await response.json();
//         console.log('Response data:', data);
//         setLeagues(data.leagues || []);
//         if (data.leagues && data.leagues.length > 0) {
//           setSelectedLeague(data.leagues[0].id);
//         } else {
//           setSelectedLeague('');
//           setLoading(false); // no leagues -> stop loading
//         }
//       } else {
//         console.error('Response not ok:', response.status, response.statusText);
//         const errorText = await response.text();
//         console.error('Error response:', errorText);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error('Error fetching leagues:', error);
//       setLoading(false);
//     }
//   }, [token]);

//   const fetchDreamTeam = useCallback(async (leagueId: string) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dream-team?leagueId=${leagueId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setDreamTeam(data.dreamTeam);
//       }
//     } catch (error) {
//       console.error('Error fetching dream team:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [token]);

//   useEffect(() => {
//     console.log('🔍 useEffect triggered - token:', token ? 'Present' : 'Missing');
//     if (token) {
//       console.log('✅ Token found, calling fetchLeagues');
//       fetchLeagues();
//     } else {
//       console.log('❌ No token found, skipping fetchLeagues');
//     }
//   }, [token, fetchLeagues]);

//   useEffect(() => {
//     console.log('🔍 useEffect triggered - selectedLeague:', selectedLeague);
//     if (token && selectedLeague) {
//       console.log('✅ Token and selectedLeague found, calling fetchDreamTeam');
//       fetchDreamTeam(selectedLeague);
//     } else {
//       console.log('❌ Missing token or selectedLeague, skipping fetchDreamTeam');
//     }
//   }, [token, selectedLeague, fetchDreamTeam]);

//   useEffect(() => {
//     console.log('Leagues:', leagues);
//     console.log('Selected League:', selectedLeague);
//     console.log('Dream Team:', dreamTeam);
//     console.log('Loading:', loading);
//   }, [leagues, selectedLeague, dreamTeam, loading]);

//   const fieldPositions = [
//     // Nudged inside a bit to avoid clipping with larger shirts
//     { type: 'goalkeeper', left: '47%', top: '75%' },
//     { type: 'defenders', left: '30%', top: '62%' },
//     { type: 'defenders', left: '65%', top: '62%' },
//     { type: 'midfielders', left: '47%', top: '44%' },
//     { type: 'forwards', left: '47%', top: '18%' },
//   ];

//   return (
//     <Box sx={{ py: 4,p:3 , maxWidth: 1200, mx: 'auto' }}>
//       <Box
//         sx={{
//           display: "flex",
//           flexDirection: { xs: "column", md: "row" }, // Stack vertically on xs/sm, row on md+
//           alignItems: { xs: "stretch", md: "center" }, // Stretch on mobile, center on desktop
//           justifyContent: "space-between",
//           mb: 4,
//           gap: { xs: 3, md: 2 }, // Larger gap on mobile for better separation
//           width: "100%",
//         }}
//       >
//         {/* Mobile: League selector button */}
//         <Box
//           sx={{
//             display: { xs: "flex", md: "none" },
//             justifyContent: "space-between",
//             alignItems: "center",
//             width: "100%",
//           }}
//         >
//           {/* Right: Form Control */}
//           <Button
//             onClick={handleLeaguesDropdownOpen}
//             endIcon={<ChevronDown size={18} />}
//             sx={{
//               textTransform: 'uppercase',
//               fontSize: { xs: '1rem', sm: '1.1rem' },
//               fontWeight: 'bold',
//               lineHeight: 1.2,
//               minWidth: 0,
//               textAlign: 'left',
//               color: 'white',
//               backgroundColor: '#2B2B2B',
//               borderRadius: 2,
//               px: 2,
//               py: 1,
//               '&:hover': { backgroundColor: '#2B2B2B' },
//             }}
//           >
//             {noLeagues
//               ? 'No leagues found'
//               : formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')}
//           </Button>
//         </Box>

//         {/* Center: Dream Team Logo + Text */}
//         <Box
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: 2,
//             width: { xs: "100%", md: "auto" },
//             mt: { xs: 2, md: 0 }, // Top margin on mobile
//             mb: { xs: 2, md: 0 }, // Bottom margin on mobile
//           }}
//         >
//           {/* <Image
//             src={dreamteam.src}
//             alt="Dream Team Logo"
//             height={80}
//             width={80}
//             style={{
//               display: "block",
//               objectFit: "contain"
//             }}
//           /> */}
//           <Typography
//             variant="h3"
//             component="h1"
//             sx={{
//               fontWeight: 'semibold',
//               fontSize: { xs: '32px', sm: '42px', md: '56px' },
//               color: "black",
//               textAlign: "center",
//               whiteSpace: "nowrap",
//               letterSpacing: '2px',
//               textShadow: '0 2px 4px rgba(0,0,0,0.3)',
//               fontFamily: '"Anton", sans-serif',

//             }}
//           >
//             Dream Team
//           </Typography>
//         </Box>

//         {/* Desktop: League selector button */}
//         <Box
//           sx={{
//             display: { xs: "none", md: "flex" },
//             justifyContent: "flex-end",
//           }}
//         >
//           <Button
//             onClick={handleLeaguesDropdownOpen}
//             endIcon={<ChevronDown size={20} />}
//             sx={{
//               textTransform: 'uppercase',
//               fontSize: { xs: '1rem', sm: '1.5rem', md: '1.4rem' },
//               fontWeight: 'bold',
//               lineHeight: 1.2,
//               wordBreak: 'break-word',
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//               whiteSpace: 'wrap',
//               flexShrink: 1,
//               minWidth: 0,
//               textAlign: { xs: 'left', md: 'left' },
//               color: 'white',
//               backgroundColor: '#2B2B2B',
//               borderRadius: 2,
//               px: 2,
//               py: 1,
//               '&:hover': { backgroundColor: '#2B2B2B' },
//               display: 'flex',
//               alignItems: 'center',
//               gap: 1,
//             }}
//           >
//             {noLeagues
//               ? 'No leagues found'
//               : formatLeagueName(leagues.find(l => l.id === selectedLeague)?.name || 'Select League')}
//           </Button>
//         </Box>
//       </Box>

//       {/* Shared dropdown menu */}
//       <Menu
//         anchorEl={leaguesDropdownAnchor}
//         open={leaguesDropdownOpen}
//         onClose={handleLeaguesDropdownClose}
//         PaperProps={{
//           sx: {
//             p: 0.5,
//             mt: 1,
//             minWidth: 240,
//             bgcolor: 'rgba(15,15,15,0.92)',
//             color: '#E5E7EB',
//             borderRadius: 2.5,
//             border: '1px solid rgba(255,255,255,0.08)',
//             backdropFilter: 'blur(10px)',
//             boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
//             overflow: 'hidden',
//           }
//         }}
//       >
//         {noLeagues ? (
//           <MenuItem disabled sx={{ opacity: 0.7 }}>
//             No leagues found
//           </MenuItem>
//         ) : sortedLeagues.map((leagueItem) => {
//           const isActive = leagueItem.id === selectedLeague;
//           return (
//             <MenuItem
//               key={leagueItem.id}
//               onClick={() => handleLeagueSelect(leagueItem.id)}
//               sx={{
//                 borderRadius: 1.5,
//                 mx: 0.5,
//                 my: 0.25,
//                 py: 1.25,
//                 px: 1.5,
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 1,
//                 color: '#E5E7EB',
//                 transition: 'all 0.2s ease',
//                 '&:hover': {
//                   transform: 'translateY(-1px)',
//                   background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
//                 },
//                 ...(isActive && {
//                   background: 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)',
//                   border: '1px solid rgba(3,136,227,0.35)',
//                 }),
//               }}
//             >
//               <ListItemIcon sx={{ minWidth: 36 }}>
//                 <Trophy size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
//               </ListItemIcon>
//               <ListItemText
//                 primary={leagueItem.name}
//                 sx={{
//                   '& .MuiListItemText-primary': {
//                     fontSize: '0.95rem',
//                     fontWeight: isActive ? 700 : 500,
//                     letterSpacing: 0.2,
//                     color: isActive ? '#FFFFFF' : '#E5E7EB',
//                   }
//                 }}
//               />
//               {isActive ? (
//                 <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                   <Box
//                     sx={{
//                       px: 1,
//                       py: 0.25,
//                       bgcolor: '#0388E3',
//                       color: 'white',
//                       borderRadius: '9999px',
//                       fontSize: 10,
//                       fontWeight: 700,
//                       letterSpacing: 0.3,
//                       textTransform: 'uppercase',
//                     }}
//                   >
//                     Current
//                   </Box>
//                 </Box>
//               ) : null}
//             </MenuItem>
//           );
//         })}
//       </Menu>

//       {loading ? (
//         <Box sx={{ p: 3, textAlign: 'center' }}>
//           <Typography variant="h6">Loading Dream Team...</Typography>
//         </Box>
//       ) : (
//         <>
//           {/* Field (image) */}
//           <Box
//             sx={{
//               position: 'relative',
//               width: '100%',
//               aspectRatio: '2.1',
//               overflow: 'hidden',
//               borderRadius: 2,
//               boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03)',
//               mb: 2,
//             }}
//           >
//             <Image fill src={fieldImg} alt="Football Field" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//             {/* Overlay players */}
//             {fieldPositions.map((pos, idx) => {
//               let player: Player | undefined;
//               if (pos.type === 'goalkeeper') player = dreamTeam.goalkeeper[0];
//               if (pos.type === 'defenders') player = dreamTeam.defenders[idx - 1];
//               if (pos.type === 'midfielders') player = dreamTeam.midfielders[0];
//               if (pos.type === 'forwards') player = dreamTeam.forwards[0];
//               if (!player) return null;
//               return (
//                 <Box
//                   key={pos.type + idx}
//                   sx={{
//                     position: 'absolute',
//                     left: pos.left,
//                     top: pos.top,
//                     transform: 'translate(-50%, -50%)',
//                     textAlign: 'center',
//                     zIndex: 2,
//                   }}
//                 >
//                   {/* Shirt image; player name shown below (no jersey number) */}
//                   <Box
//                     sx={{
//                       position: 'relative',
//                       width: { xs: 64, sm: 80, md: 94 },
//                       height: { xs: 64, sm: 80, md: 94 },
//                       mx: 'auto',
//                     }}
//                   >
//                     <Link href={`/player/${player.id}`} prefetch={false} >
//                     <Image
//                       src={ShirtImg.src}
//                       alt="Player Shirt"
//                       width={94}
//                       height={94}
//                       style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
//                     />
//                     </Link>
//                   </Box>

//                   {/* Player name below the shirt */}
//                   <Typography
//                     component="div"
//                     sx={{
//                       mt: 0.5,
//                       px: 0.5,
//                       maxWidth: { xs: 80, sm: 100, md: 120 },
//                       overflow: 'hidden',
//                       // textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       color: '#ffffff',
//                       fontWeight: 700,
//                       fontSize: { xs: 11, sm: 12, md: 12 },
//                       lineHeight: 1.2,
//                       textAlign: 'center',
//                       textShadow: '0 1px 2px rgba(0,0,0,0.8)',
//                     }}
//                   >
//                     {player.firstName} {player.lastName}
//                   </Typography>
//                 </Box>
//               );
//             })}
//           </Box>

//           {/* Player stats panel (below the image) */}
//           <Box
//             sx={{
//               p: 2,
//               borderRadius: 2,
//               color: '#E5E7EB',
//               bgcolor: 'rgba(15,15,15,0.92)',
//               border: '1px solid rgba(255,255,255,0.08)',
//               backdropFilter: 'blur(8px)',
//               boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03)',
//               height: '100%',
//               display: 'flex',
//               flexDirection: 'column',
//               mb: 4,
//             }}
//           >
//             <Typography variant="h6" sx={{ mb: 2, color: '#E5E7EB' }}>
//               {noLeagues ? 'No leagues found' : 'Player stats'}
//             </Typography>
//             {noLeagues ? (
//               <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
//                 You are not a member of any league yet. Join or create a league to view your Dream Team.
//               </Typography>
//             ) : dreamTeamPlayers.length ? (
//               <Box
//                 component="ul"
//                 sx={{
//                   listStyle: 'none',
//                   p: 0,
//                   m: 0,
//                   display: 'grid',
//                   gridTemplateColumns: {
//                     xs: 'repeat(2, 1fr)',
//                     sm: 'repeat(2, 1fr)',
//                     md: 'repeat(2, 1fr)',
//                   },
//                   gap: 1.25,
//                 }}
//               >
//                 {dreamTeamPlayers.map((p) => (
//                   <Box
//                     key={p.id}
//                     component="li"
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: 1,
//                       position: 'relative',
//                       pl: 2.25,
//                       pr: 1.25,
//                       py: 0.75,
//                       borderRadius: 1.5,
//                       transition: 'all 0.18s ease',
//                       '&:hover': {
//                         transform: 'translateY(-1px)',
//                         background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
//                       },
//                     }}
//                   >
//                     {/* bullet dot */}
//                     <Box
//                       sx={{
//                         position: 'absolute',
//                         left: 8,
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         width: 6,
//                         height: 6,
//                         bgcolor: '#22C55E',
//                         borderRadius: '50%',
//                       }}
//                     />
//                     {/* Link to player details (keeps same design) */}
//                     <Link
//                       href={`/player/${p.id}`}
//                       prefetch={false}
//                       style={{ textDecoration: 'none', color: 'inherit' }}
//                     >
//                       <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
//                         <Image
//                           src={ShirtImg.src}
//                           alt="Shirt"
//                           width={18}
//                           height={18}
//                           style={{
//                             filter:
//                               'brightness(0) saturate(100%) invert(41%) sepia(86%) saturate(520%) hue-rotate(86deg) brightness(95%) contrast(95%)',
//                           }}
//                         />
//                         <Typography component="span" sx={{ fontWeight: 700, color: '#E5E7EB' }}>
//                           {p.firstName} {p.lastName}
//                         </Typography>
//                         <Typography component="span" sx={{ ml: 0.5, color: '#22C55E', fontWeight: 700 }}>
//                           ({posAbbr(p.position)})
//                         </Typography>
//                       </Box>
//                     </Link>
//                   </Box>
//                 ))}
//               </Box>
//             ) : (
//               <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
//                 No players in this Dream Team yet.
//               </Typography>
//             )}
//           </Box>
//         </>
//       )}

//     </Box>
//   );
// };

// export default DreamTeamPage;