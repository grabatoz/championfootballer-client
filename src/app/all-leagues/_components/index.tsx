'use client';

import { useAuth } from '@/lib/hooks';
import { Delete, ExitToApp, People, X } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, TextField, Typography, Container, CircularProgress, TableContainer, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, HandshakeIcon, SettingsIcon, ShieldIcon, ThumbsDownIcon } from 'lucide-react';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { User, League, Match } from '@/types/user';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useDispatch } from 'react-redux';
import { joinLeague } from '@/lib/features/leagueSlice';
import { AppDispatch } from '@/lib/store';

interface TableData {
    id: string;
    name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    winPercentage: string;
    isAdmin?: boolean;
}

interface LeagueMembersDialogProps {
    open: boolean;
    onClose: () => void;
    league: League | null;
    currentUserId: string;
    onRemoveMember: (memberId: string) => void;
    onLeaveLeague: () => void;
}

interface LeagueTableDialogProps {
    open: boolean;
    onClose: () => void;
    data: TableData[];
    isLoading: boolean;
}

function LeagueTableDialog({ open, onClose, data, isLoading }: LeagueTableDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#10b981', color: 'white' }}>League Table</DialogTitle>
            <DialogContent sx={{ p: 0, minHeight: '150px' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '150px' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#10b981' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>P</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}><EmojiEventsIcon fontSize="small" /></TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}><HandshakeIcon fontSize="small" /></TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}><ThumbsDownIcon fontSize="small" /></TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>W%</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={row.id}>
                                          <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SportsSoccerIcon sx={{ color: '#10b981' }} />
                                                <Typography>{row.name}</Typography>
                                                {row.isAdmin && <ShieldIcon className={' stroke-[#10b981]'}  />}
                                            </Box>
                                        </TableCell>
                                        {/* <TableCell>{index + 1}</TableCell>
                                        <TableCell>{row.name}</TableCell> */}
                                        <TableCell>{row.played}</TableCell>
                                        <TableCell>{row.wins}</TableCell>
                                        <TableCell>{row.draws}</TableCell>
                                        <TableCell>{row.losses}</TableCell>
                                        <TableCell>{row.winPercentage}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

function LeagueMembersDialog({ open, onClose, league, currentUserId, onRemoveMember, onLeaveLeague }: LeagueMembersDialogProps) {
    if (!league) return null;

    const isAdmin = league.adminId === currentUserId;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                    <People />
                    <Typography variant="h6">{league.name} - Members</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <List>
                    {league.members.map((member) => {
                        const memberName = `${member.firstName} ${member.lastName}`;
                        return (
                            <React.Fragment key={member.id}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar>
                                            {member.profilePicture ? (
                                                <Image src={member.profilePicture} alt={memberName} width={40} height={40} />
                                            ) : (
                                                `${member.firstName[0]}${member.lastName[0] || ''}`
                                            )}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={memberName}
                                        secondary={member.id === league.adminId ? 'Admin' : 'Member'}
                                    />
                                    {isAdmin && member.id !== currentUserId && (
                                        <IconButton
                    color="error"
                                            onClick={() => onRemoveMember(member.id)}
                >
                                            <Delete />
                                        </IconButton>
                                    )}
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                {!isAdmin && (
                    <Button
                        color="error"
                        startIcon={<ExitToApp />}
                        onClick={onLeaveLeague}
                    >
                        Leave League
                    </Button>
                )}
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

function AllLeagues() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [, setLoading] = useState(false);
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
    const dispatch = useDispatch<AppDispatch>();
    const [leagueImage, setLeagueImage] = useState<File | null>(null);

    const handleJoinLeague = async () => {
        if (!inviteCode.trim()) {
            toast.error('Please enter an invite code');
            return;
        }

        try {
            await dispatch(joinLeague(inviteCode.trim())).unwrap();
            toast.success('Successfully joined the league!');
            setIsJoining(false);
            setInviteCode('');
            fetchUserLeagues();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to join league';
            toast.error(errorMessage);
        }
    };

    const fetchUserLeagues = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setLeagues(data.leagues || []);
            } else {
                toast.error(data.message || 'Failed to fetch leagues');
            }
        } catch {
            toast.error('An error occurred while fetching leagues');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchUserLeagues();
        }
    }, [token, fetchUserLeagues]);

    const handleCreateLeague = async () => {
        if (!leagueName.trim()) {
            toast.error('Please enter a league name');
            return;
        }
        setIsCreating(true);
        try {
            const formData = new FormData();
            formData.append('name', leagueName.trim());
            if (leagueImage) formData.append('image', leagueImage);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // 'Content-Type' mat lagayen, FormData khud set karega
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success('League created successfully!');
                setIsDialogOpen(false);
                setLeagueName('');
                setLeagueImage(null);
                fetchUserLeagues();
                setLoading(true)
            } else {
                toast.error(data.message || 'Failed to create league');
            }
        } catch {
            toast.error('An error occurred while creating the league');
        } finally {
            setIsCreating(false);
            setLoading(false);
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
                const playerStats = new Map<string, TableData>();

                leagueDetails.members.forEach((member: User) => {
                    playerStats.set(member.id, {
                        id: member.id,
                        name: `${member.firstName} ${member.lastName}`,
                        played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        winPercentage: '0%',
                        isAdmin: member.id === (leagueDetails.adminId || leagueDetails.administrators[0]?.id),
                    });
                });

                leagueDetails.matches
                    .filter((match: Match) => match.status === 'completed' && match.homeTeamGoals != null && match.awayTeamGoals != null)
                    .forEach((match: Match) => {
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
                        
                        match.homeTeamUsers.forEach((player: User) => processPlayer(player, true));
                        match.awayTeamUsers.forEach((player: User) => processPlayer(player, false));
                    });
                
                const tableData = Array.from(playerStats.values()).map((stats: TableData) => ({
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
                    members: data.league.members.map((m: User) => ({
                        id: m.id,
                        firstName: m.firstName,
                        lastName: m.lastName,
                        profilePicture: m.profilePicture,
                        email: m.email
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
        } catch {
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
                    sx={{ mb: 2, color: 'white' , backgroundColor:'#1f673b' ,
                        '&:hover': { backgroundColor: '#388e3c' },
                     }}
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
                <Box sx={{ flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
                    <Box sx={{ width: '100%' }}>
                    <Paper
                        elevation={6}
                        sx={{
                            background: '#1f673b',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 3,
                            p: { xs: 2, sm: 3 },
                            color: 'white',
                            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            mb: 4,
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Image src={leagueIcon} alt="League" width={40} height={40} />
                            <Typography variant="h5" fontWeight="bold">Create or Join League</Typography>
                        </Box>

                            
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
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                            {leagues.length === 0 ? (
                                <Box sx={{ gridColumn: '1 / -1' }}>
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
                                        <Typography variant="h6">No leagues found.</Typography>
                                        <Typography variant="body2">Create a new league to get started!</Typography>
                                    </Paper>
                                </Box>
                            ) : (
                                leagues.map((league) => (
                                        <Paper
                                        key={league.id}
                                            elevation={4}
                                            sx={{
                                                borderRadius: 3,
                                                p: 3,
                                                color: 'white',
                                                background: '#1f673b',
                                                // boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
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
                                                <Typography  textTransform="uppercase" variant="h6" fontWeight="bold">{league.name}</Typography>
                                                <IconButton
                                                    sx={{
                                                        position:'absolute',
                                                        color: 'white',
                                                        border: '2px solid white',
                                                        borderRadius: 2,
                                                        right:'0',
                                                        p: 1.2,
                                                    }}
                                                    onClick={() => handleOpenMembers(league)}
                                                >
                                                    <SettingsIcon />
                                                </IconButton>
                                            </Box>
                                            <Typography variant="body2" color="white" mb={1}>
                                                Invite Code: <span style={{ color: '#43a047', fontWeight: 600 }}>{league.inviteCode}</span>
                                            </Typography>
                                            <Typography variant="caption" color="white" mb={2}>
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
                                                    onClick={() => {
                                                        if (league.showPoints === false) {
                                                            toast.error('Points are hidden for this league.');
                                                            return;
                                                        }
                                                        handleOpenTable(league);
                                                    }}
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
                                ))
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Create League Dialog */}
                <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            background: '#1f673b',
                            border: '2px solid #43a047',
                            boxShadow: '0 8px 32px 0 rgba(67,160,71,0.18)',
                            p: 2,
                            color: '#fff',
                        },
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
                        <DialogTitle sx={{ p: 0, fontWeight: 'bold', color: '#fff', fontSize: 22, letterSpacing: 0.5 }}>
                            Create a League
                        </DialogTitle>
                        <IconButton onClick={() => setIsDialogOpen(false)} sx={{ color: '#fff' }}>
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
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateLeague();
                                }
                            }}
                            sx={{
                                mt: 1,
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    background: '#1f673b',
                                    color: '#fff',
                                    borderRadius: 2,
                                    border: '1.5px solid #43a047',
                                    '& fieldset': {
                                        borderColor: '#43a047',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#388e3c',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#43a047',
                                    },
                                    '& input': {
                                        color: '#fff',
                                    },
                                },
                                '& label': {
                                    color: '#fff',
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#fff',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#fff',
                                },
                            }}
                            InputLabelProps={{ sx: { color: '#fff' } }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={handleCreateLeague}
                            variant="contained"
                            disabled={isCreating || !leagueName.trim()}
                            sx={{
                                bgcolor: '#43a047',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                px: 3,
                                boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                                '&:hover': { bgcolor: '#388e3c' },
                            }}
                        >
                            {isCreating ? 'Creating...' : 'Create League'}
                        </Button>
                        <Button
                            onClick={() => setIsDialogOpen(false)}
                            variant="outlined"
                            sx={{
                                color: '#fff',
                                border: '1.5px solid #43a047',
                                borderRadius: 2,
                                px: 3,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: 'rgba(67,160,71,0.08)' },
                            }}
                        >
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
                currentUserId={user?.id || ''}
                onRemoveMember={handleRemoveMember}
                onLeaveLeague={handleLeaveLeague}
            />
        </Box>
    )
}

export default AllLeagues;