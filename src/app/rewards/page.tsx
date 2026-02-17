'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
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

// Badge images
import HatTrickBadge from '@/Components/images/brown.png';
import AssistMaestroBadge from '@/Components/images/brown.png';
import StarPerformerBadge from '@/Components/images/brown.png';
import GoalMachineBadge from '@/Components/images/brown.png';
import IronWallBadge from '@/Components/images/brown.png';
import UnbeatenBadge from '@/Components/images/brown.png';
import CaptainsTriumphsBadge from '@/Components/images/brown.png';
import TripleImpactBadge from '@/Components/images/brown.png';
import ChartTopperBadge from '@/Components/images/brown.png';

// Decorative images
import LeftStar from '@/Components/images/leftstart.png';
import RightStar from '@/Components/images/rightstar.png';

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
  manOfTheMatchVotes: Record<string, string>;
  playerStats: Record<string, { goals: number; assists: number }>;
  status: 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING';
  active?: boolean;
  end?: string | Date;
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

// --- Player stats calculation ---
const calculatePlayerStats = (league: League): Record<string, PlayerStats> => {
  const stats: Record<string, PlayerStats> = {};
  (league.matches ?? []).forEach(match => {
    if (match.status !== 'RESULT_PUBLISHED') return;

    const homePlayers = match.homeTeamUsers.map(u => u.id);
    const awayPlayers = match.awayTeamUsers.map(u => u.id);
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
      const votes = Object.values(match.manOfTheMatchVotes ?? {}).filter(v => v === pId).length;
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

// --- User match summaries ---
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
  const summaries = summarizeUserMatches(user.id, leagues);
  const byLeague = summarizeUserMatchesByLeague(user.id, leagues);
  const acrossAll = Object.values(byLeague).flat();

  const hatTricks = summaries.filter(m => m.goals >= 3).length;
  const maxAssistStreakSingle = Math.max(0, ...Object.values(byLeague).map(arr => longestStreak(arr, m => m.assists > 0)));
  const maxScoringStreakSingle = Math.max(0, ...Object.values(byLeague).map(arr => longestStreak(arr, m => m.goals > 0)));
  const maxMotmStreakAll = longestStreak(acrossAll, m => m.motmVotes > 0);
  const maxCleanSheetWinStreakAll = longestStreak(acrossAll, m => m.result === 'W' && m.conceded === 0);
  const maxWinStreakSingle = Math.max(0, ...Object.values(byLeague).map(arr => longestStreak(arr, m => m.result === 'W')));
  const maxCaptainPickCountSingle = Math.max(0, ...Object.values(byLeague).map(arr => arr.filter(m => m.motmVotes > 0).length));

  const captainWins = 0;
  const topSpotMatches = 0;

  const toNext = (best: number, target: number) => (target - (best % target || target));

  const badges: Badge[] = [
    { id: 'hat_trick_3_matches', title: 'Goal Rush', description: 'Scoring 3+ goals in 3 separate matches (Within a single league)', image: HatTrickBadge, color: medalGold, count: Math.floor(hatTricks / 3), xp: 200, unlocked: hatTricks >= 3, progressText: hatTricks < 3 ? `You are ${3 - hatTricks} hat-trick${3 - hatTricks > 1 ? 's' : ''} away from achieving this reward` : `Hat-tricks earned: ${hatTricks}` },
    { id: 'captain_5_wins', title: 'Pure Magic', description: '5 wins as captain, leading the team to victory (Within a single league)', image: CaptainsTriumphsBadge, color: medalGold, count: Math.floor(captainWins / 5), xp: 300, unlocked: captainWins >= 5, progressText: captainWins < 5 ? `You are ${5 - captainWins} captain win${5 - captainWins > 1 ? 's' : ''} away from achieving this reward` : `Captain wins: ${captainWins}` },
    { id: 'assist_10_consecutive', title: 'Triple Treat', description: 'Assist in 10 consecutive matches (Within a single league)', image: AssistMaestroBadge, color: medalGold, count: Math.floor(maxAssistStreakSingle / 10), xp: 400, unlocked: maxAssistStreakSingle >= 10, progressText: maxAssistStreakSingle < 10 ? `You need a ${10 - maxAssistStreakSingle} match assist streak to achieve this reward` : `Best streak: ${maxAssistStreakSingle}` },
    { id: 'scoring_10_consecutive', title: 'Leader Of Legends', description: 'Scoring in 10 consecutive matches (Within a single league)', image: GoalMachineBadge, color: medalGold, count: Math.floor(maxScoringStreakSingle / 10), xp: 250, unlocked: maxScoringStreakSingle >= 10, progressText: maxScoringStreakSingle < 10 ? `You need a ${10 - maxScoringStreakSingle} match scoring streak to achieve this reward` : `Best streak: ${maxScoringStreakSingle}` },
    { id: 'captain_performance_3', title: 'Spotlight Star', description: "Gets 3 captain's performance pick (Within a single league)", image: TripleImpactBadge, color: medalGold, count: Math.floor(maxCaptainPickCountSingle / 3), xp: 150, unlocked: maxCaptainPickCountSingle >= 3, progressText: maxCaptainPickCountSingle < 3 ? `You are ${3 - maxCaptainPickCountSingle} captain's pick${3 - maxCaptainPickCountSingle > 1 ? 's' : ''} away from achieving this reward` : `Picks: ${maxCaptainPickCountSingle}` },
    { id: 'motm_4_consecutive', title: 'Finders Keepers', description: "4 consecutive 'Man of the Match' performance (Within a single league)", image: StarPerformerBadge, color: medalGold, count: Math.floor(maxMotmStreakAll / 4), xp: 400, unlocked: maxMotmStreakAll >= 4, progressText: maxMotmStreakAll < 4 ? `You need a ${4 - maxMotmStreakAll} match MOTM streak to achieve this reward` : `Best streak: ${maxMotmStreakAll}` },
    { id: 'clean_sheet_5_wins', title: 'Iron Will', description: '5 consecutive wins with clean sheets (Within a single league)', image: IronWallBadge, color: medalGold, count: Math.floor(maxCleanSheetWinStreakAll / 5), xp: 350, unlocked: maxCleanSheetWinStreakAll >= 5, progressText: maxCleanSheetWinStreakAll < 5 ? `You need a ${5 - maxCleanSheetWinStreakAll} match clean sheet win streak to achieve this reward` : `Best streak: ${maxCleanSheetWinStreakAll}` },
    { id: 'top_spot_10_matches', title: 'Chart Topper', description: 'Holding top spot in the league for more than 10 matches (Within a single league)', image: ChartTopperBadge, color: medalGold, count: Math.floor(topSpotMatches / 10), xp: 500, unlocked: topSpotMatches >= 10, progressText: topSpotMatches < 10 ? `You need ${10 - topSpotMatches} more match${10 - topSpotMatches > 1 ? 'es' : ''} at top spot to achieve this reward` : `Top spot: ${topSpotMatches}` },
    { id: 'consecutive_10_victories', title: 'Win Streak X', description: 'Securing 10 consecutive victories in a single league', image: UnbeatenBadge, color: medalGold, count: Math.floor(maxWinStreakSingle / 10), xp: 600, unlocked: maxWinStreakSingle >= 10, progressText: maxWinStreakSingle < 10 ? `You need a ${10 - maxWinStreakSingle} match win streak to achieve this reward` : `Best streak: ${maxWinStreakSingle}` },
  ];

  return badges;
};

// Badge metadata mapping
const BADGE_META: Record<string, { title: string; description: string; image: StaticImageData; color: string }> = {
  hat_trick_3_matches: {
    title: 'Goal Rush',
    description: 'Scoring 3+ goals in 3 separate matches (Within a single league)',
    image: HatTrickBadge,
    color: medalGold,
  },
  captain_5_wins: {
    title: 'Pure Magic',
    description: '5 wins as captain, leading the team to victory (Within a single league)',
    image: CaptainsTriumphsBadge,
    color: medalGold,
  },
  assist_10_consecutive: {
    title: 'Triple Treat',
    description: 'Assist in 10 consecutive matches (Within a single league)',
    image: AssistMaestroBadge,
    color: medalGold,
  },
  scoring_10_consecutive: {
    title: 'Leader Of Legends',
    description: 'Scoring in 10 consecutive matches (Within a single league)',
    image: GoalMachineBadge,
    color: medalGold,
  },
  captain_performance_3: {
    title: 'Spotlight Star',
    description: "Gets 3 captain's performance pick (Within a single league)",
    image: TripleImpactBadge,
    color: medalGold,
  },
  motm_4_consecutive: {
    title: 'Finders Keepers',
    description: "4 consecutive 'Man of the Match' performance (Within a single league)",
    image: StarPerformerBadge,
    color: medalGold,
  },
  clean_sheet_5_wins: {
    title: 'Iron Will',
    description: '5 consecutive wins with clean sheets (Within a single league)',
    image: IronWallBadge,
    color: medalGold,
  },
  top_spot_10_matches: {
    title: 'Chart Topper',
    description: 'Holding top spot in the league for more than 10 matches (Within a single league)',
    image: ChartTopperBadge,
    color: medalGold,
  },
  consecutive_10_victories: {
    title: 'Win Streak X',
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

const mergeBadges = (client: Badge[], server: Badge[] | null | undefined): Badge[] => {
  if (!Array.isArray(server) || server.length === 0) return client;
  const serverById = new Map(server.map(b => [b.id, b] as const));
  return client.map(cb => {
    const sb = serverById.get(cb.id);
    if (!sb) return cb;
    return {
      ...cb,
      count: Number.isFinite(Number(sb.count)) ? Number(sb.count) : cb.count,
      xp: Number.isFinite(Number(sb.xp)) ? Number(sb.xp) : cb.xp,
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
          fontFamily: '"Woodford Bourne Pro", sans-serif !important',
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
                bottom: 8,
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
                fontSize: '0.8rem',
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
          fontFamily: '"Woodford Bourne Pro", sans-serif !important',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const [serverBadges, setServerBadges] = useState<Badge[] | null>(null);

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
  
  // Calculate total XP from all rewards
  const totalRewardsXP = myBadges.reduce((sum, badge) => sum + (badge.count * badge.xp), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '160vh', backgroundColor: '#0E0E0E' }}>
      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          background: '#0e0e0e',
          py: { xs: 3, sm: 4 , md: 6 },
          px: { xs: 0, sm: 0, md: 0 },
          // borderBottom: '4px solid #FF6B00',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, lineHeight: 1 }}>⭐</Typography>
          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: 400,
              textAlign: 'center',
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
              letterSpacing: '0%',
              textTransform: 'uppercase',
              fontFamily: 'Anton, sans-serif !important',
              fontStyle: 'normal',
              lineHeight: '100%',
            }}
          >
            REWARDS
          </Typography>
          <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, lineHeight: 1 }}>⭐</Typography>
        </Box>
         <Box sx={{ height: 6, bgcolor: 'rgba(229,106,22,0.9)', mt: 7 }} />
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, md: 5, lg: 11.2 }, pb: 4, mt: -0.5 }}>
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
          fontFamily: '"Woodford Bourne Pro", sans-serif !important',
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
                  fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                  fontSize: '1.1rem',
                }}>
                  How to earn this reward:
                </Typography>
                <Typography sx={{ 
                  mb: 2, 
                  color: '#bbb', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                }}>
                  {selectedBadge.description}
                </Typography>
                <Box sx={{ height: '1px', bgcolor: '#444', my: 2 }} />
                <Typography sx={{ 
                  color: selectedBadge.unlocked ? '#fbbf24' : '#888', 
                  mb: 1, 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                }}>
                  {selectedBadge.unlocked
                    ? `✅ Earned x${selectedBadge.count} • Total XP: ${formatNumber(selectedBadge.count * selectedBadge.xp)}`
                    : `📊 ${selectedBadge.progressText || 'Progress unavailable'}`}
                </Typography>
                <Typography sx={{ 
                  color: '#888', 
                  display: 'block', 
                  mt: 1.5,
                  fontSize: '0.85rem',
                  fontFamily: '"Woodford Bourne Pro", sans-serif !important',
                }}>
                  💡 Each reward earns you <span style={{ color: '#fbbf24', fontWeight: 700 }}>{selectedBadge.xp} XP</span> and can be achieved multiple times.
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
