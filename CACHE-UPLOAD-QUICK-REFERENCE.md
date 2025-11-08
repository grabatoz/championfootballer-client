# 🚀 Cache + Upload - Quick Reference

## 📦 Import Statements

```typescript
// Main cache manager
import { cacheManager } from '@/lib/cacheManager';

// Chunk cache
import { 
    chunkCache, 
    addCachedItem, 
    updateCachedItem,
    removeCachedItem,
    forceUploadSync,
    getUploadStatus 
} from '@/lib/chunkCache';

// API cache
import { 
    apiCache, 
    forceSyncUploads, 
    getUploadQueueStatus 
} from '@/lib/utils/apiCache';

// Utils
import { 
    getUploadLog, 
    getCacheAndUploadStats 
} from '@/lib/utils/cacheManager';
```

---

## ⚡ Quick Commands

### Cache + Upload (Default)

```typescript
// League
cacheManager.updateLeaguesCache(league);          // ✅ Upload
cacheManager.updateLeaguesCacheOnJoin(league);   // ✅ Upload

// Player
cacheManager.updatePlayersCache(player);          // ✅ Upload

// Match
cacheManager.updateMatchesCache(match);           // ✅ Upload

// Chunk cache
addCachedItem('leagues', league);                 // ✅ Upload
updateCachedItem('leagues', league);              // ✅ Upload
removeCachedItem('leagues', leagueId);            // ✅ Upload
```

### Cache Only (No Upload)

```typescript
// Pass false as second parameter
cacheManager.updateLeaguesCache(league, false);   // ❌ No upload
cacheManager.updatePlayersCache(player, false);   // ❌ No upload
cacheManager.updateMatchesCache(match, false);    // ❌ No upload

addCachedItem('leagues', league, false);          // ❌ No upload
updateCachedItem('leagues', league, false);       // ❌ No upload
removeCachedItem('leagues', leagueId, false);     // ❌ No upload
```

---

## 📊 Monitoring

### Check Upload Status

```typescript
// Main cache manager
const status1 = cacheManager.getUploadStatus();
console.log('Pending:', status1.pending);
console.log('Processing:', status1.processing);

// Chunk cache
const status2 = getUploadStatus();
console.log('Pending:', status2.pending);
console.log('Is uploading:', status2.isUploading);

// API cache
const status3 = getUploadQueueStatus();
console.log('Queue size:', status3.pending);
```

### View Upload Log

```typescript
// Get recent uploads
const log = getUploadLog();
console.table(log);

// Get statistics
const stats = getCacheAndUploadStats();
console.log(stats);
// Output:
{
  uploadLog: [...],
  totalUploads: 15,
  successfulUploads: 12,
  failedUploads: 2,
  pendingUploads: 1
}
```

### Cache Statistics

```typescript
// Chunk cache stats (includes upload status)
const stats = chunkCache.getStats();
console.log(stats);
// Output:
{
  totalChunks: 5,
  uploadStatus: { pending: 3, isUploading: false },
  resources: { ... }
}
```

---

## 🔄 Force Sync

### Sync All Pending Uploads

```typescript
// Main cache manager
await cacheManager.forceUpload();

// Chunk cache
await forceUploadSync();

// API cache
await forceSyncUploads();

// Utils
await apiCache.syncNow();
```

---

## 🎯 Common Patterns

### Pattern 1: Create with Auto-Upload

```typescript
async function createLeague(data) {
    const response = await leagueAPI.create(data);
    cacheManager.updateLeaguesCache(response.data); // Auto upload
    return response;
}
```

### Pattern 2: Bulk Update (Optimized)

```typescript
async function bulkUpdateLeagues(leagues) {
    // Cache without upload
    leagues.forEach(league => {
        cacheManager.updateLeaguesCache(league, false);
    });
    
    // Force sync once
    await cacheManager.forceUpload();
}
```

### Pattern 3: Conditional Upload

```typescript
function updateCache(data, isOnline) {
    // Upload only if online
    cacheManager.updateLeaguesCache(data, isOnline);
}
```

### Pattern 4: Upload on Page Leave

```typescript
useEffect(() => {
    return () => {
        // Cleanup - sync before unmount
        forceUploadSync();
    };
}, []);
```

### Pattern 5: Network-Aware Caching

```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
    window.addEventListener('online', () => {
        setIsOnline(true);
        forceUploadSync(); // Sync when back online
    });
    
    window.addEventListener('offline', () => {
        setIsOnline(false);
    });
}, []);

// Usage
function addLeague(league) {
    cacheManager.updateLeaguesCache(league, isOnline);
}
```

---

## 🐛 Debug Commands

```typescript
// Check what's happening
console.log('Upload Status:', getUploadStatus());
console.log('Upload Log:', getUploadLog());
console.log('Cache Stats:', chunkCache.getStats());
console.log('Full Stats:', getCacheAndUploadStats());

// Force sync and monitor
await forceUploadSync().then(() => {
    console.log('Sync complete!');
    console.log('Status:', getUploadStatus());
});
```

---

## ⏱️ Upload Timing

| Operation | Upload Delay | Priority |
|-----------|-------------|----------|
| Create    | 100ms       | High     |
| Delete    | 100ms       | High     |
| Update    | 5-10s       | Normal   |
| Bulk ops  | On sync     | Low      |

---

## 🎨 Console Logs Guide

```
📤 [BgUpload] Queued: POST /leagues        → Upload queued
✅ [BgUpload] Success: /leagues            → Upload successful
⚠️ [BgUpload] Retry 1/3: /matches         → Retrying failed upload
❌ [BgUpload] Failed: /players             → Upload failed (after 3 retries)
🔄 Processing upload queue (3 items)...    → Queue processing started
💾 Cached chunk: leagues_chunk_0 (20 items) → Data cached
📊 [Upload Log] POST /leagues - SUCCESS    → Operation logged
```

---

## ✅ Best Practices

1. **Always enable upload in production:**
   ```typescript
   const uploadEnabled = process.env.NODE_ENV === 'production';
   cacheManager.updateLeaguesCache(data, uploadEnabled);
   ```

2. **Force sync on critical moments:**
   ```typescript
   // Before logout
   await forceUploadSync();
   
   // On page visibility change
   document.addEventListener('visibilitychange', () => {
       if (document.hidden) forceUploadSync();
   });
   ```

3. **Monitor upload health:**
   ```typescript
   setInterval(() => {
       const stats = getCacheAndUploadStats();
       if (stats.failedUploads > 10) {
           console.warn('Too many failed uploads!');
       }
   }, 60000); // Every minute
   ```

4. **Handle errors gracefully:**
   ```typescript
   try {
       await forceUploadSync();
   } catch (error) {
       console.error('Sync failed:', error);
       // Show user notification
   }
   ```

---

## 🔧 Configuration

### Adjust Upload Intervals

```typescript
// In cacheManager.ts
const UPLOAD_INTERVAL = 10000; // 10 seconds

// In chunkCache.ts
const UPLOAD_INTERVAL = 5000;  // 5 seconds

// In apiCache.ts
const UPLOAD_INTERVAL = 5000;  // 5 seconds
```

### Adjust Retry Count

```typescript
// In upload queue
if (upload.retries >= 3) { // Change to 5 for more retries
    // Failed
}
```

### Adjust Batch Size

```typescript
// Process more items at once
const batch = this.queue.splice(0, 5); // Change to 10
```

---

## 🎯 API Reference

### CacheManager

```typescript
interface CacheManager {
    updateLeaguesCache(league: League, upload?: boolean): void;
    updateLeaguesCacheOnJoin(league: League, upload?: boolean): void;
    updatePlayersCache(player: User, upload?: boolean): void;
    updateMatchesCache(match: Match, upload?: boolean): void;
    updateAnyCache<T>(key: string, data: T, merge?: Function, config?: UploadConfig): void;
    forceUpload(): Promise<void>;
    getUploadStatus(): { pending: number; processing: boolean };
}
```

### ChunkCache

```typescript
interface ChunkCacheAPI {
    addCachedItem<T>(resource: string, item: T, upload?: boolean): void;
    updateCachedItem<T>(resource: string, item: T, upload?: boolean): void;
    removeCachedItem(resource: string, id: string, upload?: boolean): void;
    forceUploadSync(): Promise<void>;
    getUploadStatus(): { pending: number; isUploading: boolean };
}
```

### APICache

```typescript
interface APICache {
    set<T>(key: string, data: T, options?: CacheOptions): void;
    update<T>(key: string, data: Partial<T>, upload?: boolean): void;
    delete(key: string, deleteFromServer?: boolean): void;
    syncNow(): Promise<void>;
}
```

---

## 📱 React Hooks Example

```typescript
// Custom hook for cache with upload
function useCacheWithUpload() {
    const [uploadStatus, setUploadStatus] = useState({ pending: 0 });
    
    useEffect(() => {
        const interval = setInterval(() => {
            setUploadStatus(getUploadStatus());
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);
    
    const addToCache = useCallback((resource, item) => {
        addCachedItem(resource, item, true);
    }, []);
    
    const syncNow = useCallback(async () => {
        await forceUploadSync();
    }, []);
    
    return { uploadStatus, addToCache, syncNow };
}

// Usage
function MyComponent() {
    const { uploadStatus, addToCache, syncNow } = useCacheWithUpload();
    
    return (
        <div>
            <p>Pending uploads: {uploadStatus.pending}</p>
            <button onClick={syncNow}>Sync Now</button>
        </div>
    );
}
```

---

**Made with ❤️ for Champion Footballer**
