'use client';
import { useAuth } from '@/lib/hooks';
import { AdminPanelSettings, Close, Delete, ExitToApp, People, X, CloudUpload, CheckCircle, Search } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography, Container, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, useTheme, useMediaQuery, Fade, Chip, CircularProgress, MenuItem, InputAdornment, FormControl, Select, RadioGroup, Radio, Switch, FormControlLabel } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import leagueIcon from '@/Components/images/league.png';
import ShirtImg from '@/Components/images/shirtimg.png';
import { User, League, Match } from '@/types/user';
import { useDispatch } from 'react-redux';
import { joinLeague } from '@/lib/features/leagueSlice';
import { AppDispatch } from '@/lib/store';
import { cacheManager } from '@/lib/cacheManager';
import Tooltip from '@mui/material/Tooltip';
import Slide, { SlideProps } from '@mui/material/Slide';

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
  return `${capitalizedName} (${initials})`;
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
const timeOf = (l: Pick<League, 'updatedAt' | 'createdAt'> | undefined | null): number => {
  if (!l) return 0;
  const src = (l.updatedAt || l.createdAt || '').trim();
  const t = Date.parse(src);
  return Number.isFinite(t) ? t : 0;
};

const compareLeaguesByRecency = (a: Pick<League, 'updatedAt' | 'createdAt'>, b: Pick<League, 'updatedAt' | 'createdAt'>): number => {
  return timeOf(b) - timeOf(a);
};

const sortLeaguesByRecency = <T extends Pick<League, 'updatedAt' | 'createdAt'>>(arr: T[]): T[] => {
  return [...arr].sort(compareLeaguesByRecency);
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
}: LeagueMembersDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [openSettings, setOpenSettings] = useState(false)

  if (!league) return null

  const isAdmin = league.adminId === currentUserId
  const memberCount = league.members?.length || 0

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the league?`)) {
      onRemoveMember(memberId)
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
                          background:'transparent',
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
                          {member.shirtNumber || '0'}
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
}

function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete }: LeagueSettingsDialogProps) {
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
      setAdminId(league.administrators?.[0]?.id || '')
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

  if (!league) return null

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
              {(league.members || []).map((member: User) => (
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
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: '#27ab83', '&:hover': { bgcolor: '#1e8463' } }}>
          Update League
        </Button>
        <Button variant="contained" color="error" onClick={onDelete}>
          Delete League
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// const cardStyles = {
//   borderRadius: 3,
//   p: { xs: 1.5, md: 3 },
//   color: 'white',
//   background: '#1f673b',
//   border: '1px solid rgba(255,255,255,0.18)',
//   transition: 'transform 0.2s, box-shadow 0.2s',
//   '&:hover': {
//     transform: 'translateY(-4px) scale(1.03)',
//     boxShadow: '0 8px 32px 0 rgba(31,38,135,0.27)',
//   },
//   display: 'flex',
//   flexDirection: 'column',
//   gap: { xs: 1, md: 1 },
//   width: { xs: '100%', md: 'auto' }, // Full width on small screens, auto on large screens for two cards
//   minWidth: { xs: '100%', md: '300px' }, // Minimum width on large screens
//   boxSizing: 'border-box',
// };

// const iconButtonStyles = {
//   position: 'absolute',
//   color: 'white',
//   border: '2px solid white',
//   borderRadius: 2,
//   right: { xs: 0, md: '0' },
//   p: { xs: 0.6, md: 1.2 },
//   '&:hover': {
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
// };

// const buttonStyles = {
//   base: {
//     color: 'white',
//     fontWeight: 'bold',
//     borderRadius: 2,
//     px: { xs: 2, md: 4 },
//     py: { xs: 1, md: 1 },
//     fontSize: { xs: '0.7rem', md: '0.875rem' },
//     textTransform: 'none',
//   },
//   outlined: {
//     bgcolor: '#43a047',
//     borderColor: '#43a047',
//     '&:hover': { bgcolor: '#388e3c', borderColor: '#388e3c' },
//   },
//   contained: {
//     bgcolor: '#43a047',
//     boxShadow: '0 2px 8px rgba(0,200,83,0.12)',
//     '&:hover': { bgcolor: '#388e3c' },
//   },
// };

function AllLeagues() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [leagues, setLeagues] = useState<LeagueWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const router = useRouter();
  const [leagueName, setLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { token, user } = useAuth();
  const [openMembers, setOpenMembers] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [, setLoadingMembers] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [leagueImage, setLeagueImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Cache timeout - 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;

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

  // Apply filters: by year (createdAt) and by league name
  const filteredLeagues = useMemo(() => {
    const byYear = selectedYear === 'all'
      ? leagues
      : leagues.filter(l => {
          const t = Date.parse(l.createdAt || '');
          if (!Number.isFinite(t)) return false;
          const y = new Date(t).getFullYear();
          return String(y) === selectedYear;
        });

    const term = searchTerm.trim().toLowerCase();
    if (!term) return byYear;
    return byYear.filter(l => (l.name || '').toLowerCase().includes(term));
  }, [leagues, selectedYear, searchTerm]);

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
        // Update cache and put new league at the TOP without refetch
        cacheManager.updateLeaguesCache(joined);
        setLeagues(prev => {
          const filtered = prev.filter(l => l.id !== joined.id);
          const enriched: LeagueWithStatus = { ...joined };
          return sortLeaguesByRecency([enriched, ...filtered]);
        });
        console.log('Joined league successfully:', joined.name);
      } else {
        console.log('Join succeeded but payload missing league; keeping current list until next background sync');
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

  const updateLeaguesCacheWithNewLeague = useCallback((newLeague: League) => {
    cacheManager.updateLeaguesCache(newLeague);
  }, []);

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
  };

  // const fetchAllLeagues = useCallback(async (forceRefresh: boolean = false) => {
  //   if (!token) return;

  //   const now = Date.now();
  //   const timeSinceLastFetch = now - lastFetchTime;

  //   // Check if we need to fetch (either forced refresh or cache expired)
  //   if (!forceRefresh && timeSinceLastFetch < CACHE_TIMEOUT && leagues.length > 0) {
  //     console.log('Using cached leagues data');
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     console.log('Fetching all available leagues...');
  //     setLoading(true);
      
  //     // First get the user's leagues from auth/status
  //     const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (authResponse.ok) {
  //       const authData = await authResponse.json();
  //       if (authData.success && authData.user) {
  //         // Combine joined and managed leagues
  //         const userLeagues = [
  //           ...(authData.user.leagues || []),
  //           ...(authData.user.administeredLeagues || [])
  //         ].filter(league => league && league.id); // Filter out undefined/null leagues
          
  //         // Remove duplicates
  //         const uniqueLeagues = Array.from(new Map(userLeagues.map(league => [league.id, league])).values());
          
  //         // Now fetch detailed information for each league
  //         const detailedLeagues = await Promise.all(
  //           uniqueLeagues.map(async (league) => {
  //             try {
  //               const leagueResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
  //                 headers: {
  //                   'Authorization': `Bearer ${token}`
  //                 }
  //               });
                
  //               if (leagueResponse.ok) {
  //                 const leagueData = await leagueResponse.json();
  //                 if (leagueData.success) {
  //                   return {
  //                     ...league,
  //                     members: leagueData.league.members || [],
  //                     matches: leagueData.league.matches || [],
  //                     administrators: leagueData.league.administrators || []
  //                   };
  //                 }
  //               }
  //               // If individual league fetch fails, return the basic league info
  //               return league;
  //             } catch (error) {
  //               console.warn(`Failed to fetch details for league ${league.id}:`, error);
  //               return league;
  //             }
  //           })
  //         );
          
  //         setLeagues(detailedLeagues);
  //         setLastFetchTime(now); // Update last fetch time
  //         console.log('Setting detailed leagues:', detailedLeagues);
  //       }
  //     } else {
  //       console.error('Failed to fetch leagues');
  //       toast.error('Failed to fetch leagues');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching leagues:', error);
  //     toast.error('An error occurred while fetching leagues');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [token, lastFetchTime, leagues.length, CACHE_TIMEOUT]); // Only depend on token

  const fetchAllLeagues = useCallback(async (forceRefresh: boolean = false) => {
    if (!token) return;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    if (!forceRefresh && timeSinceLastFetch < CACHE_TIMEOUT && leagues.length > 0) {
      console.log('Using cached leagues data');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching all available leagues...');
      setLoading(true);
      
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.success && authData.user) {
          const userLeagues: League[] = [
            ...(authData.user.leagues || []),
            ...(authData.user.administeredLeagues || [])
          ].filter((league: League) => league && league.id);

          const uniqueLeagues: League[] = Array.from(new Map(userLeagues.map((league: League) => [league.id, league])).values());
          
          const detailedLeagues: LeagueWithStatus[] = await Promise.all(
            uniqueLeagues.map(async (league: League): Promise<LeagueWithStatus> => {
              try {
                const [leagueResponse, statusResponse] = await Promise.all([
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  }),
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                ]);

                let enriched: LeagueWithStatus = { ...league };

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
                      computedStatus: statusData.status as LeagueStatus,            // { isComplete, totals, missing }
                      isLocked: enriched.isLocked ?? false, // backend may set this flag
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
          
          setLeagues(sortLeaguesByRecency(detailedLeagues));
          setLastFetchTime(now);
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
  }, [token, lastFetchTime, leagues.length, CACHE_TIMEOUT]);
  
  useEffect(() => {
    if (token) {
      fetchAllLeagues(false); // Don't force refresh on mount
    }
  }, [token]); // Remove fetchAllLeagues from dependencies

  // Refresh data when page becomes visible - but only if cache is old
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime;
        
        // Only fetch if cache is older than 2 minutes when page becomes visible
        if (timeSinceLastFetch > 2 * 60 * 1000) {
          fetchAllLeagues(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, lastFetchTime]); // Add lastFetchTime dependency

  // Remove the focus event listener to prevent excessive API calls
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (token) {
  //       fetchAllLeagues();
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   return () => {
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [token]);

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

        // Update the leagues cache with the new league
        if (data.league) {
          // Normalize to match League shape strictly
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

          // Update cache with new league
          updateLeaguesCacheWithNewLeague(normalized);

          // Optimistically put new league at TOP without forcing a refetch
          setLeagues(prevLeagues => {
            const filtered = prevLeagues.filter(l => l.id !== normalized.id);
            const enriched: LeagueWithStatus = { ...normalized };
            return sortLeaguesByRecency([enriched, ...filtered]);
          });
          console.log('Updated cache and local state with new league:', normalized);
        }
        // No forced refetch; list already updated optimistically.
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
            shirtNumber: m.shirtNumber,
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
          await fetchAllLeagues(true); // Force refresh
        } else {
          // Otherwise, just refetch members for this league
          handleOpenMembers(selectedLeague);
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
        await fetchAllLeagues(true); // Force refresh after leaving league
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
        method: 'PUT',
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
  // const handleBackToAllLeagues = () => {
  //   router.push('/home');
  // };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
        fontFamily: '"League Spartan", sans-serif',
        py: 4,
      }}
    >
      <Container maxWidth="lg"> 
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
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography variant="h3" sx={{
            mb: { xs: 3, md: 4 },
            color: 'black',
            // fontFamily: 'Arial Black, Arial, sans-serif',
            fontFamily: '"Anton", sans-serif',
            fontWeight: 'semibold',
            fontSize: { xs: '32px', sm: '42px', md: '56px' },
            textAlign: { xs: 'center', md: 'left' },
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
            className='all-leagues-heading'
          >
            ALL LEAGUES
          </Typography>

          {/* Create/Join League Section */}
          <Box sx={{
            display: 'flex',
            gap: { xs: 2, md: 3 },
            mb: { xs: 3, md: 5 },
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>

            <Box sx={{
              display: 'flex',
              gap: { xs: 1, md: 2 },
              width: { xs: '100%', sm: '1' },
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button
                variant="contained"
                onClick={() => setIsDialogOpen(true)}
                sx={{
                  bgcolor: '#0388E3',
                  color: 'white',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontWeight: 'bold',
                  fontSize: { xs: '14px', sm: '16px', md: '18px' },
                  '&:hover': { bgcolor: '#0388E3' },
                  width: { xs: '100%', sm: 'fit-content' },
                  borderRadius: 2,
                  py: { xs: 1.5, md: 1 },
                  px: { xs: 3, md: 3 },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textTransform: 'none'
                }}
              >
                Create New League
              </Button>
              {/* <TextField
                label="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                sx={{
                  flex: 1,
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiOutlinedInput-root': {
                    color: 'black',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', border: '2px solid green' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)', border: '2px solid green' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.8)', border: '2px solid green' },
                  },
                  '& .MuiInputLabel-root': { color: 'green' },
                  
                }}
              /> */}
              <TextField
                label="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                size="medium"
                autoComplete="off"
                sx={{
                  flex: 1,
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiOutlinedInput-root': {
                    color: 'black',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    padding: '0',
                    '& input': {
                      padding: '13px 12px',
                    },
                    '& fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                    '&:hover fieldset': { borderColor: '#404040', border: '1px solid #404040' },
                    '&.Mui-focused fieldset': { borderColor: '#404040', border: '1px solid #404040' },

                    /* Prevent Chrome autofill yellow background */
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.1) inset',
                      boxShadow: '0 0 0 1000px rgba(255,255,255,0.1) inset',
                      WebkitTextFillColor: 'black',
                      caretColor: 'black',
                      transition: 'background-color 9999s ease-out 0s',
                      backgroundClip: 'content-box !important',
                    },
                  },
                  '& .MuiInputLabel-root': { color: '#8C8C8C' },
                }}
              />
              <Button
                variant="contained"
                onClick={handleJoinLeague}
                disabled={isJoining}
                sx={{
                  // backgroundColor: '#388e3c',
                  background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                  color: 'white',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontWeight: 'bold',
                  fontSize: { xs: '14px', sm: '16px', md: '18px' },
                  '&:hover': { background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);', },
                  '&:disabled': { background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);', },
                  borderRadius: 2,
                  py: { xs: 1.5, md: 1 },
                  px: { xs: 3, md: 3 },
                  width: { xs: '100%', sm: 'fit-content' },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textTransform: 'none'
                }}
              >
                {isJoining ? <CircularProgress size={20} /> : 'Join League'}
              </Button>

              {/* Filters Group: Year + Search + Clear */}
              <Box sx={{
                display: 'flex',
                gap: { xs: 1, sm: 1.5 },
                alignItems: 'center',
                flexWrap: 'wrap',
                width: { xs: '100%', sm: 'auto' },
              }}>
                {/* Year Selector (to the right of Join) */}
                <TextField
                  select
                  label="Year"
                  value={selectedYear}
                  size="medium"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    minWidth: { xs: '100%', sm: 140 },
                    '& .MuiOutlinedInput-root': {
                      color: 'black',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      height: 48,
                      '& .MuiSelect-select': { color: 'black' },
                      '& fieldset': { borderColor: 'black' },
                      '&:hover fieldset': { borderColor: 'black' },
                      '&.Mui-focused fieldset': { borderColor: 'black' },
                    },
                    '& .MuiInputLabel-root': { color: 'black' },
                    '& .MuiSvgIcon-root': { color: 'black' },
                  }}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>

                {/* Search League Name (filters within selected year) */}
                <TextField
                  label="Search league name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="medium"
                  autoComplete="off"
                  sx={{
                    flex: 1,
                    minWidth: { xs: '100%', sm: 220 },
                    '& .MuiOutlinedInput-root': {
                      color: 'black',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 2,
                      height: 48,
                      '& input': { color: 'black' },
                      '& fieldset': { borderColor: 'black' },
                      '&:hover fieldset': { borderColor: 'black' },
                      '&.Mui-focused fieldset': { borderColor: 'black' },
                    },
                    '& .MuiInputLabel-root': { color: 'black' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'black' }} />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Clear Filters */}
                <Button
                  variant="outlined"
                  onClick={() => { setSelectedYear('all'); setSearchTerm(''); }}
                  sx={{
                    color: '#fff',
                    // border: '1.5px solid #444',
                    borderRadius: 2,
                    bgcolor: '#0388E3',
                    px: 2,
                    height: 48,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    '&:hover': {bgcolor: '#0388E3' },
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Leagues List - Card Format */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
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
              const isCompleted = Boolean(league.computedStatus?.isComplete || league.computedStatus?.locked || league.isLocked);
              return (
              <Box
                key={league.id}
                onClick={() => router.push(`/league/${league.id}`)}
                sx={{
                  p: { xs: 3, md: 2 },
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  // Default background
                  background: isCompleted
                    ? '#d4d4d4' // light grey for completed
                    : 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                  position: 'relative',
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
                      top: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      zIndex: 2,
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
                      top: 12,
                      right: 12,
                      color: 'white',
                      background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                      '&:hover': { background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);', },
                      zIndex: 2
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle settings click
                    }}
                  >
                    <SettingsIcon
                      onClick={() => handleOpenMembers(league)}
                      aria-label={`Open settings for ${formatLeagueName(league.name)}`}
                      size={20} />
                  </IconButton>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 4 } }}>
                  {/* League Logo - Green Shield */}
                  <Box sx={{
                    width: { xs: 60, sm: 80, md: 80 },
                    height: { xs: 60, sm: 80, md: 80 },
                    // borderRadius: 2,
                    // overflow: 'hidden',
                    // backgroundColor: '#43a047',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    // border: '2px solid rgba(255,255,255,0.2)',
                    // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    position: 'relative'
                  }}>
                    <Image src={league?.image || leagueIcon} alt={`${league.name} icon`} width={80} height={80} priority />
                  </Box>

                  {/* League Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* League Title */}
                    {/* <Typography sx={{
                      color: 'white',
                      fontFamily: '"League Spartan", sans-serif',
                      // fontWeight: 'bold',
                      fontSize: { xs: '18px', sm: '20px', md: '16px' },
                      mb: 2,
                      background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontWeight:'bold'
                    }}>
                      {formatLeagueName(league.name)}
                    </Typography> */}

                    <Typography sx={{
                      color: isCompleted ? '#111827' : 'white',
                      fontFamily: '"League Spartan", sans-serif',
                      fontSize: { xs: '18px', sm: '20px', md: '20px' },
                      mb: 2,
                      background: isCompleted ? 'transparent' : 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                      display: 'inline-block', // Only background behind text
                      px: 2, // Horizontal padding for extra background
                      borderRadius: 0.8, // Rounded corners
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold'
                    }}>
                      {formatLeagueName(league.name)}
                    </Typography>

                    {/* League Details - Two Column Layout */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      flexDirection: 'row',
                      gap: { xs: 4, sm: 15 }
                    }}>
                      {/* Left Column */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 }, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                          <Box sx={{
                            width: { xs: 12, sm: 16 },
                            height: { xs: 12, sm: 16 },
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: { xs: 8, sm: 10 },
                              height: { xs: 8, sm: 10 },
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: league.computedStatus?.isComplete ? '#111827' : 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '10px', sm: '13px' }
                          }}>
                            Players {league.members?.length || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                          <Box sx={{
                            width: { xs: 12, sm: 16 },
                            height: { xs: 12, sm: 16 },
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: { xs: 8, sm: 10 },
                              height: { xs: 8, sm: 10 },
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '9px', sm: '12px' }
                          }}>
                            Created {new Date(league.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Right Column */}
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 1, sm: 1.5 },
                        alignItems: 'flex-start'
                      }}>
                        {!isCompleted && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                            <Box sx={{
                              width: { xs: 12, sm: 16 },
                              height: { xs: 12, sm: 16 },
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              flexShrink: 0,
                              position: 'relative'
                            }}>
                              <Box sx={{
                                width: { xs: 8, sm: 10 },
                                height: { xs: 8, sm: 10 },
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)'
                              }} />
                            </Box>
                            <Typography sx={{
                              color: 'rgba(255,255,255,0.9)',
                              fontFamily: '"League Spartan", sans-serif',
                              fontWeight: 200,
                              fontSize: { xs: '9px', sm: '12px' }
                            }}>
                              Code: {league.inviteCode}
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
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                              </svg>
                            </IconButton>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                          <Box sx={{
                            width: { xs: 12, sm: 16 },
                            height: { xs: 12, sm: 16 },
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            <Box sx={{
                              width: { xs: 8, sm: 10 },
                              height: { xs: 8, sm: 10 },
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }} />
                          </Box>
                          <Typography sx={{
                            color: isCompleted ? '#111827' : 'rgba(255,255,255,0.9)',
                            fontFamily: '"League Spartan", sans-serif',
                            fontWeight: 200,
                            fontSize: { xs: '10px', sm: '13px' }
                          }}>
                            Matches: {league.matches?.length || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )})
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
                const sanitized = e.target.value.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 20);
                setLeagueName(sanitized);
              }}
              onKeyPress={(e) => {
                const ch = e.key;
                if (ch.length === 1 && /[^A-Za-z0-9 ]/.test(ch)) {
                  e.preventDefault();
                  return;
                }
                if (e.key === 'Enter') {
                  handleCreateLeague();
                }
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
              inputProps={{ maxLength: 20 }}
              InputLabelProps={{ sx: { color: '#fff' } }}
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
      <LeagueMembersDialog
        open={openMembers}
        onClose={() => setOpenMembers(false)}
        league={selectedLeague}
        currentUserId={user?.id || ''}
        onRemoveMember={handleRemoveMember}
        onLeaveLeague={handleLeaveLeague}
        onUpdateLeague={handleUpdateLeagueFromSettings}
        onDeleteLeague={handleDeleteLeagueFromSettings}
      />
    </Box>
  )
}

export default AllLeagues;