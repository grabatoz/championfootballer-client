'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Button, Chip, CircularProgress, Alert } from '@mui/material';
import Trophy from '@/Components/images/awardtrophy.png';
import RunnerUp from '@/Components/images/runnerup.png';
import BaloonD from '@/Components/images/baloond.png';
import Goat from '@/Components/images/goat.png';
import GoldenBoot from '@/Components/images/goldenboot.png';
import KingPlayMaker from '@/Components/images/kingplaymaker.png';
import shield from '@/Components/images/shield.png';
import DarkHourse from '@/Components/images/darkhourse.png';
import Image, { StaticImageData } from 'next/image';
import { useAuth } from '@/lib/hooks';
import { useParams } from 'next/navigation';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    position?: 'Defender' | 'Goalkeeper' | 'Midfielder' | 'Forward';
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

interface Match {
    id: string;
    homeTeamGoals: number;
    awayTeamGoals: number;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    manOfTheMatchVotes: Record<string, string>; // VoterId: VotedForId
    playerStats: Record<string, {
        goals: number;
        assists: number;
    }>;
    status: 'completed' | 'scheduled' | 'ongoing';
}

interface League {
    id: string;
    name: string;
    members: User[];
    matches: Match[];
    maxGames: number;
}

interface TrophyType {
  title: string;
  description: string;
  image: StaticImageData;
  color: string;
  winner?: string | null;
  winnerId?: string | null;
}

const trophies: TrophyType[] = [
  {
    title: 'Champion Footballer',
    description: 'First Place Player In The League Table',
    image: Trophy,
    color: '#FFD700'
  },
  {
    title: 'Runner-Up',
    description: 'Second Place Player In The League Table',
    image: RunnerUp,
    color: '#C0C0C0'
  },
  {
    title: 'Ballon D\'or',
    description: 'Player With The Most MOTM Awards',
    image: BaloonD,
    color: '#FFC107'
  },
  {
    title: 'GOAT',
    description: 'Player With The Highest Win Ratio & Total MOTM Votes',
    image: Goat,
    color: '#F44336'
  },
  {
    title: 'Golden Boot',
    description: 'Player With The Highest Number Of Goals Scored',
    image: GoldenBoot,
    color: '#FF9800'
  },
  {
    title: 'King Playmaker',
    description: 'Player With The Highest Number Of Goals Assisted',
    image: KingPlayMaker,
    color: '#4CAF50'
  },
  {
    title: 'Legendary Shield',
    description: 'Defender Or Goalkeeper With The Lowest Average Number Of Team Goals Conceded',
    image: shield,
    color: '#2196F3'
  },
  {
    title: 'The Dark Horse',
    description: 'Player Outside Of The Top 3 League Position With The Highest Frequency Of MOTM Votes',
    image: DarkHourse,
    color: '#607D8B'
  }
];

const TrophyCard = ({ title, description, image, color, winner }: TrophyType) => (
    <Paper
      elevation={4}
      sx={{
        width: '100%',              // Use full width of the Grid item
        height: 320,                // ✅ Fixed height
        maxWidth: 280,              // ✅ Optional: to keep cards from stretching too wide
        margin: '0 auto',           // Center the card horizontally
        textAlign: 'center',
        borderRadius: '16px',
        border: `2px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        px: 2, py: 3                // Consistent padding
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
          {description}
        </Typography>
        <Image src={image} alt={title} height={80} width={80} style={{ margin: '0 auto' }} />
      </Box>
  
      <Button variant="contained" sx={{ backgroundColor: color, color: 'white', fontWeight: 'bold' }}>
      {winner || 'TBC'}
    </Button>
    </Paper>
  );
  

export default function TrophyRoom() {
    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [calculatedTrophies, setCalculatedTrophies] = useState<TrophyType[]>(trophies);
    const [filter, setFilter] = useState<'all' | 'my'>('all');
    
    const { user, token } = useAuth();
    const params = useParams();
    const leagueId =  params?.id ? String(params.id) : '';

    const playerStats = useMemo(() => {
        const stats: Record<string, PlayerStats> = {};
        if (!league) return stats;

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
                    if (stats[votedForId]) {
                        stats[votedForId].motmVotes++;
                    }
                });
            }

            const homeWon = match.homeTeamGoals > match.awayTeamGoals;
            const awayWon = match.awayTeamGoals > match.homeTeamGoals;
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
                if(awayWon) stats[pId].wins++;
                else if(isDraw) stats[pId].draws++;
                else stats[pId].losses++;
                stats[pId].teamGoalsConceded += match.homeTeamGoals;
            });
        });
        return stats;
    }, [league]);

    const fetchLeagueData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLeague(data.league);
            } else {
                setError(data.message || 'Failed to fetch league data.');
            }
        } catch {
            setError('An error occurred while fetching league data.');
        } finally {
            setLoading(false);
        }
    }, [leagueId, token]);

    const getPlayerName = useCallback((playerId: string) => {
        const player = league?.members.find(p => p.id === playerId);
        return player ? `${player.firstName} ${player.lastName}` : 'Unknown';
    }, [league]);

    const calculateWinners = useCallback(() => {
        if (!league || !Object.keys(playerStats).length) return;
        
        const allPlayerIds = Object.keys(playerStats);

        const sortedLeagueTable = allPlayerIds.sort((a, b) => {
            const statsA = playerStats[a];
            const statsB = playerStats[b];
            if (statsB.wins !== statsA.wins) return statsB.wins - statsA.wins;
            return statsA.losses - statsB.losses;
        });
        const championId = sortedLeagueTable[0];
        const runnerUpId = sortedLeagueTable[1];

        const ballonDorId = allPlayerIds.sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0];

        const goatId = allPlayerIds.sort((a, b) => {
            const statsA = playerStats[a];
            const statsB = playerStats[b];
            const winRatioA = statsA.played > 0 ? statsA.wins / statsA.played : 0;
            const winRatioB = statsB.played > 0 ? statsB.wins / statsB.played : 0;
            if (winRatioB !== winRatioA) return winRatioB - winRatioA;
            return statsB.motmVotes - statsA.motmVotes;
        })[0];
        
        const goldenBootId = allPlayerIds.sort((a, b) => playerStats[b].goals - playerStats[a].goals)[0];

        const kingPlaymakerId = allPlayerIds.sort((a, b) => playerStats[b].assists - playerStats[a].assists)[0];

        const defensivePlayers = allPlayerIds.filter(id => {
            const player = league.members.find(p => p.id === id);
            return player?.position === 'Defender' || player?.position === 'Goalkeeper';
        });
        const legendaryShieldId = defensivePlayers.sort((a, b) => {
            const avgGoalsA = playerStats[a].played > 0 ? playerStats[a].teamGoalsConceded / playerStats[a].played : Infinity;
            const avgGoalsB = playerStats[b].played > 0 ? playerStats[b].teamGoalsConceded / playerStats[b].played : Infinity;
            return avgGoalsA - avgGoalsB;
        })[0];

        const darkHorseCandidates = sortedLeagueTable.slice(3);
        const darkHorseId = darkHorseCandidates.length > 0 ? darkHorseCandidates.sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] : null;
        
        const awards: Record<string, string | null> = {
            'Champion Footballer': championId,
            'Runner-Up': runnerUpId,
            'Ballon D\'or': ballonDorId,
            'GOAT': goatId,
            'Golden Boot': goldenBootId,
            'King Playmaker': kingPlaymakerId,
            'Legendary Shield': legendaryShieldId,
            'The Dark Horse': darkHorseId,
        };

        const updatedTrophies = trophies.map(trophy => {
            const winnerId = awards[trophy.title];
            return {
                ...trophy,
                winnerId: winnerId,
                winner: winnerId ? getPlayerName(winnerId) : 'No Winner',
            };
        });
        setCalculatedTrophies(updatedTrophies);
    }, [league, playerStats, getPlayerName]);

    useEffect(() => {
        if (leagueId && token) {
            fetchLeagueData();
        }
    }, [leagueId, token, fetchLeagueData]);

    useEffect(() => {
        if (league && league.matches.filter(m => m.status === 'completed').length >= league.maxGames) {
            calculateWinners();
        }
    }, [league, playerStats, calculateWinners]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
    }

    if (!league) {
        return <Box sx={{ p: 4 }}><Alert severity="info">No league data found.</Alert></Box>;
    }

    const displayedTrophies = filter === 'all'
        ? trophies
        : calculatedTrophies.filter(t => t.winnerId && user && t.winnerId === user.id);

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh' }}>
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

            {league.matches.length < league.maxGames && (
                <Alert severity="info" sx={{ mb: 4 }}>
                    The league is not over yet! Trophies will be awarded after all {league.maxGames} matches have been played.
                </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                {displayedTrophies.map((trophy, index) => (
                    <Box key={index}>
                        <TrophyCard {...trophy} />
                    </Box>
                ))}
            </Box>
        </Box>
    );
} 