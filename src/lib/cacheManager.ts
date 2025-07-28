import { getCache, setCache } from './api';
import type {
  LeaguesResponse,
  LeaderboardResponse,
  PlayersResponse,
  MatchesResponse,
  DreamTeamResponse,
  PlayerStatsResponse
} from '@/types/api';

// Cache Manager for all backend routes
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
  public updateLeaguesCache(newLeague: any): void {
    const key = 'leagues_cache';
    const existing = getCache<LeaguesResponse>(key);
    
    if (existing && existing.leagues) {
      // Add the new league to the beginning of the leagues array
      const updatedLeagues = [newLeague, ...existing.leagues];
      const updatedData: LeaguesResponse = {
        ...existing,
        leagues: updatedLeagues
      };
      setCache(key, updatedData);
      console.log('✅ Updated leagues cache with new league:', newLeague.name);
    } else {
      console.log('📝 No existing leagues cache found, creating new one');
      const newData: LeaguesResponse = {
        success: true,
        leagues: [newLeague]
      };
      setCache(key, newData);
    }
  }

  public updateLeaguesCacheOnJoin(joinedLeague: any): void {
    const key = 'leagues_cache';
    const existing = getCache<LeaguesResponse>(key);
    
    if (existing && existing.leagues) {
      // Check if league already exists in cache
      const leagueExists = existing.leagues.some((league: any) => league.id === joinedLeague.id);
      if (!leagueExists) {
        // Add the joined league to the leagues array
        const updatedLeagues = [...existing.leagues, joinedLeague];
        const updatedData: LeaguesResponse = {
          ...existing,
          leagues: updatedLeagues
        };
        setCache(key, updatedData);
        console.log('✅ Updated leagues cache with joined league:', joinedLeague.name);
      }
    }
  }

  // Leaderboard Cache Management
  public updateLeaderboardCache(newStats: any, metric: string = 'goals'): void {
    const key = 'leaderboard_cache';
    const existing = getCache<LeaderboardResponse>(key);
    
    if (existing && existing.players) {
      // Find and update existing player or add new player
      const playerIndex = existing.players.findIndex((player: any) => player.id === newStats.playerId);
      if (playerIndex !== -1) {
        // Update existing player stats
        const updatedPlayers = [...existing.players];
        updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ...newStats };
        const updatedData: LeaderboardResponse = {
          ...existing,
          players: updatedPlayers
        };
        setCache(key, updatedData);
        console.log('✅ Updated leaderboard cache for player:', newStats.playerId);
      } else {
        // Add new player to leaderboard
        const updatedPlayers = [...existing.players, newStats];
        const updatedData: LeaderboardResponse = {
          ...existing,
          players: updatedPlayers
        };
        setCache(key, updatedData);
        console.log('✅ Added new player to leaderboard cache:', newStats.playerId);
      }
    }
  }

  // Players Cache Management
  public updatePlayersCache(newPlayer: any): void {
    const key = 'players_cache';
    const existing = getCache<PlayersResponse>(key);
    
    if (existing && existing.players) {
      // Find and update existing player or add new player
      const playerIndex = existing.players.findIndex((player: any) => player.id === newPlayer.id);
      if (playerIndex !== -1) {
        // Update existing player
        const updatedPlayers = [...existing.players];
        updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ...newPlayer };
        const updatedData: PlayersResponse = {
          ...existing,
          players: updatedPlayers
        };
        setCache(key, updatedData);
        console.log('✅ Updated players cache for player:', newPlayer.id);
      } else {
        // Add new player
        const updatedPlayers = [...existing.players, newPlayer];
        const updatedData: PlayersResponse = {
          ...existing,
          players: updatedPlayers
        };
        setCache(key, updatedData);
        console.log('✅ Added new player to players cache:', newPlayer.id);
      }
    }
  }

  // Player Stats Cache Management
  public updatePlayerStatsCache(playerId: string, newStats: any): void {
    const key = `playerstats_cache_${playerId}`;
    const existing = getCache<PlayerStatsResponse>(key);
    
    if (existing) {
      // Merge new stats with existing stats
      const updatedData: PlayerStatsResponse = {
        ...existing,
        ...newStats
      };
      setCache(key, updatedData);
      console.log('✅ Updated player stats cache for player:', playerId);
    }
  }

  // Matches Cache Management
  public updateMatchesCache(newMatch: any): void {
    const key = 'matches_cache';
    const existing = getCache<MatchesResponse>(key);
    
    if (existing && existing.matches) {
      // Find and update existing match or add new match
      const matchIndex = existing.matches.findIndex((match: any) => match.id === newMatch.id);
      if (matchIndex !== -1) {
        // Update existing match
        const updatedMatches = [...existing.matches];
        updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], ...newMatch };
        const updatedData: MatchesResponse = {
          ...existing,
          matches: updatedMatches
        };
        setCache(key, updatedData);
        console.log('✅ Updated matches cache for match:', newMatch.id);
      } else {
        // Add new match
        const updatedMatches = [...existing.matches, newMatch];
        const updatedData: MatchesResponse = {
          ...existing,
          matches: updatedMatches
        };
        setCache(key, updatedData);
        console.log('✅ Added new match to matches cache:', newMatch.id);
      }
    }
  }

  // Dream Team Cache Management
  public updateDreamTeamCache(newDreamTeam: any): void {
    const key = 'dreamteam_cache';
    const existing = getCache<DreamTeamResponse>(key);
    
    if (existing) {
      // Update dream team data
      const updatedData: DreamTeamResponse = {
        ...existing,
        ...newDreamTeam
      };
      setCache(key, updatedData);
      console.log('✅ Updated dream team cache');
    }
  }

  // Generic Cache Update
  public updateAnyCache<T>(cacheKey: string, newData: T, mergeFunction?: (existing: T, newData: T) => T): void {
    const existing = getCache<T>(cacheKey);
    if (existing) {
      const updatedData = mergeFunction ? mergeFunction(existing, newData) : newData;
      setCache(cacheKey, updatedData);
      console.log(`✅ Updated cache for key: ${cacheKey}`);
    } else {
      setCache(cacheKey, newData);
      console.log(`📝 Created new cache for key: ${cacheKey}`);
    }
  }

  // Clear specific cache
  public clearCache(cacheKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey);
      document.cookie = `${cacheKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log(`🗑️ Cleared cache for key: ${cacheKey}`);
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
      
      console.log('🗑️ Cleared all caches');
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

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Export convenience functions
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