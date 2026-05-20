'use client';

import { Box, Paper, Typography, Button, Card, Modal, IconButton, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Layer from '@/Components/images/championfootballnewlogo.webp';
import NewImg from '@/Components/images/Done1.webp';
import Newimg from '@/Components/images/Done2.webp';
import mobile from '@/Components/images/mobile.webp';
import heroPlayers from '@/Components/images/222.png';
import image9 from '@/Components/images/1stpicc.png';
import image10 from '@/Components/images/2ndpicc.png';
import image11 from '@/Components/images/3rdpicc.png';
import image12 from '@/Components/images/4thpicc.png';
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
    { id: '1', title: 'CREATE YOUR PLAYER CARD', img: image9 },
    { id: '2', title: 'CREATE LEAGUES & MATCHES', img: image10 },
    { id: '3', title: 'TRACK YOUR PERFORMANCE', img: image11 },
    { id: '4', title: 'WIN TROPHIES & REWARDS', img: image12 },
  ];

  return (
    <>
      <LogoNavbar />

      {/* Black Hero Section with Grid Layout */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#101010',
          overflowX: 'hidden',
          px: { xs: 2, md: 7 },
          py: { xs: 4, md: 2 },
        }}
      >
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {/* Left Side - 8 columns */}
          <Grid item xs={12} md={8}>
            <Box sx={{ color: 'white' }}>
              {/* Heading */}
              <Typography
                className="landing-hero-display"
                sx={{
                  fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                  fontWeight: 400,
                  fontSize: { xs: 'clamp(1.15rem, 6.5vw, 1.55rem)', md: '38px' },
                  lineHeight: { xs: 1.1, md: '100%' },
                  letterSpacing: '0%',
                  color: '#FFFFFF',
                  mb: { xs: 1.5, md: -4 },
                  mt: { xs: 0, md: 1 },
                  textTransform: 'uppercase',
                  width: '100%',
                  maxWidth: { md: '817px' },
                  height: { xs: 'auto', md: '81px' },
                  whiteSpace: { xs: 'normal', md: 'nowrap' },
                  wordBreak: 'break-word',
                  overflow: 'visible',
                }}
              >
                YOUR RANKING. YOUR STATS. YOUR GLORY.
              </Typography>

              {/* Description */}
              {/* <Typography
                sx={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif !important',
                  fontWeight: '500 !important',
                  fontSize: { xs: '0.86rem', md: '18px' },
                  // fontStyle: 'italic !important',
                  lineHeight: { xs: '1.4', md: '23px' },  
                  letterSpacing: '0% !important',
                  color: 'orange',
                  width: '100%',
                  maxWidth: { md: '100%' },
                  height: { xs: 'auto', md: '49px' },
                  mb: { xs: 2.5, md: 2 },
                }}
              >
                Create your matches, track your stats, and rise through the rankings<br />
                Champion Footballer is your ultimate hub for football, performance, and bragging rights!
              </Typography> */}
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif !important',
                  fontWeight: '500 !important',
                  fontSize: { xs: '0.86rem', md: '18px' },
                  lineHeight: { xs: '1.4', md: '23px' },
                  letterSpacing: '0% !important',
                  color: 'orange',
                  width: '100%',
                  maxWidth: { md: '100%' },
                  height: { xs: 'auto', md: '49px' },
                  mb: { xs: 2.5, md: 2 },
                  display: { xs: 'none', md: 'block' }, // 👈 yeh add karo
                }}
              >
                Create your matches, track your stats, and rise through the rankings<br />
                Champion Footballer is your ultimate hub for football, performance, and bragging rights!
              </Typography>
              {/* Mobile only */}
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif !important',
                  fontWeight: '500 !important',
                  fontSize: '0.86rem',
                  lineHeight: '1.4',
                  letterSpacing: '0% !important',
                  color: 'orange',
                  width: '100%',
                  mb: 2.5,
                  display: { xs: 'block', md: 'none' }, // 👈 sirf mobile pe show
                }}
              >
                {/* Apna mobile text yahan likhna */}
                Create your matches, track your stats, and rise through the rankings.
                Champion Footballer is your ultimate hub for football, performance, and bragging rights!
              </Typography>
              {/* Hero image with three football players */}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', md: '750px' },
                  mb: { xs: 2, md: 3 },
                }}
              >
                <Image
                  src={heroPlayers}
                  alt="Football Players"
                  width={780}
                  height={500}
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  priority
                />
              </Box>

              {/* Bottom Text */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  mt: { xs: 0.5, md: -3.5 },
                  whiteSpace: { xs: 'normal', md: 'nowrap' },
                  flexWrap: { xs: 'wrap', md: 'nowrap' },
                  gap: 0,
                  width: '100%',
                  maxWidth: { xs: '100%', md: '826px' },
                  height: { xs: 'auto', md: '90px' },
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                <Typography
                  component="span"
                  className="landing-hero-display"
                  sx={{
                    fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                    fontWeight: '400 !important',
                    fontSize: { xs: '1rem', md: '31px' },
                    lineHeight: { xs: 1.05, md: '100% !important' },
                    letterSpacing: '0% !important',
                    textTransform: 'uppercase',
                  }}
                >
                  I GOT 99 PROBLEMS
                </Typography>
                <Typography
                  component="span"
                  className="landing-hero-display"
                  sx={{
                    fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                    fontWeight: '400 !important',
                    fontSize: { xs: '1.05rem', md: '40px' },
                    lineHeight: { xs: 1.05, md: '100% !important' },
                    letterSpacing: '0% !important',
                    textTransform: 'uppercase',
                    ml: { xs: 0.35, md: 1 },
                    mt: { xs: 0, md: 1 },
                  }}
                >
                  BUT WINNING
                </Typography>   <Typography
                  component="span"
                  className="landing-hero-display"
                  sx={{
                    fontFamily: 'var(--font-geist-anton), Anton, sans-serif !important',
                    fontWeight: '400 !important',
                    fontSize: { xs: '1.05rem', md: '44px' },
                    lineHeight: { xs: 1.05, md: '100% !important' },
                    letterSpacing: '0% !important',
                    textTransform: 'uppercase',
                    ml: { xs: 0.35, md: 1 },
                    mt: { xs: 0, md: 1 },
                  }}
                >
                  AIN'T ONE!
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
                mt: { xs: 1, md: 0 },

              }}
            >
              {/* Top Text */}
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mb: 1 }}>
                <Typography
                  sx={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif !important',
                    fontWeight: '600 !important',
                    fontSize: { xs: '1rem', md: '23px' },
                    lineHeight: { xs: '1.3', md: '35px' },
                    letterSpacing: '0% !important',
                    color: 'white',
                    textAlign: { xs: 'left', md: 'right' },
                    maxWidth: { xs: '100%', md: '355px' },
                    width: '100%',
                    mt: { xs: 0, md: 1 },
                    whiteSpace: { xs: 'nowrap', md: 'normal' },
                  }}
                >
                  The best football app
                  <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                    <br />
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                    {' '}
                  </Box>
                  on the planet!
                </Typography>
              </Box>

              {/* Join Button */}
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mb: { xs: 1.5, md: 1 } }}>
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
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    width: { xs: '100%', md: 'auto' },
                    height: { xs: '40px', md: 'auto' },

                    border: '1px solid #FFFFFF',

                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid #FFFFFF',
                    },
                    borderRadius: '7px',
                    px: { xs: 3, md: 4 },

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
                  <AuthTabs showLogin={false} onToggleForm={() => { }} />
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
          overflowX: 'hidden',

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
                  height: { xs: 230, sm: 238, md: 238 },
                  minHeight: { xs: 230, sm: 238, md: 238 },
                  borderRadius: 0.5,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                  border: '2px solid #6a6f75',
                  // background: 'linear-gradient(180deg, #51565b 0%, #24292f 34%, #020407 100%)',
                  background: 'linear-gradient(180deg, #3c4146 0%, #010305 100%)',

                  p: 0,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    px: { xs: 1.1, md: 1.25 },
                    py: { xs: 0.75, md: 0.85 },
                    minHeight: { xs: 36, md: 40 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // background: 'linear-gradient(180deg, #575b60 0%, #474b50 100%)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                      fontSize: { xs: '0.98rem', md: '0.97rem' },
                      lineHeight: 1.1,
                      letterSpacing: '0.01em',
                      color: '#ffff',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      width: '100%',
                      textShadow: '0 1px 0 rgba(0,0,0,0.55)',
                    }}
                  >
                    {f.title}
                  </Typography>
                </Box>
                {/* <Box
                sx={{
                  width: '100%',
                  height: 2.5,
                  bgcolor: '#0a0d10',
                }}
              /> */}
                <Box
                  sx={{
                    flex: 1,
                    width: '100%',
                    p: { xs: 1.15, md: 1.3 },
                    bgcolor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      mx: 'auto',
                      // background: 'linear-gradient(180deg, #0b0f13 0%, #010305 100%)',
                    }}
                  >
                    <Image
                      src={f.img}
                      alt={f.title}
                      fill
                      sizes="(max-width: 600px) 90vw, 25vw"
                      style={{ objectFit: 'contain', padding: '8px 14px' }}
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
