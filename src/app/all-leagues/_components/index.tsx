'use client';

import { useAuth } from '@/lib/hooks';
import { AdminPanelSettings, Close, Delete, ExitToApp, People, X } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, TextField, Typography, Container, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, useTheme, useMediaQuery, Fade, Chip } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';
import { User, League } from '@/types/user';
import { useDispatch } from 'react-redux';
import { joinLeague } from '@/lib/features/leagueSlice';
import { AppDispatch } from '@/lib/store';
import { cacheManager } from '@/lib/cacheManager';
import Tooltip from '@mui/material/Tooltip';
import Slide, { SlideProps } from '@mui/material/Slide';


interface LeagueMembersDialogProps {
  open: boolean
  onClose: () => void
  league: League | null
  currentUserId: string
  onRemoveMember: (memberId: string) => void
  onLeaveLeague: () => void
}



const Transition = React.forwardRef(function Transition(props: SlideProps, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />
})

function LeagueMembersDialog({
  open,
  onClose,
  league,
  currentUserId,
  onRemoveMember,
  onLeaveLeague,
}: LeagueMembersDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  if (!league) return null

  const isAdmin = league.adminId === currentUserId
  const memberCount = league.members.length

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the league?`)) {
      onRemoveMember(memberId)
    }
  }

  const handleLeaveLeague = () => {
    if (window.confirm("Are you sure you want to leave this league?")) {
      onLeaveLeague()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          background: "linear-gradient(135deg, #1f673b 0%, #2e7d32 100%)",
          color: "white",
          borderRadius: isMobile ? 0 : 3,
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(31, 103, 59, 0.3)",
          overflow: "hidden",
          maxHeight: isMobile ? "100vh" : "80vh",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #0a3e1e 0%, #1b5e20 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: { xs: 18, sm: 22 },
          borderRadius: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #43a047, #66bb6a, #43a047)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "rgba(67, 160, 71, 0.2)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <People sx={{ fontSize: { xs: 20, sm: 24 }, color: "#43a047" }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "white",
                fontSize: { xs: 16, sm: 20 },
                lineHeight: 1.2,
              }}
            >
              {league.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: { xs: 12, sm: 14 },
                fontWeight: 500,
              }}
            >
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
              color: "white",
            },
            transition: "all 0.2s ease",
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: "transparent",
          px: 0,
          py: 0,
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(255, 255, 255, 0.1)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(67, 160, 71, 0.5)",
            borderRadius: "3px",
          },
        }}
      >
        <List sx={{ py: 0 }}>
          {league.members.map((member, index) => {
            const memberName = `${member.firstName} ${member.lastName}`
            const isLeagueAdmin = member.id === league.adminId
            const isCurrentUser = member.id === currentUserId

            return (
              <Fade in={true} timeout={300 + index * 100} key={member.id}>
                <Box>
                  <ListItem
                    sx={{
                      py: { xs: 2, sm: 2.5 },
                      px: { xs: 2, sm: 3 },
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      bgcolor: isCurrentUser ? "rgba(67, 160, 71, 0.1)" : "transparent",
                      borderLeft: isCurrentUser ? "4px solid #43a047" : "none",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: { xs: 44, sm: 52 },
                          height: { xs: 44, sm: 52 },
                          bgcolor: isLeagueAdmin ? "#43a047" : "#2e7d32",
                          color: "white",
                          fontWeight: 700,
                          fontSize: { xs: 16, sm: 18 },
                          border: isCurrentUser ? "3px solid #43a047" : "2px solid rgba(255, 255, 255, 0.2)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture || "/placeholder.svg"}
                            alt={memberName}
                            width={48}
                            height={48}
                            style={{ borderRadius: "50%" }}
                          />
                        ) : (
                          `${member.firstName[0]}${member.lastName[0] || ""}`
                        )}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "white",
                              fontSize: { xs: 16, sm: 18 },
                            }}
                          >
                            {memberName}
                          </Typography>
                          {isCurrentUser && (
                            <Chip
                              label="You"
                              size="small"
                              sx={{
                                bgcolor: "#43a047",
                                color: "white",
                                fontWeight: 600,
                                fontSize: 11,
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                          {isLeagueAdmin && <AdminPanelSettings sx={{ fontSize: 16, color: "#43a047" }} />}
                          <Typography
                            sx={{
                              color: isLeagueAdmin ? "#43a047" : "rgba(255, 255, 255, 0.7)",
                              fontWeight: 500,
                              fontSize: { xs: 13, sm: 14 },
                            }}
                          >
                            {isLeagueAdmin ? "League Admin" : "Member"}
                          </Typography>
                        </Box>
                      }
                    />

                    {isAdmin && member.id !== currentUserId && (
                      <Tooltip title={`Remove ${memberName}`} arrow>
                        <IconButton
                          onClick={() => handleRemoveMember(member.id, memberName)}
                          sx={{
                            color: "#ff5252",
                            bgcolor: "rgba(255, 82, 82, 0.1)",
                            "&:hover": {
                              bgcolor: "rgba(255, 82, 82, 0.2)",
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          <Delete sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItem>
                  {index < league.members.length - 1 && (
                    <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", mx: 2 }} />
                  )}
                </Box>
              </Fade>
            )
          })}
        </List>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          background: "linear-gradient(135deg, #0a3e1e 0%, #1b5e20 100%)",
          p: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {!isAdmin && (
          <Button
            startIcon={<ExitToApp />}
            onClick={handleLeaveLeague}
            sx={{
              fontWeight: 600,
              bgcolor: "#fff",
              color: "#d32f2f",
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                bgcolor: "#ffebee",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Leave League
          </Button>
        )}

        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <Button
            onClick={onClose}
            sx={{
              fontWeight: 600,
              color: "#43a047",
              borderColor: "#43a047",
              borderRadius: 2,
              border: "2px solid",
              bgcolor: "white",
              px: 3,
              py: 1,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                bgcolor: "#e8f5e9",
                borderColor: "#43a047",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

const cardStyles = {
  borderRadius: 3,
  p: { xs: 1.5, md: 3 },
  color: 'white',
  background: '#1f673b',
  border: '1px solid rgba(255,255,255,0.18)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.03)',
    boxShadow: '0 8px 32px 0 rgba(31,38,135,0.27)',
  },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 1, md: 1 },
  width: { xs: '100%', md: 'auto' }, // Full width on small screens, auto on large screens for two cards
  minWidth: { xs: '100%', md: '300px' }, // Minimum width on large screens
  boxSizing: 'border-box',
};

const iconButtonStyles = {
  position: 'absolute',
  color: 'white',
  border: '2px solid white',
  borderRadius: 2,
  right: { xs: 0, md: '0' },
  p: { xs: 0.6, md: 1.2 },
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
};

const buttonStyles = {
  base: {
    color: 'white',
    fontWeight: 'bold',
    borderRadius: 2,
    px: { xs: 2, md: 4 },
    py: { xs: 1, md: 1 },
    fontSize: { xs: '0.7rem', md: '0.875rem' },
    textTransform: 'none',
  },
  outlined: {
    bgcolor: '#43a047',
    borderColor: '#43a047',
    '&:hover': { bgcolor: '#388e3c', borderColor: '#388e3c' },
  },
  contained: {
    bgcolor: '#43a047',
    boxShadow: '0 2px 8px rgba(0,200,83,0.12)',
    '&:hover': { bgcolor: '#388e3c' },
  },
};

function AllLeagues() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [, setLoading] = useState(false);
  const router = useRouter();
  const [leagueName, setLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { token, user } = useAuth();
  const [openMembers, setOpenMembers] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [, setLoadingMembers] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [leagueImage, setLeagueImage] = useState<File | null>(null);

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      const result = await dispatch(joinLeague(inviteCode.trim())).unwrap();
      toast.success('Successfully joined the league!');
      setIsJoining(false);
      setInviteCode('');
      
      // Update cache with joined league
      if (result) {
        cacheManager.updateLeaguesCacheOnJoin(result);
        console.log('Updated cache with joined league:', result.name);
      }
      
      fetchUserLeagues();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join league';
      toast.error(errorMessage);
    }
  };

  // Function to update leagues cache with new league
  const updateLeaguesCacheWithNewLeague = useCallback((newLeague: League) => {
    cacheManager.updateLeaguesCache(newLeague);
  }, []);

  const fetchUserLeagues = useCallback(async () => {
    try {
      console.log('Fetching user leagues...');
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Fetched leagues data:', data);

      if (data.success) {
        console.log('Setting leagues:', data.leagues);
        setLeagues(data.leagues || []);
      } else {
        console.error('Failed to fetch leagues:', data.message);
        toast.error(data.message || 'Failed to fetch leagues');
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      toast.error('An error occurred while fetching leagues');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserLeagues();
    }
  }, [token, fetchUserLeagues]);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error('Please enter a league name');
      return;
    }
    setIsCreating(true);
    try {
      console.log('Creating league:', leagueName.trim());
      const formData = new FormData();
      formData.append('name', leagueName.trim());
      if (leagueImage) formData.append('image', leagueImage);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // 'Content-Type' mat lagayen, FormData khud set karega
        },
        body: formData
      });

      const data = await response.json();
      console.log('Create league response:', data);

      if (data.success) {
        console.log('League created successfully, refreshing list...');
        toast.success('League created successfully!');
        setIsDialogOpen(false);
        setLeagueName('');
        setLeagueImage(null);
        
        // Update the leagues cache with the new league
        if (data.league) {
          const newLeague = {
            ...data.league,
            members: [],
            administrators: user ? [user] : [],
            matches: [],
            active: true,
            maxGames: null,
            showPoints: true
          };
          
          // Update cache with new league
          updateLeaguesCacheWithNewLeague(newLeague);
          
          // Update local state
          setLeagues(prevLeagues => [newLeague, ...prevLeagues]);
          console.log('Updated cache and local state with new league:', newLeague);
        }
      } else {
        console.error('Failed to create league:', data.message);
        toast.error(data.message || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      toast.error('An error occurred while creating the league');
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };

  const handleLeagueClick = (leagueId: string) => {
    router.push(`/league/${leagueId}`);
  };

  const handleOpenMembers = async (league: League) => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Find admin (first admin in administrators array)
        const admin = data.league.administrators[0];
        setSelectedLeague({
          ...league,
          adminId: admin?.id,
          members: data.league.members.map((m: User) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            profilePicture: m.profilePicture,
            email: m.email
          })),
        });
        setOpenMembers(true);
      } else {
        toast.error(data.message || 'Failed to fetch league members');
      }
    } catch {
      toast.error('Failed to fetch league members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLeague) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/users/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Refetch members after removal
      handleOpenMembers(selectedLeague);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveLeague = async () => {
    if (!selectedLeague) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOpenMembers(false);
      fetchUserLeagues();
    } catch {
      toast.error('Failed to leave league');
    }
  };
  const handleBackToAllLeagues = () => {
    router.push('/dashboard');
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
        fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowLeft />}
          onClick={handleBackToAllLeagues}
          sx={{
            mb: 2, color: 'white', backgroundColor: '#1f673b',
            '&:hover': { backgroundColor: '#388e3c' },
          }}
        >
          Back to Dashboard
        </Button>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            align="center"
            color="black"
            sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            All Leagues
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="black"
            sx={{ mt: 1 }}
          >
            Manage and join football leagues. Create your own or join with an invite code.
          </Typography>
        </Box>
        <Box sx={{ flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
          <Box sx={{ width: '100%' }}>
            <Paper
              elevation={6}
              sx={{
                background: '#1f673b',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                color: 'white',
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
                border: '1px solid rgba(255,255,255,0.18)',
                mb: 4,
              }}
            >
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Image src={leagueIcon} alt="League" width={40} height={40} />
                <Typography variant="h5" fontWeight="bold">Create or Join League</Typography>
              </Box>


              <Button
                variant="contained"
                fullWidth
                onClick={() => setIsDialogOpen(true)}
                sx={{
                  bgcolor: '#43a047',
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
                  '&:hover': { bgcolor: '#388e3c' },
                  width: '300px'
                }}
              >
                + Create New League
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <TextField
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    flex: 1,
                    maxWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: 1,
                      '& fieldset': { borderColor: '#43a047' },
                      '&:hover fieldset': { borderColor: '#43a047' },
                      '&.Mui-focused fieldset': { borderColor: '#43a047' },
                      '& input': { color: '#222' },
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#222 !important',
                        color: '#222 !important',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#43a047' },
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#43a047',
                    color: 'white',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    mt: 1,
                    '&:hover': { bgcolor: '#388e3c' },
                  }}
                  onClick={handleJoinLeague}
                  disabled={isJoining}
                >
                  <svg className="w-5 h-5 mr-2" fill="white" viewBox="0 0 24 24">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                  </svg>
                  {isJoining ? 'Joining...' : 'Join League'}
                </Button>
              </Box>
            </Paper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
              {leagues.length === 0 ? (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      background: '#1f673b',
                      borderRadius: 3,
                      p: 4,
                      textAlign: 'center',
                      color: '#b0bec5',
                    }}
                  >
                    <Typography variant="h6">No leagues found.</Typography>
                    <Typography variant="body2">Create a new league to get started!</Typography>
                  </Paper>
                </Box>
              ) : (
                leagues.map((league) => (
                  <Paper
                    key={league.id}
                    elevation={4}
                    sx={cardStyles}
                    role="region"
                    aria-label={`League: ${league.name}`}
                  >
                    <Box display="flex" position="relative" alignItems="center" gap={{ xs: 1, md: 2 }} mb={{ xs: 0.5, md: 1 }}>
                      <Image src={leagueIcon} alt={`${league.name} icon`} width={32} height={32} priority />
                      <Typography
                        textTransform="uppercase"
                        variant="h6"
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '0.9rem', md: '1.25rem' } }}
                      >
                        {league.name}
                      </Typography>
                      <IconButton
                        sx={iconButtonStyles}
                        onClick={() => handleOpenMembers(league)}
                        aria-label={`Open settings for ${league.name}`}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="body2"
                      color="white"
                      mb={{ xs: 0.5, md: 1 }}
                      sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}
                    >
                      Invite Code: <span style={{ color: '#43a047', fontWeight: 600 }}>{league.inviteCode}</span>
                    </Typography>
                    <Typography
                      variant="caption"
                      color="white"
                      mb={{ xs: 1, md: 2 }}
                      sx={{ fontSize: { xs: '0.65rem', md: '0.875rem' } }}
                    >
                      Created: {new Date(league.createdAt).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 0.5, md: 1 },
                        mt: { xs: 1, md: 2 },
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'center', md: 'flex-start' },
                      }}
                    >
                      <Button
                        variant="outlined"
                        sx={{ ...buttonStyles.base, ...buttonStyles.outlined }}
                        onClick={() => {
                          if (league.showPoints === false) {
                            toast.error('Points are hidden for this league.');
                            return;
                          }
                          router.push(`/league/${league.id}?tab=table`);
                        }}
                        aria-label={`View table for ${league.name}`}
                      >
                        Table
                      </Button>
                      <Button
                        variant="contained"
                        sx={{ ...buttonStyles.base, ...buttonStyles.contained }}
                        onClick={() => router.push(`/league/${league.id}?tab=awards`)}
                        aria-label={`View awards for ${league.name}`}
                      >
                        Award
                      </Button>
                      <Button
                        variant="contained"
                        sx={{ ...buttonStyles.base, ...buttonStyles.contained }}
                        onClick={() => handleLeagueClick(league.id)}
                        aria-label={`View details for ${league.name}`}
                      >
                        View League
                      </Button>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          </Box>
        </Box>

        {/* Create League Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: '#1f673b',
              border: '2px solid #43a047',
              boxShadow: '0 8px 32px 0 rgba(67,160,71,0.18)',
              p: 2,
              color: '#fff',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
            <DialogTitle sx={{ p: 0, fontWeight: 'bold', color: '#fff', fontSize: 22, letterSpacing: 0.5 }}>
              Create a League
            </DialogTitle>
            <IconButton onClick={() => setIsDialogOpen(false)} sx={{ color: '#fff' }}>
              <X />
            </IconButton>
          </Box>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="League Name"
              type="text"
              fullWidth
              variant="outlined"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateLeague();
                }
              }}
              sx={{
                mt: 1,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: '#1f673b',
                  color: '#fff',
                  borderRadius: 2,
                  border: '1.5px solid #43a047',
                  '& fieldset': {
                    borderColor: '#43a047',
                  },
                  '&:hover fieldset': {
                    borderColor: '#388e3c',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#43a047',
                  },
                  '& input': {
                    color: '#fff',
                  },
                },
                '& label': {
                  color: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: '#fff',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#fff',
                },
              }}
              InputLabelProps={{ sx: { color: '#fff' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCreateLeague}
              variant="contained"
              disabled={isCreating || !leagueName.trim()}
              sx={{
                bgcolor: '#43a047',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
                px: 3,
                boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                '&:hover': { bgcolor: '#388e3c' },
              }}
            >
              {isCreating ? 'Creating...' : 'Create League'}
            </Button>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outlined"
              sx={{
                color: '#fff',
                border: '1.5px solid #43a047',
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'rgba(67,160,71,0.08)' },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Toaster position="top-center" reverseOrder={false} />
      <LeagueMembersDialog
        open={openMembers}
        onClose={() => setOpenMembers(false)}
        league={selectedLeague}
        currentUserId={user?.id || ''}
        onRemoveMember={handleRemoveMember}
        onLeaveLeague={handleLeaveLeague}
      />
    </Box>
  )
}

export default AllLeagues;