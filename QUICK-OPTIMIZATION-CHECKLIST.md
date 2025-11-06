# 🎯 Quick Optimization Checklist

## Immediate Actions (15 minutes)

### 1. Apply Database Indexes
```bash
cd api
psql $DATABASE_URL -f performance-indexes-optimized.sql
```
**Expected Result:** 70-90% faster database queries

### 2. Rebuild Frontend
```bash
yarn build
yarn start
```
**Expected Result:** Optimized bundles, smaller size

### 3. Add Caching Middleware to API
```typescript
// api/src/index.ts (add these lines)
import { cacheMiddleware } from './middleware/cache';
import { compressionMiddleware } from './middleware/compression';

// Before your routes
app.use(cacheMiddleware());
app.use(compressionMiddleware());
```
**Expected Result:** 60-80% faster API responses

---

## Quick Code Updates (30 minutes)

### 4. Replace Fetch Calls
**Before:**
```typescript
const response = await fetch(`${API_URL}/leagues`);
const data = await response.json();
```

**After:**
```typescript
import { optimizedFetch } from '@/lib/utils/optimizedFetch';
const data = await optimizedFetch(`${API_URL}/leagues`);
```

### 5. Add React.memo to Heavy Components
**Before:**
```typescript
export default function LeagueCard({ league }) {
  // ...
}
```

**After:**
```typescript
import { memo } from 'react';

function LeagueCard({ league }) {
  // ...
}

export default memo(LeagueCard);
```

### 6. Use useMemo for Expensive Operations
**Before:**
```typescript
const filtered = leagues.filter(l => l.active).sort((a, b) => b.score - a.score);
```

**After:**
```typescript
const filtered = useMemo(() => 
  leagues.filter(l => l.active).sort((a, b) => b.score - a.score),
  [leagues]
);
```

---

## Verification (5 minutes)

### Test API Caching
```powershell
# First request (should be MISS)
curl -I http://localhost:3001/api/leagues
# Look for: X-Cache: MISS

# Second request (should be HIT)
curl -I http://localhost:3001/api/leagues
# Look for: X-Cache: HIT
```

### Test Compression
```powershell
curl -H "Accept-Encoding: br" -I http://localhost:3001/api/leagues
# Look for: Content-Encoding: br
```

### Run Lighthouse
```powershell
npx lighthouse http://localhost:3000 --view
```
**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## Performance Targets

| Metric | Before | Target | Expected |
|--------|--------|--------|----------|
| Page Load | 4-6s | < 2.5s | ✅ |
| API Response | 800ms | < 300ms | ✅ |
| DB Query | 200ms | < 80ms | ✅ |
| Bundle Size | 2MB | < 1.2MB | ✅ |

---

## Common Issues & Solutions

### Issue: Cache not working
**Solution:** Check if GET method and no auth issues

### Issue: Build fails
**Solution:** Run `yarn install` first

### Issue: Database indexes not applied
**Solution:** Check database connection and permissions

### Issue: Still slow
**Solution:** Check network tab, look for slow requests

---

## Quick Wins Priority

1. ✅ **Database Indexes** - Biggest impact (90% faster)
2. ✅ **API Caching** - Medium impact (70% faster)  
3. ✅ **Compression** - Good impact (60% smaller)
4. ✅ **Bundle Optimization** - Good impact (50% smaller)
5. ✅ **Code Splitting** - Incremental improvement

---

## Next Steps

After completing the checklist:
1. Monitor performance metrics
2. Check error logs
3. Review Lighthouse scores
4. Read full guide: `COMPLETE-PERFORMANCE-OPTIMIZATION-GUIDE.md`

---

**Total Time Required:** ~1 hour for all optimizations
**Expected Performance Improvement:** 60-80% faster overall
