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
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
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

export default function ScheduleMatchPage() {
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
    const [homeTeamUsers, setHomeTeamUsers] = useState<User[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<User[]>([]);
    const [homeCaptain, setHomeCaptain] = useState<User | null>(null);
    const [awayCaptain, setAwayCaptain] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Team image upload
    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    // Staged guests and inline guest inputs
    const [homeGuests, setHomeGuests] = useState<GuestPlayerInput[]>([]);
    const [awayGuests, setAwayGuests] = useState<GuestPlayerInput[]>([]);
    const [homeGuestName, setHomeGuestName] = useState('');
    const [awayGuestName, setAwayGuestName] = useState('');

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';

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

    // Inline guest add/remove
    const addGuestByName = (team: 'home' | 'away') => {
        const raw = team === 'home' ? homeGuestName : awayGuestName;
        const name = raw.trim();
        if (!name) {
            toast.error('Enter guest name');
            return;
        }
        const parts = name.split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || 'Guest';
        const g: GuestPlayerInput = { team, firstName, lastName };

        if (team === 'home') {
            setHomeGuests(prev => [g, ...prev]);
            setHomeGuestName('');
        } else {
            setAwayGuests(prev => [g, ...prev]);
            setAwayGuestName('');
        }
        toast.success('Guest added');
    };

    const removeStagedGuest = (team: 'home' | 'away', index: number) => {
        if (team === 'home') setHomeGuests(prev => prev.filter((_, i) => i !== index));
        else setAwayGuests(prev => prev.filter((_, i) => i !== index));
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
                    body: JSON.stringify(g)
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

        try {
            const formData = new FormData();
            formData.append('homeTeamName', homeTeamName);
            formData.append('awayTeamName', awayTeamName);
            formData.append('date', start.toISOString());
            formData.append('start', start.toISOString());
            formData.append('end', end.toISOString());
            formData.append('location', location);
            formData.append('homeTeamUsers', JSON.stringify(homeTeamUsers.map(u => u.id)));
            formData.append('awayTeamUsers', JSON.stringify(awayTeamUsers.map(u => u.id)));
            formData.append('homeCaptain', homeCaptain?.id || '');
            formData.append('awayCaptain', awayCaptain?.id || '');
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

    const inputStyles = {
        "& .MuiOutlinedInput-root": {
            color: "#E5E7EB",
            backgroundColor: "transparent",
            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)", borderWidth: "1px" },
            "&.Mui-focused": {
                "& fieldset": { borderColor: "#e56a16", borderWidth: "2px" },
            },
            "& input": { color: "#E5E7EB", backgroundColor: "transparent" },
            "& .MuiInputBase-input": { color: "#E5E7EB", backgroundColor: "transparent" },
        },
        "& .MuiInputLabel-root": {
            color: "#9CA3AF",
            "&.Mui-focused": { color: "#e56a16" },
        },
        "& .MuiSvgIcon-root": { color: "#E5E7EB" },
    };

    const autocompleteStyles = {
        "& .MuiOutlinedInput-root": {
            color: "#E5E7EB",
            backgroundColor: "transparent",
            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)", borderWidth: "1px" },
            "&.Mui-focused": {
                "& fieldset": { borderColor: "#e56a16", borderWidth: "2px" },
                "& .MuiInputBase-input": { color: "#E5E7EB" },
            },
            "& .MuiInputBase-input": { color: "#E5E7EB", backgroundColor: "transparent" },
            "& .MuiChip-root": {
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#E5E7EB",
                "& .MuiChip-deleteIcon": { color: "#E5E7EB" },
            },
        },
        "& .MuiInputLabel-root": {
            color: "#9CA3AF",
            "&.Mui-focused": { color: "#e56a16" },
        },
        "& .MuiSvgIcon-root": { color: "#E5E7EB" },
    };

    const ShirtAvatar = ({ number, size = 56 }: { number?: string | number; size?: number; }) => (
        <Box sx={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, overflow: 'hidden', background: 'transparent' }}>
            <img src={ShirtImg.src} alt="Shirt" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, zIndex: 0 }} />
            <Typography component="span" sx={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize: size >= 56 ? 16 : 14, color: '#111', textShadow: '0 1px 1px rgba(255,255,255,0.6)', lineHeight: 1 }}>
                {number || '0'}
            </Typography>
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 4, minHeight: '100vh', color: '#E5E7EB' }}>
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Form Section */}
                    <Box sx={{ width: { xs: "100%", md: "58.33%" } }}>
                        <Paper component="form" onSubmit={handleScheduleMatch} sx={{
                            p: 3,
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                        }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                {league.name} Create a New Match
                            </Typography>

                            {/* Home team: name + image in one row */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                                <TextField
                                    label="Home Team Name"
                                    value={homeTeamName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHomeTeamName(e.target.value)}
                                    required
                                    fullWidth
                                    sx={{ ...inputStyles, flex: 1 }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="home-team-image-upload"
                                        type="file"
                                        onChange={handleHomeTeamImageUpload}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Home Team Image"
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
                                                        <IconButton onClick={handleRemoveHomeTeamImage} size="small" sx={{ color: '#f44336' }}>
                                                            <X />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            )
                                        }}
                                        sx={{ ...inputStyles }}
                                    />
                                </Box>
                            </Box>
                            {homeTeamImagePreview && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={homeTeamImagePreview} alt="Home Team Preview" sx={{ width: 40, height: 40, border: '2px solid #43a047' }} />
                                    <Typography variant="caption" sx={{ color: '#B2DFDB' }}>Image preview</Typography>
                                </Box>
                            )}

                            {/* Inline add guest for Home */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <TextField
                                    label="Add guest name (Home)"
                                    value={homeGuestName}
                                    onChange={(e) => setHomeGuestName(e.target.value)}
                                    fullWidth
                                    sx={inputStyles}
                                />
                                <Button variant="contained" onClick={() => addGuestByName('home')} sx={{ bgcolor: '#e56a16', '&:hover': { bgcolor: '#d32f2f' } }}>
                                    Add
                                </Button>
                            </Box>

                            {/* Home players */}
                            <Autocomplete
                                multiple
                                options={league.members.filter((m) => !awayTeamUsers.find((p) => p.id === m.id))}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={homeTeamUsers}
                                onChange={(event, newValue) => {
                                    setHomeTeamUsers(newValue)
                                    if (homeCaptain && !newValue.some((u) => u.id === homeCaptain.id)) setHomeCaptain(null)
                                }}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} style={{ color: "black", backgroundColor: selected ? "#e3f2fd" : "white" }}>
                                        <Checkbox
                                            icon={<span style={{ width: 16, height: 16, border: "1px solid #666", borderRadius: 2 }} />}
                                            checkedIcon={<span style={{ width: 16, height: 16, backgroundColor: "#1976d2", borderRadius: 2 }} />}
                                            sx={{ marginRight: 1 }}
                                            checked={selected}
                                        />
                                        {`${option.firstName} ${option.lastName}`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Home Team Players" placeholder="Players" sx={{ mt: 2, ...autocompleteStyles }} />
                                )}
                                sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                            />
                            {homeTeamUsers.length > 0 && (
                                <Autocomplete
                                    options={homeTeamUsers}
                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                    value={homeCaptain}
                                    onChange={(event, newValue) => setHomeCaptain(newValue)}
                                    renderInput={(params) => (
                                        <TextField {...params} sx={{ mt: 2, ...inputStyles }} label="Select Home Team Captain" required />
                                    )}
                                    sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                                />
                            )}

                            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />

                            {/* Away team: name + image in one row */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    label="Away Team Name"
                                    value={awayTeamName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwayTeamName(e.target.value)}
                                    required
                                    fullWidth
                                    sx={{ ...inputStyles, flex: 1 }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="away-team-image-upload"
                                        type="file"
                                        onChange={handleAwayTeamImageUpload}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Away Team Image"
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
                                                        <IconButton onClick={handleRemoveAwayTeamImage} size="small" sx={{ color: '#f44336' }}>
                                                            <X />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            )
                                        }}
                                        sx={{ ...inputStyles }}
                                    />
                                </Box>
                            </Box>
                            {awayTeamImagePreview && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={awayTeamImagePreview} alt="Away Team Preview" sx={{ width: 40, height: 40, border: '2px solid #ef5350' }} />
                                    <Typography variant="caption" sx={{ color: '#EF9A9A' }}>Image preview</Typography>
                                </Box>
                            )}

                            {/* Inline add guest for Away */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <TextField
                                    label="Add guest name (Away)"
                                    value={awayGuestName}
                                    onChange={(e) => setAwayGuestName(e.target.value)}
                                    fullWidth
                                    sx={inputStyles}
                                />
                                <Button variant="contained" onClick={() => addGuestByName('away')} sx={{ bgcolor: '#e56a16', '&:hover': { bgcolor: '#d32f2f' } }}>
                                    Add
                                </Button>
                            </Box>

                            {/* Away players */}
                            <Autocomplete
                                multiple
                                options={league.members.filter((m) => !homeTeamUsers.find((p) => p.id === m.id))}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={awayTeamUsers}
                                onChange={(event, newValue) => {
                                    setAwayTeamUsers(newValue)
                                    if (awayCaptain && !newValue.some((u) => u.id === awayCaptain.id)) setAwayCaptain(null)
                                }}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} style={{ color: "black", backgroundColor: selected ? "#e3f2fd" : "white" }}>
                                        <Checkbox
                                            icon={<span style={{ width: 16, height: 16, border: "1px solid #666", borderRadius: 2 }} />}
                                            checkedIcon={<span style={{ width: 16, height: 16, backgroundColor: "#1976d2", borderRadius: 2 }} />}
                                            sx={{ marginRight: 1 }}
                                            checked={selected}
                                        />
                                        {`${option.firstName} ${option.lastName}`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Away Team Players" placeholder="Players" sx={{ mt: 2, ...autocompleteStyles }} />
                                )}
                                sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                            />
                            {awayTeamUsers.length > 0 && (
                                <Autocomplete
                                    options={awayTeamUsers}
                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                    value={awayCaptain}
                                    onChange={(event, newValue) => setAwayCaptain(newValue)}
                                    renderInput={(params) => (
                                        <TextField {...params} sx={{ mt: 2, ...inputStyles }} label="Select Away Team Captain" required />
                                    )}
                                    sx={{ "& .MuiAutocomplete-popupIndicator": { color: "white" }, "& .MuiAutocomplete-clearIndicator": { color: "white" } }}
                                />
                            )}
                            <DatePicker
                                label="Match Date"
                                value={matchDate}
                                onChange={(newValue) => setMatchDate(dayjs(newValue))}
                                slotProps={{ textField: { fullWidth: true, margin: "normal", required: true, sx: inputStyles } }}
                            />
                            <TimePicker
                                label="Start Time"
                                value={startTime}
                                onChange={(newValue) => setStartTime(dayjs(newValue))}
                                slotProps={{ textField: { fullWidth: true, margin: "normal", required: true, sx: inputStyles } }}
                            />
                            <TextField
                                label="Match Duration (minutes)"
                                type="number"
                                value={duration}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setDuration(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                required
                                fullWidth
                                sx={{ mt: 2, mb: 1, ...inputStyles }}
                            />
                            <TextField
                                label="Location"
                                value={location}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                                required
                                fullWidth
                                sx={{ mt: 2, mb: 1, ...inputStyles }}
                            />

                            {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                sx={{
                                    background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    '&:hover': {
                                        background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                    },
                                    mt: 2,
                                    transition: 'all 0.2s ease-in-out',
                                }}
                                disabled={isSubmitting || league?.active === false}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : "Schedule Match"}
                            </Button>
                        </Paper>
                    </Box>

                    {/* Live Preview Section */}
                    <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                        <Paper sx={{
                            p: 2,
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                        }}>
                            <Box sx={{ borderRadius: 2, p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h5" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                                    Live Preview
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.12)' }} />

                            <Box sx={{ display: { xs: 'block', md: 'flex' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                {/* Home */}
                                <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                        <Avatar src={homeTeamImagePreview || '/assets/default-team.png'} alt="Home Team" sx={{ width: 40, height: 40, mr: 1, border: '2px solid #e56a16' }} />
                                        <Typography variant="h6" sx={{ color: '#E5E7EB', textAlign: 'center' }}>
                                            {homeTeamName || 'Home Team'}
                                        </Typography>
                                    </Box>
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
                                    {homeTeamUsers.filter(u => u.id !== homeCaptain?.id).map(user => (
                                        <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.2, width: '100%' }}>
                                            <Link href={`/player/${user?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                                <ShirtAvatar number={user.shirtNumber} size={48} />
                                                <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Typography fontWeight={user.id === homeCaptain?.id ? 700 : 500} fontSize={user.id === homeCaptain?.id ? 15 : 14} noWrap sx={{ color: 'white' }}>
                                                        {user.firstName} {user.lastName}
                                                    </Typography>
                                                </Box>
                                            </Link>
                                        </Box>
                                    ))}
                                    {homeGuests.map((g, i) => (
                                        <Box key={`hg-staged-${i}`} sx={{ display: 'flex', alignItems: 'center', mb: 1.2 }}>
                                            <ShirtAvatar number={g.shirtNumber || 'G'} size={48} />
                                            <Box sx={{ ml: 2, flex: 1 }}>
                                                <Typography fontWeight={600} fontSize={14} noWrap sx={{ color: '#E5E7EB' }}>
                                                    {g.firstName} {g.lastName}
                                                </Typography>
                                                <Typography fontSize={12} sx={{ color: '#9CA3AF' }}>Guest (staged)</Typography>
                                            </Box>
                                            <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => removeStagedGuest('home', i)}>
                                                <X size={16} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Divider */}
                                <Box sx={{ width: 2, bgcolor: 'rgba(255,255,255,0.2)', minHeight: 180, borderRadius: 1, mx: 2, alignSelf: 'stretch' }} />

                                {/* Away */}
                                <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                        <Avatar src={awayTeamImagePreview || '/assets/default-team.png'} alt="Away Team" sx={{ width: 40, height: 40, mr: 1, border: '2px solid #e56a16' }} />
                                        <Typography variant="h6" sx={{ color: '#E5E7EB', textAlign: 'center' }}>
                                            {awayTeamName || 'Away Team'}
                                        </Typography>
                                    </Box>
                                    {awayCaptain && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                            <Link href={`/player/${awayCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                                <ShirtAvatar number={awayCaptain.shirtNumber} size={56} />
                                                <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Typography fontWeight="bold" fontSize={14} sx={{ mt: 0.5 }} noWrap>{awayCaptain.firstName} {awayCaptain.lastName}</Typography>
                                                    <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                </Box>
                                            </Link>
                                        </Box>
                                    )}
                                    {awayTeamUsers.filter(u => u.id !== awayCaptain?.id).map(user => (
                                        <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.2, width: '100%' }}>
                                            <Link href={`/player/${user?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                                <ShirtAvatar number={user.shirtNumber} size={48} />
                                                <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Typography fontWeight={user.id === awayCaptain?.id ? 700 : 500} fontSize={user.id === awayCaptain?.id ? 15 : 14} noWrap sx={{ color: 'white' }}>
                                                        {user.firstName} {user.lastName}
                                                    </Typography>
                                                </Box>
                                            </Link>
                                        </Box>
                                    ))}
                                    {awayGuests.map((g, i) => (
                                        <Box key={`ag-staged-${i}`} sx={{ display: 'flex', alignItems: 'center', mb: 1.2 }}>
                                            <ShirtAvatar number={g.shirtNumber || 'G'} size={48} />
                                            <Box sx={{ ml: 2, flex: 1 }}>
                                                <Typography fontWeight={600} fontSize={14} noWrap sx={{ color: '#E5E7EB' }}>
                                                    {g.firstName} {g.lastName}
                                                </Typography>
                                                <Typography fontSize={12} sx={{ color: '#9CA3AF' }}>Guest (staged)</Typography>
                                            </Box>
                                            <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => removeStagedGuest('away', i)}>
                                                <X size={16} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>

            <Toaster position="top-center" reverseOrder={false} />
        </LocalizationProvider>
    );
}