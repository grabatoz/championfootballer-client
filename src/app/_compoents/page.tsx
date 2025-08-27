'use client';

import { Box, Paper, Typography, Button, Card } from '@mui/material';
import AuthTabs from '@/Components/authtabs/authtabs';
import Image from 'next/image';
import Layer from '@/Components/images/championfootballnewlogo.png';
// import NewImg from '@/Components/images/desktoppicccc.png';
import NewImg from '@/Components/images/dspic.png';
import mobile from '@/Components/images/mobile.png';
import image9 from '@/Components/images/image9.png';
import image10 from '@/Components/images/image10.png';
import image11 from '@/Components/images/image11.png';
import image12 from '@/Components/images/image12.png';

import { useState } from 'react';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(true);

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
        backgroundAttachment:'fixed'
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
          alignItems: { xs: 'space', md: 'flex-start' },
          justifyContent: 'space-between',
          // gap: 3,
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
            mt: '13%',              // md: ensure Paper itself is centered
            // ml: { sm: '50%' }
          }}
          
        >
          <Paper
            elevation={8}
            // className='sm:ml-[50%] ml-0'
            sx={{
              width: '100%',
              // p: { xs: 2, md: 3 },
              borderRadius: 3,
              // backgroundColor:'transparent'
              bgcolor: 'transparent',
              // ensure paper itself is transparent and doesn't force white backgrounds on children
              boxShadow: 'none',
                alignSelf: { md: 'center' }, 
              '& .MuiPaper-root': { background: 'transparent' },
              ml:{xs:'0%' , sm:'30%' , md:0}
            }}
          >

            {/* force AuthTabs to take full width and allow overflow for mobile friendliness */}
            <Box sx={{ width: '100%', overflow: 'visible' , mb:4}}>
            <Box sx={{ display: 'flex', justifyContent: {xs: 'flex-end', sm: 'center', md: 'flex-end' }, mb: 2 }}>
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
          mt:{sx:0,sm:0,md:20},
          mb:4,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr',sm: 'repeat(4, 1fr)', md: 'repeat(4, 1fr)' }, // xs: 1 column, md+: 4 columns
            gap: { xs: 2, md: 2 },
            pointerEvents: 'auto',
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {[image9, image10, image11, image12].map((img, i) => (
            <Card
              key={i}
              elevation={0}
              sx={{
                width: '100%',
                height: { xs: 'auto', sm: 280, md: 280 },
                borderRadius: 0,           // remove rounded corners
                overflow: 'visible',       // show full image without cropping
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none',        // remove shadow
                bgcolor: 'transparent',   // no background color
                border: 'none',
              }}
            >
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
                <Image
                  src={img}
                  alt={`feature-${i}`}
                  width={800}
                  height={800}
                  style={{
                    width: '100%',         // full width in grid cell
                    height: 'auto',        // keep aspect ratio
                    objectFit: 'contain',  // show whole image, no crop
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
