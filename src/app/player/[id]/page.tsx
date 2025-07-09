'use client';

import React, { useEffect } from 'react';
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
  Alert,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { useParams } from 'next/navigation';
import BarChartIcon from '@mui/icons-material/BarChart';
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
import Link from 'next/link';
// import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
// import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
// import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const trophyDetails: Record<string, { image: StaticImageData }> = {
    'Titles': { image: TrophyImg },
    'Runner Up': { image: RunnerUpImg },
    "Ballon d'Or": { image: BaloonDImg },
    'GOAT': { image: GoatImg },
    'Golden Boot': { image: GoldenBootImg },
    'King Playmaker': { image: KingPlayMakerImg },
    'Legendary Shield': { image: ShieldImg },
    'The Dark Horse': { image: DarkHorseImg },
};

const PlayerStatsPage = () => {
    const params = useParams();
    const dispatch = useDispatch<AppDispatch>();
    const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const { data, loading, error, filters } = useSelector((state: RootState) => state.playerStats);
    const { leagueId, year } = filters;

    useEffect(() => {
        if (playerId) {
            dispatch(fetchPlayerStats({ playerId, leagueId, year }));
        }
        // Clear data on component unmount
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
    };    
    const handleShowAllYears = () => {
        dispatch(setYearFilter('all'));
    };


    if (loading && !data) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }
    
    if (!data) {
        return <Typography sx={{ textAlign: 'center', mt: 4 }}>No data available for this player.</Typography>;
    }

    const { player, leagues, currentStats, accumulativeStats, trophies } = data;

    return (
        <Container maxWidth="md" sx={{ py: 4, backgroundColor: '#0a3e1e', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, backgroundColor: 'transparent' }}>
                <Typography variant="h4" component="h1" align="center" sx={{ fontWeight: 'bold', color: 'white', mb: 4, letterSpacing: 1 }}>
                    Career Stats
                </Typography>
                {/* Filters */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2, mb: 4 }}>
                    <FormControl size="small" sx={{ minWidth: 140, flex: 1, backgroundColor: 'white', borderRadius: '8px', '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' } }}>
                        {/* <InputLabel>Year</InputLabel> */}
                        <DatePicker
                            label={'Year'}
                            views={['year']}
                            value={year && year !== 'all' ? dayjs(year, 'YYYY') : null}
                            onChange={handleYearChange}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            sx={{ backgroundColor: 'white', borderRadius: '8px', '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' } }}
                        />
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180, flex: 2, backgroundColor: 'white', borderRadius: '8px', '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' } }}>
                        <InputLabel>League</InputLabel>
                        <Select
                            value={leagueId || 'all'}
                            label="League"
                            onChange={handleLeagueChange}
                            renderValue={(selected) => {
                                if (selected === 'all') {
                                    return 'All Leagues';
                                }
                                const league = leagues.find((l: { id: string; name: string }) => l.id === selected);
                                return league ? league.name : '';
                            }}
                        >
                            <MenuItem value="all">All Leagues</MenuItem>
                            {leagues.map((l: { id: string; name: string }) => (
                                <MenuItem key={l.id} value={l.id}>
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
                        }}
                    >
                        All Years
                    </Button>
                </Box>
                {/* Player Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 4, mb: 4, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', mb: 0.5 }}>{player.name}</Typography>
                        <Typography variant="body1" sx={{ color: '#B2DFDB', fontWeight: 500 }}>{player.rating}</Typography>
                    </Box>
                    <Avatar sx={{ width: 90, height: 90, bgcolor: 'teal', border: '3px solid #B2DFDB', mx: 2 }} src={player?.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : `/${player.profilePicture}`}`) : undefined} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 0.5 }}>{player.position}</Typography>
                        <Link href={'/all-players'}>
                        <Button startIcon={<BarChartIcon />} size="small" variant="contained" sx={{ textTransform: 'none', borderRadius: '16px', mt: 0.5, bgcolor: 'teal', color: 'white', fontWeight: 'bold' }}>
                            View Chart
                        </Button>
                        </Link>
                    </Box>
                </Box>
                {/* Stats Side by Side on Desktop, Stacked on Mobile */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
                    <Paper elevation={3} sx={{ flex: 1, p: 3, backgroundColor: '#174d3c', color: 'white', borderRadius: 4, minWidth: 0 }}>
                        <StatsCard title="Current League Stats" stats={currentStats} />
                    </Paper>
                    <Paper elevation={3} sx={{ flex: 1, p: 3, backgroundColor: '#174d3c', color: 'white', borderRadius: 4, minWidth: 0 }}>
                        <StatsCard title="All Leagues Stats" stats={accumulativeStats} />
                    </Paper>
                </Box>
                <TrophiesCard title="All Leagues Trophies" trophies={trophies} />
            </Paper>
        </Container>
    );
};


const StatsCard = ({ title, stats }: { title: string, stats: Record<string, number> }) => (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid #E0E0E0' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>{title}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            {Object.entries(stats).map(([key, value]) => (
                <Box key={key} sx={{ textAlign: 'center', minWidth: '80px' }}>
                    <Avatar sx={{ bgcolor: 'teal', mb: 1, mx: 'auto' }}>
                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{value}</Typography>
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{key}</Typography>
                </Box>
            ))}
        </Box>
    </Paper>
);

// const TrophyIcon = ({ name }: { name: string }) => {
//     if (name === 'Titles') return <EmojiEventsIcon color="primary" sx={{ fontSize: 40 }} />;
//     if (name === 'Runner Up') return <WorkspacePremiumIcon color="disabled" sx={{ fontSize: 40 }} />;
//     if (name === "Ballon d'Or") return <SportsSoccerIcon color="warning" sx={{ fontSize: 40 }} />;
//     return null;
// };

const TrophiesCard = ({ title, trophies }: { title: string, trophies: Record<string, number> }) => {
    const wonTrophies = Object.entries(trophies).filter(([, value]) => value > 0);

    if (wonTrophies.length === 0) {
        return null;
    }

    return (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid #E0E0E0' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>{title}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
                {wonTrophies.map(([key, value]) => {
                    const detail = trophyDetails[key];
                    if (!detail) return null;

                    return (
                        <Box key={key} sx={{ textAlign: 'center', minWidth: '90px' }}>
                            <Image src={detail.image} alt={key} height={80} width={80} style={{ margin: '0 auto' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>{key}</Typography>
                            <Box
                                sx={{
                                    backgroundColor: 'teal',
                                    color: 'white',
                                    borderRadius: '50%',
                                    height: 28,
                                    width: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    mt: 0.5,
                                    mx: 'auto'
                                }}
                            >
                                {value}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default PlayerStatsPage; 