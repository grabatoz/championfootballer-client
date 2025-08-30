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
    Chip,
    Divider,
    IconButton,
    Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
// import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cacheManager } from "@/lib/cacheManager"
import ShirtImg from '@/Components/images/shirtimg.png'; // If you want to use shirt avatars

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    shirtNumber?: string;
    location: string;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    profilePicture?: string;
    homeCaptainId?: string;
    awayCaptainId?: string;
}

// NEW: Guest player type
interface Guest {
    id?: string;
    team: 'home' | 'away';
    firstName: string;
    lastName: string;
    shirtNumber?: string;
}

interface Match {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    date: string;
    location: string;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    homeCaptainId?: string;
    awayCaptainId?: string;
    homeTeamImage?: string;
    awayTeamImage?: string;
    // Optional guest fields depending on API shape
    guests?: Guest[];
    homeGuests?: Guest[];
    awayGuests?: Guest[];
}

interface League {
    id: string;
    name: string;
    members: User[];
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function EditMatchPage() {
    const [league, setLeague] = useState<League | null>(null);
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [matchDate, setMatchDate] = useState<Date | null>(null);
    const [location, setLocation] = useState('');
    const [homeTeamUsers, setHomeTeamUsers] = useState<User[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<User[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Captains
    const [homeCaptain, setHomeCaptain] = useState<User | null>(null);
    const [awayCaptain, setAwayCaptain] = useState<User | null>(null);

    // Team images
    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    // NEW: Guests state for existing match
    const [homeGuests, setHomeGuests] = useState<Guest[]>([]);
    const [awayGuests, setAwayGuests] = useState<Guest[]>([]);

    // NEW: Guest dialog state
    const [guestOpen, setGuestOpen] = useState(false);
    const [guestTeam, setGuestTeam] = useState<'home' | 'away'>('home');
    const [guestFirstName, setGuestFirstName] = useState('');
    const [guestLastName, setGuestLastName] = useState('');
    const [guestShirtNumber, setGuestShirtNumber] = useState('');
    const [addingGuest, setAddingGuest] = useState(false);

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const matchId = params?.matchId ? String(params.matchId) : '';

    // Safe response parser: JSON if possible, else fall back to text
    const parseResponse = useCallback(async (res: Response) => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                return await res.json();
            } catch {
                return { success: res.ok, message: await res.text() };
            }
        }
        return { success: res.ok, message: await res.text() };
    }, []);

    const fetchLeagueAndMatchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [leagueRes, matchRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                // FIX: correct endpoint (remove `/n/`)
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const leagueData = await parseResponse(leagueRes);
            const matchData = await parseResponse(matchRes);

            if (leagueData.success) {
                setLeague(leagueData.league);
            } else {
                throw new Error(leagueData.message || 'Failed to fetch league details');
            }

            if (matchData.success) {
                const fetchedMatch: Match = matchData.match;
                setMatch(fetchedMatch);
                setHomeTeamName(fetchedMatch.homeTeamName);
                setAwayTeamName(fetchedMatch.awayTeamName);
                setMatchDate(new Date(fetchedMatch.date));
                setLocation(fetchedMatch.location);
                setHomeTeamUsers(fetchedMatch.homeTeamUsers || []);
                setAwayTeamUsers(fetchedMatch.awayTeamUsers || []);
                setHomeCaptain(fetchedMatch.homeTeamUsers?.find((u: User) => u.id === fetchedMatch.homeCaptainId) || null);
                setAwayCaptain(fetchedMatch.awayTeamUsers?.find((u: User) => u.id === fetchedMatch.awayCaptainId) || null);

                if (fetchedMatch.homeTeamImage) {
                    setHomeTeamImagePreview(`${process.env.NEXT_PUBLIC_API_URL}${fetchedMatch.homeTeamImage}`);
                }
                if (fetchedMatch.awayTeamImage) {
                    setAwayTeamImagePreview(`${process.env.NEXT_PUBLIC_API_URL}${fetchedMatch.awayTeamImage}`);
                }

                // Initialize guests
                const allGuests: Guest[] = (fetchedMatch.guests as Guest[] | undefined) || [];
                const initHome = (fetchedMatch.homeGuests as Guest[] | undefined) || allGuests.filter(g => g.team === 'home');
                const initAway = (fetchedMatch.awayGuests as Guest[] | undefined) || allGuests.filter(g => g.team === 'away');
                setHomeGuests(initHome);
                setAwayGuests(initAway);
            } else {
                throw new Error(matchData.message || 'Failed to fetch match details');
            }

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [leagueId, matchId, token, parseResponse]);

    useEffect(() => {
        if (leagueId && matchId && token) {
            fetchLeagueAndMatchDetails();
        }
    }, [leagueId, matchId, token, fetchLeagueAndMatchDetails]);

    const handleHomeTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                if (file.size <= 5 * 1024 * 1024) { // 5MB limit
                    setHomeTeamImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setHomeTeamImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    toast.error('File size should be less than 5MB');
                }
            } else {
                toast.error('Please select an image file');
            }
        }
    };

    const handleAwayTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                if (file.size <= 5 * 1024 * 1024) { // 5MB limit
                    setAwayTeamImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setAwayTeamImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    toast.error('File size should be less than 5MB');
                }
            } else {
                toast.error('Please select an image file');
            }
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

    // NEW: Add a guest to existing match
    const handleAddGuest = async () => {
        if (!guestFirstName.trim() || !guestLastName.trim()) {
            toast.error('Enter first and last name');
            return;
        }
        setAddingGuest(true);
        try {
            const payload: Guest = {
                team: guestTeam,
                firstName: guestFirstName.trim(),
                lastName: guestLastName.trim(),
                shirtNumber: guestShirtNumber || undefined,
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/guests`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : { success: res.ok };

            if (!res.ok || data.success === false) {
                throw new Error(data.message || 'Failed to add guest.');
            }

            const saved: Guest = data.guest || payload;
            if (saved.team === 'home') setHomeGuests(prev => [saved, ...prev]);
            else setAwayGuests(prev => [saved, ...prev]);

            toast.success('Guest added');
            setGuestOpen(false);
            setGuestTeam('home');
            setGuestFirstName('');
            setGuestLastName('');
            setGuestShirtNumber('');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to add guest.');
        } finally {
            setAddingGuest(false);
        }
    };

    // NEW: Remove guest (if API supports DELETE)
    const handleRemoveGuest = async (guest: Guest, team: 'home' | 'away', index: number) => {
        try {
            if (guest.id) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/guests/${guest.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.message || 'Failed to remove guest.');
                }
            }
            if (team === 'home') setHomeGuests(prev => prev.filter((_, i) => i !== index));
            else setAwayGuests(prev => prev.filter((_, i) => i !== index));
            toast.success('Guest removed');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to remove guest.');
        }
    };

    const handleUpdateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!matchDate) {
            setError('Please select a valid date for the match.');
            setIsSubmitting(false);
            return;
        }

        const homeCaptainId = homeTeamUsers.find(u => u.id === homeCaptain?.id)?.id || null;
        const awayCaptainId = awayTeamUsers.find(u => u.id === awayCaptain?.id)?.id || null;

        try {
            const formData = new FormData();
            formData.set('homeTeamName', homeTeamName);
            formData.set('awayTeamName', awayTeamName);
            formData.set('date', matchDate.toISOString());
            formData.set('location', location);
            formData.set('homeTeamUsers', JSON.stringify(homeTeamUsers.map(u => u.id)));
            formData.set('awayTeamUsers', JSON.stringify(awayTeamUsers.map(u => u.id)));
            if (homeCaptainId) formData.set('homeCaptainId', homeCaptainId);
            if (awayCaptainId) formData.set('awayCaptainId', awayCaptainId);
            if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
            if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            // Use safe parser here too to avoid JSON errors
            const result = await parseResponse(response);

            if (result.success) {
                if (result.match) cacheManager.updateMatchesCache(result.match);
                toast.success('Match updated successfully!');
                router.push(`/league/${leagueId}`);
            } else {
                throw new Error(result.message || 'Failed to update match.');
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

    if (error || !league || !match) {
        return (
            <Box sx={{ p: 4, minHeight: '100vh', color: 'white' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white' }}>
                    Back to League
                </Button>
                <Typography color="error">{error || 'Could not load league or match data.'}</Typography>
            </Box>
        );
    }

    const ShirtAvatar = ({ number, size = 56, borderColor }: { number?: string | number; size?: number; borderColor?: string }) => (
        <Box
            sx={{
                position: 'relative',
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                overflow: 'hidden',
                background: 'transparent',
            }}
        >
            <img
                src={ShirtImg.src}
                alt="Shirt"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                }}
            />
            <Typography
                component="span"
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    fontWeight: 800,
                    fontSize: size >= 56 ? 16 : 14,
                    color: '#111',
                    textShadow: '0 1px 1px rgba(255,255,255,0.6)',
                    lineHeight: 1,
                }}
            >
                {number || '0'}
            </Typography>
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, p: 4, minHeight: '100vh', color: '#E5E7EB' }}>
                {/* Edit Form Section - right on desktop */}
                <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                    <Paper
                        component="form"
                        onSubmit={handleUpdateMatch}
                        encType="multipart/form-data"
                        sx={{
                            p: 3,
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                            maxWidth: 700,
                            mx: 'auto',
                        }}
                    >
                        <Typography variant="h4" component="h1" gutterBottom>
                            Edit Match for {league.name}
                        </Typography>

                        {/* NEW: Add Guest button */}
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setGuestOpen(true)}
                            sx={{ mb: 2, borderColor: '#e56a16', color: '#e56a16', '&:hover': { borderColor: '#e56a16', backgroundColor: 'rgba(229,106,22,0.08)' } }}
                        >
                            Add Guest Player
                        </Button>

                        <TextField
                            label="Home Team Name"
                            value={homeTeamName}
                            onChange={(e) => setHomeTeamName(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            sx={{
                                backgroundColor: "transparent",
                                border:'1px solid white',
                                color: 'white',
                                input: { color: 'white' },
                            }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                        <Autocomplete
                            multiple
                            options={league.members.filter(m => !awayTeamUsers.find(p => p.id === m.id))}
                            disableCloseOnSelect
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={homeTeamUsers}
                            onChange={(event, newValue) => { setHomeTeamUsers(newValue); }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={`${option.firstName} ${option.lastName}`}
                                        sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                    />
                                ))
                            }
                            renderOption={(props, option, { selected }) => (
                                <li {...props} style={{ color: 'white' }}>
                                    <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                    {`${option.firstName} ${option.lastName}`}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Home Team Players" InputLabelProps={{ style: { color: 'white' } }} sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' }, '.MuiSvgIcon-root': { color: 'white' } }} />
                            )}
                        />
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                                Home Team Image (Optional)
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="home-team-image-upload"
                                    type="file"
                                    onChange={handleHomeTeamImageUpload}
                                />
                                <TextField
                                    fullWidth
                                    label="Upload Home Team Image"
                                    value={homeTeamImage ? homeTeamImage.name : ''}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <label htmlFor="home-team-image-upload">
                                                    <Button
                                                        component="span"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            color: '#43a047',
                                                            borderColor: '#43a047',
                                                            '&:hover': { borderColor: '#388e3c', backgroundColor: 'rgba(67, 160, 71, 0.1)' }
                                                        }}
                                                    >
                                                        Browse
                                                    </Button>
                                                </label>
                                                {homeTeamImage && (
                                                    <IconButton
                                                        onClick={handleRemoveHomeTeamImage}
                                                        size="small"
                                                        sx={{ color: '#f44336' }}
                                                    >
                                                        <X />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        )
                                    }}
                                    sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }}
                                />
                            </Box>
                            {homeTeamImagePreview && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={homeTeamImagePreview}
                                        alt="Home Team Preview"
                                        sx={{ width: 40, height: 40, border: '2px solid #43a047' }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#B2DFDB' }}>
                                        Image preview
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {homeTeamUsers.length > 0 && (
                            <Autocomplete
                                options={homeTeamUsers}
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={homeCaptain}
                                onChange={(event, newValue) => setHomeCaptain(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} sx={{ mt: 2, mb: 1, input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }} label="Select Home Team Captain" required />
                                )}
                            />
                        )}
                        <TextField
                            label="Away Team Name"
                            value={awayTeamName}
                            onChange={(e) => setAwayTeamName(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ style: { color: 'white' } }}
                            sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }}
                        />
                        <Autocomplete
                            multiple
                            options={league.members.filter(m => !homeTeamUsers.find(p => p.id === m.id))}
                            disableCloseOnSelect
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={awayTeamUsers}
                            onChange={(event, newValue) => { setAwayTeamUsers(newValue); }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={`${option.firstName} ${option.lastName}`}
                                        sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                    />
                                ))
                            }
                            renderOption={(props, option, { selected }) => (
                                <li {...props} style={{ color: 'black' }}>
                                    <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                    {`${option.firstName} ${option.lastName}`}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Away Team Players" InputLabelProps={{ style: { color: 'white' } }} sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' }, '.MuiSvgIcon-root': { color: 'white' } }} />
                            )}
                        />
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                                Away Team Image (Optional)
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="away-team-image-upload"
                                    type="file"
                                    onChange={handleAwayTeamImageUpload}
                                />
                                <TextField
                                    fullWidth
                                    label="Upload Away Team Image"
                                    value={awayTeamImage ? awayTeamImage.name : ''}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <label htmlFor="away-team-image-upload">
                                                    <Button
                                                        component="span"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            color: '#ef5350',
                                                            borderColor: '#ef5350',
                                                            '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(239, 83, 80, 0.1)' }
                                                        }}
                                                    >
                                                        Browse
                                                    </Button>
                                                </label>
                                                {awayTeamImage && (
                                                    <IconButton
                                                        onClick={handleRemoveAwayTeamImage}
                                                        size="small"
                                                        sx={{ color: '#f44336' }}
                                                    >
                                                        <X />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        )
                                    }}
                                    sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }}
                                />
                            </Box>
                            {awayTeamImagePreview && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={awayTeamImagePreview}
                                        alt="Away Team Preview"
                                        sx={{ width: 40, height: 40, border: '2px solid #ef5350' }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#EF9A9A' }}>
                                        Image preview
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        {awayTeamUsers.length > 0 && (
                            <Autocomplete
                                options={awayTeamUsers}
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={awayCaptain}
                                onChange={(event, newValue) => setAwayCaptain(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} sx={{ mt: 2, mb: 1, input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }} label="Select Away Team Captain" required />
                                )}
                            />
                        )}
                        <DateTimePicker
                            label="Match Date & Time"
                            value={matchDate}
                            onChange={setMatchDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    margin: "normal",
                                    required: true,
                                    sx: { svg: { color: 'white' }, input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }
                                }
                            }}
                        />
                        <TextField
                            label="Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ style: { color: 'white' } }}
                            sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }}
                        />
                        {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                mt: 2,
                                background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                                color: 'white',
                                fontWeight: 'bold',
                                '&:hover': {
                                    background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                },
                                transition: 'all 0.2s ease-in-out',
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Update Match'}
                        </Button>
                    </Paper>
                </Box>
                {/* Live Preview Section */}
                <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                    <Paper
                        sx={{
                            p: 2,
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                        }}
                    >
                        <Box
                            sx={{
                                // bgcolor: '#111',
                                borderRadius: 2,
                                p: 1,
                                mb: 1,
                                // boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography variant="h5" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                                Live Preview
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.12)' }} />

                        <Box sx={{
                            display: { xs: 'block', md: 'flex' },
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 2,
                        }}>
                            {/* Home Team (left side) */}
                            <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                    <Avatar
                                        src={homeTeamImagePreview || '/assets/default-team.png'}
                                        alt="Home Team"
                                        sx={{ width: 40, height: 40, mr: 1, border: '2px solid #e56a16' }}
                                    />
                                    <Typography variant="h6" sx={{ color: '#E5E7EB', textAlign: 'center' }}>
                                        {homeTeamName || 'Home Team'}
                                    </Typography>
                                </Box>
                                {/* Captain */}
                                {homeCaptain && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                        <Link href={`/player/${homeCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                            <ShirtAvatar number={homeCaptain.shirtNumber} size={56} />
                                            <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Typography fontWeight="bold" fontSize={14} sx={{ mt: 0.5 }} noWrap>{homeCaptain.firstName} {homeCaptain.lastName}</Typography>
                                                <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                            </Box>
                                        </Link>
                                    </Box>
                                )}
                                {/* Other players */}
                                {homeTeamUsers.filter(u => u.id !== homeCaptain?.id).map(user => (
                                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.2, width: '100%' }}>
                                        <Link href={`/player/${user?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                            <ShirtAvatar number={user.shirtNumber} size={48} />
                                            <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Typography fontWeight={user.id === homeCaptain?.id ? 700 : 500} fontSize={user.id === homeCaptain?.id ? 15 : 14} noWrap sx={{ color: 'white' }}>
                                                    {user.firstName} {user.lastName}
                                                </Typography>
                                                {user.id === homeCaptain?.id && (
                                                    <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>
                                                        Captain
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Link>
                                    </Box>
                                ))}
                                {/* NEW: Home Guests */}
                                {homeGuests.map((g, i) => (
                                    <Box key={`home-guest-${g.id ?? i}`} sx={{ display: 'flex', alignItems: 'center', mb: 1.2 }}>
                                        <ShirtAvatar number={g.shirtNumber || 'G'} size={48} />
                                        <Box sx={{ ml: 2, flex: 1 }}>
                                            <Typography fontWeight={600} fontSize={14} noWrap sx={{ color: '#E5E7EB' }}>
                                                {g.firstName} {g.lastName}
                                            </Typography>
                                            <Typography fontSize={12} sx={{ color: '#9CA3AF' }}>Guest</Typography>
                                        </Box>
                                        <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => handleRemoveGuest(g, 'home', i)}>
                                            <X size={16} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Center Line */}
                            <Box sx={{ width: 2, bgcolor: 'rgba(255,255,255,0.2)', minHeight: 180, borderRadius: 1, mx: 2, alignSelf: 'stretch' }} />

                            {/* Away Team (right side) */}
                            <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                    <Avatar
                                        src={awayTeamImagePreview || '/assets/default-team.png'}
                                        alt="Away Team"
                                        sx={{ width: 40, height: 40, mr: 1, border: '2px solid #e56a16' }}
                                    />
                                    <Typography variant="h6" sx={{ color: '#E5E7EB', textAlign: 'center' }}>
                                        {awayTeamName || 'Away Team'}
                                    </Typography>
                                </Box>
                                {/* Captain */}
                                {awayCaptain && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                        <Link href={`/player/${awayCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                            <ShirtAvatar number={awayCaptain.shirtNumber} size={56} borderColor="gold" />
                                            <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Typography fontWeight="bold" fontSize={14} sx={{ mt: 0.5 }} noWrap>{awayCaptain.firstName} {awayCaptain.lastName}</Typography>
                                                <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                            </Box>
                                        </Link>
                                    </Box>
                                )}
                                {/* Other players */}
                                {awayTeamUsers.filter(u => u.id !== awayCaptain?.id).map(user => (
                                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.2, width: '100%' }}>
                                        <Link href={`/player/${user?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                            <ShirtAvatar number={user.shirtNumber} size={48} />
                                            <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Typography fontWeight={user.id === awayCaptain?.id ? 700 : 500} fontSize={user.id === awayCaptain?.id ? 15 : 14} noWrap sx={{ color: 'white' }}>
                                                    {user.firstName} {user.lastName}
                                                </Typography>
                                                {user.id === awayCaptain?.id && (
                                                    <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>
                                                        Captain
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Link>
                                    </Box>
                                ))}
                                {/* NEW: Away Guests */}
                                {awayGuests.map((g, i) => (
                                    <Box key={`away-guest-${g.id ?? i}`} sx={{ display: 'flex', alignItems: 'center', mb: 1.2 }}>
                                        <ShirtAvatar number={g.shirtNumber || 'G'} size={48} />
                                        <Box sx={{ ml: 2, flex: 1 }}>
                                            <Typography fontWeight={600} fontSize={14} noWrap sx={{ color: '#E5E7EB' }}>
                                                {g.firstName} {g.lastName}
                                            </Typography>
                                            <Typography fontSize={12} sx={{ color: '#9CA3AF' }}>Guest</Typography>
                                        </Box>
                                        <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => handleRemoveGuest(g, 'away', i)}>
                                            <X size={16} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* NEW: Guest Dialog */}
                <Dialog
                    open={guestOpen}
                    onClose={() => setGuestOpen(false)}
                    PaperProps={{
                        sx: {
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: 'white' }}>Add Guest Player</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth margin="normal" variant="outlined">
                            <InputLabel id="guest-team-label" sx={{ color: 'white' }}>Team</InputLabel>
                            <Select
                                labelId="guest-team-label"
                                id="guest-team"
                                value={guestTeam}
                                onChange={(e) => setGuestTeam(e.target.value as 'home' | 'away')}
                                label="Team"
                                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                            >
                                <MenuItem value="home" sx={{ color: 'white' }}>Home</MenuItem>
                                <MenuItem value="away" sx={{ color: 'white' }}>Away</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="First Name"
                            value={guestFirstName}
                            onChange={(e) => setGuestFirstName(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            sx={{
                                input: { color: 'white' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                            }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                        <TextField
                            label="Last Name"
                            value={guestLastName}
                            onChange={(e) => setGuestLastName(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            sx={{
                                input: { color: 'white' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                            }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                        <TextField
                            label="Shirt Number (Optional)"
                            value={guestShirtNumber}
                            onChange={(e) => setGuestShirtNumber(e.target.value)}
                            fullWidth
                            margin="normal"
                            sx={{
                                input: { color: 'white' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                            }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setGuestOpen(false)} sx={{ color: 'white' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddGuest}
                            disabled={addingGuest}
                            sx={{
                                color: 'white',
                                backgroundColor: '#e56a16',
                                '&:hover': {
                                    backgroundColor: '#d32f2f',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                },
                            }}
                        >
                            {addingGuest ? <CircularProgress size={24} color="inherit" /> : 'Add Guest'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
}