'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    CircularProgress,
    Autocomplete,
    Checkbox,
    Grid,
    Divider,
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ResponsiveCard from '@/Components/card/card';

// Assuming User and League interfaces are available or defined here
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

// Add PlayerCardProps interface for the preview
interface PlayerCardProps {
    name: string;
    number: string;
    level: string;
    stats: { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string; };
    foot: string;
    shirtIcon: string;
    profileImage?: string;
    isCaptain?: boolean;
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function ScheduleMatchPage() {
    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [matchDate, setMatchDate] = useState<Date | null>(new Date());
    const [startTime, setStartTime] = useState<Date | null>(new Date());
    const [duration, setDuration] = useState<number | ''>(90); // default 90 minutes
    const [location, setLocation] = useState('');
    const [homeTeamUsers, setHomeTeamUsers] = useState<User[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<User[]>([]);
    const [homeCaptain, setHomeCaptain] = useState<User | null>(null); // captain for home team
    const [awayCaptain, setAwayCaptain] = useState<User | null>(null); // captain for away team
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params.id as string;

    const fetchLeagueMembers = async () => {
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
    };
    
    useEffect(() => {
        if (leagueId && token) {
            fetchLeagueMembers();
        }
    }, [leagueId, token]);
    // Mapper function for the preview cards
    const mapUserToCardProps = (user: any, isCaptain: boolean): PlayerCardProps => ({
        name: `${user.firstName || ''} ${user.lastName || ''}`,
        number: user.shirtNumber || '10',
        level: user.level || '1',
        stats: {
            DRI: user.skills?.dribbling?.toString() || '50',
            SHO: user.skills?.shooting?.toString() || '50',
            PAS: user.skills?.passing?.toString() || '50',
            PAC: user.skills?.pace?.toString() || '50',
            DEF: user.skills?.defending?.toString() || '50',
            PHY: user.skills?.physical?.toString() || '50'
        },
        foot: user.preferredFoot === 'right' ? 'R' : 'L',
        profileImage: user.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}` : undefined,
        isCaptain,
        shirtIcon: ''
    });

    const handleScheduleMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!matchDate || !startTime) {
            setError('Please select a valid date and time for the match.');
            setIsSubmitting(false);
            return;
        }
        if (!homeCaptain || !awayCaptain) { // require captains
            setError('Please select a captain for both teams.');
            setIsSubmitting(false);
            return;
        }

        // Combine date and time
        const start = new Date(matchDate);
        start.setHours(startTime.getHours());
        start.setMinutes(startTime.getMinutes());
        start.setSeconds(0);
        start.setMilliseconds(0);

        const matchDuration = duration || 90; // fallback to 90 if undefined
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + matchDuration);

        const matchData = {
            homeTeamName,
            awayTeamName,
            date: start.toISOString(),
            start: start.toISOString(),
            end: end.toISOString(),
            location,
            homeTeamUsers: homeTeamUsers.map(u => u.id),
            awayTeamUsers: awayTeamUsers.map(u => u.id),
            homeCaptain: homeCaptain?.id, // send home captain
            awayCaptain: awayCaptain?.id, // send away captain
        };

        console.log('match data',matchData)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(matchData),
            });

            const result = await response.json();
            if (result.success) {
                alert('Match scheduled successfully!');
                router.push(`/league/${leagueId}`);
            } else {
                throw new Error(result.message || 'Failed to schedule match.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#ffff' }}><CircularProgress /></Box>;
    }
    
    if (error || !league) {
        return <Box sx={{ p: 4, backgroundColor: '#000', minHeight: '100vh', color: 'black' }}>
            <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'black' }}>
                Back to League
            </Button>
            <Typography color="error">{error || 'Could not load league data.'}</Typography>
        </Box>;
    }

    // const availablePlayers = league.members.filter(
    //     member => ![...homeTeamUsers, ...awayTeamUsers].find(p => p.id === member.id)
    // );


    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 4, backgroundColor: '#ffff', minHeight: '100vh', color: 'black' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'black' }}>
                    Back to League
                </Button>
                
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Form Section */}
                    <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                        <Paper component="form" onSubmit={handleScheduleMatch} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black' }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                Schedule New Match for {league.name}
                            </Typography>
                            
                            {/* Home Team Fields */}
                            <TextField
                                label="Home Team Name"
                                value={homeTeamName}
                                onChange={(e) => setHomeTeamName(e.target.value)}
                                required
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: { color: 'black' } }}
                                sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }}
                            />
                            
                            <Autocomplete
                                multiple
                                options={league.members.filter(m => !awayTeamUsers.find(p => p.id === m.id))}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={homeTeamUsers}
                                onChange={(event, newValue) => { setHomeTeamUsers(newValue); if (homeCaptain && !newValue.some(u => u.id === homeCaptain.id)) setHomeCaptain(null); }}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} style={{ color: 'black' }}>
                                        <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                        {`${option.firstName} ${option.lastName}`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Home Team Players" placeholder="Players" InputLabelProps={{ sx: { color: 'black' } }} sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' }, '.MuiSvgIcon-root': { color: 'black'} }} />
                                )}
                            />
                            {homeTeamUsers.length > 0 && (
                              <Autocomplete
                                options={homeTeamUsers}
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={homeCaptain}
                                onChange={(event, newValue) => setHomeCaptain(newValue)}
                                renderInput={(params) => (
                                  <TextField {...params} margin="normal" label="Select Home Team Captain" required InputLabelProps={{ sx: { color: 'black' } }} sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }} />
                                )}
                              />
                            )}

                            {/* Away Team Fields */}
                            <TextField
                                label="Away Team Name"
                                value={awayTeamName}
                                onChange={(e) => setAwayTeamName(e.target.value)}
                                required
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: { color: 'black' } }}
                                sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }}
                            />

                            <Autocomplete
                                multiple
                                options={league.members.filter(m => !homeTeamUsers.find(p => p.id === m.id))}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={awayTeamUsers}
                                onChange={(event, newValue) => { setAwayTeamUsers(newValue); if (awayCaptain && !newValue.some(u => u.id === awayCaptain.id)) setAwayCaptain(null); }}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} style={{ color: 'black' }}>
                                        <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                        {`${option.firstName} ${option.lastName}`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Away Team Players" placeholder="Players" InputLabelProps={{ sx: { color: 'black' } }} sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' }, '.MuiSvgIcon-root': { color: 'black'} }} />
                                )}
                            />
                            {awayTeamUsers.length > 0 && (
                                <Autocomplete
                                    options={awayTeamUsers}
                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                    value={awayCaptain}
                                    onChange={(event, newValue) => setAwayCaptain(newValue)}
                                    renderInput={(params) => (
                                        <TextField {...params} margin="normal" label="Select Away Team Captain" required InputLabelProps={{ sx: { color: 'black' } }} sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }} />
                                    )}
                                />
                            )}
                            
                            {/* Rest of the form */}
                            <DatePicker
                                label="Match Date"
                                value={matchDate}
                                onChange={setMatchDate}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        margin: "normal",
                                        required: true,
                                        sx: { svg: { color: 'black' }, input: { color: 'black' }, label: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }
                                    }
                                }}
                            />
                            <TimePicker
                                label="Start Time"
                                value={startTime}
                                onChange={setStartTime}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        margin: "normal",
                                        required: true,
                                        sx: { svg: { color: 'black' }, input: { color: 'black' }, label: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }
                                    }
                                }}
                            />
                            <TextField
                                label="Match Duration (minutes)"
                                type="number"
                                value={duration}
                                onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                                required
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: { color: 'black' } }}
                                sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }}
                            />
                            
                            <TextField
                                label="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: { color: 'black' } }}
                                sx={{ input: { color: 'black' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'black' } }}
                            />
                            
                            {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
                            
                            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={isSubmitting || league?.active === false}>
                                {isSubmitting ? <CircularProgress size={24} /> : 'Schedule Match'}
                            </Button>
                        </Paper>
                    </Box>

                    {/* Live Preview Section */}
                    <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                        <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black', position: 'sticky', top: '20px' }}>
                            <Typography variant="h5" gutterBottom>Live Preview</Typography>
                            <Divider sx={{ mb: 2, borderColor: 'black' }} />

                            {/* Home Team Preview */}
                            <Box mb={3}>
                                <Typography variant="h6" sx={{ color: '#66bb6a' }}>{homeTeamName || 'Home Team'}</Typography>
                                {homeTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {homeTeamUsers.map(user => (
                                            <ResponsiveCard 
                                                key={`home-${user.id}`}
                                                {...mapUserToCardProps(user, user.id === homeCaptain?.id)}
                                                width={180}
                                                height={180}
                                            />
                                        ))}
                                    </Box>
                                ) : <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Select players...</Typography>}
                            </Box>

                             {/* Away Team Preview */}
                            <Box>
                                <Typography variant="h6" sx={{ color: '#ef5350' }}>{awayTeamName || 'Away Team'}</Typography>
                                {awayTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {awayTeamUsers.map(user => (
                                            <ResponsiveCard 
                                                key={`away-${user.id}`}
                                                {...mapUserToCardProps(user, user.id === awayCaptain?.id)}
                                                width={180}
                                                height={180}
                                            />
                                        ))}
                                    </Box>
                                ) : <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Select players...</Typography>}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </LocalizationProvider>
    );
} 