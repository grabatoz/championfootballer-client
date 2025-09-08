"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Button, TextField, CircularProgress, Autocomplete, Checkbox, Divider, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, LinearProgress, Chip, Grid } from '@mui/material';
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
            } catch (e: any) { setError(e.message || 'Load failed'); } finally { setLoading(false); }
        }, [leagueId, matchId, token]);

        useEffect(() => { if (leagueId && matchId && token) fetchData(); }, [leagueId, matchId, token, fetchData]);

        const guestToPlayer = (g: StagedGuest): PlayerOption => ({ id: `guest-${g.tempId}`, firstName: g.firstName, lastName: g.lastName, email: '', isGuest: true, guestTempId: g.tempId, team: g.team, existingGuestId: g.existingId });

        // Skill calculations
        const calcSkill = (p: PlayerOption) => { if (p.isGuest) return 50; const s = p.skills || {}; const vals = ['dribbling','shooting','passing','pace','defending','physical'].map(k => (s as any)[k] || 0); return Math.round(vals.reduce((a,b)=>a+b,0)/6); };
        const teamStrength = (arr: PlayerOption[]) => arr.length ? Math.round(arr.reduce((s,p)=>s+calcSkill(p),0)/arr.length) : 0;
        const winPct = (a: number, b: number) => { if (!a && !b) return 50; if (!b) return 85; if (!a) return 15; const diff=a-b; return Math.max(15,Math.min(85,Math.round(50+ (diff/100)*30))); };

        // Shuffle
        const shuffleTeams = () => {
            const combined = [...homeTeamUsers.filter(p=>!p.isGuest), ...awayTeamUsers.filter(p=>!p.isGuest)];
            if (combined.length<2) { toast.error('Need at least 2 players'); return; }
            const sorted = [...combined].sort((a,b)=>calcSkill(b)-calcSkill(a));
            const newHome: PlayerOption[] = []; const newAway: PlayerOption[] = [];
            sorted.forEach((p,i)=> (i%2===0? newHome: newAway).push(p));
            // Keep guest players on their original teams
            setHomeTeamUsers([...newHome, ...homeTeamUsers.filter(p=>p.isGuest)]);
            setAwayTeamUsers([...newAway, ...awayTeamUsers.filter(p=>p.isGuest)]);
            setHomeCaptain(null); setAwayCaptain(null);
            toast.success('Teams shuffled');
        };

        // Drag handler
        const movePlayer = (player: PlayerOption, target: 'home'|'away') => {
            if (player.isGuest) { // allow moving guest too
                if (target==='home') {
                    if (!homeTeamUsers.find(p=>p.id===player.id)) { setHomeTeamUsers(p=>[...p, player]); setAwayTeamUsers(p=>p.filter(p=>p.id!==player.id)); if (awayCaptain?.id===player.id) setAwayCaptain(null); }
                } else {
                    if (!awayTeamUsers.find(p=>p.id===player.id)) { setAwayTeamUsers(p=>[...p, player]); setHomeTeamUsers(p=>p.filter(p=>p.id!==player.id)); if (homeCaptain?.id===player.id) setHomeCaptain(null); }
                }
                return;
            }
            if (target==='home') { if (!homeTeamUsers.find(p=>p.id===player.id)) { setHomeTeamUsers(p=>[...p, player]); setAwayTeamUsers(p=>p.filter(p=>p.id!==player.id)); if (awayCaptain?.id===player.id) setAwayCaptain(null); } }
            else { if (!awayTeamUsers.find(p=>p.id===player.id)) { setAwayTeamUsers(p=>[...p, player]); setHomeTeamUsers(p=>p.filter(p=>p.id!==player.id)); if (homeCaptain?.id===player.id) setHomeCaptain(null); } }
        };

        // Add new guest
        const handleAddGuest = () => {
            const trimmed = guestName.trim(); if (!trimmed) return toast.error('Enter guest name');
            const parts = trimmed.split(/\s+/); const firstName = parts[0]; const lastName = parts.slice(1).join(' ') || 'Guest';
            const tempId = `${guestTeam}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; const sg: StagedGuest = { tempId, team: guestTeam, firstName, lastName };
            if (guestTeam==='home') { setHomeGuests(p=>[sg,...p]); setHomeTeamUsers(p=>[guestToPlayer(sg), ...p]); }
            else { setAwayGuests(p=>[sg,...p]); setAwayTeamUsers(p=>[guestToPlayer(sg), ...p]); }
            toast.success('Guest added'); setGuestName(''); setGuestTeam('home'); setGuestDialogOpen(false);
        };

        const removeStagedGuest = (team:'home'|'away', tempId:string) => {
            if (team==='home') { setHomeGuests(g=>g.filter(x=>x.tempId!==tempId)); setHomeTeamUsers(p=>p.filter(x=>x.guestTempId!==tempId)); if (homeCaptain?.guestTempId===tempId) setHomeCaptain(null); }
            else { setAwayGuests(g=>g.filter(x=>x.tempId!==tempId)); setAwayTeamUsers(p=>p.filter(x=>x.guestTempId!==tempId)); if (awayCaptain?.guestTempId===tempId) setAwayCaptain(null); }
        };

        const homeGuestOptions: PlayerOption[] = homeGuests.map(guestToPlayer);
        const awayGuestOptions: PlayerOption[] = awayGuests.map(guestToPlayer);
        const homePlayerOptions: PlayerOption[] = [ ...(league?.members||[]).filter(m => !awayTeamUsers.some(p=>p.id===m.id)), ...homeGuestOptions ];
        const awayPlayerOptions: PlayerOption[] = [ ...(league?.members||[]).filter(m => !homeTeamUsers.some(p=>p.id===m.id)), ...awayGuestOptions ];

        const homeStrength = teamStrength(homeTeamUsers);
        const awayStrength = teamStrength(awayTeamUsers);
        const homeWinChance = winPct(homeStrength, awayStrength);
        const awayWinChance = winPct(awayStrength, homeStrength);

        // Images
        const handleHomeTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f) return; if(!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size>5*1024*1024) return toast.error('Max 5MB'); setHomeTeamImage(f); const r=new FileReader(); r.onload=ev=> setHomeTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
        const handleAwayTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f) return; if(!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size>5*1024*1024) return toast.error('Max 5MB'); setAwayTeamImage(f); const r=new FileReader(); r.onload=ev=> setAwayTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
        const handleRemoveHomeTeamImage = () => { setHomeTeamImage(null); setHomeTeamImagePreview(null); };
        const handleRemoveAwayTeamImage = () => { setAwayTeamImage(null); setAwayTeamImagePreview(null); };

        // Submit (PATCH)
        const handleUpdateMatch = async (e: React.FormEvent) => {
            e.preventDefault(); setIsSubmitting(true); setError(null);
            if (!matchDate || !startTime) { setError('Date/time required'); setIsSubmitting(false); return; }
            if (!homeCaptain || !awayCaptain) { setError('Select captains'); setIsSubmitting(false); return; }
            const start = matchDate.hour(startTime.hour()).minute(startTime.minute()).second(0).millisecond(0);
            const matchDuration = duration || 90; const end = start.add(matchDuration,'minute');
            try {
                const formData = new FormData();
                formData.append('homeTeamName', homeTeamName);
                formData.append('awayTeamName', awayTeamName);
                formData.append('date', start.toISOString());
                formData.append('start', start.toISOString());
                formData.append('end', end.toISOString());
                formData.append('location', location);
                formData.append('homeTeamUsers', JSON.stringify(homeTeamUsers.filter(u=>!u.isGuest).map(u=>u.id)));
                formData.append('awayTeamUsers', JSON.stringify(awayTeamUsers.filter(u=>!u.isGuest).map(u=>u.id)));
                formData.append('homeCaptain', homeCaptain.id);
                formData.append('awayCaptain', awayCaptain.id);
                if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
                if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: formData });
                const j = await res.json().catch(()=>({}));
                if (!j.success) throw new Error(j.message || 'Update failed');
                // Sync guests (create new, delete removed)
                const currentGuests = [...homeGuests, ...awayGuests];
                const currentExistingIds = new Set(currentGuests.filter(g=>g.existingId).map(g=>g.existingId!));
                const toDelete = [...originalGuestIds.current].filter(id => !currentExistingIds.has(id));
                await Promise.allSettled(toDelete.map(id => fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/guests/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })));
                const newOnes = currentGuests.filter(g => !g.existingId);
                await Promise.allSettled(newOnes.map(g => fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}/guests`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ team: g.team, firstName: g.firstName, lastName: g.lastName, shirtNumber: g.shirtNumber }) })));      
                // Clear matches cache so updated match list refetches
                try { (cacheManager as any).clearCache ? (cacheManager as any).clearCache('matches_cache') : null; } catch {}
                toast.success('Match updated');
                router.push(`/league/${leagueId}`);
            } catch (er:any) { setError(er.message || 'Update error'); } finally { setIsSubmitting(false); }
        };

        if (loading) return <Box sx={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh' }}><CircularProgress/></Box>;
        if (error || !league) return <Box sx={{ p:4,color:'white' }}><Button startIcon={<ArrowLeft/>} onClick={()=>router.push(`/league/${leagueId}`)} sx={{ mb:2,color:'white',background:'#388e3c','&:hover':{background:'#388e3c'} }}>Back</Button><Typography color="error">{error||'Load failed'}</Typography></Box>;

        const inputStyles = { '& .MuiOutlinedInput-root': { color:'#E5E7EB', background:'rgba(255,255,255,0.02)', borderRadius:2, '& fieldset':{ borderColor:'rgba(255,255,255,0.15)', borderWidth:'1px' }, '&:hover fieldset':{ borderColor:'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset':{ borderColor:'#e56a16', borderWidth:'2px', boxShadow:'0 0 0 3px rgba(229,106,22,0.1)' }, '& input':{ color:'#E5E7EB' } }, '& .MuiInputLabel-root':{ color:'#9CA3AF', fontWeight:500, '&.Mui-focused':{ color:'#e56a16' } }, '& .MuiSvgIcon-root':{ color:'#E5E7EB' } };
        const autocompleteStyles = { '& .MuiOutlinedInput-root': { color:'#E5E7EB', background:'rgba(255,255,255,0.02)', borderRadius:2, '& fieldset':{ borderColor:'rgba(255,255,255,0.15)', borderWidth:'1px' }, '&:hover fieldset':{ borderColor:'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset':{ borderColor:'#e56a16', borderWidth:'2px', boxShadow:'0 0 0 3px rgba(229,106,22,0.1)' }, '& .MuiChip-root':{ background:'rgba(229,106,22,0.15)', color:'#E5E7EB', border:'1px solid rgba(229,106,22,0.3)' } }, '& .MuiInputLabel-root':{ color:'#9CA3AF', fontWeight:500, '&.Mui-focused':{ color:'#e56a16' } } };
        const ShirtAvatar = ({ number, size=56 }: { number?: string|number; size?: number }) => (<Box sx={{ position:'relative', width:size, height:size, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:1, overflow:'hidden' }}><img src={ShirtImg.src} alt='Shirt' style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }} /><Typography component='span' sx={{ position:'relative', zIndex:1, fontWeight:800, fontSize: size>=56?16:14, color:'#111', textShadow:'0 1px 1px rgba(255,255,255,0.6)' }}>{number||'0'}</Typography></Box>);

        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ p:4, minHeight:'100vh', color:'#E5E7EB' }}>
                    <Box sx={{ display:'flex', gap:3, flexDirection:{ xs:'column', md:'row' } }}>
                        <Box sx={{ width:{ xs:'100%', md:'58.33%' } }}>
                            <Paper component='form' onSubmit={handleUpdateMatch} sx={{ p:4, bgcolor:'rgba(15,15,15,0.95)', color:'#E5E7EB', borderRadius:4, border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', boxShadow:'0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
                                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
                                    <Typography variant='h4' sx={{ fontWeight:700, background:'linear-gradient(135deg,#e56a16,#cf2326)', backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:{ xs:'1.25rem', sm:'2rem' } }}>Edit Match - {league.name}</Typography>
                                    <Button startIcon={<UserPlus size={20}/>} variant='contained' onClick={()=>setGuestDialogOpen(true)} sx={{ background:'linear-gradient(135deg,#e56a16,#cf2326)', color:'white', fontWeight:600, borderRadius:3, px:{ xs:2, sm:3 }, fontSize:{ xs:'0.75rem', sm:'0.875rem' }, '&:hover':{ background:'linear-gradient(135deg,#d32f2f,#b71c1c)', transform:'translateY(-1px)' } }}>Add Guest</Button>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display:'flex', gap:3, mb:3 }}>
                                            <Box sx={{ flex:1 }}>
                                                <Typography variant='h6' sx={{ mb:2, color:'#43a047', fontWeight:600 }}>Home Team</Typography>
                                                <TextField label='Team Name' value={homeTeamName} onChange={e=>setHomeTeamName(e.target.value)} required fullWidth sx={{ ...inputStyles, mb:2 }} />
                                                <Box>
                                                    <input accept='image/*' style={{ display:'none' }} id='home-team-image-upload' type='file' onChange={handleHomeTeamImageUpload} />
                                                    <TextField fullWidth label='Team Logo' value={homeTeamImage? homeTeamImage.name: ''} InputProps={{ readOnly:true, endAdornment:(<Box sx={{ display:'flex', alignItems:'center', gap:1 }}><label htmlFor='home-team-image-upload'><Button component='span' variant='outlined' size='small' sx={{ color:'#43a047', borderColor:'#43a047', '&:hover':{ borderColor:'#388e3c', background:'rgba(67,160,71,0.1)' } }}>Browse</Button></label>{homeTeamImage && <IconButton onClick={handleRemoveHomeTeamImage} size='small' sx={{ color:'#f44336' }}><X size={16}/></IconButton>}</Box>) }} sx={{ ...inputStyles }} />
                                                    {homeTeamImagePreview && <Box sx={{ mt:2, display:'flex', alignItems:'center', gap:2 }}><Avatar src={homeTeamImagePreview} sx={{ width:50, height:50, border:'2px solid #43a047' }} /><Typography variant='body2' sx={{ color:'#B2DFDB' }}>Logo Preview</Typography></Box>}
                                                </Box>
                                            </Box>
                                            <Box sx={{ flex:1 }}>
                                                <Typography variant='h6' sx={{ mb:2, color:'#ef5350', fontWeight:600 }}>Away Team</Typography>
                                                <TextField label='Team Name' value={awayTeamName} onChange={e=>setAwayTeamName(e.target.value)} required fullWidth sx={{ ...inputStyles, mb:2 }} />
                                                <Box>
                                                    <input accept='image/*' style={{ display:'none' }} id='away-team-image-upload' type='file' onChange={handleAwayTeamImageUpload} />
                                                    <TextField fullWidth label='Team Logo' value={awayTeamImage? awayTeamImage.name: ''} InputProps={{ readOnly:true, endAdornment:(<Box sx={{ display:'flex', alignItems:'center', gap:1 }}><label htmlFor='away-team-image-upload'><Button component='span' variant='outlined' size='small' sx={{ color:'#ef5350', borderColor:'#ef5350', '&:hover':{ borderColor:'#d32f2f', background:'rgba(239,83,80,0.1)' } }}>Browse</Button></label>{awayTeamImage && <IconButton onClick={handleRemoveAwayTeamImage} size='small' sx={{ color:'#f44336' }}><X size={16}/></IconButton>}</Box>) }} sx={{ ...inputStyles }} />
                                                    {awayTeamImagePreview && <Box sx={{ mt:2, display:'flex', alignItems:'center', gap:2 }}><Avatar src={awayTeamImagePreview} sx={{ width:50, height:50, border:'2px solid #ef5350' }} /><Typography variant='body2' sx={{ color:'#EF9A9A' }}>Logo Preview</Typography></Box>}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
                                            <Typography variant='h6' sx={{ fontWeight:600 }}>Team Selection</Typography>
                                            <Button startIcon={<Shuffle size={18}/>} variant='outlined' onClick={shuffleTeams} disabled={homeTeamUsers.filter(p=>!p.isGuest).length + awayTeamUsers.filter(p=>!p.isGuest).length < 2} sx={{ borderColor:'#e56a16', color:'#e56a16', fontWeight:600, borderRadius:3, '&:hover':{ borderColor:'#d32f2f', background:'rgba(229,106,22,0.1)' } }}>Shuffle</Button>
                                        </Box>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <Autocomplete multiple options={homePlayerOptions} disableCloseOnSelect getOptionLabel={o=>`${o.firstName} ${o.lastName}${o.isGuest? ' (Guest)':''}`} value={homeTeamUsers} onChange={(e,v)=>{ setHomeTeamUsers(v); if (homeCaptain && !v.some(u=>u.id===homeCaptain.id)) setHomeCaptain(null); }} renderOption={(props, option, { selected }) => (<li {...props} style={{ color:'black', background: selected? '#e3f2fd':'white', padding:'12px 16px' }}><Checkbox checked={selected} /><Box sx={{ display:'flex', alignItems:'center', gap:1 }}><Typography>{option.firstName} {option.lastName}</Typography>{option.isGuest && <Chip label='Guest' size='small' sx={{ bgcolor:'#d35400', color:'white' }}/>}<Chip label={calcSkill(option)} size='small' sx={{ bgcolor:'#1976d2', color:'white' }}/></Box></li>)} renderInput={params=> <TextField {...params} label='Select Home Team Players' sx={{ ...autocompleteStyles }} />} />
                                                {homeTeamUsers.length>0 && <Autocomplete options={homeTeamUsers} getOptionLabel={o=>`${o.firstName} ${o.lastName}${o.isGuest? ' (Guest)':''}`} value={homeCaptain} onChange={(e,v)=>setHomeCaptain(v)} renderInput={p=> <TextField {...p} sx={{ mt:2, ...inputStyles }} label='Select Home Team Captain' required />} />}
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Autocomplete multiple options={awayPlayerOptions} disableCloseOnSelect getOptionLabel={o=>`${o.firstName} ${o.lastName}${o.isGuest? ' (Guest)':''}`} value={awayTeamUsers} onChange={(e,v)=>{ setAwayTeamUsers(v); if (awayCaptain && !v.some(u=>u.id===awayCaptain.id)) setAwayCaptain(null); }} renderOption={(props, option, { selected }) => (<li {...props} style={{ color:'black', background: selected? '#e3f2fd':'white', padding:'12px 16px' }}><Checkbox checked={selected} /><Box sx={{ display:'flex', alignItems:'center', gap:1 }}><Typography>{option.firstName} {option.lastName}</Typography>{option.isGuest && <Chip label='Guest' size='small' sx={{ bgcolor:'#d35400', color:'white' }}/>}<Chip label={calcSkill(option)} size='small' sx={{ bgcolor:'#1976d2', color:'white' }}/></Box></li>)} renderInput={params=> <TextField {...params} label='Select Away Team Players' sx={{ ...autocompleteStyles }} />} />
                                                {awayTeamUsers.length>0 && <Autocomplete options={awayTeamUsers} getOptionLabel={o=>`${o.firstName} ${o.lastName}${o.isGuest? ' (Guest)':''}`} value={awayCaptain} onChange={(e,v)=>setAwayCaptain(v)} renderInput={p=> <TextField {...p} sx={{ mt:2, ...inputStyles }} label='Select Away Team Captain' required />} />}
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant='h6' sx={{ mb:3, fontWeight:600 }}>Match Details</Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}><DatePicker label='Match Date' value={matchDate} onChange={nv=>setMatchDate(dayjs(nv))} slotProps={{ textField:{ fullWidth:true, required:true, sx: inputStyles } }} /></Grid>
                                            <Grid item xs={12} md={6}><TimePicker label='Start Time' value={startTime} onChange={nv=>setStartTime(dayjs(nv))} slotProps={{ textField:{ fullWidth:true, required:true, sx: inputStyles } }} /></Grid>
                                            <Grid item xs={12} md={6}><TextField label='Duration (minutes)' type='number' value={duration} onChange={e=> setDuration(e.target.value===''? '': Number(e.target.value))} required fullWidth sx={{ ...inputStyles }} /></Grid>
                                            <Grid item xs={12} md={6}><TextField label='Location' value={location} onChange={e=>setLocation(e.target.value)} required fullWidth sx={{ ...inputStyles }} /></Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                {error && <Typography color='error' sx={{ my:3, p:2, bgcolor:'rgba(244,67,54,0.1)', borderRadius:2, border:'1px solid rgba(244,67,54,0.3)' }}>{error}</Typography>}
                                <Button type='submit' variant='contained' fullWidth sx={{ mt:{ xs:3, md:4 }, py:{ xs:1.5, sm:2 }, background:'linear-gradient(135deg,#e56a16,#cf2326)', color:'white', fontWeight:'bold', fontSize:{ xs:'1rem', sm:'1.1rem' }, borderRadius:3, '&:hover':{ background:'linear-gradient(135deg,#d32f2f,#b71c1c)', transform:'translateY(-2px)', boxShadow:'0 8px 30px rgba(229,106,22,0.4)' } }} disabled={isSubmitting}>{isSubmitting? <CircularProgress size={28} sx={{ color:'white' }}/>: 'Update Match'}</Button>
                            </Paper>
                        </Box>
                        <Box sx={{ width:{ xs:'100%', md:'41.67%' } }}>
                            <Paper sx={{ p:3, bgcolor:'rgba(15,15,15,0.95)', color:'#E5E7EB', borderRadius:4, border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', boxShadow:'0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
                                <Typography variant='h5' sx={{ color:'#fff', fontWeight:700, textAlign:'center', mb:3 }}>Match Preview</Typography>
                                {(homeTeamUsers.length || awayTeamUsers.length) && <Box sx={{ mb:3, p:3, bgcolor:'rgba(255,255,255,0.03)', borderRadius:3, border:'1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant='h6' sx={{ mb:2, textAlign:'center', fontWeight:600 }}>Win Probability</Typography>
                                    <Box sx={{ display:'flex', justifyContent:'space-between', mb:2 }}>
                                        <Box sx={{ textAlign:'center' }}><Typography variant='h4' sx={{ color:'#43a047', fontWeight:700 }}>{homeWinChance}%</Typography><Typography variant='body2' sx={{ color:'#43a047' }}>{homeTeamName||'Home'}</Typography></Box>
                                        <Box sx={{ textAlign:'center' }}><Typography variant='h4' sx={{ color:'#ef5350', fontWeight:700 }}>{awayWinChance}%</Typography><Typography variant='body2' sx={{ color:'#ef5350' }}>{awayTeamName||'Away'}</Typography></Box>
                                    </Box>
                                    <LinearProgress variant='determinate' value={homeWinChance} sx={{ height:8, borderRadius:4, bgcolor:'rgba(239,83,80,0.3)', '& .MuiLinearProgress-bar':{ bgcolor:'#43a047', borderRadius:4 } }} />
                                    <Box sx={{ display:'flex', justifyContent:'space-between', mt:1 }}><Typography variant='caption' sx={{ color:'#9CA3AF' }}>Strength: {homeStrength}</Typography><Typography variant='caption' sx={{ color:'#9CA3AF' }}>Strength: {awayStrength}</Typography></Box>
                                </Box>}
                                <Divider sx={{ mb:3, borderColor:'rgba(255,255,255,0.12)' }} />
                                <Box sx={{ display:'flex', gap:2 }}>
                                    <Box sx={{ flex:1 }}>
                                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', mb:3 }}>
                                            <Avatar src={homeTeamImagePreview||'/assets/default-team.png'} sx={{ width:40, height:40, mr:1, border:'2px solid #43a047' }} />
                                            <Box><Typography variant='h6' sx={{ color:'#43a047', fontWeight:600 }}>{homeTeamName||'Home Team'}</Typography><Typography variant='caption' sx={{ color:'#9CA3AF' }}>{homeTeamUsers.length} players</Typography></Box>
                                        </Box>
                                        {homeCaptain && <Box sx={{ display:'flex', alignItems:'center', mb:2, p:2, bgcolor:'rgba(255,215,0,0.1)', borderRadius:3, border:'1px solid rgba(255,215,0,0.3)', cursor:'pointer', '&:hover':{ bgcolor:'rgba(255,215,0,0.15)' } }} draggable onDragEnd={()=>movePlayer(homeCaptain,'away')}><ShirtAvatar number={homeCaptain.shirtNumber || (homeCaptain.isGuest? 'G':'0')} size={48}/><Box sx={{ ml:2, flex:1 }}><Typography fontWeight='bold' fontSize={14} noWrap>{homeCaptain.firstName} {homeCaptain.lastName}{homeCaptain.isGuest && <span style={{ color:'#e67e22', fontSize:11, fontWeight:600, marginLeft:4 }}>G</span>}</Typography><Typography fontSize={12} sx={{ color:'gold', fontWeight:'bold' }}>Captain</Typography><Typography fontSize={10} sx={{ color:'#9CA3AF' }}>Skill: {calcSkill(homeCaptain)}</Typography></Box></Box>}
                                        {homeTeamUsers.filter(u=>u.id!==homeCaptain?.id).map(u=> <Box key={u.id} sx={{ display:'flex', alignItems:'center', mb:1.5, p:2, bgcolor:'rgba(255,255,255,0.03)', borderRadius:3, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', '&:hover':{ bgcolor:'rgba(255,255,255,0.08)' } }} draggable onDragEnd={()=>movePlayer(u,'away')}><ShirtAvatar number={u.shirtNumber || (u.isGuest?'G':'0')} size={40}/><Box sx={{ ml:2, flex:1 }}><Typography fontWeight={500} fontSize={13} noWrap sx={{ color:'white' }}>{u.firstName} {u.lastName}{u.isGuest && <span style={{ color:'#e67e22', fontSize:10, fontWeight:600, marginLeft:4 }}>G</span>}</Typography><Typography fontSize={10} sx={{ color:'#9CA3AF' }}>Skill: {calcSkill(u)}</Typography></Box>{u.isGuest && <IconButton size='small' sx={{ color:'#f44336' }} onClick={(e)=>{e.stopPropagation(); const g=homeGuests.find(g=>g.tempId===u.guestTempId); if(g) removeStagedGuest('home', g.tempId);}}><X size={14}/></IconButton>}</Box> )}
                                    </Box>
                                    <Box sx={{ width:2, bgcolor:'rgba(255,255,255,0.2)', minHeight:200, borderRadius:1, alignSelf:'stretch' }} />
                                    <Box sx={{ flex:1 }}>
                                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', mb:3 }}>
                                            <Avatar src={awayTeamImagePreview||'/assets/default-team.png'} sx={{ width:40, height:40, mr:1, border:'2px solid #ef5350' }} />
                                            <Box><Typography variant='h6' sx={{ color:'#ef5350', fontWeight:600 }}>{awayTeamName||'Away Team'}</Typography><Typography variant='caption' sx={{ color:'#9CA3AF' }}>{awayTeamUsers.length} players</Typography></Box>
                                        </Box>
                                        {awayCaptain && <Box sx={{ display:'flex', alignItems:'center', mb:2, p:2, bgcolor:'rgba(255,215,0,0.1)', borderRadius:3, border:'1px solid rgba(255,215,0,0.3)', cursor:'pointer', '&:hover':{ bgcolor:'rgba(255,215,0,0.15)' } }} draggable onDragEnd={()=>movePlayer(awayCaptain,'home')}><ShirtAvatar number={awayCaptain.shirtNumber || (awayCaptain.isGuest? 'G':'0')} size={48}/><Box sx={{ ml:2, flex:1 }}><Typography fontWeight='bold' fontSize={14} noWrap>{awayCaptain.firstName} {awayCaptain.lastName}{awayCaptain.isGuest && <span style={{ color:'#e67e22', fontSize:11, fontWeight:600, marginLeft:4 }}>G</span>}</Typography><Typography fontSize={12} sx={{ color:'gold', fontWeight:'bold' }}>Captain</Typography><Typography fontSize={10} sx={{ color:'#9CA3AF' }}>Skill: {calcSkill(awayCaptain)}</Typography></Box></Box>}
                                        {awayTeamUsers.filter(u=>u.id!==awayCaptain?.id).map(u=> <Box key={u.id} sx={{ display:'flex', alignItems:'center', mb:1.5, p:2, bgcolor:'rgba(255,255,255,0.03)', borderRadius:3, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', '&:hover':{ bgcolor:'rgba(255,255,255,0.08)' } }} draggable onDragEnd={()=>movePlayer(u,'home')}><ShirtAvatar number={u.shirtNumber || (u.isGuest?'G':'0')} size={40}/><Box sx={{ ml:2, flex:1 }}><Typography fontWeight={500} fontSize={13} noWrap sx={{ color:'white' }}>{u.firstName} {u.lastName}{u.isGuest && <span style={{ color:'#e67e22', fontSize:10, fontWeight:600, marginLeft:4 }}>G</span>}</Typography><Typography fontSize={10} sx={{ color:'#9CA3AF' }}>Skill: {calcSkill(u)}</Typography></Box>{u.isGuest && <IconButton size='small' sx={{ color:'#f44336' }} onClick={(e)=>{e.stopPropagation(); const g=awayGuests.find(g=>g.tempId===u.guestTempId); if(g) removeStagedGuest('away', g.tempId);}}><X size={14}/></IconButton>}</Box> )}
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                </Box>
                <Dialog open={guestDialogOpen} onClose={()=>setGuestDialogOpen(false)} fullWidth maxWidth='xs'>
                    <DialogTitle sx={{ bgcolor:'rgba(15,15,15,0.95)', color:'white' }}>Add Guest Player</DialogTitle>
                    <DialogContent sx={{ pt:3, bgcolor:'rgba(15,15,15,0.95)', color:'white' }}>
                        <RadioGroup row value={guestTeam} onChange={e=> setGuestTeam(e.target.value as any)} sx={{ mb:3, justifyContent:'center' }}>
                            <FormControlLabel value='home' control={<Radio sx={{ color:'#43a047' }} />} label='Home Team' />
                            <FormControlLabel value='away' control={<Radio sx={{ color:'#ef5350' }} />} label='Away Team' />
                        </RadioGroup>
                        <TextField autoFocus label='Guest Full Name' value={guestName} onChange={e=>setGuestName(e.target.value)} fullWidth placeholder='e.g. John Doe' sx={{ '& .MuiOutlinedInput-root':{ color:'white' }, '& .MuiInputLabel-root':{ color:'#9CA3AF' } }} />
                    </DialogContent>
                    <DialogActions sx={{ px:3, pb:3, bgcolor:'rgba(15,15,15,0.95)' }}>
                        <Button onClick={()=>setGuestDialogOpen(false)} sx={{ color:'#9CA3AF' }}>Cancel</Button>
                        <Button onClick={handleAddGuest} variant='contained' sx={{ background:'linear-gradient(135deg,#e56a16,#cf2326)', '&:hover':{ background:'linear-gradient(135deg,#d32f2f,#b71c1c)' } }}>Add Guest</Button>
                    </DialogActions>
                </Dialog>
                <Toaster position='top-center' reverseOrder={false} />
            </LocalizationProvider>
        );
    }
