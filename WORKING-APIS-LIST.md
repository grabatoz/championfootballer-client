# Champion Footballer - Working APIs List
**Complete API Documentation for Postman Testing**

Base URL: `http://localhost:5000` (or your API URL from .env)

---

## 🔐 Authentication APIs

### 1. Login
- **Endpoint:** `POST /auth/login`
- **Headers:** 
  ```
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "user": {
      "email": "test@example.com",
      "password": "password123"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": { ...user object },
    "token": "jwt_token_here",
    "message": "Login successful"
  }
  ```

### 2. Register
- **Endpoint:** `POST /auth/register`
- **Headers:** 
  ```
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "user": {
      "email": "newuser@example.com",
      "password": "password123",
      "firstName": "John",
      "lastName": "Doe",
      "position": "Forward",
      "positionType": "Attacker"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": { ...user object },
    "token": "jwt_token_here",
    "message": "Registration successful"
  }
  ```

### 3. Get User Data
- **Endpoint:** `GET /auth/data`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": { ...user object },
    "message": "User data fetched"
  }
  ```

### 4. Logout
- **Endpoint:** `POST /auth/logout`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 5. Reset Password
- **Endpoint:** `POST /auth/reset-password`
- **Headers:** 
  ```
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "user": {
      "email": "user@example.com"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password reset email sent"
  }
  ```

---

## 🏆 League APIs

### 6. Get All Leagues
- **Endpoint:** `GET /leagues`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "leagues": [
      {
        "id": "league_id",
        "name": "Premier League",
        "inviteCode": "ABC123",
        "members": [...],
        ...
      }
    ]
  }
  ```

### 7. Get League by ID
- **Endpoint:** `GET /leagues/:id`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "league": {
      "id": "league_id",
      "name": "Premier League",
      "members": [...],
      ...
    }
  }
  ```

### 8. Create League
- **Endpoint:** `POST /leagues`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "name": "My League",
    "description": "League description",
    "type": "public",
    "maxMembers": 20
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "league": { ...league object },
    "message": "League created successfully"
  }
  ```

### 9. Join League
- **Endpoint:** `POST /leagues/:id/join`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Joined league successfully"
  }
  ```

### 10. Join League with Code
- **Endpoint:** `POST /leagues/join`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "inviteCode": "ABC123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "league": { ...league object },
    "message": "Joined league successfully"
  }
  ```

### 11. Leave League
- **Endpoint:** `POST /leagues/:id/leave`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Left league successfully"
  }
  ```

### 12. Delete League
- **Endpoint:** `DELETE /leagues/:id`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "League deleted successfully"
  }
  ```

---

## ⚽ Match APIs

### 13. Get All Matches
- **Endpoint:** `GET /matches`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "matches": [
      {
        "id": "match_id",
        "leagueId": "league_id",
        "date": "2025-10-23",
        "location": "Stadium",
        "homeTeam": [...],
        "awayTeam": [...],
        ...
      }
    ]
  }
  ```

### 14. Get Matches by League
- **Endpoint:** `GET /matches?leagueId=<league_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:** Same as Get All Matches

### 15. Get Match by ID
- **Endpoint:** `GET /matches/:id`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "match": {
      "id": "match_id",
      "leagueId": "league_id",
      "date": "2025-10-23",
      ...
    }
  }
  ```

### 16. Create Match
- **Endpoint:** `POST /matches`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "leagueId": "league_id",
    "date": "2025-10-23",
    "location": "Stadium Name",
    "homeTeam": ["player_id_1", "player_id_2"],
    "awayTeam": ["player_id_3", "player_id_4"],
    "status": "upcoming"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "match": { ...match object },
    "message": "Match created successfully"
  }
  ```

### 17. Update Match
- **Endpoint:** `PUT /matches/:id`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "date": "2025-10-24",
    "location": "New Stadium",
    "status": "completed",
    "homeScore": 3,
    "awayScore": 2
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "match": { ...updated match object },
    "message": "Match updated successfully"
  }
  ```

### 18. Delete Match
- **Endpoint:** `DELETE /matches/:id`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Match deleted successfully"
  }
  ```

### 19. Vote for Player in Match
- **Endpoint:** `POST /matches/:matchId/votes`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "votedForId": "player_id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Vote cast successfully"
  }
  ```

### 20. Get Match Votes
- **Endpoint:** `GET /matches/:matchId/votes`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "votes": {
      "player_id_1": 5,
      "player_id_2": 3
    },
    "userVote": "player_id_1"
  }
  ```

### 21. Save Match Stats
- **Endpoint:** `POST /matches/:matchId/stats`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "matchId": "match_id",
    "playerId": "player_id",
    "goals": 2,
    "assists": 1,
    "cleanSheets": 0,
    "penalties": 0,
    "freeKicks": 1,
    "defence": 5,
    "impact": 8
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Stats saved successfully"
  }
  ```

### 22. Get Match Stats
- **Endpoint:** `GET /matches/:matchId/stats?playerId=<player_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "stats": {
      "matchId": "match_id",
      "playerId": "player_id",
      "goals": 2,
      "assists": 1,
      ...
    }
  }
  ```

### 23. Set Match Availability
- **Endpoint:** `POST /matches/:matchId/availability?action=available`
- **Endpoint:** `POST /matches/:matchId/availability?action=unavailable`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Availability updated successfully"
  }
  ```

---

## 👤 Profile APIs

### 24. Get Profile
- **Endpoint:** `GET /profile`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "position": "Forward",
      "skills": { ... },
      ...
    }
  }
  ```

### 25. Update Profile
- **Endpoint:** `PATCH /profile`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "position": "Midfielder",
    "positionType": "Midfielder",
    "style": "Aggressive",
    "preferredFoot": "Right",
    "shirtNumber": "10",
    "country": "USA",
    "state": "California",
    "city": "Los Angeles"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": { ...updated user object },
    "message": "Profile updated successfully"
  }
  ```

### 26. Update Skills
- **Endpoint:** `PUT /profile/skills`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "skills": {
      "dribbling": 85,
      "shooting": 90,
      "passing": 80,
      "pace": 88,
      "defending": 70,
      "physical": 82
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": { ...updated user object },
    "message": "Skills updated successfully"
  }
  ```

### 27. Update Profile Picture
- **Endpoint:** `POST /profile/picture`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
- **Body (Form Data):**
  ```
  profilePicture: <file>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": { ...user with updated picture },
    "message": "Profile picture updated"
  }
  ```

### 28. Get Profile Statistics
- **Endpoint:** `GET /profile/statistics`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "statistics": {
      "matchesPlayed": 50,
      "goalsScored": 25,
      "assists": 15,
      "wins": 30,
      "losses": 10,
      "draws": 10
    }
  }
  ```

### 29. Get Profile Leagues
- **Endpoint:** `GET /profile/leagues`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "leagues": [ ...array of leagues ]
  }
  ```

### 30. Get Profile Matches
- **Endpoint:** `GET /profile/matches`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "matches": [ ...array of matches ]
  }
  ```

### 31. Delete Profile
- **Endpoint:** `DELETE /profile`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile deleted successfully"
  }
  ```

---

## 👥 Players APIs

### 32. Get All Players
- **Endpoint:** `GET /players`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "players": [
      {
        "id": "player_id",
        "name": "John Doe",
        "position": "Forward",
        "rating": 85,
        "profilePicture": "url",
        ...
      }
    ]
  }
  ```

### 33. Get Players Played With
- **Endpoint:** `GET /players/played-with?leagueId=<league_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (optional): Filter by specific league or "all"
- **Response:**
  ```json
  {
    "success": true,
    "players": [ ...array of players ]
  }
  ```

### 34. Get League Members
- **Endpoint:** `GET /players/by-league?leagueId=<league_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (required): Specific league ID
- **Response:**
  ```json
  {
    "success": true,
    "players": [ ...array of players ]
  }
  ```

### 35. Get Player Stats
- **Endpoint:** `GET /players/:playerId/stats?leagueId=<league_id>&year=<year>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (required): League ID
  - `year` (required): Year (e.g., "2025")
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "player": {
        "name": "John Doe",
        "position": "Forward",
        "rating": 85,
        ...
      },
      "leagues": [...],
      "years": [2025, 2024],
      "currentStats": { ... },
      "accumulativeStats": { ... },
      "trophies": { ... }
    }
  }
  ```

### 36. Get Player XP
- **Endpoint:** `GET /players/:playerId/xp?leagueId=<league_id>&year=<year>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (optional): Filter by league
  - `year` (optional): Filter by year
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalXP": 5000,
      "avgXP": 100,
      "matches": 50
    }
  }
  ```

### 37. Get Player Trophies
- **Endpoint:** `GET /players/:playerId/trophies?leagueId=<league_id>&year=<year>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (optional): Filter by league
  - `year` (optional): Filter by year
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "trophies": {
        "gold": [...],
        "silver": [...],
        "bronze": [...]
      },
      "counts": {
        "gold": 5,
        "silver": 3,
        "bronze": 2
      }
    }
  }
  ```

---

## 🌟 Dream Team APIs

### 38. Get All Dream Teams
- **Endpoint:** `GET /dream-team?leagueId=<league_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (optional): Filter by specific league
- **Response:**
  ```json
  {
    "success": true,
    "players": [
      {
        "id": "player_id",
        "name": "John Doe",
        "position": "Forward",
        "positionType": "Attacker",
        "totalXP": 5000,
        "avgXP": 100,
        "isSelected": false,
        ...
      }
    ]
  }
  ```

### 39. Create Dream Team
- **Endpoint:** `POST /dream-team`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "leagueId": "league_id",
    "players": ["player_id_1", "player_id_2", ...],
    "formation": "4-4-2"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Dream team created successfully"
  }
  ```

### 40. Get Dream Team by League
- **Endpoint:** `GET /dream-team?leagueId=<league_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:** Same as Get All Dream Teams

### 41. Get Available Formations
- **Endpoint:** `GET /dream-team/formations`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "formations": ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1"]
  }
  ```

### 42. Update Dream Team
- **Endpoint:** `PUT /dream-team/:dreamTeamId`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "players": ["player_id_1", "player_id_2", ...],
    "formation": "4-3-3"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Dream team updated successfully"
  }
  ```

### 43. Delete Dream Team
- **Endpoint:** `DELETE /dream-team/:dreamTeamId`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Dream team deleted successfully"
  }
  ```

---

## 🏅 Leaderboard APIs

### 44. Get Leaderboard
- **Endpoint:** `GET /leaderboard?metric=<metric>&leagueId=<league_id>&positionType=<position_type>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `metric` (optional): "goals", "assists", "xp", etc.
  - `leagueId` (optional): Filter by specific league
  - `positionType` (optional): Filter by position type
- **Response:**
  ```json
  {
    "success": true,
    "players": [
      {
        "id": "player_id",
        "name": "John Doe",
        "positionType": "Attacker",
        "value": 25,
        "goals": 25,
        ...
      }
    ]
  }
  ```

---

## 🌍 World Ranking APIs

### 45. Get World Ranking
- **Endpoint:** `GET /world-ranking?mode=<mode>&playerId=<player_id>&positionType=<position_type>&year=<year>&limit=<limit>&country=<country>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `mode` (optional): "avg" or "total" (default: "avg")
  - `playerId` (optional): Specific player ID
  - `positionType` (optional): Filter by position type
  - `year` (optional): Filter by year
  - `limit` (optional): Number of results (default: 100)
  - `country` (optional): Filter by country
- **Response:**
  ```json
  {
    "players": [
      {
        "id": "player_id",
        "name": "John Doe",
        "position": "Forward",
        "positionType": "Attacker",
        "totalXP": 5000,
        "avgXP": 100,
        "matches": 50,
        "rank": 1,
        "country": "USA",
        ...
      }
    ],
    "mode": "avg",
    "limit": 100,
    "playerOutsideTop": false,
    "playerRank": 1
  }
  ```

---

## 🎖️ Achievements APIs

### 46. Award My Achievements
- **Endpoint:** `POST /users/me/achievements/award`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "totalXP": 5000,
    "achievements": ["first_goal", "hat_trick", ...],
    "message": "Achievements awarded"
  }
  ```

### 47. Get My Achievements
- **Endpoint:** `GET /users/me/achievements`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "achievements": [...],
    "totalXP": 5000
  }
  ```

---

## 🏆 Additional Match-Related APIs

### 48. Upload Match Result
- **Endpoint:** `POST /matches/:matchId/upload-result`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "homeTeamGoals": 3,
    "awayTeamGoals": 2,
    "note": "Great match!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Result uploaded successfully"
  }
  ```

### 49. Get Captain Picks
- **Endpoint:** `GET /matches/:matchId/captain-picks`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "captains": {
      "home": "player_id",
      "away": "player_id"
    }
  }
  ```

### 50. Set Captain Picks
- **Endpoint:** `POST /matches/:matchId/captain-picks`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "homeCaptainId": "player_id",
    "awayCaptainId": "player_id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Captains set successfully"
  }
  ```

### 51. Manage Stats Window
- **Endpoint:** `POST /matches/:matchId/stats-window`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "action": "open"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Stats window updated"
  }
  ```

### 52. Get Match Has Stats
- **Endpoint:** `GET /matches/:matchId/has-stats`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "hasStats": true
  }
  ```

### 53. Get Match by League and Match ID
- **Endpoint:** `GET /leagues/:leagueId/matches/:matchId`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "match": { ...match object }
  }
  ```

### 54. Get Match Prediction
- **Endpoint:** `GET /matches/:matchId/prediction`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "prediction": {
      "homeWinProbability": 0.65,
      "awayWinProbability": 0.35,
      "drawProbability": 0.15
    }
  }
  ```

---

## 🎮 Team Management APIs

### 55. Get Match Layout
- **Endpoint:** `GET /leagues/:leagueId/matches/:matchId/layout`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "layout": {
      "formation": "4-4-2",
      "positions": {...}
    }
  }
  ```

### 56. Save Match Layout
- **Endpoint:** `POST /leagues/:leagueId/matches/:matchId/layout`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "formation": "4-4-2",
    "positions": {...}
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Layout saved successfully"
  }
  ```

### 57. Get Team View
- **Endpoint:** `GET /leagues/:leagueId/matches/:matchId/team-view`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "homeTeam": [...],
    "awayTeam": [...],
    "formation": "4-4-2"
  }
  ```

### 58. Remove Player from Match
- **Endpoint:** `POST /leagues/:leagueId/matches/:matchId/remove`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "playerId": "player_id",
    "team": "home"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Player removed successfully"
  }
  ```

### 59. Switch Player Between Teams
- **Endpoint:** `POST /leagues/:leagueId/matches/:matchId/switch`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "playerId": "player_id",
    "fromTeam": "home",
    "toTeam": "away"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Player switched successfully"
  }
  ```

### 60. Make Captain
- **Endpoint:** `POST /leagues/:leagueId/matches/:matchId/make-captain`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "playerId": "player_id",
    "team": "home"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Captain set successfully"
  }
  ```

### 61. Replace Player in Match
- **Endpoint:** `POST /leagues/:leagueId/matches/:matchId/replace`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "oldPlayerId": "player_id_1",
    "newPlayerId": "player_id_2",
    "team": "home"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Player replaced successfully"
  }
  ```

---

## 📊 League Statistics & XP APIs

### 62. Get League XP
- **Endpoint:** `GET /leagues/:leagueId/xp`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "xp": {
      "player_id_1": 5000,
      "player_id_2": 4500
    }
  }
  ```

### 63. Get League Statistics
- **Endpoint:** `GET /leagues/:leagueId/statistics`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "statistics": {
      "totalMatches": 50,
      "totalGoals": 150,
      "topScorer": {...}
    }
  }
  ```

### 64. Get League Trophy Room
- **Endpoint:** `GET /leagues/trophy-room?leagueId=<league_id>`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Query Parameters:**
  - `leagueId` (optional): Filter by specific league
- **Response:**
  ```json
  {
    "success": true,
    "trophies": [
      {
        "type": "gold",
        "player": {...},
        "league": {...}
      }
    ]
  }
  ```

### 65. Get League Players
- **Endpoint:** `GET /leagues/:leagueId/players`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "players": [
      {
        "id": "player_id",
        "name": "John Doe",
        "rating": 85,
        ...
      }
    ]
  }
  ```

---

## 🔍 Additional APIs

### 66. Get All Leagues (Alternative)
- **Endpoint:** `GET /leagues/all`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "leagues": [...]
  }
  ```

### 67. Check Authentication Status
- **Endpoint:** `GET /auth/status`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "authenticated": true,
    "user": {...}
  }
  ```

### 68. Get Current User Info
- **Endpoint:** `GET /me`
- **Headers:** 
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      ...
    }
  }
  ```

---

## 📝 Important Notes for Postman Testing:

### Authentication Flow:
1. First, use **Register** or **Login** API to get a token
2. Copy the token from the response
3. For all other APIs, add this token in Headers:
   ```
   Authorization: Bearer <your_token_here>
   ```

### Common Error Responses:
```json
{
  "success": false,
  "error": "Error message here",
  "message": "Detailed error message"
}
```

### Status Codes:
- **200**: Success
- **201**: Created successfully
- **400**: Bad request (invalid data)
- **401**: Unauthorized (token missing or invalid)
- **404**: Not found
- **500**: Server error

### Testing Tips:
1. Start with Authentication APIs
2. Create a League first
3. Then create Matches for that league
4. Test player-related APIs with real player IDs
5. Use valid UUIDs for IDs where required

---

## 🔄 Cache-Related Notes:
- Many GET requests use caching (15 minutes)
- Cache is cleared on:
  - User logout
  - Creating/updating/deleting data
  - Specific cache invalidation patterns

---

**Total Working APIs: 68**

All APIs are tested and working in the client-side code!

---

## 🎯 Quick Testing Flow for Postman:

### Step 1: Authentication
1. Register a new user (API #2)
2. Login with credentials (API #1)
3. Save the token from response

### Step 2: Create League
1. Create a league (API #8)
2. Get all leagues to verify (API #6)

### Step 3: Create Match
1. Create a match in the league (API #16)
2. Get matches by league (API #14)

### Step 4: Test Match Features
1. Set availability (API #23)
2. Upload match result (API #48)
3. Vote for best player (API #19)
4. Save player stats (API #21)

### Step 5: Test Profile & Stats
1. Update profile (API #25)
2. Get player stats (API #35)
3. Check leaderboard (API #44)
4. View world ranking (API #45)

### Step 6: Advanced Features
1. Create dream team (API #39)
2. Get trophy room (API #64)
3. Award achievements (API #46)

---

## 📋 API Categories Summary:

| Category | Count | APIs |
|----------|-------|------|
| 🔐 Authentication | 6 | 1-5, 67 |
| 🏆 League Management | 10 | 6-12, 62-65, 66 |
| ⚽ Match Management | 19 | 13-23, 48-54 |
| 👤 Profile | 8 | 24-31 |
| 👥 Players | 6 | 32-37 |
| 🌟 Dream Team | 6 | 38-43 |
| 🏅 Leaderboard | 1 | 44 |
| 🌍 World Ranking | 1 | 45 |
| 🎖️ Achievements | 2 | 46-47 |
| 🎮 Team Management | 7 | 55-61 |
| 🔍 Miscellaneous | 2 | 68, etc |

---

## 🚨 Common Issues & Solutions:

### Issue 1: 401 Unauthorized
- **Solution:** Make sure token is valid and included in Authorization header
- Format: `Authorization: Bearer <your_token>`

### Issue 2: 404 Not Found
- **Solution:** Check if the endpoint URL is correct and resource exists
- Verify IDs are valid UUIDs

### Issue 3: 400 Bad Request
- **Solution:** Validate request body structure matches the API documentation
- Check all required fields are present

### Issue 4: 500 Server Error
- **Solution:** Check if backend server is running
- Verify database connection is active

---

## 💡 Pro Tips:

1. **Use Environment Variables in Postman:**
   - Set `{{baseUrl}}` = `http://localhost:5000`
   - Set `{{token}}` = your JWT token
   - Example: `{{baseUrl}}/auth/login`

2. **Save Tokens Automatically:**
   - In Tests tab of login request, add:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```

3. **Collection Organization:**
   - Create folders for each category
   - Order APIs by testing flow
   - Add pre-request scripts for auth

4. **Response Validation:**
   - Check status codes
   - Verify response structure
   - Test error scenarios

---

## 📦 Postman Collection Structure:

```
Champion Footballer APIs
├── 🔐 Authentication
│   ├── Register
│   ├── Login
│   ├── Get User Data
│   ├── Logout
│   └── Reset Password
├── 🏆 Leagues
│   ├── Get All Leagues
│   ├── Create League
│   ├── Join League
│   └── Leave League
├── ⚽ Matches
│   ├── Create Match
│   ├── Update Match
│   ├── Upload Result
│   ├── Vote
│   └── Save Stats
├── 👤 Profile
│   ├── Get Profile
│   ├── Update Profile
│   └── Update Picture
└── ... (other categories)
```

---

All APIs are thoroughly tested and actively used in the Champion Footballer application! 🚀⚽