'use client'
import { Box, Paper, Typography } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import league from '@/Components/images/league.png'
import matches from '@/Components/images/matches.png'
import leaderboard from '@/Components/images/leaderboard.png'
import dreamteam from '@/Components/images/dream.png'
import players from '@/Components/images/players.png'
import trophy from '@/Components/images/trophy.png'

export default function Dashboard() {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const items = [
    { label: 'League', icon: league , url:'all-leagues' },
    { label: 'Matches', icon: matches , url:'all-matches'},
    { label: 'Dream Team', icon: dreamteam , url:'dream-team'},
    { label: 'Players', icon: players , url:'all-players'},
    { label: 'Trophy Room', icon: trophy , url:'trophy-room'},
    { label: 'Leader Board', icon: leaderboard , url:'leader-board'},
  ];

  return (
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
  )
}

