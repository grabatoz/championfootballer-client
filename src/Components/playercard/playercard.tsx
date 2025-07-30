import React from 'react';
import Image, { StaticImageData } from 'next/image';
import {
  Box,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import Foot from '@/Components/images/foot.png'
import imgicon from '@/Components/images/imgicon.png'

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
  // Set text color: black for Silver/Gold, white otherwise
  // const textColor = (color === 'Silver' || color === 'Gold') ? 'black' : 'white';
  return (
    <Box
      sx={{
        width: width || 260,
        height: height || 390,
        position: 'relative',
        fontWeight: 'bold',
        color: '#fff',
        }}
    >
      {/* Background Image */}
      <Image
        src={vectorImg}
        alt="Card Background"
        layout="fill"
        objectFit="contain"
        className="z-0"
        style={{ }}
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
          <Typography fontWeight={'bold'} fontSize="15px" color={'#fff'}><span className='font-bold text-[22px]'> {points} xp </span></Typography>
     {/* <Button variant="contained" color="success">
    <Link href={'/profile'}>
      edit profile  
    </Link>
     </Button> */}
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
    {/* <Typography fontSize="23px" marginLeft={'5px'} fontWeight={'bold'} color={'#fff'}>{number}</Typography> */}
    <Divider sx={{ bgcolor: '#fff'}}/>
    <Typography fontSize="15px" fontWeight={'bold'} justifyContent={'center'} textAlign={'center'} color={'#fff'}>{getPositionShortForm(position)}</Typography>
    <Divider sx={{ bgcolor: '#fff'}}/>
    <Box
      display="flex"
      alignItems="center"
      gap={0.5}
      mt={0.5}
    >
      {/* Render Foot SVG in black if '#fff' is black, else normal */}
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
    <Avatar
      src={typeof profileImage === 'string' ? profileImage : undefined}
      sx={{ width: 85, height: 85 , borderRadius:'0'}}
      alt="Profile"
    >
      {(!profileImage || typeof profileImage !== 'string') && (
        <Image height={0} width={0} src={imgicon.src} alt="Profile" style={{ width: '100%', height: '100%' }} />
      )}
    </Avatar>
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
    </Box>
  );
};

export default PlayerCard;



























// import React from 'react';
// import Image from 'next/image';
// import { Box, Typography, IconButton, Grid, Avatar } from '@mui/material';
// import vector from '@/Components/images/Vector.svg';
// import EditIcon from '@mui/icons-material/Edit';

// interface PlayerCardProps {
//   name: string;
//   number: string;
//   level: string;
//   stats: {
//     DRI: string;
//     SHO: string;
//     PAS: string;
//     PAC: string;
//     DEF: string;
//     PHY: string;
//   };
//   foot: string;
//   shirtIcon: string;
//   profileImage?: string;
// }

// const PlayerCard = ({
//   name,
//   number,
//   level,
//   stats,
//   foot,
//   shirtIcon,
//   profileImage,
// }: PlayerCardProps) => {
//   return (
//     <Box
//       sx={{
//         width: 260,
//         height: 430,
//         position: 'relative',
//         fontWeight: 'bold',
//         color: 'white',
//       }}
//     >
//       {/* Background */}
//       <Image
//         src={vector}
//         alt="Card Background"
//         layout="fill"
//         objectFit="contain"
//         className="z-0"
//       />

//       {/* Overlay Content */}
//       <Box
//         sx={{
//           position: 'absolute',
//           inset: 0,
//           zIndex: 10,
//           px: 2,
//           py: 2,
//           textAlign: 'center',
//           display: 'flex',
//           flexDirection: 'column',
//           justifyContent: 'space-between',
//         }}
//       >
//         {/* Shirt Number */}
//         <Box>
//           <Typography variant="body2">NO. {number}</Typography>
//           <Typography variant="h5" fontWeight="bold" mt={1}>
//             {number}
//           </Typography>
//         </Box>

//         {/* XXX + Foot */}
//         <Box>
//           <Typography variant="caption" display="block">
//             XXX
//           </Typography>
//           <Box display="flex" justifyContent="center" alignItems="center" gap={0.5}>
//             <Image src={shirtIcon} alt="Foot icon" width={16} height={16} />
//             <Typography variant="caption">{foot}</Typography>
//           </Box>
//         </Box>

//         {/* Profile Picture + Edit */}
//         <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto' }}>
//           <Avatar
//             src={profileImage || shirtIcon}
//             alt="Profile"
//             sx={{
//               width: 80,
//               height: 80,
//               border: '2px solid white',
//             }}
//           />
//           <IconButton
//             size="small"
//             sx={{
//               position: 'absolute',
//               top: 0,
//               right: 0,
//               bgcolor: 'white',
//               p: '2px',
//               '&:hover': { bgcolor: '#f0f0f0' },
//             }}
//           >
//             <EditIcon fontSize="small" sx={{ color: 'black' }} />
//           </IconButton>
//         </Box>

//         {/* Name & Level */}
//         <Box>
//           <Typography variant="body1" sx={{ textTransform: 'uppercase' }}>
//             {name}
//           </Typography>
//           <Typography variant="caption">{level}</Typography>
//         </Box>

//         {/* Stats Grid */}
//         <Grid container spacing={0.5} justifyContent="center" mt={1}>
//           <Grid item xs={6}>
//             <Typography variant="caption">DRI {stats.DRI}</Typography>
//           </Grid>
//           <Grid item xs={6}>
//             <Typography variant="caption">PAC {stats.PAC}</Typography>
//           </Grid>
//           <Grid item xs={6}>
//             <Typography variant="caption">SHO {stats.SHO}</Typography>
//           </Grid>
//           <Grid item xs={6}>
//             <Typography variant="caption">DEF {stats.DEF}</Typography>
//           </Grid>
//           <Grid item xs={6}>
//             <Typography variant="caption">PAS {stats.PAS}</Typography>
//           </Grid>
//           <Grid item xs={6}>
//             <Typography variant="caption">PHY {stats.PHY}</Typography>
//           </Grid>
//         </Grid>
//       </Box>
//     </Box>
//   );
// };

// export default PlayerCard;



























// import Image from 'next/image'
// import React from 'react'
// import vector from '@/Components/images/Vector.svg'
// import { IconButton } from '@mui/material';

// interface PlayerCardProps {
//   name: string;
//   number: string;
//   level: string;
//   stats: {
//     DRI: string;
//     SHO: string;
//     PAS: string;
//     PAC: string;
//     DEF: string;
//     PHY: string;
//   };
//   foot: string;
//   shirtIcon: string;
//   profileImage?: string;
// }

// const PlayerCard = ({
//   name,
//   number,
//   level,
//   stats,
//   foot,
//   shirtIcon,
//   profileImage
// }: PlayerCardProps) => {
//   return (
//     <div className="relative w-[260px] h-[430px] font-bold text-white">
//       {/* Background Image */}
//       <Image
//         src={vector}
//         alt="Card background"
//         layout="fill"
//         objectFit="contain"
//         className="z-0"
//       />

//       {/* Overlay Content */}
//       <div className="absolute inset-0 z-10 flex flex-col items-center justify-between px-4 py-4 text-center">
        
//         {/* Top: Shirt Number */}
//         <div>
//           <p className="text-sm">NO. {number}</p>
//           <p className="text-2xl font-bold mt-1">{number}</p>
//         </div>

//         {/* Middle Top: XXX + Foot */}
//         <div className="flex flex-col items-center gap-1 text-xs mt-1">
//           <p>XXX</p>
//           <div className="flex items-center gap-1">
//             <Image src={shirtIcon} alt="shoe" width={16} height={16} />
//             <p>{foot}</p>
//           </div>
//         </div>

//         {/* Profile Image + Edit Icon */}
//         <div className="relative w-20 h-20 mt-2 mb-1">
//           <Image
//             src={profileImage || shirtIcon}
//             alt="Profile"
//             layout="fill"
//             objectFit="cover"
//             className="rounded-full border-2 border-white"
//           />
//           {/* Edit Icon */}
//           <div className="absolute top-1 right-1 bg-white rounded-full p-1">
//           <IconButton
//               sx={{bgcolor: "white", p: 0.5 }}
//               component="label"
//             >
//           </div>
//         </div>

//         {/* Name & Level */}
//         <div>
//           <p className="text-lg uppercase">{name}</p>
//           <p className="text-xs tracking-wider">{level}</p>
//         </div>

//         {/* Attributes */}
//         <div className="grid grid-cols-2 gap-y-1 text-xs mt-2">
//           <p>DRI {stats.DRI}</p>
//           <p>PAC {stats.PAC}</p>
//           <p>SHO {stats.SHO}</p>
//           <p>DEF {stats.DEF}</p>
//           <p>PAS {stats.PAS}</p>
//           <p>PHY {stats.PHY}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PlayerCard;



























// import Image from 'next/image'
// import React from 'react'
// import vector from '@/Components/images/Vector.svg'

// interface PlayerCardProps {
//   name: string;
//   number: string;
//   level: string;
//   stats: {
//     DRI: string;
//     SHO: string;
//     PAS: string;
//     PAC: string;
//     DEF: string;
//     PHY: string;
//   };
//   foot: string;
//   shirtIcon: string;
//   profileImage?: string;
// }

// const PlayerCard = ({
//   name,
//   number,
//   level,
//   stats,
//   foot,
//   shirtIcon,
//   profileImage
// }: PlayerCardProps) => {
//   return (
//     <div className="relative w-[260px] h-[430px]">
//         <Image
//         src={vector}
//         alt='group img'
//         width={210}
//         height={210}
//         // layout="fill"
//         objectFit="contain"
//         className="z-0"
//         />
//           <div className="absolute inset-0 flex flex-col items-center text-white px-2 py-4 z-10 font-bold text-center">

// <p className="text-sm">NO. {number}</p>
// <div className="mt-2 text-xl">{number}</div>

// <div className="text-xs">XXX</div>
// <div className="text-xs">{foot}</div>

// <div className="w-20 h-20 rounded-full overflow-hidden mt-2 mb-1">
//   <Image
//     src={profileImage || shirtIcon}
//     alt="Profile"
//     width={80}
//     height={80}
//   />
// </div>

// <div className="text-md">{name}</div>
// <div className="text-xs mb-2">{level}</div>

// <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
//   <p>DRI {stats.DRI}</p>
//   <p>PAC {stats.PAC}</p>
//   <p>SHO {stats.SHO}</p>
//   <p>DEF {stats.DEF}</p>
//   <p>PAS {stats.PAS}</p>
//   <p>PHY {stats.PHY}</p>
// </div>
// </div>
//     </div>
//   )
// }

// export default PlayerCard