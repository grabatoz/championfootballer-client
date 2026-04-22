# API Handover for App Developer

Generated: 2026-04-22T10:13:18.049Z

## Base URL

- `BASE_URL = process.env.NEXT_PUBLIC_API_URL`
- Local fallback in web code: `http://localhost:5000`
- Production fallback in web code: `https://championfootballer-server.onrender.com`

## Auth Format

- Protected APIs: `Authorization: Bearer <token>`
- Login/Register/Verification/Contact endpoints generally public.

## API List

| # | Method | Endpoint | Auth | Path Params | Query Params | Frontend Body Fields | Used On (Web) |
|---|---|---|---|---|---|---|---|
| 1 | POST | `{BASE_URL}/api/contact` | No | - | - | dynamic: JSON.stringify(value) | /contact |
| 2 | PATCH | `{BASE_URL}/api/leagues/:id` | Yes (Bearer token) | id | - | dynamic: leaguePatchPayload | /all-leagues |
| 3 | POST | `{BASE_URL}/api/leagues/:id/seasons` | Yes (Bearer token) | id | - | copyPlayers | /home |
| 4 | DELETE | `{BASE_URL}/api/leagues/:id/seasons/:seasonId` | Yes (Bearer token) | id, seasonId | - | - | /all-leagues |
| 5 | POST | `{BASE_URL}/api/leagues/:id/seasons/:seasonId/restore` | Yes (Bearer token) | id, seasonId | - | - | /all-leagues |
| 6 | PATCH | `{BASE_URL}/api/leagues/:id/seasons/:seasonId/status` | Yes (Bearer token) | id, seasonId | - | archived | /all-leagues |
| 7 | PATCH | `{BASE_URL}/api/leagues/:id/seasons/:selectedSeasonId` | Yes (Bearer token) | id, selectedSeasonId | - | archived, isActive | /all-leagues |
| 8 | POST | `{BASE_URL}/api/leagues/:id/seasons/:selectedSeasonId/archive` | Yes (Bearer token) | id, selectedSeasonId | - | archived | /all-leagues |
| 9 | PATCH | `{BASE_URL}/api/leagues/:id/seasons/:selectedSeasonId/status` | Yes (Bearer token) | id, selectedSeasonId | - | archived, active, isActive | /all-leagues |
| 10 | DELETE | `{BASE_URL}/api/seasons/:seasonId` | Yes (Bearer token) | seasonId | - | - | /all-leagues |
| 11 | POST | `{BASE_URL}/api/seasons/:seasonId/restore` | Yes (Bearer token) | seasonId | - | - | /all-leagues |
| 12 | GET | `{BASE_URL}/auth/data` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 13 | POST | `{BASE_URL}/auth/login` | No | - | - | user | Shared API Utility |
| 14 | GET | `{BASE_URL}/auth/logout` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 15 | POST | `{BASE_URL}/auth/logout` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 16 | POST | `{BASE_URL}/auth/register` | No | - | - | user | Shared API Utility |
| 17 | POST | `{BASE_URL}/auth/resend-verification` | No | - | - | email | Shared API Utility |
| 18 | POST | `{BASE_URL}/auth/reset-password` | No | - | - | user | Shared API Utility |
| 19 | GET | `{BASE_URL}/auth/status` | Yes (Bearer token) | ts | _, bust | - | /all-matches, /all-players, /dream-team, /home, /leader-board/_compnents, /league/[id], /player/[id], /trophy-room, /all-leagues |
| 20 | POST | `{BASE_URL}/auth/verify-otp` | No | - | - | email, code | Shared API Utility |
| 21 | POST | `{BASE_URL}/auth/verify-registration` | No | - | - | email, code | Shared API Utility |
| 22 | POST | `{BASE_URL}/auth/verify-reset-code` | No | - | - | email, code, newPassword | Shared API Utility |
| 23 | GET | `{BASE_URL}/dream-team` | Yes (Bearer token) | - | - | - | /league/[id] |
| 24 | POST | `{BASE_URL}/dream-team` | Yes (Bearer token) | - | - | dynamic: JSON.stringify(dreamTeam) | Shared API Utility |
| 25 | GET | `{BASE_URL}/dream-team?leagueId=:leagueId` | Yes (Bearer token) | leagueId | leagueId | - | /dream-team, Shared API Utility |
| 26 | DELETE | `{BASE_URL}/dream-team/:dreamTeamId` | Yes (Bearer token) | dreamTeamId | - | - | Shared API Utility |
| 27 | PUT | `{BASE_URL}/dream-team/:dreamTeamId` | Yes (Bearer token) | dreamTeamId | - | dynamic: JSON.stringify(dreamTeam) | Shared API Utility |
| 28 | GET | `{BASE_URL}/dream-team/formations` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 29 | GET | `{BASE_URL}/leaderboard` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 30 | GET | `{BASE_URL}/leaderboard?metric=:selectedMetric&leagueId=:selectedLeague&limit=5` | Yes (Bearer token) | selectedMetric, selectedLeague | metric, leagueId, limit | - | /leader-board/_compnents |
| 31 | GET | `{BASE_URL}/leaderboard?metric=goals&leagueId=:leagueId` | Yes (Bearer token) | leagueId | metric, leagueId | - | /player/[id]/career |
| 32 | GET | `{BASE_URL}/leagues` | Yes (Bearer token) | - | _ | - | Shared Component: matchstatsdialog/MatchStatsDialog, Shared API Utility, /rewards |
| 33 | POST | `{BASE_URL}/leagues` | Yes (Bearer token) | - | - | dynamic: formData, dynamic: JSON.stringify(league), dynamic: JSON.stringify(leagueData) | /all-leagues, /home, Shared API Utility |
| 34 | GET | `{BASE_URL}/leagues/:effectiveLeagueId` | Yes (Bearer token) | effectiveLeagueId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 35 | GET | `{BASE_URL}/leagues/:effectiveLeagueId/players` | Yes (Bearer token) | effectiveLeagueId | - | - | /player/[id] |
| 36 | DELETE | `{BASE_URL}/leagues/:id` | Yes (Bearer token) | id | - | - | /all-leagues, Shared API Utility |
| 37 | GET | `{BASE_URL}/leagues/:id` | Yes (Bearer token) | id, bust | bust | - | /all-leagues, Shared API Utility, Shared Component: matchstatsdialog/MatchStatsDialog |
| 38 | PATCH | `{BASE_URL}/leagues/:id` | Yes (Bearer token) | id | - | dynamic: leaguePatchPayload | /all-leagues |
| 39 | GET | `{BASE_URL}/leagues/:id?_t=:timestamp` | Yes (Bearer token) | id, timestamp | _t | - | /home |
| 40 | GET | `{BASE_URL}/leagues/:id?includeMatches=0` | Yes (Bearer token) | id | includeMatches | - | Shared Component: Navbar/_components/index |
| 41 | POST | `{BASE_URL}/leagues/:id/join` | Yes (Bearer token) | id | - | - | Shared API Utility |
| 42 | POST | `{BASE_URL}/leagues/:id/leave` | Yes (Bearer token) | id | - | dynamic: JSON.stringify(preferredAdminId ? { preferredAdminId } : {}) | Shared API Utility, /all-leagues |
| 43 | POST | `{BASE_URL}/leagues/:id/matches` | Yes (Bearer token) | id | - | dynamic: formData | /league/[id]/match |
| 44 | GET | `{BASE_URL}/leagues/:id/player/:id/quick-view` | Yes (Bearer token) | id, seasonParam | - | - | /league/[id] |
| 45 | GET | `{BASE_URL}/leagues/:id/seasons` | Yes (Bearer token) | id | _ | - | /trophy-room |
| 46 | DELETE | `{BASE_URL}/leagues/:id/seasons/:seasonId` | Yes (Bearer token) | id, seasonId | - | - | /all-leagues |
| 47 | POST | `{BASE_URL}/leagues/:id/seasons/:seasonId/restore` | Yes (Bearer token) | id, seasonId | - | - | /all-leagues |
| 48 | PATCH | `{BASE_URL}/leagues/:id/seasons/:seasonId/status` | Yes (Bearer token) | id, seasonId | - | archived | /all-leagues |
| 49 | PATCH | `{BASE_URL}/leagues/:id/seasons/:selectedSeasonId` | Yes (Bearer token) | id, selectedSeasonId | - | archived, isActive | /all-leagues |
| 50 | POST | `{BASE_URL}/leagues/:id/seasons/:selectedSeasonId/archive` | Yes (Bearer token) | id, selectedSeasonId | - | archived | /all-leagues |
| 51 | PATCH | `{BASE_URL}/leagues/:id/seasons/:selectedSeasonId/status` | Yes (Bearer token) | id, selectedSeasonId | - | archived, active, isActive | /all-leagues |
| 52 | GET | `{BASE_URL}/leagues/:id/statistics` | Yes (Bearer token) | id | - | - | /league/[id] |
| 53 | PATCH | `{BASE_URL}/leagues/:id/status` | Yes (Bearer token) | id | - | active | /all-leagues |
| 54 | DELETE | `{BASE_URL}/leagues/:id/users/:memberId` | Yes (Bearer token) | id, memberId | - | - | /all-leagues |
| 55 | GET | `{BASE_URL}/leagues/:id/xp` | Yes (Bearer token) | id | - | - | /league/[id] |
| 56 | DELETE | `{BASE_URL}/leagues/:leagueId` | Yes (Bearer token) | leagueId | - | - | /league/[id] |
| 57 | GET | `{BASE_URL}/leagues/:leagueId` | Yes (Bearer token) | leagueId, cacheBuster | - | - | Shared Component: Navbar/_components/index, /all-players, Shared Component: viewteam/viewteam, /league/[id], /league/[id]/match/[matchId]/edit |
| 58 | PATCH | `{BASE_URL}/leagues/:leagueId` | Yes (Bearer token) | leagueId | - | dynamic: JSON.stringify(updatedData) | /league/[id] |
| 59 | GET | `{BASE_URL}/leagues/:leagueId?includeMatches=0` | Yes (Bearer token) | leagueId | includeMatches | - | /all-matches, /league/[id]/match, Shared Component: MatchSummary, Shared Component: Navbar/_components/index |
| 60 | GET | `{BASE_URL}/leagues/:leagueId/matches` | Yes (Bearer token) | leagueId | - | - | /all-matches |
| 61 | GET | `{BASE_URL}/leagues/:leagueId/matches/:matchId` | Yes (Bearer token) | leagueId, matchId, cacheBuster | - | - | /league/[id]/match/[matchId]/edit |
| 62 | PATCH | `{BASE_URL}/leagues/:leagueId/matches/:matchId` | Yes (Bearer token) | leagueId, matchId | - | dynamic: formData | /league/[id]/match/[matchId]/edit |
| 63 | PATCH | `{BASE_URL}/leagues/:leagueId/matches/:matchId/layout` | Yes (Bearer token) | leagueId, matchId | - | team, positions | Shared Component: viewteam/viewteam |
| 64 | GET | `{BASE_URL}/leagues/:leagueId/matches/:matchId/team-view` | Yes (Bearer token) | leagueId, matchId | - | - | Shared Component: viewteam/viewteam |
| 65 | GET | `{BASE_URL}/leagues/:leagueId/notifications` | Yes (Bearer token) | leagueId | - | dynamic: payloadBase | /league/[id]/match/[matchId]/edit |
| 66 | GET | `{BASE_URL}/leagues/:leagueId/player/:playerId/quick-view` | Yes (Bearer token) | leagueId, playerId, seasonParam | - | - | /league/[id] |
| 67 | GET | `{BASE_URL}/leagues/:leagueId/player/:winnerId/quick-view` | Yes (Bearer token) | leagueId, winnerId | _ | - | Shared Component: TrophyRoom, /trophy-room |
| 68 | GET | `{BASE_URL}/leagues/:leagueId/seasons` | Yes (Bearer token) | leagueId | _ | - | /player/[id], /trophy-room |
| 69 | GET | `{BASE_URL}/leagues/:leagueId/xp` | Yes (Bearer token) | leagueId | - | - | /league/[id]/match/[matchId]/edit |
| 70 | GET | `{BASE_URL}/leagues/:leagueIdForList/matches?all=1&includeArchived=1` | Yes (Bearer token) | leagueIdForList | all, includeArchived | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 71 | GET | `{BASE_URL}/leagues/:lid` | Yes (Bearer token) | lid | - | - | /match/[matchId] |
| 72 | DELETE | `{BASE_URL}/leagues/:lid/users/:memberId` | Yes (Bearer token) | lid, memberId | - | - | /all-leagues |
| 73 | GET | `{BASE_URL}/leagues/:lid2/matches/:id` | Yes (Bearer token) | lid2, id | - | - | /match/[matchId] |
| 74 | GET | `{BASE_URL}/leagues/:resolvedLeagueId/matches/:resolvedMatchId` | Yes (Bearer token) | resolvedLeagueId, resolvedMatchId, cacheBuster | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 75 | GET | `{BASE_URL}/leagues/:selectedLeague?includeMatches=0` | Yes (Bearer token) | selectedLeague | includeMatches, _ | - | /leader-board/_compnents |
| 76 | GET | `{BASE_URL}/leagues/:selectedLeague/seasons` | Yes (Bearer token) | selectedLeague | - | - | /all-matches |
| 77 | GET | `{BASE_URL}/leagues/:selectedLeagueId` | Yes (Bearer token) | selectedLeagueId | - | - | /league/[id] |
| 78 | GET | `{BASE_URL}/leagues/all` | Yes (Bearer token) | - | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 79 | POST | `{BASE_URL}/leagues/join` | Yes (Bearer token) | - | - | inviteCode | Shared API Utility |
| 80 | GET | `{BASE_URL}/leagues/trophy-room` | Yes (Bearer token) | - | - | - | /league/[id], /trophy-room |
| 81 | GET | `{BASE_URL}/leagues/trophy-room?leagueId=:id` | Yes (Bearer token) | id | leagueId, _ | - | /trophy-room |
| 82 | GET | `{BASE_URL}/leagues/trophy-room?leagueId=:id&seasonId=:id` | Yes (Bearer token) | id | leagueId, seasonId, _ | - | /trophy-room |
| 83 | GET | `{BASE_URL}/leagues/trophy-room?leagueId=:leagueId` | Yes (Bearer token) | leagueId | leagueId | - | Shared Component: TrophyRoom |
| 84 | GET | `{BASE_URL}/leagues/user-leagues` | Yes (Bearer token) | - | - | - | /all-matches, /all-players |
| 85 | GET | `{BASE_URL}/matches` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 86 | POST | `{BASE_URL}/matches` | Yes (Bearer token) | - | - | dynamic: JSON.stringify(match), dynamic: JSON.stringify(matchData) | /league/[id]/match, Shared API Utility |
| 87 | GET | `{BASE_URL}/matches?leagueId=:leagueId` | Yes (Bearer token) | leagueId | leagueId | - | Shared API Utility |
| 88 | GET | `{BASE_URL}/matches?leagueId=:leagueIdForList` | Yes (Bearer token) | leagueIdForList | leagueId | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 89 | POST | `{BASE_URL}/matches/:activeMatchId/stats` | Yes (Bearer token) | activeMatchId | - | goals, assists, cleanSheets, penalties, freeKicks, defence, impact | /league/[id] |
| 90 | DELETE | `{BASE_URL}/matches/:id` | Yes (Bearer token) | id | - | - | Shared API Utility, /league/[id] |
| 91 | GET | `{BASE_URL}/matches/:id` | Yes (Bearer token) | id | - | - | Shared Component: Navbar/_components/index, Shared API Utility |
| 92 | PUT | `{BASE_URL}/matches/:id` | Yes (Bearer token) | id | - | dynamic: JSON.stringify(match), archived | Shared API Utility, /league/[id] |
| 93 | GET | `{BASE_URL}/matches/:id/captain-picks?_t=:param` | Yes (Bearer token) | id | _t | - | /match/[matchId] |
| 94 | GET | `{BASE_URL}/matches/:id/has-stats` | Yes (Bearer token) | id | - | - | /all-matches, /league/[id] |
| 95 | DELETE | `{BASE_URL}/matches/:matchId` | Yes (Bearer token) | matchId | - | - | /all-leagues |
| 96 | PUT | `{BASE_URL}/matches/:matchId` | Yes (Bearer token) | matchId | - | archived, dynamic: JSON.stringify(matchData) | /all-leagues, Shared API Utility |
| 97 | GET | `{BASE_URL}/matches/:matchId?_t=:param` | Yes (Bearer token) | matchId | _t | - | /match/[matchId] |
| 98 | GET | `{BASE_URL}/matches/:matchId/availability` | Yes (Bearer token) | matchId | - | - | /league/[id]/match/[matchId]/edit |
| 99 | POST | `{BASE_URL}/matches/:matchId/availability?action=:action` | Yes (Bearer token) | matchId, action | action | - | Shared API Utility |
| 100 | GET | `{BASE_URL}/matches/:matchId/prediction` | Yes (Bearer token) | matchId | - | - | Shared Component: MatchSummary, Shared Component: viewteam/viewteam |
| 101 | POST | `{BASE_URL}/matches/:matchId/prediction` | Yes (Bearer token) | matchId | - | dynamic: JSON.stringify(payload) | /league/[id]/match/[matchId]/edit |
| 102 | POST | `{BASE_URL}/matches/:matchId/stats` | Yes (Bearer token) | matchId | - | playerId, defence, penalties, freeKicks, impact, dynamic: JSON.stringify(stats) | /match/[matchId], Shared API Utility |
| 103 | GET | `{BASE_URL}/matches/:matchId/stats?_t=:param` | Yes (Bearer token) | matchId | _t | - | /match/[matchId] |
| 104 | GET | `{BASE_URL}/matches/:matchId/stats?playerId=:apiPlayerId&_t=:param` | Yes (Bearer token) | matchId, apiPlayerId | playerId, _t | - | /match/[matchId] |
| 105 | GET | `{BASE_URL}/matches/:matchId/stats?playerId=:playerId` | Yes (Bearer token) | matchId, playerId, cacheBuster | playerId | - | Shared API Utility |
| 106 | GET | `{BASE_URL}/matches/:matchId/votes` | Yes (Bearer token) | matchId | - | - | /match/[matchId], Shared API Utility |
| 107 | POST | `{BASE_URL}/matches/:matchId/votes` | Yes (Bearer token) | matchId | - | votedForId | Shared API Utility |
| 108 | GET | `{BASE_URL}/matches/:mid` | Yes (Bearer token) | mid | - | - | Shared Component: Navbar/_components/index |
| 109 | GET | `{BASE_URL}/matches/:mid/availability` | Yes (Bearer token) | mid | - | - | Shared Component: Navbar/_components/index |
| 110 | POST | `{BASE_URL}/matches/:mid/availability?action=:action` | Yes (Bearer token) | mid, action | action | - | Shared Component: Navbar/_components/index |
| 111 | GET | `{BASE_URL}/matches/:resolvedMatchId` | Yes (Bearer token) | resolvedMatchId, cacheBuster | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 112 | GET | `{BASE_URL}/matches/:resolvedMatchId/captain-picks` | Yes (Bearer token) | resolvedMatchId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 113 | POST | `{BASE_URL}/matches/:resolvedMatchId/captain-picks` | Yes (Bearer token) | resolvedMatchId | - | category, playerId | Shared Component: matchstatsdialog/MatchStatsDialog |
| 114 | PATCH | `{BASE_URL}/matches/:resolvedMatchId/goals` | Yes (Bearer token) | resolvedMatchId | - | homeTeamGoals, awayTeamGoals | Shared Component: matchstatsdialog/MatchStatsDialog |
| 115 | PATCH | `{BASE_URL}/matches/:resolvedMatchId/note` | Yes (Bearer token) | resolvedMatchId | - | note | Shared Component: matchstatsdialog/MatchStatsDialog |
| 116 | POST | `{BASE_URL}/matches/:resolvedMatchId/stats` | Yes (Bearer token) | resolvedMatchId | - | goals, assists, cleanSheets, penalties, freeKicks, defence, impact, playerId | Shared Component: matchstatsdialog/MatchStatsDialog |
| 117 | GET | `{BASE_URL}/matches/:resolvedMatchId/stats-window` | Yes (Bearer token) | resolvedMatchId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 118 | GET | `{BASE_URL}/matches/:resolvedMatchId/stats?playerId=:currentUserId&_t=:param` | Yes (Bearer token) | resolvedMatchId, currentUserId | playerId, _t | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 119 | GET | `{BASE_URL}/matches/:resolvedMatchId/stats?playerId=:id` | Yes (Bearer token) | resolvedMatchId, id, cacheBuster | playerId | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 120 | GET | `{BASE_URL}/matches/:resolvedMatchId/votes` | Yes (Bearer token) | resolvedMatchId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 121 | POST | `{BASE_URL}/matches/:resolvedMatchId/votes` | Yes (Bearer token) | resolvedMatchId | - | dynamic: JSON.stringify(voteData), votedForId | Shared Component: matchstatsdialog/MatchStatsDialog |
| 122 | GET | `{BASE_URL}/me` | Yes (Bearer token) | - | - | - | /league/[id], Shared API Utility |
| 123 | GET | `{BASE_URL}/notifications` | Yes (Bearer token) | - | - | dynamic: payloadBase | /league/[id]/match/[matchId]/edit |
| 124 | POST | `{BASE_URL}/notifications` | Yes (Bearer token) | - | - | dynamic: JSON.stringify(body) | /league/[id]/match/[matchId]/edit |
| 125 | DELETE | `{BASE_URL}/notifications?userId=:userId` | Yes (Bearer token) | userId | userId | - | Shared Component: Navbar/_components/index |
| 126 | GET | `{BASE_URL}/notifications?userId=:userId` | Yes (Bearer token) | userId | userId | - | Shared Component: Navbar/_components/index |
| 127 | PATCH | `{BASE_URL}/notifications/:id/read` | Yes (Bearer token) | id | - | - | Shared Component: Navbar/_components/index |
| 128 | PATCH | `{BASE_URL}/notifications/:notificationId/read` | Yes (Bearer token) | notificationId | - | - | Shared Component: Navbar/_components/index |
| 129 | POST | `{BASE_URL}/notifications/:notificationId/season-action` | Yes (Bearer token) | notificationId | - | action | Shared Component: Navbar/_components/index |
| 130 | GET | `{BASE_URL}/notifications/broadcast` | Yes (Bearer token) | - | - | dynamic: payloadBase | /league/[id]/match/[matchId]/edit |
| 131 | POST | `{BASE_URL}/notifications/clear-all` | Yes (Bearer token) | - | - | userId | Shared Component: Navbar/_components/index |
| 132 | DELETE | `{BASE_URL}/notifications/clear-all?userId=:userId` | Yes (Bearer token) | userId | userId | - | Shared Component: Navbar/_components/index |
| 133 | GET | `{BASE_URL}/players` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 134 | GET | `{BASE_URL}/players/:playerId` | Yes (Bearer token) | playerId | - | - | /league/[id], /player/[id], /player/[id]/career |
| 135 | GET | `{BASE_URL}/players/:playerId/history-records` | Yes (Bearer token) | playerId | - | - | Shared API Utility |
| 136 | GET | `{BASE_URL}/players/:playerId/leagues/:effectiveLeagueId/teammates` | Yes (Bearer token) | playerId, effectiveLeagueId | - | - | /player/[id] |
| 137 | GET | `{BASE_URL}/players/:playerId/leagues/:id/teammates` | Yes (Bearer token) | playerId, id | - | - | /player/[id] |
| 138 | GET | `{BASE_URL}/players/:playerId/matches` | Yes (Bearer token) | playerId | - | - | /player/[id]/career |
| 139 | GET | `{BASE_URL}/players/:playerId/profile?leagueId=:leagueId&year=:year` | Yes (Bearer token) | playerId, leagueId, year | leagueId, year | - | Shared API Utility |
| 140 | GET | `{BASE_URL}/players/:playerId/simple-synergy:leagueParam` | Yes (Bearer token) | playerId, leagueParam | - | - | /player/[id]/career |
| 141 | GET | `{BASE_URL}/players/:playerId/stats` | Yes (Bearer token) | playerId | - | - | Shared API Utility |
| 142 | GET | `{BASE_URL}/players/:playerId/stats?leagueId=:leagueId` | Yes (Bearer token) | playerId, leagueId | leagueId | - | /league/[id] |
| 143 | GET | `{BASE_URL}/players/:playerId/trophies` | Yes (Bearer token) | playerId | - | - | Shared API Utility |
| 144 | GET | `{BASE_URL}/players/:playerId/xp` | Yes (Bearer token) | playerId | - | - | Shared API Utility |
| 145 | GET | `{BASE_URL}/players/:profilePlayerId/stats` | Yes (Bearer token) | profilePlayerId | - | - | /league/[id] |
| 146 | GET | `{BASE_URL}/players/:winnerId` | Yes (Bearer token) | winnerId | - | - | /trophy-room |
| 147 | GET | `{BASE_URL}/players/:winnerId/stats?leagueId=:leagueId` | Yes (Bearer token) | winnerId, leagueId | leagueId | - | /trophy-room |
| 148 | GET | `{BASE_URL}/players/by-league?leagueId=:id` | Yes (Bearer token) | id | leagueId | - | /all-players |
| 149 | GET | `{BASE_URL}/players/by-league?leagueId=:selectedLeague` | Yes (Bearer token) | selectedLeague | leagueId | - | /all-players |
| 150 | DELETE | `{BASE_URL}/profile` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 151 | GET | `{BASE_URL}/profile` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 152 | PATCH | `{BASE_URL}/profile` | Yes (Bearer token) | - | - | dynamic: JSON.stringify(userData) | Shared API Utility |
| 153 | PUT | `{BASE_URL}/profile` | Yes (Bearer token) | - | - | dynamic: JSON.stringify(userData) | Shared API Utility |
| 154 | GET | `{BASE_URL}/profile/leagues` | Yes (Bearer token) | - | - | - | Shared Component: matchstatsdialog/MatchStatsDialog, Shared API Utility |
| 155 | GET | `{BASE_URL}/profile/matches` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 156 | POST | `{BASE_URL}/profile/picture` | Yes (Bearer token) | - | - | dynamic: formData | /profile, Shared Component: playercard/playercard, Shared Component: PlayerCardd, Shared API Utility |
| 157 | PUT | `{BASE_URL}/profile/skills` | Yes (Bearer token) | - | - | skills | Shared API Utility |
| 158 | GET | `{BASE_URL}/profile/statistics` | Yes (Bearer token) | - | - | - | Shared API Utility |
| 159 | GET | `{BASE_URL}/users/:userId` | Yes (Bearer token) | userId | - | - | Shared API Utility |
| 160 | PUT | `{BASE_URL}/users/:userId` | Yes (Bearer token) | userId | - | dynamic: JSON.stringify(userData) | Shared API Utility |
| 161 | GET | `{BASE_URL}/users/me/achievements` | Yes (Bearer token) | - | _ | - | /rewards, /trophy-room |
| 162 | POST | `{BASE_URL}/users/me/achievements/award` | Yes (Bearer token) | - | _ | - | Shared API Utility, /rewards, /trophy-room |
| 163 | GET | `{BASE_URL}/users/me/global-stats` | Yes (Bearer token) | - | - | - | /home |
| 164 | GET | `{BASE_URL}/world-ranking` | Optional | - | - | - | Shared API Utility |

## ID Passing Guide

- `leagueId`: league-specific APIs (league details, matches, seasons, stats, trophy-room).
- `matchId`: match details, votes, stats, availability, captain picks, prediction, edit/save.
- `playerId`: player profile/stats/xp/trophies/history/teammates/achievements APIs.
- `seasonId`: season archive/restore/status endpoints.
- `userId` / `memberId`: member management, notifications, per-user operations.

## Notes

- This list is generated from frontend usage (what web currently calls).
- If backend has extra endpoints not used by web, they are not included here.
