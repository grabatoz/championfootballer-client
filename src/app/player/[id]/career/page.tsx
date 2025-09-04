'use client';

import React, { useEffect, useMemo } from 'react';
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
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchPlayerStats } from '@/lib/features/playerStatsSlice';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';

// Recharts (lazy to avoid SSR)
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChart       = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const Line                = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Legend              = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });
const PieChart            = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie                 = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell                = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });
const RadarChart          = dynamic(() => import('recharts').then(m => m.RadarChart), { ssr: false });
const PolarGrid           = dynamic(() => import('recharts').then(m => m.PolarGrid), { ssr: false });
const PolarAngleAxis      = dynamic(() => import('recharts').then(m => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis     = dynamic(() => import('recharts').then(m => m.PolarRadiusAxis), { ssr: false });
const Radar               = dynamic(() => import('recharts').then(m => m.Radar), { ssr: false });

const BG_GRAD = 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)';
const PANEL_GRAD = 'linear-gradient(90deg,#767676 0%,#000 100%)';

// NEW: Shared styled cards + animations (keeps color palette)
const floatIn = keyframes`
  0% { opacity:0; transform:translateY(14px) scale(.985); }
  60% { opacity:1; transform:translateY(-2px) scale(1); }
  100% { opacity:1; transform:translateY(0) scale(1); }
`;

const GlassCard = styled(Paper)(() => ({
  background: 'linear-gradient(120deg, rgba(118,118,118,0.22) 0%, rgba(0,0,0,0.72) 100%)',
  backdropFilter: 'blur(10px) saturate(140%)',
  WebkitBackdropFilter: 'blur(10px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 22,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 26px -6px rgba(0,0,0,0.65)',
  animation: `${floatIn} .6s ease`,
  transition: 'border-color .35s, box-shadow .35s, transform .35s',
  '&:before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.22), transparent 66%)',
    pointerEvents: 'none'
  },
  '&:after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(120deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 55%)',
    pointerEvents: 'none'
  },
  '&:hover': {
    borderColor: 'rgba(255,255,255,0.38)',
    boxShadow: '0 14px 34px -4px rgba(0,0,0,0.75)',
    transform: 'translateY(-3px)'
  }
}));

const SectionTitle = styled(Typography)(() => ({
  fontWeight: 900,
  letterSpacing: .4,
  fontSize: 14,
  color: '#fff',
  textTransform: 'uppercase'
}));

type LeagueMatch = {
  id: string;
  date: string;
  playerStats?: {
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    motmVotes?: number;
    impact?: number;
    defence?: number;
    freeKicks?: number;
    penalties?: number;
    result?: 'W' | 'L' | 'D';
  };
};
type LeagueWithMatches = { id: string; matches?: LeagueMatch[] };

function calcPoints(ps: NonNullable<LeagueMatch['playerStats']> | undefined) {
  if (!ps) return 0;
  // Scoring model (align with annotated spec: emphasise goal contribution + performance)
  return (ps.goals || 0) * 4
    + (ps.assists || 0) * 3
    + (ps.cleanSheets || 0) * 3
    + (ps.motmVotes || 0) * 2
    + (ps.impact || 0)
    + (ps.defence || 0)
    + (ps.freeKicks || 0) * 2
    + (ps.penalties || 0) * 2;
}

// Helper to get ISO week start (Mon) for consistent weekly grouping
function weekKey(dateStr: string) {
  const d = dayjs(dateStr);
  return d.startOf('week').format('YYYY-MM-DD'); // week starting day
}

export default function CareerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const dispatch = useDispatch<AppDispatch>();
  const { data, filters } = useSelector((s: RootState) => s.playerStats);
  const loading = !data;

  useEffect(() => {
    if (playerId) {
      dispatch(fetchPlayerStats({ playerId, leagueId: filters.leagueId, year: filters.year }));
    }
  }, [playerId, dispatch, filters.leagueId, filters.year]);

  // All matches sorted
  const matches: LeagueMatch[] = useMemo(() => {
    return (data?.leagues || [])
      .flatMap((l: LeagueWithMatches) => l.matches || [])
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [data]);

  // Adaptive Performance Data (Weekly first, then Monthly if >=26 weekly periods)
  const { performanceData, groupingType } = useMemo(() => {
    type Row = {
      key: string;
      label: string;
      year: string;
      matches: number;
      totalPoints: number;
      avgPoints: number;
      cumulativePoints: number;
    };

    if (!matches.length) return { performanceData: [] as Row[], groupingType: 'weekly' as 'weekly' | 'monthly' };

    // 1. Weekly grouping
    const weeklyMap = new Map<string, Row>();
    matches.forEach(m => {
      const key = weekKey(m.date);
      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          key,
          label: dayjs(key).format('DD-MMM'),
          year: dayjs(key).format('YYYY'),
          matches: 0,
          totalPoints: 0,
          avgPoints: 0,
          cumulativePoints: 0
        });
      }
      const row = weeklyMap.get(key)!;
      row.matches += 1;
      row.totalPoints += calcPoints(m.playerStats);
    });

    const weeklyArr = Array.from(weeklyMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    weeklyArr.forEach(r => {
      r.avgPoints = +(r.totalPoints / r.matches).toFixed(2);
    });

    if (weeklyArr.length < 26) {
      // Use weekly
      let run = 0;
      weeklyArr.forEach(r => {
        run += r.totalPoints;
        r.cumulativePoints = run;
      });
      return { performanceData: weeklyArr, groupingType: 'weekly' as const };
    }

    // 2. Monthly grouping once enough data
    const monthlyMap = new Map<string, Row>();
    matches.forEach(m => {
      const key = dayjs(m.date).format('YYYY-MM');
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          key,
          label: dayjs(m.date).format('MMM'),
          year: dayjs(m.date).format('YYYY'),
          matches: 0,
          totalPoints: 0,
          avgPoints: 0,
          cumulativePoints: 0
        });
      }
      const row = monthlyMap.get(key)!;
      row.matches += 1;
      row.totalPoints += calcPoints(m.playerStats);
    });
    const monthlyArr = Array.from(monthlyMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    let running = 0;
    monthlyArr.forEach(r => {
      r.avgPoints = +(r.totalPoints / r.matches).toFixed(2);
      running += r.totalPoints;
      r.cumulativePoints = running;
    });

    return { performanceData: monthlyArr, groupingType: 'monthly' as const };
  }, [matches]);

  // Win / Loss / Draw
  const wld = useMemo(() => {
    let W = 0, L = 0, D = 0;
    matches.forEach(m => {
      const r = m.playerStats?.result;
      if (r === 'W') W++; else if (r === 'L') L++; else if (r === 'D') D++;
    });
    return { W, L, D };
  }, [matches]);

  // Influence radar (aggregate raw + scaled)
  const influence = useMemo(() => {
    const total = {
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
    const maxVal = Math.max(...Object.values(total), 1);
    return Object.entries(total).map(([metric, value]) => ({
      metric,
      value,
      scaled: Math.round((value / maxVal) * 100)
    }));
  }, [matches]);

  // Strengths (top 3 scaled > 0), only positive (scaled > 25)
  const strengths = useMemo(
    () => [...influence].filter(i => i.scaled > 25).sort((a, b) => b.scaled - a.scaled).slice(0, 3),
    [influence]
  );

  // Last 10 matches detail table
  const recent = useMemo(() => {
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

  const recentAverages = useMemo(() => {
    if (!recent.length) return null;
    const agg = recent.reduce((a, r) => {
      a.goals += r.goals;
      a.assists += r.assists;
      a.cleanSheets += r.cleanSheets;
      a.impact += r.impact;
      a.defence += r.defence;
      a.fk += r.fk;
      a.pens += r.pens;
      a.motm += r.motm;
      a.points += r.points;
      return a;
    }, { goals:0, assists:0, cleanSheets:0, impact:0, defence:0, fk:0, pens:0, motm:0, points:0 });
    const d = recent.length;
    return {
      goals: +(agg.goals/d).toFixed(2),
      assists: +(agg.assists/d).toFixed(2),
      cleanSheets: +(agg.cleanSheets/d).toFixed(2),
      impact: +(agg.impact/d).toFixed(2),
      defence: +(agg.defence/d).toFixed(2),
      fk: +(agg.fk/d).toFixed(2),
      pens: +(agg.pens/d).toFixed(2),
      motm: +(agg.motm/d).toFixed(2),
      points: +(agg.points/d).toFixed(2),
    };
  }, [recent]);

  // ADD: careerTotals memo
  const careerTotals = useMemo(() => {
    const totalMatches = matches.length;
    const totalPoints = matches.reduce((s,m)=> s + calcPoints(m.playerStats),0);
    return {
      totalMatches,
      totalPoints,
      avgPerMatch: totalMatches ? +(totalPoints/totalMatches).toFixed(2) : 0
    };
  }, [matches]);

  // Insights logic
  const insights = useMemo(() => {
    const lines: string[] = [];
    if (performanceData.length) {
      const best = [...performanceData].sort((a, b) => b.avgPoints - a.avgPoints)[0];
      lines.push(
        `Peak ${groupingType === 'weekly' ? 'Week' : 'Month'}: ${best.label} ${best.year} (Avg Points ${best.avgPoints}).`
      );
    }
    if (performanceData.length > 1) {
      const last3 = performanceData.slice(-3);
      if (last3.length === 3) {
        const trend = last3.map(r => r.avgPoints);
        const dir = trend[2] > trend[0] ? 'rising' : trend[2] < trend[0] ? 'declining' : 'flat';
        lines.push(`Form Trend (${groupingType}): ${dir} (${trend.map(t => t.toFixed(2)).join(' → ')}).`);
      }
    }
    const totalGames = matches.length;
    if (totalGames) {
      const totalPoints = matches.reduce((s, m) => s + calcPoints(m.playerStats), 0);
      lines.push(`Career Avg Points / Match: ${(totalPoints / totalGames).toFixed(2)} over ${totalGames} matches.`);
    }
    const winTotal = wld.W + wld.L + wld.D;
    if (winTotal) {
      lines.push(`Win Rate: ${((wld.W / winTotal) * 100).toFixed(1)}% (W${wld.W}/D${wld.D}/L${wld.L}).`);
    }
    if (strengths.length) {
      lines.push(`Key Strength: ${strengths[0].metric} (raw ${strengths[0].value}).`);
    }
    if (!lines.length) lines.push('Not enough data for insights.');
    return lines;
  }, [performanceData, groupingType, matches, wld, strengths]);

  // Adjust formBadge to use performanceData instead of recent when possible
  const formBadge = useMemo(() => {
    if (!performanceData.length) return 'No Data';
    const last = performanceData.slice(-5); // last 5 periods
    const avg = last.reduce((s, r) => s + r.avgPoints, 0) / last.length;
    if (avg >= 25) return 'On Fire';
    if (avg >= 15) return 'Hot Form';
    if (avg >= 8) return 'Solid';
    return 'Needs Spark';
  }, [performanceData]);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        minHeight: '100vh',
        background: BG_GRAD,
        mt: 5,
        mb: 5
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', mb: 2, textAlign: 'center' }}>
        Career Performance Dashboard
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress/></Box>
      ) : (
        <Box>

          <Grid container spacing={2}>
            {/* Performance Over Time */}
            <Grid item xs={12} lg={8}>
              <GlassCard sx={{ p: 2.4, height: { xs: 440, md: 400 }, display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
                {/* Decorative gradient ring */}
                <Box sx={{
                  position:'absolute', width:320, height:320, top:-120, right:-120,
                  background:'radial-gradient(circle at center, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)',
                  opacity:.35, pointerEvents:'none', filter:'blur(2px)'
                }}/>
                {/* Frame */}
                <Box sx={{
                  position: 'absolute',
                  inset: 12,
                  border: '2px solid rgba(255,255,255,0.32)',
                  borderRadius: 3,
                  pointerEvents: 'none',
                  boxShadow:'inset 0 0 18px -4px rgba(0,0,0,0.7)'
                }} />
                {/* Vertical labels */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: -4,
                  transform: 'translate(-100%, -50%) rotate(-90deg)',
                  bgcolor: '#0bb77f',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  px: 1.4,
                  py: 0.45,
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                }}>Average XP Points</Box>
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  right: -4,
                  transform: 'translate(100%, -50%) rotate(90deg)',
                  bgcolor: '#004e89',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  px: 1.4,
                  py: 0.45,
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.55)'
                }}>Accumulative XP Points</Box>

                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 0.75, zIndex:2 }}>
                  <SectionTitle>Performance Over Time</SectionTitle>
                  <Chip
                    size="small"
                    label={formBadge}
                    sx={{
                      fontWeight:800,
                      letterSpacing:.4,
                      bgcolor: formBadge === 'On Fire' ? 'linear-gradient(135deg,#ff7744,#ff3d00)'
                        : formBadge === 'Hot Form' ? 'linear-gradient(135deg,#11c992,#0bb77f)'
                        : formBadge === 'Solid' ? 'linear-gradient(135deg,#2196f3,#1976d2)'
                          : 'linear-gradient(135deg,#666,#444)',
                      color:'#fff',
                      px:.25
                    }}
                  />
                </Box>

                {/* Quick stats bar */}
                <Box sx={{
                  display:'flex',
                  gap:2,
                  flexWrap:'wrap',
                  mb:1,
                  zIndex:2
                }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>
                    <Typography sx={{ fontSize:11, color:'#eee', opacity:.75 }}>Matches:</Typography>
                    <Typography sx={{ fontSize:12, fontWeight:800, color:'#0bb77f' }}>{careerTotals.totalMatches}</Typography>
                  </Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>
                    <Typography sx={{ fontSize:11, color:'#eee', opacity:.75 }}>Total XP:</Typography>
                    <Typography sx={{ fontSize:12, fontWeight:800, color:'#26d9d2' }}>{careerTotals.totalPoints}</Typography>
                  </Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>
                    <Typography sx={{ fontSize:11, color:'#eee', opacity:.75 }}>Avg / Match:</Typography>
                    <Typography sx={{ fontSize:12, fontWeight:800, color:'#ffd700' }}>{careerTotals.avgPerMatch}</Typography>
                  </Box>
                  <Box sx={{ ml:'auto', fontSize:10, color:'rgba(255,255,255,0.55)', fontStyle:'italic' }}>
                    {groupingType === 'weekly'
                      ? 'Auto switches to monthly after 26 weeks'
                      : 'Monthly view (26+ weeks accumulated)'}
                  </Box>
                </Box>

                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, mb: 1, zIndex: 2 }}>
                  Bars = Avg XP Points per {groupingType === 'weekly' ? 'Week' : 'Month'} | Line = Cumulative XP Points
                </Typography>

                <Box sx={{ flex:1, minHeight:0, zIndex:2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceData}>
                      <XAxis dataKey="label" stroke="#d9d9d9" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis yAxisId="avg" stroke="#ccc" tick={{ fontSize: 11 }} width={40} />
                      <YAxis yAxisId="cum" orientation="right" stroke="#ccc" tick={{ fontSize: 11 }} width={56} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,10,10,0.92)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          fontSize: 11,
                          backdropFilter:'blur(4px)'
                        }}
                        labelStyle={{ color:'#fff', fontWeight:700 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop:8 }} />
                      <Bar
                        yAxisId="avg"
                        dataKey="avgPoints"
                        name="Avg XP"
                        fill="url(#avgGrad)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={30}
                      />
                      <Line
                        yAxisId="cum"
                        type="monotone"
                        dataKey="cumulativePoints"
                        name="Cumulative XP"
                        stroke="#26d9d2"
                        strokeWidth={3}
                        dot={{ r: 3, stroke: '#26d9d2', strokeWidth: 1, fill: '#002f35' }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 1 }}
                      />
                      <defs>
                        <linearGradient id="avgGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#12d8a1"/>
                          <stop offset="100%" stopColor="#0b7d57"/>
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </GlassCard>
            </Grid>

            {/* Win/Loss + Radar stacked */}
            <Grid item xs={12} lg={4} container spacing={2}>
              <Grid item xs={12} md={6} lg={12}>
                <GlassCard sx={{ p:2, height:190, display:'flex', flexDirection:'column' }}>
                  <SectionTitle sx={{ mb: .5 }}>Win / Loss</SectionTitle>
                  <Box sx={{ flex:1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip contentStyle={{ background:'#111', border:'1px solid #444', fontSize:11 }}/>
                        <Pie
                          data={[
                            { name:'Wins', value:wld.W },
                            { name:'Draws', value:wld.D },
                            { name:'Losses', value:wld.L }
                          ]}
                          dataKey="value"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                        >
                          <Cell fill="#0bb77f"/>
                          <Cell fill="#ffb300"/>
                          <Cell fill="#d32f2f"/>
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ display:'flex', gap:1, justifyContent:'center', mb:0.5 }}>
                    <Chip size="small" label={`W ${wld.W}`} sx={{ bgcolor:'#0bb77f', color:'#fff', fontWeight:700 }}/>
                    <Chip size="small" label={`D ${wld.D}`} sx={{ bgcolor:'#ffb300', color:'#000', fontWeight:700 }}/>
                    <Chip size="small" label={`L ${wld.L}`} sx={{ bgcolor:'#d32f2f', color:'#fff', fontWeight:700 }}/>
                  </Box>
                </GlassCard>
              </Grid>
              <Grid item xs={12} md={6} lg={12}>
                <GlassCard sx={{ p:2, height:190, display:'flex', flexDirection:'column' }}>
                  <SectionTitle sx={{ mb:.5 }}>Influence (Radar)</SectionTitle>
                  <Box sx={{ flex:1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={influence}>
                        <PolarGrid stroke="#555"/>
                        <PolarAngleAxis dataKey="metric" tick={{ fill:'#fff', fontSize:9 }}/>
                        <PolarRadiusAxis stroke="#777" tick={{ fill:'#ccc', fontSize:9 }}/>
                        <Radar name="Raw" dataKey="value" stroke="#0bb77f" fill="#0bb77f" fillOpacity={0.35}/>
                        <Radar name="Scaled" dataKey="scaled" stroke="#ffd700" fill="#ffd700" fillOpacity={0.15}/>
                        <Tooltip contentStyle={{ background:'#111', border:'1px solid #444', fontSize:11 }}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </GlassCard>
              </Grid>
            </Grid>
          </Grid>

          {/* Impact Table (Last 10 Matches) */}
          <Grid container spacing={2} sx={{ mt:2 }}>
            <Grid item xs={12} lg={8}>
              <GlassCard sx={{ p:2.2 }}>
                <SectionTitle sx={{ mb:.75 }}>Impact (Last {recent.length || 0} Matches)</SectionTitle>
                <Typography sx={{ fontSize:11, color:'rgba(255,255,255,0.65)', mb:1 }}>
                  Displays recent match performance (points formula above). Average row shown at bottom.
                </Typography>
                <Box sx={{ overflowX:'auto' }}>
                  <Table size="small" sx={{
                    minWidth:860,
                    '& th,& td':{ borderColor:'rgba(255,255,255,0.12)', color:'#fff' },
                    '& tbody tr:hover': {
                      background:'rgba(255,255,255,0.08)'
                    }
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">G</TableCell>
                        <TableCell align="right">A</TableCell>
                        <TableCell align="right">CS</TableCell>
                        <TableCell align="right">Impact</TableCell>
                        <TableCell align="right">Def</TableCell>
                        <TableCell align="right">FK</TableCell>
                        <TableCell align="right">Pen</TableCell>
                        <TableCell align="right">MOTM</TableCell>
                        <TableCell align="right">Pts</TableCell>
                        <TableCell align="center">Res</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recent.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell align="right">{r.goals}</TableCell>
                          <TableCell align="right">{r.assists}</TableCell>
                          <TableCell align="right">{r.cleanSheets}</TableCell>
                          <TableCell align="right">{r.impact}</TableCell>
                          <TableCell align="right">{r.defence}</TableCell>
                          <TableCell align="right">{r.fk}</TableCell>
                          <TableCell align="right">{r.pens}</TableCell>
                          <TableCell align="right">{r.motm}</TableCell>
                          <TableCell align="right" style={{ fontWeight:600, color:'#ffd700' }}>{r.points}</TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={r.result}
                              sx={{
                                height:20,
                                bgcolor:
                                  r.result === 'W' ? '#0bb77f' :
                                  r.result === 'L' ? '#d32f2f' :
                                  r.result === 'D' ? '#ffb300' : '#555',
                                color: r.result === 'D' ? '#000' : '#fff',
                                fontWeight:700
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {!recent.length && (
                        <TableRow>
                          <TableCell colSpan={11} align="center" sx={{ color:'rgba(255,255,255,0.6)' }}>
                            No recent match data.
                          </TableCell>
                        </TableRow>
                      )}
                      {recentAverages && (
                        <TableRow>
                          <TableCell sx={{ fontWeight:700 }}>Avg</TableCell>
                          <TableCell align="right">{recentAverages.goals}</TableCell>
                          <TableCell align="right">{recentAverages.assists}</TableCell>
                          <TableCell align="right">{recentAverages.cleanSheets}</TableCell>
                          <TableCell align="right">{recentAverages.impact}</TableCell>
                          <TableCell align="right">{recentAverages.defence}</TableCell>
                          <TableCell align="right">{recentAverages.fk}</TableCell>
                          <TableCell align="right">{recentAverages.pens}</TableCell>
                          <TableCell align="right">{recentAverages.motm}</TableCell>
                          <TableCell align="right" sx={{ fontWeight:700, color:'#26d9d2' }}>{recentAverages.points}</TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </GlassCard>
            </Grid>

            {/* Strengths & Form Summary */}
            <Grid item xs={12} lg={4} container spacing={2}>
              <Grid item xs={12}>
                <GlassCard sx={{ p:2.2 }}>
                  <SectionTitle sx={{ mb:1 }}>Top Strengths</SectionTitle>
                  {strengths.length === 0 && (
                    <Typography sx={{ color:'rgba(255,255,255,0.65)', fontSize:12 }}>
                      Not enough data to determine strengths.
                    </Typography>
                  )}
                  {strengths.map(s => (
                    <Box key={s.metric} sx={{ mb:1.5 }}>
                      <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.2 }}>
                        <Typography sx={{ color:'#fff', fontSize:12, fontWeight:700 }}>{s.metric}</Typography>
                        <Typography sx={{ color:'#0bb77f', fontSize:12, fontWeight:800 }}>{s.value}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={s.scaled}
                        sx={{
                          height:10,
                          borderRadius:5,
                          background:'rgba(255,255,255,0.12)',
                          '& .MuiLinearProgress-bar': {
                            background:'linear-gradient(90deg,#0bb77f,#12d8a1)'
                          }
                        }}
                      />
                    </Box>
                  ))}
                </GlassCard>
              </Grid>
              <Grid item xs={12}>
                <GlassCard sx={{ p:2.2, height:'100%' }}>
                  <SectionTitle sx={{ mb:1 }}>Form & Insights</SectionTitle>
                  <Box component="ul" sx={{ pl:3, m:0 }}>
                    {insights.map((line,i)=>(
                      <Typography key={i} component="li" sx={{ color:'rgba(255,255,255,0.85)', fontSize:12, mb:0.5 }}>
                        {line}
                      </Typography>
                    ))}
                  </Box>
                  <Divider sx={{ my:1.5, borderColor:'rgba(255,255,255,0.15)' }}/>
                  <Typography sx={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>
                    Insights auto-generated from recent & career data.
                  </Typography>
                </GlassCard>
              </Grid>
            </Grid>
          </Grid>

          {/* Back Button */}
          <Box sx={{ mt:4, textAlign:'center' }}>
            <Typography
              component="button"
              onClick={() => router.push(`/player/${playerId}`)}
              sx={{
                background:'none',
                border:'1px solid rgba(255,255,255,0.4)',
                px:3,
                py:1,
                borderRadius:2,
                color:'#fff',
                fontWeight:700,
                cursor:'pointer',
                transition:'.2s',
                '&:hover': { background:'rgba(255,255,255,0.18)' }
              }}
            >
              Back to Player Profile
            </Typography>
          </Box>
        </Box>
      )}
    </Container>
  );
}