'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  // Chip,
  // Divider,
  // LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  // Slider,
  // Card,
  CardContent
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayerStats } from '@/lib/features/playerStatsSlice';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
// import { Legend as RechartsLegend } from 'recharts';
import { useAuth } from '@/lib/useAuth';

// ---------- THEME (Brand) ----------
const themeColors = {
  primary: '#E56A16',
  primaryAlt: '#CF2326',
  gradient: 'linear-gradient(135deg,#E56A16 0%,#CF2326 100%)',
  gradientSoft: 'linear-gradient(135deg,rgba(229,106,22,0.18) 0%,rgba(207,35,38,0.18) 100%)',
  surfaceBase: '#141416',
  surfaceAlt: '#1d1e21',
  surfacePanel: 'linear-gradient(140deg,#1f2023 0%,#27292d 60%)',
  border: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.32)',
  text: '#fff',
  textDim: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.52)',
  success: '#15b67a',
  warn: '#ffb300',
  danger: '#d32f2f',
  // Additional Flutter UI colors
  teal: '#009688',
  blue: '#2196F3',
  green: '#4CAF50',
  red: '#F44336',
  orange: '#FF9800'
};

// Mock data to match Flutter UI
// const performanceData = [
//   { month: "Jan", points: 20, total: 100 },
//   { month: "Feb", points: 40, total: 200 },
//   { month: "Mar", points: 60, total: 300 },
//   { month: "Apr", points: 80, total: 400 },
//   { month: "May", points: 50, total: 450 },
// ];

const influenceData = [
  { metric: "Goals", playerValue: 10, leagueAvg: 6 },
  { metric: "Assists", playerValue: 8, leagueAvg: 5 },
  { metric: "Clean Sheets", playerValue: 7, leagueAvg: 4 },
  { metric: "Defence", playerValue: 5, leagueAvg: 3 },
  { metric: "MOTM", playerValue: 6, leagueAvg: 4 },
];

// const leagueAvgData = [
//   { metric: "Goals", value: 6 },
//   { metric: "Assists", value: 5 },
//   { metric: "Clean Sheets", value: 4 },
//   { metric: "Defence", value: 3 },
//   { metric: "MOTM", value: 4 },
// ];

const winLossData = [
  { name: 'Win', value: 45, color: '#4CAF50' },
  { name: 'Loss', value: 35, color: '#F44336' },
  { name: 'Draw', value: 20, color: '#FF9800' },
];

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
  result?: 'W' | 'L' | 'D';
}

interface LeagueMatch {
  id: string;
  date: string;
  playerStats?: PlayerMatchStats;
}
interface LeagueWithMatches {
  id: string;
  matches?: LeagueMatch[];
}
interface PlayerStatsData {
  leagues?: LeagueWithMatches[];
}

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

interface StrengthEntry extends InfluenceEntry {}

interface RecentRow {
  id: string;
  date: string;
  goals: number;
  assists: number;
  cleanSheets: number;
  impact: number;
  defence: number;
  fk: number;
  pens: number;
  motm: number;
  points: number;
  result: string;
}

// ---------- DYNAMIC RECHARTS ----------
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChart       = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const Line                = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const PieChart            = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie                 = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell                = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });
const RadarChart          = dynamic(() => import('recharts').then(m => m.RadarChart), { ssr: false });
const PolarGrid           = dynamic(() => import('recharts').then(m => m.PolarGrid), { ssr: false });
const PolarAngleAxis      = dynamic(() => import('recharts').then(m => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis     = dynamic(() => import('recharts').then(m => m.PolarRadiusAxis), { ssr: false });
const Radar               = dynamic(() => import('recharts').then(m => m.Radar), { ssr: false });
// const Scatter             = dynamic(() => import('recharts').then(m => m.Scatter), { ssr: false }) as any; // cast to any to relax TS

// Background gradient
// const BG_GRAD = 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)';

// ---------- ANIMATIONS / STYLES ----------
// const floatIn = keyframes`
//   0% { opacity:0; transform:translateY(14px) scale(.985); }
//   60% { opacity:1; transform:translateY(-2px) scale(1); }
//   100% { opacity:1; transform:translateY(0) scale(1); }
// `;

const GlassCard = styled(Paper)(() => ({
  background: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: 12,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'border-color .35s, box-shadow .35s, transform .35s',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)'
  }
}));

const SectionTitle = styled(Typography)(() => ({
  fontWeight: 'bold',
  fontSize: 16,
  color: '#000',
  marginBottom: 12
}));

// Impact Table Row Builder (matching Flutter UI)
const ImpactRow = ({ title, value, change, up }: {
  title: string;
  value: string;
  change: string;
  up: boolean;
}) => (
  <TableRow>
    <TableCell sx={{ fontSize: 12, fontWeight: 500, py: 1 }}>{title}</TableCell>
    <TableCell align="center" sx={{ fontSize: 12, py: 1 }}>{value}</TableCell>
    <TableCell align="center" sx={{ fontSize: 12, py: 1, color: up ? '#4CAF50' : '#F44336', fontWeight: 500 }}>
      {change}
    </TableCell>
    <TableCell align="center" sx={{ py: 1 }}>
      {up ? <ArrowUpward sx={{ fontSize: 14, color: '#4CAF50' }} /> : <ArrowDownward sx={{ fontSize: 14, color: '#F44336' }} />}
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
    <TableCell sx={{ fontSize: 12, fontWeight: 500, py: 1 }}>{title}</TableCell>
    <TableCell align="center" sx={{ fontSize: 12, py: 1 }}>{you}</TableCell>
    {showComparison && (
      <TableCell align="center" sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: up ? '#4CAF50' : '#F44336', fontWeight: 500 }}>
            {diff}
          </Typography>
          {up ? <ArrowUpward sx={{ fontSize: 14, color: '#4CAF50' }} /> : <ArrowDownward sx={{ fontSize: 14, color: '#F44336' }} />}
        </Box>
      </TableCell>
    )}
  </TableRow>
);

// ---------- HELPERS ----------
function calcPoints(ps: PlayerMatchStats | undefined): number {
  if (!ps) return 0;
  return (ps.goals || 0) * 4
    + (ps.assists || 0) * 3
    + (ps.cleanSheets || 0) * 3
    + (ps.motmVotes || 0) * 2
    + (ps.impact || 0)
    + (ps.defence || 0)
    + (ps.freeKicks || 0) * 2
    + (ps.penalties || 0) * 2;
}

// function weekKey(dateStr: string): string {
//   const d = dayjs(dateStr);
//   return d.startOf('week').format('YYYY-MM-DD');
// }

// ---------- COMPONENT ----------
export default function CareerPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const dispatch = useDispatch<AppDispatch>();
  const { data: rawData, filters } = useSelector((s: RootState) => s.playerStats);
  // Normalize null -> undefined to match internal typing expectations
  const data: PlayerStatsData | undefined = rawData ?? undefined;

  const loading = !data;

  useEffect(() => {
    if (playerId) {
      dispatch(fetchPlayerStats({ playerId, leagueId: filters.leagueId, year: filters.year }));
    }
  }, [playerId, dispatch, filters.leagueId, filters.year]);

  const matches: LeagueMatch[] = useMemo(() => {
    const d: PlayerStatsData | undefined = data;
    return (d?.leagues || [])
      .flatMap((l: LeagueWithMatches) => l.matches || [])
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [data]);

  // ------------- NEW STATE (grouping + range) -------------
  const [groupMode, setGroupMode] = useState<'auto'|'weekly'|'monthly'>('auto');
  const [range, setRange] = useState<number[] | null>(null); // [startIdx, endIdx]

  // ------------- AGGREGATION (supports forced modes) -------------
  const { performanceData, groupingType, periodKeyFn } = useMemo(() => {
    if (!matches.length) {
      return {
        performanceData: [] as PerformanceRow[],
        groupingType: 'weekly' as const,
        periodKeyFn: (d: string) => dayjs(d).startOf('week').format('YYYY-MM-DD')
      };
    }

    const buildWeekly = (): PerformanceRow[] => {
      const map = new Map<string, PerformanceRow>();
      matches.forEach(m => {
        const weekStart = dayjs(m.date).startOf('week');
        const key = weekStart.format('YYYY-MM-DD');
        if (!map.has(key)) {
          map.set(key, {
            key,
            label: weekStart.format('DD-MMM'),
            year: weekStart.format('YYYY'),
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

      // Fill gaps
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
            cur = cur.add(1,'week');
        }
      }
      filled.sort((a,b)=>a.key.localeCompare(b.key));
      filled.forEach(r => { r.avgPoints = r.matches ? +(r.totalPoints / r.matches).toFixed(2) : 0; });
      let run = 0;
      filled.forEach(r => { run += r.totalPoints; r.cumulativePoints = run; });
      return filled;
    };

    const buildMonthly = (): PerformanceRow[] => {
      const map = new Map<string, PerformanceRow>();
      matches.forEach(m => {
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

      // Fill missing months
      const keys = Array.from(map.keys()).sort();
      const filled: PerformanceRow[] = [];
      if (keys.length) {
        let cur = dayjs(keys[0]+'-01');
        const end = dayjs(keys[keys.length - 1]+'-01');
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
          cur = cur.add(1,'month');
        }
      }
      filled.sort((a,b)=>a.key.localeCompare(b.key));
      let run = 0;
      filled.forEach(r => {
        r.avgPoints = r.matches ? +(r.totalPoints / r.matches).toFixed(2) : 0;
        run += r.totalPoints;
        r.cumulativePoints = run;
      });
      return filled;
    };

    let mode: 'weekly' | 'monthly';
    if (groupMode === 'weekly') mode = 'weekly';
    else if (groupMode === 'monthly') mode = 'monthly';
    else {
      // auto
  const weekly = buildWeekly();
  if (weekly.length < AUTO_SWITCH_THRESHOLD) {
        return {
          performanceData: weekly,
          groupingType: 'weekly' as const,
          periodKeyFn: (d: string) => dayjs(d).startOf('week').format('YYYY-MM-DD')
        };
      }
      mode = 'monthly';
    }

    if (mode === 'weekly') {
      return {
        performanceData: buildWeekly(),
        groupingType: 'weekly' as const,
        periodKeyFn: (d: string) => dayjs(d).startOf('week').format('YYYY-MM-DD')
      };
    }
    const monthly = buildMonthly();
    return {
      performanceData: monthly,
      groupingType: 'monthly' as const,
      periodKeyFn: (d: string) => dayjs(d).startOf('month').format('YYYY-MM')
    };
  }, [matches, groupMode]);

  // ------------- RAW MATCH SCATTER DATA -------------
  const performanceIndexByKey = useMemo(() => {
    const map: Record<string, PerformanceRow> = {};
    performanceData.forEach(p => { map[p.key] = p; });
    return map;
  }, [performanceData]);

  interface ScatterPoint {
    key: string;
    label: string;       // must match XAxis dataKey ("label") so it aligns
    year: string;
    matchPoints: number;
  }

  const scatterPoints: ScatterPoint[] = useMemo(() => {
    if (!performanceData.length) return [];
    return matches.map(m => {
      const periodKey = periodKeyFn(m.date);
      const period = performanceIndexByKey[periodKey];
      if (period) {
        return {
          key: periodKey,
          label: period.label,
          year: period.year,
          matchPoints: calcPoints(m.playerStats)
        };
      }
      // Fallback (should rarely happen if periods filled)
      const d = dayjs(m.date);
      return {
        key: periodKey,
        label: d.format(groupingType === 'weekly' ? 'DD-MMM' : 'MMM'),
        year: d.format('YYYY'),
        matchPoints: calcPoints(m.playerStats)
      };
    });
  }, [matches, performanceData, periodKeyFn, performanceIndexByKey, groupingType]);

  // ------------- RANGE FILTER -------------
  const chartData = useMemo(() => {
    if (!performanceData.length) return [];
    if (!range) return performanceData;
    const [s,e] = range;
    return performanceData.slice(s, e+1);
  }, [performanceData, range]);

  // const scatterFiltered = useMemo(() => {
  //   if (!scatterPoints.length) return [];
  //   if (!range) return scatterPoints;
  //   const [s,e] = range;
  //   const allowedKeys = new Set(performanceData.slice(s,e+1).map(p=>p.key));
  //   return scatterPoints.filter(sp => allowedKeys.has(sp.key));
  // }, [scatterPoints, range, performanceData]);

  // Reset range if data length changes
  useEffect(() => {
    setRange(null);
  }, [groupingType]);

  const wld = useMemo(() => {
    let W = 0, L = 0, D = 0;
    matches.forEach(m => {
      const r = m.playerStats?.result;
      if (r === 'W') W++; else if (r === 'L') L++; else if (r === 'D') D++;
    });
    return { W, L, D };
  }, [matches]);

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
    matches.forEach(m => {
      const ps = m.playerStats || {};
      total.Goals += ps.goals || 0;
      total.Assists += ps.assists || 0;
      total['Clean Sheets'] += ps.cleanSheets || 0;
      total.Impact += ps.impact || 0;
      total.Defence += ps.defence || 0;
      total['Free Kicks'] += ps.freeKicks || 0;
      total.Penalties += ps.penalties || 0;
      total['MOTM Votes'] += ps.motmVotes || 0;
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
  }, [matches]);

  // Compute top strengths as the most effective ways points are earned
  // We map player match stats into contribution buckets, then rank by scaled value
  const strengths: StrengthEntry[] = useMemo(
    () => [...influence]
      .filter(i => i.scaled > 0)
      .sort((a, b) => b.scaled - a.scaled)
      .slice(0, 3),
    [influence]
  );

  // Build league comparison baselines (simple league-wide averages across matches)
  // const leagueBaselines = useMemo(() => {
  //   // If leagues are provided, average per match across the same sample
  //   const n = Math.max(matches.length, 1);
  //   const totals: Record<string, number> = {
  //     Goals: 0,
  //     Assists: 0,
  //     'Clean Sheets': 0,
  //     Impact: 0,
  //     Defence: 0,
  //     'Free Kicks': 0,
  //     Penalties: 0,
  //     'MOTM Votes': 0
  //   };
  //   matches.forEach(m => {
  //     const ps = m.playerStats || {};
  //     totals.Goals += ps.goals || 0;
  //     totals.Assists += ps.assists || 0;
  //     totals['Clean Sheets'] += ps.cleanSheets || 0;
  //     totals.Impact += ps.impact || 0;
  //     totals.Defence += ps.defence || 0;
  //     totals['Free Kicks'] += ps.freeKicks || 0;
  //     totals.Penalties += ps.penalties || 0;
  //     totals['MOTM Votes'] += ps.motmVotes || 0;
  //   });
  //   const perMatch: Record<string, number> = {};
  //   Object.keys(totals).forEach(k => {
  //     perMatch[k] = n ? totals[k] / n : 0;
  //   });
  //   return perMatch;
  // }, [matches]);

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

  // Derive friendly lines for the top line below the table
  const topStrengthNote = useMemo(() => {
    if (!strengths.length) return '';
    const s = strengths[0];
    // rough percentile mapping from scaled value
    const pct = Math.max(1, Math.min(99, s.scaled));
    const metricName = s.metric;
    return `${metricName}: You're outperforming ${pct}% of players in your leagues!`;
  }, [strengths]);

  // --- Focus Area suggestion ---
  const focusSuggestion = useMemo(() => {
    if (!matches.length || !influence.length) {
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
  }, [matches.length, influence, strengths]);

  const recent: RecentRow[] = useMemo(() => {
    return [...matches].slice(-10).reverse().map(m => {
      const ps = m.playerStats || {};
      return {
        id: m.id,
        date: dayjs(m.date).format('DD MMM'),
        goals: ps.goals || 0,
        assists: ps.assists || 0,
        cleanSheets: ps.cleanSheets || 0,
        impact: ps.impact || 0,
        defence: ps.defence || 0,
        fk: ps.freeKicks || 0,
        pens: ps.penalties || 0,
        motm: ps.motmVotes || 0,
        points: calcPoints(ps),
        result: ps.result || '-'
      };
    });
  }, [matches]);

  // const recentAverages = useMemo(() => {
  //   if (!recent.length) return null;
  //   const agg = recent.reduce((a, r) => {
  //     a.goals += r.goals;
  //     a.assists += r.assists;
  //     a.cleanSheets += r.cleanSheets;
  //     a.impact += r.impact;
  //     a.defence += r.defence;
  //     a.fk += r.fk;
  //     a.pens += r.pens;
  //     a.motm += r.motm;
  //     a.points += r.points;
  //     return a;
  //   }, { goals:0, assists:0, cleanSheets:0, impact:0, defence:0, fk:0, pens:0, motm:0, points:0 });
  //   const d = recent.length;
  //   return {
  //     goals: +(agg.goals/d).toFixed(2),
  //     assists: +(agg.assists/d).toFixed(2),
  //     cleanSheets: +(agg.cleanSheets/d).toFixed(2),
  //     impact: +(agg.impact/d).toFixed(2),
  //     defence: +(agg.defence/d).toFixed(2),
  //     fk: +(agg.fk/d).toFixed(2),
  //     pens: +(agg.pens/d).toFixed(2),
  //     motm: +(agg.motm/d).toFixed(2),
  //     points: +(agg.points/d).toFixed(2),
  //   };
  // }, [recent]);

  // --- Last 10 vs Previous 10 for Impact section ---
  const lastPrev10 = useMemo(() => {
    const played = [...matches];
    const last10 = played.slice(-10);
    const prev10 = played.slice(-20, -10); // empty if fewer than 11 total

    const sum = (arr: LeagueMatch[], pick: (ps: PlayerMatchStats)=>number) =>
      arr.reduce((s, m) => s + pick(m.playerStats || {}), 0);
    const count = (arr: LeagueMatch[], pred: (ps: PlayerMatchStats)=>boolean) =>
      arr.reduce((s, m) => s + (pred(m.playerStats || {}) ? 1 : 0), 0);

    const agg = (arr: LeagueMatch[]) => {
      const n = arr.length || 0;
      const wins = count(arr, ps => ps.result === 'W');
      const draws = count(arr, ps => ps.result === 'D');
      const losses = count(arr, ps => ps.result === 'L');
      const winRate = n ? (wins / n) * 100 : 0;
      const impactAvg = n ? sum(arr, ps => ps.impact || 0) / n : 0;
      const motmVotes = sum(arr, ps => ps.motmVotes || 0);
      const ga = sum(arr, ps => (ps.goals || 0) + (ps.assists || 0));
      return { n, wins, draws, losses, winRate, impactAvg, motmVotes, ga };
    };

    return { last: agg(last10), prev: agg(prev10) };
  }, [matches]);

  const positiveImpactMsgs = useMemo(() => {
    const msgs: string[] = [];
    const { last, prev } = lastPrev10;
    if (prev.n > 0) {
      const winDelta = last.winRate - prev.winRate;
      if (winDelta > 0.25) msgs.push(`Win ratio improved by ${winDelta.toFixed(1)}% over the previous 10.`);

      const impactDelta = last.impactAvg - prev.impactAvg;
      if (impactDelta > 0.05) msgs.push(`Impact increased by ${impactDelta.toFixed(1)} per game versus the previous 10.`);

      const motmDelta = last.motmVotes - prev.motmVotes;
      if (motmDelta > 0) msgs.push(`Earned ${motmDelta} more MOTM votes in the last 10.`);

      const gaDelta = last.ga - prev.ga;
      if (gaDelta > 0) msgs.push(`Produced ${gaDelta} more goal contributions (G+A) in the last 10.`);
    }
    return msgs.slice(0, 3);
  }, [lastPrev10]);

  // const careerTotals = useMemo(() => {
  //   const totalMatches = matches.length;
  //   const totalPoints = matches.reduce((s,m)=> s + calcPoints(m.playerStats),0);
  //   return {
  //     totalMatches,
  //     totalPoints,
  //     avgPerMatch: totalMatches ? +(totalPoints/totalMatches).toFixed(2) : 0
  //   };
  // }, [matches]);

  // const insights: string[] = useMemo(() => {
  //   const lines: string[] = [];
  //   if (performanceData.length) {
  //     const best = [...performanceData].sort((a, b) => b.avgPoints - a.avgPoints)[0];
  //     lines.push(`Peak ${groupingType === 'weekly' ? 'Week' : 'Month'}: ${best.label} ${best.year} (Avg ${best.avgPoints}).`);
  //   }
  //   if (performanceData.length > 1) {
  //     const last3 = performanceData.slice(-3);
  //     if (last3.length === 3) {
  //       const trend = last3.map(r => r.avgPoints);
  //       const dir = trend[2] > trend[0] ? 'rising' : trend[2] < trend[0] ? 'declining' : 'flat';
  //       lines.push(`Form Trend: ${dir} (${trend.map(t => t.toFixed(2)).join(' → ')}).`);
  //     }
  //   }
  //   if (matches.length) {
  //     const totalPoints = matches.reduce((s,m)=> s + calcPoints(m.playerStats),0);
  //     lines.push(`Career Avg Points/Match: ${(totalPoints / matches.length).toFixed(2)} over ${matches.length} matches.`);
  //   }
  //   const winTotal = wld.W + wld.L + wld.D;
  //   if (winTotal) {
  //     lines.push(`Win Rate: ${((wld.W / winTotal) * 100).toFixed(1)}% (W${wld.W}/D${wld.D}/L${wld.L}).`);
  //   }
  //   if (strengths.length) {
  //     lines.push(`Key Strength: ${strengths[0].metric} (raw ${strengths[0].value}).`);
  //   }
  //   if (!lines.length) lines.push('Not enough data for insights.');
  //   return lines;
  // }, [performanceData, groupingType, matches, wld, strengths]);

  // const formBadge = useMemo(() => {
  //   if (!performanceData.length) return 'No Data';
  //   const last = performanceData.slice(-5);
  //   const avg = last.reduce((s, r) => s + r.avgPoints, 0) / last.length;
  //   if (avg >= 25) return 'On Fire';
  //   if (avg >= 15) return 'Hot Form';
  //   if (avg >= 8) return 'Solid';
  //   return 'Needs Spark';
  // }, [performanceData]);

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
        const res = await fetch(`/api/players/${playerId}`, { cache: 'no-store' });
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
  }, [playerId, playerNameFromStats]);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 2,
        minHeight: '100vh',
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          p: 2,
        }}
      >
        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: '#000',
            mb: 2,
            textAlign: 'center',
            fontSize: 14
          }}
        >
          {playerName ? `${playerName} Performance Dashboard` : 'Khurram Performance Dashboard'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Box>
            {/* Performance Over Time Chart */}
            <GlassCard sx={{ mb: 2 }}>
              <Box
                sx={{
                  p: 0,
                  height: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  background: '#ffffff',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid #0c3144',
                  boxShadow: '0 4px 18px -4px rgba(0,0,0,0.18)',
                }}
              >
                {/* Grouping selector (Auto / Weekly / Monthly) */}
                <Box sx={{ position: 'absolute', top: 8, right: 10, zIndex: 6 }}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={groupMode}
                    onChange={(_, val) => { if (val) setGroupMode(val); }}
                    aria-label="grouping selector"
                  >
                    <ToggleButton value="auto" aria-label="auto grouping">Auto</ToggleButton>
                    <ToggleButton value="weekly" aria-label="weekly grouping">Weekly</ToggleButton>
                    <ToggleButton value="monthly" aria-label="monthly grouping">Monthly</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {/* Title centered top */}
                <Box sx={{ textAlign: 'center', pt: 1.5, pb: 0.5 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#2d2d2d', letterSpacing: 0.4 }}>
                    Performance Over Time
                  </Typography>
                </Box>

                {/* Side ribbons - matching the reference image */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 70, 
                  bottom: 60, 
                  left: 15, 
                  width: 25, 
                  background: '#00ACC1', 
                  color: '#fff', 
                  borderRadius: 1.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  writingMode: 'vertical-rl', 
                  transform: 'rotate(180deg)', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  letterSpacing: 0.4, 
                  zIndex: 3, 
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' 
                }}>
                  Average XP Points
                </Box>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 70, 
                  bottom: 60, 
                  right: 15, 
                  width: 28, 
                  background: '#1976D2', 
                  color: '#fff', 
                  borderRadius: 1.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  writingMode: 'vertical-rl', 
                  transform: 'rotate(180deg)', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  letterSpacing: 0.4, 
                  zIndex: 3, 
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' 
                }}>
                  Accumulative XP Points
                </Box>

                {/* Chart */}
                <Box sx={{ position: 'relative', zIndex: 4, flex: 1, minHeight: 0, px: 6, pt: 6, pb: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.length > 0 ? chartData : performanceData} margin={{ top: 15, left: 15, right: 15, bottom: 40 }}>
                      <XAxis 
                        dataKey={chartData.length > 0 ? "label" : "month"}
                        stroke="#666"
                        tick={{ fontSize: 11, fill: '#333' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        tickLine={{ stroke: '#ccc' }}
                        axisLine={{ stroke: '#bbb' }}
                      />
                      <YAxis
                        yAxisId="avg"
                        stroke="#666"
                        tick={{ fontSize: 11, fill: '#333' }}
                        width={45}
                        tickLine={{ stroke: '#ccc' }}
                        axisLine={{ stroke: '#bbb' }}
                      />
                      <YAxis
                        yAxisId="cum"
                        orientation="right"
                        stroke="#666"
                        tick={{ fontSize: 11, fill: '#333' }}
                        width={55}
                        tickLine={{ stroke: '#ccc' }}
                        axisLine={{ stroke: '#bbb' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #0c3144',
                          fontSize: 11,
                          borderRadius: 6,
                          boxShadow: '0 4px 10px -2px rgba(0,0,0,0.15)'
                        }}
                        labelStyle={{ fontWeight: 700, color: '#222' }}
                        formatter={(value: unknown, name: unknown) => {
                          const v = (typeof value === 'number' || typeof value === 'string') ? value : String(value ?? '');
                          const n = typeof name === 'string' ? name : String(name ?? '');
                          if (n.includes('Avg')) return [v, 'Avg Points'] as [string | number, string];
                          if (n.includes('Accumulative')) return [v, 'Cumulative XP'] as [string | number, string];
                          return [v, n] as [string | number, string];
                        }}
                      />
                      {/* Green bars for average points */}
                      <Bar
                        yAxisId="avg"
                        dataKey={chartData.length > 0 ? "avgPoints" : "points"}
                        fill="#00E676"
                        name={chartData.length > 0 ? `Avg Points / ${groupingType === 'weekly' ? 'Week' : 'Month'}` : "Avg Points per Month"}
                        maxBarSize={40}
                        radius={[4, 4, 0, 0]}
                      />
                      {/* Blue line for cumulative points */}
                      <Line
                        yAxisId="cum"
                        type="monotone"
                        dataKey={chartData.length > 0 ? "cumulativePoints" : "total"}
                        name="Accumulative XP Points"
                        stroke="#1976D2"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: '#fff', strokeWidth: 1.5, fill: '#1976D2' }}
                        activeDot={{ r: 6, stroke: '#0c3144', strokeWidth: 1, fill: '#1976D2' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>

                {/* Legend - matching the reference image */}
                <Box sx={{ 
                  position: 'relative', 
                  zIndex: 4, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  flexWrap: 'wrap', 
                  gap: 4, 
                  pb: 1.5, 
                  mt: 0.5, 
                  borderTop: '1px solid #e3e8ef', 
                  background: '#f7f9fb' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 18, height: 14, borderRadius: 2, background: '#00E676' }} />
                    <Typography sx={{ fontSize: 12, color: '#444', fontWeight: 600 }}>
                      Avg Points per Month
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 18, height: 8, borderRadius: 2, background: '#1976D2' }} />
                    <Typography sx={{ fontSize: 12, color: '#444', fontWeight: 600 }}>
                      Accumulative XP Points
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </GlassCard>

            {/* Influence and Win/Loss Row */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* Influence Radar Chart */}
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ height: 220 }}>
                  <CardContent>
                    <SectionTitle>Influence</SectionTitle>
                    <Box sx={{ height: 150 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={influenceData} outerRadius={60}>
                          <PolarGrid />
                          <PolarAngleAxis 
                            dataKey="metric" 
                            tick={{ fontSize: 10 }}
                            scale="point"
                            reversed={false}
                          />
                          <PolarRadiusAxis tick={{ fontSize: 8 }} />
                          <Radar 
                            name="Player" 
                            dataKey="playerValue" 
                            stroke={themeColors.teal}
                            fill={themeColors.teal}
                            fillOpacity={0.3}
                          />
                          <Radar 
                            name="League Avg" 
                            dataKey="leagueAvg" 
                            stroke={themeColors.orange}
                            fill={themeColors.orange}
                            fillOpacity={0.2}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              {/* Win/Loss Pie Chart */}
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ height: 220 }}>
                  <CardContent>
                    <SectionTitle>Win/Loss</SectionTitle>
                    <Box sx={{ height: 150 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={winLossData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={2}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                              // Handle undefined values with defaults
                              const safeCx = cx || 0;
                              const safeCy = cy || 0;
                              const safeMidAngle = midAngle || 0;
                              const safeInnerRadius = innerRadius || 0;
                              const safeOuterRadius = outerRadius || 0;
                              
                              const RADIAN = Math.PI / 180;
                              const radius = safeInnerRadius + (safeOuterRadius - safeInnerRadius) * 0.5;
                              const x = safeCx + radius * Math.cos(-safeMidAngle * RADIAN);
                              const y = safeCy + radius * Math.sin(-safeMidAngle * RADIAN);
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="#fff" 
                                  textAnchor={x > safeCx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  fontSize={9}
                                  fontWeight="bold"
                                >
                                  {`${value}%`}
                                </text>
                              );
                            }}
                          >
                            {winLossData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>
            </Grid>

            {/* Impact Section */}
            <GlassCard sx={{ mb: 2 }}>
              <CardContent>
                <SectionTitle>Impact</SectionTitle>
                <Grid container spacing={2} alignItems="center">
                  {/* Circle with Matches Played */}
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: '50%',
                          border: '1.2px solid #000',
                          backgroundColor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1
                        }}
                      >
                        <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>{matches.length}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, textAlign: 'center' }}>
                        Matches<br />Played
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Impact Table */}
                  <Grid item xs={12} md={9}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: 12, fontWeight: 'bold', py: 1 }}></TableCell>
                          <TableCell align="center" sx={{ fontSize: 12, fontWeight: 'bold', py: 1 }}>Last 10</TableCell>
                          <TableCell align="center" sx={{ fontSize: 12, fontWeight: 'bold', py: 1 }}>Progress Prev 10</TableCell>
                          <TableCell align="center" sx={{ py: 1 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const { last, prev } = lastPrev10;
                          const pct = (n: number) => `${n.toFixed(1)}%`;
                          const deltaPct = (a: number, b: number) => `${(a - b).toFixed(1)}%`;
                          const deltaNum = (a: number, b: number) => `${(a - b).toFixed(1)}`;
                          return (
                            <>
                              <ImpactRow title="% Impact" value={last.impactAvg.toFixed(1)} change={deltaNum(last.impactAvg, prev.impactAvg)} up={last.impactAvg >= prev.impactAvg} />
                              <ImpactRow title="Win Rate" value={pct(last.winRate)} change={deltaPct(last.winRate, prev.winRate)} up={last.winRate >= prev.winRate} />
                              <ImpactRow title="MOTM Votes" value={`${last.motmVotes}`} change={`${last.motmVotes - prev.motmVotes}`} up={last.motmVotes >= prev.motmVotes} />
                              <ImpactRow title="Goal Diff" value={`${last.wins - last.losses}`} change={`${(last.wins - last.losses) - (prev.wins - prev.losses)}`} up={(last.wins - last.losses) >= (prev.wins - prev.losses)} />
                              <ImpactRow title="Goals + Assist" value={`${last.ga}`} change={`${last.ga - prev.ga}`} up={last.ga >= prev.ga} />
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
                {/* Guidance per spec */}
                <Box sx={{ mt: 2, border: '1px solid #e5e7eb', borderRadius: 1, p: 1.2, background: '#fafafa' }}>
                  <Typography sx={{ fontSize: 12, color: '#111827' }}>
                   {` This tracks the selected player's performance over their last 10 games using the key metrics shown in the table. It measures their progress based on the previous 10 games they played. If a player has not yet completed 10 games, it will still show the most recent games played. <b>Refer to the Key Stats</b> reference tab to understand the algorithm for each metric.`}
                  </Typography>
                </Box>

                {/* Positive messages only (max 3). If none, we keep the space compact. */}
                {positiveImpactMsgs.length > 0 && (
                  <Box sx={{ mt: 1.5, border: '1px solid #e5e7eb', borderRadius: 1, p: 1.2, background: '#fff' }}>
                    <Typography sx={{ fontSize: 12, color: '#111827' }}>
                      <b>Only display positive messages</b>; otherwise, leave the space empty and reduce the gap between sections. Limit to a maximum of 3 key positive messages. For the relevant algorithm behind each metric, refer to the <b>Key Stats</b> reference tab.
                    </Typography>
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      {positiveImpactMsgs.map((t, i) => (
                        <li key={i} style={{ fontSize: 12, color: '#111827' }}>{t}</li>
                      ))}
                    </ul>
                  </Box>
                )}
              </CardContent>
            </GlassCard>

            {/* Your Top Strengths Section */}
            <GlassCard sx={{ mb: 2 }}>
              <CardContent>
                <SectionTitle>Your Top Strengths</SectionTitle>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 12, fontWeight: 'bold', py: 1 }}></TableCell>
                      <TableCell align="center" sx={{ fontSize: 12, fontWeight: 'bold', py: 1 }}>
                        {user?.id && playerId && String(user.id) !== String(playerId) && playerName ? playerName : 'You'}
                      </TableCell>
                      {strengthComparison.show && (
                        <TableCell align="center" sx={{ fontSize: 12, fontWeight: 'bold', py: 1 }}>
                          {strengthComparison.label}
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {strengths.map((s) => {
                      // Player's per-match rate for the metric as "You"
                      const n = Math.max(matches.length, 1);
                      const youVal = (s.value / n).toFixed(2);
                      // Diff vs chosen percentile threshold using scaled percentage
                      const thresholdPct = strengthComparison.threshold * 100;
                      const pctDiff = Math.round(s.scaled - thresholdPct);
                      const diff = `${pctDiff >= 0 ? '+' : ''}${pctDiff}%`;
                      const up = pctDiff >= 0;
                      return (
                        <StrengthRow key={s.metric} title={s.metric} you={youVal} diff={diff} up={up} showComparison={strengthComparison.show} />
                      );
                    })}
                  </TableBody>
                </Table>
                {topStrengthNote && (
                  <Typography sx={{ fontSize: 13, mt: 1 }}>
                    {topStrengthNote}
                  </Typography>
                )}
              </CardContent>
            </GlassCard>

            {/* Focus Area Section */}
            <GlassCard sx={{ mb: 2 }}>
              <CardContent>
                <SectionTitle>Focus Area</SectionTitle>
                <Typography sx={{ fontSize: 13 }}>
                  {focusSuggestion}
                </Typography>
              </CardContent>
            </GlassCard>

            {/* Play Best With + Rivalries */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                You Play Best With 
                <Box 
                  component="img"
                  src="/assets/icons/shirt.png"
                  alt="shirt"
                  sx={{ width: 20, height: 20 }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                Bilal: Total points accumulated 100xp
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                Most Rivalries Against 
                <Box 
                  component="img"
                  src="/assets/icons/awayshirt.png"
                  alt="away shirt"
                  sx={{ width: 20, height: 20 }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                Zohaib: Won 55% Lost 45%
              </Typography>
            </Box>

            {/* Back Button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography
                component="button"
                onClick={() => router.push(`/player/${playerId}`)}
                sx={{
                  background: 'none',
                  border: '1px solid #ccc',
                  px: 3,
                  py: 1,
                  borderRadius: 1,
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 14,
                  '&:hover': { 
                    backgroundColor: '#f5f5f5',
                    borderColor: '#999'
                  }
                }}
              >
                Back to Player Profile
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}