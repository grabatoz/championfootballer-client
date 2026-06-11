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
  Badge,
  Popover,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  // Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Star from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, initializeFromStorage } from '@/lib/features/authSlice';
import cflogo from '@/Components/images/champion football logo 3 (1).png';
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
import logoutpic from '@/Components/images/logout.png'
import { useAuth } from '@/lib/hooks';
import React from 'react';
import toast from 'react-hot-toast';
import TextField from '@mui/material/TextField';
import PlayMatchPagee from '@/Components/matchstatsdialog/MatchStatsDialog';
import { leagueAPI } from '@/lib/api-ultra-fast';
import NotificationMenuLoadingSkeleton from '@/Components/loading/NotificationMenuLoadingSkeleton';
// import PlayerStatsDialog from '@/Components/PlayerStatsDialog';
type NotificationKind =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_NOTIFICATION'
  | 'TEAM_SELECTION'
  | 'AVAILABILITY_REMINDER'
  | 'RESULT_PUBLISHED'
  | 'RESULT_CONFIRMATION_REQUEST'
  | 'CAPTAIN_CONFIRMED'
  | 'CAPTAIN_REVISION_SUGGESTED'
  | 'MATCH_ENDED'
  | 'MOTM_VOTE'
  | 'NEW_SEASON'
  | 'ADMIN_REASSIGNED'
  | 'LEAGUE_DELETED'
  | 'GENERAL';
interface NotificationMeta {
  matchId?: string;
  leagueId?: string;
  playerId?: string;
  [key: string]: unknown;
}

type LeagueRole = {
  userId?: string | number;
  user_id?: string | number;
  role?: string;
  name?: string;
  user?: { id?: string | number };
};

type NotificationPayloadBase = {
  type?: string;
  title?: string;
  body?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

type NotificationCreateBody = NotificationPayloadBase & {
  userId?: string | number;
  user_id?: string | number;
  receiverId?: string | number;
  receiver_id?: string | number;
  recipientId?: string | number;
  recipient_id?: string | number;
  toUserId?: string | number;
  to_user_id?: string | number;
  userIds?: Array<string | number>;
};

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

// ADD: availability record type from the API
type AvailabilityRecord = {
  userId?: string | number;
  user_id?: string | number;
  status?: string | number | boolean;
};
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

// Broaden availability kinds to include text-based matches too
function isAvailabilityNotification(n: Notification) {
  const t = (n.type || '').toUpperCase();
  return (
    ['MATCH_CREATED', 'MATCH_UPDATED', 'TEAM_SELECTION', 'AVAILABILITY_REMINDER'].includes(t) ||
    isMatchCreated(n)
  );
}

// Identify "Confirm result" notifications
function isResultConfirmationNotification(n: Notification) {
  const t = (n.type || '').toUpperCase();
  if (t === 'RESULT_CONFIRMATION_REQUEST') return true;
  const titleBody = ((n.title || '') + ' ' + (n.body || '')).toUpperCase();
  return /CONFIRM\s+RESULT/.test(titleBody);
}

function isMotmSelectionNotification(n: Notification) {
  const t = String(n.type || '').toUpperCase();
  if (t === 'MOTM_VOTE') return true;
  const titleBody = `${n.title || ''} ${n.body || ''}`.toLowerCase();
  return titleBody.includes('as motm') && titleBody.includes('voted for');
}

// Global switch to force availability buttons (use true for testing, false for prod)
const ALWAYS_SHOW_AVAILABILITY = true;

function formatTime(raw?: string | number): string {
  if (raw === undefined || raw === null || raw === '') return '';

  // Epoch (seconds or ms)
  if (typeof raw === 'number' || /^\d{10,13}$/.test(String(raw))) {
    const num = typeof raw === 'number' ? raw : Number(raw);
    const ms = String(raw).length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return toHHMM(d);
  }

  const str = String(raw).trim();

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

function minutesToClock(total: number): string {
  // Always return 24h HH:MM
  const mins = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
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
function pickFirst(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
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
// function matchHasStarted(
//   meta: MatchMeta,
//   timesOverride?: { start?: string },
//   now: Date = new Date()
// ): boolean {
//   // Gather possible start time fields
//   let startRaw =
//     timesOverride?.start ||
//     meta.startTime || meta.start_time || meta.start ||
//     meta.kickoff || meta.kickOff || meta.kick_off ||
//     meta.kickoffTime || meta.kickoff_time ||
//     meta.scheduledStart || meta.scheduled_start ||
//     meta.startAt || meta.start_at ||
//     meta.matchStart || meta.match_start ||
//     meta.from || meta.time_from ||
//     meta.startDateTime || meta.start_datetime || meta.start_date_time ||
//     meta.begin || meta.beginTime || meta.begin_time;

//   if (!startRaw) return false;
//   startRaw = String(startRaw).trim();

//   // If only time (HH:MM[/ AM/PM]) try to combine with a date field if present
//   const clockOnly = startRaw.match(/^(\d{1,2}):(\d{2})(?:\s?(AM|PM|am|pm))?$/);
//   if (clockOnly) {
//     const dateField =
//       meta.date || meta.matchDate || meta.match_date ||
//       meta.day || meta.playDate || meta.play_date ||
//       meta.scheduledDate || meta.scheduled_date ||
//       meta.startDate || meta.start_date;
//     if (dateField) {
//       let dateStr = String(dateField).trim();
//       if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
//         dateStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
//       }
//       let h = parseInt(clockOnly[1], 10);
//       const m = clockOnly[2];
//       const ap = clockOnly[3];
//       if (ap) {
//         const up = ap.toUpperCase();
//         if (up === 'AM' && h === 12) h = 0;
//         if (up === 'PM' && h < 12) h += 12;
//       }
//       startRaw = `${dateStr}T${String(h).padStart(2,'0')}:${m}:00`;
//     } else {
//       // Cannot decide without a date
//       return false;
//     }
//   }

//   // Fix malformed 2025:09:26T...
//   if (/^\d{4}:\d{2}:\d{2}T/.test(startRaw)) {
//     startRaw = startRaw.replace(/^(\d{4}):(\d{2}):(\d{2})T/, '$1-$2-$3');
//   }

//   const d = new Date(startRaw);
//   if (isNaN(d.getTime())) return false;
//   return now.getTime() >= d.getTime();
// }
// >>> END ADDED HELPER

// >>> add below matchHasStarted
function matchHasEnded(
  meta: MatchMeta,
  timesOverride?: { start?: string; end?: string },
  now: Date = new Date()
): boolean {
  // Prefer explicit end time (override or meta)
  let endRaw =
    timesOverride?.end ||
    meta.endTime || meta.end_time || meta.end ||
    meta.finishTime || meta.finish_time || meta.finish ||
    meta.endAt || meta.end_at ||
    meta.to || meta.time_to ||
    meta.matchEnd || meta.match_end ||
    meta.scheduledEnd || meta.scheduled_end ||
    meta.endingTime || meta.ending_time ||
    meta.matchEndTime || meta.match_end_time ||
    meta.endtime || meta.stop || meta.stopTime || meta.stop_time ||
    meta.finishAt || meta.finish_at ||
    meta.endDateTime || meta.end_datetime || meta.end_date_time;

  // If only clock, combine with a date on meta
  const clockOnly = (s: string) => s.match(/^(\d{1,2}):(\d{2})(?:\s?(AM|PM|am|pm))?$/);
  const getDateField = () =>
    meta.date || meta.matchDate || meta.match_date ||
    meta.day || meta.playDate || meta.play_date ||
    meta.scheduledDate || meta.scheduled_date ||
    meta.startDate || meta.start_date;

  if (endRaw && clockOnly(String(endRaw).trim())) {
    const d = String(getDateField() || '').trim();
    if (d) {
      let dateStr = d;
      if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
        dateStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      }
      const m = clockOnly(String(endRaw).trim())!;
      let h = parseInt(m[1], 10);
      const mm = m[2];
      const ap = m[3];
      if (ap) {
        const up = ap.toUpperCase();
        if (up === 'AM' && h === 12) h = 0;
        if (up === 'PM' && h < 12) h += 12;
      }
      endRaw = `${dateStr}T${String(h).padStart(2,'0')}:${mm}:00`;
    }
  }

  // If still no end, derive from start + duration (default 90)
  if (!endRaw) {
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

    if (startRaw) {
      startRaw = String(startRaw).trim();
      if (/^\d{4}:\d{2}:\d{2}T/.test(startRaw)) {
        startRaw = startRaw.replace(/^(\d{4}):(\d{2}):(\d{2})T/, '$1-$2-$3');
      }
      // combine plain clock with date if needed
      const clock = clockOnly(startRaw);
      if (clock) {
        const d = String(getDateField() || '').trim();
        if (!d) return false; // cannot decide end without a date
        let dateStr = d;
        if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
          dateStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
        }
        let h = parseInt(clock[1], 10);
        const mm = clock[2];
        const ap = clock[3];
        if (ap) {
          const up = ap.toUpperCase();
          if (up === 'AM' && h === 12) h = 0;
          if (up === 'PM' && h < 12) h += 12;
        }
        startRaw = `${dateStr}T${String(h).padStart(2,'0')}:${mm}:00`;
      }

      const durRaw =
        meta.duration || meta.durationMinutes || meta.duration_minutes ||
        meta.matchDuration || meta.lengthMinutes || meta.length;
      const dur = durRaw ? parseInt(String(durRaw), 10) : 90;

      const sd = new Date(startRaw);
      if (!isNaN(sd.getTime())) {
        const ed = new Date(sd.getTime() + (isNaN(dur) ? 90 : dur) * 60000);
        return now.getTime() >= ed.getTime();
      }
      return false;
    }
    return false;
  }

  // fix malformed YYYY:MM:DDT...
  endRaw = String(endRaw).trim();
  if (/^\d{4}:\d{2}:\d{2}T/.test(endRaw)) {
    endRaw = endRaw.replace(/^(\d{4}):(\d{2}):(\d{2})T/, '$1-$2-$3T');
  }

  const d = new Date(endRaw);
  if (isNaN(d.getTime())) return false;
  return now.getTime() >= d.getTime();
}

// Safely normalize any match id (trim, remove all whitespace)
function sanitizeMatchId(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  
  // If v is already a string, check if it's a JSON string that needs parsing
  if (typeof v === 'string') {
    const trimmed = v.trim();
    // Check if it looks like a JSON object string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        // If it's an object with matchId, extract that
        if (typeof parsed === 'object' && parsed !== null) {
          return sanitizeMatchId(parsed.matchId || parsed.match_id || parsed.id);
        }
      } catch {
        // Not valid JSON, continue with normal string handling
      }
    }
    const s = trimmed.replace(/\s+/g, '');
    return s.length ? s : undefined;
  }
  
  // If v is an object, try to extract matchId from it
  if (typeof v === 'object' && v !== null) {
    const obj = v as Record<string, unknown>;
    const matchId = obj.matchId || obj.match_id || obj.id;
    if (matchId) {
      return sanitizeMatchId(matchId);
    }
  }
  
  const s = String(v).trim().replace(/\s+/g, '');
  return s.length ? s : undefined;
}

// Extract matchId from meta with multiple fallbacks (no `any`)
function getMatchId(meta?: NotificationMeta): string | undefined {
  if (!meta) return undefined;

  // In case meta comes as a string from backend (defensive)
  const raw = meta as unknown;
  if (typeof raw === 'string') return sanitizeMatchId(raw);

  const obj = meta as Record<string, unknown>;

  const read = (o: Record<string, unknown>, key: string): string | undefined => {
    const v = o[key];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return undefined;
  };

  // 1) Common keys
  let id =
    read(obj, 'matchId') ??
    read(obj, 'match_id') ??
    read(obj, 'id');

  // 2) Nested shapes
  if (!id) {
    const nested = obj['match'];
    if (nested && typeof nested === 'object') {
      const mo = nested as Record<string, unknown>;
      id = read(mo, 'id') ?? read(mo, 'matchId') ?? read(mo, 'match_id');
    }
  }

  // 3) Scan for UUID in stringified meta
  if (!id) {
    try {
      const blob = JSON.stringify(meta);
      const uuid = blob.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
      if (uuid) id = uuid[0];
    } catch {
      // ignore
    }
  }

  return sanitizeMatchId(id);
}

// If missing, add this helper once (used to build "See" links) - no `any`
function getSeeHref(meta?: NotificationMeta): string | undefined {
  if (!meta) return undefined;

  const obj = meta as Record<string, unknown>;

  // cta href
  let path: string | undefined;
  const cta = obj['cta'];
  if (cta && typeof cta === 'object') {
    const href = (cta as Record<string, unknown>)['href'];
    if (typeof href === 'string') path = href;
  }
  if (!path && typeof obj['ctaHref'] === 'string') path = obj['ctaHref'] as string;
  if (!path && typeof obj['href'] === 'string') path = obj['href'] as string;

  // direct url
  const url = typeof obj['url'] === 'string' ? (obj['url'] as string) : undefined;

  if (path) return String(path);
  if (url) return String(url);

  const matchId = getMatchId(meta);

  const leagueId =
    (typeof obj['leagueId'] === 'string' ? (obj['leagueId'] as string) : undefined) ??
    (typeof obj['league_id'] === 'string' ? (obj['league_id'] as string) : undefined);

  // if (leagueId && matchId) return `/league/${String(leagueId)}/match/${String(matchId)}/play`;
   if (matchId) return `/match/${String(matchId)}`;
  if (matchId) return `/match/${String(matchId)}`;
  return undefined;
}

// Build notification display for match-related notifications
function buildNotificationDisplay(
  n: Notification,
  derivedMatchNo?: number,
  resolvedLeagueName?: string,
  timesOverride?: { start?: string; end?: string },
  metaCache?: Record<string, { matchNumber?: string; date?: string; leagueName?: string }>
): BuiltNotificationDisplay {
  if (isMatchCreated(n)) {
    const meta: MatchMeta = (n.meta ?? {}) as MatchMeta;
    const matchMetaId = getMatchId(meta) || '';
    const cachedMatchNo = matchMetaId ? metaCache?.[matchMetaId]?.matchNumber : undefined;

    // Match number (backend or derived)
    const backendMatchNo = pickFirst(meta, [
      'matchNumber','match_no','matchIndex','match_index'
    ]);
    const matchNo = cachedMatchNo
      ? String(cachedMatchNo)
      : backendMatchNo
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
    const dateIso =
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
        endRaw = minutesToClock(endMins);
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
    const matchId = matchMetaId || '';
    const seeDetailsHref = matchId ? `/match/${matchId}` : '#';

    const plainParts: string[] = [];
    if (dateLine) plainParts.push(dateLine);
    if (venue) plainParts.push(venue);
    const plain = plainParts.join('\n');

    const node = (
      <Box>
        <Typography sx={{ fontWeight: 700, color: '#111', fontSize: '12px', lineHeight: 1.25, mb: 0.3 }}>
         New Match Scheduled! ⚽ Match {matchNo || '?'} • {leagueName}
        </Typography>

        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#555', lineHeight: 1.3 }}>
          {startFmt}{startFmt && endFmt && ' - '}{endFmt}
          {(startFmt || endFmt) && dateLine && ' • '}
          {dateLine}
          {venue && ` • ${venue}`}
        </Typography>
      </Box>
    );

    const uiTitle = `Match ${matchNo || ''} Scheduled`;
    return { title: uiTitle, plain, node };
  }

  // ADMIN_REASSIGNED notification — rich display
  if (n.type === 'ADMIN_REASSIGNED') {
    const meta = (n.meta ?? {}) as Record<string, unknown>;
    const leagueName = (meta.leagueName as string) || '';
    const newAdminName = (meta.newAdminName as string) || 'a new player';
    const bodyText = n.body || `New admin selected, ${newAdminName}.`;
    const node = (
      <Box>
        <Typography sx={{ fontWeight: 700, color: '#111', fontSize: '12px', lineHeight: 1.25, mb: 0.3 }}>
          👑 New Admin Selected
        </Typography>
        <Typography sx={{ color: '#444', fontSize: '13px', lineHeight: 1.45 }}>
          {bodyText}
        </Typography>
        {leagueName && (
          <Typography sx={{ fontSize: '12px', color: '#333', fontWeight: 600, mt: 0.5 }}>
            League: {leagueName}
          </Typography>
        )}
      </Box>
    );
    return { title: n.title || '👑 New Admin Selected', plain: bodyText, node };
  }

  // LEAGUE_DELETED notification — rich display
  if (n.type === 'LEAGUE_DELETED') {
    const meta = (n.meta ?? {}) as Record<string, unknown>;
    const leagueName = (meta.leagueName as string) || '';
    const bodyText = n.body || `The league "${leagueName}" has been deleted. Your XP points have been preserved.`;
    const node = (
      <Box>
        <Typography sx={{ fontWeight: 700, color: '#d32f2f', fontSize: '12px', lineHeight: 1.25, mb: 0.3 }}>
          🗑️ League Deleted
        </Typography>
        <Typography sx={{ color: '#444', fontSize: '13px', lineHeight: 1.45 }}>
          {bodyText}
        </Typography>
        {leagueName && (
          <Typography sx={{ fontSize: '12px', color: '#333', fontWeight: 600, mt: 0.5 }}>
            League: {leagueName}
          </Typography>
        )}
        <Typography sx={{ fontSize: '11px', color: '#27ab83', fontWeight: 600, mt: 0.5 }}>
          Your XP points are safe
        </Typography>
      </Box>
    );
    return { title: n.title || '🗑️ League Deleted', plain: bodyText, node };
  }

  // Non-match notification fallback (show league, match no/index, date, and CTA)
  const title = n.title || 'Notification';
  const bodyText = n.body?.length ? n.body : 'New update available.';
  const meta: MatchMeta = (n.meta ?? {}) as MatchMeta;

  // Use matchId to read cache fallbacks
  const matchId = getMatchId(meta);
  const cached = matchId && metaCache ? metaCache[matchId] : undefined;

  const leagueName =
    extractLeagueName(meta, resolvedLeagueName) ||
    cached?.leagueName ||
    '';

  const matchNo =
    pickFirst(meta, ['matchNumber','match_no','matchIndex','match_index']) ||
    cached?.matchNumber ||
    '';

  const dateIso =
    normalizePossibleDate(
      pickFirst(meta, [
        'date','matchDate','scheduledDate','startDate','start_date','startDateTime','start_datetime',
        'start','startTime','start_time','scheduledStart','scheduled_start','kickoff','kickoff_time','kickoffTime'
      ]) || cached?.date
    ) || undefined;

  const dateLine = dateIso ? formatDateLine(dateIso) : '';
  const seeHref = getSeeHref(n.meta);
  const normalizeForCompare = (value: string) =>
    String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const containsLine = (haystack: string, line: string) =>
    normalizeForCompare(haystack).includes(normalizeForCompare(line));

  const showLeagueMeta = !!leagueName && !containsLine(bodyText, `League: ${leagueName}`);
  const showMatchMeta =
    !!matchNo &&
    !containsLine(bodyText, `Match: ${matchNo}`) &&
    !containsLine(bodyText, `Match ${matchNo}`);
  const showDateMeta = !!dateLine && !containsLine(bodyText, dateLine);
  const hasAnyMeta = showLeagueMeta || showMatchMeta || showDateMeta;

  return {
    title,
    plain: [
      bodyText,
      showDateMeta ? dateLine : '',
      showLeagueMeta ? leagueName : '',
      showMatchMeta ? `Match ${matchNo}` : '',
    ].filter(Boolean).join('\n'),
    node: (
      <Box>
        <Typography sx={{ color: '#444', fontSize: '13px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
          {bodyText}
        </Typography>

        {hasAnyMeta && (
          <Box sx={{ mt: 0.75 }}>
            {showLeagueMeta && (
              <Typography sx={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>
                League: {leagueName}
              </Typography>
            )}
            {showMatchMeta && (
              <Typography sx={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>
                Match: {matchNo}
              </Typography>
            )}
            {showDateMeta && (
              <Typography sx={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>
                {dateLine}
              </Typography>
            )}
          </Box>
        )}

        {matchId && (
          <Box sx={{ mt: 1 }}>
            <Button
              component={Link}
              href={(matchId ? `/match/${matchId}` : '#')}
              size="small"
              variant="contained"
              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              See Details
            </Button>
          </Box>
        )}
      </Box>
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
  const [xpStatusOpen, setXpStatusOpen] = useState(false);
  const pathname = usePathname();

  // 🔥 NOTIFICATION STATES
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Record<string, true>>({});
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const openNotifications = Boolean(notificationAnchor);

  const [availabilitySelections, setAvailabilitySelections] = useState<Record<string,'YES'|'NO'>>({});
  const [savingAvailability, setSavingAvailability] = useState<Record<string, boolean>>({});

  // Season action states
  const [savingSeasonAction, setSavingSeasonAction] = useState<Record<string, boolean>>({});

  // ADD THIS (league name cache)
  const [leagueNames, setLeagueNames] = useState<Record<string,string>>({});
  const missingMatchDetailIdsRef = useRef<Record<string, number>>({});

  const isTemporarilyMissingMatch = (matchId: string): boolean => {
    const last404At = missingMatchDetailIdsRef.current[matchId];
    if (!last404At) return false;
    return Date.now() - last404At < 5 * 60 * 1000;
  };

  const markMissingMatch = (matchId: string) => {
    missingMatchDetailIdsRef.current[matchId] = Date.now();
  };

  const clearMissingMatch = (matchId: string) => {
    if (missingMatchDetailIdsRef.current[matchId]) {
      delete missingMatchDetailIdsRef.current[matchId];
    }
  };

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
    const matchIds = Array.from(
      new Set(
        notifs
          .filter(isAvailabilityNotification)
          .map(n => getMatchId(n.meta))
          .filter((v): v is string => !!v)
      )
    );
    if (matchIds.length === 0) return;

    try {
      const results = await Promise.all(
        matchIds.map(async (mid) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${encodeURIComponent(mid)}/availability`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return { mid, available: false };
            const data = await res.json();

            // Support both shapes:
            // 1) { availableUserIds: [] }
            // 2) { availability: [{ user_id|userId, status }] }
            let availableUserIds: string[] = [];
            if (Array.isArray(data.availableUserIds)) {
              availableUserIds = data.availableUserIds.map(String);
            } else if (Array.isArray(data.availability)) {
              const records = data.availability as AvailabilityRecord[];
              availableUserIds = records
                .filter((r) => String(r.status ?? '').toUpperCase() === 'YES')
                .map((r) => String(r.userId ?? r.user_id));
            }

            const isAvailable = availableUserIds.includes(String(user.id));
            return { mid, available: isAvailable };
          } catch {
            return { mid, available: false };
          }
        })
      );

      setAvailabilitySelections(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (r.available) next[r.mid] = 'YES';
          else if (next[r.mid] === 'YES') delete next[r.mid];
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${id}?includeMatches=0`, {
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
      const matchId = getMatchId(meta);
      if (!matchId) continue;
      if (isTemporarilyMissingMatch(String(matchId))) continue;
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          if (!res.ok) {
            console.log('⚠️ Match detail failed', id, res.status);
            if (res.status === 404) {
              markMissingMatch(id);
            }
            return { id, start: undefined, end: undefined };
          }
          clearMissingMatch(id);
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

  // Fetch matchNumber/date/leagueName for notifications missing them (e.g., RESULT_CONFIRMATION_REQUEST)
  async function fetchMissingMatchMeta(notifs: Notification[]) {
    if (!token) return;

    const metaByMatchId: Record<string, MatchMeta> = {};
    const targets: string[] = [];
    for (const n of notifs) {
      const meta = (n.meta ?? {}) as MatchMeta;
      const mid = getMatchId(meta);
      if (!mid) continue;
      if (isTemporarilyMissingMatch(String(mid))) continue;
      metaByMatchId[mid] = meta;

      const cached = matchMetaCache[mid];
      if (!cached?.matchNumber || !cached?.date || !cached?.leagueName) {
        targets.push(mid);
      }
    }

    const unique = Array.from(new Set(targets));
    if (unique.length === 0) return;

    try {
      const results = await Promise.all(unique.map(async (id) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          if (!res.ok) {
            if (res.status === 404) {
              markMissingMatch(id);
            }
            return { id, matchNumber: undefined, date: undefined, leagueName: undefined };
          }
          clearMissingMatch(id);
          const data = await res.json();

          const pick = (...keys: string[]) => {
            for (const k of keys) {
              const v = data[k];
              if (v !== undefined && v !== null && v !== '') return v;
            }
            return undefined;
          };

          const matchNumber =
          pick('matchNumber','match_no','index','matchIndex');
          let dateRaw =
          pick('date','startDate','start_date','startDateTime','start_datetime','start','startTime','start_time','scheduledStart','scheduled_start','kickoff','kickoffTime','kickoff_time');

          let leagueName =
            data.league?.name || data.league?.title || data.leagueName || data.league_name;

          let resolvedMatchNumber = matchNumber != null ? String(matchNumber) : undefined;
          const sourceMeta = metaByMatchId[id] || {};
          const leagueId =
            String(
              sourceMeta.leagueId ||
              sourceMeta.league_id ||
              data.league?.id ||
              ''
            ) || undefined;

          // Fallback: derive match number from actual league matches sequence.
          if ((!resolvedMatchNumber || !dateRaw || !leagueName) && leagueId) {
            try {
              const lRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(leagueId)}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
              });
              if (lRes.ok) {
                const lData = await lRes.json().catch(() => ({}));
                const leagueObj = lData?.league || lData;
                const leagueMatches = Array.isArray(leagueObj?.matches) ? leagueObj.matches : [];
                const visibleMatches = leagueMatches.filter((m: Record<string, unknown>) => !m?.archived);
                const toTs = (m: Record<string, unknown>) => {
                  const candidates = [m.start, m.date, m.createdAt, m.updatedAt];
                  for (const c of candidates) {
                    const t = c ? new Date(String(c)).getTime() : NaN;
                    if (!Number.isNaN(t)) return t;
                  }
                  return 0;
                };
                const sortedAsc = [...visibleMatches].sort((a, b) => toTs(a) - toTs(b));
                const idx = sortedAsc.findIndex((m: Record<string, unknown>) => String(m?.id || '') === String(id));
                if (!resolvedMatchNumber && idx >= 0) resolvedMatchNumber = String(idx + 1);
                const found = idx >= 0 ? sortedAsc[idx] : undefined;
                if (!dateRaw && found) {
                  dateRaw = String(found.start || found.date || '');
                }
                if (!leagueName) {
                  leagueName = String(leagueObj?.name || leagueObj?.leagueName || '');
                }
              }
            } catch {
              // ignore fallback errors; keep whatever we already have
            }
          }

        return {
          id,
          matchNumber: resolvedMatchNumber,
          date: dateRaw ? String(dateRaw) : undefined,
          leagueName: leagueName ? String(leagueName) : undefined
        };
        } catch {
          return { id, matchNumber: undefined, date: undefined, leagueName: undefined };
        }
      }));

      setMatchMetaCache(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (!next[r.id]) next[r.id] = {};
          if (r.matchNumber && !next[r.id].matchNumber) next[r.id].matchNumber = r.matchNumber;
          if (r.date && !next[r.id].date) next[r.id].date = r.date;
          if (r.leagueName && !next[r.id].leagueName) next[r.id].leagueName = r.leagueName;
        });
        return next;
      });
    } catch (e) {
      console.error('fetchMissingMatchMeta error', e);
    }
  }

  // 🔥 UPDATED FETCH NOTIFICATIONS - USE COMPONENT LEVEL TOKEN
  const fetchNotifications = async (showLogs?: boolean) => {
    try {
      // Only set loading on initial fetch or manual refresh, not on background polls
      if (showLogs) {
        setLoading(true);
      }
      
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
        const serverList: Notification[] = data.notifications || [];
        const notificationList = serverList.filter(
          (n) => !isMotmSelectionNotification(n)
        ).filter(
          (n) => !dismissedNotificationIds[String(n.id)]
        );
        setNotifications((prev) => {
          const localOnly = prev.filter((n) => String(n.id).startsWith('local-'));
          const serverIds = new Set(notificationList.map((n) => String(n.id)));
          const keptLocal = localOnly.filter((n) => !serverIds.has(String(n.id)));
          return [...keptLocal, ...notificationList];
        });
        setUnreadCount(notificationList.filter((n) => !n.read).length);

        syncAvailabilityFromServer(notificationList);
        await hydrateLeagueNames(notificationList);
        await fetchMissingMatchTimes(notificationList);
        // ADD: fetch meta (match number + date) for non-match notifications
        await fetchMissingMatchMeta(notificationList);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      // Only reset loading if it was set (i.e., during initial/manual fetch)
      if (showLogs) {
        setLoading(false);
      }
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

  const deleteNotificationById = async (notificationId: string): Promise<boolean> => {
    try {
      if (!token) return false;
      const encodedId = encodeURIComponent(notificationId);
      const urlCandidates = [
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${encodedId}`,
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${encodedId}/delete`
      ];
      const methods: Array<'DELETE' | 'POST'> = ['DELETE', 'POST'];

      for (const url of urlCandidates) {
        for (const method of methods) {
          try {
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.status === 204 || response.ok) return true;
          } catch {
            // try next candidate
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  const dismissActionedNotification = async (notificationId: string) => {
    const id = String(notificationId);
    const wasUnread = notifications.some(n => String(n.id) === id && !n.read);
    setDismissedNotificationIds(prev => ({ ...prev, [id]: true }));
    const deleted = await deleteNotificationById(notificationId);

    if (!deleted) {
      const n = notifications.find(n => String(n.id) === id);
      if (n && !n.read) {
        await markAsRead(notificationId);
      }
    }

    setNotifications(prev => prev.filter(n => String(n.id) !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = async () => {
    const current = [...notifications];
    if (!current.length) return;

    const ids = current.map(n => String(n.id));
    const nextDismissed: Record<string, true> = {};
    ids.forEach(id => { nextDismissed[id] = true; });
    setDismissedNotificationIds(prev => ({ ...prev, ...nextDismissed }));

    // Optimistic clear for UX
    setNotifications([]);
    setUnreadCount(0);
    setIsClearingAll(true);

    try {
      if (!token || !user?.id) return;
      const userId = String(user.id);

      // Try bulk clear endpoints first
      const bulkCandidates: Array<{ method: 'DELETE' | 'POST'; url: string; body?: Record<string, unknown> }> = [
        { method: 'DELETE', url: `${process.env.NEXT_PUBLIC_API_URL}/notifications?userId=${encodeURIComponent(userId)}` },
        { method: 'DELETE', url: `${process.env.NEXT_PUBLIC_API_URL}/notifications/clear-all?userId=${encodeURIComponent(userId)}` },
        { method: 'POST', url: `${process.env.NEXT_PUBLIC_API_URL}/notifications/clear-all`, body: { userId } }
      ];

      for (const req of bulkCandidates) {
        try {
          const res = await fetch(req.url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: req.body ? JSON.stringify(req.body) : undefined
          });
          if (res.ok || res.status === 204) return;
        } catch {
          // continue
        }
      }

      // Fallback: delete one by one
      await Promise.all(ids.map(id => deleteNotificationById(id)));
    } finally {
      setIsClearingAll(false);
    }
  };

  // 🔥 FIXED: Use component level token and user instead of calling useAuth inside function
  const markAllAsRead = async () => {
    try {
      console.log('📖 Marking all notifications as read');

      const userId = user?.id;
      if (!token || !userId) {
        console.log('❌ No token or user ID found for markAllAsRead');
        return;
      }

      const unreadIds = notifications
        .filter((n) => !n.read)
        .map((n) => String(n.id));

      if (unreadIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Backend does not support bulk read-all route (405). Mark each unread notification directly.
      await Promise.all(
        unreadIds.map(async (id) => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${encodeURIComponent(id)}/read`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            if (!response.ok) {
              console.warn('mark notification read failed', id, response.status);
            }
          } catch (err) {
            console.warn('mark notification read error', id, err);
          }
        })
      );

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      console.log('✅ All notifications marked as read');
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
    const mid = sanitizeMatchId(matchId)!;
    debugId('POST set availability mid', mid);
    setAvailabilitySelections(prev => ({ ...prev, [mid]: value }));
    setSavingAvailability(prev => ({ ...prev, [mid]: true }));
    const action = value === 'YES' ? 'available' : 'unavailable';

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${encodeURIComponent(mid)}/availability?action=${action}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        console.error('Availability update failed', res.status);
      } else {
        await dismissActionedNotification(notificationId);
        toast.success(value === 'YES' ? '👍 Availability confirmed' : 'Marked unavailable');
        try { window.dispatchEvent(new Event('refresh-notifications')); } catch {}
      }
    } catch (e) {
      console.error('Error setting availability', e);
    } finally {
      setSavingAvailability(prev => ({ ...prev, [mid]: false }));
    }
  };

  // ---- 1) ADD STATE (near other useState declarations) ----
const [matchTimes, setMatchTimes] = useState<Record<string,{start?:string; end?:string}>>({});
const [resultSelections, setResultSelections] = useState<Record<string, 'YES'|'NO'>>({});
const [savingResult, setSavingResult] = useState<Record<string, boolean>>({});
// ADD: rejection panel + suggestions state
const [resultRejectPending, setResultRejectPending] = useState<Record<string, boolean>>({});
const [resultSuggestion, setResultSuggestion] = useState<Record<string, { home: string; away: string }>>({});

// ADD: cache for non-match meta (match number + date + league name)
const [matchMetaCache, setMatchMetaCache] = useState<Record<string, {
  matchNumber?: string;
  date?: string;         // ISO or raw
  leagueName?: string;
}>>({});

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

  // Handle season join/decline actions
  const handleSeasonAction = async (notificationId: string, action: 'join' | 'decline') => {
    if (!token) return;

    setSavingSeasonAction(prev => ({ ...prev, [notificationId]: true }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/season-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Season action ${action} successful:`, data.message);

        // Actioned notification should disappear immediately.
        await dismissActionedNotification(notificationId);
        
        // Show success message
        alert(data.message);
        
        // If user joined the season, reload page to show new season data
        if (action === 'join') {
          // Clear ALL cached data to force fresh fetch
          try {
            // Clear leagueAPI cache
            leagueAPI.invalidateCache();
            
            // Clear all league-related cache
            localStorage.removeItem('leaguesCache');
            localStorage.removeItem('lastLeaguesFetch');
            
            // Clear sessionStorage too
            sessionStorage.clear();
            
            // Clear any api cache
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (
                key &&
                key !== 'preferredLeagueId' &&
                key !== 'prefferdLeagueId' &&
                (key.includes('cache') || key.includes('Cache') || key.includes('league') || key.includes('League'))
              ) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            console.log('🧹 Cleared all caches for season refresh');
          } catch (e) {
            console.error('Error clearing cache:', e);
          }
          
          // Force hard reload to bypass browser cache
          setTimeout(() => {
            window.location.href = window.location.href.split('?')[0] + '?refresh=' + Date.now();
          }, 300);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Season action failed:', errorData);
        alert(errorData.message || 'Failed to process season action');
      }
    } catch (error) {
      console.error('❌ Error handling season action:', error);
      alert('Failed to process season action');
    } finally {
      setSavingSeasonAction(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  useEffect(() => {
    setMounted(true);
    dispatch(initializeFromStorage());
  }, [dispatch]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dismissedNotificationIds');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, true>;
      if (parsed && typeof parsed === 'object') setDismissedNotificationIds(parsed);
    } catch {
      // ignore invalid local storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dismissedNotificationIds', JSON.stringify(dismissedNotificationIds));
    } catch {
      // ignore storage failures
    }
  }, [dismissedNotificationIds]);

  // 🔥 FETCH NOTIFICATIONS ON MOUNT AND POLL
  useEffect(() => {
    if (isAuthenticated && token && user?.id) { // 🔥 ADDED TOKEN AND USER CHECK
      console.log('✅ User authenticated with token, starting notification system...');
      fetchNotifications(true);
      
      // Poll every 60 seconds (reduced from 30s to minimize loading issues)
      const interval = setInterval(() => {
        // Only fetch if notification panel is NOT open to prevent disruption
        if (!openNotifications) {
          fetchNotifications();
        }
      }, 60000); // Changed from 30000ms to 60000ms (1 minute)
      
      // 🆕 Listen for custom refresh events (e.g., after voting)
      const handleRefreshEvent = (evt: Event) => {
        console.log('🔔 Received notification refresh event');
        const customEvt = evt as CustomEvent<{ localNotification?: Notification }>;
        const localN = customEvt?.detail?.localNotification;
        if (localN && localN.id && !isMotmSelectionNotification(localN)) {
          setNotifications(prev => {
            if (prev.some(n => String(n.id) === String(localN.id))) return prev;
            return [localN, ...prev];
          });
          setUnreadCount(prev => prev + (localN.read ? 0 : 1));
        }
        fetchNotifications(true);
      };
      window.addEventListener('refresh-notifications', handleRefreshEvent);
      
      return () => {
        console.log('🛑 Clearing notification interval...'); 
        clearInterval(interval);
        window.removeEventListener('refresh-notifications', handleRefreshEvent);
      };
    } else {
      console.log('❌ User not authenticated or missing token/user, skipping notifications');
      // Clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, user?.id, openNotifications]); // Added openNotifications to dependency

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-signout-start'));
      }
      await dispatch(logout());
      // Clear notifications on logout
      setNotifications([]);
      setUnreadCount(0);
      if (typeof window !== 'undefined') {
        window.location.replace('/');
        return;
      }
      router.replace('/');
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
  const handleSignOutClick = () => {
    handleProfileMenuClose();
    handleSignOut();
  };

  // Notify league admin when user rejects result confirmation
  const getLeagueAdminUserId = async (leagueId: string): Promise<string | undefined> => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}?includeMatches=0`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      const adminId =
        data.adminId || data.admin_id ||
        data.ownerId || data.owner_id ||
        data.createdBy || data.created_by ||
        data.createdByUserId || data.created_by_user_id ||
        (Array.isArray(data.roles)
          ? (() => {
            const roles = data.roles as LeagueRole[];
            const admin = roles.find(r =>
              String(r.role ?? r.name ?? '').toUpperCase().includes('ADMIN')
            );
            return admin?.userId ?? admin?.user_id ?? admin?.user?.id;
          })()
          : undefined);
      return adminId ? String(adminId) : undefined;
    } catch {
      return;
    }
  };

  // Typed helpers for match/team/player shapes used by getUsersTeamName
type IdValue = string | number;
type PlayerLike = IdValue | { id?: IdValue; userId?: IdValue; user_id?: IdValue };
interface TeamLike {
  name?: string;
  teamName?: string;
  title?: string;
  players?: PlayerLike[];
  roster?: PlayerLike[];
  // NEW: captain variants
  captainId?: IdValue;
  captain_id?: IdValue;
  captain?: { id?: IdValue };
}
interface MatchLike {
  homeTeamName?: string;
  home_team_name?: string;
  home?: TeamLike;

  awayTeamName?: string;
  away_team_name?: string;
  away?: TeamLike;

  homeTeamPlayers?: PlayerLike[];
  home_players?: PlayerLike[];

  awayTeamPlayers?: PlayerLike[];
  away_players?: PlayerLike[];

  teams?: TeamLike[];

  // NEW: captain id variants on root
  home_captain_id?: IdValue;
  away_captain_id?: IdValue;

  // NEW: roles array (reuse LeagueRole)
  roles?: LeagueRole[];
}

const getUsersTeamName = (match: MatchLike, userId: string): string | undefined => {
  const u = String(userId);

  const sameId = (p: PlayerLike): boolean => {
    if (p == null) return false;
    if (typeof p === 'string' || typeof p === 'number') return String(p) === u;
    const pid = p.id ?? p.userId ?? p.user_id;
    return pid != null && String(pid) === u;
  };

  const inArr = (arr: unknown): boolean =>
    Array.isArray(arr) && (arr as PlayerLike[]).some(sameId);

  const homeName = match.homeTeamName || match.home_team_name || match.home?.name || 'Home';
  const awayName = match.awayTeamName || match.away_team_name || match.away?.name || 'Away';

  if (inArr(match.homeTeamPlayers) || inArr(match.home_players) || inArr(match.home?.players) || inArr(match.home?.roster)) {
    return homeName;
  }
  if (inArr(match.awayTeamPlayers) || inArr(match.away_players) || inArr(match.away?.players) || inArr(match.away?.roster)) {
    return awayName;
  }

  if (Array.isArray(match.teams)) {
    for (const t of match.teams) {
      const tName = t?.name || t?.teamName || t?.title;
      if (inArr(t?.players) || inArr(t?.roster)) return tName || 'Team';
    }
  }
  return undefined;
};

  // NEW: detect if current user is a team captain in this match
  const isUserTeamCaptain = (match: MatchLike, userId: string): boolean => {
    const u = String(userId);
    const eq = (a: unknown) => a != null && String(a) === u;
    // common fields
    if (eq(match.home?.captainId) || eq(match.home_captain_id) || eq(match.home?.captain?.id)) return true;
    if (eq(match.away?.captainId) || eq(match.away_captain_id) || eq(match.away?.captain?.id)) return true;
    // teams array
    if (Array.isArray(match.teams)) {
      for (const t of match.teams) {
        if (eq(t?.captainId) || eq(t?.captain_id) || eq(t?.captain?.id)) return true;
      }
    }
    // roles fallback
    if (Array.isArray(match.roles)) {
      const isCap = match.roles.some((r: LeagueRole) =>
        String(r.role ?? r.name ?? '').toUpperCase().includes('CAPTAIN') &&
        (eq(r.userId) || eq(r.user_id) || eq(r.user?.id))
      );
      if (isCap) return true;
    }

    return false;
  };

  // NEW: robust poster that tries multiple endpoints/body shapes
  const postAdminNotification = async (
    adminUserId: string,
    payloadBase: NotificationPayloadBase
  ): Promise<boolean> => {
    const endpoints: string[] = [
      `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
      `${process.env.NEXT_PUBLIC_API_URL}/users/${adminUserId}/notifications`,
      `${process.env.NEXT_PUBLIC_API_URL}/notifications/create`
    ];
    const bodies: NotificationCreateBody[] = [
      { userId: adminUserId, ...payloadBase },
      { user_id: adminUserId, ...payloadBase },
      { receiverId: adminUserId, ...payloadBase },
      { receiver_id: adminUserId, ...payloadBase },
      { recipientId: adminUserId, ...payloadBase },
      { recipient_id: adminUserId, ...payloadBase },
      { toUserId: adminUserId, ...payloadBase },
      { to_user_id: adminUserId, ...payloadBase },
      { userIds: [adminUserId], ...payloadBase }
    ];
    for (const url of endpoints) {
      for (const body of bodies) {
        try {
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
          });
          if (resp.ok) return true;
          console.warn('notify admin failed', resp.status, url);
        } catch (e) {
          console.warn('notify admin error', url, e);
        }
      }
    }
    return false;
  };


    // Helper: safely get a user's display name without using `any`
  const getUserDisplayName = (u: unknown): string => {
    if (u && typeof u === 'object') {
      const r = u as Record<string, unknown>;
      const v = r.fullName ?? r.name ?? r.username ?? r.email;
      if (typeof v === 'string' && v.trim()) return v;
    }
    return 'A player';
  };


  const notifyAdminOnResultRejected = async (
    matchId: string,
    notifMeta?: NotificationMeta,
    suggestedHomeGoals?: number,
    suggestedAwayGoals?: number
  ): Promise<boolean> => {
    if (!token || !user?.id) return false;
    const mid = sanitizeMatchId(matchId)!;
    debugId('POST notify admin mid', mid);

    let leagueId: string | undefined;
    let leagueName: string | undefined;
    let matchLabel: string | undefined;
    let usersTeam: string | undefined;
    let actorIsCaptain = false;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${encodeURIComponent(mid)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const match = await res.json();
        leagueId = String(match.leagueId ?? match.league_id ?? match.league?.id ?? '') || undefined;
        leagueName =
          (leagueId ? leagueNames[leagueId] : undefined) ||
          match.league?.name || match.league?.title ||
          match.leagueName || match.league_name;

        const matchNo = match.matchNumber ?? match.match_no ?? match.index ?? match.matchIndex;
        const home = match.homeTeamName || match.home_team_name || match.home?.name;
        const away = match.awayTeamName || match.away_team_name || match.away?.name;
        matchLabel = matchNo ? `Match ${matchNo}` : (home && away ? `${home} vs ${away}` : `Match ${matchId}`);

        usersTeam = getUsersTeamName(match, String(user.id));
        actorIsCaptain = isUserTeamCaptain(match, String(user.id));
      }
    } catch {}

    if ((!leagueId || !leagueName || !usersTeam) && notifMeta) {
      const lid = pickFirst(notifMeta, ['leagueId','league_id']);
      if (!leagueId && lid) leagueId = String(lid);

      leagueName = leagueName || extractLeagueName(notifMeta as MatchMeta, leagueName);

      const team = pickFirst(notifMeta, ['teamName','team_name','myTeam','team']);
      usersTeam = usersTeam || (team ? String(team) : undefined);
    }

    const adminUserId = leagueId ? await getLeagueAdminUserId(leagueId) : undefined;
    if (!adminUserId) { console.warn('No league admin to notify'); return false; }

    const actorName = getUserDisplayName(user);
    const role = actorIsCaptain ? 'Captain' : 'Player';
    const title = `${role} rejected result confirmation`;
    const body = [
      `${role} ${actorName} selected "No" on result confirmation.`,
      leagueName ? `League: ${leagueName}` : null,
      matchLabel ? `Match: ${matchLabel}` : `Match ID: ${mid}`,
      usersTeam ? `Team: ${usersTeam}` : null,
      (Number.isFinite(suggestedHomeGoals) && Number.isFinite(suggestedAwayGoals))
        ? `Suggested score: ${suggestedHomeGoals}-${suggestedAwayGoals}`
        : null
    ].filter(Boolean).join(' | ');

    const meta = {
      kind: 'RESULT_CONFIRMATION_REJECTED',
      leagueId,
      leagueName,
      matchId: mid,
      matchLabel,
      teamName: usersTeam,
      rejectedByUserId: String(user.id),
      actorRole: role,
      suggestedHomeGoals,
      suggestedAwayGoals
    };

    const sent = await postAdminNotification(adminUserId, {
      type: 'RESULT_CONFIRMATION_REJECTED',
      title,
      body,
      meta
    });
    return sent;
  };

  // NEW: open reject panel and prefill with current score if available
  const openRejectPanel = async (matchId: string) => {
    const mid = sanitizeMatchId(matchId) || matchId;
    // Use both mid (for API) and matchId (for state, matching JSX keys)
    setResultRejectPending(prev => ({ ...prev, [matchId]: true }));
    // Prefill by fetching match once (best-effort)
    try {
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${encodeURIComponent(mid)}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      let home = '', away = '';
      if (res.ok) {
        const data = await res.json();
        const h = data.homeTeamGoals ?? data.home_goals ?? data.home?.goals;
        const a = data.awayTeamGoals ?? data.away_goals ?? data.away?.goals;
        if (Number.isFinite(h)) home = String(h);
        if (Number.isFinite(a)) away = String(a);
      }
      setResultSuggestion(prev => ({ ...prev, [matchId]: { home, away } }));
    } catch {
      // ignore
    }
  };

  const cancelReject = (matchId: string) => {
    setResultRejectPending(prev => ({ ...prev, [matchId]: false }));
    setResultSuggestion(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    setResultSelections(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  };

  const isConfirmationAlreadyProcessed = (status: number, responseText: string): boolean => {
    if (![400, 409, 422].includes(status)) return false;
    const text = (responseText || '').toLowerCase();
    return (
      text.includes('already confirmed') ||
      text.includes('already processed') ||
      text.includes('already submitted') ||
      text.includes('already responded') ||
      text.includes('already decided')
    );
  };

  const buildConfirmPayload = (
    decision: 'YES' | 'NO',
    suggestedHomeGoals?: number,
    suggestedAwayGoals?: number
  ): Record<string, unknown> => {
    const isYes = decision === 'YES';
    const payload: Record<string, unknown> = {
      decision,
      action: decision,
      status: decision,
      confirmationDecision: decision,
      captainDecision: decision,
      confirm: isYes,
      confirmed: isYes,
      isConfirmed: isYes
    };

    if (!isYes && Number.isFinite(suggestedHomeGoals) && Number.isFinite(suggestedAwayGoals)) {
      payload.suggestedHomeGoals = suggestedHomeGoals;
      payload.suggestedAwayGoals = suggestedAwayGoals;
      payload.suggested_home_goals = suggestedHomeGoals;
      payload.suggested_away_goals = suggestedAwayGoals;
      payload.homeTeamGoals = suggestedHomeGoals;
      payload.awayTeamGoals = suggestedAwayGoals;
      payload.home_goals = suggestedHomeGoals;
      payload.away_goals = suggestedAwayGoals;
    }

    return payload;
  };

  const submitResultDecision = async (
    mid: string,
    decision: 'YES' | 'NO',
    suggestedHomeGoals?: number,
    suggestedAwayGoals?: number
  ): Promise<{ ok: boolean; lastError: string }> => {
    const payload = buildConfirmPayload(decision, suggestedHomeGoals, suggestedAwayGoals);
    const encodedMid = encodeURIComponent(mid);
    const urlCandidates = [
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${encodedMid}/confirm`,
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${encodedMid}/result/confirm`,
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${encodedMid}/confirm?decision=${decision}`,
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${encodedMid}/result/confirm?decision=${decision}`
    ];
    const methods: Array<'POST' | 'PATCH'> = ['POST', 'PATCH'];

    let lastError = '';

    for (const url of urlCandidates) {
      for (const method of methods) {
        try {
          const res = await fetch(url, {
            method,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const responseText = await res.text();
          if (res.ok || isConfirmationAlreadyProcessed(res.status, responseText)) {
            return { ok: true, lastError: '' };
          }

          lastError = `${method} ${url} -> ${res.status}: ${responseText}`;
          console.warn('Result confirmation attempt failed:', lastError);
        } catch (err) {
          lastError = `${method} ${url} -> ${String(err)}`;
          console.warn('Result confirmation attempt error:', err);
        }
      }
    }

    return { ok: false, lastError };
  };

  // NEW: submit suggested scores with decision NO
  const submitResultSuggestion = async (matchId: string, notificationId: string) => {
    if (!token) return;
    const mid = sanitizeMatchId(matchId) || matchId;
    const s = resultSuggestion[matchId] || { home: '', away: '' };
    const h = parseInt(String(s.home), 10);
    const a = parseInt(String(s.away), 10);
    if (!Number.isFinite(h) || h < 0 || !Number.isFinite(a) || a < 0) {
      alert('Please enter valid scores (non-negative numbers).');
      return;
    }

    setSavingResult(prev => ({ ...prev, [matchId]: true }));
    const { ok } = await submitResultDecision(mid, 'NO', h, a);

    let adminNotified = false;
    try {
      const notif = notifications.find(n => String(n.id) === String(notificationId));
      adminNotified = await notifyAdminOnResultRejected(mid, notif?.meta, h, a);
    } catch (notifyError) {
      console.warn('Failed to notify admin about rejected result', notifyError);
    }

    if (ok || adminNotified) {
      await dismissActionedNotification(notificationId);
      // Re-sync from server so dismissed notifications do not reappear.
      void fetchNotifications();
      if (!ok && adminNotified) {
        toast.success('Suggestion sent to admin.');
      }
    } else {
      console.error('Failed to submit suggested scores');
      alert('Failed to send scores to admin. Please try again.');
    }

    setSavingResult(prev => ({ ...prev, [matchId]: false }));
    cancelReject(matchId);
  };

  // Keep YES flow immediate
  const handleConfirmResult = async (
    matchId: string,
    value: 'YES'|'NO',
    notificationId: string
  ) => {
    if (value === 'NO') {
      setResultSelections(prev => ({ ...prev, [matchId]: 'NO' }));
      openRejectPanel(matchId);
      return;
    }

    if (!token) {
      console.warn('handleConfirmResult: no token');
      return;
    }
    const mid = sanitizeMatchId(matchId) || matchId;
    debugId('POST confirm mid', mid);

    // Use matchId (the key used in JSX) for all state updates so UI stays in sync
    setResultSelections(prev => ({ ...prev, [matchId]: value }));
    setSavingResult(prev => ({ ...prev, [matchId]: true }));

    const { ok, lastError } = await submitResultDecision(mid, 'YES');

    if (ok) {
      await dismissActionedNotification(notificationId);
      // Re-sync from server so confirmed notifications stay gone.
      void fetchNotifications();
    } else {
      console.error('Result confirmation update failed:', lastError);
      // Reset selection so user can retry
      setResultSelections(prev => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      alert('Failed to confirm result. Please try again.');
    }
    setSavingResult(prev => ({ ...prev, [matchId]: false }));
  };

  // Safe debug helper (used in availability/result flows)
  function debugId(label: string, id?: string) {
    if (!id) return;
    try {
      const codes = Array.from(id).map(c => c.charCodeAt(0));
      console.debug(`🔎 ${label}:`, id, '| len=', id.length, '| codes=', codes.join(','));
    } catch {
      console.debug(`🔎 ${label}:`, id);
    }
  }

  const navItems: { label: string; href: string }[] = [
    { label: 'LEAGUES', href: '/all-leagues' },
    { label: 'TABLE', href: '/dream-team' },
    { label: 'MATCHES', href: '/all-matches' },
    { label: 'VIEW STATS', href: '/profile' },
    { label: 'TROPHY ROOM', href: '/trophy-room' },
    { label: 'REWARDS', href: '/rewards' },
    { label: 'PLAYERS', href: '/all-players' },
  ];

  type MobileBottomItem = {
    key: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    resolveHrefLabel?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    isActive?: () => boolean;
  };

  const mobileBottomItems: MobileBottomItem[] = [
    {
      key: 'leagues',
      label: 'Leagues',
      icon: <GroupsOutlinedIcon sx={{ fontSize: 20 }} />,
      href: '/all-leagues',
      isActive: () => isNavActive('LEAGUES', '/all-leagues'),
    },
    {
      key: 'table',
      label: 'Table',
      icon: <TableChartOutlinedIcon sx={{ fontSize: 20 }} />,
      href: '/dream-team',
      resolveHrefLabel: 'TABLE',
      isActive: () => isNavActive('TABLE', '/dream-team'),
    },
    {
      key: 'matches',
      label: 'Matches',
      icon: <SportsSoccerOutlinedIcon sx={{ fontSize: 20 }} />,
      href: '/all-matches',
      isActive: () => isNavActive('MATCHES', '/all-matches'),
    },
    {
      key: 'stats',
      label: 'Stats',
      icon: <QueryStatsOutlinedIcon sx={{ fontSize: 20 }} />,
      href: '/profile',
      resolveHrefLabel: 'VIEW STATS',
      // Mobile has a separate "Profile" tab, so keep Stats active only on player stats routes.
      isActive: () => pathname?.startsWith('/player/') ?? false,
    },
    {
      key: 'trophy',
      label: 'Trophy',
      icon: <WorkspacePremiumOutlinedIcon sx={{ fontSize: 20 }} />,
      href: '/trophy-room',
      isActive: () => isNavActive('TROPHY ROOM', '/trophy-room'),
    },
    {
      key: 'rewards',
      label: 'Rewards',
      icon: <CardGiftcardOutlinedIcon sx={{ fontSize: 20 }} />,
      href: '/rewards',
      isActive: () => isNavActive('REWARDS', '/rewards'),
    },
    {
      key: 'notifications',
      label: 'Alerts',
      icon: (
        <Badge 
          badgeContent={unreadCount} 
          color="error" 
          max={99}
        >
          <NotificationsIcon sx={{ fontSize: 20 }} />
        </Badge>
      ),
      onClick: (e) => {
        handleNotificationClick(e);
      },
      isActive: () => Boolean(notificationAnchor),
    },
  ];

  function getNavHref(label: string, fallbackHref: string): string {
    if (label === 'TABLE') {
      const currentLeagueMatch = pathname?.match(/^\/league\/([^/?#]+)/);
      const currentLeagueId = currentLeagueMatch?.[1] ? decodeURIComponent(currentLeagueMatch[1]) : '';
      if (currentLeagueId) {
        return `/league/${encodeURIComponent(currentLeagueId)}?tab=table`;
      }
      if (typeof window === 'undefined') return fallbackHref;
      const preferredLeagueId =
        localStorage.getItem('preferredLeagueId') ||
        localStorage.getItem('prefferdLeagueId');
      const leagueId = preferredLeagueId?.trim();
      if (!leagueId) return '/all-leagues';
      return `/league/${encodeURIComponent(leagueId)}?tab=table`;
    }

    if (label === 'VIEW STATS') {
      const currentUserId = user?.id ? String(user.id).trim() : '';
      if (currentUserId) return `/player/${encodeURIComponent(currentUserId)}`;
      return '/profile';
    }

    return fallbackHref;
  }

  function isNavActive(label: string, href: string): boolean {
    if (!pathname) return false;
    if (label === 'TABLE') return pathname.startsWith('/league/');
    // Keep desktop/mobile Profile selection independent from View Stats.
    if (label === 'VIEW STATS') return pathname.startsWith('/player/');
    return pathname.startsWith(href);
  }

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsSubmitting, setStatsSubmitting] = useState(false);
  const [myStats, setMyStats] = useState({ goals: 0, assists: 0, cleanSheets: 0, penalties: 0, freeKicks: 0, defence: 0, impact: 0 });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [statsSourceNotificationId, setStatsSourceNotificationId] = useState<string | null>(null);

  const handleStatChange = (stat: 'goals' | 'assists' | 'cleanSheets' | 'penalties' | 'freeKicks' | 'defence' | 'impact', increment: number, max: number) => {
    setMyStats(prev => {
      const next = Math.max(0, Math.min(max, prev[stat] + increment));
      return { ...prev, [stat]: next } as typeof prev;
    });
  };

  const handleStatsSave = async () => {
    // In this Navbar-driven popup we only demonstrate open/close. Persisting is handled inside the page dialog normally.
    setStatsSubmitting(true);
    try {
      // no-op save simulation
      await new Promise(r => setTimeout(r, 300));
      if (statsSourceNotificationId) {
        await dismissActionedNotification(statsSourceNotificationId);
      }
      setStatsOpen(false);
      setStatsSourceNotificationId(null);
    } finally {
      setStatsSubmitting(false);
    }
  };

  const renderNavLinks = () => (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: { xs: 0.5, lg: 1.1 },
      flexWrap: 'nowrap',
      overflow: 'hidden',
      justifyContent: 'flex-end',
      minWidth: 0,
      maxWidth: '100%',
      flex: 1,
      mt: 0,     // ✅ push links to the right inside this box
    }}>
      {navItems.map(({ label, href }) => {
        const active = isNavActive(label, href);
        const targetHref = getNavHref(label, href);
        return (
          <Button
            key={href}
            component={Link}
            href={targetHref}
            aria-current={active ? 'page' : undefined}
            disableRipple
            sx={{
              textTransform: 'none',
              fontFamily: 'var(--font-woodford-bourne-pro)',
              fontWeight: 700,
              color: '#fff',
              fontSize: { xs: '12px', sm: '9px', md: '10px', lg: '12px' },
              px: { xs: 0.5, sm: 0.50, md: 1, lg: 1 },
              py: { xs: 1, md: 1.25 },
              // minWidth: 'auto',
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
                width: '100%',
                height: '2px',
                bottom: 0,
                left: 0,
                borderRadius: '2px 2px 0 0',
                transform: active ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 0.3s ease',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0))'
              }
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
      // <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 2 }}>
       <AppBar position="sticky" sx={{ backgroundColor: 'white', boxShadow: 2, top: 0, zIndex: (theme) => theme.zIndex.drawer + 2 }}>
        <Toolbar>
          <Box sx={{ height: 40, width: 120, bgcolor: '#e0e0e0', borderRadius: 1 }} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: '#0e0e0e',
          boxShadow: 3,
          // px: { xs: 1, sm: 2, md: 2 }
          //  px: { xs: 1, sm: 2, md: 2 },
          top: 0,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          borderBottom: '3px solid #E56A16'
        }}
      >
        <Toolbar sx={{
          justifyContent: 'space-between',
          width: '100%',
          minWidth: 0,
          minHeight: { xs: '60px', md: '70px' },
          gap: { xs: 1, md: 2.4 },
          overflowX: 'hidden',
          position: 'relative',
        }}>
          {/* LOGO SECTION */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              position: { xs: 'absolute', lg: 'static' },
              left: { xs: '50%', lg: 'auto' },
              top: { xs: '50%', lg: 'auto' },
              transform: { xs: 'translate(-50%, -50%)', lg: 'none' },
              zIndex: 1,
            }}
          >
            <Link href="/home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{ 
                width: { xs: 260, sm: 260, md: 340, lg: 400 },
                height: { xs: 34, sm: 48, md: 75 },
                display: 'flex',
                alignItems: 'center',
                mt: { xs: 0, md: -2 },
              }}>
                <Image
                  src={cflogo}
                  alt="Champion Footballer Logo"
                  width={430}
                  height={64}
                  priority
                  sizes="(max-width:600px) 200px, (max-width:900px) 240px, (max-width:1200px) 340px, 400px"
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </Link>
          </Box>

          {/* DESKTOP NAVIGATION (moved to right) */}
          <Box sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
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
            // gap: { xs: 0.5, md: 1 },
            flexShrink: 0,
            ml: { xs: 'auto', md: 0 },
          }}>
            {isAuthenticated && (
              <>
                {/* NOTIFICATION BELL - DESKTOP */}
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{
                    color: '#fff',
                    display: { xs: 'none', lg: 'flex' },
                    mr: { lg: 2.5 },
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
                      // '& .MuiBadge-badge': {
                      //   // animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
  
                      // }
                    }}
                  >
                    <NotificationsIcon sx={{height:'25px'}} />
                  </Badge>
                </IconButton>

                {/* PROFILE BUTTON - DESKTOP */}
                <Button
                  onClick={handleProfileMenuOpen}
                  startIcon={<Image src={player} alt="profile" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />}
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    textTransform: 'none',
                    fontFamily: 'var(--font-woodford-bourne-pro)',
                    fontWeight: 'semibold',
                    color: '#fff',
                    bgcolor: '#00a77f',
                    borderRadius: 1,
                    px: 2,
                    fontSize: '16px',
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '& .MuiButton-startIcon': { marginRight: 1 },
                    '&:hover': {
                      bgcolor: '#00a77f',
                      color: '#fff',
                      boxShadow: '0 6px 24px 0 rgba(67,160,71,0.28)',
                      transform: 'translateY(-2px) scale(1.04)',
                    },
                    py: 0.3,
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
                  {/* MOBILE MENU BUTTON */}
                  <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    onClick={() => setDrawerOpen(true)}
                    sx={{ 
                      color: '#fff',
                      mt: { xs: '5px', lg: 0 },
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
                      width: { xs: '88vw', sm: 'auto' },
                      maxWidth: { xs: '88vw', sm: 'none' },
                      bgcolor: 'rgba(15,15,15,0.92)',
                      color: '#E5E7EB',
                      borderRadius: 2.5,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                      overflow: 'hidden',
                    },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      router.push('/profile');
                    }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.1,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonOutlineOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />
                      <Box>Profile</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      setHowToPlayOpen(true);
                    }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.1,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />
                      <Box>How to Play</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      setGameRulesOpen(true);
                    }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.1,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GavelOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />
                      <Box>Game Rules</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      setXpStatusOpen(true);
                    }}
                    sx={{
                      color: '#E5E7EB',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      mx: 0.5,
                      my: 0.25,
                      py: 1.1,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BarChartOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />
                      <Box>XP Status</Box>
                    </Box>
                  </MenuItem>
                  <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
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
      <Toolbar sx={{ minHeight: { xs: '60px', md: '70px' } }} />

      {isAuthenticated && (
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1,
            background: 'linear-gradient(180deg, rgba(12,12,14,0.98) 0%, rgba(20,20,24,0.98) 100%)',
            borderTop: '1px solid rgba(249,115,22,0.55)',
            boxShadow: '0 -10px 24px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            pb: 'max(env(safe-area-inset-bottom), 4px)',
          }}
        >
        <Box
          sx={{
            display: 'grid',
            alignItems: 'center',
            gridTemplateColumns: `repeat(${mobileBottomItems.length}, minmax(0, 1fr))`,
            width: '100%',
            overflowX: 'hidden',
            px: 0.6,
            pr: 'max(env(safe-area-inset-right), 8px)',
            py: 0.4,
            gap: 0.4,
          }}
        >
          {mobileBottomItems.map((item) => {
            const active = item.isActive?.() ?? false;

            const buttonSx = {
              minWidth: 0,
              width: '100%',
              px: 0.2,
              py: 0.55,
              borderRadius: 1.5,
              textTransform: 'none',
              color: active ? '#10D3A8' : '#E5E7EB',
              bgcolor: active ? 'rgba(16,185,129,0.22)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.15,
              lineHeight: 1,
              '&:hover': {
                bgcolor: active ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.10)',
              },
            } as const;

              if (item.href) {
                const targetHref = item.resolveHrefLabel
                  ? getNavHref(item.resolveHrefLabel, item.href)
                  : item.href;
                return (
                  <Button
                    key={item.key}
                    component={Link}
                    href={targetHref}
                    disableRipple
                    sx={buttonSx}
                  >
                    {item.icon}
                    <Box sx={{ fontSize: '9.5px', fontWeight: 700 }}>{item.label}</Box>
                  </Button>
                );
              }

              return (
                <Button
                  key={item.key}
                  onClick={item.onClick}
                  disableRipple
                  sx={buttonSx}
                >
                  {item.icon}
                  <Box sx={{ fontSize: '9.5px', fontWeight: 700 }}>{item.label}</Box>
                </Button>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Local popup driven by useState. It hosts a simplified stats dialog UI. */}
      <PlayMatchPagee
        open={statsOpen}
        onClose={() => {
          setStatsOpen(false);
          setSelectedMatchId(null);
          setSelectedLeagueId(null);
          setStatsSourceNotificationId(null);
        }}
        onSave={handleStatsSave}
        isSubmitting={statsSubmitting}
        stats={myStats}
        handleStatChange={handleStatChange}
        teamGoals={10}
        initialMatchId={selectedMatchId || undefined}
        initialLeagueId={selectedLeagueId || undefined}
      />

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
            width: { xs: 'calc(100vw - 16px)', sm: 380 },
            maxWidth: 380,
            maxHeight: 400,
            bgcolor: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          }
        }}
      >
        <Box
          sx={{
            p: { xs: 1.25, sm: 1.5 },
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: { xs: 0.75, sm: 1 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#333',
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap'
                }}
              >
                Notifications
              </Typography>
              {notifications.length > 0 && (
                <Box
                  sx={{
                    minWidth: 24,
                    height: 24,
                    px: 0.75,
                    borderRadius: '999px',
                    bgcolor: '#eaf1ff',
                    color: '#1559c0',
                    border: '1px solid #cfe0ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '0.82rem', sm: '0.88rem' },
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {notifications.length}
                </Box>
              )}
            </Box>
            <IconButton
              onClick={handleNotificationClose}
              size="small"
              sx={{ color: '#666', p: { xs: 0.45, sm: 0.8 }, flexShrink: 0 }}
            >
              <CloseIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flexWrap: 'wrap',
              p: 0.5,
              borderRadius: 1.5,
              bgcolor: '#f7f9fc',
              border: '1px solid #edf1f7'
            }}
          >
            <Button
              onClick={handleRefreshNotifications}
              disabled={isRefreshing}
              size="small"
              startIcon={
                <RefreshIcon
                  sx={{
                    fontSize: 16,
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '50%': { transform: 'rotate(360deg)' },
                      '100%': { transform: 'rotate(0deg)' }
                    }
                  }}
                />
              }
              sx={{
                color: '#1976d2',
                bgcolor: '#f5f9ff',
                border: '1px solid #cfe0ff',
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '11px', sm: '12px' },
                minHeight: 30,
                px: 1.25,
                py: 0.35,
                '&:hover': { bgcolor: '#eaf2ff' },
                '&:disabled': { color: '#9bb7e6', borderColor: '#dbe8ff' }
              }}
              title="Refresh notifications"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
             
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                size="small"
                startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 15 }} />}
                sx={{
                  color: '#1976d2',
                  bgcolor: '#fff',
                  border: '1px solid #d9e6fb',
                  borderRadius: 999,
                  fontSize: { xs: '11px', sm: '12px' },
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  minHeight: 30,
                  px: 1.25,
                  py: 0.35,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#edf4ff' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Mark read
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Mark all read
                </Box>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={clearAllNotifications}
                size="small"
                disabled={isClearingAll}
                startIcon={!isClearingAll ? <HighlightOffIcon sx={{ fontSize: 15 }} /> : undefined}
                sx={{
                  color: '#d32f2f',
                  bgcolor: '#fff',
                  border: '1px solid #f0c4c4',
                  borderRadius: 999,
                  fontSize: { xs: '11px', sm: '12px' },
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  minHeight: 30,
                  px: 1.25,
                  py: 0.35,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#fff2f2' },
                  '&:disabled': { color: '#c8a3a3', borderColor: '#f4dada' }
                }}
              >
                {isClearingAll ? 'Clearing...' : (
                  <Box component="span">
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Clear</Box>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Clear all</Box>
                  </Box>
                )}
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <NotificationMenuLoadingSkeleton />
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#666' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography className="empty-state-message">No notifications yet</Typography>
              <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                Create a match to test notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => {
              const meta: MatchMeta = (notification.meta ?? {}) as MatchMeta;
              const leagueKeyForIndex =
                meta.leagueId ||
                meta.league_id ||
                meta.leagueName ||
                meta.league_name ||
                'default';
              const matchMetaId = getMatchId(meta) || '';
              const derivedMatchNo = matchMetaId
                ? Number(matchMetaCache[matchMetaId]?.matchNumber || NaN)
                : leagueMatchIndexMap[leagueKeyForIndex]?.[notification.id];

              // Resolve league name safely (avoid indexing with undefined)
              const leagueIdKey = meta.leagueId || meta.league_id;
              const resolvedLeagueName =
                (leagueIdKey ? leagueNames[leagueIdKey] : undefined) ||
                leagueNames[leagueKeyForIndex];

              // Insert times override beforehand:
              const timesOverride = matchMetaId ? matchTimes[matchMetaId] : undefined;
              const isMatchType = isMatchCreated(notification); // removed: as any
              const isAvailType = isAvailabilityNotification(notification);
              const isResultConfirm = isResultConfirmationNotification(notification);
              if (isAvailType && matchMetaId) {
                console.log('🧪 timesOverride for', matchMetaId, timesOverride);
              }

              // >>> ADD: derive league/match/date for the Confirm result panel
              const confirmLeagueName =
                extractLeagueName(meta, resolvedLeagueName) ||
                (matchMetaId ? matchMetaCache[matchMetaId]?.leagueName : '') ||
                '';

              const confirmMatchNo =
                (matchMetaId ? matchMetaCache[matchMetaId]?.matchNumber : '') ||
                pickFirst(meta, ['matchNumber','match_no','matchIndex','match_index']) ||
                '';

              const confirmDateIso =
                normalizePossibleDate(
                  pickFirst(meta, [
                    'date','matchDate','scheduledDate','startDate','start_date','startDateTime','start_datetime',
                    'start','startTime','start_time','scheduledStart','scheduled_start','kickoff','kickoffTime','kickoff_time'
                  ]) || (matchMetaId ? matchMetaCache[matchMetaId]?.date : '') || timesOverride?.start
                ) || undefined;

              const confirmDateLine = confirmDateIso ? formatDateLine(confirmDateIso) : '';
              // <<< END ADD

              const display = buildNotificationDisplay(
                notification,
                derivedMatchNo,
                resolvedLeagueName,
                timesOverride,
                matchMetaCache
              );
              const matchId = getMatchId(notification.meta) || '';
               const selected = matchId ? availabilitySelections[matchId] : undefined;
               const saving = matchId ? savingAvailability[matchId] : false;

              return (
                <Box key={notification.id}>
                  <Box
                    onClick={() => !notification.read && !isAvailType && markAsRead(notification.id)}
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
                    <IconButton
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await dismissActionedNotification(notification.id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        color: '#777',
                        '&:hover': { color: '#111', bgcolor: 'rgba(0,0,0,0.06)' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        {!isMatchType && notification.type !== 'MATCH_CREATED' && notification.type !== 'MATCH_ENDED' && notification.type !== 'MOTM_VOTE' && notification.type !== 'NEW_SEASON' && (
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

                        {!isMatchType && notification.type !== 'MATCH_ENDED' && notification.type !== 'MOTM_VOTE' && notification.type !== 'NEW_SEASON' && display.node}

                        {isAvailType && (
                          <Box>
                            {display.node}
                            {matchId && (() => {
                              // const started = matchHasStarted(meta, timesOverride);
                              const ended = matchHasEnded(meta, timesOverride);
                              const showAvailability = ALWAYS_SHOW_AVAILABILITY ? true : !ended;
                              if (!showAvailability) return null;
                              return (
                                <Box sx={{ mt: 1.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
                                      Can you play?
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
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
                                          px: 1, py: 0.4, fontSize: '12px', fontWeight: 700, borderRadius: 1, border: '1px solid',
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, minWidth: 58, transition: '0.2s',
                                          bgcolor: selected === 'YES' ? '#0d7a33' : '#e6f9ed',
                                          color: selected === 'YES' ? '#fff' : '#0d7a33',
                                          borderColor: selected === 'YES' ? '#0d7a33' : '#a8e4bf',
                                          boxShadow: selected === 'YES' ? '0 0 0 2px rgba(13,122,51,0.25)' : 'none',
                                          opacity: saving && selected === 'YES' ? 0.7 : 1,
                                          whiteSpace: 'nowrap'
                                        }}>
                                          <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                                          Yes
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
                                          px: 1, py: 0.4, fontSize: '12px', fontWeight: 700, borderRadius: 1, border: '1px solid',
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, minWidth: 58, transition: '0.2s',
                                          bgcolor: selected === 'NO' ? '#c62828' : '#ffecef',
                                          color: selected === 'NO' ? '#fff' : '#c62828',
                                          borderColor: selected === 'NO' ? '#c62828' : '#f5b5c0',
                                          boxShadow: selected === 'NO' ? '0 0 0 2px rgba(198,40,40,0.25)' : 'none',
                                          opacity: saving && selected === 'NO' ? 0.7 : 1,
                                          whiteSpace: 'nowrap'
                                        }}>
                                          <HighlightOffIcon sx={{ fontSize: 14 }} />
                                          No
                                        </Box>
                                      </Box>
                                      <Button
                                        component={Link}
                                        href={`/match/${matchId}`}
                                        size="small"
                                        variant="text"
                                        startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                                        sx={{
                                          textTransform: 'none',
                                          fontWeight: 700,
                                          color: '#fff',
                                          bgcolor: '#0b57d0',
                                          fontSize: '12px',
                                          px: 0.75,
                                          py: 0.4,
                                          minWidth: 'auto',
                                          whiteSpace: 'nowrap',
                                          '&:hover': { 
                                            color: '#fff',
                                            bgcolor: '#0b57d0'
                                          }
                                        }}
                                      >
                                        See Details
                                      </Button>
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

                        {isResultConfirm && matchId && (
                          <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                              Confirm result?
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Box
                                component="button"
                                disabled={!!savingResult[matchId]}
                                onClick={(e) => { e.stopPropagation(); handleConfirmResult(matchId, 'YES', notification.id); }}
                                style={{ all: 'unset', cursor: 'pointer' }}
                                aria-pressed={resultSelections[matchId] === 'YES'}
                              >
                                <Box sx={{
                                  px: 1.2, py: 0.5, fontSize: '12px', fontWeight: 700, borderRadius: 1, border: '1px solid',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, minWidth: 58, transition: '0.2s',
                                  bgcolor: resultSelections[matchId] === 'YES' ? '#0d7a33' : '#e6f9ed',
                                  color: resultSelections[matchId] === 'YES' ? '#fff' : '#0d7a33',
                                  borderColor: resultSelections[matchId] === 'YES' ? '#0d7a33' : '#a8e4bf',
                                  boxShadow: resultSelections[matchId] === 'YES' ? '0 0 0 2px rgba(13,122,51,0.25)' : 'none',
                                }}>
                                  <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                                  Yes
                                </Box>
                              </Box>
                              <Box
                                component="button"
                                disabled={!!savingResult[matchId]}
                                onClick={(e) => { e.stopPropagation(); handleConfirmResult(matchId, 'NO', notification.id); }}
                                style={{ all: 'unset', cursor: 'pointer' }}
                                aria-pressed={resultSelections[matchId] === 'NO'}
                              >
                                <Box sx={{
                                  px: 1.2, py: 0.5, fontSize: '12px', fontWeight: 700, borderRadius: 1, border: '1px solid',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, minWidth: 58, transition: '0.2s',
                                  bgcolor: resultSelections[matchId] === 'NO' ? '#c62828' : '#ffecef',
                                  color: resultSelections[matchId] === 'NO' ? '#fff' : '#c62828',
                                  borderColor: resultSelections[matchId] === 'NO' ? '#c62828' : '#f5b5c0',
                                  boxShadow: resultSelections[matchId] === 'NO' ? '0 0 0 2px rgba(198,40,40,0.25)' : 'none',
                                }}>
                                  <HighlightOffIcon sx={{ fontSize: 14 }} />
                                  No
                                </Box>
                              </Box>
                            </Box>
                            {resultRejectPending[matchId] && (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 1,
                                  borderRadius: 1,
                                  border: '1px solid #eee',
                                  bgcolor: '#fafafa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  width: '100%',
                                  flexWrap: 'wrap'
                                }}
                                onClick={(e)=>e.stopPropagation()}
                              >
                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#555', width: '100%', mb: 0.5 }}>
                                  Enter the scores you believe are correct. The league admin will be notified. Note: the admin can overrule and still upload the original scores.
                                </Typography>
                                <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Correct score:</Typography>
                                <TextField
                                  size="small"
                                  type="number"
                                  inputProps={{ min: 0 }}
                                  sx={{ width: 90 }}
                                  label="Home"
                                  value={resultSuggestion[matchId]?.home ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setResultSuggestion(prev => ({ ...prev, [matchId]: { home: val, away: prev[matchId]?.away ?? '' } }));
                                  }}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  inputProps={{ min: 0 }}
                                  sx={{ width: 90 }}
                                  label="Away"
                                  value={resultSuggestion[matchId]?.away ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setResultSuggestion(prev => ({ ...prev, [matchId]: { home: prev[matchId]?.home ?? '', away: val } }));
                                  }}
                                />
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={!!savingResult[matchId]}
                                  onClick={() => submitResultSuggestion(matchId, notification.id)}
                                >
                                  Send to Admin
                                </Button>
                                <Button
                                  size="small"
                                  color="inherit"
                                  disabled={!!savingResult[matchId]}
                                  onClick={() => cancelReject(matchId)}
                                >
                                  Cancel
                                </Button>
                                {savingResult[matchId] && (
                                  <Typography sx={{ fontSize: '11px', color: '#555' }}>Saving...</Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* MATCH_ENDED notification - Show "See Details" and "Add Stats" buttons */}
                        {(() => {
                          const isMatchEnded = notification.type === 'MATCH_ENDED';
                          if (isMatchEnded) {
                            console.log('🔍 MATCH_ENDED notification found:', {
                              type: notification.type,
                              matchId,
                              meta: notification.meta,
                              condition: isMatchEnded && !!matchId
                            });
                          }
                          return null;
                        })()}
                        {notification.type === 'MATCH_ENDED' && matchId && (
                          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Match Details Header */}
                            <Box sx={{ width: '100%' }}>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#E56A16', mb: 0.5 }}>
                                Match Has Ended!
                              </Typography>
                              
                              {/* Display notification body (contains teams and location) */}
                              <Typography sx={{ fontSize: '12px', color: '#555', mb: 1 }}>
                                {notification.body}
                              </Typography>

                              {/* League and Match Number */}
                              {confirmLeagueName && (
                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>
                                  League: {confirmLeagueName}
                                </Typography>
                              )}
                              {confirmMatchNo && (
                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>
                                  Match #{confirmMatchNo}
                                </Typography>
                              )}
                              {confirmDateLine && (
                                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#666', mb: 1 }}>
                                  {confirmDateLine}
                                </Typography>
                              )}
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                component={Link}
                                href={`/match/${matchId}`}
                                size="small"
                                variant="contained"
                                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 15 }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notification.read) markAsRead(notification.id);
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  color: '#fff',
                                  bgcolor: '#0b57d0',
                                  fontSize: '12px',
                                  px: 1.2,
                                  py: 0.5,
                                  '&:hover': {
                                    color: '#fff',
                                    bgcolor: '#0847a6'
                                  }
                                }}
                              >
                                See Details
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Extract leagueId from notification meta
                                  const leagueId = (notification.meta as MatchMeta)?.leagueId || (notification.meta as MatchMeta)?.league_id;
                                  setSelectedMatchId(matchId);
                                  setSelectedLeagueId(leagueId || null);
                                  setStatsSourceNotificationId(notification.id);
                                  setStatsOpen(true);
                                  handleNotificationClose();
                                }}
                                size="small"
                                variant="contained"
                                startIcon={<BarChartOutlinedIcon sx={{ fontSize: 15 }} />}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  color: '#fff',
                                  bgcolor: '#0d7a33',
                                  fontSize: '12px',
                                  px: 1.2,
                                  py: 0.5,
                                  '&:hover': {
                                    color: '#fff',
                                    bgcolor: '#0a5e28'
                                  }
                                }}
                              >
                                Add Stats
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {/* MOTM_VOTE notification - Show voter and voted player */}
                        {notification.type === 'MOTM_VOTE' && matchId && (
                          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Vote Details */}
                            <Box sx={{ width: '100%' }}>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFD700', mb: 0.5 }}>
                                {notification.title}
                              </Typography>
                              
                              {/* Display notification body with league and match info */}
                              <Typography sx={{ fontSize: '12px', color: '#333', mb: 1, fontWeight: 500, lineHeight: 1.5 }}>
                                {notification.body}
                              </Typography>
                            </Box>

                            {/* Action Button */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                component={Link}
                                href={`/match/${matchId}`}
                                size="small"
                                variant="contained"
                                startIcon={<EmojiEventsOutlinedIcon sx={{ fontSize: 15 }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notification.read) markAsRead(notification.id);
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  color: '#fff',
                                  bgcolor: '#FFD700',
                                  fontSize: '11px',
                                  px: 1,
                                  py: 0.4,
                                  '&:hover': {
                                    color: '#000',
                                    bgcolor: '#FFC700'
                                  }
                                }}
                              >
                                View Match
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {/* NEW_SEASON notification - Show Join/Decline buttons */}
                        {notification.type === 'NEW_SEASON' && (() => {
                          const seasonMeta = notification.meta as { actionTaken?: string; leagueName?: string; seasonNumber?: number } | undefined;
                          return (
                          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Season Details */}
                            <Box sx={{ width: '100%' }}>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                                {notification.title}
                              </Typography>
                              
                              {/* Display notification body */}
                              <Typography sx={{ fontSize: '12px', color: '#333', mb: 1, fontWeight: 500, lineHeight: 1.5 }}>
                                {notification.body}
                              </Typography>

                              {/* Show if action was already taken */}
                              {seasonMeta?.actionTaken && (
                                <Typography 
                                  sx={{ 
                                    fontSize: '11px', 
                                    color: seasonMeta.actionTaken === 'joined' ? '#0d7a33' : '#888', 
                                    fontWeight: 600,
                                    fontStyle: 'italic'
                                  }}
                                >
                                  {seasonMeta.actionTaken === 'joined' 
                                    ? 'You joined this season' 
                                    : 'You declined this season'}
                                </Typography>
                              )}
                            </Box>

                            {/* Action Buttons - Only show if action not yet taken */}
                            {!seasonMeta?.actionTaken && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeasonAction(notification.id, 'join');
                                  }}
                                  size="small"
                                  variant="contained"
                                  startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 15 }} />}
                                  disabled={savingSeasonAction[notification.id]}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#fff',
                                    bgcolor: '#0d7a33',
                                    fontSize: '12px',
                                    px: 2,
                                    py: 0.6,
                                    '&:hover': {
                                      color: '#fff',
                                      bgcolor: '#0a5e28'
                                    },
                                    '&:disabled': {
                                      bgcolor: '#ccc'
                                    }
                                  }}
                                >
                                  {savingSeasonAction[notification.id] ? 'Joining...' : 'Join Season'}
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeasonAction(notification.id, 'decline');
                                  }}
                                  size="small"
                                  variant="outlined"
                                  startIcon={<HighlightOffIcon sx={{ fontSize: 15 }} />}
                                  disabled={savingSeasonAction[notification.id]}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#666',
                                    borderColor: '#999',
                                    fontSize: '12px',
                                    px: 2,
                                    py: 0.6,
                                    '&:hover': {
                                      borderColor: '#666',
                                      bgcolor: 'rgba(0,0,0,0.04)'
                                    },
                                    '&:disabled': {
                                      borderColor: '#ccc',
                                      color: '#ccc'
                                    }
                                  }}
                                >
                                  {savingSeasonAction[notification.id] ? 'Processing...' : 'Decline'}
                                </Button>
                              </Box>
                            )}
                          </Box>
                          );
                        })()}
                        
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
            width: { xs: 248, sm: 280 },
            top: { xs: 64, sm: 70 },
            bottom: 'auto',
            height: 'auto',
            maxHeight: 'calc(100dvh - 78px)',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, rgba(15,16,18,0.98) 0%, rgba(28,30,34,0.98) 100%)',
            borderLeft: '1px solid rgba(255,255,255,0.10)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0 0 0 14px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.45)',
          },
        }}
      >
        <Box sx={{ px: 1.25, py: 1.25 }}>
          <List sx={{ p: 0 }}>
            {/* PROFILE BUTTON IN MOBILE DRAWER */}
            {isAuthenticated && (
              <>
                <ListItem disablePadding>
                  <Button
                    onClick={() => {
                      setDrawerOpen(false);
                      router.push('/profile');
                    }}
                    startIcon={<PersonOutlineOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontFamily: 'var(--font-woodford-bourne-pro)',
                      fontWeight: 700,
                      color: '#F3F4F6',
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 1,
                      px: 1.75,
                      py: 0.95,
                      fontSize: '14px',
                      justifyContent: 'flex-start',
                      minHeight: 44,
                      boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
                      mb: 0.75,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.10)',
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.22)',
                      },
                      '& .MuiButton-startIcon': { marginRight: 1 },
                    }}
                  >
                    Profile
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    onClick={() => {
                      setDrawerOpen(false);
                      setHowToPlayOpen(true);
                    }}
                    startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontFamily: 'var(--font-woodford-bourne-pro)',
                      fontWeight: 700,
                      color: '#F3F4F6',
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 1,
                      px: 1.75,
                      py: 0.95,
                      fontSize: '14px',
                      justifyContent: 'flex-start',
                      minHeight: 44,
                      boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
                      mb: 0.75,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.10)',
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.22)',
                      },
                      '& .MuiButton-startIcon': { marginRight: 1 },
                    }}
                  >
                    How to play
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    onClick={() => {
                      setDrawerOpen(false);
                      setGameRulesOpen(true);
                    }}
                    startIcon={<GavelOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontFamily: 'var(--font-woodford-bourne-pro)',
                      fontWeight: 700,
                      color: '#F3F4F6',
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 1,
                      px: 1.75,
                      py: 0.95,
                      fontSize: '14px',
                      justifyContent: 'flex-start',
                      minHeight: 44,
                      boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
                      mb: 0.75,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.10)',
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.22)',
                      },
                      '& .MuiButton-startIcon': { marginRight: 1 },
                    }}
                  >
                    Game rules
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                   onClick={() => {
                      handleProfileMenuClose();
                      setXpStatusOpen(true);
                    }}
                    startIcon={<BarChartOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontFamily: 'var(--font-woodford-bourne-pro)',
                      fontWeight: 700,
                      color: '#F3F4F6',
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 1,
                      px: 1.75,
                      py: 0.95,
                      fontSize: '14px',
                      justifyContent: 'flex-start',
                      minHeight: 44,
                      boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
                      mb: 0.75,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.10)',
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.22)',
                      },
                      '& .MuiButton-startIcon': { marginRight: 1 },
                    }}
                  >
                    XP Status
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    onClick={() => {
                      setDrawerOpen(false);
                      handleSignOutClick();
                    }}
                    startIcon={<Image src={logoutpic} alt="sign out" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontFamily: 'var(--font-woodford-bourne-pro)',
                      fontWeight: 700,
                      color: '#F87171',
                      bgcolor: 'rgba(248,113,113,0.06)',
                      border: '1px solid rgba(248,113,113,0.32)',
                      borderRadius: 1,
                      px: 1.75,
                      py: 0.95,
                      fontSize: '14px',
                      justifyContent: 'flex-start',
                      minHeight: 44,
                      boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(248,113,113,0.14)',
                        color: '#fca5a5',
                        borderColor: 'rgba(248,113,113,0.48)',
                      },
                      '& .MuiButton-startIcon': { marginRight: 1 },
                    }}
                  >
                    Sign out
                  </Button>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* YOUR EXISTING DIALOGS - keeping them as they were */}
      <Dialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: '#2b2b2b',
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
          <Typography variant="h6" sx={{
            fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '24px', md: '32px' },
            mb: 2,
            color: '#111827'
          }}>
            1. Complete Your Player Card
          </Typography>
          <Typography variant="body1" sx={{
            mb: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: { xs: '16px', md: '18px' }
          }}>
            After signup, open your player profile and set your card details and skill levels. Keeping your card updated helps with fair team balance and better match setup.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={playercardupdate.src} alt='Player Card Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          <Typography variant="h6" sx={{
            fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '24px', md: '32px' },
            mb: 2,
            color: '#111827'
          }}>
            2. Join or Create a League
          </Typography>
          <Typography variant="body1" sx={{
            mb: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: { xs: '16px', md: '18px' }
          }}>
            Use an <b>invite code</b> to join a league, or create your own from the home page. If you are in multiple leagues, you can switch between them from league selectors in the app.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={leagueimg.src} alt='League Example' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Each league can have seasons. Use the season selector to view the right season data (fixtures, results, table, leaderboard, players, and dream team).
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The creator is initially the <b>league admin</b>. Admin can update league settings, manage season flow, and keep match data accurate.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={leaguesetting.src} alt='League Settings' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#111827' }}>
            3. Match Flow: Fixtures to Results
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Open your league and use tabs like <b>Fixtures</b>, <b>Match Results</b>, <b>League Table</b>, <b>Leaderboard</b>, <b>Players</b>, and <b>Dream Team</b>.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            In <b>Fixtures</b>, players mark availability. In <b>Match Results</b>, users can view teams, result details, and posted outcomes.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={progressimg.src} alt='League Progress' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#111827' }}>
            4. Admin Actions
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Admin can create/schedule matches, edit match details, publish scores, and manage archived matches. Teams can be viewed from each match card, and match updates refresh league data automatically.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Typical admin flow: <b>Fixtures</b> {`>`} <b>New Match</b> {`>`} set details {`>`} completed match {`>`} add stats and scores in <b>Match Results</b>.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={matchdetails.src} alt='Match Management' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#111827' }}>
            5. Stats, XP, and Player Progress
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Player stats (goals, assists, clean sheets, MOTM, and defensive impact) are updated from match results. XP and progress indicators are shown in player pages and ranking tables.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You can open any player from league tables or leaderboards to view profile, performance history, and detailed season or career metrics.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image src={palyerstats.src} alt='Player Stats' width={550} height={180} style={{ borderRadius: 8, objectFit: 'contain', maxWidth: '100%' }} />
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#111827' }}>
            6. Trophy Room and Awards
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Trophy Room shows league and individual awards by league and season. Awards are finalized based on completed season data and recorded performance.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Common awards include <b>League Champion</b>, <b>Runner-Up</b>, <b>Golden Boot</b>, <b>King Playmaker</b>, <b>Ballon d&apos;Or</b>, and role-based honors.
          </Typography>

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#111827' }}>
            7. Best Practice for Smooth Leagues
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Keep league settings and season selections consistent, publish results promptly, and verify match stats after each game. This keeps tables, leaderboards, dream team, and trophies accurate for everyone.
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog open={gameRulesOpen} onClose={() => setGameRulesOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{
          background: '#0e0e0e',
          color: 'white',
          fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '24px', md: '32px' },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #E56A16'
        }}>
          Game Rules
          <IconButton
            aria-label="close"
            onClick={() => setGameRulesOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a', p: { xs: 2, md: 4 }, color: '#fff' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography sx={{
              fontFamily: 'var(--font-woodford-bourne-pro)',
              fontWeight: 800,
              fontSize: { xs: '20px', md: '28px' },
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1
            }}>
              League Point Scoring Reference
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '600px', mx: 'auto' }}>
              Point scoring and XP awards are automatically calculated based on player performances and match outcomes. Use this reference to track how standings are updated.
            </Typography>
          </Box>

          {(() => {
            const getRowIcon = (action: string) => {
              switch(action) {
                case 'Winning Team Bonus': return <CheckCircleOutlineIcon sx={{ color: '#00a896', fontSize: '1.25rem' }} />;
                case 'Draw': return <HandshakeOutlinedIcon sx={{ color: '#e56a16', fontSize: '1.25rem' }} />;
                case 'Losing Team Consolation': return <HighlightOffIcon sx={{ color: '#f87171', fontSize: '1.25rem' }} />;
                case 'Man of the Match (MOTM)': return <Star sx={{ color: '#F59E0B', fontSize: 18 }} />;
                case 'Clean Sheets (Goalkeeper)': return <ShieldOutlinedIcon sx={{ color: '#00a896', fontSize: '1.25rem' }} />;
                case 'Goal Scored': return <SportsSoccerOutlinedIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />;
                case 'Assist': return <StarOutlineIcon sx={{ color: '#00a896', fontSize: '1.25rem' }} />;
                case 'Man of the Match Votes': return <ThumbUpOutlinedIcon sx={{ color: '#f87171', fontSize: '1.25rem' }} />;
                case 'Defensive Impact': return <ShieldOutlinedIcon sx={{ color: '#B0B0B0', fontSize: '1.25rem' }} />;
                case '+ Mentality': return <PsychologyOutlinedIcon sx={{ color: '#9B59B6', fontSize: '1.25rem' }} />;
                default: return null;
              }
            };

            return (
              <TableContainer component={Box} sx={{
                maxHeight: '70vh',
                overflow: 'auto',
                borderRadius: 2,
                border: '1px solid #2a2a2a',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                bgcolor: '#242424'
              }}>
                <Table stickyHeader aria-label="point scoring rules table" sx={{ borderCollapse: 'separate', '& .MuiTableCell-root': { borderBottom: '1px solid #333' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{
                        bgcolor: '#2b2b2b !important',
                        color: '#00a896 !important',
                        fontWeight: 800,
                        fontFamily: 'var(--font-woodford-bourne-pro)',
                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                        py: 2,
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        boxShadow: '8px 0 12px -12px rgba(0,0,0,0.45)',
                        borderRight: '1.5px solid rgba(255,255,255,0.15)',
                        minWidth: { xs: '120px', md: '160px' },
                        maxWidth: { xs: '120px', md: '160px' },
                      }}>Action</TableCell>
                      <TableCell sx={{ bgcolor: '#2b2b2b !important', color: '#00a896 !important', fontWeight: 800, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: { xs: '0.85rem', md: '0.95rem' }, py: 2, whiteSpace: 'nowrap' }}>League Point Scoring Description</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#2b2b2b !important', color: '#00a896 !important', fontWeight: 800, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: { xs: '0.85rem', md: '0.95rem' }, py: 2, whiteSpace: 'nowrap' }}>Winning Team</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#2b2b2b !important', color: '#00a896 !important', fontWeight: 800, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: { xs: '0.85rem', md: '0.95rem' }, py: 2, whiteSpace: 'nowrap' }}>Losing Team</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#2b2b2b !important', color: '#00a896 !important', fontWeight: 800, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: { xs: '0.85rem', md: '0.95rem' }, py: 2, whiteSpace: 'nowrap' }}>Classic Scoring</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { action: 'Winning Team Bonus', desc: 'Winning a match', winning: '30 xp', losing: '', isLosingEmpty: true, points: '3 Points' },
                      { action: 'Draw', desc: 'Drawing a match', winning: '15 xp', losing: '15 xp', isMerged: true, points: '1 Point' },
                      { action: 'Losing Team Consolation', desc: 'Losing a match', winning: '', isWinningEmpty: true, losing: '10 xp', points: '0 Points' },
                      { action: 'Man of the Match (MOTM)', desc: 'Player with the most count of Man of the Match votes in a single Match', winning: '10 xp', losing: '5 xp', points: '0 Points' },
                      { action: 'Clean Sheets (Goalkeeper)', desc: 'Player keeping a clean sheet during their total episodes in goal', winning: '5 xp', losing: '5 xp', isMerged: true, points: '0 Points' },
                      { action: 'Goal Scored', desc: 'Total number of goals scored by a player', winning: '3 xp', losing: '2 xp', points: '0 Points' },
                      { action: 'Assist', desc: 'Total number of goal assists made by a player', winning: '2 xp', losing: '1 xp', points: '0 Points' },
                      { action: 'Man of the Match Votes', desc: 'Player receiving individual count of votes per match', winning: '2 xp', losing: '1 xp', points: '0 Points' },
                      { action: 'Defensive Impact', desc: 'Decisive defensive or goalkeeping performance in the match', winning: '2 xp', losing: '1 xp', points: '0 Points' },
                      { action: '+ Mentality', desc: 'Recognise positive mentality and sportsmanship in the match.', winning: '2 xp', losing: '2 xp', points: '0 Points' }
                    ].map((row, idx) => {
                      const rowBg = idx % 2 === 0 ? '#242424' : '#1e1e1e';
                      return (
                        <TableRow key={idx} sx={{ bgcolor: rowBg, '&:hover': { bgcolor: '#2c2c2c' }, transition: 'background-color 0.15s' }}>
                          <TableCell sx={{
                            py: 1.5,
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            bgcolor: rowBg,
                            boxShadow: '8px 0 12px -12px rgba(0,0,0,0.62)',
                            borderRight: '1.5px solid rgba(255,255,255,0.15)',
                            transition: 'background-color 0.15s',
                            minWidth: { xs: '120px', md: '160px' },
                            maxWidth: { xs: '120px', md: '160px' },
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            '.MuiTableRow-root:hover &': {
                              bgcolor: '#2c2c2c',
                              boxShadow: '8px 0 12px -12px rgba(0,0,0,0.72)',
                            },
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 24 }}>{getRowIcon(row.action)}</Box>
                              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-woodford-bourne-pro)' }}>{row.action}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', py: 1.5 }}>
                            {row.desc}
                          </TableCell>
                          {row.isMerged ? (
                            <TableCell colSpan={2} align="center" sx={{ color: '#00a896', fontWeight: 800, fontSize: '0.95rem', bgcolor: 'rgba(0,168,150,0.05)', py: 1.5 }}>
                              {row.winning}
                            </TableCell>
                          ) : (
                            <>
                              <TableCell align="center" sx={{
                                color: row.isWinningEmpty ? 'rgba(255,255,255,0.15)' : 'white',
                                fontWeight: row.isWinningEmpty ? 400 : 700,
                                fontSize: '0.9rem',
                                bgcolor: row.isWinningEmpty ? '#151515' : 'transparent',
                                py: 1.5
                              }}>
                                {row.winning || '-'}
                              </TableCell>
                              <TableCell align="center" sx={{
                                color: row.isLosingEmpty ? 'rgba(255,255,255,0.15)' : 'white',
                                fontWeight: row.isLosingEmpty ? 400 : 700,
                                fontSize: '0.9rem',
                                bgcolor: row.isLosingEmpty ? '#151515' : 'transparent',
                                py: 1.5
                              }}>
                                {row.losing || '-'}
                              </TableCell>
                            </>
                          )}
                          <TableCell align="center" sx={{
                            color: row.points.startsWith('0') ? 'rgba(255,255,255,0.4)' : '#F1C40F',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            py: 1.5
                          }}>
                            {row.points}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Streak Bonuses Header Row */}
                    <TableRow sx={{ bgcolor: '#2b2b2b !important' }}>
                      <TableCell colSpan={5} sx={{
                        bgcolor: '#2b2b2b !important',
                        py: 1.8,
                        borderBottom: '2px solid #E56A16',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                      }}>
                        <Typography sx={{
                          fontFamily: 'var(--font-woodford-bourne-pro)',
                          fontWeight: 800,
                          color: '#00a896',
                          fontSize: '1rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap'
                        }}>
                          Streak Bonuses
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {[
                      { action: 'Streak Bonuses: Played 25% of league matches in a row', desc: 'Player reaching a milestone for participating in 25% of the total league matches.', xp: '15 XP', points: '0 Points' },
                      { action: 'Streak Bonuses: Played at least 50% of league matches', desc: 'Player reaching a milestone for participating in 50% of the total league matches.', xp: '50 XP', points: '0 Points' },
                      { action: 'Streak Bonuses: Played at least 75% of league matches', desc: 'Player reaching a milestone for participating in 75% of the total league matches.', xp: '100 XP', points: '0 Points' }
                    ].map((row, idx) => {
                      const rowBg = idx % 2 === 0 ? '#242424' : '#1e1e1e';
                      return (
                        <TableRow key={`streak-${idx}`} sx={{ bgcolor: rowBg, '&:hover': { bgcolor: '#2c2c2c' }, transition: 'background-color 0.2s' }}>
                          <TableCell sx={{
                            py: 1.5,
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            bgcolor: rowBg,
                            boxShadow: '8px 0 12px -12px rgba(0,0,0,0.62)',
                            borderRight: '1.5px solid rgba(255,255,255,0.15)',
                            transition: 'background-color 0.2s',
                            minWidth: { xs: '120px', md: '160px' },
                            maxWidth: { xs: '120px', md: '160px' },
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            '.MuiTableRow-root:hover &': {
                              bgcolor: '#2c2c2c',
                              boxShadow: '8px 0 12px -12px rgba(0,0,0,0.72)',
                            },
                          }}>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-woodford-bourne-pro)' }}>
                              {row.action}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', py: 1.5 }}>
                            {row.desc}
                          </TableCell>
                          <TableCell colSpan={2} align="center" sx={{ color: '#00a896', fontWeight: 800, fontSize: '0.95rem', bgcolor: 'rgba(0,168,150,0.05)', py: 1.5 }}>
                            {row.xp}
                          </TableCell>
                          <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.9rem', py: 1.5 }}>
                            {row.points}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Dialog open={xpStatusOpen} onClose={() => setXpStatusOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{
          background: '#0e0e0e',
          color: 'white',
          fontFamily: 'Franklin Gothic Demi, Franklin Gothic Medium, Arial, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '24px', md: '32px' },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          XP Status
          <IconButton
            aria-label="close"
            onClick={() => setXpStatusOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a', p: 0 }}>
          <TableContainer component={Box} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Table stickyHeader aria-label="xp milestones table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#2b2b2b', color: '#00a896', fontWeight: 800, borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>
                    Level
                  </TableCell>
                  <TableCell
                    sx={{
                      bgcolor: '#2b2b2b',
                      color: '#00a896',
                      fontWeight: 800,
                      borderBottom: '1px solid #333',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      zIndex: 4,
                      boxShadow: '8px 0 12px -12px rgba(0,0,0,0.45)',
                    }}
                  >
                    Milestone Title
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#2b2b2b', color: '#00a896', fontWeight: 800, borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>XP Range</TableCell>
                  <TableCell sx={{ bgcolor: '#2b2b2b', color: '#00a896', fontWeight: 800, borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>Description</TableCell>
                  <TableCell sx={{ bgcolor: '#2b2b2b', color: '#00a896', fontWeight: 800, borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>Star Color</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { level: 1, title: 'Rookie', range: '0 - 500', desc: 'Building your way to football dominance, all the way to Champion Footballer', color: '#B0B0B0', label: 'Cool Gray' },
                  { level: 2, title: 'Rising Star', range: '500 - 2,500', desc: 'Rising in prominence with every performance', color: '#4AA3FF', label: 'Sky Blue' },
                  { level: 3, title: 'Baller', range: '2,500 - 5,000', desc: "A force on the field that can't be ignored", color: '#00a896', label: 'CF Green' },
                  { level: 4, title: 'Pro', range: '5,000 - 15,000', desc: 'High mastery and control over the matches, consistently excelling and asserting dominance in your position', color: '#9B59B6', label: 'Purple' },
                  { level: 5, title: 'Elite', range: '15,000 - 25,000', desc: 'Regarded as an elite player by peers, known for unwavering talent and a relentless winning mentality', color: '#3448FF', label: 'Royal Blue' },
                  { level: 6, title: 'Champion Footballer', range: '25,000 - 50,000', desc: 'Attaining coveted status as a benchmark of excellence. A true icon of the game, respected by peers and feared by opponents', color: '#E74C3C', label: 'Crimson' },
                  { level: 7, title: 'GOAT', range: '50,000+', desc: 'An undisputed footballer, forever cemented in the history books as the greatest of all time', color: '#F1C40F', label: 'Gold' },
                ].map((row) => (
                  <TableRow key={row.level} sx={{ '&:hover': { bgcolor: '#252525' } }}>
                    <TableCell
                      sx={{
                        color: 'white',
                        borderBottom: '1px solid #333',
                        fontWeight: 700,
                      }}
                    >
                      {row.level}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: 'white',
                        borderBottom: '1px solid #333',
                        fontWeight: 600,
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        bgcolor: '#1a1a1a',
                        boxShadow: '8px 0 12px -12px rgba(0,0,0,0.62)',
                        '.MuiTableRow-root:hover &': {
                          bgcolor: '#252525',
                          boxShadow: '8px 0 12px -12px rgba(0,0,0,0.72)',
                        },
                      }}
                    >
                      {row.title}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>{row.range}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid #333', fontSize: '0.9rem' }}>{row.desc}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #333' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: row.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <Typography sx={{ color: 'white', fontSize: '0.85rem' }}>{row.label}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
