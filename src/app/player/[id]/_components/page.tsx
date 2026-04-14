'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    Container,
    Typography,
    Paper,
    Box,
    Avatar,
    Button,
    CircularProgress,
    TextField,
    Grid,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayerStats, setLeagueFilter, setYearFilter, clearPlayerStats } from '@/lib/features/playerStatsSlice';
import TrophyImg from '@/Components/images/awardtrophy.png';
import RunnerUpImg from '@/Components/images/runnerup.png';
import BaloonDImg from '@/Components/images/baloond.png';
import GoldenBootImg from '@/Components/images/goldenboot.png';
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
import ShieldImg from '@/Components/images/shield.png';
import DarkHorseImg from '@/Components/images/darkhourse.png';
import TrofiiImg from '@/Components/images/trofii.png';
import Image, { StaticImageData } from 'next/image';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { playerAPI } from '@/lib/api';
import GoatImg from '@/Components/images/goat.png';
import { BarChart, SpaceDashboard } from '@mui/icons-material';
import StarKeeperImg from '@/Components/images/brown.svg';
import SearchIcon from '@/Components/images/searchicon.png';
import XPStarMilestoneCard, { XP_TIERS, getXPTier } from '@/Components/XPStarMilestoneCard';

// Lazy load heavy components
const CloseButton = dynamic(() => import('@/Components/CloseButton'), {
  loading: () => <></>,
  ssr: false
});

// Colors & Gradients
const DARK_BG = '#383838';
const CARD_BG = '#272727';
const TEAL_PRIMARY = '#00a77f';
const ORANGE_ACCENT = '#ff6b35';
const XP_STATUS_MAX_POINTS = 15000;

// Add the blue filter constant
const BLUE_FILTER = 'invert(30%) sepia(98%) saturate(2000%) hue-rotate(201deg) brightness(92%) contrast(101%)';

type TrophyAward = {
    leagueName: string;
    winnerId?: string | null;
    winnerName?: string;
    winner?: string;
    winner_id?: string | null;
};

type AllTrophyAward = {
    key: string;
    leagueName: string;
    winnerId: string;
    winnerName: string;
};

type League = {
    id: string;
    name: string;
    active?: boolean;
    archived?: boolean;
    status?: string;
    maxGames?: number;
}
type LeagueMatch = {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    date: string;
    status?: string;
    end?: string;
    location?: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    result?: 'W' | 'D' | 'L' | string;
    playerStats?: {
        freeKicks: number;
        defence: number;
        impact: number;
        penalties: number;
        goals?: number;
        assists?: number;
        cleanSheets?: number;
        motmVotes?: number;
        xpAwarded?: number;
        result?: 'W' | 'D' | 'L' | string;
    };
    homeTeamUsers?: Array<{ id: string }>;
    awayTeamUsers?: Array<{ id: string }>;
    homeTeam?: { players?: Array<{ id?: string; _id?: string }> };
    awayTeam?: { players?: Array<{ id?: string; _id?: string }> };
};

type LeagueWithMatchesTyped = {
    id: string;
    name: string;
    matches?: LeagueMatch[];
    active?: boolean;
    archived?: boolean;
    status?: string;
    maxGames?: number;
    computedStatus?: {
        isComplete?: boolean;
        isCompleted?: boolean;
    };
};

// Type guard to safely detect leagues that include matches
function hasMatches(l: unknown): l is LeagueWithMatchesTyped {
    return typeof l === 'object' && l !== null && Array.isArray((l as { matches?: unknown }).matches);
}

function isLeagueActiveForFilter(l: LeagueWithMatchesTyped): boolean {
    if (!l) return false;

    if (l.archived === true) return false;
    if (l.active === false) return false;

    const status = typeof l.status === 'string' ? l.status.trim().toLowerCase() : '';
    if (
        status === 'completed' ||
        status === 'inactive' ||
        status === 'archived' ||
        status.includes('archiv') ||
        status.includes('inactiv') ||
        status.includes('deactiv')
    ) return false;

    if (l.computedStatus?.isComplete === true || l.computedStatus?.isCompleted === true) return false;

    const max = typeof l.maxGames === 'number' ? l.maxGames : 0;
    if (max > 0 && Array.isArray(l.matches)) {
        const completedCount = l.matches.reduce((acc, m) => {
            const st = typeof m.status === 'string' ? m.status.toLowerCase() : '';
            const endedByStatus = st === 'completed' || st === 'finished' || st === 'ended' || st === 'result_published' || st === 'result_uploaded';
            const endedByEnd = Boolean(m.end);
            return acc + (endedByStatus || endedByEnd ? 1 : 0);
        }, 0);
        if (completedCount >= max) return false;
    }

    return true;
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
    'Golden Boot': { image: GoldenBootImg, label: 'Golden Boot' },
    'King Playmaker': { image: KingPlayMakerImg, label: 'King Playmaker' },
    'Legendary Shield': { image: ShieldImg, label: 'Legendary Shield' },
    'The Dark Horse': { image: DarkHorseImg, label: 'The Dark Horse' },
    // ADD: Star Keeper trophy
    'Star Keeper': { image: StarKeeperImg, label: 'Star Keeper' },
};

// Fixed display order for trophies (one key per trophy type)
const orderedTrophyKeys = [
    'League Champion',
    'Runner-Up',
    "Ballon d'Or",
    'Golden Boot',
    'King Playmaker',
    'Legendary Shield',
    'The Dark Horse',
    'Star Keeper',
];

type StatTotals = {
    goals: number;
    assists: number;
    cleanSheets: number;
    motmVotes: number;
    impact: number;
};

const emptyTotals: StatTotals = {
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    motmVotes: 0,
    impact: 0,
};

function sumStatsFromMatches(matches: LeagueMatch[] = []): StatTotals {
    return matches.reduce((acc, m) => {
        const s = m.playerStats || ({} as LeagueMatch['playerStats']);
        acc.goals += s?.goals ?? 0;
        acc.assists += s?.assists ?? 0;
        acc.cleanSheets += s?.cleanSheets ?? 0;
        acc.motmVotes += s?.motmVotes ?? 0;
        acc.impact += s?.impact ?? 0;
        return acc;
    }, { ...emptyTotals });
}

// Canonical fallback XP: sum backend-provided per-match xpAwarded values.
function sumXPAwardedFromMatches(matches: LeagueMatch[] = []): number {
    return matches.reduce((acc, m) => {
        const v = Number(m?.playerStats?.xpAwarded ?? 0);
        return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
}

function getReadableTextColor(hexColor: string): string {
    const hex = String(hexColor || '').replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return '#111111';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.58 ? '#111111' : '#FFFFFF';
}

export default function PlayerStatsPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const { token, user } = useAuth();
    const currentUserId = String(user?.id || '').trim();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const { data, filters, loading: reduxLoading, error: reduxError } = useSelector((state: RootState) => state.playerStats);
    const { leagueId, year } = filters;

    const { data: fullPlayerData } = useSelector((state: RootState) => state.playerStats);
    const [careerData, setCareerData] = useState<RootState['playerStats']['data']>(null);
    
    // Debug logging
    useEffect(() => {
        console.log('🔍 Player Stats State:', {
            data,
            loading: reduxLoading,
            error: reduxError,
            playerId,
            leagueId,
            year
        });
    }, [data, reduxLoading, reduxError, playerId, leagueId, year]);

    const [search, setSearch] = useState('');
    const [, setLeagues] = useState<League[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const [seasons, setSeasons] = useState<Array<{id: string, name: string, seasonNumber?: number, startDate?: string, endDate?: string, isMember?: boolean}>>([]);
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
    const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
    const yearFilterButtonRef = useRef<HTMLButtonElement | null>(null);
    const leagueFilterButtonRef = useRef<HTMLButtonElement | null>(null);
    const seasonFilterButtonRef = useRef<HTMLButtonElement | null>(null);
    const [preferredLeagueId, setPreferredLeagueId] = useState<string | null>(null);
    const [preferredLeagueLoaded, setPreferredLeagueLoaded] = useState(false);
    const filtersInitialized = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPreferredLeagueId(localStorage.getItem('preferredLeagueId'));
        }
        setPreferredLeagueLoaded(true);
    }, []);
    
    // Tab navigation state
    const [activeTab, setActiveTab] = useState('current');
    
    // Stats Over Season Modal state
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [statsModalTab, setStatsModalTab] = useState<'goals' | 'assists' | 'motm' | 'defensive' | 'totalXP'>('goals');

    // Tabs only control visual highlight. Data always follows selected filters.
    const effectiveTrophiesLeagueId = leagueId || 'all';
    const effectiveTrophiesYear = year || 'all';
    const effectiveTrophiesSeasonId = selectedSeason || 'all';

    const effectiveRewardsLeagueId = leagueId || 'all';
    const effectiveRewardsYear = year || 'all';
    const effectiveRewardsSeasonId = selectedSeason || 'all';

    const effectiveHistoryLeagueId = leagueId || 'all';
    const effectiveHistoryYear = year || 'all';
    const effectiveHistorySeasonId = selectedSeason || 'all';

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
        
        // If year is 'all', return all leagues
        if (!year || year === 'all') {
            return list.filter(l => hasMatches(l) && isLeagueActiveForFilter(l));
        }
        
        // Otherwise filter by specific year
        return list.filter(l =>
            hasMatches(l) &&
            isLeagueActiveForFilter(l) &&
            (l.matches || []).some(m => dayjs(m.date).year().toString() === year)
        );
    }, [data, year]);

    // Populate seasons when league changes - fetch from dedicated seasons API
    useEffect(() => {
        if (!leagueId || leagueId === 'all' || !token) {
            setSeasons([]);
            setSelectedSeason('all');
            return;
        }
        
        const fetchSeasons = async () => {
            try {
                // Use the dedicated seasons endpoint which returns seasonNumber, startDate, endDate
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/seasons`, {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    // API returns { success: true, seasons: [...] }
                    const seasonsData = result?.seasons || result?.data || [];
                    
                    if (Array.isArray(seasonsData) && seasonsData.length > 0) {
                        const formattedSeasons = seasonsData.map((s: any) => ({
                            id: s.id || s._id,
                            name: s.name || `Season ${s.seasonNumber !== undefined ? s.seasonNumber : ''}`,
                            seasonNumber: s.seasonNumber !== undefined ? s.seasonNumber : null,
                            startDate: s.startDate || null,
                            endDate: s.endDate || null,
                            isMember: s.isMember !== undefined ? s.isMember : true
                        }));
                        setSeasons(formattedSeasons);
                        console.log('📋 Fetched seasons from /leagues/:id/seasons API:', formattedSeasons);
                        setSelectedSeason('all');
                    } else {
                        setSeasons([]);
                        setSelectedSeason('all');
                    }
                } else {
                    console.warn('Seasons API returned non-OK status:', response.status);
                    setSeasons([]);
                    setSelectedSeason('all');
                }
            } catch (error) {
                console.error('Failed to fetch seasons:', error);
                setSeasons([]);
                setSelectedSeason('all');
            }
        };
        
        fetchSeasons();
    }, [leagueId, token]);

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

    const normalizePlayer = useCallback((p: RawPlayer): LeaguePlayer => ({
        id: p.id || p._id || p.userId || '',
        firstName: p.firstName ?? p.fname,
        lastName: p.lastName ?? p.lname,
        name: p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
        avatar: p.avatar ?? p.profilePicture ?? p.avatarUrl,
        position: p.position ?? p.positionType,
    }), []);

    type TeammateAPIResponse = {
        success?: boolean;
        data?: RawPlayer[];
        players?: RawPlayer[];
    } | RawPlayer[];

    const fetchTeammates = useCallback(async () => {
        if (!token) return;
        if (!playerId) return;
        const effectiveLeagueId = leagueId || 'all';
        const effectiveYear = year || 'all';
        const effectiveSeason = selectedSeason || 'all';
        const leaguesFingerprint =
            effectiveLeagueId === 'all'
                ? (leaguesForYear || [])
                    .map((l) => String(l.id))
                    .sort()
                    .join(',')
                : effectiveLeagueId;

        // Include active filters in key so teammate cache doesn't go stale when filters change.
        const fetchKey = `${playerId}_${effectiveLeagueId}_${effectiveYear}_${effectiveSeason}_${leaguesFingerprint}`;
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

            // Handle "All Leagues" case - aggregate from all leagues
            if (effectiveLeagueId === 'all') {
                const allTeammates = new Map<string, RawPlayer>();
                
                // Get leagues for the selected year
                const leaguesToFetch = leaguesForYear || [];
                
                // Fetch teammates from each league
                for (const league of leaguesToFetch) {
                    try {
                        const primaryUrl = `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/leagues/${league.id}/teammates`;
                        const res = await fetch(primaryUrl, {
                            credentials: 'include',
                            headers: { Authorization: `Bearer ${token}` },
                            signal: controller.signal
                        });

                        if (res.ok) {
                            const contentType = res.headers.get('content-type');
                            if (!contentType || !contentType.includes('application/json')) continue;
                            const json: TeammateAPIResponse = await res.json();
                            let leagueList: RawPlayer[] = [];
                            
                            if (Array.isArray(json)) {
                                leagueList = json;
                            } else if (json?.data && Array.isArray(json.data)) {
                                leagueList = json.data;
                            } else if (json?.players && Array.isArray(json.players)) {
                                leagueList = json.players;
                            }

                            // Add to map to avoid duplicates
                            leagueList.forEach(player => {
                                if (player.id && !allTeammates.has(player.id)) {
                                    allTeammates.set(player.id, player);
                                }
                            });
                        }
                    } catch (err) {
                        // Continue with other leagues if one fails
                        console.log(`Failed to fetch teammates for league ${league.id}`, err);
                    }
                }

                list = Array.from(allTeammates.values());
            } else {
                // Single league case
                const primaryUrl = `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/leagues/${effectiveLeagueId}/teammates`;
                const res = await fetch(primaryUrl, {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });

                if (res.ok) {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const json: TeammateAPIResponse = await res.json();
                    if (Array.isArray(json)) {
                        list = json;
                    } else if (json?.data && Array.isArray(json.data)) {
                        list = json.data;
                    } else if (json?.players && Array.isArray(json.players)) {
                        list = json.players;
                    }
                    }
                }

                // Fallback: league players (admin/user listing)
                if (!list) {
                    const fbRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${effectiveLeagueId}/players`, {
                        credentials: 'include',
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal
                    });
                    if (fbRes.ok) {
                        const contentType = fbRes.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const fb = await fbRes.json();
                            const raw = Array.isArray(fb) ? fb : (Array.isArray(fb?.players) ? fb.players : []);
                            list = raw as RawPlayer[];
                        }
                    }
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
    }, [token, playerId, leagueId, year, selectedSeason, teammates.length, searchTriggered, leaguesForYear, normalizePlayer]);

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

    // Reset teammate search cache whenever scope filters change.
    useEffect(() => {
        setTeammates([]);
        setSearch('');
        setSearchTriggered(false);
        lastFetchKeyRef.current = '';
        setShowTeammatePanel(false);
    }, [leagueId, year, selectedSeason]);

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
            .then(async res => {
                if (!res.ok) return null;
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) return null;
                return res.json();
            })
            .then(d => {
                if (d?.success && d?.user) {
                    const userLeagues = [
                        ...(d.user.leagues || []),
                        ...(d.user.administeredLeagues || []),
                    ] as League[];
                    const unique = Array.from(new Map(userLeagues.map(l => [l.id, l])).values())
                        .filter((l) => isLeagueActiveForFilter(l as LeagueWithMatchesTyped));
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

    // Always keep an unfiltered snapshot for Career Stats (all leagues, all years).
    useEffect(() => {
        if (!playerId) {
            setCareerData(null);
            return;
        }

        let cancelled = false;
        playerAPI
            .getPlayerStats(String(playerId), 'all', 'all')
            .then((res) => {
                if (cancelled) return;
                if (res.success && res.data) {
                    setCareerData(res.data as unknown as RootState['playerStats']['data']);
                }
            })
            .catch(() => {
                if (!cancelled) setCareerData(null);
            });

        return () => {
            cancelled = true;
        };
    }, [playerId, token]);

    // Awards flattening
    const allTrophyAwards: AllTrophyAward[] = useMemo(() => {
        if (!data || !data.trophies) return [];
        const awards: AllTrophyAward[] = [];
        Object.entries(data.trophies).forEach(([trophyKey, winners]) => {
            if (Array.isArray(winners)) {
                (winners as TrophyAward[]).forEach((award: TrophyAward) => {
                    const winnerIdRaw = award.winnerId ?? award.winner_id ?? null;
                    if (!winnerIdRaw) return;
                    awards.push({
                        key: trophyKey,
                        leagueName: award.leagueName,
                        winnerId: String(winnerIdRaw),
                        winnerName: award.winnerName || award.winner || award.winner_id || '',
                    });
                });
            }
        });
        return awards;
    }, [data]);

    const allMatches = useMemo<LeagueMatch[]>(() => {
        const matches = (data?.leagues || []).flatMap((l) => (hasMatches(l) ? l.matches ?? [] : []));
        console.log('📊 All matches data:', {
            totalMatches: matches.length,
            sampleMatch: matches[0],
            leaguesCount: data?.leagues?.length || 0
        });
        return matches;
    }, [data]);

    const careerMatches = useMemo<LeagueMatch[]>(() => {
        const source = careerData || data;
        return (source?.leagues || []).flatMap((l) => (hasMatches(l) ? l.matches ?? [] : []));
    }, [careerData, data]);

    const currentLeagueMatches = useMemo<LeagueMatch[]>(() => {
        const leaguesList: LeagueWithMatchesTyped[] = (data?.leagues as LeagueWithMatchesTyped[] | undefined) ?? [];
        if (!leaguesList.length) return [];

        if (leagueId && leagueId !== 'all') {
            const l = leaguesList.find((x: LeagueWithMatchesTyped) => x.id === leagueId);
            let matches = hasMatches(l) ? l.matches ?? [] : [];
            
            // Apply season filter if selected - use date range from seasons API
            if (selectedSeason && selectedSeason !== 'all') {
                const selectedSeasonData = seasons.find(s => s.id === selectedSeason);
                if (selectedSeasonData && selectedSeasonData.startDate) {
                    const seasonStart = dayjs(selectedSeasonData.startDate);
                    const seasonEnd = selectedSeasonData.endDate ? dayjs(selectedSeasonData.endDate) : null;
                    
                    matches = matches.filter(m => {
                        // First check if match has seasonId directly
                        if ((m as any).seasonId) {
                            return (m as any).seasonId === selectedSeason;
                        }
                        // Otherwise filter by date range
                        const matchDate = dayjs(m.date);
                        if (seasonEnd) {
                            return matchDate.valueOf() >= seasonStart.valueOf() && matchDate.valueOf() <= seasonEnd.valueOf();
                        }
                        // Active season (no end date) - match is after start
                        return matchDate.valueOf() >= seasonStart.valueOf();
                    });
                } else {
                    // Fallback to direct seasonId check
                    matches = matches.filter(m => (m as any).seasonId === selectedSeason);
                }
                console.log('⚽ [Stats] Filtered by season:', selectedSeason, '| Matches:', matches.length);
            }
            
            return matches;
        }

        const first = leaguesList[0];
        return hasMatches(first) ? first.matches ?? [] : [];
    }, [data, leagueId, selectedSeason, seasons]);

    const accumulativeTotals = useMemo(() => sumStatsFromMatches(allMatches), [allMatches]);
    const careerTotals = useMemo(() => sumStatsFromMatches(careerMatches), [careerMatches]);
    const currentLeagueTotals = useMemo(() => sumStatsFromMatches(currentLeagueMatches), [currentLeagueMatches]);

    // Count MOTM votes from votes array - Current League
    const motmVotesCount = useMemo(() => {
        const count = currentLeagueMatches.reduce((acc, match) => {
            const votes = (match as any).votes || [];
            console.log('🗳️ Match votes:', {
                matchId: match.id,
                votes,
                playerId,
                votesForPlayer: votes.filter((vote: any) => 
                    String(vote.votedForId) === String(playerId)
                ).length
            });
            // Count how many votes this player received (votedForId is the player who received the vote)
            const votesForPlayer = votes.filter((vote: any) => 
                String(vote.votedForId) === String(playerId)
            ).length;
            return acc + votesForPlayer;
        }, 0);
        console.log('✅ Total MOTM votes for player:', count);
        return count;
    }, [currentLeagueMatches, playerId]);

    // Count MOTM votes from votes array - Career (All Matches)
    const careerMotmVotesCount = useMemo(() => {
        const count = careerMatches.reduce((acc, match) => {
            const votes = (match as any).votes || [];
            const votesForPlayer = votes.filter((vote: any) => 
                String(vote.votedForId) === String(playerId)
            ).length;
            return acc + votesForPlayer;
        }, 0);
        console.log('✅ Total Career MOTM votes for player:', count);
        return count;
    }, [careerMatches, playerId]);

    // Count defensive impact votes from captain picks - Current League
    const defensiveImpactCount = useMemo(() => {
        const count = currentLeagueMatches.filter(match => {
            const m = match as any;
            const isDefensive = m.homeDefensiveImpactId === playerId || 
                   m.awayDefensiveImpactId === playerId;
            console.log('🛡️ Match defensive impact:', {
                matchId: match.id,
                homeDefensiveImpactId: m.homeDefensiveImpactId,
                awayDefensiveImpactId: m.awayDefensiveImpactId,
                playerId,
                isDefensive
            });
            return isDefensive;
        }).length;
        console.log('✅ Total defensive impact count:', count);
        return count;
    }, [currentLeagueMatches, playerId]);

    // Count defensive impact votes from captain picks - Career (All Matches)
    const careerDefensiveImpactCount = useMemo(() => {
        const count = careerMatches.filter(match => {
            const m = match as any;
            return m.homeDefensiveImpactId === playerId || m.awayDefensiveImpactId === playerId;
        }).length;
        console.log('✅ Total Career defensive impact count:', count);
        return count;
    }, [careerMatches, playerId]);

    // Fallback XP from already-loaded profile payload
    const profileXPFallback = useMemo(() => {
        const playerObj = (fullPlayerData?.player || {}) as Record<string, unknown>;
        const rootObj = (fullPlayerData || {}) as Record<string, unknown>;
        const raw =
            playerObj.totalXP ??
            playerObj.totalXp ??
            playerObj.xp ??
            rootObj.totalXP ??
            rootObj.totalXp ??
            rootObj.xp ??
            0;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [fullPlayerData]);

    // Direct XP from player table by player id (/players/:id -> player.xp)
    const [xp, setXp] = useState<number>(0);
    const [xpLoading, setXpLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!playerId) {
            setXp(profileXPFallback);
            return;
        }

        let cancelled = false;
        setXpLoading(true);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${encodeURIComponent(String(playerId))}`, {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to fetch player profile');
                const json = (await res.json()) as Record<string, unknown>;
                const playerObj = (json.player || json.data || {}) as Record<string, unknown>;
                const raw =
                    playerObj.xp ??
                    playerObj.totalXP ??
                    playerObj.totalXp ??
                    json.xp ??
                    json.totalXP ??
                    profileXPFallback;
                const parsed = Number(raw);
                if (!cancelled) setXp(Number.isFinite(parsed) ? parsed : profileXPFallback);
            })
            .catch(() => {
                if (!cancelled) setXp(profileXPFallback);
            })
            .finally(() => {
                if (!cancelled) setXpLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [playerId, token, profileXPFallback]);

    // XP status from revised 7-level table
    const xpStatusTier = useMemo(() => getXPTier(xp), [xp]);

    const nextXpStatusTier = useMemo(() => {
        const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
        return XP_TIERS.find((tier) => tier.minXP > safeXp) ?? null;
    }, [xp]);

    const xpProgressToMax = useMemo(() => {
        const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
        const cappedXp = Math.min(XP_STATUS_MAX_POINTS, safeXp);
        const rawPercent = (cappedXp / XP_STATUS_MAX_POINTS) * 100;
        if (rawPercent <= 0) return 0;
        if (rawPercent >= 100) return 100;
        return Math.max(1, Math.round(rawPercent));
    }, [xp]);

    const xpRemainingToMax = useMemo(() => {
        const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
        return Math.max(0, XP_STATUS_MAX_POINTS - safeXp);
    }, [xp]);

    const xpStatusTextColor = useMemo(
        () => getReadableTextColor(xpStatusTier.cardColor),
        [xpStatusTier.cardColor]
    );

    // Compute season-wise stats for modal
    type SeasonStats = {
        seasonId: string;
        seasonName: string;
        seasonNumber: number;
        goals: number;
        assists: number;
        motmVotes: number;
        defensiveImpact: number;
        cleanSheets: number;
        totalXP: number;
        matches: number;
        isFinished: boolean;
        endDateFormatted: string;
    };

    const seasonWiseStats = useMemo<SeasonStats[]>(() => {
        const leaguesList: LeagueWithMatchesTyped[] = (data?.leagues as LeagueWithMatchesTyped[] | undefined) ?? [];
        if (!leaguesList.length || !leagueId || leagueId === 'all') return [];

        const selectedLeague = leaguesList.find(l => l.id === leagueId);
        // Allow league even with no matches - user may be a member in seasons with 0 matches
        if (!selectedLeague) return [];
        // If no matches AND no seasons fetched, nothing to show
        if (!hasMatches(selectedLeague) && seasons.length === 0) return [];

        console.log('🔍 Selected League Data:', {
            leagueId,
            leagueName: selectedLeague.name,
            totalMatches: (selectedLeague.matches || []).length,
            seasonsFromAPI: seasons,
        });

        const allLeagueMatches = selectedLeague.matches || [];
        
        // Filter matches where this player was added/participated
        const playerMatches = allLeagueMatches.filter(match => {
            const m = match as any;
            
            // Check if player is in either team's roster
            const inHomeTeam = m.homeTeam?.players?.some((p: any) => String(p.id || p._id) === String(playerId));
            const inAwayTeam = m.awayTeam?.players?.some((p: any) => String(p.id || p._id) === String(playerId));
            
            // Player participated if they are in the team roster
            if (inHomeTeam || inAwayTeam) {
                return true;
            }
            
            // Also include if they have any stats recorded
            const stats = match.playerStats;
            if (stats && (
                (stats.goals && stats.goals > 0) ||
                (stats.assists && stats.assists > 0) ||
                (stats.cleanSheets && stats.cleanSheets > 0) ||
                (stats.motmVotes && stats.motmVotes > 0) ||
                (stats.defence && stats.defence > 0) ||
                (stats.impact && stats.impact > 0) ||
                (stats.freeKicks && stats.freeKicks > 0) ||
                (stats.penalties && stats.penalties > 0)
            )) {
                return true;
            }
            
            // Also check if player received any votes or captain picks
            if (m.votes && m.votes.some((v: any) => String(v.votedForId) === String(playerId))) {
                return true;
            }
            
            if (m.homeDefensiveImpactId === playerId || m.awayDefensiveImpactId === playerId) {
                return true;
            }
            
            return false;
        });

        console.log('🎯 Player participated in matches:', {
            totalLeagueMatches: allLeagueMatches.length,
            playerMatches: playerMatches.length,
            playerId,
            selectedSeason,
            isAllSeasons: selectedSeason === 'all',
        });

        // Use seasons from state (fetched from /leagues/:id/seasons API)
        // These have proper seasonNumber, startDate, endDate from database
        const apiSeasons = seasons;
        
        // Create season ID to season number mapping
        const seasonIdToNumberMap: Record<string, number> = {};
        apiSeasons.forEach((season) => {
            if (season.id && season.seasonNumber !== undefined && season.seasonNumber !== null) {
                seasonIdToNumberMap[season.id] = season.seasonNumber;
            }
        });
        
        console.log('📋 Seasons from API (with dates):', apiSeasons);
        console.log('🗺️ Season ID → Number mapping:', seasonIdToNumberMap);

        // Group player's matches by season using date ranges
        const seasonMap = new Map<string, LeagueMatch[]>();
        
        if (apiSeasons.length > 0) {
            // Sort seasons by startDate ascending for proper date matching
            const sortedSeasons = [...apiSeasons].sort((a, b) => {
                const dateA = a.startDate ? dayjs(a.startDate).valueOf() : 0;
                const dateB = b.startDate ? dayjs(b.startDate).valueOf() : 0;
                return dateA - dateB;
            });
            
            playerMatches.forEach(match => {
                const matchDate = dayjs(match.date);
                let matchSeasonId: string | null = (match as any).seasonId || null;
                
                // If match doesn't have seasonId, find season by date range
                if (!matchSeasonId) {
                    for (const season of sortedSeasons) {
                        const seasonStart = season.startDate ? dayjs(season.startDate) : null;
                        const seasonEnd = season.endDate ? dayjs(season.endDate) : null;
                        
                        if (seasonStart && seasonEnd) {
                            if (matchDate.valueOf() >= seasonStart.valueOf() && matchDate.valueOf() <= seasonEnd.valueOf()) {
                                matchSeasonId = season.id;
                                break;
                            }
                        } else if (seasonStart && !seasonEnd) {
                            // Active season (no end date) - match is after start
                            if (matchDate.valueOf() >= seasonStart.valueOf()) {
                                matchSeasonId = season.id;
                                break;
                            }
                        }
                    }
                    
                    // If still no match, assign to nearest season before match date
                    if (!matchSeasonId) {
                        const reverseSorted = [...sortedSeasons].reverse();
                        for (const season of reverseSorted) {
                            const seasonStart = season.startDate ? dayjs(season.startDate) : null;
                            if (seasonStart && matchDate.valueOf() >= seasonStart.valueOf()) {
                                matchSeasonId = season.id;
                                break;
                            }
                        }
                    }
                    
                    // Last resort - assign to first season
                    if (!matchSeasonId && sortedSeasons.length > 0) {
                        matchSeasonId = sortedSeasons[0].id;
                    }
                }
                
                const finalSeasonId = matchSeasonId || 'unknown';
                
                // If a specific season is selected, only include matches from that season
                if (selectedSeason && selectedSeason !== 'all' && finalSeasonId !== selectedSeason) {
                    return;
                }
                
                if (!seasonMap.has(finalSeasonId)) {
                    seasonMap.set(finalSeasonId, []);
                }
                seasonMap.get(finalSeasonId)!.push(match);
            });
        } else {
            // No seasons available - put all matches under a single group
            console.log('⚠️ No seasons found, showing all matches as one group');
            if (playerMatches.length > 0) {
                seasonMap.set('all-matches', playerMatches);
                seasonIdToNumberMap['all-matches'] = 1;
            }
        }

        // Ensure ALL seasons where user is a member appear, even with 0 matches
        if (apiSeasons.length > 0) {
            apiSeasons.forEach(season => {
                // Include season if user is a member (or isMember not specified = include all)
                const isMember = season.isMember !== false;
                if (isMember && !seasonMap.has(season.id)) {
                    // If filtering by specific season, only add that one
                    if (selectedSeason && selectedSeason !== 'all' && season.id !== selectedSeason) {
                        return;
                    }
                    seasonMap.set(season.id, []);
                    console.log(`📌 Added member season with 0 matches: Season ${season.seasonNumber} (${season.name})`);
                }
            });
        }

        console.log('📊 Seasons to display in popup:', {
            selectedSeasonFilter: selectedSeason,
            seasonsFound: Array.from(seasonMap.keys()),
            seasonCount: seasonMap.size,
            matchesPerSeason: Array.from(seasonMap.entries()).map(([id, matches]) => ({ 
                seasonId: id,
                seasonNumber: seasonIdToNumberMap[id] !== undefined ? seasonIdToNumberMap[id] : 'N/A',
                matchCount: matches.length,
                firstMatchDate: matches[0] ? dayjs(matches[0].date).format('MMM YYYY') : 'N/A'
            }))
        });

        // Calculate stats for each season where player participated
        const stats: SeasonStats[] = [];
        
        seasonMap.forEach((matches, seasonId) => {
            const totals = sumStatsFromMatches(matches);
            
            // Count MOTM votes
            const motmVotes = matches.reduce((acc, match) => {
                const votes = (match as any).votes || [];
                const votesForPlayer = votes.filter((vote: any) => 
                    String(vote.votedForId) === String(playerId)
                ).length;
                return acc + votesForPlayer;
            }, 0);

            // Count defensive impact
            const defensiveImpact = matches.filter(match => {
                const m = match as any;
                return m.homeDefensiveImpactId === playerId || m.awayDefensiveImpactId === playerId;
            }).length;

            // Canonical total XP from backend per-match xpAwarded
            const totalXP = sumXPAwardedFromMatches(matches);

            // Get season info from state (fetched from API)
            const seasonInfo = seasons.find(s => s.id === seasonId);
            
            // Determine season number from mapping (built from API data)
            let seasonNumber: number;
            if (seasonIdToNumberMap[seasonId] !== undefined) {
                seasonNumber = seasonIdToNumberMap[seasonId];
            } else if (seasonInfo?.seasonNumber !== undefined && seasonInfo.seasonNumber !== null) {
                seasonNumber = seasonInfo.seasonNumber;
            } else {
                // Fallback
                seasonNumber = stats.length + 1;
            }
            
            const seasonName = seasonInfo?.name || `Season ${seasonNumber}`;
            
            // Determine if season is finished: has endDate and endDate is in the past
            const seasonEndDate = seasonInfo?.endDate ? dayjs(seasonInfo.endDate) : null;
            const isFinished = seasonEndDate ? seasonEndDate.valueOf() < dayjs().valueOf() : false;
            const endDateFormatted = isFinished && seasonEndDate ? seasonEndDate.format('MMM YYYY') : '';

            stats.push({
                seasonId,
                seasonName,
                seasonNumber,
                goals: totals.goals,
                assists: totals.assists,
                motmVotes,
                defensiveImpact,
                cleanSheets: totals.cleanSheets,
                totalXP,
                matches: matches.length,
                isFinished,
                endDateFormatted
            });
        });

        // Sort by season number descending (latest first)
        const sortedStats = stats.sort((a, b) => b.seasonNumber - a.seasonNumber);
        
        console.log('✅ Final season stats for popup:', sortedStats);
        
        return sortedStats;
    }, [data, leagueId, playerId, seasons, selectedSeason]);

    const yearsOptions = useMemo(() => {
        const years = new Set<number>([dayjs().year()]);
        const leaguesList = ((data?.leagues as LeagueWithMatchesTyped[] | undefined) ?? []);

        leaguesList.forEach((league) => {
            if (!hasMatches(league)) return;
            (league.matches || []).forEach((m) => {
                const y = dayjs(m.date).year();
                if (Number.isFinite(y)) years.add(y);
            });
        });

        return ['all', ...Array.from(years).sort((a, b) => b - a).map(String)];
    }, [data]);

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

    // On initial load, prefer preferredLeagueId; fallback to 'all'
    useEffect(() => {
        if (!data || !preferredLeagueLoaded || filtersInitialized.current) return;
        
        // Only set defaults once on first load
        if (!year) {
            dispatch(setYearFilter('all'));
        }
        const leaguesList = (data?.leagues || []) as LeagueWithMatchesTyped[];
        const preferredIsValid = Boolean(
            preferredLeagueId &&
            leaguesList.some((l) => l.id === preferredLeagueId && isLeagueActiveForFilter(l))
        );
        const nextLeague = preferredIsValid ? String(preferredLeagueId) : (leagueId || 'all');
        if (nextLeague !== leagueId) {
            dispatch(setLeagueFilter(nextLeague));
        }
        
        filtersInitialized.current = true;
    }, [data, year, leagueId, preferredLeagueId, preferredLeagueLoaded, dispatch]);

    // Keep current league if still valid after year change; else reset to 'all'
    useEffect(() => {
        const list = leaguesForYear;
        if (!list.length) {
            if (leagueId !== 'all') dispatch(setLeagueFilter('all'));
            return;
        }
        if (leagueId === 'all') return;
        const stillValid = list.some(l => l.id === leagueId);
        if (!stillValid) {
            // If current league not valid for selected year, reset to 'all'
            dispatch(setLeagueFilter('all'));
        }
    }, [leaguesForYear, leagueId, dispatch]);

    useEffect(() => {
        if (!year || year === 'all') return;
        if (!yearsOptions.includes(year)) {
            dispatch(setYearFilter('all'));
        }
    }, [year, yearsOptions, dispatch]);

    const applyYearSelection = (val: string) => {
        setYearDropdownOpen(false);

        // compute valid leagues for the selected year
        const list = ((data?.leagues || []) as LeagueWithMatchesTyped[]).filter((l) =>
            isLeagueActiveForFilter(l) &&
            (val === 'all'
                ? hasMatches(l)
                : hasMatches(l) && (l.matches || []).some(m => dayjs(m.date).year().toString() === val))
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

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyYearSelection(e.target.value);
    };

    const applyLeagueSelection = (value: string) => {
        setLeagueDropdownOpen(false);
        dispatch(setLeagueFilter(value));
    };

    const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyLeagueSelection(e.target.value);
    };

    const currentLeagueName =
        leagueId && leagueId !== 'all'
            ? leaguesForYear.find((l: LeagueWithMatchesTyped) => l.id === leagueId)?.name || 'Current League'
            : leaguesForYear[0]?.name || 'Current League';

    const playerName = fullPlayerData?.player?.name || 'Player';
    // const playerShirt = fullPlayerData?.player?.shirtNo || '';
    const playerPositionType = fullPlayerData?.player?.positionType || fullPlayerData?.player?.position || 'Player';

    // Accumulative trophies via backend API with fallback to local computation
    const [trophyCounts, setTrophyCounts] = useState<Record<string, number>>({});
    const [trophiesLoading, setTrophiesLoading] = useState(false);

    // Player Badges/Rewards State
    type PlayerBadge = {
        id: string;
        title: string;
        count: number;
        xp: number;
        unlocked: boolean;
    };
    const [playerBadges, setPlayerBadges] = useState<PlayerBadge[]>([]);
    const [badgesLoading, setBadgesLoading] = useState(false);

    // History & Records State (fetched from backend)
    const [historyRecords, setHistoryRecords] = useState({
        longestWinStreak: 0,
        mostGoalsInLeague: 0,
        mostMotmInLeague: 0,
        longestWinMargin: '0-0',
        highestXpInLeague: 0
    });
    const [historyRecordsLoading, setHistoryRecordsLoading] = useState(false);

    // Local fallback counting
    const localCounts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const a of allTrophyAwards) {
            map[a.key] = (map[a.key] || 0) + 1;
        }
        return map;
    }, [allTrophyAwards]);

    useEffect(() => {
        // Fetch trophies whenever selected filters change
        if (!playerId) return;
        let cancelled = false;
        setTrophiesLoading(true);
        
        console.log('🏆 [Trophies] Fetching with filters:', { 
            playerId, 
            leagueId: effectiveTrophiesLeagueId, 
            year: effectiveTrophiesYear,
            selectedSeason: effectiveTrophiesSeasonId,
        });
        
        // Fetch trophies with filters
        playerAPI.getPlayerTrophies(String(playerId), effectiveTrophiesLeagueId, effectiveTrophiesYear, effectiveTrophiesSeasonId)
            .then(res => {
                if (cancelled) return;
                console.log('✅ [Trophies] Response:', res);
                if (res.success && res.data?.counts) setTrophyCounts(res.data.counts);
                else setTrophyCounts(localCounts);
            })
            .catch((err) => { 
                console.error('❌ [Trophies] Error:', err);
                if (!cancelled) setTrophyCounts(localCounts); 
            })
            .finally(() => { if (!cancelled) setTrophiesLoading(false); });
        return () => { cancelled = true; };
    }, [playerId, effectiveTrophiesLeagueId, effectiveTrophiesYear, effectiveTrophiesSeasonId, localCounts]);

    // Fetch player badges/achievements
    useEffect(() => {
        console.log('🔥 [BADGES] useEffect triggered!', { playerId, hasToken: !!token, leagueId, year, selectedSeason });
        
        // Fetch badges whenever selected filters change
        if (!playerId) {
            console.warn('⚠️ [BADGES] No playerId - skipping');
            return;
        }
        
        if (!token) {
            console.warn('⚠️ [BADGES] No token - skipping');
            return;
        }
        
        let cancelled = false;
        setBadgesLoading(true);
        console.log('🔄 [BADGES] Starting badge fetch with filters:', { leagueId: effectiveRewardsLeagueId, year: effectiveRewardsYear, selectedSeason: effectiveRewardsSeasonId });
        
        // Build query params for effective filters
        const params = new URLSearchParams();
        if (effectiveRewardsLeagueId && effectiveRewardsLeagueId !== 'all') params.append('leagueId', effectiveRewardsLeagueId);
        if (effectiveRewardsYear && effectiveRewardsYear !== 'all') params.append('year', effectiveRewardsYear);
        if (effectiveRewardsSeasonId && effectiveRewardsSeasonId !== 'all') params.append('seasonId', effectiveRewardsSeasonId);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        // Try player-specific endpoint first (supports leagueId/year/seasonId filters)
        // Fall back to /users/me/achievements only if that fails
        const endpoints = [
            `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/achievements${queryString}`,
            `${process.env.NEXT_PUBLIC_API_URL}/users/me/achievements${queryString}`,
        ];
        
        console.log('📋 [BADGES] Will try endpoints:', endpoints);
        
        const tryFetch = async () => {
            for (let i = 0; i < endpoints.length; i++) {
                const endpoint = endpoints[i];
                try {
                    console.log(`🌐 [BADGES ${i + 1}/${endpoints.length}] Fetching from:`, endpoint);
                    
                    // Use & if queryString exists, otherwise use ?
                    const cacheBuster = queryString ? `&_=${Date.now()}` : `?_=${Date.now()}`;
                    const res = await fetch(`${endpoint}${cacheBuster}`, {
                        credentials: 'include',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    console.log(`📡 [BADGES ${i + 1}] Response status:`, res.status, res.statusText);
                    
                    // Check if response is JSON before parsing
                    if (!res.ok) {
                        console.warn(`⚠️ [BADGES ${i + 1}] API returned error:`, res.status, res.statusText);
                        continue; // Try next endpoint
                    }
                    
                    const contentType = res.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        console.warn(`⚠️ [BADGES ${i + 1}] Response is not JSON:`, contentType);
                        continue; // Try next endpoint
                    }
                    
                    const data = await res.json();
                    console.log(`📦 [BADGES ${i + 1}] Response data:`, data);
                    
                    if (cancelled) {
                        console.log('🚫 [BADGES] Cancelled - exiting');
                        return;
                    }
                    
                    if (res.ok && data?.success && Array.isArray(data.badges)) {
                        console.log(`✅ [BADGES ${i + 1}] Success! Raw badges:`, data.badges);
                        
                        // Filter only unlocked badges with count > 0
                        const earnedBadges = data.badges
                            .filter((b: PlayerBadge) => {
                                const pass = b.unlocked && b.count > 0 && b.id !== 'rising_xp';
                                console.log(`  🔍 Badge ${b.id}: unlocked=${b.unlocked}, count=${b.count}, pass=${pass}`);
                                return pass;
                            })
                            .map((b: PlayerBadge) => ({
                                id: b.id,
                                title: b.title || b.id,
                                count: Number(b.count || 0),
                                xp: Number(b.xp || 0),
                                unlocked: Boolean(b.unlocked)
                            }));
                        
                        console.log('🎖️ [BADGES] Final earned badges:', earnedBadges);
                        setPlayerBadges(earnedBadges);
                        setBadgesLoading(false);
                        return; // Success, exit
                    } else {
                        console.warn(`⚠️ [BADGES ${i + 1}] Invalid response:`, {
                            ok: res.ok,
                            success: data?.success,
                            hasBadges: Array.isArray(data?.badges),
                            badgesLength: data?.badges?.length
                        });
                    }
                } catch (err) {
                    console.error(`❌ [BADGES ${i + 1}] Error:`, err);
                    continue; // Try next endpoint
                }
            }
            
            // All endpoints failed
            if (!cancelled) {
                console.error('💥 [BADGES] All endpoints failed!');
                setPlayerBadges([]);
                setBadgesLoading(false);
            }
        };
        
        tryFetch();
        
        return () => { 
            console.log('🧹 [BADGES] Cleanup');
            cancelled = true; 
        };
    }, [playerId, token, effectiveRewardsLeagueId, effectiveRewardsYear, effectiveRewardsSeasonId]);

    // Fetch history records from backend with filters
    useEffect(() => {
        // Fetch history whenever selected filters change
        if (!playerId) return;
        let cancelled = false;
        setHistoryRecordsLoading(true);
        
        console.log('🔍 [History Records] Fetching with filters:', { 
            playerId, 
            leagueId: effectiveHistoryLeagueId, 
            year: effectiveHistoryYear, 
            selectedSeason: effectiveHistorySeasonId,
        });
        
        playerAPI.getPlayerHistoryRecords(String(playerId), effectiveHistoryLeagueId, effectiveHistoryYear, effectiveHistorySeasonId)
            .then(res => {
                if (cancelled) return;
                console.log('✅ [History Records] Response:', res);
                if (res.success && res.data) {
                    setHistoryRecords(res.data);
                }
            })
            .catch((err) => {
                console.error('❌ [History Records] Error:', err);
            })
            .finally(() => {
                if (!cancelled) setHistoryRecordsLoading(false);
            });

        return () => { cancelled = true; };
    }, [playerId, effectiveHistoryLeagueId, effectiveHistoryYear, effectiveHistorySeasonId]);

    const earnedTrophies = useMemo(() => {
        // Aggregate counts for duplicate keys (e.g., 'Champion Footballer' + 'League Champion')
        const aggregatedCounts: Record<string, number> = {};
        
        // Map legacy keys to their canonical key
        const keyMapping: Record<string, string> = {
            'Champion Footballer': 'League Champion',
            'League Champion': 'League Champion',
            'Runner Up': 'Runner-Up',
            'Runner-Up': 'Runner-Up',
            "Ballon d'Or": "Ballon d'Or",
            "Ballon D'or": "Ballon d'Or",
            'Golden Boot': 'Golden Boot',
            'King Playmaker': 'King Playmaker',
            'Legendary Shield': 'Legendary Shield',
            'The Dark Horse': 'The Dark Horse',
            'Dark Horse': 'The Dark Horse',
            'Star Keeper': 'Star Keeper',
        };
        
        // Sum up counts for each canonical key
        Object.entries(trophyCounts).forEach(([key, count]) => {
            const canonicalKey = keyMapping[key] || key;
            aggregatedCounts[canonicalKey] = (aggregatedCounts[canonicalKey] || 0) + count;
        });
        
        // Return trophies in fixed order, only those with count > 0
        return orderedTrophyKeys
            .filter(key => aggregatedCounts[key] > 0)
            .map(key => ({
                key,
                image: trophyDetails[key]?.image,
                label: trophyDetails[key]?.label || key,
                count: aggregatedCounts[key]
            }));
    }, [trophyCounts]);

    // Icon-style item now uses football.png with value centered, label below
    const StatItem = ({ label, value }: { label: string; value: number }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography sx={{ color: '#c8c8c8', fontSize: { xs: 15, sm: 17, md: 19 }, fontWeight: 600 }}>
                {label}
            </Typography>
            <Typography sx={{ color: '#ffffff', fontSize: { xs: 15, sm: 17, md: 18 }, fontWeight: 700 }}>
                {value ?? 0}
            </Typography>
        </Box>
    );

    const loading = reduxLoading || !data;

    return (
        <Box sx={{ minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>
            <style jsx global>{`
                .filter-select-wrapper {
                    position: relative;
                    display: inline-block;
                }
                .filter-select-wrapper::after {
                    content: '';
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 8px solid #fff;
                    transform: translateY(-50%);
                    pointer-events: none;
                    transition: transform 0.3s ease;
                }
                .filter-select-wrapper.open::after {
                    transform: translateY(-50%) rotate(180deg);
                }
                .filter-select {
                    transition: all 0.2s ease;
                }
            `}</style>
            {/* Header Section */}
            <Box sx={{
                mt: 0,
                mb: 4,
                width: '100vw',
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#0e0e0e',
            }}>
                <Paper sx={{
                    px: 0,
                    py: { xs: 2, md: 3.5 },
                    background: '#0e0e0e',
                    color: 'white',
                    boxShadow: 'none',
                    minHeight: { xs: 'var(--header-mobile-min-height)', md: 'auto' },
                }}>
                    {/* Centered Title */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pt: { xs: 1, md: 2 },
                        pb: 2,
                    }}>
                        <Typography 
                            variant="h2" 
                            component="h1" 
                            sx={{ 
                                fontWeight: 700, 
                                color: '#fff', 
                                fontSize: { xs: '32px', sm: '42px', md: '55px' }, 
                                textTransform: 'uppercase',
                                letterSpacing: 0,
                                textAlign: 'center',
                                fontFamily: '"Oswald", sans-serif !important',
                                lineHeight: '100%',
                            }}
                        >
                            PLAYER STATS
                        </Typography>
                    </Box>

                    {/* Orange divider under header */}
                    <Box
                        sx={{
                            height: 'var(--header-divider-height)',
                            bgcolor: 'var(--header-divider-color)',
                            mt: { xs: 2, md: 4.5 },
                            width: '100vw',
                            position: 'relative',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    />

                    {/* Search and Filters Section */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: { xs: 2, md: 3 },
                        px: { xs: 2, md: 4 },
                        py: { xs: 1.5, md: 1.3 },
                        maxWidth: '1230px',
                        mx: 'auto',
                    }}>
                        {/* Search Input */}
                        <Box
                            ref={searchWrapperRef}
                            sx={{
                                width: { xs: '100%', md: 'fit-content' },
                                minWidth: { md: 260 },
                                maxWidth: { md: 420 },
                                ml: { xs: 0, md: 0.8 },
                                position: 'relative',
                                zIndex: 5,
                            }}
                        >
                            <TextField
                                variant="outlined"
                                placeholder="Search player name and hit enter..."
                                value={search}
                                onFocus={() => {
                                    setShowTeammatePanel(true);
                                    if (!searchTriggered && !teammatesLoading) {
                                        void fetchTeammates();
                                    }
                                }}
                                onClick={() => {
                                    setShowTeammatePanel(true);
                                    if (!searchTriggered && !teammatesLoading) {
                                        void fetchTeammates();
                                    }
                                }}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    if (!showTeammatePanel) setShowTeammatePanel(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (!searchTriggered) void fetchTeammates();
                                        setShowTeammatePanel(true);
                                        return;
                                    }
                                    if (e.key === 'Escape') {
                                        setShowTeammatePanel(false);
                                    }
                                }}
                                sx={{
                                    width: { xs: '100%', md: 'fit-content' },
                                    '& .MuiOutlinedInput-root': {
                                        height: { xs: 38, sm: 42 },
                                        color: 'white',
                                        backgroundColor: 'transparent',
                                        borderRadius: '3px',
                                        '& fieldset': { borderColor: '#e56a16', borderWidth: 1.5 },
                                        '&:hover fieldset': { borderColor: '#e56a16' },
                                        '&.Mui-focused fieldset': { borderColor: '#e56a16' }
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'white',
                                        fontSize: { xs: 14, sm: 16.5 },
                                        py: 0.5,
                                        '&::placeholder': { color: '#fff', opacity: 1 }
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ mr: 3, ml: 0.5, display: 'flex', alignItems: 'center' }}>
                                            <Image src={SearchIcon} alt="Search" width={25} height={25} />
                                        </Box>
                                    ),
                                }}
                            />

                            {showTeammatePanel && (
                                <Paper
                                    elevation={6}
                                    sx={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        mt: 0,
                                        maxHeight: 320,
                                        overflowY: 'auto',
                                        borderRadius: 2,
                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        p: 1.25,
                                        '&::-webkit-scrollbar': { width: 6 },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: 'rgba(255,255,255,0.25)',
                                            borderRadius: 3
                                        },
                                    }}
                                >
                                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13, mb: 0.75 }}>
                                        {leagueId === 'all' ? 'Players across selected leagues' : 'Players in selected league'}
                                    </Typography>

                                    {teammatesLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                            <CircularProgress size={22} />
                                        </Box>
                                    ) : !searchTriggered ? (
                                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            Press Enter to search players you have played with.
                                        </Typography>
                                    ) : teammates.length === 0 ? (
                                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            No player data found for this filter.
                                        </Typography>
                                    ) : filteredTeammates.length === 0 ? (
                                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            This player name is not found in selected league filters.
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={0.75}>
                                            {filteredTeammates.map((p) => {
                                                const displayName =
                                                    p.name ||
                                                    `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
                                                    'Player';

                                                return (
                                                    <Grid item xs={12} key={p.id}>
                                                        <Box
                                                            onClick={() => {
                                                                setShowTeammatePanel(false);
                                                                router.push(`/player/${p.id}`);
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

                        {/* Filter Buttons */}
                        <Box
                            sx={{
                                display: { xs: 'grid', md: 'flex' },
                                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' },
                                alignItems: 'center',
                                justifyContent: { xs: 'stretch', md: 'flex-end' },
                                gap: { xs: 1, sm: 1.2, md: 1 },
                                width: { xs: '100%', md: 'auto' },
                                maxWidth: { xs: 340, sm: 520, md: 'none' },
                                mx: { xs: 'auto', md: 0 },
                            }}
                        >
                            {/* Year Filter */}
                            <div className={`filter-select-wrapper${yearDropdownOpen ? ' open' : ''}`} style={{ width: isDesktop ? 'fit-content' : '100%' }}>
                            {isDesktop ? (
                                <select
                                    className="filter-select"
                                    value={year || 'all'}
                                    onChange={handleYearSelect}
                                    onMouseDown={() => setYearDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setYearDropdownOpen(false), 100)}
                                    style={{
                                        height: '39px',
                                        padding: '0 36px 0 12px',
                                        marginLeft: 0,
                                        backgroundColor: 'transparent',
                                        color: '#fff',
                                        border: '1.5px solid #e56a16',
                                        borderRadius: '24px',
                                        fontSize: '17px',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        width: 'auto',
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Years</option>
                                    {yearsOptions.filter(y => y !== 'all').map(y => (
                                        <option key={y} value={y} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{y}</option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <button
                                        ref={yearFilterButtonRef}
                                        type="button"
                                        onClick={() => setYearDropdownOpen((prev) => !prev)}
                                        style={{
                                            height: '34px',
                                            padding: '0 30px 0 10px',
                                            marginLeft: 0,
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            border: '1.5px solid #e56a16',
                                            borderRadius: '24px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            width: '100%',
                                            fontWeight: 600,
                                            textAlign: 'left',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {year && year !== 'all' ? year : 'All Years'}
                                    </button>
                                    <Menu
                                        anchorEl={yearFilterButtonRef.current}
                                        open={yearDropdownOpen}
                                        onClose={() => setYearDropdownOpen(false)}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                        PaperProps={{
                                            sx: {
                                                mt: 0.5,
                                                borderRadius: 1,
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                backgroundColor: '#1a1a1a',
                                                width: yearFilterButtonRef.current?.offsetWidth || 148,
                                                maxWidth: yearFilterButtonRef.current?.offsetWidth || 148,
                                            }
                                        }}
                                        MenuListProps={{ sx: { py: 0 } }}
                                    >
                                        {['all', ...yearsOptions.filter(y => y !== 'all')].map((value) => (
                                            <MenuItem
                                                key={value}
                                                selected={(year || 'all') === value}
                                                onClick={() => applyYearSelection(value)}
                                                sx={{
                                                    color: '#fff',
                                                    fontSize: 13,
                                                    minHeight: 34,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    '&.Mui-selected': { backgroundColor: '#2b66bd' },
                                                    '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                                                }}
                                            >
                                                {value === 'all' ? 'All Years' : value}
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                </>
                            )}
                            </div>

                            {/* League Filter */}
                            <div className={`filter-select-wrapper${leagueDropdownOpen ? ' open' : ''}`} style={{ width: isDesktop ? 'fit-content' : '100%' }}>
                            {isDesktop ? (
                                <select
                                    className="filter-select"
                                    value={leagueId || 'all'}
                                    onChange={handleLeagueChange}
                                    onMouseDown={() => setLeagueDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setLeagueDropdownOpen(false), 100)}
                                    style={{
                                        height: '39px',
                                        padding: '0 36px 0 12px',
                                        marginLeft: 0,
                                        backgroundColor: 'transparent',
                                        color: '#fff',
                                        border: '1.5px solid #e56a16',
                                        borderRadius: '24px',
                                        fontSize: '17px',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        width: 'auto',
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Leagues</option>
                                    {(leaguesForYear || []).map((l: LeagueWithMatchesTyped) => (
                                        <option key={l.id} value={l.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{l.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <button
                                        ref={leagueFilterButtonRef}
                                        type="button"
                                        onClick={() => setLeagueDropdownOpen((prev) => !prev)}
                                        style={{
                                            height: '34px',
                                            padding: '0 30px 0 10px',
                                            marginLeft: 0,
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            border: '1.5px solid #e56a16',
                                            borderRadius: '24px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            width: '100%',
                                            fontWeight: 600,
                                            textAlign: 'left',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {leagueId && leagueId !== 'all'
                                            ? ((leaguesForYear || []).find((l: LeagueWithMatchesTyped) => l.id === leagueId)?.name || 'All Leagues')
                                            : 'All Leagues'}
                                    </button>
                                    <Menu
                                        anchorEl={leagueFilterButtonRef.current}
                                        open={leagueDropdownOpen}
                                        onClose={() => setLeagueDropdownOpen(false)}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                        PaperProps={{
                                            sx: {
                                                mt: 0.5,
                                                borderRadius: 1,
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                backgroundColor: '#1a1a1a',
                                                width: leagueFilterButtonRef.current?.offsetWidth || 148,
                                                maxWidth: leagueFilterButtonRef.current?.offsetWidth || 148,
                                            }
                                        }}
                                        MenuListProps={{ sx: { py: 0 } }}
                                    >
                                        <MenuItem
                                            selected={(leagueId || 'all') === 'all'}
                                            onClick={() => applyLeagueSelection('all')}
                                            sx={{
                                                color: '#fff',
                                                fontSize: 13,
                                                minHeight: 34,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                '&.Mui-selected': { backgroundColor: '#2b66bd' },
                                                '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                                            }}
                                        >
                                            All Leagues
                                        </MenuItem>
                                        {(leaguesForYear || []).map((l: LeagueWithMatchesTyped) => (
                                            <MenuItem
                                                key={l.id}
                                                selected={(leagueId || 'all') === l.id}
                                                onClick={() => applyLeagueSelection(l.id)}
                                                sx={{
                                                    color: '#fff',
                                                    fontSize: 13,
                                                    minHeight: 34,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    '&.Mui-selected': { backgroundColor: '#2b66bd' },
                                                    '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                                                }}
                                            >
                                                {l.name}
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                </>
                            )}
                            </div>

                            {/* Season Filter */}
                            <div className={`filter-select-wrapper${seasonDropdownOpen ? ' open' : ''}`} style={{ width: isDesktop ? 'fit-content' : '100%' }}>
                            {isDesktop ? (
                                <select
                                    className="filter-select"
                                    value={selectedSeason}
                                    onChange={(e) => {
                                        setSelectedSeason(e.target.value);
                                        setSeasonDropdownOpen(false);
                                    }}
                                    onMouseDown={() => {
                                        if (leagueId !== 'all') {
                                            setSeasonDropdownOpen(true);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setSeasonDropdownOpen(false), 100)}
                                    disabled={leagueId === 'all'}
                                    style={{
                                        height: '39px',
                                        padding: '0 36px 0 12px',
                                        marginLeft: 0,
                                        backgroundColor: 'transparent',
                                        color: '#fff',
                                        border: '1.5px solid #e56a16',
                                        borderRadius: '24px',
                                        fontSize: '17px',
                                        cursor: leagueId === 'all' ? 'not-allowed' : 'pointer',
                                        outline: 'none',
                                        width: 'auto',
                                        opacity: leagueId === 'all' ? 0.6 : 1,
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Seasons</option>
                                    {seasons.map((season) => (
                                        <option key={season.id} value={season.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                                            {season.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <button
                                        ref={seasonFilterButtonRef}
                                        type="button"
                                        onClick={() => {
                                            if (leagueId !== 'all') {
                                                setSeasonDropdownOpen((prev) => !prev);
                                            }
                                        }}
                                        disabled={leagueId === 'all'}
                                        style={{
                                            height: '34px',
                                            padding: '0 30px 0 10px',
                                            marginLeft: 0,
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            border: '1.5px solid #e56a16',
                                            borderRadius: '24px',
                                            fontSize: '13px',
                                            cursor: leagueId === 'all' ? 'not-allowed' : 'pointer',
                                            outline: 'none',
                                            width: '100%',
                                            opacity: leagueId === 'all' ? 0.6 : 1,
                                            fontWeight: 600,
                                            textAlign: 'left',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {selectedSeason === 'all'
                                            ? 'All Seasons'
                                            : (seasons.find((season) => season.id === selectedSeason)?.name || 'All Seasons')}
                                    </button>
                                    <Menu
                                        anchorEl={seasonFilterButtonRef.current}
                                        open={seasonDropdownOpen && leagueId !== 'all'}
                                        onClose={() => setSeasonDropdownOpen(false)}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                        PaperProps={{
                                            sx: {
                                                mt: 0.5,
                                                borderRadius: 1,
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                backgroundColor: '#1a1a1a',
                                                width: seasonFilterButtonRef.current?.offsetWidth || 148,
                                                maxWidth: seasonFilterButtonRef.current?.offsetWidth || 148,
                                            }
                                        }}
                                        MenuListProps={{ sx: { py: 0 } }}
                                    >
                                        <MenuItem
                                            selected={selectedSeason === 'all'}
                                            onClick={() => {
                                                setSelectedSeason('all');
                                                setSeasonDropdownOpen(false);
                                            }}
                                            sx={{
                                                color: '#fff',
                                                fontSize: 13,
                                                minHeight: 34,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                '&.Mui-selected': { backgroundColor: '#2b66bd' },
                                                '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                                            }}
                                        >
                                            All Seasons
                                        </MenuItem>
                                        {seasons.map((season) => (
                                            <MenuItem
                                                key={season.id}
                                                selected={selectedSeason === season.id}
                                                onClick={() => {
                                                    setSelectedSeason(season.id);
                                                    setSeasonDropdownOpen(false);
                                                }}
                                                sx={{
                                                    color: '#fff',
                                                    fontSize: 13,
                                                    minHeight: 34,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    '&.Mui-selected': { backgroundColor: '#2b66bd' },
                                                    '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                                                }}
                                            >
                                                {season.name}
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                </>
                            )}
                            </div>

                            {/* Clear Button */}
                            <button
                                onClick={() => {
                                    dispatch(setYearFilter('all'));
                                    dispatch(setLeagueFilter('all'));
                                    setSearch('');
                                    setSelectedSeason('all');
                                    setSeasons([]);
                                    setTeammates([]);
                                    setSearchTriggered(false);
                                    setShowTeammatePanel(false);
                                    lastFetchKeyRef.current = '';
                                }}
                                style={{
                                    height: isMobile ? '34px' : '39px',
                                    padding: isMobile ? '0 13px' : '0 17px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    borderRadius: '24px',
                                    fontSize: isMobile ? '13px' : '17px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontWeight: 600,
                                    width: isDesktop ? 'auto' : '100%',
                                    minWidth: isDesktop ? '86px' : undefined,
                                }}
                            >
                                Clear
                            </button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
         
        <Container maxWidth={false} sx={{ bgcolor: '#383838', py: { xs: 2.2, md: 3 }, px: { xs: 1.3, sm: 2, md: 3.5 }, maxWidth: 1165, mx: 'auto', borderRadius: 2, mb: 5 }}>
            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2  }}>
                    <CircularProgress sx={{ color: TEAL_PRIMARY }} />
                    <Typography sx={{ color: '#fff', fontSize: 14 }}>Loading player stats...</Typography>
                </Box>
            ) : reduxError ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                    <Typography sx={{ color: '#ff6b6b', fontSize: 16, fontWeight: 700 }}>Error Loading Data</Typography>
                    <Typography sx={{ color: '#fff', fontSize: 14 }}>{reduxError}</Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => playerId && dispatch(fetchPlayerStats({ playerId, leagueId, year }))}
                        sx={{ background: TEAL_PRIMARY, '&:hover': { background: '#099968' } }}
                    >
                        Retry
                    </Button>
                </Box>
            ) : (
                <>
                    {/* Header: Player Profile */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: { xs: 'stretch', md: 'center' }, 
                        justifyContent: 'space-between',
                        mb: 3,
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: 2.2, md: 2 }
                    }}>
                        {/* Left: Avatar + Name + Position */}
                        <Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-start' }, gap: { xs: 1.3, sm: 2 }, width: { xs: '100%', md: 'auto' } }}>
                            <Avatar
                                src={fullPlayerData?.player?.avatar || '/assets/group451.png'}
                                alt={playerName}
                                sx={{
                                    width: { xs: 84, sm: 102, md: 125 },
                                    height: { xs: 84, sm: 102, md: 125 },
                                    // border: '3px solid ' + TEAL_PRIMARY,
                                }}
                            />
                            <Box sx={{ pt: 0, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography sx={{ 
                                        color: '#fff', 
                                        fontSize: { xs: 20, sm: 24, md: 27 }, 
                                        fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                                        fontWeight: 700,
                                        fontStyle: 'normal',
                                        lineHeight: '100%',
                                        letterSpacing: '0%',
                                        verticalAlign: 'middle',
                                        textTransform: 'uppercase',
                                        mt: { xs: 0.2, sm: 1.5, md: 2 },
                                        wordBreak: 'break-word'
                                    }}>
                                        {playerName.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
                                    <Typography sx={{ color: '#fff', fontSize: { xs: 13, sm: 14, md: 16 }, fontWeight: 700, textTransform: 'uppercase' }}>
                                        {playerPositionType}
                                    </Typography>
                                    <Box sx={{ fontSize: isMobile ? 28 : 35 }}>
                                        <XPStarMilestoneCard height={isMobile ? 28 : 35} width={isMobile ? 28 : 35} xp={xp} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Right: XP + Badges */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', md: 'flex-end' }, gap: 0, width: { xs: '100%', md: 'auto' } }}>
                            <Box sx={{ width: { xs: '100%', md: 'fit-content' }, maxWidth: '100%' }}>
                                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                                    <Typography sx={{ color: '#bdbdbd', fontSize: { xs: 11, sm: 12, md: 13 }, fontWeight: 600 }}>
                                        Total XP (All Leagues)
                                    </Typography>
                                    <Typography sx={{ color: '#8fd7c5', fontSize: { xs: 10, sm: 11 }, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.45 }}>
                                        XP Status
                                    </Typography>
                                </Box> */}
                                {/* Top row: XP + Status Title */}
                                <Box sx={{ display: 'flex', alignItems: 'stretch', gap: { xs: 1, md: 2 }, width: '100%' }}>
                                    <Paper sx={{ 
                                        bgcolor: '#383838', 
                                        color: '#fff', 
                                        px: { xs: 2.2, sm: 3.2, md: 4.3 }, 
                                        py: 0.1,
                                        borderRadius: 0,
                                        fontWeight: 400,
                                        fontSize: { xs: 14, sm: 16, md: 18 },
                                        border: '2px solid #fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        minWidth: { xs: 84, sm: 95, md: 100 },
                                        justifyContent: 'center'
                                    }}>
                                        {xpLoading ? '...' : xp.toLocaleString()}
                                    </Paper>
                                    <Paper sx={{ 
                                        bgcolor: xpStatusTier.cardColor, 
                                        color: xpStatusTextColor, 
                                        pl: { xs: 1, md: 1.5 },
                                        pr: { xs: 2, sm: 4, md: 10 },
                                        py: { xs: 0.6, md: 0.9 },
                                        borderRadius: 0,
                                        fontWeight: 700,
                                        fontSize: { xs: 12, sm: 14, md: 16 },
                                        minWidth: { xs: 120, sm: 140, md: 170 },
                                        flex: { xs: 1, md: '0 0 auto' },
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Typography sx={{ fontSize: { xs: 12, sm: 14, md: 16 }, fontWeight: 700, lineHeight: 1 }}>
                                                {xpStatusTier.title}
                                            </Typography>
                                            {xpStatusTier.isGoat && (
                                                <Box sx={{ position: 'relative', width: { xs: 18, sm: 20 }, height: { xs: 18, sm: 20 }, flexShrink: 0 }}>
                                                    <Image src={GoatImg} alt="GOAT tier" fill sizes="20px" style={{ objectFit: 'contain' }} />
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                </Box>
                                {/* Progress bar */}
                                <Box sx={{ width: '100%', display: 'flex', height: 6, borderRadius: 0, overflow: 'hidden', mt: 1 }}>
                                    <Box sx={{ 
                                        bgcolor: xpStatusTier.cardColor, 
                                        width: `${xpProgressToMax}%`, 
                                        height: '100%',
                                        transition: 'width 0.3s ease'
                                    }} />
                                    <Box sx={{ bgcolor: '#555', width: `${100 - xpProgressToMax}%`, height: '100%' }} />
                                </Box>
                                <Typography sx={{ color: '#a8a8a8', fontSize: 11, mt: 0.5, fontWeight: 500 }}>
                                    {xpLoading
                                        ? `0 / ${XP_STATUS_MAX_POINTS.toLocaleString()} XP`
                                        : `${Math.max(0, xp).toLocaleString()} / ${XP_STATUS_MAX_POINTS.toLocaleString()} XP (${xpProgressToMax}%)`}
                                </Typography>
                                {/* {!xpLoading && nextXpStatusTier && (
                                    <Typography sx={{ 
                                        color: '#999', 
                                        fontSize: 11, 
                                        mt: 0.25,
                                        fontWeight: 400 
                                    }}>
                                        {Math.max(0, nextXpStatusTier.minXP - Math.max(0, xp)).toLocaleString()} XP to {nextXpStatusTier.title}
                                    </Typography>
                                )} */}
                                {/* {!xpLoading && !nextXpStatusTier && (
                                    <Typography sx={{ color: '#d6c06a', fontSize: 11, mt: 0.25, fontWeight: 600 }}>
                                        MAX XP reached ({XP_STATUS_MAX_POINTS.toLocaleString()}+)
                                    </Typography>
                                )} */}
                                {/* {!xpLoading && xpRemainingToMax > 0 && (
                                    <Typography sx={{ color: '#8f8f8f', fontSize: 10.5, mt: 0.15, fontWeight: 400 }}>
                                        {xpRemainingToMax.toLocaleString()} XP remaining to max
                                    </Typography>
                                )} */}
                            </Box>
                            <Box
                                sx={{
                                    mt: 1.8,
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '0.9fr 1.1fr', sm: '0.85fr 1.15fr', md: 'repeat(2, minmax(0, 1fr))' },
                                    gap: { xs: 0.7, md: 0 },
                                    width: '100%',
                                    maxWidth: { xs: 520, md: 500 },
                                    mx: 'auto',
                                }}
                            >
                                {/* Stats Over Season button */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                                        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 10px 22px rgba(0,0,0,0.45)',
                                            borderColor: 'rgba(255,255,255,0.65)',
                                        },
                                        '&:hover .icon-box': { bgcolor: '#008c6b' },
                                        '&:hover .text-box': { bgcolor: '#2f2f2f' },
                                        width: { xs: '100%', md: '78%' },
                                        minWidth: 0,
                                        justifyContent: 'center',
                                        ml: { xs: 0, md: 6 }
                                    }}
                                    onClick={() => setStatsModalOpen(true)}
                                >
                                    <Box className="icon-box" sx={{ 
                                        bgcolor: '#00a77f', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: { xs: 38, sm: 40, md: 44 },
                                        borderRight: '1px solid rgba(255,255,255,0.25)',
                                        py: { xs: 0.55, md: 0.7 }
                                    }}>
                                        <BarChart sx={{ color: '#fff', fontSize: { xs: 20, md: 26 } }} />
                                    </Box>
                                    <Box className="text-box" sx={{ 
                                        bgcolor: '#2b2b2b', 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        justifyContent: { xs: 'center', md: 'flex-start' },
                                        px: { xs: 0.6, md: 0.9 },
                                        py: { xs: 0.55, md: 0.7 },
                                        width: '100%',
                                    }}>
                                        <Typography sx={{ 
                                            color: '#fff', 
                                            fontWeight: 700, 
                                            fontSize: { xs: 9, sm: 10, md: 11.5 }, 
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                                            lineHeight: 1.1,
                                            textAlign: 'center',
                                        }}>
                                            Stats Over Season
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Performance Dashboard button */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        cursor: currentUserId ? 'pointer' : 'not-allowed',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                                        opacity: currentUserId ? 1 : 0.6,
                                        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
                                        '&:hover': {
                                            transform: currentUserId ? 'translateY(-1px)' : 'none',
                                            boxShadow: currentUserId ? '0 10px 22px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.35)',
                                            borderColor: currentUserId ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.4)',
                                        },
                                        '&:hover .perf-icon-box': { bgcolor: currentUserId ? '#008c6b' : '#00a77f' },
                                        '&:hover .perf-text-box': { bgcolor: currentUserId ? '#2f2f2f' : '#2b2b2b' },
                                        width: '100%',
                                        maxWidth: { xs: '100%', md: 238 },
                                        minWidth: 0,
                                        justifyContent: 'center',
                                        justifySelf: { xs: 'stretch', md: 'start' },
                                    }}
                                    onClick={() => {
                                        if (!currentUserId) return;
                                        router.push(`/player/${currentUserId}/career`);
                                    }}
                                >
                                    <Box className="perf-icon-box" sx={{
                                        bgcolor: '#00a77f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: { xs: 38, sm: 40, md: 44 },
                                        borderRight: '1px solid rgba(255,255,255,0.25)',
                                        py: { xs: 0.55, md: 0.7 }
                                    }}>
                                        <SpaceDashboard sx={{ color: '#fff', fontSize: { xs: 24, md: 26 } }} />
                                    </Box>
                                    <Box className="perf-text-box" sx={{
                                        bgcolor: '#2b2b2b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: { xs: 'center', md: 'flex-start' },
                                        px: { xs: 0.6, md: 0.9 },
                                        py: { xs: 0.55, md: 0.7 },
                                        width: '100%',
                                    }}>
                                        <Typography sx={{
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: { xs: 9.5, sm: 10.5, md: 11.5 },
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                                            lineHeight: 1.1,
                                            textAlign: 'center',
                                        }}>
                                            Performance Dashboard
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Tabs Navigation */}
                    <Box sx={{ 
                        mb: 4,
                        display: 'flex',
                        flexWrap: 'nowrap',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        width: '100%',
                        gap: { xs: 0.6, md: 3 },
                        mt: { xs: 3.5, md: 7.5 },
                    }}>
                        {['current', 'career', 'trophies', 'rewards', 'history'].map(tab => (
                            <Box
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    pb: 1,
                                }}
                            >
                                <Typography 
                                    variant="inherit"
                                    sx={{
                                        color: '#fff',
                                        fontWeight: 500,
                                        fontSize: { xs: '11px !important', sm: '16px !important', md: '26px !important' },
                                        textTransform: 'capitalize',
                                        lineHeight: 1.15,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {tab === 'current' ? 'Current' : tab === 'career' ? (isMobile ? 'Career' : 'Career Stats') : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Typography>
                                {/* Underline Box */}
                                <Box sx={{
                                    width: { xs: '58%', md: '70%' },
                                    height: { xs: '3px', md: '6px' },
                                    bgcolor: activeTab === tab ? '#00a77f' : '#555',
                                    mt: 1,
                                    mx: 'auto',
                                }} />
                            </Box>
                        ))}
                    </Box>

                    {/* Stats Row */}
                    <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'flex-start' }}>
                        <Grid item xs={4} sm={4} md>
                            <StatItem
                                label="Matches"
                                value={activeTab === 'career' ? careerMatches.length : (leagueId === 'all' ? allMatches.length : currentLeagueMatches.length)}
                            />
                        </Grid>
                        <Grid item xs={4} sm={4} md>
                            <StatItem
                                label="Goals"
                                value={activeTab === 'career' ? careerTotals.goals : (leagueId === 'all' ? accumulativeTotals.goals : currentLeagueTotals.goals)}
                            />
                        </Grid>
                        <Grid item xs={4} sm={4} md>
                            <StatItem
                                label="Assists"
                                value={activeTab === 'career' ? careerTotals.assists : (leagueId === 'all' ? accumulativeTotals.assists : currentLeagueTotals.assists)}
                            />
                        </Grid>
                        <Grid item xs={4} sm={4} md>
                            <StatItem
                                label="MOTM"
                                value={activeTab === 'career' ? careerMotmVotesCount : (leagueId === 'all' ? careerMotmVotesCount : motmVotesCount)}
                            />
                        </Grid>
                        <Grid item xs={4} sm={4} md>
                            <StatItem
                                label="Defensive"
                                value={activeTab === 'career' ? careerDefensiveImpactCount : (leagueId === 'all' ? careerDefensiveImpactCount : defensiveImpactCount)}
                            />
                        </Grid>
                        <Grid item xs={4} sm={4} md>
                            <StatItem
                                label="Clean Sheet"
                                value={activeTab === 'career' ? careerTotals.cleanSheets : (leagueId === 'all' ? accumulativeTotals.cleanSheets : currentLeagueTotals.cleanSheets)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                                <Typography sx={{ color: '#c8c8c8', fontSize: 19, fontWeight: 500 }}>
                                    Total xp
                                </Typography>
                                <Typography sx={{ color: '#ffffff', fontSize: 18, fontWeight: 700 }}>
                                    {xpLoading ? '...' : `${Math.max(0, xp).toLocaleString()} XP`}
                                </Typography>
                                <Box sx={{ 
                                    width: '100%',
                                    height: 8, 
                                    bgcolor: '#444', 
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    mt: 0.5
                                }}>
                                    <Box sx={{ 
                                        height: '100%', 
                                        bgcolor: xpStatusTier.cardColor, 
                                        width: xpProgressToMax > 0 ? `max(${xpProgressToMax}%, 6px)` : '0%',
                                        transition: 'width 0.4s ease'
                                    }} />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Three Cards Section */}
                    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                        {/* Card 1: Trophies & Awards */}
                        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                            <Paper sx={{ 
                                bgcolor: CARD_BG, 
                                p: 2.5, 
                                // borderRadius: 2,
                                border: activeTab === 'trophies' ? `3px solid ${TEAL_PRIMARY}` : '1px solid #fff',
                                transition: 'border 0.3s ease',
                                height: '100%',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography sx={{ 
                                      color: '#fff', 
                                    fontSize: 18, 
                                    fontWeight: 600, 
                                    mb: 2,
                                    textAlign: 'center',
                                    mt: -1,
                                    fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                                    }}>
                                        Trophies & Awards
                                    </Typography>
                                    {/* <Box sx={{ 
                                        width: 180, 
                                        height: 3, 
                                        bgcolor: TEAL_PRIMARY, 
                                        mx: 'auto' 
                                    }} /> */}
                                </Box>
                                {trophiesLoading ? (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <CircularProgress size={24} sx={{ color: TEAL_PRIMARY }} />
                                    </Box>
                                ) : earnedTrophies.length === 0 ? (
                                    <Typography sx={{ color: '#999', textAlign: 'center', py: 3, fontSize: 13 }}>
                                        No trophies yet
                                    </Typography>
                                ) : (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap',
                                        justifyContent: 'flex-start',
                                        gap: 2
                                    }}>
                                        {earnedTrophies.map((t) => (
                                            <Box key={t.key} sx={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                alignItems: 'center', 
                                                gap: 0.5 
                                            }}>
                                                <Box sx={{ width: 65, height: 65, position: 'relative' }}>
                                                    <Image 
                                                        src={t.image} 
                                                        alt={t.label} 
                                                        width={65} 
                                                        height={65} 
                                                        style={{ 
                                                            objectFit: 'contain',
                                                            filter: t.label === 'Star Keeper' ? BLUE_FILTER : 'none'
                                                        }} 
                                                    />
                                                </Box>
                                                <Typography sx={{ 
                                                    color: '#fff', 
                                                    fontWeight: 700, 
                                                    fontSize: 16,
                                                    lineHeight: 1,
                                                    mb: -0.5,
                                                    ml: -0.2
                                                }}>
                                                    {t.count}
                                                </Typography>
                                                <Box sx={{ 
                                                    width: 10, 
                                                    height: 1.5, 
                                                    bgcolor: '#fff'
                                                }} />
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Card 2: Rewards XP */}
                        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                            <Paper sx={{ 
                                bgcolor: CARD_BG, 
                                p: 2.5, 
                                // borderRadius: 2,
                                border: activeTab === 'rewards' ? `3px solid ${TEAL_PRIMARY}` : '1px solid #fff',
                                transition: 'border 0.3s ease',
                                height: '100%',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Typography sx={{ 
                                    color: '#fff', 
                                    fontSize: 18, 
                                    fontWeight: 600, 
                                    mb: 2,
                                    textAlign: 'center',
                                    mt: -1,
                                    fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                                }}>
                                    Rewards XP
                                </Typography>
                                {badgesLoading ? (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <CircularProgress size={24} sx={{ color: TEAL_PRIMARY }} />
                                    </Box>
                                ) : playerBadges.length === 0 ? (
                                    <Typography sx={{ color: '#999', textAlign: 'center', py: 3, fontSize: 13 }}>
                                        No rewards earned yet
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {playerBadges.slice(0, 5).map((badge) => (
                                            <Box key={badge.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography sx={{ color: '#ccc', fontSize: 13 }}>
                                                    {badge.count}x {badge.title}
                                                </Typography>
                                                <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                                    {(badge.count * badge.xp).toLocaleString()}xp
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Card 3: History & Records */}
                        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                            <Paper sx={{ 
                                bgcolor: CARD_BG, 
                                p: 2.5, 
                                // borderRadius: 2,
                                border: activeTab === 'history' ? `3px solid ${TEAL_PRIMARY}` : '1px solid #fff',
                                transition: 'border 0.3s ease',
                                height: '100%',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Typography sx={{ 
                                   color: '#fff', 
                                    fontSize: 18, 
                                    fontWeight: 600, 
                                    mb: 2,
                                    textAlign: 'center',
                                    mt: -1,
                                    fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                                }}>
                                    History & Records
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative', pl: 2.5 }}>
                                    {/* Vertical line */}
                                    <Box sx={{ 
                                        position: 'absolute', 
                                        left: 4, 
                                        top: 8, 
                                        bottom: 8, 
                                        width: 2, 
                                        bgcolor: '#00a77f',
                                        borderRadius: 1,
                                    }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: '#00a77f' }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Longest Win Streak</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.longestWinStreak}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: '#00a77f' }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Most Goals In A League</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.mostGoalsInLeague}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: '#00a77f' }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Most MOTM In A League</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.mostMotmInLeague}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: '#00a77f' }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Largest Win Margin</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.longestWinMargin}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: '#00a77f' }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Highest XP In A League</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.highestXpInLeague.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Stats Over Season Modal */}
                    <Dialog 
                        open={statsModalOpen} 
                        onClose={() => setStatsModalOpen(false)}
                        fullWidth
                        scroll="paper"
                        maxWidth={false}
                        sx={{
                            '& .MuiDialog-container': {
                                alignItems: 'center',
                            },
                        }}
                        PaperProps={{
                            sx: {
                                bgcolor: '#e8e4e0',
                                borderRadius: { xs: '10px', sm: '8px' },
                                border: '2px solid #3a3a3a',
                                overflow: 'hidden',
                                width: { xs: 'calc(100% - 16px)', sm: '100%' },
                                maxWidth: '1020px',
                                m: { xs: 1, sm: 2 },
                                maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100dvh - 32px)' },
                                display: 'flex',
                                flexDirection: 'column',
                                height: 'auto',
                            }
                        }}
                    >
                        {/* Header bar */}
                        <DialogTitle sx={{ 
                            bgcolor: '#d9d9d9', 
                            color: '#000', 
                            py: { xs: 1.2, md: 1.45 },
                            px: { xs: 1.25, md: 2 },
                            pr: { xs: 5.5, md: 7 },
                            minHeight: 'auto',
                            position: 'relative',
                            borderBottom: '1px solid #bdb8b3',
                        }}>
                            {isMobile ? (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.95, minWidth: 0, pr: 4.4 }}>
                                    <Image
                                        src={TrofiiImg}
                                        alt="Trophy"
                                        width={18}
                                        height={18}
                                        style={{ objectFit: 'contain', marginTop: 2, filter: 'brightness(0) saturate(100%) invert(17%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)' }}
                                    />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, minWidth: 0 }}>
                                        <Typography sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.62px', color: '#222', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {currentLeagueName}
                                        </Typography>
                                        <Typography sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.58px', color: '#3d3d3d', lineHeight: 1.2 }}>
                                            {selectedSeason && selectedSeason !== 'all' ? 'SEASON STATS' : 'STATS OVER SEASONS'}
                                        </Typography>
                                        <Typography sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.55px', color: '#1f1f1f', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {playerName.toUpperCase()}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, minWidth: 0, pr: 6 }}>
                                    <Image
                                        src={TrofiiImg}
                                        alt="Trophy"
                                        width={28}
                                        height={28}
                                        style={{ objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(17%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)' }}
                                    />
                                    <Typography sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontWeight: 800, fontSize: 19, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#222', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '34%' }}>
                                        {currentLeagueName}
                                    </Typography>
                                    <Typography sx={{ color: '#777', fontSize: 18, lineHeight: 1 }}>|</Typography>
                                    <Typography sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontWeight: 700, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#3d3d3d', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                        {selectedSeason && selectedSeason !== 'all' ? 'SEASON STATS' : 'STATS OVER SEASONS'}
                                    </Typography>
                                    <Typography sx={{ color: '#777', fontSize: 18, lineHeight: 1 }}>|</Typography>
                                    <Typography sx={{ fontFamily: '"Woodford Bourne Pro", sans-serif', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.85px', color: '#1f1f1f', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '34%' }}>
                                        {playerName.toUpperCase()}
                                    </Typography>
                                </Box>
                            )}
                            <IconButton 
                                onClick={() => setStatsModalOpen(false)}
                                sx={{ color: '#555',  bgcolor: '#e6e6e6', borderRadius: '3px', '&:hover': { color: '#000', bgcolor: '#e6e6e6' }, position: 'absolute', right: { xs: 6, md: 10 }, top: { xs: 6, md: 7 } }}
                            >
                                <CloseIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ 
                            bgcolor: '#f2f2f2', 
                            px: { xs: 1.25, sm: 2.5, md: 5 }, 
                            py: { xs: 2, md: 4 },
                            flex: '0 1 auto',
                            minHeight: 0,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': {
                                width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                bgcolor: '#d5d0cb',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: '#999',
                                borderRadius: '3px',
                                '&:hover': {
                                    bgcolor: '#777',
                                }
                            }
                        }}>
                            {leagueId === 'all' ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography sx={{ color: '#777', fontSize: 14, mb: 1 }}>
                                        Please select a specific league to view season-wise stats.
                                    </Typography>
                                </Box>
                            ) : seasonWiseStats.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography sx={{ color: '#555', fontSize: 16, mb: 1 }}>
                                        No season to compare.
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {/* Tabs */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: { xs: 'flex-start', md: 'space-between' },
                                        mb: 1, 
                                        pt: { xs: 2.5, md: 6 },
                                        overflowX: 'auto',
                                        gap: { xs: 1.2, md: 0 },
                                        pb: 0.6,
                                        '&::-webkit-scrollbar': { height: 4 },
                                        '&::-webkit-scrollbar-thumb': { background: 'rgba(45,45,45,0.35)', borderRadius: 3 },
                                    }}>
                                        {[
                                            { key: 'goals', label: 'Goals' },
                                            { key: 'assists', label: 'Assists' },
                                            { key: 'motm', label: 'MOTM Votes' },
                                            { key: 'defensive', label: 'Cln Sht / Def' },
                                            { key: 'totalXP', label: 'Total XP' }
                                        ].map(tab => (
                                            <Box
                                                key={tab.key}
                                                onClick={() => setStatsModalTab(tab.key as any)}
                                                sx={{
                                                    flex: { xs: '0 0 auto', md: 1 },
                                                    display: 'flex',
                                                    justifyContent: 'start',
                                                    cursor: 'pointer',
                                                    pb: { xs: 1.2, md: 1.8 },
                                                }}
                                            >
                                                <Box sx={{
                                                    borderBottom: statsModalTab === tab.key ? `4px solid #00a77f` : '4px solid #c0bbb5',
                                                    transition: 'all 0.2s ease',
                                                    minWidth: { xs: '120px', md: '150px' },
                                                    textAlign: 'start',
                                                }}>
                                                    <Typography sx={{ 
                                                        color: statsModalTab === tab.key ? '#2d2d2d' : '#888',
                                                        fontWeight: statsModalTab === tab.key ? 800 : 600,
                                                        fontSize: { xs: 14, sm: 17, md: 21 },
                                                        whiteSpace: 'nowrap',
                                                        transition: 'color 0.2s ease'
                                                    }}>
                                                        {tab.label}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Stats Bars - auto-scaled with left border */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: { xs: 1.2, md: 2 },
                                        borderLeft: '3px solid #999',
                                        borderBottom: '3px solid #999',
                                        pl: 0,
                                        pb: 2,
                                    }}>
                                        {(() => {
                                            const getStatValue = (s: typeof seasonWiseStats[0]) => {
                                                switch(statsModalTab) {
                                                    case 'goals': return s.goals;
                                                    case 'assists': return s.assists;
                                                    case 'motm': return s.motmVotes;
                                                    case 'defensive': return s.defensiveImpact + s.cleanSheets;
                                                    case 'totalXP': return s.totalXP;
                                                    default: return 0;
                                                }
                                            };
                                            const maxValue = Math.max(...seasonWiseStats.map(getStatValue), 1);

                                            return seasonWiseStats.map((season) => {
                                                const value = getStatValue(season);
                                                const percentage = (value / maxValue) * 100;

                                                return (
                                                    <Box key={season.seasonId} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.1, md: 3 }, mx: { xs: 1, md: 3 } }}>
                                                        {/* Bar */}
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box sx={{ 
                                                                bgcolor: 'transparent', 
                                                                height: { xs: 34, md: 42 }, 
                                                                position: 'relative',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <Box sx={{ 
                                                                    bgcolor: value > 0 ? '#2d2d2d' : 'transparent', 
                                                                    height: '100%', 
                                                                    width: value > 0 ? `${Math.max(percentage, 10)}%` : '0%',
                                                                    transition: 'width 0.5s ease',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'flex-end',
                                                                    pr: { xs: 1.2, md: 2.5 }
                                                                }}>
                                                                    {value > 0 && (
                                                                        <Typography sx={{ 
                                                                            color: '#fff', 
                                                                            fontWeight: 700, 
                                                                            fontSize: { xs: 12, md: 16 } 
                                                                        }}>
                                                                            {statsModalTab === 'totalXP' ? value.toLocaleString() : value}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                                {value === 0 && (
                                                                    <Typography sx={{ 
                                                                        color: '#999', 
                                                                        fontWeight: 600, 
                                                                        fontSize: { xs: 12, md: 14 },
                                                                        position: 'absolute',
                                                                        left: 14,
                                                                        top: '50%',
                                                                        transform: 'translateY(-50%)'
                                                                    }}>
                                                                        0
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        
                                                        {/* Season Label */}
                                                        <Box sx={{ minWidth: { xs: 98, sm: 110, md: 145 }, textAlign: 'right' }}>
                                                            <Typography sx={{ 
                                                                color: '#2d2d2d', 
                                                                fontWeight: 700, 
                                                                fontSize: { xs: 11, md: 14 },
                                                                textTransform: 'uppercase',
                                                                lineHeight: 1.3,
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                SEASON {season.seasonNumber}
                                                            </Typography>
                                                            <Typography sx={{ 
                                                                color: '#666', 
                                                                fontSize: { xs: 10, md: 12 },
                                                                lineHeight: 1.3
                                                            }}>
                                                                {season.isFinished 
                                                                    ? `(${season.endDateFormatted})`
                                                                    : <span style={{ fontSize: 10 }}>(Not Finished)</span>
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                );
                                            });
                                        })()}
                                    </Box>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </Container>
        </Box>
    );
}
