'use client';
import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Typography,
    Paper,
    Button,
    ButtonGroup,
    Card,
    CardContent,
    Grid,
    Chip,
    Divider,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Switch,
    TextField,
    Alert,
    Menu,
    ListItemIcon,
    ListItemText,
    Container,
    List,
    ListItem,
    ListItemAvatar,
    LinearProgress,
    Stack,
    Avatar,
    useTheme,
    useMediaQuery,
    Fade,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Calendar, Copy, Edit, Settings, Shield, ChevronDown, Trash2, Undo2, Users, Flame, Search, Table, Plus, Share2, MapPin, Crown } from 'lucide-react';
import { Tooltip, Slide } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import PlayerImg from '@/Components/images/playerimg.png'
import HomeTeamImage from '@/Components/images/hometeamshirt.png'
import AwayTeamImage from '@/Components/images/awayteamshirt.png'
import FootBallIcon from '@/Components/images/cardfootball.png'
import CardStar from '@/Components/images/cardstar.png'

// Lazy load heavy components
const PlayMatchPagee = dynamic(() => import('@/Components/matchstatsdialog/MatchStatsDialog'), {
    loading: () => <CircularProgress />,
    ssr: false
});
const TrophyRoom = dynamic(() => import('@/Components/TrophyRoom'), {
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
const PlayerCard = dynamic(() => import('@/Components/PlayerCardd').then(mod => ({ default: mod.default })), {
    loading: () => <CircularProgress />,
    ssr: false
});
import CloseIcon from '@mui/icons-material/Close';
import { useCombinedMatchRefresh } from '@/lib/useMatchAutoRefresh';
// import { LeaderboardResponse } from '@/types/api';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ShirtImg from '@/Components/images/shirtimg.png'
import homeImg from '@/Components/images/matches.png'
import awayImg from '@/Components/images/2nd champion icon football.png'
import Goals from "@/Components/images/goal.png"
import Assist from "@/Components/images/Assist.png"
import Cleansheet from "@/Components/images/cleansheet.png"
import Momt from "@/Components/images/MOTM.png"
import Star from '@mui/icons-material/Star';
import LeagueTable from '@/Components/images/leagutable.png'
import LeagueIcon from '@/Components/images/league icon.png'
import CalendarImg from '@/Components/images/cardcalendar.png'
import ClockImg from '@/Components/images/cardclock.png'
import LocationImg from '@/Components/images/cardlocation.png'
import ViewTeamImg from '@/Components/images/cardviewteam.png'
import RESULTS from '@/Components/images/cardresult.png'
import ADDSTATS from '@/Components/images/cardstats.png'

type Foot = 'L' | 'R';
type ShortPosition = 'GK' | 'DF' | 'MF' | 'WG' | 'ST';
type FIFAStats = { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string };

type PlayerCardProps = {
    name: string;
    number: string;
    points: number;
    stats: FIFAStats;
    foot: Foot;
    profileImage?: string;
    shirtIcon?: string;
    position: ShortPosition;
};

// type PlayerStatsMetric = keyof LeaderboardResponse['players'][number];

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
    inviteCode: string;
    createdAt: string;
    members: User[];
    administrators: User[];
    matches: Match[];
    active: boolean;
    maxGames: number;
    showPoints: boolean;
    adminId?: string;
    userRole?: 'ADMIN' | 'MEMBER';
    computedStatus?: LeagueComputedStatus;
    isLocked?: boolean;
    isComplete?: boolean;
    isCompleted?: boolean;
    updatedAt?: string;
    status?: string;
}

interface User {
    xp: number;
    shirtNumber: undefined;
    positionType: undefined;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string | null;
    position?: string;
}

interface Match {
    homeTeamImage: string;
    awayTeamImage: string;
    id: string;
    date: string;
    location: string;
    status: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    availableUsers: User[];
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    end: string;
    start?: string | Date;
    updatedAt?: string | Date;
    createdAt?: string | Date;
    active: boolean;
    archived?: boolean; // <-- NEW
    matchNumber?: number; // <-- Match index from backend
}


type LeagueStatistics = {
    playedMatches: number;
    remaining: number;
    players: number;
    created: string;
    bestPairing: null | {
        ids: [string, string];
        names: [string, string];
        togetherMatches: number;
        togetherWins: number;
        combinedGoals: number;
        combinedAssists: number;
    };
    hottestPlayer: null | {
        playerId: string;
        name: string;
        xpInLast5: number;
        matchesConsidered: number;
    };
};

// Slide Transition for mobile dialogs
const Transition = forwardRef<HTMLDivElement, { children: React.ReactElement }>(
    function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    }
);

// Local helper to format names safely
const formatLeagueName = (name?: string): string => (name ?? '').trim();




// Add TableData type
interface TableData {
    xp: number;
    id: string;
    name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    winPercentage: string;
    isAdmin?: boolean;
    profilePicture?: string | null;
    motmCount?: number;
}

export default function LeagueDetailPage() {
    const [matchStatsOpen, setMatchStatsOpen] = React.useState(false);
    const [selectedMatchIdForDialog, setSelectedMatchIdForDialog] = React.useState<string | null>(null);
    const [shouldShowAdminGoals, setShouldShowAdminGoals] = React.useState(false);
    const [league, setLeague] = useState<League | null>(null);
    console.log('leagues matches', league?.matches)
    const [error, setError] = useState<string | null>(null);
    const { user, token, loading: authLoading, isAuthenticated } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<'members' | 'matches' | 'results' | 'table' | 'awards'>('table');
    const searchParams = useSearchParams();
    const profilePlayerId = typeof searchParams?.get === 'function' ? searchParams.get('profilePlayerId') : '';
    const [hasCommonLeague, setHasCommonLeague] = useState(false);
    const [, setCheckedCommonLeague] = useState(false);
    const [userLeagueXP, setUserLeagueXP] = useState<Record<string, number>>({});
    const [xpFetchAttempted, setXpFetchAttempted] = useState(false);
    const [showPointsAlert, setShowPointsAlert] = useState(false);
    const [statsDialogOpen, setStatsDialogOpen] = React.useState(false);
    const [activeMatchId,] = React.useState<string | null>(null);
    // 
    const [stats, setStats] = React.useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });
    const [isSubmittingStats, setIsSubmittingStats] = React.useState(false);


    const [viewTeamOpen, setViewTeamOpen] = React.useState(false);
    const [viewTeamMatch, setViewTeamMatch] = React.useState<{ leagueId: string; matchId: string } | null>(null);
    // Leagues dropdown state
    const [allLeagues, setAllLeagues] = useState<League[]>([]);
    const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
    const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);

    // Match detail modal state
    const [matchDetailModalOpen, setMatchDetailModalOpen] = useState(false);
    const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);

    // Confirmation dialog state
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [matchPendingDelete, setMatchPendingDelete] = useState<Match | null>(null);
    // const [undoInfo, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);
    const [undoInfo, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);

    const [archivedActionOpen, setArchivedActionOpen] = useState(false);
    const [archivedActionMatch, setArchivedActionMatch] = useState<Match | null>(null);
    const [archivedActionChecking, setArchivedActionChecking] = useState(false);
    const [archivedActionHasStats, setArchivedActionHasStats] = useState<boolean | null>(null);

    const [leagueWinners, setLeagueWinners] = useState<{ champion?: string; runnerUp?: string }>({});
    const [motmCounts, setMotmCounts] = useState<Record<string, number>>({});

    // Quick View: move hooks above any conditional returns to satisfy rules-of-hooks
    type PlayerProfileLike = {
        position?: string | null;
        preferredFoot?: string | null;
        shirtNumber?: string | number | null;
        profilePicture?: string | null;
        avatarUrl?: string | null;
    };
    const [openQuickView, setOpenQuickView] = useState(false);
    const [quickView, setQuickView] = useState<{
        player?: (User & PlayerProfileLike) | null;
        league?: League | null;
        stats?: { goals?: number; assists?: number };
        skills?: { dribbling?: number; shooting?: number; passing?: number; pace?: number; defending?: number; physical?: number };
        xp?: number;
        cleanSheets?: number;
        motmCount?: number;
        lastFive?: Array<{ result: 'W' | 'D' | 'L' }>;
        trophyTitle?: string;
        xpLatest?: number;
        xpRecentTotal?: number;
        profileXP?: number;
    }>({});

    useEffect(() => {
        if (!token || !leagueId) return;
        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?leagueId=${encodeURIComponent(leagueId)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || !data?.success || !Array.isArray(data?.trophyWinners)) {
                    setLeagueWinners({});
                    return;
                }
                const winners = data.trophyWinners as Array<{ title: string; winnerId: string | number | null }>;
                const byTitle = (t: string) => winners.find(w => (w.title || '').toLowerCase() === t.toLowerCase());
                const champion = byTitle('League Champion')?.winnerId;
                const runnerUp = byTitle('Runner-Up')?.winnerId;
                setLeagueWinners({
                    champion: champion != null ? String(champion) : undefined,
                    runnerUp: runnerUp != null ? String(runnerUp) : undefined,
                });
            } catch {
                setLeagueWinners({});
            }
        })();
    }, [token, leagueId]);

    const checkCanHardDelete = useCallback(async (matchId: string) => {
        if (!token) return;
        setArchivedActionChecking(true);
        setArchivedActionHasStats(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/has-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('check failed');
            const data = await res.json();
            setArchivedActionHasStats(!!data.hasStats);
        } catch {
            // fail-safe: if unknown, prevent hard delete
            setArchivedActionHasStats(true);
        } finally {
            setArchivedActionChecking(false);
        }
    }, [token]);

    useEffect(() => {
        if (archivedActionOpen && archivedActionMatch?.id) {
            checkCanHardDelete(archivedActionMatch.id);
        }
    }, [archivedActionOpen, archivedActionMatch, checkCanHardDelete]);


    const getHasStats = useCallback(async (matchId: string): Promise<boolean> => {
        if (!token) return true; // default safe
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/has-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return true;
            const data = await res.json();
            return !!data.hasStats;
        } catch {
            return true; // safe default
        }
    }, [token]);

    const handlePermanentDelete = useCallback(async (match: Match) => {
        // if (!window.confirm('Are you sure you want to PERMANENTLY delete this match? This action cannot be undone and all match data will be lost forever.')) {
        //     return;
        // }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

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

            toast.success('Match permanently deleted');
            fetchLeagueDetails();

        } catch (error) {
            console.error('Permanent delete failed:', error);
            toast.error('Failed to permanently delete match');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const tryHardDeleteFromDialog = useCallback(async () => {
        if (!archivedActionMatch) return;

        // If already confirmed no stats, proceed
        if (archivedActionHasStats === false) {
            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
            if (ok) {
                await handlePermanentDelete(archivedActionMatch);
                setArchivedActionOpen(false);
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
                await handlePermanentDelete(archivedActionMatch);
                setArchivedActionOpen(false);
            }
        } finally {
            setArchivedActionChecking(false);
        }
    }, [archivedActionMatch, archivedActionHasStats, getHasStats, handlePermanentDelete]);

    // Example stat change handler
    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + increment);
            return { ...prev, [stat]: Math.min(newValue, max) };
        });
    };

    // Save stats to backend
    const handleSaveStats = async () => {
        if (!activeMatchId || !token) return;

        setIsSubmittingStats(true);
        try {
            console.log('💾 Saving stats for match:', activeMatchId);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${activeMatchId}/stats`, {
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
            });

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, show error message
                console.error('Stats saving is not available yet. Please contact the administrator.');
                setStatsDialogOpen(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                console.log('✅ Stats saved successfully!');

                // Close dialog
                setStatsDialogOpen(false);

                // 🔄 Fetch fresh data from backend
                console.log('🔄 Forcing immediate data refresh...');
                await fetchLeagueDetails();

                // 📢 Dispatch event for other components
                window.dispatchEvent(new CustomEvent('match-updated', {
                    detail: { matchId: activeMatchId }
                }));

                // ✅ Show success message
                toast.success('Stats saved successfully!');

                console.log('✨ Match updated and refreshed!');
            }
        } catch (err: unknown) {
            console.error('❌ Error saving stats:', err instanceof Error ? err.message : String(err));
            toast.error('Failed to save stats. Please try again.');
        } finally {
            setIsSubmittingStats(false);
        }
    };

    // Get match goals for the active match
    const getMatchGoals = () => {
        if (!activeMatchId || !league) return 10; // Default fallback
        const match = league.matches.find(m => m.id === activeMatchId);
        if (!match) return 10;
        return (match.homeTeamGoals || 0) + (match.awayTeamGoals || 0);
    };

    // Add this useEffect to sync tab param with section
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab === 'table' || tab === 'awards' || tab === 'members' || tab === 'matches' || tab === 'results') {
            setSection(tab);
        }
    }, [searchParams]);

    // Declare isMember and isAdmin here so they are available for useEffect and logic below
    const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
    const isAdmin = league && league.administrators && user && league.administrators.some((a: User) => a.id === user.id);


    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    console.log('league', league)

    const fetchLeagueDetails = useCallback(async () => {
        try {
            console.log("🔄 Fetching league details - Token:", token ? 'Present' : 'Missing');

            // 🔄 Add cache busting to force fresh data from backend
            const cacheBuster = `?_t=${Date.now()}`;
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}${cacheBuster}`, {
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
    }, [leagueId, token]);

    useEffect(() => {
        // Wait for auth to finish loading, user to be authenticated, and token to be available
        if (authLoading) return;
        if (!isAuthenticated || !token || !leagueId) return;
        fetchLeagueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, authLoading, isAuthenticated, leagueId]);

    // 🔄 Auto-refresh: Event-driven (immediate) + Periodic check every 1 minute
    // This handles both manual operations AND automatic match completion detection
    useCombinedMatchRefresh(fetchLeagueDetails, 60000); // Check every 60 seconds

    // Professional access logic: allow if user and profile player have ever shared ANY league
    useEffect(() => {
        if (!user || !profilePlayerId) {
            setCheckedCommonLeague(true);
            setHasCommonLeague(false);
            return;
        }
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${profilePlayerId}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
        ]).then(([userData, playerData]) => {
            const userLeagues = [
                ...(userData.user.leagues || []),
                ...(userData.user.administeredLeagues || [])
            ].map(l => l.id);
            const profilePlayerLeagues = (playerData.data?.leagues || []).map((l: User) => l.id);
            const hasOverlap = userLeagues.some((id: string) => profilePlayerLeagues.includes(id));
            setHasCommonLeague(hasOverlap);
            setCheckedCommonLeague(true);
        }).catch(() => {
            setHasCommonLeague(false);
            setCheckedCommonLeague(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, profilePlayerId, token]);

    // Helper: determine if a league is completed (exclude from dropdown)
    const leagueIsCompleted = useCallback((l: League): boolean => {
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

    // Fetch all user leagues for dropdown
    const fetchAllLeagues = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            interface LeagueData {
                id: string | number;
                name: string;
                maxGames?: number;
                matches?: Match[];
                isComplete?: boolean;
                isCompleted?: boolean;
                isLocked?: boolean;
                status?: string;
                active?: boolean;
                [key: string]: unknown;
            }

            interface AuthStatusResponse {
                success: boolean;
                user?: {
                    adminLeagues?: LeagueData[];
                    administeredLeagues?: LeagueData[];
                    leagues?: LeagueData[];
                };
            }

            const data: AuthStatusResponse = await response.json();

            if (data.success && data.user) {
                // Get admin league IDs
                const adminLeaguesArr: LeagueData[] = data.user.adminLeagues || data.user.administeredLeagues || [];
                const adminLeagueIds = new Set<string>(
                    adminLeaguesArr
                        .map((l: LeagueData) => String(l?.id))
                        .filter((id: string) => id !== 'undefined')
                );

                // Get member league IDs
                const memberLeagueIds = new Set<string>(
                    (data.user.leagues || [])
                        .map((l: LeagueData) => String(l?.id))
                        .filter((id: string) => id !== 'undefined')
                );

                // Combine and remove duplicates
                const userLeagues: LeagueData[] = [
                    ...(data.user.leagues || []),
                    ...adminLeaguesArr
                ];

                const uniqueLeaguesMap = new Map<string, LeagueData>();
                userLeagues.forEach(league => {
                    const id = String(league.id);
                    if (!uniqueLeaguesMap.has(id)) {
                        uniqueLeaguesMap.set(id, league);
                    }
                });

                // Convert to League type with role assignment (no extra API calls)
                const simpleLeagues: League[] = Array.from(uniqueLeaguesMap.values()).map((l: LeagueData) => {
                    const leagueId = String(l.id);
                    const role: 'ADMIN' | 'MEMBER' | undefined = adminLeagueIds.has(leagueId)
                        ? 'ADMIN'
                        : (memberLeagueIds.has(leagueId) ? 'MEMBER' : undefined);

                    return {
                        ...l,
                        id: leagueId,
                        name: l.name || '',
                        inviteCode: '',
                        createdAt: '',
                        members: [],
                        administrators: [],
                        matches: l.matches || [],
                        active: l.active ?? true,
                        maxGames: l.maxGames || 20,
                        showPoints: true,
                        userRole: role,
                        isComplete: l.isComplete,
                        isCompleted: l.isCompleted,
                        isLocked: l.isLocked,
                        status: l.status,
                    } as League;
                });

                // Filter out completed leagues
                const activeLeagues = simpleLeagues.filter(l => !leagueIsCompleted(l));

                // Sort alphabetically by name
                activeLeagues.sort((a, b) => {
                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return String(a.id).localeCompare(String(b.id));
                });

                setAllLeagues(activeLeagues);

                // Debug log
                console.log('[League Detail] Fetched leagues:', {
                    total: simpleLeagues.length,
                    active: activeLeagues.length,
                    completed: simpleLeagues.length - activeLeagues.length
                });
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    }, [token, leagueIsCompleted]);

    // Fetch XP for all users in this league (from API) - only attempt once
    useEffect(() => {
        async function fetchXP() {
            if (!league?.id || xpFetchAttempted) return;
            setXpFetchAttempted(true);
            try {
                const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/xp`, { headers });
                if (!res.ok) {
                    // Silently handle 404 - endpoint may not exist yet
                    console.warn(`XP endpoint returned ${res.status}, using empty map`);
                    setUserLeagueXP({});
                    return;
                }
                const json = await res.json().catch(() => ({}));
                if (json?.success === undefined || json?.success) {
                    // Support either { xp } or { data: { xp } }
                    const xpMap = json.xp || json.data?.xp || {};
                    setUserLeagueXP(xpMap as Record<string, number>);
                } else {
                    setUserLeagueXP({});
                }
            } catch {
                setUserLeagueXP({});
            }
        }
        fetchXP();
    }, [league?.id, token, xpFetchAttempted]);

    // Fetch all leagues for dropdown
    useEffect(() => {
        if (!token) return;
        fetchAllLeagues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    const handleBackToAllLeagues = () => {
        router.push('/all-leagues');
    };

    // Handle league dropdown open/close
    const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLeaguesDropdownAnchor(event.currentTarget);
        setLeaguesDropdownOpen(true);
    };

    const handleLeaguesDropdownClose = () => {
        setLeaguesDropdownOpen(false);
        setLeaguesDropdownAnchor(null);
    };

    // Handle league selection
    const handleLeagueSelect = async (selectedLeagueId: string) => {
        if (selectedLeagueId !== leagueId) {
            // Fetch the new league data first, then update URL and state
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeagueId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.league) {
                        // Update league data first
                        setLeague(data.league);
                        setError(null);

                        // Update URL after data is set
                        router.replace(`/league/${selectedLeagueId}`, { scroll: false });
                    } else {
                        setError('Failed to load league data');
                    }
                } else {
                    setError('Failed to load league data');
                }
            } catch (error) {
                console.error('Error fetching league:', error);
                setError('Failed to load league data');
            }
        }
        handleLeaguesDropdownClose();
    };

    const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
        if (!user) {
            setError('Please login to mark availability');
            return;
        }

        setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
        const action = isAvailable ? 'unavailable' : 'available';

        try {
            console.log('🔄 Toggling availability with action:', action);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/matches/${matchId}/availability?action=${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            console.log('✅ Response from server:', data);

            if (data.success) {
                // 🔄 Dispatch event for auto-refresh
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('match-updated', {
                        detail: { matchId, available: action === 'available' }
                    }));
                    console.log('📢 match-updated event dispatched');
                }

                // 🔄 Fetch fresh data from backend
                console.log('🔄 Fetching fresh league data...');
                await fetchLeagueDetails();

                setToastMessage(action === 'available'
                    ? '✅ You are now available for this match.'
                    : '❌ You are now unavailable for this match.');

                console.log('✅ Availability updated successfully!');
            } else {
                throw new Error(data.message || 'Failed to update availability');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error('❌ Error updating availability:', err);
            setError(errorMessage || 'Failed to connect to server');
            toast.error('Failed to update availability');
        } finally {
            setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const handleUpdateLeague = async (updatedData: Partial<League & { admins: string[] }>) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            const data = await response.json();
            if (data.success) {
                toast.success('League updated successfully!');
                await fetchLeagueDetails();
                setIsSettingsOpen(false);
            } else {
                toast.error(data.message || 'Failed to update league');
            }
        } catch (error) {
            console.error('Error updating league:', error);
            toast.error('An error occurred while updating the league.');
        }
    };

    const handleDeleteLeague = async () => {
        if (window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    toast.success('League deleted successfully.');
                    router.push('/all-leagues');
                } else {
                    const data = await response.json();
                    toast.error(data.message || 'Failed to delete league.');
                }
            } catch (error) {
                console.error('Error deleting league:', error);
                toast.error('An error occurred while deleting the league.');
            }
        }
    };

    const tableData: TableData[] = React.useMemo(() => {
        if (!league) return [];
        const playerStats = new Map<string, TableData>();
        const adminId = league.administrators?.[0]?.id;
        league.members.forEach((member: User & { xp?: number }) => {
            playerStats.set(member.id, {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                winPercentage: '0%',
                isAdmin: member.id === adminId,
                profilePicture: member.profilePicture || null,
                // Prefer XP from league API map, fallback to member.xp if present
                xp: (userLeagueXP && userLeagueXP[member.id] != null) ? userLeagueXP[member.id] : (member?.xp ?? 0),
                motmCount: typeof motmCounts[member.id] === 'number' ? motmCounts[member.id] : 0,
            });
        });
        league.matches
            .filter(m => !m.archived) // <-- exclude archived
            .filter(m => (m.status === 'RESULT_PUBLISHED' || m.status === 'RESULT_PUBLISHED') && m.homeTeamGoals != null && m.awayTeamGoals != null)
            .forEach(match => {
                const homeWon = match.homeTeamGoals! > match.awayTeamGoals!;
                const awayWon = match.awayTeamGoals! > match.homeTeamGoals!;
                const isDraw = match.homeTeamGoals === match.awayTeamGoals;
                const processPlayer = (p: User, isHome: boolean) => {
                    const stats = playerStats.get(p.id);
                    if (!stats) return;
                    stats.played++;
                    if ((isHome && homeWon) || (!isHome && awayWon)) stats.wins++;
                    else if (isDraw) stats.draws++;
                    else stats.losses++;
                };
                match.homeTeamUsers.forEach(p => processPlayer(p, true));
                match.awayTeamUsers.forEach(p => processPlayer(p, false));
            });

        const list = Array.from(playerStats.values()).map(s => ({
            ...s,
            winPercentage: s.played ? `${Math.round((s.wins / s.played) * 100)}%` : '0%'
        }));

        // Always order by highest to lowest XP points; tie-breakers: wins, draws, then fewer losses
        list.sort((a, b) => {
            if ((b.xp ?? 0) !== (a.xp ?? 0)) return (b.xp ?? 0) - (a.xp ?? 0);
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.draws !== a.draws) return b.draws - a.draws;
            return a.losses - b.losses;
        });

        return list;
        // Recompute when members/matches/admins change so UI updates instantly after removals/edits
    }, [league?.id, league?.members, league?.matches, league?.administrators, leagueWinners, userLeagueXP, motmCounts]);

    // Type for MOTM votes map: voterId -> votedForId
    type ManOfTheMatchVotes = Record<string, string | number>;
    const hasMotmVotes = (m: unknown): m is { manOfTheMatchVotes?: ManOfTheMatchVotes } =>
        typeof m === 'object' && m !== null && 'manOfTheMatchVotes' in m;

    // Aggregate MOTM votes locally from league.matches so every player's votes show
    useEffect(() => {
        if (!league?.members?.length || !league?.id) return;
        const counts: Record<string, number> = {};
        // Initialize all members with 0 to ensure everyone shows up
        league.members.forEach(m => { counts[m.id] = 0; });
        (league.matches || []).forEach((match) => {
            const votes: ManOfTheMatchVotes = hasMotmVotes(match) && match.manOfTheMatchVotes
                ? match.manOfTheMatchVotes
                : {};
            // votes is record voterId -> votedForId; we count by votedForId
            Object.values(votes).forEach((votedForId) => {
                const pid = String(votedForId);
                if (pid in counts) counts[pid] += 1;
            });
        });
        setMotmCounts(counts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [league?.id]);

    // Fetch MOTM votes per player via quick-view endpoint when league changes
    useEffect(() => {
        if (!league?.id || !token || !league.members?.length) return;
        let ignore = false;
        const controller = new AbortController();
        (async () => {
            try {
                const entries = await Promise.all(
                    league.members.map(async (m) => {
                        try {
                            const res = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(league.id)}/player/${encodeURIComponent(m.id)}/quick-view`,
                                { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
                            );
                            if (!res.ok) return [m.id, 0] as const;
                            const data = await res.json();
                            const cnt = Number((data?.motmCount ?? data?.data?.motmCount ?? 0));
                            return [m.id, Number.isFinite(cnt) ? cnt : 0] as const;
                        } catch {
                            return [m.id, 0] as const;
                        }
                    })
                );
                if (!ignore) setMotmCounts(Object.fromEntries(entries));
            } catch {
                // ignore errors
            }
        })();
        return () => {
            ignore = true;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [league?.id, token]);

    const [leagueStats, setLeagueStats] = useState<LeagueStatistics | null>(null);
    // ...existing code...

    // REMOVE the old useMemo leagueStats block
    // ...existing code...
    // { deleted useMemo computing leagueStats }
    // ...existing code...

    useEffect(() => {
        if (!league?.id || !token) return;
        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/statistics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    // Endpoint may not exist yet - fail silently
                    console.warn('League statistics endpoint returned', res.status);
                    setLeagueStats(null);
                    return;
                }
                const json = await res.json();
                if (json?.success) setLeagueStats(json.data);
            } catch (e) {
                console.warn('Failed to load league statistics', e);
                setLeagueStats(null);
            }
        })();
    }, [league?.id, token]);

    const getAvailabilityCounts = (match: Match) => {
        // Find the league for this match
        const leagueForMatch = league; // Assuming 'league' is available in this scope
        const leagueMembers = leagueForMatch?.members || [];
        // Count how many league members are in availableUsers
        const availableCount = leagueMembers.filter(member =>
            match.availableUsers?.some((u: User) => u.id === member.id)
        ).length;
        const pendingCount = leagueMembers.length - availableCount;
        return { availableCount, pendingCount };
    };


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

    // Format match time
    const formatMatchTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatLeagueName = (name: string): string => {
        if (!name) return '';

        // Capitalize first letter of the name
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        // Get first letter of each word and join them
        const words = name.split(' ');
        const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

        // Return formatted name with initials in brackets
        return `${capitalizedName}`;
    };

    const formatMatchName = (name: string): string => {
        if (!name) return '';
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return `${capitalizedName}`;
    };

    // --- Sorting helpers: numeric index desc with date fallback ---
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
        const candidates: Array<string | Date | undefined | null> = [m.date, m.end, m.start, m.updatedAt, m.createdAt];
        for (const c of candidates) {
            if (!c) continue;
            const t = new Date(c).getTime();
            if (!Number.isNaN(t)) return t;
        }
        return 0;
    };

    const compareMatchesDesc = (a: Match, b: Match): number => {
        const ai = getNumericIndex(a);
        const bi = getNumericIndex(b);
        if (ai !== undefined && bi !== undefined) return bi - ai; // larger index first
        if (ai !== undefined) return -1; // known index before unknown
        if (bi !== undefined) return 1;
        // fallback to date: latest first
        return getBestDateMs(b) - getBestDateMs(a);
    };

    // Current season number resolver (no `any`; checks currentSeason, active `seasons`, computedStatus, and top-level fields)
    const resolveSeasonNumber = (l?: League | null): number | undefined => {
        const toNum = (v: unknown): number | undefined => {
            const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
            return Number.isFinite(n) ? n : undefined;
        };

        if (!l) return undefined;

        // Helper to safely read number-like field from an object by keys
        const getNumberLike = (obj: unknown, keys: string[]): number | undefined => {
            if (!obj || typeof obj !== 'object') return undefined;
            const rec = obj as Record<string, unknown>;
            for (const k of keys) {
                const n = toNum(rec[k]);
                if (typeof n === 'number') {
                    if (n > 0) return n;
                    if (n === 0) return 1; // zero-based index -> Season 1
                }
            }
            return undefined;
        };

        // 0) First check currentSeason from backend (user's actual season they are member of)
        const currentSeasonFromBackend = (l as unknown as Record<string, unknown>)?.currentSeason;
        if (currentSeasonFromBackend && typeof currentSeasonFromBackend === 'object') {
            const fromCurrent = getNumberLike(currentSeasonFromBackend, ['seasonNumber']);
            if (typeof fromCurrent === 'number') return fromCurrent;
        }

        // 1) Check `l.seasons` - now only contains seasons user is member of
        const seasonsUnknown = (l as unknown as Record<string, unknown>)?.seasons;
        if (Array.isArray(seasonsUnknown) && seasonsUnknown.length > 0) {
            // Use the first season from filtered list (user's most recent season)
            const userSeason = seasonsUnknown[0];
            const fromUserSeason = getNumberLike(userSeason, ['seasonNumber']);
            if (typeof fromUserSeason === 'number') return fromUserSeason;
        }

        // 2) Check `computedStatus`
        const comp = (l as unknown as Record<string, unknown>)?.computedStatus;
        const fromComputed = getNumberLike(comp, ['currentSeasonNumber', 'seasonNumber', 'seasonIndex', 'season']);
        if (typeof fromComputed === 'number') return fromComputed;

        // 3) Check top-level fields
        const fromTop = getNumberLike(l as unknown as Record<string, unknown>, ['currentSeasonNumber', 'seasonNumber', 'seasonIndex', 'season']);
        if (typeof fromTop === 'number') return fromTop;

        return undefined;
    };

    const currentSeasonNumber = React.useMemo(() => resolveSeasonNumber(league) ?? 1, [league]);
    const seasonLabel = React.useMemo(() => (currentSeasonNumber ? `(#Season ${currentSeasonNumber})` : ''), [currentSeasonNumber]);

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                    py: { xs: 2, md: 4 },
                    px: { xs: 1, md: 0 },
                    background: 'transparent',
                    backgroundAttachment: 'fixed',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <Button
                        startIcon={<ArrowLeft />}
                        onClick={handleBackToAllLeagues}
                        sx={{
                            mb: 2, color: 'white', backgroundColor: '#388e3c',
                            '&:hover': { backgroundColor: '#388e3c' },
                        }}
                    >
                        Back to All Leagues
                    </Button>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {error}
                    </Typography>
                </Container>
            </Box>
        );
    }

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
                                    src={match.homeTeamImage || homeImg}
                                    alt={match.homeTeamName}
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
                                        {formatMatchName(match.homeTeamName)}
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
                                {match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' && (
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
                                    src={match.awayTeamImage || awayImg}
                                    alt={match.awayTeamName}
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
                                        {formatMatchName(match.awayTeamName)}
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
                        {match.location && (
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
                                        {match.location}
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
                                {match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' ? '✅' : match.status === 'ongoing' ? '⚡' : '⏰'}
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                    Status
                                </Typography>
                                <Chip
                                    label={match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' ? 'RESULT_PUBLISHED' : match.status === 'ongoing' ? 'Live' : 'SCHEDULED'}
                                    size="small"
                                    sx={{
                                        backgroundColor: match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' ? '#16a34a' : match.status === 'ongoing' ? '#ea580c' : '#0388E3',
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

    // Add these handlers before the return statement

    const handleRequestDeleteMatch = (match: Match) => {
        setMatchPendingDelete(match);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDeleteMatch = async () => {
        if (!matchPendingDelete || !token || !league) return;
        const m = matchPendingDelete;
        setConfirmDeleteOpen(false);

        const hasScores = (m.homeTeamGoals ?? 0) > 0 ||
            (m.awayTeamGoals ?? 0) > 0 ||
            ((m.status ?? '') === 'RESULT_PUBLISHED');

        try {
            if (hasScores) {
                // Archive the match
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: true })
                });

                if (!res.ok) {
                    const errorData = await res.text();
                    console.error('Archive failed:', errorData);
                    throw new Error('Failed to archive match');
                }

                const data = await res.json();
                console.log('Archive response:', data); // Debug log

                // Update local state
                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).map(mm =>
                        mm.id === m.id ? { ...mm, archived: true } : mm
                    )
                } : prev);

                setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
                setToastMessage('Match archived (Canceled by Admin)');

            } else {
                // Hard delete
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to delete match');

                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).filter(mm => mm.id !== m.id)
                } : prev);

                setUndoInfo({ match: m, action: 'delete' });
                setToastMessage('Match deleted permanently');
            }

            // Refresh league data to ensure sync
            fetchLeagueDetails();

        } catch (e) {
            console.error('Delete/Archive operation failed:', e);
            toast.error(`Failed to ${hasScores ? 'archive' : 'delete'} match`);
        } finally {
            setMatchPendingDelete(null);
        }
    };

    const handleUndo = async () => {
        if (!undoInfo || !token) return;
        const { match, action } = undoInfo;

        try {
            if (action === 'archive') {
                // Restore archived match
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: false })
                });

                if (!res.ok) {
                    throw new Error('Failed to restore match');
                }

                const data = await res.json();
                console.log('Restore response:', data);

                // Update local state
                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).map(mm =>
                        mm.id === match.id ? { ...mm, archived: false } : mm
                    )
                } : prev);

                setToastMessage('Match restored successfully.');
                toast.success('Match restored successfully!');

            } else if (action === 'delete') {
                // For permanent deletes, we can't undo - but we can recreate if we have the data
                toast.error('Cannot undo permanent deletion. Match data is permanently lost.');
            }

            // Refresh data to ensure sync
            fetchLeagueDetails();

        } catch (error) {
            console.error('Undo operation failed:', error);
            toast.error('Failed to undo the action');
        } finally {
            setUndoInfo(null);
        }
    };

    // Add this handler before the return statement

    const handleMatchCardClick = (match: Match, event: React.MouseEvent) => {
        // Prevent opening modal if clicking on buttons
        const target = event.target as HTMLElement;
        const isButton = target.closest('button') || target.closest('a');

        if (!isButton) {
            setSelectedMatchDetail(match);
            setMatchDetailModalOpen(true);
        }
    };

    const handleRestoreMatch = async (match: Match) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ archived: false })
            });

            if (!res.ok) {
                throw new Error('Failed to restore match');
            }

            // Update local state
            setLeague(prev => prev ? {
                ...prev,
                matches: prev.matches.map(mm =>
                    mm.id === match.id ? { ...mm, archived: false } : mm
                )
            } : prev);

            toast.success('Match restored successfully');
            fetchLeagueDetails();

        } catch (error) {
            console.error('Restore failed:', error);
            toast.error('Failed to restore match');
        }
    };

    const resultColor = (r?: string) => (r === 'W' ? '#16a34a' : r === 'L' ? '#dc2626' : '#64748b');

    const getShirtNumber = (p: User & PlayerProfileLike) => {
        const member = league?.members.find((m: User) => m.id === p.id);
        const sn = p.shirtNumber ?? member?.shirtNumber;
        if (sn === null || sn === undefined) return '';
        const s = typeof sn === 'string' ? sn : String(sn);
        return s.length > 0 ? s : '';
    };
    const getPreferredFoot = (u?: PlayerProfileLike): Foot => {
        const v = (u?.preferredFoot ?? '').toString().toLowerCase();
        if (v === 'left' || v === 'l') return 'L';
        if (v === 'right' || v === 'r') return 'R';
        return 'R';
    };
    const getProfileImage = (p: User & PlayerProfileLike) => p.profilePicture ?? '';
    const posToShort = (pos?: string): ShortPosition => {
        const p = (pos ?? '').toLowerCase();
        if (p.includes('keeper') || p === 'gk') return 'GK';
        if (p.includes('def')) return 'DF';
        if (p.includes('mid')) return 'MF';
        if (p.includes('wing')) return 'WG';
        if (p.includes('striker') || p.includes('forward') || p === 'st' || p === 'cf') return 'ST';
        return 'ST';
    };
    // Helpers for PlayerCard (backend-only data
    const openQuickViewFromTable = async (leagueId: string, playerId: string) => {
        if (!leagueId || !playerId || !token) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(leagueId)}/player/${encodeURIComponent(playerId)}/quick-view`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            console.log('fdsf', data);

            if (!res.ok || !data?.success) return;
            const player: User & PlayerProfileLike = {
                id: String(data.player?.id ?? playerId),
                firstName: data.player?.firstName ?? '',
                lastName: data.player?.lastName ?? '',
                email: '',
                xp: Number(data.player?.xp ?? 0),
                position: data.player?.position ?? undefined,
                profilePicture: data.player?.profilePicture ?? null,
                preferredFoot: data.player?.preferredFoot ?? null,
                shirtNumber: data.player?.shirtNumber ?? null,
                positionType: undefined,
            };
            setQuickView({
                player,
                league,
                stats: { goals: Number(data.stats?.goals ?? 0), assists: Number(data.stats?.assists ?? 0) },
                skills: data.skills
                    ? {
                        dribbling: Number(data.skills.dribbling ?? 0),
                        shooting: Number(data.skills.shooting ?? 0),
                        passing: Number(data.skills.passing ?? 0),
                        pace: Number(data.skills.pace ?? 0),
                        defending: Number(data.skills.defending ?? 0),
                        physical: Number(data.skills.physical ?? 0),
                    }
                    : undefined,
                xp: Number(data.xp ?? data.player?.xp ?? 0),
                cleanSheets: Number(data.cleanSheets ?? 0),
                motmCount: Number(data.motmCount ?? 0),
                lastFive: Array.isArray(data.lastFive) ? data.lastFive : [],
            });
            setOpenQuickView(true);
        } catch {
            // silent
        }
    };



    return (
        <Box
            sx={{
                minHeight: '100vh',
                fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                // py: { xs: 2, md: 4 },
                // px: { xs: 1, md: 0 },
                background: 'transparent',
                backgroundAttachment: 'fixed',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* <Box sx={{ ml:5}}> */}
            {/* </Box> */}
            <Container>
                {/* Access control for non-members - only show when league data is available */}
                {league && !isMember && !hasCommonLeague ? (
                    <Box sx={{ p: 4, minHeight: '100vh' }}>
                        <Typography color="error" variant="h6">
                            You don&apos;t have access to this league.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* League inactive warning - only show when league data is available */}
                        {league && !league.active && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                This league is currently inactive. All actions are disabled until an admin reactivates it.
                            </Alert>
                        )}

                        <Box sx={{
                            mt: 0,
                            mb: 4,
                            width: '100vw',
                            position: 'relative',
                            left: '49.2%',
                            right: '50%',
                            marginLeft: '-50vw',
                            marginRight: '-50vw',
                            // height: '30vh',
                            background: '#0e0e0e',
                        }}>
                            <Paper sx={{
                                px: 0,
                                py: { xs: 4, md: 3.1 },
                                background: '#0e0e0e',
                                color: 'white',
                            }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        mb: 2,
                                        gap: 1,
                                        position: 'relative'
                                    }}
                                >
                                    {/* Left side - Trophy + League Name */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: { xs: 0.8, sm: 1, md: 2 },
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden'
                                    }}>
                                        {/* Left spacer; trophy moved to center with title */}
                                    </Box>

                                    {/* Centered League Name */}
                                    <Box sx={{
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        mt: 17,
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: { xs: 0.8, sm: 1, md: 1 },
                                        }}>
                                            <Image
                                                src={LeagueIcon}
                                                alt="League Icon"
                                                width={56}
                                                height={56}
                                                style={{ objectFit: 'contain', pointerEvents: 'none' }}
                                            />
                                            {league ? (
                                                <Button
                                                    onClick={handleLeaguesDropdownOpen}
                                                    sx={{
                                                        textTransform: 'uppercase',
                                                        fontSize: '50px',
                                                        fontWeight: 'bold',
                                                        lineHeight: 1.1,
                                                        wordBreak: 'break-word',
                                                        overflow: 'visible',
                                                        textOverflow: 'clip',
                                                        whiteSpace: 'normal',
                                                        flexShrink: 1,
                                                        minWidth: 0,
                                                        textAlign: 'center',
                                                        color: 'white',
                                                        backgroundColor: 'transparent',
                                                        borderRadius: 0,
                                                        px: 0,
                                                        py: 0,
                                                        height: { xs: '32px', sm: 'auto' },
                                                        '&:hover': {
                                                            backgroundColor: 'transparent',
                                                        },
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                    }}
                                                    endIcon={
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                width: 0,
                                                                height: 0,
                                                                borderLeft: '10px solid transparent',
                                                                borderRight: '10px solid transparent',
                                                                borderTop: '16px solid #FFFFFF',
                                                                display: 'inline-block',
                                                                ml: 0.5
                                                            }}
                                                        />
                                                    }
                                                >
                                                    {formatLeagueName(league.name)}
                                                </Button>
                                            ) : (
                                                <Typography
                                                    sx={{
                                                        textTransform: 'uppercase',
                                                        fontSize: { xs: '0.6rem', sm: '1rem', md: '1.4rem' },
                                                        fontWeight: 'bold',
                                                        color: 'white',
                                                    }}
                                                >
                                                    Loading...
                                                </Typography>
                                            )}
                                        </Box>
                                        {league && (
                                            <Typography
                                                sx={{
                                                    mt: -1,
                                                    color: 'rgba(255,255,255,0.9)',
                                                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' },
                                                    fontWeight: 500,
                                                    letterSpacing: 0.25,
                                                }}
                                            >
                                                {seasonLabel}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Leagues Dropdown Menu */}
                                    <Menu
                                        anchorEl={leaguesDropdownAnchor}
                                        open={leaguesDropdownOpen}
                                        onClose={handleLeaguesDropdownClose}
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
                                                overflow: 'hidden',

                                            }
                                        }}
                                    >
                                        {[...allLeagues].sort((a, b) => {
                                            const an = (a?.name ?? '').toString().trim().toLowerCase();
                                            const bn = (b?.name ?? '').toString().trim().toLowerCase();
                                            if (an < bn) return -1;
                                            if (an > bn) return 1;
                                            return String(a.id).localeCompare(String(b.id));
                                        }).map((leagueItem) => (
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

                                                    background: leagueItem.id === leagueId ? 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)' : 'transparent',
                                                    border: leagueItem.id === leagueId ? '1px solid rgba(3,136,227,0.35)' : 'none',
                                                    '&:hover': {
                                                        transform: 'translateY(-1px)',
                                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                                    },

                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <Trophy size={16} color={leagueItem.id === leagueId ? '#FFFFFF' : '#9CA3AF'} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={leagueItem.name}
                                                    sx={{
                                                        '& .MuiListItemText-primary': {
                                                            fontSize: '0.95rem',
                                                            fontWeight: leagueItem.id === leagueId ? 700 : 500,
                                                            letterSpacing: 0.2,
                                                            color: leagueItem.id === leagueId ? '#FFFFFF' : '#E5E7EB'
                                                        }
                                                    }}
                                                />
                                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {leagueItem.userRole && (
                                                        <Box
                                                            sx={{
                                                                px: 1,
                                                                py: 0.25,
                                                                bgcolor: leagueItem.userRole === 'ADMIN' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                                                                color: leagueItem.userRole === 'ADMIN' ? '#1F2937' : '#FFFFFF',
                                                                borderRadius: '9999px',
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                letterSpacing: 0.3,
                                                                textTransform: 'uppercase',
                                                            }}
                                                        >
                                                            {leagueItem.userRole === 'ADMIN' ? 'Admin' : 'Member'}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                </Box>

                                {/* Orange divider under header */}
                                <Box sx={{ height: 3, bgcolor: 'rgba(229,106,22,0.9)', mt: 17 }} />

                                {/* Navigation Tabs - Pill style */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mt: 2
                                    }}
                                >
                                    <ButtonGroup
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            // borderRadius: '12px',
                                            overflow: 'hidden',
                                            gap: 0,
                                            '& .MuiButtonGroup-grouped': {
                                                borderColor: '#9CA3AF',
                                                borderWidth: 3,
                                                textTransform: 'none',
                                                fontWeight: 'normal',
                                                px: { xs: 1.5, sm: 2.5, md: 4 },
                                                py: 0.5,
                                                minWidth: 'auto',
                                            },
                                            '& .MuiButtonGroup-grouped:hover': {
                                                borderColor: '#9CA3AF',
                                                borderWidth: 3,
                                                // backgroundColor: '#c0bfbf',
                                                // color: '#fff',
                                            },
                                            '& .MuiButtonGroup-grouped:not(:last-of-type)': {
                                                borderRightColor: '#9CA3AF',
                                            },

                                        }}
                                    >

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'table' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'table' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'table' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'table' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'table' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                // Check if points are disabled
                                                // if (league?.showPoints === false) {
                                                //     setShowPointsAlert(true);
                                                //     return;
                                                // }
                                                setSection('table');
                                                router.replace(`/league/${leagueId}?tab=table`);
                                            }}
                                            startIcon={<Table size={18} className={section === 'table' ? 'stroke-white' : ''} />}
                                        >
                                            League Table
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'results' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'results' ? '#10B981' : 'rgba(255,255,255,0.92)',

                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'results' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'results' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'results' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                setSection('results');
                                                router.replace(`/league/${leagueId}?tab=results`);
                                            }}
                                            startIcon={<Search size={18} className={section === 'results' ? 'stroke-white' : ''} />}
                                        >
                                            Match Results
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'matches' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'matches' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'matches' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'matches' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'matches' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                setSection('matches');
                                                router.replace(`/league/${leagueId}?tab=matches`);
                                            }}
                                            startIcon={<Calendar size={18} className={section === 'matches' ? 'stroke-white' : ''} />}
                                        >
                                            Fixtures
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'awards' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'awards' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'awards' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'awards' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'awards' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                setSection('awards');
                                                router.replace(`/league/${leagueId}?tab=awards`);
                                            }}
                                            startIcon={<Trophy size={18} className={section === 'awards' ? 'stroke-white' : ''} />}
                                        >
                                            Leaderboard
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'members' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'members' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'members' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'members' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'members' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                setSection('members');
                                                router.replace(`/league/${leagueId}?tab=members`);
                                            }}
                                            startIcon={<Users size={18} className={section === 'members' ? 'stroke-white' : ''} />}
                                        >
                                            Players
                                        </Button>
                                        {/* Dream Team Button */}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: '#374151',
                                                backgroundColor: 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF'
                                                }
                                            }}
                                            onClick={() => {
                                                router.push('/dream-team');
                                            }}
                                            startIcon={<Star sx={{ fontSize: 18 }} />}
                                        >
                                            Dream Team
                                        </Button>
                                    </ButtonGroup>
                                </Box>
                            </Paper>
                        </Box>
                        {/* Section Content */}
                        <Paper sx={{
                            background: 'none',
                            color: 'white',
                            minHeight: 400,
                            borderRadius: 3,
                            boxShadow: 'none',
                            mt: 1.2,
                            // backdropFilter: 'blur(10px)'
                        }}>
                            {section === 'members' && (
                                // Members Section
                                <Box sx={{
                                    mt: 3, p: 0, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
                                    // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                    backdropFilter: 'blur(10px)',
                                    // border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 3,

                                }}>
                                    {league?.members && league.members.length > 0 && (
                                        <Box sx={{
                                            display: 'grid',
                                            gap: 2
                                        }}>
                                            <Paper elevation={0} sx={{
                                                p: { xs: 1, sm: 0 },
                                                borderRadius: { xs: 2, sm: 3 },
                                                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                // backgroundColor: 'transparent',
                                                minHeight: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}>
                                                {/* Header */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 }, mb: 1, mt: 2 }}>
                                                    <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, flex: 1, ml: 3 }}>Name</Typography>
                                                    <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 } }}>
                                                        {/* <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, mr: 10 }}>Position</Typography> */}
                                                        <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Stats</Typography>
                                                        <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Xp Points</Typography>
                                                        {/* <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>shirtNumber</Typography> */}
                                                    </Box>
                                                </Box>

                                                <Box sx={{
                                                    flex: 1,
                                                    overflow: 'auto',
                                                    borderRadius: { xs: 2, sm: 3 },
                                                    '&::-webkit-scrollbar': {
                                                        display: 'none'
                                                    },
                                                    scrollbarWidth: 'none',
                                                    msOverflowStyle: 'none',
                                                    px: { xs: 0, sm: 1 },
                                                    mt: 0.7
                                                }}>
                                                    <List>
                                                        {[...league.members]
                                                            .sort((a: User, b: User) => {
                                                                const xpA = a?.xp ?? 0;
                                                                const xpB = b?.xp ?? 0;
                                                                if (xpB !== xpA) return xpB - xpA; // Desc by points
                                                                // Stable tie-breaker by name to avoid flicker
                                                                const nameA = `${a?.firstName ?? ''} ${a?.lastName ?? ''}`.toLowerCase();
                                                                const nameB = `${b?.firstName ?? ''} ${b?.lastName ?? ''}`.toLowerCase();
                                                                return nameA.localeCompare(nameB);
                                                            })
                                                            .map((member) => (
                                                                <React.Fragment key={member.id}>
                                                                    <ListItem
                                                                        onClick={() => {
                                                                            router.push(`/player/${member.id}`);
                                                                        }}
                                                                        sx={{
                                                                            // boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                                            cursor: 'pointer',
                                                                            py: { xs: 1, sm: 2 },
                                                                            px: { xs: 1, sm: 2 },
                                                                            alignItems: 'center',
                                                                            // backgroundColor: '#3B8271',
                                                                            background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                                                                        }}
                                                                    >
                                                                        <ListItemAvatar>
                                                                            <Box sx={{ position: 'relative', width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }}>
                                                                                <Image src={ShirtImg} alt="Shirt" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
                                                                            </Box>
                                                                        </ListItemAvatar>
                                                                        <ListItemText className={'text-white'} primary={formatMatchName(member.firstName + ' ' + member.lastName)} />
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 8 }, ml: 'auto' }}>
                                                                            <Box sx={{
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                alignItems: 'flex-end', // Changed from 'center' to 'flex-start'
                                                                                // alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
                                                                                minWidth: { xs: 24, sm: 40 },
                                                                                width: { xs: 100, sm: 150 }, // Added fixed width
                                                                                color: 'white'
                                                                            }}>
                                                                                {/* #00C853 */}
                                                                                <SignalCellularAltIcon sx={{ color: 'green', fontSize: { xs: 16, sm: 24 } }} />

                                                                                {/* {member?.position} */}
                                                                            </Box>
                                                                            <Typography variant="h6" component="span" sx={{
                                                                                fontWeight: 'bold',
                                                                                minWidth: { xs: 36, sm: 60 },
                                                                                textAlign: 'center',
                                                                                fontSize: { xs: 13, sm: 20 },
                                                                                color: 'white'
                                                                            }}>
                                                                                {/* {member.shirtNumber} */}
                                                                                {member.xp}
                                                                            </Typography>
                                                                        </Box>
                                                                    </ListItem>
                                                                    <div className="h-[2px] bg-white"></div>

                                                                    {/* <Divider className='h-[1px]' sx={{ backgroundColor: 'white', mb: 0, mt: 0 }} /> */}

                                                                </React.Fragment>
                                                            ))}
                                                    </List>
                                                </Box>
                                                {/* )} */}
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            {section === 'matches' && (
                                // Fixtures Section - Upcoming Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    p: 2
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {isAdmin && (
                                            <Link href={`/league/${leagueId}/match`} passHref>
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                                        color: 'white',
                                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                        px: { xs: 1, sm: 1.5 },
                                                        py: 0.5,
                                                        minWidth: 'auto',
                                                        mb: 3
                                                    }}
                                                    startIcon={<Calendar size={16} className='stroke-white' />}
                                                    disabled={!league.active}
                                                >
                                                    Schedule Match
                                                </Button>
                                            </Link>
                                        )}
                                    </Box>

                                    {league?.matches && league.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                                            gap: 2
                                        }}>
                                            {league.matches
                                                .filter(match => match.status === 'SCHEDULED')
                                                .sort(compareMatchesDesc)
                                                .map((match, idx, arr) => {
                                                    const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                                                    const matchNumber = getNumericIndex(match) ?? (arr.length - idx);
                                                    // Calculate match duration in minutes
                                                    const startTime = match.start ? new Date(match.start) : new Date(match.date);
                                                    const endTime = match.end ? new Date(match.end) : new Date(startTime.getTime() + 90 * 60000);
                                                    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

                                                    return (
                                                        <Card
                                                            key={match.id}
                                                            onClick={(event) => handleMatchCardClick(match, event)}
                                                            sx={{
                                                                position: 'relative',
                                                                borderRadius: 3,
                                                                overflow: 'hidden',
                                                                background: '#222',
                                                                cursor: 'pointer',
                                                                border: '2px solid #fff',
                                                                '& .MuiCardContent-root': {
                                                                    pb: 0,
                                                                    mb: '-8px'
                                                                },
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                                                                },
                                                            }}
                                                        >
                                                            {/* Match Title Header - White Background */}
                                                            <Box sx={{
                                                                background: 'white',
                                                                py: 0.7,
                                                                px: 2,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                                borderBottom: '1px solid #e0e0e0'
                                                            }}>
                                                                <Image src={FootBallIcon} alt="Football" width={24} height={24} />
                                                                <Typography sx={{
                                                                    color: 'black',
                                                                    fontFamily: "Woodford Bourne Pro",
                                                                    fontWeight: 700,
                                                                    fontSize: '18px',
                                                                    lineHeight: 1,
                                                                    letterSpacing: 0,
                                                                    verticalAlign: 'middle',
                                                                    textTransform: 'capitalize',
                                                                    textDecoration: 'underline',
                                                                    textDecorationStyle: 'solid',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    Match {matchNumber}
                                                                </Typography>
                                                            </Box>

                                                            <CardContent sx={{ p: 0 }}>
                                                                {/* Top Section - Teams & VS */}
                                                                <Box sx={{
                                                                    pl: 1,
                                                                    pr: 1,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    borderBottom: '2px solid #fff'
                                                                }}>
                                                                    {/* Home Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        // width: '30%'
                                                                    }}>
                                                                        <Image
                                                                            src={match.homeTeamImage || HomeTeamImage}
                                                                            alt={match.homeTeamName}
                                                                            width={65}
                                                                            height={65}
                                                                            style={{ objectFit: 'contain' }}
                                                                        />
                                                                        <Typography sx={{
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            fontSize: '1.1rem',
                                                                            // mt: 1,
                                                                            textAlign: 'center'
                                                                        }}>
                                                                            Home
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* VS Center */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <Typography sx={{
                                                                            fontFamily: 'WinnerSans  !important',
                                                                            fontWeight: 700,
                                                                            // fontStyle: 'italic',
                                                                            fontSize: '3rem',
                                                                            lineHeight: 1,
                                                                            color: 'white',
                                                                            textShadow: '0px 2px 4px rgba(0,0,0,0.5)'
                                                                        }}>
                                                                            V/S
                                                                        </Typography>
                                                                        <Typography sx={{
                                                                            color: '#ddd',
                                                                            fontSize: '0.85rem',
                                                                            textAlign: 'center',
                                                                            mt: 0.5
                                                                        }}>
                                                                            {durationMinutes} Minutes Match
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Away Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        // width: '30%'
                                                                    }}>
                                                                        <Image
                                                                            src={match.awayTeamImage || AwayTeamImage}
                                                                            alt={match.awayTeamName}
                                                                            width={65}
                                                                            height={65}
                                                                            style={{ objectFit: 'contain' }}
                                                                        />
                                                                        <Typography sx={{
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            fontSize: '1.1rem',
                                                                            // mt: 1,
                                                                            textAlign: 'center'
                                                                        }}>
                                                                            Away
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {/* Bottom Info Panel */}
                                                                <Box sx={{
                                                                    display: 'flex'
                                                                }}>
                                                                    {/* Left Info Column */}
                                                                    <Box sx={{
                                                                        flex: 1,
                                                                        p: 1.5,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',
                                                                        gap: 1.5,
                                                                        // pl: 2,
                                                                        // pr: 2
                                                                    }}>
                                                                        {/* Date Row */}
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                                                <Image src={CalendarImg} alt="Date" width={16} height={16} />
                                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                                                                    {formatMatchDate(match.date)}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                                                <Image src={ClockImg} alt="Time" width={16} height={16} />
                                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                                                                    {formatMatchTime(match.date)}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setViewTeamMatch({ leagueId, matchId: match.id });
                                                                                    setViewTeamOpen(true);
                                                                                }}
                                                                                startIcon={<Image src={ViewTeamImg} alt="View Team" width={20} height={20} />}
                                                                                sx={{
                                                                                    color: 'white',
                                                                                    fontSize: '0.65rem',
                                                                                    textTransform: 'none',
                                                                                    p: 0,
                                                                                    minWidth: 'auto',
                                                                                    textDecoration: 'underline',
                                                                                    whiteSpace: 'nowrap',
                                                                                    '&:hover': { color: '#ccc' },
                                                                                    '& .MuiButton-startIcon': { mr: 1 },
                                                                                }}
                                                                            >
                                                                                View Team
                                                                            </Button>
                                                                        </Box>

                                                                        {/* Location Row */}
                                                                        {match.location && (
                                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                                                <Box sx={{ mt: 0.3 }}><Image src={LocationImg} alt="Location" width={18} height={18} /></Box>
                                                                                <Typography sx={{ color: '#ccc', fontSize: '0.85rem', lineHeight: 1.3 }}>
                                                                                    {match.location}
                                                                                </Typography>
                                                                            </Box>
                                                                        )}

                                                                        {/* Availability Buttons */}
                                                                        {isMember && (
                                                                            <Box sx={{
                                                                                display: 'flex', gap: 2,
                                                                                //  mt: 1
                                                                            }}>
                                                                                <Button
                                                                                    variant="contained"
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (!isUserAvailable) handleToggleAvailability(match.id, false);
                                                                                    }}
                                                                                    disabled={availabilityLoading[match.id] || !league?.active}
                                                                                    sx={{
                                                                                        background: '#00af80',
                                                                                        color: 'white',
                                                                                        textTransform: 'none',
                                                                                        fontWeight: 500,
                                                                                        fontSize: '0.9rem',
                                                                                        py: 0.4,
                                                                                        px: 1.5,
                                                                                        whiteSpace: 'nowrap',
                                                                                        minWidth: '100px',
                                                                                        '&:hover': { background: '#008f6a' },
                                                                                        '&.Mui-disabled': { opacity: 0.5 }
                                                                                    }}
                                                                                >
                                                                                    {availabilityLoading[match.id] ? <CircularProgress size={16} color="inherit" /> : '✓ Available'}
                                                                                </Button>
                                                                                <Button
                                                                                    variant="contained"
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (isUserAvailable) handleToggleAvailability(match.id, true);
                                                                                    }}
                                                                                    disabled={availabilityLoading[match.id] || !league?.active}
                                                                                    sx={{
                                                                                        background: '#c62828',
                                                                                        color: 'white',
                                                                                        textTransform: 'none',
                                                                                        fontWeight: 500,
                                                                                        fontSize: '0.9rem',
                                                                                        py: 0.4,
                                                                                        px: 1.5,
                                                                                        whiteSpace: 'nowrap',
                                                                                        minWidth: '100px',
                                                                                        '&:hover': { background: '#b71c1c' },
                                                                                        '&.Mui-disabled': { opacity: 0.5 }
                                                                                    }}
                                                                                >
                                                                                    {availabilityLoading[match.id] ? <CircularProgress size={16} color="inherit" /> : '✕ Unavailable'}
                                                                                </Button>
                                                                            </Box>
                                                                        )}
                                                                    </Box>

                                                                    {/* Right Admin Column */}
                                                                    <Box sx={{
                                                                        width: '95px',
                                                                        borderLeft: '2px solid #fff',
                                                                        p: 1,
                                                                        minHeight: '105px',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'flex-start',
                                                                        gap: 2
                                                                    }}>
                                                                        {isAdmin ? (
                                                                            <>
                                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', textAlign: 'left' ,ml:'-4px' }}>
                                                                                    For Admin Only
                                                                                </Typography>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        router.push(`/league/${league?.id}/match/${match.id}/edit`);
                                                                                    }}
                                                                                    disabled={!league?.active}
                                                                                    startIcon={<Edit size={16} />}
                                                                                    sx={{
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        fontSize: '0.65rem',
                                                                                        whiteSpace: 'nowrap',
                                                                                        '&:hover': { textDecoration: 'underline' },
                                                                                        '& .MuiButton-startIcon': { mr: 0.5 }
                                                                                    }}
                                                                                >
                                                                                    Edit Match
                                                                                </Button>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRequestDeleteMatch(match);
                                                                                    }}
                                                                                    startIcon={<Trash2 size={16} />}
                                                                                    sx={{
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        fontSize: '0.65rem',
                                                                                        whiteSpace: 'nowrap',
                                                                                        '&:hover': { textDecoration: 'underline' },
                                                                                        '& .MuiButton-startIcon': { mr: 0.5 }
                                                                                    }}
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
                                                })}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            No upcoming matches scheduled yet
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {section === 'results' && (
                                // Results Section - Completed Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    p: 2
                                }}>
                                    {league?.matches && league.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                                            gap: 2
                                        }}>
                                            {league.matches
                                                .filter(match => match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_UPLOADED')
                                                .sort(compareMatchesDesc)
                                                .map((match, idx, arr) => {
                                                    const matchNumber = getNumericIndex(match) ?? (arr.length - idx);
                                                    const startTime = match.start ? new Date(match.start) : new Date(match.date);
                                                    const endTime = match.end ? new Date(match.end) : new Date(startTime.getTime() + 90 * 60000);
                                                    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                                                    
                                                    // Calculate win result
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
                                                                // '& .MuiCardContent-root': {
                                                                //     pb: 0,
                                                                //     mb: '-13px'
                                                                // },
                                                                '& .css-1i9wt8r-MuiCardContent-root:last-child':{
                                                                    pb:'0px !important',
                                                                },
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                                                                },
                                                            }}
                                                        >
                                                            {/* Archived label */}
                                                            {match.archived && (
                                                                <Chip
                                                                    label="Canceled by Admin"
                                                                    size="small"
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: 40,
                                                                        left: '50%',
                                                                        transform: 'translateX(-50%)',
                                                                        zIndex: 10,
                                                                        backgroundColor: '#b91c1c',
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                    }}
                                                                />
                                                            )}

                                                            {/* Match Title Header - White Background */}
                                                            <Box sx={{
                                                                background: 'white',
                                                                py: 0.7,
                                                                px: 2,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                                borderBottom: '1px solid #e0e0e0'
                                                            }}>
                                                                <Image src={FootBallIcon} alt="Football" width={24} height={24} />
                                                                <Typography sx={{
                                                                    color: 'black',
                                                                    fontFamily: "Woodford Bourne Pro",
                                                                    fontWeight: 700,
                                                                    fontSize: '18px',
                                                                    lineHeight: 1,
                                                                    letterSpacing: 0,
                                                                    verticalAlign: 'middle',
                                                                    textTransform: 'capitalize',
                                                                    textDecoration: 'underline',
                                                                    textDecorationStyle: 'solid',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    Match {matchNumber}
                                                                </Typography>
                                                            </Box>

                                                            <CardContent sx={{ p: 0 }}>
                                                                {/* Result Text Banner */}
                                                                <Box sx={{
                                                                    // background: match.status === 'RESULT_UPLOADED' ? '#F59E0B' : '#333',
                                                                    py: 0.5,
                                                                    textAlign: 'center'
                                                                }}>
                                                                    <Typography sx={{
                                                                        color: 'white',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 400
                                                                    }}>
                                                                        {match.status === 'RESULT_UPLOADED' ? 'Awaiting Confirmation' : resultText}
                                                                    </Typography>
                                                                </Box>

                                                                {/* Top Section - Teams & Score */}
                                                                <Box sx={{
                                                                    pl: 1,
                                                                    pr: 1,
                                                                    py: 1,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    borderBottom: '2px solid #fff',
                                                                    mt:-3.5
                                                                }}>
                                                                    {/* Home Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                    }}>
                                                                        <Image
                                                                            src={match.homeTeamImage || HomeTeamImage}
                                                                            alt={match.homeTeamName}
                                                                            width={65}
                                                                            height={65}
                                                                            style={{ objectFit: 'contain' }}
                                                                        />
                                                                        <Typography sx={{
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            fontSize: '1.1rem',
                                                                            textAlign: 'center'
                                                                        }}>
                                                                            Home
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Score Center */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        mt:1
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 , mt:2}}>
                                                                            {/* Home Goals with label below */}
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                <Typography sx={{
                                                                                    fontWeight: 700,
                                                                                    fontSize: '2.5rem',
                                                                                    lineHeight: 1,
                                                                                    color: 'white',
                                                                                }}>
                                                                                    {homeGoals}
                                                                                </Typography>
                                                                                <Typography sx={{
                                                                                    fontSize: '0.5rem',
                                                                                    color: '#aaa',
                                                                                    // mt: 0.3
                                                                                }}>
                                                                                    Goal Score
                                                                                </Typography>
                                                                            </Box>
                                                                            
                                                                            {/* V/S */}
                                                                            <Typography sx={{
                                                                                fontWeight: 700,
                                                                                fontSize: '1.5rem',
                                                                                lineHeight: 1,
                                                                                color: 'white',
                                                                            }}>
                                                                                V/S
                                                                            </Typography>
                                                                            
                                                                            {/* Away Goals with label below */}
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                <Typography sx={{
                                                                                    fontWeight: 700,
                                                                                    fontSize: '2.5rem',
                                                                                    lineHeight: 1,
                                                                                    color: 'white',
                                                                                }}>
                                                                                    {awayGoals}
                                                                                </Typography>
                                                                                <Typography sx={{
                                                                                    fontSize: '0.5rem',
                                                                                    color: '#aaa',
                                                                                    // mt: 0.3
                                                                                }}>
                                                                                    Goal Score
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                        <Typography sx={{
                                                                            color: '#ddd',
                                                                            fontSize: '0.85rem',
                                                                            textAlign: 'center',
                                                                            mt: 0.5
                                                                        }}>
                                                                            {durationMinutes} Minutes Match
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Away Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                    }}>
                                                                        <Image
                                                                            src={match.awayTeamImage || AwayTeamImage}
                                                                            alt={match.awayTeamName}
                                                                            width={65}
                                                                            height={65}
                                                                            style={{ objectFit: 'contain' }}
                                                                        />
                                                                        <Typography sx={{
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            fontSize: '1.1rem',
                                                                            textAlign: 'center'
                                                                        }}>
                                                                            Away
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {/* Bottom Info Panel */}
                                                                <Box sx={{
                                                                    display: 'flex'
                                                                }}>
                                                                    {/* Left Info Column */}
                                                                    <Box sx={{
                                                                        flex: 1,
                                                                        p: 1.5,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'space-between',
                                                                        minHeight: '105px',
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                            {/* Date Row */}
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                                                    <Image src={CalendarImg} alt="Date" width={16} height={16} />
                                                                                    <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                                                                        {formatMatchDate(match.date)}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                                                                                    <Image src={ClockImg} alt="Time" width={16} height={16} />
                                                                                    <Typography sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                                                                        {formatMatchTime(match.date)}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>

                                                                            {/* Location Row */}
                                                                            {match.location ? (
                                                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '160px' }}>
                                                                                    <Box sx={{ mt: 0.3, flexShrink: 0 }}><Image src={LocationImg} alt="Location" width={18} height={18} /></Box>
                                                                                    <Typography sx={{ color: '#ccc', fontSize: '0.6rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
                                                                                        {match.location}
                                                                                    </Typography>
                                                                                </Box>
                                                                            ) : (
                                                                                <Box sx={{ height: '20px' }} />
                                                                            )}
                                                                        </Box>

                                                                        {/* MOTM Section */}
                                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' , mt:-8 }}>
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                                                                <Image src={CardStar} alt="MOTM" width={28} height={28} />
                                                                                {(() => {
                                                                                    const votes = match.manOfTheMatchVotes || {};
                                                                                    const voteCounts: Record<string, number> = {};
                                                                                    
                                                                                    if (typeof votes === 'object' && !Array.isArray(votes)) {
                                                                                        Object.values(votes).forEach((playerId) => {
                                                                                            if (playerId) {
                                                                                                const playerIdStr = String(playerId);
                                                                                                voteCounts[playerIdStr] = (voteCounts[playerIdStr] || 0) + 1;
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                    
                                                                                    let maxVotes = 0;
                                                                                    let motmPlayerId = '';
                                                                                    Object.entries(voteCounts).forEach(([playerId, count]) => {
                                                                                        if (count > maxVotes) {
                                                                                            maxVotes = count;
                                                                                            motmPlayerId = playerId;
                                                                                        }
                                                                                    });
                                                                                    
                                                                                    if (motmPlayerId && maxVotes > 0) {
                                                                                        const allPlayers = [...(match.homeTeamUsers || []), ...(match.awayTeamUsers || [])];
                                                                                        const motmPlayer = allPlayers.find(p => String(p.id) === String(motmPlayerId));
                                                                                        
                                                                                        if (motmPlayer && motmPlayer.firstName && motmPlayer.lastName) {
                                                                                            return (
                                                                                                <Typography sx={{ color: '#FFD700', fontSize: '0.6rem', fontWeight: 700, textAlign: 'center' }}>
                                                                                                    {motmPlayer.firstName} {motmPlayer.lastName}
                                                                                                </Typography>
                                                                                            );
                                                                                        }
                                                                                    }
                                                                                    return null;
                                                                                })()}
                                                                           <Typography sx={{ color: 'white', fontSize: '0.4rem', fontWeight: 600, textAlign: 'center' }}>
                                                                                    Man Of The Match
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>

                                                                        {/* Action Buttons */}
                                                                        <Box sx={{
                                                                            display: 'flex',
                                                                            justifyContent: 'center',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                            // mt: 1.5
                                                                        }}>
                                                                            {/* Add Stats Button */}
                                                                            {(isAdmin || (
                                                                                isMember && (
                                                                                    match.homeTeamUsers?.some((u) => String(u?.id) === String(user?.id)) ||
                                                                                    match.awayTeamUsers?.some((u) => String(u?.id) === String(user?.id))
                                                                                )
                                                                            )) && (
                                                                                <Button
                                                                                    size="small"
                                                                                    onClick={() => {
                                                                                        setSelectedMatchIdForDialog(match.id);
                                                                                        setShouldShowAdminGoals(false);
                                                                                        setMatchStatsOpen(true);
                                                                                    }}
                                                                                    startIcon={<Image src={ADDSTATS} alt="Add Stats" width={34} height={34} />}
                                                                                    disabled={!league?.active || match.status === 'RESULT_UPLOADED'}
                                                                                    sx={{
                                                                                        // backgroundColor: '#333',
                                                                                        color: 'white',
                                                                                        fontSize: '0.6rem',
                                                                                        textTransform: 'none',
                                                                                        py: 0.5,
                                                                                        px: 1,
                                                                                        borderRadius: '50px',
                                                                                        border: idx === 0 ? '1.4px solid #F97316' : '1.4px solid #9c9c9c',
                                                                                        whiteSpace: 'nowrap',
                                                                                        '&:hover': { backgroundColor: '#444' },
                                                                                        '&.Mui-disabled': { color: 'white' },
                                                                                        '& .MuiButton-startIcon': { mr: 0.4 }
                                                                                    }}
                                                                                >
                                                                                    Add Stats
                                                                                </Button>
                                                                            )}

                                                                            {/* View Team Button */}
                                                                            <Button
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setViewTeamMatch({ leagueId, matchId: match.id });
                                                                                    setViewTeamOpen(true);
                                                                                }}
                                                                                startIcon={<Image src={ViewTeamImg} alt="View Team" width={34} height={34} />}
                                                                                sx={{
                                                                                    // backgroundColor: '#333',
                                                                                    color: 'white',
                                                                                    fontSize: '0.6rem',
                                                                                    textTransform: 'none',
                                                                                    py: 0.5,
                                                                                    px: 1,
                                                                                    borderRadius: '50px',
                                                                                    border: idx === 0 ? '1.4px solid #F97316' : '1.4px solid #9c9c9c',
                                                                                    whiteSpace: 'nowrap',
                                                                                    '&:hover': { backgroundColor: '#444' },
                                                                                    '& .MuiButton-startIcon': { mr: 0.4 }
                                                                                }}
                                                                            >
                                                                                View Team
                                                                            </Button>

                                                                            {/* Results Button */}
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => router.push(`/match/${match.id}`)}
                                                                                startIcon={<Image src={RESULTS} alt="Results" width={28} height={28} />}
                                                                                disabled={match.status === 'RESULT_UPLOADED'}
                                                                                sx={{
                                                                                    // backgroundColor: '#333',
                                                                                    color: 'white',
                                                                                    fontSize: '0.6rem',
                                                                                    textTransform: 'none',
                                                                                    py: 0.5,
                                                                                    px: 1,
                                                                                    borderRadius: '50px',
                                                                                    border: idx === 0 ? '1.4px solid #F97316' : '1.4px solid #9c9c9c',
                                                                                    whiteSpace: 'nowrap',
                                                                                    '&:hover': { backgroundColor: '#444' },
                                                                                    '&.Mui-disabled': { color: 'white' },
                                                                                    '& .MuiButton-startIcon': { mr: 0.4 }
                                                                                }}
                                                                            >
                                                                                Results
                                                                            </Button>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Right Admin Column */}
                                                                    <Box sx={{
                                                                        width: '95px',
                                                                        borderLeft: '2px solid #fff',
                                                                        p: 1,
                                                                        minHeight: '105px',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'flex-start',
                                                                        gap: 1
                                                                    }}>
                                                                        {isAdmin ? (
                                                                            <>
                                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', textAlign: 'left' , ml:'-5px' }}>
                                                                                    For Admin Only
                                                                                </Typography>
                                                                                {/* Add Score Button */}
                                                                                <Button
                                                                                    onClick={() => {
                                                                                        setSelectedMatchIdForDialog(match.id);
                                                                                        setShouldShowAdminGoals(true);
                                                                                        setMatchStatsOpen(true);
                                                                                    }}
                                                                                    startIcon={<Edit size={14}  color="#00a77f" />}
                                                                                    sx={{
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        fontSize: '0.6rem',
                                                                                        whiteSpace: 'nowrap',
                                                                                        textDecoration: 'underline',
                                                                                        '& .MuiButton-startIcon': { mr: 0.5 }
                                                                                    }}
                                                                                >
                                                                                    Add Score
                                                                                </Button>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        router.push(`/league/${league?.id}/match/${match.id}/edit`);
                                                                                    }}
                                                                                    disabled={!league?.active}
                                                                                    startIcon={<Edit size={14} color="#00a77f" />}
                                                                                    sx={{
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        fontSize: '0.6rem',
                                                                                        whiteSpace: 'nowrap',
                                                                                        textDecoration: 'underline',
                                                                                        '& .MuiButton-startIcon': { mr: 0.5 }
                                                                                    }}
                                                                                >
                                                                                    Edit Match
                                                                                </Button>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (match.archived) {
                                                                                            setArchivedActionMatch(match);
                                                                                            setArchivedActionOpen(true);
                                                                                        } else {
                                                                                            handleRequestDeleteMatch(match);
                                                                                        }
                                                                                    }}
                                                                                    startIcon={match.archived ? <Undo2 size={14} /> : <Trash2 size={14} />}
                                                                                    sx={{
                                                                                        color: match.archived ? '#4CAF50' : '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        fontSize: '0.6rem',
                                                                                        whiteSpace: 'nowrap',
                                                                                        textDecoration: 'underline',
                                                                                        '& .MuiButton-startIcon': { mr: 0.5 }
                                                                                    }}
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
                                                })}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            No completed matches yet
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {section === 'table' && (
                                <div className="w-full mx-auto">
                                    <Card sx={{
                                        background: '#383838',
                                        backdropFilter: 'blur(10px)',
                                        // border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: { xs: 2, sm: 3 },
                                        boxShadow: 'none',
                                        mt: 1.2,
                                        overflow: 'auto',
                                        '&::-webkit-scrollbar': {
                                            height: '6px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: '#383838',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#383838',
                                            borderRadius: '3px',
                                        },
                                    }} className="text-white">
                                        {/* <div className="p-3">
                                            <h2 className="text-lg font-bold text-white">League Table</h2>
                                        </div> */}

                                        <div className="w-full rounded-lg overflow-hidden league-table">
                                            {/* Header Bar aligned to table grid */}
                                            <div className="grid grid-cols-[50px_1fr_80px_60px_60px_60px_60px_70px_70px_80px] items-center px-4 py-3 border-b border-border league-header-white">
                                                <div className="col-start-1 col-span-8 pl-[32px] flex items-center gap-2 text-foreground league-header-text">
                                                    <span className="text-muted-foreground">Invites Players To</span>
                                                    <span className="font-bold text-primary">{league?.name || 'League'}</span>
                                                    <span className="text-muted-foreground">Using The Code</span>
                                                    <span className="font-bold">{league?.inviteCode || league?.id || '-'}</span>
                                                    <button
                                                        className="p-1.5 hover:bg-muted rounded transition-colors"
                                                        onClick={() => { const code = league?.inviteCode || ''; if (code) navigator.clipboard?.writeText(code); }}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-muted rounded transition-colors">
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="col-start-10 col-span-2 justify-self-end">
                                                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded inline-flex items-center whitespace-nowrap">
                                                        {/* <Plus className="w-4 h-4 mr-2" /> */}
                                                        + New Match
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Table Header */}
                                            <div className="grid mt-4 grid-cols-[50px_1fr_80px_60px_60px_60px_60px_70px_70px_80px] items-center px-4 py-3 bg-table-header border-b border-border text-muted-foreground league-header-row league-header-inset league-table-heading">
                                                <div className="text-center">#</div>
                                                <div className="pl-[52px] text-left">NAME</div>
                                                <div className="text-center">MOTM</div>
                                                <div className="text-center">P</div>
                                                <div className="text-center">W</div>
                                                <div className="text-center">D</div>
                                                <div className="text-center">L</div>
                                                <div className="text-center">GD</div>
                                                <div className="text-center">W%</div>
                                                <div className="text-center">xp PTS</div>
                                            </div>

                                            {/* Table Rows */}
                                            <div>
                                                {[...tableData]
                                                    .sort((a, b) => {
                                                        const aPts = (a.wins ?? 0) * 3 + (a.draws ?? 0);
                                                        const bPts = (b.wins ?? 0) * 3 + (b.draws ?? 0);
                                                        const aXP = a.xp ?? 0;
                                                        const bXP = b.xp ?? 0;
                                                        const aScore = (league?.showPoints === false) ? aPts : aXP;
                                                        const bScore = (league?.showPoints === false) ? bPts : bXP;
                                                        if (bScore !== aScore) return bScore - aScore;
                                                        if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0);
                                                        if ((a.played ?? 0) !== (b.played ?? 0)) return (a.played ?? 0) - (b.played ?? 0);
                                                        return (a.name || '').localeCompare(b.name || '');
                                                    })
                                                    .map((player, index) => {
                                                        const points = (player.wins ?? 0) * 3 + (player.draws ?? 0);
                                                        const firstName = player.name.split(' ')[0] || player.name;
                                                        const lastName = player.name.split(' ').slice(1).join(' ') || '';
                                                        const xpPts = league?.showPoints === false ? points : (player.xp ?? 0);

                                                        const posLabel = (league?.members || []).find(m => String(m.id) === String(player.id))?.position || 'Striker';
                                                        const member = (league?.members || []).find(m => String(m.id) === String(player.id));
                                                        const playerImageSrc = member?.profilePicture || member?.profilePicture || (player as any)?.imageUrl || (player as any)?.profileImage || (player as any)?.image || PlayerImg;
                                                        const isEven = index % 2 === 0;

                                                        return (
                                                            <div
                                                                key={player.id}
                                                                onClick={(e) => { e.preventDefault(); if (league?.id) openQuickViewFromTable(String(league.id), String(player.id)); }}
                                                                className={`grid grid-cols-[50px_1fr_80px_60px_60px_60px_60px_70px_70px_80px] items-center px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${isEven ? 'bg-table-row-even' : 'bg-table-row-odd'} league-row league-row-inset mb-2`}
                                                            >
                                                                {/* Rank */}
                                                                <div className="text-center text-foreground font-medium">{index + 1}</div>

                                                                {/* Player Info */}
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                        <div className="relative w-full h-full">
                                                                            <Image src={playerImageSrc as any} alt={player?.name || 'Player'} fill style={{ objectFit: 'cover' }} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <span className="text-foreground font-semibold truncate">{formatMatchName(firstName)} {formatMatchName(lastName)}</span>
                                                                            {player.isAdmin && <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                                                                        </div>
                                                                        <span className="text-muted-foreground font-normal text-xs">{posLabel}</span>
                                                                    </div>
                                                                </div>

                                                                {/* MOTM */}
                                                                <div className="text-center">
                                                                    {typeof player.motmCount === 'number' && player.motmCount > 0 ? (
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <span className="text-foreground font-medium">{player.motmCount}</span>
                                                                            <span className="inline-flex items-center" style={{ verticalAlign: 'middle' }}>
                                                                                {/* Using MUI Star icon already imported */}
                                                                                <Star sx={{ fontSize: 18, color: '#F59E0B' }} />
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </div>

                                                                {/* Stats */}
                                                                <div className="text-center text-foreground">{player.played}</div>
                                                                <div className="text-center text-foreground">{player.wins}</div>
                                                                <div className="text-center text-foreground">{player.draws}</div>
                                                                <div className="text-center text-foreground">{player.losses}</div>
                                                                <div className="text-center text-foreground">-</div>
                                                                <div className="text-center text-foreground">{player.winPercentage}</div>
                                                                <div className="text-center text-foreground font-bold">{xpPts}</div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </Card>
                                    {/* // ...existing code... */}
                                    {league && (
                                        <Box sx={{ mt: 2 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: { xs: 1.5, sm: 2 },
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(177deg,rgba(229, 106, 22, 0.92) 26%, rgba(207, 35, 38, 0.92) 100%)',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                                                }}
                                            >
                                                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                                    Statistics
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        p: { xs: 1, sm: 2 },
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {!leagueStats ? (
                                                        <Typography variant="body2" sx={{ color: 'white' }}>
                                                            Loading statistics…
                                                        </Typography>
                                                    ) : (
                                                        (() => {
                                                            // Compute season progress with correct Remaining logic
                                                            const maxGames = Number(league?.maxGames ?? 0);

                                                            // Prefer backend-provided playedMatches; otherwise derive from matches
                                                            const derivedPlayed = (() => {
                                                                if (typeof leagueStats?.playedMatches === 'number') return Number(leagueStats.playedMatches);
                                                                const matches = Array.isArray(league?.matches) ? league.matches : [];
                                                                return matches.filter(m => m?.status === 'RESULT_PUBLISHED' || m?.status === 'RESULT_UPLOADED').length;
                                                            })();

                                                            const played = derivedPlayed;

                                                            // If maxGames is set (>0), Remaining = maxGames - played; else fallback to server remaining
                                                            const remaining = maxGames > 0
                                                                ? Math.max(maxGames - played, 0)
                                                                : Number(leagueStats?.remaining ?? 0);

                                                            // Total games is maxGames when provided; otherwise played + remaining
                                                            const total = maxGames > 0 ? maxGames : played + remaining;
                                                            const pct = total > 0 ? Math.round((played / total) * 100) : 0;

                                                            const createdD = leagueStats.created ? new Date(leagueStats.created) : null;
                                                            const createdStr = createdD
                                                                ? `Created On ${createdD.toLocaleDateString('en-GB', {
                                                                    weekday: 'long',
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                })} At ${createdD.toLocaleTimeString('en-GB', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: false,
                                                                })}`
                                                                : 'Created On -';

                                                            return (
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1, sm: 1.5 } }}>
                                                                    {/* Season progress */}
                                                                    <Box
                                                                        sx={{
                                                                            p: { xs: 1, sm: 1.5 },
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid rgba(52,211,153,0.35)',
                                                                            background: 'linear-gradient(180deg, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0.07) 100%)',
                                                                        }}
                                                                    >
                                                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                                            Season Progress
                                                                        </Typography>
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.75, mb: 1, gap: 1 }}>
                                                                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                                {played} Played
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                                {remaining} Remaining
                                                                            </Typography>
                                                                        </Box>
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={pct}
                                                                            sx={{
                                                                                height: { xs: 6, sm: 8 },
                                                                                borderRadius: 999,
                                                                                backgroundColor: 'rgba(255,255,255,0.15)',
                                                                                '& .MuiLinearProgress-bar': { backgroundColor: '#34d399' },
                                                                            }}
                                                                        />
                                                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.75, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                                            {pct}% complete
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Players + Created */}
                                                                    <Box
                                                                        sx={{
                                                                            p: { xs: 1, sm: 1.5 },
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid rgba(245,158,11,0.35)',
                                                                            background: 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.07) 100%)',
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Users size={16} color="#F59E0B" />
                                                                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                                {(leagueStats.players ?? league?.members?.length ?? 0)} Players
                                                                            </Typography>
                                                                        </Box>

                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                                            <Calendar size={16} color="#F59E0B" />
                                                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontSize: { xs: '0.7rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                                                                                {createdStr}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Best pairing + Hottest */}
                                                                    <Box
                                                                        sx={{
                                                                            gridColumn: { xs: '1 / -1', sm: '1 / -1' },
                                                                            display: 'flex',
                                                                            flexDirection: { xs: 'column', sm: 'row' },
                                                                            flexWrap: 'wrap',
                                                                            gap: { xs: 0.75, sm: 1 },
                                                                            mt: 0.5,
                                                                        }}
                                                                    >
                                                                        <Chip
                                                                            label={
                                                                                leagueStats.bestPairing
                                                                                    ? `Best pairing: ${leagueStats.bestPairing.names[0]} and ${leagueStats.bestPairing.names[1]}`
                                                                                    : 'Best pairing will appear when enough matches are completed.'
                                                                            }
                                                                            sx={{
                                                                                color: 'white',
                                                                                border: '1px solid rgba(59,130,246,0.4)',
                                                                                background: leagueStats.bestPairing
                                                                                    ? 'linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.10) 100%)'
                                                                                    : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
                                                                                fontWeight: 600,
                                                                                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                                                                                height: { xs: 'auto', sm: 32 },
                                                                                py: { xs: 0.5, sm: 0 },
                                                                                '& .MuiChip-label': {
                                                                                    px: { xs: 1, sm: 1.5 },
                                                                                    whiteSpace: 'normal',
                                                                                    lineHeight: 1.3,
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Chip
                                                                            icon={<Flame size={14} color="#F97316" />}
                                                                            label={
                                                                                leagueStats.hottestPlayer
                                                                                    ? `${leagueStats.hottestPlayer.name} is the hottest player right now!`
                                                                                    : 'Hottest player will appear after recent matches with stats.'
                                                                            }
                                                                            sx={{
                                                                                color: 'white',
                                                                                border: '1px solid rgba(249,115,22,0.4)',
                                                                                background: leagueStats.hottestPlayer
                                                                                    ? 'linear-gradient(180deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.10) 100%)'
                                                                                    : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
                                                                                fontWeight: 600,
                                                                                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                                                                                height: { xs: 'auto', sm: 32 },
                                                                                py: { xs: 0.5, sm: 0 },
                                                                                '& .MuiChip-label': {
                                                                                    px: { xs: 1, sm: 1.5 },
                                                                                    whiteSpace: 'normal',
                                                                                    lineHeight: 1.3,
                                                                                },
                                                                                '& .MuiChip-icon': {
                                                                                    ml: { xs: 0.5, sm: 1 },
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })()
                                                    )}
                                                </Box>
                                            </Paper>
                                        </Box>
                                    )}
                                    {/* // ...existing code... */}
                                </div>
                            )}

                            {section === 'awards' && (
                                // Trophy Room Section
                                <Box sx={{ maxHeight: 'none', p: 0 }}>
                                    <TrophyRoom leagueId={leagueId} />
                                </Box>
                            )}
                        </Paper>

                        <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
                            <DialogTitle>Teams for {selectedMatch?.homeTeamName} vs {selectedMatch?.awayTeamName}</DialogTitle>
                            <DialogContent>
                                {selectedMatch && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName}</Typography>
                                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                        <Grid container spacing={1}>
                                            {selectedMatch.homeTeamUsers.map(player => (
                                                <Grid xs={6} key={player.id}>
                                                    <Chip label={`${player.firstName} ${player.lastName}`} sx={{ m: 0.5, color: 'black' }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                                {selectedMatch && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName}</Typography>
                                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                        <Grid container spacing={1}>
                                            {selectedMatch.awayTeamUsers.map(player => (
                                                <Grid xs={6} key={player.id}>
                                                    <Chip label={`${player.firstName} ${player.lastName}`} sx={{ m: 0.5, color: 'black' }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseTeamModal}>Close</Button>
                            </DialogActions>
                        </Dialog>
                        {/* Members dialog (full-featured) */}
                        <Snackbar
                            open={!!toastMessage}
                            autoHideDuration={3000}
                            onClose={() => setToastMessage(null)}
                            message={toastMessage}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        />

                        {/* Points Disabled Alert */}
                        <Snackbar
                            open={showPointsAlert}
                            autoHideDuration={4000}
                            onClose={() => setShowPointsAlert(false)}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert
                                onClose={() => setShowPointsAlert(false)}
                                severity="info"
                                sx={{
                                    width: '100%',
                                    backgroundColor: 'rgba(30, 58, 138, 0.9)',
                                    color: 'white',
                                    '& .MuiAlert-icon': { color: 'white' },
                                    '& .MuiAlert-message': { color: 'white' }
                                }}
                            >
                                Admin have disabled the points option. You will not see the points in the table.
                            </Alert>
                        </Snackbar>
                        {/* // Add this after your Snackbar components, before the closing Container tag */}
                        {/* Undo Snackbar */}
                        {undoInfo && (
                            <Snackbar
                                open={!!undoInfo}
                                autoHideDuration={10000} // 10 seconds to undo
                                onClose={() => setUndoInfo(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                action={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            color="inherit"
                                            size="small"
                                            onClick={handleUndo}
                                            sx={{
                                                color: '#fff',
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                                            }}
                                            startIcon={<Undo2 size={16} />}
                                        >
                                            Undo
                                        </Button>
                                        <IconButton
                                            size="small"
                                            aria-label="close"
                                            color="inherit"
                                            onClick={() => setUndoInfo(null)}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                                message={
                                    undoInfo.action === 'archive'
                                        ? `Match archived. ${toastMessage}`
                                        : 'Match deleted permanently'
                                }
                            />
                        )}

                        {/* Match Stats Dialog (embedded) */}
                        <PlayMatchPagee
                            open={matchStatsOpen}
                            onClose={async () => {
                                console.log('🔄 PlayMatchPagee closing - refreshing data');

                                // � Fetch fresh league data from backend
                                await fetchLeagueDetails();

                                // 📢 Dispatch event for other components
                                window.dispatchEvent(new CustomEvent('match-updated'));

                                // Close dialog
                                setMatchStatsOpen(false);

                                console.log('✅ Match dialog closed and data refreshed');
                            }}
                            initialLeagueId={league?.id}
                            initialMatchId={selectedMatchIdForDialog || undefined}
                            showAdminGoalsSection={shouldShowAdminGoals}
                        />

                        {/* Line 4844 omitted */}
                        <PlayerStatsDialog
                            open={statsDialogOpen}
                            onClose={() => setStatsDialogOpen(false)}
                            onSave={handleSaveStats}
                            isSubmitting={isSubmittingStats}
                            stats={stats}
                            handleStatChange={handleStatChange}
                            teamGoals={getMatchGoals()}
                        />

                        <MatchDetailModal
                            open={matchDetailModalOpen}
                            onClose={() => setMatchDetailModalOpen(false)}
                            match={selectedMatchDetail}
                        />
                    </>
                )}
            </Container>


            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Are you sure you want to delete this match?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {(matchPendingDelete?.homeTeamGoals ?? 0) > 0 ||
                            (matchPendingDelete?.awayTeamGoals ?? 0) > 0 ||
                            matchPendingDelete?.status === 'RESULT_PUBLISHED' || matchPendingDelete?.status === 'RESULT_PUBLISHED'
                            ? 'Scores exist. It will be archived (Canceled by Admin) and removed from stats. You can undo.'
                            : 'No scores yet. It will be permanently deleted.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleConfirmDeleteMatch}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* // ...existing code... */}
            <Dialog
                open={archivedActionOpen}
                onClose={() => setArchivedActionOpen(false)}
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
                                disabled={archivedActionChecking || archivedActionHasStats === true}
                                onClick={() => {
                                    // Re-check if needed, then delete
                                    tryHardDeleteFromDialog();
                                }}
                                startIcon={<Trash2 size={16} />}
                            >
                                {archivedActionChecking ? 'Checking…' : 'Permanently Delete'}
                            </Button>
                        </span>
                    </Tooltip>
                    {/* // ...existing code... */}
                </DialogActions>
            </Dialog>
            {/* // ...existing code... */}
            <Dialog open={viewTeamOpen} onClose={() => setViewTeamOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    Team Preview
                    <IconButton
                        onClick={() => setViewTeamOpen(false)}
                        size="small"
                        sx={{ color: 'inherit' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <TeamPreviewScreen leagueId={viewTeamMatch?.leagueId} matchId={viewTeamMatch?.matchId} />
                </DialogContent>
            </Dialog>












            <Dialog
                open={openQuickView}
                onClose={() => setOpenQuickView(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0, py: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 } }}>
                    {quickView.trophyTitle ? `${quickView.trophyTitle} • ` : ''} Player
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton onClick={() => setOpenQuickView(false)} edge="end" size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />
                <DialogContent sx={{ p: { xs: 1, sm: 2 }, overflowX: 'hidden' }}>
                    {quickView.player && (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '170px 1fr', sm: '240px 1fr' },
                                gap: { xs: 1.5, sm: 2 },
                                alignItems: 'start'
                            }}
                        >
                            {/* Left: PlayerCard with stats */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                width: '100%'
                            }}>
                                <Box sx={{
                                    position: 'relative',
                                    width: { xs: 170, sm: 240 },
                                    height: { xs: 255, sm: 360 },
                                    mx: { xs: 'auto', sm: 0 },
                                    // Scale down actual PlayerCard on mobile to avoid overflow into next column
                                    // '& > *': {
                                    //     transform: { xs: 'scale(0.7)', sm: 'none' },
                                    //     transformOrigin: 'top left'
                                    // }
                                    '& > *': {
                                        transform: { xs: 'scale(0.7)', sm: 'none' },
                                        transformOrigin: 'top left'
                                    }
                                }}>
                                    {(() => {
                                        const p = quickView.player as User & PlayerProfileLike;
                                        const playerCardProps = {
                                            name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
                                            number: getShirtNumber(p),
                                            points: Number(quickView.xp ?? 0),
                                            stats: {
                                                DRI: String(quickView.skills?.dribbling ?? 0),
                                                SHO: String(quickView.skills?.shooting ?? 0),
                                                PAS: String(quickView.skills?.passing ?? 0),
                                                PAC: String(quickView.skills?.pace ?? 0),
                                                DEF: String(quickView.skills?.defending ?? 0),
                                                PHY: String(quickView.skills?.physical ?? 0),
                                            },
                                            foot: getPreferredFoot(p),
                                            profileImage: getProfileImage(p),
                                            shirtIcon: '',
                                            position: posToShort(p.position),
                                        } satisfies PlayerCardProps;
                                        return <PlayerCard {...playerCardProps} disableImagePopup />;
                                    })()}
                                </Box>
                                {/* Icons grid under the player card - 2 columns on mobile */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                                        gap: { xs: 1, sm: 1 },
                                        maxWidth: { xs: 170, sm: '100%' },
                                        mx: { xs: 'auto', sm: 0 },
                                        mt: 2
                                    }}
                                >
                                    {[
                                        { img: Goals, label: 'Goals', value: quickView.stats?.goals ?? 0 },
                                        { img: Assist, label: 'Assists', value: quickView.stats?.assists ?? 0 },
                                        { img: Cleansheet, label: 'Clean Sheets', value: quickView.cleanSheets ?? 0 },
                                        { img: Momt, label: 'Votes', value: quickView.motmCount ?? 0 },
                                    ].map((it, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 0.25,
                                                p: 0.5,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Image src={it.img} alt={it.label} width={24} height={24} style={{ objectFit: 'contain' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem' } }}>
                                                    {it.value}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#64748b',
                                                    fontSize: { xs: it.label === 'Clean Sheets' ? '0.55rem' : '0.6rem', sm: '0.75rem' },
                                                    textAlign: 'center',
                                                    lineHeight: 1.1,
                                                    whiteSpace: 'nowrap',
                                                    letterSpacing: 0,
                                                }}
                                            >
                                                {it.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            {/* Right: Last 10 Matches */}
                            <Paper elevation={0} sx={{
                                p: { xs: 1.25, sm: 2 },
                                border: '1px solid rgba(0,0,0,0.08)',
                                height: { xs: 'auto', sm: '420px' },
                                borderRadius: 2,
                                overflowY: 'auto',
                                position: 'relative',
                                // ml:5,
                            }}>
                                <Typography sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '0.75rem', sm: '0.95rem', md: '0.8rem' }, letterSpacing: 0.3 }}>Last 10 games</Typography>
                                <Stack direction="column" spacing={1}>
                                    {(quickView.lastFive ?? []).slice(0, 10).map((m, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: { xs: 26, sm: 32 },
                                                    height: { xs: 22, sm: 28 },
                                                    borderRadius: 1,
                                                    backgroundColor: resultColor(m.result),
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: { xs: '0.65rem', sm: '0.8rem' },
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {m.result}
                                            </Box>
                                            {idx === 0 && (
                                                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                                                    Latest
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                    {(quickView.lastFive ?? []).length === 0 && (
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                            No recent matches.
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}