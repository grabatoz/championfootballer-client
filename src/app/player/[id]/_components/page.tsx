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
} from '@mui/material';
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
import Image, { StaticImageData } from 'next/image';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { playerAPI } from '@/lib/api';
import FootballImg from '@/Components/images/football.png';
import GoatImg from '@/Components/images/goat.png';
import { BarChart } from '@mui/icons-material'; // Chart icon
import StarKeeperImg from '@/Components/images/brown.svg';
import SearchIcon from '@/Components/images/searchicon.png';

// Lazy load heavy components
const CloseButton = dynamic(() => import('@/Components/CloseButton'), {
  loading: () => <></>,
  ssr: false
});

// Colors & Gradients
const DARK_BG = '#383838';
const CARD_BG = '#272727';
const TEAL_PRIMARY = '#0bb77f';
const ORANGE_ACCENT = '#ff6b35';

// Add the blue filter constant
const BLUE_FILTER = 'invert(30%) sepia(98%) saturate(2000%) hue-rotate(201deg) brightness(92%) contrast(101%)';

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

// Calculate XP from stats (fallback approximation - assumes average win rate)
// Note: This is only used if the backend API fails. The actual calculation uses match-by-match data.
function calculateXP(stats: StatTotals): number {
    // Rough approximation: assume 50% win rate for averaged multipliers
    // Team bonus: ~18 per match (average of 30 win, 15 draw, 10 lose)
    // Goals: 2.5 avg (between 3 win, 2 lose)
    // Assists: 1.5 avg (between 2 win, 1 lose)
    // Clean Sheets: 5 (flat)
    // MOTM: 1.5 avg (between 2 win, 1 lose)
    // Impact: Removed from new system
    return (
        stats.goals * 2.5 +
        stats.assists * 1.5 +
        stats.cleanSheets * 5 +
        stats.motmVotes * 1.5
    );
}

export default function PlayerStatsPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const { token } = useAuth();

    const { data, filters, loading: reduxLoading, error: reduxError } = useSelector((state: RootState) => state.playerStats);
    const { leagueId, year } = filters;

    const { data: fullPlayerData } = useSelector((state: RootState) => state.playerStats);
    
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
    const [seasons, setSeasons] = useState<Array<{id: string, name: string}>>([]);
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
    const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
    const filtersInitialized = useRef(false);
    
    // Tab navigation state
    const [activeTab, setActiveTab] = useState('current');

    // Compute effective filters for each card based on active tab
    // Each card only uses 'all' when its specific tab is active (NOT on career tab)
    
    // Trophies card filters - only show all when trophies tab is active
    const effectiveTrophiesLeagueId = (activeTab === 'trophies') ? 'all' : (leagueId || 'all');
    const effectiveTrophiesYear = (activeTab === 'trophies') ? 'all' : (year || 'all');
    const effectiveTrophiesSeasonId = (activeTab === 'trophies') ? 'all' : (selectedSeason || 'all');
    
    // Rewards card filters - only show all when rewards tab is active
    const effectiveRewardsLeagueId = (activeTab === 'rewards') ? 'all' : (leagueId || 'all');
    const effectiveRewardsYear = (activeTab === 'rewards') ? 'all' : (year || 'all');
    const effectiveRewardsSeasonId = (activeTab === 'rewards') ? 'all' : (selectedSeason || 'all');
    
    // History card filters - only show all when history tab is active
    const effectiveHistoryLeagueId = (activeTab === 'history') ? 'all' : (leagueId || 'all');
    const effectiveHistoryYear = (activeTab === 'history') ? 'all' : (year || 'all');
    const effectiveHistorySeasonId = (activeTab === 'history') ? 'all' : (selectedSeason || 'all');

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
            return list.filter(l => hasMatches(l));
        }
        
        // Otherwise filter by specific year
        return list.filter(l =>
            hasMatches(l) &&
            (l.matches || []).some(m => dayjs(m.date).year().toString() === year)
        );
    }, [data, year]);

    // Populate seasons when league changes
    useEffect(() => {
        if (!leagueId || leagueId === 'all' || !token) {
            setSeasons([]);
            setSelectedSeason('all');
            return;
        }
        
        // First check if seasons are already in data
        const selectedLeagueData = leaguesForYear.find(l => l.id === leagueId);
        if (selectedLeagueData && (selectedLeagueData as any).seasons && (selectedLeagueData as any).seasons.length > 0) {
            setSeasons((selectedLeagueData as any).seasons);
            setSelectedSeason((selectedLeagueData as any).seasons[0].id);
            return;
        }
        
        // If not in data, fetch from backend
        const fetchSeasons = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const leagueData = await response.json();
                    const seasonsData = leagueData?.league?.seasons || leagueData?.seasons || [];
                    
                    if (Array.isArray(seasonsData) && seasonsData.length > 0) {
                        const formattedSeasons = seasonsData.map((s: any) => ({
                            id: s.id || s._id,
                            name: s.name || `Season ${s.seasonNumber || ''}`
                        }));
                        setSeasons(formattedSeasons);
                        setSelectedSeason(formattedSeasons[0].id);
                    } else {
                        setSeasons([]);
                        setSelectedSeason('all');
                    }
                } else {
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
    }, [leagueId, leaguesForYear, token]);

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
        if (!leagueId) return;

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

            // Handle "All Leagues" case - aggregate from all leagues
            if (leagueId === 'all') {
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
    }, [token, playerId, leagueId, teammates.length, searchTriggered, leaguesForYear]);

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
        const matches = (data?.leagues || []).flatMap((l) => (hasMatches(l) ? l.matches ?? [] : []));
        console.log('📊 All matches data:', {
            totalMatches: matches.length,
            sampleMatch: matches[0],
            leaguesCount: data?.leagues?.length || 0
        });
        return matches;
    }, [data]);

    const currentLeagueMatches = useMemo<LeagueMatch[]>(() => {
        const leaguesList: LeagueWithMatchesTyped[] = (data?.leagues as LeagueWithMatchesTyped[] | undefined) ?? [];
        if (!leaguesList.length) return [];

        if (leagueId && leagueId !== 'all') {
            const l = leaguesList.find((x: LeagueWithMatchesTyped) => x.id === leagueId);
            let matches = hasMatches(l) ? l.matches ?? [] : [];
            
            // Apply season filter if selected
            if (selectedSeason && selectedSeason !== 'all') {
                matches = matches.filter(m => (m as any).seasonId === selectedSeason);
                console.log('⚽ [Stats] Filtered by season:', selectedSeason, '| Matches:', matches.length);
            }
            
            return matches;
        }

        const first = leaguesList[0];
        return hasMatches(first) ? first.matches ?? [] : [];
    }, [data, leagueId, selectedSeason]);

    const accumulativeTotals = useMemo(() => sumStatsFromMatches(allMatches), [allMatches]);
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
        const count = allMatches.reduce((acc, match) => {
            const votes = (match as any).votes || [];
            const votesForPlayer = votes.filter((vote: any) => 
                String(vote.votedForId) === String(playerId)
            ).length;
            return acc + votesForPlayer;
        }, 0);
        console.log('✅ Total Career MOTM votes for player:', count);
        return count;
    }, [allMatches, playerId]);

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
        const count = allMatches.filter(match => {
            const m = match as any;
            return m.homeDefensiveImpactId === playerId || m.awayDefensiveImpactId === playerId;
        }).length;
        console.log('✅ Total Career defensive impact count:', count);
        return count;
    }, [allMatches, playerId]);

    // Calculate Win Ratio - Current League
    const currentWinRatio = useMemo(() => {
        if (currentLeagueMatches.length === 0) return 0;
        const wins = currentLeagueMatches.filter(match => {
            const m = match as any;
            const playerTeam = m.homeTeam?.players?.some((p: any) => p.id === playerId || p._id === playerId) ? 'home' : 'away';
            return playerTeam === 'home' ? (m.homeScore > m.awayScore) : (m.awayScore > m.homeScore);
        }).length;
        return Math.round((wins / currentLeagueMatches.length) * 100);
    }, [currentLeagueMatches, playerId]);

    // Calculate Win Ratio - Career (All Matches)
    const careerWinRatio = useMemo(() => {
        if (allMatches.length === 0) return 0;
        const wins = allMatches.filter(match => {
            const m = match as any;
            const playerTeam = m.homeTeam?.players?.some((p: any) => p.id === playerId || p._id === playerId) ? 'home' : 'away';
            return playerTeam === 'home' ? (m.homeScore > m.awayScore) : (m.awayScore > m.homeScore);
        }).length;
        return Math.round((wins / allMatches.length) * 100);
    }, [allMatches, playerId]);

    // Backend-driven XP (totalXP) with safe fallback
    const [xp, setXp] = useState<number>(0);
    const [xpLoading, setXpLoading] = useState<boolean>(false);

    const fallbackXP = useMemo(() => {
        // old local calculation if API fails
        return leagueId === 'all' ? calculateXP(accumulativeTotals) : calculateXP(currentLeagueTotals);
    }, [leagueId, accumulativeTotals, currentLeagueTotals]);

    useEffect(() => {
        if (!playerId) return;
        let cancelled = false;
        const lid = leagueId || 'all';
        const y = year || 'all';
        setXpLoading(true);
        playerAPI
            .getPlayerXP(String(playerId), String(lid), String(y))
            .then((res) => {
                if (cancelled) return;
                if (res.success && res.data) {
                    setXp(res.data.totalXP ?? 0);
                } else {
                    setXp(fallbackXP);
                }
            })
            .catch(() => {
                if (cancelled) return;
                setXp(fallbackXP);
            })
            .finally(() => {
                if (!cancelled) setXpLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [playerId, leagueId, year, fallbackXP]);

    const yearsOptions = useMemo(() => {
        const nowYear = dayjs().year();
        const arr = ['all', ...Array.from({ length: 12 }, (_, i) => String(nowYear - i))];
        return arr;
    }, []);

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

    // On initial load, set default filters to 'all' if not already set
    useEffect(() => {
        if (!data || filtersInitialized.current) return;
        
        // Only set defaults once on first load
        if (!year) {
            dispatch(setYearFilter('all'));
        }
        if (!leagueId) {
            dispatch(setLeagueFilter('all'));
        }
        
        filtersInitialized.current = true;
    }, [data, year, leagueId, dispatch]);

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

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setYearDropdownOpen(false);

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

    const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLeagueDropdownOpen(false);
        dispatch(setLeagueFilter(e.target.value));
    };

    const currentLeagueName =
        leagueId && leagueId !== 'all'
            ? data?.leagues?.find((l: LeagueWithMatchesTyped) => l.id === leagueId)?.name || 'Current League'
            : data?.leagues?.[0]?.name || 'Current League';

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
        // Fetch trophies whenever effective filters change or tab changes
        if (!playerId) return;
        let cancelled = false;
        setTrophiesLoading(true);
        
        console.log('🏆 [Trophies] Fetching with filters:', { 
            playerId, 
            leagueId: effectiveTrophiesLeagueId, 
            year: effectiveTrophiesYear,
            selectedSeason: effectiveTrophiesSeasonId,
            activeTab
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
    }, [playerId, effectiveTrophiesLeagueId, effectiveTrophiesYear, effectiveTrophiesSeasonId, localCounts, activeTab]);

    // Fetch player badges/achievements
    useEffect(() => {
        console.log('🔥 [BADGES] useEffect triggered!', { playerId, hasToken: !!token, leagueId, year, selectedSeason });
        
        // Fetch badges whenever effective filters change or tab changes
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
        console.log('🔄 [BADGES] Starting badge fetch with filters:', { leagueId: effectiveRewardsLeagueId, year: effectiveRewardsYear, selectedSeason: effectiveRewardsSeasonId, activeTab });
        
        // Build query params for effective filters
        const params = new URLSearchParams();
        if (effectiveRewardsLeagueId && effectiveRewardsLeagueId !== 'all') params.append('leagueId', effectiveRewardsLeagueId);
        if (effectiveRewardsYear && effectiveRewardsYear !== 'all') params.append('year', effectiveRewardsYear);
        if (effectiveRewardsSeasonId && effectiveRewardsSeasonId !== 'all') params.append('seasonId', effectiveRewardsSeasonId);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        // Try multiple endpoints
        const endpoints = [
            `${process.env.NEXT_PUBLIC_API_URL}/users/${playerId}/achievements${queryString}`,
            `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/achievements${queryString}`,
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
    }, [playerId, token, effectiveRewardsLeagueId, effectiveRewardsYear, effectiveRewardsSeasonId, activeTab]);

    // Fetch history records from backend with filters
    useEffect(() => {
        // Fetch history whenever effective filters change or tab changes
        if (!playerId) return;
        let cancelled = false;
        setHistoryRecordsLoading(true);
        
        console.log('🔍 [History Records] Fetching with filters:', { 
            playerId, 
            leagueId: effectiveHistoryLeagueId, 
            year: effectiveHistoryYear, 
            selectedSeason: effectiveHistorySeasonId,
            activeTab
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
    }, [playerId, effectiveHistoryLeagueId, effectiveHistoryYear, effectiveHistorySeasonId, activeTab]);

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
            <Typography sx={{ color: '#c8c8c8', fontSize: 19, fontWeight: 600}}>
                {label}
            </Typography>
            <Typography sx={{ color: '#ffffff', fontSize: 18, fontWeight: 700 }}>
                {value ?? 0}
            </Typography>
        </Box>
    );

    const loading = reduxLoading || !data;

    return (
        <Box sx={{ minHeight: '100vh', color: '#fff' }}>
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
                width: '99.4vw',
                position: 'relative',
                left: '50%',
                right: '50%',
                marginLeft: '-50vw',
                marginRight: '-50vw',
                background: '#0e0e0e',
            }}>
                <Paper sx={{
                    px: 0,
                    py: { xs: 4, md: 3.1 },
                    background: '#0e0e0e',
                    color: 'white',
                    boxShadow: 'none',
                }}>
                    {/* Centered Title */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pt: { xs: 2, md: 2 },
                        pb: 2,
                    }}>
                        <Typography 
                            variant="h2" 
                            component="h1" 
                            sx={{ 
                                fontWeight: 'bold', 
                                color: '#fff', 
                                fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' }, 
                                textTransform: 'uppercase',
                                letterSpacing: 4,
                                textAlign: 'center',
                            }}
                        >
                            PLAYER STATS
                        </Typography>
                    </Box>

                    {/* Orange divider under header */}
                    <Box sx={{ height: 3, bgcolor: 'rgba(229,106,22,0.9)', mt: 4.5 }} />

                    {/* Search and Filters Section */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: { xs: 2, md: 3 },
                        px: { xs: 3, md: 7 },
                        py: { xs: 1.5, md: 1.3 },
                        maxWidth: '1200px',
                        mx: 'auto',
                    }}>
                        {/* Search Input */}
                        <TextField
                            variant="outlined"
                            placeholder="Search player name and hit enter..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{
                                width: { xs: '100%', md: '420px' },
                                ml: { xs: 0, md: 0.8 },
                                '& .MuiOutlinedInput-root': {
                                    height: 42,
                                    color: 'white',
                                    backgroundColor: 'transparent',
                                    borderRadius: '3px',
                                    '& fieldset': { borderColor: '#e56a16', borderWidth: 1.5 },
                                    '&:hover fieldset': { borderColor: '#e56a16' },
                                    '&.Mui-focused fieldset': { borderColor: '#e56a16' }
                                },
                                '& .MuiInputBase-input': { 
                                    color: 'white', 
                                    fontSize: 16.5,
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

                        {/* Filter Buttons */}
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {/* Year Filter */}
                            <div className={`filter-select-wrapper${yearDropdownOpen ? ' open' : ''}`}>
                            <select
                                className="filter-select"
                                value={year || 'all'}
                                onChange={handleYearSelect}
                                onMouseDown={() => setYearDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setYearDropdownOpen(false), 100)}
                                style={{
                                    height: '39px',
                                    padding: '0 36px 0 12px',
                                    marginLeft: '4px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '1.5px solid #e56a16',
                                    borderRadius: '24px',
                                    fontSize: '17px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '100px',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Years</option>
                                {yearsOptions.filter(y => y !== 'all').map(y => (
                                    <option key={y} value={y} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{y}</option>
                                ))}
                            </select>
                            </div>

                            {/* League Filter */}
                            <div className={`filter-select-wrapper${leagueDropdownOpen ? ' open' : ''}`}>
                            <select
                                className="filter-select"
                                value={leagueId || 'all'}
                                onChange={handleLeagueChange}
                                onMouseDown={() => setLeagueDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setLeagueDropdownOpen(false), 100)}
                                style={{
                                    height: '39px',
                                    padding: '0 36px 0 12px',
                                    marginLeft: '4px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '1.5px solid #e56a16',
                                    borderRadius: '24px',
                                    fontSize: '17px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '110px',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Leagues</option>
                                {(leaguesForYear || []).map((l: LeagueWithMatchesTyped) => (
                                    <option key={l.id} value={l.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{l.name}</option>
                                ))}
                            </select>
                            </div>

                            {/* Season Filter */}
                            <div className={`filter-select-wrapper${seasonDropdownOpen ? ' open' : ''}`}>
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
                                    marginLeft: '4px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '1.5px solid #e56a16',
                                    borderRadius: '24px',
                                    fontSize: '17px',
                                    cursor: leagueId === 'all' ? 'not-allowed' : 'pointer',
                                    outline: 'none',
                                    minWidth: '110px',
                                    opacity: leagueId === 'all' ? 0.6 : 1,
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Seasons</option>
                                {seasons.map((season) => (
                                    <option key={season.id} value={season.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                                        {season.name}
                                    </option>
                                ))}
                            </select>
                            </div>

                            {/* Clear Button */}
                            <button
                                onClick={() => {
                                    dispatch(setYearFilter('all'));
                                    dispatch(setLeagueFilter('all'));
                                    setSearch('');
                                    setSelectedSeason('all');
                                    setSeasons([]);
                                }}
                                style={{
                                    height: '39px',
                                    padding: '0 17px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    borderRadius: '24px',
                                    fontSize: '17px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Clear
                            </button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
         
        <Container maxWidth={false} sx={{ bgcolor: '#383838', py: 3, maxWidth: 1100, mx: 'auto' }}>
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
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        {/* Left: Avatar + Name + Position */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar
                                src={fullPlayerData?.player?.avatar || '/assets/group451.png'}
                                alt={playerName}
                                sx={{
                                    width: 125,
                                    height: 125,
                                    // border: '3px solid ' + TEAL_PRIMARY,
                                }}
                            />
                            <Box sx={{ pt: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography sx={{ 
                                        color: '#fff', 
                                        fontSize: 27, 
                                        fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                                        fontWeight: 700,
                                        fontStyle: 'normal',
                                        lineHeight: '100%',
                                        letterSpacing: '0%',
                                        verticalAlign: 'middle',
                                        textTransform: 'uppercase'
                                    }}>
                                        {playerName.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
                                    <Typography sx={{ color: '#fff', fontSize: 16, fontWeight: 700, textTransform: 'uppercase' }}>
                                        {playerPositionType}
                                    </Typography>
                                    <Box sx={{ color: TEAL_PRIMARY, fontSize: 35 }}>★</Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Right: XP + Badges */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                            {/* Top row: XP + Rising Star */}
                            <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
                                <Paper sx={{ 
                                    bgcolor: '#383838', 
                                    color: '#fff', 
                                    px: 4.3, 
                                    py: 0.1,
                                    borderRadius: 0,
                                    fontWeight: 400,
                                    fontSize: 18,
                                    border: '2px solid #fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: 80,
                                    justifyContent: 'center'
                                }}>
                                    {xpLoading ? '…' : xp.toLocaleString()}
                                </Paper>
                                <Paper sx={{ 
                                    bgcolor: '#ffffff', 
                                    color: '#000000', 
                                    pl: 1.5,
                                    pr: 10,
                                    py: 0.9,
                                    borderRadius: 0,
                                    fontWeight: 400,
                                    fontSize: 16,
                                    // border: '2px solid #555',
                                    minWidth: 140
                                }}>
                                    Rising Star
                                </Paper>
                            </Box>
                            {/* Progress bar */}
                            <Box sx={{ width: '100%', display: 'flex', height: 6, borderRadius: 0, overflow: 'hidden' , mt:1}}>
                                <Box sx={{ bgcolor: ORANGE_ACCENT, width: '30%', height: '100%' }} />
                                <Box sx={{ bgcolor: '#555', width: '70%', height: '100%' }} />
                            </Box>
                            {/* Stats Over Season button */}
                            <Box
                                sx={{
                                    mt: 2,
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    '&:hover .icon-box': { bgcolor: '#099968' },
                                    '&:hover .text-box': { bgcolor: '#333' },
                                    border: '1.5px solid #fff',
                                }}
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    if (leagueId && leagueId !== 'all') params.set('leagueId', leagueId);
                                    if (year && year !== 'all') params.set('year', year);
                                    const query = params.toString();
                                    router.push(`/player/${playerId}/career${query ? `?${query}` : ''}`);
                                }}
                            >
                                <Box className="icon-box" sx={{ 
                                    bgcolor: TEAL_PRIMARY, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    px: 1.2,
                                    py: 0.2
                                }}>
                                    <BarChart sx={{ color: '#fff', fontSize: 30 }} />
                                </Box>
                                <Box className="text-box" sx={{ 
                                    bgcolor: '#444', 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    px: 1.3,
                                    py: 0.8
                                }}>
                                    <Typography sx={{ 
                                        color: '#fff', 
                                        fontWeight: 600, 
                                        fontSize: 12, 
                                        textTransform: 'uppercase' 
                                    }}>
                                        Stats Over Season
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Tabs Navigation */}
                    <Box sx={{ 
                        mb: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: 3,
                        mt:7.5
                    }}>
                        {['current', 'career', 'trophies', 'rewards', 'history'].map(tab => (
                            <Box
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                sx={{
                                    flex: 1,
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    pb: 1,
                                }}
                            >
                                <Typography 
                                    variant="inherit"
                                    sx={{
                                        color: '#fff',
                                        fontWeight: 500,
                                        fontSize: '26px !important',
                                        textTransform: 'capitalize',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {tab === 'current' ? 'Current' : tab === 'career' ? 'Career Stats' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Typography>
                                {/* Underline Box */}
                                <Box sx={{
                                    width: '70%',
                                    height: '6px',
                                    bgcolor: activeTab === tab ? TEAL_PRIMARY : '#555',
                                    mt: 1,
                                }} />
                            </Box>
                        ))}
                    </Box>

                    {/* Stats Row */}
                    <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'flex-start' }}>
                        <Grid item xs={6} sm={4} md>
                            <StatItem label="Matches" value={activeTab === 'career' ? allMatches.length : currentLeagueMatches.length} />
                        </Grid>
                        <Grid item xs={6} sm={4} md>
                            <StatItem label="Goals" value={activeTab === 'career' ? accumulativeTotals.goals : currentLeagueTotals.goals} />
                        </Grid>
                        <Grid item xs={6} sm={4} md>
                            <StatItem label="Assists" value={activeTab === 'career' ? accumulativeTotals.assists : currentLeagueTotals.assists} />
                        </Grid>
                        <Grid item xs={6} sm={4} md>
                            <StatItem label="MOTM" value={activeTab === 'career' ? careerMotmVotesCount : motmVotesCount} />
                        </Grid>
                        <Grid item xs={6} sm={4} md>
                            <StatItem label="Defensive" value={activeTab === 'career' ? careerDefensiveImpactCount : defensiveImpactCount} />
                        </Grid>
                        <Grid item xs={6} sm={4} md>
                            <StatItem label="Clean Sheet" value={activeTab === 'career' ? accumulativeTotals.cleanSheets : currentLeagueTotals.cleanSheets} />
                        </Grid>
                        <Grid item xs={6} sm={4} md>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                                <Typography sx={{ color: '#c8c8c8', fontSize: 19, fontWeight: 500 }}>
                                    Win Ratio
                                </Typography>
                                <Box sx={{ 
                                    width: '100%',
                                    height: 8, 
                                    bgcolor: '#444', 
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    mt: 1
                                }}>
                                    <Box sx={{ 
                                        height: '100%', 
                                        bgcolor: TEAL_PRIMARY, 
                                        width: `${activeTab === 'career' ? careerWinRatio : currentWinRatio}%` 
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
                                borderRadius: 2,
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
                                borderRadius: 2,
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
                                borderRadius: 2,
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
                                        bgcolor: '#444',
                                        borderRadius: 1,
                                    }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: TEAL_PRIMARY }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Longest Win Streak</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.longestWinStreak}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: TEAL_PRIMARY }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Most Goals In A League</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.mostGoalsInLeague}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: TEAL_PRIMARY }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Most MOTM In A League</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.mostMotmInLeague}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: TEAL_PRIMARY }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Largest Win Margin</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.longestWinMargin}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <Box sx={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', bgcolor: TEAL_PRIMARY }} />
                                        <Typography sx={{ color: '#ccc', fontSize: 13 }}>Highest XP In A League</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            {historyRecords.highestXpInLeague.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Container>
        </Box>
    );
}
