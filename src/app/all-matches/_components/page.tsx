'use client';
import { Box, Button, Container, Typography, Paper, MenuItem, Divider, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, CircularProgress, Menu, ListItemIcon, ListItemText, Tooltip, Chip, Alert } from '@mui/material';
import { Calendar, ChevronDown, Crown, Edit, Trash2, Trophy, Undo2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import homeTeamIcon from '@/Components/images/matches.png';
import awayTeamIcon from '@/Components/images/2nd champion icon football.png';
import HomeTeamImage from '@/Components/images/hometeamshirt.png';
import AwayTeamImage from '@/Components/images/awayteamshirt.png';
import FootBallIcon from '@/Components/images/cardfootball.png';
import CardStar from '@/Components/images/cardstar.png';
import CalendarImg from '@/Components/images/cardcalendar.png';
import ClockImg from '@/Components/images/cardclock.png';
import LocationImg from '@/Components/images/cardlocation.png';
import ViewTeamImg from '@/Components/images/cardviewteam.png';
import RESULTS from '@/Components/images/cardresult.png';
import ADDSTATS from '@/Components/images/cardstats.png';
import { Card, CardContent } from '@mui/material';
import Link from 'next/link';
import { cacheManager } from "@/lib/cacheManager"
import { LeaderboardResponse } from '@/types/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import CloseIcon from '@mui/icons-material/Close';
import { optimizedFetch } from '@/lib/utils/optimizedFetch';
import { mutateWithRefresh } from '@/lib/utils/cacheManager';

// Lazy load heavy components
const PlayerCard = dynamic(() => import('@/Components/playercard/playercard'), {
  loading: () => <CircularProgress size={24} />,
  ssr: false
});

const PlayMatchPagee = dynamic(() => import('@/Components/matchstatsdialog/MatchStatsDialog'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const PlayerStatsDialog = dynamic(() => import('@/Components/PlayerStatsDialog'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const TeamPreviewScreen = dynamic(() => import('@/Components/viewteam/viewteam'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const EditMatchPage = dynamic(() => import('@/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const MatchDetailsPage = dynamic(() => import('@/app/match/[matchId]/_components'), {
  loading: () => <CircularProgress />,
  ssr: false
});

type PlayerStatsMetric = keyof LeaderboardResponse['players'][number];


interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    matchTime: string;
    date: string;
    location?: string;
    availablePlayers: number;
    pendingPlayers: number;
    status: string;
    leagueId: string;
    league?: {
        id: string;
        name: string;
    };
    homeTeamName?: string;
    awayTeamName?: string;
    homeTeamUsers?: User[];
    awayTeamUsers?: User[];
    availableUsers?: User[];
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    end?: string;
    start?: string | Date;
    updatedAt?: string | Date;
    createdAt?: string | Date;
    homeTeamImage?: string;
    awayTeamImage?: string;
    archived?: boolean;
    active?: boolean;
}

type LeagueComputedStatus = {
    isComplete?: boolean;
    locked?: boolean;
    matchesPlayed?: number;
    gamesPlayed?: number;
    maxGames?: number;
    totalMatches?: number;
    missing?: Array<unknown>;
    [key: string]: unknown;
};

interface League {
    id: string;
    name: string;
    members?: User[];
    administrators?: { id: string }[];
    active?: boolean;
    archived?: boolean;
    matches?: Match[];
    computedStatus?: LeagueComputedStatus;
    isLocked?: boolean;
    isComplete?: boolean;
    isCompleted?: boolean;
    updatedAt?: string;
    createdAt?: string;
    status?: string;
    maxGames?: number;
}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    age?: number | string;
    password?: string;
    gender?: string;
    level?: string;
    joinedLeagues?: League[];
    managedLeagues?: League[];
    homeTeamMatches?: Match[];
    awayTeamMatches?: Match[];
    availableMatches?: Match[];
    guestMatch?: Match | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    position?: string;
    style?: string;
    preferredFoot?: string;
    shirtNumber?: string;
    profilePicture?: string | null;
    positionType: string;
    skills?: Skills;
    xp?: number;
}

interface Skills {
    dribbling: number;
    shooting: number;
    passing: number;
    pace: number;
    defending: number;
    physical: number;
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

const LOCATION_PREVIEW_LIMIT = 45;
const formatLocationForCard = (location?: string): string => {
    if (!location) return '';
    const normalized = location.trim();
    return normalized.length > LOCATION_PREVIEW_LIMIT
        ? `${normalized.slice(0, LOCATION_PREVIEW_LIMIT)}..`
        : normalized;
};

export default function AllMatches() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<string>('all');
    const [matchFilter, setMatchFilter] = useState<'all' | 'results' | 'fixtures'>('all');
    const [loading, setLoading] = useState(true);
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    console.log('selectedMatch', selectedMatch)
    const { token, user } = useAuth();
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [key: string]: boolean }>({});
    const router = useRouter();
    
    // Persist selection key - same as home page
    const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';
    // Helper: determine if a league is completed (exclude from dropdown)
    const leagueIsCompleted = useCallback((l: League): boolean => {
        // Prefer backend-computed season-based completion status
        if (l?.computedStatus?.isCompleted === true) return true;
        if (l?.archived === true) return true;

        // If there are any missing items (e.g., pending stats), do NOT treat as completed
        const missingArr = Array.isArray(l?.computedStatus?.missing) ? l.computedStatus!.missing! : [];
        if (missingArr.length > 0) return false;

        // If we have counters, prefer them to decide completion:
        // require matchesPlayed >= maxGames when maxGames is provided (> 0)
        const toNum = (v: unknown): number | undefined => {
            const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
            return Number.isFinite(n) ? n : undefined;
        };
        const playedFromComputed = toNum(l?.computedStatus?.matchesPlayed) ?? toNum(l?.computedStatus?.gamesPlayed);
        const playedFromList = undefined; // not available reliably here
        const played = playedFromComputed ?? playedFromList;
        const maxG = toNum(l?.computedStatus?.maxGames) ?? toNum(l?.maxGames);

        // Ported logic from All Leagues: derive completion from matches list when available
        if (Array.isArray(l.matches)) {
            const matches = l.matches ?? [];
            const completedCount = matches.reduce((acc, m) => {
                const status = typeof m.status === 'string' ? m.status.toLowerCase() : '';
                const endedByStatus = status === 'completed' || status === 'finished' || status === 'ended';
                const endedByFlag = m.active === false;
                const endedByEnd = Boolean(m.end);
                return acc + (endedByStatus || endedByFlag || endedByEnd ? 1 : 0);
            }, 0);
            if (typeof maxG === 'number' && maxG > 0) {
                if (completedCount < maxG) return false; // not complete yet
                // completed by matches threshold -> consider complete (missing already checked above)
                return true;
            }
        }

        if (typeof maxG === 'number' && maxG > 0 && typeof played === 'number') {
            if (played < maxG) {
                // Even if backend flags it completed/locked, do NOT treat as completed until maxGames reached
                return false;
            }
            // Counters meet threshold and missing is empty -> complete
            return true;
        }

        // Primary: explicit completion flags coming from backend
        if (l?.computedStatus?.isComplete === true) return true;
        if (l?.computedStatus?.locked === true) return true;
        if (l?.isComplete === true) return true;
        if (l?.isCompleted === true) return true;
        if (l?.isLocked === true) return true;

        // Backward-compat: infer completion from status/active when flags are absent
        const sRaw = (l?.status ?? '').toString();
        const s = sRaw.trim().toUpperCase();
        const completionStatuses = new Set([
            'RESULT_PUBLISHED',
            'RESULT_UPLOADED',
            'RESULT_COMPLETE',
            'RESULT_FINISHED',
            'RESULT_ENDED',
            'RESULT_DONE',
            'COMPLETED'
        ]);
        if (completionStatuses.has(s)) return true;
        if (typeof l?.active === 'boolean' && l.active === false) return true;
        return false;
    }, []);

    const fetchLeagues = useCallback(async () => {
        try {
            // 🚀 Use optimizedFetch with 3-minute cache for auth status
            const data = await optimizedFetch<any>(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                cacheTTL: 180000 // 3 minutes TTL
            });
            if (data.success && data.user) {
                // Get admin league IDs
                const adminLeaguesArr = (data.user.adminLeagues || data.user.administeredLeagues || []) as Array<{ id?: string | number }>;
                // const adminLeagueIds = new Set<string>(
                //     adminLeaguesArr
                //         .map((l) => String(l?.id))
                //         .filter((id) => id !== 'undefined')
                // );

                // Get member league IDs
                // const memberLeagueIds = new Set<string>(
                //     ((data.user.leagues || []) as Array<{ id?: string | number }>)
                //         .map((l) => String(l?.id))
                //         .filter((id) => id !== 'undefined')
                // );

                // Combine joined and managed leagues
                const userLeagues = [
                    ...(data.user.leagues || []),
                    ...adminLeaguesArr
                ];

                // Remove duplicates
                const uniqueLeaguesMap = new Map();
                userLeagues.forEach(league => {
                    const id = String((league as { id?: string | number }).id);
                    if (!uniqueLeaguesMap.has(id)) {
                        uniqueLeaguesMap.set(id, league);
                    }
                });

                // Fetch detailed info for all leagues to get administrators, members, and computed status
                const detailedLeagues = await Promise.all(
                    Array.from(uniqueLeaguesMap.values()).map(async (league) => {
                        try {
                            const leagueId = String((league as { id?: string | number }).id);

                            // 🚀 Use optimizedFetch with 5-minute cache for league details
                            const [statusRes, leagueResponse] = await Promise.all([
                                optimizedFetch<any>(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/status`, {
                                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                    cacheTTL: 300000 // 5 minutes
                                }).catch(() => null),
                                optimizedFetch<any>(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                    cacheTTL: 300000 // 5 minutes
                                })
                            ]);

                            let matchesFromDetails: Match[] | undefined = undefined;
                            let maxGamesFromDetails: number | undefined = undefined;
                            let enrichedLeague = { ...league };

                            // optimizedFetch returns JSON directly
                            if (leagueResponse?.success && leagueResponse?.league) {
                                enrichedLeague = {
                                    ...league,
                                    administrators: leagueResponse.league.administrators,
                                    members: leagueResponse.league.members
                                    };
                                    const rawMatches = leagueResponse.league.matches as unknown;
                                    if (Array.isArray(rawMatches)) {
                                        matchesFromDetails = rawMatches as Match[];
                                    }
                                    if (typeof leagueResponse.league.maxGames === 'number') {
                                        maxGamesFromDetails = leagueResponse.league.maxGames as number;
                                    }
                            }

                            // optimizedFetch returns JSON directly
                            if (statusRes?.success || statusRes?.status) {
                                const raw = (statusRes?.status || {}) as Record<string, unknown>;
                                const toNum = (v: unknown): number | undefined => {
                                    const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
                                    return Number.isFinite(n) ? n : undefined;
                                };
                                const matchesPlayed = toNum(
                                    raw?.matchesPlayed ?? raw?.gamesPlayed ?? raw?.played ?? raw?.completedMatches ?? raw?.totalPlayed
                                );
                                const maxGames = toNum(
                                    raw?.maxGames ?? raw?.allowedGames ?? raw?.totalGames
                                );
                                const locked = raw?.locked === true;
                                const isComplete = raw?.isComplete === true;
                                const missingRaw = raw?.missing as unknown;
                                const missing = Array.isArray(missingRaw) ? missingRaw : [];
                                const computed: LeagueComputedStatus = {
                                    ...(raw as LeagueComputedStatus),
                                    matchesPlayed,
                                    gamesPlayed: matchesPlayed,
                                    maxGames,
                                    locked,
                                    isComplete,
                                    missing,
                                };
                                return {
                                    ...enrichedLeague,
                                    computedStatus: computed,
                                    isLocked: computed?.locked === true,
                                    maxGames: maxGames ?? maxGamesFromDetails,
                                    matches: matchesFromDetails,
                                } as League;
                            }

                            return enrichedLeague as League;
                        } catch (error) {
                            console.error(`Error fetching details for league ${(league as { id?: string | number }).id}:`, error);
                            return league as League;
                        }
                    })
                );

                // Filter out completed leagues (like home page)
                const activeLeagues = detailedLeagues.filter(l => !leagueIsCompleted(l));

                // Sort alphabetically by name
                activeLeagues.sort((a, b) => {
                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return String(a.id).localeCompare(String(b.id));
                });

                setLeagues(activeLeagues);

                // Debug log
                try {
                    if (typeof window !== 'undefined' && detailedLeagues.length) {
                        console.group('[All Matches] League completion check');
                        console.log('Total leagues:', detailedLeagues.length);
                        console.log('Active (not completed):', activeLeagues.length);
                        console.table(detailedLeagues.map(l => ({
                            id: l?.id,
                            name: l?.name,
                            isComplete: Boolean(l?.isComplete),
                            locked: Boolean(l?.computedStatus?.locked || l?.isLocked),
                            matchesPlayed: l?.computedStatus?.matchesPlayed ?? null,
                            maxGames: l?.computedStatus?.maxGames ?? l?.maxGames ?? null,
                        })));
                        console.groupEnd();
                    }
                } catch {}
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        } finally {
            setLoading(false);
        }
    }, [token, leagueIsCompleted]);



    const fetchMatchesByLeague = useCallback(async (leagueId: string) => {
        setLoading(true);
        try {
            // 🔄 Force fresh data using cache buster and no-store (same approach as league page)
            const cacheBuster = `?_t=${Date.now()}`;
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}${cacheBuster}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
        } catch (e) {
            console.error('Failed to fetch matches by league:', e);
            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, [token, selectedLeague]);

    useEffect(() => {
        if (token) {
            fetchLeagues();
        }
    }, [token, fetchLeagues]);

    // Debug: log status distribution to help identify filtering issues
    useEffect(() => {
        try {
            if (!matches || matches.length === 0) return;
            const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toUpperCase() : '');
            const counts: Record<string, number> = {};
            matches.forEach(m => {
                const s = norm(m.status);
                counts[s || '(empty)'] = (counts[s || '(empty)'] || 0) + 1;
            });
            // eslint-disable-next-line no-console
            console.group('[All Matches] Status distribution');
            // eslint-disable-next-line no-console
            console.table(counts);
            // eslint-disable-next-line no-console
            console.groupEnd();
        } catch {}
    }, [matches]);

    // Add this effect for auto-select
    useEffect(() => {
        if (leagues.length > 0 && selectedLeague === 'all') {
            setLoading(true); // Set loading before changing league
            // Check localStorage for preferred league (same as home page)
            const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
            const preferred = storedId ? leagues.find(l => l.id === storedId) : null;
            setSelectedLeague(preferred ? preferred.id : leagues[0].id);
        }
    }, [leagues, selectedLeague]);

    // Fetch matches whenever selected league changes

    useEffect(() => {
        if (token && selectedLeague !== 'all') {
            fetchMatchesByLeague(selectedLeague);
        } else if (selectedLeague === 'all') {
            setMatches([]); // Clear matches when "All Leagues" is selected
            setLoading(false);
        }
    }, [selectedLeague, token, fetchMatchesByLeague]);

    // Optimistically inject newly created match into current list (no wait)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleMatchCreated = (evt: Event) => {
            try {
                const e = evt as CustomEvent<{ match: Match; leagueId: string }>; // payload from league page
                const payload = e?.detail as any;
                if (!payload || !payload.match) return;
                // Only show if current view is that league
                if (selectedLeague !== 'all' && payload.leagueId === selectedLeague) {
                    setMatches(prev => {
                        const list = prev || [];
                        const exists = list.some(m => m.id === payload.match.id);
                        if (exists) return list;
                        // Put newest on top (same as league page behavior)
                        return [payload.match as Match, ...list];
                    });
                }
            } catch (err) {
                console.warn('match-created optimistic update failed', err);
            }
        };
        window.addEventListener('match-created', handleMatchCreated as EventListener);
        return () => window.removeEventListener('match-created', handleMatchCreated as EventListener);
    }, [selectedLeague]);

    // Listen to creation/update events to refresh instantly like league page
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleRefresh = () => {
            if (token && selectedLeague !== 'all') {
                fetchMatchesByLeague(selectedLeague);
            }
        };
        window.addEventListener('match-created', handleRefresh);
        window.addEventListener('match-updated', handleRefresh);
        window.addEventListener('league-updated', handleRefresh);
        window.addEventListener('cache-cleared', handleRefresh);
        return () => {
            window.removeEventListener('match-created', handleRefresh);
            window.removeEventListener('match-updated', handleRefresh);
            window.removeEventListener('league-updated', handleRefresh);
            window.removeEventListener('cache-cleared', handleRefresh);
        };
    }, [selectedLeague, token, fetchMatchesByLeague]);

    // Get the name of the selected league for display
    const selectedLeagueName = selectedLeague === 'all'
        ? 'All Leagues'
        : leagues.find(league => league.id === selectedLeague)?.name || '';

    // const handleOpenTeamModal = (match: Match) => {
    //     setSelectedMatch(match);
    //     setTeamModalOpen(true);
    // };

    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    // Helper to map player object to PlayerCardProps
    const mapPlayerToCardProps = (player: User): PlayerCardProps => {
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
            profileImage: player?.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : `/${player.profilePicture}`}`) : undefined,
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
            match.availableUsers?.some((u: User) => u.id === member.id)
        ).length;
        const pendingCount = leagueMembers.length - availableCount;
        return { availableCount, pendingCount };
    };
    const [, setError] = useState<string | null>(null);
    const [league, setLeague] = useState<League | null>(null);
    const [, setToastMessage] = useState<string | null>(null);
    const [isSubmittingStats, setIsSubmittingStats] = React.useState(false);
    const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
    const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);
    // View team modal state (used in buttons below)
    const [viewTeamOpen, setViewTeamOpen] = useState(false);
    const [viewTeamMatch, setViewTeamMatch] = useState<{ leagueId: string; matchId: string; matchNumber?: number } | null>(null);



    // const fetchLeagueDetails = useCallback(async (suppressLoading: boolean = false) => {
    //     if (!suppressLoading) setLoading(true);
    //     try {
    //         // 🚀 Use optimizedFetch with 3-minute cache for league details
    //         const data = await optimizedFetch<any>(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague}`, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             },
    //             cacheTTL: 180000 // 3 minutes TTL
    //         });
    //         if (data.success) {
    //             console.log('Server Response - League Data:', data.league);
    //             console.log('Server Response - Matches:', data.league.matches);
    //             if (data.league.matches) {
    //                 data.league.matches.forEach((match: Match, index: number) => {
    //                     console.log(`Match ${index + 1} End Time:`, match.end);
    //                 });
    //             }
    //             setLeague(data.league);
    //         } else {
    //             setError(data.message || 'Failed to fetch league details');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching league details:', error);
    //         setError('Failed to fetch league details');
    //     } finally {
    //         if (!suppressLoading) setLoading(false);
    //     }
    // }, [selectedLeague, token]);

    
        const fetchLeagueDetails = useCallback(async () => {
            try {
                console.log("🔄 Fetching league details - Token:", token ? 'Present' : 'Missing');
    
                // 🔄 Add cache busting to force fresh data from backend
                const cacheBuster = `?_t=${Date.now()}`;
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague}${cacheBuster}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
    
                const data = await response.json();
                console.log('✅ League details fetched successfully from API', data);
                if (data.success) {
                    console.log('✅ Fresh League Data Received:', data.league);
                    console.log('✅ Total Matches:', data.league.matches?.length || 0);
                    if (data.league.matches) {
                        data.league.matches.forEach((match: Match, index: number) => {
                            console.log(`  Match ${index + 1}: ${match.homeTeamName} vs ${match.awayTeamName} | Status: ${match.status}`);
                        });
                    }
                    setLeague(data.league);
                    console.log('✅ League state updated successfully');
                } else {
                    setError(data.message || 'Failed to fetch league details');
                    console.error('❌ API Error:', data.message);
                }
            } catch (error) {
                console.error('❌ Error fetching league details:', error);
                setError('Failed to fetch league details');
            }
        }, [selectedLeague, token]);

    const handleSaveStats = async () => {
        if (!activeMatchId || !token) return;

        setIsSubmittingStats(true);
        try {
            // 🚀 Use mutateWithRefresh for automatic cache invalidation on POST
            const response = await mutateWithRefresh(
                `${process.env.NEXT_PUBLIC_API_URL}/matches/${activeMatchId}/stats`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        goals: stats.goals,
                        assists: stats.assists,
                        cleanSheets: stats.cleanSheets,
                        penalties: stats.penalties,
                        freeKicks: stats.freeKicks,
                        defence: stats.defence,
                        impact: stats.impact,
                    }),
                },
                'match',
                activeMatchId
            );

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, show error message
                console.error('Stats saving is not available yet. Please contact the administrator.');
                setStatsDialogOpen(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                // Update leaderboard cache with new stats
                if (data.updatedStats) {
                    Object.entries(data.updatedStats).forEach(([metric, value]) => {
                        if (typeof value === 'number') {
                            // Update cache if cacheManager is available
                            if (typeof cacheManager !== 'undefined') {
                                cacheManager.updateLeaderboardCache(data.playerId, value, metric as PlayerStatsMetric);
                            }
                        }
                    });
                }
                setStatsDialogOpen(false);
                // Optionally show a success message
            }
        } catch (err: unknown) {
            console.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingStats(false);
        }
    };

    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + increment);
            return { ...prev, [stat]: Math.min(newValue, max) };
        });
    };


    const getMatchGoals = () => {
        if (!activeMatchId || !league) return 10; // Default fallback
        const match = league.matches?.find(m => m.id === activeMatchId);
        if (!match) return 10;
        return (match.homeTeamGoals || 0) + (match.awayTeamGoals || 0);
    };

    useEffect(() => {
        if (selectedLeague && token && selectedLeague !== 'all') {
            fetchLeagueDetails();
        }
    }, [selectedLeague, token, fetchLeagueDetails]);
    const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
        if (!token) {
            setError('Please login to mark availability');
            return;
        }
        setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
        const action = isAvailable ? 'unavailable' : 'available';
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            // 🚀 Use mutateWithRefresh for automatic cache invalidation
            const response = await mutateWithRefresh(
                `${apiUrl}/matches/${matchId}/availability?action=${action}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                },
                'match',
                matchId
            );
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();
            if (data.success && data.match) {
                // Update cache with new match data
                cacheManager.updateMatchesCache(data.match);

                // Update the matches array so the button toggles instantly
                setMatches(prevMatches => prevMatches.map(m =>
                    m.id === matchId ? { ...m, availableUsers: data.match.availableUsers } : m
                ));
                setToastMessage(action === 'available' ? 'You are now available for this match.' : 'You are now unavailable for this match.');
            } else {
                setToastMessage('Availability updated.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage || 'Failed to connect to server');
        } finally {
            setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const [statsDialogOpen, setStatsDialogOpen] = React.useState(false);
    const [activeMatchId,] = React.useState<string | null>(null);
    const [stats, setStats] = React.useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });

    const formatMatchDate = (dateString: string) => {
        const matchDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time to compare only dates
        const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (matchDateOnly.getTime() === todayOnly.getTime()) {
            return 'Today';
        } else if (matchDateOnly.getTime() === yesterdayOnly.getTime()) {
            return 'Yesterday';
        } else {
            return matchDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    const formatMatchName = (name: string): string => {
        if (!name) return '';
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return `${capitalizedName}`;
    };
    const formatMatchTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };


    const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLeaguesDropdownAnchor(event.currentTarget);
        setLeaguesDropdownOpen(true);
    };

    const handleLeaguesDropdownClose = () => {
        setLeaguesDropdownOpen(false);
        setLeaguesDropdownAnchor(null);
    };

    const formatLeagueName = (name: string): string => {
        if (!name) return '';

        // Capitalize first letter of the name
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        // Get first letter of each word and join them
        const words = name.split(' ');
        const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

        // Return formatted name with initials in brackets
        return `${capitalizedName} (${initials})`;
    };

    // Sort helper: prefer numeric match index descending, fallback to latest date
    const getNumericIndex = (m: Match): number | undefined => {
        const keys = ['matchNumber', 'match_no', 'matchIndex', 'index', 'matchNo', 'no'] as const;
        const rec = m as unknown as Record<string, unknown>;
        for (const k of keys) {
            const v = rec[k];
            if (typeof v === 'number' && !Number.isNaN(v)) return v;
            if (typeof v === 'string') {
                const n = parseInt(v, 10);
                if (!Number.isNaN(n)) return n;
            }
        }
        return undefined;
    };

    const getBestDateMs = (m: Match): number => {
        // Prioritize scheduled kickoff time first so same-day later-time matches appear above earlier ones.
        const candidates: Array<string | Date | undefined | null> = [m.start, m.date, m.end, m.updatedAt, m.createdAt];
        for (const c of candidates) {
            if (!c) continue;
            const t = new Date(c).getTime();
            if (!Number.isNaN(t)) return t;
        }
        return 0;
    };

    const compareMatchesDesc = (a: Match, b: Match): number => {
        const ad = getBestDateMs(a);
        const bd = getBestDateMs(b);
        if (ad !== bd) return bd - ad; // most recent first

        const ai = getNumericIndex(a);
        const bi = getNumericIndex(b);
        if (ai !== undefined && bi !== undefined) return bi - ai; // larger index first
        if (ai !== undefined) return -1; // known index before unknown
        if (bi !== undefined) return 1;
        return 0;
    };

    const normalizeMatchStatus = (s: unknown): string =>
        typeof s === 'string' ? s.trim().toUpperCase() : '';

    const isResultLikeStatus = (s: unknown): boolean => {
        const st = normalizeMatchStatus(s);
        const direct = new Set([
            'RESULT_PUBLISHED',
            'RESULT_UPLOADED',
            'REVISION_REQUESTED',
            'RESULT_CONFIRMED',
            'RESULT_APPROVED',
            'RESULT_FINAL',
            'RESULT_COMPLETED',
            'COMPLETED',
            'FINISHED',
            'ENDED'
        ]);
        if (direct.has(st)) return true;
        return st.includes('RESULT') || st.includes('CONFIRM') || st.includes('COMPLETE') || st.includes('FINISH');
    };

    const isAwaitingConfirmationStatus = (s: unknown): boolean => {
        const st = normalizeMatchStatus(s);
        const awaiting = new Set([
            'RESULT_UPLOADED',
            'REVISION_REQUESTED',
            'RESULT_CONFIRMATION_REQUEST',
            'RESULT_PENDING_CONFIRMATION',
            'AWAITING_CONFIRMATION'
        ]);
        if (awaiting.has(st)) return true;
        return st.includes('UPLOAD') || st.includes('REVISION') || (st.includes('CONFIRM') && !st.includes('CONFIRMED'));
    };

    const filteredMatches = React.useMemo(() => {
        const arr = (Array.isArray(matches) ? matches : []).filter(m => !m.archived);

        // Treat these as fixtures (upcoming) across possible backend variants
        const fixtureStatuses = new Set([
            'SCHEDULED', 'PLANNED', 'UPCOMING', 'NOT_STARTED', 'CREATED', 'PENDING'
        ]);

        const isFixture = (m: Match): boolean => {
            const st = normalizeMatchStatus(m?.status);
            if (st && fixtureStatuses.has(st)) return true;
            // Fallback: if status missing, use date in future as fixture
            if (!st) {
                const t = new Date(m?.date as string).getTime();
                if (Number.isFinite(t) && t > Date.now()) return true;
            }
            return false;
        };

        switch (matchFilter) {
            case 'results': {
                // Everything that is not considered a fixture
                return arr.filter(m => !isFixture(m));
            }
            case 'fixtures':
                return arr.filter(isFixture);
            case 'all':
            default:
                return arr;
        }
    }, [matches, matchFilter]);

    const sortedMatches = React.useMemo(() => {
        return [...filteredMatches].sort(compareMatchesDesc);
    }, [filteredMatches]);

    const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
    // const isAdmin = league && league.administrators && user && league.administrators.some((a: User) => a.id === user.id);

    // Replace handleLeagueSelect to only update state and close the menu
    const handleLeagueSelect = (selectedLeagueId: string) => {
        if (selectedLeagueId !== selectedLeague) {
            // Persist preference so other pages/components (e.g., Match Stats Dialog) can auto-select this league
            try { if (typeof window !== 'undefined') localStorage.setItem(PREFERRED_LEAGUE_KEY, String(selectedLeagueId)); } catch {}
            setSelectedLeague(selectedLeagueId);
            setLoading(true); // effects will fetch matches and league details
        }
        handleLeaguesDropdownClose();
    };

    // Keep the selected league at the top of the dropdown
    const sortedLeagues = React.useMemo(() => {
        if (!leagues?.length) return [];
        const arr = [...leagues];
        const idx = arr.findIndex(l => l.id === selectedLeague);
        if (idx > 0) {
            const [sel] = arr.splice(idx, 1);
            arr.unshift(sel);
        }
        return arr;
    }, [leagues, selectedLeague]);

    const [archivedActionMatch, setArchivedActionMatch] = useState<Match | null>(null);
    const [archivedActionOpen, setArchivedActionOpen] = useState(false);
    const [, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);

    const [archivedActionChecking, setArchivedActionChecking] = useState(false);
    const [archivedActionDeleting, setArchivedActionDeleting] = useState(false);
    const [archivedActionHasStats, setArchivedActionHasStats] = useState<boolean | null>(null);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [matchPendingDelete, setMatchPendingDelete] = useState<Match | null>(null);
    const [matchHasData, setMatchHasData] = useState<boolean | null>(null);
    const [matchDeleteChecking, setMatchDeleteChecking] = useState(false);

    const [matchDetailModalOpen, setMatchDetailModalOpen] = useState(false);
    const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);

    const handleRequestDeleteMatch = async (match: Match) => {
        setMatchPendingDelete(match);
        setMatchHasData(null);
        setMatchDeleteChecking(true);
        setConfirmDeleteOpen(true);

        // Check if match has players or stats/scores
        const hasPlayers = (match.homeTeamUsers?.length ?? 0) > 0 || (match.awayTeamUsers?.length ?? 0) > 0;
        const hasScores = (match.homeTeamGoals ?? 0) > 0 || (match.awayTeamGoals ?? 0) > 0 || isResultLikeStatus(match.status);

        if (hasPlayers || hasScores) {
            setMatchHasData(true);
            setMatchDeleteChecking(false);
            return;
        }

        // Also check server for stats
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}/has-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMatchHasData(!!data.hasStats);
            } else {
                setMatchHasData(false);
            }
        } catch {
            setMatchHasData(false);
        } finally {
            setMatchDeleteChecking(false);
        }
    };

    // When the archived actions dialog opens, automatically check if the match has stats
    // (placed after getHasStats declaration to avoid 'used before declaration')


    const handleConfirmDeleteMatch = async () => {
        if (!matchPendingDelete || !token || !league) return;
        const m = matchPendingDelete;
        setConfirmDeleteOpen(false);

        try {
            // Always archive from main delete action.
            // Permanent delete is only available from Archived actions.
            const res = await mutateWithRefresh(
                `${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: true })
                },
                'match',
                m.id
            );

            if (!res.ok) {
                const errorData = await res.text();
                console.error('Archive failed:', errorData);
                throw new Error('Failed to archive match');
            }

            const data = await res.json();
            console.log('Archive response:', data);

            // Update local state (league.matches and matches list)
            setLeague(prev => prev ? {
                ...prev,
                matches: (prev.matches ?? []).map(mm =>
                    mm.id === m.id ? { ...mm, archived: true } : mm
                )
            } : prev);

            setMatches(prev => prev.map(mm => mm.id === m.id ? { ...mm, archived: true } : mm));

            setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
            setToastMessage('Match archived successfully');

            // Refresh league data to ensure sync
            fetchLeagueDetails();

        } catch (e) {
            console.error('Delete/Archive operation failed:', e);
            toast.error('Failed to archive match');
        } finally {
            setMatchPendingDelete(null);
            setMatchHasData(null);
        }
    };
    const getHasStats = useCallback(async (matchId: string): Promise<boolean> => {
        if (!token) return true; // default safe
        try {
            // 🚀 Use optimizedFetch with 2-minute cache for stats check
            const data = await optimizedFetch<any>(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/has-stats`, {
                headers: { Authorization: `Bearer ${token}` },
                cacheTTL: 120000 // 2 minutes TTL
            });
            if (!data || !data.success) return true;
            return !!data.hasStats;
        } catch {
            return true; // safe default
        }
    }, [token]);


    const handlePermanentDelete = async (match: Match) => {
        // if (!window.confirm('Are you sure you want to PERMANENTLY delete this match? This action cannot be undone and all match data will be lost forever.')) {
        //     return;
        // }

        try {
            // 🚀 Use mutateWithRefresh for automatic cache invalidation on DELETE
            const res = await mutateWithRefresh(
                `${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                },
                'match',
                match.id
            );

            if (res.status === 400) {
                // Backend says cannot delete (likely stats exist)
                let msg = 'Cannot permanently delete this match. It may have player stats.';
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                toast.error(msg);
                setArchivedActionHasStats(true);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to permanently delete match');
            }

            setLeague(prev => prev ? {
                ...prev,
                matches: (prev.matches ?? []).filter(mm => mm.id !== match.id)
            } : prev);

            setMatches(prev => prev.filter(mm => mm.id !== match.id));

            toast.success('Match permanently deleted');
            fetchLeagueDetails();

        } catch (error) {
            console.error('Permanent delete failed:', error);
            toast.error('Failed to permanently delete match');
        }
    };


    const tryHardDeleteFromDialog = useCallback(async () => {
        if (!archivedActionMatch || archivedActionDeleting) return;

        // If already confirmed no stats, proceed immediately to delete
        if (archivedActionHasStats === false) {
            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
            if (ok) {
                try {
                    setArchivedActionDeleting(true);
                    await handlePermanentDelete(archivedActionMatch);
                    setArchivedActionOpen(false);
                } finally {
                    setArchivedActionDeleting(false);
                }
            }
            return;
        }

        // Unknown or previously blocked: re-check now
        setArchivedActionChecking(true);
        try {
            const hasStats = await getHasStats(archivedActionMatch.id);
            setArchivedActionHasStats(hasStats);

            if (hasStats) {
                toast.error('Player stats exist. Permanent delete is disabled.');
                return;
            }

            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
            if (ok) {
                try {
                    setArchivedActionDeleting(true);
                    await handlePermanentDelete(archivedActionMatch);
                    setArchivedActionOpen(false);
                } finally {
                    setArchivedActionDeleting(false);
                }
            }
        } finally {
            setArchivedActionChecking(false);
        }
    }, [archivedActionMatch, archivedActionHasStats, archivedActionDeleting, getHasStats, handlePermanentDelete]);


    const handleRestoreMatch = async (match: Match) => {
        try {
            // 🚀 Use mutateWithRefresh for automatic cache invalidation
            const res = await mutateWithRefresh(
                `${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: false })
                },
                'match',
                match.id
            );

            if (!res.ok) {
                throw new Error('Failed to restore match');
            }

            // Update local state (league.matches and matches list)
            setLeague(prev => prev ? {
                ...prev,
                matches: (prev.matches ?? []).map(mm =>
                    mm.id === match.id ? { ...mm, archived: false } : mm
                )
            } : prev);

            setMatches(prev => prev.map(mm => mm.id === match.id ? { ...mm, archived: false } : mm));

            toast.success('Match restored successfully');
            fetchLeagueDetails();

        } catch (error) {
            console.error('Restore failed:', error);
            toast.error('Failed to restore match');
        }
    };



    const MatchDetailModal = ({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match | null }) => {
        if (!match) return null;

        return (
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md" // Changed to md for more width
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(15,15,15,0.95)',
                        color: '#E5E7EB',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 'bold',
                        position: 'relative',
                        color: '#E5E7EB',
                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        py: 2.5
                    }}
                >
                    Match Details
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: '#9CA3AF',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {/* Match Header - Teams Side by Side */}
                    <Box sx={{
                        p: 3,
                        background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                        color: 'white'
                    }}>
                        {/* Teams in a row layout */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {/* Home Team */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flex: 1,
                                minWidth: 0 // Prevent overflow
                            }}>
                                <Image
                                    src={match.homeTeamImage || homeTeamIcon}
                                    alt={match.homeTeamName || ''}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '6px', flexShrink: 0 }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {formatMatchName(match.homeTeamName || '')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            opacity: 0.8,
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Home
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Score Section */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flexShrink: 0
                            }}>
                                {match.status === 'RESULT_PUBLISHED' && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2
                                    }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {match.homeTeamGoals || 0}
                                        </Typography>
                                        <Typography variant="h6" sx={{ opacity: 0.7 }}>
                                            -
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {match.awayTeamGoals || 0}
                                        </Typography>
                                    </Box>
                                )}
                                {match.status === 'SCHEDULED' && (
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            VS
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Away Team */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flex: 1,
                                flexDirection: 'row-reverse', // Reverse order for visual balance
                                minWidth: 0
                            }}>
                                <Image
                                    src={match.awayTeamImage || awayTeamIcon}
                                    alt={match.awayTeamName || ''}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '6px', flexShrink: 0 }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {formatMatchName(match.awayTeamName || '')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            opacity: 0.8,
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Away
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Match Info */}
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Date & Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Calendar size={20} color="#E5E7EB" />
                            <Box>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                    Date & Time
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
                                    {formatMatchDate(match.date)} at {formatMatchTime(match.date)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Location */}
                        {match?.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    📍
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                        Location
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
                                        {match?.location}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {match.status === 'RESULT_PUBLISHED' ? '✅' : match.status === 'RESULT_UPLOADED' ? '⌛' : '⏰'}
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                    Status
                                </Typography>
                                <Chip
                                    label={match.status === 'RESULT_PUBLISHED' ? 'RESULT_PUBLISHED' : match.status === 'RESULT_UPLOADED' ? 'Awaiting Confirmation' : 'SCHEDULED'}
                                    size="small"
                                    sx={{
                                        backgroundColor: match.status === 'RESULT_PUBLISHED' ? '#16a34a' : match.status === 'RESULT_UPLOADED' ? '#ea580c' : '#0388E3',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Availability Info for Scheduled Matches */}
                        {match.status === 'SCHEDULED' && (
                            <Box sx={{
                                mt: 2,
                                p: 2,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
                                    Player Availability
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Available: ${getAvailabilityCounts(match).availableCount}`}
                                        size="small"
                                        sx={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}
                                    />
                                    <Chip
                                        label={`Pending: ${getAvailabilityCounts(match).pendingCount}`}
                                        size="small"
                                        sx={{ backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            color: '#E5E7EB',
                            borderColor: 'rgba(255,255,255,0.2)',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderColor: 'rgba(255,255,255,0.3)'
                            }
                        }}
                    >
                        Close
                    </Button>
                    <Link href={`/match/${match.id}`} passHref>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: '#0388E3',
                                '&:hover': { backgroundColor: '#0369a1' }
                            }}
                        >
                            View Full Details
                        </Button>
                    </Link>
                </DialogActions>
            </Dialog>
        );
    };

    const handleMatchCardClick = (match: Match, event: React.MouseEvent) => {
        // Prevent opening modal if clicking on buttons
        const target = event.target as HTMLElement;
        const isButton = target.closest('button') || target.closest('a');

        if (!isButton) {
            setSelectedMatchDetail(match);
            setMatchDetailModalOpen(true);
        }
    };

    // Open Match Stats modal instead of navigating for play actions
    const [matchStatsOpen, setMatchStatsOpen] = React.useState(false);
    const [selectedMatchIdForDialog, setSelectedMatchIdForDialog] = React.useState<string | null>(null);
    const [selectedLeagueIdForDialog, setSelectedLeagueIdForDialog] = React.useState<string | null>(null);
    const [shouldShowAdminGoals, setShouldShowAdminGoals] = React.useState(false);
    // Edit Match dialog state
    const [editMatchOpen, setEditMatchOpen] = React.useState(false);
    const [editMatchLeagueId, setEditMatchLeagueId] = React.useState<string | null>(null);
    const [editMatchId, setEditMatchId] = React.useState<string | null>(null);
    // Results dialog state
    const [resultsDialogOpen, setResultsDialogOpen] = React.useState(false);
    const [resultsMatchId, setResultsMatchId] = React.useState<string | null>(null);
        // Header helper: reflect loading/no-league/selected league label
    const noLeagues = !loading && leagues.length === 0;


    return (
        <Box
            sx={{
                minHeight: '100vh',
                // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
                // backgroundColor:'white',
                py: 0,
            }}
        >
            <Container maxWidth={false} disableGutters>

                {/* <Button
                    startIcon={<ArrowLeft />}
                    onClick={handleBackToDashboard}
                    sx={{
                        mb: 2, color: 'white', backgroundColor: '#1f673b',
                        '&:hover': { backgroundColor: '#388e3c' },
                    }}
                >
                    Back to Dashboard
                </Button> */}
                <Box sx={{
                    mb: { xs: 3, md: 5 },
                    bgcolor: 'black',
                    px: { xs: 3, sm: 3, md: 14 },
                    py: { xs: 2, md: 3 },
                    borderRadius: 0
                }}>
                    {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 } }}> */}
                    <Typography variant="h3" sx={{
                        mb: { xs: 4, md: 6 },
                        mt:{xs: 1.25, md: 4},
                        color: 'white',
                        // fontFamily: 'Arial Black, Arial, sans-serif',
                        fontFamily: '"Oswald", sans-serif !important',
                        fontWeight: '600',
                        fontSize: { xs: '32px', sm: '42px', md: '56px' },
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                        className='all-leagues-heading'
                    >
                        ALL MATCHES
                    </Typography>

                    <Box
                        sx={{
                            width: '98.5vw',
                            position: 'relative',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            height: '3px',
                            background: '#b75512',
                            mb: { xs: 2, md: 2.5 },
                        }}
                    />

                    {/* </Box> */}
                    {/* Create/Join League Section */}
                    <Box sx={{
                        display: 'flex',
                        gap: { xs: 1.25, md: 3 },
                        mb: { xs: 3, md: 5 },
                        flexWrap: { xs: 'wrap', md: 'nowrap' },
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'stretch', md: 'center' },
                        justifyContent: { xs: 'flex-start', md: 'space-between' }
                    }}>

                        <Box sx={{
                            display: 'flex',
                            gap: { xs: 1, md: 2 },
                            width: { xs: '100%', md: 'auto' },
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' },
                            flexShrink: 0
                        }}>
                            <Button
                                variant="contained"
                                // onClick={() => setIsDialogOpen(true)}
                                sx={{
                                    bgcolor: '#0388E3',
                                    color: 'white',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '13px', sm: '16px', md: '18px' },
                                    minHeight: { md: 48 },
                                    height: { md: 48 },
                                    '&:hover': { bgcolor: '#0388E3' },
                                    width: { xs: '100%', sm: 'fit-content' },
                                    borderRadius: 2,
                                    py: { xs: 1, md: 1 },
                                    px: { xs: 3, md: 3 },
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    textTransform: 'none'
                                }}
                            >
                                <Link href={`/league/${league?.id}/match`}>
                                    Create New Match
                                </Link>
                            </Button>
                            {/* <TextField
                                label="Enter invite code"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                sx={{
                                  flex: 1,
                                  width: { xs: '100%', sm: 'auto' },
                                  '& .MuiOutlinedInput-root': {
                                    color: 'black',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', border: '2px solid green' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)', border: '2px solid green' },
                                    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.8)', border: '2px solid green' },
                                  },
                                  '& .MuiInputLabel-root': { color: 'green' },
                                  
                                }}
                              /> */}
                            {/* <TextField
                                label="Enter invite code"
                                // value={inviteCode}
                                // onChange={(e) => setInviteCode(e.target.value)}
                                size="medium"
                                sx={{
                                  flex: 1,
                                  width: { xs: '100%', sm: 'auto' },
                                  '& .MuiOutlinedInput-root': {
                                    color: 'black',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    padding: '0', // Remove extra padding
                                    '& input': {
                                      padding: '13px 12px', // Reduce input height
                                    },
                                    '& fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                                    '&:hover fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                                    '&.Mui-focused fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                                  },
                                  '& .MuiInputLabel-root': { color: '#8C8C8C' },
                                }}
                              /> */}
                            <Button
                                onClick={handleLeaguesDropdownOpen}
                                sx={{
                                    textTransform: 'uppercase',
                                    fontSize: { xs: '0.9rem', sm: '1.25rem', md: '1.2rem' },
                                    fontWeight: 'bold',
                                    minHeight: { md: 48 },
                                    height: { md: 48 },
                                    lineHeight: 1.2,
                                    wordBreak: { xs: 'normal', sm: 'break-word' },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: { xs: 'nowrap', sm: 'wrap' },
                                    flexShrink: 1,
                                    minWidth: 0,
                                    width: { xs: '100%', sm: 'auto' },
                                    textAlign: { xs: 'left', md: 'left' },
                                    // color: 'white',
                                    backgroundColor: '#2B2B2B',
                                    borderRadius: 2,
                                    px: { xs: 1.5, sm: 2 },
                                    py: { xs: 0.9, sm: 1 },
                                    '&:hover': {
                                        backgroundColor: '#2B2B2B',
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: { xs: 'space-between', sm: 'flex-start' },
                                    gap: { xs: 0.5, sm: 1 },
                                    // Dynamic text color: grey when no leagues, white otherwise
                                    color: noLeagues ? '#fff' : 'white',
                                    // Keep readable disabled style without dimming background
                                    '&.Mui-disabled': {
                                        color: '#fff',
                                        backgroundColor: '#2B2B2B',
                                        opacity: 1
                                    },
                                    // border: '1px solid rgba(255,255,255,0.3)',
                                }}
                                endIcon={<ChevronDown size={20} />}
                                disabled={noLeagues}
                            >
                                 {loading
              ? 'Loading...'
              : noLeagues
              ? 'No leagues found'
                                    : formatLeagueName(
                                        leagues.find(l => l.id === selectedLeague)?.name || 'Select League'
                                      )}
                            </Button>
                            <Menu
                                anchorEl={leaguesDropdownAnchor}
                                open={leaguesDropdownOpen}
                                onClose={handleLeaguesDropdownClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                MenuListProps={{ sx: { p: 0 } }}
                                PaperProps={{
                                    sx: {
                                        p: 0.5,
                                        mt: 1,
                                        minWidth: 240,
                                        bgcolor: 'rgba(15,15,15,0.92)',
                                        color: '#E5E7EB',
                                        borderRadius: 2.5,
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                                        // Dynamic height: only grow to content, but allow scroll if content exceeds 320px
                                        maxHeight: 320,
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        overscrollBehavior: 'contain',
                                        // Themed scrollbars (only appear if needed)
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#374151 #111827',
                                        '&::-webkit-scrollbar': { width: 8 },
                                        '&::-webkit-scrollbar-track': { background: '#111827' },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#374151',
                                            borderRadius: 20,
                                            border: '2px solid #111827'
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': { background: '#4b5563' },
                                    }
                                }}
                            >
                                {[...sortedLeagues].sort((a, b) => {
                                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                                    if (an < bn) return -1;
                                    if (an > bn) return 1;
                                    return String(a.id).localeCompare(String(b.id));
                                }).map((leagueItem) => {
                                    const isActive = leagueItem.id === selectedLeague;
                                    return (
                                        <MenuItem
                                            key={leagueItem.id}
                                            onClick={() => handleLeagueSelect(leagueItem.id)}
                                            sx={{
                                                borderRadius: 1.5,
                                                mx: 0.5,
                                                my: 0.25,
                                                py: 1.25,
                                                px: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                color: '#E5E7EB',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                                },
                                                ...(isActive && {
                                                    background: 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)',
                                                    border: '1px solid rgba(3,136,227,0.35)',
                                                }),
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <Trophy size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={leagueItem.name}
                                                sx={{
                                                    '& .MuiListItemText-primary': {
                                                        fontSize: '0.95rem',
                                                        fontWeight: isActive ? 700 : 500,
                                                        letterSpacing: 0.2,
                                                        color: isActive ? '#FFFFFF' : '#E5E7EB',
                                                    }
                                                }}
                                            />
                                                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {(() => {
                                                    // Define LeagueUser type if not already defined
                                                    type LeagueUser = { id: string };
                                                    const isLeagueAdmin = leagueItem.administrators?.some((admin: LeagueUser) => admin.id === user?.id);
                                                    const isLeagueMember = leagueItem.members?.some((member: LeagueUser) => member.id === user?.id);
                                                    const userRole = isLeagueAdmin ? 'ADMIN' : isLeagueMember ? 'MEMBER' : null;
                                                    
                                                    return userRole ? (
                                                        <Box
                                                            sx={{
                                                                px: 1,
                                                                py: 0.25,
                                                                bgcolor: userRole === 'ADMIN' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                                                                color: userRole === 'ADMIN' ? '#1F2937' : '#FFFFFF',
                                                                borderRadius: '9999px',
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                letterSpacing: 0.3,
                                                                textTransform: 'uppercase',
                                                            }}
                                                        >
                                                            {userRole === 'ADMIN' ? 'Admin' : 'Member'}
                                                        </Box>
                                                    ) : null;
                                                })()}
                                                {/* {isActive && (
                                                    <Box
                                                        sx={{
                                                            px: 1,
                                                            py: 0.25,
                                                            bgcolor: '#0388E3',
                                                            color: 'white',
                                                            borderRadius: '9999px',
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            letterSpacing: 0.3,
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        Current
                                                    </Box>
                                                )} */}
                                            </Box>
                                        </MenuItem>
                                    );
                                })}
                            </Menu>
                        </Box>

                        {/* Filters: All | Results | Matches | Fixtures */}
                        <Box sx={{
                            display: { xs: 'grid', md: 'flex' },
                            gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', md: 'none' },
                            gap: { xs: 0.75, sm: 1 },
                            flexWrap: { xs: 'nowrap', sm: 'wrap', md: 'nowrap' },
                            alignItems: 'center',
                            justifyContent: { xs: 'center', md: 'flex-end' },
                            width: { xs: '100%', md: 'auto' },
                            mt: { xs: 1, md: 0 }
                        }}>
                            <Button
                                variant={matchFilter === 'all' ? 'contained' : 'outlined'}
                                onClick={() => setMatchFilter('all')}
                                sx={{
                                    backgroundColor: matchFilter === 'all' ? '#00a77f' : 'transparent',
                                    color: 'white',
                                    border: '1px solid #b75512',
                                    borderColor: '#b75512',
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '11px', sm: '14px' },
                                    minHeight: { md: 48 },
                                    height: { md: 48 },
                                    minWidth: 0,
                                    width: { xs: '100%', sm: 'auto' },
                                    px: { xs: 0.5, sm: 1.5, md: 2.25 },
                                    py: { xs: 0.65, sm: 0.8 },
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.1,
                                    '&:hover': {
                                        backgroundColor: matchFilter === 'all' ? '#00a77f' : 'rgba(183,85,18,0.08)',
                                        borderColor: '#b75512',
                                    },
                                }}
                            >
                                All Matches
                            </Button>
                            <Button
                                variant={matchFilter === 'results' ? 'contained' : 'outlined'}
                                onClick={() => setMatchFilter('results')}
                                sx={{
                                    backgroundColor: matchFilter === 'results' ? '#00a77f' : 'transparent',
                                    color: 'white',
                                    border: '1px solid #b75512',
                                    borderColor: '#b75512',
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '11px', sm: '14px' },
                                    minHeight: { md: 48 },
                                    height: { md: 48 },
                                    minWidth: 0,
                                    width: { xs: '100%', sm: 'auto' },
                                    px: { xs: 0.5, sm: 1.5, md: 2.25 },
                                    py: { xs: 0.65, sm: 0.8 },
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.1,
                                    '&:hover': {
                                        backgroundColor: matchFilter === 'results' ? '#00a77f' : 'rgba(183,85,18,0.08)',
                                        borderColor: '#b75512',
                                    },
                                }}
                            >
                                Match Results
                            </Button>
                            
                            <Button
                                variant={matchFilter === 'fixtures' ? 'contained' : 'outlined'}
                                onClick={() => setMatchFilter('fixtures')}
                                sx={{
                                    backgroundColor: matchFilter === 'fixtures' ? '#00a77f' : 'transparent',
                                    color: 'white',
                                    border: '1px solid #b75512',
                                    borderColor: '#b75512',
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '11px', sm: '14px' },
                                    minHeight: { md: 48 },
                                    height: { md: 48 },
                                    minWidth: 0,
                                    width: { xs: '100%', sm: 'auto' },
                                    px: { xs: 0.5, sm: 1.5, md: 2.25 },
                                    py: { xs: 0.65, sm: 0.8 },
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.1,
                                    '&:hover': {
                                        backgroundColor: matchFilter === 'fixtures' ? '#00a77f' : 'rgba(183,85,18,0.08)',
                                        borderColor: '#b75512',
                                    },
                                }}
                            >
                                Fixtures
                            </Button>
                        </Box>
                    </Box>
                </Box>
                {/* Match Cards */}
                <Box sx={{
                    px: { xs: 3, sm: 3, md: 14 },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                    gap: 3,
                }}>
                    {loading ? (
                        <Box sx={{ gridColumn: '1 / -1', minHeight: { xs: '20vh', md: '30vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="#fff" align="center">Loading matches...</Typography>
                        </Box>
                    ) : selectedLeague === 'all' ? (
                        <Box sx={{ gridColumn: '1 / -1', minHeight: { xs: '25vh', md: '40vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: 3,
                                    p: 4,
                                    textAlign: 'center',
                                    color: '#fff',
                                }}
                            >
                                <Typography variant="h6">No leagues found</Typography>
                                <Typography variant="body2">
                                  Create a new league or join an existing one to get started.
                                </Typography>
                            </Paper>
                        </Box>
                    ) : matches.length === 0 ? (
                        <Box sx={{ gridColumn: '1 / -1', minHeight: { xs: '20vh', md: '30vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
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
                        </Box>
                    ) : sortedMatches.length === 0 ? (
                        <Box sx={{ gridColumn: '1 / -1', minHeight: { xs: '20vh', md: '30vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                    borderRadius: 3,
                                    p: 4,
                                    textAlign: 'center',
                                    color: '#b0bec5',
                                }}
                            >
                                <Typography variant="h6">
                                    {matchFilter === 'fixtures' ? 'No fixtures found' : matchFilter === 'results' ? 'No results yet' : 'No matches found'}
                                </Typography>
                                <Typography variant="body2">
                                    {matchFilter === 'fixtures'
                                        ? 'There are no upcoming fixtures for this league.'
                                        : matchFilter === 'results'
                                            ? 'No completed matches have been recorded yet.'
                                            : `No matches found in ${selectedLeagueName}`}
                                </Typography>
                            </Paper>
                        </Box>
                    ) : (
                        sortedMatches.map((match, idx) => {
                            const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                            const leagueForMatch = leagues.find(l => l.id === match.leagueId);
                            const isAdmin = leagueForMatch?.administrators?.some(admin => admin.id === user?.id);
                            const isCompleted = isResultLikeStatus(match.status);
                            const matchNumber = getNumericIndex(match) ?? (idx + 1);
                            const startTime = match.start ? new Date(match.start as string) : new Date(match.date);
                            const endTime = match.end ? new Date(match.end) : new Date(startTime.getTime() + 90 * 60000);
                            const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

                            if (isCompleted) {
                                // ── Results Card ──
                                const homeGoals = match.homeTeamGoals ?? 0;
                                const awayGoals = match.awayTeamGoals ?? 0;
                                const goalDiff = Math.abs(homeGoals - awayGoals);
                                let resultText = 'Draw';
                                if (homeGoals > awayGoals) resultText = `Home Team Win By ${goalDiff} Goal${goalDiff > 1 ? 's' : ''}`;
                                else if (awayGoals > homeGoals) resultText = `Away Team Win By ${goalDiff} Goal${goalDiff > 1 ? 's' : ''}`;

                                return (
                                    <Card
                                        key={match.id}
                                        sx={{
                                            position: 'relative',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            background: '#222',
                                            border: '2px solid #fff',
                                            '& .MuiCardContent-root:last-child': { paddingBottom: 0 },
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)' },
                                        }}
                                    >
                                        {match.archived && (
                                            <Chip label="Canceled by Admin" size="small" sx={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: '#b91c1c', color: 'white', fontWeight: 'bold' }} />
                                        )}

                                        {/* Match Title Header */}
                                        <Box sx={{ background: 'white', py: 0.7, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderBottom: '1px solid #e0e0e0' }}>
                                            <Image src={FootBallIcon} alt="Football" width={24} height={24} />
                                            <Typography sx={{ color: 'black', fontFamily: "Woodford Bourne Pro", fontWeight: 700, fontSize: '18px', lineHeight: 1, textTransform: 'capitalize', textDecoration: 'underline', textAlign: 'center' }}>
                                                Match {matchNumber}
                                            </Typography>
                                        </Box>

                                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                            {/* Result Banner */}
                                            <Box sx={{ py: 0.5, textAlign: 'center' }}>
                                                <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 400 }}>
                                                    {isAwaitingConfirmationStatus(match.status) ? 'Awaiting Confirmation' : resultText}
                                                </Typography>
                                            </Box>

                                            {/* Teams & Score */}
                                            <Box sx={{ pl: 1, pr: 1, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #fff', mt: -3.5 }}>
                                                {/* Home Team */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Image src={match.homeTeamImage || HomeTeamImage} alt={match.homeTeamName || 'Home'} width={65} height={65} style={{ objectFit: 'contain' }} />
                                                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Home</Typography>
                                                </Box>

                                                {/* Score Center */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', lineHeight: 1, color: 'white' }}>{homeGoals}</Typography>
                                                            <Typography sx={{ fontSize: '0.5rem', color: '#aaa' }}>Goal Score</Typography>
                                                        </Box>
                                                        <Typography sx={{ fontFamily: '"Oswald", sans-serif !important', fontWeight: 600, fontSize: '1.5rem', lineHeight: 0.5, letterSpacing: '-2px', textTransform: 'uppercase', color: 'white' }}>V/S</Typography>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', lineHeight: 1, color: 'white' }}>{awayGoals}</Typography>
                                                            <Typography sx={{ fontSize: '0.5rem', color: '#aaa' }}>Goal Score</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography sx={{ color: '#ddd', fontSize: '0.85rem', textAlign: 'center', mt: 0.5 }}>{durationMinutes} Minutes Match</Typography>
                                                </Box>

                                                {/* Away Team */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Image src={match.awayTeamImage || AwayTeamImage} alt={match.awayTeamName || 'Away'} width={65} height={65} style={{ objectFit: 'contain' }} />
                                                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Away</Typography>
                                                </Box>
                                            </Box>

                                            {/* Bottom Info Panel */}
                                            <Box sx={{ display: 'flex' }}>
                                                {/* Left Info Column */}
                                                <Box sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1 }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                                <Image src={CalendarImg} alt="Date" width={16} height={16} />
                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{formatMatchDate(match.date)}</Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                                <Image src={ClockImg} alt="Time" width={16} height={16} />
                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{formatMatchTime(match.date)}</Typography>
                                                            </Box>
                                                        </Box>
                                                        {match.location ? (
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '160px' }}>
                                                                <Box sx={{ mt: 0.3, flexShrink: 0 }}><Image src={LocationImg} alt="Location" width={18} height={18} /></Box>
                                                                <Typography sx={{ color: '#ccc', fontSize: '0.6rem', lineHeight: 1.3, wordBreak: 'break-word' }}>{formatLocationForCard(match.location)}</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ height: '20px' }} />
                                                        )}
                                                    </Box>

                                                    {/* MOTM */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', mt: -6 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                                            <Image src={CardStar} alt="MOTM" width={34} height={34} />
                                                            {(() => {
                                                                const votes = (match as any).manOfTheMatchVotes || {};
                                                                const voteCounts: Record<string, number> = {};
                                                                if (typeof votes === 'object' && !Array.isArray(votes)) {
                                                                    Object.values(votes).forEach((playerId) => {
                                                                        if (playerId) { const pid = String(playerId); voteCounts[pid] = (voteCounts[pid] || 0) + 1; }
                                                                    });
                                                                }
                                                                let maxVotes = 0; let motmPlayerId = '';
                                                                Object.entries(voteCounts).forEach(([pid, count]) => { if (count > maxVotes) { maxVotes = count; motmPlayerId = pid; } });
                                                                if (motmPlayerId && maxVotes > 0) {
                                                                    const allPlayers = [...(match.homeTeamUsers || []), ...(match.awayTeamUsers || [])];
                                                                    const motmPlayer = allPlayers.find(p => String(p.id) === String(motmPlayerId));
                                                                    if (motmPlayer && motmPlayer.firstName && motmPlayer.lastName) {
                                                                        return (<>
                                                                            <Typography sx={{ color: '#FFD700', fontSize: '0.6rem', fontWeight: 700, textAlign: 'center', mt: 0.5 }}>{motmPlayer.firstName} {motmPlayer.lastName}</Typography>
                                                                            <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center' }}>Man Of The Match</Typography>
                                                                        </>);
                                                                    }
                                                                }
                                                                return <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center' }}>Man Of The Match</Typography>;
                                                            })()}
                                                        </Box>
                                                    </Box>

                                                    {/* Action Buttons */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        {(isAdmin || isMember) && (() => {
                                                            const isInMatch = match.homeTeamUsers?.some(u => String(u?.id) === String(user?.id)) || match.awayTeamUsers?.some(u => String(u?.id) === String(user?.id));
                                                            const isDisabled =
                                                                !league?.active ||
                                                                match.archived;
                                                            return (
                                                            <Box
                                                                onClick={() => {
                                                                    if (!isAdmin && !isInMatch) {
                                                                        toast('You are not added to this match', {
                                                                            icon: '⚠️',
                                                                            duration: 4000,
                                                                            style: {
                                                                                background: '#F97316',
                                                                                color: '#fff',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.95rem',
                                                                                padding: '14px 20px',
                                                                                borderRadius: '12px',
                                                                                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.5)',
                                                                            },
                                                                        });
                                                                        return;
                                                                    }
                                                                    if (!isDisabled) {
                                                                        setSelectedMatchIdForDialog(match.id); setSelectedLeagueIdForDialog(String(match.leagueId)); setShouldShowAdminGoals(false); setMatchStatsOpen(true);
                                                                    }
                                                                }}
                                                                sx={{ cursor: 'pointer' }}
                                                            >
                                                            <Button
                                                                size="small"
                                                                startIcon={<Image src={ADDSTATS} alt="Add Stats" width={34} height={34} />}
                                                                disabled={isDisabled && (isAdmin || !!isInMatch)}
                                                                sx={{ color: 'white', fontSize: '0.6rem', textTransform: 'none', py: 0.5, px: 1, pointerEvents: 'none', borderRadius: '50px', border: idx === 0 ? '1.4px solid #F97316' : '1.4px solid #9c9c9c', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#444' }, '&.Mui-disabled': { color: 'white' }, '& .MuiButton-startIcon': { mr: 0.4 } }}
                                                            >
                                                                <span style={{ marginTop: '4px' }}>Add Stats</span>
                                                            </Button>
                                                            </Box>
                                                            );
                                                        })()}
                                                        <Button
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); setViewTeamMatch({ leagueId: String(match.leagueId), matchId: match.id, matchNumber }); setViewTeamOpen(true); }}
                                                            startIcon={<Image src={ViewTeamImg} alt="View Team" width={34} height={34} />}
                                                            sx={{ color: 'white', fontSize: '0.6rem', textTransform: 'none', py: 0.5, px: 1, borderRadius: '50px', border: idx === 0 ? '1.4px solid #F97316' : '1.4px solid #9c9c9c', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#444' }, '& .MuiButton-startIcon': { mr: 0.4 } }}
                                                        >
                                                            <span style={{ marginTop: '4px' }}>View Teams</span>
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => { setResultsMatchId(match.id); setResultsDialogOpen(true); }}
                                                            startIcon={<Image src={RESULTS} alt="Results" width={28} height={28} />}
                                                            sx={{ color: 'white', fontSize: '0.6rem', textTransform: 'none', py: 0.5, px: 1, borderRadius: '50px', border: idx === 0 ? '1.4px solid #F97316' : '1.4px solid #9c9c9c', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#444' }, '&.Mui-disabled': { color: 'white' }, '& .MuiButton-startIcon': { mr: 0.4 } }}
                                                        >
                                                            <span style={{ marginTop: '4px' }}>Results</span>
                                                        </Button>
                                                    </Box>
                                                </Box>

                                                {/* Right Admin Column */}
                                                <Box sx={{ width: '95px', borderLeft: '2px solid #fff', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1 }}>
                                                    {isAdmin ? (
                                                        <>
                                                            <Typography sx={{ color: 'white', fontSize: '0.65rem', textAlign: 'left', ml: '5px' }}>For Admin Only</Typography>
                                                            <Button
                                                                onClick={() => { setSelectedMatchIdForDialog(match.id); setSelectedLeagueIdForDialog(String(match.leagueId)); setShouldShowAdminGoals(true); setMatchStatsOpen(true); }}
                                                                startIcon={<Edit size={14} color="#00a77f" />}
                                                                sx={{ color: '#fff', justifyContent: 'flex-start', textTransform: 'none', p: 0, ml: '5px', fontSize: '0.6rem', whiteSpace: 'nowrap', textDecoration: 'underline', '& .MuiButton-startIcon': { mr: 1 } }}
                                                            >
                                                                Add Score
                                                            </Button>
                                                            <Button
                                                                onClick={(e) => { e.stopPropagation(); setEditMatchLeagueId(String(match.leagueId)); setEditMatchId(match.id); setEditMatchOpen(true); }}
                                                                disabled={!league?.active}
                                                                startIcon={<Edit size={14} color="#00a77f" />}
                                                                sx={{ color: '#fff', justifyContent: 'flex-start', textTransform: 'none', p: 0, ml: '5px', fontSize: '0.6rem', whiteSpace: 'nowrap', textDecoration: 'underline', '& .MuiButton-startIcon': { mr: 0.5 } }}
                                                            >
                                                                Edit Match
                                                            </Button>
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (match.archived) { setArchivedActionMatch(match); setArchivedActionOpen(true); }
                                                                    else { handleRequestDeleteMatch(match); }
                                                                }}
                                                                startIcon={match.archived ? <Undo2 size={14} /> : <Trash2 size={14} />}
                                                                sx={{ color: '#fff', justifyContent: 'flex-start', textTransform: 'none', p: 0, ml: '5px', fontSize: '0.6rem', whiteSpace: 'nowrap', textDecoration: 'underline', '& .MuiButton-startIcon': { mr: 0.5 } }}
                                                            >
                                                                {match.archived ? 'Restore' : 'Delete Match'}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                                                            <Crown size={32} color="white" />
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            }

                            // ── Fixtures Card (SCHEDULED) ──
                            return (
                                <Card
                                    key={match.id}
                                    onClick={(e) => handleMatchCardClick(match, e)}
                                    sx={{
                                        position: 'relative',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        background: '#222',
                                        cursor: 'pointer',
                                        border: '2px solid #fff',
                                        '& .MuiCardContent-root': { pb: 0 },
                                        '& .MuiCardContent-root:last-child': { pb: 0 },
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)' },
                                    }}
                                >
                                    {/* Match Title Header */}
                                    <Box sx={{ background: 'white', py: 0.7, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderBottom: '1px solid #e0e0e0' }}>
                                        <Image src={FootBallIcon} alt="Football" width={24} height={24} />
                                        <Typography sx={{ color: 'black', fontFamily: "Woodford Bourne Pro", fontWeight: 700, fontSize: '18px', lineHeight: 1, textTransform: 'capitalize', textDecoration: 'underline', textAlign: 'center' }}>
                                            Match {matchNumber}
                                        </Typography>
                                    </Box>

                                    <CardContent sx={{ p: 0 }}>
                                        {/* Teams & VS */}
                                        <Box sx={{ pl: 1, pr: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #fff' }}>
                                            {/* Home Team */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Image src={match.homeTeamImage || HomeTeamImage} alt={match.homeTeamName || 'Home'} width={65} height={65} style={{ objectFit: 'contain' }} />
                                                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Home</Typography>
                                            </Box>

                                            {/* VS Center */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography sx={{ fontFamily: '"Oswald", sans-serif !important', fontWeight: 600, fontSize: '2rem', lineHeight: 0.5, letterSpacing: '-2px', textTransform: 'uppercase', color: 'white' }}>V/S</Typography>
                                                <Typography sx={{ color: '#ddd', fontSize: '0.85rem', textAlign: 'center', mt: 1 }}>{durationMinutes} Minutes Match</Typography>
                                            </Box>

                                            {/* Away Team */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Image src={match.awayTeamImage || AwayTeamImage} alt={match.awayTeamName || 'Away'} width={65} height={65} style={{ objectFit: 'contain' }} />
                                                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Away</Typography>
                                            </Box>
                                        </Box>

                                        {/* Bottom Info Panel */}
                                        <Box sx={{ display: 'flex' }}>
                                            {/* Left Info Column */}
                                            <Box sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                        <Image src={CalendarImg} alt="Date" width={16} height={16} />
                                                        <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{formatMatchDate(match.date)}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                        <Image src={ClockImg} alt="Time" width={16} height={16} />
                                                        <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{formatMatchTime(match.date)}</Typography>
                                                    </Box>
                                                    <Button
                                                        size="small"
                                                        onClick={(e) => { e.stopPropagation(); setViewTeamMatch({ leagueId: String(match.leagueId), matchId: match.id, matchNumber }); setViewTeamOpen(true); }}
                                                        startIcon={<Image src={ViewTeamImg} alt="View Teams" width={20} height={20} />}
                                                        sx={{ color: 'white', fontSize: '0.65rem', textTransform: 'none', p: 0, minWidth: 'auto', textDecoration: 'underline', whiteSpace: 'nowrap', '&:hover': { color: '#ccc' }, '& .MuiButton-startIcon': { mr: 1 } }}
                                                    >
                                                        View Teams
                                                    </Button>
                                                </Box>
                                                {match.location && (
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                        <Box sx={{ mt: 0.3 }}><Image src={LocationImg} alt="Location" width={18} height={18} /></Box>
                                                        <Typography sx={{ color: '#ccc', fontSize: '0.85rem', lineHeight: 1.3 }}>{formatLocationForCard(match.location)}</Typography>
                                                    </Box>
                                                )}
                                                {isMember && (
                                                    <Box sx={{ display: 'flex', gap: 2, mb: 0 }}>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleToggleAvailability(match.id, false); }}
                                                            disabled={availabilityLoading[match.id] || !league?.active}
                                                            sx={{
                                                                background: '#00af80', color: 'white', textTransform: 'none', fontWeight: 500, fontSize: '0.9rem', py: 0.1, px: 1.5, whiteSpace: 'nowrap', minWidth: '100px',
                                                                boxShadow: isUserAvailable ? '0 0 12px 3px rgba(0, 175, 128, 0.7), 0 0 20px rgba(0, 255, 180, 0.4)' : 'none',
                                                                border: isUserAvailable ? '2px solid #00ffaa' : 'none',
                                                                '&:hover': { background: '#008f6a' }, '&.Mui-disabled': { opacity: 0.5 }
                                                            }}
                                                        >
                                                            {availabilityLoading[match.id] ? <CircularProgress size={16} color="inherit" /> : '✓ Available'}
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleToggleAvailability(match.id, true); }}
                                                            disabled={availabilityLoading[match.id] || !league?.active}
                                                            sx={{
                                                                background: '#c62828', color: 'white', textTransform: 'none', fontWeight: 500, fontSize: '0.9rem', py: 0.1, px: 1.5, whiteSpace: 'nowrap', minWidth: '100px',
                                                                boxShadow: !isUserAvailable ? '0 0 12px 3px rgba(198, 40, 40, 0.7), 0 0 20px rgba(255, 100, 100, 0.4)' : 'none',
                                                                border: !isUserAvailable ? '2px solid #ff6b6b' : 'none',
                                                                '&:hover': { background: '#b71c1c' }, '&.Mui-disabled': { opacity: 0.5 }
                                                            }}
                                                        >
                                                            {availabilityLoading[match.id] ? <CircularProgress size={16} color="inherit" /> : '✕ Unavailable'}
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Right Admin Column */}
                                            <Box sx={{ width: '95px', borderLeft: '2px solid #fff', pl: 1, pr: 2, py: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 2 }}>
                                                {isAdmin ? (
                                                    <>
                                                        <Typography sx={{ color: 'white', fontSize: '0.65rem', textAlign: 'left' }}>For Admin Only</Typography>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); setEditMatchLeagueId(String(match.leagueId)); setEditMatchId(match.id); setEditMatchOpen(true); }}
                                                            disabled={!league?.active}
                                                            startIcon={<Edit size={16} />}
                                                            sx={{ color: '#fff', justifyContent: 'flex-start', textTransform: 'none', p: 0, fontSize: '0.65rem', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' }, '& .MuiButton-startIcon': { mr: 0.5 } }}
                                                        >
                                                            Edit Match
                                                        </Button>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleRequestDeleteMatch(match); }}
                                                            startIcon={<Trash2 size={16} />}
                                                            sx={{ color: '#fff', justifyContent: 'flex-start', textTransform: 'none', p: 0, fontSize: '0.65rem', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' }, '& .MuiButton-startIcon': { mr: 0.5 } }}
                                                        >
                                                            Delete Match
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                                                        <Crown size={32} color="white" />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}

                </Box>
                <MatchDetailModal
                    open={matchDetailModalOpen}
                    onClose={() => setMatchDetailModalOpen(false)}
                    match={selectedMatchDetail}
                />

                {/* Team Modal */}
                <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
                    <DialogTitle>Teams for {selectedMatch?.homeTeamName || selectedMatch?.homeTeam} vs {selectedMatch?.awayTeamName || selectedMatch?.awayTeam}</DialogTitle>
                    <DialogContent>
                        {selectedMatch && (
                            <Box>
                                <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName || selectedMatch.homeTeam}</Typography>
                                <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    {(selectedMatch.homeTeamUsers || []).map((player: User, idx: number) => (
                                        <Box key={player.id || idx}>
                                            <PlayerCard position={''} points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        {selectedMatch && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName || selectedMatch.awayTeam}</Typography>
                                <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    {(selectedMatch.awayTeamUsers || []).map((player: User, idx: number) => (
                                        <Box key={player.id || idx}>
                                            <PlayerCard position={''} points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseTeamModal}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Container>
            <PlayerStatsDialog
                open={statsDialogOpen}
                onClose={() => setStatsDialogOpen(false)}
                onSave={handleSaveStats}
                isSubmitting={isSubmittingStats}
                stats={stats}
                handleStatChange={handleStatChange}
                teamGoals={getMatchGoals()}
            />

            {/* Match Stats Dialog (embedded) */}
            <PlayMatchPagee
                open={matchStatsOpen}
                onClose={() => { setMatchStatsOpen(false); setSelectedMatchIdForDialog(null); setSelectedLeagueIdForDialog(null); }}
                initialLeagueId={selectedLeagueIdForDialog || undefined}
                initialMatchId={selectedMatchIdForDialog || undefined}
                showAdminGoalsSection={shouldShowAdminGoals}
            />

            {/* Edit Match Dialog */}
            <Dialog
                open={editMatchOpen}
                onClose={() => { setEditMatchOpen(false); setEditMatchLeagueId(null); setEditMatchId(null); }}
                 maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#0a0a0a',
                        backgroundImage: 'none',
                        width: '85%',
                        maxHeight: '90vh',
                    }
                }}>
                    {editMatchOpen && editMatchLeagueId && editMatchId && (
                        <EditMatchPage
                            leagueIdProp={editMatchLeagueId}
                            matchIdProp={editMatchId}
                            isDialog
                            onClose={() => { setEditMatchOpen(false); setEditMatchLeagueId(null); setEditMatchId(null); if (selectedLeague) fetchMatchesByLeague(selectedLeague); }}
                        />
                    )}
            </Dialog>

            {/* Results Dialog */}
            <Dialog
                open={resultsDialogOpen}
                onClose={() => { setResultsDialogOpen(false); setResultsMatchId(null); }}
               fullWidth
                            maxWidth="lg"
                            PaperProps={{
                                sx: {
                                    bgcolor: '#0a0a0a',
                                    backgroundImage: 'none',
                                    borderRadius: 3,
                                    maxHeight: '90vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                }
                            }}  >
              
                    <IconButton onClick={() => { setResultsDialogOpen(false); setResultsMatchId(null); }}   sx={{ position: 'absolute', right: 8, top: 8, color: '#fff', zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                        <CloseIcon />
                    </IconButton>
             
                <DialogContent sx={{ p: 0, overflow: 'auto' }}>
                    {resultsDialogOpen && resultsMatchId && (
                        <MatchDetailsPage matchIdProp={resultsMatchId} />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDeleteOpen} onClose={() => { setConfirmDeleteOpen(false); setMatchPendingDelete(null); setMatchHasData(null); }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {matchDeleteChecking ? 'Checking match...' : 'Archive Match'}
                </DialogTitle>
                <DialogContent>
                    {matchDeleteChecking ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2">Checking match data...</Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {'This match will be moved to Archived Matches. You can restore it or permanently delete it later from Archived Match actions.'}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setConfirmDeleteOpen(false); setMatchPendingDelete(null); setMatchHasData(null); }}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleConfirmDeleteMatch}
                        disabled={matchDeleteChecking}
                    >
                        Archive Match
                    </Button>
                </DialogActions>
            </Dialog>





            <Dialog
                open={archivedActionOpen}
                onClose={() => {
                    setArchivedActionOpen(false);
                    setArchivedActionMatch(null);
                    setArchivedActionHasStats(null);
                    setArchivedActionChecking(false);
                    setArchivedActionDeleting(false);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Archived Match Actions</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Choose an action for this archived match.
                    </Typography>
                    {archivedActionChecking && (
                        <Typography variant="body2">Checking deletable status…</Typography>
                    )}
                    {archivedActionHasStats === true && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            This match has player stats. Permanent delete is disabled.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (!archivedActionMatch) return;
                            handleRestoreMatch(archivedActionMatch);
                            setArchivedActionOpen(false);
                        }}
                        startIcon={<Undo2 size={16} />}
                    >
                        Undo
                    </Button>
                    {/* <Tooltip
                                                title={
                                                    archivedActionHasStats ? 'Match has stats. Cannot permanently delete.' : ''
                                                }
                                            >
                                                <span>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        disabled={archivedActionChecking || archivedActionHasStats === true}
                                                        onClick={() => {
                                                            if (!archivedActionMatch) return;
                                                            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
                                                            if (ok) {
                                                                handlePermanentDelete(archivedActionMatch);
                                                                setArchivedActionOpen(false);
                                                            }
                                                        }}
                                                        startIcon={<Trash2 size={16} />}
                                                    >
                                                        Permanently Delete
                                                    </Button>
                                                </span>
                                            </Tooltip> */}
                    {/* // ...existing code... */}
                    {/* <Tooltip
                                                title={
                                                    archivedActionHasStats !== false
                                                        ? 'Match cannot be permanently deleted (stats present or status unknown).'
                                                        : ''
                                                }
                                            >
                                                <span>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        disabled={archivedActionChecking || archivedActionHasStats !== false}
                                                        onClick={() => {
                                                            if (!archivedActionMatch) return;
                                                            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
                                                            if (ok) {
                                                                handlePermanentDelete(archivedActionMatch);
                                                                setArchivedActionOpen(false);
                                                            }
                                                        }}
                                                        startIcon={<Trash2 size={16} />}
                                                    >
                                                        Permanently Delete
                                                    </Button>
                                                </span>
                                            </Tooltip> */}
                    <Tooltip
                        title={
                            archivedActionHasStats === true
                                ? 'Match has player stats. Permanent delete is disabled.'
                                : archivedActionHasStats === null
                                    ? 'Status unknown. Click to check and delete if possible.'
                                    : ''
                        }
                    >
                        <span>
                            <Button
                                variant="contained"
                                color="error"
                                // Disable only while checking, or if we KNOW stats exist
                                disabled={archivedActionChecking || archivedActionDeleting || archivedActionHasStats === true}
                                onClick={() => {
                                    // Re-check if needed, then delete
                                    tryHardDeleteFromDialog();
                                }}
                                startIcon={<Trash2 size={16} />}
                            >
                                {archivedActionDeleting
                                    ? 'Deleting…'
                                    : archivedActionChecking
                                        ? 'Checking…'
                                        : 'Permanently Delete'}
                            </Button>
                        </span>
                    </Tooltip>
                    {/* // ...existing code... */}
                </DialogActions>
            </Dialog>


            <Dialog open={viewTeamOpen} onClose={() => setViewTeamOpen(false)} maxWidth={false} PaperProps={{ sx: { bgcolor: '#2b2b2b', width: '70%', maxWidth: '70%' } }}>
                <DialogTitle sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#d1d1d1',
                    position: 'relative',
                    py: 0.5,
                    minHeight: 0,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '1.8rem' }}>TEAMS</span>
                        <span style={{ fontSize: '1.8rem' }}>&#9917;</span>
                        <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '1.8rem' }}>MATCH {viewTeamMatch?.matchNumber ?? '-'}</span>
                    </Box>
                    <IconButton
                        onClick={() => setViewTeamOpen(false)}
                        size="small"
                        sx={{ color: 'inherit', position: 'absolute', right: 0, top: 0, bottom: 0, width: 56, borderRadius: 0, bgcolor: '#e6e6e6', '&:hover': { bgcolor: '#e6e6e6' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <TeamPreviewScreen leagueId={viewTeamMatch?.leagueId} matchId={viewTeamMatch?.matchId} />
                </DialogContent>
                {/* <DialogActions>
                    <Button onClick={() => setViewTeamOpen(false)}>Close</Button>
                </DialogActions> */}
            </Dialog>

        </Box>
    );
}







// 'use client';
// import { Box, Button, Container, Typography, Paper, MenuItem, Divider, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, CircularProgress, Menu, ListItemIcon, ListItemText, Tooltip, Chip, Alert } from '@mui/material';
// import { Calendar, ChevronDown, Edit, Trash2, Trophy, Undo2 } from 'lucide-react';
// import { useAuth } from '@/lib/hooks';
// import React, { useEffect, useState, useCallback } from 'react';
// import PlayerCard from '@/Components/playercard/playercard';
// import Image from 'next/image';
// import homeTeamIcon from '@/Components/images/matches.png';
// import awayTeamIcon from '@/Components/images/2nd champion icon football.png';
// import { Card, CardContent } from '@mui/material';
// import Link from 'next/link';
// import PlayMatchPagee from '@/Components/matchstatsdialog/MatchStatsDialog';
// import PlayerStatsDialog from '@/Components/PlayerStatsDialog';
// // import { LeaderboardResponse } from '@/types/api';
// import toast from 'react-hot-toast';
// import { useRouter } from 'next/navigation';
// import TeamPreviewScreen from '@/Components/viewteam/viewteam';
// import CloseIcon from '@mui/icons-material/Close';
// import CloseButton from '@/Components/CloseButton';

// // type PlayerStatsMetric = keyof LeaderboardResponse['players'][number];


// interface Match {
//     id: string;
//     homeTeam: string;
//     awayTeam: string;
//     homeScore: number;
//     awayScore: number;
//     matchTime: string;
//     date: string;
//     location?: string;
//     availablePlayers: number;
//     pendingPlayers: number;
//     status: 'SCHEDULED' | 'RESULT_PUBLISHED' | 'RESULT_UPLOADED';
//     leagueId: string;
//     league?: {
//         id: string;
//         name: string;
//     };
//     homeTeamName?: string;
//     awayTeamName?: string;
//     homeTeamUsers?: User[];
//     awayTeamUsers?: User[];
//     availableUsers?: User[];
//     homeTeamGoals?: number;
//     awayTeamGoals?: number;
//     end?: string;
//     start?: string | Date;
//     updatedAt?: string | Date;
//     createdAt?: string | Date;
//     homeTeamImage?: string;
//     awayTeamImage?: string;
//     archived?: boolean;
//     active?: boolean;
// }

// // Normalize status strings coming from API to our expected union
// const normalizeStatus = (s: unknown): Match['status'] => {
//     const t = String(s ?? '').trim().toUpperCase();
//     if (t === 'RESULT_PUBLISHED') return 'RESULT_PUBLISHED';
//     if (t === 'RESULT_UPLOADED') return 'RESULT_UPLOADED';
//     if (t === 'SCHEDULED') return 'SCHEDULED';
//     // Fuzzy fallbacks for inconsistent server values
//     if (t.includes('UPLOAD')) return 'RESULT_UPLOADED';
//     if (t.includes('PUBLISH')) return 'RESULT_PUBLISHED';
//     return 'SCHEDULED';
// };

// // The API may send status as any arbitrary string; all other fields should match Match
// type ApiMatch = Omit<Match, 'status'> & { status?: unknown };

// const normalizeMatch = (m: ApiMatch): Match => ({
//     ...m,
//     status: normalizeStatus(m.status),
// });

// type LeagueComputedStatus = {
//     isComplete?: boolean;
//     locked?: boolean;
//     matchesPlayed?: number;
//     gamesPlayed?: number;
//     maxGames?: number;
//     totalMatches?: number;
//     missing?: Array<unknown>;
//     [key: string]: unknown;
// };

// interface League {
//     id: string;
//     name: string;
//     members?: User[];
//     administrators?: { id: string }[];
//     active?: boolean;
//     matches?: Match[];
//     computedStatus?: LeagueComputedStatus;
//     isLocked?: boolean;
//     isComplete?: boolean;
//     isCompleted?: boolean;
//     updatedAt?: string;
//     createdAt?: string;
//     status?: string;
//     maxGames?: number;
// }

// interface User {
//     id: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     age?: number | string;
//     password?: string;
//     gender?: string;
//     level?: string;
//     joinedLeagues?: League[];
//     managedLeagues?: League[];
//     homeTeamMatches?: Match[];
//     awayTeamMatches?: Match[];
//     availableMatches?: Match[];
//     guestMatch?: Match | null;
//     createdAt?: Date | string;
//     updatedAt?: Date | string;
//     position?: string;
//     style?: string;
//     preferredFoot?: string;
//     shirtNumber?: string;
//     profilePicture?: string | null;
//     positionType: string;
//     skills?: Skills;
//     xp?: number;
// }

// interface Skills {
//     dribbling: number;
//     shooting: number;
//     passing: number;
//     pace: number;
//     defending: number;
//     physical: number;
// }

// interface PlayerCardProps {
//     id: string;
//     name: string;
//     number: string;
//     level: string;
//     stats: {
//         DRI: string;
//         SHO: string;
//         PAS: string;
//         PAC: string;
//         DEF: string;
//         PHY: string;
//     };
//     foot: string;
//     shirtIcon: string;
//     profileImage?: string;
// }

// export default function AllMatches() {
//     const [matches, setMatches] = useState<Match[]>([]);
//     const [leagues, setLeagues] = useState<League[]>([]);
//     const [selectedLeague, setSelectedLeague] = useState<string>('all');
//     const [matchFilter,] = useState<'all' | 'fixtures' | 'results'>('all');
//     const [loading, setLoading] = useState(true);
//     const [teamModalOpen, setTeamModalOpen] = useState(false);
//     const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
//     console.log('selectedMatch', selectedMatch)
//     const { token, user } = useAuth();
//     const [availabilityLoading, setAvailabilityLoading] = useState<{ [key: string]: boolean }>({});
//     const router = useRouter();
    
//     // Persist selection key - same as home page
//     const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';
//     // Helper: determine if a league is completed (exclude from dropdown)
//     const leagueIsCompleted = useCallback((l: League): boolean => {
//         // If there are any missing items (e.g., pending stats), do NOT treat as completed
//         const missingArr = Array.isArray(l?.computedStatus?.missing) ? l.computedStatus!.missing! : [];
//         if (missingArr.length > 0) return false;

//         // If we have counters, prefer them to decide completion:
//         // require matchesPlayed >= maxGames when maxGames is provided (> 0)
//         const toNum = (v: unknown): number | undefined => {
//             const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
//             return Number.isFinite(n) ? n : undefined;
//         };
//         const playedFromComputed = toNum(l?.computedStatus?.matchesPlayed) ?? toNum(l?.computedStatus?.gamesPlayed);
//         const playedFromList = undefined; // not available reliably here
//         const played = playedFromComputed ?? playedFromList;
//         const maxG = toNum(l?.computedStatus?.maxGames) ?? toNum(l?.maxGames);

//         // Ported logic from All Leagues: derive completion from matches list when available
//         if (Array.isArray(l.matches)) {
//             const matches = l.matches ?? [];
//             const completedCount = matches.reduce((acc, m) => {
//                 const status = typeof m.status === 'string' ? m.status.toLowerCase() : '';
//                 const endedByStatus = status === 'completed' || status === 'finished' || status === 'ended';
//                 const endedByFlag = m.active === false;
//                 const endedByEnd = Boolean(m.end);
//                 return acc + (endedByStatus || endedByFlag || endedByEnd ? 1 : 0);
//             }, 0);
//             if (typeof maxG === 'number' && maxG > 0) {
//                 if (completedCount < maxG) return false; // not complete yet
//                 // completed by matches threshold -> consider complete (missing already checked above)
//                 return true;
//             }
//         }

//         if (typeof maxG === 'number' && maxG > 0 && typeof played === 'number') {
//             if (played < maxG) {
//                 // Even if backend flags it completed/locked, do NOT treat as completed until maxGames reached
//                 return false;
//             }
//             // Counters meet threshold and missing is empty -> complete
//             return true;
//         }

//         // Primary: explicit completion flags coming from backend
//         if (l?.computedStatus?.isComplete === true) return true;
//         if (l?.computedStatus?.locked === true) return true;
//         if (l?.isComplete === true) return true;
//         if (l?.isCompleted === true) return true;
//         if (l?.isLocked === true) return true;

//         // Backward-compat: infer completion from status/active when flags are absent
//         const sRaw = (l?.status ?? '').toString();
//         const s = sRaw.trim().toUpperCase();
//         const completionStatuses = new Set([
//             'RESULT_PUBLISHED',
//             'RESULT_UPLOADED',
//             'RESULT_COMPLETE',
//             'RESULT_FINISHED',
//             'RESULT_ENDED',
//             'RESULT_DONE',
//             'COMPLETED'
//         ]);
//         if (completionStatuses.has(s)) return true;
//         if (typeof l?.active === 'boolean' && l.active === false) return true;
//         return false;
//     }, []);

//     const fetchLeagues = useCallback(async () => {
//         try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
//             const data = await response.json();
//             if (data.success && data.user) {
//                 // Get admin league IDs
//                 const adminLeaguesArr = (data.user.adminLeagues || data.user.administeredLeagues || []) as Array<{ id?: string | number }>;

//                 // Combine joined and managed leagues
//                 const userLeagues = [
//                     ...(data.user.leagues || []),
//                     ...adminLeaguesArr
//                 ];

//                 // Remove duplicates
//                 const uniqueLeaguesMap = new Map();
//                 userLeagues.forEach(league => {
//                     const id = String((league as { id?: string | number }).id);
//                     if (!uniqueLeaguesMap.has(id)) {
//                         uniqueLeaguesMap.set(id, league);
//                     }
//                 });

//                 // Fetch detailed info for all leagues in parallel (faster)
//                 const detailedLeagues = await Promise.all(
//                     Array.from(uniqueLeaguesMap.values()).map(async (league) => {
//                         try {
//                             const leagueId = String((league as { id?: string | number }).id);

//                             // Fetch league status and details in parallel
//                             const [statusRes, leagueResponse] = await Promise.all([
//                                 fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/status`, {
//                                     headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
//                                 }),
//                                 fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
//                                     headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
//                                 })
//                             ]);

//                             let matchesFromDetails: Match[] | undefined = undefined;
//                             let maxGamesFromDetails: number | undefined = undefined;
//                             let enrichedLeague = { ...league };

//                             if (leagueResponse.ok) {
//                                 const leagueData = await leagueResponse.json();
//                                 if (leagueData.success && leagueData.league) {
//                                     enrichedLeague = {
//                                         ...league,
//                                         administrators: leagueData.league.administrators,
//                                         members: leagueData.league.members
//                                     };
//                                     const rawMatches = leagueData.league.matches as unknown;
//                                     if (Array.isArray(rawMatches)) {
//                                         matchesFromDetails = rawMatches as Match[];
//                                     }
//                                     if (typeof leagueData.league.maxGames === 'number') {
//                                         maxGamesFromDetails = leagueData.league.maxGames as number;
//                                     }
//                                 }
//                             }

//                             if (statusRes.ok) {
//                                 const statusData = await statusRes.json();
//                                 const raw = (statusData?.status || {}) as Record<string, unknown>;
//                                 const toNum = (v: unknown): number | undefined => {
//                                     const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
//                                     return Number.isFinite(n) ? n : undefined;
//                                 };
//                                 const matchesPlayed = toNum(
//                                     raw?.matchesPlayed ?? raw?.gamesPlayed ?? raw?.played ?? raw?.completedMatches ?? raw?.totalPlayed
//                                 );
//                                 const maxGames = toNum(
//                                     raw?.maxGames ?? raw?.allowedGames ?? raw?.totalGames
//                                 );
//                                 const locked = raw?.locked === true;
//                                 const isComplete = raw?.isComplete === true;
//                                 const missingRaw = raw?.missing as unknown;
//                                 const missing = Array.isArray(missingRaw) ? missingRaw : [];
//                                 const computed: LeagueComputedStatus = {
//                                     ...(raw as LeagueComputedStatus),
//                                     matchesPlayed,
//                                     gamesPlayed: matchesPlayed,
//                                     maxGames,
//                                     locked,
//                                     isComplete,
//                                     missing,
//                                 };
//                                 return {
//                                     ...enrichedLeague,
//                                     computedStatus: computed,
//                                     isLocked: computed?.locked === true,
//                                     maxGames: maxGames ?? maxGamesFromDetails,
//                                     matches: matchesFromDetails,
//                                 } as League;
//                             }

//                             return enrichedLeague as League;
//                         } catch (error) {
//                             console.error(`Error fetching details for league ${(league as { id?: string | number }).id}:`, error);
//                             return league as League;
//                         }
//                     })
//                 );

//                 // Filter out completed leagues
//                 const activeLeagues = detailedLeagues.filter(l => !leagueIsCompleted(l));

//                 // Sort alphabetically by name
//                 activeLeagues.sort((a, b) => {
//                     const an = (a?.name ?? '').toString().trim().toLowerCase();
//                     const bn = (b?.name ?? '').toString().trim().toLowerCase();
//                     if (an < bn) return -1;
//                     if (an > bn) return 1;
//                     return String(a.id).localeCompare(String(b.id));
//                 });

//                 setLeagues(activeLeagues);

//                 // Debug log
//                 try {
//                     if (typeof window !== 'undefined' && detailedLeagues.length) {
//                         console.group('[All Matches] League completion check');
//                         console.log('Total leagues:', detailedLeagues.length);
//                         console.log('Active (not completed):', activeLeagues.length);
//                         console.table(detailedLeagues.map(l => ({
//                             id: l?.id,
//                             name: l?.name,
//                             isComplete: Boolean(l?.isComplete),
//                             locked: Boolean(l?.computedStatus?.locked || l?.isLocked),
//                             matchesPlayed: l?.computedStatus?.matchesPlayed ?? null,
//                             maxGames: l?.computedStatus?.maxGames ?? l?.maxGames ?? null,
//                         })));
//                         console.groupEnd();
//                     }
//                 } catch {}
//             }
//         } catch (error) {
//             console.error('Error fetching leagues:', error);
//         } finally {
//             setLoading(false);
//         }
//     }, [token, leagueIsCompleted]);



//     const fetchMatchesByLeague = useCallback(async (leagueId: string) => {
//         setLoading(true);
//         try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             });
//             if (!response.ok) {
//                 throw new Error(`Server returned ${response.status}: ${response.statusText}`);
//             }
//             const data = await response.json();
//             if (data.success && data.league && data.league.matches) {
//                 const normalized = (data.league.matches as ApiMatch[]).map(normalizeMatch);
//                 setMatches(normalized);
//                 // Update the leagues array to include members for the selected league
//                 setLeagues(prevLeagues => {
//                     const otherLeagues = prevLeagues.filter(l => l.id !== data.league.id);
//                     return [
//                         ...otherLeagues,
//                         {
//                             ...prevLeagues.find(l => l.id === data.league.id),
//                             ...data.league // this will include members, name, etc.
//                         }
//                     ];
//                 });
//             } else {
//                 setMatches([]);
//             }
//         } catch {
//             setMatches([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [token]); // Removed selectedLeague from dependencies

//     useEffect(() => {
//         if (token) {
//             fetchLeagues();
//         }
//     }, [token, fetchLeagues]);

//     // Add this effect for auto-select
//     useEffect(() => {
//         if (leagues.length > 0 && selectedLeague === 'all') {
//             setLoading(true); // Set loading before changing league
//             // Check localStorage for preferred league (same as home page)
//             const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
//             const preferred = storedId ? leagues.find(l => l.id === storedId) : null;
//             setSelectedLeague(preferred ? preferred.id : leagues[0].id);
//         }
//     }, [leagues, selectedLeague]);

//     // Fetch matches whenever selected league changes

//     useEffect(() => {
//         if (token && selectedLeague !== 'all') {
//             fetchMatchesByLeague(selectedLeague);
//         } else if (selectedLeague === 'all') {
//             setMatches([]); // Clear matches when "All Leagues" is selected
//             setLoading(false);
//         }
//     }, [selectedLeague, token, fetchMatchesByLeague]);

//     // Get the name of the selected league for display
//     const selectedLeagueName = selectedLeague === 'all'
//         ? 'All Leagues'
//         : leagues.find(league => league.id === selectedLeague)?.name || '';

//     // const handleOpenTeamModal = (match: Match) => {
//     //     setSelectedMatch(match);
//     //     setTeamModalOpen(true);
//     // };

//     const handleCloseTeamModal = () => {
//         setTeamModalOpen(false);
//         setSelectedMatch(null);
//     };

//     // Helper to map player object to PlayerCardProps
//     const mapPlayerToCardProps = (player: User): PlayerCardProps => {
//         const props: PlayerCardProps = {
//             id: player.id,
//             name: (player.firstName || '') + ' ' + (player.lastName || ''),
//             number: player?.shirtNumber || '10',
//             level: player?.level || '',
//             stats: {
//                 DRI: player?.skills?.dribbling?.toString() || '',
//                 SHO: player?.skills?.shooting?.toString() || '',
//                 PAS: player?.skills?.passing?.toString() || '',
//                 PAC: player?.skills?.pace?.toString() || '',
//                 DEF: player?.skills?.defending?.toString() || '',
//                 PHY: player?.skills?.physical?.toString() || ''
//             },
//             foot: player?.preferredFoot === 'right' ? 'R' : 'L',
//             profileImage: player?.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : `/${player.profilePicture}`}`) : undefined,
//             shirtIcon: ''
//         };
//         console.log('mapPlayerToCardProps input:', player);
//         console.log('mapPlayerToCardProps output:', props);
//         return props;
//     };

//     const getAvailabilityCounts = (match: Match) => {
//         // Find the league for this match
//         const leagueForMatch = leagues.find(l => l.id === match.leagueId);
//         const leagueMembers = leagueForMatch?.members || [];
//         // Count how many league members are in availableUsers
//         const availableCount = leagueMembers.filter(member =>
//             match.availableUsers?.some((u: User) => u.id === member.id)
//         ).length;
//         const pendingCount = leagueMembers.length - availableCount;
//         return { availableCount, pendingCount };
//     };
//     const [, setError] = useState<string | null>(null);
//     const [league, setLeague] = useState<League | null>(null);
//     const [, setToastMessage] = useState<string | null>(null);
//     const [isSubmittingStats, setIsSubmittingStats] = React.useState(false);
//     const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
//     const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);
//     // View team modal state (used in buttons below)
//     const [viewTeamOpen, setViewTeamOpen] = useState(false);
//     const [viewTeamMatch, setViewTeamMatch] = useState<{ leagueId: string; matchId: string } | null>(null);



//     const fetchLeagueDetails = useCallback(async (suppressLoading: boolean = false) => {
//         if (!suppressLoading) setLoading(true);
//         try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague}`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });

//             const data = await response.json();
//             if (data.success) {
//                 console.log('Server Response - League Data:', data.league);
//                 console.log('Server Response - Matches:', data.league.matches);
//                 if (data.league.matches) {
//                     data.league.matches.forEach((match: Match, index: number) => {
//                         console.log(`Match ${index + 1} End Time:`, match.end);
//                     });
//                 }
//                 setLeague(data.league);
//             } else {
//                 setError(data.message || 'Failed to fetch league details');
//             }
//         } catch (error) {
//             console.error('Error fetching league details:', error);
//             setError('Failed to fetch league details');
//         } finally {
//             if (!suppressLoading) setLoading(false);
//         }
//     }, [selectedLeague, token]);

//     const handleSaveStats = async () => {
//         if (!activeMatchId || !token) return;

//         setIsSubmittingStats(true);
//         try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${activeMatchId}/stats`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     goals: stats.goals,
//                     assists: stats.assists,
//                     cleanSheets: stats.cleanSheets,
//                     penalties: stats.penalties,
//                     freeKicks: stats.freeKicks,
//                     defence: stats.defence,
//                     impact: stats.impact,
//                 }),
//             });

//             // Check if endpoint exists (not 404 or 405)
//             if (response.status === 404 || response.status === 405) {
//                 // Endpoint doesn't exist, show error message
//                 console.error('Stats saving is not available yet. Please contact the administrator.');
//                 setStatsDialogOpen(false);
//                 return;
//             }

//             const data = await response.json();
//             if (data.success) {
//                 // Update leaderboard with new stats (direct state update, no cache)
//                 if (data.updatedStats) {
//                     // Stats updated successfully
//                     console.log('Stats updated:', data.updatedStats);
//                 }
//                 setStatsDialogOpen(false);
                
//                 // Auto-refresh matches after 1 second to get latest data
//                 setTimeout(() => {
//                     if (selectedLeague && selectedLeague !== 'all') {
//                         fetchMatchesByLeague(selectedLeague);
//                     }
//                 }, 1000);
                
//                 // Optionally show a success message
//                 toast.success('Stats saved successfully');
//             }
//         } catch (err: unknown) {
//             console.error(err instanceof Error ? err.message : String(err));
//         } finally {
//             setIsSubmittingStats(false);
//         }
//     };

//     const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
//         setStats(prev => {
//             const newValue = Math.max(0, (prev[stat] || 0) + increment);
//             return { ...prev, [stat]: Math.min(newValue, max) };
//         });
//     };


//     const getMatchGoals = () => {
//         if (!activeMatchId || !league) return 10; // Default fallback
//         const match = league.matches?.find(m => m.id === activeMatchId);
//         if (!match) return 10;
//         return (match.homeTeamGoals || 0) + (match.awayTeamGoals || 0);
//     };

//     useEffect(() => {
//         if (selectedLeague && token && selectedLeague !== 'all') {
//             fetchLeagueDetails();
//         }
//     }, [selectedLeague, token, fetchLeagueDetails]);
//     const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
//         if (!token) {
//             setError('Please login to mark availability');
//             return;
//         }
//         setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
//         const action = isAvailable ? 'unavailable' : 'available';
//         try {
//             const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
//             const response = await fetch(`${apiUrl}/matches/${matchId}/availability?action=${action}`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                 },
//             });
//             if (!response.ok) {
//                 throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
//             }
//             const data = await response.json();
//             if (data.success && data.match) {
//                 // Update the matches array directly (no cache)
//                 setMatches(prevMatches => prevMatches.map(m =>
//                     m.id === matchId ? { ...m, availableUsers: data.match.availableUsers } : m
//                 ));
//                 setToastMessage(action === 'available' ? 'You are now available for this match.' : 'You are now unavailable for this match.');
                
//                 // Auto-refresh matches after 1 second to get latest data
//                 setTimeout(() => {
//                     if (selectedLeague && selectedLeague !== 'all') {
//                         fetchMatchesByLeague(selectedLeague);
//                     }
//                 }, 1000);
//             } else {
//                 setToastMessage('Availability updated.');
//             }
//         } catch (err: unknown) {
//             const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
//             setError(errorMessage || 'Failed to connect to server');
//         } finally {
//             setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
//         }
//     };

//     const [statsDialogOpen, setStatsDialogOpen] = React.useState(false);
//     const [activeMatchId,] = React.useState<string | null>(null);
//     const [stats, setStats] = React.useState({
//         goals: 0,
//         assists: 0,
//         cleanSheets: 0,
//         penalties: 0,
//         freeKicks: 0,
//         defence: 0,
//         impact: 0,
//     });

//     const formatMatchDate = (dateString: string) => {
//         const matchDate = new Date(dateString);
//         const today = new Date();
//         const yesterday = new Date(today);
//         yesterday.setDate(yesterday.getDate() - 1);

//         // Reset time to compare only dates
//         const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
//         const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//         const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

//         if (matchDateOnly.getTime() === todayOnly.getTime()) {
//             return 'Today';
//         } else if (matchDateOnly.getTime() === yesterdayOnly.getTime()) {
//             return 'Yesterday';
//         } else {
//             return matchDate.toLocaleDateString('en-GB', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric'
//             });
//         }
//     };

//     const formatMatchName = (name: string): string => {
//         if (!name) return '';
//         const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
//         return `${capitalizedName}`;
//     };
//     const formatMatchTime = (dateString: string) => {
//         const date = new Date(dateString);
//         return date.toLocaleTimeString('en-US', {
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: true
//         });
//     };


//     const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
//         setLeaguesDropdownAnchor(event.currentTarget);
//         setLeaguesDropdownOpen(true);
//     };

//     const handleLeaguesDropdownClose = () => {
//         setLeaguesDropdownOpen(false);
//         setLeaguesDropdownAnchor(null);
//     };

//     const formatLeagueName = (name: string): string => {
//         if (!name) return '';

//         // Capitalize first letter of the name
//         const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

//         // Get first letter of each word and join them
//         const words = name.split(' ');
//         const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

//         // Return formatted name with initials in brackets
//         return `${capitalizedName} (${initials})`;
//     };

//     // Sort helper: prefer numeric match index descending, fallback to latest date
//     const getNumericIndex = (m: Match): number | undefined => {
//         const keys = ['matchNumber', 'match_no', 'matchIndex', 'index', 'matchNo', 'no'] as const;
//         const rec = m as unknown as Record<string, unknown>;
//         for (const k of keys) {
//             const v = rec[k];
//             if (typeof v === 'number' && !Number.isNaN(v)) return v;
//             if (typeof v === 'string') {
//                 const n = parseInt(v, 10);
//                 if (!Number.isNaN(n)) return n;
//             }
//         }
//         return undefined;
//     };

//     const getBestDateMs = (m: Match): number => {
//         const candidates: Array<string | Date | undefined | null> = [m.date, m.end, m.start, m.updatedAt, m.createdAt];
//         for (const c of candidates) {
//             if (!c) continue;
//             const t = new Date(c).getTime();
//             if (!Number.isNaN(t)) return t;
//         }
//         return 0;
//     };

//     const compareMatchesDesc = (a: Match, b: Match): number => {
//         const ai = getNumericIndex(a);
//         const bi = getNumericIndex(b);
//         if (ai !== undefined && bi !== undefined) return bi - ai; // larger index first
//         if (ai !== undefined) return -1; // known index before unknown
//         if (bi !== undefined) return 1;
//         // fallback to date: latest first
//         return getBestDateMs(b) - getBestDateMs(a);
//     };

//     const sortedMatches = React.useMemo(() => {
//         return [...matches].sort(compareMatchesDesc);
//     }, [matches]);

//     // Filter matches based on selected filter
//     const filteredMatches = React.useMemo(() => {
//         if (matchFilter === 'fixtures') {
//             // Show only SCHEDULED matches
//             return sortedMatches.filter(m => m.status === 'SCHEDULED');
//         }
//         if (matchFilter === 'results') {
//             // Show only completed matches (RESULT_PUBLISHED or RESULT_UPLOADED)
//             return sortedMatches.filter(m => m.status === 'RESULT_PUBLISHED' || m.status === 'RESULT_UPLOADED');
//         }
//         // 'all' - show everything
//         return sortedMatches;
//     }, [sortedMatches, matchFilter]);

//     const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
//     // const isAdmin = league && league.administrators && user && league.administrators.some((a: User) => a.id === user.id);

//     // Replace handleLeagueSelect to only update state and close the menu
//     const handleLeagueSelect = (selectedLeagueId: string) => {
//         if (selectedLeagueId !== selectedLeague) {
//             // Persist preference so other pages/components (e.g., Match Stats Dialog) can auto-select this league
//             try { if (typeof window !== 'undefined') localStorage.setItem(PREFERRED_LEAGUE_KEY, String(selectedLeagueId)); } catch {}
//             setSelectedLeague(selectedLeagueId);
//             setLoading(true); // effects will fetch matches and league details
//         }
//         handleLeaguesDropdownClose();
//     };

//     // Keep the selected league at the top of the dropdown
//     const sortedLeagues = React.useMemo(() => {
//         if (!leagues?.length) return [];
//         const arr = [...leagues];
//         const idx = arr.findIndex(l => l.id === selectedLeague);
//         if (idx > 0) {
//             const [sel] = arr.splice(idx, 1);
//             arr.unshift(sel);
//         }
//         return arr;
//     }, [leagues, selectedLeague]);

//     const [archivedActionMatch, setArchivedActionMatch] = useState<Match | null>(null);
//     const [archivedActionOpen, setArchivedActionOpen] = useState(false);
//     const [, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);

//     const [archivedActionChecking, setArchivedActionChecking] = useState(false);
//     const [archivedActionDeleting, setArchivedActionDeleting] = useState(false);
//     const [archivedActionHasStats, setArchivedActionHasStats] = useState<boolean | null>(null);

//     const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
//     const [matchPendingDelete, setMatchPendingDelete] = useState<Match | null>(null);

//     const [matchDetailModalOpen, setMatchDetailModalOpen] = useState(false);
//     const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);

//     const handleRequestDeleteMatch = (match: Match) => {
//         setMatchPendingDelete(match);
//         setConfirmDeleteOpen(true);
//     };

//     // When the archived actions dialog opens, automatically check if the match has stats
//     // (placed after getHasStats declaration to avoid 'used before declaration')


//     const handleConfirmDeleteMatch = async () => {
//         if (!matchPendingDelete || !token || !league) return;
//         const m = matchPendingDelete;
//         setConfirmDeleteOpen(false);

//         const hasScores = (m.homeTeamGoals ?? 0) > 0 ||
//             (m.awayTeamGoals ?? 0) > 0 ||
//             ((m.status ?? '') === 'RESULT_PUBLISHED');

//         try {
//             if (hasScores) {
//                 // Archive the match
//                 const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
//                     method: 'PATCH',
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({ archived: true })
//                 });

//                 if (!res.ok) {
//                     const errorData = await res.text();
//                     console.error('Archive failed:', errorData);
//                     throw new Error('Failed to archive match');
//                 }

//                 const data = await res.json();
//                 console.log('Archive response:', data); // Debug log

//                 // Update local state (league.matches and matches list)
//                 setLeague(prev => prev ? {
//                     ...prev,
//                     matches: (prev.matches ?? []).map(mm =>
//                         mm.id === m.id ? { ...mm, archived: true } : mm
//                     )
//                 } : prev);

//                 setMatches(prev => prev.map(mm => mm.id === m.id ? { ...mm, archived: true } : mm));

//                 setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
//                 setToastMessage('Match archived (Canceled by Admin)');

//             } else {
//                 // Hard delete
//                 const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
//                     method: 'DELETE',
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (!res.ok) throw new Error('Failed to delete match');

//                 setLeague(prev => prev ? {
//                     ...prev,
//                     matches: (prev.matches ?? []).filter(mm => mm.id !== m.id)
//                 } : prev);

//                 setMatches(prev => prev.filter(mm => mm.id !== m.id));

//                 setUndoInfo({ match: m, action: 'delete' });
//                 setToastMessage('Match deleted permanently');
//             }

//             // Refresh league data to ensure sync without global spinner
//             fetchLeagueDetails(true);
            
//             // Also refresh matches list
//             setTimeout(() => {
//                 if (selectedLeague && selectedLeague !== 'all') {
//                     fetchMatchesByLeague(selectedLeague);
//                 }
//             }, 1000);

//         } catch (e) {
//             console.error('Delete/Archive operation failed:', e);
//             toast.error(`Failed to ${hasScores ? 'archive' : 'delete'} match`);
//         } finally {
//             setMatchPendingDelete(null);
//         }
//     };
//     const getHasStats = useCallback(async (matchId: string): Promise<boolean> => {
//         if (!token) return true; // default safe
//         try {
//             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/has-stats`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (!res.ok) return true;
//             const data = await res.json();
//             return !!data.hasStats;
//         } catch {
//             return true; // safe default
//         }
//     }, [token]);


//     const handlePermanentDelete = async (match: Match) => {
//         // if (!window.confirm('Are you sure you want to PERMANENTLY delete this match? This action cannot be undone and all match data will be lost forever.')) {
//         //     return;
//         // }

//         try {
//             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (res.status === 400) {
//                 // Backend says cannot delete (likely stats exist)
//                 let msg = 'Cannot permanently delete this match. It may have player stats.';
//                 try {
//                     const err = await res.json();
//                     if (err?.message) msg = err.message;
//                 } catch { }
//                 toast.error(msg);
//                 setArchivedActionHasStats(true);
//                 return;
//             }

//             if (!res.ok) {
//                 throw new Error('Failed to permanently delete match');
//             }

//             setLeague(prev => prev ? {
//                 ...prev,
//                 matches: (prev.matches ?? []).filter(mm => mm.id !== match.id)
//             } : prev);

//             setMatches(prev => prev.filter(mm => mm.id !== match.id));

//             toast.success('Match permanently deleted');
//             fetchLeagueDetails(true);

//         } catch (error) {
//             console.error('Permanent delete failed:', error);
//             toast.error('Failed to permanently delete match');
//         }
//     };


//     const tryHardDeleteFromDialog = useCallback(async () => {
//         if (!archivedActionMatch || archivedActionDeleting) return;

//         // If already confirmed no stats, proceed immediately to delete
//         if (archivedActionHasStats === false) {
//             const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
//             if (ok) {
//                 try {
//                     setArchivedActionDeleting(true);
//                     await handlePermanentDelete(archivedActionMatch);
//                     setArchivedActionOpen(false);
//                 } finally {
//                     setArchivedActionDeleting(false);
//                 }
//             }
//             return;
//         }

//         // Unknown or previously blocked: re-check now
//         setArchivedActionChecking(true);
//         try {
//             const hasStats = await getHasStats(archivedActionMatch.id);
//             setArchivedActionHasStats(hasStats);

//             if (hasStats) {
//                 toast.error('Player stats exist. Permanent delete is disabled.');
//                 return;
//             }

//             const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
//             if (ok) {
//                 try {
//                     setArchivedActionDeleting(true);
//                     await handlePermanentDelete(archivedActionMatch);
//                     setArchivedActionOpen(false);
//                 } finally {
//                     setArchivedActionDeleting(false);
//                 }
//             }
//         } finally {
//             setArchivedActionChecking(false);
//         }
//     }, [archivedActionMatch, archivedActionHasStats, archivedActionDeleting, getHasStats, handlePermanentDelete]);


//     const handleRestoreMatch = async (match: Match) => {
//         try {
//             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ archived: false })
//             });

//             if (!res.ok) {
//                 throw new Error('Failed to restore match');
//             }

//             // Update local state (league.matches and matches list)
//             setLeague(prev => prev ? {
//                 ...prev,
//                 matches: (prev.matches ?? []).map(mm =>
//                     mm.id === match.id ? { ...mm, archived: false } : mm
//                 )
//             } : prev);

//             setMatches(prev => prev.map(mm => mm.id === match.id ? { ...mm, archived: false } : mm));

//             toast.success('Match restored successfully');
//             fetchLeagueDetails(true);
            
//             // Also refresh matches list
//             setTimeout(() => {
//                 if (selectedLeague && selectedLeague !== 'all') {
//                     fetchMatchesByLeague(selectedLeague);
//                 }
//             }, 1000);

//         } catch (error) {
//             console.error('Restore failed:', error);
//             toast.error('Failed to restore match');
//         }
//     };



//     const MatchDetailModal = ({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match | null }) => {
//         if (!match) return null;

//         return (
//             <Dialog
//                 open={open}
//                 onClose={onClose}
//                 fullWidth
//                 maxWidth="md" // Changed to md for more width
//                 PaperProps={{
//                     sx: {
//                         bgcolor: 'rgba(15,15,15,0.95)',
//                         color: '#E5E7EB',
//                         borderRadius: 3,
//                         border: '1px solid rgba(255,255,255,0.1)',
//                         backdropFilter: 'blur(20px)',
//                         boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
//                         overflow: 'hidden',
//                     },
//                 }}
//             >
//                 <DialogTitle
//                     sx={{
//                         fontWeight: 'bold',
//                         position: 'relative',
//                         color: '#E5E7EB',
//                         background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
//                         borderBottom: '1px solid rgba(255,255,255,0.1)',
//                         py: 2.5
//                     }}
//                 >
//                     Match Details
//                     <IconButton
//                         aria-label="close"
//                         onClick={onClose}
//                         sx={{
//                             position: 'absolute',
//                             right: 8,
//                             top: 8,
//                             color: '#9CA3AF',
//                             '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
//                         }}
//                     >
//                         <CloseIcon />
//                     </IconButton>
//                 </DialogTitle>

//                 <DialogContent sx={{ p: 0 }}>
//                     {/* Match Header - Teams Side by Side */}
//                     <Box sx={{
//                         p: 3,
//                         background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
//                         color: 'white'
//                     }}>
//                         {/* Teams in a row layout */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
//                             {/* Home Team */}
//                             <Box sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: 2,
//                                 flex: 1,
//                                 minWidth: 0 // Prevent overflow
//                             }}>
//                                 <Image
//                                     src={match.homeTeamImage || homeTeamIcon}
//                                     alt={match.homeTeamName || ''}
//                                     width={40}
//                                     height={40}
//                                     style={{ borderRadius: '6px', flexShrink: 0 }}
//                                 />
//                                 <Box sx={{ minWidth: 0, flex: 1 }}>
//                                     <Typography
//                                         variant="h6"
//                                         sx={{
//                                             fontWeight: 'bold',
//                                             fontSize: { xs: '1rem', sm: '1.25rem' },
//                                             overflow: 'hidden',
//                                             textOverflow: 'ellipsis',
//                                             whiteSpace: 'nowrap'
//                                         }}
//                                     >
//                                         {formatMatchName(match.homeTeamName || '')}
//                                     </Typography>
//                                     <Typography
//                                         variant="body2"
//                                         sx={{
//                                             opacity: 0.8,
//                                             fontSize: '0.8rem'
//                                         }}
//                                     >
//                                         Home
//                                     </Typography>
//                                 </Box>
//                             </Box>

//                             {/* Score Section */}
//                             <Box sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: 2,
//                                 flexShrink: 0
//                             }}>
//                                 {match.status === 'RESULT_PUBLISHED' && (
//                                     <Box sx={{
//                                         display: 'flex',
//                                         alignItems: 'center',
//                                         gap: 1,
//                                         backgroundColor: 'rgba(255,255,255,0.15)',
//                                         px: 2,
//                                         py: 1,
//                                         borderRadius: 2
//                                     }}>
//                                         <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
//                                             {match.homeTeamGoals || 0}
//                                         </Typography>
//                                         <Typography variant="h6" sx={{ opacity: 0.7 }}>
//                                             -
//                                         </Typography>
//                                         <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
//                                             {match.awayTeamGoals || 0}
//                                         </Typography>
//                                     </Box>
//                                 )}
//                                 {match.status === 'SCHEDULED' && (
//                                     <Box sx={{
//                                         backgroundColor: 'rgba(255,255,255,0.2)',
//                                         px: 2,
//                                         py: 1,
//                                         borderRadius: 2
//                                     }}>
//                                         <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                                             VS
//                                         </Typography>
//                                     </Box>
//                                 )}
//                             </Box>

//                             {/* Away Team */}
//                             <Box sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: 2,
//                                 flex: 1,
//                                 flexDirection: 'row-reverse', // Reverse order for visual balance
//                                 minWidth: 0
//                             }}>
//                                 <Image
//                                     src={match.awayTeamImage || awayTeamIcon}
//                                     alt={match.awayTeamName || ''}
//                                     width={40}
//                                     height={40}
//                                     style={{ borderRadius: '6px', flexShrink: 0 }}
//                                 />
//                                 <Box sx={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
//                                     <Typography
//                                         variant="h6"
//                                         sx={{
//                                             fontWeight: 'bold',
//                                             fontSize: { xs: '1rem', sm: '1.25rem' },
//                                             overflow: 'hidden',
//                                             textOverflow: 'ellipsis',
//                                             whiteSpace: 'nowrap'
//                                         }}
//                                     >
//                                         {formatMatchName(match.awayTeamName || '')}
//                                     </Typography>
//                                     <Typography
//                                         variant="body2"
//                                         sx={{
//                                             opacity: 0.8,
//                                             fontSize: '0.8rem'
//                                         }}
//                                     >
//                                         Away
//                                     </Typography>
//                                 </Box>
//                             </Box>
//                         </Box>
//                     </Box>

//                     {/* Match Info */}
//                     <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//                         {/* Date & Time */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                             <Calendar size={20} color="#E5E7EB" />
//                             <Box>
//                                 <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
//                                     Date & Time
//                                 </Typography>
//                                 <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
//                                     {formatMatchDate(match.date)} at {formatMatchTime(match.date)}
//                                 </Typography>
//                             </Box>
//                         </Box>

//                         {/* Location */}
//                         {match?.location && (
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                                 <Box sx={{
//                                     width: 20,
//                                     height: 20,
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center'
//                                 }}>
//                                     📍
//                                 </Box>
//                                 <Box>
//                                     <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
//                                         Location
//                                     </Typography>
//                                     <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
//                                         {match?.location}
//                                     </Typography>
//                                 </Box>
//                             </Box>
//                         )}

//                         {/* Status */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                             <Box sx={{
//                                 width: 20,
//                                 height: 20,
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center'
//                             }}>
//                                 {match.status === 'RESULT_PUBLISHED' ? '✅' : match.status === 'RESULT_UPLOADED' ? '⌛' : '⏰'}
//                             </Box>
//                             <Box>
//                                 <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
//                                     Status
//                                 </Typography>
//                                 <Chip
//                                     label={match.status === 'RESULT_PUBLISHED' ? 'RESULT_PUBLISHED' : match.status === 'RESULT_UPLOADED' ? 'Awaiting Confirmation' : 'SCHEDULED'}
//                                     size="small"
//                                     sx={{
//                                         backgroundColor: match.status === 'RESULT_PUBLISHED' ? '#16a34a' : match.status === 'RESULT_UPLOADED' ? '#ea580c' : '#0388E3',
//                                         color: 'white',
//                                         fontWeight: 'bold',
//                                         fontSize: '0.75rem'
//                                     }}
//                                 />
//                             </Box>
//                         </Box>

//                         {/* Availability Info for Scheduled Matches */}
//                         {match.status === 'SCHEDULED' && (
//                             <Box sx={{
//                                 mt: 2,
//                                 p: 2,
//                                 backgroundColor: 'rgba(255,255,255,0.05)',
//                                 borderRadius: 2,
//                                 border: '1px solid rgba(255,255,255,0.1)'
//                             }}>
//                                 <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
//                                     Player Availability
//                                 </Typography>
//                                 <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//                                     <Chip
//                                         label={`Available: ${getAvailabilityCounts(match).availableCount}`}
//                                         size="small"
//                                         sx={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}
//                                     />
//                                     <Chip
//                                         label={`Pending: ${getAvailabilityCounts(match).pendingCount}`}
//                                         size="small"
//                                         sx={{ backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' }}
//                                     />
//                                 </Box>
//                             </Box>
//                         )}
//                     </Box>
//                 </DialogContent>

//                 <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
//                     <Button
//                         onClick={onClose}
//                         variant="outlined"
//                         sx={{
//                             color: '#E5E7EB',
//                             borderColor: 'rgba(255,255,255,0.2)',
//                             '&:hover': {
//                                 backgroundColor: 'rgba(255,255,255,0.05)',
//                                 borderColor: 'rgba(255,255,255,0.3)'
//                             }
//                         }}
//                     >
//                         Close
//                     </Button>
//                     <Link href={`/match/${match.id}`} passHref>
//                         <Button
//                             variant="contained"
//                             sx={{
//                                 backgroundColor: '#0388E3',
//                                 '&:hover': { backgroundColor: '#0369a1' }
//                             }}
//                         >
//                             View Full Details
//                         </Button>
//                     </Link>
//                 </DialogActions>
//             </Dialog>
//         );
//     };

//     const handleMatchCardClick = (match: Match, event: React.MouseEvent) => {
//         // Prevent opening modal if clicking on buttons
//         const target = event.target as HTMLElement;
//         const isButton = target.closest('button') || target.closest('a');

//         if (!isButton) {
//             setSelectedMatchDetail(match);
//             setMatchDetailModalOpen(true);
//         }
//     };

//     // Open Match Stats modal instead of navigating for play actions
//     const [matchStatsOpen, setMatchStatsOpen] = React.useState(false);
//     const [selectedMatchIdForDialog, setSelectedMatchIdForDialog] = React.useState<string | null>(null);
//     const [selectedLeagueIdForDialog,] = React.useState<string | null>(null);
//     const [shouldShowAdminGoals, setShouldShowAdminGoals] = React.useState(false);


//     return (
//         <Box
//             sx={{
//                 minHeight: '100vh',
//                 // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
//                 // backgroundColor:'white',
//                 py: 4,
//             }}
//         >
//             <Container maxWidth="lg">

//                 {/* <Button
//                     startIcon={<ArrowLeft />}
//                     onClick={handleBackToDashboard}
//                     sx={{
//                         mb: 2, color: 'white', backgroundColor: '#1f673b',
//                         '&:hover': { backgroundColor: '#388e3c' },
//                     }}
//                 >
//                     Back to Dashboard
//                 </Button> */}
//                 {/* Close Button */}
//                 <CloseButton fallbackRoute="/dashboard" />
//                 <Box sx={{ mb: { xs: 3, md: 5 } }}>
//                     {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 } }}> */}
//                     <Typography variant="h3" sx={{
//                         // mb: { xs: 3, md: 4 },
//                         color: 'black',
//                         // fontFamily: 'Arial Black, Arial, sans-serif',
//                         fontFamily: '"Anton", sans-serif',
//                         fontWeight: 'semibold',
//                         fontSize: { xs: '32px', sm: '42px', md: '56px' },
//                         textAlign: { xs: 'center', md: 'left' },
//                         textTransform: 'uppercase',
//                         letterSpacing: '2px',
//                         textShadow: '0 2px 4px rgba(0,0,0,0.3)'
//                     }}
//                         className='all-leagues-heading'
//                     >
//                         ALL MATCHES
//                     </Typography>

//                     {/* </Box> */}
//                     {/* Create/Join League Section */}
//                     <Box sx={{
//                         display: 'flex',
//                         gap: { xs: 2, md: 3 },
//                         mb: { xs: 3, md: 5 },
//                         flexWrap: 'wrap',
//                         flexDirection: { xs: 'column', sm: 'row' },
//                         alignItems: { xs: 'stretch', sm: 'center' }
//                     }}>

//                         <Box sx={{
//                             display: 'flex',
//                             gap: { xs: 1, md: 2 },
//                             width: { xs: '100%', sm: '1' },
//                             alignItems: 'center',
//                             flexDirection: { xs: 'column', sm: 'row' }
//                         }}>
//                             <Button
//                                 variant="contained"
//                                 // onClick={() => setIsDialogOpen(true)}
//                                 sx={{
//                                     bgcolor: '#0388E3',
//                                     color: 'white',
//                                     fontFamily: 'Arial, Helvetica, sans-serif',
//                                     fontWeight: 'bold',
//                                     fontSize: { xs: '14px', sm: '16px', md: '18px' },
//                                     '&:hover': { bgcolor: '#0388E3' },
//                                     width: { xs: '100%', sm: 'fit-content' },
//                                     borderRadius: 2,
//                                     py: { xs: 1.5, md: 1 },
//                                     px: { xs: 3, md: 3 },
//                                     boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//                                     border: '1px solid rgba(255,255,255,0.1)',
//                                     textTransform: 'none'
//                                 }}
//                             >
//                                 <Link href={`/league/${league?.id}/match`}>
//                                     Create New Match
//                                 </Link>
//                             </Button>
//                             {/* <TextField
//                                 label="Enter invite code"
//                                 value={inviteCode}
//                                 onChange={(e) => setInviteCode(e.target.value)}
//                                 sx={{
//                                   flex: 1,
//                                   width: { xs: '100%', sm: 'auto' },
//                                   '& .MuiOutlinedInput-root': {
//                                     color: 'black',
//                                     backgroundColor: 'rgba(255,255,255,0.1)',
//                                     borderRadius: 2,
//                                     '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', border: '2px solid green' },
//                                     '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)', border: '2px solid green' },
//                                     '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.8)', border: '2px solid green' },
//                                   },
//                                   '& .MuiInputLabel-root': { color: 'green' },
                                  
//                                 }}
//                               /> */}
//                             {/* <TextField
//                                 label="Enter invite code"
//                                 // value={inviteCode}
//                                 // onChange={(e) => setInviteCode(e.target.value)}
//                                 size="medium"
//                                 sx={{
//                                   flex: 1,
//                                   width: { xs: '100%', sm: 'auto' },
//                                   '& .MuiOutlinedInput-root': {
//                                     color: 'black',
//                                     backgroundColor: 'rgba(255,255,255,0.1)',
//                                     borderRadius: 2,
//                                     padding: '0', // Remove extra padding
//                                     '& input': {
//                                       padding: '13px 12px', // Reduce input height
//                                     },
//                                     '& fieldset': { borderColor: '#404040', border: '1px solid #404040' },
//                                     '&:hover fieldset': { borderColor: '#404040', border: '1px solid #404040' },
//                                     '&.Mui-focused fieldset': { borderColor: '#404040', border: '1px solid #404040' },
//                                   },
//                                   '& .MuiInputLabel-root': { color: '#8C8C8C' },
//                                 }}
//                               /> */}
//                             {league ? (
//                                 <Button
//                                     onClick={handleLeaguesDropdownOpen}
//                                     sx={{
//                                         textTransform: 'uppercase',
//                                         fontSize: { xs: '1rem', sm: '1.5rem', md: '1.4rem' },
//                                         fontWeight: 'bold',
//                                         lineHeight: 1.2,
//                                         wordBreak: 'break-word',
//                                         overflow: 'hidden',
//                                         textOverflow: 'ellipsis',
//                                         whiteSpace: 'wrap',
//                                         flexShrink: 1,
//                                         minWidth: 0,
//                                         textAlign: { xs: 'left', md: 'left' },
//                                         color: 'white',
//                                         backgroundColor: '#2B2B2B',
//                                         borderRadius: 2,
//                                         px: 2,
//                                         py: 1,
//                                         '&:hover': {
//                                             backgroundColor: '#2B2B2B',
//                                         },
//                                         display: 'flex',
//                                         alignItems: 'center',
//                                         gap: 1,
//                                         // border: '1px solid rgba(255,255,255,0.3)',
//                                     }}
//                                     endIcon={<ChevronDown size={20} />}
//                                 >
//                                     {formatLeagueName(league.name)}
//                                 </Button>
//                             ) : (
//                                 <Typography
//                                     sx={{
//                                         textTransform: 'uppercase',
//                                         fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
//                                         fontWeight: 'bold',
//                                         color: 'white',
//                                     }}
//                                 >
//                                     Loading...
//                                 </Typography>
//                             )}
//                             <Menu
//                                 anchorEl={leaguesDropdownAnchor}
//                                 open={leaguesDropdownOpen}
//                                 onClose={handleLeaguesDropdownClose}
//                                 anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
//                                 transformOrigin={{ vertical: 'top', horizontal: 'left' }}
//                                 MenuListProps={{
//                                     dense: false,
//                                     sx: { p: 0 }
//                                 }}
//                                 PaperProps={{
//                                     sx: {
//                                         p: 0.5,
//                                         mt: 1,
//                                         minWidth: 240,
//                                         bgcolor: 'rgba(15,15,15,0.92)',
//                                         color: '#E5E7EB',
//                                         borderRadius: 2.5,
//                                         border: '1px solid rgba(255,255,255,0.08)',
//                                         backdropFilter: 'blur(10px)',
//                                         boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
//                                         // Fixed height with vertical scroll
//                                         height: 320,
//                                         overflowY: 'auto',
//                                         overflowX: 'hidden',
//                                         overscrollBehavior: 'contain',
//                                         // Improve scrollbar visibility (Firefox + WebKit)
//                                         scrollbarWidth: 'thin',
//                                         scrollbarColor: '#374151 #111827',
//                                         '&::-webkit-scrollbar': { width: 8 },
//                                         '&::-webkit-scrollbar-track': { background: '#111827' },
//                                         '&::-webkit-scrollbar-thumb': {
//                                             background: '#374151',
//                                             borderRadius: 20,
//                                             border: '2px solid #111827'
//                                         },
//                                         '&::-webkit-scrollbar-thumb:hover': { background: '#4b5563' },
//                                     }
//                                 }}
//                             >
//                                 {[...sortedLeagues].sort((a, b) => {
//                                     const an = (a?.name ?? '').toString().trim().toLowerCase();
//                                     const bn = (b?.name ?? '').toString().trim().toLowerCase();
//                                     if (an < bn) return -1;
//                                     if (an > bn) return 1;
//                                     return String(a.id).localeCompare(String(b.id));
//                                 }).map((leagueItem) => {
//                                     const isActive = leagueItem.id === selectedLeague;
//                                     return (
//                                         <MenuItem
//                                             key={leagueItem.id}
//                                             onClick={() => handleLeagueSelect(leagueItem.id)}
//                                             sx={{
//                                                 borderRadius: 1.5,
//                                                 mx: 0.5,
//                                                 my: 0.25,
//                                                 py: 1.25,
//                                                 px: 1.5,
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 gap: 1,
//                                                 color: '#E5E7EB',
//                                                 transition: 'all 0.2s ease',
//                                                 '&:hover': {
//                                                     transform: 'translateY(-1px)',
//                                                     background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
//                                                 },
//                                                 ...(isActive && {
//                                                     background: 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)',
//                                                     border: '1px solid rgba(3,136,227,0.35)',
//                                                 }),
//                                             }}
//                                         >
//                                             <ListItemIcon sx={{ minWidth: 36 }}>
//                                                 <Trophy size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
//                                             </ListItemIcon>
//                                             <ListItemText
//                                                 primary={leagueItem.name}
//                                                 sx={{
//                                                     '& .MuiListItemText-primary': {
//                                                         fontSize: '0.95rem',
//                                                         fontWeight: isActive ? 700 : 500,
//                                                         letterSpacing: 0.2,
//                                                         color: isActive ? '#FFFFFF' : '#E5E7EB',
//                                                     }
//                                                 }}
//                                             />
//                                                             <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                 {(() => {
//                                                     // Define LeagueUser type if not already defined
//                                                     type LeagueUser = { id: string };
//                                                     const isLeagueAdmin = leagueItem.administrators?.some((admin: LeagueUser) => admin.id === user?.id);
//                                                     const isLeagueMember = leagueItem.members?.some((member: LeagueUser) => member.id === user?.id);
//                                                     const userRole = isLeagueAdmin ? 'ADMIN' : isLeagueMember ? 'MEMBER' : null;
                                                    
//                                                     return userRole ? (
//                                                         <Box
//                                                             sx={{
//                                                                 px: 1,
//                                                                 py: 0.25,
//                                                                 bgcolor: userRole === 'ADMIN' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
//                                                                 color: userRole === 'ADMIN' ? '#1F2937' : '#FFFFFF',
//                                                                 borderRadius: '9999px',
//                                                                 fontSize: 10,
//                                                                 fontWeight: 700,
//                                                                 letterSpacing: 0.3,
//                                                                 textTransform: 'uppercase',
//                                                             }}
//                                                         >
//                                                             {userRole === 'ADMIN' ? 'Admin' : 'Member'}
//                                                         </Box>
//                                                     ) : null;
//                                                 })()}
//                                                 {/* {isActive && (
//                                                     <Box
//                                                         sx={{
//                                                             px: 1,
//                                                             py: 0.25,
//                                                             bgcolor: '#0388E3',
//                                                             color: 'white',
//                                                             borderRadius: '9999px',
//                                                             fontSize: 10,
//                                                             fontWeight: 700,
//                                                             letterSpacing: 0.3,
//                                                             textTransform: 'uppercase',
//                                                         }}
//                                                     >
//                                                         Current
//                                                     </Box>
//                                                 )} */}
//                                             </Box>
//                                         </MenuItem>
//                                     );
//                                 })}
//                             </Menu>
//                         </Box>
//                     </Box>
//                 </Box>
//                 {/* Match Cards */}
//                 <Box sx={{
//                     display: 'grid',
//                     gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
//                     gap: 3,
//                 }}>
//                     {loading ? (
//                         <Typography color="#fff" align="center">Loading matches...</Typography>
//                     ) : selectedLeague === 'all' ? (
//                         <Paper
//                             elevation={0}
//                             sx={{
//                                 background: 'rgba(255,255,255,0.06)',
//                                 borderRadius: 3,
//                                 p: 4,
//                                 textAlign: 'center',
//                                 color: '#fff',
//                             }}
//                         >
//                             <Typography variant="h6">Select a League</Typography>
//                             <Typography variant="body2">
//                                 Choose a league from the dropdown to view its matches
//                             </Typography>
//                         </Paper>
//                     ) : matches.length === 0 ? (
//                         <Paper
//                             elevation={0}
//                             sx={{
//                                 background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
//                                 borderRadius: 3,
//                                 p: 4,
//                                 textAlign: 'center',
//                                 color: '#b0bec5',
//                             }}
//                         >
//                             <Typography variant="h6">No matches found</Typography>
//                             <Typography variant="body2">
//                                 No matches found in {selectedLeagueName}
//                             </Typography>
//                         </Paper>
//                     ) : filteredMatches.length === 0 ? (
//                         <Paper
//                             elevation={0}
//                             sx={{
//                                 background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
//                                 borderRadius: 3,
//                                 p: 4,
//                                 textAlign: 'center',
//                                 color: '#b0bec5',
//                             }}
//                         >
//                             <Typography variant="h6">No matches found</Typography>
//                             <Typography variant="body2">
//                                 {matchFilter === 'fixtures' 
//                                     ? 'No scheduled fixtures found in this league'
//                                     : matchFilter === 'results'
//                                     ? 'No completed matches found in this league'
//                                     : 'No matches found in this league'}
//                             </Typography>
//                         </Paper>
//                     ) : (
//                         filteredMatches.map((match) => {
//                             // const { availableCount, pendingCount } = getAvailabilityCounts(match);
//                             // Use the latest availableUsers for this match to determine if the user is available
//                             const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
//                             // const isCompleted = match.status === 'completed';
//                             // const isScheduled = match.status === 'scheduled';
//                             const leagueForMatch = leagues.find(l => l.id === match.leagueId);
//                             const isAdmin = leagueForMatch?.administrators?.some(admin => admin.id === user?.id);
//                             const isCompleted = match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_UPLOADED';
//                             return (
//                                 isCompleted ? (


//                                     <Card
//                                         key={match.id}
//                                         onClick={(e) => { if (match.status === 'SCHEDULED') handleMatchCardClick(match, e); }}
//                                         sx={{
//                                             position: 'relative',
//                                             borderRadius: 3,
//                                             backdropFilter: 'blur(10px)',
//                                             background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
//                                             cursor: match.status === 'SCHEDULED' ? 'pointer' : 'default',
//                                             '&:hover': {
//                                                 transform: 'translateY(-2px)',
//                                                 boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
//                                             }
//                                         }}
//                                     >
//                                         <CardContent sx={{ p: 2 }}>
//                                             {/* {isAdmin && (
//                                                 <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
//                                                     {match?.archived ? (
//                                                         <Tooltip title="Restore Match">
//                                                             <IconButton
//                                                                 size="small"
//                                                                 onClick={(e) => {
//                                                                     e.stopPropagation();
//                                                                     // Open actions dialog instead of immediate restore
//                                                                     setArchivedActionMatch(match);
//                                                                     setArchivedActionOpen(true);
//                                                                 }}
//                                                                 sx={{ color: '#4CAF50' }}
//                                                             >
//                                                                 <Undo2 size={20} />
//                                                             </IconButton>
//                                                         </Tooltip>
//                                                     ) : (
//                                                         <Tooltip title="Delete / Archive">
//                                                             <IconButton
//                                                                 size="small"
//                                                                 onClick={(e) => {
//                                                                     e.stopPropagation();
//                                                                     handleRequestDeleteMatch(match);
//                                                                 }}
//                                                                 sx={{ color: '#ffb4b4' }}
//                                                             >
//                                                                 <Trash2 size={20} />
//                                                             </IconButton>
//                                                         </Tooltip>
//                                                     )}
//                                                 </Box>
//                                             )} */}
//     {isAdmin && (
//                                                                 <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0 }}>
//                                                                     {match.archived ? (
//                                                                         <Tooltip title="Restore Match">
//                                                                             <IconButton
//                                                                                 size="small"
//                                                                                 onClick={(e) => {
//                                                                                     e.stopPropagation();
//                                                                                     // Open actions dialog instead of immediate restore
//                                                                                     setArchivedActionMatch(match);
//                                                                                     setArchivedActionOpen(true);
//                                                                                 }}
//                                                                                 sx={{ color: '#4CAF50' }}
//                                                                             >
//                                                                                 <Undo2 size={20} />
//                                                                             </IconButton>
//                                                                         </Tooltip>
//                                                                     ) : (
//                                                                         <>
//                                                                             <Tooltip title="Edit">
//                                                                                 <IconButton
//                                                                                     size="small"
//                                                                                     onClick={(e) => {
//                                                                                         e.stopPropagation();
//                                                                                         router.push(`/league/${league?.id}/match/${match.id}/edit`);
//                                                                                     }}
//                                                                                     sx={{ color: 'white' }}
//                                                                                     disabled={!league?.active}
//                                                                                 >
//                                                                                     <Edit size={20} />
//                                                                                 </IconButton>
//                                                                             </Tooltip>
//                                                                             <Tooltip title="Delete / Archive">
//                                                                                 <IconButton
//                                                                                     size="small"
//                                                                                     onClick={(e) => {
//                                                                                         e.stopPropagation();
//                                                                                         handleRequestDeleteMatch(match);
//                                                                                     }}
//                                                                                     sx={{ color: '#ffb4b4' }}
//                                                                                 >
//                                                                                     <Trash2 size={20} />
//                                                                                 </IconButton>
//                                                                             </Tooltip>
//                                                                         </>
//                                                                     )}
//                                                                 </Box>
//                                                             )}

//                                             {/* Archived label */}
//                                             {match.archived && (
//                                                 <Chip
//                                                     label="Canceled by Admin"
//                                                     size="small"
//                                                     sx={{
//                                                         position: 'absolute',
//                                                         top: 8,
//                                                         left: 8,
//                                                         backgroundColor: '#b91c1c',
//                                                         color: 'white',
//                                                         fontWeight: 'bold',
//                                                         textAlign: 'center',
//                                                         justifyContent: 'center',
//                                                         ml: '25%'
//                                                     }}
//                                                 />
//                                             )}

//                                             {/* Awaiting confirmation label for RESULT_UPLOADED */}
//                                             {!match.archived && match.status === 'RESULT_UPLOADED' && (
//                                                 <Chip
//                                                     label="Awaiting Confirmation"
//                                                     size="small"
//                                                     sx={{
//                                                         // position: {sm: 'static', xs: 'static', md: 'absolute'},
//                                                         position: 'absolute',
//                                                         top: 8,
//                                                         left: 8,
//                                                         backgroundColor: '#F59E0B', // amber
//                                                         color: 'black',
//                                                         fontWeight: 'bold',
//                                                         ml: '25%',
//                                                     }}
//                                                 />
//                                             )}

//                                             {match.status === 'RESULT_PUBLISHED' ? (
//                                                 <Link href={`/match/${match?.id}`}>
//                                                     <Box sx={{
//                                                         display: 'flex',
//                                                         flexDirection: 'column',
//                                                         gap: 1,
//                                                         minHeight: 80
//                                                     }}>

//                                                         <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                                                 <Image
//                                                                     src={match.homeTeamImage || homeTeamIcon}
//                                                                     alt={match.homeTeamName || match.homeTeam || 'Home team'}
//                                                                     width={24}
//                                                                     height={24}
//                                                                     style={{ borderRadius: '2px' }}
//                                                                 />
//                                                                 <Typography
//                                                                     variant="body2"
//                                                                     sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
//                                                                     title={match.homeTeamName}
//                                                                 >
//                                                                     {formatMatchName(match.homeTeamName || match.homeTeam)}
//                                                                 </Typography>
//                                                             </Box>
//                                                             <Typography
//                                                                 variant="h6"
//                                                                 sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
//                                                             >
//                                                                 {match.homeTeamGoals || 0}
//                                                             </Typography>
//                                                         </Box>

//                                                         {/* Away row */}
//                                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                                                 <Image
//                                                                     src={match.awayTeamImage || awayTeamIcon}
//                                                                     alt={match.awayTeamName || match.awayTeam || 'Away team'}
//                                                                     width={24}
//                                                                     height={24}
//                                                                     style={{ borderRadius: '2px' }}
//                                                                 />
//                                                                 <Typography
//                                                                     variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
//                                                                     title={match.awayTeamName}
//                                                                 >
//                                                                     {formatMatchName(match.awayTeamName || match.awayTeam)}
//                                                                 </Typography>
//                                                             </Box>
//                                                             <Typography
//                                                                 variant="h6"
//                                                                 sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
//                                                             >
//                                                                 {match.awayTeamGoals || 0}
//                                                             </Typography>
//                                                         </Box>

//                                                         {/* Date and Status - Right Side */}
//                                                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'absolute', top: 42, right: 8 }}>
//                                                             <Typography variant="body2" sx={{
//                                                                 color: 'white',
//                                                                 fontWeight: 'bold',
//                                                                 fontSize: '0.75rem'
//                                                             }}>
//                                                                 {formatMatchDate(match.date)}
//                                                             </Typography>
//                                                             <Typography variant="body2" sx={{
//                                                                 color: 'white',
//                                                                 fontSize: '0.65rem'
//                                                             }}>
//                                                                 Full time
//                                                             </Typography>
//                                                             <Divider sx={{ height: '70px', width: '0.5px', color: 'white', bgcolor: '#fff', mr: 8.5, mt: -9 }} />
//                                                         </Box>
//                                                     </Box>
//                                                 </Link>
//                                             ) : (
//                                                 // RESULT_UPLOADED: non-navigable, show toast on click
//                                                 <Box
//                                                     // onClick={() => toast.info("Captains haven't confirmed the score yet.")}
//                                                     onClick={() => toast("Captains haven't confirmed the score yet.", { icon: 'ℹ️' })}
//                                                     sx={{
//                                                         display: 'flex',
//                                                         flexDirection: 'column',
//                                                         gap: 1,
//                                                         minHeight: 80,
//                                                         cursor: 'not-allowed',
//                                                         opacity: 0.95
//                                                     }}
//                                                 >
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                                             <Image
//                                                                 src={match.homeTeamImage || homeTeamIcon}
//                                                                 alt={match.homeTeamName || match.homeTeam || 'Home team'}
//                                                                 width={24}
//                                                                 height={24}
//                                                                 style={{ borderRadius: '2px' }}
//                                                             />
//                                                             <Typography
//                                                                 variant="body2"
//                                                                 sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
//                                                                 title={match.homeTeamName}
//                                                             >
//                                                                 {formatMatchName(match.homeTeamName || match.homeTeam)}
//                                                             </Typography>
//                                                         </Box>
//                                                         <Typography
//                                                             variant="h6"
//                                                             sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
//                                                         >
//                                                             {match.homeTeamGoals || 0}
//                                                         </Typography>
//                                                     </Box>

//                                                     {/* Away row */}
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
//                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                                             <Image
//                                                                 src={match.awayTeamImage || awayTeamIcon}
//                                                                 alt={match.awayTeamName || match.awayTeam || 'Away team'}
//                                                                 width={24}
//                                                                 height={24}
//                                                                 style={{ borderRadius: '2px' }}
//                                                             />
//                                                             <Typography
//                                                                 variant="body2"
//                                                                 sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
//                                                                 title={match.awayTeamName}
//                                                             >
//                                                                 {formatMatchName(match.awayTeamName || match.awayTeam)}
//                                                             </Typography>
//                                                         </Box>
//                                                         <Typography
//                                                             variant="h6"
//                                                             sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
//                                                         >
//                                                             {match.awayTeamGoals || 0}
//                                                         </Typography>
//                                                     </Box>

//                                                     {/* Date and Status - Right Side */}
//                                                     <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'absolute', top: 32, right: 8 }}>
//                                                         <Typography variant="body2" sx={{
//                                                             color: 'white',
//                                                             fontWeight: 'bold',
//                                                             fontSize: '0.75rem'
//                                                         }}>
//                                                             {formatMatchDate(match.date)}
//                                                         </Typography>
//                                                         <Divider sx={{ height: '70px', width: '0.5px', color: 'white', bgcolor: '#fff', mr: 8.5, mt: -6 }} />
//                                                     </Box>
//                                                 </Box>
//                                             )}
//                                             {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
//                                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//                                                     {((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
//                                                         match.status === 'RESULT_UPLOADED' ? (
//                                                             <Tooltip title="Awaiting captain confirmation">
//                                                                 <span>
//                                                                     <Button
//                                                                         size="small"
//                                                                         disabled
//                                                                         sx={{
//                                                                             backgroundColor: '#0388E3',
//                                                                             color: 'white',
//                                                                             fontSize: '0.75rem',
//                                                                             py: 0.5,
//                                                                             px: 1,
//                                                                             borderRadius: 1,
//                                                                             boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                             transition: 'all 0.2s ease-in-out',
//                                                                             '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
//                                                                             '&:active': { transform: 'translateY(0)' },
//                                                                         }}
//                                                                     >
//                                                                         {isAdmin ? 'MOMT' : 'MOMT'}
//                                                                     </Button>
//                                                                 </span>
//                                                             </Tooltip>
//                                                         ) : (
//                                                             <Button
//                                                                 size="small"
//                                                                 onClick={() => {
//                                                                     setSelectedMatchIdForDialog(match.id);
//                                                                     setSelectedLeagueIdForDialog(String(match.leagueId));
//                                                                     setMatchStatsOpen(true);
//                                                                 }}
//                                                                 sx={{
//                                                                     backgroundColor: '#0388E3',
//                                                                     color: 'white',
//                                                                     fontSize: '0.75rem',
//                                                                     py: 0.5,
//                                                                     px: 1,
//                                                                     borderRadius: 1,
//                                                                     boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                     transition: 'all 0.2s ease-in-out',
//                                                                     '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
//                                                                     '&:active': { transform: 'translateY(0)' },
//                                                                 }}
//                                                                 disabled={!leagueForMatch?.active}
//                                                             >
//                                                                 {isAdmin ? 'Add Score' : 'Add Your Stats'}
//                                                             </Button>
//                                                         )
//                                                     )}
//                                                 </Box>
//                                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
//                                                     <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
//                                                         <span>
//                                                             <Button
//                                                                 size="small"
//                                                                 onClick={(e) => { e.stopPropagation(); setViewTeamMatch({ leagueId: league?.id ?? selectedLeague, matchId: match.id }); setViewTeamOpen(true); }}
//                                                                 sx={{
//                                                                     backgroundColor: '#FA5836',
//                                                                     color: 'white',
//                                                                     fontSize: '0.75rem',
//                                                                     py: 0.5,
//                                                                     px: 1,
//                                                                     borderRadius: 1,
//                                                                     boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                     transition: 'all 0.2s ease-in-out',
//                                                                     '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px #FA5836', transform: 'translateY(-1px)' },
//                                                                     '&:active': { transform: 'translateY(0)' },
//                                                                 }}
//                                                             >
//                                                                 view team
//                                                             </Button>
//                                                         </span>
//                                                     </Tooltip>
//                                                 </Box>
//                                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
//                                                     <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
//                                                         <span>
//                                                             <Button
//                                                                 size="small"
//                                                                 sx={{
//                                                                     backgroundColor: '#FA5836',
//                                                                     color: 'white',
//                                                                     fontSize: '0.75rem',
//                                                                     py: 0.5,
//                                                                     px: 1,
//                                                                     borderRadius: 1,
//                                                                     boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                     transition: 'all 0.2s ease-in-out',
//                                                                     '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px rgba(250, 88, 54, 0.4)', transform: 'translateY(-1px)' },
//                                                                     '&:active': { transform: 'translateY(0)' },
//                                                                 }}
//                                                                 disabled={!league?.active || match.status === 'RESULT_UPLOADED'}
//                                                                 // onClick={() => {
//                                                                 //     setActiveMatchId(match.id);
//                                                                 //     setStatsDialogOpen(true);
//                                                                 //     fetchExistingStats(match.id);
//                                                                 // }}
//                                                             >
//                                                                Match Results
//                                                             </Button>
//                                                         </span>
//                                                     </Tooltip>
//                                                 </Box>
//                                             </Box> */}
//                                             <Box sx={{
//                                                 display: 'flex',
//                                                 justifyContent: 'center',
//                                                 alignItems: 'center',
//                                                 flexWrap: 'wrap',
//                                                 gap: 0.75,
//                                                 mt: 2
//                                             }}>
//                                                 {/* Admin-only: ADD Score button */}
//                                                 {isAdmin && ((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
//                                                     match.status === 'RESULT_UPLOADED' ? (
//                                                         <Tooltip title="Awaiting captain confirmation">
//                                                             <span>
//                                                                 <Button
//                                                                     size="small"
//                                                                     disabled
//                                                                     sx={{
//                                                                         backgroundColor: '#0388E3',
//                                                                         color: 'white',
//                                                                         fontSize: '0.65rem',
//                                                                         textTransform: 'none',
//                                                                         py: 0.3,
//                                                                         px: 0.8,
//                                                                         minHeight: 28,
//                                                                         minWidth: 'fit-content',
//                                                                         borderRadius: 1,
//                                                                         boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                         transition: 'all 0.2s ease-in-out',
//                                                                         '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
//                                                                     }}
//                                                                 >
//                                                                     ADD Score
//                                                                 </Button>
//                                                             </span>
//                                                         </Tooltip>
//                                                     ) : (
//                                                         <Button
//                                                             size="small"
//                                                             onClick={() => {
//                                                                 setSelectedMatchIdForDialog(match.id);
//                                                                 setShouldShowAdminGoals(true);
//                                                                 setMatchStatsOpen(true);
//                                                             }}
//                                                             sx={{
//                                                                 backgroundColor: '#0388E3',
//                                                                 color: 'white',
//                                                                 fontSize: '0.65rem',
//                                                                 textTransform: 'none',
//                                                                 py: 0.3,
//                                                                 px: 0.8,
//                                                                 minHeight: 28,
//                                                                 minWidth: 'fit-content',
//                                                                 borderRadius: 1,
//                                                                 boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                 transition: 'all 0.2s ease-in-out',
//                                                                 '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
//                                                             }}
//                                                             disabled={!leagueForMatch?.active}
//                                                         >
//                                                             ADD Score
//                                                         </Button>
//                                                     )
//                                                 )}

//                                                 {/* All Members: Add Your Stats button */}
//                                                 {isMember && ((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
//                                                     match.status === 'RESULT_UPLOADED' ? (
//                                                         <Tooltip title="Awaiting captain confirmation">
//                                                             <span>
//                                                                 <Button
//                                                                     size="small"
//                                                                     disabled
//                                                                     sx={{
//                                                                         backgroundColor: '#0388E3',
//                                                                         color: 'white',
//                                                                         fontSize: '0.65rem',
//                                                                         textTransform: 'none',
//                                                                         py: 0.3,
//                                                                         px: 0.8,
//                                                                         minHeight: 28,
//                                                                         minWidth: 'fit-content',
//                                                                         borderRadius: 1,
//                                                                         boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                         transition: 'all 0.2s ease-in-out',
//                                                                         '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
//                                                                     }}
//                                                                 >
//                                                                     Add Your Stats
//                                                                 </Button>
//                                                             </span>
//                                                         </Tooltip>
//                                                     ) : (
//                                                         <Button
//                                                             size="small"
//                                                             onClick={() => {
//                                                                 setSelectedMatchIdForDialog(match.id);
//                                                                 setShouldShowAdminGoals(false);
//                                                                 setMatchStatsOpen(true);
//                                                             }}
//                                                             sx={{
//                                                                 backgroundColor: '#0388E3',
//                                                                 color: 'white',
//                                                                 fontSize: '0.65rem',
//                                                                 textTransform: 'none',
//                                                                 py: 0.3,
//                                                                 px: 0.8,
//                                                                 minHeight: 28,
//                                                                 minWidth: 'fit-content',
//                                                                 borderRadius: 1,
//                                                                 boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                 transition: 'all 0.2s ease-in-out',
//                                                                 '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
//                                                             }}
//                                                             disabled={!leagueForMatch?.active}
//                                                         >
//                                                             Add Your Stats
//                                                         </Button>
//                                                     )
//                                                 )}

//                                                 {/* View Team button */}
//                                                 <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
//                                                     <span>
//                                                         <Button
//                                                             size="small"
//                                                             onClick={(e) => {
//                                                                 e.stopPropagation();
//                                                                 setViewTeamMatch({ leagueId: String(match.leagueId), matchId: match.id });
//                                                                 setViewTeamOpen(true);
//                                                             }}
//                                                             sx={{
//                                                                 backgroundColor: '#FA5836',
//                                                                 color: 'white',
//                                                                 fontSize: '0.65rem',
//                                                                 textTransform: 'none',
//                                                                 py: 0.3,
//                                                                 px: 0.8,
//                                                                 minHeight: 28,
//                                                                 minWidth: 'fit-content',
//                                                                 borderRadius: 1,
//                                                                 boxShadow: '0 2px 4px rgba(250, 88, 54, 0.3)',
//                                                                 transition: 'all 0.2s ease-in-out',
//                                                                 '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px rgba(250, 88, 54, 0.4)', transform: 'translateY(-1px)' },
//                                                             }}
//                                                             disabled={!leagueForMatch?.active}
//                                                         >
//                                                             View Team
//                                                         </Button>
//                                                     </span>
//                                                 </Tooltip>

//                                                 {/* Match Results button */}
//                                                 <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
//                                                     <span>
//                                                         <Button
//                                                             size="small"
//                                                             onClick={() => router.push(`/match/${match.id}`)}
//                                                             sx={{
//                                                                 backgroundColor: '#FA5836',
//                                                                 color: 'white',
//                                                                 fontSize: '0.65rem',
//                                                                 textTransform: 'none',
//                                                                 py: 0.3,
//                                                                 px: 0.8,
//                                                                 minHeight: 28,
//                                                                 minWidth: 'fit-content',
//                                                                 borderRadius: 1,
//                                                                 boxShadow: '0 2px 4px rgba(250, 88, 54, 0.3)',
//                                                                 transition: 'all 0.2s ease-in-out',
//                                                                 '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px rgba(250, 88, 54, 0.4)', transform: 'translateY(-1px)' },
//                                                             }}
//                                                             disabled={!leagueForMatch?.active ||  match.status === 'RESULT_UPLOADED'}
//                                                         >
//                                                             Match Results
//                                                         </Button>
//                                                     </span>
//                                                 </Tooltip>
//                                             </Box>
//                                             {/* // ...existing code... */}

//                                         </CardContent>
//                                     </Card>
//                                 ) : (
//                                     <Card
//                                         key={match.id}
//                                         onClick={(e) => { if (match.status === 'SCHEDULED') handleMatchCardClick(match, e); }}

//                                         sx={{
//                                             // background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
//                                             // background: 'rgba(255,255,255,0.1)',
//                                             position: 'relative',
//                                             // border: '2px solid rgba(255,255,255,0.1)',
//                                             borderRadius: 3,
//                                             backdropFilter: 'blur(10px)',
//                                             // background: '#01c697',
//                                             background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
//                                             // border: '2px solid #02a880',
//                                             cursor: match.status === 'SCHEDULED' ? 'pointer' : 'default',
//                                             '&:hover': {
//                                                 // border: '3px solid #02a880',
//                                                 transform: 'translateY(-2px)',
//                                                 boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
//                                             }
//                                         }}
//                                     >
//                                         <CardContent sx={{ p: 2 }}>
//                                             {isAdmin && (
//                                                 <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
//                                                     <Tooltip title="Edit">
//                                                         <IconButton
//                                                             size="small"
//                                                             onClick={(e) => {
//                                                                 e.stopPropagation();
//                                                                 router.push(`/league/${String(match.leagueId)}/match/${match.id}/edit`);
//                                                             }}
//                                                             sx={{ color: 'white' }}
//                                                             disabled={!leagueForMatch?.active}
//                                                         >
//                                                             <Edit size={20} />
//                                                         </IconButton>
//                                                     </Tooltip>
//                                                     <Tooltip title="Delete / Archive">
//                                                         <IconButton
//                                                             size="small"
//                                                             onClick={(e) => {
//                                                                 e.stopPropagation();
//                                                                 handleRequestDeleteMatch(match);
//                                                             }}
//                                                             sx={{ color: '#ffb4b4' }}
//                                                         >
//                                                             <Trash2 size={20} />
//                                                         </IconButton>
//                                                     </Tooltip>
//                                                 </Box>
//                                             )}

//                                             <Box onClick={(e) => { if (match.status === 'SCHEDULED') handleMatchCardClick(match, e); }}>
//                                                 <Box sx={{
//                                                     display: 'flex',
//                                                     flexDirection: 'column',
//                                                     gap: 1,
//                                                     minHeight: 80,
//                                                     mb: 2
//                                                 }}>

//                                                     {/* <Box sx={{
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         width: '100%'
//                                                     }}>
//                                                         <Box sx={{
//                                                             display: 'flex',
//                                                             alignItems: 'center',
//                                                             gap: 1,
//                                                             flex: 1,
//                                                         }}>
//                                                             <Image
//                                                                 src={match.homeTeamImage || homeTeamIcon}
//                                                                 alt={match.homeTeamName || match.homeTeam}
//                                                                 width={24}
//                                                                 height={24}
//                                                                 style={{ borderRadius: '2px' }}
//                                                             />
//                                                             <Typography
//                                                                 variant="body2"
//                                                                 sx={{
//                                                                     color: 'white',
//                                                                     fontWeight: 'bold',
//                                                                     fontSize: '0.85rem',
//                                                                     ml: 2
//                                                                 }}
//                                                                 title={match.homeTeamName}
//                                                             >
//                                                                 {formatMatchName(match.homeTeamName || match.homeTeam)}
//                                                             </Typography>
//                                                         </Box>
//                                                     </Box> */}

//                                                     {/* Bottom Row - Away Team */}
//                                                     {/* <Box sx={{
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         justifyContent: 'space-between',
//                                                         width: '100%'
//                                                     }}>
//                                                         <Box sx={{
//                                                             display: 'flex',
//                                                             alignItems: 'center',
//                                                             gap: 1,
//                                                             flex: 1,
//                                                             mt: 2,
//                                                         }}>
//                                                             <Image
//                                                                 src={match.awayTeamImage || awayTeamIcon}
//                                                                 alt={match.awayTeamName || match.homeTeam}
//                                                                 width={24}
//                                                                 height={24}
//                                                                 style={{ borderRadius: '2px' }}
//                                                             />
//                                                             <Typography
//                                                                 variant="body2"
//                                                                 sx={{
//                                                                     color: 'white',
//                                                                     fontWeight: 'bold',
//                                                                     fontSize: '0.85rem',
//                                                                     ml: 2
//                                                                 }}
//                                                                 title={match.awayTeamName}
//                                                             >
//                                                                 {formatMatchName(match.awayTeamName || match.homeTeam)}
//                                                             </Typography>

//                                                         </Box>
//                                                     </Box> */}

//                                                     <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                                             <Image
//                                                                 src={match.homeTeamImage || homeTeamIcon}
//                                                                 alt={match.homeTeamName || match.homeTeam || 'Home team'}
//                                                                 width={24}
//                                                                 height={24}
//                                                                 style={{ borderRadius: '2px' }}
//                                                             />
//                                                             <Typography
//                                                                 variant="body2"
//                                                                 sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
//                                                                 title={match.homeTeamName}
//                                                             >
//                                                                 {formatMatchName(match.homeTeamName || match.homeTeam)}
//                                                             </Typography>
//                                                         </Box>
//                                                     </Box>

//                                                     {/* Away row */}
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
//                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                                             <Image
//                                                                 src={match.awayTeamImage || awayTeamIcon}
//                                                                 alt={match.awayTeamName || match.awayTeam || 'Away team'}
//                                                                 width={24}
//                                                                 height={24}
//                                                                 style={{ borderRadius: '2px' }}
//                                                             />
//                                                             <Typography
//                                                                 variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
//                                                                 title={match.awayTeamName}
//                                                             >
//                                                                 {formatMatchName(match.awayTeamName || match.awayTeam)}
//                                                             </Typography>
//                                                         </Box>

//                                                     </Box>
//                                                     {/* Date and Status - Right Side */}
//                                                     <Box sx={{
//                                                         display: 'flex',
//                                                         flexDirection: 'column',
//                                                         alignItems: 'flex-end',
//                                                         position: 'absolute',
//                                                         top: 42,
//                                                         right: 8
//                                                     }}>
//                                                         <Typography variant="body2" sx={{
//                                                             color: 'white',
//                                                             fontWeight: 'bold',
//                                                             fontSize: '0.75rem'
//                                                         }}>
//                                                             {formatMatchDate(match.date)}
//                                                         </Typography>
//                                                         <Typography variant="body2" sx={{
//                                                             color: 'white',
//                                                             fontSize: '0.65rem'
//                                                         }}>
//                                                             {formatMatchTime(match.date)}
//                                                         </Typography>
//                                                         <Divider sx={{ height: '70px', width: '0.5px', color: 'white', bgcolor: '#fff', mr: 10.5, mt: -7 }} />
//                                                     </Box>
//                                                 </Box>
//                                             </Box>


//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: -3 }}>
//                                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//                                                     {/* Availability button */}
//                                                     {isMember && (
//                                                         <Button
//                                                             variant="contained"
//                                                             onClick={(e) => {
//                                                                 e.stopPropagation(); // Prevent card click
//                                                                 handleToggleAvailability(match.id, isUserAvailable);
//                                                             }}
//                                                             disabled={availabilityLoading[match.id] || !league?.active}
//                                                             size="small"
//                                                             sx={{
//                                                                 backgroundColor: isUserAvailable ? 'rgba(76, 175, 80, 0.8)' : '#0388E3',
//                                                                 '&:hover': {
//                                                                     backgroundColor: isUserAvailable ? 'rgba(76, 175, 80, 1)' : '#0388E3',
//                                                                     transform: 'translateY(-1px)',
//                                                                 },
//                                                                 '&.Mui-disabled': {
//                                                                     backgroundColor: 'rgba(255,255,255,0.3)',
//                                                                     color: 'rgba(255,255,255,0.5)'
//                                                                 },
//                                                                 fontSize: '0.75rem',
//                                                                 py: 0.5,
//                                                                 transition: 'all 0.2s ease-in-out',
//                                                                 '&:active': {
//                                                                     transform: 'translateY(0)', // Reset when clicked
//                                                                 },
//                                                             }}
//                                                         >
//                                                             {availabilityLoading[match.id]
//                                                                 ? <CircularProgress size={16} color="inherit" />
//                                                                 : (isUserAvailable ? 'Unavailable' : 'Available')}
//                                                         </Button>
//                                                     )}
//                                                 </Box>
//                                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
//                                                     <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
//                                                         <span>
//                                                             <Button
//                                                                 size="small"
//                                                                 onClick={(e) => { e.stopPropagation(); setViewTeamMatch({ leagueId: league?.id ?? selectedLeague, matchId: match.id }); setViewTeamOpen(true); }}
//                                                                 sx={{
//                                                                     backgroundColor: '#FA5836',
//                                                                     color: 'white',
//                                                                     fontSize: '0.75rem',
//                                                                     py: 0.5,
//                                                                     px: 1,
//                                                                     borderRadius: 1,
//                                                                     boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
//                                                                     transition: 'all 0.2s ease-in-out',
//                                                                     '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px #FA5836', transform: 'translateY(-1px)' },
//                                                                     '&:active': { transform: 'translateY(0)' },
//                                                                 }}
//                                                             >
//                                                                 view team
//                                                             </Button>
//                                                         </span>
//                                                     </Tooltip>
//                                                 </Box>
//                                             </Box>

//                                         </CardContent>
//                                     </Card>
//                                 )
//                             )
//                         })
//                     )}

//                 </Box>
//                 <MatchDetailModal
//                     open={matchDetailModalOpen}
//                     onClose={() => setMatchDetailModalOpen(false)}
//                     match={selectedMatchDetail}
//                 />

//                 {/* Team Modal */}
//                 <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
//                     <DialogTitle>Teams for {selectedMatch?.homeTeamName || selectedMatch?.homeTeam} vs {selectedMatch?.awayTeamName || selectedMatch?.awayTeam}</DialogTitle>
//                     <DialogContent>
//                         {selectedMatch && (
//                             <Box>
//                                 <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName || selectedMatch.homeTeam}</Typography>
//                                 <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
//                                 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
//                                     {(selectedMatch.homeTeamUsers || []).map((player: User, idx: number) => (
//                                         <Box key={player.id || idx}>
//                                             <PlayerCard position={''} points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}
//                         {selectedMatch && (
//                             <Box sx={{ mt: 2 }}>
//                                 <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName || selectedMatch.awayTeam}</Typography>
//                                 <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
//                                 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
//                                     {(selectedMatch.awayTeamUsers || []).map((player: User, idx: number) => (
//                                         <Box key={player.id || idx}>
//                                             <PlayerCard position={''} points={0} {...mapPlayerToCardProps(player)} width={240} height={400} />
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={handleCloseTeamModal}>Close</Button>
//                     </DialogActions>
//                 </Dialog>
//             </Container>
//             <PlayerStatsDialog
//                 open={statsDialogOpen}
//                 onClose={() => setStatsDialogOpen(false)}
//                 onSave={handleSaveStats}
//                 isSubmitting={isSubmittingStats}
//                 stats={stats}
//                 handleStatChange={handleStatChange}
//                 teamGoals={getMatchGoals()}
//             />

//             {/* Match Stats Dialog (embedded) */}
//             <PlayMatchPagee
//                 open={matchStatsOpen}
//                 onClose={() => setMatchStatsOpen(false)}
//                 initialLeagueId={selectedLeagueIdForDialog || undefined}
//                 initialMatchId={selectedMatchIdForDialog || undefined}
//                 showAdminGoalsSection={shouldShowAdminGoals}
//                 onSave={() => {
//                     // Auto-refresh matches after saving match results
//                     setTimeout(() => {
//                         if (selectedLeague && selectedLeague !== 'all') {
//                             fetchMatchesByLeague(selectedLeague);
//                         }
//                     }, 1000);
//                 }}
//             />

//             <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
//                 <DialogTitle sx={{ fontWeight: 'bold' }}>Are you sure you want to delete this match?</DialogTitle>
//                 <DialogContent>
//                     <Typography variant="body2" sx={{ mt: 1 }}>
//                         {(matchPendingDelete?.homeTeamGoals ?? 0) > 0 ||
//                             (matchPendingDelete?.awayTeamGoals ?? 0) > 0 ||
//                             ((matchPendingDelete?.status ?? '') === 'RESULT_PUBLISHED')
//                             ? 'Scores exist. It will be archived (Canceled by Admin) and removed from stats. You can undo.'
//                             : 'No scores yet. It will be permanently deleted.'}
//                     </Typography>
//                 </DialogContent>
//                 <DialogActions>
//                     <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
//                     <Button color="error" variant="contained" onClick={handleConfirmDeleteMatch}>
//                         Confirm
//                     </Button>
//                 </DialogActions>
//             </Dialog>





//             <Dialog
//                 open={archivedActionOpen}
//                 onClose={() => {
//                     setArchivedActionOpen(false);
//                     setArchivedActionMatch(null);
//                     setArchivedActionHasStats(null);
//                     setArchivedActionChecking(false);
//                     setArchivedActionDeleting(false);
//                 }}
//                 maxWidth="sm"
//                 fullWidth
//             >
//                 <DialogTitle sx={{ fontWeight: 'bold' }}>Archived Match Actions</DialogTitle>
//                 <DialogContent>
//                     <Typography variant="body2" sx={{ mb: 1 }}>
//                         Choose an action for this archived match.
//                     </Typography>
//                     {archivedActionChecking && (
//                         <Typography variant="body2">Checking deletable status…</Typography>
//                     )}
//                     {archivedActionHasStats === true && (
//                         <Alert severity="warning" sx={{ mt: 1 }}>
//                             This match has player stats. Permanent delete is disabled.
//                         </Alert>
//                     )}
//                 </DialogContent>
//                 <DialogActions>
//                     <Button
//                         variant="contained"
//                         onClick={() => {
//                             if (!archivedActionMatch) return;
//                             handleRestoreMatch(archivedActionMatch);
//                             setArchivedActionOpen(false);
//                         }}
//                         startIcon={<Undo2 size={16} />}
//                     >
//                         Undo
//                     </Button>
//                     {/* <Tooltip
//                                                 title={
//                                                     archivedActionHasStats ? 'Match has stats. Cannot permanently delete.' : ''
//                                                 }
//                                             >
//                                                 <span>
//                                                     <Button
//                                                         variant="contained"
//                                                         color="error"
//                                                         disabled={archivedActionChecking || archivedActionHasStats === true}
//                                                         onClick={() => {
//                                                             if (!archivedActionMatch) return;
//                                                             const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
//                                                             if (ok) {
//                                                                 handlePermanentDelete(archivedActionMatch);
//                                                                 setArchivedActionOpen(false);
//                                                             }
//                                                         }}
//                                                         startIcon={<Trash2 size={16} />}
//                                                     >
//                                                         Permanently Delete
//                                                     </Button>
//                                                 </span>
//                                             </Tooltip> */}
//                     {/* // ...existing code... */}
//                     {/* <Tooltip
//                                                 title={
//                                                     archivedActionHasStats !== false
//                                                         ? 'Match cannot be permanently deleted (stats present or status unknown).'
//                                                         : ''
//                                                 }
//                                             >
//                                                 <span>
//                                                     <Button
//                                                         variant="contained"
//                                                         color="error"
//                                                         disabled={archivedActionChecking || archivedActionHasStats !== false}
//                                                         onClick={() => {
//                                                             if (!archivedActionMatch) return;
//                                                             const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
//                                                             if (ok) {
//                                                                 handlePermanentDelete(archivedActionMatch);
//                                                                 setArchivedActionOpen(false);
//                                                             }
//                                                         }}
//                                                         startIcon={<Trash2 size={16} />}
//                                                     >
//                                                         Permanently Delete
//                                                     </Button>
//                                                 </span>
//                                             </Tooltip> */}
//                     <Tooltip
//                         title={
//                             archivedActionHasStats === true
//                                 ? 'Match has player stats. Permanent delete is disabled.'
//                                 : archivedActionHasStats === null
//                                     ? 'Status unknown. Click to check and delete if possible.'
//                                     : ''
//                         }
//                     >
//                         <span>
//                             <Button
//                                 variant="contained"
//                                 color="error"
//                                 // Disable only while checking, or if we KNOW stats exist
//                                 disabled={archivedActionChecking || archivedActionDeleting || archivedActionHasStats === true}
//                                 onClick={() => {
//                                     // Re-check if needed, then delete
//                                     tryHardDeleteFromDialog();
//                                 }}
//                                 startIcon={<Trash2 size={16} />}
//                             >
//                                 {archivedActionDeleting
//                                     ? 'Deleting…'
//                                     : archivedActionChecking
//                                         ? 'Checking…'
//                                         : 'Permanently Delete'}
//                             </Button>
//                         </span>
//                     </Tooltip>
//                     {/* // ...existing code... */}
//                 </DialogActions>
//             </Dialog>


//             <Dialog open={viewTeamOpen} onClose={() => setViewTeamOpen(false)} fullWidth maxWidth="sm">
//                 <DialogTitle sx={{
//                     fontWeight: 'bold',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between'
//                 }}>
//                     Team Preview
//                     <IconButton
//                         onClick={() => setViewTeamOpen(false)}
//                         size="small"
//                         sx={{ color: 'inherit' }}
//                     >
//                         <CloseIcon />
//                     </IconButton>
//                 </DialogTitle>
//                 <DialogContent dividers sx={{ p: 0 }}>
//                     <TeamPreviewScreen leagueId={viewTeamMatch?.leagueId} matchId={viewTeamMatch?.matchId} />
//                 </DialogContent>
//                 {/* <DialogActions>
//                     <Button onClick={() => setViewTeamOpen(false)}>Close</Button>
//                 </DialogActions> */}
//             </Dialog>

//         </Box>
//     );
// }


































