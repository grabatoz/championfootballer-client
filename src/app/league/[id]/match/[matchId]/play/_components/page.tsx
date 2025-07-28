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
    SxProps,
    Theme,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Add, Remove } from '@mui/icons-material';
import toast from 'react-hot-toast';
import Goals from '@/Components/images/goal.png'
import Imapct from '@/Components/images/imapct.png'
import Assist from '@/Components/images/Assist.png'
import Defence from '@/Components/images/defence.png'
import CleanSheet from '@/Components/images/cleansheet.png'
import FreeKick from '@/Components/images/freekick.png'
import penalty from '@/Components/images/penalty.png'
import Link from 'next/link';
import { cacheManager } from "@/lib/cacheManager"
import { LeaderboardPlayer } from '@/types/api';

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
    statistics?: {
        goals?: number;
        assists?: number;
        impact?: number;
    }[];
    positionType?: string; // Added for new player card
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
            // borderRadius: '50%',
            backgroundColor: voted ? '#bdbdbd' : color, // Grey if voted, otherwise use the passed color
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: { xs: 5, sm: 12, md: 12 },
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
            const [goalsResponse, notesResponse] = await Promise.all([
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
            
            const goalsData = await goalsResponse.json();
            const notesData = await notesResponse.json();
            
            // Update cache with new match data
            if (goalsData.success && goalsData.match) {
                cacheManager.updateMatchesCache(goalsData.match);
            }
            if (notesData.success && notesData.match) {
                cacheManager.updateMatchesCache(notesData.match);
            }
            
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
            // If user already voted for this player, unvote them
            const voteData = votedForId === playerId ? { votedForId: null } : { votedForId: playerId };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(voteData),
            });
            
            const data = await response.json();
            if (data.success) {
                // Update leaderboard cache for MOTM votes
                if (data.updatedStats) {
                    Object.entries(data.updatedStats).forEach(([metric, value]) => {
                        if (typeof value === 'number') {
                            cacheManager.updateLeaderboardCache(playerId, value, metric as keyof LeaderboardPlayer, `leaderboard_motm_${matchId}`);
                        }
                    });
                }
            }
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
                // Update leaderboard cache with new stats
                if (data.updatedStats) {
                    Object.entries(data.updatedStats).forEach(([metric, value]) => {
                        if (typeof value === 'number') {
                            cacheManager.updateLeaderboardCache(data.playerId, value, metric as keyof LeaderboardPlayer);
                        }
                    });
                }
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
    // Debug log to verify state after refresh and voting
    console.log('votedForId:', votedForId, 'playerVotes:', playerVotes);

    return (
        <Box sx={{ p: { xs: 0.5, sm: 2, md: 4 }, minHeight: '100vh', color: 'black' }}>
            {!league.active && <Alert severity="warning" sx={{ mb: 1 }}>This league is currently inactive. All actions are disabled.</Alert>}
            <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{
                color: 'white', backgroundColor: '#1f673b',
                fontWeight: 'bold',
                mb: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                '&:hover': { backgroundColor: '#388e3c' },
            }}>Back to League</Button>

            <Paper sx={{ p: { xs: 0.5, sm: 2, md: 3 }, backgroundColor: '#1f673b', color: 'white', borderRadius: 3, boxShadow: 3 }}>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'row' }, gap: { xs: 0.5, sm: 1, md: 3 } }}>
                    {/* Home Team Section */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: { xs: 0.5, sm: 2 },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: { xs: 0.5, sm: 1 }
                        }}>
                            <Typography variant="h5" color="white" sx={{
                                fontWeight: 'bold',
                                fontSize: { xs: '0.875rem', sm: '1.25rem', md: '1.5rem' },
                                lineHeight: { xs: 1.2, sm: 1.5 }
                            }}>
                                {match.homeTeamName} ({typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0})
                            </Typography>

                            {/* Add Stats Button for Home Team */}
                            {user && match.status === 'completed' && league.active &&
                                match.homeTeamUsers.some(player => player.id === user.id) && (
                                    <Button
                                        onClick={handleOpenStatsModal}
                                        startIcon={<Add />}
                                        variant="contained"
                                        size="small"
                                        sx={{
                                            bgcolor: '#43a047',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            borderRadius: 1.5,
                                            px: { xs: 0.5, sm: 1, md: 2 },
                                            py: { xs: 0.25, sm: 0.5, md: 1 },
                                            fontSize: { xs: 7, sm: 10, md: 12 },
                                            minWidth: { xs: 'auto', sm: 'auto' },
                                            height: { xs: 19, sm: 32, md: 36 },
                                            whiteSpace: 'nowrap',
                                            '&:hover': { bgcolor: '#388e3c' },
                                            mr: { xs: 0.5, sm: 1, md: 1 }
                                        }}
                                    >
                                        Add Stats
                                    </Button>
                                )}
                        </Box>

                        <Card sx={{ backgroundColor: '#0a3e1e', borderRadius: 3, border: '2px solid #43a047' }}>
                            <CardContent sx={{
                                p: { xs: 0.5, sm: 2 },
                                maxHeight: { xs: 250, sm: 400 },
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}>
                                {match.homeTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 2 } }}>
                                        {match.homeTeamUsers.map((player) => {
                                            return (
                                                <Box key={player.id} sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    alignItems: { xs: 'center', sm: 'center' },
                                                    p: { xs: 0.75, sm: 2 },
                                                    background: '#0a4822',
                                                    borderRadius: 2,
                                                    border: '1px solid #43a047',
                                                    minHeight: { xs: 60, sm: 80, md: 100 },
                                                    '&:hover': {
                                                        backgroundColor: '#1f673b',
                                                        transform: 'translateY(-1px)',
                                                        transition: 'all 0.2s ease'
                                                    }
                                                }}>
                                                    <Link href={`/player/${player.id}`}>
                                                        {/* Player Profile Picture */}
                                                        <Box sx={{
                                                            width: { xs: 35, sm: 50, md: 60 },
                                                            height: { xs: 35, sm: 50, md: 60 },
                                                            borderRadius: '50%',
                                                            overflow: 'hidden',
                                                            border: '2px solid #43a047',
                                                            mr: { xs: 0, sm: 2 },
                                                            mb: { xs: 0.5, sm: 0 },
                                                            flexShrink: 0
                                                        }}>
                                                            <img
                                                                src={player.profilePicture || "/placeholder.svg"}
                                                                alt={player.firstName + " " + player.lastName}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Link>

                                                    {/* Player Info */}
                                                    <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                                                        <Link href={`/player/${player.id}`}>

                                                            <Typography variant="h6" sx={{
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: { xs: 11, sm: 14, md: 16 },
                                                                mb: 0.5,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                lineHeight: { xs: 1.2, sm: 1.4 }
                                                            }}>
                                                                {player.firstName} {player.lastName}
                                                                {player.id === match.homeCaptainId ? ' (C)' : ''}
                                                            </Typography>

                                                            <Typography variant="body2" sx={{
                                                                color: '#B2DFDB',
                                                                fontSize: { xs: 9, sm: 12, md: 14 },
                                                                mb: { xs: 0.25, sm: 1 },
                                                                lineHeight: { xs: 1.1, sm: 1.3 }
                                                            }}>
                                                                {player.positionType || 'Player'}
                                                            </Typography>
                                                        </Link>
                                                        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, alignItems: 'center' }}>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                sx={{
                                                                    background: 'linear-gradient(90deg, #43a047 0%, #388e3c 100%)',
                                                                    color: 'white',
                                                                    borderRadius: 1.5,
                                                                    px: { xs: 0.5, sm: 2 },
                                                                    py: { xs: 0.25, sm: 0.5 },
                                                                    fontSize: { xs: 8, sm: 12 },
                                                                    fontWeight: 'bold',
                                                                    textTransform: 'none',
                                                                    height: { xs: 20, sm: 28 },
                                                                    minWidth: { xs: 'auto', sm: 'auto' },
                                                                    '&:hover': {
                                                                        background: 'linear-gradient(90deg, #388e3c 0%, #2e7d32 100%)'
                                                                    },
                                                                    mt: { xs: 0.5, sm: 0.5 }
                                                                }}
                                                            >
                                                                Shirt No {player.shirtNumber || "0"}
                                                            </Button>
                                                            {/* MOTM Vote Button */}
                                                            {match.status === 'completed' && league.active && user.id !== player.id && (
                                                                <MotmButton
                                                                    voted={votedForId === player.id}
                                                                    onClick={() => handleVote(player.id)}
                                                                    disabled={loadingVote}
                                                                    color="#43a047"
                                                                    sx={{
                                                                        ml: 0, height: { xs: 20, sm: 28 },
                                                                        minWidth: { xs: 'auto', sm: 'auto' }, borderRadius: 1.5,
                                                                        px: { xs: 0.5, sm: 2 },
                                                                        py: { xs: 0.25, sm: 0.5 },
                                                                        fontSize: { xs: 7, sm: 10 }
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Typography color="white" sx={{ textAlign: 'center', fontStyle: 'italic', fontSize: { xs: 10, sm: 14 } }}>
                                        No players assigned
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Away Team Section */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: { xs: 0.5, sm: 2 },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: { xs: 0.5, sm: 1 }
                        }}>
                            <Typography variant="h5" color="white" sx={{
                                fontWeight: 'bold',
                                fontSize: { xs: '0.875rem', sm: '1.25rem', md: '1.5rem' },
                                lineHeight: { xs: 1.2, sm: 1.5 }
                            }}>
                                {match.awayTeamName} ({typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0})
                            </Typography>

                            {/* Add Stats Button for Away Team */}
                            {user && match.status === 'completed' && league.active &&
                                match.awayTeamUsers.some(player => player.id === user.id) && (
                                    <Button
                                        onClick={handleOpenStatsModal}
                                        startIcon={<Add />}
                                        variant="contained"
                                        size="small"
                                        sx={{
                                            bgcolor: '#43a047',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            borderRadius: 1.5,
                                            px: { xs: 0.5, sm: 1, md: 2 },
                                            py: { xs: 0.25, sm: 0.5, md: 1 },
                                            fontSize: { xs: 7, sm: 10, md: 12 },
                                            minWidth: { xs: 'auto', sm: 'auto' },
                                            height: { xs: 19, sm: 32, md: 36 },
                                            whiteSpace: 'nowrap',
                                            '&:hover': { bgcolor: '#388e3c' },
                                            mr: { xs: 0.5, sm: 1, md: 1 }
                                        }}
                                    >
                                        Add Stats
                                    </Button>
                                )}
                        </Box>

                        <Card sx={{ backgroundColor: '#0a3e1e', borderRadius: 3, border: '2px solid #43a047' }}>
                            <CardContent sx={{
                                p: { xs: 0.5, sm: 2 },
                                maxHeight: { xs: 250, sm: 400 },
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}>
                                {match.awayTeamUsers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 2 } }}>
                                        {match.awayTeamUsers.map((player) => {
                                            return (
                                                <Link key={player.id} href={`/player/${player.id}`}>
                                                    <Box key={player.id} sx={{
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        alignItems: { xs: 'center', sm: 'center' },
                                                        p: { xs: 0.75, sm: 2 },
                                                        background: '#0a4822',
                                                        borderRadius: 2,
                                                        border: '1px solid #43a047',
                                                        minHeight: { xs: 60, sm: 80, md: 100 },
                                                        '&:hover': {
                                                            backgroundColor: '#1f673b',
                                                            transform: 'translateY(-1px)',
                                                            transition: 'all 0.2s ease'
                                                        }
                                                    }}>
                                                        <Link href={`/player/${player.id}`}>

                                                            {/* Player Profile Picture */}
                                                            <Box sx={{
                                                                width: { xs: 35, sm: 50, md: 60 },
                                                                height: { xs: 35, sm: 50, md: 60 },
                                                                borderRadius: '50%',
                                                                overflow: 'hidden',
                                                                border: '2px solid #43a047',
                                                                mr: { xs: 0, sm: 2 },
                                                                mb: { xs: 0.5, sm: 0 },
                                                                flexShrink: 0
                                                            }}>
                                                                <img
                                                                    src={player.profilePicture || "/placeholder.svg"}
                                                                    alt={player.firstName + " " + player.lastName}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Link>
                                                        {/* Player Info */}
                                                        <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                                                            <Link href={`/player/${player.id}`}>

                                                                <Typography variant="h6" sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: { xs: 11, sm: 14, md: 16 },
                                                                    mb: 0.5,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    lineHeight: { xs: 1.2, sm: 1.4 }
                                                                }}>
                                                                    {player.firstName} {player.lastName}
                                                                    {player.id === match.awayCaptainId ? ' (C)' : ''}
                                                                </Typography>

                                                                <Typography variant="body2" sx={{
                                                                    color: '#B2DFDB',
                                                                    fontSize: { xs: 9, sm: 12, md: 14 },
                                                                    mb: { xs: 0.25, sm: 1 },
                                                                    lineHeight: { xs: 1.1, sm: 1.3 }
                                                                }}>
                                                                    {player.positionType || 'Player'}
                                                                </Typography>
                                                            </Link>
                                                            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, alignItems: 'center' }}>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    sx={{
                                                                        background: 'linear-gradient(90deg, #43a047 0%, #388e3c 100%)',
                                                                        color: 'white',
                                                                        borderRadius: 1.5,
                                                                        px: { xs: 0.5, sm: 2 },
                                                                        py: { xs: 0.25, sm: 0.5 },
                                                                        fontSize: { xs: 8, sm: 12 },
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'none',
                                                                        height: { xs: 20, sm: 28 },
                                                                        minWidth: { xs: 'auto', sm: 'auto' },
                                                                        '&:hover': {
                                                                            background: 'linear-gradient(90deg, #388e3c 0%, #2e7d32 100%)'
                                                                        },
                                                                        mt: { xs: 0.5, sm: 0.5 }
                                                                    }}
                                                                >
                                                                    Shirt No {player.shirtNumber || "0"}
                                                                </Button>
                                                                {/* MOTM Vote Button */}
                                                                {match.status === 'completed' && league.active && user.id !== player.id && (
                                                                    <MotmButton
                                                                        voted={votedForId === player.id}
                                                                        onClick={() => handleVote(player.id)}
                                                                        disabled={loadingVote}
                                                                        color="#43a047"
                                                                        sx={{
                                                                            ml: 0, height: { xs: 20, sm: 28 },
                                                                            minWidth: { xs: 'auto', sm: 'auto' }, borderRadius: 1.5,
                                                                            px: { xs: 0.5, sm: 2 },
                                                                            py: { xs: 0.25, sm: 0.5 },
                                                                            fontSize: { xs: 7, sm: 10 }
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Link>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Typography color="white" sx={{ textAlign: 'center', fontStyle: 'italic', fontSize: { xs: 10, sm: 14 } }}>
                                        No players assigned
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Paper>

            <Paper
                sx={{
                    p: { xs: 1, sm: 2 },
                    my: 2,
                    background: '#1f673b',
                    borderLeft: '4px solid #1976d2',
                    maxWidth: '100%',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                }}
            >
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', mb: 1, fontSize: 20 }}>
                    Match Note :
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {match.notes}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                        Start Time:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff' }}>
                        {match.start ? new Date(match.start).toLocaleString() : 'N/A'}
                    </Typography>
                </Box>
            </Paper>

            <div className="p-6 mt-8 bg-[#1f673b] text-white rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">MOTM Votes</h2>
                <div className="w-full h-px bg-white mb-6"></div>

                {/* Grid layout: 3 cards on larger screens, then 2 cards, and responsive for mobile */}
                <div className="grid grid-cols-1 max-[500px]:grid-cols-1 min-[501px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-2 gap-6">
                    {[...match.homeTeamUsers, ...match.awayTeamUsers]
                        .filter(player => playerVotes[player.id] > 0)
                        .map((player) => (
                            <Link key={player.id} href={`/player/${player.id}`}>
                                <div className="group">
                                    {/* Mobile layout: Image on top center */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 bg-[#0a4822] rounded-lg border border-[#43a047] min-h-[80px] sm:min-h-[100px] hover:bg-[#1f673b] hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                        {/* Profile Image */}
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-[#43a047] mb-3 sm:mb-0 sm:mr-4 flex-shrink-0">
                                            <img
                                                src={player.profilePicture || "/placeholder.svg?height=60&width=60&query=football player"}
                                                alt={`${player.firstName} ${player.lastName}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Player Info */}
                                        <div className="flex-1 min-w-0 text-center sm:text-left">
                                            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 truncate leading-tight">
                                                {player.firstName} {player.lastName}
                                                {player.id === match.homeCaptainId ? " (C)" : ""}
                                            </h3>

                                            <p className="text-[#B2DFDB] text-xs sm:text-sm md:text-base mb-2 sm:mb-3 leading-tight">
                                                {player.positionType || "Player"}
                                            </p>

                                            {/* Buttons */}
                                            <div className="flex justify-center sm:justify-start gap-2 items-center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    className="bg-gradient-to-r from-[#43a047] to-[#388e3c] hover:from-[#388e3c] hover:to-[#2e7d32] text-white rounded-md px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold h-6 sm:h-7 min-w-0"
                                                >
                                                    Shirt No {player.shirtNumber || "0"}
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    className="bg-gradient-to-r from-[#43a047] to-[#388e3c] hover:from-[#388e3c] hover:to-[#2e7d32] text-white rounded-md px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold h-6 sm:h-7 min-w-0"
                                                >
                                                    {typeof playerVotes[player.id] === "number" &&
                                                        playerVotes[player.id] > 0 &&
                                                        `${playerVotes[player.id]} vote${playerVotes[player.id] > 1 ? "s" : ""}`}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
            {isAdmin && (
                <Box sx={{
                    mt: 4,
                    mb: 4, // margin below
                    backgroundColor: '#1f673b',
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
                    <StatCounter icon={<img src={Goals.src} alt="Goals" style={{ width: 24, height: 24 }} />} label="Goals Scored" value={stats.goals} onIncrement={() => handleStatChange('goals', 1, teamGoals)} onDecrement={() => handleStatChange('goals', -1, teamGoals)} />
                    <StatCounter icon={<img src={Assist.src} alt="Assists" style={{ width: 24, height: 24 }} />} label="Assists" value={stats.assists} onIncrement={() => handleStatChange('assists', 1, teamGoals)} onDecrement={() => handleStatChange('assists', -1, teamGoals)} />
                    <StatCounter icon={<img src={CleanSheet.src} alt="Clean Sheets" style={{ width: 24, height: 24 }} />} label="Clean Sheets" value={stats.cleanSheets} onIncrement={() => handleStatChange('cleanSheets', 1, 1)} onDecrement={() => handleStatChange('cleanSheets', -1, 1)} />
                    <StatCounter icon={<img src={penalty.src} alt='penalty' style={{ width: 24, height: 24 }} />} label="Penalties" value={stats.penalties} onIncrement={() => handleStatChange('penalties', 1, teamGoals)} onDecrement={() => handleStatChange('penalties', -1, teamGoals)} />
                    <StatCounter icon={<img src={FreeKick.src} alt='freekick' style={{ width: 24, height: 24 }} />} label="Free Kicks" value={stats.freeKicks} onIncrement={() => handleStatChange('freeKicks', 1, teamGoals)} onDecrement={() => handleStatChange('freeKicks', -1, teamGoals)} />
                    <StatCounter icon={<img src={Defence.src} alt="Defence" style={{ width: 24, height: 24 }} />} label="Defence" value={stats.defence} onIncrement={() => handleStatChange('defence', 1, 1)} onDecrement={() => handleStatChange('defence', -1, 1)} />
                    <StatCounter icon={<img src={Imapct.src} alt="Impact" style={{ width: 24, height: 24 }} />} label="Impact" value={stats.impact} onIncrement={() => handleStatChange('impact', 1, 1)} onDecrement={() => handleStatChange('impact', -1, 1)} />
                </DialogContent>
                {/* FreeKick */}
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