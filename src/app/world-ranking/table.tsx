"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchWorldRanking, WorldRankingPlayer, WorldRankingResponse } from '@/lib/api';
import { Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, FormControl, Select, MenuItem } from '@mui/material';
import Link from 'next/link';
import { Country } from 'country-state-city';
import { useAuth } from '@/lib/hooks';
import WorldRankingLoadingSkeleton from '@/Components/loading/WorldRankingLoadingSkeleton';

interface Filters { mode: 'total' | 'avg'; year?: string; positionType?: string; country?: string; }
type SortKey = 'rank' | 'name' | 'matches' | 'avgXP' | 'totalXP';
interface SortState { key: SortKey; direction: 'asc' | 'desc'; }

// Column typing and sortable key guard (avoid any casts)
type ColumnKey = SortKey | 'position' | 'positionType';
interface Column { label: string; key: ColumnKey }
const SORTABLE_KEYS: readonly SortKey[] = ['rank', 'name', 'matches', 'avgXP', 'totalXP'] as const;
const isSortableKey = (k: ColumnKey): k is SortKey => (SORTABLE_KEYS as readonly string[]).includes(k);

// Helper to get a comparable value for sorting without using any
function getSortValue(player: WorldRankingPlayer, key: SortKey): string | number {
  switch (key) {
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

export default function WorldRankingTable() {
  const { user, token } = useAuth();
  const [filters, setFilters] = useState<Filters>({ mode: 'total' });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorldRankingResponse | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [, setLastUpdated] = useState<Date | null>(null);
  const [sort, setSort] = useState<SortState>({ key: 'rank', direction: 'asc' });
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const userRowRef = useRef<HTMLTableRowElement | null>(null);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>(320);
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const responseYears = Array.isArray(data?.years)
      ? data.years
        .filter((y): y is number => Number.isFinite(y))
        .filter((y) => y >= 2000 && y <= current + 1)
      : [];

    const yearSet = new Set<number>([current, ...responseYears]);

    return Array.from(yearSet).sort((a, b) => b - a).map(String);
  }, [data?.years]);

  useEffect(() => {
    if (!filters.year) return;
    if (!years.includes(filters.year)) {
      setFilters((f) => ({ ...f, year: undefined }));
    }
  }, [filters.year, years]);

  const handleFilterDropdownOpen = (event: React.SyntheticEvent) => {
    if (typeof window === 'undefined') return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const spaceBelow = Math.floor(viewportHeight - rect.bottom - 10);
    setDropdownMaxHeight(Math.max(140, spaceBelow));
  };

  const filterMenuProps = useMemo(() => ({
    anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
    transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
    marginThreshold: 0,
    PaperProps: {
      sx: {
        mt: 0.5,
        maxHeight: `${dropdownMaxHeight}px`,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        bgcolor: '#1a1a1a',
        color: '#fff',
        border: '1px solid rgba(229,106,22,0.75)',
      },
    },
  }), [dropdownMaxHeight]);

  const countryFilterMenuProps = useMemo(() => ({
    ...filterMenuProps,
    PaperProps: {
      ...filterMenuProps.PaperProps,
      sx: {
        ...filterMenuProps.PaperProps.sx,
        maxWidth: '240px',
      },
    },
  }), [filterMenuProps]);
  // Use the same full country dataset as the register form
  const countries = useMemo(() => {
    try {
      return Country.getAllCountries().map(c => c.name).sort((a, b) => a.localeCompare(b));
    } catch {
      // Fallback to any countries present in data if library fails for some reason
      const set = new Set<string>();
      (data?.players || []).forEach(p => { if (p.country) set.add(p.country); });
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
  }, [data]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      // Request a high limit to show all players; pass auth token for production
      const resPrimary = await fetchWorldRanking({
        mode: filters.mode,
        positionType: filters.positionType,
        year: filters.year ? Number(filters.year) : undefined,
        country: filters.country,
        playerId: user?.id,
        limit: 100000,
        token: token || undefined,
      });
      setData(resPrimary);
      setLastUpdated(new Date());
    } catch {
      // Retry with smaller limits in case the server caps or times out on large requests
      try {
        const resFallback = await fetchWorldRanking({
          mode: filters.mode,
          positionType: filters.positionType,
          year: filters.year ? Number(filters.year) : undefined,
          country: filters.country,
          playerId: user?.id,
          limit: 5000,
          token: token || undefined,
        });
        setData(resFallback);
        setLastUpdated(new Date());
        setError(null);
      } catch {
        try {
          const resMin = await fetchWorldRanking({
            mode: filters.mode,
            positionType: filters.positionType,
            year: filters.year ? Number(filters.year) : undefined,
            country: filters.country,
            playerId: user?.id,
            limit: 1000,
            token: token || undefined,
          });
          setData(resMin);
          setLastUpdated(new Date());
          setError('Showing top 1,000 players due to server limits');
        } catch (e3: unknown) {
          const message = e3 instanceof Error ? (e3.message || 'Failed to load world ranking') : 'Failed to load world ranking';
          setError(message);
        }
      }
    }
    finally { setLoading(false); }
  };

  // token is intentionally included so load() re-fires once auth resolves after mount
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filters.mode, filters.positionType, filters.year, filters.country, token]);

  // Note: Do not auto-set country from the user's profile; keep it manual per request

  // When switching mode, default sort to the shown metric (desc)
  useEffect(() => {
    setSort({ key: filters.mode === 'avg' ? 'avgXP' : 'totalXP', direction: 'desc' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.mode]);

  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data.players)) return [] as WorldRankingPlayer[];
    const term = search.trim().toLowerCase();
    let base = !term ? data.players : data.players.filter(p => p.name.toLowerCase().includes(term));
    if (filters.country) {
      base = base.filter(p => (p.country || '').toLowerCase() === filters.country!.toLowerCase());
    }

    // Compute tie-aware ranks based on current mode metric (competition ranking: 1,2,2,4)
    const metricKey: 'avgXP' | 'totalXP' = filters.mode === 'avg' ? 'avgXP' : 'totalXP';
    const metricVal = (p: WorldRankingPlayer) => (metricKey === 'avgXP' ? (p.avgXP ?? 0) : (p.totalXP ?? 0));
    const byMetricDesc = [...base].sort((a, b) => metricVal(b) - metricVal(a));
    const rankMap = new Map<string, number>();
    let lastVal: number | null = null;
    let denseRank = 0;
    for (const p of byMetricDesc) {
      const v = metricVal(p);
      if (lastVal === null || v !== lastVal) {
        denseRank += 1; // dense ranking: increment only when value changes
        lastVal = v;
      }
      rankMap.set(p.id, denseRank);
    }

    // Client-side sorting (stable by using slice)
    const { key, direction } = sort;
    const dirMul = direction === 'asc' ? 1 : -1;
    base = [...base].sort((a, b) => {
      const va = key === 'rank' ? (rankMap.get(a.id) ?? a.rank) : getSortValue(a, key);
      const vb = key === 'rank' ? (rankMap.get(b.id) ?? b.rank) : getSortValue(b, key);
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    // Attach the computed rank for later use (render)
    return base.map(p => ({ ...p, rank: rankMap.get(p.id) ?? p.rank } as WorldRankingPlayer));
  }, [data, search, sort, filters.mode, filters.country]);

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

  const filterSelectSx = {
    height: 39,
    color: '#fff',
    borderRadius: '24px',
    fontSize: 15,
    fontWeight: 600,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e56a16',
      borderWidth: '1.5px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e56a16',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e56a16',
      borderWidth: '1.5px',
    },
    '& .MuiSelect-select': {
      py: 0.95,
      pr: '34px !important',
      pl: 1.5,
    },
    '& .MuiSelect-icon': {
      color: '#fff',
      right: 10,
    },
  } as const;

  // Scroll current user into view when data loads
  useEffect(() => {
    if (!loading && userRowRef.current && tableContainerRef.current) {
      const container = tableContainerRef.current;
      const rowTop = userRowRef.current.offsetTop;
      // Smooth scroll so that row appears ~1/3 from top
      container.scrollTo({ top: Math.max(0, rowTop - container.clientHeight / 3), behavior: 'smooth' });
    }
  }, [loading, filtered.length]);

  if (loading && !data) {
    return <WorldRankingLoadingSkeleton />;
  }

  const formatNum = (n: number | undefined | null, opts: { decimals?: number } = {}) => {
    if (n === undefined || n === null) return '-';
    const d = opts.decimals ?? 0;
    return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  // Determine if any active filters/search are applied (controls chip + spacing visibility)
  const hasActiveFilter = Boolean(filters.positionType || filters.year || filters.country || search);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0e0e0e', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        .wr-search-icon { width: 22px; height: 22px; fill: none; stroke: #fff; stroke-width: 2; }
        @media (max-width: 600px) {
          .wr-right-filters {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            gap: 8px;
          }
          .wr-right-filters .wr-filter-control,
          .wr-right-filters .wr-clear-btn {
            width: 100%;
            min-width: 0;
          }
          .wr-right-filters .wr-country-filter {
            width: auto;
            min-width: 120px;
            max-width: 170px;
            justify-self: start;
          }
          .wr-right-filters .wr-clear-btn {
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
            padding-left: 0;
            padding-right: 0;
          }
        }
      `}</style>

      {/* ────────── HEADER ────────── */}
      <Box sx={{ 
        mb: 0, 
        bgcolor: '#0e0e0e', 
        p: { xs: 2, md: 3 }, 
        minHeight: { xs: 'var(--header-mobile-min-height)', md: 'auto' },
        width: '100vw',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <Typography sx={{
          fontFamily: '"Oswald", sans-serif !important',
          fontWeight: 700,
          fontSize: { xs: '32px', sm: '42px', md: '55px' },
          textAlign: 'center',
          textTransform: 'uppercase',
          color: '#fff',
          letterSpacing: '0px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          pt: { xs: 2, md: 3 },
          pb: { xs: 3, md: 6 },
          lineHeight: 1,
        }}>
          WORLD RANKING
        </Typography>
        
        {/* Divider line below heading */}
        <Box sx={{ 
          width: '100vw',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
          height: 'var(--header-divider-height)', 
          background: 'var(--header-divider-color)',
          mb: { xs: 0.25, md: -1 },
        }} />
      </Box>

      {/* ────────── FILTERS ────────── */}
      <Box sx={{
        bgcolor: '#0e0e0e',
        px: { xs: 2, md: 4 },
        mt: 0,
        pt: 0,
        mb: { xs: 2, md: 2 },
        mx: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, md: 1.2 },
          maxWidth: 1150,
          mx: 'auto',
        }}>
          {/* Left side - Mode toggle and Search */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: { xs: 1, md: 1.2 },
            alignItems: 'center',
            flex: { xs: '1 1 100%', md: '0 1 auto' }
          }}>
            {/* Mode toggle */}
            <Box sx={{ display: 'flex', borderRadius: '2px', overflow: 'hidden', border: '1.5px solid #e56a16' }}>
              {(['total', 'avg'] as const).map(mode => (
                <Box
                  key={mode}
                  onClick={() => setFilters(f => ({ ...f, mode }))}
                  sx={{
                    px: 2.2, py: 1,
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 600,
                    bgcolor: filters.mode === mode ? '#e56a16' : 'transparent',
                    color: '#fff',
                    userSelect: 'none',
                    transition: 'background 0.2s',
                  }}
                >
                  {mode === 'total' ? 'Total XP' : 'Avg/Match'}
                </Box>
              ))}
            </Box>

            {/* Search */}
            <Box sx={{
              flex: { xs: '1 1 100%', md: '0 0 280px' },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: '#1a1a1a',
              borderRadius: '2px',
              px: 1.5,
              height: 40,
              border: '1.5px solid #e56a16',
            }}>
              <svg className="wr-search-icon" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search player name and hit enter..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 15,
                }}
              />
            </Box>
          </Box>

          {/* Right side - Filters group */}
          <Box
            className="wr-right-filters"
            sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: { xs: 1, md: 1.2 },
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'flex-end' }
          }}>
             {/* Year */}
            <FormControl className="wr-filter-control" size="small" sx={{ width: 150 }}>
              <Select
                value={filters.year || ''}
                onOpen={handleFilterDropdownOpen}
                onChange={(e) => setFilters((f) => ({ ...f, year: (e.target.value as string) || undefined }))}
                displayEmpty
                MenuProps={filterMenuProps}
                sx={filterSelectSx}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Country */}
            <FormControl className="wr-filter-control wr-country-filter" size="small" sx={{ width: 150 }}>
              <Select
                value={filters.country || ''}
                onOpen={handleFilterDropdownOpen}
                onChange={(e) => setFilters((f) => ({ ...f, country: (e.target.value as string) || undefined }))}
                displayEmpty
                MenuProps={countryFilterMenuProps}
                sx={filterSelectSx}
              >
                <MenuItem value="">All Country</MenuItem>
                {countries.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Position */}
            <FormControl className="wr-filter-control" size="small" sx={{ width: 150 }}>
              <Select
                value={filters.positionType || ''}
                onOpen={handleFilterDropdownOpen}
                onChange={(e) => setFilters((f) => ({ ...f, positionType: (e.target.value as string) || undefined }))}
                displayEmpty
                MenuProps={filterMenuProps}
                sx={filterSelectSx}
              >
                <MenuItem value="">All Position</MenuItem>
                <MenuItem value="Defender">Defender</MenuItem>
                <MenuItem value="Midfielder">Midfielder</MenuItem>
                <MenuItem value="Forward">Forward</MenuItem>
                <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
              </Select>
            </FormControl>

           

            {/* Clear */}
            <Box
              className="wr-clear-btn"
              onClick={clearFilters}
              sx={{
                height: 39,
                px: 2.2,
                border: '1.5px solid rgba(255,255,255,0.5)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                userSelect: 'none',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
                transition: 'all 0.2s',
              }}
            >
              Clear
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ────────── INFO ROW ────────── */}
      <Box sx={{ textAlign: 'center', py: 1, color: '#aaa', fontSize: 15 }}>
        Mode&nbsp;&nbsp;&nbsp;&nbsp;
        <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>
          {filters.mode === 'total' ? 'Total XP' : 'Avg/Match'}
        </Box>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Players Shown&nbsp;&nbsp;&nbsp;&nbsp;
        <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>
          {filtered.length}
        </Box>
        {data?.playerRank && (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Your Rank&nbsp;&nbsp;&nbsp;&nbsp;
            <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>#{data.playerRank}</Box>
          </>
        )}
      </Box>

      {/* ────────── TABLE ────────── */}
      <Box sx={{ px: { xs: 1, md: 4 },mt: { xs: 2, md: 3 },pb: 6, maxWidth: 1220, mx: 'auto' }}>
        <Box sx={{
          bgcolor: '#242424',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #2a2a2a',
          position: 'relative',
          p: 1.5,
        }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.45)', zIndex: 2 }}>
              <CircularProgress size={40} sx={{ color: '#e56a16' }} />
            </Box>
          )}
          <TableContainer 
            sx={{ 
              maxHeight: 620,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }} 
            ref={tableContainerRef}
          >
            <Table 
              stickyHeader 
              size="small" 
              sx={{ 
                '& .MuiTableCell-root': { border: 'none' },
                '& .MuiTableCell-head': { 
                  bgcolor: '#1e1e1e !important',
                  backgroundColor: '#1e1e1e !important'
                }
              }}
            >
              <TableHead sx={{ bgcolor: '#1e1e1e !important' }}>
                <TableRow sx={{ bgcolor: '#1e1e1e !important' }}>
                  {(() => {
                    const showAvg = filters.mode === 'avg';
                    const cols: Column[] = [
                      { label: 'RANK', key: 'rank' },
                      { label: 'PLAYERS', key: 'name' },
                      { label: 'POSITION', key: 'position' },
                      { label: 'COUNTRY', key: 'position' },
                      { label: 'xp STATUS', key: 'position' },
                      ...(showAvg ? [{ label: 'AVG xp', key: 'avgXP' } as Column] : [{ label: 'TOTAL xp', key: 'totalXP' } as Column]),
                    ];
                    return cols.map((col, i) => (
                      <TableCell
                        key={col.label}
                        onClick={() => isSortableKey(col.key) && toggleSort(col.key)}
                        sx={{
                          cursor: isSortableKey(col.key) ? 'pointer' : 'default',
                          userSelect: 'none',
                          bgcolor: '#1e1e1e !important',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 13,
                          letterSpacing: 0.5,
                          py: 1.5,
                          // borderBottom: '2px solid #e56a16 !important',
                          pl: i === 0 ? 3 : 1.5,
                        }}
                      >
                        {col.label}
                        {isSortableKey(col.key) && sort.key === col.key && (
                          <Box component="span" sx={{ ml: 0.6, fontSize: 11 }}>
                            {sort.direction === 'asc' ? '▲' : '▼'}
                          </Box>
                        )}
                      </TableCell>
                    ));
                  })()}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p, idx) => {
                  const isMe = user?.id === p.id;
                  const rowBg = idx % 2 === 0 ? '#242424' : '#1e1e1e';
                  return (
                    <TableRow
                      key={p.id}
                      ref={isMe ? userRowRef : undefined}
                      sx={{
                        bgcolor: rowBg,
                        '&:hover': { bgcolor: '#2c2c2c' },
                        transition: 'background 0.15s',
                      }}
                    >
                      <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 14, pl: 3, py: 1.8 }}>
                        {p.rank}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: 14, py: 1.8 }}>
                        <Link href={`/player/${p.id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ color: '#ccc', fontSize: 13, py: 1.8 }}>{p.position || '-'}</TableCell>
                      <TableCell sx={{ color: '#ccc', fontSize: 13, py: 1.8 }}>{p.country || '-'}</TableCell>
                      <TableCell sx={{ color: '#ccc', fontSize: 13, py: 1.8 }}>{getLevelTitle(p.totalXP ?? 0)}</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 14, py: 1.8 }}>
                        {filters.mode === 'avg'
                          ? formatNum(p.avgXP, { decimals: 2 })
                          : formatNum(p.totalXP)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ bgcolor: 'transparent' }}>
                      <Typography sx={{ textAlign: 'center', py: 5, fontSize: 14, color: '#e56a16' }}>
                        {error}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ bgcolor: 'transparent' }}>
                      <Typography sx={{ textAlign: 'center', py: 5, fontSize: 14, color: '#888' }}>
                        No players found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {loading && Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} sx={{ bgcolor: i % 2 === 0 ? '#1e1e1e' : '#242424', opacity: 0.5 }}>
                    {Array.from({ length: 6 }).map((__, c) => (
                      <TableCell key={c}>
                        <Box sx={{ height: 14, width: c === 1 ? '60%' : '40%', bgcolor: '#333', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}

// Keep for backward compat (unused after redesign but harmless)
function SummaryPill({ label, value, highlight, compact }: { label: string; value: string; highlight?: boolean; compact?: boolean }) {
  return (
    <Box sx={{
      px: compact ? 1.0 : 1.4,
      py: compact ? .6 : .75,
      borderRadius: 2,
      background: highlight ? '#e56a16' : 'rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', minWidth: compact ? 84 : 110,
      border: highlight ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.09)',
    }}>
      <Typography sx={{ fontSize: compact ? 9 : 10, letterSpacing: .8, textTransform: 'uppercase', color: highlight ? '#ffe8da' : '#b5b5b5', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{value}</Typography>
    </Box>
  );
}
