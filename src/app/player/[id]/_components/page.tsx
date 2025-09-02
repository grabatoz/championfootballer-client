'use client';

import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Paper,
    Box,
    Avatar,
    Select,
    MenuItem,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Tabs,
    Tab,
    Divider,
    Card,
    CardContent,
    Drawer,
    IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayerStats, setLeagueFilter, setYearFilter, clearPlayerStats } from '@/lib/features/playerStatsSlice';
import TrophyImg from '@/Components/images/awardtrophy.png';
import RunnerUpImg from '@/Components/images/runnerup.png';
import BaloonDImg from '@/Components/images/baloond.png';
import GoatImg from '@/Components/images/goat.png';
import GoldenBootImg from '@/Components/images/goldenboot.png';
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
import ShieldImg from '@/Components/images/shield.png';
import DarkHorseImg from '@/Components/images/darkhourse.png';
import Image, { StaticImageData } from 'next/image';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import flag from '@/Components/images/league.png';
// import Goals from '@/Components/images/goal.png';
// import Imapct from '@/Components/images/imapct.png';
// import Assist from '@/Components/images/Assist.png';
// import Defence from '@/Components/images/defence.png';
// import MOTM from '@/Components/images/MOTM.png';
// import CleanSheet from '@/Components/images/cleansheet.png';
import { useAuth } from '@/lib/hooks';
import Link from 'next/link';

type LeagueInfo = { id: string; name: string; matches?: LeagueMatch[]; createdAt?: string };
type LeagueWithMatchesTyped = LeagueInfo & {
    matches?: LeagueMatch[];
    members?: { id: string }[];
};

type TrophyAward = {
    leagueName: string;
    winnerId: string;
    winnerName?: string;
    winner?: string;
    winner_id?: string;
};

type AllTrophyAward = {
    key: string;
    leagueName: string;
    winnerId: string;
    winnerName: string;
};

const trophyDetails: Record<string, { image: StaticImageData; description: string }> = {
    'Champion Footballer': {
        image: TrophyImg,
        description: 'First Place Player In The League Table',
    },
    'Runner Up': {
        image: RunnerUpImg,
        description: 'Second Place Player In The League Table',
    },
    "Ballon d'Or": {
        image: BaloonDImg,
        description: 'Player With The Most MOTM Awards',
    },
    'GOAT': {
        image: GoatImg,
        description: 'Player With The Highest Win Ratio & Total MOTM Votes',
    },
    'Golden Boot': {
        image: GoldenBootImg,
        description: 'Player With The Highest Number Of Goals Scored',
    },
    'King Playmaker': {
        image: KingPlayMakerImg,
        description: 'Player With The Highest Number Of Goals Assisted'
        ,
    },
    'Legendary Shield': {
        image: ShieldImg,
        description: 'Defender Or Goalkeeper With The Lowest Average Number Of Team Goals Conceded',
    },
    'The Dark Horse': {
        image: DarkHorseImg,
        description: 'Player With The Most Unexpected Performance',
    },
};

const metrics = [
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
    { key: 'cleanSheets', label: 'Clean Sheets' },
    { key: 'motmVotes', label: 'MOTM Votes' },
    { key: 'impact', label: 'Impact' },
    { key: 'defence', label: 'Defence' },
    { key: 'freeKicks', label: 'Free Kicks' },
    { key: 'penalties', label: 'Penalties' },
];

interface LeaderboardPlayer {
    id: string;
    name: string;
    position: string;
    profilePicture?: string;
    value: number;
    shirtNo?: string;
    age?: number;
    style?: string;
    positionType?: string;
    preferredFoot?: string;
}

interface League {
    id: string;
    name: string;
}

type LeagueMatch = {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    date: string;
    end?: string;
    location?: string;
    playerStats?: {
        freeKicks: number;
        defence: number;
        impact: number;
        penalties: number;
        goals?: number;
        assists?: number;
        cleanSheets?: number;
        motmVotes?: number;
    };
    homeTeamUsers?: { id: string }[];
    awayTeamUsers?: { id: string }[];
};

const PlayerStatsPage = () => {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const { token } = useAuth();

    // Move useState to the top, before any early returns or effects
    const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(null);

    const { data, filters } = useSelector((state: RootState) => state.playerStats);
    const { leagueId, year } = filters;

    const [tab, setTab] = React.useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTab(newValue);

    // Leaderboard states
    const [selectedMetric, setSelectedMetric] = useState('goals');
    const [leaderboardPlayers, setLeaderboardPlayers] = useState<LeaderboardPlayer[]>([]);
    // Use playerId from URL for selection and highlighting
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeaderboardLeague, setSelectedLeaderboardLeague] = useState<string>('');

    // New filters for leaderboard
    // const [ageFilter, setAgeFilter] = useState('');
    // const [styleFilter, setStyleFilter] = useState('');
    const [positionFilter, setPositionFilter] = useState('');
    // const [positionTypeFilter, setPositionTypeFilter] = useState('');
    // const [footFilter, setFootFilter] = useState('');

    // Filter dialog state
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);

    // Fetch leagues for leaderboard
    useEffect(() => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    const userLeagues = [
                        ...(data.user.leagues || []),
                        ...(data.user.administeredLeagues || [])
                    ];
                    // Remove duplicates
                    const uniqueLeagues = Array.from(new Map(userLeagues.map((league: League) => [league.id, league])).values());
                    setLeagues(uniqueLeagues);
                    if (uniqueLeagues.length > 0) {
                        setSelectedLeaderboardLeague(uniqueLeagues[0].id);
                    }
                }
            });
    }, [token]);

    // Fetch all leaderboard players once
    useEffect(() => {
        if (!selectedLeaderboardLeague || !token) return;
        setLeaderboardLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard?leagueId=${selectedLeaderboardLeague}`)
            .then(res => res.json())
            .then(data => {
                setLeaderboardPlayers(data.players || []);
                setLeaderboardLoading(false);
                // Remove setSelectedPlayerId from leaderboard fetch effect
            })
            .catch(() => {
                setLeaderboardLoading(false);
            });
    }, [selectedLeaderboardLeague, token]);

    // Fetch leaderboard when metric or league changes
    useEffect(() => {
        if (!selectedLeaderboardLeague || !token) return;
        setLeaderboardLoading(true);

        // Build query params
        const params = new URLSearchParams({
            metric: selectedMetric,
            leagueId: selectedLeaderboardLeague,
        });
        if (positionFilter) params.append('positionType', positionFilter);
        // Add other filters as needed, e.g.:
        // if (ageFilter) params.append('age', ageFilter);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard?${params.toString()}`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setLeaderboardPlayers(data.players || []);
                setLeaderboardLoading(false);
            })
            .catch(() => {
                setLeaderboardLoading(false);
            });
    }, [selectedMetric, selectedLeaderboardLeague, token, positionFilter]);

    useEffect(() => {
        if (playerId) {
            dispatch(fetchPlayerStats({ playerId, leagueId, year }));
        }
        return () => {
            dispatch(clearPlayerStats());
        };
    }, [dispatch, playerId]);

    useEffect(() => {
        if (playerId) {
            dispatch(fetchPlayerStats({ playerId, leagueId, year }));
        }
    }, [dispatch, playerId, leagueId, year]);

    const handleLeagueChange = (event: SelectChangeEvent<string>) => {
        dispatch(setLeagueFilter(event.target.value));
    };
    const handleYearChange = (value: dayjs.Dayjs | null) => {
        dispatch(setYearFilter(value ? value.format('YYYY') : 'all'));
        dispatch(setLeagueFilter('all'));
    };
    const handleShowAllYears = () => {
        dispatch(setYearFilter('all'));
    };

    const handleLeaderboardPlayerClick = (clickedId: string) => {
        if (clickedId !== playerId) {
            router.push(`/player/${clickedId}`);
        }
    };

    // Use playerId from URL for highlighting and selection
    // const selectedPlayer = leaderboardPlayers.find(p => p.id === playerId);

    const { data: fullPlayerData } = useSelector((state: RootState) => state.playerStats);
    console.log('fullPlayerData', fullPlayerData);

    // --- Trophy Room Calculation Logic ---
    const allTrophyAwards = React.useMemo(() => {
        if (!data || !data.trophies) return [];
        const awards: AllTrophyAward[] = [];
        Object.entries(data.trophies).forEach(([trophyKey, winners]) => {
            if (Array.isArray(winners)) {
                (winners as TrophyAward[]).forEach((award: TrophyAward) => {
                    awards.push({
                        key: trophyKey,
                        leagueName: award.leagueName,
                        winnerId: award.winnerId,
                        winnerName: award.winnerName || award.winner || award.winner_id || '',
                    });
                });
            }
        });
        return awards;
    }, [data]);

    // Remove main content area loading spinner and loading state check
    // Only show leaderboardLoading spinner in the leaderboard box

    return (
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh' }}>
            <Box sx={{ width: '100%', mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* Back Button - Left side */}
                {/* <Button
                    variant="outlined"
                    color="inherit"
                    sx={{
                        color: '#1f673b',
                        borderColor: '#1f673b',
                        fontWeight: 600,
                        textTransform: 'none',
                        mr: 2,
                        ml: 3,
                        fontSize: { xs: '12px', sm: '14px', md: '16px' },
                        px: { xs: 1, sm: 2, md: 3 },
                        py: { xs: 0.5, sm: 1, md: 1.5 },
                        height: { xs: 32, sm: 36, md: 40 },
                        '&:hover': {
                            borderColor: '#388e3c',
                            backgroundColor: 'rgba(31,103,59,0.1)'
                        }
                    }}
                    onClick={() => {
                        // Try to go back, if no previous page, go to dashboard
                        router.push('/all-players');
                    }}
                >
                    ← Back to All Players
                </Button> */}

                <Box
                    sx={{
                        // background: '#1f673b',
                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                        borderRadius: 3,
                        px: { xs: 1, sm: 2, md: 3 },
                        py: 0.5,
                        boxShadow: 1,
                        display: { xs: 'none', sm: 'none', md: 'inline-flex', lg: 'inline-flex' },
                        justifyContent: 'center',
                        flex: 1,
                        maxWidth: 'fit-content',
                        mx: 'auto',
                        overflow: 'hidden'
                    }}
                >
                    <Tabs
                        value={tab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' },
                                minWidth: 0,
                                width: 'auto',
                                px: { xs: 1, sm: 1.5, md: 2 },
                                textTransform: 'none',
                                '&.Mui-selected': {
                                    color: '#fff',
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#fff',
                                height: 3
                            }
                        }}
                    >
                        <Tab label="Overview" />
                        <Tab label="Stats" />
                        <Tab label="Awards" />
                        <Tab label="Leagues Overview" />
                    </Tabs>
                </Box>

                {/* Top Players Filter Button - Right side */}
                <Box sx={{ display: { xs: 'flex', md: 'none', lg: 'none' }, justifyContent: 'flex-end', ml: 'auto' }}>
                    <IconButton
                        onClick={() => setFilterDialogOpen(true)}
                        sx={{
                            color: 'white',
                            bgcolor: 'rgba(31,103,59,0.9)',
                            '&:hover': { bgcolor: 'rgba(31,103,59,1)' },
                            boxShadow: 2,
                            borderRadius: 0,
                            fontSize: { xs: '10px', sm: '12px' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.5, sm: 1 },
                            height: { xs: 28, sm: 32 },
                            width: { xs: 'auto', sm: 'auto' },
                            '& .MuiIconButton-label': {
                                fontSize: { xs: '10px', sm: '12px' }
                            }
                        }}
                    >
                        Top Players <FilterListIcon sx={{ fontSize: { xs: '14px', sm: '16px' } }} />
                    </IconButton>
                </Box>
            </Box>
            <Paper elevation={4} sx={{
                p: { xs: 2, md: 4 },
                // backgroundColor: '#1f673b',
                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                minHeight: { xs: '70vh', md: '80vh' },
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Responsive main flex layout: sidebar left, awards right (row on md+, column on xs/sm) */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'stretch',
                        gap: 4,
                        mb: 4,
                        flex: 1,
                        minHeight: 0,
                        width: '100%',
                    }}
                >
                    {/* Sidebar: fixed width on md+, full width on mobile */}
                    <Box sx={{
                        width: { xs: '100%', md: 280 },
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        flexShrink: 0,
                        mb: { xs: 3, md: 0 },
                    }}>
                        <Box
                            sx={{
                                width: '100%',
                                maxWidth: '100%',
                                background: 'transparent',
                                borderRadius: 4,
                                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                p: { xs: 1.5, sm: 2, md: 2 },
                                position: 'sticky',
                                top: 0,
                                zIndex: 2,
                                gap: { xs: 1, sm: 2, md: 2 },
                                height: { xs: 180, sm: 180, md: 150 },
                                // overflow: 'auto',
                                '&::-webkit-scrollbar': { display: 'none' },
                                // scrollbarWidth: 'none',
                                // msOverflowStyle: 'none',
                                border: '2px solid #e56a16'
                            }}
                        >
                            <Avatar
                                src={fullPlayerData?.player?.avatar || '/assets/group451.png'}
                                alt={fullPlayerData?.player?.name}
                                sx={{
                                    width: { xs: 85, sm: 85, md: 90 },
                                    height: { xs: 100, sm: 100, md: 90 },
                                    borderRadius: 3,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                                    border: '3px solid #fff',
                                    objectFit: 'cover',
                                    background: '#eee',
                                    flexShrink: 0,
                                    // mr: { sm: 3, xs: 0 },
                                    // mb: { xs: 2, sm: 0 },
                                }}
                            />
                            <Box sx={{
                                textAlign: 'left',
                                display: { xs: 'none', md: 'block' },
                                flex: 1,
                                minWidth: 0
                            }}>
                                <Typography variant="h6" sx={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    mb: 0.5,
                                    fontSize: { xs: '16px', sm: '18px', md: '20px' }
                                }}>{fullPlayerData?.player?.name}</Typography>
                                <Typography variant="body2" sx={{
                                    color: '#B2DFDB',
                                    mb: 1,
                                    fontSize: { xs: '12px', sm: '14px', md: '14px' }
                                }}>Shirt No {fullPlayerData?.player?.shirtNo || '00'}</Typography>
                            </Box>
                            <Box sx={{
                                flex: 1,
                                display: { xs: 'block', sm: 'block', md: 'none' },
                                minWidth: 0,
                                width: '100%'
                            }}>
                                <Typography variant="h4" sx={{
                                    fontWeight: 'bold',
                                    color: 'white',
                                    mb: 2,
                                    fontSize: { xs: '18px', sm: '20px', md: '24px' }
                                }}>{fullPlayerData?.player?.name}</Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: { xs: 1, sm: 2 },
                                    fontSize: { xs: '12px', sm: '14px' }
                                }}>
                                    <Typography variant="body1" sx={{
                                        color: '#B2DFDB',
                                        fontWeight: 500,
                                        fontSize: { xs: '11px', sm: '12px', md: '14px' }
                                    }}>Age: {fullPlayerData?.player?.age || '-'}</Typography>
                                    <Typography variant="body1" sx={{
                                        color: '#B2DFDB',
                                        fontWeight: 500,
                                        fontSize: { xs: '11px', sm: '12px', md: '14px' }
                                    }}>Style: {fullPlayerData?.player?.style || '-'}</Typography>
                                    <Typography variant="body1" sx={{
                                        color: '#B2DFDB',
                                        fontWeight: 500,
                                        fontSize: { xs: '11px', sm: '12px', md: '14px' }
                                    }}>Position: {fullPlayerData?.player?.position || '-'}</Typography>
                                    <Typography variant="body1" sx={{
                                        color: '#B2DFDB',
                                        fontWeight: 500,
                                        fontSize: { xs: '11px', sm: '12px', md: '14px' }
                                    }}>Position Type: {fullPlayerData?.player?.positionType || '-'}</Typography>
                                    <Typography variant="body1" sx={{
                                        color: '#B2DFDB',
                                        fontWeight: 500,
                                        fontSize: { xs: '11px', sm: '12px', md: '14px' }
                                    }}>Preferred Foot: {fullPlayerData?.player?.preferredFoot || '-'}</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Paper
                            elevation={4}
                            sx={{
                                p: 3,
                                backgroundColor: 'transparent',
                                borderRadius: 4,
                                height: 370,
                                overflowY: 'auto',
                                width: '100%',
                                maxWidth: '100%',
                                mx: 'auto',
                                position: 'sticky',
                                top: 230,
                                zIndex: 1,
                                '&::-webkit-scrollbar': { display: 'none' },
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                border: '2px solid #e56a16',
                                display: { xs: 'none', md: 'block' },

                            }}
                        >
                            <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>Top Players</Typography>
                            {/* League and Metric Selects */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: '100%', background: 'white', borderRadius: 1 }}>
                                    <InputLabel sx={{ color: '#fff' }}>League</InputLabel>
                                    <Select
                                        value={selectedLeaderboardLeague}
                                        label="League"
                                        onChange={e => setSelectedLeaderboardLeague(e.target.value)}
                                        sx={{
                                            background: '#df571a',
                                            color: '#fff',
                                            '& .MuiSelect-icon': { color: '#fff' },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    background: '#fff',
                                                    color: '#000000',
                                                }
                                            }
                                        }}
                                    >
                                        {leagues.map((l) => (
                                            <MenuItem key={l.id} value={l.id} sx={{ color: '#000000' }}>{l.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: '100%', background: 'white', borderRadius: 1 }}>
                                    <InputLabel sx={{ color: '#fff' }}>Metric</InputLabel>
                                    <Select
                                        value={selectedMetric}
                                        label="Metric"
                                        onChange={e => setSelectedMetric(e.target.value)}
                                        sx={{
                                            background: '#dd501c',
                                            color: '#fff',
                                            '& .MuiSelect-icon': { color: '#fff' },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    background: '#fff',
                                                    color: '#000000',
                                                }
                                            }
                                        }}
                                    >
                                        {metrics.map((m) => (
                                            <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: '100%', background: 'white', borderRadius: 1 }}>
                                    <InputLabel sx={{ color: '#fff' }}>Position Type</InputLabel>
                                    <Select
                                        value={positionFilter || ''}
                                        label="Position Type"
                                        onChange={e => setPositionFilter(e.target.value)}
                                        sx={{
                                            background: '#da471e',
                                            color: '#fff',
                                            '& .MuiSelect-icon': { color: '#fff' },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e56a16',
                                            },
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    background: '#fff',
                                                    color: '#000000',
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="Forward">Forward</MenuItem>
                                        <MenuItem value="Midfielder">Midfielder</MenuItem>
                                        <MenuItem value="Defender">Defender</MenuItem>
                                        <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            {/* Leaderboard List */}
                            {leaderboardLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress sx={{ color: '#4caf50' }} />
                                </Box>
                            ) : leaderboardPlayers.length === 0 ? (
                                <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                                    No players found for the selected criteria.
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'grid', gap: 2 }}>
                                    {leaderboardPlayers.map((player) => (
                                        <React.Fragment key={player.id}>
                                            <Paper
                                                sx={{
                                                    display: 'flex',
                                                    color: 'white',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: 'none',
                                                    background: '#df571a',
                                                    border:'1px solid #e56a16'
                                                }}
                                                onClick={() => handleLeaderboardPlayerClick(player.id)}
                                            >
                                                <Avatar
                                                    src={
                                                        player?.profilePicture
                                                            ? (player.profilePicture || '/assets/group.svg'
                                                                ? player.profilePicture
                                                                : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : '/' + player.profilePicture}`)
                                                            : '/assets/group451.png'
                                                    }
                                                    sx={{ width: 50, height: 50, mr: 2 }}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>{player.name}</Typography>
                                                </Box>
                                            </Paper>
                                            <Divider sx={{ borderColor: '#fff' }} />
                                        </React.Fragment>
                                    ))}
                                </Box>
                            )}
                        </Paper>

                        {/* Filter Dialog for small screens */}
                        <Drawer
                            anchor="right"
                            open={filterDialogOpen}
                            onClose={() => setFilterDialogOpen(false)}
                            sx={{
                                '& .MuiDrawer-paper': {
                                    bgcolor: '#1f673b',
                                    color: 'white',
                                    width: 340,
                                    maxWidth: '100vw',
                                    height: '100%',
                                    p: 0,
                                    borderTopLeftRadius: 8,
                                    borderBottomLeftRadius: 8,
                                }
                            }}
                        >
                            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        Filter Players
                                    </Typography>
                                    <IconButton
                                        onClick={() => setFilterDialogOpen(false)}
                                        sx={{ color: 'white' }}
                                    >
                                        ✕
                                    </IconButton>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                                    <FormControl size="small" sx={{ background: 'white', borderRadius: 1 }}>
                                        <InputLabel sx={{ color: '#fff' }}>League</InputLabel>
                                        <Select
                                            value={selectedLeaderboardLeague}
                                            label="League"
                                            onChange={e => setSelectedLeaderboardLeague(e.target.value)}
                                            sx={{
                                                background: '#0a3e1e',
                                                color: '#fff',
                                                '& .MuiSelect-icon': { color: '#fff' },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#4caf50',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#388e3c',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#43a047',
                                                },
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        background: '#0a3e1e',
                                                        color: '#fff',
                                                    }
                                                }
                                            }}
                                        >
                                            {leagues.map((l) => (
                                                <MenuItem key={l.id} value={l.id} sx={{ color: '#fff' }}>{l.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ background: 'white', borderRadius: 1 }}>
                                        <InputLabel sx={{ color: '#1f673b' }}>Metric</InputLabel>
                                        <Select
                                            value={selectedMetric}
                                            label="Metric"
                                            onChange={e => setSelectedMetric(e.target.value)}
                                            sx={{
                                                background: '#0a3e1e',
                                                color: '#fff',
                                                '& .MuiSelect-icon': { color: '#fff' },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#4caf50',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#388e3c',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#43a047',
                                                },
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        background: '#0a3e1e',
                                                        color: '#fff',
                                                    }
                                                }
                                            }}
                                        >
                                            {metrics.map((m) => (
                                                <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ background: 'white', borderRadius: 1 }}>
                                        <InputLabel sx={{ color: '#1f673b' }}>Position Type</InputLabel>
                                        <Select
                                            value={positionFilter || ''}
                                            label="Position Type"
                                            onChange={e => setPositionFilter(e.target.value)}
                                            sx={{
                                                background: '#0a3e1e',
                                                color: '#fff',
                                                '& .MuiSelect-icon': { color: '#fff' },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#4caf50',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#388e3c',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#43a047',
                                                },
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        background: '#0a3e1e',
                                                        color: '#fff',
                                                    }
                                                }
                                            }}
                                        >
                                            <MenuItem value="">All</MenuItem>
                                            <MenuItem value="Forward">Forward</MenuItem>
                                            <MenuItem value="Midfielder">Midfielder</MenuItem>
                                            <MenuItem value="Defender">Defender</MenuItem>
                                            <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                {/* Players List in Drawer */}
                                <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                                    {leaderboardLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                            <CircularProgress sx={{ color: '#4caf50' }} />
                                        </Box>
                                    ) : leaderboardPlayers.length === 0 ? (
                                        <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                                            No players found for the selected criteria.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'grid', gap: 2 }}>
                                            {leaderboardPlayers.map((player) => (
                                                <React.Fragment key={player.id}>
                                                    <Paper
                                                        sx={{
                                                            display: 'flex',
                                                            color: 'white',
                                                            alignItems: 'center',
                                                            background: '#1f673b',
                                                            cursor: 'pointer',
                                                            boxShadow: 'none',
                                                        }}
                                                        onClick={() => {
                                                            handleLeaderboardPlayerClick(player.id);
                                                            setFilterDialogOpen(false);
                                                        }}
                                                    >
                                                        <Avatar
                                                            src={
                                                                player?.profilePicture
                                                                    ? (player.profilePicture || '/assets/group.svg'
                                                                        ? player.profilePicture
                                                                        : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : '/' + player.profilePicture}`)
                                                                    : '/assets/group451.png'
                                                            }
                                                            sx={{ width: 50, height: 50, mr: 2 }}
                                                        />
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>{player.name}</Typography>
                                                        </Box>
                                                    </Paper>
                                                    <Divider sx={{ borderColor: '#fff' }} />
                                                </React.Fragment>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Drawer>
                    </Box>
                    <Box sx={{ width: '100%', justifyContent: 'center', display: { xs: 'flex', sm: 'flex', md: 'none' }, mt: { xs: -5, sm: -5, md: 0 } }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                               background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                borderRadius: 3,
                                px: { xs: 1, sm: 2, md: 3 },
                                py: 0.5,
                                boxShadow: 1,
                                // border: '2px solid white',
                                overflow: 'hidden',
                                maxWidth: '100%'
                            }}
                        >
                            <Tabs
                                value={tab}
                                onChange={handleTabChange}
                                sx={{
                                    '& .MuiTab-root': {
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: { xs: '10px', sm: '12px', md: '14px' },
                                        minWidth: 0,
                                        width: 'auto',
                                        px: { xs: 0.5, sm: 1, md: 2 },
                                        textTransform: 'none',
                                        '&.Mui-selected': {
                                            color: '#fff',
                                        }
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#fff',
                                        height: 3
                                    }
                                }}
                            >
                                <Tab label="Overview" />
                                <Tab label="Stats" />
                                <Tab label="Awards" />
                                <Tab label="Leagues Overview" />
                            </Tabs>
                        </Box>
                    </Box>

                    {/* Main content: flex: 1, never moves below sidebar on desktop */}
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: '100%',
                            maxWidth: 1200,
                            height: 'auto',
                            overflow: 'visible',
                            pb: 2,
                            mx: 'auto',
                        }}
                    >
                        {tab === 0 && (
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 4,
                                    mb: 4,
                                    alignItems: 'center'
                                }}>
                                    <Box sx={{ flex: 1, display: { xs: 'none', sm: 'none', md: 'block' } }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>{fullPlayerData?.player?.name}</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#B2DFDB', fontWeight: 500 }}>Age: {fullPlayerData?.player?.age || '-'}</Typography>
                                            <Typography variant="body1" sx={{ color: '#B2DFDB', fontWeight: 500 }}>Style: {fullPlayerData?.player?.style || '-'}</Typography>
                                            <Typography variant="body1" sx={{ color: '#B2DFDB', fontWeight: 500 }}>Position: {fullPlayerData?.player?.position || '-'}</Typography>
                                            <Typography variant="body1" sx={{ color: '#B2DFDB', fontWeight: 500 }}>Position Type: {fullPlayerData?.player?.positionType || '-'}</Typography>
                                            <Typography variant="body1" sx={{ color: '#B2DFDB', fontWeight: 500 }}>Preferred Foot: {fullPlayerData?.player?.preferredFoot || '-'}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Divider sx={{ mb: 2, backgroundColor: '#fff', display: { xs: 'none', sm: 'none', md: 'block' } }} />
                                <Paper elevation={0} sx={{
                                    p: { xs: 0, sm: 0, md: 3 },
                                    background: 'transparent',
                                    mt: { xs: -5, sm: -5, md: 0 }
                                }}>
                                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>Leagues Played</Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, // 3 columns per row on sm+
                                        }}
                                    >
                                        {data?.leagues.map((l: LeagueWithMatchesTyped) => (
                                            <Box
                                                key={l.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    px: 2,
                                                    py: 1,
                                                    minHeight: 48,
                                                }}
                                            >
                                                <Avatar
                                                    src={flag.src || '/assets/default-flag.png'}
                                                    alt={l.name}
                                                    sx={{ width: 50, height: 30 }}
                                                    variant="rounded"
                                                />
                                                <Link href={`/league/${l.id}?profilePlayerId=${fullPlayerData?.player?.id}`}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ fontWeight: 'bold', color: 'white', textDecoration: 'underline' }}
                                                    >
                                                        {l.name}
                                                    </Typography>
                                                </Link>
                                            </Box>
                                        ))}
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                        {tab === 1 && (
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: 'center',
                                    gap: 3,
                                    mb: 4,
                                    flexWrap: 'wrap',
                                    mt: 1
                                }}>
                                    <FormControl size="small" sx={{
                                        minWidth: 140,
                                        flex: 1,
                                        backgroundColor: '#e56a16',
                                        borderRadius: '8px',
                                        '.MuiOutlinedInput-notchedOutline': { border: '1.5px solid #43a047 !important' },
                                        '& .MuiInputBase-input': { color: '#fff' },
                                        '& .MuiInputLabel-root': { color: '#fff !important' },
                                        '& .MuiSvgIcon-root': { color: '#fff !important' },
                                    }}>
                                        <DatePicker
                                            label={'Year'}
                                            views={['year']}
                                            value={year && year !== 'all' ? dayjs(year, 'YYYY') : null}
                                            onChange={handleYearChange}
                                            slotProps={{ textField: { size: 'small', fullWidth: true, InputLabelProps: { sx: { color: '#fff' } }, sx: { '& .MuiOutlinedInput-root': { color: '#fff', background: 'transparent', borderRadius: 2, '& fieldset': { borderColor: '#dc4c1d !important' }, '&:hover fieldset': { borderColor: '#dc4c1d !important' }, '&.Mui-focused fieldset': { borderColor: '#dc4c1d !important' } }, '& .MuiInputLabel-root': { color: '#fff !important' }, '& .MuiInputBase-input': { color: '#fff' } } } }}
                                        />
                                    </FormControl>
                                    <FormControl size="small" sx={{
                                        minWidth: 180,
                                        flex: 2,
                                        backgroundColor: '#e56a16',
                                        borderRadius: '8px',
                                        '.MuiOutlinedInput-notchedOutline': { border: '1.5px solid #dc4c1d !important' },
                                        '& .MuiInputBase-input': { color: '#fff' },
                                        '& .MuiInputLabel-root': { color: '#fff !important' },
                                        '& .MuiSelect-icon': { color: '#fff' },
                                    }}>
                                        <InputLabel sx={{ color: '#fff !important' }}>League</InputLabel>
                                        <Select
                                            value={leagueId || 'all'}
                                            label="League"
                                            onChange={handleLeagueChange}
                                            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dc4c1d !important' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#dc4c1d !important' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#dc4c1d !important' } }}
                                            renderValue={(selected) => {
                                                if (selected === 'all') {
                                                    return 'All Leagues';
                                                }
                                                const league = data?.leagues.find((l: League) => l.id === selected);
                                                return league ? league.name : '';
                                            }}
                                        >
                                            <MenuItem value="all" sx={{ color: '#1f673b', fontWeight: 600 }}>All Leagues</MenuItem>
                                            {data?.leagues.map((l: LeagueWithMatchesTyped) => (
                                                <MenuItem key={l.id} value={l.id} sx={{ color: '#1f673b', fontWeight: 600 }}>
                                                    {l.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        onClick={handleShowAllYears}
                                        variant='outlined'
                                        size='medium'
                                        sx={{
                                            height: 40,
                                            minWidth: 100,
                                            textTransform: 'none',
                                            fontWeight: 'bold',
                                            borderRadius: '8px',
                                            alignSelf: { xs: 'stretch', sm: 'center' },
                                            whiteSpace: 'nowrap',
                                            borderColor: '#4caf50',
                                            color: '#4caf50',
                                            '&:hover': {
                                                borderColor: '#2e7d32',
                                                backgroundColor: 'rgba(76, 175, 80, 0.1)'
                                            }
                                        }}
                                    >
                                        All Years
                                    </Button>
                                </Box>
                                <Divider sx={{ my: 4, borderColor: '#2e7d32' }} />
                                {data?.leagues.length === 0 ? (
                                    <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic' }}>
                                        No leagues found.
                                    </Typography>
                                ) : (
                                    data?.leagues
                                        .filter((league: LeagueWithMatchesTyped) => leagueId === 'all' || league.id === leagueId)
                                        .map((league: LeagueWithMatchesTyped) => (
                                            <Box key={league.id} sx={{ mb: 2 }}>
                                                <Link href={`/league/${league.id}?profilePlayerId=${fullPlayerData?.player?.id}`}>
                                                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>{league.name}</Typography>
                                                </Link>
                                                {(league.matches?.length ?? 0) === 0 ? (
                                                    <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic' }}>
                                                        You haven&apos;t played any matches in this league yet.
                                                    </Typography>
                                                ) : (
                                                    (league.matches || []).map((match: LeagueMatch) => {
                                                        const playerStats = match.playerStats;
                                                        return (
                                                            <Paper key={match.id} sx={{ p: 2, mb: 1, background: '#174d3c', color: 'white', borderRadius: 2 }}>
                                                                <Link href={`/match/${match.id}`}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
                                                                        {`This Match: ${match.homeTeamName} Against ${match.awayTeamName}` +
                                                                            (match.date ? ` | Start: ${dayjs(match.date).format('DD MMM YYYY, h:mm A')}` : '') +
                                                                            (match.end ? ` | End: ${dayjs(match.end).format('DD MMM YYYY, h:mm A')}` : '') +
                                                                            (match.location ? ` | Location: ${match.location}` : '')
                                                                        }
                                                                    </Typography>
                                                                </Link>
                                                                {playerStats ? (
                                                                    <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', fontWeight: 600, fontSize: { xs: 10, sm: 12, md: 14 } }}>
                                                                        <Typography>Goals: <b>{playerStats.goals ?? 0}</b></Typography>
                                                                        <Typography>Assists: <b>{playerStats.assists ?? 0}</b></Typography>
                                                                        <Typography>Clean Sheets: <b>{playerStats.cleanSheets ?? 0}</b></Typography>
                                                                        <Typography>MOTM Votes: <b>{playerStats.motmVotes ?? 0}</b></Typography>
                                                                        <Typography>Penalties: <b>{playerStats.penalties ?? 0}</b></Typography>
                                                                        <Typography>Free Kicks: <b>{playerStats.freeKicks ?? 0}</b></Typography>
                                                                        <Typography>Defence: <b>{playerStats.defence ?? 0}</b></Typography>
                                                                        <Typography>Impact: <b>{playerStats.impact ?? 0}</b></Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic' }}>No stats available for this match.</Typography>
                                                                )}
                                                            </Paper>
                                                        );
                                                    })
                                                )}
                                            </Box>
                                        ))
                                )}


                            </Box>
                        )}
                        {tab === 2 && (
                            <Box sx={{ width: '100%' }}>
                                {allTrophyAwards.length === 0 ? (
                                    <Paper elevation={2} sx={{
                                        p: 4,
                                        background: '#0a3e1e',
                                        color: 'white',
                                        borderRadius: 3,
                                        border: '1px solid #2e7d32',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>No Awards Yet</Typography>
                                        <Typography variant="body1" sx={{ color: '#B2DFDB' }}>
                                            No awards have been given yet.
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <Box sx={{
                                        width: '100%',
                                        maxWidth: { xs: '100%', md: 1200 },
                                        mx: 'auto',
                                        py: 1,
                                        maxHeight: { xs: '60vh', sm: '70vh' },
                                        overflowY: 'auto',
                                        overflowX: 'hidden', // absolutely prevent x scroll
                                        pr: 1,
                                        '::-webkit-scrollbar': { width: 8 },
                                        '::-webkit-scrollbar-thumb': { background: '#bdbdbd', borderRadius: 4 },
                                    }}>
                                        <Box
                                            sx={theme => ({
                                                display: 'grid',
                                                gridTemplateColumns: '1fr', // default: 1 card per row
                                                gap: { xs: 2, sm: 4 },
                                                justifyContent: 'center',
                                                minWidth: 0,
                                                width: '100%',
                                                [theme.breakpoints.up(376)]: {
                                                    gridTemplateColumns: '1fr 1fr', // 2 cards per row from 376px
                                                },
                                                [theme.breakpoints.up(760)]: {
                                                    gridTemplateColumns: '1fr 1fr 1fr', // 3 cards per row from 760px
                                                },
                                                [theme.breakpoints.up(900)]: {
                                                    gridTemplateColumns: '1fr 1fr', // 2 cards per row from 900px
                                                },
                                                [theme.breakpoints.up(1024)]: {
                                                    gridTemplateColumns: '1fr 1fr', // 3 cards per row from 1160px
                                                },
                                                [theme.breakpoints.up(1160)]: {
                                                    gridTemplateColumns: '1fr 1fr 1fr', // 3 cards per row from 1160px
                                                },
                                            })}
                                        >
                                            {allTrophyAwards.map((trophy, idx) => {
                                                const detail = trophyDetails[trophy.key];
                                                if (!detail) return null;
                                                return (
                                                    <Card
                                                        key={trophy.key + trophy.leagueName + trophy.winnerId + idx}
                                                        sx={{
                                                            width: '100%', // always fill grid cell
                                                            maxWidth: { xs: '100%', sm: 240, md: 320 },
                                                            minWidth: 0,
                                                            height: 'auto', // auto height
                                                            mx: 'auto',
                                                            borderRadius: 3,
                                                            boxShadow: 3,
                                                            border: '2px solid #43a047',
                                                            background: '#fff',
                                                            textAlign: 'center',
                                                            p: 0,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <CardContent sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-end',
                                                            height: '100%',
                                                            width: '100%',
                                                            p: { xs: 1, sm: 2 },
                                                            gap: 1.2,
                                                            mt: { xs: 1, sm: 2 },
                                                        }}>
                                                            <Box sx={{ width: '100%' }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: '#333', textAlign: 'center', fontSize: { xs: 13, sm: 16, md: 18 } }}>
                                                                    {trophy.key}
                                                                </Typography>
                                                                <Typography variant="subtitle2" sx={{ color: '#757575', mb: 1, fontSize: { xs: 10, sm: 12, md: 14 }, textAlign: 'center' }}>
                                                                    {detail.description}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ mb: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                                                <Box sx={{
                                                                    width: { xs: 38, sm: 48, md: 68 },
                                                                    height: { xs: 38, sm: 48, md: 68 },
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    mx: 'auto',
                                                                }}>
                                                                    <Image
                                                                        src={detail.image}
                                                                        alt={trophy.key}
                                                                        height={28}
                                                                        width={28}
                                                                        style={{ objectFit: 'contain', display: 'block', width: '100%', height: '100%' }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                            <Button
                                                                variant="contained"
                                                                sx={{
                                                                    background: '#43a047',
                                                                    color: '#fff',
                                                                    fontWeight: 'bold',
                                                                    borderRadius: 2,
                                                                    boxShadow: 2,
                                                                    width: '100%',
                                                                    fontSize: { xs: 11, sm: 13, md: 16 },
                                                                    letterSpacing: 1,
                                                                    py: 0.7,
                                                                    mt: 'auto',
                                                                    '&:hover': { background: '#43a047' },
                                                                }}
                                                                disableElevation
                                                            >
                                                                {trophy.leagueName}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                        {tab === 3 && (
                            <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>Leagues Overview</Typography>
                                {data?.leagues.length === 0 ? (
                                    <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic' }}>
                                        No leagues found.
                                    </Typography>
                                ) : (
                                    data?.leagues.map((league: LeagueWithMatchesTyped) => {
                                        // Only show leagues where the user is a member
                                        const isMember = league.members && league.members.some((m: { id: string }) => m.id === fullPlayerData?.player?.id);
                                        if (!isMember) return null;
                                        return (
                                            <Paper key={league.id} sx={{ mb: 3, p: 2, background: '#174d3c', color: 'white', borderRadius: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>{league.name}</Typography>
                                                    <Button
                                                        variant="contained"
                                                        sx={{ background: '#43a047', color: '#fff', fontWeight: 'bold', borderRadius: 2, ml: 2, '&:hover': { background: '#43a047' } }}
                                                        onClick={() => setExpandedLeagueId(expandedLeagueId === league.id ? null : league.id)}
                                                    >
                                                        {expandedLeagueId === league.id ? 'Hide Matches' : 'View Matches'}
                                                    </Button>
                                                </Box>

                                                {/* Show message if no matches played in this league */}
                                                {(!league.matches || league.matches.length === 0) && (
                                                    <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
                                                        {fullPlayerData?.player?.name} hasn&apos;t played any matches in this league yet.
                                                    </Typography>
                                                )}

                                                {expandedLeagueId === league.id && (
                                                    <Box sx={{ mt: 2 }}>
                                                        {league.matches && league.matches.length > 0 ? (
                                                            league.matches.filter((match: LeagueMatch) => {
                                                                // Only show matches where the user played
                                                                const played = (match.homeTeamUsers?.some((u: { id: string }) => u.id === fullPlayerData?.player?.id)) ||
                                                                    (match.awayTeamUsers?.some((u: { id: string }) => u.id === fullPlayerData?.player?.id));
                                                                return played;
                                                            }).map((match: LeagueMatch) => {
                                                                // The backend now provides playerStats directly for each match
                                                                const playerStats = match.playerStats;
                                                                return (
                                                                    <Paper key={match.id} sx={{ p: 2, mb: 2, background: '#0a3e1e', color: 'white', borderRadius: 2 }}>
                                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                                                            {`This Match: ${match.homeTeamName} Against ${match.awayTeamName}` +
                                                                                (match.date ? ` | Start: ${dayjs(match.date).format('DD MMM YYYY, h:mm A')}` : '') +
                                                                                (match.end ? ` | End: ${dayjs(match.end).format('DD MMM YYYY, h:mm A')}` : '') +
                                                                                (match.location ? ` | Location: ${match.location}` : '')
                                                                            }
                                                                        </Typography>
                                                                        {playerStats ? (
                                                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', fontWeight: 600, fontSize: { xs: 10, sm: 12, md: 14 } }}>
                                                                                <Typography>Goals: <b>{playerStats.goals ?? 0}</b></Typography>
                                                                                <Typography>Assists: <b>{playerStats.assists ?? 0}</b></Typography>
                                                                                <Typography>Clean Sheets: <b>{playerStats.cleanSheets ?? 0}</b></Typography>
                                                                                <Typography>MOTM Votes: <b>{playerStats.motmVotes ?? 0}</b></Typography>
                                                                                <Typography>Penalties: <b>{playerStats.penalties ?? 0}</b></Typography>
                                                                                <Typography>Free Kicks: <b>{playerStats.freeKicks ?? 0}</b></Typography>
                                                                                <Typography>Defence: <b>{playerStats.defence ?? 0}</b></Typography>
                                                                                <Typography>Impact: <b>{playerStats.impact ?? 0}</b></Typography>
                                                                            </Box>
                                                                        ) : (
                                                                            <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic' }}>No stats available for this match.</Typography>
                                                                        )}
                                                                    </Paper>
                                                                );
                                                            })
                                                        ) : (
                                                            <Typography sx={{ color: '#B2DFDB', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                                                                You haven&apos;t played any matches in this league yet.
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </Paper>
                                        );
                                    })
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};
export default PlayerStatsPage;