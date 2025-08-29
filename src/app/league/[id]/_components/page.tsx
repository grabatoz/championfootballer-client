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
    Menu,
    ListItemIcon,
    ListItemText,
    Container,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Calendar, Copy, Edit, Settings, Shield, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import leagueIcon from '@/Components/images/league.png';
import Image from 'next/image';
import toast from 'react-hot-toast';
import TrophyRoom from '@/Components/TrophyRoom';
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import CloseIcon from '@mui/icons-material/Close';
import { cacheManager } from "@/lib/cacheManager"
import PlayerStatsDialog from '@/Components/PlayerStatsDialog';
import { LeaderboardResponse } from '@/types/api';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ShirtImg from '@/Components/images/shirtimg.png'


type PlayerStatsMetric = keyof LeaderboardResponse['players'][number];

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
    position?: string;
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

// const getRowStyles = (index: number) => {
//     if (index === 0) {
//         return "bg-[rgba(30,58,138,0.8)]" // First place - darker blue
//     } else if (index === 1) {
//         return "bg-[rgba(30,58,138,0.6)]" // Second place - medium blue
//     } else if (index === 2) {
//         return "bg-[rgba(30,58,138,0.5)]" // Third place - lighter blue
//     }
//     return "bg-[rgba(30,58,138,0.4)]" // All other places - light blue
// }


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
    const [section, setSection] = useState<'members' | 'matches' | 'results' | 'table' | 'awards'>('members');
    const searchParams = useSearchParams();
    const profilePlayerId = typeof searchParams?.get === 'function' ? searchParams.get('profilePlayerId') : '';
    const [hasCommonLeague, setHasCommonLeague] = useState(false);
    const [, setCheckedCommonLeague] = useState(false);
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

    // Leagues dropdown state
    const [allLeagues, setAllLeagues] = useState<League[]>([]);
    const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
    const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);

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
        if (tab === 'table' || tab === 'awards' || tab === 'members' || tab === 'matches' || tab === 'results') {
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

    // Fetch all user leagues for dropdown
    const fetchAllLeagues = useCallback(async () => {
        if (!token) return;

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
                setAllLeagues(uniqueLeagues);
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    }, [token]);

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

    // Fetch all leagues for dropdown
    useEffect(() => {
        fetchAllLeagues();
    }, [fetchAllLeagues]);


    const handleBackToAllLeagues = () => {
        router.push('/all-leagues');
    };

    // Handle league dropdown open/close
    const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLeaguesDropdownAnchor(event.currentTarget);
        setLeaguesDropdownOpen(true);
    };

    const handleLeaguesDropdownClose = () => {
        setLeaguesDropdownOpen(false);
        setLeaguesDropdownAnchor(null);
    };

    // Handle league selection
    const handleLeagueSelect = async (selectedLeagueId: string) => {
        if (selectedLeagueId !== leagueId) {
            // Fetch the new league data first, then update URL and state
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeagueId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.league) {
                        // Update league data first
                        setLeague(data.league);
                        setError(null);

                        // Update URL after data is set
                        router.replace(`/league/${selectedLeagueId}`, { scroll: false });
                    } else {
                        setError('Failed to load league data');
                    }
                } else {
                    setError('Failed to load league data');
                }
            } catch (error) {
                console.error('Error fetching league:', error);
                setError('Failed to load league data');
            }
        }
        handleLeaguesDropdownClose();
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

    // Format match time
    const formatMatchTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
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

    const formatMatchName = (name: string): string => {
        if (!name) return '';
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return `${capitalizedName}`;
    };

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                    py: { xs: 2, md: 4 },
                    px: { xs: 1, md: 0 },
                    background: 'transparent',
                    backgroundAttachment: 'fixed',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <Button
                        startIcon={<ArrowLeft />}
                        onClick={handleBackToAllLeagues}
                        sx={{
                            mb: 2, color: 'white', backgroundColor: '#388e3c',
                            '&:hover': { backgroundColor: '#388e3c' },
                        }}
                    >
                        Back to All Leagues
                    </Button>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {error}
                    </Typography>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                py: { xs: 2, md: 4 },
                px: { xs: 1, md: 0 },
                background: 'transparent',
                backgroundAttachment: 'fixed',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Container maxWidth="lg">
                {/* Show page structure immediately */}

                {/* Access control for non-members - only show when league data is available */}
                {league && !isMember && !hasCommonLeague ? (
                    <Box sx={{ p: 4, minHeight: '100vh' }}>
                        <Typography color="error" variant="h6">
                            You don&apos;t have access to this league.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* League inactive warning - only show when league data is available */}
                        {league && !league.active && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                This league is currently inactive. All actions are disabled until an admin reactivates it.
                            </Alert>
                        )}

                        {/* Back Button */}
                        {/* <Button
                            startIcon={<ArrowLeft />}
                            onClick={handleBackToAllLeagues}
                            sx={{
                                mb: 2, color: 'white', backgroundColor: '#388e3c',
                                '&:hover': { backgroundColor: '#388e3c' },
                                borderRadius: 2
                            }}
                        >
                            Back to All Leagues
                        </Button> */}

                        {/* Header */}
                        <Box sx={{ mb: 4 }}>
                            <Paper sx={{
                                p: 3,
                                // background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                                color: 'white',
                                borderRadius: 3,
                                // border: '2px solid rgba(59, 130, 246, 0.3)',
                                backdropFilter: 'blur(10px)'
                            }}>
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
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        flex: 1,
                                        minWidth: 0,
                                        justifyContent: { xs: 'flex-start', md: 'flex-start' }
                                    }}>
                                        <Trophy size={32} />
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

                                        {/* Leagues Dropdown Menu */}
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
                                            {allLeagues.map((leagueItem) => (
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

                                                        background: leagueItem.id === leagueId ? 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)' : 'transparent',
                                                        border: leagueItem.id === leagueId ? '1px solid rgba(3,136,227,0.35)' : 'none',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                                        },

                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <Trophy size={16} color={leagueItem.id === leagueId ? '#FFFFFF' : '#9CA3AF'} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={leagueItem.name}
                                                        sx={{
                                                            '& .MuiListItemText-primary': {
                                                                fontSize: '0.95rem',
                                                                fontWeight: leagueItem.id === leagueId ? 700 : 500,
                                                                letterSpacing: 0.2,
                                                                color: leagueItem.id === leagueId ? '#FFFFFF' : '#E5E7EB'
                                                            }
                                                        }}
                                                    />
                                                    {leagueItem.id === leagueId && (
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
                                                    )}
                                                </MenuItem>
                                            ))}
                                        </Menu>
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
                                                                backgroundColor: '#2B2B2B',
                                                                '&:hover': { backgroundColor: '#2B2B2B' },
                                                                minWidth: 'auto',
                                                                height: '40px',
                                                                '& .MuiChip-label': { px: 0.5 },

                                                                //  borderRadius: '4px', 
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                                sx={{
                                                    backgroundColor: '#2B2B2B',
                                                    '&:hover': { backgroundColor: '#2B2B2B' },
                                                    color: 'white',
                                                    maxWidth: { xs: '160px', sm: '180px' },
                                                    width: 'auto',
                                                    minWidth: 'auto',
                                                    height: 'auto',
                                                    borderRadius: '7px',
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

                                {/* Navigation Tabs - UEFA Style */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 0,
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: { xs: 'center', sm: 'flex-start' },
                                        borderBottom: '2px solid rgba(255,255,255,0.3)',
                                        mt: 2
                                    }}
                                >
                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'members' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('members');
                                            router.replace(`/league/${leagueId}?tab=members`);
                                        }}
                                    >
                                        Players
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'matches' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('matches');
                                            router.replace(`/league/${leagueId}?tab=matches`);
                                        }}
                                    >
                                        Fixtures
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'results' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('results');
                                            router.replace(`/league/${leagueId}?tab=results`);
                                        }}
                                    >
                                        Results
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'table' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
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
                                      Points Table
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'awards' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('awards');
                                            router.replace(`/league/${leagueId}?tab=awards`);
                                        }}
                                    >
                                        Awards
                                    </Button>

                                    {isAdmin && (
                                        <Link href={`/league/${leagueId}/match`} passHref>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                                                    color: 'white',
                                                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                    px: { xs: 1.5, sm: 2 },
                                                    py: 0.5,
                                                    minWidth: 'auto',
                                                    ml: 2,
                                                    fontWeight: 'bold',
                                                    textTransform: 'none'
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
                        <Paper sx={{
                            // backgroundColor: '#388e3c',
                            // backgroundColor: '#43a047',
                            // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                            // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                            background: 'none',
                            color: 'white',
                            minHeight: 400,
                            // backdropFilter: 'blur(10px)',
                            // border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 3,
                            boxShadow: 'none'
                        }}>
                            {section === 'members' && (
                                // Members Section
                                <Box sx={{
                                    mt: 3, p: 0, maxHeight: 350, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
                                    // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                    backdropFilter: 'blur(10px)',
                                    // border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 3,

                                }}>
                                    {league?.members && league.members.length > 0 && (
                                        <Box sx={{
                                            display: 'grid',
                                            gap: 2
                                        }}>
                                            <Paper elevation={0} sx={{
                                                p: { xs: 1, sm: 0 },
                                                borderRadius: { xs: 2, sm: 3 },
                                                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                // backgroundColor: 'transparent',
                                                minHeight: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}>
                                                {/* Header */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 }, mb: 1, mt: 2 }}>
                                                    <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, flex: 1, ml: 3 }}>Name</Typography>
                                                    <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 } }}>
                                                        {/* <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, mr: 10 }}>Position</Typography> */}
                                                        <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Stats</Typography>
                                                        <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Xp Points</Typography>
                                                        {/* <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>shirtNumber</Typography> */}
                                                    </Box>
                                                </Box>

                                                <Box sx={{
                                                    flex: 1,
                                                    overflow: 'auto',
                                                    borderRadius: { xs: 2, sm: 3 },
                                                    '&::-webkit-scrollbar': {
                                                        display: 'none'
                                                    },
                                                    scrollbarWidth: 'none',
                                                    msOverflowStyle: 'none',
                                                    px: { xs: 0, sm: 1 },
                                                    mt: 0.7
                                                }}>
                                                    <List>
                                                        {league.members.map((member) => (
                                                            <React.Fragment key={member.id}>
                                                                <ListItem
                                                                    onClick={() => {
                                                                        router.push(`/player/${member.id}`);
                                                                    }}
                                                                    sx={{
                                                                        // boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                                        cursor: 'pointer',
                                                                        py: { xs: 1, sm: 2 },
                                                                        px: { xs: 1, sm: 2 },
                                                                        alignItems: 'center',
                                                                        // backgroundColor: '#3B8271',
                                                                        background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                                                                    }}
                                                                >
                                                                    <ListItemAvatar>
                                                                      <Box sx={{ position: 'relative', width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }}>
                                                                        <Image src={ShirtImg} alt="Shirt" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
                                                                        <Box
                                                                          sx={{
                                                                            position: 'absolute',
                                                                            top: 0, left: 0, right: 0, bottom: 0,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            color: '#000', fontWeight: 'bold', fontSize: { xs: 12, sm: 14 },
                                                                            // textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                                                                          }}
                                                                        >
                                                                          {member?.shirtNumber ?? '00'}
                                                                        </Box>
                                                                      </Box>
                                                                    </ListItemAvatar>
                                                                    <ListItemText className={'text-white'} primary={formatMatchName(member.firstName + ' ' + member.lastName)} />
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 8 }, ml: 'auto' }}>
                                                                        <Box sx={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'flex-end', // Changed from 'center' to 'flex-start'
                                                                            // alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
                                                                            minWidth: { xs: 24, sm: 40 },
                                                                            width: { xs: 100, sm: 150 }, // Added fixed width
                                                                            color: 'white'
                                                                        }}>
                                                                            {/* #00C853 */}
                                                                            <SignalCellularAltIcon sx={{ color: 'green', fontSize: { xs: 16, sm: 24 } }} />

                                                                            {/* {member?.position} */}
                                                                        </Box>
                                                                        <Typography variant="h6" component="span" sx={{
                                                                            fontWeight: 'bold',
                                                                            minWidth: { xs: 36, sm: 60 },
                                                                            textAlign: 'center',
                                                                            fontSize: { xs: 13, sm: 20 },
                                                                            color: 'white'
                                                                        }}>
                                                                            {/* {member.shirtNumber} */}
                                                                            {member.xp}
                                                                        </Typography>
                                                                    </Box>
                                                                </ListItem>
                                                                <div className="h-[2px] bg-white"></div>

                                                                {/* <Divider className='h-[1px]' sx={{ backgroundColor: 'white', mb: 0, mt: 0 }} /> */}

                                                            </React.Fragment>
                                                        ))}
                                                    </List>
                                                </Box>
                                                {/* )} */}
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            {section === 'matches' && (
                                // Fixtures Section - Upcoming Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    p: 2
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {/* <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                                            Season Schedule
                                        </Typography> */}
                                        {isAdmin && (
                                            <Link href={`/league/${leagueId}/match`} passHref>
                                                <Button
                                                    // variant="contained"
                                                    size="small"
                                                    sx={{
                                                        background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                                        // '&:hover': { backgroundColor: 'rgba(59, 130, 246, 1)' },
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

                                    {/* <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} /> */}
                                    {league?.matches && league.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                            gap: 2
                                        }}>
                                            {league.matches.filter(match => match.status === 'scheduled').slice(0, 6).map((match) => {
                                                const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                                                const { availableCount, pendingCount } = getAvailabilityCounts(match);
                                                return (

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
                                                                                src={match.homeTeamImage || leagueIcon}
                                                                                alt={match.homeTeamName}
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
                                                                                {formatMatchName(match.homeTeamName)}
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
                                                                                src={match.awayTeamImage || leagueIcon}
                                                                                alt={match.awayTeamName}
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
                                                                                {formatMatchName(match.awayTeamName)}
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
                                                );
                                            })}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            No upcoming matches scheduled yet
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {section === 'results' && (
                                // Results Section - Completed Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    p: 2
                                }}>
                                    {/* <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                                        Match Results
                                    </Typography>
                                    <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} /> */}
                                    {league?.matches && league.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                            gap: 3
                                        }}>
                                            {league.matches.filter(match => match.status === 'completed').slice(0, 6).map((match) => (

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
                                                                            src={match.homeTeamImage || leagueIcon}
                                                                            alt={match.homeTeamName}
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
                                                                            {formatMatchName(match.homeTeamName)}
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
                                                                            src={match.awayTeamImage || leagueIcon}
                                                                            alt={match.awayTeamName}
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
                                                                            {formatMatchName(match.awayTeamName)}
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
                                                                        px: 1, // Add horizontal padding for better proportions
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
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            No completed matches yet
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {section === 'table' && (
                                <div className="w-full mx-auto">
                                    <Card sx={{
                                        // backgroundColor: 'transparent',
                                        // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        // border: '2px solid rgba(59, 130, 246, 0.5)',
                                        borderRadius: 3,
                                        boxShadow: 'none',
                                        mt: 1.2,
                                        // backdropFilter: 'blur(10px)'
                                    }} className="text-white overflow-hidden">
                                        {/* <div className="p-3">
                                            <h2 className="text-lg font-bold text-white">League Table</h2>
                                        </div> */}

                                        <div className="p-3 px-2 pb-2">
                                            {/* bg-[rgba(59,130,246,0.8)] */}
                                            <div className=" rounded-lg px-2 py-1 mb-4 flex items-center">
                                                <div className="text-white font-bold text-xs sm:text-sm md:text-base">Pos</div>
                                                <div className="ml-2 flex-1 text-white font-bold text-xs sm:text-sm md:text-base ml-8">Player</div>
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
                                                            {/* ${getRowStyles(index)} */}
                                                            <div style={{
                                                                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)'
                                                            }} className={`px-2 py-1.5 min-h-[70px] flex items-center`}>
                                                                <div className="w-9 flex items-center mt-2 justify-center mr-1">
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
                                                                        <div className="w-11 h-11 max-[500px]:w-8 max-[500px]:h-8 rounded-full overflow-hidden flex-shrink-0">
                                                                          <div className="relative w-full h-full">
                                                                            {/* Colored shirt using mask */}
                                                                            <div
                                                                              style={{
                                                                                position: 'absolute',
                                                                                inset: 0,
                                                                                backgroundColor: '#00A77F',
                                                                                WebkitMaskImage: `url(${ShirtImg.src})`,
                                                                                maskImage: `url(${ShirtImg.src})`,
                                                                                WebkitMaskRepeat: 'no-repeat',
                                                                                maskRepeat: 'no-repeat',
                                                                                WebkitMaskPosition: 'center',
                                                                                maskPosition: 'center',
                                                                                WebkitMaskSize: 'contain',
                                                                                maskSize: 'contain',
                                                                              }}
                                                                            />
                                                                            {/* Number overlay */}
                                                                            <span className="absolute inset-0 flex items-center justify-content-center text-black font-bold text-xs sm:text-sm flex items-center justify-center">
                                                                              {((league?.members || []).find(m => m.id === player.id)?.shirtNumber ?? '')}
                                                                            </span>
                                                                          </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-0.5 mt-3 max-[500px]:-ml-8 min-[500px]:ml-2">
                                                                        <div className="flex items-center ">
                                                                            <div className="text-white font-normal text-xs sm:text-sm md:text-base max-[500px]:text-[10px] min-[500px]:block whitespace-nowrap overflow-hidden text-ellipsis">
                                                                                {formatMatchName(firstName)}   {formatMatchName(lastName)}
                                                                            </div>
                                                                            {player.isAdmin && <Shield className="text-blue-400 w-4 h-4" />}
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
                                    backgroundColor: 'rgba(30, 58, 138, 0.9)',
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
                    </>
                )}
            </Container>
        </Box>
    );
}