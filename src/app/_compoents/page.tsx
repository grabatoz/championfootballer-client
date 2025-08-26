'use client';

import { Box, Paper, Typography, Button, Card } from '@mui/material';
import AuthTabs from '@/Components/authtabs/authtabs';
import Image from 'next/image';
import Layer from '@/Components/images/championfootballnewlogo.png';
import NewImg from '@/Components/images/desktoppicccc.png';
import mobile from '@/Components/images/mobile.png';
import image9 from '@/Components/images/image9.png';
import image10 from '@/Components/images/image10.png';
import image11 from '@/Components/images/image11.png';
import image12 from '@/Components/images/image12.png';

import { useState } from 'react';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        // ✅ Responsive background images
        backgroundImage: {
          xs: `url(${mobile.src})`, // small screens par mobile bg
          sm: `url(${NewImg.src})`, // tablet aur upar par desktop bg
        },
        backgroundSize: { xs: 'cover', md: 'cover' }, // full coverage
        backgroundPosition: { xs: 'center top', md: 'center center' }, // positioning
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 4 },
        // backgroundAttachment:'fixed'
        // width: '100%',
        // minHeight: '100vh',
        // position: 'relative',
        // // background removed per previous request
        // background: 'transparent',
        // display: 'flex',
        // flexDirection: 'column',
        // justifyContent: 'space-between',
        // px: { xs: 2, md: 3 },
        // py: { xs: 3, md: 4 },
      }}
    >
      {/* TOP GROUP: Logo + Tagline + Auth (kept together in a single box) */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' },
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        {/* Logo + Copy (left side inside top group) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
            maxWidth: { md: '48%' },
          }}
        >
          <Image
            src={Layer || '/placeholder.svg'}
            alt="Champion Footballer Logo"
            width={250}
            height={80}
            style={{ maxWidth: '100%', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
          />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              mt: 3,
              mb: 2,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              color: 'white',
            }}
          >
            Your Game. Your Stats.<br />Your Glory
          </Typography>

          <Typography
            variant="body1"
            sx={{
              maxWidth: 360,
              lineHeight: 1.6,
              color: '#f0f0f0',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontSize: { xs: '1rem', md: '1.05rem' },
            }}
          >
            Create your personalised matches, track your performance, and climb the ranks. Champion Footballer is your home for casual football made competitive!
          </Typography>
        </Box>

        {/* Auth area (right side inside top group) */}
        <Box
          sx={{
            width: { xs: '100%', md: 380 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'transparent',
            mt: '13%'
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              // p: { xs: 2, md: 3 },
              borderRadius: 3,
              // backgroundColor:'transparent'
              bgcolor: 'transparent',
              // ensure paper itself is transparent and doesn't force white backgrounds on children
              boxShadow: 'none',
              '& .MuiPaper-root': { background: 'transparent' },
            }}
          >
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
                  '&:hover': { backgroundColor: '#000000' },
                  borderRadius: 2,
                  px: 2,
                }}
              >
                {showLogin ? 'Join' : 'Login'}
              </Button>
            </Box>

            {/* force AuthTabs to take full width and allow overflow for mobile friendliness */}
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <AuthTabs showLogin={showLogin} onToggleForm={() => setShowLogin(!showLogin)} />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* BOTTOM GROUP: move images into a separate, centered box anchored to bottom on md+ */}
      {/* Separate images box — anchored bottom-center on md+, centered and stacked on small screens */}
      <Box
        sx={{
          width: { xs: '100%', md: 'auto' },
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, md: 0 },
          pointerEvents: 'none',
          // mt:{sx:0,sm:0,md:20}
        }}
      >
        <Box sx={{ display: 'flex', gap: 0, pointerEvents: 'auto', alignItems: 'center' }}>
          {[image9, image10, image11, image12].map((img, i) => (
            <Card
              key={i}
              elevation={0}
              sx={{
                width: { xs: 100, sm: 140, md: 280 },
                height: { xs: 100, sm: 140, md: 280 },
                borderRadius: 0,           // remove rounded corners
                overflow: 'visible',       // show full image without cropping
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none',        // remove shadow
                bgcolor: 'transparent',   // no background color
                border: 'none',
                flex: '0 0 auto',
              }}
            >
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
                <Image
                  src={img}
                  alt={`feature-${i}`}
                  width={800}
                  height={800}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: '100%',
                    objectFit: 'contain', // show whole image, no crop
                    background: 'transparent',
                  }}
                />
              </Box>
            </Card>
          ))}
        </Box>
      </Box>

    </Box>
  );
}
