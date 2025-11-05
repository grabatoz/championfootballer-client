'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  Tooltip,
  IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseButton from '@/Components/CloseButton';

/* ================== CUSTOM CALENDAR ================== */
interface CustomCalendarProps {
  month: Date;
  onMonthChange: (m: Date) => void;
  selected: Date;
  onSelect: (d: Date) => void;
  disabled?: (d: Date) => boolean;
}
function CustomCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  disabled = () => false
}: CustomCalendarProps) {
  const start = dayjs(month).startOf('month');
  const daysInMonth = start.daysInMonth();
  const offset = start.day(); // 0 = Sunday
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  const slots = Array.from({ length: total }, (_, i) =>
    i >= offset && i < offset + daysInMonth
      ? start.add(i - offset, 'day')
      : null
  );

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: 360,
        mx: 'auto',
        p: 2,
        bgcolor: THEME.PANEL_BG,
        borderRadius: 3,
        boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
      }}
    >
      {/* header with icon buttons */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <IconButton
          size="small"
          onClick={() => onMonthChange(dayjs(month).subtract(1, 'month').toDate())}
          sx={{ color: THEME.TEXT }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" sx={{ color: THEME.TEXT, fontWeight: 600 }}>
          {dayjs(month).format('MMMM YYYY')}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onMonthChange(dayjs(month).add(1, 'month').toDate())}
          sx={{ color: THEME.TEXT }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* grid of days */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7,40px)"
        justifyContent="center"
        columnGap={1.5}
        rowGap={1.5}
      >
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
          <Typography
            key={wd}
            variant="caption"
            sx={{ width: 40, textAlign: 'center', color: THEME.TEXT_MUTED }}
          >
            {wd}
          </Typography>
        ))}

        {slots.map((d, idx) => {
          if (!d) return <Box key={idx} sx={{ width: 40, height: 40 }} />;
          const dateObj = d.toDate();
          const isSel = dayjs(selected).isSame(d, 'day');
          const isDis = disabled(dateObj);
          return (
            <Button
              key={idx}
              size="small"
              disabled={isDis}
              onClick={() => !isDis && onSelect(dateObj)}
              sx={{
                width: 40,
                height: 40,
                minWidth: 0,
                borderRadius: 2,
                p: 0,
                fontWeight: 500,
                // selected and disabled both white, others your normal text color
                color: isSel
                  ? '#fff'
                  : isDis
                    ? '#fff'
                    : THEME.TEXT,
                background: isSel ? THEME.GRADIENT_MAIN : 'transparent',
                border: dayjs().isSame(d, 'day')
                  ? `2px solid ${THEME.TODAY_RING}`
                  : '2px solid transparent',
                boxShadow: isSel ? THEME.SHADOW_GLOW : 'none',
                transition: 'all .2s',
                '&.Mui-disabled': {
                  // ensure MUI disabled style doesn't dim text
                  color: '#fff'
                },
                '&:hover': {
                  background: isSel
                    ? THEME.GRADIENT_HOVER
                    : 'rgba(255,255,255,0.08)'
                }
              }}
            >
              {d.date()}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
}

/* ================== THEME (CENTRALIZED) ================== */
const THEME = {
  GRADIENT_MAIN: 'linear-gradient(135deg,#e56a16,#cf2326)',
  GRADIENT_HOVER: 'linear-gradient(135deg,#d32f2f,#b71c1c)',
  TEXT: '#E5E7EB',
  TEXT_MUTED: '#9CA3AF',
  TEXT_FADE: 'rgba(229,231,235,0.55)',
  PANEL_BG: 'rgba(15,15,15,0.85)',            // slightly more transparent so glass pops
  BORDER: 'rgba(255,255,255,0.14)',
  BORDER_SOFT: 'rgba(255,255,255,0.08)',
  BORDER_HOVER: 'rgba(255,255,255,0.32)',
  FOCUS: '#e56a16',
  TODAY_RING: 'rgba(229,106,22,0.9)',
  SHADOW_GLOW: '0 0 0 3px rgba(229,106,22,0.25)',
  WEEKEND: 'rgba(229,106,22,0.55)',
  GLASS_BG: 'rgba(255,255,255,0.06)',
  GLASS_BG_HOVER: 'rgba(255,255,255,0.14)'
};

/* ================== TYPES ================== */
interface League {
  id: string;
  name: string;
  active: boolean;
}

/* ================== HELPERS ================== */
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);          // 12‑hour clock (start time)
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
// NEW: duration hours include 0
const DURATION_HOURS = Array.from({ length: 13 }, (_, i) => i);     // 0..12 for duration

const buildDateTime = (base: Dayjs, hour12: number, minute: number, isPM: boolean) => {
  let h24 = hour12 % 12;
  if (isPM) h24 += 12;
  return base.hour(h24).minute(minute).second(0).millisecond(0);
};

const formatFinish = (
  date: Dayjs,
  durH: number,
  durM: number,
  hour12: number,
  minute: number,
  isPM: boolean
) => {
  const start = buildDateTime(date, hour12, minute, isPM);
  return start.add(durH, 'hour').add(durM, 'minute').format('hh:mm A');
};

/* ================== UI COMPONENTS ================== */
const GradientCard: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string }>> = ({
  title,
  subtitle,
  children
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 3 },
      bgcolor: THEME.PANEL_BG,
      borderRadius: 4,
      border: `1px solid ${THEME.BORDER}`,
      backdropFilter: 'blur(18px)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow:
        '0 18px 55px -12px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.04)',
      '&:before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(circle at 78% 9%, rgba(229,106,22,0.16), transparent 62%)'
      }
    }}
  >
    <Typography variant="h3" sx={{
      //  mb: { xs: 3, md: 4 },
      color: '#fff',
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
      {title}
    </Typography>
    {subtitle && (
      <Typography
        sx={{
          mb: 3,
          fontSize: 13.5,
          fontWeight: 500,
          color: THEME.TEXT_MUTED,
          letterSpacing: 0.5
        }}
      >
        {subtitle}
      </Typography>
    )}
    {children}
  </Paper>
);

const GradientButton: React.FC<
  React.PropsWithChildren<{ loading?: boolean; disabled?: boolean; onClick?: () => void }>
> = ({ loading, disabled, onClick, children }) => (
  <Button
    fullWidth
    onClick={onClick}
    disabled={disabled || loading}
    sx={{
      py: 1.65,
      fontWeight: 700,
      borderRadius: 3,
      fontSize: { xs: '0.95rem', md: '1.05rem' },
      background: THEME.GRADIENT_MAIN,
      color: '#fff',
      letterSpacing: 0.55,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all .32s ease',
      '&:before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        opacity: 0,
        background: 'linear-gradient(140deg, rgba(255,255,255,0.20), transparent 48%)',
        transition: 'opacity .35s ease'
      },
      '&:hover:before': { opacity: 1 },
      '&:hover': {
        background: THEME.GRADIENT_HOVER,
        boxShadow: '0 10px 34px -4px rgba(229,106,22,0.55)'
      },
      '&.Mui-disabled': {
        background: 'linear-gradient(135deg,#4b4b4b,#2b2b2b)',
        color: '#b7b7b7'
      }
    }}
  >
    {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : children}
  </Button>
);

/* ================== PAGE ================== */
export default function ScheduleMatchPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const leagueId = params?.id ? String(params.id) : '';

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: initialize start time from user's current local time
  const now = dayjs();
  const initialHour12 = (() => {
    let h = now.hour() % 12;
    if (h === 0) h = 12;
    return h;
  })();
  const initialMinute = now.minute();
  const initialIsPM = now.hour() >= 12;

  // Form state
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [hour, setHour] = useState<number>(initialHour12);      // was 9
  const [minute, setMinute] = useState<number>(initialMinute);  // was 30
  const [isPM, setIsPM] = useState<boolean>(initialIsPM);       // was true
  const [durHours, setDurHours] = useState<number>(1);
  const [durMinutes, setDurMinutes] = useState<number>(40);
  const [location, setLocation] = useState<string>('');

  const finishTime = useMemo(
    () => formatFinish(date, durHours, durMinutes, hour, minute, isPM),
    [date, durHours, durMinutes, hour, minute, isPM]
  );

  const fetchLeague = useCallback(async () => {
    if (!leagueId || !token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load league');
      setLeague({ id: json.league.id, name: json.league.name, active: json.league.active });
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Unable to load league');
      }
    } finally {

      setLoading(false);
    }
  }, [leagueId, token]);

  useEffect(() => {
    fetchLeague();
  }, [fetchLeague]);

  const handleCreate = async () => {
    if (!league) return;
    if (!location.trim()) {
      toast.error('Location required');
      return;
    }
    setSaving(true);
    try {
      const start = buildDateTime(date, hour, minute, isPM);
      const end = start.add(durHours, 'hour').add(durMinutes, 'minute');

      const formData = new FormData();
      formData.append('homeTeamName', 'Home');
      formData.append('awayTeamName', 'Away');
      formData.append('date', start.toISOString());
      formData.append('start', start.toISOString());
      formData.append('end', end.toISOString());
      formData.append('location', location.trim());
      formData.append('homeTeamUsers', JSON.stringify([]));
      formData.append('awayTeamUsers', JSON.stringify([]));
      formData.append('homeCaptain', '');
      formData.append('awayCaptain', '');

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/matches`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.message || 'Failed to create match');
      toast.success('Match created');
      router.push(`/league/${league.id}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Unable to load league');
      }
    } finally {

      setSaving(false);
    }
  };

  /* ============ STATES UI ============ */
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // bgcolor: '#050505'
        }}
      >
        <CircularProgress sx={{ color: THEME.FOCUS }} />
      </Box>
    );
  }

  if (error || !league) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          p: 4,
          color: THEME.TEXT,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          // bgcolor: '#050505'
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff5555' }}>
          {error || 'League not found'}
        </Typography>
        <Button
          onClick={() => router.push('/')}
          sx={{
            alignSelf: 'flex-start',
            background: THEME.GRADIENT_MAIN,
            color: '#fff',
            fontWeight: 600,
            px: 3,
            borderRadius: 3,
            '&:hover': { background: THEME.GRADIENT_HOVER }
          }}
        >
          Go Home
        </Button>
        <Toaster position="top-center" reverseOrder={false} />
      </Box>
    );
  }

  /* ============ FIELD STYLES ============ */
  const selectStyles = {
    color: THEME.TEXT,
    fontWeight: 500,
    '.MuiSelect-icon': { color: THEME.TEXT_MUTED },
    '.MuiOutlinedInput-notchedOutline': { borderColor: THEME.BORDER_SOFT },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: THEME.BORDER_HOVER },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: THEME.FOCUS,
      boxShadow: THEME.SHADOW_GLOW
    },
    // prevent MUI adding background on focus for select trigger
    '& .MuiSelect-select:focus': {
      backgroundColor: 'transparent'
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255,255,255,0.02)',
      color: THEME.TEXT,
      borderRadius: 3,
      fontWeight: 500,
      letterSpacing: 0.35,
      transition: 'border-color .25s, box-shadow .25s',
      '& fieldset': { borderColor: THEME.BORDER_SOFT },
      '&:hover fieldset': { borderColor: THEME.BORDER_HOVER },
      '&.Mui-focused fieldset': {
        borderColor: THEME.FOCUS,
        boxShadow: THEME.SHADOW_GLOW
      }
    },
    '& .MuiInputBase-input::placeholder': {
      color: THEME.TEXT_FADE,
      opacity: 1
    },
    // remove background change on browser auto-fill (Chrome / Edge)
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
      WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.02) inset !important',
      WebkitTextFillColor: THEME.TEXT,
      transition: 'background-color 9999s ease-in-out 0s',
      caretColor: THEME.TEXT
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          p: { xs: 2.5, md: 5 },
          color: THEME.TEXT,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          // background:
          //   'radial-gradient(circle at 18% 14%, rgba(229,106,22,0.12) 0%, #050505 58%)'
        }}
      >
        {/* Close Button */}
        <CloseButton fallbackRoute="/dashboard" />
        <GradientCard
          title="Create Match"
          subtitle="Simple quick match creation. You can assign teams later."
        >
          <Grid container spacing={4}>
            {/* DATE */}
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: 14,
                  letterSpacing: 0.55,
                  color: THEME.TEXT_MUTED
                }}
              >
                Match Date
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  p: 2,
                  borderRadius: 4,
                  background:
                    'linear-gradient(140deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  overflow: 'hidden',
                  boxShadow:
                    '0 18px 40px -14px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.04)'
                }}
              >
                {/* Custom Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1.5,
                    px: 1,
                    gap: 1
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: 0.6,
                      background: THEME.GRADIENT_MAIN,
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    }}
                  >
                    {date.format('MMMM YYYY')}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setDate(date.subtract(1, 'month'))}
                    sx={{
                      minWidth: 34,
                      borderRadius: 2,
                      color: THEME.TEXT,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(255,255,255,0.04)',
                      '&:hover': { background: 'rgba(255,255,255,0.10)' }
                    }}
                  >
                    ‹
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setDate(date.add(1, 'month'))}
                    sx={{
                      minWidth: 34,
                      borderRadius: 2,
                      color: THEME.TEXT,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(255,255,255,0.04)',
                      '&:hover': { background: 'rgba(255,255,255,0.10)' }
                    }}
                  >
                    ›
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CustomCalendar
                    month={date.toDate()}
                    onMonthChange={(m) => setDate(dayjs(m))}
                    selected={date.toDate()}
                    onSelect={(d) => setDate(dayjs(d))}
                    disabled={(d) => dayjs(d).isBefore(dayjs().startOf('day'))}
                  />
                </Box>

                {/* Selected Date Summary */}
                <Box
                  sx={{
                    mt: 3.5,
                    py: 1,
                    px: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    background:
                      'linear-gradient(120deg,rgba(229,106,22,0.18),rgba(229,106,22,0.05))',
                    border: '1px solid rgba(229,106,22,0.35)'
                  }}
                >
                  <Typography sx={{ fontSize: 12.2, fontWeight: 600, letterSpacing: 0.5, color: '#fff' }}>
                    Selected:
                  </Typography>
                  <Typography sx={{ fontSize: 12.2, color: THEME.TEXT_MUTED }}>
                    {date.format('ddd, DD MMM YYYY')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            {/* TIME / DURATION */}
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: 14,
                  letterSpacing: 0.55,
                  color: THEME.TEXT_MUTED
                }}
              >
                Start Time
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  p: 2,
                  border: `1px solid ${THEME.BORDER}`,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.035)'
                }}
              >
                <Box sx={{ flex: '1 1 140px', minWidth: 140 }}>
                  <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
                    Hour
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={`${hour}-${isPM ? 'PM' : 'AM'}`}
                    onChange={(e: SelectChangeEvent<string>) => {
                      const val = e.target.value as string;
                      const [hStr, period] = val.split('-');
                      const hNum = Math.max(1, Math.min(12, parseInt(hStr, 10) || 1));
                      setHour(hNum);
                      setIsPM(period === 'PM');
                    }}
                    sx={selectStyles}
                  >
                    {HOURS.map((h) => (
                      <MenuItem key={`AM-${h}`} value={`${h}-AM`}>
                        {h} AM
                      </MenuItem>
                    ))}
                    {HOURS.map((h) => (
                      <MenuItem key={`PM-${h}`} value={`${h}-PM`}>
                        {h} PM
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box sx={{ flex: '1 1 110px', minWidth: 100 }}>
                  <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
                    Minute
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={minute}
                    onChange={(e: SelectChangeEvent<number>) =>
                      setMinute(Number(e.target.value))
                    }
                    sx={selectStyles}
                  >
                    {MINUTES.map((m) => (
                      <MenuItem value={m} key={m}>
                        {String(m).padStart(2, '0')}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                {/* AM/PM buttons removed; AM/PM integrated into Hour select */}
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: 14,
                    letterSpacing: 0.55,
                    color: THEME.TEXT_MUTED
                  }}
                >
                  Match Duration
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    border: `1px solid ${THEME.BORDER}`,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.035)'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
                      Hours
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={durHours}
                      onChange={(e: SelectChangeEvent<number>) =>
                        setDurHours(Number(e.target.value))
                      }
                      sx={selectStyles}
                    >
                      {DURATION_HOURS.map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
                      Minutes
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={durMinutes}
                      onChange={(e: SelectChangeEvent<number>) =>
                        setDurMinutes(Number(e.target.value))
                      }
                      sx={selectStyles}
                    >
                      {MINUTES.map((m) => (
                        <MenuItem key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>
              </Box>
              {/* LOCATION */}
              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: 14,
                    letterSpacing: 0.55,
                    color: THEME.TEXT_MUTED,
                    mt: 1.5
                  }}
                >
                  Location
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  sx={textFieldStyles}
                  inputProps={{ maxLength: 120 }}
                />
                <Box
                  sx={{
                    mt: 0.75,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: THEME.TEXT_MUTED
                  }}
                >
                  <span>{location.length}/120</span>
                  {/* <span>Required *</span> */}
                </Box>
              </Grid>
              {/* SUMMARY */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    background: THEME.GRADIENT_MAIN,
                    p: 2,
                    borderRadius: 3,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#fff',
                    lineHeight: 1.55,
                    letterSpacing: 0.35,
                    boxShadow: '0 8px 28px -6px rgba(229,106,22,0.45)'
                  }}
                >
                  Match will last {durHours} hour(s) {durMinutes} minute(s).
                  <br />
                  Finish time: {finishTime}
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  mt: 1.5
                }}
              >
                <Tooltip title={!league.active ? 'League is inactive' : ''} placement="top">
                  {/* ← span now takes 100% of the grid column */}
                  <span style={{ display: 'inline-block', width: '100%' }}>
                    <GradientButton
                      loading={saving}
                      disabled={!league.active}
                      onClick={handleCreate}
                    >
                      Save Match
                    </GradientButton>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>

            {/* ACTION */}

          </Grid>
        </GradientCard>
      </Box>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
















// 'use client';
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   Box,
//   Typography,
//   Paper,
//   Button,
//   TextField,
//   CircularProgress,
//   Grid,
//   MenuItem,
//   Select,
//   Tooltip,
//   IconButton
// } from '@mui/material';
// import { SelectChangeEvent } from '@mui/material/Select';
// import dayjs, { Dayjs } from 'dayjs';
// import { useAuth } from '@/lib/hooks';
// import { useParams, useRouter } from 'next/navigation';
// import toast, { Toaster } from 'react-hot-toast';
// import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
// import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// /* ================== CUSTOM CALENDAR ================== */
// interface CustomCalendarProps {
//   month: Date;
//   onMonthChange: (m: Date) => void;
//   selected: Date;
//   onSelect: (d: Date) => void;
//   disabled?: (d: Date) => boolean;
// }
// function CustomCalendar({
//   month,
//   onMonthChange,
//   selected,
//   onSelect,
//   disabled = () => false
// }: CustomCalendarProps) {
//   const start = dayjs(month).startOf('month');
//   const daysInMonth = start.daysInMonth();
//   const offset = start.day(); // 0 = Sunday
//   const total = Math.ceil((offset + daysInMonth) / 7) * 7;
//   const slots = Array.from({ length: total }, (_, i) =>
//     i >= offset && i < offset + daysInMonth
//       ? start.add(i - offset, 'day')
//       : null
//   );

//   return (
//     <Paper
//       elevation={4}
//       sx={{
//         maxWidth: 360,
//         mx: 'auto',
//         p: 2,
//         bgcolor: THEME.PANEL_BG,
//         borderRadius: 3,
//         boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
//       }}
//     >
//       {/* header with icon buttons */}
//       <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
//         <IconButton
//           size="small"
//           onClick={() => onMonthChange(dayjs(month).subtract(1, 'month').toDate())}
//           sx={{ color: THEME.TEXT }}
//         >
//           <ChevronLeftIcon fontSize="small" />
//         </IconButton>
//         <Typography variant="h6" sx={{ color: THEME.TEXT, fontWeight: 600 }}>
//           {dayjs(month).format('MMMM YYYY')}
//         </Typography>
//         <IconButton
//           size="small"
//           onClick={() => onMonthChange(dayjs(month).add(1, 'month').toDate())}
//           sx={{ color: THEME.TEXT }}
//         >
//           <ChevronRightIcon fontSize="small" />
//         </IconButton>
//       </Box>

//       {/* grid of days */}
//       <Box
//         display="grid"
//         gridTemplateColumns="repeat(7,40px)"
//         justifyContent="center"
//         columnGap={1.5}
//         rowGap={1.5}
//       >
//         {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
//           <Typography
//             key={wd}
//             variant="caption"
//             sx={{ width: 40, textAlign: 'center', color: THEME.TEXT_MUTED }}
//           >
//             {wd}
//           </Typography>
//         ))}

//         {slots.map((d, idx) => {
//           if (!d) return <Box key={idx} sx={{ width: 40, height: 40 }} />;
//           const dateObj = d.toDate();
//           const isSel = dayjs(selected).isSame(d, 'day');
//           const isDis = disabled(dateObj);
//           return (
//             <Button
//               key={idx}
//               size="small"
//               disabled={isDis}
//               onClick={() => !isDis && onSelect(dateObj)}
//               sx={{
//                 width: 40,
//                 height: 40,
//                 minWidth: 0,
//                 borderRadius: 2,
//                 p: 0,
//                 fontWeight: 500,
//                 // selected and disabled both white, others your normal text color
//                 color: isSel
//                   ? '#fff'
//                   : isDis
//                     ? '#fff'
//                     : THEME.TEXT,
//                 background: isSel ? THEME.GRADIENT_MAIN : 'transparent',
//                 border: dayjs().isSame(d, 'day')
//                   ? `2px solid ${THEME.TODAY_RING}`
//                   : '2px solid transparent',
//                 boxShadow: isSel ? THEME.SHADOW_GLOW : 'none',
//                 transition: 'all .2s',
//                 '&.Mui-disabled': {
//                   // ensure MUI disabled style doesn't dim text
//                   color: '#fff'
//                 },
//                 '&:hover': {
//                   background: isSel
//                     ? THEME.GRADIENT_HOVER
//                     : 'rgba(255,255,255,0.08)'
//                 }
//               }}
//             >
//               {d.date()}
//             </Button>
//           );
//         })}
//       </Box>
//     </Paper>
//   );
// }

// /* ================== THEME (CENTRALIZED) ================== */
// const THEME = {
//   GRADIENT_MAIN: 'linear-gradient(135deg,#e56a16,#cf2326)',
//   GRADIENT_HOVER: 'linear-gradient(135deg,#d32f2f,#b71c1c)',
//   TEXT: '#E5E7EB',
//   TEXT_MUTED: '#9CA3AF',
//   TEXT_FADE: 'rgba(229,231,235,0.55)',
//   PANEL_BG: 'rgba(15,15,15,0.85)',            // slightly more transparent so glass pops
//   BORDER: 'rgba(255,255,255,0.14)',
//   BORDER_SOFT: 'rgba(255,255,255,0.08)',
//   BORDER_HOVER: 'rgba(255,255,255,0.32)',
//   FOCUS: '#e56a16',
//   TODAY_RING: 'rgba(229,106,22,0.9)',
//   SHADOW_GLOW: '0 0 0 3px rgba(229,106,22,0.25)',
//   WEEKEND: 'rgba(229,106,22,0.55)',
//   GLASS_BG: 'rgba(255,255,255,0.06)',
//   GLASS_BG_HOVER: 'rgba(255,255,255,0.14)'
// };

// /* ================== TYPES ================== */
// interface League {
//   id: string;
//   name: string;
//   active: boolean;
// }

// /* ================== HELPERS ================== */
// const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);          // 12‑hour clock (start time)
// const MINUTES = Array.from({ length: 60 }, (_, i) => i);
// // NEW: duration hours include 0
// const DURATION_HOURS = Array.from({ length: 13 }, (_, i) => i);     // 0..12 for duration

// const buildDateTime = (base: Dayjs, hour12: number, minute: number, isPM: boolean) => {
//   let h24 = hour12 % 12;
//   if (isPM) h24 += 12;
//   return base.hour(h24).minute(minute).second(0).millisecond(0);
// };

// const formatFinish = (
//   date: Dayjs,
//   durH: number,
//   durM: number,
//   hour12: number,
//   minute: number,
//   isPM: boolean
// ) => {
//   const start = buildDateTime(date, hour12, minute, isPM);
//   return start.add(durH, 'hour').add(durM, 'minute').format('hh:mm A');
// };

// /* ================== UI COMPONENTS ================== */
// const GradientCard: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string }>> = ({
//   title,
//   subtitle,
//   children
// }) => (
//   <Paper
//     elevation={0}
//     sx={{
//       p: { xs: 2, md: 3 },
//       bgcolor: THEME.PANEL_BG,
//       borderRadius: 4,
//       border: `1px solid ${THEME.BORDER}`,
//       backdropFilter: 'blur(18px)',
//       position: 'relative',
//       overflow: 'hidden',
//       boxShadow:
//         '0 18px 55px -12px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.04)',
//       '&:before': {
//         content: '""',
//         position: 'absolute',
//         inset: 0,
//         pointerEvents: 'none',
//         background:
//           'radial-gradient(circle at 78% 9%, rgba(229,106,22,0.16), transparent 62%)'
//       }
//     }}
//   >
//     <Typography variant="h3" sx={{
//       //  mb: { xs: 3, md: 4 },
//       color: '#fff',
//       // fontFamily: 'Arial Black, Arial, sans-serif',
//       fontFamily: '"Anton", sans-serif',
//       fontWeight: 'semibold',
//       fontSize: { xs: '32px', sm: '42px', md: '56px' },
//       textAlign: { xs: 'center', md: 'left' },
//       textTransform: 'uppercase',
//       letterSpacing: '2px',
//       textShadow: '0 2px 4px rgba(0,0,0,0.3)'
//     }}
//       className='all-leagues-heading'
//     >
//       {title}
//     </Typography>
//     {subtitle && (
//       <Typography
//         sx={{
//           mb: 3,
//           fontSize: 13.5,
//           fontWeight: 500,
//           color: THEME.TEXT_MUTED,
//           letterSpacing: 0.5
//         }}
//       >
//         {subtitle}
//       </Typography>
//     )}
//     {children}
//   </Paper>
// );

// const GradientButton: React.FC<
//   React.PropsWithChildren<{ loading?: boolean; disabled?: boolean; onClick?: () => void }>
// > = ({ loading, disabled, onClick, children }) => (
//   <Button
//     fullWidth
//     onClick={onClick}
//     disabled={disabled || loading}
//     sx={{
//       py: 1.65,
//       fontWeight: 700,
//       borderRadius: 3,
//       fontSize: { xs: '0.95rem', md: '1.05rem' },
//       background: THEME.GRADIENT_MAIN,
//       color: '#fff',
//       letterSpacing: 0.55,
//       position: 'relative',
//       overflow: 'hidden',
//       transition: 'all .32s ease',
//       '&:before': {
//         content: '""',
//         position: 'absolute',
//         inset: 0,
//         opacity: 0,
//         background: 'linear-gradient(140deg, rgba(255,255,255,0.20), transparent 48%)',
//         transition: 'opacity .35s ease'
//       },
//       '&:hover:before': { opacity: 1 },
//       '&:hover': {
//         background: THEME.GRADIENT_HOVER,
//         boxShadow: '0 10px 34px -4px rgba(229,106,22,0.55)'
//       },
//       '&.Mui-disabled': {
//         background: 'linear-gradient(135deg,#4b4b4b,#2b2b2b)',
//         color: '#b7b7b7'
//       }
//     }}
//   >
//     {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : children}
//   </Button>
// );

// /* ================== PAGE ================== */
// export default function ScheduleMatchPage() {
//   const { token } = useAuth();
//   const params = useParams();
//   const router = useRouter();
//   const leagueId = params?.id ? String(params.id) : '';

//   const [league, setLeague] = useState<League | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // NEW: initialize start time from user's current local time
//   const now = dayjs();
//   const initialHour12 = (() => {
//     let h = now.hour() % 12;
//     if (h === 0) h = 12;
//     return h;
//   })();
//   const initialMinute = now.minute();
//   const initialIsPM = now.hour() >= 12;

//   // Form state
//   const [date, setDate] = useState<Dayjs>(dayjs());
//   const [hour, setHour] = useState<number>(initialHour12);      // was 9
//   const [minute, setMinute] = useState<number>(initialMinute);  // was 30
//   const [isPM, setIsPM] = useState<boolean>(initialIsPM);       // was true
//   const [durHours, setDurHours] = useState<number>(1);
//   const [durMinutes, setDurMinutes] = useState<number>(40);
//   const [location, setLocation] = useState<string>('');

//   const finishTime = useMemo(
//     () => formatFinish(date, durHours, durMinutes, hour, minute, isPM),
//     [date, durHours, durMinutes, hour, minute, isPM]
//   );

//   const fetchLeague = useCallback(async () => {
//     if (!leagueId || !token) return;
//     try {
//       setLoading(true);
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       const json = await res.json();
//       if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load league');
//        setLeague({ id: json.league.id, name: json.league.name, active: json.league.active });
//     } catch (e: unknown) {
//       if (e instanceof Error) {
//         setError(e.message);
//       } else {
//         setError('Unable to load league');
//       }
//     } finally {

//       setLoading(false);
//     }
//   }, [leagueId, token]);

//   useEffect(() => {
//     fetchLeague();
//   }, [fetchLeague]);

//   const handleCreate = async () => {
//     if (!league) return;
//     if (!location.trim()) {
//       toast.error('Location required');
//       return;
//     }
//     setSaving(true);
//     try {
//       const start = buildDateTime(date, hour, minute, isPM);
//       const end = start.add(durHours, 'hour').add(durMinutes, 'minute');

//       const formData = new FormData();
//       formData.append('homeTeamName', 'Home');
//       formData.append('awayTeamName', 'Away');
//       formData.append('date', start.toISOString());
//       formData.append('start', start.toISOString());
//       formData.append('end', end.toISOString());
//       formData.append('location', location.trim());
//       formData.append('homeTeamUsers', JSON.stringify([]));
//       formData.append('awayTeamUsers', JSON.stringify([]));
//       formData.append('homeCaptain', '');
//       formData.append('awayCaptain', '');

//       const resp = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/leagues/${league.id}/matches`,
//         {
//           method: 'POST',
//           headers: { Authorization: `Bearer ${token}` },
//           body: formData
//         }
//       );
//       const json = await resp.json();
//       if (!resp.ok || !json.success) throw new Error(json.message || 'Failed to create match');
//       toast.success('Match created');
//       router.push(`/league/${league.id}`);
//     } catch (e: unknown) {
//       if (e instanceof Error) {
//         setError(e.message);
//       } else {
//         setError('Unable to load league');
//       }
//     } finally {

//       setSaving(false);
//     }
//   };

//   /* ============ STATES UI ============ */
//   if (loading) {
//     return (
//       <Box
//         sx={{
//           minHeight: '100vh',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           // bgcolor: '#050505'
//         }}
//       >
//         <CircularProgress sx={{ color: THEME.FOCUS }} />
//       </Box>
//     );
//   }

//   if (error || !league) {
//     return (
//       <Box
//         sx={{
//           minHeight: '100vh',
//           p: 4,
//           color: THEME.TEXT,
//           display: 'flex',
//           flexDirection: 'column',
//           gap: 3,
//           // bgcolor: '#050505'
//         }}
//       >
//         <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff5555' }}>
//           {error || 'League not found'}
//         </Typography>
//         <Button
//           onClick={() => router.push('/')}
//           sx={{
//             alignSelf: 'flex-start',
//             background: THEME.GRADIENT_MAIN,
//             color: '#fff',
//             fontWeight: 600,
//             px: 3,
//             borderRadius: 3,
//             '&:hover': { background: THEME.GRADIENT_HOVER }
//           }}
//         >
//           Go Home
//         </Button>
//         <Toaster position="top-center" reverseOrder={false} />
//       </Box>
//     );
//   }

//   /* ============ FIELD STYLES ============ */
//   const selectStyles = {
//     color: THEME.TEXT,
//     fontWeight: 500,
//     '.MuiSelect-icon': { color: THEME.TEXT_MUTED },
//     '.MuiOutlinedInput-notchedOutline': { borderColor: THEME.BORDER_SOFT },
//     '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: THEME.BORDER_HOVER },
//     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//       borderColor: THEME.FOCUS,
//       boxShadow: THEME.SHADOW_GLOW
//     },
//     // prevent MUI adding background on focus for select trigger
//     '& .MuiSelect-select:focus': {
//       backgroundColor: 'transparent'
//     }
//   };

//   const textFieldStyles = {
//     '& .MuiOutlinedInput-root': {
//       background: 'rgba(255,255,255,0.02)',
//       color: THEME.TEXT,
//       borderRadius: 3,
//       fontWeight: 500,
//       letterSpacing: 0.35,
//       transition: 'border-color .25s, box-shadow .25s',
//       '& fieldset': { borderColor: THEME.BORDER_SOFT },
//       '&:hover fieldset': { borderColor: THEME.BORDER_HOVER },
//       '&.Mui-focused fieldset': {
//         borderColor: THEME.FOCUS,
//         boxShadow: THEME.SHADOW_GLOW
//       }
//     },
//     '& .MuiInputBase-input::placeholder': {
//       color: THEME.TEXT_FADE,
//       opacity: 1
//     },
//     // remove background change on browser auto-fill (Chrome / Edge)
//     '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
//       WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.02) inset !important',
//       WebkitTextFillColor: THEME.TEXT,
//       transition: 'background-color 9999s ease-in-out 0s',
//       caretColor: THEME.TEXT
//     }
//   };

//   return (
//     <>
//       <Box
//         sx={{
//           minHeight: '100vh',
//           p: { xs: 2.5, md: 5 },
//           color: THEME.TEXT,
//           display: 'flex',
//           flexDirection: 'column',
//           gap: 4,
//           // background:
//           //   'radial-gradient(circle at 18% 14%, rgba(229,106,22,0.12) 0%, #050505 58%)'
//         }}
//       >
//         <GradientCard
//           title="Create Match"
//           subtitle="Simple quick match creation. You can assign teams later."
//         >
//           <Grid container spacing={4}>
//             {/* DATE */}
//             <Grid item xs={12} md={6}>
//               <Typography
//                 sx={{
//                   fontWeight: 600,
//                   mb: 1,
//                   fontSize: 14,
//                   letterSpacing: 0.55,
//                   color: THEME.TEXT_MUTED
//                 }}
//               >
//                 Match Date
//               </Typography>
//               <Box
//                 sx={{
//                   position: 'relative',
//                   p: 2,
//                   borderRadius: 4,
//                   background:
//                     'linear-gradient(140deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 100%)',
//                   border: '1px solid rgba(255,255,255,0.15)',
//                   backdropFilter: 'blur(24px) saturate(180%)',
//                   WebkitBackdropFilter: 'blur(24px) saturate(180%)',
//                   overflow: 'hidden',
//                   boxShadow:
//                     '0 18px 40px -14px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.04)'
//                 }}
//               >
//                 {/* Custom Header */}
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     mb: 1.5,
//                     px: 1,
//                     gap: 1
//                   }}
//                 >
//                   <Typography
//                     sx={{
//                       flex: 1,
//                       fontSize: 15,
//                       fontWeight: 600,
//                       letterSpacing: 0.6,
//                       background: THEME.GRADIENT_MAIN,
//                       WebkitBackgroundClip: 'text',
//                       color: 'transparent'
//                     }}
//                   >
//                     {date.format('MMMM YYYY')}
//                   </Typography>
//                   <Button
//                     size="small"
//                     onClick={() => setDate(date.subtract(1, 'month'))}
//                     sx={{
//                       minWidth: 34,
//                       borderRadius: 2,
//                       color: THEME.TEXT,
//                       border: '1px solid rgba(255,255,255,0.18)',
//                       background: 'rgba(255,255,255,0.04)',
//                       '&:hover': { background: 'rgba(255,255,255,0.10)' }
//                     }}
//                   >
//                     ‹
//                   </Button>
//                   <Button
//                     size="small"
//                     onClick={() => setDate(date.add(1, 'month'))}
//                     sx={{
//                       minWidth: 34,
//                       borderRadius: 2,
//                       color: THEME.TEXT,
//                       border: '1px solid rgba(255,255,255,0.18)',
//                       background: 'rgba(255,255,255,0.04)',
//                       '&:hover': { background: 'rgba(255,255,255,0.10)' }
//                     }}
//                   >
//                     ›
//                   </Button>
//                 </Box>

//                 <Box sx={{ display: 'flex', justifyContent: 'center' }}>
//                   <CustomCalendar
//                     month={date.toDate()}
//                     onMonthChange={(m) => setDate(dayjs(m))}
//                     selected={date.toDate()}
//                     onSelect={(d) => setDate(dayjs(d))}
//                     disabled={(d) => dayjs(d).isBefore(dayjs().startOf('day'))}
//                   />
//                 </Box>

//                 {/* Selected Date Summary */}
//                 <Box
//                   sx={{
//                     mt: 3.5,
//                     py: 1,
//                     px: 1.5,
//                     borderRadius: 3,
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: 1.2,
//                     background:
//                       'linear-gradient(120deg,rgba(229,106,22,0.18),rgba(229,106,22,0.05))',
//                     border: '1px solid rgba(229,106,22,0.35)'
//                   }}
//                 >
//                   <Typography sx={{ fontSize: 12.2, fontWeight: 600, letterSpacing: 0.5, color: '#fff' }}>
//                     Selected:
//                   </Typography>
//                   <Typography sx={{ fontSize: 12.2, color: THEME.TEXT_MUTED }}>
//                     {date.format('ddd, DD MMM YYYY')}
//                   </Typography>
//                 </Box>
//               </Box>
//             </Grid>
//             {/* TIME / DURATION */}
//             <Grid item xs={12} md={6}>
//               <Typography
//                 sx={{
//                   fontWeight: 600,
//                   mb: 1,
//                   fontSize: 14,
//                   letterSpacing: 0.55,
//                   color: THEME.TEXT_MUTED
//                 }}
//               >
//                 Start Time
//               </Typography>
//               <Box
//                 sx={{
//                   display: 'flex',
//                   gap: 2,
//                   flexWrap: 'wrap',
//                   p: 2,
//                   border: `1px solid ${THEME.BORDER}`,
//                   borderRadius: 3,
//                   background: 'rgba(255,255,255,0.035)'
//                 }}
//               >
//                 <Box sx={{ flex: '1 1 100px', minWidth: 90 }}>
//                   <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
//                     Hour
//                   </Typography>
//                   <Select
//                     fullWidth
//                     size="small"
//                     value={hour}
//                     onChange={(e: SelectChangeEvent<number>) =>
//                       setHour(Number(e.target.value))
//                     }
//                     sx={selectStyles}
//                   >
//                     {HOURS.map((h) => (
//                       <MenuItem value={h} key={h}>
//                         {h}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </Box>
//                 <Box sx={{ flex: '1 1 110px', minWidth: 100 }}>
//                   <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
//                     Minute
//                   </Typography>
//                   <Select
//                     fullWidth
//                     size="small"
//                     value={minute}
//                     onChange={(e: SelectChangeEvent<number>) =>
//                       setMinute(Number(e.target.value))
//                     }
//                     sx={selectStyles}
//                   >
//                     {MINUTES.map((m) => (
//                       <MenuItem value={m} key={m}>
//                         {String(m).padStart(2, '0')}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </Box>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     flexDirection: 'column',
//                     gap: 1,
//                     justifyContent: 'space-between',
//                     minWidth: 70
//                   }}
//                 >
//                   <Button
//                     variant={!isPM ? 'contained' : 'outlined'}
//                     size="small"
//                     onClick={() => setIsPM(false)}
//                     sx={{
//                       fontWeight: 600,
//                       borderRadius: 2,
//                       textTransform: 'none',
//                       background: !isPM ? THEME.GRADIENT_MAIN : 'transparent',
//                       color: !isPM ? '#fff' : THEME.TEXT,
//                       borderColor: 'rgba(255,255,255,0.28)',
//                       '&:hover': {
//                         background: !isPM
//                           ? THEME.GRADIENT_HOVER
//                           : 'rgba(255,255,255,0.08)'
//                       }
//                     }}
//                   >
//                     AM
//                   </Button>
//                   <Button
//                     variant={isPM ? 'contained' : 'outlined'}
//                     size="small"
//                     onClick={() => setIsPM(true)}
//                     sx={{
//                       fontWeight: 600,
//                       borderRadius: 2,
//                       textTransform: 'none',
//                       background: isPM ? THEME.GRADIENT_MAIN : 'transparent',
//                       color: isPM ? '#fff' : THEME.TEXT,
//                       borderColor: 'rgba(255,255,255,0.28)',
//                       '&:hover': {
//                         background: isPM
//                           ? THEME.GRADIENT_HOVER
//                           : 'rgba(255,255,255,0.08)'
//                       }
//                     }}
//                   >
//                     PM
//                   </Button>
//                 </Box>
//               </Box>

//               <Box sx={{ mt: 1 }}>
//                 <Typography
//                   sx={{
//                     fontWeight: 600,
//                     mb: 1,
//                     fontSize: 14,
//                     letterSpacing: 0.55,
//                     color: THEME.TEXT_MUTED
//                   }}
//                 >
//                   Match Duration
//                 </Typography>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     gap: 2,
//                     p: 2,
//                     border: `1px solid ${THEME.BORDER}`,
//                     borderRadius: 3,
//                     background: 'rgba(255,255,255,0.035)'
//                   }}
//                 >
//                   <Box sx={{ flex: 1 }}>
//                     <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
//                       Hours
//                     </Typography>
//                     <Select
//                       fullWidth
//                       size="small"
//                       value={durHours}
//                       onChange={(e: SelectChangeEvent<number>) =>
//                         setDurHours(Number(e.target.value))
//                       }
//                       sx={selectStyles}
//                     >
//                       {DURATION_HOURS.map((h) => (
//                         <MenuItem key={h} value={h}>
//                           {h}
//                         </MenuItem>
//                       ))}
//                     </Select>
//                   </Box>
//                   <Box sx={{ flex: 1 }}>
//                     <Typography sx={{ fontSize: 11, mb: 0.5, color: THEME.TEXT_MUTED }}>
//                       Minutes
//                     </Typography>
//                     <Select
//                       fullWidth
//                       size="small"
//                       value={durMinutes}
//                       onChange={(e: SelectChangeEvent<number>) =>
//                         setDurMinutes(Number(e.target.value))
//                       }
//                       sx={selectStyles}
//                     >
//                       {MINUTES.map((m) => (
//                         <MenuItem key={m} value={m}>
//                           {String(m).padStart(2, '0')}
//                         </MenuItem>
//                       ))}
//                     </Select>
//                   </Box>
//                 </Box>
//               </Box>
//               {/* LOCATION */}
//               <Grid item xs={12}>
//                 <Typography
//                   sx={{
//                     fontWeight: 600,
//                     mb: 1,
//                     fontSize: 14,
//                     letterSpacing: 0.55,
//                     color: THEME.TEXT_MUTED,
//                     mt: 1.5
//                   }}
//                 >
//                   Location
//                 </Typography>
//                 <TextField
//                   fullWidth
//                   placeholder="e.g. City, Country"
//                   value={location}
//                   onChange={(e) => setLocation(e.target.value)}
//                   sx={textFieldStyles}
//                   inputProps={{ maxLength: 120 }}
//                 />
//                 <Box
//                   sx={{
//                     mt: 0.75,
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     fontSize: 11,
//                     color: THEME.TEXT_MUTED
//                   }}
//                 >
//                   <span>{location.length}/120</span>
//                   {/* <span>Required *</span> */}
//                 </Box>
//               </Grid>
//               {/* SUMMARY */}
//               <Grid item xs={12}>
//                 <Box
//                   sx={{
//                     background: THEME.GRADIENT_MAIN,
//                     p: 2,
//                     borderRadius: 3,
//                     fontSize: 14,
//                     fontWeight: 500,
//                     color: '#fff',
//                     lineHeight: 1.55,
//                     letterSpacing: 0.35,
//                     boxShadow: '0 8px 28px -6px rgba(229,106,22,0.45)'
//                   }}
//                 >
//                   Match will last {durHours} hour(s) {durMinutes} minute(s).
//                   <br />
//                   Finish time: {finishTime}
//                 </Box>
//               </Grid>
//               <Grid
//                 item
//                 xs={12}
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'flex-end',
//                   alignItems: 'center',
//                   mt: 1.5
//                 }}
//               >
//                 <Tooltip title={!league.active ? 'League is inactive' : ''} placement="top">
//                   {/* ← span now takes 100% of the grid column */}
//                   <span style={{ display: 'inline-block', width: '100%' }}>
//                     <GradientButton
//                       loading={saving}
//                       disabled={!league.active}
//                       onClick={handleCreate}
//                     >
//                       Save Match
//                     </GradientButton>
//                   </span>
//                 </Tooltip>
//               </Grid>
//             </Grid>

//             {/* ACTION */}

//           </Grid>
//         </GradientCard>
//       </Box>
//       <Toaster position="top-center" reverseOrder={false} />
//     </>
//   );
// }