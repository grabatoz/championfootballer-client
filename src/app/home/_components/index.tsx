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
// import { joinLeague } from '@/lib/features/leagueSlice';

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







  // Add state for window width
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
    <Box sx={{ px: 3, py: 4,  minHeight: '100vh' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Paper
        elevation={3}
        sx={{
          backgroundImage: `url(${dash.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          p: 3,
          mb: 4,
        }}
      >
  <Box sx={{ 
    display: 'flex', 
    alignItems: { xs: 'stretch', md: 'center' }, // Changed alignment for mobile
    gap: 4,
    flexDirection: { xs: 'column', md: 'row' } // Stack vertically on mobile, horizontally on desktop
  }}>
    <Box sx={{ 
      flex: { xs: 'none', md: '0 0 300px' }, // Remove fixed width on mobile
      width: { xs: '100%', md: '90%' }, // Full width on mobile
      display: 'flex',
      justifyContent: { xs: 'center', md: 'flex-start' } // Center on mobile
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
        // profileImage={user?.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture.startsWith('/') ? user.profilePicture : `/${user.profilePicture}`}`) : undefined}
        profileImage={user?.profilePicture || undefined}
              shirtIcon={''}
              position={user?.position || ''}
            />
          </Box>

    {/* <Box 
      sx={{ 
        flex: 1, 
        backgroundColor: 'rgba(255,255,255,0.85)', 
        p: 3, 
        borderRadius: 2,
        maxWidth: { xs: '100%', md: '41%' }, // Full width on mobile, limited on desktop
        width: { xs: '100%', md: 'auto' } // Ensure full width on mobile
      }}
    >
            <Typography variant="h6" gutterBottom>
              Welcome, {user?.firstName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {`You haven't setup your Player Card yet. Let's change that!`}
            </Typography>
            <Link href="/profile" passHref>
        <Button 
          variant="outlined" 
          sx={{ 
            mt: 2,
            width: { xs: '100%', sm: 'auto' } // Full width button on mobile
          }}
        >
                Edit Profile & Player Card
              </Button>
            </Link>
          </Box> */}
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