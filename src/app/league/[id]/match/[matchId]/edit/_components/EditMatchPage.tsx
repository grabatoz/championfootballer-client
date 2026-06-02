  "use client";
  import React, { useState, useEffect, useCallback, useRef } from 'react';
  import dynamic from 'next/dynamic';
  import { Box, Typography, Paper, Button, TextField, CircularProgress, Autocomplete, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, LinearProgress, Chip, Grid, InputAdornment, Alert, Menu, MenuItem, ListItemIcon, ListItemText, type PaperProps } from '@mui/material';
  import dayjs, { Dayjs } from 'dayjs';
  import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
  import { DatePicker } from '@mui/x-date-pickers/DatePicker';
  import { TimePicker } from '@mui/x-date-pickers/TimePicker';
  import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
  import { useAuth } from '@/lib/hooks';
  import { useParams, useRouter } from 'next/navigation';
  import { ArrowLeft, X, Shuffle, UserPlus, Scale, UserMinus, ArrowLeftRight, Crown, Check } from 'lucide-react';
  import toast, { Toaster } from 'react-hot-toast';
  import { cacheManager } from '@/lib/cacheManager';
  import Image from 'next/image';
  import ShirtImg from '@/Components/images/shirtimg.png';
  import LeftShirt from '@/Components/images/leftshirt.png';
  import RightShirt from '@/Components/images/rightshirt.png';
  import GuestIcon from '@/Components/images/guesticon.png';
import CalendarIcon from '@/Components/images/calander.png';
import ClockIcon from '@/Components/images/clock.png';
import GlassIcon from '@/Components/images/glass.png';
import LocationIcon from '@/Components/images/location.png';
import EditMatchPopupLoadingSkeleton from '@/Components/loading/EditMatchPopupLoadingSkeleton';

  interface User { id: string; firstName: string; lastName: string; email: string; profilePicture?: string; shirtNumber?: string; skills?: { dribbling?: number; shooting?: number; passing?: number; pace?: number; defending?: number; physical?: number; }; preferredFoot?: 'right' | 'left'; }
  interface League { id: string; name: string; members: User[]; active: boolean; }
  interface Guest { id: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string; }
  interface StagedGuest { tempId: string; team: 'home' | 'away'; firstName: string; lastName: string; shirtNumber?: string; existingId?: string; }
  interface MatchResp { id: string; homeTeamName: string; awayTeamName: string; location: string; date: string; start: string; end: string; status: string; homeCaptainId?: string; awayCaptainId?: string; homeTeamImage?: string; awayTeamImage?: string; homeTeamUsers: User[]; awayTeamUsers: User[]; guests?: Guest[]; }
  type PlayerOption = User & { isGuest?: boolean; guestTempId?: string; team?: 'home' | 'away'; existingGuestId?: string };
  interface AvailabilityRecord { userId: string; status: 'available' | 'unavailable' | 'pending'; }
  type AvailabilityStatus = AvailabilityRecord['status'];
  // interface AvailabilityEntry {
  //   userId: string;
  //   status?: string; // will normalize
  // }
interface AvailabilityApiResponse {
  success?: boolean;
  matchId?: string;
  availableUserIds?: string[];
  availableOrderedUserIds?: string[];
  availableOrderMap?: Record<string, number>;
}

const isGuestLastName = (lastName?: string | null): boolean =>
  String(lastName ?? '').trim().toLowerCase() === 'guest';

const formatGuestAwarePlayerName = (player?: { firstName?: string | null; lastName?: string | null; isGuest?: boolean } | null): string => {
  const first = String(player?.firstName ?? '').trim();
  const last = String(player?.lastName ?? '').trim();

  if (isGuestLastName(last)) {
    return first ? `${first} (Guest)` : '(Guest)';
  }

  const full = `${first} ${last}`.trim();
  if (!full) return player?.isGuest ? '(Guest)' : 'Player';
  return player?.isGuest ? `${full} (Guest)` : full;
};

const formatGuestAwareShortName = (player?: { firstName?: string | null; lastName?: string | null }): string => {
  const first = String(player?.firstName ?? '').trim();
  const last = String(player?.lastName ?? '').trim();
  if (isGuestLastName(last)) return first ? `${first} (Guest)` : '(Guest)';
  return first || `${first} ${last}`.trim() || 'Player';
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const normalizeEntityId = (value: unknown): string => String(value ?? '').trim();

const toNumberOrNull = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : (typeof value === 'string' ? Number(value) : NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTimeOrNull = (value: unknown): number | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareNullableDesc = (a: number | null, b: number | null): number => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
};

const getSeasonMemberIds = (seasonLike: unknown): Set<string> => {
  const seasonObj = toRecord(seasonLike);
  const memberIds = new Set<string>();
  if (!seasonObj) return memberIds;

  const seasonMembers = seasonObj.members;
  if (!Array.isArray(seasonMembers)) return memberIds;

  seasonMembers.forEach((memberLike) => {
    const memberObj = toRecord(memberLike);
    const id = normalizeEntityId(memberObj?.id ?? memberObj?._id);
    if (id) memberIds.add(id);
  });

  return memberIds;
};

const pickLatestSeason = (seasons: Record<string, unknown>[]): Record<string, unknown> | null => {
  if (!seasons.length) return null;

  const activeSeasons = seasons.filter((seasonObj) => seasonObj.isActive === true || seasonObj.active === true);
  const source = activeSeasons.length ? activeSeasons : seasons;

  const sorted = [...source].sort((a, b) => {
    const bySeasonNumber = compareNullableDesc(toNumberOrNull(a.seasonNumber), toNumberOrNull(b.seasonNumber));
    if (bySeasonNumber !== 0) return bySeasonNumber;

    const byStartDate = compareNullableDesc(toTimeOrNull(a.startDate), toTimeOrNull(b.startDate));
    if (byStartDate !== 0) return byStartDate;

    return compareNullableDesc(toTimeOrNull(a.createdAt), toTimeOrNull(b.createdAt));
  });

  return sorted[0] || null;
};

const resolveLatestSeasonMemberIds = (leagueLike: unknown): Set<string> => {
  const leagueObj = toRecord(leagueLike);
  if (!leagueObj) return new Set<string>();

  const seasonsRaw = Array.isArray(leagueObj.seasons) ? leagueObj.seasons : [];
  const seasons = seasonsRaw
    .map((seasonLike) => toRecord(seasonLike))
    .filter((seasonObj): seasonObj is Record<string, unknown> => Boolean(seasonObj));

  const currentSeason = toRecord(leagueObj.currentSeason);
  if (currentSeason) {
    const fromCurrent = getSeasonMemberIds(currentSeason);
    if (fromCurrent.size > 0) return fromCurrent;

    const currentSeasonId = normalizeEntityId(currentSeason.id ?? currentSeason._id);
    if (currentSeasonId && seasons.length) {
      const matchingSeason = seasons.find(
        (seasonObj) => normalizeEntityId(seasonObj.id ?? seasonObj._id) === currentSeasonId
      );
      const fromMatchingSeason = getSeasonMemberIds(matchingSeason);
      if (fromMatchingSeason.size > 0) return fromMatchingSeason;
    }
  }

  const latestSeason = pickLatestSeason(seasons);
  return getSeasonMemberIds(latestSeason);
};

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


  interface EditMatchPageProps {
    leagueIdProp?: string;
    matchIdProp?: string;
    isDialog?: boolean;
    onClose?: () => void;
  }

  type NotificationAudience = 'match' | 'league';

  export default function EditMatchPage({ leagueIdProp, matchIdProp, isDialog, onClose }: EditMatchPageProps) {
    // Fallback team image (used in responsive preview)
    const defaultTeamImage = '/assets/cflogo2.png';
    const defaultTeamImagee = '/assets/imgicon.png';

    // Black dropdown container for Autocomplete to remove white bars
    const BlackPaper = (props: PaperProps) => (
      <Paper
        {...props}
        elevation={0}
        sx={{
          bgcolor: '#000',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      />
    );

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = leagueIdProp || (params?.id ? String(params.id) : '');
    const matchId = matchIdProp || (params?.matchId ? String(params.matchId) : '');

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
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [mapSearch, setMapSearch] = useState('');
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapResults, setMapResults] = useState<MapCandidate[]>([]);
    const [selectedMapPoint, setSelectedMapPoint] = useState<MapCandidate | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRef = useRef<LeafletMarker | null>(null);
    const [homeTeamUsers, setHomeTeamUsers] = useState<PlayerOption[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<PlayerOption[]>([]);
    const [homeCaptain, setHomeCaptain] = useState<PlayerOption | null>(null);
    const [awayCaptain, setAwayCaptain] = useState<PlayerOption | null>(null);

    // Match Notification
    const [showNotificationBox, setShowNotificationBox] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationAudience, setNotificationAudience] = useState<NotificationAudience>('match');

    // Images
    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    // Guests (staged)
    const [homeGuests, setHomeGuests] = useState<StagedGuest[]>([]);
    const [awayGuests, setAwayGuests] = useState<StagedGuest[]>([]);
    const originalGuestIds = useRef<Set<string>>(new Set());

    // Track original registered player ids to detect actual changes
    const originalHomeIdsRef = useRef<string[] | null>(null);
    const originalAwayIdsRef = useRef<string[] | null>(null);
    // Form ref for programmatic submit (auto-save after balance)
    const formRef = useRef<HTMLFormElement | null>(null);

    // Guest dialog
    const [guestDialogOpen, setGuestDialogOpen] = useState(false);
    const [guestTeam, setGuestTeam] = useState<'home' | 'away'>('home');
    const [guestName, setGuestName] = useState('');

    // Player context menu
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<{ player: PlayerOption; team: 'home' | 'away' } | null>(null);

    // NEW: availability map
    const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityRecord['status']>>({});
    const [availableOrderMap, setAvailableOrderMap] = useState<Record<string, number>>({});
    const [availabilityVersion, setAvailabilityVersion] = useState(0);

    const MIN_TOTAL_PLAYERS_FOR_TEAM_UPLOAD = 8;
    const MIN_REGISTERED_PLAYERS_FOR_TEAM_UPLOAD = 6;
    const MIN_REGISTERED_PLAYERS_MESSAGE = 'A minimum of 6 registered players is required to choose teams';
    const DURATION_ERROR_MESSAGE = 'Incorrect duration time added. Please enter a valid time.';
    // Target balance for XP split
    const TARGET_XP_RATIO = 50; // aim for 50-50
    // const RATIO_TOLERANCE = 3;  // acceptable +/- range around target

    // Counts for team validation
    const homeSelectedCount = React.useMemo(() => homeTeamUsers.length, [homeTeamUsers]);
    const awaySelectedCount = React.useMemo(() => awayTeamUsers.length, [awayTeamUsers]);
    const totalSelectedCount = React.useMemo(() => homeSelectedCount + awaySelectedCount, [homeSelectedCount, awaySelectedCount]);
    const registeredSelectedCount = React.useMemo(
      () => homeTeamUsers.filter((u) => !u.isGuest).length + awayTeamUsers.filter((u) => !u.isGuest).length,
      [homeTeamUsers, awayTeamUsers]
    );
    const hasMinimumTeamRequirements =
      registeredSelectedCount >= MIN_REGISTERED_PLAYERS_FOR_TEAM_UPLOAD &&
      totalSelectedCount >= MIN_TOTAL_PLAYERS_FOR_TEAM_UPLOAD;

    // REMOVE client notification route/helper – backend handles it on PATCH
    // const NOTIFY_ROUTE = ...
    // type NotifyPayload = ...
    // const notifySelectedPlayers = useCallback(..., [] as any);

    const parseJson = async (res: Response) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return res.json().catch(() => ({}));
      return {};
    };

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
      } catch (mapSearchError: unknown) {
        setMapError(mapSearchError instanceof Error ? mapSearchError.message : 'Unable to search location.');
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
        } catch (mapLoadError: unknown) {
          if (!cancelled) {
            setMapError(mapLoadError instanceof Error ? mapLoadError.message : 'Unable to load map right now.');
          }
        } finally {
          if (!cancelled) {
            setMapLoading(false);
          }
        }
      };

      void setupMap();

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

    // NEW: fetch availability
    const fetchAvailability = useCallback(async () => {
      if (!matchId || !token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/availability`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const j: AvailabilityApiResponse = await res.json().catch(() => ({} as AvailabilityApiResponse));
        if (!j.success) return;

        // Backend only sends available users. Mark them as 'available'.
        const map: Record<string, AvailabilityStatus> = {};
        (j.availableUserIds || []).forEach(id => { if (id) map[id] = 'available'; });

        const nextOrderMap: Record<string, number> = {};
        if (j.availableOrderMap && typeof j.availableOrderMap === 'object') {
          Object.entries(j.availableOrderMap).forEach(([uid, order]) => {
            const num = Number(order);
            if (uid && Number.isFinite(num) && num > 0) nextOrderMap[uid] = num;
          });
        } else if (Array.isArray(j.availableOrderedUserIds) && j.availableOrderedUserIds.length > 0) {
          j.availableOrderedUserIds.forEach((uid, idx) => {
            if (uid) nextOrderMap[uid] = idx + 1;
          });
        } else {
          (j.availableUserIds || []).forEach((uid, idx) => {
            if (uid) nextOrderMap[uid] = idx + 1;
          });
        }

        setAvailabilityMap(map);          // availability is visual-only in team selection
        setAvailableOrderMap(nextOrderMap);
        setAvailabilityVersion(v => v + 1);
      } catch {
        /* silent */
      }
    }, [matchId, token]);

    // Menu handlers for player context menu
    const handlePlayerClick = (event: React.MouseEvent<HTMLElement>, player: PlayerOption, team: 'home' | 'away') => {
      setMenuAnchor(event.currentTarget);
      setSelectedPlayer({ player, team });
    };

    const handleMenuClose = () => {
      setMenuAnchor(null);
      setSelectedPlayer(null);
    };

    const handleRemovePlayer = () => {
      if (!selectedPlayer) return;
      const { player, team } = selectedPlayer;

      if (team === 'home') {
        // Remove from home team
        setHomeTeamUsers(prev => prev.filter(p => p.id !== player.id));
        // If it was the captain, clear captain
        if (homeCaptain?.id === player.id) setHomeCaptain(null);
        // If it's a guest, also remove from homeGuests
        if (player.isGuest && player.guestTempId) {
          const g = homeGuests.find(g => g.tempId === player.guestTempId);
          if (g) removeStagedGuest('home', g.tempId);
        }
      } else {
        // Remove from away team
        setAwayTeamUsers(prev => prev.filter(p => p.id !== player.id));
        // If it was the captain, clear captain
        if (awayCaptain?.id === player.id) setAwayCaptain(null);
        // If it's a guest, also remove from awayGuests
        if (player.isGuest && player.guestTempId) {
          const g = awayGuests.find(g => g.tempId === player.guestTempId);
          if (g) removeStagedGuest('away', g.tempId);
        }
      }

      handleMenuClose();
      toast.success('Player removed');
    };

    const handleSwitchTeam = () => {
      if (!selectedPlayer) return;
      const { player, team } = selectedPlayer;

      if (team === 'home') {
        // Move from home to away
        setHomeTeamUsers(prev => prev.filter(p => p.id !== player.id));
        setAwayTeamUsers(prev => [...prev, { ...player, team: 'away' }]);
        
        // If it was home captain, clear it
        if (homeCaptain?.id === player.id) setHomeCaptain(null);
        
        // If it's a guest, update the guest's team
        if (player.isGuest && player.guestTempId) {
          setHomeGuests(prev => prev.filter(g => g.tempId !== player.guestTempId));
          setAwayGuests(prev => {
            const existing = prev.find(g => g.tempId === player.guestTempId);
            if (existing) return prev.map(g => g.tempId === player.guestTempId ? { ...g, team: 'away' } : g);
            return [...prev, {
              tempId: player.guestTempId!,
              existingId: player.existingGuestId,
              team: 'away',
              firstName: player.firstName,
              lastName: player.lastName,
            }];
          });
        }
      } else {
        // Move from away to home
        setAwayTeamUsers(prev => prev.filter(p => p.id !== player.id));
        setHomeTeamUsers(prev => [...prev, { ...player, team: 'home' }]);
        
        // If it was away captain, clear it
        if (awayCaptain?.id === player.id) setAwayCaptain(null);
        
        // If it's a guest, update the guest's team
        if (player.isGuest && player.guestTempId) {
          setAwayGuests(prev => prev.filter(g => g.tempId !== player.guestTempId));
          setHomeGuests(prev => {
            const existing = prev.find(g => g.tempId === player.guestTempId);
            if (existing) return prev.map(g => g.tempId === player.guestTempId ? { ...g, team: 'home' } : g);
            return [...prev, {
              tempId: player.guestTempId!,
              existingId: player.existingGuestId,
              team: 'home',
              firstName: player.firstName,
              lastName: player.lastName,
            }];
          });
        }
      }

      handleMenuClose();
      toast.success('Player switched to other team');
    };

    const handleMakeCaptain = () => {
      if (!selectedPlayer) return;
      const { player, team } = selectedPlayer;
      if (team === 'home') {
        setHomeCaptain(player);
      } else {
        setAwayCaptain(player);
      }
      handleMenuClose();
      toast.success('Player set as captain');
    };

    // Helper: already picked in either team
    // const isAlreadyPicked = (id: string) =>
    // homeTeamUsers.some(p => p.id === id) || awayTeamUsers.some(p => p.id === id);

    // const canAddPlayer = (id: string, isGuest?: boolean) => {
    //   if (isGuest) return true;
    //   // Allow adding unless explicitly unavailable
    //   return availabilityMap[id] !== 'unavailable';
    // };

    // Add (or merge) this style object near other styles if you want reuse
    // const disabledOptionStyles = {
    //   opacity: 0.35,
    //   filter: 'grayscale(0.6)',
    //   pointerEvents: 'none',
    //   cursor: 'not-allowed'
    // };

    // Badge meta
    // const availabilityStyle = (st: string) => {
    //   switch (st) {
    //     case 'available': return { bg: '#1b5e20', color: '#a5d6a7', label: 'AVAILABLE' };
    //     case 'maybe': return { bg: '#795548', color: '#ffe0b2', label: 'MAYBE' };
    //     case 'unavailable': return { bg: '#b71c1c', color: '#ffcdd2', label: 'UNAVAILABLE' };
    //     default: return { bg: '#424242', color: '#e0e0e0', label: 'NO RESPONSE' };
    //   }
    // };

    const isMemberUser = useCallback((id: string, memberIds: Set<string>) => memberIds.has(String(id)), []);

    const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        const cacheBuster = `?_t=${Date.now()}`;
        const [leagueRes, matchRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}${cacheBuster}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}${cacheBuster}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          })
        ]);
        const leagueData = await parseJson(leagueRes);
        const matchData = await parseJson(matchRes);
        if (!leagueData?.success) throw new Error(leagueData?.message || 'League fetch failed');
        if (!matchData?.success) throw new Error(matchData?.message || 'Match fetch failed');
        const leagueObj: League = leagueData.league;
        setLeague(leagueObj);
        const m: MatchResp = matchData.match;
        setHomeTeamName(m.homeTeamName || '');
        setAwayTeamName(m.awayTeamName || '');
        setLocation(clampLocation(m.location || ''));
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

        // Players: keep only current league members (fixes stale ex-members still attached to old matches)
        const memberIds = new Set<string>((leagueObj?.members || []).map((u: User) => String(u.id)));
        const homeUsers = (m.homeTeamUsers || []).map(u => ({ ...u })).filter(u => isMemberUser(u.id, memberIds));
        const awayUsers = (m.awayTeamUsers || []).map(u => ({ ...u })).filter(u => isMemberUser(u.id, memberIds));
        setHomeTeamUsers([...homeUsers, ...homeG.map(g => guestToPlayer(g))]);
        setAwayTeamUsers([...awayUsers, ...awayG.map(g => guestToPlayer(g))]);

        // Track original registered player ids to detect actual changes
        originalHomeIdsRef.current = homeUsers.map(u => u.id);
        originalAwayIdsRef.current = awayUsers.map(u => u.id);

        if (m.homeCaptainId && memberIds.has(String(m.homeCaptainId))) {
          const cap = homeUsers.find(u => u.id === m.homeCaptainId);
          if (cap) setHomeCaptain(cap as PlayerOption);
        }
        if (m.awayCaptainId && memberIds.has(String(m.awayCaptainId))) {
          const cap = awayUsers.find(u => u.id === m.awayCaptainId);
          if (cap) setAwayCaptain(cap as PlayerOption);
        }
        if (m.homeTeamImage) setHomeTeamImagePreview(m.homeTeamImage.startsWith('http') ? m.homeTeamImage : `${process.env.NEXT_PUBLIC_API_URL}${m.homeTeamImage}`);
        if (m.awayTeamImage) setAwayTeamImagePreview(m.awayTeamImage.startsWith('http') ? m.awayTeamImage : `${process.env.NEXT_PUBLIC_API_URL}${m.awayTeamImage}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Load failed';
        setError(msg);
      } finally { setLoading(false); }
    }, [leagueId, matchId, token, isMemberUser]);

    useEffect(() => { if (leagueId && matchId && token) fetchData(); }, [leagueId, matchId, token, fetchData]);
    useEffect(() => { if (leagueId && matchId && token) fetchAvailability(); }, [leagueId, matchId, token, fetchAvailability]);

    const guestToPlayer = (g: StagedGuest): PlayerOption => ({ id: `guest-${g.tempId}`, firstName: g.firstName, lastName: g.lastName, email: '', isGuest: true, guestTempId: g.tempId, team: g.team, existingGuestId: g.existingId });

    // Prediction from API
    const [homeWinChance, setHomeWinChance] = useState<number | null>(null);
    const [awayWinChance, setAwayWinChance] = useState<number | null>(null);
    const [, setHomeStrength] = useState<number | null>(null);
    const [, setAwayStrength] = useState<number | null>(null);

    // XP maps for league
    // - userLeagueXP: total XP per player within this league
    // - userLeagueAvgXP: average XP per match within this league (backend computed)
    const [userLeagueXP, setUserLeagueXP] = useState<Record<string, number>>({});
    const [userLeagueAvgXP, setUserLeagueAvgXP] = useState<Record<string, number>>({});
    const [xpLoading, setXpLoading] = useState(false);
    const [xpFetchAttempted, setXpFetchAttempted] = useState(false);
    // Track balancing run to prevent repeated clicks and show progress
    const [isBalancing, setIsBalancing] = useState(false);

    const ensureXPMap = useCallback(async () => {
      if (!leagueId || !token) return {} as Record<string, number>;
      // If we already fetched (success or failure), don't retry
      if (xpFetchAttempted) return userLeagueXP;
      try {
        setXpLoading(true);
        setXpFetchAttempted(true);
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/xp`, { headers });
        if (!res.ok) {
          // Silently handle 404 - endpoint may not exist
          console.warn(`XP endpoint returned ${res.status}, using empty map`);
          return {} as Record<string, number>;
        }
        const json = await res.json();
        // Support either { xp } or { data: { xp } }
        const xpMap = (json?.xp || json?.data?.xp || {}) as Record<string, number>;
        const avgMap = (json?.avg || json?.data?.avg || {}) as Record<string, number>;
        setUserLeagueXP(xpMap);
        setUserLeagueAvgXP(avgMap);
        return xpMap;
      } catch {
        // Silent fail - XP is optional
        return {} as Record<string, number>;
      } finally {
        setXpLoading(false);
      }
    }, [leagueId, token, xpFetchAttempted, userLeagueXP]);

    // Ensure XP maps are available for preview UI as soon as league loads
    useEffect(() => {
      if (leagueId && token && !xpFetchAttempted) { void ensureXPMap(); }
    }, [leagueId, token, xpFetchAttempted, ensureXPMap]);

    const fetchPrediction = useCallback(async () => {
      if (!matchId || !token) return;
      try {
        // Only send registered user IDs; include total counts to capture guests
        const homeIds = homeTeamUsers.filter(u => !u.isGuest).map(u => u.id);
        const awayIds = awayTeamUsers.filter(u => !u.isGuest).map(u => u.id);
        const payload = {
          homeIds,
          awayIds,
          homeTotal: homeTeamUsers.length,
          awayTotal: awayTeamUsers.length,
        };
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/prediction`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const j = await res.json();
        if (!j?.success) return;
        setHomeWinChance(typeof j.home?.winPct === 'number' ? j.home.winPct : null);
        setAwayWinChance(typeof j.away?.winPct === 'number' ? j.away.winPct : null);
        setHomeStrength(typeof j.home?.average === 'number' ? Math.round(j.home.average) : null);
        setAwayStrength(typeof j.away?.average === 'number' ? Math.round(j.away.average) : null);
      } catch { }
    }, [matchId, token, homeTeamUsers, awayTeamUsers]);

    // Minimal skill display helper for UI only
    const calcSkill = (p?: PlayerOption | null) => {
      if (!p) return 0;
      if (p.isGuest) return 50;
      const s = p.skills;
      const keys: (keyof NonNullable<User['skills']>)[] = ['dribbling', 'shooting', 'passing', 'pace', 'defending', 'physical'];
      const total = keys.reduce((sum, k) => sum + (s?.[k] ?? 0), 0);
      return Math.round(total / keys.length);
    };

    // League-average XP and fallback logic
    const nonZeroAvgValues = React.useMemo(() =>
      Object.values(userLeagueAvgXP || {}).filter(v => typeof v === 'number' && v > 0) as number[],
      [userLeagueAvgXP]
    );
    const leagueAvgXPValue = React.useMemo(() => {
      if (nonZeroAvgValues.length === 0) return 0;
      const sum = nonZeroAvgValues.reduce((a, b) => a + b, 0);
      return Math.round(((sum / nonZeroAvgValues.length) + Number.EPSILON) * 100) / 100;
    }, [nonZeroAvgValues]);
    const getAvgRating = (p?: PlayerOption | null): number => {
      if (!p) return 0;
      if (p.isGuest) {
        // Guests get league average XP; if league has no XP yet, count as 0.
        return leagueAvgXPValue > 0 ? leagueAvgXPValue : 0;
      }
      const v = userLeagueAvgXP[p.id];
      // Balance must use the same Avg XP value shown on player cards.
      return typeof v === 'number' && Number.isFinite(v) ? v : 0;
    };

    // XP-based team percentage calculation
    const xpBased = React.useMemo(() => {
      const homeSum = homeTeamUsers.reduce((s, p) => s + getAvgRating(p), 0);
      const awaySum = awayTeamUsers.reduce((s, p) => s + getAvgRating(p), 0);
      const total = homeSum + awaySum;
      if (total <= 0) {
        const homeCount = homeTeamUsers.length;
        const awayCount = awayTeamUsers.length;
        const countTotal = homeCount + awayCount;
        if (countTotal <= 0) return { homeSum, awaySum, total, homePct: 0, awayPct: 0, hasPlayers: false };
        const homePct = (homeCount / countTotal) * 100;
        const awayPct = 100 - homePct;
        return { homeSum, awaySum, total, homePct, awayPct, hasPlayers: true };
      }
      const factor = total / 100; // as requested: divide by 100, then multiply with team sum
      const awayPct = (awaySum / factor);
      const homePct = 100 - awayPct;
      return { homeSum, awaySum, total, homePct, awayPct, hasPlayers: true };
    }, [homeTeamUsers, awayTeamUsers, userLeagueAvgXP, leagueAvgXPValue]);

    const teamBalance = React.useMemo(() => {
      const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
      if (xpBased.hasPlayers) {
        return {
          homePct: clamp(xpBased.homePct),
          awayPct: clamp(xpBased.awayPct),
          hasData: true,
        };
      }
      if (homeWinChance !== null && awayWinChance !== null) {
        return {
          homePct: clamp(homeWinChance),
          awayPct: clamp(awayWinChance),
          hasData: true,
        };
      }
      return {
        homePct: 0,
        awayPct: 0,
        hasData: false,
      };
    }, [homeWinChance, awayWinChance, xpBased]);

    const getBalancedRegisteredSplit = (
      registeredCount: number,
      homeGuestCount: number,
      awayGuestCount: number
    ) => {
      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
      const targetHomeRegistered = clamp(
        Math.round((registeredCount + awayGuestCount - homeGuestCount) / 2),
        0,
        registeredCount
      );
      return {
        targetHomeReg: targetHomeRegistered,
        targetAwayReg: registeredCount - targetHomeRegistered,
      };
    };

    // Shuffle: randomly repartition registered players (guests stay on current sides)
    const shuffleTeams = () => {
      const registeredHome = homeTeamUsers.filter(p => !p.isGuest);
      const registeredAway = awayTeamUsers.filter(p => !p.isGuest);
      const allRegistered = [...registeredHome, ...registeredAway];

      const byId = new Map<string, PlayerOption>();
      allRegistered.forEach(p => byId.set(p.id, p));
      const uniqueRegistered = Array.from(byId.values());
      if (uniqueRegistered.length < 2) return;

      const homeGuestsOnly = homeTeamUsers.filter(p => p.isGuest).map(p => ({ ...p, team: 'home' as const }));
      const awayGuestsOnly = awayTeamUsers.filter(p => p.isGuest).map(p => ({ ...p, team: 'away' as const }));

      const { targetHomeReg } = getBalancedRegisteredSplit(
        uniqueRegistered.length,
        homeGuestsOnly.length,
        awayGuestsOnly.length
      );
      const shuffled = [...uniqueRegistered];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newHomeReg = shuffled.slice(0, targetHomeReg);
      const newAwayReg = shuffled.slice(targetHomeReg);

      setHomeTeamUsers([...newHomeReg, ...homeGuestsOnly]);
      setAwayTeamUsers([...newAwayReg, ...awayGuestsOnly]);

      // Clear captains when teams change massively
      setHomeCaptain(null);
      setAwayCaptain(null);
      toast.success('Teams shuffled');
      fetchPrediction();
    };

    // Balance by XP using league average XP per match (fallback to skill when no avg)
    const balanceTeams = async () => {
      if (isBalancing) return;
      setIsBalancing(true);
      try {
        const combinedRegRaw = [...homeTeamUsers.filter(p => !p.isGuest), ...awayTeamUsers.filter(p => !p.isGuest)];
        const regById = new Map<string, PlayerOption>();
        combinedRegRaw.forEach(p => regById.set(p.id, p));
        const combinedReg = Array.from(regById.values());
        if (combinedReg.length < 2) { toast.error('Need at least 2 registered players'); return; }

        // Ensure maps are loaded (fills userLeagueXP and userLeagueAvgXP)
        await ensureXPMap();

        // Keep guests on current teams; include their contribution as league-average
        const homeGuestsOnly = homeTeamUsers.filter(p => p.isGuest);
        const awayGuestsOnly = awayTeamUsers.filter(p => p.isGuest);

        const { targetHomeReg, targetAwayReg } = getBalancedRegisteredSplit(
          combinedReg.length,
          homeGuestsOnly.length,
          awayGuestsOnly.length
        );

        // Build lookup for player objects
        const byId = new Map<string, PlayerOption>();
        combinedReg.forEach(p => byId.set(p.id, p));

        // Use league average XP per match for registered players; fallback to skill
        const ratingsArr = combinedReg.map(p => ({ id: p.id, rating: getAvgRating(p) }));
        const idToRating = new Map<string, number>();
        ratingsArr.forEach(r => idToRating.set(r.id, r.rating));

        // Guest contribution uses the league Avg XP only; if no league Avg XP exists, count as 0.
        const values = Array.from(idToRating.values());
        const nonZero = values.filter(v => v > 0).sort((a, b) => a - b);
        const avgVal = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
        const medianVal = (arr: number[]) => {
          if (arr.length === 0) return 0;
          const mid = Math.floor(arr.length / 2);
          return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
        };
        // Keep fallback calculations available for legacy data, but do not inject hidden 50-point strength.
        const fallbackGuest = nonZero.length > 0 ? medianVal(nonZero) : avgVal(values);
        const guestValue = leagueAvgXPValue > 0 ? leagueAvgXPValue : (fallbackGuest > 0 ? fallbackGuest : 0);

        // Start sums with guest contributions (kept fixed)
        const homeGuestSum = guestValue * homeGuestsOnly.length;
        const awayGuestSum = guestValue * awayGuestsOnly.length;

        // Helper to run one greedy + swap pass for a given order
        const runOne = (order: Array<{ id: string; rating: number }>) => {
          const newHomeIds: string[] = [];
          const newAwayIds: string[] = [];
          let homeSum = homeGuestSum; // include guests
          let awaySum = awayGuestSum;
          for (const item of order) {
            const canHome = newHomeIds.length < targetHomeReg;
            const canAway = newAwayIds.length < targetAwayReg;
            if (canHome && canAway) {
              const homeAfter = homeSum + item.rating;
              const awayAfter = awaySum;
              const totalAfterHome = homeAfter + awayAfter;
              const homePctIfHome = totalAfterHome > 0 ? (homeAfter / totalAfterHome) * 100 : 50;

              const homeAfter2 = homeSum;
              const awayAfter2 = awaySum + item.rating;
              const totalAfterAway = homeAfter2 + awayAfter2;
              const homePctIfAway = totalAfterAway > 0 ? (homeAfter2 / totalAfterAway) * 100 : 50;

              const deltaHome = Math.abs(homePctIfHome - TARGET_XP_RATIO);
              const deltaAway = Math.abs(homePctIfAway - TARGET_XP_RATIO);
              if (deltaHome < deltaAway || (deltaHome === deltaAway && homeSum <= awaySum)) {
                newHomeIds.push(item.id); homeSum += item.rating;
              } else {
                newAwayIds.push(item.id); awaySum += item.rating;
              }
            } else if (canHome) {
              newHomeIds.push(item.id); homeSum += item.rating;
            } else {
              newAwayIds.push(item.id); awaySum += item.rating;
            }
          }

          // Pair-swap optimization
          const ratingOf = (id: string) => idToRating.get(id) ?? 0;
          const pct = () => {
            const tot = homeSum + awaySum;
            return tot > 0 ? (homeSum / tot) * 100 : 50;
          };
          let iterations = 0;
          const maxIterations = 120;
          while (iterations < maxIterations) {
            iterations++;
            let bestImprovement = 0;
            let bestSwap: { hIdx: number; aIdx: number } | null = null;
            const currPctDelta = Math.abs(pct() - TARGET_XP_RATIO);
            for (let hIdx = 0; hIdx < newHomeIds.length; hIdx++) {
              const hId = newHomeIds[hIdx];
              const hR = ratingOf(hId);
              for (let aIdx = 0; aIdx < newAwayIds.length; aIdx++) {
                const aId = newAwayIds[aIdx];
                const aR = ratingOf(aId);
                const homeAfter = homeSum - hR + aR;
                const awayAfter = awaySum - aR + hR;
                const totAfter = homeAfter + awayAfter;
                const homePctAfter = totAfter > 0 ? (homeAfter / totAfter) * 100 : 50;
                const delta = Math.abs(homePctAfter - TARGET_XP_RATIO);
                const improvement = currPctDelta - delta;
                if (improvement > bestImprovement) {
                  bestImprovement = improvement;
                  bestSwap = { hIdx, aIdx };
                }
              }
            }
            if (bestSwap && bestImprovement > 0) {
              const hId = newHomeIds[bestSwap.hIdx];
              const aId = newAwayIds[bestSwap.aIdx];
              const hR = ratingOf(hId);
              const aR = ratingOf(aId);
              newHomeIds[bestSwap.hIdx] = aId;
              newAwayIds[bestSwap.aIdx] = hId;
              homeSum = homeSum - hR + aR;
              awaySum = awaySum - aR + hR;
              continue;
            }
            break;
          }

          const closeness = Math.abs(((homeSum) / (homeSum + awaySum || 1)) * 100 - TARGET_XP_RATIO);
          return { newHomeIds, newAwayIds, homeSum, awaySum, closeness };
        };

        // Prepare orders
    const withRating = combinedReg.map(p => ({ id: p.id, rating: idToRating.get(p.id) ?? 0 }));
        const desc = [...withRating].sort((a, b) => b.rating - a.rating);
        const asc = [...withRating].sort((a, b) => a.rating - b.rating);
        const randomize = (arr: typeof withRating) => {
          const a = [...arr];
          for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
          return a;
        };

        const candidates = [desc, asc];
        for (let i = 0; i < 24; i++) candidates.push(randomize(withRating)); // more random starts improves robustness

        let best = null as null | ReturnType<typeof runOne>;
        for (const ord of candidates) {
          const result = runOne(ord);
          if (!best || result.closeness < best.closeness) best = result;
          if (best.closeness <= 0.5) break; // good enough
        }

        let chosen = best!;

        // Stochastic local search: random pair and 2-for-2 swaps to further refine
        const ratingOf = (id: string) => idToRating.get(id) ?? 0;
        const closenessOf = (homeIds: string[], awayIds: string[]) => {
          const h = homeIds.reduce((s, id) => s + ratingOf(id), homeGuestSum);
          const a = awayIds.reduce((s, id) => s + ratingOf(id), awayGuestSum);
          const tot = h + a;
          return Math.abs(((h / (tot || 1)) * 100) - TARGET_XP_RATIO);
        };
        const tryImprove = (maxIters = 350) => {
          let homeIds = [...chosen.newHomeIds];
          let awayIds = [...chosen.newAwayIds];
          let bestClose = chosen.closeness;

          const applyIfBetter = (newHome: string[], newAway: string[]) => {
            const c = closenessOf(newHome, newAway);
            if (c + 1e-6 < bestClose) { // small epsilon to avoid float noise
              homeIds = newHome;
              awayIds = newAway;
              bestClose = c;
              return true;
            }
            return false;
          };

          const randInt = (n: number) => Math.floor(Math.random() * n);

          for (let it = 0; it < maxIters; it++) {
            // Alternate between 1-for-1 and 2-for-2 attempts
            if (Math.random() < 0.7) {
              // 1-for-1 random pair swap
              if (homeIds.length > 0 && awayIds.length > 0) {
                const hi = randInt(homeIds.length);
                const ai = randInt(awayIds.length);
                const newHome = [...homeIds];
                const newAway = [...awayIds];
                const tmp = newHome[hi];
                newHome[hi] = newAway[ai];
                newAway[ai] = tmp;
                applyIfBetter(newHome, newAway);
              }
            } else {
              // 2-for-2 swap (sampled)
              if (homeIds.length > 1 && awayIds.length > 1) {
                const hi1 = randInt(homeIds.length);
                let hi2 = randInt(homeIds.length);
                if (hi2 === hi1) hi2 = (hi2 + 1) % homeIds.length;
                const ai1 = randInt(awayIds.length);
                let ai2 = randInt(awayIds.length);
                if (ai2 === ai1) ai2 = (ai2 + 1) % awayIds.length;

                const newHome = [...homeIds];
                const newAway = [...awayIds];
                // swap pairs
                const hA = newHome[Math.max(hi1, hi2)];
                const hB = newHome[Math.min(hi1, hi2)];
                const aA = newAway[Math.max(ai1, ai2)];
                const aB = newAway[Math.min(ai1, ai2)];
                newHome[Math.max(hi1, hi2)] = aA;
                newHome[Math.min(hi1, hi2)] = aB;
                newAway[Math.max(ai1, ai2)] = hA;
                newAway[Math.min(ai1, ai2)] = hB;
                applyIfBetter(newHome, newAway);
              }
            }
          }

          // Update chosen if improved
          if (bestClose + 1e-6 < chosen.closeness) {
            const hSum = homeIds.reduce((s, id) => s + ratingOf(id), homeGuestSum);
            const aSum = awayIds.reduce((s, id) => s + ratingOf(id), awayGuestSum);
            chosen = { newHomeIds: homeIds, newAwayIds: awayIds, homeSum: hSum, awaySum: aSum, closeness: bestClose };
          }
        };

        tryImprove(250);

        // Deterministic directed 1-for-1 swap loop: always take the best improving swap until no gain
        const directedSwapImprove = (maxSteps = 120) => {
          const ratingOf = (id: string) => idToRating.get(id) ?? 0;
          const homeIds = [...chosen.newHomeIds];
          const awayIds = [...chosen.newAwayIds];
          let homeSum = chosen.homeSum;
          let awaySum = chosen.awaySum;
          let bestClose = chosen.closeness;

          for (let step = 0; step < maxSteps; step++) {
            const diff = homeSum - awaySum; // positive => home stronger
            const stronger = diff >= 0 ? 'home' : 'away';
            const fromIds = stronger === 'home' ? homeIds : awayIds;
            const toIds = stronger === 'home' ? awayIds : homeIds;

            let bestGain = 0;
            let bestPair: { fromIdx: number; toIdx: number } | null = null;
            const currClose = Math.abs(((homeSum) / ((homeSum + awaySum) || 1)) * 100 - TARGET_XP_RATIO);

            // Scan pairs but bias by rating order to be efficient
            const fromSorted = fromIds
              .map((id, idx) => ({ id, idx, r: ratingOf(id) }))
              .sort((a, b) => Math.abs(diff) >= 0 ? b.r - a.r : a.r - b.r); // prioritize impactful
            const toSorted = toIds
              .map((id, idx) => ({ id, idx, r: ratingOf(id) }))
              .sort((a, b) => a.r - b.r); // prefer smaller to send back when stronger side gives a big one

            const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
            const limitFrom = clamp(Math.ceil(fromSorted.length * 0.75), 1, fromSorted.length); // scan top 75%
            const limitTo = clamp(Math.ceil(toSorted.length * 0.75), 1, toSorted.length);

            for (let i = 0; i < limitFrom; i++) {
              const f = fromSorted[i];
              // Best counterpart in 'to' is the one that brings sums closer: target a ~ f.r - diff/2
              const ideal = f.r - diff / 2;
              let bestJ = -1;
              let bestJDist = Infinity;
              for (let j = 0; j < limitTo; j++) {
                const cand = toSorted[j];
                const d = Math.abs(cand.r - ideal);
                if (d < bestJDist) { bestJDist = d; bestJ = j; }
              }
              if (bestJ >= 0) {
                const t = toSorted[bestJ];
                const newHome = stronger === 'home'
                  ? homeSum - f.r + t.r
                  : homeSum + f.r - t.r;
                const newAway = stronger === 'home'
                  ? awaySum - t.r + f.r
                  : awaySum + t.r - f.r;
                const tot = newHome + newAway;
                const newClose = Math.abs(((newHome / (tot || 1)) * 100) - TARGET_XP_RATIO);
                const gain = currClose - newClose;
                if (gain > bestGain + 1e-9) {
                  bestGain = gain;
                  bestPair = { fromIdx: f.idx, toIdx: t.idx };
                }
              }
            }

            if (bestPair && bestGain > 0) {
              if (stronger === 'home') {
                const fId = homeIds[bestPair.fromIdx];
                const tId = awayIds[bestPair.toIdx];
                const fR = ratingOf(fId);
                const tR = ratingOf(tId);
                homeIds[bestPair.fromIdx] = tId;
                awayIds[bestPair.toIdx] = fId;
                homeSum = homeSum - fR + tR;
                awaySum = awaySum - tR + fR;
              } else {
                const fId = awayIds[bestPair.fromIdx];
                const tId = homeIds[bestPair.toIdx];
                const fR = ratingOf(fId);
                const tR = ratingOf(tId);
                awayIds[bestPair.fromIdx] = tId;
                homeIds[bestPair.toIdx] = fId;
                awaySum = awaySum - fR + tR;
                homeSum = homeSum - tR + fR;
              }

              const tot2 = homeSum + awaySum;
              bestClose = Math.abs(((homeSum / (tot2 || 1)) * 100) - TARGET_XP_RATIO);
            } else {
              break; // no improving directed swap
            }
          }

          if (bestClose + 1e-6 < chosen.closeness) {
            chosen = { newHomeIds: homeIds, newAwayIds: awayIds, homeSum, awaySum, closeness: bestClose };
          }
        };

        // Keep trying until no further improvement within a few rounds
        let rounds = 0;
        while (rounds < 5) {
          const before = chosen.closeness;
          tryImprove(400);
          directedSwapImprove(140);
          if (chosen.closeness < before - 1e-6) {
            rounds++;
            continue;
          }
          break;
        }
        // Build final teams (keep guests on their sides)
        const newHome = [...chosen.newHomeIds.map(id => byId.get(id)!).filter(Boolean), ...homeGuestsOnly];
        const newAway = [...chosen.newAwayIds.map(id => byId.get(id)!).filter(Boolean), ...awayGuestsOnly];

        setHomeTeamUsers(newHome);
        setAwayTeamUsers(newAway);
        setHomeCaptain(null); setAwayCaptain(null);

        // Report final ratio with basis label
        // const tot = chosen.homeSum + chosen.awaySum;
        // const homePct = tot > 0 ? Math.round((chosen.homeSum / tot) * 100) : 50;
        // const awayPct = 100 - homePct;
        toast.success(`Teams balanced by League XP`);
        fetchPrediction();
        return;
      } catch {
        // Optional: Log or show a fallback error
        toast.error('Balancing failed. Please try again.');
      } finally {
        setIsBalancing(false);
      }
    };

    // Drag handler
    const movePlayer = (player: PlayerOption, target: 'home' | 'away') => {
      if (player.isGuest) { // allow moving guest too
        if (target === 'home') {
          if (!homeTeamUsers.find(p => p.id === player.id)) {
            setHomeTeamUsers(p => [...p, { ...player, team: 'home' }]);
            setAwayTeamUsers(p => p.filter(p => p.id !== player.id));
            setAwayGuests(g => g.filter(x => x.tempId !== player.guestTempId));
            setHomeGuests(g => {
              if (!player.guestTempId) return g;
              const exists = g.some(x => x.tempId === player.guestTempId);
              if (exists) return g.map(x => x.tempId === player.guestTempId ? { ...x, team: 'home' } : x);
              return [...g, {
                tempId: player.guestTempId,
                existingId: player.existingGuestId,
                team: 'home',
                firstName: player.firstName,
                lastName: player.lastName,
              }];
            });
            if (awayCaptain?.id === player.id) setAwayCaptain(null);
          }
        } else {
          if (!awayTeamUsers.find(p => p.id === player.id)) {
            setAwayTeamUsers(p => [...p, { ...player, team: 'away' }]);
            setHomeTeamUsers(p => p.filter(p => p.id !== player.id));
            setHomeGuests(g => g.filter(x => x.tempId !== player.guestTempId));
            setAwayGuests(g => {
              if (!player.guestTempId) return g;
              const exists = g.some(x => x.tempId === player.guestTempId);
              if (exists) return g.map(x => x.tempId === player.guestTempId ? { ...x, team: 'away' } : x);
              return [...g, {
                tempId: player.guestTempId,
                existingId: player.existingGuestId,
                team: 'away',
                firstName: player.firstName,
                lastName: player.lastName,
              }];
            });
            if (homeCaptain?.id === player.id) setHomeCaptain(null);
          }
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
      toast.success('Guest added');
      // Keep dialog open so admins can add multiple guests without reopening it.
      setGuestName('');
    };

    const removeStagedGuest = (team: 'home' | 'away', tempId: string) => {
      if (team === 'home') { setHomeGuests(g => g.filter(x => x.tempId !== tempId)); setHomeTeamUsers(p => p.filter(x => x.guestTempId !== tempId)); if (homeCaptain?.guestTempId === tempId) setHomeCaptain(null); }
      else { setAwayGuests(g => g.filter(x => x.tempId !== tempId)); setAwayTeamUsers(p => p.filter(x => x.guestTempId !== tempId)); if (awayCaptain?.guestTempId === tempId) setAwayCaptain(null); }
    };

    const handleDurationChange = (value: string) => {
      if (value === '') {
        setDuration('');
        return;
      }
      if (!/^\d+$/.test(value) || value.length > 3) {
        toast.error(DURATION_ERROR_MESSAGE);
        return;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error(DURATION_ERROR_MESSAGE);
        return;
      }
      setDuration(parsed);
    };

    // const homeGuestOptions: PlayerOption[] = homeGuests.map(guestToPlayer);
    // const awayGuestOptions: PlayerOption[] = awayGuests.map(guestToPlayer);
    const compareByAcceptanceThenName = useCallback((a: PlayerOption, b: PlayerOption) => {
      const aOrder = availableOrderMap[a.id];
      const bOrder = availableOrderMap[b.id];
      const aHasOrder = Number.isFinite(aOrder);
      const bHasOrder = Number.isFinite(bOrder);

      if (aHasOrder && bHasOrder) return (aOrder as number) - (bOrder as number);
      if (aHasOrder && !bHasOrder) return -1;
      if (!aHasOrder && bHasOrder) return 1;

      const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    }, [availableOrderMap]);

    const latestSeasonMembers = React.useMemo<User[]>(() => {
      const allLeagueMembers = league?.members || [];
      if (!allLeagueMembers.length) return [];

      const latestSeasonMemberIds = resolveLatestSeasonMemberIds(league);
      if (!latestSeasonMemberIds.size) return allLeagueMembers;

      const filtered = allLeagueMembers.filter((member) =>
        latestSeasonMemberIds.has(normalizeEntityId(member.id))
      );
      return filtered.length ? filtered : allLeagueMembers;
    }, [league]);

    const homePlayerOptions: PlayerOption[] = React.useMemo(() => {
      const members = [...latestSeasonMembers]
        .filter(m => !awayTeamUsers.some(p => p.id === m.id))
        .sort(compareByAcceptanceThenName);
      return [...members, ...homeGuests.map(guestToPlayer)];
    }, [latestSeasonMembers, awayTeamUsers, homeGuests, compareByAcceptanceThenName]);

    const awayPlayerOptions: PlayerOption[] = React.useMemo(() => {
      const members = [...latestSeasonMembers]
        .filter(m => !homeTeamUsers.some(p => p.id === m.id))
        .sort(compareByAcceptanceThenName);
      return [...members, ...awayGuests.map(guestToPlayer)];
    }, [latestSeasonMembers, homeTeamUsers, awayGuests, compareByAcceptanceThenName]);

    // When teams change (by content, not only count), re-fetch prediction
    const homeIdsKey = React.useMemo(() => homeTeamUsers.map(u => u.id).join('|'), [homeTeamUsers]);
    const awayIdsKey = React.useMemo(() => awayTeamUsers.map(u => u.id).join('|'), [awayTeamUsers]);
    useEffect(() => {
      fetchPrediction();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeIdsKey, awayIdsKey]);

    // Minimum players required
    // const totalSelectedPlayers = homeTeamUsers.length + awayTeamUsers.length;
    // const hasMinPlayers = totalSelectedPlayers >= 6;

    // Images
    const handleHomeTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setHomeTeamImage(f); const r = new FileReader(); r.onload = ev => setHomeTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
    const handleAwayTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Image only'); if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setAwayTeamImage(f); const r = new FileReader(); r.onload = ev => setAwayTeamImagePreview(ev.target?.result as string); r.readAsDataURL(f); };
    const handleRemoveHomeTeamImage = () => { setHomeTeamImage(null); setHomeTeamImagePreview(null); };
    const handleRemoveAwayTeamImage = () => { setAwayTeamImage(null); setAwayTeamImagePreview(null); };

    // Submit (PATCH)
    const sendLeagueWideNotification = async (message: string): Promise<boolean> => {
      if (!token || !leagueId || !league?.members?.length) return false;

      const memberIds = Array.from(
        new Set((league.members || []).map((m) => String(m.id)).filter(Boolean))
      );
      if (!memberIds.length) return false;

      const payloadBase = {
        type: 'GENERAL',
        title: 'League Message',
        body: message,
        message,
        leagueId,
        userIds: memberIds
      };

      const candidates: Array<{ url: string; body: Record<string, unknown> }> = [
        { url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/notifications`, body: payloadBase },
        { url: `${process.env.NEXT_PUBLIC_API_URL}/notifications/broadcast`, body: payloadBase },
        { url: `${process.env.NEXT_PUBLIC_API_URL}/notifications`, body: payloadBase }
      ];

      for (const c of candidates) {
        try {
          const res = await fetch(c.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(c.body)
          });
          if (res.ok) return true;
        } catch {
          // try next
        }
      }

      // Last fallback: send one-by-one through generic notifications endpoint
      try {
        const perUser = await Promise.all(
          memberIds.map(async (uid) => {
            const bodyVariants = [
              { ...payloadBase, userId: uid },
              { ...payloadBase, user_id: uid },
              { ...payloadBase, receiverId: uid },
              { ...payloadBase, receiver_id: uid },
              { ...payloadBase, recipientId: uid },
            ];
            for (const body of bodyVariants) {
              try {
                const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify(body)
                });
                if (r.ok) return true;
              } catch {
                // try next variant
              }
            }
            return false;
          })
        );
        return perUser.some(Boolean);
      } catch {
        return false;
      }
    };

    const handleUpdateMatch = async (e: React.FormEvent) => {
      e.preventDefault(); setIsSubmitting(true); setError(null);

      const registered = (arr: PlayerOption[]) => arr.filter(u => !u.isGuest).map(u => u.id);
      const newHomeIds = registered(homeTeamUsers);
      const newAwayIds = registered(awayTeamUsers);

      // const sameSet = (a: string[], b: string[]) => {
      //   if (a.length !== b.length) return false;
      //   const B = new Set(b);
      //   return a.every(x => B.has(x));
      // };

      // const homeOrig = originalHomeIdsRef.current;
      // const awayOrig = originalAwayIdsRef.current;
      // const teamsChanged =
      //   homeOrig !== null &&
      //   awayOrig !== null &&
      //   (!sameSet(newHomeIds, homeOrig) || !sameSet(newAwayIds, awayOrig));

      // Derive guests payload from current team selections so guest side moves are always persisted.
      const stagedGuestMap = new Map<string, StagedGuest>();
      [...homeGuests, ...awayGuests].forEach(g => stagedGuestMap.set(g.tempId, g));
      const toGuestPayload = (teamUsers: PlayerOption[], team: 'home' | 'away') => {
        const seen = new Set<string>();
        return teamUsers
          .filter(u => u.isGuest && !!u.guestTempId)
          .map((u) => {
            const tempId = String(u.guestTempId);
            if (seen.has(tempId)) return null;
            seen.add(tempId);
            const staged = stagedGuestMap.get(tempId);
            return {
              id: u.existingGuestId || staged?.existingId,
              team,
              firstName: staged?.firstName || u.firstName,
              lastName: staged?.lastName || u.lastName,
              shirtNumber: staged?.shirtNumber,
            };
          })
          .filter((g): g is NonNullable<typeof g> => Boolean(g));
      };
      const homeGuestsPayload = toGuestPayload(homeTeamUsers, 'home');
      const awayGuestsPayload = toGuestPayload(awayTeamUsers, 'away');

      const registeredCount = new Set<string>([...newHomeIds, ...newAwayIds]).size;
      const totalCount = registeredCount + homeGuestsPayload.length + awayGuestsPayload.length;
      if (registeredCount < MIN_REGISTERED_PLAYERS_FOR_TEAM_UPLOAD) {
        toast.error(MIN_REGISTERED_PLAYERS_MESSAGE);
        setIsSubmitting(false);
        return;
      }
      if (totalCount < MIN_TOTAL_PLAYERS_FOR_TEAM_UPLOAD) {
        toast.error('A minimum of 8 total players (including at least 6 registered league players) is required to save teams.');
        setIsSubmitting(false);
        return;
      }

      const hasHomeCaptainSelected = Boolean(homeCaptain && !homeCaptain.isGuest);
      const hasAwayCaptainSelected = Boolean(awayCaptain && !awayCaptain.isGuest);
      const hasTeamSelections = totalCount > 0;
      if (hasTeamSelections && (!hasHomeCaptainSelected || !hasAwayCaptainSelected)) {
        const confirmedWithoutCaptains = window.confirm('Do you want to save the match without selecting captains?');
        if (!confirmedWithoutCaptains) {
          setIsSubmitting(false);
          return;
        }
      }

      try {
        const formData = new FormData();

        formData.append('homeTeamName', homeTeamName);
        formData.append('awayTeamName', awayTeamName);

        if (matchDate && startTime) {
          const start = matchDate.hour(startTime.hour()).minute(startTime.minute()).second(0).millisecond(0);
          const matchDuration = duration || 90; const end = start.add(matchDuration, 'minute');
          formData.append('date', start.toISOString());
          formData.append('start', start.toISOString());
          formData.append('end', end.toISOString());
        }

        formData.append('location', location.trim());

        // Captains are optional; send empty value to explicitly clear captain when not selected.
        const homeCaptainIdToSend = homeCaptain && !homeCaptain.isGuest ? homeCaptain.id : '';
        const awayCaptainIdToSend = awayCaptain && !awayCaptain.isGuest ? awayCaptain.id : '';
        formData.append('homeCaptainId', homeCaptainIdToSend);
        formData.append('awayCaptainId', awayCaptainIdToSend);

        // Always send teams and guests so backend can persist all changes in one go
        formData.append('homeTeamUsers', JSON.stringify(newHomeIds));
        formData.append('awayTeamUsers', JSON.stringify(newAwayIds));
        formData.append('homeGuests', JSON.stringify(homeGuestsPayload));
        formData.append('awayGuests', JSON.stringify(awayGuestsPayload));

        if (homeTeamImage) formData.append('homeTeamImage', homeTeamImage);
        if (awayTeamImage) formData.append('awayTeamImage', awayTeamImage);

        // Match notification message to all players
        const notificationToSend = notificationMessage.trim().slice(0, 50);
        if (notificationToSend) {
          formData.append('notificationMessage', notificationToSend);
          formData.append('notes', notificationToSend);
          formData.append('message', notificationToSend);
          formData.append('body', notificationToSend);
          formData.append('notificationAudience', notificationAudience);
          console.log('📢 [FRONTEND] Sending notificationMessage:', notificationToSend);
        } else {
          console.log('📢 [FRONTEND] No notification message to send. notificationMessage value:', JSON.stringify(notificationMessage));
        }

        // Debug: log all formData keys
        console.log('📢 [FRONTEND] FormData keys:');
        for (const [key, value] of formData.entries()) {
          if (key === 'homeTeamImage' || key === 'awayTeamImage') {
            console.log(`  ${key}: [File]`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches/${matchId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const j = await res.json().catch(() => ({}));
        if (!j.success) throw new Error(j.message || 'Update failed');

        // Guests already synced via PATCH; no extra POST/DELETE calls needed
        // Clear matches cache and navigate
        try { cacheManager.clearCache('matches_cache'); } catch { }
        const serverMsg = j.message || 'Match updated';
        toast.success(serverMsg);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('refresh-notifications'));
        }
        if (notificationToSend && notificationAudience === 'league') {
          const sent = await sendLeagueWideNotification(notificationToSend);
          if (!sent) {
            console.warn('League-wide notification could not be sent via fallback endpoints.');
          }
        }
        setNotificationMessage('');
        setNotificationAudience('match');
        setShowNotificationBox(false);
        if (isDialog && onClose) {
          onClose();
        } else {
          router.push(`/league/${leagueId}`);
        }
      } catch (er: unknown) {
        const msg = er instanceof Error ? er.message : 'Update error';
        setError(msg);
      } finally { setIsSubmitting(false); }
    };

    if (loading) return <EditMatchPopupLoadingSkeleton mode={isDialog ? 'dialog' : 'page'} />;
    if (error || !league) return <Box sx={{ p: 4, color: 'white' }}><Button startIcon={<ArrowLeft />} onClick={() => { if (isDialog && onClose) onClose(); else router.push(`/league/${leagueId}`); }} sx={{ mb: 2, color: 'white', background: '#388e3c', '&:hover': { background: '#388e3c' } }}>Back</Button><Typography color="error">{error || 'Load failed'}</Typography></Box>;

    const inputStyles = { '& .MuiOutlinedInput-root': { color: '#E5E7EB', background: 'rgba(255,255,255,0.02)', borderRadius: 1, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#e56a16', borderWidth: '2px', boxShadow: '0 0 0 3px rgba(229,106,22,0.1)' }, '& input': { color: '#E5E7EB', padding: '10px 14px' } }, '& .MuiInputLabel-root': { color: '#9CA3AF', fontWeight: 500, '&.Mui-focused': { color: '#e56a16' } }, '& .MuiSvgIcon-root': { color: '#E5E7EB' }, '& .MuiOutlinedInput-input': { padding: '10px 14px' } };
    const autocompleteStyles = { '& .MuiOutlinedInput-root': { color: '#E5E7EB', background: 'rgba(255,255,255,0.02)', borderRadius: 2, paddingTop: '6px', paddingBottom: '6px', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderWidth: '1px' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#e56a16', borderWidth: '2px', boxShadow: '0 0 0 3px rgba(229,106,22,0.1)' }, '& .MuiChip-root': { background: 'rgba(229,106,22,0.15)', color: '#E5E7EB', border: '1px solid rgba(229,106,22,0.3)', height: '24px', margin: '2px' } }, '& .MuiInputLabel-root': { color: '#9CA3AF', fontWeight: 500, '&.Mui-focused': { color: '#e56a16' } }, '& .MuiOutlinedInput-input': { padding: '6px 14px' }, '& .MuiAutocomplete-input': { padding: '6px 4px 6px 6px !important' } };
    // Enhanced ShirtAvatar supporting responsive size objects
    const ShirtAvatar = ({ team }: { number?: string | number; size?: number | { xs: number; sm: number; md?: number }; team?: 'home' | 'away'; }) => {
      // const baseSize = typeof size === 'number' ? size : (size.sm || size.xs);
      // const fontSize = baseSize >= 56 ? 16 : baseSize >= 48 ? 14 : baseSize >= 40 ? 12 : baseSize >= 32 ? 10 : 8;
      const shirtImage = team === 'away' ? RightShirt : LeftShirt;
      return (
        <Box sx={{ position: 'relative',  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
          <img src={shirtImage.src} alt='Shirt' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          {/* <Typography component='span' sx={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize, color: '#111', textShadow: '0 1px 1px rgba(255,255,255,0.6)', lineHeight: 1 }}>
            {number || '0'}
          </Typography> */}
        </Box>
      );
    };

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: isDialog ? 0 : { xs: 1, sm: 2, md: 3 }, minHeight: isDialog ? 'auto' : '100vh', color: '#E5E7EB', bgcolor: '#000', overflowX: 'hidden' }}>
        {/* Close Button - hide in dialog mode since dialog has its own close */}
        {/* {!isDialog && <CloseButton fallbackRoute="/dashboard" />} */}
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 0 }, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
            {/* LEFT PANEL */}
            <Box sx={{ width: { xs: '100%', md: '55%' }, display: 'flex', flexDirection: 'column' }}>
              {/* EDIT MATCH Tab Header */}
              <Box sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 3 }, background: '#00a77f', textAlign: 'center', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.4rem', md: '1.6rem' }, fontFamily: 'var(--font-geist-anton), "Anton", sans-serif', textTransform: 'uppercase', letterSpacing: { xs: 1, sm: 2 } }}>
                  Edit Match
                </Typography>
                <IconButton
                  onClick={() => { if (isDialog && onClose) onClose(); else router.push(`/league/${leagueId}`); }}
                  sx={{
                    display: { xs: 'inline-flex', md: 'none' },
                    bgcolor: '#e6e6e6',
                    color: '#000',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 46,
                    borderRadius: 0,
                    '&:hover': { bgcolor: '#d0d0d0' }
                  }}
                >
                  <X size={26} />
                </IconButton>
              </Box>
              <form ref={formRef} onSubmit={handleUpdateMatch} style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#1a1a1a', color: '#E5E7EB', borderRadius: 0, border: '1px solid white', borderTop: 'none', mb: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* SELECT TEAM Section */}
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', fontSize: { xs: '0.95rem', sm: '1.3rem', md: '1.5rem' }, textTransform: 'uppercase', mb: 1 }}>
                    Select Team
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 2, fontSize: { xs: '0.75rem', sm: '1rem' }, textAlign: 'center' }}>
                    {/* Click on a player from the home or away team to switch or remove players. */}
                 Pick Your Players From the Dropdown And Set Up Your Home And Away Teams. Tap On Any Player To Switch Them Between Teams And Perfect Your Line-Up
                  </Typography>
                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button startIcon={<Image src={GuestIcon} alt="Guest" width={18} height={18} />} variant='contained' onClick={() => setGuestDialogOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg,#e56a16,#cf2326)', color: 'white', fontWeight: 600, borderRadius: 3, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, '&:hover': { background: 'linear-gradient(135deg,#d32f2f,#b71c1c)', transform: 'translateY(-2px)' }, transition: 'all .25s ease' }}>Add Guest</Button>
                    <Button startIcon={<Scale size={18} />} variant="outlined" onClick={balanceTeams} disabled={xpLoading || isBalancing || (homeTeamUsers.filter(p => !p.isGuest).length + awayTeamUsers.filter(p => !p.isGuest).length < 2)} sx={{ width: { xs: '100%', sm: 'auto' }, borderColor: '#1a8a6d', color: '#1a8a6d', fontWeight: 600, borderRadius: 3, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, '&:hover': { borderColor: '#157a62', backgroundColor: 'rgba(26, 138, 109, 0.1)' } }}>{xpLoading || isBalancing ? 'Balancing...' : 'Balance Teams'}</Button>
                    <Button startIcon={<Shuffle size={18} />} variant="outlined" onClick={shuffleTeams} disabled={homeTeamUsers.filter(p => !p.isGuest).length + awayTeamUsers.filter(p => !p.isGuest).length < 2} sx={{ width: { xs: '100%', sm: 'auto' }, borderColor: '#e56a16', color: '#e56a16', fontWeight: 600, borderRadius: 3, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, '&:hover': { borderColor: '#d35a0f', backgroundColor: 'rgba(229, 106, 22, 0.1)' } }}>Shuffle Teams</Button>
                  </Box>
                  {/* Player Selection Section */}
                      {(homeSelectedCount > 0 || awaySelectedCount > 0) && !hasMinimumTeamRequirements && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                          {registeredSelectedCount < MIN_REGISTERED_PLAYERS_FOR_TEAM_UPLOAD
                            ? MIN_REGISTERED_PLAYERS_MESSAGE
                            : `A minimum of 8 total players (including at least 6 registered league players) is required to save teams. Current total: ${totalSelectedCount}.`}
                        </Alert>
                      )}

                      <Grid container spacing={1}>
                        <Grid item xs={12} md={6}>
                          <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1 }}>Select Home Players</Typography>
                          <Autocomplete
                            key={`home-${availabilityVersion}`}
                            multiple
                            options={homePlayerOptions}
                            disableCloseOnSelect
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            // List all players: do not disable by availability
                            getOptionDisabled={() => false}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            PaperComponent={BlackPaper}
                            
                            ListboxProps={{
                              sx: {
                                display: 'grid',
                                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                gap: 1,
                                p: 1,
                                bgcolor: '#000'
                              }
                            }}
                            renderOption={(props, option, { selected }) => {
                              const { key, ...optionProps } = props;
                              const isAvailable = availabilityMap[option.id] === 'available';
                              const availabilityOrder = availableOrderMap[option.id];
                              // const number = option.shirtNumber || (option.isGuest ? 'G' : '—');
                              return (
                                <Box
                                  key={key}
                                  component="li"
                                  {...optionProps}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 1,
                                    position: 'relative',
                                    bgcolor: '#000', // set background to black
                                    border: '1px solid',
                                    borderColor: selected ? (isAvailable ? '#43a047' : '#fff') : 'rgba(255,255,255,0.15)',
                                    borderRadius: 1,
                                    transition: 'background-color .2s ease,border-color .2s ease, transform .08s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(255,255,255,0.06)',
                                      borderColor: '#fff',
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                >
                                  <Avatar
                                    src={option.profilePicture || defaultTeamImagee}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      mb: 0.5,
                                      border: '3px solid',
                                      borderColor: isAvailable ? '#43a047' : '#fff',
                                      bgcolor: '#000',
                                      '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, color: isAvailable ? '#43a047' : '#fff' }}>
                                    {option.firstName}
                                  </Typography>
                                  {isAvailable && Number.isFinite(availabilityOrder) && (
                                    <Typography sx={{ fontSize: '0.55rem', lineHeight: 1, color: '#43a047' }}>
                                      ({availabilityOrder})
                                    </Typography>
                                  )}
                                  {selected && (
                                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAvailable ? '#43a047' : '#fff', border: '1px solid', borderColor: isAvailable ? '#43a047' : '#fff' }}>
                                      <Check size={12} />
                                    </Box>
                                  )}
                                  {/* Show shirt number: green if available, black otherwise */}
                                  {/* <Box sx={{
                                    mt: 0.4,
                                    px: 0.6,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: isAvailable ? '#43a047' : '#111'
                                  }}>
                                    {number}
                                  </Box> */}
                                </Box>
                              );
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((opt, index) => {
                                const tagProps = getTagProps({ index });
                                const { key: tagKey, ...safeTagProps } = tagProps;
                                delete (safeTagProps as { onDelete?: unknown }).onDelete;
                                const isAvailable = availabilityMap[opt.id] === 'available';
                                const availabilityOrder = availableOrderMap[opt.id];
                                // const number = opt.shirtNumber || (opt.isGuest ? 'G' : '—');
                                return (
                                  <Box
                                    key={tagKey ?? opt.id}
                                    {...safeTagProps}
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      mr: 1,
                                      position: 'relative',
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayerClick(e, opt, 'home');
                                    }}
                                  >
                                    <Avatar
                                      src={opt.profilePicture || defaultTeamImagee}
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        mb: 0.3,
                                        border: '3px solid',
                                        borderColor: isAvailable ? '#43a047' : '#fff',
                                        bgcolor: '#000',
                                        '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                      }}
                                    />
                                    <Typography sx={{ fontSize: 10, maxWidth: 54, textAlign: 'center', lineHeight: 1.1, color: isAvailable ? '#43a047' : '#fff' }}>
                                    {opt.firstName}
                                    </Typography>
                                    {isAvailable && Number.isFinite(availabilityOrder) && (
                                      <Typography sx={{ fontSize: '0.5rem', lineHeight: 1, color: '#43a047' }}>
                                        ({availabilityOrder})
                                      </Typography>
                                    )}
                                    {/* Shirt number instead of availability text */}
                                    {/* <Box sx={{
                                      mt: 0.2,
                                      px: 0.4,
                                      py: 0.15,
                                      borderRadius: 1,
                                      fontSize: '0.55rem',
                                      fontWeight: 800,
                                      color: isAvailable ? '#43a047' : '#fff'
                                    }}>
                                      {number}
                                    </Box> */}
                                  </Box>
                                );
                              })
                            }
                            value={homeTeamUsers}
                            onChange={(_, newValue) => {
                              setHomeTeamUsers(newValue);
                              if (homeCaptain && !newValue.some(u => u.id === homeCaptain.id)) {
                                setHomeCaptain(null);
                              }
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                placeholder="Select players"
                                // helperText="Green number = available; white = unavailable"
                                FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
                                sx={{ 
                                  ...autocompleteStyles, 
                                  '& .MuiOutlinedInput-root': { 
                                    ...autocompleteStyles['& .MuiOutlinedInput-root'], 
                                    borderRadius: 1, 
                                    '& fieldset': { borderColor: '#00a77f', borderRadius: 1 }, 
                                    '&:hover fieldset': { borderColor: '#00a77f' }, 
                                    '&.Mui-focused fieldset': { borderColor: '#00a77f' } 
                                  },
                                  '& .MuiAutocomplete-clearIndicator': { color: 'white' },
                                  '& .MuiAutocomplete-popupIndicator': { color: 'white' }
                                }}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1 }}>Select Away Players</Typography>
                          <Autocomplete
                            key={`away-${availabilityVersion}`}
                            multiple
                            options={awayPlayerOptions}
                            disableCloseOnSelect
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            // List all players: do not disable by availability
                            getOptionDisabled={() => false}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            PaperComponent={BlackPaper}
                            
                            ListboxProps={{
                              sx: {
                                display: 'grid',
                                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                gap: 1,
                                p: 1,
                                bgcolor: '#000'
                              }
                            }}
                            renderOption={(props, option, { selected }) => {
                              const { key, ...optionProps } = props;
                              const isAvailable = availabilityMap[option.id] === 'available';
                              const availabilityOrder = availableOrderMap[option.id];
                              // const number = option.shirtNumber || (option.isGuest ? 'G' : '—');
                              return (
                                <Box
                                  key={key}
                                  component="li"
                                  {...optionProps}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 1,
                                    position: 'relative'
                                    ,bgcolor: '#000', // set background to black
                                    border: '1px solid',
                                    borderColor: selected ? (isAvailable ? '#43a047' : '#fff') : 'rgba(255,255,255,0.15)',
                                    borderRadius: 1,
                                    transition: 'background-color .2s ease,border-color .2s ease, transform .08s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(255,255,255,0.06)',
                                      borderColor: '#fff',
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                >
                                  <Avatar
                                    src={option.profilePicture || defaultTeamImagee}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      mb: 0.5,
                                      border: '3px solid',
                                      borderColor: isAvailable ? '#43a047' : '#fff',
                                      bgcolor: '#000',
                                      '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1 , color: isAvailable ? '#43a047' : '#fff' }}>
                                     {option.firstName}
                                  </Typography>
                                  {isAvailable && Number.isFinite(availabilityOrder) && (
                                    <Typography sx={{ fontSize: '0.55rem', lineHeight: 1, color: '#43a047' }}>
                                      ({availabilityOrder})
                                    </Typography>
                                  )}
                                  {selected && (
                                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAvailable ? '#43a047' : '#fff', border: '1px solid', borderColor: isAvailable ? '#43a047' : '#fff' }}>
                                      <Check size={12} />
                                    </Box>
                                  )}
                                  {/* Shirt number: green if available, black otherwise */}
                                  {/* <Box sx={{
                                    mt: 0.4,
                                    px: 0.6,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: isAvailable ? '#43a047' : '#111'
                                  }}>
                                    {number}
                                  </Box> */}
                                </Box>
                              );
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((opt, index) => {
                                const tagProps = getTagProps({ index });
                                const { key: tagKey, ...safeTagProps } = tagProps;
                                delete (safeTagProps as { onDelete?: unknown }).onDelete;
                                const isAvailable = availabilityMap[opt.id] === 'available';
                                const availabilityOrder = availableOrderMap[opt.id];
                                // const number = opt.shirtNumber || (opt.isGuest ? 'G' : '—');
                                return (
                                  <Box
                                    key={tagKey ?? opt.id}
                                    {...safeTagProps}
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      mr: 1,
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayerClick(e, opt, 'away');
                                    }}
                                  >
                                    <Avatar
                                      src={opt.profilePicture || defaultTeamImagee}
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        mb: 0.3,
                                        border: '3px solid',
                                        borderColor: isAvailable ? '#43a047' : '#fff',
                                        bgcolor: '#000',
                                        '& .MuiAvatar-img': { backgroundColor: '#000', objectFit: 'cover' }
                                      }}
                                    />
                                    <Typography sx={{ fontSize: 10, maxWidth: 54, textAlign: 'center', lineHeight: 1.1, color: isAvailable ? '#43a047' : '#fff' }}>
                                     {opt.firstName}
                                    </Typography>
                                    {isAvailable && Number.isFinite(availabilityOrder) && (
                                      <Typography sx={{ fontSize: '0.5rem', lineHeight: 1, color: '#43a047' }}>
                                        ({availabilityOrder})
                                      </Typography>
                                    )}
                                    {/* Shirt number instead of availability text */}
                                    {/* <Box sx={{
                                      mt: 0.2,
                                      px: 0.4,
                                      py: 0.15,
                                      borderRadius: 1,
                                      fontSize: '0.55rem',
                                      fontWeight: 800,
                                      color: isAvailable ? '#43a047' : '#fff'
                                    }}>
                                      {number}
                                    </Box> */}
                                  </Box>
                                );
                              })
                            }
                            value={awayTeamUsers}
                            onChange={(_, newValue) => {
                              setAwayTeamUsers(newValue);
                              if (awayCaptain && !newValue.some(u => u.id === awayCaptain.id)) {
                                setAwayCaptain(null);
                              }
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                placeholder="Select players"
                                // helperText="Green number = available; white = unavailable"
                                FormHelperTextProps={{ sx: { color: '#9CA3AF' } }}
                                sx={{ 
                                  ...autocompleteStyles, 
                                  '& .MuiOutlinedInput-root': { 
                                    ...autocompleteStyles['& .MuiOutlinedInput-root'], 
                                    borderRadius: 1, 
                                    '& fieldset': { borderColor: '#e56a16', borderRadius: 1 }, 
                                    '&:hover fieldset': { borderColor: '#e56a16' }, 
                                    '&.Mui-focused fieldset': { borderColor: '#e56a16' } 
                                  },
                                  '& .MuiAutocomplete-clearIndicator': { color: 'white' },
                                  '& .MuiAutocomplete-popupIndicator': { color: 'white' }
                                }}
                              />
                            )}
                          />
                        </Grid>

                        {/* Manual captain selectors */}
                        <Grid item xs={12} md={6}>
                          <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1 }}>Select Home Captain</Typography>
                          <Autocomplete<PlayerOption, false, false>
                            options={homeTeamUsers}
                            value={homeCaptain}
                            onChange={(_, val) => setHomeCaptain(val)}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            getOptionLabel={(o) => formatGuestAwarePlayerName(o)}
                            disabled={!homeTeamUsers.length}
                            PaperComponent={BlackPaper}
                            
                            renderInput={params => (
                              <TextField
                                {...params}
                                placeholder="Choose captain"
                                sx={{ 
                                  ...autocompleteStyles, 
                                  '& .MuiOutlinedInput-root': { 
                                    ...autocompleteStyles['& .MuiOutlinedInput-root'], 
                                    borderRadius: 1, 
                                    '& fieldset': { borderColor: '#00a77f', borderRadius: 1 }, 
                                    '&:hover fieldset': { borderColor: '#00a77f' }, 
                                    '&.Mui-focused fieldset': { borderColor: '#00a77f' } 
                                  },
                                  '& .MuiAutocomplete-clearIndicator': { color: 'white' },
                                  '& .MuiAutocomplete-popupIndicator': { color: 'white' }
                                }}
                                helperText={homeCaptain?.isGuest ? 'Guest captain will not be saved on server' : ''}
                                FormHelperTextProps={{ sx: { color: '#ffb300' } }}
                              />
                            )}
                            renderOption={(props, option, { selected }) => {
                              const { key, ...optionProps } = props;
                              return (
                              <Box
                                key={key}
                                component="li"
                                {...optionProps}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  py: .5,
                                  px: 1,
                                  bgcolor: '#000',
                                  borderLeft: selected ? '3px solid #43a047' : '3px solid transparent',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  transition: 'background-color .2s ease,border-color .2s ease, box-shadow .2s ease, transform .08s ease',
                                  '& .MuiAvatar-root': { transition: 'box-shadow .2s ease, border-color .2s ease' },
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    borderLeft: selected ? '3px solid #43a047' : '3px solid #fff',
                                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.20)',
                                    transform: 'translateY(-1px)'
                                  },
                                  '&:hover .MuiAvatar-root': {
                                    boxShadow: '0 0 0 2px rgba(255,255,255,0.35)'
                                  }
                                }}
                              >
                                <Avatar
                                  src={option.profilePicture || defaultTeamImagee}
                                  sx={{ width: 30, height: 30 }}
                                />
                                <Typography variant="body2" sx={{ flex: 1, color: '#fff' }}>
                                  {formatGuestAwarePlayerName(option)}
                                </Typography>
                                {!option.isGuest && (
                                  <Chip
                                    size="small"
                                    label={`Skill ${calcSkill(option)}`}
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                                {option.isGuest && !isGuestLastName(option.lastName) && (
                                  <Chip size="small" color="warning" label="Guest" sx={{ height: 20, fontSize: '0.65rem' }} />
                                )}
                              </Box>
                            )}}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1 }}>Select Away Captain</Typography>
                          <Autocomplete<PlayerOption, false, false>
                            options={awayTeamUsers}
                            value={awayCaptain}
                            onChange={(_, val) => setAwayCaptain(val)}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            getOptionLabel={(o) => formatGuestAwarePlayerName(o)}
                            disabled={!awayTeamUsers.length}
                            PaperComponent={BlackPaper}
                            
                            renderInput={params => (
                              <TextField
                                {...params}
                                placeholder="Choose captain"
                                sx={{ 
                                  ...autocompleteStyles, 
                                  '& .MuiOutlinedInput-root': { 
                                    ...autocompleteStyles['& .MuiOutlinedInput-root'], 
                                    borderRadius: 1, 
                                    '& fieldset': { borderColor: '#e56a16', borderRadius: 1 }, 
                                    '&:hover fieldset': { borderColor: '#e56a16' }, 
                                    '&.Mui-focused fieldset': { borderColor: '#e56a16' } 
                                  },
                                  '& .MuiAutocomplete-clearIndicator': { color: 'white' },
                                  '& .MuiAutocomplete-popupIndicator': { color: 'white' }
                                }}
                                helperText={awayCaptain?.isGuest ? 'Guest captain will not be saved on server' : ''}
                                FormHelperTextProps={{ sx: { color: '#ffb300' } }}
                              />
                            )}
                            renderOption={(props, option, { selected }) => {
                              const { key, ...optionProps } = props;
                              return (
                              <Box
                                key={key}
                                component="li"
                                {...optionProps}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  py: .5,
                                  px: 1,
                                  bgcolor: '#000',
                                  borderLeft: selected ? '3px solid #43a047' : '3px solid transparent',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  transition: 'background-color .2s ease,border-color .2s ease, box-shadow .2s ease, transform .08s ease',
                                  '& .MuiAvatar-root': { transition: 'box-shadow .2s ease, border-color .2s ease' },
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    borderLeft: selected ? '3px solid #43a047' : '3px solid #fff',
                                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.20)',
                                    transform: 'translateY(-1px)'
                                  },
                                  '&:hover .MuiAvatar-root': {
                                    boxShadow: '0 0 0 2px rgba(255,255,255,0.35)'
                                  }
                                }}
                              >
                                <Avatar
                                  src={option.profilePicture || defaultTeamImagee}
                                  sx={{ width: 30, height: 30 }}
                                />
                                <Typography variant="body2" sx={{ flex: 1, color: '#fff' }}>
                                  {formatGuestAwarePlayerName(option)}
                                </Typography>
                                {!option.isGuest && (
                                  <Chip
                                    size="small"
                                    label={`Skill ${calcSkill(option)}`}
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                                {option.isGuest && !isGuestLastName(option.lastName) && (
                                  <Chip size="small" color="warning" label="Guest" sx={{ height: 20, fontSize: '0.65rem' }} />
                                )}
                              </Box>
                            )}}
                          />
                        </Grid>
                        {/* END Captain selectors */}
                      </Grid>

                  {/* Team Names (Optional) */}
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1 }}>Home Team Name (Optional)</Typography>
                      <Box sx={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                        <TextField
                          placeholder='Enter team name'
                          value={homeTeamName}
                          onChange={e => setHomeTeamName(e.target.value)}
                          sx={{ ...inputStyles, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '3px 0 0 3px' }, '& fieldset': { borderRadius: '3px 0 0 3px', borderColor: '#00a77f' }, '& .MuiOutlinedInput-root:hover fieldset': { borderColor: '#00a77f' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#00a77f' }, '& input::placeholder': { color: 'white', opacity: 1 }, '& input': { color: 'white', fontWeight: 400 } }}
                        />
                        <Button
                          variant='outlined'
                          component='label'
                          sx={{ color: '#00a77f', borderColor: '#00a77f', textTransform: 'none', whiteSpace: 'nowrap', px: 2, height: '43px', borderRadius: '0 3px 3px 0', '&:hover': { borderColor: '#00a77f', bgcolor: 'rgba(0,167,127,0.1)' } }}
                        >
                          Add Logo
                          <input type='file' hidden accept='image/*' onChange={handleHomeTeamImageUpload} />
                        </Button>
                      </Box>
                      {homeTeamImagePreview && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={homeTeamImagePreview} sx={{ width: 40, height: 40 }} />
                          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', flex: 1 }}>Logo Preview</Typography>
                          <IconButton size='small' onClick={handleRemoveHomeTeamImage} sx={{ color: '#ef5350' }}><X size={16} /></IconButton>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1 }}>Away Team Name (Optional)</Typography>
                      <Box sx={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                        <TextField
                          placeholder='Enter team name'
                          value={awayTeamName}
                          onChange={e => setAwayTeamName(e.target.value)}
                          sx={{ ...inputStyles, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '3px 0 0 3px' }, '& fieldset': { borderRadius: '3px 0 0 3px', borderColor: '#e56a16' }, '& .MuiOutlinedInput-root:hover fieldset': { borderColor: '#e56a16' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#e56a16' }, '& input::placeholder': { color: 'white', opacity: 1 }, '& input': { color: 'white', fontWeight: 400 } }}
                        />
                        <Button
                          variant='outlined'
                          component='label'
                          sx={{ color: '#e56a16', borderColor: '#e56a16', textTransform: 'none', whiteSpace: 'nowrap', px: 2, height: '43px', borderRadius: '0 3px 3px 0', '&:hover': { borderColor: '#e56a16', bgcolor: 'rgba(229,106,22,0.1)' } }}
                        >
                          Add Logo
                          <input type='file' hidden accept='image/*' onChange={handleAwayTeamImageUpload} />
                        </Button>
                      </Box>
                      {awayTeamImagePreview && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={awayTeamImagePreview} sx={{ width: 40, height: 40 }} />
                          <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', flex: 1 }}>Logo Preview</Typography>
                          <IconButton size='small' onClick={handleRemoveAwayTeamImage} sx={{ color: '#ef5350' }}><X size={16} /></IconButton>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Paper>

                {/* MATCH DETAIL */}
                <Paper sx={{ mt: 0, mb: 0, p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#1a1a1a', color: '#E5E7EB', borderRadius: 0, border: '1px solid white', borderTop: 'none' }}>
                  {/* Add Match Notification */}
                  <Box sx={{ mb: 2, }}>
                    <Typography
                      onClick={() => setShowNotificationBox(prev => !prev)}
                      sx={{ color: 'white', cursor: 'pointer', fontSize: { xs: '0.9rem', sm: '1.1rem' }, fontWeight: 500, '&:hover': { textDecoration: 'underline' }, userSelect: 'none' }}
                    >
                      {showNotificationBox ? '− Close Notification' : '+ Add Match Notification'}
                    </Typography>
                    {showNotificationBox && (
                      <Box sx={{ mt: 1.5, p: 2, bgcolor: 'rgba(26,138,109,0.08)', borderRadius: 2, border: '1px solid rgba(26,138,109,0.25)' }}>
                        <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mb: 1 }}>
                          Choose target audience for this notification.
                        </Typography>
                        <RadioGroup
                          row
                          value={notificationAudience}
                          onChange={(e) => setNotificationAudience(e.target.value as NotificationAudience)}
                          sx={{ mb: 1 }}
                        >
                          <FormControlLabel value="match" control={<Radio size="small" />} label="Players in this match" />
                          <FormControlLabel value="league" control={<Radio size="small" />} label="All players in this league" />
                        </RadioGroup>
                        <TextField
                          placeholder='Type your notification message...'
                          value={notificationMessage}
                          onChange={e => setNotificationMessage(e.target.value.slice(0, 50))}
                          fullWidth
                          multiline
                          minRows={2}
                          maxRows={4}
                          inputProps={{ maxLength: 50 }}
                          sx={{ ...inputStyles }}
                        />
                        <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mt: 0.5, textAlign: 'right' }}>
                          {notificationMessage.length}/50
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant='h6' sx={{ mb: 0.1, fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: '1rem', sm: '1.2rem' }, color: 'white' }}>Match Detail</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1, textTransform: 'capitalize' }}>Match Date</Typography>
                      <DatePicker
                        format="DD-MMM-YYYY"
                        value={matchDate}
                        onChange={(nv: Dayjs | null) => setMatchDate(nv)}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true, 
                            sx: inputStyles,
                            InputProps: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Image src={CalendarIcon} alt="Calendar" width={24} height={24} style={{ opacity: 0.7 }} />
                                </InputAdornment>
                              )
                            }
                          } 
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1, textTransform: 'capitalize' }}>Start Time</Typography>
                      <TimePicker
                        value={startTime}
                        onChange={(nv: Dayjs | null) => setStartTime(nv)}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true, 
                            sx: inputStyles,
                            InputProps: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Image src={ClockIcon} alt="Clock" width={24} height={24} style={{ opacity: 0.7 }} />
                                </InputAdornment>
                              )
                            }
                          } 
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1, textTransform: 'capitalize' }}>Duration (Min)</Typography>
                      <TextField
                        type='number'
                        value={duration}
                        onChange={e => handleDurationChange(e.target.value)}
                        fullWidth
                        sx={{ ...inputStyles }}
                        inputProps={{ min: 1, max: 999 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Image src={GlassIcon} alt="Duration" width={24} height={24} style={{ opacity: 0.7 }} />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ color: 'white', fontSize: { xs: '0.9rem', sm: '1.3rem' }, fontWeight: 500, fontFamily: 'var(--font-woodford-bourne-pro)', mb: 0.1, textTransform: 'capitalize' }}>Location</Typography>
                      <TextField
                        value={location}
                        onChange={(e) => {
                          setLocation(clampLocation(e.target.value));
                          setSelectedMapPoint(null);
                        }}
                        fullWidth
                        inputProps={{ maxLength: 120 }}
                        sx={{ ...inputStyles }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleOpenMap}
                                size="small"
                                aria-label="Open map picker"
                                sx={{
                                  p: 0.4,
                                  borderRadius: 1,
                                  '&:hover': { background: 'rgba(255,255,255,0.12)' }
                                }}
                              >
                                <Image src={LocationIcon} alt="Location" width={24} height={24} style={{ opacity: 0.8 }} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mt: 0.5, textAlign: 'right' }}>
                        {location.length}/120
                      </Typography>
                    </Grid>
                  </Grid>
                  {error && <Typography color='error' sx={{ my: 3, p: 2, bgcolor: 'rgba(244,67,54,0.1)', borderRadius: 2, border: '1px solid rgba(244,67,54,0.3)' }}>{error}</Typography>}
                  <Button
                    type='submit'
                    variant='contained'
                    fullWidth
                    sx={{ mt: 3, py: { xs: 0.9, sm: 1 }, background: 'linear-gradient(135deg, #00a77f, #00a77f)', color: 'white', fontWeight: 'bold', borderRadius: 1,  '&:hover': { background: 'linear-gradient(135deg, #157a62, #126b55)' } }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'SAVE'}
                  </Button>
                </Paper>
              </form>
            </Box>
            {/* RIGHT PANEL */}
            <Box sx={{ width: { xs: '100%', md: '45%' }, display: 'flex', flexDirection: 'column' }}>
              {/* MATCH PREVIEW Tab Header */}
              <Box sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 3 }, background: '#00a77f', textAlign: 'center', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.4rem', md: '1.6rem' }, fontFamily: 'var(--font-geist-anton), "Anton", sans-serif', textTransform: 'uppercase', letterSpacing: { xs: 1, sm: 2 } }}>
                  Match Preview
                </Typography>
                <IconButton onClick={() => { if (isDialog && onClose) onClose(); else router.push(`/league/${leagueId}`); }} sx={{ display: { xs: 'none', md: 'inline-flex' }, bgcolor: '#e6e6e6', color: '#000', position: 'absolute', right: 0, top: 0, bottom: 0, transform: 'none', borderRadius: 0, width: { md: 58, lg: 64 }, '&:hover': { bgcolor: '#d0d0d0' } }}>
                  <X size={isDialog ? 32 : 38} />
                </IconButton>
              </Box>
              <Paper sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                bgcolor: '#1a1a1a',
                color: 'white',
                borderRadius: 0,
                border: '1px solid white',
                borderTop: 'none',
                overflow: 'hidden',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>

                {/* Win Probability */}
                {(homeTeamUsers.length > 0 || awayTeamUsers.length > 0) && (
                  <Box sx={{ mb: 0, p: { xs: 1.5, sm: 2, md: 3 }, borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ mb: { xs: 1, sm: 1.5, md: 2 }, textAlign: 'center', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1.1rem', md: '1.35rem' }, textTransform: 'uppercase', letterSpacing: 1 }}>Team Balance</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, sm: 1.5, md: 2 } }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#00a77f', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{teamBalance.hasData ? `${teamBalance.homePct}%` : '—'}</Typography>
                        {/* <Typography variant="body2" sx={{ color: '#43a047', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{homeTeamName || 'Home'}</Typography> */}
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#e56a16', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>{teamBalance.hasData ? `${teamBalance.awayPct}%` : '—'}</Typography>
                        {/* <Typography variant="body2" sx={{ color: '#ef5350', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>{awayTeamName || 'Away'}</Typography> */}
                      </Box>
                    </Box>
                    {teamBalance.hasData && (
                      <LinearProgress
                        variant="determinate"
                        value={teamBalance.homePct}
                        sx={{
                          height: { xs: 6, sm: 8 },
                          borderRadius: { xs: 3, sm: 4 },
                          bgcolor: '#e56a16',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#00a77f',
                            borderRadius: { xs: 3, sm: 4 }
                          }
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 0.5, sm: 1 } }}>
                      {/* {xpBased.total > 0 && (
                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                          XP-based ratio
                        </Typography>
                      )} */}
                    </Box>
                    {/* 
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 0.5, sm: 1 } }}>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {homeStrength ?? '—'}</Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Strength: {awayStrength ?? '—'}</Typography>
                        </Box> */}
                  </Box>
                )}

                {/* <Divider sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, borderColor: 'rgba(255,255,255,0.3)', width: { xs: '50px', sm: '80px', md: '100px' }, mx: 'auto' }} /> */}

                {/* Team Logos + VS Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mx: 2, mb: { xs: 2, sm: 3, md: 4 },}}>
                  {/* Home Team Logo + Label */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: { xs: 70, sm: 80, md: 90 }, height: { xs: 70, sm: 80, md: 90 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image src={LeftShirt} alt="Home" width={80} height={80} style={{ objectFit: 'contain' }} />
                    </Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>
                      {homeTeamName || 'Home'}
                    </Typography>
                  </Box>

                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{  fontWeight: '500 !important', fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' }, color: '#fff', letterSpacing: 2, fontFamily: 'var(--font-geist-anton), "Anton", sans-serif !important', textTransform: 'uppercase' }}>
                      V/S
                    </Typography>
                    <Typography sx={{ color: '#9CA3AF', fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem', } }}>
                      {duration || 90} Minutes Match
                    </Typography>
                  </Box>

                  {/* Away Team Logo + Label */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: { xs: 70, sm: 80, md: 90 }, height: { xs: 70, sm: 80, md: 90 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image src={RightShirt} alt="Away" width={80} height={80} style={{ objectFit: 'contain' }} />
                    </Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>
                      {awayTeamName || 'Away'}
                    </Typography>
                  </Box>
                </Box>

                { /* Player lists */}
                <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5, md: 0.8 }, alignItems: 'flex-start' }}>
                  {/* Home Team list (header removed) */}
                  <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {homeCaptain && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: { xs: 0.5, sm: 1, md: 1.5 },
                          p: { xs: 0.5, sm: 0.8, md: 1.5 },
                          bgcolor: 'rgba(255,255,255,0.03)',
                          borderRadius: 1,
                          border: '1px solid #029470',
                          cursor: 'pointer',
                          minHeight: { xs: 28, sm: 35, md: 50 },
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                          overflow: 'hidden'
                        }}
                        draggable
                        onDragEnd={() => movePlayer(homeCaptain, 'away')}
                        onClick={(e) => handlePlayerClick(e, homeCaptain, 'home')}
                      >
                        <ShirtAvatar number={homeCaptain.shirtNumber || (homeCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} team="home" />
                        <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography
                              fontWeight="bold"
                              sx={{
                                fontSize: { xs: 8, sm: 10, md: 14 },
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 0.3, sm: 0.5 }
                              }}
                            >
                              <span>{formatGuestAwarePlayerName(homeCaptain)}</span>
                              {homeCaptain.isGuest && !isGuestLastName(homeCaptain.lastName) && (
                                <Chip
                                  label="G"
                                  size="small"
                                  sx={{
                                    height: { xs: 10, sm: 12, md: 16 },
                                    fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                    bgcolor: '#e67e22',
                                    color: 'white',
                                    '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                  }}
                                />
                              )}
                            </Typography>
                            <Chip
                              label="Captain"
                              size="small"
                              sx={{
                                height: { xs: 10, sm: 12, md: 16 },
                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                color: '#029470',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                              }}
                            />
                          </Box>
                          <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', fontSize: { xs: 6, sm: 7, md: 10 } }}>
                            <Typography sx={{ fontSize: 'inherit', color: '#9CA3AF' }}>Position: Defender</Typography>
                            <Typography sx={{ fontSize: 'inherit', color: '#B0BEC5' }}>Avg XP: {getAvgRating(homeCaptain)}</Typography>
                          </Box>
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
                            mb: { xs: 0.5, sm: 1, md: 1.5 },
                            p: { xs: 0.5, sm: 0.8, md: 1.5 },
                            bgcolor: 'rgba(255,255,255,0.03)',
                            borderRadius: 1,
                            border: '1px solid #029470',
                            cursor: 'pointer',
                            minHeight: { xs: 28, sm: 35, md: 50 },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            overflow: 'hidden'
                          }}
                          draggable
                          onDragEnd={() => movePlayer(user, 'away')}
                          onClick={(e) => handlePlayerClick(e, user, 'home')}
                        >
                          <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} team="home" />
                          <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                            <Typography
                              fontWeight={500}
                              sx={{
                                fontSize: { xs: 8, sm: 10, md: 14 },
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 0.3, sm: 0.5 }
                              }}
                            >
                              <span>{formatGuestAwarePlayerName(user)}</span>
                              {user.isGuest && !isGuestLastName(user.lastName) && (
                                <Chip
                                  label="G"
                                  size="small"
                                  sx={{
                                    height: { xs: 10, sm: 12, md: 16 },
                                    fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                    bgcolor: '#e67e22',
                                    color: 'white',
                                    '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                  }}
                                />
                              )}
                            </Typography>
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', fontSize: { xs: 6, sm: 7, md: 10 } }}>
                              <Typography sx={{ fontSize: 'inherit', color: '#9CA3AF' }}>Position: Defender</Typography>
                              <Typography sx={{ fontSize: 'inherit', color: '#B0BEC5' }}>Avg XP: {getAvgRating(user)}</Typography>
                            </Box>
                          </Box>
                          {user.isGuest && (
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
                                const g = homeGuests.find(g => g.tempId === user.guestTempId);
                                if (g) removeStagedGuest('home', g.tempId);
                              }}
                            >
                              <X size={8} />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                  </Box>

                  {/* Middle divider */}
                  <Box
                    sx={{
                      width: { xs: '1px', sm: '2px', md: '3px' },
                      bgcolor: 'rgba(255,255,255,0.4)',
                      minHeight: { xs: 60, sm: 80, md: 120 },
                      borderRadius: 0.5,
                      alignSelf: 'stretch',
                      flexShrink: 0
                    }}
                  />

                  {/* Away Team list (header removed) */}
                  <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {awayCaptain && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: { xs: 0.5, sm: 1, md: 1.5 },
                          p: { xs: 0.5, sm: 0.8, md: 1.5 },
                          bgcolor: 'rgba(255,255,255,0.03)',
                          borderRadius: 1,
                          border: '1px solid #e56a16',
                          cursor: 'pointer',
                          minHeight: { xs: 28, sm: 35, md: 50 },
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                          overflow: 'hidden'
                        }}
                        draggable
                        onDragEnd={() => movePlayer(awayCaptain, 'home')}
                        onClick={(e) => handlePlayerClick(e, awayCaptain, 'away')}
                      >
                        <ShirtAvatar number={awayCaptain.shirtNumber || (awayCaptain.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} team="away" />
                        <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography
                              fontWeight="bold"
                              sx={{
                                fontSize: { xs: 8, sm: 10, md: 14 },
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 0.3, sm: 0.5 }
                              }}
                            >
                              <span>{formatGuestAwarePlayerName(awayCaptain)}</span>
                              {awayCaptain.isGuest && !isGuestLastName(awayCaptain.lastName) && (
                                <Chip
                                  label="G"
                                  size="small"
                                  sx={{
                                    height: { xs: 10, sm: 12, md: 16 },
                                    fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                    bgcolor: '#e67e22',
                                    color: 'white',
                                    '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                  }}
                                />
                              )}
                            </Typography>
                            <Chip
                              label="Captain"
                              size="small"
                              sx={{
                                height: { xs: 10, sm: 12, md: 16 },
                                fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                color: '#e56a16',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                              }}
                            />
                          </Box>
                          <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', fontSize: { xs: 6, sm: 7, md: 10 } }}>
                            <Typography sx={{ fontSize: 'inherit', color: '#9CA3AF' }}>Position: Defender</Typography>
                            <Typography sx={{ fontSize: 'inherit', color: '#B0BEC5' }}>Avg XP: {getAvgRating(awayCaptain)}</Typography>
                          </Box>
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
                            mb: { xs: 0.5, sm: 1, md: 1.5 },
                            p: { xs: 0.5, sm: 0.8, md: 1.5 },
                            bgcolor: 'rgba(255,255,255,0.03)',
                            borderRadius: 1,
                            border: '1px solid #e56a16',
                            cursor: 'pointer',
                            minHeight: { xs: 28, sm: 35, md: 50 },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            overflow: 'hidden'
                          }}
                          draggable
                          onDragEnd={() => movePlayer(user, 'home')}
                          onClick={(e) => handlePlayerClick(e, user, 'away')}
                        >
                          <ShirtAvatar number={user.shirtNumber || (user.isGuest ? 'G' : '0')} size={{ xs: 18, sm: 24 }} team="away" />
                          <Box sx={{ ml: { xs: 0.5, sm: 0.8, md: 1.5 }, flex: 1, minWidth: 0 }}>
                            <Typography
                              fontWeight={500}
                              sx={{
                                fontSize: { xs: 8, sm: 10, md: 14 },
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 0.3, sm: 0.5 }
                              }}
                            >
                              <span>{formatGuestAwarePlayerName(user)}</span>
                              {user.isGuest && !isGuestLastName(user.lastName) && (
                                <Chip
                                  label="G"
                                  size="small"
                                  sx={{
                                    height: { xs: 10, sm: 12, md: 16 },
                                    fontSize: { xs: '0.4rem', sm: '0.5rem', md: '0.65rem' },
                                    bgcolor: '#e67e22',
                                    color: 'white',
                                    '& .MuiChip-label': { px: { xs: 0.2, sm: 0.3, md: 0.5 } }
                                  }}
                                />
                              )}
                            </Typography>
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', fontSize: { xs: 6, sm: 7, md: 10 } }}>
                              <Typography sx={{ fontSize: 'inherit', color: '#9CA3AF' }}>Position: Defender</Typography>
                              <Typography sx={{ fontSize: 'inherit', color: '#B0BEC5' }}>Avg XP: {getAvgRating(user)}</Typography>
                            </Box>
                          </Box>
                          {user.isGuest && (
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
                                const g = awayGuests.find(g => g.tempId === user.guestTempId);
                                if (g) removeStagedGuest('away', g.tempId);
                              }}
                            >
                              <X size={8} />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                  </Box>
                </Box>

                {/* Match Info Card */}
                <Box sx={{ mt: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 }, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Image src={CalendarIcon} alt="Calendar" width={16} height={16} style={{ opacity: 0.7 }} />
                      <Typography sx={{ color: '#9CA3AF', fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.80rem' } }}>Match Date: {matchDate ? matchDate.format('DD-MMM-YYYY') : '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Image src={ClockIcon} alt="Clock" width={16} height={16} style={{ opacity: 0.7 }} />
                      <Typography sx={{ color: '#9CA3AF', fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.80rem' } }}>Time: {startTime ? startTime.format('hh:mm A') : '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Image src={GlassIcon} alt="Duration" width={16} height={16} style={{ opacity: 0.7 }} />
                      <Typography sx={{ color: '#9CA3AF', fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.80rem' } }}>Duration: {duration || 90} Minutes</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                    <Image src={LocationIcon} alt="Location" width={16} height={16} style={{ opacity: 0.7 }} />
                    <Typography sx={{ color: '#9CA3AF', fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.80rem' } }}>Location: {location || '—'}</Typography>
                  </Box>
                </Box>

                {/* Share Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton sx={{ bgcolor: '#1a8a6d', color: 'white', '&:hover': { bgcolor: '#157a62' }, width: 40, height: 40, borderRadius: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
        
        {/* Player Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(30, 30, 30, 0.98)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              minWidth: 180,
              mt: 1,
              width: { xs: '92vw', sm: 'auto' },
              maxWidth: { xs: '92vw', sm: 'none' },
              left: { xs: '50% !important', sm: 'auto' },
              right: { xs: 'auto', sm: 'auto' },
              transform: { xs: 'translateX(-50%)', sm: 'none' },
            }
          }}
        >
          <MenuItem 
            onClick={handleMakeCaptain}
            sx={{
              color: 'white',
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgba(255, 215, 0, 0.18)',
              }
            }}
          >
            <ListItemIcon>
              <Crown size={20} color="#ffca28" />
            </ListItemIcon>
            <ListItemText 
              primary="Make Captain"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 600
              }}
            />
          </MenuItem>
          <MenuItem 
            onClick={handleSwitchTeam}
            sx={{
              color: 'white',
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgba(56, 142, 60, 0.2)',
              }
            }}
          >
            <ListItemIcon>
              <ArrowLeftRight size={20} color="#4caf50" />
            </ListItemIcon>
            <ListItemText 
              primary="Switch Team"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500
              }}
            />
          </MenuItem>
          
          <MenuItem 
            onClick={handleRemovePlayer}
            sx={{
              color: 'white',
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgba(244, 67, 54, 0.2)',
              }
            }}
          >
            <ListItemIcon>
              <UserMinus size={20} color="#f44336" />
            </ListItemIcon>
            <ListItemText 
              primary="Remove Player"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500
              }}
            />
          </MenuItem>
        </Menu>

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

            <Typography sx={{ mt: 0.8, color: '#9CA3AF', fontSize: 13 }}>
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
                  ...inputStyles,
                  '& .MuiOutlinedInput-root': {
                    ...inputStyles['& .MuiOutlinedInput-root'],
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
                  background: '#00a77f',
                  '&:hover': { background: '#008c6a' },
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
                <Typography sx={{ px: 1.5, py: 1.2, fontSize: 13, color: '#9CA3AF' }}>
                  Search results will appear here.
                </Typography>
              )}
            </Box>
          </DialogContent>
        </Dialog>
        <Toaster position='top-center' reverseOrder={false} />
      </LocalizationProvider>
    );
  }
