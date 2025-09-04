'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Chip, CircularProgress, Alert, Menu, MenuItem } from '@mui/material';
import TrophyImg from '@/Components/images/awardtrophy.png';
import RunnerUpImg from '@/Components/images/runnerup.png';
import BaloonDImg from '@/Components/images/baloond.png';
import GoatImg from '@/Components/images/goat.png';
import GoldenBootImg from '@/Components/images/goldenboot.png';
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
import ShieldImg from '@/Components/images/shield.png';
import DarkHorseImg from '@/Components/images/darkhourse.png';
import Image, { StaticImageData } from 'next/image';
import { useAuth } from '@/lib/hooks';
import { ChevronDown } from 'lucide-react';
import HatTrickBadge from '@/Components/images/brown.svg'
import AssistMaestroBadge from '@/Components/images/brown.svg'
import StarPerformerBadge from '@/Components/images/brown.svg'
import GoalMachineBadge from '@/Components/images/brown.svg'
import IronWallBadge from '@/Components/images/brown.svg'
import UnbeatenBadge from '@/Components/images/brown.svg'
import CaptainsTriumphsBadge from '@/Components/images/brown.svg'
import TripleImpactBadge from '@/Components/images/brown.svg'
import ChartTopperBadge from '@/Components/images/brown.svg'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayerCard from '@/Components/playercard/playercard';
import Goals from "@/Components/images/goal.png"
import Assist from "@/Components/images/Assist.png"
import Cleansheet from "@/Components/images/cleansheet.png"
import Momt from "@/Components/images/MOTM.png"


// --- Interfaces ---
interface User {
  id: string;
  firstName: string;
  lastName: string;
  position?: string; // align with app-wide User type
  
} 

interface Match {
  id: string;
  homeTeamGoals: number;
  awayTeamGoals: number;
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  manOfTheMatchVotes: Record<string, string>;
  playerStats: Record<string, { goals: number; assists: number }>;
  status: 'completed' | 'scheduled' | 'ongoing';
}

interface League {
  id: string;
  name: string;
  members: User[];
  matches: Match[];
  maxGames: number;
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

interface TrophyType {
  title: string;
  description: string;
  image: StaticImageData;
  color: string;
  winner?: string | null;
  winnerId?: string | null;
  leagueId?: string;
  leagueName?: string;
}

// --- Static Trophy Data ---
const trophies: Omit<TrophyType, 'winner' | 'winnerId' | 'leagueId' | 'leagueName'>[] = [
  // Renamed per spec: League Champion
  { title: 'League Champion', description: 'First Place Player In The League Table', image: TrophyImg, color: '#FFD700' },
  { title: 'Runner-Up', description: 'Second Place Player In The League Table', image: RunnerUpImg, color: '#C0C0C0' },
  { title: 'Ballon D\'or', description: 'Player With The Most MOTM Awards', image: BaloonDImg, color: '#FFC107' },
  { title: 'GOAT', description: 'Player With The Highest Win Ratio & Total MOTM Votes', image: GoatImg, color: '#F44336' },
  { title: 'Golden Boot', description: 'Player With The Highest Number Of Goals Scored', image: GoldenBootImg, color: '#FF9800' },
  { title: 'King Playmaker', description: 'Player With The Highest Number Of Goals Assisted', image: KingPlayMakerImg, color: '#4CAF50' },
  { title: 'Legendary Shield', description: 'Defender Or Goalkeeper With The Lowest Average Number Of Team Goals Conceded', image: ShieldImg, color: '#2196F3' },
  { title: 'The Dark Horse', description: 'Player Outside Of The Top 3 League Position With The Highest Frequency Of MOTM Votes', image: DarkHorseImg, color: '#607D8B' }
];

// Unified card dimensions (used by both TrophyCard and BadgeCard)
const CARD_DIMENSIONS = {
  minHeight: { xs: 260, sm: 300, md: 300 },
  maxWidth: { xs: 170, sm: 240, md: 280 },
  image: { xs: 60, sm: 72, md: 84 },
} as const;

// --- Reusable Trophy Card Component ---
const TrophyCard = ({ title, description, image, color, winner, onButtonClick }: TrophyType & { onButtonClick?: () => void }) => (
  <Paper
    elevation={4}
    sx={{
      width: '100%',
      height: '100%',
      minHeight: CARD_DIMENSIONS.minHeight,
      maxWidth: CARD_DIMENSIONS.maxWidth,
      margin: '0 auto',
      textAlign: 'center',
      borderRadius: '16px',
      border: `2px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      px: { xs: 1, sm: 1.5, md: 2 },
      py: { xs: 1.5, sm: 2, md: 3 },
    }}
  >
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' } }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#666',
          mb: { xs: 1, sm: 1.5, md: 2 },
          fontSize: { xs: '0.72rem', sm: '0.85rem' },
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {description}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: CARD_DIMENSIONS.image,
          width: CARD_DIMENSIONS.image,
          margin: '0 auto',
        }}
      >
        <Image
          src={image}
          alt={title}
          height={CARD_DIMENSIONS.image.md}
          width={CARD_DIMENSIONS.image.md}
          style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'center center' }}
        />
      </Box>
    </Box>

    <Button
      variant="contained"
      sx={{
        backgroundColor: color,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
        py: { xs: 0.5, sm: 0.75, md: 1 },
        px: { xs: 1, sm: 1.5, md: 2 },
        boxShadow: 'none',
        '&:hover': { backgroundColor: color, boxShadow: 'none', filter: 'brightness(0.95)' },
        '&:active': { backgroundColor: color, boxShadow: 'none', filter: 'brightness(0.9)' },
        '&.Mui-disabled': { backgroundColor: `${color} !important`, boxShadow: 'none' },
      }}
      onClick={onButtonClick}
      disabled={!onButtonClick}
    >
      {winner || 'TBC'}
    </Button>
  </Paper>
);

// --- Helper function to calculate player stats for a single league ---
const calculatePlayerStats = (league: League): Record<string, PlayerStats> => {
  const stats: Record<string, PlayerStats> = {};
  league.members.forEach(p => {
    stats[p.id] = { played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, motmVotes: 0, teamGoalsConceded: 0 };
  });

  league.matches.filter(m => m.status === 'completed').forEach(match => {
    const homePlayers = match.homeTeamUsers.map(p => p.id);
    const awayPlayers = match.awayTeamUsers.map(p => p.id);

    [...homePlayers, ...awayPlayers].forEach(playerId => {
      if (!stats[playerId]) return;
      stats[playerId].played++;
      if (match.playerStats && match.playerStats[playerId]) {
        stats[playerId].goals += match.playerStats[playerId].goals || 0;
        stats[playerId].assists += match.playerStats[playerId].assists || 0;
      }
    });

    if (match.manOfTheMatchVotes) {
      Object.values(match.manOfTheMatchVotes).forEach(votedForId => {
        if (stats[votedForId]) stats[votedForId].motmVotes++;
      });
    }

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

// --- Helper function to calculate winners for a single league ---
const calculateLeagueWinners = (league: League, playerStats: Record<string, PlayerStats>): TrophyType[] => {
  if (!Object.keys(playerStats).length) return [];

  const getPlayerName = (playerId: string) => {
    const player = league.members.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unknown';
  }

  if (!league || !league.members || !Array.isArray(league.members)) return [];

  const allPlayerIds = Object.keys(playerStats);
  if (allPlayerIds.length === 0) return [];

  const sortedLeagueTable = [...allPlayerIds].sort((a, b) => (playerStats[b].wins * 3 + playerStats[b].draws) - (playerStats[a].wins * 3 + playerStats[a].draws));

  const awards: Record<string, string | null> = {
    'League Champion': sortedLeagueTable[0] || null,
    'Runner-Up': sortedLeagueTable[1] || null,
    'Ballon D\'or': [...allPlayerIds].sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] || null,
    'GOAT': [...allPlayerIds].sort((a, b) => {
      const ratioA = playerStats[a].played > 0 ? playerStats[a].wins / playerStats[a].played : 0;
      const ratioB = playerStats[b].played > 0 ? playerStats[b].wins / playerStats[b].played : 0;
      return ratioB - ratioA || playerStats[b].motmVotes - playerStats[a].motmVotes;
    })[0] || null,
    'Golden Boot': [...allPlayerIds].sort((a, b) => playerStats[b].goals - playerStats[a].goals)[0] || null,
    'King Playmaker': [...allPlayerIds].sort((a, b) => playerStats[b].assists - playerStats[a].assists)[0] || null,
    'Legendary Shield': league.members
      .filter(p => ['defender', 'goalkeeper'].includes((p.position ?? '').toLowerCase()))
      .map(p => p.id)
      .sort((a, b) => {
        const avgA = playerStats[a]?.played > 0 ? (playerStats[a].teamGoalsConceded / playerStats[a].played) : Infinity;
        const avgB = playerStats[b]?.played > 0 ? (playerStats[b].teamGoalsConceded / playerStats[b].played) : Infinity;
        return avgA - avgB;
      })[0] || null,
    'The Dark Horse': sortedLeagueTable.slice(3).sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] || null
  };

  return trophies.map(trophy => {
    const winnerId = awards[trophy.title];
    return {
      ...trophy,
      winnerId: winnerId || null,
      winner: winnerId ? getPlayerName(winnerId) : 'No Winner',
      leagueId: league.id,
      leagueName: league.name,
    };
  });
};

// Helper: treat league as "completed" if
// - maxGames is provided: completedCount >= Number(maxGames)
// - else: any completed match exists
const isLeagueCompleted = (league: League) => {
  const completedCount = (league.matches ?? []).filter(m => m.status === 'completed').length;
  const max = Number((league as League)?.maxGames ?? 0);
  return max > 0 ? completedCount >= max : completedCount > 0;
};

// --- Aggregated per-match summary for the current user (across leagues) ---
type UserMatchSummary = {
  goals: number;
  assists: number;
  conceded: number;
  result: 'W' | 'D' | 'L';
  motmVotes: number; // votes received in that match
};

const summarizeUserMatches = (userId: string, leagues: League[]): UserMatchSummary[] => {
  const matches: UserMatchSummary[] = [];
  leagues.forEach(league => {
    (league.matches ?? []).forEach(m => {
      if (m.status !== 'completed') return;
      const isHome = m.homeTeamUsers.some(u => u.id === userId);
      const isAway = m.awayTeamUsers.some(u => u.id === userId);
      if (!isHome && !isAway) return;
      const ps = m.playerStats?.[userId] ?? { goals: 0, assists: 0 };
      const teamGoals = isHome ? m.homeTeamGoals : m.awayTeamGoals;
      const oppGoals = isHome ? m.awayTeamGoals : m.homeTeamGoals;
      const result: 'W' | 'D' | 'L' = teamGoals > oppGoals ? 'W' : teamGoals === oppGoals ? 'D' : 'L';
      const motmVotes = Object.values(m.manOfTheMatchVotes ?? {}).filter(v => v === userId).length;
      matches.push({
        goals: ps.goals || 0,
        assists: ps.assists || 0,
        conceded: oppGoals,
        result,
        motmVotes,
      });
    });
  });
  return matches;
};

// Build per-league match summaries to calculate streaks and league-specific goals/assists
const summarizeUserMatchesByLeague = (userId: string, leagues: League[]): Record<string, UserMatchSummary[]> => {
  const map: Record<string, UserMatchSummary[]> = {};
  leagues.forEach(league => {
    const arr: UserMatchSummary[] = [];
    (league.matches ?? []).forEach(m => {
      if (m.status !== 'completed') return;
      const isHome = m.homeTeamUsers.some(u => u.id === userId);
      const isAway = m.awayTeamUsers.some(u => u.id === userId);
      if (!isHome && !isAway) return;
      const ps = m.playerStats?.[userId] ?? { goals: 0, assists: 0 };
      const teamGoals = isHome ? m.homeTeamGoals : m.awayTeamGoals;
      const oppGoals = isHome ? m.awayTeamGoals : m.homeTeamGoals;
      const result: 'W' | 'D' | 'L' = teamGoals > oppGoals ? 'W' : teamGoals === oppGoals ? 'D' : 'L';
      const motmVotes = Object.values(m.manOfTheMatchVotes ?? {}).filter(v => v === userId).length;
      arr.push({ goals: ps.goals || 0, assists: ps.assists || 0, conceded: oppGoals, result, motmVotes });
    });
    if (arr.length) map[league.id] = arr;
  });
  return map;
};

// Generic longest-streak helper
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

// --- Badge model and computation ---
type Badge = {
  id: string;
  title: string;
  description: string;
  image: StaticImageData;
  color: string;
  count: number;        // times earned
  xp: number;           // XP per earn
  unlocked: boolean;
  progressText?: string;
};

const medalBrown = '#8B4513';

const computeBadges = (user: User, leagues: League[]): Badge[] => {
  const summaries = summarizeUserMatches(user.id, leagues);
  const byLeague = summarizeUserMatchesByLeague(user.id, leagues);
  const acrossAll = Object.values(byLeague).flat();

  // Base tallies already used
  //   const totalGoals = summaries.reduce((s, m) => s + m.goals, 0);
  //   const totalVotes = summaries.reduce((s, m) => s + m.motmVotes, 0);
  //   const cleanSheets = summaries.filter(m => m.conceded === 0).length;
  const hatTricks = summaries.filter(m => m.goals >= 3).length;

  // Streaks/league-scoped metrics
  const maxAssistStreakSingle = Math.max(0, ...Object.values(byLeague).map(arr => longestStreak(arr, m => m.assists > 0)));
  const maxScoringStreakSingle = Math.max(0, ...Object.values(byLeague).map(arr => longestStreak(arr, m => m.goals > 0)));
  const maxMotmStreakAll = longestStreak(acrossAll, m => m.motmVotes > 0);
  const maxCleanSheetWinStreakAll = longestStreak(acrossAll, m => m.result === 'W' && m.conceded === 0);
  const maxWinStreakSingle = Math.max(0, ...Object.values(byLeague).map(arr => longestStreak(arr, m => m.result === 'W')));
  const maxCaptainPickCountSingle = Math.max(0, ...Object.values(byLeague).map(arr => arr.filter(m => m.motmVotes > 0).length)); // proxy for "captain's performance pick"

  // Unknown in current data model
  const captainWins = 0; // TODO: needs a source flag to know if user was captain in a match
  const topSpotMatches = 0; // TODO: needs league standings timeline

  const toNext = (best: number, target: number) => (target - (best % target || target));

  //   const isDefOrGk = ['defender','goalkeeper'].includes((user.position ?? '').toLowerCase());

  const badges: Badge[] = [
    // 1) Hat-trick in 3 separate matches (single league)
    {
      id: 'hat_trick_3_matches',
      title: 'Hat-Trick x3',
      description: 'Scoring 3+ goals in 3 separate matches (Within a single league)',
      image: HatTrickBadge,
      color: medalBrown,
      count: Math.floor(hatTricks / 3),
      xp: 100,
      unlocked: hatTricks >= 3,
      progressText: hatTricks >= 3 ? `x${Math.floor(hatTricks / 3)}` : `${3 - Math.min(hatTricks, 3)} hat-trick(s) to go`,
    },

    // 2) 5 wins as captain (across all leagues) - placeholder until captain data exists
    {
      id: 'captain_5_wins',
      title: "Captain's 5 Wins",
      description: '5 wins as captain, leading the team to victory (Across all leagues)',
      image: CaptainsTriumphsBadge,
      color: medalBrown,
      count: Math.floor(captainWins / 5),
      xp: 150,
      unlocked: captainWins >= 5,
      progressText: captainWins > 0 ? `Wins as captain: ${captainWins}` : 'Captain tracking not available',
    },

    // 3) Assist in 10 consecutive matches (single league)
    {
      id: 'assist_10_consecutive',
      title: 'Assist Streak x10',
      description: 'Assist in 10 consecutive matches (Within a single league)',
      image: AssistMaestroBadge,
      color: medalBrown,
      count: Math.floor(maxAssistStreakSingle / 10),
      xp: 200,
      unlocked: maxAssistStreakSingle >= 10,
      progressText: maxAssistStreakSingle >= 10 ? `Best streak: ${maxAssistStreakSingle}` : `${toNext(maxAssistStreakSingle, 10)} match(es) to go`,
    },

    // 4) Scoring in 10 consecutive matches (single league)
    {
      id: 'scoring_10_consecutive',
      title: 'Scoring Streak x10',
      description: 'Scoring in 10 consecutive matches (Within a single league)',
      image: GoalMachineBadge,
      color: medalBrown,
      count: Math.floor(maxScoringStreakSingle / 10),
      xp: 250,
      unlocked: maxScoringStreakSingle >= 10,
      progressText: maxScoringStreakSingle >= 10 ? `Best streak: ${maxScoringStreakSingle}` : `${toNext(maxScoringStreakSingle, 10)} match(es) to go`,
    },

    // 5) 3 captain's performance picks (single league) - proxied by receiving any MOTM vote
    {
      id: 'captain_performance_3',
      title: "Captain's Picks x3",
      description: "Gets 3 captain's performance pick (Within a single league)",
      image: TripleImpactBadge,
      color: medalBrown,
      count: Math.floor(maxCaptainPickCountSingle / 3),
      xp: 300,
      unlocked: maxCaptainPickCountSingle >= 3,
      progressText: maxCaptainPickCountSingle >= 3 ? `Picks: ${maxCaptainPickCountSingle}` : `${3 - Math.min(maxCaptainPickCountSingle, 3)} pick(s) to go`,
    },

    // 6) 4 consecutive MOTM (across all leagues) - proxied by any MOTM vote
    {
      id: 'motm_4_consecutive',
      title: 'MOTM Streak x4',
      description: "4 consecutive 'Man of the Match' performance (Across all leagues)",
      image: StarPerformerBadge,
      color: medalBrown,
      count: Math.floor(maxMotmStreakAll / 4),
      xp: 350,
      unlocked: maxMotmStreakAll >= 4,
      progressText: maxMotmStreakAll >= 4 ? `Best streak: ${maxMotmStreakAll}` : `${toNext(maxMotmStreakAll, 4)} match(es) to go`,
    },

    // 7) 5 consecutive wins with clean sheets (across all leagues)
    {
      id: 'clean_sheet_5_wins',
      title: 'Clean-Sheet Win Streak x5',
      description: '5 consecutive wins with clean sheets (Across all leagues)',
      image: IronWallBadge,
      color: medalBrown,
      count: Math.floor(maxCleanSheetWinStreakAll / 5),
      xp: 400,
      unlocked: maxCleanSheetWinStreakAll >= 5,
      progressText: maxCleanSheetWinStreakAll >= 5 ? `Best streak: ${maxCleanSheetWinStreakAll}` : `${toNext(maxCleanSheetWinStreakAll, 5)} match(es) to go`,
    },

    // 8) Holding top spot for >10 matches (needs standings timeline) — placeholder
    {
      id: 'top_spot_10_matches',
      title: 'Top Spot x10 Matches',
      description: 'Holding top spot in the league for more than 10 matches',
      image: ChartTopperBadge,
      color: medalBrown,
      count: Math.floor(topSpotMatches / 10),
      xp: 450,
      unlocked: topSpotMatches >= 10,
      progressText: 'League top-spot tracking not available',
    },

    // 9) 10 consecutive victories in a single league
    {
      id: 'consecutive_10_victories',
      title: '10 In A Row',
      description: 'Securing 10 consecutive victories in a single league',
      image: UnbeatenBadge,
      color: medalBrown,
      count: Math.floor(maxWinStreakSingle / 10),
      xp: 500,
      unlocked: maxWinStreakSingle >= 10,
      progressText: maxWinStreakSingle >= 10 ? `Best streak: ${maxWinStreakSingle}` : `${toNext(maxWinStreakSingle, 10)} win(s) to go`,
    },
  ];

  return badges;
};

// --- Badge Card (brown medal) ---
const BadgeCard = ({ title, description, image, color, count, unlocked, progressText }: Badge) => (
  <Paper
    elevation={4}
    sx={{
      width: '100%',
      height: '100%',
      minHeight: CARD_DIMENSIONS.minHeight,
      maxWidth: CARD_DIMENSIONS.maxWidth,
      margin: '0 auto',
      textAlign: 'center',
      borderRadius: '16px',
      border: `2px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      overflow: 'hidden',
      px: { xs: 1, sm: 1.5, md: 2 },
      py: { xs: 1.5, sm: 2, md: 3 },
      position: 'relative',
      backgroundColor: '#fff',
    }}
  >
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' } }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#666',
          mb: { xs: 1, sm: 1.25 },
          fontSize: { xs: '0.72rem', sm: '0.85rem' },
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {description}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: CARD_DIMENSIONS.image,
          width: CARD_DIMENSIONS.image,
          mb: 0.5,
        }}
      >
        <Image
          src={image}
          alt={title}
          height={CARD_DIMENSIONS.image.md}
          width={CARD_DIMENSIONS.image.md}
          style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'center center' }}
        />
        <Box sx={{ position: 'absolute', top: -6, right: -6, background: color, color: '#fff', borderRadius: '12px', px: 0.75, py: 0.2, fontSize: '0.7rem', fontWeight: 700 }}>
          x{count}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: unlocked ? '#2e7d32' : '#888', mb: 1 }}>
        {progressText}
      </Typography>
    </Box>
    <Button
      variant="contained"
      sx={{
        backgroundColor: color,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        py: { xs: 0.6, sm: 0.8 },
        mt: 1,
        width: '100%',
        boxShadow: 'none',
        '&:hover': { backgroundColor: color, boxShadow: 'none', filter: 'brightness(0.95)' },
      }}
      disabled={!unlocked}
    >
      {unlocked ? 'UNLOCKED' : 'UNLOCK'}
    </Button>
  </Paper>
);

// Add this helper (used to show XP on PlayerCard)
const computeXPFromStats = (s?: PlayerStats): number => {
  if (!s) return 0;
  const base = s.played * 10;
  const results = s.wins * 50 + s.draws * 20;
  const contrib = s.goals * 100 + s.assists * 70 + s.motmVotes * 120;
  return base + results + contrib;
};

// --- Skills model + generator for PlayerCard UI ---
type Skills = {
  dribbling: number;
  shooting: number;
  passing: number;
  pace: number;
  defending: number;
  physical: number;
};

const clamp = (v: number, min = 0, max = 99) => Math.max(min, Math.min(max, Math.round(v)));
const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

const computeSkillsFromStats = (s?: PlayerStats, user?: User): Skills => {
  const stats: PlayerStats = s ?? { played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, motmVotes: 0, teamGoalsConceded: 0 };
  const gpg = safeDiv(stats.goals, stats.played);
  const apg = safeDiv(stats.assists, stats.played);
  const winRate = safeDiv(stats.wins, stats.played);
  const motmRate = safeDiv(stats.motmVotes, stats.played);
  const conc = safeDiv(stats.teamGoalsConceded, stats.played);
  const pos = (user?.position ?? '').toLowerCase();

  const shooting = clamp(45 + gpg * 40 + motmRate * 15, 30, 99);
  const passing = clamp(45 + apg * 40 + motmRate * 10, 30, 99);
  const dribbling = clamp(45 + (gpg + apg) * 20 + motmRate * 20, 30, 99);
  const pace = clamp(50 + (gpg + apg) * 15 + winRate * 20, 30, 99);
  let defending = clamp(60 - conc * 15 + winRate * 15, 25, 99);
  if (['defender', 'goalkeeper'].includes(pos)) defending = clamp(50 - conc * 25 + winRate * 15, 25, 99);
  const physical = clamp(45 + winRate * 30 + stats.played * 2, 30, 99);

  return { dribbling, shooting, passing, pace, defending, physical };
};

// Helpers to feed PlayerCard's required props
type Foot = 'L' | 'R';
type ShortPosition = 'GK' | 'DF' | 'MF' | 'WG' | 'ST';
type FIFAStats = { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string };
type PlayerCardProps = {
  name: string;
  number: string;
  points: number;
  stats: FIFAStats;
  foot: Foot;
  profileImage?: string;
  shirtIcon?: string;
  position: ShortPosition;
};

const posToShort = (pos?: string): ShortPosition => {
  const p = (pos ?? '').toLowerCase();
  if (p.includes('keeper') || p === 'gk') return 'GK';
  if (p.includes('def')) return 'DF';
  if (p.includes('mid')) return 'MF';
  if (p.includes('wing')) return 'WG';
  if (p.includes('striker') || p.includes('forward') || p === 'st' || p === 'cf') return 'ST';
  return 'ST';
};

// A minimal profile-like shape used by the UI helpers below
type PlayerProfileLike = {
  preferredFoot?: 'left' | 'right' | 'L' | 'R' | string | null;
  shirtNumber?: number | string | null;
  profilePicture?: string | null;
  avatarUrl?: string | null;
};

const getPreferredFoot = (u?: PlayerProfileLike): Foot => {
  const v = (u?.preferredFoot ?? '').toString().toLowerCase();
  if (v === 'left' || v === 'l') return 'L';
  if (v === 'right' || v === 'r') return 'R';
  return 'R';
};
const getShirtNumber = (u?: PlayerProfileLike): string => {
  const raw = u?.shirtNumber;
  return raw === null || raw === undefined ? '00' : String(raw);
};
const getProfileImage = (u?: PlayerProfileLike): string | undefined => u?.profilePicture ?? u?.avatarUrl ?? undefined;

// UI helper: color for match result
const resultColor = (r: 'W' | 'D' | 'L') =>
  r === 'W' ? '#16a34a' : r === 'D' ? '#6b7280' : '#ef4444';

// --- Main Page Component ---
export default function GlobalTrophyRoom() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const { user, token } = useAuth();
  // Quick-view modal state
  const [openQuickView, setOpenQuickView] = useState(false);
  const [quickView, setQuickView] = useState<{
    player?: User & PlayerProfileLike;
    league?: League;
    lastFive?: UserMatchSummary[];
    stats?: PlayerStats;
    trophyTitle?: string;
    skills?: Skills;
    cleanSheets?: number;   // all matches in this league
    motmCount?: number;     // matches with any MOTM vote in this league
  }>({});

  // League filter dropdown (like league page)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | 'all'>('all');
  const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
  const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setLeagues(data.leagues || []);
        } else {
          setError(data.message || 'Failed to fetch leagues.');
        }
      } catch {
        setError('An error occurred while fetching league data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeagues();
  }, [token]);

  // Auto-select a default league (prefer a completed league, else first)
  useEffect(() => {
    if (!leagues?.length) return;
    // Don't override if user has already selected a league that exists
    if (selectedLeagueId !== 'all' && leagues.some(l => l.id === selectedLeagueId)) return;

    const completed = leagues.find(l => isLeagueCompleted(l));
    const defaultId = completed?.id ?? leagues[0].id;
    setSelectedLeagueId(defaultId);
  }, [leagues]);

  const myAchievements = useMemo(() => {
    if (!user || !leagues.length) return [];
    console.log("Calculating achievements for user:", user.id);
    console.log("Leagues data:", leagues);

    const achievements: TrophyType[] = [];
    leagues.forEach(league => {
      if (!league || !league.matches) {
        console.warn("Skipping league due to incomplete data:", league?.id);
        return;
      }

      // Only calculate for completed leagues (robust)
      if (!isLeagueCompleted(league)) return;

      console.log(`Processing completed league ${league.id} for achievements.`);
      const playerStats = calculatePlayerStats(league);
      const leagueTrophies = calculateLeagueWinners(league, playerStats);

      const userWonTrophies = leagueTrophies.filter(trophy => trophy.winnerId === user.id);
      if (userWonTrophies.length > 0) {
        console.log(`User won ${userWonTrophies.length} trophies in league ${league.id}:`, userWonTrophies);
      }
      achievements.push(...userWonTrophies);
    });
    console.log("Final achievements:", achievements);
    return achievements;
  }, [leagues, user]);

  // Compute ALL trophies across every completed league (for the "All Trophies" tab)
  const allTrophyWinners = useMemo(() => {
    if (!leagues.length) return [] as TrophyType[];
    const all: TrophyType[] = [];
    leagues.forEach(league => {
      if (!league || !league.matches) return;

      // Only completed leagues (robust)
      if (!isLeagueCompleted(league)) return;

      const stats = calculatePlayerStats(league);
      const winners = calculateLeagueWinners(league, stats);
      all.push(...winners);
    });
    return all;
  }, [leagues]);

  const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLeaguesDropdownAnchor(event.currentTarget);
    setLeaguesDropdownOpen(true);
  };
  const handleLeaguesDropdownClose = () => {
    setLeaguesDropdownOpen(false);
    setLeaguesDropdownAnchor(null);
  };
  const handleLeagueSelect = (id: string | 'all') => {
    setSelectedLeagueId(id);
    handleLeaguesDropdownClose();
  };

  // Hide/close league menu when viewing My Achievements (overall, not league-based)
  useEffect(() => {
    if (filter === 'my') {
      setLeaguesDropdownOpen(false);
      setLeaguesDropdownAnchor(null);
    }
  }, [filter]);

  const formatLeagueName = (name: string): string => {
    if (!name) return '';
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    const words = name.split(' ');
    const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
    return `${capitalizedName} (${initials})`;
  };

  const baseTrophies: TrophyType[] = filter === 'all' ? allTrophyWinners : myAchievements;
  const trophiesToDisplayBase: TrophyType[] =
    selectedLeagueId === 'all'
      ? baseTrophies
      : baseTrophies.filter(t => t.leagueId === selectedLeagueId);

  const selectedLeague =
    selectedLeagueId === 'all' ? null : leagues.find(l => l.id === selectedLeagueId);

  // Helper to build placeholder trophies for a league (winners TBC)
  const buildPlaceholders = (league: League): TrophyType[] =>
    trophies.map(t => ({
      ...t,
      winner: null,
      winnerId: null,
      leagueId: league.id,
      leagueName: league.name,
    }));

  // If a specific league is selected but there are no trophies (e.g., league not completed), show placeholders.
  const trophiesToDisplay: TrophyType[] =
    selectedLeague && trophiesToDisplayBase.length === 0
      ? buildPlaceholders(selectedLeague)
      : trophiesToDisplayBase;

  // Build My Achievements (badges) for the current user
  const myBadges: Badge[] = user ? computeBadges(user, leagues) : [];

  // Open modal for a trophy winner (uses the league of that trophy)
  const openPlayerQuickView = (trophy: TrophyType) => {
    if (!trophy.winnerId || !trophy.leagueId) return;
    const league = leagues.find(l => l.id === trophy.leagueId);
    if (!league) return;
    const player = league.members.find(m => m.id === trophy.winnerId);
    if (!player) return;

    const perLeague = summarizeUserMatchesByLeague(player.id, [league]);
    const allMatches = perLeague[league.id] ?? [];
    const list = allMatches.slice(-5).reverse();
    const stats = calculatePlayerStats(league)[player.id];
    const skills = computeSkillsFromStats(stats, player);
    const cleanSheets = allMatches.filter(m => m.conceded === 0).length;
    const motmCount = allMatches.filter(m => m.motmVotes > 0).length;

    setQuickView({ player, league, lastFive: list, stats, trophyTitle: trophy.title, skills, cleanSheets, motmCount });
    setOpenQuickView(true);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  }

  // UI
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: 'auto auto',
          gridTemplateAreas: '"center" "left"',
          alignItems: 'center',
          rowGap: 2, // spacing between chips and dropdown
          mb: 4,
        }}
      >
        <Box sx={{ gridArea: 'left', justifySelf: 'start', ml: 2 }}>
          {filter === 'all' && (
            <>
              <Button
                onClick={handleLeaguesDropdownOpen}
                sx={{
                  textTransform: 'uppercase',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                  color: 'white',
                  backgroundColor: '#2B2B2B',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  '&:hover': { backgroundColor: '#2B2B2B' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
                endIcon={<ChevronDown size={20} />}
              >
                {selectedLeague ? formatLeagueName(selectedLeague.name) : 'All Leagues'}
              </Button>
              <Menu
                anchorEl={leaguesDropdownAnchor}
                open={leaguesDropdownOpen}
                onClose={handleLeaguesDropdownClose}
              >
                <MenuItem onClick={() => handleLeagueSelect('all')}>All Leagues</MenuItem>
                {leagues.map(l => (
                  <MenuItem key={l.id} onClick={() => handleLeagueSelect(l.id)}>
                    {l.name}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
        <Box
          sx={{
            gridArea: 'center',
            justifySelf: 'center',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            columnGap: { xs: 1, sm: 2 },
            minWidth: 0, // allow children to shrink
          }}
        >
          <Chip
            label="All Trophies"
            color={filter === 'all' ? 'success' : 'default'}
            onClick={() => setFilter('all')}
            sx={{
              fontSize: { xs: '0.78rem', sm: '0.9rem', md: '1rem' },
              py: { xs: 1, sm: 1.5, md: 2 },
              // keep on one line and shrink with ellipsis on small screens
              whiteSpace: 'nowrap',
              maxWidth: { xs: '42vw', sm: 'unset' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '& .MuiChip-label': {
                px: { xs: 1.25, sm: 1.75, md: 2.5 },
              },
              fontWeight: 'bold',
              cursor: 'pointer',
              ...(filter === 'all' && { backgroundColor: '#00A77F', color: 'white' }),
            }}
          />
          <Chip
            label="My Achievements"
            color={filter === 'my' ? 'success' : 'default'}
            variant="outlined"
            onClick={() => setFilter('my')}
            sx={{
              fontSize: { xs: '0.78rem', sm: '0.9rem', md: '1rem' },
              py: { xs: 1, sm: 1.5, md: 2 },
              whiteSpace: 'nowrap',
              maxWidth: { xs: '42vw', sm: 'unset' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '& .MuiChip-label': {
                px: { xs: 1.25, sm: 1.75, md: 2.5 },
              },
              fontWeight: 'bold',
              cursor: 'pointer',
              ...(filter === 'my' && { backgroundColor: '#00A77F', color: 'white' }),
            }}
          />
        </Box>
      </Box>

      {filter === 'my' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2, md: 3 }, justifyContent: 'center', alignItems: 'stretch' }}>
          {myBadges.length > 0 ? myBadges.map(b => (
            <Box key={b.id} sx={{ height: '100%' }}>
              <BadgeCard {...b} />
            </Box>
          )) : (
            <Typography sx={{ mt: 4, gridColumn: '1 / -1', textAlign: 'center' }}>
              No badge progress yet.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2, md: 3 }, justifyContent: 'center', alignItems: 'stretch' }}>
          {trophiesToDisplay.length > 0 ? trophiesToDisplay.map((trophy, index) => (
            <Box key={`${trophy.title}-${trophy.leagueId || 'global'}-${index}`} sx={{ height: '100%' }}>
              <TrophyCard
                {...trophy}
                onButtonClick={trophy.winnerId && trophy.leagueId ? () => openPlayerQuickView(trophy) : undefined}
              />
            </Box>
          )) : (
            <Typography sx={{ mt: 4, gridColumn: '1 / -1', textAlign: 'center' }}>
              No trophies to display (no completed leagues found).
            </Typography>
          )}
        </Box>
      )}

      {/* Player Quick View Modal */}
      <Dialog
        open={openQuickView}
        onClose={() => setOpenQuickView(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          {quickView.trophyTitle ? `${quickView.trophyTitle} • ` : ''} Player
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setOpenQuickView(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          {quickView.player && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                alignItems: 'stretch',
              }}
            >
              {/* Left: PlayerCard with exact props */}
              <Box sx={{ p: { xs: 0, sm: 1 } }}>
                {(() => {
                  const p = quickView.player as User & PlayerProfileLike;
                  const playerCardProps = {
                    name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
                    number: getShirtNumber(p),
                    points: computeXPFromStats(quickView.stats),
                    stats: {
                      DRI: String(quickView.skills?.dribbling ?? 0),
                      SHO: String(quickView.skills?.shooting ?? 0),
                      PAS: String(quickView.skills?.passing ?? 0),
                      PAC: String(quickView.skills?.pace ?? 0),
                      DEF: String(quickView.skills?.defending ?? 0),
                      PHY: String(quickView.skills?.physical ?? 0),
                    },
                    foot: getPreferredFoot(p),
                    profileImage: getProfileImage(p),
                    shirtIcon: '',
                    position: posToShort(p.position),
                  } satisfies PlayerCardProps;

                  return <PlayerCard {...playerCardProps} />;
                })()}
                {/* Icons row under the player card */}
                <Box
                  sx={{
                    mt: 1.75,
                    px: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    justifyItems: 'center',
                    alignItems: 'center',
                    gap: 1,
                    textAlign: 'center',
                    minWidth: 0,
                  }}
                >
                  {[
                    { img: Goals,      label: 'Goals',        value: quickView.stats?.goals ?? 0 },
                    { img: Assist,     label: 'Assists',      value: quickView.stats?.assists ?? 0 },
                    { img: Cleansheet, label: 'Clean Sheets', value: quickView.cleanSheets ?? 0 },
                    { img: Momt,       label: 'MOTM',         value: quickView.motmCount ?? 0 },
                  ].map((it, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'grid',
                        gridTemplateRows: '28px 16px', // fixed heights for perfect alignment
                        justifyItems: 'center',
                        alignItems: 'center',
                        rowGap: 0.5,
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 28, lineHeight: 1 }}>
                        <Image
                          src={it.img}
                          alt={it.label}
                          width={35}
                          height={35}
                          style={{ objectFit: 'contain', display: 'block' }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {it.value}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          lineHeight: 1,
                          height: 16,                // lock label height to avoid shift
                          whiteSpace: 'nowrap',      // prevent wrapping (e.g., "Clean Sheets")
                          overflow: 'hidden',
                          // textOverflow: 'ellipsis',
                          width: '100%',
                        }}
                      >
                        {it.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Right: Last 5 Matches */}
              <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Last 5 games</Typography>
                <Stack direction="column" spacing={1}>
                  {(quickView.lastFive ?? []).slice(0, 5).map((m, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 28,
                          borderRadius: 1,
                          backgroundColor: resultColor(m.result),
                          color: '#fff',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                        }}
                      >
                        {m.result}
                      </Box>
                      {idx === 0 && (
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          Latest
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {(quickView.lastFive ?? []).length === 0 && (
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No recent matches.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}