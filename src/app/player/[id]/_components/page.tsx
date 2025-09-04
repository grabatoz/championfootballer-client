'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
    SelectChangeEvent,
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
import GoatImg from '@/Components/images/goat.png';
import GoldenBootImg from '@/Components/images/goldenboot.png';
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
import ShieldImg from '@/Components/images/shield.png';
import DarkHorseImg from '@/Components/images/darkhourse.png';

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
    return typeof l === 'object' && l !== null && Array.isArray((l as { matches?: unknown }).matches);
}

// AbortError type guard (replaces (err as any) usage)
function isAbortError(error: unknown): error is DOMException & { name: 'AbortError' } {
    return (
        (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') ||
        (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            (error as { name: unknown }).name === 'AbortError')
    );
}

const trophyDetails: Record<string, { image: StaticImageData; label: string }> = {
    // Champion (legacy + new)
    'Champion Footballer': { image: TrophyImg, label: 'League Champion' },
    'League Champion': { image: TrophyImg, label: 'League Champion' },

    // Runner-up (both spellings)
    'Runner Up': { image: RunnerUpImg, label: 'Runner-Up' },
    'Runner-Up': { image: RunnerUpImg, label: 'Runner-Up' },

    // Ballon d'Or (both apostrophe casings)
    "Ballon d'Or": { image: BaloonDImg, label: "Ballon d'Or" },
    "Ballon D'or": { image: BaloonDImg, label: "Ballon d'Or" },

    // Other Trophy Room titles
    'GOAT': { image: GoatImg, label: 'GOAT' },
    'Golden Boot': { image: GoldenBootImg, label: 'Golden Boot' },
    'King Playmaker': { image: KingPlayMakerImg, label: 'King Playmaker' },
    'Legendary Shield': { image: ShieldImg, label: 'Legendary Shield' },
    'The Dark Horse': { image: DarkHorseImg, label: 'The Dark Horse' },
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
    const [, setLeagues] = useState<League[]>([]);

    // --- Teammate (co-players) search state ---
    type LeaguePlayer = {
        id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        avatar?: string;
        position?: string;
    };

    // Raw player shape from API (no any)
    type RawPlayer = {
        id?: string;
        _id?: string;
        userId?: string;
        firstName?: string;
        fname?: string;
        lastName?: string;
        lname?: string;
        name?: string;
        avatar?: string;
        profilePicture?: string;
        avatarUrl?: string;
        position?: string;
        positionType?: string;
    };

    const [teammates, setTeammates] = useState<LeaguePlayer[]>([]);
    const [teammatesLoading, setTeammatesLoading] = useState(false);
    const [searchTriggered, setSearchTriggered] = useState(false);
    const [showTeammatePanel, setShowTeammatePanel] = useState(false);

    const searchWrapperRef = useRef<HTMLDivElement | null>(null);
    const fetchAbortRef = useRef<AbortController | null>(null);
    const lastFetchKeyRef = useRef<string>('');

    const normalizePlayer = (p: RawPlayer): LeaguePlayer => ({
        id: p.id || p._id || p.userId || '',
        firstName: p.firstName ?? p.fname,
        lastName: p.lastName ?? p.lname,
        name: p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
        avatar: p.avatar ?? p.profilePicture ?? p.avatarUrl,
        position: p.position ?? p.positionType,
    });

    type TeammateAPIResponse = {
        success?: boolean;
        data?: RawPlayer[];
        players?: RawPlayer[];
    } | RawPlayer[];

    const fetchTeammates = useCallback(async () => {
        if (!token) return;
        if (!playerId) return;
        if (!leagueId || leagueId === 'all') {
            // If "All" selected just clear (or could later aggregate)
            setTeammates([]);
            setSearchTriggered(true);
            return;
        }

        const fetchKey = `${playerId}_${leagueId}`;
        if (fetchKey === lastFetchKeyRef.current && teammates.length && searchTriggered) {
            // Already have data for this combination
            setShowTeammatePanel(true);
            return;
        }

        if (fetchAbortRef.current) fetchAbortRef.current.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        setTeammatesLoading(true);
        setSearchTriggered(true);

        try {
            let list: RawPlayer[] | undefined;

            // Primary (league-wise teammates for any player)
            const primaryUrl = `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/leagues/${leagueId}/teammates`;
            const res = await fetch(primaryUrl, {
                credentials: 'include',
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            if (res.ok) {
                const json: TeammateAPIResponse = await res.json();
                if (Array.isArray(json)) {
                    list = json;
                } else if (json?.data && Array.isArray(json.data)) {
                    list = json.data;
                } else if (json?.players && Array.isArray(json.players)) {
                    list = json.players;
                }
            }

            // Fallback: league players (admin/user listing)
            if (!list) {
                const fbRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/players`, {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
                if (fbRes.ok) {
                    const fb = await fbRes.json();
                    const raw = Array.isArray(fb) ? fb : (Array.isArray(fb?.players) ? fb.players : []);
                    list = raw as RawPlayer[];
                }
            }

            const mapped = (list || [])
                .map(normalizePlayer)
                .filter(p => p.id && p.id !== playerId);

            setTeammates(mapped);
            lastFetchKeyRef.current = fetchKey;
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                setTeammates([]);
            }
        } finally {
            setTeammatesLoading(false);
        }
    }, [token, playerId, leagueId, teammates.length, searchTriggered]);

    // Close panel on outside click / ESC
    useEffect(() => {
        if (!showTeammatePanel) return;
        const handleClick = (e: MouseEvent) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
                setShowTeammatePanel(false);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowTeammatePanel(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [showTeammatePanel]);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (fetchAbortRef.current) fetchAbortRef.current.abort();
        };
    }, []);

    // Reset when league changes
    useEffect(() => {
        setTeammates([]);
        setSearch('');
        setSearchTriggered(false);
        lastFetchKeyRef.current = '';
        setShowTeammatePanel(false);
    }, [leagueId]);

    const filteredTeammates = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return teammates;
        return teammates.filter(p => {
            const full = (p.name || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()).toLowerCase();
            return full.includes(q);
        });
    }, [search, teammates]);

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
        const leaguesList: LeagueWithMatchesTyped[] = (data?.leagues as LeagueWithMatchesTyped[] | undefined) ?? [];
        if (!leaguesList.length) return [];

        if (leagueId && leagueId !== 'all') {
            const l = leaguesList.find((x: LeagueWithMatchesTyped) => x.id === leagueId);
            return hasMatches(l) ? l.matches ?? [] : [];
        }

        const first = leaguesList[0];
        return hasMatches(first) ? first.matches ?? [] : [];
    }, [data, leagueId]);

    const accumulativeTotals = useMemo(() => sumStatsFromMatches(allMatches), [allMatches]);
    const currentLeagueTotals = useMemo(() => sumStatsFromMatches(currentLeagueMatches), [currentLeagueMatches]);

    const yearsOptions = useMemo(() => {
        const nowYear = dayjs().year();
        const arr = ['all', ...Array.from({ length: 12 }, (_, i) => String(nowYear - i))];
        return arr;
    }, []);

    // Latest year present in data (fallback: current year)
    const latestYearInData = useMemo(() => {
        const years = ((data?.leagues as LeagueWithMatchesTyped[] | undefined) ?? [])
            .flatMap((l: LeagueWithMatchesTyped) => (hasMatches(l) ? (l.matches || []) : []))
            .map((m: LeagueMatch) => dayjs(m.date).year());
        return years.length ? Math.max(...years) : dayjs().year();
    }, [data]);

    // Filter leagues by selected year (uses matches' date)
    const leaguesForYear = useMemo<LeagueWithMatchesTyped[]>(() => {
        const list = (data?.leagues || []) as LeagueWithMatchesTyped[];
        if (!list.length) return [];
        const effectiveYear = !year || year === 'all' ? String(latestYearInData) : year;
        return list.filter(l =>
            hasMatches(l) &&
            (l.matches || []).some(m => dayjs(m.date).year().toString() === effectiveYear)
        );
    }, [data, year, latestYearInData]);

    // Helper: get latest league (by latest match date within the selected year)
    const getLatestLeagueIdForYear = (list: LeagueWithMatchesTyped[], y: string) => {
        let bestId: string | undefined;
        let bestTs = -Infinity;
        for (const l of list) {
            const ts = Math.max(
                ...((l.matches || [])
                    .filter(m => dayjs(m.date).year().toString() === y)
                    .map(m => dayjs(m.date).valueOf())),
            );
            if (Number.isFinite(ts) && ts > bestTs) {
                bestTs = ts;
                bestId = l.id;
            }
        }
        return bestId || list[0]?.id;
    };

    // On initial load (or when year is 'all'), set latest year and latest league
    useEffect(() => {
        if (!data) return;
        const targetYear = String(latestYearInData);
        if (!year || year === 'all') {
            const list = (data?.leagues || []) as LeagueWithMatchesTyped[];
            const filtered = list.filter(l =>
                hasMatches(l) &&
                (l.matches || []).some(m => dayjs(m.date).year().toString() === targetYear)
            );
            const latestLeagueId = filtered.length ? getLatestLeagueIdForYear(filtered, targetYear) : 'all';
            dispatch(setYearFilter(targetYear));
            dispatch(setLeagueFilter(latestLeagueId || 'all'));
        }
    }, [data, latestYearInData, year, dispatch]);

    // Keep current league if still valid after year change; else pick latest league for that year or 'all'
    useEffect(() => {
        const list = leaguesForYear;
        if (!list.length) {
            if (leagueId !== 'all') dispatch(setLeagueFilter('all'));
            return;
        }
        if (leagueId === 'all') return;
        const stillValid = list.some(l => l.id === leagueId);
        if (!stillValid) {
            const effectiveYear = !year || year === 'all' ? String(latestYearInData) : year;
            dispatch(setLeagueFilter(getLatestLeagueIdForYear(list, effectiveYear) || 'all'));
        }
    }, [leaguesForYear, leagueId, year, latestYearInData, dispatch]);

    const handleYearSelect = (e: SelectChangeEvent<string>) => {
        const val = e.target.value as string;

        // compute valid leagues for the selected year
        const list = ((data?.leagues || []) as LeagueWithMatchesTyped[]).filter(l =>
            val === 'all'
                ? true
                : hasMatches(l) && (l.matches || []).some(m => dayjs(m.date).year().toString() === val)
        );

        // preserve league if possible, else select latest league for that year (or 'all')
        let nextLeague = leagueId;
        if (val !== 'all') {
            if (nextLeague === 'all' || !list.some(l => l.id === nextLeague)) {
                nextLeague = list.length ? getLatestLeagueIdForYear(list, val) || 'all' : 'all';
            }
        } else if (!list.some(l => l.id === nextLeague)) {
            nextLeague = 'all';
        }

        dispatch(setYearFilter(val));
        if (nextLeague !== leagueId) dispatch(setLeagueFilter(nextLeague));
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

    // Count only trophies this player actually won
    const awardCount = (key: keyof typeof trophyDetails) =>
        allTrophyAwards.filter(a => a.key === key).length;

    // Show only earned trophies with counts
    const earnedTrophies = useMemo(() => {
        return (Object.entries(trophyDetails) as [keyof typeof trophyDetails, { image: StaticImageData; label: string }][])
            .map(([key, details]) => ({ key, ...details, count: awardCount(key) }))
            .filter(t => t.count > 0);
    }, [allTrophyAwards]);

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
            {/* Top Filters Row (desktop: 3 columns incl. search) */}
            <Box
                sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1.5fr' },
                    alignItems: 'start',
                }}
            >
                {/* Year */}
                <FormControl
                    size="small"
                    sx={{
                        minWidth: 0,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 2,
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                        },
                        '& .MuiInputLabel-root': { color: '#9CA3AF' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
                    }}
                >
                    {/* <InputLabel>Year</InputLabel> */}
                    <Select
                        label="Year"
                        value={year || String(latestYearInData)}
                        onChange={handleYearSelect}
                        sx={{
                            color: '#E5E7EB',
                            '& .MuiSelect-icon': { color: '#E5E7EB' },
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    bgcolor: 'rgba(15,15,15,0.92)',
                                    color: '#E5E7EB',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                },
                            },
                        }}
                    >
                        {yearsOptions.map(y => (
                            <MenuItem key={y} value={y}>
                                {y === 'all' ? 'All Years' : y}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* League */}
                <FormControl
                    size="small"
                    sx={{
                        minWidth: 0,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(15,15,15,0.92)',
                            color: '#E5E7EB',
                            borderRadius: 2,
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                        },
                        '& .MuiInputLabel-root': { color: '#9CA3AF' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
                    }}
                >
                    {/* <InputLabel>League</InputLabel> */}
                    <Select
                        label="League"
                        value={leagueId || 'all'}
                        onChange={handleLeagueChange}
                        renderValue={(selected) => {
                            const effectiveYear = year && year !== 'all' ? year : String(latestYearInData);
                            if (selected === 'all') return `All Leagues (${effectiveYear})`;
                            const l = (leaguesForYear || []).find((x: LeagueWithMatchesTyped) => x.id === selected);
                            return l ? `${l.name} (${effectiveYear})` : 'League';
                        }}
                        sx={{
                            color: '#E5E7EB',
                            '& .MuiSelect-icon': { color: '#E5E7EB' },
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    bgcolor: 'rgba(15,15,15,0.92)',
                                    color: '#E5E7EB',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                },
                            },
                        }}
                    >
                        <MenuItem value="all">All Leagues</MenuItem>
                        {(leaguesForYear || []).map((l: LeagueWithMatchesTyped) => (
                            <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Search */}
                <Box ref={searchWrapperRef} sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            size="small"
                            placeholder={leagueId === 'all' ? 'Select a league to load teammates' : 'Search Teammates'}
                            fullWidth
                            value={search}
                            disabled={leagueId === 'all'}
                            onFocus={() => {
                                if (leagueId === 'all') return;
                                setShowTeammatePanel(true);
                                if (!searchTriggered && !teammatesLoading) fetchTeammates();
                            }}
                            onClick={() => {
                                if (leagueId === 'all') return;
                                setShowTeammatePanel(true);
                                if (!searchTriggered && !teammatesLoading) fetchTeammates();
                            }}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                if (!showTeammatePanel) setShowTeammatePanel(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (!searchTriggered) fetchTeammates();
                                    setShowTeammatePanel(true);
                                } else if (e.key === 'Escape') {
                                    setShowTeammatePanel(false);
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(15,15,15,0.92)',
                                    color: '#E5E7EB',
                                    borderRadius: 2,
                                    '& fieldset': { border: 'none' },
                                    '&:hover fieldset': { border: 'none' },
                                    '&.Mui-focused fieldset': { border: 'none' },
                                },
                                '& input::placeholder': { color: '#9CA3AF', opacity: 1 },
                            }}
                        />
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                                if (leagueId === 'all') return;
                                if (!searchTriggered) fetchTeammates();
                                setShowTeammatePanel(true);
                            }}
                            disabled={!leagueId || leagueId === 'all' || teammatesLoading}
                            sx={{ background: '#0bb77f', fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap' }}
                        >
                            {teammatesLoading ? '...' : (searchTriggered ? 'Refresh' : 'Load')}
                        </Button>
                    </Box>

                    {showTeammatePanel && leagueId !== 'all' && (
                        <Paper
                            elevation={3}
                            sx={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                mt: 0.5,
                                width: '100%',
                                zIndex: 30,
                                maxHeight: 300,
                                overflowY: 'auto',
                                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: 2,
                                p: 1.25,
                                '&::-webkit-scrollbar': { width: 6 },
                                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.25)', borderRadius: 3 },
                            }}
                        >
                            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13, mb: 0.75 }}>
                                Teammates in this league
                            </Typography>

                            {(!searchTriggered && teammatesLoading) || teammatesLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={22} />
                                </Box>
                            ) : !searchTriggered ? (
                                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                    Click load to fetch teammates you have played with.
                                </Typography>
                            ) : teammates.length === 0 ? (
                                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                    No teammate data found.
                                </Typography>
                            ) : filteredTeammates.length === 0 ? (
                                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                    This player name is not found in this league you play.
                                </Typography>
                            ) : (
                                <Grid container spacing={0.75}>
                                    {filteredTeammates.map(p => {
                                        const displayName =
                                            p.name ||
                                            `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
                                            'Player';
                                        return (
                                            <Grid item xs={12} key={p.id}>
                                                <Box
                                                    onClick={() => {
                                                        router.push(`/player/${p.id}`);
                                                        setShowTeammatePanel(false);
                                                    }}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        p: 0.75,
                                                        borderRadius: 1.5,
                                                        cursor: 'pointer',
                                                        bgcolor: 'rgba(255,255,255,0.07)',
                                                        transition: 'background .2s',
                                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                                                    }}
                                                >
                                                    <Avatar
                                                        src={p.avatar || '/assets/group451.png'}
                                                        alt={displayName}
                                                        sx={{
                                                            width: 34,
                                                            height: 34,
                                                            border: '1px solid rgba(255,255,255,0.25)',
                                                        }}
                                                    />
                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                        <Typography
                                                            noWrap
                                                            sx={{
                                                                color: '#E5E7EB',
                                                                fontWeight: 700,
                                                                fontSize: 13,
                                                                lineHeight: 1.15,
                                                            }}
                                                        >
                                                            {displayName}
                                                        </Typography>
                                                        {p.position && (
                                                            <Typography
                                                                sx={{
                                                                    color: '#9CA3AF',
                                                                    fontSize: 11,
                                                                    lineHeight: 1.1,
                                                                }}
                                                            >
                                                                {p.position}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Paper>
                    )}
                </Box>
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
                                    onClick={() => router.push(`/player/${playerId}/career`)}  // changed from ?tab=charts
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
                                {earnedTrophies.length === 0 ? (
                                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
                                        No trophies won yet.
                                    </Typography>
                                ) : (
                                    <Grid container spacing={2} columns={{ xs: 3, sm: 4, md: 6, lg: 6 }}>
                                        {earnedTrophies.map((t) => (
                                            <Grid key={t.key} item xs={1} sm={1} md={1} lg={1}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 40, height: 40 }}>
                                                        <Image src={t.image} alt={t.label} width={40} height={40} style={{ objectFit: 'contain' }} />
                                                    </Box>
                                                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                                                        {t.label}
                                                    </Typography>
                                                    <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>
                                                        {t.count}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Paper>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Container>
    );
}