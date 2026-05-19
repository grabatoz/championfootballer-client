'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, Paper, Button, Chip, CircularProgress, Alert, Menu, MenuItem, Avatar, Tooltip, useTheme, useMediaQuery } from '@mui/material';
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
import { ChevronDown, Trophy, Star } from 'lucide-react';
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
import ShareIcon from '@mui/icons-material/Share';
import Goals from "@/Components/images/goal.png"
import Assist from "@/Components/images/Assist.png"
import Cleansheet from "@/Components/images/cleansheet.png"
import Momt from "@/Components/images/MOTM.png"
import DefImp from "@/Components/images/defimp.png"
import Mentality from "@/Components/images/metality.png"
import cflogo from '@/Components/images/champion football logo 3 (1).png';
import Raisingstart from '@/Components/images/brown.svg';
import StarKeeperImg from '@/Components/images/startkeeper.png';
import TrophyRoomLoadingSkeleton from '@/Components/loading/TrophyRoomLoadingSkeleton';
const PlayerCard = dynamic(() => import('@/Components/playercard/playercard').then(mod => ({ default: mod.default })), {
  loading: () => <CircularProgress />,
  ssr: false
});
import LeagueIcon from '@/Components/images/league icon.png'
import XPStarMilestoneCard from '@/Components/XPStarMilestoneCard';

// import { achievementsAPI } from '@/lib/api';

// --- Interfaces ---
interface LeagueComputedStatus {
  matchesPlayed?: number;
  gamesPlayed?: number;
  maxGames?: number;
  locked?: boolean;
  isComplete?: boolean;
  missing?: string[];
  [key: string]: unknown;
}

interface User {
  id: string;
  firstName?: string; // Make optional to match UserProfile
  lastName?: string;  // Make optional to match UserProfile
  position?: string;
  xp?: number;
  profilePicture?: string | null;
}

interface Match {
  id: string;
  homeTeamGoals: number;
  awayTeamGoals: number;
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  manOfTheMatchVotes: Record<string, string>;
  playerStats: Record<string, { goals: number; assists: number }>;
  status: 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING';
  active?: boolean;
  end?: string | Date;
  seasonId?: string;
}

interface Season {
  id: string;
  leagueId: string;
  seasonNumber: number;
  name: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface League {
  id: string;
  name: string;
  members: User[];
  matches: Match[];
  maxGames: number;
  createdAt?: string; // for year filtering
  updatedAt?: string; // optional
  computedStatus?: LeagueComputedStatus;
  isLocked?: boolean;
  isComplete?: boolean;
  isCompleted?: boolean;
  active?: boolean;
  archived?: boolean;
  status?: string;
  // Derived on client: whether the user is an admin of this league
  isAdmin?: boolean;
  // Season information
  seasons?: Season[];
  activeSeasonId?: string;
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
  id?: string | number;
  title: string;
  description: string;
  image: StaticImageData;
  color: string;
  winner?: string | null;
  winnerId?: string | null;
  leagueId?: string;
  leagueName?: string;
  seasonId?: string;
  seasonName?: string;
  awardedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  imageSize?: { xs: number; sm: number; md: number };
}

// Backend API response types
interface BackendUser {
  id: string | number;
  firstName?: string;
  lastName?: string;
  positionType?: string;
  position?: string;
  totalXP?: number;
  totalXp?: number;
  xpTotal?: number;
  xp?: number;
  profile?: {
    totalXP?: number;
    xp?: number;
  };
  leagues?: BackendLeague[];
  administeredLeagues?: BackendLeague[];
  adminLeagues?: BackendLeague[];
}

interface BackendMatch {
  id: string | number;
  homeTeamGoals?: number | string;
  awayTeamGoals?: number | string;
  homeTeamUsers?: BackendUser[];
  awayTeamUsers?: BackendUser[];
  manOfTheMatchVotes?: Record<string, string>;
  playerStats?: Record<string, { goals: number | string; assists: number | string }>;
  status?: string;
}

interface BackendLeague {
  id: string | number;
  name?: string;
  status?: string;
  active?: boolean;
  archived?: boolean;
  members?: BackendUser[];
  matches?: BackendMatch[];
  maxGames?: number | string;
  maxgames?: number | string;
  max_matches?: number | string;
  maxMatch?: number | string;
  max?: number | string;
  gamesCap?: number | string;
  gamesTarget?: number | string;
  fixturesTarget?: number | string;
  plannedGames?: number | string;
  totalGames?: number | string;
  totalRounds?: number | string;
  rounds?: number | string;
  rules?: { maxGames?: number | string };
  settings?: { maxGames?: number | string };
  config?: { maxGames?: number | string };
  options?: { maxGames?: number | string };
  schedule?: { maxGames?: number | string };
  createdAt?: string;
  updatedAt?: string;
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

// interface ApiResponse {
//   success: boolean;
//   user?: BackendUser;
//   message?: string;
// }

// --- Static Trophy Data ---
// Top row trophies (displayed larger)
const topTrophies: Omit<TrophyType, 'winner' | 'winnerId' | 'leagueId' | 'leagueName'>[] = [
  { title: 'League Champion', description: 'First Place Player In The League Table', image: TrophyImg, color: '#ffd700', imageSize: { xs: 80, sm: 100, md: 170 } },
  { title: "Ballon D'or", description: 'Player With The Most MOTM Votes', image: BaloonDImg, color: '#ff8c00', imageSize: { xs: 80, sm: 100, md: 170 } },
  { title: 'Runner-Up', description: 'Second Place Player In The League Table', image: RunnerUpImg, color: '#cccccc', imageSize: { xs: 80, sm: 100, md: 170 } },
];

// Bottom row trophies (displayed smaller)
const bottomTrophies: Omit<TrophyType, 'winner' | 'winnerId' | 'leagueId' | 'leagueName'>[] = [
  { title: 'Golden Boot', description: 'Player With The Highest Number Of Goals Scored', image: GoldenBootImg, color: '#cccccc' },
  { title: 'King Playmaker', description: 'Player With The Highest Number Of Goals Assisted', image: KingPlayMakerImg, color: '#7b3fe4' },
  { title: 'Legendary Shield', description: 'Player With The Lowest Average Number Of Team Goals Conceded', image: ShieldImg, color: '#00b3ff' },
  { title: 'Dark Horse', description: 'Player Outside Of The Top 3 League Position With The Highest Frequency Of MOTM Votes', image: DarkHorseImg, color: '#e10600' },
  { title: 'Star Keeper', description: 'Goalkeeper With The Highest Number Of Clean Sheets', image: StarKeeperImg, color: '#00d1c1' },
];

// Combined trophies array for backwards compatibility
const trophies: Omit<TrophyType, 'winner' | 'winnerId' | 'leagueId' | 'leagueName'>[] = [
  ...topTrophies,
  ...bottomTrophies,
];

// Unified card dimensions (used by both TrophyCard and BadgeCard)
const CARD_DIMENSIONS = {
  minHeight: { xs: 260, sm: 300, md: 300 },
  maxWidth: { xs: 170, sm: 240, md: 280 },
  image: { xs: 60, sm: 72, md: 84 },
} as const;

// Larger card dimensions for top trophies
const TOP_CARD_DIMENSIONS = {
  minHeight: { xs: 260, sm: 340, md: 420 },
  maxWidth: { xs: 290, sm: 280, md: 370 },
  image: { xs: 80, sm: 100, md: 170 },
} as const;

// Smaller card dimensions for bottom trophies
const BOTTOM_CARD_DIMENSIONS = {
  minHeight: { xs: 165, sm: 220, md: 240 },
  maxWidth: { xs: 290, sm: 220, md: 260 },
  image: { xs: 50, sm: 70, md: 90 },
} as const;

// Blue helpers (hex + CSS filter to tint brown.svg to blue)
const BLUE_HEX = '#3B82F6';
const BLUE_FILTER =
  'invert(30%) sepia(98%) saturate(2000%) hue-rotate(201deg) brightness(92%) contrast(101%)';

// Extract total XP from various possible backend fields
const extractTotalXP = (u: BackendUser): number | undefined => {
  const candidates = [
    u?.totalXP,
    u?.totalXp,
    u?.xpTotal,
    u?.xp,
    u?.profile?.totalXP,
    u?.profile?.xp,
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

// Safely coerce any value to number
const toNum = (v: number | string | undefined): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Robustly read maxGames from various possible backend fields
const extractLeagueMaxGames = (l: BackendLeague): number => {
  const candidates = [
    l?.maxGames,
    l?.maxgames,
    l?.max_matches,
    l?.maxMatch,
    l?.max,
    l?.gamesCap,
    l?.gamesTarget,
    l?.fixturesTarget,
    l?.plannedGames,
    l?.totalGames,
    l?.totalRounds,
    l?.rounds,
    l?.rules?.maxGames,
    l?.settings?.maxGames,
    l?.config?.maxGames,
    l?.options?.maxGames,
    l?.schedule?.maxGames,
  ];
  for (const c of candidates) {
    const n = toNum(c);
    if (n !== undefined) return n;
  }
  return 0;
};

// Narrow unknown values to BackendUser when coming from dynamic API payloads
const isBackendUser = (v: unknown): v is BackendUser => {
  if (v == null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  // consider it a BackendUser if it has at least an id or leagues-like structure
  return 'id' in o || 'leagues' in o || 'administeredLeagues' in o || 'adminLeagues' in o;
};

// --- Reusable Trophy Card Component (Dark Theme) ---
const TrophyCard = ({
  title,
  description,
  image,
  color,
  winner,
  onButtonClick,
  isLarge = false,
  imageSize
}: TrophyType & { onButtonClick?: () => void; isLarge?: boolean }) => {
  const dims = isLarge ? TOP_CARD_DIMENSIONS : BOTTOM_CARD_DIMENSIONS;
  const imgSize = imageSize || dims.image;

  return (
    <Paper
      elevation={4}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: dims.minHeight,
        maxWidth: { xs: '100%', sm: dims.maxWidth.sm, md: dims.maxWidth.md },
        margin: '0 auto',
        textAlign: 'center',
        borderRadius: '6px',
        backgroundColor: '#2a2a2a',
        border: `2px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: onButtonClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: onButtonClick ? 'translateY(-4px)' : 'none',
          boxShadow: onButtonClick ? `0 8px 24px ${color}30` : 'none',
        },
      }}
      onClick={onButtonClick}
    >
      {/* Top Section - Title */}
      <Box sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
        <Typography
          variant="h6"
          sx={{
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: isLarge
              ? { xs: '1rem', sm: '1.2rem', md: '1.6rem' }
              : { xs: '0.72rem', sm: '0.82rem', md: '0.9rem' },
            letterSpacing: 1,
            textTransform: 'uppercase',
            mb: { xs: 0.7, sm: 1.5 },
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Tooltip
          title={description}
          placement="top"
          arrow
          enterDelay={200}
          disableHoverListener={!description}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: isLarge
                ? { xs: '0.75rem', sm: '0.85rem', md: '1.05rem' }
                : { xs: '0.58rem', sm: '0.68rem', md: '0.74rem' },
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: isLarge ? { xs: 1, sm: 2 } : { xs: 0.5, sm: 0.5 },
            }}
          >
            {description}
          </Typography>
        </Tooltip>
      </Box>

      {/* Middle Section - Trophy Image */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: imgSize,
          width: imgSize,
          margin: '0 auto',
          mb: { xs: 1.2, sm: 2.5 },
        }}
      >
        <Image
          src={image}
          alt={title}
          height={imgSize.md}
          width={imgSize.md}
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
          }}
        />
      </Box>

      {/* Bottom Section - Winner Button */}
      <Box
        sx={{
          mt: 'auto',
          pb: { xs: 1.2, sm: 2 },
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Button
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: color,
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: isLarge
              ? { xs: '1rem', sm: '1.1rem', md: '1.5rem' }
              : { xs: '0.72rem', sm: '0.82rem', md: '0.92rem' },
            py: isLarge ? { xs: 1, sm: 1.5 } : { xs: 0.75, sm: 1.1 },
            borderRadius: '0',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: 1,
            boxShadow: 'none',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 0 rgba(0, 0, 0, 0.5), 1px -1px 0 rgba(0, 0, 0, 0.5), -1px 1px 0 rgba(0, 0, 0, 0.5), 1px 1px 0 rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: color,
              boxShadow: 'none',
              filter: 'brightness(1.1)',
            },
            '&.Mui-disabled': {
              backgroundColor: color,
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 0 rgba(0, 0, 0, 0.5), 1px -1px 0 rgba(0, 0, 0, 0.5), -1px 1px 0 rgba(0, 0, 0, 0.5), 1px 1px 0 rgba(0, 0, 0, 0.5)',
            },
          }}
          disabled={!onButtonClick}
        >
          {winner ? winner.split(' ')[0] : 'TBC'}
        </Button>
      </Box>
    </Paper>
  );
};

// --- Helper function to calculate player stats for a single league ---
const calculatePlayerStats = (league: League): Record<string, PlayerStats> => {
  const stats: Record<string, PlayerStats> = {};
  league.members.forEach(p => {
    stats[p.id] = { played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, motmVotes: 0, teamGoalsConceded: 0 };
  });

  league.matches.filter(m => m.status === 'RESULT_PUBLISHED').forEach(match => {
    const homePlayers = match.homeTeamUsers.map(p => p.id);
    const awayPlayers = match.awayTeamUsers.map(p => p.id);

    [...homePlayers, ...awayPlayers].forEach(playerId => {
      if (!stats[playerId]) return;
      stats[playerId].played++;
      if (match.playerStats && match.playerStats[playerId]) {
        // CAST to numbers to avoid "0" + "1" => "01"
        const g = Number(match.playerStats[playerId].goals);
        const a = Number(match.playerStats[playerId].assists);
        stats[playerId].goals += Number.isFinite(g) ? g : 0;
        stats[playerId].assists += Number.isFinite(a) ? a : 0;
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
// const calculateLeagueWinners = (league: League, playerStats: Record<string, PlayerStats>): TrophyType[] => {
//   if (!Object.keys(playerStats).length) return [];

//   const getPlayerName = (playerId: string) => {
//     const player = league.members.find(p => p.id === playerId);
//     return player ? `${player.firstName} ${player.lastName}` : 'Unknown';
//   }

//   if (!league || !league.members || !Array.isArray(league.members)) return [];

//   const allPlayerIds = Object.keys(playerStats);
//   if (allPlayerIds.length === 0) return [];

//   const sortedLeagueTable = [...allPlayerIds].sort((a, b) => (playerStats[b].wins * 3 + playerStats[b].draws) - (playerStats[a].wins * 3 + playerStats[a].draws));

//   // Compute Star Keeper (GKs only): most clean sheets, tie-breaker fewest goals conceded
//   const gkIds = league.members
//     .filter(p => (p.position ?? '').toLowerCase().includes('goalkeeper'))
//     .map(p => p.id);

//   const cleanSheetsByGk: Record<string, number> = {};
//   gkIds.forEach(id => (cleanSheetsByGk[id] = 0));

//   (league.matches ?? []).forEach(m => {
//     if (m.status !== 'RESULT_PUBLISHED') return;
//     const homeGKs = m.homeTeamUsers.filter(u => gkIds.includes(u.id)).map(u => u.id);
//     const awayGKs = m.awayTeamUsers.filter(u => gkIds.includes(u.id)).map(u => u.id);
//     if (m.awayTeamGoals === 0) homeGKs.forEach(id => (cleanSheetsByGk[id] = (cleanSheetsByGk[id] || 0) + 1));
//     if (m.homeTeamGoals === 0) awayGKs.forEach(id => (cleanSheetsByGk[id] = (cleanSheetsByGk[id] || 0) + 1));
//   });

//   const starKeeperWinner =
//     gkIds
//       .slice()
//       .sort((a, b) => {
//         const csA = cleanSheetsByGk[a] || 0;
//         const csB = cleanSheetsByGk[b] || 0;
//         if (csB !== csA) return csB - csA; // more clean sheets first
//         const gaA = playerStats[a]?.teamGoalsConceded ?? Number.POSITIVE_INFINITY;
//         const gaB = playerStats[b]?.teamGoalsConceded ?? Number.POSITIVE_INFINITY;
//         return gaA - gaB; // fewer goals conceded wins tiebreak
//       })[0] || null;

//   const awards: Record<string, string | null> = {
//     'League Champion': sortedLeagueTable[0] || null,
//     'Runner-Up': sortedLeagueTable[1] || null,
//     "Ballon D'or": [...allPlayerIds].sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] || null,
//     'GOAT': [...allPlayerIds].sort((a, b) => {
//       const ratioA = playerStats[a].played > 0 ? playerStats[a].wins / playerStats[a].played : 0;
//       const ratioB = playerStats[b].played > 0 ? playerStats[b].wins / playerStats[b].played : 0;
//       return ratioB - ratioA || playerStats[b].motmVotes - playerStats[a].motmVotes;
//     })[0] || null,
//     'Golden Boot': [...allPlayerIds].sort((a, b) => playerStats[b].goals - playerStats[a].goals)[0] || null,
//     'King Playmaker': [...allPlayerIds].sort((a, b) => playerStats[b].assists - playerStats[a].assists)[0] || null,
//     'Legendary Shield': league.members
//       .filter(p => ['defender', 'goalkeeper'].includes((p.position ?? '').toLowerCase()))
//       .map(p => p.id)
//       .sort((a, b) => {
//         const avgA = playerStats[a]?.played > 0 ? (playerStats[a].teamGoalsConceded / playerStats[a].played) : Infinity;
//         const avgB = playerStats[b]?.played > 0 ? (playerStats[b].teamGoalsConceded / playerStats[b].played) : Infinity;
//         return avgA - avgB;
//       })[0] || null,
//     'The Dark Horse': sortedLeagueTable.slice(3).sort((a, b) => playerStats[b].motmVotes - playerStats[a].motmVotes)[0] || null,
//     // NEW
//     'Star Keeper': starKeeperWinner,
//   };

//   return trophies.map(trophy => {
//     const winnerId = awards[trophy.title];
//     return {
//       ...trophy,
//       winnerId: winnerId || null,
//       winner: winnerId ? getPlayerName(winnerId) : 'No Winner',
//       leagueId: league.id,
//       leagueName: league.name,
//     };
//   });
// };

// Helper: treat league as "completed" if
// - maxGames is provided: completedCount >= Number(maxGames)
// - else: any completed match exists
// const isLeagueCompleted = (league: League) => {
//   const completedCount = (league.matches ?? []).filter(m => m.status === 'RESULT_PUBLISHED').length;
//   const max = Number((league as League)?.maxGames ?? 0);
//   const result = max > 0 ? completedCount >= max : completedCount > 0;
//   console.debug('[TrophyRoom] isLeagueCompleted()', {
//     leagueId: league?.id,
//     name: league?.name,
//     maxGames: max,
//     completedCount,
//     result,
//   });
//   return result;
// };

// SIMPLIFY: Final standing = maxGames reached (no extra stats completeness check)
const isFinalLeagueStanding = (league: League): boolean => {
  const max = Number(league?.maxGames ?? 0);
  const completedCount = countCompletedMatches(league);
  if (max > 0) {
    const result = completedCount >= max;
    console.debug('[TrophyRoom] isFinalLeagueStanding(max rule)', {
      leagueId: league?.id, name: league?.name, maxGames: max, completedCount, result,
    });
    return result;
  }
  // Fallback rule when backend doesn't provide maxGames
  const total = league.matches?.length ?? 0;
  const allCompleted = total > 0 && (league.matches ?? []).every(m => m.status === 'RESULT_PUBLISHED');
  console.debug('[TrophyRoom] isFinalLeagueStanding(fallback all-completed rule)', {
    leagueId: league?.id, name: league?.name, totalMatches: total, completedCount, allCompleted,
  });
  return allCompleted;
};

// ADD: quick counter for completed matches
const countCompletedMatches = (league: League, seasonId?: string) => {
  const matches = league.matches ?? [];
  const filtered = seasonId
    ? matches.filter(m => m.seasonId === seasonId && m.status === 'RESULT_PUBLISHED')
    : matches.filter(m => m.status === 'RESULT_PUBLISHED');
  return filtered.length;
};

// Audit helper: check missing player stats in completed matches
// const auditLeagueData = (league: League) => {
//   const completed = (league.matches ?? []).filter(m => m.status === 'RESULT_PUBLISHED');
//   const uniqueStatuses = Array.from(new Set((league.matches ?? []).map(m => m.status)));
//   let totalMissing = 0;
//   const perMatchMissing: Array<{ matchId: string; missingFor: string[] }> = [];

//   completed.forEach(m => {
//     const players = [...(m.homeTeamUsers ?? []), ...(m.awayTeamUsers ?? [])];
//     const missingFor = players
//       .filter(p => {
//         const ps = m.playerStats?.[p.id];
//         const goalsOk = ps !== undefined && ps !== null && Number.isFinite(Number(ps.goals));
//         const assistsOk = ps !== undefined && ps !== null && Number.isFinite(Number(ps.assists));
//         return !(goalsOk && assistsOk);
//       })
//       .map(p => `${p.firstName} ${p.lastName} (${p.id})`);
//     if (missingFor.length) {
//       totalMissing += missingFor.length;
//       perMatchMissing.push({ matchId: m.id, missingFor });
//     }
//   });

//   console.groupCollapsed('[TrophyRoom][Audit] League data', league.name);
//   console.log({
//     leagueId: league.id,
//     name: league.name,
//     maxGames: league.maxGames,
//     totalMatches: league.matches?.length ?? 0,
//     completedCount: completed.length,
//     statuses: uniqueStatuses,
//     totalMissingPlayerStats: totalMissing,
//   });
//   if (perMatchMissing.length) {
//     console.table(
//       perMatchMissing.slice(0, 10).map(x => ({
//         matchId: x.matchId,
//         missingForCount: x.missingFor.length,
//         missingForSample: x.missingFor.slice(0, 5).join(' | ')
//       }))
//     );
//   }
//   console.groupEnd();
// };

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
      if (m.status !== 'RESULT_PUBLISHED') return;
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
      if (m.status !== 'RESULT_PUBLISHED') return;
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
  xp: number;           // XP per earn (or level bucket for Rising XP)
  unlocked: boolean;
  progressText?: string;
};

// Replace brown with Gold + a muted border for locked
const medalGold = '#D4AF37';
const medalMuted = '#CBD5E1'; // slate-300

// Add this helper (used to format XP nicely)
const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

const computeBadges = (user: User, leagues: League[], backendTotalXP?: number): Badge[] => {
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
    {
      id: 'hat_trick_3_matches',
      title: 'Hat-Trick x3',
      description: 'Scoring 3+ goals in 3 separate matches (Within a single league)',
      image: HatTrickBadge,
      color: medalGold, // changed
      count: Math.floor(hatTricks / 3),
      xp: 100,
      unlocked: hatTricks >= 3,
      progressText: hatTricks >= 3 ? `x${Math.floor(hatTricks / 3)}` : `${3 - Math.min(hatTricks, 3)} hat-trick(s) to go`,
    },
    {
      id: 'captain_5_wins',
      title: "Captain's 5 Wins",
      description: '5 wins as captain, leading the team to victory (Across all leagues)',
      image: CaptainsTriumphsBadge,
      color: medalGold, // changed
      count: Math.floor(captainWins / 5),
      xp: 150,
      unlocked: captainWins >= 5,
      progressText: captainWins > 0 ? `Wins as captain: ${captainWins}` : 'Captain tracking not available',
    },
    {
      id: 'assist_10_consecutive',
      title: 'Assist Streak x10',
      description: 'Assist in 10 consecutive matches (Within a single league)',
      image: AssistMaestroBadge,
      color: medalGold, // changed
      count: Math.floor(maxAssistStreakSingle / 10),
      xp: 200,
      unlocked: maxAssistStreakSingle >= 10,
      progressText: maxAssistStreakSingle >= 10 ? `Best streak: ${maxAssistStreakSingle}` : `${toNext(maxAssistStreakSingle, 10)} match(es) to go`,
    },
    {
      id: 'scoring_10_consecutive',
      title: 'Scoring Streak x10',
      description: 'Scoring in 10 consecutive matches (Within a single league)',
      image: GoalMachineBadge,
      color: medalGold, // changed
      count: Math.floor(maxScoringStreakSingle / 10),
      xp: 250,
      unlocked: maxScoringStreakSingle >= 10,
      progressText: maxScoringStreakSingle >= 10 ? `Best streak: ${maxScoringStreakSingle}` : `${toNext(maxScoringStreakSingle, 10)} match(es) to go`,
    },
    {
      id: 'captain_performance_3',
      title: "Captain's Picks x3",
      description: "Gets 3 captain's performance pick (Within a single league)",
      image: TripleImpactBadge,
      color: medalGold, // changed
      count: Math.floor(maxCaptainPickCountSingle / 3),
      xp: 300,
      unlocked: maxCaptainPickCountSingle >= 3,
      progressText: maxCaptainPickCountSingle >= 3 ? `Picks: ${maxCaptainPickCountSingle}` : `${3 - Math.min(maxCaptainPickCountSingle, 3)} pick(s) to go`,
    },
    {
      id: 'motm_4_consecutive',
      title: 'MOTM Streak x4',
      description: "4 consecutive 'Man of the Match' performance (Across all leagues)",
      image: StarPerformerBadge,
      color: medalGold, // changed
      count: Math.floor(maxMotmStreakAll / 4),
      xp: 350,
      unlocked: maxMotmStreakAll >= 4,
      progressText: maxMotmStreakAll >= 4 ? `Best streak: ${maxMotmStreakAll}` : `${toNext(maxMotmStreakAll, 4)} match(es) to go`,
    },
    {
      id: 'clean_sheet_5_wins',
      title: 'Clean-Sheet Win Streak x5',
      description: '5 consecutive wins with clean sheets (Across all leagues)',
      image: IronWallBadge,
      color: medalGold, // changed
      count: Math.floor(maxCleanSheetWinStreakAll / 5),
      xp: 400,
      unlocked: maxCleanSheetWinStreakAll >= 5,
      progressText: maxCleanSheetWinStreakAll >= 5 ? `Best streak: ${maxCleanSheetWinStreakAll}` : `${toNext(maxCleanSheetWinStreakAll, 5)} match(es) to go`,
    },
    {
      id: 'top_spot_10_matches',
      title: 'Top Spot x10 Matches',
      description: 'Holding top spot in the league for more than 10 matches',
      image: ChartTopperBadge,
      color: medalGold, // changed
      count: Math.floor(topSpotMatches / 10),
      xp: 450,
      unlocked: topSpotMatches >= 10,
      progressText: 'League top-spot tracking not available',
    },
    {
      id: 'consecutive_10_victories',
      title: '10 In A Row',
      description: 'Securing 10 consecutive victories in a single league',
      image: UnbeatenBadge,
      color: medalGold, // changed
      count: Math.floor(maxWinStreakSingle / 10),
      xp: 500,
      unlocked: maxWinStreakSingle >= 10,
      progressText: maxWinStreakSingle >= 10 ? `Best streak: ${maxWinStreakSingle}` : `${toNext(maxWinStreakSingle, 10)} win(s) to go`,
    },
  ];

  // Prefer backend XP; fallback to computed if missing
  const computedXP = leagues.reduce((sum, lg) => {
    const stats = calculatePlayerStats(lg)[user.id];
    return sum + computeXPFromStats(stats);
  }, 0);
  // Prefer authenticated user's profile XP when available
  const authXP = toNum(user?.xp);
  const totalProfileXP =
    (authXP !== undefined ? authXP : undefined) ??
    (typeof backendTotalXP === 'number' ? backendTotalXP : undefined) ??
    computedXP;

  // Add the blue Total XP box (simple info card)
  badges.unshift({
    id: 'rising_xp',
    title: 'Rising Star',
    description: 'Your total XP across all matches and leagues.',
    image: Raisingstart,
    color: BLUE_HEX,
    count: 0,
    xp: Math.max(0, totalProfileXP),
    unlocked: true,
    progressText: undefined,
  });

  return badges;
};

// Map server badges to UI badges (preserve our images/colors/descriptions)
const BADGE_META: Record<string, { title: string; description: string; image: StaticImageData; color: string }> = {
  rising_xp: {
    title: 'Rising Star',
    description: 'Your total XP across all matches and leagues.',
    image: Raisingstart,
    color: BLUE_HEX,
  },
  hat_trick_3_matches: {
    title: 'Hat-Trick x3',
    description: 'Scoring 3+ goals in 3 separate matches (Within a single league)',
    image: HatTrickBadge,
    color: medalGold,
  },
  captain_5_wins: {
    title: "Captain's 5 Wins",
    description: '5 wins as captain, leading the team to victory (Across all leagues)',
    image: CaptainsTriumphsBadge,
    color: medalGold,
  },
  assist_10_consecutive: {
    title: 'Assist Streak x10',
    description: 'Assist in 10 consecutive matches (Within a single league)',
    image: AssistMaestroBadge,
    color: medalGold,
  },
  scoring_10_consecutive: {
    title: 'Scoring Streak x10',
    description: 'Scoring in 10 consecutive matches (Within a single league)',
    image: GoalMachineBadge,
    color: medalGold,
  },
  captain_performance_3: {
    title: "Captain's Picks x3",
    description: "Gets 3 captain's performance pick (Within a single league)",
    image: TripleImpactBadge,
    color: medalGold,
  },
  motm_4_consecutive: {
    title: 'MOTM Streak x4',
    description: "4 consecutive 'Man of the Match' performance (Across all leagues)",
    image: StarPerformerBadge,
    color: medalGold,
  },
  clean_sheet_5_wins: {
    title: 'Clean-Sheet Win Streak x5',
    description: '5 consecutive wins with clean sheets (Across all leagues)',
    image: IronWallBadge,
    color: medalGold,
  },
  top_spot_10_matches: {
    title: 'Top Spot x10 Matches',
    description: 'Holding top spot in the league for more than 10 matches',
    image: ChartTopperBadge,
    color: medalGold,
  },
  consecutive_10_victories: {
    title: '10 In A Row',
    description: 'Securing 10 consecutive victories in a single league',
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

// Merge server-provided badges over client-computed defaults so all cards show
const mergeBadges = (client: Badge[], server: Badge[] | null | undefined): Badge[] => {
  if (!Array.isArray(server) || server.length === 0) return client;
  const serverById = new Map(server.map(b => [b.id, b] as const));
  return client.map(cb => {
    const sb = serverById.get(cb.id);
    if (!sb) return cb;
    return {
      ...cb,
      // Prefer server values when present; keep our visuals/meta
      count: Number.isFinite(Number(sb.count)) ? Number(sb.count) : cb.count,
      xp: Number.isFinite(Number(sb.xp)) ? Number(sb.xp) : cb.xp,
      unlocked: typeof sb.unlocked === 'boolean' ? sb.unlocked : cb.unlocked,
      progressText: sb.progressText ?? cb.progressText,
    };
  });
};

// --- Badge Card (gold medal) ---
const BadgeCard = ({ id, title, description, image, color, count, unlocked, progressText, xp, onOpen }: Badge & { onOpen?: () => void }) => (
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
      border: `2px solid ${unlocked ? color : medalMuted}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      overflow: 'hidden',
      px: { xs: 1, sm: 1.5, md: 2 },
      py: { xs: 1.5, sm: 2, md: 3 },
      position: 'relative',
      backgroundColor: '#fff',
      cursor: onOpen ? 'pointer' : 'default',
    }}
    onClick={onOpen}
    role="button"
  >
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Tooltip
        title={description}
        placement="top"
        arrow
        enterDelay={200}
        disableHoverListener={!description}
      >
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
            textAlign: 'center',
          }}
        >
          {description}
        </Typography>
      </Tooltip>

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
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            // Make only the Total XP card’s icon blue
            filter: id === 'rising_xp' ? BLUE_FILTER : (unlocked ? 'none' : 'grayscale(0.6)'),
          }}
        />
        {id !== 'rising_xp' && (
          <Box sx={{ position: 'absolute', top: -6, right: -6, background: unlocked ? color : medalMuted, color: '#fff', borderRadius: '12px', px: 0.75, py: 0.2, fontSize: '0.7rem', fontWeight: 700 }}>
            x{count}
          </Box>
        )}
        {/* Hide the image-bottom XP coin for Rising Star; keep for others */}
        {id !== 'rising_xp' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'transparent',
              color: '#fff',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            {xp}
          </Box>
        )}
      </Box>

      {id !== 'rising_xp' && (
        <Typography variant="caption" sx={{ color: unlocked ? '#2e7d32' : '#888', mb: 1 }}>
          {progressText}
        </Typography>
      )}

      <Typography
        variant="h6"
        sx={{
          mt: 'auto',
          color: id === 'rising_xp' ? BLUE_HEX : '#666',
          fontWeight: 'bold',
          fontSize: id === 'rising_xp'
            ? { xs: '1.15rem', sm: '2.5rem' }
            : { xs: '0.95rem', sm: '1.05rem' },
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>

      {/* For Rising Star, show XP below the title with label */}
      {id === 'rising_xp' && (
        <Typography variant="subtitle2" sx={{ color: BLUE_HEX, fontWeight: 800, mt: 0.5, fontSize: { xs: '0.9rem', sm: '2.5rem' } }}>
          {formatNumber(xp)} XP
        </Typography>
      )}
    </Box>

    {id !== 'rising_xp' && (
      <Button
        variant="contained"
        sx={{
          backgroundColor: unlocked ? color : '#94a3b8',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          py: { xs: 0.6, sm: 0.8 },
          mt: 1,
          width: '100%',
          boxShadow: 'none',
          '&:hover': { backgroundColor: unlocked ? color : '#94a3b8', boxShadow: 'none', filter: 'brightness(0.95)' },
        }}
        onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
      >
        {unlocked ? 'UNLOCKED' : 'UNLOCK'}
      </Button>
    )}
  </Paper>
);

// --- Helper function to compute XP from player stats ---
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

// const clamp = (v: number, min = 0, max = 99) => Math.max(min, Math.min(max, Math.round(v)));
// const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

// const computeSkillsFromStats = (s?: PlayerStats, user?: User): Skills => {
//   const stats: PlayerStats = s ?? { played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, motmVotes: 0, teamGoalsConceded: 0 };
//   const gpg = safeDiv(stats.goals, stats.played);
//   const apg = safeDiv(stats.assists, stats.played);
//   const winRate = safeDiv(stats.wins, stats.played);
//   const motmRate = safeDiv(stats.motmVotes, stats.played);
//   const conc = safeDiv(stats.teamGoalsConceded, stats.played);
//   const pos = (user?.position ?? '').toLowerCase();

//   const shooting = clamp(45 + gpg * 40 + motmRate * 15, 30, 99);
//   const passing = clamp(45 + apg * 40 + motmRate * 10, 30, 99);
//   const dribbling = clamp(45 + (gpg + apg) * 20 + motmRate * 20, 30, 99);
//   const pace = clamp(50 + (gpg + apg) * 15 + winRate * 20, 30, 99);
//   let defending = clamp(60 - conc * 15 + winRate * 15, 25, 99);
//   if (['defender', 'goalkeeper'].includes(pos)) defending = clamp(50 - conc * 25 + winRate * 15, 25, 99);
//   const physical = clamp(45 + winRate * 30 + stats.played * 2, 30, 99);

//   return { dribbling, shooting, passing, pace, defending, physical };
// };

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

// ADD: status normalizer (handles Completed, FINISHED, etc.)
const normalizeMatchStatus = (s: string | undefined): Match['status'] => {
  const v = String(s ?? '').toLowerCase();
  // fix: compare against lowercase 'result_published'
  if (['result_published', 'complete', 'finished', 'ended', 'done'].includes(v)) return 'RESULT_PUBLISHED';
  if (['ongoing', 'inprogress', 'in_progress', 'live', 'playing'].includes(v)) return 'ONGOING';
  return 'SCHEDULED';
};

const toTimestampMs = (value: unknown): number | null => {
  if (value == null) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeTimestampToISO = (value: unknown): string | undefined => {
  const ms = toTimestampMs(value);
  if (ms == null) return undefined;
  return new Date(ms).toISOString();
};

const formatRelativeTime = (timestampMs: number, nowMs: number): string => {
  const diffMs = Math.max(0, nowMs - timestampMs);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const hasTrophyWinner = (t: Pick<TrophyType, 'winnerId' | 'winner'>): boolean => {
  if (t.winnerId != null && String(t.winnerId).trim() !== '') return true;
  const winnerText = typeof t.winner === 'string' ? t.winner.trim() : '';
  return Boolean(winnerText && winnerText.toLowerCase() !== 'tbc');
};

const extractTrophyUpdatedMs = (t: TrophyType): number | null => {
  const record = t as unknown as Record<string, unknown>;
  const candidates: unknown[] = [
    t.awardedAt,
    t.updatedAt,
    t.createdAt,
    record.awardedOn,
    record.awardDate,
    record.wonAt,
    record.winnerAssignedAt,
    record.lastUpdatedAt,
    record.updated_at,
    record.created_at,
    record.date,
    record.timestamp,
  ];

  let latest: number | null = null;
  for (const value of candidates) {
    const ms = toTimestampMs(value);
    if (ms != null && (latest == null || ms > latest)) {
      latest = ms;
    }
  }
  return latest;
};

const isInactiveOrArchivedStatus = (status: unknown): boolean => {
  const s = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (!s) return false;
  return s.includes('archiv') || s.includes('inactiv') || s.includes('deactiv') || s === 'completed';
};

// Helper: normalize leagues from /auth/data (user.leagues + administeredLeagues)
const normalizeLeaguesFromAuthData = (u: BackendUser): { leagues: League[]; adminIds: Set<string> } => {
  const adminLeaguesArr = (u?.administeredLeagues ?? u?.adminLeagues ?? []);
  const adminIds = new Set<string>(
    adminLeaguesArr
      .map(l => (l && l.id != null ? String(l.id) : undefined))
      .filter((v): v is string => typeof v === 'string')
  );

  const srcLeagues = [
    ...(u?.leagues ?? []),
    ...adminLeaguesArr,
  ];

  // de-duplicate by id
  const byId: Record<string, BackendLeague> = {};
  srcLeagues.forEach((l: BackendLeague) => {
    if (l?.id !== undefined && l?.id !== null) byId[String(l.id)] = l;
  });
  const uniqueList = Object.values(byId);

  const toUser = (p: BackendUser): User => ({
    id: String(p?.id ?? ''),
    firstName: p?.firstName ?? '',
    lastName: p?.lastName ?? '',
    position: p?.positionType ?? p?.position ?? undefined,
  });

  const toMatch = (m: BackendMatch): Match => ({
    id: String(m?.id ?? ''),
    homeTeamGoals: Number(m?.homeTeamGoals ?? 0),
    awayTeamGoals: Number(m?.awayTeamGoals ?? 0),
    homeTeamUsers: (m?.homeTeamUsers ?? []).map(toUser),
    awayTeamUsers: (m?.awayTeamUsers ?? []).map(toUser),
    manOfTheMatchVotes: m?.manOfTheMatchVotes ?? {},
    playerStats: Object.fromEntries(
      Object.entries(m?.playerStats ?? {}).map(([playerId, stats]) => {
        const s = stats as { goals?: number | string; assists?: number | string } | undefined;
        return [
          String(playerId),
          {
            goals: Number(s?.goals ?? 0),
            assists: Number(s?.assists ?? 0),
          },
        ];
      })
    ),
    status: normalizeMatchStatus(m?.status),
  });

  const leagues = uniqueList.map((l: BackendLeague): League => ({
    id: String(l?.id ?? ''),
    name: l?.name ?? '',
    members: (l?.members ?? []).map(toUser),
    matches: (l?.matches ?? []).map(toMatch),
    maxGames: extractLeagueMaxGames(l),
    createdAt: l?.createdAt,
    updatedAt: l?.updatedAt,
    status: typeof l?.status === 'string' ? l.status : undefined,
    active: typeof l?.active === 'boolean' ? l.active : !isInactiveOrArchivedStatus(l?.status),
    archived: typeof l?.archived === 'boolean' ? l.archived : isInactiveOrArchivedStatus(l?.status) && String(l?.status ?? '').toLowerCase().includes('archiv'),
    isAdmin: adminIds.has(String(l?.id ?? '')),
  }));

  return { leagues, adminIds };
};

// Helper to normalize simple user from API leagues
// const toUserBasic = (p: any): User => ({
//   id: String(p?.id ?? ''),
//   firstName: p?.firstName ?? '',
//   lastName: p?.lastName ?? '',
//   position: p?.positionType ?? p?.position ?? undefined,
// });

// Keep this for /leagues/trophy-room response
// const normalizeLeagueFromApi = (l: any): League => ({
//   id: String(l?.id ?? ''),
//   name: l?.name ?? '',
//   members: Array.isArray(l?.members) ? l.members.map(toUserBasic) : [],
//   matches: Array.isArray(l?.matches)
//     ? l.matches.map((m: any): Match => ({
//         id: String(m?.id ?? ''),
//         homeTeamGoals: Number(m?.homeTeamGoals ?? 0),
//         awayTeamGoals: Number(m?.awayTeamGoals ?? 0),
//         homeTeamUsers: Array.isArray(m?.homeTeamUsers) ? m.homeTeamUsers.map(toUserBasic) : [],
//         awayTeamUsers: Array.isArray(m?.awayTeamUsers) ? m.awayTeamUsers.map(toUserBasic) : [],
//         manOfTheMatchVotes: m?.manOfTheMatchVotes ?? {},
//         playerStats: Object.fromEntries(
//           Object.entries(m?.playerStats ?? {}).map(([pid, s]: any) => [
//             String(pid),
//             { goals: Number(s?.goals ?? 0), assists: Number(s?.assists ?? 0) },
//           ])
//         ),
//         status: normalizeMatchStatus(m?.status),
//       }))
//     : [],
//   maxGames: Number(l?.maxGames ?? 0),
// });

// Freeze member positions for completed leagues (keep the position at league end)
// const freezeLeaguePositions = (league: League): League => {
//   if (!isLeagueCompleted(league)) return league;

//   const completed = (league.matches ?? []).filter(m => m.status === 'RESULT_PUBLISHED');
//   if (!completed.length) return league;

//   const lastPos: Record<string, string | undefined> = {};
//   completed.forEach(m => {
//     const take = (u: User) => {
//       const pos = (u.position ?? '').toString();
//       if (pos) lastPos[u.id] = pos;
//     };
//     (m.homeTeamUsers ?? []).forEach(take);
//     (m.awayTeamUsers ?? []).forEach(take);
//   });

//   const frozenMembers = (league.members ?? []).map(u => ({
//     ...u,
//     position: lastPos[u.id] ?? u.position,
//   }));

//   console.debug('[TrophyRoom] freezeLeaguePositions()', {
//     leagueId: league.id,
//     name: league.name,
//     completedMatches: completed.length,
//     membersFrozen: frozenMembers.length,
//   });

//   return { ...league, members: frozenMembers };
// };

// --- Main Page Component ---
export default function GlobalTrophyRoom() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [leagues, setLeagues] = useState<League[]>([]);
  const [backendTotalXP, setBackendTotalXP] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [trophyLoading, setTrophyLoading] = useState(false); // separate loading for trophy re-fetches (season/league change)
  const [apiLastUpdatedAt, setApiLastUpdatedAt] = useState<string | null>(null);
  const [relativeNowMs, setRelativeNowMs] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [completionTab, setCompletionTab] = useState<'completed' | 'uncompleted'>('uncompleted');
  const { user, token } = useAuth();
  const [serverBadges, setServerBadges] = useState<Badge[] | null>(null);
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRelativeNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Helper: determine if a league is completed (season-aware)
  const leagueIsCompleted = React.useCallback((l: League): boolean => {
    // Prefer backend-computed season-based completion status
    if (l?.computedStatus?.isCompleted === true) return true;
    if (l?.archived === true) return true;

    const missingArr = Array.isArray(l?.computedStatus?.missing) ? l.computedStatus!.missing! : [];
    if (missingArr.length > 0) return false;

    const toNum = (v: unknown): number | undefined => {
      const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      return Number.isFinite(n) ? n : undefined;
    };
    const playedFromComputed = toNum(l?.computedStatus?.matchesPlayed) ?? toNum(l?.computedStatus?.gamesPlayed);
    const played = playedFromComputed;
    const maxG = toNum(l?.computedStatus?.maxGames) ?? toNum(l?.maxGames);

    if (Array.isArray(l.matches)) {
      const matches = l.matches ?? [];
      const completedCount = matches.reduce((acc, m) => {
        const status = typeof m.status === 'string' ? m.status.toLowerCase() : '';
        const endedByStatus = status === 'completed' || status === 'finished' || status === 'ended';
        const endedByFlag = m.active === false;
        const endedByEnd = Boolean(m.end);
        return acc + (endedByStatus || endedByFlag || endedByEnd ? 1 : 0);
      }, 0);
      if (typeof maxG === 'number' && maxG > 0) {
        if (completedCount < maxG) return false;
        return true;
      }
    }

    if (typeof maxG === 'number' && maxG > 0 && typeof played === 'number') {
      if (played < maxG) return false;
      return true;
    }

    if (l?.computedStatus?.isComplete === true) return true;
    if (l?.computedStatus?.locked === true) return true;
    if (l?.isComplete === true) return true;
    if (l?.isCompleted === true) return true;
    if (l?.isLocked === true) return true;

    const sRaw = (l?.status ?? '').toString();
    const s = sRaw.trim().toUpperCase();
    const completionStatuses = new Set(['RESULT_PUBLISHED', 'RESULT_UPLOADED', 'RESULT_COMPLETE', 'RESULT_FINISHED', 'RESULT_ENDED', 'RESULT_DONE', 'COMPLETED']);
    if (completionStatuses.has(s)) return true;
    if (isInactiveOrArchivedStatus(sRaw)) return true;
    if (typeof l?.active === 'boolean' && l.active === false) return true;
    return false;
  }, []);

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
    defensiveImpact?: number;
    mentality?: number;
    // NEW: backend XP fields
    xp?: number;
    xpLatest?: number;
    xpRecentTotal?: number;
    profileXP?: number;
  }>({});

  // League filter dropdown (like league page)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | 'all' | null>(null);
  const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
  const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);

  // Season filter dropdown
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
  const [seasonsDropdownOpen, setSeasonsDropdownOpen] = useState(false);
  const [seasonsDropdownAnchor, setSeasonsDropdownAnchor] = useState<null | HTMLElement>(null);
  // Dedicated seasons state — avoids fragile leagues.find().seasons chain
  const [leagueSeasons, setLeagueSeasons] = useState<Season[]>([]);

  // Add missing handlers
  const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLeaguesDropdownAnchor(event.currentTarget);
    setLeaguesDropdownOpen(true);
  };
  const handleLeaguesDropdownClose = () => {
    setLeaguesDropdownOpen(false);
    setLeaguesDropdownAnchor(null);
  };
  const handleLeagueSelect = (id: string | 'all') => {
    const newId = id === 'all' ? 'all' : String(id);
    setSelectedLeagueId(newId);
    if (newId !== 'all') {
      try {
        localStorage.setItem(PREFERRED_LEAGUE_KEY, newId);
      } catch (err) {
        console.error('[Trophy Room] Failed to save preferred league:', err);
      }
    }
    // Reset season state — the fetchSeasons effect will re-fetch and auto-select
    setSelectedSeasonId(undefined);
    setLeagueSeasons([]);
    handleLeaguesDropdownClose();
  };

  // Season dropdown handlers
  const handleSeasonsDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSeasonsDropdownAnchor(event.currentTarget);
    setSeasonsDropdownOpen(true);
  };
  const handleSeasonsDropdownClose = () => {
    setSeasonsDropdownOpen(false);
    setSeasonsDropdownAnchor(null);
  };
  const handleSeasonSelect = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    handleSeasonsDropdownClose();
  };

  // Helper to format the league button label
  const LEAGUE_NAME_MAX = 20;
  const truncateLeagueName = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed.length <= LEAGUE_NAME_MAX) return trimmed;
    return `${trimmed.slice(0, LEAGUE_NAME_MAX - 3)}...`;
  };

  const formatLeagueName = (name: string): string => {
    if (!name) return '';
    const trimmed = String(name).trim();
    const words = trimmed.split(/\s+/);
    const initials = words.map(w => (w[0] || '').toUpperCase()).join('');
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return truncateLeagueName(`${capitalized}`);
  };

  // Badge detail modal state
  const [openBadgeDlg, setOpenBadgeDlg] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const openBadgeDetail = (b: Badge) => { setSelectedBadge(b); setOpenBadgeDlg(true); };
  const closeBadgeDetail = () => { setOpenBadgeDlg(false); setSelectedBadge(null); };

  const [apiAllWinners, setApiAllWinners] = useState<TrophyType[] | null>(null);
  const [myAllTrophies, setMyAllTrophies] = useState<TrophyType[] | null>(null);


  // Helper to attach local meta (image/color/description) by title
  const attachTrophyMeta = (items: Array<{
    title: string;
    winnerId: string | number | null;
    winner: string | null;
    leagueId?: string | number;
    leagueName?: string;
    seasonId?: string | number;
    seasonName?: string;
    [key: string]: unknown;
  }>): TrophyType[] => {
    return items.map(it => {
      const meta = trophies.find(t => t.title === it.title);
      const awardedAt = normalizeTimestampToISO(
        it.awardedAt ?? it.awardedOn ?? it.awardDate ?? it.wonAt ?? it.winnerAssignedAt ?? it.date ?? it.timestamp
      );
      const updatedAt = normalizeTimestampToISO(
        it.updatedAt ?? it.modifiedAt ?? it.lastUpdatedAt ?? it.updated_at
      );
      const createdAt = normalizeTimestampToISO(
        it.createdAt ?? it.created_at
      );
      return {
        title: it.title,
        description: meta?.description ?? '',
        image: meta?.image ?? TrophyImg,
        color: meta?.color ?? '#999',
        winner: it.winner ?? null,
        winnerId: it.winnerId != null ? String(it.winnerId) : null,
        leagueId: it.leagueId != null ? String(it.leagueId) : undefined,
        leagueName: it.leagueName,
        seasonId: it.seasonId != null ? String(it.seasonId) : undefined,
        seasonName: it.seasonName,
        awardedAt,
        updatedAt,
        createdAt,
      };
    });
  };

  useEffect(() => {
    // PRIORITY 1: Fetch leagues FIRST (blocking), then render UI
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true); // Keep loading screen until data is ready
      try {
        // Fetch leagues data with cache-busting
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status?_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.error('[Trophy Room] auth/status failed:', res.status);
          setLeagues([]);
          setLoading(false);
          return;
        }
        const data = await res.json().catch(() => null);

        if (data && (data?.user || data?.success)) {
          const userPayload = data?.user ?? data;
          const { leagues: rawLeagues, adminIds } = normalizeLeaguesFromAuthData(userPayload);

          // NO EXTRA API CALLS - Use data from /auth/status directly
          const enrichedLeagues = rawLeagues.map((league) => {
            const leagueId = String(league.id);
            const isAdmin = adminIds.has(leagueId);
            return {
              ...league,
              isAdmin,
            } as League;
          });

          // Show only visible leagues (active + non-archived + not completed)
          const activeLeagues = enrichedLeagues.filter(
            (l) => l.active !== false && l.archived !== true && !isInactiveOrArchivedStatus(l.status) && !leagueIsCompleted(l)
          );

          // Sort alphabetically
          activeLeagues.sort((a, b) => {
            const an = (a?.name ?? '').toString().trim().toLowerCase();
            const bn = (b?.name ?? '').toString().trim().toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return String(a.id).localeCompare(String(b.id));
          });

          setLeagues(activeLeagues);

          // Auto-select preferred league from localStorage or first league
          if (activeLeagues.length > 0) {
            const storedId = typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_LEAGUE_KEY) : null;
            const preferred = storedId ? activeLeagues.find(l => l.id === storedId) : null;
            if (preferred) {
              setSelectedLeagueId(preferred.id);
            } else {
              // Select first league by default
              setSelectedLeagueId(activeLeagues[0].id);
            }
          }

          console.log('[Trophy Room] Total:', enrichedLeagues.length, 'Active:', activeLeagues.length);

          // Extract XP from auth payload
          try {
            const maybeUser = data?.user ?? data;
            if (isBackendUser(maybeUser)) {
              const derivedXP = extractTotalXP(maybeUser);
              if (typeof derivedXP === 'number' && Number.isFinite(derivedXP)) {
                setBackendTotalXP(derivedXP);
              }
            }
          } catch { }
        } else {
          setLeagues([]);
        }
      } catch (err) {
        console.error('[Trophy Room] Failed to fetch leagues:', err);
        setLeagues([]);
      } finally {
        // Only hide loading after data is ready
        setLoading(false);
      }
    })();
  }, [token, leagueIsCompleted]);

  // Extract years dynamically from existing leagues only
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<string>();
    console.log('[Trophy Room] Extracting years from leagues:', leagues.length);
    leagues.forEach((l, idx) => {
      console.log(`[Trophy Room] League ${idx}: name=${l.name}, createdAt=${l.createdAt}`);
      if (l.createdAt) {
        const t = Date.parse(l.createdAt);
        if (Number.isFinite(t)) {
          const year = new Date(t).getFullYear();
          console.log(`[Trophy Room] Added year: ${year}`);
          yearsSet.add(String(year));
        }
      }
    });
    const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    console.log('[Trophy Room] Final yearOptions:', years);
    // Sort descending (newest first)
    return years;
  }, [leagues]);

  // Completed logic similar to AllLeagues for filtering lists (maxGames reached)
  const isLeagueCompletedTab = useCallback((l: League): boolean => {
    const max = typeof l.maxGames === 'number' ? l.maxGames : 0;
    if (max <= 0) return false;
    const completedCount = countCompletedMatches(l);
    return completedCount >= max;
  }, []);

  // Filter leagues for dropdown by year only (ignore completion tab and search)
  const filteredLeagues = useMemo(() => {
    console.log('[Trophy Room] Filtering leagues. selectedYear:', selectedYear, 'total leagues:', leagues.length);
    const byYear = selectedYear === 'all' ? leagues : leagues.filter(l => {
      const t = Date.parse(l.createdAt || '');
      if (!Number.isFinite(t)) {
        console.log(`[Trophy Room] League ${l.name} has invalid createdAt:`, l.createdAt);
        return false;
      }
      const year = String(new Date(t).getFullYear());
      const matches = year === selectedYear;
      console.log(`[Trophy Room] League ${l.name}: year=${year}, matches=${matches}`);
      return matches;
    });
    console.log('[Trophy Room] Filtered leagues count:', byYear.length);
    return byYear;
  }, [leagues, selectedYear]);

  // Ensure selectedLeagueId remains visible in filtered set; if not, choose first
  useEffect(() => {
    if (!filteredLeagues.length) return;
    if (selectedLeagueId && selectedLeagueId !== 'all' && filteredLeagues.some(l => l.id === selectedLeagueId)) return;
    setSelectedLeagueId(filteredLeagues[0].id);
    // Keep season selection scoped per league when this auto-switch runs.
    setSelectedSeasonId(undefined);
    setLeagueSeasons([]);
  }, [filteredLeagues, selectedLeagueId]);

  // Get currently selected league
  const selectedLeague = selectedLeagueId && selectedLeagueId !== 'all'
    ? leagues.find(l => l.id === selectedLeagueId)
    : null;

  // Fetch seasons for the selected league
  useEffect(() => {
    // Reset when league changes
    setSeasonsChecked(false);
    setLeagueSeasons([]);

    if (!selectedLeagueId || selectedLeagueId === 'all' || !token) {
      console.log('[Trophy Room] Skipping season fetch - no league or token');
      return;
    }

    const leagueId = selectedLeagueId;
    const controller = new AbortController();
    let isActive = true;

    const fetchSeasons = async () => {
      console.log('[Trophy Room] Fetching seasons for league:', leagueId);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/seasons?_=${Date.now()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );
        if (!isActive) return;

        if (!res.ok) {
          console.log('[Trophy Room] Seasons API not OK:', res.status);
          if (isActive) setSeasonsChecked(true);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!isActive) return;
        console.log('[Trophy Room] Seasons API response:', { status: res.status, data });

        if (data?.success && Array.isArray(data.seasons) && data.seasons.length > 0) {
          // Store seasons in dedicated state (NOT in leagues array)
          setLeagueSeasons(data.seasons);
          // Directly select the active season
          const active = data.seasons.find((s: Season) => s.isActive) || data.seasons[0];
          if (active) {
            console.log('[Trophy Room] ✅ Directly selecting season:', active.id, active.name);
            setSelectedSeasonId(active.id);
          }
          setSeasonsChecked(true);
          console.log('[Trophy Room] ✅ Fetched seasons:', data.seasons.length);
        } else {
          // No seasons or failed — mark as checked so trophy fetch proceeds
          console.log('[Trophy Room] No seasons or bad response');
          setSeasonsChecked(true);
        }
      } catch (err) {
        console.error('[Trophy Room] ❌ Error fetching seasons:', err);
        setSeasonsChecked(true);
      }
    };

    fetchSeasons();
  }, [selectedLeagueId, token]);

  // Available seasons — derived from dedicated leagueSeasons state (stable, no chain)
  const availableSeasons = useMemo(() => {
    if (leagueSeasons.length === 0) return [];
    return [...leagueSeasons].sort((a, b) => b.seasonNumber - a.seasonNumber);
  }, [leagueSeasons]);

  // The season to display in the UI
  const displaySeason = useMemo(() => {
    if (leagueSeasons.length === 0) return null;
    if (selectedSeasonId) {
      const found = leagueSeasons.find(s => s.id === selectedSeasonId);
      if (found) return found;
    }
    // Fallback: active season or first
    return leagueSeasons.find(s => s.isActive) || leagueSeasons[0] || null;
  }, [selectedSeasonId, leagueSeasons]);

  // Track whether seasons have been checked for the current league
  // This lets fetchWinners proceed without a season when the league genuinely has none
  const [seasonsChecked, setSeasonsChecked] = useState(false);

  // Fetch trophy winners with league and season filters
  useEffect(() => {
    if (!token || !selectedLeagueId || selectedLeagueId === 'all') return;

    // Wait for season selection OR confirmation that no seasons exist
    if (!selectedSeasonId && !seasonsChecked) {
      console.log('[Trophy Room] Waiting for season auto-select or seasons check...');
      return;
    }

    const fetchWinners = async () => {
      setTrophyLoading(true);
      try {
        const params = new URLSearchParams({ _: Date.now().toString() });
        params.append('leagueId', selectedLeagueId);

        if (selectedSeasonId && selectedSeasonId !== 'all') {
          params.append('seasonId', selectedSeasonId);
        }

        const url = `${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?${params.toString()}`;
        console.log('[Trophy Room] Fetching trophies with filters:', {
          url,
          leagueId: selectedLeagueId,
          seasonId: selectedSeasonId
        });

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error('[TrophyRoom] /leagues/trophy-room failed:', res.status);
          setApiAllWinners([]);
          setApiLastUpdatedAt(null);
          setError('Failed to load trophy room.');
          return;
        }

        const data = await res.json().catch(() => null);

        if (data?.success) {
          const trophiesWithMeta = Array.isArray(data.trophyWinners) ? attachTrophyMeta(data.trophyWinners) : [];
          console.log('[Trophy Room] ✅ Fetched trophies:', trophiesWithMeta.length, trophiesWithMeta);
          setApiAllWinners(trophiesWithMeta);
          setApiLastUpdatedAt(typeof data.lastUpdatedAt === 'string' ? data.lastUpdatedAt : null);
          setBackendTotalXP(typeof data.backendTotalXP === 'number' ? data.backendTotalXP : undefined);
          setError(null);
        } else {
          console.error('[TrophyRoom] /leagues/trophy-room bad response', { status: res.status, data });
          setApiAllWinners([]);
          setApiLastUpdatedAt(null);
          setError(data?.message || 'Failed to load trophy room.');
        }
      } catch (e) {
        console.error('[TrophyRoom] fetchWinners error', e);
        setApiAllWinners([]);
        setApiLastUpdatedAt(null);
        setError('An error occurred while fetching trophy room.');
      } finally {
        setTrophyLoading(false);
      }
    };
    fetchWinners();
  }, [token, selectedLeagueId, selectedSeasonId, seasonsChecked]); // Re-fetch when league or season changes

  // Persist and fetch achievements for the current user (saves XP to DB, then loads badges)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // First, persist any newly unlocked achievements and ensure XP is saved to profile
        try {
          const awardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/achievements/award?_=${Date.now()}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const awardJson = await awardRes.json().catch(() => ({}));
          if (awardRes.ok && awardJson?.success && Number.isFinite(Number(awardJson.totalXP))) {
            setBackendTotalXP(Number(awardJson.totalXP));
          }
        } catch { }

        // Then, fetch server-computed achievements summary for display
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
        } else {
          setServerBadges(null);
        }
      } catch {
        setServerBadges(null);
      }
    })();
  }, [token]);

  // Fetch ALL trophies won by current user across all leagues and seasons (for My Achievements)
  useEffect(() => {
    if (!token || !user || !leagues || leagues.length === 0) return;

    (async () => {
      try {
        const allUserTrophies: TrophyType[] = [];

        // Iterate through all leagues where user is a member
        for (const league of leagues) {
          // First, fetch seasons for this league from the API
          let seasons: Season[] = [];
          try {
            const seasonsRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons?_=${Date.now()}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (seasonsRes.ok) {
              const seasonsData = await seasonsRes.json().catch(() => null);
              if (seasonsData?.success && Array.isArray(seasonsData.seasons)) {
                seasons = seasonsData.seasons;
              }
            }
          } catch {
            // Ignore — will fall through to no-season fetch
          }

          if (seasons.length === 0) {
            // No seasons, try fetching trophies for league without season filter
            try {
              const url = `${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?leagueId=${league.id}&_=${Date.now()}`;
              const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const data = await res.json().catch(() => null);
                if (data?.success && Array.isArray(data.trophyWinners)) {
                  const trophiesWithMeta = attachTrophyMeta(data.trophyWinners);
                  const userTrophies = trophiesWithMeta.filter(t => t.winnerId && String(t.winnerId) === String(user.id));
                  allUserTrophies.push(...userTrophies);
                }
              }
            } catch { /* skip this league */ }
          } else {
            // Fetch trophies for each season in this league
            for (const season of seasons) {
              try {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?leagueId=${league.id}&seasonId=${season.id}&_=${Date.now()}`;
                const res = await fetch(url, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  const data = await res.json().catch(() => null);
                  if (data?.success && Array.isArray(data.trophyWinners)) {
                    const trophiesWithMeta = attachTrophyMeta(data.trophyWinners);
                    const userTrophies = trophiesWithMeta.filter(t => t.winnerId && String(t.winnerId) === String(user.id));
                    allUserTrophies.push(...userTrophies);
                  }
                }
              } catch { /* skip this season */ }
            }
          }
        }

        console.log('[My Achievements] Total user trophies found:', allUserTrophies.length);
        setMyAllTrophies(allUserTrophies);
      } catch (e) {
        console.error('[My Achievements] Error fetching all trophies:', e);
        setMyAllTrophies([]);
      }
    })();
  }, [token, user?.id, leagues]); // Re-fetch when user or leagues change

  // Auto-select a default league (prefer a completed league, else first) - REMOVED to prevent double refresh
  // Initial selection is now done in the first useEffect after leagues are fetched
  // useEffect(() => {
  //   if (!leagues?.length) return;
  //   if (selectedLeagueId !== 'all' && leagues.some(l => l.id === selectedLeagueId)) return;
  //   const completed = leagues.find(l => leagueIsCompleted(l));
  //   const defaultId = completed?.id ?? leagues[0].id;
  //   setSelectedLeagueId(String(defaultId));
  // }, [leagues, selectedLeagueId, leagueIsCompleted]);

  // Use API-provided winners directly (already filtered by selectedLeagueId and seasonId on the server)
  const baseTrophies: TrophyType[] =
    filter === 'all'
      ? (apiAllWinners ?? [])
      : [];

  console.log('[Trophy Room] Base trophies:', {
    filter,
    apiAllWinners: apiAllWinners?.length || 0,
    baseTrophies: baseTrophies.length,
    selectedLeagueId,
    selectedSeasonId,
  });

  const trophiesToDisplayBase: TrophyType[] =
    selectedLeagueId === 'all'
      ? baseTrophies
      : baseTrophies.filter(t => {
        const matchesLeague = t.leagueId === selectedLeagueId;
        const matchesSeason = !selectedSeasonId || !t.seasonId || t.seasonId === selectedSeasonId;
        const matches = matchesLeague && matchesSeason;

        console.log('[Trophy Room] Trophy filter:', {
          title: t.title,
          trophyLeagueId: t.leagueId,
          trophySeasonId: t.seasonId,
          selectedLeagueId,
          selectedSeasonId,
          matchesLeague,
          matchesSeason,
          matches,
        });

        return matches;
      });

  console.log('[Trophy Room] Trophies to display base:', {
    count: trophiesToDisplayBase.length,
    trophies: trophiesToDisplayBase.map(t => ({ title: t.title, winner: t.winner, seasonId: t.seasonId })),
  });

  // Add debug + flags for the standing label
  const selectedLeagueFlags = useMemo(() => {
    if (!selectedLeague) return null;
    const completedCount = countCompletedMatches(selectedLeague, selectedSeasonId);
    const max = Number(selectedLeague.maxGames ?? 0);
    const final = isFinalLeagueStanding(selectedLeague);
    const statuses = Array.from(new Set((selectedLeague.matches ?? []).map(m => m.status)));

    console.debug('[Standing Label]', {
      leagueId: selectedLeague.id,
      name: selectedLeague.name,
      seasonId: selectedSeasonId,
      maxGames: max,
      completedCount,
      statuses,
      final,
    });
    if (!final) {
      console.debug('[Standing Label] Not final yet', {
        missingToMaxGames: Math.max(0, max - completedCount),
      });
    }
    return { final, completedCount, max, statuses };
  }, [selectedLeague, selectedSeasonId]);

  const lastUpdatedAtMs = useMemo(() => {
    const winnerTrophies = trophiesToDisplayBase.filter((t) => hasTrophyWinner(t));
    if (winnerTrophies.length === 0) return null;

    const candidates: number[] = winnerTrophies
      .map((trophy) => extractTrophyUpdatedMs(trophy))
      .filter((ms): ms is number => typeof ms === 'number' && Number.isFinite(ms));

    const topLevelMs = toTimestampMs(apiLastUpdatedAt);
    if (topLevelMs != null) candidates.push(topLevelMs);

    return candidates.length > 0 ? Math.max(...candidates) : null;
  }, [trophiesToDisplayBase, apiLastUpdatedAt]);

  const lastUpdatedLabel = useMemo(() => {
    if (lastUpdatedAtMs == null) return 'No trophy updates yet';
    return formatRelativeTime(lastUpdatedAtMs, relativeNowMs);
  }, [lastUpdatedAtMs, relativeNowMs]);

  // Helper to build placeholder trophies for a league (winners TBC)
  const buildPlaceholders = (league: League): TrophyType[] =>
    trophies.map(t => ({
      ...t,
      winner: 'TBC',
      winnerId: null,
      leagueId: league.id,
      leagueName: league.name,
      seasonId: displaySeason?.id,
      seasonName: displaySeason?.name,
    }));

  // If a specific league is selected but there are no trophies (e.g., league not completed), show placeholders.
  const trophiesToDisplay: TrophyType[] =
    selectedLeague && trophiesToDisplayBase.length === 0
      ? buildPlaceholders(selectedLeague)
      : trophiesToDisplayBase;

  console.log('[Trophy Room] Final trophies to display:', {
    count: trophiesToDisplay.length,
    selectedLeague: selectedLeague?.name,
    selectedSeason: displaySeason?.name,
    trophies: trophiesToDisplay.map(t => ({
      title: t.title,
      winner: t.winner,
      seasonId: t.seasonId,
      seasonName: t.seasonName
    })),
  });

  // Build My Achievements (badges) for the current user (use backend XP if provided)
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

  // Total XP from badges (exclude Rising XP level box from this sum)
  // const totalBadgeXP = useMemo(
  //   () => myBadges.reduce((sum, b) => {
  //     if (b.id === 'rising_xp') return sum; // exclude profile XP box
  //     const xp = Number(b.xp);
  //     const count = Number(b.count);
  //     const add = (Number.isFinite(xp) ? xp : 0) * (Number.isFinite(count) ? count : 0);
  //     return sum + add;
  //   }, 0),
  //   [myBadges]
  // );

  // Open modal for a trophy winner (uses the league of that trophy)
  const openPlayerQuickView = async (trophy: TrophyType) => {
    if (!trophy.winnerId || !trophy.leagueId || !token) return;

    try {
      // Fetch quick-view, full player profile, and league stats in parallel
      const [quickViewRes, playerRes, statsRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(String(trophy.leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view?_=${Date.now()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/players/${encodeURIComponent(String(trophy.winnerId))}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/players/${encodeURIComponent(String(trophy.winnerId))}/stats?leagueId=${encodeURIComponent(String(trophy.leagueId))}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      const [data, playerData, statsData] = await Promise.all([
        quickViewRes.json(),
        playerRes.json().catch(() => ({ success: false })),
        statsRes.json().catch(() => ({ success: false })),
      ]);

      if (!quickViewRes.ok || !data?.success) return;

      // fullPlayer has skills, xp, profilePicture
      const fullPlayer = playerData?.success ? playerData.player : null;
      const matchStats = statsData?.success ? statsData.stats : null;

      const league = leagues.find(l => l.id === String(data.league?.id ?? trophy.leagueId)) ?? null;
      // fallback: find from local leagues for profilePicture
      const localMember = league?.members?.find((m: User) => m.id === String(trophy.winnerId));

      const player: User & PlayerProfileLike = {
        id: String(fullPlayer?.id ?? data.player?.id ?? trophy.winnerId),
        firstName: fullPlayer?.firstName ?? data.player?.firstName ?? '',
        lastName: fullPlayer?.lastName ?? data.player?.lastName ?? '',
        position: fullPlayer?.position ?? data.player?.position,
        preferredFoot: fullPlayer?.preferredFoot ?? data.player?.preferredFoot,
        shirtNumber: fullPlayer?.shirtNumber ?? data.player?.shirtNumber,
        profilePicture: fullPlayer?.profilePicture ?? data.player?.profilePicture ?? localMember?.profilePicture ?? null,
        avatarUrl: fullPlayer?.profilePicture ?? data.player?.profilePicture ?? localMember?.profilePicture ?? undefined,
      };

      const stats: PlayerStats = {
        played: Number(matchStats?.played ?? data.stats?.played ?? 0),
        wins: Number(matchStats?.wins ?? data.stats?.wins ?? 0),
        draws: Number(matchStats?.draws ?? data.stats?.draws ?? 0),
        losses: Number(matchStats?.losses ?? data.stats?.losses ?? 0),
        goals: Number(matchStats?.goals ?? data.stats?.goals ?? 0),
        assists: Number(matchStats?.assists ?? data.stats?.assists ?? 0),
        motmVotes: Number(matchStats?.motmVotes ?? data.stats?.motmVotes ?? 0),
        teamGoalsConceded: Number(matchStats?.teamGoalsConceded ?? data.stats?.teamGoalsConceded ?? 0),
      };

      // Prefer fullPlayer.skills, then quick-view skills
      const skillsSrc = fullPlayer?.skills ?? data.skills;
      const skills: Skills | undefined = skillsSrc
        ? {
          dribbling: Number(skillsSrc.dribbling ?? 0),
          shooting: Number(skillsSrc.shooting ?? 0),
          passing: Number(skillsSrc.passing ?? 0),
          pace: Number(skillsSrc.pace ?? 0),
          defending: Number(skillsSrc.defending ?? 0),
          physical: Number(skillsSrc.physical ?? 0),
        }
        : undefined;

      const lastFive: UserMatchSummary[] = Array.isArray(data.lastFive) ? data.lastFive : [];
      const cleanSheets: number = Number(data.cleanSheets ?? 0);
      const motmCount: number = Number(data.motmCount ?? 0);
      const defensiveImpact: number = Number(data.defensiveImpact ?? 0);
      const mentality: number = Number(data.mentality ?? 0);

      // NEW: prefer backend XP fields
      const pickNumber = (...vals: Array<number | string | null | undefined>): number => {
        for (const v of vals) {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return 0;
      };
      const xp = pickNumber(fullPlayer?.xp, data.xp, data.profileXP, data.xpLatest, data.xpRecentTotal, data.player?.xp);
      const xpLatest = pickNumber(data.xpLatest);
      const xpRecentTotal = pickNumber(data.xpRecentTotal);
      const profileXP = pickNumber(fullPlayer?.xp, data.profileXP, data.player?.xp);

      setQuickView({
        player,
        league: league ?? undefined,
        lastFive,
        stats,
        trophyTitle: trophy.title,
        skills,
        cleanSheets,
        motmCount,
        defensiveImpact,
        mentality,
        // NEW: backend XP
        xp,
        xpLatest,
        xpRecentTotal,
        profileXP,
      });
      setOpenQuickView(true);
    } catch {
      // On API error, do not compute skills locally
      const league = leagues.find(l => l.id === trophy.leagueId);
      if (!league) return;
      const player = league.members.find(m => m.id === trophy.winnerId);
      if (!player) return;

      // You may still show basic stats from local league if desired, but no skills calculation
      const perLeague = summarizeUserMatchesByLeague(player.id, [league]);
      const allMatches = perLeague[league.id] ?? [];
      const list = allMatches.slice(-10).reverse();
      const stats = calculatePlayerStats(league)[player.id];

      setQuickView({
        player,
        league,
        lastFive: list,
        stats,
        trophyTitle: trophy.title,
        skills: undefined, // no local compute
        cleanSheets: allMatches.filter(m => m.conceded === 0).length,
        motmCount: allMatches.filter(m => m.motmVotes > 0).length,
      });
      setOpenQuickView(true);
    }
  };

  if (loading) {
    return <TrophyRoomLoadingSkeleton />;
  }

  if (error) {
    return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  }

  // UI
  return (
    <Box sx={{
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* Full-Width Header Section */}
      <Box sx={{
        mt: 0,
        mb: { xs: 1.5, sm: 4 },
      }}>
        {/* Orange top border */}
        {/* <Box sx={{ height: '4px', bgcolor: '#E56A16', width: '100%' }} /> */}

        <Paper sx={{
          px: { xs: 1.5, sm: 3, md: 4 },
          py: 1.5,
          background: '#0e0e0e',
          color: 'white',
          borderRadius: 0,
          minHeight: { xs: 'var(--header-mobile-min-height)', sm: 'auto' },
          width: '100vw',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          {/* Centered League Name with Trophy Icon */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            gap: 0.5
          }}>
            {/* Trophy Icon + League Name / User Name + Dropdown */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: { xs: 0.7, sm: 1.5 },
              mt: { xs: 1.5, sm: 4 },
              width: '100%',
              justifyContent: 'center',
            }}>
              {filter !== 'my' && (
                <Image
                  src={LeagueIcon}
                  alt="League Icon"
                  width={isMobile ? 36 : 49}
                  height={isMobile ? 36 : 49}
                  style={{ objectFit: 'contain', pointerEvents: 'none' }}
                />
              )}
              {filter === 'my' ? (
                <Typography
                  sx={{
                    fontFamily: '"Oswald", sans-serif !important',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    fontSize: { xs: '32px', sm: '42px', md: '55px' },
                    wordBreak: 'break-word',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'normal',
                    flexShrink: 1,
                    minWidth: 0,
                    color: 'white',
                    mt: 1.3,
                    mb:2.8
                  }}
                >
                  {user?.firstName || ''} {user?.lastName || ''}
                </Typography>
              ) : selectedLeague ? (
                <Button
                  onClick={handleLeaguesDropdownOpen}
                  sx={{
                    fontFamily: '"Oswald", sans-serif !important',
                    textTransform: 'uppercase',
                    fontSize: { xs: '32px', sm: '42px', md: '55px' },
                    fontWeight: 700,
                    lineHeight: 1.1,
                    wordBreak: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 1,
                    minWidth: 0,
                    maxWidth: { xs: '80vw', sm: '70vw', md: '60vw' },
                    textAlign: 'center',
                    color: 'white',
                    backgroundColor: 'transparent',
                    borderRadius: 0,
                    px: 0,
                    py: 0,
                    height: { xs: 'auto', sm: 'auto' },
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                  endIcon={
                      <Box
                                                                                component="span"
                                                                                sx={{
                                                                                    width: 0,
                                                                                    height: 0,
                                                                                    borderLeft: { xs: '6px solid transparent', sm: '10px solid transparent' },
                                                                                    borderRight: { xs: '6px solid transparent', sm: '10px solid transparent' },
                                                                                    borderTop: { xs: '10px solid #FFFFFF', sm: '16px solid #FFFFFF' },
                                                                                    display: 'inline-block',
                                                                                    ml: 0.5,
                    mr:4

                                                                                }}
                                                                            />
                  }
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      maxWidth: { xs: '68vw', sm: '58vw', md: '48vw' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    }}
                  >
                    {formatLeagueName(selectedLeague.name)}
                  </Box>
                </Button>
              ) : (
                <Typography
                  sx={{
                    textTransform: 'uppercase',
                    fontFamily: '"Oswald", sans-serif !important',
                    fontSize: { xs: '32px', sm: '42px', md: '55px' },
                    fontWeight: 700,
                    color: 'white',
                    lineHeight: 1,
                  }}
                >
                  Trophy Room
                </Typography>
              )}
            </Box>

            {/* Season indicator with dropdown */}
            {filter !== 'my' && displaySeason && (
              <Button
                onClick={handleSeasonsDropdownOpen}
                sx={{
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 400,
                  mt: -1,
                  textTransform: 'none',
                  px: 0,
                  py: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                  },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
                endIcon={
                  <Box
                    component="span"
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '10px solid rgba(255,255,255,0.9)',
                      display: 'inline-block',
                    }}
                  />
                }
              >
                (#{displaySeason.name})
              </Button>
            )}
          </Box>

          {/* Seasons Dropdown Menu */}
          <Menu
            anchorEl={seasonsDropdownAnchor}
            open={seasonsDropdownOpen}
            onClose={handleSeasonsDropdownClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            marginThreshold={0}
            PaperProps={{
              sx: {
                p: 0.5,
                mt: 1,
                minWidth: { xs: 170, sm: 200 },
                ml: { xs: -1.5, sm: -1.5 },
                maxWidth: { xs: '92vw', sm: 'none' },
                maxHeight: 320,
                overflowY: 'auto',
                bgcolor: 'rgba(15,15,15,0.92)',
                color: '#E5E7EB',
                borderRadius: 2.5,
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }
            }}
          >
            {availableSeasons.map((season) => (
              <MenuItem
                key={season.id}
                onClick={() => handleSeasonSelect(season.id)}
                sx={{
                  py: 3,
                  px: 2,
                  fontSize: '0.95rem',
                  borderRadius: 1.5,
                  mb: 0.5,
                  fontWeight: selectedSeasonId === season.id ? 600 : 400,
                  bgcolor: selectedSeasonId === season.id ? 'rgba(229,103,22,0.12)' : 'transparent',
                  color: selectedSeasonId === season.id ? '#E56A16' : '#E5E7EB',
                  '&:hover': {
                    bgcolor: selectedSeasonId === season.id ? 'rgba(229,103,22,0.18)' : 'rgba(255,255,255,0.05)',
                  }
                }}
              >
                {season.name} {season.isActive && '(Active)'}
              </MenuItem>
            ))}
          </Menu>

          {/* Leagues Dropdown Menu */}
          <Menu
            anchorEl={leaguesDropdownAnchor}
            open={leaguesDropdownOpen}
            onClose={handleLeaguesDropdownClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            marginThreshold={0}
            PaperProps={{
              sx: {
                p: 0.5,
                mt: 1,
                minWidth: { xs: 190, sm: 240 },
                ml: { xs: -1.5, sm: -1.5 },
                maxWidth: { xs: '92vw', sm: 'none' },
                maxHeight: 320,
                overflowY: 'auto',
                bgcolor: 'rgba(15,15,15,0.92)',
                color: '#E5E7EB',
                borderRadius: 2.5,
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }
            }}
          >
            {filteredLeagues.length === 0 ? (
              <MenuItem disabled sx={{ opacity: 0.7 }}>
                <Typography className="empty-state-message" variant="body2">
                  No leagues found
                </Typography>
              </MenuItem>
            ) : (
              filteredLeagues.map((leagueItem) => (
                <MenuItem
                  key={leagueItem.id}
                  onClick={() => handleLeagueSelect(leagueItem.id)}
                  sx={{
                    borderRadius: 1.5,
                    mx: 0.5,
                    my: 0.25,
                    py: 1.25,
                    px: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#E5E7EB',
                    transition: 'all 0.2s ease',
                    background: leagueItem.id === selectedLeagueId ? 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)' : 'transparent',
                    '&:hover': {
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    },
                  }}
                >
                  <Trophy size={16} color={leagueItem.id === selectedLeagueId ? '#FFFFFF' : '#9CA3AF'} />
                  <Box sx={{ flex: 1 }}>
                    {leagueItem.name}
                  </Box>
                  {leagueItem.isAdmin && (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        color: '#1F2937',
                        borderRadius: '9999px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        textTransform: 'uppercase',
                      }}
                    >
                      Admin
                    </Box>
                  )}
                </MenuItem>
              ))
            )}
          </Menu>

          {/* Orange divider */}
          <Box sx={{
            height: 'var(--header-divider-height)',
            bgcolor: 'var(--header-divider-color)',
            width: '100vw',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
            mb: 0.8,
            mt: { xs: 3, sm: 3.2 }
          }} />

          {/* Standings info and Navigation Tabs */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              position: 'relative',
              flexWrap: 'wrap',
              gap: { xs: 1.2, sm: 2 },
              mt: 1,
              px: { xs: 1, sm: 3, md: 9.3 },
              // mt:-1
            }}
          >
            {/* Left side: Standings info - Hidden in My Achievements */}
            {filter !== 'my' && (
              <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'baseline', justifyContent: 'center', gap: 0.6, whiteSpace: 'nowrap' }}>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: 'white' }}>
                    Standings:
                  </Typography>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 300, color: 'white' }}>
                    {selectedLeagueFlags?.final ? 'FINAL' : 'LIVE'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(255,255,255,0.7)' }}>
                    |
                  </Typography>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 300, color: 'white' }}>
                    Last Updated:
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 400, color: 'white' }}>
                    {lastUpdatedLabel}
                  </Typography>
                </Box>

                <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>
                      Standings:
                    </Typography>
                    {selectedLeague && (
                      <Typography sx={{ fontSize: '1rem', fontWeight: 300, color: 'white' }}>
                        {selectedLeagueFlags?.final ? 'FINAL' : 'LIVE'}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 300, color: 'white' }}>
                      Last Updated:
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 400, color: 'white' }}>
                      {lastUpdatedLabel}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Center: Navigation buttons */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: { xs: 2, md:filter === 'all' ? -8.5 : 0 },
              mb: 1,
              width: '100%',
              zIndex: 5
            }}>
              <Box sx={{
                display: 'flex',
                bgcolor: '#3F4652',
                borderRadius: '12px',
                p: 0.5,
                width: { xs: '90%', sm: 400, md: 600 }
              }}>
                <Button
                  onClick={() => setFilter('all')}
                  sx={{
                    flex: 1,
                    textTransform: 'uppercase',
                    borderRadius: '10px',
                    py: { xs: 1, md: 1.5 },
                    fontSize: { xs: '14px', sm: '16px', md: '18px' },
                    fontFamily: 'Woodford Bourne Pro, sans-serif',
                    fontWeight: 700,
                    bgcolor: filter === 'all' ? '#00a896' : 'transparent',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: filter === 'all' ? '#00a896' : '#3f4652',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Trophy Room
                </Button>
                <Button
                  onClick={() => setFilter('my')}
                  sx={{
                    flex: 1,
                    textTransform: 'uppercase',
                    borderRadius: '10px',
                    py: { xs: 1, md: 1.5 },
                    fontSize: { xs: '14px', sm: '16px', md: '18px' },
                    fontFamily: 'Woodford Bourne Pro, sans-serif',
                    fontWeight: 700,
                    bgcolor: filter === 'my' ? '#00a896' : 'transparent',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: filter === 'my' ? '#00a896' : '#3f4652',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Achievements
                </Button>
              </Box>
            </Box>

          </Box>
        </Paper>
      </Box>



      {filter === 'my' ? (
        <Box sx={{
          maxWidth: '783px',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
        }}>
          {(() => {
            // Get ALL trophies won by current user across all leagues and seasons
            const myTrophies = myAllTrophies || [];

            // Helper to get league date by ID
            const getLeagueDate = (leagueId?: string) => {
              if (!leagueId) return null;
              const league = leagues.find(l => String(l.id) === String(leagueId));
              return league?.createdAt ? new Date(league.createdAt) : null;
            };

            // Helper to format date as MMM YYYY
            const formatTrophyDate = (leagueId?: string) => {
              const date = getLeagueDate(leagueId);
              if (!date) return 'N/A';
              return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            };

            // Categorize and sort trophies by priority and date
            // Each trophy instance is shown separately (not grouped)

            // League Awards (in order: Champion, Runner-Up)
            const leagueChampions = myTrophies
              .filter(t => t.title === 'League Champion')
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA; // Descending (most recent first)
              });

            const runnersUp = myTrophies
              .filter(t => t.title === 'Runner-Up')
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            // Individual Awards (in order: Ballon D'or, Golden Boot, King Playmaker, Star Keeper, Shield, Others)
            const ballonDor = myTrophies
              .filter(t => t.title === "Ballon D'or")
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            const goldenBoot = myTrophies
              .filter(t => t.title === 'Golden Boot')
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            const kingPlaymaker = myTrophies
              .filter(t => t.title === 'King Playmaker')
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            const starKeeper = myTrophies
              .filter(t => t.title === 'Star Keeper')
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            const legendaryShield = myTrophies
              .filter(t => t.title === 'Legendary Shield')
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            const otherIndividual = myTrophies
              .filter(t => !['League Champion', 'Runner-Up', "Ballon D'or", 'Golden Boot', 'King Playmaker', 'Star Keeper', 'Legendary Shield'].includes(t.title))
              .sort((a, b) => {
                const dateA = getLeagueDate(a.leagueId)?.getTime() || 0;
                const dateB = getLeagueDate(b.leagueId)?.getTime() || 0;
                return dateB - dateA;
              });

            // Build rows for League Awards - showing each trophy instance separately
            const allLeague = [...leagueChampions, ...runnersUp];
            const leagueRows: TrophyType[][] = [];
            for (let i = 0; i < allLeague.length; i += 3) {
              leagueRows.push(allLeague.slice(i, i + 3));
            }

            // Build rows for Individual Awards - showing each trophy instance separately (in priority order)
            const allIndividual = [...ballonDor, ...goldenBoot, ...kingPlaymaker, ...starKeeper, ...legendaryShield, ...otherIndividual];
            const individualRows: TrophyType[][] = [];
            for (let i = 0; i < allIndividual.length; i += 3) {
              individualRows.push(allIndividual.slice(i, i + 3));
            }

            const hasAnyTrophies = myTrophies.length > 0;

            return hasAnyTrophies ? (
              <>
                {/* Profile Card with Stars */}
                <Paper sx={{
                  background: '#1d1d22',
                  borderRadius: { xs: '0 0 26px 26px', sm: '0 0 38px 38px' },
                  p: 0,
                  mb: 3,
                  border: '1.5px solid rgba(255,255,255,0.75)',
                  overflow: 'hidden',
                  maxWidth: 900,
                  mx: 'auto',
                }}>
                  {/* Profile Picture with Stars */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: { xs: 2.2, sm: 3.5 },
                    py: { xs: 1.2, sm: 1.5 },
                    background: '#1d1d22',
                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                  }}>
                     <XPStarMilestoneCard height={24} width={24} xp={myProfileXP} />
                    <Avatar
                      src={getProfileImage(user ?? undefined) || undefined}
                      alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                      sx={{
                        width: { xs: 70, sm: 86 ,md : 110},
                        height: { xs: 70, sm: 86 ,md : 110 },
                        fontSize: { xs: '1.6rem', sm: '2rem' },
                        fontWeight: 700,
                        bgcolor: '#fff',
                        color: '#fff',
                        border: '2px solid rgba(255,255,255,0.9)',
                      }}
                    >
                      {!getProfileImage(user ?? undefined) && `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                    </Avatar>
                             <XPStarMilestoneCard height={24} width={24} xp={myProfileXP} />

                  </Box>

                  {/* Two Column Layout */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 0,
                    mt: 0,
                  }}>
                    {/* League Awards Section */}
                    <Box>
                      {/* Grey Header */}
                      <Box sx={{
                        bgcolor: '#a0a0a3',
                        py: { xs: 1, sm: 1.2 },
                        px: 2,
                      }}>
                        <Typography sx={{
                          fontSize: { xs: '0.95rem', sm: '1.15rem' },
                          fontWeight: 700,
                          color: '#fff',
                          textAlign: 'center',
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                        }}>
                          LEAGUE REWARDS
                        </Typography>
                      </Box>

                      {/* Dark Background with Trophies */}
                      <Box sx={{
                        bgcolor: '#1a1a1f',
                        p: { xs: 1.25, sm: 2 },
                        pr: { xs: 1.25, sm: 2, md: 2.4 },
                        minHeight: { xs: 'auto', sm: '230px' },
                      }}>
                        {leagueRows.length === 0 ? (
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>
                            No league awards yet
                          </Typography>
                        ) : (
                          leagueRows.map((row, rowIdx) => (
                            <Box key={`league-row-${rowIdx}`}>
                              <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: { xs: 1, sm: 1.4 },
                                pb: { xs: 1.15, sm: 1.6 },
                                mb: rowIdx < leagueRows.length - 1 ? { xs: 1.3, sm: 1.8 } : 0,
                                borderBottom: rowIdx < leagueRows.length - 1 || leagueRows.length === 1
                                  ? '1px solid rgba(255,255,255,0.78)'
                                  : 'none',
                              }}>
                                {row.map((trophy, trophyIdx) => (
                                  <Box
                                    key={`league-${trophy.id || rowIdx}-${trophyIdx}`}
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                      },
                                    }}
                                  // onClick={() => openPlayerQuickView(trophy)}
                                  >
                                    <Box sx={{
                                      position: 'relative',
                                      width: { xs: 34, sm: 42 },
                                      height: { xs: 34, sm: 42 },
                                      mb: { xs: 0.7, sm: 1 },
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                      <Image
                                        src={trophy.image}
                                        alt={trophy.title}
                                        width={isMobile ? 34 : 42}
                                        height={isMobile ? 34 : 42}
                                        style={{
                                          objectFit: 'contain',
                                          maxWidth: '100%',
                                          maxHeight: '100%',
                                        }}
                                      />
                                    </Box>
                                    <Typography sx={{
                                      fontSize: { xs: '0.56rem', sm: '0.66rem' },
                                      color: '#fff',
                                      fontWeight: 600,
                                      textAlign: 'center',
                                      lineHeight: 1.1,
                                    }}>
                                      {formatTrophyDate(trophy.leagueId)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>

                    {/* Individual Awards Section */}
                    <Box>
                      {/* Grey Header */}
                      <Box sx={{
                        bgcolor: '#a0a0a3',
                        py: { xs: 1, sm: 1.2 },
                        px: 2,
                      }}>
                        <Typography sx={{
                          fontSize: { xs: '0.95rem', sm: '1.15rem' },
                          fontWeight: 700,
                          color: '#fff',
                          textAlign: 'center',
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                        }}>
                          INDIVIDUAL REWARDS
                        </Typography>
                      </Box>

                      {/* Dark Background with Trophies */}
                      <Box sx={{
                        bgcolor: '#1a1a1f',
                        p: { xs: 1.25, sm: 2 },
                        pl: { xs: 1.25, sm: 2, md: 2.4 },
                        minHeight: { xs: 'auto', sm: '230px' },
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          display: { xs: 'none', sm: 'block' },
                          position: 'absolute',
                          left: 0,
                          top: { sm: 18 },
                          bottom: { sm: 28 },
                          width: '2px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                        },
                      }}>
                        {individualRows.length === 0 ? (
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>
                            No individual awards yet
                          </Typography>
                        ) : (
                          individualRows.map((row, rowIdx) => (
                            <Box key={`individual-row-${rowIdx}`}>
                              <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: { xs: 1, sm: 1.4 },
                                pb: { xs: 1.15, sm: 1.6 },
                                mb: rowIdx < individualRows.length - 1 ? { xs: 1.3, sm: 1.8 } : 0,
                                borderBottom: rowIdx < individualRows.length - 1 || individualRows.length === 1
                                  ? '1px solid rgba(255,255,255,0.78)'
                                  : 'none',
                              }}>
                                {row.map((trophy, trophyIdx) => (
                                  <Box
                                    key={`individual-${trophy.id || rowIdx}-${trophyIdx}`}
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                      },
                                    }}
                                  // onClick={() => openPlayerQuickView(trophy)}
                                  >
                                    <Box sx={{
                                      position: 'relative',
                                      width: { xs: 34, sm: 42 },
                                      height: { xs: 34, sm: 42 },
                                      mb: { xs: 0.7, sm: 1 },
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                      <Image
                                        src={trophy.image}
                                        alt={trophy.title}
                                        width={isMobile ? 34 : 42}
                                        height={isMobile ? 34 : 42}
                                        style={{
                                          objectFit: 'contain',
                                          maxWidth: '100%',
                                          maxHeight: '100%',
                                        }}
                                      />
                                    </Box>
                                    <Typography sx={{
                                      fontSize: { xs: '0.56rem', sm: '0.66rem' },
                                      color: '#fff',
                                      fontWeight: 600,
                                      textAlign: 'center',
                                      lineHeight: 1.1,
                                    }}>
                                      {formatTrophyDate(trophy.leagueId)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </>
            ) : (
              <Paper sx={{
                background: '#1d1d22',
                borderRadius: { xs: '0 0 26px 26px', sm: '0 0 38px 38px' },
                p: 0,
                mb: 3,
                border: '1.5px solid rgba(255,255,255,0.75)',
                overflow: 'hidden',
                maxWidth: 900,
                mx: 'auto',
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: { xs: 6, sm: 8 },
                  px: { xs: 2, sm: 4 },
                  gap: 2,
                }}>
                  <Trophy size={48} color="rgba(255,255,255,0.25)" />
                  <Typography sx={{
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 600,
                  }}>
                    No achievements yet. Play more matches to unlock trophies!
                  </Typography>
                </Box>
              </Paper>
            );
          })()}

          {/* Badge detail modal (tap card) */}
          <Dialog open={openBadgeDlg} onClose={closeBadgeDetail} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center' }}>
              {selectedBadge?.title}
              <Box sx={{ flexGrow: 1 }} />
              <IconButton onClick={closeBadgeDetail}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ py: 2 }}>
              {selectedBadge && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: 2 }}>
                  <Box sx={{ position: 'relative', width: 96, height: 96, justifySelf: 'center' }}>
                    <Image src={selectedBadge.image} alt={selectedBadge.title} width={96} height={96} style={{ objectFit: 'contain' }} />
                    <Box sx={{ position: 'absolute', top: -6, right: -6, background: selectedBadge.unlocked ? selectedBadge.color : medalMuted, color: '#fff', borderRadius: '12px', px: 0.75, py: 0.2, fontSize: '0.7rem', fontWeight: 700 }}>
                      x{selectedBadge.count}
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.900rem',
                        fontWeight: 800,
                      }}
                    >
                      {selectedBadge.xp}
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ mb: 1.25 }}>{selectedBadge.description}</Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
                      {selectedBadge.unlocked
                        ? `Earned x${selectedBadge.count} • Total XP from this medal: ${selectedBadge.count * selectedBadge.xp}`
                        : (selectedBadge.progressText || 'Progress unavailable')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      XP from medals contributes to your total profile XP.
                    </Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>
      ) : (
        <Box sx={{ px: { xs: 1, sm: 3, md: 11 }, position: 'relative' }}>
          {/* Subtle loading overlay when changing season/league (no full-page spinner) */}
          {trophyLoading && (
            <Box sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'rgba(0,0,0,0.35)',
              borderRadius: 2,
              backdropFilter: 'blur(2px)',
            }}>
              <CircularProgress size={36} sx={{ color: '#E56A16' }} />
            </Box>
          )}
          {isMobile ? (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
              justifyContent: 'center',
              alignItems: 'stretch',
              mb: 2.2,
            }}>
              {(() => {
                const topTrophyTitles = ['League Champion', "Ballon D'or", 'Runner-Up'];
                const bottomTrophyTitles = ['Golden Boot', 'King Playmaker', 'Legendary Shield', 'Dark Horse', 'Star Keeper'];
                const allOrderedTitles = [...topTrophyTitles, ...bottomTrophyTitles];
                const allBaseTrophies = [...topTrophies, ...bottomTrophies];

                return allOrderedTitles.map((title, index) => {
                  const trophy = trophiesToDisplay.find(t => t.title === title) || {
                    ...allBaseTrophies.find(t => t.title === title)!,
                    winner: 'TBC',
                    winnerId: null,
                    leagueId: selectedLeague ? selectedLeague.id : undefined,
                    leagueName: selectedLeague ? selectedLeague.name : undefined,
                  };

                  return (
                    <Box key={`mobile-${trophy.title}-${index}`} sx={{ height: '100%' }}>
                      <TrophyCard
                        {...trophy}
                        isLarge={true}
                        onButtonClick={trophy.winnerId && trophy.leagueId ? () => openPlayerQuickView(trophy) : undefined}
                      />
                    </Box>
                  );
                });
              })()}
            </Box>
          ) : (
            <>
              {/* Top Row - 3 Large Trophies */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { sm: 'repeat(3, 1fr)' },
                gap: { sm: 2, md: 1.5 },
                justifyContent: 'center',
                alignItems: 'stretch',
                mb: { sm: 3 },
              }}>
                {(() => {
                  const topTrophyTitles = ['League Champion', "Ballon D'or", 'Runner-Up'];
                  const displayTrophies = trophiesToDisplay.length > 0
                    ? trophiesToDisplay.filter(t => topTrophyTitles.includes(t.title))
                    : topTrophies.map(t => ({
                      ...t,
                      winner: 'TBC',
                      winnerId: null,
                      leagueId: selectedLeague ? selectedLeague.id : undefined,
                      leagueName: selectedLeague ? selectedLeague.name : undefined,
                    }));
                  return topTrophyTitles.map((title, index) => {
                    const trophy = displayTrophies.find(t => t.title === title) || {
                      ...topTrophies.find(t => t.title === title)!,
                      winner: 'TBC',
                      winnerId: null,
                      leagueId: selectedLeague ? selectedLeague.id : undefined,
                      leagueName: selectedLeague ? selectedLeague.name : undefined,
                    };
                    return (
                      <Box key={`top-${trophy.title}-${index}`} sx={{ height: '100%' }}>
                        <TrophyCard
                          {...trophy}
                          isLarge={true}
                          onButtonClick={trophy.winnerId && trophy.leagueId ? () => openPlayerQuickView(trophy) : undefined}
                        />
                      </Box>
                    );
                  });
                })()}
              </Box>

              {/* Bottom Row - 5 Smaller Trophies */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                gap: { sm: 2, md: 1.5 },
                justifyContent: 'center',
                alignItems: 'stretch',
                mb: { sm: 6, md: 8 },
              }}>
                {(() => {
                  const bottomTrophyTitles = ['Golden Boot', 'King Playmaker', 'Legendary Shield', 'Dark Horse', 'Star Keeper'];
                  const displayTrophies = trophiesToDisplay.length > 0
                    ? trophiesToDisplay.filter(t => bottomTrophyTitles.includes(t.title))
                    : bottomTrophies.map(t => ({
                      ...t,
                      winner: 'TBC',
                      winnerId: null,
                      leagueId: selectedLeague ? selectedLeague.id : undefined,
                      leagueName: selectedLeague ? selectedLeague.name : undefined,
                    }));
                  return bottomTrophyTitles.map((title, index) => {
                    const trophy = displayTrophies.find(t => t.title === title) || {
                      ...bottomTrophies.find(t => t.title === title)!,
                      winner: 'TBC',
                      winnerId: null,
                      leagueId: selectedLeague ? selectedLeague.id : undefined,
                      leagueName: selectedLeague ? selectedLeague.name : undefined,
                    };
                    return (
                      <Box key={`bottom-${trophy.title}-${index}`} sx={{ height: '100%' }}>
                        <TrophyCard
                          {...trophy}
                          isLarge={false}
                          onButtonClick={trophy.winnerId && trophy.leagueId ? () => openPlayerQuickView(trophy) : undefined}
                        />
                      </Box>
                    );
                  });
                })()}
              </Box>
            </>
          )}



          {/* {selectedLeague && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: selectedLeagueFlags?.final ? '#16a34a' : '#fff' }}
              >
                {selectedLeagueFlags?.final ? 'Final League Standing' : 'Current League Standing'}
              </Typography>
            </Box>
          )} */}
        </Box>
      )}

      {/* Player Quick View Modal (Compact Version) */}
      <Dialog
        open={openQuickView}
        onClose={() => setOpenQuickView(false)}
        fullWidth={false}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: { xs: 1.5, sm: 2 },
            overflow: 'visible',
            width: { xs: 'calc(100vw - 20px)', sm: 'min(540px, calc(100vw - 56px))' },
            maxWidth: { xs: 'calc(100vw - 20px)', sm: '540px' },
            m: { xs: 0.5, sm: 2 },
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 }, bgcolor: '#000', position: 'relative' }}>
          <Image src={cflogo} alt="CF Logo" width={isMobile ? 160 : 320} height={isMobile ? 160 : 320} />
          <IconButton onClick={() => setOpenQuickView(false)} sx={{ color: '#fff', position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />
        <DialogContent
          sx={{
            py: { xs: 0.65, sm: 2.5 },
            px: { xs: 0.6, sm: 1.5 },
            pb: { xs: 2.8, sm: 5 },
            position: 'relative',
            overflowX: 'visible',
            overflowY: 'auto',
            maxHeight: { xs: '78vh', sm: '70vh' },
            '@media (min-width:600px)': {
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
                width: 0,
                height: 0,
              },
            },
          }}
        >
          {quickView.player && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '64px 160px 64px', sm: '112px minmax(0, 260px) 112px' },
                gap: { xs: 0.15, sm: 1 },
                alignItems: 'start',
                justifyContent: 'center',
                minHeight: { xs: '308px', sm: '438px' },
              }}
            >
              {/* Left: Stats Icons */}
              <Paper elevation={0} sx={{
                p: { xs: 0.3, sm: 1 },
                border: '1px solid rgba(15, 23, 42, 0.2)',
                backgroundColor: '#fff',
                minWidth: 0,
                minHeight: { xs: '188px', sm: '280px' },
                height: { xs: '188px', sm: 'auto' },
                borderRadius: 2,
                position: 'relative',
                zIndex: 4,
                order: { xs: 1, sm: 1 },
                mt: { xs: 3.4, sm: 6 }
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.5rem', sm: '0.8rem' }, letterSpacing: 0, mb: 0.15, lineHeight: 1.05 }}>Current Stats</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 0.06, sm: 0 },
                  }}
                >
                  {[
                    { img: Goals, label: 'Goals', shortLabel: 'Goals', value: quickView.stats?.goals ?? 0 },
                    { img: Assist, label: 'Assists', shortLabel: 'Assist', value: quickView.stats?.assists ?? 0 },
                    { img: Cleansheet, label: 'Clean Sheets', shortLabel: 'Clean', value: quickView.cleanSheets ?? 0 },
                    { img: Momt, label: 'Votes', shortLabel: 'Votes', value: quickView.motmCount ?? 0 },
                    { img: DefImp, label: 'Defensive Impact', shortLabel: 'Def', value: quickView.defensiveImpact ?? 0 },
                    { img: Mentality, label: 'Mentality', shortLabel: 'Mental', value: quickView.mentality ?? 0 },
                  ].map((it, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 0.01,
                        p: { xs: 0.02, sm: 0.3 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                        <Image src={it.img} alt={it.label} width={isMobile ? 10 : 20} height={isMobile ? 10 : 20} style={{ objectFit: 'contain' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.58rem', sm: '0.9rem' }, lineHeight: 1 }}>
                          {it.value}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          fontSize: { xs: '0.43rem', sm: '0.65rem' },
                          textAlign: 'left',
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                          letterSpacing: 0,
                        }}
                      >
                        {isMobile ? it.shortLabel : it.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Button
                  variant="text"
                  disableRipple
                  disableFocusRipple
                  sx={{
                    color: '#1976d2',
                    fontSize: { xs: '0.48rem', sm: '0.75rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    WebkitTapHighlightColor: 'transparent',
                    padding: { xs: '1px 2px', sm: '4px 8px' },
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                    '&:active': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                    '&:focus': {
                      boxShadow: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                    },
                    '&.Mui-focusVisible': {
                      boxShadow: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  More Stats
                </Button>
              </Paper>

              {/* Center: Player Card */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 2,
                order: { xs: 2, sm: 2 }
              }}>
                {(() => {
                  const p = quickView.player as User & PlayerProfileLike;
                  const fullName = [p.firstName, p.lastName]
                    .map((part) => (typeof part === 'string' ? part.trim() : ''))
                    .filter(Boolean)
                    .join(' ')
                    .trim();
                  const playerCardProps = {
                    name: fullName,
                    number: getShirtNumber(p),
                    points: Number(quickView.xp ?? 0),
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
                    width: 260,
                    height: isMobile ? 410 : 410,
                    hideShareIcon: true,
                    position: p.position ?? '',
                  };
                  return (
                    <Box
                      sx={{
                        width: { xs: 160, sm: 260 },
                        height: { xs: 278, sm: 430 },
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        position: 'relative',
                        overflow: 'visible',
                      }}
                    >
                      <Box
                        sx={{
                          width: 260,
                          height: { xs: 410, sm: 410 },
                          position: { xs: 'absolute', sm: 'relative' },
                          top: 0,
                          left: { xs: '50%', sm: 'auto' },
                          transform: { xs: 'translateX(-50%) scale(0.62)', sm: 'none' },
                          transformOrigin: 'top center',
                        }}
                      >
                        <PlayerCard {...playerCardProps} disableImagePopup />
                      </Box>
                    </Box>
                  );
                })()}
              </Box>

              {/* Right: Last 10 Matches */}
              <Paper elevation={0} sx={{
                p: { xs: 0.3, sm: 0.75 },
                border: '1px solid rgba(15, 23, 42, 0.2)',
                backgroundColor: '#fff',
                borderRadius: 2,
                overflowY: 'hidden',
                minWidth: 0,
                position: 'relative',
                zIndex: 4,
                order: { xs: 3, sm: 3 },
                mt: { xs: 3.4, sm: 6 },
                minHeight: { xs: 188, sm: 275 },
                height: { xs: 188, sm: 'auto' },
              }}>
                <Typography sx={{ fontWeight: 800, mb: 0.2, fontSize: { xs: '0.5rem', sm: '0.7rem' }, letterSpacing: 0, lineHeight: 1.05 }}>Last 10 games</Typography>
                <Stack direction="column" spacing={0.2}>
                  {(quickView.lastFive ?? []).slice(0, 10).map((m, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: { xs: 14, sm: 28 },
                          height: { xs: 14, sm: 24 },
                          borderRadius: 0.5,
                          backgroundColor: resultColor(m.result),
                          color: '#fff',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.46rem', sm: '0.6rem' },
                          lineHeight: 1,
                        }}
                      >
                        {m.result}
                      </Box>
                      {idx === 0 && (
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.45rem', sm: '0.6rem' }, display: { xs: 'none', sm: 'block' } }}>
                          Latest
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {(quickView.lastFive ?? []).length === 0 && (
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      No recent matches.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
          {quickView.player && (
            <Box sx={{ position: 'absolute', right: { xs: 8, sm: 12 }, bottom: { xs: 8, sm: 10 }, zIndex: 10 }}>
              <IconButton
                sx={{
                  bgcolor: '#10b981',
                  color: '#fff',
                  width: { xs: 34, sm: 36 },
                  height: { xs: 34, sm: 36 },
                  borderRadius: 1.2,
                  '&:hover': { bgcolor: '#059669' },
                }}
                onClick={() => {
                  const playerName = [quickView.player?.firstName, quickView.player?.lastName]
                    .map((part) => (typeof part === 'string' ? part.trim() : ''))
                    .filter(Boolean)
                    .join(' ')
                    .trim() || 'Player';
                  const shareText = `Check out ${playerName}'s stats! ${Number(quickView.xp ?? 0)} XP`;
                  if (navigator.share) {
                    navigator.share({
                      title: `${playerName} - Champion Footballer`,
                      text: shareText,
                    }).catch(() => { });
                  } else {
                    navigator.clipboard?.writeText(shareText);
                    import('react-hot-toast').then(({ default: toast }) => toast.success('Player stats copied!'));
                  }
                }}
              >
                <ShareIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
    // </Box>
  );
}
