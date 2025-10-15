"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchWorldRanking, WorldRankingPlayer, WorldRankingResponse } from '@/lib/api';
import { Box, Typography, Select, MenuItem, ToggleButtonGroup, ToggleButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, CircularProgress, Chip, Button } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks';

interface Filters { mode: 'total'|'avg'; year?: string; positionType?: string; }
type SortKey = 'rank' | 'name' | 'matches' | 'avgXP' | 'totalXP';
interface SortState { key: SortKey; direction: 'asc' | 'desc'; }

// Column typing and sortable key guard (avoid any casts)
type ColumnKey = SortKey | 'position' | 'positionType';
interface Column { label: string; key: ColumnKey }
const SORTABLE_KEYS: readonly SortKey[] = ['rank','name','matches','avgXP','totalXP'] as const;
const isSortableKey = (k: ColumnKey): k is SortKey => (SORTABLE_KEYS as readonly string[]).includes(k);

// Helper to get a comparable value for sorting without using any
function getSortValue(player: WorldRankingPlayer, key: SortKey): string | number {
  switch(key){
    case 'name':
      return player.name.toLowerCase();
    case 'rank':
      return player.rank;
    case 'matches':
      return player.matches ?? 0;
    case 'avgXP':
      return player.avgXP ?? 0;
    case 'totalXP':
      return player.totalXP ?? 0;
    default:
      // Exhaustive check (should never happen)
      return 0;
  }
}

// XP Status mapping aligned with PlayerCard LEVELS (based on total XP)
const LEVELS = [
  { level: 1, min: 0, max: 100, title: 'Rookie', color: 'Green' },
  { level: 2, min: 100, max: 250, title: 'The Prospect', color: 'Green' },
  { level: 3, min: 250, max: 500, title: 'Rising Star', color: 'Green' },
  { level: 4, min: 500, max: 1000, title: 'The Skilled Player', color: 'Blue' },
  { level: 5, min: 1000, max: 2000, title: 'The Talented Player', color: 'Blue' },
  { level: 6, min: 2000, max: 3000, title: 'The Chosen One', color: 'Blue' },
  { level: 7, min: 3000, max: 4000, title: 'Serial Winner', color: 'Blue' },
  { level: 8, min: 4000, max: 5000, title: 'Supreme Player', color: 'Bronze' },
  { level: 9, min: 5000, max: 6000, title: 'The Invincible', color: 'Bronze' },
  { level: 10, min: 6000, max: 7000, title: 'The Maestro', color: 'Bronze' },
  { level: 11, min: 7000, max: 8000, title: 'Crème de la Crème', color: 'Bronze' },
  { level: 12, min: 8000, max: 9000, title: 'Elite', color: 'Silver' },
  { level: 13, min: 9000, max: 10000, title: 'World-Class', color: 'Silver' },
  { level: 14, min: 10000, max: 12000, title: 'The Undisputed', color: 'Silver' },
  { level: 15, min: 12000, max: 15000, title: 'Icon', color: 'Silver' },
  { level: 16, min: 15000, max: 18000, title: 'Generational Talent', color: 'Gold' },
  { level: 17, min: 18000, max: 22000, title: 'Legend of the Game', color: 'Gold' },
  { level: 18, min: 22000, max: 25000, title: 'Football Royalty', color: 'Gold' },
  { level: 19, min: 25000, max: 30000, title: 'Hall of Famer', color: 'Gold' },
  { level: 20, min: 30000, max: Infinity, title: 'Champion Footballer', color: 'Black' },
];

const getLevelTitle = (points: number): string => {
  const lvl = LEVELS.find(l => points >= l.min && points < l.max) || LEVELS[LEVELS.length - 1];
  return lvl.title;
};

export default function WorldRankingTable(){
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>({ mode: 'total' });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorldRankingResponse | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sort, setSort] = useState<SortState>({ key: 'rank', direction: 'asc' });
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const userRowRef = useRef<HTMLTableRowElement | null>(null);
  const years = useMemo(()=>{
    const current = new Date().getFullYear();
    return Array.from({ length: 10 }, (_,i)=> (current - i).toString());
  },[]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      // Request a high limit to show all players; omit positionType filter
      const res = await fetchWorldRanking({ mode: filters.mode, positionType: filters.positionType, year: filters.year? Number(filters.year): undefined, playerId: user?.id, limit: 100000 });
      setData(res);
      setLastUpdated(new Date());
    } catch(e: unknown) {
      const message = e instanceof Error ? (e.message || 'Failed') : 'Failed';
      setError(message);
    }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filters.mode, filters.positionType, filters.year]);

  // When switching mode, default sort to the shown metric (desc)
  useEffect(()=>{
    setSort({ key: filters.mode === 'avg' ? 'avgXP' : 'totalXP', direction: 'desc' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.mode]);

  const filtered = useMemo(()=>{
    if(!data) return [] as WorldRankingPlayer[];
    const term = search.trim().toLowerCase();
    let base = !term ? data.players : data.players.filter(p=> p.name.toLowerCase().includes(term));
    // Client-side sorting (stable by using slice)
    const { key, direction } = sort;
    const dirMul = direction === 'asc' ? 1 : -1;
    base = [...base].sort((a,b)=>{
      const va = getSortValue(a, key);
      const vb = getSortValue(b, key);
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    return base;
  },[data,search,sort]);

  const toggleSort = (key: SortKey) => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'rank' ? 'asc' : 'desc' };
    });
  };

  const clearFilters = () => {
    setFilters({ mode: filters.mode });
    setSearch('');
    setSort({ key: 'rank', direction: 'asc' });
  };

  // Scroll current user into view when data loads
  useEffect(()=>{
    if(!loading && userRowRef.current && tableContainerRef.current){
      const container = tableContainerRef.current;
      const rowTop = userRowRef.current.offsetTop;
      // Smooth scroll so that row appears ~1/3 from top
      container.scrollTo({ top: Math.max(0, rowTop - container.clientHeight/3), behavior:'smooth' });
    }
  },[loading, filtered.length]);

  const formatNum = (n: number | undefined|null, opts: { decimals?: number } = {}) => {
    if(n === undefined || n === null) return '-';
    const d = opts.decimals ?? 0;
    return n.toLocaleString(undefined, { minimumFractionDigits:d, maximumFractionDigits:d });
  };

  return (
    <Box sx={{ maxWidth: 1400, mx:'auto', p:{ xs:2, md:4 },minHeight:'100vh', display:'flex', flexDirection:'column', gap:2 }}>
      {/* <Typography variant="h4" sx={{ fontWeight:800, mb:2.5, textAlign:'center', letterSpacing:.8, background:'linear-gradient(90deg,#ff8a2b 0%,#ff3030 100%)', WebkitBackgroundClip:'text', color:'transparent', textShadow:'0 0 18px rgba(255,120,40,0.25)' }}>World Ranking</Typography> */}
  <Typography variant="h3" sx={{
            // mb: { xs: 3, md: 4 },
            color: 'black',
            // fontFamily: 'Arial Black, Arial, sans-serif',
            fontFamily: '"Anton", sans-serif',
            fontWeight: 'semibold',
            fontSize: { xs: '32px', sm: '42px', md: '56px' },
            textAlign: { xs: 'center', md: 'left' },
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
            className='all-leagues-heading'
          >
           world ranking
          </Typography>

      {/* Unified Control + Summary Card */}
      <Paper elevation={0} sx={{
        mb:2.5,
        p:2.4,
        borderRadius:3,
        position:'relative',
        overflow:'hidden',
        border:'1px solid rgba(255,255,255,0.08)',
        background:'linear-gradient(115deg,#181818 0%, #212121 40%, #2a0c00 100%)'
      }}>
        <Box sx={{ position:'absolute', inset:0, background:'radial-gradient(circle at 12% 8%, rgba(255,120,40,0.18), transparent 55%)' }} />
  <Box sx={{ position:'relative', display:'flex', flexWrap:'wrap', gap:2.2, alignItems:'flex-end' }}>
          <Box sx={{ display:'flex', flexDirection:'column', gap:.7, minWidth:160 }}>
            <Typography sx={{ fontSize:11, fontWeight:600, letterSpacing:.5, color:'#ff9d55', textTransform:'uppercase' }}>Mode</Typography>
            <ToggleButtonGroup size="small" exclusive value={filters.mode} onChange={(_,v)=> v && setFilters(f=>({...f, mode:v}))} sx={{
              background:'rgba(255,255,255,0.06)', borderRadius:2,
              '& .MuiToggleButton-root': { fontSize:12, px:1.6, textTransform:'none', fontWeight:600, border:0, color:'#e2e2e2' },
              '& .MuiToggleButton-root.Mui-selected': { background:'linear-gradient(90deg,#ff8a2b,#ff3030)', color:'#fff', boxShadow:'0 0 0 1px rgba(255,255,255,0.15)' }
            }}>
              <ToggleButton value="total">Total XP</ToggleButton>
              <ToggleButton value="avg">Avg / Match</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ display:'flex', flexDirection:'column', gap:.7, minWidth:170 }}>
            <Typography sx={{ fontSize:11, fontWeight:600, letterSpacing:.5, color:'#ff9d55', textTransform:'uppercase' }}>Position Type</Typography>
            <Select size="small" value={filters.positionType||''} onChange={e=> setFilters(f=>({...f, positionType: e.target.value||undefined}))} displayEmpty sx={{ minWidth:150, fontSize:13, color:'#f1f1f1', '.MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(255,255,255,0.18)' }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(255,255,255,0.35)' } }}>
              <MenuItem value=""><em>All</em></MenuItem>
              <MenuItem value="Defender">Defender</MenuItem>
              <MenuItem value="Midfielder">Midfielder</MenuItem>
              <MenuItem value="Forward">Forward</MenuItem>
              <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
            </Select>
          </Box>
          <Box sx={{ display:'flex', flexDirection:'column', gap:.7, minWidth:110 }}>
            <Typography sx={{ fontSize:11, fontWeight:600, letterSpacing:.5, color:'#ff9d55', textTransform:'uppercase' }}>Year</Typography>
            <Select
              size="small"
              value={filters.year || ''}
              onChange={e=> setFilters(f=> ({...f, year: e.target.value || undefined}))}
              displayEmpty
              sx={{ width:110, fontSize:13, color:'#f1f1f1', '.MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(255,255,255,0.18)' }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(255,255,255,0.35)' } }}
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {years.map(y=> <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </Box>
            <Box sx={{ display:'flex', flexDirection:'column', gap:.7, flexGrow:1, minWidth:200 }}>
              <Typography sx={{ fontSize:11, fontWeight:600, letterSpacing:.5, color:'#ff9d55', textTransform:'uppercase' }}>Search</Typography>
              <TextField size="small" placeholder="Search Player" value={search} onChange={e=> setSearch(e.target.value)} sx={{ minWidth:200, '& .MuiOutlinedInput-root':{ color:'#fff', '& fieldset':{ borderColor:'rgba(255,255,255,0.18)' }, '&:hover fieldset':{ borderColor:'rgba(255,255,255,0.34)' } } }} />
            </Box>
          <Box sx={{ display:'flex', flexDirection:'column', gap:.7, minWidth:130 }}>
            <Typography sx={{ fontSize:11, fontWeight:600, letterSpacing:.5, color:'#ff9d55', textTransform:'uppercase' }}>Actions</Typography>
            <Box sx={{ display:'flex', gap:1 }}>
              <Button variant="outlined" size="small" disabled={loading} onClick={load} sx={{
                textTransform:'none', fontWeight:600, fontSize:12.5,
                borderColor:'rgba(255,255,255,0.35)', color:'#ffb78b',
                '&:hover':{ borderColor:'#ff9d55', background:'rgba(255,120,40,0.08)' }
              }}>{loading? '...' : 'Refresh'}</Button>
              <Button variant="outlined" size="small" onClick={clearFilters} sx={{
                textTransform:'none', fontWeight:600, fontSize:12.5,
                borderColor:'rgba(255,255,255,0.25)', color:'#dcdcdc',
                '&:hover':{ borderColor:'#fff', background:'rgba(255,255,255,0.08)' }
              }}>Clear</Button>
            </Box>
          </Box>
          <Box sx={{ flexBasis:'100%' }} />
          <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', position:'relative', zIndex:1 }}>
            {filters.positionType && <Chip size="small" label={`Pos: ${filters.positionType}`} onDelete={()=> setFilters(f=> ({...f, positionType: undefined}))} sx={{ background:'linear-gradient(90deg,#ff8a2b,#ff3030)', color:'#fff', '& .MuiChip-deleteIcon':{ color:'#fff' } }} />}
            {filters.year && <Chip size="small" label={`Year: ${filters.year}`} onDelete={()=> setFilters(f=> ({...f, year: undefined}))} sx={{ background:'linear-gradient(90deg,#ff8a2b,#ff3030)', color:'#fff', '& .MuiChip-deleteIcon':{ color:'#fff' } }} />}
            {search && <Chip size="small" label={`Search: ${search}`} onDelete={()=> setSearch('')} sx={{ background:'linear-gradient(90deg,#333,#111)', color:'#fff', '& .MuiChip-deleteIcon':{ color:'#fff' } }} />}
          </Box>
          <Box sx={{ flexBasis:'100%' }} />
          <Box sx={{ display:'flex', flexWrap:'wrap', gap:1.2, mt:.5, position:'relative', zIndex:1 }}>
            <SummaryPill label="Mode" value={filters.mode==='total'? 'Total XP' : 'Average XP / Match'} />
            <SummaryPill label="Players Shown" value={`${filtered.length.toLocaleString()}`} />
            {data?.playerRank && <SummaryPill label="Your Rank" value={`#${data.playerRank}`} highlight />}
            {lastUpdated && <SummaryPill label="Updated" value={lastUpdated.toLocaleTimeString()} />}
          </Box>
        </Box>
        <Typography sx={{ position:'relative', mt:2, fontSize:11.7, lineHeight:1.5, color:'#c3c3c3', maxWidth:880 }}>
          View global performance of all registered players. Your row is highlighted. Use Average mode to normalize by matches played. Scroll is auto-focused on you if ranked in the visible list.
        </Typography>
      </Paper>

      {error && (
        <Paper sx={{ p:2, border:'1px solid #552', background:'linear-gradient(135deg,#3a0000,#120000)', color:'#ffe2d8', borderRadius:2, mb:2 }}>
          <Typography sx={{ fontWeight:600, mb:1 }}>Error: {error}</Typography>
          <Button onClick={load} size="small" variant="outlined" sx={{ textTransform:'none', borderColor:'#ff6a3c', color:'#ffb092', '&:hover':{ borderColor:'#ff8a2b', background:'rgba(255,120,40,0.08)' } }}>Retry</Button>
        </Paper>
      )}
      <Paper
        variant="outlined"
        sx={{
          position:'relative',
          border:'1px solid #4b4b4b',
          borderRadius:3,
          overflow:'hidden',
          background:'linear-gradient(90deg,#767676 0%, #000000 100%)',
          p:1.2
        }}
      >
        {loading && <Box sx={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', background:'rgba(0,0,0,0.35)', zIndex:2 }}><CircularProgress size={42} thickness={5} sx={{ color:'#fff' }} /></Box>}
        <TableContainer sx={{ maxHeight:620 }} ref={tableContainerRef}>
          <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root':{ borderBottom:'1px solid rgba(255,255,255,0.18)' } }}>
            <TableHead>
              <TableRow>
                {(() => {
                  const showAvg = filters.mode === 'avg';
                  const showTotal = filters.mode === 'total';
                  const cols: Column[] = [
                    { label:'Rank', key:'rank' },
                    { label:'Player', key:'name' },
                    { label:'Position', key:'position' },
                    // { label:'Pos Type', key:'positionType' },
                     { label:'Country', key:'position' },
                    { label:'XP Status', key:'position' },
                    { label:'Matches', key:'matches' },
                    ...(showAvg ? [{ label:'Avg XP', key:'avgXP' } as Column] : []),
                    ...(showTotal ? [{ label:'Total XP', key:'totalXP' } as Column] : []),
                  ];
                  return cols.map(col => (
                  <TableCell
                    key={col.label}
                    onClick={()=> isSortableKey(col.key) && toggleSort(col.key)}
                    sx={{
                      cursor: isSortableKey(col.key) ? 'pointer' : 'default',
                      userSelect:'none',
                      background:'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                      color:'#fff',
                      fontWeight:700,
                      fontSize:13,
                      letterSpacing:.5,
                      borderBottom:'2px solid rgba(255,255,255,0.35)'
                    }}
                  >
                    {col.label}
                    {isSortableKey(col.key) && sort.key === col.key && (
                      <Box component="span" sx={{ ml:.6, fontSize:11, fontWeight:700 }}>
                        {sort.direction === 'asc' ? '▲' : '▼'}
                      </Box>
                    )}
                  </TableCell>
                  ));
                })()}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p,idx)=>{
                const highlight = user?.id === p.id || (data?.playerOutsideTop && data.playerRank === p.rank && p.id === user?.id);
                const baseGradient = 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)';
                const altGradient = 'linear-gradient(177deg,rgba(229,106,22,0.82) 26%, rgba(207,35,38,0.82) 100%)';
                const rowBg = highlight ? 'linear-gradient(177deg,rgba(255,168,92,1) 12%, rgba(240,96,54,1) 100%)' : (idx % 2 === 0 ? baseGradient : altGradient);
                const medalBg = p.rank === 1 ? 'linear-gradient(135deg,#FFD700,#FFB400)' : p.rank === 2 ? 'linear-gradient(135deg,#D8D8D8,#B0B0B0)' : p.rank === 3 ? 'linear-gradient(135deg,#CD7F32,#AD5F20)' : (highlight? 'rgba(0,0,0,0.55)':'rgba(0,0,0,0.35)');
                return (
                  <TableRow
                    key={p.id}
                    ref={highlight ? userRowRef : undefined}
                    hover
                    sx={{
                      background: rowBg,
                      '&:hover': { filter:'brightness(1.055)' },
                      transition:'filter .18s, transform .2s',
                      fontSize:13,
                      boxShadow: highlight ? '0 0 0 2px rgba(255,255,255,0.55) inset, 0 0 12px -2px rgba(255,140,70,0.6)' : undefined,
                      position:'relative'
                    }}
                  >
                    <TableCell sx={{ fontWeight:800, color:'#fff', fontSize:12.5 }}>
                      <Box sx={{ display:'inline-flex', alignItems:'center', gap:.6 }}>
                        <Box sx={{
                          width:28, height:28, borderRadius:'9px',
                          background: medalBg,
                          color: p.rank <=3 ? '#2d1600' : '#fff', fontWeight:800, fontSize:12.5,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow: p.rank<=3 ? '0 0 0 2px rgba(0,0,0,0.35), 0 2px 6px -2px rgba(0,0,0,0.6)' : undefined
                        }}>{p.rank}</Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight:700, color:'#fff', maxWidth:220 }}>
                      <Link href={`/player/${p.id}`} style={{ textDecoration:'none', color:'#fff' }}>{p.name}</Link>
                    </TableCell>
                    <TableCell sx={{ fontSize:12.5, color:'#fff', fontWeight:500 }}>{p.position || '-'}</TableCell>
                    {/* Country column: backend may provide p.country; fallback '-' */}
                    <TableCell sx={{ fontSize:12.5, color:'#fff', fontWeight:500 }}>{(p as any).country || '-'}</TableCell>
                    {/* XP Status column: title from LEVELS based on total XP */}
                    <TableCell sx={{ fontSize:12.5, color:'#fff', fontWeight:700 }}>
                      {getLevelTitle(p.totalXP ?? 0)}
                    </TableCell>
                    <TableCell sx={{ fontSize:12.5, color:'#fff' }}>{formatNum(p.matches)}</TableCell>
                    {filters.mode === 'avg' && (
                      <TableCell sx={{ fontSize:12.5, fontWeight:700, color:'#fff' }}>{formatNum(p.avgXP, { decimals:2 })}</TableCell>
                    )}
                    {filters.mode === 'total' && (
                      <TableCell sx={{ fontSize:12.5, fontWeight:800, color:'#fff' }}>{formatNum(p.totalXP)}</TableCell>
                    )}
                  </TableRow>
                );
              })}
              {!loading && filtered.length===0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ background:'transparent' }}>
                    <Typography sx={{ textAlign:'center', py:5, fontSize:13, color:'#fff' }}>No players found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                Array.from({ length: 8 }).map((_,i)=>(
                  <TableRow key={`skeleton-${i}`} sx={{ opacity:.55 }}>
                    {Array.from({ length:7 }).map((__,c)=>(
                      <TableCell key={c} sx={{ background:'rgba(255,255,255,0.04)' }}>
                        <Box sx={{ height:14, width: c===1? '60%':'40%', background:'linear-gradient(90deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))', borderRadius:1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// Small summary pill component
function SummaryPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }){
  return (
    <Box sx={{
      px:1.4, py:.75,
      borderRadius:2,
      background: highlight? 'linear-gradient(90deg,#ff8a2b,#ff3030)' : 'linear-gradient(120deg,rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      display:'flex', flexDirection:'column', minWidth:110,
      border: highlight? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
      boxShadow: highlight? '0 0 0 1px rgba(255,120,40,0.5), 0 2px 8px -2px rgba(0,0,0,0.6)' : undefined
    }}>
      <Typography sx={{ fontSize:10, letterSpacing:.8, textTransform:'uppercase', color: highlight? '#ffe8da':'#b5b5b5', fontWeight:600 }}>{label}</Typography>
      <Typography sx={{ fontSize:13, fontWeight:700, color:'#ffffff', lineHeight:1.25 }}>{value}</Typography>
    </Box>
  );
}
