'use client';
import { useAuth } from '@/lib/hooks';
import dynamic from 'next/dynamic';
import { AdminPanelSettings, Close, Delete, ExitToApp, People, CloudUpload, CheckCircle, Search, ExpandMore, Add as AddIcon, PowerSettingsNew } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography, Container, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, useTheme, useMediaQuery, Fade, Chip, CircularProgress, MenuItem, InputAdornment, FormControl, Select, RadioGroup, Radio, Switch, FormControlLabel, Grid } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SettingsIcon, X } from 'lucide-react';
import Image from 'next/image';
import AllLeaguesLoadingSkeleton from '@/Components/loading/AllLeaguesLoadingSkeleton';
import leagueIcon from '@/Components/images/league.png';
import trofy from '@/Components/images/trofy.png';
import trofyy from '@/Components/images/trofy1.png';
import faceicon from '@/Components/images/faceicon.png';
import schedule from '@/Components/images/schedule.png';
import inviteicon from '@/Components/images/inviteicon.png';
import fotbal from '@/Components/images/fotbal.png';
import playerfull from '@/Components/images/playerfull.png';
import share from '@/Components/images/share.png';
import play from '@/Components/images/play .png';
import setting from '@/Components/images/setting.png';
import ShirtImg from '@/Components/images/shirtimg.png';
import PlayerImg from '@/Components/images/playerimg.png';
import { User, League, Match } from '@/types/user';
import { useDispatch } from 'react-redux';
import { joinLeague } from '@/lib/features/leagueSlice';
import { AppDispatch } from '@/lib/store';
import Tooltip from '@mui/material/Tooltip';
import Slide, { SlideProps } from '@mui/material/Slide';

// Lazy load heavy components
const CloseButton = dynamic(() => import('@/Components/CloseButton'), { loading: () => <></>, ssr: false });

// Backend-computed league status types (avoid `any`)
type LeagueStatusTotals = Record<string, number>;
type LeagueStatusMissing = Array<string | { field: string; reason?: string }>;
type LeagueStatus = {
  isComplete?: boolean;
  isCompleted?: boolean;
  locked?: boolean;
  matchesPlayed?: number;
  gamesPlayed?: number;
  maxGames?: number;
  totals?: LeagueStatusTotals;
  missing?: LeagueStatusMissing;
};

// Local UI type to carry backend-computed status
type LeagueWithStatus = League & {
  computedStatus?: LeagueStatus;
  isLocked?: boolean;
};

// Helper function to format league name
const formatLeagueName = (name: string | undefined | null): string => {
  if (!name) return '';

  // Capitalize first letter of the name
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  // Get first letter of each word and join them
  const words = name.split(' ');
  const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

  // Return formatted name with initials in brackets
  return `${capitalizedName}`;
};

// Safe type guards/utilities
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const toFiniteNumber = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
  return Number.isFinite(n) ? n : undefined;
};

const normalizeLeagueComputedStatus = (value: unknown): LeagueStatus | undefined => {
  if (!isRecord(value)) return undefined;
  const raw = value as Record<string, unknown>;

  const matchesPlayed = toFiniteNumber(
    raw.matchesPlayed ?? raw.gamesPlayed ?? raw.played ?? raw.completedMatches ?? raw.totalPlayed
  );
  const maxGames = toFiniteNumber(
    raw.maxGames ?? raw.allowedGames ?? raw.totalGames ?? raw.totalMaxGames
  );
  const locked = raw.locked === true;
  const isComplete = raw.isComplete === true || raw.isCompleted === true;
  const missing = Array.isArray(raw.missing) ? (raw.missing as LeagueStatusMissing) : undefined;

  return {
    ...(raw as LeagueStatus),
    ...(typeof matchesPlayed === 'number' ? { matchesPlayed, gamesPlayed: matchesPlayed } : {}),
    ...(typeof maxGames === 'number' ? { maxGames } : {}),
    ...(locked ? { locked: true } : {}),
    ...(isComplete ? { isComplete: true, isCompleted: true } : {}),
    ...(missing ? { missing } : {}),
  };
};

// Normalize league.status into the union type from League
const normalizeLeagueStatus = (v: unknown): League['status'] => {
  if (typeof v !== 'string') return undefined;
  const s = v.toLowerCase();
  return s === 'active' || s === 'inactive' || s === 'completed' ? (s as League['status']) : undefined;
};

// Normalize matches array into typed Match[] (lenient defaults)
const normalizeMatches = (v: unknown): Match[] => {
  if (!Array.isArray(v)) return [];
  return v.map((item): Match => {
    const r = isRecord(item) ? item : {};
    const str = (k: string, fb = ''): string => (typeof r[k] === 'string' ? (r[k] as string) : fb);
    const num = (k: string): number | undefined => (typeof r[k] === 'number' ? (r[k] as number) : undefined);
    const bool = (k: string, fb = false): boolean => (typeof r[k] === 'boolean' ? (r[k] as boolean) : fb);
    return {
      id: str('id'),
      date: str('date'),
      location: str('location'),
      status: str('status'),
      homeTeamName: str('homeTeamName'),
      awayTeamName: str('awayTeamName'),
      homeTeamGoals: num('homeTeamGoals'),
      awayTeamGoals: num('awayTeamGoals'),
      availableUsers: [],
      homeTeamUsers: [],
      awayTeamUsers: [],
      end: str('end'),
      active: bool('active', true),
      awayTeamImage: str('awayTeamImage'),
      homeTeamImage: str('homeTeamImage'),
    };
  });
};

const dropdownPaperBaseSx = {
  mt: 0,
  maxHeight: { xs: 240, sm: 320 },
  overflowY: 'auto',
  overscrollBehavior: 'contain',
};

const dropdownMenuBaseProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
  transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
  variant: 'menu' as const,
  marginThreshold: 0,
};

// Normalize unknown payload from API/thunk into a League object
const normalizeLeagueFromPayload = (payload: unknown): League | null => {
  // Accept either direct League or wrapped { league: League }
  let raw: Record<string, unknown> | null = null;
  if (isRecord(payload) && 'league' in payload && isRecord((payload as Record<string, unknown>).league)) {
    raw = (payload as Record<string, unknown>).league as Record<string, unknown>;
  } else if (isRecord(payload)) {
    raw = payload as Record<string, unknown>;
  }

  if (!raw) return null;

  const idVal = raw.id;
  if (!(typeof idVal === 'string' || typeof idVal === 'number')) return null;
  const nowISO = new Date().toISOString();

  const str = (k: string, fallback = ''): string => {
    const v = raw![k];
    return typeof v === 'string' ? v : fallback;
  };
  const num = (k: string, fallback: number | undefined = undefined): number | undefined => {
    const v = raw![k];
    return typeof v === 'number' ? v : fallback;
  };
  const bool = (k: string, fallback = false): boolean => {
    const v = raw![k];
    return typeof v === 'boolean' ? v : fallback;
  };
  const arr = (k: string): unknown[] => (Array.isArray(raw![k]) ? (raw![k] as unknown[]) : []);

  const createdAt = str('createdAt', nowISO);
  const updatedAtCandidate = str('updatedAt', createdAt || nowISO);
  const computedStatus = normalizeLeagueComputedStatus(raw['computedStatus']);
  const isCompleteRaw = raw['isComplete'];
  const isCompletedRaw = raw['isCompleted'];
  const isLockedRaw = raw['isLocked'];
  const lockedRaw = raw['locked'];
  const archivedRaw = raw['archived'];

  const normalized: LeagueWithStatus & {
    isComplete?: boolean;
    isCompleted?: boolean;
    archived?: boolean;
  } = {
    id: String(idVal),
    name: str('name', 'My League'),
    inviteCode: str('inviteCode', ''),
    image: str('image', ''),
    createdAt,
    updatedAt: updatedAtCandidate,
    members: arr('members') as unknown as User[],
    administrators: arr('administrators') as unknown as User[],
    matches: normalizeMatches(raw['matches']),
    active: bool('active', true),
    maxGames: num('maxGames', 0) as number,
    showPoints: bool('showPoints', true),
    adminId: str('adminId', undefined as unknown as string),
    description: str('description', undefined as unknown as string),
    location: str('location', undefined as unknown as string),
    maxTeams: num('maxTeams'),
    currentTeams: num('currentTeams'),
    status: normalizeLeagueStatus(raw['status']),
    computedStatus,
    isLocked:
      (typeof isLockedRaw === 'boolean' && isLockedRaw)
      || (typeof lockedRaw === 'boolean' && lockedRaw)
      || computedStatus?.locked === true,
    ...(typeof isCompleteRaw === 'boolean' ? { isComplete: isCompleteRaw } : {}),
    ...(typeof isCompletedRaw === 'boolean' ? { isCompleted: isCompletedRaw } : {}),
    ...(typeof archivedRaw === 'boolean' ? { archived: archivedRaw } : {}),
  };

  return normalized;
};

// Recency helpers: newest first by updatedAt or createdAt
// const timeOf = (l: Pick<League, 'updatedAt' | 'createdAt'> | undefined | null): number => {
//   if (!l) return 0;
//   const src = (l.updatedAt || l.createdAt || '').trim();
//   const t = Date.parse(src);
//   return Number.isFinite(t) ? t : 0;
// };

// const compareLeaguesByRecency = (a: Pick<League, 'updatedAt' | 'createdAt'>, b: Pick<League, 'updatedAt' | 'createdAt'>): number => {
//   return timeOf(b) - timeOf(a);
// };

// Sort leagues alphabetically by name (A-Z)
const sortLeaguesByRecency = <T extends Pick<League, 'updatedAt' | 'createdAt'> & Pick<League, 'name'>>(arr: T[]): T[] => {
  return [...arr].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

const LEAGUE_IMAGE_MAX_SIZE_MB = 5;
const LEAGUE_IMAGE_MAX_SIZE_BYTES = LEAGUE_IMAGE_MAX_SIZE_MB * 1024 * 1024;

const validateLeagueImageFile = (file: File): boolean => {
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file');
    return false;
  }

  if (file.size > LEAGUE_IMAGE_MAX_SIZE_BYTES) {
    toast.error(`Image size limit is ${LEAGUE_IMAGE_MAX_SIZE_MB}MB. Please upload ${LEAGUE_IMAGE_MAX_SIZE_MB}MB or smaller.`);
    return false;
  }

  return true;
};


interface LeagueMembersDialogProps {
  open: boolean
  onClose: () => void
  league: League | null
  currentUserId: string
  onRemoveMember: (memberId: string) => void
  onLeaveLeague: (preferredAdminId?: string) => void
  onLeaveSeason?: (seasonId?: string) => void | Promise<void>
  onUpdateLeague: (data: LeagueUpdatePayload) => Promise<void> | void
  onDeleteLeague: () => Promise<void> | void
  openSettingsOnOpen?: boolean
  onMembersChanged?: () => void | Promise<void>
  onArchiveLeague?: () => void | Promise<void>
  onUnarchiveLeague?: () => void | Promise<void>
  onSeasonArchived?: (payload: { leagueId: string; seasonId: string }) => void
}

const Transition = React.forwardRef(function Transition(props: SlideProps, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />
})

function LeagueMembersDialog({
  open,
  onClose,
  league,
  currentUserId,
  onRemoveMember,
  onLeaveLeague,
  onLeaveSeason,
  onUpdateLeague,
  onDeleteLeague,
  openSettingsOnOpen,
  onMembersChanged,
  onArchiveLeague,
  onUnarchiveLeague,
  onSeasonArchived,
}: LeagueMembersDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [openSettings, setOpenSettings] = useState(false)
  const [selectedLeaveSeasonId, setSelectedLeaveSeasonId] = useState<string>('')
  useEffect(() => {
    if (open && openSettingsOnOpen && league && league.adminId === currentUserId) {
      setOpenSettings(true)
    }
  }, [open, openSettingsOnOpen, league, currentUserId])

  const availableSeasonsForCurrentUser = useMemo(() => {
    if (!league || !currentUserId) return [] as Season[]
    const leagueWithSeasons = league as League & { seasons?: Season[] }
    const seasons = Array.isArray(leagueWithSeasons.seasons) ? leagueWithSeasons.seasons : []
    const userId = String(currentUserId).trim()

    return seasons
      .filter((season) => !Boolean(season.archived) && !Boolean((season as Season & { deleted?: boolean }).deleted))
      .filter((season) => {
        const roster = Array.isArray(season.members) && season.members.length > 0
          ? season.members
          : (Array.isArray(season.players) ? season.players : [])
        return roster.some((member) => String(member?.id || '').trim() === userId)
      })
      .sort((a, b) => {
        const activeA = a.isActive ? 1 : 0
        const activeB = b.isActive ? 1 : 0
        if (activeA !== activeB) return activeB - activeA
        const numA = Number(a.seasonNumber || 0)
        const numB = Number(b.seasonNumber || 0)
        if (numA !== numB) return numB - numA
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
      })
  }, [league, currentUserId])

  const getSeasonDisplayName = useCallback((season: Season): string => {
    const baseName = season.name?.trim()
    if (baseName) return baseName
    if (season.seasonNumber) return `Season ${season.seasonNumber}`
    return 'Season'
  }, [])

  const selectedLeaveSeason = useMemo(
    () => availableSeasonsForCurrentUser.find((season) => String(season.id) === String(selectedLeaveSeasonId)) || null,
    [availableSeasonsForCurrentUser, selectedLeaveSeasonId]
  )

  useEffect(() => {
    if (!open || !league) return
    if (availableSeasonsForCurrentUser.length === 0) {
      if (selectedLeaveSeasonId) setSelectedLeaveSeasonId('')
      return
    }
    if (selectedLeaveSeasonId && availableSeasonsForCurrentUser.some((season) => String(season.id) === String(selectedLeaveSeasonId))) {
      return
    }
    const leagueWithSeasons = league as League & { currentSeason?: Season | null }
    const currentSeasonId = String(leagueWithSeasons.currentSeason?.id || '').trim()
    const preferredSeason =
      availableSeasonsForCurrentUser.find((season) => season.isActive)
      || availableSeasonsForCurrentUser.find((season) => String(season.id) === currentSeasonId)
      || availableSeasonsForCurrentUser[0]
    setSelectedLeaveSeasonId(String(preferredSeason?.id || ''))
  }, [availableSeasonsForCurrentUser, league, open, selectedLeaveSeasonId])

  if (!league) return null

  const isAdmin = league.adminId === currentUserId
  const memberCount = league.members?.length || 0
  const matchCount = league.matches?.length || 0
  const leagueAdmin = (league.members || []).find((m) => m.id === league.adminId)
    || (league.administrators || []).find((a) => a.id === league.adminId)
    || (league.administrators || [])[0]
  const leagueAdminName = `${leagueAdmin?.firstName || ''} ${leagueAdmin?.lastName || ''}`.trim() || 'Not available'

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the league?`)) {
      // Guard in case a parent passes undefined
      if (typeof onRemoveMember === 'function') onRemoveMember(memberId)
    }
  }

  const handleLeaveLeague = () => {
    if (window.confirm("Are you sure you want to leave this league?")) {
      onLeaveLeague()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(15,15,15,0.92)',
          color: '#E5E7EB',
          borderRadius: isMobile ? 0 : 3,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
          maxHeight: isMobile ? '100vh' : '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'transparent',
          color: '#E5E7EB',
          fontWeight: 700,
          fontSize: { xs: 18, sm: 22 },
          borderRadius: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, rgba(229,106,22,0.7), rgba(207,35,38,0.7))",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <People sx={{ fontSize: { xs: 20, sm: 24 }, color: "#e56a16" }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#E5E7EB",
                fontSize: { xs: 16, sm: 20 },
                lineHeight: 1.2,
              }}
            >
              {formatLeagueName(league.name)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#9CA3AF",
                fontSize: { xs: 12, sm: 14 },
                fontWeight: 500,
              }}
            >
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: "#E5E7EB",
            bgcolor: "rgba(255,255,255,0.08)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.12)",
              color: "#fff",
            },
            transition: "all 0.2s ease",
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: "transparent",
          px: 0,
          py: 0,
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "rgba(255,255,255,0.06)" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: "3px" },
        }}
      >
        {isAdmin ? (
          <List sx={{ py: 0 }}>
            {(league.members || []).map((member, index) => {
              const memberName = `${member.firstName} ${member.lastName}`
              const isLeagueAdmin = member.id === league.adminId
              const isCurrentUser = member.id === currentUserId

              return (
                <Fade in={true} timeout={300 + index * 100} key={member.id}>
                  <Box>
                    <ListItem
                      sx={{
                        py: { xs: 2, sm: 2.5 },
                        px: { xs: 2, sm: 3 },
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        bgcolor: isCurrentUser ? "rgba(255,255,255,0.06)" : "transparent",
                        borderLeft: isCurrentUser ? "3px solid #e56a16" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.06)",
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 56 }}>
                        <Box
                          sx={{
                            position: 'relative',
                            width: { xs: 44, sm: 52 },
                            height: { xs: 44, sm: 52 },
                            borderRadius: 1,
                            overflow: 'hidden',
                            background: 'transparent',
                            // border: isCurrentUser ? '2px solid #e56a16' : '1px solid rgba(255,255,255,0.2)',
                            // boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          }}
                        >
                          <Image src={ShirtImg} alt="Shirt" fill style={{ objectFit: 'contain' }} />
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                              fontWeight: 800,
                              fontSize: { xs: 14, sm: 16 },
                              lineHeight: 1,
                              textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                            }}
                          >
                            {/* {member.shirtNumber || '0'} */}
                          </Box>
                        </Box>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: "#E5E7EB",
                                fontSize: { xs: 16, sm: 18 },
                              }}
                            >
                              {memberName}
                            </Typography>
                            {isCurrentUser && (
                              <Chip
                                label="You"
                                size="small"
                                sx={{
                                  bgcolor: "transparent",
                                  color: "#e56a16",
                                  border: '1px solid rgba(229,106,22,0.6)',
                                  fontWeight: 600,
                                  fontSize: 11,
                                  height: 20,
                                  borderRadius: '9999px',
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                            {isLeagueAdmin && <AdminPanelSettings sx={{ fontSize: 16, color: "#e56a16" }} />}
                            <Typography
                              sx={{
                                color: isLeagueAdmin ? "#e56a16" : "#9CA3AF",
                                fontWeight: 500,
                                fontSize: { xs: 13, sm: 14 },
                              }}
                            >
                              {isLeagueAdmin ? "League Admin" : "Member"}
                            </Typography>
                          </Box>
                        }
                      />

                      {isAdmin && member.id !== currentUserId && (
                        <Tooltip title={`Remove ${memberName}`} arrow>
                          <IconButton
                            onClick={() => handleRemoveMember(member.id, memberName)}
                            sx={{
                              color: "#ff6b6b",
                              bgcolor: "rgba(255, 107, 107, 0.12)",
                              "&:hover": {
                                bgcolor: "rgba(255, 107, 107, 0.2)",
                                transform: "scale(1.05)",
                              },
                              transition: "all 0.2s ease",
                            }}
                          >
                            <Delete sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                    {index < (league.members?.length || 0) - 1 && (
                      <Divider sx={{ bgcolor: "rgba(255,255,255,0.08)", mx: 2 }} />
                    )}
                  </Box>
                </Fade>
              )
            })}
          </List>
        ) : (
          <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                bgcolor: 'rgba(255,255,255,0.03)',
              }}
            >
              <Typography sx={{ color: '#9CA3AF', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>
                Select Season
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedLeaveSeasonId}
                  onChange={(e) => setSelectedLeaveSeasonId(String(e.target.value || ''))}
                  displayEmpty
                  MenuProps={{
                    ...dropdownMenuBaseProps,
                    PaperProps: {
                      sx: {
                        ...dropdownPaperBaseSx,
                        bgcolor: '#111827',
                        color: '#E5E7EB',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
                        '& .MuiMenuItem-root': {
                          py: 1,
                          fontSize: 14,
                          color: '#E5E7EB',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(229,106,22,0.2)',
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: 'rgba(229,106,22,0.28)',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                          },
                        },
                      },
                    },
                  }}
                  sx={{
                    bgcolor: '#0f172a',
                    color: '#E5E7EB',
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(229,106,22,0.6)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e56a16',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#9CA3AF',
                    },
                  }}
                >
                  {availableSeasonsForCurrentUser.length > 0 ? (
                    availableSeasonsForCurrentUser.map((season) => (
                      <MenuItem key={season.id} value={season.id}>
                        {getSeasonDisplayName(season)} {season.isActive ? '(Active)' : ''}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No season membership found
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <Typography sx={{ mt: 1, color: 'rgba(229,231,235,0.68)', fontSize: 12 }}>
                {selectedLeaveSeason
                  ? `Selected: ${getSeasonDisplayName(selectedLeaveSeason)}`
                  : 'Select a season to leave.'}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                bgcolor: 'rgba(255,255,255,0.03)',
              }}
            >
              <Typography sx={{ color: '#9CA3AF', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                League Admin
              </Typography>
              <Typography sx={{ color: '#E5E7EB', fontSize: 18, fontWeight: 700 }}>
                {leagueAdminName}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Typography sx={{ color: '#9CA3AF', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Players
                  </Typography>
                  <Typography sx={{ color: '#E5E7EB', fontSize: 20, fontWeight: 700 }}>
                    {memberCount}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Typography sx={{ color: '#9CA3AF', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Matches
                  </Typography>
                  <Typography sx={{ color: '#E5E7EB', fontSize: 20, fontWeight: 700 }}>
                    {matchCount}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          background: "transparent",
          p: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {!isAdmin && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>

            <Button
              startIcon={<ExitToApp />}
              onClick={handleLeaveLeague}
              sx={{
                fontWeight: 600,
                bgcolor: "#fff",
                color: "#d32f2f",
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                "&:hover": {
                  bgcolor: "#ffebee",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Leave League
            </Button>
            <Button
              startIcon={<ExitToApp />}
              onClick={() => { try { void onLeaveSeason?.(selectedLeaveSeasonId || undefined) } catch { } }}
              disabled={!selectedLeaveSeasonId}
              sx={{
                fontWeight: 600,
                bgcolor: "#e56a16",
                color: "#fff",
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                "&:hover": {
                  bgcolor: "#c75712",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Leave Season
            </Button>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          {isAdmin && (
            <Button
              onClick={() => setOpenSettings(true)}
              sx={{
                fontWeight: 600,
                color: "#fff",
                borderColor: "#e56a16",
                borderRadius: 2,
                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                px: 3,
                py: 1,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                '&:hover': { background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)' },
                transition: "all 0.2s ease",
              }}
              startIcon={<SettingsIcon size={18} />}
            >
              Settings
            </Button>
          )}
          <Button
            onClick={onClose}
            sx={{
              fontWeight: 600,
              color: "#e56a16",
              borderColor: "#e56a16",
              borderRadius: 2,
              border: "2px solid",
              bgcolor: "transparent",
              px: 3,
              py: 1,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                bgcolor: "rgba(229,106,22,0.12)",
                borderColor: "#e56a16",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
      {isAdmin && league && (
        <LeagueSettingsDialog
          open={openSettings}
          onClose={() => setOpenSettings(false)}
          league={league}
          onUpdate={async (data) => {
            await onUpdateLeague(data)
            setOpenSettings(false)
          }}
          onDelete={async () => {
            await onDeleteLeague()
            setOpenSettings(false)
          }}
          currentUserId={currentUserId}
          onMembersChanged={onMembersChanged}
          onRemoveMember={onRemoveMember}
          onLeaveLeague={onLeaveLeague}
          onArchive={onArchiveLeague}
          onUnarchive={onUnarchiveLeague}
          onSeasonArchived={onSeasonArchived}
        />
      )}
    </Dialog>
  )
}

// Season interface
interface Season {
  id: string;
  leagueId: string;
  seasonNumber: number;
  name: string;
  inviteCode?: string;
  seasonInviteCode?: string;
  isActive: boolean;
  archived?: boolean;
  deleted?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  maxGames?: number;
  showPoints?: boolean; // CF Advance Point Scoring per season
  members?: User[];
  players?: User[];
}

type MatchWithSeason = Match & {
  archived?: boolean;
  seasonId?: string | null;
  matchNumber?: number;
};

// Payload type for updating league settings
type LeagueUpdatePayload = {
  name: string
  active: boolean
  maxGames: number
  showPoints: boolean
  admins: string[]
  seasonId?: string
  seasonMaxGames?: number
  seasonShowPoints?: boolean
  imageFile?: File | null
  removeImage?: boolean
}

// Payload type for updating season settings
type SeasonUpdatePayload = {
  maxGames: number;
  isActive?: boolean;
  showPoints?: boolean; // CF Advance Point Scoring per season
}

interface LeagueSettingsDialogProps {
  open: boolean
  onClose: () => void
  league: League & { seasons?: Season[] }
  onUpdate: (data: LeagueUpdatePayload) => void | Promise<void>
  onDelete: () => void | Promise<void>
  currentUserId: string
  onRemoveMember: (memberId: string) => void | Promise<void>
  onLeaveLeague?: (preferredAdminId?: string) => void | Promise<void>
  onMembersChanged?: () => void | Promise<void>;
  onArchive?: () => void | Promise<void>;
  onUnarchive?: () => void | Promise<void>;
  onSeasonArchived?: (payload: { leagueId: string; seasonId: string }) => void;
}

function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete, currentUserId, onRemoveMember, onLeaveLeague, onMembersChanged, onArchive, onUnarchive, onSeasonArchived }: LeagueSettingsDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [name, setName] = useState('')
  const [adminId, setAdminId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showPoints, setShowPoints] = useState(true)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')
  const [seasonMaxGames, setSeasonMaxGames] = useState(20)
  const [seasonShowPoints, setSeasonShowPoints] = useState(true)
  const [settingsImageFile, setSettingsImageFile] = useState<File | null>(null)
  const [settingsImagePreview, setSettingsImagePreview] = useState<string | null>(null)
  const [settingsRemoveImage, setSettingsRemoveImage] = useState(false)
  const settingsFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const lastLeagueIdRef = React.useRef<string | null>(null)
  const { token } = useAuth()
  const [archivedMatchesOpen, setArchivedMatchesOpen] = useState(false)
  const [archivedMatchesLoading, setArchivedMatchesLoading] = useState(false)
  const [archivedMatchActionId, setArchivedMatchActionId] = useState<string | null>(null)
  const [archivedMatches, setArchivedMatches] = useState<MatchWithSeason[]>([])
  const [archivedSeasonIds, setArchivedSeasonIds] = useState<string[]>([])
  const [restoredSeasonIds, setRestoredSeasonIds] = useState<string[]>([])
  const [deletedSeasonIds, setDeletedSeasonIds] = useState<string[]>([])
  const [archiveSeasonConfirmOpen, setArchiveSeasonConfirmOpen] = useState(false)
  const [seasonArchiveLoading, setSeasonArchiveLoading] = useState(false)
  const [archivedSeasonsOpen, setArchivedSeasonsOpen] = useState(false)
  const [archivedSeasonActionId, setArchivedSeasonActionId] = useState<string | null>(null)

  const allSeasons = useMemo(() => (league?.seasons || []) as Season[], [league?.seasons])
  const seasons = useMemo(
    () => allSeasons.filter((s) => {
      if (Boolean((s as Season & { deleted?: boolean }).deleted) || deletedSeasonIds.includes(s.id)) return false
      if (archivedSeasonIds.includes(s.id)) return false
      if (restoredSeasonIds.includes(s.id)) return true
      return !Boolean(s.archived)
    }),
    [allSeasons, archivedSeasonIds, restoredSeasonIds, deletedSeasonIds],
  )
  const archivedSeasons = useMemo(
    () => allSeasons.filter((s) => {
      if (Boolean((s as Season & { deleted?: boolean }).deleted) || deletedSeasonIds.includes(s.id)) return false
      if (restoredSeasonIds.includes(s.id)) return false
      return Boolean(s.archived) || archivedSeasonIds.includes(s.id)
    }),
    [allSeasons, archivedSeasonIds, restoredSeasonIds, deletedSeasonIds],
  )
  const currentSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId) || null,
    [seasons, selectedSeasonId],
  )
  const seasonAwareMatches = useMemo(
    () => ((league?.matches || []) as MatchWithSeason[]),
    [league?.matches],
  )
  const leagueHasAnyMatches = useMemo(() => seasonAwareMatches.length > 0, [seasonAwareMatches])

  useEffect(() => {
    if (league) {
      if (lastLeagueIdRef.current !== league.id) {
        setArchivedSeasonIds([])
        setRestoredSeasonIds([])
        setDeletedSeasonIds([])
        lastLeagueIdRef.current = league.id
      }
      setName(league.name || '')
      setIsActive(league.active !== false)
      setShowPoints(league.showPoints !== false)
      setSettingsImageFile(null)
      setSettingsImagePreview(league.image || null)
      setSettingsRemoveImage(false)
      // Prefer explicit adminId, fall back to first administrator if present
      setAdminId(league.adminId || league.administrators?.[0]?.id || '')

      // Set selected season to active season or first non-archived season
      const nonArchivedSeasons = (league.seasons || []).filter((s) => !Boolean(s.archived) && !Boolean((s as Season & { deleted?: boolean }).deleted))
      const activeSeason = nonArchivedSeasons.find(s => s.isActive)
      const currentSeason = activeSeason || (nonArchivedSeasons.length > 0 ? nonArchivedSeasons[0] : null)

      if (currentSeason) {
        setSelectedSeasonId(currentSeason.id)
        setSeasonMaxGames(currentSeason.maxGames || league.maxGames || 20)
        setSeasonShowPoints(currentSeason.showPoints !== false)
      } else {
        setSelectedSeasonId('')
        setSeasonMaxGames(league.maxGames || 20)
        setSeasonShowPoints(league.showPoints !== false)
      }
    }
  }, [league])

  useEffect(() => {
    if (seasons.length === 0) {
      if (selectedSeasonId) setSelectedSeasonId('')
      return
    }

    if (!selectedSeasonId || !seasons.some((s) => s.id === selectedSeasonId)) {
      const fallbackSeason = seasons.find((s) => s.isActive) || seasons[0]
      setSelectedSeasonId(fallbackSeason.id)
    }
  }, [selectedSeasonId, seasons])

  // Update values when selected season changes
  useEffect(() => {
    if (currentSeason) {
      setSeasonMaxGames(currentSeason.maxGames || league.maxGames || 20)
      setSeasonShowPoints(currentSeason.showPoints !== false)
    }
  }, [currentSeason, league.maxGames])

  const handleUpdate = async () => {
    if (!canManageLeagueSettings) return

    if (selectedSeasonId) {
      const seasonRoster = Array.isArray(currentSeason?.members) && currentSeason.members.length > 0
        ? currentSeason.members
        : (Array.isArray(currentSeason?.players) ? currentSeason.players : [])
      const seasonMemberIds = new Set(
        seasonRoster
          .map((member) => String(member.id || '').trim())
          .filter((id) => id.length > 0),
      )

      if (seasonMemberIds.size > 0 && (!adminId || !seasonMemberIds.has(String(adminId)))) {
        toast.error('Select a league admin who is active in the selected season.')
        return
      }
    }

    const updatedData: LeagueUpdatePayload = {
      name,
      active: isActive,
      maxGames: league.maxGames || 20, // Keep league-level maxGames for backward compatibility
      showPoints,
      admins: adminId ? [adminId] : [],
      // Include season settings so they're updated atomically with league
      ...(selectedSeasonId ? {
        seasonId: selectedSeasonId,
        seasonMaxGames: seasonMaxGames,
        seasonShowPoints: seasonShowPoints,
      } : {}),
      // Image changes
      ...(settingsImageFile ? { imageFile: settingsImageFile } : {}),
      ...(settingsRemoveImage ? { removeImage: true } : {}),
    }
    try {
      await Promise.resolve(onUpdate(updatedData))
      if (onMembersChanged) {
        try {
          await Promise.resolve(onMembersChanged())
        } catch (refreshErr) {
          console.warn('League settings saved, but member refresh failed:', refreshErr)
        }
      }
      toast.success('Settings updated successfully')
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update league settings'
      toast.error(msg)
    }
  }

  const getSeasonLabel = useCallback((season?: Season | null): string => {
    if (!season) return 'Season'
    const fallback = season.seasonNumber ? `Season ${season.seasonNumber}` : 'Season'
    return season.name?.trim() || fallback
  }, [])

  const getSeasonMatchCount = useCallback((seasonId?: string): number => {
    if (!seasonId) return 0
    return seasonAwareMatches.filter((m) => String(m.seasonId || '') === String(seasonId)).length
  }, [seasonAwareMatches])

  const closeArchiveSeasonConfirm = useCallback(() => {
    if (!seasonArchiveLoading) setArchiveSeasonConfirmOpen(false)
  }, [seasonArchiveLoading])

  const openArchiveSeasonConfirm = useCallback(() => {
    if (!currentSeason || !selectedSeasonId) {
      toast.error('Please select a season first')
      return
    }
    setArchiveSeasonConfirmOpen(true)
  }, [currentSeason, selectedSeasonId])

  const handleArchiveSelectedSeason = useCallback(async () => {
    if (!currentSeason || !selectedSeasonId) {
      toast.error('Please select a season first')
      return
    }
    if (!token || !league?.id) {
      toast.error('Please login again and try.')
      return
    }

    const seasonLabel = getSeasonLabel(currentSeason)
    setSeasonArchiveLoading(true)

    const leaguePatchPayload = {
      name,
      active: isActive,
      maxGames: league.maxGames || 20,
      showPoints,
      admins: adminId ? [adminId] : [],
      seasonId: selectedSeasonId,
      seasonArchived: true,
      archived: true,
      seasonStatus: 'archived',
      seasonIsActive: false,
      seasonActive: false,
      seasonMaxGames,
      seasonShowPoints,
    }

    const endpointCandidates = [
      { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}`, body: leaguePatchPayload },
      { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, body: leaguePatchPayload },
      { method: 'POST', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/archive`, body: { archived: true } },
      { method: 'POST', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/archive`, body: { archived: true } },
      { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}`, body: { archived: true, isActive: false } },
      { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${selectedSeasonId}`, body: { archived: true, isActive: false } },
      { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/status`, body: { archived: true, active: false, isActive: false } },
      { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/status`, body: { archived: true, active: false, isActive: false } },
    ] as const

    let lastMessage = 'Failed to archive season'

    try {
      let archived = false
      let allNotFound = true
      let canUseLocalFallback = true
      let localFallbackUsed = false

      for (const candidate of endpointCandidates) {
        const response = await fetch(candidate.url, {
          method: candidate.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(candidate.body),
        })

        const payloadUnknown: unknown = await response.json().catch(() => ({}))
        const payload = isRecord(payloadUnknown)
          ? payloadUnknown as { success?: boolean; message?: string }
          : {}

        if (response.status !== 404) {
          allNotFound = false
        }
        if (![400, 404, 422].includes(response.status)) {
          canUseLocalFallback = false
        }

        if (response.ok && payload.success !== false) {
          archived = true
          break
        }

        if (payload.message) lastMessage = payload.message
      }

      if (!archived && allNotFound) {
        archived = true
        localFallbackUsed = true
      }
      if (!archived && canUseLocalFallback) {
        archived = true
        localFallbackUsed = true
      }

      if (!archived) {
        throw new Error(lastMessage)
      }

      setArchivedSeasonIds((prev) => (prev.includes(selectedSeasonId) ? prev : [...prev, selectedSeasonId]))
      setRestoredSeasonIds((prev) => prev.filter((id) => id !== selectedSeasonId))
      setDeletedSeasonIds((prev) => prev.filter((id) => id !== selectedSeasonId))
      onSeasonArchived?.({ leagueId: String(league.id), seasonId: String(selectedSeasonId) })

      const remainingSeasons = seasons.filter((s) => s.id !== selectedSeasonId)
      if (remainingSeasons.length > 0) {
        const nextSeason = remainingSeasons.find((s) => s.isActive) || remainingSeasons[0]
        setSelectedSeasonId(nextSeason.id)
        setSeasonMaxGames(nextSeason.maxGames || league.maxGames || 20)
        setSeasonShowPoints(nextSeason.showPoints !== false)
      } else {
        setSelectedSeasonId('')
      }

      setArchiveSeasonConfirmOpen(false)
      toast.success(localFallbackUsed
        ? `${seasonLabel} archived locally (backend season endpoint not available)`
        : `${seasonLabel} archived successfully`)
      if (!localFallbackUsed && onMembersChanged) {
        await Promise.resolve(onMembersChanged())
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to archive season'
      toast.error(msg)
    } finally {
      setSeasonArchiveLoading(false)
    }
  }, [
    currentSeason,
    selectedSeasonId,
    token,
    league?.id,
    league.maxGames,
    seasons,
    onMembersChanged,
    getSeasonLabel,
    name,
    isActive,
    showPoints,
    adminId,
    seasonMaxGames,
    seasonShowPoints,
    onSeasonArchived,
  ])

  // Helper to determine if a given user is an admin of this league
  const isUserLeagueAdmin = (userId?: string | null): boolean => {
    if (!userId || !league) return false
    if (league.adminId && league.adminId === userId) return true
    if (Array.isArray(league.administrators)) {
      return league.administrators.some(a => a?.id === userId)
    }
    return false
  }

  const currentUserIsAdmin = isUserLeagueAdmin(currentUserId)
  const canManageLeagueSettings = currentUserIsAdmin
  const leagueIsArchived = Boolean((league as League & { archived?: boolean }).archived)

  const fetchArchivedMatches = useCallback(async () => {
    const fallback = ((league?.matches || []) as Array<Match & { archived?: boolean; seasonId?: string; matchNumber?: number }>)
      .filter((m) => Boolean(m.archived));
    if (!token || !league?.id) {
      setArchivedMatches(fallback);
      return;
    }

    setArchivedMatchesLoading(true);
    try {
      const bust = Date.now();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}?bust=${bust}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jsonUnknown: unknown = await res.json().catch(() => ({}));
      const json = (typeof jsonUnknown === 'object' && jsonUnknown !== null)
        ? jsonUnknown as { success?: boolean; league?: { matches?: Array<Match & { archived?: boolean; seasonId?: string; matchNumber?: number }> } }
        : {};
      if (!res.ok || !json.success) {
        setArchivedMatches(fallback);
        return;
      }
      const allMatches = Array.isArray(json.league?.matches) ? json.league.matches : [];
      const archivedOnly = allMatches.filter((m) => Boolean(m?.archived));
      setArchivedMatches(archivedOnly);
    } catch {
      setArchivedMatches(fallback);
    } finally {
      setArchivedMatchesLoading(false);
    }
  }, [league?.id, league?.matches, token]);

  const openArchivedMatchesDialog = useCallback(async () => {
    setArchivedMatchesOpen(true);
    await fetchArchivedMatches();
  }, [fetchArchivedMatches]);

  const handleRestoreArchivedMatch = useCallback(async (matchId: string) => {
    if (!token) return;
    setArchivedMatchActionId(matchId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) {
        let msg = 'Failed to restore match';
        try {
          const payload = await res.json();
          if (payload?.message) msg = payload.message;
        } catch { }
        throw new Error(msg);
      }
      setArchivedMatches(prev => prev.filter(m => m.id !== matchId));
      toast.success('Match restored');
      if (onMembersChanged) await Promise.resolve(onMembersChanged());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to restore match';
      toast.error(msg);
    } finally {
      setArchivedMatchActionId(null);
    }
  }, [token, onMembersChanged]);

  const handlePermanentDeleteArchivedMatch = useCallback(async (matchId: string) => {
    if (!token) return;
    if (!window.confirm('Permanently delete this archived match? It cannot be restored later, but player stats/history will stay preserved.')) return;
    setArchivedMatchActionId(matchId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        let msg = 'Failed to permanently delete match';
        try {
          const json = await res.json();
          if (json?.message) msg = json.message;
        } catch { }
        throw new Error(msg);
      }

      setArchivedMatches(prev => prev.filter(m => m.id !== matchId));
      toast.success('Match permanently deleted');
      if (onMembersChanged) await Promise.resolve(onMembersChanged());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to permanently delete match';
      toast.error(msg);
    } finally {
      setArchivedMatchActionId(null);
    }
  }, [token, onMembersChanged]);

  const handleRestoreArchivedSeason = useCallback(async (season: Season) => {
    if (!token || !league?.id) {
      toast.error('Please login again and try.')
      return
    }

    const seasonId = String(season.id)
    setArchivedSeasonActionId(seasonId)
    try {
      const candidates: Array<{ method: 'POST' | 'PATCH'; url: string; body?: Record<string, unknown> }> = [
        { method: 'POST', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${seasonId}/restore` },
        { method: 'POST', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${seasonId}/restore` },
        { method: 'POST', url: `${process.env.NEXT_PUBLIC_API_URL}/api/seasons/${seasonId}/restore` },
        { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${seasonId}/status`, body: { archived: false } },
        { method: 'PATCH', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${seasonId}/status`, body: { archived: false } },
      ]

      let done = false
      let lastMessage = 'Failed to restore season'

      for (const candidate of candidates) {
        const res = await fetch(candidate.url, {
          method: candidate.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: candidate.body ? JSON.stringify(candidate.body) : undefined,
        })

        const payloadUnknown: unknown = await res.json().catch(() => ({}))
        const payload = isRecord(payloadUnknown)
          ? payloadUnknown as { success?: boolean; message?: string }
          : {}

        if (res.ok && payload.success !== false) {
          done = true
          break
        }
        if (payload.message) lastMessage = payload.message
      }

      if (!done) throw new Error(lastMessage)

      setArchivedSeasonIds((prev) => prev.filter((id) => id !== seasonId))
      setDeletedSeasonIds((prev) => prev.filter((id) => id !== seasonId))
      setRestoredSeasonIds((prev) => (prev.includes(seasonId) ? prev : [...prev, seasonId]))
      toast.success('Season restored')
      if (onMembersChanged) await Promise.resolve(onMembersChanged())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to restore season'
      toast.error(msg)
    } finally {
      setArchivedSeasonActionId(null)
    }
  }, [league?.id, onMembersChanged, token])

  const handlePermanentDeleteArchivedSeason = useCallback(async (season: Season) => {
    if (!token || !league?.id) {
      toast.error('Please login again and try.')
      return
    }

    const seasonId = String(season.id)
    const seasonLabel = getSeasonLabel(season)
    if (!window.confirm(`Permanently delete "${seasonLabel}"? Data will be hidden, but history/XP/awards remain safe.`)) return

    setArchivedSeasonActionId(seasonId)
    try {
      const candidates = [
        { method: 'DELETE', url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${seasonId}` },
        { method: 'DELETE', url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${seasonId}` },
        { method: 'DELETE', url: `${process.env.NEXT_PUBLIC_API_URL}/api/seasons/${seasonId}` },
      ] as const

      let done = false
      let lastMessage = 'Failed to permanently delete season'

      for (const candidate of candidates) {
        const res = await fetch(candidate.url, {
          method: candidate.method,
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const payloadUnknown: unknown = await res.json().catch(() => ({}))
        const payload = isRecord(payloadUnknown)
          ? payloadUnknown as { success?: boolean; message?: string }
          : {}

        if (res.ok && payload.success !== false) {
          done = true
          break
        }
        if (payload.message) lastMessage = payload.message
      }

      if (!done) throw new Error(lastMessage)

      setArchivedSeasonIds((prev) => prev.filter((id) => id !== seasonId))
      setRestoredSeasonIds((prev) => prev.filter((id) => id !== seasonId))
      setDeletedSeasonIds((prev) => (prev.includes(seasonId) ? prev : [...prev, seasonId]))
      if (selectedSeasonId === seasonId) {
        setSelectedSeasonId('')
      }
      toast.success('Season permanently deleted')
      if (onMembersChanged) await Promise.resolve(onMembersChanged())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to permanently delete season'
      toast.error(msg)
    } finally {
      setArchivedSeasonActionId(null)
    }
  }, [getSeasonLabel, league?.id, onMembersChanged, selectedSeasonId, token])

  const currentSeasonRoster = React.useMemo(() => {
    const rosterFromMembers = Array.isArray(currentSeason?.members) ? currentSeason.members : []
    if (rosterFromMembers.length > 0) return rosterFromMembers
    return Array.isArray(currentSeason?.players) ? currentSeason.players : []
  }, [currentSeason?.members, currentSeason?.players])

  const seasonMembers = React.useMemo(() => {
    const leagueMembers = Array.isArray(league?.members) ? league.members : [] as User[]
    if (currentSeasonRoster.length === 0) return [] as User[]

    const bySeasonId = new Map(
      currentSeasonRoster
        .map((member) => [String(member.id || '').trim(), member] as const)
        .filter(([id]) => id.length > 0)
    )

    return leagueMembers
      .filter((member) => bySeasonId.has(String(member.id || '').trim()))
      .map((member) => {
        const seasonScopedMember = bySeasonId.get(String(member.id || '').trim())
        return seasonScopedMember ? { ...member, ...seasonScopedMember } : member
      })
  }, [currentSeasonRoster, league?.members])

  // Sort season members: Admins first, then current user, then by name
  const sortedSeasonMembers = React.useMemo(() => {
    const list = [...seasonMembers]
    return list.sort((a, b) => {
      const aAdmin = isUserLeagueAdmin(a.id) ? 1 : 0;
      const bAdmin = isUserLeagueAdmin(b.id) ? 1 : 0;
      if (aAdmin !== bAdmin) return bAdmin - aAdmin; // admins first
      const aCur = a.id === currentUserId ? 1 : 0;
      const bCur = b.id === currentUserId ? 1 : 0;
      if (aCur !== bCur) return bCur - aCur; // current user next
      const an = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const bn = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
      return an.localeCompare(bn);
    });
  }, [seasonMembers, currentUserId, isUserLeagueAdmin]);

  const currentUserInSelectedSeason = React.useMemo(
    () => sortedSeasonMembers.some((member) => String(member.id) === String(currentUserId)),
    [sortedSeasonMembers, currentUserId],
  )

  const handleLeaveSelectedSeason = useCallback(async () => {
    if (!token || !league?.id || !selectedSeasonId) {
      toast.error('Please select a season first')
      return
    }
    if (!currentUserInSelectedSeason) {
      toast.error('You are not part of this selected season')
      return
    }

    const seasonLabel = currentSeason ? getSeasonLabel(currentSeason) : 'this season'
    const confirmed = window.confirm(`Are you sure you want to leave "${seasonLabel}"?`)
    if (!confirmed) return

    const attempts = [
      `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/leave`,
      `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/leave`,
      `${process.env.NEXT_PUBLIC_API_URL}/api/seasons/${selectedSeasonId}/leave`,
    ]

    let success = false
    let message = 'Failed to leave season'

    for (const url of attempts) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        const payloadUnknown: unknown = await response.json().catch(() => ({}))
        const payload = isRecord(payloadUnknown) ? payloadUnknown as { success?: boolean; message?: string } : {}

        if (response.ok && payload.success !== false) {
          success = true
          break
        }
        if (payload.message) message = payload.message
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : ''
        if (errMsg) message = errMsg
      }
    }

    if (!success) {
      toast.error(message)
      return
    }

    toast.success('You have left the selected season')
    if (typeof onMembersChanged === 'function') {
      await Promise.resolve(onMembersChanged())
    }
    onClose()
  }, [currentSeason, currentUserInSelectedSeason, getSeasonLabel, league?.id, onClose, onMembersChanged, selectedSeasonId, token])

  // Do not return before declaring hooks to preserve hook order. Render nothing if no league.
  if (!league) return null

  // Remove member with admin safety: if removing current admin, require selecting replacement admin first
  const handleAdminRemoveMember = async (member: User) => {
    const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'this member'

    // If removing an admin, enforce replacement selection
    if (isUserLeagueAdmin(member.id)) {
      if (!adminId || adminId === member.id) {
        window.alert('Please select a replacement admin from the "Select league admin" dropdown before removing this admin.')
        return
      }
      const confirmAdmin = window.confirm(`You are removing an admin (\"${memberName}\"). The admin role will be transferred to the selected replacement before removal. Continue?`)
      if (!confirmAdmin) return
      try {
        await Promise.resolve(onUpdate({
          name,
          active: isActive,
          maxGames: league.maxGames || 20,
          showPoints,
          admins: [adminId],
        }))
      } catch {
        // If updating admin fails, abort removal
        return
      }
    }

    const confirmRemove = window.confirm(`Remove ${memberName} from the league?`)
    if (!confirmRemove) return
    try {
      if (typeof onRemoveMember === 'function') {
        await Promise.resolve(onRemoveMember(member.id))
        if (typeof onMembersChanged === 'function') {
          await Promise.resolve(onMembersChanged())
        }
      }
    } catch { }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(15,15,15,0.92)',
          color: '#E5E7EB',
          borderRadius: isMobile ? 0 : 3,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', position: 'relative', color: '#E5E7EB' }}>
        Manage League Settings
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: '#9CA3AF', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} md={6}>
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Season Selector */}
              {seasons.length > 0 && (
                <FormControl fullWidth>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                    Select Season
                  </Typography>
                  <Select
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value as string)}
                    sx={{
                      color: '#E5E7EB',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0388E3' },
                      '& .MuiSelect-icon': { color: '#E5E7EB' },
                    }}
                    MenuProps={{
                      ...dropdownMenuBaseProps,
                      PaperProps: {
                        sx: {
                          ...dropdownPaperBaseSx,
                          bgcolor: 'rgba(15,15,15,0.98)',
                          color: '#E5E7EB',
                          border: '1px solid rgba(255,255,255,0.08)',
                        },
                      },
                    }}
                  >
                    {seasons.map((season) => (
                      <MenuItem key={season.id} value={season.id}>
                        {season.name} {season.isActive && '(Active)'}
                      </MenuItem>
                    ))}
                  </Select>
                  {currentSeason && (
                    <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                      Current matches in this season: {getSeasonMatchCount(currentSeason.id)}
                    </Typography>
                  )}
                </FormControl>
              )}
              {seasons.length === 0 && (
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  No active season available. Open Archived Seasons to review archived ones.
                </Typography>
              )}

              <FormControl fullWidth>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  Select league admin
                </Typography>
                <Select
                  value={sortedSeasonMembers.some((member) => String(member.id) === String(adminId)) ? adminId : ''}
                  onChange={(e) => setAdminId(e.target.value as string)}
                  disabled={!canManageLeagueSettings || sortedSeasonMembers.length === 0}
                  sx={{
                    color: '#E5E7EB',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0388E3' },
                    '& .MuiSelect-icon': { color: '#E5E7EB' },
                  }}
                  MenuProps={{
                    ...dropdownMenuBaseProps,
                    PaperProps: {
                      sx: {
                        ...dropdownPaperBaseSx,
                        bgcolor: 'rgba(15,15,15,0.98)',
                        color: '#E5E7EB',
                        border: '1px solid rgba(255,255,255,0.08)',
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    {sortedSeasonMembers.length > 0 ? 'Select active season player' : 'No active players in this season'}
                  </MenuItem>
                  {sortedSeasonMembers.map((member: User) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                  Only players active in the selected season can be assigned as league admin.
                </Typography>
              </FormControl>

              <FormControl fullWidth>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  League name
                </Typography>
                <TextField
                  fullWidth
                  value={name}
                  onChange={(e) => {
                    const raw = e.target.value || ''
                    const cleaned = raw.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 30)
                    setName(cleaned)
                  }}
                  disabled={!canManageLeagueSettings}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#E5E7EB',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                      '&.Mui-focused fieldset': { borderColor: '#0388E3' },
                    },
                    '& .MuiInputBase-input': { color: '#E5E7EB' },
                  }}
                  InputLabelProps={{ sx: { color: '#9CA3AF' } }}
                  FormHelperTextProps={{ sx: { color: '#E5E7EB' } }}
                  inputProps={{ maxLength: 30 }}
                  helperText="Max 30 characters, letters/numbers only"
                />
              </FormControl>

              {/* League Display Picture */}
              <FormControl fullWidth>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  League Display Picture
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 1.5,
                  p: 2,
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.03)',
                  minHeight: 70,
                }}>
                  <Avatar
                    src={settingsImagePreview || '/assets/league.png'}
                    alt="League Image"
                    sx={{
                      width: 56,
                      height: 56,
                      border: '2px solid rgba(255,255,255,0.2)',
                      background: '#2B2B2B',
                    }}
                    variant="rounded"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: '#E5E7EB', mb: 0.3 }}>
                      {settingsImagePreview && !settingsRemoveImage ? 'Current Image' : 'No Image'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                      {settingsImagePreview && !settingsRemoveImage
                        ? `Upload a new image to replace or click Remove (Max ${LEAGUE_IMAGE_MAX_SIZE_MB}MB)`
                        : `Upload a custom image for your league (Max ${LEAGUE_IMAGE_MAX_SIZE_MB}MB)`}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {canManageLeagueSettings ? (
                    <>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        sx={{
                          color: '#0388E3',
                          borderColor: 'rgba(3,136,227,0.5)',
                          borderRadius: 2,
                          px: 2,
                          fontWeight: 600,
                          fontSize: 13,
                          '&:hover': {
                            borderColor: '#0388E3',
                            backgroundColor: 'rgba(3,136,227,0.08)',
                          },
                        }}
                      >
                        {settingsImagePreview && !settingsRemoveImage ? 'Change Image' : 'Upload Image'}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          ref={settingsFileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (!validateLeagueImageFile(file)) {
                              try { (e.target as HTMLInputElement).value = '' } catch { }
                              return
                            }
                            setSettingsImageFile(file)
                            setSettingsRemoveImage(false)
                            const reader = new FileReader()
                            reader.onload = (ev) => setSettingsImagePreview(ev.target?.result as string)
                            reader.readAsDataURL(file)
                          }}
                          onClick={(e) => { try { (e.target as HTMLInputElement).value = '' } catch { } }}
                        />
                      </Button>
                      {settingsImagePreview && !settingsRemoveImage && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSettingsImageFile(null)
                            setSettingsImagePreview(null)
                            setSettingsRemoveImage(true)
                            if (settingsFileInputRef.current) { try { settingsFileInputRef.current.value = '' } catch { } }
                          }}
                          sx={{
                            color: '#ff6b6b',
                            borderColor: 'rgba(255,107,107,0.5)',
                            borderRadius: 2,
                            px: 2,
                            fontWeight: 600,
                            fontSize: 13,
                            '&:hover': {
                              borderColor: '#ff6b6b',
                              backgroundColor: 'rgba(255,107,107,0.08)',
                            },
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                      Only league admins can change league image settings.
                    </Typography>
                  )}
                </Box>
              </FormControl>

              <FormControl component="fieldset">
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  Change league active status
                </Typography>
                <RadioGroup row value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}>
                  <FormControlLabel
                    value="active"
                    disabled={!canManageLeagueSettings}
                    control={<Radio sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: '#27ab83' } }} />}
                    label="Active"
                  />
                  <FormControlLabel
                    value="inactive"
                    disabled={!canManageLeagueSettings}
                    control={<Radio sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: 'red' } }} />}
                    label="Inactive"
                  />
                </RadioGroup>
              </FormControl>

              <FormControl fullWidth>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  Maximum matches for {currentSeason ? currentSeason.name : 'this season'}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={seasonMaxGames}
                  onChange={(e) => setSeasonMaxGames(Number(e.target.value))}
                  disabled={!selectedSeasonId || !canManageLeagueSettings}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#E5E7EB',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                      '&.Mui-focused fieldset': { borderColor: '#0388E3' },
                    },
                    '& .MuiInputBase-input': { color: '#E5E7EB' },
                  }}
                  helperText={!selectedSeasonId ? 'Select a season first' : `This setting controls how many matches can be played in ${currentSeason?.name || 'this season'}`}
                  FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
                />
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={seasonShowPoints}
                    onChange={(e) => setSeasonShowPoints(e.target.checked)}
                    disabled={!selectedSeasonId || !canManageLeagueSettings}
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        color: '#9CA3AF',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        opacity: 1,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#27ab83',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#27ab83',
                        opacity: 1,
                      },
                    }}
                  />
                }
                label={
                  seasonShowPoints
                    ? `CF Advance xp Points Scoring for ${currentSeason ? currentSeason.name : 'this season'}`
                    : `Classic League Points Scoring for ${currentSeason ? currentSeason.name : 'this season'}`
                }
                sx={{
                  '& .MuiFormControlLabel-label': {
                    color: seasonShowPoints ? '#E5E7EB' : '#E5E7EB',
                    fontWeight: 600,
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            {/* Members management (right side) */}
            <Box sx={{ mt: { xs: 1, md: 2 }, pr: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                Manage members
              </Typography>
              <List sx={{ py: 0 }}>
                {sortedSeasonMembers.map((member: User, index: number) => {
                  const memberName = `${member.firstName} ${member.lastName}`.trim()
                  const isLeagueAdmin = isUserLeagueAdmin(member.id)
                  const isCurrentUser = member.id === currentUserId
                  const memberAvatarSrc =
                    typeof member.profilePicture === 'string' && member.profilePicture.trim().length > 0
                      ? member.profilePicture.trim()
                      : PlayerImg.src
                  return (
                    <Box key={member.id}>
                      <ListItem
                        sx={{
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 1.5, sm: 2 },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          bgcolor: isCurrentUser ? 'rgba(255,255,255,0.06)' : 'transparent',
                          borderLeft: isCurrentUser ? '3px solid #e56a16' : 'none',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={memberAvatarSrc}
                            imgProps={{
                              onError: (e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (img.src !== PlayerImg.src) img.src = PlayerImg.src;
                              },
                            }}
                            sx={{ bgcolor: '#374151' }}
                          >
                            {(member.firstName?.[0] || '?').toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography sx={{ fontWeight: 600, color: '#E5E7EB' }}>
                                {memberName || 'Unnamed'}
                              </Typography>
                              <Chip
                                label={isLeagueAdmin ? 'League Admin' : 'Member'}
                                size="small"
                                sx={{
                                  bgcolor: 'transparent',
                                  color: isLeagueAdmin ? '#e56a16' : '#9CA3AF',
                                  border: `1px solid ${isLeagueAdmin ? 'rgba(229,106,22,0.6)' : 'rgba(156,163,175,0.6)'}`,
                                  fontWeight: 600,
                                  fontSize: 11,
                                  height: 20,
                                  borderRadius: '9999px',
                                }}
                              />
                            </Box>
                          }
                        />

                        {/* Right-side remove button: visible to any league admin for any member except themself */}
                        {currentUserIsAdmin && member.id !== currentUserId && (
                          <Tooltip title={`Remove ${memberName}`} arrow>
                            <IconButton
                              onClick={() => handleAdminRemoveMember(member)}
                              sx={{
                                color: '#ff6b6b',
                                bgcolor: 'rgba(255, 107, 107, 0.12)',
                                '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.2)' },
                              }}
                            >
                              <Delete sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ListItem>
                      {index < (sortedSeasonMembers?.length || 0) - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)', mx: 2 }} />
                      )}
                    </Box>
                  )
                })}
                {sortedSeasonMembers.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#9CA3AF', px: 2, py: 1 }}>
                    No active members found in this selected season.
                  </Typography>
                )}
              </List>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            gap: 1,
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            justifyContent: { xs: 'stretch', md: 'stretch' },
            flexWrap: 'wrap',
          }}
        >
          {currentUserId && (
            <Button
              startIcon={<ExitToApp />}
              variant="outlined"
              color="warning"
              onClick={async () => {
                const isAdmin = !!(league && league.adminId === currentUserId)
                const otherMembers = ((league?.members || []) as User[]).filter(m => m.id !== currentUserId)
                const confirmMsg = isAdmin
                  ? (otherMembers.length > 0
                    ? 'You are the league admin. Leaving will transfer admin to another member. Continue?'
                    : 'You are the only member. Leaving will archive this league. Continue?')
                  : 'Are you sure you want to leave this league?'
                if (!window.confirm(confirmMsg)) return

                let preferredAdminId: string | undefined
                if (isAdmin && otherMembers.length > 0) {
                  // Determine who should become the new admin
                  let replacementId = adminId && adminId !== currentUserId ? adminId : ''
                  if (!replacementId && otherMembers.length > 0) {
                    replacementId = otherMembers[0].id
                  }
                  preferredAdminId = replacementId || undefined
                }

                // Trigger leave action — backend handles admin reassignment + notification
                if (typeof onLeaveLeague === 'function') {
                  try { await onLeaveLeague(preferredAdminId) } catch { }
                }
                try { onClose() } catch { }
              }}
              sx={{
                fontWeight: 600,
                bgcolor: "#fff",
                color: "#d32f2f",
                width: { xs: '100%', md: 'auto' },
                flex: { md: 1 },
                minHeight: { xs: 42, md: 'auto' },
                px: 3,
                py: 1,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                "&:hover": {
                  bgcolor: "#ffebee",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {/* onClick={handleLeaveLeague}
            sx={{
              fontWeight: 600,
              bgcolor: "#fff",
              color: "#d32f2f",
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                bgcolor: "#ffebee",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s ease",
            }} */}
              Leave League
            </Button>
          )}
          {!canManageLeagueSettings && currentUserInSelectedSeason && (
            <Button
              startIcon={<ExitToApp />}
              variant="contained"
              onClick={() => { void handleLeaveSelectedSeason() }}
              sx={{
                bgcolor: '#e56a16',
                color: '#fff',
                width: { xs: '100%', md: 'auto' },
                flex: { md: 1 },
                minHeight: { xs: 42, md: 'auto' },
                '&:hover': { bgcolor: '#c75712' },
              }}
            >
              Leave Season
            </Button>
          )}
          {canManageLeagueSettings && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={openArchiveSeasonConfirm}
                disabled={!currentSeason || seasonArchiveLoading}
                sx={{
                  width: { xs: '100%', md: 'auto' },
                  flex: { md: 1 },
                  minHeight: { xs: 42, md: 'auto' },
                }}
              >
                {seasonArchiveLoading ? 'Archiving Season...' : 'Delete Season'}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  if (leagueHasAnyMatches) {
                    if (!window.confirm('This League will be moved to Archived Leagues. You can restore it or permanently delete it later from Archived Leagues Section..')) return;
                    onArchive?.();
                    return;
                  }

                  onDelete?.();
                }}
                sx={{ width: { xs: '100%', md: 'auto' }, flex: { md: 1 }, minHeight: { xs: 42, md: 'auto' } }}
              >
                Delete League
              </Button>
            </>
          )}
          {/* <Button
            variant="outlined"
            onClick={openArchivedMatchesDialog}
            sx={{
              borderColor: 'rgba(3,136,227,0.6)',
              color: '#0388E3',
              width: { xs: '100%', md: 'auto' },
              minHeight: { xs: 42, md: 'auto' },
              '&:hover': { borderColor: '#0388E3', bgcolor: 'rgba(3,136,227,0.08)' }
            }}
          >
            Archived Matches
          </Button> */}
          {/* {leagueIsArchived ? (
            onUnarchive && (
              <Button
                variant="contained"
                onClick={() => {
                  if (!window.confirm('Restore this league from archive? It will become active again.')) return;
                  onUnarchive?.();
                }}
                sx={{
                  bgcolor: '#27ab83',
                  width: { xs: '100%', md: 'auto' },
                  minHeight: { xs: 42, md: 'auto' },
                  '&:hover': { bgcolor: '#1e8463' },
                }}
              >
                Unarchive League
              </Button>
            )
          ) : (
            onArchive && (
              <Button
                variant="outlined"
                onClick={() => {
                  if (!window.confirm('Are you sure you want to archive this league? It will be hidden from active views.')) return;
                  onArchive?.();
                }}
                sx={{
                  borderColor: 'rgba(211,47,47,0.6)',
                  color: '#d32f2f',
                  width: { xs: '100%', md: 'auto' },
                  minHeight: { xs: 42, md: 'auto' },
                  '&:hover': { borderColor: '#d32f2f', bgcolor: 'rgba(211,47,47,0.08)' },
                  bgcolor: 'transparent'
                }}
              >
                Archive League
              </Button>
            )
          )} */}
          {/* <Button
            variant="outlined"
            onClick={() => setArchivedSeasonsOpen(true)}
            sx={{
              borderColor: 'rgba(3,136,227,0.6)',
              color: '#0388E3',
              width: { xs: '100%', md: 'auto' },
              minHeight: { xs: 42, md: 'auto' },
              '&:hover': { borderColor: '#0388E3', bgcolor: 'rgba(3,136,227,0.08)' }
            }}
          >
            Archived Seasons ({archivedSeasons.length})
          </Button> */}
          {canManageLeagueSettings && (
            <Button
              onClick={handleUpdate}
              variant="contained"
              sx={{
                bgcolor: '#27ab83',
                width: { xs: '100%', md: 'auto' },
                flex: { md: 1 },
                minHeight: { xs: 42, md: 'auto' },
                '&:hover': { bgcolor: '#1e8463' },
              }}
            >
              Update League
            </Button>
          )}
        </Box>
      </DialogActions>

      <Dialog
        open={archiveSeasonConfirmOpen}
        onClose={closeArchiveSeasonConfirm}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15,15,15,0.96)',
            color: '#E5E7EB',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#E5E7EB' }}>
          Archive Selected Season
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#9CA3AF' }}>
            {`"${getSeasonLabel(currentSeason)}" season will be archived. Do you want to continue?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={closeArchiveSeasonConfirm}
            disabled={seasonArchiveLoading}
            sx={{ color: '#E5E7EB' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleArchiveSelectedSeason}
            disabled={seasonArchiveLoading}
          >
            {seasonArchiveLoading ? 'Archiving...' : 'Archive Season'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={archivedSeasonsOpen}
        onClose={() => setArchivedSeasonsOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15,15,15,0.96)',
            color: '#E5E7EB',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#E5E7EB', position: 'relative' }}>
          Archived Seasons
          <IconButton
            aria-label="close"
            onClick={() => setArchivedSeasonsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#9CA3AF', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', letterSpacing: 0.3 }}>
            League Name
          </Typography>
          <Typography sx={{ color: '#E5E7EB', fontWeight: 700, mb: 2 }}>
            {formatLeagueName(league?.name)}
          </Typography>

          {archivedSeasons.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              No archived seasons found for this league.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {archivedSeasons.map((season) => {
                const seasonLabel = getSeasonLabel(season)
                const hasCustomLeagueImage = typeof league?.image === 'string' && league.image.trim().length > 0
                const seasonDateRaw = season.startDate || season.createdAt || league?.createdAt || ''
                const seasonDate = seasonDateRaw ? new Date(seasonDateRaw) : null
                const seasonDateValid = !!(seasonDate && !Number.isNaN(seasonDate.getTime()))
                const seasonMatchesCount = getSeasonMatchCount(season.id)
                const actionLoading = archivedSeasonActionId === String(season.id)

                return (
                  <Box
                    key={season.id}
                    sx={{
                      px: { xs: 2, md: 3 },
                      py: { xs: 2.2, md: 2.6 },
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      position: 'relative',
                      minHeight: { xs: '128px', md: '150px' },
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: 14, right: 14, zIndex: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="Archived"
                        size="small"
                        variant="outlined"
                        sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.35)' }}
                      />
                      {currentUserIsAdmin && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={actionLoading}
                            onClick={() => { void handleRestoreArchivedSeason(season) }}
                            sx={{
                              bgcolor: '#27ab83',
                              '&:hover': { bgcolor: '#1e8463' },
                              fontSize: '11px',
                              px: 1.4,
                              py: 0.3,
                              minWidth: 'auto',
                              textTransform: 'none',
                            }}
                          >
                            Restore
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={actionLoading}
                            onClick={() => { void handlePermanentDeleteArchivedSeason(season) }}
                            sx={{
                              bgcolor: '#dc2626',
                              '&:hover': { bgcolor: '#b91c1c' },
                              fontSize: '11px',
                              px: 1.4,
                              py: 0.3,
                              minWidth: 'auto',
                              textTransform: 'none',
                            }}
                          >
                            {actionLoading ? 'Deleting...' : 'Permanent Delete'}
                          </Button>
                        </>
                      )}
                    </Box>

                    <Grid container spacing={{ xs: 1.5, md: 2 }} alignItems="center">
                      <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            width: { xs: 56, sm: 72, md: 82 },
                            height: { xs: 56, sm: 72, md: 82 },
                            borderRadius: '50%',
                            bgcolor: '#fff',
                            overflow: 'hidden',
                            position: 'relative',
                            flexShrink: 0,
                          }}>
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                p: hasCustomLeagueImage ? 0 : { xs: 0.8, md: 1 },
                                boxSizing: 'border-box',
                              }}
                            >
                              <Image
                                src={league?.image || trofy}
                                alt={`${league.name} icon`}
                                fill
                                sizes="(max-width: 600px) 56px, (max-width: 900px) 72px, 82px"
                                style={{ objectFit: hasCustomLeagueImage ? 'cover' : 'contain' }}
                              />
                            </Box>
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{
                              color: '#ffffff',
                              fontFamily: '"Anton", sans-serif !important',
                              fontSize: { xs: '26px', sm: '30px', md: '34px' },
                              textTransform: 'uppercase',
                              lineHeight: 1.2,
                              letterSpacing: '1px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {seasonLabel}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
                              <Image src={faceicon} alt="Players" width={18} height={18} style={{ flexShrink: 0 }} />
                              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"League Spartan", sans-serif', fontWeight: 300, fontSize: { xs: '12px', md: '16px' } }}>
                                Players {league.members?.length || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Image src={schedule} alt="Season Date" width={16} height={16} style={{ flexShrink: 0 }} />
                              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"League Spartan", sans-serif', fontWeight: 300, fontSize: { xs: '11px', md: '15px' } }}>
                                {seasonDateValid
                                  ? `Created At ${seasonDate!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                  : 'Date not available'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Image src={fotbal} alt="Matches" width={18} height={18} style={{ flexShrink: 0 }} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"League Spartan", sans-serif', fontWeight: 300, fontSize: { xs: '12px', md: '16px' } }}>
                              Matches: {seasonMatchesCount}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: '#ffffff', fontFamily: '"League Spartan", sans-serif', fontWeight: 600, fontSize: { xs: '20px', md: '22px' } }}>
                            Archived
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchivedSeasonsOpen(false)} sx={{ color: '#E5E7EB' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={archivedMatchesOpen}
        onClose={() => setArchivedMatchesOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15,15,15,0.96)',
            color: '#E5E7EB',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#E5E7EB' }}>
          Archived / Deleted Matches
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {archivedMatchesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : archivedMatches.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              No archived matches found.
            </Typography>
          ) : (
            <List sx={{ py: 0 }}>
              {archivedMatches.map((m, idx) => {
                const loadingThis = archivedMatchActionId === m.id;
                return (
                  <Box key={m.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1.5,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: '#E5E7EB', fontWeight: 600 }}>
                          {(m.homeTeamName || 'Home')} vs {(m.awayTeamName || 'Away')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                          {m.date ? new Date(m.date).toLocaleDateString() : 'No date'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={loadingThis}
                          onClick={() => handleRestoreArchivedMatch(m.id)}
                          sx={{ bgcolor: '#27ab83', width: { xs: '100%', sm: 'auto' }, '&:hover': { bgcolor: '#1e8463' } }}
                        >
                          Restore
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          disabled={loadingThis}
                          onClick={() => handlePermanentDeleteArchivedMatch(m.id)}
                          sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                          Delete Forever
                        </Button>
                      </Box>
                    </ListItem>
                    {idx < archivedMatches.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
                  </Box>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchivedMatchesOpen(false)} sx={{ color: '#E5E7EB' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
function AllLeagues() {
  const theme = useTheme();
  const isMobileCreateDialog = useMediaQuery(theme.breakpoints.down('sm'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [leagues, setLeagues] = useState<LeagueWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [leagueName, setLeagueName] = useState('');
  const [leagueNameError, setLeagueNameError] = useState<string>('');
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { token, user } = useAuth();
  const [openMembers, setOpenMembers] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  // Standalone admin settings dialog control
  const [openAdminSettings, setOpenAdminSettings] = useState(false);
  const [adminSettingsLeague, setAdminSettingsLeague] = useState<League | null>(null);
  const [, setLoadingMembers] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [leagueImage, setLeagueImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [maxGames, setMaxGames] = useState<string>('20');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [completionTab, setCompletionTab] = useState<'completed' | 'live'>('live');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showArchivedSeasons, setShowArchivedSeasons] = useState(false);
  const [archivedLeagueActionId, setArchivedLeagueActionId] = useState<string | null>(null);
  const [archivedSeasonActionId, setArchivedSeasonActionId] = useState<string | null>(null);
  const [creatingSeasonLeagueId, setCreatingSeasonLeagueId] = useState<string | null>(null);
  const [leagueLiveUpdatingId, setLeagueLiveUpdatingId] = useState<string | null>(null);
  const [seasonConfirmOpen, setSeasonConfirmOpen] = useState(false);
  const [pendingSeasonLeague, setPendingSeasonLeague] = useState<LeagueWithStatus | null>(null);
  const [locallyDeletedLeagueIds, setLocallyDeletedLeagueIds] = useState<string[]>([]);
  // Persist preferred league selection across app
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  const dispatchLeagueMutationEvent = useCallback(
    (eventName: 'league-created' | 'league-updated' | 'league-deleted', detail: Record<string, unknown>) => {
      if (typeof window === 'undefined') return;
      try {
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() },
          })
        );
      } catch {
        // ignore event dispatch issues
      }
    },
    []
  );

  const handleSeasonArchivedInState = useCallback(({ leagueId, seasonId }: { leagueId: string; seasonId: string }) => {
    const applySeasonArchive = <T extends { id: string | number }>(
      leagueItem: (T & { seasons?: Season[] }) | null
    ): (T & { seasons?: Season[] }) | null => {
      if (!leagueItem || String(leagueItem.id) !== String(leagueId)) return leagueItem;

      const seasons = leagueItem.seasons;
      if (!Array.isArray(seasons)) return leagueItem;

      const updatedSeasons = seasons.map((season) =>
        String(season.id) === String(seasonId)
          ? { ...season, archived: true, isActive: false }
          : season
      );

      const hasActiveNonArchived = updatedSeasons.some((season) => !Boolean(season.archived) && season.isActive);
      if (!hasActiveNonArchived) {
        const nextIndex = updatedSeasons.findIndex((season) => !Boolean(season.archived));
        if (nextIndex >= 0) {
          updatedSeasons[nextIndex] = { ...updatedSeasons[nextIndex], isActive: true };
        }
      }

      return { ...leagueItem, seasons: updatedSeasons };
    };

    setLeagues((prev) =>
      prev.map((leagueItem) => {
        const updated = applySeasonArchive(leagueItem as LeagueWithStatus & { seasons?: Season[] });
        return (updated ?? leagueItem) as LeagueWithStatus;
      })
    );

    setSelectedLeague((prev) => {
      const updated = applySeasonArchive(prev as (League & { seasons?: Season[] }) | null);
      return (updated as League | null) ?? prev;
    });

    setAdminSettingsLeague((prev) => {
      const updated = applySeasonArchive(prev as (League & { seasons?: Season[] }) | null);
      return (updated as League | null) ?? prev;
    });
  }, []);

  const isLeagueAdminForCurrentUser = useCallback((league: LeagueWithStatus | League): boolean => {
    const uid = String(user?.id || '');
    if (!uid || !league) return false;
    if (league.adminId && String(league.adminId) === uid) return true;
    if (Array.isArray(league.administrators)) {
      return league.administrators.some((admin) => String(admin?.id || '') === uid);
    }
    return false;
  }, [user?.id]);

  useEffect(() => {
    if (selectedLeague) {
      const refreshedSelected = leagues.find((leagueItem) => String(leagueItem.id) === String(selectedLeague.id));
      if (refreshedSelected) {
        const selectedSeasonCount = Array.isArray((selectedLeague as League & { seasons?: Season[] }).seasons)
          ? ((selectedLeague as League & { seasons?: Season[] }).seasons as Season[]).length
          : 0;
        const refreshedSeasonCount = Array.isArray((refreshedSelected as LeagueWithStatus & { seasons?: Season[] }).seasons)
          ? (((refreshedSelected as LeagueWithStatus & { seasons?: Season[] }).seasons as Season[]).length)
          : 0;
        const needsSelectedSync =
          String(selectedLeague.updatedAt || '') !== String(refreshedSelected.updatedAt || '') ||
          (selectedLeague.members?.length || 0) !== (refreshedSelected.members?.length || 0) ||
          (selectedLeague.administrators?.length || 0) !== (refreshedSelected.administrators?.length || 0) ||
          (selectedLeague.matches?.length || 0) !== (refreshedSelected.matches?.length || 0) ||
          selectedSeasonCount !== refreshedSeasonCount;

        if (needsSelectedSync) {
          setSelectedLeague((prev) => {
            if (!prev || String(prev.id) !== String(refreshedSelected.id)) return prev;
            return { ...prev, ...refreshedSelected };
          });
        }
      }
    }

    if (adminSettingsLeague) {
      const refreshedAdminLeague = leagues.find((leagueItem) => String(leagueItem.id) === String(adminSettingsLeague.id));
      if (refreshedAdminLeague) {
        const adminSeasonCount = Array.isArray((adminSettingsLeague as League & { seasons?: Season[] }).seasons)
          ? ((adminSettingsLeague as League & { seasons?: Season[] }).seasons as Season[]).length
          : 0;
        const refreshedAdminSeasonCount = Array.isArray((refreshedAdminLeague as LeagueWithStatus & { seasons?: Season[] }).seasons)
          ? (((refreshedAdminLeague as LeagueWithStatus & { seasons?: Season[] }).seasons as Season[]).length)
          : 0;
        const needsAdminSync =
          String(adminSettingsLeague.updatedAt || '') !== String(refreshedAdminLeague.updatedAt || '') ||
          (adminSettingsLeague.members?.length || 0) !== (refreshedAdminLeague.members?.length || 0) ||
          (adminSettingsLeague.administrators?.length || 0) !== (refreshedAdminLeague.administrators?.length || 0) ||
          (adminSettingsLeague.matches?.length || 0) !== (refreshedAdminLeague.matches?.length || 0) ||
          adminSeasonCount !== refreshedAdminSeasonCount;

        if (needsAdminSync) {
          setAdminSettingsLeague((prev) => {
            if (!prev || String(prev.id) !== String(refreshedAdminLeague.id)) return prev;
            return { ...prev, ...refreshedAdminLeague };
          });
        }
      }
    }
  }, [adminSettingsLeague, leagues, selectedLeague]);

  // Dynamic years: keep previous years that exist in leagues, and always keep current/latest year on top.
  const yearOptions = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    leagues.forEach((league) => {
      const t = Date.parse(league.createdAt || '');
      if (!Number.isFinite(t)) return;
      years.add(new Date(t).getFullYear());
    });
    return Array.from(years)
      .sort((a, b) => b - a)
      .map(String);
  }, [leagues]);

  const completedStatusTokens = useMemo(
    () => new Set([
      'completed',
      'complete',
      'finished',
      'ended',
      'result_published',
      'result_uploaded',
      'result_complete',
      'result_finished',
      'result_ended',
      'result_done',
      'closed',
    ]),
    []
  );

  const isLeagueCompleted = useCallback((l: LeagueWithStatus): boolean => {
    const withFlags = l as LeagueWithStatus & {
      isComplete?: boolean;
      isCompleted?: boolean;
      archived?: boolean;
      seasons?: Array<{
        isActive?: boolean;
        archived?: boolean;
        status?: unknown;
      }>;
    };

    // Explicit backend status values
    const status = String(l.status || '').toLowerCase().trim();
    if (completedStatusTokens.has(status)) return true;

    // Explicit backend completion flags
    if (
      l.computedStatus?.isComplete === true ||
      l.computedStatus?.isCompleted === true ||
      l.computedStatus?.locked === true ||
      withFlags.isComplete === true ||
      withFlags.isCompleted === true ||
      l.isLocked === true
    ) {
      return true;
    }

    // Season-level fallback: if there is no active season and at least one season is archived/completed,
    // keep the league in completed tab after refresh.
    const seasons = Array.isArray(withFlags.seasons) ? withFlags.seasons : [];
    if (seasons.length > 0) {
      const seasonDoneTokens = new Set([
        'completed',
        'complete',
        'finished',
        'ended',
        'locked',
        'archived',
        'result_published',
        'result_uploaded',
        'result_complete',
        'result_finished',
        'result_ended',
        'result_done',
      ]);
      const hasActiveSeason = seasons.some((s) => s?.isActive === true && s?.archived !== true);
      const hasArchivedOrCompletedSeason = seasons.some((s) => {
        if (!s) return false;
        if (s.archived === true) return true;
        const st = typeof s.status === 'string' ? s.status.toLowerCase().trim() : '';
        return seasonDoneTokens.has(st);
      });
      if (!hasActiveSeason && hasArchivedOrCompletedSeason) return true;
    }

    return false;
  }, [completedStatusTokens]);

  const isLeagueLive = useCallback((l: LeagueWithStatus): boolean => {
    if (isLeagueCompleted(l)) return false;
    if (Boolean((l as LeagueWithStatus & { archived?: boolean }).archived)) return false;
    return true;
  }, [isLeagueCompleted]);

  const isArchivedLeague = useCallback((l: LeagueWithStatus): boolean => {
    if (isLeagueCompleted(l)) return false;
    return Boolean((l as LeagueWithStatus & { archived?: boolean }).archived);
  }, [isLeagueCompleted]);

  const handleToggleLeagueLiveStatus = useCallback(async (league: LeagueWithStatus, nextLive: boolean) => {
    if (!token) {
      toast.error('Please login again and try.');
      return;
    }

    if (!isLeagueAdminForCurrentUser(league)) {
      toast.error('Only league admin can change league live/completed status.');
      return;
    }

    const leagueId = String(league.id);
    if (leagueLiveUpdatingId === leagueId) return;
    setLeagueLiveUpdatingId(leagueId);

    // Save previous state for revert if needed
    const prevLeagues = [...leagues];
    const prevSelectedLeague = selectedLeague;
    const prevAdminSettingsLeague = adminSettingsLeague;

    // Optimistically update the UI first (triggers animation)
    const now = new Date().toISOString();
    const applyOptimisticUpdate = (prev: LeagueWithStatus[]) =>
      prev.map((item) => (String(item.id) === leagueId
        ? {
          ...item,
          active: nextLive,
          archived: false,
          status: (nextLive ? 'active' : 'completed') as League['status'],
          isLocked: !nextLive,
          isComplete: !nextLive, // Clear root-level flag
          isCompleted: !nextLive, // Clear root-level flag
          computedStatus: {
            ...(item.computedStatus || {}),
            locked: !nextLive,
            isComplete: !nextLive,
            isCompleted: !nextLive,
          },
          updatedAt: now,
        }
        : item));

    setLeagues(applyOptimisticUpdate);
    setSelectedLeague((prev) => (prev && String(prev.id) === leagueId
      ? {
        ...prev,
        active: nextLive,
        status: (nextLive ? 'active' : 'completed') as League['status'],
        updatedAt: now,
      }
      : prev));
    setAdminSettingsLeague((prev) => (prev && String(prev.id) === leagueId
      ? {
        ...prev,
        active: nextLive,
        status: (nextLive ? 'active' : 'completed') as League['status'],
        updatedAt: now,
      }
      : prev));

    try {
      // Add delay to allow the switch animation to complete properly
      await new Promise(resolve => setTimeout(resolve, 500));

      type StatusAttempt = { url: string; payload: Record<string, unknown>; method?: 'PATCH' | 'POST' };
      const livePayload = { active: true, archived: false, status: 'active', isComplete: false, isCompleted: false, locked: false, isLocked: false };
      const completedPayload = { active: false, archived: false, status: 'completed', isComplete: true, isCompleted: true, locked: true, isLocked: true };
      const readLeagueLikeFromResponse = (payload: Record<string, unknown>): Record<string, unknown> | null => {
        const asRecord = (v: unknown): Record<string, unknown> | null => (isRecord(v) ? (v as Record<string, unknown>) : null);
        const direct = asRecord(payload.league);
        if (direct) return direct;
        const dataObj = asRecord(payload.data);
        if (dataObj) {
          const nestedLeague = asRecord(dataObj.league);
          if (nestedLeague) return nestedLeague;
          return dataObj;
        }
        return null;
      };
      const responseLooksPersisted = (payload: Record<string, unknown>): boolean => {
        const leagueLike = readLeagueLikeFromResponse(payload);
        if (!leagueLike) return true; // no inspectable body, allow fallback rules by HTTP code

        const statusRaw = typeof leagueLike.status === 'string' ? leagueLike.status.toLowerCase().trim() : '';
        const computedRaw = isRecord(leagueLike.computedStatus) ? (leagueLike.computedStatus as Record<string, unknown>) : null;
        const activeRaw = typeof leagueLike.active === 'boolean' ? leagueLike.active : undefined;
        const isComplete = leagueLike.isComplete === true || leagueLike.isCompleted === true;
        const isLocked = leagueLike.isLocked === true || leagueLike.locked === true;
        const computedComplete = computedRaw?.isComplete === true || computedRaw?.isCompleted === true || computedRaw?.locked === true;

        if (nextLive) {
          if (statusRaw === 'active') return true;
          if (activeRaw === true && !isComplete && !isLocked && !computedComplete) return true;
          return false;
        }

        if (statusRaw === 'completed') return true;
        if (isComplete || isLocked || computedComplete) return true;
        return false;
      };
      const attempts: StatusAttempt[] = nextLive
        ? [
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/live`, payload: livePayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/live`, payload: livePayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/unlock`, payload: livePayload, method: 'POST' },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/unlock`, payload: livePayload, method: 'POST' },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, payload: livePayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}`, payload: livePayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/status`, payload: livePayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/status`, payload: livePayload },
        ]
        : [
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/complete`, payload: completedPayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/complete`, payload: completedPayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/lock`, payload: completedPayload, method: 'POST' },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/lock`, payload: completedPayload, method: 'POST' },
          // Completed should persist lock/completion fields, so prefer direct league update first.
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, payload: completedPayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}`, payload: completedPayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/status`, payload: completedPayload },
          { url: `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/status`, payload: completedPayload },
        ];

      let success = false;

      for (let i = 0; i < attempts.length; i += 1) {
        const res = await fetch(attempts[i].url, {
          method: attempts[i].method || 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attempts[i].payload),
        });
        const payloadUnknown: unknown = await res.json().catch(() => ({}));
        const payload = isRecord(payloadUnknown) ? (payloadUnknown as { success?: boolean }) : {};

        if (res.ok && payload.success !== false && responseLooksPersisted(payload as Record<string, unknown>)) {
          success = true;
          break;
        }

        if (res.ok) {
          continue;
        }

        const shouldTryFallback = res.status === 404 || res.status === 405;
        if (!shouldTryFallback) break;
      }

      if (!success) throw new Error('Failed to update league status');

      toast.success(nextLive ? 'League marked as live' : 'League marked as completed');
    } catch (e: unknown) {
      // Revert to previous state on failure
      setLeagues(prevLeagues);
      setSelectedLeague(prevSelectedLeague);
      setAdminSettingsLeague(prevAdminSettingsLeague);

      const msg = e instanceof Error ? e.message : 'Failed to update league status';
      toast.error(msg);
    } finally {
      setLeagueLiveUpdatingId(null);
    }
  }, [token, isLeagueAdminForCurrentUser, leagueLiveUpdatingId]);

  // Apply filters: by completion, by year (createdAt) and by league name
  // Archived leagues are always excluded from main list
  const filteredLeagues = useMemo(() => {
    const nonArchived = leagues.filter((l) => !isArchivedLeague(l));
    const byCompletion = nonArchived.filter(l => {
      // Keep league in current view while it's updating to allow animation to show
      if (leagueLiveUpdatingId === String(l.id)) return true;
      return completionTab === 'completed' ? isLeagueCompleted(l) : isLeagueLive(l);
    });
    const byYear = selectedYear === 'all'
      ? byCompletion
      : byCompletion.filter(l => {
        const t = Date.parse(l.createdAt || '');
        if (!Number.isFinite(t)) return false;
        const y = new Date(t).getFullYear();
        return String(y) === selectedYear;
      });

    const term = searchTerm.trim().toLowerCase();
    if (!term) return byYear;
    return byYear.filter(l => (l.name || '').toLowerCase().includes(term));
  }, [leagues, selectedYear, searchTerm, completionTab, isLeagueCompleted, isLeagueLive, isArchivedLeague, leagueLiveUpdatingId]);

  // Show all filtered leagues, or only user-selected league
  const leaguesToDisplay = useMemo(() => {
    if (selectedLeagueId === 'all') return filteredLeagues;
    return filteredLeagues.filter(l => String(l.id) === selectedLeagueId);
  }, [filteredLeagues, selectedLeagueId]);

  useEffect(() => {
    if (selectedLeagueId === 'all') return;
    const stillExists = filteredLeagues.some(l => String(l.id) === selectedLeagueId);
    if (!stillExists) setSelectedLeagueId('all');
  }, [filteredLeagues, selectedLeagueId]);

  useEffect(() => {
    if (selectedYear === 'all') return;
    if (!yearOptions.includes(selectedYear)) setSelectedYear('all');
  }, [selectedYear, yearOptions]);

  // Archived leagues — always separate from the main list
  const archivedLeagues = useMemo(() => {
    return leagues.filter((l) => isArchivedLeague(l));
  }, [leagues, isArchivedLeague]);

  const archivedSeasons = useMemo(() => {
    const items: Array<{ league: LeagueWithStatus; season: Season }> = [];

    leagues.forEach((league) => {
      const leagueSeasons = (league as LeagueWithStatus & { seasons?: Season[] }).seasons;
      if (!Array.isArray(leagueSeasons)) return;

      leagueSeasons.forEach((season) => {
        if (Boolean((season as Season & { deleted?: boolean }).deleted)) return;
        const statusUnknown = (season as unknown as { status?: unknown }).status;
        const seasonStatus = typeof statusUnknown === 'string' ? statusUnknown.toLowerCase() : '';
        if (season.archived === true || seasonStatus === 'archived') {
          items.push({ league, season });
        }
      });
    });

    return items;
  }, [leagues]);

  const groupedArchivedSeasons = useMemo(() => {
    const grouped = new Map<string, { league: LeagueWithStatus; seasons: Season[] }>();

    archivedSeasons.forEach(({ league, season }) => {
      const key = String(league.id);
      const existing = grouped.get(key);
      if (existing) {
        existing.seasons.push(season);
      } else {
        grouped.set(key, { league, seasons: [season] });
      }
    });

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        seasons: [...group.seasons].sort((a, b) => (b.seasonNumber || 0) - (a.seasonNumber || 0)),
      }))
      .sort((a, b) => formatLeagueName(a.league.name).localeCompare(formatLeagueName(b.league.name)));
  }, [archivedSeasons]);

  const hasArchivedSections = archivedLeagues.length > 0 || archivedSeasons.length > 0;

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsJoining(true);
    try {
      const payload: unknown = await dispatch(joinLeague(inviteCode.trim().toUpperCase())).unwrap();
      const joined = normalizeLeagueFromPayload(payload);

      if (joined) {
        // Save joined league as preferred immediately
        try { if (typeof window !== 'undefined') localStorage.setItem(PREFERRED_LEAGUE_KEY, String(joined.id)); } catch { }
        // Update local state with new league at the TOP
        setLeagues(prev => {
          const filtered = prev.filter(l => String(l.id) !== String(joined.id));
          const enriched: LeagueWithStatus = { ...joined };
          return sortLeaguesByRecency([enriched, ...filtered]);
        });
        setLocallyDeletedLeagueIds(prev => prev.filter((id) => id !== String(joined.id)));
        dispatchLeagueMutationEvent('league-created', { leagueId: String(joined.id), reason: 'joined-league' });
        dispatchLeagueMutationEvent('league-updated', { leagueId: String(joined.id), reason: 'joined-league' });
        console.log('Joined league successfully:', joined.name);
      } else {
        console.log('Join succeeded but payload missing league');
      }

      toast.success('Successfully joined the league!');
      setInviteCode('');
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to join league';
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!validateLeagueImageFile(file)) {
        try { event.target.value = ''; } catch { }
        return;
      }

      setLeagueImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLeagueImage(null);
    setImagePreview(null);
    try {
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch { }
  };


  const fetchAllLeagues = useCallback(async () => {
    if (!token) return;

    try {
      console.log('Fetching all available leagues...');
      setLoading(true);

      // First get the user's leagues from auth/status
      const ts = Date.now();
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status?refresh=1&bust=${ts}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store',
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.success && authData.user) {
          // Merge leagues from all known user keys + fallback list endpoint.
          // This keeps completed/inactive leagues from disappearing after refresh when backend keying differs.
          const authLeagueSources: unknown[] = [
            ...(Array.isArray(authData.user.leagues) ? authData.user.leagues : []),
            ...(Array.isArray(authData.user.adminLeagues) ? authData.user.adminLeagues : []),
            ...(Array.isArray(authData.user.administeredLeagues) ? authData.user.administeredLeagues : []),
            ...(Array.isArray(authData.user.managedLeagues) ? authData.user.managedLeagues : []),
          ];

          let fallbackLeagueSources: unknown[] = [];
          try {
            const leaguesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues?refresh=1&bust=${Date.now()}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-store',
            });
            if (leaguesResponse.ok) {
              const leaguesPayloadUnknown: unknown = await leaguesResponse.json().catch(() => ({}));
              const leaguesPayload = isRecord(leaguesPayloadUnknown)
                ? leaguesPayloadUnknown as { success?: boolean; leagues?: unknown[] }
                : {};
              if (leaguesPayload.success !== false && Array.isArray(leaguesPayload.leagues)) {
                fallbackLeagueSources = leaguesPayload.leagues;
              }
            }
          } catch (err) {
            console.warn('[Leagues] Fallback /leagues fetch failed:', err);
          }

          const mergedLeagues: League[] = [...authLeagueSources, ...fallbackLeagueSources]
            .map((leaguePayload) => normalizeLeagueFromPayload(leaguePayload))
            .filter((league): league is League => Boolean(league && league.id));

          // Remove duplicates
          const uniqueLeagues: League[] = Array.from(
            new Map(mergedLeagues.map((league) => [String(league.id), league])).values()
          );

          type LeagueCompletionSnapshot = {
            active?: boolean;
            archived?: boolean;
            status?: League['status'];
            isComplete?: boolean;
            isCompleted?: boolean;
            isLocked?: boolean;
            computedStatus?: LeagueStatus;
          };

          const applyCompletionSnapshot = (
            source: LeagueWithStatus,
            snapshot?: LeagueCompletionSnapshot
          ): LeagueWithStatus => {
            if (!snapshot) return source;
            const next = {
              ...source,
            } as LeagueWithStatus & {
              archived?: boolean;
              isComplete?: boolean;
              isCompleted?: boolean;
            };
            if (typeof snapshot.active === 'boolean') next.active = snapshot.active;
            if (typeof snapshot.archived === 'boolean') next.archived = snapshot.archived;
            if (snapshot.status) next.status = snapshot.status;
            if (typeof snapshot.isLocked === 'boolean') next.isLocked = snapshot.isLocked;
            if (typeof snapshot.isComplete === 'boolean') next.isComplete = snapshot.isComplete;
            if (typeof snapshot.isCompleted === 'boolean') next.isCompleted = snapshot.isCompleted;
            if (snapshot.computedStatus) {
              next.computedStatus = {
                ...(next.computedStatus || {}),
                ...snapshot.computedStatus,
              };
            }
            return next;
          };

          const completionSnapshotByLeagueId = new Map<string, LeagueCompletionSnapshot>();
          try {
            const statusEndpoints = [
              `${process.env.NEXT_PUBLIC_API_URL}/leagues/user-leagues?refresh=1&bust=${Date.now()}`,
              `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/user-leagues?refresh=1&bust=${Date.now()}`,
            ];

            for (let i = 0; i < statusEndpoints.length; i += 1) {
              const statusResponse = await fetch(statusEndpoints[i], {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
              });

              if (!statusResponse.ok) {
                const shouldTryFallback = i === 0 && (statusResponse.status === 404 || statusResponse.status === 405);
                if (shouldTryFallback) continue;
                break;
              }

              const statusPayloadUnknown: unknown = await statusResponse.json().catch(() => ({}));
              const statusPayload = isRecord(statusPayloadUnknown)
                ? (statusPayloadUnknown as { success?: boolean; leagues?: unknown[] })
                : {};
              const statusLeagues = Array.isArray(statusPayload.leagues) ? statusPayload.leagues : [];

              if (statusPayload.success === false || statusLeagues.length === 0) break;

              statusLeagues.forEach((rawLeague) => {
                if (!isRecord(rawLeague)) return;
                const idValue = rawLeague.id;
                if (!(typeof idValue === 'string' || typeof idValue === 'number')) return;
                const id = String(idValue);
                const computedStatus = normalizeLeagueComputedStatus(rawLeague.computedStatus);
                const snapshot: LeagueCompletionSnapshot = {
                  active: typeof rawLeague.active === 'boolean' ? rawLeague.active : undefined,
                  archived: typeof rawLeague.archived === 'boolean' ? rawLeague.archived : undefined,
                  status: normalizeLeagueStatus(rawLeague.status),
                  isComplete:
                    rawLeague.isComplete === true
                    || computedStatus?.isComplete === true
                    || computedStatus?.isCompleted === true
                    || undefined,
                  isCompleted:
                    rawLeague.isCompleted === true
                    || rawLeague.isComplete === true
                    || computedStatus?.isCompleted === true
                    || computedStatus?.isComplete === true
                    || undefined,
                  isLocked:
                    rawLeague.isLocked === true
                    || rawLeague.locked === true
                    || computedStatus?.locked === true
                    || undefined,
                  computedStatus,
                };

                completionSnapshotByLeagueId.set(id, snapshot);
              });

              break;
            }
          } catch (statusError) {
            console.warn('[Leagues] Failed to load user-leagues completion snapshot:', statusError);
          }

          // Now fetch detailed information for each league
          const detailedLeagues: Array<LeagueWithStatus | null> = await Promise.all(
            uniqueLeagues.map(async (league: League): Promise<LeagueWithStatus | null> => {
              const snapshot = completionSnapshotByLeagueId.get(String(league.id));
              try {
                const bust = Date.now();
                // NOTE: Removed 'Cache-Control' and 'Pragma' custom request headers to avoid CORS preflight rejection
                // Server must explicitly allow any non-simple headers in Access-Control-Allow-Headers; removing fixes the error you saw.
                const leagueResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}?bust=${bust}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                let enriched: LeagueWithStatus = applyCompletionSnapshot({ ...league }, snapshot);

                // If access is forbidden now, drop this league from the list
                if (leagueResponse.status === 403) {
                  console.debug('[Leagues] Skipping league due to 403 (no access):', league.id);
                  return null;
                }

                if (leagueResponse.ok) {
                  const leagueData = await leagueResponse.json();
                  if (leagueData.success) {
                    enriched = {
                      ...enriched,
                      ...leagueData.league,
                      members: leagueData.league.members || [],
                      matches: leagueData.league.matches || [],
                      administrators: leagueData.league.administrators || [],
                    };
                    enriched = applyCompletionSnapshot(enriched, snapshot);
                  }
                }

                return enriched;
              } catch (error) {
                console.warn(`Failed to fetch details/status for league ${league.id}:`, error);
                return applyCompletionSnapshot({ ...league } as LeagueWithStatus, snapshot);
              }
            })
          );

          const sortedLeagues = sortLeaguesByRecency(detailedLeagues.filter(Boolean) as LeagueWithStatus[]);
          if (locallyDeletedLeagueIds.length > 0) {
            const deletedIds = new Set(locallyDeletedLeagueIds.map((id) => String(id)));
            setLeagues(sortedLeagues.filter((leagueItem) => !deletedIds.has(String(leagueItem.id))));
          } else {
            setLeagues(sortedLeagues);
          }
          console.log('Setting detailed leagues:', detailedLeagues);
          console.log('Leagues archived status:', detailedLeagues.map((l) => {
            const leagueWithArchived = l as (LeagueWithStatus & { archived?: boolean }) | null;
            return { name: l?.name, archived: leagueWithArchived?.archived, active: l?.active };
          }));
        }
      } else {
        console.error('Failed to fetch leagues');
        toast.error('Failed to fetch leagues');
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      toast.error('An error occurred while fetching leagues');
    } finally {
      setLoading(false);
    }
  }, [token, locallyDeletedLeagueIds]);

  useEffect(() => {
    if (token) {
      fetchAllLeagues();
    }
  }, [token, fetchAllLeagues]);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void fetchAllLeagues();
      }, 150);
    };

    window.addEventListener('league-created', scheduleRefresh as EventListener);
    window.addEventListener('league-updated', scheduleRefresh as EventListener);
    window.addEventListener('league-deleted', scheduleRefresh as EventListener);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener('league-created', scheduleRefresh as EventListener);
      window.removeEventListener('league-updated', scheduleRefresh as EventListener);
      window.removeEventListener('league-deleted', scheduleRefresh as EventListener);
    };
  }, [token, fetchAllLeagues]);

  const handlePermanentDeleteArchivedLeague = useCallback(async (league: LeagueWithStatus) => {
    if (!token) return;
    if (!window.confirm(`Permanently delete "${league.name}"? This cannot be undone.`)) return;

    const leagueId = String(league.id);
    setArchivedLeagueActionId(leagueId);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete league');

      toast.success('League permanently deleted');
      setLeagues(prev => prev.filter(l => String(l.id) !== leagueId));
      setLocallyDeletedLeagueIds((prev) => (prev.includes(leagueId) ? prev : [...prev, leagueId]));
      dispatchLeagueMutationEvent('league-deleted', { leagueId, reason: 'permanent-delete-archived' });

      if (selectedLeague && String(selectedLeague.id) === leagueId) {
        setSelectedLeague(null);
        setOpenMembers(false);
      }
      if (adminSettingsLeague && String(adminSettingsLeague.id) === leagueId) {
        setAdminSettingsLeague(null);
        setOpenAdminSettings(false);
      }

      void fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete league';
      toast.error(msg);
    } finally {
      setArchivedLeagueActionId(null);
    }
  }, [token, selectedLeague, adminSettingsLeague, fetchAllLeagues, dispatchLeagueMutationEvent]);

  const handleRestoreArchivedSeasonGlobal = useCallback(async (league: LeagueWithStatus, season: Season) => {
    if (!token) return;
    if (!isLeagueAdminForCurrentUser(league)) {
      toast.error('Only league admin can restore this season.');
      return;
    }

    const leagueId = String(league.id);
    const seasonId = String(season.id);
    setArchivedSeasonActionId(`${leagueId}:${seasonId}`);

    try {
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/seasons/${seasonId}/restore`,
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/seasons/${seasonId}/restore`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/seasons/${seasonId}/restore`,
      ];

      let success = false;
      let errorMessage = 'Failed to restore season';

      for (let i = 0; i < endpoints.length; i += 1) {
        const response = await fetch(endpoints[i], {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const payloadUnknown: unknown = await response.json().catch(() => ({}));
        const payload = (typeof payloadUnknown === 'object' && payloadUnknown !== null)
          ? (payloadUnknown as { success?: boolean; message?: string })
          : {};

        if (response.ok && payload.success !== false) {
          success = true;
          break;
        }

        if (payload.message) errorMessage = payload.message;
      }

      if (!success) throw new Error(errorMessage);

      toast.success('Season restored');
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to restore season';
      toast.error(msg);
    } finally {
      setArchivedSeasonActionId(null);
    }
  }, [fetchAllLeagues, isLeagueAdminForCurrentUser, token]);

  const handlePermanentDeleteArchivedSeasonGlobal = useCallback(async (league: LeagueWithStatus, season: Season) => {
    if (!token) return;
    if (!isLeagueAdminForCurrentUser(league)) {
      toast.error('Only league admin can permanently delete this season.');
      return;
    }

    const leagueId = String(league.id);
    const seasonId = String(season.id);
    const seasonLabel = season.name?.trim() || `Season ${season.seasonNumber || ''}`.trim() || 'this season';
    if (!window.confirm(`Permanently delete "${seasonLabel}"? Data will stay safe for awards/XP history.`)) return;

    setArchivedSeasonActionId(`${leagueId}:${seasonId}`);
    try {
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/seasons/${seasonId}`,
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/seasons/${seasonId}`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/seasons/${seasonId}`,
      ];

      let success = false;
      let errorMessage = 'Failed to permanently delete season';

      for (let i = 0; i < endpoints.length; i += 1) {
        const response = await fetch(endpoints[i], {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const payloadUnknown: unknown = await response.json().catch(() => ({}));
        const payload = (typeof payloadUnknown === 'object' && payloadUnknown !== null)
          ? (payloadUnknown as { success?: boolean; message?: string })
          : {};

        if (response.ok && payload.success !== false) {
          success = true;
          break;
        }

        if (payload.message) errorMessage = payload.message;
      }

      if (!success) throw new Error(errorMessage);

      toast.success('Season permanently deleted');
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to permanently delete season';
      toast.error(msg);
    } finally {
      setArchivedSeasonActionId(null);
    }
  }, [fetchAllLeagues, isLeagueAdminForCurrentUser, token]);

  const handleCreateSeasonForLeague = useCallback(async (league: LeagueWithStatus) => {
    const leagueId = String(league.id);
    if (!token) {
      toast.error('Please login again and try.');
      return;
    }
    if (!isLeagueAdminForCurrentUser(league)) {
      toast.error('Only league admin can create a new season.');
      return;
    }
    if (creatingSeasonLeagueId === leagueId) return;

    setCreatingSeasonLeagueId(leagueId);
    try {
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/seasons`,
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/seasons`,
      ];

      let success = false;
      let errorMessage = 'Failed to create new season';
      let successMessage = '';
      let responsePayload: Record<string, unknown> | null = null;

      for (let i = 0; i < endpoints.length; i += 1) {
        const response = await fetch(endpoints[i], {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ copyPlayers: true }),
        });

        const payloadUnknown: unknown = await response.json().catch(() => ({}));
        const payload = (typeof payloadUnknown === 'object' && payloadUnknown !== null)
          ? (payloadUnknown as { success?: boolean; message?: string })
          : {};

        if (response.ok && payload.success !== false) {
          success = true;
          responsePayload = payload as Record<string, unknown>;
          successMessage = payload.message || `New season created for ${league.name}`;
          break;
        }

        if (payload.message) errorMessage = payload.message;

        // Try fallback endpoint when the first endpoint is missing or method isn't allowed.
        const shouldTryFallback = i === 0 && (response.status === 404 || response.status === 405);
        if (!shouldTryFallback) break;
      }

      if (!success) {
        throw new Error(errorMessage);
      }

      const extractSeasonIdFromPayload = (payload: Record<string, unknown> | null): string | null => {
        if (!payload) return null;

        const asRecord = (v: unknown): Record<string, unknown> | null =>
          typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;

        const getId = (v: unknown): string | null => {
          if (typeof v === 'string' && v.trim()) return v.trim();
          if (typeof v === 'number') return String(v);
          return null;
        };

        const directSeasonId = getId(payload.seasonId);
        if (directSeasonId) return directSeasonId;

        const seasonLikeKeys = ['season', 'newSeason', 'createdSeason', 'currentSeason'] as const;
        for (const key of seasonLikeKeys) {
          const obj = asRecord(payload[key]);
          const id = getId(obj?.id) || getId(obj?.seasonId);
          if (id) return id;
        }

        const nestedKeys = ['data', 'result', 'payload', 'league'] as const;
        for (const key of nestedKeys) {
          const obj = asRecord(payload[key]);
          if (!obj) continue;
          const id =
            getId(obj.seasonId) ||
            getId(asRecord(obj.season)?.id) ||
            getId(asRecord(obj.newSeason)?.id) ||
            getId(asRecord(obj.currentSeason)?.id);
          if (id) return id;
        }

        return null;
      };

      const resolveLatestSeasonIdFromLeague = (leaguePayload: unknown): string | null => {
        if (!leaguePayload || typeof leaguePayload !== 'object') return null;
        const leagueObj = leaguePayload as Record<string, unknown>;

        const getId = (v: unknown): string | null => {
          if (typeof v === 'string' && v.trim()) return v.trim();
          if (typeof v === 'number') return String(v);
          return null;
        };

        const currentSeason = leagueObj.currentSeason as Record<string, unknown> | undefined;
        const fromCurrent = currentSeason ? getId(currentSeason.id) : null;
        if (fromCurrent) return fromCurrent;

        const seasonsUnknown = leagueObj.seasons;
        if (!Array.isArray(seasonsUnknown) || seasonsUnknown.length === 0) return null;

        const seasons = seasonsUnknown
          .map((s) => (typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : null))
          .filter((s): s is Record<string, unknown> => Boolean(s));

        const activeSeason = seasons.find((s) => s.isActive === true);
        const activeId = activeSeason ? getId(activeSeason.id) : null;
        if (activeId) return activeId;

        const sorted = [...seasons].sort((a, b) => {
          const aNum = typeof a.seasonNumber === 'number' ? a.seasonNumber : Number(a.seasonNumber || 0);
          const bNum = typeof b.seasonNumber === 'number' ? b.seasonNumber : Number(b.seasonNumber || 0);
          return bNum - aNum;
        });
        return getId(sorted[0]?.id);
      };

      let createdSeasonId = extractSeasonIdFromPayload(responsePayload);
      if (!createdSeasonId) {
        const detailsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}?_t=${Date.now()}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        if (detailsRes.ok) {
          const detailsData: unknown = await detailsRes.json().catch(() => null);
          const leagueObj = (detailsData && typeof detailsData === 'object')
            ? (detailsData as { league?: unknown }).league
            : null;
          createdSeasonId = resolveLatestSeasonIdFromLeague(leagueObj);
        }
      }

      // Ensure league is re-activated when a fresh season is created
      try {
        const statusEndpoints = [
          `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/status`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${leagueId}/status`,
        ];
        for (let i = 0; i < statusEndpoints.length; i += 1) {
          const res = await fetch(statusEndpoints[i], {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ active: true }),
          });
          if (res.ok) break;
          const shouldTryFallback = i === 0 && (res.status === 404 || res.status === 405);
          if (!shouldTryFallback) break;
        }
      } catch {
        // Best effort: local state below still unblocks UI even if status endpoint fails.
      }

      setLeagues((prevLeagues) => prevLeagues.map((entry) => {
        if (String(entry.id) !== leagueId) return entry;

        const leagueEntry = entry as LeagueWithStatus & {
          seasons?: Season[];
          currentSeason?: Season | null;
          archived?: boolean;
          isComplete?: boolean;
          isCompleted?: boolean;
        };

        const nextSeasons = Array.isArray(leagueEntry.seasons) && createdSeasonId
          ? leagueEntry.seasons.map((season) => ({
            ...season,
            isActive: String(season.id) === String(createdSeasonId),
            archived: String(season.id) === String(createdSeasonId) ? false : season.archived,
          }))
          : leagueEntry.seasons;

        const nextCurrentSeason = createdSeasonId && Array.isArray(nextSeasons)
          ? (nextSeasons.find((season) => String(season.id) === String(createdSeasonId)) || leagueEntry.currentSeason || null)
          : leagueEntry.currentSeason;

        return {
          ...leagueEntry,
          seasons: nextSeasons,
          currentSeason: nextCurrentSeason,
          active: true,
          status: 'active' as League['status'],
          archived: false,
          isLocked: false,
          isComplete: false,
          isCompleted: false,
          computedStatus: {
            ...(leagueEntry.computedStatus || {}),
            isComplete: false,
            isCompleted: false,
            locked: false,
            matchesPlayed: 0,
            gamesPlayed: 0,
          },
          updatedAt: new Date().toISOString(),
        } as LeagueWithStatus;
      }));
      dispatchLeagueMutationEvent('league-updated', { leagueId, reason: 'season-created-reactivated' });

      toast.success(successMessage);
      await fetchAllLeagues();

      const params = new URLSearchParams();
      params.set('tab', 'table');
      params.set('seasonCreated', '1');
      params.set('seasonCreatedMsg', successMessage);
      if (createdSeasonId) params.set('seasonId', createdSeasonId);
      router.push(`/league/${leagueId}?${params.toString()}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create new season';
      toast.error(message);
    } finally {
      setCreatingSeasonLeagueId(null);
    }
  }, [token, isLeagueAdminForCurrentUser, creatingSeasonLeagueId, fetchAllLeagues, router, dispatchLeagueMutationEvent]);

  const openCreateSeasonConfirm = useCallback((league: LeagueWithStatus) => {
    setPendingSeasonLeague(league);
    setSeasonConfirmOpen(true);
  }, []);

  const closeCreateSeasonConfirm = useCallback(() => {
    setSeasonConfirmOpen(false);
    setPendingSeasonLeague(null);
  }, []);

  const confirmCreateSeason = useCallback(async () => {
    if (!pendingSeasonLeague) return;
    await handleCreateSeasonForLeague(pendingSeasonLeague);
    setSeasonConfirmOpen(false);
    setPendingSeasonLeague(null);
  }, [pendingSeasonLeague, handleCreateSeasonForLeague]);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error('Please enter a league name');
      return;
    }
    const gamesNum = Number(maxGames);
    if (!maxGames || isNaN(gamesNum) || gamesNum < 1 || gamesNum > 100) {
      toast.error('Number of games must be between 1 and 100');
      return;
    }
    setIsCreating(true);
    try {
      console.log('Creating league:', leagueName.trim());
      const formData = new FormData();
      formData.append('name', leagueName.trim());
      formData.append('maxGames', String(gamesNum));
      if (leagueImage) formData.append('image', leagueImage);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
        method: 'POST',
        headers:
        {
          'Authorization': `Bearer ${token}`
          // 'Content-Type' mat lagayen, FormData khud set karega
        },
        body: formData
      });

      const data = await response.json();
      console.log('Create league response:', data);

      if (data.success) {
        console.log('League created successfully, refreshing list...');
        toast.success('League created successfully!');
        setIsDialogOpen(false);
        setLeagueName('');
        setLeagueImage(null);
        setImagePreview(null);
        setMaxGames('20');

        // Optimistically add new league to state
        if (data.league) {
          const nowISO = new Date().toISOString();
          const normalized: League = {
            id: String(data.league.id),
            name: data.league.name || 'My League',
            inviteCode: data.league.inviteCode || '',
            image: typeof data.league.image === 'string' ? data.league.image : '',
            createdAt: data.league.createdAt || nowISO,
            updatedAt: data.league.updatedAt || data.league.createdAt || nowISO,
            members: [],
            administrators: user ? [user] as User[] : [],
            matches: [],
            active: true,
            maxGames: typeof data.league.maxGames === 'number' ? data.league.maxGames : 0,
            showPoints: true,
            adminId: data.league.adminId,
            description: data.league.description,
            location: data.league.location,
            maxTeams: data.league.maxTeams,
            currentTeams: data.league.currentTeams,
            status: data.league.status,
          };

          // Save created league as preferred immediately
          try { if (typeof window !== 'undefined') localStorage.setItem(PREFERRED_LEAGUE_KEY, String(normalized.id)); } catch { }

          // Add new league at TOP
          setLeagues(prevLeagues => {
            const filtered = prevLeagues.filter(l => String(l.id) !== String(normalized.id));
            const enriched: LeagueWithStatus = { ...normalized };
            return sortLeaguesByRecency([enriched, ...filtered]);
          });
          dispatchLeagueMutationEvent('league-created', { leagueId: String(normalized.id), reason: 'created-league' });
          dispatchLeagueMutationEvent('league-updated', { leagueId: String(normalized.id), reason: 'created-league' });
          console.log('Added new league to state:', normalized);
        }
      } else {
        console.error('Failed to create league:', data.message);
        toast.error(data.message || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      toast.error('An error occurred while creating the league');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenMembers = async (league: League) => {
    setLoadingMembers(true);
    try {
      const bust = Date.now();
      // Removed 'Cache-Control' / 'Pragma' to prevent CORS failure
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}?bust=${bust}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        // Lost access—remove from UI and inform the user
        setLeagues(prev => prev.filter(l => String(l.id) !== String(league.id)));
        setSelectedLeague(null);
        setOpenMembers(false);
        toast.error("You don't have access to this league anymore");
        return;
      }

      const data = await response.json();
      if (data.success) {
        const admin = data.league.administrators?.[0];
        setSelectedLeague({
          ...league,
          adminId: admin?.id,
          members: (data.league.members || []).map((m: User) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            profilePicture: m.profilePicture,
            email: m.email,
            // shirtNumber: m.shirtNumber,
          })),
        });
        setOpenMembers(true);
      } else {
        toast.error(data.message || 'Failed to fetch league members');
      }
    } catch {
      toast.error('Failed to fetch league members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const removeMemberFromLeague = async (
    leagueId: string | number,
    memberId: string
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!token) return { ok: false, message: 'Authentication token is missing' };

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const lid = encodeURIComponent(String(leagueId));
    const mid = encodeURIComponent(String(memberId));

    type RemoveMemberAttempt = {
      method: 'DELETE' | 'POST';
      url: string;
      body?: Record<string, unknown>;
    };

    const attempts: RemoveMemberAttempt[] = [
      { method: 'DELETE', url: `${baseUrl}/leagues/${lid}/users/${mid}` },
      { method: 'DELETE', url: `${baseUrl}/api/leagues/${lid}/users/${mid}` },
      { method: 'DELETE', url: `${baseUrl}/leagues/${lid}/members/${mid}` },
      { method: 'DELETE', url: `${baseUrl}/api/leagues/${lid}/members/${mid}` },
      { method: 'POST', url: `${baseUrl}/leagues/${lid}/users/${mid}/remove`, body: {} },
      { method: 'POST', url: `${baseUrl}/api/leagues/${lid}/users/${mid}/remove`, body: {} },
      { method: 'POST', url: `${baseUrl}/leagues/${lid}/members/remove`, body: { memberId: String(memberId) } },
      { method: 'POST', url: `${baseUrl}/api/leagues/${lid}/members/remove`, body: { memberId: String(memberId) } },
      { method: 'POST', url: `${baseUrl}/leagues/${lid}/users/remove`, body: { userId: String(memberId) } },
      { method: 'POST', url: `${baseUrl}/api/leagues/${lid}/users/remove`, body: { userId: String(memberId) } },
    ];

    let lastMessage = 'Failed to remove member';

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            ...(attempt.body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: attempt.body ? JSON.stringify(attempt.body) : undefined,
        });

        if (response.ok || response.status === 204) {
          return { ok: true };
        }

        const text = await response.text().catch(() => '');
        if (text) lastMessage = text;

        // For non-route-missing cases, stop early and surface backend message
        if (response.status !== 404 && response.status !== 405) {
          return { ok: false, message: text || `Failed to remove member (${response.status})` };
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Network error';
        lastMessage = msg || lastMessage;
      }
    }

    return { ok: false, message: lastMessage };
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLeague) return;
    try {
      const result = await removeMemberFromLeague(selectedLeague.id, memberId);
      if (!result.ok) {
        toast.error(result.message || 'Failed to remove member');
        return;
      }

      // If current user was removed, refresh the entire leagues list
      if (String(memberId) === String(user?.id ?? '')) {
        setOpenMembers(false);
        await fetchAllLeagues();
      } else {
        // Optimistic local update for instant UI feedback
        setLeagues(prev => prev.map(l => String(l.id) === String(selectedLeague.id) ? {
          ...l,
          members: Array.isArray(l.members) ? l.members.filter(m => String(m.id) !== String(memberId)) : l.members,
          administrators: Array.isArray(l.administrators) ? l.administrators.filter(a => String(a.id) !== String(memberId)) : l.administrators,
          updatedAt: new Date().toISOString(),
        } : l));
        setSelectedLeague(prev => prev ? {
          ...prev,
          members: Array.isArray(prev.members) ? prev.members.filter(m => String(m.id) !== String(memberId)) : prev.members,
          administrators: Array.isArray(prev.administrators) ? prev.administrators.filter(a => String(a.id) !== String(memberId)) : prev.administrators,
          updatedAt: new Date().toISOString(),
        } : prev);
        try {
          window.dispatchEvent(new CustomEvent('league-updated', { detail: { leagueId: selectedLeague.id, reason: 'member-removed' } }));
        } catch { }
        // Background refresh to ensure consistency (no-cache bust)
        await handleOpenMembers(selectedLeague);
        try { toast.success('Member removed'); } catch { }
      }
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveLeague = async (preferredAdminId?: string) => {
    const league = selectedLeague || adminSettingsLeague;
    if (!league) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferredAdminId ? { preferredAdminId } : {}),
      });

      if (response.ok) {
        setOpenMembers(false);
        setOpenAdminSettings(false);
        setSelectedLeague(null);
        setAdminSettingsLeague(null);
        await fetchAllLeagues();
        toast.success('Successfully left the league');
      } else {
        toast.error('Failed to leave league');
      }
    } catch {
      toast.error('Failed to leave league');
    }
  };

  const handleLeaveActiveSeason = async (seasonId?: string) => {
    const league = selectedLeague || adminSettingsLeague;
    if (!league || !token) return;

    const leagueWithSeasons = league as League & { seasons?: Season[]; currentSeason?: Season | null };
    const seasons = Array.isArray(leagueWithSeasons.seasons) ? leagueWithSeasons.seasons : [];
    const nonArchivedSeasons = seasons.filter((season) => !Boolean(season.archived) && !Boolean((season as Season & { deleted?: boolean }).deleted));
    const requestedSeasonId = String(seasonId || '').trim();

    const targetSeason = requestedSeasonId
      ? (
        nonArchivedSeasons.find((season) => String(season.id) === requestedSeasonId)
        || seasons.find((season) => String(season.id) === requestedSeasonId)
        || null
      )
      : (
        nonArchivedSeasons.find((season) => season.isActive)
        || leagueWithSeasons.currentSeason
        || nonArchivedSeasons.sort((a, b) => (b.seasonNumber || 0) - (a.seasonNumber || 0))[0]
        || null
      );

    if (!targetSeason?.id) {
      toast.error(requestedSeasonId ? 'Selected season not found' : 'No active season found')
      return;
    }

    const seasonName = targetSeason.name?.trim() || `Season ${targetSeason.seasonNumber || ''}`.trim();
    if (!window.confirm(`Leave ${seasonName}?`)) return;

    const attempts = [
      `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${league.id}/seasons/${targetSeason.id}/leave`,
      `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/seasons/${targetSeason.id}/leave`,
      `${process.env.NEXT_PUBLIC_API_URL}/api/seasons/${targetSeason.id}/leave`,
    ];

    let success = false;
    let message = 'Failed to leave season';

    for (const url of attempts) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const payloadUnknown: unknown = await response.json().catch(() => ({}));
        const payload = isRecord(payloadUnknown) ? payloadUnknown as { success?: boolean; message?: string } : {};

        if (response.ok && payload.success !== false) {
          success = true;
          break;
        }
        if (payload.message) message = payload.message;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '';
        if (errMsg) message = errMsg;
      }
    }

    if (!success) {
      toast.error(message);
      return;
    }

    toast.success('You left the selected season');
    await fetchAllLeagues();
    setOpenMembers(false);
    setSelectedLeague(null);
  };

  // Admin: settings update/delete handlers for LeagueMembersDialog
  const handleUpdateLeagueFromSettings = useCallback(async (data: LeagueUpdatePayload) => {
    if (!selectedLeague) return;
    const hasImageChange = !!data.imageFile || !!data.removeImage;
    let fetchOptions: RequestInit;

    if (hasImageChange) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('active', String(data.active));
      formData.append('maxGames', String(data.maxGames));
      formData.append('showPoints', String(data.showPoints));
      if (data.admins?.length) formData.append('admins', JSON.stringify(data.admins));
      if (data.seasonId) formData.append('seasonId', data.seasonId);
      if (data.seasonMaxGames !== undefined) formData.append('seasonMaxGames', String(data.seasonMaxGames));
      if (data.seasonShowPoints !== undefined) formData.append('seasonShowPoints', String(data.seasonShowPoints));
      if (data.imageFile) formData.append('image', data.imageFile);
      if (data.removeImage) formData.append('removeImage', 'true');
      fetchOptions = {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      };
    } else {
      fetchOptions = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          active: data.active,
          maxGames: data.maxGames,
          showPoints: data.showPoints,
          admins: data.admins,
          seasonId: data.seasonId,
          seasonMaxGames: data.seasonMaxGames,
          seasonShowPoints: data.seasonShowPoints,
        }),
      };
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}`, fetchOptions);
    const jsonUnknown: unknown = await res.json().catch(() => ({}));
    const json = isRecord(jsonUnknown) ? (jsonUnknown as Record<string, unknown>) : {};

    if (!res.ok || json.success === false) {
      const serverMessage = typeof json.message === 'string' ? json.message.trim() : '';
      const normalizedServerMessage = serverMessage.toLowerCase();
      const looksLikeUploadError =
        res.status === 413 ||
        normalizedServerMessage.includes('file too large') ||
        normalizedServerMessage.includes('limit_file_size') ||
        normalizedServerMessage.includes('payload too large') ||
        normalizedServerMessage.includes('size limit') ||
        normalizedServerMessage.includes('larger than');
      const genericServerMessage =
        !serverMessage ||
        normalizedServerMessage.includes('something went wrong') ||
        normalizedServerMessage.includes('failed to update league');

      const uploadMessage = `Unable to upload image. Please ensure the file size is under ${LEAGUE_IMAGE_MAX_SIZE_MB}MB.`;
      const message = (hasImageChange && (looksLikeUploadError || genericServerMessage))
        ? uploadMessage
        : (serverMessage || 'Failed to update league');
      throw new Error(message);
    }

    const leaguePayload = isRecord(json.league) ? (json.league as Record<string, unknown>) : null;
    const nextLeagueName =
      typeof leaguePayload?.name === 'string' && leaguePayload.name.trim().length > 0
        ? leaguePayload.name
        : (data.name ?? selectedLeague.name);
    const nextLeagueActive = typeof leaguePayload?.active === 'boolean' ? leaguePayload.active : data.active;
    const nextLeagueMaxGames = typeof leaguePayload?.maxGames === 'number' ? leaguePayload.maxGames : data.maxGames;
    const nextLeagueShowPoints = typeof leaguePayload?.showPoints === 'boolean' ? leaguePayload.showPoints : data.showPoints;
    const nextLeagueImage =
      typeof leaguePayload?.image === 'string'
        ? leaguePayload.image
        : (data.removeImage ? '' : selectedLeague.image);
    const nextAdminId = data.admins && data.admins.length > 0 ? data.admins[0] : selectedLeague.adminId;
    const selectedSeasonId = data.seasonId ? String(data.seasonId) : '';
    const updatedAtIso = new Date().toISOString();

    const patchSeasons = (rawSeasons?: Season[]): Season[] | undefined => {
      if (!Array.isArray(rawSeasons)) return rawSeasons;
      if (!selectedSeasonId) return rawSeasons;
      return rawSeasons.map((season) => (
        String(season.id) === selectedSeasonId
          ? {
            ...season,
            ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
            ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
          }
          : season
      ));
    };

    // Update local list optimistically
    setLeagues(prev => prev.map(l => {
      if (String(l.id) !== String(selectedLeague.id)) return l;
      const leagueWithSeasons = l as League & { seasons?: Season[]; currentSeason?: Season | null };
      const nextSeasons = patchSeasons(leagueWithSeasons.seasons);
      const nextCurrentSeason = leagueWithSeasons.currentSeason && selectedSeasonId && String(leagueWithSeasons.currentSeason.id) === selectedSeasonId
        ? {
          ...leagueWithSeasons.currentSeason,
          ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
          ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
        }
        : leagueWithSeasons.currentSeason;

      return {
        ...leagueWithSeasons,
        name: nextLeagueName ?? leagueWithSeasons.name,
        active: nextLeagueActive ?? leagueWithSeasons.active,
        maxGames: nextLeagueMaxGames ?? leagueWithSeasons.maxGames,
        showPoints: nextLeagueShowPoints ?? leagueWithSeasons.showPoints,
        image: nextLeagueImage,
        adminId: nextAdminId,
        administrators: data.admins && data.admins.length > 0
          ? (leagueWithSeasons.members || []).filter(m => data.admins!.includes(m.id))
          : leagueWithSeasons.administrators,
        seasons: nextSeasons,
        currentSeason: nextCurrentSeason,
        updatedAt: updatedAtIso,
      } as LeagueWithStatus;
    }));

    // Keep selected league details in sync
    setSelectedLeague(prev => {
      if (!prev) return prev;
      const prevWithSeasons = prev as League & { seasons?: Season[]; currentSeason?: Season | null };
      const nextSeasons = patchSeasons(prevWithSeasons.seasons);
      const nextCurrentSeason = prevWithSeasons.currentSeason && selectedSeasonId && String(prevWithSeasons.currentSeason.id) === selectedSeasonId
        ? {
          ...prevWithSeasons.currentSeason,
          ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
          ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
        }
        : prevWithSeasons.currentSeason;

      return {
        ...prevWithSeasons,
        name: nextLeagueName ?? prevWithSeasons.name,
        active: nextLeagueActive ?? prevWithSeasons.active,
        maxGames: nextLeagueMaxGames ?? prevWithSeasons.maxGames,
        showPoints: nextLeagueShowPoints ?? prevWithSeasons.showPoints,
        image: nextLeagueImage,
        adminId: nextAdminId,
        administrators: data.admins && data.admins.length > 0
          ? (prevWithSeasons.members || []).filter(m => data.admins!.includes(m.id))
          : prevWithSeasons.administrators,
        seasons: nextSeasons,
        currentSeason: nextCurrentSeason,
        updatedAt: updatedAtIso,
      };
    });

    dispatchLeagueMutationEvent('league-updated', {
      leagueId: String(selectedLeague.id),
      reason: 'settings-updated',
    });
  }, [selectedLeague, token, dispatchLeagueMutationEvent]);

  const handleDeleteLeagueFromSettings = useCallback(async () => {
    if (!selectedLeague) return;
    if (!window.confirm('Are you sure you want to delete this league? All players\' XP points will be preserved.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const payloadUnknown: unknown = await res.json().catch(() => ({}));
      const payload = isRecord(payloadUnknown) ? payloadUnknown as { success?: boolean; message?: string } : {};
      if (!res.ok || payload.success === false) throw new Error(payload.message || 'Failed to delete league');
      toast.success('League deleted');
      // Remove from local state
      const deletedLeagueId = String(selectedLeague.id);
      setLeagues(prev => prev.filter(l => String(l.id) !== deletedLeagueId));
      setLocallyDeletedLeagueIds((prev) => (prev.includes(deletedLeagueId) ? prev : [...prev, deletedLeagueId]));
      dispatchLeagueMutationEvent('league-deleted', { leagueId: deletedLeagueId, reason: 'settings-delete' });
      setOpenMembers(false);
      setSelectedLeague(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete league';
      toast.error(msg);
    }
  }, [selectedLeague, token, dispatchLeagueMutationEvent]);

  const handleArchiveLeagueFromSettings = useCallback(async () => {
    if (!selectedLeague) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) throw new Error('Failed to archive league');
      toast.success('League archived');
      const updatedLeagueId = String(selectedLeague.id);
      setLeagues(prev => prev.map(l => String(l.id) === updatedLeagueId ? { ...l, active: false, archived: true } as typeof l : l));
      dispatchLeagueMutationEvent('league-updated', { leagueId: updatedLeagueId, reason: 'archived' });
      setOpenMembers(false);
      setSelectedLeague(null);
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to archive league';
      toast.error(msg);
    }
  }, [selectedLeague, token, fetchAllLeagues, dispatchLeagueMutationEvent]);

  const handleUnarchiveLeagueFromSettings = useCallback(async () => {
    if (!selectedLeague) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error('Failed to unarchive league');
      toast.success('League restored');
      const updatedLeagueId = String(selectedLeague.id);
      setLeagues(prev => prev.map(l => String(l.id) === updatedLeagueId ? { ...l, active: true, archived: false } as typeof l : l));
      dispatchLeagueMutationEvent('league-updated', { leagueId: updatedLeagueId, reason: 'restored' });
      setOpenMembers(false);
      setSelectedLeague(null);
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to unarchive league';
      toast.error(msg);
    }
  }, [selectedLeague, token, fetchAllLeagues, dispatchLeagueMutationEvent]);

  // Admin Settings dialog: update/delete handlers that operate on adminSettingsLeague
  const handleUpdateLeagueFromAdminSettings = useCallback(async (data: LeagueUpdatePayload) => {
    if (!adminSettingsLeague) return;
    const hasImageChange = !!data.imageFile || !!data.removeImage;
    let fetchOptions: RequestInit;

    if (hasImageChange) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('active', String(data.active));
      formData.append('maxGames', String(data.maxGames));
      formData.append('showPoints', String(data.showPoints));
      if (data.admins?.length) formData.append('admins', JSON.stringify(data.admins));
      if (data.seasonId) formData.append('seasonId', data.seasonId);
      if (data.seasonMaxGames !== undefined) formData.append('seasonMaxGames', String(data.seasonMaxGames));
      if (data.seasonShowPoints !== undefined) formData.append('seasonShowPoints', String(data.seasonShowPoints));
      if (data.imageFile) formData.append('image', data.imageFile);
      if (data.removeImage) formData.append('removeImage', 'true');
      fetchOptions = {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      };
    } else {
      fetchOptions = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          active: data.active,
          maxGames: data.maxGames,
          showPoints: data.showPoints,
          admins: data.admins,
          seasonId: data.seasonId,
          seasonMaxGames: data.seasonMaxGames,
          seasonShowPoints: data.seasonShowPoints,
        }),
      };
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${adminSettingsLeague.id}`, fetchOptions);
    const jsonUnknown: unknown = await res.json().catch(() => ({}));
    const json = isRecord(jsonUnknown) ? (jsonUnknown as Record<string, unknown>) : {};
    if (!res.ok || json.success === false) {
      const serverMessage = typeof json.message === 'string' ? json.message.trim() : '';
      const normalizedServerMessage = serverMessage.toLowerCase();
      const looksLikeUploadError =
        res.status === 413 ||
        normalizedServerMessage.includes('file too large') ||
        normalizedServerMessage.includes('limit_file_size') ||
        normalizedServerMessage.includes('payload too large') ||
        normalizedServerMessage.includes('size limit') ||
        normalizedServerMessage.includes('larger than');
      const genericServerMessage =
        !serverMessage ||
        normalizedServerMessage.includes('something went wrong') ||
        normalizedServerMessage.includes('failed to update league');

      const uploadMessage = `Unable to upload image. Please ensure the file size is under ${LEAGUE_IMAGE_MAX_SIZE_MB}MB.`;
      const message = (hasImageChange && (looksLikeUploadError || genericServerMessage))
        ? uploadMessage
        : (serverMessage || 'Failed to update league');
      throw new Error(message);
    }

    const leaguePayload = isRecord(json.league) ? (json.league as Record<string, unknown>) : null;
    const nextLeagueName =
      typeof leaguePayload?.name === 'string' && leaguePayload.name.trim().length > 0
        ? leaguePayload.name
        : (data.name ?? adminSettingsLeague.name);
    const nextLeagueActive = typeof leaguePayload?.active === 'boolean' ? leaguePayload.active : data.active;
    const nextLeagueMaxGames = typeof leaguePayload?.maxGames === 'number' ? leaguePayload.maxGames : data.maxGames;
    const nextLeagueShowPoints = typeof leaguePayload?.showPoints === 'boolean' ? leaguePayload.showPoints : data.showPoints;
    const nextLeagueImage =
      typeof leaguePayload?.image === 'string'
        ? leaguePayload.image
        : (data.removeImage ? '' : adminSettingsLeague.image);
    const nextAdminId = data.admins && data.admins.length > 0 ? data.admins[0] : adminSettingsLeague.adminId;
    const selectedSeasonId = data.seasonId ? String(data.seasonId) : '';
    const updatedAtIso = new Date().toISOString();

    const patchSeasons = (rawSeasons?: Season[]): Season[] | undefined => {
      if (!Array.isArray(rawSeasons)) return rawSeasons;
      if (!selectedSeasonId) return rawSeasons;
      return rawSeasons.map((season) => (
        String(season.id) === selectedSeasonId
          ? {
            ...season,
            ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
            ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
          }
          : season
      ));
    };

    // Update leagues list optimistically
    setLeagues(prev => prev.map(l => {
      if (String(l.id) !== String(adminSettingsLeague.id)) return l;
      const leagueWithSeasons = l as League & { seasons?: Season[]; currentSeason?: Season | null };
      const nextSeasons = patchSeasons(leagueWithSeasons.seasons);
      const nextCurrentSeason = leagueWithSeasons.currentSeason && selectedSeasonId && String(leagueWithSeasons.currentSeason.id) === selectedSeasonId
        ? {
          ...leagueWithSeasons.currentSeason,
          ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
          ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
        }
        : leagueWithSeasons.currentSeason;

      return {
        ...leagueWithSeasons,
        name: nextLeagueName ?? leagueWithSeasons.name,
        active: nextLeagueActive ?? leagueWithSeasons.active,
        maxGames: nextLeagueMaxGames ?? leagueWithSeasons.maxGames,
        showPoints: nextLeagueShowPoints ?? leagueWithSeasons.showPoints,
        image: nextLeagueImage,
        adminId: nextAdminId,
        administrators: data.admins && data.admins.length > 0
          ? (leagueWithSeasons.members || []).filter(m => data.admins!.includes(m.id))
          : leagueWithSeasons.administrators,
        seasons: nextSeasons,
        currentSeason: nextCurrentSeason,
        updatedAt: updatedAtIso,
      } as LeagueWithStatus;
    }));

    // Update admin settings league details
    setAdminSettingsLeague(prev => {
      if (!prev) return prev;
      const prevWithSeasons = prev as League & { seasons?: Season[]; currentSeason?: Season | null };
      const nextSeasons = patchSeasons(prevWithSeasons.seasons);
      const nextCurrentSeason = prevWithSeasons.currentSeason && selectedSeasonId && String(prevWithSeasons.currentSeason.id) === selectedSeasonId
        ? {
          ...prevWithSeasons.currentSeason,
          ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
          ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
        }
        : prevWithSeasons.currentSeason;

      return {
        ...prevWithSeasons,
        name: nextLeagueName ?? prevWithSeasons.name,
        active: nextLeagueActive ?? prevWithSeasons.active,
        maxGames: nextLeagueMaxGames ?? prevWithSeasons.maxGames,
        showPoints: nextLeagueShowPoints ?? prevWithSeasons.showPoints,
        image: nextLeagueImage,
        adminId: nextAdminId,
        administrators: data.admins && data.admins.length > 0
          ? (prevWithSeasons.members || []).filter(m => data.admins!.includes(m.id))
          : prevWithSeasons.administrators,
        seasons: nextSeasons,
        currentSeason: nextCurrentSeason,
        updatedAt: updatedAtIso,
      };
    });

    // If currently selectedLeague matches, keep it in sync as well
    setSelectedLeague(prev => {
      if (!prev || prev.id !== adminSettingsLeague.id) return prev;
      const prevWithSeasons = prev as League & { seasons?: Season[]; currentSeason?: Season | null };
      const nextSeasons = patchSeasons(prevWithSeasons.seasons);
      const nextCurrentSeason = prevWithSeasons.currentSeason && selectedSeasonId && String(prevWithSeasons.currentSeason.id) === selectedSeasonId
        ? {
          ...prevWithSeasons.currentSeason,
          ...(data.seasonMaxGames !== undefined ? { maxGames: data.seasonMaxGames } : {}),
          ...(data.seasonShowPoints !== undefined ? { showPoints: data.seasonShowPoints } : {}),
        }
        : prevWithSeasons.currentSeason;

      return {
        ...prevWithSeasons,
        name: nextLeagueName ?? prevWithSeasons.name,
        active: nextLeagueActive ?? prevWithSeasons.active,
        maxGames: nextLeagueMaxGames ?? prevWithSeasons.maxGames,
        showPoints: nextLeagueShowPoints ?? prevWithSeasons.showPoints,
        image: nextLeagueImage,
        adminId: nextAdminId,
        administrators: data.admins && data.admins.length > 0
          ? (prevWithSeasons.members || []).filter(m => data.admins!.includes(m.id))
          : prevWithSeasons.administrators,
        seasons: nextSeasons,
        currentSeason: nextCurrentSeason,
        updatedAt: updatedAtIso,
      };
    });

    dispatchLeagueMutationEvent('league-updated', {
      leagueId: String(adminSettingsLeague.id),
      reason: 'admin-settings-updated',
    });
  }, [adminSettingsLeague, token, dispatchLeagueMutationEvent]);

  const handleDeleteLeagueFromAdminSettings = useCallback(async () => {
    if (!adminSettingsLeague) return;
    if (!window.confirm('Are you sure you want to delete this league? All players\' XP points will be preserved.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${adminSettingsLeague.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const payloadUnknown: unknown = await res.json().catch(() => ({}));
      const payload = isRecord(payloadUnknown) ? payloadUnknown as { success?: boolean; message?: string } : {};
      if (!res.ok || payload.success === false) throw new Error(payload.message || 'Failed to delete league');
      toast.success('League deleted');
      // Remove from local state
      const deletedLeagueId = String(adminSettingsLeague.id);
      setLeagues(prev => prev.filter(l => String(l.id) !== deletedLeagueId));
      setLocallyDeletedLeagueIds((prev) => (prev.includes(deletedLeagueId) ? prev : [...prev, deletedLeagueId]));
      dispatchLeagueMutationEvent('league-deleted', { leagueId: deletedLeagueId, reason: 'admin-settings-delete' });
      // Clear dialog/selection states
      setAdminSettingsLeague(null);
      setOpenAdminSettings(false);
      if (selectedLeague && String(selectedLeague.id) === deletedLeagueId) {
        setSelectedLeague(null);
        setOpenMembers(false);
      }
      // Ensure lists are fresh
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete league';
      toast.error(msg);
    }
  }, [adminSettingsLeague, token, selectedLeague, fetchAllLeagues, dispatchLeagueMutationEvent]);

  const handleArchiveLeagueFromAdminSettings = useCallback(async () => {
    if (!adminSettingsLeague) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${adminSettingsLeague.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) throw new Error('Failed to archive league');
      toast.success('League archived');
      // Update local state
      const updatedLeagueId = String(adminSettingsLeague.id);
      setLeagues(prev => prev.map(l => String(l.id) === updatedLeagueId ? { ...l, active: false, archived: true } as typeof l : l));
      dispatchLeagueMutationEvent('league-updated', { leagueId: updatedLeagueId, reason: 'archived' });
      // Clear dialog/selection states
      setAdminSettingsLeague(null);
      setOpenAdminSettings(false);
      if (selectedLeague && String(selectedLeague.id) === updatedLeagueId) {
        setSelectedLeague(null);
        setOpenMembers(false);
      }
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to archive league';
      toast.error(msg);
    }
  }, [adminSettingsLeague, token, selectedLeague, fetchAllLeagues, dispatchLeagueMutationEvent]);

  const handleUnarchiveLeagueFromAdminSettings = useCallback(async () => {
    if (!adminSettingsLeague) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${adminSettingsLeague.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error('Failed to unarchive league');
      toast.success('League restored');
      const updatedLeagueId = String(adminSettingsLeague.id);
      setLeagues(prev => prev.map(l => String(l.id) === updatedLeagueId ? { ...l, active: true, archived: false } as typeof l : l));
      dispatchLeagueMutationEvent('league-updated', { leagueId: updatedLeagueId, reason: 'restored' });
      setAdminSettingsLeague(null);
      setOpenAdminSettings(false);
      if (selectedLeague && String(selectedLeague.id) === updatedLeagueId) {
        setSelectedLeague(null);
        setOpenMembers(false);
      }
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to unarchive league';
      toast.error(msg);
    }
  }, [adminSettingsLeague, token, selectedLeague, fetchAllLeagues, dispatchLeagueMutationEvent]);

  // const handleBackToAllLeagues = () => {
  //   router.push('/home');
  // };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
        fontFamily: '"League Spartan", sans-serif',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3, md: 3 } }}>

        {/* <Button
          startIcon={<ArrowLeft />}
          onClick={handleBackToAllLeagues}
          sx={{
            mb: 2, color: 'white', backgroundColor: '#388e3c',
            '&:hover': { backgroundColor: '#388e3c' ,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          Back to Dashboard
        </Button> */}
        {/* Close Button */}
        <Box
          sx={{
            mb: { xs: 3, md: 5 },
            bgcolor: 'black',
            p: { xs: 2, md: 3 },
            minHeight: { xs: 'var(--header-mobile-min-height)', md: 'auto' },
            width: '100vw',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 } }}> */}
          <Typography variant="h3" sx={{
            color: 'white',
            fontFamily: '"Oswald", sans-serif !important',
            fontWeight: 700,
            fontSize: { xs: '32px', sm: '42px', md: '55px' },
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            pt: { xs: 1, md: 2 },
            pb: { xs: 3, md: 6 }
          }}
            className='all-leagues-heading'
          >
            LEAGUES
          </Typography>

          {/* Divider line below heading */}
          <Box sx={{
            width: '100vw',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
            height: 'var(--header-divider-height)',
            background: 'var(--header-divider-color)',
            mb: { xs: 2, md: 2 },
          }} />

          {/* </Box> */}
          {/* Create/Join League Section */}
          {/* Single unified inline layout */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1.25, md: 2 },
              flexWrap: 'wrap',
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              px: { xs: 0, sm: 2, md: 14 }
            }}
          >
            {/* Left side: Create + Invite + Join */}
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1, md: 2 },
                alignItems: { xs: 'stretch', md: 'center' },
                flexWrap: 'wrap',
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Button variant="contained" onClick={() => setIsDialogOpen(true)} sx={{
                bgcolor: '#0388E3',
                color: 'white',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 'semi-bold',
                fontSize: { xs: '15px', md: '18px' },
                '&:hover': { bgcolor: '#0266b8' },
                borderRadius: 1,
                width: { xs: '100%', sm: 'auto' },
                minHeight: { xs: 42, md: 'auto' },
                px: 2.5,
                textTransform: 'none',
                whiteSpace: 'nowrap'
              }}>+ Create New League</Button>

              {/* Grouped Invite Code + Join Button */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  width: { xs: '100%', sm: 300, md: 300 },
                  overflow: 'hidden',
                }}
              >
                <TextField
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  size="small"
                  variant="outlined"
                  autoComplete="off"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: '#fff',
                    borderRadius: '6px 0 0 6px',
                    '& .MuiOutlinedInput-root': {
                      color: '#111',
                      height: { xs: 42, md: 42 },
                      // borderRadius: '12px 0 0 12px',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: 'none' },
                    },
                    '& .MuiInputBase-input': {
                      padding: '0 14px',
                      height: '42px',
                      fontSize: { xs: '0.85rem', md: '0.95rem' },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(0,0,0,0.55)',
                      opacity: 1,
                      fontSize: { xs: '0.82rem', md: '0.9rem' },
                    }
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleJoinLeague}
                  disabled={isJoining}
                  sx={{
                    bgcolor: '#00A896',
                    color: 'white',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 'semi-bold',
                    fontSize: { xs: '15px', md: '18px' },
                    '&:hover': { bgcolor: '#008c7a' },
                    '&:disabled': { bgcolor: '#00A896', opacity: 0.6 },
                    borderRadius: '0 6px 6px 0',
                    minWidth: { xs: 110, sm: 124 },
                    height: { xs: 42, md: 42 },
                    px: { xs: 1.5, sm: 2 },
                    textTransform: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isJoining ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Join League'}
                </Button>
              </Box>
            </Box>

            {/* Right side: Dropdowns + Clear */}
            <Box
              sx={{
                display: 'flex',
                columnGap: { xs: 0.25, md: 0.50 },
                rowGap: { xs: 0.25, md: 0.50 },
                alignItems: 'center',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <TextField
                select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                size="small"
                sx={{
                  minWidth: 150,
                  width: { xs: '100%', sm: 180, md: 150 },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    borderRadius: 6,
                    '& .MuiSelect-select': { py: 1.25, px: 2 },
                    '& fieldset': { borderColor: 'rgba(229, 106, 22, 0.8)', borderWidth: '2px' },
                    '&:hover fieldset': { borderColor: 'rgba(229, 106, 22, 1)', borderWidth: '2px' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(229, 106, 22, 1)', borderWidth: '2px' }
                  },
                  '& .MuiSvgIcon-root': { color: 'rgba(229, 106, 22, 1)' }
                }}
                SelectProps={{
                  MenuProps: {
                    ...dropdownMenuBaseProps,
                    PaperProps: {
                      sx: { ...dropdownPaperBaseSx, bgcolor: '#1a1a1a', color: 'white' }
                    }
                  }
                }}
              >
                <MenuItem value="all">All Years</MenuItem>
                {yearOptions.map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
              </TextField>
              <TextField
                select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                size="small"
                sx={{
                  minWidth: 150,
                  width: { xs: '100%', sm: 180, md: 150 },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    borderRadius: 6,
                    '& .MuiSelect-select': { py: 1.25, px: 2 },
                    '& fieldset': { borderColor: 'rgba(229, 106, 22, 0.8)', borderWidth: '2px' },
                    '&:hover fieldset': { borderColor: 'rgba(229, 106, 22, 1)', borderWidth: '2px' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(229, 106, 22, 1)', borderWidth: '2px' }
                  },
                  '& .MuiSvgIcon-root': { color: 'rgba(229, 106, 22, 1)' }
                }}
                SelectProps={{
                  MenuProps: {
                    ...dropdownMenuBaseProps,
                    PaperProps: {
                      sx: { ...dropdownPaperBaseSx, bgcolor: '#1a1a1a', color: 'white' }
                    }
                  }
                }}
              >
                <MenuItem value="all">All Leagues</MenuItem>
                {filteredLeagues.map((league) => (
                  <MenuItem key={league.id} value={String(league.id)}>
                    {league.name}
                  </MenuItem>
                ))}
              </TextField>


              <Button
                variant="outlined"
                onClick={() => { setSelectedYear('all'); setSearchTerm(''); setSelectedLeagueId('all'); setCompletionTab('live'); }}
                sx={{
                  color: 'white',
                  borderRadius: 6,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderWidth: '3px',
                  px: 2.5,
                  py: 1,
                  width: { xs: '100%', sm: 'auto' },
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderWidth: '3px',
                    bgcolor: 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>

          {/* Complete/Live Leagues Filter Buttons */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: { xs: 2, md: 3 },
            mb: 4
          }}>
            <Box sx={{
              display: 'flex',
              bgcolor: '#3F4652',
              borderRadius: '12px',
              p: 0.5,
              width: { xs: '90%', sm: 400, md: 500 }
            }}>
              <Button
                onClick={() => setCompletionTab('live')}
                sx={{
                  flex: 1,
                  textTransform: 'uppercase',
                  borderRadius: '10px',
                  py: { xs: 1, md: 1.5 },
                  fontSize: { xs: '14px', sm: '16px', md: '18px' },
                  fontFamily: 'Woodford Bourne Pro, sans-serif',
                  fontWeight: 700,
                  bgcolor: completionTab === 'live' ? '#00a896' : 'transparent',
                  color: completionTab === 'live' ? '#ffffff' : '#FFFFFF',
                  '&:hover': {
                    bgcolor: completionTab === 'live' ? '#00a896' : '#3f4652',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Live Leagues
              </Button>
              <Button
                onClick={() => setCompletionTab('completed')}
                sx={{
                  flex: 1,
                  textTransform: 'uppercase',
                  borderRadius: '10px',
                  py: { xs: 1, md: 1.5 },
                  fontSize: { xs: '14px', sm: '16px', md: '18px' },
                  fontFamily: 'Woodford Bourne Pro, sans-serif',
                  fontWeight: 700,
                  bgcolor: completionTab === 'completed' ? '#00a896' : 'transparent',
                  color: completionTab === 'completed' ? '#ffffff' : '#FFFFFF',
                  '&:hover': {
                    bgcolor: completionTab === 'completed' ? '#00a896' : '#3f4652',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Completed Leagues
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Leagues List - Card Format */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, px: { xs: 1, sm: 2, md: 13 }, mb: 7 }}>
          {loading ? (
            <AllLeaguesLoadingSkeleton compact />
          ) : leagues.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '18px', md: '24px' } }}>No leagues found</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '14px', md: '16px' } }}>
                Create a new league or join an existing one to get started.
              </Typography>
            </Box>
          ) : leaguesToDisplay.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '18px', md: '24px' } }}>
                No leagues found for selected filters
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '14px', md: '16px' } }}>
                Try changing the year or search name.
              </Typography>
            </Box>
          ) : (
            leaguesToDisplay.map((league) => {
              const isCompleted = isLeagueCompleted(league);
              const isLive = isLeagueLive(league);
              const hasCustomLeagueImage = typeof league?.image === 'string' && league.image.trim().length > 0;
              const canCreateSeason = isLeagueAdminForCurrentUser(league);
              const isCreatingSeason = creatingSeasonLeagueId === String(league.id);
              const canManageLiveStatus = isLeagueAdminForCurrentUser(league);
              const isUpdatingLiveStatus = leagueLiveUpdatingId === String(league.id);
              const leagueSeasons = Array.isArray((league as LeagueWithStatus & { seasons?: Season[] }).seasons)
                ? ((league as LeagueWithStatus & { seasons?: Season[] }).seasons as Season[]).filter(
                  (season) => !Boolean((season as Season & { deleted?: boolean }).deleted)
                )
                : [];
              const totalSeasons = leagueSeasons.length > 0 ? leagueSeasons.length : 1;
              const activeSeasonForInvite = leagueSeasons.find((season) => season.isActive) || leagueSeasons[0] || null;
              const inviteSeasonLabel = activeSeasonForInvite
                ? (activeSeasonForInvite.name?.trim() || `Season ${activeSeasonForInvite.seasonNumber || 1}`)
                : 'Season 1';
              const inviteContextLabel = `${inviteSeasonLabel}`;
              const activeSeasonInviteCode = (
                activeSeasonForInvite?.inviteCode
                || activeSeasonForInvite?.seasonInviteCode
                || league.inviteCode
                || ''
              ).trim();
              const inviteCodeDisplay = activeSeasonInviteCode || '-';
              const inviteShareText = `Join ${inviteContextLabel} with code: ${inviteCodeDisplay}`;
              return (
                <Box
                  key={league.id}
                  onClick={() => router.push(`/league/${league.id}`)}
                  sx={{
                    px: { xs: 3, md: 3 },
                    py: { xs: 2.6, md: 2.8 },
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    // Default background
                    background: isCompleted
                      ? '#d4d4d4' // light grey for completed
                      : 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                    position: 'relative',
                    minHeight: { xs: '140px', md: '160px' },
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: isCompleted ? '#d4d4d4' : 'rgba(30, 58, 138, 1)',
                      transform: isCompleted ? 'none' : 'translateY(-3px)',
                    }
                  }}
                >
                  {/* Mobile Switch Button (Top Left) */}
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      display: { xs: 'flex', md: 'none' },
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      zIndex: 5,
                      alignItems: 'center',
                      gap: 0.3,
                      bgcolor: isLive ? 'rgba(0,168,150,0.95)' : 'rgba(31,41,55,0.9)',
                      borderRadius: 999,
                      pl: 0.7,
                      pr: 0.25,
                      py: 0.1,
                      border: '1px solid rgba(255,255,255,0.35)',
                    }}
                  >
                    <PowerSettingsNew sx={{ fontSize: 13, color: 'white' }} />
                    <Switch
                      size="small"
                      checked={isLive}
                      disabled={!canManageLiveStatus}
                      onChange={(e, checked) => {
                        e.stopPropagation();
                        void handleToggleLeagueLiveStatus(league, checked);
                      }}
                      sx={{
                        m: 0,
                        '& .MuiSwitch-thumb': { bgcolor: 'white' },
                        '& .MuiSwitch-track': {
                          borderRadius: 999,
                          opacity: '1 !important',
                          bgcolor: isLive ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.28)',
                        },
                        '& .Mui-checked + .MuiSwitch-track': {
                          bgcolor: 'rgba(255,255,255,0.42) !important',
                        },
                      }}
                    />
                  </Box>

                  {/* Settings Icon - Top Right */}
                  {isCompleted ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        zIndex: 4,
                        color: '#16a34a',
                      }}
                    >
                      <CheckCircle sx={{ color: '#16a34a' }} />
                      <Chip label="Completed" size="small" sx={{ bgcolor: 'rgba(22,163,74,0.1)', color: '#14532d', borderColor: '#16a34a' }} variant="outlined" />
                    </Box>
                  ) : (
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: { xs: 8, md: 18 },
                        bottom: { xs: 'auto', md: 'auto' },
                        right: { xs: 8, md: 18 },
                        color: 'white',
                        '& .settings-icon': {
                          transition: 'filter 0.2s ease',
                          // Keep source icon pure white in default state
                          filter: 'brightness(0) saturate(100%) invert(100%)',
                        },
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                        '&:hover .settings-icon': {
                          // Recolor white icon to orange/red on hover
                          filter: 'brightness(0) saturate(100%) invert(56%) sepia(84%) saturate(2061%) hue-rotate(354deg) brightness(95%) contrast(92%)',
                        },
                        zIndex: 4,
                        p: { xs: 0.25, md: 1 },
                        pr: { xs: 0.25, md: 3 }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isAdmin = (league.adminId || league.administrators?.[0]?.id) === (user?.id || '')
                        if (isAdmin) {
                          // Open standalone settings dialog for admins
                          setAdminSettingsLeague(league)
                          setOpenAdminSettings(true)
                        } else {
                          handleOpenMembers(league)
                        }
                      }}
                    >
                      <Image
                        src={setting}
                        alt="Settings"
                        width={24}
                        height={24}
                        className="settings-icon w-5 h-5 md:w-6 md:h-6"
                        style={{ flexShrink: 0 }}
                      />
                    </IconButton>
                  )}

                  {/* Grid Layout - 6/6 Split */}
                  <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center" sx={{ width: '100%' }}>
                    {/* Left Column - Trophy, Title, Players, Created */}
                    <Grid item xs={12} md={6}>
                      <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center">
                        {/* Trophy Icon - 4 */}
                        <Grid item xs={12} md={3}>
                          <Box sx={{
                            width: { xs: 60, sm: 80, md: 100 },
                            height: { xs: 60, sm: 80, md: 100 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: { xs: 'auto', md: 0 },
                            flexShrink: 0,
                            position: 'relative',
                            // bgcolor: 'white',
                            borderRadius: '50%',
                            overflow: 'visible',
                            // border:"1px solid white",
                          }}>
                            <Box
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                position: 'absolute',
                                top: -33,
                                left: -6,
                                zIndex: 5,
                                display: { xs: 'none', md: 'flex' },
                                alignItems: 'center',
                                gap: 0.3,
                                bgcolor: isLive ? 'rgba(0,168,150,0.95)' : 'rgba(31,41,55,0.9)',
                                borderRadius: 999,
                                pl: 0.7,
                                pr: 0.25,
                                py: 0.1,
                                border: '1px solid rgba(255,255,255,0.35)',
                              }}
                            >
                              <PowerSettingsNew sx={{ fontSize: 13, color: 'white' }} />
                              <Switch
                                size="small"
                                checked={isLive}
                                disabled={!canManageLiveStatus}
                                onChange={(e, checked) => {
                                  e.stopPropagation();
                                  void handleToggleLeagueLiveStatus(league, checked);
                                }}
                                sx={{
                                  m: 0,
                                  // '& .MuiSwitch-switchBase': { p: 0.5 },
                                  '& .MuiSwitch-thumb': { bgcolor: 'white' },
                                  // ya MuiSwitch-thumb is ma add kerna hn width: 11, height: 11, 
                                  '& .MuiSwitch-track': {
                                    borderRadius: 999,
                                    opacity: '1 !important',
                                    bgcolor: isLive ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.28)',
                                  },
                                  '& .Mui-checked + .MuiSwitch-track': {
                                    bgcolor: 'rgba(255,255,255,0.42) !important',
                                  },
                                }}
                              />
                            </Box>
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                p: hasCustomLeagueImage ? 0 : { xs: 0.8, sm: 1, md: 1.2 },
                                boxSizing: 'border-box',
                              }}
                            >
                              {isCompleted ? (
                              <Image
                                src={league?.image || trofy}
                                alt={`${league.name} icon`}
                                fill
                                priority
                                sizes="(max-width: 600px) 60px, (max-width: 900px) 80px, 100px"
                                style={{ objectFit: hasCustomLeagueImage ? 'cover' : 'contain' }}
                              />
                              ) : (
                                <Image
                                src={league?.image || trofyy}
                                alt={`${league.name} icon`}
                                fill
                                priority
                                sizes="(max-width: 600px) 60px, (max-width: 900px) 80px, 100px"
                                style={{ objectFit: hasCustomLeagueImage ? 'cover' : 'contain' }}
                              />
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        {/* Title and Details - 8 */}
                        <Grid item xs={12} md={9}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', alignItems: { xs: 'center', md: 'flex-start' }, height: '100%' }}>
                            {/* League Title */}
                            <Typography sx={{
                              color: isCompleted ? '#111827' : 'white',
                              fontFamily: '"Anton", sans-serif !important',
                              fontSize: { xs: '28px', sm: '32px', md: '36px' },

                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              fontWeight: 'semi-bold',
                              lineHeight: 1.3,
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                              textAlign: { xs: 'center', md: 'left' },
                              width: '100%'
                            }}>
                              {formatLeagueName(league.name)}
                            </Typography>

                            {/* Players */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                              <Image src={faceicon} alt="Players" width={18} height={18} style={{ flexShrink: 0 }} />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Players {league.members?.length || 0}
                              </Typography>
                            </Box>

                            {/* Seasons */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                              <Image
                                src={leagueIcon}
                                alt="Seasons"
                                width={16}
                                height={16}
                                style={{ flexShrink: 0, filter: isCompleted ? 'brightness(0) invert(1)' : 'none' }}
                              />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Total Seasons: {totalSeasons}
                              </Typography>
                            </Box>

                            {/* Created */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                              <Image src={schedule} alt="Created" width={16} height={16} style={{ flexShrink: 0 }} />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Created At {new Date(league.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(league.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.4, md: 1 } }}>
                              <Image src={faceicon} alt="Players" width={18} height={18} style={{ flexShrink: 0 }} />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Players {league.members?.length || 0}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.4, md: 1 } }}>
                              <Image
                                src={leagueIcon}
                                alt="Seasons"
                                width={16}
                                height={16}
                                style={{ flexShrink: 0, filter: isCompleted ? 'brightness(0) invert(1)' : 'none' }}
                              />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Total Seasons: {totalSeasons}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Image src={schedule} alt="Created" width={16} height={16} style={{ flexShrink: 0 }} />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Created At {new Date(league.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(league.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* Right Column - Code, Matches, Share, View */}
                    <Grid item xs={12} md={6}>
                      <Grid container spacing={0} alignItems="center">
                        {/* Code and Matches - 8 */}
                        <Grid item xs={12} md={8}>
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 1,
                            mt: { xs: 0.5, md: 0 },
                            height: '100%'
                          }}>
                            {/* Invite Code with Copy and Share */}
                            {!isCompleted && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Image src={inviteicon} alt="Invite Code" width={18} height={18} style={{ flexShrink: 0 }} />
                                <Typography sx={{
                                  color: 'rgba(255,255,255,0.9)',
                                  fontFamily: '"League Spartan", sans-serif',
                                  fontWeight: 300,
                                  fontSize: { xs: '10px', sm: '16px' }
                                }}>
                                  Invite Code: {inviteContextLabel}: {inviteCodeDisplay}
                                </Typography>
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: 'white',
                                    p: { xs: 0.2, sm: 0.5 },
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!activeSeasonInviteCode) {
                                      toast.error('Invite code is not available for this season yet.');
                                      return;
                                    }
                                    navigator.clipboard.writeText(activeSeasonInviteCode);
                                    toast.success('Invite code copied!');
                                  }}
                                >
                                  <svg width="19" height="21" viewBox="0 0 24 24" fill="white">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                  </svg>
                                </IconButton>
                                <Box sx={{ width: '1px', height: '20px', bgcolor: 'white', mx: 0.5 }} />
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: 'white',
                                    p: { xs: 0.2, sm: 0.5 },
                                    // background: 'linear-gradient(to right, #747474, #525252, #262626, #000000)',
                                    // borderRadius: 1,
                                    // '&:hover': { opacity: 0.8 }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!activeSeasonInviteCode) {
                                      toast.error('Invite code is not available for this season yet.');
                                      return;
                                    }
                                    const shareData = {
                                      title: `Join ${league.name}`,
                                      text: inviteShareText,
                                    };
                                    if (navigator.share) {
                                      navigator.share(shareData).catch(() => { });
                                    } else {
                                      navigator.clipboard.writeText(inviteShareText);
                                      toast.success('League info copied!');
                                    }
                                  }}
                                >
                                  <Image src={share} alt="Share" width={17} height={17} style={{ filter: 'brightness(0) invert(1)' }} />
                                </IconButton>
                              </Box>
                            )}

                            {/* Matches */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Image src={fotbal} alt="Matches" width={18} height={18} style={{ flexShrink: 0 }} />
                              <Typography sx={{
                                color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                fontFamily: '"League Spartan", sans-serif',
                                fontWeight: 300,
                                fontSize: { xs: '10px', sm: '16px' }
                              }}>
                                Total Matches: {league.matches?.length || 0}
                              </Typography>
                            </Box>

                            {canCreateSeason && (
                              <Button
                                size="small"
                                disabled={isCreatingSeason || isCompleted}
                                startIcon={!isCreatingSeason ? <AddIcon sx={{ fontSize: 22 }} /> : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCreateSeasonConfirm(league);
                                }}
                                sx={{
                                  alignSelf: 'flex-start',
                                  mt: 0.4,
                                  // px: 1.25,
                                  // py: 0.2,
                                  minHeight: 28,
                                  borderRadius: 1,
                                  textTransform: 'none',
                                  color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                                  fontFamily: '"League Spartan", sans-serif',
                                  fontWeight: 600,
                                  fontSize: { xs: '10px', sm: '16px' },
                                  textDecoration: 'underline',
                                  textUnderlineOffset: '3px',
                                  '& .MuiButton-startIcon .MuiSvgIcon-root': {
                                    color: '#ffffff',
                                  },
                                  // color: isCompleted ? '#ffffff' : '#d1fae5',
                                  // border: isCompleted ? '1px solid #111827' : '1px solid rgba(39,171,131,0.85)',
                                  // backgroundColor: isCompleted ? '#111827' : 'rgba(39,171,131,0.2)',
                                  // '&:hover': {
                                  //   backgroundColor: isCompleted ? '#1f2937' : 'rgba(39,171,131,0.32)',
                                  // },
                                  ...(isCompleted && {
                                    '&.Mui-disabled': {
                                      color: '#111827',
                                      WebkitTextFillColor: '#111827',
                                      opacity: 1,
                                    },
                                  }),
                                  ...(!isCompleted && {
                                    '&.Mui-disabled': {
                                      color: 'rgba(255,255,255,0.9)',
                                      WebkitTextFillColor: 'rgba(255,255,255,0.9)',
                                      opacity: 0.75,
                                    },
                                  }),
                                  '&.Mui-disabled .MuiButton-startIcon .MuiSvgIcon-root': {
                                    color: '#ffffff',
                                  },

                                }}
                              >
                                {isCreatingSeason ? 'Creating Season...' : 'Add New Season'}
                              </Button>
                            )}
                          </Box>
                        </Grid>

                        {/* View Button - 4 */}
                        <Grid item xs={12} md={4} sx={{ position: 'relative', minHeight: { md: 96 } }}>
                          <Grid container spacing={{ xs: 1, md: 2 }} mt={{ xs: 0.5, md: 2 }} alignItems="flex-end" sx={{ height: '100%' }}>
                            {/* Image - 6 */}
                            <Grid item xs={6} md={6}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: { xs: 'flex-start', md: 'flex-start' },
                                  alignItems: 'flex-end',
                                  height: '100%',
                                  ml: { xs: 0, md: -3 }
                                }}
                              >
                                <Image
                                  src={playerfull}
                                  alt="View"
                                  width={70}
                                  height={70}
                                  style={{ flexShrink: 0, width: 'clamp(50px, 12vw, 70px)', height: 'clamp(50px, 12vw, 70px)' }}
                                />
                              </Box>
                            </Grid>

                            {/* View Text - 6 */}
                            <Grid item xs={6} md={6}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: { xs: 'flex-end', md: 'flex-end' },
                                  pr: { xs: 0, md: 0 },
                                  alignItems: 'center',
                                  height: '100%',
                                  cursor: 'pointer',
                                  mt: { xs: 1, md: 0 },
                                  '& .view-label': {
                                    transition: 'color 0.2s ease',
                                  },
                                  '& .view-play-icon': {
                                    transition: 'filter 0.2s ease',
                                  },
                                  '&:hover .view-label': {
                                    color: '#E56A16 !important',
                                  },
                                  '&:hover .view-play-icon': {
                                    filter: 'brightness(0) saturate(100%) invert(56%) sepia(84%) saturate(2061%) hue-rotate(354deg) brightness(95%) contrast(92%)',
                                  },
                                  position: { xs: 'static', md: 'absolute' },
                                  bottom: { md: -37 },
                                  right: { md: 6 },
                                  zIndex: 4,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/league/${league.id}`);
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography className="view-label" sx={{
                                    color: isCompleted ? '#111827' : 'white',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 'semi-bold',
                                    fontSize: { xs: '22px', md: '22px' }
                                  }}>
                                    View
                                  </Typography>
                                  <Image className="view-play-icon" src={play} alt="Play" width={15} height={15} style={{ flexShrink: 0 }} />
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              )
            })
          )}
        </Box>

        {/* Archived Leagues / Seasons Section */}
        {hasArchivedSections && (
          <Box sx={{ mt: 4, mb: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 1.2
              }}
            >
              <Box
                onClick={() => {
                  setShowArchived((prev) => {
                    const next = !prev;
                    if (next) setShowArchivedSeasons(false);
                    return next;
                  });
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(229,106,22,0.3)',
                  '&:hover': { boxShadow: '0 6px 20px rgba(229,106,22,0.45)', transform: 'translateY(-1px)' },
                }}
              >
                <Typography sx={{
                  color: 'white',
                  fontFamily: '"League Spartan", sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: '15px', md: '18px' },
                  letterSpacing: '0.5px',
                }}>
                  Archived Leagues ({archivedLeagues.length})
                </Typography>
                <ExpandMore sx={{
                  color: 'white',
                  transform: showArchived ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  fontSize: 22,
                }} />
              </Box>

              <Box
                onClick={() => {
                  setShowArchivedSeasons((prev) => {
                    const next = !prev;
                    if (next) setShowArchived(false);
                    return next;
                  });
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(229,106,22,0.3)',
                  '&:hover': { boxShadow: '0 6px 20px rgba(229,106,22,0.45)', transform: 'translateY(-1px)' },
                }}
              >
                <Typography sx={{
                  color: 'white',
                  fontFamily: '"League Spartan", sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: '15px', md: '18px' },
                  letterSpacing: '0.5px',
                }}>
                  Archived Seasons ({archivedSeasons.length})
                </Typography>
                <ExpandMore sx={{
                  color: 'white',
                  transform: showArchivedSeasons ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  fontSize: 22,
                }} />
              </Box>
            </Box>

            {showArchived && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {archivedLeagues.length === 0 && (
                  <Box
                    sx={{
                      px: { xs: 3, md: 3 },
                      py: { xs: 2.4, md: 2.6 },
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                      opacity: 0.8,
                    }}
                  >
                    <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"League Spartan", sans-serif', fontSize: { xs: '14px', md: '16px' } }}>
                      No archived leagues found yet.
                    </Typography>
                  </Box>
                )}
                {archivedLeagues.map((league) => {
                  const actionLoading = archivedLeagueActionId === String(league.id);
                  const canManageArchivedLeague = isLeagueAdminForCurrentUser(league);
                  const hasCustomLeagueImage = typeof league?.image === 'string' && league.image.trim().length > 0;
                  return (
                    <Box
                      key={league.id}
                      sx={{
                        px: { xs: 3, md: 3 },
                        py: { xs: 2.6, md: 2.8 },
                        borderRadius: 3,
                        cursor: 'not-allowed',
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                        position: 'relative',
                        minHeight: { xs: '140px', md: '160px' },
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.75,
                        '&:hover': {
                          opacity: 0.75,
                          transform: 'none',
                        }
                      }}
                    >
                      {/* Archived Badge + Restore - Top Right */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          zIndex: 4,
                        }}
                      >
                        <Chip label="Archived" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }} variant="outlined" />
                        {canManageArchivedLeague && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={actionLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!window.confirm(`Restore "${league.name}" from archive?`)) return;
                                (async () => {
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ active: true }),
                                    });
                                    if (!res.ok) throw new Error('Failed');
                                    toast.success('League restored');
                                    setLeagues(prev => prev.map(l => String(l.id) === String(league.id) ? { ...l, active: true, archived: false } as typeof l : l));
                                    dispatchLeagueMutationEvent('league-updated', { leagueId: String(league.id), reason: 'restored-from-archive-list' });
                                    await fetchAllLeagues();
                                  } catch { toast.error('Failed to restore league'); }
                                })();
                              }}
                              sx={{
                                bgcolor: '#27ab83',
                                '&:hover': { bgcolor: '#1e8463' },
                                fontSize: '11px',
                                px: 1.5,
                                py: 0.3,
                                minWidth: 'auto',
                                textTransform: 'none',
                              }}
                            >
                              Restore
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={actionLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePermanentDeleteArchivedLeague(league);
                              }}
                              sx={{
                                bgcolor: '#dc2626',
                                '&:hover': { bgcolor: '#b91c1c' },
                                fontSize: '11px',
                                px: 1.5,
                                py: 0.3,
                                minWidth: 'auto',
                                textTransform: 'none',
                              }}
                            >
                              {actionLoading ? 'Deleting...' : 'Permanent Delete'}
                            </Button>
                          </>
                        )}
                      </Box>

                      {/* Grid Layout - 6/6 Split (same as live league card) */}
                      <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center" sx={{ width: '100%' }}>
                        {/* Left Column - Trophy, Title, Players, Created */}
                        <Grid item xs={12} md={6}>
                          <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center">
                            {/* Trophy Icon - 4 */}
                            <Grid item xs={12} md={3}>
                              <Box sx={{
                                width: { xs: 60, sm: 80, md: 100 },
                                height: { xs: 60, sm: 80, md: 100 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: { xs: 'auto', md: 0 },
                                flexShrink: 0,
                                position: 'relative',
                                bgcolor: 'white',
                                borderRadius: '50%',
                                overflow: 'hidden',
                              }}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    p: hasCustomLeagueImage ? 0 : { xs: 0.8, sm: 1, md: 1.2 },
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <Image
                                    src={league?.image || trofy}
                                    alt={`${league.name} icon`}
                                    fill
                                    priority
                                    sizes="(max-width: 600px) 60px, (max-width: 900px) 80px, 100px"
                                    style={{ objectFit: hasCustomLeagueImage ? 'cover' : 'contain' }}
                                  />
                                </Box>
                              </Box>
                            </Grid>

                            {/* Title and Details - 8 */}
                            <Grid item xs={12} md={9}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', alignItems: { xs: 'center', md: 'flex-start' }, height: '100%' }}>
                                {/* League Title */}
                                <Typography sx={{
                                  color: 'white',
                                  fontFamily: '"Anton", sans-serif !important',
                                  fontSize: { xs: '28px', sm: '32px', md: '36px' },
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 'semi-bold',
                                  lineHeight: 1.3,
                                  letterSpacing: '1px',
                                  textTransform: 'uppercase',
                                  textAlign: { xs: 'center', md: 'left' },
                                  width: '100%'
                                }}>
                                  {formatLeagueName(league.name)}
                                </Typography>

                                {/* Players */}
                                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                                  <Image src={faceicon} alt="Players" width={18} height={18} style={{ flexShrink: 0 }} />
                                  <Typography sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 300,
                                    fontSize: { xs: '10px', sm: '16px' }
                                  }}>
                                    Players {league.members?.length || 0}
                                  </Typography>
                                </Box>

                                {/* Created */}
                                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                                  <Image src={schedule} alt="Created" width={16} height={16} style={{ flexShrink: 0 }} />
                                  <Typography sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 300,
                                    fontSize: { xs: '10px', sm: '16px' }
                                  }}>
                                    Created At {new Date(league.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(league.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>

                            <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.4, md: 1 } }}>
                                  <Image src={faceicon} alt="Players" width={18} height={18} style={{ flexShrink: 0 }} />
                                  <Typography sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 300,
                                    fontSize: { xs: '10px', sm: '16px' }
                                  }}>
                                    Players {league.members?.length || 0}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Image src={schedule} alt="Created" width={16} height={16} style={{ flexShrink: 0 }} />
                                  <Typography sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 300,
                                    fontSize: { xs: '10px', sm: '16px' }
                                  }}>
                                    Created At {new Date(league.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(league.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>

                        {/* Right Column - Matches, View */}
                        <Grid item xs={12} md={6}>
                          <Grid container spacing={0} alignItems="center">
                            {/* Matches - 8 */}
                            <Grid item xs={12} md={8}>
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: 1,
                                mt: { xs: 0.5, md: 0 },
                                height: '100%'
                              }}>
                                {/* Matches */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Image src={fotbal} alt="Matches" width={18} height={18} style={{ flexShrink: 0 }} />
                                  <Typography sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 300,
                                    fontSize: { xs: '10px', sm: '16px' }
                                  }}>
                                    Matches: {league.matches?.length || 0}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>

                            {/* View Button - 4 */}
                            <Grid item xs={12} md={4}>
                              <Grid container spacing={{ xs: 1, md: 2 }} mt={{ xs: 0.5, md: 0 }} alignItems="flex-end" sx={{ height: '100%' }}>
                                {/* Image - 6 */}
                                <Grid item xs={6} md={6}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: { xs: 'flex-start', md: 'flex-start' },
                                      alignItems: 'flex-end',
                                      height: '100%',
                                      ml: { xs: 0, md: -5 }
                                    }}
                                  >
                                    <Image
                                      src={playerfull}
                                      alt="View"
                                      width={70}
                                      height={70}
                                      style={{ flexShrink: 0, width: 'clamp(50px, 12vw, 70px)', height: 'clamp(50px, 12vw, 70px)' }}
                                    />
                                  </Box>
                                </Grid>

                                {/* View Text - 6 */}
                                <Grid item xs={6} md={6}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      height: '100%',
                                      cursor: 'not-allowed',
                                      mt: { xs: 1, md: 0 }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{
                                        color: 'white',
                                        fontFamily: '"League Spartan", sans-serif',
                                        fontWeight: 'semi-bold',
                                        fontSize: { xs: '22px', md: '22px' }
                                      }}>
                                        Archived
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
              </Box>
            )}

            {showArchivedSeasons && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, mt: 2 }}>
                {archivedSeasons.length === 0 && (
                  <Box
                    sx={{
                      px: { xs: 3, md: 3 },
                      py: { xs: 2.4, md: 2.6 },
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                      opacity: 0.8,
                    }}
                  >
                    <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"League Spartan", sans-serif', fontSize: { xs: '14px', md: '16px' } }}>
                      No archived seasons found yet.
                    </Typography>
                  </Box>
                )}

                {groupedArchivedSeasons.map(({ league, seasons }) => (
                  <Box key={`archived-league-${league.id}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ px: { xs: 1, md: 1.5 } }}>
                      <Typography
                        sx={{
                          color: '#E5E7EB',
                          fontFamily: '"League Spartan", sans-serif',
                          fontWeight: 700,
                          fontSize: { xs: '16px', md: '20px' },
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        League Name : {formatLeagueName(league.name)}
                      </Typography>
                    </Box>

                    {seasons.map((season) => {
                      const hasCustomLeagueImage = typeof league?.image === 'string' && league.image.trim().length > 0;
                      const seasonLabel = season.name?.trim() || `Season ${season.seasonNumber || ''}`.trim();
                      const seasonCreatedAt = season.startDate || season.createdAt || league.createdAt;
                      const seasonMatches = (league.matches || []).filter((m) => String(m.seasonId || '') === String(season.id)).length;
                      const seasonPlayersCount = (season.members?.length || season.players?.length || 0);
                      const seasonActionLoading = archivedSeasonActionId === `${league.id}:${season.id}`;

                      return (
                        <Box
                          key={`${league.id}-${season.id}`}
                          sx={{
                            px: { xs: 3, md: 3 },
                            py: { xs: 2.6, md: 2.8 },
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                            position: 'relative',
                            minHeight: { xs: '140px', md: '160px' },
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.8,
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 14,
                              right: 14,
                              zIndex: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip label="Archived Season" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }} variant="outlined" />
                            {isLeagueAdminForCurrentUser(league) && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={seasonActionLoading}
                                  onClick={() => { void handleRestoreArchivedSeasonGlobal(league, season); }}
                                  sx={{
                                    bgcolor: '#27ab83',
                                    '&:hover': { bgcolor: '#1e8463' },
                                    fontSize: '11px',
                                    px: 1.5,
                                    py: 0.3,
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                  }}
                                >
                                  Restore
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={seasonActionLoading}
                                  onClick={() => { void handlePermanentDeleteArchivedSeasonGlobal(league, season); }}
                                  sx={{
                                    bgcolor: '#dc2626',
                                    '&:hover': { bgcolor: '#b91c1c' },
                                    fontSize: '11px',
                                    px: 1.5,
                                    py: 0.3,
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                  }}
                                >
                                  {seasonActionLoading ? 'Deleting...' : 'Permanent Delete'}
                                </Button>
                              </>
                            )}
                          </Box>

                          <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center" sx={{ width: '100%' }}>
                            <Grid item xs={12} md={6}>
                              <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center">
                                <Grid item xs={12} md={3}>
                                  <Box sx={{
                                    width: { xs: 60, sm: 80, md: 100 },
                                    height: { xs: 60, sm: 80, md: 100 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: { xs: 'auto', md: 0 },
                                    flexShrink: 0,
                                    position: 'relative',
                                    bgcolor: 'white',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                  }}>
                                    <Box
                                      sx={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        p: hasCustomLeagueImage ? 0 : { xs: 0.8, sm: 1, md: 1.2 },
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <Image
                                        src={league?.image || trofy}
                                        alt={`${league.name} icon`}
                                        fill
                                        priority
                                        sizes="(max-width: 600px) 60px, (max-width: 900px) 80px, 100px"
                                        style={{ objectFit: hasCustomLeagueImage ? 'cover' : 'contain' }}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={9}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', alignItems: { xs: 'center', md: 'flex-start' }, height: '100%' }}>
                                    <Typography sx={{
                                      color: 'white',
                                      fontFamily: '"Anton", sans-serif !important',
                                      fontSize: { xs: '28px', sm: '32px', md: '36px' },
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      fontWeight: 'semi-bold',
                                      lineHeight: 1.3,
                                      letterSpacing: '1px',
                                      textTransform: 'uppercase',
                                      textAlign: { xs: 'center', md: 'left' },
                                      width: '100%'
                                    }}>
                                      {seasonLabel}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Image src={faceicon} alt="Players" width={16} height={16} style={{ flexShrink: 0 }} />
                                      <Typography sx={{
                                        color: 'rgba(255,255,255,0.9)',
                                        fontFamily: '"League Spartan", sans-serif',
                                        fontWeight: 300,
                                        fontSize: { xs: '10px', sm: '16px' }
                                      }}>
                                        Players: {seasonPlayersCount}
                                      </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Image src={schedule} alt="Created" width={16} height={16} style={{ flexShrink: 0 }} />
                                      <Typography sx={{
                                        color: 'rgba(255,255,255,0.9)',
                                        fontFamily: '"League Spartan", sans-serif',
                                        fontWeight: 300,
                                        fontSize: { xs: '10px', sm: '16px' }
                                      }}>
                                        Created At {new Date(seasonCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Grid container spacing={0} alignItems="center">
                                <Grid item xs={12} md={8}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, mt: { xs: 0.5, md: 0 }, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Image src={fotbal} alt="Matches" width={18} height={18} style={{ flexShrink: 0 }} />
                                      <Typography sx={{
                                        color: 'rgba(255,255,255,0.9)',
                                        fontFamily: '"League Spartan", sans-serif',
                                        fontWeight: 300,
                                        fontSize: { xs: '10px', sm: '16px' }
                                      }}>
                                        Matches: {seasonMatches}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                  <Grid container spacing={{ xs: 1, md: 2 }} mt={{ xs: 0.5, md: 0 }} alignItems="center">
                                    <Grid item xs={6} md={6}>
                                      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-start' }, alignItems: 'center', height: '100%', ml: { xs: 0, md: -5 } }}>
                                        <Image
                                          src={playerfull}
                                          alt="Archived"
                                          width={70}
                                          height={70}
                                          style={{ flexShrink: 0, width: 'clamp(50px, 12vw, 70px)', height: 'clamp(50px, 12vw, 70px)' }}
                                        />
                                      </Box>
                                    </Grid>

                                    <Grid item xs={6} md={6}>
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: '100%', mt: { xs: 1, md: 0 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography sx={{ color: 'white', fontFamily: '"League Spartan", sans-serif', fontWeight: 'semi-bold', fontSize: { xs: '22px', md: '22px' } }}>
                                            Archived
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Dialog
          open={seasonConfirmOpen}
          onClose={closeCreateSeasonConfirm}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              bgcolor: 'rgba(15,15,15,0.96)',
              color: '#E5E7EB',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.08)',
            },
          }}
        >
          <DialogTitle sx={{ color: '#E5E7EB', fontWeight: 700 }}>
            Create New Season
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#9CA3AF' }}>
              Do you want to create a new season?
            </Typography>
            <Typography sx={{ color: '#D1D5DB', mt: 1.5, fontSize: '0.9rem' }}>
              Note: Players from the previous season will be moved to the new season, and after creation you will be taken to the new season league table.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button onClick={closeCreateSeasonConfirm} sx={{ color: '#E5E7EB' }}>
              No
            </Button>
            <Button
              variant="contained"
              onClick={confirmCreateSeason}
              disabled={
                !!pendingSeasonLeague && creatingSeasonLeagueId === String(pendingSeasonLeague.id)
              }
              sx={{
                bgcolor: '#27ab83',
                '&:hover': { bgcolor: '#1e8463' },
              }}
            >
              {!!pendingSeasonLeague && creatingSeasonLeagueId === String(pendingSeasonLeague.id)
                ? 'Creating...'
                : 'Yes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create League Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          fullScreen={isMobileCreateDialog}
          scroll="paper"
          PaperProps={{
            sx: {
              borderRadius: isMobileCreateDialog ? 0 : { xs: 2, sm: 3 },
              background: 'rgba(15,15,15,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)',
              p: { xs: 1.2, sm: 1.6 },
              color: '#E5E7EB',
              width: { xs: '100%', sm: '100%' },
              m: { xs: 0, sm: 2 },
              maxWidth: 620,
              maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 64px)' },
            },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            p={1}
            sx={{
              position: 'relative',
              pr: 6,
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -2,
                height: '2px',
                background: 'linear-gradient(90deg, rgba(229,106,22,0.75), rgba(207,35,38,0.75))',
              }
            }}
          >
            <DialogTitle sx={{ p: 0, fontWeight: 700, color: '#E5E7EB', fontSize: { xs: 19, sm: 22 }, letterSpacing: 0.5 }}>
              Create a League
            </DialogTitle>
            <IconButton
              onClick={() => setIsDialogOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#E5E7EB',
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
              }}
            >
              <X />
            </IconButton>
          </Box>
          <DialogContent sx={{ pt: 2.2, px: { xs: 1.2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
            <TextField
              autoFocus
              margin="dense"
              label="League Name"
              type="text"
              fullWidth
              variant="outlined"
              value={leagueName}
              onChange={(e) => {
                const raw = e.target.value;
                const hasInvalid = /[^A-Za-z0-9 ]/.test(raw);
                const sanitized = raw.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 30);
                setLeagueName(sanitized);
                setLeagueNameError(hasInvalid ? 'Only letters, numbers, and spaces are allowed.' : '');
              }}
              onKeyPress={(e) => {
                const ch = e.key;
                if (ch.length === 1 && /[^A-Za-z0-9 ]/.test(ch)) {
                  e.preventDefault();
                  setLeagueNameError('Only letters, numbers, and spaces are allowed.');
                  return;
                }
                if (e.key === 'Enter') {
                  if (!leagueNameError && leagueName.trim().length > 0) handleCreateLeague();
                }
              }}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                const text = e.clipboardData.getData('text');
                if (/[^A-Za-z0-9 ]/.test(text)) {
                  e.preventDefault();
                  setLeagueNameError('Only letters, numbers, and spaces are allowed.');
                }
              }}
              onContextMenu={() => {
                // Optionally prevent right-click paste of invalid characters in this field
                // To disable context menu, handle event here and call preventDefault()
              }}
              sx={{
                mt: 1,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.04)',
                  color: '#E5E7EB',
                  borderRadius: 2,
                  border: '1.5px solid rgba(255,255,255,0.16)',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.18)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(229,106,22,0.9)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#E56A16',
                  },
                  '& input': {
                    color: '#E5E7EB',
                  },
                },
                '& label': { color: '#9CA3AF' },
                '& .MuiInputLabel-root': { color: '#9CA3AF' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
              }}
              inputProps={{ maxLength: 30, 'aria-invalid': Boolean(leagueNameError) }}
              InputLabelProps={{ sx: { color: '#9CA3AF' } }}
              FormHelperTextProps={{ sx: { color: '#9CA3AF', '&.Mui-error': { color: '#f87171' } } }}
              error={Boolean(leagueNameError)}
              helperText={leagueNameError || 'Use letters, numbers, and spaces only (max 30).'}
            />

            {/* Number of Games in Season */}
            <TextField
              margin="dense"
              label="Number of Games"
              type="number"
              fullWidth
              variant="outlined"
              value={maxGames}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                setMaxGames(v);
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key) && e.key !== 'Enter') {
                  e.preventDefault();
                }
                if (e.key === 'Enter' && !leagueNameError && leagueName.trim().length > 0) {
                  handleCreateLeague();
                }
              }}
              sx={{
                mt: 1,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.04)',
                  color: '#E5E7EB',
                  borderRadius: 2,
                  border: '1.5px solid rgba(255,255,255,0.16)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                  '&:hover fieldset': { borderColor: 'rgba(229,106,22,0.9)' },
                  '&.Mui-focused fieldset': { borderColor: '#E56A16' },
                  '& input': { color: '#E5E7EB' },
                },
                '& label': { color: '#9CA3AF' },
                '& .MuiInputLabel-root': { color: '#9CA3AF' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#E5E7EB' },
              }}
              inputProps={{ min: 1, max: 100 }}
              InputLabelProps={{ sx: { color: '#9CA3AF' } }}
              FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
              helperText="Number of games to be played in the current season (1-100)."
            />

            {/* League Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#E5E7EB', mb: 1, fontWeight: 700 }}>
                League Image (Optional)
              </Typography>

              {/* Image Preview */}
              <Box sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 2,
                p: 2,
                border: '1.5px dashed rgba(229,106,22,0.8)',
                borderRadius: 2,
                background: 'rgba(255,255,255,0.03)',
                minHeight: 80
              }}>
                <Avatar
                  src={imagePreview || '/assets/league.png'}
                  alt="League Image"
                  sx={{
                    width: 60,
                    height: 60,
                    border: '2px solid rgba(229,106,22,0.85)',
                    background: '#1f1f1f'
                  }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#E5E7EB', mb: 0.5 }}>
                    {imagePreview ? 'Selected Image' : 'Default Flag Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                    {imagePreview
                      ? `Click to change or remove (Max ${LEAGUE_IMAGE_MAX_SIZE_MB}MB)`
                      : `Upload a custom image for your league (Max ${LEAGUE_IMAGE_MAX_SIZE_MB}MB)`}
                  </Typography>
                </Box>
              </Box>

              {/* Upload Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    color: '#E56A16',
                    borderColor: '#E56A16',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 'bold',
                    '&:hover': {
                      borderColor: '#CF2326',
                      backgroundColor: 'rgba(229,106,22,0.08)'
                    },
                  }}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    onClick={(e) => { try { (e.target as HTMLInputElement).value = ''; } catch { } }}
                  />
                </Button>

                {imagePreview && (
                  <Button
                    variant="outlined"
                    onClick={handleRemoveImage}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      color: '#ff6b6b',
                      borderColor: '#ff6b6b',
                      borderRadius: 2,
                      px: 2,
                      fontWeight: 'bold',
                      '&:hover': {
                        borderColor: '#ff5252',
                        backgroundColor: 'rgba(255,107,107,0.1)'
                      },
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              px: { xs: 2, sm: 3 },
              pb: 2,
              pt: 0.5,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1,
              '& > *': { m: '0 !important', width: { xs: '100%', sm: 'auto' } },
            }}
          >
            <Button
              onClick={handleCreateLeague}
              variant="contained"
              disabled={isCreating || !leagueName.trim()}
              sx={{
                background: 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
                px: 3,
                boxShadow: '0 4px 12px rgba(229,106,22,0.25)',
                '&:hover': { background: 'linear-gradient(177deg,rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)' },
              }}
            >
              {isCreating ? 'Creating...' : 'Create League'}
            </Button>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outlined"
              sx={{
                color: '#E5E7EB',
                border: '1.5px solid rgba(229,106,22,0.7)',
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'rgba(229,106,22,0.1)', borderColor: '#E56A16' },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Toaster position="top-center" reverseOrder={false} />
      {openAdminSettings && adminSettingsLeague && (
        // <LeagueSettingsDialog
        //   open={openAdminSettings}
        //   onClose={() => setOpenAdminSettings(false)}
        //   league={adminSettingsLeague}
        //   onUpdate={async (data) => {
        //     await handleUpdateLeagueFromSettings(data)
        //     setOpenAdminSettings(false)
        //   }}
        //   onDelete={async () => {
        //     await handleDeleteLeagueFromSettings()
        //     setOpenAdminSettings(false)
        //   }}
        //   currentUserId={user?.id || ''}
        //   onRemoveMember={handleRemoveMember}
        //   onLeaveLeague={handleLeaveLeague}
        // />
        <LeagueSettingsDialog
          open={openAdminSettings}
          onClose={() => setOpenAdminSettings(false)}
          league={adminSettingsLeague}
          onUpdate={async (data) => {
            await handleUpdateLeagueFromAdminSettings(data);
            setOpenAdminSettings(false);
          }}
          onDelete={async () => {
            await handleDeleteLeagueFromAdminSettings();
            // dialog is closed in the handler too; this is safe
            setOpenAdminSettings(false);
          }}
          currentUserId={user?.id || ''}
          onMembersChanged={fetchAllLeagues}
          onRemoveMember={async (memberId: string) => {
            try {
              const lid = adminSettingsLeague?.id || selectedLeague?.id;
              if (!lid || !token) return;
              const result = await removeMemberFromLeague(lid, memberId);
              if (!result.ok) {
                throw new Error(result.message || 'Failed to remove member');
              }

              // Optimistically update dialog/local states for instant UI feedback
              try {
                // Update the admin settings dialog league
                setAdminSettingsLeague(prev => prev ? {
                  ...prev,
                  members: (prev.members || []).filter(m => String(m.id) !== String(memberId)),
                  administrators: (prev.administrators || []).filter(a => String(a.id) !== String(memberId)),
                } : prev);

                // If selectedLeague is the same league, update it too
                setSelectedLeague(prev => (prev && String(prev.id) === String(lid)) ? {
                  ...prev,
                  members: (prev.members || []).filter(m => String(m.id) !== String(memberId)),
                  administrators: (prev.administrators || []).filter(a => String(a.id) !== String(memberId)),
                } : prev);

                // Update the leagues list if it contains members/admins
                setLeagues(prev => prev.map(l => String(l.id) === String(lid) ? {
                  ...l,
                  members: Array.isArray(l.members) ? l.members.filter(m => String(m.id) !== String(memberId)) : l.members,
                  administrators: Array.isArray(l.administrators) ? l.administrators.filter(a => String(a.id) !== String(memberId)) : l.administrators,
                } : l));
              } catch { /* noop */ }

              // Refresh full leagues data to ensure consistency
              await fetchAllLeagues();
              try { toast.success('Member removed'); } catch { }
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to remove member';
              console.error('Remove member failed:', err);
              if (typeof window !== 'undefined') {
                try { toast.error(message); } catch { window.alert(message); }
              }
            }
          }}
          onLeaveLeague={handleLeaveLeague}
          onArchive={handleArchiveLeagueFromAdminSettings}
          onUnarchive={handleUnarchiveLeagueFromAdminSettings}
          onSeasonArchived={handleSeasonArchivedInState}
        />
      )}
      <LeagueMembersDialog
        open={openMembers}
        onClose={() => setOpenMembers(false)}
        league={selectedLeague}
        currentUserId={user?.id || ''}
        onMembersChanged={fetchAllLeagues}
        onRemoveMember={handleRemoveMember}
        onLeaveLeague={handleLeaveLeague}
        onLeaveSeason={handleLeaveActiveSeason}
        onUpdateLeague={handleUpdateLeagueFromSettings}
        onDeleteLeague={handleDeleteLeagueFromSettings}
        openSettingsOnOpen={Boolean(selectedLeague && (selectedLeague.adminId || selectedLeague.administrators?.[0]?.id) === (user?.id || ''))}
        onArchiveLeague={handleArchiveLeagueFromSettings}
        onUnarchiveLeague={handleUnarchiveLeagueFromSettings}
        onSeasonArchived={handleSeasonArchivedInState}
      />
    </Box>
  )
}

export default AllLeagues;
