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
    <Box component="footer" sx={{
      py: { xs: 5, md: 7 },
      // mt: 10,
      // background: '#00A77F',
      // background: 'linear-gradient(90deg, #E56A16 0%, #CF2326 100%)', // <-- updated to linear gradient
      // background: 'linear-gradient(90deg, #E56A16 0%, #CF2326 100%)',
      background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
      color: 'white',
      // borderTopLeftRadius: { xs: 24, md: 32 },
      // borderTopRightRadius: { xs: 24, md: 32 },
      boxShadow: '0 -2px 24px 0 rgba(30, 58, 138, 0.12)',
    }}>
      <Container maxWidth="md">
        <Stack spacing={4} alignItems="center" justifyContent="center">
          {/* Social Icons */}
          <Stack direction="row" spacing={2}>
            <IconButton
              component="a"
              href="https://x.com/champf2baller"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'white',
                bgcolor: 'black',
                // border: '2px solid #43a047',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'black', color: '#fff' },
              }}
            >
              <FaXTwitter />
            </IconButton>
            <IconButton
              component="a"
              href="https://www.instagram.com/champf2baller/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#fff',
                bgcolor: 'black',
                // border: '2px solid #E1306C',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'black', color: '#fff' },
              }}
            >
              <FaInstagram />
            </IconButton>
          </Stack>

          <Divider sx={{ width: '100%', borderColor: 'black' }} />

          {/* Footer Links */}
          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" useFlexGap>
            <Button
              component={Link}
              href="/terms"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 16,
                px: 2,
                '&:hover': { color: '#00785A', textDecoration: 'underline' },
              }}
            >
              Terms & Conditions
            </Button>
            <Button
              component={Link}
              href="/privacy"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 16,
                px: 2,
                '&:hover': { color: ' #00785A', textDecoration: 'underline' },
              }}
            >
              Privacy Policy
            </Button>
            <Button
              component={Link}
              href="/contact"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 16,
                px: 2,
                '&:hover': { color: ' #00785A', textDecoration: 'underline' },
              }}
            >
              Contact Us
            </Button>
            <Button
              component={Link}
              href="/about"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 16,
                px: 2,
                '&:hover': { color: ' #00785A', textDecoration: 'underline' },
              }}
            >
              About Us
            </Button>
            {isAuthenticated && (
              <Button
                onClick={handleSignOut}
                sx={{
                  textTransform: 'none',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: 16,
                  px: 2,
                  bgcolor: '#2B2B2B',
                  borderRadius: 2,
                  ml: 2,
                  '&:hover': { bgcolor: '#2B2B2B', color: '#fff' },
                }}
              >
                Sign Out
              </Button>
            )}
          </Stack>

          <Typography variant="body2" sx={{ color: 'white', mt: 2, fontWeight: 400, letterSpacing: 1, textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} Champion Footballer. All rights reserved.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
