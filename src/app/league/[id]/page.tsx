'use client';

import React, { useState, useEffect } from 'react';
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
    Alert
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Trophy, Calendar, Copy, Edit, Settings } from 'lucide-react';
import Link from 'next/link';
import leagueIcon from '@/Components/images/league.png';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import Img from '@/Components/images/group451.png'


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
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string | null;
}

interface Match {
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
            <DialogTitle sx={{ fontWeight: 'bold' }}>Manage League Settings</DialogTitle>
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

export default function LeagueDetailPage() {
    const [league, setLeague] = useState<League | null>(null);
    console.log('leagues matches', league?.matches)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params.id as string;
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);


    const handleOpenTeamModal = (match: Match) => {
        setSelectedMatch(match);
        setTeamModalOpen(true);
    };

    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    console.log('league', league)

    useEffect(() => {
        if (leagueId && token) {
            fetchLeagueDetails();
        }
    }, [leagueId, token]);

    const fetchLeagueDetails = async () => {
        try {
            setLoading(true);
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
    };

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
        } catch (err: any) {
            console.error('Error updating availability:', err);
            setError(err.message || 'Failed to connect to server');
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
                body: JSON.stringify({ league: updatedData })
            });
            const data = await response.json();
            if (data.success) {
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

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#ffff'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !league) {
        return (
            <Box sx={{
                p: 4,
                backgroundColor: '#000000',
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

    const isAdmin = league.administrators?.some(admin => admin.id === user?.id);

    return (
        <Box sx={{ p: 4, backgroundColor: 'white', minHeight: '100vh' }}>
            {!league.active && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This league is currently inactive. All actions are disabled until an admin reactivates it.
                </Alert>
            )}
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToAllLeagues}
                    sx={{ mb: 2, color: 'black' }}
                >
                    Back to All Leagues
                </Button>

                <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Trophy size={32} />
                        <Typography variant="h4" component="h1">
                            {league.name}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip
                            icon={<Users />}
                            label={`${league.members?.length || 0} Members`}
                            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'black' }}
                        />
                        <Link href={'/all-matches'}>
                            <Chip
                                icon={<Calendar />}
                                label={`${league.matches?.length || 0} Matches`}
                                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'black' }}
                            />
                        </Link>
                        <Chip
                            label={`Invite Code: ${league.inviteCode}`}
                            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'black' }}
                        />
                        <Chip
                            label={<Copy className='hover:stroke-black' />}
                            onClick={() => navigator.clipboard.writeText(league.inviteCode)}
                            sx={{ mr: 1, backgroundColor: 'rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
                        />
                        <Link href={`/league/${leagueId}/trophy-room`} passHref>
                            <Button variant="contained" color="primary">
                                Trophy Room
                            </Button>
                        </Link>
                        {isAdmin && (
                            <IconButton onClick={() => setIsSettingsOpen(true)} sx={{ ml: 1 }}>
                                <Settings />
                            </IconButton>
                        )}
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Members Section */}
                <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            League Members
                        </Typography>
                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                        {league.members && league.members.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {league.members.map((member) => (
                                    <Card key={member.id} sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {member.profilePicture ? (
                                                        <img
                                                            src={`${process.env.NEXT_PUBLIC_API_URL}${member.profilePicture}`}
                                                            alt="Profile"
                                                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                                        />
                                                    ) : (
                                                            <Image
                                                                src={Img}
                                                                alt="Profile"
                                                                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                                                width={20}
                                                                height={20}
                                                            />
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Typography variant="body1" sx={{ color: 'black' }}>
                                                        {member.firstName} {member.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                        {member.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                No members yet
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Matches Section */}
                <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'black', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Matches
                        </Typography>
                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                        {league.matches && league.matches.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {league.matches.slice(0, 5).map((match) => {
                                    const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);

                                    return (
                                        <Card key={match.id} sx={{ backgroundColor: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                                            <CardContent sx={{ p: 2 }}>
                                                {isAdmin && (
                                                    <Link href={`/league/${leagueId}/match/${match.id}/edit`} passHref>
                                                        <IconButton
                                                            size="small"
                                                            sx={{ position: 'absolute', top: 8, right: 8, color: 'black', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
                                                            disabled={!league.active}
                                                        >
                                                            <Edit size={16} />
                                                        </IconButton>
                                                    </Link>
                                                )}

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, sm: 4 }, textAlign: 'center', p: 2 }}>
                                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <Image src={leagueIcon} alt={match.homeTeamName} width={48} height={48} />
                                                        <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                                                            {match.homeTeamName}
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h5" sx={{ color: 'black' }}>
                                                        VS
                                                    </Typography>

                                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <Image src={leagueIcon} alt={match.awayTeamName} width={48} height={48} />
                                                        <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                                                            {match.awayTeamName}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'center', mt: 1 }}>
                                                    {new Date(match.date).toLocaleString()}
                                                </Typography>
                                                <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {match.status === 'scheduled' && (
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => handleToggleAvailability(match.id, isUserAvailable)}
                                                            disabled={availabilityLoading[match.id] || !league.active}
                                                        sx={{
                                                            backgroundColor: isUserAvailable ? '#4caf50' : '#f44336',
                                                            '&:hover': {
                                                                backgroundColor: isUserAvailable ? '#388e3c' : '#d32f2f'
                                                            },
                                                            '&.Mui-disabled': {
                                                                backgroundColor: 'rgba(255,255,255,0.3)',
                                                                color: 'rgba(255,255,255,0.5)'
                                                            }
                                                        }}
                                                    >
                                                            {availabilityLoading[match.id] ? <CircularProgress size={20} color="inherit" /> : (isUserAvailable ? 'Unavailable' : 'Available')}
                                                        </Button>
                                                    )}
                                                    {match.status === 'completed' && (
                                                        <Button
                                                            variant="contained"
                                                            disabled
                                                            sx={{
                                                                '&.Mui-disabled': {
                                                                    backgroundColor: '#43a047',
                                                                    color: 'white'
                                                                }
                                                            }}
                                                        >
                                                            Match Ended
                                                    </Button>
                                                    )}
                                                    {/* <Button
                                                        variant="outlined"
                                                        onClick={() => handleOpenTeamModal(match)}
                                                        sx={{ color: 'black', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }, ml: (match.status === 'scheduled' || match.status === 'completed') ? 1 : 0 }}
                                                        disabled={!league.active}
                                                    >
                                                        View Teams
                                                    </Button> */}
                                                     {(match.homeTeamUsers?.length > 0 || match.awayTeamUsers?.length > 0) && (
                                                    <Link href={`/league/${leagueId}/match/${match.id}/play`} passHref>
                                                        <Button
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#43a047',
                                                                color: 'white', '&:hover': { bgcolor: '#388e3c' }, mt: 1, ml: 1
                                                            }}
                                                            disabled={!league.active}
                                                        >
                                                            View Team & update score card
                                                        </Button>
                                                    </Link>
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
                        {isAdmin && (
                            <Link href={`/league/${leagueId}/match`} passHref>
                                <Button
                                    variant="contained"
                                    sx={{ mt: 2 }}
                                    fullWidth
                                    disabled={!league.active}
                                >
                                    Schedule New Match
                                </Button>
                            </Link>
                        )}
                    </Paper>
                </Box>
            </Box>
            <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
                <DialogTitle>Teams for {selectedMatch?.homeTeamName} vs {selectedMatch?.awayTeamName}</DialogTitle>
                <DialogContent>
                    {selectedMatch && (
                        <Box>
                            <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName}</Typography>
                            <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <Grid container spacing={1}>
                                {selectedMatch.homeTeamUsers.map(player => (
                                    <Grid size={6} key={player.id}>
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
                                    <Grid size={6} key={player.id}>
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
        </Box>
    );
} 