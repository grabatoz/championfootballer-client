'use client';

import { Box, Button, Container, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Divider, Dialog, DialogActions, DialogContent, DialogTitle, Chip } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useEffect, useState } from 'react';
import PlayerCard from '@/Components/playercard/playercard';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';

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
    status: 'upcoming' | 'completed';
    leagueId: string;
    league?: {
        id: string;
        name: string;
    };
    homeTeamName?: string;
    awayTeamName?: string;
    homeTeamUsers?: any[];
    awayTeamUsers?: any[];
    availableUsers?: any[];
    homeTeamGoals?: number;
    awayTeamGoals?: number;
}

interface League {
    id: string;
    name: string;
    members?: any[];
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
    console.log('selectedMatch',selectedMatch)
    const { token } = useAuth();
  

    const fetchLeagues = async () => {
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
    };

    const fetchMatchesByLeague = async (leagueId: string) => {
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
    };
    
    useEffect(() => {
        if (token) {
            fetchLeagues();
        }
    }, [token]);

    // Fetch matches whenever selected league changes
   
    useEffect(() => {
        if (token && selectedLeague !== 'all') {
            fetchMatchesByLeague(selectedLeague);
        } else if (selectedLeague === 'all') {
            setMatches([]); // Clear matches when "All Leagues" is selected
            setLoading(false);
        }
    }, [selectedLeague, token]);
    const handleBackToDashboard = () => {
        router.push('/dashboard');
    };

    const handleLeagueChange = (event: any) => {
        const newLeagueId = event.target.value;
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

    const handleOpenTeamModal = (match: Match) => {
        setSelectedMatch(match);
        setTeamModalOpen(true);
    };

    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    // Helper to map player object to PlayerCardProps
    const mapPlayerToCardProps = (player: any): PlayerCardProps => {
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
            profileImage: player?.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture}` : undefined,
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
            match.availableUsers?.some((u: any) => u.id === member.id)
        ).length;
        const pendingCount = leagueMembers.length - availableCount;
        return { availableCount, pendingCount };
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
                backgroundColor:'white',
                py: 6,
            }}
        >
            <Container maxWidth="lg">
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToDashboard}
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
                        sx={{ border:'black' }}
                    >
                        {selectedLeague === 'all' ? 'All Matches' : `League ${selectedLeagueName} Matches`}
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        align="center"
                        color="black"
                        sx={{ mt: 1 }}
                    >
                        {selectedLeague === 'all' 
                            ? 'Select a league to view its matches' 
                            : `Viewing matches for ${selectedLeagueName}`}
                    </Typography>
                </Box>
                {/* League Dropdown */}
                <Box sx={{ mb: 4 }}>
                    <FormControl 
                        fullWidth
                        sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 1,
                            '& .MuiOutlinedInput-root': {
                                color: 'black',
                                '& fieldset': {
                                    borderColor: 'black',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'black',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'black',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'black',
                            },
                            '& .MuiSelect-icon': {
                                color: 'black',
                            },
                        }}
                    >
                        <InputLabel id="league-select-label">Select League</InputLabel>
                        <Select
                            labelId="league-select-label"
                            id="league-select"
                            value={selectedLeague}
                            label="Select League"
                            onChange={handleLeagueChange}
                        >
                            <MenuItem value="all">All Leagues</MenuItem>
                            {leagues.map((league) => (
                                <MenuItem key={league.id} value={league.id}>
                                    {league.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Match Cards */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {loading ? (
                        <Typography color="white" align="center">Loading matches...</Typography>
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
                                background: 'rgba(255,255,255,0.06)',
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
                            return(
                            <Paper
                                key={match.id}
                                elevation={4}
                                sx={{
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 3,
                                    p: 3,
                                    color: 'black',
                                    boxShadow: '0 4px 24px 0 rgba(31,38,135,0.17)',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    position: 'relative',
                                }}
                            >
                                 <Button
                                    variant="outlined"
                                    onClick={() => handleOpenTeamModal(match)}
                                    sx={{ 
                                        position: 'absolute', 
                                        top: 16, 
                                        right: 16, 
                                        color: 'black', 
                                        borderColor: 'black', 
                                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' } 
                                    }}
                                >
                                    See Teams
                                </Button>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, sm: 4 }, textAlign: 'center', p: 2 }}>
                                    {/* Home Team */}
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <Image src={leagueIcon} alt={match.homeTeamName || 'Home Team'} width={48} height={48} style={{ borderRadius: '50%' }} />
                                        <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                                            {match.homeTeamName || match.homeTeam}
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: 'black', fontWeight: 'bold' }}>
                                            {match.homeTeamGoals ?? '-'}
                                        </Typography>
                                    </Box>

                                    {/* Separator */}
                                    <Typography variant="h5" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                                        VS
                                    </Typography>

                                    {/* Away Team */}
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <Image src={leagueIcon} alt={match.awayTeamName || 'Away Team'} width={48} height={48} style={{ borderRadius: '50%' }} />
                                        <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                                            {match.awayTeamName || match.awayTeam}
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: 'black', fontWeight: 'bold' }}>
                                            {match.awayTeamGoals ?? '-'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)', display: 'block', textAlign: 'center' }}>
                                    {new Date(match.date).toLocaleString()}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'center' }}>
                                    <Typography color="success.main">Available: {availableCount}</Typography>
                                    <Typography color="warning.main">Pending: {pendingCount}</Typography>
                                </Box>
                                
                                <Divider sx={{ my: 2, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    
                                    {( () => {
                                        let displayStatus = match.status;

                                        if (displayStatus === 'scheduled' as any) displayStatus = 'upcoming';

                                        const statusInfo = {
                                            upcoming: { label: 'Upcoming', color: 'primary' },
                                            completed: { label: 'Completed', color: 'success' },
                                            cancelled: { label: 'Cancelled', color: 'error' },
                                        };

                                        const currentStatus = statusInfo[displayStatus as keyof typeof statusInfo] || { label: displayStatus, color: 'default'};

                                        return <Chip label={currentStatus.label} color={currentStatus.color as any} />;
                                    })()}

                                </Box>
                            </Paper>
                        )})
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
                                <Grid columns={12} spacing={2}>
                                    {(selectedMatch.homeTeamUsers || []).map((player: any, idx: number) => (
                                        <Grid xs={12} sm={6} md={4} key={player.id || idx}>
                                            <PlayerCard {...mapPlayerToCardProps(player)} width={240} height={400} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                        {selectedMatch && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName || selectedMatch.awayTeam}</Typography>
                                <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                <Grid columns={12} spacing={2}>
                                    {(selectedMatch.awayTeamUsers || []).map((player: any, idx: number) => (
                                        <Grid xs={12} sm={6} md={4} key={player.id || idx}>
                                            <PlayerCard {...mapPlayerToCardProps(player)} width={240} height={400} />
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
            </Container>
        </Box>
    );
} 