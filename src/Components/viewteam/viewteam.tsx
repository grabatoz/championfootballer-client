'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ShareIcon from '@mui/icons-material/Share';
import Pitch from "@/Components/images/pitch.jpg";
import Shirt from "@/Components/images/shirtimg.png";
import { useAuth } from '@/lib/hooks';

function debounce<F extends (...args: any[]) => void>(fn: F, wait: number) {
  let t: any; return (...args: Parameters<F>) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

type Player = { id?: string; name: string; number: string; position: 'GK' | 'DF' | 'MD' | 'FW'; isCaptain?: boolean; xp?: number };

// API types (minimal)
type ApiPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  shirtNumber?: string | null;
  positionType?: string | null;
  role?: 'GK' | 'DF' | 'MD' | 'FW';
  xp?: number | null; // per-match XP from team-view
};

type Guest = {
  id: string;
  team: 'home' | 'away';
  firstName: string;
  lastName: string;
  shirtNumber?: string | null;
};
type TeamPositions = Record<string, { x: number; y: number }>;

type TeamViewPayload = {
  success: boolean;
  match?: {
    homeTeamName: string;
    awayTeamName: string;
    status?: string; // RESULT_PUBLISHED | ...
    homeCaptainId?: string;
    awayCaptainId?: string;
    homeTeam: ApiPlayer[];
    awayTeam: ApiPlayer[];
    guests?: Guest[];
    positions?: { home?: TeamPositions; away?: TeamPositions }; // server-saved positions
  };
};

const primaryColor = 'rgb(229,106,22)';
const primaryColor2 = 'rgb(207,35,38)';
const textColor = '#111';

// Default fallback demo players (shown until real data loads)
const demoHome: Player[] = [
  { name: 'Xavi', number: '01', position: 'GK' },
  { name: 'John', number: '03', position: 'DF' },
  { name: 'Didi', number: '02', position: 'DF' },
  { name: 'Vava', number: '05', position: 'MD' },
  { name: 'Pele', number: '04', position: 'MD', isCaptain: true },
  { name: 'Kaka', number: '06', position: 'MD' },
  { name: 'Gerd', number: '09', position: 'FW' },
  { name: 'Eric', number: '07', position: 'FW' },
  { name: 'Dean', number: '08', position: 'FW' },
  { name: 'Sad', number: '10', position: 'FW' },
  { name: 'Viv', number: '12', position: 'FW' },
  { name: 'Mia', number: '11', position: 'FW' }
];

const demoAway: Player[] = [
  { name: 'Casillas', number: '01', position: 'GK' },
  { name: 'Ramos', number: '03', position: 'DF' },
  { name: 'Puyol', number: '02', position: 'DF' },
  { name: 'Modric', number: '05', position: 'MD' },
  { name: 'Zidane', number: '04', position: 'MD', isCaptain: true },
  { name: 'Ronaldinho', number: '06', position: 'MD' },
  { name: 'Henry', number: '09', position: 'FW' },
  { name: 'Rooney', number: '07', position: 'FW' },
  { name: 'Ronaldo', number: '08', position: 'FW' },
  { name: 'Beckham', number: '10', position: 'FW' },
  { name: 'Messi', number: '12', position: 'FW' },
  { name: 'Neymar', number: '11', position: 'FW' }
];

function normalizeRole(input?: string | null): 'GK' | 'DF' | 'MD' | 'FW' {
  const v = (input || '').toLowerCase();
  if (v === 'gk' || v.includes('goal')) return 'GK';
  if (v === 'df' || v.includes('def')) return 'DF';
  if (v === 'md' || v === 'mf' || v.includes('mid')) return 'MD';
  if (v === 'fw' || v === 'st' || v.includes('forw') || v.includes('strik')) return 'FW';
  return 'MD';
}

// Auto-formation roles by team size (matches API logic)
function targetRolesBySize(n: number): Array<'GK'|'DF'|'MD'|'FW'> {
  if (n < 5) { const r: Array<'GK'|'DF'|'MD'|'FW'> = ['GK']; for (let i = 1; i < n; i++) r.push('DF'); return r; }
  if (n === 5) return ['GK','DF','DF','FW','FW'];
  if (n === 6) return ['GK','DF','DF','DF','FW','FW'];
  if (n === 7) return ['GK','DF','DF','DF','FW','FW','FW'];
  const arr: Array<'GK'|'DF'|'MD'|'FW'> = ['GK','DF','DF','DF'];
  for (let i = arr.length; i < n; i++) arr.push('FW');
  return arr;
}

// Reorder incoming API players to match target roles, preferring players’ own roles
function arrangePlayers(list: ApiPlayer[], captainId?: string): Player[] {
  const buckets: Record<'GK'|'DF'|'MD'|'FW', ApiPlayer[]> = { GK: [], DF: [], MD: [], FW: [] };
  list.forEach(p => buckets[normalizeRole(p.role || p.positionType)].push(p));

  const take = (role: 'GK'|'DF'|'MD'|'FW') => (buckets[role].length ? buckets[role].shift()! : undefined);
  const takeAny = () => {
    for (const r of ['DF','MD','FW','GK'] as const) if (buckets[r].length) return buckets[r].shift()!;
    return undefined;
  };

  const targets = targetRolesBySize(list.length);
  const ordered: ApiPlayer[] = [];
  for (const role of targets) ordered.push(take(role) || takeAny()!);
  (['GK','DF','MD','FW'] as const).forEach(r => { while (buckets[r].length) ordered.push(buckets[r].shift()!); });

  return ordered.map(p => mapApiToPlayer(p, captainId));
}

function mapApiToPlayer(u: ApiPlayer, captainId?: string): Player {
  const cid = (captainId || '').trim();
  const isCaptain = cid !== '' && String(u.id) === cid;
  return {
    id: String(u.id),
    name: `${u.firstName} ${u.lastName}`.trim(),
    number: (u.shirtNumber || '00').toString().padStart(2, '0'),
    position: normalizeRole(u.role || u.positionType),
    isCaptain,
    xp: typeof u.xp === 'number' ? u.xp : undefined
  };
}

export default function TeamPreviewScreen({ leagueId, matchId }: { leagueId?: string; matchId?: string }) {
  const { token, user } = useAuth() as any; // needs user?.id

  // State: team name labels and players
  const [homeTeamName, setHomeTeamName] = React.useState<string>('Home');
  const [awayTeamName, setAwayTeamName] = React.useState<string>('Away');
  const [homePlayers, setHomePlayers] = React.useState<Player[]>(demoHome);
  const [awayPlayers, setAwayPlayers] = React.useState<Player[]>(demoAway);
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [matchStatus, setMatchStatus] = React.useState<string | undefined>(undefined);
  const [dataLoaded, setDataLoaded] = React.useState(false);

  const [isHomeTeam, setIsHomeTeam] = React.useState(true);
  const teamTitle = isHomeTeam ? homeTeamName : awayTeamName;

  // Captains and saved positions
  const [homeCaptainId, setHomeCaptainId] = React.useState<string | undefined>(undefined);
  const [awayCaptainId, setAwayCaptainId] = React.useState<string | undefined>(undefined);
  const [homePos, setHomePos] = React.useState<TeamPositions>({});
  const [awayPos, setAwayPos] = React.useState<TeamPositions>({});
  // Keep live refs of positions so we can save latest on pointerup
  const homePosRef = React.useRef<TeamPositions>({});
  const awayPosRef = React.useRef<TeamPositions>({});
  React.useEffect(() => { homePosRef.current = homePos; }, [homePos]);
  React.useEffect(() => { awayPosRef.current = awayPos; }, [awayPos]);

  const pitchRef = React.useRef<HTMLDivElement | null>(null);
  // Track natural size of the pitch image to compute drawn bounds when using background-size: contain
  const pitchImgSizeRef = React.useRef<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    const img = new Image();
    img.src = Pitch.src;
    const onload = () => {
      const w = (img.naturalWidth || (img as any).width) || 1;
      const h = (img.naturalHeight || (img as any).height) || 1;
      pitchImgSizeRef.current = { w, h };
    };
    if (img.complete) onload(); else img.onload = onload;
    return () => { img.onload = null; };
  }, []);

  // Given the container rect, return normalized [0..1] bounds of the drawn pitch image inside it
  const getPitchBoundsNorm = React.useCallback((rect: DOMRect) => {
    const nat = pitchImgSizeRef.current;
    if (!nat || rect.width === 0 || rect.height === 0) return { left: 0, top: 0, right: 1, bottom: 1 };
    const containerAspect = rect.width / rect.height;
    const imageAspect = nat.w / nat.h;
    let drawW = rect.width, drawH = rect.height, offX = 0, offY = 0;
    if (containerAspect > imageAspect) {
      // limited by height
      drawH = rect.height;
      drawW = drawH * imageAspect;
      offX = (rect.width - drawW) / 2;
    } else {
      // limited by width
      drawW = rect.width;
      drawH = drawW / imageAspect;
      offY = (rect.height - drawH) / 2;
    }
    return {
      left: offX / rect.width,
      right: (offX + drawW) / rect.width,
      top: offY / rect.height,
      bottom: (offY + drawH) / rect.height
    };
  }, []);

  const isCaptain = React.useMemo(() => {
    const uid = String(user?.id || '');
    return isHomeTeam ? uid && uid === homeCaptainId : uid && uid === awayCaptainId;
  }, [user?.id, isHomeTeam, homeCaptainId, awayCaptainId]);

  // Any captain (home or away) can drag any player (including guests)
  const canDrag = React.useMemo(() => {
    const uid = String(user?.id || '');
    if (!uid) return false;
    return uid === homeCaptainId || uid === awayCaptainId;
  }, [user?.id, homeCaptainId, awayCaptainId]);

  // Auto layout by roles and team size (home=top half, away=bottom half)
  const autoLayout = React.useCallback((players: Player[], teamSide: 'home'|'away'): TeamPositions => {
    const sideTop = teamSide === 'home';
    const rowY = (r: number) => (sideTop ? r : 1 - r);
    const keyOf = (p: Player) => String(p.id || p.name);

    const by = (role: Player['position']) => players.filter(p => p.position === role);
    const gk = by('GK'), df = by('DF'), md = by('MD'), fw = by('FW');

    const placeRow = (list: Player[], y: number) => {
      const m: TeamPositions = {};
      const count = Math.max(1, list.length);
      list.forEach((p, i) => {
        const x = (i + 1) / (count + 1);
        m[keyOf(p)] = { x, y };
      });
      return m;
    };

    const yGK = rowY(0.08);
    const yDF = rowY(0.22);
    const yMD = rowY(0.34);
    const yFW = rowY(0.46);

    return { ...placeRow(gk, yGK), ...placeRow(df, yDF), ...placeRow(md, yMD), ...placeRow(fw, yFW) };
  }, []);

  // Debounced save to API
  const savePositions = React.useMemo(
    () => debounce(async (teamSide: 'home'|'away', positions: TeamPositions) => {
      if (!leagueId || !matchId || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/layout`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ team: teamSide, positions })
        });
        if (!res.ok) {
          // surface in dev tools without changing UI
          console.warn('Debounced save failed', res.status, await res.text());
        }
      } catch (e) { console.warn('Debounced save error', e); }
    }, 600),
    [leagueId, matchId, token]
  );

  // Immediate save (called on drag end)
  const savePositionsNow = React.useCallback(async (teamSide: 'home'|'away') => {
    if (!leagueId || !matchId || !token) return;
    const positions = teamSide === 'home' ? homePosRef.current : awayPosRef.current;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/layout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team: teamSide, positions })
      });
      if (!res.ok) {
        console.warn('Immediate save failed', res.status, await res.text());
      }
    } catch (e) { console.warn('Immediate save error', e); }
  }, [leagueId, matchId, token]);

  // Load data + saved positions
  React.useEffect(() => {
    let active = true;
    const fetchTeams = async () => {
      if (!leagueId || !matchId || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/team-view`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload: TeamViewPayload = await res.json();
        if (!active || !payload?.success || !payload.match) return;

        const m = payload.match;
        const home = arrangePlayers(m.homeTeam || [], m.homeCaptainId);
        const away = arrangePlayers(m.awayTeam || [], m.awayCaptainId);

        setHomePlayers(home);
        setAwayPlayers(away);
        setHomeTeamName(m.homeTeamName || 'Home');
        setAwayTeamName(m.awayTeamName || 'Away');
        setGuests(m.guests || []);
        setMatchStatus(m.status);
        setHomeCaptainId(m.homeCaptainId);
        setAwayCaptainId(m.awayCaptainId);

        const serverHome = m.positions?.home || {};
        const serverAway = m.positions?.away || {};
        setHomePos(Object.keys(serverHome).length ? serverHome : autoLayout(home, 'home'));
        setAwayPos(Object.keys(serverAway).length ? serverAway : autoLayout(away, 'away'));
      } catch {
        // fallback for demo
        setHomePos(prev => (Object.keys(prev).length ? prev : autoLayout(demoHome, 'home')));
        setAwayPos(prev => (Object.keys(prev).length ? prev : autoLayout(demoAway, 'away')));
      } finally {
        if (active) setDataLoaded(true);
      }
    };
    fetchTeams();
    return () => { active = false; };
  }, [leagueId, matchId, token, autoLayout]);

  // Drag helpers
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // Allow dragging anywhere on the pitch image (within image bounds)
  const onDrag = (e: React.PointerEvent, pid: string, teamSide: 'home'|'away') => {
    if (!canDrag || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();

    // Keep the icon fully inside the visible pitch image
    const SHIRT_W = 40;
    const SHIRT_H = 40;
    const marginX = (SHIRT_W / 2) / rect.width;
    const marginY = (SHIRT_H / 2) / rect.height;

    const bounds = getPitchBoundsNorm(rect);

    const minX = bounds.left + marginX;
    const maxX = bounds.right - marginX;
    const minY = bounds.top + marginY;
    const maxY = bounds.bottom - marginY;

    let x = clamp01((e.clientX - rect.left) / rect.width);
    let y = clamp01((e.clientY - rect.top) / rect.height);

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    if (teamSide === 'home') {
      setHomePos(prev => {
        const next = { ...prev, [pid]: { x, y } };
        savePositions('home', next);
        return next;
      });
    } else {
      setAwayPos(prev => {
        const next = { ...prev, [pid]: { x, y } };
        savePositions('away', next);
        return next;
      });
    }
  };

  const startDrag = (pid: string, teamSide: 'home'|'away') => (e: React.PointerEvent) => {
    if (!canDrag) return;
    const move = (ev: PointerEvent) => onDrag(ev as any, pid, teamSide);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      savePositionsNow(teamSide);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };

  const shareTeam = async () => {
    const text = `Check out the team lineup for today’s match! (${teamTitle} team)`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Team Lineup', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        alert('Share text copied to clipboard.');
      }
    } catch { /* ignore */ }
  };

  // Absolute-positioned shirt
  const positions = isHomeTeam ? homePos : awayPos;
  const renderTeam = isHomeTeam ? homePlayers : awayPlayers;
  const teamSide: 'home'|'away' = isHomeTeam ? 'home' : 'away';

  // Guests for current side (dedupe by id)
  const selectedGuests = React.useMemo(() => {
    const side = teamSide;
    const m = new Map<string, Guest>();
    (guests || []).forEach((g: any) => {
      if (g.team !== side) return;
      const id = String(g.id);
      if (!m.has(id)) m.set(id, g);
    });
    return Array.from(m.values());
  }, [guests, teamSide]);

  // Simple row layout for guests within same half (fallback if no saved pos)
  const guestRowPositions = React.useMemo(() => {
    const list = selectedGuests;
    const count = Math.max(1, list.length);
    const y = teamSide === 'home' ? 0.49 : 0.51;
    const map: Record<string, {x:number;y:number}> = {};
    list.forEach((g, i) => {
      const x = (i + 1) / (count + 1);
      map[String(g.id)] = { x, y };
    });
    return map;
  }, [selectedGuests, teamSide]);

  const ShirtDot = ({ player }: { player: Player }) => {
    const pid = String(player.id || player.name);
    const pos = positions[pid];
    if (!pos) return null;
    const shirtLabel = player.position === 'FW' ? 'CF' : player.position;
    return (
      <Box
        onPointerDown={startDrag(pid, teamSide)}
        sx={{
          position: 'absolute',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          cursor: canDrag ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
          {/* The icon itself; clamping in onDrag ensures it stays inside the visible pitch */}
          <img src={Shirt.src} alt="shirt" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'opacity(0.85)' }} />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {shirtLabel}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ height: 6 }} />
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: textColor, textAlign: 'center' }}>
          {player.name} {player.isCaptain ? '• C' : ''}
        </Typography>
        {matchStatus === 'RESULT_PUBLISHED' && typeof player.xp === 'number' && (
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#0B6623', textAlign: 'center' }}>
            XP: {player.xp}
          </Typography>
        )}
      </Box>
    );
  };

  // Guest shirt (draggable by captain; persisted in same positions map using guest id)
  const GuestDot = ({ guestId, name, number }: { guestId: string; name: string; number?: string }) => {
    const pid = String(guestId);
    const pos = positions[pid] || guestRowPositions[pid];
    if (!pos) return null;
    const shirtLabel = 'CF';
    return (
      <Box
        onPointerDown={startDrag(pid, teamSide)}
        sx={{
          position: 'absolute',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          cursor: canDrag ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
          <img src={Shirt.src} alt="guest-shirt" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'opacity(0.85)' }} />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {shirtLabel}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ height: 6 }} />
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: textColor, textAlign: 'center' }}>
          {name}
        </Typography>
      </Box>
    );
  };

  // Teams not created: only show pitch + message (no shirts)
  const awaitingTeams = dataLoaded && homePlayers.length === 0 && awayPlayers.length === 0;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#fafafa' }}>
      {/* AppBar substitute */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          color: '#fff',
          background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor2} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>{teamTitle} Team</Typography>
        <IconButton onClick={shareTeam} size="small" sx={{ color: '#fff' }}>
          <ShareIcon />
        </IconButton>
      </Box>

      <Box component="main" sx={{ p: 2 }}>
        {/* Formation card */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px solid ${primaryColor}33`,
            borderRadius: 2,
            bgcolor: '#fff'
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>{teamTitle} Team Formation</Typography>
          <Divider sx={{ mb: 1 }} />
          <Box
            ref={pitchRef}
            sx={{
              height: 500,
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundImage: `url(${Pitch.src})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            {awaitingTeams ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.20)'
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 800 }}>
                  Awaiting admin to generate teams
                </Typography>
              </Box>
            ) : (
              <>
                {renderTeam.map((p) => <ShirtDot key={`${p.id || p.name}-${p.number}`} player={p} />)}
                {selectedGuests.map(g => (
                  <GuestDot
                    key={`guest-${g.id}`}
                    guestId={String(g.id)}
                    name={`${g.firstName} ${g.lastName}`.trim()}
                    number={(g.shirtNumber || '00').toString().padStart(2, '0')}
                  />
                ))}
              </>
            )}
          </Box>
        </Paper>

        <Box sx={{ height: 12 }} />

        {/* Home/Away toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
          <IconButton
            onClick={() => setIsHomeTeam(true)}
            disabled={isHomeTeam}
            size="small"
            sx={{ color: textColor }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Typography sx={{ fontSize: 16, fontWeight: 700, color: textColor }}>
            {isHomeTeam ? 'Home' : 'Away'}
          </Typography>

          <IconButton
            onClick={() => setIsHomeTeam(false)}
            disabled={!isHomeTeam}
            size="small"
            sx={{ color: textColor }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ height: 12 }} />

        {/* Predictions (UI unchanged) */}
        <Typography sx={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Match Predictions</Typography>
        <Box sx={{ height: 12 }} />
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px solid ${primaryColor}33`,
            borderRadius: 2,
            bgcolor: '#fff',
            textAlign: 'center'
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: primaryColor }}>Match 1</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: textColor }}>Team matchup is <span style={{ color: primaryColor }}>100%</span></Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}><span style={{ color: primaryColor }}>{homeTeamName}</span> <span style={{ color: textColor }}>is predicted to win.</span></Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: textColor }}>Predicted score is <span style={{ color: primaryColor }}>1-2</span></Typography>
        </Paper>

        <Box sx={{ height: 40 }} />
      </Box>
    </Box>
  );
}