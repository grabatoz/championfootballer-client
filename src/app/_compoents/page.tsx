'use client';

import { Box, Paper, Typography, Button } from '@mui/material';
import AuthTabs from '@/Components/authtabs/authtabs';
import Image from 'next/image';
import Layer from '@/Components/images/championfootballnewlogo.png';
import NewImg from '@/Components/images/desktoppic.png'
import mobile from '@/Components/images/mobile.png'

import { useState } from 'react';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        backgroundImage: {
          xs: `url(${mobile.src})`,
          sm: `url(${mobile.src})`,
          md: `url(${NewImg.src})`,
        },
        backgroundSize: '100% 120%', // <-- Image will stretch to full width and height
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        px: { xs: 2, md: 4 },
        py: 0,
        overflow: 'auto',
       backgroundAttachment: 'fixed',
      }}
    >
      {/* Left Side - Logo & Content fixed at top */}
      <Box
        sx={{
          flex: { xs: 'none', md: '1' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: { xs: 'center', md: 'flex-start' },
          justifyContent: 'flex-start',
          pt: { xs: 2, md: 1 },
          pl: { xs: 0, md: 0 },
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo */}
        <Image
          src={Layer || "/placeholder.svg"}
          alt="Champion Footballer Logo"
          width={250}
          height={80}
          style={{
            maxWidth: '100%',
            height: 'auto',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}
        />
        {/* Tagline & Description */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            mt: 3,
            mb: 2,
            fontSize: { xs: '1.2rem', md: '1.5rem' },
            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
            color: 'white',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          Your Game. Your Stats.<br />Your Glory
        </Typography>
        <Typography
          variant="body1"
          sx={{
            maxWidth: 320,
            lineHeight: 1.6,
            color: '#f0f0f0',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            fontSize: { xs: '1rem', md: '1.1rem' },
            mb: 2,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          Create your personalised matches, track your performance, and climb the ranks. Champion Footballer is your home for casual football made competitive!
        </Typography>
      </Box>

      {/* Right Side - Auth Form centered vertically */}
      <Box
        sx={{
          flex: { xs: 'none', md: '1' },
          maxWidth: 380,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={0} // Remove shadow for transparency
          sx={{
            p: { xs: 3, sm: 4, md: 4 },
            borderRadius: 3,
            backgroundColor: 'transparent', // Remove background color
            mx: 'auto',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            // boxShadow: 'none',
          }}
        >
          {/* Dynamic Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setShowLogin(!showLogin)}
              sx={{
                color: 'white',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: '#000000',
                '&:hover': {
                  backgroundColor: '#000000',
                },
                borderRadius: 2,
              }}
            >
              {showLogin ? 'Join' : 'Login'}
            </Button>
          </Box>
          {/* Auth Form */}
          <AuthTabs showLogin={showLogin} onToggleForm={() => setShowLogin(!showLogin)} />
        </Paper>
      </Box>
    </Box>
  );
}
