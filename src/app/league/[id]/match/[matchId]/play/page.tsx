'use client';

import React, { useState, useEffect } from 'react';
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
import Grid from '@mui/material/Grid';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ResponsiveCard from '@/Components/card/card';
import { Add, Remove, SportsSoccer, EmojiEvents, PanTool, FitnessCenter } from '@mui/icons-material';

interface User {
    id: string;
    firstName: string;
    lastName: string;
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
    hasVoted: boolean;
    color: string;
    sx?: SxProps<Theme>;
}

// const MotmButton = ({ voted, onClick, disabled, hasVoted, color, sx = {} }: MotmButtonProps) => (
//     <Box
//         onClick={disabled ? undefined : onClick}
//         sx={{
//             mt: 0.5,
//             mx: 'auto',
//             width: 50,
//             height: 50,
//             borderRadius: '50%',
//             backgroundColor: color,
//             color: 'white',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             fontWeight: 'bold',
//             fontSize: 12,
//             cursor: disabled ? 'not-allowed' : 'pointer',
//             opacity: disabled ? 0.7 : 1,
//             transition: 'background 0.2s',
//             userSelect: 'none',
//             textAlign: 'center',
//             ...sx
//         }}
//     >
//         {voted ? 'MOTM' : 'Select MOTM'}
//     </Box>
// );
const MotmButton = ({ voted, onClick, disabled, hasVoted, color, sx = {} }: MotmButtonProps) => (
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
    // const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [votedForId, setVotedForId] = useState<string | null>(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isSubmittingStats, setIsSubmittingStats] = useState(false);
    const [stats, setStats] = useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
    });
    const [playerVotes, setPlayerVotes] = useState<Record<string, number>>({});
    const [loadingVote, setLoadingVote] = useState(false);

    const { user, token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params.id as string;
    const matchId = params.matchId as string;

    const fetchLeagueAndMatchDetails = async () => {
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

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leagueId && matchId && token) {
            fetchLeagueAndMatchDetails();
        }
    }, [leagueId, matchId, token]);

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
        } catch (err) {
            console.error('Failed to save details', err);
            setError('Failed to save details.');
        }
    };

    // Fetch votes and set votedForId ONLY from backend
    const fetchVotes = async () => {
        if (!token) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            setPlayerVotes(data.votes || {});
            setVotedForId(data.userVote || null); // <-- Always set from backend only!
        }
    };

    useEffect(() => {
        if (matchId && token) fetchVotes();
    }, [matchId, token]);

    const handleVote = async (playerId: string) => {
        setLoadingVote(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ votedForId: playerId }),
            });
        } catch (err) {
            setError('An error occurred while voting.');
        } finally {
            await fetchVotes();
            setLoadingVote(false);
        }
    };

    const handleOpenStatsModal = () => {
        setStats({ goals: 0, assists: 0, cleanSheets: 0, penalties: 0, freeKicks: 0 });
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
                body: JSON.stringify(stats)
            });
            if (!response.ok) throw new Error('Failed to save stats.');
            handleCloseStatsModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmittingStats(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#ffff' }}><CircularProgress /></Box>;
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

    if (!user) return null;

    const isAdmin = league.administrators?.some(admin => admin.id === user.id);
    const playerOnHomeTeam = match.homeTeamUsers.some(p => p.id === user.id);
    const playerOnAwayTeam = match.awayTeamUsers.some(p => p.id === user.id);
    let teamGoals = playerOnHomeTeam ? match.homeTeamGoals || 0 : (playerOnAwayTeam ? match.awayTeamGoals || 0 : 0);

    const mapPlayerToCardProps = (player: any): PlayerCardProps => {
        const isHomeCaptain = player.id === match?.homeCaptainId;
        const isAwayCaptain = player.id === match?.awayCaptainId;
        return {
            name: `${player.firstName || ''} ${player.lastName || ''}`,
            number: player?.shirtNumber || '10',
            level: player?.level || '',
            stats: {
                DRI: player?.skills?.dribbling?.toString() || '',
                SHO: player?.skills?.shooting?.toString() || '',
                PAS: player?.skills?.passing?.toString() || '',
                PAC: player?.skills?.pace?.toString() || '',
                DEF: player?.skills?.defending?.toString() || '',
                PHY: player?.skills?.physical?.toString() || ''
            },
            foot: player?.preferredFoot === 'right' ? 'R' : 'L',
            profileImage: player?.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture}` : undefined,
            shirtIcon: '',
            isCaptain: isHomeCaptain || isAwayCaptain,
        };
    };

    // Debug log to verify state after refresh and voting
    console.log('votedForId:', votedForId, 'playerVotes:', playerVotes);

    return (
        <Box sx={{ p: 4, backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
            {!league.active && <Alert severity="warning" sx={{ mb: 2 }}>This league is currently inactive. All actions are disabled.</Alert>}
            <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'black' }}>Back to League</Button>

            <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black' }}>
                <Grid spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, p: 1 }}>
                                <Typography variant="h5" gutterBottom>{match.homeTeamName} - <span className='text-green-700'> {typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0}</span> </Typography>
                                {user && match.status === 'completed' && league.active && match.homeTeamUsers.some(p => p.id === user.id) && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleOpenStatsModal}
                                        startIcon={<Add />}
                                    >
                                        Your Stats
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <CardContent sx={{ p: 1 }}>
                                {match.homeTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {match.homeTeamUsers.map((player) => (
                                            <Box
                                                key={player.id}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    transition: 'border 0.3s, box-shadow 0.3s',
                                                    background: 'white',
                                                }}
                                            >
                                                <ResponsiveCard {...mapPlayerToCardProps(player)} />
                                                {user && user.id !== player.id && (
                                                    (() => {
                                                        const isVotedPlayer = votedForId === player.id;
                                                        const motmColor = isVotedPlayer ? '#bdbdbd' : '#00b386';
                                                        const motmDisabled = loadingVote || isVotedPlayer || match.status !== 'completed' || !league.active;
                                                        return (
                                                            <MotmButton
                                                                voted={isVotedPlayer}
                                                                onClick={() => handleVote(player.id)}
                                                                disabled={motmDisabled}
                                                                hasVoted={!!votedForId}
                                                                color={motmColor}
                                                            />
                                                        );
                                                    })()
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : <Typography>No players assigned</Typography>}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6} mt={3}>
                        <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, mt: 1, p: 1 }}>
                                <Typography variant="h5" gutterBottom>{match.awayTeamName} - <span className='text-green-700'>{typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0} </span></Typography>
                                {user && match.status === 'completed' && league.active && match.awayTeamUsers.some(p => p.id === user.id) && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleOpenStatsModal}
                                        startIcon={<Add />}
                                    >
                                        Your Stats
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <CardContent sx={{ p: 1 }}>
                                {match.awayTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {match.awayTeamUsers.map((player) => (
                                            <Box
                                                key={player.id}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                    borderRadius: 2,
                                                    transition: 'border 0.3s, box-shadow 0.3s',
                                                    background: 'white',
                                                    p: 0.5
                                                }}
                                            >
                                                <ResponsiveCard {...mapPlayerToCardProps(player)} />
                                                {user && user.id !== player.id && (
                                                    (() => {
                                                        const isVotedPlayer = votedForId === player.id;
                                                        const motmColor = isVotedPlayer ? '#bdbdbd' : '#00b386';
                                                        const motmDisabled = loadingVote || isVotedPlayer || match.status !== 'completed' || !league.active;
                                                        return (
                                                            <MotmButton
                                                                voted={isVotedPlayer}
                                                                onClick={() => handleVote(player.id)}
                                                                disabled={motmDisabled}
                                                                hasVoted={!!votedForId}
                                                                color={motmColor}
                                                            />
                                                        );
                                                    })()
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : <Typography>No players assigned</Typography>}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

            {match?.notes && (
                <Paper sx={{ p: 2, my: 2, background: '#f9f9f9', borderLeft: '4px solid #1976d2' }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                        Match Note
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#333' }}>
                        {match.notes}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                            Start Time:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#333' }}>
                            {match.start ? new Date(match.start).toLocaleString() : 'N/A'}
                        </Typography>
                    </Box>
                </Paper>
            )}

            {(Object.keys(playerVotes).length > 0) && (
                <Paper sx={{ p: 3, mt: 4, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black' }}>
                    <Typography variant="h5" component="h2" gutterBottom>MOTM Votes</Typography>
                    <Divider sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <Grid container spacing={3}>
                        {[...match.homeTeamUsers, ...match.awayTeamUsers]
                            .filter(player => playerVotes[player.id] > 0)
                            .map((player) => (
                                <Grid item xs={12} sm={6} md={4} key={player.id}>
                                    <Box sx={{ position: 'relative' }}>
                                        <ResponsiveCard {...mapPlayerToCardProps(player)} />
                                        <Chip
                                            label={playerVotes[player.id]}
                                            sx={{
                                                position: 'absolute',
                                                top: 10,
                                                left: 10,
                                                backgroundColor: '#ffc107',
                                                color: 'black',
                                                fontWeight: 'bold',
                                                zIndex: 1,
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                    </Grid>
                </Paper>
            )}
            {isAdmin && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Admin Controls</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setHomeGoals(p => Math.max(0, p - 1))} size="small" disabled={!league.active}><Remove /></IconButton>
                            <TextField label={`${match.homeTeamName} Goals`} type="number" value={homeGoals} onChange={e => setHomeGoals(Number(e.target.value))} variant="outlined" sx={{ width: '150px' }} inputProps={{ style: { textAlign: 'center' } }} disabled={!league.active} />
                            <IconButton onClick={() => setHomeGoals(p => p + 1)} size="small" disabled={!league.active}><Add /></IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setAwayGoals(p => Math.max(0, p - 1))} size="small" disabled={!league.active}><Remove /></IconButton>
                            <TextField label={`${match.awayTeamName} Goals`} type="number" value={awayGoals} onChange={e => setAwayGoals(Number(e.target.value))} variant="outlined" sx={{ width: '150px' }} inputProps={{ style: { textAlign: 'center' } }} disabled={!league.active} />
                            <IconButton onClick={() => setAwayGoals(p => p + 1)} size="small" disabled={!league.active}><Add /></IconButton>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <TextField label="Match Note" multiline rows={3} value={note} onChange={e => setNote(e.target.value)} fullWidth variant="outlined" disabled={!league.active} />
                    </Box>
                    <Button variant="contained" color="primary" onClick={handleSaveDetails} disabled={!league.active}>Save Match Details</Button>
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