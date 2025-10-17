'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Divider,
    CircularProgress,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Alert,
    SxProps,
    Theme,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Add, Remove } from '@mui/icons-material';
import toast from 'react-hot-toast';
import Goals from '@/Components/images/goal.png'
import Imapct from '@/Components/images/imapct.png'
import Assist from '@/Components/images/Assist.png'
// import Defence from '@/Components/images/defence.png'
import CleanSheet from '@/Components/images/cleansheet.png'
// import FreeKick from '@/Components/images/freekick.png'
// import penalty from '@/Components/images/penalty.png'
import Link from 'next/link';
import { cacheManager } from "@/lib/cacheManager"
import { LeaderboardPlayer } from '@/types/api';
import Check from '@/Components/images/check.png'
import Coin from '@/Components/images/icon.png'
import Shirt from '@/Components/images/shirtimg.png'
import Image from 'next/image'

type MatchApiResponse = {
    success?: boolean;
    match?: Partial<MatchWithGuests> | null;
    message?: string;
};
type LeagueApiResponse = {
    success?: boolean;
    league?: League;
    message?: string;
};

// Helper to always return safe arrays on the match object
const normalizeMatch = (m: Partial<MatchWithGuests> | null | undefined): MatchWithGuests => {
    const safe = (m ?? {}) as MatchWithGuests;
    return {
        ...safe,
        homeTeamUsers: Array.isArray(safe.homeTeamUsers) ? safe.homeTeamUsers : [],
        awayTeamUsers: Array.isArray(safe.awayTeamUsers) ? safe.awayTeamUsers : [],
        guests: Array.isArray(safe.guests) ? safe.guests : [],
    };
};

interface User {
    id: string;
    firstName: string;
    lastName: string;
    shirtNumber?: string;
    level?: string;
    skills?: {
        dribbling?: number;
        shooting?: number;
        passing?: number;
        pace?: number;
        defending?: number;
        physical?: number;
    };
    preferredFoot?: string;
    profilePicture?: string;
    statistics?: {
        goals?: number;
        assists?: number;
        impact?: number;
    }[];
    positionType?: string; // Added for new player card
}

interface Match {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    date: string;
    location: string;
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    notes?: string;
    manOfTheMatchVotes?: Record<string, string>;
    status: string;
    start?: string;
    homeCaptainId?: string;
    awayCaptainId?: string;
    // Optional fields that may come from API to help recover league
    leagueId?: string;
    leagueName?: string;
}

// Guest player representation coming from backend (via /leagues/:leagueId/matches/:matchId)
interface GuestPlayer {
    id: string; // guest record id (not necessarily a real user id)
    team: 'home' | 'away';
    firstName: string;
    lastName: string;
    shirtNumber?: string;
}

// Extend Match type locally to optionally include guests array
interface MatchWithGuests extends Match {
    guests?: GuestPlayer[];
}

interface League {
    id: string;
    name: string;
    administrators: User[];
    active: boolean;
}

interface MotmButtonProps {
    voted: boolean;
    onClick: () => void;
    disabled: boolean;
    color: string;
    sx?: SxProps<Theme>;
}

const MotmCoin = ({ voted, onClick, disabled, sx = {} }: MotmButtonProps) => (
    <Box
        onClick={disabled ? undefined : onClick}
        sx={{
            position: 'relative',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
                transform: disabled ? 'none' : 'scale(1.1)',
                filter: disabled ? 'none' : 'brightness(1.2)'
            },
            ...sx
        }}
    >
        {/* Coin Image */}
        <img
            src={Coin.src}
            alt="MOTM Vote"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: disabled ? 0.5 : 1
            }}
        />

        {/* Check Mark Overlay - Only show if voted */}
        {voted && (
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2
                }}
            >
                <img
                    src={Check.src}
                    alt="Voted"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </Box>
        )}
    </Box>
);

// Jersey avatar (shirt image with centered number)
const JerseyAvatar = ({
    number,
    sx = {},
}: {
    number?: string | number;
    sx?: SxProps<Theme>;
}) => (
    <Box
        sx={{
            position: 'relative',
            width: 60,
            height: 60,
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...sx,
        }}
    >
        <Image
            src={Shirt}
            alt="Shirt"
            fill
            sizes="(max-width: 600px) 48px, 60px"
            quality={100}
            style={{ objectFit: 'contain' }}
            priority
        />
        <Typography
            component="span"
            sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
                fontWeight: 800,
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                fontSize: { xs: 10, sm: 12, md: 18 },
                lineHeight: 1,
            }}
        >
            {number ?? '0'}
        </Typography>
    </Box>
);

type EditWindow = {
  resultsUploaded: boolean;
  isWithinLastTwo: boolean;
  isOlderThanTwo: boolean;
  canPlayerSubmit: boolean;
  adminCanSubmit: boolean;
  isAdmin: boolean;
  indexFromEnd: number | null; // 0=current, 1=previous, >1 older
};

// --- NEW: captain picks types ---
type CaptainPickCategory = 'defence' | 'influence';
type CaptainPicks = { defence?: string; influence?: string };
// --- end new types ---,

// const getTotalMatchGoals = (match?: MatchWithGuests | null) =>
//   (match?.homeTeamGoals ?? 0) + (match?.awayTeamGoals ?? 0);

// type StatsForm = {
//   goals?: number;
//   assists?: number;
//   cleanSheets?: number;
//   penalties?: number;
//   freeKicks?: number;
//   defence?: number;
//   impact?: number;
// };

// function validateStatsCapsClient(stats: StatsForm, totalGoals: number): string | null {
//   const caps: Array<keyof StatsForm> = ['goals', 'assists', 'cleanSheets'];
//   for (const key of caps) {
//     const v = Number.isFinite(Number(stats[key])) ? Math.trunc(Number(stats[key])) : 0;
//     if (v < 0) return `“${key}” cannot be negative.`;
//     if (v > totalGoals) return `A player's ${key} cannot exceed total match goals (${totalGoals}).`;
//   }
//   return null;
// }
// --- end helpers ---

export default function PlayMatchPage() {
    const [league, setLeague] = useState<League | null>(null);
    const [match, setMatch] = useState<MatchWithGuests | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [homeGoals, setHomeGoals] = useState<number>(0);
    const [awayGoals, setAwayGoals] = useState<number>(0);
    const [note, setNote] = useState<string>('');
    const [votedForId, setVotedForId] = useState<string | null>(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isSubmittingStats, setIsSubmittingStats] = useState(false);
    const [isAdminStatsModalOpen, setIsAdminStatsModalOpen] = useState(false);
    const [selectedPlayerForAdmin, setSelectedPlayerForAdmin] = useState<User | null>(null);
    const [adminStats, setAdminStats] = useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });
    const [isSubmittingAdminStats, setIsSubmittingAdminStats] = useState(false);
    const [stats, setStats] = useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });
    const [playerVotes, setPlayerVotes] = useState<Record<string, number>>({});
    const [loadingVote, setLoadingVote] = useState(false);

    // NEW: local saving flag (do not blank the page)
    const [savingMatchDetails, setSavingMatchDetails] = useState(false);
    const [editWindow, setEditWindow] = useState<EditWindow | null>(null);

    // --- NEW: Captain Picks state ---
    const [captainPicks, setCaptainPicks] = useState<CaptainPicks>({});
    const [isPickDialogOpen, setIsPickDialogOpen] = useState(false);
    const [pickCategory, setPickCategory] = useState<CaptainPickCategory | null>(null);
    const [savingPick, setSavingPick] = useState(false);
    // Capability flag – avoid POST if API is not available
    const [captainApiAvailable, setCaptainApiAvailable] = useState(false);
    // --- end captain picks state ---

    const { user, token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const matchId = params?.matchId ? String(params.matchId) : '';

    // CHANGED: add "silent" flag to avoid flipping global loading during save
    const fetchLeagueAndMatchDetails = useCallback(async (silent: boolean = false) => {
        try {
            if (!silent) setLoading(true);
            // 1) Try to get the match (first with league-bound endpoint, then fallback to /matches/:id)
            let matchData: MatchApiResponse | null = null;
            let matchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (matchResp.status === 404) {
                matchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            try {
                matchData = await matchResp.json();
            } catch {
                matchData = null;
            }
            if (!matchResp.ok || !matchData?.success || !matchData.match) {
                throw new Error(matchData?.message || 'Failed to fetch match details');
            }
            const m = normalizeMatch(matchData.match);
            setMatch(m);
            setHomeGoals(typeof m.homeTeamGoals === 'number' ? m.homeTeamGoals : 0);
            setAwayGoals(typeof m.awayTeamGoals === 'number' ? m.awayTeamGoals : 0);

            // 2) Fetch league using a reliable id (prefer id from match if present)
            const effectiveLeagueId = m.leagueId || leagueId;
            const leagueResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${effectiveLeagueId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let leagueData: LeagueApiResponse | null = null;
            try {
                leagueData = await leagueResp.json();
            } catch {
                leagueData = null;
            }
            if (leagueResp.ok && leagueData?.success && leagueData.league) {
                setLeague(leagueData.league);
            } else {
                console.warn('League not found, using fallback league object');
                setLeague({
                    id: effectiveLeagueId || 'unknown',
                    name: m.leagueName || 'League',
                    administrators: [],
                    active: true,
                });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [leagueId, matchId, token]);

    useEffect(() => {
        if (leagueId && matchId && token) {
            fetchLeagueAndMatchDetails();
        }
    }, [leagueId, matchId, token, fetchLeagueAndMatchDetails]);

    // CHANGED: do not toggle global loading; refetch silently and show local spinner on button
    const handleSaveDetails = async () => {
        if (!token || !matchId) return;
        try {
            setSavingMatchDetails(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/upload-result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ homeTeamGoals: homeGoals, awayTeamGoals: awayGoals, note }),
            });
            if (!res.ok) throw new Error('Failed to upload result');
            // Ensure state stays full by refetching without blanking the page
            await fetchLeagueAndMatchDetails(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSavingMatchDetails(false);
        }
    };

    // Fetch votes and set votedForId ONLY from backend
    const fetchVotes = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, use default values
                setPlayerVotes({});
                setVotedForId(null);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setPlayerVotes(data.votes || {});
                setVotedForId(data.userVote || null); // <-- Always set from backend only!
            }
        } catch (error) {
            console.error('Failed to fetch votes:', error);
            // Use default values on error
            setPlayerVotes({});
            setVotedForId(null);
        }
    }, [matchId, token]);

    useEffect(() => {
        if (matchId && token) fetchVotes();
    }, [matchId, token, fetchVotes]);

    // Hooks for computed Impact must be unconditionally called (before any early returns)
    // Compute safe team goals context for the current user
    const playerOnHomeTeamSafe = !!(match && user && (match.homeTeamUsers ?? []).some(p => p.id === user.id));
    const playerOnAwayTeamSafe = !!(match && user && (match.awayTeamUsers ?? []).some(p => p.id === user.id));
    const isUserAssignedToTeam = playerOnHomeTeamSafe || playerOnAwayTeamSafe;
    const teamGoalsSafe = (match && user)
        ? (playerOnHomeTeamSafe ? (match.homeTeamGoals || 0) : (playerOnAwayTeamSafe ? (match.awayTeamGoals || 0) : 0))
        : 0;

    // Compute Impact % based on weighted normalized metrics (image spec). Always defined.
    const computeImpactPercent = useCallback(
        (s: { goals: number; assists: number; cleanSheets: number; defence: number }, tGoals: number) => {
            const safeMax = (n: number) => Math.max(1, n || 0);
            const metrics = [
                { value: s.goals,       max: safeMax(tGoals), weight: 0.3 },
                { value: s.assists,     max: safeMax(tGoals), weight: 0.2 },
                { value: s.cleanSheets, max: 1,               weight: 0.1 },
                { value: s.defence,     max: 1,               weight: 0.2 },
                // MOTM votes weight (0.2) intentionally omitted
            ];
            const active = metrics.filter(m => m.max > 0);
            const sumW = active.reduce((a, b) => a + b.weight, 0) || 1;
            const score01 = active.reduce((acc, m) => acc + (Math.min(m.value, m.max) / m.max) * (m.weight / sumW), 0);
            const percent = Math.max(0.10, Math.min(1, score01)) * 100; // clamp to [10%, 100%]
            return Math.round(percent);
        },
        []
    );

    const computedImpact = useMemo(
        () => computeImpactPercent(
            { goals: stats.goals, assists: stats.assists, cleanSheets: stats.cleanSheets, defence: stats.defence },
            teamGoalsSafe
        ),
        [stats.goals, stats.assists, stats.cleanSheets, stats.defence, teamGoalsSafe, computeImpactPercent]
    );

    // For admin modal: compute impact for selected player using that player's team goals
    const adminSelectedTeamGoals = useMemo(() => {
        if (!match || !selectedPlayerForAdmin) return teamGoalsSafe;
        const isHome = (match.homeTeamUsers ?? []).some(p => p.id === selectedPlayerForAdmin.id);
        const isAway = (match.awayTeamUsers ?? []).some(p => p.id === selectedPlayerForAdmin.id);
        if (isHome) return match.homeTeamGoals || 0;
        if (isAway) return match.awayTeamGoals || 0;
        return teamGoalsSafe;
    }, [selectedPlayerForAdmin, match, teamGoalsSafe]);

    const computedAdminImpact = useMemo(
        () => computeImpactPercent(
            { goals: adminStats.goals, assists: adminStats.assists, cleanSheets: adminStats.cleanSheets, defence: adminStats.defence },
            adminSelectedTeamGoals
        ),
        [adminStats.goals, adminStats.assists, adminStats.cleanSheets, adminStats.defence, adminSelectedTeamGoals, computeImpactPercent]
    );

    // Prevent self-vote in UI too
        const handleVote = async (playerId: string) => {
                if (!user) return;
                if (!isUserAssignedToTeam) {
                    toast.error('You must be assigned to a team to vote for Man of the Match.');
                    return;
                }
        if (playerId === user.id) {
          toast.error('You cannot vote for yourself as Man of the Match.');
          return;
        }
        setLoadingVote(true);
        try {
            // If user already voted for this player, unvote them
            const voteData = votedForId === playerId ? { votedForId: null } : { votedForId: playerId };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(voteData),
            });

            const data = await response.json();
            if (data.success) {
                // Update leaderboard cache for MOTM votes
                if (data.updatedStats) {
                    Object.entries(data.updatedStats).forEach(([metric, value]) => {
                        if (typeof value === 'number') {
                            cacheManager.updateLeaderboardCache(playerId, value, metric as keyof LeaderboardPlayer, `leaderboard_motm_${matchId}`);
                        }
                    });
                }
            }
        } catch {
            setError('An error occurred while voting.');
        } finally {
            await fetchVotes();
            setLoadingVote(false);
        }
    };

    // const handleOpenStatsModal = async () => {
    //     if (!user) return;

    //     try {
    //         // Fetch existing stats for the current user
    //         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?playerId=${user.id}`, {
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });

    //         // Check if endpoint exists (not 404 or 405)
    //         if (response.status === 404 || response.status === 405) {
    //             // Endpoint doesn't exist, use default stats
    //             setStats({
    //                 goals: 0,
    //                 assists: 0,
    //                 cleanSheets: 0,
    //                 penalties: 0,
    //                 freeKicks: 0,
    //                 defence: 0,
    //                 impact: 0
    //             });
    //             setIsStatsModalOpen(true);
    //             return;
    //         }

    //         const data = await response.json();

    //         if (data.success && data.stats) {
    //             // Use existing stats if available
    //             setStats({
    //                 goals: data.stats.goals || 0,
    //                 assists: data.stats.assists || 0,
    //                 cleanSheets: data.stats.cleanSheets || 0,
    //                 penalties: data.stats.penalties || 0,
    //                 freeKicks: data.stats.freeKicks || 0,
    //                 defence: data.stats.defence || 0,
    //                 impact: data.stats.impact || 0,
    //             });
    //         } else {
    //             // Reset to 0 if no existing stats
    //             setStats({
    //                 goals: 0,
    //                 assists: 0,
    //                 cleanSheets: 0,
    //                 penalties: 0,
    //                 freeKicks: 0,
    //                 defence: 0,
    //                 impact: 0
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Failed to fetch existing stats:', error);
    //         // Reset to 0 on error
    //         setStats({
    //             goals: 0,
    //             assists: 0,
    //             cleanSheets: 0,
    //             penalties: 0,
    //             freeKicks: 0,
    //             defence: 0,
    //             impact: 0
    //         });
    //     }

    //     setIsStatsModalOpen(true);
    // };

    const handleCloseStatsModal = () => setIsStatsModalOpen(false);

    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = prev[stat] + increment;
            if (newValue < 0 || newValue > max) return prev;
            return { ...prev, [stat]: newValue };
        });
    };

    const handleSaveStats = async () => {
        if (!isUserAssignedToTeam) {
            toast.error('You must be assigned to a team to save your stats.');
            return;
        }
        setIsSubmittingStats(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goals: stats.goals,
                    assists: stats.assists,
                    cleanSheets: stats.cleanSheets,
                    penalties: stats.penalties,
                    freeKicks: stats.freeKicks,
                    defence: stats.defence,
                    impact: computedImpact,
                }),
            });

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, show error message
                toast.error('Stats saving is not available yet. Please contact the administrator.');
                setIsStatsModalOpen(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                // Update leaderboard cache with new stats
                if (data.updatedStats) {
                    Object.entries(data.updatedStats).forEach(([metric, value]) => {
                        if (typeof value === 'number') {
                            cacheManager.updateLeaderboardCache(data.playerId, value, metric as keyof LeaderboardPlayer);
                        }
                    });
                }
                setIsStatsModalOpen(false);
                // Optionally show a success message
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingStats(false);
        }
    };

    // Admin Stats Functions
    const handleOpenAdminStatsModal = async (player: User) => {
        setSelectedPlayerForAdmin(player);

        try {
            // Fetch existing stats for the selected player
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?playerId=${player.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, use default stats
                setAdminStats({
                    goals: 0,
                    assists: 0,
                    cleanSheets: 0,
                    penalties: 0,
                    freeKicks: 0,
                    defence: 0,
                    impact: 0,
                });
                setIsAdminStatsModalOpen(true);
                return;
            }

            const data = await response.json();

            if (data.success && data.stats) {
                // Use existing stats if available
                setAdminStats({
                    goals: data.stats.goals || 0,
                    assists: data.stats.assists || 0,
                    cleanSheets: data.stats.cleanSheets || 0,
                    penalties: data.stats.penalties || 0,
                    freeKicks: data.stats.freeKicks || 0,
                    defence: data.stats.defence || 0,
                    impact: data.stats.impact || 0,
                });
            } else {
                // Reset to 0 if no existing stats
                setAdminStats({
                    goals: 0,
                    assists: 0,
                    cleanSheets: 0,
                    penalties: 0,
                    freeKicks: 0,
                    defence: 0,
                    impact: 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch existing stats for player:', error);
            // Reset to 0 on error
            setAdminStats({
                goals: 0,
                assists: 0,
                cleanSheets: 0,
                penalties: 0,
                freeKicks: 0,
                defence: 0,
                impact: 0,
            });
        }

        setIsAdminStatsModalOpen(true);
    };

    const handleCloseAdminStatsModal = () => {
        setIsAdminStatsModalOpen(false);
        setSelectedPlayerForAdmin(null);
    };

    const handleAdminStatChange = (stat: keyof typeof adminStats, increment: number, max: number) => {
        setAdminStats(prev => ({
            ...prev,
            [stat]: Math.max(0, Math.min(max, prev[stat] + increment))
        }));
    };


    const baseCanSubmit = match?.status === 'RESULT_UPLOADED' || match?.status === 'RESULT_PUBLISHED';
    const isAdmin = league?.administrators?.some(a => a.id === user?.id) ?? false;

    // NEW: captain role flags
const isHomeCaptain = !!(user && match && user.id === match.homeCaptainId);
const isAwayCaptain = !!(user && match && user.id === match.awayCaptainId);
const isCaptainUser = isHomeCaptain || isAwayCaptain;

 const myTeamPlayers: User[] = useMemo(() => {
        if (!match) return [];
        const team = isHomeCaptain ? match.homeTeamUsers : isAwayCaptain ? match.awayTeamUsers : [];
        // Only real users, no guests
        return (team ?? []) as User[];
    }, [match, isHomeCaptain, isAwayCaptain]);

     const playerNameById = useCallback((id?: string | null) => {
        if (!id) return '';
        const p = myTeamPlayers.find(u => u.id === id);
        return p ? `${p.firstName} ${p.lastName}` : '';
    }, [myTeamPlayers]);

    useEffect(() => {
        const loadPicks = async () => {
            if (!token || !matchId) return;

            // 1) Try local storage first so UI shows something even if API is missing
            const teamKey = isHomeCaptain ? 'home' : (isAwayCaptain ? 'away' : null);
            const storageKey = teamKey ? `captain_picks_${matchId}_${teamKey}` : null;
            if (storageKey && typeof window !== 'undefined') {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    try {
                        const ls = JSON.parse(raw) as CaptainPicks;
                        setCaptainPicks({
                            defence: ls.defence || undefined,
                            influence: ls.influence || undefined,
                        });
                    } catch {}
                }
            }

            // 2) Probe API; if 404/405, mark unavailable and stop
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/captain-picks`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 404 || res.status === 405) {
                    setCaptainApiAvailable(false);
                    return; // avoid further calls (prevents POST 404 spam)
                }

                if (!res.ok) return;

                setCaptainApiAvailable(true);
                const data = await res.json();
                // Expecting shape like { home: { defence, influence }, away: { defence, influence } }
                const teamKey = isHomeCaptain ? 'home' : (isAwayCaptain ? 'away' : null);
                const picks = teamKey ? data?.[teamKey] : data?.picks;
                if (picks && typeof picks === 'object') {
                    setCaptainPicks({
                        defence: picks.defence || undefined,
                        influence: picks.influence || undefined,
                    });
                }
            } catch {
                // keep local-only mode
                setCaptainApiAvailable(false);
            }
        };
        loadPicks();
    }, [token, matchId, isHomeCaptain, isAwayCaptain]);

     // --- NEW: open pick dialog handler ---
    const openPickDialog = (category: CaptainPickCategory) => {
        if (!isCaptainUser) {
            toast.error('Only the team captain can make this selection.');
            return;
        }
        if (!league?.active) {
            toast.error('League is inactive.');
            return;
        }
        if (!baseCanSubmit) {
            toast.error('Available after result upload.');
            return;
        }
        setPickCategory(category);
        setIsPickDialogOpen(true);
    };

    // --- NEW: save selected player for a category ---
    const handleSelectPick = async (playerId: string) => {
        if (!pickCategory) return;

        // Local update + localStorage persist
        const applyLocal = () => {
            setCaptainPicks(prev => ({ ...prev, [pickCategory]: playerId }));
            const teamKey = isHomeCaptain ? 'home' : (isAwayCaptain ? 'away' : null);
            if (teamKey && typeof window !== 'undefined') {
                const key = `captain_picks_${matchId}_${teamKey}`;
                const next = { ...captainPicks, [pickCategory]: playerId };
                localStorage.setItem(key, JSON.stringify(next));
            }
        };

        // If API not available, avoid POST 404 entirely
        if (!captainApiAvailable) {
            applyLocal();
            toast.success('Saved locally (captain picks API not enabled).');
            setIsPickDialogOpen(false);
            setPickCategory(null);
            return;
        }

        setSavingPick(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/captain-picks`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category: pickCategory, playerId })
            });

            if (!res.ok) throw new Error('Failed to save pick');

            applyLocal();
            toast.success('Captain pick saved.');
        }  catch (err: unknown) {
            const message =
                err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                'Failed to save pick';
            toast.error(message);
        } finally {
            setSavingPick(false);
            setIsPickDialogOpen(false);
            setPickCategory(null);
        }
    };

    const canPlayerSubmitStats = baseCanSubmit && (editWindow?.canPlayerSubmit ?? false);
    const canAdminSubmitStats = baseCanSubmit && (editWindow?.adminCanSubmit ?? false);

    // Fetch edit window details
    const fetchEditWindow = useCallback(async () => {
        if (!token || !matchId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats-window`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch stats window');
            const data = await res.json();
            if (data.success) setEditWindow(data.window as EditWindow);
        } catch (err: unknown) {
            console.error('fetchEditWindow failed', err);
            setEditWindow(null);
        }
    }, [matchId, token]);

    useEffect(() => {
        if (matchId && token) fetchEditWindow();
    }, [matchId, token, fetchEditWindow]);


    const handleSaveAdminStats = async () => {
        if (!selectedPlayerForAdmin) return;

        setIsSubmittingAdminStats(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: selectedPlayerForAdmin.id,
                    ...adminStats,
                    // Override impact with computed admin impact
                    impact: computedAdminImpact,
                }),
            });

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, show error message
                toast.error('Stats saving is not available yet. Please contact the administrator.');
                handleCloseAdminStatsModal();
                return;
            }

            const data = await response.json();

            if (data.success) {
                toast.success(`Stats added for ${selectedPlayerForAdmin.firstName} ${selectedPlayerForAdmin.lastName}`);
                handleCloseAdminStatsModal();
                fetchLeagueAndMatchDetails();
            } else {
                toast.error(data.message || 'Failed to add stats');
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingAdminStats(false);
        }
    };

    const canSubmitStats = match?.status === 'RESULT_UPLOADED' || match?.status === 'RESULT_PUBLISHED';

    // Replace old openStats with window-aware version
    const openStats = () => {
        if (!isUserAssignedToTeam) {
            toast.error('You must be assigned to a team to add your stats.');
            return;
        }
        if (!baseCanSubmit) {
            toast.error('Stats are available after result upload.');
            return;
        }

        // Admins can always edit (per rule)
        if (isAdmin && canAdminSubmitStats) {
            setIsStatsModalOpen(true);
            return;
        }

        // Player path
        if (!editWindow?.canPlayerSubmit) {
            toast.error("It's not possible to add stats for earlier games. Please ask the admin to make changes to older games.");
            return;
        }

        // Previous match info toast
        if (editWindow.indexFromEnd === 1) {
            toast('You are adding stats for the previous match.', { icon: 'ℹ️' });
        }

        setIsStatsModalOpen(true);
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    }

    if (error || !league || !match) {
        return (
            <Box sx={{ p: 4, minHeight: '100vh', color: 'white' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white' }}>
                    Back to League
                </Button>
                <Typography color="error">{error || 'Could not load league or match data.'}</Typography>
            </Box>
        );
    }

    if (!user) return null;

    // const isAdmin = league.administrators?.some(admin => admin.id === user.id);

    // Transform guests into pseudo User objects for display purposes (no links/stats for guests)
    const guestUsersHome: (User & { isGuest: true })[] = (match.guests || [])
        .filter(g => g.team === 'home')
        .map(g => ({
            id: g.id, // keep id (used only as key) – not linking to player profile
            firstName: g.firstName,
            lastName: g.lastName,
            shirtNumber: g.shirtNumber,
            isGuest: true
        } as User & { isGuest: true }));

    const guestUsersAway: (User & { isGuest: true })[] = (match.guests || [])
        .filter(g => g.team === 'away')
        .map(g => ({
            id: g.id,
            firstName: g.firstName,
            lastName: g.lastName,
            shirtNumber: g.shirtNumber,
            isGuest: true
        } as User & { isGuest: true }));

    const homePlayersAll: (User & { isGuest?: boolean })[] = [ ...(match?.homeTeamUsers ?? []), ...guestUsersHome ];
    const awayPlayersAll: (User & { isGuest?: boolean })[] = [ ...(match?.awayTeamUsers ?? []), ...guestUsersAway ];
    // Debug log to verify state after refresh and voting
    console.log('votedForId:', votedForId, 'playerVotes:', playerVotes);

    return (
        <Box sx={{ p: { xs: 0.5, sm: 2, md: 4 }, minHeight: '100vh', color: 'black' }}>
            {!league.active && <Alert severity="warning" sx={{ mb: 1 }}>This league is currently inactive. All actions are disabled.</Alert>}
            {/* <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{
                color: 'white',
                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                fontWeight: 'bold',
                mb: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
            }}>Back to League</Button> */}

            <Paper sx={{ p: { xs: 0.5, sm: 2, md: 3 }, background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)', color: 'white', borderRadius: 3, boxShadow: 3 }}>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'row' }, gap: { xs: 0.5, sm: 1, md: 3 } }}>
                    {/* Home Team Section */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: { xs: 0.5, sm: 2 },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: { xs: 0.5, sm: 1 }
                        }}>
                            <Typography variant="h5" color="white" sx={{
                                fontWeight: 'bold',
                                fontSize: { xs: '0.875rem', sm: '1.25rem', md: '1.5rem' },
                                lineHeight: { xs: 1.2, sm: 1.5 }
                            }}>
                                {match.homeTeamName} ({typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0})
                            </Typography>

                            {/* Add Stats Button for Home Team */}
                               {user && canPlayerSubmitStats && league.active &&
                            // {user && canPlayerSubmitStats && league.active &&
                                (match.homeTeamUsers ?? []).some(player => player.id === user.id) && (
                                    <Button
                                        onClick={openStats}
                                        startIcon={<Add />}
                                        variant="contained"
                                        size="small"
                                        sx={{
                                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            borderRadius: 1.5,
                                            px: { xs: 0.5, sm: 1, md: 2 },
                                            py: { xs: 0.25, sm: 0.5, md: 1 },
                                            fontSize: { xs: 7, sm: 10, md: 12 },
                                            minWidth: { xs: 'auto', sm: 'auto' },
                                            height: { xs: 19, sm: 32, md: 36 },
                                            whiteSpace: 'nowrap',
                                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                            mr: { xs: 0.5, sm: 1, md: 1 }
                                        }}
                                    >
                                        Add Stats
                                    </Button>
                                )}
                        </Box>

                        <Card sx={{ background: 'linear-gradient(180deg, #1f1f1f 0%, #0e0e0e 100%)', borderRadius: 3, border: '2px solid #4b4b4b' }}>
                            <CardContent sx={{
                                p: { xs: 0.5, sm: 2 },
                                maxHeight: { xs: 250, sm: 400 },
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}>
                                {homePlayersAll.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        {homePlayersAll.map((player, index) => {
                                            return (
                                                <React.Fragment key={player.id}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        p: { xs: 0.5, sm: 1, md: 2 },
                                                        // -                                                        background: '#0a4822',
                                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                        borderRadius: 0,
                                                        // -                                                        border: '1px solid #43a047',
                                                        // -                                                        borderBottom: index === match.homeTeamUsers.length - 1 ? '1px solid #43a047' : 'none',
                                                        border: '1px solid #4b4b4b',
                                                        borderBottom: index === homePlayersAll.length - 1 ? '1px solid #4b4b4b' : 'none',
                                                        minHeight: { xs: 40, sm: 60, md: 100 },
                                                        position: 'relative',
                                                        '&:hover': {
                                                            // -                                                            backgroundColor: '#1f673b',
                                                            background: 'linear-gradient(90deg, #202020 0%, #2b2b2b 100%)',
                                                            transform: 'translateY(-1px)',
                                                            transition: 'all 0.2s ease'
                                                        }
                                                    }}>
                                                        {/* MOTM Coin - Top Right Corner */}
                                                        {baseCanSubmit && league.active && isUserAssignedToTeam && !player.hasOwnProperty('isGuest') && user.id !== player.id && (
                                                            <Box sx={{ position: 'absolute', top: { xs: 2, sm: 4, md: 8 }, right: { xs: 2, sm: 4, md: 8 }, zIndex: 3 }}>
                                                                <MotmCoin
                                                                    voted={votedForId === player.id}
                                                                    onClick={() => handleVote(player.id)}
                                                                    disabled={loadingVote || player.id === user?.id || !isUserAssignedToTeam}
                                                                    color="#43a047"
                                                                    sx={{ width: { xs: 20, sm: 35, md: 65 }, height: { xs: 20, sm: 35, md: 65 }, mr: { xs: 0.25, sm: 0.5, md: 1 }, mt: { xs: 0.25, sm: 0.5, md: 1 } }}
                                                                />
                                                            </Box>
                                                        )}

                                                        {player.hasOwnProperty('isGuest') ? (
                                                            <JerseyAvatar
                                                                number={player.shirtNumber || 'G'}
                                                                sx={{
                                                                    width: { xs: 25, sm: 35, md: 74 },
                                                                    height: { xs: 25, sm: 35, md: 74 },
                                                                    mr: { xs: 0.5, sm: 1, md: 2 },
                                                                    flexShrink: 0,
                                                                    opacity: 0.9
                                                                }}
                                                            />
                                                        ) : (
                                                            <Link href={`/player/${player.id}`}>
                                                                <JerseyAvatar
                                                                    number={player.shirtNumber || '0'}
                                                                    sx={{
                                                                        width: { xs: 25, sm: 35, md: 74 },
                                                                        height: { xs: 25, sm: 35, md: 74 },
                                                                        mr: { xs: 0.5, sm: 1, md: 2 },
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            </Link>
                                                        )}

                                                        {/* Player Info */}
                                                        <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                                            {player.hasOwnProperty('isGuest') ? (
                                                                <>
                                                                    <Typography variant="h6" sx={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        fontSize: { xs: 8, sm: 10, md: 16 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 0.5 },
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        lineHeight: { xs: 1.1, sm: 1.2, md: 1.4 }
                                                                    }}>
                                                                        {player.firstName} {player.lastName} <Typography component="span" sx={{ fontSize: '0.6em', ml: 0.5, fontWeight: 'normal', color: '#FFD54F' }}>[Guest]</Typography>
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{
                                                                        color: '#D1D5DB',
                                                                        fontSize: { xs: 6, sm: 8, md: 14 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 1 },
                                                                        lineHeight: { xs: 1.0, sm: 1.1, md: 1.3 }
                                                                    }}>
                                                                        Guest Player
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <Link href={`/player/${player.id}`}>
                                                                    <Typography variant="h6" sx={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        fontSize: { xs: 8, sm: 10, md: 16 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 0.5 },
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        lineHeight: { xs: 1.1, sm: 1.2, md: 1.4 }
                                                                    }}>
                                                                        {player.firstName} {player.lastName}
                                                                        {player.id === match.homeCaptainId ? ' (C)' : ''}
                                                                    </Typography>

                                                                    <Typography variant="body2" sx={{
                                                                        color: '#D1D5DB',
                                                                        fontSize: { xs: 6, sm: 8, md: 14 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 1 },
                                                                        lineHeight: { xs: 1.0, sm: 1.1, md: 1.3 }
                                                                    }}>
                                                                        {player.positionType || 'Player'}
                                                                    </Typography>
                                                                </Link>
                                                            )}
                                                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: { xs: 0.5, sm: 1, md: 1 }, alignItems: 'center' }}>
                                                                {/* <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    sx={{
                                                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                                        color: 'white',
                                                                        borderRadius: 1.5,
                                                                        px: { xs: 0.25, sm: 0.5, md: 2 },
                                                                        py: { xs: 0.125, sm: 0.25, md: 0.5 },
                                                                        fontSize: { xs: 6, sm: 8, md: 12 },
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'none',
                                                                        height: { xs: 15, sm: 20, md: 28 },
                                                                        minWidth: { xs: 'auto', sm: 'auto' },
                                                                        '&:hover': {
                                                                            background: 'linear-gradient(90deg, #000000 0%, #767676 100%)'
                                                                        },
                                                                        mt: { xs: 0.25, sm: 0.5, md: 0.5 }
                                                                    }}
                                                                >
                                                                    Shirt No {player.shirtNumber || "0"}
                                                                </Button> */}

                                                                {/* Admin Stats Button */}
                                                                {isAdmin && match.status === 'RESULT_PUBLISHED' && league.active && !player.hasOwnProperty('isGuest') && (
                                                                    <Button
                                                                        onClick={() => handleOpenAdminStatsModal(player)}
                                                                        startIcon={<Add />}
                                                                        variant="contained"
                                                                        size="small"
                                                                        sx={{
                                                                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                                            color: 'white',
                                                                            fontWeight: 'bold',
                                                                            borderRadius: 1.5,
                                                                            px: { xs: 0.25, sm: 0.5, md: 1.5 },
                                                                            py: { xs: 0.125, sm: 0.25, md: 0.5 },
                                                                            fontSize: { xs: 5, sm: 7, md: 10 },
                                                                            minWidth: { xs: 'auto', sm: 'auto' },
                                                                            height: { xs: 16, sm: 20, md: 28 },
                                                                            whiteSpace: 'nowrap',
                                                                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                                                            mt: { xs: 0.25, sm: 0.5, md: 0.5 }
                                                                        }}
                                                                    >
                                                                        Admin Stats
                                                                    </Button>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    {index < homePlayersAll.length - 1 && (
                                                        <Divider sx={{ borderColor: '#4b4b4b', borderWidth: 1 }} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Typography color="white" sx={{ textAlign: 'center', fontStyle: 'italic', fontSize: { xs: 10, sm: 14 } }}>
                                        No players assigned
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Away Team Section */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: { xs: 0.5, sm: 2 },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: { xs: 0.5, sm: 1 }
                        }}>
                            <Typography variant="h5" color="white" sx={{
                                fontWeight: 'bold',
                                fontSize: { xs: '0.875rem', sm: '1.25rem', md: '1.5rem' },
                                lineHeight: { xs: 1.2, sm: 1.5 }
                            }}>
                                {match.awayTeamName} ({typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0})
                            </Typography>

                            {/* Add Stats Button for Away Team */}
                            {/* {user && canPlayerSubmitStats && league.active && */}
                            {user && canSubmitStats && league.active &&
                                (match.awayTeamUsers ?? []).some(player => player.id === user.id) && (
                                    <Button
                                        onClick={openStats}
                                        startIcon={<Add />}
                                        variant="contained"
                                        size="small"
                                        sx={{
                                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            borderRadius: 1.5,
                                            px: { xs: 0.5, sm: 1, md: 2 },
                                            py: { xs: 0.25, sm: 0.5, md: 1 },
                                            fontSize: { xs: 7, sm: 10, md: 12 },
                                            minWidth: { xs: 'auto', sm: 'auto' },
                                            height: { xs: 19, sm: 32, md: 36 },
                                            whiteSpace: 'nowrap',
                                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                            mr: { xs: 0.5, sm: 1, md: 1 }
                                        }}
                                    >
                                        Add Stats
                                    </Button>
                                )}
                        </Box>

                        <Card sx={{ background: 'linear-gradient(180deg, #1f1f1f 0%, #0e0e0e 100%)', borderRadius: 3, border: '2px solid #4b4b4b' }}>
                            <CardContent sx={{
                                p: { xs: 0.5, sm: 2 },
                                maxHeight: { xs: 250, sm: 400 },
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}>
                                {awayPlayersAll.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        {awayPlayersAll.map((player, index) => {
                                            return (
                                                <React.Fragment key={player.id}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        p: { xs: 0.5, sm: 1, md: 2 },
                                                        // -                                                        background: '#0a4822',
                                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                        borderRadius: 0,
                                                        // -                                                        border: '1px solid #43a047',
                                                        // -                                                        borderBottom: index === match.awayTeamUsers.length - 1 ? '1px solid #43a047' : 'none',
                                                        border: '1px solid #4b4b4b',
                                                        borderBottom: index === awayPlayersAll.length - 1 ? '1px solid #4b4b4b' : 'none',
                                                        minHeight: { xs: 40, sm: 60, md: 100 },
                                                        position: 'relative',
                                                        '&:hover': {
                                                            // -                                                            backgroundColor: '#1f673b',
                                                            background: 'linear-gradient(90deg, #202020 0%, #2b2b2b 100%)',
                                                            transform: 'translateY(-1px)',
                                                            transition: 'all 0.2s ease'
                                                        }
                                                    }}>
                                                        {/* MOTM Coin - Top Right Corner */}
                                                        {baseCanSubmit && league.active && isUserAssignedToTeam && !player.hasOwnProperty('isGuest') && user.id !== player.id && (
                                                            <Box sx={{ position: 'absolute', top: { xs: 2, sm: 4, md: 8 }, right: { xs: 2, sm: 4, md: 8 }, zIndex: 3 }}>
                                                                <MotmCoin
                                                                    voted={votedForId === player.id}
                                                                    onClick={() => handleVote(player.id)}
                                                                    disabled={loadingVote || player.id === user?.id || !isUserAssignedToTeam}
                                                                    color="#43a047"
                                                                    sx={{ width: { xs: 20, sm: 35, md: 65 }, height: { xs: 20, sm: 35, md: 65 }, mr: { xs: 0.25, sm: 0.5, md: 1 }, mt: { xs: 0.25, sm: 0.5, md: 1 } }}
                                                                />
                                                            </Box>
                                                        )}

                                                        {player.hasOwnProperty('isGuest') ? (
                                                            <JerseyAvatar
                                                                number={player.shirtNumber || 'G'}
                                                                sx={{
                                                                    width: { xs: 25, sm: 35, md: 74 },
                                                                    height: { xs: 25, sm: 35, md: 74 },
                                                                    mr: { xs: 0.5, sm: 1, md: 2 },
                                                                    flexShrink: 0,
                                                                    opacity: 0.9
                                                                }}
                                                            />
                                                        ) : (
                                                            <Link href={`/player/${player.id}`}>
                                                                <JerseyAvatar
                                                                    number={player.shirtNumber || '0'}
                                                                    sx={{
                                                                        width: { xs: 25, sm: 35, md: 74 },
                                                                        height: { xs: 25, sm: 35, md: 74 },
                                                                        mr: { xs: 0.5, sm: 1, md: 2 },
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            </Link>
                                                        )}
                                                        {/* Player Info */}
                                                        <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                                            {player.hasOwnProperty('isGuest') ? (
                                                                <>
                                                                    <Typography variant="h6" sx={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        fontSize: { xs: 8, sm: 10, md: 16 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 0.5 },
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        lineHeight: { xs: 1.1, sm: 1.2, md: 1.4 }
                                                                    }}>
                                                                        {player.firstName} {player.lastName} <Typography component="span" sx={{ fontSize: '0.6em', ml: 0.5, fontWeight: 'normal', color: '#FFD54F' }}>[Guest]</Typography>
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{
                                                                        color: '#D1D5DB',
                                                                        fontSize: { xs: 6, sm: 8, md: 14 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 1 },
                                                                        lineHeight: { xs: 1.0, sm: 1.1, md: 1.3 }
                                                                    }}>
                                                                        Guest Player
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <Link href={`/player/${player.id}`}>

                                                                    <Typography variant="h6" sx={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        fontSize: { xs: 8, sm: 10, md: 16 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 0.5 },
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        lineHeight: { xs: 1.1, sm: 1.2, md: 1.4 }
                                                                    }}>
                                                                        {player.firstName} {player.lastName}
                                                                        {player.id === match.awayCaptainId ? ' (C)' : ''}
                                                                    </Typography>

                                                                    <Typography variant="body2" sx={{
                                                                        color: '#D1D5DB',
                                                                        fontSize: { xs: 6, sm: 8, md: 14 },
                                                                        mb: { xs: 0.25, sm: 0.5, md: 1 },
                                                                        lineHeight: { xs: 1.0, sm: 1.1, md: 1.3 }
                                                                    }}>
                                                                        {player.positionType || 'Player'}
                                                                    </Typography>
                                                                </Link>
                                                            )}
                                                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: { xs: 0.5, sm: 1, md: 1 }, alignItems: 'center' }}>
                                                                {/* <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    sx={{
                                                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                                        color: 'white',
                                                                        borderRadius: 1.5,
                                                                        px: { xs: 0.25, sm: 0.5, md: 2 },
                                                                        py: { xs: 0.125, sm: 0.25, md: 0.5 },
                                                                        fontSize: { xs: 6, sm: 8, md: 12 },
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'none',
                                                                        height: { xs: 15, sm: 20, md: 28 },
                                                                        minWidth: { xs: 'auto', sm: 'auto' },
                                                                        '&:hover': {
                                                                            background: 'linear-gradient(90deg, #000000 0%, #767676 100%)'
                                                                        },
                                                                        mt: { xs: 0.25, sm: 0.5, md: 0.5 }
                                                                    }}
                                                                >
                                                                    Shirt No {player.shirtNumber || "0"}
                                                                </Button> */}

                                                                {/* Admin Stats Button */}
                                                                {isAdmin && match.status === 'RESULT_PUBLISHED' && league.active && !player.hasOwnProperty('isGuest') && (
                                                                    <Button
                                                                        onClick={() => handleOpenAdminStatsModal(player)}
                                                                        startIcon={<Add />}
                                                                        variant="contained"
                                                                        size="small"
                                                                        sx={{
                                                                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                                            color: 'white',
                                                                            fontWeight: 'bold',
                                                                            borderRadius: 1.5,
                                                                            px: { xs: 0.25, sm: 0.5, md: 1.5 },
                                                                            py: { xs: 0.125, sm: 0.25, md: 0.5 },
                                                                            fontSize: { xs: 5, sm: 7, md: 10 },
                                                                            minWidth: { xs: 'auto', sm: 'auto' },
                                                                            height: { xs: 16, sm: 20, md: 28 },
                                                                            whiteSpace: 'nowrap',
                                                                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                                                            mt: { xs: 0.25, sm: 0.5, md: 0.5 }
                                                                        }}
                                                                    >
                                                                        Admin Stats
                                                                    </Button>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    {index < awayPlayersAll.length - 1 && (
                                                        <Divider sx={{ borderColor: '#4b4b4b', borderWidth: 1 }} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Typography color="white" sx={{ textAlign: 'center', fontStyle: 'italic', fontSize: { xs: 10, sm: 14 } }}>
                                        No players assigned
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Paper>

            <Paper
                sx={{
                    p: { xs: 1, sm: 2 },
                    my: 2,
                    background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                    borderLeft: '4px solid #4b4b4b',
                    maxWidth: '100%',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                }}
            >
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', mb: 1, fontSize: 20 }}>
                    Match Note :
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {match.notes}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                        Start Time:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff' }}>
                        {match.start ? new Date(match.start).toLocaleString() : 'N/A'}
                    </Typography>
                </Box>
            </Paper>

            <div className="p-6 mt-8 text-white rounded-lg" style={{ background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)' }}>
                <h2 className="text-2xl font-semibold mb-4">MOTM Votes</h2>
                <div className="w-full h-px bg-white mb-6"></div>

                {/* Grid layout: 3 cards on larger screens, then 2 cards, and responsive for mobile */}
                <div className="grid grid-cols-1 max-[500px]:grid-cols-1 min-[501px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-2 gap-6">
                    {[...(match.homeTeamUsers ?? []), ...(match.awayTeamUsers ?? [])]
                         .filter(player => playerVotes[player.id] > 0)
                         .map((player) => (
                            <Link key={player.id} href={`/player/${player.id}`}>
                                <div className="group">
                                    {/* Mobile layout: Image on top center */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-lg border min-h-[80px] sm:min-h-[100px] hover:-translate-y-1 transition-all duration-200 ease-in-out" style={{ background: 'linear-gradient(90deg, #767676 0%, #000000 100%)', borderColor: '#4b4b4b' }}>
                                        {/* Profile Image */}
                                        {/* -                                       <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 mb-3 sm:mb-0 sm:mr-4 flex-shrink-0" style={{ borderColor: '#4b4b4b' }}> */}
                                        {/* -                                           <img */}
                                        {/* -                                               src={player.profilePicture || "/placeholder.svg?height=60&width=60&query=football player"} */}
                                        {/* -                                               alt={`${player.firstName} ${player.lastName}`} */}
                                        {/* -                                               className="w-full h-full object-cover" */}
                                        {/* -                                           /> */}
                                        {/* -                                       </div> */}
                                        <JerseyAvatar
                                            number={player.shirtNumber || '0'}
                                            sx={{
                                                width: { xs: 25, sm: 35, md: 74 },
                                                height: { xs: 25, sm: 35, md: 74 },
                                                mr: { xs: 1, sm: 1.5 },
                                            }}
                                        />
                                        {/* Player Info */}
                                        <div className="flex-1 min-w-0 text-center sm:text-left">
                                            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 truncate leading-tight">
                                                {player.firstName} {player.lastName}
                                                {player.id === match.homeCaptainId ? " (C)" : ""}
                                            </h3>

                                            <p className="text-[#D1D5DB] text-xs sm:text-sm md:text-base mb-2 sm:mb-3 leading-tight">
                                                {player.positionType || "Player"}
                                            </p>

                                            {/* Buttons */}
                                            <div className="flex justify-center sm:justify-start gap-2 items-center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    className="bg-gradient-to-r from-[#767676] to-[#000000] hover:from-[#000000] hover:to-[#767676] text-white rounded-md px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold h-6 sm:h-7 min-w-0"
                                                >
                                                    {typeof playerVotes[player.id] === "number" &&
                                                        playerVotes[player.id] > 0 &&
                                                        `${playerVotes[player.id]} vote${playerVotes[player.id] > 1 ? "s" : ""}`}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
          







  <Paper
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    my: 2,
                    background: 'linear-gradient(180deg, #1f1f1f 0%, #0e0e0e 100%)',
                    color: 'white',
                    borderRadius: 3,
                    border: '1px solid #3a3a3a',
                }}
            >
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                    Captains Bonus Pick
                </Typography>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 600 }}>Defensive Impact</Typography>
                        {isCaptainUser ? (
                            <Button
                                onClick={() => openPickDialog('defence')}
                                variant="contained"
                                size="small"
                                disabled={!league?.active || !baseCanSubmit}
                                sx={{
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                    color: 'white',
                                    '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                }}
                            >
                                {captainPicks.defence ? playerNameById(captainPicks.defence) : 'Select Player'}
                            </Button>
                        ) : (
                            <Typography sx={{ opacity: 0.9 }}>
                                {captainPicks.defence ? playerNameById(captainPicks.defence) : 'Not selected'}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 600 }}>Influence</Typography>
                        {isCaptainUser ? (
                            <Button
                                onClick={() => openPickDialog('influence')}
                                variant="contained"
                                size="small"
                                disabled={!league?.active || !baseCanSubmit}
                                sx={{
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                    color: 'white',
                                    '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                }}
                            >
                                {captainPicks.influence ? playerNameById(captainPicks.influence) : 'Select Player'}
                            </Button>
                        ) : (
                            <Typography sx={{ opacity: 0.9 }}>
                                {captainPicks.influence ? playerNameById(captainPicks.influence) : 'Not selected'}
                            </Typography>
                        )}
                    </Box>

                    {!isCaptainUser && (
                        <Typography variant="caption" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.7)' }}>
                            Only the captain from each team can select these options.
                        </Typography>
                    )}
                </Box>
            </Paper>

  {isAdmin && (
                <Box sx={{
                    mt: 4,
                    mb: 4,
                    background: 'linear-gradient(180deg, #1f1f1f 0%, #0e0e0e 100%)',
                    color: 'white',
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    border: '1px solid #3a3a3a',
                    maxWidth: 700,
                    mx: 'auto',
                }}>
                    <Typography variant="h6" gutterBottom>Admin Controls</Typography>
                    <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                    <Box sx={{ display: 'flex', color: 'white', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setHomeGoals(p => Math.max(0, p - 1))} size="small" sx={{ color: 'white' }} disabled={!league.active}><Remove /></IconButton>
                            <TextField
                                label={`${match.homeTeamName} Goals`}
                                type="number"
                                value={homeGoals}
                                onChange={e => setHomeGoals(Number(e.target.value))}
                                variant="outlined"
                                sx={{
                                    width: '150px',
                                    input: { color: 'white' },
                                    label: { color: 'white' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'white' },
                                        '&:hover fieldset': { borderColor: 'white' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'white' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                }}
                                inputProps={{ style: { textAlign: 'center', color: 'white' } }}
                                InputLabelProps={{ style: { color: 'white' } }}
                                disabled={!league.active}
                            />
                            <IconButton onClick={() => setHomeGoals(p => p + 1)} size="small" sx={{ color: 'white' }} disabled={!league.active}><Add /></IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setAwayGoals(p => Math.max(0, p - 1))} size="small" sx={{ color: 'white' }} disabled={!league.active}><Remove /></IconButton>
                            <TextField
                                label={`${match.awayTeamName} Goals`}
                                type="number"
                                value={awayGoals}
                                onChange={e => setAwayGoals(Number(e.target.value))}
                                variant="outlined"
                                sx={{
                                    width: '150px',
                                    input: { color: 'white' },
                                    label: { color: 'white' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'white' },
                                        '&:hover fieldset': { borderColor: 'white' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'white' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                }}
                                inputProps={{ style: { textAlign: 'center', color: 'white' } }}
                                InputLabelProps={{ style: { color: 'white' } }}
                                disabled={!league.active}
                            />
                            <IconButton onClick={() => setAwayGoals(p => p + 1)} size="small" sx={{ color: 'white' }} disabled={!league.active}><Add /></IconButton>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Match Note"
                            multiline
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            fullWidth
                            variant="outlined"
                            disabled={!league.active}
                            sx={{
                                input: { color: 'white' },
                                textarea: { color: 'white' },
                                label: { color: 'white' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'white' },
                                    '&:hover fieldset': { borderColor: 'white' },
                                    '&.Mui-focused fieldset': { borderColor: 'white' },
                                },
                                '& .MuiInputLabel-root': { color: 'white' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                            }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                    </Box>
                    <Button
                        sx={{
                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                            color: 'white',
                            fontWeight: 'bold',
                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                        }}
                        variant="contained"
                        color="primary"
                        onClick={handleSaveDetails}
                        disabled={!league.active || savingMatchDetails}
                    >
                        {savingMatchDetails ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Match Details'}
                    </Button>
                </Box>
            )}
            {/* --- NEW: Player selection dialog (team-restricted) --- */}
            <Dialog open={isPickDialogOpen} onClose={() => setIsPickDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>
                    {pickCategory === 'defence' ? 'Select player for Defensive Impact' : 'Select player for Influence'}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                        {myTeamPlayers.map(p => (
                            <Button
                                key={p.id}
                                onClick={() => handleSelectPick(p.id)}
                                disabled={savingPick}
                                variant="outlined"
                                sx={{
                                    justifyContent: 'flex-start',
                                    borderColor: '#bdbdbd',
                                    color: '#111',
                                    '&:hover': { borderColor: '#9e9e9e', backgroundColor: 'rgba(0,0,0,0.04)' },
                                }}
                            >
                                {p.firstName} {p.lastName} {p.shirtNumber ? `#${p.shirtNumber}` : ''}
                            </Button>
                        ))}
                        {myTeamPlayers.length === 0 && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                No players available.
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsPickDialogOpen(false)}
                        variant="outlined"
                        disabled={savingPick}
                        sx={{
                            color: '#111',
                            borderColor: '#bdbdbd',
                            '&:hover': { borderColor: '#9e9e9e', backgroundColor: 'rgba(0,0,0,0.04)' },
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>


            <Dialog open={isStatsModalOpen} onClose={handleCloseStatsModal} fullWidth maxWidth="sm">
                <DialogTitle>Your Stats for the Match</DialogTitle>
                <DialogContent>
                    <StatCounter icon={<img src={Goals.src} alt="Goals" style={{ width: 24, height: 24 }} />} label="Goals Scored" value={stats.goals} onIncrement={() => handleStatChange('goals', 1, teamGoalsSafe)} onDecrement={() => handleStatChange('goals', -1, teamGoalsSafe)} />
                    <StatCounter icon={<img src={Assist.src} alt="Assists" style={{ width: 24, height: 24 }} />} label="Assists" value={stats.assists} onIncrement={() => handleStatChange('assists', 1, teamGoalsSafe)} onDecrement={() => handleStatChange('assists', -1, teamGoalsSafe)} />
                    <StatCounter icon={<img src={CleanSheet.src} alt="Clean Sheets" style={{ width: 24, height: 24 }} />} label="Clean Sheets" value={stats.cleanSheets} onIncrement={() => handleStatChange('cleanSheets', 1, 1)} onDecrement={() => handleStatChange('cleanSheets', -1, 1)} />
                    {/* <StatCounter icon={<img src={penalty.src} alt='penalty' style={{ width: 24, height: 24 }} />} label="Penalties" value={stats.penalties} onIncrement={() => handleStatChange('penalties', 1, teamGoalsSafe)} onDecrement={() => handleStatChange('penalties', -1, teamGoalsSafe)} />
                    <StatCounter icon={<img src={FreeKick.src} alt='freekick' style={{ width: 24, height: 24 }} />} label="Free Kicks" value={stats.freeKicks} onIncrement={() => handleStatChange('freeKicks', 1, teamGoalsSafe)} onDecrement={() => handleStatChange('freeKicks', -1, teamGoalsSafe)} />
                    <StatCounter icon={<img src={Defence.src} alt="Defence" style={{ width: 24, height: 24 }} />} label="Defence" value={stats.defence} onIncrement={() => handleStatChange('defence', 1, 1)} onDecrement={() => handleStatChange('defence', -1, 1)} /> */}
                    {/* Read-only computed Impact display */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1.5, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <img src={Imapct.src} alt="Impact" style={{ width: 24, height: 24 }} />
                            <Typography sx={{ ml: 2, fontWeight: 500 }}>Impact</Typography>
                        </Box>
                        <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                            {computedImpact}%
                        </Typography>
                    </Box>
                </DialogContent>
                {/* FreeKick */}
                <DialogActions>
                    <Button
                        onClick={handleCloseStatsModal}
                        variant="outlined"
                        sx={{
                            color: '#111',
                            borderColor: '#bdbdbd',
                            '&:hover': { borderColor: '#9e9e9e', backgroundColor: 'rgba(0,0,0,0.04)' },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveStats}
                        variant="contained"
                        disabled={isSubmittingStats}
                        sx={{
                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                            color: 'white',
                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                        }}
                    >
                        {isSubmittingStats ? <CircularProgress size={24} /> : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Admin Stats Modal */}
            <Dialog open={isAdminStatsModalOpen} onClose={handleCloseAdminStatsModal} fullWidth maxWidth="sm">
                <DialogTitle>Admin Add Stats for {selectedPlayerForAdmin?.firstName} {selectedPlayerForAdmin?.lastName}</DialogTitle>
                <DialogContent>
                    <StatCounter
                        icon={<img src={Goals.src} alt="Goals" style={{ width: 24, height: 24 }} />}
                        label="Goals Scored"
                        value={adminStats.goals}
                        onIncrement={() => handleAdminStatChange('goals', 1, 10)}
                        onDecrement={() => handleAdminStatChange('goals', -1, 10)}
                    />
                    <StatCounter
                        icon={<img src={Assist.src} alt="Assists" style={{ width: 24, height: 24 }} />}
                        label="Assists"
                        value={adminStats.assists}
                        onIncrement={() => handleAdminStatChange('assists', 1, 10)}
                        onDecrement={() => handleAdminStatChange('assists', -1, 10)}
                    />
                    <StatCounter
                        icon={<img src={CleanSheet.src} alt="Clean Sheets" style={{ width: 24, height: 24 }} />}
                        label="Clean Sheets"
                        value={adminStats.cleanSheets}
                        onIncrement={() => handleAdminStatChange('cleanSheets', 1, 1)}
                        onDecrement={() => handleAdminStatChange('cleanSheets', -1, 1)}
                    />
                    {/* <StatCounter
                        icon={<img src={penalty.src} alt='penalty' style={{ width: 24, height: 24 }} />}
                        label="Penalties"
                        value={adminStats.penalties}
                        onIncrement={() => handleAdminStatChange('penalties', 1, 5)}
                        onDecrement={() => handleAdminStatChange('penalties', -1, 5)}
                    />
                    <StatCounter
                        icon={<img src={FreeKick.src} alt='freekick' style={{ width: 24, height: 24 }} />}
                        label="Free Kicks"
                        value={adminStats.freeKicks}
                        onIncrement={() => handleAdminStatChange('freeKicks', 1, 5)}
                        onDecrement={() => handleAdminStatChange('freeKicks', -1, 5)}
                    />
                    <StatCounter
                        icon={<img src={Defence.src} alt="Defence" style={{ width: 24, height: 24 }} />}
                        label="Defence"
                        value={adminStats.defence}
                        onIncrement={() => handleAdminStatChange('defence', 1, 1)}
                        onDecrement={() => handleAdminStatChange('defence', -1, 1)}
                    /> */}
                    {/* Read-only computed Impact display for Admin */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1.5, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <img src={Imapct.src} alt="Impact" style={{ width: 24, height: 24 }} />
                            <Typography sx={{ ml: 2, fontWeight: 500 }}>Impact</Typography>
                        </Box>
                        <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                            {computedAdminImpact}%
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseAdminStatsModal}
                       
                        variant="outlined"
                        sx={{
                            color: '#111',
                            borderColor: '#bdbdbd',
                            '&:hover': { borderColor: '#9e9e9e', backgroundColor: 'rgba(0,0,0,0.04)' },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveAdminStats}
                        variant="contained"
                        disabled={isSubmittingAdminStats}
                        sx={{
                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                            color: 'white',
                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                        }}
                    >
                        {isSubmittingAdminStats ? <CircularProgress size={24} /> : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

const StatCounter = ({ label, value, onIncrement, onDecrement, icon }: { label: string, value: number, onIncrement: () => void, onDecrement: () => void, icon: React.ReactNode }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {icon}
            <Typography sx={{ ml: 2, fontWeight: 500 }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={onDecrement} size="small"><Remove /></IconButton>
            <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{value}</Typography>
            <IconButton onClick={onIncrement} size="small"><Add /></IconButton>
        </Box>
    </Box>
);