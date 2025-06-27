'use client';

import { useAuth } from '@/lib/hooks';
import { X } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Paper, TextField, Typography, Container, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ShieldIcon from '@mui/icons-material/Shield';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
    adminId?: string;
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

interface TableData {
    position?: number;
    teamName?: string;
    points?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LeagueTableDialog({ open, onClose, data, isLoading }: any) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#10b981', color: 'white' }}>League Table</DialogTitle>
            <DialogContent sx={{ p: 0, minHeight: '150px' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '150px' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#10b981' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>P</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}><EmojiEventsIcon fontSize="small" /></TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}><HandshakeIcon fontSize="small" /></TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}><ThumbDownIcon fontSize="small" /></TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>W%</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {data.map((row: any, idx: any) => (
                                    <TableRow key={row.name}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SportsSoccerIcon sx={{ color: '#10b981' }} />
                                                <Typography>{row.name}</Typography>
                                                {idx === 0 && row.played > 0 && <ShieldIcon sx={{ color: '#10b981' }} />}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{row.played}</TableCell>
                                        <TableCell>{row.wins}</TableCell>
                                        <TableCell>{row.draws}</TableCell>
                                        <TableCell>{row.losses}</TableCell>
                                        <TableCell>{row.winPercentage}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LeagueMembersDialog({ open, onClose, league, currentUserId, onRemoveMember, onLeaveLeague }: any) {
    if (!league) return null;
    const isAdmin = league.adminId === currentUserId;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: 28, mt: 2 }}>League Players</DialogTitle>
            <DialogContent sx={{ bgcolor: '#f0fdfa', pb: 2 }}>
                <Box sx={{ border: '2px solid #10b981', borderRadius: 2, bgcolor: 'white', mb: 4 }}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {league.members.map((member: any, idx: any) => (
                        <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: idx !== league.members.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                            <Typography sx={{ fontWeight: member.id === league.adminId ? 'bold' : 'normal', flex: 1 }}>
                                {member.name} {member.fullName && <span style={{ color: '#888' }}>({member.fullName})</span>}
                            </Typography>
                            {member.id === league.adminId && (
                                <Typography sx={{ color: '#10b981', fontWeight: 500, fontSize: 14, ml: 1 }}>
                                    League Admin
                                </Typography>
                            )}
                            {isAdmin && member.id !== league.adminId && (
                                <IconButton color="error" onClick={() => onRemoveMember(member.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Leave this league</Typography>
                <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    sx={{ fontWeight: 'bold', fontSize: 18, py: 1.5 }}
                    onClick={onLeaveLeague}
                >
                    Leave {league.name}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

function AllLeagues() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [leagues, setLeagues] = useState<League[]>([]);
    const router = useRouter();
    const [leagueName, setLeagueName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { token, user } = useAuth();
    const [openTable, setOpenTable] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [openMembers, setOpenMembers] = useState(false);
    const [selectedTableData, setSelectedTableData] = useState<TableData[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [, setLoadingMembers] = useState(false);

    const handleJoinLeague = async () => {
        if (!inviteCode.trim()) return;

        setIsJoining(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ inviteCode: inviteCode.trim() })
            });

            const data = await response.json();
            if (data.success) {
                setInviteCode('');
                toast.success('Successfully joined league!');
            } else {
                toast.error(data.message || 'Failed to join league');
            }
        } catch (error) {
            console.error('Error joining league:', error);
            toast.error('Failed to join league');
        } finally {
            setIsJoining(false);
        }
    };

    const fetchUserLeagues = async () => {
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
        }
    };
    useEffect(() => {
        if (token) {
            fetchUserLeagues();
        }
    }, [token]);


    const handleCreateLeague = async () => {
        if (!leagueName.trim()) return;

        setIsCreating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: leagueName })
            });

            const data = await response.json();
            if (data.success) {
                setIsDialogOpen(false);
                setLeagueName('');
                fetchUserLeagues(); // Refresh leagues list
                toast.success('League created successfully!');
            } else {
                toast.error(data.message || 'Failed to create league');
            }
        } catch (error) {
            console.error('Error creating league:', error);
            toast.error('Failed to create league');
        } finally {
            setIsCreating(false);
        }
    };

    const handleLeagueClick = (leagueId: string) => {
        router.push(`/league/${leagueId}`);
    };
    const handleLeagueAwardClick = (leagueId: string) => {
        router.push(`/league/${leagueId}/trophy-room`);
    };

    const handleOpenTable = async (league: League) => {
        setOpenTable(true);
        setIsTableLoading(true);
        setSelectedTableData([]); // Clear previous data

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success && data.league) {
                const leagueDetails = data.league;
                const playerStats = new Map();

                leagueDetails.members.forEach((member: any) => {
                    playerStats.set(member.id, {
                        id: member.id,
                        name: `${member.firstName} ${member.lastName}`,
                        played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                    });
                });

                leagueDetails.matches
                    .filter((match: any) => match.status === 'completed' && match.homeTeamGoals != null && match.awayTeamGoals != null)
                    .forEach((match: any) => {
                        const homeWon = match.homeTeamGoals > match.awayTeamGoals;
                        const awayWon = match.awayTeamGoals > match.homeTeamGoals;
                        const isDraw = match.homeTeamGoals === match.awayTeamGoals;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const processPlayer = (player: any, isHome: boolean) => {
                             if (playerStats.has(player.id)) {
                                const stats = playerStats.get(player.id);
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
                        
                        match.homeTeamUsers.forEach((player: any) => processPlayer(player, true));
                        match.awayTeamUsers.forEach((player: any) => processPlayer(player, false));
                    });
                
// eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tableData = Array.from(playerStats.values()).map((stats: any) => ({
                    ...stats,
                    winPercentage: stats.played > 0 ? `${Math.round((stats.wins / stats.played) * 100)}%` : '0%',
                }));

                tableData.sort((a, b) => b.wins - a.wins || b.draws - a.draws || a.losses - b.losses);
                
                setSelectedTableData(tableData);

            } else {
                toast.error(data.message || 'Failed to fetch league table data');
                setOpenTable(false);
            }
        } catch {
            toast.error('An error occurred while fetching table data.');
            setOpenTable(false);
        } finally {
            setIsTableLoading(false);
        }
    };

    const handleOpenMembers = async (league: League) => {
        setLoadingMembers(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                // Find admin (first admin in administrators array)
                const admin = data.league.administrators[0];
                setSelectedLeague({
                    ...league,
                    adminId: admin?.id,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
                    members: data.league.members.map((m: any) => ({
                        id: m.id,
                        name: `${m.firstName} ${m.lastName}`,
                        fullName: m.email // or any other info you want to show
                    })),
                });
                setOpenMembers(true);
            } else {
                toast.error(data.message || 'Failed to fetch league members');
            }
        } catch {
            toast.error('Failed to fetch league members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedLeague) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/users/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Refetch members after removal
            handleOpenMembers(selectedLeague);
        } catch {
            toast.error('Failed to remove member');
        }
    };

    const handleLeaveLeague = async () => {
        if (!selectedLeague) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOpenMembers(false);
            fetchUserLeagues();
        } catch (err) {
            toast.error('Failed to leave league');
        }
    };
    const handleBackToAllLeagues = () => {
        router.push('/dashboard');
    };
    return (
        <Box
            sx={{
                minHeight: '100vh',
                // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
                fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                py: 6,
            }}
        >
            <Container maxWidth="lg">
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToAllLeagues}
                    sx={{ mb: 2, color: 'black' }}
                >
                    Back to Dashboard
                </Button>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        align="center"
                        color="black"
                        sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                    >
                        All Leagues
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        align="center"
                        color="black"
                        sx={{ mt: 1 }}
                    >
                        Manage and join football leagues. Create your own or join with an invite code.
                    </Typography>
                </Box>
                <Grid item xs={12} md={5}>
                    <Paper
                        elevation={6}
                        sx={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 3,
                            p: { xs: 2, sm: 3 },
                            color: 'black',
                            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            mb: 4,
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Image src={leagueIcon} alt="League" width={40} height={40} />
                            <Typography variant="h5" fontWeight="bold">Create or Join League</Typography>
                        </Box>

                        {/* Create Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setIsDialogOpen(true)}
                            sx={{
                                bgcolor: '#43a047',
                                color: 'white',
                                fontWeight: 'bold',
                                mb: 2,
                                borderRadius: 2,
                                boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
                                '&:hover': { bgcolor: '#388e3c' },
                                width: '300px'
                            }}
                        >
                            + Create New League
                        </Button>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <TextField
                                placeholder="Enter invite code"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                size="small"
                                sx={{ backgroundColor: 'white', borderRadius: 1, flex: 1, maxWidth: 300 }}
                            />
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: '#43a047',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: 2,
                                    mt: 1,
                                    '&:hover': { bgcolor: '#388e3c' },
                                }}
                                onClick={handleJoinLeague}
                                disabled={isJoining}
                            >
                                <svg className="w-5 h-5 mr-2" fill="white" viewBox="0 0 24 24">
                                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" />
                                </svg>
                                {isJoining ? 'Joining...' : 'Join League'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={7}>
                        <Grid container spacing={3}>
                            {leagues.length === 0 ? (
                                <Grid item xs={12}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            background: 'rgba(255,255,255,0.06)',
                                            borderRadius: 3,
                                            p: 4,
                                            textAlign: 'center',
                                            color: '#b0bec5',
                                        }}
                                    >
                                        <Typography variant="h6">No leagues found.</Typography>
                                        <Typography variant="body2">Create a new league to get started!</Typography>
                                    </Paper>
                                </Grid>
                            ) : (
                                leagues.map((league) => (
                                    <Grid item xs={12} sm={6} key={league.id}>
                                        <Paper
                                            elevation={4}
                                            sx={{
                                                borderRadius: 3,
                                                p: 3,
                                                color: 'black',
                                                background: 'rgba(255,255,255,0.08)',
                                                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
                                                border: '1px solid rgba(255,255,255,0.18)',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px) scale(1.03)',
                                                    boxShadow: '0 8px 32px 0 rgba(31,38,135,0.27)',
                                                },
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1,
                                            }}
                                        >
                                            <Box display="flex" position={'relative'} alignItems="center" gap={2} mb={1}>
                                                <Image src={leagueIcon} alt="League" width={32} height={32} />
                                                <Typography variant="h6" fontWeight="bold">{league.name}</Typography>
                                                <IconButton
                                                    sx={{
                                                        position:'absolute',
                                                        color: 'black',
                                                        border: '2px solid black',
                                                        borderRadius: 2,
                                                        right:'0',
                                                        p: 1.2,
                                                    }}
                                                    onClick={() => handleOpenMembers(league)}
                                                >
                                                    <SettingsIcon />
                                                </IconButton>
                                            </Box>
                                            <Typography variant="body2" color="black" mb={1}>
                                                Invite Code: <span style={{ color: '#43a047', fontWeight: 600 }}>{league.inviteCode}</span>
                                            </Typography>
                                            <Typography variant="caption" color="black" mb={2}>
                                                Created: {new Date(league.createdAt).toLocaleString()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: '#43a047',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        borderRadius: 2,
                                                        px: 4,
                                                        '&:hover': { bgcolor: '#388e3c' },
                                                    }}
                                                    onClick={() => handleOpenTable(league)}
                                                >
                                                    Table
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    sx={{
                                                        bgcolor: '#43a047',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        borderRadius: 2,
                                                        px: 4,
                                                        boxShadow: '0 2px 8px rgba(0,200,83,0.12)',
                                                        '&:hover': { bgcolor: '#388e3c' },
                                                    }}
                                                    onClick={() => handleLeagueAwardClick(league?.id)}
                                                >
                                                    Award
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    sx={{
                                                        bgcolor: '#43a047',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        borderRadius: 2,
                                                        px: 4,
                                                        '&:hover': { bgcolor: '#388e3c' },
                                                    }}
                                                    onClick={() => handleLeagueClick(league.id)}
                                                >
                                                    View League
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    </Grid>
                </Grid>

                {/* Create League Dialog */}
                <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.27)',
                            p: 2,
                        },
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
                        <DialogTitle sx={{ p: 0, fontWeight: 'bold', color: '#263238' }}>Create a League</DialogTitle>
                        <IconButton onClick={() => setIsDialogOpen(false)}>
                            <X />
                        </IconButton>
                    </Box>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="League Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={leagueName}
                            onChange={(e) => setLeagueName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateLeague()}
                            sx={{
                                input: {
                                    color: '#263238',
                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                    borderRadius: 1,
                                },
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleCreateLeague}
                            variant="contained"
                            disabled={isCreating || !leagueName.trim()}
                            sx={{
                                bgcolor: '#1976d2',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                '&:hover': { bgcolor: '#1565c0' },
                            }}
                        >
                            {isCreating ? 'Creating...' : 'Create League'}
                        </Button>
                        <Button onClick={() => setIsDialogOpen(false)} color="inherit">
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
            <Toaster position="top-center" reverseOrder={false} />
            <LeagueTableDialog
                open={openTable}
                onClose={() => setOpenTable(false)}
                data={selectedTableData}
                isLoading={isTableLoading}
            />
            <LeagueMembersDialog
                open={openMembers}
                onClose={() => setOpenMembers(false)}
                league={selectedLeague}
                currentUserId={user?.id}
                onRemoveMember={handleRemoveMember}
                onLeaveLeague={handleLeaveLeague}
            />
        </Box>
    )
}

export default AllLeagues;