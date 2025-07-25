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
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

    const handleUpdateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!matchDate) {
            setError("Please select a valid date for the match.");
            setIsSubmitting(false);
            return;
        }

        const matchData = {
            homeTeamName,
            awayTeamName,
            date: matchDate.toISOString(),
            location,
            homeTeamUsers: homeTeamUsers.map(u => u.id),
            awayTeamUsers: awayTeamUsers.map(u => u.id),
            homeCaptainId: homeCaptain?.id, // <-- use correct key
            awayCaptainId: awayCaptain?.id, // <-- use correct key
        };
        console.log('first', matchData)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(matchData),
            });

            const result = await response.json();
            if (result.success) {
                toast.success('Match updated successfully!'); // Or use a toast notification
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
    
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, p: 4, minHeight: '100vh', color: 'white' }}>
                {/* Edit Form Section - right on desktop */}
                <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                    <Paper component="form" onSubmit={handleUpdateMatch} sx={{ p: 3, backgroundColor: '#1f673b', color: 'white', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', border: '1px solid #235235', maxWidth: 700, mx: 'auto' }}>
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
                            InputLabelProps={{ style: { color: 'white' } }}
                            sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' } }}
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
                            <li {...props} style={{ color: 'black' }}>
                                <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                {`${option.firstName} ${option.lastName}`}
                            </li>
                        )}
                        renderInput={(params) => (
                                <TextField {...params} label="Select Home Team Players" InputLabelProps={{ style: { color: 'white' } }} sx={{ input: { color: 'white' }, label: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'white' }, '&:hover fieldset': { borderColor: 'white' }, '&.Mui-focused fieldset': { borderColor: 'white' } }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiInputLabel-root.Mui-focused': { color: 'white' }, '.MuiSvgIcon-root': { color: 'white' } }} />
                            )}
                        />
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
                        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, bgcolor: '#43a047', color: 'white', fontWeight: 'bold', '&:hover': { bgcolor: '#388e3c' } }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Update Match'}
                    </Button>
                </Paper>
                </Box>
                {/* Live Preview Section - left on desktop */}
                <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                    <Paper sx={{ p: 2, backgroundColor: '#1f673b', color: 'white', position: 'sticky', top: '20px' }}>
                        <Typography variant="h5" gutterBottom>Live Preview</Typography>
                        <Divider sx={{ mb: 2, borderColor: 'white' }} />
                        <Box sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 4, minHeight: 250, width: '100%' }}>
                            {/* Home Team Preview */}
                            <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                <Typography variant="h6" sx={{ color: '#66bb6a', textAlign: 'center' }}>{homeTeamName || 'Home Team'}</Typography>
                                {homeTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, mt: 1, width: '100%' }}>
                                        {/* Captain at top */}
                                        {homeCaptain && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                                <Link href={`/player/${homeCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                                    <Image
                                                        src={homeCaptain.profilePicture || '/assets/group.svg'}
                                                        alt={homeCaptain.firstName}
                                                        style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid gold', objectFit: 'cover' }}
                                                        width={56} height={56}
                                                    />
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
                                                    <Box sx={{ minWidth: 48, maxWidth: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <img
                                                            src={user.profilePicture ? user.profilePicture : "/assets/group.svg"}
                                                            alt={user.firstName}
                                                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: user.id === homeCaptain?.id ? '2px solid gold' : 'none' }}
                                                        />
                                                    </Box>
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
                                ) : <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Select players...</Typography>}
                            </Box>
                            {/* Center Line */}
                            <Box sx={{ width: 2, bgcolor: 'white', minHeight: 180, borderRadius: 1, mx: 2, display: { xs: 'none', md: 'block' } }} />
                            {/* Away Team Preview */}
                            <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                <Typography variant="h6" sx={{ color: '#ef5350', textAlign: 'center' }}>{awayTeamName || 'Away Team'}</Typography>
                                {awayTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, mt: 1, width: '100%' }}>
                                        {/* Captain at top */}
                                        {awayCaptain && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                                <Link href={`/player/${awayCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                                    <Image
                                                        src={awayCaptain.profilePicture || '/assets/group.svg'}
                                                        alt={awayCaptain.firstName}
                                                        style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid gold', objectFit: 'cover' }}
                                                        width={56} height={56}
                                                    />
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
                                                    <Box sx={{ minWidth: 48, maxWidth: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <img
                                                            src={user.profilePicture || '/assets/group.svg'}
                                                            alt={user.firstName}
                                                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: user.id === awayCaptain?.id ? '2px solid gold' : 'none' }}
                                                        />
                                                    </Box>
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
                                ) : <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Select players...</Typography>}
                            </Box>
                        </Box>
                    </Paper>
                </Box>

            </Box>
        </LocalizationProvider>
    );
} 