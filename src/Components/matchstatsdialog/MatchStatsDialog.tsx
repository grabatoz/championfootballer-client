'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    MenuItem,
    Avatar,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Add, Remove } from '@mui/icons-material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SecurityIcon from '@mui/icons-material/Security';
import PsychologyIcon from '@mui/icons-material/Psychology';
import toast from 'react-hot-toast';
import { mutateWithRefresh, clearCacheByResource, dispatchRefreshEvent } from '@/lib/utils/cacheManager';
import Goals from '@/Components/images/goal.png'
import Assist from '@/Components/images/Assist.png'
import CleanSheet from '@/Components/images/cleansheet.png'
import Link from 'next/link';
import { cacheManager } from "@/lib/cacheManager"
import { LeaderboardPlayer } from '@/types/api';
import Shirt from '@/Components/images/shirtimg.png'
import HomeTeamShirt from '@/Components/images/hometeamshirt.png'
import AwayTeamShirt from '@/Components/images/awayteamshirt.png'
import MOMT from '@/Components/images/momt.png'
import DEFIMP from '@/Components/images/defimp.png'
import MENTALITY from '@/Components/images/metality.png'
import PlayerImg from '@/Components/images/playerimg.png'
import Image from 'next/image'
import MatchStatsPopupLoadingSkeleton from '@/Components/loading/MatchStatsPopupLoadingSkeleton';
import { getAvatarBackgroundColor, getAvatarInitials } from '@/lib/avatarInitials';

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
    initialLeagueId?: string;
    initialMatchId?: string;
    showAdminGoalsSection?: boolean;
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

type LeagueResponse = {
    leagues?: League[] | { joined?: League[]; managed?: League[] };
    data?: League[];
    success?: boolean;
    message?: string;
};

type MatchesResponse = {
    matches?: Partial<Match>[];
    data?: Partial<Match>[];
    leagueMatches?: Partial<Match>[];
    success?: boolean;
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

const isGuestLastName = (lastName?: string | null): boolean =>
    String(lastName ?? '').trim().toLowerCase() === 'guest';

const formatGuestAwarePlayerName = (
    player?: { firstName?: string | null; lastName?: string | null; isGuest?: boolean } | null
): string => {
    const first = String(player?.firstName ?? '').trim();
    const last = String(player?.lastName ?? '').trim();

    if (isGuestLastName(last)) {
        return first ? `${first} (Guest)` : '(Guest)';
    }

    const full = `${first} ${last}`.trim();
    if (!full) return player?.isGuest ? '(Guest)' : 'Player';
    return player?.isGuest ? `${full} (Guest)` : full;
};

const dropdownPaperBaseSx = {
    mt: 0,
    maxHeight: { xs: 240, sm: 320 },
    overflowY: 'auto',
    overscrollBehavior: 'contain',
};

const dropdownMenuBaseProps = {
    anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
    transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
    variant: 'menu' as const,
    marginThreshold: 0,
};

interface User {
    id: string;
    userId?: string;
    _id?: string;
    firstName: string;
    lastName: string;
    // shirtNumber?: string;
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
    isGuest?: boolean;
    guestId?: string;
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
    matchNumber?: number; // Match index from database
    // Optional fields that may come from API to help recover league
    leagueId?: string;
    leagueName?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Guest player representation coming from backend (via /leagues/:leagueId/matches/:matchId)
interface GuestPlayer {
    id: string; // guest record id (not necessarily a real user id)
    team: 'home' | 'away';
    firstName: string;
    lastName: string;
    // shirtNumber?: string;
}

// Extend Match type locally to optionally include guests array
interface MatchWithGuests extends Match {
    guests?: GuestPlayer[];
}

interface League {
    id: string;
    name: string;
    administrators: User[];
    administeredLeagues?: User[];
    adminId?: string;
    isAdmin?: boolean;
    active: boolean;
    archived?: boolean;
    createdAt?: string;
    updatedAt?: string;
    matches?: Match[];
}

interface MotmButtonProps {
    voted: boolean;
    onClick: () => void;
    disabled: boolean;
    sx?: SxProps<Theme>;
}

const MotmCoin = ({ voted, onClick, disabled, sx = {} }: MotmButtonProps) => (
    <Button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        variant={voted ? "contained" : "outlined"}
        size="small"
        sx={{
            minWidth: 'auto',
            px: 2,
            py: 0.5,
            fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' },
            fontWeight: 'bold',
            textTransform: 'none',
            backgroundColor: voted ? 'red' : 'transparent',
            color: voted ? 'white' : '#E5E7EB',
            borderColor: voted ? 'red' : 'rgba(255,255,255,0.3)',
            '&:hover': {
                backgroundColor: voted ? 'red' : 'rgba(255,255,255,0.1)',
                borderColor: voted ? 'red' : 'rgba(255,255,255,0.5)',
            },
            '&.Mui-disabled': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
                borderColor: 'rgba(255,255,255,0.2)',
            },
            ...sx
        }}
    >
        {voted ? 'Voted' : 'Vote'}
    </Button>
);

// Jersey avatar (shirt image with centered number)
const JerseyAvatar = ({
    // number,
    sx = {},
}: {
    // number?: string | number;
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
        {/* <Typography
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
        </Typography> */}
    </Box>
);

const VotedPlayerAvatar = ({
    player,
    borderColor = '#00C48C',
}: {
    player?: { firstName?: string | null; lastName?: string | null; profilePicture?: string | null } | null;
    borderColor?: string;
}) => {
    const fullName = formatGuestAwarePlayerName(player);
    const profilePicture = String(player?.profilePicture || '').trim();
    const initials = getAvatarInitials({
        name: fullName,
        firstName: player?.firstName ?? '',
        lastName: player?.lastName ?? '',
    });
    const bg = getAvatarBackgroundColor(fullName || initials);

    if (profilePicture) {
        return (
            <Box
                component="img"
                src={profilePicture}
                alt={fullName}
                sx={{
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    borderRadius: '50%',
                    border: `2px solid ${borderColor}`,
                    objectFit: 'cover',
                }}
            />
        );
    }

    return (
        <Box
            sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: '50%',
                border: `2px solid ${borderColor}`,
                backgroundColor: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: { xs: '0.72rem', md: '0.82rem' },
                letterSpacing: 0.4,
            }}
            aria-label={fullName || 'Player initials'}
            title={fullName || 'Player'}
        >
            {initials}
        </Box>
    );
};

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

const PlayMatchPagee: React.FC<EmbeddedControlProps> = (props) => {
    const { open, onClose, initialLeagueId, initialMatchId, showAdminGoalsSection = false } = props;
    const [league, setLeague] = useState<League | null>(null);
    const [match, setMatch] = useState<MatchWithGuests | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [homeGoals, setHomeGoals] = useState<number>(0);
    const [awayGoals, setAwayGoals] = useState<number>(0);
    // String inputs to allow clearing and prevent negative typing
    const [homeGoalsInput, setHomeGoalsInput] = useState<string>('0');
    const [awayGoalsInput, setAwayGoalsInput] = useState<string>('0');
    const [note, setNote] = useState<string>('');
    const [votedForId, setVotedForId] = useState<string | null>(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    // Inline stats panel toggle (replaces popup when clicking "Add Your Stats")
    const [showInlineStats, setShowInlineStats] = useState(false);
    // Auto-open inline stats when eligible and hide the old button
    // NOTE: Placed later in the file after dependent vars are defined (see below)
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
    const [matchCaptainPicks, setMatchCaptainPicks] = useState<{ home: CaptainPicks; away: CaptainPicks }>({
        home: {},
        away: {},
    });
    const [matchCategoryVoteCounts, setMatchCategoryVoteCounts] = useState<{
        defence: Record<string, number>;
        influence: Record<string, number>;
    }>({
        defence: {},
        influence: {},
    });
    const [isPickDialogOpen, setIsPickDialogOpen] = useState(false);
    const [pickCategory, setPickCategory] = useState<CaptainPickCategory | null>(null);
    const [savingPick, setSavingPick] = useState(false);
    // Capability flag â€“ assume API is available unless we get 404/405 from POST
    const [captainApiAvailable, setCaptainApiAvailable] = useState(true);
    // --- end captain picks state ---

    const { user, token } = useAuth();
    const currentAuthUser = user as { id?: string; userId?: string; _id?: string } | undefined;
    const currentUserId = String(currentAuthUser?.id || currentAuthUser?.userId || currentAuthUser?._id || '');
    const params = useParams();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const leagueId = params?.id ? String(params.id) : '';
    const matchId = params?.matchId ? String(params.matchId) : '';
    // Embedded-mode resolved ids (auto-picked latest)
    const [currentLeagueId, setCurrentLeagueId] = useState<string>('');
    const [currentMatchId, setCurrentMatchId] = useState<string>('');
    const resolvedLeagueId = currentLeagueId || leagueId;
    const resolvedMatchId = currentMatchId || matchId;
    const preferredAppliedRef = useRef<string | null>(null);
    // Prevent stale updates/races across parallel fetches
    const fetchNonceRef = useRef(0);

    // Unified, fast match fetcher: prefer league-scoped endpoint, keep legacy fallback.
    const getMatchesForLeague = useCallback(async (leagueIdForList: string): Promise<Partial<Match>[]> => {
        if (!token || !leagueIdForList) return [];

        const headers = { Authorization: `Bearer ${token}` } as const;
        const collect = (data: unknown): Partial<Match>[] => {
            if (!data || typeof data !== 'object') return [];
            const rec = data as Record<string, unknown>;
            let arr: unknown = rec.matches ?? rec.data ?? rec.leagueMatches ?? rec.match ?? [];
            if (Array.isArray(data) && (!Array.isArray(arr) || arr.length === 0)) arr = data;
            return Array.isArray(arr) ? (arr as Partial<Match>[]) : [];
        };

        let matches: Partial<Match>[] = [];
        let primaryFailed = false;

        try {
            const primaryRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(leagueIdForList)}/matches?all=1&includeArchived=1`,
                { headers, cache: 'no-store' }
            );
            if (primaryRes.ok) {
                const data = await primaryRes.json().catch(() => ({} as MatchesResponse));
                matches = collect(data);
            } else {
                primaryFailed = true;
            }
        } catch {
            primaryFailed = true;
        }

        // Legacy fallback for older deployments.
        if (matches.length === 0 && primaryFailed) {
            try {
                const fallbackRes = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/matches?leagueId=${encodeURIComponent(leagueIdForList)}`,
                    { headers, cache: 'no-store' }
                );
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json().catch(() => ({} as MatchesResponse));
                    matches = collect(data);
                }
            } catch {
                // no-op
            }
        }

        // Always filter by league id to be consistent
        const leagueIdStr = String(leagueIdForList);
        const filtered = (matches || []).filter((m) => {
            const ml = String((m as Partial<Match>)?.leagueId ?? '');
            const n1 = Number(ml);
            const n2 = Number(leagueIdStr);
            return ml === leagueIdStr || (Number.isFinite(n1) && Number.isFinite(n2) && n1 === n2) || ml === String(leagueIdStr);
        });

        // Sort latest first by start/date/createdAt/updatedAt, fallback to numeric id
        const toTime = (m: Partial<Match>): number => {
            const s = (m?.start || m?.date || m?.createdAt || m?.updatedAt) as string | undefined;
            if (s) {
                const t = new Date(s).getTime();
                if (!Number.isNaN(t)) return t;
            }
            const n = Number(m?.id);
            return Number.isFinite(n) ? n : 0;
        };
        return [...filtered].sort((a, b) => toTime(b) - toTime(a));
    }, [token]);

    // Unified dialog paper styling to match app theme
    const dialogPaperSx = {
        p: 0,
        bgcolor: '#d9d9d9',
        color: 'black',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)'
    } as const;
    const dialogTitleSx = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', bgcolor: 'transparent' } as const;
    const dialogContentSx = { color: '#E5E7EB', bgcolor: '#262626' } as const;

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
            const data = await res.json().catch(() => ({} as LeagueResponse));
            if (!res.ok || (data && data.success === false)) {
                throw new Error(data?.message || 'Failed to load leagues');
            }
            // Normalize various response shapes:
            // - { leagues: League[] }
            // - { leagues: { joined: League[], managed: League[] } }
            // - { data: League[] }
            let leaguesArr: League[] = [];
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
            const byId = new Map<string, League>();
            (Array.isArray(leaguesArr) ? leaguesArr : []).forEach((l: League) => {
                const id = String(l?.id ?? '');
                if (id && !byId.has(id)) byId.set(id, l);
            });
            const normalized: League[] = Array.from(byId.values()).map((l: League) => ({
                id: String(l.id),
                name: l.name,
                administrators: (l.administrators || []).map((u: User) => ({
                    id: String(u.id), firstName: u.firstName, lastName: u.lastName
                })),
                active: typeof l.active === 'boolean' ? l.active : true,
            }));
            // Filter to only INCOMPLETE leagues (like Home)
            try {
                const enriched = await Promise.all(
                    normalized.map(async (l) => {
                        try {
                            const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${l.id}`, { 
                                headers: { Authorization: `Bearer ${token}` } 
                            });
                            const detailsJson = await detailsRes.json().catch(() => ({} as Record<string, unknown>));
                            const leagueObj: Record<string, unknown> = (detailsJson?.league as Record<string, unknown>) || {};

                            const toNum = (v: unknown): number | undefined => {
                                const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
                                return Number.isFinite(n) ? (n as number) : undefined;
                            };
                            const getNum = (o: Record<string, unknown>, key: string): number | undefined => toNum(o?.[key]);
                            const getBool = (o: Record<string, unknown>, key: string): boolean => o?.[key] === true;
                            const getArray = (o: Record<string, unknown>, key: string): unknown[] => Array.isArray(o?.[key]) ? (o[key] as unknown[]) : [];

                            const maxGames = getNum(leagueObj, 'maxGames');
                            const matchesRaw = leagueObj?.['matches'];
                            const matches: Array<Record<string, unknown>> = Array.isArray(matchesRaw) ? (matchesRaw as Array<Record<string, unknown>>) : [];

                            let completed = false;
                            if (matches.length > 0 && typeof maxGames === 'number' && maxGames > 0) {
                                const completedCount = matches.reduce((acc, m) => {
                                    const mo = m as Record<string, unknown>;
                                    const statusVal = mo?.['status'];
                                    const status = typeof statusVal === 'string' ? statusVal.toLowerCase() : '';
                                    const endedByStatus = status === 'completed' || status === 'finished' || status === 'ended' || status === 'result_published';
                                    const activeVal = mo?.['active'];
                                    const endedByFlag = activeVal === false;
                                    const endedVal = mo?.['end'];
                                    const endedByEnd = Boolean(endedVal);
                                    return acc + (endedByStatus || endedByFlag || endedByEnd ? 1 : 0);
                                }, 0);
                                completed = completedCount >= maxGames;
                            }
                            const archivedByDetail = getBool(leagueObj, 'archived') || ((l as unknown as Record<string, unknown>)?.['archived'] === true);
                            if (archivedByDetail) {
                                completed = true;
                            } else if (l.active === false) {
                                completed = true;
                            }
                            // Try to enrich administrators from league details
                            const adminsPrimary = getArray(leagueObj, 'administrators');
                            const adminsAlt1 = adminsPrimary.length ? adminsPrimary : getArray(leagueObj, 'admins');
                            const adminsAlt2 = adminsAlt1.length ? adminsAlt1 : getArray(leagueObj, 'managers');
                            const adminsRaw: unknown[] = adminsAlt2;
                            const adminsNorm: User[] = adminsRaw.map((u) => {
                                const obj = (u || {}) as Record<string, unknown>;
                                const idVal = obj.id ?? obj['userId'] ?? obj['_id'];
                                const fnVal = obj['firstName'] ?? obj['first_name'] ?? obj['fname'] ?? '';
                                const lnVal = obj['lastName'] ?? obj['last_name'] ?? obj['lname'] ?? '';
                                return {
                                    id: String(idVal ?? ''),
                                    firstName: String(fnVal ?? ''),
                                    lastName: String(lnVal ?? ''),
                                } as User;
                            }).filter((a) => a.id);

                            const mergedLeague: League = {
                                ...l,
                                administrators: adminsNorm.length ? adminsNorm : l.administrators,
                            };

                            return { league: mergedLeague, completed };
                        } catch {
                            // If status/details fail, keep it visible (assume incomplete)
                            return { league: l, completed: false };
                        }
                    })
                );
                const visible = enriched
                    .filter(e => !e.completed && e.league.active !== false && e.league.archived !== true)
                    .map(e => e.league);
                const sortedVisible = [...visible].sort((a, b) => {
                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return String(a.id).localeCompare(String(b.id));
                });
                setAvailableLeagues(sortedVisible);
                if (sortedVisible.length === 0) {
                    toast.error('No incomplete leagues found for your account.');
                }
            } catch {
                // Fallback: show normalized list if enrichment fails
                const fallbackVisible = normalized.filter((l) => l.active !== false && l.archived !== true);
                const sortedNormalized = [...fallbackVisible].sort((a, b) => {
                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return String(a.id).localeCompare(String(b.id));
                });
                setAvailableLeagues(sortedNormalized);
                if (fallbackVisible.length === 0) {
                    toast.error('No leagues found for your account.');
                }
            }
        } catch (e: unknown) {
            setLeaguesError(e instanceof Error ? e.message : 'Failed to load leagues');
        } finally {
            setLeaguesLoading(false);
        }
    }, [availableLeagues.length, token]);

    const fetchSelectedLeagueMatches = useCallback(async () => {
        const leagueIdForList = (selectedLeagueIdForList || resolvedLeagueId || league?.id || '').trim();
        if (!leagueIdForList) {
            toast.error('Please select a league first.');
            return;
        }
        if (!token) return;

        console.log('ًں”چ Fetching matches for league:', leagueIdForList);
        setMatchesLoading(true);
        setMatchesError(null);

        const myNonce = ++fetchNonceRef.current;
        try {
            const sorted = await getMatchesForLeague(leagueIdForList);
            if (myNonce !== fetchNonceRef.current) return; // stale

            console.log('âœ… Fetched matches:', sorted.length);
            setSelectedLeagueMatches(sorted);
            setSelectedLeagueHasNoMatches(sorted.length === 0);

            if (sorted.length === 0) {
                toast('No matches found for this league yet.');
            }
        } catch (e: unknown) {
            if (myNonce !== fetchNonceRef.current) return;
            console.error('[MatchStats] fetchSelectedLeagueMatches error:', e);
            setMatchesError(e instanceof Error ? e.message : 'Failed to load matches');
        } finally {
            if (myNonce === fetchNonceRef.current) setMatchesLoading(false);
        }
    }, [selectedLeagueIdForList, resolvedLeagueId, league?.id, token, getMatchesForLeague]);

    // Open Matches Dialog and fetch
    const openMatchesDialog = useCallback(async () => {
        console.log('ًں”“ Opening matches dialog...', {
            selectedLeagueIdForList,
            resolvedLeagueId,
            leagueName: league?.name
        });

        // Ensure we have a league selected
        if (!selectedLeagueIdForList && !resolvedLeagueId && !league?.id) {
            toast.error('Please select a league first.');
            setLeagueSelectOpen(true);
            return;
        }

        // Sync league state if not already set
        if (!selectedLeagueIdForList && (resolvedLeagueId || league?.id)) {
            const leagueIdToUse = resolvedLeagueId || league?.id || '';
            setSelectedLeagueIdForList(leagueIdToUse);
            setSelectedLeagueNameForList(league?.name || selectedLeagueNameForList || '');
            console.log('ًں“‌ Synced league state:', { leagueIdToUse, leagueName: league?.name });
        }

        setMatchesDialogOpen(true);
        // Don't clear existing matches to avoid flicker; we'll overwrite after fetch
        setMatchesError(null);
        await fetchSelectedLeagueMatches();
    }, [resolvedLeagueId, selectedLeagueIdForList, league?.id, league?.name, fetchSelectedLeagueMatches, selectedLeagueNameForList]);

    const fetchLeagueAndMatchDetails = useCallback(async (silent: boolean = false, attempt: number = 0) => {
        try {
            if (!silent) setLoading(true);
            if (!resolvedLeagueId || !resolvedMatchId) {
                console.warn('MatchStatsDialog: missing ids, skipping details fetch', { resolvedLeagueId, resolvedMatchId });
                if (!silent) setLoading(false);
                return;
            }

            // ًں”„ Add cache busting to ensure fresh data
            const cacheBuster = `?_t=${Date.now()}`;
            console.log('ًں”„ Fetching match details with cache busting...', { resolvedLeagueId, resolvedMatchId });

            // 1) Try to get the match (first with league-bound endpoint, then fallback to /matches/:id)
            let matchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${resolvedLeagueId}/matches/${resolvedMatchId}${cacheBuster}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (matchResp.status === 404) {
                matchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}${cacheBuster}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            const raw = await matchResp.json().catch(() => ({} as { match?: Partial<MatchWithGuests>; data?: Partial<MatchWithGuests> | { match?: Partial<MatchWithGuests> }; id?: string; success?: boolean; message?: string }));
            // Tolerant response handling across shapes
            // Accept: { success, match }, { match }, direct match object, or { data: match }
            let matchObj: Partial<MatchWithGuests> | null = null;
            if (raw && typeof raw === 'object') {
                if (raw.match) matchObj = raw.match;
                else if (raw.data && typeof raw.data === 'object') {
                    if ('id' in raw.data || 'match' in raw.data) {
                        matchObj = 'match' in raw.data ? raw.data.match : raw.data as Partial<MatchWithGuests>;
                    }
                }
                else if (raw.id) matchObj = raw as Partial<MatchWithGuests>;
            }
            if (!matchResp.ok || !matchObj) {
                console.warn('MatchStatsDialog: match fetch failed, attempting league matches fallback', { status: matchResp.status, raw, attempt });
                if (attempt < 1) {
                    // Fallback: fetch matches list for league and pick latest
                    const sorted = await getMatchesForLeague(resolvedLeagueId);
                    const chosen = sorted[0] || null;
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

            // ًںژ¯ Update goals from fetched match data
            const hg = typeof m.homeTeamGoals === 'number' ? m.homeTeamGoals : 0;
            const ag = typeof m.awayTeamGoals === 'number' ? m.awayTeamGoals : 0;
            console.log('âœ… Match goals fetched:', { homeTeamGoals: hg, awayTeamGoals: ag });
            setHomeGoals(hg);
            setAwayGoals(ag);
            setHomeGoalsInput(String(hg));
            setAwayGoalsInput(String(ag));

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
                // Keep header/toolbar league in sync with the match's league
                setCurrentLeagueId(String(effectiveLeagueId));
                setSelectedLeagueIdForList(String(effectiveLeagueId));
                setSelectedLeagueNameForList(String(leagueData.league.name || 'League'));
            } else {
                console.warn('League not found, using fallback league object');
                const fallbackLeague: League = {
                    id: String(effectiveLeagueId || 'unknown'),
                    name: String(m.leagueName || 'League'),
                    administrators: [] as User[],
                    active: true,
                };
                setLeague(fallbackLeague);
                // Still sync ids/label so UI reflects the match's league
                setCurrentLeagueId(String(effectiveLeagueId));
                setSelectedLeagueIdForList(String(effectiveLeagueId));
                setSelectedLeagueNameForList(String(fallbackLeague.name));
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [resolvedLeagueId, resolvedMatchId, token, getMatchesForLeague]);

    useEffect(() => {
        if (resolvedLeagueId && resolvedMatchId && token) {
            console.log('MatchStatsDialog: fetching details for', { resolvedLeagueId, resolvedMatchId });
            fetchLeagueAndMatchDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedLeagueId, resolvedMatchId, token]);

    // Update goals when match changes (ensures admin dialog always shows current match goals)
    useEffect(() => {
        if (match) {
            const hg = typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0;
            const ag = typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0;
            console.log('ًں”„ Updating goals from match state:', { homeTeamGoals: hg, awayTeamGoals: ag });
            setHomeGoals(hg);
            setAwayGoals(ag);
            setHomeGoalsInput(String(hg));
            setAwayGoalsInput(String(ag));
            if (match.notes) {
                setNote(match.notes);
            }
        }
    }, [match]);

    // (Removed duplicate useEffect for admin dialog open. Goals are now always set from match change.)

    // When opened as a dialog with explicit ids, use them and skip preferred auto-select
    useEffect(() => {
        const run = async () => {
            if (typeof open !== 'boolean' || !open) return;
            if (!initialLeagueId && !initialMatchId) return;
            // Mark as applied with a special marker to prevent preferred flow overriding this selection
            preferredAppliedRef.current = '__explicit__';
            if (initialLeagueId) setCurrentLeagueId(String(initialLeagueId));
            if (initialMatchId) setCurrentMatchId(String(initialMatchId));
            if (token && (initialLeagueId || initialMatchId)) {
                await fetchLeagueAndMatchDetails(true);
            }
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialLeagueId, initialMatchId, token]);

    // Keep the toolbar match label and league label in sync with the currently loaded match/league
    useEffect(() => {
        if (match && match.id) {
            // minimal shape for the button label
            setSelectedMatchForList(prev => {
                const prevId = prev?.id ? String(prev.id) : null;
                if (prevId === String(match.id)) return prev;
                return {
                    id: match.id,
                    homeTeamName: match.homeTeamName,
                    awayTeamName: match.awayTeamName,
                    leagueId: match.leagueId,
                } as Partial<Match>;
            });
            setSelectedLeagueHasNoMatches(false);
            // also reflect league id/name in the toolbar/header for consistency
            if (league?.id) {
                setSelectedLeagueIdForList(String(league.id));
            }
            if (league?.name) {
                setSelectedLeagueNameForList(String(league.name));
            } else if (match?.leagueName) {
                setSelectedLeagueNameForList(String(match.leagueName));
            }
        }
    }, [match, league?.name, league?.id]);

    // Auto-select from preferredLeagueId stored in localStorage: pick latest match in that league
    useEffect(() => {
        const applyPreferredLeague = async () => {
            try {
                if (!token) {
                    setLoading(false);
                    return;
                }
                if (typeof window === 'undefined') {
                    setLoading(false);
                    return;
                }
                const stored = localStorage.getItem('preferredLeagueId');
                if (!stored) {
                    setLoading(false);
                    return;
                }
                const preferredId = String(stored);

                // If route already provides both ids for same league with a match, no need to override
                if (resolvedLeagueId === preferredId && resolvedMatchId) {
                    console.log('[MatchStats] Preferred league already resolved with match, skipping');
                    setLoading(false);
                    return;
                }

                // Skip if we've already successfully applied this preference (league + match loaded)
                // Only skip if we have both league and match resolved
                if (preferredAppliedRef.current === preferredId && resolvedLeagueId === preferredId && resolvedMatchId) {
                    console.log('[MatchStats] Preferred league already applied with match, skipping:', preferredId);
                    setLoading(false);
                    return;
                }

                // If we tried before but got no matches, allow retry (maybe matches were added)
                // But only retry once per dialog open to avoid infinite loops
                if (preferredAppliedRef.current === preferredId && resolvedLeagueId === preferredId && !resolvedMatchId) {
                    console.log('[MatchStats] Preferred league applied before but no match found, will retry...');
                    // Continue to fetch matches below
                }

                console.log('[MatchStats] Loading league from localStorage:', preferredId);
                // Don't set ref yet - wait until we successfully load matches
                setLoading(true);

                // FIRST: Fetch all available leagues to verify preferred league exists and get complete league object
                let leaguesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (leaguesRes.status === 404 || leaguesRes.status === 405) {
                    leaguesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/all`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (leaguesRes.status === 404 || leaguesRes.status === 405) {
                        leaguesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/leagues`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }
                }
                const leaguesData = await leaguesRes.json().catch(() => ({} as LeagueResponse));
                let leaguesArr: League[] = [];
                if (Array.isArray(leaguesData?.leagues)) {
                    leaguesArr = leaguesData.leagues;
                } else if (leaguesData?.leagues && typeof leaguesData.leagues === 'object') {
                    const joined = Array.isArray(leaguesData.leagues.joined) ? leaguesData.leagues.joined : [];
                    const managed = Array.isArray(leaguesData.leagues.managed) ? leaguesData.leagues.managed : [];
                    leaguesArr = [...joined, ...managed];
                } else if (Array.isArray(leaguesData?.data)) {
                    leaguesArr = leaguesData.data;
                }
                // De-duplicate by id
                const byId = new Map<string, League>();
                (Array.isArray(leaguesArr) ? leaguesArr : []).forEach((l: League) => {
                    const id = String(l?.id ?? '');
                    if (id && !byId.has(id)) byId.set(id, l);
                });
                const allLeagues = Array.from(byId.values());

                // Find the preferred league in the available leagues
                const preferredLeague = allLeagues.find(l => String(l.id) === preferredId);
                if (!preferredLeague) {
                    console.warn('[MatchStats] Preferred league not found in available leagues:', preferredId);
                    setLoading(false);
                    return;
                }

                // Use the league object from available leagues (more reliable than individual fetch)
                const normalizedLeague: League = {
                    id: String(preferredLeague.id),
                    name: preferredLeague.name,
                    administrators: (preferredLeague.administrators || []).map((u: User) => ({
                        id: String(u.id),
                        firstName: u.firstName,
                        lastName: u.lastName
                    })),
                    active: typeof preferredLeague.active === 'boolean' ? preferredLeague.active : true,
                };
                setLeague(normalizedLeague);
                setSelectedLeagueIdForList(preferredId);
                setSelectedLeagueNameForList(preferredLeague.name);

                console.log('[MatchStats] Setting up preferred league and will fetch matches:', preferredId);
                const sorted = await getMatchesForLeague(preferredId);
                setSelectedLeagueMatches(sorted);

                const latest = sorted[0] || null;
                setCurrentLeagueId(preferredId);
                if (latest && latest.id) {
                    preferredAppliedRef.current = preferredId;
                    setSelectedMatchForList(latest || null);
                    setSelectedLeagueHasNoMatches(false);
                    setCurrentMatchId(String(latest.id));
                    await fetchLeagueAndMatchDetails(true);
                    setLoading(false);
                    return;
                }

                console.warn('[MatchStats] Preferred league has no matches:', {
                    preferredId,
                    totalMatchesFetched: sorted.length
                });
                setSelectedMatchForList(null);
                setSelectedLeagueHasNoMatches(true);
                setCurrentMatchId('');
                setLoading(false);
            } catch (e) {
                console.warn('Preferred league auto-select failed', e);
                setLoading(false);
            }
        };
        // If dialog was opened with explicit ids, skip preferred flow
        if (typeof open === 'boolean' && open && (initialLeagueId || initialMatchId)) return;

        // Always check when dialog opens or token becomes available
        if (typeof open === 'boolean' && !open) return; // Don't run when dialog is closed

        applyPreferredLeague();
        // We intentionally run when token or open state changes; internal ref with league ID prevents duplicate fetches
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, resolvedLeagueId, resolvedMatchId, open, initialLeagueId, initialMatchId, getMatchesForLeague, fetchLeagueAndMatchDetails]);

    // Reset ref when dialog closes so next open gets fresh data
    useEffect(() => {
        if (typeof open === 'boolean' && !open) {
            // Dialog is closed, reset the ref so next time it opens fresh
            preferredAppliedRef.current = null;
        }
    }, [open]);

    // Define after fetchLeagueAndMatchDetails so we can safely call it
    const handleSelectLeague = useCallback((l: League) => {
        const leagueId = String(l.id);
        const leagueName = l.name;

        // Normalize league object to ensure it has all required fields
        const normalizedLeague: League = {
            id: leagueId,
            name: leagueName,
            administrators: (l.administrators || []).map((u: User) => ({
                id: String(u.id),
                firstName: u.firstName,
                lastName: u.lastName
            })),
            active: typeof l.active === 'boolean' ? l.active : true,
        };

        // Set league state immediately for UI consistency
        setLeague(normalizedLeague);
        setSelectedLeagueIdForList(leagueId);
        setSelectedLeagueNameForList(leagueName);
        setLeagueSelectOpen(false);

        // Persist as preferred league for future auto-selection
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('preferredLeagueId', leagueId);
                // Update ref immediately so if user reopens dialog, it uses this league
                preferredAppliedRef.current = leagueId;
                console.log('[MatchStats] Manually selected league:', leagueId);
            } catch { /* ignore quota errors */ }
        }

        // reset UI state
        setSelectedLeagueMatches([]);
        setMatchesError(null);
        setSelectedMatchForList(null);
        setSelectedLeagueHasNoMatches(false);

        // Auto-fetch and auto-select latest match for this league (UI + update main content)
        (async () => {
            try {
                setAutoSelectMatchLoading(true);
                if (!token) {
                    console.warn('[MatchStats] No token available for fetching matches');
                    return;
                }

                console.log('[MatchStats] Fetching matches for league:', leagueId);
                const sorted = await getMatchesForLeague(leagueId);
                setSelectedLeagueMatches(sorted);

                if (!sorted.length) {
                    console.warn('[MatchStats] No matches found for league:', leagueId);
                    setSelectedLeagueHasNoMatches(true);
                    setSelectedMatchForList(null);
                    // Set current league id but no match
                    setCurrentLeagueId(leagueId);
                    setCurrentMatchId('');
                    return;
                }

                const latest = sorted[0] || null;

                console.log('[MatchStats] Latest match selected:', latest?.id, latest?.homeTeamName, 'vs', latest?.awayTeamName);

                setSelectedMatchForList(latest || null);
                setSelectedLeagueHasNoMatches(false);

                // Also update the below content by setting current ids and refetching
                if (latest && latest.id) {
                    setCurrentLeagueId(leagueId);
                    setCurrentMatchId(String(latest.id));
                    await fetchLeagueAndMatchDetails(true);
                } else {
                    // Set league id even if no match found
                    setCurrentLeagueId(leagueId);
                    setCurrentMatchId('');
                }
            } catch (e) {
                console.error('[MatchStats] Error loading matches for selected league:', e);
                // On error, keep UI safe and indicate no match
                setSelectedLeagueHasNoMatches(true);
                setSelectedMatchForList(null);
                setCurrentLeagueId(leagueId);
                setCurrentMatchId('');
            } finally {
                setAutoSelectMatchLoading(false);
            }
        })();
    }, [token, fetchLeagueAndMatchDetails, getMatchesForLeague]);

    // Embedded mode: when opened from Navbar (no route ids), auto-select latest league and latest match
    useEffect(() => {
        const run = async () => {
            // Only in embedded mode
            if (typeof open !== 'boolean') return;
            if (!open) return;
            // NEW: if caller provided explicit league/match, do NOT auto-select anything
            if (initialLeagueId || initialMatchId) return;
            // If route provided ids or we already resolved, nothing to do
            if ((leagueId && matchId) || (resolvedLeagueId && resolvedMatchId)) {
                console.log('MatchStatsDialog: ids already present', { leagueId, matchId, resolvedLeagueId, resolvedMatchId });
                return;
            }
            // Skip if preferred league was already applied (preferred league useEffect handles it)
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('preferredLeagueId');
                if (stored && preferredAppliedRef.current === stored) {
                    console.log('MatchStatsDialog: preferred league already applied, skipping embedded auto-select');
                    return;
                }
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
                const data = await res.json().catch(() => ({} as LeagueResponse));
                let leaguesArr: League[] = [];
                if (Array.isArray(data?.leagues)) leaguesArr = data.leagues;
                else if (data?.leagues && typeof data.leagues === 'object') {
                    const joined = Array.isArray(data.leagues.joined) ? data.leagues.joined : [];
                    const managed = Array.isArray(data.leagues.managed) ? data.leagues.managed : [];
                    leaguesArr = [...joined, ...managed];
                } else if (Array.isArray(data?.data)) leaguesArr = data.data;
                const byId = new Map<string, League>();
                (Array.isArray(leaguesArr) ? leaguesArr : []).forEach((l: League) => { const id = String(l?.id ?? ''); if (id && !byId.has(id)) byId.set(id, l); });
                const allLeagues = Array.from(byId.values());
                console.log('MatchStatsDialog: fetched leagues', { count: allLeagues.length });
                if (!allLeagues.length) { setLoading(false); return; }

                // Check for preferred league first, otherwise pick latest
                let chosenLeague: League | null = null;
                if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem('preferredLeagueId');
                    if (stored) {
                        const preferred = allLeagues.find(l => String(l.id) === stored);
                        if (preferred) {
                            chosenLeague = preferred;
                            // Mark as applied to prevent preferred league useEffect from also running
                            preferredAppliedRef.current = stored;
                            console.log('MatchStatsDialog: using preferred league from localStorage');
                        }
                    }
                }
                // If no preferred league or preferred not found, pick latest
                if (!chosenLeague) {
                    const withDates = allLeagues.map(l => ({ l, ts: Date.parse((l.updatedAt || l.createdAt) as string || '') || 0, idNum: Number(l.id) || 0 }));
                    withDates.sort((a, b) => b.ts - a.ts || b.idNum - a.idNum);
                    chosenLeague = withDates[0]?.l || allLeagues[0];
                }
                const chosenLeagueId = String(chosenLeague.id);
                console.log('MatchStatsDialog: chosen league', { chosenLeagueId });

                // Set league state from chosen league
                const normalizedLeague: League = {
                    id: chosenLeagueId,
                    name: chosenLeague.name,
                    administrators: (chosenLeague.administrators || []).map((u: User) => ({
                        id: String(u.id),
                        firstName: u.firstName,
                        lastName: u.lastName
                    })),
                    active: typeof chosenLeague.active === 'boolean' ? chosenLeague.active : true,
                };
                setLeague(normalizedLeague);
                setSelectedLeagueIdForList(chosenLeagueId);
                setSelectedLeagueNameForList(chosenLeague.name);

                console.log('[MatchStats] Embedded mode: fetching matches for league:', chosenLeagueId);
                const sorted = await getMatchesForLeague(chosenLeagueId);
                setSelectedLeagueMatches(sorted);
                const chosenMatch = sorted[0] || null;
                if (!chosenMatch) {
                    console.log('MatchStatsDialog: no matches for chosen league');
                    setSelectedMatchForList(null);
                    setSelectedLeagueHasNoMatches(true);
                    setCurrentLeagueId(chosenLeagueId);
                    setCurrentMatchId('');
                    setLoading(false);
                    return;
                }
                const chosenMatchId = String(chosenMatch.id);
                console.log('MatchStatsDialog: chosen match', { chosenMatchId });
                setSelectedMatchForList(chosenMatch || null);
                setSelectedLeagueHasNoMatches(false);
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
    }, [open, token, leagueId, matchId, resolvedLeagueId, resolvedMatchId, fetchLeagueAndMatchDetails, initialLeagueId, initialMatchId, getMatchesForLeague]);

    // CHANGED: do not toggle global loading; refetch silently and show local spinner on button
    const handleSaveDetails = async () => {
        if (!token || !resolvedMatchId) {
            toast.error('Match ID is missing. Please select a match first.');
            return;
        }
        if (!match) {
            toast.error('Match details are still loading. Please try again.');
            return;
        }

        const registeredPlayers = new Set<string>([
            ...(match.homeTeamUsers ?? []).map((p) => String(p.id)),
            ...(match.awayTeamUsers ?? []).map((p) => String(p.id)),
        ]).size;
        const totalPlayers = registeredPlayers + (match.guests?.length ?? 0);
        if (registeredPlayers < 6) {
            toast.error('A minimum of 6 registered players is required to choose teams');
            return;
        }
        if (totalPlayers < 8) {
            toast.error('A minimum of 8 total players (including at least 6 registered league players) is required before uploading match scores.');
            return;
        }

        try {
            setSavingMatchDetails(true);

            // Update match goals
            const goalsRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/goals`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ homeTeamGoals: homeGoals, awayTeamGoals: awayGoals }),
                }
            );

            if (!goalsRes.ok) {
                const errorData = await goalsRes.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update goals');
            }

            // Update match note if provided
            if (note && note.trim()) {
                const noteRes = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/note`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ note }),
                    }
                );

                if (!noteRes.ok) {
                    const errorData = await noteRes.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to update note');
                }
            }

            toast.success('Match details saved successfully!');

            // Trigger notification refresh for captains to see the confirmation request
            console.log('ًں”” Triggering notification refresh event');
            window.dispatchEvent(new Event('refresh-notifications'));

            // ï؟½ï¸ڈ Clear cache FIRST to ensure fresh data on next fetch
            console.log('ï؟½ï¸ڈ Clearing cache for fresh data...');
            const STORAGE_PREFIX = 'cf_cache_';
            Object.keys(localStorage).forEach(key => {
                if (
                    (key.startsWith(STORAGE_PREFIX) && (key.includes('league') || key.includes('match'))) ||
                    key.includes('cf_instant') ||
                    key.startsWith('chunk_')
                ) {
                    localStorage.removeItem(key);
                }
            });

            // ًں“¢ Dispatch event IMMEDIATELY to trigger parent refresh
            console.log('ًں“¢ Dispatching match-updated event for match:', resolvedMatchId);
            window.dispatchEvent(new CustomEvent('match-updated', {
                detail: { matchId: resolvedMatchId }
            }));

            // âڈ±ï¸ڈ Small delay to let parent component start fetching
            await new Promise(resolve => setTimeout(resolve, 100));

            // ًں”„ Refetch local match details
            console.log('ًں”„ Refetching local match details...');
            await fetchLeagueAndMatchDetails(true);

            console.log('âœ… Match details saved, cache cleared, events dispatched');

            // âڈ±ï¸ڈ Another small delay before closing dialog
            await new Promise(resolve => setTimeout(resolve, 200));

            // Close the admin dialog after successful save
            if (onClose) {
                console.log('ًںڑھ Closing dialog after successful save');
                onClose();
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save match details';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setSavingMatchDetails(false);
        }
    };

    // Fetch votes and set votedForId ONLY from backend
    const fetchVotes = useCallback(async () => {
        if (!token || !resolvedMatchId) return;
        console.log('ًں”چ Fetching votes for match:', resolvedMatchId);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/votes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('ًں“، Votes API Response Status:', response.status);

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, use default values
                console.warn('âڑ ï¸ڈ Votes endpoint not found (404/405)');
                setPlayerVotes({});
                setVotedForId(null);
                return;
            }

            const data = await response.json();
            console.log('ًں“¥ Votes API Response Data:', data);
            if (data.success) {
                console.log('âœ… Setting playerVotes:', data.votes);
                console.log('âœ… Setting votedForId:', data.userVote);
                setPlayerVotes(data.votes || {});
                setVotedForId(data.userVote || null); // <-- Always set from backend only!
            } else {
                console.warn('âڑ ï¸ڈ API returned success: false');
            }
        } catch (error) {
            console.error('â‌Œ Failed to fetch votes:', error);
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
    const playerOnHomeTeamSafe = !!(match && currentUserId && (match.homeTeamUsers ?? []).some(p => String(p.id) === currentUserId));
    const playerOnAwayTeamSafe = !!(match && currentUserId && (match.awayTeamUsers ?? []).some(p => String(p.id) === currentUserId));
    const isUserAssignedToTeam = playerOnHomeTeamSafe || playerOnAwayTeamSafe;
    const teamGoalsSafe = (match && currentUserId)
        ? (playerOnHomeTeamSafe ? (match.homeTeamGoals || 0) : (playerOnAwayTeamSafe ? (match.awayTeamGoals || 0) : 0))
        : 0;

    // Compute Impact % to match backend/client-shared contribution formula.
    const computeImpactPercent = useCallback(
        (s: { goals: number; assists: number; cleanSheets: number; defence: number }, tGoals: number) => {
            const safeGoals = Math.max(0, Number(s.goals) || 0);
            const safeAssists = Math.max(0, Number(s.assists) || 0);
            const safeCleanSheets = Math.max(0, Number(s.cleanSheets) || 0);
            const safeDefence = Math.max(0, Number(s.defence) || 0);
            const teamGoals = Math.max(0, Number(tGoals) || 0);

            const goalContribution = teamGoals > 0 ? (safeGoals / teamGoals) * 100 : 0;
            const assistContribution = teamGoals > 0 ? (safeAssists / teamGoals) * 50 : 0;
            const cleanSheetContribution = safeCleanSheets > 0 ? 15 * safeCleanSheets : 0;
            const defensiveContribution = safeDefence * 10;
            const raw = goalContribution + assistContribution + cleanSheetContribution + defensiveContribution;

            // Participation default when no contribution action exists.
            if (raw <= 0) return 15;
            return Math.max(0, Math.min(100, Math.round(raw)));
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
        const selectedId = String(selectedPlayerForAdmin.id || '');
        const normalizedSelectedId = selectedId.startsWith('guest-') ? selectedId.slice(6) : selectedId;
        const isHome = (match.homeTeamUsers ?? []).some(p => String(p.id) === selectedId);
        const isAway = (match.awayTeamUsers ?? []).some(p => String(p.id) === selectedId);
        const guestTeam = (match.guests || []).find(g => String(g.id) === normalizedSelectedId)?.team;
        if (isHome) return match.homeTeamGoals || 0;
        if (isAway) return match.awayTeamGoals || 0;
        if (guestTeam === 'home') return match.homeTeamGoals || 0;
        if (guestTeam === 'away') return match.awayTeamGoals || 0;
        return teamGoalsSafe;
    }, [selectedPlayerForAdmin, match, teamGoalsSafe]);

    const computedAdminImpact = useMemo(
        () => computeImpactPercent(
            { goals: adminStats.goals, assists: adminStats.assists, cleanSheets: adminStats.cleanSheets, defence: adminStats.defence },
            adminSelectedTeamGoals
        ),
        [adminStats.goals, adminStats.assists, adminStats.cleanSheets, adminStats.defence, adminSelectedTeamGoals, computeImpactPercent]
    );

    // Helper function to extract numeric match index from various field names
    const getNumericIndex = (m: Match | null | undefined): number | undefined => {
        if (!m) return undefined;
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

    // Compute match number - prefer backend value, fallback to position in league matches
    const computedMatchNumber = React.useMemo(() => {
        const backendNumber = getNumericIndex(match);
        if (backendNumber !== undefined) return backendNumber;
        
        // Fallback: calculate from league matches array position
        if (league?.matches && match?.id) {
            const allMatches = Array.isArray(league.matches) ? league.matches : [];
            const matchIndex = allMatches.findIndex((m: Match) => String(m?.id) === String(match.id));
            if (matchIndex >= 0) {
                return matchIndex + 1; // 1-based index
            }
        }
        
        return undefined;
    }, [match, league?.matches]);

    // Prevent self-vote in UI too
    const handleVote = async (playerId: string) => {
        if (!user) return;
        if (!isUserAssignedToTeam) {
            toast.error('You must be assigned to a team to vote for Man of the Match.');
            return;
        }
        if (String(playerId) === String(currentUserId)) {
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
                
                // ًں†• Trigger notification refresh for all players
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('refresh-notifications'));
                    console.log('ًں”” Vote successful - notification refresh triggered');
                }
            }
        } catch {
            setError('An error occurred while voting.');
        } finally {
            await fetchVotes();
            setLoadingVote(false);
        }
    };

    const handleCloseStatsModal = () => setIsStatsModalOpen(false);

    const closeParentDialogAfterSave = useCallback(() => {
        if (typeof open === 'boolean' && onClose) {
            onClose();
        }
    }, [open, onClose]);

    const parseJsonSafely = useCallback(async (response: Response): Promise<Record<string, unknown> | null> => {
        try {
            const parsed = await response.json();
            if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
            return null;
        } catch {
            return null;
        }
    }, []);

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
        
        const errors: string[] = [];
        let statsSuccess = false;
        let voteSuccess = false;
        let captainPicksSuccess = false;

        try {
            // 1. Save Stats
            const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/stats`, {
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

            const statsData = await parseJsonSafely(statsResponse);
            if (statsResponse.status === 404 || statsResponse.status === 405) {
                errors.push('Stats API not available');
            } else {
                const statsApiSuccess = statsData?.success;
                if (statsResponse.ok && statsApiSuccess !== false) {
                    statsSuccess = true;
                    const updatedStats = statsData?.updatedStats;
                    if (updatedStats && typeof updatedStats === 'object') {
                        Object.entries(updatedStats).forEach(([metric, value]) => {
                            if (typeof value === 'number') {
                                const playerId = String(statsData?.playerId ?? currentUserId);
                                cacheManager.updateLeaderboardCache(playerId, value, metric as keyof LeaderboardPlayer);
                            }
                        });
                    }
                    clearCacheByResource('stats', `${resolvedMatchId}_${currentUserId}`);
                } else {
                    const message = typeof statsData?.message === 'string' && statsData.message
                        ? statsData.message
                        : 'Failed to save stats';
                    errors.push(message);
                }
            }

            // 2. Save MOTM Vote (if user has voted)
            if (votedForId && String(votedForId) !== String(currentUserId)) {
                try {
                    const voteResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/votes`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ votedForId }),
                    });
                    const voteData = await parseJsonSafely(voteResponse);
                    const voteApiSuccess = voteData?.success;
                    if (voteResponse.ok && voteApiSuccess !== false) {
                        voteSuccess = true;
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('refresh-notifications'));
                        }
                    } else {
                        errors.push(
                            typeof voteData?.message === 'string' && voteData.message
                                ? voteData.message
                                : 'Failed to save MOTM vote'
                        );
                    }
                } catch {
                    errors.push('Failed to save MOTM vote');
                }
            } else {
                voteSuccess = true; // No vote to save
            }

            // 3. Save Defensive Impact / Mentality picks
            if (captainApiAvailable && (captainPicks.defence || captainPicks.influence)) {
                try {
                    captainPicksSuccess = true;
                    // Save Defensive Impact pick
                    if (captainPicks.defence) {
                        const defResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/captain-picks`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category: 'defence', playerId: captainPicks.defence }),
                        });
                        if (defResponse.status === 404 || defResponse.status === 405) {
                            setCaptainApiAvailable(false);
                        } else if (!defResponse.ok) {
                            const defData = await parseJsonSafely(defResponse);
                            errors.push(
                                typeof defData?.message === 'string' && defData.message
                                    ? defData.message
                                    : 'Failed to save Defensive Impact pick'
                            );
                            captainPicksSuccess = false;
                        }
                    }

                    // Save Mentality pick
                    if (captainPicks.influence) {
                        const menResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/captain-picks`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category: 'influence', playerId: captainPicks.influence }),
                        });
                        if (menResponse.status === 404 || menResponse.status === 405) {
                            setCaptainApiAvailable(false);
                        } else if (!menResponse.ok) {
                            const menData = await parseJsonSafely(menResponse);
                            errors.push(
                                typeof menData?.message === 'string' && menData.message
                                    ? menData.message
                                    : 'Failed to save + Mentality pick'
                            );
                            captainPicksSuccess = false;
                        }
                    }
                } catch {
                    captainPicksSuccess = false;
                    errors.push('Failed to save captain picks');
                }
            } else {
                captainPicksSuccess = true; // No picks selected or API unavailable
            }

            // Show result
            if (statsSuccess) {
                const successParts = ['Stats saved'];
                if (votedForId && voteSuccess) successParts.push('Vote saved');
                if (captainPicksSuccess && (captainPicks.defence || captainPicks.influence)) {
                    successParts.push('Captain picks saved');
                }
                toast.success(successParts.join(', ') + '!');
                setIsStatsModalOpen(false);
                setShowInlineStats(false);
                await fetchLeagueAndMatchDetails(true);
                closeParentDialogAfterSave();
            } else if (errors.length > 0) {
                toast.error(errors.join('. '));
            } else {
                toast.error('Unable to save stats. Please try again.');
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingStats(false);
        }
    };

    // Admin Stats Functions
    // Modal can be opened by anyone (no admin check) - accessible to all users
    const handleOpenAdminStatsModal = async (player: User) => {
        // No admin check - modal is open for everyone
        setSelectedPlayerForAdmin(player);

        try {
            // Fetch existing stats for the selected player with cache busting
            const cacheBuster = `&_t=${Date.now()}`;
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/stats?playerId=${player.id}${cacheBuster}`, {
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


    const baseCanSubmit =
        match?.status === 'RESULT_UPLOADED' ||
        match?.status === 'RESULT_PUBLISHED' ||
        match?.status === 'REVISION_REQUESTED';
    const isAdmin = useMemo(() => {
        if (!currentUserId || !league) return false;
        const uid = currentUserId;
        if (league.isAdmin === true) return true;
        if (league.adminId && String(league.adminId) === uid) return true;
        const admins = Array.isArray(league.administrators) ? league.administrators : [];
        const administered = Array.isArray(league.administeredLeagues) ? league.administeredLeagues : [];
        return [...admins, ...administered].some((a) => String(a?.id) === uid);
    }, [league, currentUserId]);

    // NEW: captain role flags
    const isHomeCaptain = !!(currentUserId && match && currentUserId === String(match.homeCaptainId || ''));
    const isAwayCaptain = !!(currentUserId && match && currentUserId === String(match.awayCaptainId || ''));
    const userPickTeamKey: 'home' | 'away' | null = playerOnHomeTeamSafe ? 'home' : (playerOnAwayTeamSafe ? 'away' : null);

    // Helper to check if user can edit stats for a player
    // League admin can edit all players, captains can only edit their team's players
    // isHomeTeam: true if checking a home team player, false if checking an away team player
    const canEditPlayerStats = useCallback((isHomeTeam: boolean): boolean => {
        if (!user || !match) return false;
        // League admin can edit all players (both home and away teams)
        if (isAdmin) return true;
        // Home captain can only edit home team players
        if (isHomeTeam && isHomeCaptain) return true;
        // Away captain can only edit away team players
        if (!isHomeTeam && isAwayCaptain) return true;
        return false;
    }, [user, match, isAdmin, isHomeCaptain, isAwayCaptain]);

    const captainPickCandidates: (User & { isGuest?: boolean })[] = useMemo(() => {
        if (!match) return [];

        const guestUsersHome: (User & { isGuest: true })[] = (match.guests || [])
            .filter(g => g.team === 'home')
            .map(g => ({
                id: `guest-${g.id}`,
                guestId: g.id,
                firstName: g.firstName,
                lastName: g.lastName,
                isGuest: true
            } as User & { isGuest: true }));

        const guestUsersAway: (User & { isGuest: true })[] = (match.guests || [])
            .filter(g => g.team === 'away')
            .map(g => ({
                id: `guest-${g.id}`,
                guestId: g.id,
                firstName: g.firstName,
                lastName: g.lastName,
                isGuest: true
            } as User & { isGuest: true }));

        return [
            ...(match.homeTeamUsers ?? []),
            ...guestUsersHome,
            ...(match.awayTeamUsers ?? []),
            ...guestUsersAway
        ];
    }, [match]);

    const playerNameById = useCallback((id?: string | null) => {
        if (!id) return '';
        const p = captainPickCandidates.find(u => String(u.id) === String(id));
        return p ? formatGuestAwarePlayerName(p) : '';
    }, [captainPickCandidates]);

    // NEW: Fetch existing stats for current user
    const fetchUserStats = useCallback(async () => {
        if (!token || !resolvedMatchId || !currentUserId) return;
        
        console.log('ًں“ٹ Fetching existing stats for user:', currentUserId);
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/stats?playerId=${encodeURIComponent(currentUserId)}&_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn('âڑ ï¸ڈ Failed to fetch stats:', res.status);
                return;
            }

            const data = await res.json();
            console.log('ًں“ٹ Stats response:', data);
            
            const userStat = data?.success ? data?.stats : null;
            if (userStat) {
                console.log('âœ… Found existing stats for user:', userStat);
                setStats({
                    goals: userStat.goals || 0,
                    assists: userStat.assists || 0,
                    cleanSheets: userStat.cleanSheets || 0,
                    penalties: userStat.penalties || 0,
                    freeKicks: userStat.freeKicks || 0,
                    defence: userStat.defence || 0,
                    impact: userStat.impact || 0,
                });
                if (userStat.goals > 0 || userStat.assists > 0 || userStat.cleanSheets > 0) {
                    toast.success('Your previous stats have been loaded!');
                }
            } else {
                console.log('â„¹ï¸ڈ No existing stats found for user');
            }
        } catch (err) {
            console.error('â‌Œ Failed to fetch user stats:', err);
        }
    }, [token, resolvedMatchId, currentUserId]);

    // Call fetchUserStats when match or user changes
    useEffect(() => {
        if (resolvedMatchId && token && currentUserId) {
            fetchUserStats();
        }
    }, [resolvedMatchId, token, currentUserId, fetchUserStats]);

    useEffect(() => {
        const loadPicks = async () => {
            setMatchCaptainPicks({ home: {}, away: {} });
            setMatchCategoryVoteCounts({ defence: {}, influence: {} });
            if (!token || !resolvedMatchId) {
                console.log('Skipping captain picks load - missing token or matchId');
                return;
            }

            console.log('Loading captain picks for match:', resolvedMatchId);

            const teamKey = userPickTeamKey;
            const storageKey = teamKey ? `captain_picks_${resolvedMatchId}_${teamKey}` : null;

            const normalizeTeamPicks = (raw: unknown): CaptainPicks => {
                if (!raw || typeof raw !== 'object') return {};
                const obj = raw as Record<string, unknown>;
                return {
                    defence: typeof obj.defence === 'string' ? obj.defence : undefined,
                    influence: typeof obj.influence === 'string' ? obj.influence : undefined,
                };
            };

            // 1) Try local storage first so UI shows something even if API is missing
            if (storageKey && typeof window !== 'undefined') {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    try {
                        const ls = JSON.parse(raw) as CaptainPicks;
                        setCaptainPicks({
                            defence: ls.defence || undefined,
                            influence: ls.influence || undefined,
                        });
                        if (teamKey) {
                            setMatchCaptainPicks((prev) => ({
                                ...prev,
                                [teamKey]: {
                                    defence: ls.defence || undefined,
                                    influence: ls.influence || undefined,
                                }
                            }));
                        }
                    } catch (err) {
                        console.error('Failed to parse localStorage picks:', err);
                    }
                }
            }

            // 2) Fetch from API (overrides localStorage if successful)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${resolvedMatchId}/captain-picks`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 405) {
                    setCaptainApiAvailable(false);
                    return;
                }

                if (!res.ok) {
                    return;
                }

                setCaptainApiAvailable(true);
                const data = await res.json();

                const readVoteMap = (raw: unknown): Record<string, number> => {
                    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
                    const out: Record<string, number> = {};
                    Object.entries(raw as Record<string, unknown>).forEach(([id, value]) => {
                        const n = Number(value);
                        if (!Number.isNaN(n) && n > 0) out[id] = n;
                    });
                    return out;
                };

                setMatchCategoryVoteCounts({
                    defence: readVoteMap(
                        (data as Record<string, unknown>)?.defenceVotes ??
                        (data as Record<string, unknown>)?.defensiveVotes ??
                        ((data as Record<string, unknown>)?.votes as Record<string, unknown> | undefined)?.defence ??
                        ((data as Record<string, unknown>)?.votes as Record<string, unknown> | undefined)?.defensive
                    ),
                    influence: readVoteMap(
                        (data as Record<string, unknown>)?.influenceVotes ??
                        (data as Record<string, unknown>)?.mentalityVotes ??
                        ((data as Record<string, unknown>)?.votes as Record<string, unknown> | undefined)?.influence ??
                        ((data as Record<string, unknown>)?.votes as Record<string, unknown> | undefined)?.mentality
                    ),
                });

                const homePicks = normalizeTeamPicks(data?.home);
                const awayPicks = normalizeTeamPicks(data?.away);
                setMatchCaptainPicks({ home: homePicks, away: awayPicks });

                const picks = teamKey ? normalizeTeamPicks(data?.[teamKey]) : normalizeTeamPicks(data?.picks);

                if ((picks.defence || picks.influence)) {
                    setCaptainPicks({
                        defence: picks.defence || undefined,
                        influence: picks.influence || undefined,
                    });
                    if (teamKey) {
                        setMatchCaptainPicks((prev) => ({
                            ...prev,
                            [teamKey]: {
                                defence: picks.defence || undefined,
                                influence: picks.influence || undefined,
                            }
                        }));
                    }

                    if (storageKey && typeof window !== 'undefined') {
                        localStorage.setItem(storageKey, JSON.stringify({
                            defence: picks.defence || undefined,
                            influence: picks.influence || undefined,
                        }));
                    }
                }
            } catch (err) {
                console.error('Failed to load captain picks:', err);
                setCaptainApiAvailable(false);
            }
        };
        loadPicks();
    }, [token, resolvedMatchId, userPickTeamKey]);

    // --- NEW: open pick dialog handler ---
    const openPickDialog = (category: CaptainPickCategory) => {
        if (!isUserAssignedToTeam) {
            toast.error('You must be assigned to a team to make this selection.');
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
    const handleSelectPick = async (playerId: string, categoryOverride?: CaptainPickCategory) => {
        const category = categoryOverride ?? pickCategory;
        if (!category) return;
        if (String(playerId) === currentUserId) {
            toast.error('You cannot select yourself for captain bonus picks.');
            return;
        }
        if (!captainPickCandidates.some(p => String(p.id) === String(playerId))) {
            toast.error('Please select a valid player from this match.');
            return;
        }

        console.log('Saving captain pick:', { category, playerId, resolvedMatchId });

        // Local update + localStorage persist (always immediate)
        const applyLocal = () => {
            setCaptainPicks(prev => {
                const updated = { ...prev, [category]: playerId };
                return updated;
            });

            const teamKey = userPickTeamKey;
            if (teamKey) {
                setMatchCaptainPicks((prev) => ({
                    ...prev,
                    [teamKey]: {
                        ...(prev[teamKey] || {}),
                        [category]: playerId,
                    }
                }));
            }
            if (teamKey && typeof window !== 'undefined') {
                const key = `captain_picks_${resolvedMatchId}_${teamKey}`;
                const next = { ...captainPicks, [category]: playerId };
                localStorage.setItem(key, JSON.stringify(next));
            }
        };

        applyLocal();
        setIsPickDialogOpen(false);
        setPickCategory(null);

        // Keep API sync as best effort; UI selection should not fail if API fails.
        if (!captainApiAvailable) {
            toast.success('Captain pick selected (local mode).');
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
                body: JSON.stringify({ category, playerId })
            });

            if (res.status === 404 || res.status === 405) {
                setCaptainApiAvailable(false);
                toast.success('Captain pick selected (local mode).');
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.message || 'Captain pick selected locally, backend sync failed.');
                return;
            }

            toast.success(`${category === 'defence' ? 'Defensive Impact' : '+ Mentality'} captain pick saved!`);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message :
                    typeof err === 'string' ? err :
                        'Captain pick selected locally, backend sync failed.';
            toast.error(message);
        } finally {
            setSavingPick(false);
        }
    };

    const canPlayerSubmitStats = baseCanSubmit && (editWindow?.canPlayerSubmit ?? false);

    // Check if match is current or within previous 2 matches (0=current, 1=previous, 2=one before previous)
    // Allow inline stats only for the most recent two matches (indexFromEnd 0 or 1)
    const isMatchWithinLastTwo = editWindow?.indexFromEnd !== null && editWindow?.indexFromEnd !== undefined && editWindow.indexFromEnd <= 1;

    // Determine which team the user is on
    const userTeamName = playerOnHomeTeamSafe ? match?.homeTeamName : (playerOnAwayTeamSafe ? match?.awayTeamName : null);

    // Auto-open inline stats when eligible and hide the old button
    useEffect(() => {
        // Show inline stats for last two matches to players (team-assigned) or league admins.
        // Admins bypass player submission gating and team assignment.
        const shouldShow = user &&
            league?.active &&
            (canPlayerSubmitStats || isAdmin) &&
            isMatchWithinLastTwo &&
            !selectedLeagueHasNoMatches &&
            !showAdminGoalsSection &&
            (isUserAssignedToTeam || isAdmin);

        if (shouldShow && !showInlineStats) {
            setShowInlineStats(true);
        } else if (!shouldShow && showInlineStats) {
            setShowInlineStats(false);
        }
    }, [showInlineStats, user, league, canPlayerSubmitStats, isUserAssignedToTeam, isMatchWithinLastTwo, selectedLeagueHasNoMatches, showAdminGoalsSection, isAdmin]);
    // const canAdminSubmitStats = baseCanSubmit && (editWindow?.adminCanSubmit ?? false);

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

            const data = await parseJsonSafely(response);
            const apiSuccess = data?.success;

            if (response.ok && apiSuccess !== false) {
                // ًں”„ Clear stats cache for this player to force fresh fetch
                clearCacheByResource('stats', `${resolvedMatchId}_${selectedPlayerForAdmin.id}`);
                
                toast.success(`Stats added for ${formatGuestAwarePlayerName(selectedPlayerForAdmin)}`);
                handleCloseAdminStatsModal();
                
                // Refetch match details to update UI
                await fetchLeagueAndMatchDetails(true);
                closeParentDialogAfterSave();
            } else {
                const message = typeof data?.message === 'string' && data.message ? data.message : 'Failed to add stats';
                toast.error(message);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingAdminStats(false);
        }
    };

    if (loading) {
        // If showAdminGoalsSection is true, show loading inside the admin dialog
        if (showAdminGoalsSection) {
            return (
                <Dialog
                    open={showAdminGoalsSection}
                    onClose={onClose}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ sx: dialogPaperSx }}
                >
                    <DialogTitle sx={dialogTitleSx}>
                        ADD MATCH SCORES
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ ...dialogContentSx, minHeight: '200px' }}>
                        <MatchStatsPopupLoadingSkeleton mode="score" />
                    </DialogContent>
                </Dialog>
            );
        }

        const inner = <MatchStatsPopupLoadingSkeleton mode="stats" />;
        if (typeof open === 'boolean') {
            return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper" keepMounted PaperProps={{ sx: dialogPaperSx }}>
                    <DialogTitle sx={dialogTitleSx}>
                        Match Stats
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={dialogContentSx}>
                        {inner}
                    </DialogContent>
                </Dialog>
            );
        }
        return inner;
    }

    if (error || !league || !match) {
        // Embedded: if opened specifically for Admin Goals, don't show league selector fallback.
        if (typeof open === 'boolean' && showAdminGoalsSection) {
            return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" keepMounted PaperProps={{ sx: dialogPaperSx }}>
                    <DialogTitle sx={dialogTitleSx}>
                        ADD MATCH SCORES
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ ...dialogContentSx }}>
                        {error ? (
                            <Alert severity="error" sx={{ bgcolor: 'rgba(244,67,54,0.1)', color: '#ffcdd2', border: '1px solid rgba(244,67,54,0.3)' }}>{error}</Alert>
                        ) : (
                            <Typography variant="body1" sx={{ color: '#E5E7EB', mb: 2 }}>Loading match detailsâ€¦</Typography>
                        )}
                        {!error && <MatchStatsPopupLoadingSkeleton mode="score" />}
                    </DialogContent>
                </Dialog>
            );
        }

        // Embedded: show a simple starter UI that lets the user select a league instead of a hard error
        if (typeof open === 'boolean') {
            return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" keepMounted PaperProps={{ sx: dialogPaperSx }}>
                    <DialogTitle sx={dialogTitleSx}>
                        Match Stats
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={dialogContentSx}>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            {!!error && (
                                <Alert severity="error" sx={{ bgcolor: 'rgba(244,67,54,0.1)', color: '#ffcdd2', border: '1px solid rgba(244,67,54,0.3)' }}>{error}</Alert>
                            )}
                            <Typography variant="body1" sx={{ color: '#E5E7EB' }}>Select a league to view and add stats.</Typography>
                            <Box>
                                <Button
                                    onClick={openLeagueSelector}
                                    variant="contained"
                                    sx={{
                                        background: 'linear-gradient(135deg,#e56a16,#cf2326)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' },
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
                <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" keepMounted PaperProps={{ sx: dialogPaperSx }}>
                    <DialogTitle sx={dialogTitleSx}>
                        Match Stats
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={dialogContentSx}>
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
            id: `guest-${g.id}`,
            guestId: g.id,
            firstName: g.firstName,
            lastName: g.lastName,
            // shirtNumber: g.shirtNumber,
            isGuest: true
        } as User & { isGuest: true }));

    const guestUsersAway: (User & { isGuest: true })[] = (match.guests || [])
        .filter(g => g.team === 'away')
        .map(g => ({
            id: `guest-${g.id}`,
            guestId: g.id,
            firstName: g.firstName,
            lastName: g.lastName,
            // shirtNumber: g.shirtNumber,
            isGuest: true
        } as User & { isGuest: true }));

    const homePlayersAll: (User & { isGuest?: boolean })[] = [...(match?.homeTeamUsers ?? []), ...guestUsersHome];
    const awayPlayersAll: (User & { isGuest?: boolean })[] = [...(match?.awayTeamUsers ?? []), ...guestUsersAway];

    // Players eligible for voting / dropdowns (include guests)
    const allPlayersForVoting: (User & { isGuest?: boolean })[] = [...homePlayersAll, ...awayPlayersAll];

    // Summary row: show highest-voted players across the full match
    const toDisplayPlayerId = (rawId?: string | null): string | null => {
        if (!rawId) return null;
        const id = String(rawId);

        const direct = allPlayersForVoting.find((p) => String(p.id) === id);
        if (direct) return String(direct.id);

        const guestAlias = allPlayersForVoting.find((p) => {
            const pid = String(p.id);
            return pid.startsWith('guest-') && pid.slice(6) === id;
        });
        if (guestAlias) return String(guestAlias.id);

        return null;
    };

    const motmVoteCounts: Record<string, number> = {};
    const defensiveVoteCounts: Record<string, number> = {};
    const mentalityVoteCounts: Record<string, number> = {};

    allPlayersForVoting.forEach((p) => {
        const pid = String(p.id);
        motmVoteCounts[pid] = 0;
        defensiveVoteCounts[pid] = 0;
        mentalityVoteCounts[pid] = 0;
    });

    Object.entries(playerVotes || {}).forEach(([rawId, count]) => {
        const pid = toDisplayPlayerId(rawId);
        if (!pid) return;
        motmVoteCounts[pid] = (motmVoteCounts[pid] || 0) + (Number(count) || 0);
    });

    const backendDefenceEntries = Object.entries(matchCategoryVoteCounts.defence || {});
    if (backendDefenceEntries.length > 0) {
        backendDefenceEntries.forEach(([rawId, count]) => {
            const pid = toDisplayPlayerId(rawId);
            if (!pid) return;
            defensiveVoteCounts[pid] = (defensiveVoteCounts[pid] || 0) + (Number(count) || 0);
        });
    } else {
        [matchCaptainPicks.home?.defence, matchCaptainPicks.away?.defence].forEach((rawId) => {
            const pid = toDisplayPlayerId(rawId);
            if (!pid) return;
            defensiveVoteCounts[pid] = (defensiveVoteCounts[pid] || 0) + 1;
        });
    }

    const backendInfluenceEntries = Object.entries(matchCategoryVoteCounts.influence || {});
    if (backendInfluenceEntries.length > 0) {
        backendInfluenceEntries.forEach(([rawId, count]) => {
            const pid = toDisplayPlayerId(rawId);
            if (!pid) return;
            mentalityVoteCounts[pid] = (mentalityVoteCounts[pid] || 0) + (Number(count) || 0);
        });
    } else {
        [matchCaptainPicks.home?.influence, matchCaptainPicks.away?.influence].forEach((rawId) => {
            const pid = toDisplayPlayerId(rawId);
            if (!pid) return;
            mentalityVoteCounts[pid] = (mentalityVoteCounts[pid] || 0) + 1;
        });
    }

    const getTopVotedPlayerId = (voteCounts: Record<string, number>, fallbackId?: string | null): string | null => {
        const entries = Object.entries(voteCounts || {});
        if (!entries.length) return toDisplayPlayerId(fallbackId);

        const maxVotes = entries.reduce((max, [, votes]) => Math.max(max, Number(votes) || 0), 0);
        if (maxVotes <= 0) return toDisplayPlayerId(fallbackId);

        const leaders = entries
            .filter(([, votes]) => (Number(votes) || 0) === maxVotes)
            .map(([pid]) => pid);

        const preferred = toDisplayPlayerId(fallbackId);
        if (preferred && leaders.includes(preferred)) return preferred;

        const orderedLeader = allPlayersForVoting.find((p) => leaders.includes(String(p.id)));
        return orderedLeader ? String(orderedLeader.id) : leaders[0] || null;
    };

    const motmWinnerId = getTopVotedPlayerId(motmVoteCounts, votedForId);
    const defensiveWinnerId = getTopVotedPlayerId(defensiveVoteCounts, captainPicks.defence);
    const mentalityWinnerId = getTopVotedPlayerId(mentalityVoteCounts, captainPicks.influence);

    const motmPlayer = motmWinnerId ? allPlayersForVoting.find((p) => String(p.id) === motmWinnerId) : undefined;
    const defensivePlayer = defensiveWinnerId ? allPlayersForVoting.find((p) => String(p.id) === defensiveWinnerId) : undefined;
    const mentalityPlayer = mentalityWinnerId ? allPlayersForVoting.find((p) => String(p.id) === mentalityWinnerId) : undefined;

    const content = (
        <Box sx={{ 
            minHeight: { xs: 'auto', md: '100vh' }, 
            color: 'black',
            overflow: 'hidden',
            '&::-webkit-scrollbar': {
                display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
        }}>
            {!showAdminGoalsSection && !selectedLeagueHasNoMatches && !league.active && (
                <Alert severity="warning" sx={{ mb: 1 }}>This league is currently inactive. All actions are disabled.</Alert>
            )}

            {!showAdminGoalsSection && (
                <Paper
                    sx={{
                        p: { xs: 1, sm: 2, md: 3 },
                        backgroundColor: '#262626',
                        color: 'white',
                        border: { xs: '2px solid #bfbfbf', md: '5px solid #bfbfbf' },
                        borderRadius: 0,
                        // boxShadow: 3,
                        // display: selectedLeagueHasNoMatches ? 'none' : 'block',
                        // mt:-0.1,
                    }}
                >
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                fontSize: { xs: '1rem', sm: '1.25rem', md: '2rem' },
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            Add your stats and match votes
                        </Typography>
                    </Box>

                    {/* Stats (left) + Votes (right) */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: { xs: 2, md: 3 },
                            alignItems: 'stretch',
                        }}
                    >
                        {/* Stats panel */}
                        <Box
                            sx={{
                                p: { xs: 1, sm: 1.5, md: 3 },
                                backgroundColor: '#262626',
                                borderRadius: 0,
                                border: '1px solid #d9d9d9',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.25,
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 500,
                                    // mb: 0.5,
                                    fontSize: { xs: '1.25rem', md: '2rem' },
                                    mt: { xs: 0, md: -3 },
                                }}
                            >
                                Stats
                            </Typography>
                            {/* <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 1 }} /> */}

                            {/* {showInlineStats && (isAdmin || (isMatchWithinLastTwo && isUserAssignedToTeam)) ? ( */}
                                <>
                                    {/* Goals Row */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-start' }, gap: { xs: 1, md: 2 } }}>
                                        <img src={Goals.src} alt="Goals" style={{ width: isMobile ? 34 : 48, height: isMobile ? 34 : 48 }} />
                                        <TextField
                                            type="text"
                                            value={stats.goals}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setStats(prev => ({ ...prev, goals: 0 }));
                                                    return;
                                                }
                                                // Only allow numbers
                                                if (!/^\d+$/.test(val)) return;
                                                
                                                const numVal = parseInt(val, 10);
                                                if (!isNaN(numVal)) {
                                                    const newVal = Math.max(0, Math.min(teamGoalsSafe, numVal));
                                                    setStats(prev => ({ ...prev, goals: newVal }));
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            inputProps={{ style: { textAlign: 'center' } }}
                                            sx={{
                                                width: { xs: 96, md: 180 },
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: '#d9d9d9' },
                                                    '&:hover fieldset': { borderColor: '#d9d9d9' },
                                                    '&.Mui-focused fieldset': { borderColor: '#00C48C' },
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: { xs: '1rem', md: '1.25rem' },
                                                    fontWeight: 600,
                                                    py: 0.75,
                                                },
                                                '& input[type=number]': {
                                                    MozAppearance: 'textfield'
                                                },
                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                },
                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                }
                                            }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff', minWidth: { xs: 68, md: 0 }, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                                            Goals
                                        </Typography>
                                    </Box>

                                    {/* Assists Row */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-start' }, gap: { xs: 1, md: 2 } }}>
                                        <img src={Assist.src} alt="Assists" style={{ width: isMobile ? 34 : 48, height: isMobile ? 34 : 48 }} />
                                        <TextField
                                            type="text"
                                            value={stats.assists}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setStats(prev => ({ ...prev, assists: 0 }));
                                                    return;
                                                }
                                                // Only allow numbers
                                                if (!/^\d+$/.test(val)) return;
                                                
                                                const numVal = parseInt(val, 10);
                                                if (!isNaN(numVal)) {
                                                    const newVal = Math.max(0, Math.min(teamGoalsSafe, numVal));
                                                    setStats(prev => ({ ...prev, assists: newVal }));
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            inputProps={{ style: { textAlign: 'center' } }}
                                            sx={{
                                                width: { xs: 96, md: 180 },
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: '#d9d9d9' },
                                                    '&:hover fieldset': { borderColor: '#d9d9d9' },
                                                    '&.Mui-focused fieldset': { borderColor: '#00C48C' },
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: { xs: '1rem', md: '1.25rem' },
                                                    fontWeight: 600,
                                                    py: 0.75,
                                                },
                                                '& input[type=number]': {
                                                    MozAppearance: 'textfield'
                                                },
                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                },
                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                }
                                            }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff', minWidth: { xs: 68, md: 0 }, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                                            Assists
                                        </Typography>
                                    </Box>

                                    {/* Clean Sheet Row */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-start' }, gap: { xs: 1, md: 2 } }}>
                                        <img src={CleanSheet.src} alt="Clean Sheets" style={{ width: isMobile ? 34 : 48, height: isMobile ? 34 : 48 }} />
                                        <TextField
                                            type="text"
                                            value={stats.cleanSheets}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setStats(prev => ({ ...prev, cleanSheets: 0 }));
                                                    return;
                                                }
                                                // Only allow numbers
                                                if (!/^\d+$/.test(val)) return;
                                                
                                                const numVal = parseInt(val, 10);
                                                if (!isNaN(numVal)) {
                                                    const newVal = Math.max(0, Math.min(1, numVal));
                                                    setStats(prev => ({ ...prev, cleanSheets: newVal }));
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            inputProps={{ style: { textAlign: 'center' } }}
                                            sx={{
                                                width: { xs: 96, md: 180 },
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: '#d9d9d9' },
                                                    '&:hover fieldset': { borderColor: '#d9d9d9' },
                                                    '&.Mui-focused fieldset': { borderColor: '#00C48C' },
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: { xs: '1rem', md: '1.25rem' },
                                                    fontWeight: 600,
                                                    py: 0.75,
                                                },
                                                '& input[type=number]': {
                                                    MozAppearance: 'textfield'
                                                },
                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                },
                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                }
                                            }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff', minWidth: { xs: 68, md: 0 }, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                                            Clean Sheet
                                        </Typography>
                                    </Box>
                                </>
                            {/* ) : (
                                <Typography variant="body2" sx={{ color: '#D1D5DB' }}>
                                    Stats submission is not available for this match.
                                </Typography>
                            )} */}
                        </Box>

                        {/* Votes panel */}
                        <Box
                            sx={{
                                p: { xs: 1, sm: 1.5, md: 3 },
                                backgroundColor: '#262626',
                                borderRadius: 0,
                                border: '1px solid #d9d9d9',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 500,
                                    // mb: 0.5,
                                    fontSize: { xs: '1.25rem', md: '2rem' },
                                    mt: { xs: 0, md: -3 },
                                }}
                            >
                                Votes
                            </Typography>
                            {/* <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} /> */}

                            {/* MOTM select */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1 } }}>
                                <img src={MOMT.src} alt="MOTM" style={{ width: isMobile ? 28 : 35, height: isMobile ? 28 : 35 }} />
                                <TextField
                                    select
                                    size="small"
                                    value={votedForId || ''}
                                    onChange={(e) => handleVote(e.target.value)}
                                    disabled={
                                        loadingVote ||
                                        !baseCanSubmit ||
                                        !league.active ||
                                        !isUserAssignedToTeam
                                    }
                                    SelectProps={{
                                        displayEmpty: true,
                                        renderValue: (selected) => {
                                            const selectedPlayer = allPlayersForVoting.find(p => p.id === selected);
                                            return selectedPlayer
                                                ? formatGuestAwarePlayerName(selectedPlayer)
                                                : 'Select Man Of The Match Player';
                                        },
                                        MenuProps: {
                                            ...dropdownMenuBaseProps,
                                            PaperProps: {
                                                sx: {
                                                    ...dropdownPaperBaseSx,
                                                    bgcolor: 'black',
                                                    '& .MuiList-root': {
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                        gap: 1,
                                                        p: 1,
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{
                                        minWidth: { xs: 0, md: 290 },
                                        width: { xs: '100%', md: 290 },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            borderRadius: 1,
                                            border: '1px solid #d9d9d9',
                                            py: 0.4,
                                            px: 0,
                                            fontSize: '0.85rem',
                                        },
                                        '& .MuiOutlinedInput-root.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                            opacity: 1,
                                        },
                                        '& .MuiSelect-select.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                        },
                                        '& .MuiInputBase-input.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                        '& .MuiSvgIcon-root': { color: '#fff' },
                                        '& .MuiSvgIcon-root.Mui-disabled': { color: '#fff' },
                                    }}
                                >
                                    {allPlayersForVoting.map((p) => {
                                        const selected = votedForId === p.id;
                                        const isSelf = String(p.id) === currentUserId;
                                        console.log(`ًںژ¯ Player ${p.firstName} ${p.lastName} (${p.id}):`, { selected, votedForId, playerVotesForThisPlayer: playerVotes[p.id] });
                                        return (
                                            <MenuItem 
                                                key={p.id} 
                                                value={p.id}
                                                disabled={isSelf}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    position: 'relative',
                                                    bgcolor: '#000',
                                                    border: '1px solid',
                                                    borderColor: selected ? '#00C48C' : '#d9d9d9',
                                                    borderRadius: 1,
                                                    transition: 'background-color .2s ease, border-color .2s ease, transform .08s ease',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255,255,255,0.06)',
                                                        borderColor: '#fff',
                                                        transform: 'translateY(-1px)'
                                                    },
                                                    minHeight: 'auto',
                                                }}
                                            >
                                                <Box sx={{ position: 'relative' }}>
                                                    <Avatar
                                                        src={p.profilePicture || PlayerImg.src}
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            mb: 0.5,
                                                            border: '3px solid',
                                                            borderColor: selected ? '#00C48C' : '#fff',
                                                            bgcolor: '#000',
                                                            '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, color: '#fff' }}>
                                                    {formatGuestAwarePlayerName(p)}
                                                </Typography>
                                                {p.isGuest && !isGuestLastName(p.lastName) && (
                                                    <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1, color: '#9CA3AF', fontSize: '0.6rem' }}>
                                                        (Guest)
                                                    </Typography>
                                                )}
                                                     {selected && (
                                                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C48C', border: '1px solid', borderColor: '#00C48C' }}>
                                                        <Check size={12} />
                                                    </Box>
                                                )}
                                            </MenuItem>
                                        );
                                    })}
                                </TextField>
                            </Box>

                            {/* Defensive Impact dropdown (like MOTM) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1 } }}>
                                <img src={DEFIMP.src} alt="Defensive" style={{ width: isMobile ? 28 : 35, height: isMobile ? 28 : 35 }} />
                                <TextField
                                    select
                                    size="small"
                                    value={captainPicks.defence || ''}
                                    onChange={(e) => handleSelectPick(e.target.value, 'defence')}
                                    disabled={
                                        !baseCanSubmit ||
                                        !league?.active ||
                                        !isUserAssignedToTeam ||
                                        savingPick
                                    }
                                    SelectProps={{
                                        displayEmpty: true,
                                        renderValue: (selected) => {
                                            const selectedPlayer = captainPickCandidates.find(p => p.id === selected);
                                            return selectedPlayer
                                                ? formatGuestAwarePlayerName(selectedPlayer)
                                                : 'Select Defensive Impact Player';
                                        },
                                        MenuProps: {
                                            ...dropdownMenuBaseProps,
                                            PaperProps: {
                                                sx: {
                                                    ...dropdownPaperBaseSx,
                                                    bgcolor: '#000',
                                                    '& .MuiList-root': {
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                        gap: 1,
                                                        p: 1,
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{
                                        minWidth: { xs: 0, md: 290 },
                                        width: { xs: '100%', md: 290 },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            borderRadius: 1,
                                            border: '1px solid #d9d9d9',
                                            py: 0.5,
                                            px: 0,
                                            fontSize: '0.85rem',
                                        },
                                        '& .MuiOutlinedInput-root.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                            opacity: 1,
                                        },
                                        '& .MuiSelect-select.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                        },
                                        '& .MuiInputBase-input.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                        '& .MuiSvgIcon-root': { color: '#fff' },
                                        '& .MuiSvgIcon-root.Mui-disabled': { color: '#fff' },
                                    }}
                                >
                                    {captainPickCandidates.map((p) => {
                                        const selected = captainPicks.defence === p.id;
                                        const isSelf = String(p.id) === currentUserId;
                                        return (
                                            <MenuItem 
                                                key={p.id} 
                                                value={p.id}
                                                disabled={isSelf}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    position: 'relative',
                                                    bgcolor: '#000',
                                                    border: '1px solid',
                                                    borderColor: selected ? '#00C48C' : '#fff',
                                                    borderRadius: 1,
                                                    transition: 'background-color .2s ease, border-color .2s ease, transform .08s ease',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255,255,255,0.06)',
                                                        borderColor: '#fff',
                                                        transform: 'translateY(-1px)'
                                                    },
                                                    minHeight: 'auto',
                                                }}
                                            >
                                                <Avatar
                                                    src={p.profilePicture || PlayerImg.src}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        mb: 0.5,
                                                        border: '3px solid',
                                                         borderColor: selected ? '#00C48C' : '#fff',
                                                        bgcolor: '#000',
                                                        '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, color: '#fff' }}>
                                                    {formatGuestAwarePlayerName(p)}
                                                </Typography>
                                                {p.isGuest && !isGuestLastName(p.lastName) && (
                                                    <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1, color: '#9CA3AF', fontSize: '0.6rem' }}>
                                                        (Guest)
                                                    </Typography>
                                                )}
                                                {selected && (
                                                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C48C', border: '1px solid', borderColor: '#00C48C' }}>
                                                        <Check size={12} />
                                                    </Box>
                                                )}
                                            </MenuItem>
                                        );
                                    })}
                                </TextField>
                            </Box>

                            {/* + Mentality dropdown (like MOTM) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1 } }}>
                                <img src={MENTALITY.src} alt="Mentality" style={{ width: isMobile ? 28 : 35, height: isMobile ? 28 : 35 }} />
                                <TextField
                                    select
                                    size="small"
                                    value={captainPicks.influence || ''}
                                    onChange={(e) => handleSelectPick(e.target.value, 'influence')}
                                    disabled={
                                        !baseCanSubmit ||
                                        !league?.active ||
                                        !isUserAssignedToTeam ||
                                        savingPick
                                    }
                                    SelectProps={{
                                        displayEmpty: true,
                                        renderValue: (selected) => {
                                            const selectedPlayer = captainPickCandidates.find(p => p.id === selected);
                                            return selectedPlayer
                                                ? formatGuestAwarePlayerName(selectedPlayer)
                                                : 'Select + Mentality Player';
                                        },
                                        MenuProps: {
                                            ...dropdownMenuBaseProps,
                                            PaperProps: {
                                                sx: {
                                                    ...dropdownPaperBaseSx,
                                                    bgcolor: '#000',
                                                    '& .MuiList-root': {
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                        gap: 1,
                                                        p: 1,
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{
                                        minWidth: { xs: 0, md: 290 },
                                        width: { xs: '100%', md: 290 },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            borderRadius: 1,
                                            border: '1px solid #d9d9d9',
                                            py: 0.5,
                                            px: 0,
                                            fontSize: '0.85rem',
                                        },
                                        '& .MuiOutlinedInput-root.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                            opacity: 1,
                                        },
                                        '& .MuiSelect-select.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                        },
                                        '& .MuiInputBase-input.Mui-disabled': {
                                            color: '#fff',
                                            WebkitTextFillColor: '#fff',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                        '& .MuiSvgIcon-root': { color: '#fff' },
                                        '& .MuiSvgIcon-root.Mui-disabled': { color: '#fff' },
                                    }}
                                >
                                    {captainPickCandidates.map((p) => {
                                        const selected = captainPicks.influence === p.id;
                                        const isSelf = String(p.id) === currentUserId;
                                        return (
                                            <MenuItem 
                                                key={p.id} 
                                                value={p.id}
                                                disabled={isSelf}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    position: 'relative',
                                                    bgcolor: '#000',
                                                    border: '1px solid',
                                                    borderColor: selected ? '#00C48C' : 'rgba(255,255,255,0.15)',
                                                    borderRadius: 1,
                                                    transition: 'background-color .2s ease, border-color .2s ease, transform .08s ease',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255,255,255,0.06)',
                                                        borderColor: '#fff',
                                                        transform: 'translateY(-1px)'
                                                    },
                                                    minHeight: 'auto',
                                                }}
                                            >
                                                <Avatar
                                                    src={p.profilePicture || PlayerImg.src}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        mb: 0.5,
                                                        border: '3px solid',
                                                        borderColor: '#00C48C',
                                                        bgcolor: '#000',
                                                        '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, color: '#fff' }}>
                                                    {formatGuestAwarePlayerName(p)}
                                                </Typography>
                                                {p.isGuest && !isGuestLastName(p.lastName) && (
                                                    <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1, color: '#9CA3AF', fontSize: '0.6rem' }}>
                                                        (Guest)
                                                    </Typography>
                                                )}
                                                {selected && (
                                                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C48C', border: '1px solid', borderColor: '#00C48C' }}>
                                                        <Check size={12} />
                                                    </Box>
                                                )}
                                            </MenuItem>
                                        );
                                    })}
                                </TextField>
                            </Box>

                            {/* {!isCaptainUser && (
                                <Typography variant="caption" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.7)' }}>
                                    Only the captain from each team can select Defensive Impact and + Mentality players.
                                </Typography>
                            )} */}
                        </Box>
                    </Box>

                    {/* Voted summary row */}
                    <Box
                        sx={{
                            mt: { xs: 3, md: 4 },
                            p: { xs: 1.1, sm: 1, md: 2 },
                            borderRadius: 0,
                            border: '1px solid #d9d9d9',
                            backgroundColor: '#262626',
                        }}
                    >
                        {/* Voted + Three columns in same row */}
                        <Box
                            sx={{
                                display: { xs: 'grid', md: 'flex' },
                                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'none' },
                                alignItems: { xs: 'stretch', md: 'flex-start' },
                                columnGap: { xs: 1.2, md: 0 },
                                rowGap: { xs: 1.3, md: 0 },
                                gap: { md: 10 },
                                flexWrap: { md: 'wrap' },
                                '& > :first-of-type': {
                                    gridColumn: { xs: '1 / -1', md: 'auto' },
                                },
                            }}
                        >
                            {/* Voted title */}
                            <Typography
                                sx={{
                                    fontWeight: 500,
                                    color: '#00C48C',
                                    // pt: 1,
                                    fontSize: { xs: '1.2rem', md: '2rem' },
                                    mt: { xs: 0, md: -1.5 },
                                    textAlign: { xs: 'center', md: 'left' },
                                }}
                            >
                                Voted
                            </Typography>

                            {/* MOTM */}
                            <Box sx={{ textAlign: 'center', minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#E5E7EB', mb: 1, display: 'block', fontSize: { xs: '0.72rem', md: '1.1rem' }, fontWeight: 500 }}>
                                    Man Of The Match
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <VotedPlayerAvatar player={motmPlayer} />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            maxWidth: { xs: 110, md: 140 },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: { xs: '0.72rem', md: '0.875rem' },
                                        }}
                                    >
                                        {motmPlayer ? formatGuestAwarePlayerName(motmPlayer) : 'Not selected'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Defensive Impact */}
                            <Box sx={{ textAlign: 'center', minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#E5E7EB', mb: 1, display: 'block', fontSize: { xs: '0.72rem', md: '1.1rem' }, fontWeight: 500 }}>
                                    Defensive Impact
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <VotedPlayerAvatar player={defensivePlayer} />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            maxWidth: { xs: 110, md: 140 },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: { xs: '0.72rem', md: '0.875rem' },
                                        }}
                                    >
                                        {defensivePlayer ? formatGuestAwarePlayerName(defensivePlayer) : 'Not selected'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* + Mentality */}
                            <Box sx={{ textAlign: 'center', minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#E5E7EB', mb: 1, display: 'block', fontSize: { xs: '0.72rem', md: '1.1rem' }, fontWeight: 500 }}>
                                    + Mentality
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <VotedPlayerAvatar player={mentalityPlayer} />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            maxWidth: { xs: 110, md: 140 },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: { xs: '0.72rem', md: '0.875rem' },
                                        }}
                                    >
                                        {mentalityPlayer ? formatGuestAwarePlayerName(mentalityPlayer) : 'Not selected'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Submit button */}
                    <Box sx={{ mt: { xs: 3, md: 4 } }}>
                        <Button
                            onClick={handleSaveStats}
                            variant="contained"
                            disabled={isSubmittingStats}
                            fullWidth
                            sx={{
                                py: 1.25,
                                fontWeight: 700,
                                letterSpacing: 1,
                                borderRadius: '11px',
                                background: 'linear-gradient(90deg, #4A8DFF 0%, #0062FF 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #0062FF 0%, #4A8DFF 100%)',
                                },
                            }}
                        >
                            {isSubmittingStats ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Submit'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* --- NEW: Player selection dialog (team-restricted) --- */}
            <Dialog open={isPickDialogOpen} onClose={() => setIsPickDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: dialogPaperSx }}>
                <DialogTitle sx={dialogTitleSx}>
                    {pickCategory === 'defence' ? 'Select player for Defensive Impact' : 'Select player for + Mentality'}
                    <IconButton onClick={() => setIsPickDialogOpen(false)} size="small" sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={dialogContentSx}>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                        {captainPickCandidates.map(p => (
                            <Button
                                key={p.id}
                                onClick={() => handleSelectPick(p.id)}
                                disabled={savingPick || String(p.id) === currentUserId}
                                variant="outlined"
                                sx={{
                                    justifyContent: 'flex-start',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    color: '#E5E7EB',
                                    '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.08)' },
                                }}
                            >
                                {formatGuestAwarePlayerName(p)}
                            </Button>
                        ))}
                        {captainPickCandidates.length === 0 && (
                            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                                No players available.
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                {/* Close button removed in favor of top-right X */}
            </Dialog>

            {/* --- NEW: League selection dialog --- */}
            <Dialog open={leagueSelectOpen} onClose={() => setLeagueSelectOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: dialogPaperSx }}>
                <DialogTitle sx={dialogTitleSx}>
                    Select a League
                    <IconButton onClick={() => setLeagueSelectOpen(false)} size="small" sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={dialogContentSx}>
                    {leaguesLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                            <Typography sx={{ color: '#E5E7EB' }}>Loading leaguesâ€¦</Typography>
                        </Box>
                    )}
                    {leaguesError && (
                        <Alert severity="error" sx={{ mb: 1, bgcolor: 'rgba(244,67,54,0.1)', color: '#ffcdd2', border: '1px solid rgba(244,67,54,0.3)' }}>{leaguesError}</Alert>
                    )}
                    {!leaguesLoading && !leaguesError && (
                        <Box sx={{ display: 'grid', gap: 1 }}>
                            {availableLeagues.map((l) => {
                                const isAdminForLeague = Array.isArray(l.administrators)
                                    ? l.administrators.some(a => String(a.id) === String(user?.id))
                                    : false;
                                return (
                                    <Button
                                        key={l.id}
                                        onClick={() => handleSelectLeague(l)}
                                        variant="outlined"
                                        sx={{
                                            display: 'flex',
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderColor: 'rgba(255,255,255,0.3)',
                                            color: '#E5E7EB',
                                            textTransform: 'none',
                                            '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.08)' },
                                        }}
                                    >
                                        <Typography sx={{ color: '#E5E7EB', fontWeight: 500 }}>{l.name}</Typography>
                                        <Typography
                                            sx={{
                                                ml: 2,
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                fontSize: 12,
                                                color: isAdminForLeague ? '#9CA3AF' : '#9CA3AF',
                                                border: '1px solid',
                                                borderColor: isAdminForLeague ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.2)',
                                                bgcolor: 'rgba(255,255,255,0.04)'
                                            }}
                                        >
                                            {isAdminForLeague ? 'Admin' : 'Member'}
                                        </Typography>
                                    </Button>
                                );
                            })}
                            {availableLeagues.length === 0 && (
                                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                                    No leagues available.
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>


            {!selectedLeagueHasNoMatches && (
                <Dialog open={isStatsModalOpen} onClose={handleCloseStatsModal} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
                    <DialogTitle sx={dialogTitleSx}>Your Stats for the Match</DialogTitle>
                    <DialogContent sx={dialogContentSx}>
                        <StatCounter icon={<img src={Goals.src} alt="Goals" style={{ width: 24, height: 24 }} />} label="Goals Scored" value={stats.goals} onIncrement={() => handleStatChange('goals', 1, teamGoalsSafe)} onDecrement={() => handleStatChange('goals', -1, teamGoalsSafe)} />
                        <StatCounter icon={<img src={Assist.src} alt="Assists" style={{ width: 24, height: 24 }} />} label="Assists" value={stats.assists} onIncrement={() => handleStatChange('assists', 1, teamGoalsSafe)} onDecrement={() => handleStatChange('assists', -1, teamGoalsSafe)} />
                        <StatCounter icon={<img src={CleanSheet.src} alt="Clean Sheets" style={{ width: 24, height: 24 }} />} label="Clean Sheets" value={stats.cleanSheets} onIncrement={() => handleStatChange('cleanSheets', 1, 1)} onDecrement={() => handleStatChange('cleanSheets', -1, 1)} />
                    </DialogContent>
                    {/* FreeKick */}
                    <DialogActions>
                        <Button
                            onClick={handleCloseStatsModal}
                            variant="outlined"
                            sx={{
                                color: '#E5E7EB',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveStats}
                            variant="contained"
                            disabled={isSubmittingStats}
                            sx={{
                                background: 'linear-gradient(135deg,#e56a16,#cf2326)',
                                color: '#fff',
                                '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' },
                            }}
                        >
                            {isSubmittingStats ? <CircularProgress size={24} /> : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Matches selection dialog */}
            <Dialog open={matchesDialogOpen} onClose={() => setMatchesDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
                <DialogTitle sx={dialogTitleSx}>
                    Select a Match
                    <IconButton onClick={() => setMatchesDialogOpen(false)} size="small" sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={dialogContentSx}>
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
                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                            <Typography sx={{ color: '#E5E7EB' }}>Loading matchesâ€¦</Typography>
                        </Box>
                    )}
                    {matchesError && (
                        <Alert severity="error" sx={{ mb: 1, bgcolor: 'rgba(244,67,54,0.1)', color: '#ffcdd2', border: '1px solid rgba(244,67,54,0.3)' }}>{matchesError}</Alert>
                    )}
                    {!matchesLoading && !matchesError && selectedLeagueMatches.length === 0 && (
                        <Typography sx={{ opacity: 0.9, color: '#9CA3AF' }}>No matches found.</Typography>
                    )}
                    {!matchesLoading && !matchesError && selectedLeagueMatches.length > 0 && (
                        <Box sx={{ display: 'grid', gap: 1 }}>
                            {selectedLeagueMatches.map((m) => (
                                <Button
                                    key={m.id}
                                    onClick={async () => {
                                        const lid = String(m.leagueId || selectedLeagueIdForList || resolvedLeagueId || '');
                                        const mid = String(m.id || '');
                                        if (!lid || !mid) return;

                                        console.log('ًںژ¯ Match selected:', {
                                            matchId: mid,
                                            leagueId: lid,
                                            teams: `${m.homeTeamName} vs ${m.awayTeamName}`
                                        });

                                        // Sync all league and match states
                                        setCurrentLeagueId(lid);
                                        setSelectedLeagueIdForList(lid);
                                        if (m?.leagueName) {
                                            setSelectedLeagueNameForList(String(m.leagueName));
                                        }
                                        setCurrentMatchId(mid);

                                        // CRITICAL: Update the selected match for button display
                                        setSelectedMatchForList(m);
                                        setSelectedLeagueHasNoMatches(false);

                                        setMatchesDialogOpen(false);
                                        await fetchLeagueAndMatchDetails(true);
                                    }}
                                    variant="outlined"
                                    sx={{
                                        justifyContent: 'space-between',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        color: '#E5E7EB',
                                        '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.08)' },
                                    }}
                                >
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography sx={{ fontWeight: 600, color: '#fff' }}>
                                            {m.homeTeamName} vs {m.awayTeamName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9, color: '#B0BEC5' }}>
                                            {m.date ? new Date(m.date).toLocaleString() : 'Date: N/A'}{m.location ? ` â€¢ ${m.location}` : ''}
                                        </Typography>
                                    </Box>
                                </Button>
                            ))}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Admin Stats Modal */}
            {!selectedLeagueHasNoMatches && (
                <Dialog open={isAdminStatsModalOpen} onClose={handleCloseAdminStatsModal} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
                    <DialogTitle sx={dialogTitleSx}>Admin Add Stats for {formatGuestAwarePlayerName(selectedPlayerForAdmin)}</DialogTitle>
                    <DialogContent sx={dialogContentSx}>
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
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleCloseAdminStatsModal}

                            variant="outlined"
                            sx={{
                                color: '#E5E7EB',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAdminStats}
                            variant="contained"
                            disabled={isSubmittingAdminStats}
                            sx={{
                                background: 'linear-gradient(135deg,#e56a16,#cf2326)',
                                color: '#fff',
                                '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' },
                            }}
                        >
                            {isSubmittingAdminStats ? <CircularProgress size={24} /> : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );

    // If showAdminGoalsSection is true, render ONLY the admin dialog (no background content)
    if (showAdminGoalsSection && isAdmin) {
        const handleAdminDialogClose = () => {
            if (onClose) {
                onClose();
            }
        };
        const adminHeaderLeagueText = (() => {
            if (!league?.name) return 'League';
            const leagueMeta = league as unknown as {
                currentSeason?: { seasonNumber?: number };
                seasons?: Array<{ seasonNumber?: number }>;
                seasonNumber?: number;
                season?: number;
            };

            let seasonNumber: number | undefined;
            if (typeof leagueMeta.currentSeason?.seasonNumber === 'number') {
                seasonNumber = leagueMeta.currentSeason.seasonNumber > 0 ? leagueMeta.currentSeason.seasonNumber : 1;
            }
            if (!seasonNumber && Array.isArray(leagueMeta.seasons) && leagueMeta.seasons.length > 0) {
                const sn = leagueMeta.seasons[0]?.seasonNumber;
                if (typeof sn === 'number') seasonNumber = sn > 0 ? sn : 1;
            }
            if (!seasonNumber && typeof leagueMeta.seasonNumber === 'number') {
                seasonNumber = leagueMeta.seasonNumber > 0 ? leagueMeta.seasonNumber : 1;
            }
            if (!seasonNumber && typeof leagueMeta.season === 'number') {
                seasonNumber = leagueMeta.season > 0 ? leagueMeta.season : 1;
            }

            return seasonNumber ? `${league.name} - SEASON ${seasonNumber}` : league.name;
        })();
        const adminHeaderDateText = (() => {
            const d = (match?.start || match?.date) as string | undefined;
            if (!d) return '';
            const dt = new Date(d);
            if (Number.isNaN(dt.getTime())) return '';
            const day = String(dt.getDate()).padStart(2, '0');
            const month = String(dt.getMonth() + 1).padStart(2, '0');
            const year = dt.getFullYear();
            return `${day}-${month}-${year}`;
        })();

        return (
            <Dialog
                open={open === true && showAdminGoalsSection === true}
                onClose={handleAdminDialogClose}
                fullWidth
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        ...dialogPaperSx,
                        width: { xs: 'calc(100% - 12px)', sm: 'calc(100% - 32px)', md: 'calc(100% - 64px)' },
                        maxWidth: { xs: '100%', md: 850 },
                        height: 'auto',
                        maxHeight: { xs: '92vh', md: 'calc(100% - 64px)' },
                        m: { xs: 0.75, sm: 2, md: 4 },
                        borderRadius: { xs: 2, md: 0 },
                    }
                }}
            >
                {/* Top grey header bar like design screenshot */}
                <DialogTitle
                    sx={{
                        p: 0,
                        bgcolor: '#d9d9d9',
                    }}
                >
                    {isMobile ? (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'stretch',
                                justifyContent: 'space-between',
                                px: 0.9,
                                py: 0.65,
                                pr: 5.2,
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    border: '1px solid rgba(0,0,0,0.28)',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ px: 1, py: 0.55, borderBottom: '1px solid rgba(0,0,0,0.28)' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                        {adminHeaderLeagueText}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    <Box sx={{ px: 1, py: 0.5, borderRight: '1px solid rgba(0,0,0,0.28)' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                            MATCH {computedMatchNumber ?? ''}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ px: 1, py: 0.5 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
                                            {adminHeaderDateText}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <IconButton
                                onClick={handleAdminDialogClose}
                                size="small"
                                sx={{
                                    color: '#111',
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    bgcolor: '#e6e6e6',
                                    borderRadius: 0,
                                    width: 36,
                                    height: 36,
                                    '&:hover': {
                                        bgcolor: '#e6e6e6',
                                    }
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 3,
                                py: 1.5,
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0,
                                    width: '100%',
                                }}
                            >
                                <Box sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                    py: 1,
                                    borderRight: '2px solid #000',
                                }}>
                                    <Typography sx={{
                                        fontWeight: 700,
                                        fontSize: 16,
                                        color: '#000',
                                        textTransform: 'uppercase'
                                    }}>
                                        {adminHeaderLeagueText}
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                    py: 1,
                                    borderRight: '2px solid #000',
                                }}>
                                    <Typography sx={{
                                        fontWeight: 700,
                                        fontSize: 16,
                                        color: '#000',
                                        textTransform: 'uppercase'
                                    }}>
                                        MATCH {computedMatchNumber ?? ''}
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                    py: 1,
                                }}>
                                    <Typography sx={{
                                        fontWeight: 600,
                                        fontSize: 16,
                                        color: '#000'
                                    }}>
                                        {adminHeaderDateText}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton
                                onClick={handleAdminDialogClose}
                                size="small"
                                sx={{
                                    color: 'black',
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    bgcolor: '#e6e6e6',
                                    borderRadius: 0,
                                    width: 63.5,
                                    height: 63.5,
                                    '&:hover': {
                                        bgcolor: '#e6e6e6'
                                    }
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 24 }} />
                            </IconButton>
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent
                    sx={{
                        ...dialogContentSx,
                        pt: { xs: 1.5, sm: 2.5, md: 3 },
                        pb: { xs: 1.5, sm: 2.5, md: 3 },
                        border: { xs: '2px solid #bfbfbf', sm: '5px solid #bfbfbf' },
                        overflowY: 'auto',
                    }}
                >
                    {/* Title inside dark area */}
                    <Typography
                        sx={{
                            textAlign: 'center',
                            fontWeight: 600,
                            letterSpacing: { xs: 1.2, sm: 2.4, md: 3 },
                            mt: { xs: 0.5, sm: 1 },
                            fontSize: { xs: 13, sm: 16, md: 19 },
                        }}
                    >
                        ADD MATCH SCORE
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'center', sm: 'flex-end' },
                            justifyContent: 'space-between',
                            gap: { xs: 1.5, sm: 4, md: 10 },
                            color: 'white',
                            px: { xs: 1, sm: 3, md: 6 },
                            // mt: 4,
                        }}
                    >
                        {/* Home side */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                // flex: 1,
                                textAlign: 'center',
                            }}
                        >
                            {/* Home team shirt image */}
                            <Box
                                sx={{
                                    width: { xs: 96, sm: 120, md: 150 },
                                    height: { xs: 96, sm: 120, md: 150 },
                                    // mb: 1.5,
                                    position: 'relative',
                                }}
                            >
                                <Image
                                    src={HomeTeamShirt}
                                    alt="Home team shirt"
                                    fill
                                    sizes="(max-width: 600px) 96px, (max-width: 900px) 120px, 150px"
                                    style={{ objectFit: 'contain' }}
                                />
                            </Box>
                            {/* <Typography
                                sx={{
                                    fontSize: 12,
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    opacity: 0.9,
                                }}
                            >
                                Home 
                            </Typography> */}
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: 14, sm: 16, md: 18 },
                                    // mt: 0.5,
                                }}
                            >
                                {match?.homeTeamName || 'Home'} Team
                            </Typography>
                            <TextField
                                type="number"
                                value={homeGoalsInput}
                                onChange={e => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                        setHomeGoalsInput('');
                                        setHomeGoals(0);
                                        return;
                                    }
                                    const n = Math.max(0, Number(raw));
                                    const str = String(Number.isFinite(n) ? n : 0);
                                    setHomeGoalsInput(str);
                                    setHomeGoals(Number(str));
                                }}
                                variant="outlined"
                                sx={{
                                    mt: 0.5,
                                    width: { xs: 72, sm: 80 },
                                    border : '1px solid #fff',
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#262626',
                                        color: '#fff',
                                        textAlign: 'center',
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#777' },
                                        '&.Mui-focused fieldset': { borderColor: '#fff' },
                                    },
                                    input: {
                                        textAlign: 'center',
                                        fontSize: { xs: 18, sm: 20 },
                                        fontWeight: 700,
                                        paddingY: 0.75,
                                        MozAppearance: 'textfield',
                                        '&::-webkit-outer-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                        '&::-webkit-inner-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                    },
                                }}
                                inputProps={{ min: 0 }}
                                disabled={!league?.active}
                            />
                        </Box>

                        {/* VS in centre */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                pb: { xs: 0.3, sm: 2 },
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: { xs: 22, sm: 30, md: 40 },
                                    fontWeight: 800,
                                    letterSpacing: { xs: 1.5, sm: 3, md: 4 },
                                }}
                            >
                                V/S
                            </Typography>
                        </Box>

                        {/* Away side */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                // flex: 1,
                                textAlign: 'center',
                            }}
                        >
                            {/* Away team shirt image */}
                            <Box
                                sx={{
                                    width: { xs: 96, sm: 120, md: 150 },
                                    height: { xs: 96, sm: 120, md: 150 },
                                    // mb: 1.5,
                                    position: 'relative',
                                }}
                            >
                                <Image
                                    src={AwayTeamShirt}
                                    alt="Away team shirt"
                                    fill
                                    sizes="(max-width: 600px) 96px, (max-width: 900px) 120px, 150px"
                                    style={{ objectFit: 'contain' }}
                                />
                            </Box>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: 14, sm: 16, md: 18 },
                                    // mt: 0.5,
                                }}
                            >
                                {match?.awayTeamName || 'Away'} Team
                            </Typography>
                            <TextField
                                type="number"
                                value={awayGoalsInput}
                                onChange={e => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                        setAwayGoalsInput('');
                                        setAwayGoals(0);
                                        return;
                                    }
                                    const n = Math.max(0, Number(raw));
                                    const str = String(Number.isFinite(n) ? n : 0);
                                    setAwayGoalsInput(str);
                                    setAwayGoals(Number(str));
                                }}
                                variant="outlined"
                                sx={{
                                    mt: 0.5,
                                    width: { xs: 72, sm: 80 },
                                    border :'1px solid #fff',
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#262626',
                                        color: '#fff',
                                        textAlign: 'center',
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#777' },
                                        '&.Mui-focused fieldset': { borderColor: '#fff' },
                                    },
                                    input: {
                                        textAlign: 'center',
                                        fontSize: { xs: 18, sm: 20 },
                                        fontWeight: 700,
                                        paddingY: 0.75,
                                        MozAppearance: 'textfield',
                                        '&::-webkit-outer-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                        '&::-webkit-inner-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                    },
                                }}
                                inputProps={{ min: 0 }}
                                disabled={!league?.active}
                            />
                        </Box>
                    </Box>

                    {/* <Box sx={{ mt: 4 }}>
                        <TextField
                            label="Match Note"
                            multiline
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            fullWidth
                            variant="outlined"
                            disabled={!league?.active}
                            sx={{
                                // border : '1px solid #fff',
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#262626',
                                    color: '#fff',
                                    '& fieldset': { borderColor: '#fff' },
                                    '&:hover fieldset': { borderColor: '#fff' },
                                    '&.Mui-focused fieldset': { borderColor: '#fff' },
                                },
                                '& .MuiInputLabel-root': { color: '#E5E7EB' },
                            }}
                        />
                    </Box> */}

                    <Box sx={{ mt: { xs: 2.2, sm: 3.2, md: 4 }, px: { xs: 1.5, sm: 4, md: 6 }, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            onClick={handleSaveDetails}
                            disabled={!league?.active || savingMatchDetails}
                            variant="contained"
                            sx={{
                                py: 1.5,
                                borderRadius: '12px',
                                fontWeight: 700,
                                letterSpacing: 1,
                                backgroundColor: '#2196f3',
                                '&:hover': { backgroundColor: '#1e88e5' },
                                width: '100%',
                                minWidth: 0,
                                maxWidth: { xs: '100%', sm: 420, md: 630 },
                            }}
                        >
                            {savingMatchDetails ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'SUBMIT'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    if (typeof open === 'boolean') {
        // Don't render main dialog if admin section is supposed to show
        if (showAdminGoalsSection) {
            return null;
        }

        const dialogLeagueMeta = league as unknown as {
            currentSeason?: { seasonNumber?: number };
            seasons?: Array<{ seasonNumber?: number }>;
            seasonNumber?: number;
            season?: number;
        };
        let dialogSeasonNumber: number | undefined;
        if (typeof dialogLeagueMeta.currentSeason?.seasonNumber === 'number') {
            dialogSeasonNumber = dialogLeagueMeta.currentSeason.seasonNumber > 0 ? dialogLeagueMeta.currentSeason.seasonNumber : 1;
        }
        if (!dialogSeasonNumber && Array.isArray(dialogLeagueMeta.seasons) && dialogLeagueMeta.seasons.length > 0) {
            const sn = dialogLeagueMeta.seasons[0]?.seasonNumber;
            if (typeof sn === 'number') dialogSeasonNumber = sn > 0 ? sn : 1;
        }
        if (!dialogSeasonNumber && typeof dialogLeagueMeta.seasonNumber === 'number') {
            dialogSeasonNumber = dialogLeagueMeta.seasonNumber > 0 ? dialogLeagueMeta.seasonNumber : 1;
        }
        if (!dialogSeasonNumber && typeof dialogLeagueMeta.season === 'number') {
            dialogSeasonNumber = dialogLeagueMeta.season > 0 ? dialogLeagueMeta.season : 1;
        }
        const dialogLeagueTitle = `${league?.name || 'League'}${dialogSeasonNumber ? ` - Season ${dialogSeasonNumber}` : ''}`;
        const dialogDateTitle = match?.date
            ? new Date(match.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
            : '';

        return (
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper" keepMounted>
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#d9d9d9',
                    color: '#1f1f1f',
                    p: 0,
                }}>
                    {isMobile ? (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'stretch',
                                justifyContent: 'space-between',
                                px: 0.9,
                                py: 0.65,
                                pr: 5.2,
                                position: 'relative',
                                width: '100%',
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    border: '1px solid rgba(0,0,0,0.28)',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ px: 1, py: 0.55, borderBottom: '1px solid rgba(0,0,0,0.28)' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                        {dialogLeagueTitle}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    <Box sx={{ px: 1, py: 0.5, borderRight: '1px solid rgba(0,0,0,0.28)' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                            Match {computedMatchNumber || ''}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ px: 1, py: 0.5 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
                                            {dialogDateTitle}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <IconButton
                                onClick={onClose}
                                sx={{
                                    color: '#111',
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    backgroundColor: '#e6e6e6',
                                    borderRadius: 0,
                                    width: 36,
                                    height: 36,
                                    '&:hover': { backgroundColor: '#e6e6e6' },
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, py: 1.5, borderRight: '1px solid #888' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase' }}>
                                        {dialogLeagueTitle}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, py: 1.5, borderRight: '1px solid #888' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase' }}>
                                        Match {computedMatchNumber || ''}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, py: 1.5 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                        {dialogDateTitle}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton 
                                onClick={onClose} 
                                sx={{ 
                                    color: 'black',
                                    backgroundColor: '#e6e6e6',
                                    borderRadius: 0,
                                    width: 56,
                                    height: 56,
                                    '&:hover': { backgroundColor: '#e6e6e6' },
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </>
                    )}
                </DialogTitle>
                <DialogContent
                    sx={{
                        p: 0,
                        background: '#262626',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                            display: 'none'
                        },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }}
                >
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return content;
}

export default PlayMatchPagee;

type StatCounterProps = {
    label: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    icon: React.ReactNode;
    compact?: boolean;
};

const StatCounter = ({ label, value, onIncrement, onDecrement, icon, compact = false }: StatCounterProps) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        my: compact ? 0.5 : 2,
        p: compact ? 0.5 : 1,
        borderRadius: 2,
        background: compact ? 'transparent' : 'rgba(0,0,0,0.05)'
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {icon}
            <Typography sx={{ ml: 1.5, fontWeight: 500, fontSize: compact ? '0.9rem' : '1rem', color: '#fff' }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={onDecrement} size="small" sx={{ color: '#fff' , stroke: '#fff' }}><Remove /></IconButton>
            <Typography sx={{ mx: compact ? 1 : 2, fontWeight: 800, minWidth: '20px', textAlign: 'center', color: '#fff' }}>{value}</Typography>
            <IconButton onClick={onIncrement} size="small" sx={{ color: '#fff' ,  stroke: '#fff' }}><Add /></IconButton>
        </Box>
    </Box>
);



