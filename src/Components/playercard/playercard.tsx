import React, { useState, useEffect, useRef } from 'react';
import Image, { StaticImageData } from 'next/image';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Modal,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import Foot from '@/Components/images/foot.png'
import Star from '@/Components/images/star.png'
// import EditIcon from '@mui/icons-material/Edit';
// import IconButton from '@mui/material/IconButton';
import { cacheManager } from "@/lib/cacheManager"
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks';
import { getAvatarBackgroundColor, getAvatarInitials } from '@/lib/avatarInitials';

// const fallback = '/assets/cflogo2.png';

// Static mapping for levels, milestone titles, colors, and point ranges
const LEVELS = [
  { level: 1, min: 0, max: 100, title: "Rookie", color: "Green" },
  { level: 2, min: 100, max: 250, title: "The Prospect", color: "Green" },
  { level: 3, min: 250, max: 500, title: "Rising Star", color: "Green" },
  { level: 4, min: 500, max: 1000, title: "The Skilled Player", color: "Blue" },
  { level: 5, min: 1000, max: 2000, title: "The Talented Player", color: "Blue" },
  { level: 6, min: 2000, max: 3000, title: "The Chosen One", color: "Blue" },
  { level: 7, min: 3000, max: 4000, title: "Serial Winner", color: "Blue" },
  { level: 8, min: 4000, max: 5000, title: "Supreme Player", color: "Bronze" },
  { level: 9, min: 5000, max: 6000, title: "The Invincible", color: "Bronze" },
  { level: 10, min: 6000, max: 7000, title: "The Maestro", color: "Bronze" },
  { level: 11, min: 7000, max: 8000, title: "Crème de la Crème", color: "Bronze" },
  { level: 12, min: 8000, max: 9000, title: "Elite", color: "Silver" },
  { level: 13, min: 9000, max: 10000, title: "World-Class", color: "Silver" },
  { level: 14, min: 10000, max: 12000, title: "The Undisputed", color: "Silver" },
  { level: 15, min: 12000, max: 15000, title: "Icon", color: "Silver" },
  { level: 16, min: 15000, max: 18000, title: "Generational Talent", color: "Gold" },
  { level: 17, min: 18000, max: 22000, title: "Legend of the Game", color: "Gold" },
  { level: 18, min: 22000, max: 25000, title: "Football Royalty", color: "Gold" },
  { level: 19, min: 25000, max: 30000, title: "Hall of Famer", color: "Gold" },
  { level: 20, min: 30000, max: Infinity, title: "Champion Footballer", color: "Black" },
];

function getLevelInfo(points: number) {
  return LEVELS.find(lvl => points >= lvl.min && points < lvl.max) || LEVELS[LEVELS.length - 1];
}

// Function to convert position to short form
function getPositionShortForm(position: string): string {
  if (!position || !position.trim()) return '-';
  // First try to extract from parentheses
  const match = position.match(/\(([^)]+)\)/);
  if (match) {
    return match[1]; // Return the text inside parentheses
  }
  
  // If no parentheses, check for common position patterns
  const positionMap: Record<string, string> = {
    'Center-Back (CB)': 'CB',
    'Right-Back (RB)': 'RB',
    'Left-Back (LB)': 'LB',
    'Right Wing-back (RWB)': 'RWB',
    'Left Wing-back (LWB)': 'LWB',
    'Central Midfielder (CM)': 'CM',
    'Defensive Midfielder (CDM)': 'CDM',
    'Attacking Midfielder (CAM)': 'CAM',
    'Right Midfielder (RM)': 'RM',
    'Left Midfielder (LM)': 'LM',
    'Striker (ST)': 'ST',
    'Center Forward (CF)': 'CF',
    'Right Forward (RF)': 'RF',
    'Left Forward (LF)': 'LF',
    'Right Winger (RW)': 'RW',
    'Left Winger (LW)': 'LW',
    'goalkeeper': 'GK',
  };
  
  const lowerPosition = position.toLowerCase();
  if (positionMap[lowerPosition]) {
    return positionMap[lowerPosition];
  }
  
  // Final fallback: return first 3 characters in uppercase
  return position.toUpperCase().substring(0, 3);
}

// Function to calculate average skill (simple mean, 0–99 clamp)
function calculateAverageSkill(stats: {
  DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string;
}): number {
  const keys = ['DRI','SHO','PAS','PAC','DEF','PHY'] as const;
  const values = keys.map(k => {
    const n = parseInt(stats[k], 10); // Removed as any, k is keyof stats
    return Number.isFinite(n) ? Math.max(0, Math.min(99, n)) : 0;
  });
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

// Backward-compat: old function now returns the average number (not a percent)
// function calculateSkillsPercentage(stats: {
//   DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string;
// }): number {
//   return calculateAverageSkill(stats);
// }

interface PlayerCardProps {
  name: string;
  number: string;
  points: number;
  stats: { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string };
  foot: string;
  shirtIcon: string;
  profileImage?: string;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  position: string;
  // hideEditIcon?: boolean; // NEW
  /** When true, clicking the avatar should NOT open the image popup */
  disableImagePopup?: boolean;
  /** When true, hides the share icon button */
  hideShareIcon?: boolean;
}

// Import all possible vector images
import vectorGreen from '@/Components/images/green.svg';
import vectorBlue from '@/Components/images/sky.svg';
import vectorBronze from '@/Components/images/brown.svg';
import vectorSilver from '@/Components/images/silver.svg';
import vectorGold from '@/Components/images/golden.svg';
import vectorBlack from '@/Components/images/goat.png';
import vectorDefault from '@/Components/images/green.svg';
import vectorImg from '@/Components/images/Vectorcard.png'
import XPStarMilestoneCard from '../XPStarMilestoneCard';

const vectorMap: Record<string, StaticImageData> = {
  Green: vectorGreen,
  Blue: vectorBlue,
  Bronze: vectorBronze,
  Silver: vectorSilver,
  Gold: vectorGold,
  Black: vectorBlack,
};

const popupPrimary = '#00a77f';
const popupGradient = 'linear-gradient(135deg,#00a77f 0%,#00a77f 100%)';
const popupBorder = 'rgba(255,255,255,0.12)';
const popupTextMuted = 'rgba(255,255,255,0.72)';

const PlayerCard = ({
  name,
  points,
  foot,
  stats,
  profileImage,
  children,
  width,
  height,
  position,
  disableImagePopup = false,
  hideShareIcon = false,
  // hideEditIcon = false,
}: PlayerCardProps) => {
  // Find the level info based on points
  const levelInfo = getLevelInfo(points);
  const { title, color } = levelInfo;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const nameParts = normalizedName.split(/\s+/).filter(Boolean);
  const firstNameOnly = nameParts[0] || '';
  const lastInitial = nameParts.length > 1
    ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    : '';
  const isPlaceholderName = normalizedName.toLowerCase() === 'player name';
  const displayCardName = isPlaceholderName
    ? 'Player Name'
    : firstNameOnly
    ? (lastInitial ? `${firstNameOnly} ${lastInitial}.` : firstNameOnly)
    : 'Player Name';
  const avatarInitials = getAvatarInitials({ name: normalizedName });
  const avatarBg = getAvatarBackgroundColor(normalizedName || displayCardName);
  const normalizedFoot = typeof foot === 'string' ? foot.trim().toUpperCase() : '';
  const footLabel = normalizedFoot === 'RIGHT' ? 'R' : normalizedFoot === 'LEFT' ? 'L' : (normalizedFoot || '-');
  const isRightFoot = footLabel === 'R';
  // Pick the correct vector image based on color
  const Title = vectorMap[color] || vectorDefault;
  
  // State management
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [editOptionsOpen, setEditOptionsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(profileImage ?? null);
  // const [imgVersion, setImgVersion] = useState(0);
  const { token, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);     // gallery picker
  const cameraInputRef = useRef<HTMLInputElement | null>(null);   // (kept for fallback if needed)
  const [imgVersion, setImgVersion] = useState(0);                // NEW: cache-bust counter
  const avatarUserId = String(user?.id || '').trim();
  const avatarUrlStorageKey = avatarUserId ? `avatar_url:${avatarUserId}` : null;
  const avatarVersionStorageKey = avatarUserId ? `avatar_v:${avatarUserId}` : null;

  // NEW: in-app camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Helper to build display src with cache-busting
  // const withVersion = (url?: string | null, v?: number) =>
  //   url && typeof url === 'string'
  //     ? `${url}${url.includes('?') ? '&' : '?'}v=${v ?? imgVersion}`
  //     : url;

  // Extract Cloudinary version (path like .../v1696000000/...)
  // const extractVersionFromUrl = (url?: string | null) => {
  //   if (!url) return 0;
  //   const m = url.match(/\/v(\d+)\//);
  //   return m ? Number(m[1]) : 0;
  // };

  // Hydrate from localStorage first (survives refresh), then fallback to prop
  // ONLY for the logged-in user's own card (disableImagePopup=false).
  // When viewing another player's card (disableImagePopup=true), always use the prop.
  useEffect(() => {
    if (disableImagePopup) {
      // Viewing another player — always use the profileImage prop
      if (profileImage) setImgUrl(profileImage);
      return;
    }
    if (typeof window !== 'undefined' && avatarUrlStorageKey && avatarVersionStorageKey) {
      const storedUrl = localStorage.getItem(avatarUrlStorageKey);
      const storedV = localStorage.getItem(avatarVersionStorageKey);
      if (storedUrl) {
        setImgUrl(storedUrl); // use latest known URL
      } else {
        setImgUrl(profileImage ?? null);
      }
      if (storedV) {
        setImgVersion(Number(storedV) || 0); // use latest cache buster
      } else {
        setImgVersion(0);
      }
    } else {
      setImgUrl(profileImage ?? null);
      setImgVersion(0);
    }
  }, [disableImagePopup, profileImage, avatarUrlStorageKey, avatarVersionStorageKey]);

  // When prop changes (e.g. after user fetch), update image URL.
  // For other players' cards (disableImagePopup=true), always use the prop directly.
  useEffect(() => {
    if (disableImagePopup) {
      // Viewing another player — always honour the prop
      if (profileImage) setImgUrl(profileImage);
    } else {
      const storedUrl =
        typeof window !== 'undefined' && avatarUrlStorageKey
          ? localStorage.getItem(avatarUrlStorageKey)
          : null;
      if (storedUrl) {
        setImgUrl(storedUrl);
      } else {
        setImgUrl(profileImage ?? null);
      }
    }

    // prefer persisted cache-buster; fallback to Cloudinary version in URL
    let v = 0;
    if (!disableImagePopup && typeof window !== 'undefined' && avatarVersionStorageKey) {
      const stored = localStorage.getItem(avatarVersionStorageKey);
      if (stored) v = Number(stored) || 0;
    }
    if (!v && profileImage) {
      const m = profileImage.match(/\/v(\d+)\//);
      if (m) v = Number(m[1]);
    }
    if (v) setImgVersion(v);
    else if (!disableImagePopup) setImgVersion(0);
  }, [profileImage, disableImagePopup, avatarUrlStorageKey, avatarVersionStorageKey]);

  // Auto-click the file input when the image modal opens
  // useEffect(() => {
  //   if (imgModalOpen) {
  //     // small delay to ensure the input is mounted
  //     setTimeout(() => fileInputRef.current?.click(), 150);
  //   }
  // }, [imgModalOpen]);

  // Click avatar to open picker directly
  const handleAvatarClick = () => {
    setImgModalOpen(true);
  };

  // Function to force image reload
  // const forceImageReload = (imageUrl: string) => {
  //   const timestamp = new Date().getTime();
  //   const newUrl = `${imageUrl}?t=${timestamp}`;
    
  //   // Clear browser cache for this image
  //   if ('caches' in window) {
  //     caches.keys().then(names => {
  //       names.forEach(name => {
  //         caches.delete(name);
  //       });
  //     });
  //   }
    
  //   return newUrl;
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const blobUrl = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreview(blobUrl);
      // Optimistically show the new image right away
      setImgUrl(blobUrl);
      setImgVersion(v => v + 1);
    }
  };

  // const handleEditIconClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   setEditOptionsOpen(true);
  // };

  const handleEditOptionsClose = () => setEditOptionsOpen(false);

  const handleUpdateOnlyImage = () => {
    setEditOptionsOpen(false);
    setImgModalOpen(true);
  };

  const openGalleryPicker = () => fileInputRef.current?.click();

  // NEW: open camera via getUserMedia
  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // attach stream to video
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (e) {
      console.error(e);
      toast.error('Camera is unavailable or permission denied.');
    }
  };

  const stopStream = () => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
    streamRef.current = null;
  };

  const handleCloseCamera = () => {
    stopStream();
    setCameraOpen(false);
  };

  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
      const blobUrl = URL.createObjectURL(blob);
      setImageFile(file);
      setImagePreview(blobUrl);
      setImgUrl(blobUrl);
      setImgVersion(v => v + 1);
      handleCloseCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleProfileUpdate = () => {
    window.location.href = '/profile';
  };

  const handleModalClose = () => {
    setImgModalOpen(false);
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);       // NEW: cleanup
    }
    setImagePreview(null);
  };

  const handleUploadImage = async () => {
    if (!imageFile || !token) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', imageFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) cacheManager.updatePlayersCache(data.user);

        const newUrl: string | undefined = data.user?.profilePicture;
        if (newUrl) {
          setImgUrl(newUrl);
          // persist so refresh uses the newest Cloudinary path
          if (typeof window !== 'undefined') {
            if (avatarUrlStorageKey) localStorage.setItem(avatarUrlStorageKey, newUrl);
            localStorage.removeItem('avatar_url');
          }
        }

        const bump = Number(data.cacheBuster) ||
          (typeof newUrl === 'string' ? Number(newUrl.match(/\/v(\d+)\//)?.[1] ?? 0) : 0) ||
          Date.now();
        setImgVersion(Number(bump));
        if (typeof window !== 'undefined') {
          if (avatarVersionStorageKey) localStorage.setItem(avatarVersionStorageKey, String(bump));
          localStorage.removeItem('avatar_v');
        }

        toast.success('Profile picture updated!');
        setImgModalOpen(false);
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!token) return;
    setUploading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data?.message || 'Failed to delete image');
        return;
      }

      if (data.user) cacheManager.updatePlayersCache(data.user);
      setImgUrl(null);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      const bump = Date.now();
      setImgVersion(bump);
      if (typeof window !== 'undefined') {
        if (avatarUrlStorageKey) localStorage.removeItem(avatarUrlStorageKey);
        if (avatarVersionStorageKey) localStorage.setItem(avatarVersionStorageKey, String(bump));
        localStorage.removeItem('avatar_url');
        localStorage.removeItem('avatar_v');
      }
      toast.success('Profile picture deleted!');
      setImgModalOpen(false);
    } catch (err) {
      console.error('Error deleting image:', err);
      toast.error('Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  // Build a safe src for <Image /> that is never undefined
  const displaySrc: string | null = imgUrl
    ? `${imgUrl}${imgUrl.includes('?') ? '&' : '?'}v=${imgVersion}`
    : null;

  const hasUserImage = Boolean(displaySrc);

  const avgSkill = calculateAverageSkill(stats);

  return (
    <Box
      sx={{
        width: width || 260,
        height: height || 390,
        position: 'relative',
        fontWeight: 'bold',
        color: '#fff',
        p: 0.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Inner wrapper keeps fill-images constrained even with padding */}
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Background Image */}
        <Image
          src={vectorImg}
          alt="Card Background"
          layout="fill"
          objectFit="cover"
          objectPosition="top center"
          className="z-0"
        />

        {/* Overlay Content */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            px: 2,
            py: 2,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            // mt:{md:0}
          }}
        >
        {/* Top: XP Points */}
        <Box sx={{ mt: 0.5 }}>
          <Typography fontWeight={'bold'} fontSize="18px" color={'#000'}>
            <span className='font-bold text-[16px]'> {points} xp </span>
          </Typography>
        </Box>

        {/* Centered Profile Avatar (circular) */}
        <Box
          sx={{
            mt: { xs: 0.5, md: 0.5 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 110,
              height: 110,
              border: `2px solid #fff`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disableImagePopup ? 'default' : 'pointer',
              overflow: 'hidden',
            }}
            onClick={disableImagePopup ? undefined : handleAvatarClick}
          >
            <Avatar
              key={`avatar-${imgVersion}`}
              variant="circular"
              sx={{
                width: 105,
                height: 105,
                p: 0,
                bgcolor: hasUserImage ? 'transparent' : avatarBg,
                color: '#fff',
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
              data-testid="profile-avatar"
            >
              {displaySrc ? (
                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src={displaySrc}
                    alt="Profile"
                    fill
                    sizes="105px"
                    unoptimized
                    priority={false}
                    style={{ objectFit: 'cover', imageRendering: 'auto' }}
                  />
                </Box>
              ) : (
                avatarInitials
              )}
            </Avatar>
          </Box>
        </Box>

        {/* Position + Foot info inline below avatar, above name */}
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            width: '100%',
            maxWidth: 250
          }}
        >
          {/* Star - LEFT */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.5 }}>
          <XPStarMilestoneCard height={24} width={24} xp={points} />
            {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="#009371">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg> */}
          </Box>

          {/* Position - CENTER */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#000'}>
              {getPositionShortForm(position)}
            </Typography>
          </Box>

          {/* Foot - RIGHT */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3 }}>
            <Image
              src={Foot}
              alt="Foot"
              width={29}
              height={12}
              style={{
                filter: 'brightness(0) saturate(100%)',
                transform: isRightFoot ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            />
            <Typography fontSize="14px" fontWeight={'bold'} color={'#000'}>{footLabel}</Typography>
          </Box>
        </Box>

        {/* Name and Title (from static logic) */}
        <Box sx={{ mt: disableImagePopup ? 1 : 2, mb: disableImagePopup ? 0.9 : 0.5 }}>
          <Typography
            fontSize="14px"
            fontWeight="bold"
            sx={{ textTransform: 'uppercase' }}
            color="#000"
          >
            {displayCardName}
          </Typography>
          {/* <Typography fontSize="12px" fontWeight={'bold'} color="#000">{title}</Typography> */}
        </Box>

        <Typography
          fontSize="16px"
          fontWeight="bold"
          color="#fff"
          sx={{
            mt: { xs: 0.45, sm: disableImagePopup ? 1.05 : 0.5 },
            mb: 0.5,
            lineHeight: 1
          }}
        >
          {avgSkill}
        </Typography>

        {/* Stats */}
        <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
          {/* Left Side Stats */}
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#fff'}>{stats?.DRI} DRI</Typography>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#fff'}>{stats?.SHO} SHO</Typography>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#fff'}>{stats?.PAS} PAS</Typography>
          </Box>

          {/* Vertical Line */}
          <Box
            sx={{
              width: '1px',
              height: '80px',
              bgcolor: '#fff',
              mx: 1,
            }}
          />

          {/* Right Side Stats */}
          <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1}>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#fff'}>{stats?.PAC} PAC</Typography>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#fff'}>{stats?.DEF} DEF</Typography>
            <Typography fontSize="14px" fontWeight={'bold'} color={'#fff'}>{stats?.PHY} PHY</Typography>
          </Box>
        </Box>

        {/* Bottom Divider */}
        <Divider
          sx={{
            bgcolor: '#fff',
            width: '30%',
            mx: 'auto',
            mt: 0.5,
            height: '1px',
          }}
        />
        {/* Render children (e.g. vote button) at the bottom */}
        {children && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            {children}
          </Box>
        )}
        </Box>

        {/* Share Icon - Bottom Right Corner */}
        {!hideShareIcon && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: disableImagePopup ? 6 : 8,
              right: disableImagePopup ? 6 : -115,
              zIndex: 20,
              bgcolor: '#009371',
              color: '#fff',
              width: 36,
              height: 36,
              borderRadius: '4px',
              '&:hover': {
                bgcolor: '#007a5e',
              },
            }}
            onClick={() => {
              // Share functionality here
              if (navigator.share) {
                navigator.share({
                  title: `${name} - Champion Footballer`,
                  text: `Check out ${name}'s stats! ${points} XP`,
                }).catch(() => {});
              } else {
                toast.success('Share feature coming soon!');
              }
            }}
          >
            <ShareIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Edit Options Modal */}
      <Modal open={editOptionsOpen} onClose={handleEditOptionsClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            minWidth: 300,
            border: '2px solid #1976d2',
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 3, textAlign: 'center', color: '#1976d2' }}>
            Edit Profile
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              onClick={handleUpdateOnlyImage}
              sx={{ 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              Update Only Image
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary" 
              onClick={handleProfileUpdate}
              sx={{ 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              Edit Full Profile
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Image Upload Modal */}
      <Modal open={imgModalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#1f1f1f',
            color: '#fff',
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            width: 'min(420px, 92vw)',
            minWidth: 'auto',
            maxHeight: '92vh',
            overflowY: 'auto',
            border: `1px solid ${popupBorder}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 1.2, fontWeight: 800 }}>
            Update Profile Image
          </Typography>
          <Typography sx={{ mb: 2.2, fontSize: 14, color: popupTextMuted }}>
            Choose how you want to add your photo.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mb: 2.2 }}>
            <Button
              variant="contained"
              onClick={handleOpenCamera}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: popupGradient,
              }}
            >
              Take a new photo
            </Button>
            <Button
              variant="outlined"
              onClick={openGalleryPicker}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: popupPrimary,
                color: '#fff',
                '&:hover': { borderColor: popupPrimary, background: 'rgba(0,167,127,0.18)' }
              }}
            >
              Upload a new photo
            </Button>
          </Stack>
          {hasUserImage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5, mb: 2.2 }}>
              <Button
                variant="outlined"
                onClick={handleDeleteImage}
                disabled={uploading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#d32f2f',
                  color: '#ff6b6b',
                  '&:hover': { borderColor: '#d32f2f', background: 'rgba(211,47,47,0.12)' }
                }}
              >
                Delete image
              </Button>
            </Box>
          )}

          {/* Hidden inputs: camera (fallback) and gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {imagePreview && (
            <Box sx={{ mb: 2.2, textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: 132,
                  height: 132,
                  objectFit: 'cover',
                  borderRadius: '10px',
                  border: `2px solid ${popupPrimary}`
                }}
              />
            </Box>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            sx={{ '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } } }}
          >
            <Button
              onClick={handleUploadImage}
              disabled={uploading || !imageFile}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: popupGradient,
              }}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              onClick={handleModalClose}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: popupPrimary,
                color: '#fff',
                '&:hover': { borderColor: popupPrimary, background: 'rgba(0,167,127,0.18)' }
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* NEW: In-app Camera Modal */}
      <Modal open={cameraOpen} onClose={handleCloseCamera}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#1f1f1f',
            color: '#fff',
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            width: 'min(460px, 92vw)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${popupBorder}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
            Camera
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: { xs: '4 / 5', sm: '3 / 4' },
              maxHeight: 'min(62vh, 560px)',
              bgcolor: '#000',
              mb: 2,
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
            />
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            sx={{ '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } } }}
          >
            <Button
              onClick={handleTakePhoto}
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 700, background: popupGradient }}
            >
              Capture
            </Button>
            <Button
              onClick={handleCloseCamera}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: popupPrimary,
                color: '#fff',
                '&:hover': { borderColor: popupPrimary, background: 'rgba(0,167,127,0.18)' }
              }}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default PlayerCard;















// import React, { useState, useEffect, useRef } from 'react';
// import Image, { StaticImageData } from 'next/image';
// import {
//   Box,
//   Typography,
//   Avatar,
//   Divider,
//   Modal,
//   Button,
// } from '@mui/material';
// import Foot from '@/Components/images/foot.png'
// import imgicon from '@/Components/images/imgicon.png'
// import EditIcon from '@mui/icons-material/Edit';
// import IconButton from '@mui/material/IconButton';
// import { cacheManager } from "@/lib/cacheManager"
// import toast from 'react-hot-toast';
// import { useAuth } from '@/lib/hooks';

// // const fallback = '/assets/cflogo2.png';

// // Static mapping for levels, milestone titles, colors, and point ranges
// const LEVELS = [
//   { level: 1, min: 0, max: 100, title: "Rookie", color: "Green" },
//   { level: 2, min: 100, max: 250, title: "The Prospect", color: "Green" },
//   { level: 3, min: 250, max: 500, title: "Rising Star", color: "Green" },
//   { level: 4, min: 500, max: 1000, title: "The Skilled Player", color: "Blue" },
//   { level: 5, min: 1000, max: 2000, title: "The Talented Player", color: "Blue" },
//   { level: 6, min: 2000, max: 3000, title: "The Chosen One", color: "Blue" },
//   { level: 7, min: 3000, max: 4000, title: "Serial Winner", color: "Blue" },
//   { level: 8, min: 4000, max: 5000, title: "Supreme Player", color: "Bronze" },
//   { level: 9, min: 5000, max: 6000, title: "The Invincible", color: "Bronze" },
//   { level: 10, min: 6000, max: 7000, title: "The Maestro", color: "Bronze" },
//   { level: 11, min: 7000, max: 8000, title: "Crème de la Crème", color: "Bronze" },
//   { level: 12, min: 8000, max: 9000, title: "Elite", color: "Silver" },
//   { level: 13, min: 9000, max: 10000, title: "World-Class", color: "Silver" },
//   { level: 14, min: 10000, max: 12000, title: "The Undisputed", color: "Silver" },
//   { level: 15, min: 12000, max: 15000, title: "Icon", color: "Silver" },
//   { level: 16, min: 15000, max: 18000, title: "Generational Talent", color: "Gold" },
//   { level: 17, min: 18000, max: 22000, title: "Legend of the Game", color: "Gold" },
//   { level: 18, min: 22000, max: 25000, title: "Football Royalty", color: "Gold" },
//   { level: 19, min: 25000, max: 30000, title: "Hall of Famer", color: "Gold" },
//   { level: 20, min: 30000, max: Infinity, title: "Champion Footballer", color: "Black" },
// ];

// function getLevelInfo(points: number) {
//   return LEVELS.find(lvl => points >= lvl.min && points < lvl.max) || LEVELS[LEVELS.length - 1];
// }

// // Function to convert position to short form
// function getPositionShortForm(position: string): string {
//   // First try to extract from parentheses
//   const match = position.match(/\(([^)]+)\)/);
//   if (match) {
//     return match[1]; // Return the text inside parentheses
//   }
  
//   // If no parentheses, check for common position patterns
//   const positionMap: Record<string, string> = {
//     'Center-Back (CB)': 'CB',
//     'Right-Back (RB)': 'RB',
//     'Left-Back (LB)': 'LB',
//     'Right Wing-back (RWB)': 'RWB',
//     'Left Wing-back (LWB)': 'LWB',
//     'Central Midfielder (CM)': 'CM',
//     'Defensive Midfielder (CDM)': 'CDM',
//     'Attacking Midfielder (CAM)': 'CAM',
//     'Right Midfielder (RM)': 'RM',
//     'Left Midfielder (LM)': 'LM',
//     'Striker (ST)': 'ST',
//     'Center Forward (CF)': 'CF',
//     'Right Forward (RF)': 'RF',
//     'Left Forward (LF)': 'LF',
//     'Right Winger (RW)': 'RW',
//     'Left Winger (LW)': 'LW',
//     'goalkeeper': 'GK',
//   };
  
//   const lowerPosition = position.toLowerCase();
//   if (positionMap[lowerPosition]) {
//     return positionMap[lowerPosition];
//   }
  
//   // Final fallback: return first 3 characters in uppercase
//   return position.toUpperCase().substring(0, 3);
// }

// // Function to calculate average skill (simple mean, 0–99 clamp)
// function calculateAverageSkill(stats: {
//   DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string;
// }): number {
//   const keys = ['DRI','SHO','PAS','PAC','DEF','PHY'] as const;
//   const values = keys.map(k => {
//     const n = parseInt(stats[k], 10); // Removed as any, k is keyof stats
//     return Number.isFinite(n) ? Math.max(0, Math.min(99, n)) : 0;
//   });
//   const sum = values.reduce((a, b) => a + b, 0);
//   return Math.round(sum / values.length);
// }

// // Backward-compat: old function now returns the average number (not a percent)
// function calculateSkillsPercentage(stats: {
//   DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string;
// }): number {
//   return calculateAverageSkill(stats);
// }

// interface PlayerCardProps {
//   name: string;
//   number: string;
//   points: number;
//   stats: { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string };
//   foot: string;
//   shirtIcon: string;
//   profileImage?: string;
//   children?: React.ReactNode;
//   width?: number | string;
//   height?: number | string;
//   position: string;
//   hideEditIcon?: boolean; // NEW
// }

// // Import all possible vector images
// import vectorGreen from '@/Components/images/green.svg';
// import vectorBlue from '@/Components/images/sky.svg';
// import vectorBronze from '@/Components/images/brown.svg';
// import vectorSilver from '@/Components/images/silver.svg';
// import vectorGold from '@/Components/images/golden.svg';
// import vectorBlack from '@/Components/images/goat.png';
// import vectorDefault from '@/Components/images/green.svg';
// import vectorImg from '@/Components/images/Vector.svg'

// const vectorMap: Record<string, StaticImageData> = {
//   Green: vectorGreen,
//   Blue: vectorBlue,
//   Bronze: vectorBronze,
//   Silver: vectorSilver,
//   Gold: vectorGold,
//   Black: vectorBlack,
// };

// const PlayerCard = ({
//   name,
//   points,
//   foot,
//   stats,
//   profileImage,
//   children,
//   width,
//   height,
//   position,
//   hideEditIcon = false,
// }: PlayerCardProps) => {
//   // Find the level info based on points
//   const levelInfo = getLevelInfo(points);
//   const { title, color } = levelInfo;
//   // Pick the correct vector image based on color
//   const Title = vectorMap[color] || vectorDefault;
  
//   // State management
//   const [imgModalOpen, setImgModalOpen] = useState(false);
//   const [editOptionsOpen, setEditOptionsOpen] = useState(false);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [imgUrl, setImgUrl] = useState<string | null>(profileImage ?? null);
//   // const [imgVersion, setImgVersion] = useState(0);
//   const { token } = useAuth();
//   const fileInputRef = useRef<HTMLInputElement | null>(null);     // gallery picker
//   const cameraInputRef = useRef<HTMLInputElement | null>(null);   // camera picker
//   const [imgVersion, setImgVersion] = useState(0);                // NEW: cache-bust counter

//   // Helper to build display src with cache-busting
//   const withVersion = (url?: string | null, v?: number) =>
//     url && typeof url === 'string'
//       ? `${url}${url.includes('?') ? '&' : '?'}v=${v ?? imgVersion}`
//       : url;

//   // Extract Cloudinary version (path like .../v1696000000/...)
//   const extractVersionFromUrl = (url?: string | null) => {
//     if (!url) return 0;
//     const m = url.match(/\/v(\d+)\//);
//     return m ? Number(m[1]) : 0;
//   };

//   // Hydrate from localStorage first (survives refresh), then fallback to prop
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedUrl = localStorage.getItem('avatar_url');
//       const storedV = localStorage.getItem('avatar_v');
//       if (storedUrl) setImgUrl(storedUrl);             // use latest known URL
//       if (storedV) setImgVersion(Number(storedV) || 0); // use latest cache buster
//     }
//   }, []);

//   // When prop changes (e.g. after user fetch), only set if we don't have a storedUrl
//   useEffect(() => {
//     const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('avatar_url') : null;
//     if (!storedUrl && profileImage) setImgUrl(profileImage);

//     // prefer persisted cache-buster; fallback to Cloudinary version in URL
//     let v = 0;
//     if (typeof window !== 'undefined') {
//       const stored = localStorage.getItem('avatar_v');
//       if (stored) v = Number(stored) || 0;
//     }
//     if (!v && profileImage) {
//       const m = profileImage.match(/\/v(\d+)\//);
//       if (m) v = Number(m[1]);
//     }
//     if (v) setImgVersion(v);
//   }, [profileImage]);

//   // Auto-click the file input when the image modal opens
//   // useEffect(() => {
//   //   if (imgModalOpen) {
//   //     // small delay to ensure the input is mounted
//   //     setTimeout(() => fileInputRef.current?.click(), 150);
//   //   }
//   // }, [imgModalOpen]);

//   // Click avatar to open picker directly
//   const handleAvatarClick = () => {
//     setImgModalOpen(true);
//   };

//   // Function to force image reload
//   // const forceImageReload = (imageUrl: string) => {
//   //   const timestamp = new Date().getTime();
//   //   const newUrl = `${imageUrl}?t=${timestamp}`;
    
//   //   // Clear browser cache for this image
//   //   if ('caches' in window) {
//   //     caches.keys().then(names => {
//   //       names.forEach(name => {
//   //         caches.delete(name);
//   //       });
//   //     });
//   //   }
    
//   //   return newUrl;
//   // };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       const blobUrl = URL.createObjectURL(file);
//       setImageFile(file);
//       setImagePreview(blobUrl);
//       // Optimistically show the new image right away
//       setImgUrl(blobUrl);
//       setImgVersion(v => v + 1);
//     }
//   };

//   const handleEditIconClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setEditOptionsOpen(true);
//   };

//   const handleEditOptionsClose = () => setEditOptionsOpen(false);

  // const handleUpdateOnlyImage = () => {
  //   setEditOptionsOpen(false);
  //   setImgModalOpen(true);
  // };

  // const openGalleryPicker = () => fileInputRef.current?.click();
  // const openCameraPicker = () => cameraInputRef.current?.click();

//   const handleProfileUpdate = () => {
//     window.location.href = '/profile';
//   };

  // const handleModalClose = () => {
  //   setImgModalOpen(false);
  //   setImageFile(null);
  //   if (imagePreview) {
  //     URL.revokeObjectURL(imagePreview);       // NEW: cleanup
  //   }
  //   setImagePreview(null);
  // };

  // const handleUploadImage = async () => {
  //   if (!imageFile || !token) return;
  //   setUploading(true);
  //   const formData = new FormData();
  //   formData.append('profilePicture', imageFile);

    // try {
    //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${token}` },
    //     body: formData,
    //     cache: 'no-store',
    //   });
    //   const data = await res.json();
    //   if (data.success) {
    //     if (data.user) cacheManager.updatePlayersCache(data.user);

        // const newUrl: string | undefined = data.user?.profilePicture;
        // if (newUrl) {
        //   setImgUrl(newUrl);
        //   // persist so refresh uses the newest Cloudinary path
        //   if (typeof window !== 'undefined') {
        //     localStorage.setItem('avatar_url', newUrl);
        //   }
        // }

        // const bump = Number(data.cacheBuster) ||
        //   (typeof newUrl === 'string' ? Number(newUrl.match(/\/v(\d+)\//)?.[1] ?? 0) : 0) ||
        //   Date.now();
        // setImgVersion(Number(bump));
        // if (typeof window !== 'undefined') {
        //   localStorage.setItem('avatar_v', String(bump));
        // }

  //       toast.success('Profile picture updated!');
  //       setImgModalOpen(false);
  //     } else {
  //       toast.error('Failed to upload image');
  //     }
  //   } catch (err) {
  //     console.error('Error uploading image:', err);
  //     toast.error('Failed to upload image');
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  // Build a safe src for <Image /> that is never undefined
  // const displaySrc: string | StaticImageData = imgUrl
  //   ? `${imgUrl}${imgUrl.includes('?') ? '&' : '?'}v=${imgVersion}`
  //   : imgicon;

  // const avgSkill = calculateAverageSkill(stats);

  // return (
  //   <Box
  //     sx={{
  //       width: width || 260,
  //       height: height || 380,
  //       position: 'relative',
  //       fontWeight: 'bold',
  //       color: '#fff',
  //     }}
  //   >
  //     {/* Background Image */}
  //     <Image
  //       src={vectorImg}
  //       alt="Card Background"
  //       layout="fill"
  //       objectFit="contain"
  //       className="z-0"
  //     />

      // {/* Overlay Content */}
      // <Box
      //   sx={{
      //     position: 'absolute',
      //     inset: 0,
      //     zIndex: 10,
      //     px: 2,
      //     py: 2,
      //     textAlign: 'center',
      //     display: 'flex',
      //     flexDirection: 'column',
      //     color: '#fff',
      //     // mt:{md:0}
      //   }}
      // >
      //   {/* Top: Shirt Number */}
      //   <Box sx={{ mt: 1 }}>
      //     <Typography fontWeight={'bold'} fontSize="18px" color={'#fff'}>
      //       <span className='font-bold text-[22px]'> {points} xp </span>
      //     </Typography>
      //   </Box>

        // <Box
        //   display="flex"
        //   justifyContent="space-between"
        //   alignItems="flex-start"
        //   px={2}
        //  sx={{mt:{xs:2,sm:2,md:2}}} 
        // >
        //   {/* Left: Number, XXX, Foot */}
        //   <Box sx={{ mt: 0.5, mb: 1 }} textAlign="left">
        //     <Image
        //       src={Title}
        //       alt="Shoe"
        //       width={22}
        //       height={10}
        //       style={{ marginLeft: '7px' }}
        //     />
        //     <Divider sx={{ bgcolor: '#fff'}}/>
        //     <Typography fontSize="15px" fontWeight={'bold'} justifyContent={'center'} textAlign={'center'} color={'#fff'}>
        //       {getPositionShortForm(position)}
        //     </Typography>
        //     <Divider sx={{ bgcolor: '#fff'}}/>
        //     <Box
        //       display="flex"
        //       alignItems="center"
        //       gap={0.5}
        //       mt={0.5}
        //     >
        //       <Box sx={{ display: 'inline-block', verticalAlign: 'middle' }}>
        //         <Image
        //           src={Foot}
        //           alt="Shoe"
        //           width={22}
        //           height={10}
        //         />
        //       </Box>
        //       <Typography fontSize="16px" fontWeight={'bold'} color={'#fff'}>{foot}</Typography>
        //     </Box>
        //   </Box>

          // {/* Right: Avatar with edit icon */}
          // <Box
          //   sx={{
          //     position: 'relative',
          //     width: 100,
          //     height: 100,
          //     border: `2px solid #fff`,
          //     borderRadius: '10px',
          //     display: 'flex',
          //     alignItems: 'center',
          //     justifyContent: 'center',
          //     cursor: 'pointer', // NEW
          //   }}
          //   onClick={handleAvatarClick} // NEW
          // >
          //   <div style={{ position: 'relative', display: 'inline-block' }}>
          //     {/* FIX: unified image (no blur) using Next Image with fill instead of width/height 0 */}
          //     <Avatar
          //       key={`avatar-${imgVersion}`}   // ensure rerender without undefined
          //       variant="square"
          //       sx={{
          //         width: 85,
          //         height: 85,
          //         borderRadius: 0,
          //         // overflow: 'hidden',
          //         p: 0
          //       }}
          //       data-testid="profile-avatar"
          //     >
          //       <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          //         <Image
          //           src={displaySrc}
          //           alt="Profile"
          //           fill
          //           sizes="85px"
          //           unoptimized // NEW: bypass Next image cache for avatars
          //           priority={!imgUrl}
          //           style={{ objectFit: 'cover', imageRendering: 'auto' }}
          //         />
          //       </Box>
          //     </Avatar>

        //       {/* Show edit icon only if not hidden */}
        //       {/* {!hideEditIcon && (
        //         <IconButton
        //           size="small"
        //           onClick={handleEditIconClick}
        //           style={{
        //             position: 'absolute',
        //             bottom: 4,
        //             right: -8,
        //             background: '#fff',
        //             boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        //             top: -13,
        //             height: 20,
        //             width: 20
        //           }}
        //           aria-label="edit profile image"
        //         >
        //           <EditIcon fontSize="small" />
        //         </IconButton>
        //       )} */}
        //     </div>
        //   </Box>
          
        // </Box>

        // {/* Name and Title (from static logic) */}
        // <Box sx={{ mt: {xs:0,sm:0,md:2 }}}>
        //   <Typography
        //     fontSize="18px"
        //     fontWeight="bold"
        //     sx={{ textTransform: 'uppercase' }}
        //     color='#fff'
        //   >
        //       {avgSkill < 60 && (
        //         <>
        //         {avgSkill}
        //       </>
        //     )} {name}
        //   </Typography>
        //   <Typography fontSize="12px" fontWeight={'bold'} color={'#fff'}>{title}</Typography>
        // </Box>

        // {/* Divider */}
        // <Divider
        //   sx={{
        //     bgcolor: '#fff',
        //     width: '50%',
        //     mx: 'auto',
        //     my: 1,
        //     height: '1px',
        //   }}
        // />

//         {/* Stats */}
//         <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
//           {/* Left Side Stats */}
//           <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
//             <Typography fontSize="14px" color={'#fff'}>{stats?.DRI} DRI</Typography>
//             <Typography fontSize="14px" color={'#fff'}>{stats?.SHO} SHO</Typography>
//             <Typography fontSize="14px" color={'#fff'}>{stats?.PAS} PAS</Typography>
//           </Box>

//           {/* Vertical Line */}
//           <Box
//             sx={{
//               width: '1px',
//               height: '80px',
//               bgcolor: '#fff',
//               mx: 1,
//             }}
//           />

//           {/* Right Side Stats */}
//           <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1}>
//             <Typography fontSize="14px" color={'#fff'}>{stats?.PAC} PAC</Typography>
//             <Typography fontSize="14px" color={'#fff'}>{stats?.DEF} DEF</Typography>
//             <Typography fontSize="14px" color={'#fff'}>{stats?.PHY} PHY</Typography>
//           </Box>
//         </Box>

//         {/* Bottom Divider */}
//         <Divider
//           sx={{
//             bgcolor: '#fff',
//             width: '30%',
//             mx: 'auto',
//             mt: 0.5,
//             height: '1px',
//           }}
//         />
//         <span className='text-[20px] mt-1' style={{ color: '#fff' }}>
//        {avgSkill >= 60 && (
//       <>
//             {avgSkill}
//       </>
//       )}
//         </span>
//         {/* Render children (e.g. vote button) at the bottom */}
//         {children && (
//           <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
//             {children}
//           </Box>
//         )}
//       </Box>

//       {/* Edit Options Modal */}
//       <Modal open={editOptionsOpen} onClose={handleEditOptionsClose}>
//         <Box
//           sx={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             bgcolor: 'background.paper',
//             boxShadow: 24,
//             p: 4,
//             borderRadius: 2,
//             minWidth: 300,
//             border: '2px solid #1976d2',
//           }}
//         >
//           <Typography variant="h6" component="h2" sx={{ mb: 3, textAlign: 'center', color: '#1976d2' }}>
//             Edit Profile
//           </Typography>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//             <Button 
//               fullWidth 
//               variant="contained" 
//               color="primary" 
//               onClick={handleUpdateOnlyImage}
//               sx={{ 
//                 py: 1.5,
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//                 textTransform: 'none'
//               }}
//             >
//               Update Only Image
//             </Button>
//             <Button 
//               fullWidth 
//               variant="outlined" 
//               color="primary" 
//               onClick={handleProfileUpdate}
//               sx={{ 
//                 py: 1.5,
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//                 textTransform: 'none'
//               }}
//             >
//               Edit Full Profile
//             </Button>
//           </Box>
//         </Box>
//       </Modal>

//       {/* Image Upload Modal */}
//       <Modal open={imgModalOpen} onClose={handleModalClose}>
//         <Box
//           sx={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             bgcolor: 'background.paper',
//             boxShadow: 24,
//             p: 4,
//             borderRadius: 2,
//             minWidth: 350,
//             border: '2px solid #1976d2',
//           }}
//         >
//           <Typography variant="h6" component="h2" sx={{ mb: 1.5, textAlign: 'center', color: '#1976d2' }}>
//             Update Profile Image
//           </Typography>

//           <Typography sx={{ mb: 2, fontSize: 14, color: 'text.secondary', textAlign: 'center' }}>
//             Choose how you want to add your photo.
//           </Typography>

//           {/* Option buttons */}
//           <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={openCameraPicker}
//               sx={{ textTransform: 'none', fontWeight: 'bold' }}
//             >
//               Take a new photo
//             </Button>
//             <Button
//               variant="outlined"
//               color="primary"
//               onClick={openGalleryPicker}
//               sx={{ textTransform: 'none', fontWeight: 'bold' }}
//             >
//               Upload a new photo
//             </Button>
//           </Box>

//           {/* Hidden inputs: camera and gallery */}
//           <input
//             ref={cameraInputRef}
//             type="file"
//             accept="image/*"
//             capture="user"
//             onChange={handleFileChange}
//             style={{ display: 'none' }}
//           />
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             onChange={handleFileChange}
//             style={{ display: 'none' }}
//           />

//           {imagePreview && (
//             <Box sx={{ mb: 3, textAlign: 'center' }}>
//               <img
//                 src={imagePreview}
//                 alt="Preview"
//                 style={{
//                   width: 120,
//                   height: 120,
//                   objectFit: 'cover',
//                   borderRadius: '8px',
//                   border: '2px solid #1976d2'
//                 }}
//               />
//             </Box>
//           )}

//           <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
//             <Button
//               onClick={handleUploadImage}
//               disabled={uploading || !imageFile}
//               variant="contained"
//               color="primary"
//               sx={{
//                 px: 3,
//                 py: 1.5,
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//                 textTransform: 'none'
//               }}
//             >
//               {uploading ? 'Uploading...' : 'Upload'}
//             </Button>
//             <Button
//               onClick={handleModalClose}
//               variant="outlined"
//               color="primary"
//               sx={{
//                 px: 3,
//                 py: 1.5,
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//                 textTransform: 'none'
//               }}
//             >
//               Cancel
//             </Button>
//           </Box>
//         </Box>
//       </Modal>

//       {/* NEW: In-app Camera Modal */}
//       <Modal open={cameraOpen} onClose={handleCloseCamera}>
//         <Box
//           sx={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             bgcolor: 'background.paper',
//             boxShadow: 24,
//             p: 2,
//             borderRadius: 2,
//             width: 360,
//             maxWidth: '90vw',
//             border: '2px solid #1976d2',
//           }}
//         >
//           <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center', color: '#1976d2' }}>
//             Camera
//           </Typography>
//           <Box sx={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', bgcolor: '#000', mb: 2 }}>
//             <video
//               ref={videoRef}
//               playsInline
//               autoPlay
//               muted
//               style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
//             />
//           </Box>
//           <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
//             <Button onClick={handleTakePhoto} variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
//               Capture
//             </Button>
//             <Button onClick={handleCloseCamera} variant="outlined" color="primary" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
//               Close
//             </Button>
//           </Box>
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default PlayerCard;
