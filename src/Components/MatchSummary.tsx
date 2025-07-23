import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { Add } from '@mui/icons-material';

interface MatchSummaryProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamImg: string;
  awayTeamImg: string;
  homeGoals: number;
  awayGoals: number;
  leagueName: string;
  leagueId: string; // <-- add this
  currentMatch: number;
  totalMatches: number;
  matchStartTime: string; // ISO string
  possessionLeft: number; // 0-100
  possessionRight: number; // 0-100
  winPercentLeft: number; // 0-100
  winPercentRight: number; // 0-100
  matchStatus: string; // 'not_started' | 'started' | 'completed'
  matchEndTime?: string; // ISO string, only for completed
  matchId: string;
  isUserAvailable: boolean;
  availabilityLoading: { [matchId: string]: boolean };
  handleToggleAvailability: (matchId: string, isAvailable: boolean) => void;
}

const getElapsedTime = (startTime: string, endTime?: string) => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diff = end - start;
  if (diff < 0) return '00:00';
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const MatchSummary: React.FC<MatchSummaryProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamImg,
  awayTeamImg,
  homeGoals,
  awayGoals,
  leagueName,
  leagueId, // <-- add this
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
  const [, setElapsed] = useState('00:00');
  const isDraw = matchStatus === 'completed' && homeGoals === awayGoals;

  useEffect(() => {
    if (matchStatus === 'started') {
      setElapsed(getElapsedTime(matchStartTime));
      const interval = setInterval(() => {
        setElapsed(getElapsedTime(matchStartTime));
      }, 1000);
      return () => clearInterval(interval);
    } else if (matchStatus === 'completed' && matchEndTime) {
      setElapsed(getElapsedTime(matchStartTime, matchEndTime));
    } else {
      setElapsed('00:00');
    }
  }, [matchStatus, matchStartTime, matchEndTime]);

  // Remove prediction bar if match is completed
  const showPredictionBar = matchStatus !== 'completed';

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 2, md: 3 },
          background: '#1f673b',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)',
          borderRadius: 3,
          minHeight: { xs: 200, md: 160 },
          width: '100%',
          maxWidth: 900,
          mx: 'auto',
          mb: 3,
          border: '1px solid #f0f0f0',
        }}
      >
        <Link href={`/league/${leagueId}`}>
          <Typography variant="subtitle1" sx={{ fontSize: { xs: 16, md: 22}, color: 'white', fontWeight: 600, textAlign: 'center', width: '100%' }}>
            League Name : <span className='underline'>{leagueName}</span> &nbsp;·&nbsp; Game {currentMatch} of {totalMatches}
          </Typography>
        </Link>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' , sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Home Team */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
            <Box
              component="img"
              src={homeTeamImg}
              alt={homeTeamName}
              sx={{
                height: { xs: 140, md: 140 },
                mr: 2,
                // background: '#fff',
                maxWidth: { xs: 140, md: 140 },
                // boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
                p: 1,
                color: 'white',
                borderRadius: 2,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 18, md: 26 }, color: 'white' }}>{homeTeamName}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: 26, md: 40 }, color: '#14c38e', lineHeight: 1 }}>{homeGoals}</Typography>
            </Box>
          </Box>
          {/* Center VS */}
          <Box sx={{ flex: 2, textAlign: 'center', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: 28, md: 48 }, color: 'white', letterSpacing: 2, mb: 0.5 }}>
              VS
            </Typography>
          </Box>
          {/* Away Team */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
            <Box sx={{ textAlign: 'right', minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 18, md: 26 }, color: 'white' }}>{awayTeamName}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: 26, md: 40 }, color: '#14c38e', lineHeight: 1 }}>{awayGoals}</Typography>
            </Box>
            <Box
              component="img"
              src={awayTeamImg}
              alt={awayTeamName}
              sx={{
                height: { xs: 140, md: 140 },
                ml: 2,
                // background: '#fff',
                maxWidth: { xs: 140, md: 140 },
                // boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
                p: 1,
                borderRadius: 2,
              }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            width: '100%',
            pt: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            color: '#fff',
            fontSize: 15,
            gap: { xs: 2, md: 0 },
          }}
        >
          {/* Buttons: on top for xs, center for md+ */}
          <Box sx={{ display: 'flex', flex: 1, justifyContent: { xs: 'center', md: 'flex-end' }, gap: 2, order: { xs: 1, md: 2 } }}>
            <Link href={`/league/${leagueId}/match/${matchId}/play`} passHref>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                sx={{
                  bgcolor: '#43a047',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#388e3c' },
                }}
              >
                Your Stats
              </Button>
            </Link>
            {matchStatus !== 'completed' ? (
              <Button
                variant="contained"
                onClick={() => handleToggleAvailability(matchId, isUserAvailable)}
                disabled={availabilityLoading[matchId]}
                sx={{
                  backgroundColor: isUserAvailable ? '#4caf50' : '#f44336',
                  '&:hover': {
                    backgroundColor: isUserAvailable ? '#388e3c' : '#d32f2f'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.5)'
                  },
                  minWidth: 140
                }}
              >
                {availabilityLoading[matchId]
                  ? <CircularProgress size={20} color="inherit" />
                  : (isUserAvailable ? 'Unavailable' : 'Available')}
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled
                sx={{
                  '&.Mui-disabled': {
                    backgroundColor: '#43a047',
                    color: 'white',
                    '&:hover': { bgcolor: '#388e3c' },
                  }
                }}
              >
                Match Ended
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' }, order: { xs: 2, md: 1 }, width: { xs: '100%', md: 'auto' } }}>
            <Typography>
              Start: {new Date(matchStartTime).toLocaleString()}
            </Typography>
            {matchStatus === 'completed' && matchEndTime && (
              <Typography>
                End: {new Date(matchEndTime).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      {showPredictionBar && (
        <Box sx={{ mt: 1, width: '100%', maxWidth: 900, mx: 'auto', position: 'relative' }}>
          {isDraw ? (
            <>
              <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: { xs: 18, md: 24 }, color: '#888', mb: 0.5 }}>
                Draw
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                <Typography sx={{ minWidth: 44, textAlign: 'right', fontWeight: 700, fontSize: { xs: 16, md: 20 }, color: '#888' }}>0%</Typography>
                <Box sx={{ flex: 1, mx: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 18, borderRadius: 9, background: '#e0e0e0', position: 'relative' }}>
                  <Box sx={{ width: '100%', height: '100%', borderRadius: 9, background: '#bdbdbd', opacity: 0.5, position: 'absolute', left: 0, top: 0 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: 16, md: 20 }, color: '#888', textAlign: 'center', width: '100%', position: 'relative', zIndex: 1 }}>
                    100%
                  </Typography>
                </Box>
                <Typography sx={{ minWidth: 44, textAlign: 'left', fontWeight: 700, fontSize: { xs: 16, md: 20 }, color: '#888' }}>0%</Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography sx={{ minWidth: 44, textAlign: 'right', fontWeight: 700, fontSize: { xs: 16, md: 20 }, color: winPercentLeft > winPercentRight ? '#1976d2' : '#888' }}>
                {winPercentLeft}%
              </Typography>
              <Box sx={{ flex: 1, mx: 2, display: 'flex', alignItems: 'center', height: 18, borderRadius: 9, background: '#e3eafc', boxShadow: '0 1px 4px 0 rgba(25, 118, 210, 0.07)', overflow: 'hidden', position: 'relative' }}>
                <Box sx={{
                  width: `${winPercentLeft}%`,
                  height: '100%',
                  background: winPercentLeft > winPercentRight
                    ? 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)'
                    : '#e3eafc',
                  transition: 'width 0.5s',
                  borderTopLeftRadius: 9,
                  borderBottomLeftRadius: 9,
                }} />
                <Box sx={{
                  width: `${winPercentRight}%`,
                  height: '100%',
                  background: winPercentRight > winPercentLeft
                    ? 'linear-gradient(90deg, #d32f2f 60%, #ff7961 100%)'
                    : '#e3eafc',
                  transition: 'width 0.5s',
                  borderTopRightRadius: 9,
                  borderBottomRightRadius: 9,
                }} />
              </Box>
              <Typography sx={{ minWidth: 44, textAlign: 'left', fontWeight: 700, fontSize: { xs: 16, md: 20 }, color: winPercentRight > winPercentLeft ? '#d32f2f' : '#888' }}>
                {winPercentRight}%
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MatchSummary; 