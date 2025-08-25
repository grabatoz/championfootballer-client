"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Avatar, Divider, Card } from "@mui/material";
import { useAuth } from '@/lib/hooks';
import MatchSummary from '@/Components/MatchSummary';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import FirstBadge from '@/Components/images/1st.png';
import SecondBadge from '@/Components/images/2nd.png';
import ThirdBadge from '@/Components/images/3rd.png';
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cacheManager } from "@/lib/cacheManager"
// import { ArrowLeft } from "lucide-react";

const getBadgeForPosition = (position: number) => {
  switch (position) {
    case 1:
      return <Image src={FirstBadge} alt="First Place" width={20} height={20} />
    case 2:
      return <Image src={SecondBadge} alt="Second Place" width={20} height={20} />
    case 3:
      return <Image src={ThirdBadge} alt="Third Place" width={20} height={20} />
    default:
      return `${position}th`
  }
}

const getRowStyles = (index: number) => {
  if (index === 0) {
    return "bg-[#0a3e1e]" // First place - darker green
  } else if (index === 1) {
    return "bg-[#0a4822]" // Second place - medium green
  } else if (index === 2) {
    return "bg-[#094420]" // Third place - another shade of green
  }
  return "bg-[#0a4822]" // All other places - medium green
}

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
  positionType?: string;
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
  awayTeamImage?: string;
  homeTeamImage?: string;
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
  const [, setVotedForId] = useState<string | null>(null);

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
        // Update cache with new match data
        cacheManager.updateMatchesCache(data.match);

        setMatch(prev => prev && prev.id === matchId ? { ...prev, availableUsers: data.match.availableUsers } : prev);
      }
    } finally {
      setAvailabilityLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // const router = useRouter();

  return (
    <Box sx={{ p: { xs: 1, sm: 4 }, minHeight: '100vh' }}>
      {/* <Button
        startIcon={<ArrowLeft />}
        onClick={() => router.push(`/league/${match?.leagueId}`)}
        sx={{
          mb: 2, color: 'white', backgroundColor: '#388e3c',
          '&:hover': { backgroundColor: '#388e3c' },
          borderRadius: 2
        }}
      >
        Back to Current Match League
      </Button> */}
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
            homeTeamImg={match.homeTeamImage || '/assets/matches.png'}
            awayTeamImg={match.awayTeamImage || '/assets/matches.png'}
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
                  <Box sx={{ display: "flex", gap: 4, minWidth: 100 }}>
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
                          // background: '#185c34', // Add a distinct table background color
                          // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)', // Add a distinct table background color
                           background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                          borderRadius: 3,
                          p: 1,
                          fontSize: { xs: 11, sm: 13, md: 15 },
                        }}
                      >
                        <Box sx={{ minWidth: 600 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center", fontSize: 17, color: '#fff', mt: 2 }}>
                            {match.awayTeamName} Players
                          </Typography>
                          <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                          <Box
                            sx={{
                          background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
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


                          <Box>
                            {match.awayTeamUsers.map((player, idx) => {
                              const stats = player.statistics?.[0] || {}
                              let badgeImg = null;
                              // let rowBg = 'rgba(255,255,255,0.1)';
                              // let rowGradient = null;
                              let textColor = '#fff';
                              let fontWeight = 500;
                              if (idx === 0) {
                                // rowGradient = 'rgba(255,255,255,0.1)'; // gold/orange
                                textColor = '#fff';
                                fontWeight = 700;
                                badgeImg = FirstBadge;
                              } else if (idx === 1) {
                                // rowBg = 'rgba(255,255,255,0.1)'; // silver
                                badgeImg = SecondBadge;
                              } else if (idx === 2) {
                                // rowBg = 'rgba(255,255,255,0.1)'; // bronze
                                badgeImg = ThirdBadge;
                              } else {
                                // rowBg = 'rgba(255,255,255,0.1)';
                              }
                              return (
                                <React.Fragment key={player.id}>
                                  <Link href={`/player/${player.id}`} passHref>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        p: 2,
                                        // background: rowGradient ? rowGradient : rowBg,
                                         background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                                        color: textColor,
                                        fontWeight,
                                        boxShadow: 3,
                                        minHeight: 70,
                                        gap: 2,
                                      }}
                                    >

                                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, minWidth: 44 }}>

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
                                    <Divider sx={{ backgroundColor: '#fff', height: 2, mb: 0, mt: 0 }} />
                                  </Link>
                                </React.Fragment>
                              )
                            })}
                          </Box>
                        </Box>
                      </Box>
                    </Box>

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
                          // background: '#185c34', // Add a distinct table background color
                          // background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)', // Add a distinct table background color
                           background: 'linear-gradient(90deg, #767676 0%, #000000 100%)',
                          borderRadius: 3,
                          p: 1,
                          fontSize: { xs: 11, sm: 13, md: 15 },
                        }}
                      >
                        <Box sx={{ minWidth: 600 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center", fontSize: 17, color: '#fff', mt: 2 }}>
                            {match.homeTeamName} Players
                          </Typography>
                          <Divider sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                          {/* Header */}
                          <Box
                            sx={{
                              // bgcolor: "rgba(255,255,255,0.1)",
                               background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
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
                              // let rowBg = 'rgba(255,255,255,0.1)';
                              // let rowGradient = null;
                              let textColor = '#fff';
                              let fontWeight = 500;
                              if (idx === 0) {
                                // rowGradient = 'rgba(255,255,255,0.1)'; // gold/orange
                                textColor = '#fff';
                                fontWeight = 700;
                                badgeImg = FirstBadge;
                              } else if (idx === 1) {
                                // rowBg = 'rgba(255,255,255,0.1)'; // silver
                                badgeImg = SecondBadge;
                              } else if (idx === 2) {
                                // rowBg = 'rgba(255,255,255,0.1)'; // bronze
                                badgeImg = ThirdBadge;
                              } else {
                                // rowBg = 'rgba(255,255,255,0.1)';
                              }
                              return (
                                <React.Fragment key={player.id}>
                                  <Link href={`/player/${player.id}`} passHref>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        p: 2,
                                        // background: rowGradient ? rowGradient : rowBg,
                                        color: textColor,
                                         background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
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
                                    <Divider sx={{ backgroundColor: '#fff', height: 2, mb: 0, mt: 0 }} />
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
                  <Box sx={{ display: "flex", gap: 2, mb: 3, justifyContent: "center" }}>
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
                      {match.homeTeamName} Team
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
                      {match.awayTeamName} Team
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      // p: 1,
                      borderRadius: 3,
                      background: "#185c34",
                      boxShadow: 2,
                      overflowX: "auto",
                      minWidth: 0,
                      maxWidth: { xs: "100%", sm: 800 }, // width increased
                      width: "100%",
                      fontSize: { xs: 11, sm: 13, md: 15 },
                      mx: "auto",
                    }}
                  >
                    <Box sx={{ minWidth: 350 }}> {/* minWidth set */}
                      <div className="w-full mx-auto">
                        <Card sx={{ backgroundColor: '#185c34' }} className="bg-[#185c34] border-green-700 text-white overflow-hidden rounded-xl">
                          <div className="p-3">
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                color: "white",
                                fontSize: { xs: 13, sm: 18 },
                              }}
                            >
                              {selectedTeam === "home" ? match.homeTeamName : match.awayTeamName} Players
                            </Typography>
                          </div>

                          <div className="px-2 pb-2">
                            <div className="bg-[#43a047] rounded-lg px-2 py-1 mb-2 flex items-center">
                              <div className="text-white font-bold text-xs sm:text-sm md:text-base">Pos</div>
                              <div className="ml-2 flex-1 text-white font-bold text-xs sm:text-sm md:text-base">Player</div>
                              <div className="flex gap-0.5 sm:gap-1 md:gap-4 text-white font-bold">
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">No</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">Gs</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">As</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">CS</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">Plt</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">FK</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">Df</div>
                                <div className="min-w-7 text-center text-xs sm:text-sm md:text-base">Imp</div>
                              </div>
                            </div>

                            <div className="space-y-[1px]">
                              {(selectedTeam === "home" ? match.homeTeamUsers : match.awayTeamUsers).map((player, index) => {
                                const position = index + 1;
                                const badge = getBadgeForPosition(position);
                                // const points = player.wins * 3 + player.;
                                const firstName = player.firstName.split(" ")[0] || player.firstName; // Ensure first name exists
                                const lastName = player.lastName.split(" ").slice(1).join(" ") || ""; // Handle single-name cases

                                return (
                                  <Link key={player.id} href={`/player/${player.id}`} className="block">
                                    <div className={`${getRowStyles(index)} px-2 py-1.5 min-h-[60px] flex items-start`}>
                                      <div className="w-9 flex items-center justify-center mr-1">
                                        {index < 3 ? (
                                          <div className="w-8 h-8 flex items-center justify-center">{badge}</div>
                                        ) : (
                                          <div className="w-7 h-7 flex items-center justify-center font-bold text-white text-xs sm:text-sm md:text-base">
                                            {badge}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col max-[500px]:flex-col min-[500px]:flex-row items-start min-w-0">
                                        <div className="max-[500px]:mb-2">
                                          <div className="w-11 h-11 max-[500px]:w-8 max-[500px]:h-8 rounded-full overflow-hidden bg-white border-2 border-white flex-shrink-0">
                                            <img
                                              src={player.profilePicture || "/placeholder.svg"}
                                              alt={player.firstName + " " + player.lastName}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5 max-[500px]:-ml-8 min-[500px]:ml-2">

                                          <div className="flex items-center ">
                                            <div className="text-white font-normal text-xs sm:text-sm md:text-base uppercase max-[500px]:text-[10px] min-[500px]:block whitespace-nowrap overflow-hidden text-ellipsis">
                                              {firstName + " " + lastName}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-0.5 sm:gap-1 md:gap-2 ml-auto items-center max-[500px]:mt-4">
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                          {player.shirtNumber || "0"}
                                        </div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                          {player.statistics?.[0]?.goals ?? 0}
                                        </div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                          {player.statistics?.[0]?.assists ?? 0}
                                        </div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                          {player.statistics?.[0]?.cleanSheets ?? 0}
                                        </div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                          {player.statistics?.[0]?.penalties ?? 0}
                                        </div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">{player?.statistics?.[0]?.freeKicks ?? 0}</div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">
                                          {player?.statistics?.[0]?.defence ?? 0}
                                        </div>
                                        <div className="min-w-7 text-center text-white text-xs sm:text-sm md:text-base">{player?.statistics?.[0]?.impact ?? 0}</div>
                                      </div>
                                    </div>
                                    <div className="h-[1px] bg-white"></div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      </div>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          <div style={{ background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)' }} className="p-6 mt-8 text-white rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">MOTM Votes</h2>
            <div className="w-full h-px bg-white mb-6"></div>

            {/* Grid layout: 3 cards on larger screens, then 2 cards, and responsive for mobile */}
            <div className="grid grid-cols-1 max-[500px]:grid-cols-1 min-[501px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-2 gap-6">
              {[...match.homeTeamUsers, ...match.awayTeamUsers]
                .filter(player => playerVotes[player.id] > 0)
                .map((player) => (
                  <Link key={player.id} href={`/player/${player.id}`}>
                    <div className="group">
                      {/* Mobile layout: Image on top center */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 bg-[#0a4822] rounded-lg border border-[#43a047] min-h-[80px] sm:min-h-[100px] hover:bg-[#1f673b] hover:-translate-y-1 transition-all duration-200 ease-in-out">
                        {/* Profile Image */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-[#43a047] mb-3 sm:mb-0 sm:mr-4 flex-shrink-0">
                          <img
                            src={player.profilePicture || "/placeholder.svg?height=60&width=60&query=football player"}
                            alt={`${player.firstName} ${player.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 truncate leading-tight">
                            {player.firstName} {player.lastName}
                            {player.id === match.homeCaptainId ? " (C)" : ""}
                          </h3>

                          <p className="text-[#B2DFDB] text-xs sm:text-sm md:text-base mb-2 sm:mb-3 leading-tight">
                            {player.positionType || "Player"}
                          </p>

                          {/* Buttons */}
                          <div className="flex justify-center sm:justify-start gap-2 items-center">
                            <Button
                              variant="contained"
                              size="small"
                              className="bg-gradient-to-r from-[#43a047] to-[#388e3c] hover:from-[#388e3c] hover:to-[#2e7d32] text-white rounded-md px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold h-6 sm:h-7 min-w-0"
                            >
                              Shirt No {player.shirtNumber || "0"}
                            </Button>

                            <Button
                              variant="contained"
                              size="small"
                              className="bg-gradient-to-r from-[#43a047] to-[#388e3c] hover:from-[#388e3c] hover:to-[#2e7d32] text-white rounded-md px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold h-6 sm:h-7 min-w-0"
                            >
                              {typeof playerVotes[player.id] === "number" &&
                                playerVotes[player.id] > 0 &&
                                `${playerVotes[player.id]} vote${playerVotes[player.id] > 1 ? "s" : ""}`}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}
    </Box>
  );
} 