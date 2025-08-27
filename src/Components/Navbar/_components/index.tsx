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
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { logout, initializeFromStorage } from '@/lib/features/authSlice';
// import cflogo from '@/Components/images/logo.png';
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
import CloseIcon from '@mui/icons-material/Close';
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
  const pathname = usePathname();

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

  const navItems: { label: string; href: string }[] = [
    { label: 'Leagues', href: '/all-leagues' },
    { label: 'Matches', href: '/all-matches' },
    { label: 'Dream Team', href: '/dream-team' },
    { label: 'Player', href: '/all-players' },
    { label: 'Trophy Room', href: '/trophy-room' },
    { label: 'Leaderboard', href: '/leader-board' },
  ];

  const renderNavLinks = () => (
    <>
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
              color: active ? '#00a77f' : '#fff',
              fontSize: { xs: '14px', md: '16px' },
              px: 1.25,
              mx: 0.5,
              position: 'relative',
              transition: 'color .2s ease',
              '&:hover': { color: '#fff', backgroundColor: 'transparent' },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -6,
                height: '2px',
                width: active ? '100%' : 0,
                margin: '0 auto',
                backgroundColor: '#fff',
                transition: 'width .25s ease',
              },
              '&:hover::after': {
                width: '100%',
              },
              '&:focus-visible': {
                outline: '2px solid #00a77f',
                outlineOffset: 2,
              },
            }}
          >
            {label}
          </Button>
        );
      })}
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
        sx={{
          // background: '#00A77F',
          background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
          boxShadow: 3,
          px: { xs: 2, md: 2 }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '70px' }}>
          <Link href="/home" style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src={cflogo}
              alt="Champion Footballer Logo"
              width={200}
              height={40}
              className="w-auto"
              priority
            // unoptimized
            />
          </Link>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {isAuthenticated && renderNavLinks()}
            {isAuthenticated && (
              <>
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  sx={{
                    textTransform: 'none',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 'bold',
                    color: '#fff',
                    bgcolor: '#2B2B2B',
                    borderRadius: 2,
                    px: 2.5,
                    fontSize: { xs: '14px', md: '16px' },
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
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={openProfileMenu}
                  onClose={handleProfileMenuClose}
                  TransitionComponent={SlideFade}
                  PaperProps={{
                    sx: {
                      bgcolor: '#fff',
                      color: 'black',
                      borderRadius: 2,
                      boxShadow: '0 4px 16px 0 rgba(67,160,71,0.18)',
                      mt: 1.5,
                      minWidth: 140,
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem
                    onClick={handleProfileClick}
                    sx={{ color: 'black', fontWeight: 500, '&:hover': { bgcolor: '#00a77f', color: 'white' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={player} alt="profile" width={20} height={20} />
                      <Box>Profile</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setHowToPlayOpen(true); handleProfileMenuClose(); }}
                    sx={{ color: 'black', fontWeight: 500, '&:hover': { bgcolor: '#00a77f', color: 'white' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={play} alt="how to play" width={20} height={20} />
                      <Box>How to play</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setGameRulesOpen(true); handleProfileMenuClose(); }}
                    sx={{ color: 'black', fontWeight: 500, '&:hover': { bgcolor: '#00a77f', color: 'white' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={gamification} alt="rules" width={20} height={20} />
                      <Box>Game rules</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={handleSignOutClick}
                    sx={{ color: 'red', fontWeight: 600, '&:hover': { bgcolor: '#00a77f', color: '#fff' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={logoutpic} alt="sign out" width={20} height={20} />
                      <Box>Sign out</Box>
                    </Box>
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
            background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
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
                    bgcolor: '#2b2b2b',
                    borderRadius: 2,
                    fontWeight: 600,
                    mb: 1,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#2b2b2b',
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
                      bgcolor: '#fff',
                      color: 'black',
                      borderRadius: 2,
                      boxShadow: '0 4px 16px 0 rgba(67,160,71,0.18)',
                      mt: 1.5,
                      minWidth: 140,
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem onClick={handleProfileClick} sx={{ color: '#000000', fontWeight: 500, '&:hover': { bgcolor: '#00a77f' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={player} alt="profile" width={20} height={20} />
                      <Box>Profile</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={() => { setHowToPlayOpen(true); handleProfileMenuClose(); }} sx={{ color: '#000000', fontWeight: 500, '&:hover': { bgcolor: '#00a77f' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={play} alt="how to play" width={20} height={20} />
                      <Box>How to play</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={() => { setGameRulesOpen(true); handleProfileMenuClose(); }} sx={{ color: '#000000', fontWeight: 500, '&:hover': { bgcolor: '#00a77f' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={gamification} alt="rules" width={20} height={20} />
                      <Box>Game rules</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={handleSignOutClick} sx={{ color: 'red', fontWeight: 600, '&:hover': { bgcolor: '#00a77f', color: '#fff' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={logoutpic} alt="sign out" width={20} height={20} />
                      <Box>Sign out</Box>
                    </Box>
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