'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Divider,
    CircularProgress,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Alert,
    Chip,
    SxProps,
    Theme,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ResponsiveCard from '@/Components/card/card';
import { Add, Remove, SportsSoccer, EmojiEvents, PanTool, FitnessCenter, Security, Bolt } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface User {
    id: string;
    firstName: string;
    lastName: string;
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
    preferredFoot?: string;
    profilePicture?: string;
}

interface Match {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    date: string;
    location: string;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    notes?: string;
    manOfTheMatchVotes?: Record<string, string>;
    status: string;
    start?: string;
    homeCaptainId?: string;
    awayCaptainId?: string;
}

interface League {
    id: string;
    name: string;
    administrators: User[];
    active: boolean;
}

interface PlayerCardProps {
    name: string;
    number: string;
    level: string;
    stats: {
        DRI: string;
        SHO: string;
        PAS: string;
        PAC: string;
        DEF: string;
        PHY: string;
    };
    foot: string;
    shirtIcon: string;
    profileImage?: string;
    isCaptain?: boolean;
}

interface MotmButtonProps {
    voted: boolean;
    onClick: () => void;
    disabled: boolean;
    color: string;
    sx?: SxProps<Theme>;
}

const MotmButton = ({ voted, onClick, disabled, color, sx = {} }: MotmButtonProps) => (
    <Box
        onClick={disabled ? undefined : onClick}
        sx={{
            mt: 0.5,
            mx: 'auto',
            width: 50,
            height: 50,
            borderRadius: '50%',
            backgroundColor: voted ? '#bdbdbd' : color, // Grey if voted, otherwise use the passed color
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 12,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.7 : 1,
            transition: 'background 0.2s',
            userSelect: 'none',
            textAlign: 'center',
            ...sx
        }}
    >
        {voted ? 'MOTM' : 'Select MOTM'}
    </Box>
);

export default function PlayMatchPage() {
    const [league, setLeague] = useState<League | null>(null);
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [homeGoals, setHomeGoals] = useState<number>(0);
    const [awayGoals, setAwayGoals] = useState<number>(0);
    const [note, setNote] = useState<string>('');
    const [votedForId, setVotedForId] = useState<string | null>(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isSubmittingStats, setIsSubmittingStats] = useState(false);
    const [stats, setStats] = useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });
    const [playerVotes, setPlayerVotes] = useState<Record<string, number>>({});
    const [loadingVote, setLoadingVote] = useState(false);

    const { user, token } = useAuth();
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

            if (leagueData.success) setLeague(leagueData.league);
            else throw new Error(leagueData.message || 'Failed to fetch league details');

            if (matchData.success) setMatch(matchData.match);
            else throw new Error(matchData.message || 'Failed to fetch match details');

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

    const handleSaveDetails = async () => {
        try {
            await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/goals`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ homeGoals, awayGoals }),
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/note`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ note }),
                })
            ]);
            fetchLeagueAndMatchDetails();
        } catch {
            console.error('Failed to save details');
            setError('Failed to save details.');
        }
    };

    // Fetch votes and set votedForId ONLY from backend
    const fetchVotes = useCallback(async () => {
        if (!token) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            setPlayerVotes(data.votes || {});
            setVotedForId(data.userVote || null); // <-- Always set from backend only!
        }
    }, [matchId, token]);

    useEffect(() => {
        if (matchId && token) fetchVotes();
    }, [matchId, token, fetchVotes]);

    const handleVote = async (playerId: string) => {
        setLoadingVote(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ votedForId: playerId }),
            });
        } catch {
            setError('An error occurred while voting.');
        } finally {
            await fetchVotes();
            setLoadingVote(false);
        }
    };

    const handleOpenStatsModal = () => {
        setStats({ goals: 0, assists: 0, cleanSheets: 0, penalties: 0, freeKicks: 0, defence: 0, impact: 0 });
        setIsStatsModalOpen(true);
    };

    const handleCloseStatsModal = () => setIsStatsModalOpen(false);

    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = prev[stat] + increment;
            if (newValue < 0 || newValue > max) return prev;
            return { ...prev, [stat]: newValue };
        });
    };

    const handleSaveStats = async () => {
        setIsSubmittingStats(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goals: stats.goals,
                    assists: stats.assists,
                    cleanSheets: stats.cleanSheets,
                    penalties: stats.penalties,
                    freeKicks: stats.freeKicks,
                    defence: stats.defence,
                    impact: stats.impact,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setIsStatsModalOpen(false);
                // Optionally show a success message
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingStats(false);
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

    if (!user) return null;

    const isAdmin = league.administrators?.some(admin => admin.id === user.id);
    const playerOnHomeTeam = match.homeTeamUsers.some(p => p.id === user.id);
    const playerOnAwayTeam = match.awayTeamUsers.some(p => p.id === user.id);
    const teamGoals = playerOnHomeTeam ? match.homeTeamGoals || 0 : (playerOnAwayTeam ? match.awayTeamGoals || 0 : 0);

    const mapPlayerToCardProps = (player: User): PlayerCardProps => {
        // const teamGoals = playerOnHomeTeam ? homeGoals : awayGoals;
        return {
            name: `${player.firstName || ''} ${player.lastName || ''}`,
            number: player.shirtNumber || '10',
            level: player.level || '1',
            stats: {
                DRI: player.skills?.dribbling?.toString() || '50',
                SHO: player.skills?.shooting?.toString() || '50',
                PAS: player.skills?.passing?.toString() || '50',
                PAC: player.skills?.pace?.toString() || '50',
                DEF: player.skills?.defending?.toString() || '50',
                PHY: player.skills?.physical?.toString() || '50'
            },
            foot: player.preferredFoot === 'right' ? 'R' : 'L',
            profileImage: player.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture}` : undefined,
            isCaptain: player.id === match.homeCaptainId || player.id === match.awayCaptainId,
            shirtIcon: ''
        };
    };

    // Debug log to verify state after refresh and voting
    console.log('votedForId:', votedForId, 'playerVotes:', playerVotes);

    return (
        <Box sx={{ p: 4, minHeight: '100vh', color: 'black' }}>
            {!league.active && <Alert severity="warning" sx={{ mb: 2 }}>This league is currently inactive. All actions are disabled.</Alert>}
            <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{
                color: 'white', backgroundColor: '#1f673b',
                fontWeight: 'bold',
                mb: 2,
                '&:hover': { backgroundColor: '#388e3c' },
            }}>Back to League</Button>

            <Paper sx={{ p: 3, backgroundColor: '#0a3e1e', color: 'black' }}>
                <Box>
                    <Box>
                        <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, p: 1 }}>
                                <Typography variant="h5" color={'white'} gutterBottom>{match.homeTeamName} - <span className='text-green-700'> {typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0}</span> </Typography>
                                {user && match.status === 'completed' && league.active && match.homeTeamUsers.some(p => p.id === user.id) && (
                                    <Button
                                        // variant="contained"
                                        // color="secondary"
                                        onClick={handleOpenStatsModal}
                                        startIcon={<Add />}
                                        sx={{
                                            bgcolor: '#43a047',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            '&:hover': { bgcolor: '#388e3c' },
                                        }}
                                    >
                                        Your Stats
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 1.5, backgroundColor: '#0a3e1e' }} />
                            <CardContent sx={{ p: 1 }}>
                                {match.homeTeamUsers.length > 0 ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'row', sm: 'row', md: 'row' },
                                            flexWrap: { xs: 'nowrap', sm: 'wrap' },
                                            gap: 1,
                                            overflowX: { xs: 'auto', sm: 'visible' },
                                            width: '100%',
                                        }}
                                    >
                                        {match.homeTeamUsers.map((player) => (
                                            <Box key={player.id} sx={{ minWidth: 220, backgroundColor: '#235235', ml: '-5', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                                                <ResponsiveCard {...mapPlayerToCardProps(player)} />
                                                {user && user.id !== player.id && (
                                                    (() => {
                                                        const isVotedPlayer = votedForId === player.id;
                                                        const motmColor = isVotedPlayer ? '#bdbdbd' : '#00b386';
                                                        const motmDisabled = loadingVote || isVotedPlayer || match.status !== 'completed' || !league.active;
                                                        return (
                                                            <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                                <MotmButton
                                                                    voted={isVotedPlayer}
                                                                    onClick={() => handleVote(player.id)}
                                                                    disabled={motmDisabled}
                                                                    color={motmColor}
                                                                />
                                                            </Box>
                                                        );
                                                    })()
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : <Typography>No players assigned</Typography>}
                            </CardContent>
                        </Card>
                    </Box>
                    <Box>
                        <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, mt: 1, p: 1 }}>
                                <Typography variant="h5" color={'white'} gutterBottom>{match.awayTeamName} - <span className='text-green-700'>{typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0} </span></Typography>
                                {user && match.status === 'completed' && league.active && match.awayTeamUsers.some(p => p.id === user.id) && (
                                    <Button
                                        // variant="contained"
                                        onClick={handleOpenStatsModal}
                                        startIcon={<Add />}
                                        sx={{
                                            bgcolor: '#43a047',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            '&:hover': { bgcolor: '#388e3c' },
                                        }}
                                    >
                                        Your Stats
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 1.5, backgroundColor: '#235235' }} />
                            <CardContent sx={{ p: 1 }}>
                                {match.awayTeamUsers.length > 0 ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'row', sm: 'row', md: 'row' },
                                            flexWrap: { xs: 'nowrap', sm: 'wrap' },
                                            gap: 1,
                                            overflowX: { xs: 'auto', sm: 'visible' },
                                            width: '100%',
                                        }}
                                    >
                                        {match.awayTeamUsers.map((player) => (
                                            <Box key={player.id} sx={{ minWidth: 220, backgroundColor: '#235235', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                                                <ResponsiveCard {...mapPlayerToCardProps(player)} />
                                                {user && user.id !== player.id && (
                                                    (() => {
                                                        const isVotedPlayer = votedForId === player.id;
                                                        const motmColor = isVotedPlayer ? '#bdbdbd' : '#00b386';
                                                        const motmDisabled = loadingVote || isVotedPlayer || match.status !== 'completed' || !league.active;
                                                        return (
                                                            <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                                <MotmButton
                                                                    voted={isVotedPlayer}
                                                                    onClick={() => handleVote(player.id)}
                                                                    disabled={motmDisabled}
                                                                    color={motmColor}
                                                                />
                                                            </Box>
                                                        );
                                                    })()
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : <Typography>No players assigned</Typography>}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Paper>

            <Paper
                sx={{
                    p: { xs: 1, sm: 2 },
                    my: 2,
                    background: '#0a3e1e',
                    borderLeft: '4px solid #1976d2',
                    maxWidth: '100%',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                }}
            >
                <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                    Match Note
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {match.notes}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        Start Time:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff' }}>
                        {match.start ? new Date(match.start).toLocaleString() : 'N/A'}
                    </Typography>
                </Box>
            </Paper>

            {(Object.keys(playerVotes).length > 0) && (
                <Paper sx={{ p: 3, mt: 4, backgroundColor: '#0a3e1e', color: 'white' }}>
                    <Typography variant="h5" component="h2" gutterBottom>MOTM Votes</Typography>
                    <Divider sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <Box
                        sx={{
                            display: { xs: 'flex', sm: 'grid' },
                            flexDirection: { xs: 'row', sm: undefined },
                            overflowX: { xs: 'auto', sm: 'visible' },
                            gap: 3,
                            gridTemplateColumns: { sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            width: '100%',
                        }}
                    >
                        {[...match.homeTeamUsers, ...match.awayTeamUsers]
                            .filter(player => playerVotes[player.id] > 0)
                            .map((player) => (
                                <Box key={player.id} sx={{ minWidth: { xs: 220, sm: 'unset' }, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                        <Chip
                                            label={playerVotes[player.id]}
                                            sx={{
                                                mb: 1,
                                                backgroundColor: '#ffc107',
                                                color: 'black',
                                                fontWeight: 'bold',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        />
                                    </Box>
                                    <ResponsiveCard {...mapPlayerToCardProps(player)} backgroundColor="#0a3e1e" />
                                </Box>
                            ))}
                    </Box>
                </Paper>
            )}

            {isAdmin && (
                <Box sx={{
                    mt: 4,
                    mb: 4, // margin below
                    backgroundColor: '#0a3e1e',
                    color: 'white',
                    p: { xs: 2, sm: 3 }, // padding
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    border: '1px solid #235235',
                    maxWidth: 700,
                    mx: 'auto',
                }}>
                    <Typography variant="h6" gutterBottom>Admin Controls</Typography>
                    <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                    <Box sx={{ display: 'flex', color: 'white', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setHomeGoals(p => Math.max(0, p - 1))} size="small" sx={{ color: 'white' }} disabled={!league.active}><Remove /></IconButton>
                            <TextField
                                label={`${match.homeTeamName} Goals`}
                                type="number"
                                value={homeGoals}
                                onChange={e => setHomeGoals(Number(e.target.value))}
                                variant="outlined"
                                sx={{
                                    width: '150px',
                                    input: { color: 'white' },
                                    label: { color: 'white' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'white' },
                                        '&:hover fieldset': { borderColor: 'white' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'white' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                }}
                                inputProps={{ style: { textAlign: 'center', color: 'white' } }}
                                InputLabelProps={{ style: { color: 'white' } }}
                                disabled={!league.active}
                            />
                            <IconButton onClick={() => setHomeGoals(p => p + 1)} size="small" sx={{ color: 'white' }} disabled={!league.active}><Add /></IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setAwayGoals(p => Math.max(0, p - 1))} size="small" sx={{ color: 'white' }} disabled={!league.active}><Remove /></IconButton>
                            <TextField
                                label={`${match.awayTeamName} Goals`}
                                type="number"
                                value={awayGoals}
                                onChange={e => setAwayGoals(Number(e.target.value))}
                                variant="outlined"
                                sx={{
                                    width: '150px',
                                    input: { color: 'white' },
                                    label: { color: 'white' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'white' },
                                        '&:hover fieldset': { borderColor: 'white' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'white' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                }}
                                inputProps={{ style: { textAlign: 'center', color: 'white' } }}
                                InputLabelProps={{ style: { color: 'white' } }}
                                disabled={!league.active}
                            />
                            <IconButton onClick={() => setAwayGoals(p => p + 1)} size="small" sx={{ color: 'white' }} disabled={!league.active}><Add /></IconButton>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Match Note"
                            multiline
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            fullWidth
                            variant="outlined"
                            disabled={!league.active}
                            sx={{
                                input: { color: 'white' },
                                textarea: { color: 'white' },
                                label: { color: 'white' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'white' },
                                    '&:hover fieldset': { borderColor: 'white' },
                                    '&.Mui-focused fieldset': { borderColor: 'white' },
                                },
                                '& .MuiInputLabel-root': { color: 'white' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                            }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                    </Box>
                    <Button sx={{
                        bgcolor: '#43a047',
                        color: 'white',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#388e3c' },
                    }}
                        variant="contained" color="primary" onClick={handleSaveDetails} disabled={!league.active}>Save Match Details</Button>
                </Box>
            )}

            <Dialog open={isStatsModalOpen} onClose={handleCloseStatsModal} fullWidth maxWidth="sm">
                <DialogTitle>Your Stats for the Match</DialogTitle>
                <DialogContent>
                    <StatCounter icon={<SportsSoccer />} label="Goals Scored" value={stats.goals} onIncrement={() => handleStatChange('goals', 1, teamGoals)} onDecrement={() => handleStatChange('goals', -1, teamGoals)} />
                    <StatCounter icon={<EmojiEvents />} label="Assists" value={stats.assists} onIncrement={() => handleStatChange('assists', 1, teamGoals)} onDecrement={() => handleStatChange('assists', -1, teamGoals)} />
                    <StatCounter icon={<PanTool />} label="Clean Sheets" value={stats.cleanSheets} onIncrement={() => handleStatChange('cleanSheets', 1, 1)} onDecrement={() => handleStatChange('cleanSheets', -1, 1)} />
                    <StatCounter icon={<FitnessCenter />} label="Penalties" value={stats.penalties} onIncrement={() => handleStatChange('penalties', 1, teamGoals)} onDecrement={() => handleStatChange('penalties', -1, teamGoals)} />
                    <StatCounter icon={<SportsSoccer />} label="Free Kicks" value={stats.freeKicks} onIncrement={() => handleStatChange('freeKicks', 1, teamGoals)} onDecrement={() => handleStatChange('freeKicks', -1, teamGoals)} />
                    <StatCounter icon={<Security />} label="Defence" value={stats.defence} onIncrement={() => handleStatChange('defence', 1, 1)} onDecrement={() => handleStatChange('defence', -1, 1)} />
                    <StatCounter icon={<Bolt />} label="Impact" value={stats.impact} onIncrement={() => handleStatChange('impact', 1, 1)} onDecrement={() => handleStatChange('impact', -1, 1)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseStatsModal}>Cancel</Button>
                    <Button onClick={handleSaveStats} variant="contained" disabled={isSubmittingStats}>{isSubmittingStats ? <CircularProgress size={24} /> : 'Upload'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

const StatCounter = ({ label, value, onIncrement, onDecrement, icon }: { label: string, value: number, onIncrement: () => void, onDecrement: () => void, icon: React.ReactNode }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {icon}
            <Typography sx={{ ml: 2, fontWeight: 500 }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={onDecrement} size="small"><Remove /></IconButton>
            <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{value}</Typography>
            <IconButton onClick={onIncrement} size="small"><Add /></IconButton>
        </Box>
    </Box>
); 