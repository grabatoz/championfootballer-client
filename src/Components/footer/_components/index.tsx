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

  // Optional: configure your store URLs via env
  const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#';
  const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '#';
  // const APP_LANDING_URL = process.env.NEXT_PUBLIC_APP_LANDING_URL || 'https://championfootballer.com/app';
  // const QR_IMAGE_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(APP_LANDING_URL)}`;

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
      py: { xs: 3, md: 5 },
      background: 'linear-gradient(90deg, #727272 0%, #3b3b3b 50%, #020202 100%)',
      color: 'white',
      boxShadow: '0 -2px 24px 0 rgba(30, 58, 138, 0.12)',
     
    }}>
       {/* Deleted App Download Section */}
      <Container maxWidth="md">
        <Stack spacing={3} alignItems="center" justifyContent="center">
          {/* App download section */}
         

          {/* Social Icons */}
          <Stack direction="row" spacing={4}>
            <IconButton
              component="a"
              href="https://x.com/champf2baller"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                color: 'white',
                bgcolor: '#00A77F',
                width: 36,
                height: 36,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#008f6d', color: '#fff' },
              }}
            >
              <FaXTwitter size={18} />
            </IconButton>
            <IconButton
              component="a"
              href="https://www.instagram.com/champf2baller/"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                color: '#fff',
                bgcolor: '#00A77F',
                width: 36,
                height: 36,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#008f6d', color: '#fff' },
              }}
            >
              <FaInstagram size={20} />
            </IconButton>
          </Stack>

          <Divider sx={{ width: '60%', borderColor: '#00A77F', borderBottomWidth: 2 }} />

          {/* Footer Links */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center" useFlexGap>
            <Button
              component={Link}
              href="/terms"
              disableRipple
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 18,
                px: 2,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              Terms & Conditions
            </Button>
            <Button
              component={Link}
              href="/privacy"
              disableRipple
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 18,
                px: 2,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              Privacy Policy
            </Button>
            <Button
              component={Link}
              href="/contact"
              disableRipple
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 18,
                px: 2,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              Contact Us
            </Button>
            <Button
              component={Link}
              href="/about"
              disableRipple
              sx={{
                textTransform: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: 18,
                px: 2,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              About Us
            </Button>
            <Button
              onClick={handleSignOut}
              sx={{
                textTransform: 'none',
                color: '#fff',
                fontWeight: 500,
                fontSize: 16,
                p: 0,
                width: '100px',
                height: '35px',
                bgcolor: '#00A77F',
                borderRadius: 1.5,
                ml: 2,
                '&:hover': { bgcolor: '#008f6d', color: '#fff' },
              }}
            >
              Sign Out
            </Button>
          </Stack>

          <Typography variant="body2" sx={{ color: 'white', mt: 3, fontSize: '15px', fontWeight: 450, letterSpacing: 1, textAlign: 'center' }}>
             {new Date().getFullYear()} Champion Footballer. All rights reserved.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
