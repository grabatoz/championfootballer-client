"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Button, TextField, CircularProgress, Autocomplete, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, LinearProgress, Chip, Grid, InputAdornment, Alert, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, Shuffle, UserPlus, Scale, UserMinus, ArrowLeftRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { cacheManager } from '@/lib/cacheManager';
import ShirtImg from '@/Components/images/shirtimg.png';
import CloseButton from '@/Components/CloseButton';

interface User { id: string; firstName: string; lastName: string; email: string; profilePicture?: string; shirtNumber?: string; skills?: { dribbling?: number; shooting?: number; passing?: number; pace?: number; defending?: number; physical?: number; }; preferredFoot?: 'right' | 'left'; }
interface League { id: string; name: string; members: User[]; active: boolean; }
interface Guest { id: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string; }
interface StagedGuest { tempId: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string; existingId?: string; }
interface MatchResp { id: string; homeTeamName: string; awayTeamName: string; location: string; date: string; start: string; end: string; status: string; homeCaptainId?: string; awayCaptainId?: string; homeTeamImage?: string; awayTeamImage?: string; homeTeamUsers: User[]; awayTeamUsers: User[]; guests?: Guest[]; }
type PlayerOption = User & { isGuest?: boolean; guestTempId?: string; team?: 'home' | 'away'; existingGuestId?: string };
interface AvailabilityRecord { userId: string; status: 'available' | 'unavailable' | 'pending'; }
type AvailabilityStatus = AvailabilityRecord['status'];
// interface AvailabilityEntry {
//   userId: string;
//   status?: string; // will normalize
// }
interface AvailabilityApiResponse {
  success?: boolean;
  matchId?: string;
  availableUserIds?: string[];
}

export default function EditMatchPage() {
  // Fallback team image (used in responsive preview)
  const defaultTeamImage = '/assets/cflogo2.png';
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const leagueId = params?.id ? String(params.id) : '';
  const matchId = params?.matchId ? String(params.matchId) : '';

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [matchDate, setMatchDate] = useState<Dayjs | null>(dayjs());
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs());
  const [duration, setDuration] = useState<number | ''>(90);
  const [location, setLocation] = useState('');
  const [homeTeamUsers, setHomeTeamUsers] = useState<PlayerOption[]>([]);
  const [awayTeamUsers, setAwayTeamUsers] = useState<PlayerOption[]>([]);
  const [homeCaptain, setHomeCaptain] = useState<PlayerOption | null>(null);
  const [awayCaptain, setAwayCaptain] = useState<PlayerOption | null>(null);

  // Images
  const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
  const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
  const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
  const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

  // Guests (staged)
  const [homeGuests, setHomeGuests] = useState<StagedGuest[]>([]);
  const [awayGuests, setAwayGuests] = useState<StagedGuest[]>([]);
  const originalGuestIds = useRef<Set<string>>(new Set());

  // Track original registered player ids to detect actual changes
  const originalHomeIdsRef = useRef<string[] | null>(null);
  const originalAwayIdsRef = useRef<string[] | null>(null);
  // Form ref for programmatic submit (auto-save after balance)
  const formRef = useRef<HTMLFormElement | null>(null);

  // Guest dialog
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestTeam, setGuestTeam] = useState<'home' | 'away'>('home');
  const [guestName, setGuestName] = useState('');

  // Player context menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: PlayerOption; team: 'home' | 'away' } | null>(null);

  // NEW: availability map
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityRecord['status']>>({});
  const [availabilityVersion, setAvailabilityVersion] = useState(0);

  const MIN_PLAYERS = 6;
  // Target balance for XP split
  const TARGET_XP_RATIO = 50; // aim for 50-50
  // const RATIO_TOLERANCE = 3;  // acceptable +/- range around target

  // Counts for UI banner (include guests now)
  const registeredHomeCount = React.useMemo(
    () => homeTeamUsers.length,
    [homeTeamUsers]
  );
  const registeredAwayCount = React.useMemo(
    () => awayTeamUsers.length,
    [awayTeamUsers]
  );
  const selectedRegistered = registeredHomeCount + registeredAwayCount;
  const hasMinPlayers = selectedRegistered >= MIN_PLAYERS;

  // REMOVE client notification route/helper – backend handles it on PATCH
  // const NOTIFY_ROUTE = ...
  // type NotifyPayload = ...
  // const notifySelectedPlayers = useCallback(..., [] as any);

  const parseJson = async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json().catch(() => ({}));
    return {};
  };

  // NEW: fetch availability
  const fetchAvailability = useCallback(async () => {
    if (!matchId || !token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/availability`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const j: AvailabilityApiResponse = await res.json().catch(() => ({} as AvailabilityApiResponse));
      if (!j.success) return;

      // Backend only sends available users. Mark them as 'available'.
      const map: Record<string, AvailabilityStatus> = {};
      (j.availableUserIds || []).forEach(id => { if (id) map[id] = 'available'; });

      setAvailabilityMap(map);          // others stay undefined => treated as not selectable
      setAvailabilityVersion(v => v + 1);
    } catch {
      /* silent */
    }
  }, [matchId, token]);

  // Menu handlers for player context menu
  const handlePlayerClick = (event: React.MouseEvent<HTMLElement>, player: PlayerOption, team: 'home' | 'away') => {
    setMenuAnchor(event.currentTarget);
    setSelectedPlayer({ player, team });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPlayer(null);
  };

  const handleRemovePlayer = () => {
    if (!selectedPlayer) return;
    const { player, team } = selectedPlayer;

    if (team === 'home') {
      // Remove from home team
      setHomeTeamUsers(prev => prev.filter(p => p.id !== player.id));
      // If it was the captain, clear captain
      if (homeCaptain?.id === player.id) setHomeCaptain(null);
      // If it's a guest, also remove from homeGuests
      if (player.isGuest && player.guestTempId) {
        const g = homeGuests.find(g => g.tempId === player.guestTempId);
        if (g) removeStagedGuest('home', g.tempId);
      }
    } else {
      // Remove from away team
      setAwayTeamUsers(prev => prev.filter(p => p.id !== player.id));
      // If it was the captain, clear captain
      if (awayCaptain?.id === player.id) setAwayCaptain(null);
      // If it's a guest, also remove from awayGuests
      if (player.isGuest && player.guestTempId) {
        const g = awayGuests.find(g => g.tempId === player.guestTempId);
        if (g) removeStagedGuest('away', g.tempId);
      }
    }

    handleMenuClose();
    toast.success('Player removed');
  };

  const handleSwitchTeam = () => {
    if (!selectedPlayer) return;
    const { player, team } = selectedPlayer;

    if (team === 'home') {
      // Move from home to away
      setHomeTeamUsers(prev => prev.filter(p => p.id !== player.id));
      setAwayTeamUsers(prev => [...prev, { ...player, team: 'away' }]);
      
      // If it was home captain, clear it
      if (homeCaptain?.id === player.id) setHomeCaptain(null);
      
      // If it's a guest, update the guest's team
      if (player.isGuest && player.guestTempId) {
        const g = homeGuests.find(g => g.tempId === player.guestTempId);
        if (g) {
          removeStagedGuest('home', g.tempId);
          setAwayGuests(prev => [...prev, { ...g, team: 'away' }]);
        }
      }
    } else {
      // Move from away to home
      setAwayTeamUsers(prev => prev.filter(p => p.id !== player.id));
      setHomeTeamUsers(prev => [...prev, { ...player, team: 'home' }]);
      
      // If it was away captain, clear it
      if (awayCaptain?.id === player.id) setAwayCaptain(null);
      
      // If it's a guest, update the guest's team
      if (player.isGuest && player.guestTempId) {
        const g = awayGuests.find(g => g.tempId === player.guestTempId);
        if (g) {
          removeStagedGuest('away', g.tempId);
          setHomeGuests(prev => [...prev, { ...g, team: 'home' }]);
        }
      }
    }

    handleMenuClose();
    toast.success('Player switched to other team');
  };

  // Helper: already picked in either team
  // const isAlreadyPicked = (id: string) =>
  // homeTeamUsers.some(p => p.id === id) || awayTeamUsers.some(p => p.id === id);

  // const canAddPlayer = (id: string, isGuest?: boolean) => {
  //   if (isGuest) return true;
  //   // Allow adding unless explicitly unavailable
  //   return availabilityMap[id] !== 'unavailable';
  // };

  // Add (or merge) this style object near other styles if you want reuse
  // const disabledOptionStyles = {
  //   opacity: 0.35,
  //   filter: 'grayscale(0.6)',
  //   pointerEvents: 'none',
  //   cursor: 'not-allowed'
  // };

  // Badge meta
  // const availabilityStyle = (st: string) => {
  //   switch (st) {
  //     case 'available': return { bg: '#1b5e20', color: '#a5d6a7', label: 'AVAILABLE' };
  //     case 'maybe': return { bg: '#795548', color: '#ffe0b2', label: 'MAYBE' };
  //     case 'unavailable': return { bg: '#b71c1c', color: '#ffcdd2', label: 'UNAVAILABLE' };
  //     default: return { bg: '#424242', color: '#e0e0e0', label: 'NO RESPONSE' };
  //   }
  // };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leagueRes, matchRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const leagueData = await parseJson(leagueRes);
      const matchData = await parseJson(matchRes);
      if (!leagueData?.success) throw new Error(leagueData?.message || 'League fetch failed');
      if (!matchData?.success) throw new Error(matchData?.message || 'Match fetch failed');
      setLeague(leagueData.league);
      const m: MatchResp = matchData.match;
      setHomeTeamName(m.homeTeamName || '');
      setAwayTeamName(m.awayTeamName || '');
      setLocation(m.location || '');
      const start = dayjs(m.start || m.date);
      const end = dayjs(m.end || m.start).isValid() ? dayjs(m.end) : start.add(90, 'minute');
      setMatchDate(start);
      setStartTime(start);
      const diff = end.diff(start, 'minute');
      setDuration(diff > 0 ? diff : 90);

      // Guests
      const guests = (m.guests || []) as Guest[];
      const homeG: StagedGuest[] = guests.filter(g => g.team === 'home').map(g => ({ tempId: `existing-${g.id}`, existingId: g.id, team: 'home', firstName: g.firstName, lastName: g.lastName, shirtNumber: g.shirtNumber }));
      const awayG: StagedGuest[] = guests.filter(g => g.team === 'away').map(g => ({ tempId: `existing-${g.id}`, existingId: g.id, team: 'away', firstName: g.firstName, lastName: g.lastName, shirtNumber: g.shirtNumber }));
      setHomeGuests(homeG); setAwayGuests(awayG);
      originalGuestIds.current = new Set(guests.map(g => g.id));

      // Players (exclude guests from arrays if backend didn't)
      const homeUsers = (m.homeTeamUsers || []).map(u => ({ ...u }));
      const awayUsers = (m.awayTeamUsers || []).map(u => ({ ...u }));
      setHomeTeamUsers([...homeUsers, ...homeG.map(g => guestToPlayer(g))]);
      setAwayTeamUsers([...awayUsers, ...awayG.map(g => guestToPlayer(g))]);

      // Track original registered player ids to detect actual changes
      originalHomeIdsRef.current = homeUsers.map(u => u.id);
      originalAwayIdsRef.current = awayUsers.map(u => u.id);

      if (m.homeCaptainId) {
        const cap = homeUsers.find(u => u.id === m.homeCaptainId);
        if (cap) setHomeCaptain(cap as PlayerOption);
      }
      if (m.awayCaptainId) {
        const cap = awayUsers.find(u => u.id === m.awayCaptainId);
        if (cap) setAwayCaptain(cap as PlayerOption);
      }
      if (m.homeTeamImage) setHomeTeamImagePreview(m.homeTeamImage.startsWith('http') ? m.homeTeamImage : `${process.env.NEXT_PUBLIC_API_URL}${m.homeTeamImage}`);
      if (m.awayTeamImage) setAwayTeamImagePreview(m.awayTeamImage.startsWith('http') ? m.awayTeamImage : `${process.env.NEXT_PUBLIC_API_URL}${m.awayTeamImage}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Load failed';
      setError(msg);
    } finally { setLoading(false); }
  }, [leagueId, matchId, token]);

  useEffect(() => { if (leagueId && matchId && token) fetchData(); }, [leagueId, matchId, token, fetchData]);
  useEffect(() => { if (leagueId && matchId && token) fetchAvailability(); }, [leagueId, matchId, token, fetchAvailability]);

  const guestToPlayer = (g: StagedGuest): PlayerOption => ({ id: `guest-${g.tempId}`, firstName: g.firstName, lastName: g.lastName, email: '', isGuest: true, guestTempId: g.tempId, team: g.team, existingGuestId: g.existingId });

  // Prediction from API
  const [homeWinChance, setHomeWinChance] = useState<number | null>(null);
  const [awayWinChance, setAwayWinChance] = useState<number | null>(null);
  const [, setHomeStrength] = useState<number | null>(null);
  const [, setAwayStrength] = useState<number | null>(null);

  // XP map for league (used to balance by XP)
  const [userLeagueXP, setUserLeagueXP] = useState<Record<string, number>>({});
  const [xpLoading, setXpLoading] = useState(false);
  // Track balancing run to prevent repeated clicks and show progress
  const [isBalancing, setIsBalancing] = useState(false);

  const ensureXPMap = useCallback(async () => {
    if (!leagueId || !token) return {} as Record<string, number>;
    // If we already have it, return
    if (userLeagueXP && Object.keys(userLeagueXP).length > 0) return userLeagueXP;
    try {
      setXpLoading(true);
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/xp`, { headers });
      if (!res.ok) throw new Error('Failed to fetch XP');
      const json = await res.json();
      // Support either { xp } or { data: { xp } }
      const xpMap = (json?.xp || json?.data?.xp || {}) as Record<string, number>;
      setUserLeagueXP(xpMap);
      return xpMap;
    } catch {
      setUserLeagueXP({});
      return {} as Record<string, number>;
    } finally {
      setXpLoading(false);
    }
  }, [leagueId, token, userLeagueXP]);

  const fetchPrediction = useCallback(async () => {
    if (!matchId || !token) return;
    try {
      // Only send registered user IDs; include total counts to capture guests
      const homeIds = homeTeamUsers.filter(u => !u.isGuest).map(u => u.id);
      const awayIds = awayTeamUsers.filter(u => !u.isGuest).map(u => u.id);
      const payload = {
        homeIds,
        awayIds,
        homeTotal: homeTeamUsers.length,
        awayTotal: awayTeamUsers.length,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/prediction`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return;
      const j = await res.json();
      if (!j?.success) return;
      setHomeWinChance(typeof j.home?.winPct === 'number' ? j.home.winPct : null);
      setAwayWinChance(typeof j.away?.winPct === 'number' ? j.away.winPct : null);
      setHomeStrength(typeof j.home?.average === 'number' ? Math.round(j.home.average) : null);
      setAwayStrength(typeof j.away?.average === 'number' ? Math.round(j.away.average) : null);
    } catch { }
  }, [matchId, token, homeTeamUsers, awayTeamUsers]);

  // Minimal skill display helper for UI only
  const calcSkill = (p?: PlayerOption | null) => {
    if (!p) return 0;
    if (p.isGuest) return 50;
    const s = p.skills;
    const keys: (keyof NonNullable<User['skills']>)[] = ['dribbling', 'shooting', 'passing', 'pace', 'defending', 'physical'];
    const total = keys.reduce((sum, k) => sum + (s?.[k] ?? 0), 0);
    return Math.round(total / keys.length);
  };

  // Shuffle (pure random for registered players; keep guests on their original teams)
  const shuffleTeams = () => {
    const homeReg = homeTeamUsers.filter(p => !p.isGuest);
    const awayReg = awayTeamUsers.filter(p => !p.isGuest);
    const combined = [...homeReg, ...awayReg];
    if (combined.length < 2) { toast.error('Need at least 2 players'); return; }
    // Fisher-Yates shuffle
    const arr = [...combined];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Preserve original registered counts per team for better UX
    const newHomeReg = arr.slice(0, homeReg.length);
    const newAwayReg = arr.slice(homeReg.length);
    const newHome = [...newHomeReg, ...homeTeamUsers.filter(p => p.isGuest)];
    const newAway = [...newAwayReg, ...awayTeamUsers.filter(p => p.isGuest)];
    setHomeTeamUsers(newHome);
    setAwayTeamUsers(newAway);
    setHomeCaptain(null); setAwayCaptain(null);
    toast.success('Teams shuffled randomly');
    // Update prediction immediately
    fetchPrediction();
  };

  // Balance by XP using backend XP map for league (fallback to skill when no XP)
  const balanceTeams = async () => {
    if (isBalancing) return;
    setIsBalancing(true);
    try {
      const combinedReg = [...homeTeamUsers.filter(p => !p.isGuest), ...awayTeamUsers.filter(p => !p.isGuest)];
      if (combinedReg.length < 2) { toast.error('Need at least 2 registered players'); return; }

      const xpMap = await ensureXPMap();

      // Keep guests on current teams; include their contribution as league-average
      const homeGuestsOnly = homeTeamUsers.filter(p => p.isGuest);
      const awayGuestsOnly = awayTeamUsers.filter(p => p.isGuest);

      const totalPlayers = combinedReg.length + homeGuestsOnly.length + awayGuestsOnly.length;
      const targetHomeTotal = Math.ceil(totalPlayers / 2);
      const targetAwayTotal = totalPlayers - targetHomeTotal;
      const targetHomeReg = Math.max(0, targetHomeTotal - homeGuestsOnly.length);
      const targetAwayReg = Math.max(0, targetAwayTotal - awayGuestsOnly.length);

      // Build lookup for player objects
      const byId = new Map<string, PlayerOption>();
      combinedReg.forEach(p => byId.set(p.id, p));

      // Compute rating basis: XP preferred, fallback to skill if all zeros
      const ratingsArr = combinedReg.map(p => ({ id: p.id, xp: Number(xpMap[p.id] ?? 0), skill: calcSkill(p) }));
      const xpValues = ratingsArr.map(r => r.xp);
      const totalXp = xpValues.reduce((a, b) => a + b, 0);
      const hasAnyXP = xpValues.some(v => v > 0);
      const basis: 'xp' | 'skill' = hasAnyXP && totalXp > 0 ? 'xp' : 'skill';

      const idToRating = new Map<string, number>();
      if (basis === 'xp') {
        ratingsArr.forEach(r => idToRating.set(r.id, r.xp));
      } else {
        ratingsArr.forEach(r => idToRating.set(r.id, r.skill));
      }

      // Guest contribution: use median of non-zero ratings to avoid skew; fallback to average if needed
      const values = Array.from(idToRating.values());
      const nonZero = values.filter(v => v > 0).sort((a, b) => a - b);
      const avgVal = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
      const medianVal = (arr: number[]) => {
        if (arr.length === 0) return 0;
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
      };
      const guestValue = nonZero.length > 0 ? medianVal(nonZero) : avgVal(values);

      // Start sums with guest contributions (kept fixed)
      const homeGuestSum = guestValue * homeGuestsOnly.length;
      const awayGuestSum = guestValue * awayGuestsOnly.length;

      // Helper to run one greedy + swap pass for a given order
      const runOne = (order: Array<{ id: string; rating: number }>) => {
        const newHomeIds: string[] = [];
        const newAwayIds: string[] = [];
        let homeSum = homeGuestSum; // include guests
        let awaySum = awayGuestSum;
        for (const item of order) {
          const canHome = newHomeIds.length < targetHomeReg;
          const canAway = newAwayIds.length < targetAwayReg;
          if (canHome && canAway) {
            const homeAfter = homeSum + item.rating;
            const awayAfter = awaySum;
            const totalAfterHome = homeAfter + awayAfter;
            const homePctIfHome = totalAfterHome > 0 ? (homeAfter / totalAfterHome) * 100 : 50;

            const homeAfter2 = homeSum;
            const awayAfter2 = awaySum + item.rating;
            const totalAfterAway = homeAfter2 + awayAfter2;
            const homePctIfAway = totalAfterAway > 0 ? (homeAfter2 / totalAfterAway) * 100 : 50;

            const deltaHome = Math.abs(homePctIfHome - TARGET_XP_RATIO);
            const deltaAway = Math.abs(homePctIfAway - TARGET_XP_RATIO);
            if (deltaHome < deltaAway || (deltaHome === deltaAway && homeSum <= awaySum)) {
              newHomeIds.push(item.id); homeSum += item.rating;
            } else {
              newAwayIds.push(item.id); awaySum += item.rating;
            }
          } else if (canHome) {
            newHomeIds.push(item.id); homeSum += item.rating;
          } else {
            newAwayIds.push(item.id); awaySum += item.rating;
          }
        }

        // Pair-swap optimization
        const ratingOf = (id: string) => idToRating.get(id) ?? 0;
        const pct = () => {
          const tot = homeSum + awaySum;
          return tot > 0 ? (homeSum / tot) * 100 : 50;
        };
        let iterations = 0;
        const maxIterations = 120;
        while (iterations < maxIterations) {
          iterations++;
          let bestImprovement = 0;
          let bestSwap: { hIdx: number; aIdx: number } | null = null;
          const currPctDelta = Math.abs(pct() - TARGET_XP_RATIO);
          for (let hIdx = 0; hIdx < newHomeIds.length; hIdx++) {
            const hId = newHomeIds[hIdx];
            const hR = ratingOf(hId);
            for (let aIdx = 0; aIdx < newAwayIds.length; aIdx++) {
              const aId = newAwayIds[aIdx];
              const aR = ratingOf(aId);
              const homeAfter = homeSum - hR + aR;
              const awayAfter = awaySum - aR + hR;
              const totAfter = homeAfter + awayAfter;
              const homePctAfter = totAfter > 0 ? (homeAfter / totAfter) * 100 : 50;
              const delta = Math.abs(homePctAfter - TARGET_XP_RATIO);
              const improvement = currPctDelta - delta;
              if (improvement > bestImprovement) {
                bestImprovement = improvement;
                bestSwap = { hIdx, aIdx };
              }
            }
          }
          if (bestSwap && bestImprovement > 0) {
            const hId = newHomeIds[bestSwap.hIdx];
            const aId = newAwayIds[bestSwap.aIdx];
            const hR = ratingOf(hId);
            const aR = ratingOf(aId);
            newHomeIds[bestSwap.hIdx] = aId;
            newAwayIds[bestSwap.aIdx] = hId;
            homeSum = homeSum - hR + aR;
            awaySum = awaySum - aR + hR;
            continue;
          }
          break;
        }

        const closeness = Math.abs(((homeSum) / (homeSum + awaySum || 1)) * 100 - TARGET_XP_RATIO);
        return { newHomeIds, newAwayIds, homeSum, awaySum, closeness };
      };

      // Prepare orders
      const withRating = combinedReg.map(p => ({ id: p.id, rating: idToRating.get(p.id) ?? 0 }));
      const desc = [...withRating].sort((a, b) => b.rating - a.rating);
      const asc = [...withRating].sort((a, b) => a.rating - b.rating);
      const randomize = (arr: typeof withRating) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
        return a;
      };

      const candidates = [desc, asc];
      for (let i = 0; i < 24; i++) candidates.push(randomize(withRating)); // more random starts improves robustness

      let best = null as null | ReturnType<typeof runOne>;
      for (const ord of candidates) {
        const result = runOne(ord);
        if (!best || result.closeness < best.closeness) best = result;
        if (best.closeness <= 0.5) break; // good enough
      }

      let chosen = best!;

      // Stochastic local search: random pair and 2-for-2 swaps to further refine
      const ratingOf = (id: string) => idToRating.get(id) ?? 0;
      const closenessOf = (homeIds: string[], awayIds: string[]) => {
        const h = homeIds.reduce((s, id) => s + ratingOf(id), homeGuestSum);
        const a = awayIds.reduce((s, id) => s + ratingOf(id), awayGuestSum);
        const tot = h + a;
        return Math.abs(((h / (tot || 1)) * 100) - TARGET_XP_RATIO);
      };
      const tryImprove = (maxIters = 350) => {
        let homeIds = [...chosen.newHomeIds];
        let awayIds = [...chosen.newAwayIds];
        let bestClose = chosen.closeness;

        const applyIfBetter = (newHome: string[], newAway: string[]) => {
          const c = closenessOf(newHome, newAway);
          if (c + 1e-6 < bestClose) { // small epsilon to avoid float noise
            homeIds = newHome;
            awayIds = newAway;
            bestClose = c;
            return true;
          }
          return false;
        };

        const randInt = (n: number) => Math.floor(Math.random() * n);

        for (let it = 0; it < maxIters; it++) {
          // Alternate between 1-for-1 and 2-for-2 attempts
          if (Math.random() < 0.7) {
            // 1-for-1 random pair swap
            if (homeIds.length > 0 && awayIds.length > 0) {
              const hi = randInt(homeIds.length);
              const ai = randInt(awayIds.length);
              const newHome = [...homeIds];
              const newAway = [...awayIds];
              const tmp = newHome[hi];
              newHome[hi] = newAway[ai];
              newAway[ai] = tmp;
              applyIfBetter(newHome, newAway);
            }
          } else {
            // 2-for-2 swap (sampled)
            if (homeIds.length > 1 && awayIds.length > 1) {
              const hi1 = randInt(homeIds.length);
              let hi2 = randInt(homeIds.length);
              if (hi2 === hi1) hi2 = (hi2 + 1) % homeIds.length;
              const ai1 = randInt(awayIds.length);
              let ai2 = randInt(awayIds.length);
              if (ai2 === ai1) ai2 = (ai2 + 1) % awayIds.length;

              const newHome = [...homeIds];
              const newAway = [...awayIds];
              // swap pairs
              const hA = newHome[Math.max(hi1, hi2)];
              const hB = newHome[Math.min(hi1, hi2)];
              const aA = newAway[Math.max(ai1, ai2)];
              const aB = newAway[Math.min(ai1, ai2)];
              newHome[Math.max(hi1, hi2)] = aA;
              newHome[Math.min(hi1, hi2)] = aB;
              newAway[Math.max(ai1, ai2)] = hA;
              newAway[Math.min(ai1, ai2)] = hB;
              applyIfBetter(newHome, newAway);
            }
          }
        }

        // Update chosen if improved
        if (bestClose + 1e-6 < chosen.closeness) {
          const hSum = homeIds.reduce((s, id) => s + ratingOf(id), homeGuestSum);
          const aSum = awayIds.reduce((s, id) => s + ratingOf(id), awayGuestSum);
          chosen = { newHomeIds: homeIds, newAwayIds: awayIds, homeSum: hSum, awaySum: aSum, closeness: bestClose };
        }
      };

      tryImprove(250);

      // Deterministic directed 1-for-1 swap loop: always take the best improving swap until no gain
      const directedSwapImprove = (maxSteps = 120) => {
        const ratingOf = (id: string) => idToRating.get(id) ?? 0;
        const homeIds = [...chosen.newHomeIds];
        const awayIds = [...chosen.newAwayIds];
        let homeSum = chosen.homeSum;
        let awaySum = chosen.awaySum;
        let bestClose = chosen.closeness;

        for (let step = 0; step < maxSteps; step++) {
          const diff = homeSum - awaySum; // positive => home stronger
          const stronger = diff >= 0 ? 'home' : 'away';
          const fromIds = stronger === 'home' ? homeIds : awayIds;
          const toIds = stronger === 'home' ? awayIds : homeIds;

          let bestGain = 0;
          let bestPair: { fromIdx: number; toIdx: number } | null = null;
          const currClose = Math.abs(((homeSum) / ((homeSum + awaySum) || 1)) * 100 - TARGET_XP_RATIO);

          // Scan pairs but bias by rating order to be efficient
          const fromSorted = fromIds
            .map((id, idx) => ({ id, idx, r: ratingOf(id) }))
            .sort((a, b) => Math.abs(diff) >= 0 ? b.r - a.r : a.r - b.r); // prioritize impactful
          const toSorted = toIds
            .map((id, idx) => ({ id, idx, r: ratingOf(id) }))
            .sort((a, b) => a.r - b.r); // prefer smaller to send back when stronger side gives a big one

          const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
          const limitFrom = clamp(Math.ceil(fromSorted.length * 0.75), 1, fromSorted.length); // scan top 75%
          const limitTo = clamp(Math.ceil(toSorted.length * 0.75), 1, toSorted.length);

          for (let i = 0; i < limitFrom; i++) {
            const f = fromSorted[i];
            // Best counterpart in 'to' is the one that brings sums closer: target a ~ f.r - diff/2
            const ideal = f.r - diff / 2;
            let bestJ = -1;
            let bestJDist = Infinity;
            for (let j = 0; j < limitTo; j++) {
              const cand = toSorted[j];
              const d = Math.abs(cand.r - ideal);
              if (d < bestJDist) { bestJDist = d; bestJ = j; }
            }
            if (bestJ >= 0) {
              const t = toSorted[bestJ];
              const newHome = stronger === 'home'
                ? homeSum - f.r + t.r
                : homeSum + f.r - t.r;
              const newAway = stronger === 'home'
                ? awaySum - t.r + f.r
                : awaySum + t.r - f.r;
              const tot = newHome + newAway;
              const newClose = Math.abs(((newHome / (tot || 1)) * 100) - TARGET_XP_RATIO);
              const gain = currClose - newClose;
              if (gain > bestGain + 1e-9) {
                bestGain = gain;
                bestPair = { fromIdx: f.idx, toIdx: t.idx };
              }
            }
          }

          if (bestPair && bestGain > 0) {
            if (stronger === 'home') {
              const fId = homeIds[bestPair.fromIdx];
              const tId = awayIds[bestPair.toIdx];
              const fR = ratingOf(fId);
              const tR = ratingOf(tId);
              homeIds[bestPair.fromIdx] = tId;
              awayIds[bestPair.toIdx] = fId;
              homeSum = homeSum - fR + tR;
              awaySum = awaySum - tR + fR;
            } else {
              const fId = awayIds[bestPair.fromIdx];
              const tId = homeIds[bestPair.toIdx];
              const fR = ratingOf(fId);
              const tR = ratingOf(tId);
              awayIds[bestPair.fromIdx] = tId;
              homeIds[bestPair.toIdx] = fId;
              awaySum = awaySum - fR + tR;
              homeSum = homeSum - tR + fR;
            }

            const tot2 = homeSum + awaySum;
            bestClose = Math.abs(((homeSum / (tot2 || 1)) * 100) - TARGET_XP_RATIO);
          } else {
            break; // no improving directed swap
          }
        }

        if (bestClose + 1e-6 < chosen.closeness) {
          chosen = { newHomeIds: homeIds, newAwayIds: awayIds, homeSum, awaySum, closeness: bestClose };
        }
      };

      // Keep trying until no further improvement within a few rounds
      let rounds = 0;
      while (rounds < 5) {
        const before = chosen.closeness;
        tryImprove(400);
        directedSwapImprove(140);
        if (chosen.closeness < before - 1e-6) {
          rounds++;
          continue;
        }
        break;
      }
      // Build final teams (keep guests on their sides)
      const newHome = [...chosen.newHomeIds.map(id => byId.get(id)!).filter(Boolean), ...homeGuestsOnly];
      const newAway = [...chosen.newAwayIds.map(id => byId.get(id)!).filter(Boolean), ...awayGuestsOnly];

      setHomeTeamUsers(newHome);
      setAwayTeamUsers(newAway);
      setHomeCaptain(null); setAwayCaptain(null);

      // Report final ratio with basis label
      // const tot = chosen.homeSum + chosen.awaySum;
      // const homePct = tot > 0 ? Math.round((chosen.homeSum / tot) * 100) : 50;
      // const awayPct = 100 - homePct;
      toast.success(`Teams balanced by League XP`);
      fetchPrediction();
      return;
    } catch {
      // Optional: Log or show a fallback error
      toast.error('Balancing failed. Please try again.');
    } finally {
      setIsBalancing(false);
    }
  };

  // Drag handler
  const movePlayer = (player: PlayerOption, target: 'home' | 'away') => {
    if (player.isGuest) { // allow moving guest too
      if (target === 'home') {
        if (!homeTeamUsers.find(p => p.id === player.id)) { setHomeTeamUsers(p => [...p, player]); setAwayTeamUsers(p => p.filter(p => p.id !== player.id)); if (awayCaptain?.id === player.id) setAwayCaptain(null); }
      } else {
        if (!awayTeamUsers.find(p => p.id === player.id)) { setAwayTeamUsers(p => [...p, player]); setHomeTeamUsers(p => p.filter(p => p.id !== player.id)); if (homeCaptain?.id === player.id) setHomeCaptain(null); }
      }
      return;
    }
    if (target === 'home') { if (!homeTeamUsers.find(p => p.id === player.id)) { setHomeTeamUsers(p => [...p, player]); setAwayTeamUsers(p => p.filter(p => p.id !== player.id)); if (awayCaptain?.id === player.id) setAwayCaptain(null); } }
    else { if (!awayTeamUsers.find(p => p.id === player.id)) { setAwayTeamUsers(p => [...p, player]); setHomeTeamUsers(p => p.filter(p => p.id !== player.id)); if (homeCaptain?.id === player.id) setHomeCaptain(null); } }
  };

  // Add new guest
  const handleAddGuest = () => {
    const trimmed = guestName.trim(); if (!trimmed) return toast.error('Enter guest name');
    const parts = trimmed.split(/\s+/); const firstName = parts[0]; const lastName = parts.slice(1).join(' ') || 'Guest';
    const tempId = `${guestTeam}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; const sg: StagedGuest = { tempId, team: guestTeam, firstName, lastName };
    if (guestTeam === 'home') { setHomeGuests(p => [sg, ...p]); setHomeTeamUsers(p => [guestToPlayer(sg), ...p]); }
    else { setAwayGuests(p => [sg, ...p]); setAwayTeamUsers(p => [guestToPlayer(sg), ...p]); }
    toast.success('Guest added'); setGuestName(''); setGuestTeam('home'); setGuestDialogOpen(false);
  };

  const removeStagedGuest = (team: 'home' | 'away', tempId: string) => {
    if (team === 'home') { setHomeGuests(g => g.filter(x => x.tempId !== tempId)); setHomeTeamUsers(p => p.filter(x => x.guestTempId !== tempId)); if (homeCaptain?.guestTempId === tempId) setHomeCaptain(null); }
    else { setAwayGuests(g => g.filter(x => x.tempId !== tempId)); setAwayTeamUsers(p => p.filter(x => x.guestTempId !== tempId)); if (awayCaptain?.guestTempId === tempId) setAwayCaptain(null); }
  };

  // const homeGuestOptions: PlayerOption[] = homeGuests.map(guestToPlayer);
  // const awayGuestOptions: PlayerOption[] = awayGuests.map(guestToPlayer);
  const homePlayerOptions: PlayerOption[] = [
    ...(league?.members || []).filter(m => !awayTeamUsers.some(p => p.id === m.id)),
    ...homeGuests.map(guestToPlayer)
  ];
  const awayPlayerOptions: PlayerOption[] = [
    ...(league?.members || []).filter(m => !homeTeamUsers.some(p => p.id === m.id)),
    ...awayGuests.map(guestToPlayer)
  ];

  // When teams change (by content, not only count), re-fetch prediction
  const homeIdsKey = React.useMemo(() => homeTeamUsers.map(u => u.id).join('|'), [homeTeamUsers]);
  const awayIdsKey = React.useMemo(() => awayTeamUsers.map(u => u.id).join('|'), [awayTeamUsers]);
  useEffect(() => {
    fetchPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeIdsKey, awayIdsKey]);

  // Minimum players required
  // const totalSelectedPlayers = homeTeamUsers.length + awayTeamUsers.length;
  // const hasMinPlayers = totalSelectedPlayers >= 6;

  // Images
  const handleHomeTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setHomeTeamImage(f); const r = new FileReader(); r.onload = ev => setHomeTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
  const handleAwayTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setAwayTeamImage(f); const r = new FileReader(); r.onload = ev => setAwayTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
  const handleRemoveHomeTeamImage = () => { setHomeTeamImage(null); setHomeTeamImagePreview(null); };
  const handleRemoveAwayTeamImage = () => { setAwayTeamImage(null); setAwayTeamImagePreview(null); };

  // Submit (PATCH)
  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError(null);

    const registered = (arr: PlayerOption[]) => arr.filter(u => !u.isGuest).map(u => u.id);
    const newHomeIds = registered(homeTeamUsers);
    const newAwayIds = registered(awayTeamUsers);

    // const sameSet = (a: string[], b: string[]) => {
    //   if (a.length !== b.length) return false;
    //   const B = new Set(b);
    //   return a.every(x => B.has(x));
    // };

    // const homeOrig = originalHomeIdsRef.current;
    // const awayOrig = originalAwayIdsRef.current;
    // const teamsChanged =
    //   homeOrig !== null &&
    //   awayOrig !== null &&
    //   (!sameSet(newHomeIds, homeOrig) || !sameSet(newAwayIds, awayOrig));

    // NEW: include guests in PATCH so server can count and sync them in one step
    const homeGuestsPayload = homeGuests.map(g => ({
      id: g.existingId,
      team: 'home',
      firstName: g.firstName,
      lastName: g.lastName,
      shirtNumber: g.shirtNumber
    }));
    const awayGuestsPayload = awayGuests.map(g => ({
      id: g.existingId,
      team: 'away',
      firstName: g.firstName,
      lastName: g.lastName,
      shirtNumber: g.shirtNumber
    }));

    // NEW: include guests in the min-players check (total selected on both teams)
    const selectedTotal = homeTeamUsers.length + awayTeamUsers.length;

    // Notify whenever < 6 players total
    const needsMore = selectedTotal > 0 && selectedTotal < MIN_PLAYERS;

    if (needsMore) {
      toast('Fewer than 6 players. Not saving teams, notifying selected players.', { icon: '🔔' });
    }

    try {
      const formData = new FormData();

      formData.append('homeTeamName', homeTeamName);
      formData.append('awayTeamName', awayTeamName);

      if (matchDate && startTime) {
        const start = matchDate.hour(startTime.hour()).minute(startTime.minute()).second(0).millisecond(0);
        const matchDuration = duration || 90; const end = start.add(matchDuration, 'minute');
        formData.append('date', start.toISOString());
        formData.append('start', start.toISOString());
        formData.append('end', end.toISOString());
      }

      formData.append('location', location);

      // Always send selected captains if they are registered users
      const homeCaptainIdToSend = homeCaptain && !homeCaptain.isGuest ? homeCaptain.id : undefined;
      const awayCaptainIdToSend = awayCaptain && !awayCaptain.isGuest ? awayCaptain.id : undefined;
      if (homeCaptainIdToSend) formData.append('homeCaptainId', homeCaptainIdToSend);
      if (awayCaptainIdToSend) formData.append('awayCaptainId', awayCaptainIdToSend);

      // Always send teams and guests so backend can persist all changes in one go
      formData.append('homeTeamUsers', JSON.stringify(newHomeIds));
      formData.append('awayTeamUsers', JSON.stringify(newAwayIds));
      formData.append('homeGuests', JSON.stringify(homeGuestsPayload));
      formData.append('awayGuests', JSON.stringify(awayGuestsPayload));

      if (needsMore) {
        formData.append('notifyOnly', 'true');
      }

      if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
      if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const j = await res.json().catch(() => ({}));
      if (!j.success) throw new Error(j.message || 'Update failed');

      // Guests already synced via PATCH; no extra POST/DELETE calls needed
      // Clear matches cache and navigate
      try { cacheManager.clearCache('matches_cache'); } catch { }
      toast.success('Match updated');
      if (needsMore) toast.success('Players notified (server), teams not saved');
      router.push(`/league/${leagueId}`);
    } catch (er: unknown) {
      const msg = er instanceof Error ? er.message : 'Update error';
      setError(msg);
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
  if (error || !league) return <Box sx={{ p: 4, color: 'white' }}><Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white', background: '#388e3c', '&:hover': { background: '#388e3c' } }}>Back</Button><Typography color="error">{error || 'Load failed'}</Typography></Box>;

  const inputStyles = { '& .MuiOutlinedInput-root': { color: '#E5E7EB', background: 'rgba(255,255,255,0.02)', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#e56a16', borderWidth: '2px', boxShadow: '0 0 0 3px rgba(229,106,22,0.1)' }, '& input': { color: '#E5E7EB' } }, '& .MuiInputLabel-root': { color: '#9CA3AF', fontWeight: 500, '&.Mui-focused': { color: '#e56a16' } }, '& .MuiSvgIcon-root': { color: '#E5E7EB' } };
  const autocompleteStyles = { '& .MuiOutlinedInput-root': { color: '#E5E7EB', background: 'rgba(255,255,255,0.02)', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#e56a16', borderWidth: '2px', boxShadow: '0 0 0 3px rgba(229,106,22,0.1)' }, '& .MuiChip-root': { background: 'rgba(229,106,22,0.15)', color: '#E5E7EB', border: '1px solid rgba(229,106,22,0.3)' } }, '& .MuiInputLabel-root': { color: '#9CA3AF', fontWeight: 500, '&.Mui-focused': { color: '#e56a16' } } };
  // Enhanced ShirtAvatar supporting responsive size objects
  const ShirtAvatar = ({ number, size = 56 }: { number?: string | number; size?: number | { xs: number; sm: number; md?: number }; }) => {
    const baseSize = typeof size === 'number' ? size : (size.sm || size.xs);
    const fontSize = baseSize >= 56 ? 16 : baseSize >= 48 ? 14 : baseSize >= 40 ? 12 : baseSize >= 32 ? 10 : 8;
    return (
      <Box sx={{ position: 'relative', width: baseSize, height: baseSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
        <img src={ShirtImg.src} alt='Shirt' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        <Typography component='span' sx={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize, color: '#111', textShadow: '0 1px 1px rgba(255,255,255,0.6)', lineHeight: 1 }}>
          {number || '0'}
        </Typography>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 4, minHeight: '100vh', color: '#E5E7EB' }}>
      {/* Close Button */}
      <CloseButton fallbackRoute="/dashboard" />
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
            <form ref={formRef} onSubmit={handleUpdateMatch} style={{ width: '100%' }}>
              <Paper sx={{ p: 4, bgcolor: 'rgba(15,15,15,0.95)', color: '#E5E7EB', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  {/* Updated heading styling to match main page (Anton, uppercase, large, glow) */}
                  <Typography variant="h3" sx={{
                    //  mb: { xs: 3, md: 4 },
                    color: '#fff',
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
                    Edit Match
                  </Typography>
                  <Button
                    startIcon={<UserPlus size={20} />}
                    variant='contained'
                    onClick={() => setGuestDialogOpen(true)}
                    sx={{
                      background: 'linear-gradient(135deg,#e56a16,#cf2326)',
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 3,
                      px: { xs: 2, sm: 3 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)', transform: 'translateY(-2px)' },
                      transition: 'all .25s ease'
                    }}
                  >
                    Add Guest
                  </Button>
                </Box>
                {/* Updated Team & Player Selection Section */}
                <Grid container spacing={3}>
                  {/* Team Names & Images */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'row', sm: 'row' } }}>
                      {/* Home Team */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#43a047', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Home Team</Typography>
                        <TextField
                          label="Team Name"
                          value={homeTeamName}
                          onChange={(e) => setHomeTeamName(e.target.value)}
                          required
                          fullWidth
                          sx={{ ...inputStyles, mb: 2 }}
                        />
                        <Box>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="home-team-image-upload"
                            type="file"
                            onChange={handleHomeTeamImageUpload}
                          />
                          <TextField
                            fullWidth
                            label="Team Logo"
                            value={homeTeamImage ? homeTeamImage.name : ''}
                            onClick={() => {
                              const input = document.getElementById('home-team-image-upload');
                              input?.click();
                            }}
                            InputProps={{
                              readOnly: true,
                              style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer' },
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      sx={{
                                        color: '#43a047',
                                        borderColor: '#43a047',
                                        '&:hover': { borderColor: '#388e3c', backgroundColor: 'rgba(67, 160, 71, 0.1)' },
                                        display: { xs: 'none', sm: 'inline-flex' }
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const input = document.getElementById('home-team-image-upload') as HTMLInputElement | null;
                                        input?.click();
                                      }}
                                    >
                                      Browse
                                    </Button>
                                    {homeTeamImage && (
                                      <IconButton onClick={(e) => { e.stopPropagation(); handleRemoveHomeTeamImage(); }} size="small" sx={{ color: '#f44336' }}>
                                        <X size={16} />
                                      </IconButton>
                                    )}
                                  </Box>
                                </InputAdornment>
                              )
                            }}
                            sx={{ ...inputStyles }}
                          />
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={homeTeamImagePreview || defaultTeamImage}
                              alt="Home Team"
                              imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                              sx={{ width: 50, height: 50, border: '2px solid #43a047', '& .MuiAvatar-img': { objectFit: 'contain' } }}
                            />
                            <Typography variant="body2" sx={{ color: '#B2DFDB' }}>Logo Preview</Typography>
                          </Box>
                        </Box>
                      </Box>
                      {/* Away Team */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#ef5350', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Away Team</Typography>
                        <TextField
                          label="Team Name"
                          value={awayTeamName}
                          onChange={(e) => setAwayTeamName(e.target.value)}
                          required
                          fullWidth
                          sx={{ ...inputStyles, mb: 2 }}
                        />
                        <Box>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="away-team-image-upload"
                            type="file"
                            onChange={handleAwayTeamImageUpload}
                          />
                          <TextField
                            fullWidth
                            label="Team Logo"
                            value={awayTeamImage ? awayTeamImage.name : ''}
                            onClick={() => {
                              const input = document.getElementById('away-team-image-upload');
                              input?.click();
                            }}
                            InputProps={{
                              readOnly: true,
                              style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer' },
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      sx={{
                                        color: '#ef5350',
                                        borderColor: '#ef5350',
                                        '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(239, 83, 80, 0.1)' },
                                        display: { xs: 'none', sm: 'inline-flex' }
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const input = document.getElementById('away-team-image-upload') as HTMLInputElement | null;
                                        input?.click();
                                      }}
                                    >
                                      Browse
                                    </Button>
                                    {awayTeamImage && (
                                      <IconButton onClick={(e) => { e.stopPropagation(); handleRemoveAwayTeamImage(); }} size="small" sx={{ color: '#f44336' }}>
                                        <X size={16} />
                                      </IconButton>
                                    )}
                                  </Box>
                                </InputAdornment>
                              )
                            }}
                            sx={{ ...inputStyles }}
                          />
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={awayTeamImagePreview || defaultTeamImage}
                              alt="Away Team"
                              imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                              sx={{ width: 50, height: 50, border: '2px solid #ef5350', '& .MuiAvatar-img': { objectFit: 'contain' } }}
                            />
                            <Typography variant="body2" sx={{ color: '#EF9A9A' }}>Logo Preview</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Player Selection */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Team Selection</Typography>
                      <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                          startIcon={<Shuffle size={18} />}
                          variant="outlined"
                          onClick={shuffleTeams}
                          disabled={homeTeamUsers.filter(p => !p.isGuest).length + awayTeamUsers.filter(p => !p.isGuest).length < 2}
                          size="medium"
                          sx={{
                            borderColor: '#e56a16',
                            color: '#e56a16',
                            fontWeight: 600,
                            borderRadius: 3,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            width: { xs: '100%', sm: 'auto' },
                            height: { xs: 32, sm: 36 },
                            '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(229, 106, 22, 0.1)' }
                          }}
                        >
                          Shuffle
                        </Button>
                        <Button
                          startIcon={<Scale size={18} />}
                          variant="outlined"
                          onClick={balanceTeams}
                          disabled={xpLoading || isBalancing || (homeTeamUsers.filter(p => !p.isGuest).length + awayTeamUsers.filter(p => !p.isGuest).length < 2)}
                          size="medium"
                          sx={{
                            borderColor: '#43a047',
                            color: '#43a047',
                            fontWeight: 600,
                            borderRadius: 3,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            width: { xs: '100%', sm: 'auto' },
                            height: { xs: 32, sm: 36 },
                            '&:hover': { borderColor: '#2e7d32', backgroundColor: 'rgba(67, 160, 71, 0.1)' }
                          }}
                        >
                          {xpLoading || isBalancing ? 'Balancing…' : 'Balance Team'}
                        </Button>
                      </Box>
                    </Box>

                    {/* Warn when fewer than 6 registered players are selected */}
                    {selectedRegistered > 0 && !hasMinPlayers && (
                      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        Only {selectedRegistered} registered players selected. On Save, players will be notified and teams won’t be saved yet.
                      </Alert>
                    )}

                    {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                      <Box sx={{ mb: 3, p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" sx={{ mb: 2, color: '#9CA3AF', textAlign: 'center' }}>
                          💡 Drag players between teams to balance. Equal teams create better matches!
                        </Typography>
                      </Box>
                    )}

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          key={`home-${availabilityVersion}`}
                          multiple
                          options={homePlayerOptions}
                          disableCloseOnSelect
                          getOptionLabel={option => `${option.firstName} ${option.lastName}`}
                          // List all players: do not disable by availability
                          getOptionDisabled={() => false}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          ListboxProps={{
                            sx: {
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 1,
                              p: 1
                            }
                          }}
                          renderOption={(props, option) => {
                            const isAvailable = availabilityMap[option.id] === 'available';
                            const number = option.shirtNumber || (option.isGuest ? 'G' : '—');
                            return (
                              <Box
                                component="li"
                                {...props}
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  p: 1,
                                  position: 'relative'
                                }}
                              >
                                <Avatar src={option.profilePicture || defaultTeamImage} sx={{ width: 40, height: 40, mb: 0.5 }} />
                                <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1 }}>
                                  {option.firstName}
                                </Typography>
                                {/* Show shirt number: green if available, black otherwise */}
                                <Box sx={{
                                  mt: 0.4,
                                  px: 0.6,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  color: isAvailable ? '#43a047' : '#111'
                                }}>
                                  {number}
                                </Box>
                              </Box>
                            );
                          }}
                          renderTags={(value, getTagProps) =>
                            value.map((opt, index) => {
                              const isAvailable = availabilityMap[opt.id] === 'available';
                              const number = opt.shirtNumber || (opt.isGuest ? 'G' : '—');
                              return (
                                <Box
                                  {...getTagProps({ index })}
                                  key={opt.id}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    mr: 1,
                                    position: 'relative',
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayerClick(e, opt, 'home');
                                  }}
                                >
                                  <Avatar
                                    src={opt.profilePicture || defaultTeamImage}
                                    sx={{ width: 32, height: 32, mb: 0.3 }}
                                  />
                                  <Typography sx={{ fontSize: 10, maxWidth: 54, textAlign: 'center', lineHeight: 1.1 }}>
                                    {opt.firstName}
                                  </Typography>
                                  {/* Shirt number instead of availability text */}
                                  <Box sx={{
                                    mt: 0.2,
                                    px: 0.4,
                                    py: 0.15,
                                    borderRadius: 1,
                                    fontSize: '0.55rem',
                                    fontWeight: 800,
                                    color: isAvailable ? 'green' : '#fff'
                                  }}>
                                    {number}
                                  </Box>
                                </Box>
                              );
                            })
                          }
                          value={homeTeamUsers}
                          onChange={(_, newValue) => {
                            setHomeTeamUsers(newValue);
                            if (homeCaptain && !newValue.some(u => u.id === homeCaptain.id)) {
                              setHomeCaptain(null);
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Select Home Players"
                              // helperText="Green number = available; white = unavailable"
                              FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
                              sx={{ ...autocompleteStyles }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          key={`away-${availabilityVersion}`}
                          multiple
                          options={awayPlayerOptions}
                          disableCloseOnSelect
                          getOptionLabel={option => `${option.firstName} ${option.lastName}`}
                          // List all players: do not disable by availability
                          getOptionDisabled={() => false}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          ListboxProps={{
                            sx: {
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 1,
                              p: 1
                            }
                          }}
                          renderOption={(props, option) => {
                            const isAvailable = availabilityMap[option.id] === 'available';
                            const number = option.shirtNumber || (option.isGuest ? 'G' : '—');
                            return (
                              <Box
                                component="li"
                                {...props}
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  p: 1,
                                  position: 'relative'
                                }}
                              >
                                <Avatar src={option.profilePicture || defaultTeamImage} sx={{ width: 40, height: 40, mb: 0.5 }} />
                                <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1 }}>
                                  {option.firstName}
                                </Typography>
                                {/* Shirt number: green if available, black otherwise */}
                                <Box sx={{
                                  mt: 0.4,
                                  px: 0.6,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  color: isAvailable ? '#43a047' : '#111'
                                }}>
                                  {number}
                                </Box>
                              </Box>
                            );
                          }}
                          renderTags={(value, getTagProps) =>
                            value.map((opt, index) => {
                              const isAvailable = availabilityMap[opt.id] === 'available';
                              const number = opt.shirtNumber || (opt.isGuest ? 'G' : '—');
                              return (
                                <Box
                                  {...getTagProps({ index })}
                                  key={opt.id}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    mr: 1,
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayerClick(e, opt, 'away');
                                  }}
                                >
                                  <Avatar
                                    src={opt.profilePicture || defaultTeamImage}
                                    sx={{ width: 32, height: 32, mb: 0.3 }}
                                  />
                                  <Typography sx={{ fontSize: 10, maxWidth: 54, textAlign: 'center', lineHeight: 1.1 }}>
                                    {opt.firstName}
                                  </Typography>
                                  {/* Shirt number instead of availability text */}
                                  <Box sx={{
                                    mt: 0.2,
                                    px: 0.4,
                                    py: 0.15,
                                    borderRadius: 1,
                                    fontSize: '0.55rem',
                                    fontWeight: 800,
                                    color: isAvailable ? '#43a047' : '#fff'
                                  }}>
                                    {number}
                                  </Box>
                                </Box>
                              );
                            })
                          }
                          value={awayTeamUsers}
                          onChange={(_, newValue) => {
                            setAwayTeamUsers(newValue);
                            if (awayCaptain && !newValue.some(u => u.id === awayCaptain.id)) {
                              setAwayCaptain(null);
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Select Away Players"
                              // helperText="Green number = available; white = unavailable"
                              FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
                              sx={{ ...autocompleteStyles }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Manual captain selectors */}
                      <Grid item xs={12} md={6}>
                        <Autocomplete<PlayerOption, false, false>
                          options={homeTeamUsers}
                          value={homeCaptain}
                          onChange={(_, val) => setHomeCaptain(val)}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          getOptionLabel={o => `${o.firstName} ${o.lastName}`}
                          disabled={!homeTeamUsers.length}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Select Home Captain"
                              placeholder="Choose captain"
                              sx={autocompleteStyles}
                              helperText={homeCaptain?.isGuest ? 'Guest captain will not be saved on server' : ''}
                              FormHelperTextProps={{ sx: { color: '#ffb300' } }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: .5 }}>
                              <Avatar
                                src={option.profilePicture || defaultTeamImage}
                                sx={{ width: 30, height: 30 }}
                              />
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {option.firstName} {option.lastName}
                              </Typography>
                              {!option.isGuest && (
                                <Chip
                                  size="small"
                                  label={`Skill ${calcSkill(option)}`}
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              )}
                              {option.isGuest && (
                                <Chip size="small" color="warning" label="Guest" sx={{ height: 20, fontSize: '0.65rem' }} />
                              )}
                            </Box>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Autocomplete<PlayerOption, false, false>
                          options={awayTeamUsers}
                          value={awayCaptain}
                          onChange={(_, val) => setAwayCaptain(val)}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          getOptionLabel={o => `${o.firstName} ${o.lastName}`}
                          disabled={!awayTeamUsers.length}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Select Away Captain"
                              placeholder="Choose captain"
                              sx={autocompleteStyles}
                              helperText={awayCaptain?.isGuest ? 'Guest captain will not be saved on server' : ''}
                              FormHelperTextProps={{ sx: { color: '#ffb300' } }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: .5 }}>
                              <Avatar
                                src={option.profilePicture || defaultTeamImage}
                                sx={{ width: 30, height: 30 }}
                              />
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {option.firstName} {option.lastName}
                              </Typography>
                              {!option.isGuest && (
                                <Chip
                                  size="small"
                                  label={`Skill ${calcSkill(option)}`}
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              )}
                              {option.isGuest && (
                                <Chip size="small" color="warning" label="Guest" sx={{ height: 20, fontSize: '0.65rem' }} />
                              )}
                            </Box>
                          )}
                        />
                      </Grid>
                      {/* END Captain selectors */}
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ mt: 0, mb: 2, p: 4, bgcolor: 'rgba(15,15,15,0.95)', color: '#E5E7EB', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>Match Details</Typography>
                <Typography variant='body2' sx={{ mb: 2, color: '#9CA3AF' }}>These fields are required by the API to save your match.</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label='Match Date'
                      value={matchDate}
                      onChange={nv => setMatchDate(dayjs(nv))}
                      slotProps={{ textField: { fullWidth: true, sx: inputStyles } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label='Start Time'
                      value={startTime}
                      onChange={nv => setStartTime(dayjs(nv))}
                      slotProps={{ textField: { fullWidth: true, sx: inputStyles } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label='Duration (minutes)'
                      type='number'
                      value={duration}
                      onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      fullWidth
                      sx={{ ...inputStyles }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label='Location'
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      fullWidth
                      sx={{ ...inputStyles }}
                    />
                  </Grid>
                </Grid>
                {error && <Typography color='error' sx={{ my: 3, p: 2, bgcolor: 'rgba(244,67,54,0.1)', borderRadius: 2, border: '1px solid rgba(244,67,54,0.3)' }}>{error}</Typography>}
              </Paper>
              <Button
                type='submit'
                variant='contained'
                fullWidth
                sx={{ py: 2, background: '#ff6a00', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2, boxShadow: '0 2px 8px rgba(255,106,0,0.2)', '&:hover': { background: '#cf2326' } }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'SAVE MATCH'}
              </Button>
            </form>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
            <Paper sx={{
              p: { xs: 1.5, sm: 2, md: 3 },
              bgcolor: 'rgba(15,15,15,0.95)',
              color: '#E5E7EB',
              borderRadius: { xs: 2, sm: 3, md: 4 },
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
              overflow: 'hidden'
            }}>
              <Typography variant="h5" sx={{
                color: '#fff',
                fontWeight: 700,
                textAlign: 'center',
                mb: { xs: 1.5, sm: 2, md: 3 },
                fontSize: { xs: '0.875rem', sm: '1.125rem', md: '1.5rem' }
              }}>
                Match Preview
              </Typography>

              {/* Win Probability */}
              {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                <Box sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: { xs: 2, sm: 3 }, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" sx={{ mb: { xs: 1, sm: 1.5, md: 2 }, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem', md: '1.25rem' } }}>Team Balance</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, sm: 1.5, md: 2 } }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#43a047', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{typeof homeWinChance === 'number' ? `${homeWinChance}%` : '—'}</Typography>
                      <Typography variant="body2" sx={{ color: '#43a047', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{homeTeamName || 'Home'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#ef5350', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{typeof awayWinChance === 'number' ? `${awayWinChance}%` : '—'}</Typography>
                      <Typography variant="body2" sx={{ color: '#ef5350', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{awayTeamName || 'Away'}</Typography>
                    </Box>
                  </Box>
                  {typeof homeWinChance === 'number' && (
                    <LinearProgress
                      variant="determinate"
                      value={homeWinChance}
                      sx={{
                        height: { xs: 6, sm: 8 },
                        borderRadius: { xs: 3, sm: 4 },
                        bgcolor: 'rgba(239, 83, 80, 0.3)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#43a047',
                          borderRadius: { xs: 3, sm: 4 }
                        }
                      }}
                    />
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 0.5, sm: 1 } }}>
                  </Box>
                  {/* 
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 0.5, sm: 1 } }}>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {homeStrength ?? '—'}</Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {awayStrength ?? '—'}</Typography>
                      </Box> */}
                </Box>
              )}

              {/* <Divider sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, borderColor: 'rgba(255,255,255,0.3)', width: { xs: '50px', sm: '80px', md: '100px' }, mx: 'auto' }} /> */}

              { /* Team names row (no logos) + VS in center */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  px: { xs: 1, sm: 2, md: 3 },
                  gap: { xs: 1, sm: 2, md: 3 },
                  mb: { xs: 1, sm: 1.5, md: 2 }
                }}
              >
                {/* Home */}
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#43a047',
                      fontWeight: 700,
                      fontSize: { xs: '0.85rem', sm: '1rem', md: '1.15rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {homeTeamName || 'Home'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9CA3AF',
                      fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.7rem' }
                    }}
                  >
                    {homeTeamUsers.length} players
                  </Typography>
                </Box>

                {/* VS Center */}
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeft: '1px solid rgba(255,255,255,0.25)',
                    borderRight: '1px solid rgba(255,255,255,0.25)'
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      letterSpacing: 1,
                      fontSize: { xs: '0.7rem', sm: '0.85rem', md: '1rem' },
                      background: 'linear-gradient(135deg,#43a047,#ef5350)',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    }}
                  >
                    VS
                  </Typography>
                </Box>

                {/* Away */}
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ef5350',
                      fontWeight: 700,
                      fontSize: { xs: '0.85rem', sm: '1rem', md: '1.15rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {awayTeamName || 'Away'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9CA3AF',
                      fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.7rem' }
                    }}
                  >
                    {awayTeamUsers.length} players
                  </Typography>
                </Box>
              </Box>

              { /* Player lists (headers WITHOUT avatars now) */}
              <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1, md: 2 }, alignItems: 'flex-start' }}>
                {/* Home Team list (header removed) */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  {homeCaptain && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: { xs: 0.5, sm: 1, md: 1.5 },
                        p: { xs: 0.5, sm: 0.8, md: 1.5 },
                        bgcolor: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: { xs: 1, sm: 2, md: 3 },
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        cursor: 'pointer',
                        minHeight: { xs: 28, sm: 35, md: 50 },
                        '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                        overflow: 'hidden'
                      }}
                      draggable
                      onDragEnd={() => movePlayer(homeCaptain, 'away')}
                      onClick={(e) => handlePlayerClick(e, homeCaptain, 'home')}
                    >
                      <ShirtAvatar number={homeCaptain.shirtNumber || (homeCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} />
                      <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight="bold"
                          sx={{
                            fontSize: { xs: 6.5, sm: 8, md: 12 },
                            color: 'white',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {homeCaptain.firstName} {homeCaptain.lastName}
                          {homeCaptain.isGuest && (
                            <Chip
                              label="G"
                              size="small"
                              sx={{
                                ml: { xs: 0.3, sm: 0.5, md: 0.8 },
                                height: { xs: 10, sm: 12, md: 16 },
                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                bgcolor: '#e67e22',
                                color: 'white',
                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                              }}
                            />
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 5, sm: 6, md: 9 }, color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                        <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                          Skill: {calcSkill(homeCaptain)}
                        </Typography>
                      </Box>
                      {homeCaptain.isGuest && (
                        <IconButton
                          size="small"
                          sx={{
                            color: '#f44336',
                            ml: { xs: 0.2, sm: 0.3 },
                            p: { xs: 0.1, sm: 0.2, md: 0.3 },
                            minWidth: { xs: 14, sm: 18, md: 22 },
                            width: { xs: 14, sm: 18, md: 22 },
                            height: { xs: 14, sm: 18, md: 22 }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setHomeCaptain(null);
                            const g = homeGuests.find(g => g.tempId === homeCaptain.guestTempId);
                            if (g) removeStagedGuest('home', g.tempId);
                          }}
                        >
                          <X size={8} />
                        </IconButton>
                      )}
                    </Box>
                  )}

                  {homeTeamUsers
                    .filter(u => u.id !== homeCaptain?.id)
                    .map(user => (
                      <Box
                        key={user.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: { xs: 0.3, sm: 0.5, md: 1 },
                          p: { xs: 0.3, sm: 0.5, md: 1 },
                          bgcolor: 'rgba(255,255,255,0.03)',
                          borderRadius: { xs: 1, sm: 2, md: 3 },
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          minHeight: { xs: 24, sm: 30, md: 40 },
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                          overflow: 'hidden'
                        }}
                        draggable
                        onDragEnd={() => movePlayer(user, 'away')}
                        onClick={(e) => handlePlayerClick(e, user, 'home')}
                      >
                        <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 16, sm: 20 }} />
                        <Box sx={{ ml: { xs: 0.4, sm: 0.6, md: 1 }, flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight={500}
                            sx={{
                              fontSize: { xs: 6, sm: 7.5, md: 10 },
                              color: 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {user.firstName} {user.lastName}
                            {user.isGuest && (
                              <Chip
                                label="G"
                                size="small"
                                sx={{
                                  ml: { xs: 0.2, sm: 0.4, md: 0.6 },
                                  height: { xs: 8, sm: 10, md: 14 },
                                  fontSize: { xs: '0.35rem', sm: '0.45rem', md: '0.55rem' },
                                  bgcolor: '#e67e22',
                                  color: 'white',
                                  '& .MuiChip-label': { px: { xs: 0.15, sm: 0.2, md: 0.4 } }
                                }}
                              />
                            )}
                          </Typography>
                          <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                            Skill: {calcSkill(user)}
                          </Typography>
                        </Box>
                        {user.isGuest && (
                          <IconButton
                            size="small"
                            sx={{
                              color: '#f44336',
                              ml: { xs: 0.1, sm: 0.2, md: 0.3 },
                              p: { xs: 0.1, sm: 0.15, md: 0.2 },
                              minWidth: { xs: 12, sm: 16, md: 20 },
                              width: { xs: 12, sm: 16, md: 20 },
                              height: { xs: 12, sm: 16, md: 20 }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const g = homeGuests.find(g => g.tempId === user.guestTempId);
                              if (g) removeStagedGuest('home', g.tempId);
                            }}
                          >
                            <X size={7} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                </Box>

                {/* Middle divider */}
                <Box
                  sx={{
                    width: { xs: '1px', sm: '2px', md: '3px' },
                    bgcolor: 'rgba(255,255,255,0.4)',
                    minHeight: { xs: 60, sm: 80, md: 120 },
                    borderRadius: 0.5,
                    alignSelf: 'stretch',
                    flexShrink: 0
                  }}
                />

                {/* Away Team list (header removed) */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  {awayCaptain && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: { xs: 0.5, sm: 1, md: 1.5 },
                        p: { xs: 0.5, sm: 0.8, md: 1.5 },
                        bgcolor: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: { xs: 1, sm: 2, md: 3 },
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        cursor: 'pointer',
                        minHeight: { xs: 28, sm: 35, md: 50 },
                        '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                        overflow: 'hidden'
                      }}
                      draggable
                      onDragEnd={() => movePlayer(awayCaptain, 'home')}
                      onClick={(e) => handlePlayerClick(e, awayCaptain, 'away')}
                    >
                      <ShirtAvatar number={awayCaptain.shirtNumber || (awayCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} />
                      <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight="bold"
                          sx={{
                            fontSize: { xs: 6.5, sm: 8, md: 12 },
                            color: 'white',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {awayCaptain.firstName} {awayCaptain.lastName}
                          {awayCaptain.isGuest && (
                            <Chip
                              label="G"
                              size="small"
                              sx={{
                                ml: { xs: 0.3, sm: 0.5, md: 0.8 },
                                height: { xs: 10, sm: 12, md: 16 },
                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                bgcolor: '#e67e22',
                                color: 'white',
                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                              }}
                            />
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 5, sm: 6, md: 9 }, color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                        <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3F', display: { xs: 'none', sm: 'block' } }}>
                          Skill: {calcSkill(awayCaptain)}
                        </Typography>
                      </Box>
                      {awayCaptain.isGuest && (
                        <IconButton
                          size="small"
                          sx={{
                            color: '#f44336',
                            ml: { xs: 0.2, sm: 0.3 },
                            p: { xs: 0.1, sm: 0.2, md: 0.3 },
                            minWidth: { xs: 14, sm: 18, md: 22 },
                            width: { xs: 14, sm: 18, md: 22 },
                            height: { xs: 14, sm: 18, md: 22 }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAwayCaptain(null);
                            const g = awayGuests.find(g => g.tempId === awayCaptain.guestTempId);
                            if (g) removeStagedGuest('away', g.tempId);
                          }}
                        >
                          <X size={8} />
                        </IconButton>
                      )}
                    </Box>
                  )}

                  {awayTeamUsers
                    .filter(u => u.id !== awayCaptain?.id)
                    .map(user => (
                      <Box
                        key={user.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: { xs: 0.3, sm: 0.5, md: 1 },
                          p: { xs: 0.3, sm: 0.5, md: 1 },
                          bgcolor: 'rgba(255,255,255,0.03)',
                          borderRadius: { xs: 1, sm: 2, md: 3 },
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          minHeight: { xs: 24, sm: 30, md: 40 },
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                          overflow: 'hidden'
                        }}
                        draggable
                        onDragEnd={() => movePlayer(user, 'home')}
                        onClick={(e) => handlePlayerClick(e, user, 'away')}
                      >
                        <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 16, sm: 20 }} />
                        <Box sx={{ ml: { xs: 0.4, sm: 0.6, md: 1 }, flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight={500}
                            sx={{
                              fontSize: { xs: 6, sm: 7.5, md: 10 },
                              color: 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {user.firstName} {user.lastName}
                            {user.isGuest && (
                              <Chip
                                label="G"
                                size="small"
                                sx={{
                                  ml: { xs: 0.2, sm: 0.4, md: 0.6 },
                                  height: { xs: 8, sm: 10, md: 14 },
                                  fontSize: { xs: '0.35rem', sm: '0.45rem', md: '0.55rem' },
                                  bgcolor: '#e67e22',
                                  color: 'white',
                                  '& .MuiChip-label': { px: { xs: 0.15, sm: 0.2, md: 0.4 } }
                                }}
                              />
                            )}
                          </Typography>
                          <Typography sx={{ fontSize: { xs: 4, sm: 5, md: 7 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                            Skill: {calcSkill(user)}
                          </Typography>
                        </Box>
                        {user.isGuest && (
                          <IconButton
                            size="small"
                            sx={{
                              color: '#f44336',
                              ml: { xs: 0.1, sm: 0.2, md: 0.3 },
                              p: { xs: 0.1, sm: 0.15, md: 0.2 },
                              minWidth: { xs: 12, sm: 16, md: 20 },
                              width: { xs: 12, sm: 16, md: 20 },
                              height: { xs: 12, sm: 16, md: 20 }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const g = awayGuests.find(g => g.tempId === user.guestTempId);
                              if (g) removeStagedGuest('away', g.tempId);
                            }}
                          >
                            <X size={7} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
      
      {/* Player Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(30, 30, 30, 0.98)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            minWidth: 180,
            mt: 1
          }
        }}
      >
        <MenuItem 
          onClick={handleSwitchTeam}
          sx={{
            color: 'white',
            py: 1.5,
            '&:hover': {
              bgcolor: 'rgba(56, 142, 60, 0.2)',
            }
          }}
        >
          <ListItemIcon>
            <ArrowLeftRight size={20} color="#4caf50" />
          </ListItemIcon>
          <ListItemText 
            primary="Switch Team"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 500
            }}
          />
        </MenuItem>
        
        <MenuItem 
          onClick={handleRemovePlayer}
          sx={{
            color: 'white',
            py: 1.5,
            '&:hover': {
              bgcolor: 'rgba(244, 67, 54, 0.2)',
            }
          }}
        >
          <ListItemIcon>
            <UserMinus size={20} color="#f44336" />
          </ListItemIcon>
          <ListItemText 
            primary="Remove Player"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 500
            }}
          />
        </MenuItem>
      </Menu>

      <Dialog open={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} fullWidth maxWidth='xs'>
        <DialogTitle sx={{ bgcolor: 'rgba(15,15,15,0.95)', color: 'white' }}>Add Guest Player</DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: 'rgba(15,15,15,0.95)', color: 'white' }}>
          <RadioGroup
            row
            value={guestTeam}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestTeam(e.target.value as 'home' | 'away')}
            sx={{ mb: 3, justifyContent: 'center' }}
          >
            <FormControlLabel value='home' control={<Radio sx={{ color: '#43a047' }} />} label='Home Team' />
            <FormControlLabel value='away' control={<Radio sx={{ color: '#ef5350' }} />} label='Away Team' />
          </RadioGroup>
          <TextField autoFocus label='Guest Full Name' value={guestName} onChange={e => setGuestName(e.target.value)} fullWidth placeholder='e.g. John Doe' sx={{ '& .MuiOutlinedInput-root': { color: 'white' }, '& .MuiInputLabel-root': { color: '#9CA3AF' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: 'rgba(15,15,15,0.95)' }}>
          <Button onClick={() => setGuestDialogOpen(false)} sx={{ color: '#9CA3AF' }}>Cancel</Button>
          <Button onClick={handleAddGuest} variant='contained' sx={{ background: 'linear-gradient(135deg,#e56a16,#cf2326)', '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' } }}>Add Guest</Button>
        </DialogActions>
      </Dialog>
      <Toaster position='top-center' reverseOrder={false} />
    </LocalizationProvider>
  );
}
