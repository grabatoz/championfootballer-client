'use client';

import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { logout, initializeFromStorage } from '@/lib/features/authSlice';
import cflogo from '@/Components/images/logo.png';

export default function NavigationBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, dispatch } = useAuth();

  useEffect(() => {
    setMounted(true);
    dispatch(initializeFromStorage());
  }, [dispatch]);

  const handleSignOut = async () => {
    try {
      await dispatch(logout());
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinks = [
    { label: 'How to play', href: '/how-to-play' },
    { label: 'Game rules', href: '/game-rules' },
  ];

  const renderNavLinks = () =>
    navLinks.map((link) => (
      <Button
        key={link.href}
        component={Link}
        href={link.href}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          color: 'white',
          fontSize: '1rem',
          transition: '0.3s',
          '&:hover': { color: '#1976d2' },
        }}
      >
        {link.label}
      </Button>
    ));

  if (!mounted) {
    return (
      <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 2 }}>
        <Toolbar>
          <Box sx={{ height: 40, width: 120, bgcolor: '#e0e0e0', borderRadius: 1 }} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar
        position="static"
        sx={{ backgroundColor: '#0a3e1e', boxShadow: 3, px: { xs: 2, md: 6 } }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '70px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src={cflogo}
              alt="Champion Footballer Logo"
              width={140}
              height={40}
              className="w-auto"
              priority
              unoptimized
            />
          </Link>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            {isAuthenticated && renderNavLinks()}
            {isAuthenticated && (
              <Button
                onClick={handleSignOut}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'red',
                  fontSize: '1rem',
                  '&:hover': { color: '#b71c1c' },
                }}
              >
                Sign out
              </Button>
            )}
          </Box>

          {isAuthenticated && (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { md: 'none' }, color: '#fff' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 260,
            backgroundColor: '#0a3e1e',
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ mt: 2 }}>
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.href} disablePadding>
                <Button
                  component={Link}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', px: 3, py: 1.5, color: 'white' }}
                >
                  <ListItemText primary={link.label} />
                </Button>
              </ListItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <Button
                onClick={() => {
                  handleSignOut();
                  setDrawerOpen(false);
                }}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  px: 3,
                  py: 1.5,
                  color: '#d32f2f',
                  fontWeight: 600,
                }}
              >
                <ListItemText primary="Sign out" />
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}