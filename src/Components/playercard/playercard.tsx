import React, { useState, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Modal,
  Button,
} from '@mui/material';
import Foot from '@/Components/images/foot.png'
import imgicon from '@/Components/images/imgicon.png'
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import { cacheManager } from "@/lib/cacheManager"
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks';

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

// Function to calculate skills percentage
function calculateSkillsPercentage(stats: {
  DRI: string;
  SHO: string;
  PAS: string;
  PAC: string;
  DEF: string;
  PHY: string;
}): number {
  const skills = [
    parseInt(stats.DRI) || 50,
    parseInt(stats.SHO) || 50,
    parseInt(stats.PAS) || 50,
    parseInt(stats.PAC) || 50,
    parseInt(stats.DEF) || 50,
    parseInt(stats.PHY) || 50
  ];
  
  const total = skills.reduce((sum, skill) => sum + skill, 0);
  const average = total / skills.length;
  
  // Convert to percentage (assuming max skill value is 99)
  return Math.round((average / 99) * 100);
}

interface PlayerCardProps {
  name: string;
  number: string;
  points: number; // Now only pass points
  stats: {
    DRI: string;
    SHO: string;
    PAS: string;
    PAC: string;
    DEF: string;
    PHY: string;
  };
  foot: string;
  shirtIcon: string;
  profileImage?: string;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  position: string;
}

// Import all possible vector images
import vectorGreen from '@/Components/images/green.svg';
import vectorBlue from '@/Components/images/sky.svg';
import vectorBronze from '@/Components/images/brown.svg';
import vectorSilver from '@/Components/images/silver.svg';
import vectorGold from '@/Components/images/golden.svg';
import vectorBlack from '@/Components/images/Vector.svg';
import vectorDefault from '@/Components/images/green.svg';
import vectorImg from '@/Components/images/Vector.svg'

const vectorMap: Record<string, StaticImageData> = {
  Green: vectorGreen,
  Blue: vectorBlue,
  Bronze: vectorBronze,
  Silver: vectorSilver,
  Gold: vectorGold,
  Black: vectorBlack,
};

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
}: PlayerCardProps) => {
  // Find the level info based on points
  const levelInfo = getLevelInfo(points);
  const { title, color } = levelInfo;
  // Pick the correct vector image based on color
  const Title = vectorMap[color] || vectorDefault;
  
  // State management
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [editOptionsOpen, setEditOptionsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState(profileImage);
  const [imageKey,] = useState(0); // Add key for forcing re-render
  const { token } = useAuth();

  // Update imgUrl when profileImage prop changes
  useEffect(() => {
    if (profileImage) {
      setImgUrl(profileImage);
    }
  }, [profileImage]);

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
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleEditIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditOptionsOpen(true);
  };

  const handleEditOptionsClose = () => setEditOptionsOpen(false);

  const handleUpdateOnlyImage = () => {
    setEditOptionsOpen(false);
    setImgModalOpen(true);
  };

  const handleProfileUpdate = () => {
    window.location.href = '/profile';
  };

  const handleModalClose = () => {
    setImgModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleUploadImage = async () => {
    if (!imageFile || !token) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append("profilePicture", imageFile);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      
      const data = await res.json()
      if (data.success) {
        // Update cache with new user data
        if (data.user) {
          cacheManager.updatePlayersCache(data.user);
        }
        toast.success("Profile picture updated!")
        window.location.reload()
      } else {
        toast.error("Failed to upload image")
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      sx={{
        width: width || 260,
        height: height || 400,
        position: 'relative',
        fontWeight: 'bold',
        color: '#fff',
        ml: 20,
      }}
    >
      {/* Background Image */}
      <Image
        src={vectorImg}
        alt="Card Background"
        layout="fill"
        objectFit="contain"
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
        }}
      >
        {/* Top: Shirt Number */}
        <Box sx={{ mt: 1 }}>
          <Typography fontWeight={'bold'} fontSize="15px" color={'#fff'}>
            <span className='font-bold text-[22px]'> {points} xp </span>
          </Typography>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          px={2}
          mt={2}
        >
          {/* Left: Number, XXX, Foot */}
          <Box sx={{ mt: 0.5, mb: 1 }} textAlign="left">
            <Image
              src={Title}
              alt="Shoe"
              width={22}
              height={10}
              style={{ marginLeft: '7px' }}
            />
            <Divider sx={{ bgcolor: '#fff'}}/>
            <Typography fontSize="15px" fontWeight={'bold'} justifyContent={'center'} textAlign={'center'} color={'#fff'}>
              {getPositionShortForm(position)}
            </Typography>
            <Divider sx={{ bgcolor: '#fff'}}/>
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              mt={0.5}
            >
              <Box sx={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <Image
                  src={Foot}
                  alt="Shoe"
                  width={22}
                  height={10}
                />
              </Box>
              <Typography fontSize="16px" fontWeight={'bold'} color={'#fff'}>{foot}</Typography>
            </Box>
          </Box>

          {/* Right: Avatar with edit icon */}
          <Box
            sx={{
              position: 'relative',
              width: 100,
              height: 100,
              border: `2px solid ${'#fff'}`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                key={`${imgUrl}-${imageKey}`} // Force complete re-render when image changes
                src={imgUrl || undefined}
                sx={{ width: 85, height: 85, borderRadius: '0' }}
                alt="Profile"
                data-testid="profile-avatar"
              >
                {(!imgUrl || typeof imgUrl !== 'string') && (
                  <Image height={0} width={0} src={imgicon.src} alt="Profile" style={{ width: '100%', height: '100%' }} />
                )}
              </Avatar>
              <IconButton
                size="small"
                onClick={handleEditIconClick}
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: -8,
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  top: -13,
                  height: 20,
                  width: 20,
                }}
                aria-label="edit profile image"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </div>
          </Box>
        </Box>

        {/* Name and Title (from static logic) */}
        <Box sx={{ mt: 2 }}>
          <Typography
            fontSize="18px"
            fontWeight="bold"
            sx={{ textTransform: 'uppercase' }}
            color='#fff'
          >
            {calculateSkillsPercentage(stats)} {name}
          </Typography>
          <Typography fontSize="12px" fontWeight={'bold'} color={'#fff'}>{title}</Typography>
        </Box>

        {/* Divider */}
        <Divider
          sx={{
            bgcolor: '#fff',
            width: '50%',
            mx: 'auto',
            my: 1,
            height: '1px',
          }}
        />

        {/* Stats */}
        <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
          {/* Left Side Stats */}
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
            <Typography fontSize="14px" color={'#fff'}>{stats?.DRI} DRI</Typography>
            <Typography fontSize="14px" color={'#fff'}>{stats?.SHO} SHO</Typography>
            <Typography fontSize="14px" color={'#fff'}>{stats?.PAS} PAS</Typography>
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
            <Typography fontSize="14px" color={'#fff'}>{stats?.PAC} PAC</Typography>
            <Typography fontSize="14px" color={'#fff'}>{stats?.DEF} DEF</Typography>
            <Typography fontSize="14px" color={'#fff'}>{stats?.PHY} PHY</Typography>
          </Box>
        </Box>

        {/* Bottom Divider */}
        <Divider
          sx={{
            bgcolor: '#fff',
            width: '30%',
            mx: 'auto',
            mt: 2,
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
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            minWidth: 350,
            border: '2px solid #1976d2',
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 3, textAlign: 'center', color: '#1976d2' }}>
            Update Profile Image
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px dashed #1976d2',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5'
              }}
            />
          </Box>
          
          {imagePreview && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  width: 120, 
                  height: 120, 
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '2px solid #1976d2'
                }} 
              />
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              onClick={handleUploadImage} 
              disabled={uploading || !imageFile}
              variant="contained"
              color="primary"
              sx={{ 
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button 
              onClick={handleModalClose}
              variant="outlined"
              color="primary"
              sx={{ 
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PlayerCard;