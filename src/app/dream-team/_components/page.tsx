'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Avatar, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { useAuth } from '@/lib/useAuth';
import fieldImg from '@/Components/images/ground.webp'; // Place your field image in public/assets/field.png
import PersonIcon from '@mui/icons-material/Person';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dreamteam from '@/Components/images/dream.png'


interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  profilePicture?: string;
  xp: number;
  achievements: string[];
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    motm: number;
    winPercentage: number;
    points: number;
  };
}

interface DreamTeam {
  goalkeeper: Player[];
  defenders: Player[];
  midfielders: Player[];
  forwards: Player[];
}

interface League {
  id: string;
  name: string;
}

const DreamTeamPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [dreamTeam, setDreamTeam] = useState<DreamTeam>({
    goalkeeper: [],
    defenders: [],
    midfielders: [],
    forwards: []
  });
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchLeagues = useCallback(async () => {
    console.log('🔍 Fetching leagues...');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setLeagues(data.leagues || []);
        if (data.leagues && data.leagues.length > 0) {
          setSelectedLeague(data.leagues[0].id);
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  }, [token]);

  const fetchDreamTeam = useCallback(async (leagueId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dream-team?leagueId=${leagueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDreamTeam(data.dreamTeam);
      }
    } catch (error) {
      console.error('Error fetching dream team:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - token:', token ? 'Present' : 'Missing');
    if (token) {
      console.log('✅ Token found, calling fetchLeagues');
      fetchLeagues();
    } else {
      console.log('❌ No token found, skipping fetchLeagues');
    }
  }, [token, fetchLeagues]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - selectedLeague:', selectedLeague);
    if (token && selectedLeague) {
      console.log('✅ Token and selectedLeague found, calling fetchDreamTeam');
      fetchDreamTeam(selectedLeague);
    } else {
      console.log('❌ Missing token or selectedLeague, skipping fetchDreamTeam');
    }
  }, [token, selectedLeague, fetchDreamTeam]);

  useEffect(() => {
    console.log('Leagues:', leagues);
    console.log('Selected League:', selectedLeague);
    console.log('Dream Team:', dreamTeam);
    console.log('Loading:', loading);
  }, [leagues, selectedLeague, dreamTeam, loading]);

  const fieldPositions = [
    { type: 'goalkeeper', left: '47%', top: '80%' },
    { type: 'defenders', left: '30%', top: '60%' },
    { type: 'defenders', left: '65%', top: '60%' },
    { type: 'midfielders', left: '47%', top: '40%' },
    { type: 'forwards', left: '47%', top: '15%' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, // Stack vertically on xs, row on sm+
          alignItems: "center", // Center items horizontally when stacked, vertically when in row
          justifyContent: { xs: "space-between", sm: "center" }, // Space between on xs, center on sm+
          mb: 4,
          gap: { xs: 2, sm: 2 }, // Gap between stacked items on xs, or between columns on sm+
          width: "100%", // Ensure it takes full width
        }}
      >
        
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", sm: "flex-start" }, // Space between on xs, flex-start on sm+
            width: { xs: "100%", sm: "auto" }, // Take full width on xs, auto on sm+
            gap: { xs: 1, sm: 2 }, // Gap between button and select
            order: { xs: 1, sm: "unset" }, // Ensures this box is always first on xs screens
            mr: { sm: "auto" }, // Pushes this box to the left on sm+ screens
          }}
        >
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => router.push(`/home`)}
            sx={{
              color: "white",
              backgroundColor: "#1f673b",
              "&:hover": { backgroundColor: "#388e3c" },
              minWidth: "fit-content",
              fontSize: { xs: "0.75rem", sm: "0.875rem" }, // Responsive font size
              px: { xs: 1, sm: 2 }, // Responsive padding
              py: { xs: 0.5, sm: 1 }, // Responsive padding
            }}
          >
            Back to Dashboard
          </Button>
          <Typography
          variant="h3"
          component="h1"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            flex: { xs: "0 0 auto", sm: 1 }, // On sm+, it grows to take available space
            textAlign: "center",
            order: { xs: 2, sm: "unset" }, // Ensures this box is second on xs screens
            mt: { xs: 2, sm: 0 }, // Add top margin on xs to separate from the top row
            fontSize: { xs: "1.8rem", sm: "2.2rem", md: "3rem" }, // Responsive font size for title
            whiteSpace: "nowrap", // Prevent wrapping of "Dream Team" text
          }}
        >
          <Image src={dreamteam.src}alt="Dream Team Logo" height={80} width={80} />
          Dream Team
        </Typography>
          <FormControl sx={{ minWidth: { xs: 160, sm: 200, md: 240 } }}>
           
            <InputLabel id="league-select-label">
              Select League
            </InputLabel>
            <Select
              labelId="league-select-label"
              value={selectedLeague}
              label="Select League"
              onChange={(e) => setSelectedLeague(e.target.value as string)}
            >
              {leagues.map((league) => (
                <MenuItem key={league.id} value={league.id}>
                  {league.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>       
      </Box> */}
    
 <Box
  sx={{
    display: "flex",
    flexDirection: { xs: "column", md: "row" }, // Stack vertically on xs/sm, row on md+
    alignItems: { xs: "stretch", md: "center" }, // Stretch on mobile, center on desktop
    justifyContent: "space-between",
    mb: 4,
    gap: { xs: 3, md: 2 }, // Larger gap on mobile for better separation
    width: "100%",
  }}
>
  {/* Top Row for Mobile: Back Button + Form Control */}
  <Box
    sx={{
      display: { xs: "flex", md: "none" }, // Only show on mobile
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    }}
  >
    {/* Left: Back Button */}
    <Button
      startIcon={<ArrowLeft />}
      onClick={() => router.push(`/home`)}
      sx={{
        color: "white",
        backgroundColor: "#1f673b",
        "&:hover": { backgroundColor: "#388e3c" },
        minWidth: "fit-content",
        fontSize: { xs: "0.75rem", sm: "0.875rem" },
        px: { xs: 2, sm: 3 },
        py: { xs: 1, sm: 1.5 },
        borderRadius: 2,
        fontWeight: "bold",
        textTransform: "none",
        height: 55,
      }}
    >
      Back to Dashboard
    </Button>

    {/* Right: Form Control */}
    <FormControl
      sx={{
        minWidth: { xs: 160, sm: 200, md: 240 }, // Responsive minWidth
        ml: { xs: 1, sm: "auto" }, // Push to right on sm+ screens
      }}
    >
      <InputLabel id="league-select-label">Select League</InputLabel>
      <Select
        labelId="league-select-label"
        value={selectedLeague}
        label="Select League"
        onChange={(e) => setSelectedLeague(e.target.value as string)}
        // MenuProps={{
        //   PaperProps: {
        //     sx: {
        //       backgroundColor: "#0a3e1e",
        //       color: "white",
        //       "& .MuiMenuItem-root": {
        //         color: "white",
        //         "&:hover": {
        //           backgroundColor: "#1f673b",
        //         },
        //       },
        //     },
        //   },
        // }}
      >
        {leagues.map((league) => (
          <MenuItem key={league.id} value={league.id}>
            {league.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>

  {/* Desktop Layout: Back Button (Left) */}
  <Box
    sx={{
      display: { xs: "none", md: "flex" }, // Only show on desktop
      justifyContent: "flex-start",
    }}
  >
    <Button
      startIcon={<ArrowLeft />}
      onClick={() => router.push(`/home`)}
      sx={{
        color: "white",
        backgroundColor: "#1f673b",
        "&:hover": { backgroundColor: "#388e3c" },
        minWidth: "fit-content",
        fontSize: "0.875rem",
        px: 3,
        py: 1.5,
        borderRadius: 2,
        fontWeight: "bold",
        textTransform: "none",
      }}
    >
      Back to Dashboard
    </Button>
  </Box>

  {/* Center: Dream Team Logo + Text */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      width: { xs: "100%", md: "auto" },
      mt: { xs: 2, md: 0 }, // Top margin on mobile
      mb: { xs: 2, md: 0 }, // Bottom margin on mobile
    }}
  >
    <Image
      src={dreamteam.src}
      alt="Dream Team Logo"
      height={80}
      width={80}
      style={{ 
        display: "block",
        objectFit: "contain"
      }}
    />
    <Typography
      variant="h3"
      component="h1"
      sx={{
        fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2.2rem" },
        fontWeight: "bold",
        color: "black",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      Dream Team
    </Typography>
  </Box>

  {/* Desktop Layout: Form Control (Right) */}
  <Box
    sx={{
      display: { xs: "none", md: "flex" }, // Only show on desktop
      justifyContent: "flex-end",
    }}
  >
    <FormControl
      sx={{
        minWidth: { xs: 160, sm: 200, md: 240 }, // Responsive minWidth
        ml: { xs: 0, sm: "auto" }, // Push to right on sm+ screens
      }}
    >
      <InputLabel id="league-select-label-desktop">Select League</InputLabel>
      <Select
        labelId="league-select-label-desktop"
        value={selectedLeague}
        label="Select League"
        onChange={(e) => setSelectedLeague(e.target.value as string)}
        // MenuProps={{
        //   PaperProps: {
        //     sx: {
        //       backgroundColor: "#0a3e1e",
        //       color: "white",
        //       "& .MuiMenuItem-root": {
        //         color: "white",
        //         "&:hover": {
        //           backgroundColor: "#1f673b",
        //         },
        //       },
        //     },
        //   },
        // }}
      >
        {leagues.map((league) => (
          <MenuItem key={league.id} value={league.id}>
            {league.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
</Box>
      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading Dream Team...</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 900, mx: 'auto', aspectRatio: '2.1', mb: 4 }}>
        {/* Dream Team Title and Logo - centered, moves below on small screens */}
      <Image fill src={fieldImg} alt="Football Field" style={{ width: '100%', borderRadius: 16 }} />
            {/* Overlay players */}
            {fieldPositions.map((pos, idx) => {
              let player: Player | undefined;
              if (pos.type === 'goalkeeper') player = dreamTeam.goalkeeper[0];
              if (pos.type === 'defenders') player = dreamTeam.defenders[idx - 1];
              if (pos.type === 'midfielders') player = dreamTeam.midfielders[0];
              if (pos.type === 'forwards') player = dreamTeam.forwards[0];
              if (!player) return null;
              return (
                <Box
                  key={pos.type + idx}
                  sx={{
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 2,
                  }}
                >
                  <Avatar
                    src={player.profilePicture}
                    sx={{ width: 64, height: 64, bgcolor: '#1976d2', border: '3px solid #fff', mx: 'auto', mb: 1 }}
                  >
                    <PersonIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Avatar>
                  <Box
                    sx={{
                      position: 'relative',
                      top: '-36px',
                      width: 64,
                      mx: 'auto',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: 14,
                      py: 0.5,
                      px: 1,
                      textShadow: '0 1px 2px #000',
                    }}
                  >
                    {player.firstName}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
};

export default DreamTeamPage; 