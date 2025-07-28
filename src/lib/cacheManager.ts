import { getCache, setCache } from './api';
import type {
  LeaguesResponse,
  LeaderboardResponse,
  PlayersResponse,
  MatchesResponse,
  DreamTeamResponse,
  PlayerStatsResponse,
  MatchUser
} from '@/types/api';
import type { League, User, Match } from '@/types/user';

// Helper to ensure profilePicture is string | undefined
function normalizeProfilePicture(pic: string | null | undefined): string | undefined {
  return pic === null ? undefined : pic;
}

// Helper to create a default LeaderboardPlayer
function createLeaderboardPlayer(
  playerId: string,
  value: number,
  metric: keyof LeaderboardResponse['players'][number]
): LeaderboardResponse['players'][number] {
  return {
    id: playerId,
    name: '',
    positionType: '',
    profilePicture: undefined,
    value,
    [metric]: value
  } as LeaderboardResponse['players'][number];
}

// Helper to convert User to PlayerListItem
function toPlayerListItem(user: User): PlayersResponse['players'][number] {
  const rating = 'rating' in user && typeof (user as { rating?: number }).rating === 'number'
    ? (user as { rating: number }).rating
    : 0;
  return {
    ...user,
    name: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : '',
    profilePicture: normalizeProfilePicture(user.profilePicture),
    rating,
  };
}

// Helper to convert User to MatchUser
function toMatchUser(user: User): MatchUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    // position: user.position,
    // positionType: user.positionType,
    // style: user.style,
    // preferredFoot: user.preferredFoot,
    // shirtNumber: user.shirtNumber,
    profilePicture: normalizeProfilePicture(user.profilePicture),
    // xp: user.xp,
    // createdAt: user.createdAt,
    // updatedAt: user.updatedAt,
  };
}

// Helper to convert User[] to MatchUser[]
function toMatchUserArray(users: User[] | undefined): MatchUser[] {
  if (!users) return [];
  return users.map(u => toMatchUser(u));
}

export class CacheManager {
  private static instance: CacheManager;
  private constructor() {}
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Leagues Cache Management
  public updateLeaguesCache(newLeague: League): void {
    const key = 'leagues_cache';
    const existing = getCache<LeaguesResponse>(key);
    if (existing && existing.leagues) {
      const updatedLeagues = [newLeague, ...existing.leagues];
      setCache(key, { ...existing, leagues: updatedLeagues });
    } else {
      setCache(key, { success: true, leagues: [newLeague] });
    }
  }

  public updateLeaguesCacheOnJoin(joinedLeague: League): void {
    const key = 'leagues_cache';
    const existing = getCache<LeaguesResponse>(key);
    if (existing && existing.leagues) {
      const leagueExists = existing.leagues.some((league) => league.id === joinedLeague.id);
      if (!leagueExists) {
        const updatedLeagues = [...existing.leagues, joinedLeague];
        setCache(key, { ...existing, leagues: updatedLeagues });
      }
    }
  }

  // Leaderboard Cache Management
  public updateLeaderboardCache(
    playerId: string,
    value: number,
    metric: keyof LeaderboardResponse['players'][number],
    cacheKey: string = 'leaderboard_cache'
  ): void {
    const existing = getCache<LeaderboardResponse>(cacheKey);
    if (existing && existing.players) {
      const playerIndex = existing.players.findIndex((player) => player.id === playerId);
      if (playerIndex !== -1) {
        const updatedPlayers = [...existing.players];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          [metric]: value
        };
        setCache(cacheKey, { ...existing, players: updatedPlayers });
      } else {
        const newPlayer = createLeaderboardPlayer(playerId, value, metric);
        setCache(cacheKey, { ...existing, players: [...existing.players, newPlayer] });
      }
    }
  }

  // Players Cache Management
  public updatePlayersCache(newPlayer: User): void {
    const key = 'players_cache';
    const existing = getCache<PlayersResponse>(key);
    if (existing && existing.players) {
      const playerIndex = existing.players.findIndex((player) => player.id === newPlayer.id);
      const normalizedPlayer = toPlayerListItem(newPlayer);
      if (playerIndex !== -1) {
        const updatedPlayers = [...existing.players];
        updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ...normalizedPlayer };
        setCache(key, { ...existing, players: updatedPlayers });
      } else {
        setCache(key, { ...existing, players: [...existing.players, normalizedPlayer] });
      }
    }
  }

  // Player Stats Cache Management
  public updatePlayerStatsCache(playerId: string, newStats: PlayerStatsResponse): void {
    const key = `playerstats_cache_${playerId}`;
    const existing = getCache<PlayerStatsResponse>(key);
    if (existing) {
      setCache(key, { ...existing, ...newStats });
    }
  }

  // Matches Cache Management
  public updateMatchesCache(newMatch: Match): void {
    const key = 'matches_cache';
    const existing = getCache<MatchesResponse>(key);
    if (existing && existing.matches) {
      const matchIndex = existing.matches.findIndex((match) => match.id === newMatch.id);
      // Convert homeTeamUsers and awayTeamUsers
      const normalizedMatch = {
        ...newMatch,
        homeTeamUsers: toMatchUserArray((newMatch as Match & { homeTeamUsers?: User[] }).homeTeamUsers),
        awayTeamUsers: toMatchUserArray((newMatch as Match & { awayTeamUsers?: User[] }).awayTeamUsers),
        profilePicture: normalizeProfilePicture((newMatch as Match & { profilePicture?: string | null }).profilePicture),
      };
      if (matchIndex !== -1) {
        const updatedMatches = [...existing.matches];
        updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], ...normalizedMatch };
        setCache(key, { ...existing, matches: updatedMatches });
      } else {
        setCache(key, { ...existing, matches: [...existing.matches, normalizedMatch] });
      }
    }
  }

  // Dream Team Cache Management
  public updateDreamTeamCache(newDreamTeam: DreamTeamResponse): void {
    const key = 'dreamteam_cache';
    const existing = getCache<DreamTeamResponse>(key);
    if (existing) {
      setCache(key, { ...existing, ...newDreamTeam });
    }
  }

  // Generic Cache Update
  public updateAnyCache<T>(cacheKey: string, newData: T, mergeFunction?: (existing: T, newData: T) => T): void {
    const existing = getCache<T>(cacheKey);
    if (existing) {
      const updatedData = mergeFunction ? mergeFunction(existing, newData) : newData;
      setCache(cacheKey, updatedData);
    } else {
      setCache(cacheKey, newData);
    }
  }

  // Clear specific cache
  public clearCache(cacheKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey);
      document.cookie = `${cacheKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }

  // Clear all caches
  public clearAllCaches(): void {
    if (typeof window !== 'undefined') {
      const cacheKeys = [
        'leagues_cache',
        'leaderboard_cache', 
        'players_cache',
        'matches_cache',
        'dreamteam_cache'
      ];
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      // Clear player stats caches (they have dynamic keys)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('playerstats_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Get cache status
  public getCacheStatus(): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    const cacheKeys = [
      'leagues_cache',
      'leaderboard_cache', 
      'players_cache',
      'matches_cache',
      'dreamteam_cache'
    ];
    const status: Record<string, boolean> = {};
    cacheKeys.forEach(key => {
      status[key] = !!localStorage.getItem(key);
    });
    return status;
  }
}

export const cacheManager = CacheManager.getInstance();
export const {
  updateLeaguesCache,
  updateLeaguesCacheOnJoin,
  updateLeaderboardCache,
  updatePlayersCache,
  updatePlayerStatsCache,
  updateMatchesCache,
  updateDreamTeamCache,
  updateAnyCache,
  clearCache,
  clearAllCaches,
  getCacheStatus
} = cacheManager; 