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
  SelectChangeEvent
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

    const handleYearChange = (event: SelectChangeEvent<string>) => {
        dispatch(setYearFilter(event.target.value));
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

    const { player, leagues, years, currentStats, accumulativeStats, trophies } = data;

    return (
        <Container maxWidth="sm" sx={{ py: 2, backgroundColor: '#F0F9F8' }}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
                <Typography variant="h5" component="h1" align="center" sx={{ fontWeight: 'bold', color: '#004D40', mb: 2 }}>
                    Career Stats
                </Typography>

                {/* Filters */}
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, gap: 2 }}>
                    <FormControl size="small" fullWidth sx={{ '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' }, borderRadius: '8px', backgroundColor: 'white' }}>
                        <InputLabel>Year</InputLabel>
                        <Select value={year || 'all'} label="Year" onChange={handleYearChange}>
                            <MenuItem value="all">All Years</MenuItem>
                            {years.map((y: number) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth sx={{ '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' }, borderRadius: '8px', backgroundColor: 'white' }}>
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
                </Box>
                
                {/* Player Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center', my: 3 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{player.name}</Typography>
                        <Typography variant="body1" color="text.secondary">{player.rating}</Typography>
                    </Box>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'teal' }} src={player.avatar || undefined} />
                    <Box>
                         <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{player.position}</Typography>
                         <Button startIcon={<BarChartIcon />} size="small" variant="contained" sx={{ textTransform: 'none', borderRadius: '16px', mt: 0.5, bgcolor: 'teal' }}>
                            View Chart
                         </Button>
                    </Box>
                </Box>
                
                <StatsCard title="Current League Stats" stats={currentStats} />
                <StatsCard title="Accumulative Stats" stats={accumulativeStats} />
                <TrophiesCard title="Accumulative Trophies" trophies={trophies} />
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













// 'use client';

// import React, { useEffect } from 'react';
// import {
//   Container,
//   Typography,
//   Paper,
//   Box,
//   Avatar,
//   Select,
//   MenuItem,
//   Button,
//   CircularProgress,
//   Alert,
//   FormControl,
//   InputLabel,
//   SelectChangeEvent
// } from '@mui/material';
// import { useParams } from 'next/navigation';
// import BarChartIcon from '@mui/icons-material/BarChart';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/lib/store';
// import { fetchPlayerStats, setLeagueFilter, setYearFilter, clearPlayerStats } from '@/lib/features/playerStatsSlice';
// import TrophyImg from '@/Components/images/awardtrophy.png';
// import RunnerUpImg from '@/Components/images/runnerup.png';
// import BaloonDImg from '@/Components/images/baloond.png';
// import GoatImg from '@/Components/images/goat.png';
// import GoldenBootImg from '@/Components/images/goldenboot.png';
// import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
// import ShieldImg from '@/Components/images/shield.png';
// import DarkHorseImg from '@/Components/images/darkhourse.png';
// import Image, { StaticImageData } from 'next/image';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import dayjs, { Dayjs } from 'dayjs';

// const trophyDetails: Record<string, { image: StaticImageData }> = {
//     'Titles': { image: TrophyImg },
//     'Runner Up': { image: RunnerUpImg },
//     "Ballon d'Or": { image: BaloonDImg },
//     'GOAT': { image: GoatImg },
//     'Golden Boot': { image: GoldenBootImg },
//     'King Playmaker': { image: KingPlayMakerImg },
//     'Legendary Shield': { image: ShieldImg },
//     'The Dark Horse': { image: DarkHorseImg },
// };

// const PlayerStatsPage = () => {
//     const params = useParams();
//     const dispatch = useDispatch<AppDispatch>();
//     const playerId = Array.isArray(params.id) ? params.id[0] : params.id;

//     const { data, loading, error, filters } = useSelector((state: RootState) => state.playerStats);
//     const { leagueId, year } = filters;

//     useEffect(() => {
//         if (playerId) {
//             dispatch(fetchPlayerStats({ playerId, leagueId, year }));
//         }
//         // Clear data on component unmount
//         return () => {
//             dispatch(clearPlayerStats());
//         };
//     }, [dispatch, playerId, leagueId, year]);

//     const handleLeagueChange = (event: SelectChangeEvent<string>) => {
//         dispatch(setLeagueFilter(event.target.value));
//     };

//     const handleYearChange = (newDate: Dayjs | Date | null) => {
//         dispatch(setYearFilter(newDate ? dayjs(newDate).format('YYYY') : 'all'));
//     };
    
//     const handleShowAllYears = () => {
//         dispatch(setYearFilter('all'));
//     };

//     if (loading && !data) {
//         return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
//     }

//     if (error) {
//         return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
//     }
    
//     if (!data) {
//         return <Typography sx={{ textAlign: 'center', mt: 4 }}>No data available for this player.</Typography>;
//     }

//     const { player, leagues, currentStats, accumulativeStats, trophies } = data;

//     return (
//         <Container maxWidth="sm" sx={{ py: 2, backgroundColor: '#F0F9F8' }}>
//             <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
//                 <Typography variant="h5" component="h1" align="center" sx={{ fontWeight: 'bold', color: '#004D40', mb: 2 }}>
//                     Career Stats
//                 </Typography>

//                 {/* Filters */}
//                 <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, gap: 2, alignItems: 'center' }}>
//                     <DatePicker
//                         label={'Year'}
//                         views={['year']}
//                         value={year && year !== 'all' ? dayjs(year, 'YYYY') : null}
//                         onChange={handleYearChange}
//                         slotProps={{ textField: { size: 'small', fullWidth: true } }}
//                         sx={{ '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' }, borderRadius: '8px', backgroundColor: 'white', flex: 1 }}
//                     />
//                     <Button onClick={handleShowAllYears} variant='outlined' size='small' sx={{ textTransform: 'none', height: '40px' }}>All Years</Button>
//                     <FormControl size="small" fullWidth sx={{ '.MuiOutlinedInput-notchedOutline': { border: '1px solid #B2DFDB' }, borderRadius: '8px', backgroundColor: 'white', flex: 1 }}>
//                         <InputLabel>League</InputLabel>
//                         <Select
//                             value={leagueId || 'all'}
//                             label="League"
//                             onChange={handleLeagueChange}
//                             renderValue={(selected) => {
//                                 if (selected === 'all') {
//                                     return 'All Leagues';
//                                 }
//                                 const league = leagues.find((l: { id: string; name: string }) => l.id === selected);
//                                 return league ? league.name : '';
//                             }}
//                         >
//                             <MenuItem value="all">All Leagues</MenuItem>
//                             {leagues.map((l: { id: string; name: string }) => (
//                                 <MenuItem key={l.id} value={l.id}>
//                                     {l.name}
//                                 </MenuItem>
//                             ))}
//                         </Select>
//                     </FormControl>
//                 </Box>
                
//                 {/* Player Info */}
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center', my: 3 }}>
//                     <Box>
//                         <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{player.name}</Typography>
//                         <Typography variant="body1" color="text.secondary">{player.rating}</Typography>
//                     </Box>
//                     <Avatar sx={{ width: 80, height: 80, bgcolor: 'teal' }} src={player.avatar || undefined} />
//                     <Box>
//                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{player.position}</Typography>
//                          <Button startIcon={<BarChartIcon />} size="small" variant="contained" sx={{ textTransform: 'none', borderRadius: '16px', mt: 0.5, bgcolor: 'teal' }}>
//                             View Chart
//                          </Button>
//                     </Box>
//                 </Box>
                
//                 <StatsCard title="Current League Stats" stats={currentStats} />
//                 <StatsCard title="Accumulative Stats" stats={accumulativeStats} />
//                 <TrophiesCard title="Accumulative Trophies" trophies={trophies} />
//             </Paper>
//         </Container>
//     );
// };


// const StatsCard = ({ title, stats }: { title: string, stats: Record<string, number> }) => (
//     <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid #E0E0E0' }}>
//         <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>{title}</Typography>
//         <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
//             {Object.entries(stats).map(([key, value]) => (
//                 <Box key={key} sx={{ textAlign: 'center', minWidth: '80px' }}>
//                     <Avatar sx={{ bgcolor: 'teal', mb: 1, mx: 'auto' }}>
//                         <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{value}</Typography>
//                     </Avatar>
//                     <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{key}</Typography>
//                 </Box>
//             ))}
//         </Box>
//     </Paper>
// );

// const TrophiesCard = ({ title, trophies }: { title: string, trophies: Record<string, number> }) => {
//     const wonTrophies = Object.entries(trophies).filter(([, value]) => value > 0);

//     if (wonTrophies.length === 0) {
//         return null;
//     }

//     return (
//         <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid #E0E0E0' }}>
//             <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>{title}</Typography>
//             <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
//                 {wonTrophies.map(([key, value]) => {
//                     const detail = trophyDetails[key];
//                     if (!detail) return null;

//                     return (
//                         <Box key={key} sx={{ textAlign: 'center', minWidth: '90px' }}>
//                             <Image src={detail.image} alt={key} height={80} width={80} style={{ margin: '0 auto' }} />
//                             <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>{key}</Typography>
//                             <Box
//                                 sx={{
//                                     backgroundColor: 'teal',
//                                     color: 'white',
//                                     borderRadius: '50%',
//                                     height: 28,
//                                     width: 28,
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center',
//                                     fontWeight: 'bold',
//                                     mt: 0.5,
//                                     mx: 'auto'
//                                 }}
//                             >
//                                 {value}
//                             </Box>
//                         </Box>
//                     );
//                 })}
//             </Box>
//         </Paper>
//     );
// };

// export default PlayerStatsPage; 