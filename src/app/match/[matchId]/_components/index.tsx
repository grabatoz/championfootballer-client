"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Avatar, Divider } from "@mui/material";
import { useAuth } from '@/lib/hooks';
import MatchSummary from '@/Components/MatchSummary';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import React from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  shirtNumber?: string;
  level?: string;
  skills?: {
    dribbling?: number;
    shooting?: number;
    passing?: number;
    pace?: number;
    defending?: number;
    physical?: number;
  };
  preferredFoot?: string;
  profilePicture?: string;
  statistics?: {
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    penalties?: number;
    freeKicks?: number;
    defence?: number;
    impact?: number;
    // add other fields if you want
  }[];
}

interface Match {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamGoals?: number;
  awayTeamGoals?: number;
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  date: string;
  status: string;
  start?: string;
  end?: string;
  leagueId?: string;
  availableUsers?: { id: string }[];
}

interface League {
  id: string;
  name: string;
  matches: { id: string }[];
}

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const { token, user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState<{ [matchId: string]: boolean }>({});

  useEffect(() => {
    if (!matchId || !token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Match not found');
        return res.json();
      })
      .then(data => {
        if (data.success && data.match) setMatch(data.match);
        setLoading(false);
      })
      .catch(() => {
        setMatch(null);
        setLoading(false);
      });
  }, [matchId, token]);

  useEffect(() => {
    if (match && match.leagueId && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${match.leagueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.league) setLeague(data.league);
        });
    }
  }, [match, token]);

  // Automatically select home team on load if match is loaded
  useEffect(() => {
    if (match && selectedTeam === null) {
      setSelectedTeam('home');
    }
  }, [match, selectedTeam]);

  const showGoals = match?.status === 'started' || match?.status === 'completed';

  function getTeamSkillAvg(players: User[]) {
    if (!players.length) return 0;
    let total = 0;
    let count = 0;
    players.forEach(player => {
      if (player.skills) {
        Object.values(player.skills).forEach(val => {
          if (typeof val === 'number') {
            total += val;
            count++;
          }
        });
      }
    });
    return count ? total / count : 0;
  }

  let winPercentLeft = 0;
  let winPercentRight = 0;

  if (match) {
    if (match.status === 'completed') {
      const homeGoals = match.homeTeamGoals ?? 0;
      const awayGoals = match.awayTeamGoals ?? 0;
      if (homeGoals > awayGoals) {
        winPercentLeft = 100;
        winPercentRight = 0;
      } else if (homeGoals < awayGoals) {
        winPercentLeft = 0;
        winPercentRight = 100;
      } else {
        winPercentLeft = 50;
        winPercentRight = 50;
      }
    } else {
      // Dynamic calculation based on player skills
      const homeSkill = getTeamSkillAvg(match.homeTeamUsers);
      const awaySkill = getTeamSkillAvg(match.awayTeamUsers);
      const totalSkill = homeSkill + awaySkill;
      if (totalSkill > 0) {
        winPercentLeft = Math.round((homeSkill / totalSkill) * 100);
        winPercentRight = 100 - winPercentLeft;
      } else {
        winPercentLeft = 50;
        winPercentRight = 50;
      }
    }
  }

  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const handleToggleAvailability = async (matchId: string, isAvailable: boolean) => {
    if (!user) return;
    setAvailabilityLoading(prev => ({ ...prev, [matchId]: true }));
    const action = isAvailable ? 'unavailable' : 'available';
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/matches/${matchId}/availability?action=${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.success && data.match) {
        setMatch(prev => prev && prev.id === matchId ? { ...prev, availableUsers: data.match.availableUsers } : prev);
      }
    } finally {
      setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 4 }, minHeight: '100vh' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      ) : !match ? (
        <Typography color="error">Match not found.</Typography>
      ) : (
        <>
          {/* Improved Match Summary Bar */}
          <MatchSummary
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
            homeTeamImg={'/assets/matches.png'}
            awayTeamImg={'/assets/matches.png'}
            homeGoals={typeof match.homeTeamGoals === 'number' ? match.homeTeamGoals : 0}
            awayGoals={typeof match.awayTeamGoals === 'number' ? match.awayTeamGoals : 0}
            leagueName={league?.name || 'League'}
            currentMatch={league && league.matches ? (league.matches.findIndex(m => m.id === match.id) + 1) : 1}
            totalMatches={league?.matches?.length || 1}
            matchStartTime={match.start || match.date || new Date().toISOString()}
            possessionLeft={47} // TODO: Replace with actual possession if available
            possessionRight={53} // TODO: Replace with actual possession if available
            winPercentLeft={winPercentLeft}
            winPercentRight={winPercentRight}
            matchStatus={match.status}
            matchEndTime={match.end || undefined}
            leagueId={match.leagueId || ""}
            matchId={match.id}
            isUserAvailable={!!match.availableUsers?.some(u => u?.id === user?.id)}
            availabilityLoading={availabilityLoading}
            handleToggleAvailability={handleToggleAvailability}
          />
          {!showGoals && (
            <Typography align="center" sx={{ mb: 3, color: 'gray' }}>
              Match starts at: {match.start ? new Date(match.start).toLocaleString() : new Date(match.date).toLocaleString()}
            </Typography>
          )}
          {/* <Divider sx={{ mb: 3 }} /> */}
          <Box sx={{ width: "100%" }}>
            {/* Player Statistics Tables */}
            <Box sx={{ width: "100%" }}>
              {isLargeScreen ? (
                <Box
                  sx={{
                    width: "100%",
                    overflowX: "auto",
                    mt: 4,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  <Box sx={{ display: "flex", gap: 4, minWidth: 900 }}>
                    {/* Away Team Table (left) */}
                    <Box
                      sx={{
                        flex: 1,
                        maxWidth: 610,
                        minWidth: 320,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >

                      <Box
                        sx={{
                          width: "100%",
                          maxHeight: 420,
                          overflowY: "auto",
                          scrollbarWidth: "none",
                          "&::-webkit-scrollbar": { display: "none" },
                          background: '#185c34', // Add a distinct table background color
                          borderRadius: 3,
                          p: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center", fontSize: 17, color: '#fff', mt: 2 }}>
                          {match.awayTeamName} Players
                        </Typography>
                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        {/* Header */}
                        <Box
                          sx={{
                            bgcolor: "#43a047",
                            borderRadius: 3,
                            px: 2,
                            py: 1,
                            mb: 2,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ color: 'white', fontWeight: 'bold' }}>Pos</Box>
                          <Box sx={{ ml: 4, flex: 1, color: "white", fontWeight: "bold", fontSize: 14 }}>Player</Box>
                          <Box sx={{ display: "flex", gap: 2, color: "white", fontWeight: "bold", fontSize: 14 }}>
                            <Box sx={{ minWidth: 50, textAlign: "center" }}>Shirt No</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>Gs</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>As</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>CS</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>Plt</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>FK</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>Df</Box>
                            <Box sx={{ minWidth: 35, textAlign: "center" }}>Imp</Box>
                          </Box>
                        </Box>

                        {/* Player Cards */}
                        <Box>
                          {match.awayTeamUsers.map((player, idx) => {
                            const stats = player.statistics?.[0] || {}
                            let badgeImg = null;
                            let rowBg = '#0a4822';
                            let rowGradient = null;
                            let textColor = '#fff';
                            let fontWeight = 500;
                            if (idx === 0) {
                              rowGradient = '#0a3e1e'; // gold/orange
                              textColor = '#fff';
                              fontWeight = 700;
                              badgeImg = FirstBadge;
                            } else if (idx === 1) {
                              rowBg = '#0a4822'; // silver
                              badgeImg = SecondBadge;
                            } else if (idx === 2) {
                              rowBg = '#094420'; // bronze
                              badgeImg = ThirdBadge;
                            } else {
                              rowBg = '#0a4822';
                            }
                            return (
                              <React.Fragment key={player.id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    p: 2,
                                    background: rowGradient ? rowGradient : rowBg,
                                    color: textColor,
                                    fontWeight,
                                    boxShadow: 3,
                                    minHeight: 70,
                                    gap: 2,
                                  }}
                                >
                                  {/* Position badge above player image */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, minWidth: 44 }}>
                                    {/* Badge on the left */}
                                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {badgeImg ? (
                                        <img src={badgeImg.src} alt={`${idx + 1}st`} width={30} height={45} style={{ minWidth: 30, minHeight: 45, maxWidth: 32, maxHeight: 32 }} />
                                      ) : (
                                        <Box sx={{
                                          width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex',
                                          alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0a3e1e', fontSize: 16
                                        }}>{`${idx + 1}th`}</Box>
                                      )}
                                    </Box>
                                    {/* Player image */}
                                    <Avatar
                                      src={
                                        player.profilePicture
                                          ? player.profilePicture.startsWith("http")
                                            ? player.profilePicture
                                            : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith("/") ? player.profilePicture : `/${player.profilePicture}`}`
                                          : undefined
                                      }
                                      sx={{ width: 40, height: 40, bgcolor: "#174d2c" }}
                                    />
                                  </Box>
                                  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: "medium", color: "white", fontSize: 14 }}>
                                      {player.firstName} {player.lastName}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
                                    <Box sx={{ minWidth: 50, textAlign: "center", fontSize: 14 }}>
                                      {player.shirtNumber || "0"}
                                    </Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.goals ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.assists ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.cleanSheets ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.penalties ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.freeKicks ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.defence ?? 0}</Box>
                                    <Box sx={{ minWidth: 35, textAlign: "center", fontSize: 14 }}>{stats.impact ?? 0}</Box>
                                  </Box>
                                </Box>
                                  <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
                              </React.Fragment>
                            )
                          })}
                        </Box>
                      </Box>
                    </Box>

                    {/* Home Team Table (right) */}
                    <Box
                      sx={{
                        flex: 1,
                        maxWidth: 610,
                        minWidth: 320,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >

                      <Box
                        sx={{
                          width: "100%",
                          maxHeight: 420,
                          overflowY: "auto",
                          scrollbarWidth: "none",
                          "&::-webkit-scrollbar": { display: "none" },
                          background: '#185c34', // Add a distinct table background color
                          borderRadius: 3,
                          p: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center", fontSize: 17, color: '#fff', mt: 2 }}>
                          {match.homeTeamName} Players
                        </Typography>
                        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        {/* Header */}
                        <Box
                          sx={{
                            bgcolor: "#43a047",
                            borderRadius: 3,
                            px: 2,
                            py: 1,
                            mb: 2,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ color: 'white', fontWeight: 'bold' }}>Pos</Box>
                          <Box sx={{ ml: 4, flex: 1, color: "white", fontWeight: "bold", fontSize: 14 }}>Player</Box>
                          <Box sx={{ display: "flex", gap: 2, color: "white", fontWeight: "bold", fontSize: 14 }}>
                            <Box sx={{ minWidth: 50, textAlign: "center" }}>Shirt No</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>Gs</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>As</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>CS</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>Plt</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>FK</Box>
                            <Box sx={{ minWidth: 30, textAlign: "center" }}>Df</Box>
                            <Box sx={{ minWidth: 35, textAlign: "center" }}>Imp</Box>
                          </Box>
                        </Box>

                        {/* Player Cards */}
                        <Box>
                          {match.homeTeamUsers.map((player, idx) => {
                            const stats = player.statistics?.[0] || {}
                            let badgeImg = null;
                            let rowBg = '#0a4822';
                            let rowGradient = null;
                            let textColor = '#fff';
                            let fontWeight = 500;
                            if (idx === 0) {
                              rowGradient = '#0a3e1e'; // gold/orange
                              textColor = '#fff';
                              fontWeight = 700;
                              badgeImg = FirstBadge;
                            } else if (idx === 1) {
                              rowBg = '#0a4822'; // silver
                              badgeImg = SecondBadge;
                            } else if (idx === 2) {
                              rowBg = '#094420'; // bronze
                              badgeImg = ThirdBadge;
                            } else {
                              rowBg = '#0a4822';
                            }
                            return (
                              <React.Fragment key={player.id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    p: 2,
                                    background: rowGradient ? rowGradient : rowBg,
                                    color: textColor,
                                    fontWeight,
                                    boxShadow: 3,
                                    minHeight: 70,
                                    gap: 2,
                                  }}
                                >
                                  {/* Position badge above player image */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, minWidth: 44 }}>
                                    {/* Badge on the left */}
                                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {badgeImg ? (
                                        <img src={badgeImg.src} alt={`${idx + 1}st`} width={30} height={45} style={{ minWidth: 30, minHeight: 45, maxWidth: 32, maxHeight: 32 }} />
                                      ) : (
                                        <Box sx={{
                                          width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex',
                                          alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0a3e1e', fontSize: 16
                                        }}>{`${idx + 1}th`}</Box>
                                      )}
                                    </Box>
                                    {/* Player image */}
                                    <Avatar
                                      src={
                                        player.profilePicture
                                          ? player.profilePicture.startsWith("http")
                                            ? player.profilePicture
                                            : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith("/") ? player.profilePicture : `/${player.profilePicture}`}`
                                          : undefined
                                      }
                                      sx={{ width: 40, height: 40, bgcolor: "#174d2c" }}
                                    />
                                  </Box>
                                  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: "medium", color: "white", fontSize: 14 }}>
                                      {player.firstName} {player.lastName}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
                                    <Box sx={{ minWidth: 50, textAlign: "center", fontSize: 14 }}>
                                      {player.shirtNumber || "0"}
                                    </Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.goals ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.assists ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.cleanSheets ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.penalties ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.freeKicks ?? 0}</Box>
                                    <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.defence ?? 0}</Box>
                                    <Box sx={{ minWidth: 35, textAlign: "center", fontSize: 14 }}>{stats.impact ?? 0}</Box>
                                  </Box>
                                </Box>
                                  <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
                              </React.Fragment>
                            )
                          })}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: "flex", gap: 2, mb: 3, justifyContent: "center", mt: 4 }}>
                    <Button
                      variant={selectedTeam === "home" ? "contained" : "outlined"}
                      onClick={() => setSelectedTeam("home")}
                      sx={{
                        minWidth: 120,
                        fontWeight: "bold",
                        bgcolor: selectedTeam === "home" ? "#43a047" : "white",
                        color: selectedTeam === "home" ? "white" : "black",
                        "&:hover": {
                          bgcolor: selectedTeam === "home" ? "#388e3c" : "#f5f5f5",
                        },
                      }}
                    >
                      {match.homeTeamName}
                    </Button>
                    <Button
                      variant={selectedTeam === "away" ? "contained" : "outlined"}
                      onClick={() => setSelectedTeam("away")}
                      sx={{
                        minWidth: 120,
                        fontWeight: "bold",
                        bgcolor: selectedTeam === "away" ? "#43a047" : "white",
                        color: selectedTeam === "away" ? "white" : "black",
                        "&:hover": {
                          bgcolor: selectedTeam === "away" ? "#388e3c" : "#f5f5f5",
                        },
                      }}
                    >
                      {match.awayTeamName}
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: "#185c34", // Add a distinct table background color
                      boxShadow: 2,
                      overflowX: 'hidden', // Prevent horizontal scroll
                      maxWidth: { xs: '100%', sm: 600 }, // Responsive max width
                      width: '100%',
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'white', fontSize: { xs: 13, sm: 18 } }}>
                      {selectedTeam === "home" ? match.homeTeamName : match.awayTeamName} Players
                    </Typography>
                    {/* Header */}
                    <Box
                      sx={{
                        bgcolor: "#43a047",
                        borderRadius: 3,
                        px: 1,
                        py: 1,
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        fontSize: { xs: 10, sm: 14 }, // Even smaller font on mobile
                      }}
                    >
                      <Box sx={{ color: 'white', fontWeight: 'bold' }}>Pos</Box>
                      <Box sx={{ ml: 4, flex: 1, color: "white", fontWeight: "bold", fontSize: { xs: 10, sm: 14 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Player</Box>
                      <Box sx={{ display: "flex", gap: 1, color: "white", fontWeight: "bold", fontSize: { xs: 10, sm: 14 } }}>
                        <Box sx={{ minWidth: 32, textAlign: "center" }}>Shirt No</Box>
                        <Box sx={{ minWidth: 20, textAlign: "center" }}>Gs</Box>
                        <Box sx={{ minWidth: 20, textAlign: "center" }}>As</Box>
                        <Box sx={{ minWidth: 20, textAlign: "center" }}>CS</Box>
                        <Box sx={{ minWidth: 20, textAlign: "center" }}>Plt</Box>
                        <Box sx={{ minWidth: 20, textAlign: "center" }}>FK</Box>
                        <Box sx={{ minWidth: 20, textAlign: "center" }}>Df</Box>
                        <Box sx={{ minWidth: 22, textAlign: "center" }}>Imp</Box>
                      </Box>
                    </Box>
                    {/* Player Cards */}
                    <Box>
                      {(selectedTeam === "home" ? match.homeTeamUsers : match.awayTeamUsers).map((player, idx) => {
                        const stats = player.statistics?.[0] || {};
                        let badgeImg = null;
                        let rowBg = '#0a4822';
                        let rowGradient = null;
                        let textColor = '#fff';
                        let fontWeight = 500;
                        if (idx === 0) {
                          rowGradient = '#0a3e1e'; // gold/orange
                          textColor = '#fff';
                          fontWeight = 700;
                          badgeImg = FirstBadge;
                        } else if (idx === 1) {
                          rowBg = '#0a4822'; // silver
                          badgeImg = SecondBadge;
                        } else if (idx === 2) {
                          rowBg = '#094420'; // bronze
                          badgeImg = ThirdBadge;
                        } else {
                          rowBg = '#0a4822';
                        }
                        return (
                          <React.Fragment key={player.id}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                p: 1,
                                background: rowGradient ? rowGradient : rowBg,
                                color: textColor,
                                fontWeight,
                                boxShadow: 1,
                                minHeight: 40,
                                gap: 1,
                                fontSize: { xs: 10, sm: 14 },
                              }}
                            >
                              {/* Position badge above player image */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, minWidth: 44 }}>
                                {/* Badge on the left */}
                                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {badgeImg ? (
                                    <img src={badgeImg.src} alt={`${idx + 1}st`} width={30} height={45} style={{ minWidth: 30, minHeight: 45, maxWidth: 32, maxHeight: 32 }} />
                                  ) : (
                                    <Box sx={{
                                      width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex',
                                      alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0a3e1e', fontSize: 16
                                    }}>{`${idx + 1}th`}</Box>
                                  )}
                                </Box>
                                {/* Player image */}
                                <Avatar
                                  src={
                                    player.profilePicture
                                      ? player.profilePicture.startsWith("http")
                                        ? player.profilePicture
                                        : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith("/") ? player.profilePicture : `/${player.profilePicture}`}`
                                      : undefined
                                  }
                                  sx={{ width: 40, height: 40, bgcolor: "#174d2c" }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: "medium", color: "white", fontSize: { xs: 10, sm: 14 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {player.firstName} {player.lastName}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                                <Box sx={{ minWidth: 32, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{player.shirtNumber || "0"}</Box>
                                <Box sx={{ minWidth: 20, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.goals ?? 0}</Box>
                                <Box sx={{ minWidth: 20, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.assists ?? 0}</Box>
                                <Box sx={{ minWidth: 20, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.cleanSheets ?? 0}</Box>
                                <Box sx={{ minWidth: 20, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.penalties ?? 0}</Box>
                                <Box sx={{ minWidth: 20, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.freeKicks ?? 0}</Box>
                                <Box sx={{ minWidth: 20, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.defence ?? 0}</Box>
                                <Box sx={{ minWidth: 22, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.impact ?? 0}</Box>
                              </Box>
                            </Box>
                              <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
                          </React.Fragment>
                        );
                      })}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
} 