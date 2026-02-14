'use client';
import { useAuth } from '@/lib/hooks';
import dynamic from 'next/dynamic';
import { AdminPanelSettings, Close, Delete, ExitToApp, People, X, CloudUpload, CheckCircle, Search } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography, Container, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, useTheme, useMediaQuery, Fade, Chip, CircularProgress, MenuItem, InputAdornment, FormControl, Select, RadioGroup, Radio, Switch, FormControlLabel, Grid } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';
import trofy from '@/Components/images/trofy.png';
import faceicon from '@/Components/images/faceicon.png';
import schedule from '@/Components/images/schedule.png';
import inviteicon from '@/Components/images/inviteicon.png';
import fotbal from '@/Components/images/fotbal.png';
import playerfull from '@/Components/images/playerfull.png';
import share from '@/Components/images/share.png';
import play from '@/Components/images/play .png';
import setting from '@/Components/images/setting.png';
import ShirtImg from '@/Components/images/shirtimg.png';
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
  locked?: boolean;
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

  const normalized: League = {
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


interface LeagueMembersDialogProps {
  open: boolean
  onClose: () => void
  league: League | null
  currentUserId: string
  onRemoveMember: (memberId: string) => void
  onLeaveLeague: () => void
  onUpdateLeague: (data: LeagueUpdatePayload) => Promise<void> | void
  onDeleteLeague: () => Promise<void> | void
  openSettingsOnOpen?: boolean
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
  onUpdateLeague,
  onDeleteLeague,
  openSettingsOnOpen,
}: LeagueMembersDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [openSettings, setOpenSettings] = useState(false)
  useEffect(() => {
    if (open && openSettingsOnOpen && league && league.adminId === currentUserId) {
      setOpenSettings(true)
    }
  }, [open, openSettingsOnOpen, league, currentUserId])

  if (!league) return null

  const isAdmin = league.adminId === currentUserId
  const memberCount = league.members?.length || 0

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
          onRemoveMember={onRemoveMember}
          onLeaveLeague={onLeaveLeague}
        />
      )}
    </Dialog>
  )
}

// Payload type for updating league settings
type LeagueUpdatePayload = {
  name: string
  active: boolean
  maxGames: number
  showPoints: boolean
  admins: string[]
}

interface LeagueSettingsDialogProps {
  open: boolean
  onClose: () => void
  league: League
  onUpdate: (data: LeagueUpdatePayload) => void | Promise<void>
  onDelete: () => void | Promise<void>
  currentUserId: string
  onRemoveMember: (memberId: string) => void | Promise<void>
  onLeaveLeague?: () => void | Promise<void>
  onMembersChanged?: () => void | Promise<void>;
}

function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete, currentUserId, onRemoveMember, onLeaveLeague, onMembersChanged }: LeagueSettingsDialogProps) {
  const [name, setName] = useState('')
  const [adminId, setAdminId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [maxGames, setMaxGames] = useState(20)
  const [showPoints, setShowPoints] = useState(true)

  useEffect(() => {
    if (league) {
      setName(league.name || '')
      setIsActive(league.active !== false)
      setMaxGames(league.maxGames || 20)
      setShowPoints(league.showPoints !== false)
      // Prefer explicit adminId, fall back to first administrator if present
      setAdminId(league.adminId || league.administrators?.[0]?.id || '')
    }
  }, [league])

  const handleUpdate = () => {
    const updatedData: LeagueUpdatePayload = {
      name,
      active: isActive,
      maxGames,
      showPoints,
      admins: adminId ? [adminId] : [],
    }
    onUpdate(updatedData)
  }

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

  // Sort members: Admins first, then current user, then by name
  const sortedMembers = React.useMemo(() => {
    const list = Array.isArray(league?.members) ? [...league.members] : [] as User[];
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
  }, [league?.members, currentUserId]);

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
          maxGames,
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
      PaperProps={{
        sx: {
          bgcolor: 'rgba(15,15,15,0.92)',
          color: '#E5E7EB',
          borderRadius: 3,
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
              <FormControl fullWidth>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  Select league admin
                </Typography>
                <Select
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value as string)}
                  sx={{
                    color: '#E5E7EB',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0388E3' },
                    '& .MuiSelect-icon': { color: '#E5E7EB' },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { bgcolor: 'rgba(15,15,15,0.98)', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.08)' },
                    },
                  }}
                >
                  {sortedMembers.map((member: User) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </MenuItem>
                  ))}
                </Select>
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
                    const cleaned = raw.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 20)
                    setName(cleaned)
                  }}
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
                  inputProps={{ maxLength: 20 }}
                  helperText="Max 20 characters, letters/numbers only"
                />
              </FormControl>

              <FormControl component="fieldset">
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  Change league active status
                </Typography>
                <RadioGroup row value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}>
                  <FormControlLabel
                    value="active"
                    control={<Radio sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: '#27ab83' } }} />}
                    label="Active"
                  />
                  <FormControlLabel
                    value="inactive"
                    control={<Radio sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: '#27ab83' } }} />}
                    label="Inactive"
                  />
                </RadioGroup>
              </FormControl>

              <FormControl fullWidth>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
                  Maximum number of matches
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={maxGames}
                  onChange={(e) => setMaxGames(Number(e.target.value))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#E5E7EB',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                      '&.Mui-focused fieldset': { borderColor: '#0388E3' },
                    },
                    '& .MuiInputBase-input': { color: '#E5E7EB' },
                  }}
                />
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={showPoints}
                    onChange={(e) => setShowPoints(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' },
                      '& .Mui-checked': { color: '#27ab83' },
                      '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#27ab83' },
                    }}
                  />
                }
                label="CF Advance Point Scoring"
                sx={{ color: '#E5E7EB' }}
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
                {sortedMembers.map((member: User, index: number) => {
                  const memberName = `${member.firstName} ${member.lastName}`.trim()
                  const isLeagueAdmin = isUserLeagueAdmin(member.id)
                  const isCurrentUser = member.id === currentUserId
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
                          <Avatar sx={{ bgcolor: '#374151' }}>
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
                      {index < (sortedMembers?.length || 0) - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)', mx: 2 }} />
                      )}
                    </Box>
                  )
                })}
              </List>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {currentUserId && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                const isAdmin = !!(league && league.adminId === currentUserId)
                const confirmMsg = isAdmin
                  ? 'You are the league admin. Leaving will transfer admin to another member. Continue?'
                  : 'Are you sure you want to leave this league?'
                if (!window.confirm(confirmMsg)) return

                if (isAdmin) {
                  // Prefer selected admin if different, otherwise first other member
                  let replacementId = adminId && adminId !== currentUserId ? adminId : ''
                  if (!replacementId) {
                    const firstOther = ((league?.members || []) as User[]).find(m => m.id !== currentUserId)
                    if (firstOther) replacementId = firstOther.id
                  }
                  if (!replacementId) {
                    window.alert('Cannot leave as admin because no other members are available to assign as admin.')
                    return
                  }
                  try {
                    onUpdate({
                      name,
                      active: isActive,
                      maxGames,
                      showPoints,
                      admins: [replacementId],
                    })
                  } catch { }
                }

                // Trigger leave action if provided
                if (typeof onLeaveLeague === 'function') {
                  try { onLeaveLeague() } catch { }
                }
                try { onClose() } catch { }
              }}
              sx={{ borderColor: 'rgba(229,106,22,0.6)', color: '#e56a16', '&:hover': { borderColor: '#e56a16', bgcolor: 'rgba(229,106,22,0.08)' } }}
            >
              Leave League
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: '#27ab83', '&:hover': { bgcolor: '#1e8463' } }}>
            Update League
          </Button>
          <Button variant="contained" color="error" onClick={onDelete}>
            Delete League
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
function AllLeagues() {
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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [completionTab, setCompletionTab] = useState<'completed' | 'uncompleted'>('uncompleted');
  // Persist preferred league selection across app
  const PREFERRED_LEAGUE_KEY = 'preferredLeagueId';

  // Fixed continuous list of years from 2000 up to current year + a few future years (calendar-like)
  const yearOptions = useMemo(() => {
    const START_YEAR = 2000;
    const YEARS_AHEAD = 5; // include next 5 years
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + YEARS_AHEAD;
    const range: string[] = [];
    for (let y = maxYear; y >= START_YEAR; y--) {
      range.push(String(y));
    }
    return range;
  }, []);

  // A league is considered completed ONLY if completed matches >= maxGames (when maxGames > 0)
  const isLeagueCompleted = (l: LeagueWithStatus): boolean => {
    const max = typeof l.maxGames === 'number' ? l.maxGames : 0;
    if (max <= 0) return false; // without a target, don't show as completed

    const matches: Match[] = Array.isArray(l.matches) ? l.matches : [];
    const completedCount = matches.reduce((acc, m) => {
      const status = typeof m.status === 'string' ? m.status.toLowerCase() : '';
      const endedByStatus = status === 'completed' || status === 'finished' || status === 'ended';
      const endedByFlag = m.active === false;
      const endedByEnd = Boolean(m.end);
      return acc + (endedByStatus || endedByFlag || endedByEnd ? 1 : 0);
    }, 0);

    return completedCount >= max;
  };

  // Apply filters: by completion tab, by year (createdAt) and by league name
  const filteredLeagues = useMemo(() => {
    const base = leagues.filter(l => completionTab === 'completed' ? isLeagueCompleted(l) : !isLeagueCompleted(l));
    const byYear = selectedYear === 'all'
      ? base
      : base.filter(l => {
        const t = Date.parse(l.createdAt || '');
        if (!Number.isFinite(t)) return false;
        const y = new Date(t).getFullYear();
        return String(y) === selectedYear;
      });

    const term = searchTerm.trim().toLowerCase();
    if (!term) return byYear;
    return byYear.filter(l => (l.name || '').toLowerCase().includes(term));
  }, [leagues, selectedYear, searchTerm, completionTab]);

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsJoining(true);
    try {
      const payload: unknown = await dispatch(joinLeague(inviteCode.trim())).unwrap();
      const joined = normalizeLeagueFromPayload(payload);

      if (joined) {
        // Save joined league as preferred immediately
        try { if (typeof window !== 'undefined') localStorage.setItem(PREFERRED_LEAGUE_KEY, String(joined.id)); } catch {}
        // Update local state with new league at the TOP
        setLeagues(prev => {
          const filtered = prev.filter(l => l.id !== joined.id);
          const enriched: LeagueWithStatus = { ...joined };
          return sortLeaguesByRecency([enriched, ...filtered]);
        });
        console.log('Joined league successfully:', joined.name);
      } else {
        console.log('Join succeeded but payload missing league');
      }

      toast.success('Successfully joined the league!');
      setInviteCode('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join league';
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
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
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status?bust=${ts}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.success && authData.user) {
          // Combine joined and managed leagues
          const userLeagues: League[] = [
            ...(authData.user.leagues || []),
            ...(authData.user.administeredLeagues || [])
          ].filter((league: League) => league && league.id);

          // Remove duplicates
          const uniqueLeagues: League[] = Array.from(new Map(userLeagues.map((league: League) => [league.id, league])).values());

          // Now fetch detailed information for each league
          const detailedLeagues: Array<LeagueWithStatus | null> = await Promise.all(
            uniqueLeagues.map(async (league: League): Promise<LeagueWithStatus | null> => {
              try {
                const bust = Date.now();
                // NOTE: Removed 'Cache-Control' and 'Pragma' custom request headers to avoid CORS preflight rejection
                // Server must explicitly allow any non-simple headers in Access-Control-Allow-Headers; removing fixes the error you saw.
                const [leagueResponse, statusResponse] = await Promise.all([
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}?bust=${bust}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  }),
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/status?bust=${bust}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                ]);

                let enriched: LeagueWithStatus = { ...league };

                // If access is forbidden now, drop this league from the list
                if (leagueResponse.status === 403 || statusResponse.status === 403) {
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
                  }
                }

                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  if (statusData.success) {
                    enriched = {
                      ...enriched,
                      computedStatus: statusData.status as LeagueStatus,
                      isLocked: enriched.isLocked ?? false,
                    };
                  }
                }

                return enriched;
              } catch (error) {
                console.warn(`Failed to fetch details/status for league ${league.id}:`, error);
                return { ...league } as LeagueWithStatus;
              }
            })
          );

          setLeagues(sortLeaguesByRecency(detailedLeagues.filter(Boolean) as LeagueWithStatus[]));
          console.log('Setting detailed leagues:', detailedLeagues);
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
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllLeagues();
    }
  }, [token, fetchAllLeagues]);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error('Please enter a league name');
      return;
    }
    setIsCreating(true);
    try {
      console.log('Creating league:', leagueName.trim());
      const formData = new FormData();
      formData.append('name', leagueName.trim());
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
          try { if (typeof window !== 'undefined') localStorage.setItem(PREFERRED_LEAGUE_KEY, String(normalized.id)); } catch {}

          // Add new league at TOP
          setLeagues(prevLeagues => {
            const filtered = prevLeagues.filter(l => l.id !== normalized.id);
            const enriched: LeagueWithStatus = { ...normalized };
            return sortLeaguesByRecency([enriched, ...filtered]);
          });
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
        setLeagues(prev => prev.filter(l => l.id !== league.id));
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

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLeague) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/users/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // If current user was removed, refresh the entire leagues list
        if (memberId === user?.id) {
          setOpenMembers(false);
          await fetchAllLeagues();
        } else {
          // Optimistic local update for instant UI feedback
          setLeagues(prev => prev.map(l => l.id === selectedLeague.id ? {
            ...l,
            members: Array.isArray(l.members) ? l.members.filter(m => m.id !== memberId) : l.members,
            administrators: Array.isArray(l.administrators) ? l.administrators.filter(a => a.id !== memberId) : l.administrators,
            updatedAt: new Date().toISOString(),
          } : l));
          setSelectedLeague(prev => prev ? {
            ...prev,
            members: Array.isArray(prev.members) ? prev.members.filter(m => m.id !== memberId) : prev.members,
            administrators: Array.isArray(prev.administrators) ? prev.administrators.filter(a => a.id !== memberId) : prev.administrators,
            updatedAt: new Date().toISOString(),
          } : prev);
          try {
            window.dispatchEvent(new CustomEvent('league-updated', { detail: { leagueId: selectedLeague.id, reason: 'member-removed' } }));
          } catch {}
          // Background refresh to ensure consistency (no-cache bust)
          await handleOpenMembers(selectedLeague);
          try { toast.success('Member removed'); } catch {}
        }
      } else {
        toast.error('Failed to remove member');
      }
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveLeague = async () => {
    if (!selectedLeague) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setOpenMembers(false);
        await fetchAllLeagues();
        toast.success('Successfully left the league');
      } else {
        toast.error('Failed to leave league');
      }
    } catch {
      toast.error('Failed to leave league');
    }
  };

  // Admin: settings update/delete handlers for LeagueMembersDialog
  const handleUpdateLeagueFromSettings = useCallback(async (data: LeagueUpdatePayload) => {
    if (!selectedLeague) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}`, {
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
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to update league');
      }

      toast.success('League updated');
      // Update local list optimistically
      setLeagues(prev => prev.map(l => l.id === selectedLeague.id ? {
        ...l,
        name: data.name ?? l.name,
        active: data.active ?? l.active,
        maxGames: data.maxGames ?? l.maxGames,
        showPoints: data.showPoints ?? l.showPoints,
        administrators: data.admins && data.admins.length > 0
          ? (l.members || []).filter(m => data.admins!.includes(m.id))
          : l.administrators,
        updatedAt: new Date().toISOString(),
      } : l));

      // Also refresh the selectedLeague details to reflect new admin etc.
      setSelectedLeague(prev => prev ? {
        ...prev,
        name: data.name ?? prev.name,
        active: data.active ?? prev.active,
        maxGames: data.maxGames ?? prev.maxGames,
        showPoints: data.showPoints ?? prev.showPoints,
        administrators: data.admins && data.admins.length > 0
          ? (prev.members || []).filter(m => data.admins!.includes(m.id))
          : prev.administrators,
        updatedAt: new Date().toISOString(),
      } : prev);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update league';
      toast.error(msg);
    }
  }, [selectedLeague, token]);

  const handleDeleteLeagueFromSettings = useCallback(async () => {
    if (!selectedLeague) return;
    if (!window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete league');
      toast.success('League deleted');
      // Remove from local state
      setLeagues(prev => prev.filter(l => l.id !== selectedLeague.id));
      setOpenMembers(false);
      setSelectedLeague(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete league';
      toast.error(msg);
    }
  }, [selectedLeague, token]);

  // Admin Settings dialog: update/delete handlers that operate on adminSettingsLeague
  const handleUpdateLeagueFromAdminSettings = useCallback(async (data: LeagueUpdatePayload) => {
    if (!adminSettingsLeague) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${adminSettingsLeague.id}`, {
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
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to update league');
      }

      toast.success('League updated');

      // Update leagues list optimistically
      setLeagues(prev => prev.map(l => l.id === adminSettingsLeague.id ? {
        ...l,
        name: data.name ?? l.name,
        active: data.active ?? l.active,
        maxGames: data.maxGames ?? l.maxGames,
        showPoints: data.showPoints ?? l.showPoints,
        administrators: data.admins && data.admins.length > 0
          ? (l.members || []).filter(m => data.admins!.includes(m.id))
          : l.administrators,
        updatedAt: new Date().toISOString(),
      } : l));

      // Update adminSettingsLeague details
      setAdminSettingsLeague(prev => prev ? {
        ...prev,
        name: data.name ?? prev.name,
        active: data.active ?? prev.active,
        maxGames: data.maxGames ?? prev.maxGames,
        showPoints: data.showPoints ?? prev.showPoints,
        administrators: data.admins && data.admins.length > 0
          ? (prev.members || []).filter(m => data.admins!.includes(m.id))
          : prev.administrators,
        updatedAt: new Date().toISOString(),
      } : prev);

      // If currently selectedLeague matches, keep it in sync as well
      setSelectedLeague(prev => (prev && prev.id === adminSettingsLeague.id) ? {
        ...prev,
        name: data.name ?? prev.name,
        active: data.active ?? prev.active,
        maxGames: data.maxGames ?? prev.maxGames,
        showPoints: data.showPoints ?? prev.showPoints,
        administrators: data.admins && data.admins.length > 0
          ? (prev.members || []).filter(m => data.admins!.includes(m.id))
          : prev.administrators,
        updatedAt: new Date().toISOString(),
      } : prev);

      // Optional: refresh full data for consistency
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update league';
      toast.error(msg);
    }
  }, [adminSettingsLeague, token, fetchAllLeagues]);

  const handleDeleteLeagueFromAdminSettings = useCallback(async () => {
    if (!adminSettingsLeague) return;
    if (!window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${adminSettingsLeague.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete league');
      toast.success('League deleted');
      // Remove from local state
      setLeagues(prev => prev.filter(l => l.id !== adminSettingsLeague.id));
      // Clear dialog/selection states
      setAdminSettingsLeague(null);
      setOpenAdminSettings(false);
      if (selectedLeague && selectedLeague.id === adminSettingsLeague.id) {
        setSelectedLeague(null);
        setOpenMembers(false);
      }
      // Ensure lists are fresh
      await fetchAllLeagues();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete league';
      toast.error(msg);
    }
  }, [adminSettingsLeague, token, selectedLeague, fetchAllLeagues]);
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
        <Box sx={{ mb: { xs: 3, md: 5 }, bgcolor: 'black', p: { xs: 2, md: 3 }, mx: { xs: -2, sm: -3, md: -3 } }}>
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
            MY LEAGUES
          </Typography>
          
          {/* Divider line below heading */}
          <Box sx={{ 
            width: 'calc(100% + 32px)',
            marginLeft: '-16px',
            marginRight: '-16px',
            height: '3px', 
            background: '#e16419',
            mb: { xs: 2, md: 2 },
            '@media (min-width: 900px)': {
              width: 'calc(100% + 48px)',
              marginLeft: '-24px',
              marginRight: '-24px'
            }
          }} />
          
          {/* </Box> */}
          {/* Create/Join League Section */}
          {/* Single unified inline layout */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', px: 14 }}>
            {/* Left side: Create + Invite + Join */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => setIsDialogOpen(true)} sx={{
                bgcolor: '#0388E3', 
                color: 'white', 
                fontFamily: 'Arial, Helvetica, sans-serif', 
                fontWeight: 'semi-bold',
                fontSize: '18px',
                '&:hover': { bgcolor: '#0266b8' }, 
                borderRadius: 1,
                
                px: 2.5,
                textTransform: 'none',
                whiteSpace: 'nowrap'
              }}>+ Create New League</Button>
              
              {/* Grouped Invite Code + Join Button */}
              <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                <TextField 
                  placeholder="Enter invite code" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value)} 
                  size="small"
                  autoComplete="off" 
                  sx={{
                    width: 160,
                    '& .MuiOutlinedInput-root': { 
                      color: '#333', 
                      backgroundColor: 'white', 
                      borderRadius: '4px 0 0 4px',
                      '& input': { padding: '10px 14px' }, 
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.2)', borderRight: 'none' },
                      '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.3)' }, 
                      '&.Mui-focused fieldset': { borderColor: 'rgba(0,0,0,0.4)' }
                    },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(0,0,0,0.4)', opacity: 1, fontSize: '18px' }
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
                    fontSize: '18px',
                    '&:hover': { bgcolor: '#008c7a' },
                    '&:disabled': { bgcolor: '#00A896', opacity: 0.6 },
                    borderRadius: '0 4px 4px 0',
                     
                    px: 1,
                    textTransform: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isJoining ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Join League'}
                </Button>
              </Box>
            </Box>

            {/* Right side: Dropdowns + Clear */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField 
                select 
                value={completionTab} 
                onChange={(e) => setCompletionTab(e.target.value as 'completed' | 'uncompleted')}
                size="small"
                sx={{
                  minWidth: 150,
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
                    PaperProps: {
                      sx: { bgcolor: '#1a1a1a', color: 'white' }
                    }
                  }
                }}
              >
                <MenuItem value="uncompleted">Live Leagues</MenuItem>
                <MenuItem value="completed">Complete Leagues</MenuItem>
              </TextField>
              
              <TextField 
                select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                size="small"
                sx={{
                  minWidth: 130,
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
                    PaperProps: {
                      sx: { bgcolor: '#1a1a1a', color: 'white' }
                    }
                  }
                }}
              >
                <MenuItem value="all">All Years</MenuItem>
                {yearOptions.map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
              </TextField>
              
              <Button 
                variant="outlined" 
                onClick={() => { setSelectedYear('all'); setSearchTerm(''); setCompletionTab('uncompleted'); }} 
                sx={{
                  color: 'white',
                  borderRadius: 6,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderWidth: '3px',
                  px: 2.5, 
                  py: 1,
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

          {/* Complete/Live Leagues Toggle Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 6,
            mt: 3,
            mb: 2
          }}>
            <Typography sx={{ 
              color: completionTab === 'completed' ? 'white' : 'rgba(255,255,255,0.5)',
              fontWeight: completionTab === 'completed' ? 600 : 'normal',
              fontSize: '22px',
              transition: 'all 0.3s ease'
            }}>
              Complete Leagues
            </Typography>
            
            <Box 
              onClick={() => setCompletionTab(completionTab === 'completed' ? 'uncompleted' : 'completed')}
              sx={{ 
                width: 60, 
                height: 30, 
                borderRadius: 15, 
                bgcolor: completionTab === 'uncompleted' ? '#00A896' : 'rgba(255,255,255,0.2)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '3px'
              }}
            >
              <Box sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: 'white',
                position: 'absolute',
                left: completionTab === 'uncompleted' ? '33px' : '3px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </Box>

            <Typography sx={{ 
              color: completionTab === 'uncompleted' ? 'white' : 'rgba(255,255,255,0.5)',
              fontWeight: completionTab === 'uncompleted' ? 600 : 'normal',
              fontSize: '22px',
              transition: 'all 0.3s ease'
            }}>
              Live Leagues
            </Typography>
          </Box>
        </Box>

        {/* Leagues List - Card Format */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, px: { xs: 4, md: 13 } , mb :7}}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: 'rgba(96, 165, 250, 0.8)' }} />
              <Typography sx={{ mt: 2, color: 'white', fontSize: { xs: '14px', md: '16px' } }}>Loading leagues...</Typography>
            </Box>
          ) : leagues.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '18px', md: '24px' } }}>No leagues found</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '14px', md: '16px' } }}>
                Create a new league or join an existing one to get started.
              </Typography>
            </Box>
          ) : filteredLeagues.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '18px', md: '24px' } }}>
                No leagues found for selected filters
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '14px', md: '16px' } }}>
                Try changing the year or search name.
              </Typography>
            </Box>
          ) : (
            filteredLeagues.map((league) => {
              const isCompleted = isLeagueCompleted(league);
              return (
                <Box
                  key={league.id}
                  onClick={() => router.push(`/league/${league.id}`)}
                  sx={{
                    p: { xs: 3, md: 3 },
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    // Default background
                    background: isCompleted
                      ? '#d4d4d4' // light grey for completed
                      : 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                    position: 'relative',
                    minHeight: { xs: '140px', md: '160px' },
                    '&:hover': {
                      backgroundColor: isCompleted ? '#d4d4d4' : 'rgba(30, 58, 138, 1)',
                      transform: isCompleted ? 'none' : 'translateY(-3px)',
                      // boxShadow: '0 12px 30px rgba(30, 58, 138, 0.3)',
                      // border: '2px solid rgba(255,255,255,0.2)'
                    }
                  }}
                >
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
                        top: 18,
                        right: 18,
                        color: 'white',
                        // background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                        // '&:hover': { background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);', },
                        zIndex: 4,
                        pr: 3
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
                        style={{ flexShrink: 0 }} 
                      />
                    </IconButton>
                  )}

                  {/* Grid Layout - 6/6 Split */}
                  <Grid container spacing={2}>
                    {/* Left Column - Trophy, Title, Players, Created */}
                    <Grid item xs={12} md={6}>
                      <Grid container spacing={2}>
                        {/* Trophy Icon - 4 */}
                        <Grid item xs={12} md={3}>
                          <Box sx={{
                            width: { xs: 60, sm: 80, md: 100 },
                            height: { xs: 60, sm: 80, md: 100 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                            bgcolor: 'white',
                            borderRadius: '50%',
                          
                          }}>
                            <Image src={league?.image || trofy} alt={`${league.name} icon`} width={60} height={60} priority style={{ objectFit: 'contain' }} />
                          </Box>
                        </Grid>

                        {/* Title and Details - 8 */}
                        <Grid item xs={12} md={9}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                              textTransform: 'uppercase'
                            }}>
                              {formatLeagueName(league.name)}
                            </Typography>

                            {/* Players */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                            {/* Created */}
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
                      <Grid container spacing={0}>
                        {/* Code and Matches - 8 */}
                        <Grid item xs={12} md={8}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 1.5,
                            mt: { xs: 1, md: 6 },
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
                                  Invite Code:  {league.inviteCode}
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
                                    navigator.clipboard.writeText(league.inviteCode);
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
                                    const shareData = {
                                      title: `Join ${league.name}`,
                                      text: `Join my league with code: ${league.inviteCode}`,
                                    };
                                    if (navigator.share) {
                                      navigator.share(shareData).catch(() => {});
                                    } else {
                                      navigator.clipboard.writeText(`Join ${league.name} with code: ${league.inviteCode}`);
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
                                Matches: {league.matches?.length || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        {/* View Button - 4 */}
                        <Grid item xs={12} md={4}>
                          <Grid container spacing={2} mt={2} >
                            {/* Image - 6 */}
                            <Grid item xs={6} md={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'start', height: '100%', ml: -5 }}>
                                <Image src={playerfull} alt="View" width={70} height={70} style={{ flexShrink: 0 }} />
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
                                  cursor: 'pointer',
                                  mt: 3
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/league/${league.id}`);
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{
                                    color: isCompleted ? '#111827' : 'white',
                                    fontFamily: '"League Spartan", sans-serif',
                                    fontWeight: 'semi-bold',
                                    fontSize: { xs: '22px', md: '22px' }
                                  }}>
                                    View
                                  </Typography>
                                  <Image src={play} alt="Play" width={15} height={15} style={{ flexShrink: 0 }} />
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

        {/* Create League Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: '#2B2B2B',
              border: '1px solid #3A3A3A',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              p: 2,
              color: '#fff',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
            <DialogTitle sx={{ p: 0, fontWeight: 'bold', color: '#fff', fontSize: 22, letterSpacing: 0.5 }}>
              Create a League
            </DialogTitle>
            <IconButton onClick={() => setIsDialogOpen(false)} sx={{ color: '#fff' }}>
              <X />
            </IconButton>
          </Box>
          <DialogContent>
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
                const sanitized = raw.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 20);
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
                  background: '#2B2B2B',
                  color: '#fff',
                  borderRadius: 2,
                  border: '1.5px solid #3A3A3A',
                  '& fieldset': {
                    borderColor: '#E56A16',
                  },
                  '&:hover fieldset': {
                    borderColor: '#CF2326',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#E56A16',
                  },
                  '& input': {
                    color: '#fff',
                  },
                },
                '& label': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
              }}
              inputProps={{ maxLength: 20, 'aria-invalid': Boolean(leagueNameError) }}
              InputLabelProps={{ sx: { color: '#fff' } }}
              FormHelperTextProps={{ sx: { color: '#fff', '&.Mui-error': { color: '#f44336' } } }}
              error={Boolean(leagueNameError)}
              helperText={leagueNameError || 'Use letters, numbers, and spaces only (max 20).'}
            />

            {/* League Image Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
                League Image (Optional)
              </Typography>

              {/* Image Preview */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                border: '2px dashed #E56A16',
                borderRadius: 2,
                background: 'rgba(229,106,22,0.08)',
                minHeight: 80
              }}>
                <Avatar
                  src={imagePreview || '/assets/league.png'}
                  alt="League Image"
                  sx={{
                    width: 60,
                    height: 60,
                    border: '2px solid #E56A16',
                    background: '#2B2B2B'
                  }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 0.5 }}>
                    {imagePreview ? 'Selected Image' : 'Default Flag Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#C7C7C7' }}>
                    {imagePreview ? 'Click to change or remove' : 'Upload a custom image for your league'}
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
          <DialogActions sx={{ px: 3, pb: 2 }}>
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
                color: '#fff',
                border: '1.5px solid #444',
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
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
          onRemoveMember={async (memberId: string) => {
            try {
              const lid = adminSettingsLeague?.id || selectedLeague?.id;
              if (!lid || !token) return;
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${lid}/users/${memberId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (!res.ok) {
                const msg = await res.text().catch(() => '');
                throw new Error(msg || 'Failed to remove member');
              }

              // Optimistically update dialog/local states for instant UI feedback
              try {
                // Update the admin settings dialog league
                setAdminSettingsLeague(prev => prev ? {
                  ...prev,
                  members: (prev.members || []).filter(m => m.id !== memberId),
                  administrators: (prev.administrators || []).filter(a => a.id !== memberId),
                } : prev);

                // If selectedLeague is the same league, update it too
                setSelectedLeague(prev => (prev && prev.id === lid) ? {
                  ...prev,
                  members: (prev.members || []).filter(m => m.id !== memberId),
                  administrators: (prev.administrators || []).filter(a => a.id !== memberId),
                } : prev);

                // Update the leagues list if it contains members/admins
                setLeagues(prev => prev.map(l => l.id === lid ? {
                  ...l,
                  members: Array.isArray(l.members) ? l.members.filter(m => m.id !== memberId) : l.members,
                  administrators: Array.isArray(l.administrators) ? l.administrators.filter(a => a.id !== memberId) : l.administrators,
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

        />
      )}
      <LeagueMembersDialog
        open={openMembers}
        onClose={() => setOpenMembers(false)}
        league={selectedLeague}
        currentUserId={user?.id || ''}
        onRemoveMember={handleRemoveMember}
        onLeaveLeague={handleLeaveLeague}
        onUpdateLeague={handleUpdateLeagueFromSettings}
        onDeleteLeague={handleDeleteLeagueFromSettings}
        openSettingsOnOpen={Boolean(selectedLeague && (selectedLeague.adminId || selectedLeague.administrators?.[0]?.id) === (user?.id || ''))}
      />
    </Box>
  )
}

export default AllLeagues;