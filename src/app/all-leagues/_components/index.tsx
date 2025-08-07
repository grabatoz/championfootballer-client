'use client';

import { useAuth } from '@/lib/hooks';
import { AdminPanelSettings, Close, Delete, ExitToApp, People, X, CloudUpload } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography, Container, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, useTheme, useMediaQuery, Fade, Chip, CircularProgress } from '@mui/material'
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

// Helper function to format league name
const formatLeagueName = (name: string): string => {
  if (!name) return '';

  // Capitalize first letter of the name
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  // Get first letter of each word and join them
  const words = name.split(' ');
  const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

  // Return formatted name with initials in brackets
  return `${capitalizedName} (${initials})`;
};


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
              {formatLeagueName(league.name)}
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
                      {member.profilePicture ? (

                        <Avatar
                          src={member.profilePicture || "/assets/placeholder.svg"}
                          sx={{
                            width: { xs: 44, sm: 52 },
                            height: { xs: 44, sm: 52 },
                            // bgcolor: isLeagueAdmin ? "#43a047" : "#2e7d32",
                            color: "white",
                            fontWeight: 700,
                            fontSize: { xs: 16, sm: 18 },
                            border: isCurrentUser ? "3px solid #43a047" : "2px solid rgba(255, 255, 255, 0.2)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                          }}
                        />
                      ) : (
                        `${member.firstName[0]}${member.lastName[0] || ""}`
                      )}
                      {/* <img
                            src={member.profilePicture || "/placeholder.svg"}
                            alt={memberName}
                            width={52}
                            height={52}
                            style={{ borderRadius: "50%" }}
                          />
                       
                      </Avatar> */}
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

// const cardStyles = {
//   borderRadius: 3,
//   p: { xs: 1.5, md: 3 },
//   color: 'white',
//   background: '#1f673b',
//   border: '1px solid rgba(255,255,255,0.18)',
//   transition: 'transform 0.2s, box-shadow 0.2s',
//   '&:hover': {
//     transform: 'translateY(-4px) scale(1.03)',
//     boxShadow: '0 8px 32px 0 rgba(31,38,135,0.27)',
//   },
//   display: 'flex',
//   flexDirection: 'column',
//   gap: { xs: 1, md: 1 },
//   width: { xs: '100%', md: 'auto' }, // Full width on small screens, auto on large screens for two cards
//   minWidth: { xs: '100%', md: '300px' }, // Minimum width on large screens
//   boxSizing: 'border-box',
// };

// const iconButtonStyles = {
//   position: 'absolute',
//   color: 'white',
//   border: '2px solid white',
//   borderRadius: 2,
//   right: { xs: 0, md: '0' },
//   p: { xs: 0.6, md: 1.2 },
//   '&:hover': {
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
// };

// const buttonStyles = {
//   base: {
//     color: 'white',
//     fontWeight: 'bold',
//     borderRadius: 2,
//     px: { xs: 2, md: 4 },
//     py: { xs: 1, md: 1 },
//     fontSize: { xs: '0.7rem', md: '0.875rem' },
//     textTransform: 'none',
//   },
//   outlined: {
//     bgcolor: '#43a047',
//     borderColor: '#43a047',
//     '&:hover': { bgcolor: '#388e3c', borderColor: '#388e3c' },
//   },
//   contained: {
//     bgcolor: '#43a047',
//     boxShadow: '0 2px 8px rgba(0,200,83,0.12)',
//     '&:hover': { bgcolor: '#388e3c' },
//   },
// };

function AllLeagues() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const updateLeaguesCacheWithNewLeague = useCallback((newLeague: League) => {
    cacheManager.updateLeaguesCache(newLeague);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setLeagueImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLeagueImage(null);
    setImagePreview(null);
  };

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
        setImagePreview(null);

        // Update the leagues cache with the new league
        if (data.league) {
          const newLeague = {
            ...data.league,
            image: data.league.image || null, // Ensure image field is included
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
    router.push('/home');
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
        fontFamily: '"League Spartan", sans-serif',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowLeft />}
          onClick={handleBackToAllLeagues}
          sx={{
            mb: 2, color: 'white', backgroundColor: '#388e3c',
            '&:hover': { backgroundColor: '#388e3c' ,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          Back to Dashboard
        </Button>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography variant="h3" sx={{
            mb: { xs: 3, md: 4 },
            color: 'black',
            // fontFamily: 'Arial Black, Arial, sans-serif',
            fontFamily: '"Anton", sans-serif',
            fontWeight: 'semibold',
            fontSize: { xs: '32px', sm: '42px', md: '56px' },
            textAlign: { xs: 'center', md: 'left' },
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
            className='all-leagues-heading'>
            ALL LEAGUES
          </Typography>

          {/* Create/Join League Section */}
          <Box sx={{
            display: 'flex',
            gap: { xs: 2, md: 3 },
            mb: { xs: 3, md: 5 },
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>

            <Box sx={{
              display: 'flex',
              gap: { xs: 1, md: 2 },
              width: { xs: '100%', sm: '1' },
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button
                variant="contained"
                onClick={() => setIsDialogOpen(true)}
                sx={{
                  bgcolor: 'rgb(31 62 144)',
                  color: 'white',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontWeight: 'bold',
                  fontSize: { xs: '14px', sm: '16px', md: '18px' },
                  '&:hover': { bgcolor: 'rgba(30, 58, 138, 1)' },
                  width: { xs: '100%', sm: 'fit-content' },
                  borderRadius: 2,
                  py: { xs: 1.5, md: 1 },
                  px: { xs: 3, md: 3 },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textTransform: 'none'
                }}
              >
                Create New League
              </Button>
              {/* <TextField
                label="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                sx={{
                  flex: 1,
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiOutlinedInput-root': {
                    color: 'black',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', border: '2px solid green' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)', border: '2px solid green' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.8)', border: '2px solid green' },
                  },
                  '& .MuiInputLabel-root': { color: 'green' },
                  
                }}
              /> */}
              <TextField
                label="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                size="medium"
                sx={{
                  flex: 1,
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiOutlinedInput-root': {
                    color: 'black',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    padding: '0', // Remove extra padding
                    '& input': {
                      padding: '13px 12px', // Reduce input height
                    },
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', border: '2px solid green' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)', border: '2px solid green' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.8)', border: '2px solid green' },
                  },
                  '& .MuiInputLabel-root': { color: 'green' },
                }}
              />
              <Button
                variant="contained"
                onClick={handleJoinLeague}
                disabled={isJoining}
                sx={{
                  // backgroundColor: '#388e3c',
                  bgcolor: '#388e3c',
                  color: 'white',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontWeight: 'bold',
                  fontSize: { xs: '14px', sm: '16px', md: '18px' },
                  '&:hover': { bgcolor: '#388e3c' },
                  '&:disabled': { bgcolor: '#388e3c' },
                  borderRadius: 2,
                  py: { xs: 1.5, md: 1 },
                  px: { xs: 3, md: 3 },
                  width: { xs: '100%', sm: 'fit-content' },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textTransform: 'none'
                }}
              >
                {isJoining ? <CircularProgress size={20} /> : 'Join League'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Leagues List - Card Format */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: 'rgba(96, 165, 250, 0.8)' }} />
              <Typography sx={{ mt: 2, color: 'white', fontSize: { xs: '14px', md: '16px' } }}>Loading leagues...</Typography>
            </Box>
          ) : leagues.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '18px', md: '24px' } }}>No leagues found</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '14px', md: '16px' } }}>
                Create a new league or join an existing one to get started.
              </Typography>
            </Box>
          ) : (
            leagues.map((league) => (
              <Box
                key={league.id}
                onClick={() => router.push(`/league/${league.id}`)}
                sx={{
                  p: { xs: 3, md: 2 },
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid rgba(255,255,255,0.1)',
                  // backgroundColor: '#02A880',
                  // backdropFilter: 'blur(10px)',
                  background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(30, 58, 138, 1)',
                    transform: 'translateY(-3px)',
                    // boxShadow: '0 12px 30px rgba(30, 58, 138, 0.3)',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }
                }}
              >
                {/* Settings Icon - Top Right */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    zIndex: 2
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle settings click
                  }}
                >
                  <SettingsIcon
                    onClick={() => handleOpenMembers(league)}
                    aria-label={`Open settings for ${formatLeagueName(league.name)}`}
                    size={20} />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 4 } }}>
                  {/* League Logo - Green Shield */}
                  <Box sx={{
                    width: { xs: 60, sm: 60, md: 60 },
                    height: { xs: 60, sm: 60, md: 60 },
                    // borderRadius: 2,
                    // overflow: 'hidden',
                    // backgroundColor: '#43a047',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    // border: '2px solid rgba(255,255,255,0.2)',
                    // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    position: 'relative'
                  }}>
                    <Image src={league?.image || leagueIcon} alt={`${league.name} icon`} width={60} height={60} priority />
                  </Box>

                  {/* League Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* League Title */}
                    <Typography sx={{
                      color: 'white',
                      fontFamily: '"League Spartan", sans-serif',
                      // fontWeight: 'bold',
                      fontSize: { xs: '18px', sm: '20px', md: '16px' },
                      mb: 2,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatLeagueName(league.name)}
                    </Typography>

                    {/* League Details - Two Column Layout */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 5 }
                    }}>
                      {/* Left Column */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: 10,
                              height: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '13px', sm: '13px' }
                          }}>
                            Players {league.members.length}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: 10,
                              height: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '14px', sm: '16px' }
                          }}>
                            Created At {new Date(league.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Right Column */}
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        alignItems: { xs: 'flex-start', sm: 'flex-start' }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: 10,
                              height: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '13px', sm: '13px' }
                          }}>
                            Invite Code: {league.inviteCode}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{
                              color: 'white',
                              p: 0.5,
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(league.inviteCode);
                              toast.success('Invite code copied!');
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                            </svg>
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: 10,
                              height: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '13px', sm: '13px' }
                          }}>
                            Matches: {league.matches.length}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))
          )}
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

            {/* League Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
                League Image (Optional)
              </Typography>

              {/* Image Preview */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                border: '2px dashed #43a047',
                borderRadius: 2,
                background: 'rgba(67,160,71,0.1)',
                minHeight: 80
              }}>
                <Avatar
                  src={imagePreview || '/assets/league.png'}
                  alt="League Image"
                  sx={{
                    width: 60,
                    height: 60,
                    border: '2px solid #43a047',
                    background: '#1f673b'
                  }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#B2DFDB', mb: 0.5 }}>
                    {imagePreview ? 'Selected Image' : 'Default Flag Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#B2DFDB' }}>
                    {imagePreview ? 'Click to change or remove' : 'Upload a custom image for your league'}
                  </Typography>
                </Box>
              </Box>

              {/* Upload Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{
                    color: '#43a047',
                    borderColor: '#43a047',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 'bold',
                    '&:hover': {
                      borderColor: '#388e3c',
                      backgroundColor: 'rgba(67,160,71,0.1)'
                    },
                  }}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>

                {imagePreview && (
                  <Button
                    variant="outlined"
                    onClick={handleRemoveImage}
                    sx={{
                      color: '#ff6b6b',
                      borderColor: '#ff6b6b',
                      borderRadius: 2,
                      px: 2,
                      fontWeight: 'bold',
                      '&:hover': {
                        borderColor: '#ff5252',
                        backgroundColor: 'rgba(255,107,107,0.1)'
                      },
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
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