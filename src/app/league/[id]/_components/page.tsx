'use client';

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    Divider,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Switch,
    TextField,
    Alert,
    Menu,
    ListItemIcon,
    ListItemText,
    Container,
    List,
    ListItem,
    ListItemAvatar,
    LinearProgress,
    Stack,
    Avatar,
    useTheme,
    useMediaQuery,
    Fade,
} from '@mui/material';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Calendar, Copy, Edit, Settings, Shield, ChevronDown, Trash2, Undo2, Users, Flame } from 'lucide-react';
import { Tooltip, Slide } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Lazy load heavy components
const PlayMatchPagee = dynamic(() => import('@/Components/matchstatsdialog/MatchStatsDialog'), {
  loading: () => <CircularProgress />,
  ssr: false
});
const TrophyRoom = dynamic(() => import('@/Components/TrophyRoom'), {
  loading: () => <CircularProgress />,
  ssr: false
});
const PlayerStatsDialog = dynamic(() => import('@/Components/PlayerStatsDialog'), {
  loading: () => <CircularProgress />,
  ssr: false
});
const TeamPreviewScreen = dynamic(() => import('@/Components/viewteam/viewteam'), {
  loading: () => <CircularProgress />,
  ssr: false
});
const PlayerCard = dynamic(() => import('@/Components/playercard/playercard'), {
  loading: () => <CircularProgress />,
  ssr: false
});
const CloseButton = dynamic(() => import('@/Components/CloseButton'), {
  loading: () => <></>,
  ssr: false
});
import CloseIcon from '@mui/icons-material/Close';
import { useCombinedMatchRefresh } from '@/lib/useMatchAutoRefresh';
import { LeaderboardResponse } from '@/types/api';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ShirtImg from '@/Components/images/shirtimg.png'
import homeImg from '@/Components/images/matches.png'
import awayImg from '@/Components/images/2nd champion icon football.png'
import Goals from "@/Components/images/goal.png"
import Assist from "@/Components/images/Assist.png"
import Cleansheet from "@/Components/images/cleansheet.png"
import Momt from "@/Components/images/MOTM.png"
import { Close, Delete } from '@mui/icons-material';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import ExitToApp from '@mui/icons-material/ExitToApp';
import People from '@mui/icons-material/People';
// import SettingsIcon from '@mui/icons-material/Settings';
import Star from '@mui/icons-material/Star';
// ...existing code...

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

type PlayerStatsMetric = keyof LeaderboardResponse['players'][number];

type LeagueComputedStatus = {
    isComplete?: boolean;
    locked?: boolean;
    matchesPlayed?: number;
    gamesPlayed?: number;
    maxGames?: number;
    totalMatches?: number;
    missing?: Array<unknown>;
    [key: string]: unknown;
};

interface League {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
    members: User[];
    administrators: User[];
    matches: Match[];
    active: boolean;
    maxGames: number;
    showPoints: boolean;
    adminId?: string;
    userRole?: 'ADMIN' | 'MEMBER';
    computedStatus?: LeagueComputedStatus;
    isLocked?: boolean;
    isComplete?: boolean;
    isCompleted?: boolean;
    updatedAt?: string;
    status?: string;
}

interface User {
    xp: number;
    shirtNumber: undefined;
    positionType: undefined;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string | null;
    position?: string;
}

interface Match {
    homeTeamImage: string;
    awayTeamImage: string;
    id: string;
    date: string;
    location: string;
    status: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    availableUsers: User[];
    homeTeamUsers: User[];
    awayTeamUsers: User[];
    end: string;
    start?: string | Date;
    updatedAt?: string | Date;
    createdAt?: string | Date;
    active: boolean;
    archived?: boolean; // <-- NEW
}

interface LeagueSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    league: League | null;
    onUpdate: (data: Partial<League & { admins: string[] }>) => void;
    onDelete: () => void;
    currentUserId?: string;
    onRemoveMember?: (memberId: string) => void;
    onLeaveLeague?: () => void;
    onUpdateLeague?: (data: LeagueUpdatePayload) => Promise<void> | void;
    onDeleteLeague?: () => Promise<void> | void;
}

type LeagueUpdatePayload = {
    name: string
    active: boolean
    maxGames: number
    showPoints: boolean
    admins: string[]
}


type LeagueStatistics = {
    playedMatches: number;
    remaining: number;
    players: number;
    created: string;
    bestPairing: null | {
        ids: [string, string];
        names: [string, string];
        togetherMatches: number;
        togetherWins: number;
        combinedGoals: number;
        combinedAssists: number;
    };
    hottestPlayer: null | {
        playerId: string;
        name: string;
        xpInLast5: number;
        matchesConsidered: number;
    };
};

// Slide Transition for mobile dialogs
const Transition = forwardRef<HTMLDivElement, { children: React.ReactElement }>(
    function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    }
);

// Local helper to format names safely
const formatLeagueName = (name?: string): string => (name ?? '').trim();

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
    }, [open, openSettingsOnOpen, league?.adminId, currentUserId])

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
                        // Coerce Partial<League & {admins: string[]}> into LeagueUpdatePayload
                        const payload: LeagueUpdatePayload = {
                            name: (data.name ?? league.name ?? '').toString(),
                            active: data.active ?? league.active ?? true,
                            maxGames: Number(data.maxGames ?? league.maxGames ?? 20),
                            showPoints: data.showPoints ?? league.showPoints ?? true,
                            admins: Array.isArray((data as { admins?: string[] }).admins)
                                ? ((data as { admins?: string[] }).admins as string[])
                                : (league.adminId ? [league.adminId] : (league.administrators || []).map(a => a.id)),
                        }
                        await onUpdateLeague(payload)
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

// const getBadgeForPosition = (position: number) => {
//     switch (position) {
//         case 1:
//             return <Image src={FirstBadge} alt="First Place" width={20} height={20} />
//         case 2:
//             return <Image src={SecondBadge} alt="Second Place" width={20} height={20} />
//         case 3:
//             return <Image src={ThirdBadge} alt="Third Place" width={20} height={20} />
//         default:
//             return `${position}th`
//     }
// }

// const getRowStyles = (index: number) => {
//     if (index === 0) {
//         return "bg-[rgba(30,58,138,0.8)]" // First place - darker blue
//     } else if (index === 1) {
//         return "bg-[rgba(30,58,138,0.6)]" // Second place - medium blue
//     } else if (index === 2) {
//         return "bg-[rgba(30,58,138,0.5)]" // Third place - lighter blue
//     }
//     return "bg-[rgba(30,58,138,0.4)]" // All other places - light blue
// }


// function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete }: LeagueSettingsDialogProps) {
//     const [name, setName] = useState('');
//     const [adminId, setAdminId] = useState('');
//     const [isActive, setIsActive] = useState(true);
//     const [maxGames, setMaxGames] = useState(20);
//     const [showPoints, setShowPoints] = useState(true);

//     useEffect(() => {
//         if (league) {
//             setName(league.name || '');
//             setIsActive(league.active !== false);
//             setMaxGames(league.maxGames || 20);
//             setShowPoints(league.showPoints !== false);
//             setAdminId(league.administrators?.[0]?.id || '');
//         }
//     }, [league]);

//     const handleUpdate = () => {
//         const updatedData = {
//             name,
//             active: isActive,
//             maxGames,
//             showPoints,
//             admins: [adminId],
//         };
//         onUpdate(updatedData);
//     };

//     if (!league) return null;

//     return (
//         <Dialog
//             open={open}
//             onClose={onClose}
//             fullWidth
//             maxWidth="md"
//             PaperProps={{
//                 sx: {
//                     bgcolor: 'rgba(15,15,15,0.92)',
//                     color: '#E5E7EB',
//                     borderRadius: 3,
//                     border: '1px solid rgba(255,255,255,0.08)',
//                     backdropFilter: 'blur(10px)',
//                     boxShadow:
//                         '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
//                     overflow: 'hidden',
//                 },
//             }}
//         >
//             <DialogTitle
//                 sx={{
//                     fontWeight: 'bold',
//                     position: 'relative',
//                     color: '#E5E7EB',
//                 }}
//             >
//                 Manage League Settings
//                 <IconButton
//                     aria-label="close"
//                     onClick={onClose}
//                     sx={{
//                         position: 'absolute',
//                         right: 8,
//                         top: 8,
//                         color: '#9CA3AF',
//                         '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
//                     }}
//                 >
//                     <CloseIcon />
//                 </IconButton>
//             </DialogTitle>

//             <DialogContent>
//                 <Box
//                     component="form"
//                     noValidate
//                     autoComplete="off"
//                     sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
//                 >
//                     <FormControl fullWidth>
//                         <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                             Select league admin
//                         </Typography>
//                         <Select
//                             value={adminId}
//                             onChange={(e) => setAdminId(e.target.value)}
//                             sx={{
//                                 color: '#E5E7EB',
//                                 '& .MuiOutlinedInput-notchedOutline': {
//                                     borderColor: 'rgba(255,255,255,0.2)',
//                                 },
//                                 '&:hover .MuiOutlinedInput-notchedOutline': {
//                                     borderColor: 'rgba(255,255,255,0.35)',
//                                 },
//                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                     borderColor: '#0388E3',
//                                 },
//                                 '& .MuiSelect-icon': { color: '#E5E7EB' },
//                             }}
//                             MenuProps={{
//                                 PaperProps: {
//                                     sx: {
//                                         bgcolor: 'rgba(15,15,15,0.98)',
//                                         color: '#E5E7EB',
//                                         border: '1px solid rgba(255,255,255,0.08)',
//                                     },
//                                 },
//                             }}
//                         >
//                             {league.members.map((member: User) => (
//                                 <MenuItem key={member.id} value={member.id}>
//                                     {member.firstName} {member.lastName}
//                                 </MenuItem>
//                             ))}
//                         </Select>
//                     </FormControl>

//                     <FormControl fullWidth>
//                         <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                             League name
//                         </Typography>
//                         <TextField
//                             fullWidth
//                             value={name}
//                             onChange={(e) => setName(e.target.value)}
//                             sx={{
//                                 '& .MuiOutlinedInput-root': {
//                                     color: '#E5E7EB',
//                                     '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
//                                     '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
//                                     '&.Mui-focused fieldset': { borderColor: '#0388E3' },
//                                 },
//                                 '& .MuiInputBase-input': { color: '#E5E7EB' },
//                             }}
//                             InputLabelProps={{ sx: { color: '#9CA3AF' } }}
//                         />
//                     </FormControl>

//                     <FormControl component="fieldset">
//                         <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                             Change league active status
//                         </Typography>
//                         <RadioGroup
//                             row
//                             value={isActive ? 'active' : 'inactive'}
//                             onChange={(e) => setIsActive(e.target.value === 'active')}
//                         >
//                             <FormControlLabel
//                                 value="active"
//                                 control={
//                                     <Radio
//                                         sx={{
//                                             color: 'rgba(255,255,255,0.6)',
//                                             '&.Mui-checked': { color: '#27ab83' },
//                                         }}
//                                     />
//                                 }
//                                 label="Active"
//                             />
//                             <FormControlLabel
//                                 value="inactive"
//                                 control={
//                                     <Radio
//                                         sx={{
//                                             color: 'rgba(255,255,255,0.6)',
//                                             '&.Mui-checked': { color: '#27ab83' },
//                                         }}
//                                     />
//                                 }
//                                 label="Inactive"
//                             />
//                         </RadioGroup>
//                     </FormControl>

//                     <FormControl fullWidth>
//                         <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                             Maximum number of matches
//                         </Typography>
//                         <TextField
//                             fullWidth
//                             type="number"
//                             value={maxGames}
//                             onChange={(e) => setMaxGames(Number(e.target.value))}
//                             sx={{
//                                 '& .MuiOutlinedInput-root': {
//                                     color: '#E5E7EB',
//                                     '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
//                                     '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
//                                     '&.Mui-focused fieldset': { borderColor: '#0388E3' },
//                                 },
//                                 '& .MuiInputBase-input': { color: '#E5E7EB' },
//                             }}
//                         />
//                     </FormControl>

//                     <FormControlLabel
//                         control={
//                             <Switch
//                                 checked={showPoints}
//                                 onChange={(e) => setShowPoints(e.target.checked)}
//                                 sx={{
//                                     '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' },
//                                     '& .Mui-checked': { color: '#27ab83' },
//                                     '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#27ab83' },
//                                 }}
//                             />
//                         }
//                         label="CF Advance Point Scoring"
//                         sx={{ color: '#E5E7EB' }}
//                     />
//                 </Box>
//             </DialogContent>

//             <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
//                 <Button
//                     onClick={handleUpdate}
//                     variant="contained"
//                     sx={{ bgcolor: '#27ab83', '&:hover': { bgcolor: '#1e8463' } }}
//                 >
//                     Update League
//                 </Button>
//                 <Button variant="contained" color="error" onClick={onDelete}>
//                     Delete League
//                 </Button>
//             </DialogActions>
//         </Dialog>
//     );
// }


// function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete, currentUserId, onRemoveMember, onLeaveLeague }: LeagueSettingsDialogProps) {
//     const [name, setName] = useState('')
//     const [adminId, setAdminId] = useState('')
//     const [isActive, setIsActive] = useState(true)
//     const [maxGames, setMaxGames] = useState(20)
//     const [showPoints, setShowPoints] = useState(true)

//     useEffect(() => {
//         if (league) {
//             setName(league.name || '')
//             setIsActive(league.active !== false)
//             setMaxGames(league.maxGames || 20)
//             setShowPoints(league.showPoints !== false)
//             setAdminId(league.administrators?.[0]?.id || '')
//         }
//     }, [league])

//     const handleUpdate = () => {
//         const updatedData: LeagueUpdatePayload = {
//             name,
//             active: isActive,
//             maxGames,
//             showPoints,
//             admins: adminId ? [adminId] : [],
//         }
//         onUpdate(updatedData)
//     }

//     const handleLeaveLeague = () => {
//         if (!league || !currentUserId) return
//         const leagueAdminId = league.administrators?.[0]?.id || ''
//         const isCurrentUserAdmin = currentUserId === leagueAdminId

//         const confirmMsg = isCurrentUserAdmin
//             ? 'You are the league admin. Leaving will transfer admin to another member. Continue?'
//             : 'Are you sure you want to leave this league?'

//         if (!window.confirm(confirmMsg)) return

//         if (isCurrentUserAdmin) {
//             // Determine replacement admin: prefer selected adminId if it's another member; otherwise pick first other member
//             let replacementId = adminId && adminId !== currentUserId ? adminId : ''
//             if (!replacementId) {
//                 const firstOther = (league.members || []).find(m => m.id !== currentUserId)
//                 if (firstOther) replacementId = firstOther.id
//             }

//             if (!replacementId) {
//                 // No other member to assign
//                 window.alert('Cannot leave as admin because no other members are available to assign as admin.')
//                 return
//             }

//             // First, update league admin, then remove current user
//             try {
//                 onUpdate({
//                     name,
//                     active: isActive,
//                     maxGames,
//                     showPoints,
//                     admins: [replacementId],
//                 })
//             } catch { /* noop */ }
//         }

//         if (typeof onLeaveLeague === 'function') {
//             try { onLeaveLeague() } catch { /* noop */ }
//         } else if (typeof onRemoveMember === 'function' && currentUserId) {
//             onRemoveMember(currentUserId)
//         }

//         try { onClose() } catch { /* noop */ }
//     }

//     if (!league) return null

//     return (
//         <Dialog
//             open={open}
//             onClose={onClose}
//             fullWidth
//             maxWidth="md"
//             PaperProps={{
//                 sx: {
//                     bgcolor: 'rgba(15,15,15,0.92)',
//                     color: '#E5E7EB',
//                     borderRadius: 3,
//                     border: '1px solid rgba(255,255,255,0.08)',
//                     backdropFilter: 'blur(10px)',
//                     boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
//                     overflow: 'hidden',
//                 },
//             }}
//         >
//             <DialogTitle sx={{ fontWeight: 'bold', position: 'relative', color: '#E5E7EB' }}>
//                 Manage League Settings
//                 <IconButton
//                     aria-label="close"
//                     onClick={onClose}
//                     sx={{ position: 'absolute', right: 8, top: 8, color: '#9CA3AF', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
//                 >
//                     <Close />
//                 </IconButton>
//             </DialogTitle>

//             <DialogContent>
//                 <Grid container spacing={3} sx={{ mt: 0 }}>
//                     <Grid item xs={12} md={6}>
//                         <Box component="form" noValidate autoComplete="off" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
//                             <FormControl fullWidth>
//                                 <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                                     Select league admin
//                                 </Typography>
//                                 <Select
//                                     value={adminId}
//                                     onChange={(e) => setAdminId(e.target.value as string)}
//                                     sx={{
//                                         color: '#E5E7EB',
//                                         '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
//                                         '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
//                                         '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0388E3' },
//                                         '& .MuiSelect-icon': { color: '#E5E7EB' },
//                                     }}
//                                     MenuProps={{
//                                         PaperProps: {
//                                             sx: { bgcolor: 'rgba(15,15,15,0.98)', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.08)' },
//                                         },
//                                     }}
//                                 >
//                                     {(league.members || []).map((member: User) => (
//                                         <MenuItem key={member.id} value={member.id}>
//                                             {member.firstName} {member.lastName}
//                                         </MenuItem>
//                                     ))}
//                                 </Select>
//                             </FormControl>

//                             <FormControl fullWidth>
//                                 <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                                     League name
//                                 </Typography>
//                                 <TextField
//                                     fullWidth
//                                     value={name}
//                                     onChange={(e) => {
//                                         const raw = e.target.value || ''
//                                         const cleaned = raw.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 20)
//                                         setName(cleaned)
//                                     }}
//                                     sx={{
//                                         '& .MuiOutlinedInput-root': {
//                                             color: '#E5E7EB',
//                                             '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
//                                             '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
//                                             '&.Mui-focused fieldset': { borderColor: '#0388E3' },
//                                         },
//                                         '& .MuiInputBase-input': { color: '#E5E7EB' },
//                                     }}
//                                     InputLabelProps={{ sx: { color: '#9CA3AF' } }}
//                                     inputProps={{ maxLength: 20 }}
//                                     helperText="Max 20 characters, letters/numbers only"
//                                 />
//                             </FormControl>

//                             <FormControl component="fieldset">
//                                 <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                                     Change league active status
//                                 </Typography>
//                                 <RadioGroup row value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}>
//                                     <FormControlLabel
//                                         value="active"
//                                         control={<Radio sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: '#27ab83' } }} />}
//                                         label="Active"
//                                     />
//                                     <FormControlLabel
//                                         value="inactive"
//                                         control={<Radio sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: '#27ab83' } }} />}
//                                         label="Inactive"
//                                     />
//                                 </RadioGroup>
//                             </FormControl>

//                             <FormControl fullWidth>
//                                 <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                                     Maximum number of matches
//                                 </Typography>
//                                 <TextField
//                                     fullWidth
//                                     type="number"
//                                     value={maxGames}
//                                     onChange={(e) => setMaxGames(Number(e.target.value))}
//                                     sx={{
//                                         '& .MuiOutlinedInput-root': {
//                                             color: '#E5E7EB',
//                                             '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
//                                             '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
//                                             '&.Mui-focused fieldset': { borderColor: '#0388E3' },
//                                         },
//                                         '& .MuiInputBase-input': { color: '#E5E7EB' },
//                                     }}
//                                 />
//                             </FormControl>

//                             <FormControlLabel
//                                 control={
//                                     <Switch
//                                         checked={showPoints}
//                                         onChange={(e) => setShowPoints(e.target.checked)}
//                                         sx={{
//                                             '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' },
//                                             '& .Mui-checked': { color: '#27ab83' },
//                                             '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#27ab83' },
//                                         }}
//                                     />
//                                 }
//                                 label="CF Advance Point Scoring"
//                                 sx={{ color: '#E5E7EB' }}
//                             />
//                         </Box>
//                     </Grid>
//                     <Grid item xs={12} md={6}>
//                         {/* Members management (now on right side, no inner scroll) */}
//                         <Box sx={{ mt: { xs: 1, md: 2 }, pr: 1 }}>
//                             <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: '#E5E7EB' }}>
//                                 Manage members
//                             </Typography>
//                             <List sx={{ py: 0 }}>
//                                 {(league.members || []).map((member: User, index: number) => {
//                                     const memberName = `${member.firstName} ${member.lastName}`.trim()
//                                     const leagueAdminId = league.administrators?.[0]?.id || ''
//                                     const isLeagueAdmin = member.id === leagueAdminId
//                                     const isCurrentUser = currentUserId ? member.id === currentUserId : false
//                                     return (
//                                         <Box key={member.id}>
//                                             <ListItem
//                                                 sx={{
//                                                     py: { xs: 1.5, sm: 2 },
//                                                     px: { xs: 1.5, sm: 2 },
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     gap: 2,
//                                                     bgcolor: isCurrentUser ? 'rgba(255,255,255,0.06)' : 'transparent',
//                                                     borderLeft: isCurrentUser ? '3px solid #e56a16' : 'none',
//                                                 }}
//                                             >
//                                                 <ListItemAvatar>
//                                                     <Avatar sx={{ bgcolor: '#374151' }}>
//                                                         {(member.firstName?.[0] || '?').toUpperCase()}
//                                                     </Avatar>
//                                                 </ListItemAvatar>
//                                                 <ListItemText
//                                                     primary={
//                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//                                                             <Typography sx={{ fontWeight: 600, color: '#E5E7EB' }}>
//                                                                 {memberName || 'Unnamed'}
//                                                             </Typography>
//                                                             <Chip
//                                                                 label={isLeagueAdmin ? 'League Admin' : 'Member'}
//                                                                 size="small"
//                                                                 sx={{
//                                                                     bgcolor: 'transparent',
//                                                                     color: isLeagueAdmin ? '#e56a16' : '#9CA3AF',
//                                                                     border: `1px solid ${isLeagueAdmin ? 'rgba(229,106,22,0.6)' : 'rgba(156,163,175,0.6)'}`,
//                                                                     fontWeight: 600,
//                                                                     fontSize: 11,
//                                                                     height: 20,
//                                                                     borderRadius: '9999px',
//                                                                 }}
//                                                             />
//                                                         </Box>
//                                                     }
//                                                 />

//                                                 {/* Right-side remove button only for admin and not for self or the league admin */}
//                                                 {currentUserId && onRemoveMember && (league.administrators?.[0]?.id === currentUserId) && !isLeagueAdmin && member.id !== currentUserId && (
//                                                     <Tooltip title={`Remove ${memberName}`} arrow>
//                                                         <IconButton
//                                                             onClick={() => {
//                                                                 if (window.confirm(`Remove ${memberName} from the league?`)) {
//                                                                     onRemoveMember(member.id)
//                                                                 }
//                                                             }}
//                                                             sx={{
//                                                                 color: '#ff6b6b',
//                                                                 bgcolor: 'rgba(255, 107, 107, 0.12)',
//                                                                 '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.2)' },
//                                                             }}
//                                                         >
//                                                             <Delete sx={{ fontSize: 20 }} />
//                                                         </IconButton>
//                                                     </Tooltip>
//                                                 )}
//                                             </ListItem>
//                                             {index < (league.members?.length || 0) - 1 && (
//                                                 <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)', mx: 2 }} />
//                                             )}
//                                         </Box>
//                                     )
//                                 })}
//                             </List>
//                         </Box>
//                     </Grid>
//                 </Grid>
//             </DialogContent>

//             <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
//                 <Box sx={{ display: 'flex', gap: 1 }}>
//                     {currentUserId && (
//                         <Button
//                             variant="outlined"
//                             color="warning"
//                             onClick={handleLeaveLeague}
//                             sx={{ borderColor: 'rgba(229,106,22,0.6)', color: '#e56a16', '&:hover': { borderColor: '#e56a16', bgcolor: 'rgba(229,106,22,0.08)' } }}
//                         >
//                             Leave League
//                         </Button>
//                     )}
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 1 }}>
//                     <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: '#27ab83', '&:hover': { bgcolor: '#1e8463' } }}>
//                         Update League
//                     </Button>
//                     <Button variant="contained" color="error" onClick={onDelete}>
//                         Delete League
//                     </Button>
//                 </Box>
//             </DialogActions>
//         </Dialog>
//     )
// }

function LeagueSettingsDialog({ open, onClose, league, onUpdate, onDelete, currentUserId, onRemoveMember, onLeaveLeague }: LeagueSettingsDialogProps) {
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

    if (!league) return null

    // Helper to determine if a given user is an admin of this league
    const isUserLeagueAdmin = (userId?: string | null): boolean => {
        if (!userId) return false
        if (league.adminId && league.adminId === userId) return true
        if (Array.isArray(league.administrators)) {
            return league.administrators.some(a => a?.id === userId)
        }
        return false
    }

    const currentUserIsAdmin = isUserLeagueAdmin(currentUserId)

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
                                {(league.members || []).map((member: User, index: number) => {
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
                                            {index < (league.members?.length || 0) - 1 && (
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
                                const isAdmin = league.adminId === currentUserId
                                const confirmMsg = isAdmin
                                    ? 'You are the league admin. Leaving will transfer admin to another member. Continue?'
                                    : 'Are you sure you want to leave this league?'
                                if (!window.confirm(confirmMsg)) return

                                if (isAdmin) {
                                    // Prefer selected admin if different, otherwise first other member
                                    let replacementId = adminId && adminId !== currentUserId ? adminId : ''
                                    if (!replacementId) {
                                        const firstOther = (league.members || []).find(m => m.id !== currentUserId)
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
// Add TableData type
interface TableData {
    xp: number;
    id: string;
    name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    winPercentage: string;
    isAdmin?: boolean;
    profilePicture?: string | null;
    motmCount?: number;
}

export default function LeagueDetailPage() {
    const [matchStatsOpen, setMatchStatsOpen] = React.useState(false);
    const [selectedMatchIdForDialog, setSelectedMatchIdForDialog] = React.useState<string | null>(null);
    const [shouldShowAdminGoals, setShouldShowAdminGoals] = React.useState(false);
    const [league, setLeague] = useState<League | null>(null);
    console.log('leagues matches', league?.matches)
    const [error, setError] = useState<string | null>(null);
    const { user, token, loading: authLoading, isAuthenticated } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<'members' | 'matches' | 'results' | 'table' | 'awards'>('table');
    const searchParams = useSearchParams();
    const profilePlayerId = typeof searchParams?.get === 'function' ? searchParams.get('profilePlayerId') : '';
    const [hasCommonLeague, setHasCommonLeague] = useState(false);
    const [, setCheckedCommonLeague] = useState(false);
    const [userLeagueXP, setUserLeagueXP] = useState<Record<string, number>>({});
    const [showPointsAlert, setShowPointsAlert] = useState(false);
    const [statsDialogOpen, setStatsDialogOpen] = React.useState(false);
    const [activeMatchId,] = React.useState<string | null>(null);
    // 
    const [stats, setStats] = React.useState({
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        penalties: 0,
        freeKicks: 0,
        defence: 0,
        impact: 0,
    });
    const [isSubmittingStats, setIsSubmittingStats] = React.useState(false);


    const [viewTeamOpen, setViewTeamOpen] = React.useState(false);
    const [viewTeamMatch, setViewTeamMatch] = React.useState<{ leagueId: string; matchId: string } | null>(null);
    // Leagues dropdown state
    const [allLeagues, setAllLeagues] = useState<League[]>([]);
    const [leaguesDropdownOpen, setLeaguesDropdownOpen] = useState(false);
    const [leaguesDropdownAnchor, setLeaguesDropdownAnchor] = useState<null | HTMLElement>(null);

    // Match detail modal state
    const [matchDetailModalOpen, setMatchDetailModalOpen] = useState(false);
    const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);

    // Confirmation dialog state
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [matchPendingDelete, setMatchPendingDelete] = useState<Match | null>(null);
    // const [undoInfo, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);
    const [undoInfo, setUndoInfo] = useState<{ match: Match; action: 'archive' | 'delete' } | null>(null);

    const [archivedActionOpen, setArchivedActionOpen] = useState(false);
    const [archivedActionMatch, setArchivedActionMatch] = useState<Match | null>(null);
    const [archivedActionChecking, setArchivedActionChecking] = useState(false);
    const [archivedActionHasStats, setArchivedActionHasStats] = useState<boolean | null>(null);

    const [leagueWinners, setLeagueWinners] = useState<{ champion?: string; runnerUp?: string }>({});
    const [motmCounts, setMotmCounts] = useState<Record<string, number>>({});

    // Quick View: move hooks above any conditional returns to satisfy rules-of-hooks
    type PlayerProfileLike = {
        position?: string | null;
        preferredFoot?: string | null;
        shirtNumber?: string | number | null;
        profilePicture?: string | null;
        avatarUrl?: string | null;
    };
    const [openQuickView, setOpenQuickView] = useState(false);
    const [quickView, setQuickView] = useState<{
        player?: (User & PlayerProfileLike) | null;
        league?: League | null;
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

    // State for members dialog
    const [openMembers, setOpenMembers] = useState(false);
    const [, setLoadingMembers] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

    // Callback hooks for members dialog
    const handleOpenMembers = useCallback(async (league: League) => {
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
    }, [token]);

    // Allow a non-admin to leave the league from the members dialog
    const handleLeaveLeague = useCallback(async () => {
        if (!selectedLeague) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeague.id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setOpenMembers(false);
                toast.success('Successfully left the league');
                // Navigate away since the user is no longer in this league
                router.push('/all-leagues');
            } else {
                toast.error('Failed to leave league');
            }
        } catch {
            toast.error('Failed to leave league');
        }
    }, [selectedLeague, token, router]);

    useEffect(() => {
        if (!token || !leagueId) return;
        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/trophy-room?leagueId=${encodeURIComponent(leagueId)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || !data?.success || !Array.isArray(data?.trophyWinners)) {
                    setLeagueWinners({});
                    return;
                }
                const winners = data.trophyWinners as Array<{ title: string; winnerId: string | number | null }>;
                const byTitle = (t: string) => winners.find(w => (w.title || '').toLowerCase() === t.toLowerCase());
                const champion = byTitle('League Champion')?.winnerId;
                const runnerUp = byTitle('Runner-Up')?.winnerId;
                setLeagueWinners({
                    champion: champion != null ? String(champion) : undefined,
                    runnerUp: runnerUp != null ? String(runnerUp) : undefined,
                });
            } catch {
                setLeagueWinners({});
            }
        })();
    }, [token, leagueId]);

    const checkCanHardDelete = useCallback(async (matchId: string) => {
        if (!token) return;
        setArchivedActionChecking(true);
        setArchivedActionHasStats(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/has-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('check failed');
            const data = await res.json();
            setArchivedActionHasStats(!!data.hasStats);
        } catch {
            // fail-safe: if unknown, prevent hard delete
            setArchivedActionHasStats(true);
        } finally {
            setArchivedActionChecking(false);
        }
    }, [token]);

    useEffect(() => {
        if (archivedActionOpen && archivedActionMatch?.id) {
            checkCanHardDelete(archivedActionMatch.id);
        }
    }, [archivedActionOpen, archivedActionMatch, checkCanHardDelete]);


    const getHasStats = useCallback(async (matchId: string): Promise<boolean> => {
        if (!token) return true; // default safe
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/has-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return true;
            const data = await res.json();
            return !!data.hasStats;
        } catch {
            return true; // safe default
        }
    }, [token]);

    const handlePermanentDelete = useCallback(async (match: Match) => {
        // if (!window.confirm('Are you sure you want to PERMANENTLY delete this match? This action cannot be undone and all match data will be lost forever.')) {
        //     return;
        // }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 400) {
                // Backend says cannot delete (likely stats exist)
                let msg = 'Cannot permanently delete this match. It may have player stats.';
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                toast.error(msg);
                setArchivedActionHasStats(true);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to permanently delete match');
            }

            setLeague(prev => prev ? {
                ...prev,
                matches: (prev.matches ?? []).filter(mm => mm.id !== match.id)
            } : prev);

            toast.success('Match permanently deleted');
            fetchLeagueDetails();

        } catch (error) {
            console.error('Permanent delete failed:', error);
            toast.error('Failed to permanently delete match');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const tryHardDeleteFromDialog = useCallback(async () => {
        if (!archivedActionMatch) return;

        // If already confirmed no stats, proceed
        if (archivedActionHasStats === false) {
            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
            if (ok) {
                await handlePermanentDelete(archivedActionMatch);
                setArchivedActionOpen(false);
            }
            return;
        }

        // Unknown or previously blocked: re-check now
        setArchivedActionChecking(true);
        try {
            const hasStats = await getHasStats(archivedActionMatch.id);
            setArchivedActionHasStats(hasStats);

            if (hasStats) {
                toast.error('Player stats exist. Permanent delete is disabled.');
                return;
            }

            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
            if (ok) {
                await handlePermanentDelete(archivedActionMatch);
                setArchivedActionOpen(false);
            }
        } finally {
            setArchivedActionChecking(false);
        }
    }, [archivedActionMatch, archivedActionHasStats, getHasStats, handlePermanentDelete]);

    // Example stat change handler
    const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
        setStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + increment);
            return { ...prev, [stat]: Math.min(newValue, max) };
        });
    };

    // Fetch existing stats for the player in this match
    // const fetchExistingStats = useCallback(async (matchId: string) => {
    //     if (!token || !user) return;

    //     try {
    //         // Fetch existing stats for the current user
    //         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?playerId=${user.id}`, {
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });

    //         // Check if endpoint exists (not 404 or 405)
    //         if (response.status === 404 || response.status === 405) {
    //             // Endpoint doesn't exist, use default stats
    //             setStats({
    //                 goals: 0,
    //                 assists: 0,
    //                 cleanSheets: 0,
    //                 penalties: 0,
    //                 freeKicks: 0,
    //                 defence: 0,
    //                 impact: 0
    //             });
    //             return;
    //         }

    //         const data = await response.json();

    //         if (data.success && data.stats) {
    //             // Use existing stats if available
    //             setStats({
    //                 goals: data.stats.goals || 0,
    //                 assists: data.stats.assists || 0,
    //                 cleanSheets: data.stats.cleanSheets || 0,
    //                 penalties: data.stats.penalties || 0,
    //                 freeKicks: data.stats.freeKicks || 0,
    //                 defence: data.stats.defence || 0,
    //                 impact: data.stats.impact || 0,
    //             });
    //         } else {
    //             // Reset to 0 if no existing stats
    //             setStats({
    //                 goals: 0,
    //                 assists: 0,
    //                 cleanSheets: 0,
    //                 penalties: 0,
    //                 freeKicks: 0,
    //                 defence: 0,
    //                 impact: 0
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Failed to fetch existing stats:', error);
    //         // Reset to 0 on error
    //         setStats({
    //             goals: 0,
    //             assists: 0,
    //             cleanSheets: 0,
    //             penalties: 0,
    //             freeKicks: 0,
    //             defence: 0,
    //             impact: 0
    //         });
    //     }
    // }, [token, user]);

    // Save stats to backend
    const handleSaveStats = async () => {
        if (!activeMatchId || !token) return;

        setIsSubmittingStats(true);
        try {
            console.log('💾 Saving stats for match:', activeMatchId);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${activeMatchId}/stats`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goals: stats.goals,
                    assists: stats.assists,
                    cleanSheets: stats.cleanSheets,
                    penalties: stats.penalties,
                    freeKicks: stats.freeKicks,
                    defence: stats.defence,
                    impact: stats.impact,
                }),
            });

            // Check if endpoint exists (not 404 or 405)
            if (response.status === 404 || response.status === 405) {
                // Endpoint doesn't exist, show error message
                console.error('Stats saving is not available yet. Please contact the administrator.');
                setStatsDialogOpen(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                console.log('✅ Stats saved successfully!');
                
                // Close dialog
                setStatsDialogOpen(false);
                
                // 🔄 Fetch fresh data from backend
                console.log('🔄 Forcing immediate data refresh...');
                await fetchLeagueDetails();
                
                // 📢 Dispatch event for other components
                window.dispatchEvent(new CustomEvent('match-updated', { 
                    detail: { matchId: activeMatchId } 
                }));
                
                // ✅ Show success message
                toast.success('Stats saved successfully!');
                
                console.log('✨ Match updated and refreshed!');
            }
        } catch (err: unknown) {
            console.error('❌ Error saving stats:', err instanceof Error ? err.message : String(err));
            toast.error('Failed to save stats. Please try again.');
        } finally {
            setIsSubmittingStats(false);
        }
    };

    // Get match goals for the active match
    const getMatchGoals = () => {
        if (!activeMatchId || !league) return 10; // Default fallback
        const match = league.matches.find(m => m.id === activeMatchId);
        if (!match) return 10;
        return (match.homeTeamGoals || 0) + (match.awayTeamGoals || 0);
    };

    // Add this useEffect to sync tab param with section
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab === 'table' || tab === 'awards' || tab === 'members' || tab === 'matches' || tab === 'results') {
            setSection(tab);
        }
    }, [searchParams]);

    // Declare isMember and isAdmin here so they are available for useEffect and logic below
    const isMember = league && league.members && user && league.members.some((m: User) => m.id === user.id);
    const isAdmin = league && league.administrators && user && league.administrators.some((a: User) => a.id === user.id);


    const handleCloseTeamModal = () => {
        setTeamModalOpen(false);
        setSelectedMatch(null);
    };

    console.log('league', league)

    const fetchLeagueDetails = useCallback(async () => {
        try {
            console.log("🔄 Fetching league details - Token:", token ? 'Present' : 'Missing');
            
            // 🔄 Add cache busting to force fresh data from backend
            const cacheBuster = `?_t=${Date.now()}`;
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}${cacheBuster}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                console.log('✅ Fresh League Data Received:', data.league);
                console.log('✅ Total Matches:', data.league.matches?.length || 0);
                if (data.league.matches) {
                    data.league.matches.forEach((match: Match, index: number) => {
                        console.log(`  Match ${index + 1}: ${match.homeTeamName} vs ${match.awayTeamName} | Status: ${match.status}`);
                    });
                }
                setLeague(data.league);
                console.log('✅ League state updated successfully');
            } else {
                setError(data.message || 'Failed to fetch league details');
                console.error('❌ API Error:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching league details:', error);
            setError('Failed to fetch league details');
        }
    }, [leagueId, token]);

    useEffect(() => {
        // Wait for auth to finish loading, user to be authenticated, and token to be available
        if (authLoading) return;
        if (!isAuthenticated || !token || !leagueId) return;
        fetchLeagueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, authLoading, isAuthenticated, leagueId]);

    // 🔄 Auto-refresh: Event-driven (immediate) + Periodic check every 1 minute
    // This handles both manual operations AND automatic match completion detection
    useCombinedMatchRefresh(fetchLeagueDetails, 60000); // Check every 60 seconds

    // Professional access logic: allow if user and profile player have ever shared ANY league
    useEffect(() => {
        if (!user || !profilePlayerId) {
            setCheckedCommonLeague(true);
            setHasCommonLeague(false);
            return;
        }
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${profilePlayerId}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
        ]).then(([userData, playerData]) => {
            const userLeagues = [
                ...(userData.user.leagues || []),
                ...(userData.user.administeredLeagues || [])
            ].map(l => l.id);
            const profilePlayerLeagues = (playerData.data?.leagues || []).map((l: User) => l.id);
            const hasOverlap = userLeagues.some((id: string) => profilePlayerLeagues.includes(id));
            setHasCommonLeague(hasOverlap);
            setCheckedCommonLeague(true);
        }).catch(() => {
            setHasCommonLeague(false);
            setCheckedCommonLeague(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, profilePlayerId, token]);

    // Helper: determine if a league is completed (exclude from dropdown)
    const leagueIsCompleted = useCallback((l: League): boolean => {
        // If there are any missing items (e.g., pending stats), do NOT treat as completed
        const missingArr = Array.isArray(l?.computedStatus?.missing) ? l.computedStatus!.missing! : [];
        if (missingArr.length > 0) return false;

        // If we have counters, prefer them to decide completion:
        // require matchesPlayed >= maxGames when maxGames is provided (> 0)
        const toNum = (v: unknown): number | undefined => {
            const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
            return Number.isFinite(n) ? n : undefined;
        };
        const playedFromComputed = toNum(l?.computedStatus?.matchesPlayed) ?? toNum(l?.computedStatus?.gamesPlayed);
        const playedFromList = undefined; // not available reliably here
        const played = playedFromComputed ?? playedFromList;
        const maxG = toNum(l?.computedStatus?.maxGames) ?? toNum(l?.maxGames);

        // Ported logic from All Leagues: derive completion from matches list when available
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
                if (completedCount < maxG) return false; // not complete yet
                // completed by matches threshold -> consider complete (missing already checked above)
                return true;
            }
        }

        if (typeof maxG === 'number' && maxG > 0 && typeof played === 'number') {
            if (played < maxG) {
                // Even if backend flags it completed/locked, do NOT treat as completed until maxGames reached
                return false;
            }
            // Counters meet threshold and missing is empty -> complete
            return true;
        }

        // Primary: explicit completion flags coming from backend
        if (l?.computedStatus?.isComplete === true) return true;
        if (l?.computedStatus?.locked === true) return true;
        if (l?.isComplete === true) return true;
        if (l?.isCompleted === true) return true;
        if (l?.isLocked === true) return true;

        // Backward-compat: infer completion from status/active when flags are absent
        const sRaw = (l?.status ?? '').toString();
        const s = sRaw.trim().toUpperCase();
        const completionStatuses = new Set([
            'RESULT_PUBLISHED',
            'RESULT_UPLOADED',
            'RESULT_COMPLETE',
            'RESULT_FINISHED',
            'RESULT_ENDED',
            'RESULT_DONE',
            'COMPLETED'
        ]);
        if (completionStatuses.has(s)) return true;
        if (typeof l?.active === 'boolean' && l.active === false) return true;
        return false;
    }, []);

    // Fetch all user leagues for dropdown
    const fetchAllLeagues = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            interface LeagueData {
                id: string | number;
                name: string;
                maxGames?: number;
                matches?: Match[];
                isComplete?: boolean;
                isCompleted?: boolean;
                isLocked?: boolean;
                status?: string;
                active?: boolean;
                [key: string]: unknown;
            }

            interface AuthStatusResponse {
                success: boolean;
                user?: {
                    adminLeagues?: LeagueData[];
                    administeredLeagues?: LeagueData[];
                    leagues?: LeagueData[];
                };
            }

            const data: AuthStatusResponse = await response.json();

            if (data.success && data.user) {
                // Get admin league IDs
                const adminLeaguesArr: LeagueData[] = data.user.adminLeagues || data.user.administeredLeagues || [];
                const adminLeagueIds = new Set<string>(
                    adminLeaguesArr
                        .map((l: LeagueData) => String(l?.id))
                        .filter((id: string) => id !== 'undefined')
                );

                // Get member league IDs
                const memberLeagueIds = new Set<string>(
                    (data.user.leagues || [])
                        .map((l: LeagueData) => String(l?.id))
                        .filter((id: string) => id !== 'undefined')
                );

                // Combine and remove duplicates
                const userLeagues: LeagueData[] = [
                    ...(data.user.leagues || []),
                    ...adminLeaguesArr
                ];

                const uniqueLeaguesMap = new Map<string, LeagueData>();
                userLeagues.forEach(league => {
                    const id = String(league.id);
                    if (!uniqueLeaguesMap.has(id)) {
                        uniqueLeaguesMap.set(id, league);
                    }
                });

                // Convert to League type with role assignment (no extra API calls)
                const simpleLeagues: League[] = Array.from(uniqueLeaguesMap.values()).map((l: LeagueData) => {
                    const leagueId = String(l.id);
                    const role: 'ADMIN' | 'MEMBER' | undefined = adminLeagueIds.has(leagueId)
                        ? 'ADMIN'
                        : (memberLeagueIds.has(leagueId) ? 'MEMBER' : undefined);
                    
                    return {
                        ...l,
                        id: leagueId,
                        name: l.name || '',
                        inviteCode: '',
                        createdAt: '',
                        members: [],
                        administrators: [],
                        matches: l.matches || [],
                        active: l.active ?? true,
                        maxGames: l.maxGames || 20,
                        showPoints: true,
                        userRole: role,
                        isComplete: l.isComplete,
                        isCompleted: l.isCompleted,
                        isLocked: l.isLocked,
                        status: l.status,
                    } as League;
                });

                // Filter out completed leagues
                const activeLeagues = simpleLeagues.filter(l => !leagueIsCompleted(l));

                // Sort alphabetically by name
                activeLeagues.sort((a, b) => {
                    const an = (a?.name ?? '').toString().trim().toLowerCase();
                    const bn = (b?.name ?? '').toString().trim().toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return String(a.id).localeCompare(String(b.id));
                });

                setAllLeagues(activeLeagues);

                // Debug log
                console.log('[League Detail] Fetched leagues:', {
                    total: simpleLeagues.length,
                    active: activeLeagues.length,
                    completed: simpleLeagues.length - activeLeagues.length
                });
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    }, [token, leagueIsCompleted]);

    // Fetch XP for all users in this league (from API)
    useEffect(() => {
        async function fetchXP() {
            if (!league?.id) return;
            try {
                const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/xp`, { headers });
                const json = await res.json().catch(() => ({}));
                if (res.ok && (json?.success === undefined || json?.success)) {
                    // Support either { xp } or { data: { xp } }
                    const xpMap = json.xp || json.data?.xp || {};
                    setUserLeagueXP(xpMap as Record<string, number>);
                } else {
                    setUserLeagueXP({});
                }
            } catch {
                setUserLeagueXP({});
            }
        }
        fetchXP();
    }, [league?.id, token]);

    // Fetch all leagues for dropdown
    useEffect(() => {
        if (!token) return;
        fetchAllLeagues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    const handleBackToAllLeagues = () => {
        router.push('/all-leagues');
    };

    // Handle league dropdown open/close
    const handleLeaguesDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLeaguesDropdownAnchor(event.currentTarget);
        setLeaguesDropdownOpen(true);
    };

    const handleLeaguesDropdownClose = () => {
        setLeaguesDropdownOpen(false);
        setLeaguesDropdownAnchor(null);
    };

    // Handle league selection
    const handleLeagueSelect = async (selectedLeagueId: string) => {
        if (selectedLeagueId !== leagueId) {
            // Fetch the new league data first, then update URL and state
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${selectedLeagueId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.league) {
                        // Update league data first
                        setLeague(data.league);
                        setError(null);

                        // Update URL after data is set
                        router.replace(`/league/${selectedLeagueId}`, { scroll: false });
                    } else {
                        setError('Failed to load league data');
                    }
                } else {
                    setError('Failed to load league data');
                }
            } catch (error) {
                console.error('Error fetching league:', error);
                setError('Failed to load league data');
            }
        }
        handleLeaguesDropdownClose();
    };

    const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
        if (!user) {
            setError('Please login to mark availability');
            return;
        }

        setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
        const action = isAvailable ? 'unavailable' : 'available';

        try {
            console.log('🔄 Toggling availability with action:', action);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/matches/${matchId}/availability?action=${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            console.log('✅ Response from server:', data);

            if (data.success) {
                // 🔄 Dispatch event for auto-refresh
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('match-updated', { 
                        detail: { matchId, available: action === 'available' } 
                    }));
                    console.log('📢 match-updated event dispatched');
                }

                // 🔄 Fetch fresh data from backend
                console.log('🔄 Fetching fresh league data...');
                await fetchLeagueDetails();
                
                setToastMessage(action === 'available' 
                    ? '✅ You are now available for this match.' 
                    : '❌ You are now unavailable for this match.');
                
                console.log('✅ Availability updated successfully!');
            } else {
                throw new Error(data.message || 'Failed to update availability');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error('❌ Error updating availability:', err);
            setError(errorMessage || 'Failed to connect to server');
            toast.error('Failed to update availability');
        } finally {
            setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const handleUpdateLeague = async (updatedData: Partial<League & { admins: string[] }>) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            const data = await response.json();
            if (data.success) {
                toast.success('League updated successfully!');
                await fetchLeagueDetails();
                setIsSettingsOpen(false);
            } else {
                toast.error(data.message || 'Failed to update league');
            }
        } catch (error) {
            console.error('Error updating league:', error);
            toast.error('An error occurred while updating the league.');
        }
    };

    const handleDeleteLeague = async () => {
        if (window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    toast.success('League deleted successfully.');
                    router.push('/all-leagues');
                } else {
                    const data = await response.json();
                    toast.error(data.message || 'Failed to delete league.');
                }
            } catch (error) {
                console.error('Error deleting league:', error);
                toast.error('An error occurred while deleting the league.');
            }
        }
    };

    // Calculate dynamic table data
    const tableData: TableData[] = React.useMemo(() => {
        if (!league) return [];
        const playerStats = new Map<string, TableData>();
        const adminId = league.administrators?.[0]?.id;
        league.members.forEach((member: User & { xp?: number }) => {
            playerStats.set(member.id, {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                winPercentage: '0%',
                isAdmin: member.id === adminId,
                profilePicture: member.profilePicture || null,
                // Prefer XP from league API map, fallback to member.xp if present
                xp: (userLeagueXP && userLeagueXP[member.id] != null) ? userLeagueXP[member.id] : (member?.xp ?? 0),
                motmCount: typeof motmCounts[member.id] === 'number' ? motmCounts[member.id] : 0,
            });
        });
        league.matches
            .filter(m => !m.archived) // <-- exclude archived
            .filter(m => (m.status === 'RESULT_PUBLISHED' || m.status === 'RESULT_PUBLISHED') && m.homeTeamGoals != null && m.awayTeamGoals != null)
            .forEach(match => {
                const homeWon = match.homeTeamGoals! > match.awayTeamGoals!;
                const awayWon = match.awayTeamGoals! > match.homeTeamGoals!;
                const isDraw = match.homeTeamGoals === match.awayTeamGoals;
                const processPlayer = (p: User, isHome: boolean) => {
                    const stats = playerStats.get(p.id);
                    if (!stats) return;
                    stats.played++;
                    if ((isHome && homeWon) || (!isHome && awayWon)) stats.wins++;
                    else if (isDraw) stats.draws++;
                    else stats.losses++;
                };
                match.homeTeamUsers.forEach(p => processPlayer(p, true));
                match.awayTeamUsers.forEach(p => processPlayer(p, false));
            });

        const list = Array.from(playerStats.values()).map(s => ({
            ...s,
            winPercentage: s.played ? `${Math.round((s.wins / s.played) * 100)}%` : '0%'
        }));

        // Always order by highest to lowest XP points; tie-breakers: wins, draws, then fewer losses
        list.sort((a, b) => {
            if ((b.xp ?? 0) !== (a.xp ?? 0)) return (b.xp ?? 0) - (a.xp ?? 0);
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.draws !== a.draws) return b.draws - a.draws;
            return a.losses - b.losses;
        });

        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [league?.id, leagueWinners, userLeagueXP, motmCounts]);

    // Type for MOTM votes map: voterId -> votedForId
    type ManOfTheMatchVotes = Record<string, string | number>;
    const hasMotmVotes = (m: unknown): m is { manOfTheMatchVotes?: ManOfTheMatchVotes } =>
        typeof m === 'object' && m !== null && 'manOfTheMatchVotes' in m;

    // Aggregate MOTM votes locally from league.matches so every player's votes show
    useEffect(() => {
        if (!league?.members?.length || !league?.id) return;
        const counts: Record<string, number> = {};
        // Initialize all members with 0 to ensure everyone shows up
        league.members.forEach(m => { counts[m.id] = 0; });
        (league.matches || []).forEach((match) => {
            const votes: ManOfTheMatchVotes = hasMotmVotes(match) && match.manOfTheMatchVotes
                ? match.manOfTheMatchVotes
                : {};
            // votes is record voterId -> votedForId; we count by votedForId
            Object.values(votes).forEach((votedForId) => {
                const pid = String(votedForId);
                if (pid in counts) counts[pid] += 1;
            });
        });
        setMotmCounts(counts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [league?.id]);

    // Fetch MOTM votes per player via quick-view endpoint when league changes
    useEffect(() => {
        if (!league?.id || !token || !league.members?.length) return;
        let ignore = false;
        const controller = new AbortController();
        (async () => {
            try {
                const entries = await Promise.all(
                    league.members.map(async (m) => {
                        try {
                            const res = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(league.id)}/player/${encodeURIComponent(m.id)}/quick-view`,
                                { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
                            );
                            if (!res.ok) return [m.id, 0] as const;
                            const data = await res.json();
                            const cnt = Number((data?.motmCount ?? data?.data?.motmCount ?? 0));
                            return [m.id, Number.isFinite(cnt) ? cnt : 0] as const;
                        } catch {
                            return [m.id, 0] as const;
                        }
                    })
                );
                if (!ignore) setMotmCounts(Object.fromEntries(entries));
            } catch {
                // ignore errors
            }
        })();
        return () => {
            ignore = true;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [league?.id, token]);

    const [leagueStats, setLeagueStats] = useState<LeagueStatistics | null>(null);
    // ...existing code...

    // REMOVE the old useMemo leagueStats block
    // ...existing code...
    // { deleted useMemo computing leagueStats }
    // ...existing code...

    useEffect(() => {
        if (!league?.id || !token) return;
        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/statistics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json?.success) setLeagueStats(json.data);
            } catch (e) {
                console.error('Failed to load league statistics', e);
                setLeagueStats(null);
            }
        })();
    }, [league?.id, token]);

    const getAvailabilityCounts = (match: Match) => {
        // Find the league for this match
        const leagueForMatch = league; // Assuming 'league' is available in this scope
        const leagueMembers = leagueForMatch?.members || [];
        // Count how many league members are in availableUsers
        const availableCount = leagueMembers.filter(member =>
            match.availableUsers?.some((u: User) => u.id === member.id)
        ).length;
        const pendingCount = leagueMembers.length - availableCount;
        return { availableCount, pendingCount };
    };


    const formatMatchDate = (dateString: string) => {
        const matchDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time to compare only dates
        const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (matchDateOnly.getTime() === todayOnly.getTime()) {
            return 'Today';
        } else if (matchDateOnly.getTime() === yesterdayOnly.getTime()) {
            return 'Yesterday';
        } else {
            return matchDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    // Format match time
    const formatMatchTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatLeagueName = (name: string): string => {
        if (!name) return '';

        // Capitalize first letter of the name
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        // Get first letter of each word and join them
        const words = name.split(' ');
        const initials = words.map(word => word.charAt(0).toUpperCase()).join('');

        // Return formatted name with initials in brackets
        return `${capitalizedName} (${initials})`;
    };

    const formatMatchName = (name: string): string => {
        if (!name) return '';
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return `${capitalizedName}`;
    };

    // --- Sorting helpers: numeric index desc with date fallback ---
    const getNumericIndex = (m: Match): number | undefined => {
        const keys = ['matchNumber', 'match_no', 'matchIndex', 'index', 'matchNo', 'no'] as const;
        const rec = m as unknown as Record<string, unknown>;
        for (const k of keys) {
            const v = rec[k];
            if (typeof v === 'number' && !Number.isNaN(v)) return v;
            if (typeof v === 'string') {
                const n = parseInt(v, 10);
                if (!Number.isNaN(n)) return n;
            }
        }
        return undefined;
    };

    const getBestDateMs = (m: Match): number => {
        const candidates: Array<string | Date | undefined | null> = [m.date, m.end, m.start, m.updatedAt, m.createdAt];
        for (const c of candidates) {
            if (!c) continue;
            const t = new Date(c).getTime();
            if (!Number.isNaN(t)) return t;
        }
        return 0;
    };

    const compareMatchesDesc = (a: Match, b: Match): number => {
        const ai = getNumericIndex(a);
        const bi = getNumericIndex(b);
        if (ai !== undefined && bi !== undefined) return bi - ai; // larger index first
        if (ai !== undefined) return -1; // known index before unknown
        if (bi !== undefined) return 1;
        // fallback to date: latest first
        return getBestDateMs(b) - getBestDateMs(a);
    };

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                    py: { xs: 2, md: 4 },
                    px: { xs: 1, md: 0 },
                    background: 'transparent',
                    backgroundAttachment: 'fixed',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <Button
                        startIcon={<ArrowLeft />}
                        onClick={handleBackToAllLeagues}
                        sx={{
                            mb: 2, color: 'white', backgroundColor: '#388e3c',
                            '&:hover': { backgroundColor: '#388e3c' },
                        }}
                    >
                        Back to All Leagues
                    </Button>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {error}
                    </Typography>
                </Container>
            </Box>
        );
    }

    // Add this component before the main return statement

    // const MatchDetailModal = ({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match | null }) => {
    //     if (!match) return null;

    //     return (
    //         <Dialog
    //             open={open}
    //             onClose={onClose}
    //             fullWidth
    //             maxWidth="sm"
    //             PaperProps={{
    //                 sx: {
    //                     bgcolor: 'rgba(15,15,15,0.95)',
    //                     color: '#E5E7EB',
    //                     borderRadius: 3,
    //                     border: '1px solid rgba(255,255,255,0.1)',
    //                     backdropFilter: 'blur(20px)',
    //                     boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    //                     overflow: 'hidden',
    //                 },
    //             }}
    //         >
    //             <DialogTitle
    //                 sx={{
    //                     fontWeight: 'bold',
    //                     position: 'relative',
    //                     color: '#E5E7EB',
    //                     background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
    //                     borderBottom: '1px solid rgba(255,255,255,0.1)',
    //                     py: 2.5
    //                 }}
    //             >
    //                 Match Details
    //                 <IconButton
    //                     aria-label="close"
    //                     onClick={onClose}
    //                     sx={{
    //                         position: 'absolute',
    //                         right: 8,
    //                         top: 8,
    //                         color: '#9CA3AF',
    //                         '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
    //                     }}
    //                 >
    //                     <CloseIcon />
    //                 </IconButton>
    //             </DialogTitle>

    //             <DialogContent sx={{ p: 0 }}>
    //                 {/* Match Header */}
    //                 <Box sx={{ 
    //                     p: 3, 
    //                     background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
    //                     color: 'white'
    //                 }}>
    //                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    //                         {/* Home Team */}
    //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //                             <Image
    //                                 src={match.homeTeamImage || homeImg}
    //                                 alt={match.homeTeamName}
    //                                 width={32}
    //                                 height={32}
    //                                 style={{ borderRadius: '4px' }}
    //                             />
    //                             <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
    //                                 {formatMatchName(match.homeTeamName)}
    //                             </Typography>
    //                             {match.status === 'completed' && (
    //                                 <Typography variant="h5" sx={{ fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>
    //                                     {match.homeTeamGoals || 0}
    //                                 </Typography>
    //                             )}
    //                         </Box>

    //                         {/* VS Divider */}
    //                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
    //                             <Typography variant="body2" sx={{ 
    //                                 backgroundColor: 'rgba(255,255,255,0.2)', 
    //                                 px: 2, 
    //                                 py: 0.5, 
    //                                 borderRadius: 2,
    //                                 fontWeight: 'bold'
    //                             }}>
    //                                 VS
    //                             </Typography>
    //                         </Box>

    //                         {/* Away Team */}
    //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //                             <Image
    //                                 src={match.awayTeamImage || awayImg}
    //                                 alt={match.awayTeamName}
    //                                 width={32}
    //                                 height={32}
    //                                 style={{ borderRadius: '4px' }}
    //                             />
    //                             <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
    //                                 {formatMatchName(match.awayTeamName)}
    //                             </Typography>
    //                             {match.status === 'completed' && (
    //                                 <Typography variant="h5" sx={{ fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>
    //                                     {match.awayTeamGoals || 0}
    //                                 </Typography>
    //                             )}
    //                         </Box>
    //                     </Box>
    //                 </Box>

    //                 {/* Match Info */}
    //                 <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
    //                     {/* Date & Time */}
    //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //                         <Calendar size={20} color="#E5E7EB" />
    //                         <Box>
    //                             <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
    //                                 Date & Time
    //                             </Typography>
    //                             <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
    //                                 {formatMatchDate(match.date)} at {formatMatchTime(match.date)}
    //                             </Typography>
    //                         </Box>
    //                     </Box>

    //                     {/* Location */}
    //                     {match.location && (
    //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //                             <Box sx={{ 
    //                                 width: 20, 
    //                                 height: 20, 
    //                                 display: 'flex', 
    //                                 alignItems: 'center', 
    //                                 justifyContent: 'center' 
    //                             }}>
    //                                 📍
    //                             </Box>
    //                             <Box>
    //                                 <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
    //                                     Location
    //                                 </Typography>
    //                                 <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
    //                                     {match.location}
    //                                 </Typography>
    //                             </Box>
    //                         </Box>
    //                     )}

    //                     {/* Status */}
    //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //                         <Box sx={{ 
    //                             width: 20, 
    //                             height: 20, 
    //                             display: 'flex', 
    //                             alignItems: 'center', 
    //                             justifyContent: 'center' 
    //                         }}>
    //                             {match.status === 'completed' ? '✅' : match.status === 'ongoing' ? '⚡' : '⏰'}
    //                         </Box>
    //                         <Box>
    //                             <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
    //                                 Status
    //                             </Typography>
    //                             <Chip 
    //                                 label={match.status === 'completed' ? 'Completed' : match.status === 'ongoing' ? 'Live' : 'Scheduled'}
    //                                 size="small"
    //                                 sx={{
    //                                     backgroundColor: match.status === 'completed' ? '#16a34a' : match.status === 'ongoing' ? '#ea580c' : '#0388E3',
    //                                     color: 'white',
    //                                     fontWeight: 'bold',
    //                                     fontSize: '0.75rem'
    //                                 }}
    //                             />
    //                         </Box>
    //                     </Box>

    //                     {/* Availability Info for Scheduled Matches */}
    //                     {match.status === 'scheduled' && (
    //                         <Box sx={{ 
    //                             mt: 2, 
    //                             p: 2, 
    //                             backgroundColor: 'rgba(255,255,255,0.05)', 
    //                             borderRadius: 2,
    //                             border: '1px solid rgba(255,255,255,0.1)'
    //                         }}>
    //                             <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
    //                                 Player Availability
    //                             </Typography>
    //                             <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    //                                 <Chip 
    //                                     label={`Available: ${getAvailabilityCounts(match).availableCount}`}
    //                                     size="small"
    //                                     sx={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}
    //                                 />
    //                                 <Chip 
    //                                     label={`Pending: ${getAvailabilityCounts(match).pendingCount}`}
    //                                     size="small"
    //                                     sx={{ backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' }}
    //                                 />
    //                             </Box>
    //                         </Box>
    //                     )}
    //                 </Box>
    //             </DialogContent>

    //             <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
    //                 <Button
    //                     onClick={onClose}
    //                     variant="outlined"
    //                     sx={{
    //                         color: '#E5E7EB',
    //                         borderColor: 'rgba(255,255,255,0.2)',
    //                         '&:hover': {
    //                             backgroundColor: 'rgba(255,255,255,0.05)',
    //                             borderColor: 'rgba(255,255,255,0.3)'
    //                         }
    //                     }}
    //                 >
    //                     Close
    //                 </Button>
    //                 <Link href={`/match/${match.id}`} passHref>
    //                     <Button
    //                         variant="contained"
    //                         sx={{
    //                             backgroundColor: '#0388E3',
    //                             '&:hover': { backgroundColor: '#0369a1' }
    //                         }}
    //                     >
    //                         View Full Details
    //                     </Button>
    //                 </Link>
    //             </DialogActions>
    //         </Dialog>
    //     );
    // };

    // Replace your MatchDetailModal component with this updated version

    const MatchDetailModal = ({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match | null }) => {
        if (!match) return null;

        return (
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md" // Changed to md for more width
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(15,15,15,0.95)',
                        color: '#E5E7EB',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 'bold',
                        position: 'relative',
                        color: '#E5E7EB',
                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        py: 2.5
                    }}
                >
                    Match Details
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: '#9CA3AF',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {/* Match Header - Teams Side by Side */}
                    <Box sx={{
                        p: 3,
                        background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                        color: 'white'
                    }}>
                        {/* Teams in a row layout */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {/* Home Team */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flex: 1,
                                minWidth: 0 // Prevent overflow
                            }}>
                                <Image
                                    src={match.homeTeamImage || homeImg}
                                    alt={match.homeTeamName}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '6px', flexShrink: 0 }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {formatMatchName(match.homeTeamName)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            opacity: 0.8,
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Home
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Score Section */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flexShrink: 0
                            }}>
                                {match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2
                                    }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {match.homeTeamGoals || 0}
                                        </Typography>
                                        <Typography variant="h6" sx={{ opacity: 0.7 }}>
                                            -
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {match.awayTeamGoals || 0}
                                        </Typography>
                                    </Box>
                                )}
                                {match.status === 'SCHEDULED' && (
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            VS
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Away Team */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flex: 1,
                                flexDirection: 'row-reverse', // Reverse order for visual balance
                                minWidth: 0
                            }}>
                                <Image
                                    src={match.awayTeamImage || awayImg}
                                    alt={match.awayTeamName}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '6px', flexShrink: 0 }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {formatMatchName(match.awayTeamName)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            opacity: 0.8,
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Away
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Match Info */}
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Date & Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Calendar size={20} color="#E5E7EB" />
                            <Box>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                    Date & Time
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
                                    {formatMatchDate(match.date)} at {formatMatchTime(match.date)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Location */}
                        {match.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    📍
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                        Location
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#E5E7EB', fontWeight: 'bold' }}>
                                        {match.location}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' ? '✅' : match.status === 'ongoing' ? '⚡' : '⏰'}
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                                    Status
                                </Typography>
                                <Chip
                                    label={match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' ? 'RESULT_PUBLISHED' : match.status === 'ongoing' ? 'Live' : 'SCHEDULED'}
                                    size="small"
                                    sx={{
                                        backgroundColor: match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_PUBLISHED' ? '#16a34a' : match.status === 'ongoing' ? '#ea580c' : '#0388E3',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Availability Info for Scheduled Matches */}
                        {match.status === 'SCHEDULED' && (
                            <Box sx={{
                                mt: 2,
                                p: 2,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
                                    Player Availability
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Available: ${getAvailabilityCounts(match).availableCount}`}
                                        size="small"
                                        sx={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}
                                    />
                                    <Chip
                                        label={`Pending: ${getAvailabilityCounts(match).pendingCount}`}
                                        size="small"
                                        sx={{ backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            color: '#E5E7EB',
                            borderColor: 'rgba(255,255,255,0.2)',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderColor: 'rgba(255,255,255,0.3)'
                            }
                        }}
                    >
                        Close
                    </Button>
                    <Link href={`/match/${match.id}`} passHref>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: '#0388E3',
                                '&:hover': { backgroundColor: '#0369a1' }
                            }}
                        >
                            View Full Details
                        </Button>
                    </Link>
                </DialogActions>
            </Dialog>
        );
    };

    // Add these handlers before the return statement

    const handleRequestDeleteMatch = (match: Match) => {
        setMatchPendingDelete(match);
        setConfirmDeleteOpen(true);
    };

    // const handleConfirmDeleteMatch = async () => {
    //     if (!matchPendingDelete || !token || !league) return;
    //     const m = matchPendingDelete;
    //     setConfirmDeleteOpen(false);

    //     const hasScores = (m.homeTeamGoals ?? 0) > 0 ||
    //                       (m.awayTeamGoals ?? 0) > 0 ||
    //                       m.status === 'completed';

    //     try {
    //         if (hasScores) {
    //             // Archive
    //             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
    //                 method: 'PATCH',
    //                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ archived: true })
    //             });
    //             if (!res.ok) throw new Error('Failed to archive match');

    //             setLeague(prev => prev ? {
    //                 ...prev,
    //                 matches: prev.matches.map(mm => mm.id === m.id ? { ...mm, archived: true } : mm)
    //             } : prev);
    //             setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
    //             setToastMessage('Match archived. (Canceled by Admin)');
    //         } else {
    //             // Hard delete
    //             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
    //                 method: 'DELETE',
    //                 headers: { 'Authorization': `Bearer ${token}` }
    //             });
    //             if (!res.ok) throw new Error('Failed to delete match');

    //             setLeague(prev => prev ? {
    //                 ...prev,
    //                 matches: prev.matches.filter(mm => mm.id !== m.id)
    //             } : prev);
    //             setUndoInfo({ match: m, action: 'delete' });
    //             setToastMessage('Match deleted.');
    //         }
    //     } catch (e) {
    //         console.error(e);
    //         toast.error('Delete/Archive failed');
    //     } finally {
    //         setMatchPendingDelete(null);
    //     }
    // };

    // Replace the existing handleConfirmDeleteMatch function with this:

    const handleConfirmDeleteMatch = async () => {
        if (!matchPendingDelete || !token || !league) return;
        const m = matchPendingDelete;
        setConfirmDeleteOpen(false);

        const hasScores = (m.homeTeamGoals ?? 0) > 0 ||
            (m.awayTeamGoals ?? 0) > 0 ||
            ((m.status ?? '') === 'RESULT_PUBLISHED');

        try {
            if (hasScores) {
                // Archive the match
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: true })
                });

                if (!res.ok) {
                    const errorData = await res.text();
                    console.error('Archive failed:', errorData);
                    throw new Error('Failed to archive match');
                }

                const data = await res.json();
                console.log('Archive response:', data); // Debug log

                // Update local state
                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).map(mm =>
                        mm.id === m.id ? { ...mm, archived: true } : mm
                    )
                } : prev);

                setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
                setToastMessage('Match archived (Canceled by Admin)');

            } else {
                // Hard delete
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to delete match');

                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).filter(mm => mm.id !== m.id)
                } : prev);

                setUndoInfo({ match: m, action: 'delete' });
                setToastMessage('Match deleted permanently');
            }

            // Refresh league data to ensure sync
            fetchLeagueDetails();

        } catch (e) {
            console.error('Delete/Archive operation failed:', e);
            toast.error(`Failed to ${hasScores ? 'archive' : 'delete'} match`);
        } finally {
            setMatchPendingDelete(null);
        }
    };

    // ...existing code...
    // const handleConfirmDeleteMatch = async () => {
    //     if (!matchPendingDelete || !token || !league) return;
    //     const m = matchPendingDelete;
    //     setConfirmDeleteOpen(false);

    //     try {
    //         const hasStats = await getHasStats(m.id);

    //         if (hasStats) {
    //             // Archive the match if any player stats exist
    //             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
    //                 method: 'PATCH',
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`,
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({ archived: true })
    //             });

    //             if (!res.ok) {
    //                 const errorData = await res.text();
    //                 console.error('Archive failed:', errorData);
    //                 throw new Error('Failed to archive match');
    //             }

    //             setLeague(prev => prev ? {
    //                 ...prev,
    //                 matches: prev.matches.map(mm =>
    //                     mm.id === m.id ? { ...mm, archived: true } : mm
    //                 )
    //             } : prev);

    //             setUndoInfo({ match: { ...m, archived: true }, action: 'archive' });
    //             setToastMessage('Match archived (Canceled by Admin)');
    //         } else {
    //             // Permanently delete if no player stats exist
    //             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${m.id}`, {
    //                 method: 'DELETE',
    //                 headers: { 'Authorization': `Bearer ${token}` }
    //             });

    //             if (!res.ok) throw new Error('Failed to delete match');

    //             setLeague(prev => prev ? {
    //                 ...prev,
    //                 matches: prev.matches.filter(mm => mm.id !== m.id)
    //             } : prev);

    //             setUndoInfo({ match: m, action: 'delete' });
    //             setToastMessage('Match deleted permanently');
    //         }

    //         // Refresh league data to ensure sync
    //         fetchLeagueDetails();

    //     } catch (e) {
    //         console.error('Delete/Archive operation failed:', e);
    //         toast.error('Failed to process match delete/archive');
    //     } finally {
    //         setMatchPendingDelete(null);
    //     }
    // };
    // ...existing code...


    // const handleUndo = async () => {
    //     if (!undoInfo || !token) return;
    //     const { match, action } = undoInfo;
    //     try {
    //         if (action === 'archive') {
    //             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
    //                 method: 'PATCH',
    //                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ archived: false })
    //             });
    //             if (!res.ok) throw new Error('Failed to restore');

    //             setLeague(prev => prev ? {
    //                 ...prev,
    //                 matches: prev.matches.map(mm => mm.id === match.id ? { ...mm, archived: false } : mm)
    //             } : prev);
    //             setToastMessage('Match restored.');
    //         } else {
    //             toast.error('Undo not available for permanent delete.');
    //         }
    //     } catch {
    //         toast.error('Undo failed');
    //     } finally {
    //         setUndoInfo(null);
    //     }
    // };

    const handleUndo = async () => {
        if (!undoInfo || !token) return;
        const { match, action } = undoInfo;

        try {
            if (action === 'archive') {
                // Restore archived match
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ archived: false })
                });

                if (!res.ok) {
                    throw new Error('Failed to restore match');
                }

                const data = await res.json();
                console.log('Restore response:', data);

                // Update local state
                setLeague(prev => prev ? {
                    ...prev,
                    matches: (prev.matches ?? []).map(mm =>
                        mm.id === match.id ? { ...mm, archived: false } : mm
                    )
                } : prev);

                setToastMessage('Match restored successfully.');
                toast.success('Match restored successfully!');

            } else if (action === 'delete') {
                // For permanent deletes, we can't undo - but we can recreate if we have the data
                toast.error('Cannot undo permanent deletion. Match data is permanently lost.');
            }

            // Refresh data to ensure sync
            fetchLeagueDetails();

        } catch (error) {
            console.error('Undo operation failed:', error);
            toast.error('Failed to undo the action');
        } finally {
            setUndoInfo(null);
        }
    };

    // Add this handler before the return statement

    const handleMatchCardClick = (match: Match, event: React.MouseEvent) => {
        // Prevent opening modal if clicking on buttons
        const target = event.target as HTMLElement;
        const isButton = target.closest('button') || target.closest('a');

        if (!isButton) {
            setSelectedMatchDetail(match);
            setMatchDetailModalOpen(true);
        }
    };

    // Archive match (scores exist)
    // const archiveMatch = async (matchId: string, archived: boolean) => {
    //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`, {
    //         method: 'PATCH',
    //         headers: {
    //             'Authorization': `Bearer ${token}`,
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ archived })
    //     });
    //     return response.json();
    // };

    // Delete match (no scores)
    // const deleteMatch = async (matchId: string) => {
    //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`, {
    //         method: 'DELETE',
    //         headers: {
    //             'Authorization': `Bearer ${token}`
    //         }
    //     });
    //     return response.json();
    // };

    // Usage in your component:
    // const handleDeleteMatch = async (match: Match) => {
    //     const hasScores = (match.homeTeamGoals || 0) > 0 ||
    //         (match.awayTeamGoals || 0) > 0 ||
    //         match.status === 'completed' || match.status === 'RESULT_PUBLISHED';

    //     try {
    //         if (hasScores) {
    //             await archiveMatch(match.id, true);
    //             toast.success('Match archived successfully');
    //         } else {
    //             await deleteMatch(match.id);
    //             toast.success('Match deleted successfully');
    //         }
    //         // Refresh data - FIXED: Use fetchLeagueDetails instead of fetchMatches
    //         fetchLeagueDetails();
    //     } catch (error) {
    //         toast.error('Failed to delete/archive match');
    //     }
    // };


    // Add these functions before your return statement

    // const handlePermanentDelete = async (match: Match) => {
    //     if (!window.confirm('Are you sure you want to PERMANENTLY delete this match? This action cannot be undone and all match data will be lost forever.')) {
    //         return;
    //     }

    //     try {
    //         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
    //             method: 'DELETE',
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });

    //         if (!res.ok) {
    //             throw new Error('Failed to permanently delete match');
    //         }

    //         // Remove from local state
    //         setLeague(prev => prev ? {
    //             ...prev,
    //             matches: prev.matches.filter(mm => mm.id !== match.id)
    //         } : prev);

    //         toast.success('Match permanently deleted');
    //         fetchLeagueDetails();

    //     } catch (error) {
    //         console.error('Permanent delete failed:', error);
    //         toast.error('Failed to permanently delete match');
    //     }
    // };

    // ...existing code...

    // ...existing code...

    const handleRestoreMatch = async (match: Match) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ archived: false })
            });

            if (!res.ok) {
                throw new Error('Failed to restore match');
            }

            // Update local state
            setLeague(prev => prev ? {
                ...prev,
                matches: prev.matches.map(mm =>
                    mm.id === match.id ? { ...mm, archived: false } : mm
                )
            } : prev);

            toast.success('Match restored successfully');
            fetchLeagueDetails();

        } catch (error) {
            console.error('Restore failed:', error);
            toast.error('Failed to restore match');
        }
    };


    // Add this new dialog before your return statement
    // const ArchivedMatchActionDialog = ({ open, onClose, match }: { 
    //     open: boolean; 
    //     onClose: () => void; 
    //     match: Match | null 
    // }) => {
    //     if (!match) return null;

    //     return (
    //         <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    //             <DialogTitle sx={{ fontWeight: 'bold', color: '#E5E7EB', bgcolor: 'rgba(15,15,15,0.95)' }}>
    //                 Archived Match Actions
    //             </DialogTitle>
    //             <DialogContent sx={{ bgcolor: 'rgba(15,15,15,0.95)', color: '#E5E7EB' }}>
    //                 <Typography variant="body1" sx={{ mb: 2 }}>
    //                     This match is currently archived. What would you like to do?
    //                 </Typography>
    //                 <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
    //                     • <strong>Restore:</strong> Bring the match back to active status
    //                 </Typography>
    //                 <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
    //                     • <strong>Permanently Delete:</strong> Remove all match data forever (cannot be undone)
    //                 </Typography>
    //             </DialogContent>
    //             <DialogActions sx={{ bgcolor: 'rgba(15,15,15,0.95)', gap: 1 }}>
    //                 <Button onClick={onClose} variant="outlined" sx={{ color: '#E5E7EB', borderColor: 'rgba(255,255,255,0.2)' }}>
    //                     Cancel
    //                 </Button>
    //                 <Button 
    //                     onClick={() => {
    //                         handleRestoreMatch(match);
    //                         onClose();
    //                     }}
    //                     variant="contained" 
    //                     sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
    //                     startIcon={<Undo2 size={16} />}
    //                 >
    //                     Restore Match
    //                 </Button>
    //                 <Button 
    //                     onClick={() => {
    //                         handlePermanentDelete(match);
    //                         onClose();
    //                     }}
    //                     variant="contained" 
    //                     color="error"
    //                     startIcon={<Trash2 size={16} />}
    //                 >
    //                     Permanently Delete
    //                 </Button>
    //             </DialogActions>
    //         </Dialog>
    //     );
    // };




    const resultColor = (r?: string) => (r === 'W' ? '#16a34a' : r === 'L' ? '#dc2626' : '#64748b');

    const getShirtNumber = (p: User & PlayerProfileLike) => {
        const member = league?.members.find((m: User) => m.id === p.id);
        const sn = p.shirtNumber ?? member?.shirtNumber;
        if (sn === null || sn === undefined) return '';
        const s = typeof sn === 'string' ? sn : String(sn);
        return s.length > 0 ? s : '';
    };
    const getPreferredFoot = (u?: PlayerProfileLike): Foot => {
        const v = (u?.preferredFoot ?? '').toString().toLowerCase();
        if (v === 'left' || v === 'l') return 'L';
        if (v === 'right' || v === 'r') return 'R';
        return 'R';
    };
    const getProfileImage = (p: User & PlayerProfileLike) => p.profilePicture ?? '';
    const posToShort = (pos?: string): ShortPosition => {
        const p = (pos ?? '').toLowerCase();
        if (p.includes('keeper') || p === 'gk') return 'GK';
        if (p.includes('def')) return 'DF';
        if (p.includes('mid')) return 'MF';
        if (p.includes('wing')) return 'WG';
        if (p.includes('striker') || p.includes('forward') || p === 'st' || p === 'cf') return 'ST';
        return 'ST';
    };
    // Helpers for PlayerCard (backend-only data
    const openQuickViewFromTable = async (leagueId: string, playerId: string) => {
        if (!leagueId || !playerId || !token) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${encodeURIComponent(leagueId)}/player/${encodeURIComponent(playerId)}/quick-view`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (!res.ok || !data?.success) return;
            const player: User & PlayerProfileLike = {
                id: String(data.player?.id ?? playerId),
                firstName: data.player?.firstName ?? '',
                lastName: data.player?.lastName ?? '',
                email: '',
                xp: Number(data.player?.xp ?? 0),
                position: data.player?.position ?? undefined,
                profilePicture: data.player?.profilePicture ?? null,
                preferredFoot: data.player?.preferredFoot ?? null,
                shirtNumber: data.player?.shirtNumber ?? null,
                positionType: undefined,
            };
            setQuickView({
                player,
                league,
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
            });
            setOpenQuickView(true);
        } catch {
            // silent
        }
    };



    return (
        <Box
            sx={{
                minHeight: '100vh',
                fontFamily: 'Sailec, Geist, Roboto, Arial, sans-serif',
                py: { xs: 2, md: 4 },
                px: { xs: 1, md: 0 },
                background: 'transparent',
                backgroundAttachment: 'fixed',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* <Box sx={{ ml:5}}> */}
            {/* </Box> */}
            <Container maxWidth="lg">
                {/* Close Button */}
                <CloseButton fallbackRoute="/dashboard" />
                {/* Show page structure immediately */}

                {/* Access control for non-members - only show when league data is available */}
                {league && !isMember && !hasCommonLeague ? (
                    <Box sx={{ p: 4, minHeight: '100vh' }}>
                        <Typography color="error" variant="h6">
                            You don&apos;t have access to this league.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* League inactive warning - only show when league data is available */}
                        {league && !league.active && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                This league is currently inactive. All actions are disabled until an admin reactivates it.
                            </Alert>
                        )}

                        {/* Back Button */}
                        {/* <Button
                            startIcon={<ArrowLeft />}
                            onClick={handleBackToAllLeagues}
                            sx={{
                                mb: 2, color: 'white', backgroundColor: '#388e3c',
                                '&:hover': { backgroundColor: '#388e3c' },
                                borderRadius: 2
                            }}
                        >
                            Back to All Leagues
                        </Button> */}

                        {/* Header */}
                        <Box sx={{ mb: 4 }}>
                            <Paper sx={{
                                p: 3,
                                // background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                                color: 'white',
                                borderRadius: 3,
                                // border: '2px solid rgba(59, 130, 246, 0.3)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexDirection: { xs: 'column', md: 'row' },
                                        justifyContent: { xs: 'center', md: 'space-between' },
                                        mb: 2,
                                        gap: { xs: 2, md: 0 }
                                    }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        flex: 1,
                                        minWidth: 0,
                                        justifyContent: { xs: 'flex-start', md: 'flex-start' }
                                    }}>
                                        <Trophy size={32} />
                                        {league ? (
                                            <Button
                                                onClick={handleLeaguesDropdownOpen}
                                                sx={{
                                                    textTransform: 'uppercase',
                                                    fontSize: { xs: '1rem', sm: '1.5rem', md: '1.4rem' },
                                                    fontWeight: 'bold',
                                                    lineHeight: 1.2,
                                                    wordBreak: 'break-word',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'wrap',
                                                    flexShrink: 1,
                                                    minWidth: 0,
                                                    textAlign: { xs: 'left', md: 'left' },
                                                    color: 'white',
                                                    backgroundColor: '#2B2B2B',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    py: 1,
                                                    '&:hover': {
                                                        backgroundColor: '#2B2B2B',
                                                    },
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    // border: '1px solid rgba(255,255,255,0.3)',
                                                }}
                                                endIcon={<ChevronDown size={20} />}
                                            >
                                                {formatLeagueName(league.name)}
                                            </Button>
                                        ) : (
                                            <Typography
                                                sx={{
                                                    textTransform: 'uppercase',
                                                    fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                }}
                                            >
                                                Loading...
                                            </Typography>
                                        )}

                                        {/* Leagues Dropdown Menu */}
                                        <Menu
                                            anchorEl={leaguesDropdownAnchor}
                                            open={leaguesDropdownOpen}
                                            onClose={handleLeaguesDropdownClose}
                                            PaperProps={{
                                                sx: {
                                                    p: 0.5,
                                                    mt: 1,
                                                    minWidth: 240,
                                                    bgcolor: 'rgba(15,15,15,0.92)',
                                                    color: '#E5E7EB',
                                                    borderRadius: 2.5,
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
                                                    overflow: 'hidden',

                                                }
                                            }}
                                        >
                                            {[...allLeagues].sort((a, b) => {
                                                const an = (a?.name ?? '').toString().trim().toLowerCase();
                                                const bn = (b?.name ?? '').toString().trim().toLowerCase();
                                                if (an < bn) return -1;
                                                if (an > bn) return 1;
                                                return String(a.id).localeCompare(String(b.id));
                                            }).map((leagueItem) => (
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

                                                        background: leagueItem.id === leagueId ? 'linear-gradient(90deg, rgba(3,136,227,0.25) 0%, rgba(3,136,227,0.10) 100%)' : 'transparent',
                                                        border: leagueItem.id === leagueId ? '1px solid rgba(3,136,227,0.35)' : 'none',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                                        },

                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <Trophy size={16} color={leagueItem.id === leagueId ? '#FFFFFF' : '#9CA3AF'} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={leagueItem.name}
                                                        sx={{
                                                            '& .MuiListItemText-primary': {
                                                                fontSize: '0.95rem',
                                                                fontWeight: leagueItem.id === leagueId ? 700 : 500,
                                                                letterSpacing: 0.2,
                                                                color: leagueItem.id === leagueId ? '#FFFFFF' : '#E5E7EB'
                                                            }
                                                        }}
                                                    />
                                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {/* {leagueItem.id === leagueId && (
                                                            <Box
                                                                sx={{
                                                                    px: 1,
                                                                    py: 0.25,
                                                                    bgcolor: '#0388E3',
                                                                    color: 'white',
                                                                    borderRadius: '9999px',
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    letterSpacing: 0.3,
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                Current
                                                            </Box>
                                                        )} */}
                                                        {leagueItem.userRole && (
                                                            <Box
                                                                sx={{
                                                                    px: 1,
                                                                    py: 0.25,
                                                                    bgcolor: leagueItem.userRole === 'ADMIN' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                                                                    color: leagueItem.userRole === 'ADMIN' ? '#1F2937' : '#FFFFFF',
                                                                    borderRadius: '9999px',
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    letterSpacing: 0.3,
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                {leagueItem.userRole === 'ADMIN' ? 'Admin' : 'Member'}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </Box>

                                    {/* Right side controls */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            flexWrap: 'nowrap',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                            ml: { xs: 0, md: 'auto' },
                                            mt: { xs: 1, md: 0 },
                                            width: { xs: 'auto', md: 'auto' },
                                            justifyContent: { xs: 'flex-end', md: 'flex-end' },
                                        }}
                                    >
                                        {isMember && (
                                            <Chip
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                                                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                                                            {`Code: ${league.inviteCode}`}
                                                        </Typography>
                                                        <Chip
                                                            label={<Copy size={14} className='stroke-white' />}
                                                            onClick={() => navigator.clipboard.writeText(league.inviteCode)}
                                                            sx={{
                                                                backgroundColor: '#2B2B2B',
                                                                '&:hover': { backgroundColor: '#2B2B2B' },
                                                                minWidth: 'auto',
                                                                height: '40px',
                                                                display: 'inline-flex',
                                                                '& .MuiChip-label': { px: 0.5 },



                                                                //  borderRadius: '4px', 
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                                sx={{
                                                    backgroundColor: '#2B2B2B',
                                                    '&:hover': { backgroundColor: '#2B2B2B' },
                                                    color: 'white',
                                                    maxWidth: { xs: '160px', sm: '180px' },
                                                    width: 'auto',
                                                    minWidth: 'auto',
                                                    height: 'auto',
                                                    borderRadius: '7px',
                                                    whiteSpace: 'nowrap',
                                                    display: 'inline-flex'
                                                }}
                                            />
                                        )}
                                        {/* {isAdmin && (
                                            <IconButton
                                                onClick={() => setIsSettingsOpen(true)}
                                                sx={{
                                                    ml: 0.5,
                                                    color: 'white',
                                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                                                    p: 1,
                                                    flexShrink: 0
                                                }}
                                            >
                                                <Settings size={20} />
                                            </IconButton>
                                        )} */}
                                        <IconButton
                                            onClick={() => {
                                                const isAdmin = (league?.adminId || league?.administrators?.[0]?.id) === (user?.id || '')
                                                if (isAdmin) {
                                                    setIsSettingsOpen(true)
                                                } else {
                                                    // Non-admins: open the Players view (similar to members dialog)
                                                    if (league) handleOpenMembers(league!)
                                                }
                                            }}
                                            sx={{
                                                ml: 0.5,
                                                color: 'white',
                                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                                                p: 1,
                                                flexShrink: 0
                                            }}
                                        >
                                            <Settings size={20} />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Navigation Tabs - UEFA Style */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 0,
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: { xs: 'center', sm: 'flex-start' },
                                        borderBottom: '2px solid rgba(255,255,255,0.3)',
                                        mt: 2
                                    }}
                                >

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'table' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            // Check if points are disabled
                                            // if (league?.showPoints === false) {
                                            //     setShowPointsAlert(true);
                                            //     return;
                                            // }
                                            setSection('table');
                                            router.replace(`/league/${leagueId}?tab=table`);
                                        }}
                                    >
                                        League Table
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'results' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('results');
                                            router.replace(`/league/${leagueId}?tab=results`);
                                        }}
                                    >
                                        Match Results
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'matches' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('matches');
                                            router.replace(`/league/${leagueId}?tab=matches`);
                                        }}
                                    >
                                        Fixtures
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'awards' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('awards');
                                            router.replace(`/league/${leagueId}?tab=awards`);
                                        }}
                                    >
                                        Awards
                                    </Button>

                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'white',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            px: { xs: 2, sm: 3, md: 4 },
                                            py: 1.5,
                                            minWidth: 'auto',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            borderBottom: section === 'members' ? '3px solid white' : '3px solid transparent',
                                            borderRadius: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderBottom: '3px solid rgba(255,255,255,0.7)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSection('members');
                                            router.replace(`/league/${leagueId}?tab=members`);
                                        }}
                                    >
                                        Players
                                    </Button>

                                    {isAdmin && (
                                        <Link href={`/league/${leagueId}/match`} passHref>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                                                    color: 'white',
                                                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                    px: { xs: 1.5, sm: 2 },
                                                    py: 0.5,
                                                    minWidth: 'auto',
                                                    ml: 2,
                                                    fontWeight: 'bold',
                                                    textTransform: 'none',
                                                    mb: { xs: 2, sm: 2, md: 0 }
                                                }}
                                                startIcon={<Calendar size={16} className='stroke-white' />}
                                                disabled={!league.active}
                                            >
                                                Schedule Match
                                            </Button>
                                        </Link>
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                        {/* Section Content */}
                        <Paper sx={{
                            // backgroundColor: '#388e3c',
                            // backgroundColor: '#43a047',
                            // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                            // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                            background: 'none',
                            color: 'white',
                            minHeight: 400,
                            // backdropFilter: 'blur(10px)',
                            // border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 3,
                            boxShadow: 'none',
                            mt: 1.2,
                            // backdropFilter: 'blur(10px)'
                        }}>
                            {section === 'members' && (
                                // Members Section
                                <Box sx={{
                                    mt: 3, p: 0, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
                                    // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                                    background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                    backdropFilter: 'blur(10px)',
                                    // border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 3,

                                }}>
                                    {league?.members && league.members.length > 0 && (
                                        <Box sx={{
                                            display: 'grid',
                                            gap: 2
                                        }}>
                                            <Paper elevation={0} sx={{
                                                p: { xs: 1, sm: 0 },
                                                borderRadius: { xs: 2, sm: 3 },
                                                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                // backgroundColor: 'transparent',
                                                minHeight: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}>
                                                {/* Header */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 }, mb: 1, mt: 2 }}>
                                                    <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, flex: 1, ml: 3 }}>Name</Typography>
                                                    <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 } }}>
                                                        {/* <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 }, mr: 10 }}>Position</Typography> */}
                                                        <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Stats</Typography>
                                                        <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>Xp Points</Typography>
                                                        {/* <Typography sx={{ color: ' #fff', fontWeight: 'bold', fontSize: { xs: 12, sm: 16 } }}>shirtNumber</Typography> */}
                                                    </Box>
                                                </Box>

                                                <Box sx={{
                                                    flex: 1,
                                                    overflow: 'auto',
                                                    borderRadius: { xs: 2, sm: 3 },
                                                    '&::-webkit-scrollbar': {
                                                        display: 'none'
                                                    },
                                                    scrollbarWidth: 'none',
                                                    msOverflowStyle: 'none',
                                                    px: { xs: 0, sm: 1 },
                                                    mt: 0.7
                                                }}>
                                                    <List>
                                                        {[...league.members]
                                                            .sort((a: User, b: User) => {
                                                                const xpA = a?.xp ?? 0;
                                                                const xpB = b?.xp ?? 0;
                                                                if (xpB !== xpA) return xpB - xpA; // Desc by points
                                                                // Stable tie-breaker by name to avoid flicker
                                                                const nameA = `${a?.firstName ?? ''} ${a?.lastName ?? ''}`.toLowerCase();
                                                                const nameB = `${b?.firstName ?? ''} ${b?.lastName ?? ''}`.toLowerCase();
                                                                return nameA.localeCompare(nameB);
                                                            })
                                                            .map((member) => (
                                                                <React.Fragment key={member.id}>
                                                                    <ListItem
                                                                        onClick={() => {
                                                                            router.push(`/player/${member.id}`);
                                                                        }}
                                                                        sx={{
                                                                            // boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                                            cursor: 'pointer',
                                                                            py: { xs: 1, sm: 2 },
                                                                            px: { xs: 1, sm: 2 },
                                                                            alignItems: 'center',
                                                                            // backgroundColor: '#3B8271',
                                                                            background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                                                                        }}
                                                                    >
                                                                        <ListItemAvatar>
                                                                            <Box sx={{ position: 'relative', width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }}>
                                                                                <Image src={ShirtImg} alt="Shirt" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
                                                                                {/* <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    color: '#000', fontWeight: 'bold', fontSize: { xs: 12, sm: 14 },
                                                                                    // textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                                                                                }}
                                                                            >
                                                                                {member?.shirtNumber ?? '00'}
                                                                            </Box> */}
                                                                            </Box>
                                                                        </ListItemAvatar>
                                                                        <ListItemText className={'text-white'} primary={formatMatchName(member.firstName + ' ' + member.lastName)} />
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 8 }, ml: 'auto' }}>
                                                                            <Box sx={{
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                alignItems: 'flex-end', // Changed from 'center' to 'flex-start'
                                                                                // alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
                                                                                minWidth: { xs: 24, sm: 40 },
                                                                                width: { xs: 100, sm: 150 }, // Added fixed width
                                                                                color: 'white'
                                                                            }}>
                                                                                {/* #00C853 */}
                                                                                <SignalCellularAltIcon sx={{ color: 'green', fontSize: { xs: 16, sm: 24 } }} />

                                                                                {/* {member?.position} */}
                                                                            </Box>
                                                                            <Typography variant="h6" component="span" sx={{
                                                                                fontWeight: 'bold',
                                                                                minWidth: { xs: 36, sm: 60 },
                                                                                textAlign: 'center',
                                                                                fontSize: { xs: 13, sm: 20 },
                                                                                color: 'white'
                                                                            }}>
                                                                                {/* {member.shirtNumber} */}
                                                                                {member.xp}
                                                                            </Typography>
                                                                        </Box>
                                                                    </ListItem>
                                                                    <div className="h-[2px] bg-white"></div>

                                                                    {/* <Divider className='h-[1px]' sx={{ backgroundColor: 'white', mb: 0, mt: 0 }} /> */}

                                                                </React.Fragment>
                                                            ))}
                                                    </List>
                                                </Box>
                                                {/* )} */}
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            {section === 'matches' && (
                                // Fixtures Section - Upcoming Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    p: 2
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {/* <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                                            Season Schedule
                                        </Typography> */}
                                        {isAdmin && (
                                            <Link href={`/league/${leagueId}/match`} passHref>
                                                <Button
                                                    // variant="contained"
                                                    size="small"
                                                    sx={{
                                                        background: 'linear-gradient(178deg,rgba(0, 0, 0, 1) 0%, rgba(58, 58, 58, 1) 91%);',
                                                        // '&:hover': { backgroundColor: 'rgba(59, 130, 246, 1)' },
                                                        color: 'white',
                                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                        px: { xs: 1, sm: 1.5 },
                                                        py: 0.5,
                                                        minWidth: 'auto',
                                                        mb: 3
                                                    }}
                                                    startIcon={<Calendar size={16} className='stroke-white' />}
                                                    disabled={!league.active}
                                                >
                                                    Schedule Match
                                                </Button>
                                            </Link>
                                        )}
                                    </Box>

                                    {/* <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} /> */}
                                    {league?.matches && league.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                            gap: 2
                                        }}>
                                            {league.matches
                                                .filter(match => match.status === 'SCHEDULED')
                                                .sort(compareMatchesDesc)
                                                .map((match) => {
                                                    const isUserAvailable = !!match.availableUsers?.some(u => u?.id === user?.id);
                                                    // const { availableCount, pendingCount } = getAvailabilityCounts(match);
                                                    return (
                                                        <Card
                                                            key={match.id}
                                                            onClick={(event) => handleMatchCardClick(match, event)}
                                                            sx={{
                                                                position: 'relative',
                                                                borderRadius: 3,
                                                                backdropFilter: 'blur(10px)',
                                                                background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                                cursor: 'pointer',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                                                                }
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: 2 }}>
                                                                {isAdmin && (
                                                                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                        <Tooltip title="Edit">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    router.push(`/league/${league?.id}/match/${match.id}/edit`);
                                                                                }}
                                                                                sx={{ color: 'white' }}
                                                                                disabled={!league?.active}
                                                                            >
                                                                                <Edit size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete / Archive">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRequestDeleteMatch(match);
                                                                                }}
                                                                                sx={{ color: '#ffb4b4' }}
                                                                            >
                                                                                <Trash2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                )}

                                                                {/* // Update your admin buttons in the match cards */}
                                                                {/* {isAdmin && (
                                                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                    <Tooltip title="Edit">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                router.push(`/league/${league?.id}/match/${match.id}/edit`);
                                                                            }}
                                                                            sx={{ color: 'white' }}
                                                                            disabled={!league?.active}
                                                                        >
                                                                            <Edit size={20} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title={match.archived ? "Permanently Delete" : "Archive / Delete"}>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (match.archived) {
                                                                                    // If already archived, offer permanent delete
                                                                                    handlePermanentDelete(match);
                                                                                } else {
                                                                                    // Normal archive/delete flow
                                                                                    handleRequestDeleteMatch(match);
                                                                                }
                                                                            }}
                                                                            sx={{ color: match.archived ? '#ff4444' : '#ffb4b4' }}
                                                                        >
                                                                            <Trash2 size={20} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    {match.archived && (
                                                                        <Tooltip title="Restore Match">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRestoreMatch(match);
                                                                                }}
                                                                                sx={{ color: '#4CAF50' }}
                                                                            >
                                                                                <Undo2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            )} */}

                                                                {/* // ...existing code... */}
                                                                {/* // ...existing code... */}
                                                                {/* {isAdmin && (
                                                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                    {match.archived ? (
                                                                        <Tooltip title="Restore Match">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Open actions dialog and run deletable check (results card)
                                                                                    setArchivedActionMatch(match);
                                                                                    setArchivedActionOpen(true);
                                                                                    checkCanHardDelete(match.id);
                                                                                }}
                                                                                sx={{ color: '#4CAF50' }}
                                                                            >
                                                                                <Undo2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip title="Delete / Archive">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRequestDeleteMatch(match);
                                                                                }}
                                                                                sx={{ color: '#ffb4b4' }}
                                                                            >
                                                                                <Trash2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            )} */}

                                                                {/* {isAdmin && (
                                                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                    {match.archived ? (
                                                                        <Tooltip title="Restore Match">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setArchivedActionMatch(match);
                                                                                    setArchivedActionOpen(true); // check will auto-run via useEffect
                                                                                }}
                                                                                sx={{ color: '#4CAF50' }}
                                                                            >
                                                                                <Undo2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip title="Delete / Archive">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRequestDeleteMatch(match);
                                                                                }}
                                                                                sx={{ color: '#ffb4b4' }}
                                                                            >
                                                                                <Trash2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            )} */}


                                                                {/* // ...existing code... */}
                                                                {/* // ...existing code... */}

                                                                {/* Add archived label */}
                                                                {/* {match.archived && (
                                                                <Chip
                                                                    label="Canceled by Admin"
                                                                    size="small"
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: 8,
                                                                        left: 8,
                                                                        backgroundColor: '#b91c1c',
                                                                        color: 'white',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                />
                                                            )} */}

                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 1,
                                                                    minHeight: 80,
                                                                    mb: 3
                                                                }}>
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        width: '100%'
                                                                    }}>
                                                                        <Box sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                            flex: 1,
                                                                        }}>
                                                                            <Image
                                                                                src={match.homeTeamImage || homeImg}
                                                                                alt={match.homeTeamName}
                                                                                width={24}
                                                                                height={24}
                                                                                style={{ borderRadius: '2px' }}
                                                                            />
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    color: 'white',
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: '0.85rem',
                                                                                    ml: 2
                                                                                }}
                                                                                title={match.homeTeamName}
                                                                            >
                                                                                {formatMatchName(match.homeTeamName)}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Bottom Row - Away Team */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        width: '100%'
                                                                    }}>
                                                                        <Box sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                            flex: 1,
                                                                            mt: 2,
                                                                        }}>
                                                                            <Image
                                                                                src={match.awayTeamImage || awayImg}
                                                                                alt={match.awayTeamName}
                                                                                width={24}
                                                                                height={24}
                                                                                style={{ borderRadius: '2px' }}
                                                                            />
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    color: 'white',
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: '0.85rem',
                                                                                    ml: 2
                                                                                }}
                                                                                title={match.awayTeamName}
                                                                            >
                                                                                {formatMatchName(match.awayTeamName)}
                                                                            </Typography>

                                                                        </Box>
                                                                    </Box>


                                                                    {/* Date and Status - Right Side */}
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'flex-end',
                                                                        position: 'absolute',
                                                                        top: 42,
                                                                        right: 8
                                                                    }}>
                                                                        <Typography variant="body2" sx={{
                                                                            color: 'white',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.75rem'
                                                                        }}>
                                                                            {formatMatchDate(match.date)}
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{
                                                                            color: 'white',
                                                                            fontSize: '0.65rem'
                                                                        }}>
                                                                            {formatMatchTime(match.date)}
                                                                        </Typography>
                                                                        <Divider sx={{ height: '85px', width: '0.5px', color: 'white', bgcolor: 'white', mr: 10.5, mt: -7 }} />
                                                                    </Box>
                                                                </Box>

                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                        {/* Availability button */}
                                                                        {isMember && (
                                                                            <Button
                                                                                variant="contained"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation(); // Prevent card click
                                                                                    handleToggleAvailability(match.id, isUserAvailable);
                                                                                }}
                                                                                disabled={availabilityLoading[match.id] || !league?.active}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: isUserAvailable ? 'rgba(76, 175, 80, 0.8)' : '#0388E3',
                                                                                    '&:hover': {
                                                                                        backgroundColor: isUserAvailable ? 'rgba(76, 175, 80, 1)' : '#0388E3',
                                                                                        transform: 'translateY(-1px)',
                                                                                    },
                                                                                    '&.Mui-disabled': {
                                                                                        backgroundColor: 'rgba(255,255,255,0.3)',
                                                                                        color: 'rgba(255,255,255,0.5)'
                                                                                    },
                                                                                    fontSize: '0.75rem',
                                                                                    py: 0.5,
                                                                                    transition: 'all 0.2s ease-in-out',
                                                                                    '&:active': {
                                                                                        transform: 'translateY(0)', // Reset when clicked
                                                                                    },
                                                                                }}
                                                                            >
                                                                                {availabilityLoading[match.id]
                                                                                    ? <CircularProgress size={16} color="inherit" />
                                                                                    : (isUserAvailable ? 'Unavailable' : 'Available')}
                                                                            </Button>
                                                                        )}
                                                                    </Box>
                                                                    {/* <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={(e) => e.stopPropagation()} // Prevent card click
                                                                        sx={{
                                                                            backgroundColor: '#FA5836',
                                                                            color: 'white',
                                                                            fontSize: '0.75rem',
                                                                            py: 0.5,
                                                                            px: 1,
                                                                            borderRadius: 1,
                                                                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                            transition: 'all 0.2s ease-in-out',
                                                                            '&:hover': {
                                                                                bgcolor: '#FA5836',
                                                                                boxShadow: '0 4px 8px #FA5836',
                                                                                transform: 'translateY(-1px)',
                                                                            },
                                                                            '&:active': {
                                                                                transform: 'translateY(0)', // Reset when clicked
                                                                            },
                                                                        }}
                                                                    >
                                                                        Available: {availableCount} | Pending: {pendingCount}
                                                                    </Button>
                                                                </Box> */}
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                                        <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
                                                                            <span>
                                                                                <Button
                                                                                    size="small"
                                                                                    onClick={(e) => { e.stopPropagation(); setViewTeamMatch({ leagueId, matchId: match.id }); setViewTeamOpen(true); }}
                                                                                    sx={{
                                                                                        backgroundColor: '#FA5836',
                                                                                        color: 'white',
                                                                                        fontSize: '0.75rem',
                                                                                        py: 0.5,
                                                                                        px: 1,
                                                                                        borderRadius: 1,
                                                                                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                                        transition: 'all 0.2s ease-in-out',
                                                                                        '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px #FA5836', transform: 'translateY(-1px)' },
                                                                                        '&:active': { transform: 'translateY(0)' },
                                                                                    }}
                                                                                >
                                                                                    view team
                                                                                </Button>
                                                                            </span>
                                                                        </Tooltip>
                                                                    </Box>
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            No upcoming matches scheduled yet
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {section === 'results' && (
                                // Results Section - Completed Matches
                                <Box sx={{
                                    height: 'auto',
                                    overflowY: 'visible',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    p: 2
                                }}>
                                    {league?.matches && league.matches.length > 0 ? (
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                            gap: 3
                                        }}>
                                            {league.matches
                                                .filter(match => match.status === 'RESULT_PUBLISHED' || match.status === 'RESULT_UPLOADED') // include uploaded
                                                .sort(compareMatchesDesc)
                                                .map((match) => (
                                                    <Card key={match.id} sx={{
                                                        position: 'relative',
                                                        borderRadius: 3,
                                                        backdropFilter: 'blur(10px)',
                                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                                                        }
                                                    }}>
                                                        <CardContent sx={{ p: 2 }}>
                                                            {/* {isAdmin && (
                                                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                    <Tooltip title="Delete / Archive">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRequestDeleteMatch(match);
                                                                            }}
                                                                            sx={{ color: '#ffb4b4' }}
                                                                        >
                                                                            <Trash2 size={20} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            )} */}
                                                            {/* {isAdmin && (
                                                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                    {match.archived ? (
                                                                        <Tooltip title="Restore Match">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRestoreMatch(match);
                                                                                }}
                                                                                sx={{ color: '#4CAF50' }}
                                                                            >
                                                                                <Undo2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip title="Delete / Archive">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRequestDeleteMatch(match);
                                                                                }}
                                                                                sx={{ color: '#ffb4b4' }}
                                                                            >
                                                                                <Trash2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            )} */}

                                                            {isAdmin && (
                                                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                                                    {match.archived ? (
                                                                        <Tooltip title="Restore Match">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Open actions dialog instead of immediate restore
                                                                                    setArchivedActionMatch(match);
                                                                                    setArchivedActionOpen(true);
                                                                                }}
                                                                                sx={{ color: '#4CAF50' }}
                                                                            >
                                                                                <Undo2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip title="Delete / Archive">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRequestDeleteMatch(match);
                                                                                }}
                                                                                sx={{ color: '#ffb4b4' }}
                                                                            >
                                                                                <Trash2 size={20} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            )}

                                                            {/* Archived label */}
                                                            {match.archived && (
                                                                <Chip
                                                                    label="Canceled by Admin"
                                                                    size="small"
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: 8,
                                                                        left: 8,
                                                                        backgroundColor: '#b91c1c',
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        textAlign: 'center',
                                                                        justifyContent: 'center',
                                                                        ml: '25%'
                                                                    }}
                                                                />
                                                            )}

                                                            {/* Awaiting confirmation label for RESULT_UPLOADED */}
                                                            {!match.archived && match.status === 'RESULT_UPLOADED' && (
                                                                <Chip
                                                                    label="Awaiting Confirmation"
                                                                    size="small"
                                                                    sx={{
                                                                        // position: {sm: 'static', xs: 'static', md: 'absolute'},
                                                                        position: 'absolute',
                                                                        top: 8,
                                                                        left: 8,
                                                                        backgroundColor: '#F59E0B', // amber
                                                                        color: 'black',
                                                                        fontWeight: 'bold',
                                                                        ml: '25%',
                                                                    }}
                                                                />
                                                            )}

                                                            {match.status === 'RESULT_PUBLISHED' ? (
                                                                <Link href={`/match/${match?.id}`}>
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: 1,
                                                                        minHeight: 80
                                                                    }}>

                                                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                                                <Image
                                                                                    src={match.homeTeamImage || homeImg}
                                                                                    alt={match.homeTeamName}
                                                                                    width={24}
                                                                                    height={24}
                                                                                    style={{ borderRadius: '2px' }}
                                                                                />
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                                                    title={match.homeTeamName}
                                                                                >
                                                                                    {formatMatchName(match.homeTeamName)}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Typography
                                                                                variant="h6"
                                                                                sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
                                                                            >
                                                                                {match.homeTeamGoals || 0}
                                                                            </Typography>
                                                                        </Box>

                                                                        {/* Away row */}
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                                                <Image
                                                                                    src={match.awayTeamImage || awayImg}
                                                                                    alt={match.awayTeamName}
                                                                                    width={24}
                                                                                    height={24}
                                                                                    style={{ borderRadius: '2px' }}
                                                                                />
                                                                                <Typography
                                                                                    variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                                                    title={match.awayTeamName}
                                                                                >
                                                                                    {formatMatchName(match.awayTeamName)}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Typography
                                                                                variant="h6"
                                                                                sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
                                                                            >
                                                                                {match.awayTeamGoals || 0}
                                                                            </Typography>
                                                                        </Box>

                                                                        {/* Date and Status - Right Side */}
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'absolute', top: 32, right: 8 }}>
                                                                            <Typography variant="body2" sx={{
                                                                                color: 'white',
                                                                                fontWeight: 'bold',
                                                                                fontSize: '0.75rem'
                                                                            }}>
                                                                                {formatMatchDate(match.date)}
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{
                                                                                color: 'white',
                                                                                fontSize: '0.65rem'
                                                                            }}>
                                                                                Full time
                                                                            </Typography>
                                                                            <Divider sx={{ height: '70px', width: '0.5px', color: 'white', bgcolor: '#fff', mr: 8.5, mt: -6 }} />
                                                                        </Box>
                                                                    </Box>
                                                                </Link>
                                                            ) : (
                                                                // RESULT_UPLOADED: non-navigable, show toast on click
                                                                <Box
                                                                    // onClick={() => toast.info("Captains haven't confirmed the score yet.")}
                                                                    onClick={() => toast("Captains haven't confirmed the score yet.", { icon: 'ℹ️' })}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: 1,
                                                                        minHeight: 80,
                                                                        cursor: 'not-allowed',
                                                                        opacity: 0.95
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                                            <Image
                                                                                src={match.homeTeamImage || homeImg}
                                                                                alt={match.homeTeamName}
                                                                                width={24}
                                                                                height={24}
                                                                                style={{ borderRadius: '2px' }}
                                                                            />
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                                                title={match.homeTeamName}
                                                                            >
                                                                                {formatMatchName(match.homeTeamName)}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography
                                                                            variant="h6"
                                                                            sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
                                                                        >
                                                                            {match.homeTeamGoals || 0}
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Away row */}
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                                            <Image
                                                                                src={match.awayTeamImage || awayImg}
                                                                                alt={match.awayTeamName}
                                                                                width={24}
                                                                                height={24}
                                                                                style={{ borderRadius: '2px' }}
                                                                            />
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                                                title={match.awayTeamName}
                                                                            >
                                                                                {formatMatchName(match.awayTeamName)}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography
                                                                            variant="h6"
                                                                            sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: 20, textAlign: 'right', mr: 9 }}
                                                                        >
                                                                            {match.awayTeamGoals || 0}
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Date and Status - Right Side */}
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'absolute', top: 32, right: 8 }}>
                                                                        <Typography variant="body2" sx={{
                                                                            color: 'white',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.75rem'
                                                                        }}>
                                                                            {formatMatchDate(match.date)}
                                                                        </Typography>
                                                                        {/* <Typography variant="body2" sx={{
                                                                            color: 'white',
                                                                            fontSize: '0.65rem'
                                                                        }}>
                                                                            Pending confirmation
                                                                        </Typography> */}
                                                                        <Divider sx={{ height: '70px', width: '0.5px', color: 'white', bgcolor: '#fff', mr: 8.5, mt: -6 }} />
                                                                    </Box>
                                                                </Box>
                                                            )}

                                                            {/* Action buttons */}
                                                            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        {((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                                                          <Link href={`/league/${league?.id}/match/${match.id}/play`} passHref>
                                                            <Button
                                                              size="small"
                                                              sx={{
                                                                backgroundColor: '#0388E3',
                                                                color: 'white',
                                                                fontSize: '0.75rem',
                                                                py: 0.5,
                                                                px: 1,
                                                                borderRadius: 1,
                                                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                transition: 'all 0.2s ease-in-out',
                                                                '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
                                                                '&:active': { transform: 'translateY(0)' },
                                                              }}
                                                              disabled={!league?.active}
                                                            >
                                                              {isAdmin ? 'Update Score Card' : 'MOMT'}
                                                            </Button>
                                                          </Link>
                                                        )}
                                                      </Box>
                                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                        <Button
                                                          size="small"
                                                          sx={{
                                                            backgroundColor: '#FA5836',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            py: 0.5,
                                                            px: 1,
                                                            borderRadius: 1,
                                                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                            transition: 'all 0.2s ease-in-out',
                                                            '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px #FA5836', transform: 'translateY(-1px)' },
                                                            '&:active': { transform: 'translateY(0)' },
                                                          }}
                                                          onClick={() => {
                                                            setActiveMatchId(match.id);
                                                            setStatsDialogOpen(true);
                                                            fetchExistingStats(match.id);
                                                          }}
                                                        >
                                                          Add Your Stats
                                                        </Button>
                                                      </Box>
                                                    </Box> */}

                                                            {/* // ...existing code... */}
                                                            <Box sx={{
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                flexWrap: 'wrap',
                                                                gap: 0.75,
                                                                mt: 2
                                                            }}>
                                                                {/* Admin-only: ADD Score button */}
                                                                {isAdmin && ((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                                                                    match.status === 'RESULT_UPLOADED' ? (
                                                                        <Tooltip title="Awaiting captain confirmation">
                                                                            <span>
                                                                                <Button
                                                                                    size="small"
                                                                                    // disabled
                                                                                     onClick={() => {
                                                                                setSelectedMatchIdForDialog(match.id);
                                                                                setShouldShowAdminGoals(true);
                                                                                setMatchStatsOpen(true);
                                                                            }}
                                                                                    sx={{
                                                                                        backgroundColor: '#0388E3',
                                                                                        color: 'white',
                                                                                        fontSize: '0.65rem',
                                                                                        textTransform: 'none',
                                                                                        py: 0.3,
                                                                                        px: 0.8,
                                                                                        minHeight: 28,
                                                                                        minWidth: 'fit-content',
                                                                                        borderRadius: 1,
                                                                                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                                        transition: 'all 0.2s ease-in-out',
                                                                                        '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
                                                                                    }}
                                                                                >
                                                                                    ADD Score
                                                                                </Button>
                                                                            </span>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => {
                                                                                setSelectedMatchIdForDialog(match.id);
                                                                                setShouldShowAdminGoals(true);
                                                                                setMatchStatsOpen(true);
                                                                            }}
                                                                            sx={{
                                                                                backgroundColor: '#0388E3',
                                                                                color: 'white',
                                                                                fontSize: '0.65rem',
                                                                                textTransform: 'none',
                                                                                py: 0.3,
                                                                                px: 0.8,
                                                                                minHeight: 28,
                                                                                minWidth: 'fit-content',
                                                                                borderRadius: 1,
                                                                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
                                                                            }}
                                                                            disabled={!league?.active}
                                                                        >
                                                                            ADD Score
                                                                        </Button>
                                                                    )
                                                                )}

                                                                {/* All Members: Add Your Stats button */}
                                                                {isMember && ((match.homeTeamUsers?.length || 0) > 0 || (match.awayTeamUsers?.length || 0) > 0) && (
                                                                    match.status === 'RESULT_UPLOADED' ? (
                                                                        <Tooltip title="Awaiting captain confirmation">
                                                                            <span>
                                                                                <Button
                                                                                    size="small"
                                                                                    disabled
                                                                                    sx={{
                                                                                        backgroundColor: '#0388E3',
                                                                                        color: 'white',
                                                                                        fontSize: '0.65rem',
                                                                                        textTransform: 'none',
                                                                                        py: 0.3,
                                                                                        px: 0.8,
                                                                                        minHeight: 28,
                                                                                        minWidth: 'fit-content',
                                                                                        borderRadius: 1,
                                                                                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                                        transition: 'all 0.2s ease-in-out',
                                                                                        '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
                                                                                    }}
                                                                                >
                                                                                    Add Your Stats
                                                                                </Button>
                                                                            </span>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => {
                                                                                setSelectedMatchIdForDialog(match.id);
                                                                                setShouldShowAdminGoals(false);
                                                                                setMatchStatsOpen(true);
                                                                            }}
                                                                            sx={{
                                                                                backgroundColor: '#0388E3',
                                                                                color: 'white',
                                                                                fontSize: '0.65rem',
                                                                                textTransform: 'none',
                                                                                py: 0.3,
                                                                                px: 0.8,
                                                                                minHeight: 28,
                                                                                minWidth: 'fit-content',
                                                                                borderRadius: 1,
                                                                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': { backgroundColor: '#0388E3', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)', transform: 'translateY(-1px)' },
                                                                            }}
                                                                            disabled={!league?.active}
                                                                        >
                                                                            Add Your Stats
                                                                        </Button>
                                                                    )
                                                                )}

                                                                {/* View Team button */}
                                                                <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
                                                                    <span>
                                                                        <Button
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setViewTeamMatch({ leagueId, matchId: match.id });
                                                                                setViewTeamOpen(true);
                                                                            }}
                                                                            sx={{
                                                                                backgroundColor: '#FA5836',
                                                                                color: 'white',
                                                                                fontSize: '0.65rem',
                                                                                textTransform: 'none',
                                                                                py: 0.3,
                                                                                px: 0.8,
                                                                                minHeight: 28,
                                                                                minWidth: 'fit-content',
                                                                                borderRadius: 1,
                                                                                boxShadow: '0 2px 4px rgba(250, 88, 54, 0.3)',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px rgba(250, 88, 54, 0.4)', transform: 'translateY(-1px)' },
                                                                            }}
                                                                            disabled={!league?.active}
                                                                        >
                                                                            View Team
                                                                        </Button>
                                                                    </span>
                                                                </Tooltip>

                                                                {/* Match Results button */}
                                                                <Tooltip title={match.status === 'RESULT_UPLOADED' ? 'Awaiting captain confirmation' : ''}>
                                                                    <span>
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => router.push(`/match/${match.id}`)}
                                                                            sx={{
                                                                                backgroundColor: '#FA5836',
                                                                                color: 'white',
                                                                                fontSize: '0.65rem',
                                                                                textTransform: 'none',
                                                                                py: 0.3,
                                                                                px: 0.8,
                                                                                minHeight: 28,
                                                                                minWidth: 'fit-content',
                                                                                borderRadius: 1,
                                                                                boxShadow: '0 2px 4px rgba(250, 88, 54, 0.3)',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': { bgcolor: '#FA5836', boxShadow: '0 4px 8px rgba(250, 88, 54, 0.4)', transform: 'translateY(-1px)' },
                                                                            }}
                                                                            disabled={!league?.active || match.status === 'RESULT_UPLOADED'}
                                                                        >
                                                                            Match Results
                                                                        </Button>
                                                                    </span>
                                                                </Tooltip>
                                                            </Box>
                                                            {/* // ...existing code... */}

                                                        </CardContent>
                                                    </Card>
                                                ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            No completed matches yet
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {section === 'table' && (
                                <div className="w-full mx-auto">
                                    <Card sx={{
                                        background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: { xs: 2, sm: 3 },
                                        boxShadow: 'none',
                                        mt: 1.2,
                                        overflow: 'auto',
                                        '&::-webkit-scrollbar': {
                                            height: '6px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: 'rgba(255,255,255,0.1)',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: 'rgba(255,255,255,0.3)',
                                            borderRadius: '3px',
                                        },
                                    }} className="text-white">
                                        {/* <div className="p-3">
                                            <h2 className="text-lg font-bold text-white">League Table</h2>
                                        </div> */}

                                        <div className="p-2 sm:p-3 px-1 sm:px-2 pb-2">
                                            {/* bg-[rgba(59,130,246,0.8)] */}
                                            <div className="rounded-lg px-1 sm:px-2 py-1 mb-2 sm:mb-4 flex items-center">
                                                <div className="flex-1 text-white font-bold text-[10px] sm:text-xs md:text-sm ml-2 sm:ml-8">Name</div>
                                                <div className="flex gap-1 sm:gap-2 md:gap-4 text-white font-bold">
                                                    <div className="min-w-8 sm:min-w-12 text-center text-[9px] sm:text-xs md:text-sm">MOTM</div>
                                                    <div className="min-w-5 sm:min-w-7 text-center text-[9px] sm:text-xs md:text-sm">P</div>
                                                    <div className="min-w-5 sm:min-w-7 text-center text-[9px] sm:text-xs md:text-sm">W</div>
                                                    <div className="min-w-5 sm:min-w-7 text-center text-[9px] sm:text-xs md:text-sm">D</div>
                                                    <div className="min-w-5 sm:min-w-7 text-center text-[9px] sm:text-xs md:text-sm">L</div>
                                                    <div className="min-w-7 sm:min-w-10 text-center text-[9px] sm:text-xs md:text-sm">W%</div>
                                                    {league?.showPoints === false ? (
                                                        <div className="min-w-7 sm:min-w-9 text-center text-[9px] sm:text-xs md:text-sm">Pts</div>
                                                    ) : (
                                                        <div className="min-w-8 sm:min-w-[50px] text-center text-[9px] sm:text-xs md:text-sm">XP</div>
                                                    )}
                                                </div>
                                            </div>                                            <div className="space-y-[1px]">
                                                {tableData.map((player) => {
                                                    // const position = index + 1;
                                                    // const badge = getBadgeForPosition(position);
                                                    const points = player.wins * 3 + player.draws;
                                                    const firstName = player.name.split(" ")[0] || player.name; // Ensure first name exists
                                                    const lastName = player.name.split(" ").slice(1).join(" ") || ""; // Handle single-name cases

                                                    // NEW: mark champion/runner-up from trophy room data
                                                    // const isChampion = leagueWinners.champion === player.id;
                                                    // const isRunnerUp = leagueWinners.runnerUp === player.id;


                                                    return (
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (league?.id) openQuickViewFromTable(String(league.id), String(player.id));
                                                            }}
                                                            key={player.id} className="block cursor-pointer">
                                                            {/* ${getRowStyles(index)} */}
                                                            <div style={{
                                                                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)'
                                                            }} className={`px-1 sm:px-2 py-1.5 min-h-[50px] sm:min-h-[70px] flex items-center`}>

                                                                <div className="flex items-center min-w-0 flex-1">
                                                                    <div className="hidden sm:block mr-2">
                                                                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                                                                            <div className="relative w-full h-full">
                                                                                <Image
                                                                                    src={ShirtImg}
                                                                                    alt="Shirt"
                                                                                    fill
                                                                                    style={{ objectFit: 'contain', pointerEvents: 'none' }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 min-w-0">
                                                                        <div className="text-white font-normal text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] sm:max-w-none">
                                                                            {formatMatchName(firstName)} {formatMatchName(lastName)}
                                                                        </div>
                                                                        {player.isAdmin && <Shield className="text-blue-400 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-1 sm:gap-2 md:gap-4 items-center">
                                                                    {/* MOTM column value */}
                                                                    <div className="min-w-8 sm:min-w-12 text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                        {typeof player.motmCount === 'number' && player.motmCount > 0 ? (
                                                                            <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap">
                                                                                <span className="text-[10px] sm:text-sm font-bold">{player.motmCount}</span>
                                                                                <Star sx={{ fontSize: { xs: 16, sm: 20, md: 26 }, color: '#F59E0B' }} />
                                                                            </span>
                                                                        ) : (
                                                                            <span className="opacity-50">-</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-5 sm:min-w-7 text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                        {player.played}
                                                                    </div>
                                                                    <div className="min-w-5 sm:min-w-7 text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                        {player.wins}
                                                                    </div>
                                                                    <div className="min-w-5 sm:min-w-7 text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                        {player.draws}
                                                                    </div>
                                                                    <div className="min-w-5 sm:min-w-7 text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                        {player.losses}
                                                                    </div>
                                                                    <div className="min-w-7 sm:min-w-10 text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                        {player.winPercentage}
                                                                    </div>
                                                                    {league?.showPoints === false ? (
                                                                        <div className="min-w-7 sm:min-w-9 text-center text-white text-[9px] sm:text-xs md:text-sm">{points}</div>
                                                                    ) : (
                                                                        <div className="min-w-8 sm:min-w-[50px] text-center text-white text-[9px] sm:text-xs md:text-sm">
                                                                            {player.xp}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="h-[1px] bg-white"></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Card>
                                    {/* // ...existing code... */}
                                    {league && (
                                        <Box sx={{ mt: 2 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: { xs: 1.5, sm: 2 },
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(177deg,rgba(229, 106, 22, 0.92) 26%, rgba(207, 35, 38, 0.92) 100%)',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                                                }}
                                            >
                                                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                                    Statistics
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        p: { xs: 1, sm: 2 },
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {!leagueStats ? (
                                                        <Typography variant="body2" sx={{ color: 'white' }}>
                                                            Loading statistics…
                                                        </Typography>
                                                    ) : (
                                                        (() => {
                                                            const played = leagueStats.playedMatches ?? 0;
                                                            const remaining = leagueStats.remaining ?? Math.max((league?.maxGames ?? 0) - played, 0);
                                                            const total = (league?.maxGames ?? (played + remaining)) || (played + remaining);
                                                            const pct = total > 0 ? Math.round((played / total) * 100) : 0;

                                                            const createdD = leagueStats.created ? new Date(leagueStats.created) : null;
                                                            const createdStr = createdD
                                                                ? `Created On ${createdD.toLocaleDateString('en-GB', {
                                                                    weekday: 'long',
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                })} At ${createdD.toLocaleTimeString('en-GB', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: false,
                                                                })}`
                                                                : 'Created On -';

                                                            return (
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1, sm: 1.5 } }}>
                                                                    {/* Season progress */}
                                                                    <Box
                                                                        sx={{
                                                                            p: { xs: 1, sm: 1.5 },
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid rgba(52,211,153,0.35)',
                                                                            background: 'linear-gradient(180deg, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0.07) 100%)',
                                                                        }}
                                                                    >
                                                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                                            Season Progress
                                                                        </Typography>
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.75, mb: 1, gap: 1 }}>
                                                                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                                {played} Played
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                                {remaining} Remaining
                                                                            </Typography>
                                                                        </Box>
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={pct}
                                                                            sx={{
                                                                                height: { xs: 6, sm: 8 },
                                                                                borderRadius: 999,
                                                                                backgroundColor: 'rgba(255,255,255,0.15)',
                                                                                '& .MuiLinearProgress-bar': { backgroundColor: '#34d399' },
                                                                            }}
                                                                        />
                                                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.75, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                                            {pct}% complete
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Players + Created */}
                                                                    <Box
                                                                        sx={{
                                                                            p: { xs: 1, sm: 1.5 },
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid rgba(245,158,11,0.35)',
                                                                            background: 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.07) 100%)',
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Users size={16} color="#F59E0B" />
                                                                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                                {(leagueStats.players ?? league?.members?.length ?? 0)} Players
                                                                            </Typography>
                                                                        </Box>

                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                                            <Calendar size={16} color="#F59E0B" />
                                                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontSize: { xs: '0.7rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                                                                                {createdStr}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Best pairing + Hottest */}
                                                                    <Box
                                                                        sx={{
                                                                            gridColumn: { xs: '1 / -1', sm: '1 / -1' },
                                                                            display: 'flex',
                                                                            flexDirection: { xs: 'column', sm: 'row' },
                                                                            flexWrap: 'wrap',
                                                                            gap: { xs: 0.75, sm: 1 },
                                                                            mt: 0.5,
                                                                        }}
                                                                    >
                                                                        <Chip
                                                                            label={
                                                                                leagueStats.bestPairing
                                                                                    ? `Best pairing: ${leagueStats.bestPairing.names[0]} and ${leagueStats.bestPairing.names[1]}`
                                                                                    : 'Best pairing will appear when enough matches are completed.'
                                                                            }
                                                                            sx={{
                                                                                color: 'white',
                                                                                border: '1px solid rgba(59,130,246,0.4)',
                                                                                background: leagueStats.bestPairing
                                                                                    ? 'linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.10) 100%)'
                                                                                    : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
                                                                                fontWeight: 600,
                                                                                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                                                                                height: { xs: 'auto', sm: 32 },
                                                                                py: { xs: 0.5, sm: 0 },
                                                                                '& .MuiChip-label': {
                                                                                    px: { xs: 1, sm: 1.5 },
                                                                                    whiteSpace: 'normal',
                                                                                    lineHeight: 1.3,
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Chip
                                                                            icon={<Flame size={14} color="#F97316" />}
                                                                            label={
                                                                                leagueStats.hottestPlayer
                                                                                    ? `${leagueStats.hottestPlayer.name} is the hottest player right now!`
                                                                                    : 'Hottest player will appear after recent matches with stats.'
                                                                            }
                                                                            sx={{
                                                                                color: 'white',
                                                                                border: '1px solid rgba(249,115,22,0.4)',
                                                                                background: leagueStats.hottestPlayer
                                                                                    ? 'linear-gradient(180deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.10) 100%)'
                                                                                    : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
                                                                                fontWeight: 600,
                                                                                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                                                                                height: { xs: 'auto', sm: 32 },
                                                                                py: { xs: 0.5, sm: 0 },
                                                                                '& .MuiChip-label': {
                                                                                    px: { xs: 1, sm: 1.5 },
                                                                                    whiteSpace: 'normal',
                                                                                    lineHeight: 1.3,
                                                                                },
                                                                                '& .MuiChip-icon': {
                                                                                    ml: { xs: 0.5, sm: 1 },
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })()
                                                    )}
                                                </Box>
                                            </Paper>
                                        </Box>
                                    )}
                                    {/* // ...existing code... */}
                                </div>
                            )}

                            {section === 'awards' && (
                                // Trophy Room Section
                                <Box sx={{ maxHeight: 'none', p: 0 }}>
                                    <TrophyRoom leagueId={leagueId} />
                                </Box>
                            )}
                        </Paper>

                        <Dialog open={teamModalOpen} onClose={handleCloseTeamModal} fullWidth maxWidth="sm">
                            <DialogTitle>Teams for {selectedMatch?.homeTeamName} vs {selectedMatch?.awayTeamName}</DialogTitle>
                            <DialogContent>
                                {selectedMatch && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>{selectedMatch.homeTeamName}</Typography>
                                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                        <Grid container spacing={1}>
                                            {selectedMatch.homeTeamUsers.map(player => (
                                                <Grid xs={6} key={player.id}>
                                                    <Chip label={`${player.firstName} ${player.lastName}`} sx={{ m: 0.5, color: 'black' }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                                {selectedMatch && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>{selectedMatch.awayTeamName}</Typography>
                                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                        <Grid container spacing={1}>
                                            {selectedMatch.awayTeamUsers.map(player => (
                                                <Grid xs={6} key={player.id}>
                                                    <Chip label={`${player.firstName} ${player.lastName}`} sx={{ m: 0.5, color: 'black' }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseTeamModal}>Close</Button>
                            </DialogActions>
                        </Dialog>
                        <LeagueSettingsDialog
                            open={isSettingsOpen}
                            onClose={() => setIsSettingsOpen(false)}
                            league={league}
                            onUpdate={handleUpdateLeague}
                            onDelete={handleDeleteLeague}
                            currentUserId={user?.id}
                            onRemoveMember={undefined}
                            onLeaveLeague={undefined}
                            onUpdateLeague={undefined}
                            onDeleteLeague={undefined}
                        />
                        {/* Members dialog (full-featured) */}
                        <LeagueMembersDialog
                            open={openMembers}
                            onClose={() => setOpenMembers(false)}
                            league={selectedLeague}
                            currentUserId={user?.id || ''}
                            onRemoveMember={() => { /* optional: non-admins cannot remove here */ }}
                            onLeaveLeague={handleLeaveLeague}
                            onUpdateLeague={async () => { /* no-op on this page for now */ }}
                            onDeleteLeague={async () => { /* no-op on this page for now */ }}
                        />
                        <Snackbar
                            open={!!toastMessage}
                            autoHideDuration={3000}
                            onClose={() => setToastMessage(null)}
                            message={toastMessage}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        />

                        {/* Points Disabled Alert */}
                        <Snackbar
                            open={showPointsAlert}
                            autoHideDuration={4000}
                            onClose={() => setShowPointsAlert(false)}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert
                                onClose={() => setShowPointsAlert(false)}
                                severity="info"
                                sx={{
                                    width: '100%',
                                    backgroundColor: 'rgba(30, 58, 138, 0.9)',
                                    color: 'white',
                                    '& .MuiAlert-icon': { color: 'white' },
                                    '& .MuiAlert-message': { color: 'white' }
                                }}
                            >
                                Admin have disabled the points option. You will not see the points in the table.
                            </Alert>
                        </Snackbar>
                        {/* // Add this after your Snackbar components, before the closing Container tag */}
                        {/* Undo Snackbar */}
                        {undoInfo && (
                            <Snackbar
                                open={!!undoInfo}
                                autoHideDuration={10000} // 10 seconds to undo
                                onClose={() => setUndoInfo(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                action={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            color="inherit"
                                            size="small"
                                            onClick={handleUndo}
                                            sx={{
                                                color: '#fff',
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                                            }}
                                            startIcon={<Undo2 size={16} />}
                                        >
                                            Undo
                                        </Button>
                                        <IconButton
                                            size="small"
                                            aria-label="close"
                                            color="inherit"
                                            onClick={() => setUndoInfo(null)}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                                message={
                                    undoInfo.action === 'archive'
                                        ? `Match archived. ${toastMessage}`
                                        : 'Match deleted permanently'
                                }
                            />
                        )}
                        {/* <PlayerStatsDialog
                            open={statsDialogOpen}
                            onClose={() => setStatsDialogOpen(false)}
                            onSave={handleSaveStats}
                            isSubmitting={isSubmittingStats}
                            stats={stats}
                            handleStatChange={handleStatChange}
                            teamGoals={getMatchGoals()}
                        /> */}

                        {/* Match Stats Dialog (embedded) */}
                        <PlayMatchPagee
                            open={matchStatsOpen}
                            onClose={async () => {
                                console.log('🔄 PlayMatchPagee closing - refreshing data');
                                
                                // � Fetch fresh league data from backend
                                await fetchLeagueDetails();
                                
                                // 📢 Dispatch event for other components
                                window.dispatchEvent(new CustomEvent('match-updated'));
                                
                                // Close dialog
                                setMatchStatsOpen(false);
                                
                                console.log('✅ Match dialog closed and data refreshed');
                            }}
                            initialLeagueId={league?.id}
                            initialMatchId={selectedMatchIdForDialog || undefined}
                            showAdminGoalsSection={shouldShowAdminGoals}
                        />

                        {/* Line 4844 omitted */}
                        <PlayerStatsDialog
                            open={statsDialogOpen}
                            onClose={() => setStatsDialogOpen(false)}
                            onSave={handleSaveStats}
                            isSubmitting={isSubmittingStats}
                            stats={stats}
                            handleStatChange={handleStatChange}
                            teamGoals={getMatchGoals()}
                        />

                        {/* <MatchDetailModal
                            open={matchDetailModalOpen}
                            onClose={() => setMatchDetailModalOpen(false)}
                            match={selectedMatchDetail}
                        /> */}
                        <MatchDetailModal
                            open={matchDetailModalOpen}
                            onClose={() => setMatchDetailModalOpen(false)}
                            match={selectedMatchDetail}
                        />
                    </>
                )}
            </Container>


            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Are you sure you want to delete this match?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {(matchPendingDelete?.homeTeamGoals ?? 0) > 0 ||
                            (matchPendingDelete?.awayTeamGoals ?? 0) > 0 ||
                            matchPendingDelete?.status === 'RESULT_PUBLISHED' || matchPendingDelete?.status === 'RESULT_PUBLISHED'
                            ? 'Scores exist. It will be archived (Canceled by Admin) and removed from stats. You can undo.'
                            : 'No scores yet. It will be permanently deleted.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleConfirmDeleteMatch}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
            {/* <Dialog
                open={archivedActionOpen}
                onClose={() => setArchivedActionOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Archived Match Actions</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Choose an action for this archived match.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (!archivedActionMatch) return;
                            handleRestoreMatch(archivedActionMatch);
                            setArchivedActionOpen(false);
                        }}
                        startIcon={<Undo2 size={16} />}
                    >
                        Undo
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            if (!archivedActionMatch) return;
                            const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
                            if (ok) {
                                handlePermanentDelete(archivedActionMatch);
                                setArchivedActionOpen(false);
                            }
                        }}
                        startIcon={<Trash2 size={16} />}
                    >
                        Permanently Delete
                    </Button>
                </DialogActions>
            </Dialog> */}

            {/* // ...existing code... */}
            <Dialog
                open={archivedActionOpen}
                onClose={() => setArchivedActionOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Archived Match Actions</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Choose an action for this archived match.
                    </Typography>
                    {archivedActionChecking && (
                        <Typography variant="body2">Checking deletable status…</Typography>
                    )}
                    {archivedActionHasStats === true && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            This match has player stats. Permanent delete is disabled.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (!archivedActionMatch) return;
                            handleRestoreMatch(archivedActionMatch);
                            setArchivedActionOpen(false);
                        }}
                        startIcon={<Undo2 size={16} />}
                    >
                        Undo
                    </Button>
                    {/* <Tooltip
                        title={
                            archivedActionHasStats ? 'Match has stats. Cannot permanently delete.' : ''
                        }
                    >
                        <span>
                            <Button
                                variant="contained"
                                color="error"
                                disabled={archivedActionChecking || archivedActionHasStats === true}
                                onClick={() => {
                                    if (!archivedActionMatch) return;
                                    const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
                                    if (ok) {
                                        handlePermanentDelete(archivedActionMatch);
                                        setArchivedActionOpen(false);
                                    }
                                }}
                                startIcon={<Trash2 size={16} />}
                            >
                                Permanently Delete
                            </Button>
                        </span>
                    </Tooltip> */}
                    {/* // ...existing code... */}
                    {/* <Tooltip
                        title={
                            archivedActionHasStats !== false
                                ? 'Match cannot be permanently deleted (stats present or status unknown).'
                                : ''
                        }
                    >
                        <span>
                            <Button
                                variant="contained"
                                color="error"
                                disabled={archivedActionChecking || archivedActionHasStats !== false}
                                onClick={() => {
                                    if (!archivedActionMatch) return;
                                    const ok = window.confirm('Are you sure you want to permanently delete this match? This action cannot be undone.');
                                    if (ok) {
                                        handlePermanentDelete(archivedActionMatch);
                                        setArchivedActionOpen(false);
                                    }
                                }}
                                startIcon={<Trash2 size={16} />}
                            >
                                Permanently Delete
                            </Button>
                        </span>
                    </Tooltip> */}
                    <Tooltip
                        title={
                            archivedActionHasStats === true
                                ? 'Match has player stats. Permanent delete is disabled.'
                                : archivedActionHasStats === null
                                    ? 'Status unknown. Click to check and delete if possible.'
                                    : ''
                        }
                    >
                        <span>
                            <Button
                                variant="contained"
                                color="error"
                                // Disable only while checking, or if we KNOW stats exist
                                disabled={archivedActionChecking || archivedActionHasStats === true}
                                onClick={() => {
                                    // Re-check if needed, then delete
                                    tryHardDeleteFromDialog();
                                }}
                                startIcon={<Trash2 size={16} />}
                            >
                                {archivedActionChecking ? 'Checking…' : 'Permanently Delete'}
                            </Button>
                        </span>
                    </Tooltip>
                    {/* // ...existing code... */}
                </DialogActions>
            </Dialog>
            {/* // ...existing code... */}
            <Dialog open={viewTeamOpen} onClose={() => setViewTeamOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    Team Preview
                    <IconButton
                        onClick={() => setViewTeamOpen(false)}
                        size="small"
                        sx={{ color: 'inherit' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <TeamPreviewScreen leagueId={viewTeamMatch?.leagueId} matchId={viewTeamMatch?.matchId} />
                </DialogContent>
            </Dialog>












            <Dialog
                open={openQuickView}
                onClose={() => setOpenQuickView(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0 }}>
                    {quickView.trophyTitle ? `${quickView.trophyTitle} • ` : ''} Player
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton onClick={() => setOpenQuickView(false)} edge="end">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 0 }}>
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
                                    } satisfies PlayerCardProps;
                                    return <PlayerCard {...playerCardProps} disableImagePopup />;
                                })()}
                                {/* Icons row under the player card */}
                                <Box
                                    sx={{
                                        mt: 0,
                                        px: 0,
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
                                        { img: Goals, label: 'Goals', value: quickView.stats?.goals ?? 0 },
                                        { img: Assist, label: 'Assists', value: quickView.stats?.assists ?? 0 },
                                        { img: Cleansheet, label: 'Clean Sheets', value: quickView.cleanSheets ?? 0 },
                                        { img: Momt, label: 'Votes', value: quickView.motmCount ?? 0 },
                                    ].map((it, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: 'grid',
                                                gridTemplateRows: '28px 16px',
                                                justifyItems: 'center',
                                                alignItems: 'center',
                                                rowGap: 0.5,
                                                width: '100%',
                                                minWidth: 0,
                                            }}
                                        >
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 28, lineHeight: 1 }}>
                                                <Image src={it.img} alt={it.label} width={35} height={35} style={{ objectFit: 'contain', display: 'block' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                                    {it.value}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#64748b',
                                                    lineHeight: 1,
                                                    height: 16,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
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
                            <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.08)', height: '230px', mt: 1, borderRadius: 2 }}>
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