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

    // Add state for captains
    const [homeCaptain, setHomeCaptain] = useState<User | null>(null);
    const [awayCaptain, setAwayCaptain] = useState<User | null>(null);

    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const matchId = params?.matchId ? String(params.matchId) : '';

    const fetchLeagueAndMatchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [leagueRes, matchRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const leagueData = await leagueRes.json();
            const matchData = await matchRes.json();

            if (leagueData.success) {
                setLeague(leagueData.league);
            } else {
                throw new Error(leagueData.message || 'Failed to fetch league details');
            }

            if (matchData.success) {
                const fetchedMatch = matchData.match;
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

            } else {
                throw new Error(matchData.message || 'Failed to fetch match details');
            }

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [leagueId, matchId, token]);

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

    const handleUpdateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!matchDate) {
            setError('Please select a valid date for the match.');
            setIsSubmitting(false);
            return;
        }

        // ensure captains belong to current selections
        const homeCaptainId = homeTeamUsers.find(u => u.id === homeCaptain?.id)?.id || null;
        const awayCaptainId = awayTeamUsers.find(u => u.id === awayCaptain?.id)?.id || null;

        try {
            // Always multipart/form-data
            const formData = new FormData();
            formData.set('homeTeamName', homeTeamName);
            formData.set('awayTeamName', awayTeamName);
            formData.set('date', matchDate.toISOString());
            formData.set('location', location);

            // Server JSON.parse's these fields
            formData.set('homeTeamUsers', JSON.stringify(homeTeamUsers.map(u => u.id)));
            formData.set('awayTeamUsers', JSON.stringify(awayTeamUsers.map(u => u.id)));

            if (homeCaptainId) formData.set('homeCaptainId', homeCaptainId);
            if (awayCaptainId) formData.set('awayCaptainId', awayCaptainId);

            if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
            if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }, // do not set Content-Type manually
                body: formData,
            });

            const ct = response.headers.get('content-type') || '';
            const result = ct.includes('application/json')
                ? await response.json()
                : { success: false, message: await response.text() };

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
                // border: borderColor ? `2px solid ${borderColor}` : '1px solid rgba(255,255,255,0.2)',
                // boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
                                input: { color: 'white' }, // <-- This makes entered text white
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
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}