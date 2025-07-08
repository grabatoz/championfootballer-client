'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, IconButton, Stack, Divider, Button } from '@mui/material';
import { FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { useAuth } from '@/lib/hooks';
import { logout } from '@/lib/features/authSlice';

export default function Footer() {
  const router = useRouter();
  const { isAuthenticated, dispatch } = useAuth();

  const handleSignOut = async () => {
    try {
      await dispatch(logout());
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box component="footer" sx={{py: 6, mt: 10 , backgroundColor: '#0a3e1e' }}>
      <Container maxWidth="md">
        <Stack spacing={3} alignItems="center">
          {/* Social Icons */}
          <Stack direction="row" spacing={2}>
            <IconButton component="a" href="https://twitter.com" target="_blank" rel="noopener noreferrer" color="inherit">
              <FaXTwitter />
            </IconButton>
            <IconButton component="a" href="https://instagram.com" target="_blank" rel="noopener noreferrer" sx={{ color: '#E1306C' }}>
              <FaInstagram />
            </IconButton>
          </Stack>

          <Divider sx={{ width: '100%' }} />

          {/* Footer Links */}
          <Stack direction="row" spacing={3} flexWrap="wrap" justifyContent="center">
            <Button component={Link} href="/terms" sx={{ textTransform: 'none' }}>Terms & Conditions</Button>
            <Button component={Link} href="/privacy" sx={{ textTransform: 'none' }}>Privacy Policy</Button>
            <Button component={Link} href="/contact" sx={{ textTransform: 'none' }}>Contact Us</Button>
            <Button component={Link} href="/about" sx={{ textTransform: 'none' }}>About Us</Button>
            {isAuthenticated && (
              <Button onClick={handleSignOut} sx={{ textTransform: 'none', color: 'error.main' }}>Sign Out</Button>
            )}
          </Stack>

          <Typography variant="body2" color="textSecondary">
            © Champion Footballer 2025
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}









// 'use client';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import React from 'react';
// import { FaInstagram, FaXTwitter } from 'react-icons/fa6';
// import { useAuth } from '@/lib/hooks';
// import { logout } from '@/lib/features/authSlice';

// function Index() {
//   const router = useRouter();
//   const { isAuthenticated, dispatch  } = useAuth();

//   const handleSignOut = async () => {
//     try {
//       await dispatch(logout());
//       router.push('/login');
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };

//   return (
//     <footer className="bg-gray-100 text-gray-700 py-10">
//       <div className="flex flex-col items-center space-y-4">
//         {/* Social Icons */}
//         <div className="flex space-x-4 text-2xl">
//           <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
//             <FaXTwitter />
//           </a>
//           <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
//             <FaInstagram className="text-pink-500" />
//           </a>
//         </div>

//         {/* Copyright */}
//         <div className="text-sm font-medium">© Champion Footballer 2025</div>

//         {/* Footer Links */}
//         <div className="flex flex-wrap justify-center space-x-6 text-sm font-medium">
//           <Link href="/terms">Terms & Conditions</Link>
//           <Link href="/privacy">Privacy Policy</Link>
//           <Link href="/contact">Contact Us</Link>
//           <Link href="/about">About Us</Link>
//           {isAuthenticated && (
//             <button 
//               onClick={handleSignOut}
//               className="hover:underline cursor-pointer"
//             >
//               Sign Out
//             </button>
//           )}
//         </div>
//       </div>
//     </footer>
//   );
// }

// export default Index;