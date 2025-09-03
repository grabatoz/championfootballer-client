'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
    Divider,
    TextField,
    Grid,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayerStats, setLeagueFilter, setYearFilter, clearPlayerStats } from '@/lib/features/playerStatsSlice';
import TrophyImg from '@/Components/images/awardtrophy.png';
import RunnerUpImg from '@/Components/images/runnerup.png';
import BaloonDImg from '@/Components/images/baloond.png';
import Image, { StaticImageData } from 'next/image';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/hooks';
import FootballImg from '@/Components/images/football.png';
import GoatImg from '@/Components/images/goat.png';               // NEW
import GoldenBootImg from '@/Components/images/goldenboot.png';   // NEW
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png'; // NEW
import ShieldImg from '@/Components/images/shield.png';           // NEW
import DarkHorseImg from '@/Components/images/darkhourse.png';    // NEW

// Gradients
const ORANGE_GRAD = 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)';
const DARK_GRAD = 'linear-gradient(90deg, #767676 0%, #000000 100%)';

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

type League = { id: string; name: string }
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
};

type LeagueWithMatchesTyped = {
    id: string;
    name: string;
    matches?: LeagueMatch[];
};

// Type guard to safely detect leagues that include matches
function hasMatches(l: unknown): l is LeagueWithMatchesTyped {
    return !!l && typeof l === 'object' && Array.isArray((l as any).matches);
}

const trophyDetails: Record<string, { image: StaticImageData; label: string }> = {
    'Champion Footballer': { image: TrophyImg, label: 'Titles' },
    'Runner Up': { image: RunnerUpImg, label: 'Runner Up' },
    "Ballon d'Or": { image: BaloonDImg, label: "Ballon d'Or" },
};

// Map trophy names to images (covers Trophy Room titles + legacy keys)
const trophyImageMap: Record<string, StaticImageData> = {
    'League Champion': TrophyImg,
    'Champion Footballer': TrophyImg,      // legacy
    'Runner-Up': RunnerUpImg,
    'Runner Up': RunnerUpImg,              // legacy
    "Ballon D'or": BaloonDImg,
    "Ballon d'Or": BaloonDImg,            // legacy
    'GOAT': GoatImg,
    'Golden Boot': GoldenBootImg,
    'King Playmaker': KingPlayMakerImg,
    'Legendary Shield': ShieldImg,
    'The Dark Horse': DarkHorseImg,
};

type StatTotals = {
    goals: number;
    assists: number;
    cleanSheets: number;
    motmVotes: number;
    impact: number;
    defence: number;
    freeKicks: number;
    penalties: number;
};

const emptyTotals: StatTotals = {
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    motmVotes: 0,
    impact: 0,
    defence: 0,
    freeKicks: 0,
    penalties: 0,
};

function sumStatsFromMatches(matches: LeagueMatch[] = []): StatTotals {
    return matches.reduce((acc, m) => {
        const s = m.playerStats || ({} as LeagueMatch['playerStats']);
        acc.goals += s?.goals ?? 0;
        acc.assists += s?.assists ?? 0;
        acc.cleanSheets += s?.cleanSheets ?? 0;
        acc.motmVotes += s?.motmVotes ?? 0;
        acc.impact += s?.impact ?? 0;
        acc.defence += s?.defence ?? 0;
        acc.freeKicks += s?.freeKicks ?? 0;
        acc.penalties += s?.penalties ?? 0;
        return acc;
    }, { ...emptyTotals });
}

export default function PlayerStatsPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const { token } = useAuth();

    const { data, filters } = useSelector((state: RootState) => state.playerStats);
    const { leagueId, year } = filters;

    const { data: fullPlayerData } = useSelector((state: RootState) => state.playerStats);

    const [search, setSearch] = useState('');
    const [leagues, setLeagues] = useState<League[]>([]);

    // fetch league list for top League select
    useEffect(() => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(d => {
                if (d?.success && d?.user) {
                    const userLeagues = [
                        ...(d.user.leagues || []),
                        ...(d.user.administeredLeagues || []),
                    ] as League[];
                    const unique = Array.from(new Map(userLeagues.map(l => [l.id, l])).values());
                    setLeagues(unique);
                }
            })
            .catch(() => { });
    }, [token]);

    // fetch player data
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

    // Awards flattening
    const allTrophyAwards: AllTrophyAward[] = useMemo(() => {
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

    const allMatches = useMemo<LeagueMatch[]>(() => {
        return (data?.leagues || []).flatMap((l) => (hasMatches(l) ? l.matches ?? [] : []));
    }, [data]);

    const currentLeagueMatches = useMemo<LeagueMatch[]>(() => {
        if (!data?.leagues || !data.leagues.length) return [];
        if (leagueId && leagueId !== 'all') {
            const l = (data.leagues as unknown[]).find((x: any) => x?.id === leagueId);
            return hasMatches(l) ? l.matches ?? [] : [];
        }
        const first = data.leagues[0];
        return hasMatches(first) ? first.matches ?? [] : [];
    }, [data, leagueId]);

    const accumulativeTotals = useMemo(() => sumStatsFromMatches(allMatches), [allMatches]);
    const currentLeagueTotals = useMemo(() => sumStatsFromMatches(currentLeagueMatches), [currentLeagueMatches]);

    const yearsOptions = useMemo(() => {
        const nowYear = dayjs().year();
        const arr = ['all', ...Array.from({ length: 12 }, (_, i) => String(nowYear - i))];
        return arr;
    }, []);

    const handleYearSelect = (e: SelectChangeEvent<string>) => {
        const val = e.target.value;
        dispatch(setYearFilter(val));
    };

    const handleLeagueChange = (e: SelectChangeEvent<string>) => {
        dispatch(setLeagueFilter(e.target.value));
    };

    const currentLeagueName =
        leagueId && leagueId !== 'all'
            ? data?.leagues?.find((l: LeagueWithMatchesTyped) => l.id === leagueId)?.name || 'Current League'
            : data?.leagues?.[0]?.name || 'Current League';

    const playerName = fullPlayerData?.player?.name || 'Player';
    const playerShirt = fullPlayerData?.player?.shirtNo || '';
    const playerPositionType = fullPlayerData?.player?.positionType || fullPlayerData?.player?.position || 'Player';

    const awardCount = (key: keyof typeof trophyDetails) =>
        allTrophyAwards.filter(a => a.key === key).length;

    // Icon-style item now uses football.png with value centered, label below
    const StatItem = ({ label, value }: { label: string; value: number }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ position: 'relative', width: 56, height: 56 }}>
                <Image
                    src={FootballImg}
                    alt={label}
                    fill
                    sizes="56px"
                    style={{ objectFit: 'contain' }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <Typography
                        sx={{
                            color: '#fff',
                            fontSize: 12, // reduced from 16
                            fontWeight: 900,
                            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                            lineHeight: 1,
                        }}
                    >
                        {value ?? 0}
                    </Typography>
                </Box>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                {label}
            </Typography>
        </Box>
    );

    const loading = !data;

    return (
        <Container
            maxWidth="lg"
            sx={{
                py: 3,
                minHeight: '100vh',
                background: ORANGE_GRAD,
                mt: 5,
                mb: 5
            }}
        >
                <FormControl size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 } }}>
                    <InputLabel>League</InputLabel>
                    <Select
                        label="League"
                        value={leagueId || 'all'}
                        onChange={handleLeagueChange}
                        renderValue={(selected) => {
                            if (selected === 'all') return 'All Leagues';
                            const l = (data?.leagues || []).find((x: LeagueWithMatchesTyped) => x.id === selected);
                            return l?.name || 'League';
                        }}
                    >
                        <MenuItem value="all">All Leagues</MenuItem>
                        {(data?.leagues || []).map((l: LeagueWithMatchesTyped) => (
                            <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    placeholder="Search Players"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 } }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ mt: 2 }}>
                    {/* Profile Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            borderRadius: 3,
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(6px)',
                        }}
                    >
                        {/* Profile Header (Avatar + Name + Position + Action button) */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr auto' },
                                gap: 2.5,
                                alignItems: 'center',
                            }}
                        >
                            {/* Left: Avatar */}
                            <Avatar
                                src={fullPlayerData?.player?.avatar || '/assets/group451.png'}
                                alt={playerName}
                                sx={{
                                    width: { xs: 76, md: 88 },
                                    height: { xs: 76, md: 88 },
                                    bgcolor: '#b2f5ea',
                                    border: '2px solid #0bb77f',
                                    justifySelf: { xs: 'center', sm: 'start' },
                                }}
                            />

                            {/* Middle: Name + Position + Shirt */}
                            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                <Typography sx={{ fontWeight: 900, color: '#064e3b', fontSize: { xs: 16, md: 20 } }}>
                                    {playerName}
                                </Typography>
                                <Typography sx={{ color: '#0b5e49', fontSize: { xs: 13, md: 14 }, fontWeight: 700 }}>
                                    {playerPositionType}
                                </Typography>
                                {playerShirt ? (
                                    <Typography sx={{ color: '#0b5e49', fontSize: 12, fontWeight: 700, mt: 0.5 }}>
                                        Shirt No {playerShirt}
                                    </Typography>
                                ) : null}
                            </Box>

                            {/* Right: Action */}
                            <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                                <Button
                                    variant="contained"
                                    size="medium"
                                    sx={{
                                        background: '#0bb77f',
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        px: 2.5,
                                        py: 0.75,
                                        '&:hover': { background: '#0bb77f' },
                                    }}
                                    onClick={() => router.push(`/player/${playerId}?tab=charts`)}
                                >
                                    View Chart
                                </Button>
                            </Box>
                        </Box>

                        {/* Current League Stats + Accumulative Stats (side-by-side on desktop) */}
                        <Box sx={{ mt: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontWeight: 800, color: '#fff', mb: 1.5, textAlign: { xs: 'center', sm: 'left' } }}>
                                        Current League Stats {leagueId === 'all' ? '' : `(${currentLeagueName})`}
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 2, md: 2.5 },
                                            borderRadius: 2,
                                            background: DARK_GRAD,
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                    >
                                        <Grid container spacing={2} columns={12} justifyContent="flex-start">
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Goals" value={currentLeagueTotals.goals} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Assist" value={currentLeagueTotals.assists} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Clean Sheet" value={currentLeagueTotals.cleanSheets} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="MOTM Votes" value={currentLeagueTotals.motmVotes} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Impact" value={currentLeagueTotals.impact} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Defence" value={currentLeagueTotals.defence} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Free Kicks" value={currentLeagueTotals.freeKicks} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Penalties" value={currentLeagueTotals.penalties} /></Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontWeight: 800, color: '#fff', mb: 1.5, textAlign: { xs: 'center', sm: 'left' } }}>
                                        Accumulative Stats
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 2, md: 2.5 },
                                            borderRadius: 2,
                                            background: DARK_GRAD,
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                    >
                                        <Grid container spacing={2} columns={12} justifyContent="flex-start">
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Goals" value={accumulativeTotals.goals} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Assist" value={accumulativeTotals.assists} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Clean Sheet" value={accumulativeTotals.cleanSheets} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="MOTM Votes" value={accumulativeTotals.motmVotes} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Impact" value={accumulativeTotals.impact} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Defence" value={accumulativeTotals.defence} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Free Kicks" value={accumulativeTotals.freeKicks} /></Grid>
                                            <Grid item xs={6} sm={3} md={3}><StatItem label="Penalties" value={accumulativeTotals.penalties} /></Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Accumulative Trophies */}
                        <Box sx={{ mt: 3 }}>
                            <Typography sx={{ fontWeight: 800, color: '#fff', mb: 1.5, textAlign: { xs: 'center', sm: 'left' } }}>
                                Accumulative Trophies
                            </Typography>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2, md: 2.5 },
                                    borderRadius: 2,
                                    background: DARK_GRAD,
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}
                            >
                                <Grid container spacing={2}>
                                    {Object.entries(trophyDetails).map(([key, { image, label }]) => (
                                        <Grid key={key} item xs={6} sm={4} md={3}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 40, height: 40 }}>
                                                    <Image src={image} alt={label} width={40} height={40} style={{ objectFit: 'contain' }} />
                                                </Box>
                                                <Typography sx={{ color: '#0b5e49', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                                                    {label}
                                                </Typography>
                                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>
                                                    {awardCount(key as keyof typeof trophyDetails)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Container>
    );
}