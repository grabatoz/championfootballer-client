'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, useMediaQuery, useTheme } from '@mui/material';
import PageHeader from '@/Components/PageHeader';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image, { StaticImageData } from 'next/image';
import { useAuth } from '@/lib/hooks';
import CloseButton from '@/Components/CloseButton';
import RewardsLoadingSkeleton from '@/Components/loading/RewardsLoadingSkeleton';

// Badge images
import HatTrickBadge from '@/Components/images/brown.png';
import AssistMaestroBadge from '@/Components/images/brown.png';
import StarPerformerBadge from '@/Components/images/brown.png';
import GoalMachineBadge from '@/Components/images/brown.png';
import IronWallBadge from '@/Components/images/brown.png';
import UnbeatenBadge from '@/Components/images/brown.png';
import CaptainsTriumphsBadge from '@/Components/images/brown.png';
import TripleImpactBadge from '@/Components/images/brown.png';

// Decorative images
import LeftStar from '@/Components/images/leftstart.png';
import RightStar from '@/Components/images/rightstar.png';
import XPStarMilestoneCard from '@/Components/XPStarMilestoneCard';

// --- Interfaces ---
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  xp?: number;
}

interface Match {
  id: string;
  homeTeamGoals: number;
  awayTeamGoals: number;
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  manOfTheMatchVotes: Record<string, string | number>;
  playerStats: Record<string, { goals?: number; assists?: number }>;
  status: 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING';
  date?: string | Date;
  start?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  active?: boolean;
  end?: string | Date;
  homeCaptainId?: string | null;
  awayCaptainId?: string | null;
  homeDefensiveImpactId?: string | null;
  awayDefensiveImpactId?: string | null;
  homeMentalityId?: string | null;
  awayMentalityId?: string | null;
}

interface League {
  id: string;
  name: string;
  members: User[];
  matches: Match[];
  maxGames: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PlayerStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  motmVotes: number;
  teamGoalsConceded: number;
}

// Server achievements response types
interface ServerBadge {
  id: string;
  title?: string;
  count?: number;
  xp?: number;
  unlocked?: boolean;
  progressText?: string;
}

interface ServerAchievementsResponse {
  success: boolean;
  userId?: string | number;
  totalXP?: number;
  badges?: ServerBadge[];
}

// --- Badge model ---
type Badge = {
  id: string;
  title: string;
  description: string;
  image: StaticImageData;
  color: string;
  count: number;        // times earned
  xp: number;           // XP per earn (or level bucket for Rising XP)
  unlocked: boolean;
  progressText?: string;
};

// --- User match summary type ---
type UserMatchSummary = {
  goals: number;
  assists: number;
  conceded: number;
  result: 'W' | 'D' | 'L';
  motmVotes: number;
  isCaptainWin: boolean;
  hasXFactorPick: boolean;
  wonMotmAward: boolean;
  cleanSheetTeam: boolean;
};

// --- Constants ---
const CARD_DIMENSIONS = {
  minHeight: { xs: 180, sm: 200, md: 240 },
  maxWidth: { xs: 160, sm: 200, md: 240 },
  image: { xs: 70, sm: 85, md: 115 },
} as const;

const BLUE_HEX = '#3B82F6';
const BLUE_FILTER = 'invert(30%) sepia(98%) saturate(2000%) hue-rotate(201deg) brightness(92%) contrast(101%)';
const medalGold = '#D4AF37';
const medalMuted = '#CBD5E1';

// --- Helper functions ---
const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

const toNum = (v: number | string | undefined): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const normalizeId = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const comparableId = (value: unknown): string => {
  const id = normalizeId(value);
  return id.startsWith('guest-') ? id.slice(6) : id;
};

const sameComparableId = (a: unknown, b: unknown): boolean => {
  const left = comparableId(a);
  const right = comparableId(b);
  return left !== '' && right !== '' && left === right;
};

const isResultPublished = (match: Match): boolean =>
  String(match.status || '').toUpperCase() === 'RESULT_PUBLISHED';

const toTimeMs = (value: unknown): number => {
  if (!value) return NaN;
  const ms = new Date(value as string | number | Date).getTime();
  return Number.isFinite(ms) ? ms : NaN;
};

const getMatchTimeMs = (match: Match): number => {
  const candidates = [match.end, match.date, match.start, match.updatedAt, match.createdAt];
  for (const candidate of candidates) {
    const ms = toTimeMs(candidate);
    if (Number.isFinite(ms)) return ms;
  }
  return 0;
};

const sortMatchesChronologically = (matches: Match[]): Match[] =>
  [...matches].sort((a, b) => getMatchTimeMs(a) - getMatchTimeMs(b));

const isUserInMatch = (userId: string, match: Match): { isHome: boolean; isAway: boolean } => {
  const isHome = (match.homeTeamUsers ?? []).some((u) => sameComparableId(u.id, userId));
  const isAway = (match.awayTeamUsers ?? []).some((u) => sameComparableId(u.id, userId));
  return { isHome, isAway };
};

const getUserPlayerStatLine = (userId: string, playerStats: Match['playerStats']): { goals: number; assists: number } => {
  const entry = Object.entries(playerStats ?? {}).find(([playerId]) => sameComparableId(playerId, userId));
  const stat = entry?.[1] ?? {};
  return {
    goals: Number(stat.goals ?? 0) || 0,
    assists: Number(stat.assists ?? 0) || 0,
  };
};

const getMotmVoteCounts = (votes: Match['manOfTheMatchVotes']): Record<string, number> => {
  if (!votes || typeof votes !== 'object') return {};
  const entries = Object.entries(votes);
  if (entries.length === 0) return {};

  const counts: Record<string, number> = {};
  const valuesAreCounts = entries.every(([, value]) => typeof value === 'number');

  if (valuesAreCounts) {
    entries.forEach(([playerId, count]) => {
      const key = comparableId(playerId);
      const value = Number(count) || 0;
      if (!key || value <= 0) return;
      counts[key] = (counts[key] || 0) + value;
    });
    return counts;
  }

  entries.forEach(([, votedFor]) => {
    const key = comparableId(votedFor);
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

const getMotmVotesForUser = (votes: Match['manOfTheMatchVotes'], userId: string): number => {
  const counts = getMotmVoteCounts(votes);
  const key = comparableId(userId);
  return key ? counts[key] || 0 : 0;
};

const getTopMotmWinnerId = (votes: Match['manOfTheMatchVotes']): string => {
  const counts = getMotmVoteCounts(votes);
  let topPlayerId = '';
  let maxVotes = 0;
  Object.entries(counts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topPlayerId = playerId;
    }
  });
  return maxVotes > 0 ? topPlayerId : '';
};

// --- Player stats calculation ---
const calculatePlayerStats = (league: League): Record<string, PlayerStats> => {
  const stats: Record<string, PlayerStats> = {};
  sortMatchesChronologically(league.matches ?? []).forEach(match => {
    if (!isResultPublished(match)) return;

    const homePlayers = (match.homeTeamUsers ?? []).map(u => u.id);
    const awayPlayers = (match.awayTeamUsers ?? []).map(u => u.id);
    [...homePlayers, ...awayPlayers].forEach(pId => {
      if (!stats[pId]) {
        stats[pId] = { played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, motmVotes: 0, teamGoalsConceded: 0 };
      }
      stats[pId].played++;
      const ps = match.playerStats?.[pId];
      if (ps) {
        stats[pId].goals += ps.goals || 0;
        stats[pId].assists += ps.assists || 0;
      }
      const votes = getMotmVotesForUser(match.manOfTheMatchVotes, pId);
      stats[pId].motmVotes += votes;
    });

    const homeWon = match.homeTeamGoals > match.awayTeamGoals;
    const isDraw = match.homeTeamGoals === match.awayTeamGoals;
    homePlayers.forEach(pId => {
      if (!stats[pId]) return;
      if (homeWon) stats[pId].wins++;
      else if (isDraw) stats[pId].draws++;
      else stats[pId].losses++;
      stats[pId].teamGoalsConceded += match.awayTeamGoals;
    });
    awayPlayers.forEach(pId => {
      if (!stats[pId]) return;
      if (!homeWon && !isDraw) stats[pId].wins++;
      else if (isDraw) stats[pId].draws++;
      else stats[pId].losses++;
      stats[pId].teamGoalsConceded += match.homeTeamGoals;
    });
  });
  return stats;
};

const summarizeUserMatchesByLeague = (userId: string, leagues: League[]): Record<string, UserMatchSummary[]> => {
  const map: Record<string, UserMatchSummary[]> = {};
  leagues.forEach(league => {
    const arr: UserMatchSummary[] = [];
    sortMatchesChronologically(league.matches ?? []).forEach(m => {
      if (!isResultPublished(m)) return;
      const { isHome, isAway } = isUserInMatch(userId, m);
      if (!isHome && !isAway) return;
      const ps = getUserPlayerStatLine(userId, m.playerStats);
      const teamGoals = isHome ? m.homeTeamGoals : m.awayTeamGoals;
      const oppGoals = isHome ? m.awayTeamGoals : m.homeTeamGoals;
      const result: 'W' | 'D' | 'L' = teamGoals > oppGoals ? 'W' : teamGoals === oppGoals ? 'D' : 'L';
      const motmVotes = getMotmVotesForUser(m.manOfTheMatchVotes, userId);
      const isHomeCaptain = sameComparableId(m.homeCaptainId, userId);
      const isAwayCaptain = sameComparableId(m.awayCaptainId, userId);
      const isCaptainWin = (isHomeCaptain && result === 'W') || (isAwayCaptain && result === 'W');
      const hasDefensiveImpactPick =
        sameComparableId(m.homeDefensiveImpactId, userId) || sameComparableId(m.awayDefensiveImpactId, userId);
      const hasMentalityPick =
        sameComparableId(m.homeMentalityId, userId) || sameComparableId(m.awayMentalityId, userId);
      const motmWinnerId = getTopMotmWinnerId(m.manOfTheMatchVotes);
      const wonMotmAward = sameComparableId(motmWinnerId, userId);
      const cleanSheetTeam = oppGoals === 0;

      arr.push({
        goals: ps.goals || 0,
        assists: ps.assists || 0,
        conceded: oppGoals,
        result,
        motmVotes,
        isCaptainWin,
        hasXFactorPick: hasDefensiveImpactPick || hasMentalityPick,
        wonMotmAward,
        cleanSheetTeam,
      });
    });
    if (arr.length) map[league.id] = arr;
  });
  return map;
};

const longestStreak = (arr: UserMatchSummary[], predicate: (m: UserMatchSummary) => boolean): number => {
  let best = 0, cur = 0;
  for (const m of arr) {
    if (predicate(m)) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
};

const countStreakCompletions = (
  arr: UserMatchSummary[],
  predicate: (m: UserMatchSummary) => boolean,
  target: number
): number => {
  if (target <= 0) return 0;
  let streak = 0;
  let awards = 0;
  for (const m of arr) {
    if (predicate(m)) {
      streak += 1;
      if (streak === target) {
        awards += 1;
        streak = 0;
      }
    } else {
      streak = 0;
    }
  }
  return awards;
};

// --- XP computation ---
const computeXPFromStats = (s?: PlayerStats): number => {
  if (!s) return 0;
  const base = s.played * 10;
  const results = s.wins * 50 + s.draws * 20;
  const contrib = s.goals * 100 + s.assists * 70 + s.motmVotes * 120;
  return base + results + contrib;
};

// --- Badge computation ---
const computeBadges = (user: User, leagues: League[], backendTotalXP?: number): Badge[] => {
  const byLeague = summarizeUserMatchesByLeague(user.id, leagues);
  let goalRushCount = 0;
  let goalRushBest = 0;
  let pureMagicCount = 0;
  let pureMagicBest = 0;
  let tripleTreatCount = 0;
  let tripleTreatBest = 0;
  let leaderOfLegendsCount = 0;
  let leaderOfLegendsBest = 0;
  let xFactorCount = 0;
  let xFactorBest = 0;
  let spotlightStarCount = 0;
  let spotlightStarBest = 0;
  let findersKeepersCount = 0;
  let findersKeepersBest = 0;
  let winStreakXCount = 0;
  let winStreakXBest = 0;

  Object.values(byLeague).forEach((arr) => {
    goalRushBest = Math.max(goalRushBest, longestStreak(arr, (m) => m.goals > 0));
    goalRushCount += countStreakCompletions(arr, (m) => m.goals > 0, 5);

    pureMagicBest = Math.max(pureMagicBest, longestStreak(arr, (m) => m.assists > 0));
    pureMagicCount += countStreakCompletions(arr, (m) => m.assists > 0, 5);

    tripleTreatBest = Math.max(tripleTreatBest, longestStreak(arr, (m) => m.goals >= 3));
    tripleTreatCount += countStreakCompletions(arr, (m) => m.goals >= 3, 3);

    const captainWinsInLeague = arr.filter((m) => m.isCaptainWin).length;
    leaderOfLegendsBest = Math.max(leaderOfLegendsBest, captainWinsInLeague);
    leaderOfLegendsCount += Math.floor(captainWinsInLeague / 3);

    const xFactorMatchesInLeague = arr.filter((m) => m.hasXFactorPick).length;
    xFactorBest = Math.max(xFactorBest, xFactorMatchesInLeague);
    xFactorCount += Math.floor(xFactorMatchesInLeague / 5);

    const motmAwardsInLeague = arr.filter((m) => m.wonMotmAward).length;
    spotlightStarBest = Math.max(spotlightStarBest, motmAwardsInLeague);
    spotlightStarCount += Math.floor(motmAwardsInLeague / 3);

    const cleanSheetsInLeague = arr.filter((m) => m.cleanSheetTeam).length;
    findersKeepersBest = Math.max(findersKeepersBest, cleanSheetsInLeague);
    findersKeepersCount += Math.floor(cleanSheetsInLeague / 3);

    winStreakXBest = Math.max(winStreakXBest, longestStreak(arr, (m) => m.result === 'W'));
    winStreakXCount += countStreakCompletions(arr, (m) => m.result === 'W', 10);
  });

  let ironWillCount = 0;
  let ironWillBestPlayed = 0;
  let ironWillBestTotal = 0;
  let ironWillBestPercent = 0;
  leagues.forEach((league) => {
    const completedMatches = sortMatchesChronologically((league.matches ?? []).filter(isResultPublished));
    const totalMatches = completedMatches.length;
    if (!totalMatches) return;
    const playedMatches = completedMatches.filter((m) => {
      const { isHome, isAway } = isUserInMatch(user.id, m);
      return isHome || isAway;
    }).length;
    const playedPercent = playedMatches / totalMatches;
    if (playedPercent >= 0.9) {
      ironWillCount += 1;
    }
    if (
      playedPercent > ironWillBestPercent ||
      (playedPercent === ironWillBestPercent && totalMatches > ironWillBestTotal)
    ) {
      ironWillBestPercent = playedPercent;
      ironWillBestPlayed = playedMatches;
      ironWillBestTotal = totalMatches;
    }
  });

  const badges: Badge[] = [
    {
      id: 'scoring_10_consecutive',
      title: 'Goal Rush',
      description: 'Scoring in 5 consecutive matches in a league',
      image: GoalMachineBadge,
      color: medalGold,
      count: goalRushCount,
      xp: 100,
      unlocked: goalRushCount > 0,
      progressText: `Best scoring streak in a league: ${goalRushBest}/5`,
    },
    {
      id: 'assist_10_consecutive',
      title: 'Pure Magic',
      description: 'Assist in 5 consecutive matches in a league',
      image: AssistMaestroBadge,
      color: medalGold,
      count: pureMagicCount,
      xp: 100,
      unlocked: pureMagicCount > 0,
      progressText: `Best assist streak in a league: ${pureMagicBest}/5`,
    },
    {
      id: 'hat_trick_3_matches',
      title: 'Triple Treat',
      description: 'Score a hat-trick in 3 consecutive matches in a league',
      image: HatTrickBadge,
      color: medalGold,
      count: tripleTreatCount,
      xp: 150,
      unlocked: tripleTreatCount > 0,
      progressText: `Best hat-trick streak in a league: ${tripleTreatBest}/3`,
    },
    {
      id: 'captain_5_wins',
      title: 'Leader of Legends',
      description: 'Winning as a captain in 3 matches in a league',
      image: CaptainsTriumphsBadge,
      color: medalGold,
      count: leaderOfLegendsCount,
      xp: 200,
      unlocked: leaderOfLegendsCount > 0,
      progressText: `Most captain wins in one league: ${leaderOfLegendsBest}/3`,
    },
    {
      id: 'captain_performance_3',
      title: 'The X-Factor',
      description: 'Being voted +Mentality player and/or Defensive Impact 5 matches in a league',
      image: TripleImpactBadge,
      color: medalGold,
      count: xFactorCount,
      xp: 200,
      unlocked: xFactorCount > 0,
      progressText: `Most qualifying matches in one league: ${xFactorBest}/5`,
    },
    {
      id: 'motm_4_consecutive',
      title: 'Spotlight Star',
      description: 'Winning Man of the Match award 3 times (not votes) in a league',
      image: StarPerformerBadge,
      color: medalGold,
      count: spotlightStarCount,
      xp: 250,
      unlocked: spotlightStarCount > 0,
      progressText: `Most MOTM awards in one league: ${spotlightStarBest}/3`,
    },
    {
      id: 'clean_sheet_5_wins',
      title: 'Finders Keepers',
      description: 'Keeping 3 clean sheets as a team in a league',
      image: IronWallBadge,
      color: medalGold,
      count: findersKeepersCount,
      xp: 300,
      unlocked: findersKeepersCount > 0,
      progressText: `Most clean sheets in one league: ${findersKeepersBest}/3`,
    },
    {
      id: 'top_spot_10_matches',
      title: 'Iron Will',
      description: 'Playing 90% of matches in a league',
      image: IronWallBadge,
      color: medalGold,
      count: ironWillCount,
      xp: 400,
      unlocked: ironWillCount > 0,
      progressText: ironWillBestTotal > 0
        ? `Best participation in a league: ${ironWillBestPlayed}/${ironWillBestTotal} (${Math.round(ironWillBestPercent * 100)}%)`
        : 'No completed league matches yet',
    },
    {
      id: 'consecutive_10_victories',
      title: 'Win Streak X',
      description: 'Winning in 10 consecutive matches in a league',
      image: UnbeatenBadge,
      color: medalGold,
      count: winStreakXCount,
      xp: 500,
      unlocked: winStreakXCount > 0,
      progressText: `Best win streak in a league: ${winStreakXBest}/10`,
    },
  ];

  return badges;
};

// Badge metadata mapping
const BADGE_META: Record<string, { title: string; description: string; image: StaticImageData; color: string }> = {
  hat_trick_3_matches: {
    title: 'Triple Treat',
    description: 'Score a hat-trick in 3 consecutive matches in a league',
    image: HatTrickBadge,
    color: medalGold,
  },
  captain_5_wins: {
    title: 'Leader of Legends',
    description: 'Winning as a captain in 3 matches in a league',
    image: CaptainsTriumphsBadge,
    color: medalGold,
  },
  assist_10_consecutive: {
    title: 'Pure Magic',
    description: 'Assist in 5 consecutive matches in a league',
    image: AssistMaestroBadge,
    color: medalGold,
  },
  scoring_10_consecutive: {
    title: 'Goal Rush',
    description: 'Scoring in 5 consecutive matches in a league',
    image: GoalMachineBadge,
    color: medalGold,
  },
  captain_performance_3: {
    title: 'The X-Factor',
    description: 'Being voted +Mentality player and/or Defensive Impact 5 matches in a league',
    image: TripleImpactBadge,
    color: medalGold,
  },
  motm_4_consecutive: {
    title: 'Spotlight Star',
    description: 'Winning Man of the Match award 3 times (not votes) in a league',
    image: StarPerformerBadge,
    color: medalGold,
  },
  clean_sheet_5_wins: {
    title: 'Finders Keepers',
    description: 'Keeping 3 clean sheets as a team in a league',
    image: IronWallBadge,
    color: medalGold,
  },
  top_spot_10_matches: {
    title: 'Iron Will',
    description: 'Playing 90% of matches in a league',
    image: IronWallBadge,
    color: medalGold,
  },
  consecutive_10_victories: {
    title: 'Win Streak X',
    description: 'Winning in 10 consecutive matches in a league',
    image: UnbeatenBadge,
    color: medalGold,
  },
};

const mapServerBadgeToUI = (b: ServerBadge): Badge => {
  const meta = BADGE_META[b.id] ?? {
    title: b.title ?? b.id,
    description: b.title ?? b.id,
    image: HatTrickBadge,
    color: medalGold,
  };
  return {
    id: b.id,
    title: b.title ?? meta.title,
    description: meta.description,
    image: meta.image,
    color: meta.color,
    count: Number(b.count ?? 0),
    xp: Number(b.xp ?? 0),
    unlocked: Boolean(b.unlocked),
    progressText: b.progressText,
  };
};

const mergeBadges = (client: Badge[], server: Badge[] | null | undefined): Badge[] => {
  if (!Array.isArray(server) || server.length === 0) return client;
  const serverById = new Map(server.map((b) => [b.id, b] as const));
  return client.map(cb => {
    const sb = serverById.get(cb.id);
    if (!sb) return cb;
    return {
      ...cb,
      count: Number.isFinite(Number(sb.count)) ? Number(sb.count) : cb.count,
      xp: Number.isFinite(Number(sb.xp)) && Number(sb.xp) > 0 ? Number(sb.xp) : cb.xp,
      unlocked: typeof sb.unlocked === 'boolean' ? sb.unlocked : cb.unlocked,
      progressText: sb.progressText ?? cb.progressText,
    };
  });
};

// --- Badge Card Component ---
const BadgeCard = ({ id, title, description, image, color, count, unlocked, progressText, xp, onOpen }: Badge & { onOpen?: () => void }) => {
  const totalXPEarned = count * xp;

     
  
  return (
    <Paper
      elevation={4}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: CARD_DIMENSIONS.minHeight,
        maxWidth: CARD_DIMENSIONS.maxWidth,
        margin: '0 auto',
        textAlign: 'center',
        borderRadius: '6px',
        border: `3px solid ${unlocked ? '#fff' : '#999'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        px: { xs: 1, sm: 1.5, md: 2},
        py: { xs: 1.5, sm: 2, md: 2 },
        position: 'relative',
        background: unlocked 
          ? 'linear-gradient(360deg, #00A77F -0.04%, #004131 98.75%)' 
          : '#747474',
        cursor: onOpen ? 'pointer' : 'default',
      }}
      onClick={onOpen}
      role="button"
    >
      {/* Title at top */}
      <Typography
        variant="h6"
        sx={{
          color: unlocked ? '#fff' : '#999',
          fontWeight: 'bold',
          fontSize: { xs: '0.95rem', sm: '1.05rem' , md : '1.10rem' },
          textAlign: 'center',
          fontFamily: 'var(--font-woodford-bourne-pro)',
          fontStyle: 'semibold',
          fontWidth: 600, 
          // mb: 1,
        }}
      >
        {title}
      </Typography>

      {/* Medal/Badge Image in center */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            height: CARD_DIMENSIONS.image,
            width: '100%',
            gap: 0,
            mt: -1,
          }}
        >
          {/* Left Star - Only show when unlocked */}
          {unlocked && (
            <Image
              src={LeftStar}
              alt="Left Star"
              width={25}
              height={25}
              style={{
                objectFit: 'contain',
                filter: 'none',
                marginTop: '23px',
                marginRight: '-10px',
              }}
            />
          )}
          
          {/* Main Badge */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: CARD_DIMENSIONS.image,
              width: CARD_DIMENSIONS.image,
            }}
          >
            <Image
              src={image}
              alt={title}
              height={CARD_DIMENSIONS.image.md}
              width={CARD_DIMENSIONS.image.md}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                filter: unlocked ? 'none' : 'grayscale(1)',
                marginTop: 17
              }}
            />
            {/* XP value on medal */}
            <Box
              sx={{
                position: 'absolute',
                bottom: {xs:-3.5, sm:-3.5 , md:8},
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'transparent',
                color: unlocked ? '#B41E1E' : '#747474',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: {xs:'0.6rem',sm:'0.8rem',md:'0.8rem'},
                fontWeight: 700,
              }}
            >
              {xp}
            </Box>
          </Box>
          
          {/* Right Star - Only show when unlocked */}
          {unlocked && (
            <Image
              src={RightStar}
              alt="Right Star"
              width={25}
              height={25}
              style={{
                objectFit: 'contain',
                filter: 'none',
                marginTop: '23px',
                marginLeft: '-10px',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Bottom: XP Earned or UNLOCK */}
      <Box
        sx={{
          // backgroundColor: unlocked ? '#0f766e' : '#6b7280',
          borderTop: '1px solid #fff',
          color: unlocked ? '#fbbf24' : '#d1d5db',
          fontFamily: 'var(--font-woodford-bourne-pro)',
          fontWeight: 700,
          fontStyle: 'normal',
          fontSize: { xs: '0.9rem', sm: '1.1rem' },
          letterSpacing: '0%',
          textAlign: 'center',
          py: { xs: 1, sm: 1.2 },
          mt: 2.5,
          // width: '100%',
          borderRadius: '0 0 12px 12px',
          mx: { xs: -1, sm: -1.5, md: -2 },
          mb: { xs: -1.5, sm: -2, md: -2 },
          // width: { xs: 'calc(100% + 16px)', sm: 'calc(100% + 24px)', md: 'calc(100% + 32px)' },
          // display: 'flex',
          // alignItems: 'center',
          // justifyContent: 'center',
        }}
      >
        {unlocked ? `${formatNumber(totalXPEarned)} XP Earned` : 'UNLOCK'}
      </Box>
    </Paper>
  );

};

// --- Main Page Component ---
export default function RewardsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [backendTotalXP, setBackendTotalXP] = useState<number | undefined>(undefined);
  const [xp, setXp] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const [serverBadges, setServerBadges] = useState<Badge[] | null>(null);
 const theme = useTheme();
      const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Badge detail modal state
  const [openBadgeDlg, setOpenBadgeDlg] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const openBadgeDetail = (b: Badge) => { setSelectedBadge(b); setOpenBadgeDlg(true); };
  const closeBadgeDetail = () => { setOpenBadgeDlg(false); setSelectedBadge(null); };

  // Fetch leagues data
  useEffect(() => {
    const fetchLeagues = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues?_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.success && Array.isArray(data.leagues)) {
          setLeagues(data.leagues);
          setError(null);
        } else {
          console.error('[Rewards] Failed to load leagues', { status: res.status, data });
          setLeagues([]);
          setError(data?.message || 'Failed to load leagues.');
        }
      } catch (e) {
        console.error('[Rewards] fetchLeagues error', e);
        setLeagues([]);
        setError('An error occurred while fetching leagues.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeagues();
  }, [token]);

  // Persist and fetch achievements
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // Persist achievements
        try {
          const awardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/achievements/award?_=${Date.now()}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const awardJson = await awardRes.json().catch(() => ({}));
          if (awardRes.ok && awardJson?.success && Number.isFinite(Number(awardJson.totalXP))) {
            setBackendTotalXP(Number(awardJson.totalXP));
          }
        } catch {}

        // Fetch achievements
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/achievements?_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: ServerAchievementsResponse = await res.json();
        if (res.ok && data?.success) {
          if (typeof data.totalXP === 'number' && Number.isFinite(data.totalXP)) {
            setBackendTotalXP(data.totalXP);
          }
          const mapped = Array.isArray(data.badges) ? data.badges.map(mapServerBadgeToUI) : [];
          setServerBadges(mapped);
        }
      } catch (e) {
        console.error('[Rewards] achievements fetch error', e);
      }
    })();
  }, [token]);

  // Compute badges
  const clientBadges: Badge[] = user ? computeBadges(user, leagues, backendTotalXP) : [];
  const myBadges: Badge[] = user ? mergeBadges(clientBadges, serverBadges) : [];
  const myProfileXP = useMemo(() => {
    const risingXP = myBadges.find((b) => b.id === 'rising_xp')?.xp;
    const resolved =
      (typeof risingXP === 'number' ? risingXP : undefined) ??
      (typeof user?.xp === 'number' ? user.xp : undefined) ??
      (typeof backendTotalXP === 'number' ? backendTotalXP : undefined) ??
      0;
    return Number.isFinite(Number(resolved)) ? Number(resolved) : 0;
  }, [myBadges, user?.xp, backendTotalXP]);

  // Direct player XP from player profile endpoint (fallback to computed/profile XP)
  useEffect(() => {
    const fallbackXP = Number.isFinite(Number(myProfileXP)) ? Number(myProfileXP) : 0;

    if (!user?.id) {
      setXp(fallbackXP);
      return;
    }

    let cancelled = false;
    setXp(fallbackXP);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${encodeURIComponent(String(user.id))}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch player profile XP');
        const json = (await res.json()) as Record<string, unknown>;
        const playerObj = (json.player || json.data || {}) as Record<string, unknown>;
        const raw =
          playerObj.xp ??
          playerObj.totalXP ??
          playerObj.totalXp ??
          json.xp ??
          json.totalXP ??
          fallbackXP;
        const parsed = Number(raw);
        if (!cancelled) setXp(Number.isFinite(parsed) ? parsed : fallbackXP);
      })
      .catch(() => {
        if (!cancelled) setXp(fallbackXP);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, token, myProfileXP]);
  
  // Calculate total XP from all rewards
  const totalRewardsXP = myBadges.reduce((sum, badge) => sum + (badge.count * badge.xp), 0);

  if (loading) {
    return <RewardsLoadingSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '160vh', backgroundColor: '#0E0E0E', overflowX: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <PageHeader
          title="Rewards"
          fullBleed={false}
          sx={{ mb: { xs: 2, md: 3 }, mx: 0 }}
          titleRowSx={{ gap: { xs: 1.25, md: 1.75 } }}
          titleLeft={(
            <Box sx={{ mt: { xs: -3, md: -6 }, display: 'flex', alignItems: 'center' }}>
              <XPStarMilestoneCard height={isMobile ? 28 : 35} width={isMobile ? 28 : 35} xp={xp} colorOverride="#ffc000" />
            </Box>
          )}
          titleRight={(
            <Box sx={{ mt: { xs: -3, md: -6 }, display: 'flex', alignItems: 'center' }}>
              <XPStarMilestoneCard height={isMobile ? 28 : 35} width={isMobile ? 28 : 35} xp={xp} colorOverride="#ffc000" />
            </Box>
          )}
          titleSx={{
            // Adjust this padding to move the divider line up/down
            pb: { xs: 4, md: 8 }
          }}
          dividerSx={{
            width: '100vw',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, md: 5, lg: 11.2 }, pb: 4, mt: -0.5 }}>
        {/* <Typography
          sx={{
            mb: 2,
            color: '#d1d5db',
            textAlign: 'center',
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            fontFamily: 'var(--font-woodford-bourne-pro)',
          }}
        >
          Reward points are added to your XP profile and XP status only. They do not count toward league table points.
        </Typography> */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: { xs: 1, sm: 1.5, md: 1.2 }, rowGap: { xs: 2, sm: 3, md: 3 }, justifyContent: 'center', alignItems: 'stretch' }}>
        {myBadges.length > 0 ? myBadges.map(b => (
          <Box key={b.id} sx={{ height: '100%', width: { xs: 'calc(50% - 8px)', sm: 'calc(33.33% - 12px)', md: 'calc(20% - 8px)', lg: 'calc(20% - 8px)' } }}>
            <BadgeCard {...b} onOpen={() => openBadgeDetail(b)} />
          </Box>
        )) : (
          <Typography sx={{ mt: 4, gridColumn: '1 / -1', textAlign: 'center' }}>
            No badge progress yet.
          </Typography>
        )}
      </Box>

      {/* Badge detail modal */}
      <Dialog 
        open={openBadgeDlg} 
        onClose={closeBadgeDetail} 
        fullWidth 
        maxWidth="sm" 
        PaperProps={{ 
          sx: { 
            borderRadius: 2, 
            background: '#2b2b2b',
            border: '2px solid #444',
          } 
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          display: 'flex', 
          alignItems: 'center',
          color: '#fff',
          fontFamily: 'var(--font-woodford-bourne-pro)',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          borderBottom: '1px solid #444',
          pb: 2,
        }}>
          {selectedBadge?.title}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={closeBadgeDetail} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedBadge && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ 
                position: 'relative', 
                width: 120, 
                height: 120, 
                justifySelf: 'center',
                p: 2,
                borderRadius: '50%',
                background: '#1f1f1f',
                border: '2px solid #555',
              }}>
                <Image src={selectedBadge.image} alt={selectedBadge.title} width={96} height={96} style={{ objectFit: 'contain' }} />
              </Box>
              <Box>
                <Typography sx={{ 
                  fontWeight: 700, 
                  mb: 1.5, 
                  color: '#fff',
                  fontFamily: 'var(--font-woodford-bourne-pro)',
                  fontSize: '1.1rem',
                }}>
                  How to earn this reward:
                </Typography>
                <Typography sx={{ 
                  mb: 2, 
                  color: '#bbb', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-woodford-bourne-pro)',
                }}>
                  {selectedBadge.description}
                </Typography>
                <Box sx={{ height: '1px', bgcolor: '#444', my: 2 }} />
                <Typography sx={{ 
                  color: selectedBadge.unlocked ? '#fbbf24' : '#888', 
                  mb: 1, 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-woodford-bourne-pro)',
                }}>
                  {selectedBadge.unlocked
                    ? `Earned x${selectedBadge.count} | Total XP: ${formatNumber(selectedBadge.count * selectedBadge.xp)}`
                    : `Progress: ${selectedBadge.progressText || 'Progress unavailable'}`}
                </Typography>
                <Typography sx={{ 
                  color: '#888', 
                  display: 'block', 
                  mt: 1.5,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-woodford-bourne-pro)',
                }}>
                  Each reward earns you <span style={{ color: '#fbbf24', fontWeight: 700 }}>{selectedBadge.xp} XP</span> and can be achieved multiple times.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      </Box>
    </Box>
  );
}
