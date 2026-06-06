'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Container,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ToggleButtonGroup,
  ToggleButton,
  CardContent,
  Button,
  Menu,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  // Avatar
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useParams, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayerStats, setLeagueFilter, setYearFilter } from '@/lib/features/playerStatsSlice';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '@/lib/useAuth';
import Cookies from 'js-cookie';
import { getAuthToken } from '@/lib/tokenManager';
import CloseButton from '@/Components/CloseButton';
import PlayerCareerLoadingSkeleton from '@/Components/loading/PlayerCareerLoadingSkeleton';
// import api from '@/lib/api'; // Adjust the import based on your project structure

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ---------- THEME (Brand) ----------
const themeColors = {
  primary: '#E56A16',
  primaryAlt: '#CF2326',
  gradient: 'linear-gradient(135deg,#E56A16 0%,#CF2326 100%)',
  gradientSoft: 'linear-gradient(135deg,rgba(229,106,22,0.18) 0%,rgba(207,35,38,0.18) 100%)',
  surfaceBase: '#0a0a0a',
  surfaceAlt: '#1a1a1a',
  surfacePanel: '#1a1a1a',
  cardBg: '#1e1e1e',
  border: '#383a3f',
  borderStrong: 'rgba(255,255,255,0.2)',
  text: '#fff',
  textDim: 'rgba(255,255,255,0.7)',
  textFaint: 'rgba(255,255,255,0.5)',
  success: '#4CAF50',
  warn: '#ffb300',
  danger: '#d32f2f',
  // Chart colors matching the image
  chartBar: '#00bfa5',
  chartBarAlt: '#26a69a',
  chartLine: '#e91e63',
  // Additional colors
  teal: '#009688',
  blue: '#2196F3',
  green: '#4CAF50',
  red: '#F44336',
  orange: '#FF9800',
  pink: '#e91e63',
  cyan: '#00bcd4'
};
// Threshold used for auto switch from weekly to monthly aggregation
const AUTO_SWITCH_THRESHOLD = 26;

// ---------- TYPES ----------
interface PlayerMatchStats {
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  motmVotes?: number;
  impact?: number;
  defence?: number;
  freeKicks?: number;
  penalties?: number;
  xpAwarded?: number;
  result?: 'W' | 'L' | 'D';
}

interface LeagueMatch {
  id: string;
  date: string;
  status?: string;
  end?: string;
  playerStats?: PlayerMatchStats;
  result?: 'W' | 'L' | 'D';
  outcome?: string;
  homeTeamGoals?: number;
  awayTeamGoals?: number;
  homeTeamId?: string;
  homeTeamUsers?: Array<{ id: string; name?: string }>;
  awayTeamUsers?: Array<{ id: string; name?: string }>;
  team1Score?: number;
  team2Score?: number;
  team1Id?: string;
  team1Players?: Array<{ id: string; name?: string; profile?: { name?: string } }>;
  team2Players?: Array<{ id: string; name?: string; profile?: { name?: string } }>; // <â€” added
  // Defensive impact vote IDs (captain picks per match)
  homeDefensiveImpactId?: string;
  awayDefensiveImpactId?: string;
  // Added for filtering by selected league
  leagueId?: string;
  seasonId?: string;
}

interface SeasonInfo {
  id: string;
  name: string;
  seasonNumber?: number;
  isActive?: boolean;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  isMember?: boolean;
  membershipStatus?: string;
  memberStatus?: string;
  inviteStatus?: string;
}

interface LeagueWithMatches {
  id: string;
  name?: string;
  matches?: LeagueMatch[];
  active?: boolean;
  archived?: boolean;
  status?: string;
  maxGames?: number;
  computedStatus?: {
    isComplete?: boolean;
    isCompleted?: boolean;
  };
}
interface PlayerStatsData {
  leagues?: LeagueWithMatches[];
}

const isLeagueActiveForFilter = (l: LeagueWithMatches): boolean => {
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
};

// Helper to safely extract name without using any
type MaybeNameObj = { name?: unknown };
type MaybeRoot = { playerName?: unknown; player?: MaybeNameObj; profile?: MaybeNameObj };
const extractPlayerName = (input: unknown): string => {
  const r = input as MaybeRoot | undefined;
  if (typeof r?.playerName === 'string') return r.playerName;
  const pName = r?.player?.name;
  if (typeof pName === 'string') return pName;
  const prName = r?.profile?.name;
  if (typeof prName === 'string') return prName;
  return '';
};

const getSeasonSortScore = (season: SeasonInfo): number => {
  if (typeof season.seasonNumber === 'number' && Number.isFinite(season.seasonNumber)) {
    return season.seasonNumber;
  }
  const label = String(season.name || '');
  const yearHits = label.match(/\b(19|20)\d{2}\b/g);
  if (yearHits && yearHits.length > 0) return Number(yearHits[yearHits.length - 1]);
  const startTs = season.startDate ? Date.parse(season.startDate) : NaN;
  if (Number.isFinite(startTs)) return startTs;
  const endTs = season.endDate ? Date.parse(season.endDate) : NaN;
  if (Number.isFinite(endTs)) return endTs;
  return -1;
};

const sortSeasonsLatestFirst = (seasonList: SeasonInfo[]): SeasonInfo[] =>
  [...seasonList].sort((a, b) => {
    const aScore = getSeasonSortScore(a);
    const bScore = getSeasonSortScore(b);
    if (aScore !== bScore) return bScore - aScore;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return String(b.name || '').localeCompare(String(a.name || ''), undefined, { numeric: true, sensitivity: 'base' });
  });

const sameId = (a: unknown, b: unknown): boolean =>
  String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

const isSeasonExplicitlyDeclined = (season: SeasonInfo): boolean => {
  const statusTokens = [
    season.membershipStatus,
    season.memberStatus,
    season.inviteStatus,
  ]
    .map((token) => String(token || '').trim().toLowerCase())
    .filter(Boolean);
  return statusTokens.some((token) => token.includes('declin') || token.includes('reject'));
};

const isSeasonActiveLike = (season: SeasonInfo): boolean => {
  if (season.isActive === true || season.active === true) return true;
  const endDate = String(season.endDate || '').trim();
  return !endDate;
};

const formatSeasonDisplayLabel = (season: SeasonInfo): string => {
  if (typeof season.seasonNumber === 'number' && Number.isFinite(season.seasonNumber) && season.seasonNumber > 0) {
    return `Season ${season.seasonNumber}`;
  }
  const raw = String(season.name || '').trim();
  if (!raw) return 'Season';
  const numberHit = raw.match(/season\s*#?\s*(\d+)/i);
  if (numberHit?.[1]) return `Season ${numberHit[1]}`;
  return raw;
};

const normalizeSeasonInfo = (season: unknown): SeasonInfo | null => {
  if (!season || typeof season !== 'object') return null;
  const source = season as Record<string, unknown>;
  const id = String(source.id ?? source._id ?? '').trim();
  if (!id) return null;

  const seasonNumberRaw = source.seasonNumber;
  const parsedSeasonNumber = typeof seasonNumberRaw === 'number'
    ? seasonNumberRaw
    : typeof seasonNumberRaw === 'string' && seasonNumberRaw.trim()
      ? Number(seasonNumberRaw)
      : undefined;
  const seasonNumber = typeof parsedSeasonNumber === 'number' && Number.isFinite(parsedSeasonNumber)
    ? parsedSeasonNumber
    : undefined;

  const name = typeof source.name === 'string' && source.name.trim()
    ? source.name.trim()
    : (seasonNumber && seasonNumber > 0 ? `Season ${seasonNumber}` : 'Season');

  const toOptionalBool = (value: unknown): boolean | undefined => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return undefined;
  };

  return {
    id,
    name,
    seasonNumber,
    startDate: typeof source.startDate === 'string' ? source.startDate : undefined,
    endDate: typeof source.endDate === 'string' ? source.endDate : undefined,
    isMember: toOptionalBool(source.isMember),
    isActive: toOptionalBool(source.isActive),
    active: toOptionalBool(source.active),
    membershipStatus: typeof source.membershipStatus === 'string' ? source.membershipStatus : undefined,
    memberStatus: typeof source.memberStatus === 'string' ? source.memberStatus : undefined,
    inviteStatus: typeof source.inviteStatus === 'string' ? source.inviteStatus : undefined,
  };
};

// Row used for weekly / monthly aggregation
interface PerformanceRow {
  key: string;
  label: string;
  year: string;
  matches: number;
  totalPoints: number;
  avgPoints: number;
  cumulativePoints: number;
}

interface InfluenceEntry {
  metric: string;
  value: number;
  scaled: number;
}

// Replace the empty extending interface with a type alias to satisfy eslint
type StrengthEntry = InfluenceEntry;

interface LeagueComparisonRow {
  metric: string;
  yourTotal: number;
  yourDisplay: string;
  leagueAverage: number;
  leagueDisplay: string;
}

type LeagueMetricValues = {
  goals: number;
  assists: number;
  cleanSheets: number;
  defence: number;
  motmVotes: number;
  defensiveImpactVotes: number;
  impact: number;
};

// ---------- DYNAMIC RECHARTS ----------
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const RadarChart = dynamic(() => import('recharts').then(m => m.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import('recharts').then(m => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import('recharts').then(m => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import('recharts').then(m => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import('recharts').then(m => m.Radar), { ssr: false });

// ---------- STYLED COMPONENTS ----------
const GlassCard = styled(Paper)(() => ({
  background: themeColors.cardBg,
  border: `1px solid ${themeColors.border}`,
  borderRadius: 8,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
}));

const SectionHeader = styled(Box)(() => ({
  background: themeColors.primary,
  padding: '8px 16px',
  borderRadius: '6px 6px 0 0',
  marginBottom: 0,
}));

const SectionTitle = styled(Typography)(() => ({
  fontWeight: 'bold',
  fontSize: 14,
  color: themeColors.text,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}));

// Filter dropdown styled button
const FilterButton = styled(Button)(() => ({
  background: '#2a2a2a',
  color: themeColors.text,
  border: `1px solid ${themeColors.border}`,
  borderRadius: 4,
  padding: '6px 16px',
  fontSize: 12,
  fontWeight: 500,
  textTransform: 'none',
  minWidth: 100,
  '&:hover': {
    background: '#3a3a3a',
    borderColor: themeColors.primary,
  },
  '& .MuiButton-endIcon': {
    marginLeft: 4,
  }
}));

// Chip toggle button
const ChipToggle = styled(Button)<{ active?: boolean }>(({ active }) => ({
  background: active ? themeColors.primary : '#2a2a2a',
  color: themeColors.text,
  border: 'none',
  borderRadius: 4,
  padding: '4px 12px',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'none',
  minWidth: 'auto',
  '&:hover': {
    background: active ? themeColors.primary : '#3a3a3a',
  },
}));

// Impact Table Row Builder (matching Flutter UI)
const ImpactRow = ({ title, value, change, up }: {
  title: string;
  value: string;
  change: string;
  up: boolean;
}) => (
  <TableRow>
    <TableCell sx={{ fontSize: 12, fontWeight: 500, py: 1, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{title}</TableCell>
    <TableCell align="center" sx={{ fontSize: 12, py: 1, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{value}</TableCell>
    <TableCell align="center" sx={{ fontSize: 12, py: 1, color: up ? themeColors.success : themeColors.danger, fontWeight: 500, borderBottom: `1px solid ${themeColors.border}` }}>
      {change}
    </TableCell>
    <TableCell align="center" sx={{ py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
      {up ? <ArrowUpward sx={{ fontSize: 14, color: themeColors.success }} /> : <ArrowDownward sx={{ fontSize: 14, color: themeColors.danger }} />}
    </TableCell>
  </TableRow>
);

// Strength Table Row Builder
const StrengthRow = ({ title, you, diff, up, showComparison }: {
  title: string;
  you: string;
  diff?: string;
  up?: boolean;
  showComparison: boolean;
}) => (
  <TableRow>
    <TableCell sx={{ fontSize: 12, fontWeight: 500, py: 1, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{title}</TableCell>
    <TableCell align="center" sx={{ fontSize: 12, py: 1, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{you}</TableCell>
    {showComparison && (
      <TableCell align="center" sx={{ py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: up ? themeColors.success : themeColors.danger, fontWeight: 500 }}>
            {diff}
          </Typography>
          {up ? <ArrowUpward sx={{ fontSize: 14, color: themeColors.success }} /> : <ArrowDownward sx={{ fontSize: 14, color: themeColors.danger }} />}
        </Box>
      </TableCell>
    )}
  </TableRow>
);

// Helper to extract a display name from a player-like object
// const extractPlayerDisplayName = (p: { id: string; name?: string; profile?: { name?: string } } | undefined): string =>
//   (p?.name || p?.profile?.name || p?.id || '').trim();

// ---------- HELPERS ----------
function calcPoints(ps: PlayerMatchStats | undefined): number {
  if (!ps) return 0;
  // Canonical dashboard points = per-match XP already calculated by backend.
  return typeof ps.xpAwarded === 'number' ? ps.xpAwarded : 0;
}

const toRoundedInt = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
};

const toStatNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const createEmptyLeagueMetrics = (): LeagueMetricValues => ({
  goals: 0,
  assists: 0,
  cleanSheets: 0,
  defence: 0,
  motmVotes: 0,
  defensiveImpactVotes: 0,
  impact: 0,
});

const averageLeagueMetrics = (entries: Array<LeagueMetricValues | null | undefined>): LeagueMetricValues | null => {
  const metricKeys: Array<keyof LeagueMetricValues> = ['goals', 'assists', 'cleanSheets', 'defence', 'motmVotes', 'defensiveImpactVotes', 'impact'];
  const validEntries = entries.filter((entry): entry is LeagueMetricValues => Boolean(entry));
  if (validEntries.length === 0) return null;

  const totals = createEmptyLeagueMetrics();
  validEntries.forEach((entry) => {
    metricKeys.forEach((key) => {
      totals[key] += toStatNumber(entry[key]);
    });
  });

  const count = validEntries.length;
  return metricKeys.reduce((acc, key) => {
    acc[key] = Number((totals[key] / count).toFixed(2));
    return acc;
  }, createEmptyLeagueMetrics());
};

const normalizeLeagueMetrics = (entry: unknown): LeagueMetricValues | null => {
  if (!entry || typeof entry !== 'object') return null;
  const record = entry as Partial<Record<keyof LeagueMetricValues, unknown>>;
  return {
    goals: toStatNumber(record.goals),
    assists: toStatNumber(record.assists),
    cleanSheets: toStatNumber(record.cleanSheets),
    defence: toStatNumber(record.defence),
    motmVotes: toStatNumber(record.motmVotes),
    defensiveImpactVotes: toStatNumber(record.defensiveImpactVotes),
    impact: toStatNumber(record.impact),
  };
};

const averageLeagueMetricsFromPlayerMap = (players: unknown): LeagueMetricValues | null => {
  const playerEntries = Array.isArray(players)
    ? players
    : (players && typeof players === 'object' ? Object.values(players as Record<string, unknown>) : []);

  const normalized = playerEntries
    .map(normalizeLeagueMetrics)
    .filter((entry): entry is LeagueMetricValues => Boolean(entry));

  return averageLeagueMetrics(normalized);
};

const resolveLeagueAverageFromPayload = (payload: unknown): LeagueMetricValues => {
  if (!payload || typeof payload !== 'object') return createEmptyLeagueMetrics();
  const record = payload as Record<string, unknown>;

  // Client formula: average each player's per-match metric, then divide by player count.
  // Example: (player1 xG 0.8 + player2 xG 0.5) / 2 = 0.65.
  const fromPlayers = averageLeagueMetricsFromPlayerMap(record.players);
  if (fromPlayers) return fromPlayers;

  return normalizeLeagueMetrics(record.leagueAvg) || createEmptyLeagueMetrics();
};

const formatStatDecimal = (value: number, suffix = ''): string => {
  const rounded = Math.round(toStatNumber(value) * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display}${suffix}`;
};

function resolveResultForPlayer(match: LeagueMatch, playerId?: string): 'W' | 'L' | 'D' | null {
  const explicit = match.playerStats?.result || match.result || match.outcome;
  if (explicit) {
    const up = String(explicit).toUpperCase();
    if (up === 'W' || up === 'WIN') return 'W';
    if (up === 'D' || up === 'DRAW') return 'D';
    if (up === 'L' || up === 'LOSS' || up === 'LOSE') return 'L';
  }

  if (match.homeTeamGoals != null && match.awayTeamGoals != null) {
    const pid = String(playerId || '');
    const isHomeFromList = (match.homeTeamUsers || []).some(u => String(u.id) === pid);
    const isAwayFromList = (match.awayTeamUsers || []).some(u => String(u.id) === pid);
    const isHome = isHomeFromList || (!isAwayFromList && String(match.homeTeamId || '') === pid);
    const teamGoals = isHome ? Number(match.homeTeamGoals) : Number(match.awayTeamGoals);
    const oppGoals = isHome ? Number(match.awayTeamGoals) : Number(match.homeTeamGoals);
    if (teamGoals === oppGoals) return 'D';
    return teamGoals > oppGoals ? 'W' : 'L';
  }

  if (match.team1Score != null && match.team2Score != null) {
    const pid = String(playerId || '');
    const isTeam1FromList = (match.team1Players || []).some(p => String(p.id) === pid);
    const isTeam1 = isTeam1FromList || String(match.team1Id || '') === pid;
    const teamGoals = isTeam1 ? Number(match.team1Score) : Number(match.team2Score);
    const oppGoals = isTeam1 ? Number(match.team2Score) : Number(match.team1Score);
    if (teamGoals === oppGoals) return 'D';
    return teamGoals > oppGoals ? 'W' : 'L';
  }

  return null;
}

// ---------- COMPONENT ----------
export default function CareerPage() {
  // ...existing code...
  // Make sure data is initialized before leaguesForYear
  const { data: rawData, filters } = useSelector((s: RootState) => s.playerStats);
  const data: PlayerStatsData | undefined = rawData ?? undefined;

  // Ensure leaguesForYear is defined for dropdown usage
  const leaguesForYear: LeagueWithMatches[] = useMemo(() => {
    const list: LeagueWithMatches[] = Array.isArray(data?.leagues)
      ? (data?.leagues as LeagueWithMatches[])
      : [];
    if (list.length === 0) return [];

    const fallbackYear = (() => {
      const years = list
        .flatMap((l) => (Array.isArray(l.matches) ? (l.matches as LeagueMatch[]) : []))
        .map((m) => dayjs(m.date).year());
      return years.length ? Math.max(...years) : dayjs().year();
    })();

    const effectiveYear = filters.year && filters.year !== 'all' ? String(filters.year) : String(fallbackYear);
    return list.filter(
      (l) =>
        isLeagueActiveForFilter(l) &&
        Array.isArray(l.matches) &&
        (l.matches as LeagueMatch[]).some((m) => dayjs(m.date).year().toString() === effectiveYear)
    );
  }, [data?.leagues, filters.year]);
  const { user, token, loading: authLoading } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const currentUserId = String(user?.id || '').trim();
  const routePlayerId = String(playerId || '').trim();
  const canViewPersonalSections = Boolean(currentUserId && routePlayerId && currentUserId === routePlayerId);
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // ...existing code...

  // Get league and year from URL params (passed from player stats page)
  const urlLeagueId = searchParams?.get('leagueId');
  const urlYear = searchParams?.get('year');

  // State for available leagues
  // Use leagues from Redux state if available, fallback to local state
  const leaguesFromRedux = useSelector((state: RootState) => state.playerStats.data?.leagues) as LeagueWithMatches[] | undefined;
  const [availableLeagues, setAvailableLeagues] = useState<LeagueWithMatches[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Initialize filters from URL params on mount
  useEffect(() => {
    if (urlLeagueId) {
      dispatch(setLeagueFilter(urlLeagueId));
    }
    if (urlYear) {
      dispatch(setYearFilter(urlYear));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Extract available leagues from Redux state or data
  useEffect(() => {
    if (leaguesFromRedux && leaguesFromRedux.length > 0) {
      setAvailableLeagues(leaguesFromRedux.filter(isLeagueActiveForFilter));
    } else if (data?.leagues) {
      setAvailableLeagues((data.leagues as LeagueWithMatches[]).filter(isLeagueActiveForFilter));
    }
  }, [leaguesFromRedux, data]);

  useEffect(() => {
    if (!filters.leagueId || filters.leagueId === 'all') return;
    if (availableLeagues.length === 0) return;
    const stillVisible = availableLeagues.some((l) => sameId(l.id, filters.leagueId));
    if (!stillVisible) dispatch(setLeagueFilter('all'));
  }, [availableLeagues, filters.leagueId, dispatch]);

  const averageLeagues = useMemo(() => {
    const source = leaguesFromRedux && leaguesFromRedux.length > 0
      ? leaguesFromRedux
      : ((data?.leagues || []) as LeagueWithMatches[]);
    return source.filter((league) => String(league?.id || '').trim() !== '');
  }, [leaguesFromRedux, data?.leagues]);

  const averageTargetLeagueIds = useMemo(() => {
    const selectedLeagueId =
      filters.leagueId && filters.leagueId !== 'all'
        ? String(filters.leagueId).trim()
        : (urlLeagueId ? String(urlLeagueId).trim() : '');

    if (selectedLeagueId) return [selectedLeagueId];

    return Array.from(
      new Set(averageLeagues.map((league) => String(league.id || '').trim()).filter(Boolean))
    );
  }, [averageLeagues, filters.leagueId, urlLeagueId]);

  const loading = !data;

  useEffect(() => {
    if (!playerId || authLoading) return;
    dispatch(fetchPlayerStats({ playerId, leagueId: filters.leagueId, year: filters.year }));
  }, [playerId, dispatch, filters.leagueId, filters.year, authLoading, refreshNonce]);

  useEffect(() => {
    if (!playerId) return;

    const triggerRefresh = () => {
      setRefreshNonce((prev) => prev + 1);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    window.addEventListener('match-created', triggerRefresh as EventListener);
    window.addEventListener('match-updated', triggerRefresh as EventListener);
    window.addEventListener('match-stats-updated', triggerRefresh as EventListener);
    window.addEventListener('cache-cleared', triggerRefresh as EventListener);
    window.addEventListener('data-mutated', triggerRefresh as EventListener);
    window.addEventListener('focus', triggerRefresh as EventListener);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('match-created', triggerRefresh as EventListener);
      window.removeEventListener('match-updated', triggerRefresh as EventListener);
      window.removeEventListener('match-stats-updated', triggerRefresh as EventListener);
      window.removeEventListener('cache-cleared', triggerRefresh as EventListener);
      window.removeEventListener('data-mutated', triggerRefresh as EventListener);
      window.removeEventListener('focus', triggerRefresh as EventListener);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [playerId]);

  const matches: LeagueMatch[] = useMemo(() => {
    const d: PlayerStatsData | undefined = data;
    return (d?.leagues || [])
      .flatMap((l: LeagueWithMatches) => (l.matches || []).map((m) => ({ ...m, leagueId: l.id } as LeagueMatch)))
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [data]);

  // Match-scoped season data is used only as a fallback when season API is unavailable.
  const playerSeasonIdsForSelectedLeague = useMemo(() => {
    const selectedLeagueId = filters.leagueId;
    if (!selectedLeagueId || selectedLeagueId === 'all') return [] as string[];

    const ids = new Set<string>();
    for (const match of matches) {
      if (!sameId(match.leagueId, selectedLeagueId)) continue;
      const sid = typeof match.seasonId === 'string' ? match.seasonId.trim() : '';
      if (sid) ids.add(sid);
    }
    return Array.from(ids);
  }, [matches, filters.leagueId]);

  // If we only have season IDs, derive stable season numbers from chronology.
  const playerSeasonIdFallbackForSelectedLeague = useMemo<SeasonInfo[]>(() => {
    const selectedLeagueId = filters.leagueId;
    if (!selectedLeagueId || selectedLeagueId === 'all') return [];
    if (playerSeasonIdsForSelectedLeague.length === 0) return [];

    const firstMatchTsBySeasonId = new Map<string, number>();
    for (const match of matches) {
      if (!sameId(match.leagueId, selectedLeagueId)) continue;
      const sid = typeof match.seasonId === 'string' ? match.seasonId.trim() : '';
      if (!sid) continue;
      const ts = dayjs(match.date).valueOf();
      const safeTs = Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
      const prev = firstMatchTsBySeasonId.get(sid);
      if (prev === undefined || safeTs < prev) firstMatchTsBySeasonId.set(sid, safeTs);
    }

    const orderedSeasonIds = [...playerSeasonIdsForSelectedLeague].sort((a, b) => {
      const ta = firstMatchTsBySeasonId.get(a) ?? Number.MAX_SAFE_INTEGER;
      const tb = firstMatchTsBySeasonId.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (ta !== tb) return ta - tb;
      return a.localeCompare(b);
    });

    return orderedSeasonIds.map((sid, index) => ({
      id: sid,
      name: `Season ${index + 1}`,
      seasonNumber: index + 1,
      isActive: index === orderedSeasonIds.length - 1,
    }));
  }, [filters.leagueId, matches, playerSeasonIdsForSelectedLeague]);

  const playerSeasonYearFallbackForSelectedLeague = useMemo<SeasonInfo[]>(() => {
    const selectedLeagueId = filters.leagueId;
    if (!selectedLeagueId || selectedLeagueId === 'all') return [];
    const years = new Set<number>();
    for (const match of matches) {
      if (!sameId(match.leagueId, selectedLeagueId)) continue;
      const y = dayjs(match.date).year();
      if (Number.isFinite(y)) years.add(y);
    }
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((year) => ({
        id: `year-${year}`,
        name: `Season ${year}`,
        seasonNumber: year,
        isActive: year === dayjs().year(),
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }));
  }, [filters.leagueId, matches]);

  // ---------- State for seasons filter ----------
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [availableSeasons, setAvailableSeasons] = useState<SeasonInfo[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const yearFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const leagueFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const seasonFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [leagueMenuOpen, setLeagueMenuOpen] = useState(false);
  const [seasonMenuOpen, setSeasonMenuOpen] = useState(false);

  // Fetch seasons when a league is selected
  useEffect(() => {
    if (!filters.leagueId || filters.leagueId === 'all') {
      setAvailableSeasons([]);
      setSeasonFilter('all');
      return;
    }
    let cancelled = false;
    setSeasonsLoading(true);
    const authToken = token || getAuthToken() || Cookies.get('token') || '';
    const apiUrl = API_BASE_URL;
    const timestamp = Date.now();
    const endpoints = [
      `${apiUrl}/leagues/${filters.leagueId}/seasons?_t=${timestamp}`,
      `${apiUrl}/api/leagues/${filters.leagueId}/seasons?_t=${timestamp}`,
    ];

    (async () => {
      try {
        let response: Response | null = null;
        const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) baseHeaders.Authorization = `Bearer ${authToken}`;
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              headers: baseHeaders,
              credentials: 'include',
              cache: 'no-store',
            });
            if (res.ok) {
              response = res;
              break;
            }
          } catch {
            // Try next endpoint.
          }
        }
        if (!response) throw new Error('seasons_fetch_failed');

        const payload: unknown = await response.json().catch(() => ({}));
        const payloadRecord = (!Array.isArray(payload) && payload && typeof payload === 'object')
          ? payload as { seasons?: unknown; data?: unknown }
          : null;
        const rawList = Array.isArray(payload)
          ? payload
          : Array.isArray(payloadRecord?.seasons)
            ? payloadRecord.seasons
            : Array.isArray(payloadRecord?.data)
              ? payloadRecord.data
              : [];
        const normalized = rawList
          .map((season) => normalizeSeasonInfo(season))
          .filter((season): season is SeasonInfo => Boolean(season));
        const dedupedById = Array.from(new Map(normalized.map((season) => [String(season.id), season])).values());
        const sorted = sortSeasonsLatestFirst(dedupedById);
        const visibleSeasons = sorted.filter((season) => !isSeasonExplicitlyDeclined(season));
        const activeVisibleSeason = visibleSeasons.find((season) => isSeasonActiveLike(season));
        const defaultSeason = activeVisibleSeason || visibleSeasons[0] || sorted[0];
        let finalSeasons = sorted;
        if (finalSeasons.length === 0 && playerSeasonIdFallbackForSelectedLeague.length > 0) {
          finalSeasons = playerSeasonIdFallbackForSelectedLeague;
        }
        if (finalSeasons.length === 0 && playerSeasonYearFallbackForSelectedLeague.length > 0) {
          finalSeasons = playerSeasonYearFallbackForSelectedLeague;
        }
        const resolvedDefaultSeasonId = finalSeasons.length === 0
          ? 'all'
          : (defaultSeason && finalSeasons.some((season) => sameId(season.id, defaultSeason.id))
            ? defaultSeason.id
            : finalSeasons[0].id);

        if (cancelled) return;
        setAvailableSeasons(finalSeasons);
        setSeasonFilter((prev) => {
          if (prev !== 'all' && finalSeasons.some((s) => sameId(s.id, prev))) return prev;
          return resolvedDefaultSeasonId;
        });
        setSeasonsLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.warn('[CareerSeason] Falling back to match-derived seasons:', error);
        if (playerSeasonIdFallbackForSelectedLeague.length > 0) {
          setAvailableSeasons(playerSeasonIdFallbackForSelectedLeague);
          setSeasonFilter((prev) => {
            if (prev !== 'all' && playerSeasonIdFallbackForSelectedLeague.some((s) => sameId(s.id, prev))) return prev;
            return playerSeasonIdFallbackForSelectedLeague[0]?.id || 'all';
          });
        } else if (playerSeasonYearFallbackForSelectedLeague.length > 0) {
          setAvailableSeasons(playerSeasonYearFallbackForSelectedLeague);
          setSeasonFilter((prev) => {
            if (prev !== 'all' && playerSeasonYearFallbackForSelectedLeague.some((s) => sameId(s.id, prev))) return prev;
            return playerSeasonYearFallbackForSelectedLeague[0]?.id || 'all';
          });
        } else {
          setAvailableSeasons([]);
          setSeasonFilter('all');
        }
        setSeasonsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters.leagueId, token, playerSeasonIdFallbackForSelectedLeague, playerSeasonYearFallbackForSelectedLeague]);

  // Matches filtered by selected league, year, and season (for "Your Stats")
  const filteredMatches = useMemo(() => {
    const byLeague = (m: LeagueMatch) => !filters.leagueId || filters.leagueId === 'all' ? true : sameId(m.leagueId, filters.leagueId);
    const byYear = (m: LeagueMatch) => !filters.year || filters.year === 'all' ? true : dayjs(m.date).year().toString() === filters.year;
    const bySeason = (m: LeagueMatch) => {
      if (!seasonFilter || seasonFilter === 'all') return true;
      // Method 1: Match has seasonId directly
      if (m.seasonId) return sameId(m.seasonId, seasonFilter);
      // Method 2: Filter by season date range
      const selectedSeason = availableSeasons.find(s => sameId(s.id, seasonFilter));
      if (selectedSeason?.startDate) {
        const matchDate = dayjs(m.date);
        const start = dayjs(selectedSeason.startDate);
        const end = selectedSeason.endDate ? dayjs(selectedSeason.endDate) : dayjs(); // if no end date, season is still active
        return matchDate.isAfter(start.subtract(1, 'day')) && matchDate.isBefore(end.add(1, 'day'));
      }
      return true;
    };
    return matches.filter(m => byLeague(m) && byYear(m) && bySeason(m));
  }, [matches, filters.leagueId, filters.year, seasonFilter, availableSeasons]);

  // For chart cards: respect global year/season filters, while league is controlled by each card toggle.
  const timeSeasonFilteredMatches = useMemo(() => {
    const byYear = (m: LeagueMatch) => !filters.year || filters.year === 'all' ? true : dayjs(m.date).year().toString() === filters.year;
    const bySeason = (m: LeagueMatch) => {
      if (!seasonFilter || seasonFilter === 'all') return true;
      if (m.seasonId) return sameId(m.seasonId, seasonFilter);
      const selectedSeason = availableSeasons.find((s) => sameId(s.id, seasonFilter));
      if (selectedSeason?.startDate) {
        const matchDate = dayjs(m.date);
        const start = dayjs(selectedSeason.startDate);
        const end = selectedSeason.endDate ? dayjs(selectedSeason.endDate) : dayjs();
        return matchDate.isAfter(start.subtract(1, 'day')) && matchDate.isBefore(end.add(1, 'day'));
      }
      return true;
    };
    return matches.filter((m) => byYear(m) && bySeason(m));
  }, [matches, filters.year, seasonFilter, availableSeasons]);

  // ------------- Independent league filters per chart card -------------
  const [chartLeague, setChartLeague] = useState<string>('all');
  const [influenceLeague, setInfluenceLeague] = useState<string>('all');
  const [winLossLeague, setWinLossLeague] = useState<string>('all');

  // ------------- League averages from backend (for influence radar) -------------
  const [leagueAvgCache, setLeagueAvgCache] = useState<Record<string, LeagueMetricValues>>({});

  // Fetch league averages for each league the player is in
  useEffect(() => {
    const targetLeagueIds = averageTargetLeagueIds;
    const authToken = token || getAuthToken() || Cookies.get('token') || '';
    if (!authToken || targetLeagueIds.length === 0) return;
    const apiUrl = API_BASE_URL;
    let cancelled = false;

    const fetchAvg = async (leagueId: string) => {
      try {
        const params = new URLSearchParams();
        if (filters.year && filters.year !== 'all') params.set('year', String(filters.year));
        if (seasonFilter && seasonFilter !== 'all') params.set('seasonId', String(seasonFilter));
        const endpoints = [
          `${apiUrl}/leagues/${leagueId}/player-averages?${params.toString()}`,
          `${apiUrl}/api/leagues/${leagueId}/player-averages?${params.toString()}`,
        ];
        let res: Response | null = null;
        for (const endpoint of endpoints) {
          try {
            const attempt = await fetch(endpoint, {
              headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
              cache: 'no-store',
            });
            if (attempt.ok) {
              res = attempt;
              break;
            }
          } catch {
            // Try next compatible prefix.
          }
        }
        if (!res) return null;
        const data = await res.json();
        if (data.success) {
          return {
            leagueId,
            leagueAvg: resolveLeagueAverageFromPayload(data),
          };
        }
      } catch {
        // Keep page responsive if averages are unavailable.
      }
      return null;
    };

    (async () => {
      await Promise.all(targetLeagueIds.map(async (leagueId) => {
        const r = await fetchAvg(leagueId);
        if (cancelled || !r) return;
        const lid = r.leagueId.toLowerCase();
        setLeagueAvgCache((prev) => ({ ...prev, [lid]: r.leagueAvg || createEmptyLeagueMetrics() }));
      }));
    })();

    return () => { cancelled = true; };
  }, [token, averageTargetLeagueIds, filters.year, seasonFilter]);

  // Compute combined league average when "all" is selected, otherwise use specific league avg
  const currentInfluenceLeagueAvg = useMemo(() => {
    const selectedLeagueId = String(influenceLeague || '').trim().toLowerCase();
    if (selectedLeagueId && selectedLeagueId !== 'all') {
      return leagueAvgCache[selectedLeagueId] || null;
    }
    const scopedEntries = averageTargetLeagueIds
      .map((leagueId) => leagueAvgCache[String(leagueId).trim().toLowerCase()])
      .filter((entry): entry is LeagueMetricValues => Boolean(entry));
    return averageLeagueMetrics(scopedEntries);
  }, [influenceLeague, leagueAvgCache, averageTargetLeagueIds]);

  const currentImpactLeagueAvg = useMemo(() => {
    const selectedLeagueId = String(filters.leagueId || '').trim().toLowerCase();
    if (selectedLeagueId && selectedLeagueId !== 'all') {
      return leagueAvgCache[selectedLeagueId] || null;
    }
    const scopedEntries = averageTargetLeagueIds
      .map((leagueId) => leagueAvgCache[String(leagueId).trim().toLowerCase()])
      .filter((entry): entry is LeagueMetricValues => Boolean(entry));
    return averageLeagueMetrics(scopedEntries);
  }, [filters.leagueId, leagueAvgCache, averageTargetLeagueIds]);

  // Locally filtered matches for each card (independent of global Redux league filter)
  const chartMatches = useMemo(() =>
    chartLeague === 'all'
      ? timeSeasonFilteredMatches
      : timeSeasonFilteredMatches.filter((m) => sameId(m.leagueId, chartLeague)),
    [timeSeasonFilteredMatches, chartLeague]);
  const influenceMatches = useMemo(() =>
    influenceLeague === 'all'
      ? timeSeasonFilteredMatches
      : timeSeasonFilteredMatches.filter((m) => sameId(m.leagueId, influenceLeague)),
    [timeSeasonFilteredMatches, influenceLeague]);
  const winLossMatches = useMemo(() =>
    winLossLeague === 'all'
      ? timeSeasonFilteredMatches
      : timeSeasonFilteredMatches.filter((m) => sameId(m.leagueId, winLossLeague)),
    [timeSeasonFilteredMatches, winLossLeague]);

  // ------------- NEW STATE (grouping + range) -------------
  const [groupMode, setGroupMode] = useState<'weekly' | 'monthly'>('weekly');
  const [range, setRange] = useState<number[] | null>(null); // [startIdx, endIdx]

  // ------------- AGGREGATION (supports forced modes) -------------
  const { performanceData, groupingType } = useMemo(() => {
    const base = chartMatches;
    if (!base.length) {
      return {
        performanceData: [] as PerformanceRow[],
        groupingType: 'weekly' as const,
      };
    }

    const buildWeekly = (): PerformanceRow[] => {
      const map = new Map<string, PerformanceRow>();
      base.forEach(m => {
        const weekEnd = dayjs(m.date).endOf('week'); // Sunday
        const key = weekEnd.format('YYYY-MM-DD');
        if (!map.has(key)) {
          map.set(key, {
            key,
            label: weekEnd.format('DD-MMM'),
            year: weekEnd.format('YYYY'),
            matches: 0,
            totalPoints: 0,
            avgPoints: 0,
            cumulativePoints: 0
          });
        }
        const r = map.get(key)!;
        r.matches++;
        r.totalPoints += calcPoints(m.playerStats);
      });

      // Fill gaps between first and last week
      const keys = Array.from(map.keys()).sort();
      const filled: PerformanceRow[] = [];
      if (keys.length) {
        let cur = dayjs(keys[0]);
        const end = dayjs(keys[keys.length - 1]);
        while (cur.isBefore(end) || cur.isSame(end)) {
          const k = cur.format('YYYY-MM-DD');
          if (!map.has(k)) {
            map.set(k, {
              key: k,
              label: cur.format('DD-MMM'),
              year: cur.format('YYYY'),
              matches: 0,
              totalPoints: 0,
              avgPoints: 0,
              cumulativePoints: 0
            });
          }
          filled.push(map.get(k)!);
          cur = cur.add(1, 'week');
        }
      }

      // Sort and calculate averages and cumulative
      filled.sort((a, b) => a.key.localeCompare(b.key));
      let cumulativeSum = 0;
      filled.forEach(r => {
        r.avgPoints = r.matches ? +(r.totalPoints / r.matches).toFixed(2) : 0;
        cumulativeSum += r.totalPoints;
        r.cumulativePoints = cumulativeSum;
      });
      return filled;
    };

    const buildMonthly = (): PerformanceRow[] => {
      const map = new Map<string, PerformanceRow>();
      base.forEach(m => {
        const monthStart = dayjs(m.date).startOf('month');
        const key = monthStart.format('YYYY-MM');
        if (!map.has(key)) {
          map.set(key, {
            key,
            label: monthStart.format('MMM'),
            year: monthStart.format('YYYY'),
            matches: 0,
            totalPoints: 0,
            avgPoints: 0,
            cumulativePoints: 0
          });
        }
        const r = map.get(key)!;
        r.matches++;
        r.totalPoints += calcPoints(m.playerStats);
      });

      // Fill missing months between first and last month
      const keys = Array.from(map.keys()).sort();
      const filled: PerformanceRow[] = [];
      if (keys.length) {
        let cur = dayjs(keys[0] + '-01');
        const end = dayjs(keys[keys.length - 1] + '-01');
        while (cur.isBefore(end) || cur.isSame(end)) {
          const k = cur.format('YYYY-MM');
          if (!map.has(k)) {
            map.set(k, {
              key: k,
              label: cur.format('MMM'),
              year: cur.format('YYYY'),
              matches: 0,
              totalPoints: 0,
              avgPoints: 0,
              cumulativePoints: 0
            });
          }
          filled.push(map.get(k)!);
          cur = cur.add(1, 'month');
        }
      }

      // Sort and calculate averages and cumulative
      filled.sort((a, b) => a.key.localeCompare(b.key));
      let cumulativeSum = 0;
      filled.forEach(r => {
        r.avgPoints = r.matches ? +(r.totalPoints / r.matches).toFixed(2) : 0;
        cumulativeSum += r.totalPoints;
        r.cumulativePoints = cumulativeSum;
      });
      return filled;
    };

    if (groupMode === 'weekly') {
      return {
        performanceData: buildWeekly(),
        groupingType: 'weekly' as const,
      };
    } else {
      return {
        performanceData: buildMonthly(),
        groupingType: 'monthly' as const,
      };
    }
  }, [chartMatches, groupMode]);

  // ------------- RANGE FILTER -------------
  const chartData = useMemo(() => {
    if (!performanceData.length) return [];
    if (!range) return performanceData;
    const [s, e] = range;
    return performanceData.slice(s, e + 1);
  }, [performanceData, range]);

  // Reset range if data length changes
  useEffect(() => {
    setRange(null);
  }, [groupingType, chartMatches.length]);

  const influence: InfluenceEntry[] = useMemo(() => {
    // accumulate raw totals
    const total: Record<string, number> = {
      Goals: 0,
      Assists: 0,
      'Clean Sheets': 0,
      Impact: 0,
      Defence: 0,
      'Free Kicks': 0,
      Penalties: 0,
      'MOTM Votes': 0
    };
    filteredMatches.forEach(m => {
      const ps = m.playerStats || {};
      total.Goals += toStatNumber(ps.goals);
      total.Assists += toStatNumber(ps.assists);
      total['Clean Sheets'] += toStatNumber(ps.cleanSheets);
      total.Impact += toStatNumber(ps.impact);
      total.Defence += toStatNumber(ps.defence);
      total['Free Kicks'] += toStatNumber(ps.freeKicks);
      total.Penalties += toStatNumber(ps.penalties);
      total['MOTM Votes'] += toStatNumber(ps.motmVotes);
    });
    // convert to weighted contribution consistent with calcPoints()
    const weight: Record<string, number> = {
      Goals: 4,
      Assists: 3,
      'Clean Sheets': 3,
      Impact: 1,
      Defence: 1,
      'Free Kicks': 2,
      Penalties: 2,
      'MOTM Votes': 2
    };
    const contribution: Record<string, number> = {};
    Object.keys(total).forEach(k => { contribution[k] = total[k] * (weight[k] || 1); });
    const maxVal = Math.max(...Object.values(contribution), 1);
    return Object.entries(contribution).map(([metric, value]) => ({
      metric,
      value,
      scaled: Math.round((value / maxVal) * 100)
    }));
  }, [filteredMatches, playerId]);

  // Compute top strengths as the most effective ways points are earned
  // We map player match stats into contribution buckets, then rank by scaled value
  const strengths: StrengthEntry[] = useMemo(
    () => [...influence]
      .filter(i => i.scaled > 0)
      .sort((a, b) => b.scaled - a.scaled)
      .slice(0, 3),
    [influence]
  );

  // Decide comparison visibility: if user not in top 25% for any metric, adjust to top 50%.
  // If still not outperforming, hide comparison column entirely.
  const strengthComparison = useMemo(() => {
    // crude percentile using scaled vs 100; treat scaled>=75 as top 25%; >=50 as top 50%
    const top25 = strengths.some(s => s.scaled >= 75);
    const top50 = strengths.some(s => s.scaled >= 50);
    return {
      show: top25 || top50,
      label: top25 ? 'Against Top 25%' : top50 ? 'Against Top 50%' : '',
      threshold: top25 ? 0.75 : top50 ? 0.5 : 0
    };
  }, [strengths]);

  // --- Focus Area suggestion ---
  const focusSuggestion = useMemo(() => {
    if (!filteredMatches.length || !influence.length) {
      return 'Play a few more games to unlock a personalized focus area.';
    }
    const actionMap: Record<string, string> = {
      Goals: 'finishing',
      Assists: 'key passes',
      'Clean Sheets': 'defensive positioning',
      Defence: 'defensive duels',
      'MOTM Votes': 'match-defining moments',
      Impact: 'overall influence',
      'Free Kicks': 'set-piece accuracy',
      Penalties: 'penalty conversion'
    };
    const threshold = strengths.some(s => s.scaled >= 75) ? 75 : 50;
    const label = threshold === 75 ? 'top 25%' : 'top 50%';
    const candidates = influence.filter(i => actionMap[i.metric] !== undefined);
    let target = candidates
      .filter(c => c.scaled < threshold)
      .sort((a, b) => (threshold - b.scaled) - (threshold - a.scaled))[0];
    if (!target) {
      target = [...candidates].sort((a, b) => a.scaled - b.scaled)[0];
      if (!target) return '';
    }
    const metricName = target.metric === 'MOTM Votes' ? 'MOTM votes' : target.metric.toLowerCase();
    return `Increasing your ${actionMap[target.metric]} could elevate you to the ${label} for ${metricName}!`;
  }, [filteredMatches.length, influence, strengths]);

  // --- Last 10 vs Previous 10 for Impact section (FIXED) ---
  const lastPrev10 = useMemo(() => {
    const played = [...filteredMatches].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    const last10 = played.slice(-10);
    const prev10 = played.slice(-20, -10);

    const sum = (arr: LeagueMatch[], pick: (ps: PlayerMatchStats) => number) =>
      arr.reduce((s, m) => s + pick(m.playerStats || {}), 0);

    const count = (arr: LeagueMatch[], pred: (ps: PlayerMatchStats) => boolean) =>
      arr.reduce((s, m) => s + (pred(m.playerStats || {}) ? 1 : 0), 0);

    const agg = (arr: LeagueMatch[]) => {
      const n = arr.length || 0;

      let wins = 0;
      let draws = 0;
      let losses = 0;
      arr.forEach((m) => {
        const result = resolveResultForPlayer(m, String(playerId || ''));
        if (result === 'W') wins += 1;
        else if (result === 'D') draws += 1;
        else if (result === 'L') losses += 1;
      });

      const winRate = n ? (wins / n) * 100 : 0;
      const motmVotes = sum(arr, ps => toStatNumber(ps.motmVotes));
      const ga = sum(arr, ps => toStatNumber(ps.goals) + toStatNumber(ps.assists));
      const goals = sum(arr, ps => toStatNumber(ps.goals));
      const assists = sum(arr, ps => toStatNumber(ps.assists));
      const cleanSheets = sum(arr, ps => toStatNumber(ps.cleanSheets));

      // Match Contribution Index from backend impact (already a 0-100 percentage per match).
      const impactAvg = n ? Math.max(0, Math.min(100, sum(arr, ps => toStatNumber(ps.impact)) / n)) : 0;

      // For xG/xA/xCS: count matches where player scored/assisted/kept clean sheet (at least once)
      const matchesWithGoals = count(arr, ps => (ps.goals || 0) > 0);
      const matchesWithAssists = count(arr, ps => (ps.assists || 0) > 0);
      const matchesWithCleanSheets = count(arr, ps => (ps.cleanSheets || 0) > 0);

      return { n, wins, draws, losses, winRate, impactAvg, motmVotes, ga, goals, assists, cleanSheets, matchesWithGoals, matchesWithAssists, matchesWithCleanSheets };
    };

    return { last: agg(last10), prev: agg(prev10) };
  }, [filteredMatches, playerId]);

  // Aggregated stats for current filters ("Your Stats") - ALL filtered matches
  const yourStats = useMemo(() => {
    const arr = filteredMatches;
    const sum = (a: LeagueMatch[], pick: (ps: PlayerMatchStats) => number) => a.reduce((s, m) => s + pick(m.playerStats || {}), 0);
    const count = (a: LeagueMatch[], pred: (ps: PlayerMatchStats) => boolean) => a.reduce((s, m) => s + (pred(m.playerStats || {}) ? 1 : 0), 0);

    const n = arr.length || 0;
    let wins = 0, draws = 0, losses = 0;
    arr.forEach((m) => {
      const result = resolveResultForPlayer(m, String(playerId || ''));
      if (result === 'W') wins += 1;
      else if (result === 'D') draws += 1;
      else if (result === 'L') losses += 1;
    });


    const winRate = n ? (wins / n) * 100 : 0;
    const motmVotes = sum(arr, ps => toStatNumber(ps.motmVotes));
    const defence = sum(arr, ps => toStatNumber(ps.defence));
    // Count defensive impact votes: check homeDefensiveImpactId/awayDefensiveImpactId per match
    const defensiveImpactVotes = arr.reduce((total, m) => {
      if (String(m.homeDefensiveImpactId) === String(playerId) || String(m.awayDefensiveImpactId) === String(playerId)) {
        return total + 1;
      }
      return total;
    }, 0);
    const ga = sum(arr, ps => toStatNumber(ps.goals) + toStatNumber(ps.assists));
    const goals = sum(arr, ps => toStatNumber(ps.goals));
    const assists = sum(arr, ps => toStatNumber(ps.assists));
    const cleanSheets = sum(arr, ps => toStatNumber(ps.cleanSheets));

    // For xG/xA/xCS: count matches where player scored/assisted/kept clean sheet (at least once)
    const matchesWithGoals = count(arr, ps => (ps.goals || 0) > 0);
    const matchesWithAssists = count(arr, ps => (ps.assists || 0) > 0);
    const matchesWithCleanSheets = count(arr, ps => (ps.cleanSheets || 0) > 0);


    // Match Contribution Index from backend impact (already a 0-100 percentage per match).
    const impactAvg = n ? Math.max(0, Math.min(100, sum(arr, ps => toStatNumber(ps.impact)) / n)) : 0;

    return { n, wins, draws, losses, winRate, impactAvg, motmVotes, defence, defensiveImpactVotes, ga, goals, assists, cleanSheets, matchesWithGoals, matchesWithAssists, matchesWithCleanSheets };
  }, [filteredMatches, playerId]);

  // One consistent comparison model used by IMPACT + Top Strengths
  const leagueComparisonRows = useMemo<LeagueComparisonRow[]>(() => {
    const leagueAverage = currentImpactLeagueAvg || createEmptyLeagueMetrics();

    const rows = [
      {
        metric: 'Goals',
        yourTotal: toRoundedInt(yourStats.goals),
        yourDisplay: String(toRoundedInt(yourStats.goals)),
        leagueAverage: toStatNumber(leagueAverage.goals),
        leagueDisplay: formatStatDecimal(leagueAverage.goals),
      },
      {
        metric: 'Assists',
        yourTotal: toRoundedInt(yourStats.assists),
        yourDisplay: String(toRoundedInt(yourStats.assists)),
        leagueAverage: toStatNumber(leagueAverage.assists),
        leagueDisplay: formatStatDecimal(leagueAverage.assists),
      },
      {
        metric: 'Clean Sheets',
        yourTotal: toRoundedInt(yourStats.cleanSheets),
        yourDisplay: String(toRoundedInt(yourStats.cleanSheets)),
        leagueAverage: toStatNumber(leagueAverage.cleanSheets),
        leagueDisplay: formatStatDecimal(leagueAverage.cleanSheets),
      },
      {
        metric: 'MOTM Votes',
        yourTotal: toRoundedInt(yourStats.motmVotes),
        yourDisplay: String(toRoundedInt(yourStats.motmVotes)),
        leagueAverage: toStatNumber(leagueAverage.motmVotes),
        leagueDisplay: formatStatDecimal(leagueAverage.motmVotes),
      },
      {
        metric: 'Defensive Impact Votes',
        yourTotal: toRoundedInt(yourStats.defensiveImpactVotes),
        yourDisplay: String(toRoundedInt(yourStats.defensiveImpactVotes)),
        leagueAverage: toStatNumber(leagueAverage.defensiveImpactVotes),
        leagueDisplay: formatStatDecimal(leagueAverage.defensiveImpactVotes),
      },
      {
        metric: 'Game Contribution Index',
        yourTotal: toRoundedInt(yourStats.impactAvg),
        yourDisplay: `${toRoundedInt(yourStats.impactAvg)}%`,
        leagueAverage: toStatNumber(leagueAverage.impact),
        leagueDisplay: formatStatDecimal(leagueAverage.impact, '%'),
      },
    ];

    return rows;
  }, [yourStats, currentImpactLeagueAvg]);

  const topStrengthRows = useMemo(
    () => [...leagueComparisonRows]
      .filter((row) => row.yourTotal > 0 || row.leagueAverage > 0)
      .sort((a, b) => b.yourTotal - a.yourTotal || b.leagueAverage - a.leagueAverage)
      .slice(0, 3),
    [leagueComparisonRows]
  );

  const topStrengthNote = useMemo(() => {
    if (!topStrengthRows.length) return '';
    const best = topStrengthRows[0];
    return `${best.metric}: ${best.yourDisplay}; league average ${best.leagueDisplay}.`;
  }, [topStrengthRows]);

  // Attempt to extract a name from the stats slice (adjust keys if your slice stores differently)
  const playerNameFromStats = useMemo(() => {
    return extractPlayerName(data);
  }, [data]);

  const [playerName, setPlayerName] = useState<string>('');

  // If stats already contain a name, use it
  useEffect(() => {
    if (playerNameFromStats && !playerName) {
      setPlayerName(playerNameFromStats);
    }
  }, [playerNameFromStats, playerName]);

  // Fallback fetch if name not in stats
  useEffect(() => {
    if (!playerId) return;
    if (playerNameFromStats) return; // already have
    let aborted = false;

    (async () => {
      try {
        const authToken = token || getAuthToken() || Cookies.get('token') || '';
        const res = await fetch(`${API_BASE_URL}/players/${playerId}`, {
          cache: 'no-store',
          headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
        });
        if (!res.ok) {
          console.warn('Player name fetch failed:', res.status, res.statusText);
          return;
        }
        const j = await res.json();
        const fetchedName =
          j?.name ||
          j?.player?.name ||
          j?.data?.name ||
          '';
        if (!aborted && fetchedName) setPlayerName(fetchedName);
      } catch (e) {
        console.warn('Player name fetch error:', e);
      }
    })();

    return () => { aborted = true; };
  }, [playerId, playerNameFromStats, token]);

  // Real Influence data from backend
  const influenceRadarData = useMemo(() => {
    const playerTotals = {
      Goals: 0,
      Assists: 0,
      'Clean Sheets': 0,
      'Defensive Impact': 0,
      'MOTM Votes': 0
    };

    influenceMatches.forEach(match => {
      const ps = match.playerStats || {};
      playerTotals.Goals += toStatNumber(ps.goals);
      playerTotals.Assists += toStatNumber(ps.assists);
      playerTotals['Clean Sheets'] += toStatNumber(ps.cleanSheets);
      playerTotals['Defensive Impact'] += toStatNumber(ps.defence);
      playerTotals['MOTM Votes'] += toStatNumber(ps.motmVotes);
    });

    // Use real league averages from backend if available
    const dbAvg = currentInfluenceLeagueAvg;
    const leagueAvg = dbAvg ? {
      Goals: dbAvg.goals,
      Assists: dbAvg.assists,
      'Clean Sheets': dbAvg.cleanSheets,
      'Defensive Impact': dbAvg.defence,
      'MOTM Votes': dbAvg.motmVotes
    } : {
      Goals: 0,
      Assists: 0,
      'Clean Sheets': 0,
      'Defensive Impact': 0,
      'MOTM Votes': 0
    };

    const displayName = playerName || 'Player';
    const metrics = Object.keys(playerTotals) as Array<keyof typeof playerTotals>;

    return metrics.map(metric => ({
      metric,
      [displayName]: toRoundedInt(playerTotals[metric]),
      'League Avg': Math.round(leagueAvg[metric as keyof typeof leagueAvg])
    }));
  }, [influenceMatches, playerName, currentInfluenceLeagueAvg]);

  // Calculate actual win/loss/draw data from backend matches
  const actualWinLossData = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    const arr = winLossMatches;
    arr.forEach(match => {
      const result = resolveResultForPlayer(match, String(playerId || ''));
      if (result === 'W') wins += 1;
      else if (result === 'D') draws += 1;
      else if (result === 'L') losses += 1;
    });

    const total = wins + losses + draws;
    if (total === 0) {
      return [
        { name: 'Win', value: 0, color: '#15b57a', fill: '#15b57a' },
        { name: 'Loss', value: 0, color: '#d22f2f', fill: '#d22f2f' },
        { name: 'Draw', value: 0, color: '#ff4bd2', fill: '#ff4bd2' },
      ];
    }
    const winPercent = Math.round((wins / total) * 100);
    const drawPercent = Math.round((draws / total) * 100);
    const lossPercent = 100 - winPercent - drawPercent;
    return [
      { name: 'Win', value: winPercent, color: '#15b57a', fill: '#15b57a' },
      { name: 'Loss', value: lossPercent, color: '#d22f2f', fill: '#d22f2f' },
      { name: 'Draw', value: drawPercent, color: '#ff4bd2', fill: '#ff4bd2' },
    ];
  }, [winLossMatches, playerId]);

  // Add synergy types (place near other interfaces)
  interface SynergyPairing {
    name?: string;
    winsTogether: number;
    matchesTogether: number;
    winRate: number;
    playerId?: string;
  }

  interface SynergyRival {
    name?: string;
    lossesAgainst: number;
    matchesAgainst: number;
    lossRate: number;
    playerId?: string;
  }

  // --- Simple Synergy API state ---
  const [synergyLoading, setSynergyLoading] = useState(false);
  const [synergyError, setSynergyError] = useState<string | null>(null);
  const [bestPairing, setBestPairing] = useState<SynergyPairing | null>(null);
  const [toughestRival, setToughestRival] = useState<SynergyRival | null>(null);
  const [participatedMatches, setParticipatedMatches] = useState<number>(0);
  const [, setSelectedSynergyLeagueId] = useState<string | null>(null);

  // --- League Ranking (Goals) ---
  const [leagueRank, setLeagueRank] = useState<number | null>(null);
  useEffect(() => {
    const fetchRank = async () => {
      try {
        if (!filters.leagueId || filters.leagueId === 'all' || !playerId) {
          setLeagueRank(null);
          return;
        }
        const authToken = token || getAuthToken() || Cookies.get('token') || '';
        const url = `${API_BASE_URL}/leaderboard?metric=goals&leagueId=${encodeURIComponent(filters.leagueId)}&_t=${Date.now()}`;
        const res = await fetch(url, {
          headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
          cache: 'no-store'
        });
        if (!res.ok) { setLeagueRank(null); return; }
        const json = await res.json();
        const players: Array<{ id: string; value?: number }> = json?.players || [];
        const idx = players.findIndex(p => String(p.id) === String(playerId));
        setLeagueRank(idx >= 0 ? idx + 1 : null);
      } catch {
        setLeagueRank(null);
      }
    };
    fetchRank();
  }, [filters.leagueId, playerId, token]);

  // Fetch Simple Synergy (backend: /players/:playerId/simple-synergy)
  useEffect(() => {
    if (!playerId) return;

    // If no matches yet, reset & skip fetch
    if (!matches || matches.length === 0) {
      setSynergyLoading(false);
      setSynergyError(null);
      setBestPairing(null);
      setToughestRival(null);
      setParticipatedMatches(0);
      setSelectedSynergyLeagueId(null);
      return;
    }

    let aborted = false;
    (async () => {
      try {
        setSynergyLoading(true);
        setSynergyError(null);

        const params = new URLSearchParams();
        if (filters.leagueId && filters.leagueId !== 'all') {
          params.set('leagueId', String(filters.leagueId));
        }
        if (filters.year && filters.year !== 'all') {
          params.set('year', String(filters.year));
        }
        if (seasonFilter && seasonFilter !== 'all') {
          params.set('seasonId', String(seasonFilter));
        }
        params.set('_t', String(Date.now()));
        const url = `${API_BASE_URL}/players/${playerId}/simple-synergy?${params.toString()}`;
        const authToken = token || getAuthToken() || Cookies.get('token') || '';
        const res = await fetch(url, {
          headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
          cache: 'no-store'
        });

        // Gracefully treat 404 / 204 as "no data" (not an error)
        if (res.status === 404 || res.status === 204) {
          if (!aborted) {
            setBestPairing(null);
            setToughestRival(null);
            setParticipatedMatches(0);
            setSelectedSynergyLeagueId(filters.leagueId || null);
          }
          return;
        }

        if (!res.ok) {
          // Real server error -> show error
          throw new Error(`Server error ${res.status}`);
        }

        // Type-safe synergy response models
        interface SimpleSynergySingle {
          leagueId?: string;
          participatedMatches?: number;
          bestPairing?: SynergyPairing | null;
          toughestRival?: SynergyRival | null;
        }
        interface SimpleSynergyMulti {
          leagues: SimpleSynergySingle[];
        }
        // type SimpleSynergyResponse = SimpleSynergySingle | SimpleSynergyMulti;

        const isSimpleSynergySingle = (v: unknown): v is SimpleSynergySingle =>
          typeof v === 'object' &&
          v !== null &&
          !Array.isArray((v as { leagues?: unknown }).leagues);

        const isSimpleSynergyMulti = (v: unknown): v is SimpleSynergyMulti =>
          typeof v === 'object' &&
          v !== null &&
          Array.isArray((v as { leagues?: unknown }).leagues);

        let parsed: unknown = null;
        try {
          parsed = await res.json();
        } catch {
          if (!aborted) {
            setBestPairing(null);
            setToughestRival(null);
            setParticipatedMatches(0);
            setSelectedSynergyLeagueId(filters.leagueId || null);
          }
          return;
        }
        if (aborted) return;

        if (isSimpleSynergySingle(parsed)) {
          setBestPairing(parsed.bestPairing ?? null);
          setToughestRival(parsed.toughestRival ?? null);
          setParticipatedMatches(parsed.participatedMatches || 0);
          setSelectedSynergyLeagueId(parsed.leagueId || filters.leagueId || null);
          return;
        }

        if (isSimpleSynergyMulti(parsed)) {
          const leagues = parsed.leagues.filter(l => l && typeof l === 'object');
          let chosen = leagues
            .filter(l => (l.participatedMatches || 0) > 0)
            .sort((a, b) => (b.participatedMatches || 0) - (a.participatedMatches || 0))[0];
          if (!chosen && leagues.length) chosen = leagues[0];

          if (chosen) {
            setBestPairing(chosen.bestPairing ?? null);
            setToughestRival(chosen.toughestRival ?? null);
            setParticipatedMatches(chosen.participatedMatches || 0);
            setSelectedSynergyLeagueId(chosen.leagueId || null);
          } else {
            setBestPairing(null);
            setToughestRival(null);
            setParticipatedMatches(0);
            setSelectedSynergyLeagueId(null);
          }
          return;
        }

        // Unexpected shape
        setBestPairing(null);
        setToughestRival(null);
        setParticipatedMatches(0);
        setSelectedSynergyLeagueId(filters.leagueId || null);
      } catch (err: unknown) {
        if (!aborted) {
          const message = err instanceof Error ? err.message : 'Failed to load synergy';
          console.warn('Synergy fetch error:', err);
          setSynergyError(message);
          setBestPairing(null);
          setToughestRival(null);
          setParticipatedMatches(0);
          setSelectedSynergyLeagueId(null);
        }
      } finally {
        if (!aborted) setSynergyLoading(false);
      }
    })();

    return () => { aborted = true; };
  }, [playerId, matches, filters.leagueId, filters.year, seasonFilter, token, refreshNonce]);

  // Dynamic years: keep previous years from data and always include current/latest year
  const availableYears = useMemo(() => {
    const years = new Set<string>([dayjs().year().toString()]);
    matches.forEach((m) => {
      const y = dayjs(m.date).year();
      if (Number.isFinite(y)) years.add(String(y));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [matches]);

  useEffect(() => {
    if (loading) return;
    if (!filters.year || filters.year === 'all') return;
    if (!availableYears.includes(filters.year)) {
      dispatch(setYearFilter('all'));
    }
  }, [loading, filters.year, availableYears, dispatch]);

  // Get selected league name for display
  const selectedLeagueName = useMemo(() => {
    if (!filters.leagueId || filters.leagueId === 'all') return null;
    const league = availableLeagues.find(l => sameId(l.id, filters.leagueId));
    return (league as LeagueWithMatches & { name?: string })?.name || `League ${filters.leagueId}`;
  }, [filters.leagueId, availableLeagues]);

  // Preferred league from localStorage (persisted across pages)
  const [preferredLeagueId, setPreferredLeagueId] = useState<string | null>(null);
  const preferredAppliedRef = useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPreferredLeagueId(localStorage.getItem('preferredLeagueId'));
    }
  }, []);
  const preferredLeagueName = useMemo(() => {
    if (!preferredLeagueId) return null;
    const league = availableLeagues.find(l => sameId(l.id, preferredLeagueId));
    return (league as LeagueWithMatches & { name?: string })?.name || null;
  }, [preferredLeagueId, availableLeagues]);

  const currentCardLeagueId = useMemo(() => {
    const candidate =
      filters.leagueId && filters.leagueId !== 'all'
        ? filters.leagueId
        : preferredLeagueId;
    if (!candidate) return null;
    return availableLeagues.some((l) => sameId(l.id, candidate)) ? candidate : null;
  }, [filters.leagueId, preferredLeagueId, availableLeagues]);

  // If no league is passed in URL, auto-select preferredLeagueId on this page
  useEffect(() => {
    if (preferredAppliedRef.current) return;
    if (urlLeagueId) return;
    if (!preferredLeagueId) return;
    const existsInAvailable = availableLeagues.some((l) => sameId(l.id, preferredLeagueId));
    if (!existsInAvailable) return;
    if (!sameId(filters.leagueId, preferredLeagueId)) {
      dispatch(setLeagueFilter(preferredLeagueId));
    }
    preferredAppliedRef.current = true;
  }, [urlLeagueId, preferredLeagueId, filters.leagueId, availableLeagues, dispatch]);

  // Auto-select "Current" on card toggles whenever top filters change.
  useEffect(() => {
    if (currentCardLeagueId) {
      setChartLeague(currentCardLeagueId);
      setInfluenceLeague(currentCardLeagueId);
      setWinLossLeague(currentCardLeagueId);
      return;
    }
    setChartLeague('all');
    setInfluenceLeague('all');
    setWinLossLeague('all');
  }, [filters.year, filters.leagueId, seasonFilter, currentCardLeagueId]);

  const selectedSeasonLabel = useMemo(() => {
    if (!seasonFilter || seasonFilter === 'all') return 'All Seasons';
    const selected = availableSeasons.find((s) => sameId(s.id, seasonFilter));
    if (!selected) return 'All Seasons';
    return `${formatSeasonDisplayLabel(selected)}${selected.isActive ? ' (Active)' : ''}`;
  }, [seasonFilter, availableSeasons]);

  const topTeammateLine = useMemo(() => {
    if (!playerId) return 'Top Teammate: No player selected';
    if (synergyLoading && !synergyError) return 'Top Teammate: Loading...';
    if (synergyError) return `Top Teammate: ${synergyError}`;
    if (participatedMatches === 0) return 'Top Teammate: No top teammate identified yet';
    if (!bestPairing) return 'Top Teammate: No top teammate identified yet';
    const wins = Number(bestPairing.winsTogether || 0);
    const winWord = wins === 1 ? 'win' : 'wins';
    return `Top Teammate: ${bestPairing.name || 'Player'} | ${wins} ${winWord} together | ${bestPairing.winRate}% win rate`;
  }, [playerId, synergyLoading, synergyError, participatedMatches, bestPairing]);

  const toughestRivalLine = useMemo(() => {
    if (!playerId) return 'No toughest opponent identified yet';
    if (synergyLoading && !synergyError) return 'Toughest Rival: Loading...';
    if (synergyError) return `Toughest Rival: ${synergyError}`;
    if (participatedMatches === 0) return 'No toughest opponent identified yet';
    if (!toughestRival || Number(toughestRival.lossesAgainst || 0) <= 0) {
      return 'No toughest opponent identified yet';
    }
    const losses = Number(toughestRival.lossesAgainst || 0);
    const lossWord = losses === 1 ? 'loss' : 'losses';
    const lossRateText = `${Number(toughestRival.lossRate || 0).toFixed(1).replace(/\\.0$/, '')}%`;
    return `Toughest Rival: ${toughestRival.name || 'Player'} | ${losses} ${lossWord} | ${lossRateText} loss rate`;
  }, [playerId, synergyLoading, synergyError, participatedMatches, toughestRival]);

  const handleYearFilterChange = (value: string) => {
    dispatch(setYearFilter(value));
    setYearMenuOpen(false);
  };

  const handleLeagueFilterChange = (value: string) => {
    dispatch(setLeagueFilter(value));
    setLeagueMenuOpen(false);
  };

  const handleSeasonFilterChange = (value: string) => {
    setSeasonFilter(value);
    setSeasonMenuOpen(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(setYearFilter('all'));
    dispatch(setLeagueFilter('all'));
    setSeasonFilter('all');
    setYearMenuOpen(false);
    setLeagueMenuOpen(false);
    setSeasonMenuOpen(false);
  };
  const dashboardTitle = playerName ? `${playerName} PERFORMANCE DASHBOARD` : 'PERFORMANCE DASHBOARD';
  const isLongDashboardTitle = dashboardTitle.length > 30;
  const desktopFilterWidth = '150px';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: themeColors.surfaceBase,
        py: 2,
        px: 0,
      }}
    >
      <Container
        disableGutters
        maxWidth={false}
        sx={{
          py: 2,
          background: themeColors.surfaceBase,
        }}
      >
        <Box sx={{ maxWidth: '100%', mx: 'auto', overflowX: 'visible' }}>
          {/* Dark Header Section - Full Width */}
          <Box sx={{
            mt: 0,
            mb: 4,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            background: '#0e0e0e',
          }}>
            <Paper sx={{
              px: 0,
              py: { xs: 2, md: 1.1 },
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
                px: { xs: 1.5, sm: 2.5, md: 0 },
                // pt: { xs: 2, md: 2 },
                pb: 2,
              }}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontFamily: 'var(--font-oswald), "Oswald", sans-serif !important',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    color: '#fff',
                    fontSize: isLongDashboardTitle
                      ? { xs: '22px', sm: '30px', md: '42px' }
                      : { xs: '26px', sm: '36px', md: '50px' },
                    textTransform: 'uppercase',
                    letterSpacing: '0rem',
                    lineHeight: { xs: 1.1, md: 1.05 },
                    textAlign: 'center',
                    maxWidth: { xs: '92vw', sm: '88vw', md: '100%' },
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: { xs: 2, sm: 2, md: 1 },
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {dashboardTitle}
                </Typography>
              </Box>

              {/* Orange divider under header */}
              <Box
                sx={{
                  height: 'var(--header-divider-height)',
                  bgcolor: 'var(--header-divider-color)',
                  mt: { xs: 2, sm: 4, md: 6.3 },
                  width: '100%',
                }}
              />

              {/* Filters Section */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-end' },
                gap: { xs: 2, md: 2 },
                px: { xs: 1, md: 7 },
                py: { xs: 1.5, md: 1.5 },
                maxWidth: '1200px',
                mx: 'auto',
              }}>
                {/* Filter Buttons */}
                <Box
                  sx={{
                    display: { xs: 'grid', md: 'flex' },
                    gridTemplateColumns: { xs: 'repeat(4, minmax(0, 1fr))', md: 'none' },
                    gap: 0.5,
                    flexWrap: { xs: 'nowrap', md: 'wrap' },
                    justifyContent: 'center',
                    width: { xs: '100%', md: 'auto' },
                    overflowX: { xs: 'visible', md: 'visible' },
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {/* Year Filter */}
                  {isMobile ? (
                    <>
                      <button
                        ref={yearFilterButtonRef}
                        type="button"
                        onClick={() => {
                          setLeagueMenuOpen(false);
                          setSeasonMenuOpen(false);
                          setYearMenuOpen((prev) => !prev);
                        }}
                        style={{
                          height: '34px',
                          padding: '0 20px 0 7px',
                          marginLeft: '0px',
                          backgroundColor: 'transparent',
                          color: '#fff',
                          border: '1.5px solid #e56a16',
                          borderRadius: '24px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          outline: 'none',
                          width: '100%',
                          fontWeight: 600,
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                        }}
                      >
                        {filters.year && filters.year !== 'all' ? filters.year : 'All Years'}
                      </button>
                      <Menu
                        anchorEl={yearFilterButtonRef.current}
                        open={yearMenuOpen}
                        onClose={() => setYearMenuOpen(false)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{
                          sx: {
                            mt: 0.5,
                            borderRadius: 1,
                            border: '1px solid rgba(255,255,255,0.25)',
                            backgroundColor: '#1a1a1a',
                            width: yearFilterButtonRef.current?.offsetWidth || 120,
                            maxWidth: yearFilterButtonRef.current?.offsetWidth || 120,
                          }
                        }}
                        MenuListProps={{ sx: { py: 0 } }}
                      >
                        <MenuItem
                          selected={(filters.year || 'all') === 'all'}
                          onClick={() => handleYearFilterChange('all')}
                          sx={{
                            color: '#fff',
                            fontSize: 11,
                            minHeight: 34,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&.Mui-selected': { backgroundColor: '#2b66bd' },
                            '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                          }}
                        >
                          All Years
                        </MenuItem>
                        {availableYears.map((year) => (
                          <MenuItem
                            key={year}
                            selected={(filters.year || 'all') === year}
                            onClick={() => handleYearFilterChange(year)}
                            sx={{
                              color: '#fff',
                              fontSize: 11,
                              minHeight: 34,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              '&.Mui-selected': { backgroundColor: '#2b66bd' },
                              '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                            }}
                          >
                            {year}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <select
                      value={filters.year || 'all'}
                      onChange={(e) => handleYearFilterChange(e.target.value)}
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
                        width: desktopFilterWidth,
                        minWidth: desktopFilterWidth,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        fontWeight: 400,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Years</option>
                      {availableYears.map(year => (
                        <option key={year} value={year} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{year}</option>
                      ))}
                    </select>
                  )}

                  {/* League Filter */}
                  {isMobile ? (
                    <>
                      <button
                        ref={leagueFilterButtonRef}
                        type="button"
                        onClick={() => {
                          setYearMenuOpen(false);
                          setSeasonMenuOpen(false);
                          setLeagueMenuOpen((prev) => !prev);
                        }}
                        style={{
                          height: '34px',
                          padding: '0 20px 0 7px',
                          marginLeft: '0px',
                          backgroundColor: 'transparent',
                          color: '#fff',
                          border: '1.5px solid #e56a16',
                          borderRadius: '24px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          outline: 'none',
                          width: '100%',
                          fontWeight: 600,
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                        }}
                      >
                        {selectedLeagueName || 'All Leagues'}
                      </button>
                      <Menu
                        anchorEl={leagueFilterButtonRef.current}
                        open={leagueMenuOpen}
                        onClose={() => setLeagueMenuOpen(false)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{
                          sx: {
                            mt: 0.5,
                            borderRadius: 1,
                            border: '1px solid rgba(255,255,255,0.25)',
                            backgroundColor: '#1a1a1a',
                            width: leagueFilterButtonRef.current?.offsetWidth || 120,
                            maxWidth: leagueFilterButtonRef.current?.offsetWidth || 120,
                          }
                        }}
                        MenuListProps={{ sx: { py: 0 } }}
                      >
                        <MenuItem
                          selected={(filters.leagueId || 'all') === 'all'}
                          onClick={() => handleLeagueFilterChange('all')}
                          sx={{
                            color: '#fff',
                            fontSize: 11,
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
                        {availableLeagues.map((league: LeagueWithMatches & { name?: string }) => (
                          <MenuItem
                            key={league.id}
                            selected={sameId((filters.leagueId || 'all'), league.id)}
                            onClick={() => handleLeagueFilterChange(league.id)}
                            sx={{
                              color: '#fff',
                              fontSize: 11,
                              minHeight: 34,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              '&.Mui-selected': { backgroundColor: '#2b66bd' },
                              '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                            }}
                          >
                            {league.name || `League ${league.id}`}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <select
                      value={filters.leagueId || 'all'}
                      onChange={(e) => handleLeagueFilterChange(e.target.value)}
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
                        width: desktopFilterWidth,
                        minWidth: desktopFilterWidth,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        fontWeight: 400,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Leagues</option>
                      {availableLeagues.map((league: LeagueWithMatches & { name?: string }) => (
                        <option key={league.id} value={league.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                          {league.name || `League ${league.id}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Season Filter */}
                  {isMobile ? (
                    <>
                      <button
                        ref={seasonFilterButtonRef}
                        type="button"
                        onClick={() => {
                          setYearMenuOpen(false);
                          setLeagueMenuOpen(false);
                          setSeasonMenuOpen((prev) => !prev);
                        }}
                        style={{
                          height: '34px',
                          padding: '0 20px 0 7px',
                          marginLeft: '0px',
                          backgroundColor: 'transparent',
                          color: '#fff',
                          border: '1.5px solid #e56a16',
                          borderRadius: '24px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          outline: 'none',
                          width: '100%',
                          fontWeight: 600,
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                        }}
                      >
                        {selectedSeasonLabel}
                      </button>
                      <Menu
                        anchorEl={seasonFilterButtonRef.current}
                        open={seasonMenuOpen}
                        onClose={() => setSeasonMenuOpen(false)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{
                          sx: {
                            mt: 0.5,
                            borderRadius: 1,
                            border: '1px solid rgba(255,255,255,0.25)',
                            backgroundColor: '#1a1a1a',
                            width: seasonFilterButtonRef.current?.offsetWidth || 120,
                            maxWidth: seasonFilterButtonRef.current?.offsetWidth || 120,
                          }
                        }}
                        MenuListProps={{ sx: { py: 0 } }}
                      >
                        <MenuItem
                          selected={seasonFilter === 'all'}
                          onClick={() => handleSeasonFilterChange('all')}
                          sx={{
                            color: '#fff',
                            fontSize: 11,
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
                        {availableSeasons.map((season) => (
                          <MenuItem
                            key={season.id}
                            selected={sameId(seasonFilter, season.id)}
                            onClick={() => handleSeasonFilterChange(season.id)}
                            sx={{
                              color: '#fff',
                              fontSize: 11,
                              minHeight: 34,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              '&.Mui-selected': { backgroundColor: '#2b66bd' },
                              '&.Mui-selected:hover': { backgroundColor: '#2b66bd' },
                            }}
                          >
                            {formatSeasonDisplayLabel(season)}{season.isActive ? ' (Active)' : ''}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <select
                      value={seasonFilter}
                      onChange={(e) => handleSeasonFilterChange(e.target.value)}
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
                        width: desktopFilterWidth,
                        minWidth: desktopFilterWidth,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        fontWeight: 400,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="all" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>All Seasons</option>
                      {availableSeasons.map(season => (
                        <option key={season.id} value={season.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                          {formatSeasonDisplayLabel(season)}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Clear Button */}
                  <button
                    onClick={handleClearFilters}
                    style={{
                      height: isMobile ? '34px' : '39px',
                      padding: isMobile ? '0 8px' : '0 17px',
                      backgroundColor: 'transparent',
                      color: '#fff',
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderRadius: '24px',
                      fontSize: isMobile ? '11px' : '17px',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: 600,
                      minWidth: isMobile ? '0' : 'auto',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Clear
                  </button>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Main Content */}
          <Box sx={{ maxWidth: '1130px', mx: 'auto', px: { xs: 2, sm: 2, md: 3 } }}>
            {loading ? (
              <PlayerCareerLoadingSkeleton />
            ) : (
              <Box>
                {/* Performance Over Time Chart */}
                <GlassCard sx={{ mb: 3, border: `2px solid ${themeColors.border}`, background: '#232528' }}>
                  <Box sx={{ p: 0 }}>
                    {/* Chart Header with toggles */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderBottom: `1px solid ${themeColors.border}`,
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      {/* Left side - League selector (independent per card) */}
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          sx={{
                            background: chartLeague === 'all' ? themeColors.primary : '#2a2a2a',
                            color: themeColors.text,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 1,
                            minWidth: 'auto',
                            '&:hover': { background: chartLeague === 'all' ? themeColors.primary : '#3a3a3a' }
                          }}
                          onClick={() => setChartLeague('all')}
                        >
                          All Leagues
                        </Button>
                        {(() => {
                          const currentId = (filters.leagueId && filters.leagueId !== 'all') ? filters.leagueId : preferredLeagueId;
                          const currentName = (filters.leagueId && filters.leagueId !== 'all') ? selectedLeagueName : preferredLeagueName;
                          if (!currentId || !currentName) return null;
                          return (
                            <Button
                              size="small"
                              sx={{
                                background: chartLeague === currentId ? themeColors.primary : '#2a2a2a',
                                color: themeColors.text,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'none',
                                px: 1.2,
                                py: 0.4,
                                borderRadius: 1,
                                minWidth: 'auto',
                                '&:hover': { background: chartLeague === currentId ? themeColors.primary : '#3a3a3a' }
                              }}
                              onClick={() => setChartLeague(currentId)}
                            >
                              Current
                            </Button>
                          );
                        })()}
                      </Box>

                      {/* Right side - Time grouping toggles */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {['weekly', 'monthly'].map((mode) => (
                          <Button
                            key={mode}
                            size="small"
                            sx={{
                              background: groupMode === mode ? themeColors.primary : '#2a2a2a',
                              color: themeColors.text,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              minWidth: 'auto',
                              '&:hover': { background: groupMode === mode ? themeColors.primary : '#3a3a3a' }
                            }}
                            onClick={() => setGroupMode(mode as 'weekly' | 'monthly')}
                          >
                            {mode}
                          </Button>
                        ))}
                      </Box>
                    </Box>

                    {/* Chart Title */}
                    <Box sx={{ textAlign: 'center', pt: 2, pb: 1 }}>
                      <Typography sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: themeColors.text,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        XP Performance Time Series
                      </Typography>
                    </Box>

                    {/* Chart Container */}
                    <Box sx={{ height: { xs: 250, sm: 280, md: 300 }, px: 2, pb: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={chartData.length > 0 ? chartData : performanceData}
                          margin={{ top: 10, left: 10, right: 10, bottom: 30 }}
                        >
                          <XAxis
                            dataKey="label"
                            stroke={themeColors.textDim}
                            tick={{ fontSize: 10, fill: themeColors.textDim }}
                            interval="preserveStartEnd"
                            tickMargin={8}
                            angle={-30}
                            textAnchor="end"
                            tickLine={{ stroke: themeColors.border }}
                            axisLine={{ stroke: themeColors.border }}
                          />
                          <YAxis
                            yAxisId="avg"
                            stroke={themeColors.textDim}
                            tick={{ fontSize: 10, fill: themeColors.textDim }}
                            width={40}
                            tickLine={{ stroke: themeColors.border }}
                            axisLine={{ stroke: themeColors.border }}
                          />
                          <YAxis
                            yAxisId="cum"
                            orientation="right"
                            stroke={themeColors.textDim}
                            tick={{ fontSize: 10, fill: themeColors.textDim }}
                            width={45}
                            tickLine={{ stroke: themeColors.border }}
                            axisLine={{ stroke: themeColors.border }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: themeColors.surfaceAlt,
                              border: `1px solid ${themeColors.border}`,
                              fontSize: 11,
                              borderRadius: 4,
                              color: themeColors.text
                            }}
                            labelStyle={{ fontWeight: 600, color: themeColors.text }}
                            formatter={(value: unknown, name: unknown) => {
                              const v = (typeof value === 'number' || typeof value === 'string') ? value : String(value ?? '');
                              const n = typeof name === 'string' ? name : String(name ?? '');
                              const period = groupMode === 'monthly' ? 'Month' : 'Week';
                              if (n.includes('Avg')) return [v, `Avg Points Per ${period}`];
                              if (n.includes('Cumulative')) return [v, `Cumulative XP (${period}ly)`];
                              return [v, n];
                            }}
                          />

                          {/* Bars for average points - Green/Teal */}
                          <Bar
                            yAxisId="avg"
                            dataKey="avgPoints"
                            fill={themeColors.chartBar}
                            name={groupMode === 'monthly' ? 'Avg Points/Month' : 'Avg Points/Week'}
                            maxBarSize={35}
                            radius={[3, 3, 0, 0]}
                          />

                          {/* Line for cumulative points - Magenta/Pink */}
                          <Line
                            yAxisId="cum"
                            type="monotone"
                            dataKey="cumulativePoints"
                            name={groupMode === 'monthly' ? 'Cumulative XP (Monthly)' : 'Cumulative XP (Weekly)'}
                            stroke={themeColors.chartLine}
                            strokeWidth={2}
                            dot={{ r: 3, stroke: themeColors.chartLine, strokeWidth: 1, fill: themeColors.chartLine }}
                            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: themeColors.chartLine }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Legend */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 3,
                      pb: 2,
                      pt: 2,
                      backgroundColor: '#383a3f',
                      borderTop: `1px solid ${themeColors.border}`,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 10, borderRadius: 1, background: themeColors.chartBar }} />
                        <Typography sx={{ fontSize: 11, color: themeColors.textDim }}>
                          {groupMode === 'monthly' ? 'Average XP Points Per Month' : 'Average XP Points Per Week'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 3, borderRadius: 1, background: themeColors.chartLine }} />
                        <Typography sx={{ fontSize: 11, color: themeColors.textDim }}>
                          {groupMode === 'monthly' ? 'Cumulative XP Points (Monthly)' : 'Cumulative XP Points (Weekly)'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </GlassCard>

                {/* Influence and Win/Loss Row */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Influence Radar Chart */}
                  <Grid item xs={12} md={6}>
                    <GlassCard sx={{ background: '#27292d' }}>
                      {/* Header with toggle */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        p: 1.5,
                        borderBottom: `1px solid ${themeColors.border}`,
                        flexWrap: 'wrap',
                        gap: 0.5
                      }}>
                        <Button
                          size="small"
                          sx={{
                            background: influenceLeague === 'all' ? themeColors.primary : '#2a2a2a',
                            color: themeColors.text,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 1,
                            minWidth: 'auto',
                            '&:hover': { background: influenceLeague === 'all' ? themeColors.primary : '#3a3a3a' }
                          }}
                          onClick={() => setInfluenceLeague('all')}
                        >
                          All Leagues
                        </Button>
                        {(() => {
                          const currentId = (filters.leagueId && filters.leagueId !== 'all') ? filters.leagueId : preferredLeagueId;
                          const currentName = (filters.leagueId && filters.leagueId !== 'all') ? selectedLeagueName : preferredLeagueName;
                          if (!currentId || !currentName) return null;
                          return (
                            <Button
                              size="small"
                              sx={{
                                background: influenceLeague === currentId ? themeColors.primary : '#2a2a2a',
                                color: themeColors.text,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'none',
                                px: 1.2,
                                py: 0.4,
                                borderRadius: 1,
                                minWidth: 'auto',
                                '&:hover': { background: influenceLeague === currentId ? themeColors.primary : '#3a3a3a' }
                              }}
                              onClick={() => setInfluenceLeague(currentId)}
                            >
                              Current
                            </Button>
                          );
                        })()}
                      </Box>

                      <CardContent sx={{ p: 2, pt: 1, pb: 1 }}>
                        {/* Title */}
                        <Typography sx={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: themeColors.text,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          mb: 1
                        }}>
                          Influence
                        </Typography>

                        <Box sx={{ height: 160 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart
                              data={influenceRadarData}
                              outerRadius={55}
                              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                            >
                              <PolarGrid
                                gridType="polygon"
                                stroke={themeColors.border}
                                strokeWidth={1}
                              />
                              <PolarAngleAxis
                                dataKey="metric"
                                tick={{ fontSize: 8, fill: themeColors.textDim }}
                                tickSize={8}
                                reversed={false}
                                scale="auto"
                              />
                              <PolarRadiusAxis
                                tick={{ fontSize: 7, fill: themeColors.textFaint }}
                                tickCount={5}
                                angle={90}
                                allowDecimals={false}
                                domain={[0, 'dataMax + 1']}
                              />

                              {/* Player Data - Cyan */}
                              <Radar
                                name={playerName || 'Player'}
                                dataKey={playerName || 'Player'}
                                stroke={themeColors.cyan}
                                fill={themeColors.cyan}
                                fillOpacity={0.2}
                                strokeWidth={2}
                                dot={{ r: 2, fill: themeColors.cyan }}
                              />

                              {/* League Average - Teal */}
                              <Radar
                                name="League Avg"
                                dataKey="League Avg"
                                stroke={themeColors.chartBar}
                                fill={themeColors.chartBar}
                                fillOpacity={0.1}
                                strokeWidth={2}
                                dot={{ r: 2, fill: themeColors.chartBar }}
                              />

                              <Tooltip
                                contentStyle={{
                                  background: themeColors.surfaceAlt,
                                  border: `1px solid ${themeColors.border}`,
                                  borderRadius: 4,
                                  color: themeColors.text,
                                  fontSize: 10,
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 3,
                        pb: 2,
                        pt: 2,
                        backgroundColor: '#383a3f',
                        borderTop: `1px solid ${themeColors.border}`,
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 10, height: 3, backgroundColor: themeColors.cyan, borderRadius: 1 }} />
                          <Typography sx={{ fontSize: 10, color: themeColors.textDim }}>
                            {playerName || 'Player'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 10, height: 3, backgroundColor: themeColors.chartBar, borderRadius: 1 }} />
                          <Typography sx={{ fontSize: 10, color: themeColors.textDim }}>
                            League Average
                          </Typography>
                        </Box>
                      </Box>
                    </GlassCard>
                  </Grid>

                  {/* Win/Loss Pie Chart */}
                  <Grid item xs={12} md={6}>
                    <GlassCard sx={{ background: '#27292d' }}>
                      {/* Header with toggle */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        p: 1.5,

                        borderBottom: `1px solid ${themeColors.border}`,
                        flexWrap: 'wrap',
                        gap: 0.5
                      }}>
                        <Button
                          size="small"
                          sx={{
                            background: winLossLeague === 'all' ? themeColors.primary : '#2a2a2a',
                            color: themeColors.text,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 1,
                            minWidth: 'auto',
                            '&:hover': { background: winLossLeague === 'all' ? themeColors.primary : '#3a3a3a' }
                          }}
                          onClick={() => setWinLossLeague('all')}
                        >
                          All Leagues
                        </Button>
                        {(() => {
                          const currentId = (filters.leagueId && filters.leagueId !== 'all') ? filters.leagueId : preferredLeagueId;
                          const currentName = (filters.leagueId && filters.leagueId !== 'all') ? selectedLeagueName : preferredLeagueName;
                          if (!currentId || !currentName) return null;
                          return (
                            <Button
                              size="small"
                              sx={{
                                background: winLossLeague === currentId ? themeColors.primary : '#2a2a2a',
                                color: themeColors.text,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'none',
                                px: 1.2,
                                py: 0.4,
                                borderRadius: 1,
                                minWidth: 'auto',
                                '&:hover': { background: winLossLeague === currentId ? themeColors.primary : '#3a3a3a' }
                              }}
                              onClick={() => setWinLossLeague(currentId)}
                            >
                              Current
                            </Button>
                          );
                        })()}
                      </Box>

                      <CardContent sx={{ p: 2, pt: 1, pb: 1 }}>
                        {/* Title */}
                        <Typography sx={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: themeColors.text,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          mb: 1
                        }}>
                          Win/Loss/Draw
                        </Typography>

                        <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {actualWinLossData.every(d => d.value === 0) ? (
                            <Typography sx={{ fontSize: 12, color: themeColors.textDim }}>No match data available</Typography>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={actualWinLossData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={55}
                                  paddingAngle={2}
                                  startAngle={90}
                                  endAngle={450}
                                  label={false}
                                  labelLine={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: themeColors.surfaceAlt,
                                    border: `1px solid ${themeColors.border}`,
                                    borderRadius: 4,
                                    color: themeColors.text,
                                    fontSize: 10,
                                  }}
                                  formatter={(value: unknown, name: unknown) => [`${value}%`, String(name ?? '')]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </Box>

                      </CardContent>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2,
                        pb: 2,
                        pt: 2,
                        backgroundColor: '#383a3f',
                        borderTop: `1px solid ${themeColors.border}`,
                      }}>
                        {actualWinLossData.map((entry, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: '50%',
                              backgroundColor: entry.color
                            }} />
                            <Typography sx={{ fontSize: 10, color: themeColors.textDim }}>
                              {entry.name} {entry.value}%
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </GlassCard>
                  </Grid>
                </Grid>

                {/* IMPACT Section */}
                <GlassCard sx={{ mb: 3, background: '#232427' }}>
                  {/* Orange Header */}
                  <Box sx={{
                    // background: themeColors.primary, 
                    px: 2,
                    py: 1,

                    borderRadius: '8px 8px 0 0'
                  }}>
                    <Typography sx={{
                      fontSize: { xs: 14, md: 16 },
                      fontWeight: 'bold',
                      color: themeColors.text,
                      pl: { xs: 1.5, md: 5 },
                      pt: 1,
                      textTransform: 'uppercase'
                    }}>
                      IMPACT
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="flex-start">
                      {/* Tables Container */}
                      <Grid item xs={12} md={12} sx={{ px: { xs: 1, md: 0 } }}>
                        {/* First Table - Expected Per Match */}
                        <Table
                          size="small"
                          sx={{
                            mb: 2,
                            width: '100%',
                            tableLayout: 'fixed',
                            '& .MuiTableCell-root:first-of-type': { pl: { xs: 1.2, md: 5 } },
                          }}
                        >
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#202124' }}>
                              <TableCell sx={{ width: { xs: '48%', md: '55%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>Metric</TableCell>
                              <TableCell align="center" sx={{ width: { xs: '22%', md: '22.5%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>{isMobile ? 'Your' : 'Your Stats'}</TableCell>
                              <TableCell align="center" sx={{ width: { xs: '30%', md: '22.5%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>{isMobile ? 'Expected/Match' : 'Expected Per Match'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              const current = yourStats;
                              const totalMatches = current.n;
                              const goalsPerMatch = totalMatches > 0 ? current.goals / totalMatches : 0;
                              const assistsPerMatch = totalMatches > 0 ? current.assists / totalMatches : 0;
                              const cleanSheetsPerMatch = totalMatches > 0 ? current.cleanSheets / totalMatches : 0;
                              const winRate = current.winRate;

                              return (
                                <>
                                  <TableRow>
                                    <TableCell sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Expected to score a goal (xG)</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{toRoundedInt(current.goals)}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{formatStatDecimal(goalsPerMatch)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Expected to assist a goal (xA)</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{toRoundedInt(current.assists)}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{formatStatDecimal(assistsPerMatch)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Expected to keep Clean Sheet (xCS)</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{toRoundedInt(current.cleanSheets)}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{formatStatDecimal(cleanSheetsPerMatch)}</TableCell>
                                  </TableRow>
                                  <TableRow sx={{ bgcolor: '#383a3e' }}>
                                    <TableCell sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, bgcolor: '#383a3e' }}>Win rate</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, bgcolor: '#383a3e' }}>-</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 11, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, bgcolor: '#383a3e' }}>{winRate.toFixed(0)}%</TableCell>
                                  </TableRow>
                                </>
                              );
                            })()}
                          </TableBody>
                        </Table>

                        {/* Second Table - Actual Stats */}
                        <Table
                          size="small"
                          sx={{
                            width: '100%',
                            tableLayout: 'fixed',
                            '& .MuiTableCell-root:first-of-type': { pl: { xs: 1.2, md: 5 } },
                          }}
                        >
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#202124' }}>
                              <TableCell sx={{ width: { xs: '48%', md: '55%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>Metric</TableCell>
                              <TableCell align="center" sx={{ width: { xs: '22%', md: '22.5%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>{isMobile ? 'Your' : 'Your Stats'}</TableCell>
                              <TableCell align="center" sx={{ width: { xs: '30%', md: '22.5%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>{isMobile ? 'Avg' : 'League Average'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              return leagueComparisonRows.map((row) => {
                                const isContribution = row.metric === 'Game Contribution Index';
                                return (
                                  <TableRow key={row.metric} sx={isContribution ? { bgcolor: '#383a3e' } : undefined}>
                                    <TableCell
                                      sx={{
                                        fontSize: 11,
                                        py: 0.8,
                                        color: themeColors.text,
                                        borderBottom: `1px solid ${themeColors.border}`,
                                        ...(isContribution ? { bgcolor: '#383a3e' } : {})
                                      }}
                                    >
                                      {row.metric}
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      sx={{
                                        fontSize: 11,
                                        py: 0.8,
                                        color: themeColors.text,
                                        borderBottom: `1px solid ${themeColors.border}`,
                                        ...(isContribution ? { bgcolor: '#383a3e' } : {})
                                      }}
                                    >
                                      {row.yourDisplay}
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      sx={{
                                        fontSize: 11,
                                        py: 0.8,
                                        color: row.leagueAverage > 0 ? themeColors.text : themeColors.textDim,
                                        borderBottom: `1px solid ${themeColors.border}`,
                                        ...(isContribution ? { bgcolor: '#383a3e' } : {})
                                      }}
                                    >
                                      {row.leagueDisplay}
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </Grid>
                    </Grid>
                  </Box>
                </GlassCard>

                {/* YOUR TOP STRENGTHS Section */}
                <GlassCard sx={{ mb: 3, background: '#27292d' }}>
                  {/* Orange Header */}
                  <Box sx={{
                    // background: '#202124', 
                    px: 2,
                    py: 1,
                    borderRadius: '8px 8px 0 0'
                  }}>
                    <Typography sx={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: themeColors.text,
                      pl: { xs: 1.5, md: 5 },
                      pt: 1,
                      textTransform: 'uppercase'
                    }}>
                      Your Top Strengths
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid item xs={12} md={12} sx={{ px: { xs: 1, md: 0 } }}>
                        <Table
                          size="small"
                          sx={{
                            width: '100%',
                            tableLayout: 'fixed',
                            '& .MuiTableCell-root:first-of-type': { pl: { xs: 1.2, md: 5 } },
                          }}
                        >
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#202124' }}>
                              <TableCell sx={{ width: { xs: '48%', md: '55%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>Metric</TableCell>
                              <TableCell align="center" sx={{ width: { xs: '22%', md: '22.5%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>{isMobile ? 'Your' : 'Your Stats'}</TableCell>
                              <TableCell align="center" sx={{ width: { xs: '30%', md: '22.5%' }, fontSize: { xs: 10, md: 11 }, fontWeight: 'bold', py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}`, lineHeight: 1.2 }}>{isMobile ? 'Avg' : 'League Average'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {topStrengthRows.map((row) => {
                              return (
                                <TableRow key={row.metric}>
                                  <TableCell sx={{ fontSize: { xs: 10, md: 11 }, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{row.metric}</TableCell>
                                  <TableCell align="center" sx={{ fontSize: { xs: 10, md: 11 }, py: 0.8, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>{row.yourDisplay}</TableCell>
                                  <TableCell align="center" sx={{ py: 0.8, borderBottom: `1px solid ${themeColors.border}` }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                      <Typography sx={{ fontSize: { xs: 10, md: 11 }, color: row.leagueAverage > 0 ? themeColors.text : themeColors.textDim }}>
                                        {row.leagueDisplay}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {topStrengthNote && (
                          <Typography sx={{ fontSize: 11, mt: 1.5, pl: { xs: 1.5, md: 5 }, color: themeColors.textDim }}>
                            {topStrengthNote}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1, pl: { xs: 1.5, md: 5 }, color: themeColors.textDim }}>
                          <Typography sx={{ fontSize: 10.5 }}>
                            Calculation data: Player: {playerName || playerId || 'Player'} | League: {selectedLeagueName || 'All Leagues'} | Season: {selectedSeasonLabel}
                          </Typography>
                          <Typography sx={{ fontSize: 10.5 }}>
                            Average data: {currentImpactLeagueAvg
                              ? leagueComparisonRows.map((row) => `${row.metric}: ${row.leagueDisplay}`).join(' | ')
                              : 'Waiting for filtered league averages...'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </GlassCard>

                {/* FOCUS AREA Section (private: only when viewing your own dashboard) */}
                {canViewPersonalSections && (
                  <GlassCard sx={{ mb: 3, background: '#25262a' }}>
                    {/* Orange Header */}
                    <Box sx={{
                      background: '#25262a',
                      px: 2,
                      py: 1,
                      borderRadius: '8px 8px 0 0'
                    }}>
                      <Typography sx={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: themeColors.text,
                        pl: { xs: 1.5, md: 5 },
                        pt: 1,
                        textTransform: 'uppercase'
                      }}>
                        Focus Area
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      <Typography sx={{ fontSize: 12, pl: { xs: 1.5, md: 5 }, color: themeColors.textDim }}>
                        {focusSuggestion}
                      </Typography>
                    </Box>
                  </GlassCard>
                )}

                {/* Play Best With + Rivalries */}
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    mb: 1,
                    textAlign: 'center',
                    lineHeight: 1.45,
                    color: themeColors.text
                  }}>
                    {topTeammateLine}
                  </Typography>

                  <Typography sx={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: 1.45,
                    color: toughestRivalLine === 'No toughest opponent identified yet' ? themeColors.textDim : themeColors.text
                  }}>
                    {toughestRivalLine}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
