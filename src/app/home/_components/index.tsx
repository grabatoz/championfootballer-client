'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
} from '@mui/material';
import PlayerCard from '@/Components/playercard/playercard';
import Link from 'next/link';
import dash from '@/Components/images/dash.webp'
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import league from '@/Components/images/league.png'
import matches from '@/Components/images/matches.png'
import leaderboard from '@/Components/images/leaderboard.png'
import dreamteam from '@/Components/images/dream.png'
import players from '@/Components/images/players.png'
import trophy from '@/Components/images/trophy.png'
import Dashbg from '@/Components/images/dashbg.webp'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { initializeFromStorage } from '@/lib/features/authSlice';
import { League, User } from '@/types/user';
import { joinLeague } from '@/lib/features/leagueSlice';
import { CloudUpload, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { cacheManager } from '@/lib/cacheManager';
import { Trophy } from 'lucide-react';
// import { joinLeague } from '@/lib/features/leagueSlice';

// League Selection Component
const LeagueSelectionComponent = ({ user }: { user: User }) => {
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Function to format league name
  const formatLeagueName = (name: string) => {
    if (!name) return '';
    
    // Split the name into words
    const words = name.split(' ');
    
    // Capitalize first letter of each word
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    
    // Get first character of each word
    const firstChars = words.map(word => word.charAt(0).toUpperCase());
    
    // Create the formatted name
    const formattedName = capitalizedWords.join(' ');
    const abbreviation = `(${firstChars.join('')})`;
    
    return `${formattedName} ${abbreviation}`;
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
            // Combine joined and managed leagues
            const leagues = [
              ...(data.user.leagues || []),
              ...(data.user.administeredLeagues || [])
            ];
            
            // Remove duplicates
            const uniqueLeagues = Array.from(new Map(leagues.map(league => [league.id, league])).values());
            setUserLeagues(uniqueLeagues);
            
            // Set the most recent league as default
            if (uniqueLeagues.length > 0) {
              setSelectedLeague(uniqueLeagues[0]);
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
  }, [token]);

  // If user has no leagues
  if (!loading && userLeagues.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        py: 2 
      }}>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666',
            mb: 2,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            textAlign: 'center'
          }}
        >
          You haven't joined any league yet.
        </Typography>
        <Link href="/all-leagues" passHref>
          <Button 
            variant="contained"
            sx={{ 
              bgcolor: '#43a047',
              color: 'white',
              '&:hover': { bgcolor: '#388e3c' },
              minWidth: { xs: '280px', sm: '320px' },
              height: { xs: '60px', sm: '70px' },
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold'
            }}
          >
            Join a League
          </Button>
        </Link>
      </Box>
    );
  }

  // If user has leagues
  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Button
        variant="contained"
        sx={{
          bgcolor: '#43a047',
          color: 'white',
          '&:hover': { bgcolor: '#388e3c' },
          minHeight: { xs: '60px', sm: '70px' },
          minWidth: { xs: '280px', sm: '320px' },
          fontSize: { xs: '1rem', sm: '1.1rem' },
          fontWeight: 'bold',
          textTransform: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(67,160,71,0.3)',
          border: '2px solid #fff',
        }}
        onClick={() => {
          // Navigate to the selected league
          if (selectedLeague) {
            window.location.href = `/league/${selectedLeague.id}`;
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Trophy size={24} color="white" />
          <Typography 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.1rem' , md: '1.4rem' },
              fontWeight: 'bold'
            }}
          >
            {selectedLeague?.name ? formatLeagueName(selectedLeague.name) : 'Loading...'}
          </Typography>
        </Box>
        {/* <RiArrowRightLine size={20} color="white" /> */}
      </Button>
    </Box>
  );
};

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

  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

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

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) return;

    try {
      await dispatch(joinLeague(inviteCode.trim())).unwrap();
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

  const items = [
    { label: 'League', icon: league , url:'all-leagues' },
    { label: 'Matches', icon: matches , url:'all-matches'},
    { label: 'Dream Team', icon: dreamteam , url:'dream-team'},
    { label: 'Players', icon: players , url:'all-players'},
    { label: 'Trophy Room', icon: trophy , url:'trophy-room'},
    { label: 'Leader Board', icon: leaderboard , url:'leader-board'},
  ];

  return (
    <Box sx={{ px: {xs:1,md:3}, py: {xs:1,md:4},  minHeight: '100vh' }}>
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
          minHeight: { xs: '100vh', md: 'auto' }, // Full height on mobile
          display: 'flex',
          flexDirection: 'column'
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
      justifyContent: { xs: 'center', md: 'flex-start' },
      mb: { xs: 2, md: 0 } // Add margin bottom on mobile
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

    {/* White Card - Bottom on mobile, right on desktop */}
    <Box 
      sx={{ 
        flex: 1, 
        backgroundColor: '#fff', 
        p: { xs: 3, sm: 2, md: 1.5}, 
        borderRadius: { xs: '16px 16px 16px 16px', md: 2 }, // Rounded top corners on mobile
        maxWidth: { xs: '100%', md: '41%' , lg: '33%' },
        width: { xs: '96%' , sm: '70%', md: 'auto' , lg: '33%' },
        textAlign:'center',
        mt: { xs: 'auto', md: 0 },
        minHeight: { xs: 'auto', md: 'auto' },
        mb: {xs:2,md:0},
        // Center the card on screens below 900px
        alignSelf: { xs: 'center' },
        // mx: { xs: 'auto', md: 0 } // Auto margins for centering
      }}
    >
      <Box sx={{display: 'inline-flex',gap:1}}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1.2rem', sm: '1.5rem' },
          color: 'black',
        }}
      >
        Welcome,
      </Typography>
      <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' },fontWeight:'semibold'}}>{user?.firstName}</Typography>
      </Box>

      <Divider sx={{ mb: 1.5 , width:'100%' , height:2 , bgcolor:'green' }}/>
      <Box sx={{justifyContent:'center' , textAlign:'center'}}>
        
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

      {/* League Selection Component */}
      <LeagueSelectionComponent user={user} />
      </Box>

    </Box>
        </Box>
</Paper>
    
    <Paper
      elevation={3}
      sx={{
        backgroundImage: `url(${Dashbg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 2,
        overflow: 'hidden',
        p: { xs: 0.5, sm: 3 }, // Less padding on mobile
        width: '100%', // Always full width
        boxShadow: { xs: 0, sm: 3 }, // Remove shadow on mobile for flush look
        mt: {xs:2,md:0}
      }}
    >
         <Button
                variant="contained"
                fullWidth
                onClick={() => setIsDialogOpen(true)}
                sx={{
                  bgcolor: '#43a047',
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
                  '&:hover': { bgcolor: '#388e3c' },
                  width: '300px'
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
          sx={{ backgroundColor: 'white', borderRadius: 1, flex: 1, maxWidth: 300 }}
        />
        <Button
          variant="contained"
          color="success"
          onClick={handleJoinLeague}
        >
          <svg className="w-5 h-5 mr-2" fill="white" viewBox="0 0 24 24">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
          </svg>
          Join League
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(auto-fit, minmax(165px, 1fr))',
          },
          gap: { xs: 1, sm: 2 }, // Less gap on mobile
          padding: { xs: 0.5, sm: 2 }, // Less padding on mobile
          whiteSpace: 'nowrap',
        }}
      >
        {items.map((item, index) => (
          <Link key={index} href={item?.url} style={{ textDecoration: 'none' }}>
            <Paper
              sx={{
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #4CAF50',
                borderRadius: 8,
                backgroundColor: 'rgba(224, 247, 250, 0.8)',
                textAlign: 'center',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
                // p: 2,
                m: { xs: 0, sm: 1 }, // Remove margin on mobile
                width: '100%', // Make sure card is full width in its grid cell
                boxSizing: 'border-box',
              }}
            >
              <Image
                src={item.icon}
                alt="img"
                style={{
                  width: '100%',
                  maxWidth: windowWidth < 600 ? 100 : 100,
                  height: windowWidth < 600 ? 100 : 100,
                  objectFit: 'contain',
                  marginBottom: 6,
                }}
                width={windowWidth < 600 ? 40 : 90}
                height={windowWidth < 600 ? 40 : 90}
              />
              <Typography variant="h6" sx={{ color: '#004d40' }}>
                {item.label}
              </Typography>
            </Paper>
          </Link>
        ))}
      </Box>
    </Paper>
    <Dialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: '#1f673b',
              border: '2px solid #43a047',
              boxShadow: '0 8px 32px 0 rgba(67,160,71,0.18)',
              p: 2,
              color: '#fff',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
            <DialogTitle sx={{ p: 0, fontWeight: 'bold', color: '#fff', fontSize: 22, letterSpacing: 0.5 }}>
              Create a League
            </DialogTitle>
            <IconButton onClick={() => setIsDialogOpen(false)} sx={{ color: '#fff' }}>
              <X />
            </IconButton>
          </Box>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="League Name"
              type="text"
              fullWidth
              variant="outlined"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateLeague();
                }
              }}
              sx={{
                mt: 1,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: '#1f673b',
                  color: '#fff',
                  borderRadius: 2,
                  border: '1.5px solid #43a047',
                  '& fieldset': {
                    borderColor: '#43a047',
                  },
                  '&:hover fieldset': {
                    borderColor: '#388e3c',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#43a047',
                  },
                  '& input': {
                    color: '#fff',
                  },
                },
                '& label': {
                  color: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: '#fff',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#fff',
                },
              }}
              InputLabelProps={{ sx: { color: '#fff' } }}
            />
            
            {/* League Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
                League Image (Optional)
              </Typography>
              
              {/* Image Preview */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2,
                p: 2,
                border: '2px dashed #43a047',
                borderRadius: 2,
                background: 'rgba(67,160,71,0.1)',
                minHeight: 80
              }}>
                <Avatar
                  src={imagePreview || '/assets/league.png'}
                  alt="League Image"
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    border: '2px solid #43a047',
                    background: '#1f673b'
                  }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#B2DFDB', mb: 0.5 }}>
                    {imagePreview ? 'Selected Image' : 'Default Flag Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#B2DFDB' }}>
                    {imagePreview ? 'Click to change or remove' : 'Upload a custom image for your league'}
                  </Typography>
                </Box>
              </Box>
              
              {/* Upload Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{
                    color: '#43a047',
                    borderColor: '#43a047',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 'bold',
                    '&:hover': { 
                      borderColor: '#388e3c',
                      backgroundColor: 'rgba(67,160,71,0.1)'
                    },
                  }}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
                {imagePreview && (
                  <Button
                    variant="outlined"
                    onClick={handleRemoveImage}
                    sx={{
                      color: '#ff6b6b',
                      borderColor: '#ff6b6b',
                      borderRadius: 2,
                      px: 2,
                      fontWeight: 'bold',
                      '&:hover': { 
                        borderColor: '#ff5252',
                        backgroundColor: 'rgba(255,107,107,0.1)'
                      },
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCreateLeague}
              variant="contained"
              disabled={isCreating || !leagueName.trim()}
              sx={{
                bgcolor: '#43a047',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
                px: 3,
                boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                '&:hover': { bgcolor: '#388e3c' },
              }}
            >
              {isCreating ? 'Creating...' : 'Create League'}
            </Button>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outlined"
              sx={{
                color: '#fff',
                border: '1.5px solid #43a047',
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'rgba(67,160,71,0.08)' },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}