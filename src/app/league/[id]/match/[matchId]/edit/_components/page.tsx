"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Button, TextField, CircularProgress, Autocomplete, Checkbox, Divider, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, LinearProgress, Chip, Grid, InputAdornment } from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, Shuffle, UserPlus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { cacheManager } from '@/lib/cacheManager';
import ShirtImg from '@/Components/images/shirtimg.png';

interface User { id: string; firstName: string; lastName: string; email: string; profilePicture?: string; shirtNumber?: string; skills?: { dribbling?: number; shooting?: number; passing?: number; pace?: number; defending?: number; physical?: number; }; preferredFoot?: 'right' | 'left'; }
interface League { id: string; name: string; members: User[]; active: boolean; }
interface Guest { id: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string; }
interface StagedGuest { tempId: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string; existingId?: string; }
interface MatchResp { id: string; homeTeamName: string; awayTeamName: string; location: string; date: string; start: string; end: string; status: string; homeCaptainId?: string; awayCaptainId?: string; homeTeamImage?: string; awayTeamImage?: string; homeTeamUsers: User[]; awayTeamUsers: User[]; guests?: Guest[]; }
type PlayerOption = User & { isGuest?: boolean; guestTempId?: string; team?: 'home' | 'away'; existingGuestId?: string };

export default function EditMatchPage() {
    // Fallback team image (used in responsive preview)
    const defaultTeamImage = '/assets/cflogo2.png';
    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';
    const matchId = params?.matchId ? String(params.matchId) : '';

    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [matchDate, setMatchDate] = useState<Dayjs | null>(dayjs());
    const [startTime, setStartTime] = useState<Dayjs | null>(dayjs());
    const [duration, setDuration] = useState<number | ''>(90);
    const [location, setLocation] = useState('');
    const [homeTeamUsers, setHomeTeamUsers] = useState<PlayerOption[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<PlayerOption[]>([]);
    const [homeCaptain, setHomeCaptain] = useState<PlayerOption | null>(null);
    const [awayCaptain, setAwayCaptain] = useState<PlayerOption | null>(null);

    // Images
    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    // Guests (staged)
    const [homeGuests, setHomeGuests] = useState<StagedGuest[]>([]);
    const [awayGuests, setAwayGuests] = useState<StagedGuest[]>([]);
    const originalGuestIds = useRef<Set<string>>(new Set());

    // Guest dialog
    const [guestDialogOpen, setGuestDialogOpen] = useState(false);
    const [guestTeam, setGuestTeam] = useState<'home' | 'away'>('home');
    const [guestName, setGuestName] = useState('');

    const parseJson = async (res: Response) => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json().catch(() => ({}));
        return {};
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [leagueRes, matchRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const leagueData = await parseJson(leagueRes);
            const matchData = await parseJson(matchRes);
            if (!leagueData?.success) throw new Error(leagueData?.message || 'League fetch failed');
            if (!matchData?.success) throw new Error(matchData?.message || 'Match fetch failed');
            setLeague(leagueData.league);
            const m: MatchResp = matchData.match;
            setHomeTeamName(m.homeTeamName || '');
            setAwayTeamName(m.awayTeamName || '');
            setLocation(m.location || '');
            const start = dayjs(m.start || m.date);
            const end = dayjs(m.end || m.start).isValid() ? dayjs(m.end) : start.add(90, 'minute');
            setMatchDate(start);
            setStartTime(start);
            const diff = end.diff(start, 'minute');
            setDuration(diff > 0 ? diff : 90);

            // Guests
            const guests = (m.guests || []) as Guest[];
            const homeG: StagedGuest[] = guests.filter(g => g.team === 'home').map(g => ({ tempId: `existing-${g.id}`, existingId: g.id, team: 'home', firstName: g.firstName, lastName: g.lastName, shirtNumber: g.shirtNumber }));
            const awayG: StagedGuest[] = guests.filter(g => g.team === 'away').map(g => ({ tempId: `existing-${g.id}`, existingId: g.id, team: 'away', firstName: g.firstName, lastName: g.lastName, shirtNumber: g.shirtNumber }));
            setHomeGuests(homeG); setAwayGuests(awayG);
            originalGuestIds.current = new Set(guests.map(g => g.id));

            // Players (exclude guests from arrays if backend didn't)
            const homeUsers = (m.homeTeamUsers || []).map(u => ({ ...u }));
            const awayUsers = (m.awayTeamUsers || []).map(u => ({ ...u }));
            setHomeTeamUsers([...homeUsers, ...homeG.map(g => guestToPlayer(g))]);
            setAwayTeamUsers([...awayUsers, ...awayG.map(g => guestToPlayer(g))]);
            if (m.homeCaptainId) {
                const cap = homeUsers.find(u => u.id === m.homeCaptainId);
                if (cap) setHomeCaptain(cap as PlayerOption);
            }
            if (m.awayCaptainId) {
                const cap = awayUsers.find(u => u.id === m.awayCaptainId);
                if (cap) setAwayCaptain(cap as PlayerOption);
            }
            if (m.homeTeamImage) setHomeTeamImagePreview(m.homeTeamImage.startsWith('http') ? m.homeTeamImage : `${process.env.NEXT_PUBLIC_API_URL}${m.homeTeamImage}`);
            if (m.awayTeamImage) setAwayTeamImagePreview(m.awayTeamImage.startsWith('http') ? m.awayTeamImage : `${process.env.NEXT_PUBLIC_API_URL}${m.awayTeamImage}`);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Load failed';
            setError(msg);
        } finally { setLoading(false); }
    }, [leagueId, matchId, token]);

    useEffect(() => { if (leagueId && matchId && token) fetchData(); }, [leagueId, matchId, token, fetchData]);

    const guestToPlayer = (g: StagedGuest): PlayerOption => ({ id: `guest-${g.tempId}`, firstName: g.firstName, lastName: g.lastName, email: '', isGuest: true, guestTempId: g.tempId, team: g.team, existingGuestId: g.existingId });

    // Skill calculations
    const calcSkill = (p: PlayerOption) => {
        if (p.isGuest) return 50;
        const s = p.skills;
        const skillKeys: (keyof NonNullable<User['skills']>)[] = ['dribbling', 'shooting', 'passing', 'pace', 'defending', 'physical'];
        const total = skillKeys.reduce((sum, k) => sum + (s?.[k] ?? 0), 0);
        return Math.round(total / skillKeys.length);
    };
    const teamStrength = (arr: PlayerOption[]) => arr.length ? Math.round(arr.reduce((s, p) => s + calcSkill(p), 0) / arr.length) : 0;
    const winPct = (a: number, b: number) => { if (!a && !b) return 50; if (!b) return 85; if (!a) return 15; const diff = a - b; return Math.max(15, Math.min(85, Math.round(50 + (diff / 100) * 30))); };

    // Shuffle
    const shuffleTeams = () => {
        const combined = [...homeTeamUsers.filter(p => !p.isGuest), ...awayTeamUsers.filter(p => !p.isGuest)];
        if (combined.length < 2) { toast.error('Need at least 2 players'); return; }
        const sorted = [...combined].sort((a, b) => calcSkill(b) - calcSkill(a));
        const newHome: PlayerOption[] = []; const newAway: PlayerOption[] = [];
        sorted.forEach((p, i) => (i % 2 === 0 ? newHome : newAway).push(p));
        // Keep guest players on their original teams
        setHomeTeamUsers([...newHome, ...homeTeamUsers.filter(p => p.isGuest)]);
        setAwayTeamUsers([...newAway, ...awayTeamUsers.filter(p => p.isGuest)]);
        setHomeCaptain(null); setAwayCaptain(null);
        toast.success('Teams shuffled');
    };

    // Drag handler
    const movePlayer = (player: PlayerOption, target: 'home' | 'away') => {
        if (player.isGuest) { // allow moving guest too
            if (target === 'home') {
                if (!homeTeamUsers.find(p => p.id === player.id)) { setHomeTeamUsers(p => [...p, player]); setAwayTeamUsers(p => p.filter(p => p.id !== player.id)); if (awayCaptain?.id === player.id) setAwayCaptain(null); }
            } else {
                if (!awayTeamUsers.find(p => p.id === player.id)) { setAwayTeamUsers(p => [...p, player]); setHomeTeamUsers(p => p.filter(p => p.id !== player.id)); if (homeCaptain?.id === player.id) setHomeCaptain(null); }
            }
            return;
        }
        if (target === 'home') { if (!homeTeamUsers.find(p => p.id === player.id)) { setHomeTeamUsers(p => [...p, player]); setAwayTeamUsers(p => p.filter(p => p.id !== player.id)); if (awayCaptain?.id === player.id) setAwayCaptain(null); } }
        else { if (!awayTeamUsers.find(p => p.id === player.id)) { setAwayTeamUsers(p => [...p, player]); setHomeTeamUsers(p => p.filter(p => p.id !== player.id)); if (homeCaptain?.id === player.id) setHomeCaptain(null); } }
    };

    // Add new guest
    const handleAddGuest = () => {
        const trimmed = guestName.trim(); if (!trimmed) return toast.error('Enter guest name');
        const parts = trimmed.split(/\s+/); const firstName = parts[0]; const lastName = parts.slice(1).join(' ') || 'Guest';
        const tempId = `${guestTeam}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; const sg: StagedGuest = { tempId, team: guestTeam, firstName, lastName };
        if (guestTeam === 'home') { setHomeGuests(p => [sg, ...p]); setHomeTeamUsers(p => [guestToPlayer(sg), ...p]); }
        else { setAwayGuests(p => [sg, ...p]); setAwayTeamUsers(p => [guestToPlayer(sg), ...p]); }
        toast.success('Guest added'); setGuestName(''); setGuestTeam('home'); setGuestDialogOpen(false);
    };

    const removeStagedGuest = (team: 'home' | 'away', tempId: string) => {
        if (team === 'home') { setHomeGuests(g => g.filter(x => x.tempId !== tempId)); setHomeTeamUsers(p => p.filter(x => x.guestTempId !== tempId)); if (homeCaptain?.guestTempId === tempId) setHomeCaptain(null); }
        else { setAwayGuests(g => g.filter(x => x.tempId !== tempId)); setAwayTeamUsers(p => p.filter(x => x.guestTempId !== tempId)); if (awayCaptain?.guestTempId === tempId) setAwayCaptain(null); }
    };

    const homeGuestOptions: PlayerOption[] = homeGuests.map(guestToPlayer);
    const awayGuestOptions: PlayerOption[] = awayGuests.map(guestToPlayer);
    const homePlayerOptions: PlayerOption[] = [...(league?.members || []).filter(m => !awayTeamUsers.some(p => p.id === m.id)), ...homeGuestOptions];
    const awayPlayerOptions: PlayerOption[] = [...(league?.members || []).filter(m => !homeTeamUsers.some(p => p.id === m.id)), ...awayGuestOptions];

    const homeStrength = teamStrength(homeTeamUsers);
    const awayStrength = teamStrength(awayTeamUsers);
    const homeWinChance = winPct(homeStrength, awayStrength);
    const awayWinChance = winPct(awayStrength, homeStrength);

    // Images
    const handleHomeTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setHomeTeamImage(f); const r = new FileReader(); r.onload = ev => setHomeTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
    const handleAwayTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setAwayTeamImage(f); const r = new FileReader(); r.onload = ev => setAwayTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
    const handleRemoveHomeTeamImage = () => { setHomeTeamImage(null); setHomeTeamImagePreview(null); };
    const handleRemoveAwayTeamImage = () => { setAwayTeamImage(null); setAwayTeamImagePreview(null); };

    // Submit (PATCH)
    const handleUpdateMatch = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true); setError(null);
        if (!matchDate || !startTime) { setError('Date/time required'); setIsSubmitting(false); return; }
        if (!homeCaptain || !awayCaptain) { setError('Select captains'); setIsSubmitting(false); return; }
        const start = matchDate.hour(startTime.hour()).minute(startTime.minute()).second(0).millisecond(0);
        const matchDuration = duration || 90; const end = start.add(matchDuration, 'minute');
        try {
            const formData = new FormData();
            formData.append('homeTeamName', homeTeamName);
            formData.append('awayTeamName', awayTeamName);
            formData.append('date', start.toISOString());
            formData.append('start', start.toISOString());
            formData.append('end', end.toISOString());
            formData.append('location', location);
            formData.append('homeTeamUsers', JSON.stringify(homeTeamUsers.filter(u => !u.isGuest).map(u => u.id)));
            formData.append('awayTeamUsers', JSON.stringify(awayTeamUsers.filter(u => !u.isGuest).map(u => u.id)));
            formData.append('homeCaptain', homeCaptain.id);
            formData.append('awayCaptain', awayCaptain.id);
            if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
            if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: formData });
            const j = await res.json().catch(() => ({}));
            if (!j.success) throw new Error(j.message || 'Update failed');
            // Sync guests (create new, delete removed)
            const currentGuests = [...homeGuests, ...awayGuests];
            const currentExistingIds = new Set(currentGuests.filter(g => g.existingId).map(g => g.existingId!));
            const toDelete = [...originalGuestIds.current].filter(id => !currentExistingIds.has(id));
            await Promise.allSettled(toDelete.map(id => fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/guests/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })));
            const newOnes = currentGuests.filter(g => !g.existingId);
            await Promise.allSettled(newOnes.map(g => fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/guests`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ team: g.team, firstName: g.firstName, lastName: g.lastName, shirtNumber: g.shirtNumber }) })));
            // Clear matches cache so updated match list refetches
            try { cacheManager.clearCache('matches_cache'); } catch { /* ignore cache clear issues */ }
            toast.success('Match updated');
            router.push(`/league/${leagueId}`);
        } catch (er: unknown) {
            const msg = er instanceof Error ? er.message : 'Update error';
            setError(msg);
        } finally { setIsSubmitting(false); }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    if (error || !league) return <Box sx={{ p: 4, color: 'white' }}><Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white', background: '#388e3c', '&:hover': { background: '#388e3c' } }}>Back</Button><Typography color="error">{error || 'Load failed'}</Typography></Box>;

    const inputStyles = { '& .MuiOutlinedInput-root': { color: '#E5E7EB', background: 'rgba(255,255,255,0.02)', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#e56a16', borderWidth: '2px', boxShadow: '0 0 0 3px rgba(229,106,22,0.1)' }, '& input': { color: '#E5E7EB' } }, '& .MuiInputLabel-root': { color: '#9CA3AF', fontWeight: 500, '&.Mui-focused': { color: '#e56a16' } }, '& .MuiSvgIcon-root': { color: '#E5E7EB' } };
    const autocompleteStyles = { '& .MuiOutlinedInput-root': { color: '#E5E7EB', background: 'rgba(255,255,255,0.02)', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#e56a16', borderWidth: '2px', boxShadow: '0 0 0 3px rgba(229,106,22,0.1)' }, '& .MuiChip-root': { background: 'rgba(229,106,22,0.15)', color: '#E5E7EB', border: '1px solid rgba(229,106,22,0.3)' } }, '& .MuiInputLabel-root': { color: '#9CA3AF', fontWeight: 500, '&.Mui-focused': { color: '#e56a16' } } };
    // Enhanced ShirtAvatar supporting responsive size objects
    const ShirtAvatar = ({ number, size = 56 }: { number?: string | number; size?: number | { xs: number; sm: number; md?: number }; }) => {
        const baseSize = typeof size === 'number' ? size : (size.sm || size.xs);
        const fontSize = baseSize >= 56 ? 16 : baseSize >= 48 ? 14 : baseSize >= 40 ? 12 : baseSize >= 32 ? 10 : 8;
        return (
            <Box sx={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                <img src={ShirtImg.src} alt='Shirt' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <Typography component='span' sx={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize, color: '#111', textShadow: '0 1px 1px rgba(255,255,255,0.6)', lineHeight: 1 }}>
                    {number || '0'}
                </Typography>
            </Box>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 4, minHeight: '100vh', color: '#E5E7EB' }}>
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                        <form onSubmit={handleUpdateMatch} style={{ width: '100%' }}>
                            <Paper sx={{ p: 4, bgcolor: 'rgba(15,15,15,0.95)', color: '#E5E7EB', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)', mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant='h4' sx={{ fontWeight: 700, background: 'linear-gradient(135deg,#e56a16,#cf2326)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: { xs: '1.25rem', sm: '2rem' } }}>Edit Match</Typography>
                                    <Button startIcon={<UserPlus size={20} />} variant='contained' onClick={() => setGuestDialogOpen(true)} sx={{ background: 'linear-gradient(135deg,#e56a16,#cf2326)', color: 'white', fontWeight: 600, borderRadius: 3, px: { xs: 2, sm: 3 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)', transform: 'translateY(-1px)' } }}>Add Guest</Button>
                                </Box>
                                {/* Updated Team & Player Selection Section */}
                                <Grid container spacing={3}>
                                    {/* Team Names & Images */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'row', sm: 'row' } }}>
                                            {/* Home Team */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 2, color: '#43a047', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Home Team</Typography>
                                                <TextField
                                                    label="Team Name"
                                                    value={homeTeamName}
                                                    onChange={(e) => setHomeTeamName(e.target.value)}
                                                    required
                                                    fullWidth
                                                    sx={{ ...inputStyles, mb: 2 }}
                                                />
                                                <Box>
                                                    <input
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        id="home-team-image-upload"
                                                        type="file"
                                                        onChange={handleHomeTeamImageUpload}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Team Logo"
                                                        value={homeTeamImage ? homeTeamImage.name : ''}
                                                        onClick={() => {
                                                            const input = document.getElementById('home-team-image-upload');
                                                            input?.click();
                                                        }}
                                                        InputProps={{
                                                            readOnly: true,
                                                            style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer' },
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <label htmlFor="home-team-image-upload">
                                                                            <Button
                                                                                component="span"
                                                                                variant="outlined"
                                                                                size="small"
                                                                                sx={{
                                                                                    color: '#43a047',
                                                                                    borderColor: '#43a047',
                                                                                    '&:hover': { borderColor: '#388e3c', backgroundColor: 'rgba(67, 160, 71, 0.1)' },
                                                                                    display: { xs: 'none', sm: 'inline-flex' }
                                                                                }}
                                                                            >
                                                                                Browse
                                                                            </Button>
                                                                        </label>
                                                                        {homeTeamImage && (
                                                                            <IconButton onClick={(e) => { e.stopPropagation(); handleRemoveHomeTeamImage(); }} size="small" sx={{ color: '#f44336' }}>
                                                                                <X size={16} />
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                        sx={{ ...inputStyles }}
                                                    />
                                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar
                                                            src={homeTeamImagePreview || defaultTeamImage}
                                                            alt="Home Team"
                                                            imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                                            sx={{ width: 50, height: 50, border: '2px solid #43a047', '& .MuiAvatar-img': { objectFit: 'contain' } }}
                                                        />
                                                        <Typography variant="body2" sx={{ color: '#B2DFDB' }}>Logo Preview</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            {/* Away Team */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 2, color: '#ef5350', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Away Team</Typography>
                                                <TextField
                                                    label="Team Name"
                                                    value={awayTeamName}
                                                    onChange={(e) => setAwayTeamName(e.target.value)}
                                                    required
                                                    fullWidth
                                                    sx={{ ...inputStyles, mb: 2 }}
                                                />
                                                <Box>
                                                    <input
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        id="away-team-image-upload"
                                                        type="file"
                                                        onChange={handleAwayTeamImageUpload}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Team Logo"
                                                        value={awayTeamImage ? awayTeamImage.name : ''}
                                                        onClick={() => {
                                                            const input = document.getElementById('away-team-image-upload');
                                                            input?.click();
                                                        }}
                                                        InputProps={{
                                                            readOnly: true,
                                                            style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer' },
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <label htmlFor="away-team-image-upload">
                                                                            <Button
                                                                                component="span"
                                                                                variant="outlined"
                                                                                size="small"
                                                                                sx={{
                                                                                    color: '#ef5350',
                                                                                    borderColor: '#ef5350',
                                                                                    '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(239, 83, 80, 0.1)' },
                                                                                    display: { xs: 'none', sm: 'inline-flex' }
                                                                                }}
                                                                            >
                                                                                Browse
                                                                            </Button>
                                                                        </label>
                                                                        {awayTeamImage && (
                                                                            <IconButton onClick={(e) => { e.stopPropagation(); handleRemoveAwayTeamImage(); }} size="small" sx={{ color: '#f44336' }}>
                                                                                <X size={16} />
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                        sx={{ ...inputStyles }}
                                                    />
                                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar
                                                            src={awayTeamImagePreview || defaultTeamImage}
                                                            alt="Away Team"
                                                            imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                                            sx={{ width: 50, height: 50, border: '2px solid #ef5350', '& .MuiAvatar-img': { objectFit: 'contain' } }}
                                                        />
                                                        <Typography variant="body2" sx={{ color: '#EF9A9A' }}>Logo Preview</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Player Selection */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Team Selection</Typography>
                                            <Button
                                                startIcon={<Shuffle size={18} />}
                                                variant="outlined"
                                                onClick={shuffleTeams}
                                                disabled={homeTeamUsers.filter(p => !p.isGuest).length + awayTeamUsers.filter(p => !p.isGuest).length < 2}
                                                size="medium"
                                                sx={{
                                                    borderColor: '#e56a16',
                                                    color: '#e56a16',
                                                    fontWeight: 600,
                                                    borderRadius: 3,
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                    width: { xs: '100%', sm: 'auto' },
                                                    height: { xs: 32, sm: 36 },
                                                    '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(229, 106, 22, 0.1)' }
                                                }}
                                            >
                                                Shuffle Teams
                                            </Button>
                                        </Box>

                                        {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                                            <Box sx={{ mb: 3, p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <Typography variant="body2" sx={{ mb: 2, color: '#9CA3AF', textAlign: 'center' }}>
                                                    💡 Drag players between teams to balance. Equal teams create better matches!
                                                </Typography>
                                            </Box>
                                        )}

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                              <Autocomplete
                                                multiple
                                                options={homePlayerOptions}
                                                disableCloseOnSelect
                                                getOptionLabel={option => `${option.firstName} ${option.lastName}`}
                                                ListboxProps={{
                                                  sx: {
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                                    gap: 1,
                                                    p: 1
                                                  }
                                                }}
                                                renderOption={(props, option) => (
                                                  <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                                    <Avatar src={option.profilePicture || defaultTeamImage} sx={{ width: 40, height: 40, mb: 1 }} />
                                                    <Typography variant="body2">{option.firstName} </Typography>
                                                  {/* {option.lastName} */}
                                                  </Box>
                                                )}
                                                renderTags={(value, getTagProps) =>
                                                  value.map((opt, index) => (
                                                    <Box
                                                      key={opt.id}
                                                      {...getTagProps({ index })}
                                                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1 }}
                                                    >
                                                      <Avatar src={opt.profilePicture || defaultTeamImage} sx={{ width: 32, height: 32, mb: 0.5 }} />
                                                      <Typography sx={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {opt.firstName} 
                                                      </Typography>
                                                      {/* {opt.lastName} */}
                                                    </Box>
                                                  ))
                                                }
                                                // ← bind value + onChange so `value` is never undefined
                                                value={homeTeamUsers}
                                                onChange={(_, newValue) => {
                                                  setHomeTeamUsers(newValue);
                                                  if (homeCaptain && !newValue.some(u => u.id === homeCaptain.id)) {
                                                    setHomeCaptain(null);
                                                  }
                                                }}
                                                renderInput={params => (
                                                  <TextField {...params} label="Select Home Players" sx={{ ...autocompleteStyles }} />
                                                )}
                                              />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                              <Autocomplete
                                                multiple
                                                options={awayPlayerOptions}
                                                disableCloseOnSelect
                                                getOptionLabel={option => `${option.firstName} ${option.lastName}`}
                                                ListboxProps={{
                                                  sx: {
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                                    gap: 1,
                                                    p: 1
                                                  }
                                                }}
                                                renderOption={(props, option) => (
                                                  <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                                    <Avatar src={option.profilePicture || defaultTeamImage} sx={{ width: 40, height: 40, mb: 1 }} />
                                                    <Typography variant="body2">{option.firstName} </Typography>
                                                  {/* {option.lastName} */}
                                                  </Box>
                                                )}
                                                renderTags={(value, getTagProps) =>
                                                  value.map((opt, index) => (
                                                    <Box
                                                      key={opt.id}
                                                      {...getTagProps({ index })}
                                                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1 }}
                                                    >
                                                      <Avatar src={opt.profilePicture || defaultTeamImage} sx={{ width: 32, height: 32, mb: 0.5 }} />
                                                      <Typography sx={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {opt.firstName} 
                                                      </Typography>
                                                      {/* {opt.lastName} */}
                                                    </Box>
                                                  ))
                                                }
                                                // ← bind value + onChange here as well
                                                value={awayTeamUsers}
                                                onChange={(_, newValue) => {
                                                  setAwayTeamUsers(newValue);
                                                  if (awayCaptain && !newValue.some(u => u.id === awayCaptain.id)) {
                                                    setAwayCaptain(null);
                                                  }
                                                }}
                                                renderInput={params => (
                                                  <TextField {...params} label="Select Away Players" sx={{ ...autocompleteStyles }} />
                                                )}
                                              />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Paper>
                            <Paper sx={{ mt: 0, mb: 2, p: 4, bgcolor: 'rgba(15,15,15,0.95)', color: '#E5E7EB', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                                <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>Match Details</Typography>
                                <Typography variant='body2' sx={{ mb: 2, color: '#9CA3AF' }}>These fields are required by the API to save your match.</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}><DatePicker label='Match Date' value={matchDate} onChange={nv => setMatchDate(dayjs(nv))} slotProps={{ textField: { fullWidth: true, required: true, sx: inputStyles } }} /></Grid>
                                    <Grid item xs={12} md={6}><TimePicker label='Start Time' value={startTime} onChange={nv => setStartTime(dayjs(nv))} slotProps={{ textField: { fullWidth: true, required: true, sx: inputStyles } }} /></Grid>
                                    <Grid item xs={12} md={6}><TextField label='Duration (minutes)' type='number' value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} required fullWidth sx={{ ...inputStyles }} /></Grid>
                                    <Grid item xs={12} md={6}><TextField label='Location' value={location} onChange={e => setLocation(e.target.value)} required fullWidth sx={{ ...inputStyles }} /></Grid>
                                </Grid>
                                {error && <Typography color='error' sx={{ my: 3, p: 2, bgcolor: 'rgba(244,67,54,0.1)', borderRadius: 2, border: '1px solid rgba(244,67,54,0.3)' }}>{error}</Typography>}
                            </Paper>
                            <Button type='submit' variant='contained' fullWidth sx={{ py: 2, background: '#ff6a00', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2, boxShadow: '0 2px 8px rgba(255,106,0,0.2)', '&:hover': { background: '#cf2326' } }} disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'SAVE MATCH'}
                            </Button>
                        </form>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                        <Paper sx={{
                            p: { xs: 1.5, sm: 2, md: 3 },
                            bgcolor: 'rgba(15,15,15,0.95)',
                            color: '#E5E7EB',
                            borderRadius: { xs: 2, sm: 3, md: 4 },
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden'
                        }}>
                            <Typography variant="h5" sx={{
                                color: '#fff',
                                fontWeight: 700,
                                textAlign: 'center',
                                mb: { xs: 1.5, sm: 2, md: 3 },
                                fontSize: { xs: '0.875rem', sm: '1.125rem', md: '1.5rem' }
                            }}>
                                Match Preview
                            </Typography>

                            {/* Win Probability */}
                            {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                                <Box sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: { xs: 2, sm: 3 }, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="h6" sx={{ mb: { xs: 1, sm: 1.5, md: 2 }, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem', md: '1.25rem' } }}>Win Probability</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, sm: 1.5, md: 2 } }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#43a047', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{homeWinChance}%</Typography>
                                            <Typography variant="body2" sx={{ color: '#43a047', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{homeTeamName || 'Home'}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#ef5350', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{awayWinChance}%</Typography>
                                            <Typography variant="body2" sx={{ color: '#ef5350', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{awayTeamName || 'Away'}</Typography>
                                        </Box>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={homeWinChance}
                                        sx={{
                                            height: { xs: 6, sm: 8 },
                                            borderRadius: { xs: 3, sm: 4 },
                                            bgcolor: 'rgba(239, 83, 80, 0.3)',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: '#43a047',
                                                borderRadius: { xs: 3, sm: 4 }
                                            }
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 0.5, sm: 1 } }}>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {homeStrength}</Typography>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {awayStrength}</Typography>
                                    </Box>
                                </Box>
                            )}

                            <Divider sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, borderColor: 'rgba(255,255,255,0.3)', width: { xs: '50px', sm: '80px', md: '100px' }, mx: 'auto' }} />

                            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1, md: 2 }, alignItems: 'flex-start' }}>
                                {/* Home Team */}
                                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 1, sm: 1.5, md: 2 }, px: { xs: 0.5, sm: 1 } }}>
                                        <Avatar
                                            src={homeTeamImagePreview || defaultTeamImage}
                                            alt="Home Team"
                                            imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                            sx={{
                                                width: { xs: 20, sm: 28, md: 40 },
                                                height: { xs: 20, sm: 28, md: 40 },
                                                mr: { xs: 0.3, sm: 0.5, md: 1 },
                                                border: '2px solid #43a047',
                                                '& .MuiAvatar-img': { objectFit: 'contain' }
                                            }}
                                        />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="h6" sx={{
                                                color: '#43a047',
                                                fontWeight: 600,
                                                fontSize: { xs: '0.625rem', sm: '0.75rem', md: '1.25rem' },
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {homeTeamName || 'Home Team'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.5rem', sm: '0.65rem', md: '0.75rem' } }}>
                                                {homeTeamUsers.length} players
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {homeCaptain && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: { xs: 0.5, sm: 1, md: 1.5 },
                                                p: { xs: 0.5, sm: 0.8, md: 1.5 },
                                                bgcolor: 'rgba(255, 215, 0, 0.1)',
                                                borderRadius: { xs: 1, sm: 2, md: 3 },
                                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                                cursor: 'pointer',
                                                minHeight: { xs: 28, sm: 35, md: 50 },
                                                '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                                                overflow: 'hidden'
                                            }}
                                            draggable
                                            onDragEnd={() => movePlayer(homeCaptain, 'away')}
                                        >
                                            <ShirtAvatar number={homeCaptain.shirtNumber || (homeCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} />
                                            <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    fontWeight="bold"
                                                    sx={{
                                                        fontSize: { xs: 6.5, sm: 8, md: 12 },
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {homeCaptain.firstName} {homeCaptain.lastName}
                                                    {homeCaptain.isGuest && (
                                                        <Chip
                                                            label="G"
                                                            size="small"
                                                            sx={{
                                                                ml: { xs: 0.3, sm: 0.5, md: 0.8 },
                                                                height: { xs: 10, sm: 12, md: 16 },
                                                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                                                bgcolor: '#e67e22',
                                                                color: 'white',
                                                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: { xs: 5, sm: 6, md: 9 }, color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                    Skill: {calcSkill(homeCaptain)}
                                                </Typography>
                                            </Box>
                                            {homeCaptain.isGuest && (
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: '#f44336',
                                                        ml: { xs: 0.2, sm: 0.3 },
                                                        p: { xs: 0.1, sm: 0.2, md: 0.3 },
                                                        minWidth: { xs: 14, sm: 18, md: 22 },
                                                        width: { xs: 14, sm: 18, md: 22 },
                                                        height: { xs: 14, sm: 18, md: 22 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setHomeCaptain(null);
                                                        const g = homeGuests.find(g => g.tempId === homeCaptain.guestTempId);
                                                        if (g) removeStagedGuest('home', g.tempId);
                                                    }}
                                                >
                                                    <X size={8} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}

                                    {homeTeamUsers
                                        .filter(u => u.id !== homeCaptain?.id)
                                        .map(user => (
                                            <Box
                                                key={user.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: { xs: 0.3, sm: 0.5, md: 1 },
                                                    p: { xs: 0.3, sm: 0.5, md: 1 },
                                                    bgcolor: 'rgba(255,255,255,0.03)',
                                                    borderRadius: { xs: 1, sm: 2, md: 3 },
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    cursor: 'pointer',
                                                    minHeight: { xs: 24, sm: 30, md: 40 },
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                                    overflow: 'hidden'
                                                }}
                                                draggable
                                                onDragEnd={() => movePlayer(user, 'away')}
                                            >
                                                <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 16, sm: 20 }} />
                                                <Box sx={{ ml: { xs: 0.4, sm: 0.6, md: 1 }, flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        fontWeight={500}
                                                        sx={{
                                                            fontSize: { xs: 6, sm: 7.5, md: 10 },
                                                            color: 'white',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {user.firstName} {user.lastName}
                                                        {user.isGuest && (
                                                            <Chip
                                                                label="G"
                                                                size="small"
                                                                sx={{
                                                                    ml: { xs: 0.2, sm: 0.4, md: 0.6 },
                                                                    height: { xs: 8, sm: 10, md: 14 },
                                                                    fontSize: { xs: '0.35rem', sm: '0.45rem', md: '0.55rem' },
                                                                    bgcolor: '#e67e22',
                                                                    color: 'white',
                                                                    '& .MuiChip-label': { px: { xs: 0.15, sm: 0.2, md: 0.4 } }
                                                                }}
                                                            />
                                                        )}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: { xs: 4, sm: 5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                        Skill: {calcSkill(user)}
                                                    </Typography>
                                                </Box>
                                                {user.isGuest && (
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#f44336',
                                                            ml: { xs: 0.1, sm: 0.2, md: 0.3 },
                                                            p: { xs: 0.1, sm: 0.15, md: 0.2 },
                                                            minWidth: { xs: 12, sm: 16, md: 20 },
                                                            width: { xs: 12, sm: 16, md: 20 },
                                                            height: { xs: 12, sm: 16, md: 20 }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const g = homeGuests.find(g => g.tempId === user.guestTempId);
                                                            if (g) removeStagedGuest('home', g.tempId);
                                                        }}
                                                    >
                                                        <X size={7} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        ))}
                                </Box>

                                {/* Divider */}
                                <Box sx={{
                                    width: { xs: '1px', sm: '2px', md: '3px' },
                                    bgcolor: 'rgba(255,255,255,0.4)',
                                    minHeight: { xs: 60, sm: 80, md: 120 },
                                    borderRadius: 0.5,
                                    alignSelf: 'stretch',
                                    flexShrink: 0
                                }} />

                                {/* Away Team */}
                                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 1, sm: 1.5, md: 2 }, px: { xs: 0.5, sm: 1 } }}>
                                        <Avatar
                                            src={awayTeamImagePreview || defaultTeamImage}
                                            alt="Away Team"
                                            imgProps={{ onError: (e) => { (e.currentTarget as HTMLImageElement).src = defaultTeamImage; } }}
                                            sx={{
                                                width: { xs: 20, sm: 28, md: 40 },
                                                height: { xs: 20, sm: 28, md: 40 },
                                                mr: { xs: 0.3, sm: 0.5, md: 1 },
                                                border: '2px solid #ef5350',
                                                '& .MuiAvatar-img': { objectFit: 'contain' }
                                            }}
                                        />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="h6" sx={{
                                                color: '#ef5350',
                                                fontWeight: 600,
                                                fontSize: { xs: '0.625rem', sm: '0.75rem', md: '1.25rem' },
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {awayTeamName || 'Away Team'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.5rem', sm: '0.65rem', md: '0.75rem' } }}>
                                                {awayTeamUsers.length} players
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {awayCaptain && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: { xs: 0.5, sm: 1, md: 1.5 },
                                                p: { xs: 0.5, sm: 0.8, md: 1.5 },
                                                bgcolor: 'rgba(255, 215, 0, 0.1)',
                                                borderRadius: { xs: 1, sm: 2, md: 3 },
                                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                                cursor: 'pointer',
                                                minHeight: { xs: 28, sm: 35, md: 50 },
                                                '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                                                overflow: 'hidden'
                                            }}
                                            draggable
                                            onDragEnd={() => movePlayer(awayCaptain, 'home')}
                                        >
                                            <ShirtAvatar number={awayCaptain.shirtNumber || (awayCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} />
                                            <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    fontWeight="bold"
                                                    sx={{
                                                        fontSize: { xs: 6.5, sm: 8, md: 12 },
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {awayCaptain.firstName} {awayCaptain.lastName}
                                                    {awayCaptain.isGuest && (
                                                        <Chip
                                                            label="G"
                                                            size="small"
                                                            sx={{
                                                                ml: { xs: 0.3, sm: 0.5, md: 0.8 },
                                                                height: { xs: 10, sm: 12, md: 16 },
                                                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                                                bgcolor: '#e67e22',
                                                                color: 'white',
                                                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: { xs: 5, sm: 6, md: 9 }, color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                <Typography sx={{ fontSize: { xs: 4.5, sm: 5.5, md: 8 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                    Skill: {calcSkill(awayCaptain)}
                                                </Typography>
                                            </Box>
                                            {awayCaptain.isGuest && (
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: '#f44336',
                                                        ml: { xs: 0.2, sm: 0.3 },
                                                        p: { xs: 0.1, sm: 0.2, md: 0.3 },
                                                        minWidth: { xs: 14, sm: 18, md: 22 },
                                                        width: { xs: 14, sm: 18, md: 22 },
                                                        height: { xs: 14, sm: 18, md: 22 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAwayCaptain(null);
                                                        const g = awayGuests.find(g => g.tempId === awayCaptain.guestTempId);
                                                        if (g) removeStagedGuest('away', g.tempId);
                                                    }}
                                                >
                                                    <X size={8} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}

                                    {awayTeamUsers
                                        .filter(u => u.id !== awayCaptain?.id)
                                        .map(user => (
                                            <Box
                                                key={user.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: { xs: 0.3, sm: 0.5, md: 1 },
                                                    p: { xs: 0.3, sm: 0.5, md: 1 },
                                                    bgcolor: 'rgba(255,255,255,0.03)',
                                                    borderRadius: { xs: 1, sm: 2, md: 3 },
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    cursor: 'pointer',
                                                    minHeight: { xs: 24, sm: 30, md: 40 },
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                                    overflow: 'hidden'
                                                }}
                                                draggable
                                                onDragEnd={() => movePlayer(user, 'home')}
                                            >
                                                <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 16, sm: 20 }} />
                                                <Box sx={{ ml: { xs: 0.4, sm: 0.6, md: 1 }, flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        fontWeight={500}
                                                        sx={{
                                                            fontSize: { xs: 6, sm: 7.5, md: 10 },
                                                            color: 'white',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {user.firstName} {user.lastName}
                                                        {user.isGuest && (
                                                            <Chip
                                                                label="G"
                                                                size="small"
                                                                sx={{
                                                                    ml: { xs: 0.2, sm: 0.4, md: 0.6 },
                                                                    height: { xs: 8, sm: 10, md: 14 },
                                                                    fontSize: { xs: '0.35rem', sm: '0.45rem', md: '0.55rem' },
                                                                    bgcolor: '#e67e22',
                                                                    color: 'white',
                                                                    '& .MuiChip-label': { px: { xs: 0.15, sm: 0.2, md: 0.4 } }
                                                                }}
                                                            />
                                                        )}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: { xs: 4, sm: 5, md: 7 }, color: '#9CA3AF', display: { xs: 'none', sm: 'block' } }}>
                                                        Skill: {calcSkill(user)}
                                                    </Typography>
                                                </Box>
                                                {user.isGuest && (
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#f44336',
                                                            ml: { xs: 0.1, sm: 0.2, md: 0.3 },
                                                            p: { xs: 0.1, sm: 0.15, md: 0.2 },
                                                            minWidth: { xs: 12, sm: 16, md: 20 },
                                                            width: { xs: 12, sm: 16, md: 20 },
                                                            height: { xs: 12, sm: 16, md: 20 }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const g = awayGuests.find(g => g.tempId === user.guestTempId);
                                                            if (g) removeStagedGuest('away', g.tempId);
                                                        }}
                                                    >
                                                        <X size={7} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
            <Dialog open={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} fullWidth maxWidth='xs'>
                <DialogTitle sx={{ bgcolor: 'rgba(15,15,15,0.95)', color: 'white' }}>Add Guest Player</DialogTitle>
                <DialogContent sx={{ pt: 3, bgcolor: 'rgba(15,15,15,0.95)', color: 'white' }}>
                    <RadioGroup
                        row
                        value={guestTeam}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestTeam(e.target.value as 'home' | 'away')}
                        sx={{ mb: 3, justifyContent: 'center' }}
                    >
                        <FormControlLabel value='home' control={<Radio sx={{ color: '#43a047' }} />} label='Home Team' />
                        <FormControlLabel value='away' control={<Radio sx={{ color: '#ef5350' }} />} label='Away Team' />
                    </RadioGroup>
                    <TextField autoFocus label='Guest Full Name' value={guestName} onChange={e => setGuestName(e.target.value)} fullWidth placeholder='e.g. John Doe' sx={{ '& .MuiOutlinedInput-root': { color: 'white' }, '& .MuiInputLabel-root': { color: '#9CA3AF' } }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, bgcolor: 'rgba(15,15,15,0.95)' }}>
                    <Button onClick={() => setGuestDialogOpen(false)} sx={{ color: '#9CA3AF' }}>Cancel</Button>
                    <Button onClick={handleAddGuest} variant='contained' sx={{ background: 'linear-gradient(135deg,#e56a16,#cf2326)', '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' } }}>Add Guest</Button>
                </DialogActions>
            </Dialog>
            <Toaster position='top-center' reverseOrder={false} />
        </LocalizationProvider>
    );
}
