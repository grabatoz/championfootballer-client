# 🔄 Match Auto-Refresh Guide

## Problem Solved
Match create hone ke baad wo immediately list mein show nahi hota tha.

## Solution
Ab jab match create ho, automatic event dispatch hota hai jo components ko notify karta hai.

## 🔧 How to Use

### Option 1: Use Hook in Your Component (RECOMMENDED)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { matchAPI } from '@/lib/api-fast';
import { useMatchRefresh } from '@/lib/useMatchRefresh';

export default function MatchListPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch matches
  const fetchMatches = async () => {
    setLoading(true);
    const response = await matchAPI.getAll();
    if (response.matches) {
      setMatches(response.matches);
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, []);

  // 🔥 AUTO-REFRESH: Listen for match-created event
  useMatchRefresh(fetchMatches);

  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <div>
          {matches.map(match => (
            <div key={match.id}>{match.homeTeamName} vs {match.awayTeamName}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Option 2: Manual Event Listener

```typescript
'use client';

import { useEffect } from 'react';

export default function MyComponent() {
  useEffect(() => {
    const handleMatchCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('New match created:', customEvent.detail.match);
      
      // Refresh your data here
      fetchMatches();
    };

    window.addEventListener('match-created', handleMatchCreated);

    return () => {
      window.removeEventListener('match-created', handleMatchCreated);
    };
  }, []);

  // Rest of your component...
}
```

### Option 3: For All Match Operations

```typescript
import { useMatchRefresh, useMatchUpdateRefresh } from '@/lib/useMatchRefresh';

export default function MatchComponent() {
  const fetchMatches = async () => {
    // Your fetch logic
  };

  // Listen for create events
  useMatchRefresh(fetchMatches);
  
  // Listen for update/delete events
  useMatchUpdateRefresh(fetchMatches);

  // Rest of component...
}
```

## 📢 Events Dispatched

### 1. match-created
Triggered when new match is created:
```typescript
window.dispatchEvent(new CustomEvent('match-created', { 
  detail: { 
    match: newMatch,
    leagueId: 'league-123' 
  } 
}));
```

### 2. match-updated
Triggered when match is updated:
```typescript
window.dispatchEvent(new CustomEvent('match-updated', { 
  detail: { 
    match: updatedMatch,
    matchId: 'match-123' 
  } 
}));
```

### 3. match-deleted
Triggered when match is deleted:
```typescript
window.dispatchEvent(new CustomEvent('match-deleted', { 
  detail: { 
    matchId: 'match-123' 
  } 
}));
```

## 🎯 What Happens Now

### When You Create a Match:
1. ✅ Match saved to database
2. ✅ Server cache updated
3. ✅ Client cache cleared (memory + localStorage)
4. ✅ Event dispatched to all listening components
5. ✅ Components automatically refresh
6. ✅ **New match visible immediately!**

### Console Output:
```
🗑️ Match caches cleared after creation
✨ New match created: abc-123
📢 match-created event dispatched
🔄 Match created event received: {match: {...}, leagueId: '...'}
🔄 Refreshing match list...
```

## 🧪 Testing

1. **Create Match**: 
   - Open match list page
   - Create new match
   - ✅ Should appear immediately without refresh

2. **Update Match**:
   - Edit existing match
   - ✅ Changes visible immediately

3. **Delete Match**:
   - Delete a match
   - ✅ Removed from list immediately

## 🔍 Debugging

### Check if events are working:
```javascript
// In browser console
window.addEventListener('match-created', (e) => {
  console.log('Event received!', e.detail);
});

// Create a match and see if event fires
```

### Check cache status:
```javascript
// In browser console
Object.keys(localStorage).filter(k => k.includes('match'))
// Should be empty after match create
```

## ✅ Files Modified

1. **src/lib/api-fast.ts** - Added event dispatching
2. **src/lib/useMatchRefresh.ts** - NEW hook for auto-refresh
3. **MATCH-AUTO-REFRESH-GUIDE.md** - This guide

## 🎉 Benefits

✅ **Instant Updates**: No manual refresh needed
✅ **Real-time**: All components sync automatically  
✅ **Clean Code**: Use simple hooks
✅ **Type-Safe**: Full TypeScript support
✅ **Event-Driven**: Follows React best practices

---

**Updated**: November 1, 2025  
**Status**: ✅ WORKING
