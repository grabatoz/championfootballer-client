'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  IconButton,
  Dialog,
  DialogContent
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import mapImg from '@/Components/images/map.png';
import Image from 'next/image';

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
      elevation={0}
      sx={{
        maxWidth: 360,
        mx: 'auto',
        p: 2,
        bgcolor: '#131212',
        borderRadius: 3
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
  PANEL_BG: '#2b2b2b',
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

interface MapCandidate {
  lat: number;
  lng: number;
  label: string;
}

interface LeafletPopup {
  openPopup: () => void;
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => void;
  invalidateSize: () => void;
  off: (eventName: 'click') => void;
  on: (
    eventName: 'click',
    handler: (event: { latlng: { lat: number; lng: number } }) => void
  ) => void;
  remove: () => void;
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  remove: () => void;
  bindPopup: (content: string) => LeafletPopup;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => void;
}

interface LeafletApi {
  map: (element: HTMLElement) => LeafletMap;
  tileLayer: (urlTemplate: string, options: { maxZoom: number; attribution: string }) => LeafletTileLayer;
  circleMarker: (
    center: [number, number],
    options: {
      radius: number;
      color: string;
      fillColor: string;
      fillOpacity: number;
      weight: number;
    }
  ) => LeafletMarker;
}

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const MAP_DEFAULT_CENTER = { lat: 24.8607, lng: 67.0011 }; // Karachi fallback
const LEAFLET_CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_SRC = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
let leafletLoadPromise: Promise<LeafletApi> | null = null;

const ensureLeafletLoaded = async (): Promise<LeafletApi> => {
  if (typeof window === 'undefined') {
    throw new Error('Map can only load in browser.');
  }
  if (window.L) return window.L;

  if (!document.querySelector('link[data-leaflet-css="true"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_HREF;
    link.setAttribute('data-leaflet-css', 'true');
    document.head.appendChild(link);
  }

  if (!leafletLoadPromise) {
    leafletLoadPromise = new Promise((resolve, reject) => {
      const resolveLeaflet = () => {
        if (window.L) {
          resolve(window.L);
        } else {
          reject(new Error('Map library loaded but unavailable.'));
        }
      };

      const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet-js="true"]');
      if (existing) {
        existing.addEventListener('load', resolveLeaflet);
        existing.addEventListener('error', () => reject(new Error('Failed to load map library.')));
        return;
      }

      const script = document.createElement('script');
      script.src = LEAFLET_JS_SRC;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-leaflet-js', 'true');
      script.onload = resolveLeaflet;
      script.onerror = () => reject(new Error('Failed to load map library.'));
      document.body.appendChild(script);
    });
  }

  return leafletLoadPromise;
};

const clampLocation = (value: string) => value.slice(0, 120);

/* ================== HELPERS ================== */
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);          // 12‑hour clock (start time)
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
// Duration: max 3 hours, 5-minute intervals
const DURATION_HOURS = [0, 1, 2, 3];
const DURATION_MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

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
      bgcolor: '#2b2b2b !important',
      borderRadius: 2,
      // border: `1px solid ${THEME.BORDER}`,
      position: 'relative',
      overflow: 'hidden'
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
      
      fontWeight: 700,
      borderRadius: 3,
      fontSize: { xs: '1.1rem', md: '1.7rem' },
      background: '#00a77f',
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
        background: '#008c6a',
        boxShadow: '0 10px 34px -4px rgba(0,167,127,0.55)'
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
  const [durHours, setDurHours] = useState<number>(0);
  const [durMinutes, setDurMinutes] = useState<number>(0);
  const [location, setLocation] = useState<string>('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapResults, setMapResults] = useState<MapCandidate[]>([]);
  const [selectedMapPoint, setSelectedMapPoint] = useState<MapCandidate | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const placeMapMarker = useCallback((lat: number, lng: number, label: string, zoom = 15) => {
    if (!mapRef.current || !window.L) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    markerRef.current = window.L
      .circleMarker([lat, lng], {
        radius: 8,
        color: '#e56a16',
        fillColor: '#cf2326',
        fillOpacity: 0.8,
        weight: 2
      })
      .addTo(mapRef.current);

    markerRef.current.bindPopup(label).openPopup();
    mapRef.current.setView([lat, lng], zoom);
  }, []);

  const applyLocationFromMap = useCallback(
    (candidate: MapCandidate, options?: { syncSearch?: boolean; zoom?: number }) => {
      setSelectedMapPoint(candidate);
      setLocation(clampLocation(candidate.label));
      if (options?.syncSearch) {
        setMapSearch(candidate.label);
      }
      placeMapMarker(candidate.lat, candidate.lng, candidate.label, options?.zoom ?? 15);
    },
    [placeMapMarker]
  );

  const searchMapLocations = useCallback(async (query: string): Promise<MapCandidate[]> => {
    const q = query.trim();
    if (!q) return [];

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '6');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error('Could not search location.');

    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;

    return data
      .map((item) => ({
        lat: Number(item.lat),
        lng: Number(item.lon),
        label: item.display_name
      }))
      .filter(
        (item) =>
          Number.isFinite(item.lat) &&
          Number.isFinite(item.lng) &&
          typeof item.label === 'string' &&
          item.label.trim().length > 0
      );
  }, []);

  const reverseLookupLocation = useCallback(async (lat: number, lng: number) => {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'jsonv2');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error('Could not get address from selected point.');

    const data = (await res.json()) as { display_name?: string };
    return data.display_name?.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }, []);

  const handleOpenMap = useCallback(() => {
    setMapSearch(location.trim());
    setMapError(null);
    setMapResults([]);
    setIsMapOpen(true);
  }, [location]);

  const handleMapSearch = useCallback(async () => {
    const query = mapSearch.trim();
    if (!query) {
      setMapResults([]);
      setMapError('Please type a location first.');
      return;
    }

    setMapLoading(true);
    setMapError(null);
    try {
      const results = await searchMapLocations(query);
      setMapResults(results);

      if (!results.length) {
        setMapError('No location found. Try another search.');
        return;
      }

      applyLocationFromMap(results[0], { zoom: 14 });
    } catch (e: unknown) {
      setMapError(e instanceof Error ? e.message : 'Unable to search location.');
    } finally {
      setMapLoading(false);
    }
  }, [applyLocationFromMap, mapSearch, searchMapLocations]);

  const handleMapResultClick = useCallback(
    (candidate: MapCandidate) => {
      setMapError(null);
      applyLocationFromMap(candidate, { syncSearch: true, zoom: 15 });
    },
    [applyLocationFromMap]
  );

  useEffect(() => {
    if (!isMapOpen) return;
    let cancelled = false;

    const setupMap = async () => {
      setMapLoading(true);
      setMapError(null);

      try {
        const L = await ensureLeafletLoaded();
        if (cancelled || !mapContainerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerRef.current);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapRef.current);
        }

        mapRef.current.invalidateSize();
        window.setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 120);
        mapRef.current.off('click');
        mapRef.current.on('click', async (event: { latlng: { lat: number; lng: number } }) => {
          const { lat, lng } = event.latlng;
          setMapLoading(true);

          try {
            const label = await reverseLookupLocation(lat, lng);
            handleMapResultClick({ lat, lng, label });
          } catch {
            handleMapResultClick({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
            setMapError('Point selected, but exact address lookup failed.');
          } finally {
            setMapLoading(false);
          }
        });

        const typedLocation = location.trim();
        if (selectedMapPoint) {
          placeMapMarker(selectedMapPoint.lat, selectedMapPoint.lng, selectedMapPoint.label, 14);
        } else if (typedLocation) {
          const results = await searchMapLocations(typedLocation);
          if (!cancelled && results.length > 0) {
            setMapResults(results);
            applyLocationFromMap(results[0], { zoom: 14 });
          } else if (!cancelled) {
            mapRef.current.setView([MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng], 6);
          }
        } else {
          mapRef.current.setView([MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng], 6);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setMapError(e instanceof Error ? e.message : 'Unable to load map right now.');
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    };

    setupMap();

    return () => {
      cancelled = true;
    };
  }, [
    applyLocationFromMap,
    handleMapResultClick,
    isMapOpen,
    location,
    placeMapMarker,
    reverseLookupLocation,
    searchMapLocations,
    selectedMapPoint
  ]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  const finishTime = useMemo(
    () => formatFinish(date, durHours, durMinutes, hour, minute, isPM),
    [date, durHours, durMinutes, hour, minute, isPM]
  );

  const fetchLeague = useCallback(async () => {
    if (!leagueId || !token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}?includeMatches=0`, {
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
      
      console.log('✅ Match created successfully:', json.match);
      
      if (typeof window !== 'undefined') {
        // � STEP 1: Update cache with new match immediately
        console.log('� Updating cache with new match...');
        
        try {
          // Get existing league cache
          const STORAGE_KEY = 'cf_instant_cache';
          const storedCache = localStorage.getItem(STORAGE_KEY);
          
          if (storedCache) {
            const cacheData = JSON.parse(storedCache);
            const leagueCacheKey = `leagues_${league.id}`;
            
            // If league exists in cache, add new match to it
            if (cacheData[leagueCacheKey]) {
              const leagueCache = cacheData[leagueCacheKey];
              
              // Add new match to league's matches array
              if (leagueCache.data && leagueCache.data.league) {
                if (!leagueCache.data.league.matches) {
                  leagueCache.data.league.matches = [];
                }
                
                // Add new match at beginning of array (most recent first)
                leagueCache.data.league.matches.unshift(json.match);
                
                // Update cache timestamp
                leagueCache.timestamp = Date.now();
                leagueCache.expires = Date.now() + (5 * 60 * 1000); // 5 minutes
                
                // Save back to localStorage
                cacheData[leagueCacheKey] = leagueCache;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
                
                console.log('  ✅ New match added to cache');
                console.log('  📊 Total matches in cache:', leagueCache.data.league.matches.length);
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to update cache:', error);
          // Not critical, continue with clearing
        }
        
        // 🗑️ STEP 2: Clear other caches to force refresh elsewhere
        console.log('🗑️ Clearing stale caches...');
        const keys = Object.keys(localStorage);
        let clearedCount = 0;
        keys.forEach((key) => {
          // Clear all match/league related caches to force fresh fetch
          if (
            key.includes('match') ||
            key.includes('league') ||
            key.includes('cf_cache') ||
            key.includes('cf_instant') ||
            key.startsWith('chunk_')
          ) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        });
        console.log(`  ✅ Cleared ${clearedCount} stale cache items`);
        
        // 📢 STEP 3: Dispatch events to update UI everywhere
        console.log('📢 Dispatching events...');
        
        window.dispatchEvent(new CustomEvent('match-created', { 
          detail: { 
            match: json.match, 
            leagueId: league.id, 
            timestamp: Date.now() 
          } 
        }));
        
        window.dispatchEvent(new CustomEvent('cache-cleared', {
          detail: { 
            method: 'POST', 
            url: '/matches', 
            timestamp: Date.now() 
          }
        }));
        
        window.dispatchEvent(new CustomEvent('league-updated', {
          detail: { 
            leagueId: league.id, 
            timestamp: Date.now() 
          }
        }));
        
        console.log('✅ Events dispatched: match-created, cache-cleared, league-updated');
      }
      
      toast.success('Match created');
      router.push(`/league/${league.id}`);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Unable to create match';
      setError(errorMsg);
      toast.error(errorMsg);
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
    backgroundColor: '#424242',
    '.MuiSelect-icon': { color: THEME.TEXT_MUTED },
    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.45)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.65)' },
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
      borderRadius: 2,
      fontWeight: 500,
      letterSpacing: 0.35,
      transition: 'border-color .25s, box-shadow .25s',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
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

  const selectMenuProps = {
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    variant: 'menu' as const,
    disableAutoFocusItem: true,
    MenuListProps: {
      sx: {
        py: 0,
        maxHeight: 260,
        overflowY: 'auto',
        bgcolor: '#424242',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.28) #424242',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: '#424242'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.28)',
          borderRadius: '6px',
          border: '1px solid #424242'
        }
      }
    },
    PaperProps: {
      sx: {
        mt: 0.25,
        bgcolor: '#424242',
        color: THEME.TEXT,
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        '& .MuiMenu-list': {
          py: 0
        },
        '& .MuiMenuItem-root': {
          minHeight: 38,
          color: THEME.TEXT,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.08)'
          }
        },
        '& .MuiMenuItem-root.Mui-selected': {
          backgroundColor: 'rgba(229,106,22,0.28)'
        },
        '& .MuiMenuItem-root.Mui-selected:hover': {
          backgroundColor: 'rgba(229,106,22,0.38)'
        }
      }
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          p: { xs: 2.5, md: 5 },
          color: THEME.TEXT,
          fontFamily: '"Woodford Bourne Pro", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          // background:
          //   'radial-gradient(circle at 18% 14%, rgba(229,106,22,0.12) 0%, #050505 58%)'
        }}
      >
        {/* CREATE MATCH Header */}
        <Box sx={{ mb: { xs: 1, md: 2 }, mt: { xs: -2.5, md: -5 }, bgcolor: 'black', p: { xs: 2, md: 3 }, mx: { xs: -2.5, sm: -3, md: -5 } }}>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontFamily: '"Oswald", sans-serif !important',
              fontWeight: 700,
              fontSize: { xs: '32px', sm: '42px', md: '55px' },
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              pt: { xs: 1, md: 2 },
               pb: { xs: 0.5, md: 1 },
            }}
            className="all-leagues-heading"
          >
            CREATE MATCH
          </Typography>
          <Typography
            sx={{
              color:'#fff',
              fontSize: { xs: 13.5, md: 19 },
              fontWeight: 400,
              textAlign: 'center',
              letterSpacing: 0.5,
              mb: { xs: 2, md: 5 },
            }}
          >
            Simple quick match creation. You can assign teams later.
          </Typography>
          <Box
            sx={{
              width: '100vw',
              position: 'relative',
              left: '50%',
              transform: 'translateX(-50%)',
              height: '3px',
              background: '#e16419',
              mb: { xs: 2, md: 2 },
            }}
          />
        </Box>

        <GradientCard
          title=""
        >
          <Grid container spacing={4}>
            {/* DATE */}
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 22,
                  letterSpacing: 1,
                  color: '#fff'
                }}
              >
                Match Date
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  p: 2,
                  borderRadius: 2,
                  background: '#1e1e1e',
                  // border: '1px solid rgba(255,255,255,0.15)',
                  overflow: 'hidden'
                }}
              >
                {/* Custom Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1.5,
                    px: 1,
                    gap: 1,
                    
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: 19,
                      fontWeight: 600,
                      letterSpacing: 0.6,
                      color: '#00a77f'
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
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    background: '#323232',
                    border: '1px solid #196c58'
                  }}
                >
                  <Typography sx={{ fontSize: 18, fontWeight: 500, letterSpacing: 0.5, color: '#fff' }}>
                    Selected:
                  </Typography>
                  <Typography sx={{ fontSize: 16, color: THEME.TEXT_MUTED }}>
                    {date.format('ddd, DD MMM YYYY')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            {/* TIME / DURATION */}
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 22,
                  letterSpacing: 1,
                  color: '#fff'
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
                  border: '1px solid rgba(255,255,255,0.45)',
                  borderRadius: 2,
                  background: '#2b2b2b'
                }}
              >
                <Box sx={{ flex: '1 1 140px', minWidth: 140 }}>
                  <Typography sx={{ fontSize: 14, mb: 0.5, color: '#fff' }}>
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
                    MenuProps={selectMenuProps}
                  >
                    {/* AM: 12 AM, 1 AM, 2 AM, ... 11 AM */}
                    <MenuItem key="AM-12" value="12-AM">12 AM</MenuItem>
                    {HOURS.filter(h => h !== 12).map((h) => (
                      <MenuItem key={`AM-${h}`} value={`${h}-AM`}>
                        {h} AM
                      </MenuItem>
                    ))}
                    {/* PM: 12 PM, 1 PM, 2 PM, ... 11 PM */}
                    <MenuItem key="PM-12" value="12-PM">12 PM</MenuItem>
                    {HOURS.filter(h => h !== 12).map((h) => (
                      <MenuItem key={`PM-${h}`} value={`${h}-PM`}>
                        {h} PM
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box sx={{ flex: '1 1 110px', minWidth: 100 }}>
                  <Typography sx={{ fontSize: 14, mb: 0.5, color: '#fff' }}>
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
                    MenuProps={selectMenuProps}
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
                    fontWeight: 500,
                    mb: 1,
                    fontSize: 22,
                    letterSpacing: 1,
                    color: '#fff'
                  }}
                >
                  Match Duration
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    border: '1px solid rgba(255,255,255,0.45)',
                    borderRadius: 2,
                    background: '#2b2b2b'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 14, mb: 0.5, color: '#fff' }}>
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
                      MenuProps={selectMenuProps}
                    >
                      {DURATION_HOURS.map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 14, mb: 0.5, color: '#fff' }}>
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
                      MenuProps={selectMenuProps}
                    >
                      {DURATION_MINUTES.map((m) => (
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
                    fontWeight: 500,
                    mb: 1,
                    fontSize: 22,
                    letterSpacing: 1,
                    color: '#fff',
                    mt: 1.5
                  }}
                >
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    placeholder="e.g. County or State"
                    value={location}
                    onChange={(e) => {
                      setLocation(clampLocation(e.target.value));
                      setSelectedMapPoint(null);
                    }}
                    sx={{
                      ...textFieldStyles,
                      '& .MuiInputBase-input': { py: '12px' },
                      '& .MuiOutlinedInput-root': {
                        ...textFieldStyles['& .MuiOutlinedInput-root'],
                        background: '#424242'
                      }
                    }}
                    inputProps={{ maxLength: 120 }}
                  />
                  <IconButton
                    onClick={handleOpenMap}
                    sx={{
                      p: 0.5,
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      '&:hover': { background: 'rgba(255,255,255,0.12)' }
                    }}
                    aria-label="Open map picker"
                  >
                    <Image
                      src={mapImg}
                      alt="map"
                      width={40}
                      height={40}
                      style={{ flexShrink: 0 }}
                    />
                  </IconButton>
                </Box>
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
                    background: '#2b2b2b',
                    px: 1,
                    py: 1,
                    borderRadius: 3,
                    fontSize: 15,
                    fontWeight: 500,
                    color: '#fff',
                    lineHeight: 1.55,
                    letterSpacing: 0.35
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
        {/* Bottom spacer */}
        <Box sx={{ pb: { xs: 8, md: 25 } }} />
      </Box>

      <Dialog
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        keepMounted
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: '#1b1b1b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)'
          }
        }}
      >
        <DialogContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontSize: { xs: 18, md: 21 }, fontWeight: 600 }}>
              Pick Match Location
            </Typography>
            <Button
              onClick={() => setIsMapOpen(false)}
              sx={{
                minWidth: 90,
                borderRadius: 2,
                color: '#fff',
                background: '#00a77f',
                '&:hover': { background: '#008c6a' }
              }}
            >
              Done
            </Button>
          </Box>

          <Typography sx={{ mt: 0.8, color: THEME.TEXT_MUTED, fontSize: 13 }}>
            Click anywhere on map, or search and select a place.
          </Typography>

          <Box sx={{ mt: 1.6, display: 'flex', gap: 1.2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search city, stadium, area..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleMapSearch();
                }
              }}
              sx={{
                ...textFieldStyles,
                '& .MuiOutlinedInput-root': {
                  ...textFieldStyles['& .MuiOutlinedInput-root'],
                  background: '#262626'
                }
              }}
            />
            <Button
              onClick={() => void handleMapSearch()}
              disabled={mapLoading}
              sx={{
                minWidth: { xs: '100%', sm: 110 },
                borderRadius: 2,
                color: '#fff',
                background: THEME.GRADIENT_MAIN,
                '&:hover': { background: THEME.GRADIENT_HOVER },
                '&.Mui-disabled': {
                  color: '#cfcfcf',
                  background: 'linear-gradient(135deg,#4b4b4b,#2b2b2b)'
                }
              }}
            >
              {mapLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
            </Button>
          </Box>

          {mapError && (
            <Typography sx={{ mt: 1, color: '#ff9e9e', fontSize: 13.5 }}>
              {mapError}
            </Typography>
          )}

          <Box
            ref={mapContainerRef}
            sx={{
              mt: 1.4,
              height: { xs: 300, md: 420 },
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#111'
            }}
          />

          <Box
            sx={{
              mt: 1.2,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: 170,
              overflowY: 'auto',
              background: '#202020'
            }}
          >
            {mapResults.length > 0 ? (
              mapResults.map((candidate, index) => (
                <Button
                  key={`${candidate.lat}-${candidate.lng}-${index}`}
                  fullWidth
                  onClick={() => handleMapResultClick(candidate)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: '#fff',
                    px: 1.5,
                    py: 1,
                    borderRadius: 0,
                    borderBottom:
                      index === mapResults.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    '&:hover': { background: 'rgba(255,255,255,0.08)' }
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {candidate.label}
                  </Typography>
                </Button>
              ))
            ) : (
              <Typography sx={{ px: 1.5, py: 1.2, fontSize: 13, color: THEME.TEXT_MUTED }}>
                Search results will appear here.
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>

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
