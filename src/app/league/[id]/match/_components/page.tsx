'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Autocomplete,
  Checkbox,
  Divider,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Chip,
  Grid,
  InputAdornment
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, Shuffle, UserPlus } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { cacheManager } from "@/lib/cacheManager"
import ShirtImg from '@/Components/images/shirtimg.png';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    shirtNumber?: string;
    level?: string;
    skills?: {
        dribbling?: number;
        shooting?: number;
        passing?: number;
        pace?: number;
        defending?: number;
        physical?: number;
    };
    preferredFoot?: 'right' | 'left';
}

interface League {
    id: string;
    name: string;
    members: User[];
    active: boolean;
}

interface GuestPlayerInput {
    team: 'home' | 'away';
    firstName: string;
    lastName: string;
    shirtNumber?: string;
}

interface Guest {
    id: string;
    team: 'home' | 'away';
    firstName: string;
    lastName: string;
    shirtNumber?: string;
}

interface StagedGuest extends GuestPlayerInput {
  tempId: string;
}
type PlayerOption = User & {
  isGuest?: boolean;
  guestTempId?: string;
  team?: 'home' | 'away';
};

export default function ScheduleMatchPage() {
    // Use an existing public asset as the default/fallback team image
    const defaultTeamImage = '/assets/cflogo2.png';
    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [matchDate, setMatchDate] = useState<Dayjs | null>(dayjs());
    const [startTime, setStartTime] = useState<Dayjs | null>(dayjs());
    const [duration, setDuration] = useState<number | ''>(90);
    const [location, setLocation] = useState('');
    const [homeTeamUsers, setHomeTeamUsers] = useState<PlayerOption[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<PlayerOption[]>([]);
    const [homeCaptain, setHomeCaptain] = useState<PlayerOption | null>(null);
    const [awayCaptain, setAwayCaptain] = useState<PlayerOption | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Team image upload
    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    // Staged guests
    const [homeGuests, setHomeGuests] = useState<StagedGuest[]>([]);
    const [awayGuests, setAwayGuests] = useState<StagedGuest[]>([]);
    //   dialog state
    const [guestDialogOpen, setGuestDialogOpen] = useState(false);
    const [guestTeam, setGuestTeam] = useState<'home' | 'away'>('home');
    const [guestName, setGuestName] = useState('');

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';

    // Calculate player skill average
    const calculatePlayerSkill = (player: PlayerOption): number => {
        if (player.isGuest) return 50; // Default guest skill
        if (!player.skills) return 40;
        const { dribbling = 0, shooting = 0, passing = 0, pace = 0, defending = 0, physical = 0 } = player.skills;
        return Math.round((dribbling + shooting + passing + pace + defending + physical) / 6);
    };

    // Calculate team strength
    const calculateTeamStrength = (players: PlayerOption[]): number => {
        if (players.length === 0) return 0;
        const totalSkill = players.reduce((sum, player) => sum + calculatePlayerSkill(player), 0);
        return Math.round(totalSkill / players.length);
    };

    // Calculate winning percentage
    const calculateWinningPercentage = (teamStrength: number, opponentStrength: number): number => {
        if (teamStrength === 0 && opponentStrength === 0) return 50;
        if (opponentStrength === 0) return 85;
        if (teamStrength === 0) return 15;
        
        const strengthDiff = teamStrength - opponentStrength;
        const basePercentage = 50;
        const adjustment = (strengthDiff / 100) * 30; // Max 30% swing
        return Math.max(15, Math.min(85, Math.round(basePercentage + adjustment)));
    };

    // Shuffle teams equally
    const shuffleTeams = () => {
        const allPlayers = [...homeTeamUsers, ...awayTeamUsers];
        if (allPlayers.length < 2) {
            toast.error('Need at least 2 players to shuffle');
            return;
        }

        // Sort by skill for balanced distribution
        const sortedPlayers = allPlayers.sort((a, b) => calculatePlayerSkill(b) - calculatePlayerSkill(a));
        
        const newHomeTeam: PlayerOption[] = [];
        const newAwayTeam: PlayerOption[] = [];

        // Alternate assignment starting with strongest players
        sortedPlayers.forEach((player, index) => {
            if (index % 2 === 0) {
                newHomeTeam.push(player);
            } else {
                newAwayTeam.push(player);
            }
        });

        setHomeTeamUsers(newHomeTeam);
        setAwayTeamUsers(newAwayTeam);
        
        // Reset captains
        setHomeCaptain(null);
        setAwayCaptain(null);
        
        toast.success('Teams shuffled for balanced play!');
    };

    // Handle drag and drop
    const handlePlayerDrop = (player: PlayerOption, targetTeam: 'home' | 'away') => {
        if (targetTeam === 'home') {
            if (!homeTeamUsers.find(p => p.id === player.id)) {
                setHomeTeamUsers(prev => [...prev, player]);
                setAwayTeamUsers(prev => prev.filter(p => p.id !== player.id));
                if (awayCaptain?.id === player.id) setAwayCaptain(null);
            }
        } else {
            if (!awayTeamUsers.find(p => p.id === player.id)) {
                setAwayTeamUsers(prev => [...prev, player]);
                setHomeTeamUsers(prev => prev.filter(p => p.id !== player.id));
                if (homeCaptain?.id === player.id) setHomeCaptain(null);
            }
        }
    };

    const fetchLeagueMembers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLeague(data.league);
            } else {
                setError(data.message || 'Failed to fetch league members');
            }
        } catch {
            setError('An error occurred while fetching league data.');
        } finally {
            setLoading(false);
        }
    }, [leagueId, token]);

    useEffect(() => {
        if (leagueId && token) {
            fetchLeagueMembers();
        }
    }, [leagueId, token, fetchLeagueMembers]);

    // Image uploads
    const handleHomeTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                if (file.size <= 5 * 1024 * 1024) {
                    setHomeTeamImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => setHomeTeamImagePreview(e.target?.result as string);
                    reader.readAsDataURL(file);
                } else toast.error('File size should be less than 5MB');
            } else toast.error('Please select an image file');
        }
    };
    const handleAwayTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                if (file.size <= 5 * 1024 * 1024) {
                    setAwayTeamImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => setAwayTeamImagePreview(e.target?.result as string);
                    reader.readAsDataURL(file);
                } else toast.error('File size should be less than 5MB');
            } else toast.error('Please select an image file');
        }
    };
    const handleRemoveHomeTeamImage = () => {
        setHomeTeamImage(null);
        setHomeTeamImagePreview(null);
    };
    const handleRemoveAwayTeamImage = () => {
        setAwayTeamImage(null);
        setAwayTeamImagePreview(null);
    };

    // Add guest via dialog
    const handleAddGuest = () => {
      const trimmed = guestName.trim();
      if (!trimmed) return toast.error('Enter guest name');
      const parts = trimmed.split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || 'Guest';
      const tempId = `${guestTeam}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const staged: StagedGuest = { tempId, team: guestTeam, firstName, lastName };
      
      // Create PlayerOption for auto-selection
      const playerOption: PlayerOption = {
        id: `guest-${tempId}`,
        firstName,
        lastName,
        email: '', // Required for User interface
        isGuest: true,
        guestTempId: tempId,
        team: guestTeam
      };
      
      if (guestTeam === 'home') {
        setHomeGuests(p => [staged, ...p]);
        setHomeTeamUsers(p => [playerOption, ...p]); // Auto-add to selection
      } else {
        setAwayGuests(p => [staged, ...p]);
        setAwayTeamUsers(p => [playerOption, ...p]); // Auto-add to selection
      }
      
      toast.success('Guest added and selected for team');
      setGuestName('');
      setGuestTeam('home');
      setGuestDialogOpen(false);
    };

    // Remove a staged guest and also from selected players / captain if applied
    const removeStagedGuest = (team: 'home' | 'away', index: number) => {
      if (team === 'home') {
        const removed = homeGuests[index];
        setHomeGuests(prev => prev.filter((_, i) => i !== index));
        setHomeTeamUsers(prev => prev.filter(p => p.guestTempId !== removed.tempId));
        if (homeCaptain?.guestTempId === removed.tempId) setHomeCaptain(null);
      } else {
        const removed = awayGuests[index];
        setAwayGuests(prev => prev.filter((_, i) => i !== index));
        setAwayTeamUsers(prev => prev.filter(p => p.guestTempId !== removed.tempId));
        if (awayCaptain?.guestTempId === removed.tempId) setAwayCaptain(null);
      }
    };

    // After match creation, push staged guests to server
    const createGuestsForMatch = async (newMatchId: string): Promise<Guest[]> => {
        const all = [...homeGuests, ...awayGuests];
        if (!all.length) return [];
        await Promise.allSettled(
            all.map(g =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${newMatchId}/guests`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      team: g.team,
                      firstName: g.firstName,
                      lastName: g.lastName,
                      shirtNumber: g.shirtNumber
                    })
                }).then(res => res.ok ? res.json() : res.json().then(j => Promise.reject(j?.message || 'Guest add failed')))
            )
        );
        const getRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${newMatchId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const j = await getRes.json().catch(() => ({}));
        return (j?.match?.guests as Guest[] | undefined) || [];
    };

    const handleScheduleMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!matchDate || !startTime) {
            setError('Please select a valid date and time for the match.');
            setIsSubmitting(false);
            return;
        }
        if (!homeCaptain || !awayCaptain) {
            setError('Please select a captain for both teams.');
            setIsSubmitting(false);
            return;
        }

        const start = matchDate
            .hour(startTime.hour())
            .minute(startTime.minute())
            .second(0)
            .millisecond(0);

        const matchDuration = duration || 90;
        const end = start.add(matchDuration, 'minute');

        // Only send real user UUIDs for team users and captains
        const realHomeTeamUsers = homeTeamUsers.filter(u => !u.isGuest).map(u => u.id);
        const realAwayTeamUsers = awayTeamUsers.filter(u => !u.isGuest).map(u => u.id);
        const realHomeCaptain = homeCaptain && !homeCaptain.isGuest ? homeCaptain.id : '';
        const realAwayCaptain = awayCaptain && !awayCaptain.isGuest ? awayCaptain.id : '';

        try {
            const formData = new FormData();
            formData.append('homeTeamName', homeTeamName);
            formData.append('awayTeamName', awayTeamName);
            formData.append('date', start.toISOString());
            formData.append('start', start.toISOString());
            formData.append('end', end.toISOString());
            formData.append('location', location);
            formData.append('homeTeamUsers', JSON.stringify(realHomeTeamUsers));
            formData.append('awayTeamUsers', JSON.stringify(realAwayTeamUsers));
            formData.append('homeCaptain', realHomeCaptain);
            formData.append('awayCaptain', realAwayCaptain);
            if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
            if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                let updatedMatch = result.match;
                if (updatedMatch?.id) {
                    const guests = await createGuestsForMatch(updatedMatch.id);
                    updatedMatch = { ...updatedMatch, guests };
                    cacheManager.updateMatchesCache(updatedMatch);
                }
                toast.success('Match scheduled successfully!');
                router.push(`/league/${leagueId}`);
            } else {
                throw new Error(result.message || 'Failed to schedule match.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    }

    if (error || !league) {
        return <Box sx={{ p: 4, minHeight: '100vh', color: 'white' }}>
            <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{
                mb: 2, color: 'white', backgroundColor: '#388e3c',
                '&:hover': { backgroundColor: '#388e3c' },
                borderRadius: 2
            }}>
                Back to League
            </Button>
            <Typography color="error">{error || 'Could not load league data.'}</Typography>
        </Box>;
    }

    // Improved input styles
    const inputStyles = {
        "& .MuiOutlinedInput-root": {
            color: "#E5E7EB",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 2,
            "& fieldset": { 
                borderColor: "rgba(255,255,255,0.15)",
                borderWidth: "1px"
            },
            "&:hover fieldset": { 
                borderColor: "rgba(255,255,255,0.25)", 
                borderWidth: "1px" 
            },
            "&.Mui-focused": {
                "& fieldset": { 
                    borderColor: "#e56a16", 
                    borderWidth: "2px",
                    boxShadow: "0 0 0 3px rgba(229, 106, 22, 0.1)"
                },
            },
            "& input": { color: "#E5E7EB", backgroundColor: "transparent" },
            "& .MuiInputBase-input": { color: "#E5E7EB", backgroundColor: "transparent" },
        },
        "& .MuiInputLabel-root": {
            color: "#9CA3AF",
            fontWeight: 500,
            "&.Mui-focused": { color: "#e56a16" },
        },
        "& .MuiSvgIcon-root": { color: "#E5E7EB" },
    };

    const autocompleteStyles = {
        "& .MuiOutlinedInput-root": {
            color: "#E5E7EB",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 2,
            "& fieldset": { 
                borderColor: "rgba(255,255,255,0.15)",
                borderWidth: "1px"
            },
            "&:hover fieldset": { 
                borderColor: "rgba(255,255,255,0.25)", 
                borderWidth: "1px" 
            },
            "&.Mui-focused": {
                "& fieldset": { 
                    borderColor: "#e56a16", 
                    borderWidth: "2px",
                    boxShadow: "0 0 0 3px rgba(229, 106, 22, 0.1)"
                },
                "& .MuiInputBase-input": { color: "#E5E7EB" },
            },
            "& .MuiInputBase-input": { color: "#E5E7EB", backgroundColor: "transparent" },
            "& .MuiChip-root": {
                backgroundColor: "rgba(229, 106, 22, 0.15)",
                color: "#E5E7EB",
                border: "1px solid rgba(229, 106, 22, 0.3)",
                "& .MuiChip-deleteIcon": { color: "#E5E7EB" },
            },
        },
        "& .MuiInputLabel-root": {
            color: "#9CA3AF",
            fontWeight: 500,
            "&.Mui-focused": { color: "#e56a16" },
        },
        "& .MuiSvgIcon-root": { color: "#E5E7EB" },
    };

    const ShirtAvatar = ({ number, size = 56 }: { number?: string | number; size?: number | { xs: number; sm: number }; }) => {
        const avatarSize = typeof size === 'object' ? size.sm : size;
        const avatarSizeXs = typeof size === 'object' ? size.xs : size;
        const fontSize = avatarSize >= 48 ? 14 : avatarSize >= 40 ? 12 : avatarSize >= 32 ? 10 : 8;
        const fontSizeXs = avatarSizeXs >= 32 ? 10 : avatarSizeXs >= 28 ? 9 : 8;
        
        return (
            <Box sx={{ 
                position: 'relative', 
                width: size, 
                height: size, 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: 1, 
                overflow: 'hidden', 
                background: 'transparent',
                flexShrink: 0
            }}>
                <img 
                    src={ShirtImg.src} 
                    alt="Shirt" 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        position: 'absolute', 
                        inset: 0, 
                        zIndex: 0 
                    }} 
                />
                <Typography 
                    component="span" 
                    sx={{ 
                        position: 'relative', 
                        zIndex: 1, 
                        fontWeight: 800, 
                        fontSize: typeof size === 'object' ? { xs: fontSizeXs, sm: fontSize } : fontSize,
                        color: '#111', 
                        textShadow: '0 1px 1px rgba(255,255,255,0.6)', 
                        lineHeight: 1 
                    }}
                >
                    {number || '0'}
                </Typography>
            </Box>
        );
    };

    // Build player options including guests
    const homeGuestOptions: PlayerOption[] = homeGuests.map(g => ({
      id: `guest-${g.tempId}`,
      firstName: g.firstName,
      lastName: g.lastName,
      email: '', // Required for User interface
      shirtNumber: g.shirtNumber,
      isGuest: true,
      guestTempId: g.tempId,
      team: 'home'
    }));
    const awayGuestOptions: PlayerOption[] = awayGuests.map(g => ({
      id: `guest-${g.tempId}`,
      firstName: g.firstName,
      lastName: g.lastName,
      email: '', // Required for User interface
      shirtNumber: g.shirtNumber,
      isGuest: true,
      guestTempId: g.tempId,
      team: 'away'
    }));

    const homePlayerOptions: PlayerOption[] = [
      ...league.members.filter(m => !awayTeamUsers.some(p => p.id === m.id)),
      ...homeGuestOptions
    ];
    const awayPlayerOptions: PlayerOption[] = [
      ...league.members.filter(m => !homeTeamUsers.some(p => p.id === m.id)),
      ...awayGuestOptions
    ];

    // Calculate team stats
    const homeStrength = calculateTeamStrength(homeTeamUsers);
    const awayStrength = calculateTeamStrength(awayTeamUsers);
    const homeWinChance = calculateWinningPercentage(homeStrength, awayStrength);
    const awayWinChance = calculateWinningPercentage(awayStrength, homeStrength);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 4, minHeight: '100vh', color: '#E5E7EB' }}>
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Form Section */}
                    <Box component="form" onSubmit={handleScheduleMatch} sx={{ width: { xs: "100%", md: "58.33%" } }}>
                        <Paper sx={{
                            p: 4,
                            bgcolor: 'rgba(15,15,15,0.95)',
                            color: '#E5E7EB',
                            borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: { xs: 1, sm: 2 } }}>
                                <Typography 
                                    variant="h4" 
                                    component="h1" 
                                    sx={{ 
                                        fontWeight: 700, 
                                        background: 'linear-gradient(135deg, #e56a16, #cf2326)', 
                                        backgroundClip: 'text', 
                                        WebkitBackgroundClip: 'text', 
                                        WebkitTextFillColor: 'transparent',
                                        fontSize: { xs: '1.1rem', sm: '2rem' },
                                        flexShrink: 1,
                                        minWidth: 0
                                    }}
                                >
                                   Create Match
                                </Typography>
                                <Button
                                    startIcon={<UserPlus size={16} />}
                                    variant="contained"
                                    onClick={() => setGuestDialogOpen(true)}
                                    size="medium"
                                    sx={{
                                        background: 'linear-gradient(135deg, #e56a16, #cf2326)',
                                        color: 'white',
                                        fontWeight: 600,
                                        borderRadius: 3,
                                        px: { xs: 1.5, sm: 3 },
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                        width: { xs: 'auto', sm: 'auto' },
                                        height: { xs: 28, sm: 36 },
                                        minWidth: { xs: 80, sm: 'auto' },
                                        flexShrink: 0,
                                        '& .MuiButton-startIcon': {
                                            marginRight: { xs: 0.5, sm: 1 }
                                        },
                                        '&:hover': { 
                                            background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 6px 20px rgba(229, 106, 22, 0.4)'
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Add Guest
                                </Button>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Team Names & Images */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ mb: 2, color: '#43a047', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Home Team</Typography>
                                            <TextField
                                                label="Team Name"
                                                value={homeTeamName}
                                                onChange={(e) => setHomeTeamName(e.target.value)}
                                                required
                                                fullWidth
                                                sx={{ ...inputStyles, mb: 2 }}
                                            />
                                            <Box>
                                                <input
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id="home-team-image-upload"
                                                    type="file"
                                                    onChange={handleHomeTeamImageUpload}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Team Logo"
                                                    value={homeTeamImage ? homeTeamImage.name : ''}
                                                    onClick={() => {
                                                        const input = document.getElementById('home-team-image-upload');
                                                        input?.click();
                                                    }}
                                                    InputProps={{
                                                        readOnly: true,
                                                        style: {
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer'
                                                        },
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <label htmlFor="home-team-image-upload">
                                                                        <Button 
                                                                            component="span" 
                                                                            variant="outlined" 
                                                                            size="small" 
                                                                            sx={{ 
                                                                                color: '#43a047', 
                                                                                borderColor: '#43a047', 
                                                                                '&:hover': { borderColor: '#388e3c', backgroundColor: 'rgba(67, 160, 71, 0.1)' },
                                                                                display: { xs: 'none', sm: 'inline-flex' }
                                                                            }}
                                                                        >
                                                                            Browse
                                                                        </Button>
                                                                    </label>
                                                                    {homeTeamImage && (
                                                                        <IconButton onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveHomeTeamImage();
                                                                        }} size="small" sx={{ color: '#f44336' }}>
                                                                            <X size={16} />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{ ...inputStyles }}
                                                />
                                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        src={homeTeamImagePreview || defaultTeamImage}
                                                        alt="Home Team"
                                                        imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                                        sx={{ width: 50, height: 50, border: '2px solid #43a047', '& .MuiAvatar-img': { objectFit: 'contain' } }}
                                                    />
                                                    <Typography variant="body2" sx={{ color: '#B2DFDB' }}>Logo Preview</Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ mb: 2, color: '#ef5350', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Away Team</Typography>
                                            <TextField
                                                label="Team Name"
                                                value={awayTeamName}
                                                onChange={(e) => setAwayTeamName(e.target.value)}
                                                required
                                                fullWidth
                                                sx={{ ...inputStyles, mb: 2 }}
                                            />
                                            <Box>
                                                <input
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id="away-team-image-upload"
                                                    type="file"
                                                    onChange={handleAwayTeamImageUpload}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Team Logo"
                                                    value={awayTeamImage ? awayTeamImage.name : ''}
                                                    onClick={() => {
                                                        const input = document.getElementById('away-team-image-upload');
                                                        input?.click();
                                                    }}
                                                    InputProps={{
                                                        readOnly: true,
                                                        style: {
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer'
                                                        },
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <label htmlFor="away-team-image-upload">
                                                                        <Button 
                                                                            component="span" 
                                                                            variant="outlined" 
                                                                            size="small" 
                                                                            sx={{ 
                                                                                color: '#ef5350', 
                                                                                borderColor: '#ef5350', 
                                                                                '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(239, 83, 80, 0.1)' },
                                                                                display: { xs: 'none', sm: 'inline-flex' }
                                                                            }}
                                                                        >
                                                                            Browse
                                                                        </Button>
                                                                    </label>
                                                                    {awayTeamImage && (
                                                                        <IconButton onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveAwayTeamImage();
                                                                        }} size="small" sx={{ color: '#f44336' }}>
                                                                            <X size={16} />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{ ...inputStyles }}
                                                />
                                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        src={awayTeamImagePreview || defaultTeamImage}
                                                        alt="Away Team"
                                                        imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                                        sx={{ width: 50, height: 50, border: '2px solid #ef5350', '& .MuiAvatar-img': { objectFit: 'contain' } }}
                                                    />
                                                    <Typography variant="body2" sx={{ color: '#EF9A9A' }}>Logo Preview</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Player Selection */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Team Selection</Typography>
                                        <Button
                                            startIcon={<Shuffle size={18} />}
                                            variant="outlined"
                                            onClick={shuffleTeams}
                                            disabled={homeTeamUsers.length + awayTeamUsers.length < 2}
                                            size="medium" // Use single size
                                            sx={{
                                                borderColor: '#e56a16',
                                                color: '#e56a16',
                                                fontWeight: 600,
                                                borderRadius: 3,
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                width: { xs: '100%', sm: 'auto' },
                                                height: { xs: 32, sm: 36 }, // Responsive height
                                                '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(229, 106, 22, 0.1)' }
                                            }}
                                        >
                                            Shuffle Teams
                                        </Button>
                                    </Box>

                                    {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                                        <Box sx={{ mb: 3, p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <Typography variant="body2" sx={{ mb: 2, color: '#9CA3AF', textAlign: 'center' }}>
                                                💡 Drag players between teams to balance. Equal teams create better matches!
                                            </Typography>
                                        </Box>
                                    )}

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Autocomplete
                                                multiple
                                                options={homePlayerOptions}
                                                disableCloseOnSelect
                                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}${option.isGuest ? ' (Guest)' : ''}`}
                                                value={homeTeamUsers}
                                                onChange={(event, newValue) => {
                                                    setHomeTeamUsers(newValue)
                                                    if (homeCaptain && !newValue.some((u) => u.id === homeCaptain.id)) setHomeCaptain(null)
                                                }}
                                                renderOption={(props, option, { selected }) => (
                                                    <li {...props} style={{ color: "black", backgroundColor: selected ? "#e3f2fd" : "white", padding: '12px 16px' }}>
                                                        <Checkbox
                                                            icon={<span style={{ width: 16, height: 16, border: "1px solid #666", borderRadius: 2 }} />}
                                                            checkedIcon={<span style={{ width: 16, height: 16, backgroundColor: "#1976d2", borderRadius: 2 }} />}
                                                            sx={{ marginRight: 1 }}
                                                            checked={selected}
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography>{option.firstName} {option.lastName}</Typography>
                                                            {option.isGuest && <Chip label="Guest" size="small" sx={{ bgcolor: '#d35400', color: 'white', fontSize: '10px' }} />}
                                                            <Chip label={`${calculatePlayerSkill(option)}`} size="small" sx={{ bgcolor: '#1976d2', color: 'white', fontSize: '10px' }} />
                                                        </Box>
                                                    </li>
                                                )}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Select Home Team Players" placeholder="Choose players..." sx={{ ...autocompleteStyles }} />
                                                )}
                                                sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                                            />
                                            {homeTeamUsers.length > 0 && (
                                                <Autocomplete
                                                    options={homeTeamUsers}
                                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}${option.isGuest ? ' (Guest)' : ''}`}
                                                    value={homeCaptain}
                                                    onChange={(event, newValue) => setHomeCaptain(newValue)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} sx={{ mt: 2, ...inputStyles }} label="Select Home Team Captain" required />
                                                    )}
                                                    sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                                                />
                                            )}
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Autocomplete
                                                multiple
                                                options={awayPlayerOptions}
                                                disableCloseOnSelect
                                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}${option.isGuest ? ' (Guest)' : ''}`}
                                                value={awayTeamUsers}
                                                onChange={(event, newValue) => {
                                                    setAwayTeamUsers(newValue)
                                                    if (awayCaptain && !newValue.some((u) => u.id === awayCaptain.id)) setAwayCaptain(null)
                                                }}
                                                renderOption={(props, option, { selected }) => (
                                                    <li {...props} style={{ color: "black", backgroundColor: selected ? "#e3f2fd" : "white", padding: '12px 16px' }}>
                                                        <Checkbox
                                                            icon={<span style={{ width: 16, height: 16, border: "1px solid #666", borderRadius: 2 }} />}
                                                            checkedIcon={<span style={{ width: 16, height: 16, backgroundColor: "#1976d2", borderRadius: 2 }} />}
                                                            sx={{ marginRight: 1 }}
                                                            checked={selected}
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography>{option.firstName} {option.lastName}</Typography>
                                                            {option.isGuest && <Chip label="Guest" size="small" sx={{ bgcolor: '#d35400', color: 'white', fontSize: '10px' }} />}
                                                            <Chip label={`${calculatePlayerSkill(option)}`} size="small" sx={{ bgcolor: '#1976d2', color: 'white', fontSize: '10px' }} />
                                                        </Box>
                                                    </li>
                                                )}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Select Away Team Players" placeholder="Choose players..." sx={{ ...autocompleteStyles }} />
                                                )}
                                                sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                                            />
                                            {awayTeamUsers.length > 0 && (
                                                <Autocomplete
                                                    options={awayTeamUsers}
                                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}${option.isGuest ? ' (Guest)' : ''}`}
                                                    value={awayCaptain}
                                                    onChange={(event, newValue) => setAwayCaptain(newValue)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} sx={{ mt: 2, ...inputStyles }} label="Select Away Team Captain" required />
                                                    )}
                                                    sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                                                />
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Match Details moved to its own card below */}
                            </Grid>

                            {error && <Typography color="error" sx={{ mt: 2, p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2, border: '1px solid rgba(244, 67, 54, 0.3)' }}>{error}</Typography>}
                        </Paper>

                        {/* Separate Match Details Card */}
                        <Paper sx={{
                            mt: 3,
                            p: 4,
                            bgcolor: 'rgba(15,15,15,0.95)',
                            color: '#E5E7EB',
                            borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)'
                        }}>
                            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                Match Details
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3, color: '#9CA3AF' }}>
                                These fields are required by the API to save your match.
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Match Date"
                                        value={matchDate}
                                        onChange={(newValue) => setMatchDate(dayjs(newValue))}
                                        slotProps={{ textField: { fullWidth: true, required: true, sx: inputStyles } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TimePicker
                                        label="Start Time"
                                        value={startTime}
                                        onChange={(newValue) => setStartTime(dayjs(newValue))}
                                        slotProps={{ textField: { fullWidth: true, required: true, sx: inputStyles } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Duration (minutes)"
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
                                        required
                                        fullWidth
                                        sx={{ ...inputStyles }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        required
                                        fullWidth
                                        sx={{ ...inputStyles }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Single Save Button below both cards */}
                        <Box sx={{ mt: { xs: 3, md: 4 } }}>
                            {error && (
                                <Typography color="error" sx={{ mb: 2, p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                                    {error}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                    py: { xs: 1.5, sm: 2 },
                                    background: 'linear-gradient(135deg, #e56a16, #cf2326)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    borderRadius: 3,
                                    height: { xs: 48, sm: 56 },
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 30px rgba(229, 106, 22, 0.4)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                                disabled={isSubmitting || league?.active === false}
                            >
                                {isSubmitting ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'Save Match'}
                            </Button>
                        </Box>
                    </Box>

                    {/* Enhanced Live Preview Section */}
                    <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                        <Paper sx={{
                            p: { xs: 1.5, sm: 2, md: 3 },
                            bgcolor: 'rgba(15,15,15,0.95)',
                            color: '#E5E7EB',
                            borderRadius: { xs: 2, sm: 3, md: 4 },
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden'
                        }}>
                            <Typography variant="h5" sx={{ 
                                color: '#fff', 
                                fontWeight: 700, 
                                textAlign: 'center', 
                                mb: { xs: 1.5, sm: 2, md: 3 },
                                fontSize: { xs: '0.875rem', sm: '1.125rem', md: '1.5rem' }
                            }}>
                                Match Preview
                            </Typography>

                            {/* Win Probability */}
                            {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                                <Box sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: { xs: 2, sm: 3 }, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="h6" sx={{ mb: { xs: 1, sm: 1.5, md: 2 }, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem', md: '1.25rem' } }}>Win Probability</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, sm: 1.5, md: 2 } }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#43a047', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{homeWinChance}%</Typography>
                                            <Typography variant="body2" sx={{ color: '#43a047', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{homeTeamName || 'Home'}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#ef5350', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{awayWinChance}%</Typography>
                                            <Typography variant="body2" sx={{ color: '#ef5350', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{awayTeamName || 'Away'}</Typography>
                                        </Box>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={homeWinChance} 
                                        sx={{ 
                                            height: { xs: 6, sm: 8 }, 
                                            borderRadius: { xs: 3, sm: 4 },
                                            bgcolor: 'rgba(239, 83, 80, 0.3)',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: '#43a047',
                                                borderRadius: { xs: 3, sm: 4 }
                                            }
                                        }} 
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 0.5, sm: 1 } }}>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {homeStrength}</Typography>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {awayStrength}</Typography>
                                    </Box>
                                </Box>
                            )}

                            <Divider sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, borderColor: 'rgba(255,255,255,0.3)', width: { xs: '50px', sm: '80px', md: '100px' }, mx: 'auto' }} />

                            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1, md: 2 }, alignItems: 'flex-start' }}>
                                {/* Home Team */}
                                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 1, sm: 1.5, md: 2 }, px: { xs: 0.5, sm: 1 } }}>
                                        <Avatar
                                            src={homeTeamImagePreview || defaultTeamImage}
                                            alt="Home Team"
                                            imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                            sx={{
                                                width: { xs: 20, sm: 28, md: 40 },
                                                height: { xs: 20, sm: 28, md: 40 },
                                                mr: { xs: 0.3, sm: 0.5, md: 1 },
                                                border: '2px solid #43a047',
                                                '& .MuiAvatar-img': { objectFit: 'contain' }
                                            }}
                                        />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="h6" sx={{ 
                                                color: '#43a047', 
                                                fontWeight: 600, 
                                                fontSize: { xs: '0.625rem', sm: '0.75rem', md: '1.25rem' },
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {homeTeamName || 'Home Team'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.5rem', sm: '0.65rem', md: '0.75rem' } }}>
                                                {homeTeamUsers.length} players
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    {homeCaptain && (
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mb: { xs: 0.5, sm: 1, md: 1.5 }, 
                                                p: { xs: 0.5, sm: 0.8, md: 1.5 }, 
                                                bgcolor: 'rgba(255, 215, 0, 0.1)', 
                                                borderRadius: { xs: 1, sm: 2, md: 3 },
                                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                                cursor: 'pointer',
                                                minHeight: { xs: 28, sm: 35, md: 50 },
                                                '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                                                overflow: 'hidden'
                                            }}
                                            draggable
                                            onDragEnd={() => handlePlayerDrop(homeCaptain, 'away')}
                                        >
                                            <ShirtAvatar number={homeCaptain.shirtNumber || (homeCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} />
                                            <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                                                <Typography 
                                                    fontWeight="bold" 
                                                    sx={{ 
                                                        fontSize: { xs: 6.5, sm: 8, md: 12 }, 
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {homeCaptain.firstName} {homeCaptain.lastName}
                                                    {homeCaptain.isGuest && (
                                                        <Chip 
                                                            label="G" 
                                                            size="small" 
                                                            sx={{ 
                                                                ml: { xs: 0.3, sm: 0.5, md: 0.8 }, 
                                                                height: { xs: 10, sm: 12, md: 16 }, 
                                                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                                                bgcolor: '#e67e22', 
                                                                color: 'white',
                                                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                                            }} 
                                                        />
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: { xs: 5, sm: 6, md: 9 }, color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                    Skill: {calculatePlayerSkill(homeCaptain)}
                                                </Typography>
                                            </Box>
                                            {homeCaptain.isGuest && (
                                                <IconButton
                                                    size="small"
                                                    sx={{ 
                                                        color: '#f44336', 
                                                        ml: { xs: 0.2, sm: 0.3 }, 
                                                        p: { xs: 0.1, sm: 0.2, md: 0.3 },
                                                        minWidth: { xs: 14, sm: 18, md: 22 },
                                                        width: { xs: 14, sm: 18, md: 22 },
                                                        height: { xs: 14, sm: 18, md: 22 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setHomeCaptain(null);
                                                        const idx = homeGuests.findIndex(g => g.tempId === homeCaptain.guestTempId);
                                                        if (idx > -1) removeStagedGuest('home', idx);
                                                    }}
                                                >
                                                    <X size={8} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}
                                    
                                    {homeTeamUsers
                                      .filter(u => u.id !== homeCaptain?.id)
                                      .map(user => (
                                        <Box 
                                            key={user.id} 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mb: { xs: 0.3, sm: 0.5, md: 1 }, 
                                                p: { xs: 0.3, sm: 0.5, md: 1 }, 
                                                bgcolor: 'rgba(255,255,255,0.03)', 
                                                borderRadius: { xs: 1, sm: 2, md: 3 },
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                cursor: 'pointer',
                                                minHeight: { xs: 24, sm: 30, md: 40 },
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                                overflow: 'hidden'
                                            }}
                                            draggable
                                            onDragEnd={() => handlePlayerDrop(user, 'away')}
                                        >
                                            <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 16, sm: 20 }} />
                                            <Box sx={{ ml: { xs: 0.4, sm: 0.6, md: 1 }, flex: 1, minWidth: 0 }}>
                                                <Typography 
                                                    fontWeight={500} 
                                                    sx={{ 
                                                        fontSize: { xs: 6, sm: 7.5, md: 10 }, 
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {user.firstName} {user.lastName}
                                                    {user.isGuest && (
                                                        <Chip 
                                                            label="G" 
                                                            size="small" 
                                                            sx={{ 
                                                                ml: { xs: 0.2, sm: 0.4, md: 0.6 }, 
                                                                height: { xs: 8, sm: 10, md: 14 }, 
                                                                fontSize: { xs: '0.35rem', sm: '0.45rem', md: '0.55rem' },
                                                                bgcolor: '#e67e22', 
                                                                color: 'white',
                                                                '& .MuiChip-label': { px: { xs: 0.15, sm: 0.2, md: 0.4 } }
                                                            }} 
                                                        />
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: { xs: 4, sm: 5, md: 7 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                    Skill: {calculatePlayerSkill(user)}
                                                </Typography>
                                            </Box>
                                            {user.isGuest && (
                                                <IconButton
                                                    size="small"
                                                    sx={{ 
                                                        color: '#f44336', 
                                                        ml: { xs: 0.1, sm: 0.2, md: 0.3 }, 
                                                        p: { xs: 0.1, sm: 0.15, md: 0.2 },
                                                        minWidth: { xs: 12, sm: 16, md: 20 },
                                                        width: { xs: 12, sm: 16, md: 20 },
                                                        height: { xs: 12, sm: 16, md: 20 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const idx = homeGuests.findIndex(g => g.tempId === user.guestTempId);
                                                        if (idx > -1) removeStagedGuest('home', idx);
                                                    }}
                                                >
                                                    <X size={7} />
                                                </IconButton>
                                            )}
                                        </Box>
                                      ))}
                                </Box>

                                {/* Divider */}
                                <Box sx={{ 
                                    width: { xs: '1px', sm: '2px', md: '3px' }, 
                                    bgcolor: 'rgba(255,255,255,0.4)', 
                                    minHeight: { xs: 60, sm: 80, md: 120 }, 
                                    borderRadius: 0.5, 
                                    alignSelf: 'stretch',
                                    flexShrink: 0
                                }} />

                                {/* Away Team */}
                                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 1, sm: 1.5, md: 2 }, px: { xs: 0.5, sm: 1 } }}>
                                        <Avatar
                                            src={awayTeamImagePreview || defaultTeamImage}
                                            alt="Away Team"
                                            imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                            sx={{
                                                width: { xs: 20, sm: 28, md: 40 },
                                                height: { xs: 20, sm: 28, md: 40 },
                                                mr: { xs: 0.3, sm: 0.5, md: 1 },
                                                border: '2px solid #ef5350',
                                                '& .MuiAvatar-img': { objectFit: 'contain' }
                                            }}
                                        />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="h6" sx={{ 
                                                color: '#ef5350', 
                                                fontWeight: 600, 
                                                fontSize: { xs: '0.625rem', sm: '0.75rem', md: '1.25rem' },
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {awayTeamName || 'Away Team'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.5rem', sm: '0.65rem', md: '0.75rem' } }}>
                                                {awayTeamUsers.length} players
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    {awayCaptain && (
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mb: { xs: 0.5, sm: 1, md: 1.5 }, 
                                                p: { xs: 0.5, sm: 0.8, md: 1.5 }, 
                                                bgcolor: 'rgba(255, 215, 0, 0.1)', 
                                                borderRadius: { xs: 1, sm: 2, md: 3 },
                                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                                cursor: 'pointer',
                                                minHeight: { xs: 28, sm: 35, md: 50 },
                                                '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                                                overflow: 'hidden'
                                            }}
                                            draggable
                                            onDragEnd={() => handlePlayerDrop(awayCaptain, 'home')}
                                        >
                                            <ShirtAvatar number={awayCaptain.shirtNumber || (awayCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} />
                                            <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                                                <Typography 
                                                    fontWeight="bold" 
                                                    sx={{ 
                                                        fontSize: { xs: 6.5, sm: 8, md: 12 }, 
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {awayCaptain.firstName} {awayCaptain.lastName}
                                                    {awayCaptain.isGuest && (
                                                        <Chip 
                                                            label="G" 
                                                            size="small" 
                                                            sx={{ 
                                                                ml: { xs: 0.3, sm: 0.5, md: 0.8 }, 
                                                                height: { xs: 10, sm: 12, md: 16 }, 
                                                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                                                bgcolor: '#e67e22', 
                                                                color: 'white',
                                                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                                            }} 
                                                        />
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: { xs: 5, sm: 6, md: 9 }, color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                    Skill: {calculatePlayerSkill(awayCaptain)}
                                                </Typography>
                                            </Box>
                                            {awayCaptain.isGuest && (
                                                <IconButton
                                                    size="small"
                                                    sx={{ 
                                                        color: '#f44336', 
                                                        ml: { xs: 0.2, sm: 0.3 }, 
                                                        p: { xs: 0.1, sm: 0.2, md: 0.3 },
                                                        minWidth: { xs: 14, sm: 18, md: 22 },
                                                        width: { xs: 14, sm: 18, md: 22 },
                                                        height: { xs: 14, sm: 18, md: 22 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAwayCaptain(null);
                                                        const idx = awayGuests.findIndex(g => g.tempId === awayCaptain.guestTempId);
                                                        if (idx > -1) removeStagedGuest('away', idx);
                                                    }}
                                                >
                                                    <X size={8} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}
                                    
                                    {awayTeamUsers
                                      .filter(u => u.id !== awayCaptain?.id)
                                      .map(user => (
                                        <Box 
                                            key={user.id} 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mb: { xs: 0.3, sm: 0.5, md: 1 }, 
                                                p: { xs: 0.3, sm: 0.5, md: 1 }, 
                                                bgcolor: 'rgba(255,255,255,0.03)', 
                                                borderRadius: { xs: 1, sm: 2, md: 3 },
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                cursor: 'pointer',
                                                minHeight: { xs: 24, sm: 30, md: 40 },
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                                overflow: 'hidden'
                                            }}
                                            draggable
                                            onDragEnd={() => handlePlayerDrop(user, 'home')}
                                        >
                                            <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 16, sm: 20 }} />
                                            <Box sx={{ ml: { xs: 0.4, sm: 0.6, md: 1 }, flex: 1, minWidth: 0 }}>
                                                <Typography 
                                                    fontWeight={500} 
                                                    sx={{ 
                                                        fontSize: { xs: 6, sm: 7.5, md: 10 }, 
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {user.firstName} {user.lastName}
                                                    {user.isGuest && (
                                                        <Chip 
                                                            label="G" 
                                                            size="small" 
                                                            sx={{ 
                                                                ml: { xs: 0.2, sm: 0.4, md: 0.6 }, 
                                                                height: { xs: 8, sm: 10, md: 14 }, 
                                                                fontSize: { xs: '0.35rem', sm: '0.45rem', md: '0.55rem' },
                                                                bgcolor: '#e67e22', 
                                                                color: 'white',
                                                                '& .MuiChip-label': { px: { xs: 0.15, sm: 0.2, md: 0.4 } }
                                                            }} 
                                                        />
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: { xs: 4, sm: 5, md: 7 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                    Skill: {calculatePlayerSkill(user)}
                                                </Typography>
                                            </Box>
                                            {user.isGuest && (
                                                <IconButton
                                                    size="small"
                                                    sx={{ 
                                                        color: '#f44336', 
                                                        ml: { xs: 0.1, sm: 0.2, md: 0.3 }, 
                                                        p: { xs: 0.1, sm: 0.15, md: 0.2 },
                                                        minWidth: { xs: 12, sm: 16, md: 20 },
                                                        width: { xs: 12, sm: 16, md: 20 },
                                                        height: { xs: 12, sm: 16, md: 20 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const idx = awayGuests.findIndex(g => g.tempId === user.guestTempId);
                                                        if (idx > -1) removeStagedGuest('away', idx);
                                                    }}
                                                >
                                                    <X size={7} />
                                                </IconButton>
                                            )}
                                        </Box>
                                      ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>

            <Dialog open={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} fullWidth maxWidth="xs">
              <DialogTitle sx={{ bgcolor: 'rgba(15,15,15,0.95)', color: 'white' }}>Add Guest Player</DialogTitle>
              <DialogContent sx={{ pt: 3, bgcolor: 'rgba(15,15,15,0.95)', color: 'white' }}>
                <RadioGroup
                  row
                  value={guestTeam}
                  onChange={(e) => setGuestTeam(e.target.value as 'home' | 'away')}
                  sx={{ mb: 3, justifyContent: 'center' }}
                >
                  <FormControlLabel value="home" control={<Radio sx={{ color: '#43a047' }} />} label="Home Team" />
                  <FormControlLabel value="away" control={<Radio sx={{ color: '#ef5350' }} />} label="Away Team" />
                </RadioGroup>
                <TextField
                  autoFocus
                  label="Guest Full Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  fullWidth
                  placeholder="e.g. John Doe"
                  sx={{ ...inputStyles }}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3, bgcolor: 'rgba(15,15,15,0.95)' }}>
                <Button onClick={() => setGuestDialogOpen(false)} sx={{ color: '#9CA3AF' }}>Cancel</Button>
                <Button
                  onClick={handleAddGuest}
                  variant="contained"
                  sx={{ background: 'linear-gradient(135deg, #e56a16, #cf2326)', '&:hover': { background: 'linear-gradient(135deg, #d32f2f, #b71c1c)' } }}
                >
                  Add Guest
                </Button>
              </DialogActions>
            </Dialog>

            <Toaster position="top-center" reverseOrder={false} />
        </LocalizationProvider>
    );
}