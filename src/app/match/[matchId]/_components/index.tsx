"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Avatar, Divider, Paper, Chip } from "@mui/material";
import { useAuth } from '@/lib/hooks';
import MatchSummary from '@/Components/MatchSummary';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import React from "react";
import Link from "next/link";
import ResponsiveCard from "@/Components/card/card";

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
  date: string;
  location: string;
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  homeTeamGoals?: number;
  awayTeamGoals?: number;
  notes?: string;
  manOfTheMatchVotes?: Record<string, string>;
  status: string;
  start?: string;
  homeCaptainId?: string;
  awayCaptainId?: string;
  leagueId?: string;
  end?: string;
  availableUsers?: { id: string }[];
}

interface League {
  id: string;
  name: string;
  matches: { id: string }[];
}

interface PlayerCardProps {
  name: string;
  number: string;
  level: string;
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
  isCaptain?: boolean;
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
  const [playerVotes, setPlayerVotes] = useState<Record<string, number>>({});
  const [votedForId, setVotedForId] = useState<string | null>(null);

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

  const mapPlayerToCardProps = (player: User): PlayerCardProps => {
    // const teamGoals = playerOnHomeTeam ? homeGoals : awayGoals;
    return {
      name: `${player.firstName || ''} ${player.lastName || ''}`,
      number: player.shirtNumber || '10',
      level: player.level || '1',
      stats: {
        DRI: player.skills?.dribbling?.toString() || '50',
        SHO: player.skills?.shooting?.toString() || '50',
        PAS: player.skills?.passing?.toString() || '50',
        PAC: player.skills?.pace?.toString() || '50',
        DEF: player.skills?.defending?.toString() || '50',
        PHY: player.skills?.physical?.toString() || '50'
      },
      foot: player.preferredFoot === 'right' ? 'R' : 'L',
      profileImage: player.profilePicture || '/assets/group.svg',
      isCaptain: player.id === match?.homeCaptainId || player.id === match?.awayCaptainId,
      shirtIcon: ''
    };
  };

  // Fetch votes and set votedForId ONLY from backend
  const fetchVotes = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/votes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setPlayerVotes(data.votes || {});
      setVotedForId(data.userVote || null); // <-- Always set from backend only!
    }
  }, [matchId, token]);

  useEffect(() => {
    if (matchId && token) fetchVotes();
  }, [matchId, token, fetchVotes]);
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
          <Box sx={{ width: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
                          fontSize: { xs: 11, sm: 13, md: 15 },
                        }}
                      >
                        <Box sx={{ minWidth: 700 }}>
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
                                  <Link href={`/player/${player.id}`} passHref>
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
                                          {player.firstName} {player.lastName}{player.id === match.awayCaptainId ? '(C)' : ''}
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
                                  </Link>
                                </React.Fragment>
                              )
                            })}
                          </Box>
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
                          fontSize: { xs: 11, sm: 13, md: 15 },
                        }}
                      >
                        <Box sx={{ minWidth: 700 }}>
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
                                  <Link href={`/player/${player.id}`} passHref>
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
                                          {player.firstName} {player.lastName}{player.id === match.homeCaptainId ? '(C)' : ''}
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
                                  </Link>
                                </React.Fragment>
                              )
                            })}
                          </Box>
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
                      background: "#185c34",
                      boxShadow: 2,
                      overflowX: "auto",
                      minWidth: 0,
                      maxWidth: { xs: "100%", sm: 600 },
                      width: "100%",
                      fontSize: { xs: 11, sm: 13, md: 15 },
                      mx: "auto",
                    }}
                  >
                    <Box sx={{ minWidth: '100%' }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mb: 2,
                          color: "white",
                          fontSize: { xs: 13, sm: 18 },
                        }}
                      >
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
                          fontSize: { xs: 10, sm: 14 },
                        }}
                      >
                        <Box sx={{ color: "white", fontWeight: "bold", width: 32 }}>Pos</Box>
                        <Box
                          sx={{
                            ml: 2,
                            flex: 1,
                            color: "white",
                            maxWidth: 100,
                            fontWeight: "bold",
                            fontSize: { xs: 10, sm: 14 },
                          }}
                        >
                          Player
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5, color: "white", fontWeight: "bold", fontSize: { xs: 10, sm: 14 } ,  marginLeft: 'auto'}}>
                          <Box sx={{ width: 28, textAlign: "center" }}>No</Box>
                          <Box sx={{ width: 24, textAlign: "center" }}>Gs</Box>
                          <Box sx={{ width: 24, textAlign: "center" }}>As</Box>
                          <Box sx={{ width: 24, textAlign: "center" }}>CS</Box>
                          <Box sx={{ width: 24, textAlign: "center" }}>Plt</Box>
                          <Box sx={{ width: 24, textAlign: "center" }}>FK</Box>
                          <Box sx={{ width: 24, textAlign: "center" }}>Df</Box>
                          <Box sx={{ width: 28, textAlign: "center" }}>Imp</Box>
                        </Box>
                      </Box>

                      {/* Player Cards - NO GAPS */}
                      <Box sx={{ gap: 0 }}>
                        {(selectedTeam === "home" ? match.homeTeamUsers : match.awayTeamUsers).map((player, idx) => {
                          const stats = player.statistics?.[0] || {}
                          let badgeImg = null
                          let rowBg = "#0a4822"
                          let textColor = "#fff"
                          let fontWeight = 500

                          if (idx === 0) {
                            rowBg = "#0a3e1e"
                            textColor = "#fff"
                            fontWeight = 700
                            badgeImg = FirstBadge
                          } else if (idx === 1) {
                            rowBg = "#0a4822"
                            badgeImg = SecondBadge
                          } else if (idx === 2) {
                            rowBg = "#094420"
                            badgeImg = ThirdBadge
                          }

                          return (
                            <Link href={`/player/${player.id}`} passHref key={player.id}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  p: 0.5,
                                  background: rowBg,
                                  color: textColor,
                                  fontWeight,
                                  minHeight: 36,
                                  gap: 0.5,
                                  fontSize: { xs: 10, sm: 14 },
                                  // Remove any borders, margins, or spacing
                                  border: "none",
                                  borderRadius: 0,
                                  m: 0,
                                  "&:hover": {
                                    backgroundColor: rowBg,
                                    opacity: 0.9,
                                  },
                                  
                                }}
                              >
                                {/* Position and Avatar */}
                                <Box sx={{ display: "flex", alignItems: "center", mr: 1, width: 44 }}>
                                  <Box sx={{ mr: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {badgeImg ? (
                                      <Box
                                        component="img"
                                        src={badgeImg.src}
                                        alt={`${idx + 1}st`}
                                        sx={{ width: 2, height: 25, minWidth: 25, minHeight: 35}}
                                      />
                                    ) : (
                                      <Box
                                        sx={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: "50%",
                                          background: "#fff",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontWeight: 700,
                                          color: "#0a3e1e",
                                          fontSize: 10,
                                        }}
                                      >
                                        {idx + 1}
                                      </Box>
                                    )}
                                  </Box>
                                  <Avatar src={player.profilePicture} sx={{ width: 28, height: 28, bgcolor: "#174d2c" }} />
                                </Box>

                                {/* Player Name - Compact */}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "medium",
                                    color: "white",
                                    fontSize: { xs: 10, sm: 14 },
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                    maxWidth: 100,
                                  }}
                                >
                                  {player.firstName} {player.lastName}
                                  {(selectedTeam === "home" ? player.id === match.homeCaptainId : false) ? "(C)" : ""}
                                </Typography>

                                {/* Stats - Compact columns */}
                                <Box sx={{ display: "flex", gap: 0.5, ml: 'auto',}}>
                                  <Box sx={{ width: 28, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>
                                    {player.shirtNumber || "0"}
                                  </Box>
                                  <Box sx={{ width: 24, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.goals ?? 0}</Box>
                                  <Box sx={{ width: 24, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>
                                    {stats.assists ?? 0}
                                  </Box>
                                  <Box sx={{ width: 24, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>
                                    {stats.cleanSheets ?? 0}
                                  </Box>
                                  <Box sx={{ width: 24, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>
                                    {stats.penalties ?? 0}
                                  </Box>
                                  <Box sx={{ width: 24, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>
                                    {stats.freeKicks ?? 0}
                                  </Box>
                                  <Box sx={{ width: 24, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>
                                    {stats.defence ?? 0}
                                  </Box>
                                  <Box sx={{ width: 28, textAlign: "center", fontSize: { xs: 10, sm: 14 } }}>{stats.impact ?? 0}</Box>
                                </Box>
                              </Box>
                            </Link>
                          )
                        })}
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {(Object.keys(playerVotes).length > 0) && (
            <Paper sx={{ p: 3, mt: 4, backgroundColor: '#0a3e1e', color: 'white' }}>
              <Typography variant="h5" component="h2" gutterBottom>MOTM Votes</Typography>
              <Divider sx={{ mb: 3, backgroundColor: '#fff' }} />
              <Box
                sx={{
                  display: { xs: 'flex', sm: 'grid' },
                  flexDirection: { xs: 'row', sm: undefined },
                  overflowX: { xs: 'auto', sm: 'visible' },
                  gap: 3,
                  gridTemplateColumns: { sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  width: '100%',
                }}
              >
                {[...match.homeTeamUsers, ...match.awayTeamUsers]
                  .filter(player => playerVotes[player.id] > 0)
                  .map((player) => (
                    <Box key={player.id} sx={{ minWidth: { xs: 220, sm: 'unset' }, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Chip
                          label={playerVotes[player.id]}
                          sx={{
                            mb: 1,
                            backgroundColor: '#ffc107',
                            color: 'black',
                            fontWeight: 'bold',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                      </Box>
                      <ResponsiveCard {...mapPlayerToCardProps(player)} backgroundColor="#0a3e1e" />
                    </Box>
                  ))}
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
} 