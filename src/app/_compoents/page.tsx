'use client';

import { Box, Paper, Typography, Button, Card, Modal, IconButton, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Layer from '@/Components/images/championfootballnewlogo.webp';
import NewImg from '@/Components/images/Done1.webp';
import Newimg from '@/Components/images/Done2.webp';
import mobile from '@/Components/images/mobile.webp';
import heroPlayers from '@/Components/images/22.png';
import image9 from '@/Components/images/1stpic.png';
import image10 from '@/Components/images/2ndpic.png';
import image11 from '@/Components/images/3rdpic.png';
import image12 from '@/Components/images/4thpic.png';
import LogoNavbar from './logonavbar';


import { useState } from 'react';

// Lazy load heavy components
const AuthTabs = dynamic(() => import('@/Components/authtabs/authtabs'), {
  loading: () => <Box sx={{ p: 2, textAlign: 'center', color: 'white' }}>Loading...</Box>,
  ssr: true
});

const AuthSocialButtons = dynamic(() => import('@/Components/AuthSocialButtons'), {
  loading: () => <Box sx={{ p: 1 }} />,
  ssr: false
});

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Feature cards (id, title, image)
  const features = [
    { id: '1', title: ' Design your player card', img: image9 },
    { id: '2', title: 'Create and track your matches', img: image10 },
    { id: '3', title: 'View your game stats', img: image11 },
    { id: '4', title: 'Win awards', img: image12 },
  ];

  return (
    <>
      <LogoNavbar />
      
      {/* Black Hero Section with Grid Layout */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#101010',
          px: { xs: 2, md: 14 },
          py: { xs: 4, md: 2},
        }}
      >
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {/* Left Side - 8 columns */}
          <Grid item xs={12} md={8}>
            <Box sx={{ color: 'white' }}>
              {/* Heading */}
              <Typography
                sx={{
                  fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                  fontWeight: 400,
                  fontSize: { xs: '1.5rem', md: '38px' },
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#FFFFFF',
                  mb: -4,
                  mt: 1,
                  textTransform: 'uppercase',
                  width: { xs: 'auto', md: '817px' },
                  height: { xs: 'auto', md: '81px' },
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                }}
              >
                YOUR RANKING. YOUR STATS. YOUR GLORY.
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif !important',
                  fontWeight: '500 !important',
                  fontSize: { xs: '0.95rem', md: '18px' },
                  fontStyle: 'italic !important',
                  lineHeight: { xs: '1.4', md: '23px' },  
                  letterSpacing: '0% !important',
                  color: '#FFFFFF',
                  width: { xs: 'auto', md: '1152px' },
                  height: { xs: 'auto', md: '49px' },
                  mb: 2,
                }}
              >
                Create your matches, track your stats, and rise through the rankings<br />
                Champion Footballer is your ultimate hub for football, performance, and bragging rights!
              </Typography>

              {/* Hero image with three football players */}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '650px',
                  mb: 3,
                }}
              >
                <Image
                  src={heroPlayers}
                  alt="Football Players"
                  width={730}
                  height={400}
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  priority
                />
              </Box>

              {/* Bottom Text */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: -3.5, whiteSpace: 'nowrap', gap: 0, width: { xs: 'auto', md: '826px' }, height: { xs: 'auto', md: '90px' } }}>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                    fontWeight: '400 !important',
                    fontSize: { xs: '1.5rem', md: '31px' },
                    lineHeight: '100% !important',
                    letterSpacing: '0% !important',
                    textTransform: 'uppercase',
                  }}
                >
                  I GOT 99 PROBLEMS
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                    fontWeight: '400 !important',
                    fontSize: { xs: '1.5rem', md: '42px' },
                    lineHeight: '100% !important',
                    letterSpacing: '0% !important',
                    textTransform: 'uppercase',
                    ml: 1,
                    mt:1,
                  }}
                >
                  BUT WINNING AIN'T ONE!
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Side - 4 columns (Auth Form) */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                height: '100%',
                
              }}
            >
              {/* Top Text */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Typography
                  sx={{
                    fontFamily: 'Inter !important',
                    fontWeight: '600 !important',
                    fontSize: { xs: '1.2rem', md: '23px' },
                    lineHeight: { xs: '1.4', md: '35px' },
                    letterSpacing: '0% !important',
                    color: 'white',
                    textAlign: 'right',
                    maxWidth: { xs: '100%', md: '355px' },
                    width: '100%',
                    mt: 1,
                  }}
                >
                  The best football app<br />on the planet!
                </Typography>
              </Box>

              {/* Join Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (showLogin) {
                      setIsJoinModalOpen(true);
                    } else {
                      setShowLogin(true);
                    }
                  }}
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '1rem',
                    
                    border: '1px solid #FFFFFF',
                   
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid #FFFFFF',
                    },
                    borderRadius: '7px',
                    px: 4,
                    
                  }}
                >
                  {showLogin ? 'Join' : 'Login'}
                </Button>
              </Box>

              {/* Auth Form */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                }}
              >
                <Box sx={{ width: '100%', overflow: 'visible', mb: 2 }}>
                  <AuthTabs showLogin={showLogin} onToggleForm={() => setShowLogin(!showLogin)} />
                </Box>
                {showLogin ? (
                  <Box>
                    <AuthSocialButtons />
                  </Box>
                ) : null}
              </Paper>
            </Box>
            {/* Join Modal - Popup for registration */}
        <Modal
          open={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: { xs: '92vw', sm: '600px', md: '730px' },
              maxWidth: '92vw',
              height: { xs: '90vh', md: '1129px' },
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '15px',
              bgcolor: '#f5f6f6',
              p: { xs: 3, md: 4 },
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for Chrome/Safari/Opera
              scrollbarWidth: 'none', // Hide scrollbar for Firefox
              msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={() => setIsJoinModalOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'grey.500',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Auth Tabs - Register form */}
            <Box sx={{ width: '100%', overflow: 'visible' }}>
              <AuthTabs showLogin={false} onToggleForm={() => {}} />
            </Box>
          </Paper>
        </Modal>
          </Grid>
        </Grid>
      </Box>

      {/* Rest of the page with background */}
      <Box
        sx={{
          width: '100%',
          
          position: 'relative',
          background: '#101010',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
          
      }}
    >
      {/* BOTTOM GROUP: move images into a separate, centered box anchored to bottom on md+ */}
      {/* Separate images box — anchored bottom-center on md+, centered and stacked on small screens */}
      <Box
        sx={{
          width: { xs: '100%', md: 'auto' },
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, md: 0 },
          pointerEvents: 'none',
          mt: { xs: 2, sm: 2, md: 10 },
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 2, md: 2 },
            pointerEvents: 'auto',
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {features.map((f) => (
            <Card
              key={f.id}
              elevation={0}
              sx={{
                width: '100%',
                height: { xs: 180, sm: 200, md: 200 },
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                boxShadow: 'none',
                bgcolor: '#eaeae8',
                border: '1px solid rgba(255,255,255,0.2)',
                p: 2,

              }}
            >
              {/* <Typography variant="overline" sx={{ color: '#000000', letterSpacing: 1, fontWeight: 700 }}>
                {f.id}
              </Typography> */}
              <Typography variant="h6" sx={{ fontSize: { xs: '0.8rem', md: '1.1rem' }, color: '#000000', fontWeight: 700, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.id}. {f.title}
              </Typography>
              <Box sx={{ mt: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 95, sm: 105, md: 110 },
                    maxWidth: 320,
                    mx: 'auto',
                  }}
                >
                  <Image
                    src={f.img}
                    alt={f.title}
                    fill
                    sizes="(max-width: 600px) 90vw, 25vw"
                    style={{ objectFit: 'contain' }}
                    loading="lazy"
                    placeholder="blur"
                  />
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
    </>
  );
}
