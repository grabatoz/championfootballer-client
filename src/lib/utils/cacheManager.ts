/**
 * 🔄 Centralized Cache Manager
 * Automatically invalidates cache on POST/PUT/PATCH/DELETE operations
 */

import { apiCache } from './apiCache';
import { invalidateCache } from './optimizedFetch';

const STORAGE_PREFIX = 'cf_cache_';

/**
 * Clear all cache layers (localStorage + in-memory + specific endpoints)
 */
export function clearAllCache(patterns?: string[]) {
    console.log('🗑️ [CacheManager] Clearing all cache layers...');
    
    // 1. Clear localStorage cache
    let clearedCount = 0;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
            // If patterns provided, check if key matches any pattern
            if (patterns && patterns.length > 0) {
                const shouldClear = patterns.some(pattern => 
                    key.toLowerCase().includes(pattern.toLowerCase())
                );
                if (shouldClear) {
                    localStorage.removeItem(key);
                    clearedCount++;
                }
            } else {
                // Clear all if no patterns specified
                localStorage.removeItem(key);
                clearedCount++;
            }
        }
    });
    console.log(`  ✅ Cleared ${clearedCount} localStorage entries`);
    
    // 2. Clear in-memory apiCache
    if (patterns && patterns.length > 0) {
        patterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'i');
            apiCache.invalidatePattern(regex);
        });
    } else {
        apiCache.invalidatePattern(/.*/); // Clear all
    }
    console.log('  ✅ Cleared in-memory apiCache');
}

/**
 * Clear cache for specific resource types
 */
export function clearCacheByResource(resourceType: 'league' | 'match' | 'team' | 'user' | 'stats', resourceId?: string | number) {
    console.log(`🗑️ [CacheManager] Clearing cache for: ${resourceType}${resourceId ? ` (${resourceId})` : ''}`);
    
    const patterns: string[] = [resourceType];
    if (resourceId) {
        patterns.push(`${resourceType}/${resourceId}`);
        patterns.push(`${resourceType}s/${resourceId}`); // plural form
    }
    
    clearAllCache(patterns);
    
    // Invalidate specific endpoints
    if (resourceId) {
        const endpoints = [
            `${process.env.NEXT_PUBLIC_API_URL}/${resourceType}s/${resourceId}`,
            `${process.env.NEXT_PUBLIC_API_URL}/${resourceType}/${resourceId}`,
        ];
        endpoints.forEach(endpoint => {
            invalidateCache(endpoint);
            console.log(`  ✅ Invalidated endpoint: ${endpoint}`);
        });
    }
}

/**
 * Enhanced fetch wrapper that auto-clears cache on mutations (POST/PUT/PATCH/DELETE)
 */
export async function fetchWithCacheInvalidation(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = options.method?.toUpperCase() || 'GET';
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    console.log(`🌐 [CacheManager] ${method} ${url}`);
    
    // Perform the fetch
    const response = await fetch(url, options);
    
    // If mutation was successful, clear related cache
    if (isMutation && response.ok) {
        console.log(`✅ [CacheManager] ${method} successful, clearing cache...`);
        
        // Extract resource type from URL
        const urlPath = url.replace(process.env.NEXT_PUBLIC_API_URL || '', '');
        const resourceMatch = urlPath.match(/\/(leagues?|matches?|teams?|users?|stats)/i);
        
        if (resourceMatch) {
            const resource = resourceMatch[1].toLowerCase();
            // Extract ID if present
            const idMatch = urlPath.match(/\/(\d+)/);
            const resourceId = idMatch ? idMatch[1] : undefined;
            
            // Map plural to singular
            const resourceType = resource.replace(/s$/, '') as 'league' | 'match' | 'team' | 'user' | 'stats';
            
            clearCacheByResource(resourceType, resourceId);
            
            // For match operations, also clear parent league cache
            if (resourceType === 'match') {
                clearCacheByResource('league');
            }
        } else {
            // If can't determine resource, clear common patterns
            clearAllCache(['league', 'match', 'team']);
        }
        
        // Dispatch global cache-cleared event
        window.dispatchEvent(new CustomEvent('cache-cleared', {
            detail: { method, url, timestamp: Date.now() }
        }));
    }
    
    return response;
}

/**
 * Dispatch refresh event for specific resource
 */
export function dispatchRefreshEvent(resourceType: 'league' | 'match' | 'team', resourceId?: string | number) {
    const eventName = `${resourceType}-updated`;
    console.log(`📢 [CacheManager] Dispatching ${eventName} event`, resourceId ? `for ${resourceId}` : '');
    
    window.dispatchEvent(new CustomEvent(eventName, {
        detail: { 
            [`${resourceType}Id`]: resourceId,
            timestamp: Date.now()
        }
    }));
}

/**
 * Complete mutation workflow: fetch + clear cache + dispatch event
 */
export async function mutateWithRefresh(
    url: string,
    options: RequestInit = {},
    resourceType?: 'league' | 'match' | 'team',
    resourceId?: string | number
): Promise<Response> {
    // Perform mutation with auto cache clearing
    const response = await fetchWithCacheInvalidation(url, options);
    
    // If successful and resource type provided, dispatch specific event
    if (response.ok && resourceType) {
        dispatchRefreshEvent(resourceType, resourceId);
    }
    
    return response;
}

export default {
    clearAllCache,
    clearCacheByResource,
    fetchWithCacheInvalidation,
    dispatchRefreshEvent,
    mutateWithRefresh
};
