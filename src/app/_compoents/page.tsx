'use client';

import { Box, Paper, Typography } from '@mui/material';
import AuthTabs from '@/Components/authtabs/authtabs';
import Image from 'next/image';
import Layer from '@/Components/images/Layer.svg';
import ground from '@/Components/images/football-field.png';

export default function LandingPage() {
  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        backgroundImage: `url(${ground.src})`,
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
          gap: 16,
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <Box
          sx={{
            flex: { xs: 'none', md: '1' },
            textAlign: { xs: 'center', md: 'left' },
            color: 'white',
            px: { xs: 2, md: 0 },
          }}
        >
          {/* Image positioned above text */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'center' },
              mb: 3,
            }}
          >
            <Box
              sx={{
                p: 2,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                }
              }}
            >
              <Image 
                src={Layer || "/placeholder.svg"} 
                alt="ground" 
                width={140} 
                height={140}
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}
              />
            </Box>
          </Box>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
            }}
          >
            ChampionFootballer
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              maxWidth: 450,
              lineHeight: 1.6,
              color: '#f0f0f0',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
          >
            Track your progress, set availability, and dive into matches and leagues — all from here. Join now and elevate your football experience!
          </Typography>
        </Box>

        <Box
          sx={{
            flex: { xs: 'none', md: '1' },
            maxWidth: 480,
            width: '100%',
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 4, md: 4 },
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              mx: 'auto',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <AuthTabs />
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
