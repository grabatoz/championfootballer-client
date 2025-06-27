'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Chip, CircularProgress, Alert, Grid } from '@mui/material';
import TrophyImg from '@/Components/images/awardtrophy.png';
import RunnerUpImg from '@/Components/images/runnerup.png';
import BaloonDImg from '@/Components/images/baloond.png';
import GoatImg from '@/Components/images/goat.png';
import GoldenBootImg from '@/Components/images/goldenboot.png';
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
import ShieldImg from '@/Components/images/shield.png';
import DarkHorseImg from '@/Components/images/darkhourse.png';
import Image, { StaticImageData } from 'next/image';
import { useAuth } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

// --- Interfaces ---
interface User {
    id: string;
    firstName: string;
    lastName: string;
    position?: 'Defender' | 'Goalkeeper' | 'Midfielder' | 'Forward';
}

interface Match {
    id: string;
    homeTeamGoals: number;
    awayTeamGoals: number;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    manOfTheMatchVotes: Record<string, string>;
    playerStats: Record<string, { goals: number; assists: number }>;
    status: 'completed' | 'scheduled' | 'ongoing';
}

interface League {
    id: string;
    name: string;
    members: User[];
    matches: Match[];
    maxGames: number;
}

interface PlayerStats {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    motmVotes: number;
    teamGoalsConceded: number;
}

interface TrophyType {
  title: string;
  description: string;
  image: StaticImageData;
  color: string;
  winner?: string | null;
  winnerId?: string | null;
  leagueId?: string;
}

// --- Static Trophy Data ---
const trophies: Omit<TrophyType, 'winner' | 'winnerId' | 'leagueId'>[] = [
    { title: 'Champion Footballer', description: 'First Place Player In The League Table', image: TrophyImg, color: '#FFD700' },
    { title: 'Runner-Up', description: 'Second Place Player In The League Table', image: RunnerUpImg, color: '#C0C0C0' },
    { title: 'Ballon D\'or', description: 'Player With The Most MOTM Awards', image: BaloonDImg, color: '#FFC107' },
    { title: 'GOAT', description: 'Player With The Highest Win Ratio & Total MOTM Votes', image: GoatImg, color: '#F44336' },
    { title: 'Golden Boot', description: 'Player With The Highest Number Of Goals Scored', image: GoldenBootImg, color: '#FF9800' },
    { title: 'King Playmaker', description: 'Player With The Highest Number Of Goals Assisted', image: KingPlayMakerImg, color: '#4CAF50' },
    { title: 'Legendary Shield', description: 'Defender Or Goalkeeper With The Lowest Average Number Of Team Goals Conceded', image: ShieldImg, color: '#2196F3' },
    { title: 'The Dark Horse', description: 'Player Outside Of The Top 3 League Position With The Highest Frequency Of MOTM Votes', image: DarkHorseImg, color: '#607D8B' }
];

// --- Reusable Trophy Card Component ---
const TrophyCard = ({ title, description, image, color, winner, onButtonClick }: TrophyType & { onButtonClick?: () => void }) => (
    <Paper
      elevation={4}
      sx={{
        width: '100%',
        height: 320,
        maxWidth: 280,
        margin: '0 auto',
        textAlign: 'center',
        borderRadius: '16px',
        border: `2px solid ${color}`,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        px: 2, py: 3,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>{description}</Typography>
        <Image src={image} alt={title} height={80} width={80} style={{ margin: '0 auto' }} />
      </Box>
  
      <Button 
        variant="contained" 
        sx={{ backgroundColor: color, color: 'white', fontWeight: 'bold' }}
        onClick={onButtonClick}
        disabled={!onButtonClick}
      >
        {winner || 'TBC'}
      </Button>
    </Paper>
);

// --- Helper function to calculate player stats for a single league ---
const calculatePlayerStats = (league: League): Record<string, PlayerStats> => {
    const stats: Record<string, PlayerStats> = {};
    league.members.forEach(p => {
        stats[p.id] = { played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, motmVotes: 0, teamGoalsConceded: 0 };
    });

    league.matches.filter(m => m.status === 'completed').forEach(match => {
        const homePlayers = match.homeTeamUsers.map(p => p.id);
        const awayPlayers = match.awayTeamUsers.map(p => p.id);

        [...homePlayers, ...awayPlayers].forEach(playerId => {
            if (!stats[playerId]) return;
            stats[playerId].played++;
            if (match.playerStats && match.playerStats[playerId]) {
                stats[playerId].goals += match.playerStats[playerId].goals || 0;
                stats[playerId].assists += match.playerStats[playerId].assists || 0;
            }
        });

        if (match.manOfTheMatchVotes) {
            Object.values(match.manOfTheMatchVotes).forEach(votedForId => {
                if (stats[votedForId]) stats[votedForId].motmVotes++;
            });
        }

        const homeWon = match.homeTeamGoals > match.awayTeamGoals;
        const isDraw = match.homeTeamGoals === match.awayTeamGoals;

        homePlayers.forEach(pId => {
            if (!stats[pId]) return;
            if(homeWon) stats[pId].wins++;
            else if(isDraw) stats[pId].draws++;
            else stats[pId].losses++;
            stats[pId].teamGoalsConceded += match.awayTeamGoals;
        });
        awayPlayers.forEach(pId => {
            if (!stats[pId]) return;
            if(!homeWon && !isDraw) stats[pId].wins++;
            else if(isDraw) stats[pId].draws++;
            else stats[pId].losses++;
            stats[pId].teamGoalsConceded += match.homeTeamGoals;
        });
    });
    return stats;
};

// --- Helper function to calculate winners for a single league ---
const calculateLeagueWinners = (league: League, playerStats: Record<string, PlayerStats>): TrophyType[] => {
    if (!Object.keys(playerStats).length) return [];

    const getPlayerName = (playerId: string) => {
        const player = league.members.find(p => p.id === playerId);
        return player ? `${player.firstName} ${player.lastName}` : 'Unknown';
    }

    if (!league || !league.members || !Array.isArray(league.members)) return [];

    const allPlayerIds = Object.keys(playerStats);
    if (allPlayerIds.length === 0) return [];

    const sortedLeagueTable = [...allPlayerIds].sort((a, b) => (playerStats[b].wins * 3 + playerStats[b].draws) - (playerStats[a].wins * 3 + playerStats[a].draws));
    
    const awards: Record<string, string | null> = {
        'Champion Footballer': sortedLeagueTable[0] || null,
        'Runner-Up': sortedLeagueTable[1] || null,
        'Ballon D\'or': [...allPlayerIds].sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] || null,
        'GOAT': [...allPlayerIds].sort((a, b) => {
            const ratioA = playerStats[a].played > 0 ? playerStats[a].wins / playerStats[a].played : 0;
            const ratioB = playerStats[b].played > 0 ? playerStats[b].wins / playerStats[b].played : 0;
            return ratioB - ratioA || playerStats[b].motmVotes - playerStats[a].motmVotes;
        })[0] || null,
        'Golden Boot': [...allPlayerIds].sort((a, b) => playerStats[b].goals - playerStats[a].goals)[0] || null,
        'King Playmaker': [...allPlayerIds].sort((a, b) => playerStats[b].assists - playerStats[a].assists)[0] || null,
        'Legendary Shield': league.members
            .filter(p => p.position === 'Defender' || p.position === 'Goalkeeper')
            .map(p => p.id)
            .sort((a, b) => {
                const avgA = playerStats[a]?.played > 0 ? (playerStats[a].teamGoalsConceded / playerStats[a].played) : Infinity;
                const avgB = playerStats[b]?.played > 0 ? (playerStats[b].teamGoalsConceded / playerStats[b].played) : Infinity;
                return avgA - avgB;
            })[0] || null,
        'The Dark Horse': sortedLeagueTable.slice(3).sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] || null
    };

    return trophies.map(trophy => {
        const winnerId = awards[trophy.title];
        return {
            ...trophy,
            winnerId: winnerId || null,
            winner: winnerId ? getPlayerName(winnerId) : 'No Winner',
            leagueId: league.id,
        };
    });
};

// --- Main Page Component ---
export default function GlobalTrophyRoom() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'my'>('all');
    const { user, token } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchLeagues = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setLeagues(data.leagues || []);
                } else {
                    setError(data.message || 'Failed to fetch leagues.');
                }
            } catch (err) {
                setError('An error occurred while fetching league data.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeagues();
    }, [token]);

    const myAchievements = useMemo(() => {
        if (!user || !leagues.length) return [];
        console.log("Calculating achievements for user:", user.id);
        console.log("Leagues data:", leagues);

        const achievements: TrophyType[] = [];
        leagues.forEach(league => {
            if (!league || !league.matches || !league.maxGames) {
                console.warn("Skipping league due to incomplete data:", league?.id);
                return;
            }

            // Only calculate for completed leagues
            if (league.matches.filter(m => m.status === 'completed').length < league.maxGames) return;
            
            console.log(`Processing completed league ${league.id} for achievements.`);
            const playerStats = calculatePlayerStats(league);
            const leagueTrophies = calculateLeagueWinners(league, playerStats);
            
            const userWonTrophies = leagueTrophies.filter(trophy => trophy.winnerId === user.id);
            if(userWonTrophies.length > 0) {
              console.log(`User won ${userWonTrophies.length} trophies in league ${league.id}:`, userWonTrophies);
            }
            achievements.push(...userWonTrophies);
        });
        console.log("Final achievements:", achievements);
        return achievements;
    }, [leagues, user]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fff' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
    }

    const trophiesToDisplay: TrophyType[] = filter === 'all' 
        ? trophies.map(t => ({...t, winner: 'TBC'}))
        : myAchievements;

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 4, gap: 2 }}>
                <Chip 
                    label="All Trophies" 
                    color={filter === 'all' ? 'primary' : 'default'} 
                    onClick={() => setFilter('all')}
                    sx={{ fontSize: '1rem', py: 2, px: 3, fontWeight: 'bold', cursor: 'pointer' }} 
                />
                <Chip 
                    label="My Achievements" 
                    color={filter === 'my' ? 'primary' : 'default'}
                    variant="outlined" 
                    onClick={() => setFilter('my')}
                    sx={{ fontSize: '1rem', py: 2, px: 3, fontWeight: 'bold', cursor: 'pointer' }} 
                />
            </Box>

            <Grid container spacing={3} justifyContent="center">
                {trophiesToDisplay.length > 0 ? trophiesToDisplay.map((trophy, index) => (
                    <Grid item key={`${trophy.title}-${index}`} xs={12} sm={6} md={4} lg={3}>
                        <TrophyCard 
                            {...trophy}
                            onButtonClick={trophy.leagueId ? () => router.push(`/league/${trophy.leagueId}`) : undefined}
                        />
                    </Grid>
                )) : (
                    <Typography sx={{ mt: 4 }}>
                        {filter === 'my' ? 'You have not won any achievements yet, or the leagues are not finished.' : 'No trophies to display.'}
                    </Typography>
                )}
            </Grid>
        </Box>
    );
} 