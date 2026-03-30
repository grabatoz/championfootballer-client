import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, Divider, IconButton, Stack } from '@mui/material';
import TrophyImg from '@/Components/images/awardtrophy.png';
import RunnerUpImg from '@/Components/images/runnerup.png';
import BaloonDImg from '@/Components/images/baloond.png';
import GoatImg from '@/Components/images/goat.png';
import GoldenBootImg from '@/Components/images/goldenboot.png';
import KingPlayMakerImg from '@/Components/images/kingplaymaker.png';
import ShieldImg from '@/Components/images/shield.png';
import DarkHorseImg from '@/Components/images/darkhourse.png';
import StarKeeperImg from '@/Components/images/brown.svg';
import Image, { StaticImageData } from 'next/image';
import { useAuth } from '@/lib/hooks';
import CloseIcon from '@mui/icons-material/Close';
import PlayerCard from '@/Components/PlayerCardd';
import Goals from '@/Components/images/goal.png';
import Assist from '@/Components/images/Assist.png';
import Cleansheet from '@/Components/images/cleansheet.png';
import Momt from '@/Components/images/MOTM.png';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  xp?: number;
}

// interface PlayerStats {
//     played: number;
//     wins: number;
//     draws: number;
//     losses: number;
//     goals: number;
//     assists: number;
//     motmVotes: number;
//     teamGoalsConceded: number;
// }

// interface Match {
//     id: string;
//     homeTeamGoals: number;
//     awayTeamGoals: number;
//     homeTeamUsers: User[];
//     awayTeamUsers: User[];
//     manOfTheMatchVotes: Record<string, string>; // VoterId: VotedForId
//     playerStats: Record<string, {
//         goals: number;
//         assists: number;
//     }>;
//     status: 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING';
// }

// interface League {
//     id: string;
//     name: string;
//     members: User[];
//     matches: Match[];
//     maxGames: number;
// }

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

// Unified card dimensions
const CARD_DIMENSIONS = {
  minHeight: { xs: 260, sm: 300, md: 300 },
  maxWidth: { xs: 170, sm: 240, md: 280 },
  image: { xs: 60, sm: 72, md: 84 },
} as const;

// Blue helpers for Star Keeper icon tint
const BLUE_HEX = '#3B82F6';
const BLUE_FILTER =
  'invert(30%) sepia(98%) saturate(2000%) hue-rotate(201deg) brightness(92%) contrast(101%)';

// Meta for known trophies (prefer new canonical titles)
const TROPHY_META: Array<Omit<TrophyType, 'winner' | 'winnerId' | 'leagueId' | 'leagueName'>> = [
  { title: 'League Champion', description: 'First Place Player In The League Table', image: TrophyImg, color: '#FFD700' },
  { title: 'Runner-Up', description: 'Second Place Player In The League Table', image: RunnerUpImg, color: '#C0C0C0' },
  { title: "Ballon D'or", description: 'Player With The Most MOTM Votes Received', image: BaloonDImg, color: '#FFC107' },
  { title: 'GOAT', description: 'Player With The Highest Win Ratio & Total MOTM Votes', image: GoatImg, color: '#F44336' },
  { title: 'Golden Boot', description: 'Player With The Highest Number Of Goals Scored', image: GoldenBootImg, color: '#FF9800' },
  { title: 'King Playmaker', description: 'Player With The Highest Number Of Goals Assisted', image: KingPlayMakerImg, color: '#4CAF50' },
  { title: 'Legendary Shield', description: 'Player With The Lowest Average Number Of Team Goals Conceded', image: ShieldImg, color: '#2196F3' },
  { title: 'The Dark Horse', description: 'Player Outside Of The Top 3 League Position With The Highest Frequency Of MOTM Votes', image: DarkHorseImg, color: '#607D8B' },
  // New
  { title: 'Star Keeper', description: 'Goalkeeper With The Highest Number Of Clean Sheets', image: StarKeeperImg, color: BLUE_HEX },
];

// Backward-compatibility title aliases
const TITLE_ALIASES: Record<string, string> = {
  'champion footballer': 'League Champion',
};

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
      backgroundColor: '#fff'
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
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            filter: title === 'Star Keeper' ? BLUE_FILTER : 'none',
          }}
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
  

export default function TrophyRoom({ leagueId }: { leagueId: string }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  // Quick View modal state
  type PlayerProfileLike = {
    preferredFoot?: string | null;
    shirtNumber?: number | string | null;
    profilePicture?: string | null;
    avatarUrl?: string | null;
  };
  const [openQuickView, setOpenQuickView] = useState(false);
  const [quickView, setQuickView] = useState<{
    player?: (User & PlayerProfileLike) | null;
    leagueName?: string;
    stats?: { goals?: number; assists?: number };
    skills?: { dribbling?: number; shooting?: number; passing?: number; pace?: number; defending?: number; physical?: number };
    xp?: number;
    cleanSheets?: number;
    motmCount?: number;
    lastFive?: Array<{ result: 'W' | 'D' | 'L' }>;
    trophyTitle?: string;
    xpLatest?: number;
    xpRecentTotal?: number;
    profileXP?: number;
  }>({});

  // Helpers used by PlayerCard rendering
  type Foot = 'L' | 'R';
  type ShortPosition = 'GK' | 'DF' | 'MF' | 'WG' | 'ST';
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
  const posToShort = (pos?: string): ShortPosition => {
    const p = (pos ?? '').toLowerCase();
    if (p.includes('keeper') || p === 'gk') return 'GK';
    if (p.includes('def')) return 'DF';
    if (p.includes('mid')) return 'MF';
    if (p.includes('wing')) return 'WG';
    if (p.includes('striker') || p.includes('forward') || p === 'st' || p === 'cf') return 'ST';
    return 'ST';
  };
  const resultColor = (r: 'W' | 'D' | 'L') => (r === 'W' ? '#16a34a' : r === 'D' ? '#6b7280' : '#ef4444');

  const normalizeTitle = (t: string) => {
    const key = (t || '').toLowerCase();
    return TITLE_ALIASES[key] ?? t;
  };

  const attachTrophyMeta = (
    items: Array<{ title: string; winnerId: string | number | null; winner: string | null; leagueId?: string | number; leagueName?: string }>
  ): TrophyType[] => {
    return items.map(it => {
      const normTitle = normalizeTitle(it.title);
      const meta = TROPHY_META.find(t => t.title.toLowerCase() === normTitle.toLowerCase());
      return {
        title: normTitle,
        description: meta?.description ?? '',
        image: meta?.image ?? TrophyImg,
        color: meta?.color ?? '#999',
        winner: it.winner ?? null,
        winnerId: it.winnerId != null ? String(it.winnerId) : null,
        leagueId: it.leagueId != null ? String(it.leagueId) : leagueId,
        leagueName: it.leagueName,
      };
    });
  };

  // Fetch winners for this specific league
  useEffect(() => {
    if (!leagueId || !token) return;
    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?leagueId=${encodeURIComponent(String(leagueId))}`,
          { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          if (!aborted) {
            setError(data?.message || 'Failed to load trophy room.');
            setTrophies([]);
          }
          return;
        }
        const list = Array.isArray(data.trophyWinners) ? attachTrophyMeta(data.trophyWinners) : [];
        if (!aborted) {
          setTrophies(list);
          setError(null);
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          // Log the error in non-production to aid debugging and satisfy linter
          // eslint-disable-next-line no-console
          console.error(e);
        }
        if (!aborted) {
          setError('An error occurred while fetching trophy room.');
          setTrophies([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [leagueId, token]);

  const displayed = useMemo(() => {
    if (filter === 'all') return trophies;
    if (!user?.id) return [];
    return trophies.filter(t => t.winnerId && String(t.winnerId) === String(user.id));
  }, [filter, trophies, user?.id]);

  // Open Quick View using backend API for this league/player
  const openPlayerQuickView = async (trophy: TrophyType) => {
    if (!trophy.winnerId || !leagueId || !token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(String(leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data?.success) return;

      const player: User & PlayerProfileLike = {
        id: String(data.player?.id ?? trophy.winnerId),
        firstName: data.player?.firstName ?? '',
        lastName: data.player?.lastName ?? '',
        xp: Number(data.player?.xp ?? 0),
        position: data.player?.position ?? undefined,
        profilePicture: data.player?.profilePicture ?? null,
        preferredFoot: data.player?.preferredFoot ?? null,
        shirtNumber: data.player?.shirtNumber ?? null,
      };

      setQuickView({
        player,
        leagueName: data.league?.name ?? trophy.leagueName,
        stats: { goals: Number(data.stats?.goals ?? 0), assists: Number(data.stats?.assists ?? 0) },
        skills: data.skills
          ? {
              dribbling: Number(data.skills.dribbling ?? 0),
              shooting: Number(data.skills.shooting ?? 0),
              passing: Number(data.skills.passing ?? 0),
              pace: Number(data.skills.pace ?? 0),
              defending: Number(data.skills.defending ?? 0),
              physical: Number(data.skills.physical ?? 0),
            }
          : undefined,
        xp: Number(data.xp ?? data.player?.xp ?? 0),
        cleanSheets: Number(data.cleanSheets ?? 0),
        motmCount: Number(data.motmCount ?? 0),
        lastFive: Array.isArray(data.lastFive) ? data.lastFive : [],
        trophyTitle: trophy.title,
        xpLatest: Number(data.xpLatest ?? 0),
        xpRecentTotal: Number(data.xpRecentTotal ?? 0),
        profileXP: Number(data.profileXP ?? data.player?.xp ?? 0),
      });
      setOpenQuickView(true);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 2, gap: 1.5 }}>
        <Chip
          label="Trophy Room"
          color={filter === 'all' ? 'success' : 'default'}
          onClick={() => setFilter('all')}
          sx={{
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            py: { xs: 0.75, sm: 1 },
            px: { xs: 1.25, sm: 1.75 },
            fontWeight: 'bold',
            cursor: 'pointer',
            ...(filter === 'all' && { backgroundColor: '#00A77F', color: 'white' })
          }}
        />
        <Chip
          label="My Achievements"
          color={filter === 'my' ? 'success' : 'default'}
          variant="outlined"
          onClick={() => setFilter('my')}
          sx={{
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            py: { xs: 0.75, sm: 1 },
            px: { xs: 1.25, sm: 1.75 },
            fontWeight: 'bold',
            cursor: 'pointer',
            ...(filter === 'my' && { backgroundColor: '#00A77F', color: 'white' })
          }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2, md: 3 } }}>
        {displayed.length > 0 ? displayed.map((t, idx) => (
          <Box key={`${t.title}-${t.winnerId ?? 'tbc'}-${idx}`} sx={{ height: '100%' }}>
            <TrophyCard
              {...t}
              onButtonClick={t.winnerId ? () => openPlayerQuickView(t) : undefined}
            />
          </Box>
        )) : (
          <Typography sx={{ gridColumn: '1 / -1', textAlign: 'center', mt: 2 }}>
            No trophies to display.
          </Typography>
        )}
      </Box>

      {/* Player Quick View Modal (compact) */}
      <Dialog
        open={openQuickView}
        onClose={() => setOpenQuickView(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0, py: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 } }}>
          {quickView.trophyTitle ? `${quickView.trophyTitle} • ` : ''} Player
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setOpenQuickView(false)} edge="end" size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: { xs: 1, sm: 2 }, overflowX: 'hidden' }}>
          {quickView.player && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '170px 1fr', sm: '240px 1fr' },
                gap: { xs: 1.5, sm: 2 },
                alignItems: 'start'
              }}
            >
              {/* Left: PlayerCard with stats */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                width: '100%'
              }}>
                <Box sx={{
                  position: 'relative',
                  width: { xs: 170, sm: 240 },
                  height: { xs: 255, sm: 360 },
                  mx: { xs: 'auto', sm: 0 },
                  '& > *': {
                    transform: { xs: 'scale(0.7)', sm: 'none' },
                    transformOrigin: 'top left'
                  }
                }}>
                  {(() => {
                    const p = quickView.player as User & PlayerProfileLike;
                    const playerCardProps = {
                      name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
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
                      position: posToShort(p.position),
                    } as const;
                    return <PlayerCard {...playerCardProps} disableImagePopup />;
                  })()}
                </Box>
                {/* Icons grid under the player card - 2 columns on mobile */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: { xs: 1, sm: 1 },
                    maxWidth: { xs: 170, sm: '100%' },
                    mx: { xs: 'auto', sm: 0 },
                    mt: 2
                  }}
                >
                  {[
                    { img: Goals, label: 'Goals', value: quickView.stats?.goals ?? 0 },
                    { img: Assist, label: 'Assists', value: quickView.stats?.assists ?? 0 },
                    { img: Cleansheet, label: 'Clean Sheets', value: quickView.cleanSheets ?? 0 },
                    { img: Momt, label: 'Votes', value: quickView.motmCount ?? 0 },
                  ].map((it, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.25,
                        p: 0.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Image src={it.img} alt={it.label} width={24} height={24} style={{ objectFit: 'contain' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem' } }}>
                          {it.value}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          fontSize: { xs: it.label === 'Clean Sheets' ? '0.55rem' : '0.6rem', sm: '0.75rem' },
                          textAlign: 'center',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          letterSpacing: 0,
                        }}
                      >
                        {it.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {/* Right: Last 10 Matches */}
              <Paper elevation={0} sx={{
                p: { xs: 1.25, sm: 2 },
                border: '1px solid rgba(0,0,0,0.08)',
                height: { xs: 'auto', sm: '420px' },
                borderRadius: 2,
                overflowY: 'auto',
                position: 'relative'
              }}>
                <Typography sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '0.75rem', sm: '0.95rem' , md: '0.8rem' }, letterSpacing: 0.3 }}>Last 10 games</Typography>
                <Stack direction="column" spacing={1}>
                  {(quickView.lastFive ?? []).slice(0, 10).map((m, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: { xs: 26, sm: 32 },
                          height: { xs: 22, sm: 28 },
                          borderRadius: 1,
                          backgroundColor: resultColor(m.result),
                          color: '#fff',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.65rem', sm: '0.8rem' },
                          lineHeight: 1,
                        }}
                      >
                        {m.result}
                      </Box>
                      {idx === 0 && (
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
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
        </DialogContent>
      </Dialog>
    </Box>
  );
}
