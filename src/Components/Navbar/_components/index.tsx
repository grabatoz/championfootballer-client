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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import { forwardRef } from 'react';
import type { TransitionProps } from '@mui/material/transitions';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

// Custom SlideFade transition
const SlideFade = forwardRef(function SlideFade(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  const { in: inProp, children, ...other } = props;
  return (
    <Slide direction="down" in={inProp} ref={ref} {...other} timeout={300}>
      <Fade in={inProp} timeout={300}>
        {children ?? <span />}
      </Fade>
    </Slide>
  );
});

export default function NavigationBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, dispatch } = useAuth();
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(profileMenuAnchor);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [gameRulesOpen, setGameRulesOpen] = useState(false);

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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };
  const handleProfileClick = () => {
    handleProfileMenuClose();
    router.push('/profile');
  };
  const handleSignOutClick = () => {
    handleProfileMenuClose();
    handleSignOut();
  };

  const renderNavLinks = () => (
    <>
      <Button
        onClick={() => setHowToPlayOpen(true)}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          color: 'white',
          fontSize: '1rem',
          transition: '0.3s',
          '&:hover': { color: '#43a047' },
        }}
      >
        How to play
      </Button>
      <Button
        onClick={() => setGameRulesOpen(true)}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          color: 'white',
          fontSize: '1rem',
          transition: '0.3s',
          '&:hover': { color: '#43a047' },
        }}
      >
        Game rules
      </Button>
    </>
  );

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
              <>
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#fff',
                    bgcolor: '#43a047',
                    borderRadius: 2,
                    px: 2.5,
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#388e3c',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                  }}
                >
                  Profile
                </Button>
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={openProfileMenu}
                  onClose={handleProfileMenuClose}
                  TransitionComponent={SlideFade}
                  PaperProps={{
                    sx: {
                      bgcolor: '#1f673b',
                      color: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 4px 16px 0 rgba(67,160,71,0.18)',
                      mt: 1.5,
                      minWidth: 140,
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem onClick={handleProfileClick} sx={{ color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#388e3c' } }}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleSignOutClick} sx={{ color: 'red', fontWeight: 600, '&:hover': { bgcolor: '#388e3c', color: '#fff' } }}>
                    Sign out
                  </MenuItem>
                </Menu>
              </>
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
            {isAuthenticated && (
              <ListItem disablePadding>
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    px: 3,
                    py: 1.5,
                    color: '#fff',
                    bgcolor: '#43a047',
                    borderRadius: 2,
                    fontWeight: 600,
                    mb: 1,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#388e3c',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                  }}
                >
                  Profile
                </Button>
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={openProfileMenu}
                  onClose={handleProfileMenuClose}
                  TransitionComponent={SlideFade}
                  PaperProps={{
                    sx: {
                      bgcolor: '#1f673b',
                      color: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 4px 16px 0 rgba(67,160,71,0.18)',
                      mt: 1.5,
                      minWidth: 140,
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem onClick={handleProfileClick} sx={{ color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#388e3c' } }}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleSignOutClick} sx={{ color: 'red', fontWeight: 600, '&:hover': { bgcolor: '#388e3c', color: '#fff' } }}>
                    Sign out
                  </MenuItem>
                </Menu>
              </ListItem>
            )}
            {isAuthenticated && (
              <ListItem disablePadding>
                <Button
                  onClick={() => { setHowToPlayOpen(true); setDrawerOpen(false); }}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', px: 3, py: 1.5, color: 'white' }}
                >
                  <ListItemText primary="How to play" />
                </Button>
              </ListItem>
            )}
            {isAuthenticated && (
              <ListItem disablePadding>
                <Button
                  onClick={() => { setGameRulesOpen(true); setDrawerOpen(false); }}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', px: 3, py: 1.5, color: 'white' }}
                >
                  <ListItemText primary="Game rules" />
                </Button>
              </ListItem>
            )}
            <Divider sx={{ my: 1 }} />
            {/* Old Sign out button removed from here, now in Profile menu */}
          </List>
        </Box>
      </Drawer>
      <Dialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1f673b', color: 'white', fontWeight: 700, fontSize: 22 }}>
          How to play
          <IconButton
            aria-label="close"
            onClick={() => setHowToPlayOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f8fafc', color: '#222', py: 3 }}>
          <Typography variant="body1" sx={{ fontSize:'18px' , fontWeight:'900' , fontFamily:'sans-serif' }}>
            {/* Replace with real content or fetch from CMS if needed */}
           Developing your Player Card
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog open={gameRulesOpen} onClose={() => setGameRulesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1f673b', color: 'white', fontWeight: 700, fontSize: 22 }}>
          Game rules
          <IconButton
            aria-label="close"
            onClick={() => setGameRulesOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f8fafc', color: '#222', py: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#1f673b', fontWeight: 700 }}>Rules</Typography>
          <ul style={{ marginLeft: 20, marginBottom: 16, color: '#222' }}>
            <li>Play fair</li>
            <li>Play safe</li>
            <li>Show respect</li>
            <li>Play as a team</li>
            <li>Commit to play</li>
            <li>Pick balance teams</li>
            <li>Rise to the challenge</li>
            <li>Have fun!</li>
          </ul>
          <Typography variant="h6" sx={{ mb: 1, color: '#1f673b', fontWeight: 700 }}>Characteristics of a champion</Typography>
          <ul style={{ marginLeft: 20, color: '#222' }}>
            <li><b>C</b>ourageous</li>
            <li><b>H</b>opeful</li>
            <li><b>A</b>ppreciative</li>
            <li><b>M</b>odest</li>
            <li><b>P</b>erseverant</li>
            <li><b>I</b>nspired</li>
            <li><b>O</b>ptimistic</li>
            <li><b>N</b>oble</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}