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
import CloseIcon from '@mui/icons-material/Close';
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

// Optional external control props to allow rendering this whole page inside a Dialog
// When "open" is provided, the component will render its entire UI wrapped in a MUI Dialog
// and call onClose when the dialog's close button/backdrop is triggered.
// Other props are accepted for compatibility with current callers but not used here.
// Narrow types for external stat change handler
type StatKey = 'goals' | 'assists' | 'cleanSheets' | 'penalties' | 'freeKicks' | 'defence' | 'impact';
type HandleStatChange = (stat: StatKey, increment: number, max: number) => void;

interface EmbeddedControlProps {
    open?: boolean;
    onClose?: () => void;
    onSave?: (stats?: unknown) => void;
    isSubmitting?: boolean;
    stats?: unknown;
    handleStatChange?: HandleStatChange;
    teamGoals?: number;
}

// type MatchApiResponse = {
//     success?: boolean;
//     match?: Partial<MatchWithGuests> | null;
//     message?: string;
// };
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

const PlayMatchPagee: React.FC<EmbeddedControlProps> = (props) => {
    const { open, onClose } = props;
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

    // --- NEW: League selection + show matches states ---
    const [leagueSelectOpen, setLeagueSelectOpen] = useState(false);
    const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
    const [leaguesLoading, setLeaguesLoading] = useState(false);
    const [leaguesError, setLeaguesError] = useState<string | null>(null);
    const [selectedLeagueIdForList, setSelectedLeagueIdForList] = useState<string | null>(null);
    const [selectedLeagueNameForList, setSelectedLeagueNameForList] = useState<string>('');
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState<string | null>(null);
    const [selectedLeagueMatches, setSelectedLeagueMatches] = useState<Partial<Match>[]>([]);
    // Decoupled UI-only selection for the top toolbar match button (does not affect main match content below)
    const [selectedMatchForList, setSelectedMatchForList] = useState<Partial<Match> | null>(null);
    const [selectedLeagueHasNoMatches, setSelectedLeagueHasNoMatches] = useState(false);
    const [autoSelectMatchLoading, setAutoSelectMatchLoading] = useState(false);
    const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);

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
    // Embedded-mode resolved ids (auto-picked latest)
    const [currentLeagueId, setCurrentLeagueId] = useState<string>('');
    const [currentMatchId, setCurrentMatchId] = useState<string>('');
    const resolvedLeagueId = currentLeagueId || leagueId;
    const resolvedMatchId = currentMatchId || matchId;

    // --- NEW: handlers to fetch leagues and matches ---
    const openLeagueSelector = useCallback(async () => {
        setLeagueSelectOpen(true);
        setLeaguesError(null);
        if (availableLeagues.length > 0) return; // already loaded
        if (!token) return;
        try {
            setLeaguesLoading(true);
            // Try primary endpoint
            let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 404 || res.status === 405) {
                // Fallback to leagues/all then profile/leagues
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 404 || res.status === 405) {
                    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/leagues`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok || (data && data.success === false)) {
                throw new Error(data?.message || 'Failed to load leagues');
            }
            // Normalize various response shapes:
            // - { leagues: League[] }
            // - { leagues: { joined: League[], managed: League[] } }
            // - { data: League[] }
            let leaguesArr: any = [];
            if (Array.isArray(data?.leagues)) {
                leaguesArr = data.leagues;
            } else if (data?.leagues && typeof data.leagues === 'object') {
                const joined = Array.isArray(data.leagues.joined) ? data.leagues.joined : [];
                const managed = Array.isArray(data.leagues.managed) ? data.leagues.managed : [];
                leaguesArr = [...joined, ...managed];
            } else if (Array.isArray(data?.data)) {
                leaguesArr = data.data;
            }
            // De-duplicate by id
            const byId = new Map<string, any>();
            (Array.isArray(leaguesArr) ? leaguesArr : []).forEach((l: any) => {
                const id = String(l?.id ?? '');
                if (id && !byId.has(id)) byId.set(id, l);
            });
            const normalized: League[] = Array.from(byId.values()).map((l: any) => ({
                id: String(l.id),
                name: l.name,
                administrators: (l.administrators || l.administeredLeagues || []).map((u: any) => ({
                    id: String(u.id), firstName: u.firstName, lastName: u.lastName
                })),
                active: typeof l.active === 'boolean' ? l.active : true,
            }));
            setAvailableLeagues(normalized);
            if (normalized.length === 0) {
                toast.error('No leagues found for your account.');
            }
        } catch (e: unknown) {
            setLeaguesError(e instanceof Error ? e.message : 'Failed to load leagues');
        } finally {
            setLeaguesLoading(false);
        }
    }, [availableLeagues.length, token]);

    // const handleSelectLeague = useCallback((l: League) => {
    //     setSelectedLeagueIdForList(l.id);
    //     setSelectedLeagueNameForList(l.name);
    //     setLeagueSelectOpen(false);
    //     // reset UI state
    //     setSelectedLeagueMatches([]);
    //     setMatchesError(null);
    //     setSelectedMatchForList(null);
    //     setSelectedLeagueHasNoMatches(false);

    //     // Auto-fetch and auto-select latest match for this league (UI only)
    //     (async () => {
    //         try {
    //             setAutoSelectMatchLoading(true);
    //             if (!token) return;
    //             let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches?leagueId=${encodeURIComponent(l.id)}`, {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             });
    //             if (res.status === 404 || res.status === 405) {
    //                 res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches`, {
    //                     headers: { Authorization: `Bearer ${token}` }
    //                 });
    //             }
    //             const data = await res.json().catch(() => ({}));
    //             if (!res.ok || (data && data.success === false)) {
    //                 throw new Error(data?.message || 'Failed to load matches');
    //             }
    //             let matchesArr: any[] = data?.matches || data?.data || data?.leagueMatches || [];
    //             if (!Array.isArray(matchesArr)) matchesArr = [];
    //             const filtered = matchesArr.filter((m: any) => String(m?.leagueId ?? '') === String(l.id));
    //             setSelectedLeagueMatches(filtered);

    //             if (!filtered.length) {
    //                 setSelectedLeagueHasNoMatches(true);
    //                 setSelectedMatchForList(null);
    //                 return;
    //             }

    //             // Pick latest by start date (fallback to createdAt/updatedAt/id)
    //             const toTime = (m: any): number => {
    //                 const s = m?.start || m?.matchStart || m?.createdAt || m?.updatedAt;
    //                 const t = s ? new Date(s).getTime() : NaN;
    //                 if (!Number.isNaN(t)) return t;
    //                 // very last fallback: parse id if numeric
    //                 const n = Number(m?.id);
    //                 return Number.isFinite(n) ? n : 0;
    //             };
    //             const latest = [...filtered].sort((a, b) => toTime(b) - toTime(a))[0] || null;
    //             setSelectedMatchForList(latest || null);
    //             setSelectedLeagueHasNoMatches(false);
    //         } catch (e) {
    //             // On error, keep UI safe and indicate no match
    //             setSelectedLeagueHasNoMatches(true);
    //             setSelectedMatchForList(null);
    //         } finally {
    //             setAutoSelectMatchLoading(false);
    //         }
    //     })();
    // }, [token]);

    const fetchSelectedLeagueMatches = useCallback(async () => {
        const leagueIdForList = (selectedLeagueIdForList || resolvedLeagueId || '').trim();
        if (!leagueIdForList) {
            toast.error('Please select a league first.');
            return;
        }
        if (!token) return;
        setMatchesLoading(true);
        setMatchesError(null);
        try {
            // Try query param endpoint first
            let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches?leagueId=${encodeURIComponent(leagueIdForList)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 404 || res.status === 405) {
                // Fallback: fetch all matches and client-filter by leagueId
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok || (data && data.success === false)) {
                throw new Error(data?.message || 'Failed to load matches');
            }
            let matchesArr: any[] = data?.matches || data?.data || data?.leagueMatches || [];
            if (!Array.isArray(matchesArr)) matchesArr = [];
            // Always filter by selected league id to be consistent across endpoints
            const filtered = matchesArr.filter((m: any) => String(m?.leagueId ?? '') === String(leagueIdForList));
            setSelectedLeagueMatches(filtered);
            if (filtered.length === 0) {
                toast('No matches found for this league yet.');
            }
        } catch (e: unknown) {
            setMatchesError(e instanceof Error ? e.message : 'Failed to load matches');
        } finally {
            setMatchesLoading(false);
        }
    }, [selectedLeagueIdForList, resolvedLeagueId, token]);

    // Open Matches Dialog and fetch
    const openMatchesDialog = useCallback(async () => {
        // default selected league id to current if none selected explicitly
        if (!selectedLeagueIdForList && resolvedLeagueId) {
            setSelectedLeagueIdForList(resolvedLeagueId);
            setSelectedLeagueNameForList(league?.name || selectedLeagueNameForList);
        }
        setMatchesDialogOpen(true);
        setSelectedLeagueMatches([]);
        setMatchesError(null);
        await fetchSelectedLeagueMatches();
    }, [resolvedLeagueId, selectedLeagueIdForList, fetchSelectedLeagueMatches, league?.name, selectedLeagueNameForList]);

    // Navigate to a selected match's play page
    // const goToMatch = useCallback((mid?: string, lid?: string | null) => {
    //     const matchIdStr = String(mid || '').trim();
    //     const leagueIdStr = String(lid || selectedLeagueIdForList || '').trim();
    //     if (!matchIdStr || !leagueIdStr) {
    //         toast.error('Missing match or league id');
    //         return;
    //     }
    //     router.push(`/league/${leagueIdStr}/match/${matchIdStr}/play`);
    // }, [router, selectedLeagueIdForList]);

    // CHANGED: add "silent" flag to avoid flipping global loading during save
    const fetchLeagueAndMatchDetails = useCallback(async (silent: boolean = false, attempt: number = 0) => {
        try {
            if (!silent) setLoading(true);
            if (!resolvedLeagueId || !resolvedMatchId) {
                console.warn('MatchStatsDialog: missing ids, skipping details fetch', { resolvedLeagueId, resolvedMatchId });
                if (!silent) setLoading(false);
                return;
            }
            // 1) Try to get the match (first with league-bound endpoint, then fallback to /matches/:id)
            let matchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${resolvedLeagueId}/matches/${resolvedMatchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (matchResp.status === 404) {
                matchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            const raw = await matchResp.json().catch(() => ({} as any));
            // Tolerant response handling across shapes
            // Accept: { success, match }, { match }, direct match object, or { data: match }
            let matchObj: any = null;
            if (raw && typeof raw === 'object') {
                if (raw.match) matchObj = raw.match;
                else if (raw.data && (raw.data.id || raw.data.match)) matchObj = raw.data.match || raw.data;
                else if (raw.id) matchObj = raw;
            }
            if (!matchResp.ok || !matchObj) {
                console.warn('MatchStatsDialog: match fetch failed, attempting league matches fallback', { status: matchResp.status, raw, attempt });
                if (attempt < 1) {
                    // Fallback: fetch matches list for league and pick latest
                    let mres = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches?leagueId=${encodeURIComponent(resolvedLeagueId)}`, { headers: { Authorization: `Bearer ${token}` } });
                    if (mres.status === 404 || mres.status === 405) {
                        mres = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches`, { headers: { Authorization: `Bearer ${token}` } });
                    }
                    const mdata = await mres.json().catch(() => ({}));
                    let matchesArr: any[] = mdata?.matches || mdata?.data || mdata?.leagueMatches || [];
                    if (!Array.isArray(matchesArr)) matchesArr = [];
                    const filtered = matchesArr.filter((m: any) => String(m?.leagueId ?? '') === String(resolvedLeagueId));
                    const mWithDates = filtered.map(m => ({ m, ts: Date.parse(m.start || m.date || m.updatedAt || m.createdAt || '') || 0, idNum: Number(m.id) || 0 }));
                    mWithDates.sort((a, b) => b.ts - a.ts || b.idNum - a.idNum);
                    const chosen = mWithDates[0]?.m || null;
                    if (chosen && String(chosen.id) !== resolvedMatchId) {
                        console.log('MatchStatsDialog: fallback picked match', { chosenId: String(chosen.id) });
                        setCurrentMatchId(String(chosen.id));
                        await fetchLeagueAndMatchDetails(true, attempt + 1);
                        return;
                    }
                }
                const msg = (raw && typeof raw === 'object' && (raw.message || raw.error)) || matchResp.statusText || 'Failed to fetch match details';
                console.error('MatchStatsDialog: match fetch failed (giving up)', { status: matchResp.status, msg, raw });
                throw new Error(String(msg));
            }
            const m = normalizeMatch(matchObj);
            setMatch(m);
            setHomeGoals(typeof m.homeTeamGoals === 'number' ? m.homeTeamGoals : 0);
            setAwayGoals(typeof m.awayTeamGoals === 'number' ? m.awayTeamGoals : 0);

            // 2) Fetch league using a reliable id (prefer id from match if present)
            const effectiveLeagueId = m.leagueId || resolvedLeagueId;
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
    }, [resolvedLeagueId, resolvedMatchId, token]);

    useEffect(() => {
        if (resolvedLeagueId && resolvedMatchId && token) {
            console.log('MatchStatsDialog: fetching details for', { resolvedLeagueId, resolvedMatchId });
            fetchLeagueAndMatchDetails();
        }
    }, [resolvedLeagueId, resolvedMatchId, token, fetchLeagueAndMatchDetails]);

    // Define after fetchLeagueAndMatchDetails so we can safely call it
    const handleSelectLeague = useCallback((l: League) => {
        setSelectedLeagueIdForList(l.id);
        setSelectedLeagueNameForList(l.name);
        setLeagueSelectOpen(false);
        // reset UI state
        setSelectedLeagueMatches([]);
        setMatchesError(null);
        setSelectedMatchForList(null);
        setSelectedLeagueHasNoMatches(false);

        // Auto-fetch and auto-select latest match for this league (UI + update main content)
        (async () => {
            try {
                setAutoSelectMatchLoading(true);
                if (!token) return;
                let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches?leagueId=${encodeURIComponent(l.id)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 404 || res.status === 405) {
                    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
                const data = await res.json().catch(() => ({}));
                if (!res.ok || (data && data.success === false)) {
                    throw new Error(data?.message || 'Failed to load matches');
                }
                let matchesArr: any[] = data?.matches || data?.data || data?.leagueMatches || [];
                if (!Array.isArray(matchesArr)) matchesArr = [];
                const filtered = matchesArr.filter((m: any) => String(m?.leagueId ?? '') === String(l.id));
                setSelectedLeagueMatches(filtered);

                if (!filtered.length) {
                    setSelectedLeagueHasNoMatches(true);
                    setSelectedMatchForList(null);
                    // Keep existing content; do not reset current ids when no matches
                    return;
                }

                // Pick latest by start date (fallback to createdAt/updatedAt/id)
                const toTime = (m: any): number => {
                    const s = m?.start || m?.matchStart || m?.createdAt || m?.updatedAt;
                    const t = s ? new Date(s).getTime() : NaN;
                    if (!Number.isNaN(t)) return t;
                    // very last fallback: parse id if numeric
                    const n = Number(m?.id);
                    return Number.isFinite(n) ? n : 0;
                };
                const latest = [...filtered].sort((a, b) => toTime(b) - toTime(a))[0] || null;
                setSelectedMatchForList(latest || null);
                setSelectedLeagueHasNoMatches(false);

                // Also update the below content by setting current ids and refetching
                if (latest && latest.id) {
                    setCurrentLeagueId(String(l.id));
                    setCurrentMatchId(String(latest.id));
                    await fetchLeagueAndMatchDetails(true);
                }
            } catch (e) {
                // On error, keep UI safe and indicate no match
                setSelectedLeagueHasNoMatches(true);
                setSelectedMatchForList(null);
            } finally {
                setAutoSelectMatchLoading(false);
            }
        })();
    }, [token, fetchLeagueAndMatchDetails]);

    // Embedded mode: when opened from Navbar (no route ids), auto-select latest league and latest match
    useEffect(() => {
        const run = async () => {
            // Only in embedded mode
            if (typeof open !== 'boolean') return;
            if (!open) return;
            // If route provided ids or we already resolved, nothing to do
            if ((leagueId && matchId) || (resolvedLeagueId && resolvedMatchId)) {
                console.log('MatchStatsDialog: ids already present', { leagueId, matchId, resolvedLeagueId, resolvedMatchId });
                return;
            }
            if (!token) {
                console.log('MatchStatsDialog: no token in embedded mode; stopping loading');
                setLoading(false);
                return;
            }
            try {
                console.log('MatchStatsDialog: auto-select latest league/match - start');
                setLoading(true);
                // Load leagues
                let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.status === 404 || res.status === 405) {
                    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/all`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.status === 404 || res.status === 405) {
                        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/leagues`, { headers: { Authorization: `Bearer ${token}` } });
                    }
                }
                const data = await res.json().catch(() => ({}));
                let leaguesArr: any = [];
                if (Array.isArray(data?.leagues)) leaguesArr = data.leagues;
                else if (data?.leagues && typeof data.leagues === 'object') {
                    const joined = Array.isArray(data.leagues.joined) ? data.leagues.joined : [];
                    const managed = Array.isArray(data.leagues.managed) ? data.leagues.managed : [];
                    leaguesArr = [...joined, ...managed];
                } else if (Array.isArray(data?.data)) leaguesArr = data.data;
                const byId = new Map<string, any>();
                (Array.isArray(leaguesArr) ? leaguesArr : []).forEach((l: any) => { const id = String(l?.id ?? ''); if (id && !byId.has(id)) byId.set(id, l); });
                const allLeagues = Array.from(byId.values());
                console.log('MatchStatsDialog: fetched leagues', { count: allLeagues.length });
                if (!allLeagues.length) { setLoading(false); return; }
                const withDates = allLeagues.map(l => ({ l, ts: Date.parse(l.updatedAt || l.createdAt || l.date || l.start || '') || 0, idNum: Number(l.id) || 0 }));
                withDates.sort((a, b) => b.ts - a.ts || b.idNum - a.idNum);
                const chosenLeague = withDates[0]?.l || allLeagues[0];
                const chosenLeagueId = String(chosenLeague.id);
                console.log('MatchStatsDialog: chosen league', { chosenLeagueId });

                // Load matches for chosen league
                let mres = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches?leagueId=${encodeURIComponent(chosenLeagueId)}`, { headers: { Authorization: `Bearer ${token}` } });
                if (mres.status === 404 || mres.status === 405) {
                    mres = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches`, { headers: { Authorization: `Bearer ${token}` } });
                }
                const mdata = await mres.json().catch(() => ({}));
                let matchesArr: any[] = mdata?.matches || mdata?.data || mdata?.leagueMatches || [];
                if (!Array.isArray(matchesArr)) matchesArr = [];
                const filtered = matchesArr.filter((m: any) => String(m?.leagueId ?? '') === chosenLeagueId);
                console.log('MatchStatsDialog: matches for league', { leagueId: chosenLeagueId, count: filtered.length });
                const mWithDates = filtered.map(m => ({ m, ts: Date.parse(m.start || m.date || m.updatedAt || m.createdAt || '') || 0, idNum: Number(m.id) || 0 }));
                mWithDates.sort((a, b) => b.ts - a.ts || b.idNum - a.idNum);
                const chosenMatch = mWithDates[0]?.m || null;
                if (!chosenMatch) {
                    console.log('MatchStatsDialog: no matches for chosen league');
                    setCurrentLeagueId(chosenLeagueId);
                    setCurrentMatchId('');
                    setLoading(false);
                    return;
                }
                const chosenMatchId = String(chosenMatch.id);
                console.log('MatchStatsDialog: chosen match', { chosenMatchId });
                setCurrentLeagueId(chosenLeagueId);
                setCurrentMatchId(chosenMatchId);
                await fetchLeagueAndMatchDetails(true);
                setLoading(false);
            } catch (e) {
                console.error('MatchStatsDialog: auto-select error', e);
                setLoading(false);
            }
        };
        run();
    }, [open, token, leagueId, matchId, resolvedLeagueId, resolvedMatchId, fetchLeagueAndMatchDetails]);

    // CHANGED: do not toggle global loading; refetch silently and show local spinner on button
    const handleSaveDetails = async () => {
        if (!token || !matchId) return;
        try {
            setSavingMatchDetails(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/upload-result`, {
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
        if (!token || !resolvedMatchId) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/votes`, {
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
    }, [resolvedMatchId, token]);

    useEffect(() => {
        if (resolvedMatchId && token) fetchVotes();
    }, [resolvedMatchId, token, fetchVotes]);

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
                { value: s.goals, max: safeMax(tGoals), weight: 0.3 },
                { value: s.assists, max: safeMax(tGoals), weight: 0.2 },
                { value: s.cleanSheets, max: 1, weight: 0.1 },
                { value: s.defence, max: 1, weight: 0.2 },
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/votes`, {
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
                            cacheManager.updateLeaderboardCache(playerId, value, metric as keyof LeaderboardPlayer, `leaderboard_motm_${resolvedMatchId}`);
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/stats`, {
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
                    } catch { }
                }
            }

            // 2) Probe API; if 404/405, mark unavailable and stop
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/captain-picks`, {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/captain-picks`, {
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
        } catch (err: unknown) {
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
        if (!token || !resolvedMatchId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/stats-window`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch stats window');
            const data = await res.json();
            if (data.success) setEditWindow(data.window as EditWindow);
        } catch (err: unknown) {
            console.error('fetchEditWindow failed', err);
            setEditWindow(null);
        }
    }, [resolvedMatchId, token]);

    useEffect(() => {
        if (resolvedMatchId && token) fetchEditWindow();
    }, [resolvedMatchId, token, fetchEditWindow]);


    const handleSaveAdminStats = async () => {
        if (!selectedPlayerForAdmin) return;

        setIsSubmittingAdminStats(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/stats`, {
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

        // Player path: honor backend canPlayerSubmit (same logic as page view)
        if (!(editWindow?.canPlayerSubmit ?? false)) {
            toast.error("It's not possible to add stats for earlier games. Please ask the admin to make changes to older games.");
            return;
        }

        // Previous match info toast
        const idxFromEnd = editWindow?.indexFromEnd;
        if (idxFromEnd === 1) {
            toast('You are adding stats for the previous match.', { icon: 'ℹ️' });
        }

        setIsStatsModalOpen(true);
    };

    if (loading) {
        const inner = (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
        if (typeof open === 'boolean') {
            return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper" keepMounted>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Match Stats
                        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        {inner}
                    </DialogContent>
                </Dialog>
            );
        }
        return inner;
    }

    if (error || !league || !match) {
        // Embedded: show a simple starter UI that lets the user select a league instead of a hard error
        if (typeof open === 'boolean') {
            return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" keepMounted>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Match Stats
                        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            {!!error && (
                                <Alert severity="error">{error}</Alert>
                            )}
                            <Typography variant="body1">Select a league to view and add stats.</Typography>
                            <Box>
                                <Button
                                    onClick={openLeagueSelector}
                                    variant="contained"
                                    sx={{
                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                    }}
                                >
                                    Select League
                                </Button>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            );
        }

        // Page mode: keep the original error with back nav
        return (
            <Box sx={{ p: 4, minHeight: '100vh', color: 'white' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white' }}>
                    Back to League
                </Button>
                <Typography color="error">{error || 'Could not load league or match data.'}</Typography>
            </Box>
        );
    }

    if (!user) {
        const inner = (
            <Box sx={{ p: 3 }}>
                <Typography variant="body1">Please sign in to add or view match stats.</Typography>
            </Box>
        );
        if (typeof open === 'boolean') {
            return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" keepMounted>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Match Stats
                        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        {inner}
                    </DialogContent>
                </Dialog>
            );
        }
        return null;
    }

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

    const homePlayersAll: (User & { isGuest?: boolean })[] = [...(match?.homeTeamUsers ?? []), ...guestUsersHome];
    const awayPlayersAll: (User & { isGuest?: boolean })[] = [...(match?.awayTeamUsers ?? []), ...guestUsersAway];
    // Debug log to verify state after refresh and voting
    console.log('votedForId:', votedForId, 'playerVotes:', playerVotes);

    const content = (
        <Box sx={{ p: { xs: 0.5, sm: 2, md: 4 }, minHeight: '100vh', color: 'black' }}>
            {/* --- NEW: League selector and show matches toolbar --- */}
            <Paper sx={{ p: { xs: 1, sm: 1.5 }, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)', color: 'white' }}>
                {/* <Typography sx={{ fontWeight: 700, mr: 1 }}>Explore Matches by League</Typography> */}
                {/* Label + League selector */}
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1.175rem' }}>Select League :</Typography>
                <Button
                    onClick={openLeagueSelector}
                    variant="contained"
                    size="small"
                    sx={{
                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                        color: 'white',
                        fontWeight: 'bold',
                        '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                    }}
                >
                    {(selectedLeagueNameForList || league?.name)
                        ? `League: ${selectedLeagueNameForList || league?.name}`
                        : 'Select League'}
                </Button>
                {/* Label + Match selector */}
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1.175rem', ml: 1 }}>Match:</Typography>
                <Button
                    onClick={openMatchesDialog}
                    variant="contained"
                    size="small"
                    disabled={!selectedLeagueIdForList && !resolvedLeagueId}
                    sx={{
                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                        color: 'white',
                        fontWeight: 'bold',
                        '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                    }}
                >
                    {autoSelectMatchLoading
                        ? 'Loading Matches…'
                        : selectedLeagueHasNoMatches
                            ? 'No Match Found.'
                            : selectedMatchForList && (selectedMatchForList as any)?.homeTeamName && (selectedMatchForList as any)?.awayTeamName
                                ? `Match: ${(selectedMatchForList as any).homeTeamName} vs ${(selectedMatchForList as any).awayTeamName}`
                                : 'Select a Match'}
                </Button>
                {/* {selectedLeagueIdForList && (
                    <Typography sx={{ ml: 1, opacity: 0.95 }}>Selected: {selectedLeagueNameForList}</Typography>
                )} */}
            </Paper>

            {!selectedLeagueHasNoMatches && !league.active && (
                <Alert severity="warning" sx={{ mb: 1 }}>This league is currently inactive. All actions are disabled.</Alert>
            )}
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

            <Paper sx={{ p: { xs: 0.5, sm: 2, md: 3 }, background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)', color: 'white', borderRadius: 3, boxShadow: 3, display: selectedLeagueHasNoMatches ? 'none' : 'block' }}>
                {/* Scoreboard + Add Stats */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 0.5, sm: 1.5 }, gap: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1.25rem', md: '1.5rem' } }}>
                            {match.homeTeamName} ({typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0})
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>vs</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1.25rem', md: '1.5rem' } }}>
                            {match.awayTeamName} ({typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0})
                        </Typography>
                    </Box>

                    {user && league.active && canPlayerSubmitStats && isUserAssignedToTeam && (
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
                                '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' }
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
                        {(() => {
                            const combinedPlayers = [...(homePlayersAll || []), ...(awayPlayersAll || [])].filter(Boolean);
                            return combinedPlayers.length > 0 ? (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)' },
                                    gap: { xs: 0.5, sm: 1, md: 2 }
                                }}>
                                    {combinedPlayers.map((player) => (
                                        <Box key={player.id} sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            p: { xs: 0.5, sm: 1, md: 2 },
                                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                            borderRadius: 1.5,
                                            border: '1px solid #4b4b4b',
                                            minHeight: { xs: 40, sm: 60, md: 100 },
                                            position: 'relative',
                                            '&:hover': {
                                                background: 'linear-gradient(90deg, #202020 0%, #2b2b2b 100%)',
                                                transform: 'translateY(-1px)',
                                                transition: 'all 0.2s ease'
                                            }
                                        }}>
                                            {/* MOTM Coin - Top Right Corner */}
                                            {baseCanSubmit && league.active && isUserAssignedToTeam && !player.hasOwnProperty('isGuest') && user?.id !== player.id && (
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
                                                            {(player.id === match.homeCaptainId || player.id === match.awayCaptainId) ? ' (C)' : ''}
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

                                                {/* Player Add Stats (self) - only for last two matches */}
                                                {/* {!player.hasOwnProperty('isGuest') && user?.id === player.id && league.active && (editWindow?.canPlayerSubmit ?? false) && (
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
                                                            px: { xs: 0.25, sm: 0.5, md: 1.5 },
                                                            py: { xs: 0.125, sm: 0.25, md: 0.5 },
                                                            fontSize: { xs: 5, sm: 7, md: 10 },
                                                            minWidth: { xs: 'auto', sm: 'auto' },
                                                            height: { xs: 16, sm: 20, md: 28 },
                                                            whiteSpace: 'nowrap',
                                                            '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                                                            mt: { xs: 0.25, sm: 0.5, md: 0.5 },
                                                            mr: { xs: 0.25, sm: 0.5, md: 0.5 }
                                                        }}
                                                    >
                                                        Add Stats
                                                    </Button>
                                                )} */}

                                                {/* Admin Stats Button */}
                                                {isAdmin && match.status === 'RESULT_PUBLISHED' && league.active && (
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
                                    ))}
                                </Box>
                            ) : (
                                <Typography color="white" sx={{ textAlign: 'center', fontStyle: 'italic', fontSize: { xs: 10, sm: 14 } }}>
                                    No players assigned
                                </Typography>
                            );
                        })()}
                    </CardContent>
                </Card>
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
                    display: selectedLeagueHasNoMatches ? 'none' : 'block',
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

    <Paper
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    my: 2,
                    background: 'linear-gradient(180deg, #1f1f1f 0%, #0e0e0e 100%)',
                    color: 'white',
                    borderRadius: 3,
                    border: '1px solid #3a3a3a',
                    display: selectedLeagueHasNoMatches ? 'none' : 'block',
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



            {/* <div className="p-6 mt-8 text-white rounded-lg" style={{ display: selectedLeagueHasNoMatches ? 'none' : undefined, background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)' }}>
                <h2 className="text-2xl font-semibold mb-4">MOTM Votes</h2>
                <div className="w-full h-px bg-white mb-6"></div>

                <div className="grid grid-cols-1 max-[500px]:grid-cols-1 min-[501px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-2 gap-6">
                    {[...(match.homeTeamUsers ?? []), ...(match.awayTeamUsers ?? [])]
                         .filter(player => playerVotes[player.id] > 0)
                         .map((player) => (
                            <Link key={player.id} href={`/player/${player.id}`}>
                                <div className="group">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-lg border min-h-[80px] sm:min-h-[100px] hover:-translate-y-1 transition-all duration-200 ease-in-out" style={{ background: 'linear-gradient(90deg, #767676 0%, #000000 100%)', borderColor: '#4b4b4b' }}>
                                      
                                        <JerseyAvatar
                                            number={player.shirtNumber || '0'}
                                            sx={{
                                                width: { xs: 25, sm: 35, md: 74 },
                                                height: { xs: 25, sm: 35, md: 74 },
                                                mr: { xs: 1, sm: 1.5 },
                                            }}
                                        />
                                        <div className="flex-1 min-w-0 text-center sm:text-left">
                                            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 truncate leading-tight">
                                                {player.firstName} {player.lastName}
                                                {player.id === match.homeCaptainId ? " (C)" : ""}
                                            </h3>

                                            <p className="text-[#D1D5DB] text-xs sm:text-sm md:text-base mb-2 sm:mb-3 leading-tight">
                                                {player.positionType || "Player"}
                                            </p>

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
            </div> */}








        

            {isAdmin && !selectedLeagueHasNoMatches && (
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

            {/* --- NEW: League selection dialog --- */}
            <Dialog open={leagueSelectOpen} onClose={() => setLeagueSelectOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Select a League</DialogTitle>
                <DialogContent dividers>
                    {leaguesLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={18} />
                            <Typography>Loading leagues…</Typography>
                        </Box>
                    )}
                    {leaguesError && (
                        <Alert severity="error" sx={{ mb: 1 }}>{leaguesError}</Alert>
                    )}
                    {!leaguesLoading && !leaguesError && (
                        <Box sx={{ display: 'grid', gap: 1 }}>
                            {availableLeagues.map((l) => (
                                <Button
                                    key={l.id}
                                    onClick={() => handleSelectLeague(l)}
                                    variant="outlined"
                                    sx={{
                                        justifyContent: 'flex-start',
                                        borderColor: '#bdbdbd',
                                        color: '#111',
                                        '&:hover': { borderColor: '#9e9e9e', backgroundColor: 'rgba(0,0,0,0.04)' },
                                    }}
                                >
                                    {l.name}
                                </Button>
                            ))}
                            {availableLeagues.length === 0 && (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No leagues available.
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setLeagueSelectOpen(false)}
                        variant="outlined"
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


            {!selectedLeagueHasNoMatches && (
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
                        {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1.5, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <img src={Imapct.src} alt="Impact" style={{ width: 24, height: 24 }} />
                            <Typography sx={{ ml: 2, fontWeight: 500 }}>Impact</Typography>
                        </Box>
                        <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                            {computedImpact}%
                        </Typography>
                    </Box> */}
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
            )}

            {/* Matches selection dialog */}
            <Dialog open={matchesDialogOpen} onClose={() => setMatchesDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Select a Match</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>League</Typography>
                        <Button
                            onClick={openLeagueSelector}
                            variant="contained"
                            size="small"
                            sx={{
                                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                color: 'white',
                                '&:hover': { background: 'linear-gradient(90deg, #000000 0%, #767676 100%)' },
                            }}
                        >
                            {selectedLeagueNameForList || league?.name || 'Select League'}
                        </Button>
                    </Box>
                    {matchesLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={18} />
                            <Typography>Loading matches…</Typography>
                        </Box>
                    )}
                    {matchesError && (
                        <Alert severity="error" sx={{ mb: 1 }}>{matchesError}</Alert>
                    )}
                    {!matchesLoading && !matchesError && selectedLeagueMatches.length === 0 && (
                        <Typography sx={{ opacity: 0.9 }}>No matches found.</Typography>
                    )}
                    {!matchesLoading && !matchesError && selectedLeagueMatches.length > 0 && (
                        <Box sx={{ display: 'grid', gap: 1 }}>
                            {selectedLeagueMatches.map((m) => (
                                <Button
                                    key={m.id}
                                    onClick={async () => {
                                        const lid = String((m as any).leagueId || selectedLeagueIdForList || resolvedLeagueId || '');
                                        const mid = String(m.id || '');
                                        if (!lid || !mid) return;
                                        setCurrentLeagueId(lid);
                                        setCurrentMatchId(mid);
                                        setMatchesDialogOpen(false);
                                        await fetchLeagueAndMatchDetails(true);
                                    }}
                                    variant="outlined"
                                    sx={{
                                        justifyContent: 'space-between',
                                        borderColor: '#bdbdbd',
                                        color: '#111',
                                        '&:hover': { borderColor: '#9e9e9e', backgroundColor: 'rgba(0,0,0,0.04)' },
                                    }}
                                >
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {m.homeTeamName} vs {m.awayTeamName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            {m.date ? new Date(m.date).toLocaleString() : 'Date: N/A'}{m.location ? ` • ${m.location}` : ''}
                                        </Typography>
                                    </Box>
                                </Button>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setMatchesDialogOpen(false)}
                        variant="outlined"
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

            {/* Admin Stats Modal */}
            {!selectedLeagueHasNoMatches && (
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
                        {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1.5, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <img src={Imapct.src} alt="Impact" style={{ width: 24, height: 24 }} />
                            <Typography sx={{ ml: 2, fontWeight: 500 }}>Impact</Typography>
                        </Box>
                        <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                            {computedAdminImpact}%
                        </Typography>
                    </Box> */}
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
            )}
        </Box>
    );

    if (typeof open === 'boolean') {
        return (
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper" keepMounted>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Match Stats
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return content;
}

export default PlayMatchPagee;

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