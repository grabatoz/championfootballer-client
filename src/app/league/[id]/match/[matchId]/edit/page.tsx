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
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    location: string;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
}

interface Match {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    date: string;
    location: string;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
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
        };
        console.log('first',matchData)

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
                alert('Match updated successfully!'); // Or use a toast notification
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
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fff' }}><CircularProgress /></Box>;
    }
    
    if (error || !league || !match) {
        return (
            <Box sx={{ p: 4, backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white' }}>
                    Back to League
                </Button>
                <Typography color="error">{error || 'Could not load league or match data.'}</Typography>
            </Box>
        );
    }
    
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 4, backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white' }}>
                    Back to League
                </Button>
                <Paper component="form" onSubmit={handleUpdateMatch} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
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
                        InputLabelProps={{ sx: { color: 'white' } }}
                        sx={{ input: { color: 'white' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
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
                            <TextField {...params} label="Select Home Team Players" InputLabelProps={{ sx: { color: 'white' } }} sx={{ input: { color: 'white' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: 'white'} }} />
                        )}
                    />

                    <TextField
                        label="Away Team Name"
                        value={awayTeamName}
                        onChange={(e) => setAwayTeamName(e.target.value)}
                        required
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ sx: { color: 'white' } }}
                        sx={{ input: { color: 'white' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
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
                            <TextField {...params} label="Select Away Team Players" InputLabelProps={{ sx: { color: 'white' } }} sx={{ input: { color: 'white' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: 'white'} }} />
                        )}
                    />

                    <DateTimePicker
                        label="Match Date & Time"
                        value={matchDate}
                        onChange={setMatchDate}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                margin: "normal",
                                required: true,
                                sx: { svg: { color: 'white' }, input: { color: 'white' }, label: { color: 'white' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }
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
                        InputLabelProps={{ sx: { color: 'white' } }}
                        sx={{ input: { color: 'white' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
                    />
                    
                    {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
                    
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Update Match'}
                    </Button>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
} 