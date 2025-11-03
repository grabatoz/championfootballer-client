# 📦 Chunk-Based Caching - Usage Guide

## Kya hai ye?

Ab data **chunks (टुकड़ों) में save** hota hai aur **progressively load** hota hai. Matlab:
- Pehla chunk instantly dikhe ga (0ms)
- Baaki chunks background me aate rahenge
- UI smooth aur fast rahe ga

## 🚀 Features

### 1. **Automatic Chunking**
Data automatically 50 items ke chunks me divide ho jata hai:
```
100 leagues = 2 chunks (50 + 50)
250 players = 5 chunks (50 × 5)
```

### 2. **Progressive Loading**
```typescript
// Pehla chunk instant (0ms)
// Baaki chunks background me
for (const chunk of leagueAPI.getAllChunked()) {
  // Har chunk aate hi render karo
  renderLeagues(chunk);
}
```

### 3. **localStorage Persistence**
```
cf_instant_cache         → Regular instant cache
cf_instant_cache_chunked → Chunked data
```

## 📖 Usage Examples

### Leagues - Chunked Loading

```typescript
'use client';
import { leagueAPI } from '@/lib/api-ultra-fast';
import { useEffect, useState } from 'react';

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // METHOD 1: Progressive chunked loading (smooth UI)
    const loadChunked = () => {
      const chunks = [];
      for (const chunk of leagueAPI.getAllChunked()) {
        chunks.push(...chunk);
        setLeagues([...chunks]); // Update UI with each chunk
      }
      setLoading(false);
    };

    // METHOD 2: Get all at once (faster but blocks)
    const loadAll = async () => {
      const response = await leagueAPI.getAll();
      setLeagues(response.leagues);
      setLoading(false);
    };

    // METHOD 3: Instant from cache (0ms)
    const instant = leagueAPI.getAllInstant();
    if (instant.length > 0) {
      setLeagues(instant);
      setLoading(false);
    } else {
      loadAll();
    }

    // Choose method based on your needs:
    // loadChunked(); // Best for large lists
    // loadAll();     // Best for small lists
    loadAll();        // Fetch fresh + cache in chunks
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {leagues.map(league => (
        <div key={league.id}>{league.name}</div>
      ))}
    </div>
  );
}
```

### Matches - Progressive Rendering

```typescript
import { matchAPI } from '@/lib/api-ultra-fast';

function MatchList({ leagueId }: { leagueId: string }) {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    // Progressive loading - UI updates with each chunk
    const loadMatches = async () => {
      await matchAPI.getByLeague(leagueId); // Fetch and cache

      // Now load chunks progressively
      const chunks = [];
      for (const chunk of matchAPI.getByLeagueChunked(leagueId)) {
        chunks.push(...chunk);
        setMatches([...chunks]); // Smooth incremental rendering
      }
    };

    loadMatches();
  }, [leagueId]);

  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

### Players - Instant + Background Update

```typescript
import { playerAPI } from '@/lib/api-ultra-fast';

function PlayerList() {
  const [players, setPlayers] = useState<User[]>([]);

  useEffect(() => {
    // Load progressively from chunks
    const loadPlayers = async () => {
      // Fetch fresh data (auto-saves in chunks)
      await playerAPI.getAll();

      // Render chunks progressively
      const accumulated: User[] = [];
      for (const chunk of playerAPI.getAllChunked()) {
        accumulated.push(...chunk);
        setPlayers([...accumulated]);
      }
    };

    loadPlayers();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {players.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
```

## ⚡ Performance Benefits

### Before (No Chunking):
```
API call → Wait for all data → Parse → Render
         ↓
    800ms delay
```

### After (With Chunking):
```
API call → First chunk (0ms from cache) → Render
         ↓
      Background: More chunks → Progressive render
                  ↓
              Smooth UI!
```

## 🎯 Best Practices

### 1. **Use Instant Cache First**
```typescript
// ✅ Good - Show cached data immediately
const cached = leagueAPI.getAllInstant();
if (cached.length > 0) {
  setLeagues(cached);
}
// Then fetch fresh in background
leagueAPI.getAll();
```

### 2. **Progressive Loading for Large Lists**
```typescript
// ✅ Good for 100+ items
for (const chunk of playerAPI.getAllChunked()) {
  addToList(chunk); // Smooth rendering
}

// ❌ Not for small lists (< 50 items)
// Just use: playerAPI.getAll()
```

### 3. **Invalidate Cache on Changes**
```typescript
// After creating/updating/deleting
leagueAPI.invalidateCache(); // Clears both instant + chunked
```

## 📊 Cache Storage

### localStorage Structure:
```json
{
  "cf_instant_cache": {
    "leagues_all": { "data": {...}, "expires": 1699000000 }
  },
  "cf_instant_cache_chunked": {
    "leagues_chunked": {
      "chunks": [
        [league1, league2, ...], // Chunk 1
        [league51, league52, ...] // Chunk 2
      ],
      "totalItems": 100,
      "isComplete": true
    }
  }
}
```

## 🔧 Customization

### Change Chunk Size:
```typescript
// In api-ultra-fast.ts
const CHUNK_SIZE = 50; // Default
// Change to 20 for smaller chunks (more updates)
// Change to 100 for larger chunks (fewer updates)
```

## 🎉 Summary

- ✅ **Instant loading** - 0ms from cache
- ✅ **Progressive rendering** - Smooth UI
- ✅ **Automatic chunking** - No manual work
- ✅ **localStorage persistence** - Works offline
- ✅ **Background updates** - Always fresh data

**Bas itna yaad rakho:**
```typescript
// Fast instant load
const data = leagueAPI.getAllInstant();

// Progressive chunks
for (const chunk of leagueAPI.getAllChunked()) {
  render(chunk);
}

// Fresh + cache
await leagueAPI.getAll();
```

Enjoy the speed! 🚀
