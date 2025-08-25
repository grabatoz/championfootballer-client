"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Link from "next/link"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import { Add } from "@mui/icons-material"
import PlayerStatsDialog from './PlayerStatsDialog'
import { useAuth } from '@/lib/hooks'

interface MatchSummaryProps {
  homeTeamName: string
  awayTeamName: string
  homeTeamImg: string
  awayTeamImg: string
  homeGoals: number
  awayGoals: number
  leagueName: string
  leagueId: string
  currentMatch: number
  totalMatches: number
  matchStartTime: string // ISO string
  possessionLeft: number // 0-100
  possessionRight: number // 0-100
  winPercentLeft: number // 0-100
  winPercentRight: number // 0-100
  matchStatus: string // 'not_started' | 'started' | 'completed'
  matchEndTime?: string // ISO string, only for completed
  matchId: string
  isUserAvailable: boolean
  availabilityLoading: { [matchId: string]: boolean }
  handleToggleAvailability: (matchId: string, isAvailable: boolean) => void
}

const getElapsedTime = (startTime: string, endTime?: string) => {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const diff = end - start
  if (diff < 0) return "00:00"
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const MatchSummary: React.FC<MatchSummaryProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamImg,
  awayTeamImg,
  homeGoals,
  awayGoals,
  leagueName,
  leagueId,
  currentMatch,
  totalMatches,
  matchStartTime,
  winPercentLeft,
  winPercentRight,
  matchStatus,
  matchEndTime,
  matchId,
  isUserAvailable,
  availabilityLoading,
  handleToggleAvailability,
}) => {
  const [, setElapsed] = useState("00:00")
  const isDraw = matchStatus === "completed" && homeGoals === awayGoals
  const { token, user } = useAuth()

  // Stats dialog state
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    penalties: 0,
    freeKicks: 0,
    defence: 0,
    impact: 0,
  })
  const [isSubmittingStats, setIsSubmittingStats] = useState(false)

  // Stat change handler
  const handleStatChange = (stat: keyof typeof stats, increment: number, max: number) => {
    setStats(prev => {
      const newValue = Math.max(0, (prev[stat] || 0) + increment)
      return { ...prev, [stat]: Math.min(newValue, max) }
    })
  }

  // Fetch existing stats for the player in this match
  const fetchExistingStats = async (matchId: string) => {
    if (!token || !user) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats?playerId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.status === 404 || response.status === 405) {
        setStats({ 
          goals: 0, 
          assists: 0, 
          cleanSheets: 0, 
          penalties: 0, 
          freeKicks: 0, 
          defence: 0, 
          impact: 0 
        })
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.stats) {
        setStats({
          goals: data.stats.goals || 0,
          assists: data.stats.assists || 0,
          cleanSheets: data.stats.cleanSheets || 0,
          penalties: data.stats.penalties || 0,
          freeKicks: data.stats.freeKicks || 0,
          defence: data.stats.defence || 0,
          impact: data.stats.impact || 0,
        })
      } else {
        setStats({ 
          goals: 0, 
          assists: 0, 
          cleanSheets: 0, 
          penalties: 0, 
          freeKicks: 0, 
          defence: 0, 
          impact: 0 
        })
      }
    } catch (error) {
      console.error('Failed to fetch existing stats:', error)
      setStats({ 
        goals: 0, 
        assists: 0, 
        cleanSheets: 0, 
        penalties: 0, 
        freeKicks: 0, 
        defence: 0, 
        impact: 0 
      })
    }
  }

  // Save stats to backend
  const handleSaveStats = async () => {
    if (!matchId || !token) return
    
    setIsSubmittingStats(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/stats`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: stats.goals,
          assists: stats.assists,
          cleanSheets: stats.cleanSheets,
          penalties: stats.penalties,
          freeKicks: stats.freeKicks,
          defence: stats.defence,
          impact: stats.impact,
        }),
      })
      
      if (response.status === 404 || response.status === 405) {
        console.error('Stats saving is not available yet. Please contact the administrator.')
        setStatsDialogOpen(false)
        return
      }
      
      const data = await response.json()
      if (data.success) {
        setStatsDialogOpen(false)
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmittingStats(false)
    }
  }

  // Get match goals for the active match
  const getMatchGoals = () => {
    return homeGoals + awayGoals
  }

  useEffect(() => {
    if (matchStatus === "started") {
      setElapsed(getElapsedTime(matchStartTime))
      const interval = setInterval(() => {
        setElapsed(getElapsedTime(matchStartTime))
      }, 1000)
      return () => clearInterval(interval)
    } else if (matchStatus === "completed" && matchEndTime) {
      setElapsed(getElapsedTime(matchStartTime, matchEndTime))
    } else {
      setElapsed("00:00")
    }
  }, [matchStatus, matchStartTime, matchEndTime])

  const showPredictionBar = matchStatus !== "completed"

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          p: { xs: 2, md: 3 },
          // background: "#1f673b",
          // background: "linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)",
          background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.06)",
          borderRadius: 3,
          width: "100%",
          maxWidth: 900,
          mx: "auto",
          mb: 3,
          border: "1px solid #f0f0f0",
          position: "relative"
        }}
      >
        {/* Match Status - Top Left */}
        <Box sx={{
          position: 'absolute', 
          top: 8, 
          left: 8, 
          zIndex: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#fff',
                fontWeight: 'bold',
                fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem' }
              }}
            >
              Match Status:
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                //  bgcolor: '#2B2B2B',
                backgroundColor: matchStatus === 'completed' ? '#2B2B2B' : '#2B2B2B',
                px: { xs: 1, sm: 1.5, md: 2 },
                py: { xs: 0.3, sm: 0.5, md: 0.7 },
                borderRadius: 1,
                fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem' }
              }}
            >
              {matchStatus === 'completed' ? 'COMPLETED' : 'UPCOMING'}
            </Typography>
          </Box>
        </Box>

        {/* League Name - Centered */}
        <Link href={`/league/${leagueId}`} passHref>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 },
              color: "white",
              fontWeight: 600,
              textAlign: "center",
              width: "100%",
              mt: { xs: 3, sm: 2, md: 1 }, // Add top margin to avoid overlap with status
              mb: { xs: 1, md: 2 },
            }}
          >
            League Name : <span className="underline">{leagueName}</span> &nbsp;·&nbsp; Game {currentMatch} of{" "}
            {totalMatches}
          </Typography>
        </Link>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", sm: "row" }, // Keep sm as row, xs as column
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: { xs: 1, sm: 2, md: 4 }, // Reduced gap for xs, increased for larger screens
            my: { xs: 1, sm: 0 }, // Added vertical margin for spacing when stacked
          }}
        >
          {/* Home Team */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" }, // Stack vertically on xs, row on sm+
              alignItems: "center",
              flex: 1,
              minWidth: 0,
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "center", sm: "flex-start" },
              gap: { xs: 1, sm: 2 }, // Gap between image and text
            }}
          >
            <Box
              component="img"
              src={homeTeamImg}
              alt={homeTeamName}
              sx={{
                height: { xs: 80, sm: 90, md: 120, lg: 130, xl: 150 }, // More responsive image sizes
                width: { xs: 65, sm: 70, md: 100, lg: 120, xl: 130 }, // More responsive image sizes
                maxWidth: { xs: 150, sm: 150, md: 200 },
                p: { xs: 0, sm: 0, md: 1 },
                color: "white",
                borderRadius: 2,
                // Remove marginRight for xs since we're stacking vertically
                marginRight: { sm: 5, md: 1 },
                // objectFit: "contain", // Ensure image fits without cropping
              }}
            />
            <Box sx={{
              minWidth: 0,
              textAlign: { xs: "center", sm: "left" },
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", sm: "flex-start" }
            }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: 12, sm: 14, md: 18, lg: 22, xl: 26 }, color: "white", lineHeight: 1.2 }}
              >
                {homeTeamName}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ fontSize: { xs: 16, sm: 20, md: 28, lg: 34, xl: 40 }, color: "#fff", lineHeight: 1 }}
              >
                {homeGoals}
              </Typography>
            </Box>
          </Box>

          {/* Center VS */}
          <Box
            sx={{
              flex: { xs: "0 0 auto", sm: 0.5, md: 0.5 }, // Changed flex for xs to prevent vertical expansion
              textAlign: "center",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              my: { xs: 1, sm: 0 }, // Added vertical margin for spacing when stacked
            }}
          >
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ fontSize: { xs: 24, sm: 30, md: 38, lg: 44, xl: 48 }, color: "white", letterSpacing: 2, mb: 0.5, mt: { xs: -3, sm: 0, md: 0 } }}
            >
              VS
            </Typography>
          </Box>

          {/* Away Team */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" }, // Stack vertically on xs, row on sm+
              alignItems: "center",
              flex: 1,
              minWidth: 0,
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "center", sm: "flex-end" }, // Changed to flex-end for away team
              gap: { xs: 1, sm: 2 }, // Gap between image and text
            }}
          >
            {/* For larger screens, show goals first (left), then image (right) */}
            <Box sx={{
              minWidth: 0,
              textAlign: { xs: "center", sm: "right" }, // Right align text for away team
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", sm: "flex-end" }, // Right align for away team
              order: { xs: 2, sm: 1 } // On xs: goals below image, on sm+: goals first (left)
            }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: 12, sm: 14, md: 18, lg: 22, xl: 26 }, color: "white", lineHeight: 1.2 }}
              >
                {awayTeamName}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ fontSize: { xs: 16, sm: 20, md: 28, lg: 34, xl: 40 }, color: "#fff", lineHeight: 1 }}
              >
                {awayGoals}
              </Typography>
            </Box>
            <Box
              component="img"
              src={awayTeamImg}
              alt={awayTeamName}
              sx={{
                height: { xs: 80, sm: 90, md: 120, lg: 130, xl: 150 }, // More responsive image sizes
                width: { xs: 65, sm: 70, md: 100, lg: 120, xl: 130 }, // More responsive image sizes
                maxWidth: { xs: 150, sm: 150, md: 200 },
                p: { xs: 0, sm: 0, md: 1 },
                color: "white",
                borderRadius: 2,
                marginLeft: { sm: 5, md: 1 }, // Add margin left for larger screens
                order: { xs: 1, sm: 2 } // On xs: image first (top), on sm+: image second (right)
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            width: "100%",
            pt: { xs: 1, md: 2 }, // Reduced padding top for xs
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            color: "#fff",
            fontSize: 15,
            gap: { xs: 1, md: 0 }, // Reduced gap for xs
          }}
        >
          {/* Buttons: on top for xs, center for md+ */}
          <Box
            sx={{
              display: "flex",
              flex: 1,
              justifyContent: { xs: "center", md: "flex-end" },
              gap: { xs: 1, sm: 2 },
              order: { xs: 1, md: 2 },
            }}
          >
          
            {matchStatus !== "completed" ? (
              <Button
                variant="contained"
                onClick={() => handleToggleAvailability(matchId, isUserAvailable)}
                disabled={availabilityLoading[matchId]}
                sx={{
                  backgroundColor: isUserAvailable ? "#4caf50" : "#f44336",
                  "&:hover": {
                    backgroundColor: isUserAvailable ? "#388e3c" : "#d32f2f",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                    color: "rgba(255,255,255,0.5)",
                  },
                  fontSize: { xs: "0.6rem", sm: "0.7rem", md: "0.75rem", lg: "0.875rem" }, // More responsive font sizes
                  px: { xs: 1, sm: 1.5, md: 2 }, // More responsive padding
                  py: { xs: 0.3, sm: 0.5, md: 0.7, lg: 1 }, // More responsive padding
                  minWidth: { xs: "auto", sm: 120, md: 140 }, // More responsive min width
                }}
              >
                {availabilityLoading[matchId] ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isUserAvailable ? (
                  "Unavailable"
                ) : (
                  "Available"
                )}
              </Button>
            ) : (
              <>
                <Link href={`/league/${leagueId}/match/${matchId}/play`} passHref>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Add />}
                    sx={{
                      bgcolor: "#2B2B2B",
                      color: "white",
                      fontWeight: "bold",
                      "&:hover": { bgcolor: "#2B2B2B" },
                      fontSize: { xs: "0.5rem", sm: "0.6rem", md: "0.7rem", lg: "0.8rem" },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      py: { xs: 0.3, sm: 0.5, md: 0.7, lg: 1 },
                      minWidth: { xs: "auto", sm: 120, md: 140 },
                    }}
                  >
                    Update Score Card
                  </Button>
                </Link>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => {
                    setStatsDialogOpen(true)
                    fetchExistingStats(matchId)
                  }}
                  sx={{
                    bgcolor: "#2B2B2B",
                    color: "white",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "#2B2B2B" },
                    fontSize: { xs: "0.5rem", sm: "0.6rem", md: "0.7rem", lg: "0.8rem" },
                    px: { xs: 1, sm: 1.5, md: 2 },
                    py: { xs: 0.3, sm: 0.5, md: 0.7, lg: 1 },
                    minWidth: { xs: "auto", sm: 120, md: 140 },
                  }}
                >
                  Add Your Stats
                </Button>
              </>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", md: "flex-start" },
              order: { xs: 2, md: 1 },
              width: { xs: "100%", md: "auto" },
            }}
          >
            <Typography sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem", md: "0.8rem", lg: "0.9rem" } }}>
              Start: {new Date(matchStartTime).toLocaleString()}
            </Typography>
            {matchStatus === "completed" && matchEndTime && (
              <Typography sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem", md: "0.8rem", lg: "0.9rem" } }}>
                End: {new Date(matchEndTime).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      {showPredictionBar && (
        <Box sx={{ mt: 1, width: "100%", maxWidth: 900, mx: "auto", position: "relative" }}>
          {isDraw ? (
            <>
              <Typography
                sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }, color: "#888", mb: 0.5 }}
              >
                Draw
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                <Typography
                  sx={{
                    minWidth: 44,
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: { xs: 10, sm: 12, md: 14, lg: 18, xl: 20 },
                    color: "#888",
                  }}
                >
                  0%
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    mx: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 18,
                    borderRadius: 9,
                    background: "#e0e0e0",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 9,
                      background: "#bdbdbd",
                      opacity: 0.5,
                      position: "absolute",
                      left: 0,
                      top: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: 10, sm: 12, md: 14, lg: 18, xl: 20 },
                      color: "#888",
                      textAlign: "center",
                      width: "100%",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    100%
                  </Typography>
                </Box>
                <Typography
                  sx={{ minWidth: 44, textAlign: "left", fontWeight: 700, fontSize: { xs: 10, sm: 12, md: 14, lg: 18, xl: 20 }, color: "#888" }}
                >
                  0%
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography
                sx={{
                  minWidth: 44,
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: { xs: 10, sm: 12, md: 14, lg: 18, xl: 20 },
                  color: winPercentLeft > winPercentRight ? "#1976d2" : "#888",
                }}
              >
                {winPercentLeft}%
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  mx: 2,
                  display: "flex",
                  alignItems: "center",
                  height: 18,
                  borderRadius: 9,
                  background: "#e3eafc",
                  boxShadow: "0 1px 4px 0 rgba(25, 118, 210, 0.07)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: `${winPercentLeft}%`,
                    height: "100%",
                    background:
                      winPercentLeft > winPercentRight
                        ? "linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)"
                        : "#e3eafc",
                    transition: "width 0.5s",
                    borderTopLeftRadius: 9,
                    borderBottomLeftRadius: 9,
                  }}
                />
                <Box
                  sx={{
                    width: `${winPercentRight}%`,
                    height: "100%",
                    background:
                      winPercentRight > winPercentLeft
                        ? "linear-gradient(90deg, #d32f2f 60%, #ff7961 100%)"
                        : "#e3eafc",
                    transition: "width 0.5s",
                    borderTopRightRadius: 9,
                    borderBottomRightRadius: 9,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  minWidth: 44,
                  textAlign: "left",
                  fontWeight: 700,
                  fontSize: { xs: 10, sm: 12, md: 14, lg: 18, xl: 20 },
                  color: winPercentRight > winPercentLeft ? "#d32f2f" : "#888",
                }}
              >
                {winPercentRight}%
              </Typography>
            </Box>
          )}
        </Box>
      )}
      <PlayerStatsDialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        onSave={handleSaveStats}
        isSubmitting={isSubmittingStats}
        stats={stats}
        handleStatChange={handleStatChange}
        teamGoals={getMatchGoals()}
      />
    </Box>
  )
}

export default MatchSummary 