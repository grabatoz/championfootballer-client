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
  Badge,
  Popover,
  Divider,
  // Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, initializeFromStorage, forceLogout } from '@/lib/features/authSlice';
import cflogo from '@/Components/images/champion football logo 3.png';
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
import playercardupdate from '@/Components/images/playercardupdate.png';
import leagueimg from '@/Components/images/leagueimg.png';
import progressimg from '@/Components/images/progressimg.png';
import leaguesetting from '@/Components/images/leaguesetting.png';
import matchdetails from '@/Components/images/matchdetails.png';
import palyerstats from '@/Components/images/palyerstats.png';
import player from '@/Components/images/profile-user.png'
import play from '@/Components/images/play.png'
import gamification from '@/Components/images/gamification.png'
import logoutpic from '@/Components/images/logout.png'
import { useAuth } from '@/lib/hooks';


// Notification interface
type NotificationKind =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'TEAM_SELECTION'
  | 'AVAILABILITY_REMINDER'
  | 'RESULT_PUBLISHED'
  | 'GENERAL';

interface NotificationMeta {
  matchId?: string;
  leagueId?: string;
  playerId?: string;
  // extra arbitrary key/value if backend sends more
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: NotificationKind;
  title: string;
  body: string;
  meta?: NotificationMeta;
  read: boolean;
  created_at: string;
}

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
  const { isAuthenticated, dispatch, token, user } = useAuth(); // 🔥 MOVED HERE - GET ALL VALUES AT COMPONENT LEVEL
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(profileMenuAnchor);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [gameRulesOpen, setGameRulesOpen] = useState(false);
  const pathname = usePathname();

  // 🔥 NOTIFICATION STATES
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const openNotifications = Boolean(notificationAnchor);

  // 🔥 REMOVED DUPLICATE useAuth CALLS - NOW USING COMPONENT LEVEL VALUES

  // 🔥 UPDATED FETCH NOTIFICATIONS - USE COMPONENT LEVEL TOKEN
  const fetchNotifications = async (showLogs?: boolean) => {
    try {
      setLoading(true);
      
      if (showLogs) {
        console.log('🔔 Fetching notifications...');
        console.log('🔍 Auth state:', { 
          token: token ? 'Available' : 'Missing', 
          isAuthenticated, 
          userId: user?.id 
        });
      }
      
      if (!token) {
        if (showLogs) {
          console.log('❌ No token available from useAuth hook');
        }
        return;
      }
      
      const userId = user?.id;
      if (!userId) {
        if (showLogs) {
          console.log('❌ No user ID available from useAuth hook');
        }
        return;
      }
      
      if (showLogs) {
        console.log('✅ Using token:', token.substring(0, 20) + '...');
        console.log('✅ Using userId:', userId);
      }

      const response = await fetch(`http://localhost:5000/notifications?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 USE COMPONENT LEVEL TOKEN
        }
      });
      
      if (showLogs) {
        console.log('🔔 API Response Status:', response.status);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          if (showLogs) {
            console.log('❌ Unauthorized - token might be expired');
            console.log('🔍 Token used:', token.substring(0, 20) + '...');
          }
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (showLogs) {
        console.log('🔔 Notifications Data:', data);
      }
      
      if (data.success) {
        const notificationList = data.notifications || [];
        setNotifications(notificationList);
        
        const unread = notificationList.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
        
        if (showLogs) {
          console.log(`📊 Total: ${notificationList.length}, Unread: ${unread}`);
        }
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    await fetchNotifications(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 🔥 FIXED: Use component level token instead of calling useAuth inside function
  const markAsRead = async (notificationId: string) => {
    try {
      console.log(`📖 Marking notification ${notificationId} as read`);
      
      // 🔥 REMOVED: const { token } = useAuth(); - USING COMPONENT LEVEL TOKEN
      
      if (!token) {
        console.log('❌ No token found for markAsRead');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 USE COMPONENT LEVEL TOKEN
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('✅ Notification marked as read');
      } else {
        console.error('❌ Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // 🔥 FIXED: Use component level token and user instead of calling useAuth inside function
  const markAllAsRead = async () => {
    try {
      console.log('📖 Marking all notifications as read');
      
      // 🔥 REMOVED: const { token } = useAuth(); - USING COMPONENT LEVEL TOKEN
      const userId = user?.id; // 🔥 USE COMPONENT LEVEL USER
      
      if (!token || !userId) {
        console.log('❌ No token or user ID found for markAllAsRead');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/notifications/read-all?userId=${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 USE COMPONENT LEVEL TOKEN
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        console.log('✅ All notifications marked as read');
      } else {
        console.error('❌ Failed to mark all notifications as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // 🔥 HELPER FUNCTION - KEEP FOR BACKWARD COMPATIBILITY
  // const getUserId = () => {
  //   // Use component level user first, fallback to localStorage
  //   if (user?.id) {
  //     return user.id;
  //   }
    
  //   try {
  //     const localUser = localStorage.getItem('user');
  //     if (localUser) {
  //       const parsedUser = JSON.parse(localUser);
  //       return parsedUser.id;
  //     }
  //   } catch (e) {
  //     console.error('Error getting user ID:', e);
  //   }
  //   return null;
  // };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('🔔 Notification bell clicked');
    setNotificationAnchor(event.currentTarget);
    // Fetch fresh notifications when opening
    fetchNotifications(true);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  useEffect(() => {
    setMounted(true);
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // 🔥 FETCH NOTIFICATIONS ON MOUNT AND POLL
  useEffect(() => {
    if (isAuthenticated && token && user?.id) { // 🔥 ADDED TOKEN AND USER CHECK
      console.log('✅ User authenticated with token, starting notification system...');
      fetchNotifications(true);
      
      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      return () => {
        console.log('🛑 Clearing notification interval...'); 
        clearInterval(interval);
      };
    } else {
      console.log('❌ User not authenticated or missing token/user, skipping notifications');
      // Clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, user?.id]); // 🔥 ADDED TOKEN AND USER ID TO DEPENDENCY ARRAY

  const handleSignOut = async () => {
    try {
      await dispatch(logout()).unwrap();
      // Clear notifications on logout
      setNotifications([]);
      setUnreadCount(0);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API fails
      dispatch(forceLogout());
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

  const navItems: { label: string; href: string }[] = [
    { label: 'Leagues', href: '/all-leagues' },
    { label: 'Matches', href: '/all-matches' },
    { label: 'Dream Team', href: '/dream-team' },
    { label: 'Player', href: '/all-players' },
    { label: 'Trophy Room', href: '/trophy-room' },
    { label: 'Leaderboard', href: '/leader-board' },
  ];

  const renderNavLinks = () => (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: { xs: 0.5, md: 1 },
      flexWrap: 'nowrap',
      overflow: 'hidden',
      justifyContent: 'flex-end'      // ✅ push links to the right inside this box
    }}>
      {navItems.map(({ label, href }) => {
        const active = pathname?.startsWith(href);
        return (
          <Button
            key={href}
            component={Link}
            href={href}
            aria-current={active ? 'page' : undefined}
            disableRipple
            sx={{
              textTransform: 'none',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontWeight: 700,
              color: '#fff',
              fontSize: { xs: '12px', sm: '9px', md: '13px', lg: '13px' },
              px: { xs: 0.5, sm: 0.50, md: 1, lg: 1 },
              py: { xs: 1, md: 1.25 },
              minWidth: 'auto',
              position: 'relative',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              borderRadius: 1,
              '&:hover': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                bottom: -6,
                height: '3px',
                width: active ? '80%' : 0,
                transform: 'translateX(-50%)',
                backgroundColor: '#fff',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
                boxShadow: active ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
              },
              '&:hover::after': {
                width: '80%',
                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
              },
              '&:focus-visible': {
                outline: '2px solid #fff',
                outlineOffset: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              // Active state styling
              ...(active && {
                backgroundColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }),
            }}
          >
            {label}
          </Button>
        );
      })}
    </Box>
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
        sx={{
          background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
          boxShadow: 3,
          px: { xs: 1, sm: 2, md: 2 }
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          minHeight: { xs: '60px', md: '70px' },
          gap: { xs: 1, md: 2 }
        }}>
          {/* LOGO SECTION */}
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Box sx={{ 
              width: { xs: 180, sm: 220, md: 280, lg: 350 }, 
              display: 'flex' 
            }}>
              <Image
                src={cflogo}
                alt="Champion Footballer Logo"
                width={350}
                height={40}
                priority
                style={{
                  height: '40px',
                  width: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Link>

          {/* DESKTOP NAVIGATION (moved to right) */}
          <Box sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            ml: 'auto',              // ✅ push whole nav group to the right
            // pr: 2,                   // optional padding right
            // gap: 1
          }}>
            {isAuthenticated && renderNavLinks()}
          </Box>

          {/* RIGHT SIDE CONTROLS */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 0.5, md: 1 },
            flexShrink: 0
          }}>
            {isAuthenticated && (
              <>
                {/* NOTIFICATION BELL - DESKTOP */}
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{
                    color: '#fff',
                    display: { xs: 'none', lg: 'flex' },
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error" 
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                {/* PROFILE BUTTON - DESKTOP */}
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    textTransform: 'none',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 'bold',
                    color: '#fff',
                    bgcolor: '#2B2B2B',
                    borderRadius: 2,
                    px: 2.5,
                    fontSize: '14px',
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#2B2B2B',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                  }}
                >
                  Profile
                </Button>

                {/* MOBILE CONTROLS */}
                <Box sx={{ 
                  display: { xs: 'flex', lg: 'none' }, 
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {/* MOBILE NOTIFICATION BELL */}
                  <IconButton
                    onClick={handleNotificationClick}
                    sx={{
                      color: '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error" 
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
                        }
                      }}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>

                  {/* MOBILE MENU BUTTON */}
                  <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    onClick={() => setDrawerOpen(true)}
                    sx={{ 
                      color: '#fff',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                      }
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>

                {/* PROFILE MENU */}
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={openProfileMenu}
                  onClose={handleProfileMenuClose}
                  TransitionComponent={SlideFade}
                  PaperProps={{
                    sx: {
                      p: 0.5,
                      mt: 1.5,
                      minWidth: 200,
                      bgcolor: 'rgba(15,15,15,0.92)',
                      color: '#E5E7EB',
                      borderRadius: 2.5,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                      overflow: 'hidden',
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem
                    onClick={handleProfileClick}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={player} alt="profile" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>Profile</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setHowToPlayOpen(true); handleProfileMenuClose(); }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={play} alt="how to play" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>How to play</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setGameRulesOpen(true); handleProfileMenuClose(); }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={gamification} alt="rules" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>Game rules</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={handleSignOutClick}
                    sx={{
                      color: '#F87171',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(239,68,68,0.25), rgba(239,68,68,0.10))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={logoutpic} alt="sign out" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>Sign out</Box>
                    </Box>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* NOTIFICATION POPOVER - ENHANCED */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 8,
          sx: {
            width: { xs: 320, sm: 380 },
            maxHeight: 400,
            bgcolor: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
            Notifications {notifications.length > 0 && `(${notifications.length})`}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* REFRESH BUTTON */}
            <IconButton
              onClick={handleRefreshNotifications}
              disabled={isRefreshing}
              size="small"
              sx={{ 
                color: '#1976d2',
                '&:hover': { bgcolor: 'rgba(25,118,210,0.04)' },
                '&:disabled': { color: '#ccc' }
              }}
              title="Refresh notifications"
            >
              <RefreshIcon 
                fontSize="small" 
                sx={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
            </IconButton>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                size="small"
                sx={{ 
                  color: '#1976d2', 
                  fontSize: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(25,118,210,0.04)' }
                }}
              >
                Mark all read
              </Button>
            )}
            <IconButton
              onClick={handleNotificationClose}
              size="small"
              sx={{ color: '#666' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#666' }}>
              <RefreshIcon sx={{ fontSize: 32, color: '#ccc', mb: 1, animation: 'spin 1s linear infinite' }} />
              <Typography>Loading notifications...</Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#666' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography>No notifications yet</Typography>
              <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                Create a match to test notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <Box key={notification.id}>
                <Box
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  sx={{
                    p: 2,
                    cursor: notification.read ? 'default' : 'pointer',
                    bgcolor: notification.read ? '#fff' : '#f8f9ff',
                    borderLeft: notification.read ? 'none' : '4px solid #1976d2',
                    '&:hover': { bgcolor: notification.read ? '#f9f9f9' : '#f0f4ff' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.read ? 500 : 700,
                          color: '#333',
                          mb: 0.5,
                          fontSize: '14px'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '13px',
                          lineHeight: 1.4,
                          mb: 1
                        }}
                      >
                        {notification.body}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#999',
                          fontSize: '11px'
                        }}
                      >
                        {new Date(notification.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    {!notification.read && (
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: '#1976d2', 
                          borderRadius: '50%',
                          mt: 0.5,
                          flexShrink: 0
                        }} 
                      />
                    )}
                  </Box>
                </Box>
                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))
          )}
        </Box>
      </Popover>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ mt: 2, px: 2 }}>
          <List>
            {/* PROFILE BUTTON IN MOBILE DRAWER */}
            {isAuthenticated && (
              <ListItem disablePadding>
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 'bold',
                    color: '#fff',
                    bgcolor: '#2B2B2B',
                    borderRadius: 2,
                    px: 3,
                    py: 1.25,
                    fontSize: '14px',
                    justifyContent: 'flex-start',
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                    mb: 1,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#2B2B2B',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                    '& .MuiButton-startIcon': { marginRight: 1 },
                  }}
                >
                  Profile
                </Button>
              </ListItem>
            )}
            
            {/* MOBILE NAVIGATION LINKS */}
            {isAuthenticated && (
              navItems.map(({ label, href }) => {
                const active = pathname?.startsWith(href);
                return (
                  <ListItem key={href} disablePadding>
                    <Button
                      component={Link}
                      href={href}
                      fullWidth
                      onClick={() => setDrawerOpen(false)}
                      disableRipple
                      sx={{
                        justifyContent: 'flex-start',
                        px: 3,
                        py: 1.5,
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { 
                          background: 'rgba(255,255,255,0.12)',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ListItemText primary={label} sx={{ color: '#fff' }} />
                    </Button>
                  </ListItem>
                );
              })
            )}
          </List>
        </Box>
      </Drawer>

      {/* YOUR EXISTING DIALOGS - keeping them as they were */}
      <Dialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          bgcolor: '#1f673b',
          color: 'white',
          fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '24px', md: '32px' }
        }}>
          How to Play
          <IconButton
            aria-label="close"
            onClick={() => setHowToPlayOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ color: '#222', mt: 2 }}>
          {/* Step 1: Player Card */}
          <Typography variant="h6" sx={{
            fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '24px', md: '32px' },
            mb: 2
          }}>
            1. Set Up Your Player Card
          </Typography>
          <Typography variant="body1" sx={{
            mb: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: { xs: '16px', md: '18px' }
          }}>
            After registering, your Player Card stats will be set to zero by default. Before joining a match, update your Player Card by adjusting your skill levels using the sliders. These stats help balance teams and improve match predictions.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={playercardupdate.src} alt='Player Card Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          {/* Step 2: Join or Create a League */}
          <Typography variant="h6" sx={{
            fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '24px', md: '32px' },
            mb: 2
          }}>
            2. Join or Create a League
          </Typography>
          <Typography variant="body1" sx={{
            mb: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: { xs: '16px', md: '18px' }
          }}>
            To play matches, you need to be part of a league. You can join an existing league using an <b>invite code</b> or the <b>join league</b> link. To create your own league, click the <b>Create New League</b> button on the home page and enter a league name.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={leagueimg.src} alt='League Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            If you are in multiple leagues, the all league among them will be displayed as your primary league in the Join League section.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            By default, once you have created a new league you will be assigned as league<b> admin</b>. The league admin will be given full control over selecting teams, creating new matches and adding in match scores. You can always switch the league admin anytime with another player in the same league by going through the league setting option
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={leaguesetting.src} alt='leaguesetting' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            In the league setting as the league admin, it is good practice to enter the total number of matches to be played in the league. Once you have reached the maximum number of games in the league, virtual awards will be finalised on the home page.
          </Typography>
          {/* Step 3: Play Matches & Track Progress */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            3. Play Matches & Track Progress
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Once you’re in a league, you can join scheduled matches, view your stats, and see your progress on the leaderboard and trophy room. Keep your Player Card updated for the best experience!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Replace progressimg with your actual image import */}
            <Image src={progressimg.src} alt='Progress Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          {/* Step 4: Earn XP & Win Awards */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            4. Earn XP & Win Awards
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You earn XP (Experience Points) for your performance in matches:
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Win: 30 XP &nbsp;|&nbsp; Draw: 15 XP &nbsp;|&nbsp; Loss: 10 XP</li>
              <li>Goal: 3 XP (win), 2 XP (loss)</li>
              <li>Assist: 2 XP (win), 1 XP (loss)</li>
              <li>Clean Sheet (GK): 5 XP</li>
              <li>Man of the Match: 10 XP (win), 5 XP (loss)</li>
              <li>Special Achievements: Extra XP for milestones (e.g., hat-trick, win streaks, etc.)</li>
            </ul>
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`At the end of each league, top performers win special awards`}:<br />
            <b>Champion Footballer</b> {`(1st place),`} <b>{`Runner-Up`}</b> {`(2nd place),`} <b>{`Ballon d'Or`}</b>{` (most MOTM),`} <b>GOAT</b> {`(highest win ratio),`} <b>Golden Boot</b> {`(most goals),`} <b>King Playmaker</b> {`(most assists),`} <b>Legendary Shield</b> {`(best defender/goalkeeper), and `}<b>The Dark Horse</b> {`(outside top 3, most MOTM votes)`}.
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            5. Creating Matches and Selecting Teams
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            As a league admin you can create matches and select teams.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`To create a new match, select `}<b>Matches</b> {`> click on to`} <b>Schedule New Match </b>{`and enter the relevant match details >`} <b>Schedule Match</b>{`. The new match will be visible to all players in the league. `}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`Players can select their availability to play the match by logging in to their home page > click on to`} Matches {`>`}<b> Mark yourself as available</b>.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Replace progressimg with your actual image import */}
            <Image src={matchdetails.src} alt='Progress Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            6. League Table
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Once a match has been played and scores has been uploaded by the league admin, players on the <b>winning</b> team will be allocated 3 points and 1 for drawing. All players can view match results. The player with the most matches won in a league becomes the <b>Champion Footballer</b>.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`You can track each player’s game stats by clicking onto player name from league table. `}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Replace progressimg with your actual image import */}
            <Image src={palyerstats.src} alt='Progress Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            7. League Admin
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            League admin will have a slightly different view on Champion Football to the rest of the players in the league. League admin can be interchangeable between league players.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The league admin will act as the league manager and will be passed on the responsibility to keep the league running by creating matches, selecting teams, adding scores.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The league admin can alter changes to the league such as league/team names, number of games to be played
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog open={gameRulesOpen} onClose={() => setGameRulesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          bgcolor: '#1f673b',
          color: 'white',
          fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '24px', md: '32px' }
        }}>
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
            <li style={{ listStyleType: 'disc' }}>Play fair</li>
            <li style={{ listStyleType: 'disc' }}>Play safe</li>
            <li style={{ listStyleType: 'disc' }}>Show respect</li>
            <li style={{ listStyleType: 'disc' }}>Play as a team</li>
            <li style={{ listStyleType: 'disc' }}>Commit to play</li>
            <li style={{ listStyleType: 'disc' }}>Pick balance teams</li>
            <li style={{ listStyleType: 'disc' }}>Rise to the challenge</li>
            <li style={{ listStyleType: 'disc' }}>Have fun!</li>
          </ul>
          <Typography variant="h6" sx={{ mb: 1, color: '#1f673b', fontWeight: 700 }}>Characteristics of a champion</Typography>
          <ul style={{ marginLeft: 20, color: '#222', fontSize: '1.1rem' }}>
            <li><span style={{ fontWeight: 900 }}>C</span>ourageous</li>
            <li><span style={{ fontWeight: 900 }}>H</span>opeful</li>
            <li><span style={{ fontWeight: 900 }}>A</span>ppreciative</li>
            <li><span style={{ fontWeight: 900 }}>M</span>odest</li>
            <li><span style={{ fontWeight: 900 }}>P</span>erseverant</li>
            <li><span style={{ fontWeight: 900 }}>I</span>nspired</li>
            <li><span style={{ fontWeight: 900 }}>O</span>ptimistic</li>
            <li><span style={{ fontWeight: 900 }}>N</span>oble</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

// LOGIN SUCCESS - ADD TOKEN STORAGE
// const handleLoginSuccess = (response: any) => {
//   // Store user data (already happening)
//   localStorage.setItem('user', JSON.stringify(response.data.user));
//   localStorage.setItem('userData', JSON.stringify(response.data.userData));
  
//   // 🔥 ADD TOKEN STORAGE - CHECK RESPONSE STRUCTURE
//   if (response.data.token) {
//     localStorage.setItem('token', response.data.token);
//     console.log('✅ Token stored:', response.data.token.substring(0, 20) + '...');
//   } else if (response.data.accessToken) {
//     localStorage.setItem('token', response.data.accessToken);
//     console.log('✅ Access Token stored:', response.data.accessToken.substring(0, 20) + '...');
//   } else if (response.token) {
//     localStorage.setItem('token', response.token);
//     console.log('✅ Response Token stored:', response.token.substring(0, 20) + '...');
//   } else {
//     console.error('❌ No token found in login response!');
//     console.log('🔍 Login Response Structure:', response);
//   }
// };