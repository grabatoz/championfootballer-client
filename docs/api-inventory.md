# API Inventory (Frontend)

Generated: 2026-04-22T08:52:24.997Z

## Base URL

- Primary base: `process.env.NEXT_PUBLIC_API_URL`
- Local fallback observed: `http://localhost:5000`
- Production fallback observed in code: `https://championfootballer-server.onrender.com`

## Endpoint Summary

| # | Method | URL (Normalized) | Path Params | Query Params | Body Fields | Used In (Pages/Features) |
|---|---|---|---|---|---|---|
| 1 | POST | `{BASE_URL}/api/contact` | - | - | (dynamic) JSON.stringify(value) | /contact |
| 2 | PATCH | `{BASE_URL}/api/leagues/${league.id}` | id | - | (dynamic) leaguePatchPayload | /all-leagues |
| 3 | DELETE | `{BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}` | id, seasonId | - | - | /all-leagues |
| 4 | POST | `{BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}/restore` | id, seasonId | - | - | /all-leagues |
| 5 | PATCH | `{BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}/status` | id, seasonId | - | archived | /all-leagues |
| 6 | PATCH | `{BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}` | id, selectedSeasonId | - | archived, isActive | /all-leagues |
| 7 | POST | `{BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/archive` | id, selectedSeasonId | - | archived | /all-leagues |
| 8 | PATCH | `{BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/status` | id, selectedSeasonId | - | archived, active, isActive | /all-leagues |
| 9 | POST | `{BASE_URL}/api/leagues/${selectedLeague.id}/seasons` | id | - | copyPlayers | /home |
| 10 | DELETE | `{BASE_URL}/api/seasons/${seasonId}` | seasonId | - | - | /all-leagues |
| 11 | POST | `{BASE_URL}/api/seasons/${seasonId}/restore` | seasonId | - | - | /all-leagues |
| 12 | GET | `{BASE_URL}/auth/data` | - | - | - | Shared API Utility |
| 13 | POST | `{BASE_URL}/auth/login` | - | - | user | Shared API Utility |
| 14 | GET | `{BASE_URL}/auth/logout` | - | - | - | Shared API Utility |
| 15 | POST | `{BASE_URL}/auth/logout` | - | - | - | Shared API Utility |
| 16 | POST | `{BASE_URL}/auth/register` | - | - | user | Shared API Utility |
| 17 | POST | `{BASE_URL}/auth/resend-verification` | - | - | email | Shared API Utility |
| 18 | POST | `{BASE_URL}/auth/reset-password` | - | - | user | Shared API Utility |
| 19 | GET | `{BASE_URL}/auth/status` | - | - | - | /all-matches, /all-players, /dream-team, /home, /leader-board/_compnents, /league/[id], /player/[id] |
| 20 | GET | `{BASE_URL}/auth/status?_=${Date.now()}` | - | _ | - | /trophy-room |
| 21 | GET | `{BASE_URL}/auth/status?bust=${ts}` | ts | bust | - | /all-leagues |
| 22 | POST | `{BASE_URL}/auth/verify-otp` | - | - | email, code | Shared API Utility |
| 23 | POST | `{BASE_URL}/auth/verify-registration` | - | - | email, code | Shared API Utility |
| 24 | POST | `{BASE_URL}/auth/verify-reset-code` | - | - | email, code, newPassword | Shared API Utility |
| 25 | POST | `{BASE_URL}/dream-team` | - | - | (dynamic) JSON.stringify(dreamTeam) | Shared API Utility |
| 26 | GET | `{BASE_URL}/dream-team?${params.toString()}` | - | - | - | /league/[id] |
| 27 | GET | `{BASE_URL}/dream-team?leagueId=${leagueId}` | leagueId | leagueId | - | /dream-team, Shared API Utility |
| 28 | DELETE | `{BASE_URL}/dream-team/${dreamTeamId}` | dreamTeamId | - | - | Shared API Utility |
| 29 | PUT | `{BASE_URL}/dream-team/${dreamTeamId}` | dreamTeamId | - | (dynamic) JSON.stringify(dreamTeam) | Shared API Utility |
| 30 | GET | `{BASE_URL}/dream-team/formations` | - | - | - | Shared API Utility |
| 31 | GET | `{BASE_URL}/leaderboard?${query.toString()}` | - | - | - | Shared API Utility |
| 32 | GET | `{BASE_URL}/leaderboard?metric=${selectedMetric}&leagueId=${selectedLeague}&limit=5` | selectedMetric, selectedLeague | metric, leagueId, limit | - | /leader-board/_compnents |
| 33 | GET | `{BASE_URL}/leaderboard?metric=goals&leagueId=${encodeURIComponent(filters.leagueId)}` | leagueId | metric, leagueId | - | /player/[id]/career |
| 34 | GET | `{BASE_URL}/leagues` | - | - | - | Shared Component: matchstatsdialog/MatchStatsDialog, Shared API Utility |
| 35 | POST | `{BASE_URL}/leagues` | - | - | (dynamic) formData, (dynamic) JSON.stringify(league), (dynamic) JSON.stringify(leagueData) | /all-leagues, /home, Shared API Utility |
| 36 | GET | `{BASE_URL}/leagues?_=${Date.now()}` | - | _ | - | /rewards |
| 37 | DELETE | `{BASE_URL}/leagues/${adminSettingsLeague.id}` | id | - | - | /all-leagues |
| 38 | GET | `{BASE_URL}/leagues/${adminSettingsLeague.id}` | id | - | - | /all-leagues |
| 39 | PATCH | `{BASE_URL}/leagues/${adminSettingsLeague.id}/status` | id | - | active | /all-leagues |
| 40 | GET | `{BASE_URL}/leagues/${effectiveLeagueId}` | effectiveLeagueId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 41 | GET | `{BASE_URL}/leagues/${effectiveLeagueId}/players` | effectiveLeagueId | - | - | /player/[id] |
| 42 | GET | `{BASE_URL}/leagues/${encodeURIComponent(league.id)}/player/${encodeURIComponent(m.id)}/quick-view${seasonParam}` | id, seasonParam | - | - | /league/[id] |
| 43 | GET | `{BASE_URL}/leagues/${encodeURIComponent(leagueId)}` | leagueId | - | - | Shared Component: Navbar/_components/index |
| 44 | GET | `{BASE_URL}/leagues/${encodeURIComponent(leagueId)}/player/${encodeURIComponent(playerId)}/quick-view${seasonParam}` | leagueId, playerId, seasonParam | - | - | /league/[id] |
| 45 | GET | `{BASE_URL}/leagues/${encodeURIComponent(leagueIdForList)}/matches?all=1&includeArchived=1` | leagueIdForList | all, includeArchived | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 46 | GET | `{BASE_URL}/leagues/${encodeURIComponent(String(leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view` | leagueId, winnerId | - | - | Shared Component: TrophyRoom |
| 47 | GET | `{BASE_URL}/leagues/${encodeURIComponent(String(trophy.leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view?_=${Date.now()}` | leagueId, winnerId | _ | - | /trophy-room |
| 48 | DELETE | `{BASE_URL}/leagues/${id}` | id | - | - | Shared API Utility |
| 49 | GET | `{BASE_URL}/leagues/${id}` | id | - | - | Shared API Utility |
| 50 | GET | `{BASE_URL}/leagues/${id}?includeMatches=0` | id | includeMatches | - | Shared Component: Navbar/_components/index |
| 51 | POST | `{BASE_URL}/leagues/${id}/join` | id | - | - | Shared API Utility |
| 52 | POST | `{BASE_URL}/leagues/${id}/leave` | id | - | - | Shared API Utility |
| 53 | GET | `{BASE_URL}/leagues/${l.id}` | id | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 54 | GET | `{BASE_URL}/leagues/${l.id}?_t=${timestamp}` | id, timestamp | _t | - | /home |
| 55 | DELETE | `{BASE_URL}/leagues/${league.id}` | id | - | - | /all-leagues |
| 56 | PATCH | `{BASE_URL}/leagues/${league.id}` | id | - | (dynamic) leaguePatchPayload | /all-leagues |
| 57 | GET | `{BASE_URL}/leagues/${league.id}?bust=${bust}` | id, bust | bust | - | /all-leagues |
| 58 | POST | `{BASE_URL}/leagues/${league.id}/leave` | id | - | (dynamic) JSON.stringify(preferredAdminId ? { preferredAdminId } : {}) | /all-leagues |
| 59 | POST | `{BASE_URL}/leagues/${league.id}/matches` | id | - | (dynamic) formData | /league/[id]/match |
| 60 | GET | `{BASE_URL}/leagues/${league.id}/seasons?_=${Date.now()}` | id | _ | - | /trophy-room |
| 61 | DELETE | `{BASE_URL}/leagues/${league.id}/seasons/${seasonId}` | id, seasonId | - | - | /all-leagues |
| 62 | POST | `{BASE_URL}/leagues/${league.id}/seasons/${seasonId}/restore` | id, seasonId | - | - | /all-leagues |
| 63 | PATCH | `{BASE_URL}/leagues/${league.id}/seasons/${seasonId}/status` | id, seasonId | - | archived | /all-leagues |
| 64 | PATCH | `{BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}` | id, selectedSeasonId | - | archived, isActive | /all-leagues |
| 65 | POST | `{BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/archive` | id, selectedSeasonId | - | archived | /all-leagues |
| 66 | PATCH | `{BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/status` | id, selectedSeasonId | - | archived, active, isActive | /all-leagues |
| 67 | GET | `{BASE_URL}/leagues/${league.id}/statistics` | id | - | - | /league/[id] |
| 68 | PATCH | `{BASE_URL}/leagues/${league.id}/status` | id | - | active | /all-leagues |
| 69 | GET | `{BASE_URL}/leagues/${league.id}/xp?${params.toString()}` | id | - | - | /league/[id] |
| 70 | DELETE | `{BASE_URL}/leagues/${leagueId}` | leagueId | - | - | /league/[id] |
| 71 | GET | `{BASE_URL}/leagues/${leagueId}` | leagueId | - | - | /all-players, Shared Component: viewteam/viewteam |
| 72 | PATCH | `{BASE_URL}/leagues/${leagueId}` | leagueId | - | (dynamic) JSON.stringify(updatedData) | /league/[id] |
| 73 | GET | `{BASE_URL}/leagues/${leagueId}?${params.toString()}` | leagueId | - | - | /league/[id] |
| 74 | GET | `{BASE_URL}/leagues/${leagueId}?includeMatches=0` | leagueId | includeMatches | - | /all-matches, /league/[id]/match, Shared Component: MatchSummary, Shared Component: Navbar/_components/index |
| 75 | GET | `{BASE_URL}/leagues/${leagueId}/matches?${params.toString()}` | leagueId | - | - | /all-matches |
| 76 | PATCH | `{BASE_URL}/leagues/${leagueId}/matches/${matchId}` | leagueId, matchId | - | (dynamic) formData | /league/[id]/match/[matchId]/edit |
| 77 | PATCH | `{BASE_URL}/leagues/${leagueId}/matches/${matchId}/layout` | leagueId, matchId | - | team, positions | Shared Component: viewteam/viewteam |
| 78 | GET | `{BASE_URL}/leagues/${leagueId}/matches/${matchId}/team-view` | leagueId, matchId | - | - | Shared Component: viewteam/viewteam |
| 79 | GET | `{BASE_URL}/leagues/${leagueId}/matches/${matchId}${cacheBuster}` | leagueId, matchId, cacheBuster | - | - | /league/[id]/match/[matchId]/edit |
| 80 | GET | `{BASE_URL}/leagues/${leagueId}/notifications` | leagueId | - | (dynamic) payloadBase | /league/[id]/match/[matchId]/edit |
| 81 | GET | `{BASE_URL}/leagues/${leagueId}/seasons` | leagueId | - | - | /player/[id] |
| 82 | GET | `{BASE_URL}/leagues/${leagueId}/seasons?_=${Date.now()}` | leagueId | _ | - | /trophy-room |
| 83 | GET | `{BASE_URL}/leagues/${leagueId}/xp` | leagueId | - | - | /league/[id]/match/[matchId]/edit |
| 84 | GET | `{BASE_URL}/leagues/${leagueId}${cacheBuster}` | leagueId, cacheBuster | - | - | /league/[id]/match/[matchId]/edit |
| 85 | GET | `{BASE_URL}/leagues/${lid}` | lid | - | - | /match/[matchId] |
| 86 | DELETE | `{BASE_URL}/leagues/${lid}/users/${memberId}` | lid, memberId | - | - | /all-leagues |
| 87 | GET | `{BASE_URL}/leagues/${lid2}/matches/${match.id}` | lid2, id | - | - | /match/[matchId] |
| 88 | GET | `{BASE_URL}/leagues/${resolvedLeagueId}/matches/${resolvedMatchId}${cacheBuster}` | resolvedLeagueId, resolvedMatchId, cacheBuster | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 89 | DELETE | `{BASE_URL}/leagues/${selectedLeague.id}` | id | - | - | /all-leagues |
| 90 | GET | `{BASE_URL}/leagues/${selectedLeague.id}` | id | - | - | /all-leagues |
| 91 | PATCH | `{BASE_URL}/leagues/${selectedLeague.id}/status` | id | - | active | /all-leagues |
| 92 | DELETE | `{BASE_URL}/leagues/${selectedLeague.id}/users/${memberId}` | id, memberId | - | - | /all-leagues |
| 93 | GET | `{BASE_URL}/leagues/${selectedLeague}?includeMatches=0&_=${Date.now()}` | selectedLeague | includeMatches, _ | - | /leader-board/_compnents |
| 94 | GET | `{BASE_URL}/leagues/${selectedLeague}/seasons?${params.toString()}` | selectedLeague | - | - | /all-matches |
| 95 | GET | `{BASE_URL}/leagues/${selectedLeagueId}` | selectedLeagueId | - | - | /league/[id] |
| 96 | GET | `{BASE_URL}/leagues/all` | - | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 97 | POST | `{BASE_URL}/leagues/join` | - | - | inviteCode | Shared API Utility |
| 98 | GET | `{BASE_URL}/leagues/trophy-room?${params.toString()}` | - | - | - | /league/[id], /trophy-room |
| 99 | GET | `{BASE_URL}/leagues/trophy-room?leagueId=${encodeURIComponent(String(leagueId))}` | leagueId | leagueId | - | Shared Component: TrophyRoom |
| 100 | GET | `{BASE_URL}/leagues/trophy-room?leagueId=${league.id}&_=${Date.now()}` | id | leagueId, _ | - | /trophy-room |
| 101 | GET | `{BASE_URL}/leagues/trophy-room?leagueId=${league.id}&seasonId=${season.id}&_=${Date.now()}` | id | leagueId, seasonId, _ | - | /trophy-room |
| 102 | GET | `{BASE_URL}/leagues/user-leagues` | - | - | - | /all-matches, /all-players |
| 103 | GET | `{BASE_URL}/matches` | - | - | - | Shared API Utility |
| 104 | POST | `{BASE_URL}/matches` | - | - | (dynamic) JSON.stringify(match), (dynamic) JSON.stringify(matchData) | /league/[id]/match, Shared API Utility |
| 105 | GET | `{BASE_URL}/matches?leagueId=${encodeURIComponent(leagueIdForList)}` | leagueIdForList | leagueId | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 106 | GET | `{BASE_URL}/matches?leagueId=${leagueId}` | leagueId | leagueId | - | Shared API Utility |
| 107 | POST | `{BASE_URL}/matches/${activeMatchId}/stats` | activeMatchId | - | goals, assists, cleanSheets, penalties, freeKicks, defence, impact | /league/[id] |
| 108 | GET | `{BASE_URL}/matches/${encodeURIComponent(id)}` | id | - | - | Shared Component: Navbar/_components/index |
| 109 | GET | `{BASE_URL}/matches/${encodeURIComponent(mid)}` | mid | - | - | Shared Component: Navbar/_components/index |
| 110 | GET | `{BASE_URL}/matches/${encodeURIComponent(mid)}/availability` | mid | - | - | Shared Component: Navbar/_components/index |
| 111 | POST | `{BASE_URL}/matches/${encodeURIComponent(mid)}/availability?action=${action}` | mid, action | action | - | Shared Component: Navbar/_components/index |
| 112 | DELETE | `{BASE_URL}/matches/${id}` | id | - | - | Shared API Utility |
| 113 | GET | `{BASE_URL}/matches/${id}` | id | - | - | Shared API Utility |
| 114 | PUT | `{BASE_URL}/matches/${id}` | id | - | (dynamic) JSON.stringify(match) | Shared API Utility |
| 115 | PUT | `{BASE_URL}/matches/${m.id}` | id | - | archived | /league/[id] |
| 116 | DELETE | `{BASE_URL}/matches/${match.id}` | id | - | - | /league/[id] |
| 117 | PUT | `{BASE_URL}/matches/${match.id}` | id | - | archived | /league/[id] |
| 118 | GET | `{BASE_URL}/matches/${match.id}/captain-picks?_t=${Date.now()}` | id | _t | - | /match/[matchId] |
| 119 | GET | `{BASE_URL}/matches/${match.id}/has-stats` | id | - | - | /all-matches, /league/[id] |
| 120 | DELETE | `{BASE_URL}/matches/${matchId}` | matchId | - | - | /all-leagues |
| 121 | PUT | `{BASE_URL}/matches/${matchId}` | matchId | - | archived, (dynamic) JSON.stringify(matchData) | /all-leagues, Shared API Utility |
| 122 | GET | `{BASE_URL}/matches/${matchId}?_t=${Date.now()}` | matchId | _t | - | /match/[matchId] |
| 123 | GET | `{BASE_URL}/matches/${matchId}/availability` | matchId | - | - | /league/[id]/match/[matchId]/edit |
| 124 | POST | `{BASE_URL}/matches/${matchId}/availability?action=${action}` | matchId, action | action | - | Shared API Utility |
| 125 | GET | `{BASE_URL}/matches/${matchId}/prediction` | matchId | - | - | Shared Component: MatchSummary, Shared Component: viewteam/viewteam |
| 126 | POST | `{BASE_URL}/matches/${matchId}/prediction` | matchId | - | (dynamic) JSON.stringify(payload) | /league/[id]/match/[matchId]/edit |
| 127 | POST | `{BASE_URL}/matches/${matchId}/stats` | matchId | - | playerId, defence, penalties, freeKicks, impact, (dynamic) JSON.stringify(stats) | /match/[matchId], Shared API Utility |
| 128 | GET | `{BASE_URL}/matches/${matchId}/stats?_t=${Date.now()}` | matchId | _t | - | /match/[matchId] |
| 129 | GET | `{BASE_URL}/matches/${matchId}/stats?playerId=${apiPlayerId}&_t=${Date.now()}` | matchId, apiPlayerId | playerId, _t | - | /match/[matchId] |
| 130 | GET | `{BASE_URL}/matches/${matchId}/stats?playerId=${playerId}${cacheBuster}` | matchId, playerId, cacheBuster | playerId | - | Shared API Utility |
| 131 | GET | `{BASE_URL}/matches/${matchId}/votes` | matchId | - | - | /match/[matchId], Shared API Utility |
| 132 | POST | `{BASE_URL}/matches/${matchId}/votes` | matchId | - | votedForId | Shared API Utility |
| 133 | GET | `{BASE_URL}/matches/${resolvedMatchId}/captain-picks` | resolvedMatchId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 134 | POST | `{BASE_URL}/matches/${resolvedMatchId}/captain-picks` | resolvedMatchId | - | category, playerId | Shared Component: matchstatsdialog/MatchStatsDialog |
| 135 | PATCH | `{BASE_URL}/matches/${resolvedMatchId}/goals` | resolvedMatchId | - | homeTeamGoals, awayTeamGoals | Shared Component: matchstatsdialog/MatchStatsDialog |
| 136 | PATCH | `{BASE_URL}/matches/${resolvedMatchId}/note` | resolvedMatchId | - | note | Shared Component: matchstatsdialog/MatchStatsDialog |
| 137 | POST | `{BASE_URL}/matches/${resolvedMatchId}/stats` | resolvedMatchId | - | goals, assists, cleanSheets, penalties, freeKicks, defence, impact, playerId | Shared Component: matchstatsdialog/MatchStatsDialog |
| 138 | GET | `{BASE_URL}/matches/${resolvedMatchId}/stats-window` | resolvedMatchId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 139 | GET | `{BASE_URL}/matches/${resolvedMatchId}/stats?playerId=${encodeURIComponent(currentUserId)}&_t=${Date.now()}` | resolvedMatchId, currentUserId | playerId, _t | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 140 | GET | `{BASE_URL}/matches/${resolvedMatchId}/stats?playerId=${player.id}${cacheBuster}` | resolvedMatchId, id, cacheBuster | playerId | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 141 | GET | `{BASE_URL}/matches/${resolvedMatchId}/votes` | resolvedMatchId | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 142 | POST | `{BASE_URL}/matches/${resolvedMatchId}/votes` | resolvedMatchId | - | (dynamic) JSON.stringify(voteData), votedForId | Shared Component: matchstatsdialog/MatchStatsDialog |
| 143 | GET | `{BASE_URL}/matches/${resolvedMatchId}${cacheBuster}` | resolvedMatchId, cacheBuster | - | - | Shared Component: matchstatsdialog/MatchStatsDialog |
| 144 | GET | `{BASE_URL}/me` | - | - | - | /league/[id], Shared API Utility |
| 145 | GET | `{BASE_URL}/notifications` | - | - | (dynamic) payloadBase | /league/[id]/match/[matchId]/edit |
| 146 | POST | `{BASE_URL}/notifications` | - | - | (dynamic) JSON.stringify(body) | /league/[id]/match/[matchId]/edit |
| 147 | DELETE | `{BASE_URL}/notifications?userId=${encodeURIComponent(userId)}` | userId | userId | - | Shared Component: Navbar/_components/index |
| 148 | GET | `{BASE_URL}/notifications?userId=${userId}` | userId | userId | - | Shared Component: Navbar/_components/index |
| 149 | PATCH | `{BASE_URL}/notifications/${encodeURIComponent(id)}/read` | id | - | - | Shared Component: Navbar/_components/index |
| 150 | PATCH | `{BASE_URL}/notifications/${notificationId}/read` | notificationId | - | - | Shared Component: Navbar/_components/index |
| 151 | POST | `{BASE_URL}/notifications/${notificationId}/season-action` | notificationId | - | action | Shared Component: Navbar/_components/index |
| 152 | GET | `{BASE_URL}/notifications/broadcast` | - | - | (dynamic) payloadBase | /league/[id]/match/[matchId]/edit |
| 153 | POST | `{BASE_URL}/notifications/clear-all` | - | - | userId | Shared Component: Navbar/_components/index |
| 154 | DELETE | `{BASE_URL}/notifications/clear-all?userId=${encodeURIComponent(userId)}` | userId | userId | - | Shared Component: Navbar/_components/index |
| 155 | GET | `{BASE_URL}/players` | - | - | - | Shared API Utility |
| 156 | GET | `{BASE_URL}/players/${encodeURIComponent(playerId)}` | playerId | - | - | /league/[id] |
| 157 | GET | `{BASE_URL}/players/${encodeURIComponent(playerId)}/stats?leagueId=${encodeURIComponent(leagueId)}` | playerId, leagueId | leagueId | - | /league/[id] |
| 158 | GET | `{BASE_URL}/players/${encodeURIComponent(String(playerId))}` | playerId | - | - | /player/[id] |
| 159 | GET | `{BASE_URL}/players/${encodeURIComponent(String(trophy.winnerId))}` | winnerId | - | - | /trophy-room |
| 160 | GET | `{BASE_URL}/players/${encodeURIComponent(String(trophy.winnerId))}/stats?leagueId=${encodeURIComponent(String(trophy.leagueId))}` | winnerId, leagueId | leagueId | - | /trophy-room |
| 161 | GET | `{BASE_URL}/players/${playerId}` | playerId | - | - | /player/[id]/career |
| 162 | GET | `{BASE_URL}/players/${playerId}/history-records?${params.toString()}` | playerId | - | - | Shared API Utility |
| 163 | GET | `{BASE_URL}/players/${playerId}/leagues/${effectiveLeagueId}/teammates` | playerId, effectiveLeagueId | - | - | /player/[id] |
| 164 | GET | `{BASE_URL}/players/${playerId}/leagues/${league.id}/teammates` | playerId, id | - | - | /player/[id] |
| 165 | GET | `{BASE_URL}/players/${playerId}/matches` | playerId | - | - | /player/[id]/career |
| 166 | GET | `{BASE_URL}/players/${playerId}/profile?leagueId=${leagueId}&year=${year}` | playerId, leagueId, year | leagueId, year | - | Shared API Utility |
| 167 | GET | `{BASE_URL}/players/${playerId}/simple-synergy${leagueParam}` | playerId, leagueParam | - | - | /player/[id]/career |
| 168 | GET | `{BASE_URL}/players/${playerId}/stats` | playerId | - | - | Shared API Utility |
| 169 | GET | `{BASE_URL}/players/${playerId}/trophies?${params.toString()}` | playerId | - | - | Shared API Utility |
| 170 | GET | `{BASE_URL}/players/${playerId}/xp?${params.toString()}` | playerId | - | - | Shared API Utility |
| 171 | GET | `{BASE_URL}/players/${profilePlayerId}/stats` | profilePlayerId | - | - | /league/[id] |
| 172 | GET | `{BASE_URL}/players/by-league?leagueId=${league.id}` | id | leagueId | - | /all-players |
| 173 | GET | `{BASE_URL}/players/by-league?leagueId=${selectedLeague}` | selectedLeague | leagueId | - | /all-players |
| 174 | DELETE | `{BASE_URL}/profile` | - | - | - | Shared API Utility |
| 175 | GET | `{BASE_URL}/profile` | - | - | - | Shared API Utility |
| 176 | PATCH | `{BASE_URL}/profile` | - | - | (dynamic) JSON.stringify(userData) | Shared API Utility |
| 177 | PUT | `{BASE_URL}/profile` | - | - | (dynamic) JSON.stringify(userData) | Shared API Utility |
| 178 | GET | `{BASE_URL}/profile/leagues` | - | - | - | Shared Component: matchstatsdialog/MatchStatsDialog, Shared API Utility |
| 179 | GET | `{BASE_URL}/profile/matches` | - | - | - | Shared API Utility |
| 180 | POST | `{BASE_URL}/profile/picture` | - | - | (dynamic) formData | /profile, Shared Component: playercard/playercard, Shared Component: PlayerCardd, Shared API Utility |
| 181 | PUT | `{BASE_URL}/profile/skills` | - | - | skills | Shared API Utility |
| 182 | GET | `{BASE_URL}/profile/statistics` | - | - | - | Shared API Utility |
| 183 | GET | `{BASE_URL}/users/${userId}` | userId | - | - | Shared API Utility |
| 184 | PUT | `{BASE_URL}/users/${userId}` | userId | - | (dynamic) JSON.stringify(userData) | Shared API Utility |
| 185 | GET | `{BASE_URL}/users/me/achievements?_=${Date.now()}` | - | _ | - | /rewards, /trophy-room |
| 186 | POST | `{BASE_URL}/users/me/achievements/award` | - | - | - | Shared API Utility |
| 187 | POST | `{BASE_URL}/users/me/achievements/award?_=${Date.now()}` | - | _ | - | /rewards, /trophy-room |
| 188 | GET | `{BASE_URL}/users/me/global-stats` | - | - | - | /home |
| 189 | GET | `{BASE_URL}/world-ranking?${search.toString()}` | - | - | - | Shared API Utility |
| 190 | GET | `${apiBase}/auth/data` | - | - | - | /auth/callback |
| 191 | GET | `${apiBase}/leagues/${leagueId}` | leagueId | - | - | Shared Component: viewteam/viewteam |
| 192 | GET | `${apiBase}/leagues/${leagueId}/${path}` | leagueId, path | - | - | Shared Component: viewteam/viewteam |
| 193 | POST | `${apiBase}/leagues/${leagueId}/matches/${matchId}/make-captain` | leagueId, matchId | - | team, userId | Shared Component: viewteam/viewteam |
| 194 | POST | `${apiBase}/leagues/${leagueId}/matches/${matchId}/remove` | leagueId, matchId | - | team, playerId | Shared Component: viewteam/viewteam |
| 195 | POST | `${apiBase}/leagues/${leagueId}/matches/${matchId}/replace` | leagueId, matchId | - | team, removedId, replacementId | Shared Component: viewteam/viewteam |
| 196 | POST | `${apiBase}/leagues/${leagueId}/matches/${matchId}/switch` | leagueId, matchId | - | team, aId, bId | Shared Component: viewteam/viewteam |
| 197 | GET | `${apiBase}/leagues/${leagueId}/matches/${matchId}/team-view` | leagueId, matchId | - | - | Shared Component: viewteam/viewteam |
| 198 | GET | `${apiUrl}/api/leagues/${filters.leagueId}/seasons` | leagueId | - | - | /player/[id]/career |
| 199 | GET | `${apiUrl}/api/leagues/${leagueId}/player-averages` | leagueId | - | - | /player/[id]/career |
| 200 | POST | `${apiUrl}/matches/${matchId}/availability?action=${action}` | matchId, action | action | - | /league/[id], /match/[matchId] |
| 201 | PATCH | `${apiUrl}/profile` | - | - | (dynamic) JSON.stringify(updateData) | Shared API Utility |
| 202 | DELETE | `${apiUrl}/profile/picture` | - | - | - | Shared API Utility |
| 203 | GET | `${base.replace(/\/$/, '')}/world-ranking${qs.toString() ? ?${qs.toString()} : ''}` | replace | - | - | /api/world-ranking |

## Page-wise API Index

### /all-leagues

- `PATCH` `{BASE_URL}/api/leagues/${league.id}`
  Path Params: id
  Query Params: -
  Body Fields: (dynamic) leaguePatchPayload
- `DELETE` `{BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}`
  Path Params: id, seasonId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}/restore`
  Path Params: id, seasonId
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}/status`
  Path Params: id, seasonId
  Query Params: -
  Body Fields: archived
- `PATCH` `{BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}`
  Path Params: id, selectedSeasonId
  Query Params: -
  Body Fields: archived, isActive
- `POST` `{BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/archive`
  Path Params: id, selectedSeasonId
  Query Params: -
  Body Fields: archived
- `PATCH` `{BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/status`
  Path Params: id, selectedSeasonId
  Query Params: -
  Body Fields: archived, active, isActive
- `DELETE` `{BASE_URL}/api/seasons/${seasonId}`
  Path Params: seasonId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/api/seasons/${seasonId}/restore`
  Path Params: seasonId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/auth/status?bust=${ts}`
  Path Params: ts
  Query Params: bust
  Body Fields: -
- `POST` `{BASE_URL}/leagues`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData, (dynamic) JSON.stringify(league), (dynamic) JSON.stringify(leagueData)
- `DELETE` `{BASE_URL}/leagues/${adminSettingsLeague.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${adminSettingsLeague.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/leagues/${adminSettingsLeague.id}/status`
  Path Params: id
  Query Params: -
  Body Fields: active
- `DELETE` `{BASE_URL}/leagues/${league.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/leagues/${league.id}`
  Path Params: id
  Query Params: -
  Body Fields: (dynamic) leaguePatchPayload
- `GET` `{BASE_URL}/leagues/${league.id}?bust=${bust}`
  Path Params: id, bust
  Query Params: bust
  Body Fields: -
- `POST` `{BASE_URL}/leagues/${league.id}/leave`
  Path Params: id
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(preferredAdminId ? { preferredAdminId } : {})
- `DELETE` `{BASE_URL}/leagues/${league.id}/seasons/${seasonId}`
  Path Params: id, seasonId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/leagues/${league.id}/seasons/${seasonId}/restore`
  Path Params: id, seasonId
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/leagues/${league.id}/seasons/${seasonId}/status`
  Path Params: id, seasonId
  Query Params: -
  Body Fields: archived
- `PATCH` `{BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}`
  Path Params: id, selectedSeasonId
  Query Params: -
  Body Fields: archived, isActive
- `POST` `{BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/archive`
  Path Params: id, selectedSeasonId
  Query Params: -
  Body Fields: archived
- `PATCH` `{BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/status`
  Path Params: id, selectedSeasonId
  Query Params: -
  Body Fields: archived, active, isActive
- `PATCH` `{BASE_URL}/leagues/${league.id}/status`
  Path Params: id
  Query Params: -
  Body Fields: active
- `DELETE` `{BASE_URL}/leagues/${lid}/users/${memberId}`
  Path Params: lid, memberId
  Query Params: -
  Body Fields: -
- `DELETE` `{BASE_URL}/leagues/${selectedLeague.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${selectedLeague.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/leagues/${selectedLeague.id}/status`
  Path Params: id
  Query Params: -
  Body Fields: active
- `DELETE` `{BASE_URL}/leagues/${selectedLeague.id}/users/${memberId}`
  Path Params: id, memberId
  Query Params: -
  Body Fields: -
- `DELETE` `{BASE_URL}/matches/${matchId}`
  Path Params: matchId
  Query Params: -
  Body Fields: -
- `PUT` `{BASE_URL}/matches/${matchId}`
  Path Params: matchId
  Query Params: -
  Body Fields: archived, (dynamic) JSON.stringify(matchData)

### /all-matches

- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}?includeMatches=0`
  Path Params: leagueId
  Query Params: includeMatches
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}/matches?${params.toString()}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${selectedLeague}/seasons?${params.toString()}`
  Path Params: selectedLeague
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/user-leagues`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${match.id}/has-stats`
  Path Params: id
  Query Params: -
  Body Fields: -

### /all-players

- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/user-leagues`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/by-league?leagueId=${league.id}`
  Path Params: id
  Query Params: leagueId
  Body Fields: -
- `GET` `{BASE_URL}/players/by-league?leagueId=${selectedLeague}`
  Path Params: selectedLeague
  Query Params: leagueId
  Body Fields: -

### /api/world-ranking

- `GET` `${base.replace(/\/$/, '')}/world-ranking${qs.toString() ? ?${qs.toString()} : ''}`
  Path Params: replace
  Query Params: -
  Body Fields: -

### /auth/callback

- `GET` `${apiBase}/auth/data`
  Path Params: -
  Query Params: -
  Body Fields: -

### /contact

- `POST` `{BASE_URL}/api/contact`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(value)

### /dream-team

- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/dream-team?leagueId=${leagueId}`
  Path Params: leagueId
  Query Params: leagueId
  Body Fields: -

### /home

- `POST` `{BASE_URL}/api/leagues/${selectedLeague.id}/seasons`
  Path Params: id
  Query Params: -
  Body Fields: copyPlayers
- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/leagues`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData, (dynamic) JSON.stringify(league), (dynamic) JSON.stringify(leagueData)
- `GET` `{BASE_URL}/leagues/${l.id}?_t=${timestamp}`
  Path Params: id, timestamp
  Query Params: _t
  Body Fields: -
- `GET` `{BASE_URL}/users/me/global-stats`
  Path Params: -
  Query Params: -
  Body Fields: -

### /leader-board/_compnents

- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leaderboard?metric=${selectedMetric}&leagueId=${selectedLeague}&limit=5`
  Path Params: selectedMetric, selectedLeague
  Query Params: metric, leagueId, limit
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${selectedLeague}?includeMatches=0&_=${Date.now()}`
  Path Params: selectedLeague
  Query Params: includeMatches, _
  Body Fields: -

### /league/[id]

- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/dream-team?${params.toString()}`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${encodeURIComponent(league.id)}/player/${encodeURIComponent(m.id)}/quick-view${seasonParam}`
  Path Params: id, seasonParam
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${encodeURIComponent(leagueId)}/player/${encodeURIComponent(playerId)}/quick-view${seasonParam}`
  Path Params: leagueId, playerId, seasonParam
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${league.id}/statistics`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${league.id}/xp?${params.toString()}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `DELETE` `{BASE_URL}/leagues/${leagueId}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/leagues/${leagueId}`
  Path Params: leagueId
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(updatedData)
- `GET` `{BASE_URL}/leagues/${leagueId}?${params.toString()}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${selectedLeagueId}`
  Path Params: selectedLeagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/trophy-room?${params.toString()}`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches/${activeMatchId}/stats`
  Path Params: activeMatchId
  Query Params: -
  Body Fields: goals, assists, cleanSheets, penalties, freeKicks, defence, impact
- `PUT` `{BASE_URL}/matches/${m.id}`
  Path Params: id
  Query Params: -
  Body Fields: archived
- `DELETE` `{BASE_URL}/matches/${match.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `PUT` `{BASE_URL}/matches/${match.id}`
  Path Params: id
  Query Params: -
  Body Fields: archived
- `GET` `{BASE_URL}/matches/${match.id}/has-stats`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/me`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${encodeURIComponent(playerId)}`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${encodeURIComponent(playerId)}/stats?leagueId=${encodeURIComponent(leagueId)}`
  Path Params: playerId, leagueId
  Query Params: leagueId
  Body Fields: -
- `GET` `{BASE_URL}/players/${profilePlayerId}/stats`
  Path Params: profilePlayerId
  Query Params: -
  Body Fields: -
- `POST` `${apiUrl}/matches/${matchId}/availability?action=${action}`
  Path Params: matchId, action
  Query Params: action
  Body Fields: -

### /league/[id]/match

- `POST` `{BASE_URL}/leagues/${league.id}/matches`
  Path Params: id
  Query Params: -
  Body Fields: (dynamic) formData
- `GET` `{BASE_URL}/leagues/${leagueId}?includeMatches=0`
  Path Params: leagueId
  Query Params: includeMatches
  Body Fields: -
- `POST` `{BASE_URL}/matches`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(match), (dynamic) JSON.stringify(matchData)

### /league/[id]/match/[matchId]/edit

- `PATCH` `{BASE_URL}/leagues/${leagueId}/matches/${matchId}`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: (dynamic) formData
- `GET` `{BASE_URL}/leagues/${leagueId}/matches/${matchId}${cacheBuster}`
  Path Params: leagueId, matchId, cacheBuster
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}/notifications`
  Path Params: leagueId
  Query Params: -
  Body Fields: (dynamic) payloadBase
- `GET` `{BASE_URL}/leagues/${leagueId}/xp`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}${cacheBuster}`
  Path Params: leagueId, cacheBuster
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}/availability`
  Path Params: matchId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches/${matchId}/prediction`
  Path Params: matchId
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(payload)
- `GET` `{BASE_URL}/notifications`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) payloadBase
- `POST` `{BASE_URL}/notifications`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(body)
- `GET` `{BASE_URL}/notifications/broadcast`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) payloadBase

### /match/[matchId]

- `GET` `{BASE_URL}/leagues/${lid}`
  Path Params: lid
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${lid2}/matches/${match.id}`
  Path Params: lid2, id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${match.id}/captain-picks?_t=${Date.now()}`
  Path Params: id
  Query Params: _t
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}?_t=${Date.now()}`
  Path Params: matchId
  Query Params: _t
  Body Fields: -
- `POST` `{BASE_URL}/matches/${matchId}/stats`
  Path Params: matchId
  Query Params: -
  Body Fields: playerId, defence, penalties, freeKicks, impact, (dynamic) JSON.stringify(stats)
- `GET` `{BASE_URL}/matches/${matchId}/stats?_t=${Date.now()}`
  Path Params: matchId
  Query Params: _t
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}/stats?playerId=${apiPlayerId}&_t=${Date.now()}`
  Path Params: matchId, apiPlayerId
  Query Params: playerId, _t
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}/votes`
  Path Params: matchId
  Query Params: -
  Body Fields: -
- `POST` `${apiUrl}/matches/${matchId}/availability?action=${action}`
  Path Params: matchId, action
  Query Params: action
  Body Fields: -

### /player/[id]

- `GET` `{BASE_URL}/auth/status`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${effectiveLeagueId}/players`
  Path Params: effectiveLeagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}/seasons`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${encodeURIComponent(String(playerId))}`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/leagues/${effectiveLeagueId}/teammates`
  Path Params: playerId, effectiveLeagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/leagues/${league.id}/teammates`
  Path Params: playerId, id
  Query Params: -
  Body Fields: -

### /player/[id]/career

- `GET` `{BASE_URL}/leaderboard?metric=goals&leagueId=${encodeURIComponent(filters.leagueId)}`
  Path Params: leagueId
  Query Params: metric, leagueId
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/matches`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/simple-synergy${leagueParam}`
  Path Params: playerId, leagueParam
  Query Params: -
  Body Fields: -
- `GET` `${apiUrl}/api/leagues/${filters.leagueId}/seasons`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `${apiUrl}/api/leagues/${leagueId}/player-averages`
  Path Params: leagueId
  Query Params: -
  Body Fields: -

### /profile

- `POST` `{BASE_URL}/profile/picture`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData

### /rewards

- `GET` `{BASE_URL}/leagues?_=${Date.now()}`
  Path Params: -
  Query Params: _
  Body Fields: -
- `GET` `{BASE_URL}/users/me/achievements?_=${Date.now()}`
  Path Params: -
  Query Params: _
  Body Fields: -
- `POST` `{BASE_URL}/users/me/achievements/award?_=${Date.now()}`
  Path Params: -
  Query Params: _
  Body Fields: -

### /trophy-room

- `GET` `{BASE_URL}/auth/status?_=${Date.now()}`
  Path Params: -
  Query Params: _
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${encodeURIComponent(String(trophy.leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view?_=${Date.now()}`
  Path Params: leagueId, winnerId
  Query Params: _
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${league.id}/seasons?_=${Date.now()}`
  Path Params: id
  Query Params: _
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}/seasons?_=${Date.now()}`
  Path Params: leagueId
  Query Params: _
  Body Fields: -
- `GET` `{BASE_URL}/leagues/trophy-room?${params.toString()}`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/trophy-room?leagueId=${league.id}&_=${Date.now()}`
  Path Params: id
  Query Params: leagueId, _
  Body Fields: -
- `GET` `{BASE_URL}/leagues/trophy-room?leagueId=${league.id}&seasonId=${season.id}&_=${Date.now()}`
  Path Params: id
  Query Params: leagueId, seasonId, _
  Body Fields: -
- `GET` `{BASE_URL}/players/${encodeURIComponent(String(trophy.winnerId))}`
  Path Params: winnerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${encodeURIComponent(String(trophy.winnerId))}/stats?leagueId=${encodeURIComponent(String(trophy.leagueId))}`
  Path Params: winnerId, leagueId
  Query Params: leagueId
  Body Fields: -
- `GET` `{BASE_URL}/users/me/achievements?_=${Date.now()}`
  Path Params: -
  Query Params: _
  Body Fields: -
- `POST` `{BASE_URL}/users/me/achievements/award?_=${Date.now()}`
  Path Params: -
  Query Params: _
  Body Fields: -

### Shared API Utility

- `GET` `{BASE_URL}/auth/data`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/auth/login`
  Path Params: -
  Query Params: -
  Body Fields: user
- `GET` `{BASE_URL}/auth/logout`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/auth/logout`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/auth/register`
  Path Params: -
  Query Params: -
  Body Fields: user
- `POST` `{BASE_URL}/auth/resend-verification`
  Path Params: -
  Query Params: -
  Body Fields: email
- `POST` `{BASE_URL}/auth/reset-password`
  Path Params: -
  Query Params: -
  Body Fields: user
- `POST` `{BASE_URL}/auth/verify-otp`
  Path Params: -
  Query Params: -
  Body Fields: email, code
- `POST` `{BASE_URL}/auth/verify-registration`
  Path Params: -
  Query Params: -
  Body Fields: email, code
- `POST` `{BASE_URL}/auth/verify-reset-code`
  Path Params: -
  Query Params: -
  Body Fields: email, code, newPassword
- `POST` `{BASE_URL}/dream-team`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(dreamTeam)
- `GET` `{BASE_URL}/dream-team?leagueId=${leagueId}`
  Path Params: leagueId
  Query Params: leagueId
  Body Fields: -
- `DELETE` `{BASE_URL}/dream-team/${dreamTeamId}`
  Path Params: dreamTeamId
  Query Params: -
  Body Fields: -
- `PUT` `{BASE_URL}/dream-team/${dreamTeamId}`
  Path Params: dreamTeamId
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(dreamTeam)
- `GET` `{BASE_URL}/dream-team/formations`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leaderboard?${query.toString()}`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/leagues`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData, (dynamic) JSON.stringify(league), (dynamic) JSON.stringify(leagueData)
- `DELETE` `{BASE_URL}/leagues/${id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/leagues/${id}/join`
  Path Params: id
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/leagues/${id}/leave`
  Path Params: id
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/leagues/join`
  Path Params: -
  Query Params: -
  Body Fields: inviteCode
- `GET` `{BASE_URL}/matches`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(match), (dynamic) JSON.stringify(matchData)
- `GET` `{BASE_URL}/matches?leagueId=${leagueId}`
  Path Params: leagueId
  Query Params: leagueId
  Body Fields: -
- `DELETE` `{BASE_URL}/matches/${id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `PUT` `{BASE_URL}/matches/${id}`
  Path Params: id
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(match)
- `PUT` `{BASE_URL}/matches/${matchId}`
  Path Params: matchId
  Query Params: -
  Body Fields: archived, (dynamic) JSON.stringify(matchData)
- `POST` `{BASE_URL}/matches/${matchId}/availability?action=${action}`
  Path Params: matchId, action
  Query Params: action
  Body Fields: -
- `POST` `{BASE_URL}/matches/${matchId}/stats`
  Path Params: matchId
  Query Params: -
  Body Fields: playerId, defence, penalties, freeKicks, impact, (dynamic) JSON.stringify(stats)
- `GET` `{BASE_URL}/matches/${matchId}/stats?playerId=${playerId}${cacheBuster}`
  Path Params: matchId, playerId, cacheBuster
  Query Params: playerId
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}/votes`
  Path Params: matchId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches/${matchId}/votes`
  Path Params: matchId
  Query Params: -
  Body Fields: votedForId
- `GET` `{BASE_URL}/me`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/history-records?${params.toString()}`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/profile?leagueId=${leagueId}&year=${year}`
  Path Params: playerId, leagueId, year
  Query Params: leagueId, year
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/stats`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/trophies?${params.toString()}`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/players/${playerId}/xp?${params.toString()}`
  Path Params: playerId
  Query Params: -
  Body Fields: -
- `DELETE` `{BASE_URL}/profile`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/profile`
  Path Params: -
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/profile`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(userData)
- `PUT` `{BASE_URL}/profile`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(userData)
- `GET` `{BASE_URL}/profile/leagues`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/profile/matches`
  Path Params: -
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/profile/picture`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData
- `PUT` `{BASE_URL}/profile/skills`
  Path Params: -
  Query Params: -
  Body Fields: skills
- `GET` `{BASE_URL}/profile/statistics`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/users/${userId}`
  Path Params: userId
  Query Params: -
  Body Fields: -
- `PUT` `{BASE_URL}/users/${userId}`
  Path Params: userId
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(userData)
- `POST` `{BASE_URL}/users/me/achievements/award`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/world-ranking?${search.toString()}`
  Path Params: -
  Query Params: -
  Body Fields: -
- `PATCH` `${apiUrl}/profile`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(updateData)
- `DELETE` `${apiUrl}/profile/picture`
  Path Params: -
  Query Params: -
  Body Fields: -

### Shared Component: matchstatsdialog/MatchStatsDialog

- `GET` `{BASE_URL}/leagues`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${effectiveLeagueId}`
  Path Params: effectiveLeagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${encodeURIComponent(leagueIdForList)}/matches?all=1&includeArchived=1`
  Path Params: leagueIdForList
  Query Params: all, includeArchived
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${l.id}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${resolvedLeagueId}/matches/${resolvedMatchId}${cacheBuster}`
  Path Params: resolvedLeagueId, resolvedMatchId, cacheBuster
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/all`
  Path Params: -
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches?leagueId=${encodeURIComponent(leagueIdForList)}`
  Path Params: leagueIdForList
  Query Params: leagueId
  Body Fields: -
- `GET` `{BASE_URL}/matches/${resolvedMatchId}/captain-picks`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches/${resolvedMatchId}/captain-picks`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: category, playerId
- `PATCH` `{BASE_URL}/matches/${resolvedMatchId}/goals`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: homeTeamGoals, awayTeamGoals
- `PATCH` `{BASE_URL}/matches/${resolvedMatchId}/note`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: note
- `POST` `{BASE_URL}/matches/${resolvedMatchId}/stats`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: goals, assists, cleanSheets, penalties, freeKicks, defence, impact, playerId
- `GET` `{BASE_URL}/matches/${resolvedMatchId}/stats-window`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${resolvedMatchId}/stats?playerId=${encodeURIComponent(currentUserId)}&_t=${Date.now()}`
  Path Params: resolvedMatchId, currentUserId
  Query Params: playerId, _t
  Body Fields: -
- `GET` `{BASE_URL}/matches/${resolvedMatchId}/stats?playerId=${player.id}${cacheBuster}`
  Path Params: resolvedMatchId, id, cacheBuster
  Query Params: playerId
  Body Fields: -
- `GET` `{BASE_URL}/matches/${resolvedMatchId}/votes`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches/${resolvedMatchId}/votes`
  Path Params: resolvedMatchId
  Query Params: -
  Body Fields: (dynamic) JSON.stringify(voteData), votedForId
- `GET` `{BASE_URL}/matches/${resolvedMatchId}${cacheBuster}`
  Path Params: resolvedMatchId, cacheBuster
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/profile/leagues`
  Path Params: -
  Query Params: -
  Body Fields: -

### Shared Component: MatchSummary

- `GET` `{BASE_URL}/leagues/${leagueId}?includeMatches=0`
  Path Params: leagueId
  Query Params: includeMatches
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}/prediction`
  Path Params: matchId
  Query Params: -
  Body Fields: -

### Shared Component: Navbar/_components/index

- `GET` `{BASE_URL}/leagues/${encodeURIComponent(leagueId)}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${id}?includeMatches=0`
  Path Params: id
  Query Params: includeMatches
  Body Fields: -
- `GET` `{BASE_URL}/leagues/${leagueId}?includeMatches=0`
  Path Params: leagueId
  Query Params: includeMatches
  Body Fields: -
- `GET` `{BASE_URL}/matches/${encodeURIComponent(id)}`
  Path Params: id
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${encodeURIComponent(mid)}`
  Path Params: mid
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${encodeURIComponent(mid)}/availability`
  Path Params: mid
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/matches/${encodeURIComponent(mid)}/availability?action=${action}`
  Path Params: mid, action
  Query Params: action
  Body Fields: -
- `DELETE` `{BASE_URL}/notifications?userId=${encodeURIComponent(userId)}`
  Path Params: userId
  Query Params: userId
  Body Fields: -
- `GET` `{BASE_URL}/notifications?userId=${userId}`
  Path Params: userId
  Query Params: userId
  Body Fields: -
- `PATCH` `{BASE_URL}/notifications/${encodeURIComponent(id)}/read`
  Path Params: id
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/notifications/${notificationId}/read`
  Path Params: notificationId
  Query Params: -
  Body Fields: -
- `POST` `{BASE_URL}/notifications/${notificationId}/season-action`
  Path Params: notificationId
  Query Params: -
  Body Fields: action
- `POST` `{BASE_URL}/notifications/clear-all`
  Path Params: -
  Query Params: -
  Body Fields: userId
- `DELETE` `{BASE_URL}/notifications/clear-all?userId=${encodeURIComponent(userId)}`
  Path Params: userId
  Query Params: userId
  Body Fields: -

### Shared Component: playercard/playercard

- `POST` `{BASE_URL}/profile/picture`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData

### Shared Component: PlayerCardd

- `POST` `{BASE_URL}/profile/picture`
  Path Params: -
  Query Params: -
  Body Fields: (dynamic) formData

### Shared Component: TrophyRoom

- `GET` `{BASE_URL}/leagues/${encodeURIComponent(String(leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view`
  Path Params: leagueId, winnerId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/leagues/trophy-room?leagueId=${encodeURIComponent(String(leagueId))}`
  Path Params: leagueId
  Query Params: leagueId
  Body Fields: -

### Shared Component: viewteam/viewteam

- `GET` `{BASE_URL}/leagues/${leagueId}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `PATCH` `{BASE_URL}/leagues/${leagueId}/matches/${matchId}/layout`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: team, positions
- `GET` `{BASE_URL}/leagues/${leagueId}/matches/${matchId}/team-view`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: -
- `GET` `{BASE_URL}/matches/${matchId}/prediction`
  Path Params: matchId
  Query Params: -
  Body Fields: -
- `GET` `${apiBase}/leagues/${leagueId}`
  Path Params: leagueId
  Query Params: -
  Body Fields: -
- `GET` `${apiBase}/leagues/${leagueId}/${path}`
  Path Params: leagueId, path
  Query Params: -
  Body Fields: -
- `POST` `${apiBase}/leagues/${leagueId}/matches/${matchId}/make-captain`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: team, userId
- `POST` `${apiBase}/leagues/${leagueId}/matches/${matchId}/remove`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: team, playerId
- `POST` `${apiBase}/leagues/${leagueId}/matches/${matchId}/replace`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: team, removedId, replacementId
- `POST` `${apiBase}/leagues/${leagueId}/matches/${matchId}/switch`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: team, aId, bId
- `GET` `${apiBase}/leagues/${leagueId}/matches/${matchId}/team-view`
  Path Params: leagueId, matchId
  Query Params: -
  Body Fields: -


## Source Mapping

### 1. POST {BASE_URL}/api/contact

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(value)
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /contact
- Source Files: `src/app/contact/page.tsx:43`

### 2. PATCH {BASE_URL}/api/leagues/${league.id}

- Path Params: id
- Query Params: -
- Body Fields: (dynamic) leaguePatchPayload
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:938`

### 3. DELETE {BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}

- Path Params: id, seasonId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1225`

### 4. POST {BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}/restore

- Path Params: id, seasonId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1165`

### 5. PATCH {BASE_URL}/api/leagues/${league.id}/seasons/${seasonId}/status

- Path Params: id, seasonId
- Query Params: -
- Body Fields: archived
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1168`

### 6. PATCH {BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}

- Path Params: id, selectedSeasonId
- Query Params: -
- Body Fields: archived, isActive
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:942`

### 7. POST {BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/archive

- Path Params: id, selectedSeasonId
- Query Params: -
- Body Fields: archived
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:940`

### 8. PATCH {BASE_URL}/api/leagues/${league.id}/seasons/${selectedSeasonId}/status

- Path Params: id, selectedSeasonId
- Query Params: -
- Body Fields: archived, active, isActive
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:944`

### 9. POST {BASE_URL}/api/leagues/${selectedLeague.id}/seasons

- Path Params: id
- Query Params: -
- Body Fields: copyPlayers
- Auth Header Explicit in Call: Yes
- Pages/Features: /home
- Source Files: `src/app/home/_components/index.tsx:321`

### 10. DELETE {BASE_URL}/api/seasons/${seasonId}

- Path Params: seasonId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1227`

### 11. POST {BASE_URL}/api/seasons/${seasonId}/restore

- Path Params: seasonId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1167`

### 12. GET {BASE_URL}/auth/data

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:212`, `src/lib/api-fast.ts:343`, `src/lib/api-ultra-fast.ts:388`, `src/lib/api.ts:258`, `src/lib/api.ts:359`

### 13. POST {BASE_URL}/auth/login

- Path Params: -
- Query Params: -
- Body Fields: user
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:168`, `src/lib/api-fast.ts:256`, `src/lib/api-ultra-fast.ts:340`, `src/lib/api.ts:56`

### 14. GET {BASE_URL}/auth/logout

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:308`

### 15. POST {BASE_URL}/auth/logout

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:229`, `src/lib/api-fast.ts:360`, `src/lib/api-ultra-fast.ts:406`, `src/lib/api.ts:300`

### 16. POST {BASE_URL}/auth/register

- Path Params: -
- Query Params: -
- Body Fields: user
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:190`, `src/lib/api-fast.ts:321`, `src/lib/api-ultra-fast.ts:362`, `src/lib/api.ts:86`

### 17. POST {BASE_URL}/auth/resend-verification

- Path Params: -
- Query Params: -
- Body Fields: email
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:145`

### 18. POST {BASE_URL}/auth/reset-password

- Path Params: -
- Query Params: -
- Body Fields: user
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:169`

### 19. GET {BASE_URL}/auth/status

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-matches, /all-players, /dream-team, /home, /leader-board/_compnents, /league/[id], /player/[id]
- Source Files: `src/app/all-matches/_components/page.tsx:446`, `src/app/all-players/_components/page.tsx:263`, `src/app/dream-team/_components/page.tsx:294`, `src/app/home/_components/index.tsx:402`, `src/app/leader-board/_compnents/page.tsx:112`, `src/app/league/[id]/_components/page.tsx:1212`, `src/app/player/[id]/_components/page.tsx:636`

### 20. GET {BASE_URL}/auth/status?_=${Date.now()}

- Path Params: -
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:1747`

### 21. GET {BASE_URL}/auth/status?bust=${ts}

- Path Params: ts
- Query Params: bust
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:2531`

### 22. POST {BASE_URL}/auth/verify-otp

- Path Params: -
- Query Params: -
- Body Fields: email, code
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:220`

### 23. POST {BASE_URL}/auth/verify-registration

- Path Params: -
- Query Params: -
- Body Fields: email, code
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:116`

### 24. POST {BASE_URL}/auth/verify-reset-code

- Path Params: -
- Query Params: -
- Body Fields: email, code, newPassword
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:194`

### 25. POST {BASE_URL}/dream-team

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(dreamTeam)
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:813`

### 26. GET {BASE_URL}/dream-team?${params.toString()}

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1003`

### 27. GET {BASE_URL}/dream-team?leagueId=${leagueId}

- Path Params: leagueId
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /dream-team, Shared API Utility
- Source Files: `src/app/dream-team/_components/page.tsx:366`, `src/lib/api-fast.ts:833`

### 28. DELETE {BASE_URL}/dream-team/${dreamTeamId}

- Path Params: dreamTeamId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:874`

### 29. PUT {BASE_URL}/dream-team/${dreamTeamId}

- Path Params: dreamTeamId
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(dreamTeam)
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:851`

### 30. GET {BASE_URL}/dream-team/formations

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:838`

### 31. GET {BASE_URL}/leaderboard?${query.toString()}

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:735`, `src/lib/api-fast.ts:910`, `src/lib/api-ultra-fast.ts:858`

### 32. GET {BASE_URL}/leaderboard?metric=${selectedMetric}&leagueId=${selectedLeague}&limit=5

- Path Params: selectedMetric, selectedLeague
- Query Params: metric, leagueId, limit
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /leader-board/_compnents
- Source Files: `src/app/leader-board/_compnents/page.tsx:213`

### 33. GET {BASE_URL}/leaderboard?metric=goals&leagueId=${encodeURIComponent(filters.leagueId)}

- Path Params: leagueId
- Query Params: metric, leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]/career
- Source Files: `src/app/player/[id]/career/page.tsx:1203`

### 34. GET {BASE_URL}/leagues

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog, Shared API Utility
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:511`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:947`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1172`, `src/lib/api-fast.ts:389`, `src/lib/api-ultra-fast.ts:436`, `src/lib/api.ts:412`

### 35. POST {BASE_URL}/leagues

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) formData, (dynamic) JSON.stringify(league), (dynamic) JSON.stringify(leagueData)
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues, /home, Shared API Utility
- Source Files: `src/app/all-leagues/_components/index.tsx:2860`, `src/app/home/_components/index.tsx:1563`, `src/lib/api-chunked.ts:273`, `src/lib/api-fast.ts:394`, `src/lib/api-ultra-fast.ts:501`, `src/lib/api.ts:435`

### 36. GET {BASE_URL}/leagues?_=${Date.now()}

- Path Params: -
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /rewards
- Source Files: `src/app/rewards/page.tsx:569`

### 37. DELETE {BASE_URL}/leagues/${adminSettingsLeague.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3310`

### 38. GET {BASE_URL}/leagues/${adminSettingsLeague.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3243`

### 39. PATCH {BASE_URL}/leagues/${adminSettingsLeague.id}/status

- Path Params: id
- Query Params: -
- Body Fields: active
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3338`, `src/app/all-leagues/_components/index.tsx:3367`

### 40. GET {BASE_URL}/leagues/${effectiveLeagueId}

- Path Params: effectiveLeagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:794`

### 41. GET {BASE_URL}/leagues/${effectiveLeagueId}/players

- Path Params: effectiveLeagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]
- Source Files: `src/app/player/[id]/_components/page.tsx:558`

### 42. GET {BASE_URL}/leagues/${encodeURIComponent(league.id)}/player/${encodeURIComponent(m.id)}/quick-view${seasonParam}

- Path Params: id, seasonParam
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1972`

### 43. GET {BASE_URL}/leagues/${encodeURIComponent(leagueId)}

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1379`

### 44. GET {BASE_URL}/leagues/${encodeURIComponent(leagueId)}/player/${encodeURIComponent(playerId)}/quick-view${seasonParam}

- Path Params: leagueId, playerId, seasonParam
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:2863`

### 45. GET {BASE_URL}/leagues/${encodeURIComponent(leagueIdForList)}/matches?all=1&includeArchived=1

- Path Params: leagueIdForList
- Query Params: all, includeArchived
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:437`

### 46. GET {BASE_URL}/leagues/${encodeURIComponent(String(leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view

- Path Params: leagueId, winnerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: TrophyRoom
- Source Files: `src/Components/TrophyRoom.tsx:320`

### 47. GET {BASE_URL}/leagues/${encodeURIComponent(String(trophy.leagueId))}/player/${encodeURIComponent(String(trophy.winnerId))}/quick-view?_=${Date.now()}

- Path Params: leagueId, winnerId
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:2303`

### 48. DELETE {BASE_URL}/leagues/${id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:436`, `src/lib/api-fast.ts:509`, `src/lib/api-ultra-fast.ts:570`

### 49. GET {BASE_URL}/leagues/${id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:307`, `src/lib/api-fast.ts:420`, `src/lib/api-ultra-fast.ts:521`

### 50. GET {BASE_URL}/leagues/${id}?includeMatches=0

- Path Params: id
- Query Params: includeMatches
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1195`

### 51. POST {BASE_URL}/leagues/${id}/join

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:329`, `src/lib/api-fast.ts:433`, `src/lib/api-ultra-fast.ts:534`

### 52. POST {BASE_URL}/leagues/${id}/leave

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:402`, `src/lib/api-fast.ts:484`, `src/lib/api-ultra-fast.ts:552`

### 53. GET {BASE_URL}/leagues/${l.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:562`

### 54. GET {BASE_URL}/leagues/${l.id}?_t=${timestamp}

- Path Params: id, timestamp
- Query Params: _t
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /home
- Source Files: `src/app/home/_components/index.tsx:517`

### 55. DELETE {BASE_URL}/leagues/${league.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:2619`

### 56. PATCH {BASE_URL}/leagues/${league.id}

- Path Params: id
- Query Params: -
- Body Fields: (dynamic) leaguePatchPayload
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:939`

### 57. GET {BASE_URL}/leagues/${league.id}?bust=${bust}

- Path Params: id, bust
- Query Params: bust
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1069`, `src/app/all-leagues/_components/index.tsx:2556`, `src/app/all-leagues/_components/index.tsx:2934`

### 58. POST {BASE_URL}/leagues/${league.id}/leave

- Path Params: id
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(preferredAdminId ? { preferredAdminId } : {})
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3019`

### 59. POST {BASE_URL}/leagues/${league.id}/matches

- Path Params: id
- Query Params: -
- Body Fields: (dynamic) formData
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match
- Source Files: `src/app/league/[id]/match/_components/page.tsx:715`

### 60. GET {BASE_URL}/leagues/${league.id}/seasons?_=${Date.now()}

- Path Params: id
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:2086`

### 61. DELETE {BASE_URL}/leagues/${league.id}/seasons/${seasonId}

- Path Params: id, seasonId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1226`

### 62. POST {BASE_URL}/leagues/${league.id}/seasons/${seasonId}/restore

- Path Params: id, seasonId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1166`

### 63. PATCH {BASE_URL}/leagues/${league.id}/seasons/${seasonId}/status

- Path Params: id, seasonId
- Query Params: -
- Body Fields: archived
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1169`

### 64. PATCH {BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}

- Path Params: id, selectedSeasonId
- Query Params: -
- Body Fields: archived, isActive
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:943`

### 65. POST {BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/archive

- Path Params: id, selectedSeasonId
- Query Params: -
- Body Fields: archived
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:941`

### 66. PATCH {BASE_URL}/leagues/${league.id}/seasons/${selectedSeasonId}/status

- Path Params: id, selectedSeasonId
- Query Params: -
- Body Fields: archived, active, isActive
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:945`

### 67. GET {BASE_URL}/leagues/${league.id}/statistics

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:2009`

### 68. PATCH {BASE_URL}/leagues/${league.id}/status

- Path Params: id
- Query Params: -
- Body Fields: active
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:4295`

### 69. GET {BASE_URL}/leagues/${league.id}/xp?${params.toString()}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1337`

### 70. DELETE {BASE_URL}/leagues/${leagueId}

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1532`

### 71. GET {BASE_URL}/leagues/${leagueId}

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-players, Shared Component: viewteam/viewteam
- Source Files: `src/app/all-players/_components/page.tsx:313`, `src/Components/viewteam/viewteam.tsx:660`

### 72. PATCH {BASE_URL}/leagues/${leagueId}

- Path Params: leagueId
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(updatedData)
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1507`

### 73. GET {BASE_URL}/leagues/${leagueId}?${params.toString()}

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:946`

### 74. GET {BASE_URL}/leagues/${leagueId}?includeMatches=0

- Path Params: leagueId
- Query Params: includeMatches
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-matches, /league/[id]/match, Shared Component: MatchSummary, Shared Component: Navbar/_components/index
- Source Files: `src/app/all-matches/_components/page.tsx:509`, `src/app/league/[id]/match/_components/page.tsx:670`, `src/Components/MatchSummary.tsx:110`, `src/Components/Navbar/_components/index.tsx:1978`

### 75. GET {BASE_URL}/leagues/${leagueId}/matches?${params.toString()}

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-matches
- Source Files: `src/app/all-matches/_components/page.tsx:626`

### 76. PATCH {BASE_URL}/leagues/${leagueId}/matches/${matchId}

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: (dynamic) formData
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:1697`

### 77. PATCH {BASE_URL}/leagues/${leagueId}/matches/${matchId}/layout

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: team, positions
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:496`, `src/Components/viewteam/viewteam.tsx:519`

### 78. GET {BASE_URL}/leagues/${leagueId}/matches/${matchId}/team-view

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:539`, `src/Components/viewteam/viewteam.tsx:618`

### 79. GET {BASE_URL}/leagues/${leagueId}/matches/${matchId}${cacheBuster}

- Path Params: leagueId, matchId, cacheBuster
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:793`

### 80. GET {BASE_URL}/leagues/${leagueId}/notifications

- Path Params: leagueId
- Query Params: -
- Body Fields: (dynamic) payloadBase
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:1535`

### 81. GET {BASE_URL}/leagues/${leagueId}/seasons

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]
- Source Files: `src/app/player/[id]/_components/page.tsx:364`

### 82. GET {BASE_URL}/leagues/${leagueId}/seasons?_=${Date.now()}

- Path Params: leagueId
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:1905`

### 83. GET {BASE_URL}/leagues/${leagueId}/xp

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:880`

### 84. GET {BASE_URL}/leagues/${leagueId}${cacheBuster}

- Path Params: leagueId, cacheBuster
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:787`

### 85. GET {BASE_URL}/leagues/${lid}

- Path Params: lid
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId]
- Source Files: `src/app/match/[matchId]/_components/index.tsx:222`

### 86. DELETE {BASE_URL}/leagues/${lid}/users/${memberId}

- Path Params: lid, memberId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:5194`

### 87. GET {BASE_URL}/leagues/${lid2}/matches/${match.id}

- Path Params: lid2, id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId]
- Source Files: `src/app/match/[matchId]/_components/index.tsx:256`

### 88. GET {BASE_URL}/leagues/${resolvedLeagueId}/matches/${resolvedMatchId}${cacheBuster}

- Path Params: resolvedLeagueId, resolvedMatchId, cacheBuster
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:742`

### 89. DELETE {BASE_URL}/leagues/${selectedLeague.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3135`

### 90. GET {BASE_URL}/leagues/${selectedLeague.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3087`

### 91. PATCH {BASE_URL}/leagues/${selectedLeague.id}/status

- Path Params: id
- Query Params: -
- Body Fields: active
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:3156`, `src/app/all-leagues/_components/index.tsx:3179`

### 92. DELETE {BASE_URL}/leagues/${selectedLeague.id}/users/${memberId}

- Path Params: id, memberId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:2976`

### 93. GET {BASE_URL}/leagues/${selectedLeague}?includeMatches=0&_=${Date.now()}

- Path Params: selectedLeague
- Query Params: includeMatches, _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /leader-board/_compnents
- Source Files: `src/app/leader-board/_compnents/page.tsx:187`

### 94. GET {BASE_URL}/leagues/${selectedLeague}/seasons?${params.toString()}

- Path Params: selectedLeague
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-matches
- Source Files: `src/app/all-matches/_components/page.tsx:713`

### 95. GET {BASE_URL}/leagues/${selectedLeagueId}

- Path Params: selectedLeagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1419`

### 96. GET {BASE_URL}/leagues/all

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:516`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:951`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1174`

### 97. POST {BASE_URL}/leagues/join

- Path Params: -
- Query Params: -
- Body Fields: inviteCode
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:368`, `src/lib/api-fast.ts:458`, `src/lib/api.ts:447`

### 98. GET {BASE_URL}/leagues/trophy-room?${params.toString()}

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id], /trophy-room
- Source Files: `src/app/league/[id]/_components/page.tsx:768`, `src/app/trophy-room/page.tsx:1997`

### 99. GET {BASE_URL}/leagues/trophy-room?leagueId=${encodeURIComponent(String(leagueId))}

- Path Params: leagueId
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: TrophyRoom
- Source Files: `src/Components/TrophyRoom.tsx:278`

### 100. GET {BASE_URL}/leagues/trophy-room?leagueId=${league.id}&_=${Date.now()}

- Path Params: id
- Query Params: leagueId, _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:2104`

### 101. GET {BASE_URL}/leagues/trophy-room?leagueId=${league.id}&seasonId=${season.id}&_=${Date.now()}

- Path Params: id
- Query Params: leagueId, seasonId, _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:2121`

### 102. GET {BASE_URL}/leagues/user-leagues

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-matches, /all-players
- Source Files: `src/app/all-matches/_components/page.tsx:486`, `src/app/all-players/_components/page.tsx:290`

### 103. GET {BASE_URL}/matches

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:541`, `src/lib/api-ultra-fast.ts:593`, `src/lib/api.ts:478`

### 104. POST {BASE_URL}/matches

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(match), (dynamic) JSON.stringify(matchData)
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match, Shared API Utility
- Source Files: `src/app/league/[id]/match/_components/page.tsx:803`, `src/lib/api-chunked.ts:524`, `src/lib/api-fast.ts:550`, `src/lib/api-ultra-fast.ts:631`, `src/lib/api-ultra-fast.ts:675`, `src/lib/api.ts:509`

### 105. GET {BASE_URL}/matches?leagueId=${encodeURIComponent(leagueIdForList)}

- Path Params: leagueIdForList
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:454`

### 106. GET {BASE_URL}/matches?leagueId=${leagueId}

- Path Params: leagueId
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:545`, `src/lib/api-ultra-fast.ts:612`

### 107. POST {BASE_URL}/matches/${activeMatchId}/stats

- Path Params: activeMatchId
- Query Params: -
- Body Fields: goals, assists, cleanSheets, penalties, freeKicks, defence, impact
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:855`

### 108. GET {BASE_URL}/matches/${encodeURIComponent(id)}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1248`, `src/Components/Navbar/_components/index.tsx:1337`

### 109. GET {BASE_URL}/matches/${encodeURIComponent(mid)}

- Path Params: mid
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:2168`, `src/Components/Navbar/_components/index.tsx:2246`

### 110. GET {BASE_URL}/matches/${encodeURIComponent(mid)}/availability

- Path Params: mid
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1117`

### 111. POST {BASE_URL}/matches/${encodeURIComponent(mid)}/availability?action=${action}

- Path Params: mid, action
- Query Params: action
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1735`

### 112. DELETE {BASE_URL}/matches/${id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:654`, `src/lib/api-fast.ts:765`, `src/lib/api-ultra-fast.ts:778`

### 113. GET {BASE_URL}/matches/${id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:594`, `src/lib/api-fast.ts:639`, `src/lib/api-ultra-fast.ts:744`

### 114. PUT {BASE_URL}/matches/${id}

- Path Params: id
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(match)
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:559`, `src/lib/api-fast.ts:597`, `src/lib/api-ultra-fast.ts:698`

### 115. PUT {BASE_URL}/matches/${m.id}

- Path Params: id
- Query Params: -
- Body Fields: archived
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:2657`

### 116. DELETE {BASE_URL}/matches/${match.id}

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:801`

### 117. PUT {BASE_URL}/matches/${match.id}

- Path Params: id
- Query Params: -
- Body Fields: archived
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:2712`, `src/app/league/[id]/_components/page.tsx:2793`

### 118. GET {BASE_URL}/matches/${match.id}/captain-picks?_t=${Date.now()}

- Path Params: id
- Query Params: _t
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId]
- Source Files: `src/app/match/[matchId]/_components/index.tsx:317`

### 119. GET {BASE_URL}/matches/${match.id}/has-stats

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-matches, /league/[id]
- Source Files: `src/app/all-matches/_components/page.tsx:1375`, `src/app/league/[id]/_components/page.tsx:2625`

### 120. DELETE {BASE_URL}/matches/${matchId}

- Path Params: matchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues
- Source Files: `src/app/all-leagues/_components/index.tsx:1131`

### 121. PUT {BASE_URL}/matches/${matchId}

- Path Params: matchId
- Query Params: -
- Body Fields: archived, (dynamic) JSON.stringify(matchData)
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-leagues, Shared API Utility
- Source Files: `src/app/all-leagues/_components/index.tsx:1099`, `src/lib/api.ts:521`

### 122. GET {BASE_URL}/matches/${matchId}?_t=${Date.now()}

- Path Params: matchId
- Query Params: _t
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId]
- Source Files: `src/app/match/[matchId]/_components/index.tsx:170`

### 123. GET {BASE_URL}/matches/${matchId}/availability

- Path Params: matchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:607`

### 124. POST {BASE_URL}/matches/${matchId}/availability?action=${action}

- Path Params: matchId, action
- Query Params: action
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:617`, `src/lib/api-fast.ts:734`, `src/lib/api-ultra-fast.ts:758`

### 125. GET {BASE_URL}/matches/${matchId}/prediction

- Path Params: matchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: MatchSummary, Shared Component: viewteam/viewteam
- Source Files: `src/Components/MatchSummary.tsx:148`, `src/Components/viewteam/viewteam.tsx:697`

### 126. POST {BASE_URL}/matches/${matchId}/prediction

- Path Params: matchId
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(payload)
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:918`

### 127. POST {BASE_URL}/matches/${matchId}/stats

- Path Params: matchId
- Query Params: -
- Body Fields: playerId, defence, penalties, freeKicks, impact, (dynamic) JSON.stringify(stats)
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId], Shared API Utility
- Source Files: `src/app/match/[matchId]/_components/index.tsx:439`, `src/lib/api-fast.ts:685`

### 128. GET {BASE_URL}/matches/${matchId}/stats?_t=${Date.now()}

- Path Params: matchId
- Query Params: _t
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId]
- Source Files: `src/app/match/[matchId]/_components/index.tsx:275`

### 129. GET {BASE_URL}/matches/${matchId}/stats?playerId=${apiPlayerId}&_t=${Date.now()}

- Path Params: matchId, apiPlayerId
- Query Params: playerId, _t
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId]
- Source Files: `src/app/match/[matchId]/_components/index.tsx:398`

### 130. GET {BASE_URL}/matches/${matchId}/stats?playerId=${playerId}${cacheBuster}

- Path Params: matchId, playerId, cacheBuster
- Query Params: playerId
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:720`

### 131. GET {BASE_URL}/matches/${matchId}/votes

- Path Params: matchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /match/[matchId], Shared API Utility
- Source Files: `src/app/match/[matchId]/_components/index.tsx:350`, `src/lib/api-fast.ts:672`

### 132. POST {BASE_URL}/matches/${matchId}/votes

- Path Params: matchId
- Query Params: -
- Body Fields: votedForId
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:652`

### 133. GET {BASE_URL}/matches/${resolvedMatchId}/captain-picks

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1991`

### 134. POST {BASE_URL}/matches/${resolvedMatchId}/captain-picks

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: category, playerId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1669`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1689`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:2137`

### 135. PATCH {BASE_URL}/matches/${resolvedMatchId}/goals

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: homeTeamGoals, awayTeamGoals
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1289`

### 136. PATCH {BASE_URL}/matches/${resolvedMatchId}/note

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: note
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1305`

### 137. POST {BASE_URL}/matches/${resolvedMatchId}/stats

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: goals, assists, cleanSheets, penalties, freeKicks, defence, impact, playerId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1595`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:2225`

### 138. GET {BASE_URL}/matches/${resolvedMatchId}/stats-window

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:2203`

### 139. GET {BASE_URL}/matches/${resolvedMatchId}/stats?playerId=${encodeURIComponent(currentUserId)}&_t=${Date.now()}

- Path Params: resolvedMatchId, currentUserId
- Query Params: playerId, _t
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1899`

### 140. GET {BASE_URL}/matches/${resolvedMatchId}/stats?playerId=${player.id}${cacheBuster}

- Path Params: resolvedMatchId, id, cacheBuster
- Query Params: playerId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1747`

### 141. GET {BASE_URL}/matches/${resolvedMatchId}/votes

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1376`

### 142. POST {BASE_URL}/matches/${resolvedMatchId}/votes

- Path Params: resolvedMatchId
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(voteData), votedForId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1524`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1637`

### 143. GET {BASE_URL}/matches/${resolvedMatchId}${cacheBuster}

- Path Params: resolvedMatchId, cacheBuster
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:746`

### 144. GET {BASE_URL}/me

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id], Shared API Utility
- Source Files: `src/app/league/[id]/_components/page.tsx:1115`, `src/lib/useAuth.ts:31`

### 145. GET {BASE_URL}/notifications

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) payloadBase
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:1537`

### 146. POST {BASE_URL}/notifications

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(body)
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:1566`

### 147. DELETE {BASE_URL}/notifications?userId=${encodeURIComponent(userId)}

- Path Params: userId
- Query Params: userId
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1649`

### 148. GET {BASE_URL}/notifications?userId=${userId}

- Path Params: userId
- Query Params: userId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1475`

### 149. PATCH {BASE_URL}/notifications/${encodeURIComponent(id)}/read

- Path Params: id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1698`

### 150. PATCH {BASE_URL}/notifications/${notificationId}/read

- Path Params: notificationId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1555`

### 151. POST {BASE_URL}/notifications/${notificationId}/season-action

- Path Params: notificationId
- Query Params: -
- Body Fields: action
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1806`

### 152. GET {BASE_URL}/notifications/broadcast

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) payloadBase
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /league/[id]/match/[matchId]/edit
- Source Files: `src/app/league/[id]/match/[matchId]/edit/_components/EditMatchPage.tsx:1536`

### 153. POST {BASE_URL}/notifications/clear-all

- Path Params: -
- Query Params: -
- Body Fields: userId
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1651`

### 154. DELETE {BASE_URL}/notifications/clear-all?userId=${encodeURIComponent(userId)}

- Path Params: userId
- Query Params: userId
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared Component: Navbar/_components/index
- Source Files: `src/Components/Navbar/_components/index.tsx:1650`

### 155. GET {BASE_URL}/players

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:890`, `src/lib/api-ultra-fast.ts:823`

### 156. GET {BASE_URL}/players/${encodeURIComponent(playerId)}

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:2867`

### 157. GET {BASE_URL}/players/${encodeURIComponent(playerId)}/stats?leagueId=${encodeURIComponent(leagueId)}

- Path Params: playerId, leagueId
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:2871`

### 158. GET {BASE_URL}/players/${encodeURIComponent(String(playerId))}

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]
- Source Files: `src/app/player/[id]/_components/page.tsx:876`

### 159. GET {BASE_URL}/players/${encodeURIComponent(String(trophy.winnerId))}

- Path Params: winnerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:2307`

### 160. GET {BASE_URL}/players/${encodeURIComponent(String(trophy.winnerId))}/stats?leagueId=${encodeURIComponent(String(trophy.leagueId))}

- Path Params: winnerId, leagueId
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /trophy-room
- Source Files: `src/app/trophy-room/page.tsx:2311`

### 161. GET {BASE_URL}/players/${playerId}

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]/career
- Source Files: `src/app/player/[id]/career/page.tsx:1033`

### 162. GET {BASE_URL}/players/${playerId}/history-records?${params.toString()}

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:1107`

### 163. GET {BASE_URL}/players/${playerId}/leagues/${effectiveLeagueId}/teammates

- Path Params: playerId, effectiveLeagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]
- Source Files: `src/app/player/[id]/_components/page.tsx:536`

### 164. GET {BASE_URL}/players/${playerId}/leagues/${league.id}/teammates

- Path Params: playerId, id
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]
- Source Files: `src/app/player/[id]/_components/page.tsx:499`

### 165. GET {BASE_URL}/players/${playerId}/matches

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]/career
- Source Files: `src/app/player/[id]/career/page.tsx:1148`

### 166. GET {BASE_URL}/players/${playerId}/profile?leagueId=${leagueId}&year=${year}

- Path Params: playerId, leagueId, year
- Query Params: leagueId, year
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:1013`

### 167. GET {BASE_URL}/players/${playerId}/simple-synergy${leagueParam}

- Path Params: playerId, leagueParam
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]/career
- Source Files: `src/app/player/[id]/career/page.tsx:1241`

### 168. GET {BASE_URL}/players/${playerId}/stats

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-chunked.ts:715`, `src/lib/api-fast.ts:894`, `src/lib/api-ultra-fast.ts:842`

### 169. GET {BASE_URL}/players/${playerId}/trophies?${params.toString()}

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:1074`

### 170. GET {BASE_URL}/players/${playerId}/xp?${params.toString()}

- Path Params: playerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:1039`

### 171. GET {BASE_URL}/players/${profilePlayerId}/stats

- Path Params: profilePlayerId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id]
- Source Files: `src/app/league/[id]/_components/page.tsx:1118`

### 172. GET {BASE_URL}/players/by-league?leagueId=${league.id}

- Path Params: id
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-players
- Source Files: `src/app/all-players/_components/page.tsx:557`

### 173. GET {BASE_URL}/players/by-league?leagueId=${selectedLeague}

- Path Params: selectedLeague
- Query Params: leagueId
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /all-players
- Source Files: `src/app/all-players/_components/page.tsx:608`

### 174. DELETE {BASE_URL}/profile

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:922`

### 175. GET {BASE_URL}/profile

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:660`, `src/lib/profileApi.ts:11`

### 176. PATCH {BASE_URL}/profile

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(userData)
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/profileApi.ts:36`

### 177. PUT {BASE_URL}/profile

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(userData)
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:699`

### 178. GET {BASE_URL}/profile/leagues

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: matchstatsdialog/MatchStatsDialog, Shared API Utility
- Source Files: `src/Components/matchstatsdialog/MatchStatsDialog.tsx:520`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:955`, `src/Components/matchstatsdialog/MatchStatsDialog.tsx:1176`, `src/lib/api.ts:535`, `src/lib/api.ts:787`

### 179. GET {BASE_URL}/profile/matches

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:812`

### 180. POST {BASE_URL}/profile/picture

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) formData
- Auth Header Explicit in Call: Yes
- Pages/Features: /profile, Shared Component: playercard/playercard, Shared Component: PlayerCardd, Shared API Utility
- Source Files: `src/app/profile/_components/index.tsx:623`, `src/Components/playercard/playercard.tsx:393`, `src/Components/PlayerCardd.tsx:367`, `src/lib/api.ts:586`, `src/lib/api.ts:840`

### 181. PUT {BASE_URL}/profile/skills

- Path Params: -
- Query Params: -
- Body Fields: skills
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:734`, `src/lib/profileApi.ts:71`

### 182. GET {BASE_URL}/profile/statistics

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:762`

### 183. GET {BASE_URL}/users/${userId}

- Path Params: userId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:614`

### 184. PUT {BASE_URL}/users/${userId}

- Path Params: userId
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(userData)
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:624`

### 185. GET {BASE_URL}/users/me/achievements?_=${Date.now()}

- Path Params: -
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /rewards, /trophy-room
- Source Files: `src/app/rewards/page.tsx:610`, `src/app/trophy-room/page.tsx:2054`

### 186. POST {BASE_URL}/users/me/achievements/award

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:1139`

### 187. POST {BASE_URL}/users/me/achievements/award?_=${Date.now()}

- Path Params: -
- Query Params: _
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /rewards, /trophy-room
- Source Files: `src/app/rewards/page.tsx:599`, `src/app/trophy-room/page.tsx:2043`

### 188. GET {BASE_URL}/users/me/global-stats

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /home
- Source Files: `src/app/home/_components/index.tsx:1422`

### 189. GET {BASE_URL}/world-ranking?${search.toString()}

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api-fast.ts:951`, `src/lib/api.ts:1379`

### 190. GET ${apiBase}/auth/data

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /auth/callback
- Source Files: `src/app/auth/callback/CallbackClient.tsx:210`

### 191. GET ${apiBase}/leagues/${leagueId}

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1126`

### 192. GET ${apiBase}/leagues/${leagueId}/${path}

- Path Params: leagueId, path
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1107`

### 193. POST ${apiBase}/leagues/${leagueId}/matches/${matchId}/make-captain

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: team, userId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1215`

### 194. POST ${apiBase}/leagues/${leagueId}/matches/${matchId}/remove

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: team, playerId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1152`

### 195. POST ${apiBase}/leagues/${leagueId}/matches/${matchId}/replace

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: team, removedId, replacementId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1233`

### 196. POST ${apiBase}/leagues/${leagueId}/matches/${matchId}/switch

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: team, aId, bId
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1189`

### 197. GET ${apiBase}/leagues/${leagueId}/matches/${matchId}/team-view

- Path Params: leagueId, matchId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared Component: viewteam/viewteam
- Source Files: `src/Components/viewteam/viewteam.tsx:1239`

### 198. GET ${apiUrl}/api/leagues/${filters.leagueId}/seasons

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]/career
- Source Files: `src/app/player/[id]/career/page.tsx:496`

### 199. GET ${apiUrl}/api/leagues/${leagueId}/player-averages

- Path Params: leagueId
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /player/[id]/career
- Source Files: `src/app/player/[id]/career/page.tsx:557`

### 200. POST ${apiUrl}/matches/${matchId}/availability?action=${action}

- Path Params: matchId, action
- Query Params: action
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: /league/[id], /match/[matchId]
- Source Files: `src/app/league/[id]/_components/page.tsx:1460`, `src/app/match/[matchId]/_components/index.tsx:534`

### 201. PATCH ${apiUrl}/profile

- Path Params: -
- Query Params: -
- Body Fields: (dynamic) JSON.stringify(updateData)
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:903`

### 202. DELETE ${apiUrl}/profile/picture

- Path Params: -
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: Yes
- Pages/Features: Shared API Utility
- Source Files: `src/lib/api.ts:933`

### 203. GET ${base.replace(/\/$/, '')}/world-ranking${qs.toString() ? ?${qs.toString()} : ''}

- Path Params: replace
- Query Params: -
- Body Fields: -
- Auth Header Explicit in Call: No / wrapper-managed
- Pages/Features: /api/world-ranking
- Source Files: `src/pages/api/world-ranking.ts:26`

## Raw Call Count

- Total call/candidate records scanned: 305
- Total unique method+URL endpoints: 203

## Notes

- `{BASE_URL}` means API base URL from environment or fallback.
- `No / wrapper-managed` means authorization may still be attached by shared HTTP client/wrapper.
- Dynamic URL variables that could not be statically resolved are included as best-effort expressions.
