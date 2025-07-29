'use client';

import { Box, Button, Container, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Divider, Dialog, DialogActions, DialogContent, DialogTitle, SelectChangeEvent, CircularProgress, IconButton } from '@mui/material';
import { ArrowLeft, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import React, { useEffect, useState, useCallback } from 'react';
import PlayerCard from '@/Components/playercard/playercard';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';
import { User } from '@/types/user';
import { Card, CardContent } from '@mui/material';
import Link from 'next/link';
import { cacheManager } from "@/lib/cacheManager"
import PlayerStatsDialog from '@/Components/PlayerStatsDialog';

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    matchTime: string;
    date: string;
    availablePlayers: number;
    pendingPlayers: number;
    status: 'scheduled' | 'completed';
    leagueId: string;
    league?: {
        id: string;
        name: string;
    };
    homeTeamName?: string;
    awayTeamName?: string;
    homeTeamUsers?: User[];
    awayTeamUsers?: User[];
    availableUsers?: User[];
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    end?: string;
    homeTeamImage?: string;
    awayTeamImage?: string;
}

interface League {
    id: string;
    name: string;
    members?: User[];
    administrators?: { id: string }[]; // Add this line
    active?: boolean;                  // Add this line
    matches?: Match[]; // <-- Add this line
}

interface PlayerCardProps {
    id: string;
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
}

export default function AllMatches() {
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    console.log('selectedMatch', selectedMatch)
    const { token, user } = useAuth();
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [key: string]: boolean }>({});

    const fetchLeagues = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.user) {
                // Combine joined and managed leagues
                const userLeagues = [
                    ...(data.user.leagues || []),
                    ...(data.user.administeredLeagues || [])
                ];

                // Remove duplicates
                const uniqueLeagues = Array.from(new Map(userLeagues.map(league => [league.id, league])).values());

                setLeagues(uniqueLeagues);
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchMatchesByLeague = useCallback(async (leagueId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.league && data.league.matches) {
                setMatches(data.league.matches);
                // Update the leagues array to include members for the selected league
                setLeagues(prevLeagues => {
                    const otherLeagues = prevLeagues.filter(l => l.id !== data.league.id);
                    return [
                        ...otherLeagues,
                        {
                            ...prevLeagues.find(l => l.id === data.league.id),
                            ...data.league // this will include members, name, etc.
                        }
                    ];
                });
            } else {
                setMatches([]);
            }
        } catch {
            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchLeagues();
        }
    }, [token, fetchLeagues]);

    // Add this effect for auto-select
    useEffect(() => {
        if (leagues.length > 0 && selectedLeague === 'all') {
            setSelectedLeague(leagues[0].id);
        }
    }, [leagues, selectedLeague]);

    // Fetch matches whenever selected league changes

    useEffect(() => {
        if (token && selectedLeague !== 'all') {
            fetchMatchesByLeague(selectedLeague);
        } else if (selectedLeague === 'all') {
            setMatches([]); // Clear matches when "All Leagues" is selected
            setLoading(false);
        }
    }, [selectedLeague, token, fetchMatchesByLeague]);

    const handleBackToDashboard = () => {
        router.push('/dashboard');
    };

    const handleLeagueChange = (event: SelectChangeEvent<string>) => {
        const newLeagueId = event.target.value as string;
        console.log('League selection changed to:', newLeagueId);
        console.log('Available leagues:', leagues);
        const selectedLeagueInfo = leagues.find(l => l.id === newLeagueId);
        console.log('Selected league info:', selectedLeagueInfo);
        setSelectedLeague(newLeagueId);
    };

    // Get the name of the selected league for display
    const selectedLeagueName = selectedLeague === 'all'
        ? 'All Leagues'
        : leagues.find(league => league.id === selectedLeague)?.name || '';

    // const handleOpenTeamModal = (match: Match) => {
    //     setSelectedMatch(match);
    //     setTeamModalOpen(true);
    // };

    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    // Helper to map player object to PlayerCardProps
    const mapPlayerToCardProps = (player: User): PlayerCardProps => {
        const props: PlayerCardProps = {
            id: player.id,
            name: (player.firstName || '') + ' ' + (player.lastName || ''),
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
            profileImage: player?.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : `/${player.profilePicture}`}`) : undefined,
            shirtIcon: ''
        };
        console.log('mapPlayerToCardProps input:', player);
        console.log('mapPlayerToCardProps output:', props);
        return props;
    };

    const getAvailabilityCounts = (match: Match) => {
        // Find the league for this match
        const leagueForMatch = leagues.find(l => l.id === match.leagueId);
        const leagueMembers = leagueForMatch?.members || [];
        // Count how many league members are in availableUsers
        const availableCount = leagueMembers.filter(member =>
            match.availableUsers?.some((u: User) => u.id === member.id)
        ).length;
        const pendingCount = leagueMembers.length - availableCount;
        return { availableCount, pendingCount };
    };
    const [, setError] = useState<string | null>(null);
    const [league, setLeague] = useState<League | null>(null);
    const [, setToastMessage] = useState<string | null>(null);
    const [isSubmittingStats, setIsSubmittingStats] = React.useState(false);


    const fetchLeagueDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                console.log('Server Response - League Data:', data.league);
                console.log('Server Response - Matches:', data.league.matches);
                if (data.league.matches) {
                    data.league.matches.forEach((match: Match, index: number) => {
                        console.log(`Match ${index + 1} End Time:`, match.end);
                    });
                }
                setLeague(data.league);
            } else {
                setError(data.message || 'Failed to fetch league details');
            }
        } catch (error) {
            console.error('Error fetching league details:', error);
            setError('Failed to fetch league details');
        } finally {
            setLoading(false);
        }
    }, [selectedLeague, token]);

    const handleSaveStats = async () => {
        if (!activeMatchId || !token) return;
        
        setIsSubmittingStats(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${activeMatchId}/stats`, {
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
            
            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, show error message
                console.error('Stats saving is not available yet. Please contact the administrator.');
                setStatsDialogOpen(false);
                return;
            }
            
            const data = await response.json();
            if (data.success) {
                // Update leaderboard cache with new stats
                if (data.updatedStats) {
                    Object.entries(data.updatedStats).forEach(([metric, value]) => {
                        if (typeof value === 'number') {
                            // Update cache if cacheManager is available
                            if (typeof cacheManager !== 'undefined') {
                                cacheManager.updateLeaderboardCache(data.playerId, value, metric as any);
                            }
                        }
                    });
                }
                setStatsDialogOpen(false);
                // Optionally show a success message
            }
        } catch (err: unknown) {
            console.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingStats(false);
        }
    };

    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + increment);
            return { ...prev, [stat]: Math.min(newValue, max) };
        });
    };


      const getMatchGoals = () => {
        if (!activeMatchId || !league) return 10; // Default fallback
        const match = league.matches?.find(m => m.id === activeMatchId);
        if (!match) return 10;
        return (match.homeTeamGoals || 0) + (match.awayTeamGoals || 0);
    };

    useEffect(() => {
        if (selectedLeague && token) {
            fetchLeagueDetails();
        }
    }, [selectedLeague, token, fetchLeagueDetails]);
    const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
        if (!token) {
            setError('Please login to mark availability');
            return;
        }
        setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
        const action = isAvailable ? 'unavailable' : 'available';
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/matches/${matchId}/availability?action=${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();
            if (data.success && data.match) {
                // Update cache with new match data
                cacheManager.updateMatchesCache(data.match);
                
                // Update the matches array so the button toggles instantly
                setMatches(prevMatches => prevMatches.map(m =>
                    m.id === matchId ? { ...m, availableUsers: data.match.availableUsers } : m
                ));
                setToastMessage(action === 'available' ? 'You are now available for this match.' : 'You are now unavailable for this match.');
            } else {
                setToastMessage('Availability updated.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage || 'Failed to connect to server');
        } finally {
            setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const [statsDialogOpen, setStatsDialogOpen] = React.useState(false);
    const [activeMatchId, setActiveMatchId] = React.useState<string | null>(null);
    const [stats, setStats] = React.useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });
    const fetchExistingStats = async (matchId: string) => {
        if (!token || !user) return;
        
        try {
            // Fetch existing stats for the current user
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?playerId=${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, use default stats
                setStats({ 
                    goals: 0, 
                    assists: 0, 
                    cleanSheets: 0, 
                    penalties: 0, 
                    freeKicks: 0, 
                    defence: 0, 
                    impact: 0 
                });
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.stats) {
                // Use existing stats if available
                setStats({
                    goals: data.stats.goals || 0,
                    assists: data.stats.assists || 0,
                    cleanSheets: data.stats.cleanSheets || 0,
                    penalties: data.stats.penalties || 0,
                    freeKicks: data.stats.freeKicks || 0,
                    defence: data.stats.defence || 0,
                    impact: data.stats.impact || 0,
                });
            } else {
                // Reset to 0 if no existing stats
                setStats({ 
                    goals: 0, 
                    assists: 0, 
                    cleanSheets: 0, 
                    penalties: 0, 
                    freeKicks: 0, 
                    defence: 0, 
                    impact: 0 
                });
            }
        } catch (error) {
            console.error('Failed to fetch existing stats:', error);
            // Reset to 0 on error
            setStats({ 
                goals: 0, 
                assists: 0, 
                cleanSheets: 0, 
                penalties: 0, 
                freeKicks: 0, 
                defence: 0, 
                impact: 0 
            });
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
                // backgroundColor:'white',
                py: 6,
            }}
        >
            <Container maxWidth="lg">
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToDashboard}
                    sx={{
                        mb: 2, color: 'white', backgroundColor: '#1f673b',
                        '&:hover': { backgroundColor: '#388e3c' },
                    }}
                >
                    Back to Dashboard
                </Button>

                {/* Header */}
                {/* <Box sx={{
                    mb: 4,
                    background: 'linear-gradient(135deg, #1f673b 0%, #43a047 100%)',
                    borderRadius: 4,
                    boxShadow: '0 4px 24px 0 rgba(67,160,71,0.18)',
                    p: 4,
                }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                        <FormControl
                            fullWidth
                            sx={{
                                maxWidth: 400,
                                background: 'linear-gradient(90deg, #1f673b 0%, #43a047 100%)',
                                borderRadius: 3,
                                boxShadow: '0 2px 12px 0 rgba(67,160,71,0.10)',
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    background: 'transparent',
                                    borderRadius: 3,
                                    '& fieldset': {
                                        borderColor: '#43a047',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#388e3c',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#43a047',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#fff',
                                },
                                '& .MuiSelect-icon': {
                                    color: '#fff',
                                },
                            }}
                        >
                            <InputLabel id="league-select-label" sx={{ color: '#fff', '&.Mui-focused': { color: '#fff' } }}>Select League</InputLabel>
                            <Select
                                labelId="league-select-label"
                                id="league-select"
                                value={selectedLeague}
                                label="Select League"
                                onChange={handleLeagueChange}
                                sx={{ color: '#fff' }}
                            >
                                <MenuItem value="all" sx={{ color: '#1f673b', fontWeight: 600 }}>All Leagues</MenuItem>
                                {leagues.map((league) => (
                                    <MenuItem key={league.id} value={league.id} sx={{ color: '#1f673b', fontWeight: 600 }}>
                                        {league.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        align="center"
                        sx={{ color: '#fff', letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    >
                        {selectedLeague === 'all' ? 'All Matches' : `League ${selectedLeagueName} Matches`}
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        align="center"
                        sx={{ mt: 1, color: '#e0f2f1', fontWeight: 500 }}
                    >
                        {selectedLeague === 'all'
                            ? 'Select a league to view its matches'
                            : `Viewing matches for ${selectedLeagueName}`}
                    </Typography>
                </Box> */}
                {/* League Dropdown */}

                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                        <FormControl
                            fullWidth
                            sx={{
                                maxWidth: 400,
                                background: 'linear-gradient(90deg, #1f673b 0%, #43a047 100%)',
                                borderRadius: 3,
                                boxShadow: '0 2px 12px 0 rgba(67,160,71,0.10)',
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    background: 'transparent',
                                    borderRadius: 3,
                                    '& fieldset': {
                                        borderColor: '#43a047',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#388e3c',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#43a047',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#fff !important',
                                    '&.Mui-focused': { 
                                        color: '#fff !important' 
                                    },
                                    '&.MuiFormLabel-filled': { 
                                        color: '#fff !important' 
                                    },
                                    transform: 'translate(14px, 16px) scale(1)',
                                    '&.MuiInputLabel-shrink': {
                                        transform: 'translate(14px, 6px) scale(0.75)',
                                        backgroundColor: 'transparent',
                                        padding: '0 4px'
                                    }
                                },
                                '& .MuiSelect-icon': {
                                    color: '#fff',
                                },
                            }}
                        >
                            <InputLabel sx={{mt: -0.7}} id="league-select-label">Select League</InputLabel>
                            <Select
                                labelId="league-select-label"
                                id="league-select"
                                value={selectedLeague}
                                label="Select League"
                                onChange={handleLeagueChange}
                                sx={{ color: '#fff' }}
                            >
                                <MenuItem value="all" sx={{ color: '#1f673b', fontWeight: 600 }}>All Leagues</MenuItem>
                                {leagues.map((league) => (
                                    <MenuItem key={league.id} value={league.id} sx={{ color: '#1f673b', fontWeight: 600 }}>
                                        {league.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                {/* Match Cards */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3,
                }}>
                    {loading ? (
                        <Typography color="black" align="center">Loading matches...</Typography>
                    ) : selectedLeague === 'all' ? (
                        <Paper
                            elevation={0}
                            sx={{
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: 3,
                                p: 4,
                                textAlign: 'center',
                                color: 'black',
                            }}
                        >
                            <Typography variant="h6">Select a League</Typography>
                            <Typography variant="body2">
                                Choose a league from the dropdown to view its matches
                            </Typography>
                        </Paper>
                    ) : matches.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                background: '#1f673b',
                                borderRadius: 3,
                                p: 4,
                                textAlign: 'center',
                                color: '#b0bec5',
                            }}
                        >
                            <Typography variant="h6">No matches found</Typography>
                            <Typography variant="body2">
                                No matches found in {selectedLeagueName}
                            </Typography>
                        </Paper>
                    ) : (
                        matches.map((match) => {
                            const { availableCount, pendingCount } = getAvailabilityCounts(match);
                            // Use the latest availableUsers for this match to determine if the user is available
                            const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                            // const isCompleted = match.status === 'completed';
                            // const isScheduled = match.status === 'scheduled';
                            const leagueForMatch = leagues.find(l => l.id === match.leagueId);
                            const isAdmin = leagueForMatch?.administrators?.some(admin => admin.id === user?.id);
                            return (
                                 <Card key={match.id} sx={{ backgroundColor: '#0a3e1e', position: 'relative', border: '4px solid green' , borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2 }}>
                                                {isAdmin && (
                                                <Link href={`/league/${league?.id}/match/${match.id}/edit`} passHref>
                                                        <IconButton
                                                            size="small"
                                                            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
                                                        disabled={!league?.active}
                                                        >
                                                            <Edit size={16} />
                                                        </IconButton>
                                                    </Link>
                                                )}
                                            
                                            {/* Match Status - Top Left */}
                                                <Box sx={{
                                                position: 'absolute', 
                                                top: 8, 
                                                left: 8, 
                                                zIndex: 2 
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: '#B2DFDB',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.6rem'
                                                        }}
                                                    >
                                                        Match Status:
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            backgroundColor: match.status === 'completed' ? '#43a047' : '#ff9800',
                                                            px: 1.5,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            fontSize: '0.7rem'
                                                        }}
                                                    >
                                                        {match.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Link href={`/match/${match?.id}`}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    gap: { xs: 2, sm: 4 },
                                                        textAlign: 'center',
                                                        p: 2,
                                                    minHeight: 100,
                                                    mt:3
                                                    }}>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        <Image src={match.homeTeamImage || leagueIcon.src || '/assets/default-team.png'} alt={match.homeTeamName || match.homeTeam || 'Home Team'} width={48} height={48} />
                                                            <Typography
                                                                textTransform="uppercase"
                                                                variant="h6"
                                                                sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                minHeight: 32,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    px: 1,
                                                                    textAlign: 'center',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    width: '100%'
                                                                }}
                                                            title={match.homeTeamName || match.homeTeam || 'Home Team'}
                                                            >
                                                            {match.homeTeamName || match.homeTeam || 'Home Team'}
                                                            </Typography>
                                                        </Box>
                                                    <Typography variant="h5" sx={{ color: 'white', minWidth: 40, textAlign: 'center' }}>
                                                            VS
                                                        </Typography>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        <Image src={match.awayTeamImage || leagueIcon.src || '/assets/default-team.png'} alt={match.awayTeamName || match.awayTeam || 'Away Team'} width={48} height={48} />
                                                            <Typography
                                                                textTransform="uppercase"
                                                                variant="h6"
                                                                sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                minHeight: 32,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    px: 1,
                                                                    textAlign: 'center',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    width: '100%'
                                                                }}
                                                            title={match.awayTeamName || match.awayTeam || 'Away Team'}
                                                            >
                                                            {match.awayTeamName || match.awayTeam || 'Away Team'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Link>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'center', mt: 1 }}>
                                                    {new Date(match.date).toLocaleString()}
                                                </Typography>
                                                <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                            
                                            {/* Action buttons and availability info */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {/* Availability button and Match Ended button */}
                                                    { match.status === 'scheduled' && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => handleToggleAvailability(match.id, isUserAvailable)}
                                                            disabled={availabilityLoading[match.id] || !league?.active}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: isUserAvailable ? '#4caf50' : '#f44336',
                                                                '&:hover': {
                                                                    backgroundColor: isUserAvailable ? '#388e3c' : '#d32f2f'
                                                                },
                                                                '&.Mui-disabled': {
                                                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                                                    color: 'rgba(255,255,255,0.5)'
                                                                },
                                                                fontSize: '0.75rem',
                                                                py: 0.5
                                                            }}
                                                        >
                                                            {availabilityLoading[match.id]
                                                                ? <CircularProgress size={16} color="inherit" />
                                                                : (isUserAvailable ? 'Unavailable' : 'Available')}
                                                        </Button>
                                                    )}
                                                    
                                                    {match.status === 'completed' && (
                                                        ((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                                                            <Link href={`/league/${league?.id}/match/${match.id}/play`} passHref>
                                                        <Button
                                                                    size="small"
                                                            sx={{
                                                                    backgroundColor: '#43a047',
                                                                    color: 'white',
                                                                    '&:hover': { bgcolor: '#388e3c' },
                                                                        fontSize: '0.75rem',
                                                                        py: 0.5
                                                            }}
                                                                    disabled={!leagueForMatch?.active}
                                                        >
                                                                    {isAdmin ? 'Update Score Card' : 'MOMT'}
                                                        </Button>
                                                            </Link>
                                                        )
                                                    )}
                                                </Box>
                                                {match.status === 'completed' && (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                        <Button
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#43a047',
                                                                color: 'white',
                                                                '&:hover': { bgcolor: '#388e3c' },
                                                                fontSize: '0.75rem',
                                                                py: 0.5
                                                            }}
                                                            onClick={() => {
                                                                setActiveMatchId(match.id);
                                                                setStatsDialogOpen(true);
                                                                fetchExistingStats(match.id);
                                                            }}
                                                        >
                                                            Add Your Stats
                                                        </Button>
                                                    </Box>
                                                )}
                                               {match.status === 'scheduled' && (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                    {/* Combined Available & Pending count as professional button */}
                                                            <Button
                                                        // variant="contained"
                                                                size="small"
                                                        // disabled
                                                                sx={{
                                                            borderColor: '#4caf50',
                                                                    backgroundColor: '#43a047',
                                                            color: 'white', 
                                                            '&:hover': { bgcolor: '#388e3c' },
                                                            fontSize: '0.75rem',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            fontWeight: 'bold',
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            minWidth: 'auto',
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        Available: {availableCount} | Pending: {pendingCount}
                                                            </Button>
                                                    
                                                    {/* View/Update button */}
                                                  
                                                </Box>
                                              )}
                                                </Box>
                                            </CardContent>
                                        </Card>
                            //     <Card key={match.id} sx={{ backgroundColor: '#0a3e1e', position: 'relative', border: '4px solid green' , borderRadius: 3 }}>
                            //     <CardContent sx={{ p: 2 }}>
                            //         {isAdmin && (
                            //             <Link href={`/league/${league?.id}/match/${match.id}/edit`} passHref>
                            //                 <IconButton
                            //                     size="small"
                            //                     sx={{ position: 'absolute', top: 8, right: 8, color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
                            //                     disabled={!league?.active}
                            //                 >
                            //                     <Edit size={16} />
                            //                 </IconButton>
                            //             </Link>
                            //         )}
                                    
                            //         {/* Match Status - Top Left */}
                            //         <Box sx={{ 
                            //             position: 'absolute', 
                            //             top: 8, 
                            //             left: 8, 
                            //             zIndex: 2 
                            //         }}>
                            //             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            //                 <Typography 
                            //                     variant="caption" 
                            //                     sx={{ 
                            //                         color: '#B2DFDB',
                            //                         fontWeight: 'bold',
                            //                         fontSize: '0.6rem'
                            //                     }}
                            //                 >
                            //                     Match Status:
                            //                 </Typography>
                            //                 <Typography 
                            //                     variant="caption" 
                            //                     sx={{ 
                            //                         color: 'white',
                            //                         fontWeight: 'bold',
                            //                         backgroundColor: match.status === 'completed' ? '#43a047' : '#ff9800',
                            //                         px: 1.5,
                            //                         py: 0.5,
                            //                         borderRadius: 1,
                            //                         fontSize: '0.7rem'
                            //                     }}
                            //                 >
                            //                     {match.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                            //                 </Typography>
                            //             </Box>
                            //         </Box>
                                    
                            //         <Link href={`/match/${match?.id}`}>
                            //             <Box sx={{
                            //                 display: 'flex',
                            //                 alignItems: 'center',
                            //                 justifyContent: 'center',
                            //                 gap: { xs: 2, sm: 4 },
                            //                 textAlign: 'center',
                            //                 p: 2,
                            //                 minHeight: 100,
                            //                 mt:3
                            //             }}>
                            //                 <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            //                     <Image src={match.homeTeamImage || leagueIcon.src} alt={match.homeTeamName || match.homeTeam} width={48} height={48} />
                            //                     <Typography
                            //                         textTransform="uppercase"
                            //                         variant="h6"
                            //                         sx={{
                            //                             color: 'white',
                            //                             fontWeight: 'bold',
                            //                             minHeight: 32,
                            //                             display: 'flex',
                            //                             alignItems: 'center',
                            //                             justifyContent: 'center',
                            //                             px: 1,
                            //                             textAlign: 'center',
                            //                             whiteSpace: 'nowrap',
                            //                             overflow: 'hidden',
                            //                             textOverflow: 'ellipsis',
                            //                             width: '100%'
                            //                         }}
                            //                         title={match.homeTeamName || match.homeTeam}
                            //                     >
                            //                         {match.homeTeamName || match.homeTeam}
                            //                     </Typography>
                            //                 </Box>
                            //                 <Typography variant="h5" sx={{ color: 'white', minWidth: 40, textAlign: 'center' }}>
                            //                     VS
                            //                 </Typography>
                            //                 <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            //                     <Image src={match.awayTeamImage || leagueIcon.src} alt={match.awayTeamName || match.awayTeam} width={48} height={48} />
                            //                     <Typography
                            //                         textTransform="uppercase"
                            //                         variant="h6"
                            //                         sx={{
                            //                             color: 'white',
                            //                             fontWeight: 'bold',
                            //                             minHeight: 32,
                            //                             display: 'flex',
                            //                             alignItems: 'center',
                            //                             justifyContent: 'center',
                            //                             px: 1,
                            //                             textAlign: 'center',
                            //                             whiteSpace: 'nowrap',
                            //                             overflow: 'hidden',
                            //                             textOverflow: 'ellipsis',
                            //                             width: '100%'
                            //                         }}
                            //                         title={match.awayTeamName || match.awayTeam}
                            //                     >
                            //                         {match.awayTeamName || match.awayTeam}
                            //                     </Typography>
                            //                 </Box>
                            //             </Box>
                            //         </Link>
                            //         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'center', mt: 1 }}>
                            //             {new Date(match.date).toLocaleString()}
                            //         </Typography>
                            //         <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                    
                            //         {/* Action buttons and availability info */}
                            //         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            //             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            //                 {/* Availability button and Match Ended button */}
                            //                 {match.status === 'scheduled' && (
                            //                     <Button
                            //                         variant="contained"
                            //                         onClick={() => handleToggleAvailability(match.id, isUserAvailable)}
                            //                         disabled={availabilityLoading[match.id] || !league?.active}
                            //                         size="small"
                            //                         sx={{
                            //                             backgroundColor: isUserAvailable ? '#4caf50' : '#f44336',
                            //                             '&:hover': {
                            //                                 backgroundColor: isUserAvailable ? '#388e3c' : '#d32f2f'
                            //                             },
                            //                             '&.Mui-disabled': {
                            //                                 backgroundColor: 'rgba(255,255,255,0.3)',
                            //                                 color: 'rgba(255,255,255,0.5)'
                            //                             },
                            //                             fontSize: '0.75rem',
                            //                             py: 0.5
                            //                         }}
                            //                     >
                            //                         {availabilityLoading[match.id]
                            //                             ? <CircularProgress size={16} color="inherit" />
                            //                             : (isUserAvailable ? 'Unavailable' : 'Available')}
                            //                     </Button>
                            //                 )}
                                            
                            //                 {match.status === 'completed' && (
                            //                     ((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                            //                         <Link href={`/league/${league?.id}/match/${match.id}/play`} passHref>
                            //                             <Button
                            //                                 size="small"
                            //                                 sx={{
                            //                                     backgroundColor: '#43a047',
                            //                                     color: 'white', 
                            //                                     '&:hover': { bgcolor: '#388e3c' },
                            //                                     fontSize: '0.75rem',
                            //                                     py: 0.5
                            //                                 }}
                            //                                 disabled={!leagueForMatch?.active}
                            //                             >
                            //                                 {isAdmin ? 'Update Score Card' : 'View Team'}
                            //                             </Button>
                            //                         </Link>
                            //                     )
                            //                 )}
                            //             </Box>
                                        
                            //             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                            //                 {/* Combined Available & Pending count as professional button */}
                            //                 <Button
                            //                     // variant="contained"
                            //                     size="small"
                            //                     // disabled
                            //                     sx={{
                            //                         borderColor: '#4caf50',
                            //                         backgroundColor: '#43a047',
                            //                         color: 'white', 
                            //                         '&:hover': { bgcolor: '#388e3c' },
                            //                         fontSize: '0.75rem',
                            //                         py: 0.5,
                            //                         px: 1.5,
                            //                         fontWeight: 'bold',
                            //                         borderRadius: 2,
                            //                         boxShadow: 2,
                            //                         minWidth: 'auto',
                            //                         textTransform: 'none'
                            //                     }}
                            //                 >
                            //                     Available: {availableCount} | Pending: {pendingCount}
                            //                 </Button>
                                            
                            //                 {/* View/Update button */}
                                          
                            //             </Box>
                            //         </Box>
                            //     </CardContent>
                            // </Card>
                                // <Card key={match.id} sx={{ backgroundColor: '#0a3e1e', position: 'relative', border: '4px solid green' , borderRadius: 3 }}>
                                //     <CardContent sx={{ p: 2 }}>
                                //         {isAdmin && (
                                //             <Link href={`/league/${leagueForMatch?.id}/match/${match.id}/edit`} passHref>
                                //                 <IconButton
                                //                     size="small"
                                //                     sx={{ position: 'absolute', top: 8, right: 8, color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
                                //                     disabled={!leagueForMatch?.active}
                                //                 >
                                //                     <Edit size={16} />
                                //                 </IconButton>
                                //             </Link>
                                //         )}
                                //         {/* Available/Pending info at the top */}
                                //         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                                //             <Typography color="success.main">User Available: {availableCount}</Typography>
                                //             <Typography color="warning.main">User Pending: {pendingCount}</Typography>
                                //         </Box>
                                //         <Link href={`/match/${match?.id}`}>
                                //             <Box sx={{
                                //                 display: 'flex',
                                //                 alignItems: 'center',
                                //                 justifyContent: 'center',
                                //                 gap: { xs: 2, sm: 4 },
                                //                 textAlign: 'center',
                                //                 p: 2,
                                //                 minHeight: 100
                                //             }}>
                                //                 <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                //                     <Image src={match.homeTeamImage || leagueIcon} alt={match.homeTeamName || match.homeTeam} width={48} height={48} />
                                //                     <Typography
                                //                         textTransform="uppercase"
                                //                         variant="h6"
                                //                         sx={{
                                //                             color: 'white',
                                //                             fontWeight: 'bold',
                                //                             minHeight: 32,
                                //                             display: 'flex',
                                //                             alignItems: 'center',
                                //                             justifyContent: 'center',
                                //                             px: 1,
                                //                             textAlign: 'center',
                                //                             whiteSpace: 'nowrap',
                                //                             overflow: 'hidden',
                                //                             textOverflow: 'ellipsis',
                                //                             width: '100%'
                                //                         }}
                                //                         title={match.homeTeamName || match.homeTeam}
                                //                     >
                                //                         {match.homeTeamName || match.homeTeam}
                                //                     </Typography>
                                //                 </Box>
                                //                 <Typography variant="h5" sx={{ color: 'white', minWidth: 40, textAlign: 'center' }}>
                                //                     VS
                                //                 </Typography>
                                //                 <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                //                     <Image src={match.awayTeamImage || leagueIcon} alt={match.awayTeamName || match.awayTeam} width={48} height={48} />
                                //                     <Typography
                                //                         textTransform="uppercase"
                                //                         variant="h6"
                                //                         sx={{
                                //                             color: 'white',
                                //                             fontWeight: 'bold',
                                //                             minHeight: 32,
                                //                             display: 'flex',
                                //                             alignItems: 'center',
                                //                             justifyContent: 'center',
                                //                             px: 1,
                                //                             textAlign: 'center',
                                //                             whiteSpace: 'nowrap',
                                //                             overflow: 'hidden',
                                //                             textOverflow: 'ellipsis',
                                //                             width: '100%'
                                //                         }}
                                //                         title={match.awayTeamName || match.awayTeam}
                                //                     >
                                //                         {match.awayTeamName || match.awayTeam}
                                //                     </Typography>
                                //                 </Box>
                                //             </Box>
                                //         </Link>
                                //         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'center', mt: 1 }}>
                                //             {new Date(match.date).toLocaleString()}
                                //         </Typography>
                                //         <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                //         {/* Action buttons */}
                                //         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                //             {isScheduled && (
                                //                 <Button
                                //                     variant="contained"
                                //                     onClick={() => handleToggleAvailability(match.id, isUserAvailable)}
                                //                     disabled={availabilityLoading[match.id] || !league?.active}
                                //                     sx={{
                                //                         backgroundColor: isUserAvailable ? '#4caf50' : '#f44336',
                                //                         '&:hover': {
                                //                             backgroundColor: isUserAvailable ? '#388e3c' : '#d32f2f'
                                //                         },
                                //                         '&.Mui-disabled': {
                                //                             backgroundColor: 'rgba(255,255,255,0.3)',
                                //                             color: 'rgba(255,255,255,0.5)'
                                //                         }
                                //                     }}
                                //                 >
                                //                     {availabilityLoading[match.id]
                                //                         ? <CircularProgress size={20} color="inherit" />
                                //                         : (isUserAvailable ? 'Unavailable' : 'Available')}
                                //                 </Button>
                                //             )}
                                //             {isCompleted && (
                                //                 <Button
                                //                     variant="contained"
                                //                     disabled
                                //                     sx={{
                                //                         '&.Mui-disabled': {
                                //                             backgroundColor: '#43a047',
                                //                             color: 'white',
                                //                             '&:hover': { bgcolor: '#388e3c' },
                                //                         }
                                //                     }}
                                //                 >
                                //                     Match Ended
                                //                 </Button>
                                //             )}
                                //             {((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                                //                 <Link href={`/league/${leagueForMatch?.id}/match/${match.id}/play`} passHref>
                                //                     <Button
                                //                         size="small"
                                //                         sx={{
                                //                             backgroundColor: '#43a047',
                                //                             color: 'white', '&:hover': { bgcolor: '#388e3c' }, mt: 1, ml: 1
                                //                         }}
                                //                         disabled={!leagueForMatch?.active}
                                //                     >
                                //                         {isAdmin ? 'Update Score Card' : 'View Team'}
                                //                     </Button>
                                //                 </Link>
                                //             )}
                                //         </Box>
                                //     </CardContent>
                                // </Card>
                            );
                        })
                    )}
                </Box>

                {/* Team Modal */}
                <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
                    <DialogTitle>Teams for {selectedMatch?.homeTeamName || selectedMatch?.homeTeam} vs {selectedMatch?.awayTeamName || selectedMatch?.awayTeam}</DialogTitle>
                    <DialogContent>
                        {selectedMatch && (
                            <Box>
                                <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName || selectedMatch.homeTeam}</Typography>
                                <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    {(selectedMatch.homeTeamUsers || []).map((player: User, idx: number) => (
                                        <Box key={player.id || idx}>
                                            <PlayerCard points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        {selectedMatch && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName || selectedMatch.awayTeam}</Typography>
                                <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    {(selectedMatch.awayTeamUsers || []).map((player: User, idx: number) => (
                                        <Box key={player.id || idx}>
                                            <PlayerCard points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseTeamModal}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Container>
            <PlayerStatsDialog
                open={statsDialogOpen}
                onClose={() => setStatsDialogOpen(false)}
                onSave={handleSaveStats}
                isSubmitting={isSubmittingStats}
                stats={stats}
                handleStatChange={handleStatChange}
                teamGoals={getMatchGoals()}
            />
        </Box>
    );
} 