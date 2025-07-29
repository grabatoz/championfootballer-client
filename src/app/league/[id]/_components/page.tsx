'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    Divider,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Switch,
    TextField,
    Alert,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Users, Trophy, Calendar, Copy, Edit, Settings, Table2Icon, Shield } from 'lucide-react';
import Link from 'next/link';
import leagueIcon from '@/Components/images/league.png';
import Image from 'next/image';
import toast from 'react-hot-toast';
import TrophyRoom from '@/Components/TrophyRoom';
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import PlayerCard from '@/Components/league player card/leaguememberplayercard';
import CloseIcon from '@mui/icons-material/Close';
import { cacheManager } from "@/lib/cacheManager"
import PlayerStatsDialog from '@/Components/PlayerStatsDialog';


interface League {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
    members: User[];
    administrators: User[];
    matches: Match[];
    active: boolean;
    maxGames: number;
    showPoints: boolean;
}

interface User {
    xp: number;
    shirtNumber: undefined;
    positionType: undefined;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string | null;
}

interface Match {
    homeTeamImage: string;
    awayTeamImage: string;
    id: string;
    date: string;
    location: string;
    status: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    availableUsers: User[];
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    end: string;
    active: boolean;
}

interface LeagueSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    league: League | null;
    onUpdate: (data: Partial<League & { admins: string[] }>) => void;
    onDelete: () => void;
}

const getBadgeForPosition = (position: number) => {
    switch (position) {
      case 1:
            return <Image src={FirstBadge} alt="First Place" width={20} height={20} />
      case 2:
            return <Image src={SecondBadge} alt="Second Place" width={20} height={20} />
      case 3:
            return <Image src={ThirdBadge} alt="Third Place" width={20} height={20} />
      default:
        return `${position}th`
    }
  }
  
  const getRowStyles = (index: number) => {
    if (index === 0) {
        return "bg-[#0a3e1e]" // First place - darker green
    } else if (index === 1) {
        return "bg-[#0a4822]" // Second place - medium green
    } else if (index === 2) {
        return "bg-[#094420]" // Third place - another shade of green
    }
    return "bg-[#0a4822]" // All other places - medium green
  }
  

function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete }: LeagueSettingsDialogProps) {
    const [name, setName] = useState('');
    const [adminId, setAdminId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [maxGames, setMaxGames] = useState(20);
    const [showPoints, setShowPoints] = useState(true);

    useEffect(() => {
        if (league) {
            setName(league.name || '');
            setIsActive(league.active !== false);
            setMaxGames(league.maxGames || 20);
            setShowPoints(league.showPoints !== false);
            setAdminId(league.administrators?.[0]?.id || '');
        }
    }, [league]);

    const handleUpdate = () => {
        const updatedData = {
            name,
            active: isActive,
            maxGames,
            showPoints,
            admins: [adminId]
        };
        onUpdate(updatedData);
    };

    if (!league) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 'bold', position: 'relative' }}>
                Manage League Settings
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

                    <FormControl fullWidth>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Select league admin</Typography>
                        <Select
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                        >
                            {league.members.map((member: User) => (
                                <MenuItem key={member.id} value={member.id}>
                                    {member.firstName} {member.lastName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>League name</Typography>
                        <TextField
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </FormControl>

                    <FormControl component="fieldset">
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Change league active status</Typography>
                        <RadioGroup
                            row
                            value={isActive ? 'active' : 'inactive'}
                            onChange={(e) => setIsActive(e.target.value === 'active')}
                        >
                            <FormControlLabel value="active" control={<Radio />} label="Active" />
                            <FormControlLabel value="inactive" control={<Radio />} label="Inactive" />
                        </RadioGroup>
                    </FormControl>

                    <FormControl fullWidth>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Maximum number of matches</Typography>
                        <TextField
                            fullWidth
                            type="number"
                            value={maxGames}
                            onChange={(e) => setMaxGames(Number(e.target.value))}
                        />
                    </FormControl>

                    <FormControlLabel
                        control={<Switch checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />}
                        label="Show points in league table?"
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: '#27ab83', '&:hover': { bgcolor: '#1e8463' } }}>Update League</Button>
                <Button onClick={onDelete} variant="contained" color="error">Delete League</Button>
            </DialogActions>
        </Dialog>
    );
}

// Add TableData type
interface TableData {
    xp: number;
    id: string;
    name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    winPercentage: string;
    isAdmin?: boolean;
    profilePicture?: string | null;
}

export default function LeagueDetailPage() {
    const [league, setLeague] = useState<League | null>(null);
    console.log('leagues matches', league?.matches)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, token, loading: authLoading, isAuthenticated } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<'members' | 'matches' | 'table' | 'awards'>('members');
    const searchParams = useSearchParams();
    const profilePlayerId = typeof searchParams?.get === 'function' ? searchParams.get('profilePlayerId') : '';
    const [hasCommonLeague, setHasCommonLeague] = useState(false);
    const [checkedCommonLeague, setCheckedCommonLeague] = useState(false);
    const [, setUserLeagueXP] = useState<Record<string, number>>({});
    const [showPointsAlert, setShowPointsAlert] = useState(false);
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
    const [isSubmittingStats, setIsSubmittingStats] = React.useState(false);

    // Example stat change handler
    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + increment);
            return { ...prev, [stat]: Math.min(newValue, max) };
        });
    };

    // Fetch existing stats for the player in this match
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

    // Save stats to backend
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

    // Get match goals for the active match
    const getMatchGoals = () => {
        if (!activeMatchId || !league) return 10; // Default fallback
        const match = league.matches.find(m => m.id === activeMatchId);
        if (!match) return 10;
        return (match.homeTeamGoals || 0) + (match.awayTeamGoals || 0);
    };

    // Add this useEffect to sync tab param with section
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab === 'table' || tab === 'awards' || tab === 'members' || tab === 'matches') {
            setSection(tab);
        }
    }, [searchParams]);

    // Declare isMember and isAdmin here so they are available for useEffect and logic below
    const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
    const isAdmin = league && league.administrators && user && league.administrators.some((a: User) => a.id === user.id);


    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    console.log('league', league)

    const fetchLeagueDetails = useCallback(async () => {
        try {
            setLoading(true);
            console.log("Token before fetch:", token); // Debug log
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
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
    }, [leagueId, token]);
    useEffect(() => {
        // Wait for auth to finish loading, user to be authenticated, and token to be available
        if (authLoading) return;
        if (!isAuthenticated || !token) return;
        fetchLeagueDetails();
    }, [token, authLoading, isAuthenticated, fetchLeagueDetails]);

    // Professional access logic: allow if user and profile player have ever shared ANY league
    useEffect(() => {
        if (!user || !profilePlayerId) {
            setCheckedCommonLeague(true);
            setHasCommonLeague(false);
            return;
        }
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${profilePlayerId}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
        ]).then(([userData, playerData]) => {
            const userLeagues = [
                ...(userData.user.leagues || []),
                ...(userData.user.administeredLeagues || [])
            ].map(l => l.id);
            const profilePlayerLeagues = (playerData.data?.leagues || []).map((l: User) => l.id);
            const hasOverlap = userLeagues.some((id: string) => profilePlayerLeagues.includes(id));
            setHasCommonLeague(hasOverlap);
            setCheckedCommonLeague(true);
        }).catch(() => {
            setHasCommonLeague(false);
            setCheckedCommonLeague(true);
        });
    }, [user, profilePlayerId, token]);

    // Fetch XP for all users in this league
    useEffect(() => {
        async function fetchXP() {
            if (!league) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/xp`);
            if (res.ok) {
                const data = await res.json();
                setUserLeagueXP(data.xp || {});
            }
        }
        fetchXP();
    }, [league]);


    const handleBackToAllLeagues = () => {
        router.push('/all-leagues');
    };

    const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
        if (!user) {
            setError('Please login to mark availability');
            return;
        }

        setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
        const action = isAvailable ? 'unavailable' : 'available';

        try {
            console.log('Sending request with action:', action);
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
            console.log('Response from server:', data);

            if (data.success && data.match) {
                setLeague(prevLeague => {
                    if (!prevLeague) return prevLeague;
                    const updatedMatches = prevLeague.matches.map(m =>
                        m.id === matchId ? { ...m, availableUsers: data.match.availableUsers } : m
                    );
                    return { ...prevLeague, matches: updatedMatches };
                });
                setToastMessage(action === 'available' ? 'You are now available for this match.' : 'You are now unavailable for this match.');
            } else if (data.success) {
                fetchLeagueDetails();
                setToastMessage(action === 'available' ? 'You are now available for this match.' : 'You are now unavailable for this match.');
            } else {
                throw new Error(data.message || 'Failed to update availability');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error('Error updating availability:', err);
            setError(errorMessage || 'Failed to connect to server');
        } finally {
            setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const handleUpdateLeague = async (updatedData: Partial<League & { admins: string[] }>) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            const data = await response.json();
            if (data.success) {
                // Update cache with new league data
                if (data.league) {
                    cacheManager.updateLeaguesCache(data.league);
                }
                toast.success('League updated successfully!');
                fetchLeagueDetails();
                setIsSettingsOpen(false);
            } else {
                toast.error(data.message || 'Failed to update league');
            }
        } catch (error) {
            console.error('Error updating league:', error);
            toast.error('An error occurred while updating the league.');
        }
    };

    const handleDeleteLeague = async () => {
        if (window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    // Clear league cache since league is deleted
                    cacheManager.clearCache('leagues_cache');
                    toast.success('League deleted successfully.');
                    router.push('/all-leagues');
                } else {
                    const data = await response.json();
                    toast.error(data.message || 'Failed to delete league.');
                }
            } catch (error) {
                console.error('Error deleting league:', error);
                toast.error('An error occurred while deleting the league.');
            }
        }
    };

    // Calculate dynamic table data
    const tableData: TableData[] = React.useMemo(() => {
        if (!league) return [];
        const playerStats = new Map<string, TableData>();
        const adminId = league.administrators?.[0]?.id; // Assuming the first admin is the league admin
        league.members.forEach((member) => {
            playerStats.set(member.id, {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                winPercentage: '0%',
                isAdmin: member.id === adminId,
                profilePicture: member.profilePicture || null,
                xp: member?.xp || 0
            });
        });
        league.matches
            .filter((match) => match.status === 'completed' && match.homeTeamGoals != null && match.awayTeamGoals != null)
            .forEach((match) => {
                const homeWon = match.homeTeamGoals! > match.awayTeamGoals!;
                const awayWon = match.awayTeamGoals! > match.homeTeamGoals!;
                const isDraw = match.homeTeamGoals === match.awayTeamGoals;
                const processPlayer = (player: User, isHome: boolean) => {
                    if (playerStats.has(player.id)) {
                        const stats = playerStats.get(player.id)!;
                        stats.played++;
                        if ((isHome && homeWon) || (!isHome && awayWon)) {
                            stats.wins++;
                        } else if (isDraw) {
                            stats.draws++;
                        } else {
                            stats.losses++;
                        }
                    }
                };
                match.homeTeamUsers.forEach((player) => processPlayer(player, true));
                match.awayTeamUsers.forEach((player) => processPlayer(player, false));
            });
        const arr = Array.from(playerStats.values()).map((stats) => ({
            ...stats,
            winPercentage: stats.played > 0 ? `${Math.round((stats.wins / stats.played) * 100)}%` : '0%',
        }));
        arr.sort((a, b) => b.wins - a.wins || b.draws - a.draws || a.losses - b.losses);
        return arr;
    }, [league]);

    const getAvailabilityCounts = (match: Match) => {
        // Find the league for this match
        const leagueForMatch = league; // Assuming 'league' is available in this scope
        const leagueMembers = leagueForMatch?.members || [];
        // Count how many league members are in availableUsers
        const availableCount = leagueMembers.filter(member =>
            match.availableUsers?.some((u: User) => u.id === member.id)
        ).length;
        const pendingCount = leagueMembers.length - availableCount;
        return { availableCount, pendingCount };
    };


    if (loading || !checkedCommonLeague) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !league) {
        return (
            <Box sx={{
                p: 4,
                minHeight: '100vh',
                color: 'black'
            }}>
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToAllLeagues}
                    sx={{ mb: 2, color: 'black' }}
                >
                    Back to All Leagues
                </Button>
                <Typography variant="h6" color="error">
                    {error || 'League not found'}
                </Typography>
            </Box>
        );
    }

    // Access control for non-members
    if (!isMember && !hasCommonLeague) {
        return (
            <Box sx={{ p: 4, minHeight: '100vh' }}>
                <Typography color="error" variant="h6">
                    You don&apos;t have access to this league.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh' }} className='sm:p-8'>
            {!league.active && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This league is currently inactive. All actions are disabled until an admin reactivates it.
                </Alert>
            )}
            
            {/* Sticky Back Button - Positioned at far left */}
            <Box sx={{ 
                // position: 'sticky', 
                // top: 0, 
                // zIndex: 10, 
                // backgroundColor: 'transparent',
                mb: 2,
                display: 'flex',
                justifyContent: 'flex-start',
                ml: 2
            }}>
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToAllLeagues}
                    sx={{
                        color: 'white', 
                        backgroundColor: '#43a047',
                        '&:hover': { backgroundColor: '#388e3c' },
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        px: { xs: 1, sm: 1.5 },
                        py: 0.5,
                        minWidth: 'auto',
                        flexShrink: 0
                    }}
                >
                    Back To All Leagues
                </Button>
            </Box>
            
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 3, backgroundColor: '#1f673b', color: 'white' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: { xs: 'center', md: 'space-between' },
                            mb: 2,
                            gap: { xs: 2, md: 0 }
                        }}
                    >
                        {/* League Name - Centered on large screens */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            flex: 1, 
                            minWidth: 0,
                            justifyContent: { xs: 'flex-start', md: 'flex-start' }
                        }}>
                            <Trophy size={32} />
                            <Typography
                                textTransform="uppercase"
                                component="h1"
                                sx={{
                                    fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
                                    fontWeight: 'bold',
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'wrap',
                                    flexShrink: 1,
                                    minWidth: 0,
                                    textAlign: { xs: 'left', md: 'left' }
                                }}
                            >
                                {league.name}
                            </Typography>
                        </Box>
                        
                        {/* Right side controls */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexShrink: 0,
                                ml: { xs: 0, md: 'auto' },
                                mt: { xs: 1, md: 0 },
                                width: { xs: 'auto', md: 'auto' },
                                justifyContent: { xs: 'flex-end', md: 'flex-end' },
                            }}
                        >
                            {isMember && (
                                    <Chip
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                                                {`Code: ${league.inviteCode}`}
                                            </Typography>
                                            <Chip
                                                label={<Copy size={14} className='stroke-white' />}
                                                onClick={() => navigator.clipboard.writeText(league.inviteCode)}
                                        sx={{
                                            backgroundColor: '#43a047',
                                            '&:hover': { backgroundColor: '#388e3c' },
                                                    minWidth: 'auto',
                                                    height: '20px',
                                                    '& .MuiChip-label': { px: 0.5 }
                                        }}
                                    />
                                        </Box>
                                    }
                                        sx={{
                                            backgroundColor: '#43a047',
                                            '&:hover': { backgroundColor: '#388e3c' },
                                        color: 'white',
                                        maxWidth: { xs: '160px', sm: '180px' },
                                        width: 'auto',
                                        minWidth: 'auto',
                                        height: 'auto',
                                        }}
                                    />
                            )}
                            {isAdmin && (
                                <IconButton
                                    onClick={() => setIsSettingsOpen(true)}
                                    sx={{
                                        ml: 0.5,
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                                        p: 1
                                    }}
                                >
                                    <Settings size={20} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    {/* Navigation Buttons Section - No changes here from previous response */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: { xs: 0.5, sm: 1, md: 2 },
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                        }}
                    >
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: '#43a047',
                                '&:hover': { backgroundColor: '#388e3c' },
                                color: 'white',
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                px: { xs: 1, sm: 1.5 },
                                py: 0.5,
                                minWidth: 'auto'
                            }}
                            startIcon={<Users size={16} className='stroke-white' />}
                            onClick={() => {
                                setSection('members');
                                router.replace(`/league/${leagueId}?tab=members`);
                            }}
                        >
                            {`${league.members?.length || 0} Members`}
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: '#43a047',
                                '&:hover': { backgroundColor: '#388e3c' },
                                color: 'white',
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                px: { xs: 1, sm: 1.5 },
                                py: 0.5,
                                minWidth: 'auto'
                            }}
                            startIcon={<Calendar size={16} className='stroke-white' />}
                            onClick={() => {
                                setSection('matches');
                                router.replace(`/league/${leagueId}?tab=matches`);
                            }}
                        >
                            {`${league.matches?.length || 0} Matches`}
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: '#43a047',
                                '&:hover': { backgroundColor: '#388e3c' },
                                color: 'white',
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                px: { xs: 1, sm: 1.5 },
                                py: 0.5,
                                minWidth: 'auto'
                            }}
                            startIcon={<Table2Icon size={16} className='stroke-white' />}
                            onClick={() => {
                                // Check if points are disabled
                                if (league?.showPoints === false) {
                                    setShowPointsAlert(true);
                                    return;
                                }
                                setSection('table');
                                router.replace(`/league/${leagueId}?tab=table`);
                            }}
                        >
                            Table
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: '#43a047',
                                '&:hover': { backgroundColor: '#388e3c' },
                                color: 'white',
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                px: { xs: 1, sm: 1.5 },
                                py: 0.5,
                                minWidth: 'auto'
                            }}
                            startIcon={<Trophy size={16} className='stroke-white' />}
                            onClick={() => {
                                setSection('awards');
                                router.replace(`/league/${leagueId}?tab=awards`);
                            }}
                        >
                            Trophy Room
                        </Button>

                        {isAdmin && (
                            <Link href={`/league/${leagueId}/match`} passHref>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        backgroundColor: '#43a047',
                                        '&:hover': { backgroundColor: '#388e3c' },
                                        color: 'white',
                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                        px: { xs: 1, sm: 1.5 },
                                        py: 0.5,
                                        minWidth: 'auto'
                                    }}
                                    startIcon={<Calendar size={16} className='stroke-white' />}
                                    disabled={!league.active}
                                >
                                    Schedule Match
                                </Button>
                            </Link>
                        )}
                    </Box>
                </Paper>
            </Box>
            {/* Section Content */}
            <Paper sx={{ backgroundColor: '#1f673b', color: 'white', minHeight: 400 }}>
                {section === 'members' && (
                    // Members Section
                    <Box sx={{ p: 2, maxHeight: 350, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                        <Typography variant="h6" sx={{ backgroundColor: '#1f673b', padding: '10px', color: 'white' }} gutterBottom>
                            League Members
                        </Typography>
                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        {league.members && league.members.length > 0 ? (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                gap: 2
                            }}>
                                {league.members.map((member) => (
                                    <PlayerCard key={member.id} member={{
                                        id: member.id || '',
                                        firstName: member.firstName || '',
                                        lastName: member.lastName || '',
                                        profilePicture: member?.profilePicture || '',
                                        position: member.positionType || undefined,
                                        shirtNumber: member.shirtNumber || 22,
                                    }} />
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                No members yet
                            </Typography>
                        )}
                    </Box>
                )}
                {section === 'matches' && (
                    // Matches Section
                    <Box sx={{ 
                        height: 'auto',
                        overflowY: 'visible', 
                        scrollbarWidth: 'none', 
                        '&::-webkit-scrollbar': { display: 'none' }, 
                        p: 2 
                    }}>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Matches
                        </Typography>
                        {isAdmin && (
                            <Link href={`/league/${leagueId}/match`} passHref>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        backgroundColor: '#43a047',
                                        '&:hover': { backgroundColor: '#388e3c' },
                                        color: 'white',
                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                        px: { xs: 1, sm: 1.5 },
                                        py: 0.5,
                                        minWidth: 'auto'
                                    }}
                                    startIcon={<Calendar size={16} className='stroke-white' />}
                                    disabled={!league.active}
                                >
                                    Schedule Match
                                </Button>
                            </Link>
                        )}
                       </Box>

                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        {league.matches && league.matches.length > 0 ? (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
                                gap: 2
                            }}>
                                {league.matches.slice(0, 5).map((match) => {
                                    const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                                    const { availableCount, pendingCount } = getAvailabilityCounts(match);
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
                                                        <Image src={match.homeTeamImage || leagueIcon} alt={match.homeTeamName || match.homeTeamName} width={48} height={48} />
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
                                                            title={match.homeTeamName || match.homeTeamName}
                                                            >
                                                            {match.homeTeamName || match.homeTeamName}
                                                            </Typography>
                                                        </Box>
                                                    <Typography variant="h5" sx={{ color: 'white', minWidth: 40, textAlign: 'center' }}>
                                                            VS
                                                        </Typography>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        <Image src={match.awayTeamImage || leagueIcon} alt={match.awayTeamName || match.awayTeamName} width={48} height={48} />
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
                                                            title={match.awayTeamName || match.awayTeamName}
                                                            >
                                                            {match.awayTeamName || match.awayTeamName}
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
                                                    {isMember && match.status === 'scheduled' && (
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
                                                                    disabled={!league.active}
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
                                               {match.status === 'schdule' && (
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
                                    );
                                })}
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                No matches scheduled yet
                            </Typography>
                        )}
                    </Box>
                )}

                {section === 'table' && (
                    <div className="w-full mx-auto">
                        <Card sx={{ backgroundColor: '#1f673b' }} className="bg-[#0a4822] border-green-700 text-white overflow-hidden rounded-xl">
                        <div className="p-3">
                          <h2 className="text-lg font-bold text-white">League Table</h2>
                        </div>
                
                        <div className="px-2 pb-2">
                          <div className="bg-[#43a047] rounded-lg px-2 py-1 mb-2 flex items-center">
                            <div className="text-white font-bold text-xs sm:text-sm md:text-base">Pos</div>
                            <div className="ml-2 flex-1 text-white font-bold text-xs sm:text-sm md:text-base">Player</div>
                            <div className="flex gap-0.5 sm:gap-1 md:gap-4 text-white font-bold">
                              <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">P</div>
                              <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">W</div>
                              <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">D</div>
                              <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">L</div>
                              <div className="min-w-10 text-center text-xs sm:text-sm md:text-base">W%</div>
                              <div className="min-w-9 text-center text-xs sm:text-sm md:text-base">Pts</div>
                                        <div className="min-w-[50px] text-center text-xs sm:text-sm md:text-base">XP </div>
                            </div>
                          </div>
                
                          <div className="space-y-[1px]">
                            {tableData.map((player, index) => {
                                        const position = index + 1;
                                        const badge = getBadgeForPosition(position);
                                        const points = player.wins * 3 + player.draws;
                                        const firstName = player.name.split(" ")[0] || player.name; // Ensure first name exists
                                        const lastName = player.name.split(" ").slice(1).join(" ") || ""; // Handle single-name cases
                
                              return (
                                <Link key={player.id} href={`/player/${player.id}`} className="block">
                                                <div className={`${getRowStyles(index)} px-2 py-1.5 min-h-[60px] flex items-start`}>
                                    <div className="w-9 flex items-center justify-center mr-1">
                                      {index < 3 ? (
                                        <div className="w-8 h-8 flex items-center justify-center">{badge}</div>
                                      ) : (
                                        <div className="w-7 h-7 flex items-center justify-center font-bold text-white text-xs sm:text-sm md:text-base">
                                          {badge}
                                        </div>
                                      )}
                                    </div>
                                                    <div className="flex flex-col max-[500px]:flex-col min-[500px]:flex-row items-start min-w-0">
                                                        <div className="max-[500px]:mb-2">
                                                            <div className="w-11 h-11 max-[500px]:w-8 max-[500px]:h-8 rounded-full overflow-hidden bg-white border-2 border-white flex-shrink-0">
                                      <img
                                        src={player.profilePicture || "/placeholder.svg"}
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 max-[500px]:-ml-8 min-[500px]:ml-2">
                                                            {/* <div className="font-bold text-white text-xs sm:text-sm md:text-base uppercase max-[500px]:text-[10px] min-[500px]:block whitespace-nowrap overflow-hidden text-ellipsis">
                                          {firstName}
                                                            </div> */}
                                                            <div className="flex items-center ">
                                                                <div className="text-white font-normal text-xs sm:text-sm md:text-base uppercase max-[500px]:text-[10px] min-[500px]:block whitespace-nowrap overflow-hidden text-ellipsis">
                                                                {firstName}   {lastName}
                                          </div>
                                          {player.isAdmin && <Shield className="text-green-500 w-4 h-4" />}
                                        </div>
                                      </div>
                                    </div>
                
                                                    <div className="flex gap-0.5 sm:gap-1 md:gap-4 ml-auto items-center max-[500px]:mt-4">
                                      <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                        {player.played}
                                      </div>
                                      <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                        {player.wins}
                                      </div>
                                      <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                        {player.draws}
                                      </div>
                                      <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                        {player.losses}
                                      </div>
                                      <div className="min-w-10 text-center text-white text-xs sm:text-sm md:text-base">
                                        {player.winPercentage}
                                      </div>
                                      <div className="min-w-9 text-center text-white text-xs sm:text-sm md:text-base">{points}</div>
                                      <div className="min-w-[50px] text-center text-white text-xs sm:text-sm md:text-base">
                                                            {player.xp}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[1px] bg-white"></div>
                                </Link>
                                        );
                            })}
                          </div>
                        </div>
                      </Card>
                    </div>
                )}

                {section === 'awards' && (
                    // Trophy Room Section
                    <Box sx={{ maxHeight: 'none', p: 0 }}>
                        <TrophyRoom leagueId={leagueId} />
                    </Box>
                )}
            </Paper>

            <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
                <DialogTitle>Teams for {selectedMatch?.homeTeamName} vs {selectedMatch?.awayTeamName}</DialogTitle>
                <DialogContent>
                    {selectedMatch && (
                        <Box>
                            <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName}</Typography>
                            <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <Grid container spacing={1}>
                                {selectedMatch.homeTeamUsers.map(player => (
                                    <Grid xs={6} key={player.id}>
                                        <Chip label={`${player.firstName} ${player.lastName}`} sx={{ m: 0.5, color: 'black' }} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                    {selectedMatch && (
                        <Box>
                            <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName}</Typography>
                            <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <Grid container spacing={1}>
                                {selectedMatch.awayTeamUsers.map(player => (
                                    <Grid xs={6} key={player.id}>
                                        <Chip label={`${player.firstName} ${player.lastName}`} sx={{ m: 0.5, color: 'black' }} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTeamModal}>Close</Button>
                </DialogActions>
            </Dialog>
            <LeagueSettingsDialog
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                league={league}
                onUpdate={handleUpdateLeague}
                onDelete={handleDeleteLeague}
            />
            <Snackbar
                open={!!toastMessage}
                autoHideDuration={3000}
                onClose={() => setToastMessage(null)}
                message={toastMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
            
            {/* Points Disabled Alert */}
            <Snackbar
                open={showPointsAlert}
                autoHideDuration={4000}
                onClose={() => setShowPointsAlert(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setShowPointsAlert(false)} 
                    severity="info" 
                    sx={{ 
                        width: '100%',
                        backgroundColor: '#1f673b',
                        color: 'white',
                        '& .MuiAlert-icon': { color: 'white' },
                        '& .MuiAlert-message': { color: 'white' }
                    }}
                >
                    Admin have disabled the points option. You will not see the points in the table.
                </Alert>
            </Snackbar>
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