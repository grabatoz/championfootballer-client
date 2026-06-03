"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { Box, Typography, Button, CircularProgress, Divider, SxProps, Theme, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Groups, Edit, Close } from "@mui/icons-material";
import GoalsIcon from '@/Components/images/goal.png';
import AssistIcon from '@/Components/images/Assist.png';
import CleanSheetIcon from '@/Components/images/cleansheet.png';
import { useAuth } from '@/lib/hooks';
import ViewTeamPopupLoadingSkeleton from '@/Components/loading/ViewTeamPopupLoadingSkeleton';
import MatchResultLoadingSkeleton from '@/Components/loading/MatchResultLoadingSkeleton';
const MatchSummary = dynamic(() => import('@/Components/MatchSummary'), {
  loading: () => <CircularProgress />,
  ssr: false
});
const CloseButton = dynamic(() => import('@/Components/CloseButton'), {
  loading: () => <></>,
  ssr: false
});
const TeamPreviewScreen = dynamic(() => import('@/Components/viewteam/viewteam'), {
  loading: () => <ViewTeamPopupLoadingSkeleton />,
  ssr: false
});
import ShirtImg from '@/Components/images/shirtimg.png';
import RightShirtImg from '@/Components/images/awayteamshirt.png';
import EditImg from '@/Components/images/edit.png';
import FootBallIcon from '@/Components/images/cardfootball.png';
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cacheManager } from "@/lib/cacheManager"
import toast from "react-hot-toast";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  shirtNumber?: string;
  level?: string;
  skills?: {
    dribbling?: number;
    shooting?: number;
    passing?: number;
    pace?: number;
    defending?: number;
    physical?: number;
  };
  preferredFoot?: string;
  profilePicture?: string;
  positionType?: string;
  statistics?: {
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    penalties?: number;
    freeKicks?: number;
    defence?: number;
    impact?: number;
    // add other fields if you want
  }[];
  // added flag (not from backend users) for guest placeholders
  isGuest?: boolean;
}

interface Match {
  awayTeamImage?: string;
  homeTeamImage?: string;
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  location: string;
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  homeTeamGoals?: number;
  awayTeamGoals?: number;
  notes?: string;
  manOfTheMatchVotes?: Record<string, string>;
  status: string;
  start?: string;
  homeCaptainId?: string;
  awayCaptainId?: string;
  homeCaptainConfirmed?: boolean;
  awayCaptainConfirmed?: boolean;
  leagueId?: string;
  seasonId?: string;
  seasonMatchNumber?: number;
  end?: string;
  availableUsers?: { id: string }[];
  // Captain picks (from league matches data)
  homeDefensiveImpactId?: string | null;
  awayDefensiveImpactId?: string | null;
  homeMentalityId?: string | null;
  awayMentalityId?: string | null;
  // guests array provided by backend (team based) -> we merge into display list
  guests?: { id: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string }[];
}

interface League {
  id: string;
  name: string;
  isAdmin?: boolean;
  maxGames?: number;
  seasons?: Array<{ id: string; maxGames?: number }>;
  matches: {
    id: string;
    seasonId?: string;
    seasonMatchNumber?: number;
    homeDefensiveImpactId?: string | null;
    awayDefensiveImpactId?: string | null;
    homeMentalityId?: string | null;
    awayMentalityId?: string | null
  }[];
}

type PlayerWithTeam = User & { __team: 'home' | 'away' };

// Lightweight per-match stats shape for table display (includes XP)
type MatchStatLite = {
  goals: number;
  assists: number;
  cleanSheets: number;
  penalties: number;
  freeKicks: number;
  defence: number;
  impact: number;
  xpAwarded: number;
};

const isGuestLastName = (lastName?: string): boolean =>
  String(lastName ?? '').trim().toLowerCase() === 'guest';

const formatPlayerDisplayName = (player: { firstName?: string; lastName?: string; isGuest?: boolean }): string => {
  const first = String(player.firstName ?? '').trim();
  const last = String(player.lastName ?? '').trim();

  if (isGuestLastName(last)) {
    return first ? `${first} (Guest)` : '(Guest)';
  }

  const full = `${first} ${last}`.trim();
  if (!full) return player.isGuest ? '(Guest)' : 'Player';
  return player.isGuest ? `${full} (Guest)` : full;
};


export default function MatchDetailsPage({ matchIdProp }: { matchIdProp?: string } = {}) {
  const params = useParams();
  const matchId = matchIdProp || (params?.matchId as string);
  const isEmbeddedInDialog = Boolean(matchIdProp);
  // const router = useRouter();
  const { token, user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});
  const [playerVotes, setPlayerVotes] = useState<Record<string, number>>({});
  const [, setVotedForId] = useState<string | null>(null);
  // Admin state (from league response)
  const [isAdmin, setIsAdmin] = useState(false);
  // Admin edit mode - when true, clicking a player opens stats editor
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [viewTeamOpen, setViewTeamOpen] = useState(false);
  // Admin player stats editor dialog
  const [editingPlayer, setEditingPlayer] = useState<(User & { __team?: 'home' | 'away' }) | null>(null);
  const [editStats, setEditStats] = useState({ goals: 0, assists: 0, cleanSheets: 0 });
  const [editStatsLoading, setEditStatsLoading] = useState(false);
  const [editStatsSaving, setEditStatsSaving] = useState(false);
  // track if we already attempted detailed fetch to avoid loops
  const detailedFetchDone = useRef(false);
  // cache of per-player stats fetched via ultra-fast endpoint (used for guests)
  const [perPlayerStats, setPerPlayerStats] = useState<Record<string, MatchStatLite>>({});
  const fetchedStatsKeysRef = useRef(new Set<string>());
  const getNestedLeagueId = useCallback((matchLike: unknown): string => {
    if (!matchLike || typeof matchLike !== 'object') return '';
    const matchRecord = matchLike as Record<string, unknown>;
    const nestedLeague = matchRecord.league;
    if (!nestedLeague || typeof nestedLeague !== 'object') return '';
    return String((nestedLeague as Record<string, unknown>).id || '').trim();
  }, []);

  // Fetch match data function
  const fetchMatchData = useCallback((silent = false) => {
    if (!matchId || !token) return;
    if (!silent) setLoading(true);

    console.log('🔄 Fetching match data with cache busting...');

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}?_t=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Match not found');
        return res.json();
      })
      .then(data => {
        if (data.success && data.match) {
          // Normalize: ensure leagueId is always a top-level field
          const m = data.match;
          if (!m.leagueId && m.league?.id) m.leagueId = m.league.id;
          console.log('✅ Match data updated:', m);
          setMatch(m);
          // Reset detailed fetch flag to allow guests to be re-fetched
          detailedFetchDone.current = false;
          // Clear stats cache to force fresh fetch
          fetchedStatsKeysRef.current.clear();
          setPerPlayerStats({});
        }
        setLoading(false);
      })
      .catch(() => {
        setMatch(null);
        setLoading(false);
      });
  }, [matchId, token]);

  // Initial fetch
  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  // Listen for match updates from stats dialog
  useEffect(() => {
    const handleMatchUpdate = (e: Event) => {
      console.log('📢 Received match-updated event');
      const customEvent = e as CustomEvent;
      // Refresh if it's our match or general update
      if (!customEvent.detail?.matchId || customEvent.detail.matchId === matchId) {
        console.log('🔄 Refreshing match data due to update event...');
        fetchMatchData(true);
      }
    };

    window.addEventListener('match-updated', handleMatchUpdate);
    return () => window.removeEventListener('match-updated', handleMatchUpdate);
  }, [matchId, fetchMatchData]);

  useEffect(() => {
    const lid = match?.leagueId || getNestedLeagueId(match);
    if (match && lid && token) {
      const seasonQuery = match?.seasonId ? `?seasonId=${encodeURIComponent(String(match.seasonId))}` : '';
      const separator = seasonQuery ? '&' : '?';
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${lid}${seasonQuery}${separator}_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.league) {
            setLeague(data.league);
            // Set admin flag from league response
            if (data.league.isAdmin === true) setIsAdmin(true);
            // Merge captain pick IDs from league matches into current match
            const leagueMatch = data.league.matches?.find((m: { id: string }) => m.id === match?.id);
            if (leagueMatch) {
              setMatch(prev => prev ? {
                ...prev,
                homeDefensiveImpactId: leagueMatch.homeDefensiveImpactId ?? prev.homeDefensiveImpactId,
                awayDefensiveImpactId: leagueMatch.awayDefensiveImpactId ?? prev.awayDefensiveImpactId,
                homeMentalityId: leagueMatch.homeMentalityId ?? prev.homeMentalityId,
                awayMentalityId: leagueMatch.awayMentalityId ?? prev.awayMentalityId,
              } : prev);
            }
          }
        });
    }
  }, [match, token, getNestedLeagueId]);

  // Fetch detailed match (including guests) if not present in initial /matches/:id response
  useEffect(() => {
    const lid2 = match?.leagueId || getNestedLeagueId(match);
    if (!match || !token || !lid2) return;
    // If guests already present or already fetched, skip
    if (match.guests?.length || detailedFetchDone.current) return;
    detailedFetchDone.current = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${lid2}/matches/${match.id}?_t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data.success && data.match) {
          setMatch(prev => {
            if (!prev || prev.id !== data.match.id) return prev;
            return {
              ...prev,
              leagueId: data.match.leagueId || prev.leagueId,
              seasonId: data.match.seasonId || prev.seasonId,
              seasonMatchNumber: typeof data.match.seasonMatchNumber === 'number'
                ? data.match.seasonMatchNumber
                : prev.seasonMatchNumber,
              homeTeamName: data.match.homeTeamName || prev.homeTeamName,
              awayTeamName: data.match.awayTeamName || prev.awayTeamName,
              homeTeamImage: data.match.homeTeamImage || prev.homeTeamImage,
              awayTeamImage: data.match.awayTeamImage || prev.awayTeamImage,
              start: data.match.start || prev.start,
              end: data.match.end || prev.end,
              location: data.match.location || prev.location,
              homeCaptainId: data.match.homeCaptainId || prev.homeCaptainId,
              awayCaptainId: data.match.awayCaptainId || prev.awayCaptainId,
              homeCaptainConfirmed: typeof data.match.homeCaptainConfirmed === 'boolean'
                ? data.match.homeCaptainConfirmed
                : prev.homeCaptainConfirmed,
              awayCaptainConfirmed: typeof data.match.awayCaptainConfirmed === 'boolean'
                ? data.match.awayCaptainConfirmed
                : prev.awayCaptainConfirmed,
              homeTeamGoals: typeof data.match.homeTeamGoals === 'number' ? data.match.homeTeamGoals : prev.homeTeamGoals,
              awayTeamGoals: typeof data.match.awayTeamGoals === 'number' ? data.match.awayTeamGoals : prev.awayTeamGoals,
              status: data.match.status || prev.status,
              homeTeamUsers: Array.isArray(data.match.homeTeamUsers) ? data.match.homeTeamUsers : prev.homeTeamUsers,
              awayTeamUsers: Array.isArray(data.match.awayTeamUsers) ? data.match.awayTeamUsers : prev.awayTeamUsers,
              guests: data.match.guests || prev.guests || []
            };
          });
        }
      } catch { /* ignore */ }
    })();
  }, [match, token, getNestedLeagueId]);

  // Fetch ALL per-match stats for every player (single call, no playerId param)
  useEffect(() => {
    if (!token || !matchId || !match) return;
    // Only fetch once per matchId load (cleared on refresh via fetchedStatsKeysRef)
    if (fetchedStatsKeysRef.current.has('__all__')) return;
    fetchedStatsKeysRef.current.add('__all__');

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data?.success && Array.isArray(data.stats)) {
          const statsMap: Record<string, MatchStatLite> = {};
          data.stats.forEach((s: Record<string, unknown>) => {
            const userLike = (s.user && typeof s.user === 'object') ? (s.user as Record<string, unknown>) : null;
            const displayUid = String(s.displayUserId || s.userDisplayId || '');
            const rawUid = String(s.userId || userLike?.id || '');
            if (!displayUid && !rawUid) return;
            const entry: MatchStatLite = {
              goals: Number(s.goals) || 0,
              assists: Number(s.assists) || 0,
              cleanSheets: Number(s.cleanSheets) || 0,
              penalties: Number(s.penalties) || 0,
              freeKicks: Number(s.freeKicks) || 0,
              defence: Number(s.defence) || 0,
              impact: Number(s.impact) || 0,
              // Source XP strictly from match_statistics (xpAwarded/xp_awarded)
              xpAwarded: Number(s.xpAwarded ?? s.xp_awarded) || 0,
            };
            // Canonical match row key (guest mirrors are returned as guest-<guestId>).
            if (displayUid) statsMap[displayUid] = entry;
            // Backward-compatible aliases for older backend responses.
            if (rawUid) {
              statsMap[rawUid] = entry;
              statsMap[`guest-${rawUid}`] = entry;
            }
          });
          setPerPlayerStats(statsMap);
        }
      } catch { /* ignore */ }
    })();
  }, [token, matchId, match]);

  // Prefer canonical captain picks endpoint so guest picks are returned as guest-<id> display IDs.
  useEffect(() => {
    if (!token || !match?.id) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}/captain-picks?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!active || !data?.success) return;
        setMatch(prev => {
          if (!prev || prev.id !== match.id) return prev;
          return {
            ...prev,
            homeDefensiveImpactId: data?.home?.defence ?? null,
            awayDefensiveImpactId: data?.away?.defence ?? null,
            homeMentalityId: data?.home?.influence ?? null,
            awayMentalityId: data?.away?.influence ?? null,
          };
        });
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [token, match?.id]);

  // Automatically select home team on load if match is loaded
  useEffect(() => {
    if (match && selectedTeam === null) {
      setSelectedTeam('home');
    }
  }, [match, selectedTeam]);

  // Fetch votes and set votedForId ONLY from backend
  const fetchVotes = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes?_t=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setPlayerVotes(data.votes || {});
      setVotedForId(data.userVote || null); // <-- Always set from backend only!
    }
  }, [matchId, token]);

  useEffect(() => {
    if (matchId && token) fetchVotes();
  }, [matchId, token, fetchVotes]);

  // Live-update votes without page refresh: listen for vote-related events
  useEffect(() => {
    const handleVotesEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      // If event carries a matchId, ensure it matches; otherwise, refresh anyway
      if (!customEvent.detail?.matchId || customEvent.detail.matchId === matchId) {
        fetchVotes();
      }
    };

    // These events can be dispatched by dialogs/forms after a vote change
    window.addEventListener('votes-updated', handleVotesEvent);
    window.addEventListener('vote-submitted', handleVotesEvent);
    // Also react to general match updates to keep votes in sync
    window.addEventListener('match-updated', handleVotesEvent);

    return () => {
      window.removeEventListener('votes-updated', handleVotesEvent);
      window.removeEventListener('vote-submitted', handleVotesEvent);
      window.removeEventListener('match-updated', handleVotesEvent);
    };
  }, [matchId, fetchVotes]);
  const showGoals = match?.status === 'started' || match?.status === 'RESULT_PUBLISHED';

  const toApiPlayerId = (playerId: string): string =>
    String(playerId || '').startsWith('guest-') ? String(playerId).slice(6) : String(playerId);

  // Admin: open player stats editor
  const handleOpenPlayerEdit = async (player: User & { __team?: 'home' | 'away' }) => {
    if (!token || !matchId) return;
    setEditingPlayer(player);
    setEditStatsLoading(true);
    try {
      const apiPlayerId = toApiPlayerId(player.id);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?playerId=${apiPlayerId}&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setEditStats({
            goals: data.stats.goals || 0,
            assists: data.stats.assists || 0,
            cleanSheets: data.stats.cleanSheets || 0,
          });
        } else {
          setEditStats({ goals: 0, assists: 0, cleanSheets: 0 });
        }
      } else {
        setEditStats({ goals: 0, assists: 0, cleanSheets: 0 });
      }
    } catch {
      setEditStats({ goals: 0, assists: 0, cleanSheets: 0 });
    } finally {
      setEditStatsLoading(false);
    }
  };

  // Admin: save player stats
  const handleSavePlayerStats = async () => {
    if (!editingPlayer || !token || !matchId) return;
    setEditStatsSaving(true);
    try {
      const apiPlayerId = toApiPlayerId(editingPlayer.id);
      // Compute contribution % to match backend/client formula
      const isHome = editingPlayer.__team
        ? editingPlayer.__team === 'home'
        : (match?.homeTeamUsers ?? []).some(p => p.id === apiPlayerId);
      const teamGoals = isHome ? (match?.homeTeamGoals ?? 0) : (match?.awayTeamGoals ?? 0);
      const goalContribution = teamGoals > 0 ? (editStats.goals / teamGoals) * 100 : 0;
      const assistContribution = teamGoals > 0 ? (editStats.assists / teamGoals) * 50 : 0;
      const cleanSheetContribution = editStats.cleanSheets > 0 ? 15 * editStats.cleanSheets : 0;
      const rawContribution = goalContribution + assistContribution + cleanSheetContribution;
      const impact = rawContribution > 0 ? Math.max(0, Math.min(100, Math.round(rawContribution))) : 15;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: apiPlayerId,
          ...editStats,
          defence: 0,
          penalties: 0,
          freeKicks: 0,
          impact,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Clear caches
        const STORAGE_PREFIX = 'cf_cache_';
        Object.keys(localStorage).forEach(key => {
          if (
            (key.startsWith(STORAGE_PREFIX) && (key.includes('league') || key.includes('match'))) ||
            key.includes('cf_instant') ||
            key.startsWith('chunk_')
          ) {
            localStorage.removeItem(key);
          }
        });
        window.dispatchEvent(new CustomEvent('match-updated', { detail: { matchId } }));
        window.dispatchEvent(new CustomEvent('match-stats-updated', {
          detail: {
            matchId,
            leagueId: match?.leagueId || getNestedLeagueId(match) || '',
            playerId: apiPlayerId
          }
        }));
        toast.success('stats update');
        setEditingPlayer(null);
        // Refresh match data
        fetchMatchData(true);
      }
    } catch {
      // silent
    } finally {
      setEditStatsSaving(false);
    }
  };

  function getTeamSkillAvg(players: User[]) {
    if (!players.length) return 0;
    let total = 0;
    let count = 0;
    players.forEach(player => {
      if (player.skills) {
        Object.values(player.skills).forEach(val => {
          if (typeof val === 'number') {
            total += val;
            count++;
          }
        });
      }
    });
    return count ? total / count : 0;
  }

  let winPercentLeft = 0;
  let winPercentRight = 0;

  if (match) {
    if (match.status === 'RESULT_PUBLISHED') {
      const homeGoals = match.homeTeamGoals ?? 0;
      const awayGoals = match.awayTeamGoals ?? 0;
      if (homeGoals > awayGoals) {
        winPercentLeft = 100;
        winPercentRight = 0;
      } else if (homeGoals < awayGoals) {
        winPercentLeft = 0;
        winPercentRight = 100;
      } else {
        winPercentLeft = 50;
        winPercentRight = 50;
      }
    } else {
      // Dynamic calculation based on player skills
      const homeSkill = getTeamSkillAvg(match.homeTeamUsers);
      const awaySkill = getTeamSkillAvg(match.awayTeamUsers);
      const totalSkill = homeSkill + awaySkill;
      if (totalSkill > 0) {
        winPercentLeft = Math.round((homeSkill / totalSkill) * 100);
        winPercentRight = 100 - winPercentLeft;
      } else {
        winPercentLeft = 50;
        winPercentRight = 50;
      }
    }
  }

  // const theme = useTheme();
  // const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
    if (!user) return;
    setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
    const action = isAvailable ? 'unavailable' : 'available';
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/matches/${matchId}/availability?action=${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.success && data.match) {
        // Update cache with new match data
        cacheManager.updateMatchesCache(data.match);

        setMatch(prev => prev && prev.id === matchId ? { ...prev, availableUsers: data.match.availableUsers } : prev);
      }
    } finally {
      setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // const router = useRouter();
  // const handleCloseAndGoBack = useCallback(() => {
  //   if (typeof window !== 'undefined') {
  //     // If there is browser history, just go back
  //     if (window.history.length > 1) {
  //       router.back();
  //       return;
  //     }
  //     // Try referrer when history stack isn't available (e.g., direct open)
  //     const ref = document.referrer;
  //     if (ref && ref.startsWith(window.location.origin)) {
  //       const path = ref.replace(window.location.origin, '') || '/';
  //       router.push(path);
  //       return;
  //     }
  //   }
  //   // Fallbacks
  //   if (match?.leagueId) {
  //     router.push(`/league/${match.leagueId}`);
  //   } else {
  //     router.push('/all-matches');
  //   }
  // }, [router, match]);

  const seasonIdForProgress = String(match?.seasonId || '').trim();
  const seasonMatches = (() => {
    if (!league?.matches || !Array.isArray(league.matches)) return [];
    if (!seasonIdForProgress) return league.matches;
    const scoped = league.matches.filter((m) => String((m as { seasonId?: string }).seasonId || '') === seasonIdForProgress);
    return scoped.length > 0 ? scoped : league.matches;
  })();

  const currentMatchNumber = (() => {
    const explicitSeasonMatchNumber =
      typeof match?.seasonMatchNumber === 'number' && Number.isFinite(match.seasonMatchNumber)
        ? match.seasonMatchNumber
        : null;
    if (explicitSeasonMatchNumber && explicitSeasonMatchNumber > 0) return explicitSeasonMatchNumber;
    if (!match || !seasonMatches.length) return 1;
    const idx = seasonMatches.findIndex((m) => String(m.id) === String(match.id));
    return idx >= 0 ? idx + 1 : 1;
  })();

  const totalMatchSlots = (() => {
    const seasonMaxFromLeague = Array.isArray(league?.seasons)
      ? league?.seasons?.find((s) => String(s?.id || '') === seasonIdForProgress)?.maxGames
      : undefined;
    const numericSeasonMax = Number(seasonMaxFromLeague);
    if (Number.isFinite(numericSeasonMax) && numericSeasonMax > 0) return numericSeasonMax;

    const numericLeagueMax = Number(league?.maxGames);
    if (Number.isFinite(numericLeagueMax) && numericLeagueMax > 0) return numericLeagueMax;

    return Math.max(seasonMatches.length, 1);
  })();

  const captainsConfirmed = Boolean(match?.homeCaptainConfirmed && match?.awayCaptainConfirmed);

  return (
    <Box
      sx={{
        p: isEmbeddedInDialog ? { xs: 0.75, sm: 2.5 } : { xs: 1, sm: 4 },
        pb: isEmbeddedInDialog ? { xs: 1.5, sm: 3 } : undefined,
        minHeight: isEmbeddedInDialog ? 'auto' : '100vh',
      }}
    >

      {/* <Button
        startIcon={<ArrowLeft />}
        onClick={() => router.push(`/league/${match?.leagueId}`)}
        sx={{
          mb: 2, color: 'white', backgroundColor: '#388e3c',
          '&:hover': { backgroundColor: '#388e3c' },
          borderRadius: 2
        }}
      >
        Back to Current Match League
      </Button> */}
      {loading ? (
        <MatchResultLoadingSkeleton mode={isEmbeddedInDialog ? 'dialog' : 'page'} />
      ) : !match ? (
        <Typography className="empty-state-message" color="error">Match not found.</Typography>
      ) : (
        <>
          {/* Match Result Label */}
          <Typography
            sx={{
              textAlign: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: { xs: 16, sm: 20, md: 36 },
              mb: 1,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Match Result
          </Typography>

          {/* Improved Match Summary Bar */}
          <MatchSummary
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
            homeTeamImg={match.homeTeamImage || '/assets/matches.png'}
            awayTeamImg={match.awayTeamImage || '/assets/matches.png'}
            homeGoals={typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0}
            awayGoals={typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0}
            leagueName={league?.name || 'League'}
            currentMatch={currentMatchNumber}
            totalMatches={totalMatchSlots}
            matchStartTime={match.start || match.date || new Date().toISOString()}
            possessionLeft={47} // TODO: Replace with actual possession if available
            possessionRight={53} // TODO: Replace with actual possession if available
            winPercentLeft={winPercentLeft}
            winPercentRight={winPercentRight}
            matchStatus={match.status}
            matchEndTime={match.end || undefined}
            leagueId={match.leagueId || getNestedLeagueId(match) || ""}
            matchId={match.id}
            captainsConfirmed={captainsConfirmed}
            isUserAvailable={!!match.availableUsers?.some(u => u?.id === user?.id)}
            availabilityLoading={availabilityLoading}
            handleToggleAvailability={handleToggleAvailability}
            embeddedInDialog={isEmbeddedInDialog}
          />
          {!showGoals && (
            <Typography align="center" sx={{ mb: 3, color: 'gray' }}>
              Match starts at: {match.start ? new Date(match.start).toLocaleString() : new Date(match.date).toLocaleString()}
            </Typography>
          )}
          {/* <Divider sx={{ mb: 3 }} /> */}

          {/* Teams View / Admin Only Edits section header */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: { xs: '100%', md: 1260 },
            mx: 'auto',
            mt: { xs: 1, sm: 1.5 },
            mb: { xs: 0.5, sm: 0.75 },
            px: { xs: 1, sm: 2 },
          }}>
            <Box
              onClick={() => setViewTeamOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setViewTeamOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            >
              <Groups sx={{ color: '#fff', fontSize: { xs: 22, sm: 26, md: 50 } }} />
              <Typography sx={{ color: '#fff', mt: 1, fontWeight: 600, fontSize: { xs: 14, sm: 16, md: 18 } }}>
                Teams View
              </Typography>
            </Box>
            {isAdmin && (
              <Box
                onClick={() => {
                  setAdminEditMode(prev => {
                    const next = !prev;
                    if (next) {
                      toast("Click on any player to add stats", {
                        id: "admin-edit-mode-hint",
                      });
                    }
                    return next;
                  });
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  // bgcolor: adminEditMode ? 'rgba(255,255,255,0.15)' : 'transparent',
                  px: 1.5,
                  py: 0.5,
                  // borderRadius: 2,
                  // border: adminEditMode ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Typography sx={{ color: '#fff', mt: 1.5, fontWeight: 500, fontSize: { xs: 12, sm: 14, md: 18 } }}>
                  Admin Only Edits
                </Typography>
                <Box
                  component="span"
                  sx={{
                    width: 30,
                    height: 30,
                    display: 'inline-block',
                    flexShrink: 0,
                    backgroundColor: '#00a77f',
                    WebkitMaskImage: `url(${EditImg.src})`,
                    maskImage: `url(${EditImg.src})`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                  }}
                  aria-label="Edit"
                />
              </Box>
            )}
          </Box>

          <Box sx={{ width: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Single Players Table: Home + Away */}
            <Box sx={{ width: "100%" }}>
              {(() => {
                // Responsive grid template: Player | Goals | Assists | Clean Sheets | MOTM Votes | DEF IMP Votes | + Mentality | xp PTS
                // Mobile: smaller columns, Desktop: comfortable spacing
                const GRID_COLS = {
                  xs: 'minmax(120px, 1fr) 55px 60px 90px 80px 85px 85px 60px', // Mobile (8 cols)
                  sm: 'minmax(160px, 1fr) 65px 70px 110px 95px 105px 105px 70px', // Tablet
                  md: 'minmax(200px, 1fr) 75px 80px 130px 110px 120px 120px 80px' // Desktop
                };
                const guestPlayers: PlayerWithTeam[] = (match?.guests ?? []).map(g => ({
                  id: `guest-${g.id}`,
                  firstName: g.firstName,
                  lastName: g.lastName,
                  shirtNumber: g.shirtNumber,
                  __team: g.team,
                  isGuest: true
                }));
                const allPlayers: PlayerWithTeam[] = [
                  ...(match?.homeTeamUsers ?? []).map(p => ({ ...p, __team: 'home' as const })),
                  ...(match?.awayTeamUsers ?? []).map(p => ({ ...p, __team: 'away' as const })),
                  ...guestPlayers
                ];

                // Always order table by highest to lowest points using match_statistics XP.
                const getStats = (player: PlayerWithTeam): Partial<MatchStatLite> => {
                  const embedded = (player.statistics?.[0] as Partial<MatchStatLite>) || {};
                  return perPlayerStats[player.id] || embedded || {};
                };

                const getPoints = (player: PlayerWithTeam): number => {
                  const s = getStats(player);
                  return typeof s.xpAwarded === 'number' ? s.xpAwarded : 0;
                };

                // Calculate DEF IMP and MENTALITY vote counts per player
                const defImpactVotes: Record<string, number> = {};
                const mentalityVotes: Record<string, number> = {};
                if (match) {
                  // Collect captain pick IDs for defensive impact and mentality
                  const defPickIds = [match.homeDefensiveImpactId, match.awayDefensiveImpactId].filter(Boolean);
                  const menPickIds = [match.homeMentalityId, match.awayMentalityId].filter(Boolean);
                  allPlayers.forEach(p => {
                    defImpactVotes[p.id] = defPickIds.filter(id => String(id) === String(p.id)).length;
                    mentalityVotes[p.id] = menPickIds.filter(id => String(id) === String(p.id)).length;
                  });
                }

                const sortedPlayers = [...allPlayers].sort((a, b) => {
                  const pb = getPoints(b);
                  const pa = getPoints(a);
                  // Descending by points; if tie, prefer higher goals, then assists
                  if (pb !== pa) return pb - pa;
                  const sb = getStats(b);
                  const sa = getStats(a);
                  const gb = typeof sb.goals === 'number' ? sb.goals : 0;
                  const ga = typeof sa.goals === 'number' ? sa.goals : 0;
                  if (gb !== ga) return gb - ga;
                  const ab = typeof sb.assists === 'number' ? sb.assists : 0;
                  const aa = typeof sa.assists === 'number' ? sa.assists : 0;
                  return ab - aa;
                });

                return (
                  <Box
                    sx={{
                      width: "100%",
                      mt: { xs: 0.5, sm: 1, md: 1.5 },
                    }}
                  >
                    {/* Fixed Header - Outside scroll container */}
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: { xs: '100%', md: 1260 },
                        mx: "auto",
                        background: '#383838',
                        borderRadius: { xs: '8px 8px 0 0', md: '12px 12px 0 0' },
                        p: { xs: 0.5, sm: 1 },
                        borderTop: '1.5px solid rgba(255,255,255,0.6)',
                        borderLeft: '1.5px solid rgba(255,255,255,0.6)',
                        borderRight: '1.5px solid rgba(255,255,255,0.6)',
                        borderBottom: 'none',
                      }}
                    >
                      {/* <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ 
                          textAlign: "center", 
                          fontSize: { xs: 14, sm: 16, md: 17 }, 
                          color: '#fff', 
                          py: { xs: 1, sm: 1.5, md: 2 }
                        }}
                      >
                        Match Result
                      </Typography> */}
                    </Box>

                    {/* Scrollable Table Container */}
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: { xs: '100%', md: 1260 },
                        mx: "auto",
                        overflowX: "auto",
                        borderTop: 'none',
                        borderLeft: '1.5px solid rgba(255,255,255,0.6)',
                        borderRight: '1.5px solid rgba(255,255,255,0.6)',
                        borderBottom: '1.5px solid rgba(255,255,255,0.6)',
                        borderRadius: { xs: '0 0 8px 8px', md: '0 0 12px 12px' },
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.3) transparent",
                        "&::-webkit-scrollbar": {
                          height: "6px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: "rgba(255,255,255,0.3)",
                          borderRadius: "3px"
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          maxHeight: isEmbeddedInDialog
                            ? { xs: 400, sm: '58vh', md: '60vh' }
                            : { xs: 400, sm: 480, md: 520 },
                          overflowY: "auto",
                          scrollbarWidth: "thin",
                          scrollbarColor: "rgba(255,255,255,0.3) transparent",
                          "&::-webkit-scrollbar": {
                            width: "6px"
                          },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "rgba(255,255,255,0.3)",
                            borderRadius: "3px"
                          },
                          background: '#383838',
                          borderRadius: { xs: '0 0 8px 8px', md: '0 0 12px 12px' },
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: 10, sm: 12, md: 15 },
                        }}
                      >
                        <Box sx={{ minWidth: { xs: 800, sm: 800, md: 900 } }}>
                          {/* Header */}
                          <Box
                            sx={{
                              background: '#2b2b2b',
                              position: 'sticky',
                              top: 0,
                              zIndex: 8,
                              borderRadius: { xs: '8px 8px 0 0', md: '12px 12px 0 0' },
                              px: { xs: 1, sm: 1.5, md: 2 },
                              py: { xs: 0.3, sm: 0.5, md: 0.75 },
                              mb: { xs: 0.5, sm: 0.75, md: 1 },
                              minHeight: { xs: 32, sm: 38, md: 44 },
                              display: 'grid',
                              gridTemplateColumns: { xs: GRID_COLS.xs, sm: GRID_COLS.sm, md: GRID_COLS.md },
                              alignItems: 'center',
                              columnGap: { xs: 2, sm: 2, md: 1.7 },
                            }}
                          >
                            <Box sx={{
                              color: 'white',
                              fontWeight: 500,
                              fontSize: { xs: 13, sm: 14, md: 17 },
                              pl: { xs: 1.5, sm: 2, md: 3 },
                              pr: { xs: 1, sm: 1.5, md: 2 },
                              textTransform: 'uppercase',
                              position: 'sticky',
                              left: 0,
                              zIndex: 3,
                              bgcolor: '#2b2b2b',
                            }}>Player</Box>
                            <Box sx={{
                              color: 'white',
                              fontWeight: '500',
                              fontSize: { xs: 12, sm: 13, md: 16 },
                              textAlign: 'center',
                              textTransform: 'uppercase'
                            }}>Goals</Box>
                            <Box sx={{
                              color: 'white',
                              fontWeight: '500',
                              fontSize: { xs: 12, sm: 13, md: 16 },
                              textAlign: 'center',
                              textTransform: 'uppercase'
                            }}>Assists</Box>
                            <Box
                              sx={{
                                color: 'white',
                                fontWeight: '500',
                                fontSize: { xs: 11, sm: 12, md: 16 },
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase'
                              }}
                              title="Clean Sheets"
                            >
                              Clean Sheets
                            </Box>
                            <Box sx={{
                              color: 'white',
                              fontWeight: '500',
                              fontSize: { xs: 11, sm: 12, md: 16 },
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              textTransform: 'uppercase'
                            }}>MOTM Votes</Box>
                            <Box sx={{
                              color: 'white',
                              fontWeight: '500',
                              fontSize: { xs: 11, sm: 12, md: 16 },
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              textTransform: 'uppercase'
                            }}>Def Imp Votes</Box>
                            <Box sx={{
                              color: 'white',
                              fontWeight: '500',
                              fontSize: { xs: 11, sm: 12, md: 16 },
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              textTransform: 'uppercase'
                            }}>+ Mentality</Box>
                            <Box sx={{
                              color: 'white',
                              fontWeight: '500',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              fontSize: { xs: 11, sm: 12, md: 16 },
                            }}>
                              <span style={{ fontWeight: '500' }}>xp </span>
                              <span style={{ fontSize: '1em', fontWeight: '500', letterSpacing: 1 }}>PTS</span>
                            </Box>
                          </Box>
                          <Box>
                            {sortedPlayers.map((player, idx) => {
                              const embedded = (player.statistics?.[0] as Partial<MatchStatLite>) || {};
                              const stats: Partial<MatchStatLite> = perPlayerStats[player.id] || embedded;
                              const isHome = player.__team === 'home';
                              const isCaptain = player.id === (isHome ? match.homeCaptainId : match.awayCaptainId);
                              const playerShirtImg = player.__team === 'away' ? RightShirtImg : ShirtImg;
                              const textColor = '#fff';
                              const fontWeight = idx === 0 ? 700 : 500;
                              return (
                                <React.Fragment key={player.id}>
                                  {adminEditMode ? (
                                    <Box
                                      onClick={() => handleOpenPlayerEdit(player)}
                                      title="Click to edit player stats"
                                      sx={{ cursor: 'pointer' }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: { xs: GRID_COLS.xs, sm: GRID_COLS.sm, md: GRID_COLS.md },
                                          alignItems: 'center',
                                          columnGap: { xs: 2, sm: 2, md: 1.7 },
                                          p: { xs: 0.3, sm: 0.5, md: 0.75 },
                                          background: idx % 2 === 0
                                            ? 'linear-gradient(90deg, rgba(229,106,22,0.22) 0%, #383838 40%)'
                                            : 'linear-gradient(90deg, rgba(229,106,22,0.16) 0%, #2b2b2b 40%)',
                                          color: textColor,
                                          fontWeight,
                                          minHeight: { xs: 32, sm: 38, md: 44 },
                                          mb: { xs: 0.5, sm: 0.75 },
                                          borderRadius: 1,
                                          border: '1px solid rgba(229,106,22,0.35)',
                                          boxShadow: '0 0 0 1px rgba(229,106,22,0.12), 0 4px 10px rgba(0,0,0,0.15)',
                                          '&:hover': {
                                            opacity: 0.95,
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 0 0 1px rgba(229,106,22,0.28), 0 8px 18px rgba(0,0,0,0.2)',
                                            transition: 'all 0.2s'
                                          }
                                        }}
                                      >
                                        <Box sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          minWidth: 0,
                                          position: 'sticky',
                                          left: 0,
                                          zIndex: 2,
                                          background: idx % 2 === 0
                                            ? 'linear-gradient(90deg, rgba(229,106,22,0.22) 0%, #383838 60%)'
                                            : 'linear-gradient(90deg, rgba(229,106,22,0.16) 0%, #2b2b2b 60%)',
                                          pr: 1.5,
                                        }}>
                                          <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mr: { xs: 0.5, sm: 1, md: 2 },
                                            minWidth: { xs: 28, sm: 36, md: 44 }
                                          }}>
                                            <Box sx={{
                                              position: 'relative',
                                              width: { xs: 28, sm: 32, md: 40 },
                                              height: { xs: 28, sm: 32, md: 40 }
                                            }}>
                                              <Image src={playerShirtImg} alt="Shirt" fill style={{ objectFit: 'contain' }} />
                                            </Box>
                                          </Box>
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: 'medium',
                                              color: 'white',
                                              fontSize: { xs: 11, sm: 12, md: 14 },
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                            }}
                                            title={formatPlayerDisplayName(player)}
                                          >
                                            {formatPlayerDisplayName(player)}{isCaptain ? ' (C)' : ''}
                                            {player.isGuest && !isGuestLastName(player.lastName) && (
                                              <Chip
                                                label="G"
                                                size="small"
                                                sx={{
                                                  ml: { xs: 0.3, sm: 0.5, md: 1 },
                                                  height: { xs: 14, sm: 16, md: 18 },
                                                  bgcolor: '#e67e22',
                                                  color: 'white',
                                                  fontSize: { xs: 8, sm: 9, md: 10 },
                                                  '& .MuiChip-label': { px: 0.5, fontWeight: 700 }
                                                }}
                                              />
                                            )}
                                          </Typography>


                                        </Box>

                                        {/* Stats cells */}
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 }
                                        }}>{stats.goals ?? 0}</Box>
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 }
                                        }}>{stats.assists ?? 0}</Box>
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 }
                                        }}>{stats.cleanSheets ?? 0}</Box>
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 }
                                        }}>{playerVotes[player.id] ?? 0}</Box>
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 }
                                        }}>{defImpactVotes[player.id] ?? 0}</Box>
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 }
                                        }}>{mentalityVotes[player.id] ?? 0}</Box>
                                        <Box sx={{
                                          textAlign: 'center',
                                          fontSize: { xs: 11, sm: 12, md: 14 },
                                          fontWeight: 700
                                        }}>{typeof stats.xpAwarded === 'number' ? stats.xpAwarded : 0}</Box>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Link href={`/player/${player.id}`} passHref>
                                      <Box
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: { xs: GRID_COLS.xs, sm: GRID_COLS.sm, md: GRID_COLS.md },
                                          alignItems: 'center',
                                          columnGap: { xs: 2, sm: 2, md: 1.7 },
                                          p: { xs: 0.3, sm: 0.5, md: 0.75 },
                                          background: idx % 2 === 0 ? '#383838' : '#2b2b2b',
                                          color: textColor,
                                          fontWeight,
                                          minHeight: { xs: 32, sm: 38, md: 44 },
                                          mb: { xs: 0.5, sm: 0.75 },
                                          borderRadius: 1,
                                          '&:hover': {
                                            opacity: 0.9,
                                            transition: 'opacity 0.2s'
                                          }
                                        }}
                                      >
                                        {/* Player cell */}
                                        <Box sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          minWidth: 0,
                                          position: 'sticky',
                                          left: 0,
                                          zIndex: 2,
                                          background: idx % 2 === 0 ? '#383838' : '#2b2b2b',
                                          pr: 1.5,
                                        }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 0.5, sm: 1, md: 2 }, minWidth: { xs: 28, sm: 36, md: 44 } }}>
                                            <Box sx={{ position: 'relative', width: { xs: 28, sm: 32, md: 40 }, height: { xs: 28, sm: 32, md: 40 } }}>
                                              <Image src={playerShirtImg} alt="Shirt" fill style={{ objectFit: 'contain' }} />
                                            </Box>
                                          </Box>
                                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'white', fontSize: { xs: 11, sm: 12, md: 14 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatPlayerDisplayName(player)}>
                                            {formatPlayerDisplayName(player)}{isCaptain ? ' (C)' : ''}
                                            {player.isGuest && !isGuestLastName(player.lastName) && <Chip label="G" size="small" sx={{ ml: { xs: 0.3, sm: 0.5, md: 1 }, height: { xs: 14, sm: 16, md: 18 }, bgcolor: '#e67e22', color: 'white', fontSize: { xs: 8, sm: 9, md: 10 }, '& .MuiChip-label': { px: 0.5, fontWeight: 700 } }} />}
                                          </Typography>

                                        </Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 } }}>{stats.goals ?? 0}</Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 } }}>{stats.assists ?? 0}</Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 } }}>{stats.cleanSheets ?? 0}</Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 } }}>{playerVotes[player.id] ?? 0}</Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 } }}>{defImpactVotes[player.id] ?? 0}</Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 } }}>{mentalityVotes[player.id] ?? 0}</Box>
                                        <Box sx={{ textAlign: 'center', fontSize: { xs: 11, sm: 12, md: 14 }, fontWeight: 700 }}>{typeof stats.xpAwarded === 'number' ? stats.xpAwarded : 0}</Box>
                                      </Box>
                                    </Link>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })()}
            </Box>
          </Box>
        </>
      )}

      <Dialog
        open={viewTeamOpen}
        onClose={() => setViewTeamOpen(false)}
        maxWidth={false}
        fullScreen={isMobile}
        PaperProps={{ sx: { bgcolor: '#2b2b2b', width: { xs: '100%', sm: '90%', md: '65%' }, maxWidth: { xs: '100%', sm: '90%', md: '65%' }, borderRadius: { xs: 0, sm: 2 } } }}
      >
        <DialogTitle sx={{
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#d1d1d1',
          position: 'relative',
          py: 0.5,
          minHeight: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
            <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: isMobile ? '1.1rem' : '1.8rem' }}>TEAMS</span>
            <Image src={FootBallIcon} alt="Football" width={24} height={24} />
            <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: isMobile ? '1.1rem' : '1.8rem' }}>MATCH {currentMatchNumber ?? '-'}</span>
          </Box>
          <IconButton
            onClick={() => setViewTeamOpen(false)}
            size="small"
            sx={{ color: 'inherit', position: 'absolute', right: 0, top: 0, bottom: 0, width: 56, borderRadius: 0, bgcolor: '#e6e6e6', '&:hover': { bgcolor: '#e6e6e6' } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TeamPreviewScreen
            leagueId={String(match?.leagueId || league?.id || '') || undefined}
            matchId={match?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Admin Player Stats Edit Dialog */}
      {editingPlayer && (
        <Dialog
          open={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
              color: '#fff',
              borderRadius: 3,
              border: '1px solid #fff',
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography fontWeight={700} fontSize={{ xs: 16, sm: 18 }}>
              Edit Stats — {formatPlayerDisplayName(editingPlayer)}
            </Typography>
            <IconButton onClick={() => setEditingPlayer(null)} size="small" sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {editStatsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#fff' }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                {/* Goals Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src={GoalsIcon.src} alt="Goals" style={{ width: 48, height: 48 }} />
                  <TextField
                    type="text"
                    value={editStats.goals}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') { setEditStats(prev => ({ ...prev, goals: 0 })); return; }
                      if (!/^\d+$/.test(val)) return;
                      const numVal = parseInt(val, 10);
                      if (!isNaN(numVal)) {
                        const teamGoalsSafe = (match?.homeTeamUsers?.some(p => p.id === editingPlayer?.id)
                          ? (match?.homeTeamGoals ?? 20) : (match?.awayTeamGoals ?? 20)) || 20;
                        setEditStats(prev => ({ ...prev, goals: Math.max(0, Math.min(teamGoalsSafe, numVal)) }));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ style: { textAlign: 'center' } }}
                    sx={{
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: '#d9d9d9' },
                        '&:hover fieldset': { borderColor: '#d9d9d9' },
                        '&.Mui-focused fieldset': { borderColor: '#00C48C' },
                      },
                      '& .MuiInputBase-input': { fontSize: '1.25rem', fontWeight: 600, py: 0.75 },
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>Goals</Typography>
                </Box>

                {/* Assists Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src={AssistIcon.src} alt="Assists" style={{ width: 48, height: 48 }} />
                  <TextField
                    type="text"
                    value={editStats.assists}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') { setEditStats(prev => ({ ...prev, assists: 0 })); return; }
                      if (!/^\d+$/.test(val)) return;
                      const numVal = parseInt(val, 10);
                      if (!isNaN(numVal)) {
                        const teamGoalsSafe = (match?.homeTeamUsers?.some(p => p.id === editingPlayer?.id)
                          ? (match?.homeTeamGoals ?? 20) : (match?.awayTeamGoals ?? 20)) || 20;
                        setEditStats(prev => ({ ...prev, assists: Math.max(0, Math.min(teamGoalsSafe, numVal)) }));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ style: { textAlign: 'center' } }}
                    sx={{
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: '#d9d9d9' },
                        '&:hover fieldset': { borderColor: '#d9d9d9' },
                        '&.Mui-focused fieldset': { borderColor: '#00C48C' },
                      },
                      '& .MuiInputBase-input': { fontSize: '1.25rem', fontWeight: 600, py: 0.75 },
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>Assists</Typography>
                </Box>

                {/* Clean Sheet Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src={CleanSheetIcon.src} alt="Clean Sheets" style={{ width: 48, height: 48 }} />
                  <TextField
                    type="text"
                    value={editStats.cleanSheets}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') { setEditStats(prev => ({ ...prev, cleanSheets: 0 })); return; }
                      if (!/^\d+$/.test(val)) return;
                      const numVal = parseInt(val, 10);
                      if (!isNaN(numVal)) {
                        setEditStats(prev => ({ ...prev, cleanSheets: Math.max(0, Math.min(1, numVal)) }));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ style: { textAlign: 'center' } }}
                    sx={{
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: '#d9d9d9' },
                        '&:hover fieldset': { borderColor: '#d9d9d9' },
                        '&.Mui-focused fieldset': { borderColor: '#00C48C' },
                      },
                      '& .MuiInputBase-input': { fontSize: '1.25rem', fontWeight: 600, py: 0.75 },
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>Clean Sheet</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setEditingPlayer(null)}
              sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePlayerStats}
              disabled={editStatsLoading || editStatsSaving}
              sx={{
                bgcolor: '#27ab83',
                '&:hover': { bgcolor: '#27ab83' },
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
              }}
            >
              {editStatsSaving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Stats'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
