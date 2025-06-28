'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import PlayerCard from '@/Components/playercard/playercard';
import Link from 'next/link';
import dash from '@/Components/images/dash.png'
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import league from '@/Components/images/league.png'
import matches from '@/Components/images/matches.png'
import leaderboard from '@/Components/images/leaderboard.png'
import dreamteam from '@/Components/images/dream.png'
import players from '@/Components/images/players.png'
import trophy from '@/Components/images/trophy.png'

export default function PlayerDashboard() {
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { user, token } = useAuth();

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setInviteCode('');
        toast.success('Successfully joined league!');
      } else {
        toast.error(data.message || 'Failed to join league');
      }
    } catch (error) {
      console.error('Error joining league:', error);
      toast.error('Failed to join league');
    } finally {
      setIsJoining(false);
    }
  };

  const items = [
    { label: 'League', icon: league , url:'all-leagues' },
    { label: 'matches', icon: matches , url:'all-matches'},
    { label: 'Dream Team', icon: dreamteam , url:'dream-team'},
    { label: 'Players', icon: players , url:'all-leagues'},
    { label: 'Trophy Room', icon: trophy , url:'trophy-room'},
    { label: 'Leader Board', icon: leaderboard , url:'all-leagues'},
  ];

  return (
    <Box sx={{ px: 3, py: 4,  minHeight: '100vh' }}>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Welcome Section */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box sx={{ flex: '0 0 300px' }}>
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
              profileImage={user?.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}` : undefined}
              shirtIcon={''}
            />
          </Box>
          <Box maxWidth={'41%'} sx={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.85)', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Welcome, {user?.firstName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {`You haven't setup your Player Card yet. Let's change that!`}
            </Typography>
            <Link href="/profile" passHref>
              <Button variant="outlined" sx={{ mt: 2 }}>
                Edit Profile & Player Card
              </Button>
            </Link>
          </Box>
        </Box>
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
            disabled={isJoining}
          >
            <svg className="w-5 h-5 mr-2" fill="white" viewBox="0 0 24 24">
              <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
            </svg>
            {isJoining ? 'Joining...' : 'Join League'}
          </Button>
        </Box>
      </Paper>

      {/* League Section */}
      <Paper
      elevation={3}
      sx={{
        // backgroundImage: `url(${dash2.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 2,
        overflow: 'hidden',
        p: 3,
        mb: 4,
      }}
    >
      <Grid container spacing={3} sx={{ padding: 2 }}>
        {items.map((item, index) => (
          <Link key={index} href={item?.url} >
          <Grid item xs={12} sm={6} md={3} >
            <Paper
              sx={{
                height: 150, // Increased height for desktop
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #4CAF50',
                borderRadius: 8,
                backgroundColor: 'rgba(224, 247, 250, 0.8)', // Slightly transparent for background image visibility
                textAlign: 'center',
               transition: 'transform 0.3s', // Add hover effect
                '&:hover ': {
                  transform: 'scale(1.05)', // Slight zoom on hover
                },
                width:165,
              }}
            >
             <Image src={item.icon} width={100} height={100} alt='img'/>
              <Typography variant="h6" sx={{ color: '#004d40', mt: 1 }}>
                {item.label}
              </Typography>
            </Paper>
          </Grid>
          </Link>

        ))}
      </Grid>
    </Paper>
    </Box>
  );
}