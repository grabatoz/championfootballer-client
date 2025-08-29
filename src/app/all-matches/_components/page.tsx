'use client';

import { Box, Button, Container, Typography, Paper,  MenuItem, Divider, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, CircularProgress, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { ChevronDown, Edit, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import React, { useEffect, useState, useCallback } from 'react';
import PlayerCard from '@/Components/playercard/playercard';
import Image from 'next/image';
import homeTeamIcon from '@/Components/images/matches.png';
import awayTeamIcon from '@/Components/images/2nd champion icon football.png';
import { Card, CardContent } from '@mui/material';
import Link from 'next/link';
import { cacheManager } from "@/lib/cacheManager"
import PlayerStatsDialog from '@/Components/PlayerStatsDialog';
import { LeaderboardResponse } from '@/types/api';

type PlayerStatsMetric = keyof LeaderboardResponse['players'][number];


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

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    age?: number | string;
    password?: string;
    gender?: string;
    level?: string;
    joinedLeagues?: League[];
    managedLeagues?: League[];
    homeTeamMatches?: Match[];
    awayTeamMatches?: Match[];
    availableMatches?: Match[];
    guestMatch?: Match | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    position?: string;
    style?: string;
    preferredFoot?: string;
    shirtNumber?: string;
    profilePicture?: string | null;
    positionType: string;
    skills?: Skills;
    xp?: number;
}

interface Skills {
    dribbling: number;
    shooting: number;
    passing: number;
    pace: number;
    defending: number;
    physical: number;
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
    }, [token, selectedLeague]);

    useEffect(() => {
        if (token) {
            fetchLeagues();
        }
    }, [token, fetchLeagues]);

    // Add this effect for auto-select
    useEffect(() => {
        if (leagues.length > 0 && selectedLeague === 'all') {
            setLoading(true); // Set loading before changing league
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
    const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
    const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);



    const fetchLeagueDetails = useCallback(async () => {
        setLoading(true);
        try {
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
                                cacheManager.updateLeaderboardCache(data.playerId, value, metric as PlayerStatsMetric);
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
        if (selectedLeague && token && selectedLeague !== 'all') {
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

    const formatMatchDate = (dateString: string) => {
        const matchDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time to compare only dates
        const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (matchDateOnly.getTime() === todayOnly.getTime()) {
            return 'Today';
        } else if (matchDateOnly.getTime() === yesterdayOnly.getTime()) {
            return 'Yesterday';
        } else {
            return matchDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    const formatMatchName = (name: string): string => {
        if (!name) return '';
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return `${capitalizedName}`;
    };
    const formatMatchTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };


    const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLeaguesDropdownAnchor(event.currentTarget);
        setLeaguesDropdownOpen(true);
    };

    const handleLeaguesDropdownClose = () => {
        setLeaguesDropdownOpen(false);
        setLeaguesDropdownAnchor(null);
    };

    const formatLeagueName = (name: string): string => {
        if (!name) return '';

        // Capitalize first letter of the name
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        // Get first letter of each word and join them
        const words = name.split(' ');
        const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

        // Return formatted name with initials in brackets
        return `${capitalizedName} (${initials})`;
    };

    const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
    // const isAdmin = league && league.administrators && user && league.administrators.some((a: User) => a.id === user.id);

    // Replace handleLeagueSelect to only update state and close the menu
    const handleLeagueSelect = (selectedLeagueId: string) => {
        if (selectedLeagueId !== selectedLeague) {
            setSelectedLeague(selectedLeagueId);
            setLoading(true); // effects will fetch matches and league details
        }
        handleLeaguesDropdownClose();
    };

    // Keep the selected league at the top of the dropdown
    const sortedLeagues = React.useMemo(() => {
        if (!leagues?.length) return [];
        const arr = [...leagues];
        const idx = arr.findIndex(l => l.id === selectedLeague);
        if (idx > 0) {
            const [sel] = arr.splice(idx, 1);
            arr.unshift(sel);
        }
        return arr;
    }, [leagues, selectedLeague]);

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
                {/* <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToDashboard}
                    sx={{
                        mb: 2, color: 'white', backgroundColor: '#1f673b',
                        '&:hover': { backgroundColor: '#388e3c' },
                    }}
                >
                    Back to Dashboard
                </Button> */}

                <Box sx={{ mb: { xs: 3, md: 5 } }}>
                    <Typography variant="h3" sx={{
                        mb: { xs: 3, md: 4 },
                        color: '#404040',
                        // fontFamily: 'Arial Black, Arial, sans-serif',
                        fontFamily: '"Anton", sans-serif',
                        fontWeight: 'semibold',
                        fontSize: { xs: '32px', sm: '42px', md: '56px' },
                        textAlign: { xs: 'center', md: 'left' },
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                        className='all-leagues-heading'
                    >
                        ALL LEAGUES
                    </Typography>

                    {/* Create/Join League Section */}
                    <Box sx={{
                        display: 'flex',
                        gap: { xs: 2, md: 3 },
                        mb: { xs: 3, md: 5 },
                        flexWrap: 'wrap',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' }
                    }}>

                        <Box sx={{
                            display: 'flex',
                            gap: { xs: 1, md: 2 },
                            width: { xs: '100%', sm: '1' },
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' }
                        }}>
                            <Button
                                variant="contained"
                                // onClick={() => setIsDialogOpen(true)}
                                sx={{
                                    bgcolor: '#0388E3',
                                    color: 'white',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '14px', sm: '16px', md: '18px' },
                                    '&:hover': { bgcolor: '#0388E3' },
                                    width: { xs: '100%', sm: 'fit-content' },
                                    borderRadius: 2,
                                    py: { xs: 1.5, md: 1 },
                                    px: { xs: 3, md: 3 },
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    textTransform: 'none'
                                }}
                            >
                                <Link href={`/league/${league?.id}/match`}>
                                Create New Match
                                </Link>
                            </Button>
                            {/* <TextField
                                label="Enter invite code"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                sx={{
                                  flex: 1,
                                  width: { xs: '100%', sm: 'auto' },
                                  '& .MuiOutlinedInput-root': {
                                    color: 'black',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', border: '2px solid green' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)', border: '2px solid green' },
                                    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.8)', border: '2px solid green' },
                                  },
                                  '& .MuiInputLabel-root': { color: 'green' },
                                  
                                }}
                              /> */}
                            {/* <TextField
                                label="Enter invite code"
                                // value={inviteCode}
                                // onChange={(e) => setInviteCode(e.target.value)}
                                size="medium"
                                sx={{
                                  flex: 1,
                                  width: { xs: '100%', sm: 'auto' },
                                  '& .MuiOutlinedInput-root': {
                                    color: 'black',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    padding: '0', // Remove extra padding
                                    '& input': {
                                      padding: '13px 12px', // Reduce input height
                                    },
                                    '& fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                                    '&:hover fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                                    '&.Mui-focused fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                                  },
                                  '& .MuiInputLabel-root': { color: '#8C8C8C' },
                                }}
                              /> */}
                            {league ? (
                                <Button
                                    onClick={handleLeaguesDropdownOpen}
                                    sx={{
                                        textTransform: 'uppercase',
                                        fontSize: { xs: '1rem', sm: '1.5rem', md: '1.4rem' },
                                        fontWeight: 'bold',
                                        lineHeight: 1.2,
                                        wordBreak: 'break-word',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'wrap',
                                        flexShrink: 1,
                                        minWidth: 0,
                                        textAlign: { xs: 'left', md: 'left' },
                                        color: 'white',
                                        backgroundColor: '#2B2B2B',
                                        borderRadius: 2,
                                        px: 2,
                                        py: 1,
                                        '&:hover': {
                                            backgroundColor: '#2B2B2B',
                                        },
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        // border: '1px solid rgba(255,255,255,0.3)',
                                    }}
                                    endIcon={<ChevronDown size={20} />}
                                >
                                    {formatLeagueName(league.name)}
                                </Button>
                            ) : (
                                <Typography
                                    sx={{
                                        textTransform: 'uppercase',
                                        fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
                                        fontWeight: 'bold',
                                        color: 'white',
                                    }}
                                >
                                    Loading...
                                </Typography>
                            )}
                            <Menu
                                anchorEl={leaguesDropdownAnchor}
                                open={leaguesDropdownOpen}
                                onClose={handleLeaguesDropdownClose}
                                PaperProps={{
                                    sx: {
                                      p: 0.5,
                                      mt: 1,
                                      minWidth: 240,
                                      bgcolor: 'rgba(15,15,15,0.92)',
                                      color: '#E5E7EB',
                                      borderRadius: 2.5,
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                                      overflow: 'hidden',
                                    }
                                  }}
                            >
                                {sortedLeagues.map((leagueItem) => {
                                  const isActive = leagueItem.id === selectedLeague;
                                  return (
                                    <MenuItem
                                      key={leagueItem.id}
                                      onClick={() => handleLeagueSelect(leagueItem.id)}
                                      sx={{
                                        borderRadius: 1.5,
                                        mx: 0.5,
                                        my: 0.25,
                                        py: 1.25,
                                        px: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: '#E5E7EB',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          transform: 'translateY(-1px)',
                                          background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                        },
                                        ...(isActive && {
                                          background: 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)',
                                          border: '1px solid rgba(3,136,227,0.35)',
                                        }),
                                      }}
                                    >
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Trophy size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={leagueItem.name}
                                        sx={{
                                          '& .MuiListItemText-primary': {
                                            fontSize: '0.95rem',
                                            fontWeight: isActive ? 700 : 500,
                                            letterSpacing: 0.2,
                                            color: isActive ? '#FFFFFF' : '#E5E7EB',
                                          }
                                        }}
                                      />
                                      {isActive ? (
                                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Box
                                            sx={{
                                              px: 1,
                                              py: 0.25,
                                              bgcolor: '#0388E3',
                                              color: 'white',
                                              borderRadius: '9999px',
                                              fontSize: 10,
                                              fontWeight: 700,
                                              letterSpacing: 0.3,
                                              textTransform: 'uppercase',
                                            }}
                                          >
                                            Current
                                          </Box>
                                        </Box>
                                      ) : null}
                                    </MenuItem>
                                  );
                                })}
                            </Menu>
                        </Box>
                    </Box>
                </Box>
                {/* Match Cards */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                    gap: 3,
                }}>
                    {loading ? (
                        <Typography color="#fff" align="center">Loading matches...</Typography>
                    ) : selectedLeague === 'all' ? (
                        <Paper
                            elevation={0}
                            sx={{
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: 3,
                                p: 4,
                                textAlign: 'center',
                                color: '#fff',
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
                               background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
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
                            const isCompleted = match.status === 'completed';
                            return (
                                isCompleted ? (
                                    <Card key={match.id} sx={{
                                        // background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                        // background: '#3B8271',
                                        // background: 'rgba(255,255,255,0.1)',
                                        position: 'relative',
                                        borderRadius: 3,
                                        backdropFilter: 'blur(10px)',
                                        // background: '#01c697',
                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                        // border: '2px solid #02a880',
                                        '&:hover': {
                                            // border: '3px solid #02a880',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                                        }
                                    }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Link href={`/match/${match?.id}`}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1,
                                                    minHeight: 80
                                                }}>

                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        width: '100%'
                                                    }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            flex: 1,
                                                        }}>
                                                            <Image
                                                                src={match.homeTeamImage || homeTeamIcon}
                                                                alt={match.homeTeamName || match.homeTeam}
                                                                width={24}
                                                                height={24}
                                                                style={{ borderRadius: '2px' }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                                title={match.homeTeamName}
                                                            >
                                                                {formatMatchName(match.homeTeamName || match.homeTeam)}
                                                            </Typography>
                                                        </Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '1.1rem',
                                                                minWidth: 20,
                                                                textAlign: 'right',
                                                                mr: 9
                                                            }}
                                                        >
                                                            {match.homeTeamGoals || 0}
                                                        </Typography>
                                                    </Box>

                                                    {/* Bottom Row - Away Team */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%'
                                                    }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            flex: 1
                                                        }}>
                                                            <Image
                                                                src={match.awayTeamImage || awayTeamIcon}
                                                                alt={match.awayTeamName || match.homeTeam}
                                                                width={24}
                                                                height={24}
                                                                style={{ borderRadius: '2px' }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                                title={match.awayTeamName}
                                                            >
                                                                {formatMatchName(match.awayTeamName || match.homeTeam)}
                                                            </Typography>

                                                        </Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '1.1rem',
                                                                minWidth: 20,
                                                                textAlign: 'right',
                                                                mr: 9
                                                            }}
                                                        >
                                                            {match.awayTeamGoals || 0}
                                                        </Typography>
                                                    </Box>


                                                    {/* Date and Status - Right Side */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        position: 'absolute',
                                                        top: 32,
                                                        right: 8
                                                    }}>
                                                        <Typography variant="body2" sx={{
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            {formatMatchDate(match.date)}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{
                                                            color: 'white',
                                                            fontSize: '0.65rem'
                                                        }}>
                                                            Full time
                                                        </Typography>
                                                        <Divider sx={{ height: '70px', width: '0.5px', color: 'white', bgcolor: '#fff', mr: 8.5, mt: -6 }} />
                                                    </Box>
                                                </Box>
                                            </Link>

                                            {/* Action buttons */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                                                        <Link href={`/league/${league?.id}/match/${match.id}/play`} passHref>
                                                            <Button
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: '#0388E3', // Slightly more opaque
                                                                    color: 'white',
                                                                    fontSize: '0.75rem',
                                                                    py: 0.5,
                                                                    px: 1, // Add horizontal padding for better proportions
                                                                    borderRadius: 1, // Slightly rounded corners
                                                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)', // Soft blue glow
                                                                    transition: 'all 0.2s ease-in-out', // Smooth hover effects
                                                                    '&:hover': {
                                                                        bgcolor: '#0388E3',
                                                                        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', // Stronger glow on hover
                                                                        transform: 'translateY(-1px)', // Slight lift effect
                                                                    },
                                                                    '&:active': {
                                                                        transform: 'translateY(0)', // Reset when clicked
                                                                    },
                                                                }}
                                                                disabled={!league?.active}
                                                            >
                                                                {isAdmin ? 'Update Score Card' : 'MOMT'}
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                    <Button
                                                        size="small"
                                                        // sx={{
                                                        //     backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                                        //     color: 'white',
                                                        //     '&:hover': { bgcolor: 'rgba(59, 130, 246, 1)' },
                                                        //     fontSize: '0.75rem',
                                                        //     py: 0.5,
                                                        // }}
                                                        sx={{
                                                            backgroundColor: '#FA5836', // Slightly more opaque
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            py: 0.5,
                                                            px: 1.5, // Add horizontal padding for better proportions
                                                            borderRadius: 1, // Slightly rounded corners
                                                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)', // Soft blue glow
                                                            transition: 'all 0.2s ease-in-out', // Smooth hover effects
                                                            '&:hover': {
                                                                bgcolor: '#FA5836',
                                                                boxShadow: '0 4px 8px #FA5836', // Stronger glow on hover
                                                                transform: 'translateY(-1px)', // Slight lift effect
                                                            },
                                                            '&:active': {
                                                                transform: 'translateY(0)', // Reset when clicked
                                                            },
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
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card key={match.id} sx={{
                                        // background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                        // background: 'rgba(255,255,255,0.1)',
                                        position: 'relative',
                                        // border: '2px solid rgba(255,255,255,0.1)',
                                        borderRadius: 3,
                                        backdropFilter: 'blur(10px)',
                                        // background: '#01c697',
                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                        // border: '2px solid #02a880',
                                        '&:hover': {
                                            // border: '3px solid #02a880',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                                        }
                                    }}>
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


                                            <Link href={`/match/${match?.id}`}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1,
                                                    minHeight: 80,
                                                    mb: 3
                                                }}>

                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        width: '100%'
                                                    }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            flex: 1,
                                                        }}>
                                                            <Image
                                                                src={match.homeTeamImage || homeTeamIcon}
                                                                alt={match.homeTeamName || match.homeTeam}
                                                                width={24}
                                                                height={24}
                                                                style={{ borderRadius: '2px' }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem',
                                                                    ml: 2
                                                                }}
                                                                title={match.homeTeamName}
                                                            >
                                                                {formatMatchName(match.homeTeamName || match.homeTeam)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Bottom Row - Away Team */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%'
                                                    }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            flex: 1,
                                                            mt: 2,
                                                        }}>
                                                            <Image
                                                                src={match.awayTeamImage || awayTeamIcon}
                                                                alt={match.awayTeamName || match.homeTeam}
                                                                width={24}
                                                                height={24}
                                                                style={{ borderRadius: '2px' }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem',
                                                                    ml: 2
                                                                }}
                                                                title={match.awayTeamName}
                                                            >
                                                                {formatMatchName(match.awayTeamName || match.homeTeam)}
                                                            </Typography>

                                                        </Box>
                                                    </Box>
                                                    {/* Date and Status - Right Side */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        position: 'absolute',
                                                        top: 32,
                                                        right: 8
                                                    }}>
                                                        <Typography variant="body2" sx={{
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {formatMatchDate(match.date)}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{
                                                            color: 'white',
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            {formatMatchTime(match.date)}
                                                        </Typography>
                                                        <Divider sx={{ height: '85px', width: '0.5px', color: 'white', bgcolor: 'white', mr: 10.5, mt: -7 }} />
                                                    </Box>
                                                </Box>
                                            </Link>


                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {/* Availability button */}
                                                    {isMember && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => handleToggleAvailability(match.id, isUserAvailable)}
                                                            disabled={availabilityLoading[match.id] || !league?.active}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: isUserAvailable ? 'rgba(76, 175, 80, 0.8)' : '#0388E3',
                                                                '&:hover': {
                                                                    backgroundColor: isUserAvailable ? 'rgba(76, 175, 80, 1)' : '#0388E3',
                                                                    transform: 'translateY(-1px)',
                                                                },
                                                                '&.Mui-disabled': {
                                                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                                                    color: 'rgba(255,255,255,0.5)'
                                                                },
                                                                fontSize: '0.75rem',
                                                                py: 0.5
                                                                ,
                                                                transition: 'all 0.2s ease-in-out', // Smooth hover effects
                                                                '&:active': {
                                                                    transform: 'translateY(0)', // Reset when clicked
                                                                },
                                                            }}
                                                        >
                                                            {availabilityLoading[match.id]
                                                                ? <CircularProgress size={16} color="inherit" />
                                                                : (isUserAvailable ? 'Unavailable' : 'Available')}
                                                        </Button>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                    <Button
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#FA5836', // Slightly more opaque
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            py: 0.5,
                                                            px: 1.5, // Add horizontal padding for better proportions
                                                            borderRadius: 1, // Slightly rounded corners
                                                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)', // Soft blue glow
                                                            transition: 'all 0.2s ease-in-out', // Smooth hover effects
                                                            '&:hover': {
                                                                bgcolor: '#FA5836',
                                                                boxShadow: '0 4px 8px #FA5836', // Stronger glow on hover
                                                                transform: 'translateY(-1px)', // Slight lift effect
                                                            },
                                                            '&:active': {
                                                                transform: 'translateY(0)', // Reset when clicked
                                                            },
                                                        }}
                                                    >
                                                        Available: {availableCount} | Pending: {pendingCount}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )
                            )
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
                                            <PlayerCard position={''} points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
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
                                            <PlayerCard position={''} points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
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