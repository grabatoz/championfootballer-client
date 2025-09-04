// 'use client';

// import React, { useEffect, useMemo, useState } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   Grid,
//   CircularProgress,
//   Container,
//   Table,
//   TableHead,
//   TableBody,
//   TableRow,
//   TableCell,
//   Chip,
//   Divider,
//   LinearProgress,
//   ToggleButtonGroup,
//   ToggleButton,
//   Slider
// } from '@mui/material';
// import { useParams, useRouter } from 'next/navigation';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/lib/store';
// import { fetchPlayerStats } from '@/lib/features/playerStatsSlice';
// import dayjs from 'dayjs';
// import dynamic from 'next/dynamic';
// import { styled } from '@mui/material/styles';
// import { keyframes } from '@mui/system';
// import { Legend as RechartsLegend } from 'recharts';

// // ---------- THEME (Brand) ----------
// const themeColors = {
//   primary: '#E56A16',
//   primaryAlt: '#CF2326',
//   gradient: 'linear-gradient(135deg,#E56A16 0%,#CF2326 100%)',
//   gradientSoft: 'linear-gradient(135deg,rgba(229,106,22,0.18) 0%,rgba(207,35,38,0.18) 100%)',
//   surfaceBase: '#141416',
//   surfaceAlt: '#1d1e21',
//   surfacePanel: 'linear-gradient(140deg,#1f2023 0%,#27292d 60%)',
//   border: 'rgba(255,255,255,0.14)',
//   borderStrong: 'rgba(255,255,255,0.32)',
//   text: '#fff',
//   textDim: 'rgba(255,255,255,0.72)',
//   textFaint: 'rgba(255,255,255,0.52)',
//   success: '#15b67a',
//   warn: '#ffb300',
//   danger: '#d32f2f'
// };

// // ---------- TYPES ----------
// interface PlayerMatchStats {
//   goals?: number;
//   assists?: number;
//   cleanSheets?: number;
//   motmVotes?: number;
//   impact?: number;
//   defence?: number;
//   freeKicks?: number;
//   penalties?: number;
//   result?: 'W' | 'L' | 'D';
// }

// interface LeagueMatch {
//   id: string;
//   date: string;
//   playerStats?: PlayerMatchStats;
// }
// interface LeagueWithMatches {
//   id: string;
//   matches?: LeagueMatch[];
// }
// interface PlayerStatsData {
//   leagues?: LeagueWithMatches[];
// }

// // Row used for weekly / monthly aggregation
// interface PerformanceRow {
//   key: string;
//   label: string;
//   year: string;
//   matches: number;
//   totalPoints: number;
//   avgPoints: number;
//   cumulativePoints: number;
// }

// interface InfluenceEntry {
//   metric: string;
//   value: number;
//   scaled: number;
// }

// interface StrengthEntry extends InfluenceEntry {}

// interface RecentRow {
//   id: string;
//   date: string;
//   goals: number;
//   assists: number;
//   cleanSheets: number;
//   impact: number;
//   defence: number;
//   fk: number;
//   pens: number;
//   motm: number;
//   points: number;
//   result: string;
// }

// // ---------- DYNAMIC RECHARTS ----------
// const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
// const ComposedChart       = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
// const Bar                 = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
// const Line                = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
// const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
// const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
// const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
// const PieChart            = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
// const Pie                 = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
// const Cell                = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });
// const RadarChart          = dynamic(() => import('recharts').then(m => m.RadarChart), { ssr: false });
// const PolarGrid           = dynamic(() => import('recharts').then(m => m.PolarGrid), { ssr: false });
// const PolarAngleAxis      = dynamic(() => import('recharts').then(m => m.PolarAngleAxis), { ssr: false });
// const PolarRadiusAxis     = dynamic(() => import('recharts').then(m => m.PolarRadiusAxis), { ssr: false });
// const Radar               = dynamic(() => import('recharts').then(m => m.Radar), { ssr: false });
// const Scatter             = dynamic(() => import('recharts').then(m => m.Scatter), { ssr: false }) as any; // cast to any to relax TS

// // Background gradient
// const BG_GRAD = 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)';

// // ---------- ANIMATIONS / STYLES ----------
// const floatIn = keyframes`
//   0% { opacity:0; transform:translateY(14px) scale(.985); }
//   60% { opacity:1; transform:translateY(-2px) scale(1); }
//   100% { opacity:1; transform:translateY(0) scale(1); }
// `;

// const GlassCard = styled(Paper)(() => ({
//   background: 'linear-gradient(130deg, rgba(40,41,45,0.72) 0%, rgba(24,24,28,0.92) 100%)',
//   backdropFilter: 'blur(14px) saturate(140%)',
//   WebkitBackdropFilter: 'blur(14px) saturate(140%)',
//   border: `1px solid ${themeColors.border}`,
//   borderRadius: 22,
//   position: 'relative',
//   overflow: 'hidden',
//   boxShadow: '0 12px 38px -10px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.35)',
//   animation: `${floatIn} .55s ease`,
//   transition: 'border-color .35s, box-shadow .35s, transform .35s',
//   '&:before': {
//     content: '""',
//     position: 'absolute',
//     inset: 0,
//     background: 'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12), transparent 68%)',
//     pointerEvents: 'none'
//   },
//   '&:after': {
//     content: '""',
//     position: 'absolute',
//     inset: 0,
//     background: 'linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 55%)',
//     pointerEvents: 'none'
//   },
//   '&:hover': {
//     borderColor: themeColors.borderStrong,
//     boxShadow: '0 18px 46px -10px rgba(0,0,0,0.75)',
//     transform: 'translateY(-4px)'
//   }
// }));

// const SectionTitle = styled(Typography)(() => ({
//   fontWeight: 800,
//   letterSpacing: .6,
//   fontSize: 13,
//   color: themeColors.text,
//   textTransform: 'uppercase'
// }));

// // ---------- HELPERS ----------
// function calcPoints(ps: PlayerMatchStats | undefined): number {
//   if (!ps) return 0;
//   return (ps.goals || 0) * 4
//     + (ps.assists || 0) * 3
//     + (ps.cleanSheets || 0) * 3
//     + (ps.motmVotes || 0) * 2
//     + (ps.impact || 0)
//     + (ps.defence || 0)
//     + (ps.freeKicks || 0) * 2
//     + (ps.penalties || 0) * 2;
// }

// function weekKey(dateStr: string): string {
//   const d = dayjs(dateStr);
//   return d.startOf('week').format('YYYY-MM-DD');
// }

// // ---------- COMPONENT ----------
// export default function CareerPage() {
//   const params = useParams();
//   const router = useRouter();
//   const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
//   const dispatch = useDispatch<AppDispatch>();
//   const { data: rawData, filters } = useSelector((s: RootState) => s.playerStats);
//   // Normalize null -> undefined to match internal typing expectations
//   const data: PlayerStatsData | undefined = rawData ?? undefined;

//   const loading = !data;

//   useEffect(() => {
//     if (playerId) {
//       dispatch(fetchPlayerStats({ playerId, leagueId: filters.leagueId, year: filters.year }));
//     }
//   }, [playerId, dispatch, filters.leagueId, filters.year]);

//   const matches: LeagueMatch[] = useMemo(() => {
//     const d: PlayerStatsData | undefined = data;
//     return (d?.leagues || [])
//       .flatMap((l: LeagueWithMatches) => l.matches || [])
//       .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
//   }, [data]);

//   // ------------- NEW STATE (grouping + range) -------------
//   const [groupMode, setGroupMode] = useState<'auto'|'weekly'|'monthly'>('auto');
//   const [range, setRange] = useState<number[] | null>(null); // [startIdx, endIdx]

//   // ------------- AGGREGATION (supports forced modes) -------------
//   const { performanceData, groupingType, periodKeyFn } = useMemo(() => {
//     if (!matches.length) {
//       return {
//         performanceData: [] as PerformanceRow[],
//         groupingType: 'weekly' as const,
//         periodKeyFn: (d: string) => dayjs(d).startOf('week').format('YYYY-MM-DD')
//       };
//     }

//     const buildWeekly = (): PerformanceRow[] => {
//       const map = new Map<string, PerformanceRow>();
//       matches.forEach(m => {
//         const weekStart = dayjs(m.date).startOf('week');
//         const key = weekStart.format('YYYY-MM-DD');
//         if (!map.has(key)) {
//           map.set(key, {
//             key,
//             label: weekStart.format('DD-MMM'),
//             year: weekStart.format('YYYY'),
//             matches: 0,
//             totalPoints: 0,
//             avgPoints: 0,
//             cumulativePoints: 0
//           });
//         }
//         const r = map.get(key)!;
//         r.matches++;
//         r.totalPoints += calcPoints(m.playerStats);
//       });

//       // Fill gaps
//       const keys = Array.from(map.keys()).sort();
//       const filled: PerformanceRow[] = [];
//       if (keys.length) {
//         let cur = dayjs(keys[0]);
//         const end = dayjs(keys[keys.length - 1]);
//         while (cur.isBefore(end) || cur.isSame(end)) {
//           const k = cur.format('YYYY-MM-DD');
//             if (!map.has(k)) {
//               map.set(k, {
//                 key: k,
//                 label: cur.format('DD-MMM'),
//                 year: cur.format('YYYY'),
//                 matches: 0,
//                 totalPoints: 0,
//                 avgPoints: 0,
//                 cumulativePoints: 0
//               });
//             }
//             filled.push(map.get(k)!);
//             cur = cur.add(1,'week');
//         }
//       }
//       filled.sort((a,b)=>a.key.localeCompare(b.key));
//       filled.forEach(r => { r.avgPoints = r.matches ? +(r.totalPoints / r.matches).toFixed(2) : 0; });
//       let run = 0;
//       filled.forEach(r => { run += r.totalPoints; r.cumulativePoints = run; });
//       return filled;
//     };

//     const buildMonthly = (): PerformanceRow[] => {
//       const map = new Map<string, PerformanceRow>();
//       matches.forEach(m => {
//         const monthStart = dayjs(m.date).startOf('month');
//         const key = monthStart.format('YYYY-MM');
//         if (!map.has(key)) {
//           map.set(key, {
//             key,
//             label: monthStart.format('MMM'),
//             year: monthStart.format('YYYY'),
//             matches: 0,
//             totalPoints: 0,
//             avgPoints: 0,
//             cumulativePoints: 0
//           });
//         }
//         const r = map.get(key)!;
//         r.matches++;
//         r.totalPoints += calcPoints(m.playerStats);
//       });

//       // Fill missing months
//       const keys = Array.from(map.keys()).sort();
//       const filled: PerformanceRow[] = [];
//       if (keys.length) {
//         let cur = dayjs(keys[0]+'-01');
//         const end = dayjs(keys[keys.length - 1]+'-01');
//         while (cur.isBefore(end) || cur.isSame(end)) {
//           const k = cur.format('YYYY-MM');
//           if (!map.has(k)) {
//             map.set(k, {
//               key: k,
//               label: cur.format('MMM'),
//               year: cur.format('YYYY'),
//               matches: 0,
//               totalPoints: 0,
//               avgPoints: 0,
//               cumulativePoints: 0
//             });
//           }
//           filled.push(map.get(k)!);
//           cur = cur.add(1,'month');
//         }
//       }
//       filled.sort((a,b)=>a.key.localeCompare(b.key));
//       let run = 0;
//       filled.forEach(r => {
//         r.avgPoints = r.matches ? +(r.totalPoints / r.matches).toFixed(2) : 0;
//         run += r.totalPoints;
//         r.cumulativePoints = run;
//       });
//       return filled;
//     };

//     let mode: 'weekly' | 'monthly';
//     if (groupMode === 'weekly') mode = 'weekly';
//     else if (groupMode === 'monthly') mode = 'monthly';
//     else {
//       // auto
//       const weekly = buildWeekly();
//       if (weekly.length < 26) {
//         return {
//           performanceData: weekly,
//           groupingType: 'weekly' as const,
//           periodKeyFn: (d: string) => dayjs(d).startOf('week').format('YYYY-MM-DD')
//         };
//       }
//       mode = 'monthly';
//     }

//     if (mode === 'weekly') {
//       return {
//         performanceData: buildWeekly(),
//         groupingType: 'weekly' as const,
//         periodKeyFn: (d: string) => dayjs(d).startOf('week').format('YYYY-MM-DD')
//       };
//     }
//     const monthly = buildMonthly();
//     return {
//       performanceData: monthly,
//       groupingType: 'monthly' as const,
//       periodKeyFn: (d: string) => dayjs(d).startOf('month').format('YYYY-MM')
//     };
//   }, [matches, groupMode]);

//   // ------------- RAW MATCH SCATTER DATA -------------
//   const performanceIndexByKey = useMemo(() => {
//     const map: Record<string, PerformanceRow> = {};
//     performanceData.forEach(p => { map[p.key] = p; });
//     return map;
//   }, [performanceData]);

//   interface ScatterPoint {
//     key: string;
//     label: string;       // must match XAxis dataKey ("label") so it aligns
//     year: string;
//     matchPoints: number;
//   }

//   const scatterPoints: ScatterPoint[] = useMemo(() => {
//     if (!performanceData.length) return [];
//     return matches.map(m => {
//       const periodKey = periodKeyFn(m.date);
//       const period = performanceIndexByKey[periodKey];
//       if (period) {
//         return {
//           key: periodKey,
//           label: period.label,
//           year: period.year,
//           matchPoints: calcPoints(m.playerStats)
//         };
//       }
//       // Fallback (should rarely happen if periods filled)
//       const d = dayjs(m.date);
//       return {
//         key: periodKey,
//         label: d.format(groupingType === 'weekly' ? 'DD-MMM' : 'MMM'),
//         year: d.format('YYYY'),
//         matchPoints: calcPoints(m.playerStats)
//       };
//     });
//   }, [matches, performanceData, periodKeyFn, performanceIndexByKey, groupingType]);

//   // ------------- RANGE FILTER -------------
//   const chartData = useMemo(() => {
//     if (!performanceData.length) return [];
//     if (!range) return performanceData;
//     const [s,e] = range;
//     return performanceData.slice(s, e+1);
//   }, [performanceData, range]);

//   const scatterFiltered = useMemo(() => {
//     if (!scatterPoints.length) return [];
//     if (!range) return scatterPoints;
//     const [s,e] = range;
//     const allowedKeys = new Set(performanceData.slice(s,e+1).map(p=>p.key));
//     return scatterPoints.filter(sp => allowedKeys.has(sp.key));
//   }, [scatterPoints, range, performanceData]);

//   // Reset range if data length changes
//   useEffect(() => {
//     setRange(null);
//   }, [groupingType]);

//   const wld = useMemo(() => {
//     let W = 0, L = 0, D = 0;
//     matches.forEach(m => {
//       const r = m.playerStats?.result;
//       if (r === 'W') W++; else if (r === 'L') L++; else if (r === 'D') D++;
//     });
//     return { W, L, D };
//   }, [matches]);

//   const influence: InfluenceEntry[] = useMemo(() => {
//     const total: Record<string, number> = {
//       Goals: 0,
//       Assists: 0,
//       'Clean Sheets': 0,
//       Impact: 0,
//       Defence: 0,
//       'Free Kicks': 0,
//       Penalties: 0,
//       'MOTM Votes': 0
//     };
//     matches.forEach(m => {
//       const ps = m.playerStats || {};
//       total.Goals += ps.goals || 0;
//       total.Assists += ps.assists || 0;
//       total['Clean Sheets'] += ps.cleanSheets || 0;
//       total.Impact += ps.impact || 0;
//       total.Defence += ps.defence || 0;
//       total['Free Kicks'] += ps.freeKicks || 0;
//       total.Penalties += ps.penalties || 0;
//       total['MOTM Votes'] += ps.motmVotes || 0;
//     });
//     const maxVal = Math.max(...Object.values(total), 1);
//     return Object.entries(total).map(([metric, value]) => ({
//       metric,
//       value,
//       scaled: Math.round((value / maxVal) * 100)
//     }));
//   }, [matches]);

//   const strengths: StrengthEntry[] = useMemo(
//     () => [...influence].filter(i => i.scaled > 25).sort((a, b) => b.scaled - a.scaled).slice(0, 3),
//     [influence]
//   );

//   const recent: RecentRow[] = useMemo(() => {
//     return [...matches].slice(-10).reverse().map(m => {
//       const ps = m.playerStats || {};
//       return {
//         id: m.id,
//         date: dayjs(m.date).format('DD MMM'),
//         goals: ps.goals || 0,
//         assists: ps.assists || 0,
//         cleanSheets: ps.cleanSheets || 0,
//         impact: ps.impact || 0,
//         defence: ps.defence || 0,
//         fk: ps.freeKicks || 0,
//         pens: ps.penalties || 0,
//         motm: ps.motmVotes || 0,
//         points: calcPoints(ps),
//         result: ps.result || '-'
//       };
//     });
//   }, [matches]);

//   const recentAverages = useMemo(() => {
//     if (!recent.length) return null;
//     const agg = recent.reduce((a, r) => {
//       a.goals += r.goals;
//       a.assists += r.assists;
//       a.cleanSheets += r.cleanSheets;
//       a.impact += r.impact;
//       a.defence += r.defence;
//       a.fk += r.fk;
//       a.pens += r.pens;
//       a.motm += r.motm;
//       a.points += r.points;
//       return a;
//     }, { goals:0, assists:0, cleanSheets:0, impact:0, defence:0, fk:0, pens:0, motm:0, points:0 });
//     const d = recent.length;
//     return {
//       goals: +(agg.goals/d).toFixed(2),
//       assists: +(agg.assists/d).toFixed(2),
//       cleanSheets: +(agg.cleanSheets/d).toFixed(2),
//       impact: +(agg.impact/d).toFixed(2),
//       defence: +(agg.defence/d).toFixed(2),
//       fk: +(agg.fk/d).toFixed(2),
//       pens: +(agg.pens/d).toFixed(2),
//       motm: +(agg.motm/d).toFixed(2),
//       points: +(agg.points/d).toFixed(2),
//     };
//   }, [recent]);

//   const careerTotals = useMemo(() => {
//     const totalMatches = matches.length;
//     const totalPoints = matches.reduce((s,m)=> s + calcPoints(m.playerStats),0);
//     return {
//       totalMatches,
//       totalPoints,
//       avgPerMatch: totalMatches ? +(totalPoints/totalMatches).toFixed(2) : 0
//     };
//   }, [matches]);

//   const insights: string[] = useMemo(() => {
//     const lines: string[] = [];
//     if (performanceData.length) {
//       const best = [...performanceData].sort((a, b) => b.avgPoints - a.avgPoints)[0];
//       lines.push(`Peak ${groupingType === 'weekly' ? 'Week' : 'Month'}: ${best.label} ${best.year} (Avg ${best.avgPoints}).`);
//     }
//     if (performanceData.length > 1) {
//       const last3 = performanceData.slice(-3);
//       if (last3.length === 3) {
//         const trend = last3.map(r => r.avgPoints);
//         const dir = trend[2] > trend[0] ? 'rising' : trend[2] < trend[0] ? 'declining' : 'flat';
//         lines.push(`Form Trend: ${dir} (${trend.map(t => t.toFixed(2)).join(' → ')}).`);
//       }
//     }
//     if (matches.length) {
//       const totalPoints = matches.reduce((s,m)=> s + calcPoints(m.playerStats),0);
//       lines.push(`Career Avg Points/Match: ${(totalPoints / matches.length).toFixed(2)} over ${matches.length} matches.`);
//     }
//     const winTotal = wld.W + wld.L + wld.D;
//     if (winTotal) {
//       lines.push(`Win Rate: ${((wld.W / winTotal) * 100).toFixed(1)}% (W${wld.W}/D${wld.D}/L${wld.L}).`);
//     }
//     if (strengths.length) {
//       lines.push(`Key Strength: ${strengths[0].metric} (raw ${strengths[0].value}).`);
//     }
//     if (!lines.length) lines.push('Not enough data for insights.');
//     return lines;
//   }, [performanceData, groupingType, matches, wld, strengths]);

//   const formBadge = useMemo(() => {
//     if (!performanceData.length) return 'No Data';
//     const last = performanceData.slice(-5);
//     const avg = last.reduce((s, r) => s + r.avgPoints, 0) / last.length;
//     if (avg >= 25) return 'On Fire';
//     if (avg >= 15) return 'Hot Form';
//     if (avg >= 8) return 'Solid';
//     return 'Needs Spark';
//   }, [performanceData]);

//   // Attempt to extract a name from the stats slice (adjust keys if your slice stores differently)
//   const playerNameFromStats = useMemo(() => {
//     const anyData = data as any;
//     return (
//       anyData?.playerName ||
//       anyData?.player?.name ||
//       anyData?.profile?.name ||
//       '' // fallback
//     );
//   }, [data]);

//   const [playerName, setPlayerName] = useState<string>('');

//   // If stats already contain a name, use it
//   useEffect(() => {
//     if (playerNameFromStats && !playerName) {
//       setPlayerName(playerNameFromStats);
//     }
//   }, [playerNameFromStats, playerName]);

//   // Fallback fetch if name not in stats
//   useEffect(() => {
//     if (!playerId) return;
//     if (playerNameFromStats) return; // already have
//     let aborted = false;

//     (async () => {
//       try {
//         const res = await fetch(`/api/players/${playerId}`, { cache: 'no-store' });
//         if (!res.ok) {
//           console.warn('Player name fetch failed:', res.status, res.statusText);
//           return;
//         }
//         const j = await res.json();
//         const fetchedName =
//           j?.name ||
//           j?.player?.name ||
//           j?.data?.name ||
//           '';
//         if (!aborted && fetchedName) setPlayerName(fetchedName);
//       } catch (e) {
//         console.warn('Player name fetch error:', e);
//       }
//     })();

//     return () => { aborted = true; };
//   }, [playerId, playerNameFromStats]);

//   return (
//     <Container
//       maxWidth="xl"
//       sx={{
//         py: 5,
//         minHeight: '100vh',
//       }}
//     >
//       <Box
//         sx={{
//           maxWidth: '1500px',
//           mx: 'auto',
//           background: BG_GRAD,
//           borderRadius: 6,
//           p: { xs: 2, md: 3, lg: 4 },
//           boxShadow: '0 14px 60px -18px rgba(0,0,0,0.55), 0 4px 18px -4px rgba(0,0,0,0.4)',
//           border: `1px solid ${themeColors.border}`
//         }}
//       >
//         <Typography
//           variant="h5"
//           sx={{
//             fontWeight: 900,
//             color: themeColors.text,
//             mb: 3,
//             textAlign: 'center',
//             letterSpacing: .75,
//             background: themeColors.gradient,
//             WebkitBackgroundClip: 'text',
//           }}
//         >
//           {playerName
//             ? `${playerName} Performance Dashboard`
//             : 'Performance Dashboard'}
//         </Typography>

//         {loading ? (
//           <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
//         ) : (
//           <Box>

//             <Grid container spacing={2}>
//               {/* Performance Over Time */}
//               <Grid item xs={12} lg={8}>
//                 <GlassCard
//                   sx={{
//                     p:0,
//                     height:{ xs:500, md:480 },
//                     display:'flex',
//                     flexDirection:'column',
//                     borderRadius:4,
//                     background:'linear-gradient(90deg,#767676 0%,#000000 100%)',
//                     overflow:'hidden',
//                     position:'relative',
//                     border:'none'
//                   }}
//                 >
//                   {/* Controls Row */}
//                   <Box
//                     sx={{
//                       position:'absolute',
//                       top:6,
//                       left:56,
//                       right:56,
//                       display:'flex',
//                       alignItems:'center',
//                       gap:2,
//                       zIndex:5
//                     }}
//                   >
//                     <ToggleButtonGroup
//                       size="small"
//                       exclusive
//                       value={groupMode}
//                       onChange={(_,val)=> val && setGroupMode(val)}
//                       sx={{
//                         background:'rgba(255,255,255,0.08)',
//                         borderRadius:2,
//                         '& .MuiToggleButton-root': {
//                           color:'#fff',
//                           fontSize:11,
//                           px:1.4,
//                           borderColor:'rgba(255,255,255,0.2)'
//                         },
//                         '& .Mui-selected': {
//                           background:themeColors.gradient,
//                           color:'#fff',
//                           fontWeight:700
//                         }
//                       }}
//                     >
//                       <ToggleButton value="auto">Auto</ToggleButton>
//                       <ToggleButton value="weekly">Weekly</ToggleButton>
//                       <ToggleButton value="monthly">Monthly</ToggleButton>
//                     </ToggleButtonGroup>
//                     <Box sx={{ ml:'auto', display:'flex', alignItems:'center', gap:1 }}>
//                       <Typography sx={{ fontSize:10, color:'#eee' }}>Range</Typography>
//                       <Box sx={{ width:160 }}>
//                         <Slider
//                           size="small"
//                           value={range || [0, Math.max(0, performanceData.length-1)]}
//                           min={0}
//                           max={Math.max(0, performanceData.length-1)}
//                           onChange={(_,val)=> Array.isArray(val) && setRange(val as number[])}
//                           valueLabelDisplay="auto"
//                           sx={{
//                             '& .MuiSlider-thumb':{ boxShadow:'0 0 0 2px #000' },
//                             '& .MuiSlider-track':{ background:themeColors.gradient },
//                             '& .MuiSlider-rail':{ opacity:.3 }
//                           }}
//                         />
//                       </Box>
//                     </Box>
//                   </Box>

//                   {/* Left / Right ribbons (unchanged) */}
//                   <Box sx={{ position:'absolute', top:22, bottom:22, left:10, width:38, background:themeColors.gradient, color:'#fff', borderRadius:'8px 0 0 8px', display:'flex', alignItems:'center', justifyContent:'center', writingMode:'vertical-rl', transform:'rotate(180deg)', fontSize:11, fontWeight:700, letterSpacing:.5, zIndex:3 }}>
//                     Average XP Points
//                   </Box>
//                   <Box sx={{ position:'absolute', top:22, bottom:22, right:10, width:44, background:themeColors.primaryAlt, color:'#fff', borderRadius:'0 8px 8px 0', display:'flex', alignItems:'center', justifyContent:'center', writingMode:'vertical-rl', transform:'rotate(180deg)', fontSize:11, fontWeight:700, letterSpacing:.5, zIndex:3 }}>
//                     Accumulative XP Points
//                   </Box>

//                   {/* Chart */}
//                   <Box sx={{ position:'relative', zIndex:4, flex:1, minHeight:0, px:6, pt:4, pb:1 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                       <ComposedChart
//                         data={chartData}
//                         margin={{ top: 10, left: 10, right: 10, bottom: 28 }}
//                       >
//                         <XAxis
//                           dataKey="label"
//                           stroke="#999"
//                           tick={{ fontSize:11, fill:'#444' }}
//                           interval={0}
//                           tickLine={{ stroke:'#ccc' }}
//                           axisLine={{ stroke:'#ccc' }}
//                         />
//                         <YAxis
//                           yAxisId="avg"
//                           stroke="#888"
//                           tick={{ fontSize:11, fill:'#333' }}
//                           width={42}
//                           tickLine={{ stroke:'#ddd' }}
//                           axisLine={{ stroke:'#ccc' }}
//                         />
//                         <YAxis
//                           yAxisId="cum"
//                           orientation="right"
//                           stroke="#888"
//                           tick={{ fontSize:11, fill:'#333' }}
//                           width={54}
//                           tickLine={{ stroke:'#ddd' }}
//                           axisLine={{ stroke:'#ccc' }}
//                         />
//                         <Tooltip
//                           contentStyle={{
//                             background:'#ffffff',
//                             border:'1px solid rgba(0,0,0,0.15)',
//                             fontSize:11,
//                             borderRadius:6,
//                             boxShadow:'0 4px 12px rgba(0,0,0,0.12)'
//                           }}
//                           labelStyle={{ fontWeight:700, color:'#222' }}
//                           formatter={(value: any, _name: any, item: any) => {
//                             const key = item?.dataKey;
//                             if (key === 'avgPoints')        return [value, `Avg (${groupingType==='weekly'?'Week':'Month'})`];
//                             if (key === 'cumulativePoints') return [value, 'Cumulative XP'];
//                             if (key === 'matchPoints')      return [value, 'Match Points'];
//                             return [value, key || 'Value'];
//                           }}
//                           labelFormatter={(label: string, payload: any[]) => {
//                             // Find a payload entry with a year (line / scatter share same x)
//                             const withYear = payload?.find(p => p.payload?.year);
//                             const yr = withYear?.payload?.year ? ` ${withYear.payload.year}` : '';
//                             return `${label}${yr}`;
//                           }}
//                         />
//                         <Line
//                           yAxisId="avg"
//                           type="monotone"
//                           dataKey="avgPoints"
//                           name={`Avg (${groupingType==='weekly'?'Week':'Month'})`}
//                           stroke={themeColors.primary}
//                           strokeWidth={3}
//                           dot={{ r:3, stroke:'#fff', strokeWidth:1.2, fill:themeColors.primary }}
//                           activeDot={{ r:6, stroke:'#000', strokeWidth:1, fill:themeColors.primary }}
//                         />
//                         <Line
//                           yAxisId="cum"
//                           type="monotone"
//                           dataKey="cumulativePoints"
//                           name="Cumulative"
//                           stroke={themeColors.primaryAlt}
//                           strokeWidth={3}
//                           dot={{ r:3, stroke:'#fff', strokeWidth:1.2, fill:themeColors.primaryAlt }}
//                           activeDot={{ r:6, stroke:'#000', strokeWidth:1, fill:themeColors.primaryAlt }}
//                         />
//                         <Scatter
//                           data={scatterFiltered as any}
//                           yAxisId="avg"
//                           fill="#4b9fff"
//                           dataKey="matchPoints"
//                           name="Match Points"
//                         />
//                         <defs>
//                           <linearGradient id="avgGradBrand" x1="0" x2="0" y1="0" y2="1">
//                             <stop offset="0%" stopColor={themeColors.primary} />
//                             <stop offset="100%" stopColor={themeColors.primaryAlt} />
//                           </linearGradient>
//                         </defs>
//                       </ComposedChart>
//                     </ResponsiveContainer>
//                   </Box>

//                   {/* Legend */}
//                   <Box sx={{ position:'relative', zIndex:4, display:'flex', justifyContent:'center', flexWrap:'wrap', gap:3, pb:1.5, mt:.5 }}>
//                     <Box sx={{ display:'flex', alignItems:'center', gap:.6 }}>
//                       <Box sx={{ width:16, height:6, borderRadius:2, background:themeColors.primary }} />
//                       <Typography sx={{ fontSize:11, color:themeColors.textDim, fontWeight:600 }}>Avg / {groupingType==='weekly'?'Week':'Month'}</Typography>
//                     </Box>
//                     <Box sx={{ display:'flex', alignItems:'center', gap:.6 }}>
//                       <Box sx={{ width:16, height:6, borderRadius:2, background:themeColors.primaryAlt }} />
//                       <Typography sx={{ fontSize:11, color:themeColors.textDim, fontWeight:600 }}>Cumulative XP</Typography>
//                     </Box>
//                     <Box sx={{ display:'flex', alignItems:'center', gap:.6 }}>
//                       <Box sx={{ width:10, height:10, borderRadius:'50%', background:'#4b9fff' }} />
//                       <Typography sx={{ fontSize:11, color:themeColors.textDim, fontWeight:600 }}>Match Points</Typography>
//                     </Box>
//                   </Box>
//                 </GlassCard>
//               </Grid>
//               {/* Win/Loss + Radar (unchanged below) */}
//               <Grid item xs={12} lg={4} container spacing={2}>
//                 <Grid item xs={12} md={6} lg={12}>
//                   <GlassCard
//                     sx={{
//                       p:2,
//                       height:190,
//                       display:'flex',
//                       flexDirection:'column',
//                       background: 'linear-gradient(90deg, #767676 0%, #000000 100%)'
//                     }}
//                   >
//                     <SectionTitle sx={{ mb: .5 }}>Win / Loss</SectionTitle>
//                     <Box sx={{ flex:1 }}>
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Tooltip contentStyle={{ background:'#161616', border:`1px solid ${themeColors.border}`, fontSize:11 }}/>
//                           <Pie
//                             data={[
//                               { name:'Wins', value:wld.W },
//                               { name:'Draws', value:wld.D },
//                               { name:'Losses', value:wld.L }
//                             ]}
//                             dataKey="value"
//                             innerRadius={35}
//                             outerRadius={55}
//                             paddingAngle={2}
//                           >
//                             <Cell fill="url(#winGrad)"/>
//                             <Cell fill="#ffca28"/>
//                             <Cell fill="#d32f2f"/>
//                           </Pie>
//                           <defs>
//                             <linearGradient id="winGrad" x1="0" x2="1" y1="0" y2="1">
//                               <stop offset="0%" stopColor="#E56A16"/>
//                               <stop offset="100%" stopColor="#CF2326"/>
//                             </linearGradient>
//                           </defs>
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </Box>
//                     <Box sx={{ display:'flex', gap:1, justifyContent:'center', mb:0.5 }}>
//                       <Chip size="small" label={`W ${wld.W}`} sx={{ background:themeColors.gradient, color:'#fff', fontWeight:700 }} />
//                       <Chip size="small" label={`D ${wld.D}`} sx={{ bgcolor:'#ffca28', color:'#000', fontWeight:700 }} />
//                       <Chip size="small" label={`L ${wld.L}`} sx={{ bgcolor:themeColors.danger, color:'#fff', fontWeight:700 }} />
//                     </Box>
//                   </GlassCard>
//                 </Grid>
//                 <Grid item xs={12} md={6} lg={12}>
//                   <GlassCard
//                     sx={{
//                       p:2,
//                       height:190,
//                       display:'flex',
//                       flexDirection:'column',
//                       background: 'linear-gradient(90deg, #767676 0%, #000000 100%)'
//                     }}
//                   >
//                     <SectionTitle sx={{ mb:.5 }}>Influence (Radar)</SectionTitle>
//                     <Box sx={{ flex:1 }}>
//                       <ResponsiveContainer width="100%" height="100%">
//                         <RadarChart data={influence}>
//                           <PolarGrid stroke="#555"/>
//                           <PolarAngleAxis
//                             dataKey="metric"
//                             tick={{ fill:'#fff', fontSize:9 }}
//                             scale="point"
//                             reversed={false}
//                           />
//                           <PolarRadiusAxis stroke="#777" tick={{ fill:'#ccc', fontSize:9 }}/>
//                           <Radar name="Raw" dataKey="value" stroke="#E56A16" fill="#E56A16" fillOpacity={0.32}/>
//                           <Radar name="Scaled" dataKey="scaled" stroke="#CF2326" fill="#CF2326" fillOpacity={0.18}/>
//                           <Tooltip contentStyle={{ background:'#161616', border:`1px solid ${themeColors.border}`, fontSize:11 }}/>
//                         </RadarChart>
//                       </ResponsiveContainer>
//                     </Box>
//                   </GlassCard>
//                 </Grid>
//               </Grid>
//             </Grid>

//             {/* Impact Table */}
//             <Grid container spacing={2} sx={{ mt:2 }}>
//               <Grid item xs={12} lg={8}>
//                 <GlassCard
//                   sx={{
//                     p:2.2,
//                     background: 'linear-gradient(90deg, #767676 0%, #000000 100%)'
//                   }}
//                 >
//                   <SectionTitle sx={{ mb:.75 }}>Impact (Last {recent.length || 0} Matches)</SectionTitle>
//                   <Typography sx={{ fontSize:11, color:themeColors.textFaint, mb:1 }}>
//                     Recent match contributions. Average row included.
//                   </Typography>
//                   <Box sx={{ overflowX:'auto' }}>
//                     <Table size="small" sx={{
//                       minWidth:860,
//                       '& th,& td':{ borderColor:themeColors.border, color:themeColors.text },
//                       '& tbody tr:hover': {
//                         background:'rgba(255,255,255,0.06)'
//                       }
//                     }}>
//                       <TableHead>
//                         <TableRow>
//                           <TableCell>Date</TableCell>
//                           <TableCell align="right">G</TableCell>
//                           <TableCell align="right">A</TableCell>
//                           <TableCell align="right">CS</TableCell>
//                           <TableCell align="right">Impact</TableCell>
//                           <TableCell align="right">Def</TableCell>
//                           <TableCell align="right">FK</TableCell>
//                           <TableCell align="right">Pen</TableCell>
//                           <TableCell align="right">MOTM</TableCell>
//                           <TableCell align="right">Pts</TableCell>
//                           <TableCell align="center">Res</TableCell>
//                         </TableRow>
//                       </TableHead>
//                       <TableBody>
//                         {recent.map(r => (
//                           <TableRow key={r.id}>
//                             <TableCell>{r.date}</TableCell>
//                             <TableCell align="right">{r.goals}</TableCell>
//                             <TableCell align="right">{r.assists}</TableCell>
//                             <TableCell align="right">{r.cleanSheets}</TableCell>
//                             <TableCell align="right">{r.impact}</TableCell>
//                             <TableCell align="right">{r.defence}</TableCell>
//                             <TableCell align="right">{r.fk}</TableCell>
//                             <TableCell align="right">{r.pens}</TableCell>
//                             <TableCell align="right">{r.motm}</TableCell>
//                             <TableCell align="right" style={{ fontWeight:600, color:themeColors.primaryAlt }}>{r.points}</TableCell>
//                             <TableCell align="center">
//                               <Chip
//                                 size="small"
//                                 label={r.result}
//                                 sx={{
//                                   height:20,
//                                   background:
//                                     r.result === 'W' ? themeColors.gradient :
//                                     r.result === 'L' ? themeColors.danger :
//                                     r.result === 'D' ? themeColors.warn : '#555',
//                                   color: r.result === 'D' ? '#000' : '#fff',
//                                   fontWeight:700
//                                 }}
//                               />
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                         {!recent.length && (
//                           <TableRow>
//                             <TableCell colSpan={11} align="center" sx={{ color:themeColors.textDim }}>
//                               No recent match data.
//                             </TableCell>
//                           </TableRow>
//                         )}
//                         {recentAverages && (
//                           <TableRow>
//                             <TableCell sx={{ fontWeight:700 }}>Avg</TableCell>
//                             <TableCell align="right">{recentAverages.goals}</TableCell>
//                             <TableCell align="right">{recentAverages.assists}</TableCell>
//                             <TableCell align="right">{recentAverages.cleanSheets}</TableCell>
//                             <TableCell align="right">{recentAverages.impact}</TableCell>
//                             <TableCell align="right">{recentAverages.defence}</TableCell>
//                             <TableCell align="right">{recentAverages.fk}</TableCell>
//                             <TableCell align="right">{recentAverages.pens}</TableCell>
//                             <TableCell align="right">{recentAverages.motm}</TableCell>
//                             <TableCell align="right" sx={{ fontWeight:700, color:themeColors.primary }}>{recentAverages.points}</TableCell>
//                             <TableCell />
//                           </TableRow>
//                         )}
//                       </TableBody>
//                     </Table>
//                   </Box>
//                 </GlassCard>
//               </Grid>

//               {/* Strengths & Form Summary */}
//               <Grid item xs={12} lg={4} container spacing={2}>
//                 <Grid item xs={12}>
//                   <GlassCard
//                     sx={{
//                       p:2.2,
//                       background: 'linear-gradient(90deg, #767676 0%, #000000 100%)'
//                     }}
//                   >
//                     <SectionTitle sx={{ mb:1 }}>Top Strengths</SectionTitle>
//                     {strengths.length === 0 && (
//                       <Typography sx={{ color:'rgba(255,255,255,0.65)', fontSize:12 }}>
//                         Not enough data to determine strengths.
//                       </Typography>
//                     )}
//                     {strengths.map(s => (
//                       <Box key={s.metric} sx={{ mb:1.5 }}>
//                         <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.2 }}>
//                           <Typography sx={{ color:'#fff', fontSize:12, fontWeight:700 }}>{s.metric}</Typography>
//                           <Typography sx={{ color:'#E56A16', fontSize:12, fontWeight:800 }}>{s.value}</Typography>
//                         </Box>
//                         <LinearProgress
//                           variant="determinate"
//                           value={s.scaled}
//                           sx={{
//                             height:10,
//                             borderRadius:5,
//                             background:'rgba(255,255,255,0.12)',
//                             '& .MuiLinearProgress-bar': {
//                               background:'linear-gradient(90deg,#E56A16,#CF2326)'
//                             }
//                           }}
//                         />
//                       </Box>
//                     ))}
//                   </GlassCard>
//                 </Grid>
//                 <Grid item xs={12}>
//                   <GlassCard
//                     sx={{
//                       p:2.2,
//                       height:'100%',
//                       background: 'linear-gradient(90deg, #767676 0%, #000000 100%)'
//                     }}
//                   >
//                     <SectionTitle sx={{ mb:1 }}>Form & Insights</SectionTitle>
//                     <Box component="ul" sx={{ pl:3, m:0 }}>
//                       {insights.map((line,i)=>(
//                         <Typography key={i} component="li" sx={{ color:'rgba(255,255,255,0.85)', fontSize:12, mb:0.5 }}>
//                           {line}
//                         </Typography>
//                       ))}
//                     </Box>
//                     <Divider sx={{ my:1.5, borderColor:'rgba(255,255,255,0.15)' }}/>
//                     <Typography sx={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>
//                       Insights auto-generated from recent & career data.
//                     </Typography>
//                   </GlassCard>
//                 </Grid>
//               </Grid>
//             </Grid>

//             {/* Back Button */}
//             <Box
//               sx={{
//                 mt:4,
//                 textAlign:'center',
//                 background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
//                 py:2,
//                 borderRadius:3
//               }}
//             >
//               <Typography
//                 component="button"
//                 onClick={() => router.push(`/player/${playerId}`)}
//                 sx={{
//                   background:'none',
//                   border:`1px solid rgba(255,255,255,0.4)`,
//                   px:3,
//                   py:1,
//                   borderRadius:2,
//                   color:'#fff',
//                   fontWeight:700,
//                   cursor:'pointer',
//                   transition:'.2s',
//                   '&:hover': { background:'rgba(255,255,255,0.15)' }
//                 }}
//               >
//                 Back to Player Profile
//               </Typography>
//             </Box>
//           </Box>
//         )}
//       </Box>
//     </Container>
//   );
// }