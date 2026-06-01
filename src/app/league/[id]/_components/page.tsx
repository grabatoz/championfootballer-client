'use client';
import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
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
    Slider,
    Stack,
    Avatar,
    useTheme,
    useMediaQuery,
    Fade,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Calendar, Copy, Edit, Settings, Shield, ChevronDown, Trash2, Undo2, Users, Flame, Search, Table, Plus, Share2, MapPin, Crown, Lock } from 'lucide-react';
import { Tooltip, Slide } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import LeagueDetailLoadingSkeleton from '@/Components/loading/LeagueDetailLoadingSkeleton';
import EditMatchPopupLoadingSkeleton from '@/Components/loading/EditMatchPopupLoadingSkeleton';
import ViewTeamPopupLoadingSkeleton from '@/Components/loading/ViewTeamPopupLoadingSkeleton';
import PLAYERIMAGE from '@/Components/images/players.png'
import HomeTeamImage from '@/Components/images/hometeamshirt.png'
import AwayTeamImage from '@/Components/images/awayteamshirt.png'
import FootBallIcon from '@/Components/images/cardfootball.png'
import CardStar from '@/Components/images/cardstar.png'
import DREATEAM from '@/Components/images/dreamteamicon.png'

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
    loading: () => <ViewTeamPopupLoadingSkeleton />,
    ssr: false
});
const PlayerCard = dynamic(() => import('@/Components/playercard/playercard').then(mod => ({ default: mod.default })), {
    loading: () => <CircularProgress />,
    ssr: false
});
const EditMatchPage = dynamic(() => import('@/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage'), {
    loading: () => <EditMatchPopupLoadingSkeleton />,
    ssr: false
});
const MatchDetailsPage = dynamic(() => import('@/app/match/[matchId]/_components/index'), {
    loading: () => <CircularProgress />,
    ssr: false
});
import CloseIcon from '@mui/icons-material/Close';
import { useCombinedMatchRefresh } from '@/lib/useMatchAutoRefresh';
// import { LeaderboardResponse } from '@/types/api';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ShirtImg from '@/Components/images/orage.png'
import homeImg from '@/Components/images/matches.png'
import awayImg from '@/Components/images/2nd champion icon football.png'
import Goals from "@/Components/images/goal.png"
import Assist from "@/Components/images/Assist.png"
import Cleansheet from "@/Components/images/cleansheet.png"
import CleanSheet from "@/Components/images/cleansheet.png"
import Momt from "@/Components/images/MOTM.png"
import MOTM from "@/Components/images/MOTM.png"
import Imapct from "@/Components/images/imapct.png"
import DefensiveImpact from "@/Components/images/defimp.png"
import Mentality from "@/Components/images/metality.png"
import InfoIcon from "@/Components/images/info.png"
import Star from '@mui/icons-material/Star';
import LeagueTable from '@/Components/images/leagutable.png'
import LeagueIcon from '@/Components/images/league icon.png'
import CalendarImg from '@/Components/images/cardcalendar.png'
import ClockImg from '@/Components/images/cardclock.png'
import LocationImg from '@/Components/images/cardlocation.png'
import ViewTeamImg from '@/Components/images/cardviewteam.png'
import RESULTS from '@/Components/images/cardresult.png'
import MATCHRESULT from '@/Components/images/matchresults.png'
import ADDSTATS from '@/Components/images/cardstats.png'
import FIXTURES from '@/Components/images/fixtures.png'
import LEADERBOARD from '@/Components/images/leaderboard.png'
import TableGraphIcon from '@/Components/images/tablegrapicon.png'
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import fieldImg from '@/Components/images/dreamteambgimg.png';
import cflogo from '@/Components/images/champion football logo 3 (1).png';
import { getAvatarBackgroundColor, getAvatarInitials } from '@/lib/avatarInitials';

type Foot = 'L' | 'R';
type ShortPosition = 'GK' | 'DF' | 'MF' | 'WG' | 'ST';
type FIFAStats = { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string };
const WORLD_RANKING_POSITION_OPTIONS = ['Defender', 'Midfielder', 'Forward', 'Goalkeeper'] as const;

type PlayerCardProps = {
    name: string;
    number: string;
    points: number;
    stats: FIFAStats;
    foot: string;
    profileImage?: string;
    shirtIcon?: string;
    width?: number | string;
    height?: number | string;
    hideShareIcon?: boolean;
    position: string;
};

const resolveImageUrl = (value: any): any => {
    if (value == null) return null;
    if (typeof value === 'object' && value.src) {
        return value;
    }
    const raw = String(value).trim();
    if (!raw || raw === 'null' || raw === 'undefined') return null;

    if (
        raw.startsWith('http://') ||
        raw.startsWith('https://') ||
        raw.startsWith('//') ||
        raw.startsWith('data:') ||
        raw.startsWith('blob:')
    ) {
        return raw;
    }

    const apiBase = String(process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!apiBase) {
        return raw.startsWith('/') ? raw : `/${raw}`;
    }

    return `${apiBase}${raw.startsWith('/') ? '' : '/'}${raw}`;
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
    archived?: boolean;
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
    style?: string;
}

interface MatchGuest {
    id: string;
    firstName?: string;
    lastName?: string;
    team?: 'home' | 'away' | string;
}

interface Match {
    manOfTheMatchVotes?: Record<string, string | number>;
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
    guests?: MatchGuest[];
    guestPlayers?: MatchGuest[];
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
const LOCATION_PREVIEW_LIMIT = 45;
const formatLocationForCard = (location?: string): string => {
    if (!location) return '';
    const normalized = location.trim();
    return normalized.length > LOCATION_PREVIEW_LIMIT
        ? `${normalized.slice(0, LOCATION_PREVIEW_LIMIT)}..`
        : normalized;
};

const normalizeId = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const comparableId = (value: unknown): string => {
    const normalized = normalizeId(value);
    return normalized.startsWith('guest-') ? normalized.slice(6) : normalized;
};

const formatPlayerName = (firstName?: string, lastName?: string): string => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    return fullName;
};

// Match player-card naming format: FirstName + last initial (e.g., "Alex K.")
const formatPlayerCardStyleName = (firstName?: string, lastName?: string): string => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName) return 'Player Name';
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstNameOnly = parts[0] || '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    if (!firstNameOnly) return 'Player Name';
    return lastInitial ? `${firstNameOnly} ${lastInitial}.` : firstNameOnly;
};

const getTopMotmPlayerName = (match: Match, fallbackPlayers: User[] = []): string | null => {
    const votes = match.manOfTheMatchVotes;
    if (!votes || typeof votes !== 'object') return null;

    const voteEntries = Object.entries(votes as Record<string, unknown>);
    if (voteEntries.length === 0) return null;

    const voteCounts: Record<string, number> = {};
    const valuesAreCounts = voteEntries.every(([, value]) => typeof value === 'number');

    if (valuesAreCounts) {
        voteEntries.forEach(([playerId, count]) => {
            const normalizedId = normalizeId(playerId);
            if (!normalizedId) return;
            voteCounts[normalizedId] = (voteCounts[normalizedId] || 0) + Number(count || 0);
        });
    } else {
        voteEntries.forEach(([, votedForId]) => {
            const normalizedId = normalizeId(votedForId);
            if (!normalizedId) return;
            voteCounts[normalizedId] = (voteCounts[normalizedId] || 0) + 1;
        });
    }

    let topPlayerId = '';
    let maxVotes = 0;
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            topPlayerId = playerId;
        }
    });

    if (!topPlayerId || maxVotes <= 0) return null;

    const rawGuests = (match.guests && match.guests.length > 0 ? match.guests : match.guestPlayers) || [];
    const guestUsers: User[] = rawGuests
        .filter((guest) => normalizeId(guest.id) !== '')
        .map((guest) => ({
            id: `guest-${normalizeId(guest.id)}`,
            firstName: guest.firstName || 'Guest',
            lastName: guest.lastName || 'Player',
            email: '',
            positionType: undefined,
            shirtNumber: undefined,
            xp: 0,
        }));

    const allPlayers: User[] = [
        ...(match.homeTeamUsers || []),
        ...(match.awayTeamUsers || []),
        ...fallbackPlayers,
        ...guestUsers
    ];
    const winningPlayer = allPlayers.find((player) => {
        const playerId = normalizeId(player.id);
        if (!playerId) return false;
        return playerId === topPlayerId || comparableId(playerId) === comparableId(topPlayerId);
    });

    if (!winningPlayer) return null;
    const winnerName = formatPlayerName(winningPlayer.firstName, winningPlayer.lastName);
    return winnerName || null;
};

const LEADERBOARD_METRIC_CONFIG = [
    {
        key: 'goals',
        label: 'GOALS',
        icon: Goals,
        infoSummary: 'Ranks players by total goals in completed matches.',
        infoFormula: 'Adds every goal recorded in match stats for the selected league and season.',
    },
    {
        key: 'assists',
        label: 'ASSISTS',
        icon: Assist,
        infoSummary: 'Ranks players by total assists in completed matches.',
        infoFormula: 'Adds every assist recorded in match stats for the selected league and season.',
    },
    {
        key: 'motm',
        label: 'MOTM VOTES',
        icon: MOTM,
        infoSummary: 'Ranks players by Man of the Match votes received.',
        infoFormula: 'Counts all votes where the player was selected as MOTM in the selected league and season.',
    },
    {
        key: 'impact',
        label: 'DEFENSIVE HERO VOTES',
        icon: Imapct,
        infoSummary: 'Ranks players by defensive hero selections.',
        infoFormula: 'Counts captain defensive picks from both teams in RESULT_PUBLISHED matches.',
    },
    {
        key: 'cleanSheet',
        label: 'CLEAN SHEETS',
        icon: CleanSheet,
        infoSummary: 'Ranks players by clean sheets in completed matches.',
        infoFormula: 'Adds clean-sheet entries saved in match stats for the selected league and season.',
    },
    {
        key: 'contribution',
        label: 'CONTRIBUTION INDEX %',
        icon: Goals,
        infoSummary: 'Shows overall contribution as a percentage.',
        infoFormula: 'Averages each player’s match impact percentage from RESULT_PUBLISHED matches for the selected league/season.',
    },
] as const;

type LeaderboardMetricKey = (typeof LEADERBOARD_METRIC_CONFIG)[number]['key'];




// Add TableData type
interface TableData {
    xp: number;
    id: string;
    name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
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
    console.log('league archived status:', league?.archived, '| league active:', league?.active, '| league name:', league?.name)
    const [error, setError] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [hasLoadedAllLeagues, setHasLoadedAllLeagues] = useState(false);
    const [allLeaguesFetchFailed, setAllLeaguesFetchFailed] = useState(false);
    const { user, token, loading: authLoading, isAuthenticated } = useAuth();
    const params = useParams();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const leagueId = params?.id ? String(params.id) : '';
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<'members' | 'matches' | 'dream-team' | 'results' | 'table' | 'leaderboard'>('table');
    const [selectedMemberPosition, setSelectedMemberPosition] = useState<string>('all');
    const [memberPositionMenuAnchor, setMemberPositionMenuAnchor] = useState<null | HTMLElement>(null);
    const tableScrollRef = React.useRef<HTMLDivElement | null>(null);
    const [tableScrollPercent, setTableScrollPercent] = useState(0);
    const [tableHasHorizontalOverflow, setTableHasHorizontalOverflow] = useState(false);
    const searchParams = useSearchParams();
    const profilePlayerId = typeof searchParams?.get === 'function' ? searchParams.get('profilePlayerId') : '';
    const initialSeasonIdFromQuery = typeof searchParams?.get === 'function'
        ? (searchParams.get('seasonId') || '').trim()
        : '';
    const [hasCommonLeague, setHasCommonLeague] = useState(false);
    const [, setCheckedCommonLeague] = useState(false);
    const [userLeagueXP, setUserLeagueXP] = useState<Record<string, number>>({});
    const syncTableHorizontalScroll = useCallback(() => {
        const scrollEl = tableScrollRef.current;
        if (!scrollEl) {
            setTableHasHorizontalOverflow(false);
            setTableScrollPercent(0);
            return;
        }
        const maxScrollLeft = Math.max(scrollEl.scrollWidth - scrollEl.clientWidth, 0);
        setTableHasHorizontalOverflow(maxScrollLeft > 0);
        setTableScrollPercent(maxScrollLeft > 0 ? (scrollEl.scrollLeft / maxScrollLeft) * 100 : 0);
    }, []);
    const handleTableSliderChange = useCallback((_event: Event, value: number | number[]) => {
        const sliderValue = Array.isArray(value) ? value[0] : value;
        const scrollEl = tableScrollRef.current;
        if (!scrollEl) return;
        const maxScrollLeft = Math.max(scrollEl.scrollWidth - scrollEl.clientWidth, 0);
        scrollEl.scrollLeft = (sliderValue / 100) * maxScrollLeft;
        setTableScrollPercent(sliderValue);
    }, []);
    const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null;
    const normalizeEntityId = (value: unknown): string => String(value ?? '').trim();
    const toNumericValue = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    };
    const normalizeXPMapPayload = useCallback((payload: unknown): Record<string, number> => {
        const normalized: Record<string, number> = {};

        const addEntry = (id: unknown, xpValue: unknown) => {
            const key = normalizeEntityId(id);
            if (!key) return;
            const xpNum = toNumericValue(xpValue);
            if (xpNum === null) return;
            normalized[key] = xpNum;
        };

        const parseEntry = (entry: unknown) => {
            if (!isRecord(entry)) return;
            const idCandidate =
                entry.userId ??
                entry.user_id ??
                entry.playerId ??
                entry.player_id ??
                entry.memberId ??
                entry.member_id ??
                entry.id;
            const xpCandidate =
                entry.xp ??
                entry.totalXP ??
                entry.total_xp ??
                entry.points ??
                entry.value;
            addEntry(idCandidate, xpCandidate);
        };

        const parseCollection = (collection: unknown) => {
            if (Array.isArray(collection)) {
                collection.forEach(parseEntry);
                return;
            }
            if (!isRecord(collection)) return;

            // Shape: { "<userId>": 123 } OR { "<userId>": { xp: 123 } }
            Object.entries(collection).forEach(([key, value]) => {
                if (isRecord(value)) {
                    const nestedXp =
                        value.xp ??
                        value.totalXP ??
                        value.total_xp ??
                        value.points ??
                        value.value;
                    addEntry(key, nestedXp);
                } else {
                    addEntry(key, value);
                }
            });
        };

        if (isRecord(payload)) {
            const primary =
                payload.xp ??
                (isRecord(payload.data) ? payload.data.xp : undefined) ??
                payload.data ??
                payload.players ??
                payload.rows ??
                payload.items;

            if (primary !== undefined) {
                parseCollection(primary);
            } else {
                parseCollection(payload);
            }
        } else {
            parseCollection(payload);
        }

        return normalized;
    }, []);
    const getLeagueXpForMember = useCallback((memberId: unknown, _fallbackXp?: unknown): number => {
        void _fallbackXp;
        const key = normalizeEntityId(memberId);
        const mapValue = key ? toNumericValue(userLeagueXP[key]) : null;
        // League page must show league-specific XP only (from league XP map), not global profile XP.
        return mapValue ?? 0;
    }, [userLeagueXP]);
    const getMemberPositionLabel = useCallback((member: User): string => {
        const fromPosition = (member.position ?? '').toString().trim();
        if (fromPosition) return fromPosition;
        const fromPositionType = String((member as unknown as { positionType?: unknown })?.positionType ?? '').trim();
        if (fromPositionType) return fromPositionType;
        return '-';
    }, []);
    const normalizeToWorldRankingPosition = useCallback((positionLabel: string): string => {
        const value = (positionLabel || '').toLowerCase().trim();
        if (!value || value === '-') return '-';

        if (value.includes('goalkeeper') || value.includes('(gk)') || value === 'gk') return 'Goalkeeper';

        if (
            value.includes('defender') ||
            value.includes('back') ||
            value.includes('wing-back') ||
            value === 'cb' || value.includes('(cb)') ||
            value === 'rb' || value.includes('(rb)') ||
            value === 'lb' || value.includes('(lb)') ||
            value === 'rwb' || value.includes('(rwb)') ||
            value === 'lwb' || value.includes('(lwb)')
        ) {
            return 'Defender';
        }

        if (
            value.includes('midfielder') ||
            value === 'cm' || value.includes('(cm)') ||
            value === 'cdm' || value.includes('(cdm)') ||
            value === 'cam' || value.includes('(cam)') ||
            value === 'rm' || value.includes('(rm)') ||
            value === 'lm' || value.includes('(lm)')
        ) {
            return 'Midfielder';
        }

        if (
            value.includes('forward') ||
            value.includes('striker') ||
            value.includes('winger') ||
            value === 'st' || value.includes('(st)') ||
            value === 'cf' || value.includes('(cf)') ||
            value === 'rf' || value.includes('(rf)') ||
            value === 'lf' || value.includes('(lf)') ||
            value === 'rw' || value.includes('(rw)') ||
            value === 'lw' || value.includes('(lw)')
        ) {
            return 'Forward';
        }

        return positionLabel;
    }, []);
    const memberPositionOptions = WORLD_RANKING_POSITION_OPTIONS;
    const sortedMembersForTable = React.useMemo(() => {
        const members = league?.members ? [...league.members] : [];

        members.sort((a: User, b: User) => {
            const xpA = getLeagueXpForMember(a?.id, a?.xp);
            const xpB = getLeagueXpForMember(b?.id, b?.xp);

            if (xpB !== xpA) return xpB - xpA;

            const nameA = `${a?.firstName ?? ''} ${a?.lastName ?? ''}`.trim();
            const nameB = `${b?.firstName ?? ''} ${b?.lastName ?? ''}`.trim();
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        });

        return members;
    }, [league?.members, getLeagueXpForMember]);
    const filteredMembersForTable = useMemo(() => {
        if (selectedMemberPosition === 'all') return sortedMembersForTable;
        return sortedMembersForTable.filter((member: User) =>
            normalizeToWorldRankingPosition(getMemberPositionLabel(member)).toLowerCase() === selectedMemberPosition.toLowerCase()
        );
    }, [sortedMembersForTable, selectedMemberPosition, getMemberPositionLabel, normalizeToWorldRankingPosition]);
    useEffect(() => {
        if (selectedMemberPosition === 'all') return;
        const hasSelectedPosition = memberPositionOptions.some(
            (position) => position.toLowerCase() === selectedMemberPosition.toLowerCase()
        );
        if (!hasSelectedPosition) {
            setSelectedMemberPosition('all');
        }
    }, [memberPositionOptions, selectedMemberPosition]);
    const memberPositionMenuOpen = Boolean(memberPositionMenuAnchor);
    const handleMemberPositionMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setMemberPositionMenuAnchor(event.currentTarget);
    }, []);
    const handleMemberPositionMenuClose = useCallback(() => {
        setMemberPositionMenuAnchor(null);
    }, []);
    const handleMemberPositionChange = useCallback((position: string) => {
        setSelectedMemberPosition(position);
        setMemberPositionMenuAnchor(null);
    }, []);
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
    const [viewTeamMatch, setViewTeamMatch] = React.useState<{ leagueId: string; matchId: string; matchNumber?: number } | null>(null);
    // Leagues dropdown state
    const [allLeagues, setAllLeagues] = useState<League[]>([]);
    const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
    const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);

    // Season dropdown state
    const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
    const [seasonDropdownAnchor, setSeasonDropdownAnchor] = useState<null | HTMLElement>(null);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(initialSeasonIdFromQuery || null);
    const [seasonOptions, setSeasonOptions] = useState<Array<{
        id: string;
        seasonNumber: number;
        isActive?: boolean;
        active?: boolean;
        status?: string | null;
        inviteCode?: string;
        seasonInviteCode?: string;
        inviteLink?: string;
    }>>([]);
    const seasonCreatedToastShownRef = React.useRef(false);

    // Match detail modal state
    const [matchDetailModalOpen, setMatchDetailModalOpen] = useState(false);
    const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);

    // Results popup dialog state
    const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
    const [resultsDialogMatchId, setResultsDialogMatchId] = useState<string | null>(null);
    const [matchClockMs, setMatchClockMs] = useState<number>(() => Date.now());

    // Confirmation dialog state
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [matchPendingDelete, setMatchPendingDelete] = useState<Match | null>(null);
    const [matchHasData, setMatchHasData] = useState<boolean | null>(null);
    const [matchDeleteChecking, setMatchDeleteChecking] = useState(false);
    // const [undoInfo, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);
    const [undoInfo, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);

    const [archivedActionOpen, setArchivedActionOpen] = useState(false);
    const [archivedActionMatch, setArchivedActionMatch] = useState<Match | null>(null);

    // Edit Match Dialog state
    const [editMatchDialogOpen, setEditMatchDialogOpen] = useState(false);
    const [editMatchId, setEditMatchId] = useState<string | null>(null);

    // Leaderboard state
    const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetricKey>('goals');
    const [leaderboardPlayers, setLeaderboardPlayers] = useState<Array<{ id: string; name: string; positionType: string; value: number }>>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [allLeaderboardData, setAllLeaderboardData] = useState<Record<string, Array<{ id: string; name: string; positionType: string; value: number }>>>({});
    const [leaderboardInfoMetric, setLeaderboardInfoMetric] = useState<LeaderboardMetricKey | null>(null);
    const selectedLeaderboardInfo = useMemo(
        () => LEADERBOARD_METRIC_CONFIG.find((metric) => metric.key === leaderboardInfoMetric) || null,
        [leaderboardInfoMetric]
    );

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
        defensiveImpact?: number;
        mentality?: number;
        lastFive?: Array<{ result: 'W' | 'D' | 'L' }>;
        trophyTitle?: string;
        xpLatest?: number;
        xpRecentTotal?: number;
        profileXP?: number;
    }>({});

    // Dream Team state
    const [dreamTeam, setDreamTeam] = useState<{
        goalkeeper: Array<{ id: string; firstName: string; lastName: string; position: string; profilePicture?: string; xp: number }>;
        defenders: Array<{ id: string; firstName: string; lastName: string; position: string; profilePicture?: string; xp: number }>;
        midfielders: Array<{ id: string; firstName: string; lastName: string; position: string; profilePicture?: string; xp: number }>;
        forwards: Array<{ id: string; firstName: string; lastName: string; position: string; profilePicture?: string; xp: number }>;
    }>({
        goalkeeper: [],
        defenders: [],
        midfielders: [],
        forwards: []
    });
    const [dreamTeamLoading, setDreamTeamLoading] = useState(false);

    useEffect(() => {
        if (!token || !leagueId) return;
        const seasonsUnknown = (league as unknown as { seasons?: unknown })?.seasons;
        const hasSeasons = Array.isArray(seasonsUnknown) && seasonsUnknown.length > 0;
        if (hasSeasons && !selectedSeasonId) return;

        let cancelled = false;
        (async () => {
            try {
                const params = new URLSearchParams({ leagueId });
                if (selectedSeasonId) {
                    params.append('seasonId', selectedSeasonId);
                }
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (cancelled) return;
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
                if (cancelled) return;
                setLeagueWinners({});
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, leagueId, selectedSeasonId, league]);

    const handlePermanentDelete = useCallback(async (match: Match) => {
        // if (!window.confirm('Are you sure you want to PERMANENTLY delete this match? This action cannot be undone and all match data will be lost forever.')) {
        //     return;
        // }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

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
        const ok = window.confirm('Permanently delete this archived match? It cannot be restored later, but player stats/history will stay preserved.');
        if (!ok) return;
        await handlePermanentDelete(archivedActionMatch);
        setArchivedActionOpen(false);
    }, [archivedActionMatch, handlePermanentDelete]);

    const handlePermanentDeleteFromArchivedCard = useCallback(async (match: Match) => {
        const ok = window.confirm('Permanently delete this archived match? It cannot be restored later, but player stats/history will stay preserved.');
        if (!ok) return;
        await handlePermanentDelete(match);
    }, [handlePermanentDelete]);

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
                toast.error('Stats saving is not available yet. Please contact the administrator.');
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
        if (tab === 'table' || tab === 'leaderboard' || tab === 'members' || tab === 'matches' || tab === 'results') {
            setSection(tab);
        }
    }, [searchParams]);

    // Sync season from query param (used after creating a new season and redirecting)
    useEffect(() => {
        const querySeasonId = typeof searchParams?.get === 'function'
            ? (searchParams.get('seasonId') || '').trim()
            : '';
        if (querySeasonId && querySeasonId !== selectedSeasonId) {
            setSelectedSeasonId(querySeasonId);
        }
    }, [searchParams, selectedSeasonId]);

    // Show creation message after redirect from season creation flows
    useEffect(() => {
        if (seasonCreatedToastShownRef.current) return;
        const createdFlag = searchParams?.get('seasonCreated');
        if (createdFlag !== '1') return;
        const queryMessage = (searchParams?.get('seasonCreatedMsg') || '').trim();
        toast.success(queryMessage || 'New season created successfully!');
        seasonCreatedToastShownRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        const handleSignOutStart = () => setIsSigningOut(true);
        window.addEventListener('app-signout-start', handleSignOutStart as EventListener);
        return () => {
            window.removeEventListener('app-signout-start', handleSignOutStart as EventListener);
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            setIsSigningOut(false);
        } else {
            setError(null);
        }
    }, [isAuthenticated]);

    // Declare isMember and isAdmin here so they are available for useEffect and logic below
    const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
    const isAdmin = !!(
        league &&
        user &&
        (
            (league.adminId && league.adminId === user.id) ||
            (league.administrators && league.administrators.some((a: User) => a.id === user.id))
        )
    );


    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    console.log('league', league)

    const fetchLeagueDetails = useCallback(async (seasonIdOverride?: string | null) => {
        if (!token || !leagueId || isSigningOut) return;
        try {
            setError((prev) => (prev === 'No leagues found' ? prev : null));
            console.log("Fetching league details - Token:", token ? 'Present' : 'Missing');

            // Add cache busting to force fresh data from backend
            const params = new URLSearchParams();
            params.set('_t', String(Date.now()));
            const seasonIdForRequest = seasonIdOverride ?? selectedSeasonId;
            if (seasonIdForRequest) {
                params.set('seasonId', seasonIdForRequest);
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let apiMessage = '';
                try {
                    const errorPayload = await response.json();
                    const payloadRecord = (errorPayload && typeof errorPayload === 'object')
                        ? (errorPayload as Record<string, unknown>)
                        : {};
                    apiMessage = String(
                        payloadRecord.message ??
                        payloadRecord.error ??
                        payloadRecord.detail ??
                        ''
                    ).trim();
                } catch {
                    // ignore non-json responses
                }

                const status = response.status;
                const messageNormalized = apiMessage.toLowerCase();
                const looksLikeAccessIssue =
                    status === 401 ||
                    status === 403 ||
                    status === 404 ||
                    messageNormalized.includes('access') ||
                    messageNormalized.includes('not found');

                if (looksLikeAccessIssue) {
                    // Avoid flashing fetch/access errors during signout/auth transition.
                    if (isSigningOut || !isAuthenticated) return;

                    // If user has no leagues, show friendly empty-state message.
                    if (hasLoadedAllLeagues && !allLeaguesFetchFailed && allLeagues.length === 0) {
                        setLeague(null);
                        setError('No leagues found');
                        return;
                    }

                    // If user has other leagues, fallback redirect effect will switch to a valid league.
                    setError(null);
                    return;
                }

                throw new Error(apiMessage || `HTTP error! status: ${status}`);
            }

            const data = await response.json();
            console.log('League details fetched successfully from API', data);
            if (data.success) {
                setError(null);
                console.log('Fresh League Data Received:', data.league);
                console.log('Total Matches:', data.league.matches?.length || 0);
                console.log('Total Members:', data.league.members?.length || 0);
                console.log('Members:', data.league.members?.map((m: User) => `${m.firstName} ${m.lastName}`));
                console.log('Seasons:', data.league.seasons);
                if (Array.isArray(data.league.seasons)) {
                    data.league.seasons.forEach((seasonUnknown: unknown, i: number) => {
                        const seasonRecord = (seasonUnknown && typeof seasonUnknown === 'object')
                            ? (seasonUnknown as Record<string, unknown>)
                            : {};
                        const members = Array.isArray(seasonRecord.members)
                            ? seasonRecord.members.map((memberUnknown: unknown) => {
                                const memberRecord = (memberUnknown && typeof memberUnknown === 'object')
                                    ? (memberUnknown as Record<string, unknown>)
                                    : {};
                                return `${String(memberRecord.firstName || '')} ${String(memberRecord.lastName || '')}`.trim();
                            })
                            : 'no members array';
                        console.log(`  Season ${i + 1}:`, {
                            id: seasonRecord.id,
                            seasonNumber: seasonRecord.seasonNumber,
                            members
                        });
                    });
                }
                if (data.league.matches) {
                    data.league.matches.forEach((match: Match, index: number) => {
                        console.log(`  Match ${index + 1}: ${match.homeTeamName} vs ${match.awayTeamName} | Status: ${match.status}`);
                    });
                }
                setLeague(data.league);
                try {
                    const preferredId = String((data.league as Record<string, unknown>)?.id || leagueId || '').trim();
                    if (preferredId) {
                        localStorage.setItem('preferredLeagueId', preferredId);
                    }
                } catch {
                    // ignore localStorage errors
                }
                console.log('League state updated successfully');
            } else {
                const apiMessage = String(data.message || '').trim();
                const normalizedMessage = apiMessage.toLowerCase();
                const looksLikeAccessIssue =
                    normalizedMessage.includes('access') ||
                    normalizedMessage.includes('not found');
                if (looksLikeAccessIssue && hasLoadedAllLeagues && !allLeaguesFetchFailed && allLeagues.length === 0) {
                    setLeague(null);
                    setError('No leagues found');
                } else if (looksLikeAccessIssue) {
                    setError(null);
                } else {
                    setError(apiMessage || 'Failed to fetch league details');
                }
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error fetching league details:', error);
            if (isSigningOut || !isAuthenticated) return;
            setError('Failed to fetch league details');
        }
    }, [
        leagueId,
        token,
        selectedSeasonId,
        isSigningOut,
        isAuthenticated,
        hasLoadedAllLeagues,
        allLeaguesFetchFailed,
        allLeagues.length
    ]);

    // Fetch dream team data based on selected league and season
    const fetchDreamTeam = useCallback(async () => {
        if (!leagueId || !token) return;

        setDreamTeamLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('leagueId', leagueId);
            if (selectedSeasonId) {
                params.append('seasonId', selectedSeasonId);
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dream-team?${params.toString()}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('Dream Team API Response:', data);
                if (data?.dreamTeam) {
                    console.log('Dream Team Data:', data.dreamTeam);
                    console.log('Forwards:', data.dreamTeam.forwards);
                    console.log('Midfielders:', data.dreamTeam.midfielders);
                    console.log('Defenders:', data.dreamTeam.defenders);
                    setDreamTeam(data.dreamTeam);
                }
            }
        } catch (error) {
            console.error('Error fetching dream team:', error);
        } finally {
            setDreamTeamLoading(false);
        }
    }, [leagueId, token, selectedSeasonId]);

    // Fetch dream team when section changes to 'dream-team' or when season changes
    useEffect(() => {
        if (section === 'dream-team') {
            fetchDreamTeam();
        }
    }, [section, fetchDreamTeam]);

    useEffect(() => {
        // Wait for auth to finish loading, user to be authenticated, and token to be available
        if (authLoading) return;
        if (!isAuthenticated || !token || !leagueId) return;
        fetchLeagueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, authLoading, isAuthenticated, leagueId]);

    // 🎯 Auto-select active season when league data loads
    useEffect(() => {
        if (!league || selectedSeasonId) return; // Skip if already selected

        if (Array.isArray(seasonOptions) && seasonOptions.length > 0) {
            const activeFromSeasonsApi = seasonOptions.find((season) => {
                const status = String(season.status || '').trim().toLowerCase();
                return season.isActive === true || season.active === true || status === 'active' || status === 'current' || status === 'ongoing';
            });
            const seasonToPick = activeFromSeasonsApi || seasonOptions[0];
            if (seasonToPick?.id) {
                console.log('🎯 Auto-selecting season from seasons API:', seasonToPick.id, seasonToPick.seasonNumber);
                setSelectedSeasonId(seasonToPick.id);
                void fetchLeagueDetails(seasonToPick.id);
                return;
            }
        }

        const currentSeasonUnknown = (league as unknown as Record<string, unknown>)?.currentSeason;
        if (currentSeasonUnknown && typeof currentSeasonUnknown === 'object') {
            const currentSeasonObj = currentSeasonUnknown as Record<string, unknown>;
            const currentSeasonId = String(currentSeasonObj?.id || '').trim();
            if (currentSeasonId) {
                console.log('🎯 Auto-selecting current season from backend:', currentSeasonId);
                setSelectedSeasonId(currentSeasonId);
                void fetchLeagueDetails(currentSeasonId);
                return;
            }
        }

        const seasonsUnknown = (league as unknown as Record<string, unknown>)?.seasons;
        if (!Array.isArray(seasonsUnknown) || seasonsUnknown.length === 0) return;

        // Find active season
        const activeSeason = seasonsUnknown.find((s: unknown) => {
            const seasonObj = s as Record<string, unknown>;
            return seasonObj?.isActive === true;
        });

        if (activeSeason) {
            const seasonObj = activeSeason as Record<string, unknown>;
            const activeSeasonId = String(seasonObj.id || '');
            console.log('🎯 Auto-selecting active season:', activeSeasonId);
            setSelectedSeasonId(activeSeasonId);
            void fetchLeagueDetails(activeSeasonId);
        } else {
            // If no active season found, select the latest season (highest season number)
            const sortedSeasons = [...seasonsUnknown].sort((a: unknown, b: unknown) => {
                const aNum = (a as Record<string, unknown>)?.seasonNumber as number || 0;
                const bNum = (b as Record<string, unknown>)?.seasonNumber as number || 0;
                return bNum - aNum; // Descending order
            });

            if (sortedSeasons.length > 0) {
                const latestSeason = sortedSeasons[0] as Record<string, unknown>;
                const latestSeasonId = String(latestSeason.id || '');
                console.log('🎯 Auto-selecting latest season:', latestSeasonId);
                setSelectedSeasonId(latestSeasonId);
                void fetchLeagueDetails(latestSeasonId);
            }
        }
    }, [league, selectedSeasonId, seasonOptions, fetchLeagueDetails]);

    // 🔄 Refresh league data when page becomes visible (e.g., user comes back from settings)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && token && leagueId) {
                console.log('🔄 Page became visible, refreshing league data...');
                fetchLeagueDetails();
            }
        };

        const handleFocus = () => {
            if (token && leagueId) {
                console.log('🔄 Window focused, refreshing league data...');
                fetchLeagueDetails();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchLeagueDetails, token, leagueId]);

    // 🔄 Auto-refresh: Event-driven (immediate) + Periodic check every 1 minute
    // This handles both manual operations AND automatic match completion detection
    useCombinedMatchRefresh(fetchLeagueDetails, 60000); // Check every 60 seconds

    // Keep a lightweight local clock so fixtures/results can transition automatically.
    useEffect(() => {
        const timer = window.setInterval(() => {
            setMatchClockMs(Date.now());
        }, 30000);
        return () => window.clearInterval(timer);
    }, []);

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

    const completedStatusTokens = useMemo(
        () => new Set([
            'completed',
            'complete',
            'finished',
            'ended',
            'result_published',
            'result_uploaded',
            'result_complete',
            'result_finished',
            'result_ended',
            'result_done',
            'closed',
        ]),
        []
    );

    // Helper: determine if a league is completed (kept in sync with All Leagues card logic)
    const leagueIsCompleted = useCallback((l: League): boolean => {
        const withFlags = l as League & {
            isComplete?: boolean;
            isCompleted?: boolean;
            archived?: boolean;
            seasons?: Array<{
                isActive?: boolean;
                archived?: boolean;
                status?: unknown;
            }>;
        };

        const status = String(l?.status || '').toLowerCase().trim();
        if (completedStatusTokens.has(status)) return true;

        if (
            l?.computedStatus?.isComplete === true ||
            l?.computedStatus?.isCompleted === true ||
            l?.computedStatus?.locked === true ||
            withFlags.isComplete === true ||
            withFlags.isCompleted === true ||
            l?.isLocked === true
        ) {
            return true;
        }

        // Season-level fallback kept in sync with All Leagues.
        const seasons = Array.isArray(withFlags.seasons) ? withFlags.seasons : [];
        if (seasons.length > 0) {
            const seasonDoneTokens = new Set([
                'completed',
                'complete',
                'finished',
                'ended',
                'locked',
                'archived',
                'result_published',
                'result_uploaded',
                'result_complete',
                'result_finished',
                'result_ended',
                'result_done',
            ]);
            const hasActiveSeason = seasons.some((s) => s?.isActive === true && s?.archived !== true);
            const hasArchivedOrCompletedSeason = seasons.some((s) => {
                if (!s) return false;
                if (s.archived === true) return true;
                const st = typeof s.status === 'string' ? s.status.toLowerCase().trim() : '';
                return seasonDoneTokens.has(st);
            });
            if (!hasActiveSeason && hasArchivedOrCompletedSeason) return true;
        }

        return false;
    }, [completedStatusTokens]);

    // Fetch all user leagues for dropdown
    const fetchAllLeagues = useCallback(async () => {
        if (!token) return;

        try {
            setHasLoadedAllLeagues(false);
            setAllLeaguesFetchFailed(false);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status?refresh=1&_t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                setAllLeagues([]);
                setAllLeaguesFetchFailed(true);
                return;
            }

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

                // Keep leagues visible for switching, including inactive ones.
                // Only hide archived/completed leagues.
                const visibleLeagues = simpleLeagues.filter(
                    (l) => l.archived !== true && !leagueIsCompleted(l)
                );

                // Sort alphabetically by name
                visibleLeagues.sort((a, b) => {
                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return String(a.id).localeCompare(String(b.id));
                });

                setAllLeagues(visibleLeagues);
                if (visibleLeagues.length === 0) {
                    try {
                        localStorage.removeItem('preferredLeagueId');
                        localStorage.removeItem('prefferdLeagueId');
                    } catch {
                        // ignore localStorage errors
                    }
                }

                // Debug log
                console.log('[League Detail] Fetched leagues:', {
                    total: simpleLeagues.length,
                    visible: visibleLeagues.length,
                    hidden: simpleLeagues.length - visibleLeagues.length
                });
            } else {
                setAllLeagues([]);
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
            setAllLeagues([]);
            setAllLeaguesFetchFailed(true);
        } finally {
            setHasLoadedAllLeagues(true);
        }
    }, [token, leagueIsCompleted]);

    useEffect(() => {
        if (!token) return;
        const refreshAllLeagues = () => {
            void fetchAllLeagues();
        };
        const handleLeagueMutation = (evt: Event) => {
            const customEvt = evt as CustomEvent<{ leagueId?: string | number }>;
            const changedLeagueId = String(customEvt?.detail?.leagueId ?? '').trim();
            if (!changedLeagueId || String(leagueId) === changedLeagueId) {
                void fetchLeagueDetails();
            }
            refreshAllLeagues();
        };

        window.addEventListener('league-created', handleLeagueMutation as EventListener);
        window.addEventListener('league-updated', handleLeagueMutation as EventListener);
        window.addEventListener('league-deleted', handleLeagueMutation as EventListener);
        window.addEventListener('league-joined', handleLeagueMutation as EventListener);

        return () => {
            window.removeEventListener('league-created', handleLeagueMutation as EventListener);
            window.removeEventListener('league-updated', handleLeagueMutation as EventListener);
            window.removeEventListener('league-deleted', handleLeagueMutation as EventListener);
            window.removeEventListener('league-joined', handleLeagueMutation as EventListener);
        };
    }, [token, leagueId, fetchLeagueDetails, fetchAllLeagues]);

    // Fetch XP for all users in this league (from API)
    // Also refetch when league details refresh so table XP does not stay stale.
    useEffect(() => {
        async function fetchXP() {
            if (!league?.id) return;
            try {
                const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
                const params = new URLSearchParams();
                if (selectedSeasonId) params.append('seasonId', selectedSeasonId);
                params.append('_t', String(Date.now())); // Cache-bust XP endpoint for immediate latest value.
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/xp?${params.toString()}`,
                    { headers, cache: 'no-store' }
                );
                if (!res.ok) {
                    // Silently handle 404 - endpoint may not exist yet
                    console.warn(`XP endpoint returned ${res.status}, using empty map`);
                    setUserLeagueXP({});
                    return;
                }
                const json = await res.json().catch(() => ({}));
                console.log('📊 XP API response:', JSON.stringify(json));
                if (json?.success === undefined || json?.success) {
                    const xpMap = normalizeXPMapPayload(json);
                    console.log('📊 XP map set to (normalized):', JSON.stringify(xpMap));
                    setUserLeagueXP(xpMap);
                } else {
                    console.log('📊 XP API returned success=false, using empty map');
                    setUserLeagueXP({});
                }
            } catch {
                setUserLeagueXP({});
            }
        }
        fetchXP();
    }, [league?.id, league?.updatedAt, league?.matches, league?.members, token, selectedSeasonId, normalizeXPMapPayload]);

    // Fetch all leagues for dropdown
    useEffect(() => {
        if (!token) {
            setAllLeagues([]);
            setHasLoadedAllLeagues(false);
            setAllLeaguesFetchFailed(false);
            return;
        }
        fetchAllLeagues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        if (!token || !leagueId || isSigningOut || allLeagues.length === 0) return;

        // If current route league already loaded, do not auto-switch to another league.
        if (league && String(league.id) === String(leagueId)) return;

        const currentLeagueExists = allLeagues.some((leagueItem) => String(leagueItem.id) === String(leagueId));
        if (currentLeagueExists) return;

        let fallbackLeagueId = '';
        try {
            const preferredLeagueId = localStorage.getItem('preferredLeagueId');
            if (preferredLeagueId && allLeagues.some((leagueItem) => String(leagueItem.id) === String(preferredLeagueId))) {
                fallbackLeagueId = preferredLeagueId;
            }
        } catch {
            // ignore localStorage errors
        }

        if (!fallbackLeagueId) {
            fallbackLeagueId = String(allLeagues[0]?.id || '');
        }
        if (!fallbackLeagueId) return;

        try {
            localStorage.setItem('preferredLeagueId', fallbackLeagueId);
        } catch {
            // ignore localStorage errors
        }

        setError(null);
        router.replace(`/league/${encodeURIComponent(fallbackLeagueId)}?tab=table`, { scroll: false });
    }, [token, leagueId, allLeagues, router, league, isSigningOut]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !token || !leagueId || isSigningOut) return;
        if (!hasLoadedAllLeagues || allLeaguesFetchFailed) return;
        if (allLeagues.length > 0 || league) return;
        setError('No leagues found');
    }, [
        authLoading,
        isAuthenticated,
        token,
        leagueId,
        isSigningOut,
        hasLoadedAllLeagues,
        allLeaguesFetchFailed,
        allLeagues.length,
        league
    ]);

    // Fetch seasons from dedicated endpoint to avoid stale/incomplete seasons lists on league payload
    useEffect(() => {
        if (!token || !leagueId) {
            setSeasonOptions([]);
            return;
        }

        let cancelled = false;

        const parseSeasonNumber = (seasonLike: Record<string, unknown>): number => {
            const rawNum = seasonLike.seasonNumber;
            const direct = typeof rawNum === 'number'
                ? rawNum
                : (typeof rawNum === 'string' ? Number(rawNum) : NaN);
            if (Number.isFinite(direct) && direct > 0) return direct;

            const label = String(seasonLike.name || '');
            const hits = label.match(/\d+/g);
            if (hits && hits.length > 0) {
                const parsed = Number(hits[hits.length - 1]);
                if (Number.isFinite(parsed) && parsed > 0) return parsed;
            }
            return 0;
        };

        const fetchSeasonsOptions = async () => {
            try {
                const endpoints = [
                    `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/seasons?_t=${Date.now()}`,
                    `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/seasons?_t=${Date.now()}`,
                ];

                const extractRawSeasons = (payloadUnknown: unknown): unknown[] => {
                    const payloadRecord = (payloadUnknown && typeof payloadUnknown === 'object')
                        ? (payloadUnknown as Record<string, unknown>)
                        : {};
                    const nestedData = (payloadRecord.data && typeof payloadRecord.data === 'object')
                        ? (payloadRecord.data as Record<string, unknown>)
                        : {};

                    return Array.isArray(payloadUnknown)
                        ? payloadUnknown
                        : (
                            Array.isArray(payloadRecord.seasons)
                                ? payloadRecord.seasons
                                : (
                                    Array.isArray(payloadRecord.data)
                                        ? payloadRecord.data
                                        : (Array.isArray(nestedData.seasons) ? nestedData.seasons : [])
                                )
                        );
                };

                const allRawSeasons: unknown[] = [];
                for (const url of endpoints) {
                    try {
                        const response = await fetch(url, {
                            headers: { 'Authorization': `Bearer ${token}` },
                            cache: 'no-store',
                        });
                        if (!response.ok) continue;
                        const payloadUnknown: unknown = await response.json().catch(() => ({}));
                        allRawSeasons.push(...extractRawSeasons(payloadUnknown));
                    } catch {
                        // try next endpoint
                    }
                }

                if (allRawSeasons.length === 0) {
                    if (!cancelled) setSeasonOptions([]);
                    return;
                }

                const parsed = allRawSeasons
                    .map((seasonRaw) => (typeof seasonRaw === 'object' && seasonRaw !== null ? (seasonRaw as Record<string, unknown>) : null))
                    .filter((seasonRaw): seasonRaw is Record<string, unknown> => Boolean(seasonRaw))
                    .map((seasonRaw) => ({
                        id: String(seasonRaw.id ?? seasonRaw._id ?? '').trim(),
                        seasonNumber: parseSeasonNumber(seasonRaw),
                        isActive: seasonRaw.isActive === true,
                        active: seasonRaw.active === true,
                        status: typeof seasonRaw.status === 'string' ? seasonRaw.status : null,
                        inviteCode: typeof seasonRaw.inviteCode === 'string'
                            ? seasonRaw.inviteCode.trim()
                            : (typeof seasonRaw.invite_code === 'string' ? seasonRaw.invite_code.trim() : ''),
                        seasonInviteCode: typeof seasonRaw.seasonInviteCode === 'string'
                            ? seasonRaw.seasonInviteCode.trim()
                            : (typeof seasonRaw.season_invite_code === 'string' ? seasonRaw.season_invite_code.trim() : ''),
                        inviteLink: typeof seasonRaw.inviteLink === 'string'
                            ? seasonRaw.inviteLink.trim()
                            : (typeof seasonRaw.invite_link === 'string' ? seasonRaw.invite_link.trim() : ''),
                    }))
                    .filter((season) => season.id && season.seasonNumber > 0)
                    .filter((season, index, arr) => arr.findIndex((s) => s.id === season.id) === index)
                    .sort((a, b) => {
                        if ((a.isActive === true) !== (b.isActive === true)) return a.isActive ? -1 : 1;
                        if ((a.active === true) !== (b.active === true)) return a.active ? -1 : 1;
                        return b.seasonNumber - a.seasonNumber;
                    });

                if (!cancelled) {
                    setSeasonOptions(parsed);
                }
            } catch (error) {
                if (!cancelled) setSeasonOptions([]);
                console.error('Error fetching seasons options:', error);
            }
        };

        void fetchSeasonsOptions();
        return () => {
            cancelled = true;
        };
    }, [token, leagueId]);


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

    // Handle season dropdown open/close
    const handleSeasonDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
        setSeasonDropdownAnchor(event.currentTarget);
        setSeasonDropdownOpen(true);
    };

    const handleSeasonDropdownClose = () => {
        setSeasonDropdownOpen(false);
        setSeasonDropdownAnchor(null);
    };

    // Handle season selection
    const handleSeasonSelect = async (seasonId: string) => {
        console.log('🎯 Season selected:', seasonId);
        setSelectedSeasonId(seasonId);
        handleSeasonDropdownClose();

        // 🔄 Refresh league data to get latest season settings
        if (token && leagueId) {
            console.log('🔄 Refreshing league data after season selection...');
            await fetchLeagueDetails(seasonId);
        }
    };

    // Handle league selection
    const handleLeagueSelect = async (selectedLeagueId: string) => {
        if (selectedLeagueId !== leagueId) {
            // Reset season selection so the new league shows all its matches
            setSelectedSeasonId(null);

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
                        try {
                            localStorage.setItem('preferredLeagueId', String(selectedLeagueId));
                        } catch {
                            // ignore localStorage errors
                        }

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

    const inactiveLeagueMatchMessage = league && leagueIsCompleted(league)
        ? 'This league is completed. New matches are disabled for completed leagues.'
        : 'This league is currently inactive. To create new matches, please reactivate the league in League Settings.';

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
            const seasonRecords = seasonsUnknown
                .map((season) => (season && typeof season === 'object' ? (season as Record<string, unknown>) : null))
                .filter((season): season is Record<string, unknown> => Boolean(season));

            const activeSeason = seasonRecords.find((season) => {
                const status = String(season.status || '').trim().toLowerCase();
                return (
                    season.isActive === true ||
                    season.active === true ||
                    status === 'active' ||
                    status === 'current' ||
                    status === 'ongoing'
                );
            });
            const latestSeason = [...seasonRecords].sort((a, b) => {
                const aNum = toNum(a.seasonNumber) ?? 0;
                const bNum = toNum(b.seasonNumber) ?? 0;
                return bNum - aNum;
            })[0];
            const fromUserSeason = getNumberLike(activeSeason || latestSeason, ['seasonNumber']);
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

    // Get selected season number from selectedSeasonId
    const selectedSeasonNumber = React.useMemo(() => {
        if (!selectedSeasonId || !league) return currentSeasonNumber;
        const seasonsUnknown = (league as unknown as Record<string, unknown>)?.seasons;
        if (Array.isArray(seasonsUnknown)) {
            const season = seasonsUnknown.find((s: unknown) => {
                const seasonObj = s as Record<string, unknown>;
                return String(seasonObj?.id || '') === selectedSeasonId;
            });
            if (season) {
                const seasonObj = season as Record<string, unknown>;
                return Number(seasonObj?.seasonNumber || currentSeasonNumber);
            }
        }

        const seasonFromOptions = seasonOptions.find((season) => season.id === selectedSeasonId);
        if (seasonFromOptions && seasonFromOptions.seasonNumber > 0) {
            return seasonFromOptions.seasonNumber;
        }
        return currentSeasonNumber;
    }, [selectedSeasonId, league, currentSeasonNumber, seasonOptions]);

    const seasonLabel = React.useMemo(() => (selectedSeasonNumber ? `(#Season ${selectedSeasonNumber})` : ''), [selectedSeasonNumber]);

    const readSeasonInviteCode = useCallback((seasonLike: unknown): string => {
        if (!seasonLike || typeof seasonLike !== 'object') return '';
        const seasonRecord = seasonLike as Record<string, unknown>;
        const codeCandidate = seasonRecord.inviteCode
            ?? seasonRecord.seasonInviteCode
            ?? seasonRecord.invite_code
            ?? seasonRecord.season_invite_code
            ?? seasonRecord.code;
        return typeof codeCandidate === 'string' ? codeCandidate.trim() : '';
    }, []);

    const inviteCodeForSelectedSeason = React.useMemo(() => {
        if (selectedSeasonId) {
            const seasonFromOptions = seasonOptions.find((season) => season.id === selectedSeasonId);
            const codeFromOptions = readSeasonInviteCode(seasonFromOptions);
            if (codeFromOptions) return codeFromOptions;
        }

        const seasonsUnknown = (league as unknown as Record<string, unknown>)?.seasons;
        if (Array.isArray(seasonsUnknown)) {
            const selectedSeasonFromLeague = selectedSeasonId
                ? seasonsUnknown.find((seasonUnknown) => {
                    const seasonRecord = (seasonUnknown && typeof seasonUnknown === 'object')
                        ? (seasonUnknown as Record<string, unknown>)
                        : {};
                    return String(seasonRecord.id || '').trim() === selectedSeasonId;
                })
                : seasonsUnknown[0];

            const selectedSeasonCode = readSeasonInviteCode(selectedSeasonFromLeague);
            if (selectedSeasonCode) return selectedSeasonCode;
        }

        const currentSeasonUnknown = (league as unknown as Record<string, unknown>)?.currentSeason;
        const currentSeasonCode = readSeasonInviteCode(currentSeasonUnknown);
        if (currentSeasonCode) return currentSeasonCode;

        return String(league?.inviteCode || '').trim();
    }, [league, selectedSeasonId, seasonOptions, readSeasonInviteCode]);

    const inviteCodeDisplay = inviteCodeForSelectedSeason || '-';
    const inviteSeasonLabel = `${league?.name || 'League'} - Season ${selectedSeasonNumber || 1}`;
    const invitePlayersMessage = inviteCodeForSelectedSeason
        ? `Invites players to ${inviteSeasonLabel} using the code`
        : `Invite code unavailable for ${inviteSeasonLabel}`;

    const handleCopySeasonInviteCode = useCallback(async () => {
        const code = inviteCodeForSelectedSeason.trim();
        if (!code) {
            toast.error('Invite code is not available for this season yet.');
            return;
        }
        try {
            await navigator.clipboard.writeText(code);
            toast.success('Invite code copied successfully.');
        } catch {
            toast.error('Unable to copy invite code right now.');
        }
    }, [inviteCodeForSelectedSeason]);

    const handleShareSeasonInvite = useCallback(async () => {
        const code = inviteCodeForSelectedSeason.trim();
        if (!code) {
            toast.error('Invite code is not available for this season yet.');
            return;
        }
        const shareText = `Invites players to ${inviteSeasonLabel} using the code ${code}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `League invite - ${inviteSeasonLabel}`,
                    text: shareText,
                });
                return;
            }
        } catch (error) {
            const shareError = error as { name?: string };
            if (shareError?.name === 'AbortError') return;
        }
        try {
            await navigator.clipboard.writeText(shareText);
            toast.success('Invite details copied.');
        } catch {
            toast.error('Unable to share invite details right now.');
        }
    }, [inviteCodeForSelectedSeason, inviteSeasonLabel]);

    // Check if selected season is active
    const isSelectedSeasonActive = React.useMemo(() => {
        if (!selectedSeasonId || !league) return true; // Default to active if no season selected
        const seasonsUnknown = (league as unknown as Record<string, unknown>)?.seasons;
        if (Array.isArray(seasonsUnknown)) {
            const season = seasonsUnknown.find((s: unknown) => {
                const seasonObj = s as Record<string, unknown>;
                return String(seasonObj?.id || '') === selectedSeasonId;
            });
            if (season) {
                const seasonObj = season as Record<string, unknown>;
                return seasonObj?.isActive === true;
            }
        }
        const seasonFromOptions = seasonOptions.find((season) => season.id === selectedSeasonId);
        if (seasonFromOptions) {
            const status = String(seasonFromOptions.status || '').trim().toLowerCase();
            return seasonFromOptions.isActive === true || seasonFromOptions.active === true || status === 'active' || status === 'current' || status === 'ongoing';
        }
        return true; // Default to active
    }, [selectedSeasonId, league, seasonOptions]);

    // Filter matches and members based on selected season
    const filteredLeague = React.useMemo(() => {
        console.log('🔄 filteredLeague useMemo triggered');
        console.log('   - league exists:', !!league);
        console.log('   - selectedSeasonId:', selectedSeasonId);

        if (!league) {
            console.log('❌ No league, returning null');
            return null;
        }

        if (!selectedSeasonId) {
            console.log('ℹ️ No season selected, returning league without archived matches');
            return {
                ...league,
                matches: (league.matches || []).filter(m => !m.archived),
            };
        }

        console.log('🔍 Filtering league for season:', selectedSeasonId);

        // Filter matches by seasonId
        console.log('🔍 All matches in league:', (league.matches || []).length);
        (league.matches || []).forEach((match, index) => {
            const matchSeasonId = (match as unknown as Record<string, unknown>)?.seasonId;
            console.log(`   Match ${index + 1}: ${match.homeTeamName} vs ${match.awayTeamName} | seasonId: ${matchSeasonId} | status: ${match.status}`);
        });

        const filteredMatches = (league.matches || []).filter(match => {
            const matchSeasonId = (match as unknown as Record<string, unknown>)?.seasonId;
            const matches = String(matchSeasonId || '') === selectedSeasonId;
            const notArchived = !match.archived;
            if (!matches) {
                console.log(`   ❌ Match ${match.homeTeamName} vs ${match.awayTeamName} excluded (seasonId: ${matchSeasonId} vs ${selectedSeasonId})`);
            }
            return matches && notArchived;
        });

        console.log('✅ Filtered matches:', filteredMatches.length);
        if (filteredMatches.length > 0) {
            filteredMatches.forEach(m => console.log(`   ✅ ${m.homeTeamName} vs ${m.awayTeamName}`));
        }

        // Get season object and its members
        const seasonsUnknown = (league as unknown as Record<string, unknown>)?.seasons;
        let filteredMembers: User[] = [];
        let seasonMembersPayloadProvided = false;
        let declinedIdsFromSeason = new Set<string>();

        console.log('🔍 All seasons:', seasonsUnknown);

        if (Array.isArray(seasonsUnknown)) {
            const selectedSeason = seasonsUnknown.find((s: unknown) => {
                const seasonObj = s as Record<string, unknown>;
                return String(seasonObj?.id || '') === selectedSeasonId;
            });

            console.log('🔍 Selected season object:', selectedSeason);

            if (selectedSeason) {
                const seasonObj = selectedSeason as Record<string, unknown>;
                const membersUnknown = seasonObj?.members;
                const extractDeclinedIds = (seasonRecord: Record<string, unknown>): Set<string> => {
                    const keys = ['declinedMembers', 'declinedUserIds', 'declinedUsers', 'rejectedMembers', 'removedMembers'];
                    const ids = new Set<string>();
                    keys.forEach((key) => {
                        const raw = seasonRecord[key];
                        if (!Array.isArray(raw)) return;
                        raw.forEach((entry) => {
                            if (entry == null) return;
                            if (typeof entry === 'string' || typeof entry === 'number') {
                                const id = String(entry).trim();
                                if (id) ids.add(id);
                                return;
                            }
                            if (typeof entry === 'object') {
                                const rec = entry as Record<string, unknown>;
                                const candidate = rec.id ?? rec.userId ?? rec.memberId ?? rec.playerId;
                                const id = candidate == null ? '' : String(candidate).trim();
                                if (id) ids.add(id);
                            }
                        });
                    });
                    return ids;
                };
                const declinedIds = extractDeclinedIds(seasonObj);
                declinedIdsFromSeason = declinedIds;

                console.log('🔍 Selected season ID:', seasonObj?.id);
                console.log('🔍 Selected season number:', seasonObj?.seasonNumber);
                console.log('🔍 Season members from backend (raw):', membersUnknown);
                console.log('🔍 Is array?', Array.isArray(membersUnknown));
                console.log('🔍 Length:', Array.isArray(membersUnknown) ? membersUnknown.length : 0);

                if (Array.isArray(membersUnknown)) {
                    seasonMembersPayloadProvided = true;
                    // Use season members from backend (including empty arrays)
                    console.log('🔍 Member IDs from season:', membersUnknown.map((m: unknown) => {
                        const memberObj = m as Record<string, unknown>;
                        return `${String(memberObj?.id ?? '')}: ${String(memberObj?.firstName ?? '')} ${String(memberObj?.lastName ?? '')}`;
                    }));
                    const seasonMemberIds = new Set(
                        membersUnknown
                            .map((m: unknown) => normalizeEntityId((m as Record<string, unknown>)?.id))
                            .filter((id) => id !== '')
                    );
                    console.log('🔍 All league members:', league.members.map(m => `${m.id}: ${m.firstName} ${m.lastName}`));
                    const membersFromSeason = league.members.filter((member: User) => seasonMemberIds.has(normalizeEntityId(member.id)));
                    filteredMembers = membersFromSeason;
                    console.log('✅ Using season members from backend:', filteredMembers.length);
                    console.log('✅ Filtered member names:', filteredMembers.map(m => `${m.firstName} ${m.lastName}`));
                }
            }
        }

        // If no season members found from backend, get players who played in matches
        if (filteredMembers.length === 0 && !seasonMembersPayloadProvided) {
            console.log('⚠️ No season members from backend, using match players');
            const playersInSeasonSet = new Set<string>();
            filteredMatches.forEach(match => {
                match.homeTeamUsers?.forEach(user => playersInSeasonSet.add(user.id));
                match.awayTeamUsers?.forEach(user => playersInSeasonSet.add(user.id));
            });

            // If no one played in matches yet, show all league members for this season
            if (playersInSeasonSet.size === 0) {
                console.log('⚠️ No matches played yet, showing all league members');
                filteredMembers = league.members.filter((member: User) => !declinedIdsFromSeason.has(normalizeEntityId(member.id)));
            } else {
                filteredMembers = league.members.filter((member: User) => playersInSeasonSet.has(member.id));
                console.log('✅ Players from matches:', filteredMembers.length);
            }
        }

        console.log('✅ Final filtered members:', filteredMembers.length, filteredMembers.map(m => `${m.firstName} ${m.lastName}`));

        // Extract season settings (maxGames, showPoints)
        let seasonMaxGames = league.maxGames;
        let seasonShowPoints = league.showPoints;

        if (Array.isArray(seasonsUnknown)) {
            const selectedSeason = seasonsUnknown.find((s: unknown) => {
                const seasonObj = s as Record<string, unknown>;
                return String(seasonObj?.id || '') === selectedSeasonId;
            });

            if (selectedSeason) {
                const seasonObj = selectedSeason as Record<string, unknown>;

                // Handle maxGames
                seasonMaxGames = typeof seasonObj.maxGames === 'number' ? seasonObj.maxGames : league.maxGames;

                // Handle showPoints - be more flexible with types (boolean, number, string)
                if (seasonObj.showPoints !== undefined && seasonObj.showPoints !== null) {
                    if (typeof seasonObj.showPoints === 'boolean') {
                        seasonShowPoints = seasonObj.showPoints;
                    } else if (typeof seasonObj.showPoints === 'number') {
                        seasonShowPoints = seasonObj.showPoints === 1;
                    } else if (typeof seasonObj.showPoints === 'string') {
                        seasonShowPoints = seasonObj.showPoints.toLowerCase() === 'true';
                    } else {
                        // If it's some other type, convert to boolean
                        seasonShowPoints = Boolean(seasonObj.showPoints);
                    }
                } else {
                    seasonShowPoints = league.showPoints;
                }

                console.log('✅ Season settings applied:', {
                    seasonId: selectedSeasonId,
                    maxGames: seasonMaxGames,
                    showPoints: seasonShowPoints,
                    rawShowPoints: seasonObj.showPoints,
                    showPointsType: typeof seasonObj.showPoints,
                    leagueShowPoints: league.showPoints
                });
            }
        }

        return {
            ...league,
            matches: filteredMatches,
            members: filteredMembers,
            maxGames: seasonMaxGames,
            showPoints: seasonShowPoints
        };
    }, [league, selectedSeasonId]);

    const tableData: TableData[] = React.useMemo(() => {
        console.log('🎯 TABLE DATA COMPUTATION START');
        console.log('   filteredLeague exists:', !!filteredLeague);
        console.log('   filteredLeague members:', filteredLeague?.members?.length);
        console.log('   filteredLeague members names:', filteredLeague?.members?.map(m => `${m.firstName} ${m.lastName}`));
        console.log('   filteredLeague matches:', filteredLeague?.matches?.length);

        if (!filteredLeague) {
            console.log('❌ No filteredLeague, returning empty array');
            return [];
        }

        const playerStats = new Map<string, TableData>();
        const adminId = filteredLeague.administrators?.[0]?.id;

        console.log('   Admin ID:', adminId);

        // Initialize ALL filtered members first (whether they played or not)
        filteredLeague.members.forEach((member: User & { xp?: number }) => {
            playerStats.set(member.id, {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                winPercentage: '0%',
                isAdmin: member.id === adminId,
                profilePicture: member.profilePicture || null,
                xp: getLeagueXpForMember(member.id, member.xp),
                motmCount: typeof motmCounts[member.id] === 'number' ? motmCounts[member.id] : 0,
            });
        });

        console.log('   Initialized players:', playerStats.size);

        // Process matches to build stats for players who played in this season
        filteredLeague.matches
            .filter(m => !m.archived) // <-- exclude archived
            .filter(m => isResultMatch(m) && m.homeTeamGoals != null && m.awayTeamGoals != null)
            .forEach(match => {
                const homeWon = match.homeTeamGoals! > match.awayTeamGoals!;
                const awayWon = match.awayTeamGoals! > match.homeTeamGoals!;
                const isDraw = match.homeTeamGoals === match.awayTeamGoals;
                const processPlayer = (p: User, isHome: boolean) => {
                    // Player should already be in stats map, just update their stats
                    const stats = playerStats.get(p.id);
                    if (!stats) {
                        console.warn(`⚠️ Player ${p.firstName} ${p.lastName} played but not in filtered members!`);
                        return;
                    }
                    const goalsFor = isHome ? Number(match.homeTeamGoals ?? 0) : Number(match.awayTeamGoals ?? 0);
                    const goalsAgainst = isHome ? Number(match.awayTeamGoals ?? 0) : Number(match.homeTeamGoals ?? 0);
                    stats.played++;
                    stats.goalsFor += goalsFor;
                    stats.goalsAgainst += goalsAgainst;
                    stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
                    if ((isHome && homeWon) || (!isHome && awayWon)) stats.wins++;
                    else if (isDraw) stats.draws++;
                    else stats.losses++;
                };
                match.homeTeamUsers.forEach(p => processPlayer(p, true));
                match.awayTeamUsers.forEach(p => processPlayer(p, false));
            });

        console.log('   Total players in stats map:', playerStats.size);
        console.log('   Players:', Array.from(playerStats.keys()).map(id => {
            const p = playerStats.get(id);
            return `${p?.name} (played: ${p?.played})`;
        }));

        const list = Array.from(playerStats.values()).map(s => ({
            ...s,
            winPercentage: s.played ? `${Math.round((s.wins / s.played) * 100)}%` : '0%'
        }));

        // Rank exactly like league standings (to match League Champion/Runner-Up logic):
        // 1) players who actually played come first
        // 2) points (W*3 + D)
        // 3) goal difference
        // 4) goals for
        // 5) wins
        // 6) XP as final deterministic tie-break
        list.sort((a, b) => {
            const aPlayed = a.played > 0 ? 1 : 0;
            const bPlayed = b.played > 0 ? 1 : 0;
            if (bPlayed !== aPlayed) return bPlayed - aPlayed;
            const aPoints = a.wins * 3 + a.draws;
            const bPoints = b.wins * 3 + b.draws;
            if (bPoints !== aPoints) return bPoints - aPoints;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return (b.xp ?? 0) - (a.xp ?? 0);
        });

        console.log('   Final tableData length:', list.length);
        console.log('   Final tableData:', list.map(p => `${p.name} (xp: ${p.xp}, played: ${p.played})`));
        console.log('🎯 TABLE DATA COMPUTATION END');

        return list;
        // Recompute when filtered league or stats change
    }, [filteredLeague, filteredLeague?.id, filteredLeague?.members, filteredLeague?.matches, filteredLeague?.administrators, leagueWinners, userLeagueXP, motmCounts, matchClockMs, getLeagueXpForMember, isResultMatch]);

    useEffect(() => {
        if (section !== 'table') return;
        const scrollEl = tableScrollRef.current;
        if (!scrollEl) return;

        const handleScrollSync = () => {
            syncTableHorizontalScroll();
        };

        syncTableHorizontalScroll();
        scrollEl.addEventListener('scroll', handleScrollSync, { passive: true });
        window.addEventListener('resize', handleScrollSync);

        return () => {
            scrollEl.removeEventListener('scroll', handleScrollSync);
            window.removeEventListener('resize', handleScrollSync);
        };
    }, [section, tableData.length, filteredLeague?.showPoints, syncTableHorizontalScroll]);

    // Type for MOTM votes map: voterId -> votedForId
    type ManOfTheMatchVotes = Record<string, string | number>;
    const hasMotmVotes = (m: unknown): m is { manOfTheMatchVotes?: ManOfTheMatchVotes } =>
        typeof m === 'object' && m !== null && 'manOfTheMatchVotes' in m;

    // Aggregate MOTM votes locally from league.matches so every player's votes show
    useEffect(() => {
        if (!league?.members?.length || !league?.id) return;
        const counts: Record<string, number> = {};

        // Use filteredLeague matches when season is selected, otherwise use all league matches
        const matchesToCount = selectedSeasonId && filteredLeague ? filteredLeague.matches : (league.matches || []);

        // Initialize all members with 0 to ensure everyone shows up
        league.members.forEach(m => { counts[m.id] = 0; });
        matchesToCount.forEach((match) => {
            const votes: ManOfTheMatchVotes = hasMotmVotes(match) && match.manOfTheMatchVotes
                ? match.manOfTheMatchVotes
                : {};
            
            const matchVoteCounts: Record<string, number> = {};
            Object.values(votes).forEach((votedForId) => {
                const pid = String(votedForId);
                matchVoteCounts[pid] = (matchVoteCounts[pid] || 0) + 1;
            });

            let maxVotes = 0;
            const winners = new Set<string>();
            Object.entries(matchVoteCounts).forEach(([pid, count]) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    winners.clear();
                    winners.add(pid);
                } else if (count === maxVotes && maxVotes > 0) {
                    winners.add(pid);
                }
            });

            winners.forEach((pid) => {
                if (pid in counts) counts[pid] += 1;
            });
        });
        setMotmCounts(counts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [league?.id, selectedSeasonId, filteredLeague?.matches]);

    // Fetch MOTM votes per player via quick-view endpoint when league or season changes
    useEffect(() => {
        if (!league?.id || !token || !league.members?.length) return;
        let ignore = false;
        const controller = new AbortController();
        (async () => {
            try {
                const seasonParam = selectedSeasonId ? `?seasonId=${encodeURIComponent(selectedSeasonId)}` : '';
                const entries = await Promise.all(
                    league.members.map(async (m) => {
                        try {
                            const res = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(league.id)}/player/${encodeURIComponent(m.id)}/quick-view${seasonParam}`,
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
    }, [league?.id, token, selectedSeasonId]);

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

    // Fetch leaderboard for ALL metrics when league or season changes
    useEffect(() => {
        if (!leagueId || !token) return;
        setLeaderboardLoading(true);

        const metrics = LEADERBOARD_METRIC_CONFIG.map((metric) => metric.key);
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/leaderboard`;

        const normalizeLeaderboardPlayers = (
            raw: unknown,
            metricKey: string
        ): Array<{ id: string; name: string; positionType: string; value: number }> => {
            const rawPlayers = Array.isArray((raw as { players?: unknown[] })?.players)
                ? (raw as { players: unknown[] }).players
                : [];
            const seen = new Set<string>();
            return rawPlayers
                .filter((p) => {
                    const rec = (typeof p === 'object' && p !== null) ? p as { id?: string | number } : {};
                    const pid = String(rec?.id ?? '').trim();
                    if (!pid) return false;
                    const lower = pid.toLowerCase();
                    if (lower.startsWith('guest-') || lower.includes('guest_') || lower.includes('guest-')) return false;
                    if (seen.has(pid)) return false;
                    seen.add(pid);
                    return true;
                })
                .map((p) => {
                    const rec = (typeof p === 'object' && p !== null)
                        ? p as { id?: string | number; name?: string; positionType?: string; value?: number | string }
                        : {};
                    const valueNum = Number(rec.value ?? 0);
                    return {
                        id: String(rec.id ?? ''),
                        name: String(rec.name ?? 'Unknown Player'),
                        positionType: String(rec.positionType ?? 'Player'),
                        value: Number.isFinite(valueNum) ? valueNum : 0,
                    };
                })
                .filter((player) => player.value > 0)
                .slice(0, 5);
        };

        Promise.all(
            metrics.map(async (metric) => {
                const urlAll = `${baseUrl}?metric=${metric}&leagueId=${leagueId}&limit=5`;
                const urlSeason = selectedSeasonId ? `${urlAll}&seasonId=${selectedSeasonId}` : urlAll;
                const requestInit: RequestInit = {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };

                try {
                    const primaryRes = await fetch(urlSeason, requestInit);
                    const primaryJson = await primaryRes.json().catch(() => ({}));
                    const players = normalizeLeaderboardPlayers(primaryJson, metric);

                    return { metric, players };
                } catch {
                    return { metric, players: [] as Array<{ id: string; name: string; positionType: string; value: number }> };
                }
            })
        )
            .then(results => {
                const dataByMetric: Record<string, Array<{ id: string; name: string; positionType: string; value: number }>> = {};
                results.forEach(({ metric, players }) => {
                    dataByMetric[metric] = players;
                });
                setAllLeaderboardData(dataByMetric);
                setLeaderboardLoading(false);
            })
            .catch(error => {
                console.error('Error fetching leaderboard:', error);
                setLeaderboardLoading(false);
            });
    }, [leagueId, token, selectedSeasonId]);

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
        return name
            .trim()
            .split(/\s+/)
            .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ''))
            .join(' ');
    };

    const getLeagueTitleFontSize = (name?: string): string => {
        const len = (name ?? '').trim().length;
        if (len >= 30) return '12px';
        if (len >= 26) return '13px';
        if (len >= 22) return '14px';
        if (len >= 18) return '15px';
        return '17px';
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

    function normalizeMatchStatus(s: unknown): string {
        return typeof s === 'string' ? s.trim().toUpperCase() : '';
    }

    function isResultLikeStatus(s: unknown): boolean {
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
    }

    function isAwaitingConfirmationStatus(s: unknown): boolean {
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
    }

    function parseDateMs(value: unknown): number | null {
        if (value === null || value === undefined) return null;
        const dt = new Date(value as string | number | Date).getTime();
        return Number.isNaN(dt) ? null : dt;
    }

    function getMatchEndTimeMs(match: Match): number | null {
        const explicitEnd = parseDateMs(match.end);
        if (explicitEnd !== null) return explicitEnd;

        const startMs = parseDateMs(match.start) ?? parseDateMs(match.date);
        if (startMs === null) return null;

        const startRecord = match as unknown as Record<string, unknown>;
        const durationCandidates = [
            startRecord.durationMinutes,
            startRecord.duration,
            startRecord.matchDuration,
            startRecord.duration_minutes,
            startRecord.lengthMinutes,
            startRecord.length,
        ];

        for (const candidate of durationCandidates) {
            const n = typeof candidate === 'number' ? candidate : (typeof candidate === 'string' ? Number(candidate) : NaN);
            if (Number.isFinite(n) && n > 0) {
                return startMs + (Math.round(n) * 60 * 1000);
            }
        }

        return startMs + (90 * 60 * 1000);
    }

    function isResultMatch(match: Match): boolean {
        if (isResultLikeStatus(match.status)) return true;
        const endMs = getMatchEndTimeMs(match);
        if (endMs === null) return false;
        return endMs <= matchClockMs;
    }

    function isFixtureMatch(match: Match): boolean {
        return !isResultMatch(match);
    }

    if (error && !isSigningOut) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    fontFamily: 'var(--font-inter), var(--font-woodford-bourne-pro), Arial, sans-serif',
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
                    <Typography className="empty-state-message" variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
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
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(15,15,15,0.95)',
                        color: '#E5E7EB',
                        borderRadius: isMobile ? 0 : 3,
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
                        py: { xs: 2, sm: 2.5 },
                        pr: { xs: 6, sm: 8 }
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
                        p: { xs: 2, sm: 3 },
                        background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                        color: 'white'
                    }}>
                        {/* Teams in a row layout */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                            {/* Home Team */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flex: 1,
                                width: { xs: '100%', sm: 'auto' },
                                minWidth: 0 // Prevent overflow
                            }}>
                                <Image
                                    src={resolveImageUrl(match.homeTeamImage || homeImg)}
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
                                justifyContent: 'center',
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
                                {isFixtureMatch(match) && (
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
                                width: { xs: '100%', sm: 'auto' },
                                flexDirection: 'row-reverse', // Reverse order for visual balance
                                minWidth: 0
                            }}>
                                <Image
                                    src={resolveImageUrl(match.awayTeamImage || awayImg)}
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
                        {isFixtureMatch(match) && (
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

                <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1, borderTop: '1px solid rgba(255,255,255,0.1)', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            color: '#E5E7EB',
                            borderColor: 'rgba(255,255,255,0.2)',
                            width: { xs: '100%', sm: 'auto' },
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
                                width: { xs: '100%', sm: 'auto' },
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

    const handleRequestDeleteMatch = async (match: Match) => {
        setMatchPendingDelete(match);
        setMatchHasData(null);
        setMatchDeleteChecking(true);
        setConfirmDeleteOpen(true);

        // Check if match has players or stats/scores
        const hasPlayers = (match.homeTeamUsers?.length ?? 0) > 0 || (match.awayTeamUsers?.length ?? 0) > 0;
        const hasScores = (match.homeTeamGoals ?? 0) > 0 || (match.awayTeamGoals ?? 0) > 0 || isResultMatch(match);

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

    const handleConfirmDeleteMatch = async () => {
        if (!matchPendingDelete || !token || !league) return;
        const m = matchPendingDelete;
        setConfirmDeleteOpen(false);

        try {
            const fixtureMode = isFixtureMatch(m);
            if (fixtureMode) {
                // Upcoming/fixture matches should be hard-deleted directly.
                await handlePermanentDelete(m);
                return;
            }

            // Always archive from main delete action.
            // Permanent delete is available only in Archived Match actions.
            console.log('🗑️ Archiving match:', m.id);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ archived: true })
            });

            if (!res.ok) {
                const errorData = await res.text();
                console.error('❌ Archive failed:', errorData);
                throw new Error('Failed to archive match');
            }

            const data = await res.json();
            console.log('✅ Archive response:', data);

            // Update local state
            setLeague(prev => prev ? {
                ...prev,
                matches: (prev.matches ?? []).map(mm =>
                    mm.id === m.id ? { ...mm, archived: true } : mm
                )
            } : prev);

            setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
            setToastMessage('Match archived successfully');

            // Refresh league data to ensure sync
            console.log('🔄 Refreshing league data...');
            await fetchLeagueDetails();
            console.log('✅ League data refreshed');

        } catch (e) {
            console.error('Delete/Archive operation failed:', e);
            toast.error('Failed to archive match');
        } finally {
            setMatchPendingDelete(null);
            setMatchHasData(null);
        }
    };

    const pendingDeleteIsFixture = Boolean(matchPendingDelete && isFixtureMatch(matchPendingDelete));

    const handleUndo = async () => {
        if (!undoInfo || !token) return;
        const { match, action } = undoInfo;

        try {
            if (action === 'archive') {
                // Restore archived match
                console.log('♻️ Restoring archived match:', match.id);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: false })
                });

                if (!res.ok) {
                    console.error('❌ Restore failed');
                    let message = 'Failed to restore match';
                    try {
                        const err = await res.json();
                        if (err?.message) message = err.message;
                    } catch { }
                    throw new Error(message);
                }

                const data = await res.json();
                console.log('✅ Restore response:', data);
                console.log('📦 Archived status in response:', data?.match?.archived);

                // Update local state
                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).map(mm =>
                        mm.id === match.id ? { ...mm, archived: false } : mm
                    )
                } : prev);

                console.log('💾 Local state updated with archived: false');

                setToastMessage('Match restored successfully.');
                toast.success('Match restored successfully!');

            } else if (action === 'delete') {
                // For permanent deletes, we can't undo - but we can recreate if we have the data
                toast.error('Cannot undo permanent deletion. Match data is permanently lost.');
            }

            // Refresh data to ensure sync
            console.log('🔄 Refreshing league data after restore...');
            fetchLeagueDetails();
            console.log('✅ League data refreshed after restore');

            // Log the updated match status after refresh
            setTimeout(() => {
                const updatedMatch = league?.matches?.find(m => m.id === match.id);
                console.log('🔍 Match status after restore refresh:', {
                    matchId: match.id,
                    archived: updatedMatch?.archived,
                    fullMatch: updatedMatch
                });
            }, 1000);

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
        const ok = window.confirm('Restore this archived match?');
        if (!ok) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ archived: false })
            });

            if (!res.ok) {
                let message = 'Failed to restore match';
                try {
                    const err = await res.json();
                    if (err?.message) message = err.message;
                } catch { }
                throw new Error(message);
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
            // Find member from local league data as fallback
            const localMember = league?.members?.find((m: User) => m.id === playerId);

            // Fetch quick-view (motmCount) AND full player profile (skills, xp, etc.) in parallel
            const seasonParam = selectedSeasonId ? `?seasonId=${encodeURIComponent(selectedSeasonId)}` : '';
            const [quickViewRes, playerRes, statsRes] = await Promise.all([
                fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(leagueId)}/player/${encodeURIComponent(playerId)}/quick-view${seasonParam}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${encodeURIComponent(playerId)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${encodeURIComponent(playerId)}/stats?leagueId=${encodeURIComponent(leagueId)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
            ]);

            const [data, playerData, statsData] = await Promise.all([
                quickViewRes.json(),
                playerRes.json().catch(() => ({ success: false })),
                statsRes.json().catch(() => ({ success: false })),
            ]);
            console.log('quick-view:', data, 'player:', playerData, 'stats:', statsData);

            if (!quickViewRes.ok || !data?.success) return;

            const fullPlayer = playerData?.success ? playerData.player : null;
            const matchStats = statsData?.success ? statsData.stats : null;
            const overallXP = Number(fullPlayer?.xp ?? data.player?.xp ?? localMember?.xp ?? 0);

            const player: User & PlayerProfileLike = {
                id: String(fullPlayer?.id ?? data.player?.id ?? playerId),
                firstName: fullPlayer?.firstName ?? data.player?.firstName ?? localMember?.firstName ?? '',
                lastName: fullPlayer?.lastName ?? data.player?.lastName ?? localMember?.lastName ?? '',
                email: '',
                xp: overallXP,
                position: fullPlayer?.position ?? data.player?.position ?? localMember?.position ?? undefined,
                profilePicture: fullPlayer?.profilePicture ?? data.player?.profilePicture ?? localMember?.profilePicture ?? null,
                preferredFoot: fullPlayer?.preferredFoot ?? data.player?.preferredFoot ?? null,
                shirtNumber: fullPlayer?.shirtNumber ?? data.player?.shirtNumber ?? localMember?.shirtNumber ?? null,
                positionType: undefined,
            };

            const skills = fullPlayer?.skills
                ? {
                    dribbling: Number(fullPlayer.skills.dribbling ?? 0),
                    shooting: Number(fullPlayer.skills.shooting ?? 0),
                    passing: Number(fullPlayer.skills.passing ?? 0),
                    pace: Number(fullPlayer.skills.pace ?? 0),
                    defending: Number(fullPlayer.skills.defending ?? 0),
                    physical: Number(fullPlayer.skills.physical ?? 0),
                }
                : data.skills
                    ? {
                        dribbling: Number(data.skills.dribbling ?? 0),
                        shooting: Number(data.skills.shooting ?? 0),
                        passing: Number(data.skills.passing ?? 0),
                        pace: Number(data.skills.pace ?? 0),
                        defending: Number(data.skills.defending ?? 0),
                        physical: Number(data.skills.physical ?? 0),
                    }
                    : undefined;

            setQuickView({
                player,
                league,
                stats: {
                    goals: Number(matchStats?.goals ?? data.stats?.goals ?? 0),
                    assists: Number(matchStats?.assists ?? data.stats?.assists ?? 0),
                },
                skills,
                xp: overallXP,
                cleanSheets: Number(data.cleanSheets ?? 0),
                motmCount: Number(data.motmCount ?? 0),
                defensiveImpact: Number(data.defensiveImpact ?? 0),
                mentality: Number(data.mentality ?? 0),
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
                fontFamily: 'var(--font-woodford-bourne-pro), sans-serif',
                fontWeight: 700,
                // py: { xs: 2, md: 4 },
                // px: { xs: 1, md: 0 },
                background: 'transparent',
                backgroundAttachment: 'fixed',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflowX: 'hidden',
            }}
        >
            {/* <Box sx={{ ml:5}}> */}
            {/* </Box> */}
            <Container>
                {/* Access control for non-members - only show when league data is available */}
                {league && isAuthenticated && !!user && !isMember && !hasCommonLeague ? (
                    <Box sx={{ p: 4, minHeight: '100vh' }}>
                        <Typography className="empty-state-message" color="error" variant="h6">
                            You don&apos;t have access to this league.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* League inactive warning - only show when league data is available
                        {league && !league.active && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                This league is currently inactive. All actions are disabled until an admin reactivates it.
                            </Alert>
                        )} */}

                        <Box sx={{
                            mt: 0,
                            mb: 4,
                            width: '100vw',
                            position: 'relative',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            // height: '30vh',
                            background: '#0e0e0e',
                        }}>
                            {/* League state warning (inactive/completed) */}
                            {league && !league.active && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {leagueIsCompleted(league)
                                        ? 'This league is completed. New matches are disabled for completed leagues.'
                                        : 'This league is currently inactive. All actions are disabled until an admin reactivates it.'}
                                </Alert>
                            )}
                            <Paper sx={{
                                px: 0,
                                py: { xs: 2, md: 2 },
                                background: '#0e0e0e',
                                color: 'white',
                                minHeight: { xs: 'var(--header-mobile-min-height)', md: 'auto' },
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
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        px: { xs: 1.5, sm: 2, md: 0 },
                                        gap: 0.5,
                                        mt: { xs: 8, sm: 12, md: 17 },
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: { xs: 0.8, sm: 1, md: 1 },
                                        }}>
                                            <Image
                                                src={LeagueIcon}
                                                alt="League Icon"
                                                width={isMobile ? 24 : 56}
                                                height={isMobile ? 24 : 56}
                                                style={{ objectFit: 'contain', pointerEvents: 'none' }}
                                            />
                                            {league ? (
                                                <Button
                                                    onClick={handleLeaguesDropdownOpen}
                                                    sx={{
                                                        textTransform: 'uppercase',
                                                        fontFamily: 'var(--font-oswald), "Oswald", sans-serif !important',
                                                        fontSize: { xs: getLeagueTitleFontSize(league?.name), sm: '42px', md: '55px' },
                                                        fontWeight: 700,
                                                        lineHeight: { xs: 1, sm: 1.1 },
                                                        wordBreak: 'normal',
                                                        overflow: 'visible',
                                                        textOverflow: 'clip',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 1,
                                                        minWidth: 0,
                                                        maxWidth: { xs: '100%', sm: '72vw', md: '56vw' },
                                                        textAlign: 'center',
                                                        color: 'white',
                                                        backgroundColor: 'transparent',
                                                        borderRadius: 0,
                                                        px: 0,
                                                        py: 0,
                                                        height: 'auto',
                                                        '&:hover': {
                                                            backgroundColor: 'transparent',
                                                        },
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexWrap: 'nowrap',
                                                        gap: 0.5,
                                                    }}
                                                    endIcon={
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                width: 0,
                                                                height: 0,
                                                                borderLeft: { xs: '6px solid transparent', sm: '10px solid transparent' },
                                                                borderRight: { xs: '6px solid transparent', sm: '10px solid transparent' },
                                                                borderTop: { xs: '10px solid #FFFFFF', sm: '16px solid #FFFFFF' },
                                                                display: 'inline-block',
                                                                ml: 0.5
                                                            }}
                                                        />
                                                    }
                                                >
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            display: 'inline-block',
                                                            maxWidth: { xs: 'calc(100vw - 96px)', sm: '58vw', md: '48vw' },
                                                            overflow: 'visible',
                                                            textOverflow: 'clip',
                                                            whiteSpace: 'nowrap',
                                                            wordBreak: 'normal',
                                                            verticalAlign: 'middle',
                                                        }}
                                                    >
                                                        {formatLeagueName(league.name)}
                                                    </Box>
                                                </Button>
                                            ) : (
                                                <Typography
                                                    sx={{
                                                        textTransform: 'uppercase',
                                                        fontFamily: 'var(--font-oswald), "Oswald", sans-serif !important',
                                                        fontSize: { xs: '32px', sm: '42px', md: '55px' },
                                                        fontWeight: 700,
                                                        color: 'white',
                                                    }}
                                                >
                                                    Loading...
                                                </Typography>
                                            )}
                                        </Box>
                                        {league && (
                                            <Button
                                                onClick={handleSeasonDropdownOpen}
                                                sx={{
                                                    mt: -1,
                                                    color: 'rgba(255,255,255,0.9)',
                                                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' },
                                                    fontWeight: 500,
                                                    letterSpacing: 0.25,
                                                    textTransform: 'none',
                                                    backgroundColor: 'transparent',
                                                    borderRadius: 0,
                                                    px: 1,
                                                    py: 0,
                                                    minHeight: 'auto',
                                                    minWidth: 0,
                                                    maxWidth: { xs: '88vw', sm: '60vw', md: '50vw' },
                                                    overflow: 'hidden',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                    },
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                }}
                                                startIcon={
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                        {/* <Image
                                                            src={LeagueIcon}
                                                            alt="Season Icon"
                                                            width={isMobile ? 14 : 16}
                                                            height={isMobile ? 14 : 16}
                                                            style={{ objectFit: 'contain', opacity: 0.95 }}
                                                        /> */}
                                                        {!isSelectedSeasonActive ? <Lock size={14} color="rgba(255,255,255,0.6)" /> : null}
                                                    </Box>
                                                }
                                                endIcon={
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            width: 0,
                                                            height: 0,
                                                            borderLeft: '6px solid transparent',
                                                            borderRight: '6px solid transparent',
                                                            borderTop: '10px solid rgba(255,255,255,0.9)',
                                                            display: 'inline-block',
                                                        }}
                                                    />
                                                }
                                            >
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        maxWidth: { xs: '75vw', sm: '46vw', md: '40vw' },
                                                        overflow: 'hidden',
                                                        textOverflow: 'clip',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {seasonLabel}
                                                </Box>
                                            </Button>
                                        )}
                                    </Box>

                                    {/* Season Dropdown Menu */}
                                    <Menu
                                        anchorEl={seasonDropdownAnchor}
                                        open={seasonDropdownOpen}
                                        onClose={handleSeasonDropdownClose}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                        marginThreshold={0}
                                        MenuListProps={{
                                            sx: {
                                                maxHeight: { xs: 260, sm: 320 },
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                                scrollbarWidth: 'thin',
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: 'rgba(255,255,255,0.08)',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: 'rgba(255,255,255,0.35)',
                                                    borderRadius: '999px',
                                                },
                                            },
                                        }}
                                        PaperProps={{
                                            sx: {
                                                p: 0.5,
                                                mt: 1,
                                                minWidth: 200,
                                                ml: { xs: -1.5, sm: -1.5 },
                                                maxWidth: { xs: '92vw', sm: 'none' },
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
                                        {(() => {
                                            const seasonsUnknown = (league as unknown as Record<string, unknown>)?.seasons;
                                            const availableSeasons: Array<{ id: string, seasonNumber: number }> = [];
                                            const addUniqueSeason = (id: string, seasonNumber: number) => {
                                                if (!id || seasonNumber <= 0) return;
                                                if (!availableSeasons.some((season) => season.id === id)) {
                                                    availableSeasons.push({ id, seasonNumber });
                                                }
                                            };

                                            // Prefer dedicated seasons endpoint data first (fresh/latest)
                                            if (Array.isArray(seasonOptions) && seasonOptions.length > 0) {
                                                seasonOptions.forEach((season) => {
                                                    addUniqueSeason(
                                                        String(season.id || ''),
                                                        Number(season.seasonNumber || 0)
                                                    );
                                                });
                                            }

                                            // If user is admin, show all seasons
                                            if (isAdmin && Array.isArray(seasonsUnknown)) {
                                                seasonsUnknown.forEach((s: unknown) => {
                                                    const season = s as Record<string, unknown>;
                                                    addUniqueSeason(
                                                        String(season?.id || ''),
                                                        Number(season?.seasonNumber || 0)
                                                    );
                                                });
                                            }
                                            // If user is member, show only seasons they joined
                                            else if (Array.isArray(seasonsUnknown)) {
                                                seasonsUnknown.forEach((s: unknown) => {
                                                    const season = s as Record<string, unknown>;
                                                    addUniqueSeason(
                                                        String(season?.id || ''),
                                                        Number(season?.seasonNumber || 0)
                                                    );
                                                });
                                            }

                                            // Ensure current season is visible even if seasons list is temporarily stale.
                                            const currentSeasonUnknown = (league as unknown as Record<string, unknown>)?.currentSeason;
                                            if (currentSeasonUnknown && typeof currentSeasonUnknown === 'object') {
                                                const currentSeason = currentSeasonUnknown as Record<string, unknown>;
                                                addUniqueSeason(
                                                    String(currentSeason?.id || ''),
                                                    Number(currentSeason?.seasonNumber || 0)
                                                );
                                            }

                                            // Sort by season number descending (newest first)
                                            availableSeasons.sort((a, b) => b.seasonNumber - a.seasonNumber);

                                            if (availableSeasons.length === 0) {
                                                return (
                                                    <MenuItem disabled sx={{ color: '#9CA3AF', fontSize: '0.9rem', py: 1 }}>
                                                        <Typography className="empty-state-message" variant="body2">
                                                            No seasons available
                                                        </Typography>
                                                    </MenuItem>
                                                );
                                            }

                                            return availableSeasons.map((season) => (
                                                <MenuItem
                                                    key={season.id}
                                                    onClick={() => handleSeasonSelect(season.id)}
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
                                                        background: season.seasonNumber === currentSeasonNumber
                                                            ? 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)'
                                                            : 'transparent',
                                                        border: season.seasonNumber === currentSeasonNumber
                                                            ? '1px solid rgba(3,136,227,0.35)'
                                                            : 'none',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                                        },
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <Calendar size={16} color={season.seasonNumber === currentSeasonNumber ? '#FFFFFF' : '#9CA3AF'} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={`Season ${season.seasonNumber}`}
                                                        sx={{
                                                            '& .MuiListItemText-primary': {
                                                                fontSize: '0.95rem',
                                                                fontWeight: season.seasonNumber === currentSeasonNumber ? 700 : 500,
                                                                letterSpacing: 0.2,
                                                                color: season.seasonNumber === currentSeasonNumber ? '#FFFFFF' : '#E5E7EB'
                                                            }
                                                        }}
                                                    />
                                                </MenuItem>
                                            ));
                                        })()}
                                    </Menu>

                                    {/* Leagues Dropdown Menu */}
                                    <Menu
                                        anchorEl={leaguesDropdownAnchor}
                                        open={leaguesDropdownOpen}
                                        onClose={handleLeaguesDropdownClose}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                        marginThreshold={0}
                                        MenuListProps={{
                                            sx: {
                                                maxHeight: { xs: 260, sm: 320 },
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                                scrollbarWidth: 'thin',
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: 'rgba(255,255,255,0.08)',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: 'rgba(255,255,255,0.35)',
                                                    borderRadius: '999px',
                                                },
                                            },
                                        }}
                                        PaperProps={{
                                            sx: {
                                                p: 0.5,
                                                mt: 1,
                                                minWidth: 240,
                                                ml: { xs: -1.5, sm: -1.5 },
                                                maxWidth: { xs: '92vw', sm: 'none' },
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
                                <Box
                                    sx={{
                                        height: 'var(--header-divider-height)',
                                        bgcolor: 'var(--header-divider-color)',
                                        mt: { xs: 8, sm: 12, md: 17 },
                                        width: '100%',
                                    }}
                                />

                                {/* Navigation Tabs - Pill style */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        overflowX: { xs: 'visible', sm: 'auto' },
                                        overflowY: 'hidden',
                                        px: 1,
                                        // mx: 'aut90100o',
                                        mt: 2,

                                    }}
                                >
                                    <ButtonGroup
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            // borderRadius: '12px',
                                            overflow: 'hidden',
                                            gap: 0,
                                            width: { xs: '100%', sm: 'max-content' },
                                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                            '& .MuiButtonGroup-grouped': {
                                                borderColor: '#9CA3AF',
                                                borderWidth: { xs: 2, sm: 3 },
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: { xs: 1, sm: 2.5, md: 4.5 },
                                                py: 0.5,
                                                minWidth: { xs: '50%', sm: 'auto' },
                                                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                                                textAlign: { xs: 'left', sm: 'center' },
                                                justifyContent: { xs: 'flex-start', sm: 'center' },
                                                lineHeight: 1.2,
                                                minHeight: { xs: 42, sm: 'auto' },
                                            },
                                            '& .MuiButtonGroup-grouped:hover': {
                                                borderColor: '#9CA3AF',
                                                borderWidth: { xs: 2, sm: 3 },
                                                // backgroundColor: '#c0bfbf',
                                                // color: '#fff',
                                            },
                                            '& .MuiButton-startIcon': {
                                                mr: { xs: 0.5, sm: 1 },
                                            },
                                            '& .MuiButton-startIcon img': {
                                                width: { xs: '16px !important', sm: '24px !important' },
                                                height: { xs: '16px !important', sm: '24px !important' },
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
                                            startIcon={<Image src={LeagueTable} alt="League Table" width={24} height={24} style={{ objectFit: 'contain', filter: section === 'table' ? 'brightness(0) invert(1)' : 'brightness(0) saturate(100%) invert(64%) sepia(0%)' }} />}
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
                                            startIcon={<Image src={MATCHRESULT} alt="Results" width={24} height={24} style={{ objectFit: 'contain', filter: section === 'results' ? 'brightness(0) invert(1)' : 'brightness(0) saturate(100%) invert(64%) sepia(0%)' }} />}
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
                                            startIcon={<Image src={FIXTURES} alt="Fixtures" width={24} height={24} style={{ objectFit: 'contain', filter: section === 'matches' ? 'brightness(0) invert(1)' : 'brightness(0) saturate(100%) invert(64%) sepia(0%)' }} />}
                                        >
                                            Fixtures
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'leaderboard' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'leaderboard' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'leaderboard' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'leaderboard' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'leaderboard' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                setSection('leaderboard');
                                                router.replace(`/league/${leagueId}?tab=leaderboard`);
                                            }}
                                            startIcon={<Image src={LEADERBOARD} alt="Leaderboard" width={24} height={24} style={{ objectFit: 'contain', filter: section === 'leaderboard' ? 'brightness(0) invert(1)' : 'brightness(0) saturate(100%) invert(64%) sepia(0%)' }} />}
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
                                            startIcon={<Image src={PLAYERIMAGE} alt="Players" width={24} height={24} style={{ objectFit: 'contain', filter: section === 'members' ? 'brightness(0) invert(1)' : 'brightness(0) saturate(100%) invert(64%) sepia(0%)' }} />}
                                        >
                                            Players
                                        </Button>
                                        {/* Dream Team Button */}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: section === 'dream-team' ? '#ffffff' : '#374151',
                                                backgroundColor: section === 'dream-team' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                                borderRadius: 0,
                                                border: '3px solid #9CA3AF',
                                                boxShadow: section === 'dream-team' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: section === 'dream-team' ? '#10B981' : 'rgba(255,255,255,0.92)',
                                                    border: '3px solid #9CA3AF',
                                                    boxShadow: section === 'dream-team' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none'
                                                }
                                            }}
                                            onClick={() => {
                                                setSection('dream-team');
                                                router.replace(`/league/${leagueId}?tab=dream-team`);
                                            }}
                                            startIcon={<Image src={DREATEAM} alt="Dream Team" width={24} height={24} style={{ objectFit: 'contain', filter: section === 'dream-team' ? 'brightness(0) invert(1)' : 'brightness(0) saturate(100%) invert(64%) sepia(0%)' }} />}
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
                            mt: section === 'dream-team' ? 0 : 1.2,
                            // backdropFilter: 'blur(10px)'
                        }}>
                            {section === 'members' && (
                                <Box sx={{ width: '100%', mx: 'auto', mt: 1.2 , mb: 4, }}>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            overflowX: 'auto',
                                            overflowY: 'auto',
                                            maxHeight: { xs: '68vh', sm: '70vh', md: '72vh' },
                                            WebkitOverflowScrolling: 'touch',
                                            '&::-webkit-scrollbar': { height: 6, width: 6 },
                                            '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.05)', borderRadius: 3 },
                                            '&::-webkit-scrollbar-thumb': { background: '#F97316', borderRadius: 3 },
                                        }}
                                    >
                                        <Box sx={{ width: 'max-content', minWidth: '100%', borderRadius: '8px', overflow: 'visible' }}>
                                            {/* Table Header */}
                                            <Box className="league-header-row" sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 12,
                                                pl: 0,
                                                pr: { xs: 2, sm: 3 },
                                                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                borderTopLeftRadius: '8px',
                                                borderTopRightRadius: '8px',
                                            }}>
                                                {/* All Positions Dropdown */}
                                                <Box
                                                    onClick={handleMemberPositionMenuOpen}
                                                    aria-haspopup="menu"
                                                    aria-expanded={memberPositionMenuOpen ? 'true' : undefined}
                                                    sx={{
                                                        width: { xs: 196, sm: 280, md: 320 },
                                                        minWidth: { xs: 196, sm: 280, md: 320 },
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        pl: { xs: 2, sm: 3 },
                                                        pr: { xs: 1.2, sm: 2 },
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 3,
                                                        backgroundColor: 'rgba(30, 30, 30, 0.95)',
                                                        borderTopLeftRadius: '8px',
                                                    }}>
                                                    <Typography className="league-table-heading" sx={{ color: '#fff', textAlign: 'left !important' }}>
                                                        {selectedMemberPosition === 'all' ? 'ALL POSITIONS' : selectedMemberPosition.toUpperCase()}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            ml: 1,
                                                            width: 0,
                                                            height: 0,
                                                            borderLeft: '6px solid transparent',
                                                            borderRight: '6px solid transparent',
                                                            borderTop: '8px solid #fff',
                                                            transform: memberPositionMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transformOrigin: 'center',
                                                            transition: 'transform 0.3s ease',
                                                        }}
                                                    />
                                                </Box>
                                                <Menu
                                                    anchorEl={memberPositionMenuAnchor}
                                                    open={memberPositionMenuOpen}
                                                    onClose={handleMemberPositionMenuClose}
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                                    slotProps={{
                                                        paper: {
                                                            sx: {
                                                                mt: 0.5,
                                                                minWidth: { xs: 180, sm: 140 },
                                                                backgroundColor: '#1f1f1f',
                                                                border: '1px solid #e56a16',
                                                                borderRadius: '8px',
                                                                color: '#fff',
                                                            },
                                                        },
                                                    }}
                                                >
                                                    <MenuItem
                                                        selected={selectedMemberPosition === 'all'}
                                                        onClick={() => handleMemberPositionChange('all')}
                                                        sx={{ fontFamily: 'var(--font-woodford-bourne-pro), sans-serif', fontSize: { xs: 13, sm: 15 } }}
                                                    >
                                                        All Positions
                                                    </MenuItem>
                                                    {memberPositionOptions.map((position) => (
                                                        <MenuItem
                                                            key={position}
                                                            selected={selectedMemberPosition.toLowerCase() === position.toLowerCase()}
                                                            onClick={() => handleMemberPositionChange(position)}
                                                            sx={{ fontFamily: 'var(--font-woodford-bourne-pro), sans-serif', fontSize: { xs: 13, sm: 15 } }}
                                                        >
                                                            {position}
                                                        </MenuItem>
                                                    ))}
                                                </Menu>

                                                {/* Playing Style Header */}
                                                <Box sx={{
                                                    width: { xs: 108, sm: 150, md: 180 },
                                                    minWidth: { xs: 108, sm: 150, md: 180 },
                                                    flexShrink: 0,
                                                    pr: { xs: 0.5, sm: 2 },
                                                    display: 'block',
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography className="league-table-heading" sx={{ color: '#fff' }}>
                                                        PLAYING STYLE
                                                    </Typography>
                                                </Box>

                                                {/* Spacer */}
                                                <Box sx={{ flex: 1 }} />

                                                {/* View Stats Header */}
                                                <Box sx={{ minWidth: { xs: 90, sm: 120 }, textAlign: 'center' }}>
                                                    <Typography className="league-table-heading" sx={{ color: '#fff' }}>
                                                        VIEW STATS
                                                    </Typography>
                                                </Box>

                                                {/* XP Points Header */}
                                                <Box sx={{ minWidth: { xs: 90, sm: 120 }, ml: { xs: 1, sm: 1.5, md: 7.5 }, textAlign: 'center' }}>
                                                    <Typography className="league-table-heading league-table-heading-no-transform" sx={{ color: '#fff' }}>
                                                        {filteredLeague?.showPoints === true ? 'xpPTS' : 'PTS'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Table Rows Content */}
                                            <Box sx={{
                                                backgroundColor: '#383838',
                                                '&::-webkit-scrollbar': { display: 'none' },
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none',
                                                borderBottomLeftRadius: '8px',
                                                borderBottomRightRadius: '8px',
                                            }}>
                                                <List sx={{ p: 0 }}>
                                                    {filteredMembersForTable.map((member, idx) => {
                                                        const firstName = member.firstName || '';
                                                        const lastName = member.lastName || '';
                                                        const memberDisplayName = `${firstName} ${lastName}`.trim();
                                                        const rowBgColor = idx % 2 === 0 ? '#383838' : '#2b2b2b';
                                                        const rowBgColorHover = idx % 2 === 0 ? '#464646' : '#3a3a3a';
                                                        const isLast = idx === filteredMembersForTable.length - 1;

                                                        return (
                                                            <ListItem
                                                                key={member.id}
                                                                className="league-table-row-text league-row"
                                                                onClick={() => router.push(`/player/${member.id}`)}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    pl: 0,
                                                                    pr: { xs: 2, sm: 3 },
                                                                    backgroundColor: rowBgColor,
                                                                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                                    color: '#fff',
                                                                    cursor: 'pointer',
                                                                    transition: 'background-color 0.2s',
                                                                    '&:hover': { backgroundColor: rowBgColorHover },
                                                                    borderBottomLeftRadius: isLast ? '8px' : 0,
                                                                    borderBottomRightRadius: isLast ? '8px' : 0,
                                                                }}
                                                            >
                                                                {/* Avatar + Name column */}
                                                                <Box sx={{
                                                                    width: { xs: 196, sm: 280, md: 320 },
                                                                    minWidth: { xs: 196, sm: 280, md: 320 },
                                                                    flexShrink: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    pl: { xs: 2, sm: 3 },
                                                                    pr: { xs: 1.2, sm: 2 },
                                                                    position: 'sticky',
                                                                    left: 0,
                                                                    zIndex: 2,
                                                                    backgroundColor: rowBgColor,
                                                                    transition: 'background-color 0.2s',
                                                                    '.MuiListItem-root:hover &': {
                                                                        backgroundColor: rowBgColorHover,
                                                                    },
                                                                    borderBottomLeftRadius: isLast ? '8px' : 0,
                                                                }}>
                                                                    <ListItemAvatar sx={{ minWidth: { xs: 52, sm: 60 } }}>
                                                                        <Box sx={{
                                                                            position: 'relative',
                                                                            width: { xs: 38, sm: 42 },
                                                                            height: { xs: 38, sm: 42 },
                                                                            borderRadius: '50%',
                                                                            overflow: 'hidden',
                                                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                                                        }}>
                                                                            {member.profilePicture ? (
                                                                                <Box
                                                                                    component="img"
                                                                                    src={member.profilePicture}
                                                                                    alt={memberDisplayName}
                                                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                                                />
                                                                            ) : (
                                                                                <Box
                                                                                    sx={{
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        backgroundColor: getAvatarBackgroundColor(memberDisplayName || String(member.id || 'player')),
                                                                                        color: '#fff',
                                                                                        fontWeight: 800,
                                                                                        fontSize: { xs: 12, sm: 13 },
                                                                                        textTransform: 'uppercase',
                                                                                        letterSpacing: 0.4,
                                                                                    }}
                                                                                >
                                                                                    {getAvatarInitials({ name: memberDisplayName, firstName, lastName })}
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    </ListItemAvatar>
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography className="league-table-row-text" noWrap sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 15 }, color: '#fff', fontFamily: 'var(--font-woodford-bourne-pro), sans-serif', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {formatPlayerCardStyleName(firstName, lastName)}
                                                                        </Typography>
                                                                        <Typography className="league-table-row-text" sx={{ fontSize: { xs: 10, sm: 12 }, color: 'rgba(255,255,255,0.6)', mt: 0.25, fontFamily: 'var(--font-woodford-bourne-pro), sans-serif' }}>
                                                                            {getMemberPositionLabel(member)}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {/* Playing Style column */}
                                                                <Box sx={{
                                                                    width: { xs: 108, sm: 150, md: 180 },
                                                                    minWidth: { xs: 108, sm: 150, md: 180 },
                                                                    flexShrink: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    pr: { xs: 0.5, sm: 2 },
                                                                }}>
                                                                    <Typography className="league-table-row-text" sx={{ fontWeight: 'bold', fontSize: { xs: 11, sm: 13, md: 18 }, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-woodford-bourne-pro), sans-serif' }}>
                                                                        {member.style}
                                                                    </Typography>
                                                                </Box>

                                                                {/* Spacer */}
                                                                <Box sx={{ flex: 1 }} />

                                                                {/* View Stats column */}
                                                                <Box sx={{ minWidth: { xs: 90, sm: 120 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                    <Image src={TableGraphIcon} alt="View Stats" width={isMobile ? 23 : 30} height={isMobile ? 23 : 30} style={{ objectFit: 'contain' }} />
                                                                </Box>

                                                                {/* XP Points column */}
                                                                <Box sx={{ minWidth: { xs: 90, sm: 120 }, ml: { xs: 1, sm: 1.5, md: 5.5 }, textAlign: 'center' }}>
                                                                    <Typography className="league-table-row-text" sx={{ fontWeight: 'bold', fontSize: { xs: 13, sm: 16 }, color: '#fff', fontFamily: 'var(--font-woodford-bourne-pro), sans-serif' }}>
                                                                        {getLeagueXpForMember(member.id, member.xp)}
                                                                    </Typography>
                                                                </Box>
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                            )}
                            {section === 'matches' && (
                                // Fixtures Section - Upcoming Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    pb: { xs: 2, md: 3 },
                                    // p: 2
                                }}>
                                    {isAdmin && (
                                        league?.active ? (
                                            <Link href={`/league/${leagueId}/match`} passHref>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    sx={{
                                                        background: '#dddddd',
                                                        color: '#e1671e',
                                                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.5rem' },
                                                        fontWeight: 600,
                                                        py: 0.5,
                                                        mb: 3,
                                                        borderRadius: 1,
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            background: '#cbcaca',
                                                        },
                                                    }}
                                                >
                                                    <span className="mr-2 text-[#656565]">+ </span>   New Match
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => toast.error(inactiveLeagueMatchMessage)}
                                                sx={{
                                                    background: 'rgba(255,255,255,0.12)',
                                                    color: 'rgba(255,255,255,0.45)',
                                                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.5rem' },
                                                    fontWeight: 600,
                                                    py: 0.5,
                                                    mb: 3,
                                                    borderRadius: 1,
                                                    textTransform: 'none',
                                                    '&:hover': { background: 'rgba(255,255,255,0.18)' },
                                                }}
                                            >
                                                <span className="mr-2 text-[#656565]">+ </span>   New Match
                                            </Button>
                                        )
                                    )}
                                    <Paper sx={{
                                        background: '#1a1a1a',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        borderRadius: 2,
                                        // py: { xs: 5, sm: 7 },
                                        // px: { xs: 2, sm: 4 },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        mt: 1,
                                    }}>


                                        <Typography
                                            sx={{
                                                color: 'rgba(255,255,255,0.78)',
                                                fontSize: { xs: '0.78rem', sm: '0.86rem' },
                                                mb: 2,
                                                lineHeight: 1.5,
                                                mt:2
                                            }}
                                        >
                                            Match fixtures will move to Match Results once the match has finished. Please check the fixture duration time to know when to view completed matches.
                                        </Typography>
                                    </Paper>

                                    {filteredLeague?.matches && filteredLeague.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                                            gap: 2
                                        }}>
                                            {filteredLeague.matches
                                                .filter((match) => isFixtureMatch(match))
                                                .sort(compareMatchesDesc)
                                                .map((match, idx) => {
                                                    const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                                                    const seasonMatchNumberRaw = (match as unknown as { seasonMatchNumber?: unknown })?.seasonMatchNumber;
                                                    const seasonMatchNumber =
                                                        typeof seasonMatchNumberRaw === 'number'
                                                            ? seasonMatchNumberRaw
                                                            : (typeof seasonMatchNumberRaw === 'string' ? Number(seasonMatchNumberRaw) : NaN);
                                                    const matchNumber =
                                                        (Number.isFinite(seasonMatchNumber) && seasonMatchNumber > 0 ? seasonMatchNumber : null)
                                                        ?? getNumericIndex(match)
                                                        ?? (idx + 1);
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
                                                                borderRadius: 1,
                                                                overflow: 'hidden',
                                                                background: '#222',
                                                                cursor: 'pointer',
                                                                border: '2px solid #fff',
                                                                '& .MuiCardContent-root': {
                                                                    pb: 0
                                                                },
                                                                '& .MuiCardContent-root:last-child': {
                                                                    pb: 0
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
                                                                    fontFamily: 'var(--font-woodford-bourne-pro)',
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
                                                                    py: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    borderBottom: '2px solid #fff',
                                                                    gap: 0
                                                                }}>
                                                                    {/* Home Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        minWidth: 0,
                                                                        // width: '30%'
                                                                    }}>
                                                                        <Image
                                                                            src={resolveImageUrl(match.homeTeamImage || HomeTeamImage)}
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
                                                                        justifyContent: 'center',
                                                                        minWidth: 0
                                                                    }}>
                                                                        <Typography sx={{
                                                                            fontFamily: 'var(--font-oswald), "Oswald", sans-serif !important',
                                                                            fontWeight: 600,
                                                                            fontSize: '2rem',
                                                                            lineHeight: 0.5,
                                                                            letterSpacing: '-2px',
                                                                            textTransform: 'uppercase',
                                                                            color: 'white',
                                                                        }}>
                                                                            V/S
                                                                        </Typography>
                                                                        <Typography sx={{
                                                                            color: '#ddd',
                                                                            fontSize: '0.85rem',
                                                                            textAlign: 'center',
                                                                            mt: 1
                                                                        }}>
                                                                            {durationMinutes} Minutes Match
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Away Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        minWidth: 0,
                                                                        // width: '30%'
                                                                    }}>
                                                                        <Image
                                                                            src={resolveImageUrl(match.awayTeamImage || AwayTeamImage)}
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
                                                                    display: 'flex',
                                                                    flexDirection: 'row'
                                                                }}>
                                                                    {/* Left Info Column */}
                                                                    <Box sx={{
                                                                        flex: 1,
                                                                        p: 1.5,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'flex-start',
                                                                        gap: 1.5,
                                                                        // pl: 2,
                                                                        // pr: 2
                                                                    }}>
                                                                        {/* Date Row */}
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', overflow: 'hidden' }}>
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
                                                                                    setViewTeamMatch({ leagueId, matchId: match.id, matchNumber });
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
                                                                                View Teams
                                                                            </Button>
                                                                        </Box>

                                                                        {/* Location Row */}
                                                                        {match.location && (
                                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                                                <Box sx={{ mt: 0.3 }}><Image src={LocationImg} alt="Location" width={18} height={18} /></Box>
                                                                                <Typography sx={{ color: '#ccc', fontSize: '0.85rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
                                                                                    {formatLocationForCard(match.location)}
                                                                                </Typography>
                                                                            </Box>
                                                                        )}

                                                                        {/* Availability Buttons */}
                                                                        {isMember && (
                                                                            <Box sx={{
                                                                                display: 'flex', gap: 1, mb: 0, flexWrap: 'nowrap'
                                                                                //  mt: 1
                                                                            }}>
                                                                                <Button
                                                                                    variant="contained"
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleToggleAvailability(match.id, false);
                                                                                    }}
                                                                                    disabled={availabilityLoading[match.id] || !league?.active || !isSelectedSeasonActive}
                                                                                    sx={{
                                                                                        background: '#00af80',
                                                                                        color: 'white',
                                                                                        textTransform: 'none',
                                                                                        fontWeight: 500,
                                                                                        fontSize: '0.9rem',
                                                                                        py: 0.35,
                                                                                        px: 1.25,
                                                                                        whiteSpace: 'nowrap',
                                                                                        minWidth: '100px',
                                                                                        boxShadow: isUserAvailable ? '0 0 12px 3px rgba(0, 175, 128, 0.7), 0 0 20px rgba(0, 255, 180, 0.4)' : 'none',
                                                                                        border: isUserAvailable ? '2px solid #00ffaa' : 'none',
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
                                                                                        handleToggleAvailability(match.id, true);
                                                                                    }}
                                                                                    disabled={availabilityLoading[match.id] || !league?.active || !isSelectedSeasonActive}
                                                                                    sx={{
                                                                                        background: '#c62828',
                                                                                        color: 'white',
                                                                                        textTransform: 'none',
                                                                                        fontWeight: 500,
                                                                                        fontSize: '0.9rem',
                                                                                        py: 0.35,
                                                                                        px: 1.25,
                                                                                        whiteSpace: 'nowrap',
                                                                                        minWidth: '100px',
                                                                                        boxShadow: !isUserAvailable ? '0 0 12px 3px rgba(198, 40, 40, 0.7), 0 0 20px rgba(255, 100, 100, 0.4)' : 'none',
                                                                                        border: !isUserAvailable ? '2px solid #ff6b6b' : 'none',
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
                                                                        borderTop: 'none',
                                                                        pl: 1,
                                                                        pr: 2,
                                                                        py: 1,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'flex-start',
                                                                        gap: 2
                                                                    }}>
                                                                        {isAdmin ? (
                                                                            <>
                                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', textAlign: 'left' }}>
                                                                                    Admin Only
                                                                                </Typography>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditMatchId(match.id);
                                                                                        setEditMatchDialogOpen(true);
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
                                        <Paper sx={{
                                            background: '#1a1a1a',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            borderRadius: 2,
                                            py: { xs: 5, sm: 7 },
                                            px: { xs: 2, sm: 4 },
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1.5,
                                            mt: 1,
                                        }}>
                                            <Box sx={{ opacity: 0.3 }}>
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, textAlign: 'center', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                                No upcoming matches scheduled yet
                                            </Typography>
                                        </Paper>
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
                                    pb: { xs: 2, md: 3 },
                                    // p: 2
                                }}>
                                    {isAdmin && (
                                        league?.active ? (
                                            <Link href={`/league/${leagueId}/match`} passHref>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    sx={{
                                                        background: '#dddddd',
                                                        color: '#e1671e',
                                                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.5rem' },
                                                        fontWeight: 600,
                                                        py: 0.5,
                                                        mb: 3,
                                                        borderRadius: 1,
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            background: '#cbcaca',
                                                        },
                                                    }}
                                                >
                                                    <span className="mr-2 text-[#656565]">+ </span>   New Match
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => toast.error(inactiveLeagueMatchMessage)}
                                                sx={{
                                                    background: 'rgba(255,255,255,0.12)',
                                                    color: 'rgba(255,255,255,0.45)',
                                                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.5rem' },
                                                    fontWeight: 600,
                                                    py: 0.5,
                                                    mb: 3,
                                                    borderRadius: 1,
                                                    textTransform: 'none',
                                                    '&:hover': { background: 'rgba(255,255,255,0.18)' },
                                                }}
                                            >
                                                <span className="mr-2 text-[#656565]">+ </span>   New Match
                                            </Button>
                                        )
                                    )}

                                    {filteredLeague?.matches && filteredLeague.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                                            gap: 2
                                        }}>
                                            {filteredLeague.matches
                                                .filter((match) => isResultMatch(match))
                                                .sort(compareMatchesDesc)
                                                .map((match, idx) => {
                                                    const seasonMatchNumberRaw = (match as unknown as { seasonMatchNumber?: unknown })?.seasonMatchNumber;
                                                    const seasonMatchNumber =
                                                        typeof seasonMatchNumberRaw === 'number'
                                                            ? seasonMatchNumberRaw
                                                            : (typeof seasonMatchNumberRaw === 'string' ? Number(seasonMatchNumberRaw) : NaN);
                                                    const matchNumber =
                                                        (Number.isFinite(seasonMatchNumber) && seasonMatchNumber > 0 ? seasonMatchNumber : null)
                                                        ?? getNumericIndex(match)
                                                        ?? (idx + 1);
                                                    const startTime = match.start ? new Date(match.start) : new Date(match.date);
                                                    const endTime = match.end ? new Date(match.end) : new Date(startTime.getTime() + 90 * 60000);
                                                    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                                                    const cardActionButtonSx = {
                                                        color: 'white',
                                                        fontSize: { xs: '0.48rem', sm: '0.55rem' },
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                        py: 0,
                                                        px: { xs: 0.45, sm: 0.75 },
                                                        height: { xs: '24px', sm: '28px' },
                                                        minHeight: { xs: '24px', sm: '28px' },
                                                        borderRadius: '50px',
                                                        whiteSpace: 'nowrap',
                                                        width: '100%',
                                                        minWidth: 0,
                                                        justifyContent: 'center',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        '&:hover': { backgroundColor: '#444' },
                                                        '& .MuiButton-startIcon': {
                                                            mr: { xs: 0.2, sm: 0.35 },
                                                            ml: 0,
                                                            display: 'inline-flex',
                                                            flexShrink: 0,
                                                        },
                                                        '& .MuiButton-startIcon img': {
                                                            display: 'block',
                                                        },
                                                    } as const;

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
                                                                '& .MuiCardContent-root:last-child': {
                                                                    paddingBottom: 0
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
                                                                    fontFamily: 'var(--font-woodford-bourne-pro)',
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

                                                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
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
                                                                        {isAwaitingConfirmationStatus(match.status) ? 'Awaiting Confirmation' : resultText}
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
                                                                    mt: -3.5,
                                                                    gap: 0
                                                                }}>
                                                                    {/* Home Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        minWidth: 0,
                                                                    }}>
                                                                        <Image
                                                                            src={resolveImageUrl(match.homeTeamImage || HomeTeamImage)}
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
                                                                        mt: 1,
                                                                        minWidth: 0
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
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
                                                                                fontFamily: 'var(--font-oswald), "Oswald", sans-serif !important',
                                                                                fontWeight: 600,
                                                                                fontSize: '1.5rem',
                                                                                lineHeight: 0.5,
                                                                                letterSpacing: '-2px',
                                                                                textTransform: 'uppercase',
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
                                                                        minWidth: 0,
                                                                    }}>
                                                                        <Image
                                                                            src={resolveImageUrl(match.awayTeamImage || AwayTeamImage)}
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
                                                                    display: 'flex',
                                                                    flexDirection: 'row'
                                                                }}>
                                                                    {/* Left Info Column */}
                                                                    <Box sx={{
                                                                        flex: 1,
                                                                        p: 1.5,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'flex-start',
                                                                        gap: 1
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                            {/* Date Row */}
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', overflow: 'hidden' }}>
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
                                                                                        {formatLocationForCard(match.location)}
                                                                                    </Typography>
                                                                                </Box>
                                                                            ) : (
                                                                                <Box sx={{ height: '20px' }} />
                                                                            )}
                                                                        </Box>

                                                                        {/* MOTM Section */}
                                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', mt: { xs: -5, sm: -7.5 } }}>
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minHeight: 52, gap: 0 }}>
                                                                                <Image src={CardStar} alt="MOTM" width={34} height={34} />
                                                                                {(() => {
                                                                                    const motmPlayerName = getTopMotmPlayerName(match, league?.members || []);
                                                                                    return (
                                                                                        <>
                                                                                            <Typography
                                                                                                sx={{
                                                                                                    color: motmPlayerName ? '#FFD700' : '#ffff',
                                                                                                    fontSize: '0.6rem',
                                                                                                    fontWeight: 700,
                                                                                                    textAlign: 'center',
                                                                                                    mt: 0.5,
                                                                                                    minHeight: '0.8rem',
                                                                                                    lineHeight: 1.1,
                                                                                                    maxWidth: '100px',
                                                                                                    whiteSpace: 'nowrap',
                                                                                                    overflow: 'hidden',
                                                                                                    textOverflow: 'ellipsis',
                                                                                                    visibility: motmPlayerName ? 'visible' : 'visible'
                                                                                                }}
                                                                                            >
                                                                                                {motmPlayerName || 'Select the MOTM'}
                                                                                            </Typography>
                                                                                            <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center' }}>
                                                                                                Man Of The Match
                                                                                            </Typography>
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </Box>
                                                                        </Box>

                                                                        {/* Action Buttons */}
                                                                        <Box sx={{
                                                                            display: 'grid',
                                                                            gridTemplateColumns: (isAdmin || isMember) ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                            mt: 0.5,
                                                                            width: '100%'
                                                                        }}>
                                                                            {/* Add Stats Button */}
                                                                            {(isAdmin || isMember) && (() => {
                                                                                const isInMatch = match.homeTeamUsers?.some((u) => String(u?.id) === String(user?.id)) ||
                                                                                    match.awayTeamUsers?.some((u) => String(u?.id) === String(user?.id));
                                                                                const isDisabled =
                                                                                    !league?.active ||
                                                                                    match.archived ||
                                                                                    !isSelectedSeasonActive;
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
                                                                                                setSelectedMatchIdForDialog(match.id);
                                                                                                setShouldShowAdminGoals(false);
                                                                                                setMatchStatsOpen(true);
                                                                                            }
                                                                                        }}
                                                                                        sx={{
                                                                                            cursor: 'pointer',
                                                                                            width: '100%',
                                                                                            '&:hover .add-stats-btn': {
                                                                                                backgroundColor: '#444',
                                                                                            },
                                                                                        }}
                                                                                    >
                                                                                        <Button
                                                                                            className="add-stats-btn"
                                                                                            size="small"
                                                                                            startIcon={<Image src={ADDSTATS} alt="Add Stats" width={isMobile ? 13 : 17} height={isMobile ? 13 : 17} />}
                                                                                            disabled={isDisabled && (isAdmin || !!isInMatch)}
                                                                                            sx={{
                                                                                                ...cardActionButtonSx,
                                                                                                pointerEvents: 'none',
                                                                                                border: '1.4px solid #F97316',
                                                                                                '&.Mui-disabled': { color: 'white' },
                                                                                            }}
                                                                                        >
                                                                                            Add Stats
                                                                                        </Button>
                                                                                    </Box>
                                                                                );
                                                                            })()}

                                                                            {/* View Team Button */}
                                                                            <Button
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setViewTeamMatch({ leagueId, matchId: match.id, matchNumber });
                                                                                    setViewTeamOpen(true);
                                                                                }}
                                                                                startIcon={<Image src={ViewTeamImg} alt="View Team" width={isMobile ? 13 : 17} height={isMobile ? 13 : 17} />}
                                                                                sx={{
                                                                                    ...cardActionButtonSx,
                                                                                    border: '1.4px solid #F97316',
                                                                                }}
                                                                            >
                                                                                View Teams
                                                                            </Button>

                                                                            {/* Results Button */}
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => { setResultsDialogMatchId(match.id); setResultsDialogOpen(true); }}
                                                                                startIcon={<Image src={RESULTS} alt="Results" width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} />}
                                                                                sx={{
                                                                                    ...cardActionButtonSx,
                                                                                    border: '1.4px solid #F97316',
                                                                                    '&.Mui-disabled': { color: 'white' },
                                                                                }}
                                                                            >
                                                                                Results
                                                                            </Button>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Right Admin Column */}
                                                                    <Box sx={{
                                                                        width: '100px',
                                                                        borderLeft: '2px solid #fff',
                                                                        borderTop: 'none',
                                                                        p: 1,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'flex-start',
                                                                        gap: 1
                                                                    }}>
                                                                        {isAdmin ? (
                                                                            <>
                                                                                <Typography sx={{ color: 'white', fontSize: '0.65rem', textAlign: 'left', ml: '5px' }}>
                                                                                    Admin Only
                                                                                </Typography>
                                                                                {/* Add Score Button */}
                                                                                <Button
                                                                                    onClick={() => {
                                                                                        setSelectedMatchIdForDialog(match.id);
                                                                                        setShouldShowAdminGoals(true);
                                                                                        setMatchStatsOpen(true);
                                                                                    }}
                                                                                    disabled={match.archived || !league?.active}
                                                                                    startIcon={<Edit size={14} color="#00a77f" />}
                                                                                    sx={{
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        ml: '5px',
                                                                                        fontSize: '0.7rem',
                                                                                        fontWeight: 600,
                                                                                        whiteSpace: 'nowrap',
                                                                                        textDecoration: 'underline',
                                                                                        '& .MuiButton-startIcon': { mr: 1 },
                                                                                    }}
                                                                                >
                                                                                    Add Score
                                                                                </Button>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditMatchId(match.id);
                                                                                        setEditMatchDialogOpen(true);
                                                                                    }}
                                                                                    disabled={!league?.active || match.archived}
                                                                                    startIcon={<Edit size={14} color="#00a77f" />}
                                                                                    sx={{
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        ml: '5px',
                                                                                        fontSize: '0.7rem',
                                                                                        fontWeight: 600,
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
                                                                                        color: '#fff',
                                                                                        justifyContent: 'flex-start',
                                                                                        textTransform: 'none',
                                                                                        p: 0,
                                                                                        ml: '5px',
                                                                                        fontSize: '0.65rem',
                                                                                        fontWeight: 600,
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
                                                            {isAdmin && match.archived && (
                                                                <Box
                                                                    sx={{
                                                                        display: 'grid',
                                                                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                                        borderTop: '2px solid #fff',
                                                                        backgroundColor: '#F97316',
                                                                    }}
                                                                >
                                                                    <Button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            void handleRestoreMatch(match);
                                                                        }}
                                                                        startIcon={<Undo2 size={16} />}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            color: '#fff',
                                                                            backgroundColor: '#F97316',
                                                                            textTransform: 'none',
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '0.86rem', sm: '0.95rem' },
                                                                            py: 1.1,
                                                                            borderRight: '1px solid rgba(255,255,255,0.45)',
                                                                            '&:hover': { backgroundColor: '#EA580C' },
                                                                        }}
                                                                    >
                                                                        Restore
                                                                    </Button>
                                                                    <Button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            void handlePermanentDeleteFromArchivedCard(match);
                                                                        }}
                                                                        startIcon={<Trash2 size={16} />}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            color: '#fff',
                                                                            backgroundColor: '#F97316',
                                                                            textTransform: 'none',
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '0.82rem', sm: '0.92rem' },
                                                                            py: 1.1,
                                                                            borderLeft: '1px solid rgba(255,255,255,0.45)',
                                                                            '&:hover': { backgroundColor: '#EA580C' },
                                                                        }}
                                                                    >
                                                                        Permanent Delete
                                                                    </Button>
                                                                </Box>
                                                            )}
                                                        </Card>
                                                    );
                                                })}
                                        </Box>
                                    ) : (
                                        <Paper sx={{
                                            background: '#1a1a1a',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            borderRadius: 2,
                                            py: { xs: 5, sm: 7 },
                                            px: { xs: 2, sm: 4 },
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1.5,
                                            mt: 1,
                                        }}>
                                            <Box sx={{ opacity: 0.3 }}>
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, textAlign: 'center', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                                No completed matches yet
                                            </Typography>
                                        </Paper>
                                    )}
                                </Box>
                            )}

                            {section === 'dream-team' && (
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    overflowX: 'hidden',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    width: '99.4vw',
                                    position: 'relative',
                                    left: '50%',
                                    right: '50%',
                                    marginLeft: '-50vw',
                                    marginRight: '-50vw',
                                    mt: -4
                                }}>
                                    {dreamTeamLoading ? (
                                        <LeagueDetailLoadingSkeleton mode="dream" />
                                    ) : (
                                        <>
                                            {/* Field (image) - Full width without side spaces */}
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    width: '100vw',
                                                    maxWidth: '100vw',
                                                    marginLeft: 'calc(50% - 50vw)',
                                                    height: { xs: '500px', sm: '550px', md: '600px', lg: 'auto' },
                                                    aspectRatio: { lg: '2251 / 1146' },
                                                    overflow: 'hidden',
                                                    mt: 0,
                                                }}
                                            >
                                                <Image
                                                    fill
                                                    src={fieldImg}
                                                    alt="Football Field"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        objectPosition: 'center center'
                                                    }}
                                                />

                                                {/* Dream Team Title Text Overlay */}
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: { xs: '27%', sm: '24%', md: '24%', lg: '24%', xl: '25%' },
                                                        left: { xs: '2%', sm: '10%', md: '18%', lg: '19%', xl: '20%' },
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            color: '#ffffff',
                                                            fontWeight: 600,
                                                            fontSize: { xs: '8px', sm: '18px', md: '22px', lg: '24px', xl: '28px' },
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '2px',
                                                            // textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                                                            lineHeight: 1.2,
                                                            transform: 'rotate(7deg)',
                                                            transformOrigin: 'left center',
                                                        }}
                                                    >
                                                        5 ASIDE DREAM TEAM
                                                    </Typography>
                                                </Box>

                                                {/* Overlay players */}
                                                {(() => {
                                                    // Get league members with their XP
                                                    const leagueMembers = filteredLeague?.members || [];

                                                    // Map members with their XP and sort by XP (highest first)
                                                    const playersWithXP = leagueMembers.map(member => ({
                                                        ...member,
                                                        xp: getLeagueXpForMember(member.id, member.xp)
                                                    })).sort((a, b) => b.xp - a.xp);

                                                    // Take top 5 players based on XP
                                                    const playersToShow = playersWithXP.slice(0, 5);

                                                    console.log('✅ Dream Team - Top 5 XP Players:', playersToShow.map(p => ({
                                                        name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim(),
                                                        xp: p?.xp || 0,
                                                        positionType: p?.positionType || 'N/A'
                                                    })));

                                                    // Define positions based on number of players (adjusted to stay inside pitch boundaries)
                                                    const getPositions = (count: number) => {
                                                        if (count === 1) {
                                                            return [{ left: '55%', top: '68%' }];
                                                        } else if (count === 2) {
                                                            return [
                                                                { left: '45%', top: '72%' },
                                                                { left: '65%', top: '66%' },
                                                            ];
                                                        } else if (count === 3) {
                                                            return [
                                                                { left: '42%', top: '73%' },
                                                                { left: '56%', top: '67%' },
                                                                { left: '70%', top: '61%' },
                                                            ];
                                                        } else if (count === 4) {
                                                            return [
                                                                { left: '40%', top: '75%' },
                                                                { left: '48%', top: '66%' },
                                                                { left: '62%', top: '70%' },
                                                                { left: '70%', top: '61%' },
                                                            ];
                                                        } else {
                                                            // 5 players - 2-2-1 formation (inside pitch boundaries: 2 defenders, 2 midfielders, 1 attacker)
                                                            return [
                                                                { left: { xs: '17%', sm: '17%', md: '35%' }, top: { xs: '70%', sm: '70%', md: '70%' } }, // Defender 1 (left)
                                                                { left: { xs: '52%', sm: '52%', md: '52%' }, top: { xs: '79.5%', sm: '79.5%', md: '80%' } }, // Defender 2 (right)
                                                                { left: { xs: '34%', sm: '34%', md: '44%' }, top: { xs: '65%', sm: '65%', md: '62%' } }, // Midfielder 1 (left)
                                                                { left: { xs: '69%', sm: '69%', md: '63%' }, top: { xs: '73%', sm: '73%', md: '70%' } }, // Midfielder 2 (right)
                                                                { left: { xs: '60%', sm: '60%', md: '55%' }, top: { xs: '63%', sm: '63%', md: '61%' } }, // Attacker (center)
                                                            ];
                                                        }
                                                    };

                                                    const positions = getPositions(playersToShow.length);

                                                    return playersToShow.map((player, idx) => {
                                                        const pos = positions[idx];
                                                        if (!player || !pos) return null;
                                                        return (
                                                            <Box
                                                                key={`player-${idx}-${player.id}`}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    left: pos.left,
                                                                    top: pos.top,
                                                                    transform: 'translate(-50%, -50%)',
                                                                    textAlign: 'center',
                                                                    zIndex: 2,
                                                                }}
                                                            >
                                                                {/* Shirt */}
                                                                <Box
                                                                    sx={{
                                                                        position: 'relative',
                                                                        width: { xs: 40, sm: 50, md: 60, lg: 70, xl: 82 },
                                                                        height: { xs: 40, sm: 50, md: 60, lg: 70, xl: 82 },
                                                                        mb: -0.5,
                                                                    }}
                                                                >
                                                                    <Link href={`/player/${player.id}`} prefetch={false}>
                                                                        <Image
                                                                            src={ShirtImg.src}
                                                                            alt="Player Shirt"
                                                                            width={70}
                                                                            height={70}
                                                                            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                                                                        />
                                                                    </Link>
                                                                </Box>

                                                                {/* Player Name - Below Shirt */}
                                                                <Box
                                                                    sx={{
                                                                        position: 'relative',
                                                                        width: 'max-content',
                                                                        mx: 'auto',
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        component="div"
                                                                        sx={{
                                                                            color: '#ffffff',
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '9px', sm: '10px', md: '11px', lg: '12px', xl: '14px' },
                                                                            lineHeight: 1.2,
                                                                            textAlign: 'center',
                                                                            // textShadow: '3px 3px 8px rgba(0,0,0,1), -1px -1px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)',
                                                                            whiteSpace: 'nowrap',
                                                                            // backgroundColor: 'rgba(0,0,0,0.6)',
                                                                            padding: { xs: '2px 6px', sm: '2px 8px', md: '3px 10px', xl: '4px 12px' },
                                                                            // borderRadius: '6px',
                                                                            // border: '1px solid rgba(255,255,255,0.2)',
                                                                        }}
                                                                    >
                                                                        {formatPlayerCardStyleName(player?.firstName, player?.lastName)}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    });
                                                })()}
                                            </Box>
                                        </>
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
                                        mb: 4,
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

                                        <Box
                                            ref={tableScrollRef}
                                            sx={{
                                                width: '100%',
                                                overflowX: 'auto',
                                                overflowY: 'auto',
                                                maxHeight: { xs: '68vh', sm: '70vh', md: '72vh' },
                                                WebkitOverflowScrolling: 'touch',
                                                scrollbarWidth: 'thin',
                                                '&::-webkit-scrollbar': {
                                                    height: '8px',
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: 'rgba(255,255,255,0.12)',
                                                    borderRadius: '9999px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: '#F97316',
                                                    borderRadius: '9999px',
                                                },
                                            }}
                                        >
                                            <div className="min-w-[820px] rounded-lg league-table league-mobile-result-font">
                                                {/* Header Bar aligned to table grid */}
                                                <div className="grid grid-cols-[50px_minmax(180px,1fr)_80px_60px_60px_60px_60px_70px_70px_80px] items-center px-4 py-3 border-b border-border league-header-white">
                                                    <div className="col-start-1 col-span-8 pl-[32px] flex items-center gap-2 text-foreground league-header-text">
                                                        <span className="text-muted-foreground">{invitePlayersMessage}</span>
                                                        <span className="font-bold">{inviteCodeDisplay}</span>
                                                        <button
                                                            type="button"
                                                            className="group p-1.5 rounded border border-transparent cursor-pointer transition-all duration-150 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffff]"
                                                            onClick={handleCopySeasonInviteCode}
                                                            aria-label="Copy invite code"
                                                            title="Copy invite code"
                                                        >
                                                            <Copy className="w-4 h-4 transition-all duration-150 group-hover:text-[#00000] group-hover:scale-110" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="p-1.5 hover:bg-muted rounded transition-colors"
                                                            onClick={handleShareSeasonInvite}
                                                            aria-label="Share invite code"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="col-start-9 col-span-2 justify-self-end pr-1 sm:pr-2">
                                                            {league?.active ? (
                                                                <Link href={`/league/${leagueId}/match`} passHref>
                                                                    <button className="bg-[#e16419] text-primary-foreground font-semibold px-6 py-2 rounded inline-flex items-center whitespace-nowrap">
                                                                        + New Match
                                                                    </button>
                                                                </Link>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toast.error(inactiveLeagueMatchMessage)}
                                                                    className="bg-white/15 text-white/55 font-semibold px-6 py-2 rounded inline-flex items-center whitespace-nowrap hover:bg-white/20"
                                                                >
                                                                    + New Match
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Table Header */}
                                                {/* <div className="grid mt-0 grid-cols-[50px_1fr_80px_60px_60px_60px_60px_70px_70px_80px] items-center px-4 py-3 bg-table-header border-b border-border text-muted-foreground league-header-row league-header-inset league-table-heading">
                                                <div className="text-center">#</div>
                                                <div className="pl-[52px] text-left">NAME</div>
                                                <div className="text-center">MOTM</div>
                                                <div className="text-center">P</div>
                                                <div className="text-center">W</div>
                                                <div className="text-center">D</div>
                                                <div className="text-center">L</div>
                                                <div className="text-center">GD</div>
                                                <div className="text-center">W%</div>
                                                <div className="text-center">{filteredLeague?.showPoints === true ? 'XP' : 'PTS'}</div>
                                            </div> */}

                                                <>
                                                    <div className="grid mt-0 grid-cols-[50px_minmax(180px,1fr)_80px_60px_60px_60px_60px_70px_70px_80px] items-center px-4 py-3 bg-table-header text-white league-header-row league-header-inset font-bold sticky top-0 z-20">
                                                        <div className="text-center league-table-heading">#</div>
                                                        <div className="pl-[52px] sticky left-0 z-10 bg-table-header league-table-heading league-table-heading-left">NAME</div>
                                                        <div className="text-center league-table-heading">MOTM</div>
                                                        <div className="text-center league-table-heading">P</div>
                                                        <div className="text-center league-table-heading">W</div>
                                                        <div className="text-center league-table-heading">D</div>
                                                        <div className="text-center league-table-heading">L</div>
                                                        <div className="text-center league-table-heading">GD</div>
                                                        <div className="text-center league-table-heading">W%</div>
                                                        <div className="text-center league-table-heading league-table-heading-no-transform">{filteredLeague?.showPoints === true ? 'xpPTS' : 'PTS'}</div>
                                                    </div>
                                                    {/* Full width border alag */}
                                                    <div className="w-full border-b border-border" />
                                                </>
                                                {/* Table Rows */}
                                                <div>
                                                    {(() => {
                                                        console.log('📊 Table rendering with:', {
                                                            filteredLeagueShowPoints: filteredLeague?.showPoints,
                                                            leagueShowPoints: league?.showPoints,
                                                            selectedSeasonId: selectedSeasonId,
                                                            willUseXp: filteredLeague?.showPoints === true
                                                        });
                                                        return null;
                                                    })()}
                                                    {[...tableData]
                                                        .sort((a, b) => {
                                                            const aPts = (a.wins ?? 0) * 3 + (a.draws ?? 0);
                                                            const bPts = (b.wins ?? 0) * 3 + (b.draws ?? 0);
                                                            const aXP = a.xp ?? 0;
                                                            const bXP = b.xp ?? 0;
                                                            // showPoints=true means Advanced Scoring, so the final column uses XP.
                                                            const useXpScoring = filteredLeague?.showPoints === true;
                                                            const aScore = useXpScoring ? aXP : aPts;
                                                            const bScore = useXpScoring ? bXP : bPts;
                                                            if (bScore !== aScore) return bScore - aScore;
                                                            if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0);
                                                            if ((a.played ?? 0) !== (b.played ?? 0)) return (a.played ?? 0) - (b.played ?? 0);
                                                            return (a.name || '').localeCompare(b.name || '');
                                                        })
                                                        .map((player, index) => {
                                                            const points = (player.wins ?? 0) * 3 + (player.draws ?? 0);
                                                            const firstName = player.name.split(' ')[0] || player.name;
                                                            const lastName = player.name.split(' ').slice(1).join(' ') || '';
                                                            // showPoints=true means Advanced Scoring, so the final column uses XP.
                                                            const useXpScoring = filteredLeague?.showPoints === true;
                                                            const xpPts = useXpScoring ? (player.xp ?? 0) : points;

                                                            const posLabel = (league?.members || []).find(m => String(m.id) === String(player.id))?.position || '-';
                                                            const member = (league?.members || []).find(m => String(m.id) === String(player.id));
                                                            const playerWithOptionalImage = player as TableData & {
                                                                imageUrl?: string;
                                                                profileImage?: string;
                                                                image?: string;
                                                            };
                                                            const playerImageSrcRaw =
                                                                member?.profilePicture ||
                                                                playerWithOptionalImage.imageUrl ||
                                                                playerWithOptionalImage.profileImage ||
                                                                playerWithOptionalImage.image ||
                                                                '';
                                                            const playerImageSrc =
                                                                typeof playerImageSrcRaw === 'string' && playerImageSrcRaw.trim().length > 0
                                                                    ? playerImageSrcRaw.trim()
                                                                    : '';
                                                            const tablePlayerName = `${firstName} ${lastName}`.trim() || player.name;
                                                            const tablePlayerInitials = getAvatarInitials({
                                                                name: tablePlayerName,
                                                                firstName,
                                                                lastName,
                                                            });
                                                            const isEven = index % 2 === 0;

                                                            return (
                                                                <div
                                                                    key={player.id}
                                                                    onClick={(e) => { e.preventDefault(); if (league?.id) openQuickViewFromTable(String(league.id), String(player.id)); }}
                                                                    className={`league-table-row-text group grid grid-cols-[50px_minmax(180px,1fr)_80px_60px_60px_60px_60px_70px_70px_80px] items-center h-[56px] min-h-[56px] px-4 py-0 cursor-pointer transition-colors hover:bg-muted/50 ${isEven ? 'bg-table-row-even' : 'bg-table-row-odd'} league-row league-row-inset mb-2 font-bold text-white`}
                                                                >
                                                                    {/* Rank */}
                                                                    <div className="text-center text-white font-bold">{index + 1}</div>

                                                                    {/* Player Info */}
                                                                    <div className={`flex items-center gap-3 min-w-0 sticky left-0 z-10 ${isEven ? 'bg-table-row-even group-hover:bg-[#424242]' : 'bg-table-row-odd group-hover:bg-[#353535]'} transition-colors duration-150`}>
                                                                        <div
                                                                            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-white font-bold text-xs"
                                                                            style={{
                                                                                backgroundColor: playerImageSrc
                                                                                    ? 'transparent'
                                                                                    : getAvatarBackgroundColor(tablePlayerName || String(player.id || 'player')),
                                                                            }}
                                                                        >
                                                                            {playerImageSrc ? (
                                                                                <div className="relative w-full h-full">
                                                                                    <Image src={resolveImageUrl(playerImageSrc)} alt={player?.name || 'Player'} fill style={{ objectFit: 'cover' }} />
                                                                                </div>
                                                                            ) : (
                                                                                tablePlayerInitials
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0 justify-center">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className="text-white font-bold truncate uppercase block">{formatPlayerCardStyleName(firstName, lastName)}</span>
                                                                                {player.isAdmin && <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                                                                            </div>
                                                                            <span className="league-table-row-text text-white/90 font-semibold text-xs truncate block whitespace-nowrap">{posLabel}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* MOTM */}
                                                                    <div className="text-center">
                                                                        {typeof player.motmCount === 'number' && player.motmCount > 0 ? (
                                                                            <span className="inline-flex items-center gap-1">
                                                                                <span className="text-white font-bold">{player.motmCount}</span>
                                                                                <span className="inline-flex items-center" style={{ verticalAlign: 'middle' }}>
                                                                                    {/* Using MUI Star icon already imported */}
                                                                                    <Star sx={{ fontSize: 18, color: '#F59E0B' }} />
                                                                                </span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-white/80">-</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Stats */}
                                                                    <div className="text-center text-white font-bold">{player.played}</div>
                                                                    <div className="text-center text-white font-bold">{player.wins}</div>
                                                                    <div className="text-center text-white font-bold">{player.draws}</div>
                                                                    <div className="text-center text-white font-bold">{player.losses}</div>
                                                                    <div className="text-center text-white font-bold">
                                                                        {(player.goalDifference ?? 0) > 0 ? `+${player.goalDifference}` : (player.goalDifference ?? 0)}
                                                                    </div>
                                                                    <div className="text-center text-white font-bold">{player.winPercentage}</div>
                                                                    <div className="text-center text-white font-extrabold uppercase">{xpPts}</div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </Box>
                                        {tableHasHorizontalOverflow && (
                                            <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1, pb: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', mb: 0.5 }}>
                                                    Slide table left/right
                                                </Typography>
                                                <Slider
                                                    value={tableScrollPercent}
                                                    onChange={handleTableSliderChange}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    size="small"
                                                    aria-label="Table horizontal scroll"
                                                    sx={{
                                                        color: '#F97316',
                                                        px: 0.5,
                                                        '& .MuiSlider-thumb': {
                                                            width: 14,
                                                            height: 14,
                                                        },
                                                        '& .MuiSlider-rail': {
                                                            opacity: 0.35,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Card>
                                    {/* // ...existing code... */}
                                    {/* {league && (
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
                                                    Statistics {selectedSeasonId ? seasonLabel : ''}
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

                                                            // Use filteredLeague matches when season is selected, otherwise use all league matches
                                                            const matchesToUse = selectedSeasonId && filteredLeague ? filteredLeague.matches : league?.matches;

                                                            // Prefer backend-provided playedMatches; otherwise derive from matches
                                                            const derivedPlayed = (() => {
                                                                if (!selectedSeasonId && typeof leagueStats?.playedMatches === 'number') return Number(leagueStats.playedMatches);
                                                                const matches = Array.isArray(matchesToUse) ? matchesToUse : [];
                                                                return matches.filter((m) => isResultMatch(m as Match)).length;
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
                                                                    {/* Season progress *\/}
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

                                                                    {/* Players + Created *\/}
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
                                                                                {selectedSeasonId && filteredLeague ? filteredLeague.members.length : (leagueStats.players ?? league?.members?.length ?? 0)} Players
                                                                            </Typography>
                                                                        </Box>

                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                                            <Calendar size={16} color="#F59E0B" />
                                                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontSize: { xs: '0.7rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                                                                                {createdStr}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Best pairing + Hottest *\/}
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
                                    )} */}
                                    {/* // ...existing code... */}
                                </div>
                            )}

                            {section === 'leaderboard' && (
                                // Leaderboard Section - Grid Layout
                                <Box
                                    sx={{
                                        px: { xs: 1, sm: 0 },
                                        pb: { xs: 1, sm: 0 },
                                        pt: { xs: 0, sm: 0 },
                                        mt: { xs: -2, sm: 2 },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                                            gap: 2,
                                            
                                        }}
                                    >
                                        {LEADERBOARD_METRIC_CONFIG.map((metric) => (
                                            <Box
                                                key={metric.key}
                                                sx={{
                                                    background: '#2b2b2b',
                                                    borderRadius: 2,
                                                    border: '1px solid #ffffff',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {/* Card Header */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: { xs: 1, sm: 1.3 },
                                                        // borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                    }}
                                                >
                                                    <Tooltip title="How this metric is calculated" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setLeaderboardInfoMetric(metric.key);
                                                            }}
                                                            sx={{
                                                                p: 0.4,
                                                                // border: '1px solid rgba(255,255,255,0.35)',
                                                                // borderRadius: 1,
                                                                color: '#fff',
                                                                '&:hover': {
                                                                    borderColor: '#fff',
                                                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                                                }
                                                            }}
                                                        >
                                                            <Image src={InfoIcon} alt={`${metric.label} info`} width={13} height={13} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Image src={metric.icon} alt={metric.label} width={38} height={38} />
                                                    <Typography
                                                        sx={{
                                                            color: 'white',
                                                            fontWeight: 500,
                                                            fontSize: { xs: '0.9rem', sm: '1rem' },
                                                            letterSpacing: 0.5,
                                                        }}
                                                    >
                                                        {metric.label}
                                                    </Typography>
                                                </Box>

                                                {/* Players List */}
                                                <Box sx={{ p: 0, ml: -1.2, mt: -0.5 }}>
                                                    {leaderboardLoading ? (
                                                        <LeagueDetailLoadingSkeleton mode="list" />
                                                    ) : (
                                                        (allLeaderboardData[metric.key] || []).slice(0, 5).map((player, idx) => {
                                                            const leaderboardMember = (league?.members || []).find((m) => String(m.id) === String(player.id));
                                                            const leaderboardPlayerName =
                                                                (player.name || `${leaderboardMember?.firstName || ''} ${leaderboardMember?.lastName || ''}`.trim()).trim();
                                                            const leaderboardAvatarSrc =
                                                                typeof leaderboardMember?.profilePicture === 'string' && leaderboardMember.profilePicture.trim().length > 0
                                                                    ? leaderboardMember.profilePicture.trim()
                                                                    : '';
                                                            const leaderboardInitials = getAvatarInitials({
                                                                name: leaderboardPlayerName,
                                                                firstName: leaderboardMember?.firstName,
                                                                lastName: leaderboardMember?.lastName,
                                                            });

                                                            return (
                                                                <Link key={`${metric.key}-${player.id}`} href={`/player/${player.id}`} passHref>
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            px: 2,
                                                                            py: 0.5,
                                                                            borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                                            cursor: 'pointer',
                                                                            transition: 'background 0.2s',
                                                                            background: idx === 0 ? '#383838' : 'transparent',
                                                                            '&:hover': {
                                                                                background: idx === 0 ? '#454545' : 'rgba(255,255,255,0.05)',
                                                                            },
                                                                        }}
                                                                    >
                                                                        {/* Rank Number - aligned with info icon */}
                                                                        <Typography
                                                                            sx={{
                                                                                color: '#fff',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.9rem',
                                                                                width: 20,
                                                                                textAlign: 'center',
                                                                            }}
                                                                        >
                                                                            {idx + 1}
                                                                        </Typography>

                                                                        {/* Player Avatar - aligned with metric icon */}
                                                                        <Box
                                                                            sx={{
                                                                                width: 33,
                                                                                height: 33,
                                                                                borderRadius: '50%',
                                                                                background: leaderboardAvatarSrc
                                                                                    ? 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)'
                                                                                    : getAvatarBackgroundColor(leaderboardPlayerName || String(player.id || 'player')),
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                ml: 1.5,
                                                                                mr: 1.5,
                                                                                overflow: 'hidden',
                                                                                color: '#fff',
                                                                                fontWeight: 700,
                                                                                fontSize: '0.7rem',
                                                                                textTransform: 'uppercase',
                                                                            }}
                                                                        >
                                                                            {leaderboardAvatarSrc ? (
                                                                                <Image src={resolveImageUrl(leaderboardAvatarSrc)} alt={leaderboardPlayerName || 'Player'} width={33} height={33} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                                                            ) : (
                                                                                leaderboardInitials
                                                                            )}
                                                                        </Box>

                                                                        {/* Player Info */}
                                                                        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0, lineHeight: 1 }}>
                                                                            <Typography
                                                                                sx={{
                                                                                    color: 'white',
                                                                                    fontWeight: 600,
                                                                                    fontSize: '0.8rem',
                                                                                    whiteSpace: 'nowrap',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                    lineHeight: 1.1,
                                                                                    mb: 0,
                                                                                }}
                                                                            >
                                                                                {player.name}
                                                                            </Typography>
                                                                            <Typography
                                                                                sx={{
                                                                                    color: '#ffff',
                                                                                    fontSize: '0.65rem',
                                                                                    fontWeight: 300,
                                                                                    lineHeight: 1.1,
                                                                                    mt: 0,
                                                                                }}
                                                                            >
                                                                                {player.positionType || 'Player'}
                                                                            </Typography>
                                                                        </Box>

                                                                        {/* Value */}
                                                                        <Typography
                                                                            sx={{
                                                                                color: 'white',
                                                                                fontWeight: 700,
                                                                                fontSize: '1.1rem',
                                                                                ml: 1,
                                                                            }}
                                                                        >
                                                                            {metric.key === 'contribution' ? `${player.value}%` : player.value}
                                                                        </Typography>
                                                                    </Box>
                                                                </Link>
                                                            );
                                                        })
                                                    )}
                                                    {!leaderboardLoading && (allLeaderboardData[metric.key] || []).length === 0 && (
                                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                                No data available
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Paper>

                        <Dialog
                            open={Boolean(selectedLeaderboardInfo)}
                            onClose={() => setLeaderboardInfoMetric(null)}
                            fullWidth
                            maxWidth="xs"
                            PaperProps={{
                                sx: {
                                    bgcolor: '#1f1f1f',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.16)',
                                    borderRadius: 2,
                                }
                            }}
                        >
                            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                                {selectedLeaderboardInfo?.label || 'Metric Info'}
                            </DialogTitle>
                            <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', mb: 1.5 }}>
                                    {selectedLeaderboardInfo?.infoSummary}
                                </Typography>
                                <Typography sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.85rem', mb: 0.7 }}>
                                    How it is calculated
                                </Typography>
                                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    {selectedLeaderboardInfo?.infoFormula}
                                </Typography>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 2 }}>
                                    Selected league and season filters are applied to this leaderboard.
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 2, pb: 2 }}>
                                <Button
                                    onClick={() => setLeaderboardInfoMetric(null)}
                                    variant="outlined"
                                    sx={{
                                        color: '#fff',
                                        borderColor: 'rgba(255,255,255,0.35)',
                                        '&:hover': {
                                            borderColor: '#fff',
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                        }
                                    }}
                                >
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>

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

                        {/* Results Popup Dialog - renders full MatchDetailsPage */}
                        <Dialog
                            open={resultsDialogOpen}
                            onClose={() => { setResultsDialogOpen(false); setResultsDialogMatchId(null); }}
                            fullWidth
                            maxWidth="lg"
                            fullScreen={isMobile}
                            PaperProps={{
                                sx: {
                                    bgcolor: '#2b2b2b',
                                    backgroundImage: 'none',
                                    borderRadius: { xs: 0, sm: 3 },
                                    width: { xs: '100vw', sm: 'auto' },
                                    maxWidth: { xs: '100vw', sm: 'calc(100% - 64px)' },
                                    height: { xs: '100dvh', sm: 'auto' },
                                    maxHeight: { xs: '100dvh', sm: '95vh' },
                                    overflow: 'hidden',
                                    position: 'relative',
                                    m: { xs: 0, sm: 2 },
                                    border: { xs: 'none', sm: '1px solid #fff' },
                                }
                            }}
                        >
                            <IconButton
                                onClick={() => { setResultsDialogOpen(false); setResultsDialogMatchId(null); }}
                                sx={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    color: '#000',
                                    zIndex: 10,
                                    bgcolor: '#e6e6e6',
                                    borderRadius: { xs: 0, sm: '0 8px 0 0' },
                                    width: { xs: 48, sm: 60 },
                                    height: { xs: 44, sm: 50 },
                                    '&:hover': { bgcolor: '#cfcfcf' }
                                }}
                            >
                                <CloseIcon fontSize={isMobile ? 'small' : 'medium'} />
                            </IconButton>
                            <DialogContent
                                sx={{
                                    p: 0,
                                    pt: { xs: 5.5, sm: 0 },
                                    height: { xs: '100%', sm: 'auto' },
                                    overflowX: 'hidden',
                                    overflowY: { xs: 'hidden', sm: 'auto' },
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' }
                                }}
                            >
                                <Box
                                    sx={{
                                        height: { xs: '100%', sm: 'auto' },
                                        overflowY: { xs: 'auto', sm: 'visible' },
                                        scrollbarWidth: 'none',
                                        '&::-webkit-scrollbar': { display: 'none' }
                                    }}
                                >
                                    {resultsDialogOpen && resultsDialogMatchId && (
                                        <MatchDetailsPage matchIdProp={resultsDialogMatchId} />
                                    )}
                                </Box>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </Container>


            <Dialog
                open={confirmDeleteOpen}
                onClose={() => { setConfirmDeleteOpen(false); setMatchPendingDelete(null); setMatchHasData(null); }}
                fullWidth
                maxWidth="xs"
                PaperProps={{
                    sx: {
                        width: { xs: 'calc(100vw - 16px)', sm: '100%' },
                        m: { xs: 1, sm: 2 },
                        borderRadius: { xs: 1.5, sm: 2 },
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.2rem' }, px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 0.8, sm: 1.2 } }}>
                    {matchDeleteChecking
                        ? 'Checking match...'
                        : pendingDeleteIsFixture
                            ? 'Delete Match Permanently'
                            : 'Archive Match'}
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 } }}>
                    {matchDeleteChecking ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Checking match data...</Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.85rem', sm: '0.95rem' }, lineHeight: 1.45 }}>
                            {pendingDeleteIsFixture
                                ? 'This upcoming fixture will be permanently deleted and will not appear in Match Results.'
                                : 'This match will be moved to Archived Matches. You can restore it or permanently delete it later from Archived Match actions.'}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, p: { xs: 2, sm: 1.5 } }}>
                    <Button onClick={() => { setConfirmDeleteOpen(false); setMatchPendingDelete(null); setMatchHasData(null); }} sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 40 }}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleConfirmDeleteMatch}
                        disabled={matchDeleteChecking}
                        sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 40 }}
                    >
                        {pendingDeleteIsFixture ? 'Delete Permanently' : 'Archive Match'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* // ...existing code... */}
            <Dialog
                open={archivedActionOpen}
                onClose={() => {
                    setArchivedActionOpen(false);
                    setArchivedActionMatch(null);
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        width: { xs: 'calc(100vw - 16px)', sm: '100%' },
                        m: { xs: 1, sm: 2 },
                        borderRadius: { xs: 1.5, sm: 2 },
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.2rem' }, px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 0.8, sm: 1.2 } }}>Archived Match Actions</DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 } }}>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.95rem' }, lineHeight: 1.4 }}>
                        Choose an action for this archived match.
                    </Typography>
                    <Alert severity="info" sx={{ mt: 1 }}>
                        Permanent delete will hide this match forever. Player stats and historical records stay preserved in the database.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, p: { xs: 2, sm: 1.5 } }}>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (!archivedActionMatch) return;
                            handleRestoreMatch(archivedActionMatch);
                            setArchivedActionOpen(false);
                        }}
                        startIcon={<Undo2 size={16} />}
                        sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 40 }}
                    >
                        Restore
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            tryHardDeleteFromDialog();
                        }}
                        startIcon={<Trash2 size={16} />}
                        sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 40 }}
                    >
                        Permanently Delete
                    </Button>
                    {/* // ...existing code... */}
                </DialogActions>
            </Dialog>
            {/* // ...existing code... */}
            <Dialog
                open={viewTeamOpen}
                onClose={() => setViewTeamOpen(false)}
                maxWidth={false}
                fullScreen={isMobile}
                PaperProps={{ sx: { bgcolor: '#2b2b2b', width: { xs: '100%', sm: '90%', md: '65%' }, maxWidth: { xs: '100%', sm: '90%', md: '65%' }, borderRadius: { xs: 0, sm: 2 } } }}
            >
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                        <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: isMobile ? '1.1rem' : '1.8rem' }}>TEAMS</span>
                        {/* <span style={{ fontSize: isMobile ? '1.1rem' : '1.9rem' }}>&#9917;</span> */}
                        <Image src={FootBallIcon} alt="Football" width={24} height={24} />
                        <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: isMobile ? '1.1rem' : '1.8rem' }}>MATCH {viewTeamMatch?.matchNumber ?? '-'}</span>
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
            </Dialog>












            <Dialog
                open={openQuickView}
                onClose={() => setOpenQuickView(false)}
                fullWidth={false}
                maxWidth={false}
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 1.5, sm: 2 },
                        overflow: 'visible',
                        width: { xs: 'calc(100vw - 20px)', sm: 'min(540px, calc(100vw - 56px))' },
                        maxWidth: { xs: 'calc(100vw - 20px)', sm: '540px' },
                        m: { xs: 0.5, sm: 2 },
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 }, bgcolor: '#000', position: 'relative' }}>
                    <Image src={cflogo} alt="CF Logo" width={isMobile ? 160 : 320} height={isMobile ? 160 : 320} />
                    <IconButton onClick={() => setOpenQuickView(false)} sx={{ color: '#fff', position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />
                <DialogContent
                    sx={{
                        py: { xs: 0.65, sm: 2.5 },
                        px: { xs: 0.6, sm: 1.5 },
                        pb: { xs: 2.8, sm: 5 },
                        position: 'relative',
                        overflowX: 'visible',
                        overflowY: 'auto',
                        maxHeight: { xs: '78vh', sm: '70vh' },
                        '@media (min-width:600px)': {
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            '&::-webkit-scrollbar': {
                                display: 'none',
                                width: 0,
                                height: 0,
                            },
                        },
                    }}
                >
                    {quickView.player && (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '64px 160px 64px', sm: '112px minmax(0, 260px) 112px' },
                                gap: { xs: 0.15, sm: 1 },
                                alignItems: 'start',
                                justifyContent: 'center',
                                minHeight: { xs: '308px', sm: '438px' },


                            }}
                        >
                            {/* Left: Stats Icons */}
                            <Paper elevation={0} sx={{
                                p: { xs: 0.3, sm: 1 },
                                border: '1px solid rgba(15, 23, 42, 0.2)',
                                backgroundColor: '#fff',
                                minWidth: 0,
                                minHeight: { xs: '188px', sm: '280px' },
                                height: { xs: '188px', sm: 'auto' },
                                borderRadius: 2,
                                position: 'relative',
                                zIndex: 4,
                                order: { xs: 1, sm: 1 },
                                mt: { xs: 3.4, sm: 6 }
                            }}>
                                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.5rem', sm: '0.8rem' }, letterSpacing: 0, mb: 0.15, lineHeight: 1.05 }}>Current Stats</Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: { xs: 0.06, sm: 0 },
                                    }}
                                >
                                    {[
                                        { img: Goals, label: 'Goals', shortLabel: 'Goals', value: quickView.stats?.goals ?? 0 },
                                        { img: Assist, label: 'Assists', shortLabel: 'Assist', value: quickView.stats?.assists ?? 0 },
                                        { img: Cleansheet, label: 'Clean Sheets', shortLabel: 'Clean', value: quickView.cleanSheets ?? 0 },
                                        { img: Momt, label: 'MOTM', shortLabel: 'MOTM', value: quickView.motmCount ?? 0 },
                                        { img: DefensiveImpact, label: 'Defensive Impact', shortLabel: 'Def', value: quickView.defensiveImpact ?? 0 },
                                        { img: Mentality, label: 'Mentality', shortLabel: 'Mental', value: quickView.mentality ?? 0 },
                                    ].map((it, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: 0.5,
                                                p: { xs: 0.02, sm: 0.3 },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                                                <Image src={it.img} alt={it.label} width={isMobile ? 10 : 20} height={isMobile ? 10 : 20} style={{ objectFit: 'contain' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.58rem', sm: '0.9rem' }, lineHeight: 1 }}>
                                                    {it.value}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#64748b',
                                                    fontSize: { xs: '0.43rem', sm: '0.65rem' },
                                                    textAlign: 'left',
                                                    lineHeight: 1,
                                                    whiteSpace: 'nowrap',
                                                    letterSpacing: 0,
                                                }}
                                            >
                                                {isMobile ? it.shortLabel : it.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <Button
                                    variant="text"
                                    disableRipple
                                    disableFocusRipple
                                    onClick={() => {
                                        const playerId = quickView.player?.id;
                                        if (!playerId) return;
                                        setOpenQuickView(false);
                                        router.push(`/player/${playerId}`);
                                    }}
                                    sx={{

                                        color: '#1976d2',
                                        fontSize: { xs: '0.48rem', sm: '0.75rem' },
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '3px',
                                        WebkitTapHighlightColor: 'transparent',
                                        padding: { xs: '1px 2px', sm: '4px 8px' },
                                        minWidth: 'auto',
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                        },
                                        '&:active': {
                                            boxShadow: 'none',
                                            backgroundColor: 'transparent',
                                        },
                                        '&:focus': {
                                            boxShadow: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                        },
                                        '&.Mui-focusVisible': {
                                            boxShadow: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                        },
                                    }}
                                >
                                    More Stats
                                </Button>
                            </Paper>

                            {/* Center: Player Card */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                position: 'relative',
                                zIndex: 2,
                                order: { xs: 2, sm: 2 }
                            }}>
                                {(() => {
                                    const p = quickView.player as User & PlayerProfileLike;
                                    const fullName = [p.firstName, p.lastName]
                                        .map((part) => (typeof part === 'string' ? part.trim() : ''))
                                        .filter(Boolean)
                                        .join(' ')
                                        .trim();
                                    const playerCardProps = {
                                        name: fullName,
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
                                        width: 260,
                                        height: isMobile ? 410 : 410,
                                        hideShareIcon: true,
                                        position: p.position ?? '',
                                    } satisfies PlayerCardProps;
                                    return (
                                        <Box
                                            sx={{
                                                width: { xs: 160, sm: 260 },
                                                height: { xs: 278, sm: 430 },
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'flex-start',
                                                position: 'relative',
                                                overflow: 'visible',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 260,
                                                    height: { xs: 410, sm: 410 },
                                                    position: { xs: 'absolute', sm: 'relative' },
                                                    top: 0,
                                                    left: { xs: '50%', sm: 'auto' },
                                                    transform: { xs: 'translateX(-50%) scale(0.62)', sm: 'none' },
                                                    transformOrigin: 'top center',
                                                }}
                                            >
                                                <PlayerCard {...playerCardProps} disableImagePopup />
                                            </Box>
                                        </Box>
                                    );
                                })()}
                            </Box>

                            {/* Right: Last 10 Matches */}
                            <Paper elevation={0} sx={{
                                p: { xs: 0.3, sm: 0.75 },
                                border: '1px solid rgba(15, 23, 42, 0.2)',
                                backgroundColor: '#fff',
                                borderRadius: 2,
                                overflowY: 'hidden',
                                minWidth: 0,
                                position: 'relative',
                                zIndex: 4,
                                order: { xs: 3, sm: 3 },
                                mt: { xs: 3.4, sm: 6 },
                                minHeight: { xs: 188, sm: 290 },
                                height: { xs: 188, sm: 'auto' },
                            }}>
                                <Typography sx={{ fontWeight: 800, mb: 0.2, fontSize: { xs: '0.5rem', sm: '0.7rem' }, letterSpacing: 0, lineHeight: 1.05 }}>Last 10 games</Typography>
                                <Stack direction="column" spacing={0.2}>
                                    {(quickView.lastFive ?? []).slice(0, 10).map((m, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: { xs: 14, sm: 28 },
                                                    height: { xs: 14, sm: 24 },
                                                    borderRadius: 0.5,
                                                    backgroundColor: resultColor(m.result),
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: { xs: '0.46rem', sm: '0.6rem' },
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {m.result}
                                            </Box>
                                            {idx === 0 && (
                                                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.45rem', sm: '0.6rem' }, display: { xs: 'none', sm: 'block' } }}>
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
                    {quickView.player && (
                        <Box sx={{ position: 'absolute', right: { xs: 8, sm: 12 }, bottom: { xs: 8, sm: 10 }, zIndex: 10 }}>
                            <IconButton
                                sx={{
                                    bgcolor: '#10b981',
                                    color: '#fff',
                                    width: { xs: 34, sm: 36 },
                                    height: { xs: 34, sm: 36 },
                                    borderRadius: 1.2,
                                    '&:hover': { bgcolor: '#059669' },
                                }}
                                onClick={() => {
                                    const playerName = [quickView.player?.firstName, quickView.player?.lastName]
                                        .map((part) => (typeof part === 'string' ? part.trim() : ''))
                                        .filter(Boolean)
                                        .join(' ')
                                        .trim() || 'Player';
                                    const shareText = `Check out ${playerName}'s stats! ${Number(quickView.xp ?? 0)} XP`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `${playerName} - Champion Footballer`,
                                            text: shareText,
                                        }).catch(() => { });
                                    } else {
                                        navigator.clipboard?.writeText(shareText);
                                        toast.success('Player stats copied!');
                                    }
                                }}
                            >
                                <Share2 size={18} />
                            </IconButton>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Match Dialog */}
            <Dialog
                open={editMatchDialogOpen}
                onClose={() => {
                    setEditMatchDialogOpen(false);
                    setEditMatchId(null);
                }}
                maxWidth="lg"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        bgcolor: '#0a0a0a',
                        backgroundImage: 'none',
                        width: { xs: '100%', md: '85%' },
                        height: { xs: '100dvh', md: 'auto' },
                        maxHeight: { xs: '100dvh', md: '90vh' },
                        borderRadius: { xs: 0, sm: 2 },
                    }
                }}
            >
                {editMatchDialogOpen && editMatchId && (
                    <EditMatchPage
                        leagueIdProp={leagueId}
                        matchIdProp={editMatchId}
                        isDialog={true}
                        onClose={() => {
                            setEditMatchDialogOpen(false);
                            setEditMatchId(null);
                            // Refresh league data after edit
                            fetchLeagueDetails();
                        }}
                    />
                )}
            </Dialog>
        </Box>
    );
}




