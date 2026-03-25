/**
 * 🔄 Centralized Cache Manager
 * Automatically invalidates cache on POST/PUT/PATCH/DELETE operations
 * WITH BACKGROUND UPLOAD SUPPORT
 */

import { apiCache } from './apiCache';
import { invalidateCache } from './optimizedFetch';

const STORAGE_PREFIX = 'cf_cache_';

type ResourceType = 'league' | 'match' | 'team' | 'user' | 'stats';

function parseMutationResource(url: string): { resourceType?: ResourceType; resourceId?: string } {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const trimmed = url.replace(API_BASE_URL, '');
    const pathOnly = trimmed.split('?')[0] || '';

    const resourceMatch = pathOnly.match(/\/(leagues?|matches?|teams?|users?|stats)(?:\/([^/]+))?/i);
    if (!resourceMatch) return {};

    const rawResource = resourceMatch[1].toLowerCase().replace(/s$/, '');
    const resourceType = rawResource as ResourceType;
    const resourceId = resourceMatch[2];
    return { resourceType, resourceId };
}

// Background upload tracking
const uploadLog: Array<{ url: string; method: string; timestamp: number; status: 'pending' | 'success' | 'failed' }> = [];

/**
 * Log upload activity
 */
function logUpload(url: string, method: string, status: 'pending' | 'success' | 'failed') {
    uploadLog.push({ url, method, timestamp: Date.now(), status });
    
    // Keep only last 50 entries
    if (uploadLog.length > 50) {
        uploadLog.shift();
    }
    
    console.log(`📊 [Upload Log] ${method} ${url} - ${status.toUpperCase()}`);
}

/**
 * Get upload activity log
 */
export function getUploadLog() {
    return [...uploadLog];
}

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
        const id = String(resourceId);
        const endpoints = [
            `${process.env.NEXT_PUBLIC_API_URL}/${resourceType}s/${id}`,
            `${process.env.NEXT_PUBLIC_API_URL}/${resourceType}/${id}`,
        ];
        endpoints.forEach(endpoint => {
            invalidateCache(endpoint);
            console.log(`  ✅ Invalidated endpoint: ${endpoint}`);
        });
    }
}

/**
 * Enhanced fetch wrapper that auto-clears cache on mutations (POST/PUT/PATCH/DELETE)
 * AND logs upload activity
 */
export async function fetchWithCacheInvalidation(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = options.method?.toUpperCase() || 'GET';
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    console.log(`🌐 [CacheManager] ${method} ${url}`);
    
    // Log upload start
    if (isMutation) {
        logUpload(url, method, 'pending');
    }
    
    // Perform the fetch
    let response: Response;
    try {
        response = await fetch(url, options);
        
        // Log upload result
        if (isMutation) {
            logUpload(url, method, response.ok ? 'success' : 'failed');
        }
    } catch (error) {
        if (isMutation) {
            logUpload(url, method, 'failed');
        }
        throw error;
    }
    
    // If mutation was successful, clear related cache
    if (isMutation && response.ok) {
        console.log(`✅ [CacheManager] ${method} successful, clearing cache...`);
        
        // Extract resource type from URL
        const { resourceType, resourceId } = parseMutationResource(url);
        
        if (resourceType) {
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
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cache-cleared', {
                detail: { method, url, timestamp: Date.now() }
            }));
            window.dispatchEvent(new CustomEvent('data-mutated', {
                detail: {
                    method,
                    url,
                    resourceType: resourceType || null,
                    resourceId: resourceId || null,
                    timestamp: Date.now()
                }
            }));
        }
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
 * Complete mutation workflow: fetch + clear cache + dispatch event + log upload
 */
export async function mutateWithRefresh(
    url: string,
    options: RequestInit = {},
    resourceType?: 'league' | 'match' | 'team',
    resourceId?: string | number
): Promise<Response> {
    // Perform mutation with auto cache clearing and upload logging
    const response = await fetchWithCacheInvalidation(url, options);
    
    // If successful and resource type provided, dispatch specific event
    if (response.ok && resourceType) {
        dispatchRefreshEvent(resourceType, resourceId);
    }
    
    return response;
}

/**
 * Get cache and upload statistics
 */
export function getCacheAndUploadStats() {
    const recentUploads = uploadLog.slice(-10);
    const stats = {
        uploadLog: recentUploads,
        totalUploads: uploadLog.length,
        successfulUploads: uploadLog.filter(u => u.status === 'success').length,
        failedUploads: uploadLog.filter(u => u.status === 'failed').length,
        pendingUploads: uploadLog.filter(u => u.status === 'pending').length,
    };
    
    console.table(recentUploads);
    return stats;
}

export default {
    clearAllCache,
    clearCacheByResource,
    fetchWithCacheInvalidation,
    dispatchRefreshEvent,
    mutateWithRefresh,
    getUploadLog,
    getCacheAndUploadStats,
};
