'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  // Button,
  Paper,
} from '@mui/material';
import PlayerCard from '@/Components/playercard/playercard';
import Link from 'next/link';
import dash from '@/Components/images/dash.webp'
import { Toaster } from 'react-hot-toast';
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
// import { joinLeague } from '@/lib/features/leagueSlice';

export default function PlayerDashboard() {
  // const [inviteCode, setInviteCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // const handleJoinLeague = async () => {
  //   if (!inviteCode.trim()) return;

  //   try {
  //     await dispatch(joinLeague(inviteCode.trim())).unwrap();
  //       setInviteCode('');
  //       toast.success('Successfully joined league!');
  //   } catch (error: unknown) {
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to join league';
  //     toast.error(errorMessage);
  //   }
  // };

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
              level={''}
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
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
        </Box> */}
    
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
                p: 2,
                m: { xs: 0, sm: 1 }, // Remove margin on mobile
                width: '100%', // Make sure card is full width in its grid cell
                boxSizing: 'border-box',
              }}
            >
              {/* Image inside the card, above the label */}
              <Image
                src={item.icon}
                alt="img"
                style={{
                  width: '110px',
                  height: '110px',
                  objectFit: 'contain',
                  marginBottom: 8,
                }}
                width={100}
                height={100}
              />
              <Typography variant="h6" sx={{ color: '#004d40' }}>
                {item.label}
              </Typography>
            </Paper>
          </Link>
        ))}
      </Box>
    </Paper>
    </Box>
  );
}