'use client';

import { Box, Paper, Typography, Button } from '@mui/material';
import AuthTabs from '@/Components/authtabs/authtabs';
import Image from 'next/image';
import Layer from '@/Components/images/championfootballnewlogo.png';
import NewImg from '@/Components/images/desktoppic.png'
import { useState } from 'react';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        backgroundImage: `url(${NewImg.src})`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, md: 4 },
        py: 6,
        overflow: 'auto',
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' }, 
          justifyContent: 'center',
          maxWidth: '3000px',
          width: '100%',
          gap: { xs: 4, md: 8 }
        }}
      >
        {/* Left Side - Branding - Fixed position */}
        <Box
          sx={{
            flex: { xs: 'none', md: '1' },
            textAlign: { xs: 'center', md: 'left' },
            color: 'white',
            px: { xs: 2, md: 0 },
            alignSelf: { xs: 'center', md: 'flex-start' },
            // Branding stays in same position for both login and register
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
              mb: 3,
              gap: 2
            }}
          >
            <Box
              sx={{
                p: 2,
                // transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                // '&:hover': {
                //   transform: 'translateY(-5px)',
                // }
              }}
            >
              <Image 
                src={Layer || "/placeholder.svg"} 
                alt="ground" 
                width={250} 
                height={250}
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}
              />
            </Box>
            <Box>
            </Box>
          </Box>

          {/* Tagline */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              color: 'white',
            }}
          >
            Your Game. Your Stats. <br/>Your Glory
          </Typography>
          
          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              maxWidth: 320,
              lineHeight: 1.6,
              color: '#f0f0f0',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Create your personalised matches, track your performance, and climb the ranks. Champion Footballer is your home for casual football made competitive!
          </Typography>
        </Box>

        {/* Right Side - Auth Form - Fixed size */}
        <Box
          sx={{
            flex: { xs: 'none', md: '1' },
            maxWidth: 480,
            width: '100%',
            alignSelf: { xs: 'center', md: 'flex-start' },
            // Fixed size to prevent layout shifts
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 4 },
              borderRadius: 0,
              backgroundColor: 'transparent',
              mx: 'auto',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Dynamic Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="text"
                onClick={() => setShowLogin(!showLogin)}
                sx={{
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'black',
                  },
                  backgroundColor: 'black',
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
    </Box>
  );
}













// 'use client';
// import { Box, Paper, Typography } from '@mui/material';
// import AuthTabs from '@/Components/authtabs/authtabs';
// import Image from 'next/image';
// import Layer from '@/Components/images/Layer.svg';

// export default function LandingPage() {
//   return (
//     <Box
//       sx={{
//         width: '100vw',
//         minHeight: '100vh',
//         // backgroundImage: `url(${ground.src})`,
//         backgroundAttachment: 'fixed',
//         backgroundSize: 'cover',
//         backgroundRepeat: 'no-repeat',
//         backgroundPosition: 'center',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         px: { xs: 2, md: 4 },
//         py: 6,
//         overflow: 'auto',
//       }}
//     >
//       <Image src={Layer} alt="ground" width={100} height={100} />
//         <Box 
//           sx={{ 
//             display: 'flex', 
//             flexDirection: { xs: 'column', md: 'row' },
//             gap: 16,
//             alignItems: 'center', 
//             justifyContent: 'center' 
//           }}
//         >
//           {/* Left Side - Intro */}
//             <Box
//               sx={{
//               flex: { xs: 'none', md: '1' },
//                 textAlign: { xs: 'center', md: 'left' },
//                 color: 'white',
//                 px: { xs: 2, md: 0 },
//               }}
//             >
//               <Typography
//                 variant="h3"
//                 component="h1"
//                 sx={{
//                   fontWeight: 'bold',
//                   mb: 2,
//                   fontSize: { xs: '2rem', md: '3rem' },
//                   textShadow: '0 2px 4px rgba(0,0,0,0.6)',
//                 }}
//               >
//                 Champion Footballer
//               </Typography>
//               <Typography
//                 variant="h6"
//                 sx={{
//                   maxWidth: 450,
//                   lineHeight: 1.6,
//                   color: '#f0f0f0',
//                   textShadow: '0 1px 2px rgba(0,0,0,0.5)',
//                 }}
//               >
//                 Track your progress, set availability, and dive into matches and leagues — all from here. Join now and elevate your football experience!
//               </Typography>
//             </Box>

//           {/* Right Side - Auth Form */}
//           <Box
//             sx={{
//               flex: { xs: 'none', md: '1' },
//               maxWidth: 480,
//               width: '100%',
//             }}
//           >
//             <Paper
//               elevation={6}
//               sx={{
//                 p: { xs: 3, sm: 4 },
//                 borderRadius: 3,
//                 backgroundColor: 'rgba(255, 255, 255, 0.08)',
//                 backdropFilter: 'blur(10px)',
//                 border: '1px solid rgba(255, 255, 255, 0.2)',
//                 mx: 'auto',
//               }}
//             >
//               <AuthTabs />
//             </Paper>
//           </Box>
//         </Box>
//     </Box>
//   );
// }
