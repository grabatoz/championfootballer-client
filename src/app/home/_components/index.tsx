'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  // Button,
  Paper,
  Button,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  IconButton,
  DialogActions,
  DialogContent,
  Divider,
  MenuItem,
  GlobalStyles,
  styled
} from '@mui/material';
import PlayerCard from '@/Components/playercard/playercard';
// import Link from 'next/link';
// import dash from '@/Components/images/dash.webp'
import dash from '@/Components/images/dashdd.png'
import toast, { Toaster } from 'react-hot-toast';
// import league from '@/Components/images/league.png'
// import matches from '@/Components/images/matches.png'
// import leaderboard from '@/Components/images/leaderboard.png'
// import dreamteam from '@/Components/images/dream.png'
// import players from '@/Components/images/players.png'
// import trophy from '@/Components/images/trophy.png'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { initializeFromStorage, mergeUser } from '@/lib/features/authSlice';
import { League, User } from '@/types/user';
import { joinLeague } from '@/lib/features/leagueSlice';
import { ChevronRight, CloudUpload, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { cacheManager } from '@/lib/cacheManager';
import { Trophy } from 'lucide-react';
// import { Block } from '@mui/icons-material';
// import { joinLeague } from '@/lib/features/leagueSlice';
import Dashbg from '@/Components/images/dashbg.jpg'
import trophy from '@/Components/images/cup.png'
import Image from 'next/image';
import Link from 'next/link';

const GreenDialogTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    background: 'rgba(43,43,43,0.85)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    borderRadius: 10,
    border: '1.5px solid rgba(229,106,22,0.55)',
    transition: 'border-color .25s, box-shadow .25s',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'rgba(229,106,22,0.70)' },
    '&.Mui-focused fieldset': { borderColor: '#E56A16', boxShadow: '0 0 0 3px rgba(229,106,22,0.25)' },
    '& input': { color: '#fff', fontWeight: 500, letterSpacing: .4 }
  },
  '& .MuiInputLabel-root': {
    color: '#ffe6d5',
    fontWeight: 600,
    letterSpacing: .5,
    '&.Mui-focused': { color: '#ffffff' }
  },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 1000px rgba(43,43,43,0.85) inset',
    WebkitTextFillColor: '#fff',
    transition: 'background-color 9999s ease-out 0s'
  }
}));

const LeagueSelectionComponent = ({ refreshKey, createdLeague }: { refreshKey?: number; createdLeague?: League | null }) => {  
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  // Helper to compare leagues by most recent change
  const timeOf = (l?: League | null) => {
    if (!l) return 0;
    const ts = Date.parse(l.updatedAt || l.createdAt || '');
    return Number.isNaN(ts) ? 0 : ts;
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format league name function
  const formatLeagueName = (name: string | undefined | null) => {
    if (!name) return '';
    const words = name.split(' ');
    const capitalizedWords = words.map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    const firstChars = words.map(word => word.charAt(0).toUpperCase());
    return `${capitalizedWords.join(' ')} (${firstChars.join('')})`;
  };

  // Fetch user's leagues
  useEffect(() => {
    const fetchUserLeagues = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const leagues = [
              ...(data.user.leagues || []),
              ...(data.user.administeredLeagues || [])
            ].filter(league => league && league.id); // Filter out undefined/null leagues

            const uniqueLeagues = Array.from(new Map(leagues.map(league => [league.id, league])).values());
            setUserLeagues(uniqueLeagues);

            if (uniqueLeagues.length > 0) {
              // Pick the latest by updatedAt or createdAt
              const latest = [...uniqueLeagues].sort((a, b) => timeOf(b) - timeOf(a))[0];
              setSelectedLeague(latest);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLeagues();
  }, [token, refreshKey]);

  // When a new league is created in the parent, immediately add/select it without waiting for a refetch
  useEffect(() => {
    if (!createdLeague || !createdLeague.id) return;
    setUserLeagues(prev => {
      const map = new Map(prev.map(l => [l.id, l]));
      map.set(createdLeague.id, createdLeague);
      return Array.from(map.values());
    });
    setSelectedLeague(createdLeague);
  }, [createdLeague]);

  // Keep selected league at top
  const sortedUserLeagues = React.useMemo(() => {
    if (!userLeagues?.length) return [];
    // Sort by recency first
    const arr = [...userLeagues].sort((a, b) => timeOf(b) - timeOf(a));
    // Keep currently selected pinned to top
    const idx = selectedLeague ? arr.findIndex(l => l.id === selectedLeague.id) : -1;
    if (idx > 0) {
      const [sel] = arr.splice(idx, 1);
      arr.unshift(sel);
    }
    return arr;
  }, [userLeagues, selectedLeague]);

  if (!loading && userLeagues.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography
          variant="body1"
          sx={{
            color: '#666',
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            textAlign: 'center'
          }}
        >
          {`You haven't joined any league yet.`}
        </Typography>
        {/* <Link href="/all-leagues" passHref>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#43a047',
              color: 'white',
              '&:hover': { bgcolor: '#388e3c' },
              minHeight: { xs: '60px', sm: '70px', md: '50px' },
              minWidth: { xs: '280px', sm: '320px' },
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
              fontWeight: 'bold',
              mb: -1.5
            }}
          >
            Join a League
          </Button>
        </Link> */}
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }} ref={dropdownRef}>
      <Button
        variant="contained"
        sx={{
          bgcolor: '#00A77F',
          color: 'white',
          '&:hover': { bgcolor: '#00A77F' },
          minHeight: { xs: '60px', sm: '70px', md: '50px' },
          minWidth: { xs: '280px', sm: '320px' },
          fontSize: { xs: '1rem', sm: '1.1rem', md: '15px' },
          fontWeight: 'normal',
          textTransform: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(67,160,71,0.3)',
          border: '2px solid #fff',
        }}
        // onClick={() => {
        //   if (selectedLeague) {
        //     window.location.href = `/league/${selectedLeague.id}`;
        //   }
        // }}
          onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Image src={selectedLeague?.image || trophy} alt='' height={24} width={24} style={{ height: 24, width: 24 }} />
            <Typography
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1rem' },
                fontWeight: 'semibold'
              }}
            >
              {selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Loading...'}
            </Typography>
          </Box>

          <Box 
            sx={{
              color: 'white',
              cursor: 'pointer',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              },
              transition: 'background-color 0.2s'
            }}
          >
            <ChevronRight size={24} />
          </Box>
        </Box>
      </Button>

      {/* Dropdown menu */}
      {showDropdown && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            width: '100%',
            maxWidth: { xs: '280px', sm: '320px' },
            maxHeight: 300,
            overflowY: 'auto',
            p: 0.5,
            mt: 1,
            zIndex: 9999,
            bgcolor: '#00A77F',
            color: '#FFFFFF',
            borderRadius: 2,
            border: '2px solid #FFFFFF',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {sortedUserLeagues.map((league) => {
            const isActive = league.id === selectedLeague?.id;
            return (
              <Link href={`/league/${league.id}`} key={league.id} passHref>
                <MenuItem
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league);
                    setShowDropdown(false);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mx: 0.5,
                    my: 0.25,
                    py: 1.25,
                    px: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    },
                    ...(isActive && {
                      backgroundColor: 'rgba(255,255,255,0.20)',
                      border: '1px solid rgba(255,255,255,0.65)',
                    }),
                  }}
                >

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Trophy size={18} color={isActive ? '#FFFFFF' : '#E7F6EF'} />
                    <Typography
                      sx={{
                        fontSize: '0.95rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: 0.2,
                        color: '#FFFFFF',
                      }}
                    >
                      {formatLeagueName(league.name)}
                    </Typography>
                  </Box>

                  {/* {isActive && (
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: '#FFFFFF',
                        color: '#00A77F',
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
                )} */}
                </MenuItem>
              </Link>

            );
          })}
        </Box>
      )}
    </Box>
  );
};















// // League Selection Component
// const LeagueSelectionComponent = ({}: { user: User }) => {
//   const [userLeagues, setUserLeagues] = useState<League[]>([]);
//   const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
//   const [loading, setLoading] = useState(true);
//   const { token } = useAuth();

//   // Function to format league name
//   const formatLeagueName = (name: string) => {
//     if (!name) return '';

//     // Split the name into words
//     const words = name.split(' ');

//     // Capitalize first letter of each word
//     const capitalizedWords = words.map(word =>
//       word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//     );

//     // Get first character of each word
//     const firstChars = words.map(word => word.charAt(0).toUpperCase());

//     // Create the formatted name
//     const formattedName = capitalizedWords.join(' ');
//     const abbreviation = `(${firstChars.join('')})`;

//     return `${formattedName} ${abbreviation}`;
//   };

//   // Fetch user's leagues
//   useEffect(() => {
//     const fetchUserLeagues = async () => {
//       if (!token) return;

//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           if (data.success && data.user) {
//             // Combine joined and managed leagues
//             const leagues = [
//               ...(data.user.leagues || []),
//               ...(data.user.administeredLeagues || [])
//             ];

//             // Remove duplicates
//             const uniqueLeagues = Array.from(new Map(leagues.map(league => [league.id, league])).values());
//             setUserLeagues(uniqueLeagues);

//             // Set the most recent league as default
//             if (uniqueLeagues.length > 0) {
//               setSelectedLeague(uniqueLeagues[0]);
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching leagues:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserLeagues();
//   }, [token]);

//   // If user has no leagues
//   if (!loading && userLeagues.length === 0) {
//     return (
//       <Box sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         // py: 2
//       }}>
//         <Typography
//           variant="body1"
//           sx={{
//             color: '#666',
//             mb: 1,
//             fontSize: { xs: '0.9rem', sm: '1rem' },
//             textAlign: 'center'
//           }}
//         >
//          {` You haven't joined any league yet.`}
//         </Typography>
//         <Link href="/all-leagues" passHref>
//           <Button
//             variant="contained"
//             sx={{
//               bgcolor: '#43a047',
//               color: 'white',
//               '&:hover': { bgcolor: '#388e3c' },
//               minHeight: { xs: '60px', sm: '70px', md: '50px' },
//           minWidth: { xs: '280px', sm: '320px' },
//           fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
//               fontWeight: 'bold',
//               mb:-1.5
//             }}
//           >
//             Join a League
//           </Button>
//         </Link>
//       </Box>
//     );
//   }

//   // If user has leagues
//   return (
//     <Box sx={{
//       width: '100%',
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center'
//     }}>
//       <Button
//         variant="contained"
//         sx={{
//           bgcolor: '#43a047',
//           color: 'white',
//           '&:hover': { bgcolor: '#388e3c' },
//           minHeight: { xs: '60px', sm: '70px', md: '50px' },
//           minWidth: { xs: '280px', sm: '320px' },
//           fontSize: { xs: '1rem', sm: '1.1rem', md: '0.5rem' },
//           fontWeight: 'bold',
//           textTransform: 'none',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           // px: { xs: 2, sm: 3 },
//           // py: { xs: 1.5, sm: 2 },
//           borderRadius: 2,
//           boxShadow: '0 4px 12px rgba(67,160,71,0.3)',
//           border: '2px solid #fff',
//         }}
//         onClick={() => {
//           // Navigate to the selected league
//           if (selectedLeague) {
//             window.location.href = `/league/${selectedLeague.id}`;
//           }
//         }}
//       >
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//   {/* Trophy and league name */}
//   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//     <Trophy size={24} color="white" />
//     <Typography
//       sx={{
//         fontSize: { xs: '1rem', sm: '1.1rem', md: '1rem' },
//         fontWeight: 'semibold'
//       }}
//     >
//       {selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Loading...'}
//     </Typography>
//   </Box>

//   {/* Right arrow to show all leagues */}
//   <IconButton 
//     onClick={() => setSelectedLeague(null)} // Reset selected league to show all
//     sx={{ 
//       color: 'white',
//       ml: 2, // Add some margin
//       '&:hover': {
//         backgroundColor: 'rgba(255,255,255,0.1)'
//       }
//     }}
//   >
//     <ChevronRight size={24} /> {/* Right arrow icon */}
//   </IconButton>
// </Box>
//       </Button>
//     </Box>
//         // {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 6 }}>
//         //   <Trophy size={24} color="white" />
//         //   <Typography
//         //     sx={{
//         //       fontSize: { xs: '1rem', sm: '1.1rem', md: '1rem' },
//         //       fontWeight: 'semibold'
//         //     }}
//         //   >
//         //     {selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Loading...'}
//         //   </Typography>
//         // </Box> */}
//         // {/* <RiArrowRightLine size={20} color="white" /> */}
//   );
// };

export default function PlayerDashboard() {
  const [inviteCode, setInviteCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueImage, setLeagueImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const [, setLeagues] = useState<League[]>([]);
  const [, setLoading] = useState(true);
  // Trigger to force LeagueSelectionComponent to refetch
  const [leaguesRefreshKey, setLeaguesRefreshKey] = useState(0);
  // Pass the newly created league down so it appears instantly
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);

  const [, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    // Only run on client
    const handleResize = () => setWindowWidth(window.innerWidth);
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // Debug: log user details when it becomes available/changes
  useEffect(() => {
    console.log('[PlayerDashboard] User from store:', user);
    if (user) {
      try {
        console.log('[PlayerDashboard] User details:', {
          id: user?.id,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email,
          position: user?.position,
          xp: user?.xp,
          shirtNumber: user?.shirtNumber,
          profilePicture: user?.profilePicture
        });
      } catch (e) {
        console.warn('[PlayerDashboard] Failed to log user details:', e);
      }
    }
  }, [user]);

  // Fallback: if xp is missing after auth init, fetch it from /auth/data and merge
  useEffect(() => {
    const maybeFetchXP = async () => {
      try {
        if (!token) return;
        // Only fetch if no xp present
        if (!user || typeof user.xp === 'number') return;
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/data`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const xp = data?.user?.xp;
        if (typeof xp === 'number') {
          // Merge xp into store user
          (dispatch as AppDispatch)(mergeUser({ xp }));
        }
      } catch (e) {
        console.warn('XP fallback fetch failed', e);
      }
    };
    maybeFetchXP();
  }, [dispatch, token, user]);

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) return;

    try {
      // Dispatch join and get the joined league payload
      const payload: unknown = await dispatch(joinLeague(inviteCode.trim())).unwrap();

      // Accept either a direct League object or a wrapped { league: League }
      let joined: League | undefined;
      if (typeof payload === 'object' && payload !== null && 'league' in payload) {
        const maybeLeague = (payload as { league?: unknown }).league;
        if (typeof maybeLeague === 'object' && maybeLeague !== null && 'id' in maybeLeague) {
          joined = maybeLeague as League;
        }
      } else if (typeof payload === 'object' && payload !== null && 'id' in payload) {
        joined = payload as League;
      }

      if (joined && joined.id) {
        const nowISO = new Date().toISOString();
        const normalized: League = {
          id: String(joined.id),
          name: joined.name ?? 'My League',
          inviteCode: joined.inviteCode ?? '',
          image: joined.image ?? '',
          createdAt: joined.createdAt ?? nowISO,
          updatedAt: joined.updatedAt ?? joined.createdAt ?? nowISO,
          members: joined.members ?? [],
          administrators: joined.administrators ?? [],
          matches: joined.matches ?? [],
          active: joined.active ?? true,
          maxGames: joined.maxGames ?? 0,
          showPoints: joined.showPoints ?? true,
          adminId: joined.adminId,
          description: joined.description,
          location: joined.location,
          maxTeams: joined.maxTeams,
          currentTeams: joined.currentTeams,
          status: joined.status,
        };

        // Update local caches and UI immediately
        updateLeaguesCacheWithNewLeague(normalized);
        setCreatedLeague(normalized); // instantly visible in selector
        setLeaguesRefreshKey((k) => k + 1); // background refetch to stay in sync
      } else {
        // If API didn't include league payload, still trigger a background refresh to get latest
        setLeaguesRefreshKey((k) => k + 1);
      }

      setInviteCode('');
      toast.success('Successfully joined league!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join league';
      toast.error(errorMessage);
    }
  };

  const updateLeaguesCacheWithNewLeague = useCallback((newLeague: League) => {
    cacheManager.updateLeaguesCache(newLeague);
  }, []);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error('Please enter a league name');
      return;
    }
    setIsCreating(true);
    try {
      console.log('Creating league:', leagueName.trim());
      const formData = new FormData();
      formData.append('name', leagueName.trim());
      if (leagueImage) formData.append('image', leagueImage);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // 'Content-Type' mat lagayen, FormData khud set karega
        },
        body: formData
      });

      const data = await response.json();
      console.log('Create league response:', data);

      if (data.success) {
        console.log('League created successfully, refreshing list...');
        toast.success('League created successfully!');
        setIsDialogOpen(false);
        setLeagueName('');
        setLeagueImage(null);
        setImagePreview(null);

        // Update the leagues cache with the new league
        if (data.league) {
          const newLeague = {
            ...data.league,
            image: data.league.image || null, // Ensure image field is included
            members: [],
            administrators: user ? [user] : [],
            matches: [],
            active: true,
            maxGames: null,
            showPoints: true
          };

          // Update cache with new league
          updateLeaguesCacheWithNewLeague(newLeague);

          // Update local state
          setLeagues(prevLeagues => [newLeague, ...prevLeagues]);
          console.log('Updated cache and local state with new league:', newLeague);

          // Make it show up immediately and trigger a refetch to stay in sync
          setCreatedLeague(newLeague);
          setLeaguesRefreshKey(k => k + 1);
        }
      } else {
        console.error('Failed to create league:', data.message);
        toast.error(data.message || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      toast.error('An error occurred while creating the league');
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setLeagueImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLeagueImage(null);
    setImagePreview(null);
  };

  // const items = [
  //   { label: 'League', icon: league, url: 'all-leagues' },
  //   { label: 'Matches', icon: matches, url: 'all-matches' },
  //   { label: 'Dream Team', icon: dreamteam, url: 'dream-team' },
  //   { label: 'Players', icon: players, url: 'all-players' },
  //   { label: 'Trophy Room', icon: trophy, url: 'trophy-room' },
  //   { label: 'Leader Board', icon: leaderboard, url: 'leader-board' },
  // ];

  return (
    <Box sx={{ px: { xs: 1, md: 3 }, py: { xs: 1, md: 4 }, minHeight: '100vh' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Paper
        elevation={3}
        sx={{
          backgroundImage: `url(${dash.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: { xs: 0, md: 2 }, // No border radius on mobile
          overflow: 'hidden',
          p: { xs: 0, md: 3 }, // No padding on mobile
          mb: { xs: 0, md: 4 }, // No margin on mobile
          minHeight: { xs: '100vh', md: '100vh' }, // Full height on mobile
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          mx: 'auto',
          alignItems: 'center',
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 4 },
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Player Card - Top on mobile, left on desktop */}
          <Box sx={{
            flex: { xs: 'none', md: '0 0 300px' },
            width: { xs: '100%', md: '90%' },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'center' },
            mb: { xs: 2, md: 0 }, // Add margin bottom on mobile
            mt: { xs: 1 }
          }}>
            <PlayerCard 
              name={user?.firstName || ''}
              number={user?.shirtNumber || '00'}
              points={user?.xp || 0}
              stats={{
                DRI: user?.skills?.dribbling?.toString() || '',
                SHO: user?.skills?.shooting?.toString() || '',
                PAS: user?.skills?.passing?.toString() || '',
                PAC: user?.skills?.pace?.toString() || '',
                DEF: user?.skills?.defending?.toString() || '',
                PHY: user?.skills?.physical?.toString() || ''
              }}
              foot={user?.preferredFoot === "right" ? "R" : "L"}
              profileImage={user?.profilePicture || undefined}
              shirtIcon=""
              position={user?.position || 'XXX'}
            />
          </Box>

          {/* WRAPPER: White box + World Ranking button stacked */}
          <Box
            sx={{
              flex: 1,
              maxWidth: { xs: '100%', md: '65%', lg: '65%' },
              width: { xs: '96%', sm: '100%', md: '100%', lg: '33%' },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.2,
              mt: { xs: 0, md: 7 },
              ml: { md: -2 }
            }}
          >
            {/* White Box */}
            <Box
              sx={{
                backgroundColor: '#fff',
                p: { xs: 3, sm: 2, md: 1.5 },
                borderRadius: { xs: '20px', md: 2 },
                width: '100%',
                minHeight: 'auto'
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 1 }}>
                <Typography variant="h5" gutterBottom sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' },
                  color: 'black'
                }}>Welcome,</Typography>
                <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' }, fontWeight: 600 }}>
                  {user?.firstName}
                </Typography>
              </Box>

              <Divider sx={{ mb: 1.5, width: '100%', height: 2, bgcolor: 'green' }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{
                  color: 'black',
                  mb: 1.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  Your Current League In Which You Stand
                </Typography>

                {/* League Selection Component */}
                <LeagueSelectionComponent refreshKey={leaguesRefreshKey} createdLeague={createdLeague} />

                {/* Add New League Button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setIsDialogOpen(true)}
                  sx={{
                    bgcolor: '#0388E3',
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 2,
                    mt: 3,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#0388E3', boxShadow: '0 2px 8px rgba(25,118,210,0.2)' },
                    width: '320px',
                    mx: 'auto',
                    display: { xs: 'none', sm: 'none', md: 'block' }
                  }}
                >
                  + Create New League
                </Button>

                {/* Invite Code Join Section */}
                <Box sx={{
                  mx: 'auto',
                  alignItems: 'center',
                  justifyContent: 'center',
                  display: { xs: 'none', sm: 'none', md: 'block' },
                  maxWidth: '320px'
                }}>
                  <TextField
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: '#DEDCDC',
                      borderRadius: 3,
                      flex: 1,
                      maxWidth: 190,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{ background: '#00A77F', borderRadius: 2, '&:hover': { background: '#00A77F' }, ml: -3, py: 1 }}
                    onClick={handleJoinLeague}
                    startIcon={
                      <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                      </svg>
                    }
                  >
                    Join League
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* World Ranking Button directly below */}
            <Button
              href="/world-ranking"
              component="a"
              fullWidth
              sx={{
                position: 'relative',
                textTransform: 'none',
                background: 'linear-gradient(135deg,#004e5f,#007a95)',
                color: '#fff',
                py: 1.6,
                borderRadius: 2,
                fontWeight: 700,
                letterSpacing: 0.4,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                justifyContent: 'center',
                boxShadow: '0 8px 24px -6px rgba(0,78,95,0.55)',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 2,
                  padding: '2px',
                  background: 'linear-gradient(120deg,#30e8ff,#72ffa8,#30e8ff)',
                  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  opacity: 0.55
                },
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-40%',
                  width: '40%',
                  height: '100%',
                  background: 'linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0) 100%)',
                  transform: 'skewX(-18deg)',
                  animation: 'wr-shine 3.4s linear infinite'
                },
                '@keyframes wr-shine': {
                  '0%': { left: '-40%' },
                  '70%': { left: '140%' },
                  '100%': { left: '140%' }
                },
                '&:hover': {
                  background: 'linear-gradient(135deg,#005d72,#0092b1)',
                  boxShadow: '0 10px 28px -6px rgba(0,120,150,0.6)'
                }
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10l1 5-6 2-6-2 1-5Z" /><path d="M4 9c.6 2.1 2.5 3 4 3" /><path d="M20 9c-.6 2.1-2.5 3-4 3" />
              </svg>
              World Ranking
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* <Box sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 4 },
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <Box sx={{
            flex: { xs: 'none', md: '0 0 300px' },
            width: { xs: '100%', md: '90%' },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'center', md: 'center' },
            mb: { xs: 2, md: 0 }, // Add margin bottom on mobile
            mt: { xs: 1 }
          }}>
            <PlayerCard
              name={user?.firstName || ''}
              number={user?.shirtNumber || '00'}
              points={user?.xp || 0}
              stats={{
                DRI: user?.skills?.dribbling?.toString() || '',
                SHO: user?.skills?.shooting?.toString() || '',
                PAS: user?.skills?.passing?.toString() || '',
                PAC: user?.skills?.pace?.toString() || '',
                DEF: user?.skills?.defending?.toString() || '',
                PHY: user?.skills?.physical?.toString() || ''
              }}
              foot={user?.preferredFoot === "right" ? "R" : "L"}
              profileImage={user?.profilePicture || undefined}
              shirtIcon={''}
              position={user?.position || 'XXX'}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              backgroundColor: '#fff',
              p: { xs: 3, sm: 2, md: 1.5 },
              borderRadius: { xs: '20px 20px 20px 20px', md: 2 },
              maxWidth: { xs: '100%', md: '41%', lg: '33%' },
              width: { xs: '96%', sm: '70%', md: 'auto', lg: '33%' },
              textAlign: 'flex',
              mt: { xs: 'auto', md: -3 },
              minHeight: { xs: 'auto', md: 'auto' },
              mb: { xs: 2, md: 0 },
              alignSelf: { xs: 'center' },
              ml: { md: -2 },
            }}
          >
            <Box sx={{ display: 'inline-flex', gap: 1 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' },
                  color: 'black',
                }}
              >
                Welcome,
              </Typography>
              <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.2rem' }, fontWeight: 'semibold' }}>
                {user?.firstName}
              </Typography>
            </Box>

            <Divider sx={{ mb: 1.5, width: '100%', height: 2, bgcolor: 'green' }} />

            <Box sx={{ justifyContent: 'center', textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'black',
                  mb: 1.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Your Current League In Which You Stand
              </Typography>

              <LeagueSelectionComponent user={user} />

            <Button
              variant="contained"
              fullWidth
              onClick={() => setIsDialogOpen(true)}
              sx={{
                bgcolor: '#0388e3',
                color: 'white',
                fontWeight: 'bold',
                mb: 2,
                mt: 3,
                borderRadius: 2,
                '&:hover': { bgcolor: '#0388e3', boxShadow: '0 2px 8px rgba(25,118,210,0.2)', },
                width: '320px',
                mx: 'auto',
                display: {
                  xs: 'none',  // Show on extra small screens
                  sm: 'none',  // Show on small screens
                  md: 'block',   // Hide on medium screens and up
                }
              }}
            >
              + Create New League
            </Button>
            <Box sx={{
               mx: 'auto',
              alignItems: 'center', justifyContent: 'center', display: {
                xs: 'none',  // Show on extra small screens
                sm: 'none',  // Show on small screens
                md: 'block',   // Hide on medium screens and up
                maxWidth:'320px'
              }
            }}>
              <TextField
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: '#DEDCDC',
                  borderRadius: 3,
                  flex: 1,
                  maxWidth: 190,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                // color="success"
                sx={{ background: '#00a77f', borderRadius: 2, '&:hover': { background: '#00a77f' }, ml: -3, py: 1 }}
                onClick={handleJoinLeague}
                startIcon={
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                  </svg>
                }
              >
                Join League
              </Button>
            </Box>
            </Box>

          </Box>

        </Box> */}
      {/* <Paper
        elevation={3}
        sx={{
          // backgroundImage: `url(${Dashbg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          p: { xs: 0.5, sm: 3 }, // Less padding on mobile
          width: '100%', // Always full width
          boxShadow: { xs: 0, sm: 3 }, // Remove shadow on mobile for flush look
          mt: { xs: 2, md: 0 },
          display: { 
            xs: 'block',  // Show on extra small screens
            sm: 'block',  // Show on small screens
            md: 'none',   // Hide on medium screens and up
          },
        }}
      >
        <Button
          variant="contained"
          fullWidth
          onClick={() => setIsDialogOpen(true)}
          sx={{
            bgcolor: '#0388e3',
            color: 'white',
            fontWeight: 'bold',
            mb: 2,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
            '&:hover': { bgcolor: '#0388e3' },
            width: '300px',
          }}
        >
          + Create New League
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TextField
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: '#DEDCDC',
                  borderRadius: 3,
                  flex: 1,
                  maxWidth: 190,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                // color="success"
                sx={{ background: '#00a77f', borderRadius: 2, '&:hover': { background: '#00a77f' } , ml:-3 , py:1 }}
                onClick={handleJoinLeague}
                startIcon={
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                  </svg>
                }
              >
                Join League
              </Button>
        </Box>

      </Paper> */}
      <Paper
        elevation={3}
        sx={{
          backgroundImage: `url(${Dashbg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          p: { xs: 0.5, sm: 3 },
          width: '98%',
          boxShadow: { xs: 0, sm: 3 },
          mt: { xs: 2, md: 0 },
          display: {
            xs: 'flex',
            sm: 'flex',
            md: 'none',
          },
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Create New League Button - Now matching Join League section width */}
        <Box sx={{
          width: { xs: '100%', sm: '380px' },
          display: 'flex',
          justifyContent: 'center',
          mb: 2
        }}>
          <Button
            variant="contained"
            onClick={() => setIsDialogOpen(true)}
            sx={{
              bgcolor: '#0388E3',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
              '&:hover': { bgcolor: '#0388E3' },
              width: { xs: '100%', sm: '315px' },
              height: '40px', // Fixed height to match Join button
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            + Create New League
          </Button>
        </Box>

        {/* Join League Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            width: { xs: '100%', sm: '380px' },
            justifyContent: 'center',
          }}
        >
          <TextField
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: '#fff',
              borderRadius: 3,
              flex: 1,
              maxWidth: 190,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': {
                height: '40px', // Match button height
                padding: '0 14px',
                fontSize: '0.875rem'
              }
            }}
          />
          <Button
            variant="contained"
            sx={{
              background: '#00a77f',
              borderRadius: 2,
              '&:hover': { background: '#00a77f' },
              ml: -5,
              py: 1,
              height: '40px', // Fixed height
              minWidth: '120px', // Minimum width
              fontSize: '0.875rem'
            }}
            onClick={handleJoinLeague}
            startIcon={
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
              </svg>
            }
          >
            Join League
          </Button>
        </Box>
      </Paper>

      <GlobalStyles styles={{
  '::-webkit-scrollbar': { width: 10 },
  '::-webkit-scrollbar-track': { background: '#0d2f1e' },
  '::-webkit-scrollbar-thumb': { background: '#1c5c37', borderRadius: 20, border: '2px solid #0d2f1e' },
  '::-webkit-scrollbar-thumb:hover': { background: '#257647' }
}} />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 5,
            overflow: 'hidden',
            position: 'relative',
            p: 0,
            // Background switched to orange/red gradient and dark base
            background: `
              radial-gradient(circle at 18% 10%, rgba(229,106,22,0.18) 0%, rgba(229,106,22,0) 55%),
              linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)
            `,
            boxShadow: '0 24px 60px -18px rgba(0,0,0,0.65), 0 0 0 1px rgba(229,106,22,0.20)',
            border: '1.5px solid rgba(229,106,22,0.45)',
            backdropFilter: 'blur(6px)'
          }
        }}
      >
        {/* Soft overlay shimmer */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            linear-gradient(95deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0) 38%),
            radial-gradient(circle at 82% 22%, rgba(229,106,22,0.25), transparent 60%)
          `
        }} />

        <Box
          display="flex"
          justifyContent="space-between"
            alignItems="center"
          sx={{
            px: 3.2,
            pt: 2.8,
            pb: 1.6,
            background: 'linear-gradient(180deg,rgba(43,43,43,0.35),rgba(43,43,43,0))',
          }}
        >
          <DialogTitle
            sx={{
              p: 0,
              fontWeight: 900,
              fontSize: 25,
              letterSpacing: .85,
              color: '#ffffff',
              textShadow: '0 3px 10px rgba(0,0,0,0.45)'
            }}
          >
            Create a League
          </DialogTitle>
          <IconButton
            onClick={() => setIsDialogOpen(false)}
            sx={{
              color: '#eafff4',
              bgcolor: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(229,106,22,0.30)',
              backdropFilter: 'blur(4px)',
              '&:hover': { bgcolor: 'rgba(229,106,22,0.25)' }
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            px: 3.2,
            pt: 1,
            pb: 0.5,
            color: '#ffe6d5'
          }}
        >
          {/* Input field already styled (GreenDialogTextField) */}
          <GreenDialogTextField
            autoFocus
            margin="dense"
            label="League Name"
            fullWidth
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateLeague(); }}
            placeholder="e.g. Elite Champions"
          />

          <Box sx={{ mt: 3.2, mb: 1.4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#eafff7',
                mb: 1,
                fontWeight: 700,
                letterSpacing: .65,
                textTransform: 'uppercase',
                fontSize: 13.5
              }}
            >
              League Image (Optional)
            </Typography>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2.2,
              p: 2,
              border: '1.5px dashed rgba(229,106,22,0.55)',
              borderRadius: 4,
              background: 'linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))',
              backdropFilter: 'blur(5px)'
            }}>
              <Avatar
                src={imagePreview || '/assets/league.png'}
                alt="League"
                variant="rounded"
                sx={{
                  width: 74,
                  height: 74,
                  border: '2px solid #E56A16',
                  background: '#2B2B2B',
                  boxShadow: '0 6px 18px -6px rgba(0,0,0,0.65)'
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: '#c5ffe2', fontWeight: 600 }}>
                  {imagePreview ? 'Selected Image' : 'Default Placeholder'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9fe9c8' }}>
                  {imagePreview ? 'Change or remove below' : 'Upload a custom emblem'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.1, flexWrap: 'wrap' }}>
              <Button
                component="label"
                variant="contained"
                sx={{
                  background: '#E56A16',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 2.4,
                  px: 2.6,
                  letterSpacing: .55,
                  boxShadow: '0 8px 26px -8px rgba(229,106,22,0.45)',
                  '&:hover': { background: '#f07823' }
                }}
                startIcon={<CloudUpload size={18} />}
              >
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
              {imagePreview && (
                <Button
                  variant="outlined"
                  onClick={handleRemoveImage}
                  sx={{
                    color: '#ffb1a1',
                    borderColor: '#ffb1a1',
                    fontWeight: 600,
                    borderRadius: 2.2,
                    px: 2.2,
                    letterSpacing: .45,
                    '&:hover': { borderColor: '#ffb1b1', background: 'rgba(255,143,143,0.12)' }
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3.2,
            pt: 1,
            pb: 2.8,
            gap: 1.2
          }}
        >
          <Button
            onClick={() => setIsDialogOpen(false)}
            variant="outlined"
            sx={{
              color: '#ffe6d5',
              borderColor: 'rgba(229,106,22,0.50)',
              fontWeight: 600,
              borderRadius: 2.4,
              px: 3,
              letterSpacing: .55,
              backdropFilter: 'blur(3px)',
              '&:hover': { borderColor: '#E56A16', background: 'rgba(229,106,22,0.12)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateLeague}
            disabled={isCreating || !leagueName.trim()}
            variant="contained"
            sx={{
              background: '#E56A16',
              color: '#fff',
              fontWeight: 800,
              borderRadius: 2.6,
              px: 3.4,
              letterSpacing: .75,
              boxShadow: '0 12px 32px -10px rgba(229,106,22,0.45)',
              '&:hover': { background: '#f07823' },
              '&:disabled': {
                background: '#2B2B2B',
                color: '#c9a893'
              }
            }}
          >
            {isCreating ? 'Creating...' : 'Create League'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}