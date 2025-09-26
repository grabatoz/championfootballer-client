'use client';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Badge,
  Popover,
  Divider,
  // Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, initializeFromStorage } from '@/lib/features/authSlice';
import cflogo from '@/Components/images/champion football logo 3.png';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import { forwardRef } from 'react';
import type { TransitionProps } from '@mui/material/transitions';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import playercardupdate from '@/Components/images/playercardupdate.png';
import leagueimg from '@/Components/images/leagueimg.png';
import progressimg from '@/Components/images/progressimg.png';
import leaguesetting from '@/Components/images/leaguesetting.png';
import matchdetails from '@/Components/images/matchdetails.png';
import palyerstats from '@/Components/images/palyerstats.png';
import player from '@/Components/images/profile-user.png'
import play from '@/Components/images/play.png'
import gamification from '@/Components/images/gamification.png'
import logoutpic from '@/Components/images/logout.png'
import { useAuth } from '@/lib/hooks';
import React from 'react';
type NotificationKind =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'TEAM_SELECTION'
  | 'AVAILABILITY_REMINDER'
  | 'RESULT_PUBLISHED'
  | 'GENERAL';
interface NotificationMeta {
  matchId?: string;
  leagueId?: string;
  playerId?: string;
  [key: string]: unknown;
}
interface Notification {
  id: string;
  type: NotificationKind;
  title: string;
  body: string;
  meta?: NotificationMeta;  // will be safely widened via MatchMeta casts where needed
  read: boolean;
  created_at: string;
}
// ADD: strongly typed match meta (all optional)
interface MatchMeta extends NotificationMeta {
  matchId?: string; match_id?: string;
  leagueId?: string; league_id?: string;
  leagueName?: string; league_name?: string;
  leagueTitle?: string; league_title?: string;
  league?: string | {
    name?: string;
    title?: string;
    leagueName?: string;
  };

  matchNumber?: number|string; match_no?: number|string;
  matchIndex?: number|string; match_index?: number|string;

  // Start variants
  startTime?: string; start_time?: string; start?: string;
  kickoff?: string; kickOff?: string; kick_off?: string;
  kickoffTime?: string; kickoff_time?: string;
  scheduledStart?: string; scheduled_start?: string;
  startAt?: string; start_at?: string;
  matchStart?: string; match_start?: string;
  from?: string; time_from?: string;
  startDateTime?: string; start_datetime?: string; start_date_time?: string;
  begin?: string; beginTime?: string; begin_time?: string;

  // End variants
  endTime?: string; end_time?: string; end?: string;
  finishTime?: string; finish_time?: string; finish?: string;
  endAt?: string; end_at?: string;
  to?: string; time_to?: string;
  matchEnd?: string; match_end?: string;
  scheduledEnd?: string; scheduled_end?: string;
  endingTime?: string; ending_time?: string;
  matchEndTime?: string; match_end_time?: string;
  endtime?: string; stop?: string; stopTime?: string; stop_time?: string;
  finishAt?: string; finish_at?: string;
  endDateTime?: string; end_datetime?: string; end_date_time?: string;

  // Duration variants
  duration?: string|number;
  durationMinutes?: string|number;
  duration_minutes?: string|number;
  matchDuration?: string|number;
  lengthMinutes?: string|number;
  length?: string|number;

  // Date variants
  date?: string; matchDate?: string; match_date?: string;
  day?: string; playDate?: string; play_date?: string;
  scheduledDate?: string; scheduled_date?: string;
  startDate?: string; start_date?: string;

  // Venue/location variants
  venue?: string; location?: string; ground?: string;
  pitch?: string; place?: string; field?: string;
}
// ADD THIS TYPE (was missing and caused TS error)
interface BuiltNotificationDisplay {
  title: string;
  plain: string;
  node: React.ReactNode;
}
function isMatchCreated(n: Notification) {
  const t = (n.type || '').toUpperCase();
  const titleBody = (n.title + ' ' + n.body).toUpperCase();
  return (
    t === 'MATCH_CREATED' ||
    t === 'MATCH_SCHEDULED' ||
    t === 'NEW_MATCH' ||
    /MATCH\s+CREATED/.test(titleBody) ||
    /MATCH\s+SCHEDULED/.test(titleBody)
  );
}

// >>> REPLACE the current formatTime + toHHMM with this version (handles malformed 2025:09:26T06:12:00:000Z) <<<

function formatTime(raw?: string | number): string {
  if (raw === undefined || raw === null || raw === '') return '';

  // Epoch (seconds or ms)
  if (typeof raw === 'number' || /^\d{10,13}$/.test(String(raw))) {
    const num = typeof raw === 'number' ? raw : Number(raw);
    const ms = String(raw).length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return toHHMM(d);
  }

  let str = String(raw).trim();

  // 1) Direct malformed pattern like 2025:09:26T06:12:00:000Z
  const malformedFull = str.match(/^(\d{4}):(\d{2}):(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(?::\d{3})?Z?$/);
  if (malformedFull) {
    return `${malformedFull[4]}:${malformedFull[5]}`;
  }

  // 2) Extract time part after T if present (standard ISO or similar)
  const tPart = str.match(/T(\d{2}):(\d{2})/);
  if (tPart) {
    return `${tPart[1]}:${tPart[2]}`;
  }

  // 3) Plain clock with optional seconds / am/pm
  const clockMatch = str.replace(/[.\-]/g, ':').match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/);
  if (clockMatch) {
    let h = parseInt(clockMatch[1], 10);
    const m = clockMatch[2];
    const ap = clockMatch[3];
    if (ap) {
      const up = ap.toUpperCase();
      if (up === 'AM' && h === 12) h = 0;
      if (up === 'PM' && h < 12) h += 12;
    }
    return `${String(h).padStart(2,'0')}:${m}`;
  }

  // 4) Try to sanitize malformed colon-date into ISO then parse
  let sanitized = str;
  sanitized = sanitized
    .replace(/^(\d{4}):(\d{2}):(\d{2})T/, '$1-$2-$3T')      // fix date part
    .replace(/:(\d{3})Z$/, '.$1Z');                        // fix ms separator if present
  const d2 = new Date(sanitized);
  if (!isNaN(d2.getTime())) return toHHMM(d2);

  // 5) Final attempt plain Date
  const d3 = new Date(str);
  if (!isNaN(d3.getTime())) return toHHMM(d3);

  // 6) Fallback: try to pull first HH:MM anywhere
  const loose = str.match(/(\d{2}):(\d{2})/);
  if (loose) return `${loose[1]}:${loose[2]}`;

  return str;
}

function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// Added helpers previously missing (prevent TS errors) - kept minimal and 24h oriented
interface ParsedClock {
  mins: number;     // minutes from midnight
  is12h: boolean;   // original had am/pm
  hadAmPm: boolean; // explicit am/pm present
}

function parseClockTimeToMinutes(str: string): ParsedClock | null {
  const m = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ap = m[3];
  let hadAmPm = false;
  if (ap) {
    hadAmPm = true;
    const up = ap.toUpperCase();
    if (up === 'AM' && h === 12) h = 0;
    if (up === 'PM' && h < 12) h += 12;
  }
  if (h > 23 || mm > 59) return null;
  return { mins: h * 60 + mm, is12h: !!ap, hadAmPm };
}

function minutesToClock(total: number, _is12h: boolean, _hadAmPm: boolean): string {
  // Always return 24h HH:MM
  let mins = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// Change day from '2-digit' to 'numeric' (gives 9 not 09)
function formatDateLine(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// REPLACE the whole current buildNotificationDisplay (and its small helpers inside) with this fixed version:

// Helper to safely pick the first non-empty string value
function pickFirst(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return undefined;
}

// Add helper (place above buildNotificationDisplay)
function normalizePossibleDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  let s = String(raw).trim();
  if (/^\d{1,2}:\d{2}(\s?(AM|PM|am|pm))?$/.test(s)) return undefined;
  if (/^\d{4}:\d{2}:\d{2}T/.test(s)) {
    s = s.replace(/^(\d{4}):(\d{2}):(\d{2})T/, '$1-$2-$3T');
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

// >>> ADDED helper (fixes 'Cannot find name extractLeagueName')
function extractLeagueName(meta: MatchMeta, resolvedLeagueName?: string): string {
  if (resolvedLeagueName) return resolvedLeagueName;
  if (meta.leagueName) return meta.leagueName;
  if (meta.league_name) return meta.league_name;
  if (meta.leagueTitle) return meta.leagueTitle;
  if (meta.league_title) return meta.league_title;
  const lg = meta.league;
  if (typeof lg === 'string') return lg;
  if (lg && typeof lg === 'object') {
    return lg.name || lg.title || lg.leagueName || 'League';
  }
  return 'League';
}
// >>> END helper

// >>> ADD THIS HELPER (needed for the render where matchHasStarted is used)
function matchHasStarted(
  meta: MatchMeta,
  timesOverride?: { start?: string },
  now: Date = new Date()
): boolean {
  // Gather possible start time fields
  let startRaw =
    timesOverride?.start ||
    meta.startTime || meta.start_time || meta.start ||
    meta.kickoff || meta.kickOff || meta.kick_off ||
    meta.kickoffTime || meta.kickoff_time ||
    meta.scheduledStart || meta.scheduled_start ||
    meta.startAt || meta.start_at ||
    meta.matchStart || meta.match_start ||
    meta.from || meta.time_from ||
    meta.startDateTime || meta.start_datetime || meta.start_date_time ||
    meta.begin || meta.beginTime || meta.begin_time;

  if (!startRaw) return false;
  startRaw = String(startRaw).trim();

  // If only time (HH:MM[/ AM/PM]) try to combine with a date field if present
  const clockOnly = startRaw.match(/^(\d{1,2}):(\d{2})(?:\s?(AM|PM|am|pm))?$/);
  if (clockOnly) {
    const dateField =
      meta.date || meta.matchDate || meta.match_date ||
      meta.day || meta.playDate || meta.play_date ||
      meta.scheduledDate || meta.scheduled_date ||
      meta.startDate || meta.start_date;
    if (dateField) {
      let dateStr = String(dateField).trim();
      if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
        dateStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      }
      let h = parseInt(clockOnly[1], 10);
      const m = clockOnly[2];
      const ap = clockOnly[3];
      if (ap) {
        const up = ap.toUpperCase();
        if (up === 'AM' && h === 12) h = 0;
        if (up === 'PM' && h < 12) h += 12;
      }
      startRaw = `${dateStr}T${String(h).padStart(2,'0')}:${m}:00`;
    } else {
      // Cannot decide without a date
      return false;
    }
  }

  // Fix malformed 2025:09:26T...
  if (/^\d{4}:\d{2}:\d{2}T/.test(startRaw)) {
    startRaw = startRaw.replace(/^(\d{4}):(\d{2}):(\d{2})T/, '$1-$2-$3T');
  }

  const d = new Date(startRaw);
  if (isNaN(d.getTime())) return false;
  return now.getTime() >= d.getTime();
}
// >>> END ADDED HELPER

// Safely extract a match id from meta (supports matchId / match_id)
function getMatchId(meta?: NotificationMeta): string | undefined {
  if (!meta) return undefined;
  const m = meta as MatchMeta;
  const raw = m.matchId ?? m.match_id;
  if (raw === undefined || raw === null || raw === '') return undefined;
  return String(raw);
}

function buildNotificationDisplay(
  n: Notification,
  derivedMatchNo?: number,
  resolvedLeagueName?: string,
  timesOverride?: { start?: string; end?: string }
): BuiltNotificationDisplay {
  if (isMatchCreated(n)) {
    const meta: MatchMeta = (n.meta ?? {}) as MatchMeta;

    // Match number (backend or derived)
    const backendMatchNo = pickFirst(meta, [
      'matchNumber','match_no','matchIndex','match_index'
    ]);
    const matchNo = backendMatchNo
      ? String(backendMatchNo)
      : (derivedMatchNo ? String(derivedMatchNo) : '');

    // REPLACED unsafe rawLeague access with helper
    const leagueName = extractLeagueName(meta, resolvedLeagueName);

    // Times / Date / Venue
    let startRaw = pickFirst(meta, [
      'startTime','start_time','start','kickoff','kickOff','kick_off','kickoffTime','kickoff_time',
      'scheduledStart','scheduled_start','startAt','start_at','matchStart','match_start','from','time_from',
      'startDateTime','start_datetime','start_date_time','begin','beginTime','begin_time'
    ]) || timesOverride?.start;

    let endRaw = pickFirst(meta, [
      'endTime','end_time','end','finishTime','finish_time','finish','endAt','end_at',
      'to','time_to','matchEnd','match_end','scheduledEnd','scheduled_end',
      'endingTime','ending_time','matchEndTime','match_end_time','endtime',
      'stop','stopTime','stop_time','finishAt','finish_at','endDateTime','end_datetime','end_date_time'
    ]) || timesOverride?.end;

    const explicitDateRaw = pickFirst(meta, [
      'date','matchDate','match_date','day','playDate','play_date','scheduledDate','scheduled_date',
      'startDate','start_date'
    ]);

    // NEW: broaden venue keys unchanged
    const venue = pickFirst(meta, [
      'venue','location','ground','pitch','place','field'
    ]) || '';

    // ---- dateLine derivation (REPLACED) ----
    // 1. Use explicit date field if valid
    let dateIso =
      normalizePossibleDate(explicitDateRaw) ||
      normalizePossibleDate(startRaw) ||
      normalizePossibleDate(endRaw) ||
      normalizePossibleDate(n.created_at);

    const dateLine = dateIso ? formatDateLine(dateIso) : '';

    // 2) Fallback parse from title/body if not provided OR if one missing
    if ((!startRaw || !endRaw) && (n.title || n.body)) {
      const agg = `${n.title ?? ''} ${n.body ?? ''}`;
      const range = agg.match(
        /\b(\d{1,2}[:.]\d{2}\s?(?:AM|PM|am|pm)?)\s?(?:to|-)\s?(\d{1,2}[:.]\d{2}\s?(?:AM|PM|am|pm)?)\b/
      );
      if (range) {
        if (!startRaw) startRaw = range[1];
        if (!endRaw) endRaw = range[2];
      } else {
        const times = agg.match(/\b\d{1,2}[:.]\d{2}\s?(?:AM|PM|am|pm)?\b/g);
        if (!startRaw && times && times[0]) startRaw = times[0];
        if (!endRaw && times && times[1]) endRaw = times[1];
      }
    }

    // NEW: Compute from duration at meta level if still missing end
    if (!endRaw && startRaw) {
      const durMeta = pickFirst(meta, [
        'duration','durationMinutes','duration_minutes','matchDuration','lengthMinutes','length'
      ]);
      if (durMeta) {
        const durNum = parseInt(String(durMeta),10);
        const sDate = new Date(startRaw);
        if (!isNaN(durNum) && !isNaN(sDate.getTime())) {
          const eDate = new Date(sDate.getTime() + durNum * 60000);
          endRaw = eDate.toISOString();
        }
      }
    }

    // FINAL: If still no end, still compute default 90 from start
    if (!endRaw && startRaw) {
      const sDate = new Date(startRaw);
      if (!isNaN(sDate.getTime())) {
        const eDef = new Date(sDate.getTime() + 90 * 60000);
        endRaw = eDef.toISOString();
      }
    }

    // --- PATCH: robust manual end time computation for plain clock values ---
    // If endRaw missing but startRaw is a plain time (no date), compute using duration OR default 90
    if (!endRaw && startRaw && /^[0-9]{1,2}:[0-9]{2}(\s?(AM|PM|am|pm))?$/.test(String(startRaw).trim())) {
      const parsed = parseClockTimeToMinutes(String(startRaw).trim());
      if (parsed) {
        const durMeta = pickFirst(meta, [
          'duration','durationMinutes','duration_minutes','matchDuration','lengthMinutes','length'
        ]);
        let dur = 90;
        if (durMeta) {
          const dNum = parseInt(String(durMeta), 10);
            if (!isNaN(dNum) && dNum > 0 && dNum < 600) dur = dNum;
        }
        const endMins = parsed.mins + dur;
        endRaw = minutesToClock(endMins, parsed.is12h, parsed.hadAmPm);
      }
    }

    const startFmt = formatTime(startRaw);
    let endFmt = formatTime(endRaw);

    // If endFmt still empty AND we have ISO-ish startRaw + computed duration, fallback again
    if (!endFmt && startRaw && !endRaw) {
      const durMeta = pickFirst(meta, [
        'duration','durationMinutes','duration_minutes','matchDuration','lengthMinutes','length'
      ]);
      let dur = 90;
      if (durMeta) {
        const dNum = parseInt(String(durMeta), 10);
        if (!isNaN(dNum) && dNum > 0 && dNum < 600) dur = dNum;
      }
      const sDate = new Date(startRaw);
      if (!isNaN(sDate.getTime())) {
        const eDate = new Date(sDate.getTime() + dur * 60000);
        // CHANGED: force 24h HH:MM instead of locale string with AM/PM
        endFmt = toHHMM(eDate);
      }
    }

    if (!endFmt) {
      console.log('🚨 STILL NO END (after all fallbacks)', {
        notifId: n.id,
        matchMetaId: meta.matchId || meta.match_id,
        startRaw,
        endRaw,
        computedEndFmt: endFmt,
        triedPlainClock: /^[0-9]{1,2}:[0-9]{2}(\s?(AM|PM|am|pm))?$/.test(String(startRaw || '')),

        metaKeys: Object.keys(meta)
      });
    }

    // Match id & link
    const matchId = pickFirst(meta, ['matchId','match_id','id']) || '';
    const seeDetailsHref = matchId ? `/match/${matchId}` : '#';

    const plainParts: string[] = [];
    if (dateLine) plainParts.push(dateLine);
    if (venue) plainParts.push(venue);
    const plain = plainParts.join('\n');

    const node = (
      <Box>
        <Typography
          component="div"
          sx={{ fontWeight: 800, color: '#111', fontSize: '14px', lineHeight: 1.35 }}
        >
          New Match Scheduled!{' '}
          <Box component="span" sx={{ fontWeight: 900 }}>
            ⚽ Match {matchNo || '?'} for {leagueName}
          </Box>{' '}is scheduled.{' '}
          {matchId && (
            <Typography
              component={Link}
              href={seeDetailsHref}
              sx={{
                fontWeight: 700,
                color: '#0b57d0',
                textDecoration: 'underline',
                '&:hover': { color: '#063a8f' }
              }}
            >
              See details
            </Typography>
          )}
        </Typography>

        {(startFmt || endFmt) && (
          <Box sx={{ mt: 1 }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flexWrap: 'wrap'
              }}
            >
              {startFmt && <Box component="span">{startFmt}</Box>}
              {startFmt && endFmt && <Box component="span" sx={{ mx: 0.25 }}>-</Box>}
              {endFmt && <Box component="span">{endFmt}</Box>}
            </Typography>
          </Box>
        )}

        {/* NEW: Always show dateLine if available (even without times) */}
        {dateLine && (
          <Typography
            sx={{
              mt: 0.6,
              fontSize: '12px',
              fontWeight: 600,
              color: '#444'
            }}
          >
            {dateLine}
          </Typography>
        )}

        {venue && (
          <Typography
            sx={{
              mt: 0.4,
              fontSize: '12px',
              fontWeight: 500,
              color: '#555'
            }}
          >
            {venue}
          </Typography>
        )}
      </Box>
    );

    const uiTitle = `Match ${matchNo || ''} Scheduled`;
    return { title: uiTitle, plain, node };
  }

  // Non-match notification fallback
  const title = n.title || 'Notification';
  const bodyText = n.body?.length ? n.body : 'New update available.';
  return {
    title,
    plain: bodyText,
    node: (
      <Typography
        sx={{
          color: '#444',
          fontSize: '13px',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap'
        }}
      >
        {bodyText}
      </Typography>
    )
  };
}

// Custom SlideFade transition
const SlideFade = forwardRef(function SlideFade(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  const { in: inProp, children, ...other } = props;
  return (
    <Slide direction="down" in={inProp} ref={ref} {...other} timeout={300}>
      <Fade in={inProp} timeout={300}>
        {children ?? <span />}
      </Fade>
    </Slide>
  );
});

export default function NavigationBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, dispatch, token, user } = useAuth(); // 🔥 MOVED HERE - GET ALL VALUES AT COMPONENT LEVEL
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(profileMenuAnchor);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [gameRulesOpen, setGameRulesOpen] = useState(false);
  const pathname = usePathname();

  // 🔥 NOTIFICATION STATES
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const openNotifications = Boolean(notificationAnchor);

  const [availabilitySelections, setAvailabilitySelections] = useState<Record<string,'YES'|'NO'>>({});
  const [savingAvailability, setSavingAvailability] = useState<Record<string, boolean>>({});

  // ADD THIS (league name cache)
  const [leagueNames, setLeagueNames] = useState<Record<string,string>>({});

  // Build per-league incremental match indices.
  // Uses backend matchNumber if present to sync sequence; otherwise increments.
  const leagueMatchIndexMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    // Sort by created_at ascending for stable sequence
    const sorted = [...notifications].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const counters: Record<string, number> = {};

    for (const n of sorted) {
      if (!isMatchCreated(n)) continue;
      const meta: MatchMeta = (n.meta ?? {}) as MatchMeta;
      const leagueKey =
        meta.leagueId ||
        meta.league_id ||
        meta.leagueName ||
        meta.league_name ||
        'default';

      if (!counters[leagueKey]) counters[leagueKey] = 0;
      // If backend already sends a match number, adopt it as current baseline
      const backendNumRaw =
        meta.matchNumber ||
        meta.match_no;
      let assigned: number;

      const parsed = backendNumRaw != null && backendNumRaw !== ''
        ? parseInt(String(backendNumRaw), 10)
        : NaN;

      if (!isNaN(parsed)) {
        // Ensure counter jumps forward if backend number is higher
        if (parsed > counters[leagueKey]) counters[leagueKey] = parsed;
        assigned = parsed;
      } else {
        // Increment locally
        counters[leagueKey] += 1;
        assigned = counters[leagueKey];
      }

      if (!map[leagueKey]) map[leagueKey] = {};
      map[leagueKey][n.id] = assigned;
    }
    return map;
  }, [notifications]);

  // >>> ADD THIS HELPER (after state declarations)
  async function syncAvailabilityFromServer(notifs: Notification[]) {
    if (!token || !user?.id) return;
    // Collect unique matchIds from match-type notifications
    const matchIds = Array.from(
      new Set(
        notifs
          .filter(n => isMatchCreated(n))
          .map(n => getMatchId(n.meta))
          .filter((v): v is string => !!v)
      )
    );
    if (matchIds.length === 0) return;

    try {
      const results = await Promise.all(
        matchIds.map(async (mid) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${mid}/availability`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return { mid, available: false };
            const data = await res.json();
            const availableUserIds: string[] = data.availableUserIds || [];
            const isAvailable = availableUserIds.map(String).includes(String(user.id));
            return { mid, available: isAvailable };
          } catch {
            return { mid, available: false };
          }
        })
      );

      setAvailabilitySelections(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (r.available) {
            next[r.mid] = 'YES';
          } else {
            if (next[r.mid] === 'YES') delete next[r.mid];
          }
        });
        return next;
      });
    } catch (e) {
      console.error('Error syncing availability', e);
    }
  }
  // >>> END ADDITION

  async function hydrateLeagueNames(notifs: Notification[]) {
    if (!token) return;
    const pending: Set<string> = new Set();

    notifs.forEach(n => {
      if (!isMatchCreated(n)) return;
      const meta: MatchMeta = (n.meta ?? {}) as MatchMeta;
      const leagueId = meta.leagueId || meta.league_id;

      // SAFE narrowing
      let leagueInline: string | undefined;
      if (typeof meta.league === 'string') {
        leagueInline = meta.league;
      } else if (meta.league && typeof meta.league === 'object') {
        leagueInline = meta.league.name || meta.league.title || meta.league.leagueName;
      }

      const hasName =
        meta.leagueName ||
        meta.league_name ||
        meta.leagueTitle ||
        meta.league_title ||
        leagueInline;

      if (leagueId && !hasName && !leagueNames[leagueId as string]) {
        pending.add(String(leagueId));
      }
    });

    if (pending.size === 0) return;

    const ids = Array.from(pending);
    try {
      const results = await Promise.all(
        ids.map(async id => {
          try {
            // Adjust endpoint if your API differs
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store'
            });
            if (!res.ok) return { id, name: undefined };
            const data = await res.json();
            const name =
              data.name ||
              data.leagueName ||
              data.title ||
              data.league_title ||
              data.league?.name ||
              data.league?.title;
            return { id, name };
          } catch {
            return { id, name: undefined };
          }
        })
      );
      setLeagueNames(prev => {
        const next = { ...prev };
        results.forEach(r => { if (r.name) next[r.id] = r.name; });
        return next;
      });
    } catch (e) {
      console.error('hydrateLeagueNames error', e);
    }
  }

  // ---- 2) ADD FETCH FUNCTION (place after hydrateLeagueNames) ----
  async function fetchMissingMatchTimes(notifs: Notification[]) {
    if (!token) return;

    const targets: string[] = [];
    for (const n of notifs) {
      if (!isMatchCreated(n)) continue;
      const meta: MatchMeta = (n.meta ?? {}) as MatchMeta;
      const matchId = meta.matchId || meta.match_id;
      if (!matchId) continue;
      const endMeta = meta.endTime || meta.end_time || meta.end || meta.finishTime || meta.finish_time;
      const cached = matchTimes[matchId];
      if (!endMeta && (!cached || !cached.end)) {
        targets.push(String(matchId));
      }
    }
    if (targets.length === 0) return;

    const unique = Array.from(new Set(targets));
    console.log('⏱ Fetching match detail for end times:', unique);
    try {
      const results = await Promise.all(unique.map(async id => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          if (!res.ok) {
            console.log('⚠️ Match detail failed', id, res.status);
            return { id, start: undefined, end: undefined };
          }
          const data = await res.json();
          console.log('🛈 Match detail', id, data);

          const pick = (...keys: string[]) => {
              for (const k of keys) {
                const v = data[k];
                if (v !== undefined && v !== null && v !== '') return v;
              }
              return undefined;
            };

          const start = pick(
            'startTime','start_time','kickoff','kickOff','kickoffTime','scheduledStart','start','matchStart'
          );
          let end = pick(
            'endTime','end_time','finishTime','finish_time','scheduledEnd','end','matchEnd','match_end'
          );

          if (!end && start) {
            const durationRaw = pick(
              'duration','durationMinutes','duration_minutes','matchDuration','lengthMinutes','length'
            );
            const durNum = durationRaw ? parseInt(String(durationRaw),10) : NaN;
            const startDate = new Date(start);
            if (!isNaN(startDate.getTime())) {
              const mins = !isNaN(durNum) && durNum > 0 ? durNum : 90;
              const endDate = new Date(startDate.getTime() + mins * 60000);
              end = endDate.toISOString();
            }
          }

          return { id, start, end };
        } catch (e) {
          console.log('❌ Match detail error', id, e);
          return { id, start: undefined, end: undefined };
        }
      }));

      setMatchTimes(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (!next[r.id]) next[r.id] = {};
          if (r.start && !next[r.id].start) next[r.id].start = r.start;
          if (r.end && !next[r.id].end) next[r.id].end = r.end;
        });
        return next;
      });
    } catch (e) {
      console.error('fetchMissingMatchTimes error', e);
    }
  }

  // 🔥 UPDATED FETCH NOTIFICATIONS - USE COMPONENT LEVEL TOKEN
  const fetchNotifications = async (showLogs?: boolean) => {
    try {
      setLoading(true);
      
      if (showLogs) {
        console.log('🔔 Fetching notifications...');
        console.log('🔍 Auth state:', { 
          token: token ? 'Available' : 'Missing', 
          isAuthenticated, 
          userId: user?.id 
        });
      }
      
      if (!token) {
        if (showLogs) {
          console.log('❌ No token available from useAuth hook');
        }
        return;
      }
      
      const userId = user?.id;
      if (!userId) {
        if (showLogs) {
          console.log('❌ No user ID available from useAuth hook');
        }
        return;
      }
      
      if (showLogs) {
        console.log('✅ Using token:', token.substring(0, 20) + '...');
        console.log('✅ Using userId:', userId);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 USE COMPONENT LEVEL TOKEN
        }
      });
      
      if (showLogs) {
        console.log('🔔 API Response Status:', response.status);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          if (showLogs) {
            console.log('❌ Unauthorized - token might be expired');
            console.log('🔍 Token used:', token.substring(0, 20) + '...');
          }
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (showLogs) {
        console.log('🔔 Notifications Data:', data);
      }
      
      if (data.success) {
        const notificationList: Notification[] = data.notifications || [];
        setNotifications(notificationList);
        const unread = notificationList.filter((n) => !n.read).length;
        setUnreadCount(unread);

        // >>> CALL SYNC AFTER WE SET NOTIFICATIONS
        syncAvailabilityFromServer(notificationList);
        await hydrateLeagueNames(notificationList);
        await fetchMissingMatchTimes(notificationList);
        // >>> END
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    await fetchNotifications(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 🔥 FIXED: Use component level token instead of calling useAuth inside function
  const markAsRead = async (notificationId: string) => {
    try {
      console.log(`📖 Marking notification ${notificationId} as read`);
      
      // 🔥 REMOVED: const { token } = useAuth(); - USING COMPONENT LEVEL TOKEN
      if (!token) {
        console.log('❌ No token found for markAsRead');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 USE COMPONENT LEVEL TOKEN
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('✅ Notification marked as read');
      } else {
        console.error('❌ Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // 🔥 FIXED: Use component level token and user instead of calling useAuth inside function
  const markAllAsRead = async () => {
    try {
      console.log('📖 Marking all notifications as read');
      
      // 🔥 REMOVED: const { token } = useAuth(); - USING COMPONENT LEVEL TOKEN
      const userId = user?.id; // 🔥 USE COMPONENT LEVEL USER
      if (!token || !userId) {
        console.log('❌ No token or user ID found for markAllAsRead');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all?userId=${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 USE COMPONENT LEVEL TOKEN
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        console.log('✅ All notifications marked as read');
      } else {
        console.error('❌ Failed to mark all notifications as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleSetAvailability = async (
    matchId: string,
    value: 'YES'|'NO',
    notificationId: string
  ) => {
    if (!token || !user?.id) return;
    setAvailabilitySelections(prev => ({ ...prev, [matchId]: value }));
    setSavingAvailability(prev => ({ ...prev, [matchId]: true }));
    const action = value === 'YES' ? 'available' : 'unavailable';

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/availability?action=${action}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        console.error('Availability update failed', res.status);
      } else {
        const n = notifications.find(n => n.id === notificationId);
        if (n && !n.read) await markAsRead(notificationId);
      }
    } catch (e) {
      console.error('Error setting availability', e);
    } finally {
      setSavingAvailability(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // ---- 1) ADD STATE (near other useState declarations) ----
const [matchTimes, setMatchTimes] = useState<Record<string,{start?:string; end?:string}>>({});

  // 🔥 HELPER FUNCTION - KEEP FOR BACKWARD COMPATIBILITY
  // const getUserId = () => {
  //   // Use component level user first, fallback to localStorage
  //   if (user?.id) {
  //     return user.id;
  //   }
    
  //   try {
  //     const localUser = localStorage.getItem('user');
  //     if (localUser) {
  //       const parsedUser = JSON.parse(localUser);
  //       return parsedUser.id;
  //     }
  //   } catch (e) {
  //     console.error('Error getting user ID:', e);
  //   }
  //   return null;
  // };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    fetchNotifications(true); // already triggers sync
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  useEffect(() => {
    setMounted(true);
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // 🔥 FETCH NOTIFICATIONS ON MOUNT AND POLL
  useEffect(() => {
    if (isAuthenticated && token && user?.id) { // 🔥 ADDED TOKEN AND USER CHECK
      console.log('✅ User authenticated with token, starting notification system...');
      fetchNotifications(true);
      
      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      return () => {
        console.log('🛑 Clearing notification interval...'); 
        clearInterval(interval);
      };
    } else {
      console.log('❌ User not authenticated or missing token/user, skipping notifications');
      // Clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, user?.id]); // 🔥 ADDED TOKEN AND USER ID TO DEPENDENCY ARRAY

  const handleSignOut = async () => {
    try {
      await dispatch(logout());
      // Clear notifications on logout
      setNotifications([]);
      setUnreadCount(0);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };
  const handleProfileClick = () => {
    handleProfileMenuClose();
    router.push('/profile');
  };
  const handleSignOutClick = () => {
    handleProfileMenuClose();
    handleSignOut();
  };

  const navItems: { label: string; href: string }[] = [
    { label: 'Leagues', href: '/all-leagues' },
    { label: 'Matches', href: '/all-matches' },
    { label: 'Dream Team', href: '/dream-team' },
    { label: 'Player', href: '/all-players' },
    { label: 'Trophy Room', href: '/trophy-room' },
    { label: 'Leaderboard', href: '/leader-board' },
  ];

  const renderNavLinks = () => (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: { xs: 0.5, md: 1 },
      flexWrap: 'nowrap',
      overflow: 'hidden',
      justifyContent: 'flex-end'      // ✅ push links to the right inside this box
    }}>
      {navItems.map(({ label, href }) => {
        const active = pathname?.startsWith(href);
        return (
          <Button
            key={href}
            component={Link}
            href={href}
            aria-current={active ? 'page' : undefined}
            disableRipple
            sx={{
              textTransform: 'none',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontWeight: 700,
              color: '#fff',
              fontSize: { xs: '12px', sm: '9px', md: '13px', lg: '13px' },
              px: { xs: 0.5, sm: 0.50, md: 1, lg: 1 },
              py: { xs: 1, md: 1.25 },
              minWidth: 'auto',
              position: 'relative',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              borderRadius: 1,
              '&:hover': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                bottom: -6,
                height: '3px',
                width: active ? '80%' : 0,
                transform: 'translateX(-50%)',
                backgroundColor: '#fff',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
                boxShadow: active ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
              },
              '&:hover::after': {
                width: '80%',
                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
              },
              '&:focus-visible': {
                outline: '2px solid #fff',
                outlineOffset: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              // Active state styling
              ...(active && {
                backgroundColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }),
            }}
          >
            {label}
          </Button>
        );
      })}
    </Box>
  );

  if (!mounted) {
    return (
      <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 2 }}>
        <Toolbar>
          <Box sx={{ height: 40, width: 120, bgcolor: '#e0e0e0', borderRadius: 1 }} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
          boxShadow: 3,
          px: { xs: 1, sm: 2, md: 2 }
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          minHeight: { xs: '60px', md: '70px' },
          gap: { xs: 1, md: 2 }
        }}>
          {/* LOGO SECTION */}
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Box sx={{ 
              width: { xs: 180, sm: 220, md: 280, lg: 350 }, 
              display: 'flex' 
            }}>
              <Image
                src={cflogo}
                alt="Champion Footballer Logo"
                width={350}
                height={40}
                priority
                style={{
                  height: '40px',
                  width: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Link>

          {/* DESKTOP NAVIGATION (moved to right) */}
          <Box sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            ml: 'auto',              // ✅ push whole nav group to the right
            // pr: 2,                   // optional padding right
            // gap: 1
          }}>
            {isAuthenticated && renderNavLinks()}
          </Box>

          {/* RIGHT SIDE CONTROLS */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 0.5, md: 1 },
            flexShrink: 0
          }}>
            {isAuthenticated && (
              <>
                {/* NOTIFICATION BELL - DESKTOP */}
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{
                    color: '#fff',
                    display: { xs: 'none', lg: 'flex' },
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error" 
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                {/* PROFILE BUTTON - DESKTOP */}
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    textTransform: 'none',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 'bold',
                    color: '#fff',
                    bgcolor: '#2B2B2B',
                    borderRadius: 2,
                    px: 2.5,
                    fontSize: '14px',
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#2B2B2B',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                  }}
                >
                  Profile
                </Button>

                {/* MOBILE CONTROLS */}
                <Box sx={{ 
                  display: { xs: 'flex', lg: 'none' }, 
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {/* MOBILE NOTIFICATION BELL */}
                  <IconButton
                    onClick={handleNotificationClick}
                    sx={{
                      color: '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error" 
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
                        }
                      }}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>

                  {/* MOBILE MENU BUTTON */}
                  <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    onClick={() => setDrawerOpen(true)}
                    sx={{ 
                      color: '#fff',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                      }
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>

                {/* PROFILE MENU */}
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={openProfileMenu}
                  onClose={handleProfileMenuClose}
                  TransitionComponent={SlideFade}
                  PaperProps={{
                    sx: {
                      p: 0.5,
                      mt: 1.5,
                      minWidth: 200,
                      bgcolor: 'rgba(15,15,15,0.92)',
                      color: '#E5E7EB',
                      borderRadius: 2.5,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                      overflow: 'hidden',
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem
                    onClick={handleProfileClick}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={player} alt="profile" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>Profile</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setHowToPlayOpen(true); handleProfileMenuClose(); }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={play} alt="how to play" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>How to play</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setGameRulesOpen(true); handleProfileMenuClose(); }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={gamification} alt="rules" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>Game rules</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={handleSignOutClick}
                    sx={{
                      color: '#F87171',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'linear-gradient(90deg, rgba(239,68,68,0.25), rgba(239,68,68,0.10))',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image src={logoutpic} alt="sign out" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
                      <Box>Sign out</Box>
                    </Box>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* NOTIFICATION POPOVER - ENHANCED */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 8,
          sx: {
            width: { xs: 320, sm: 380 },
            maxHeight: 400,
            bgcolor: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
            Notifications {notifications.length > 0 && `(${notifications.length})`}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* REFRESH BUTTON */}
            <IconButton
              onClick={handleRefreshNotifications}
              disabled={isRefreshing}
              size="small"
              sx={{ 
                color: '#1976d2',
                '&:hover': { bgcolor: 'rgba(25,118,210,0.04)' },
                '&:disabled': { color: '#ccc' }
              }}
              title="Refresh notifications"
            >
              <RefreshIcon 
                fontSize="small" 
                sx={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
            </IconButton>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                size="small"
                sx={{ 
                  color: '#1976d2', 
                  fontSize: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(25,118,210,0.04)' }
                }}
              >
                Mark all read
              </Button>
            )}
            <IconButton
              onClick={handleNotificationClose}
              size="small"
              sx={{ color: '#666' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#666' }}>
              <RefreshIcon sx={{ fontSize: 32, color: '#ccc', mb: 1, animation: 'spin 1s linear infinite' }} />
              <Typography>Loading notifications...</Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#666' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography>No notifications yet</Typography>
              <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                Create a match to test notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => {
              console.log('Render notif', notification.id, 'type=', notification.type);
              
              const meta: MatchMeta = (notification.meta ?? {}) as MatchMeta;
              const leagueKeyForIndex =
                meta.leagueId ||
                meta.league_id ||
                meta.leagueName ||
                meta.league_name ||
                'default';
              const derivedMatchNo = leagueMatchIndexMap[leagueKeyForIndex]?.[notification.id];

              // Resolve league name safely (avoid indexing with undefined)
              const leagueIdKey = meta.leagueId || meta.league_id;
              const resolvedLeagueName =
                (leagueIdKey ? leagueNames[leagueIdKey] : undefined) ||
                leagueNames[leagueKeyForIndex];

              // Insert times override beforehand:
              const matchMetaId =
                meta.matchId ||
                meta.match_id ||
                '';
              const timesOverride = matchMetaId ? matchTimes[matchMetaId] : undefined;
              const isMatchType = isMatchCreated(notification); // removed: as any
              if (isMatchType && matchMetaId) {
                console.log('🧪 timesOverride for', matchMetaId, timesOverride);
              }
              const display = buildNotificationDisplay(notification, derivedMatchNo, resolvedLeagueName, timesOverride);
              const matchId =
                (notification.meta?.matchId as string) ||
                (notification.meta?.match_id as string) || '';
              const selected = matchId ? availabilitySelections[matchId] : undefined;
              const saving = matchId ? savingAvailability[matchId] : false;

              return (
                <Box key={notification.id}>
                  <Box
                    onClick={() => !notification.read && !isMatchType && markAsRead(notification.id)}
                    sx={{
                      p: 2,
                      cursor: notification.read || isMatchType ? 'default' : 'pointer',
                      position: 'relative',
                      bgcolor: notification.read
                        ? '#ffffff'
                        : 'linear-gradient(135deg,#f0f6ff 0%, #ffffff 60%)',
                      borderLeft: notification.read ? '4px solid transparent' : '4px solid #1976d2',
                      '&:hover': {
                        bgcolor: notification.read
                          ? '#fafafa'
                          : (isMatchType
                              ? 'linear-gradient(135deg,#e8f2ff 0%, #ffffff 60%)'
                              : '#e8f2ff')
                      },
                      transition: 'background-color 0.25s, box-shadow 0.25s',
                      boxShadow: notification.read
                        ? 'inset 0 0 0 1px #eee'
                        : '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        {!isMatchType && notification.type !== 'MATCH_CREATED' && (
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 500 : 700,
                              color: '#222',
                              mb: 0.5,
                              fontSize: '14px'
                            }}
                          >
                            {display.title}
                          </Typography>
                        )}

                        {!isMatchType && display.node}

                        {isMatchType && (
                          <Box>
                            {display.node}
                            {matchId && (() => {
                              const started = matchHasStarted(meta, timesOverride);
                              const showAvailability = !started;
                              if (!showAvailability) return null;
                              return (
                                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                                    Can you play?
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Box
                                      component="button"
                                      disabled={saving}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetAvailability(matchId, 'YES', notification.id);
                                      }}
                                      style={{ all: 'unset', cursor: 'pointer' }}
                                      aria-pressed={selected === 'YES'}
                                    >
                                      <Box sx={{
                                        px: 1.2,
                                        py: 0.5,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        transition: '0.2s',
                                        bgcolor: selected === 'YES' ? '#0d7a33' : '#e6f9ed',
                                        color: selected === 'YES' ? '#fff' : '#0d7a33',
                                        borderColor: selected === 'YES' ? '#0d7a33' : '#a8e4bf',
                                        boxShadow: selected === 'YES' ? '0 0 0 2px rgba(13,122,51,0.25)' : 'none',
                                        opacity: saving && selected === 'YES' ? 0.7 : 1
                                      }}>
                                        ✅ Yes
                                      </Box>
                                    </Box>
                                    <Box
                                      component="button"
                                      disabled={saving}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetAvailability(matchId, 'NO', notification.id);
                                      }}
                                      style={{ all: 'unset', cursor: 'pointer' }}
                                      aria-pressed={selected === 'NO'}
                                    >
                                      <Box sx={{
                                        px: 1.2,
                                        py: 0.5,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        transition: '0.2s',
                                        bgcolor: selected === 'NO' ? '#c62828' : '#ffecef',
                                        color: selected === 'NO' ? '#fff' : '#c62828',
                                        borderColor: selected === 'NO' ? '#c62828' : '#f5b5c0',
                                        boxShadow: selected === 'NO' ? '0 0 0 2px rgba(198,40,40,0.25)' : 'none',
                                        opacity: saving && selected === 'NO' ? 0.7 : 1
                                      }}>
                                        ❌ No
                                      </Box>
                                    </Box>
                                  </Box>
                                  {saving && (
                                    <Typography sx={{ fontSize: '11px', color: '#555' }}>
                                      Saving...
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })()}
                          </Box>
                        )}

                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mt: 1.25, color: '#888', fontSize: '11px' }}
                        >
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </Box>

                      {!notification.read && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            bgcolor: 'linear-gradient(135deg,#1976d2,#0d47a1)',
                            borderRadius: '50%',
                            mt: 0.5,
                            flexShrink: 0,
                            boxShadow: '0 0 0 3px rgba(25,118,210,0.15)'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              );
            })
          )}
        </Box>
      </Popover>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ mt: 2, px: 2 }}>
          <List>
            {/* PROFILE BUTTON IN MOBILE DRAWER */}
            {isAuthenticated && (
              <ListItem disablePadding>
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<AccountCircleIcon />}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 'bold',
                    color: '#fff',
                    bgcolor: '#2B2B2B',
                    borderRadius: 2,
                    px: 3,
                    py: 1.25,
                    fontSize: '14px',
                    justifyContent: 'flex-start',
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                    mb: 1,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      bgcolor: '#2B2B2B',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                    '& .MuiButton-startIcon': { marginRight: 1 },
                  }}
                >
                  Profile
                </Button>
              </ListItem>
                       )}
            
            {/* MOBILE NAVIGATION LINKS */}
            {isAuthenticated && (
              navItems.map(({ label, href }) => {
                const active = pathname?.startsWith(href);
               
                return (
                  <ListItem key={href} disablePadding>
                    <Button
                     
                      component={Link}
                      href={href}
                      fullWidth
                      onClick={() => setDrawerOpen(false)}
                      disableRipple
                      sx={{
                        justifyContent: 'flex-start',
                        px: 3,
                        py: 1.5,
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                       
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { 
                          background: 'rgba(255,255,255,0.12)',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ListItemText primary={label} sx={{ color: '#fff' }} />
                    </Button>
                  </ListItem>
                );
              })
            )}
          </List>
        </Box>
      </Drawer>

      {/* YOUR EXISTING DIALOGS - keeping them as they were */}
      <Dialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          bgcolor: '#1f673b',
          color: 'white',
          fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '24px', md: '32px' }
        }}>
          How to Play
          <IconButton
            aria-label="close"
            onClick={() => setHowToPlayOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ color: '#222', mt: 2 }}>
          {/* Step 1: Player Card */}
          <Typography variant="h6" sx={{
            fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '24px', md: '32px' },
            mb: 2
          }}>
            1. Set Up Your Player Card
          </Typography>
          <Typography variant="body1" sx={{
            mb: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: { xs: '16px', md: '18px' }
          }}>
            After registering, your Player Card stats will be set to zero by default. Before joining a match, update your Player Card by adjusting your skill levels using the sliders. These stats help balance teams and improve match predictions.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={playercardupdate.src} alt='Player Card Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          {/* Step 2: Join or Create a League */}
          <Typography variant="h6" sx={{
            fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '24px', md: '32px' },
            mb: 2
          }}>
            2. Join or Create a League
          </Typography>
          <Typography variant="body1" sx={{
            mb: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: { xs: '16px', md: '18px' }
          }}>
            To play matches, you need to be part of a league. You can join an existing league using an <b>invite code</b> or the <b>join league</b> link. To create your own league, click the <b>Create New League</b> button on the home page and enter a league name.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={leagueimg.src} alt='League Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            If you are in multiple leagues, the all league among them will be displayed as your primary league in the Join League section.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            By default, once you have created a new league you will be assigned as league<b> admin</b>. The league admin will be given full control over selecting teams, creating new matches and adding in match scores. You can always switch the league admin anytime with another player in the same league by going through the league setting option
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={leaguesetting.src} alt='leaguesetting' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            In the league setting as the league admin, it is good practice to enter the total number of matches to be played in the league. Once you have reached the maximum number of games in the league, virtual awards will be finalised on the home page.
          </Typography>
          {/* Step  3: Play Matches & Track Progress */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            3. Play Matches & Track Progress
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Once you’re in a league, you can join scheduled matches, view your stats, and see your progress on the leaderboard and trophy room. Keep your Player Card updated for the best experience!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Replace progressimg with your actual image import */}
            <Image src={progressimg.src} alt='Progress Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          {/* Step 4: Earn XP & Win Awards */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            4. Earn XP & Win Awards
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You earn XP (Experience Points) for your performance in matches:
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Win: 30 XP &nbsp;|&nbsp; Draw: 15 XP &nbsp;|&nbsp; Loss: 10 XP</li>
              <li>Goal: 3 XP (win), 2 XP (loss)</li>
              <li>Assist: 2 XP (win), 1 XP (loss)</li>
              <li>Clean Sheet (GK):  5 XP</li>
              <li>Man of the Match: 10 XP (win), 5 XP (loss)</li>
              <li>Special Achievements: Extra XP for milestones (e.g., hat-trick, win streaks, etc.)</li>
            </ul>
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`At the end of each league, top performers win special awards`}:<br />
            <b>Champion Footballer</b> {`(1st place),`} <b>{`Runner-Up`}</b> {`(2nd place),`} <b>{`Ballon d'Or`}</b>{` (most MOTM),`} <b>GOAT</b> {`(highest win ratio),`} <b>Golden Boot</b> {`(most goals),`} <b>King Playmaker</b> {`(most assists),`} <b>Legendary Shield</b> {`(best defender/goalkeeper), and `}<b>The Dark Horse</b> {`(outside top 3, most MOTM votes)`}.
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            5. Creating Matches and Selecting Teams
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            As a league admin you can create matches and select teams.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`To create a new match, select `}<b>Matches</b> {`> click on to`} <b>Schedule New Match </b>{`and enter the relevant match details >`} <b>Schedule Match</b>{`. The new match will be visible to all players in the league. `}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
           
            {`Players can select their availability to play the match by logging in to their home page > click on to`} Matches {`>`}<b> Mark yourself as available</b>.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Replace progressimg with your actual image import */}
            <Image src={matchdetails.src} alt='Progress Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            6. League Table
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Once a match has been played and scores has been uploaded by the league admin, players on the <b>winning</b> team will be allocated 3 points and 1 for drawing. All players can view match results. The player with the most matches won in a league becomes the <b>Champion Footballer</b>.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`You can track each player’s game stats by clicking onto player name from league table. `}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Replace progressimg with your actual image import */}
            <Image src={palyerstats.src} alt='Progress Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            7. League Admin
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            League admin will have a slightly different view on Champion Football to the rest of the players in the league. League admin can be interchangeable between league players.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The league admin will act as the league manager and will be passed on the responsibility to keep the league running by creating matches, selecting teams, adding scores.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The league admin can alter changes to the league such as league/team names, number of games to be played
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog open={gameRulesOpen} onClose={() => setGameRulesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          bgcolor: '#1f673b',
          color: 'white',
          fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '24px', md: '32px' }
        }}>
          Game rules
          <IconButton
            aria-label="close"
            onClick={() => setGameRulesOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f8fafc', color: '#222', py: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#1f673b', fontWeight: 700 }}>Rules</Typography>
          <ul style={{ marginLeft: 20, marginBottom: 16, color: '#222' }}>
            <li style={{ listStyleType: 'disc' }}>Play fair</li>
            <li style={{ listStyleType: 'disc' }}>Pick balance teams</li>
            <li style={{ listStyleType: 'disc' }}>Rise to the challenge</li>
            <li style={{ listStyleType: 'disc' }}>Have fun!</li>
          </ul>
          <Typography variant="h6" sx={{ mb: 1, color: '#1f673b', fontWeight: 700 }}>Characteristics of a champion</Typography>
          <ul style={{ marginLeft: 20, color: '#222', fontSize: '1.1rem' }}>
            <li><span style={{ fontWeight: 900 }}>C</span>ourageous</li>
            <li><span style={{ fontWeight: 900 }}>H</span>opeful</li>
            <li><span style={{ fontWeight: 900 }}>A</span>ppreciative</li>
            <li><span style={{ fontWeight: 900 }}>M</span>odest</li>
            <li><span style={{ fontWeight: 900 }}>O</span>ptimistic</li>
            <li><span style={{ fontWeight: 900 }}>N</span>oble</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

// LOGIN SUCCESS - ADD TOKEN STORAGE
// const handleLoginSuccess = (response: any) => {
//   // Store user data (already happening)
//   localStorage.setItem('user', JSON.stringify(response.data.user));
//   localStorage.setItem('userData', JSON.stringify(response.data.userData));
  
//   // 🔥 ADD TOKEN STORAGE - CHECK RESPONSE STRUCTURE
//   if (response.data.token) {
//     localStorage.setItem('token', response.data.token);
//     console.log('✅ Token stored:', response.data.token.substring(0, 20) + '...');
//   } else if (response.data.accessToken) {
//     localStorage.setItem('token', response.data.accessToken);
//     console.log('✅ Access Token stored:', response.data.accessToken.substring(0, 20) + '...');
//   } else if (response.token) {
//     localStorage.setItem('token', response.token);
//     console.log('✅ Response Token stored:', response.token.substring(0, 20) + '...');
//   } else {
//     console.error('❌ No token found in login response!');
//     console.log('🔍 Login Response Structure:', response);
//   }
// };