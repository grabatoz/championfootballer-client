# 🔍 Server Diagnostic & Testing Guide

## Problem: Server Stuck/Not Responding

Yeh script automatically check karega:
- ✅ Server chal raha hai ya nahi
- ✅ Database connected hai
- ✅ Endpoints respond kar rahe hain
- ✅ Cache work kar rahi hai
- ✅ Memory usage normal hai
- ✅ Frontend se match kar raha hai

---

## 🚀 Quick Start

### Windows (PowerShell):

#### Option 1: Quick Test (30 seconds)
```powershell
cd api
.\server-diagnostic.ps1 -Mode test
```

#### Option 2: Full Diagnostics
```powershell
.\server-diagnostic.ps1 -Mode diagnose
```

#### Option 3: Keep-Alive (Continuous)
```powershell
# Local server
.\server-diagnostic.ps1 -ApiUrl "http://localhost:3001"

# VPS server
.\server-diagnostic.ps1 -ApiUrl "https://your-vps-domain.com"
```

### Linux/Mac (Bash):

#### Option 1: Quick Test
```bash
cd api
chmod +x server-diagnostic.sh
./server-diagnostic.sh test
```

#### Option 2: Full Diagnostics
```bash
./server-diagnostic.sh diagnose
```

#### Option 3: Keep-Alive
```bash
# Local
./server-diagnostic.sh

# VPS
export API_URL="https://your-vps-domain.com"
./server-diagnostic.sh
```

---

## 📊 What It Tests

### 1. Health Endpoints
```
GET /health          → Basic health check
GET /ping            → Quick ping
GET /health/detailed → Full diagnostics
GET /               → Root endpoint
```

### 2. Auth Endpoints
```
GET /auth/status    → Auth status
```

### 3. Main API Endpoints
```
GET /leagues        → Leagues list
GET /matches        → Matches list
GET /players        → Players list
GET /leaderboard    → Leaderboard
GET /world-ranking  → World ranking
```

### 4. Cache Performance
```
- First request (cache miss) → Should be 200-500ms
- Second request (cache hit) → Should be 5-50ms
- Speedup calculation
```

### 5. Database Connection
```
- PostgreSQL connection status
- Query test
```

### 6. Memory Usage
```
- Heap used
- Heap total
- Percentage calculation
```

---

## 📋 Output Examples

### ✅ Healthy Server:
```
📊 Health Checks:
Testing Basic health (GET /health)... ✓ OK (200, 25ms)
Testing Quick ping (GET /ping)... ✓ OK (200, 12ms)
Testing Detailed health (GET /health/detailed)... ✓ OK (200, 145ms)

⚽ Main API Endpoints:
Testing Leagues list (GET /leagues)... ✓ OK (200, 234ms)
Testing Matches list (GET /matches)... ✓ OK (200, 189ms)

🔧 Cache & Performance:
First request (cache miss)... 234ms
Second request (cache hit)... 8ms
Cache speedup: 96.6%

💾 Database & Memory:
✓ Database connected
Memory used: 125 MB
Memory total: 512 MB
✓ Memory usage: 24.4%
Server uptime: 45.2 minutes
```

### ❌ Stuck Server:
```
Testing Basic health (GET /health)... ✗ FAIL (timeout)
Testing Quick ping (GET /ping)... ✗ FAIL (connection refused)

✗ Server not responding
Running diagnostics...
```

---

## 🔧 Troubleshooting

### Issue 1: "Connection Refused"
**Reason**: Server is not running
**Fix**:
```bash
# Check if running
pm2 status
# or
ps aux | grep node

# Start server
cd api
npm run dev
# or
pm2 start ecosystem.config.json
```

### Issue 2: "Database connection failed"
**Reason**: PostgreSQL not accessible
**Fix**:
```bash
# Check database
psql -U postgres -d championfootballer -c "SELECT NOW();"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue 3: "Slow responses (>1000ms)"
**Reason**: Database queries not optimized
**Fix**:
```bash
# Apply indexes
psql -U postgres -d championfootballer -f ultra-fast-indexes.sql

# Check query performance
tail -f logs/out.log | grep "SLOW REQUEST"
```

### Issue 4: "High memory usage (>80%)"
**Reason**: Memory leak or too many connections
**Fix**:
```bash
# Restart with PM2
pm2 restart all

# Check memory leak
pm2 monit
```

### Issue 5: "Endpoints don't match frontend"
**Reason**: Route mismatch
**Solution**: Check output:
```
Testing Leagues list (GET /leagues)... ✗ FAIL (404)
```
This means `/leagues` endpoint missing!

**Fix**:
```typescript
// api/src/routes/index.ts
router.use(leaguesRouter.routes());  // ← Make sure this line exists
```

---

## 🎯 Frontend-Backend Matching

The script tests all endpoints that frontend uses:

| Frontend Call | Backend Route | Script Tests |
|--------------|---------------|-------------|
| `leagueAPI.getAll()` | `GET /leagues` | ✅ Yes |
| `matchAPI.getAll()` | `GET /matches` | ✅ Yes |
| `playerAPI.getAll()` | `GET /players` | ✅ Yes |
| `fetchLeaderboard()` | `GET /leaderboard` | ✅ Yes |
| `authAPI.getUserData()` | `GET /auth/data` | ⚠️ Requires token |

**To test authenticated endpoints**:
```powershell
# Get token first
$token = "your-jwt-token"
Invoke-WebRequest -Uri "http://localhost:3001/auth/data" -Headers @{Authorization="Bearer $token"}
```

---

## 📈 Performance Benchmarks

### Good Performance:
```
Health endpoints:     < 50ms  ✅
API endpoints:        < 300ms ✅
Database queries:     < 200ms ✅
Cache hit:           < 20ms  ✅
Memory usage:        < 70%   ✅
```

### Needs Optimization:
```
Health endpoints:     > 100ms  ⚠️
API endpoints:        > 1000ms ⚠️
Database queries:     > 500ms  ⚠️
Cache hit:           > 50ms   ⚠️
Memory usage:        > 80%    ⚠️
```

---

## 🔄 Continuous Monitoring

### Run in Background (Linux):
```bash
# With nohup
nohup ./server-diagnostic.sh > diagnostic.log 2>&1 &

# Check log
tail -f diagnostic.log
```

### Run in Background (Windows):
```powershell
# Start in background
Start-Process powershell -ArgumentList "-File server-diagnostic.ps1" -WindowStyle Hidden

# Check with Task Manager or:
Get-Process powershell | Where-Object {$_.MainWindowTitle -like "*diagnostic*"}
```

### Run with PM2 (Best for VPS):
```bash
# Create PM2 config for diagnostic
pm2 start server-diagnostic.sh --name "server-monitor"
pm2 logs server-monitor
```

---

## 📱 Integration with UptimeRobot

Once diagnostics pass, use UptimeRobot:

1. **Sign up**: https://uptimerobot.com
2. **Add Monitor**:
   - Name: ChampionFootballer API
   - Type: HTTP(s)
   - URL: `https://your-vps.com/ping`
   - Interval: 5 minutes
3. **Alerts**: Email/SMS when down

---

## 🎯 Daily Usage

### Before Deployment:
```bash
./server-diagnostic.sh diagnose
# If all tests pass → Deploy
```

### After Deployment:
```bash
export API_URL="https://your-vps.com"
./server-diagnostic.sh test
# Check all endpoints work
```

### If Server Stuck:
```bash
./server-diagnostic.sh diagnose
# See exactly what's failing
# Fix the specific issue
```

### Continuous Monitoring:
```bash
# Run keep-alive
./server-diagnostic.sh
# Or use PM2 + UptimeRobot
```

---

## 💡 Pro Tips

1. **Run diagnostics before every deployment**
2. **Keep keep-alive running on VPS**
3. **Monitor logs**: `pm2 logs` or `tail -f logs/out.log`
4. **Set up alerts** with UptimeRobot
5. **Check memory weekly**: If >70%, investigate
6. **Apply indexes**: See `ultra-fast-indexes.sql`

---

## ✅ Success Checklist

- [ ] Diagnostic script runs without errors
- [ ] All health checks pass (✓ OK)
- [ ] Database connected
- [ ] Cache working (second request faster)
- [ ] Memory usage < 70%
- [ ] All API endpoints return 200
- [ ] Keep-alive script running
- [ ] UptimeRobot monitoring active
- [ ] PM2 process management configured

**If all checked → Server is production-ready!** 🚀
