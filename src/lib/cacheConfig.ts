// ULTRA FAST CACHE CONFIGURATION
// Centralized cache management and configuration

export interface CacheConfig {
  key: string;
  ttl: number; // minutes
  autoRefresh: boolean;
  persistent: boolean; // Save to localStorage
}

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Auth & User
  user_data: { key: 'user_data', ttl: 30, autoRefresh: true, persistent: true },
  user_profile: { key: 'user_profile', ttl: 15, autoRefresh: true, persistent: true },
  
  // Leagues
  leagues_all: { key: 'leagues_all', ttl: 20, autoRefresh: true, persistent: true },
  league_details: { key: 'league_', ttl: 10, autoRefresh: true, persistent: true },
  
  // Matches
  matches_all: { key: 'matches_all', ttl: 10, autoRefresh: true, persistent: true },
  match_details: { key: 'match_', ttl: 5, autoRefresh: true, persistent: false },
  match_votes: { key: 'match_votes_', ttl: 2, autoRefresh: true, persistent: false },
  
  // Players
  players_all: { key: 'players_all', ttl: 20, autoRefresh: true, persistent: true },
  player_stats: { key: 'player_stats_', ttl: 15, autoRefresh: true, persistent: true },
  
  // Dream Team
  dream_team: { key: 'dream_team', ttl: 15, autoRefresh: true, persistent: true },
  
  // Leaderboard
  leaderboard: { key: 'leaderboard', ttl: 10, autoRefresh: true, persistent: true },
  
  // World Ranking
  world_ranking: { key: 'world_ranking', ttl: 30, autoRefresh: true, persistent: true },
};

export class CacheManager {
  private static instance: CacheManager;
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  // Get cache TTL for a specific key
  getTTL(key: string): number {
    for (const config of Object.values(CACHE_CONFIGS)) {
      if (key.startsWith(config.key)) {
        return config.ttl;
      }
    }
    return 15; // Default 15 minutes
  }
  
  // Check if cache should auto-refresh
  shouldAutoRefresh(key: string): boolean {
    for (const config of Object.values(CACHE_CONFIGS)) {
      if (key.startsWith(config.key)) {
        return config.autoRefresh;
      }
    }
    return false;
  }
  
  // Check if cache should be persisted
  shouldPersist(key: string): boolean {
    for (const config of Object.values(CACHE_CONFIGS)) {
      if (key.startsWith(config.key)) {
        return config.persistent;
      }
    }
    return false;
  }
  
  // Invalidate related caches
  invalidateRelated(pattern: string) {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    let count = 0;
    
    keys.forEach(key => {
      if (key.includes(pattern) && key.startsWith('cf_cache_')) {
        localStorage.removeItem(key);
        count++;
      }
    });
    
    console.log(`🗑️ Invalidated ${count} caches matching: ${pattern}`);
  }
  
  // Clear expired caches
  clearExpired() {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    let count = 0;
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith('cf_cache_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.expires && now > parsed.expires) {
              localStorage.removeItem(key);
              count++;
            }
          }
        } catch (e) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
          count++;
        }
      }
    });
    
    if (count > 0) {
      console.log(`🧹 Cleared ${count} expired cache entries`);
    }
  }
  
  // Get cache statistics
  getStats() {
    if (typeof window === 'undefined') return null;
    
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(k => k.startsWith('cf_cache_'));
    const now = Date.now();
    
    const stats = {
      totalCaches: cacheKeys.length,
      expired: 0,
      active: 0,
      totalSize: 0,
      byType: {} as Record<string, number>
    };
    
    cacheKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          stats.totalSize += item.length;
          const parsed = JSON.parse(item);
          
          if (parsed.expires && now > parsed.expires) {
            stats.expired++;
          } else {
            stats.active++;
          }
          
          // Group by type
          const type = key.replace('cf_cache_', '').split('_')[0];
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        }
      } catch (e) {
        // Ignore invalid entries
      }
    });
    
    console.log(`📊 Cache Stats:`, stats);
    return stats;
  }
}

export const cacheManager = CacheManager.getInstance();

// Auto-clear expired caches every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.clearExpired();
  }, 5 * 60 * 1000);
}
