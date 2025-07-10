"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Avatar } from "@mui/material";
import { useAuth } from '@/lib/hooks';
import MatchSummary from '@/Components/MatchSummary';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
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
            homeTeamImg={match.homeTeamUsers[0]?.profilePicture ? (match.homeTeamUsers[0].profilePicture.startsWith('http') ? match.homeTeamUsers[0].profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${match.homeTeamUsers[0].profilePicture.startsWith('/') ? match.homeTeamUsers[0].profilePicture : '/' + match.homeTeamUsers[0].profilePicture}`) : '/assets/matches.png'}
            awayTeamImg={match.awayTeamUsers[0]?.profilePicture ? (match.awayTeamUsers[0].profilePicture.startsWith('http') ? match.awayTeamUsers[0].profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${match.awayTeamUsers[0].profilePicture.startsWith('/') ? match.awayTeamUsers[0].profilePicture : '/' + match.awayTeamUsers[0].profilePicture}`) : '/assets/matches.png'}
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
          {/* Responsive player stats tables */}
          {/* {isLargeScreen ? (
            <Box sx={{ width: '100%', overflowX: 'auto', mt: 4, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              <Box sx={{ display: 'flex', gap: 4, minWidth: 900 }}>
                <Box sx={{ flex: 1, scrollbarWidth: 'none', maxWidth: 610, minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', fontSize: 17 }}>{match.awayTeamName} Players</Typography>
                  <Box sx={{ width: '100%', maxHeight: 420, overflowY: 'auto', boxShadow: 1, background: '#fff', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
                      <thead>
                        <tr style={{ background: '#14c38e' }}>
                          <th style={{ padding: 6, textAlign: 'left', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>Player</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 70, color: '#fff' }}>Shirt No</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 30, color: '#fff' }}>Gs</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 30, color: '#fff' }}>As</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 45, color: '#fff' }}>CS</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>Plt</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>FK</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 35, color: '#fff' }}>Df</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 35, color: '#fff' }}>Imp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {match.awayTeamUsers.map((player) => {
                          const stats = player.statistics?.[0] || {};
                          return (
                            <tr key={player.id} style={{ borderBottom: '1px solid #f0f0f0', background: '#fff', color: '#222' }}>
                              <td style={{ padding: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <Avatar src={player?.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : `/${player.profilePicture}`}`) : undefined} sx={{ width: 28, height: 28, mr: 1 }} />
                                <span style={{ fontWeight: 600 }}>{player.firstName} {player.lastName}</span>
                              </td>
                              <td style={{ padding: 6, textAlign: 'center', fontWeight: 500, fontSize: 13 }}>{player.shirtNumber || '0'}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.goals ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.assists ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.cleanSheets ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.penalties ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.freeKicks ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.defence ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.impact ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, maxWidth: 610, minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', fontSize: 17 }}>{match.homeTeamName} Players</Typography>
                  <Box sx={{ width: '100%', maxHeight: 420, overflowY: 'auto', boxShadow: 1, background: '#fff', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
                      <thead>
                      <tr style={{ background: '#14c38e' }}>
                          <th style={{ padding: 6, textAlign: 'left', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>Player</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 70, color: '#fff' }}>Shirt No</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 30, color: '#fff' }}>Gs</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 30, color: '#fff' }}>As</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 45, color: '#fff' }}>CS</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>Plt</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>FK</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 35, color: '#fff' }}>Df</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 35, color: '#fff' }}>Imp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {match.homeTeamUsers.map((player) => {
                          const stats = player.statistics?.[0] || {};
                          return (
                            <tr key={player.id} style={{ borderBottom: '1px solid #f0f0f0', background: '#fff', color: '#222' }}>
                              <td style={{ padding: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <Avatar src={player?.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : `/${player.profilePicture}`}`) : undefined} sx={{ width: 28, height: 28, mr: 1 }} />
                                <span style={{ fontWeight: 600 }}>{player.firstName} {player.lastName}</span>
                              </td>
                              <td style={{ padding: 6, textAlign: 'center', fontWeight: 500, fontSize: 13 }}>{player.shirtNumber || '0'}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.goals ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.assists ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.cleanSheets ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.penalties ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.freeKicks ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.defence ?? 0}</td>
                              <td style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>{stats.impact ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center', mt: 4 }}>
                <Button
                  variant={selectedTeam === 'home' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTeam('home')}
                  sx={{ minWidth: 120, fontWeight: 'bold', bgcolor: selectedTeam === 'home' ? '#43a047' : 'white', color: selectedTeam === 'home' ? 'white' : 'black' }}
                >
                  {match.homeTeamName}
                </Button>
                <Button
                  variant={selectedTeam === 'away' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTeam('away')}
                  sx={{ minWidth: 120, fontWeight: 'bold', bgcolor: selectedTeam === 'away' ? '#43a047' : 'white', color: selectedTeam === 'away' ? 'white' : 'black' }}
                >
                  {match.awayTeamName}
                </Button>
              </Box>
              <Paper sx={{ p: 3, borderRadius: 3, background: 'white', boxShadow: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{selectedTeam === 'home' ? match.homeTeamName : match.awayTeamName} Players</Typography>
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                    <tr style={{ background: '#14c38e' }}>
                          <th style={{ padding: 6, textAlign: 'left', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>Player</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 70, color: '#fff' }}>Shirt No</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 30, color: '#fff' }}>Gs</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 30, color: '#fff' }}>As</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 45, color: '#fff' }}>CS</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>Plt</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 40, color: '#fff' }}>FK</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 35, color: '#fff' }}>Df</th>
                          <th style={{ padding: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', minWidth: 35, color: '#fff' }}>Imp</th>
                        </tr>
                    </thead>
                    <tbody>
                      {(selectedTeam === 'home' ? match.homeTeamUsers : match.awayTeamUsers).map((player) => {
                        const stats = player.statistics?.[0] || {};
                        return (
                          <tr key={player.id} style={{ borderBottom: '1px solid #f0f0f0', background: '#fff', color: '#222' }}>
                            <td style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Avatar src={player.profilePicture ? (player.profilePicture.startsWith('http') ? player.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${player.profilePicture.startsWith('/') ? player.profilePicture : '/' + player.profilePicture}`) : undefined} sx={{ width: 40, height: 40, mr: 1 }} />
                              <span style={{ fontWeight: 600 }}>{player.firstName} {player.lastName}</span>
                            </td>
                            <td style={{ padding: 10, textAlign: 'center', fontWeight: 500 }}>{player.shirtNumber || '0'}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.goals ?? 0}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.assists ?? 0}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.cleanSheets ?? 0}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.penalties ?? 0}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.freeKicks ?? 0}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.defence ?? 0}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>{stats.impact ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            </>
          )} */}
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
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center", fontSize: 17 }}>
                  {match.awayTeamName} Players
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    maxHeight: 420,
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
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
                    <Box sx={{ flex: 1, color: "white", fontWeight: "bold", fontSize: 14 }}>Player</Box>
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
                    {match.awayTeamUsers.map((player) => {
                      const stats = player.statistics?.[0] || {}
                      return (
                        <Box
                          key={player.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            p: 2,
                            borderRadius: 4,
                            background: "#0a3e1e",
                            color: "white",
                            boxShadow: 3,
                            minHeight: 70,
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <Box sx={{ mr: 2 }}>
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
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center", fontSize: 17 }}>
                  {match.homeTeamName} Players
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    maxHeight: 420,
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
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
                    <Box sx={{ flex: 1, color: "white", fontWeight: "bold", fontSize: 14 }}>Player</Box>
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
                    {match.homeTeamUsers.map((player) => {
                      const stats = player.statistics?.[0] || {}
                      return (
                        <Box
                          key={player.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            p: 2,
                            borderRadius: 4,
                            background: "#0a3e1e",
                            color: "white",
                            boxShadow: 3,
                            minHeight: 70,
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <Box sx={{ mr: 2 }}>
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
            <Box sx={{ p: 3, borderRadius: 3, background: "white", boxShadow: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                {selectedTeam === "home" ? match.homeTeamName : match.awayTeamName} Players
              </Typography>

              {/* Header */}
              <Box
                sx={{ bgcolor: "#43a047", borderRadius: 3, px: 2, py: 1, mb: 2, display: "flex", alignItems: "center" }}
              >
                <Box sx={{ flex: 1, color: "white", fontWeight: "bold", fontSize: 14 }}>Player</Box>
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
                {(selectedTeam === "home" ? match.homeTeamUsers : match.awayTeamUsers).map((player) => {
                  const stats = player.statistics?.[0] || {}
                  return (
                    <Box
                      key={player.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                        p: 2,
                        borderRadius: 4,
                        background: "#0a3e1e",
                        color: "white",
                        boxShadow: 3,
                        minHeight: 70,
                        gap: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <Box sx={{ mr: 2 }}>
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
                        <Typography variant="body2" sx={{ fontWeight: "medium", color: "white", fontSize: 14 }}>
                          {player.firstName} {player.lastName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
                        <Box sx={{ minWidth: 50, textAlign: "center", fontSize: 14 }}>{player.shirtNumber || "0"}</Box>
                        <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.goals ?? 0}</Box>
                        <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.assists ?? 0}</Box>
                        <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.cleanSheets ?? 0}</Box>
                        <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.penalties ?? 0}</Box>
                        <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.freeKicks ?? 0}</Box>
                        <Box sx={{ minWidth: 30, textAlign: "center", fontSize: 14 }}>{stats.defence ?? 0}</Box>
                        <Box sx={{ minWidth: 35, textAlign: "center", fontSize: 14 }}>{stats.impact ?? 0}</Box>
                      </Box>
                    </Box>
                  )
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